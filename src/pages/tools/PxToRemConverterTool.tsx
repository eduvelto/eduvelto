// Eduvelto — PX to REM Converter (Converters batch, 27 Nov 2026).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// px ↔ rem/em with a base font-size input (default 16px). 100% in-browser.
import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, Tiles, CopyButton, ButtonRow, ClearButton, ExampleButton, shortInputStyle, labelStyle, cardStyle, noteStyle, buttonStyle, activeButtonStyle } from './toolUi';
import { pxToRem, remToPx, formatConverted } from '../../lib/tools/converterTools';

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

export function PxToRemConverterTool() {
  const { t } = useLanguage();
  const [mode, setMode] = useState<'px-to-rem' | 'rem-to-px'>('px-to-rem');
  const [value, setValue] = useState('32');
  const [base, setBase] = useState('16');
  const v = parseNum(value);
  const b = parseNum(base);
  const result = useMemo(() => {
    if (v === null || b === null) return null;
    return mode === 'px-to-rem' ? pxToRem(v, b) : remToPx(v, b);
  }, [v, b, mode]);
  const reverse = result !== null && b !== null ? (mode === 'px-to-rem' ? remToPx(result, b) : pxToRem(result, b)) : null;
  const loadExample = () => { setMode('px-to-rem'); setValue('32'); setBase('16'); };
  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="PX থেকে REM কনভার্টার" titleEn="PX to REM Converter" descBn="বেস ফন্ট সাইজ ধরে px ↔ rem/em-এর মধ্যে বদলান।" descEn="Convert px ↔ rem/em using your base font size." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <button type="button" style={mode === 'px-to-rem' ? activeButtonStyle : buttonStyle} onClick={() => setMode('px-to-rem')}>{t({ bn: 'px → rem', en: 'px → rem' })}</button>
        <button type="button" style={mode === 'rem-to-px' ? activeButtonStyle : buttonStyle} onClick={() => setMode('rem-to-px')}>{t({ bn: 'rem → px', en: 'rem → px' })}</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <div>
          <label style={labelStyle} htmlFor="px-value">{t({ bn: mode === 'px-to-rem' ? 'মান (px)' : 'মান (rem)', en: mode === 'px-to-rem' ? 'Value (px)' : 'Value (rem)' })}</label>
          <input id="px-value" style={shortInputStyle} type="number" min="0" step="0.1" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} placeholder="32" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="px-base">{t({ bn: 'বেস ফন্ট সাইজ (px)', en: 'Base font size (px)' })}</label>
          <input id="px-base" style={shortInputStyle} type="number" min="1" step="0.5" inputMode="decimal" value={base} onChange={(e) => setBase(e.target.value)} placeholder="16" />
        </div>
      </div>
      <ButtonRow>
        <ClearButton onClear={() => setValue('')} />
        <ExampleButton onLoad={loadExample} />
      </ButtonRow>
      {result !== null && v !== null ? (
        <>
          <div style={resultStyle} role="status">
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{t({ bn: mode === 'px-to-rem' ? 'rem-এ মান' : 'px-এ মান', en: mode === 'px-to-rem' ? 'Value in rem' : 'Value in px' })}</p>
            <p style={{ margin: 0, fontSize: '2rem', fontFamily: 'var(--font-head)', color: 'var(--teal-deep)' }}>{formatConverted(result)}{mode === 'px-to-rem' ? ' rem' : ' px'}</p>
            <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--muted)' }}>{t({ bn: `সূত্র: ${mode === 'px-to-rem' ? `rem = px ÷ বেস = ${v} ÷ ${b}` : `px = rem × বেস = ${v} × ${b}`}`, en: `Formula: ${mode === 'px-to-rem' ? `rem = px ÷ base = ${v} ÷ ${b}` : `px = rem × base = ${v} × ${b}`}` })}</p>
          </div>
          <Tiles items={[
            { labelBn: 'বেস ফন্ট সাইজ', labelEn: 'Base font size', value: b !== null ? `${formatConverted(b)} px` : '—' },
            { labelBn: 'উল্টো দিকে', labelEn: 'Back the other way', value: reverse !== null ? formatConverted(reverse) : '—' },
            { labelBn: '১ rem =', labelEn: '1 rem =', value: b !== null ? `${formatConverted(b)} px` : '—' },
          ]} />
          <ButtonRow><CopyButton text={`${v}${mode === 'px-to-rem' ? 'px' : 'rem'} = ${formatConverted(result)}${mode === 'px-to-rem' ? 'rem' : 'px'} (base ${b}px)`} labelBn="ফলাফল কপি করুন" labelEn="Copy result" /></ButtonRow>
        </>
      ) : (
        <p style={errorStyle} role="alert">{t({ bn: 'সঠিক মান দিন — মান ০ বা তার বেশি, বেস ফন্ট সাইজ ০-এর বেশি হতে হবে।', en: 'Enter valid values — the value must be 0 or above, the base font size above 0.' })}</p>
      )}
      <p style={noteStyle}>{t({ bn: 'ব্রাউজারের ডিফল্ট বেস ফন্ট সাইজ ১৬px; rem সেই বেসের সাপেক্ষে মাপা হয়, আর em নিকটতম প্যারেন্টের ফন্ট সাইজের সাপেক্ষে — একই সংখ্যার হিসাব দুটোতেই চলে।', en: 'The browser default base font size is 16px; rem is measured against that base, and em against the nearest parent’s font size — the same numbers work for both.' })}</p>
    </section>
  );
}
