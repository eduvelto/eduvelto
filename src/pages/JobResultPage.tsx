// Eduvelto — Job practice result page (Step 8).
//
// /jobs/result/:attemptId — reads the submitted attempt doc
// (owner, or Moderator via ?uid=…). The attempt stores the
// correct answer text per question, so this page NEVER re-reads
// the answer key (QuizResultPage pattern).
//
// BINDING (Step 2 §2.7, Step 7 fold-in P0-02): the label
// "অনুশীলন ফলাফল — নিয়োগ পরীক্ষার ফল নয়" is shown on every
// result page. Client-side scores are NEVER "Verified".
// percentage is stored as the real (possibly negative) number;
// the display clamps at 0 — the stored value is not changed.
//
// "ভুল প্রশ্নগুলো আবার অনুশীলন করুন" re-runs the whole bundle
// (a wrong-only session needs a Moderator-built bundle — Step 13).
//
// LANGUAGE: all UI text is Bangla (one-language rule).

import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { AlertBox, Card, LinkButton, ProgressBar, Skeleton } from '../components/ui';
import { useAuth } from '../lib/auth';
import { JOB_PRACTICE_RESULT_LABEL, jobTopicLabelBn } from '../lib/jobEngine';
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

type Filter = 'all' | 'correct' | 'wrong' | 'unanswered';

interface AttemptAnswer {
  n: number;
  questionId: string;
  topicId: string;
  subjectId: string;
  selected: string | null;
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
  const [searchParams] = useSearchParams();
  const { user, profile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [attempt, setAttempt] = useState<Record<string, unknown> | null>(null);
  const [session, setSession] = useState<JobPracticeSessionDoc | JobMockSessionDoc | null>(null);
  const [bundle, setBundle] = useState<PracticeBundleWithId | null>(null);
  const [key, setKey] = useState<JobQuestionKey | null>(null);
  const [mockDef, setMockDef] = useState<JobMockWithId | null>(null);
  const [filter, setFilter] = useState<Filter>('all');

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
      <PageShell titleBn="ফলাফল" titleEn="ফলাফল" wide>
        <Skeleton />
      </PageShell>
    );
  }

  if (!user) {
    return (
      <PageShell titleBn="ফলাফল" titleEn="ফলাফল" wide>
        <Card>
          <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 17 }}>ফলাফল দেখতে লগইন করুন</div>
          <p style={{ margin: '8px 0 12px', color: MUTED, fontSize: 14, lineHeight: 1.7 }}>
            ফলাফল শুধু লগইন করা শিক্ষার্থীরা দেখতে পারে।
          </p>
          <Link to="/login" style={{ fontWeight: 600 }}>লগইন করুন →</Link>
        </Card>
      </PageShell>
    );
  }

  if (notFound || !attempt) {
    return (
      <PageShell titleBn="ফলাফল" titleEn="ফলাফল" wide>
        <AlertBox tone="error">এই ফলাফলটি পাওয়া যায়নি — হয় ঠিকানাটি ভুল, নয় এটি আপনার ফলাফল নয়।</AlertBox>
        <p style={{ marginTop: 16 }}>
          <Link to="/jobs" style={{ fontWeight: 600 }}>← সব পরীক্ষা দেখুন</Link>
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

  // Weak topics: from the stored answers (wrong per topic).
  const weakMap = new Map<string, { wrong: number; total: number }>();
  for (const a of answers) {
    const s = weakMap.get(a.topicId) ?? { wrong: 0, total: 0 };
    s.total += 1;
    if (a.selected !== null && !a.correct) s.wrong += 1;
    weakMap.set(a.topicId, s);
  }
  const weakTopics = [...weakMap.entries()]
    .map(([topicId, s]) => ({ topicId, ...s }))
    .filter((t) => t.wrong > 0)
    .sort((a, b) => b.wrong - a.wrong || b.total - a.total);

  const filtered = answers.filter((a) => {
    if (filter === 'correct') return a.selected !== null && a.correct;
    if (filter === 'wrong') return a.selected !== null && !a.correct;
    if (filter === 'unanswered') return a.selected === null;
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
    return q?.questionText ?? `প্রশ্ন ${a.n}`;
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
    <PageShell titleBn="ফলাফল" titleEn="ফলাফল" wide maxWidth={1240}>
      {/* BINDING label — every result page carries it. */}
      <AlertBox tone="info">{JOB_PRACTICE_RESULT_LABEL}</AlertBox>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginTop: 16, alignItems: 'start' }}>
        <Card>
          <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 17 }}>সারাংশ</div>
          <div style={{ fontSize: 34, fontWeight: 800, color: '#142B3B', marginTop: 8 }}>
            {score}
            <span style={{ fontSize: 16, color: MUTED, fontWeight: 600 }}> / {totalMarks} নম্বর</span>
          </div>
          <div style={{ marginTop: 8 }}>
            <ProgressBar value={displayPercentage} />
            <div style={{ fontSize: 13, color: MUTED, marginTop: 4 }}>{displayPercentage}%</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12, fontSize: 14 }}>
            <div><span style={{ color: CORRECT, fontWeight: 700 }}>✓ সঠিক:</span> {correctCount}টি</div>
            <div><span style={{ color: WRONG, fontWeight: 700 }}>✗ ভুল:</span> {wrongCount}টি</div>
            <div><span style={{ color: MUTED, fontWeight: 700 }}>○ উত্তর দেওয়া হয়নি:</span> {unansweredCount}টি</div>
            <div><span style={{ fontWeight: 700 }}>নির্ভুলতা:</span> {accuracy}%</div>
            {negativeMarkingDisabled ? (
              <div><span style={{ fontWeight: 700 }}>নেগেটিভ মার্কিং:</span> বন্ধ — বিজ্ঞপ্তি যাচাই বাকি</div>
            ) : (
              <div><span style={{ fontWeight: 700 }}>নেগেটিভ মার্কিংয়ে কাটা:</span> −{negativeDeduction}</div>
            )}
            <div><span style={{ fontWeight: 700 }}>সময়:</span> {Math.floor(timeSpentSeconds / 60)} মিনিট {timeSpentSeconds % 60} সেকেন্ড</div>
          </div>
          {/* Step 9: mock pass/fail from the mock doc's passPercent
              (a practice threshold only — never an official pass). */}
          {isMockAttempt && mockPassPercent !== null ? (
            <div style={{ marginTop: 12, fontWeight: 700, color: mockPassed ? CORRECT : WRONG, fontSize: 15 }}>
              {mockPassed
                ? `পাস করেছেন — পাস নম্বর ${mockPassPercent}% (অনুশীলন হিসাব)`
                : `পাস হয়নি — পাস নম্বর ${mockPassPercent}% (অনুশীলন হিসাব)`}
            </div>
          ) : null}
          {isModerator && ownerUid !== user.uid ? (
            <p style={{ margin: '12px 0 0', fontSize: 13, color: MUTED }}>
              মডারেটর হিসেবে অন্য শিক্ষার্থীর ফলাফল দেখছেন।
            </p>
          ) : null}
        </Card>

        <Card>
          <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 17 }}>দুর্বল টপিক</div>
          {weakTopics.length === 0 ? (
            <p style={{ margin: '8px 0 0', color: MUTED, fontSize: 14, lineHeight: 1.7 }}>
              {/* N5: the old copy led with "all correct" even for a
                  zero-answer attempt — distinguish the two cases. */}
              {unansweredCount === answers.length
                ? 'কোনো প্রশ্নের উত্তর দেওয়া হয়নি — দুর্বল টপিক নির্ণয় করা যায়নি।'
                : 'কোনো ভুল উত্তর নেই — সব প্রশ্নের উত্তর সঠিক হয়েছে।'}
            </p>
          ) : (
            <ul style={{ margin: '8px 0 0', paddingLeft: 20, fontSize: 14, lineHeight: 1.9, color: '#142B3B' }}>
              {weakTopics.map((t) => (
                <li key={t.topicId}>
                  {/* D7: never render the raw topic-ID slug — the
                      label resolver turns bcs__english__grammar__tense
                      into "English — Grammar — Tense". */}
                  {jobTopicLabelBn(t.topicId)} — {t.wrong}/{t.total}টি ভুল
                </li>
              ))}
            </ul>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
            {/* Step 9: a mock retakes from its definition page,
                not the practice route. */}
            {isMockAttempt && mockDefinitionId ? (
              <LinkButton to={`/jobs/mock/${mockDefinitionId}`} variant="accent">
                আবার মক দিন
              </LinkButton>
            ) : bundleId ? (
              <LinkButton to={`/jobs/practice/${bundleId}`} variant="accent">
                আবার অনুশীলন করুন
              </LinkButton>
            ) : null}
            {examSlug ? (
              <LinkButton to={`/jobs/${examSlug}/results`} variant="outline">
                ফলাফল ইতিহাস
              </LinkButton>
            ) : null}
          </div>
        </Card>
      </div>

      {/* Per-question review */}
      <Card style={{ marginTop: 16 }}>
        <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 17, marginBottom: 8 }}>প্রশ্ন-পর্যালোচনা</div>
        {/* Step 9: a mock key opens only within 10 minutes of
            submit — after that the explanations hide, but the
            stored correct answers above still show. */}
        {isMockAttempt && !key ? (
          <p style={{ margin: '0 0 12px', color: MUTED, fontSize: 14, lineHeight: 1.7 }}>
            উত্তরের ব্যাখ্যা এখন দেখা যাচ্ছে না — মকের চাবি শুধু জমা দেওয়ার ১০ মিনিটের মধ্যে খোলে। সঠিক উত্তর ও নম্বর সংরক্ষিত ফলাফল থেকে দেখানো হচ্ছে।
          </p>
        ) : null}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {filterButton('all', `সব (${answers.length})`)}
          {filterButton('correct', `সঠিক (${correctCount})`)}
          {filterButton('wrong', `ভুল (${wrongCount})`)}
          {filterButton('unanswered', `উত্তর দেওয়া হয়নি (${unansweredCount})`)}
        </div>
        {filtered.length === 0 ? (
          <p style={{ margin: 0, color: MUTED, fontSize: 14 }}>এই ফিল্টারে কোনো প্রশ্ন নেই।</p>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {filtered.map((a) => {
              const explanation = key?.answers.find((x) => x.n === a.n)?.explanation;
              return (
              <div key={a.n} style={{ border: '1px solid #E3E8EF', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, color: '#142B3B' }}>
                    প্রশ্ন {a.n}
                    {markedSet.has(a.n) ? <span style={{ color: '#8A6100' }}> ★ পরে দেখব</span> : ''}
                  </span>
                  <span style={{ fontWeight: 700, color: a.selected === null ? MUTED : a.correct ? CORRECT : WRONG }}>
                    {a.selected === null ? 'উত্তর দেওয়া হয়নি' : a.correct ? 'সঠিক' : 'ভুল'}
                    {` · ${a.marks > 0 ? `+${a.marks}` : a.marks} নম্বর`}
                  </span>
                </div>
                <p style={{ margin: '8px 0', fontSize: 15, lineHeight: 1.7, color: '#142B3B' }}>{questionText(a)}</p>
                <p style={{ margin: '4px 0', fontSize: 14, color: MUTED }}>
                  আপনার উত্তর: {a.selected === null ? '—' : `${a.selected}`}
                  {' · '}সঠিক উত্তর: {a.correctText ?? '—'}
                </p>
                {explanation ? (
                  <p style={{ margin: '4px 0 0', fontSize: 14, lineHeight: 1.7, color: '#142B3B' }}>
                    ব্যাখ্যা: {explanation}
                  </p>
                ) : null}
              </div>
              );
            })}
          </div>
        )}
      </Card>

      <p style={{ marginTop: 20 }}>
        <Link to="/jobs" style={{ fontWeight: 600 }}>← সব পরীক্ষা দেখুন</Link>
      </p>
    </PageShell>
  );
}
