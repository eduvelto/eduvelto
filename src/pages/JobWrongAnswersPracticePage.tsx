// Eduvelto — Job wrong-answer re-practice page (Step 13).
//
// /jobs/wrong-answers/practice/:topicId — one topic's wrong
// questions (+ fresh same-topic questions) as a real practice
// session. The session anchors to the REAL published topic
// bundle (its docId + bundleVersion), but its questionRefs
// are the PLANNED SUBSET only — the stored attempt is a
// normal practice attempt over that subset, so the notebook
// derivation (which reads stored attempts) sees the answers
// and advances each question's 0→1→2 streak. Scoring uses
// the matching in-memory subset bundle + subset key
// (buildSubsetBundle / buildSubsetKey); nothing is guessed.
//
// The session order is: the review questions first (the
// original wrong questions — revisit), then the fresh
// same-topic questions (transfer check). A correct answer on
// a FRESH question does not clear the original — there is no
// concept mapping in the bank to prove it tests the same
// concept (see src/lib/jobWrongAnswers.ts). The original
// clears only by its own two consecutive corrects, in two
// distinct attempts.
//
// NO resume: a fresh session starts every time. An
// unfinished session is ABANDONED when the student leaves
// (best-effort, on unmount + on the explicit exit button),
// so a half-done subset can never be resumed later as if it
// were a full-bundle practice session for the same bundleId
// (the normal practice page resumes the latest in-progress
// session for a bundle — a leftover subset would corrupt
// that flow). A refresh / tab-close skips the cleanup —
// that leftover is the known limitation, recoverable via the
// dashboard's discard flow; it never corrupts stored data.
//
// LANGUAGE: UI text is Bangla + English via useLanguage().
    // Question content stays in its source language.

import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { AlertBox, Button, Card, Chip, ProgressBar, Skeleton } from '../components/ui';
import { useAuth } from '../lib/auth';
import { useLanguage } from '../i18n/LanguageContext';
import {
  answerSessionQuestion,
  buildAutosavePatch,
  goToQuestion,
  jobExamPattern,
  jobTopicLabel,
  sessionProgress,
  toggleMarkForReview,
  type JobPracticeSessionDoc,
  type JobSessionAnswerSelection,
} from '../lib/jobEngine';
import {
  autosaveSession,
  abandonPracticeSession,
  loadBundleKey,
  loadPracticeBundle,
  startWrongAnswersSession,
  submitPracticeAttempt,
  type PracticeBundleWithId,
} from '../lib/jobPractice';
import type { JobQuestionBundle, JobQuestionKey } from '../lib/jobQuestions';
import { useActiveClock } from '../lib/activeStudyTime';
import {
  buildSubsetBundle,
  buildSubsetKey,
  deriveNotebook,
  planWrongAnswersSession,
  type PlannedSessionItem,
} from '../lib/jobWrongAnswers';
import { loadNotebookAttempts } from '../lib/jobWrongAnswersData';

type Phase = 'loading' | 'signed-out' | 'error' | 'ready' | 'empty';
type SaveState = 'saved' | 'saving' | 'error';

const CORRECT = '#12766E';
const WRONG = '#B00020';
const MARKED = '#8A6100';

export default function JobWrongAnswersPracticePage() {
  const { topicId = '' } = useParams<{ topicId: string }>();
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const stateQuestionIds = (location.state as { questionIds?: string[] } | null)?.questionIds;

  const [phase, setPhase] = useState<Phase>('loading');
  const [error, setError] = useState('');
  const [bundle, setBundle] = useState<PracticeBundleWithId | null>(null);
  const [subsetBundle, setSubsetBundle] = useState<JobQuestionBundle | null>(null);
  const [subsetKey, setSubsetKey] = useState<JobQuestionKey | null>(null);
  const [items, setItems] = useState<PlannedSessionItem[]>([]);
  const [preStreak, setPreStreak] = useState<Map<string, number>>(new Map());
  const [wrongCounts, setWrongCounts] = useState<Map<string, number>>(new Map());
  const [droppedMissing, setDroppedMissing] = useState(0);
  const [droppedCap, setDroppedCap] = useState(0);
  const [noFreshLeft, setNoFreshLeft] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [session, setSession] = useState<JobPracticeSessionDoc | null>(null);
  const [startedAtMillis, setStartedAtMillis] = useState(0);
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [saveState, setSaveState] = useState<SaveState>('saved');

  const questionRef = useRef<number>(1);
  const activeClock = useActiveClock();
  const startedRef = useRef(false);
  const sessionRef = useRef<JobPracticeSessionDoc | null>(null);
  const sessionIdRef = useRef('');
  const submittedRef = useRef(false);
  const writtenRevisionRef = useRef<number | null>(null);
  const firstSaveRef = useRef(true);
  // The unmount cleanup (below) closes over mount-time values,
  // so the uid lives in a ref that tracks the auth state.
  const uidRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    uidRef.current = user?.uid;
  }, [user]);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  // Abandon an unfinished session when the student leaves
  // (see the file header — a leftover subset must never be
  // resumed as a full-bundle session). Best-effort: a
  // submitted session returns 'submitted' and is untouched.
  useEffect(() => {
    return () => {
      const id = sessionIdRef.current;
      const uid = uidRef.current;
      if (id && uid && !submittedRef.current) {
        void abandonPracticeSession(uid, id).catch(() => {
          // Best-effort only — leaving the page must never
          // surface an error.
        });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load attempts + topic bundle + key, plan the session,
  // then start a fresh subset session.
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
        const bundleId = `topic__${topicId}`;
        const [{ attempts }, b, k] = await Promise.all([
          loadNotebookAttempts(user.uid),
          loadPracticeBundle(bundleId),
          loadBundleKey(bundleId),
        ]);
        if (!alive) return;
        if (!b) {
          setError(t({ bn: 'এই টপিকের অনুশীলন সেটটি পাওয়া যায়নি — হয় ঠিকানাটি ভুল, নয় সেটটি এখনো প্রকাশিত হয়নি।', en: "This topic's practice set was not found — the address may be wrong, or the set has not been published yet." }));
          setPhase('error');
          return;
        }
        if (b.status !== 'published') {
          setError(t({ bn: 'এই টপিকের অনুশীলন সেটটি এখনো প্রকাশিত হয়নি — শিক্ষক যাচাইয়ের পর প্রকাশিত হবে।', en: "This topic's practice set has not been published yet — it will be published after teacher review." }));
          setPhase('error');
          return;
        }
        if (b.kind !== 'topic') {
          setError(t({ bn: 'এটি টপিক-ধরনের সেট নয় — ভুল-উত্তর অনুশীলন এখানে নয়।', en: 'This is not a topic-type set — wrong-answer practice does not run here.' }));
          setPhase('error');
          return;
        }
        if (!k) {
          setError(t({ bn: 'এই সেটের উত্তর-চাবি পাওয়া যায়নি — অনুশীলন চালানো যাবে না।', en: "This set's answer key was not found — practice cannot run." }));
          setPhase('error');
          return;
        }
        const entries = deriveNotebook(attempts).filter(
          (e) => e.topicId === topicId && e.status === 'active',
        );
        const wanted = stateQuestionIds && stateQuestionIds.length > 0
          ? entries.filter((e) => stateQuestionIds.includes(e.questionId))
          : entries;
        if (wanted.length === 0) {
          setPhase('empty');
          return;
        }
        const answeredIds = new Set(attempts.flatMap((a) => a.answers.map((x) => x.questionId)));
        const planned = planWrongAnswersSession({ topicEntries: wanted, bundle: b, answeredQuestionIds: answeredIds });
        if (planned.items.length === 0) {
          setPhase('empty');
          return;
        }
        const sub = buildSubsetBundle(b, planned.items);
        const subKey = buildSubsetKey(k, planned.items);
        const started = await startWrongAnswersSession(
          user.uid,
          b,
          planned.items.map((i) => ({ n: i.question.n, questionId: i.question.questionId })),
        );
        if (!alive) return;
        setBundle(b);
        setSubsetBundle(sub);
        setSubsetKey(subKey);
        setItems(planned.items);
        setPreStreak(new Map(wanted.map((e) => [e.questionId, e.consecutiveCorrect])));
        setWrongCounts(new Map(wanted.map((e) => [e.questionId, e.wrongCount])));
        setDroppedMissing(planned.droppedMissing.length);
        setDroppedCap(planned.droppedCap.length);
        setNoFreshLeft(planned.noFreshLeft);
        setSessionId(started.sessionId);
        sessionIdRef.current = started.sessionId;
        setSession(started.session);
        writtenRevisionRef.current = started.session.revision;
        setStartedAtMillis(started.startedAtMillis);
        questionRef.current = started.session.currentQuestion;
        activeClock.start(Date.now());
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, topicId]);

  // Debounced autosave (same revision discipline as
  // JobPracticePage: the rules accept exactly stored + 1).
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

  async function exitWithoutSubmitting() {
    const id = sessionIdRef.current;
    if (id && user && !submittedRef.current) {
      await abandonPracticeSession(user.uid, id).catch(() => undefined);
    }
    navigate('/jobs/wrong-answers');
  }

  if (phase === 'loading') {
    return (
      <PageShell titleBn="ভুল-উত্তর অনুশীলন" titleEn="Wrong-Answer Practice" wide>
        <Skeleton />
      </PageShell>
    );
  }

  if (phase === 'signed-out') {
    return (
      <PageShell titleBn="ভুল-উত্তর অনুশীলন" titleEn="Wrong-Answer Practice" wide>
        <Card>
          <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 17 }}>{t({ bn: 'অনুশীলন করতে লগইন করুন', en: 'Log in to practise' })}</div>
          <p style={{ margin: '8px 0 12px', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
            {t({ bn: 'অনুশীলন শুধু লগইন করা শিক্ষার্থীদের জন্য — আপনার উত্তর ও অগ্রগতি সংরক্ষিত হয়।', en: 'Practice is only for logged-in students — your answers and progress are saved.' })}
          </p>
          <Link to="/login" style={{ fontWeight: 600 }}>{t({ bn: 'লগইন করুন →', en: 'Log in →' })}</Link>
        </Card>
      </PageShell>
    );
  }

  if (phase === 'empty') {
    return (
      <PageShell titleBn="ভুল-উত্তর অনুশীলন" titleEn="Wrong-Answer Practice" wide>
        <Card>
          <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 17 }}>{t({ bn: 'এই টপিকে অনুশীলনের মতো ভুল প্রশ্ন নেই', en: 'No wrong questions in this topic to practise' })}</div>
          <p style={{ margin: '8px 0 12px', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
            {t({ bn: 'হয় এই টপিকের ভুল প্রশ্নগুলো শেখা হয়ে গেছে, নয় এখনো এই টপিকে কোনো ভুল হয়নি।', en: "Either this topic's wrong questions have been learned, or there has been no mistake in this topic yet." })}
          </p>
          <Link to="/jobs/wrong-answers" style={{ fontWeight: 600 }}>{t({ bn: '← নোটবুকে ফিরুন', en: '← Back to the notebook' })}</Link>
        </Card>
      </PageShell>
    );
  }

  if (phase === 'error' || !bundle || !subsetBundle || !subsetKey || !session) {
    return (
      <PageShell titleBn="ভুল-উত্তর অনুশীলন" titleEn="Wrong-Answer Practice" wide>
        <AlertBox tone="error">{error || t({ bn: 'অনুশীলন শুরু করা যায়নি।', en: 'Practice could not be started.' })}</AlertBox>
        <p style={{ marginTop: 16 }}>
          <Link to="/jobs/wrong-answers" style={{ fontWeight: 600 }}>{t({ bn: '← নোটবুকে ফিরুন', en: '← Back to the notebook' })}</Link>
        </p>
      </PageShell>
    );
  }

  const total = subsetBundle.questions.length;
  const progress = sessionProgress(session);
  const pattern = jobExamPattern(bundle.examSlug);
  const scoringNotice =
    pattern && !pattern.negativeMarkingVerified
      ? t({ bn: 'এই পরীক্ষার নেগেটিভ মার্কিং এখনো বিজ্ঞপ্তি থেকে যাচাই হয়নি — তাই ভুল উত্তরে নম্বর কাটা হচ্ছে না। এই স্কোর অফিসিয়াল ধরনের স্কোর নয়।', en: "This exam's negative marking has not been verified from the circular yet — so wrong answers do not lose marks. This score is not an official-style score." })
      : null;
  const currentN = session.currentQuestion;
  const orderedNs = session.questionRefs.map((r) => r.n);
  const currentIdx = Math.max(0, orderedNs.indexOf(currentN));
  const currentQ = subsetBundle.questions.find((q) => q.n === currentN) ?? subsetBundle.questions[0];
  const currentItem = items.find((i) => i.question.n === currentN);
  const currentAnswer = session.answers[currentQ.n];
  const keyAnswer = subsetKey.answers.find((a) => a.n === currentQ.n);
  const isRevealed = revealed[currentQ.n] === true;
  const isCorrect = isRevealed && currentAnswer.selected !== null && keyAnswer !== undefined && currentAnswer.selected === keyAnswer.correctLetter;

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
    if (!orderedNs.includes(n)) return;
    flushTime();
    questionRef.current = n;
    setSession((prev) => (prev ? goToQuestion(prev, n) : prev));
  }

  function choose(letter: JobSessionAnswerSelection) {
    if (!session) return;
    setSession((prev) => {
      if (!prev) return prev;
      return answerSessionQuestion(prev, currentQ.n, letter);
    });
    setRevealed((prev) => ({ ...prev, [currentQ.n]: true }));
  }

  function toggleMark() {
    setSession((prev) => (prev ? toggleMarkForReview(prev, currentQ.n) : prev));
  }

  async function doSubmit() {
    const liveSession = sessionRef.current;
    if (!user || !bundle || !subsetBundle || !subsetKey || !liveSession) return;
    setSubmitting(true);
    setSubmitError('');
    const flushed = flushTime();
    try {
      const answers = subsetBundle.questions.map((q) => {
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
        bundle: { ...subsetBundle, docId: bundle.docId },
        bundleId: bundle.docId,
        key: subsetKey,
        answers,
        startedAtMillis,
        submittedAtMillis: Date.now(),
      });
      // Which review questions JUST cleared (pre-session
      // streak 1 + correct in this session = 2nd consecutive
      // correct)? The result page shows the banner for them.
      const justCleared = items
        .filter((i) => i.isReview)
        .filter((i) => (preStreak.get(i.question.questionId) ?? 0) === 1)
        .filter((i) => {
          const a = answers.find((x) => x.questionId === i.question.questionId);
          const k = subsetKey.answers.find((x) => x.questionId === i.question.questionId);
          return a?.selected !== null && a?.selected !== undefined && k !== undefined && a.selected === k.correctLetter;
        })
        .map((i) => i.question.questionId);
      submittedRef.current = true;
      navigate(`/jobs/result/${attemptId}`, {
        state: { fromWrongAnswers: true, clearedCount: justCleared.length, clearedQuestionIds: justCleared },
      });
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
  const reviewCount = items.filter((i) => i.isReview).length;
  const freshCount = items.length - reviewCount;

  return (
    <PageShell titleBn={`${jobTopicLabel(topicId, 'bn')} — ভুল-উত্তর অনুশীলন`} titleEn={`${jobTopicLabel(topicId, 'en')} — Wrong-Answer Practice`} wide maxWidth={1240}>
      <div style={{ position: 'sticky', top: 0, zIndex: 5, background: '#fff', padding: '10px 0 8px', borderBottom: '1px solid #E3E8EF', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 16 }}>{t({ bn: `${bundle.titleBn} — ভুল-উত্তর অনুশীলন`, en: `${bundle.titleEn} — Wrong-Answer Practice` })}</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: 'var(--muted)' }}>
            <Chip tone="outline">{t({ bn: 'অনুশীলন — টাইমার নেই', en: 'Practice — no timer' })}</Chip>
            <span>{saveLabel}</span>
          </div>
        </div>
        <div style={{ marginTop: 8 }}>
          <ProgressBar value={total === 0 ? 0 : (progress.answered / total) * 100} />
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
            {t({ bn: `${progress.answered}/${total}টি উত্তর দেওয়া হয়েছে`, en: `${progress.answered}/${total} answered` })}
            {progress.marked > 0 ? t({ bn: ` · ${progress.marked}টি পরে দেখব`, en: ` · ${progress.marked} to review later` }) : ''}
            {t({ bn: ` · ${reviewCount}টি আগের ভুল প্রশ্ন${freshCount > 0 ? ` + ${freshCount}টি নতুন প্রশ্ন` : ''}`, en: ` · ${reviewCount} earlier wrong question${reviewCount === 1 ? '' : 's'}${freshCount > 0 ? ` + ${freshCount} new question${freshCount === 1 ? '' : 's'}` : ''}` })}
          </div>
        </div>
      </div>

      {scoringNotice ? <AlertBox tone="info">{scoringNotice}</AlertBox> : null}
      {droppedMissing > 0 || droppedCap > 0 ? (
        <AlertBox tone="info">
          {[
            droppedMissing > 0 ? t({ bn: `${droppedMissing}টি প্রশ্ন এই সেটে আর নেই বলে বাদ দেওয়া হয়েছে`, en: `${droppedMissing} question${droppedMissing === 1 ? '' : 's'} dropped because ${droppedMissing === 1 ? 'it is' : 'they are'} no longer in this set` }) : '',
            droppedCap > 0 ? t({ bn: `${droppedCap}টি প্রশ্ন সেশনের সীমার জন্য বাদ দেওয়া হয়েছে`, en: `${droppedCap} question${droppedCap === 1 ? '' : 's'} dropped for the session limit` }) : '',
          ].filter(Boolean).join(' · ')}
          {lang === 'bn' ? '।' : '.'}
        </AlertBox>
      ) : null}
      {noFreshLeft ? <AlertBox tone="info">{t({ bn: 'এই টপিকের সব প্রশ্নই আগে চেষ্টা করা হয়েছে — নতুন প্রশ্ন আর নেই, তাই শুধু ভুল প্রশ্নগুলোই আছে।', en: 'Every question in this topic has been tried before — there are no new questions left, so only the wrong questions are here.' })}</AlertBox> : null}
      <p style={{ margin: '0 0 16px', color: 'var(--muted)', fontSize: 13, lineHeight: 1.7 }}>
        {t({ bn: 'এই সেশনে মূল ভুল প্রশ্নগুলোই আছে — একই প্রশ্ন বারবার মনে রাখা শেখা নয়; একই টপিকের নতুন প্রশ্নে নিয়মটি প্রয়োগ করতে পারাই আসল শেখা। একটি প্রশ্ন নোটবুক থেকে সরবে যখন তা পরপর ২ বার সঠিক হবে — এই সেশনের সঠিক উত্তর সেই হিসাবেই জমা হবে।', en: 'This session holds the original wrong questions — memorising the same question is not learning; applying the rule to a new question from the same topic is real learning. A question leaves the notebook when it is correct 2 times in a row — correct answers in this session count toward that.' })}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, alignItems: 'start' }}>
        <div>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontWeight: 700, color: 'var(--heading)' }}>
                {t({ bn: `প্রশ্ন ${currentIdx + 1} / ${total}`, en: `Question ${currentIdx + 1} / ${total}` })}
                {' '}
                <Chip tone={currentItem?.isReview ? 'gold' : 'blue'}>
                  {currentItem?.isReview ? t({ bn: 'আগের ভুল প্রশ্ন', en: 'Earlier wrong question' }) : t({ bn: 'নতুন প্রশ্ন', en: 'New question' })}
                </Chip>
              </span>
              <button
                type="button"
                onClick={toggleMark}
                aria-pressed={currentAnswer.markedForReview}
                style={{
                  border: `1px solid ${currentAnswer.markedForReview ? MARKED : '#C9D2E0'}`,
                  background: currentAnswer.markedForReview ? '#FFF7E0' : '#fff',
                  color: currentAnswer.markedForReview ? MARKED : 'var(--heading)',
                  borderRadius: 8,
                  padding: '6px 12px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                {currentAnswer.markedForReview ? t({ bn: '★ পরে দেখব', en: '★ Review later' }) : t({ bn: '☆ পরে দেখব', en: '☆ Review later' })}
              </button>
            </div>
            {currentItem?.isReview ? (
              <p style={{ margin: '0 0 8px', color: 'var(--muted)', fontSize: 13 }}>
                {t({ bn: `এই প্রশ্নে আগে ${wrongCounts.get(currentQ.questionId) ?? 1} বার ভুল হয়েছে।`, en: `This question was answered wrong ${(wrongCounts.get(currentQ.questionId) ?? 1)} ${(wrongCounts.get(currentQ.questionId) ?? 1) === 1 ? 'time' : 'times'} before.` })}
              </p>
            ) : (
              <p style={{ margin: '0 0 8px', color: 'var(--muted)', fontSize: 13 }}>
                {t({ bn: 'এই টপিকের নতুন প্রশ্ন — নিয়মটি নতুন প্রশ্নে প্রয়োগ করে দেখুন।', en: 'A new question from this topic — try applying the rule to it.' })}
              </p>
            )}
            <p style={{ margin: '0 0 16px', fontSize: 17, lineHeight: 1.8, color: 'var(--heading)', fontWeight: 600 }}>
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
                      color: 'var(--heading)',
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
                <p style={{ margin: 0, color: 'var(--heading)', fontSize: 14, lineHeight: 1.7 }}>
                  {t({ bn: 'ব্যাখ্যা:', en: 'Explanation:' })} {keyAnswer.explanation}
                </p>
                {!isCorrect && keyAnswer.whyWrong?.[currentAnswer.selected ?? ''] ? (
                  <p style={{ margin: '8px 0 0', color: 'var(--heading)', fontSize: 14, lineHeight: 1.7 }}>
                    {t({ bn: 'আপনার উত্তরটি কেন ভুল:', en: 'Why your answer was wrong:' })} {keyAnswer.whyWrong[currentAnswer.selected ?? '']}
                  </p>
                ) : null}
              </div>
            ) : (
              <p style={{ margin: '16px 0 0', color: 'var(--muted)', fontSize: 13 }}>
                {t({ bn: 'একটি অপশন বেছে নিলে সঙ্গে সঙ্গে সঠিক/ভুল ও ব্যাখ্যা দেখাবে।', en: 'Choosing an option shows the correct/wrong mark and explanation right away.' })}
              </p>
            )}
          </Card>

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
              <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 16 }}>{t({ bn: 'জমা দিতে চান?', en: 'Submit?' })}</div>
              <p style={{ margin: '8px 0 12px', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
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

          <p style={{ marginTop: 16, color: 'var(--muted)', fontSize: 13 }}>
            <button
              type="button"
              onClick={() => void exitWithoutSubmitting()}
              style={{ background: 'none', border: 'none', color: 'var(--teal)', fontWeight: 600, cursor: 'pointer', padding: 0, fontSize: 13 }}
            >
              {t({ bn: '← বেরিয়ে যান (সেশনটি বাতিল হবে)', en: '← Leave (the session will be abandoned)' })}
            </button>
            {' · '}
            <Link to="/jobs/wrong-answers" style={{ fontWeight: 600 }}>{t({ bn: 'নোটবুকে ফিরুন', en: 'Back to the notebook' })}</Link>
          </p>
        </div>

        <div>
          <Card>
            <div style={{ fontWeight: 700, color: 'var(--heading)', marginBottom: 4 }}>{t({ bn: 'প্রশ্ন-তালিকা', en: 'Question list' })}</div>
            <p style={{ margin: '0 0 12px', color: 'var(--muted)', fontSize: 13 }}>
              {t({ bn: 'সবুজ = সঠিক · লাল = ভুল · ধূসর = উত্তর দেওয়া হয়নি · হলুদ চিহ্ন = পরে দেখব', en: 'Green = correct · Red = wrong · Grey = unanswered · Yellow star = review later' })}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(44px, 1fr))', gap: 8 }}>
              {orderedNs.map((n, idx) => {
                const q = subsetBundle.questions.find((x) => x.n === n) ?? subsetBundle.questions[0];
                const a = session.answers[q.n];
                const k = subsetKey.answers.find((x) => x.n === q.n);
                const answered = a?.selected !== null;
                const correct = answered && k !== undefined && a.selected === k.correctLetter;
                const isCurrent = q.n === currentN;
                return (
                  <button
                    key={q.n}
                    type="button"
                    onClick={() => goTo(q.n)}
                    aria-label={t({ bn: `প্রশ্ন ${idx + 1}`, en: `Question ${idx + 1}` })}
                    style={{
                      height: 44,
                      borderRadius: 8,
                      border: isCurrent ? '2px solid #0A1F44' : '1px solid #C9D2E0',
                      background: answered ? (correct ? '#E6F4F2' : '#FDECEC') : '#fff',
                      color: answered ? (correct ? CORRECT : WRONG) : 'var(--heading)',
                      fontWeight: 700,
                      cursor: 'pointer',
                      position: 'relative',
                    }}
                  >
                    {idx + 1}
                    {a?.markedForReview ? (
                      <span style={{ position: 'absolute', top: 2, right: 5, color: MARKED, fontSize: 11 }}>★</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </Card>
          <Card style={{ marginTop: 16 }}>
            <div style={{ fontWeight: 700, color: 'var(--heading)', marginBottom: 4 }}>
              {t({ bn: 'এই সেশন সম্পর্কে', en: 'About this session' })}
            </div>
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: 13, lineHeight: 1.7 }}>
              {t({
                bn: 'এটি একটি আসল অনুশীলন সেশন — উত্তরগুলো আপনার অনুশীলন হিসেবে সংরক্ষিত হবে, এবং নোটবুকের হিসাব সেই উত্তর থেকেই চলবে। সেশনটি শেষ না করে বেরিয়ে গেলে তা বাতিল হয়ে যাবে।',
                en: 'This is a real practice session — your answers are saved as practice, and the notebook counts from them. Leaving without submitting abandons the session.',
              })}
            </p>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
