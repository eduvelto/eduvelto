// Eduvelto — home, redesign (24 Nov 2026, owner brief 24 Nov 07:25).
//
// Layout (desktop ≥769px and mobile ≤768px share one component):
//   greeting band (v4 mount: OUTSIDE PageShell, see below) → hero +
//   Global Search → top-banner ad → 6 hub cards (Education /
//   Question Maker / Jobs / Opportunity / AI / Life) → শিক্ষা কেন্দ্র grid → 4 section cards
//   (চাকরি / ভর্তি / শিক্ষা / দক্ষতা — preserved verbatim from the
//   21 Nov redesign) → feature strip / quick access → TABS (25 Nov
//   2026, owner: "home page a tab koro sudnor kore sajiye"): the
//   main content sections live in six tabs — শিক্ষা (শিক্ষা কেন্দ্র
//   + জনপ্রিয় বই), প্রশ্নপত্র তৈরি (generator entry point, owner
//   25 Nov 2026 18:26), চাকরি প্রস্তুতি (Jobs section), ভর্তি প্রস্তুতি
//   (admission tiles), সুযোগ কেন্দ্র, AI ও সেবা (AI টুলস +
//   দৈনন্দিন সেবা). All six panels render in the DOM (inactive ones
//   hidden) so the prerendered content is unchanged. Below the tabs,
//   always visible: Daily Quiz → real-numbers stats → panels
//   (আপডেট / অগ্রগতি / জনপ্রিয়) → founder message → footer banner.
//
// HONESTY — the mockups contain sample/fake content; NONE of it ships:
//  - Hero: NO stock photos — CSS gradients + wordmark only. No
//    suitable real/licensed student photo exists in brand-assets/
//    (logos + founder photo only), so the gradient hero stays and
//    the photo is reported incomplete, never faked with AI/stock.
//  - Stats: REAL numbers only — book + opportunity counts are
//    computed live from Firestore/seed; ২৩০৭ অধ্যায় / ২৩,২৫৯ প্রশ্ন
//    are the audit-verified counts (24 Nov 2026 backup: ২৩,৩৪৬,
//    minus the 87 removed by the 25 Nov NCTB crons). No 10K+/5K+/1K+.
//  - Popular Books: REAL library books only (sorted by question
//    count — the section says so), text cards, never fake covers.
//  - Updates: REAL dated items only (latest verified opportunity
//    listings); the panel is hidden when there are none (28 Nov 2026).
//    No invented news.
//  - AI panel: the LIVE /ai-assistant (live AI chat since 28 Nov 2026)
//    is the primary action. No demo link on the homepage.
//  - Class 1–5 / 6–8 have NO books: their tiles/dashboards show the
//    honest not-ready state, never wrong-class books.
//  - Testimonials: OMITTED — no real testimonial exists.
//  - "Trending Courses": OMITTED — no courses system exists.
//  - Tagline stays "শেখো, এগিয়ে যাও, স্বপ্ন গড়ো।" / "Learn • Grow •
//    Achieve". "One Platform. Endless Possibilities." is a proposal
//    only and is NOT used as the tagline.
//  - Progress ring: REAL signed-in user data only. Never a fake %.
//  - /skills redirects to /tools (28 Nov 2026 audit) — no Coming
//    Soon page remains in the public site.
//  - One top-banner ad slot below the hero (ads placement plan 22 Nov
//    2026). It renders nothing until AdSense is configured; the global
//    bottom banner in App.tsx still applies. No ads above the fold.

import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { loginState } from '../lib/loginReturn';
import { PageShell } from '../components/PageShell';
import AdSlot from '../components/AdSlot';
import AnnouncementTicker from '../components/AnnouncementTicker';
import { useAuth } from '../lib/auth';
import { JobsSection } from '../components/JobCards';
import DailyQuizWidget from '../components/DailyQuizWidget';
import HomeBookSearchResults from '../components/HomeBookSearchResults';
import HomeTabs, { HOME_TABS, type HomeTabId } from '../components/HomeTabs';
import HomeQuestionMakerPanel from '../components/HomeQuestionMakerPanel';
import { useLanguage } from '../i18n/LanguageContext';
import { listQuizAttempts, listSubjectProgress } from '../lib/progress';
import { getAllPublishedBooksCached, type Book } from '../lib/content';
import { readHomePayload, type HomePayload } from '../lib/initialData';
import { loadHubOpportunities } from '../lib/opportunitiesData';
import type { Opportunity } from '../lib/opportunities';
import '../components/home-redesign.css';

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  );
}
function BriefcaseIcon({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}
function CapIcon({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 10L12 5 2 10l10 5 10-5z" />
      <path d="M6 12.5V17c0 1.66 2.69 3 6 3s6-1.34 6-3v-4.5" />
      <path d="M22 10v6" />
    </svg>
  );
}
function BookIcon({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}
function DocIcon({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M9 13h6" />
      <path d="M9 17h6" />
    </svg>
  );
}
function GlobeIcon({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a13.5 13.5 0 0 1 3.5 9 13.5 13.5 0 0 1-3.5 9 13.5 13.5 0 0 1-3.5-9A13.5 13.5 0 0 1 12 3z" />
    </svg>
  );
}
function RobotIcon({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5" y="8" width="14" height="11" rx="2" />
      <path d="M12 8V4" />
      <circle cx="12" cy="3" r="1" />
      <circle cx="9" cy="13" r="1" fill="currentColor" />
      <circle cx="15" cy="13" r="1" fill="currentColor" />
      <path d="M9 17h6" />
    </svg>
  );
}
function QuizIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4.5V3h6v1.5" />
      <path d="M9 11l2 2 4-4" />
    </svg>
  );
}
function ChartIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 3v18h18" />
      <path d="M7 15l4-6 4 3 5-8" />
    </svg>
  );
}
function TrophyIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 3h12v2a6 6 0 0 1-12 0V3z" />
      <path d="M6 5H3a3 3 0 0 0 3 5" />
      <path d="M18 5h3a3 3 0 0 1-3 5" />
      <path d="M12 13v4" />
      <path d="M8 21h8" />
    </svg>
  );
}
function StarIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

// The four sections — preserved verbatim from the 21 Nov redesign
// (Job + Admission Preparation are live since 22 Nov 2026; /class
// is real; only /skills still lands on the shared Coming Soon page).
const SECTIONS = [
  {
    id: 'jobs',
    to: '/jobs',
    tint: 'ev-home-card-job',
    icon: <BriefcaseIcon />,
    badgeBn: 'সর্বোচ্চ অগ্রাধিকার',
    badgeEn: 'Highest priority',
    badgeMobileOnly: false,
    titleBn: 'চাকরি প্রস্তুতি',
    titleEn: 'Job Preparation',
    descBn: 'BCS, ব্যাংক, শিক্ষক নিয়োগ, সরকারি ও বেসরকারি চাকরি',
    descEn: 'BCS, Bank, Teacher Recruitment, Government & Private Jobs',
    ctaBn: 'প্রস্তুতি নিন',
    ctaEn: 'Start Preparing',
  },
  {
    id: 'admissions',
    to: '/admissions',
    tint: 'ev-home-card-admissions',
    icon: <CapIcon />,
    badgeBn: 'সর্বোচ্চ অগ্রাধিকার',
    badgeEn: 'Highest priority',
    // Mockup: the badge is on Job only on desktop, on Job AND Admission
    // on mobile. The CSS class hides this badge at ≥769px.
    badgeMobileOnly: true,
    titleBn: 'ভর্তি প্রস্তুতি',
    titleEn: 'Admission Preparation',
    descBn: 'বিশ্ববিদ্যালয়, মেডিকেল, ইঞ্জিনিয়ারিং, কৃষি ও অন্যান্য',
    descEn: 'University, Medical, Engineering, Agriculture & More',
    ctaBn: 'ভর্তি প্রস্তুতি নিন',
    ctaEn: 'Prepare for Admission',
  },
  {
    id: 'academic',
    to: '/class',
    tint: 'ev-home-card-academic',
    icon: <BookIcon />,
    badgeBn: '',
    badgeEn: '',
    badgeMobileOnly: false,
    titleBn: 'শিক্ষা কার্যক্রম',
    titleEn: 'Academic Learning',
    descBn: 'Class 9–10, HSC, Madrasa, Technical, Honours & Masters',
    descEn: 'Class 9–10, HSC, Madrasa, Technical, Honours & Masters',
    ctaBn: 'পড়া শুরু করুন',
    ctaEn: 'Start Learning',
  },
  // 28 Nov 2026 (completeness audit): the Professional Skills card
  // is hidden — the /skills section does not exist yet and the card
  // led to the "coming soon" page.
];

// The six hubs (owner brief §4 + mockups). Every destination is
// live. The AI hub opens the live /ai-assistant (live AI chat since
// 28 Nov 2026); no demo link is shown on the homepage.
const HUBS = [
  {
    id: 'education',
    to: '/class',
    tint: 'ev-rd-hub-green',
    icon: <CapIcon />,
    titleBn: 'Education Hub',
    titleEn: 'Education Hub',
    descBn: 'শিক্ষা ও শেখার পূর্ণাঙ্গ ব্যবস্থা',
    descEn: 'Complete learning system',
    noteBn: '',
    noteEn: '',
  },
  {
    id: 'question-maker',
    to: '/question-maker',
    tint: 'ev-rd-hub-rose',
    icon: <DocIcon />,
    titleBn: 'প্রশ্নপত্র তৈরি',
    titleEn: 'Question Maker',
    descBn: 'অধ্যায়ভিত্তিক প্রশ্নপত্র তৈরি — ফ্রি ৩টা/মাস, ৭০% ছাড়ে',
    descEn: 'Chapter-wise question papers — 3 free/month, 70% off',
    noteBn: '',
    noteEn: '',
  },
  {
    id: 'jobs',
    to: '/jobs',
    tint: 'ev-rd-hub-teal',
    icon: <TrophyIcon size={30} />,
    titleBn: 'চাকরি প্রস্তুতি',
    titleEn: 'Job Preparation',
    descBn: 'BCS, ব্যাংক, শিক্ষক নিয়োগ, সরকারি ও বেসরকারি চাকরি',
    descEn: 'BCS, Bank, Teacher Recruitment, Government & Private Jobs',
    noteBn: '',
    noteEn: '',
  },
  {
    id: 'opportunity',
    to: '/opportunities',
    tint: 'ev-rd-hub-blue',
    icon: <BriefcaseIcon />,
    titleBn: 'Opportunity Hub',
    titleEn: 'Opportunity Hub',
    descBn: 'চাকরি ও ক্যারিয়ারের সুযোগ',
    descEn: 'Jobs and career opportunities',
    noteBn: '',
    noteEn: '',
  },
  {
    id: 'ai',
    to: '/ai-assistant',
    tint: 'ev-rd-hub-purple',
    icon: <RobotIcon />,
    titleBn: 'AI Life Assistant',
    titleEn: 'AI Life Assistant',
    descBn: 'আপনার ব্যক্তিগত AI সহকারী',
    descEn: 'Your personal AI assistant',
    // AI Life Assistant rebase (24 Nov 2026): the hub card opens the
    // LIVE /ai-assistant (live AI chat since 28 Nov 2026). No demo
    // link is shown on the homepage.
    noteBn: 'হিসাব, চিঠি, সিভি ও দরকারি টুল — এখনই ব্যবহার করুন',
    noteEn: 'Calculators, letters, CV and daily tools — use now',
  },
  {
    id: 'life',
    to: '/life',
    tint: 'ev-rd-hub-amber',
    icon: <GlobeIcon />,
    titleBn: 'Everyday Life Services',
    titleEn: 'Everyday Life Services',
    descBn: 'দৈনন্দিন প্রয়োজনীয় সেবা',
    descEn: 'Everyday services you need',
    noteBn: '',
    noteEn: '',
  },
];

// Popular free tools (28 Nov 2026 AdSense-readiness): the homepage
// had NO tools section and NO link to the Tools Hub at all — the
// hub existed at /tools but was unreachable from the homepage.
// These 6 are the most-used tools (titles + slugs verified against
// src/lib/toolsMeta.ts); the hub count is 265 — the 28 Nov 2026
// audit removed 2 duplicates (pdf-page-extractor, jpg-to-pdf), so
// 265 is the real count (TOOLS_META.length), not 267.
const POPULAR_TOOLS = [
  { slug: 'pdf-merger', icon: '📄', bn: 'পিডিএফ মার্জার', en: 'PDF Merger' },
  { slug: 'image-compressor', icon: '🖼️', bn: 'ছবি কম্প্রেসর', en: 'Image Compressor' },
  { slug: 'bmi-calculator', icon: '⚖️', bn: 'বিএমআই ক্যালকুলেটর', en: 'BMI Calculator' },
  { slug: 'qr-code-generator', icon: '🔳', bn: 'কিউআর কোড জেনারেটর', en: 'QR Code Generator' },
  { slug: 'word-counter', icon: '🔤', bn: 'শব্দ গণনা', en: 'Word Counter' },
  { slug: 'age-calculator', icon: '🎂', bn: 'বয়স ক্যালকুলেটর', en: 'Age Calculator' },
];

// Feature strip (desktop) / quick access (mobile). ONLY live features
// appear here — not-yet-live features are removed from the homepage
// face entirely (23 Nov 2026, AdSense cleanup), never shown as Coming
// Soon chips. Removed: Video Lessons, Study Routine (/routine is an
// honest placeholder page, linked from /about), Ranking, Certificate.
// They return when the features launch. No "কোর্স" tile: no /courses
// route or enrolment system exists (audit §9.2).
const FEATURES = [
  { icon: <BookIcon size={22} />, bn: 'প্রশ্নব্যাংক', en: 'Question Bank', to: '/library' },
  { icon: <QuizIcon />, bn: 'মডেল টেস্ট', en: 'Model Tests', to: '/exam' },
  { icon: <ChartIcon />, bn: 'ফলাফল বিশ্লেষণ', en: 'Result Analysis', to: '/progress' },
];

// Mobile quick access (mockup §9.2): every icon has a live destination.
const QUICK = [
  { icon: <BookIcon size={22} />, bn: 'বই', en: 'Books', to: '/library' },
  { icon: <QuizIcon />, bn: 'পরীক্ষা', en: 'Exams', to: '/exam' },
  { icon: <BriefcaseIcon size={22} />, bn: 'ক্যারিয়ার', en: 'Career', to: '/opportunities/career-guidance' },
  { icon: <ChartIcon />, bn: 'ক্যালকুলেটর', en: 'Calculator', to: '/life/calculators' },
  { icon: <GlobeIcon size={22} />, bn: 'টুলস', en: 'Tools', to: '/tools' },
  { icon: <BookIcon size={22} />, bn: 'প্রশ্নব্যাংক', en: 'Question Bank', to: '/library' },
  { icon: <ChartIcon />, bn: 'ফলাফল', en: 'Results', to: '/progress' },
];

// Everyday life services — the 9 live /life tools (LifeHubPage TOOLS).
const LIFE_TOOLS = [
  { to: '/life/budget', icon: '৳', bn: 'বাজেট পরিকল্পনা', en: 'Budget Planner' },
  { to: '/life/calculators', icon: '🧮', bn: 'ক্যালকুলেটর', en: 'Calculators' },
  { to: '/life/converters', icon: '⇄', bn: 'কনভার্টার', en: 'Converters' },
  { to: '/life/planner', icon: '🗓', bn: 'দৈনন্দিন পরিকল্পনা', en: 'Daily Planner' },
  { to: '/life/pdf-tools', icon: '📄', bn: 'পিডিএফ টুলস', en: 'PDF Tools' },
  { to: '/life/health', icon: '✚', bn: 'স্বাস্থ্য', en: 'Health' },
  { to: '/life/government', icon: '🏛', bn: 'সরকারি সেবা', en: 'Government Services' },
  { to: '/life/travel', icon: '✈', bn: 'ভ্রমণ', en: 'Travel' },
  { to: '/life/services', icon: '🗂', bn: 'সেবা নির্দেশিকা', en: 'Services Directory' },
];

// Opportunity tiles — every tile filters the live hub (?type= is
// supported by OpportunityHubPage). Career guidance is a live guide.
const OPP_TILES = [
  { to: '/opportunities?type=job', icon: '💼', bn: 'চাকরি', en: 'Jobs' },
  { to: '/opportunities?type=scholarship', icon: '🎓', bn: 'স্কলারশিপ', en: 'Scholarships' },
  { to: '/opportunities?type=internship', icon: '🧑‍💼', bn: 'ইন্টার্নশিপ', en: 'Internships' },
  { to: '/opportunities?type=freelance', icon: '💻', bn: 'ফ্রিল্যান্সিং', en: 'Freelancing' },
  { to: '/opportunities/career-guidance', icon: '🧭', bn: 'ক্যারিয়ার গাইড', en: 'Career Guide' },
];

const POPULAR = [
  { bn: 'BCS', to: '/jobs' },
  { bn: 'DU ভর্তি', en: 'DU Admission', to: '/admissions' },
  { bn: 'মেডিকেল ভর্তি', en: 'Medical Admission', to: '/admissions' },
  { bn: 'ব্যাংক চাকরি', en: 'Bank Jobs', to: '/jobs' },
  { bn: 'NTRCA', to: '/jobs' },
  { bn: 'অন্যান্য ভর্তি', en: 'Other Admissions', to: '/admissions' },
];

const POPULAR_MOBILE = [
  { bn: 'BCS', to: '/jobs' },
  { bn: 'Bank', to: '/jobs' },
  { bn: 'DU ভর্তি', en: 'DU Admission', to: '/admissions' },
  { bn: 'Medical', to: '/admissions' },
  { bn: 'Engineering', to: '/admissions' },
  { bn: 'Agriculture', to: '/admissions' },
];

// Admission tiles for the homepage ভর্তি প্রস্তুতি tab — the same real
// /admissions destinations as POPULAR / POPULAR_MOBILE above; nothing
// invented, every tile links to /admissions.
const ADMISSION_TILES = [
  { icon: '🎓', bn: 'DU ভর্তি', en: 'DU Admission', to: '/admissions' },
  { icon: '🏥', bn: 'মেডিকেল ভর্তি', en: 'Medical Admission', to: '/admissions' },
  { icon: '⚙️', bn: 'ইঞ্জিনিয়ারিং', en: 'Engineering', to: '/admissions' },
  { icon: '🌾', bn: 'কৃষি', en: 'Agriculture', to: '/admissions' },
  { icon: '📚', bn: 'অন্যান্য ভর্তি', en: 'Other Admissions', to: '/admissions' },
];

// Audit-verified library totals (24 Nov 2026 audit, §8.10): the
// live book list gives the book count, but chapter/question totals
// are not stored on the Book rows — these constants are the verified
// figures, never the mockup's invented numbers.
// VERIFIED_QUESTION_COUNT = 23,259 is effective AFTER the 25 Nov 2026
// NCTB crons (15:00 2nd-paper + 15:30 MCQ rebuild): the 24 Nov backup
// total is 23,346, and the crons remove 87 questions (39 exam-set +
// 48 MCQ-set). Before those crons run, the live total is still 23,346.
const VERIFIED_CHAPTER_COUNT = 2307;
const VERIFIED_QUESTION_COUNT = 23259;

function bnNum(n: number): string {
  return n.toLocaleString('bn-BD');
}

function formatBnDate(millis: number | null): string {
  if (!millis) return '';
  try {
    return new Date(millis).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return '';
  }
}

type ProgressData = {
  lessons: number;
  attempted: number;
  correct: number;
  quizAttempts: number;
  avgQuiz: number | null;
};

function ProgressRing({ percent, label }: { percent: number; label: string }) {
  const size = 120;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (percent / 100) * c;
  return (
    <div style={{ textAlign: 'center' }}>
      <svg width={size} height={size} role="img" aria-label={`${label}: ${percent}%`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E3E7EA" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#12766E"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fontSize="22" fontWeight="800" fill="#142B3B">
          {percent}%
        </text>
      </svg>
      <div style={{ fontSize: 13, color: 'var(--muted-ivory)', marginTop: 6 }}>{label}</div>
    </div>
  );
}

export default function HomePage() {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const location = useLocation();
  // Sections audit (24 Nov 2026): return here after sign-in.
  const back = loginState(location.pathname + location.search);
  const [searchText, setSearchText] = useState('');
  // Homepage tabs (owner 25 Nov 2026 17:40): the main content sections
  // live in five tabs below the hero; 'education' is the default.
  const [activeTab, setActiveTab] = useState<HomeTabId>('education');
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [progressLoading, setProgressLoading] = useState(false);
  const [progressError, setProgressError] = useState(false);
  const [books, setBooks] = useState<Book[] | null>(null);
  const [booksError, setBooksError] = useState(false);
  const [homeStats, setHomeStats] = useState<HomePayload | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[] | null>(null);
  const [opportunitiesError, setOpportunitiesError] = useState(false);
  const navigate = useNavigate();

  // Real progress only — signed in, from Firestore (progress + quiz
  // attempts). Nothing is shown when there is no data; signed out shows
  // a login prompt instead of a fake ring.
  useEffect(() => {
    if (!user) {
      setProgress(null);
      setProgressError(false);
      setProgressLoading(false);
      return;
    }
    let live = true;
    setProgressLoading(true);
    Promise.all([listSubjectProgress(user.uid), listQuizAttempts(user.uid)])
      .then(([rows, attempts]) => {
        if (!live) return;
        const lessons = rows.reduce((s, r) => s + r.lessonsRead.length, 0);
        const attempted = rows.reduce((s, r) => s + r.questionsAttempted, 0);
        const correct = rows.reduce((s, r) => s + r.questionsCorrect, 0);
        const avgQuiz = attempts.length > 0 ? attempts.reduce((s, a) => s + (a.percentage ?? 0), 0) / attempts.length : null;
        setProgress({ lessons, attempted, correct, quizAttempts: attempts.length, avgQuiz });
        setProgressLoading(false);
      })
      .catch(() => {
        if (!live) return;
        setProgressError(true);
        setProgressLoading(false);
      });
    return () => {
      live = false;
    };
  }, [user]);

  // Public catalogue data for the new sections: the prerendered
  // home payload FIRST (zero Firestore reads), the live published
  // book list only when there is no payload (one cached read, shared
  // with the library) — plus the verified opportunity listings
  // (Firestore Published, seed fallback — same source the hub itself
  // renders).
  useEffect(() => {
    let live = true;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    // One retry: the first attempt can fail transiently (cold
    // Firestore / slow connection). The shared cache is cleared on
    // rejection (content.ts), so the retry re-reads instead of
    // replaying the same failure. Only after the retry fails does
    // the widget show its error state.
    const loadBooks = (attempt: number) => {
      getAllPublishedBooksCached()
        .then((list) => {
          if (live) setBooks(list);
        })
        .catch(() => {
          if (!live) return;
          if (attempt === 0) {
            retryTimer = setTimeout(() => loadBooks(1), 2000);
          } else {
            setBooksError(true);
          }
        });
    };
    // P0-2: payload first — when present, no live book query runs at
    // all. The payload is fresh per deploy; the live path is fresh
    // per load.
    const payload = readHomePayload();
    if (payload) {
      setHomeStats(payload);
    } else {
      loadBooks(0);
    }
    loadHubOpportunities()
      .then(({ items }) => {
        if (live) setOpportunities(items);
      })
      .catch(() => {
        if (live) setOpportunitiesError(true);
      });
    return () => {
      live = false;
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, []);

  const accuracy = progress && progress.attempted > 0 ? Math.round((progress.correct / progress.attempted) * 100) : null;
  const hasProgress = progress !== null && (progress.lessons > 0 || progress.attempted > 0 || progress.quizAttempts > 0);

  // Live education counts — computed from the fetched books, never
  // hard-coded. educationType values are the loader's: Higher (অনার্স
  // ও মাস্টার্স), Technical, HSC, Madrasa, SSC. Class 1–5 / 6–8 have
  // no books (0) — the /class dashboards show the honest not-ready
  // state for them. P0-2: when the prerendered home payload is
  // present, the counts come from it (zero reads); the live path
  // below is the dev/preview fallback. `booksLoaded` is explicit —
  // the payload path never sets `books`, so `books === null` alone
  // cannot tell "loading" from "loaded via payload".
  const booksLoaded = homeStats !== null || books !== null;
  const countByType = (type: string) =>
    homeStats ? (homeStats.countsByType[type] ?? 0) : (books ?? []).filter((b) => b.educationType === type).length;
  const honoursCount = homeStats
    ? homeStats.honoursCount
    : (books ?? []).filter((b) => b.educationType === 'Higher' && b.program === 'Honours').length;
  const mastersCount = homeStats
    ? homeStats.mastersCount
    : (books ?? []).filter((b) => /master/i.test(b.program ?? '')).length;
  const totalBooks = homeStats ? homeStats.totalCount : books ? books.length : null;
  // Popular Books: payload entries carry id/title/questionCount (+
  // subtitle/meta fields); the live path keeps full Book rows. Both
  // render the same row (link /library/:id).
  const popularBooks = homeStats
    ? homeStats.popular
    : books
      ? [...books].sort((a, b) => b.questionCount - a.questionCount).slice(0, 8)
      : [];
  const latestOpportunities = opportunities
    ? [...opportunities].sort((a, b) => (b.publishedDateMillis ?? -1) - (a.publishedDateMillis ?? -1)).slice(0, 3)
    : [];

  const EDU_TILES: {
    to: string;
    icon: string;
    bn: string;
    en: string;
    descBn: string;
    descEn: string;
    count: number | null;
    notReady: boolean;
  }[] = [
    { to: '/class', icon: '📚', bn: 'Class 9 – Honours', en: 'Class 9 – Honours', descBn: 'নবম থেকে অনার্স — সব শ্রেণি এক জায়গায়', descEn: 'Class 9 to Honours — all classes in one place', count: null, notReady: false },
    { to: '/library?type=Madrasa', icon: '🕌', bn: 'Madrasa', en: 'Madrasa', descBn: 'মাদ্রাসা শিক্ষার বই', descEn: 'Madrasa education books', count: countByType('Madrasa'), notReady: false },
    { to: '/library?type=Technical', icon: '⚙️', bn: 'Technical', en: 'Technical', descBn: 'কারিগরি শিক্ষার বই', descEn: 'Technical education books', count: countByType('Technical'), notReady: false },
    { to: '/class/honours-masters', icon: '🎓', bn: 'Honours', en: 'Honours', descBn: 'অনার্সের বই', descEn: 'Honours books', count: honoursCount, notReady: false },
    { to: '/class/honours-masters', icon: '🎓', bn: 'Masters', en: 'Masters', descBn: 'মাস্টার্সের বই', descEn: 'Masters books', count: mastersCount, notReady: false },
    { to: '/library', icon: '📖', bn: 'Books', en: 'Books', descBn: 'ডিজিটাল লাইব্রেরি', descEn: 'Digital library', count: totalBooks, notReady: false },
    { to: '/library', icon: '▶️', bn: 'Lessons', en: 'Lessons', descBn: 'বইয়ের ভেতরে পাঠ', descEn: 'Lessons inside the books', count: null, notReady: false },
    { to: '/exam', icon: '📝', bn: 'Exams', en: 'Exams', descBn: 'মডেল টেস্ট ও MCQ পরীক্ষা', descEn: 'Model tests and MCQ exams', count: null, notReady: false },
  ];

  // Homepage tabs (owner 25 Nov 2026 17:40): the six tab panels.
  // Each panel reuses the homepage's own sections verbatim — nothing
  // new is invented here except the admissions panel, which reuses the
  // real /admissions destinations (ADMISSION_TILES above), and the
  // question-maker panel, which reuses the landing page's copy and
  // pricing data (HomeQuestionMakerPanel).
  const homePanels = {
    education: (
      <>
        {/* শিক্ষা কেন্দ্র — live categories with live counts. Class 1–5
            and 6–8 have no books: the /class dashboards show the honest
            not-ready state; no tile here claims stocked content. */}
        <section className="ev-rd-section" aria-label={t({ bn: 'শিক্ষা কেন্দ্র', en: 'Education Hub' })}>
          <div className="ev-rd-head">
            <h2>{t({ bn: '📖 শিক্ষা কেন্দ্র', en: '📖 Education Hub' })}</h2>
            <Link to="/class">{t({ bn: 'সব দেখুন →', en: 'See all →' })}</Link>
          </div>
          <p className="ev-rd-sub">
            {t({
              bn: 'নবম–দশম, এইচএসসি, মাদ্রাসা, টেকনিক্যাল, অনার্স — লাইব্রেরির আসল বই ও পাঠ।',
              en: 'Class 9–10, HSC, Madrasa, Technical, Honours — real books and lessons from the library.',
            })}
          </p>
          <div className="ev-rd-edu-grid">
            {EDU_TILES.map((tile) => (
              <Link key={tile.bn} to={tile.to} className="ev-rd-edu-tile">
                <span className="ev-rd-edu-icon" aria-hidden="true">
                  {tile.icon}
                </span>
                <strong>{t({ bn: tile.bn, en: tile.en })}</strong>
                <span>{t({ bn: tile.descBn, en: tile.descEn })}</span>
                {!booksError && tile.count !== null && tile.count > 0 ? (
                  <span className="ev-rd-edu-count">
                    {lang === 'bn' ? `${bnNum(tile.count)}টি বই` : `${tile.count} books`}
                  </span>
                ) : null}
                {tile.notReady ? (
                  <span>{t({ bn: 'কনটেন্ট প্রস্তুত হচ্ছে', en: 'Content being prepared' })}</span>
                ) : null}
              </Link>
            ))}
          </div>
          <p className="ev-rd-sub" style={{ marginTop: 10 }}>
            {t({
              bn: 'শ্রেণি ১–৫ ও ৬–৮-এর বই এখনো লাইব্রেরিতে আসেনি — সেগুলোর পাতায় সৎভাবে জানানো আছে।',
              en: 'Class 1–5 and 6–8 books have not reached the library yet — their pages say so honestly.',
            })}
          </p>
        </section>


        {/* জনপ্রিয় বই — REAL library books only, sorted by question
            count (the section says so). Text cards: no real covers
            exist, so no fake covers are ever rendered. */}
        <section className="ev-rd-section" aria-label={t({ bn: 'জনপ্রিয় বই', en: 'Popular Books' })}>
          <div className="ev-rd-head">
            <h2>{t({ bn: '🔥 জনপ্রিয় বই', en: '🔥 Popular Books' })}</h2>
            <Link to="/library">{t({ bn: 'সব বই →', en: 'All books →' })}</Link>
          </div>
          <p className="ev-rd-sub">
            {t({
              bn: 'প্রশ্নসংখ্যা অনুযায়ী সাজানো — লাইব্রেরির আসল বই।',
              en: 'Sorted by question count — real books from the library.',
            })}
          </p>
          {booksError ? (
            <p className="ev-rd-sub">
              {t({ bn: 'বইয়ের তালিকা লোড করা যায়নি — লাইব্রেরি থেকে দেখুন।', en: 'Could not load the book list — see the library.' })}{' '}
              <Link to="/library">{t({ bn: 'লাইব্রেরি →', en: 'Library →' })}</Link>
            </p>
          ) : !booksLoaded ? (
            // 28 Nov 2026 (AdSense-readiness): NO loading text — the
            // prerendered homepage shows this branch (the book payload
            // loads after SSR), so it must read as real content: a
            // direct link to the library. On the client the books
            // arrive in ~1s and replace it.
            <p className="ev-rd-sub">
              <Link to="/library">{t({ bn: 'লাইব্রেরি থেকে সব বই দেখুন →', en: 'See all books in the library →' })}</Link>
            </p>
          ) : totalBooks === 0 ? (
            <p className="ev-rd-sub">
              {t({ bn: 'এখনো কোনো বই নেই — লাইব্রেরি থেকে দেখুন।', en: 'No books yet — see the library.' })}{' '}
              <Link to="/library">{t({ bn: 'লাইব্রেরি →', en: 'Library →' })}</Link>
            </p>
          ) : (
            <div className="ev-rd-books">
              {popularBooks.map((b) => (
                <article key={b.id} className="ev-rd-book">
                  <h3>
                    <Link to={`/library/${b.id}`}>{b.title}</Link>
                  </h3>
                  <p>{[b.classLevel, b.department, b.subject].filter(Boolean).join(' · ')}</p>
                  <span className="ev-rd-book-meta">
                    {lang === 'bn'
                      ? `${bnNum(b.chapterCount ?? 0)}টি অধ্যায় · ${bnNum(b.questionCount)}টি প্রশ্ন`
                      : `${b.chapterCount ?? 0} chapters · ${b.questionCount} questions`}
                  </span>
                </article>
              ))}
            </div>
          )}
        </section>


      </>
    ),
    // Question Maker tab (owner 25 Nov 2026 18:26) — entry point
    // only: intro + real key points + CTA into the full generator
    // at /question-maker. The builder itself is NOT embedded here.
    'question-maker': <HomeQuestionMakerPanel />,
    // Job Preparation section — preserved verbatim (Step 5 regrouping).
    jobs: <JobsSection />,
    admissions: (
      <>
        <section className="ev-rd-section" aria-label={t({ bn: 'ভর্তি প্রস্তুতি', en: 'Admission Preparation' })}>
          <div className="ev-rd-head">
            <h2>{t({ bn: '🎓 ভর্তি প্রস্তুতি', en: '🎓 Admission Preparation' })}</h2>
            <Link to="/admissions">{t({ bn: 'সব দেখুন →', en: 'See all →' })}</Link>
          </div>
          <p className="ev-rd-sub">
            {t({
              bn: 'বিশ্ববিদ্যালয়, মেডিকেল, ইঞ্জিনিয়ারিং, কৃষি ও অন্যান্য — ভর্তি পরীক্ষার প্রস্তুতি এক জায়গায়।',
              en: 'University, Medical, Engineering, Agriculture and more — admission preparation in one place.',
            })}
          </p>
          <div className="ev-rd-opp-tiles">
            {ADMISSION_TILES.map((tile) => (
              <Link key={tile.bn} to={tile.to} className="ev-rd-opp-tile">
                <span aria-hidden="true">{tile.icon}</span>
                {t({ bn: tile.bn, en: tile.en })}
              </Link>
            ))}
          </div>
          <div style={{ marginTop: 14 }}>
            <Link to="/admissions" className="ev-btn ev-btn-primary">
              {t({ bn: 'ভর্তি প্রস্তুতি নিন →', en: 'Prepare for admission →' })}
            </Link>
          </div>
        </section>
      </>
    ),
    opportunities: (
      <>
        {/* সুযোগ কেন্দ্র — real listings only (7 verified). Tiles filter
            the live hub; the list below shows the latest listings with
            their real dates. The circulars collection is empty, so no
            circular is ever invented here. */}
        <section className="ev-rd-section" aria-label={t({ bn: 'সুযোগ কেন্দ্র', en: 'Opportunity Hub' })}>
          <div className="ev-rd-head">
            <h2>{t({ bn: '💼 সুযোগ কেন্দ্র', en: '💼 Opportunity Hub' })}</h2>
            <Link to="/opportunities">{t({ bn: 'সব দেখুন →', en: 'See all →' })}</Link>
          </div>
          <p className="ev-rd-sub">
            {t({
              bn: 'যাচাইকৃত চাকরি, স্কলারশিপ, ইন্টার্নশিপ ও ফ্রিল্যান্সিং সুযোগ — প্রতিটি অফিসিয়াল উৎস থেকে যাচাই করা।',
              en: 'Verified jobs, scholarships, internships and freelancing opportunities — each verified from its official source.',
            })}
          </p>
          <div className="ev-rd-opp-tiles">
            {OPP_TILES.map((tile) => (
              <Link key={tile.bn} to={tile.to} className="ev-rd-opp-tile">
                <span aria-hidden="true">{tile.icon}</span>
                {t({ bn: tile.bn, en: tile.en })}
              </Link>
            ))}
          </div>
          {opportunitiesError ? (
            <p className="ev-rd-sub">
              {t({ bn: 'সুযোগের তালিকা লোড করা যায়নি — সুযোগ হাব থেকে দেখুন।', en: 'Could not load the opportunity list — see the Opportunity Hub.' })}{' '}
              <Link to="/opportunities">{t({ bn: 'সুযোগ হাব →', en: 'Opportunity Hub →' })}</Link>
            </p>
          ) : latestOpportunities.length > 0 ? (
            <ul className="ev-rd-opp-list">
              {latestOpportunities.map((o) => (
                <li key={o.docId}>
                  <Link to={`/opportunities/${o.docId}`}>{lang === 'bn' ? o.titleBn : o.titleEn}</Link>
                  <span className="ev-rd-opp-meta">
                    {lang === 'bn' ? o.organizationBn : o.organizationEn}
                    {o.deadlineMillis ? ` · ${t({ bn: 'শেষ তারিখ', en: 'Deadline' })}: ${formatBnDate(o.deadlineMillis)}` : ''}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </section>


      </>
    ),
    services: (
      <>
        {/* AI টুলস ও সহায়তা — the WORKING tools live at
            /ai-assistant (live AI chat + calculators, letters, CV,
            budget — connected since 28 Nov 2026). No demo link here. */}
        <section className="ev-rd-section" aria-label={t({ bn: 'AI টুলস ও সহায়তা', en: 'AI Tools & Assistance' })}>
          <div className="ev-rd-ai">
            <h2>{t({ bn: '🤖 AI টুলস ও সহায়তা', en: '🤖 AI Tools & Assistance' })}</h2>
            <p>
              {t({
                bn: 'AI সহায়ক এখনই ব্যবহার করতে পারেন — হিসাব, চিঠি-আবেদন, সিভি, বাজেট ও দরকারি টুল।',
                en: 'You can use the AI Assistant right now — calculators, letters and applications, CV, budget and daily tools.',
              })}
            </p>
            <div className="ev-rd-ai-actions">
              <Link to="/ai-assistant" className="ev-btn ev-btn-primary">
                {t({ bn: 'AI সহায়ক ব্যবহার করুন →', en: 'Use the AI Assistant →' })}
              </Link>
              <Link to="/jobs/bcs/practice/english" className="ev-btn" style={{ textDecoration: 'none', background: 'var(--card)', borderColor: 'var(--line-strong)' }}>
                {t({ bn: 'বিসিএস ইংরেজি অনুশীলন (ফ্রি)', en: 'BCS English practice (free)' })}
              </Link>
            </div>
          </div>
        </section>


        {/* দৈনন্দিন সেবা সমূহ — the 9 live /life tools. */}
        <section className="ev-rd-section" aria-label={t({ bn: 'দৈনন্দিন সেবা সমূহ', en: 'Everyday Services' })}>
          <div className="ev-rd-head">
            <h2>{t({ bn: '🛠 দৈনন্দিন সেবা সমূহ', en: '🛠 Everyday Services' })}</h2>
            <Link to="/life">{t({ bn: 'সব দেখুন →', en: 'See all →' })}</Link>
          </div>
          <p className="ev-rd-sub">
            {t({ bn: 'স্বাস্থ্য, ক্যালকুলেটর, ডকুমেন্টসহ দৈনন্দিন প্রয়োজনীয় সেবা — সব বিনামূল্যে।', en: 'Everyday services including health, calculators and documents — all free.' })}
          </p>
          <div className="ev-rd-life-grid">
            {LIFE_TOOLS.map((tool) => (
              <Link key={tool.to} to={tool.to} className="ev-rd-life-tile">
                <span aria-hidden="true">{tool.icon}</span>
                {t({ bn: tool.bn, en: tool.en })}
              </Link>
            ))}
          </div>
        </section>


      </>
    ),
  };

  function runSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchText.trim();
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
  }

  return (
    <>
      {/* Announcement ticker (owner 25 Nov 2026 10:03) — REPLACES the
          ayah bar (HeroGreeting, deleted): the scrolling banner sits
          flush directly below the nav (the shell's 28px top padding
          made the white gap above the band) and spans the full
          viewport width, not the shell's 1240px. Home-only: only
          HomePage mounts it. */}
      <AnnouncementTicker />
      <PageShell titleBn="হোম" titleEn="Home" wide hideHomeLink hideTitle maxWidth={1240}>
        {/* Mobile search bar (≤768px, mockup). Now a REAL global search:
            it goes to /search, which searches books + jobs + opportunities
            + life services — not book titles only. */}
        <form className="ev-home-msearch" onSubmit={runSearch} role="search">
          <label htmlFor="ev-home-msearch" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
            {t({ bn: 'খুঁজুন', en: 'Search' })}
          </label>
          <input
            id="ev-home-msearch"
            type="search"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder={t({ bn: 'বই, চাকরি, স্কলারশিপ, সেবা খুঁজুন…', en: 'Search books, jobs, scholarships, services…' })}
          />
          <button type="submit" aria-label={t({ bn: 'খুঁজুন', en: 'Search' })}>
            <SearchIcon />
          </button>
        </form>
        {/* Phase 4: instant live book results (mobile). The dropdown
            only appears once ≥2 characters are typed; the compact
            index loads lazily on first typing, 0 Firestore reads. */}
        <div className="ev-home-live-results-mobile">
          <HomeBookSearchResults query={searchText} books={books} />
        </div>

        {/* Hero: light gradient + wordmark, NO photos (see file header). */}
        <section className="ev-home-hero" aria-label={t({ bn: 'Eduvelto', en: 'Eduvelto' })}>
          <p className="ev-home-hero-eyebrow">
            <span>{t({ bn: 'নবম শ্রেণি থেকে অনার্স — সম্পূর্ণ শিক্ষা প্ল্যাটফর্ম', en: 'A complete education platform — from Class 9 to Honours' })}</span>
          </p>
          <h1 className="ev-home-wordmark" aria-label="Eduvelto — Learn • Grow • Achieve">
            <span className="ev-home-wordmark-edu">Edu</span>
            <span className="ev-home-wordmark-velto">velto</span>{' '}
            <span className="ev-home-wordmark-tag">Learn • Grow • Achieve</span>
          </h1>
          <p className="ev-home-hero-line">{t({ bn: 'শেখো, প্রস্তুতি নাও, সফল হও...', en: 'Learn, prepare, succeed...' })}</p>
          <p>
            <span className="ev-home-hero-badge">{t({ bn: 'স্বপ্ন পূরণের পথে Eduvelto সাথেই আছে!', en: 'Eduvelto is with you on the path to your dreams!' })}</span>
          </p>
          {/* Desktop Global Search (mockup): the same real search as
              the mobile box — books, jobs, opportunities, services. */}
          <form className="ev-rd-hero-search" onSubmit={runSearch} role="search">
            <label htmlFor="ev-rd-hero-search" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
              {t({ bn: 'বই, চাকরি, স্কলারশিপ, সেবা খুঁজুন', en: 'Search books, jobs, scholarships, services' })}
            </label>
            <input
              id="ev-rd-hero-search"
              type="search"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder={t({ bn: 'বই, চাকরি, স্কলারশিপ বা যেকোনো কিছু খুঁজুন…', en: 'Search books, jobs, scholarships or anything…' })}
            />
            <button type="submit">{t({ bn: 'খুঁজুন', en: 'Search' })}</button>
          </form>
          {/* Phase 4: instant live book results (desktop hero). Same
              lazy compact index as the mobile box — 0 Firestore reads
              per keystroke; results link to the book pages only. */}
          <div className="ev-home-live-results-desktop">
            <HomeBookSearchResults query={searchText} books={books} />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 18 }}>
            <Link to={user ? '/dashboard' : '/register'} className="ev-btn ev-btn-gold" style={{ textDecoration: 'none' }}>
              {t({ bn: 'এখনই শুরু করুন →', en: 'Start now →' })}
            </Link>
            <Link to="/about" className="ev-btn" style={{ textDecoration: 'none', background: 'var(--card)', borderColor: 'var(--line-strong)' }}>
              {t({ bn: 'জানুন Eduvelto সম্পর্কে', en: 'About Eduvelto' })}
            </Link>
            {/* 28 Nov 2026 (AdSense-readiness): direct Tools Hub link
                in the hero — the hub had no link anywhere on the
                homepage or in the header. 265 free tools (28 Nov 2026
                audit count; TOOLS_META.length). */}
            <Link to="/tools" className="ev-btn" style={{ textDecoration: 'none', background: 'var(--card)', borderColor: 'var(--line-strong)' }}>
              {t({ bn: '🛠 ২৬৫টি ফ্রি টুল', en: '🛠 265 free tools' })}
            </Link>
          </div>
        </section>

        {/* Free Tools Hub (28 Nov 2026 AdSense-readiness): a prominent
            tools section at the very top of the homepage — the hub
            existed at /tools but had no link anywhere on the homepage
            or in the header. 265 free tools (28 Nov 2026 audit count;
            TOOLS_META.length). Popular-tool cards link straight to
            their /tools/<slug> pages. */}
        <section className="ev-rd-section" aria-label={t({ bn: 'ফ্রি টুলস', en: 'Free Tools' })}>
          <div className="ev-rd-head">
            <h2>{t({ bn: '🛠 ২৬৫টি ফ্রি টুল', en: '🛠 265 free tools' })}</h2>
            <Link to="/tools">{t({ bn: 'সব টুল দেখুন →', en: 'See all tools →' })}</Link>
          </div>
          <p className="ev-rd-sub">
            {t({
              bn: 'পিডিএফ, ছবি, ক্যালকুলেটর, কিউআর কোড — দৈনন্দিন কাজের সব টুল, সম্পূর্ণ ফ্রি, লগইন ছাড়াই।',
              en: 'PDF, images, calculators, QR codes — every everyday tool, completely free, no login needed.',
            })}
          </p>
          <div className="ev-rd-opp-tiles">
            {POPULAR_TOOLS.map((tool) => (
              <Link key={tool.slug} to={`/tools/${tool.slug}`} className="ev-rd-opp-tile">
                <span aria-hidden="true">{tool.icon}</span>
                {t({ bn: tool.bn, en: tool.en })}
              </Link>
            ))}
          </div>
        </section>

        {/* Top banner ad — home only (ads placement plan 22 Nov 2026).
            Renders nothing until AdSense is configured; in preview it
            shows a labelled placeholder. */}
        <AdSlot placement="top-banner" />

        {/* Six hub cards (owner brief §4 + mockups). */}
        <section aria-label={t({ bn: 'Eduvelto-র প্রধান সেবা সমূহ', en: "Eduvelto's main services" })}>
          <div className="ev-rd-hubs">
            {HUBS.map((h) => (
              <Link key={h.id} to={h.to} className={`ev-rd-hub ${h.tint}`}>
                <span className="ev-rd-hub-icon" aria-hidden="true">
                  {h.icon}
                </span>
                <h3>{t({ bn: h.titleBn, en: h.titleEn })}</h3>
                <p>{t({ bn: h.descBn, en: h.descEn })}</p>
                {h.noteBn ? <span className="ev-rd-hub-note">{t({ bn: h.noteBn, en: h.noteEn })}</span> : null}
                <span className="ev-rd-hub-cta">{t({ bn: 'বিস্তারিত দেখুন →', en: 'See details →' })}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Four section cards — preserved verbatim (21 Nov redesign).
            Sections audit (24 Nov 2026): the WHOLE card is the link —
            the owner decided 21 Nov that clicking anywhere on a big card
            goes inside (no separate button). The old <article> + inner
            CTA <Link> meant tapping the card body did nothing on the
            owner's phone, so he could not reach Job Preparation from
            here. The CTA is now a <span> styled like the button. */}
        <section className="ev-rd-section" aria-label={t({ bn: 'প্রধান বিভাগ', en: 'Main sections' })}>
          <div className="ev-home-sections">
            {SECTIONS.map((s) => (
              <Link key={s.id} to={s.to} className={`ev-home-card ${s.tint}`}>
                {s.badgeBn ? (
                  <span className={`ev-home-card-badge${s.badgeMobileOnly ? ' ev-home-card-badge-mobile' : ''}`}>
                    {t({ bn: s.badgeBn, en: s.badgeEn })}
                  </span>
                ) : null}
                <span className="ev-home-card-icon" aria-hidden="true">
                  {s.icon}
                </span>
                <h3>{t({ bn: s.titleBn, en: s.titleEn })}</h3>
                <p>{t({ bn: s.descBn, en: s.descEn })}</p>
                <span className="ev-btn ev-home-card-cta">
                  {t({ bn: s.ctaBn, en: s.ctaEn })}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Feature strip (desktop) / quick access (mobile). */}
        <section className="ev-rd-section" aria-label={t({ bn: 'ফিচার', en: 'Features' })}>
          <div className="ev-home-strip">
            {FEATURES.map((f) => (
              <div key={f.bn} className="ev-home-strip-item">
                <Link to={f.to} className="ev-home-strip-link">
                  <span aria-hidden="true">{f.icon}</span>
                  <span>{t({ bn: f.bn, en: f.en })}</span>
                </Link>
              </div>
            ))}
            <div className="ev-home-strip-item ev-home-strip-more">
              <Link to="/about" className="ev-home-strip-link">
                <span>{t({ bn: 'আরও ফিচার দেখুন →', en: 'See more features →' })}</span>
              </Link>
            </div>
          </div>

          <div className="ev-home-quick">
            <div className="ev-home-panel-head">
              <h2>{t({ bn: 'দ্রুত অ্যাক্সেস', en: 'Quick Access' })}</h2>
              <Link to="/about">{t({ bn: 'সব দেখুন →', en: 'See all →' })}</Link>
            </div>
            <div className="ev-home-quick-grid">
              {QUICK.map((f) => (
                <div key={`${f.bn}-${f.to}`} className="ev-home-quick-tile">
                  <Link to={f.to} className="ev-home-quick-link">
                    <span aria-hidden="true">{f.icon}</span>
                    <span>{t({ bn: f.bn, en: f.en })}</span>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Homepage tabs (owner 25 Nov 2026 17:40): the main content
            sections live in six tabs — education, question maker,
            job preparation, admission preparation, opportunity hub,
            AI & services.
            Hero, ticker, search, hubs, section cards and the feature
            strip stay above; the Daily Quiz, stats, panels, founder
            message and footer banner stay below, always visible. */}
        <HomeTabs tabs={HOME_TABS} activeId={activeTab} onActiveChange={setActiveTab} panels={homePanels} />

        {/* Phase 4: Daily 5-Question Free Quiz — no login. Draws
            ONLY from the 35 verified public BCS English questions
            (see src/lib/dailyQuiz.ts); never a real exam or a mock. */}
        <DailyQuizWidget />

        {/* Stats — REAL numbers only (see file header). Hidden when
            the book list did not load: an offline browser can resolve
            the Firestore query from an empty local cache, which would
            otherwise render a false "০ বই" (verified 24 Nov 2026). */}
        {totalBooks !== null && totalBooks > 0 && opportunities ? (
          <section className="ev-rd-stats" aria-label={t({ bn: 'Eduvelto-র পরিসংখ্যান', en: 'Eduvelto in numbers' })}>
            <div className="ev-rd-stat">
              <strong>{bnNum(totalBooks)}</strong>
              <span>{t({ bn: 'বই', en: 'Books' })}</span>
            </div>
            <div className="ev-rd-stat">
              <strong>{bnNum(VERIFIED_CHAPTER_COUNT)}</strong>
              <span>{t({ bn: 'অধ্যায়', en: 'Chapters' })}</span>
            </div>
            <div className="ev-rd-stat">
              <strong>{bnNum(VERIFIED_QUESTION_COUNT)}</strong>
              <span>{t({ bn: 'প্রশ্ন', en: 'Questions' })}</span>
            </div>
            <div className="ev-rd-stat">
              <strong>{bnNum(opportunities.length)}</strong>
              <span>{t({ bn: 'যাচাইকৃত সুযোগ', en: 'Verified opportunities' })}</span>
            </div>
          </section>
        ) : null}

        {/* Three panels (desktop) / stacked panels (mobile). */}
        <section className="ev-home-panels ev-rd-section" aria-label={t({ bn: latestOpportunities.length > 0 ? 'আপডেট, অগ্রগতি ও জনপ্রিয়' : 'অগ্রগতি ও জনপ্রিয়', en: latestOpportunities.length > 0 ? 'Updates, progress and popular' : 'Progress and popular' })}>
          {/* সর্বশেষ আপডেট — REAL dated items only: the latest verified
              opportunity listings. The whole panel is hidden when the
              list is empty — no empty state is shown (AdSense-review
              cleanup, 28 Nov 2026). */}
          {latestOpportunities.length > 0 ? (
          <div className="ev-home-panel">
            <div className="ev-home-panel-head">
              <h2>
                <StarIcon size={18} /> {t({ bn: 'সর্বশেষ আপডেট', en: 'Latest Updates' })}
              </h2>
              <Link to="/opportunities">{t({ bn: 'সব দেখুন →', en: 'See all →' })}</Link>
            </div>
            <ul className="ev-rd-updates">
              {latestOpportunities.map((o) => (
                <li key={o.docId}>
                  <span className="ev-rd-update-date" aria-hidden="true">
                    {o.publishedDateMillis ? formatBnDate(o.publishedDateMillis) : '—'}
                  </span>
                  <div>
                    <Link to={`/opportunities/${o.docId}`}>{lang === 'bn' ? o.titleBn : o.titleEn}</Link>
                    <span>{t({ bn: 'সুযোগ হাব', en: 'Opportunity Hub' })}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          ) : null}

          {/* আপনার পড়াশোনার অগ্রগতি — real data only. */}
          <div className="ev-home-panel">
            <div className="ev-home-panel-head">
              <h2>{t({ bn: 'আপনার পড়াশোনার অগ্রগতি', en: 'Your Study Progress' })}</h2>
              {user && hasProgress ? <Link to="/progress">{t({ bn: 'বিস্তারিত →', en: 'Details →' })}</Link> : null}
            </div>
            {!user ? (
              <div>
                <p style={{ color: 'var(--muted-ivory)', margin: '6px 0 12px', fontSize: 14, lineHeight: 1.7 }}>
                  {t({ bn: 'লগইন করলে আপনার পড়াশোনার অগ্রগতি এখানে দেখা যাবে।', en: 'Log in to see your study progress here.' })}
                </p>
                <Link to="/login" state={back} className="ev-btn ev-btn-primary ev-btn-sm">
                  {t({ bn: 'লগইন করুন', en: 'Log in' })}
                </Link>
              </div>
            ) : progressLoading ? (
              <p style={{ color: 'var(--muted-ivory)', margin: '6px 0 0', fontSize: 14 }}>{t({ bn: 'অগ্রগতি লোড হচ্ছে…', en: 'Loading progress…' })}</p>
            ) : progressError ? (
              <p style={{ color: 'var(--error)', margin: '6px 0 0', fontSize: 14 }}>
                {t({ bn: 'অগ্রগতি লোড করা যায়নি — পাতাটি রিফ্রেশ করে আবার চেষ্টা করুন।', en: 'Could not load progress — please refresh and try again.' })}
              </p>
            ) : !hasProgress ? (
              <div>
                <p style={{ color: 'var(--muted-ivory)', margin: '6px 0 12px', fontSize: 14, lineHeight: 1.7 }}>
                  {t({ bn: 'এখনো কোনো অগ্রগতি নেই — পাঠ পড়ে বা কুইজ দিয়ে শুরু করুন।', en: 'No progress yet — start by reading a lesson or taking a quiz.' })}
                </p>
                <Link to="/library" className="ev-btn ev-btn-primary ev-btn-sm">
                  {t({ bn: 'লাইব্রেরি দেখুন', en: 'Browse library' })}
                </Link>
              </div>
            ) : (
              <div className="ev-home-progress-body">
                {accuracy !== null ? (
                  <ProgressRing percent={accuracy} label={t({ bn: 'অনুশীলন প্রশ্নের সঠিক হার', en: 'Practice accuracy' })} />
                ) : null}
                <ul className="ev-home-progress-rows">
                  <li>
                    <span>{t({ bn: 'পাঠ সম্পন্ন', en: 'Lessons completed' })}</span>
                    <strong>
                      {lang === 'bn' ? `${progress.lessons}টি` : `${progress.lessons}`}
                    </strong>
                  </li>
                  <li>
                    <span>{t({ bn: 'প্রশ্নের উত্তর', en: 'Questions answered' })}</span>
                    <strong>
                      {lang === 'bn' ? `${progress.attempted}টি` : `${progress.attempted}`}
                      {progress.attempted > 0 ? ` (${t({ bn: 'সঠিক', en: 'correct' })} ${progress.correct})` : ''}
                    </strong>
                  </li>
                  <li>
                    <span>{t({ bn: 'কুইজ প্রচেষ্টা', en: 'Quiz attempts' })}</span>
                    <strong>
                      {lang === 'bn' ? `${progress.quizAttempts}টি` : `${progress.quizAttempts}`}
                      {progress.avgQuiz !== null ? ` · ${t({ bn: 'গড়', en: 'avg' })} ${Math.round(progress.avgQuiz)}%` : ''}
                    </strong>
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* জনপ্রিয় বিভাগ (desktop) / জনপ্রিয় পরীক্ষা (mobile). */}
          <div className="ev-home-panel">
            <div className="ev-home-panel-head">
              <h2 className="ev-home-popular-desktop">{t({ bn: 'জনপ্রিয় বিভাগ', en: 'Popular Categories' })}</h2>
              <h2 className="ev-home-popular-mobile">{t({ bn: 'জনপ্রিয় পরীক্ষা', en: 'Popular Exams' })}</h2>
              <Link to="/exam">{t({ bn: 'সব দেখুন →', en: 'See all →' })}</Link>
            </div>
            <div className="ev-home-popular-grid">
              {POPULAR.map((p) => (
                <Link key={p.bn} to={p.to} className="ev-home-popular-tile">
                  {t({ bn: p.bn, en: p.en ?? p.bn })}
                </Link>
              ))}
            </div>
            <div className="ev-home-popular-row">
              {POPULAR_MOBILE.map((p) => (
                <Link key={p.bn} to={p.to} className="ev-home-popular-tile">
                  {t({ bn: p.bn, en: p.en ?? p.bn })}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Founder message — founder-profile brand item (23 Nov 2026).
            Copy is the owner-approved draft; photo + /founder link mirror
            the About page founder section. No DOB/age, no private-tuition
            line, no mock/AI-teacher claims. */}
        <section
          className="ev-card"
          aria-label={t({ bn: 'প্রতিষ্ঠাতার বার্তা', en: "Founder's message" })}
          style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start', padding: 20, marginTop: 24, background: 'var(--card)' }}
        >
          <img
            src="/founder-photo.jpg"
            alt="Ali Hasan Mohammed Mizan, Founder & CEO, Eduvelto"
            loading="lazy"
            decoding="async"
            style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: '50%', border: '3px solid #F1B308' }}
          />
          <div style={{ flex: '1 1 320px', minWidth: 260 }}>
            <h2 style={{ margin: '0 0 8px', fontSize: 20 }}>{t({ bn: 'প্রতিষ্ঠাতার বার্তা', en: "Founder's message" })}</h2>
            <p style={{ lineHeight: 1.7, margin: 0 }}>
              {t({
                bn: 'আমি Eduvelto গড়েছি একটাই বিশ্বাস থেকে — মানসম্মত শিক্ষা বাংলাদেশের প্রত্যেক শিক্ষার্থীর জন্য বিনামূল্যে পৌঁছে দেওয়া উচিত। আমি নিজে একজন শিক্ষক ও শিক্ষার্থী — আমি জানি, ভালো পড়ার সুযোগ পেতে অনেকের কত কষ্ট হয়। তাই পাঠ, পরীক্ষা, ডিজিটাল লাইব্রেরি আর পড়ার পরিকল্পনা — সব এক জায়গায়, সম্পূর্ণ বিনামূল্যে। শেখো, এগিয়ে যাও, স্বপ্ন গড়ো।',
                en: 'I built Eduvelto from a single belief: quality education should be free and within reach of every student in Bangladesh. I am a teacher and a student myself — I know how hard it can be to get a fair chance to learn. So lessons, exams, a digital library and smart study planning — all in one place, completely free. Learn, grow, achieve.',
              })}
            </p>
            <p style={{ margin: '12px 0 0', fontWeight: 600 }}>
              {t({ bn: '— আলী হাসান মোহাম্মদ মিজান, প্রতিষ্ঠাতা ও CEO, Eduvelto', en: '— Ali Hasan Mohammed Mizan, Founder & CEO, Eduvelto' })}
            </p>
            <p style={{ margin: '8px 0 0' }}>
              <Link to="/founder">{t({ bn: 'সম্পূর্ণ প্রতিষ্ঠাতা প্রোফাইল →', en: 'Full founder profile →' })}</Link>
            </p>
          </div>
        </section>

        {/* Footer banner (mockup). */}
        <section className="ev-home-banner" aria-label={t({ bn: 'Eduvelto', en: 'Eduvelto' })}>
          <span aria-hidden="true" style={{ color: 'var(--amber)' }}>
            <TrophyIcon size={34} />
          </span>
          <div>
            <h2>{t({ bn: 'Eduvelto — একটি প্ল্যাটফর্ম, অসীম সম্ভাবনা!', en: 'Eduvelto — one platform, endless possibilities!' })}</h2>
            <p>{t({ bn: 'শিক্ষা হোক সহজ, প্রস্তুতি হোক স্মার্ট, সফলতা হোক নিশ্চিত।', en: 'Make learning easy, preparation smart, success certain.' })}</p>
          </div>
          <Link to={user ? '/dashboard' : '/register'} className="ev-btn ev-btn-gold ev-home-banner-cta">
            {t({ bn: 'এখনই শুরু করুন →', en: 'Start now →' })}
          </Link>
        </section>
      </PageShell>
    </>
  );
}
