// Eduvelto — Syllabus-Based Exam Engine (owner order 28 Nov 2026,
// 10:23).
//
// PUBLIC, login-free, zero Firestore reads. When a student picks an
// exam, the page shows that exam's OFFICIAL pattern — derived ONLY
// from the verified JOB_RULES_CONFIGS (src/lib/jobExams.ts): the
// real subject split, real timing and the verified negative marking
// (BCS −0.50, Bank −0.25, Primary −0.25, NTRCA 18th −0.25). The
// owner's shorthand ("BCS Bangla 35, English 35…") is never used.
// The 19th NTRCA pattern is unresolved, so NTRCA shows the
// last-verified 18th pattern and says so. Exams without a verified
// pattern are not offered — unknown slugs show an honest message.
//
// The engine serves questions ONLY from the bundled verified pool:
// BCS English has 35 verified questions; every other subject shows
// "এই বিষয়ে যাচাইকৃত প্রশ্ন এখনো নেই" instead of serving drafts.
// NO full mock is runnable on verified questions alone. The one
// runnable mock is the BCS English SECTION mock: 30 unique shuffled
// questions, 18 minutes (official pace: 120 min / 200 questions =
// 36 s per question), −0.50 per wrong answer, instant result with
// explanations. The result is labelled practice only — never a real
// exam result (same binding label as the job engine).

import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { AlertBox, Button, Card, Chip, LinkButton } from '../components/ui';
import { useLanguage } from '../i18n/LanguageContext';
import { PUBLIC_BCS_ENGLISH_QUESTIONS, PUBLIC_BCS_READING_PASSAGE, type PublicBcsQuestion } from '../lib/publicBcsEnglish';
import {
  BANK_STATE,
  SYLLABUS_MOCK_EXAMS,
  syllabusMockPlan,
  type SyllabusMockPlan,
} from '../lib/jobAdmissionPrep';

const EXAM_NAMES: Record<string, { bn: string; en: string }> = {
  bcs: { bn: 'বিসিএস', en: 'BCS' },
  bank: { bn: 'ব্যাংক', en: 'Bank' },
  'primary-teacher': { bn: 'প্রাথমিক শিক্ষক', en: 'Primary Teacher' },
  ntrca: { bn: 'NTRCA', en: 'NTRCA' },
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function formatTime(totalSeconds: number): string {
  const s = Math.max(0, totalSeconds);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

type Phase = 'plan' | 'playing' | 'done';

export default function SyllabusMockPage() {
  const { t } = useLanguage();
  const { exam } = useParams<{ exam?: string }>();
  const examSlug = exam ?? 'bcs';
  const plan: SyllabusMockPlan | null = useMemo(() => syllabusMockPlan(examSlug), [examSlug]);

  const [phase, setPhase] = useState<Phase>('plan');
  const [questions, setQuestions] = useState<PublicBcsQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [secondsLeft, setSecondsLeft] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Switching exam resets any running mock.
  useEffect(() => {
    setPhase('plan');
    setQuestions([]);
    setAnswers({});
    setIndex(0);
    if (timerRef.current) clearInterval(timerRef.current);
  }, [examSlug]);

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const startSectionMock = () => {
    if (!plan?.sectionMock) return;
    const picked = shuffle(PUBLIC_BCS_ENGLISH_QUESTIONS).slice(0, plan.sectionMock.questionCount);
    setQuestions(picked);
    setAnswers({});
    setIndex(0);
    setSecondsLeft(plan.sectionMock.timeMinutes * 60);
    setPhase('playing');
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setPhase('done');
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  const submitMock = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase('done');
  };

  const result = useMemo(() => {
    if (phase !== 'done' || !plan?.sectionMock) return null;
    let correct = 0;
    let wrong = 0;
    let skipped = 0;
    for (const q of questions) {
      const a = answers[q.id];
      if (!a) skipped++;
      else if (a === q.correctLetter) correct++;
      else wrong++;
    }
    const score = correct - wrong * plan.sectionMock.negativeMarking;
    return { correct, wrong, skipped, score, total: questions.length };
  }, [phase, questions, answers, plan]);

  const examName = EXAM_NAMES[examSlug];

  return (
    <PageShell titleBn="সিলেবাস-ভিত্তিক মক টেস্ট" titleEn="Syllabus-Based Mock Test" wide>
      <p style={{ lineHeight: 1.8, color: 'var(--ink-soft)' }}>
        {t({
          bn: 'পরীক্ষা বেছে নিন — প্রশ্ন আসবে সেই পরীক্ষার অফিসিয়াল সিলেবাস ও নম্বর-বণ্টন অনুযায়ী, আসল সময় ও নেগেটিভ মার্কিংসহ। শুধু যাচাইকৃত প্রশ্নই দেওয়া হয়।',
          en: 'Pick an exam — questions follow that exam’s official syllabus and mark distribution, with real timing and negative marking. Only verified questions are served.',
        })}
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {SYLLABUS_MOCK_EXAMS.map((slug) => (
          <Link key={slug} to={`/jobs/syllabus-mock/${slug}`}>
            <Chip tone={slug === examSlug ? 'navy' : 'outline'}>
              {t({ bn: EXAM_NAMES[slug].bn, en: EXAM_NAMES[slug].en })}
            </Chip>
          </Link>
        ))}
      </div>

      {!plan || !examName ? (
        <AlertBox tone="info">
          {t({
            bn: 'এই পরীক্ষার ধরন এখনো যাচাই হয়নি — অফিসিয়াল সার্কুলার দেখুন। যাচাইকৃত ধরন আছে শুধু বিসিএস, ব্যাংক, প্রাথমিক শিক্ষক ও NTRCA (১৮তম)-র।',
            en: 'This exam’s pattern is not verified yet — see the official circular. Verified patterns exist only for BCS, Bank, Primary Teacher and NTRCA (18th).',
          })}
        </AlertBox>
      ) : phase === 'plan' ? (
        <>
          <Card style={{ marginBottom: 12 }}>
            <h2 style={{ margin: '0 0 8px', fontSize: 18 }}>
              {t({ bn: `${examName.bn} — অফিসিয়াল ধরন`, en: `${examName.en} — Official Pattern` })}
            </h2>
            <p style={{ margin: '0 0 6px', lineHeight: 1.8 }}>
              {t({
                bn: `${plan.questionCount}টি প্রশ্ন, ${plan.timeMinutes} মিনিট, মোট ${plan.totalMarks} নম্বর। ভুল উত্তরে ${plan.negativeMarking !== null ? `−${plan.negativeMarking.toFixed(2)}` : '—'} নম্বর কাটা যায়${plan.negativeMarkingVerified ? ' (যাচাইকৃত ধরন)' : ''}।`,
                en: `${plan.questionCount} questions, ${plan.timeMinutes} minutes, ${plan.totalMarks} marks in total. A wrong answer loses ${plan.negativeMarking !== null ? `−${plan.negativeMarking.toFixed(2)}` : '—'}${plan.negativeMarkingVerified ? ' (verified pattern)' : ''}.`,
              })}
            </p>
            {plan.applicableCycle ? (
              <p style={{ margin: 0, lineHeight: 1.8, color: 'var(--ink-soft)' }}>
                {t({
                  bn: `এই ধরনটি ${plan.applicableCycle} পরীক্ষার জন্য যাচাইকৃত — ১৯তম NTRCA-র ধরন এখনো অমীমাংসিত, তাই তা অনুমান করা হয়নি।`,
                  en: `This pattern is verified for the ${plan.applicableCycle} exam — the 19th NTRCA pattern is still unresolved, so it is not guessed.`,
                })}
              </p>
            ) : null}
          </Card>

          <Card style={{ marginBottom: 12 }}>
            <h2 style={{ margin: '0 0 8px', fontSize: 18 }}>
              {t({ bn: 'বিষয়ভিত্তিক নম্বর-বণ্টন ও যাচাইকৃত প্রশ্ন', en: 'Subject-Wise Marks & Verified Questions' })}
            </h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', lineHeight: 1.8 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid var(--hatch-widget-border)', padding: '6px 4px' }}>
                    {t({ bn: 'বিষয়', en: 'Subject' })}
                  </th>
                  <th style={{ textAlign: 'right', borderBottom: '1px solid var(--hatch-widget-border)', padding: '6px 4px' }}>
                    {t({ bn: 'নম্বর', en: 'Marks' })}
                  </th>
                  <th style={{ textAlign: 'right', borderBottom: '1px solid var(--hatch-widget-border)', padding: '6px 4px' }}>
                    {t({ bn: 'যাচাইকৃত প্রশ্ন', en: 'Verified questions' })}
                  </th>
                </tr>
              </thead>
              <tbody>
                {plan.subjects.map((s) => (
                  <tr key={s.nameEn}>
                    <td style={{ borderBottom: '1px solid var(--hatch-widget-border)', padding: '6px 4px' }}>
                      {t({ bn: s.nameBn, en: s.nameEn })}
                    </td>
                    <td style={{ textAlign: 'right', borderBottom: '1px solid var(--hatch-widget-border)', padding: '6px 4px' }}>{s.marks}</td>
                    <td style={{ textAlign: 'right', borderBottom: '1px solid var(--hatch-widget-border)', padding: '6px 4px' }}>
                      {s.hasNoVerifiedQuestions
                        ? t({ bn: 'এই বিষয়ে যাচাইকৃত প্রশ্ন এখনো নেই', en: 'No verified questions for this subject yet' })
                        : s.verifiedAvailable}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {plan.fullMockPossible ? null : (
            <AlertBox tone="info">
              {t({
                bn: `পূর্ণ মক এখনো দেওয়া যাচ্ছে না — সব বিষয়ে যাচাইকৃত প্রশ্ন নেই। ব্যাংকে যাচাইকৃত প্রশ্ন ${BANK_STATE.jobVerified}টি, কিন্তু পাবলিক বান্ডেলে এখন শুধু বিসিএস ইংরেজির ${PUBLIC_BCS_ENGLISH_QUESTIONS.length}টি প্রশ্ন আছে।`,
                en: `A full mock is not available yet — not every subject has verified questions. The bank holds ${BANK_STATE.jobVerified} verified questions, but the public bundle currently has only the ${PUBLIC_BCS_ENGLISH_QUESTIONS.length} BCS English questions.`,
              })}
            </AlertBox>
          )}

          {plan.sectionMock ? (
            <Card style={{ marginTop: 12 }}>
              <h2 style={{ margin: '0 0 8px', fontSize: 18 }}>
                {t({ bn: 'চালানো যাবে: ইংরেজি বিভাগের মক', en: 'Runnable now: English section mock' })}
              </h2>
              <p style={{ margin: '0 0 10px', lineHeight: 1.8 }}>
                {t({
                  bn: `${plan.sectionMock.questionCount}টি যাচাইকৃত প্রশ্ন, ${plan.sectionMock.timeMinutes} মিনিট (অফিসিয়াল গতি: ৩৬ সেকেন্ড/প্রশ্ন), ভুল উত্তরে −${plan.sectionMock.negativeMarking.toFixed(2)}।`,
                  en: `${plan.sectionMock.questionCount} verified questions, ${plan.sectionMock.timeMinutes} minutes (official pace: 36 seconds per question), −${plan.sectionMock.negativeMarking.toFixed(2)} per wrong answer.`,
                })}
              </p>
              <Button variant="primary" onClick={startSectionMock}>
                {t({ bn: 'মক শুরু করুন →', en: 'Start the mock →' })}
              </Button>
            </Card>
          ) : (
            <Card style={{ marginTop: 12 }}>
              <p style={{ margin: 0, lineHeight: 1.8 }}>
                {t({
                  bn: 'এই পরীক্ষার কোনো বিষয়ে যাচাইকৃত প্রশ্ন এখনো নেই — তাই মক চালানো যাচ্ছে না। যাচাইকৃত প্রশ্ন প্রকাশিত হলেই মক চালু হবে।',
                  en: 'No subject of this exam has verified questions yet — so no mock can run. The mock will open once verified questions are published.',
                })}
              </p>
            </Card>
          )}
        </>
      ) : phase === 'playing' && questions.length > 0 ? (
        <>
          <Card style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <strong>
                {t({ bn: `প্রশ্ন ${index + 1} / ${questions.length}`, en: `Question ${index + 1} / ${questions.length}` })}
              </strong>
              <strong style={{ color: secondsLeft <= 60 ? '#B91C1C' : 'inherit' }}>
                {t({ bn: `সময় বাকি: ${formatTime(secondsLeft)}`, en: `Time left: ${formatTime(secondsLeft)}` })}
              </strong>
            </div>
            <p style={{ margin: '12px 0', lineHeight: 1.8 }}>{questions[index].questionText}</p>
            {questions[index].topic === 'reading' ? (
              <p style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--ink-soft)' }}>{PUBLIC_BCS_READING_PASSAGE.text}</p>
            ) : null}
            <div style={{ display: 'grid', gap: 8 }}>
              {questions[index].options.map((o) => (
                <button
                  key={o.letter}
                  type="button"
                  onClick={() => setAnswers((a) => ({ ...a, [questions[index].id]: o.letter }))}
                  style={{
                    textAlign: 'left', padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                    border: answers[questions[index].id] === o.letter ? '2px solid var(--teal-text)' : '1px solid var(--hatch-widget-border)',
                    background: answers[questions[index].id] === o.letter ? 'var(--teal-soft, #E3F2F0)' : 'transparent',
                  }}
                >
                  <strong>{o.letter}.</strong> {o.text}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              <Button variant="outline" disabled={index === 0} onClick={() => setIndex((i) => Math.max(0, i - 1))}>
                {t({ bn: '← আগেরটি', en: '← Previous' })}
              </Button>
              {index < questions.length - 1 ? (
                <Button variant="primary" onClick={() => setIndex((i) => i + 1)}>
                  {t({ bn: 'পরেরটি →', en: 'Next →' })}
                </Button>
              ) : (
                <Button variant="primary" onClick={submitMock}>
                  {t({ bn: 'জমা দিন', en: 'Submit' })}
                </Button>
              )}
            </div>
          </Card>
          <p style={{ lineHeight: 1.8, color: 'var(--ink-soft)' }}>
            {t({
              bn: 'অনুশীলন মক — নিয়োগ পরীক্ষার ফল নয়।',
              en: 'Practice mock — not a recruitment exam result.',
            })}
          </p>
        </>
      ) : phase === 'done' && result ? (
        <>
          <AlertBox tone="info">
            {t({
              bn: 'অনুশীলন ফলাফল — নিয়োগ পরীক্ষার ফল নয়।',
              en: 'Practice result — not a recruitment exam result.',
            })}
          </AlertBox>
          <Card style={{ margin: '12px 0' }}>
            <h2 style={{ margin: '0 0 8px', fontSize: 18 }}>
              {t({ bn: 'ফলাফল', en: 'Result' })}
            </h2>
            <p style={{ margin: '0 0 6px', lineHeight: 1.8 }}>
              {t({
                bn: `নম্বর: ${result.score} / ${result.total} (সঠিক ${result.correct}টি, ভুল ${result.wrong}টি, উত্তর দেওয়া হয়নি ${result.skipped}টি; ভুল উত্তরে −${plan!.sectionMock!.negativeMarking.toFixed(2)} করে কাটা হয়েছে)।`,
                en: `Score: ${result.score} / ${result.total} (correct ${result.correct}, wrong ${result.wrong}, skipped ${result.skipped}; −${plan!.sectionMock!.negativeMarking.toFixed(2)} per wrong answer).`,
              })}
            </p>
          </Card>
          {questions.map((q, i) => (
            <Card key={q.id} style={{ marginBottom: 12 }}>
              <p style={{ margin: '0 0 6px', lineHeight: 1.8 }}>
                <strong>{i + 1}. </strong>
                {q.questionText}
              </p>
              <p style={{ margin: '0 0 6px', lineHeight: 1.8 }}>
                {t({ bn: `আপনার উত্তর: ${answers[q.id] ?? '—'}; সঠিক উত্তর: ${q.correctLetter}`, en: `Your answer: ${answers[q.id] ?? '—'}; correct answer: ${q.correctLetter}` })}
              </p>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.8, color: 'var(--ink-soft)' }}>{q.explanation}</p>
            </Card>
          ))}
          <p>
            <Button variant="primary" onClick={() => setPhase('plan')}>
              {t({ bn: '← ধরনে ফিরুন', en: '← Back to the pattern' })}
            </Button>{' '}
            <LinkButton to="/jobs/recent-repeated" variant="accent">
              {t({ bn: 'সাম্প্রতিক ও বারবার আসা প্রশ্ন →', en: 'Recent & most repeated questions →' })}
            </LinkButton>
          </p>
        </>
      ) : null}

      <p style={{ marginTop: 20 }}>
        <Link to="/jobs" style={{ fontWeight: 600 }}>
          {t({ bn: '← চাকরির প্রস্তুতিতে ফিরুন', en: '← Back to job preparation' })}
        </Link>
      </p>
    </PageShell>
  );
}
