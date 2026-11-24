// Eduvelto — Job Preparation analysis page (Step 10).
//
// /jobs/analysis — the student's OWN attempt history, trends,
// topic mastery over time and time-management summary. READ-ONLY:
// it lists the student's own jobAttempts + jobExamAttempts
// (owner-read rules; no new rule, no new write) and computes
// everything from the stored docs via src/lib/jobAnalysis.
//
// HONESTY (Steps 7–9, binding): JOB_PRACTICE_RESULT_LABEL on the
// page; trends compare with the student's OWN past attempts only
// — no percentiles, no ranks, no peer comparison, no official
// pass. Empty states say plainly that no mock/practice has been
// taken yet; no fake data, no invented benchmarks. Simple
// horizontal bars + summary cards only (Gemini #2 — no charts
// that turn unreadable on budget Android).
//
// LANGUAGE: all UI text is Bangla (one-language rule). Scores
// and percentages use Western digits (the existing result-page
// convention); dates use Bangla digits (bn-BD locale).

import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { loginState } from '../lib/loginReturn';
import { PageShell } from '../components/PageShell';
import { AlertBox, Card, LinkButton, ProgressBar, Skeleton } from '../components/ui';
import { useAuth } from '../lib/auth';
import { JOB_PRACTICE_RESULT_LABEL } from '../lib/jobEngine';
import { listJobAttempts } from '../lib/jobPractice';
import { listMockAttempts } from '../lib/jobMock';
import { jobExamBySlug } from '../lib/jobExams';
import {
  attemptSummaryFromStored,
  attemptTrend,
  correctVsWrongTime,
  displayPercentage,
  formatDurationBn,
  groupAttemptsByExam,
  timeManagementSummary,
  topicMasteryOverTime,
  type JobAttemptSummary,
} from '../lib/jobAnalysis';

const MUTED = '#68747B';
const PAGE_SIZE = 10;

function formatDateBn(millis: number | null): string {
  if (millis === null) return 'তারিখ নেই';
  return new Date(millis).toLocaleDateString('bn-BD', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function JobAnalysisPage() {
  const { user, loading } = useAuth();
  const location = useLocation();
  // Sections audit (24 Nov 2026): return here after sign-in.
  const back = loginState(location.pathname + location.search);
  const [attempts, setAttempts] = useState<JobAttemptSummary[] | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    if (!user) {
      setAttempts([]);
      return;
    }
    let alive = true;
    Promise.all([listJobAttempts(user.uid, 50), listMockAttempts(user.uid, 50)])
      .then(([practice, mocks]) => {
        if (!alive) return;
        const all = [
          ...practice.map((a) => attemptSummaryFromStored(a.docId, a)),
          ...mocks.map((a) => attemptSummaryFromStored(a.docId, a)),
        ].sort(
          (a, b) =>
            (b.submittedAtMillis ?? 0) - (a.submittedAtMillis ?? 0) ||
            (a.docId < b.docId ? -1 : 1),
        );
        setAttempts(all);
      })
      .catch(() => {
        if (alive) setAttempts([]);
      });
    return () => {
      alive = false;
    };
  }, [user?.uid]);

  // ChatGPT §2D: trends are computed PER EXAM — a 100-question
  // BCS mock is never trended against a 20-question practice
  // bundle. Each exam group gets its own mock + practice trend.
  const examGroups = useMemo(() => groupAttemptsByExam(attempts ?? []), [attempts]);
  const mastery = useMemo(() => topicMasteryOverTime(attempts ?? []), [attempts]);
  const timeSummary = useMemo(() => timeManagementSummary(attempts ?? []), [attempts]);
  const cwTime = useMemo(
    () => correctVsWrongTime(attempts?.flatMap((a) => a.answers) ?? []),
    [attempts],
  );

  if (loading) {
    return (
      <PageShell titleBn="ফলাফল বিশ্লেষণ" titleEn="ফলাফল বিশ্লেষণ" wide>
        <Skeleton />
      </PageShell>
    );
  }

  if (!user) {
    return (
      <PageShell titleBn="ফলাফল বিশ্লেষণ" titleEn="ফলাফল বিশ্লেষণ" wide>
        <Card>
          <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 17 }}>বিশ্লেষণ দেখতে লগইন করুন</div>
          <p style={{ margin: '8px 0 12px', color: MUTED, fontSize: 14, lineHeight: 1.7 }}>
            বিশ্লেষণ শুধু লগইন করা শিক্ষার্থীরা দেখতে পারে।
          </p>
          <Link to="/login" state={back} style={{ fontWeight: 600 }}>লগইন করুন →</Link>
        </Card>
      </PageShell>
    );
  }

  const visible = attempts?.slice(0, visibleCount) ?? [];
  const hasMore = (attempts?.length ?? 0) > visibleCount;

  return (
    <PageShell titleBn="ফলাফল বিশ্লেষণ" titleEn="ফলাফল বিশ্লেষণ" wide maxWidth={1240}>
      {/* BINDING label — every result/analysis page carries it. */}
      <AlertBox tone="info">{JOB_PRACTICE_RESULT_LABEL}</AlertBox>
      <p style={{ margin: '12px 0 0', color: MUTED, fontSize: 14, lineHeight: 1.7 }}>
        এখানে শুধু আপনার নিজের মক ও অনুশীলনের ফলাফল বিশ্লেষণ করা হয়েছে — অন্য কোনো শিক্ষার্থীর সঙ্গে তুলনা করা হয়নি।
      </p>

      {attempts === null ? (
        <p style={{ marginTop: 16, color: MUTED, fontSize: 14 }}>লোড হচ্ছে…</p>
      ) : attempts.length === 0 ? (
        <Card style={{ marginTop: 16 }}>
          <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 17 }}>এখনো কোনো মক/অনুশীলন দেওয়া হয়নি</div>
          <p style={{ margin: '8px 0 12px', color: MUTED, fontSize: 14, lineHeight: 1.7 }}>
            মক বা অনুশীলন দিলে এখানে আপনার ফলাফলের ইতিহাস, অগ্রগতি, টপিক অনুযায়ী দক্ষতা ও সময়ের বিশ্লেষণ দেখাবে।
          </p>
          <LinkButton to="/jobs/common" variant="accent">
            কমন প্রস্তুতি দেখুন →
          </LinkButton>
        </Card>
      ) : (
        <>
          {/* ChatGPT §5: anchor nav inside the detailed analysis —
              সারাংশ / বিষয় / সময় / ইতিহাস — so the page is never
              one endless scroll on a budget phone. */}
          <nav
            aria-label="বিশ্লেষণ বিভাগ"
            style={{ position: 'sticky', top: 0, zIndex: 5, background: '#fff', borderBottom: '1px solid #E3E8EF', display: 'flex', gap: 16, padding: '10px 4px', marginTop: 16, overflowX: 'auto' }}
          >
            <a href="#summary" style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>সারাংশ</a>
            <a href="#topics" style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>বিষয়</a>
            <a href="#time" style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>সময়</a>
            <a href="#history" style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>ইতিহাস</a>
          </nav>

          {/* Trends — best vs latest, own past only, PER EXAM. */}
          <div id="summary" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginTop: 16, alignItems: 'start' }}>
            {examGroups.map((group) => {
              const groupMocks = group.attempts.filter((a) => a.kind === 'mock');
              const groupPractices = group.attempts.filter((a) => a.kind === 'practice');
              const mockTrend = attemptTrend(groupMocks, 'মক');
              const practiceTrend = attemptTrend(groupPractices, 'অনুশীলন');
              const examName = jobExamBySlug(group.examSlug)?.bn ?? group.examSlug;
              return (
                <Card key={group.examSlug}>
                  <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 17 }}>{examName} — অগ্রগতি</div>
                  {groupMocks.length > 0 ? (
                    <>
                      <p style={{ margin: '8px 0', color: '#142B3B', fontSize: 14, lineHeight: 1.7 }}>{mockTrend.sentence}</p>
                      <p style={{ margin: '0 0 8px', color: MUTED, fontSize: 14 }}>
                        মক — সর্বশেষ {mockTrend.latestPercent}% · সেরা {mockTrend.bestPercent}% · মোট {mockTrend.count}টি
                      </p>
                      <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
                        {groupMocks.slice(0, 5).map((a) => (
                          <div key={a.docId}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: MUTED }}>
                              <span>{formatDateBn(a.submittedAtMillis)}</span>
                              <span>{displayPercentage(a.percentage)}%</span>
                            </div>
                            <ProgressBar value={displayPercentage(a.percentage)} />
                          </div>
                        ))}
                      </div>
                    </>
                  ) : null}
                  {groupPractices.length > 0 ? (
                    <>
                      <p style={{ margin: '8px 0', color: '#142B3B', fontSize: 14, lineHeight: 1.7 }}>{practiceTrend.sentence}</p>
                      <p style={{ margin: '0 0 8px', color: MUTED, fontSize: 14 }}>
                        অনুশীলন — সর্বশেষ {practiceTrend.latestPercent}% · সেরা {practiceTrend.bestPercent}% · মোট {practiceTrend.count}টি
                      </p>
                      <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
                        {groupPractices.slice(0, 5).map((a) => (
                          <div key={a.docId}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: MUTED }}>
                              <span>{formatDateBn(a.submittedAtMillis)}</span>
                              <span>{displayPercentage(a.percentage)}%</span>
                            </div>
                            <ProgressBar value={displayPercentage(a.percentage)} />
                          </div>
                        ))}
                      </div>
                    </>
                  ) : null}
                </Card>
              );
            })}
          </div>

          {/* Topic mastery over time — practice data only. */}
          <div id="topics">
          <Card style={{ marginTop: 16 }}>
            <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 17, marginBottom: 4 }}>টপিক অনুযায়ী দক্ষতা</div>
            <p style={{ margin: '0 0 8px', color: MUTED, fontSize: 13, lineHeight: 1.7 }}>
              প্রথমবার বনাম সর্বশেষ — শুধু আপনার নিজের অনুশীলন ও মকের তথ্য।
            </p>
            {mastery.length === 0 ? (
              <p style={{ margin: 0, color: MUTED, fontSize: 14 }}>টপিক অনুযায়ী তথ্য এখনো নেই।</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, lineHeight: 1.7 }}>
                  <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '2px solid #E3E8EF', color: MUTED }}>
                      <th style={{ padding: '6px 8px' }}>টপিক</th>
                      <th style={{ padding: '6px 8px' }}>প্রথম</th>
                      <th style={{ padding: '6px 8px' }}>সর্বশেষ</th>
                      <th style={{ padding: '6px 8px' }}>পরিবর্তন</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mastery.map((m) => (
                      <tr key={m.topicId} style={{ borderBottom: '1px solid #EEF1F5' }}>
                        <td style={{ padding: '6px 8px', fontWeight: 600, color: '#142B3B' }}>{m.label}</td>
                        <td style={{ padding: '6px 8px' }}>{m.firstAccuracy}%</td>
                        <td style={{ padding: '6px 8px' }}>{m.latestAccuracy}%</td>
                        <td style={{ padding: '6px 8px', fontWeight: 700, color: m.delta > 0 ? '#12766E' : m.delta < 0 ? '#B00020' : MUTED }}>
                          {m.delta > 0 ? `+${m.delta}%` : `${m.delta}%`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
          </div>

          {/* Time management. */}
          <div id="time">
          <Card style={{ marginTop: 16 }}>
            <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 17, marginBottom: 8 }}>সময় ব্যবস্থাপনা</div>
            <p style={{ margin: '0 0 8px', color: '#142B3B', fontSize: 14, lineHeight: 1.7 }}>
              গড়ে প্রতি প্রশ্নে {Math.round(timeSummary.avgTimePerQuestion)} সেকেন্ড ({timeSummary.totalQuestions}টি প্রশ্নের ওপর)।
            </p>
            {cwTime.wrongCount > 0 && cwTime.correctCount > 0 ? (
              <p style={{ margin: '0 0 8px', color: '#142B3B', fontSize: 14, lineHeight: 1.7 }}>
                ভুল উত্তরে গড়ে {Math.round(cwTime.avgWrongSeconds)} সেকেন্ড, সঠিক উত্তরে গড়ে {Math.round(cwTime.avgCorrectSeconds)} সেকেন্ড — তবে সময় একা বিচার নয়, কঠিন প্রশ্নে সময় বেশি লাগা স্বাভাবিক।
              </p>
            ) : null}
            {timeSummary.slowestTopic ? (
              <p style={{ margin: '0 0 8px', color: '#142B3B', fontSize: 14, lineHeight: 1.7 }}>
                সবচেয়ে ধীর টপিক: {timeSummary.slowestTopic.label} — গড় {Math.round(timeSummary.slowestTopic.avgTimeSeconds)} সেকেন্ড/প্রশ্ন।
              </p>
            ) : null}
            {timeSummary.fastestTopic ? (
              <p style={{ margin: '0 0 8px', color: '#142B3B', fontSize: 14, lineHeight: 1.7 }}>
                সবচেয়ে দ্রুত টপিক: {timeSummary.fastestTopic.label} — গড় {Math.round(timeSummary.fastestTopic.avgTimeSeconds)} সেকেন্ড/প্রশ্ন।
              </p>
            ) : null}
            <p style={{ margin: 0, color: '#142B3B', fontSize: 14, lineHeight: 1.7 }}>{timeSummary.unansweredSentence}</p>
          </Card>
          </div>

          {/* Attempt history — newest first, paged. */}
          <div id="history">
          <Card style={{ marginTop: 16 }}>
            <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 17, marginBottom: 8 }}>
              ফলাফলের ইতিহাস ({attempts.length}টি)
            </div>
            <div style={{ display: 'grid', gap: 12 }}>
              {visible.map((a) => (
                <div key={a.docId} style={{ border: '1px solid #E3E8EF', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', fontSize: 14 }}>
                    <span style={{ color: '#142B3B' }}>
                      <strong>{a.kind === 'mock' ? 'মক' : 'অনুশীলন'}</strong>
                      {' · '}
                      {jobExamBySlug(a.examSlug)?.bn ?? a.examSlug}
                      {' · '}
                      {formatDateBn(a.submittedAtMillis)}
                    </span>
                    <Link to={`/jobs/result/${a.docId}`} style={{ fontWeight: 600 }}>
                      ফলাফল দেখুন →
                    </Link>
                  </div>
                  <div style={{ marginTop: 6, fontSize: 14, color: MUTED }}>
                    {a.score} / {a.totalMarks} নম্বর · {displayPercentage(a.percentage)}% · {a.correctCount}টি সঠিক · {a.wrongCount}টি ভুল
                    {a.unansweredCount > 0 ? ` · ${a.unansweredCount}টি উত্তর দেওয়া হয়নি` : ''}
                    {' · '}সময় {formatDurationBn(a.timeSpentSeconds)}
                  </div>
                </div>
              ))}
            </div>
            {hasMore ? (
              <button
                type="button"
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                style={{ marginTop: 12, border: '1px solid #C9D2E0', background: '#fff', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 600, color: '#142B3B' }}
              >
                আরও দেখুন ({attempts.length - visibleCount}টি বাকি)
              </button>
            ) : null}
          </Card>
          </div>
        </>
      )}

      <p style={{ marginTop: 20 }}>
        <Link to="/jobs/dashboard" style={{ fontWeight: 600 }}>← আমার চাকরির ড্যাশবোর্ড</Link>
      </p>
    </PageShell>
  );
}
