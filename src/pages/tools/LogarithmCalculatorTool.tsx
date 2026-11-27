// Eduvelto — Logarithm Calculator tool UI (Math batch, 27 Nov 2026).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Engine: logarithmOf in src/lib/tools/mathTools.ts.
import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, Tiles, CopyButton, ButtonRow, ClearButton, ExampleButton, shortInputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { logarithmOf } from '../../lib/tools/mathTools';

const resultStyle: CSSProperties = { marginTop: 14, padding: '18px 16px', borderRadius: 12, background: 'var(--teal-soft)', boxShadow: 'var(--shadow-sm)' };
const errorStyle: CSSProperties = { marginTop: 14, color: '#b3261e', fontSize: 14 };
const gridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 };

function parseNum(s: string): number | null {
  if (s.trim() === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function LogarithmCalculatorTool() {
  const { t } = useLanguage();
  const [value, setValue] = useState('100');
  const [base, setBase] = useState('10');
  const v = parseNum(value);
  const b = parseNum(base);
  const result = useMemo(() => (v !== null && b !== null ? logarithmOf(v, b) : null), [v, b]);
  const clear = () => { setValue(''); setBase(''); };
  const loadExample = () => { setValue('100'); setBase('10'); };

  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="লগারিদম ক্যালকুলেটর" titleEn="Logarithm Calculator" descBn="যেকোনো ভিত্তিতে লগারিদম বের করুন — সাথে স্বাভাবিক লগ (ln) ও দশমিক লগও দেখাবে।" descEn="Find the logarithm to any base — with the natural log (ln) and base-10 log shown too." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div style={gridStyle}>
        <div>
          <label style={labelStyle} htmlFor="log-value">{t({ bn: 'সংখ্যা', en: 'Number' })}</label>
          <input id="log-value" style={shortInputStyle} type="number" step="any" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} placeholder="100" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="log-base">{t({ bn: 'ভিত্তি', en: 'Base' })}</label>
          <input id="log-base" style={shortInputStyle} type="number" step="any" inputMode="decimal" value={base} onChange={(e) => setBase(e.target.value)} placeholder="10" />
        </div>
      </div>
      {result ? (
        <>
          <div style={resultStyle} role="status">
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{t({ bn: `log ভিত্তি ${base}`, en: `log base ${base}` })}</p>
            <p style={{ margin: 0, fontSize: '2rem', fontFamily: 'var(--font-head)', color: 'var(--teal-deep)' }}>log<sub>{base}</sub>({value}) = {result.log}</p>
          </div>
          <Tiles items={[
            { labelBn: 'স্বাভাবিক লগ (ln)', labelEn: 'Natural log (ln)', value: `${result.ln}` },
            { labelBn: 'দশমিক লগ (log₁₀)', labelEn: 'Base-10 log (log₁₀)', value: `${result.log10}` },
            { labelBn: 'নির্বাচিত ভিত্তির লগ', labelEn: 'Log at chosen base', value: `${result.log}` },
          ]} />
          <ButtonRow><CopyButton text={`log base ${base} of ${value} = ${result.log}; ln = ${result.ln}; log10 = ${result.log10}`} labelBn="ফলাফল কপি করুন" labelEn="Copy result" /><ClearButton onClear={clear} /><ExampleButton onLoad={loadExample} /></ButtonRow>
        </>
      ) : (
        <p style={errorStyle} role="alert">{t({ bn: 'সঠিক সংখ্যা দিন — সংখ্যা ০-এর বেশি হতে হবে, ভিত্তি ০-এর বেশি ও ১ থেকে আলাদা হতে হবে।', en: 'Enter valid numbers — the number must be above 0, and the base must be above 0 and different from 1.' })}</p>
      )}
      <p style={noteStyle}>{t({ bn: 'log₁₀(১০০) = ২, কারণ ১০² = ১০০। স্বাভাবিক লগের ভিত্তি e (≈ ২.৭১৮)।', en: 'log₁₀(100) = 2, because 10² = 100. The natural log uses base e (≈ 2.718).' })}</p>
    </section>
  );
}
