// Eduvelto — public guides (24 Nov 2026, brand-SEO wave 1, F-04).
//
// Ten explicit routes (see App.tsx) — one per guide in
// src/lib/publicGuides.ts. The guide is chosen by the `guide` prop,
// never by a raw URL slug, so no user input can become a title.
//
// Static data only (src/lib/publicGuides.ts) — zero Firestore reads,
// no login. Present tense only (28 Nov 2026 AdSense cleanup): no
// draft label on the page. (The SEO meta descriptions in lib/seo.ts
// still carry the draft wording — test-guarded honesty policy.)
// The NU guide additionally carries its prominent warning (the
// 2026–27 circular is not published yet) in an alert box.
//
// Phase 2 (25 Nov 2026): the 15 Study Guides (/guides/<slug>) carry
// a full English body (bodyEn) — rendered when lang is en — plus a
// read time and an updated date. Old /learn guides have Bn bodies
// only and keep rendering them in both languages. The breadcrumb
// hub follows the guide's own path (/guides or /learn).

import { Link } from 'react-router-dom';
import { PageShell, EmptyState } from '../components/PageShell';
import { Breadcrumb } from '../components/Breadcrumb';
import { AlertBox, LinkButton } from '../components/ui';
import { useLanguage } from '../i18n/LanguageContext';
import { publicGuideBySlug, type PublicGuide } from '../lib/publicGuides';

export default function PublicGuidePage({ guide }: { guide: string }) {
  const { lang } = useLanguage();
  const data: PublicGuide | undefined = publicGuideBySlug(guide);
  if (!data) {
    return (
      <PageShell titleBn="পাতা পাওয়া যায়নি" titleEn="Page not found">
        <EmptyState
          bn="এই ঠিকানায় কোনো গাইড নেই।"
          en="There is no guide at this address."
        />
        <LinkButton to="/learn" variant="primary">
          {lang === 'bn' ? 'সব পাঠ ও গাইড' : 'All lessons and guides'}
        </LinkButton>
      </PageShell>
    );
  }
  const isGuidesBlog = data.path.startsWith('/guides/');
  const body = lang === 'en' && data.bodyEn ? data.bodyEn : data.bodyBn;
  const warning = lang === 'en' && data.warningEn ? data.warningEn : data.warningBn;
  return (
    <PageShell titleBn={data.titleBn} titleEn={data.titleEn}>
      {/* Visible breadcrumb — labels match the BreadcrumbList JSON-LD
          in lib/seo.ts for this route. */}
      <Breadcrumb
        items={[
          { label: isGuidesBlog ? 'গাইড' : 'পাঠ', to: isGuidesBlog ? '/guides' : '/learn' },
          { label: data.crumbBn },
        ]}
      />
      {warning ? (
        <AlertBox tone="info">
          <strong>
            {lang === 'bn'
              ? 'গুরুত্বপূর্ণ সতর্কতা — আগে এটি পড়ুন:'
              : 'Important warning — read this first:'}
          </strong>
          <br />
          {warning}
        </AlertBox>
      ) : null}
      <p style={{ fontSize: 14, color: 'var(--muted-ivory)', margin: '0 0 16px' }}>
        {lang === 'bn' ? 'Eduvelto — ফ্রি শিক্ষা প্ল্যাটফর্ম' : 'Eduvelto — Free education platform'}
        {data.readTimeMinutes ? (
          <>
            {' · '}
            {lang === 'bn'
              ? `পড়ার সময়: প্রায় ${data.readTimeMinutes} মিনিট`
              : `Reading time: about ${data.readTimeMinutes} minutes`}
          </>
        ) : null}
        {data.updatedAt ? (
          <>
            {' · '}
            {lang === 'bn' ? `হালনাগাদ: ${data.updatedAt}` : `Updated: ${data.updatedAt}`}
          </>
        ) : null}
      </p>
      {body.map((p, i) => (
        <p key={i} style={{ fontSize: 16, lineHeight: 1.75 }}>
          {p}
        </p>
      ))}
      <h2 style={{ fontSize: 20, margin: '28px 0 12px' }}>
        {lang === 'bn' ? 'আরও দেখুন' : 'See also'}
      </h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {data.links.map((l, i) => (
          <LinkButton key={l.to} to={l.to} variant={i === 0 ? 'primary' : 'outline'}>
            {lang === 'bn' ? l.bn : l.en}
          </LinkButton>
        ))}
      </div>
      <p style={{ fontSize: 14, lineHeight: 1.7, marginTop: 16 }}>
        {lang === 'bn'
          ? 'লগইন করে স্কোরসহ অনুশীলন করতে চাইলে: '
          : 'To practise with scoring after login: '}
        <Link to="/jobs/bcs/practice/english">
          {lang === 'bn'
            ? 'বিসিএস ইংরেজি অনুশীলন (লগইন প্রয়োজন)'
            : 'BCS English practice (login required)'}
        </Link>
      </p>
    </PageShell>
  );
}
