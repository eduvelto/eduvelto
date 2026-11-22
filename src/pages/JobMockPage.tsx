// Eduvelto — Job full mock / model test page (Step 9).
//
// /jobs/mock/:mockId — mockId is the jobExamDefinitions doc-ID
// (full__bcs__1, daily__2026-11-22, weekly__2026-W47). Intro →
// timed exam → submit (Design G) → /jobs/result/:attemptId.
//
// TIMED (unlike practice): the deadline is the STORED endsAt
// (startedAt + definition duration, set once after read-back);
// the timer runs on endsAt when known, else clientEndsAtMillis.
// The page measures the client↔server clock offset from the
// read-back startedAt at start/resume and shows server time
// (Date.now() + offset); the rules' stored deadline is the
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
// LANGUAGE: all UI text is Bangla (one-language rule).

import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { AlertBox, Button, Card, Chip, ProgressBar, Skeleton } from '../components/ui';
import { useAuth } from '../lib/auth';
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
import { jobMockIdFromDocId, jobMockPatternSummaryBn, type JobMockWithId } from '../lib/jobMocks';
import { jobExamBySlug } from '../lib/jobExams';
import type { PracticeBundleWithId } from '../lib/jobPractice';

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
  const { user } = useAuth();
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
  // Client↔server clock offset (ms): measured from the read-back
  // startedAt at start/resume. serverNow = Date.now() + offset.
  const offsetRef = useRef(0);
  const autoSubmittedRef = useRef(false);
  const timeRef = useRef<{ current: number; startedAt: number }>({ current: 1, startedAt: Date.now() });

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
          setError('এই মকটি পাওয়া যায়নি — হয় ঠিকানাটি ভুল, নয় মকটি এখনো প্রকাশিত হয়নি।');
          setPhase('error');
          return;
        }
        const b = await loadMockBundle(m.bundleId);
        if (!alive) return;
        if (!b || b.questions.length === 0) {
          setError('এই মকের প্রশ্ন এখনো তৈরি হয়নি — শিক্ষক যাচাইয়ের পর প্রকাশিত হবে।');
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
        setError(e instanceof Error ? e.message : 'মক শুরু করা যায়নি — আবার চেষ্টা করুন।');
        setPhase('error');
      }
    })();
    return () => {
      alive = false;
    };
  }, [user, mockId]);

  // Measure the clock offset from a read-back startedAt, then
  // enter the exam. Runs at start AND resume.
  async function enterExam(sid: string, sess: JobMockSessionDoc, startedMillis: number, timeMinutes: number) {
    const { deadlineMillis: dl } = await ensureMockDeadline(user!.uid, sid, timeMinutes);
    const serverStarted = startedMillis;
    offsetRef.current = serverStarted - Date.now();
    setSessionId(sid);
    setSession(sess);
    setStartedAtMillis(serverStarted);
    setDeadlineMillis(dl ?? sess.clientEndsAtMillis);
    timeRef.current = { current: sess.currentQuestion, startedAt: Date.now() };
    autoSubmittedRef.current = false;
    setPhase('ready');
  }

  async function doStart() {
    if (!user || !mock || !bundle) return;
    setStarting(true);
    setStartError('');
    try {
      const started = await startMockSession(user.uid, mock, bundle);
      await enterExam(started.sessionId, started.session, started.startedAtMillis, mock.rulesSnapshot.timeMinutes);
    } catch (e) {
      setStartError(e instanceof Error ? e.message : 'মক শুরু করা যায়নি — আবার চেষ্টা করুন।');
      setStarting(false);
    }
  }

  async function doResume() {
    if (!user || !mock || !resumable) return;
    setStarting(true);
    setStartError('');
    try {
      await enterExam(resumable.sessionId, resumable.session, resumable.startedAtMillis, mock.rulesSnapshot.timeMinutes);
    } catch (e) {
      setStartError(e instanceof Error ? e.message : 'আগের মকটি ফেরানো যায়নি — আবার চেষ্টা করুন।');
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
      setStartError(e instanceof Error ? e.message : 'আগের মক বাতিল করা যায়নি — আবার চেষ্টা করুন।');
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

  const remaining = deadlineMillis === null ? null : deadlineMillis - (now + offsetRef.current);
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
      <PageShell titleBn="মক টেস্ট" titleEn="মক টেস্ট" wide>
        <Skeleton />
      </PageShell>
    );
  }

  if (phase === 'signed-out') {
    return (
      <PageShell titleBn="মক টেস্ট" titleEn="মক টেস্ট" wide>
        <Card>
          <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 17 }}>মক দিতে লগইন করুন</div>
          <p style={{ margin: '8px 0 12px', color: MUTED, fontSize: 14, lineHeight: 1.7 }}>
            মক টেস্ট শুধু লগইন করা শিক্ষার্থীদের জন্য — আপনার উত্তর ও সময় সংরক্ষিত হয়।
          </p>
          <Link to="/login" style={{ fontWeight: 600 }}>লগইন করুন →</Link>
        </Card>
      </PageShell>
    );
  }

  if (phase === 'error' || !mock || !bundle) {
    return (
      <PageShell titleBn="মক টেস্ট" titleEn="মক টেস্ট" wide>
        <AlertBox tone="error">{error || 'মক শুরু করা যায়নি।'}</AlertBox>
        <p style={{ marginTop: 16 }}>
          <Link to="/jobs" style={{ fontWeight: 600 }}>← সব পরীক্ষা দেখুন</Link>
        </p>
      </PageShell>
    );
  }

  if (phase === 'expired') {
    return (
      <PageShell titleBn={mock.titleBn} titleEn={mock.titleBn} wide>
        <AlertBox tone="error">
          সময় শেষ হয়ে গেছে — এই সেশনটি আর জমা দেওয়া যাবে না। সময় বাড়ানো যায় না; নতুন করে মক শুরু করুন।
        </AlertBox>
        <p style={{ marginTop: 16 }}>
          <Link to={`/jobs/mock/${mock.docId}`} style={{ fontWeight: 600 }}>নতুন করে মক শুরু করুন →</Link>
          {' · '}
          <Link to={`/jobs/${mock.examSlug}/mocks`} style={{ fontWeight: 600 }}>← মক তালিকায় ফিরুন</Link>
        </p>
      </PageShell>
    );
  }

  if (phase === 'intro') {
    // N3: the pattern line shows the count the student will
    // actually face — the bundle's real length, not the snapshot's
    // declared count (the manifest is the authority; the snapshot
    // can go stale when a definition is republished).
    const patternSummary = jobMockPatternSummaryBn(mock.rulesSnapshot, bundle.questions.length);
    const negative = mock.rulesSnapshot.negativeMarking;
    const scoringNotice =
      negative === null
        ? 'এই পরীক্ষার নেগেটিভ মার্কিং এখনো বিজ্ঞপ্তি থেকে যাচাই হয়নি — তাই ভুল উত্তরে নম্বর কাটা হচ্ছে না। এই স্কোর অফিসিয়াল ধরনের স্কোর নয়।'
        : null;
    // N2: the resumable line must not assert saved answers when
    // zero were answered — count what is actually stored.
    const resumableAnsweredCount = resumable
      ? Object.values(resumable.session.answers).filter((a) => a.selected !== null).length
      : 0;
    return (
      <PageShell titleBn={mock.titleBn} titleEn={mock.titleBn} wide maxWidth={1240}>
        <Card>
          <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 19 }}>{mock.titleBn}</div>
          <p style={{ margin: '8px 0', color: MUTED, fontSize: 15, lineHeight: 1.7 }}>{patternSummary}</p>
          {mock.rulesSnapshot.passPercent !== null ? (
            <p style={{ margin: '0 0 8px', color: MUTED, fontSize: 14 }}>
              পাস নম্বর: {mock.rulesSnapshot.passPercent}% (অনুশীলন হিসাব — অফিসিয়াল পাস নয়)
            </p>
          ) : null}
          {scoringNotice ? <AlertBox tone="info">{scoringNotice}</AlertBox> : null}
          <AlertBox tone="info">
            সময় শুরু হলে আর থামবে না — মাঝপথে চলে গেলে একই সেশন, একই সময়সীমা, একই প্রশ্নসেট নিয়ে ফিরে আসতে পারবেন। ইন্টারনেট ছাড়া জমা দেওয়া যাবে না; স্বয়ংক্রিয় জমা শুধু সংযোগ থাকলে হয়।
          </AlertBox>
          {resumable ? (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 700, color: '#142B3B' }}>চলমান মক আছে — আগের সেশনটি ফিরে পাবেন</div>
              <p style={{ margin: '6px 0 12px', color: MUTED, fontSize: 14 }}>
                {resumable.session.questionRefs.length}টি প্রশ্ন ·{' '}
                {resumableAnsweredCount > 0
                  ? `${resumableAnsweredCount}টি উত্তর সংরক্ষিত আছে`
                  : 'এখনো কোনো উত্তর দেওয়া হয়নি'}
              </p>
              <Button variant="accent" disabled={starting || abandoningIntro} onClick={() => void doResume()}>
                {starting && !abandoningIntro ? 'ফেরানো হচ্ছে…' : 'আগের মক চালিয়ে যান →'}
              </Button>
              <span style={{ marginLeft: 8 }}>
                <Button variant="outline" disabled={starting || abandoningIntro} onClick={() => setConfirmingAbandon(true)}>
                  আগেরটি বাতিল করে নতুন শুরু করুন
                </Button>
              </span>
              {confirmingAbandon ? (
                <Card style={{ marginTop: 12 }}>
                  <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 15 }}>আগের মকটি বাতিল করবেন?</div>
                  <p style={{ margin: '8px 0 12px', color: MUTED, fontSize: 14, lineHeight: 1.7 }}>
                    আগের সেশনের উত্তরগুলো মুছে যাবে — সেটি আর ফেরানো যাবে না। বাতিল করলে নতুন মক শুরু হবে।
                  </p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button variant="accent" disabled={abandoningIntro} onClick={() => void doAbandonAndStart()}>
                      {abandoningIntro ? 'বাতিল হচ্ছে…' : 'হ্যাঁ, বাতিল করে নতুন শুরু করুন'}
                    </Button>
                    <Button variant="outline" disabled={abandoningIntro} onClick={() => setConfirmingAbandon(false)}>
                      ফিরে যান
                    </Button>
                  </div>
                </Card>
              ) : null}
            </div>
          ) : (
            <div style={{ marginTop: 12 }}>
              <Button variant="accent" disabled={starting} onClick={() => void doStart()}>
                {starting ? 'শুরু হচ্ছে…' : 'মক শুরু করুন →'}
              </Button>
            </div>
          )}
          {startError ? <div style={{ marginTop: 12 }}><AlertBox tone="error">{startError}</AlertBox></div> : null}
        </Card>

        {history.length > 0 ? (
          <Card style={{ marginTop: 16 }}>
            <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 17 }}>আগের ফলাফল</div>
            <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
              {history.map((h) => (
                <div key={h.docId} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', fontSize: 14 }}>
                  <span>
                    {typeof h.score === 'number' ? h.score : 0} / {typeof h.totalMarks === 'number' ? h.totalMarks : 0} নম্বর ·{' '}
                    {typeof h.correctCount === 'number' ? h.correctCount : 0}টি সঠিক ·{' '}
                    {typeof h.wrongCount === 'number' ? h.wrongCount : 0}টি ভুল
                  </span>
                  <Link to={`/jobs/result/${h.docId}`} style={{ fontWeight: 600 }}>ফলাফল দেখুন →</Link>
                </div>
              ))}
            </div>
          </Card>
        ) : null}

        <p style={{ marginTop: 16 }}>
          <Link to={`/jobs/${mock.examSlug}/mocks`} style={{ fontWeight: 600 }}>← মক তালিকায় ফিরুন</Link>
        </p>
      </PageShell>
    );
  }

  // ---- exam phase ----
  if (!session) {
    return (
      <PageShell titleBn={mock.titleBn} titleEn={mock.titleBn} wide>
        <AlertBox tone="error">সেশন পাওয়া যায়নি — আবার শুরু করুন।</AlertBox>
      </PageShell>
    );
  }

  const total = bundle.questions.length;
  const answeredCount = Object.values(session.answers).filter((a) => a.selected !== null).length;
  // N1: the footer used to render the raw exam slug (e.g. 'bcs')
  // — show the Bangla exam name instead.
  const examNameBn = jobExamBySlug(mock.examSlug)?.bn ?? mock.examSlug;
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
      ? 'সংরক্ষণ হচ্ছে…'
      : saveState === 'retrying'
        ? 'সংরক্ষণ হয়নি — আবার চেষ্টা করা হচ্ছে…'
        : saveState === 'error'
          ? 'সংরক্ষণ হয়নি — উত্তর বদলালে আবার চেষ্টা হবে'
          : 'সংরক্ষিত';
  const timerUrgent = remaining !== null && remaining <= 5 * 60 * 1000;

  function flushTime(): { n: number; elapsed: number } {
    const nowMs = Date.now();
    const elapsed = Math.max(0, Math.round((nowMs - timeRef.current.startedAt) / 1000));
    const n = timeRef.current.current;
    timeRef.current = { current: n, startedAt: nowMs };
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
      // A late submit is DENIED by the rules (stored deadline) —
      // land in the honest expired state, never a silent accept.
      const remainingNow = deadlineMillis === null ? null : deadlineMillis - (Date.now() + offsetRef.current);
      if (remainingNow !== null && remainingNow <= 0) {
        setPhase('expired');
        return;
      }
      setSubmitError(e instanceof Error ? e.message : 'জমা দেওয়া যায়নি — আবার চেষ্টা করুন।');
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
    <PageShell titleBn={mock.titleBn} titleEn={mock.titleBn} wide maxWidth={1240}>
      {/* Sticky top bar: timer + progress + autosave state. */}
      <div style={{ position: 'sticky', top: 0, zIndex: 5, background: '#fff', padding: '10px 0 8px', borderBottom: '1px solid #E3E8EF', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 16 }}>{mock.titleBn}</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: MUTED }}>
            <Chip tone={timerUrgent ? 'gold' : 'outline'}>
              বাকি সময়: {remaining === null ? '—' : formatRemaining(remaining)}
            </Chip>
            <span>{saveLabel}</span>
          </div>
        </div>
        <div style={{ marginTop: 8 }}>
          <ProgressBar value={total === 0 ? 0 : (answeredCount / total) * 100} />
          <div style={{ fontSize: 13, color: MUTED, marginTop: 4 }}>
            {answeredCount}/{total}টি উত্তর দেওয়া হয়েছে
            {markedCount > 0 ? ` · ${markedCount}টি পরে দেখব` : ''}
            {expired ? ' · সময় শেষ' : ''}
          </div>
        </div>
      </div>

      {mock.rulesSnapshot.negativeMarking === null ? (
        <AlertBox tone="info">
          এই পরীক্ষার নেগেটিভ মার্কিং এখনো বিজ্ঞপ্তি থেকে যাচাই হয়নি — তাই ভুল উত্তরে নম্বর কাটা হচ্ছে না।
        </AlertBox>
      ) : null}
      <p style={{ color: MUTED, fontSize: 13, margin: '0 0 16px' }}>
        ইন্টারনেট ছাড়া জমা দেওয়া যাবে না — সময় থামবে না, সংযোগ ফিরলে জমা দিন। সময় শেষ হলে স্বয়ংক্রিয়ভাবে জমা দেওয়ার চেষ্টা হবে (সংযোগ থাকলে)।
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, alignItems: 'start' }}>
        <div>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontWeight: 700, color: '#142B3B' }}>প্রশ্ন {currentQ.n} / {total}</span>
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
                {currentAnswer.markedForReview ? '★ পরে দেখব' : '☆ পরে দেখব'}
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
              মকে উত্তর দেওয়ার সঙ্গে সঙ্গে সঠিক/ভুল দেখানো হয় না — ফলাফল ও ব্যাখ্যা জমা দেওয়ার পর দেখাবে।
            </p>
          </Card>

          <div style={{ position: 'sticky', bottom: 0, zIndex: 5, background: '#fff', padding: '12px 0', borderTop: '1px solid #E3E8EF', marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button variant="outline" disabled={currentIdx <= 0} onClick={() => goTo(orderedNs[currentIdx - 1])}>
              ← আগেরটি
            </Button>
            <Button variant="outline" disabled={currentIdx >= total - 1} onClick={() => goTo(orderedNs[currentIdx + 1])}>
              পরেরটি →
            </Button>
            <span style={{ flex: 1 }} />
            <Button variant="outline" disabled={abandoning} onClick={() => void doAbandon()}>
              {abandoning ? 'বাতিল হচ্ছে…' : 'বাতিল করুন'}
            </Button>
            <Button variant="accent" onClick={() => setConfirming(true)}>
              জমা দিন
            </Button>
          </div>

          {confirming ? (
            <Card style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 16 }}>জমা দিতে চান?</div>
              <p style={{ margin: '8px 0 12px', color: MUTED, fontSize: 14, lineHeight: 1.7 }}>
                {answeredCount}/{total}টি উত্তর দেওয়া হয়েছে
                {total - answeredCount > 0 ? ` — ${total - answeredCount}টি উত্তর দেওয়া হয়নি (০ নম্বর পাবে)` : ' — সব প্রশ্নের উত্তর দেওয়া হয়েছে'}।
                জমা দিলে আর বদলানো যাবে না।
              </p>
              {submitError ? <AlertBox tone="error">{submitError}</AlertBox> : null}
              <div style={{ display: 'flex', gap: 8 }}>
                <Button variant="accent" disabled={submitting} onClick={() => void doSubmit(false)}>
                  {submitting ? 'জমা হচ্ছে…' : 'হ্যাঁ, জমা দিন'}
                </Button>
                <Button variant="outline" disabled={submitting} onClick={() => setConfirming(false)}>
                  ফিরে যান
                </Button>
              </div>
            </Card>
          ) : null}

          <p style={{ marginTop: 16, color: MUTED, fontSize: 13 }}>
            <Link to={`/jobs/${mock.examSlug}`} style={{ fontWeight: 600 }}>← {examNameBn} হাবে ফিরুন</Link>
            {' · '}অগ্রগতি স্বয়ংক্রিয়ভাবে সংরক্ষিত হয় — মাঝপথে চলে গেলে পরে এসে এই মকেই আবার শুরু করলে আগের সেশনটি ফিরে পাবেন।
          </p>
        </div>

        <div>
          <Card>
            <div style={{ fontWeight: 700, color: '#142B3B', marginBottom: 4 }}>প্রশ্ন-তালিকা</div>
            <p style={{ margin: '0 0 12px', color: MUTED, fontSize: 13 }}>
              নীল = উত্তর দেওয়া হয়েছে · সাদা = উত্তর দেওয়া হয়নি · হলুদ চিহ্ন = পরে দেখব
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
                    aria-label={`প্রশ্ন ${q.n}`}
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
