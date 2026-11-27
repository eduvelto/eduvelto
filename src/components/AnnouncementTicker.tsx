// Eduvelto — homepage announcement ticker (owner 25 Nov 2026 10:03).
//
// REPLACES the ayah bar (components/HeroGreeting.tsx, deleted the
// same day — owner: "takbe na"). It sits in the ayah bar's old spot:
// the full-width strip directly below the Navigation Menu on the
// homepage (HomePage mounts this component, and only HomePage).
//
// CONTENT — ALL of our real features + our running offers + the
// ayat ONLY (owner 25 Nov 18:01: every app feature in the scroll
// banner). Feature items link to their real pages; the library item
// carries the live counts (609 books, 2,307 chapters, 23,259
// questions — update them if the library grows). Never any other
// site's numbers or claims: their "১২,০০০+ শিক্ষক / ৫ লক্ষ+ প্রশ্ন"
// stats are THEIRS, not ours, and appear nowhere. NEVER name another
// website or competitor anywhere (owner 25 Nov 17:28). The ৭০%
// offer stands alone; the comparison price lives ONLY in the pricing
// table, labelled generically (never as our former price).
//
// AYAT (Surah Al-Alaq, ayah 1) — Arabic ONLY (owner 25 Nov 18:01):
// the ayat item renders the Arabic text once, with no Bangla or
// English translation and no attribution. The Arabic string was
// supplied by the owner 25 Nov 10:03; copy character for character,
// NEVER retype from memory and never pick a different ayat.
// Respectful display (standing rule): SLOW marquee (480s loop —
// see the timing note below), no flashing, no fast movement, pause
// on hover; the Arabic letters/harakat are never distorted — the
// marquee moves the track with a rigid translateX only (no skew,
// scale or rotate on the text). Under prefers-reduced-motion the
// track stops and wraps statically, so nothing moves at all.
//
// TOOLS IN THE TICKER (owner 27 Nov 2026: every feature in the
// scroll banner, one by one) — all 140 LIVE tools appear below as
// one item each (tool title in bn/en, linking to /tools/<slug>),
// derived from toolsMeta at runtime so a new tool appears here
// automatically. EXCLUDED: lab-test-result-checker — built but NOT
// live yet (MBBS review pending); add it at its deploy by deleting
// the filter in TICKER_TOOL_ITEMS below. NOTE: ~107 of the 140
// tool pages currently show the honest "still being built" box
// (only 25 have an interactive UI + 8 aliases render real pages);
// the ticker links to their real pages either way, and the box
// says so plainly.
//
// LOOP TIMING — the loop is 480s per copy, NOT the old 80s. The
// old 80s covered 16 items (~600 bn chars, ~74px/s). The 140
// tool titles add ~2,860 bn chars (total ~3,460), so the same
// reading pace needs 80s x (3,460/601) = ~461s, plus per-item
// padding/separator width = ~488s; 480s keeps the original pace
// (same px/s, each item readable as long as before). Slowing by
// item COUNT instead (80s x 156/16 = 780s) would halve the pace
// for no reason — the tool titles are much shorter than the old
// feature lines (avg 20 chars vs 38). The CSS animation duration
// and the tests below pin 480s; change all three together.
//
// STATIC content — no Firestore reads (Spark rule for public pages).
// The offer + feature items link to our own pages; the ayat item is
// not a link.
import type { Lang } from '../i18n/strings';
import { useLanguage } from '../i18n/LanguageContext';
import { TOOLS_META } from '../lib/toolsMeta';

/** Ayat — Arabic ONLY (owner 25 Nov 18:01). Verbatim from the owner
 * (25 Nov 2026 10:03); never retype, never pick another ayat. The
 * translation/attribution constants were removed when the Arabic-only
 * rule was given — nothing renders them. */
export const TICKER_AYAT_AR = 'اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ';

export type AnnouncementTickerItem =
  | { id: 'ayat'; kind: 'ayat' }
  | { id: string; kind: 'offer'; bn: string; en: string; href: string }
  | { id: string; kind: 'feature'; bn: string; en: string; href: string };

/** All 140 LIVE tools, one ticker item each (owner 27 Nov 2026).
 *  Derived from toolsMeta at runtime — a new tool appears here
 *  automatically, and a title change flows through. EXCLUDED:
 *  lab-test-result-checker (built, not live yet — MBBS review
 *  pending); delete the filter at its deploy. Item text is the
 *  tool's own bn/en title; href is its real /tools/<slug> page. */
export const TICKER_TOOL_ITEMS: Extract<
  AnnouncementTickerItem,
  { kind: 'feature' }
>[] = TOOLS_META.filter((t) => t.slug !== 'lab-test-result-checker').map((t) => ({
  id: `tool-${t.slug}`,
  kind: 'feature',
  bn: t.titleBn,
  en: t.titleEn,
  href: `/tools/${t.slug}`,
}));

/** Rotation order: the ayat leads, then our offers, then every real
 * feature (owner 25 Nov 18:01), then all 140 live tools (owner
 * 27 Nov 2026) — each links to its page. Feature items are real
 * pages only — no invented features, no invented numbers. */
export const ANNOUNCEMENT_TICKER_ITEMS: AnnouncementTickerItem[] = [
  { id: 'ayat', kind: 'ayat' },
  {
    id: 'discount-70',
    kind: 'offer',
    bn: 'সব প্রশ্নপত্রে ৭০% ছাড়ে',
    en: '70% off all question papers',
    href: '/pricing',
  },
  {
    id: 'free-3',
    kind: 'offer',
    bn: 'মাসে ৩টা ফ্রি প্রশ্নপত্র',
    en: '3 free question papers a month',
    href: '/question-maker',
  },
  {
    id: 'omr-free',
    kind: 'offer',
    bn: 'OMR চেক সম্পূর্ণ ফ্রি',
    en: 'OMR checking completely free',
    href: '/omr-evaluator',
  },
  // Every real feature (owner 25 Nov 18:01) — each links to its page.
  {
    id: 'library',
    kind: 'feature',
    bn: 'ফ্রি লাইব্রেরি — ৬০৯টি বই, ২,৩০৭টি অধ্যায়, ২৩,২৫৯টি প্রশ্ন',
    en: 'Free library — 609 books, 2,307 chapters, 23,259 questions',
    href: '/library',
  },
  {
    id: 'generator',
    kind: 'feature',
    bn: 'প্রশ্নপত্র জেনারেটর — নিজে বানান, ফ্রি ডাউনলোড',
    en: 'Question paper generator — build your own, free download',
    href: '/question-maker',
  },
  {
    id: 'jobs',
    kind: 'feature',
    bn: 'চাকরি প্রস্তুতি — BCS, ব্যাংক, প্রাইমারি, NTRCA',
    en: 'Job preparation — BCS, Bank, Primary, NTRCA',
    href: '/jobs',
  },
  {
    id: 'admissions',
    kind: 'feature',
    bn: 'ভর্তি প্রস্তুতি — ঢাবি, মেডিকেল, ইঞ্জিনিয়ারিং, কৃষি',
    en: 'Admission preparation — DU, Medical, Engineering, Agriculture',
    href: '/admissions',
  },
  {
    id: 'daily-quiz',
    kind: 'feature',
    bn: 'দৈনিক ৫ প্রশ্নের ফ্রি কুইজ — লগইন ছাড়াই',
    en: 'Daily 5-question free quiz — no login needed',
    href: '/#daily-quiz',
  },
  {
    id: 'book-search',
    kind: 'feature',
    bn: 'তাৎক্ষণিক বই খোঁজা — লিখলেই ফলাফল',
    en: 'Instant book search — results as you type',
    href: '/search',
  },
  {
    id: 'exams',
    kind: 'feature',
    bn: 'মডেল টেস্ট ও MCQ পরীক্ষা',
    en: 'Model tests and MCQ exams',
    href: '/exam',
  },
  {
    id: 'ai-chat',
    kind: 'feature',
    bn: 'AI চ্যাট — বাংলায় ও ইংরেজিতে প্রশ্ন করুন',
    en: 'AI chat — ask in Bangla and English',
    href: '/ai-assistant',
  },
  {
    id: 'custom-paper',
    kind: 'feature',
    bn: 'কাস্টম প্রশ্নপত্র — মাত্র ৳৪৯/পেপার',
    en: 'Custom question paper — only ৳49/paper',
    href: '/custom-paper',
  },
  {
    id: 'opportunities',
    kind: 'feature',
    bn: 'যাচাইকৃত সুযোগ — চাকরি, স্কলারশিপ, ইন্টার্নশিপ',
    en: 'Verified opportunities — jobs, scholarships, internships',
    href: '/opportunities',
  },
  {
    id: 'life-services',
    kind: 'feature',
    bn: 'দৈনন্দিন সেবা — ক্যালকুলেটর, বাজেট, স্বাস্থ্য',
    en: 'Everyday services — calculators, budget, health',
    href: '/life',
  },
  {
    id: 'progress',
    kind: 'feature',
    bn: 'পড়ার অগ্রগতি ট্র্যাক করুন',
    en: 'Track your study progress',
    href: '/progress',
  },
  // All 140 live tools, one item each (owner 27 Nov 2026) —
  // derived from toolsMeta above, in toolsMeta order.
  ...TICKER_TOOL_ITEMS,
];

/** How many identical copies of the item set the track renders (see
 *  the component: the loop translates by exactly one copy, so the
 *  copies must cover the viewport at every scroll position). */
export const TICKER_TRACK_COPIES = 4;

function TickerItem({ item, lang }: { item: AnnouncementTickerItem; lang: Lang }) {
  if (item.kind === 'ayat') {
    // Arabic ONLY (owner 25 Nov 18:01) — no translation, no attribution.
    return (
      <span className="ev-ticker-item ev-ticker-item-ayat">
        <span className="ev-ticker-ayat-ar" lang="ar" dir="rtl">
          {TICKER_AYAT_AR}
        </span>
      </span>
    );
  }
  return (
    <a className={`ev-ticker-item ev-ticker-item-${item.kind}`} href={item.href}>
      {lang === 'bn' ? item.bn : item.en}
    </a>
  );
}

export default function AnnouncementTicker() {
  const { lang } = useLanguage();
  const copies = Array.from({ length: TICKER_TRACK_COPIES }, (_, i) => i);
  return (
    <section
      className="ev-announcement-ticker"
      aria-label={
        lang === 'bn'
          ? 'ঘোষণা — Eduvelto-র ফিচার, অফার ও সূরা আলাকের আয়াত'
          : 'Announcements — Eduvelto features, offers and the Surah Al-Alaq verse'
      }
    >
      <div className="ev-ticker-track">
        {copies.map((copy) => (
          <span
            key={copy}
            className="ev-ticker-copy"
            aria-hidden={copy > 0 ? true : undefined}
          >
            {ANNOUNCEMENT_TICKER_ITEMS.map((item) => (
              <span key={item.id} className="ev-ticker-slot">
                <TickerItem item={item} lang={lang} />
                <span className="ev-ticker-sep" aria-hidden="true">
                  •
                </span>
              </span>
            ))}
          </span>
        ))}
      </div>
    </section>
  );
}
