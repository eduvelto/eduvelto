// Eduvelto — Job MCQ practice page (Step 8).
//
// /jobs/practice/:scope — scope is a jobQuestionBundles doc ID
// (deterministic topic__/previous__ ID). One MCQ at a time, 4
// options, single correct; practice is UNTIMED (Step 2 §3.4).
// Answer → immediate correct/wrong mark + one-line explanation
// (the key is read directly: Published practice-bundle keys are
// open to a signed-in student, Step 7 rules). Prev/next,
// mark-for-review (never clears the answer), palette, autosave
// (debounced), submit → result page.
//
// Submit order (rules-enforced, team/job-rules-step8.md):
//   session → 'submitted' FIRST → attempt create (same doc-ID)
//   → /jobs/result/:attemptId. No receipt is created (practice
//   keys need none — see src/lib/jobPractice.ts header).
//
// LIMITS (honest, Step 8): difficulty ordering is bundle order —
// the bundle carries no difficulty per question (it lives on the
// jobQuestions doc, which students can never read), so
// Beginner-easy-first / Advanced-hard-first ordering cannot run
// yet (needs difficulty denormalized into the bundle at build
// time — Step 9/15 note). Mode is therefore not wired here.
// "ভুল প্রশ্নগুলো আবার অনুশীলন করুন" re-runs the whole bundle
// (a wrong-only session needs a Moderator-built bundle — Step 13).
//
// LANGUAGE: all UI text is Bangla (one-language rule).

import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { AlertBox, Button, Card, Chip, ProgressBar, Skeleton } from '../components/ui';
import { useAuth } from '../lib/auth';
import {
  answerSessionQuestion,
  buildAutosavePatch,
  goToQuestion,
  sessionProgress,
  toggleMarkForReview,
  type JobPracticeSessionDoc,
  type JobSessionAnswerSelection,
} from '../lib/jobEngine';
import {
  autosaveSession,
  findResumableSession,
  loadBundleKey,
  loadPracticeBundle,
  startPracticeSession,
  submitPracticeAttempt,
  type PracticeBundleWithId,
} from '../lib/jobPractice';
import type { JobQuestionKey } from '../lib/jobQuestions';

type Phase = 'loading' | 'signed-out' | 'error' | 'ready';
type SaveState = 'saved' | 'saving' | 'error';

const CORRECT = '#12766E';
const WRONG = '#B00020';
const MUTED = '#68747B';
const MARKED = '#8A6100';

export default function JobPracticePage() {
  const { scope = '' } = useParams<{ scope: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [phase, setPhase] = useState<Phase>('loading');
  const [error, setError] = useState('');
  const [bundle, setBundle] = useState<PracticeBundleWithId | null>(null);
  const [key, setKey] = useState<JobQuestionKey | null>(null);
  const [sessionId, setSessionId] = useState('');
  const [session, setSession] = useState<JobPracticeSessionDoc | null>(null);
  const [startedAtMillis, setStartedAtMillis] = useState(0);
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [saveState, setSaveState] = useState<SaveState>('saved');

  // Per-question time: accumulated seconds per n + the clock for
  // the currently open question. Flushed into the session on
  // navigation and on submit (time is informational).
  const timeRef = useRef<{ current: number; startedAt: number }>({ current: 1, startedAt: Date.now() });
  const startedRef = useRef(false);

  // Latest session, readable from plain (non-updater) code — the
  // submit flow must not run inside a setState updater (StrictMode
  // double-invokes updaters, which would double-submit).
  const sessionRef = useRef<JobPracticeSessionDoc | null>(null);
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  // Load bundle + key, then resume the latest in-progress session
  // for this bundle or start a new one.
  useEffect(() => {
    if (!user) {
      setPhase('signed-out');
      return;
    }
    if (startedRef.current) return;
    startedRef.current = true;
    let alive = true;
    (async () => {
      try {
        const [b, k] = await Promise.all([loadPracticeBundle(scope), loadBundleKey(scope)]);
        if (!alive) return;
        if (!b) {
          setError('এই অনুশীলন সেটটি পাওয়া যায়নি — হয় ঠিকানাটি ভুল, নয় সেটটি এখনো প্রকাশিত হয়নি।');
          setPhase('error');
          return;
        }
        if (b.status !== 'published') {
          setError('এই অনুশীলন সেটটি এখনো প্রকাশিত হয়নি — শিক্ষক যাচাইয়ের পর প্রকাশিত হবে।');
          setPhase('error');
          return;
        }
        if (b.kind !== 'topic' && b.kind !== 'previous') {
          setError('এটি মক-ধরনের সেট — অনুশীলন এখানে নয়, মক টেস্ট থেকে দিতে হবে।');
          setPhase('error');
          return;
        }
        if (b.questions.length === 0) {
          setError('এই সেটে এখনো কোনো প্রশ্ন নেই।');
          setPhase('error');
          return;
        }
        if (!k) {
          setError('এই সেটের উত্তর-চাবি পাওয়া যায়নি — অনুশীলন চালানো যাবে না।');
          setPhase('error');
          return;
        }
        const resumed = await findResumableSession(user.uid, b.docId);
        if (!alive) return;
        if (resumed) {
          setBundle(b);
          setKey(k);
          setSessionId(resumed.sessionId);
          setSession(resumed.session);
          setStartedAtMillis(resumed.startedAtMillis);
          timeRef.current = { current: resumed.session.currentQuestion, startedAt: Date.now() };
          const rev: Record<number, boolean> = {};
          for (const [n, a] of Object.entries(resumed.session.answers)) {
            if (a.selected !== null) rev[Number(n)] = true;
          }
          setRevealed(rev);
        } else {
          const started = await startPracticeSession(user.uid, b);
          if (!alive) return;
          setBundle(b);
          setKey(k);
          setSessionId(started.sessionId);
          setSession(started.session);
          setStartedAtMillis(started.startedAtMillis);
          timeRef.current = { current: 1, startedAt: Date.now() };
        }
        setPhase('ready');
      } catch (e) {
        if (!alive) return;
        setError(e instanceof Error ? e.message : 'অনুশীলন শুরু করা যায়নি — আবার চেষ্টা করুন।');
        setPhase('error');
      }
    })();
    return () => {
      alive = false;
    };
  }, [user, scope]);

  // Debounced autosave: only the fields the rules allow to change
  // while in-progress. The just-created session is skipped (it
  // was already written by setDoc).
  const firstSaveRef = useRef(true);
  useEffect(() => {
    if (!session || !user || phase !== 'ready') return;
    if (firstSaveRef.current) {
      firstSaveRef.current = false;
      return;
    }
    setSaveState('saving');
    const t = setTimeout(() => {
      autosaveSession(user.uid, sessionId, buildAutosavePatch(session))
        .then(() => setSaveState('saved'))
        .catch(() => setSaveState('error'));
    }, 1200);
    return () => clearTimeout(t);
  }, [session, user, sessionId, phase]);

  if (phase === 'loading') {
    return (
      <PageShell titleBn="অনুশীলন" titleEn="অনুশীলন" wide>
        <Skeleton />
      </PageShell>
    );
  }

  if (phase === 'signed-out') {
    return (
      <PageShell titleBn="অনুশীলন" titleEn="অনুশীলন" wide>
        <Card>
          <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 17 }}>অনুশীলন করতে লগইন করুন</div>
          <p style={{ margin: '8px 0 12px', color: MUTED, fontSize: 14, lineHeight: 1.7 }}>
            অনুশীলন শুধু লগইন করা শিক্ষার্থীদের জন্য — আপনার উত্তর ও অগ্রগতি সংরক্ষিত হয়।
          </p>
          <Link to="/login" style={{ fontWeight: 600 }}>লগইন করুন →</Link>
        </Card>
      </PageShell>
    );
  }

  if (phase === 'error' || !bundle || !key || !session) {
    return (
      <PageShell titleBn="অনুশীলন" titleEn="অনুশীলন" wide>
        <AlertBox tone="error">{error || 'অনুশীলন শুরু করা যায়নি।'}</AlertBox>
        <p style={{ marginTop: 16 }}>
          <Link to="/jobs" style={{ fontWeight: 600 }}>← সব পরীক্ষা দেখুন</Link>
        </p>
      </PageShell>
    );
  }

  const total = bundle.questions.length;
  const progress = sessionProgress(session);
  const currentN = session.currentQuestion;
  const currentQ = bundle.questions.find((q) => q.n === currentN) ?? bundle.questions[0];
  const currentAnswer = session.answers[currentQ.n];
  const keyAnswer = key.answers.find((a) => a.n === currentQ.n);
  const isRevealed = revealed[currentQ.n] === true;
  const isCorrect = isRevealed && currentAnswer.selected !== null && keyAnswer !== undefined && currentAnswer.selected === keyAnswer.correctLetter;

  function flushTime(): { n: number; elapsed: number } {
    const now = Date.now();
    const elapsed = Math.max(0, Math.round((now - timeRef.current.startedAt) / 1000));
    const n = timeRef.current.current;
    timeRef.current = { current: n, startedAt: now };
    setSession((prev) => {
      if (!prev) return prev;
      const prevEntry = prev.answers[n];
      if (!prevEntry) return prev;
      return {
        ...prev,
        answers: { ...prev.answers, [n]: { ...prevEntry, timeSpentSeconds: prevEntry.timeSpentSeconds + elapsed } },
      };
    });
    return { n, elapsed };
  }

  function goTo(n: number) {
    if (n < 1 || n > total) return;
    flushTime();
    timeRef.current = { current: n, startedAt: Date.now() };
    setSession((prev) => (prev ? goToQuestion(prev, n) : prev));
  }

  function choose(letter: JobSessionAnswerSelection) {
    if (!session) return;
    setSession((prev) => {
      if (!prev) return prev;
      const next = answerSessionQuestion(prev, currentQ.n, letter);
      return next;
    });
    setRevealed((prev) => ({ ...prev, [currentQ.n]: true }));
  }

  function toggleMark() {
    setSession((prev) => (prev ? toggleMarkForReview(prev, currentQ.n) : prev));
  }

  async function doSubmit() {
    const liveSession = sessionRef.current;
    if (!user || !bundle || !key || !liveSession) return;
    setSubmitting(true);
    setSubmitError('');
    // Flush the current question's clock and merge it into the
    // submit answers directly (the setState above is async — the
    // ref value, not the state, is the source of truth here).
    const flushed = flushTime();
    try {
      const answers = bundle.questions.map((q) => {
        const a = liveSession.answers[q.n];
        return {
          n: q.n,
          questionId: q.questionId,
          selected: a?.selected ?? null,
          timeSpentSeconds: (a?.timeSpentSeconds ?? 0) + (flushed.n === q.n ? flushed.elapsed : 0),
        };
      });
      const { attemptId } = await submitPracticeAttempt({
        uid: user.uid,
        sessionId,
        session: liveSession,
        bundle,
        bundleId: bundle.docId,
        key,
        answers,
        startedAtMillis,
        submittedAtMillis: Date.now(),
      });
      navigate(`/jobs/result/${attemptId}`);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'জমা দেওয়া যায়নি — আবার চেষ্টা করুন।');
      setSubmitting(false);
      setConfirming(false);
    }
  }

  const saveLabel =
    saveState === 'saving' ? 'সংরক্ষণ হচ্ছে…' : saveState === 'error' ? 'সংরক্ষণ হয়নি — আবার চেষ্টা করা হবে' : 'সংরক্ষিত';

  return (
    <PageShell titleBn={bundle.titleBn} titleEn={bundle.titleBn} wide maxWidth={1240}>
      {/* Sticky top bar: exam + progress + autosave state. Practice
          is untimed — no timer is shown (Step 2 §3.4). */}
      <div style={{ position: 'sticky', top: 0, zIndex: 5, background: '#fff', padding: '10px 0 8px', borderBottom: '1px solid #E3E8EF', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 16 }}>{bundle.titleBn}</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: MUTED }}>
            <Chip tone="outline">অনুশীলন — টাইমার নেই</Chip>
            <span>{saveLabel}</span>
          </div>
        </div>
        <div style={{ marginTop: 8 }}>
          <ProgressBar value={total === 0 ? 0 : (progress.answered / total) * 100} />
          <div style={{ fontSize: 13, color: MUTED, marginTop: 4 }}>
            {progress.answered}/{total}টি উত্তর দেওয়া হয়েছে
            {progress.marked > 0 ? ` · ${progress.marked}টি পরে দেখব` : ''}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, alignItems: 'start' }}>
        {/* Question column */}
        <div>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontWeight: 700, color: '#142B3B' }}>প্রশ্ন {currentQ.n} / {total}</span>
              <button
                type="button"
                onClick={toggleMark}
                aria-pressed={currentAnswer.markedForReview}
                style={{
                  border: `1px solid ${currentAnswer.markedForReview ? MARKED : '#C9D2E0'}`,
                  background: currentAnswer.markedForReview ? '#FFF7E0' : '#fff',
                  color: currentAnswer.markedForReview ? MARKED : '#142B3B',
                  borderRadius: 8,
                  padding: '6px 12px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                {currentAnswer.markedForReview ? '★ পরে দেখব' : '☆ পরে দেখব'}
              </button>
            </div>
            <p style={{ margin: '0 0 16px', fontSize: 17, lineHeight: 1.8, color: '#142B3B', fontWeight: 600 }}>
              {currentQ.questionText}
            </p>
            <div style={{ display: 'grid', gap: 10 }}>
              {currentQ.options.map((o) => {
                const selected = currentAnswer.selected === o.letter;
                const correctLetter = keyAnswer?.correctLetter;
                const showCorrect = isRevealed && o.letter === correctLetter;
                const showWrong = isRevealed && selected && o.letter !== correctLetter;
                return (
                  <button
                    key={o.letter}
                    type="button"
                    onClick={() => choose(o.letter)}
                    aria-pressed={selected}
                    style={{
                      textAlign: 'left',
                      border: showCorrect
                        ? `2px solid ${CORRECT}`
                        : showWrong
                          ? `2px solid ${WRONG}`
                          : selected
                            ? '2px solid #0A1F44'
                            : '1px solid #C9D2E0',
                      background: showCorrect ? '#E6F4F2' : showWrong ? '#FDECEC' : selected ? '#E8EFFA' : '#fff',
                      borderRadius: 10,
                      padding: '12px 14px',
                      cursor: 'pointer',
                      fontSize: 15,
                      lineHeight: 1.7,
                      color: '#142B3B',
                    }}
                  >
                    <span style={{ fontWeight: 700, marginRight: 8 }}>{o.letter}.</span>
                    {o.text}
                    {showCorrect ? <span style={{ float: 'right', color: CORRECT, fontWeight: 700 }}>✓ সঠিক</span> : null}
                    {showWrong ? <span style={{ float: 'right', color: WRONG, fontWeight: 700 }}>✗ ভুল</span> : null}
                  </button>
                );
              })}
            </div>

            {isRevealed && keyAnswer ? (
              <div style={{ marginTop: 16, background: '#F4F7FA', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontWeight: 700, color: isCorrect ? CORRECT : WRONG, marginBottom: 4 }}>
                  {isCorrect ? 'সঠিক উত্তর!' : `সঠিক উত্তর: ${keyAnswer.correctLetter} — ${keyAnswer.correctText}`}
                </div>
                <p style={{ margin: 0, color: '#142B3B', fontSize: 14, lineHeight: 1.7 }}>
                  ব্যাখ্যা: {keyAnswer.explanation}
                </p>
              </div>
            ) : (
              <p style={{ margin: '16px 0 0', color: MUTED, fontSize: 13 }}>
                একটি অপশন বেছে নিলে সঙ্গে সঙ্গে সঠিক/ভুল ও ব্যাখ্যা দেখাবে।
              </p>
            )}
          </Card>

          {/* Sticky bottom bar: prev / palette jump / next / submit. */}
          <div style={{ position: 'sticky', bottom: 0, zIndex: 5, background: '#fff', padding: '12px 0', borderTop: '1px solid #E3E8EF', marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button variant="outline" disabled={currentN <= 1} onClick={() => goTo(currentN - 1)}>
              ← আগেরটি
            </Button>
            <Button variant="outline" disabled={currentN >= total} onClick={() => goTo(currentN + 1)}>
              পরেরটি →
            </Button>
            <span style={{ flex: 1 }} />
            <Button variant="accent" onClick={() => setConfirming(true)}>
              জমা দিন
            </Button>
          </div>

          {confirming ? (
            <Card style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 16 }}>জমা দিতে চান?</div>
              <p style={{ margin: '8px 0 12px', color: MUTED, fontSize: 14, lineHeight: 1.7 }}>
                {progress.answered}/{total}টি উত্তর দেওয়া হয়েছে
                {total - progress.answered > 0 ? ` — ${total - progress.answered}টি উত্তর দেওয়া হয়নি (০ নম্বর পাবে)` : ' — সব প্রশ্নের উত্তর দেওয়া হয়েছে'}।
                জমা দিলে আর বদলানো যাবে না।
              </p>
              {submitError ? <AlertBox tone="error">{submitError}</AlertBox> : null}
              <div style={{ display: 'flex', gap: 8 }}>
                <Button variant="accent" disabled={submitting} onClick={() => void doSubmit()}>
                  {submitting ? 'জমা হচ্ছে…' : 'হ্যাঁ, জমা দিন'}
                </Button>
                <Button variant="outline" disabled={submitting} onClick={() => setConfirming(false)}>
                  ফিরে যান
                </Button>
              </div>
            </Card>
          ) : null}

          <p style={{ marginTop: 16, color: MUTED, fontSize: 13 }}>
            <Link to={`/jobs/${bundle.examSlug}`} style={{ fontWeight: 600 }}>← {bundle.examSlug} হাবে ফিরুন</Link>
            {' · '}অগ্রগতি স্বয়ংক্রিয়ভাবে সংরক্ষিত হয় — মাঝপথে চলে গেলে পরে এসে এই সেটেই আবার শুরু করলে আগের সেশনটি ফিরে পাবেন।
          </p>
        </div>

        {/* Palette column */}
        <div>
          <Card>
            <div style={{ fontWeight: 700, color: '#142B3B', marginBottom: 4 }}>প্রশ্ন-তালিকা</div>
            <p style={{ margin: '0 0 12px', color: MUTED, fontSize: 13 }}>
              সবুজ = সঠিক · লাল = ভুল · ধূসর = উত্তর দেওয়া হয়নি · হলুদ চিহ্ন = পরে দেখব
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(44px, 1fr))', gap: 8 }}>
              {bundle.questions.map((q) => {
                const a = session.answers[q.n];
                const k = key.answers.find((x) => x.n === q.n);
                const answered = a?.selected !== null;
                const correct = answered && k !== undefined && a.selected === k.correctLetter;
                const isCurrent = q.n === currentN;
                return (
                  <button
                    key={q.n}
                    type="button"
                    onClick={() => goTo(q.n)}
                    aria-label={`প্রশ্ন ${q.n}`}
                    style={{
                      height: 44,
                      borderRadius: 8,
                      border: isCurrent ? '2px solid #0A1F44' : '1px solid #C9D2E0',
                      background: answered ? (correct ? '#E6F4F2' : '#FDECEC') : '#fff',
                      color: answered ? (correct ? CORRECT : WRONG) : '#142B3B',
                      fontWeight: 700,
                      cursor: 'pointer',
                      position: 'relative',
                    }}
                  >
                    {q.n}
                    {a?.markedForReview ? (
                      <span style={{ position: 'absolute', top: 2, right: 5, color: MARKED, fontSize: 11 }}>★</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
