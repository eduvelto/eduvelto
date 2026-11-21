// Eduvelto — Founder profile page (21 Nov 2026, identity/founder-profile).
//
// Dedicated personal profile for Ali Hasan Mohammed Mizan, Founder &
// CEO of Eduvelto. STAGING ONLY — publication requires the owner's
// approval of the full preview (report: digital-identity-report.md,
// gates G1 + G2). Content rules that bind this page:
// - Biography: the text the owner approved 20 Nov 2026 (21:08), with
//   the private-tuition clause omitted per his public-details rule
//   (20 Nov 22:54). Madrasa teaching stays.
// - Date of birth (21 February 2005) and birthplace (Cox's Bazar,
//   Bangladesh) are PROPOSED additions, shown as labelled facts and
//   in the structured data. No age is stated anywhere (age changes
//   over time). Home address is never shown.
// - Contact details: placeholder only — no email or phone on this
//   page until the owner explicitly confirms (gate G2).
// - Features are labelled AVAILABLE NOW vs PLANNED — nothing
//   unfinished is advertised as operational.
// - Only the approved founder photo is used (/founder-photo.jpg).
// - No awards, honours, follower counts or other claims are made:
//   the page states plainly that none are claimed.

import { Link } from 'react-router-dom';
import { useSeo } from '../lib/seo';

const NAVY = '#0A1F44';
const DARK_NAVY = '#041742';
const BLUE = '#1E7CE8';
const GOLD = '#F5A623';
const STAR_GOLD = '#F1B308';

const CANONICAL = 'https://eduvelto.com/founder';

const PERSON_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  '@id': 'https://eduvelto.com/founder#person',
  name: 'Ali Hasan Mohammed Mizan',
  alternateName: ['আলী হাসান মোহাম্মদ মিজান', 'AHM Mizan'],
  description:
    'Founder and CEO of Eduvelto, a free digital education platform from Bangladesh. English teacher at Tahsinul Ummah International Madrasa since 2023. Honours 3rd year English, National University. From Cox\'s Bazar, Bangladesh.',
  birthDate: '2005-02-21',
  birthPlace: { '@type': 'Place', name: "Cox's Bazar, Bangladesh" },
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

const ORGANIZATION_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': 'https://eduvelto.com#organization',
  name: 'Eduvelto',
  alternateName: 'এডুভেল্টো',
  url: 'https://eduvelto.com',
  logo: 'https://eduvelto.com/logo.png',
  slogan: 'Learn • Grow • Achieve',
  description:
    'A Smarter World of Learning — a free digital education platform from Bangladesh, in Bangla and English, for students from Class 1 to Honours.',
  foundingDate: '2026',
  foundingLocation: {
    '@type': 'Place',
    address: { '@type': 'PostalAddress', addressCountry: 'BD', addressLocality: "Cox's Bazar" },
  },
  founder: { '@id': 'https://eduvelto.com/founder#person' },
  sameAs: [
    'https://www.facebook.com/ahmmmizan',
    'https://www.youtube.com/@alihasanmdmizan',
    'https://www.instagram.com/ahmmmizan',
    'https://www.tiktok.com/@ahmmizan',
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
  const bg = kind === 'live' ? '#e6f4ea' : kind === 'review' ? '#fff4e0' : '#eef2fb';
  const fg = kind === 'live' ? '#137333' : kind === 'review' ? '#7a4d00' : '#0A1F44';
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

const sectionH2: React.CSSProperties = { fontSize: 20, margin: '32px 0 10px', color: NAVY };
const bodyP: React.CSSProperties = { lineHeight: 1.8, margin: '0 0 12px' };

export default function FounderPage() {
  useSeo({
    title: 'Ali Hasan Mohammed Mizan — Founder & CEO, Eduvelto',
    description:
      'Ali Hasan Mohammed Mizan is the Founder & CEO of Eduvelto, a free digital education platform from Bangladesh. English teacher, Honours student, and founder — from Cox\'s Bazar.',
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
            <h1 style={{ margin: '0 0 6px', fontSize: 30, lineHeight: 1.25 }}>
              Ali Hasan Mohammed Mizan
              <CeoBadge />
            </h1>
            <p style={{ margin: '0 0 10px', color: GOLD, fontWeight: 700, fontSize: 17 }}>
              Founder &amp; CEO, Eduvelto
            </p>
            <p style={{ margin: '0 0 4px', fontSize: 16, lineHeight: 1.6 }}>
              শেখো, এগিয়ে যাও, স্বপ্ন গড়ো — Learn, Grow, Achieve.
            </p>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: '#dbe4f5' }}>
              Founder of Eduvelto — a free digital education platform for Bangladesh, in Bangla and
              in English.
            </p>
          </div>
        </div>
      </section>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 16px 40px' }}>
        {/* At a glance */}
        <section
          aria-label="At a glance"
          style={{
            border: `1px solid #dfe4f0`,
            borderRadius: 12,
            padding: '18px 20px',
            background: '#f8f9fc',
          }}
        >
          <h2 style={{ fontSize: 17, margin: '0 0 10px', color: NAVY }}>এক নজরে / At a glance</h2>
          <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '8px 24px', lineHeight: 1.7 }}>
            <div>
              <dt style={{ fontWeight: 700, display: 'inline' }}>Born: </dt>
              <dd style={{ display: 'inline', margin: 0 }}>21 February 2005</dd>
            </div>
            <div>
              <dt style={{ fontWeight: 700, display: 'inline' }}>Birthplace: </dt>
              <dd style={{ display: 'inline', margin: 0 }}>Cox&apos;s Bazar, Bangladesh</dd>
            </div>
            <div>
              <dt style={{ fontWeight: 700, display: 'inline' }}>SSC: </dt>
              <dd style={{ display: 'inline', margin: 0 }}>2020, Science</dd>
            </div>
            <div>
              <dt style={{ fontWeight: 700, display: 'inline' }}>HSC: </dt>
              <dd style={{ display: 'inline', margin: 0 }}>2022, Science — Cox&apos;s Bazar City College</dd>
            </div>
            <div>
              <dt style={{ fontWeight: 700, display: 'inline' }}>Higher education: </dt>
              <dd style={{ display: 'inline', margin: 0 }}>
                Honours 3rd year, English — National University
              </dd>
            </div>
            <div>
              <dt style={{ fontWeight: 700, display: 'inline' }}>Profession: </dt>
              <dd style={{ display: 'inline', margin: 0 }}>
                English teacher, Tahsinul Ummah International Madrasa (since 2023)
              </dd>
            </div>
          </dl>
        </section>

        {/* Biography */}
        <h2 style={sectionH2}>জীবনী / Biography</h2>
        <p style={bodyP}>
          Ali Hasan Mohammed Mizan is the Founder and Owner of Eduvelto. From Cox&apos;s Bazar,
          Bangladesh, he has taught English at Tahsinul Ummah International Madrasa since 2023,
          and is currently in his third year of Honours in English at the National University. He
          completed his SSC in Science in 2020 and his HSC in Science in 2022 at Cox&apos;s Bazar
          City College. Alongside his studies, he helps look after his father&apos;s business. He
          founded Eduvelto with a simple belief: quality education should be free and within reach
          of every student in Bangladesh — in Bangla and in English. Eduvelto brings together
          lessons, exams, a personal AI teacher, a digital library and smart study planning, so
          that a student anywhere in the country can learn, grow and achieve, without cost
          standing in the way.
        </p>
        <p style={bodyP}>
          আলী হাসান মোহাম্মদ মিজান Eduvelto-র প্রতিষ্ঠাতা ও মালিক। কক্সবাজার থেকে আসা তিনি ২০২৩
          সাল থেকে তাহসিনুল উম্মাহ ইন্টারন্যাশনাল মাদ্রাসায় ইংরেজি পড়াচ্ছেন। তিনি জাতীয়
          বিশ্ববিদ্যালয়ে ইংরেজি বিষয়ে অনার্স তৃতীয় বর্ষের শিক্ষার্থী। ২০২০ সালে বিজ্ঞান বিভাগে
          এসএসসি এবং ২০২২ সালে বিজ্ঞান বিভাগ থেকে কক্সবাজার সিটি কলেজ থেকে এইচএসসি সম্পন্ন করেন।
          পড়ালেখার পাশাপাশি তিনি বাবার ব্যবসা দেখাশোনা করেন। তাঁর বিশ্বাস — মানসম্মত শিক্ষা
          বাংলাদেশের প্রত্যেক শিক্ষার্থীর জন্য বিনামূল্যে পৌঁছে দেওয়া উচিত, বাংলায় ও ইংরেজিতে।
          সেই লক্ষ্যেই তিনি Eduvelto গড়েছেন — পাঠ, পরীক্ষা, ব্যক্তিগত AI শিক্ষক, ডিজিটাল লাইব্রেরি
          ও স্মার্ট পড়ার পরিকল্পনা এক জায়গায়, যাতে দেশের যেকোনো প্রান্তের শিক্ষার্থী শিখতে,
          এগিয়ে যেতে ও স্বপ্ন গড়তে পারে।
        </p>

        {/* Founder story */}
        <h2 style={sectionH2}>কেন Eduvelto / Founder story</h2>
        <p style={bodyP}>
          Ali Hasan Mohammed Mizan founded Eduvelto in 2026 from Cox&apos;s Bazar. He is a student
          himself and a teacher — so he sees the same problem from both sides: good learning
          material is scattered, expensive, or in a language students struggle with. Eduvelto is
          his answer: one free place where a student anywhere in Bangladesh can find books,
          lessons, question banks, exams and results — in Bangla and in English — and see their
          own progress, weak areas and next steps.
        </p>
        <p style={bodyP}>
          আলী হাসান মোহাম্মদ মিজান ২০২৬ সালে কক্সবাজার থেকে Eduvelto গড়েছেন। তিনি নিজে একজন
          শিক্ষার্থী এবং একজন শিক্ষক — তাই সমস্যাটা তিনি দুই দিক থেকেই দেখেন: ভালো পড়ার উপকরণ হয়
          ছড়িয়ে-ছিটিয়ে থাকে, নয়তো খরচের বাইরে, নয়তো এমন ভাষায় যা শিক্ষার্থীর জন্য কঠিন।
          Eduvelto-ই তার উত্তর: বাংলাদেশের যেকোনো প্রান্তের শিক্ষার্থী এক জায়গায় বই, পাঠ,
          প্রশ্নব্যাংক, পরীক্ষা ও ফলাফল পাবে — বাংলায় ও ইংরেজিতে — আর নিজের অগ্রগতি, দুর্বল দিক ও
          পরের ধাপ দেখতে পাবে।
        </p>

        {/* Eduvelto showcase */}
        <h2 style={sectionH2}>Eduvelto — কী আছে, কী আসছে / What Eduvelto offers</h2>
        <p style={bodyP}>
          Eduvelto is a free digital education platform for Bangladesh — lessons, exams, a digital
          library and study planning, for students from Class 1 to Honours. It is free for
          students, teachers and guardians: no registration fee and no verification fee, ever.
        </p>
        <ul style={{ lineHeight: 2, paddingLeft: 20, margin: '0 0 12px' }}>
          <li>
            <Link to="/library">Digital Library — 609 books, 2,109 chapters, 20,970 questions</Link>{' '}
            <StatusChip label="Available now" kind="live" />
          </li>
          <li>
            <Link to="/exam">Exams — 212 exams with results and progress tracking</Link>{' '}
            <StatusChip label="Available now" kind="live" />
          </li>
          <li>
            Lessons, bookmarks and progress <StatusChip label="Available now" kind="live" />
          </li>
          <li>
            Study routine <StatusChip label="Available now" kind="live" />
          </li>
          <li>
            PWA — installable app, works offline <StatusChip label="Available now" kind="live" />
          </li>
          <li>
            Health pages (medicines, diseases, facilities){' '}
            <StatusChip label="Live — content under review" kind="review" />
          </li>
          <li>
            <Link to="/ai-teacher">AI Teacher</Link>{' '}
            <StatusChip label="Planned — demo only, not live AI" kind="planned" />
          </li>
          <li>
            Student, Teacher and Guardian dashboards{' '}
            <StatusChip label="In development (staging)" kind="planned" />
          </li>
          <li>
            Native Android and iOS apps{' '}
            <StatusChip label="Planned — 0% built, PWA only today" kind="planned" />
          </li>
          <li>
            Private messaging and educational communities{' '}
            <StatusChip label="Planned — after safety review" kind="planned" />
          </li>
        </ul>

        {/* Vision & mission */}
        <h2 style={sectionH2}>ভিশন ও মিশন / Vision &amp; mission</h2>
        <p style={bodyP}>
          <strong>Vision:</strong> free, accessible, quality education for every student in
          Bangladesh — Learn, Grow, Achieve.
        </p>
        <p style={bodyP}>
          <strong>Mission:</strong> make learning resources — books, lessons, question banks,
          exams, results and progress tracking — available to everyone, in Bangla and English,
          from Class 1 to Honours.
        </p>
        <p style={bodyP}>
          <strong>Long-term:</strong> finish the website first, then Android and iOS apps with the
          same premium identity; a real AI Teacher (costed first, only with approval); student,
          teacher and guardian dashboards; school accounts; and educational communities — only
          when safety, age protection and moderation are ready.
        </p>

        {/* Projects & achievements */}
        <h2 style={sectionH2}>প্রকল্প / Projects</h2>
        <ul style={{ lineHeight: 2, paddingLeft: 20, margin: '0 0 12px' }}>
          <li>
            <strong>Eduvelto</strong> — Founder &amp; CEO (2026). Free digital education platform
            for Bangladesh. <Link to="/about">About Eduvelto →</Link>
          </li>
          <li>
            <strong>Facebook page — Ali Hasan Mohammed Mizan</strong> —{' '}
            <a href="https://www.facebook.com/ahmmmizan" target="_blank" rel="noopener noreferrer">
              facebook.com/ahmmmizan
            </a>
          </li>
          <li>
            <strong>YouTube — Ali Hasan Mohammed Mizan</strong> —{' '}
            <a href="https://www.youtube.com/@alihasanmdmizan" target="_blank" rel="noopener noreferrer">
              @alihasanmdmizan
            </a>
          </li>
        </ul>
        <p style={{ ...bodyP, color: '#555', fontSize: 15 }}>
          No awards or formal honours are claimed here — only verified milestones are listed.
        </p>

        {/* Social links */}
        <h2 style={sectionH2}>অফিসিয়াল লিংক / Official links</h2>
        <ul style={{ lineHeight: 2.2, paddingLeft: 20, margin: '0 0 12px', listStyle: 'none', paddingInlineStart: 0 }}>
          <li>
            <a href="https://www.facebook.com/ahmmmizan" target="_blank" rel="noopener noreferrer" style={{ color: BLUE }}>
              Facebook Page — Ali Hasan Mohammed Mizan
            </a>
          </li>
          <li>
            <a href="https://www.youtube.com/@alihasanmdmizan" target="_blank" rel="noopener noreferrer" style={{ color: BLUE }}>
              YouTube — Ali Hasan Mohammed Mizan
            </a>
          </li>
          <li>
            <a href="https://www.instagram.com/ahmmmizan" target="_blank" rel="noopener noreferrer" style={{ color: BLUE }}>
              Instagram — @ahmmmizan
            </a>
          </li>
          <li>
            <a href="https://www.tiktok.com/@ahmmizan" target="_blank" rel="noopener noreferrer" style={{ color: BLUE }}>
              TikTok — @ahmmizan
            </a>
          </li>
          <li>
            <Link to="/" style={{ color: BLUE }}>Eduvelto — eduvelto.com</Link>
          </li>
        </ul>

        {/* Contact — placeholder only */}
        <h2 style={sectionH2}>যোগাযোগ / Contact</h2>
        <p style={bodyP}>
          Official contact details will appear here after the owner&apos;s approval. Until then,
          please use the <Link to="/contact">contact page</Link>.
        </p>

        <p style={{ marginTop: 32 }}>
          <Link to="/">← হোম / Home</Link>
          {' · '}
          <Link to="/about">Eduvelto সম্পর্কে / About Eduvelto</Link>
        </p>
      </div>
    </main>
  );
}
