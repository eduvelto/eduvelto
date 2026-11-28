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
// no login. Present tense only (28 Nov 2026 AdSense cleanup): no
// draft label on the page. (The SEO meta descriptions in lib/seo.ts
// still carry the draft wording — test-guarded honesty policy.)

import { Link } from 'react-router-dom';
import { PageShell, EmptyState } from '../components/PageShell';
import { Breadcrumb } from '../components/Breadcrumb';
import { Card, LinkButton } from '../components/ui';
import { useLanguage } from '../i18n/LanguageContext';
import {
  publicLessonBySlug,
  type PublicLesson,
} from '../lib/publicLessons';

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
          { label: lang === 'bn' ? 'বিসিএস ইংরেজি' : 'BCS English', to: '/learn' },
          {
            label:
              lesson.slug === 'tense'
                ? lang === 'bn'
                  ? 'টেন্স'
                  : 'Tense'
                : lang === 'bn'
                  ? 'প্রিপোজিশন'
                  : 'Preposition',
          },
        ]}
      />
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
