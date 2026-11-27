// Eduvelto — Quadratic Equation Solver tool UI (Math batch, 27 Nov 2026).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Engine: solveQuadratic in src/lib/tools/mathTools.ts.
import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, Tiles, CopyButton, ButtonRow, ClearButton, ExampleButton, shortInputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { solveQuadratic } from '../../lib/tools/mathTools';

const resultStyle: CSSProperties = { marginTop: 14, padding: '18px 16px', borderRadius: 12, background: 'var(--teal-soft)', boxShadow: 'var(--shadow-sm)' };
const errorStyle: CSSProperties = { marginTop: 14, color: '#b3261e', fontSize: 14 };
const gridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 };

function parseNum(s: string): number | null {
  if (s.trim() === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function formatRoot(re: number, im: number): string {
  if (im === 0) return `${re}`;
  const sign = im > 0 ? '+' : '−';
  return `${re} ${sign} ${Math.abs(im)}i`;
}

export function QuadraticEquationSolverTool() {
  const { t } = useLanguage();
  const [a, setA] = useState('1');
  const [b, setB] = useState('-3');
  const [c, setC] = useState('2');
  const an = parseNum(a);
  const bn = parseNum(b);
  const cn = parseNum(c);
  const result = useMemo(() => (an !== null && bn !== null && cn !== null ? solveQuadratic(an, bn, cn) : null), [an, bn, cn]);
  const clear = () => { setA(''); setB(''); setC(''); };
  const loadExample = () => { setA('1'); setB('-3'); setC('2'); };
  const natureBn = result?.nature === 'two-real' ? 'দুটি আলাদা বাস্তব মূল' : result?.nature === 'one-real' ? 'একটি পুনরাবৃত্ত বাস্তব মূল' : 'দুটি জটিল মূল (বাস্তব মূল নেই)';
  const natureEn = result?.nature === 'two-real' ? 'Two distinct real roots' : result?.nature === 'one-real' ? 'One repeated real root' : 'Two complex roots (no real root)';

  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="দ্বিঘাত সমীকরণ সমাধানকারী" titleEn="Quadratic Equation Solver" descBn="ax² + bx + c = 0 সমাধান করুন — ধাপসহ, বাস্তব ও জটিল দুই ধরনের মূলই দেখাবে।" descEn="Solve ax² + bx + c = 0 — with steps, showing real and complex roots honestly." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div style={gridStyle}>
        <div>
          <label style={labelStyle} htmlFor="quad-a">{t({ bn: 'a (x²-এর সহগ)', en: 'a (coefficient of x²)' })}</label>
          <input id="quad-a" style={shortInputStyle} type="number" step="any" inputMode="decimal" value={a} onChange={(e) => setA(e.target.value)} placeholder="1" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="quad-b">{t({ bn: 'b (x-এর সহগ)', en: 'b (coefficient of x)' })}</label>
          <input id="quad-b" style={shortInputStyle} type="number" step="any" inputMode="decimal" value={b} onChange={(e) => setB(e.target.value)} placeholder="-3" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="quad-c">{t({ bn: 'c (ধ্রুবক)', en: 'c (constant)' })}</label>
          <input id="quad-c" style={shortInputStyle} type="number" step="any" inputMode="decimal" value={c} onChange={(e) => setC(e.target.value)} placeholder="2" />
        </div>
      </div>
      {result ? (
        <>
          <div style={resultStyle} role="status">
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{t({ bn: natureBn, en: natureEn })}</p>
            <p style={{ margin: 0, fontSize: '2rem', fontFamily: 'var(--font-head)', color: 'var(--teal-deep)' }}>x = {formatRoot(result.roots[0].re, result.roots[0].im)}{result.nature === 'two-real' || result.nature === 'complex' ? `, ${formatRoot(result.roots[1].re, result.roots[1].im)}` : ''}</p>
            {result.steps.map((s) => (
              <p key={s} style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--muted)' }}>{s}</p>
            ))}
          </div>
          <Tiles items={[
            { labelBn: 'নির্ণায়ক (D)', labelEn: 'Discriminant (D)', value: `${result.discriminant}` },
            { labelBn: 'মূল ১', labelEn: 'Root 1', value: formatRoot(result.roots[0].re, result.roots[0].im) },
            { labelBn: 'মূল ২', labelEn: 'Root 2', value: formatRoot(result.roots[1].re, result.roots[1].im) },
          ]} />
          <ButtonRow><CopyButton text={`${a}x² + ${b}x + ${c} = 0; x = ${formatRoot(result.roots[0].re, result.roots[0].im)}, ${formatRoot(result.roots[1].re, result.roots[1].im)}`} labelBn="ফলাফল কপি করুন" labelEn="Copy result" /><ClearButton onClear={clear} /><ExampleButton onLoad={loadExample} /></ButtonRow>
        </>
      ) : (
        <p style={errorStyle} role="alert">{t({ bn: 'সঠিক সংখ্যা দিন — a ০ হতে পারবে না (a = ০ হলে এটি দ্বিঘাত সমীকরণ থাকে না)।', en: 'Enter valid numbers — a cannot be 0 (with a = 0 it is no longer a quadratic equation).' })}</p>
      )}
      <p style={noteStyle}>{t({ bn: 'নির্ণায়ক D = b² − 4ac। D > ০ হলে দুটি আলাদা বাস্তব মূল, D = ০ হলে একটি পুনরাবৃত্ত মূল, আর D < ০ হলে কোনো বাস্তব মূল নেই — তখন জটিল মূল দেখানো হয়।', en: 'Discriminant D = b² − 4ac. D > 0 gives two distinct real roots, D = 0 one repeated root, and D < 0 no real roots — then the complex roots are shown.' })}</p>
    </section>
  );
}
