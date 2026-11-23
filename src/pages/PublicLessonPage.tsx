// Eduvelto — AdSense Part 1 (public content, F1 fix): sample lessons,
// visible to Googlebot WITHOUT login.
//
// Two explicit routes (see App.tsx):
//   /learn/bcs-english-tense
//   /learn/bcs-english-preposition
// The lesson is chosen by the `lesson` prop, never by a raw URL slug,
// so no user input can become a title.
//
// Static data only (src/lib/publicLessons.ts) — zero Firestore reads,
// no login. Every lesson carries the visible draft label
// "খসড়া পাঠ — শিক্ষক যাচাইয়ের অপেক্ষায়": the prose is AI-drafted
// and NOT teacher-reviewed. It is never labelled verified/approved.

import { Link } from 'react-router-dom';
import { PageShell, EmptyState } from '../components/PageShell';
import { Breadcrumb } from '../components/Breadcrumb';
import { AlertBox, Card, LinkButton } from '../components/ui';
import { useLanguage } from '../i18n/LanguageContext';
import {
  publicLessonBySlug,
  type PublicLesson,
} from '../lib/publicLessons';

const DRAFT_LABEL_BN = 'খসড়া পাঠ — শিক্ষক যাচাইয়ের অপেক্ষায়';
const DRAFT_LABEL_EN = 'Draft lesson — awaiting teacher review';

const DRAFT_NOTE_BN =
  'এই পাঠটি এআই দিয়ে খসড়া হিসেবে লেখা হয়েছে; এখনো কোনো শিক্ষক এটি যাচাই করেননি। ' +
  'এখানকার নিয়ম ও উদাহরণ অনুশীলনের জন্য ব্যবহার করুন, কিন্তু চূড়ান্ত সত্য হিসেবে ধরে নেবেন না — ' +
  'কোনো সন্দেহ থাকলে আপনার শিক্ষকের সঙ্গে মিলিয়ে নিন।';
const DRAFT_NOTE_EN =
  'This lesson is an AI-drafted draft; no teacher has reviewed it yet. ' +
  'Use its rules and examples for practice, but do not treat them as final truth — ' +
  'if in doubt, check with your teacher.';

function LessonBody({ lesson }: { lesson: PublicLesson }) {
  const { lang } = useLanguage();
  const other =
    lesson.slug === 'tense' ? 'preposition' : 'tense';
  const otherLesson = publicLessonBySlug(other)!;
  return (
    <PageShell
      titleBn={`বিসিএস ইংরেজি — ${lesson.titleBn}`}
      titleEn={`BCS English — ${lesson.titleEn}`}
    >
      {/* Visible breadcrumb (24 Nov 2026 SEO pass) — labels match the
          BreadcrumbList JSON-LD in lib/seo.ts for this route. */}
      <Breadcrumb
        items={[
          { label: 'বিসিএস ইংরেজি', to: '/learn' },
          { label: lesson.slug === 'tense' ? 'টেন্স' : 'প্রিপোজিশন' },
        ]}
      />
      <AlertBox tone="info">
        <strong>{lang === 'bn' ? DRAFT_LABEL_BN : DRAFT_LABEL_EN}</strong>
        <br />
        {lang === 'bn' ? DRAFT_NOTE_BN : DRAFT_NOTE_EN}
      </AlertBox>
      {lesson.introBn.map((p, i) => (
        <p key={i} style={{ fontSize: 16, lineHeight: 1.75 }}>
          {p}
        </p>
      ))}
      {lesson.sections.map((s) => (
        <section key={s.headingBn} style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 20, margin: '0 0 10px' }}>
            {lang === 'bn' ? s.headingBn : s.headingEn}
          </h2>
          {s.bodyBn.map((p, i) => (
            <p key={i} style={{ fontSize: 16, lineHeight: 1.75 }}>
              {p}
            </p>
          ))}
          {s.examples ? (
            <Card style={{ marginTop: 12 }}>
              <h3 style={{ fontSize: 15, margin: '0 0 8px' }}>
                {lang === 'bn' ? 'উদাহরণ' : 'Examples'}
              </h3>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: 20,
                  lineHeight: 1.9,
                  fontSize: 15,
                }}
              >
                {s.examples.map((e) => (
                  <li key={e.en}>
                    <strong>{e.en}</strong>
                    <br />
                    <span style={{ color: 'var(--ink-soft)' }}>{e.bn}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </section>
      ))}
      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 20, margin: '0 0 10px' }}>
          {lang === 'bn' ? 'মনে রাখার মতো ভুল' : 'Common mistakes'}
        </h2>
        <ul
          style={{
            margin: 0,
            paddingLeft: 20,
            lineHeight: 1.9,
            fontSize: 15,
          }}
        >
          {lesson.mistakesBn.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      </section>
      <h2 style={{ fontSize: 20, margin: '28px 0 12px' }}>
        {lang === 'bn' ? 'অনুশীলন করুন' : 'Practise'}
      </h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <LinkButton to="/jobs/bcs/practice/english/grammar" variant="primary">
          {lang === 'bn' ? 'ব্যাকরণের প্রশ্নগুলো দেখুন' : 'See the grammar questions'}
        </LinkButton>
        <LinkButton to="/jobs/bcs/practice/english" variant="outline">
          {lang === 'bn' ? 'সব ৩৫টি প্রশ্ন' : 'All 35 questions'}
        </LinkButton>
        <LinkButton to={otherLesson.path} variant="outline">
          {lang === 'bn'
            ? `${otherLesson.titleBn} পাঠ`
            : `${otherLesson.titleEn} lesson`}
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

export default function PublicLessonPage({
  lesson,
}: {
  lesson: 'tense' | 'preposition';
}) {
  const { lang } = useLanguage();
  const data = publicLessonBySlug(lesson);
  if (!data) {
    return (
      <PageShell titleBn="পাতা পাওয়া যায়নি" titleEn="Page not found">
        <EmptyState
          bn="এই ঠিকানায় কোনো পাঠ নেই।"
          en="There is no lesson at this address."
        />
        <LinkButton to="/jobs/bcs/practice/english" variant="primary">
          {lang === 'bn' ? 'সব ৩৫টি প্রশ্ন' : 'All 35 questions'}
        </LinkButton>
      </PageShell>
    );
  }
  return <LessonBody lesson={data} />;
}
