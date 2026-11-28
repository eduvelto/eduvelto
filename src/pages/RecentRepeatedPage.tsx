// Eduvelto — Recent & Most Repeated Questions (owner order 28 Nov
// 2026, 10:23).
//
// PUBLIC, login-free, zero Firestore reads. The collection holds
// ONLY the already-verified questions in the public bundle: the 35
// owner-verified BCS English questions (Batch 1, published 22 Nov
// 2026) PLUS the 173 verified 46th BCS Preliminary PYQs (exam
// 26 Apr 2024, Set-02, published to the bundle 28 Nov 2026) — 208
// in total. Nothing is scraped from the web and no unverified
// question is added. The 27 paper questions absent from the
// verified PYQ file are NOT in this collection — the page says so
// plainly instead of faking the count. Exam year is not recorded
// in the Batch-1 questions, so no year is shown on those; the PYQs
// carry their recorded year, 2024.

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { AlertBox, Card, Chip, LinkButton } from '../components/ui';
import { useLanguage } from '../i18n/LanguageContext';
import { PUBLIC_BCS_READING_PASSAGE, PUBLIC_BCS_TOPICS, type PublicBcsTopic } from '../lib/publicBcsEnglish';
import { PUBLIC_BCS_PYQ_SUBJECTS, type PublicBcsPyqSubject } from '../lib/publicBcsPyq';
import {
  BANK_STATE,
  RECENT_REPEATED_COUNT,
  RECENT_REPEATED_QUESTIONS,
  bnDigits,
  recentRepeatedByTopic,
} from '../lib/jobAdmissionPrep';

export default function RecentRepeatedPage() {
  const { t } = useLanguage();
  const [topic, setTopic] = useState<PublicBcsTopic | PublicBcsPyqSubject | 'all'>('all');
  const questions = useMemo(
    () => (topic === 'all' ? RECENT_REPEATED_QUESTIONS : recentRepeatedByTopic(topic)),
    [topic],
  );

  return (
    <PageShell titleBn="সাম্প্রতিক ও বারবার আসা প্রশ্ন" titleEn="Recent & Most Repeated Questions" wide>
      <p style={{ lineHeight: 1.8, color: 'var(--ink-soft)' }}>
        {t({
          bn: `এই সংগ্রহে এখন ${bnDigits(RECENT_REPEATED_COUNT)}টি যাচাইকৃত প্রশ্ন আছে — বিসিএস ইংরেজি ব্যাচ ১ (${bnDigits(35)}টি, প্রকাশিত ২২ নভেম্বর ২০২৬) + ৪৬তম বিসিএস প্রিলিমিনারির যাচাইকৃত PYQ (${bnDigits(BANK_STATE.bcs46thPyqInBank)}টি, পরীক্ষা ২৬ এপ্রিল ২০২৪, সেট-০২)। প্রতিটি প্রশ্নের সঠিক উত্তর ও ব্যাখ্যা দেওয়া আছে।`,
          en: `This collection now holds ${RECENT_REPEATED_COUNT} verified questions — BCS English Batch 1 (35, published 22 Nov 2026) + the verified 46th BCS Preliminary PYQs (${BANK_STATE.bcs46thPyqInBank}, exam 26 Apr 2024, Set-02). Every question shows its correct answer and explanation.`,
        })}
      </p>

      <AlertBox tone="info">
        {t({
          bn: `৪৬তম বিসিএস প্রিলিমিনারির ২০০টি প্রশ্নের মধ্যে যাচাইকৃত ${bnDigits(BANK_STATE.bcs46thPyqInBank)}টি এখানে আছে; বাকি ২৭টি যাচাইকৃত সেটে নেই, তাই সেগুলোর বদলে কোনো প্রশ্ন লেখা হয়নি। ব্যাংকে আরও যাচাইকৃত প্রশ্ন আছে যা এখনো পাবলিক বান্ডেলে প্রকাশিত হয়নি — প্রকাশিত হলেই এখানে যোগ হবে। ব্যাচ ১-এর প্রশ্নে পরীক্ষার বছর লেখা নেই, তাই সেগুলোতে বছর দেখানো হয়নি; PYQ-গুলোতে ২০২৪ সাল দেখানো হয়েছে।`,
          en: `Of the 46th BCS Preliminary's 200 questions, the ${BANK_STATE.bcs46thPyqInBank} verified ones are here; the other 27 are not in the verified set, so no substitute question was written for them. The bank holds more verified questions that are not yet published to the public bundle — they will be added here once published. No exam year is recorded for the Batch 1 questions, so no year is shown on those; the PYQs show 2024.`,
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
          {t({ bn: `সব (${bnDigits(RECENT_REPEATED_COUNT)})`, en: `All (${RECENT_REPEATED_COUNT})` })}
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
        {PUBLIC_BCS_PYQ_SUBJECTS.map((sb) => (
          <button
            key={sb.subject}
            type="button"
            onClick={() => setTopic(sb.subject)}
            style={{
              padding: '6px 12px', borderRadius: 999, cursor: 'pointer',
              border: topic === sb.subject ? '2px solid var(--teal-text)' : '1px solid var(--hatch-widget-border)',
              background: topic === sb.subject ? 'var(--teal-soft, #E3F2F0)' : 'transparent',
              fontWeight: topic === sb.subject ? 700 : 400,
            }}
          >
            {t({ bn: `${sb.nameBn} (${sb.count})`, en: `${sb.nameEn} (${sb.count})` })}
          </button>
        ))}
      </div>

      {questions.map((r, i) => (
        <Card key={r.question.id} style={{ marginBottom: 12 }}>
          <p style={{ margin: '0 0 6px', lineHeight: 1.8 }}>
            <strong>{i + 1}. </strong>
            {r.question.questionText}
          </p>
          {r.topic === 'reading' ? (
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
            {r.subtopic ? <Chip>{r.subtopic}</Chip> : null}
            {r.year !== null ? <Chip>{t({ bn: `${bnDigits(r.year)}`, en: `${r.year}` })}</Chip> : null}
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
