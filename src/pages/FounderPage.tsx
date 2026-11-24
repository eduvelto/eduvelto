// Eduvelto — Founder profile page (21 Nov 2026, identity/founder-profile).
//
// Dedicated personal profile for Ali Hasan Mohammed Mizan, Founder &
// CEO of Eduvelto. STAGING ONLY — publication requires the owner's
// approval of the full preview (preview-final-report.md).
// Owner decisions 21 Nov 07:24 applied here:
// - Date of birth (21 February 2005) APPROVED for publication as a
//   factual detail, in the facts box and in the Person JSON-LD.
//   No age is stated anywhere (age changes over time).
// - Birthplace NOT approved: removed from the facts box and from the
//   Person JSON-LD (no birthPlace field) until separately approved.
//   ROUND 2 (owner 21 Nov 07:50): the phrase "From Cox's Bazar" is ALSO
//   removed from the biography prose itself (EN + BN) — the owner
//   ordered a revised preview. "Cox's Bazar City College" stays: it is
//   the college's name, a verified fact, not the birthplace phrase.
// - AI Teacher is PLANNED and demo-only: ROUND 2 (owner 21 Nov 07:50)
//   the biography now presents it as a FUTURE PLAN in both languages,
//   matching the showcase's "Planned — demo only, not live AI" label.
// - Contact: official business email ahmmizan23@gmail.com is shown.
//   Personal phone number is NOT shown. The Contact page is unchanged.
// - LinkedIn: no account exists; LinkedIn appears nowhere here.
// - Team section: OMITTED — no verified team members with approved
//   public identification exist; none are invented.
// - Features are grouped AVAILABLE NOW / IN DEVELOPMENT / PLANNED —
//   nothing unfinished is advertised as operational.
// - Biography: the text the owner approved 20 Nov 2026 (21:08), with
//   the private-tuition clause omitted per his public-details rule
//   (20 Nov 22:54). Madrasa teaching stays.
// - Only the approved founder photo is used (/founder-photo.jpg).
// - No awards, honours, follower counts or other claims are made:
//   the page states plainly that none are claimed.

import { Link } from 'react-router-dom';
import { useSeo } from '../lib/seo';
import { useLanguage } from '../i18n/LanguageContext';

const DARK_NAVY = '#041742';
const GOLD = '#F5A623';
const STAR_GOLD = '#F1B308';

const CANONICAL = 'https://eduvelto.com/founder';

export const PERSON_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  '@id': 'https://eduvelto.com/founder#person',
  name: 'Ali Hasan Mohammed Mizan',
  alternateName: ['আলী হাসান মোহাম্মদ মিজান', 'AHM Mizan'],
  description:
    'Founder and CEO of Eduvelto, a free digital education platform from Bangladesh. English teacher at Tahsinul Ummah International Madrasa since 2023. Honours 3rd year English, National University.',
  birthDate: '2005-02-21',
  image: 'https://eduvelto.com/founder-photo.jpg',
  jobTitle: 'Founder & CEO, Eduvelto',
  worksFor: { '@type': 'Organization', name: 'Eduvelto', url: 'https://eduvelto.com' },
  alumniOf: [
    { '@type': 'EducationalOrganization', name: 'National University, Bangladesh' },
    { '@type': 'EducationalOrganization', name: "Cox's Bazar City College" },
  ],
  knowsLanguage: ['bn', 'en'],
  homeLocation: {
    '@type': 'Place',
    address: { '@type': 'PostalAddress', addressCountry: 'BD', addressLocality: "Cox's Bazar" },
  },
  url: CANONICAL,
  sameAs: [
    'https://www.facebook.com/ahmmmizan',
    'https://www.youtube.com/@alihasanmdmizan',
    'https://www.instagram.com/ahmmmizan',
    'https://www.tiktok.com/@ahmmizan',
  ],
};

const PROFILE_PAGE_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'ProfilePage',
  '@id': 'https://eduvelto.com/founder#webpage',
  url: CANONICAL,
  name: 'Ali Hasan Mohammed Mizan — Founder & CEO, Eduvelto',
  description:
    'Official profile of Ali Hasan Mohammed Mizan, Founder & CEO of Eduvelto — biography, founder story, vision, and official links.',
  inLanguage: ['bn', 'en'],
  mainEntity: { '@id': 'https://eduvelto.com/founder#person' },
  about: { '@type': 'Organization', name: 'Eduvelto', url: 'https://eduvelto.com' },
  isPartOf: { '@type': 'WebSite', name: 'Eduvelto', url: 'https://eduvelto.com' },
};

export const ORGANIZATION_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': 'https://eduvelto.com#organization',
  name: 'Eduvelto',
  alternateName: 'এডুভেল্টো',
  url: 'https://eduvelto.com',
  logo: 'https://eduvelto.com/logo.png',
  slogan: 'Learn • Grow • Achieve',
  description:
    'A Smarter World of Learning — a free Bangladeshi digital education and life services platform: a digital library, job and admission preparation with MCQ practice, career guidance and everyday life services, for students from Class 9 to Honours (SSC, HSC, Honours and Masters, plus Madrasa and Technical streams).',
  foundingDate: '2026',
  foundingLocation: {
    '@type': 'Place',
    address: { '@type': 'PostalAddress', addressCountry: 'BD', addressLocality: "Cox's Bazar" },
  },
  founder: { '@id': 'https://eduvelto.com/founder#person' },
  // sameAs lists the Eduvelto organization's own profiles ONLY —
  // YouTube @EduveltoBD, LinkedIn linkedin.com/company/eduvelto
  // (created by the owner 22 Nov 2026), and Facebook
  // facebook.com/EduveltoBD (verified 22 Nov 2026). Keep in sync
  // with src/lib/seo.ts ORGANIZATION_JSON_LD (guarded by
  // founderJsonLd.test.ts). The founder's personal profiles
  // (facebook.com/ahmmmizan etc.) belong to the Person block above,
  // not to the Organization, so they are NOT listed here.
  sameAs: [
    'https://www.youtube.com/@EduveltoBD',
    'https://www.linkedin.com/company/eduvelto',
    'https://www.facebook.com/EduveltoBD',
  ],
};

const BREADCRUMB_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://eduvelto.com/' },
    { '@type': 'ListItem', position: 2, name: 'Founder', item: CANONICAL },
  ],
};

function CeoBadge() {
  return (
    <span
      style={{
        display: 'inline-block',
        background: STAR_GOLD,
        color: DARK_NAVY,
        fontWeight: 800,
        fontSize: 13,
        letterSpacing: 1,
        padding: '3px 10px',
        borderRadius: 999,
        marginLeft: 8,
        verticalAlign: 'middle',
        whiteSpace: 'nowrap',
      }}
    >
      ★ CEO
    </span>
  );
}

function StatusChip({ label, kind }: { label: string; kind: 'live' | 'planned' | 'review' }) {
  const bg = kind === 'live' ? 'var(--home-tint-green)' : kind === 'review' ? 'var(--soon-bg)' : 'var(--hover)';
  const fg = kind === 'live' ? 'var(--success)' : kind === 'review' ? 'var(--amber-dark-text)' : 'var(--heading)';
  return (
    <span
      style={{
        display: 'inline-block',
        background: bg,
        color: fg,
        fontWeight: 700,
        fontSize: 12,
        padding: '2px 8px',
        borderRadius: 999,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}

const sectionH2: React.CSSProperties = { fontSize: 20, margin: '32px 0 10px', color: 'var(--heading)' };
const bodyP: React.CSSProperties = { lineHeight: 1.8, margin: '0 0 12px' };

export default function FounderPage() {
  const { lang, t } = useLanguage();
  useSeo({
    title:
      lang === 'bn'
        ? 'আলী হাসান মোহাম্মদ মিজান — প্রতিষ্ঠাতা ও সিইও, Eduvelto'
        : 'Ali Hasan Mohammed Mizan — Founder & CEO, Eduvelto',
    description:
      lang === 'bn'
        ? 'আলী হাসান মোহাম্মদ মিজান Eduvelto-র প্রতিষ্ঠাতা ও সিইও — বাংলাদেশের শিক্ষার্থীদের জন্য বিনামূল্যের ডিজিটাল শিক্ষা প্ল্যাটফর্ম। ইংরেজি শিক্ষক, অনার্স শিক্ষার্থী ও প্রতিষ্ঠাতা।'
        : 'Ali Hasan Mohammed Mizan is the Founder & CEO of Eduvelto, a free digital education platform from Bangladesh. English teacher, Honours student, and founder.',
    canonical: CANONICAL,
    ogType: 'profile',
    ogImage: 'https://eduvelto.com/founder-photo.jpg',
    jsonLd: [PERSON_JSON_LD, PROFILE_PAGE_JSON_LD, ORGANIZATION_JSON_LD, BREADCRUMB_JSON_LD],
  });

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif' }}>
      {/* Hero */}
      <section
        style={{
          background: DARK_NAVY,
          color: '#fff',
          padding: '48px 16px 40px',
        }}
      >
        <div
          style={{
            maxWidth: 880,
            margin: '0 auto',
            display: 'flex',
            gap: 28,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <img
            src="/founder-photo.jpg"
            alt="Ali Hasan Mohammed Mizan, Founder & CEO, Eduvelto"
            style={{
              width: 180,
              height: 180,
              objectFit: 'cover',
              borderRadius: '50%',
              border: `4px solid ${STAR_GOLD}`,
              flexShrink: 0,
            }}
          />
          <div style={{ flex: '1 1 320px', minWidth: 260 }}>
            <h1 style={{ margin: '0 0 6px', fontSize: 30, lineHeight: 1.25, color: '#fff' }}>
              Ali Hasan Mohammed Mizan
              <CeoBadge />
            </h1>
            <p style={{ margin: '0 0 10px', color: GOLD, fontWeight: 700, fontSize: 17 }}>
              Founder &amp; CEO, Eduvelto
            </p>
            <p style={{ margin: '0 0 4px', fontSize: 16, lineHeight: 1.6 }}>
              {t({ bn: 'শেখো, এগিয়ে যাও, স্বপ্ন গড়ো', en: 'Learn, Grow, Achieve' })}.
            </p>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: '#dbe4f5' }}>
              {t({
                bn: 'Eduvelto-র প্রতিষ্ঠাতা — বাংলাদেশের জন্য একটি বিনামূল্যের ডিজিটাল শিক্ষা প্ল্যাটফর্ম, বাংলায় ও ইংরেজিতে।',
                en: 'Founder of Eduvelto — a free digital education platform for Bangladesh, in Bangla and in English.',
              })}
            </p>
          </div>
        </div>
      </section>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 16px 40px' }}>
        {/* At a glance */}
        <section
          aria-label={t({ bn: 'এক নজরে', en: 'At a glance' })}
          style={{
            border: `1px solid #dfe4f0`,
            borderRadius: 12,
            padding: '18px 20px',
            background: 'var(--card)',
          }}
        >
          <h2 style={{ fontSize: 17, margin: '0 0 10px', color: 'var(--heading)' }}>{t({ bn: 'এক নজরে', en: 'At a glance' })}</h2>
          <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '8px 24px', lineHeight: 1.7 }}>
            <div>
              <dt style={{ fontWeight: 700, display: 'inline' }}>{t({ bn: 'জন্ম:', en: 'Born:' })} </dt>
              <dd style={{ display: 'inline', margin: 0 }}>{t({ bn: '২১ ফেব্রুয়ারি ২০০৫', en: '21 February 2005' })}</dd>
            </div>
            <div>
              <dt style={{ fontWeight: 700, display: 'inline' }}>{t({ bn: 'এসএসসি:', en: 'SSC:' })} </dt>
              <dd style={{ display: 'inline', margin: 0 }}>{t({ bn: '২০২০, বিজ্ঞান', en: '2020, Science' })}</dd>
            </div>
            <div>
              <dt style={{ fontWeight: 700, display: 'inline' }}>{t({ bn: 'এইচএসসি:', en: 'HSC:' })} </dt>
              <dd style={{ display: 'inline', margin: 0 }}>{t({ bn: '২০২২, বিজ্ঞান — কক্সবাজার সিটি কলেজ', en: '2022, Science — Cox’s Bazar City College' })}</dd>
            </div>
            <div>
              <dt style={{ fontWeight: 700, display: 'inline' }}>{t({ bn: 'উচ্চশিক্ষা:', en: 'Higher education:' })} </dt>
              <dd style={{ display: 'inline', margin: 0 }}>
                {t({ bn: 'অনার্স তৃতীয় বর্ষ, ইংরেজি — জাতীয় বিশ্ববিদ্যালয়', en: 'Honours 3rd year, English — National University' })}
              </dd>
            </div>
            <div>
              <dt style={{ fontWeight: 700, display: 'inline' }}>{t({ bn: 'পেশা:', en: 'Profession:' })} </dt>
              <dd style={{ display: 'inline', margin: 0 }}>
                {t({ bn: 'ইংরেজি শিক্ষক, তাহসিনুল উম্মাহ ইন্টারন্যাশনাল মাদ্রাসা (২০২৩ থেকে)', en: 'English teacher, Tahsinul Ummah International Madrasa (since 2023)' })}
              </dd>
            </div>
          </dl>
        </section>

        {/* Biography */}
        <h2 style={sectionH2}>{t({ bn: 'জীবনী', en: 'Biography' })}</h2>
        {lang === 'bn' ? (
          <p style={bodyP}>
            আলী হাসান মোহাম্মদ মিজান Eduvelto-র প্রতিষ্ঠাতা ও মালিক। তিনি ২০২৩ সাল থেকে
            তাহসিনুল উম্মাহ ইন্টারন্যাশনাল মাদ্রাসায় ইংরেজি পড়াচ্ছেন। তিনি জাতীয়
            বিশ্ববিদ্যালয়ে ইংরেজি বিষয়ে অনার্স তৃতীয় বর্ষের শিক্ষার্থী। ২০২০ সালে বিজ্ঞান বিভাগে
            এসএসসি এবং ২০২২ সালে বিজ্ঞান বিভাগ থেকে কক্সবাজার সিটি কলেজ থেকে এইচএসসি সম্পন্ন করেন।
            পড়ালেখার পাশাপাশি তিনি বাবার ব্যবসা দেখাশোনা করেন। তাঁর বিশ্বাস — মানসম্মত শিক্ষা
            বাংলাদেশের প্রত্যেক শিক্ষার্থীর জন্য বিনামূল্যে পৌঁছে দেওয়া উচিত, বাংলায় ও ইংরেজিতে।
            সেই লক্ষ্যেই তিনি Eduvelto গড়েছেন — পাঠ, পরীক্ষা, ডিজিটাল লাইব্রেরি ও স্মার্ট পড়ার
            পরিকল্পনা এক জায়গায়, ভবিষ্যতে ব্যক্তিগত AI শিক্ষকসহ, যাতে দেশের যেকোনো প্রান্তের
            শিক্ষার্থী শিখতে, এগিয়ে যেতে ও স্বপ্ন গড়তে পারে।
          </p>
        ) : (
          <p style={bodyP}>
            Ali Hasan Mohammed Mizan is the Founder and Owner of Eduvelto. He has taught English
            at Tahsinul Ummah International Madrasa since 2023, and is currently in his third year
            of Honours in English at the National University. He completed his SSC in Science in
            2020 and his HSC in Science in 2022 at Cox&apos;s Bazar City College. Alongside his
            studies, he helps look after his father&apos;s business. He founded Eduvelto with a
            simple belief: quality education should be free and within reach of every student in
            Bangladesh — in Bangla and in English. Eduvelto brings together lessons, exams, a
            digital library and smart study planning — with a personal AI teacher planned for the
            future — so that a student anywhere in the country can learn, grow and achieve,
            without cost standing in the way.
          </p>
        )}

        {/* Founder story */}
        <h2 style={sectionH2}>{t({ bn: 'কেন Eduvelto', en: 'Founder story' })}</h2>
        {lang === 'bn' ? (
          <p style={bodyP}>
            আলী হাসান মোহাম্মদ মিজান ২০২৬ সালে কক্সবাজার থেকে Eduvelto গড়েছেন। তিনি নিজে একজন
            শিক্ষার্থী এবং একজন শিক্ষক — তাই সমস্যাটা তিনি দুই দিক থেকেই দেখেন: ভালো পড়ার উপকরণ হয়
            ছড়িয়ে-ছিটিয়ে থাকে, নয়তো খরচের বাইরে, নয়তো এমন ভাষায় যা শিক্ষার্থীর জন্য কঠিন।
            Eduvelto-ই তার উত্তর: বাংলাদেশের যেকোনো প্রান্তের শিক্ষার্থী এক জায়গায় বই, পাঠ,
            প্রশ্নব্যাংক, পরীক্ষা ও ফলাফল পাবে — বাংলায় ও ইংরেজিতে — আর নিজের অগ্রগতি, দুর্বল দিক ও
            পরের ধাপ দেখতে পাবে।
          </p>
        ) : (
          <p style={bodyP}>
            Ali Hasan Mohammed Mizan founded Eduvelto in 2026 from Cox&apos;s Bazar. He is a student
            himself and a teacher — so he sees the same problem from both sides: good learning
            material is scattered, expensive, or in a language students struggle with. Eduvelto is
            his answer: one free place where a student anywhere in Bangladesh can find books,
            lessons, question banks, exams and results — in Bangla and in English — and see their
            own progress, weak areas and next steps.
          </p>
        )}

        {/* Eduvelto showcase — three-way status, owner decision 21 Nov 07:24 (5) */}
        <h2 style={sectionH2}>{t({ bn: 'Eduvelto — কী আছে, কী আসছে', en: 'What Eduvelto offers' })}</h2>
        <p style={bodyP}>
          {t({
            bn: 'Eduvelto বাংলাদেশের শিক্ষার্থীদের জন্য একটি বিনামূল্যের ডিজিটাল শিক্ষা প্ল্যাটফর্ম — পাঠ, পরীক্ষা, ডিজিটাল লাইব্রেরি ও পড়ার পরিকল্পনা — শ্রেণি ৯ থেকে অনার্স পর্যন্ত, মাদ্রাসা ও কারিগরি ধারাসহ। শিক্ষার্থী, শিক্ষক ও অভিভাবকদের জন্য সম্পূর্ণ বিনামূল্যে: কোনো রেজিস্ট্রেশন ফি নেই, কোনো যাচাই ফি নেই, কখনোই না।',
            en: 'Eduvelto is a free digital education platform for Bangladesh — lessons, exams, a digital library and study planning, for students from Class 9 to Honours — SSC, HSC, Honours and Masters, plus Madrasa and Technical streams. It is free for students, teachers and guardians: no registration fee and no verification fee, ever.',
          })}
        </p>
        <h3 style={{ fontSize: 16, margin: '20px 0 8px', color: 'var(--heading)' }}>
          {t({ bn: 'উপলব্ধ এখন', en: 'Available now' })}
        </h3>
        <ul style={{ lineHeight: 2, paddingLeft: 20, margin: '0 0 12px' }}>
          <li>
            <Link to="/library">{t({ bn: 'ডিজিটাল লাইব্রেরি — ৬০৯টি বই, ২,৩০৭টি অধ্যায়, ২৩,৩৪৬টি প্রশ্ন', en: 'Digital Library — 609 books, 2,307 chapters, 23,346 questions' })}</Link>{' '}
            <StatusChip label={t({ bn: 'উপলব্ধ এখন', en: 'Available now' })} kind="live" />
          </li>
          <li>
            <Link to="/exam">{t({ bn: 'পরীক্ষা — MCQ পরীক্ষা, ফলাফল ও অগ্রগতি পর্যবেক্ষণসহ', en: 'Exams — MCQ exams with results and progress tracking' })}</Link>{' '}
            <StatusChip label={t({ bn: 'উপলব্ধ এখন', en: 'Available now' })} kind="live" />
          </li>
          <li>
            {t({ bn: 'পাঠ, বুকমার্ক ও অগ্রগতি', en: 'Lessons, bookmarks and progress' })} <StatusChip label={t({ bn: 'উপলব্ধ এখন', en: 'Available now' })} kind="live" />
          </li>
          <li>
            {t({ bn: 'শিক্ষার্থী, শিক্ষক ও অভিভাবক ড্যাশবোর্ড', en: 'Student, Teacher and Guardian dashboards' })}{' '}
            <StatusChip label={t({ bn: 'উপলব্ধ এখন', en: 'Available now' })} kind="live" />
          </li>
          <li>
            {t({ bn: 'PWA — ইনস্টল করা যায় এমন অ্যাপ (অনলাইন-ভিত্তিক)', en: 'PWA — installable app (online-only)' })} <StatusChip label={t({ bn: 'উপলব্ধ এখন', en: 'Available now' })} kind="live" />
          </li>
          <li>
            {t({ bn: 'মালিকের অ্যাডমিন ড্যাশবোর্ড', en: 'Owner Admin Dashboard' })} <StatusChip label={t({ bn: 'উপলব্ধ এখন', en: 'Available now' })} kind="live" />
          </li>
          <li>
            {t({ bn: 'স্বাস্থ্য পাতা (ওষুধ, রোগ, সুবিধা)', en: 'Health pages (medicines, diseases, facilities)' })}{' '}
            <StatusChip label={t({ bn: 'উপলব্ধ এখন — সব কনটেন্ট পর্যালোচনাধীন', en: 'Available now — all content under review' })} kind="review" />
          </li>
        </ul>
        <h3 style={{ fontSize: 16, margin: '20px 0 8px', color: 'var(--heading)' }}>          {t({ bn: 'পরিকল্পিত', en: 'Planned' })}
        </h3>
        <ul style={{ lineHeight: 2, paddingLeft: 20, margin: '0 0 12px' }}>
          <li>
            {t({ bn: 'পড়ার রুটিন', en: 'Study routine' })} <StatusChip label={t({ bn: 'পরিকল্পিত — তৈরি হয়নি', en: 'Planned — not built yet' })} kind="planned" />
          </li>
          <li>
            <Link to="/ai-teacher">{t({ bn: 'AI শিক্ষক', en: 'AI Teacher' })}</Link>{' '}
            <StatusChip label={t({ bn: 'পরিকল্পিত — শুধু ডেমো, আসল AI নয়', en: 'Planned — demo only, not live AI' })} kind="planned" />
          </li>
          <li>
            {t({ bn: 'নেটিভ অ্যান্ড্রয়েড ও iOS অ্যাপ', en: 'Native Android and iOS apps' })}{' '}
            <StatusChip label={t({ bn: 'পরিকল্পিত — ০% তৈরি, আজ শুধু PWA', en: 'Planned — 0% built, PWA only today' })} kind="planned" />
          </li>
          <li>
            {t({ bn: 'ব্যক্তিগত মেসেজিং ও শিক্ষামূলক কমিউনিটি', en: 'Private messaging and educational communities' })}{' '}
            <StatusChip label={t({ bn: 'পরিকল্পিত — নিরাপত্তা পর্যালোচনার পর', en: 'Planned — after safety review' })} kind="planned" />
          </li>
          <li>
            {t({ bn: 'ভিডিও পাঠ / শর্টস', en: 'Video lessons / Shorts' })}{' '}
            <StatusChip label={t({ bn: 'পরিকল্পিত — শ্রেণিবিন্যাস অনুমোদিত, তৈরি হয়নি', en: 'Planned — classification approved, not built' })} kind="planned" />
          </li>
        </ul>

        {/* Vision & mission */}
        <h2 style={sectionH2}>{t({ bn: 'ভিশন ও মিশন', en: 'Vision & mission' })}</h2>
        <p style={bodyP}>
          <strong>{t({ bn: 'ভিশন:', en: 'Vision:' })}</strong>{' '}
          {t({
            bn: 'বাংলাদেশের প্রত্যেক শিক্ষার্থীর জন্য বিনামূল্যে, সহজলভ্য, মানসম্মত শিক্ষা — শেখো, এগিয়ে যাও, স্বপ্ন গড়ো।',
            en: 'free, accessible, quality education for every student in Bangladesh — Learn, Grow, Achieve.',
          })}
        </p>
        <p style={bodyP}>
          <strong>{t({ bn: 'মিশন:', en: 'Mission:' })}</strong>{' '}
          {t({
            bn: 'শেখার উপকরণ — বই, পাঠ, প্রশ্নব্যাংক, পরীক্ষা, ফলাফল ও অগ্রগতি পর্যবেক্ষণ — শ্রেণি ৯ থেকে অনার্স পর্যন্ত, বাংলায় ও ইংরেজিতে, সবার জন্য উপলব্ধ করা।',
            en: 'make learning resources — books, lessons, question banks, exams, results and progress tracking — available to everyone, in Bangla and English, from Class 9 to Honours.',
          })}
        </p>
        <p style={bodyP}>
          <strong>{t({ bn: 'দীর্ঘমেয়াদি:', en: 'Long-term:' })}</strong>{' '}
          {t({
            bn: 'প্রথমে ওয়েবসাইট শেষ করা, তারপর একই প্রিমিয়াম পরিচয়ে অ্যান্ড্রয়েড ও iOS অ্যাপ; আসল AI শিক্ষক (আগে খরচ হিসাব, শুধু অনুমোদন পেলে); শিক্ষার্থী, শিক্ষক ও অভিভাবক ড্যাশবোর্ড; স্কুল অ্যাকাউন্ট; এবং শিক্ষামূলক কমিউনিটি — শুধু তখনই, যখন নিরাপত্তা, বয়স সুরক্ষা ও মডারেশন প্রস্তুত।',
            en: 'finish the website first, then Android and iOS apps with the same premium identity; a real AI Teacher (costed first, only with approval); student, teacher and guardian dashboards; school accounts; and educational communities — only when safety, age protection and moderation are ready.',
          })}
        </p>

        {/* Projects & achievements */}
        <h2 style={sectionH2}>{t({ bn: 'প্রকল্প', en: 'Projects' })}</h2>
        <ul style={{ lineHeight: 2, paddingLeft: 20, margin: '0 0 12px' }}>
          <li>
            <strong>Eduvelto</strong> — {t({ bn: 'প্রতিষ্ঠাতা ও CEO (২০২৬)। বাংলাদেশের জন্য বিনামূল্যের ডিজিটাল শিক্ষা প্ল্যাটফর্ম।', en: 'Founder & CEO (2026). Free digital education platform for Bangladesh.' })} <Link to="/about">{t({ bn: 'Eduvelto সম্পর্কে', en: 'About Eduvelto' })} →</Link>
          </li>
          <li>
            <strong>{t({ bn: 'ফেসবুক পেজ — আলী হাসান মোহাম্মদ মিজান', en: 'Facebook page — Ali Hasan Mohammed Mizan' })}</strong> —{' '}
            <a href="https://www.facebook.com/ahmmmizan" target="_blank" rel="noopener noreferrer">
              facebook.com/ahmmmizan
            </a>
          </li>
          <li>
            <strong>{t({ bn: 'ইউটিউব — আলী হাসান মোহাম্মদ মিজান', en: 'YouTube — Ali Hasan Mohammed Mizan' })}</strong> —{' '}
            <a href="https://www.youtube.com/@alihasanmdmizan" target="_blank" rel="noopener noreferrer">
              @alihasanmdmizan
            </a>
          </li>
        </ul>
        <p style={{ ...bodyP, color: 'var(--ink-soft)', fontSize: 15 }}>
          {t({ bn: 'এখানে কোনো পুরস্কার বা আনুষ্ঠানিক সম্মান দাবি করা হয়নি — শুধু যাচাইকৃত মাইলফলকই তালিকাভুক্ত।', en: 'No awards or formal honours are claimed here — only verified milestones are listed.' })}
        </p>

        {/* Social links — Eduvelto's OFFICIAL links are the brand
            profiles only (YouTube @EduveltoBD, Facebook
            facebook.com/EduveltoBD, LinkedIn linkedin.com/company/
            eduvelto — same three as the Organization JSON-LD sameAs).
            The founder's personal profiles are listed separately
            below, labelled as his own — never as Eduvelto's official
            channels (24 Nov 2026, brand-SEO wave 1, trust draft §5). */}
        <h2 style={sectionH2}>{t({ bn: 'অফিসিয়াল লিংক', en: 'Official links' })}</h2>
        <ul style={{ lineHeight: 2.2, paddingLeft: 20, margin: '0 0 12px', listStyle: 'none', paddingInlineStart: 0 }}>
          <li>
            <a href="https://www.youtube.com/@EduveltoBD" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--link)' }}>
              {t({ bn: 'ইউটিউব — @EduveltoBD', en: 'YouTube — @EduveltoBD' })}
            </a>
          </li>
          <li>
            <a href="https://www.facebook.com/EduveltoBD" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--link)' }}>
              {t({ bn: 'ফেসবুক — facebook.com/EduveltoBD', en: 'Facebook — facebook.com/EduveltoBD' })}
            </a>
          </li>
          <li>
            <a href="https://www.linkedin.com/company/eduvelto" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--link)' }}>
              {t({ bn: 'লিংকডইন — linkedin.com/company/eduvelto', en: 'LinkedIn — linkedin.com/company/eduvelto' })}
            </a>
          </li>
          <li>
            <Link to="/" style={{ color: 'var(--link)' }}>Eduvelto — eduvelto.com</Link>
          </li>
        </ul>

        <h2 style={sectionH2}>{t({ bn: 'প্রতিষ্ঠাতার ব্যক্তিগত লিংক', en: "Founder's personal profiles" })}</h2>
        <ul style={{ lineHeight: 2.2, paddingLeft: 20, margin: '0 0 12px', listStyle: 'none', paddingInlineStart: 0 }}>
          <li>
            <a href="https://www.facebook.com/ahmmmizan" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--link)' }}>
              {t({ bn: 'ফেসবুক পেজ — আলী হাসান মোহাম্মদ মিজান', en: 'Facebook Page — Ali Hasan Mohammed Mizan' })}
            </a>
          </li>
          <li>
            <a href="https://www.youtube.com/@alihasanmdmizan" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--link)' }}>
              {t({ bn: 'ইউটিউব — আলী হাসান মোহাম্মদ মিজান', en: 'YouTube — Ali Hasan Mohammed Mizan' })}
            </a>
          </li>
          <li>
            <a href="https://www.instagram.com/ahmmmizan" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--link)' }}>
              {t({ bn: 'ইনস্টাগ্রাম — @ahmmmizan', en: 'Instagram — @ahmmmizan' })}
            </a>
          </li>
          <li>
            <a href="https://www.tiktok.com/@ahmmizan" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--link)' }}>
              {t({ bn: 'টিকটক — @ahmmizan', en: 'TikTok — @ahmmizan' })}
            </a>
          </li>
        </ul>

        {/* Contact — official business email (owner decision 21 Nov 07:24, 2) */}
        <h2 style={sectionH2}>{t({ bn: 'যোগাযোগ', en: 'Contact' })}</h2>
        <p style={bodyP}>
          {t({ bn: 'অফিসিয়াল ব্যবসায়িক ইমেইল:', en: 'Official business email:' })}{' '}
          <a href="mailto:ahmmizan23@gmail.com" style={{ color: 'var(--link)' }}>
            ahmmizan23@gmail.com
          </a>
        </p>
        <p style={bodyP}>
          {t({ bn: 'অন্য যেকোনো প্রয়োজনে অনুগ্রহ করে', en: 'For anything else, please use the' })} <Link to="/contact">{t({ bn: 'যোগাযোগের পাতা', en: 'contact page' })}</Link>{t({ bn: ' ব্যবহার করুন।', en: '.' })}
        </p>

        <p style={{ marginTop: 32 }}>
          <Link to="/">← {t({ bn: 'হোম', en: 'Home' })}</Link>
          {' · '}
          <Link to="/about">{t({ bn: 'Eduvelto সম্পর্কে', en: 'About Eduvelto' })}</Link>
        </p>
      </div>
    </main>
  );
}
