// Eduvelto — Keyword Density Checker tool UI (Text batch, 27 Nov 2026).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Pure logic lives in src/lib/tools/textTools.ts.
// All processing is 100% in-browser; nothing is uploaded.
import { useMemo, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, Tiles, ButtonRow, ClearButton, ExampleButton, shortInputStyle, inputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { keywordDensity, wordFrequencies, countWords } from '../../lib/tools/textTools';

const EXAMPLE = 'Bangladesh is a beautiful country. Bangladesh has many rivers. The people of Bangladesh love cricket.';

export function KeywordDensityCheckerTool() {
  const { t } = useLanguage();
  const [text, setText] = useState(EXAMPLE);
  const [keyword, setKeyword] = useState('Bangladesh');
  const result = useMemo(() => keywordDensity(text, keyword), [text, keyword]);
  const total = useMemo(() => countWords(text), [text]);
  const top = useMemo(() => wordFrequencies(text, 8), [text]);
  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="কীওয়ার্ড ঘনত্ব পরীক্ষক" titleEn="Keyword Density Checker" descBn="লেখায় একটি কীওয়ার্ড কতবার ও কত শতাংশ আছে তা দেখুন — এসইও লেখার জন্য।" descEn="See how often a keyword appears in your text and its percentage — for SEO writing." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div>
        <label style={labelStyle} htmlFor="kd-text">{t({ bn: 'আপনার লেখা', en: 'Your text' })}</label>
        <textarea id="kd-text" style={inputStyle} value={text} onChange={(e) => setText(e.target.value)} placeholder={EXAMPLE} />
      </div>
      <div style={{ marginTop: 12 }}>
        <label style={labelStyle} htmlFor="kd-keyword">{t({ bn: 'কীওয়ার্ড', en: 'Keyword' })}</label>
        <input id="kd-keyword" style={shortInputStyle} value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Bangladesh" />
      </div>
      <ButtonRow>
        <ExampleButton onLoad={() => { setText(EXAMPLE); setKeyword('Bangladesh'); }} />
        <ClearButton onClear={() => { setText(''); setKeyword(''); }} disabled={text === '' && keyword === ''} />
      </ButtonRow>
      {result ? (
        <Tiles items={[
          { labelBn: 'মোট শব্দ', labelEn: 'Total words', value: String(result.totalWords) },
          { labelBn: 'কীওয়ার্ড বার', labelEn: 'Keyword count', value: String(result.count) },
          { labelBn: 'ঘনত্ব', labelEn: 'Density', value: `${result.density}%` },
        ]} />
      ) : (
        <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 14 }}>{t({ bn: 'লেখা ও কীওয়ার্ড দিলে ফল দেখাবে।', en: 'Enter text and a keyword to see the result.' })}</p>
      )}
      {top.length > 0 ? (
        <div style={{ marginTop: 14 }}>
          <p style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600 }}>{t({ bn: 'সবচেয়ে বেশি ব্যবহৃত শব্দ', en: 'Most used words' })}</p>
          <ul style={{ margin: 0, padding: '0 0 0 18px', fontSize: 15, lineHeight: 1.8 }}>
            {top.map((w) => (
              <li key={w.word}>{w.word} — {w.count} {t({ bn: 'বার', en: 'times' })} ({w.density}%)</li>
            ))}
          </ul>
        </div>
      ) : null}
      <p style={noteStyle}>{t({ bn: `মোট শব্দ: ${total}টি। সাধারণত ১–৩% ঘনত্ব স্বাভাবিক ধরা হয়; বেশি হলে লেখা অস্বাভাবিক লাগে।`, en: `Total words: ${total}. A density of 1–3% is usually considered natural; much higher can read unnaturally.` })}</p>
    </section>
  );
}
