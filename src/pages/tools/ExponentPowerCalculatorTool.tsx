// Eduvelto — Exponent / Power Calculator tool UI (Math batch, 27 Nov 2026).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Engine: powerOf in src/lib/tools/mathTools.ts.
import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, Tiles, CopyButton, ButtonRow, ClearButton, ExampleButton, shortInputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { powerOf } from '../../lib/tools/mathTools';

const resultStyle: CSSProperties = { marginTop: 14, padding: '18px 16px', borderRadius: 12, background: 'var(--teal-soft)', boxShadow: 'var(--shadow-sm)' };
const errorStyle: CSSProperties = { marginTop: 14, color: '#b3261e', fontSize: 14 };
const gridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 };

function parseNum(s: string): number | null {
  if (s.trim() === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function ExponentPowerCalculatorTool() {
  const { t } = useLanguage();
  const [base, setBase] = useState('2');
  const [exp, setExp] = useState('10');
  const b = parseNum(base);
  const e = parseNum(exp);
  const result = useMemo(() => (b !== null && e !== null ? powerOf(b, e) : null), [b, e]);
  const clear = () => { setBase(''); setExp(''); };
  const loadExample = () => { setBase('2'); setExp('10'); };

  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="ঘাত (পাওয়ার) ক্যালকুলেটর" titleEn="Exponent / Power Calculator" descBn="xⁿ হিসাব করুন — ধাপে ধাপে গুণন দেখানো হয়।" descEn="Calculate xⁿ — the step-by-step multiplication is shown." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div style={gridStyle}>
        <div>
          <label style={labelStyle} htmlFor="pow-base">{t({ bn: 'ভিত্তি (x)', en: 'Base (x)' })}</label>
          <input id="pow-base" style={shortInputStyle} type="number" step="any" inputMode="decimal" value={base} onChange={(e) => setBase(e.target.value)} placeholder="2" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="pow-exp">{t({ bn: 'ঘাত (n)', en: 'Exponent (n)' })}</label>
          <input id="pow-exp" style={shortInputStyle} type="number" step="any" inputMode="decimal" value={exp} onChange={(e) => setExp(e.target.value)} placeholder="10" />
        </div>
      </div>
      {result ? (
        <>
          <div style={resultStyle} role="status">
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{t({ bn: 'ফলাফল', en: 'Result' })}</p>
            <p style={{ margin: 0, fontSize: '2rem', fontFamily: 'var(--font-head)', color: 'var(--teal-deep)' }}>{base}^{exp} = {result.result}</p>
            {result.steps.map((s) => (
              <p key={s} style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--muted)' }}>{s}</p>
            ))}
          </div>
          <Tiles items={[
            { labelBn: 'ভিত্তি', labelEn: 'Base', value: `${base}` },
            { labelBn: 'ঘাত', labelEn: 'Exponent', value: `${exp}` },
            { labelBn: 'ফলাফল', labelEn: 'Result', value: `${result.result}` },
          ]} />
          <ButtonRow><CopyButton text={`${base}^${exp} = ${result.result}`} labelBn="ফলাফল কপি করুন" labelEn="Copy result" /><ClearButton onClear={clear} /><ExampleButton onLoad={loadExample} /></ButtonRow>
        </>
      ) : (
        <p style={errorStyle} role="alert">{t({ bn: 'সঠিক সংখ্যা দিন — ঘাতের মান ১০০০-এর বেশি হলে হিসাব করা যায় না, আর ফলাফল অনেক বড় হলে সেটিও দেখানো যায় না।', en: 'Enter valid numbers — exponents above 1000 are not accepted, and results too large to represent cannot be shown.' })}</p>
      )}
      <p style={noteStyle}>{t({ bn: 'xⁿ মানে x-কে n বার গুণ করা। ঘাত ০ হলে ফলাফল সবসময় ১, আর ঋণাত্মক ঘাত মানে ১ ÷ xⁿ।', en: 'xⁿ means multiplying x by itself n times. An exponent of 0 always gives 1, and a negative exponent means 1 ÷ xⁿ.' })}</p>
    </section>
  );
}
