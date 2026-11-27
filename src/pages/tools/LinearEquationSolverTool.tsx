// Eduvelto — Linear Equation Solver tool UI (Math batch, 27 Nov 2026).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Engine: solveLinear in src/lib/tools/mathTools.ts.
import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, Tiles, CopyButton, ButtonRow, ClearButton, ExampleButton, shortInputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { solveLinear } from '../../lib/tools/mathTools';

const resultStyle: CSSProperties = { marginTop: 14, padding: '18px 16px', borderRadius: 12, background: 'var(--teal-soft)', boxShadow: 'var(--shadow-sm)' };
const errorStyle: CSSProperties = { marginTop: 14, color: '#b3261e', fontSize: 14 };
const gridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 };

function parseNum(s: string): number | null {
  if (s.trim() === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function LinearEquationSolverTool() {
  const { t } = useLanguage();
  const [a, setA] = useState('2');
  const [b, setB] = useState('3');
  const [c, setC] = useState('1');
  const [d, setD] = useState('7');
  const an = parseNum(a);
  const bn = parseNum(b);
  const cn = parseNum(c);
  const dn = parseNum(d);
  const result = useMemo(() => (an !== null && bn !== null && cn !== null && dn !== null ? solveLinear(an, bn, cn, dn) : null), [an, bn, cn, dn]);
  const clear = () => { setA(''); setB(''); setC(''); setD(''); };
  const loadExample = () => { setA('2'); setB('3'); setC('1'); setD('7'); };

  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="একঘাত সমীকরণ সমাধানকারী" titleEn="Linear Equation Solver" descBn="ax + b = cx + d সমীকরণটি ধাপসহ সমাধান করে x-এর মান বের করুন।" descEn="Solve ax + b = cx + d step by step to find x." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div style={gridStyle}>
        <div>
          <label style={labelStyle} htmlFor="lin-a">{t({ bn: 'a (বাম পাশে x-এর সহগ)', en: 'a (x coefficient, left side)' })}</label>
          <input id="lin-a" style={shortInputStyle} type="number" step="any" inputMode="decimal" value={a} onChange={(e) => setA(e.target.value)} placeholder="2" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="lin-b">{t({ bn: 'b (বাম পাশের ধ্রুবক)', en: 'b (constant, left side)' })}</label>
          <input id="lin-b" style={shortInputStyle} type="number" step="any" inputMode="decimal" value={b} onChange={(e) => setB(e.target.value)} placeholder="3" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="lin-c">{t({ bn: 'c (ডান পাশে x-এর সহগ)', en: 'c (x coefficient, right side)' })}</label>
          <input id="lin-c" style={shortInputStyle} type="number" step="any" inputMode="decimal" value={c} onChange={(e) => setC(e.target.value)} placeholder="1" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="lin-d">{t({ bn: 'd (ডান পাশের ধ্রুবক)', en: 'd (constant, right side)' })}</label>
          <input id="lin-d" style={shortInputStyle} type="number" step="any" inputMode="decimal" value={d} onChange={(e) => setD(e.target.value)} placeholder="7" />
        </div>
      </div>
      {result ? (
        <>
          <div style={resultStyle} role="status">
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{t({ bn: result.kind === 'unique' ? 'সমাধান' : result.kind === 'infinite' ? 'অসংখ্য সমাধান' : 'কোনো সমাধান নেই', en: result.kind === 'unique' ? 'Solution' : result.kind === 'infinite' ? 'Infinitely many solutions' : 'No solution' })}</p>
            <p style={{ margin: 0, fontSize: '2rem', fontFamily: 'var(--font-head)', color: 'var(--teal-deep)' }}>{result.kind === 'unique' ? `x = ${result.x}` : result.kind === 'infinite' ? t({ bn: 'সব x-ই সমাধান', en: 'Every x is a solution' }) : t({ bn: 'সমাধান নেই', en: 'No solution' })}</p>
            {result.steps.map((s) => (
              <p key={s} style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--muted)' }}>{s}</p>
            ))}
          </div>
          <Tiles items={[
            { labelBn: 'সমীকরণ', labelEn: 'Equation', value: `${a}x + ${b} = ${c}x + ${d}` },
            { labelBn: 'x-এর মান', labelEn: 'Value of x', value: result.x === null ? '—' : `${result.x}` },
          ]} />
          <ButtonRow><CopyButton text={result.kind === 'unique' ? `${a}x + ${b} = ${c}x + ${d}; x = ${result.x}` : `${a}x + ${b} = ${c}x + ${d}; ${result.kind}`} labelBn="ফলাফল কপি করুন" labelEn="Copy result" /><ClearButton onClear={clear} /><ExampleButton onLoad={loadExample} /></ButtonRow>
        </>
      ) : (
        <p style={errorStyle} role="alert">{t({ bn: 'চারটি ঘরেই সঠিক সংখ্যা দিন।', en: 'Enter valid numbers in all four fields.' })}</p>
      )}
      <p style={noteStyle}>{t({ bn: 'দুই পাশের x-এর সহগ সমান হলে একটিই সমাধান থাকে না: ধ্রুবক দুটিও সমান হলে সব x-ই সমাধান, আর আলাদা হলে কোনো সমাধানই নেই।', en: 'If the x coefficients on both sides are equal there is no single solution: if the constants are equal too, every x works; if they differ, no x works.' })}</p>
    </section>
  );
}
