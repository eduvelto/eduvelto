// Eduvelto — Job practice result page (Step 8, extended Step 10).
//
// /jobs/result/:attemptId — reads the submitted attempt doc
// (owner, or Moderator via ?uid=…). The attempt stores the
// correct answer text per question, so this page NEVER re-reads
// the answer key (QuizResultPage pattern).
//
// Step 10: score breakdown with the negative-marking formula in
// plain Bangla, per-topic accuracy table, time per question
// (+ time×accuracy bucket) and per subject, weak-topic action
// badges + practice links, and Slow / By-Topic review filters
// — all computed from the STORED attempt via src/lib/jobAnalysis
// (pure, read-only).
//
// BINDING (Step 2 §2.7, Step 7 fold-in P0-02): the label
// "অনুশীলন ফলাফল — নিয়োগ পরীক্ষার ফল নয়" is shown on every
// result page. Client-side scores are NEVER "Verified".
// percentage is stored as the real (possibly negative) number;
// the display clamps at 0 — the stored value is not changed.
//
// Step 13: a wrong-answers session lands here with location
// state { fromWrongAnswers, clearedCount, clearedQuestionIds }
// — the banner below names the questions that just cleared
// (2 consecutive correct), and the Next Steps card links back
// to the notebook. The old "re-runs the whole bundle" note
// above is superseded: /jobs/wrong-answers/practice/:topicId
// now runs a real subset session.
//
// LANGUAGE: bilingual Bangla + English (24 Nov 2026 language system).
// Translations use `tr` (not `t`) because the TopicStat callbacks
// below already use `t` as their loop variable.

import { useEffect, useState } from 'react';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { loginState } from '../lib/loginReturn';
import { PageShell } from '../components/PageShell';
import { AlertBox, Card, LinkButton, ProgressBar, Skeleton } from '../components/ui';
import { useAuth } from '../lib/auth';
import { useLanguage } from '../i18n/LanguageContext';
import { JOB_PRACTICE_RESULT_LABEL, JOB_PRACTICE_RESULT_LABEL_EN, jobTopicLabel } from '../lib/jobEngine';
import {
  ANSWER_TIME_BUCKET_BN,
  ANSWER_TIME_BUCKET_EN,
  TOPIC_ACTION_BADGE_BN,
  TOPIC_ACTION_BADGE_EN,
  TOPIC_LEVEL_BN,
  TOPIC_LEVEL_EN,
  attemptSummaryFromStored,
  classifyAnswerTime,
  correctVsWrongTime,
  formatDuration,
  isSlowAnswer,
  negativeMarkingExplanation,
  perSubjectTime,
  perTopicAccuracy,
  resultObservation,
  topicActionBadge,
  topicLevel,
  weakTopicPracticeLink,
} from '../lib/jobAnalysis';
import {
  loadBundleKey,
  loadJobAttempt,
  loadJobSession,
  loadPracticeBundle,
  type PracticeBundleWithId,
} from '../lib/jobPractice';
import { loadMock, loadMockAttempt, loadMockBundle, loadMockKey, loadMockSession } from '../lib/jobMock';
import type { JobMockWithId } from '../lib/jobMocks';
import type { JobMockSessionDoc, JobPracticeSessionDoc } from '../lib/jobEngine';
import type { JobQuestionKey, JobBundleQuestion } from '../lib/jobQuestions';
import { jobBundleQuestionById } from '../lib/jobQuestions';

type Filter = 'all' | 'correct' | 'wrong' | 'unanswered' | 'slow';

interface AttemptAnswer {
  n: number;
  questionId: string;
  topicId: string;
  subjectId: string;
  selected: 'A' | 'B' | 'C' | 'D' | null;
  correct: boolean;
  marks: number;
  correctText: string | null;
  timeSpentSeconds: number;
}

const CORRECT = '#12766E';
const WRONG = '#B00020';
const MUTED = '#68747B';

export default function JobResultPage() {
  const { attemptId = '' } = useParams<{ attemptId: string }>();
  const { t: tr, lang } = useLanguage();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  // Sections audit (24 Nov 2026): return here after sign-in.
  const back = loginState(location.pathname + location.search);
  const { user, profile } = useAuth();
  // Step 13: a wrong-answers session passes
  // { fromWrongAnswers, clearedCount, clearedQuestionIds } —
  // the banner names the questions that just cleared the
  // notebook (2 consecutive correct). Absent for normal
  // practice/mock results; nothing renders then.
  const fromWrongAnswers = (location.state as { fromWrongAnswers?: boolean; clearedCount?: number } | null)?.fromWrongAnswers === true;
  const clearedCount = (location.state as { clearedCount?: number } | null)?.clearedCount ?? 0;

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [attempt, setAttempt] = useState<Record<string, unknown> | null>(null);
  const [session, setSession] = useState<JobPracticeSessionDoc | JobMockSessionDoc | null>(null);
  const [bundle, setBundle] = useState<PracticeBundleWithId | null>(null);
  const [key, setKey] = useState<JobQuestionKey | null>(null);
  const [mockDef, setMockDef] = useState<JobMockWithId | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [topicFilter, setTopicFilter] = useState<string>('all');

  const isModerator = profile?.role === 'moderator' || profile?.role === 'admin' || profile?.role === 'owner';
  const ownerUid = searchParams.get('uid') || user?.uid || '';

  useEffect(() => {
    if (!ownerUid || !attemptId) {
      setLoading(false);
      setNotFound(true);
      return;
    }
    let alive = true;
    (async () => {
      try {
        // Step 9: a mock attempt lives in jobExamAttempts, a
        // practice attempt in jobAttempts — try the exam
        // collection first, then the practice one.
        const mockAttempt = await loadMockAttempt(ownerUid, attemptId).catch(() => null);
        const a = mockAttempt ?? (await loadJobAttempt(ownerUid, attemptId));
        if (!alive) return;
        if (!a) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        setAttempt(a);
        const isMock = a.kind === 'mock';
        const [s, b, k] = await Promise.all([
          isMock
            ? loadMockSession(ownerUid, attemptId).catch(() => null)
            : loadJobSession(ownerUid, attemptId).catch(() => null),
          typeof a.bundleId === 'string'
            ? (isMock ? loadMockBundle(a.bundleId) : loadPracticeBundle(a.bundleId)).catch(() => null)
            : Promise.resolve(null),
          // Step 9: a mock key is receipt-gated (fresh exam_review
          // receipt, 10 minutes after submit) — after the window
          // it reads null, and the page renders from the STORED
          // attempt (correctText per answer) with an honest note.
          typeof a.bundleId === 'string'
            ? (isMock ? loadMockKey(a.bundleId) : loadBundleKey(a.bundleId)).catch(() => null)
            : Promise.resolve(null),
        ]);
        if (!alive) return;
        setSession(s);
        setBundle(b);
        setKey(k);
        if (isMock && s && typeof (s as unknown as Record<string, unknown>).definitionId === 'string') {
          const def = await loadMock((s as unknown as Record<string, unknown>).definitionId as string).catch(() => null);
          if (!alive) return;
          setMockDef(def);
        }
        setLoading(false);
      } catch {
        if (!alive) return;
        setNotFound(true);
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [ownerUid, attemptId]);

  if (loading) {
    return (
      <PageShell titleBn="ফলাফল" titleEn="Result" wide>
        <Skeleton />
      </PageShell>
    );
  }

  if (!user) {
    return (
      <PageShell titleBn="ফলাফল" titleEn="Result" wide>
        <Card>
          <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 17 }}>{tr({ bn: 'ফলাফল দেখতে লগইন করুন', en: 'Log in to see the result' })}</div>
          <p style={{ margin: '8px 0 12px', color: MUTED, fontSize: 14, lineHeight: 1.7 }}>
            {tr({ bn: 'ফলাফল শুধু লগইন করা শিক্ষার্থীরা দেখতে পারে।', en: 'Only logged-in students can see results.' })}
          </p>
          <Link to="/login" state={back} style={{ fontWeight: 600 }}>{tr({ bn: 'লগইন করুন →', en: 'Log in →' })}</Link>
        </Card>
      </PageShell>
    );
  }

  if (notFound || !attempt) {
    return (
      <PageShell titleBn="ফলাফল" titleEn="Result" wide>
        <AlertBox tone="error">{tr({ bn: 'এই ফলাফলটি পাওয়া যায়নি — হয় ঠিকানাটি ভুল, নয় এটি আপনার ফলাফল নয়।', en: 'This result was not found — either the address is wrong, or this is not your result.' })}</AlertBox>
        <p style={{ marginTop: 16 }}>
          <Link to="/jobs" style={{ fontWeight: 600 }}>{tr({ bn: '← সব পরীক্ষা দেখুন', en: '← See all exams' })}</Link>
        </p>
      </PageShell>
    );
  }

  const answers = (attempt.answers as AttemptAnswer[] | undefined) ?? [];
  const score = typeof attempt.score === 'number' ? attempt.score : 0;
  const totalMarks = typeof attempt.totalMarks === 'number' ? attempt.totalMarks : 0;
  const negativeDeduction = typeof attempt.negativeDeduction === 'number' ? attempt.negativeDeduction : 0;
  const correctCount = typeof attempt.correctCount === 'number' ? attempt.correctCount : 0;
  const wrongCount = typeof attempt.wrongCount === 'number' ? attempt.wrongCount : 0;
  const unansweredCount = typeof attempt.unansweredCount === 'number' ? attempt.unansweredCount : 0;
  const accuracy = typeof attempt.accuracy === 'number' ? attempt.accuracy : 0;
  const percentage = typeof attempt.percentage === 'number' ? attempt.percentage : 0;
  const displayPercentage = Math.max(0, percentage);
  const timeSpentSeconds = typeof attempt.timeSpentSeconds === 'number' ? attempt.timeSpentSeconds : 0;
  const bundleId = typeof attempt.bundleId === 'string' ? attempt.bundleId : '';
  const examSlug = typeof attempt.examSlug === 'string' ? attempt.examSlug : '';
  // Step 9: mock attempts carry kind 'mock' and their session
  // stores the definition doc-ID (the retake target + the
  // passPercent source).
  const isMockAttempt = attempt.kind === 'mock';
  const mockDefinitionId =
    session && 'definitionId' in session && typeof session.definitionId === 'string' ? session.definitionId : '';
  const mockPassPercent =
    mockDef && mockDef.rulesSnapshot.passPercent !== null ? mockDef.rulesSnapshot.passPercent : null;
  const mockPassed = mockPassPercent !== null && percentage >= mockPassPercent;
  // Step 8 fold-in (ChatGPT finding 2): when the attempt was scored
  // with NO negative marking (Bank — penalty unverified, disabled),
  // say so on the result instead of showing a "−0" deduction as if
  // a penalty had applied. Older attempts without the field render
  // the old deduction line (defensive fallback).
  const negativeMarkingUsed = typeof attempt.negativeMarkingUsed === 'number' ? attempt.negativeMarkingUsed : null;
  const negativeMarkingDisabled = negativeMarkingUsed === 0;

  // Step 10: analysis over the STORED attempt (never a re-read
  // of the key) — per-topic accuracy/time, the negative-marking
  // formula, and the weak-topic practice links.
  const summary = attemptSummaryFromStored(attemptId, attempt);
  const marking = negativeMarkingExplanation(summary, lang);
  const topicStats = perTopicAccuracy(answers);
  const subjectTimes = perSubjectTime(answers);
  const cwTime = correctVsWrongTime(answers);
  // ChatGPT §2A/§3: weakest first — lead with the first
  // priority, not the biggest topic.
  const topicStatsWeakestFirst = [...topicStats].sort(
    (a, b) => a.accuracy - b.accuracy || b.wrong - a.wrong || (a.topicId < b.topicId ? -1 : 1),
  );
  const perAnswerAvgSeconds =
    answers.length > 0
      ? answers.reduce((s, a) => s + (typeof a.timeSpentSeconds === 'number' ? a.timeSpentSeconds : 0), 0) / answers.length
      : 0;
  const slowCount = answers.filter((a) => isSlowAnswer(a.timeSpentSeconds ?? 0, perAnswerAvgSeconds)).length;
  // Mock time allowed (mock definition's duration) — shown next
  // to the time taken so the score never stands bare (Gemini #2).
  const mockAllowedMinutes =
    isMockAttempt && mockDef ? mockDef.rulesSnapshot.timeMinutes : null;

  // Weak topics: from the stored answers (wrong per topic).
  const weakTopics = topicStats.filter((t) => t.wrong > 0);
  // 1st priority = the weakest topic by accuracy (not the
  // biggest topic with a wrong answer).
  const weakestTopic = topicStatsWeakestFirst.find((t) => t.wrong > 0) ?? null;

  const filtered = answers.filter((a) => {
    if (topicFilter !== 'all' && a.topicId !== topicFilter) return false;
    if (filter === 'correct') return a.selected !== null && a.correct;
    if (filter === 'wrong') return a.selected !== null && !a.correct;
    if (filter === 'unanswered') return a.selected === null;
    if (filter === 'slow') return isSlowAnswer(a.timeSpentSeconds ?? 0, perAnswerAvgSeconds);
    return true;
  });

  // Step 8 fold-in (finding 5): the question text comes from the
  // ATTEMPT's own answer snapshot (its questionId), never from a
  // bundle position — a mode-ordered session's n is not the bundle
  // order, and a rebuilt bundle must never rewrite history.
  const questionText = (a: { n: number; questionId: string }): string => {
    const q: JobBundleQuestion | undefined = bundle
      ? jobBundleQuestionById(bundle.questions, a.questionId)
      : undefined;
    return q?.questionText ?? (lang === 'bn' ? `প্রশ্ন ${a.n}` : `Question ${a.n}`);
  };

  const markedSet = new Set<number>();
  if (session) {
    for (const [k, v] of Object.entries(session.answers)) {
      if (v.markedForReview) markedSet.add(Number(k));
    }
  }

  const filterButton = (f: Filter, label: string) => (
    <button
      key={f}
      type="button"
      onClick={() => setFilter(f)}
      aria-pressed={filter === f}
      style={{
        border: filter === f ? '2px solid #0A1F44' : '1px solid #C9D2E0',
        background: filter === f ? '#E8EFFA' : '#fff',
        borderRadius: 8,
        padding: '6px 12px',
        cursor: 'pointer',
        fontWeight: 600,
        color: '#142B3B',
      }}
    >
      {label}
    </button>
  );

  return (
    <PageShell titleBn="ফলাফল" titleEn="Result" wide maxWidth={1240}>
      {/* BINDING label — every result page carries it. */}
      <AlertBox tone="info">{lang === 'bn' ? JOB_PRACTICE_RESULT_LABEL : JOB_PRACTICE_RESULT_LABEL_EN}</AlertBox>

      {/* Step 13: just cleared from the wrong-answer notebook. */}
      {fromWrongAnswers && clearedCount > 0 ? (
        <AlertBox tone="ok">
          {tr({ bn: `নোটবুক থেকে সরানো হয়েছে — ${clearedCount}টি প্রশ্ন পরপর ২ বার সঠিক হয়েছে।`, en: `${clearedCount} question(s) cleared from the notebook — correct twice in a row.` })}{' '}
          <Link to="/jobs/wrong-answers" style={{ fontWeight: 700 }}>
            {tr({ bn: 'ভুল-উত্তর নোটবুক দেখুন →', en: 'See the wrong-answer notebook →' })}
          </Link>
        </AlertBox>
      ) : null}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginTop: 16, alignItems: 'start' }}>
        <Card>
          <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 17 }}>{tr({ bn: 'সারাংশ', en: 'Summary' })}</div>
          <div style={{ fontSize: 34, fontWeight: 800, color: '#142B3B', marginTop: 8 }}>
            {score}
            <span style={{ fontSize: 16, color: MUTED, fontWeight: 600 }}> / {totalMarks} {tr({ bn: 'নম্বর', en: 'marks' })}</span>
          </div>
          <div style={{ marginTop: 8 }}>
            <ProgressBar value={displayPercentage} />
            <div style={{ fontSize: 13, color: MUTED, marginTop: 4 }}>{displayPercentage}%</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12, fontSize: 14 }}>
            <div><span style={{ color: CORRECT, fontWeight: 700 }}>✓ {tr({ bn: 'সঠিক:', en: 'Correct:' })}</span> {correctCount}{lang === 'bn' ? 'টি' : ''}</div>
            <div><span style={{ color: WRONG, fontWeight: 700 }}>✗ {tr({ bn: 'ভুল:', en: 'Wrong:' })}</span> {wrongCount}{lang === 'bn' ? 'টি' : ''}</div>
            <div><span style={{ color: MUTED, fontWeight: 700 }}>○ {tr({ bn: 'উত্তর দেওয়া হয়নি:', en: 'Unanswered:' })}</span> {unansweredCount}{lang === 'bn' ? 'টি' : ''}</div>
            <div><span style={{ fontWeight: 700 }}>{tr({ bn: 'নির্ভুলতা:', en: 'Accuracy:' })}</span> {accuracy}%</div>
            {negativeMarkingDisabled ? (
              <div><span style={{ fontWeight: 700 }}>{tr({ bn: 'নেগেটিভ মার্কিং:', en: 'Negative marking:' })}</span> {tr({ bn: 'বন্ধ — বিজ্ঞপ্তি যাচাই বাকি', en: 'Off — notice verification pending' })}</div>
            ) : (
              <div><span style={{ fontWeight: 700 }}>{tr({ bn: 'নেগেটিভ মার্কিংয়ে কাটা:', en: 'Deducted for negative marking:' })}</span> −{negativeDeduction}</div>
            )}
            <div><span style={{ fontWeight: 700 }}>{tr({ bn: 'সময়:', en: 'Time:' })}</span> {formatDuration(timeSpentSeconds, lang)}{mockAllowedMinutes !== null ? (lang === 'bn' ? ` (নির্ধারিত ${mockAllowedMinutes} মিনিট)` : ` (allowed ${mockAllowedMinutes} min)`) : ''}</div>
            <div><span style={{ fontWeight: 700 }}>{tr({ bn: 'প্রশ্ন:', en: 'Questions:' })}</span> {answers.length}{lang === 'bn' ? 'টি' : ''}</div>
          </div>
          {/* Step 10: score breakdown — the formula in plain
              Bangla + what the wrong answers actually cost
              (Gemini #1/#3). The score never stands bare: the
              question count, marking rule and time taken sit
              with it. */}
          <div style={{ marginTop: 12, background: '#F4F7FA', borderRadius: 8, padding: '10px 12px', fontSize: 14, lineHeight: 1.8 }}>
            <div style={{ fontWeight: 700, color: '#142B3B' }}>{tr({ bn: 'নম্বর ভাঙন', en: 'Score breakdown' })}</div>
            <div>{marking.formula}</div>
            {marking.costLine ? <div style={{ color: WRONG, fontWeight: 600 }}>{marking.costLine}</div> : null}
            {/* ChatGPT §1: never show one percentage unexplained —
                the marks % is after negative marking; the accuracy
                % is correct ÷ attempted. */}
            <div style={{ color: MUTED }}>
              {tr({ bn: `নম্বর = নেগেটিভ মার্কিংয়ের পরের চূড়ান্ত নম্বর; সঠিক উত্তরের হার (${accuracy}%) = সঠিক ÷ উত্তর দেওয়া প্রশ্ন।`, en: `Score = final marks after negative marking; accuracy (${accuracy}%) = correct ÷ answered questions.` })}
            </div>
            {/* ChatGPT §3: the three-second summary, generated
                from this attempt's actual data. */}
            <div style={{ color: '#142B3B', fontWeight: 600 }}>{resultObservation(summary, lang)}</div>
            {negativeMarkingDisabled ? (
              <div style={{ color: MUTED }}>{tr({ bn: 'নেগেটিভ মার্কিং বন্ধ — বিজ্ঞপ্তি যাচাই বাকি, তাই ভুল উত্তরে নম্বর কাটা হয়নি।', en: 'Negative marking is off — notice verification pending, so no marks were cut for wrong answers.' })}</div>
            ) : null}
          </div>
          {/* Step 9: mock pass/fail from the mock doc's passPercent
              (a practice threshold only — never an official pass). */}
          {isMockAttempt && mockPassPercent !== null ? (
            <div style={{ marginTop: 12, fontWeight: 700, color: mockPassed ? CORRECT : WRONG, fontSize: 15 }}>
              {mockPassed
                ? lang === 'bn'
                  ? `পাস করেছেন — পাস নম্বর ${mockPassPercent}% (অনুশীলন হিসাব)`
                  : `Passed — pass mark ${mockPassPercent}% (practice calculation)`
                : lang === 'bn'
                  ? `পাস হয়নি — পাস নম্বর ${mockPassPercent}% (অনুশীলন হিসাব)`
                  : `Not passed — pass mark ${mockPassPercent}% (practice calculation)`}
            </div>
          ) : null}
          {isModerator && ownerUid !== user.uid ? (
            <p style={{ margin: '12px 0 0', fontSize: 13, color: MUTED }}>
              {tr({ bn: 'মডারেটর হিসেবে অন্য শিক্ষার্থীর ফলাফল দেখছেন।', en: 'You are viewing another student’s result as a moderator.' })}
            </p>
          ) : null}
        </Card>

        <Card>
          <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 17 }}>{tr({ bn: 'দুর্বল টপিক', en: 'Weak topics' })}</div>
          {weakTopics.length === 0 ? (
            <p style={{ margin: '8px 0 0', color: MUTED, fontSize: 14, lineHeight: 1.7 }}>
              {/* N5: the old copy led with "all correct" even for a
                  zero-answer attempt — distinguish the two cases. */}
              {unansweredCount === answers.length
                ? tr({ bn: 'কোনো প্রশ্নের উত্তর দেওয়া হয়নি — দুর্বল টপিক নির্ণয় করা যায়নি।', en: 'No question was answered — weak topics could not be identified.' })
                : tr({ bn: 'কোনো ভুল উত্তর নেই — সব প্রশ্নের উত্তর সঠিক হয়েছে।', en: 'No wrong answers — every answered question was correct.' })}
            </p>
          ) : (
            <ul style={{ margin: '8px 0 0', paddingLeft: 20, fontSize: 14, lineHeight: 1.9, color: '#142B3B' }}>
              {weakTopics.map((t) => {
                const badge = topicActionBadge(t);
                const link = weakTopicPracticeLink(summary, t.topicId);
                return (
                  <li key={t.topicId}>
                    {/* D7: never render the raw topic-ID slug — the
                        label resolver turns bcs__english__grammar__tense
                        into "English — Grammar — Tense". Step 10: each
                        weak topic links to its practice entry point
                        (its own bundle for practice attempts, the
                        topic page for mocks) with an action badge. */}
                    {jobTopicLabel(t.topicId, lang)} — {t.wrong}/{t.total}{lang === 'bn' ? 'টি ভুল' : ' wrong'}
                    {badge ? (
                      <span style={{ display: 'block', fontSize: 13, color: '#8A6100', fontWeight: 600 }}>
                        {(lang === 'bn' ? TOPIC_ACTION_BADGE_BN : TOPIC_ACTION_BADGE_EN)[badge]}
                      </span>
                    ) : null}
                    <span style={{ display: 'block', fontSize: 13 }}>
                      <Link to={link.to} style={{ fontWeight: 600 }}>
                        {tr({ bn: 'এই টপিক অনুশীলন করুন →', en: 'Practise this topic →' })}
                      </Link>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
            {/* Step 9: a mock retakes from its definition page,
                not the practice route. */}
            {isMockAttempt && mockDefinitionId ? (
              <LinkButton to={`/jobs/mock/${mockDefinitionId}`} variant="accent">
                {tr({ bn: 'আবার মক দিন', en: 'Retake mock' })}
              </LinkButton>
            ) : bundleId ? (
              <LinkButton to={`/jobs/practice/${bundleId}`} variant="accent">
                {tr({ bn: 'আবার অনুশীলন করুন', en: 'Practise again' })}
              </LinkButton>
            ) : null}
            {examSlug ? (
              <LinkButton to={`/jobs/${examSlug}/results`} variant="outline">
                {tr({ bn: 'ফলাফল ইতিহাস', en: 'Result history' })}
              </LinkButton>
            ) : null}
            <LinkButton to="/jobs/analysis" variant="outline">
              {tr({ bn: 'বিস্তারিত বিশ্লেষণ দেখুন →', en: 'See detailed analysis →' })}
            </LinkButton>
          </div>
        </Card>
      </div>

      {/* Step 10: per-topic accuracy table + time per subject.
          ChatGPT §2A: weakest first, counts AND % together, and
          a text level (ভালো / মাঝারি / এই পরীক্ষায় দুর্বল) —
          never colour alone, never a permanent ability label. */}
      <Card style={{ marginTop: 16 }}>
        <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 17, marginBottom: 8 }}>{tr({ bn: 'টপিক অনুযায়ী ফলাফল', en: 'Results by topic' })}</div>
        {topicStats.length === 0 ? (
          <p style={{ margin: 0, color: MUTED, fontSize: 14 }}>{tr({ bn: 'কোনো প্রশ্নের উত্তর দেওয়া হয়নি — টপিক অনুযায়ী ফলাফল নির্ণয় করা যায়নি।', en: 'No question was answered — results by topic could not be determined.' })}</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, lineHeight: 1.7 }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid #E3E8EF', color: MUTED }}>
                  <th style={{ padding: '6px 8px' }}>{tr({ bn: 'টপিক', en: 'Topic' })}</th>
                  <th style={{ padding: '6px 8px' }}>{tr({ bn: 'সঠিক', en: 'Correct' })}</th>
                  <th style={{ padding: '6px 8px' }}>{tr({ bn: 'নির্ভুলতা', en: 'Accuracy' })}</th>
                  <th style={{ padding: '6px 8px' }}>{tr({ bn: 'স্তর', en: 'Level' })}</th>
                  <th style={{ padding: '6px 8px' }}>{tr({ bn: 'সময়', en: 'Time' })}</th>
                </tr>
              </thead>
              <tbody>
                {topicStatsWeakestFirst.map((t) => (
                  <tr key={t.topicId} style={{ borderBottom: '1px solid #EEF1F5' }}>
                    <td style={{ padding: '6px 8px', fontWeight: 600, color: '#142B3B' }}>{lang === 'bn' ? t.label : t.labelEn}</td>
                    <td style={{ padding: '6px 8px' }}>{t.correct}/{t.total}</td>
                    <td style={{ padding: '6px 8px' }}>{t.accuracy}%</td>
                    <td style={{ padding: '6px 8px' }}>{(lang === 'bn' ? TOPIC_LEVEL_BN : TOPIC_LEVEL_EN)[topicLevel(t.accuracy, t.total)]}</td>
                    <td style={{ padding: '6px 8px' }}>{formatDuration(t.timeSeconds, lang)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {subjectTimes.length > 1 ? (
        <Card style={{ marginTop: 16 }}>
          <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 17, marginBottom: 8 }}>{tr({ bn: 'বিষয় অনুযায়ী সময়', en: 'Time by subject' })}</div>
          {/* ChatGPT §2B: time on correct vs wrong answers — with
              the caveat that time alone is no judgement (a hard
              question honestly takes longer than an easy one). */}
          {cwTime.wrongCount > 0 && cwTime.correctCount > 0 ? (
            <p style={{ margin: '0 0 8px', color: '#142B3B', fontSize: 14, lineHeight: 1.7 }}>
              {tr({ bn: `ভুল উত্তরে গড়ে ${Math.round(cwTime.avgWrongSeconds)} সেকেন্ড, সঠিক উত্তরে গড়ে ${Math.round(cwTime.avgCorrectSeconds)} সেকেন্ড — তবে সময় একা বিচার নয়, কঠিন প্রশ্নে সময় বেশি লাগা স্বাভাবিক।`, en: `Wrong answers took ${Math.round(cwTime.avgWrongSeconds)} seconds on average, correct answers ${Math.round(cwTime.avgCorrectSeconds)} seconds — but time alone is no judgement; a hard question honestly takes longer.` })}
            </p>
          ) : null}
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, lineHeight: 1.9, color: '#142B3B' }}>
            {subjectTimes.map((s) => (
              <li key={s.subjectId}>
                {tr({ bn: `${s.label} — ${formatDuration(s.timeSeconds, 'bn')} (${s.questions}টি প্রশ্ন, গড় ${Math.round(s.avgTimeSeconds)} সেকেন্ড/প্রশ্ন)`, en: `${s.labelEn} — ${formatDuration(s.timeSeconds, 'en')} (${s.questions} question(s), avg ${Math.round(s.avgTimeSeconds)} sec/question)` })}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {/* Per-question review */}
      <div id="review">
      <Card style={{ marginTop: 16 }}>
        <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 17, marginBottom: 8 }}>{tr({ bn: 'প্রশ্ন-পর্যালোচনা', en: 'Question review' })}</div>
        {/* Step 9: a mock key opens only within 10 minutes of
            submit — after that the explanations hide, but the
            stored correct answers above still show. */}
        {isMockAttempt && !key ? (
          <p style={{ margin: '0 0 12px', color: MUTED, fontSize: 14, lineHeight: 1.7 }}>
            {tr({ bn: 'উত্তরের ব্যাখ্যা এখন দেখা যাচ্ছে না — মকের চাবি শুধু জমা দেওয়ার ১০ মিনিটের মধ্যে খোলে। সঠিক উত্তর ও নম্বর সংরক্ষিত ফলাফল থেকে দেখানো হচ্ছে।', en: 'Explanations are not visible right now — the mock key opens only within 10 minutes of submission. Correct answers and marks are shown from the saved result.' })}
          </p>
        ) : null}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {filterButton('all', tr({ bn: `সব (${answers.length})`, en: `All (${answers.length})` }))}
          {filterButton('correct', tr({ bn: `সঠিক (${correctCount})`, en: `Correct (${correctCount})` }))}
          {filterButton('wrong', tr({ bn: `ভুল (${wrongCount})`, en: `Wrong (${wrongCount})` }))}
          {filterButton('unanswered', tr({ bn: `উত্তর দেওয়া হয়নি (${unansweredCount})`, en: `Unanswered (${unansweredCount})` }))}
          {filterButton('slow', tr({ bn: `ধীর (${slowCount})`, en: `Slow (${slowCount})` }))}
          {/* Step 10 (Gemini #2): filter the review by topic, so a
              student never has to scroll 100 questions to re-find
              one topic's wrong answers. */}
          <select
            value={topicFilter}
            onChange={(e) => setTopicFilter(e.target.value)}
            aria-label={tr({ bn: 'টপিক অনুযায়ী দেখুন', en: 'Filter by topic' })}
            style={{ border: '1px solid #C9D2E0', borderRadius: 8, padding: '6px 10px', fontWeight: 600, color: '#142B3B', background: '#fff', cursor: 'pointer' }}
          >
            <option value="all">{tr({ bn: 'সব টপিক', en: 'All topics' })}</option>
            {topicStats.map((t) => (
              <option key={t.topicId} value={t.topicId}>{lang === 'bn' ? t.label : t.labelEn}</option>
            ))}
          </select>
        </div>
        {filtered.length === 0 ? (
          <p style={{ margin: 0, color: MUTED, fontSize: 14 }}>{tr({ bn: 'এই ফিল্টারে কোনো প্রশ্ন নেই।', en: 'No questions match this filter.' })}</p>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {filtered.map((a) => {
              const explanation = key?.answers.find((x) => x.n === a.n)?.explanation;
              return (
              <div key={a.n} style={{ border: '1px solid #E3E8EF', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, color: '#142B3B' }}>
                    {tr({ bn: `প্রশ্ন ${a.n}`, en: `Question ${a.n}` })}
                    {markedSet.has(a.n) ? <span style={{ color: '#8A6100' }}>{tr({ bn: ' ★ পরে দেখব', en: ' ★ Review later' })}</span> : ''}
                  </span>
                  <span style={{ fontWeight: 700, color: a.selected === null ? MUTED : a.correct ? CORRECT : WRONG }}>
                    {a.selected === null ? tr({ bn: 'উত্তর দেওয়া হয়নি', en: 'Unanswered' }) : a.correct ? tr({ bn: 'সঠিক', en: 'Correct' }) : tr({ bn: 'ভুল', en: 'Wrong' })}
                    {` · ${a.marks > 0 ? `+${a.marks}` : a.marks} ${lang === 'bn' ? 'নম্বর' : 'marks'}`}
                  </span>
                </div>
                <p style={{ margin: '8px 0', fontSize: 15, lineHeight: 1.7, color: '#142B3B' }}>{questionText(a)}</p>
                <p style={{ margin: '4px 0', fontSize: 14, color: MUTED }}>
                  {tr({ bn: 'আপনার উত্তর:', en: 'Your answer:' })} {a.selected === null ? '—' : `${a.selected}`}
                  {' · '}{tr({ bn: 'সঠিক উত্তর:', en: 'Correct answer:' })} {a.correctText ?? '—'}
                  {/* Step 10: time per question + its time×accuracy
                      bucket, visible inside the reviewed question
                      (Gemini #1/#2) — no tap needed to see it. */}
                  {' · '}{tr({ bn: 'সময়:', en: 'Time:' })} {formatDuration(a.timeSpentSeconds ?? 0, lang)}
                  {' · '}{(lang === 'bn' ? ANSWER_TIME_BUCKET_BN : ANSWER_TIME_BUCKET_EN)[classifyAnswerTime(a, perAnswerAvgSeconds)]}
                </p>
                {explanation ? (
                  <p style={{ margin: '4px 0 0', fontSize: 14, lineHeight: 1.7, color: '#142B3B' }}>
                    {tr({ bn: 'ব্যাখ্যা:', en: 'Explanation:' })} {explanation}
                  </p>
                ) : null}
              </div>
              );
            })}
          </div>
        )}
      </Card>
      </div>

      {/* ChatGPT §2E/§7: the next action — concrete, linked, and
          last in the mobile order (RESULT → SUMMARY → TOPIC →
          TIME → REVIEW → PROGRESS → NEXT ACTION). The 1st
          priority is the weakest topic from THIS attempt's data;
          the wrong questions are one anchor away, not a new
          feature (the Step 13 notebook owns the collection). */}
      <Card style={{ marginTop: 16 }}>
        <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 17, marginBottom: 8 }}>{tr({ bn: 'পরবর্তী পদক্ষেপ', en: 'Next step' })}</div>
        {weakestTopic ? (
          <>
            <p style={{ margin: '0 0 8px', color: '#142B3B', fontSize: 14, lineHeight: 1.7 }}>
              {tr({ bn: `১ম অগ্রাধিকার: ${weakestTopic.label} — ${weakestTopic.wrong}/${weakestTopic.total}টি ভুল।`, en: `1st priority: ${weakestTopic.labelEn} — ${weakestTopic.wrong}/${weakestTopic.total} wrong.` })}
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <LinkButton to={weakTopicPracticeLink(summary, weakestTopic.topicId).to} variant="accent">
                {tr({ bn: 'এই টপিক অনুশীলন করুন →', en: 'Practise this topic →' })}
              </LinkButton>
              <LinkButton to="#review" variant="outline">
                {tr({ bn: 'ভুল প্রশ্নগুলো আবার দেখুন ↓', en: 'Review the wrong questions again ↓' })}
              </LinkButton>
              <LinkButton to="/jobs/wrong-answers" variant="outline">
                {tr({ bn: 'ভুল-উত্তর নোটবুক দেখুন →', en: 'See the wrong-answer notebook →' })}
              </LinkButton>
            </div>
          </>
        ) : (
          <p style={{ margin: 0, color: MUTED, fontSize: 14, lineHeight: 1.7 }}>
            {tr({ bn: 'এই পরীক্ষায় কোনো ভুল উত্তর নেই — পরের মক/অনুশীলনে নতুন টপিকে এগিয়ে যান।', en: 'No wrong answers in this exam — move on to a new topic in the next mock/practice.' })}
          </p>
        )}
      </Card>

      <p style={{ marginTop: 20 }}>
        <Link to="/jobs" style={{ fontWeight: 600 }}>{tr({ bn: '← সব পরীক্ষা দেখুন', en: '← See all exams' })}</Link>
      </p>
    </PageShell>
  );
}
