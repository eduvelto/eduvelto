// Eduvelto — Academic chapter practice (Education Hub, 26 Nov 2026).
//
// Chapter-wise practice for the Education Hub, fed by the SAME verified
// bank as the Question Maker (QPG): the static pool in
// src/lib/publicAcademic.ts (Classes 3–6, twelve subjects, 810 verified
// questions). A question verified once appears in both places
// — teachers generate papers from it in /question-maker, students
// practise it here, chapter by chapter.
//
// Routes (one component, three modes by params — like
// PublicBcsEnglishPage):
//   /learn/practice                              (hub — classes with practice)
//   /learn/practice/:classId/:subjectId          (subject — its units)
//   /learn/practice/:classId/:subjectId/:chapterId (chapter — interactive practice)
//
// Static data only — zero Firestore reads, no login (same pattern as
// the public BCS English practice). A chapter exists only when it
// holds verified questions; any other class/subject/chapter shows the
// honest "যাচাই চলছে" empty state, never filler, never NEEDS-REVIEW
// drafts, never invented questions.

import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageShell, EmptyState } from '../components/PageShell';
import { Breadcrumb } from '../components/Breadcrumb';
import { AlertBox, Card, Chip, LinkButton } from '../components/ui';
import { useLanguage } from '../i18n/LanguageContext';
import {
  PUBLIC_ACADEMIC_QUESTIONS,
  publicAcademicChaptersFor,
  publicAcademicClassSubjects,
  publicAcademicQuestionsForChapter,
  type PublicAcademicChapter,
  type PublicAcademicQuestion,
} from '../lib/publicAcademic';
import {
  QPG_GENERAL_CLASSES,
  qpgSubjectsFor,
  type QpgClassLevel,
} from '../lib/questionPaper';

function toBnDigits(n: number): string {
  return String(n).replace(/[0-9]/g, (d) => '০১২৩৪৫৬৭৮৯'[Number(d)]);
}

function classLabel(classId: string, lang: 'bn' | 'en'): string {
  const c: QpgClassLevel | undefined = QPG_GENERAL_CLASSES.find((x) => x.id === classId);
  if (c) return lang === 'bn' ? c.nameBn : c.nameEn;
  return classId;
}

function subjectLabel(classId: string, subjectId: string, lang: 'bn' | 'en'): string {
  const s = qpgSubjectsFor('general', classId).find((x) => x.id === subjectId);
  if (s) return lang === 'bn' ? s.nameBn : s.nameEn;
  return subjectId;
}

const VERIFIED_BADGE_BN = 'যাচাইকৃত অনুশীলন প্রশ্ন — NCTB পাঠভিত্তিক (বোর্ড প্রশ্ন নয়)';
const VERIFIED_BADGE_EN = 'Verified practice questions — NCTB lesson-based (not board questions)';

/** Pool-truth caveat: Class 9 was verified against the Dakhil editions
 *  and Class 11–12 against standard references + syllabus (no HSC book
 *  in the workspace). Shown on the class subject pages (landing 27 Nov 2026). */
function VerificationCaveat({ classId, lang }: { classId: string; lang: 'bn' | 'en' }) {
  if (classId === 'class-9' || classId === 'class-10') {
    return (
      <p style={{ fontSize: 14, lineHeight: 1.7, margin: '0 0 16px', color: 'var(--muted)' }}>
        {lang === 'bn'
          ? 'নবম–দশম শ্রেণির প্রশ্ন দাখিল সংস্করণের বই অনুযায়ী যাচাই করা।'
          : 'Class 9–10 questions verified against the Dakhil edition of the NCTB books.'}
      </p>
    );
  }
  if (classId === 'class-11' || classId === 'class-12') {
    return (
      <p style={{ fontSize: 14, lineHeight: 1.7, margin: '0 0 16px', color: 'var(--muted)' }}>
        {lang === 'bn'
          ? 'একাদশ–দ্বাদশ শ্রেণির প্রশ্ন মানসম্মত তথ্যসূত্র ও সিলেবাস অনুযায়ী যাচাই করা; এইচএসসি বইয়ের সঙ্গে মিলিয়ে দেখা হয়নি।'
          : 'Class 11–12 questions verified against standard references and the syllabus; not yet checked against the HSC textbooks.'}
      </p>
    );
  }
  return null;
}

function VerifiedNote({ lang }: { lang: 'bn' | 'en' }) {
  return (
    <AlertBox tone="info">
      {lang === 'bn'
        ? 'এই প্রশ্নগুলো NCTB পাঠের জন্য নতুন করে লেখা অনুশীলন প্রশ্ন — কোনোটাই বোর্ড / বিগত বছরের প্রশ্ন নয়। প্রতিটি প্রশ্ন তার পাঠের বইয়ের সাথে মিলিয়ে যাচাই করা হয়েছে।'
        : 'These are newly written practice questions for the NCTB lessons — none of them is a board / previous-year question. Every question was verified against its lesson in the book.'}
    </AlertBox>
  );
}

function PracticeHub() {
  const { lang } = useLanguage();
  const rows = publicAcademicClassSubjects();
  return (
    <PageShell titleBn="অধ্যায়ভিত্তিক অনুশীলন" titleEn="Chapter-wise Practice" wide>
      <Breadcrumb
        items={[
          { label: lang === 'bn' ? 'শিক্ষা কার্যক্রম' : 'Academic Learning', to: '/class' },
          { label: lang === 'bn' ? 'অনুশীলন' : 'Practice' },
        ]}
      />
      <p style={{ fontSize: 16, lineHeight: 1.75 }}>
        {lang === 'bn'
          ? 'প্রতিটি অধ্যায়ের (Unit) যাচাইকৃত অনুশীলন প্রশ্ন দিয়ে অনুশীলন করুন — উত্তর দিলেই সঠিক উত্তর ও ব্যাখ্যা দেখতে পাবেন। প্রশ্নগুলো NCTB বইয়ের পাঠের সাথে মিলিয়ে যাচাই করা। লগইন ছাড়াই অনুশীলন করা যায়।'
          : 'Practise with verified practice questions for every chapter (Unit) — see the correct answer and explanation as soon as you answer. Every question was verified against its NCTB book lesson. No login needed.'}
      </p>
      <p style={{ margin: '0 0 16px' }}>
        <Chip tone="gold">{lang === 'bn' ? VERIFIED_BADGE_BN : VERIFIED_BADGE_EN}</Chip>
      </p>
      <h2 style={{ fontSize: 20, margin: '24px 0 12px' }}>
        {lang === 'bn' ? 'যে শ্রেণিতে অনুশীলন আছে' : 'Classes with practice'}
      </h2>
      {rows.map((r) => (
        <Card key={`${r.classId}/${r.subjectId}`} style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 17, margin: '0 0 6px' }}>
            <Link to={`/learn/practice/${r.classId}/${r.subjectId}`}>
              {classLabel(r.classId, lang)} — {subjectLabel(r.classId, r.subjectId, lang)}
            </Link>
          </h3>
          <p style={{ fontSize: 15, lineHeight: 1.75, margin: '0 0 10px' }}>
            {lang === 'bn'
              ? `${toBnDigits(r.chapterCount)}টি অধ্যায় • ${toBnDigits(r.questionCount)}টি যাচাইকৃত অনুশীলন প্রশ্ন`
              : `${r.chapterCount} chapters • ${r.questionCount} verified practice questions`}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {publicAcademicChaptersFor(r.classId, r.subjectId).map((c) => (
              <Chip key={c.id} tone="blue">
                {c.name} ({lang === 'bn' ? toBnDigits(c.questionCount) : c.questionCount})
              </Chip>
            ))}
          </div>
        </Card>
      ))}
      <VerifiedNote lang={lang} />
      <p style={{ fontSize: 14, lineHeight: 1.7, marginTop: 16 }}>
        {lang === 'bn'
          ? 'অন্য শ্রেণি ও বিষয়ের প্রশ্ন যাচাই চলছে — যাচাই শেষ হলেই এখানে যোগ হবে। শিক্ষকরা এই একই প্রশ্ন দিয়ে প্রশ্নপত্র বানাতে পারেন: '
          : 'Questions for other classes and subjects are being verified — they will appear here once verified. Teachers can build question papers from these same questions: '}
        <Link to="/question-maker">
          {lang === 'bn' ? 'প্রশ্নপত্র তৈরি' : 'Question Maker'}
        </Link>
      </p>
    </PageShell>
  );
}

function SubjectPage({ classId, subjectId }: { classId: string; subjectId: string }) {
  const { lang } = useLanguage();
  const chapters = publicAcademicChaptersFor(classId, subjectId);
  const title = `${classLabel(classId, lang)} — ${subjectLabel(classId, subjectId, lang)}`;
  if (chapters.length === 0) {
    return (
      <PageShell titleBn={title} titleEn={title} wide>
        <Breadcrumb
          items={[
            { label: lang === 'bn' ? 'শিক্ষা কার্যক্রম' : 'Academic Learning', to: '/class' },
            { label: lang === 'bn' ? 'অনুশীলন' : 'Practice', to: '/learn/practice' },
            { label: title },
          ]}
        />
        <EmptyState
          bn="এই শ্রেণি / বিষয়ের যাচাইকৃত প্রশ্ন এখনো তৈরি হয়নি — যাচাই চলছে। যাচাই শেষ হলেই এখানে অধ্যায়ভিত্তিক অনুশীলন আসবে।"
          en="Verified questions for this class / subject are not ready yet — verification is in progress. Chapter-wise practice will appear here once verified."
        />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
          <LinkButton to="/learn/practice" variant="primary">
            {lang === 'bn' ? '← অনুশীলনের তালিকা' : '← Practice list'}
          </LinkButton>
        </div>
      </PageShell>
    );
  }
  const total = chapters.reduce((a, c) => a + c.questionCount, 0);
  return (
    <PageShell titleBn={`${title} — অনুশীলন`} titleEn={`${title} — Practice`} wide>
      <Breadcrumb
        items={[
          { label: lang === 'bn' ? 'শিক্ষা কার্যক্রম' : 'Academic Learning', to: '/class' },
          { label: lang === 'bn' ? 'অনুশীলন' : 'Practice', to: '/learn/practice' },
          { label: title },
        ]}
      />
      <p style={{ fontSize: 16, lineHeight: 1.75 }}>
        {lang === 'bn'
          ? `${classLabel(classId, 'bn')} ${subjectLabel(classId, subjectId, 'bn')} — ${toBnDigits(chapters.length)}টি অধ্যায়ে মোট ${toBnDigits(total)}টি যাচাইকৃত অনুশীলন প্রশ্ন। অধ্যায় বেছে নিন, উত্তর দিন, সাথে সাথে সঠিক উত্তর ও ব্যাখ্যা দেখুন।`
          : `${classLabel(classId, 'en')} ${subjectLabel(classId, subjectId, 'en')} — ${total} verified practice questions across ${chapters.length} chapters. Pick a chapter, answer, and see the correct answer and explanation right away.`}
      </p>
      <p style={{ margin: '0 0 16px' }}>
        <Chip tone="gold">{lang === 'bn' ? VERIFIED_BADGE_BN : VERIFIED_BADGE_EN}</Chip>
      </p>
      <VerificationCaveat classId={classId} lang={lang} />
      <div style={{ display: 'grid', gap: 12 }}>
        {chapters.map((c: PublicAcademicChapter) => (
          <Card key={c.id}>
            <h3 style={{ fontSize: 17, margin: '0 0 6px' }}>
              <Link to={`/learn/practice/${classId}/${subjectId}/${c.id}`}>{c.name}</Link>
            </h3>
            <p style={{ fontSize: 15, lineHeight: 1.75, margin: '0 0 10px' }}>
              {lang === 'bn'
                ? `${toBnDigits(c.questionCount)}টি প্রশ্ন`
                : `${c.questionCount} questions`}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {c.topics.map((t) => (
                <Chip key={t.id} tone="blue">
                  {t.id} ({lang === 'bn' ? toBnDigits(t.count) : t.count})
                </Chip>
              ))}
            </div>
          </Card>
        ))}
      </div>
      <div style={{ marginTop: 24 }}>
        <VerifiedNote lang={lang} />
      </div>
    </PageShell>
  );
}

function QuestionCard({
  q,
  num,
  chosen,
  onChoose,
  lang,
}: {
  q: PublicAcademicQuestion;
  num: number;
  chosen: 'A' | 'B' | 'C' | 'D' | undefined;
  onChoose: (letter: 'A' | 'B' | 'C' | 'D') => void;
  lang: 'bn' | 'en';
}) {
  const answered = chosen !== undefined;
  return (
    <Card key={q.id} style={{ marginBottom: 16 }}>
      <div id={`q-${q.id}`} style={{ scrollMarginTop: 16 }}>
        <div
          style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 8 }}
        >
          <strong style={{ fontSize: 15 }}>
            {lang === 'bn' ? `প্রশ্ন ${toBnDigits(num)}` : `Question ${num}`}
          </strong>
          <Chip tone="blue">{q.topicId}</Chip>
          <Chip tone={q.difficulty === 'easy' ? 'outline' : 'gold'}>
            {lang === 'bn'
              ? q.difficulty === 'easy'
                ? 'সহজ'
                : q.difficulty === 'medium'
                  ? 'মাঝারি'
                  : 'কঠিন'
              : q.difficulty}
          </Chip>
        </div>
        <p style={{ fontSize: 16, lineHeight: 1.75, margin: '0 0 10px' }}>{q.questionText}</p>
        <div style={{ display: 'grid', gap: 6, marginBottom: 12 }}>
          {q.options.map((o) => {
            const isCorrect = o.letter === q.correctLetter;
            const isChosen = o.letter === chosen;
            const bg = answered
              ? isCorrect
                ? 'var(--home-tint-green)'
                : isChosen
                  ? 'var(--home-tint-red, #fde8e8)'
                  : 'var(--card-subtle)'
              : 'var(--card-subtle)';
            return (
              <button
                key={o.letter}
                type="button"
                disabled={answered}
                onClick={() => onChoose(o.letter)}
                aria-pressed={isChosen}
                style={{
                  textAlign: 'left',
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--hatch-widget-border, #ddd)',
                  background: bg,
                  fontWeight: isCorrect && answered ? 700 : 400,
                  cursor: answered ? 'default' : 'pointer',
                  fontSize: 15,
                  lineHeight: 1.6,
                  color: 'inherit',
                }}
              >
                {o.letter}. {o.text}
                {answered && isCorrect ? (
                  <span style={{ marginLeft: 8, color: 'var(--success)' }}>
                    {lang === 'bn' ? '✓ সঠিক উত্তর' : '✓ Correct answer'}
                  </span>
                ) : null}
                {answered && isChosen && !isCorrect ? (
                  <span style={{ marginLeft: 8, color: 'var(--error, #c00)' }}>
                    {lang === 'bn' ? '✗ আপনার উত্তর' : '✗ Your answer'}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
        {answered ? (
          <p style={{ fontSize: 15, lineHeight: 1.75, margin: 0, color: 'var(--ink-soft)' }}>
            <strong>
              {lang === 'bn' ? 'সঠিক উত্তর: ' : 'Correct answer: '}
              {q.correctLetter} — {q.options.find((o) => o.letter === q.correctLetter)?.text ?? ''}
            </strong>
            <br />
            {lang === 'bn' ? 'ব্যাখ্যা: ' : 'Explanation: '}
            {q.explanation}
          </p>
        ) : (
          <p style={{ fontSize: 14, lineHeight: 1.7, margin: 0, color: 'var(--muted)' }}>
            {lang === 'bn'
              ? 'উত্তর দিতে একটি বিকল্পে ক্লিক করুন — সাথে সাথে সঠিক উত্তর ও ব্যাখ্যা দেখতে পাবেন।'
              : 'Click an option to answer — you will see the correct answer and explanation right away.'}
          </p>
        )}
      </div>
    </Card>
  );
}

function ChapterPractice({
  classId,
  subjectId,
  chapterId,
}: {
  classId: string;
  subjectId: string;
  chapterId: string;
}) {
  const { lang } = useLanguage();
  const [answers, setAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({});
  const questions = useMemo(
    () => publicAcademicQuestionsForChapter(chapterId),
    [chapterId],
  );
  const chapter = useMemo(
    () =>
      publicAcademicChaptersFor(classId, subjectId).find((c) => c.id === chapterId),
    [classId, subjectId, chapterId],
  );
  const answeredCount = questions.filter((q) => answers[q.id] !== undefined).length;
  const correctCount = questions.filter((q) => answers[q.id] === q.correctLetter).length;
  const allAnswered = questions.length > 0 && answeredCount === questions.length;
  const chapters = publicAcademicChaptersFor(classId, subjectId);
  const idx = chapters.findIndex((c) => c.id === chapterId);
  const next = idx >= 0 && idx + 1 < chapters.length ? chapters[idx + 1] : undefined;
  const prev = idx > 0 ? chapters[idx - 1] : undefined;

  if (!chapter || questions.length === 0) {
    return (
      <PageShell titleBn="অধ্যায়ের অনুশীলন" titleEn="Chapter Practice" wide>
        <Breadcrumb
          items={[
            { label: lang === 'bn' ? 'শিক্ষা কার্যক্রম' : 'Academic Learning', to: '/class' },
            { label: lang === 'bn' ? 'অনুশীলন' : 'Practice', to: '/learn/practice' },
            {
              label: `${classLabel(classId, lang)} — ${subjectLabel(classId, subjectId, lang)}`,
              to: `/learn/practice/${classId}/${subjectId}`,
            },
          ]}
        />
        <EmptyState
          bn="এই অধ্যায়ের যাচাইকৃত প্রশ্ন এখনো তৈরি হয়নি — যাচাই চলছে। যাচাই শেষ হলেই এখানে অনুশীলন আসবে।"
          en="Verified questions for this chapter are not ready yet — verification is in progress. Practice will appear here once verified."
        />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
          <LinkButton to={`/learn/practice/${classId}/${subjectId}`} variant="primary">
            {lang === 'bn' ? '← অধ্যায়ের তালিকা' : '← Chapter list'}
          </LinkButton>
        </div>
      </PageShell>
    );
  }

  const pct = Math.round((answeredCount / questions.length) * 100);
  return (
    <PageShell titleBn={`${chapter.name} — অনুশীলন`} titleEn={`${chapter.name} — Practice`} wide>
      <Breadcrumb
        items={[
          { label: lang === 'bn' ? 'শিক্ষা কার্যক্রম' : 'Academic Learning', to: '/class' },
          { label: lang === 'bn' ? 'অনুশীলন' : 'Practice', to: '/learn/practice' },
          {
            label: `${classLabel(classId, lang)} — ${subjectLabel(classId, subjectId, lang)}`,
            to: `/learn/practice/${classId}/${subjectId}`,
          },
          { label: chapter.name },
        ]}
      />
      <p style={{ margin: '0 0 16px' }}>
        <Chip tone="gold">{lang === 'bn' ? VERIFIED_BADGE_BN : VERIFIED_BADGE_EN}</Chip>
      </p>

      {/* Progress — answered / total + score, live as the student answers. */}
      <Card style={{ marginBottom: 20 }}>
        <div
          style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'baseline', justifyContent: 'space-between' }}
        >
          <strong style={{ fontSize: 16 }}>
            {lang === 'bn'
              ? `অগ্রগতি: ${toBnDigits(answeredCount)}/${toBnDigits(questions.length)}টি উত্তর দিয়েছেন`
              : `Progress: ${answeredCount}/${questions.length} answered`}
          </strong>
          <span style={{ fontSize: 16 }}>
            {lang === 'bn'
              ? `সঠিক: ${toBnDigits(correctCount)}টি`
              : `Correct: ${correctCount}`}
          </span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={lang === 'bn' ? 'অগ্রগতি' : 'Progress'}
          style={{
            height: 10,
            borderRadius: 5,
            background: 'var(--card-subtle)',
            marginTop: 10,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${pct}%`,
              height: '100%',
              borderRadius: 5,
              background: 'var(--success, #2e7d32)',
              transition: 'width 0.2s ease',
            }}
          />
        </div>
        {allAnswered ? (
          <p style={{ fontSize: 16, lineHeight: 1.75, margin: '12px 0 0' }}>
            <strong>
              {lang === 'bn'
                ? `আপনার স্কোর: ${toBnDigits(correctCount)}/${toBnDigits(questions.length)}`
                : `Your score: ${correctCount}/${questions.length}`}
            </strong>{' '}
            {lang === 'bn'
              ? '— ভুল উত্তরগুলোর ব্যাখ্যা উপরে দেখে নিন।'
              : '— review the explanations above for the ones you missed.'}
          </p>
        ) : null}
        {answeredCount > 0 ? (
          <div style={{ marginTop: 12 }}>
            <button
              type="button"
              onClick={() => setAnswers({})}
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                border: '1px solid var(--hatch-widget-border, #ddd)',
                background: 'var(--card-subtle)',
                cursor: 'pointer',
                fontSize: 14,
                color: 'inherit',
              }}
            >
              {lang === 'bn' ? 'আবার চেষ্টা করুন' : 'Try again'}
            </button>
          </div>
        ) : null}
      </Card>

      <div>
        {questions.map((q, i) => (
          <QuestionCard
            key={q.id}
            q={q}
            num={i + 1}
            chosen={answers[q.id]}
            onChoose={(letter) => setAnswers((prev) => ({ ...prev, [q.id]: letter }))}
            lang={lang}
          />
        ))}
      </div>

      <VerifiedNote lang={lang} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 24 }}>
        {prev ? (
          <LinkButton to={`/learn/practice/${classId}/${subjectId}/${prev.id}`} variant="outline">
            {lang === 'bn' ? `← আগের অধ্যায়: ${prev.name}` : `← Previous chapter: ${prev.name}`}
          </LinkButton>
        ) : null}
        {next ? (
          <LinkButton to={`/learn/practice/${classId}/${subjectId}/${next.id}`} variant="primary">
            {lang === 'bn' ? `পরের অধ্যায়: ${next.name} →` : `Next chapter: ${next.name} →`}
          </LinkButton>
        ) : null}
        <LinkButton to={`/learn/practice/${classId}/${subjectId}`} variant="outline">
          {lang === 'bn' ? '← অধ্যায়ের তালিকা' : '← Chapter list'}
        </LinkButton>
      </div>
    </PageShell>
  );
}

export default function AcademicPracticePage() {
  const { classId, subjectId, chapterId } = useParams<{
    classId?: string;
    subjectId?: string;
    chapterId?: string;
  }>();
  if (classId && subjectId && chapterId) {
    return <ChapterPractice classId={classId} subjectId={subjectId} chapterId={chapterId} />;
  }
  if (classId && subjectId) {
    return <SubjectPage classId={classId} subjectId={subjectId} />;
  }
  return <PracticeHub />;
}

// Re-exported for tests / future callers: total verified Academic
// questions in the pool (810 today — grows as batches are verified).
export const ACADEMIC_PRACTICE_TOTAL = PUBLIC_ACADEMIC_QUESTIONS.length;
