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
// LANGUAGE: UI text is Bangla + English via useLanguage(). Scores
// and percentages use Western digits (the existing result-page
// convention); dates follow the selected language (bn-BD / en-GB).

import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { loginState } from '../lib/loginReturn';
import { PageShell } from '../components/PageShell';
import { AlertBox, Card, LinkButton, ProgressBar, Skeleton } from '../components/ui';
import { useAuth } from '../lib/auth';
import { useLanguage } from '../i18n/LanguageContext';
import { JOB_PRACTICE_RESULT_LABEL, JOB_PRACTICE_RESULT_LABEL_EN } from '../lib/jobEngine';
import { listJobAttempts } from '../lib/jobPractice';
import { listMockAttempts } from '../lib/jobMock';
import { jobExamBySlug } from '../lib/jobExams';
import {
  attemptSummaryFromStored,
  attemptTrend,
  correctVsWrongTime,
  displayPercentage,
  formatDuration,
  groupAttemptsByExam,
  timeManagementSummary,
  topicMasteryOverTime,
  type JobAttemptSummary,
} from '../lib/jobAnalysis';

const MUTED = '#68747B';
const PAGE_SIZE = 10;

function formatDate(millis: number | null, lang: 'bn' | 'en'): string {
  if (millis === null) return lang === 'bn' ? 'তারিখ নেই' : 'No date';
  return new Date(millis).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-GB', {
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
  const { t, lang } = useLanguage();
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
  const timeSummary = useMemo(() => timeManagementSummary(attempts ?? [], lang), [attempts, lang]);
  const cwTime = useMemo(
    () => correctVsWrongTime(attempts?.flatMap((a) => a.answers) ?? []),
    [attempts],
  );

  if (loading) {
    return (
      <PageShell titleBn="ফলাফল বিশ্লেষণ" titleEn="Result Analysis" wide>
        <Skeleton />
      </PageShell>
    );
  }

  if (!user) {
    return (
      <PageShell titleBn="ফলাফল বিশ্লেষণ" titleEn="Result Analysis" wide>
        <Card>
          <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 17 }}>{t({ bn: 'বিশ্লেষণ দেখতে লগইন করুন', en: 'Log in to see the analysis' })}</div>
          <p style={{ margin: '8px 0 12px', color: MUTED, fontSize: 14, lineHeight: 1.7 }}>
            {t({ bn: 'বিশ্লেষণ শুধু লগইন করা শিক্ষার্থীরা দেখতে পারে।', en: 'Analysis is only visible to logged-in students.' })}
          </p>
          <Link to="/login" state={back} style={{ fontWeight: 600 }}>{t({ bn: 'লগইন করুন →', en: 'Log in →' })}</Link>
        </Card>
      </PageShell>
    );
  }

  const visible = attempts?.slice(0, visibleCount) ?? [];
  const hasMore = (attempts?.length ?? 0) > visibleCount;

  return (
    <PageShell titleBn="ফলাফল বিশ্লেষণ" titleEn="Result Analysis" wide maxWidth={1240}>
      {/* BINDING label — every result/analysis page carries it. */}
      <AlertBox tone="info">{lang === 'bn' ? JOB_PRACTICE_RESULT_LABEL : JOB_PRACTICE_RESULT_LABEL_EN}</AlertBox>
      <p style={{ margin: '12px 0 0', color: MUTED, fontSize: 14, lineHeight: 1.7 }}>
        {t({ bn: 'এখানে শুধু আপনার নিজের মক ও অনুশীলনের ফলাফল বিশ্লেষণ করা হয়েছে — অন্য কোনো শিক্ষার্থীর সঙ্গে তুলনা করা হয়নি।', en: 'Only your own mock and practice results are analysed here — nothing is compared with any other student.' })}
      </p>

      {attempts === null ? (
        <p style={{ marginTop: 16, color: MUTED, fontSize: 14 }}>{t({ bn: 'লোড হচ্ছে…', en: 'Loading…' })}</p>
      ) : attempts.length === 0 ? (
        <Card style={{ marginTop: 16 }}>
          <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 17 }}>{t({ bn: 'এখনো কোনো মক/অনুশীলন দেওয়া হয়নি', en: 'No mock or practice taken yet' })}</div>
          <p style={{ margin: '8px 0 12px', color: MUTED, fontSize: 14, lineHeight: 1.7 }}>
            {t({ bn: 'মক বা অনুশীলন দিলে এখানে আপনার ফলাফলের ইতিহাস, অগ্রগতি, টপিক অনুযায়ী দক্ষতা ও সময়ের বিশ্লেষণ দেখাবে।', en: 'Once you take a mock or practice, your result history, progress, per-topic mastery and time analysis will show here.' })}
          </p>
          <LinkButton to="/jobs/common" variant="accent">
            {t({ bn: 'কমন প্রস্তুতি দেখুন →', en: 'See common preparation →' })}
          </LinkButton>
        </Card>
      ) : (
        <>
          {/* ChatGPT §5: anchor nav inside the detailed analysis —
              সারাংশ / বিষয় / সময় / ইতিহাস — so the page is never
              one endless scroll on a budget phone. */}
          <nav
            aria-label={t({ bn: 'বিশ্লেষণ বিভাগ', en: 'Analysis sections' })}
            style={{ position: 'sticky', top: 0, zIndex: 5, background: '#fff', borderBottom: '1px solid #E3E8EF', display: 'flex', gap: 16, padding: '10px 4px', marginTop: 16, overflowX: 'auto' }}
          >
            <a href="#summary" style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{t({ bn: 'সারাংশ', en: 'Summary' })}</a>
            <a href="#topics" style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{t({ bn: 'বিষয়', en: 'Topics' })}</a>
            <a href="#time" style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{t({ bn: 'সময়', en: 'Time' })}</a>
            <a href="#history" style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{t({ bn: 'ইতিহাস', en: 'History' })}</a>
          </nav>

          {/* Trends — best vs latest, own past only, PER EXAM. */}
          <div id="summary" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginTop: 16, alignItems: 'start' }}>
            {examGroups.map((group) => {
              const groupMocks = group.attempts.filter((a) => a.kind === 'mock');
              const groupPractices = group.attempts.filter((a) => a.kind === 'practice');
              const mockTrend = attemptTrend(groupMocks, 'মক', lang);
              const practiceTrend = attemptTrend(groupPractices, 'অনুশীলন', lang);
              const examName = lang === 'bn' ? (jobExamBySlug(group.examSlug)?.bn ?? group.examSlug) : (jobExamBySlug(group.examSlug)?.en ?? group.examSlug);
              return (
                <Card key={group.examSlug}>
                  <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 17 }}>{t({ bn: `${examName} — অগ্রগতি`, en: `${examName} — progress` })}</div>
                  {groupMocks.length > 0 ? (
                    <>
                      <p style={{ margin: '8px 0', color: '#142B3B', fontSize: 14, lineHeight: 1.7 }}>{mockTrend.sentence}</p>
                      <p style={{ margin: '0 0 8px', color: MUTED, fontSize: 14 }}>
                        {t({ bn: `মক — সর্বশেষ ${mockTrend.latestPercent}% · সেরা ${mockTrend.bestPercent}% · মোট ${mockTrend.count}টি`, en: `Mock — latest ${mockTrend.latestPercent}% · best ${mockTrend.bestPercent}% · total ${mockTrend.count}` })}
                      </p>
                      <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
                        {groupMocks.slice(0, 5).map((a) => (
                          <div key={a.docId}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: MUTED }}>
                              <span>{formatDate(a.submittedAtMillis, lang)}</span>
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
                        {t({ bn: `অনুশীলন — সর্বশেষ ${practiceTrend.latestPercent}% · সেরা ${practiceTrend.bestPercent}% · মোট ${practiceTrend.count}টি`, en: `Practice — latest ${practiceTrend.latestPercent}% · best ${practiceTrend.bestPercent}% · total ${practiceTrend.count}` })}
                      </p>
                      <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
                        {groupPractices.slice(0, 5).map((a) => (
                          <div key={a.docId}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: MUTED }}>
                              <span>{formatDate(a.submittedAtMillis, lang)}</span>
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
            <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 17, marginBottom: 4 }}>{t({ bn: 'টপিক অনুযায়ী দক্ষতা', en: 'Topic mastery' })}</div>
            <p style={{ margin: '0 0 8px', color: MUTED, fontSize: 13, lineHeight: 1.7 }}>
              {t({ bn: 'প্রথমবার বনাম সর্বশেষ — শুধু আপনার নিজের অনুশীলন ও মকের তথ্য।', en: 'First attempt vs latest — only your own practice and mock data.' })}
            </p>
            {mastery.length === 0 ? (
              <p style={{ margin: 0, color: MUTED, fontSize: 14 }}>{t({ bn: 'টপিক অনুযায়ী তথ্য এখনো নেই।', en: 'No per-topic data yet.' })}</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, lineHeight: 1.7 }}>
                  <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '2px solid #E3E8EF', color: MUTED }}>
                      <th style={{ padding: '6px 8px' }}>{t({ bn: 'টপিক', en: 'Topic' })}</th>
                      <th style={{ padding: '6px 8px' }}>{t({ bn: 'প্রথম', en: 'First' })}</th>
                      <th style={{ padding: '6px 8px' }}>{t({ bn: 'সর্বশেষ', en: 'Latest' })}</th>
                      <th style={{ padding: '6px 8px' }}>{t({ bn: 'পরিবর্তন', en: 'Change' })}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mastery.map((m) => (
                      <tr key={m.topicId} style={{ borderBottom: '1px solid #EEF1F5' }}>
                        <td style={{ padding: '6px 8px', fontWeight: 600, color: '#142B3B' }}>{lang === 'bn' ? m.label : m.labelEn}</td>
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
            <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 17, marginBottom: 8 }}>{t({ bn: 'সময় ব্যবস্থাপনা', en: 'Time management' })}</div>
            <p style={{ margin: '0 0 8px', color: '#142B3B', fontSize: 14, lineHeight: 1.7 }}>
              {t({ bn: `গড়ে প্রতি প্রশ্নে ${Math.round(timeSummary.avgTimePerQuestion)} সেকেন্ড (${timeSummary.totalQuestions}টি প্রশ্নের ওপর)।`, en: `On average ${Math.round(timeSummary.avgTimePerQuestion)} seconds per question (over ${timeSummary.totalQuestions} questions).` })}
            </p>
            {cwTime.wrongCount > 0 && cwTime.correctCount > 0 ? (
              <p style={{ margin: '0 0 8px', color: '#142B3B', fontSize: 14, lineHeight: 1.7 }}>
                {t({ bn: `ভুল উত্তরে গড়ে ${Math.round(cwTime.avgWrongSeconds)} সেকেন্ড, সঠিক উত্তরে গড়ে ${Math.round(cwTime.avgCorrectSeconds)} সেকেন্ড — তবে সময় একা বিচার নয়, কঠিন প্রশ্নে সময় বেশি লাগা স্বাভাবিক।`, en: `Wrong answers took ${Math.round(cwTime.avgWrongSeconds)} seconds on average, correct answers ${Math.round(cwTime.avgCorrectSeconds)} seconds — but time alone is not the judge; hard questions naturally take longer.` })}
              </p>
            ) : null}
            {timeSummary.slowestTopic ? (
              <p style={{ margin: '0 0 8px', color: '#142B3B', fontSize: 14, lineHeight: 1.7 }}>
                {t({ bn: `সবচেয়ে ধীর টপিক: ${timeSummary.slowestTopic.label} — গড় ${Math.round(timeSummary.slowestTopic.avgTimeSeconds)} সেকেন্ড/প্রশ্ন।`, en: `Slowest topic: ${timeSummary.slowestTopic.labelEn} — ${Math.round(timeSummary.slowestTopic.avgTimeSeconds)} sec/question on average.` })}
              </p>
            ) : null}
            {timeSummary.fastestTopic ? (
              <p style={{ margin: '0 0 8px', color: '#142B3B', fontSize: 14, lineHeight: 1.7 }}>
                {t({ bn: `সবচেয়ে দ্রুত টপিক: ${timeSummary.fastestTopic.label} — গড় ${Math.round(timeSummary.fastestTopic.avgTimeSeconds)} সেকেন্ড/প্রশ্ন।`, en: `Fastest topic: ${timeSummary.fastestTopic.labelEn} — ${Math.round(timeSummary.fastestTopic.avgTimeSeconds)} sec/question on average.` })}
              </p>
            ) : null}
            <p style={{ margin: 0, color: '#142B3B', fontSize: 14, lineHeight: 1.7 }}>{timeSummary.unansweredSentence}</p>
          </Card>
          </div>

          {/* Attempt history — newest first, paged. */}
          <div id="history">
          <Card style={{ marginTop: 16 }}>
            <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 17, marginBottom: 8 }}>
              {t({ bn: `ফলাফলের ইতিহাস (${attempts.length}টি)`, en: `Result history (${attempts.length})` })}
            </div>
            <div style={{ display: 'grid', gap: 12 }}>
              {visible.map((a) => (
                <div key={a.docId} style={{ border: '1px solid #E3E8EF', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', fontSize: 14 }}>
                    <span style={{ color: '#142B3B' }}>
                      <strong>{a.kind === 'mock' ? t({ bn: 'মক', en: 'Mock' }) : t({ bn: 'অনুশীলন', en: 'Practice' })}</strong>
                      {' · '}
                      {lang === 'bn' ? (jobExamBySlug(a.examSlug)?.bn ?? a.examSlug) : (jobExamBySlug(a.examSlug)?.en ?? a.examSlug)}
                      {' · '}
                      {formatDate(a.submittedAtMillis, lang)}
                    </span>
                    <Link to={`/jobs/result/${a.docId}`} style={{ fontWeight: 600 }}>
                      {t({ bn: 'ফলাফল দেখুন →', en: 'See result →' })}
                    </Link>
                  </div>
                  <div style={{ marginTop: 6, fontSize: 14, color: MUTED }}>
                    {t({ bn: `${a.score} / ${a.totalMarks} নম্বর · ${displayPercentage(a.percentage)}% · ${a.correctCount}টি সঠিক · ${a.wrongCount}টি ভুল`, en: `${a.score} / ${a.totalMarks} marks · ${displayPercentage(a.percentage)}% · ${a.correctCount} correct · ${a.wrongCount} wrong` })}
                    {a.unansweredCount > 0 ? t({ bn: ` · ${a.unansweredCount}টি উত্তর দেওয়া হয়নি`, en: ` · ${a.unansweredCount} unanswered` }) : ''}
                    {' · '}{t({ bn: 'সময়', en: 'Time' })} {formatDuration(a.timeSpentSeconds, lang)}
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
                {t({ bn: `আরও দেখুন (${attempts.length - visibleCount}টি বাকি)`, en: `Show more (${attempts.length - visibleCount} left)` })}
              </button>
            ) : null}
          </Card>
          </div>
        </>
      )}

      <p style={{ marginTop: 20 }}>
        <Link to="/jobs/dashboard" style={{ fontWeight: 600 }}>{t({ bn: '← আমার চাকরির ড্যাশবোর্ড', en: '← My job dashboard' })}</Link>
      </p>
    </PageShell>
  );
}
