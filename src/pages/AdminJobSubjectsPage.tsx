// Eduvelto — Admin: subject & topic management
// (design §5.1 #3, #5, §5.2).
//
// /admin/jobs/subjects — the 15 canonical subjects
// (jobContent.ts JOB_BANK_SUBJECTS) + the syllabus coverage
// matrix (jobCoverage.ts: verified topic count vs the
// COMMON_TOPIC_QUESTION_TARGET, per exam). An honest empty state
// at 0 verified topics: a subject with no verified topics is
// shown as "coverage 0 — not started", never as a guessed
// percentage. Topic CRUD is code + verified content first —
// no topic is invented here.

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { db } from '../firebase';
import { useLanguage } from '../i18n/LanguageContext';
import { AlertBox, Card } from '../components/ui';
import { EmptyAdminBox, LoadingBox } from '../components/AdminShared';
import { JOB_BANK_SUBJECTS } from '../lib/jobContent';
import type { JobBankCoverageRow } from '../lib/jobBankStats';
import { ADMIN_JOBS_COUNT_CAP } from '../lib/jobAdminJobs';

export default function AdminJobSubjectsPage() {
  const { t } = useLanguage();
  const [rows, setRows] = useState<JobBankCoverageRow[] | null>(null);
  const [error, setError] = useState(false);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let alive = true;
    setRows(null);
    setError(false);
    (async () => {
      if (!db) {
        if (alive) setRows([]);
        return;
      }
      // jobBankCoverage docs: one JobBankCoverageRow per
      // exam-subject cell (written by the coverage recompute).
      // Capped read; invalid docs are skipped, never guessed.
      const snap = await getDocs(query(collection(db, 'jobBankCoverage'), limit(ADMIN_JOBS_COUNT_CAP)));
      const out: JobBankCoverageRow[] = [];
      for (const d of snap.docs) {
        const data = d.data() as Record<string, unknown>;
        if (typeof data.examId !== 'string' || typeof data.subjectId !== 'string') continue;
        if (typeof data.verified !== 'number' || typeof data.target !== 'number') continue;
        out.push({
          examId: data.examId,
          subjectId: data.subjectId,
          target: data.target,
          verified: data.verified,
          reviewed: typeof data.reviewed === 'number' ? data.reviewed : 0,
          draft: typeof data.draft === 'number' ? data.draft : 0,
          coveragePct: typeof data.coveragePct === 'number' ? data.coveragePct : null,
          missingTopics: Array.isArray(data.missingTopics) ? (data.missingTopics as string[]) : [],
          thinTopics: Array.isArray(data.thinTopics) ? (data.thinTopics as string[]) : [],
          hasVerifiedTopicList: data.hasVerifiedTopicList === true,
          lastCalculated: typeof data.lastCalculated === 'string' ? data.lastCalculated : '',
        });
      }
      if (alive) setRows(out);
    })().catch(() => {
      if (alive) setError(true);
    });
    return () => {
      alive = false;
    };
  }, [nonce]);

  return (
    <div>
      <h1 className="ev-admin-page-title">{t({ bn: 'বিষয় ও টপিক ব্যবস্থাপনা', en: 'Subject & Topic Management' })}</h1>
      <p className="ev-admin-note">
        {t({
          bn: '১৫টি নির্দিষ্ট বিষয় (ক্যাননিক্যাল তালিকা) — বিষয় নতুন করে তৈরি করা যায় না, শুধু টপিক যোগ/যাচাই করা যায়। যাচাই হয়নি এমন টপিক কভারেজে ধরা হয় না।',
          en: '15 canonical subjects — a subject cannot be invented here, only topics added/verified. Unverified topics do not count toward coverage.',
        })}
      </p>

      <h2 style={{ fontSize: 16, margin: '16px 0 8px' }}>
        {t({ bn: 'নির্দিষ্ট বিষয় (১৫টি)', en: 'Canonical subjects (15)' })}
      </h2>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {JOB_BANK_SUBJECTS.map((subjectId) => (
          <span
            key={subjectId}
            style={{
              padding: '6px 12px',
              borderRadius: 999,
              border: '1px solid var(--line)',
              fontSize: 13,
            }}
          >
            {subjectId}
          </span>
        ))}
      </div>

      <h2 style={{ fontSize: 16, margin: '16px 0 8px' }}>
        {t({ bn: 'সিলেবাস কভারেজ ম্যাট্রিক্স', en: 'Syllabus coverage matrix' })}
      </h2>
      {error ? (
        <AlertBox tone="error" onRetry={() => setNonce((x) => x + 1)}>
          {t({ bn: 'তথ্য লোড করা যায়নি। আবার চেষ্টা করুন।', en: 'Could not load the data. Try again.' })}
        </AlertBox>
      ) : rows === null ? (
        <LoadingBox />
      ) : rows.length === 0 ? (
        <EmptyAdminBox
          bn="এখনো কোনো কভারেজ তথ্য নেই — ০টি যাচাইকৃত টপিক। কভারেজ পুনঃগণনা চালানোর পর এখানে দেখা যাবে।"
          en="No coverage data yet — 0 verified topics. It will appear here after the coverage recompute runs."
        />
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {rows.map((row) => (
            <Card key={`${row.examId}__${row.subjectId}`}>
              <strong style={{ fontSize: 15 }}>
                {row.examId} · {row.subjectId}
              </strong>
              <div style={{ fontSize: 14, marginTop: 4 }}>
                {row.coveragePct === null
                  ? t({ bn: 'কভারেজ: যাচাইকৃত টপিকের তালিকা নেই', en: 'Coverage: no verified topic list' })
                  : t({ bn: `কভারেজ: ${row.coveragePct}% (যাচাইকৃত ${row.verified} / লক্ষ্য ${row.target})`, en: `Coverage: ${row.coveragePct}% (verified ${row.verified} / target ${row.target})` })}
                {row.missingTopics.length > 0 ? ` · ${t({ bn: 'অনুপস্থিত টপিক', en: 'missing topics' })}: ${row.missingTopics.join(', ')}` : ''}
                {row.thinTopics.length > 0 ? ` · ${t({ bn: 'পাতলা টপিক (১–২টি প্রশ্ন)', en: 'thin topics (1–2 questions)' })}: ${row.thinTopics.join(', ')}` : ''}
              </div>
            </Card>
          ))}
        </div>
      )}
      <p style={{ marginTop: 16 }}>
        <Link to="/admin/jobs">{t({ bn: '← চাকরি ব্যবস্থাপনা', en: '← Job Management' })}</Link>
      </p>
    </div>
  );
}
