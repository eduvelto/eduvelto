// Eduvelto — Free Quiz (owner order 28 Nov 2026, quiz +
// certificate batch).
//
// PUBLIC, no login, no Firestore reads or writes. Each attempt draws
// 10 UNIQUE questions by shuffling a verified static pool (see
// src/lib/freeQuiz.ts): General Knowledge, BCS, English, Islamic
// knowledge. 5-minute countdown (auto-submits at zero), live
// scoreboard, and per-question explanations — shown ONLY where the
// bank actually has one; otherwise just the correct answer, never
// an invented explanation. At the end: type your name → certificate
// (canvas-rendered, Bangla-safe, PDF + PNG, QR + verification ID)
// + result share (Web Share API with copy-link fallback).
// Practice quiz only — never a real exam or a mock.

import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { AlertBox, Button, Card, Chip, ProgressBar } from '../components/ui';
import { useLanguage } from '../i18n/LanguageContext';
import {
  FREE_QUIZ_CATEGORIES,
  FREE_QUIZ_COUNT,
  FREE_QUIZ_TIME_LIMIT_SECONDS,
  freeQuizCategoryName,
  freeQuizPoolFor,
  selectFreeQuizQuestions,
  type FreeQuizCategorySelection,
  type FreeQuizQuestion,
} from '../lib/freeQuiz';
import {
  buildQuizCertificateData,
  certificateFileBase,
  downloadCanvasPng,
  downloadCertificatePdf,
  drawQuizCertificateCanvas,
  type QuizCertificateData,
} from '../lib/certificate';
import {
  buildFacebookShareUrl,
  buildReferralLink,
  buildReferralWhatsAppUrl,
  buildWhatsAppShareUrl,
  createReferral,
  recordReferralVisit,
  validateBkashNumber,
  validateReferralName,
} from '../lib/referrals';

type Phase = 'pick' | 'playing' | 'done';

function formatTime(totalSeconds: number): string {
  const s = Math.max(0, totalSeconds);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function FreeQuizPage() {
  const { t } = useLanguage();
  const [category, setCategory] = useState<FreeQuizCategorySelection>('all');
  const [phase, setPhase] = useState<Phase>('pick');
  const [questions, setQuestions] = useState<FreeQuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [secondsLeft, setSecondsLeft] = useState(FREE_QUIZ_TIME_LIMIT_SECONDS);
  const [name, setName] = useState('');
  const [cert, setCert] = useState<QuizCertificateData | null>(null);
  const [certError, setCertError] = useState('');
  const [certBusy, setCertBusy] = useState(false);
  const [downloaded, setDownloaded] = useState('');
  const [shareState, setShareState] = useState('');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const certCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const finishRef = useRef<() => void>(() => {});
  const quizName = useMemo(() => {
    const n = freeQuizCategoryName(category);
    return t({ bn: `ফ্রি কুইজ — ${n.bn}`, en: `Free Quiz — ${n.en}` });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  const startQuiz = (selection: FreeQuizCategorySelection) => {
    try {
      const qs = selectFreeQuizQuestions(selection);
      setCategory(selection);
      setQuestions(qs);
      setIndex(0);
      setAnswers({});
      setSecondsLeft(FREE_QUIZ_TIME_LIMIT_SECONDS);
      setName('');
      setCert(null);
      setCertError('');
      setDownloaded('');
      setShareState('');
      setPhase('playing');
    } catch {
      setCertError('pool');
    }
  };

  const finish = () => {
    setPhase((p) => {
      if (p === 'playing') return 'done';
      return p;
    });
  };
  finishRef.current = finish;

  // Countdown: auto-submit once at zero.
  useEffect(() => {
    if (phase !== 'playing') return;
    if (secondsLeft <= 0) {
      finishRef.current();
      return;
    }
    const timer = setTimeout(
      () => setSecondsLeft((s) => s - 1),
      1000,
    );
    return () => clearTimeout(timer);
  }, [phase, secondsLeft]);

  const q = questions[index];
  const answeredCount = questions.filter((x) => answers[x.id]).length;
  const score = questions.filter(
    (x) => answers[x.id] && answers[x.id] === x.correctLetter,
  ).length;
  const lowTime = secondsLeft <= 60;

  const choose = (letter: string) => {
    if (!q || answers[q.id]) return;
    setAnswers((a) => ({ ...a, [q.id]: letter }));
  };

  const next = () => {
    if (index + 1 >= questions.length) finish();
    else setIndex((i) => i + 1);
  };

  // Certificate: build once the name is given, draw the real canvas
  // preview (same canvas the PDF/PNG come from).
  const makeCertificate = async () => {
    if (!name.trim() || certBusy) return;
    setCertBusy(true);
    setCertError('');
    try {
      const data = buildQuizCertificateData(
        name,
        quizName,
        score,
        FREE_QUIZ_COUNT,
        todayIso(),
      );
      const { default: QRCode } = await import('qrcode');
      const qrDataUrl: string = await QRCode.toDataURL(data.verifyUrl, {
        width: 360,
        margin: 1,
        errorCorrectionLevel: 'M',
      });
      const canvas = await drawQuizCertificateCanvas(data, qrDataUrl);
      certCanvasRef.current = canvas;
      setCert(data);
    } catch {
      setCertError('cert');
    } finally {
      setCertBusy(false);
    }
  };

  const downloadPdf = async () => {
    const slot = canvasRef.current;
    if (!slot || !cert || certBusy) return;
    setCertBusy(true);
    try {
      await downloadCertificatePdf(slot, `${certificateFileBase(cert)}.pdf`);
      setDownloaded('pdf');
    } catch {
      setCertError('cert');
    } finally {
      setCertBusy(false);
    }
  };

  const downloadPng = () => {
    const slot = canvasRef.current;
    if (!slot || !cert) return;
    downloadCanvasPng(slot, `${certificateFileBase(cert)}.png`);
    setDownloaded('png');
  };

  const shareResult = async () => {
    if (!cert) return;
    const text = t({
      bn: `আমি Eduvelto-র ফ্রি কুইজে ১০-এর মধ্যে ${score} পেয়েছি (${quizName})। আমার সার্টিফিকেট দেখুন: ${cert.verifyUrl}`,
      en: `I scored ${score}/10 in Eduvelto's free quiz (${quizName}). See my certificate: ${cert.verifyUrl}`,
    });
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Eduvelto — Free Quiz', text, url: cert.verifyUrl });
        setShareState('shared');
        return;
      }
      throw new Error('no-share');
    } catch {
      try {
        await navigator.clipboard.writeText(cert.verifyUrl);
        setShareState('copied');
      } catch {
        setShareState('failed');
      }
    }
  };

  // Paint the drawn certificate into the preview slot once React has
  // mounted it (the slot only exists after `cert` is set, so painting
  // must happen in an effect — not in the same tick as setCert).
  useEffect(() => {
    const slot = canvasRef.current;
    const canvas = certCanvasRef.current;
    if (!cert || !slot || !canvas) return;
    slot.width = canvas.width;
    slot.height = canvas.height;
    const ctx = slot.getContext('2d');
    if (ctx) ctx.drawImage(canvas, 0, 0);
  }, [cert]);

  const poolTotal = freeQuizPoolFor(category).length;

  // Share-and-win (owner order 28 Nov 2026, 12:53).
  const [searchParams] = useSearchParams();
  const incomingRef = searchParams.get('ref') ?? '';
  const [linkName, setLinkName] = useState('');
  const [linkCode, setLinkCode] = useState('');
  const [linkBusy, setLinkBusy] = useState(false);
  const [linkError, setLinkError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [entryName, setEntryName] = useState('');
  const [entryBkash, setEntryBkash] = useState('');
  const [entryRef, setEntryRef] = useState(incomingRef);
  const [entryNameError, setEntryNameError] = useState('');
  const [entryBkashError, setEntryBkashError] = useState('');

  // Count this visit once if the visitor came through a referral
  // link (guarded inside recordReferralVisit: at most once per
  // browser per day, silent on unknown codes).
  useEffect(() => {
    if (!incomingRef) return;
    void recordReferralVisit(incomingRef);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomingRef]);

  const createLink = async () => {
    if (!linkName.trim() || linkBusy) return;
    setLinkBusy(true);
    setLinkError(false);
    try {
      const code = await createReferral(linkName);
      setLinkCode(code);
      setCopied(false);
      setCopyError(false);
      setEntryRef((r) => r || code);
    } catch {
      setLinkError(true);
    } finally {
      setLinkBusy(false);
    }
  };

  const copyLink = async () => {
    if (!linkCode) return;
    try {
      await navigator.clipboard.writeText(buildReferralLink(linkCode));
      setCopied(true);
      setCopyError(false);
    } catch {
      setCopied(false);
      setCopyError(true);
    }
  };

  const submitEntry = () => {
    const nameErr = validateReferralName(entryName);
    const bkashErr = validateBkashNumber(entryBkash);
    setEntryNameError(nameErr ? 'name' : '');
    setEntryBkashError(bkashErr ?? '');
    if (nameErr || bkashErr) return;
    window.open(
      buildReferralWhatsAppUrl(entryName, entryBkash, entryRef.trim()),
      '_blank',
      'noopener,noreferrer',
    );
  };

  const referralLink = linkCode ? buildReferralLink(linkCode) : '';
  const referralShareText = linkCode
    ? t({
        bn: `Eduvelto-র ফ্রি কুইজ খেলুন — ১০টি প্রশ্ন, ৫ মিনিট, যাচাইকৃত প্রশ্নভাণ্ডার থেকে। আমার লিংক দিয়ে খেলুন: ${referralLink}`,
        en: `Play Eduvelto's free quiz — 10 questions, 5 minutes, from the verified question bank. Play through my link: ${referralLink}`,
      })
    : '';

  return (
    <PageShell titleBn="ফ্রি কুইজ" titleEn="Free Quiz">
      <p style={{ color: 'var(--muted)', margin: '0 0 16px', lineHeight: 1.7 }}>
        {t({
          bn: `১০টি প্রশ্ন, ৫ মিনিট — প্রতিবার নতুন ১০টি প্রশ্ন আসে, যাচাইকৃত প্রশ্নভাণ্ডার থেকে। লগইন লাগে না, কিছু সংরক্ষণ করা হয় না। এটি অনুশীলনের কুইজ — আসল পরীক্ষা বা মক টেস্ট নয়।`,
          en: `10 questions, 5 minutes — a fresh set of 10 every time, drawn from the verified question bank. No sign-in, nothing is saved. This is a practice quiz — not a real exam or a mock test.`,
        })}
      </p>

      {phase === 'pick' ? (
        <>
          <Card style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, margin: '0 0 12px', color: 'var(--heading)' }}>
              {t({ bn: 'বিভাগ বেছে নিন', en: 'Choose a category' })}
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <Button
                variant={category === 'all' ? 'primary' : 'outline'}
                onClick={() => setCategory('all')}
              >
                {t({ bn: 'সব বিভাগ মিলিয়ে', en: 'All categories mixed' })}
              </Button>
              {FREE_QUIZ_CATEGORIES.map((c) => (
                <Button
                  key={c.id}
                  variant={category === c.id ? 'primary' : 'outline'}
                  onClick={() => setCategory(c.id)}
                >
                  {t({ bn: `${c.nameBn} (${c.count})`, en: `${c.nameEn} (${c.count})` })}
                </Button>
              ))}
            </div>
            <div style={{ marginTop: 14, fontSize: 14, lineHeight: 1.8, color: 'var(--muted)' }}>
              {category === 'all' ? (
                <p style={{ margin: 0 }}>
                  {t({
                    bn: '৪টি বিভাগের মোট ৩০৯টি যাচাইকৃত প্রশ্ন থেকে ১০টি আসবে।',
                    en: '10 questions drawn from 309 verified questions across all 4 categories.',
                  })}
                </p>
              ) : (
                FREE_QUIZ_CATEGORIES.filter((c) => c.id === category).map((c) => (
                  <p key={c.id} style={{ margin: 0 }}>
                    {t({ bn: `${c.nameBn}: ${c.sourceBn}`, en: `${c.nameEn}: ${c.sourceEn}` })}
                  </p>
                ))
              )}
            </div>
          </Card>
          <Button size="lg" onClick={() => startQuiz(category)}>
            {t({ bn: 'কুইজ শুরু করুন →', en: 'Start the quiz →' })}
          </Button>
          {certError === 'pool' ? (
            <AlertBox tone="error">
              {t({
                bn: 'এই বিভাগে এখনো ১০টি যাচাইকৃত প্রশ্ন নেই — অন্য বিভাগ বেছে নিন।',
                en: 'This category does not have 10 verified questions yet — please pick another category.',
              })}
            </AlertBox>
          ) : null}
        </>
      ) : null}

      {phase === 'playing' && q ? (
        <>
          <Card style={{ marginBottom: 16, borderTop: '4px solid #C9A227' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ margin: 0, fontWeight: 700 }}>
                {t({ bn: `প্রশ্ন ${index + 1} / ${FREE_QUIZ_COUNT}`, en: `Question ${index + 1} / ${FREE_QUIZ_COUNT}` })}
              </p>
              <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: lowTime ? '#B00020' : '#0A1F44' }}>
                {t({ bn: `বাকি সময়: ${formatTime(secondsLeft)}`, en: `Time left: ${formatTime(secondsLeft)}` })}
              </p>
            </div>
            <div style={{ marginTop: 12 }}>
              <ProgressBar
                value={(answeredCount / FREE_QUIZ_COUNT) * 100}
                label={t({ bn: `সঠিক: ${score} · উত্তর দেওয়া: ${answeredCount}/${FREE_QUIZ_COUNT}`, en: `Correct: ${score} · Answered: ${answeredCount}/${FREE_QUIZ_COUNT}` })}
              />
              <p style={{ color: 'var(--muted)', margin: '6px 0 0', fontSize: 14 }}>
                {t({ bn: `সরাসরি স্কোরবোর্ড — সঠিক: ${score} · ভুল: ${answeredCount - score} · বাকি: ${FREE_QUIZ_COUNT - answeredCount}`, en: `Live scoreboard — correct: ${score} · wrong: ${answeredCount - score} · left: ${FREE_QUIZ_COUNT - answeredCount}` })}
              </p>
            </div>
          </Card>

          {q.passage ? (
            <Card style={{ marginBottom: 16, background: 'var(--surface-muted, #f4f6f7)' }}>
              <p style={{ margin: 0, lineHeight: 1.8, fontStyle: 'italic' }}>{q.passage}</p>
            </Card>
          ) : null}

          <Card style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 17, color: 'var(--heading)', margin: '0 0 4px' }}>
              {index + 1}. {q.questionText}
            </h2>
            <p style={{ margin: '0 0 12px', color: 'var(--muted)', fontSize: 14 }}>
              {t({ bn: freeQuizCategoryName(q.category).bn, en: freeQuizCategoryName(q.category).en })}
            </p>
            <div role="radiogroup" aria-label={t({ bn: `প্রশ্ন ${index + 1}`, en: `Question ${index + 1}` })}>
              {q.options.map((o) => {
                const picked = answers[q.id] === o.letter;
                const revealed = Boolean(answers[q.id]);
                const isCorrect = o.letter === q.correctLetter;
                return (
                  <button
                    key={o.letter}
                    type="button"
                    disabled={revealed}
                    onClick={() => choose(o.letter)}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: 12,
                      marginBottom: 8,
                      border: revealed
                        ? isCorrect
                          ? '2px solid #1B7A3D'
                          : picked
                            ? '2px solid #B00020'
                            : '1px solid #C9D2E0'
                        : picked
                          ? '2px solid #0A1F44'
                          : '1px solid #C9D2E0',
                      borderRadius: 10,
                      cursor: revealed ? 'default' : 'pointer',
                      background: revealed
                        ? isCorrect
                          ? '#E6F4EA'
                          : picked
                            ? '#FDECEA'
                            : '#fff'
                        : '#fff',
                      color: 'var(--heading)',
                      fontSize: 15,
                    }}
                  >
                    <strong>{o.letter})</strong> {o.text}
                    {revealed && isCorrect ? ' ✓' : ''}
                    {revealed && picked && !isCorrect ? ' ✗' : ''}
                  </button>
                );
              })}
            </div>
            {answers[q.id] ? (
              <div style={{ marginTop: 12, padding: 12, borderRadius: 10, background: 'var(--surface-muted, #f4f6f7)' }}>
                <p style={{ margin: '0 0 6px', fontWeight: 700 }}>
                  {answers[q.id] === q.correctLetter
                    ? t({ bn: '✓ সঠিক!', en: '✓ Correct!' })
                    : t({ bn: `✗ ভুল — সঠিক উত্তর: ${q.correctLetter}`, en: `✗ Incorrect — correct answer: ${q.correctLetter}` })}
                </p>
                {q.explanation ? (
                  <p style={{ margin: 0, lineHeight: 1.7 }}>
                    <strong>{t({ bn: 'ব্যাখ্যা: ', en: 'Explanation: ' })}</strong>
                    {q.explanation}
                  </p>
                ) : (
                  <p style={{ margin: 0, color: 'var(--muted)' }}>
                    {t({
                      bn: 'এই প্রশ্নের ব্যাখ্যা প্রশ্নভাণ্ডারে নেই — সঠিক উত্তর উপরে দেখানো হয়েছে।',
                      en: 'No explanation is stored for this question in the bank — the correct answer is shown above.',
                    })}
                  </p>
                )}
              </div>
            ) : null}
          </Card>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button
              size="lg"
              disabled={!answers[q.id]}
              onClick={next}
            >
              {index + 1 >= questions.length
                ? t({ bn: 'ফলাফল দেখুন', en: 'See result' })
                : t({ bn: 'পরের প্রশ্ন →', en: 'Next question →' })}
            </Button>
            <Button variant="outline" onClick={() => finish()}>
              {t({ bn: 'এখনই শেষ করুন', en: 'Finish now' })}
            </Button>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 12 }}>
            {t({
              bn: 'সময় শেষ হলে কুইজ নিজে থেকেই জমা হবে — উত্তর না দেওয়া প্রশ্ন ভুল ধরা হবে।',
              en: 'When the time runs out the quiz submits itself — unanswered questions count as wrong.',
            })}
          </p>
        </>
      ) : null}

      {phase === 'done' ? (
        <>
          <Card style={{ marginBottom: 16, borderTop: '4px solid #C9A227' }}>
            <h2 style={{ fontSize: 20, margin: '0 0 10px', color: 'var(--heading)' }}>
              {t({ bn: 'ফলাফল', en: 'Result' })}
            </h2>
            <p style={{ fontSize: 24, fontWeight: 800, margin: '0 0 10px', color: 'var(--heading)' }}>
              {t({ bn: `নম্বর: ${score}/${FREE_QUIZ_COUNT}`, en: `Score: ${score}/${FREE_QUIZ_COUNT}` })}
            </p>
            <ProgressBar value={(score / FREE_QUIZ_COUNT) * 100} label={t({ bn: `নম্বর ${Math.round((score / FREE_QUIZ_COUNT) * 100)}%`, en: `Score ${Math.round((score / FREE_QUIZ_COUNT) * 100)}%` })} />
            <p style={{ fontSize: 13, color: '#5B6B8C', margin: '10px 0 0' }}>
              {t({
                bn: 'অনুশীলন ফলাফল — এটি যাচাইকৃত বা সরকারি ফল নয়।',
                en: 'Practice result — this is not a verified or official result.',
              })}
            </p>
            <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {questions.map((x, i) => (
                <Chip key={x.id} tone={answers[x.id] === x.correctLetter ? 'gold' : 'outline'}>
                  {i + 1}. {answers[x.id] === x.correctLetter ? '✓' : '✗'}
                </Chip>
              ))}
            </div>
          </Card>

          {questions.map((x, i) => (
            <Card key={x.id} style={{ marginBottom: 12 }}>
              <h3 style={{ fontSize: 16, color: 'var(--heading)', margin: '0 0 8px' }}>
                {i + 1}. {x.questionText}
              </h3>
              <p style={{ margin: '4px 0' }}>
                {t({ bn: 'আপনার উত্তর:', en: 'Your answer:' })}{' '}
                <strong>{answers[x.id] ?? '—'}</strong>{' '}
                {answers[x.id] === x.correctLetter ? (
                  <Chip>{t({ bn: '✓ সঠিক', en: '✓ Correct' })}</Chip>
                ) : (
                  <Chip tone="outline">
                    <span style={{ color: 'var(--error)' }}>{t({ bn: '✗ ভুল', en: '✗ Incorrect' })}</span>
                  </Chip>
                )}
              </p>
              {answers[x.id] !== x.correctLetter ? (
                <p style={{ margin: '4px 0' }}>
                  {t({ bn: 'সঠিক উত্তর:', en: 'Correct answer:' })}{' '}
                  <strong>{x.correctLetter}</strong>
                </p>
              ) : null}
              {x.explanation ? (
                <p style={{ margin: '8px 0 0', lineHeight: 1.7 }}>
                  <strong>{t({ bn: 'ব্যাখ্যা: ', en: 'Explanation: ' })}</strong>
                  {x.explanation}
                </p>
              ) : null}
            </Card>
          ))}

          <Card style={{ marginBottom: 16, borderTop: '4px solid #0A1F44' }}>
            <h2 style={{ fontSize: 18, margin: '0 0 6px', color: 'var(--heading)' }}>
              {t({ bn: 'আপনার সার্টিফিকেট', en: 'Your certificate' })}
            </h2>
            <p style={{ color: 'var(--muted)', margin: '0 0 12px', lineHeight: 1.7, fontSize: 14 }}>
              {t({
                bn: 'নামটি লিখুন — সার্টিফিকেটে ঠিক যেমন লিখবেন, তেমনই ছাপা হবে। সার্টিফিকেটে কোনো ব্যক্তির নাম বা স্বাক্ষর থাকে না — শুধু Eduvelto-র নাম, লোগো ও অফিসিয়াল সিল।',
                en: 'Type your name — it prints on the certificate exactly as you type it. The certificate carries no person\u2019s name or signature — only Eduvelto\u2019s name, logo and official seal.',
              })}
            </p>
            {!cert ? (
              <>
                <label
                  htmlFor="free-quiz-name"
                  style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6, color: 'var(--heading)' }}
                >
                  {t({ bn: 'আপনার নাম', en: 'Your name' })}
                </label>
                <input
                  id="free-quiz-name"
                  className="ev-input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t({ bn: 'যেমন: রহিম উদ্দিন', en: 'e.g. Rahim Uddin' })}
                  style={{ maxWidth: 420 }}
                />
                <div style={{ marginTop: 12 }}>
                  <Button size="lg" disabled={!name.trim() || certBusy} onClick={() => void makeCertificate()} loading={certBusy}>
                    {t({ bn: 'সার্টিফিকেট বানান', en: 'Make my certificate' })}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <canvas
                  ref={canvasRef}
                  style={{ width: '100%', height: 'auto', borderRadius: 8, border: '1px solid var(--line)' }}
                  aria-label={t({ bn: 'সার্টিফিকেট প্রিভিউ', en: 'Certificate preview' })}
                />
                <p style={{ fontSize: 14, margin: '12px 0', lineHeight: 1.7 }}>
                  {t({ bn: 'যাচাই আইডি: ', en: 'Verification ID: ' })}
                  <strong>{cert.verificationId}</strong>
                  {' · '}
                  <Link to={`/verify/${cert.verificationId}?d=${new URL(cert.verifyUrl).searchParams.get('d') ?? ''}`}>
                    {t({ bn: 'যাচাই পাতা দেখুন', en: 'Open the verify page' })}
                  </Link>
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  <Button onClick={() => void downloadPdf()} loading={certBusy}>
                    {t({ bn: 'PDF ডাউনলোড', en: 'Download PDF' })}
                  </Button>
                  <Button variant="outline" onClick={downloadPng}>
                    {t({ bn: 'PNG ডাউনলোড', en: 'Download PNG' })}
                  </Button>
                  <Button variant="outline" onClick={() => void shareResult()}>
                    {t({ bn: 'ফলাফল শেয়ার করুন', en: 'Share result' })}
                  </Button>
                </div>
                {downloaded ? (
                  <p style={{ color: 'var(--muted)', fontSize: 14, margin: '10px 0 0' }} role="status">
                    {t({ bn: 'ডাউনলোড হয়েছে।', en: 'Downloaded.' })}
                  </p>
                ) : null}
                {shareState === 'copied' ? (
                  <p style={{ color: 'var(--muted)', fontSize: 14, margin: '10px 0 0' }} role="status">
                    {t({ bn: 'শেয়ার লিংক কপি হয়েছে।', en: 'Share link copied.' })}
                  </p>
                ) : null}
                {shareState === 'shared' ? (
                  <p style={{ color: 'var(--muted)', fontSize: 14, margin: '10px 0 0' }} role="status">
                    {t({ bn: 'শেয়ার করা হয়েছে।', en: 'Shared.' })}
                  </p>
                ) : null}
                {shareState === 'failed' ? (
                  <p style={{ color: 'var(--error)', fontSize: 14, margin: '10px 0 0' }} role="alert">
                    {t({ bn: 'শেয়ার করা যায়নি — লিংকটি কপি করে শেয়ার করুন।', en: 'Could not share — please copy the link and share it.' })}
                  </p>
                ) : null}
                <p style={{ fontSize: 13, color: 'var(--muted)', margin: '12px 0 0', lineHeight: 1.7 }}>
                  {t({
                    bn: 'এই সার্টিফিকেটের বিবরণ শুধু এর যাচাই লিংকেই আছে — Eduvelto-র সার্ভারে এর কোনো রেকর্ড নেই।',
                    en: 'This certificate\u2019s details live only in its verify link — Eduvelto keeps no server record of it.',
                  })}
                </p>
              </>
            )}
            {certError === 'cert' ? (
              <AlertBox tone="error">
                {t({ bn: 'সার্টিফিকেট বানানো যায়নি — আবার চেষ্টা করুন।', en: 'Could not make the certificate — please try again.' })}
              </AlertBox>
            ) : null}
          </Card>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <Button variant="outline" onClick={() => startQuiz(category)}>
              {t({ bn: 'আবার খেলুন — নতুন ১০টি প্রশ্ন', en: 'Play again — a new set of 10' })}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setPhase('pick');
                setCert(null);
                setName('');
              }}
            >
              {t({ bn: 'বিভাগ বদলান', en: 'Change category' })}
            </Button>
          </div>
          <p style={{ marginTop: 16, fontSize: 13, color: 'var(--muted)' }}>
            {t({
              bn: `প্রশ্নভাণ্ডার: এই বিভাগে ${poolTotal}টি যাচাইকৃত প্রশ্ন।`,
              en: `Question bank: ${poolTotal} verified questions in this selection.`,
            })}
          </p>
        </>
      ) : null}

      {/* Share-and-win (owner order 28 Nov 2026, 12:53) — under the quiz. */}
      <Card style={{ marginTop: 24, borderTop: '4px solid #C9A227' }}>
        <h2 style={{ fontSize: 19, margin: '0 0 8px', color: 'var(--heading)' }}>
          {t({ bn: 'শেয়ার করুন, জিতুন ৳১০০ মোবাইল রিচার্জ', en: 'Share and win ৳100 mobile recharge' })}
        </h2>
        <p style={{ margin: '0 0 16px', lineHeight: 1.7, color: 'var(--muted)' }}>
          {t({
            bn: 'কুইজটি বন্ধুদের সঙ্গে শেয়ার করুন — প্রতি মাসে ৫ জন বিজয়ী পাবেন ৳১০০ মোবাইল রিচার্জ। আপনার লিংক দিয়ে যত বেশি মানুষ আসবে, জেতার সুযোগ তত বেশি।',
            en: 'Share the quiz with your friends — 5 winners every month each get ৳100 mobile recharge. The more visitors come through your link, the better your chance of winning.',
          })}
        </p>

        <h3 style={{ fontSize: 16, margin: '0 0 8px', color: 'var(--heading)' }}>
          {t({ bn: '১. আপনার শেয়ার লিংক বানান', en: '1. Create your share link' })}
        </h3>
        {!linkCode ? (
          <>
            <label
              htmlFor="referral-name"
              style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6, color: 'var(--heading)' }}
            >
              {t({ bn: 'আপনার নাম', en: 'Your name' })}
            </label>
            <input
              id="referral-name"
              className="ev-input"
              type="text"
              value={linkName}
              onChange={(e) => setLinkName(e.target.value)}
              placeholder={t({ bn: 'যেমন: রহিম উদ্দিন', en: 'e.g. Rahim Uddin' })}
              style={{ maxWidth: 420 }}
            />
            <div style={{ marginTop: 12 }}>
              <Button size="lg" disabled={!linkName.trim() || linkBusy} onClick={() => void createLink()} loading={linkBusy}>
                {t({ bn: 'আমার শেয়ার লিংক বানান', en: 'Create my share link' })}
              </Button>
            </div>
            {linkError ? (
              <AlertBox tone="error">
                {t({
                  bn: 'লিংক বানানো যায়নি — ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন।',
                  en: 'Could not create the link — please check your connection and try again.',
                })}
              </AlertBox>
            ) : null}
          </>
        ) : (
          <>
            <p style={{ margin: '0 0 8px', lineHeight: 1.7 }}>
              {t({ bn: 'আপনার শেয়ার লিংক:', en: 'Your share link:' })}
              <br />
              <strong style={{ wordBreak: 'break-all' }}>{referralLink}</strong>
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <Button onClick={() => void copyLink()}>
                {t({ bn: 'লিংক কপি করুন', en: 'Copy link' })}
              </Button>
              <a
                href={buildWhatsAppShareUrl(referralShareText)}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: 'none' }}
              >
                <Button variant="outline">{t({ bn: 'WhatsApp-এ শেয়ার করুন', en: 'Share on WhatsApp' })}</Button>
              </a>
              <a
                href={buildFacebookShareUrl(referralLink, referralShareText)}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: 'none' }}
              >
                <Button variant="outline">{t({ bn: 'Facebook-এ শেয়ার করুন', en: 'Share on Facebook' })}</Button>
              </a>
            </div>
            {copied ? (
              <p style={{ color: 'var(--muted)', fontSize: 14, margin: '10px 0 0' }} role="status">
                {t({ bn: 'লিংক কপি হয়েছে।', en: 'Link copied.' })}
              </p>
            ) : null}
            {copyError ? (
              <p style={{ color: 'var(--error)', fontSize: 14, margin: '10px 0 0' }} role="alert">
                {t({ bn: 'কপি করা যায়নি — লিংকটি চেপে ধরে কপি করুন।', en: 'Could not copy — please long-press the link to copy it.' })}
              </p>
            ) : null}
          </>
        )}

        <h3 style={{ fontSize: 16, margin: '20px 0 8px', color: 'var(--heading)' }}>
          {t({ bn: '২. অংশ নিতে ফরমটি পূরণ করুন', en: '2. Fill in the form to enter' })}
        </h3>
        <p style={{ margin: '0 0 12px', lineHeight: 1.7, fontSize: 14, color: 'var(--muted)' }}>
          {t({
            bn: 'নাম ও বিকাশ নম্বর দিন — জমা দিলে WhatsApp খুলবে, সেখানেই আপনার এন্ট্রি পাঠাবেন।',
            en: 'Give your name and bKash number — submitting opens WhatsApp, where you send your entry.',
          })}
        </p>
        <label
          htmlFor="entry-name"
          style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6, color: 'var(--heading)' }}
        >
          {t({ bn: 'আপনার নাম', en: 'Your name' })}
        </label>
        <input
          id="entry-name"
          className="ev-input"
          type="text"
          value={entryName}
          onChange={(e) => {
            setEntryName(e.target.value);
            setEntryNameError('');
          }}
          placeholder={t({ bn: 'যেমন: রহিম উদ্দিন', en: 'e.g. Rahim Uddin' })}
          style={{ maxWidth: 420 }}
        />
        {entryNameError ? (
          <p style={{ color: 'var(--error)', fontSize: 14, margin: '6px 0 0' }} role="alert">
            {t({ bn: 'নাম লিখুন।', en: 'Please type your name.' })}
          </p>
        ) : null}
        <label
          htmlFor="entry-bkash"
          style={{ display: 'block', fontSize: 14, fontWeight: 600, margin: '14px 0 6px', color: 'var(--heading)' }}
        >
          {t({ bn: 'বিকাশ নম্বর', en: 'bKash number' })}
        </label>
        <input
          id="entry-bkash"
          className="ev-input"
          type="tel"
          inputMode="numeric"
          value={entryBkash}
          onChange={(e) => {
            setEntryBkash(e.target.value);
            setEntryBkashError('');
          }}
          placeholder={t({ bn: 'যেমন: 01712345678', en: 'e.g. 01712345678' })}
          style={{ maxWidth: 420 }}
        />
        {entryBkashError === 'empty' ? (
          <p style={{ color: 'var(--error)', fontSize: 14, margin: '6px 0 0' }} role="alert">
            {t({ bn: 'বিকাশ নম্বর লিখুন।', en: 'Please type your bKash number.' })}
          </p>
        ) : null}
        {entryBkashError === 'invalid' ? (
          <p style={{ color: 'var(--error)', fontSize: 14, margin: '6px 0 0' }} role="alert">
            {t({
              bn: 'বিকাশ নম্বর ১১ সংখ্যার হতে হবে এবং 01 দিয়ে শুরু হতে হবে।',
              en: 'The bKash number must be 11 digits starting with 01.',
            })}
          </p>
        ) : null}
        <label
          htmlFor="entry-ref"
          style={{ display: 'block', fontSize: 14, fontWeight: 600, margin: '14px 0 6px', color: 'var(--heading)' }}
        >
          {t({ bn: 'রেফারেল কোড', en: 'Referral code' })}
        </label>
        <input
          id="entry-ref"
          className="ev-input"
          type="text"
          value={entryRef}
          onChange={(e) => setEntryRef(e.target.value)}
          placeholder={t({ bn: 'যেমন: aK3xQ9', en: 'e.g. aK3xQ9' })}
          style={{ maxWidth: 420 }}
        />
        <div style={{ marginTop: 14 }}>
          <Button size="lg" onClick={submitEntry}>
            {t({ bn: 'WhatsApp-এ এন্ট্রি পাঠান', en: 'Send entry on WhatsApp' })}
          </Button>
        </div>

        <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--muted)', margin: '20px 0 0' }}>
          {t({
            bn: 'শর্তাবলি: প্রতি মাসে ৫ জন বিজয়ী, প্রত্যেকে ৳১০০ মোবাইল রিচার্জ পাবেন — দেওয়া বিকাশ নম্বরেই। বিজয়ীদের ওই নম্বরেই যোগাযোগ করা হবে।',
            en: 'Terms: 5 winners every month, each gets ৳100 mobile recharge — to the bKash number given. Winners are contacted on that number.',
          })}
        </p>
        <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--muted)', margin: '10px 0 0' }}>
          {t({
            bn: 'সততার কথা: ভিজিটর সংখ্যা শুধু একটি নির্দেশক — এটি বাড়িয়ে দেখানো যায়, তাই এটি প্রতারণা-প্রমাণ নয়। বিজয়ী বাছাই করা হয় সংখ্যা ও যাচাই মিলিয়ে; শুধু লিংকে ক্লিক গোনা হয়, শেয়ারটি নিজে যাচাই করা হয় না।',
            en: 'An honest note: visitor counts are only a guide — they can be inflated and are not fraud-proof. Winners are picked by count plus a sanity check; only link clicks are counted, the share itself is not verified.',
          })}
        </p>
      </Card>
    </PageShell>
  );
}
