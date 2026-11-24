// Eduvelto — Admin: results & analytics
// (design §5.1 #12, §4).
//
// /admin/jobs/results — AGGREGATES ONLY. What admin can see:
// written-submission counts by status (moderator-readable) and
// coverage gaps from jobBankCoverage. What admin CANNOT see:
// individual students' answers, names or ranks — practice and
// mock sessions live in the student's own subcollection
// (users/{uid}/jobSessions), so attempt-level aggregates belong
// to the student's own dashboard (subjectHealth / liveExamReport)
// and are never listed here. No percentiles, no leaderboards.

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { db } from '../firebase';
import { useLanguage } from '../i18n/LanguageContext';
import { AlertBox, Card } from '../components/ui';
import { EmptyAdminBox, LoadingBox } from '../components/AdminShared';
import { ADMIN_JOBS_COUNT_CAP } from '../lib/jobAdminJobs';

interface ResultsSummary {
  submissionsTotal: number;
  submissionsSubmitted: number;
  submissionsSelfChecked: number;
  submissionsFeedbackGiven: number;
  coverageGaps: string[];
  capped: boolean;
}

export default function AdminJobResultsPage() {
  const { t } = useLanguage();
  const [summary, setSummary] = useState<ResultsSummary | null>(null);
  const [error, setError] = useState(false);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let alive = true;
    setSummary(null);
    setError(false);
    (async () => {
      if (!db) {
        if (alive) setSummary({ submissionsTotal: 0, submissionsSubmitted: 0, submissionsSelfChecked: 0, submissionsFeedbackGiven: 0, coverageGaps: [], capped: false });
        return;
      }
      const [subs, coverage] = await Promise.all([
        getDocs(query(collection(db, 'writtenSubmissions'), limit(ADMIN_JOBS_COUNT_CAP))),
        getDocs(query(collection(db, 'jobBankCoverage'), limit(ADMIN_JOBS_COUNT_CAP))),
      ]);
      const out: ResultsSummary = {
        submissionsTotal: 0,
        submissionsSubmitted: 0,
        submissionsSelfChecked: 0,
        submissionsFeedbackGiven: 0,
        coverageGaps: [],
        capped: subs.docs.length >= ADMIN_JOBS_COUNT_CAP || coverage.docs.length >= ADMIN_JOBS_COUNT_CAP,
      };
      for (const d of subs.docs) {
        const data = d.data() as Record<string, unknown>;
        out.submissionsTotal++;
        if (data.status === 'submitted') out.submissionsSubmitted++;
        else if (data.status === 'self-checked') out.submissionsSelfChecked++;
        else if (data.status === 'feedback-given') out.submissionsFeedbackGiven++;
      }
      for (const d of coverage.docs) {
        const data = d.data() as Record<string, unknown>;
        if (typeof data.examId !== 'string' || typeof data.subjectId !== 'string') continue;
        const missing = Array.isArray(data.missingTopics) ? (data.missingTopics as string[]) : [];
        for (const topic of missing) out.coverageGaps.push(`${data.examId}/${data.subjectId}/${topic}`);
      }
      if (alive) setSummary(out);
    })().catch(() => {
      if (alive) setError(true);
    });
    return () => {
      alive = false;
    };
  }, [nonce]);

  return (
    <div>
      <h1 className="ev-admin-page-title">{t({ bn: 'ফলাফল ও বিশ্লেষণ', en: 'Results & Analytics' })}</h1>
      <p className="ev-admin-note">
        {t({
          bn: 'শুধু সমষ্টিগত তথ্য। কোনো শিক্ষার্থীর উত্তর, নাম বা র‌্যাংক এখানে দেখা যায় না — প্রচেষ্টা-ভিত্তিক তথ্য শিক্ষার্থীর নিজের ড্যাশবোর্ডে থাকে, অ্যাডমিনের কাছে নয়।',
          en: "Aggregates only. No student's answers, name or rank appear here — attempt-level data lives in the student's own dashboard, never with admin.",
        })}
      </p>
      {error ? (
        <AlertBox tone="error" onRetry={() => setNonce((x) => x + 1)}>
          {t({ bn: 'তথ্য লোড করা যায়নি। আবার চেষ্টা করুন।', en: 'Could not load the data. Try again.' })}
        </AlertBox>
      ) : summary === null ? (
        <LoadingBox />
      ) : summary.submissionsTotal === 0 && summary.coverageGaps.length === 0 ? (
        <EmptyAdminBox
          bn="এখনো কোনো লিখিত জমা বা কভারেজ-ফাঁক নেই — ফলাফল দেখাতে কোনো তথ্য নেই।"
          en="No written submissions or coverage gaps yet — there is no data to show."
        />
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          <Card>
            <strong style={{ fontSize: 15 }}>
              {t({ bn: 'লিখিত জমা (সব মিলিয়ে)', en: 'Written submissions (total)' })}
            </strong>
            <div style={{ fontSize: 14, marginTop: 6 }}>
              {t({
                bn: `মোট: ${summary.submissionsTotal}${summary.capped ? '+' : ''} · জমা: ${summary.submissionsSubmitted} · নিজে যাচাই: ${summary.submissionsSelfChecked} · ফিডব্যাক দেওয়া: ${summary.submissionsFeedbackGiven}`,
                en: `Total: ${summary.submissionsTotal}${summary.capped ? '+' : ''} · Submitted: ${summary.submissionsSubmitted} · Self-checked: ${summary.submissionsSelfChecked} · Feedback given: ${summary.submissionsFeedbackGiven}`,
              })}
            </div>
          </Card>
          {summary.coverageGaps.length > 0 ? (
            <Card>
              <strong style={{ fontSize: 15 }}>
                {t({ bn: 'কভারেজ-ফাঁক (যাচাইকৃত প্রশ্ন নেই এমন টপিক)', en: 'Coverage gaps (topics with no verified question)' })}
              </strong>
              <div style={{ fontSize: 14, marginTop: 6 }}>
                {summary.coverageGaps.slice(0, 20).join(' · ')}
                {summary.coverageGaps.length > 20 ? ` · +${summary.coverageGaps.length - 20}` : ''}
              </div>
            </Card>
          ) : null}
        </div>
      )}
      <p style={{ marginTop: 16 }}>
        <Link to="/admin/jobs">{t({ bn: '← চাকরি ব্যবস্থাপনা', en: '← Job Management' })}</Link>
      </p>
    </div>
  );
}
