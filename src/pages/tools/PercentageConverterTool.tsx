// Eduvelto — Percentage Converter tool UI (landed 27 Nov 2026, A-tools).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// D-02 fix (preferred): standalone page reusing calculatePercentage() in src/lib/lifeCalculators.ts. 100% in-browser; nothing is uploaded.
import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import {ToolHero, Tiles, inputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { calculatePercentage, type PercentageMode } from '../../lib/lifeCalculators';

const resultStyle: CSSProperties = {
  marginTop: 14,
  padding: '18px 16px',
  borderRadius: 12,
  background: 'var(--teal-soft)',
  boxShadow: 'var(--shadow-sm)',
};

const errorStyle: CSSProperties = {
  marginTop: 14,
  color: '#b3261e',
  fontSize: 14,
};

function parseNum(s: string): number | null {
  if (s.trim() === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}




const MODES: readonly { id: PercentageMode; bn: string; en: string }[] = [
  { id: 'of', bn: 'X-এর Y% কত', en: 'What is Y% of X' },
  { id: 'what-percent', bn: 'X, Y-এর কত %', en: 'X is what % of Y' },
  { id: 'increase', bn: 'X-কে Y% বাড়ালে', en: 'Increase X by Y%' },
  { id: 'decrease', bn: 'X-কে Y% কমালে', en: 'Decrease X by Y%' },
];

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

export function PercentageConverterTool() {
  const { t } = useLanguage();
  const [mode, setMode] = useState<PercentageMode>('of');
  const [a, setA] = useState('20');
  const [b, setB] = useState('150');
  const [pct, setPct] = useState('25');
  const av = parseNum(a);
  const bv = parseNum(b);
  const pctV = parseNum(pct);
  const result = useMemo(() => (av !== null && bv !== null ? calculatePercentage(mode, av, bv) : null), [av, bv, mode]);
  const modeLabel = MODES.find((m) => m.id === mode) ?? MODES[0];
  const decimal = pctV === null ? null : pctV / 100;
  const fraction = useMemo(() => {
    if (pctV === null) return null;
    const scaled = Math.round(pctV * 100);
    const g = gcd(Math.abs(scaled), 10000);
    return `${scaled / g}/${10000 / g}`;
  }, [pctV]);

  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="শতাংশ কনভার্টার" titleEn="Percentage Converter" descBn="শতাংশের হিসাব করুন এবং শতাংশ, দশমিক ও ভগ্নাংশের মধ্যে রূপান্তর করুন।" descEn="Do percentage math and convert between percentages, decimals and fractions." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <div>
          <label style={labelStyle} htmlFor="pc-mode">{t({ bn: 'হিসাবের ধরন', en: 'Calculation type' })}</label>
          <select id="pc-mode" style={inputStyle} value={mode} onChange={(e) => setMode(e.target.value as PercentageMode)}>
            {MODES.map((m) => (<option key={m.id} value={m.id}>{t({ bn: m.bn, en: m.en })}</option>))}
          </select>
        </div>
        <div>
          <label style={labelStyle} htmlFor="pc-a">{t({ bn: 'প্রথম সংখ্যা (X)', en: 'First number (X)' })}</label>
          <input id="pc-a" style={inputStyle} type="number" inputMode="decimal" value={a} onChange={(e) => setA(e.target.value)} placeholder="20" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="pc-b">{t({ bn: 'দ্বিতীয় সংখ্যা (Y)', en: 'Second number (Y)' })}</label>
          <input id="pc-b" style={inputStyle} type="number" inputMode="decimal" value={b} onChange={(e) => setB(e.target.value)} placeholder="150" />
        </div>
      </div>
      {result !== null ? (
        <div style={resultStyle} role="status">
          <p style={{ margin: 0, fontSize: 16 }}><strong>{t({ bn: modeLabel.bn, en: modeLabel.en })}: {Number.isInteger(result) ? result : result.toFixed(2)}{mode === 'what-percent' ? '%' : ''}</strong></p>
          <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--muted)' }}>
            {mode === 'of' && t({ bn: 'সূত্র: (X ÷ ১০০) × Y', en: 'Formula: (X ÷ 100) × Y' })}
            {mode === 'what-percent' && t({ bn: 'সূত্র: (X ÷ Y) × ১০০', en: 'Formula: (X ÷ Y) × 100' })}
            {mode === 'increase' && t({ bn: 'সূত্র: X × (১ + Y ÷ ১০০)', en: 'Formula: X × (1 + Y ÷ 100)' })}
            {mode === 'decrease' && t({ bn: 'সূত্র: X × (১ − Y ÷ ১০০)', en: 'Formula: X × (1 − Y ÷ 100)' })}
          </p>
        </div>
      ) : (
        <p style={errorStyle} role="alert">{t({ bn: 'সঠিক সংখ্যা দিন (দ্বিতীয় সংখ্যা ০ হতে পারবে না)।', en: 'Enter valid numbers (the second number cannot be 0).' })}</p>
      )}
      <div style={{ marginTop: 18 }}>
        <p style={{ fontSize: 15, fontWeight: 700, margin: '0 0 8px' }}>{t({ bn: 'শতাংশ ↔ দশমিক ↔ ভগ্নাংশ', en: 'Percent ↔ decimal ↔ fraction' })}</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          <div>
            <label style={labelStyle} htmlFor="pc-pct">{t({ bn: 'শতাংশ (%)', en: 'Percent (%)' })}</label>
            <input id="pc-pct" style={inputStyle} type="number" inputMode="decimal" value={pct} onChange={(e) => setPct(e.target.value)} placeholder="25" />
          </div>
        </div>
        {decimal !== null && fraction !== null ? (
          <Tiles items={[
            { labelBn: 'দশমিক', labelEn: 'Decimal', value: String(decimal) },
            { labelBn: 'ভগ্নাংশ', labelEn: 'Fraction', value: fraction },
          ]} />
        ) : null}
      </div>
      <p style={noteStyle}>{t({ bn: 'ছাড়ের হিসাবে শতাংশের সঙ্গে ডিসকাউন্ট-ভ্যাট-প্রফিট টুলটিও দেখতে পারেন।', en: 'For discount math, also see the discount–VAT–profit tool.' })}</p>
    </section>
  );
}
