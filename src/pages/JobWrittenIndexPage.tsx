// Eduvelto — written exam preparation index (design §2.9).
//
// /jobs/:exam/written — the per-exam written index. Lists the
// code-shaped written questions for this exam (English first,
// owner-verified; all other subjects DRAFT/UNVERIFIED). Reading the
// teaching elements is public; writing + submitting needs sign-in
// (same auth-gating as practice/mocks).

import { Link, useParams } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { Card, LinkButton, Reveal } from '../components/ui';
import { useLanguage } from '../i18n/LanguageContext';
import { jobExamBySlug } from '../lib/jobExams';
import { writtenQuestionsForExam } from '../lib/jobWrittenContent';
import { writtenTemplate } from '../lib/jobWritten';

export default function JobWrittenIndexPage() {
  const { t, lang } = useLanguage();
  const { exam = '' } = useParams<{ exam: string }>();
  const def = jobExamBySlug(exam);
  const questions = writtenQuestionsForExam(exam);

  if (!def) {
    return (
      <PageShell titleBn="পরীক্ষা পাওয়া যায়নি" titleEn="Exam not found" wide>
        <p style={{ marginTop: 16 }}>
          <Link to="/jobs" style={{ fontWeight: 600 }}>
            {t({ bn: '← সব পরীক্ষা দেখুন', en: '← See all exams' })}
          </Link>
        </p>
      </PageShell>
    );
  }

  return (
    <PageShell titleBn={`${def.bn} — লিখিত প্রস্তুতি`} titleEn={`${def.en} — Written Preparation`} wide maxWidth={1240}>
      <p style={{ margin: '0 0 12px' }}>
        <Link to={`/jobs/${def.slug}`} style={{ fontWeight: 600 }}>
          {t({ bn: `← ${def.bn}`, en: `← ${def.en}` })}
        </Link>
      </p>
      <Reveal>
        <Card style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 17 }}>
            {t({ bn: 'লিখিত প্রস্তুতি — লেখা শেখার পদ্ধতি', en: 'Written preparation — learning to write' })}
          </div>
          <p style={{ margin: '8px 0 0', color: 'var(--muted-ivory)', fontSize: 14, lineHeight: 1.8 }}>
            {t({
              bn: 'এটি মডেল উত্তরের তালিকা নয় — লেখা শেখার পদ্ধতি। প্রতিটি প্রশ্নে আছে: প্রশ্নটি কী চাইছে, উত্তরের গঠন, ভূমিকা, মূল আলোচনা, তথ্য ও উদাহরণ, উপসংহার, নমুনা উত্তর, আর নিজে লিখে স্ব-যাচাই করার জায়গা। নমুনা উত্তর একটি নমুনা — একমাত্র সঠিক উত্তর নয়।',
              en: 'This is not a list of model answers — it is a method for learning to write. Each question has: what the question asks, the answer structure, introduction, main discussion, facts & examples, conclusion, a sample answer, and a place to write your own answer and self-check. The sample answer is a sample — not the only correct answer.',
            })}
          </p>
          <p style={{ margin: '8px 0 0', color: 'var(--muted-ivory)', fontSize: 14, lineHeight: 1.8 }}>
            {t({
              bn: 'AI মূল্যায়ন এখনো চালু হয়নি — স্ব-যাচাই তালিকাটিই আপাতত মূল্যায়নের উপায়।',
              en: 'AI evaluation is not on yet — the self-check list is the evaluation method for now.',
            })}
          </p>
        </Card>
      </Reveal>

      {questions.length === 0 ? (
        <Reveal>
          <Card>
            <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 17 }}>
              {t({ bn: 'লিখিত প্রশ্ন এখনো তৈরি হয়নি', en: 'No written questions yet' })}
            </div>
            <p style={{ margin: '8px 0 0', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
              {t({
                bn: 'এই পরীক্ষার লিখিত প্রশ্ন তৈরি হচ্ছে — ইংরেজি প্রশ্ন আগে আসবে (মালিক যাচাই করেন), অন্য বিষয়ের প্রশ্ন যাচাইকৃত শিক্ষক এলে তবে প্রকাশিত হবে।',
                en: 'Written questions for this exam are being prepared — English questions come first (the owner verifies them); other subjects publish only when a verified teacher reviews them.',
              })}
            </p>
          </Card>
        </Reveal>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {questions.map((q, i) => {
            const template = writtenTemplate(q.answerType);
            return (
              <Reveal key={q.questionId} delayMs={Math.min(i, 5) * 60}>
                <Card>
                  <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 16 }}>
                    {lang === 'bn' ? q.questionTextBn : q.questionTextEn ?? q.questionTextBn}
                  </div>
                  <p style={{ margin: '6px 0 10px', color: 'var(--muted)', fontSize: 14 }}>
                    {t({ bn: template.nameBn, en: template.nameEn })}
                    {q.marks !== null
                      ? t({ bn: ` · ${q.marks} নম্বর`, en: ` · ${q.marks} marks` })
                      : t({ bn: ' · নম্বর যাচাই হয়নি', en: ' · Marks not verified' })}
                  </p>
                  <p style={{ margin: '0 0 10px' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: 999,
                        background: '#FBEDE7',
                        color: '#7C2D12',
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {t({ bn: 'খসড়া — যাচাই হয়নি', en: 'Draft — not verified' })}
                    </span>
                  </p>
                  <p style={{ margin: 0 }}>
                    <LinkButton to={`/jobs/${def.slug}/written/${q.questionId}`} variant="accent">
                      {t({ bn: 'প্রশ্নটি দেখুন →', en: 'See this question →' })}
                    </LinkButton>
                  </p>
                </Card>
              </Reveal>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
