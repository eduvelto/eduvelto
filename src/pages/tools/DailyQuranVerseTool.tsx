// Eduvelto — Daily Quran Verse tool UI.
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// A modest deck of 30 well-known short verses (src/lib/tools/
// quranVerses.ts): Arabic + surah:ayah + Bengali meaning from
// standard published translations (abridged). The verse of the day
// is deterministic; "Next verse" steps through the deck.

import { useMemo, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { QURAN_VERSES, dayOfYear } from '../../lib/tools/quranVerses';
import {
  cardStyle, resultStyle, headlineLabelStyle, noteStyle, buttonRowStyle,
  ToolHero, CopyButton,
} from './toolUiShared';

export function DailyQuranVerseTool() {
  const { t, lang } = useLanguage();
  const todayIndex = useMemo(() => (dayOfYear(new Date()) - 1) % QURAN_VERSES.length, []);
  const [index, setIndex] = useState(todayIndex);
  const verse = QURAN_VERSES[index];

  function nextVerse(): void {
    setIndex((i) => (i + 1) % QURAN_VERSES.length);
  }
  function prevVerse(): void {
    setIndex((i) => (i - 1 + QURAN_VERSES.length) % QURAN_VERSES.length);
  }

  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="quran-title">
      <ToolHero
        titleId="quran-title"
        titleBn="প্রতিদিনের কুরআনের আয়াত"
        titleEn="Daily Quran Verse"
        descBn="প্রতিদিন একটি কুরআনের আয়াত পড়ুন।"
        descEn="Read a verse from the Quran each day."
        chipBn="৩০টি সুপরিচিত আয়াত • প্রতিদিন একটি করে"
        chipEn="30 well-known verses • one each day"
      />
      <div style={resultStyle} role="status">
        <p style={headlineLabelStyle}>
          {t({ bn: 'আজকের আয়াত', en: "Today's verse" })} — {lang === 'bn' ? verse.surahBn : verse.surahEn} {verse.reference}
        </p>
        <p
          dir="rtl"
          lang="ar"
          style={{
            fontSize: '1.6rem',
            lineHeight: 2,
            color: 'var(--teal-deep)',
            margin: '12px 0',
            textAlign: 'right',
          }}
        >
          {verse.arabic}
        </p>
        <p style={{ fontSize: 16, lineHeight: 1.8, color: 'var(--heading)', margin: '0 0 4px' }}>
          {lang === 'bn' ? verse.meaningBn : verse.meaningEn}
        </p>
        <p style={noteStyle}>
          {t({
            bn: 'বাংলা অর্থ: প্রচলিত প্রকাশিত অনুবাদ থেকে সংক্ষেপে। আয়াতের অংশ হলে তা লেখা আছে।',
            en: 'Bengali meaning: abridged from standard published translations. Where only part of a verse is shown, it is marked.',
          })}
        </p>
        <div style={buttonRowStyle}>
          <CopyButton
            text={`${verse.arabic} (${verse.surahEn} ${verse.reference}) — ${verse.meaningEn}`}
            labelBn="আয়াত কপি করুন"
            labelEn="Copy verse"
          />
          <button type="button" className="ev-btn-outline" onClick={prevVerse}>
            {t({ bn: 'আগের আয়াত', en: 'Previous verse' })}
          </button>
          <button type="button" className="ev-btn-outline" onClick={nextVerse}>
            {t({ bn: 'পরের আয়াত', en: 'Next verse' })}
          </button>
          <button
            type="button"
            className="ev-btn-outline"
            onClick={() => setIndex(todayIndex)}
            disabled={index === todayIndex}
          >
            {t({ bn: 'আজকের আয়াতে ফিরুন', en: "Back to today's verse" })}
          </button>
        </div>
        <p style={noteStyle}>
          {t({ bn: `আয়াত ${index + 1} / ${QURAN_VERSES.length}`, en: `Verse ${index + 1} of ${QURAN_VERSES.length}` })}
          {index === todayIndex ? t({ bn: ' — আজকের আয়াত', en: ' — today’s verse' }) : ''}
        </p>
      </div>
    </section>
  );
}
