// Eduvelto — Job full mock / model test page (Step 9).
//
// /jobs/mock/:mockId — mockId is the jobExamDefinitions doc-ID
// (full__bcs__1, daily__2026-11-22, weekly__2026-W47). Intro →
// timed exam → submit (Design G) → /jobs/result/:attemptId.
//
// TIMED (unlike practice): the deadline is the STORED endsAt
// (startedAt + definition duration, set once after read-back);
// the timer runs on endsAt when known, else clientEndsAtMillis.
// The client↔server clock offset is measured ONLY at fresh start,
// when startedAt ≈ now (startMockSession returns Date.now()); on
// RESUME the offset is 0 — a historical startedAt cannot measure
// the current skew (Step 19 F7: deriving it from the original
// start made the displayed remaining reset to the FULL duration).
// The stored deadline is authoritative and the rules are the
// backstop — a late submit is DENIED there, never silently
// accepted. Auto-submit fires once when ≤ 10s remain (online);
// OFFLINE the page NEVER promises auto-submission, pause, or
// guaranteed recovery — resume is permitted, extra time is NOT,
// unconfirmed answers are NOT guaranteed.
//
// NO immediate correct/wrong during the exam (the key is
// receipt-gated and only readable after submit) — the palette
// shows answered / unanswered / marked-for-review only.
//
// LANGUAGE: bilingual Bangla + English (24 Nov 2026 language system).

import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { loginState } from '../lib/loginReturn';
import { PageShell } from '../components/PageShell';
import { AlertBox, Button, Card, Chip, ProgressBar, Skeleton } from '../components/ui';
import { useAuth } from '../lib/auth';
import { useLanguage } from '../i18n/LanguageContext';
import {
  buildMockAutosavePatch,
  type JobMockSessionDoc,
  type JobSessionAnswer,
  type JobSessionAnswerSelection,
} from '../lib/jobEngine';
import {
  abandonMockSession,
  autosaveMockSession,
  ensureMockDeadline,
  findResumableMockSession,
  listMockAttemptsForMock,
  loadMockBundle,
  loadPublishedMock,
  startMockSession,
  submitMockAttempt,
  type MockAttemptWithId,
} from '../lib/jobMock';
import { jobMockIdFromDocId, jobMockPatternSummary, type JobMockWithId } from '../lib/jobMocks';
import { jobExamBySlug } from '../lib/jobExams';
import { SMALL_BANK_NOTICE_BN } from '../lib/jobRepetition';
import type { PracticeBundleWithId } from '../lib/jobPractice';
import { useActiveClock } from '../lib/activeStudyTime';
import QuestionReportButton from '../components/QuestionReportButton';
import { computeRemainingMillis, resolveExamClockOffsetMillis } from '../lib/mockTimer';

type Phase = 'loading' | 'signed-out' | 'error' | 'intro' | 'ready' | 'expired';
type SaveState = 'saved' | 'saving' | 'retrying' | 'error';

const MUTED = '#68747B';

function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function JobMockPage() {
  const { mockId = '' } = useParams<{ mockId: string }>();
  const location = useLocation();
  // Sections audit (24 Nov 2026): return here after sign-in.
  const back = loginState(location.pathname + location.search);
  // Live Exam context (design §6 item 14): the Live Exam page
  // passes { liveExam: { variantId, overlap, smallBankNotice,
  // setKind } } when the student arrives from a variant card.
  // Direct loads carry no state and show neither line.
  const liveExamState = (location.state as { liveExam?: { variantId: number | null; overlap: number; smallBankNotice: boolean; setKind: 'shared' } } | null)?.liveExam ?? null;
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();

  const [phase, setPhase] = useState<Phase>('loading');
  const [error, setError] = useState('');
  const [mock, setMock] = useState<JobMockWithId | null>(null);
  const [bundle, setBundle] = useState<PracticeBundleWithId | null>(null);
  const [sessionId, setSessionId] = useState('');
  const [session, setSession] = useState<JobMockSessionDoc | null>(null);
  const [startedAtMillis, setStartedAtMillis] = useState(0);
  const [deadlineMillis, setDeadlineMillis] = useState<number | null>(null);
  const [resumable, setResumable] = useState<{ sessionId: string; session: JobMockSessionDoc; startedAtMillis: number } | null>(null);
  const [history, setHistory] = useState<MockAttemptWithId[]>([]);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState('');
  const [confirming, setConfirming] = useState(false);
  // D1: abandon-then-start confirm state (the intro "new start"
  // button used to call startMockSession, which ALWAYS throws while
  // a resumable session holds a live lock — the button could never
  // succeed. It now abandons the old session behind a confirm,
  // then starts).
  const [confirmingAbandon, setConfirmingAbandon] = useState(false);
  const [abandoningIntro, setAbandoningIntro] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [abandoning, setAbandoning] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('saved');
  // D8: autosave retry — the old label promised "আবার চেষ্টা করা
  // হবে" but the code never retried. A failed save now retries
  // twice (5s apart); the label says so only while a retry is
  // actually pending.
  const [retryNonce, setRetryNonce] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  const startedRef = useRef(false);
  const sessionRef = useRef<JobMockSessionDoc | null>(null);
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);
  // Client↔server clock offset (ms): measured ONLY at fresh start
  // (startedAt ≈ now); 0 on resume — see src/lib/mockTimer.ts
  // (Step 19 F7). serverNow = Date.now() + offset.
  const offsetRef = useRef(0);
  const autoSubmittedRef = useRef(false);
  // In-flight submit guard (double-tap protection): the confirm
  // button's disabled state alone cannot stop two taps before
  // React re-renders. Reset on failure so auto-submit can retry.
  // Lib-level idempotency (attempt doc-ID = session ID + rules)
  // is untouched — this is only the UI-layer guard.
  const submittingRef = useRef(false);
  // Per-question time: ACTIVE seconds only (Step 12 — same
  // clock as practice). The EXAM DEADLINE NEVER pauses: it is
  // server-authoritative and keeps running while the student is
  // away (design §3.5 flow 7). Only this informational
  // per-question clock pauses (tab hidden / window blurred /
  // 90s without interaction).
  const questionRef = useRef<number>(1);
  const activeClock = useActiveClock();

  // Load the mock + bundle, then look for a resumable session.
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
        const m = await loadPublishedMock(mockId);
        if (!alive) return;
        if (!m) {
          setError(t({ bn: 'এই মকটি পাওয়া যায়নি — হয় ঠিকানাটি ভুল, নয় মকটি এখনো প্রকাশিত হয়নি।', en: 'This mock was not found — either the address is wrong, or the mock is not published yet.' }));
          setPhase('error');
          return;
        }
        const b = await loadMockBundle(m.bundleId);
        if (!alive) return;
        if (!b || b.questions.length === 0) {
          setError(t({ bn: 'এই মকের প্রশ্ন এখনো তৈরি হয়নি — শিক্ষক যাচাইয়ের পর প্রকাশিত হবে।', en: 'This mock’s questions are not ready yet — they will be published after teacher review.' }));
          setPhase('error');
          return;
        }
        setMock(m);
        setBundle(b);
        const bareMockId = jobMockIdFromDocId(m.docId, m.kind) ?? '';
        const [resumed, past] = await Promise.all([
          findResumableMockSession(user.uid, b.docId),
          listMockAttemptsForMock(user.uid, bareMockId, 5),
        ]);
        if (!alive) return;
        setResumable(resumed);
        setHistory(past);
        setPhase('intro');
      } catch (e) {
        if (!alive) return;
        setError(e instanceof Error ? e.message : t({ bn: 'মক শুরু করা যায়নি — আবার চেষ্টা করুন।', en: 'The mock could not be started — please try again.' }));
        setPhase('error');
      }
    })();
    return () => {
      alive = false;
    };
  }, [user, mockId]);

  // Enter the exam. Runs at start AND resume. The clock offset
  // is measured from startedAt ONLY at fresh start (isResume
  // false); on resume it is 0 — the stored deadline is
  // authoritative (src/lib/mockTimer.ts, Step 19 F7).
  async function enterExam(sid: string, sess: JobMockSessionDoc, startedMillis: number, timeMinutes: number, isResume: boolean) {
    const { deadlineMillis: dl } = await ensureMockDeadline(user!.uid, sid, timeMinutes);
    const serverStarted = startedMillis;
    offsetRef.current = resolveExamClockOffsetMillis({ startedAtMillis: serverStarted, nowMillis: Date.now(), isResume });
    setSessionId(sid);
    setSession(sess);
    setStartedAtMillis(serverStarted);
    setDeadlineMillis(dl ?? sess.clientEndsAtMillis);
    questionRef.current = sess.currentQuestion;
    activeClock.start(Date.now());
    autoSubmittedRef.current = false;
    setPhase('ready');
  }

  async function doStart() {
    if (!user || !mock || !bundle) return;
    setStarting(true);
    setStartError('');
    try {
      const started = await startMockSession(user.uid, mock, bundle);
      await enterExam(started.sessionId, started.session, started.startedAtMillis, mock.rulesSnapshot.timeMinutes, false);
    } catch (e) {
      setStartError(e instanceof Error ? e.message : t({ bn: 'মক শুরু করা যায়নি — আবার চেষ্টা করুন।', en: 'The mock could not be started — please try again.' }));
      setStarting(false);
    }
  }

  async function doResume() {
    if (!user || !mock || !resumable) return;
    setStarting(true);
    setStartError('');
    try {
      await enterExam(resumable.sessionId, resumable.session, resumable.startedAtMillis, mock.rulesSnapshot.timeMinutes, true);
    } catch (e) {
      setStartError(e instanceof Error ? e.message : t({ bn: 'আগের মকটি ফেরানো যায়নি — আবার চেষ্টা করুন।', en: 'The previous mock could not be resumed — please try again.' }));
      setStarting(false);
    }
  }

  // D1: abandon the resumable session (behind a confirm — its
  // answers are lost), then start fresh. The old "নতুন করে শুরু
  // করুন" button called doStart() directly, which startMockSession
  // always denies while a live lock exists — a dead end with no
  // path forward. This is the path: resume, or abandon-then-start.
  async function doAbandonAndStart() {
    if (!user || !resumable) return;
    setAbandoningIntro(true);
    setStartError('');
    try {
      await abandonMockSession(user.uid, resumable.sessionId);
      setResumable(null);
      setConfirmingAbandon(false);
      setAbandoningIntro(false);
      await doStart();
    } catch (e) {
      setStartError(e instanceof Error ? e.message : t({ bn: 'আগের মক বাতিল করা যায়নি — আবার চেষ্টা করুন।', en: 'The previous mock could not be cancelled — please try again.' }));
      setAbandoningIntro(false);
    }
  }

  // Debounced autosave (same revision discipline as practice:
  // the last WRITTEN revision lives in the ref, never in state).
  // D8: a failed save retries twice, 5s apart — the retry is real
  // (the effect re-runs on retryNonce with the same revision base,
  // because a failed write never advances writtenRevisionRef).
  const writtenRevisionRef = useRef<number | null>(null);
  const firstSaveRef = useRef(true);
  const retryCountRef = useRef(0);
  const prevRetryNonceRef = useRef(0);
  useEffect(() => {
    if (!session || !user || phase !== 'ready') return;
    if (firstSaveRef.current) {
      firstSaveRef.current = false;
      return;
    }
    // A fresh save cycle (new answers) resets the retry budget;
    // a retry run keeps it.
    if (prevRetryNonceRef.current !== retryNonce) {
      prevRetryNonceRef.current = retryNonce;
    } else {
      retryCountRef.current = 0;
    }
    setSaveState('saving');
    const t = setTimeout(() => {
      const base = writtenRevisionRef.current ?? session.revision;
      const patch = { ...buildMockAutosavePatch(session), revision: base + 1 };
      autosaveMockSession(user.uid, sessionId, patch)
        .then(() => {
          writtenRevisionRef.current = patch.revision;
          retryCountRef.current = 0;
          setSaveState('saved');
        })
        .catch(() => {
          if (retryCountRef.current < 2) {
            retryCountRef.current += 1;
            setSaveState('retrying');
            setTimeout(() => setRetryNonce((n) => n + 1), 5000);
          } else {
            setSaveState('error');
          }
        });
    }, 1200);
    return () => clearTimeout(t);
  }, [session, user, sessionId, phase, retryNonce]);

  // 1s timer tick (server time = client time + measured offset).
  useEffect(() => {
    if (phase !== 'ready') return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [phase]);

  // Return-from-background catch-up (polish, not a fix — the math
  // already recomputes from the absolute deadline each tick): a
  // throttled/suspended tab can delay the interval up to ~1s, so
  // force an immediate tick on visibility/focus instead of
  // waiting for the next interval.
  useEffect(() => {
    if (phase !== 'ready') return;
    const tickNow = () => setNow(Date.now());
    const onVisibility = () => {
      if (!document.hidden) tickNow();
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', tickNow);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', tickNow);
    };
  }, [phase]);

  const remaining = computeRemainingMillis(deadlineMillis, now, offsetRef.current);
  const expired = remaining !== null && remaining <= 0;

  // Auto-submit once when ≤ 10s remain (online). The rules'
  // stored deadline is the backstop — a late submit is denied
  // there and lands in the honest expired state, never silently
  // accepted.
  useEffect(() => {
    if (phase !== 'ready' || remaining === null || remaining > 10_000 || autoSubmittedRef.current) return;
    autoSubmittedRef.current = true;
    void doSubmit(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, phase]);

  if (phase === 'loading') {
    return (
      <PageShell titleBn="মক টেস্ট" titleEn="Mock Test" wide>
        <Skeleton />
      </PageShell>
    );
  }

  if (phase === 'signed-out') {
    return (
      <PageShell titleBn="মক টেস্ট" titleEn="Mock Test" wide>
        <Card>
          <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 17 }}>{t({ bn: 'মক দিতে লগইন করুন', en: 'Log in to take the mock' })}</div>
          <p style={{ margin: '8px 0 12px', color: MUTED, fontSize: 14, lineHeight: 1.7 }}>
            {t({ bn: 'মক টেস্ট শুধু লগইন করা শিক্ষার্থীদের জন্য — আপনার উত্তর ও সময় সংরক্ষিত হয়।', en: 'Mock tests are only for logged-in students — your answers and time are saved.' })}
          </p>
          <Link to="/login" state={back} style={{ fontWeight: 600 }}>{t({ bn: 'লগইন করুন →', en: 'Log in →' })}</Link>
        </Card>
      </PageShell>
    );
  }

  if (phase === 'error' || !mock || !bundle) {
    return (
      <PageShell titleBn="মক টেস্ট" titleEn="Mock Test" wide>
        <AlertBox tone="error">{error || t({ bn: 'মক শুরু করা যায়নি।', en: 'The mock could not be started.' })}</AlertBox>
        <p style={{ marginTop: 16 }}>
          <Link to="/jobs" style={{ fontWeight: 600 }}>{t({ bn: '← সব পরীক্ষা দেখুন', en: '← See all exams' })}</Link>
        </p>
      </PageShell>
    );
  }

  if (phase === 'expired') {
    return (
      <PageShell titleBn={mock.titleBn} titleEn={mock.titleEn} wide>
        <AlertBox tone="error">
          {t({ bn: 'সময় শেষ হয়ে গেছে — এই সেশনটি আর জমা দেওয়া যাবে না। সময় বাড়ানো যায় না; নতুন করে মক শুরু করুন।', en: 'Time is up — this session can no longer be submitted. Time cannot be extended; start a new mock.' })}
        </AlertBox>
        <p style={{ marginTop: 16 }}>
          <Link to={`/jobs/mock/${mock.docId}`} style={{ fontWeight: 600 }}>{t({ bn: 'নতুন করে মক শুরু করুন →', en: 'Start a new mock →' })}</Link>
          {' · '}
          <Link to={`/jobs/${mock.examSlug}/mocks`} style={{ fontWeight: 600 }}>{t({ bn: '← মক তালিকায় ফিরুন', en: '← Back to the mock list' })}</Link>
        </p>
      </PageShell>
    );
  }

  if (phase === 'intro') {
    // N3: the pattern line shows the count the student will
    // actually face — the bundle's real length, not the snapshot's
    // declared count (the manifest is the authority; the snapshot
    // can go stale when a definition is republished).
    const patternSummary = jobMockPatternSummary(mock.rulesSnapshot, bundle.questions.length, lang);
    const negative = mock.rulesSnapshot.negativeMarking;
    const scoringNotice =
      negative === null
        ? t({ bn: 'এই পরীক্ষার নেগেটিভ মার্কিং এখনো বিজ্ঞপ্তি থেকে যাচাই হয়নি — তাই ভুল উত্তরে নম্বর কাটা হচ্ছে না। এই স্কোর অফিসিয়াল ধরনের স্কোর নয়।', en: 'This exam’s negative marking has not been verified from the notice yet — so no marks are being cut for wrong answers. This score is not an official-type score.' })
        : null;
    // N2: the resumable line must not assert saved answers when
    // zero were answered — count what is actually stored.
    const resumableAnsweredCount = resumable
      ? Object.values(resumable.session.answers).filter((a) => a.selected !== null).length
      : 0;
    return (
      <PageShell titleBn={mock.titleBn} titleEn={mock.titleEn} wide maxWidth={1240}>
        <Card>
          <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 19 }}>{lang === 'bn' ? mock.titleBn : mock.titleEn}</div>
          <p style={{ margin: '8px 0', color: MUTED, fontSize: 15, lineHeight: 1.7 }}>{patternSummary}</p>
          {mock.rulesSnapshot.passPercent !== null ? (
            <p style={{ margin: '0 0 8px', color: MUTED, fontSize: 14 }}>
              {t({ bn: 'পাস নম্বর:', en: 'Pass mark:' })} {mock.rulesSnapshot.passPercent}% {t({ bn: '(অনুশীলন হিসাব — অফিসিয়াল পাস নয়)', en: '(practice calculation — not an official pass)' })}
            </p>
          ) : null}
          {scoringNotice ? <AlertBox tone="info">{scoringNotice}</AlertBox> : null}
          {liveExamState ? (
            <p style={{ margin: '8px 0', color: MUTED, fontSize: 14, lineHeight: 1.7 }}>
              {t({ bn: `সেটের ধরন: ${liveExamState.variantId !== null ? `শেয়ার্ড সেট — ভ্যারিয়েন্ট ${liveExamState.variantId}` : 'শেয়ার্ড সেট'}${liveExamState.overlap > 0 ? ` · এই সেটের ${liveExamState.overlap}টি প্রশ্ন আপনি আগে দেখেছেন` : ' · এই সেটের কোনো প্রশ্ন আপনি আগে দেখেননি'}।`, en: `Set type: ${liveExamState.variantId !== null ? `shared set — variant ${liveExamState.variantId}` : 'shared set'}${liveExamState.overlap > 0 ? ` · you have seen ${liveExamState.overlap} question(s) in this set before` : ' · you have not seen any question in this set before'}.` })}
            </p>
          ) : null}
          {liveExamState?.smallBankNotice ? (
            <div style={{ marginTop: 12 }}>
              <AlertBox tone="info">{SMALL_BANK_NOTICE_BN}</AlertBox>
            </div>
          ) : null}
          <AlertBox tone="info">
            {t({ bn: 'সময় শুরু হলে আর থামবে না — মাঝপথে চলে গেলে একই সেশন, একই সময়সীমা, একই প্রশ্নসেট নিয়ে ফিরে আসতে পারবেন। ইন্টারনেট ছাড়া জমা দেওয়া যাবে না; স্বয়ংক্রিয় জমা শুধু সংযোগ থাকলে হয়।', en: 'Once time starts it never stops — if you leave midway, you can return to the same session, the same time limit, and the same question set. You cannot submit without internet; auto-submission only happens with a connection.' })}
          </AlertBox>
          {resumable ? (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 700, color: '#142B3B' }}>{t({ bn: 'চলমান মক আছে — আগের সেশনটি ফিরে পাবেন', en: 'A mock is in progress — you will get the previous session back' })}</div>
              <p style={{ margin: '6px 0 12px', color: MUTED, fontSize: 14 }}>
                {resumable.session.questionRefs.length}{lang === 'bn' ? 'টি প্রশ্ন' : ' questions'} ·{' '}
                {resumableAnsweredCount > 0
                  ? t({ bn: `${resumableAnsweredCount}টি উত্তর সংরক্ষিত আছে`, en: `${resumableAnsweredCount} answer(s) saved` })
                  : t({ bn: 'এখনো কোনো উত্তর দেওয়া হয়নি', en: 'No answer given yet' })}
              </p>
              <Button variant="accent" disabled={starting || abandoningIntro} onClick={() => void doResume()}>
                {starting && !abandoningIntro ? t({ bn: 'ফেরানো হচ্ছে…', en: 'Resuming…' }) : t({ bn: 'আগের মক চালিয়ে যান →', en: 'Continue the previous mock →' })}
              </Button>
              <span style={{ marginLeft: 8 }}>
                <Button variant="outline" disabled={starting || abandoningIntro} onClick={() => setConfirmingAbandon(true)}>
                  {t({ bn: 'আগেরটি বাতিল করে নতুন শুরু করুন', en: 'Cancel the previous one and start new' })}
                </Button>
              </span>
              {confirmingAbandon ? (
                <Card style={{ marginTop: 12 }}>
                  <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 15 }}>{t({ bn: 'আগের মকটি বাতিল করবেন?', en: 'Cancel the previous mock?' })}</div>
                  <p style={{ margin: '8px 0 12px', color: MUTED, fontSize: 14, lineHeight: 1.7 }}>
                    {t({ bn: 'আগের সেশনের উত্তরগুলো মুছে যাবে — সেটি আর ফেরানো যাবে না। বাতিল করলে নতুন মক শুরু হবে।', en: 'The previous session’s answers will be deleted — they cannot be recovered. Cancelling will start a new mock.' })}
                  </p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button variant="accent" disabled={abandoningIntro} onClick={() => void doAbandonAndStart()}>
                      {abandoningIntro ? t({ bn: 'বাতিল হচ্ছে…', en: 'Cancelling…' }) : t({ bn: 'হ্যাঁ, বাতিল করে নতুন শুরু করুন', en: 'Yes, cancel and start new' })}
                    </Button>
                    <Button variant="outline" disabled={abandoningIntro} onClick={() => setConfirmingAbandon(false)}>
                      {t({ bn: 'ফিরে যান', en: 'Go back' })}
                    </Button>
                  </div>
                </Card>
              ) : null}
            </div>
          ) : (
            <div style={{ marginTop: 12 }}>
              <Button variant="accent" disabled={starting} onClick={() => void doStart()}>
                {starting ? t({ bn: 'শুরু হচ্ছে…', en: 'Starting…' }) : t({ bn: 'মক শুরু করুন →', en: 'Start the mock →' })}
              </Button>
            </div>
          )}
          {startError ? <div style={{ marginTop: 12 }}><AlertBox tone="error">{startError}</AlertBox></div> : null}
        </Card>

        {history.length > 0 ? (
          <Card style={{ marginTop: 16 }}>
            <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 17 }}>{t({ bn: 'আগের ফলাফল', en: 'Previous results' })}</div>
            <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
              {history.map((h) => (
                <div key={h.docId} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', fontSize: 14 }}>
                  <span>
                    {typeof h.score === 'number' ? h.score : 0} / {typeof h.totalMarks === 'number' ? h.totalMarks : 0} {t({ bn: 'নম্বর', en: 'marks' })} ·{' '}
                    {typeof h.correctCount === 'number' ? h.correctCount : 0}{lang === 'bn' ? 'টি সঠিক' : ' correct'} ·{' '}
                    {typeof h.wrongCount === 'number' ? h.wrongCount : 0}{lang === 'bn' ? 'টি ভুল' : ' wrong'}
                  </span>
                  <Link to={`/jobs/result/${h.docId}`} style={{ fontWeight: 600 }}>{t({ bn: 'ফলাফল দেখুন →', en: 'See the result →' })}</Link>
                </div>
              ))}
            </div>
          </Card>
        ) : null}

        <p style={{ marginTop: 16 }}>
          <Link to={`/jobs/${mock.examSlug}/mocks`} style={{ fontWeight: 600 }}>{t({ bn: '← মক তালিকায় ফিরুন', en: '← Back to the mock list' })}</Link>
        </p>
      </PageShell>
    );
  }

  // ---- exam phase ----
  if (!session) {
    return (
      <PageShell titleBn={mock.titleBn} titleEn={mock.titleEn} wide>
        <AlertBox tone="error">{t({ bn: 'সেশন পাওয়া যায়নি — আবার শুরু করুন।', en: 'Session not found — please start again.' })}</AlertBox>
      </PageShell>
    );
  }

  const total = bundle.questions.length;
  const answeredCount = Object.values(session.answers).filter((a) => a.selected !== null).length;
  // N1: the footer used to render the raw exam slug (e.g. 'bcs')
  // — show the exam name in the selected language instead.
  const examName = jobExamBySlug(mock.examSlug);
  const examNameBn = examName?.bn ?? mock.examSlug;
  const examNameShown = lang === 'bn' ? examNameBn : (examName?.en ?? mock.examSlug);
  const markedCount = Object.values(session.answers).filter((a) => a.markedForReview).length;
  const orderedNs = session.questionRefs.map((r) => r.n);
  const currentN = session.currentQuestion;
  const currentIdx = Math.max(0, orderedNs.indexOf(currentN));
  const currentQ = bundle.questions.find((q) => q.n === currentN) ?? bundle.questions[0];
  const currentAnswer: JobSessionAnswer = session.answers[currentQ.n] ?? {
    selected: null,
    markedForReview: false,
    timeSpentSeconds: 0,
  };
  const saveLabel =
    saveState === 'saving'
      ? t({ bn: 'সংরক্ষণ হচ্ছে…', en: 'Saving…' })
      : saveState === 'retrying'
        ? t({ bn: 'সংরক্ষণ হয়নি — আবার চেষ্টা করা হচ্ছে…', en: 'Not saved — retrying…' })
        : saveState === 'error'
          ? t({ bn: 'সংরক্ষণ হয়নি — উত্তর বদলালে আবার চেষ্টা হবে', en: 'Not saved — it will retry when you change an answer' })
          : t({ bn: 'সংরক্ষিত', en: 'Saved' });
  const timerUrgent = remaining !== null && remaining <= 5 * 60 * 1000;

  // Flush the ACTIVE seconds for the open question into the
  // session (Step 12 — idle-tab time is never recorded). The
  // exam deadline is untouched by this clock.
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
    setSession((prev) => (prev ? { ...prev, currentQuestion: n } : prev));
  }

  function choose(letter: JobSessionAnswerSelection) {
    setSession((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        answers: { ...prev.answers, [currentQ.n]: { ...prev.answers[currentQ.n], selected: letter } },
      };
    });
  }

  function toggleMark() {
    setSession((prev) => {
      if (!prev) return prev;
      const entry = prev.answers[currentQ.n];
      if (!entry) return prev;
      return {
        ...prev,
        answers: { ...prev.answers, [currentQ.n]: { ...entry, markedForReview: !entry.markedForReview } },
      };
    });
  }

  async function doSubmit(auto = false) {
    const liveSession = sessionRef.current;
    if (!user || !bundle || !mock || !liveSession) return;
    // In-flight guard: two taps (or an auto-submit racing a manual
    // tap) before React re-renders must not both submit. Reset on
    // failure so auto-submit can retry (autoSubmittedRef reset
    // below); on success the page navigates away.
    if (submittingRef.current) return;
    submittingRef.current = true;
    if (!auto) {
      setSubmitting(true);
      setSubmitError('');
    }
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
      const { attemptId } = await submitMockAttempt({
        uid: user.uid,
        sessionId,
        session: liveSession,
        mock,
        bundle,
        answers,
        startedAtMillis,
        submittedAtMillis: Date.now(),
      });
      navigate(`/jobs/result/${attemptId}`);
    } catch (e) {
      // Reset the in-flight guard FIRST: a failed submit must be
      // retryable (auto-submit retries on the next tick while time
      // remains); the expired branch below only changes phase.
      submittingRef.current = false;
      // A late submit is DENIED by the rules (stored deadline) —
      // land in the honest expired state, never a silent accept.
      const remainingNow = computeRemainingMillis(deadlineMillis, Date.now(), offsetRef.current);
      if (remainingNow !== null && remainingNow <= 0) {
        setPhase('expired');
        return;
      }
      setSubmitError(e instanceof Error ? e.message : t({ bn: 'জমা দেওয়া যায়নি — আবার চেষ্টা করুন।', en: 'Could not be submitted — please try again.' }));
      setSubmitting(false);
      setConfirming(false);
      autoSubmittedRef.current = false;
    }
  }

  async function doAbandon() {
    if (!user || !mock) return;
    setAbandoning(true);
    try {
      await abandonMockSession(user.uid, sessionId);
      navigate(`/jobs/${mock.examSlug}/mocks`);
    } catch {
      setAbandoning(false);
    }
  }

  return (
    <PageShell titleBn={mock.titleBn} titleEn={mock.titleEn} wide maxWidth={1240}>
      {/* Sticky top bar: timer + progress + autosave state. */}
      <div style={{ position: 'sticky', top: 0, zIndex: 5, background: '#fff', padding: '10px 0 8px', borderBottom: '1px solid #E3E8EF', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 16 }}>{lang === 'bn' ? mock.titleBn : mock.titleEn}</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: MUTED }}>
            <Chip tone={timerUrgent ? 'gold' : 'outline'}>
              {t({ bn: 'বাকি সময়:', en: 'Time left:' })} {remaining === null ? '—' : formatRemaining(remaining)}
            </Chip>
            <span>{saveLabel}</span>
          </div>
        </div>
        <div style={{ marginTop: 8 }}>
          <ProgressBar value={total === 0 ? 0 : (answeredCount / total) * 100} />
          <div style={{ fontSize: 13, color: MUTED, marginTop: 4 }}>
            {answeredCount}/{total}{lang === 'bn' ? 'টি উত্তর দেওয়া হয়েছে' : ' answered'}
            {markedCount > 0 ? ` · ${markedCount}${lang === 'bn' ? 'টি পরে দেখব' : ' to review later'}` : ''}
            {expired ? t({ bn: ' · সময় শেষ', en: ' · Time is up' }) : ''}
          </div>
        </div>
      </div>

      {mock.rulesSnapshot.negativeMarking === null ? (
        <AlertBox tone="info">
          {t({ bn: 'এই পরীক্ষার নেগেটিভ মার্কিং এখনো বিজ্ঞপ্তি থেকে যাচাই হয়নি — তাই ভুল উত্তরে নম্বর কাটা হচ্ছে না।', en: 'This exam’s negative marking has not been verified from the notice yet — so no marks are being cut for wrong answers.' })}
        </AlertBox>
      ) : null}
      <p style={{ color: MUTED, fontSize: 13, margin: '0 0 16px' }}>
        {t({ bn: 'ইন্টারনেট ছাড়া জমা দেওয়া যাবে না — সময় থামবে না, সংযোগ ফিরলে জমা দিন। সময় শেষ হলে স্বয়ংক্রিয়ভাবে জমা দেওয়ার চেষ্টা হবে (সংযোগ থাকলে)।', en: 'You cannot submit without internet — time will not stop; submit once the connection returns. When time ends, it will try to submit automatically (if connected).' })}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, alignItems: 'start' }}>
        <div>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontWeight: 700, color: '#142B3B' }}>{t({ bn: `প্রশ্ন ${currentQ.n} / ${total}`, en: `Question ${currentQ.n} / ${total}` })}</span>
              <button
                type="button"
                onClick={toggleMark}
                aria-pressed={currentAnswer.markedForReview}
                style={{
                  border: `1px solid ${currentAnswer.markedForReview ? '#8A6100' : '#C9D2E0'}`,
                  background: currentAnswer.markedForReview ? '#FFF7E0' : '#fff',
                  color: currentAnswer.markedForReview ? '#8A6100' : '#142B3B',
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
                return (
                  <button
                    key={o.letter}
                    type="button"
                    onClick={() => choose(o.letter)}
                    aria-pressed={selected}
                    style={{
                      textAlign: 'left',
                      border: selected ? '2px solid #0A1F44' : '1px solid #C9D2E0',
                      background: selected ? '#E8EFFA' : '#fff',
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
                  </button>
                );
              })}
            </div>
            <p style={{ margin: '16px 0 0', color: MUTED, fontSize: 13 }}>
              {t({ bn: 'মকে উত্তর দেওয়ার সঙ্গে সঙ্গে সঠিক/ভুল দেখানো হয় না — ফলাফল ও ব্যাখ্যা জমা দেওয়ার পর দেখাবে।', en: 'In a mock, correct/wrong is not shown as you answer — results and explanations appear after submission.' })}
            </p>
            <QuestionReportButton questionId={currentQ.questionId} questionText={currentQ.questionText} />
          </Card>

          <div style={{ position: 'sticky', bottom: 0, zIndex: 5, background: '#fff', padding: '12px 0', borderTop: '1px solid #E3E8EF', marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button variant="outline" disabled={currentIdx <= 0} onClick={() => goTo(orderedNs[currentIdx - 1])}>
              {t({ bn: '← আগেরটি', en: '← Previous' })}
            </Button>
            <Button variant="outline" disabled={currentIdx >= total - 1} onClick={() => goTo(orderedNs[currentIdx + 1])}>
              {t({ bn: 'পরেরটি →', en: 'Next →' })}
            </Button>
            <span style={{ flex: 1 }} />
            <Button variant="outline" disabled={abandoning} onClick={() => void doAbandon()}>
              {abandoning ? t({ bn: 'বাতিল হচ্ছে…', en: 'Cancelling…' }) : t({ bn: 'বাতিল করুন', en: 'Cancel' })}
            </Button>
            <Button variant="accent" onClick={() => setConfirming(true)}>
              {t({ bn: 'জমা দিন', en: 'Submit' })}
            </Button>
          </div>

          {confirming ? (
            <Card style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 16 }}>{t({ bn: 'জমা দিতে চান?', en: 'Submit?' })}</div>
              <p style={{ margin: '8px 0 12px', color: MUTED, fontSize: 14, lineHeight: 1.7 }}>
                {answeredCount}/{total}{lang === 'bn' ? 'টি উত্তর দেওয়া হয়েছে' : ' answered'}
                {total - answeredCount > 0 ? t({ bn: ` — ${total - answeredCount}টি উত্তর দেওয়া হয়নি (০ নম্বর পাবে)`, en: ` — ${total - answeredCount} unanswered (0 marks)` }) : t({ bn: ' — সব প্রশ্নের উত্তর দেওয়া হয়েছে', en: ' — all questions answered' })}।
                {t({ bn: 'জমা দিলে আর বদলানো যাবে না।', en: 'Once submitted, answers cannot be changed.' })}
              </p>
              {submitError ? <AlertBox tone="error">{submitError}</AlertBox> : null}
              <div style={{ display: 'flex', gap: 8 }}>
                <Button variant="accent" disabled={submitting} onClick={() => void doSubmit(false)}>
                  {submitting ? t({ bn: 'জমা হচ্ছে…', en: 'Submitting…' }) : t({ bn: 'হ্যাঁ, জমা দিন', en: 'Yes, submit' })}
                </Button>
                <Button variant="outline" disabled={submitting} onClick={() => setConfirming(false)}>
                  {t({ bn: 'ফিরে যান', en: 'Go back' })}
                </Button>
              </div>
            </Card>
          ) : null}

          <p style={{ marginTop: 16, color: MUTED, fontSize: 13 }}>
            <Link to={`/jobs/${mock.examSlug}`} style={{ fontWeight: 600 }}>← {examNameShown} {t({ bn: 'হাবে ফিরুন', en: 'hub' })}</Link>
            {' · '}{t({ bn: 'অগ্রগতি স্বয়ংক্রিয়ভাবে সংরক্ষিত হয় — মাঝপথে চলে গেলে পরে এসে এই মকেই আবার শুরু করলে আগের সেশনটি ফিরে পাবেন।', en: 'Progress is saved automatically — if you leave midway and come back to this mock later, you will get the previous session back.' })}
          </p>
        </div>

        <div>
          <Card>
            <div style={{ fontWeight: 700, color: '#142B3B', marginBottom: 4 }}>{t({ bn: 'প্রশ্ন-তালিকা', en: 'Question list' })}</div>
            <p style={{ margin: '0 0 12px', color: MUTED, fontSize: 13 }}>
              {t({ bn: 'নীল = উত্তর দেওয়া হয়েছে · সাদা = উত্তর দেওয়া হয়নি · হলুদ চিহ্ন = পরে দেখব', en: 'Blue = answered · White = unanswered · Yellow mark = review later' })}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(44px, 1fr))', gap: 8 }}>
              {orderedNs.map((n) => {
                const q = bundle.questions.find((x) => x.n === n) ?? bundle.questions[0];
                const a = session.answers[q.n];
                const answered = a?.selected !== null;
                const isCurrent = q.n === currentN;
                return (
                  <button
                    key={q.n}
                    type="button"
                    onClick={() => goTo(q.n)}
                    aria-label={lang === 'bn' ? `প্রশ্ন ${q.n}` : `Question ${q.n}`}
                    style={{
                      height: 44,
                      borderRadius: 8,
                      border: isCurrent ? '2px solid #0A1F44' : '1px solid #C9D2E0',
                      background: answered ? '#E8EFFA' : '#fff',
                      color: '#142B3B',
                      fontWeight: 700,
                      cursor: 'pointer',
                      position: 'relative',
                    }}
                  >
                    {q.n}
                    {a?.markedForReview ? (
                      <span style={{ position: 'absolute', top: 2, right: 5, color: '#8A6100', fontSize: 11 }}>★</span>
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
