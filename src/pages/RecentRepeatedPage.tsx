// Eduvelto — Recent & Most Repeated Questions (owner order 28 Nov
// 2026, 10:23).
//
// PUBLIC, login-free, zero Firestore reads. The collection holds
// ONLY the already-verified questions in the public bundle: the 35
// owner-verified BCS English questions (Batch 1, published 22 Nov
// 2026). Nothing is scraped from the web and no unverified question
// is added. The 173 verified 46th BCS Preliminary PYQs live in the
// Firestore bank and are NOT in the public bundle yet — the page
// says so plainly instead of faking the count. Exam year is not
// recorded in the published batch, so no year is shown or guessed.

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { AlertBox, Card, Chip, LinkButton } from '../components/ui';
import { useLanguage } from '../i18n/LanguageContext';
import { PUBLIC_BCS_READING_PASSAGE, PUBLIC_BCS_TOPICS, type PublicBcsTopic } from '../lib/publicBcsEnglish';
import {
  BANK_STATE,
  RECENT_REPEATED_COUNT,
  RECENT_REPEATED_QUESTIONS,
  recentRepeatedByTopic,
} from '../lib/jobAdmissionPrep';

export default function RecentRepeatedPage() {
  const { t } = useLanguage();
  const [topic, setTopic] = useState<PublicBcsTopic | 'all'>('all');
  const questions = useMemo(
    () => (topic === 'all' ? RECENT_REPEATED_QUESTIONS : recentRepeatedByTopic(topic)),
    [topic],
  );

  return (
    <PageShell titleBn="সাম্প্রতিক ও বারবার আসা প্রশ্ন" titleEn="Recent & Most Repeated Questions" wide>
      <p style={{ lineHeight: 1.8, color: 'var(--ink-soft)' }}>
        {t({
          bn: `এই সংগ্রহে এখন ${RECENT_REPEATED_COUNT}টি যাচাইকৃত প্রশ্ন আছে — বিসিএস ইংরেজি ব্যাচ ১ (প্রকাশিত ২২ নভেম্বর ২০২৬)। প্রতিটি প্রশ্নের সঠিক উত্তর ও ব্যাখ্যা দেওয়া আছে।`,
          en: `This collection now holds ${RECENT_REPEATED_COUNT} verified questions — BCS English Batch 1 (published 22 Nov 2026). Every question shows its correct answer and explanation.`,
        })}
      </p>

      <AlertBox tone="info">
        {t({
          bn: `৪৬তম বিসিএস প্রিলিমিনারির ${BANK_STATE.bcs46thPyqInBank}টি যাচাইকৃত PYQ ব্যাংকে আছে, কিন্তু এখনো পাবলিক বান্ডেলে প্রকাশিত হয়নি — তাই সেগুলো এই সংগ্রহে নেই। প্রকাশিত হলেই এখানে যোগ হবে। পরীক্ষার বছর এই ব্যাচে লেখা নেই, তাই কোনো প্রশ্নে বছর দেখানো হয়নি।`,
          en: `The ${BANK_STATE.bcs46thPyqInBank} verified 46th BCS Preliminary PYQs are in the bank, but not yet published to the public bundle — so they are not in this collection. They will be added here once published. No exam year is recorded in this batch, so no year is shown on any question.`,
        })}
      </AlertBox>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '16px 0' }}>
        <button
          type="button"
          onClick={() => setTopic('all')}
          style={{
            padding: '6px 12px', borderRadius: 999, cursor: 'pointer',
            border: topic === 'all' ? '2px solid var(--teal-text)' : '1px solid var(--hatch-widget-border)',
            background: topic === 'all' ? 'var(--teal-soft, #E3F2F0)' : 'transparent',
            fontWeight: topic === 'all' ? 700 : 400,
          }}
        >
          {t({ bn: `সব (${RECENT_REPEATED_COUNT})`, en: `All (${RECENT_REPEATED_COUNT})` })}
        </button>
        {PUBLIC_BCS_TOPICS.map((tp) => (
          <button
            key={tp.topic}
            type="button"
            onClick={() => setTopic(tp.topic)}
            style={{
              padding: '6px 12px', borderRadius: 999, cursor: 'pointer',
              border: topic === tp.topic ? '2px solid var(--teal-text)' : '1px solid var(--hatch-widget-border)',
              background: topic === tp.topic ? 'var(--teal-soft, #E3F2F0)' : 'transparent',
              fontWeight: topic === tp.topic ? 700 : 400,
            }}
          >
            {t({ bn: `${tp.nameBn} (${tp.count})`, en: `${tp.nameEn} (${tp.count})` })}
          </button>
        ))}
      </div>

      {questions.map((r, i) => (
        <Card key={r.question.id} style={{ marginBottom: 12 }}>
          <p style={{ margin: '0 0 6px', lineHeight: 1.8 }}>
            <strong>{i + 1}. </strong>
            {r.question.questionText}
          </p>
          {r.question.topic === 'reading' ? (
            <p style={{ margin: '0 0 8px', fontSize: 14, lineHeight: 1.8, color: 'var(--ink-soft)' }}>{PUBLIC_BCS_READING_PASSAGE.text}</p>
          ) : null}
          <ol type="A" style={{ margin: '0 0 8px', paddingLeft: 20, lineHeight: 1.9 }}>
            {r.question.options.map((o) => (
              <li key={o.letter} style={{ fontWeight: o.letter === r.question.correctLetter ? 700 : 400 }}>
                {o.text}
                {o.letter === r.question.correctLetter ? ` — ${t({ bn: 'সঠিক উত্তর', en: 'Correct answer' })}` : ''}
              </li>
            ))}
          </ol>
          <p style={{ margin: '0 0 8px', fontSize: 14, lineHeight: 1.8, color: 'var(--ink-soft)' }}>
            {r.question.explanation}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <Chip>{t({ bn: `পরীক্ষা: ${r.examBn}`, en: `Exam: ${r.examEn}` })}</Chip>
            <Chip>{t({ bn: `বিষয়: ${r.topicBn}`, en: `Topic: ${r.topicEn}` })}</Chip>
            <Chip>{t({ bn: 'যাচাইকৃত প্রশ্ন', en: 'Verified question' })}</Chip>
          </div>
        </Card>
      ))}

      <p style={{ marginTop: 20 }}>
        <LinkButton to="/jobs/syllabus-mock/bcs" variant="accent">
          {t({ bn: 'সিলেবাস-মক দিয়ে নিজেকে পরীক্ষা করুন →', en: 'Test yourself with the syllabus mock →' })}
        </LinkButton>{' '}
        <LinkButton to="/free-quiz" variant="primary">
          {t({ bn: 'ফ্রি কুইজ প্রতিযোগিতা →', en: 'Free quiz competition →' })}
        </LinkButton>
      </p>
      <p style={{ marginTop: 16 }}>
        <Link to="/jobs" style={{ fontWeight: 600 }}>
          {t({ bn: '← চাকরির প্রস্তুতিতে ফিরুন', en: '← Back to job preparation' })}
        </Link>
      </p>
    </PageShell>
  );
}
