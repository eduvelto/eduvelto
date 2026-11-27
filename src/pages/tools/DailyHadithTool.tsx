// Eduvelto — Daily Hadith tool UI.
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// A modest deck of 30 well-known hadiths (src/lib/tools/hadiths.ts),
// each with its source collection cited. The hadith of the day is
// deterministic; "Next hadith" steps through the deck.

import { useMemo, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { HADITHS } from '../../lib/tools/hadiths';
import { dayOfYear } from '../../lib/tools/quranVerses';
import {
  cardStyle, resultStyle, headlineLabelStyle, noteStyle, buttonRowStyle,
  tileGridStyle, ToolHero, CopyButton, Tile,
} from './toolUiShared';

export function DailyHadithTool() {
  const { t, lang } = useLanguage();
  const todayIndex = useMemo(() => (dayOfYear(new Date()) - 1 + 7) % HADITHS.length, []);
  const [index, setIndex] = useState(todayIndex);
  const hadith = HADITHS[index];

  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="hadith-title">
      <ToolHero
        titleId="hadith-title"
        titleBn="প্রতিদিনের হাদিস"
        titleEn="Daily Hadith"
        descBn="প্রতিদিন একটি হাদিস পড়ুন।"
        descEn="Read a hadith each day."
        chipBn="৩০টি সুপরিচিত হাদিস • উৎসসহ"
        chipEn="30 well-known hadiths • with sources"
      />
      <div style={resultStyle} role="status">
        <p style={headlineLabelStyle}>
          {t({ bn: 'আজকের হাদিস', en: "Today's hadith" })} — {t({ bn: `বিষয়: ${hadith.topicBn}`, en: `Topic: ${hadith.topicEn}` })}
        </p>
        <p style={{ fontSize: 18, lineHeight: 1.9, color: 'var(--heading)', margin: '12px 0' }}>
          {lang === 'bn' ? hadith.textBn : hadith.textEn}
        </p>
        <div style={tileGridStyle}>
          <Tile label={t({ bn: 'উৎস', en: 'Source' })} value={hadith.source} />
        </div>
        <p style={noteStyle}>
          {t({
            bn: 'বাংলা পাঠটি হাদিসের ভাবার্থ; প্রতিটি হাদিসের উৎস গ্রন্থ উল্লেখ করা হয়েছে।',
            en: 'The Bengali text is a rendering of the hadith’s meaning; each hadith’s source collection is cited.',
          })}
        </p>
        <div style={buttonRowStyle}>
          <CopyButton
            text={`${hadith.textEn} (${hadith.source})`}
            labelBn="হাদিস কপি করুন"
            labelEn="Copy hadith"
          />
          <button type="button" className="ev-btn-outline" onClick={() => setIndex((i) => (i - 1 + HADITHS.length) % HADITHS.length)}>
            {t({ bn: 'আগের হাদিস', en: 'Previous hadith' })}
          </button>
          <button type="button" className="ev-btn-outline" onClick={() => setIndex((i) => (i + 1) % HADITHS.length)}>
            {t({ bn: 'পরের হাদিস', en: 'Next hadith' })}
          </button>
          <button type="button" className="ev-btn-outline" onClick={() => setIndex(todayIndex)} disabled={index === todayIndex}>
            {t({ bn: 'আজকের হাদিসে ফিরুন', en: "Back to today's hadith" })}
          </button>
        </div>
        <p style={noteStyle}>
          {t({ bn: `হাদিস ${index + 1} / ${HADITHS.length}`, en: `Hadith ${index + 1} of ${HADITHS.length}` })}
          {index === todayIndex ? t({ bn: ' — আজকের হাদিস', en: ' — today’s hadith' }) : ''}
        </p>
      </div>
    </section>
  );
}
