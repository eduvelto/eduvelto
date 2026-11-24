// Eduvelto — written question page (design §2.3, §2.6, §2.9).
//
// /jobs/:exam/written/:questionId — the 8 teaching elements in
// order, then the submission box (word/line counter against the
// length guidance — guidance, never a pass/fail gate), the
// self-check checklist, and the model answer (reference, shown
// after the student has a chance to attempt — behind a reveal
// toggle, never as the text to copy).
//
// Login: reading the teaching elements is public; writing +
// submitting needs sign-in (LoginWall kind="exam"). Submissions in
// this build are LOCAL ONLY: the page states plainly that
// server-side saving is not yet on and the answer is saved on this
// device only. AI feedback is Phase 2 — the page shows the honest
// "not on yet" line, never a fake AI card.

import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { Card, LinkButton, Reveal } from '../components/ui';
import LoginWall from '../components/LoginWall';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../lib/auth';
import { jobExamBySlug } from '../lib/jobExams';
import {
  MODEL_ANSWER_COPY_WARNING,
  MODEL_ANSWER_LABEL,
  countWords,
  lengthGuidanceForMarks,
  lengthStatusFor,
  selfCheckChecklist,
  writtenTemplate,
} from '../lib/jobWritten';
import { writtenQuestionById } from '../lib/jobWrittenContent';
import {
  clearLocalDraft,
  listLocalSubmissions,
  loadLocalDraft,
  saveLocalDraft,
  saveLocalSubmission,
  type LocalWrittenSubmission,
} from '../lib/jobWrittenData';

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 16, marginBottom: 6 }}>{children}</div>
  );
}

export default function JobWrittenQuestionPage() {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const { exam = '', questionId = '' } = useParams<{ exam: string; questionId: string }>();
  const def = jobExamBySlug(exam);
  const question = writtenQuestionById(questionId);
  const template = question ? writtenTemplate(question.answerType) : null;
  const checklist = useMemo(
    () => (question ? selfCheckChecklist(question.answerType) : []),
    [question],
  );

  const [draft, setDraft] = useState('');
  const [selfCheck, setSelfCheck] = useState<Record<string, Record<string, boolean>>>({});
  const [showModel, setShowModel] = useState(false);
  const [submitted, setSubmitted] = useState<LocalWrittenSubmission | null>(null);
  const [submissions, setSubmissions] = useState<LocalWrittenSubmission[]>([]);

  useEffect(() => {
    const d = loadLocalDraft(questionId);
    if (d) {
      setDraft(d.text);
      setSelfCheck(d.selfCheck ?? {});
    }
    setSubmissions(listLocalSubmissions(questionId));
  }, [questionId]);

  if (!def || !question || !template) {
    return (
      <PageShell titleBn="প্রশ্ন পাওয়া যায়নি" titleEn="Question not found" wide>
        <p style={{ marginTop: 16 }}>
          <Link to="/jobs" style={{ fontWeight: 600 }}>
            {t({ bn: '← সব পরীক্ষা দেখুন', en: '← See all exams' })}
          </Link>
        </p>
      </PageShell>
    );
  }

  const s = question.structure;
  const wordCount = countWords(draft);
  const guidance = question.marks !== null ? lengthGuidanceForMarks(question.marks) : null;
  const lengthStatus = question.marks !== null ? lengthStatusFor(question.marks, wordCount) : 'no-guidance';
  const isMath = question.answerType === 'math-solution';

  const onDraftChange = (value: string) => {
    setDraft(value);
    saveLocalDraft({ questionId, text: value, wordCount: countWords(value), savedAt: new Date().toISOString(), selfCheck });
  };

  const toggleCheck = (dim: string, qi: number, value: boolean) => {
    setSelfCheck((prev) => {
      const next = { ...prev, [dim]: { ...(prev[dim] ?? {}), [String(qi)]: value } };
      saveLocalDraft({ questionId, text: draft, wordCount: countWords(draft), savedAt: new Date().toISOString(), selfCheck: next });
      return next;
    });
  };

  const submit = () => {
    if (draft.trim() === '') return;
    const sub = saveLocalSubmission({ questionId, text: draft, selfCheck });
    setSubmitted(sub);
    setSubmissions(listLocalSubmissions(questionId));
    clearLocalDraft(questionId);
  };

  const factLine = (text: string, source: string | null) =>
    source === null
      ? `${text} — ${t({ bn: 'যাচাই হয়নি', en: 'Not verified' })}`
      : `${text} — ${t({ bn: `উৎস: ${source}`, en: `Source: ${source}` })}`;

  return (
    <PageShell titleBn={question.questionTextBn} titleEn={question.questionTextEn ?? question.questionTextBn} wide maxWidth={1240}>
      <p style={{ margin: '0 0 12px' }}>
        <Link to={`/jobs/${def.slug}/written`} style={{ fontWeight: 600 }}>
          {t({ bn: `← ${def.bn} — লিখিত প্রস্তুতি`, en: `← ${def.en} — Written Preparation` })}
        </Link>
      </p>

      <Reveal>
        <Card style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 18 }}>
            {lang === 'bn' ? question.questionTextBn : question.questionTextEn ?? question.questionTextBn}
          </div>
          <p style={{ margin: '6px 0 0', color: 'var(--muted)', fontSize: 14 }}>
            {t({ bn: template.nameBn, en: template.nameEn })}
            {question.marks !== null
              ? t({ bn: ` · ${question.marks} নম্বর`, en: ` · ${question.marks} marks` })
              : t({ bn: ' · নম্বর যাচাই হয়নি', en: ' · Marks not verified' })}
            {' · '}
            {t({ bn: question.instructionsBn, en: question.instructionsEn ?? question.instructionsBn })}
          </p>
          <p style={{ margin: '10px 0 0' }}>
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
        </Card>
      </Reveal>

      {/* 1. What the question is asking */}
      <Reveal>
        <Card style={{ marginBottom: 16 }}>
          <SectionTitle>{t({ bn: '১. প্রশ্নটি কী চাইছে', en: '1. What the question is asking' })}</SectionTitle>
          <p style={{ margin: 0, color: 'var(--muted-ivory)', fontSize: 14, lineHeight: 1.8 }}>
            {t({ bn: s.questionAnalysisBn, en: s.questionAnalysisEn })}
          </p>
        </Card>
      </Reveal>

      {/* 2. Answer structure */}
      <Reveal>
        <Card style={{ marginBottom: 16 }}>
          <SectionTitle>{t({ bn: '২. উত্তরের গঠন', en: '2. Answer structure' })}</SectionTitle>
          <ol style={{ margin: 0, paddingLeft: 20, color: 'var(--muted-ivory)', fontSize: 14, lineHeight: 1.9 }}>
            {(lang === 'bn' ? s.structureBn : s.structureEn).map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </Card>
      </Reveal>

      {/* 3. Introduction */}
      <Reveal>
        <Card style={{ marginBottom: 16 }}>
          <SectionTitle>{t({ bn: '৩. ভূমিকা', en: '3. Introduction' })}</SectionTitle>
          <p style={{ margin: 0, color: 'var(--muted-ivory)', fontSize: 14, lineHeight: 1.8 }}>
            {t({ bn: s.introductionBn, en: s.introductionEn })}
          </p>
        </Card>
      </Reveal>

      {/* 4. Main discussion */}
      <Reveal>
        <Card style={{ marginBottom: 16 }}>
          <SectionTitle>
            {t({
              bn: isMath ? '৪. মূল ধাপগুলো' : '৪. মূল আলোচনা',
              en: isMath ? '4. Main steps' : '4. Main discussion',
            })}
          </SectionTitle>
          <ol style={{ margin: 0, paddingLeft: 20, color: 'var(--muted-ivory)', fontSize: 14, lineHeight: 1.9 }}>
            {(lang === 'bn' ? s.mainPointsBn : s.mainPointsEn).map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ol>
        </Card>
      </Reveal>

      {/* 5. Facts & examples */}
      <Reveal>
        <Card style={{ marginBottom: 16 }}>
          <SectionTitle>{t({ bn: '৫. তথ্য ও উদাহরণ', en: '5. Facts & examples' })}</SectionTitle>
          <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--muted-ivory)', fontSize: 14, lineHeight: 1.9 }}>
            {(lang === 'bn' ? s.factsBn : s.factsEn).map((f, i) => (
              <li key={i}>{factLine(f.text, f.source)}</li>
            ))}
          </ul>
        </Card>
      </Reveal>

      {/* 6. Conclusion */}
      <Reveal>
        <Card style={{ marginBottom: 16 }}>
          <SectionTitle>{t({ bn: '৬. উপসংহার', en: '6. Conclusion' })}</SectionTitle>
          <p style={{ margin: 0, color: 'var(--muted-ivory)', fontSize: 14, lineHeight: 1.8 }}>
            {t({ bn: s.conclusionBn, en: s.conclusionEn })}
          </p>
        </Card>
      </Reveal>

      {/* 8. Write your own answer (before the model answer) */}
      <Reveal>
        <Card style={{ marginBottom: 16 }}>
          <SectionTitle>{t({ bn: '৮. নিজে লিখুন', en: '8. Write your own answer' })}</SectionTitle>
          {!user ? (
            <LoginWall kind="exam" />
          ) : (
            <>
              <textarea
                value={draft}
                onChange={(e) => onDraftChange(e.target.value)}
                rows={8}
                placeholder={t({ bn: 'এখানে নিজের ভাষায় লিখুন…', en: 'Write here in your own words…' })}
                style={{ width: '100%', padding: 10, borderRadius: 8, fontSize: 15, lineHeight: 1.8 }}
                aria-label={t({ bn: 'উত্তর লেখার জায়গা', en: 'Answer writing area' })}
              />
              <p style={{ margin: '8px 0 0', color: 'var(--muted)', fontSize: 13, lineHeight: 1.7 }}>
                {t({ bn: `শব্দ সংখ্যা: ${wordCount}`, en: `Word count: ${wordCount}` })}
                {guidance && guidance.wordsMin !== null && guidance.wordsMax !== null
                  ? t({
                      bn: ` · নির্দেশনা: ${guidance.banglaBn} — এটি শুধু নির্দেশনা, পাস/ফেলের মাপকাঠি নয়।`,
                      en: ` · Guidance: ${guidance.banglaEn} — guidance only, never a pass/fail gate.`,
                    })
                  : null}
                {lengthStatus === 'below'
                  ? t({ bn: ' · নির্দেশনার চেয়ে ছোট — সমস্যা নেই, প্রয়োজনে আরও লিখুন।', en: ' · Shorter than the guidance — no problem; add more if needed.' })
                  : null}
                {lengthStatus === 'above'
                  ? t({ bn: ' · নির্দেশনার চেয়ে বড় — সমস্যা নেই, অপ্রয়োজনীয় অংশ কাটা যায় কি না দেখুন।', en: ' · Longer than the guidance — no problem; check whether any part can be cut.' })
                  : null}
                {isMath ? t({ bn: ' · গণিতের উত্তর ধাপে মাপা হয়, শব্দে নয়।', en: ' · A math answer is measured in steps, not words.' }) : null}
              </p>
              <p style={{ margin: '8px 0 0', color: 'var(--muted)', fontSize: 13 }}>
                {t({
                  bn: 'খসড়া এই ডিভাইসে সংরক্ষিত হয় — সার্ভারে সংরক্ষণ এখনো চালু হয়নি।',
                  en: 'Your draft is saved on this device — server-side saving is not on yet.',
                })}
              </p>
              <p style={{ margin: '12px 0 0' }}>
                <button
                  type="button"
                  onClick={submit}
                  disabled={draft.trim() === ''}
                  style={{ padding: '10px 18px', borderRadius: 6, cursor: draft.trim() === '' ? 'not-allowed' : 'pointer' }}
                >
                  {t({ bn: 'জমা দিন (এই ডিভাইসে)', en: 'Submit (on this device)' })}
                </button>
              </p>
              {submitted ? (
                <p style={{ margin: '12px 0 0', color: 'var(--muted)', fontSize: 14 }}>
                  {t({
                    bn: `জমা হয়েছে — সংস্করণ ${submitted.version}। এটি এই ডিভাইসে সংরক্ষিত আছে; সার্ভারে সংরক্ষণ চালু হলে তখন জমা দেওয়া যাবে।`,
                    en: `Submitted — version ${submitted.version}. It is saved on this device; server-side submission comes when that is switched on.`,
                  })}
                </p>
              ) : null}
              {submissions.length > 0 ? (
                <p style={{ margin: '8px 0 0', color: 'var(--muted)', fontSize: 13 }}>
                  {t({
                    bn: `আগের জমা: ${submissions.length}টি সংস্করণ (এই ডিভাইসে)।`,
                    en: `Earlier submissions: ${submissions.length} version(s) (on this device).`,
                  })}
                </p>
              ) : null}

              {/* Self-check checklist */}
              <div style={{ marginTop: 16 }}>
                <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 15, marginBottom: 8 }}>
                  {t({ bn: 'স্ব-যাচাই তালিকা', en: 'Self-check list' })}
                </div>
                <p style={{ margin: '0 0 10px', color: 'var(--muted)', fontSize: 13 }}>
                  {t({
                    bn: 'এটি আপনার নিজের বিচার — কোনো নম্বর নয়। এই তালিকাই পরে শিক্ষক/AI মূল্যায়নে ব্যবহৃত হয়।',
                    en: 'This is your own judgement — not a score. This same list is what the teacher/AI evaluation later uses.',
                  })}
                </p>
                {checklist.map((item) => (
                  <div key={item.dimension} style={{ marginBottom: 10 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>
                      {lang === 'bn' ? item.dimensionBn : item.dimensionEn}
                    </div>
                    {(lang === 'bn' ? item.questionsBn : item.questionsEn).map((q, qi) => (
                      <label key={qi} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 14, marginTop: 4, cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={selfCheck[item.dimension]?.[String(qi)] ?? false}
                          onChange={(e) => toggleCheck(item.dimension, qi, e.target.checked)}
                          style={{ marginTop: 3 }}
                        />
                        <span>{q}</span>
                      </label>
                    ))}
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </Reveal>

      {/* 7. Model answer — behind a reveal, never the text to copy */}
      <Reveal>
        <Card style={{ marginBottom: 16 }}>
          <SectionTitle>{t({ bn: '৭. নমুনা উত্তর (শুধু নমুনা)', en: '7. Model answer (sample only)' })}</SectionTitle>
          <p style={{ margin: '0 0 10px', color: 'var(--muted)', fontSize: 13, lineHeight: 1.7 }}>
            {t({ bn: MODEL_ANSWER_LABEL.bn, en: MODEL_ANSWER_LABEL.en })}
          </p>
          <p style={{ margin: '0 0 10px', color: 'var(--muted)', fontSize: 13 }}>
            {t({ bn: MODEL_ANSWER_COPY_WARNING.bn, en: MODEL_ANSWER_COPY_WARNING.en })}
          </p>
          {!showModel ? (
            <p style={{ margin: 0 }}>
              <button type="button" onClick={() => setShowModel(true)} style={{ padding: '8px 14px', borderRadius: 6, cursor: 'pointer' }}>
                {t({ bn: 'নমুনা উত্তর দেখুন', en: 'Show the model answer' })}
              </button>
            </p>
          ) : (
            <div style={{ whiteSpace: 'pre-wrap', color: 'var(--muted-ivory)', fontSize: 14, lineHeight: 1.9 }}>
              {lang === 'bn' ? s.modelAnswerBn : s.modelAnswerEn ?? s.modelAnswerBn}
            </div>
          )}
        </Card>
      </Reveal>

      {/* Common mistakes + marking guidelines */}
      <Reveal>
        <Card style={{ marginBottom: 16 }}>
          <SectionTitle>{t({ bn: 'সাধারণ ভুল', en: 'Common mistakes' })}</SectionTitle>
          <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--muted-ivory)', fontSize: 14, lineHeight: 1.9 }}>
            {question.commonMistakes.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
          <p style={{ margin: '12px 0 0', color: 'var(--muted)', fontSize: 13, lineHeight: 1.7 }}>
            {t({ bn: `মূল্যায়নের নির্দেশনা: ${question.markingGuidelines}`, en: `Marking guidelines: ${question.markingGuidelines}` })}
          </p>
          <p style={{ margin: '8px 0 0', color: 'var(--muted)', fontSize: 13 }}>
            {t({
              bn: 'AI মূল্যায়ন এখনো চালু হয়নি। শিক্ষকের মূল্যায়ন চাইলে প্রশাসকের কাছে অনুরোধ করুন।',
              en: 'AI evaluation is not on yet. For teacher review, please request it from the admin.',
            })}
          </p>
          <p style={{ margin: '12px 0 0' }}>
            <LinkButton to={`/jobs/${def.slug}/written`} variant="accent">
              {t({ bn: '← সব লিখিত প্রশ্ন', en: '← All written questions' })}
            </LinkButton>
          </p>
        </Card>
      </Reveal>
    </PageShell>
  );
}
