// Eduvelto — Roman Numeral Converter tool UI.
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Pure logic lives in src/lib/tools — this file is presentation only.
// All processing is 100% in-browser; nothing is uploaded.

import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, CopyButton, ButtonRow, ClearButton, ExampleButton, shortInputStyle, labelStyle, cardStyle, buttonStyle, activeButtonStyle, noteStyle } from './toolUi';
import { toRoman, fromRoman } from '../../lib/tools/romanNumerals';


const resultStyle: CSSProperties = {
  marginTop: 14,
  padding: '18px 16px',
  borderRadius: 12,
  background: 'var(--teal-soft)',
  boxShadow: 'var(--shadow-sm)',
};

const errorStyle: CSSProperties = {
  marginTop: 12,
  padding: '10px 12px',
  borderRadius: 8,
  background: '#fef2f2',
  color: '#991b1b',
  fontSize: 14,
};

export function RomanNumeralConverterTool() {
  const { t } = useLanguage();
  const [mode, setMode] = useState<'toRoman' | 'fromRoman'>('toRoman');
  const [input, setInput] = useState('');
  const output = useMemo(() => {
    if (input.trim() === '') return { text: '', error: '' };
    try {
      if (mode === 'toRoman') {
        const n = Number(input.trim());
        if (!Number.isInteger(n)) throw new Error('Enter a whole number.');
        return { text: toRoman(n), error: '' };
      }
      return { text: String(fromRoman(input)), error: '' };
    } catch (err) {
      return { text: '', error: err instanceof Error ? err.message : '' };
    }
  }, [input, mode]);
  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="রোমান সংখ্যা কনভার্টার" titleEn="Roman Numeral Converter" descBn="আরবি সংখ্যাকে রোমান সংখ্যায় বা রোমান সংখ্যাকে আরবি সংখ্যায় রূপান্তর করুন।" descEn="Convert between Arabic numbers and Roman numerals." chipBn="১–৩৯৯৯ পর্যন্ত" chipEn="Numbers 1–3999" />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }} role="group" aria-label={t({ bn: 'রূপান্তরের দিক', en: 'Conversion direction' })}>
        <button type="button" style={mode === 'toRoman' ? activeButtonStyle : buttonStyle} aria-pressed={mode === 'toRoman'} onClick={() => setMode('toRoman')}>{t({ bn: 'সংখ্যা → রোমান', en: 'Number → Roman' })}</button>
        <button type="button" style={mode === 'fromRoman' ? activeButtonStyle : buttonStyle} aria-pressed={mode === 'fromRoman'} onClick={() => setMode('fromRoman')}>{t({ bn: 'রোমান → সংখ্যা', en: 'Roman → Number' })}</button>
      </div>
      <div>
        <label style={labelStyle} htmlFor="rn-input">{mode === 'toRoman' ? t({ bn: 'সংখ্যা (১–৩৯৯৯)', en: 'Number (1–3999)' }) : t({ bn: 'রোমান সংখ্যা', en: 'Roman numeral' })}</label>
        <input id="rn-input" style={shortInputStyle} value={input} onChange={(e) => setInput(e.target.value)} placeholder={mode === 'toRoman' ? '1994' : 'MCMXCIV'} />
      </div>
      {output.error ? <div style={errorStyle} role="alert">{output.error}</div> : null}
      <div style={resultStyle} role="status">
        <div style={{ fontSize: 13, color: 'var(--muted)' }}>{t({ bn: 'ফলাফল', en: 'Result' })}</div>
        <div style={{ fontSize: 26, fontWeight: 700 }}>{output.text || '—'}</div>
        <div style={{ marginTop: 8 }}><CopyButton text={output.text} /></div>
      </div>
      <ButtonRow>
        <ExampleButton onLoad={() => { setMode('toRoman'); setInput('1994'); }} />
        <ClearButton onClear={() => setInput('')} disabled={input === ''} />
      </ButtonRow>
      <p style={noteStyle}>{t({ bn: 'রোমান সংখ্যায় শূন্য নেই, তাই ১–৩৯৯৯-এর বাইরের সংখ্যা রূপান্তর করা যায় না।', en: 'Roman numerals have no zero, so numbers outside 1–3999 cannot be converted.' })}</p>
    </section>
  );
}
