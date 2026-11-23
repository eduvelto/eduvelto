// Eduvelto — AdSense Part 1 (public content, F1 fix): BCS English
// practice pages, visible to Googlebot WITHOUT login.
//
// One component serves the hub and the 3 category pages:
//   /jobs/bcs/practice/english            (hub — all 35, grouped)
//   /jobs/bcs/practice/english/grammar
//   /jobs/bcs/practice/english/vocabulary
//   /jobs/bcs/practice/english/reading
// An unknown :category shows an honest not-found card — the raw slug
// is NEVER rendered as a title.
//
// Static data only (src/lib/publicBcsEnglish.ts) — zero Firestore
// reads, no login. Answers + explanations are shown on the page.
// Links to the login-gated practice bundles are labelled
// "(লগইন প্রয়োজন)" and point at the real published topic bundle
// doc IDs (bundles audit 22 Nov 2026, read-back 13/13).

import { Link, useParams } from 'react-router-dom';
import { PageShell, EmptyState } from '../components/PageShell';
import { Breadcrumb } from '../components/Breadcrumb';
import { AlertBox, Card, Chip, LinkButton } from '../components/ui';
import { useLanguage } from '../i18n/LanguageContext';
import {
  PUBLIC_BCS_CATEGORIES,
  PUBLIC_BCS_ENGLISH_QUESTIONS,
  PUBLIC_BCS_READING_PASSAGE,
  PUBLIC_BCS_TOPICS,
  publicBcsQuestionsFor,
  type PublicBcsCategory,
  type PublicBcsQuestion,
  type PublicBcsTopic,
} from '../lib/publicBcsEnglish';

/** The verified-batch label, shown on every practice view. */
const VERIFIED_BADGE_BN = 'যাচাইকৃত প্রশ্ন — BCS ইংরেজি ব্যাচ ১';
const VERIFIED_BADGE_EN = 'Verified questions — BCS English Batch 1';

/** The first published practice-bundle doc ID per category (login-gated). */
const PRACTICE_BUNDLE_BY_CATEGORY: Record<PublicBcsCategory, string> = {
  grammar: 'topic__bcs__english__grammar__tense',
  vocabulary: 'topic__bcs__english__vocabulary__synonym',
  reading: 'topic__bcs__english__comprehension__reading',
};

const CATEGORY_PATH: Record<PublicBcsCategory, string> = {
  grammar: '/jobs/bcs/practice/english/grammar',
  vocabulary: '/jobs/bcs/practice/english/vocabulary',
  reading: '/jobs/bcs/practice/english/reading',
};

function toBnDigits(n: number): string {
  return String(n).replace(/[0-9]/g, (d) => '০১২৩৪৫৬৭৮৯'[Number(d)]);
}

function isCategory(s: string | undefined): s is PublicBcsCategory {
  return s === 'grammar' || s === 'vocabulary' || s === 'reading';
}

function topicName(topic: PublicBcsTopic, lang: 'bn' | 'en'): string {
  const t = PUBLIC_BCS_TOPICS.find((x) => x.topic === topic);
  return lang === 'bn' ? (t?.nameBn ?? topic) : (t?.nameEn ?? topic);
}

function QuestionCard({
  q,
  num,
  lang,
}: {
  q: PublicBcsQuestion;
  num: number;
  lang: 'bn' | 'en';
}) {
  const correct = q.options.find((o) => o.letter === q.correctLetter);
  return (
    <Card key={q.id} style={{ marginBottom: 16 }}>
      <div id={`q-${q.id}`} style={{ scrollMarginTop: 16 }}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            alignItems: 'center',
            marginBottom: 8,
          }}
        >
          <strong style={{ fontSize: 15 }}>
            {lang === 'bn'
              ? `প্রশ্ন ${toBnDigits(num)}`
              : `Question ${num}`}
          </strong>
          <Chip tone="blue">{topicName(q.topic, lang)}</Chip>
        </div>
        <p style={{ fontSize: 16, lineHeight: 1.75, margin: '0 0 10px' }}>
          {q.questionText}
        </p>
        <ol
          style={{
            listStyle: 'none',
            margin: '0 0 12px',
            padding: 0,
            display: 'grid',
            gap: 6,
          }}
        >
          {q.options.map((o) => {
            const isCorrect = o.letter === q.correctLetter;
            return (
              <li
                key={o.letter}
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: isCorrect
                    ? 'var(--home-tint-green)'
                    : 'var(--card-subtle)',
                  fontWeight: isCorrect ? 700 : 400,
                }}
              >
                {o.letter}. {o.text}
                {isCorrect ? (
                  <span
                    style={{ marginLeft: 8, color: 'var(--success)' }}
                  >
                    {lang === 'bn' ? '✓ সঠিক উত্তর' : '✓ Correct answer'}
                  </span>
                ) : null}
              </li>
            );
          })}
        </ol>
        <p
          style={{
            fontSize: 15,
            lineHeight: 1.75,
            margin: 0,
            color: 'var(--ink-soft)',
          }}
        >
          <strong>
            {lang === 'bn' ? 'সঠিক উত্তর: ' : 'Correct answer: '}
            {q.correctLetter}
            {correct ? ` — ${correct.text}` : ''}
          </strong>
          <br />
          {lang === 'bn' ? 'ব্যাখ্যা: ' : 'Explanation: '}
          {q.explanation}
        </p>
      </div>
    </Card>
  );
}

function PracticeLinks({ category }: { category: PublicBcsCategory }) {
  const { lang } = useLanguage();
  const siblings = PUBLIC_BCS_CATEGORIES.filter(
    (c) => c.category !== category,
  );
  return (
    <div style={{ display: 'grid', gap: 8, marginTop: 24 }}>
      <LinkButton to="/jobs/bcs/practice/english" variant="outline">
        {lang === 'bn'
          ? '← সব ৩৫টি প্রশ্নের তালিকা'
          : '← All 35 questions'}
      </LinkButton>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {siblings.map((s) => (
          <LinkButton
            key={s.category}
            to={CATEGORY_PATH[s.category]}
            variant="outline"
          >
            {lang === 'bn' ? s.nameBn : s.nameEn}
          </LinkButton>
        ))}
        <LinkButton to="/jobs/bcs/subjects/english" variant="outline">
          {lang === 'bn' ? 'বিসিএস ইংরেজি বিষয়' : 'BCS English subject'}
        </LinkButton>
        <LinkButton to="/learn/bcs-english-tense" variant="outline">
          {lang === 'bn' ? 'Tense পাঠ' : 'Tense lesson'}
        </LinkButton>
        <LinkButton to="/learn/bcs-english-preposition" variant="outline">
          {lang === 'bn' ? 'Preposition পাঠ' : 'Preposition lesson'}
        </LinkButton>
      </div>
      <p style={{ fontSize: 14, lineHeight: 1.7, margin: '4px 0 0' }}>
        {lang === 'bn'
          ? 'লগইন করে একই বিষয়ের অনুশীলন (স্কোরসহ) করতে: '
          : 'To practise the same topic with scoring after login: '}
        <Link to={`/jobs/practice/${PRACTICE_BUNDLE_BY_CATEGORY[category]}`}>
          {lang === 'bn'
            ? 'অনুশীলন শুরু করুন (লগইন প্রয়োজন)'
            : 'Start practice (login required)'}
        </Link>
      </p>
    </div>
  );
}

function Hub() {
  const { lang } = useLanguage();
  return (
    <PageShell
      titleBn="বিসিএস ইংরেজি অনুশীলন — ব্যাচ ১"
      titleEn="BCS English Practice — Batch 1"
      wide
    >
      {/* Visible breadcrumb (24 Nov 2026 SEO pass) — labels match the
          BreadcrumbList JSON-LD in lib/seo.ts for this route.
          "অনুশীলন" has no distinct route of its own, so it is plain. */}
      <Breadcrumb
        items={[
          { label: 'চাকরি প্রস্তুতি', to: '/jobs' },
          { label: 'বিসিএস', to: '/jobs/bcs' },
          { label: 'অনুশীলন' },
          { label: 'ইংরেজি' },
        ]}
      />
      <p style={{ fontSize: 16, lineHeight: 1.75 }}>
        {lang === 'bn'
          ? 'বিসিএস প্রিলিমিনারি পরীক্ষায় ইংরেজি ভাষা ও সাহিত্য বিষয়ে ৩৫ নম্বর থাকে। এই পাতায় সেই প্রস্তুতির জন্য ৩৫টি অনুশীলন প্রশ্ন আছে — ব্যাকরণ ২০টি, শব্দভাণ্ডার ১২টি, পাঠ বোঝা ৩টি। প্রশ্নগুলো নতুন করে লেখা অনুশীলন প্রশ্ন — কোনোটাই বিগত বছরের প্রশ্ন নয়। প্রতিটি প্রশ্নের সঙ্গে সঠিক উত্তর ও ব্যাখ্যা দেওয়া আছে, তাই লগইন না করেই এখান থেকে পড়া যায়।'
          : 'In the BCS Preliminary exam, English Language & Literature carries 35 marks. This page has 35 practice questions for that preparation — 20 grammar, 12 vocabulary and 3 reading. These are newly written practice questions — none of them is a previous-year question. Every question shows its correct answer and explanation, so you can study here without logging in.'}
      </p>
      <p style={{ margin: '0 0 16px' }}>
        <Chip tone="gold">
          {lang === 'bn' ? VERIFIED_BADGE_BN : VERIFIED_BADGE_EN}
        </Chip>
      </p>

      <h2 style={{ fontSize: 20, margin: '24px 0 12px' }}>
        {lang === 'bn' ? 'বিষয় অনুযায়ী প্রশ্ন' : 'Questions by category'}
      </h2>
      {PUBLIC_BCS_CATEGORIES.map((c) => {
        const qs = publicBcsQuestionsFor(c.category);
        const topics = PUBLIC_BCS_TOPICS.filter(
          (t) => t.category === c.category,
        );
        return (
          <Card key={c.category} style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 17, margin: '0 0 6px' }}>
              <Link to={CATEGORY_PATH[c.category]}>
                {lang === 'bn' ? c.nameBn : c.nameEn}
              </Link>{' '}
              —{' '}
              {lang === 'bn'
                ? `${toBnDigits(qs.length)}টি প্রশ্ন`
                : `${qs.length} questions`}
            </h3>
            <p style={{ fontSize: 15, lineHeight: 1.75, margin: '0 0 10px' }}>
              {lang === 'bn' ? c.introBn : c.introEn}
            </p>
            <div
              style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}
            >
              {topics.map((t) => (
                <Chip key={t.topic} tone="blue">
                  {lang === 'bn' ? t.nameBn : t.nameEn} (
                  {lang === 'bn' ? toBnDigits(t.count) : t.count})
                </Chip>
              ))}
            </div>
            <ol style={{ margin: '12px 0 0', paddingLeft: 20, lineHeight: 1.9 }}>
              {qs.map((q) => {
                return (
                  <li key={q.id}>
                    <Link
                      to={`${CATEGORY_PATH[c.category]}#q-${q.id}`}
                    >
                      {q.questionText}
                    </Link>{' '}
                    <span style={{ color: 'var(--muted)' }}>
                      ({topicName(q.topic, lang)})
                    </span>
                  </li>
                );
              })}
            </ol>
          </Card>
        );
      })}

      <h2 style={{ fontSize: 20, margin: '24px 0 12px' }}>
        {lang === 'bn' ? 'আরও পড়ুন' : 'Read more'}
      </h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <LinkButton to="/learn/bcs-english-tense" variant="outline">
          {lang === 'bn' ? 'Tense পাঠ' : 'Tense lesson'}
        </LinkButton>
        <LinkButton to="/learn/bcs-english-preposition" variant="outline">
          {lang === 'bn' ? 'Preposition পাঠ' : 'Preposition lesson'}
        </LinkButton>
        <LinkButton to="/jobs/bcs/subjects/english" variant="outline">
          {lang === 'bn' ? 'বিসিএস ইংরেজি বিষয়' : 'BCS English subject'}
        </LinkButton>
      </div>
      <p style={{ fontSize: 14, lineHeight: 1.7, marginTop: 16 }}>
        {lang === 'bn'
          ? 'লগইন করে স্কোরসহ অনুশীলন করতে চাইলে: '
          : 'To practise with scoring after login: '}
        <Link to="/jobs/practice/topic__bcs__english__grammar__tense">
          {lang === 'bn'
            ? 'বিসিএস ইংরেজি অনুশীলন (লগইন প্রয়োজন)'
            : 'BCS English practice (login required)'}
        </Link>
      </p>
    </PageShell>
  );
}

function CategoryPage({ category }: { category: PublicBcsCategory }) {
  const { lang } = useLanguage();
  const meta = PUBLIC_BCS_CATEGORIES.find((c) => c.category === category)!;
  const qs = publicBcsQuestionsFor(category);
  // Visible-breadcrumb labels must match the BreadcrumbList JSON-LD
  // in lib/seo.ts ('ব্যাকরণ' / 'শব্দভাণ্ডার' / 'রিডিং'), not the
  // page's longer display names ('ব্যাকরণ (Grammar)' …).
  const crumbBn: Record<PublicBcsCategory, string> = {
    grammar: 'ব্যাকরণ',
    vocabulary: 'শব্দভাণ্ডার',
    reading: 'রিডিং',
  };
  return (
    <PageShell
      titleBn={`বিসিএস ইংরেজি — ${meta.nameBn}`}
      titleEn={`BCS English — ${meta.nameEn}`}
      wide
    >
      {/* Visible breadcrumb (24 Nov 2026 SEO pass). */}
      <Breadcrumb
        items={[
          { label: 'চাকরি প্রস্তুতি', to: '/jobs' },
          { label: 'বিসিএস', to: '/jobs/bcs' },
          { label: 'অনুশীলন' },
          { label: 'ইংরেজি', to: '/jobs/bcs/practice/english' },
          { label: crumbBn[category] },
        ]}
      />
      <p style={{ margin: '0 0 16px' }}>
        <Chip tone="gold">
          {lang === 'bn' ? VERIFIED_BADGE_BN : VERIFIED_BADGE_EN}
        </Chip>
      </p>
      <p style={{ fontSize: 16, lineHeight: 1.75 }}>
        {lang === 'bn' ? meta.introBn : meta.introEn}
      </p>
      {category === 'reading' ? (
        <Card style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 17, margin: '0 0 8px' }}>
            {lang === 'bn' ? 'অনুচ্ছেদ' : 'Passage'}
          </h2>
          <p style={{ fontSize: 16, lineHeight: 1.8, margin: 0 }}>
            {PUBLIC_BCS_READING_PASSAGE.text}
          </p>
        </Card>
      ) : null}
      <div>
        {qs.map((q) => {
          const num =
            PUBLIC_BCS_ENGLISH_QUESTIONS.findIndex((x) => x.id === q.id) +
            1;
          return <QuestionCard key={q.id} q={q} num={num} lang={lang} />;
        })}
      </div>
      <AlertBox tone="info">
        {lang === 'bn'
          ? 'এই প্রশ্নগুলো নতুন করে লেখা অনুশীলন প্রশ্ন — কোনোটাই বিগত বছরের প্রশ্ন নয়।'
          : 'These are newly written practice questions — none of them is a previous-year question.'}
      </AlertBox>
      <PracticeLinks category={category} />
    </PageShell>
  );
}

function NotFound() {
  const { lang } = useLanguage();
  return (
    <PageShell
      titleBn="পাতা পাওয়া যায়নি"
      titleEn="Page not found"
      wide
    >
      <EmptyState
        bn="এই ঠিকানায় কোনো অনুশীলন বিভাগ নেই। নিচের তালিকা থেকে সঠিক বিভাগটি বেছে নিন।"
        en="There is no practice category at this address. Choose a category from the list below."
      />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <LinkButton to="/jobs/bcs/practice/english" variant="primary">
          {lang === 'bn' ? 'সব ৩৫টি প্রশ্ন' : 'All 35 questions'}
        </LinkButton>
        {PUBLIC_BCS_CATEGORIES.map((c) => (
          <LinkButton
            key={c.category}
            to={CATEGORY_PATH[c.category]}
            variant="outline"
          >
            {lang === 'bn' ? c.nameBn : c.nameEn}
          </LinkButton>
        ))}
      </div>
    </PageShell>
  );
}

export default function PublicBcsEnglishPage() {
  const { category } = useParams<{ category?: string }>();
  if (category === undefined) return <Hub />;
  if (isCategory(category)) return <CategoryPage category={category} />;
  return <NotFound />;
}
