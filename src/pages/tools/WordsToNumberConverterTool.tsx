// Eduvelto — Words to Number Converter tool UI (Text batch, 27 Nov 2026).
// Reverse of the live number-to-words-converter (numbers -> words only):
// this tool takes words and gives the number, in English AND Bangla.
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Pure logic lives in src/lib/tools/textTools.ts.
// All processing is 100% in-browser; nothing is uploaded.
import { useMemo, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, ButtonRow, ClearButton, ExampleButton, shortInputStyle, labelStyle, cardStyle, noteStyle, activeButtonStyle, buttonStyle } from './toolUi';
import { wordsToNumberEn, wordsToNumberBn } from '../../lib/tools/textTools';
import type { CSSProperties } from 'react';

const resultStyle: CSSProperties = { marginTop: 14, padding: '18px 16px', borderRadius: 12, background: 'var(--teal-soft)', boxShadow: 'var(--shadow-sm)' };
const headlineStyle: CSSProperties = { fontFamily: 'var(--font-head)', fontSize: '2rem', lineHeight: 1.2, color: 'var(--teal-deep)', margin: '4px 0 0' };
const headlineLabelStyle: CSSProperties = { fontSize: 13, fontWeight: 600, color: 'var(--muted)', margin: 0 };

export function WordsToNumberConverterTool() {
  const { t } = useLanguage();
  const [lang, setLang] = useState<'en' | 'bn'>('en');
  const [input, setInput] = useState('one hundred twenty three');
  const result = useMemo(() => (lang === 'en' ? wordsToNumberEn(input) : wordsToNumberBn(input)), [lang, input]);
  const loadExample = () => setInput(lang === 'en' ? 'one hundred twenty three' : 'একশত তেইশ');
  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="শব্দ থেকে সংখ্যা কনভার্টার" titleEn="Words to Number Converter" descBn="সংখ্যার শব্দ লিখলে সংখ্যাটি পান — ইংরেজি ও বাংলা দুটোতেই।" descEn="Type a number in words to get the number — in English and Bangla." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <button type="button" style={lang === 'en' ? activeButtonStyle : buttonStyle} onClick={() => setLang('en')}>English</button>
        <button type="button" style={lang === 'bn' ? activeButtonStyle : buttonStyle} onClick={() => setLang('bn')}>বাংলা</button>
      </div>
      <div>
        <label style={labelStyle} htmlFor="wtn-input">{t({ bn: 'সংখ্যার শব্দ', en: 'Number in words' })}</label>
        <input id="wtn-input" style={shortInputStyle} value={input} onChange={(e) => setInput(e.target.value)} placeholder={lang === 'en' ? 'one hundred twenty three' : 'একশত তেইশ'} />
      </div>
      <ButtonRow>
        <ExampleButton onLoad={loadExample} />
        <ClearButton onClear={() => setInput('')} disabled={input === ''} />
      </ButtonRow>
      {result !== null ? (
        <div style={resultStyle} role="status">
          <p style={headlineLabelStyle}>{t({ bn: 'সংখ্যা', en: 'Number' })}</p>
          <p style={headlineStyle}>{result.toLocaleString('en-US')}</p>
        </div>
      ) : null}
      {result === null && input.trim() !== '' ? (
        <p style={{ color: '#b3261e', fontSize: 14, marginTop: 12 }}>{t({ bn: 'বোঝা যায়নি — সংখ্যার শব্দ ঠিকভাবে লিখুন (যেমন: one hundred twenty three / একশত তেইশ)।', en: 'Could not understand — write the number words properly (e.g. one hundred twenty three / একশত তেইশ).' })}</p>
      ) : null}
      <p style={noteStyle}>{t({ bn: 'ইংরেজিতে hundred, thousand, million, billion চলে; বাংলায় শত, হাজার, লক্ষ, কোটি চলে। উল্টো দিকের (সংখ্যা থেকে শব্দ) জন্য number-to-words টুলটি দেখুন।', en: 'English supports hundred, thousand, million, billion; Bangla supports শত, হাজার, লক্ষ, কোটি. For the reverse direction (number to words), see the number-to-words tool.' })}</p>
    </section>
  );
}
