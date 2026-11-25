// Eduvelto — homepage announcement ticker (owner 25 Nov 2026 10:03).
//
// REPLACES the ayah bar (components/HeroGreeting.tsx, deleted the
// same day — owner: "takbe na"). It sits in the ayah bar's old spot:
// the full-width strip directly below the Navigation Menu on the
// homepage (HomePage mounts this component, and only HomePage).
//
// CONTENT — OUR features + OUR running offers + the ayat ONLY.
// Never any other site's numbers or claims: their "১২,০০০+ শিক্ষক /
// ৫ লক্ষ+ প্রশ্ন" stats are THEIRS, not ours, and appear nowhere.
// The ৭০% offer stands alone — NEVER name another website or
// competitor in the ticker or banner (owner 25 Nov 17:11: no other
// site's name here). The comparison price lives ONLY in the pricing
// table, where their price is struck through and labelled as theirs
// (70% pricing rule, owner 25 Nov 09:34).
//
// AYAT (Surah Al-Alaq, ayah 1) — exact strings supplied by the owner
// 25 Nov 10:03; copy character for character, NEVER retype from
// memory and never pick a different ayat:
//   Arabic: اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ
//   Bangla: "পড়ো তোমার রবের নামে, যিনি সৃষ্টি করেছেন।"
//   English: "Read in the name of your Lord who created."
//   Attribution: "সূরা আলাক, আয়াত ১।"
// Respectful display (standing rule): SLOW marquee (80s loop),
// no flashing, no fast movement, pause on hover; the Arabic
// letters/harakat are never distorted — the marquee moves the track
// with a rigid translateX only (no skew, scale or rotate on the
// text). Under prefers-reduced-motion the track stops and wraps
// statically, so nothing moves at all.
//
// STATIC content — no Firestore reads (Spark rule for public pages).
// The offer items link to our own pages (pricing / question-maker /
// omr-evaluator); the ayat item is not a link.
import type { Lang } from '../i18n/strings';
import { useLanguage } from '../i18n/LanguageContext';

/** Ayat strings — verbatim from the owner (25 Nov 2026 10:03). */
export const TICKER_AYAT_AR = 'اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ';
export const TICKER_AYAT_BN = 'পড়ো তোমার রবের নামে, যিনি সৃষ্টি করেছেন।';
export const TICKER_AYAT_EN = 'Read in the name of your Lord who created.';
export const TICKER_AYAT_ATTR_BN = 'সূরা আলাক, আয়াত ১।';
export const TICKER_AYAT_ATTR_EN = 'Surah Al-Alaq, Ayah 1.';

export type AnnouncementTickerItem =
  | { id: 'ayat'; kind: 'ayat' }
  | { id: string; kind: 'offer'; bn: string; en: string; href: string };

/** Rotation order: the ayat leads, then our offers. */
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
];

/** How many identical copies of the item set the track renders (see
 *  the component: the loop translates by exactly one copy, so the
 *  copies must cover the viewport at every scroll position). */
export const TICKER_TRACK_COPIES = 4;

function TickerItem({ item, lang }: { item: AnnouncementTickerItem; lang: Lang }) {
  if (item.kind === 'ayat') {
    const text = lang === 'bn' ? TICKER_AYAT_BN : TICKER_AYAT_EN;
    const attr = lang === 'bn' ? TICKER_AYAT_ATTR_BN : TICKER_AYAT_ATTR_EN;
    return (
      <span className="ev-ticker-item ev-ticker-item-ayat">
        <span className="ev-ticker-ayat-ar" lang="ar" dir="rtl">
          {TICKER_AYAT_AR}
        </span>
        <span className="ev-ticker-ayat-text" lang={lang}>
          {text}
        </span>
        <span className="ev-ticker-ayat-attr" lang={lang}>
          — {attr}
        </span>
      </span>
    );
  }
  return (
    <a className="ev-ticker-item ev-ticker-item-offer" href={item.href}>
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
          ? 'ঘোষণা — Eduvelto-র অফার ও সূরা আলাকের আয়াত'
          : 'Announcements — Eduvelto offers and the Surah Al-Alaq verse'
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
