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
//   ONE batched write — session → 'submitted' + attempt create
//   (same doc-ID) together → /jobs/result/:attemptId. Idempotent:
//   an existing attempt is returned, never re-written. No receipt
//   is created (practice keys need none — see
//   src/lib/jobPractice.ts header).
//
// Step 8 fold-in (finding 3): difficulty IS denormalized into
// the bundle at build time, so the mode order runs — the stored
// questionRefs sequence is the mode order (beginner easy→hard,
// advanced medium→hard→easy) and the palette + prev/next follow
// that sequence, while every question keeps its bundle `n`.
// "ভুল প্রশ্নগুলো আবার অনুশীলন করুন" re-runs the whole bundle;
// a wrong-only session is Step 13's /jobs/wrong-answers
// re-practice flow (a real subset session, not a rebuild).
//
// LANGUAGE: UI text is Bangla + English via useLanguage().
// Question content (questionText, options, explanations) stays in
// its source language — it is data, not UI strings.

import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { loginState } from '../lib/loginReturn';
import { PageShell } from '../components/PageShell';
import { AlertBox, Button, Card, Chip, ProgressBar, Skeleton } from '../components/ui';
import { useAuth } from '../lib/auth';
import { useLanguage } from '../i18n/LanguageContext';
import {
  answerSessionQuestion,
  buildAutosavePatch,
  goToQuestion,
  jobExamPattern,
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
import { useJobMode } from '../lib/jobMode';
import { useActiveClock } from '../lib/activeStudyTime';
import QuestionReportButton from '../components/QuestionReportButton';

type Phase = 'loading' | 'signed-out' | 'error' | 'ready';
type SaveState = 'saved' | 'saving' | 'error';

const CORRECT = '#12766E';
const WRONG = '#B00020';
const MUTED = '#68747B';
const MARKED = '#8A6100';

export default function JobPracticePage() {
  const { scope = '' } = useParams<{ scope: string }>();
  const { user } = useAuth();
  const location = useLocation();
  // Sections audit (24 Nov 2026): return here after sign-in.
  const back = loginState(location.pathname + location.search);
  const { t, lang } = useLanguage();
  // Step 8 fold-in (finding 3): the mode decides the stored
  // question order at session start (beginner easy-first,
  // advanced medium-first). The mode is read once here — a
  // resumed session re-reads its STORED order, it is never
  // re-sorted, so a mid-session mode switch cannot scramble it.
  const { mode } = useJobMode();
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

  // Per-question time: ACTIVE seconds only (Step 12). The old
  // wall-clock flush counted idle-tab time as study time; the
  // active clock (src/lib/activeStudyTime.ts) pauses on tab-hide
  // / window-blur and after 90s without interaction, and flushes
  // into the session on navigation and on submit (time is
  // informational). questionRef holds the currently open
  // question number — the clock itself owns only time.
  const questionRef = useRef<number>(1);
  const activeClock = useActiveClock();
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
          setError(t({ bn: 'এই অনুশীলন সেটটি পাওয়া যায়নি — হয় ঠিকানাটি ভুল, নয় সেটটি এখনো প্রকাশিত হয়নি।', en: 'This practice set was not found — the address may be wrong, or the set has not been published yet.' }));
          setPhase('error');
          return;
        }
        if (b.status !== 'published') {
          setError(t({ bn: 'এই অনুশীলন সেটটি এখনো প্রকাশিত হয়নি — শিক্ষক যাচাইয়ের পর প্রকাশিত হবে।', en: 'This practice set has not been published yet — it will be published after teacher review.' }));
          setPhase('error');
          return;
        }
        if (b.kind !== 'topic' && b.kind !== 'previous') {
          setError(t({ bn: 'এটি মক-ধরনের সেট — অনুশীলন এখানে নয়, মক টেস্ট থেকে দিতে হবে।', en: 'This is a mock-type set — take it from the Mock Test section, not here.' }));
          setPhase('error');
          return;
        }
        if (b.questions.length === 0) {
          setError(t({ bn: 'এই সেটে এখনো কোনো প্রশ্ন নেই।', en: 'This set has no questions yet.' }));
          setPhase('error');
          return;
        }
        if (!k) {
          setError(t({ bn: 'এই সেটের উত্তর-চাবি পাওয়া যায়নি — অনুশীলন চালানো যাবে না।', en: "This set's answer key was not found — practice cannot run." }));
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
          writtenRevisionRef.current = resumed.session.revision;
          setStartedAtMillis(resumed.startedAtMillis);
          questionRef.current = resumed.session.currentQuestion;
          activeClock.start(Date.now());
          const rev: Record<number, boolean> = {};
          for (const [n, a] of Object.entries(resumed.session.answers)) {
            if (a.selected !== null) rev[Number(n)] = true;
          }
          setRevealed(rev);
        } else {
          const started = await startPracticeSession(user.uid, b, mode);
          if (!alive) return;
          setBundle(b);
          setKey(k);
          setSessionId(started.sessionId);
          setSession(started.session);
          writtenRevisionRef.current = started.session.revision;
          setStartedAtMillis(started.startedAtMillis);
          questionRef.current = started.session.currentQuestion;
          activeClock.start(Date.now());
        }
        setPhase('ready');
      } catch (e) {
        if (!alive) return;
        setError(e instanceof Error ? e.message : t({ bn: 'অনুশীলন শুরু করা যায়নি — আবার চেষ্টা করুন।', en: 'Practice could not be started — please try again.' }));
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
  // Revision tracking (Step 8 fold-in, finding 6): the rules accept
  // an autosave ONLY at exactly stored revision + 1, and the local
  // session object does NOT advance on every edit — so the last
  // WRITTEN revision lives in this ref, not in state. It is set
  // when the session loads (new: 1, resumed: stored revision) and
  // advanced ONLY on a successful write; a failed write keeps the
  // old value so the next attempt retries with the same revision.
  // The ref is never written into state, so a successful save does
  // not retrigger this effect.
  const writtenRevisionRef = useRef<number | null>(null);
  const firstSaveRef = useRef(true);
  useEffect(() => {
    if (!session || !user || phase !== 'ready') return;
    if (firstSaveRef.current) {
      firstSaveRef.current = false;
      return;
    }
    setSaveState('saving');
    const t = setTimeout(() => {
      const base = writtenRevisionRef.current ?? session.revision;
      const patch = { ...buildAutosavePatch(session), revision: base + 1 };
      autosaveSession(user.uid, sessionId, patch)
        .then(() => {
          writtenRevisionRef.current = patch.revision;
          setSaveState('saved');
        })
        .catch(() => setSaveState('error'));
    }, 1200);
    return () => clearTimeout(t);
  }, [session, user, sessionId, phase]);

  if (phase === 'loading') {
    return (
      <PageShell titleBn="অনুশীলন" titleEn="Practice" wide>
        <Skeleton />
      </PageShell>
    );
  }

  if (phase === 'signed-out') {
    return (
      <PageShell titleBn="অনুশীলন" titleEn="Practice" wide>
        <Card>
          <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 17 }}>{t({ bn: 'অনুশীলন করতে লগইন করুন', en: 'Log in to practise' })}</div>
          <p style={{ margin: '8px 0 12px', color: MUTED, fontSize: 14, lineHeight: 1.7 }}>
            {t({ bn: 'অনুশীলন শুধু লগইন করা শিক্ষার্থীদের জন্য — আপনার উত্তর ও অগ্রগতি সংরক্ষিত হয়।', en: 'Practice is only for logged-in students — your answers and progress are saved.' })}
          </p>
          <Link to="/login" state={back} style={{ fontWeight: 600 }}>{t({ bn: 'লগইন করুন →', en: 'Log in →' })}</Link>
        </Card>
      </PageShell>
    );
  }

  if (phase === 'error' || !bundle || !key || !session) {
    return (
      <PageShell titleBn="অনুশীলন" titleEn="Practice" wide>
        <AlertBox tone="error">{error || t({ bn: 'অনুশীলন শুরু করা যায়নি।', en: 'Practice could not be started.' })}</AlertBox>
        <p style={{ marginTop: 16 }}>
          <Link to="/jobs" style={{ fontWeight: 600 }}>{t({ bn: '← সব পরীক্ষা দেখুন', en: '← See all exams' })}</Link>
        </p>
      </PageShell>
    );
  }

  const total = bundle.questions.length;
  const progress = sessionProgress(session);
  // Step 8 fold-in (ChatGPT finding 2, preferred option): Bank
  // negative marking is DISABLED until the circular verifies it —
  // say so explicitly BEFORE the session, not just on the result.
  const pattern = jobExamPattern(bundle.examSlug);
  const scoringNotice =
    pattern && !pattern.negativeMarkingVerified
      ? t({ bn: 'এই পরীক্ষার নেগেটিভ মার্কিং এখনো বিজ্ঞপ্তি থেকে যাচাই হয়নি — তাই ভুল উত্তরে নম্বর কাটা হচ্ছে না। এই স্কোর অফিসিয়াল ধরনের স্কোর নয়।', en: "This exam's negative marking has not been verified from the circular yet — so wrong answers do not lose marks. This score is not an official-style score." })
      : null;
  const currentN = session.currentQuestion;
  // Step 8 fold-in (finding 3): navigation follows the STORED
  // questionRefs sequence (mode order), not bundle position.
  // Legacy sessions without a matching refs sequence fall back
  // to bundle order; `n` values are bundle numbers throughout.
  const orderedNs =
    session.questionRefs.length === total
    && session.questionRefs.every((r) => bundle.questions.some((q) => q.n === r.n))
      ? session.questionRefs.map((r) => r.n)
      : bundle.questions.map((q) => q.n);
  const currentIdx = Math.max(0, orderedNs.indexOf(currentN));
  const currentQ = bundle.questions.find((q) => q.n === currentN) ?? bundle.questions[0];
  const currentAnswer = session.answers[currentQ.n];
  const keyAnswer = key.answers.find((a) => a.n === currentQ.n);
  const isRevealed = revealed[currentQ.n] === true;
  const isCorrect = isRevealed && currentAnswer.selected !== null && keyAnswer !== undefined && currentAnswer.selected === keyAnswer.correctLetter;

  // Flush the ACTIVE seconds for the open question into the
  // session (Step 12: idle-tab time is never recorded). flush()
  // restarts the clock when active, so goTo needs no explicit
  // start; a click resumes an idle-parked clock first
  // (pointerdown fires before click).
  function flushTime(): { n: number; elapsed: number } {
    const elapsed = activeClock.flush(Date.now());
    const n = questionRef.current;
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
    questionRef.current = n;
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
      setSubmitError(e instanceof Error ? e.message : t({ bn: 'জমা দেওয়া যায়নি — আবার চেষ্টা করুন।', en: 'Could not be submitted — please try again.' }));
      setSubmitting(false);
      setConfirming(false);
    }
  }

  const saveLabel =
    saveState === 'saving'
      ? t({ bn: 'সংরক্ষণ হচ্ছে…', en: 'Saving…' })
      : saveState === 'error'
        ? t({ bn: 'সংরক্ষণ হয়নি — আবার চেষ্টা করা হবে', en: 'Not saved — will retry' })
        : t({ bn: 'সংরক্ষিত', en: 'Saved' });

  return (
    <PageShell titleBn={bundle.titleBn} titleEn={bundle.titleEn} wide maxWidth={1240}>
      {/* Sticky top bar: exam + progress + autosave state. Practice
          is untimed — no timer is shown (Step 2 §3.4). */}
      <div style={{ position: 'sticky', top: 0, zIndex: 5, background: '#fff', padding: '10px 0 8px', borderBottom: '1px solid #E3E8EF', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 16 }}>{lang === 'bn' ? bundle.titleBn : bundle.titleEn}</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: MUTED }}>
            <Chip tone="outline">{t({ bn: 'অনুশীলন — টাইমার নেই', en: 'Practice — no timer' })}</Chip>
            <span>{saveLabel}</span>
          </div>
        </div>
        <div style={{ marginTop: 8 }}>
          <ProgressBar value={total === 0 ? 0 : (progress.answered / total) * 100} />
          <div style={{ fontSize: 13, color: MUTED, marginTop: 4 }}>
            {t({ bn: `${progress.answered}/${total}টি উত্তর দেওয়া হয়েছে`, en: `${progress.answered}/${total} answered` })}
            {progress.marked > 0 ? t({ bn: ` · ${progress.marked}টি পরে দেখব`, en: ` · ${progress.marked} to review later` }) : ''}
          </div>
        </div>
      </div>

      {scoringNotice ? (
        <AlertBox tone="info">{scoringNotice}</AlertBox>
      ) : null}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, alignItems: 'start' }}>
        {/* Question column */}
        <div>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontWeight: 700, color: '#142B3B' }}>{t({ bn: `প্রশ্ন ${currentQ.n} / ${total}`, en: `Question ${currentQ.n} / ${total}` })}</span>
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
                {currentAnswer.markedForReview ? t({ bn: '★ পরে দেখব', en: '★ Review later' }) : t({ bn: '☆ পরে দেখব', en: '☆ Review later' })}
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
                    {showCorrect ? <span style={{ float: 'right', color: CORRECT, fontWeight: 700 }}>{t({ bn: '✓ সঠিক', en: '✓ Correct' })}</span> : null}
                    {showWrong ? <span style={{ float: 'right', color: WRONG, fontWeight: 700 }}>{t({ bn: '✗ ভুল', en: '✗ Wrong' })}</span> : null}
                  </button>
                );
              })}
            </div>

            {isRevealed && keyAnswer ? (
              <div style={{ marginTop: 16, background: '#F4F7FA', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontWeight: 700, color: isCorrect ? CORRECT : WRONG, marginBottom: 4 }}>
                  {isCorrect ? t({ bn: 'সঠিক উত্তর!', en: 'Correct answer!' }) : t({ bn: `সঠিক উত্তর: ${keyAnswer.correctLetter} — ${keyAnswer.correctText}`, en: `Correct answer: ${keyAnswer.correctLetter} — ${keyAnswer.correctText}` })}
                </div>
                <p style={{ margin: 0, color: '#142B3B', fontSize: 14, lineHeight: 1.7 }}>
                  {t({ bn: 'ব্যাখ্যা:', en: 'Explanation:' })} {keyAnswer.explanation}
                </p>
              </div>
            ) : (
              <p style={{ margin: '16px 0 0', color: MUTED, fontSize: 13 }}>
                {t({ bn: 'একটি অপশন বেছে নিলে সঙ্গে সঙ্গে সঠিক/ভুল ও ব্যাখ্যা দেখাবে।', en: 'Choosing an option shows the correct/wrong mark and explanation right away.' })}
              </p>
            )}
            <QuestionReportButton questionId={currentQ.questionId} questionText={currentQ.questionText} />
          </Card>

          {/* Sticky bottom bar: prev / palette jump / next / submit. */}
          <div style={{ position: 'sticky', bottom: 0, zIndex: 5, background: '#fff', padding: '12px 0', borderTop: '1px solid #E3E8EF', marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button variant="outline" disabled={currentIdx <= 0} onClick={() => goTo(orderedNs[currentIdx - 1])}>
              {t({ bn: '← আগেরটি', en: '← Previous' })}
            </Button>
            <Button variant="outline" disabled={currentIdx >= total - 1} onClick={() => goTo(orderedNs[currentIdx + 1])}>
              {t({ bn: 'পরেরটি →', en: 'Next →' })}
            </Button>
            <span style={{ flex: 1 }} />
            <Button variant="accent" onClick={() => setConfirming(true)}>
              {t({ bn: 'জমা দিন', en: 'Submit' })}
            </Button>
          </div>

          {confirming ? (
            <Card style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 16 }}>{t({ bn: 'জমা দিতে চান?', en: 'Submit?' })}</div>
              <p style={{ margin: '8px 0 12px', color: MUTED, fontSize: 14, lineHeight: 1.7 }}>
                {t({ bn: `${progress.answered}/${total}টি উত্তর দেওয়া হয়েছে`, en: `${progress.answered}/${total} answered` })}
                {total - progress.answered > 0 ? t({ bn: ` — ${total - progress.answered}টি উত্তর দেওয়া হয়নি (০ নম্বর পাবে)`, en: ` — ${total - progress.answered} unanswered (scores 0)` }) : t({ bn: ' — সব প্রশ্নের উত্তর দেওয়া হয়েছে', en: ' — all questions answered' })}।
                {t({ bn: 'জমা দিলে আর বদলানো যাবে না।', en: 'Once submitted, answers cannot be changed.' })}
              </p>
              {submitError ? <AlertBox tone="error">{submitError}</AlertBox> : null}
              <div style={{ display: 'flex', gap: 8 }}>
                <Button variant="accent" disabled={submitting} onClick={() => void doSubmit()}>
                  {submitting ? t({ bn: 'জমা হচ্ছে…', en: 'Submitting…' }) : t({ bn: 'হ্যাঁ, জমা দিন', en: 'Yes, submit' })}
                </Button>
                <Button variant="outline" disabled={submitting} onClick={() => setConfirming(false)}>
                  {t({ bn: 'ফিরে যান', en: 'Go back' })}
                </Button>
              </div>
            </Card>
          ) : null}

          <p style={{ marginTop: 16, color: MUTED, fontSize: 13 }}>
            <Link to={`/jobs/${bundle.examSlug}`} style={{ fontWeight: 600 }}>{t({ bn: `← ${bundle.examSlug} হাবে ফিরুন`, en: `← Back to the ${bundle.examSlug} hub` })}</Link>
            {' · '}{t({ bn: 'অগ্রগতি স্বয়ংক্রিয়ভাবে সংরক্ষিত হয় — মাঝপথে চলে গেলে পরে এসে এই সেটেই আবার শুরু করলে আগের সেশনটি ফিরে পাবেন।', en: 'Progress is saved automatically — if you leave midway, coming back to this set resumes your previous session.' })}
          </p>
        </div>

        {/* Palette column */}
        <div>
          <Card>
            <div style={{ fontWeight: 700, color: '#142B3B', marginBottom: 4 }}>{t({ bn: 'প্রশ্ন-তালিকা', en: 'Question list' })}</div>
            <p style={{ margin: '0 0 12px', color: MUTED, fontSize: 13 }}>
              {t({ bn: 'সবুজ = সঠিক · লাল = ভুল · ধূসর = উত্তর দেওয়া হয়নি · হলুদ চিহ্ন = পরে দেখব', en: 'Green = correct · Red = wrong · Grey = unanswered · Yellow star = review later' })}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(44px, 1fr))', gap: 8 }}>
              {orderedNs.map((n) => {
                const q = bundle.questions.find((x) => x.n === n) ?? bundle.questions[0];
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
                    aria-label={t({ bn: `প্রশ্ন ${q.n}`, en: `Question ${q.n}` })}
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
