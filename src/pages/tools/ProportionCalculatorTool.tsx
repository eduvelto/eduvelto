// Eduvelto — Proportion Calculator tool UI (Math batch, 27 Nov 2026).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Engine: solveProportion in src/lib/tools/mathTools.ts.
import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, Tiles, CopyButton, ButtonRow, ClearButton, ExampleButton, shortInputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { solveProportion } from '../../lib/tools/mathTools';

const resultStyle: CSSProperties = { marginTop: 14, padding: '18px 16px', borderRadius: 12, background: 'var(--teal-soft)', boxShadow: 'var(--shadow-sm)' };
const errorStyle: CSSProperties = { marginTop: 14, color: '#b3261e', fontSize: 14 };
const gridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 };

function parseNum(s: string): number | null {
  if (s.trim() === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function ProportionCalculatorTool() {
  const { t } = useLanguage();
  const [a, setA] = useState('3');
  const [b, setB] = useState('4');
  const [c, setC] = useState('9');
  const an = parseNum(a);
  const bn = parseNum(b);
  const cn = parseNum(c);
  const x = useMemo(() => (an !== null && bn !== null && cn !== null ? solveProportion(an, bn, cn) : null), [an, bn, cn]);
  const clear = () => { setA(''); setB(''); setC(''); };
  const loadExample = () => { setA('3'); setB('4'); setC('9'); };

  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="সমানুপাত ক্যালকুলেটর" titleEn="Proportion Calculator" descBn="a/b = c/x সমানুপাতটি সমাধান করে x-এর মান বের করুন।" descEn="Solve the proportion a/b = c/x to find x." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div style={gridStyle}>
        <div>
          <label style={labelStyle} htmlFor="prop-a">{t({ bn: 'a', en: 'a' })}</label>
          <input id="prop-a" style={shortInputStyle} type="number" step="any" inputMode="decimal" value={a} onChange={(e) => setA(e.target.value)} placeholder="3" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="prop-b">{t({ bn: 'b', en: 'b' })}</label>
          <input id="prop-b" style={shortInputStyle} type="number" step="any" inputMode="decimal" value={b} onChange={(e) => setB(e.target.value)} placeholder="4" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="prop-c">{t({ bn: 'c', en: 'c' })}</label>
          <input id="prop-c" style={shortInputStyle} type="number" step="any" inputMode="decimal" value={c} onChange={(e) => setC(e.target.value)} placeholder="9" />
        </div>
      </div>
      {x !== null ? (
        <>
          <div style={resultStyle} role="status">
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{t({ bn: 'x-এর মান', en: 'Value of x' })}</p>
            <p style={{ margin: 0, fontSize: '2rem', fontFamily: 'var(--font-head)', color: 'var(--teal-deep)' }}>x = {x}</p>
            <p style={{ margin: '8px 0 0', fontSize: 15 }}>{t({ bn: `${a}/${b} = ${c}/${x}  •  বজ্রগুণনে x = (${b} × ${c}) ÷ ${a}`, en: `${a}/${b} = ${c}/${x}  •  cross-multiplying, x = (${b} × ${c}) ÷ ${a}` })}</p>
          </div>
          <Tiles items={[
            { labelBn: 'বাম দিকের অনুপাত', labelEn: 'Left ratio', value: `${a}/${b}` },
            { labelBn: 'ডান দিকের অনুপাত', labelEn: 'Right ratio', value: `${c}/${x}` },
          ]} />
          <ButtonRow><CopyButton text={`${a}/${b} = ${c}/x, so x = ${x}`} labelBn="ফলাফল কপি করুন" labelEn="Copy result" /><ClearButton onClear={clear} /><ExampleButton onLoad={loadExample} /></ButtonRow>
        </>
      ) : (
        <p style={errorStyle} role="alert">{t({ bn: 'সঠিক সংখ্যা দিন — a ০ হতে পারবে না।', en: 'Enter valid numbers — a cannot be 0.' })}</p>
      )}
      <p style={noteStyle}>{t({ bn: 'সমানুপাতে দুটি ভগ্নাংশ সমান হয়। উদাহরণ: ৩টি কলমের দাম ১২ টাকা হলে ৯টি কলমের দাম কত — এ ধরনের ঐকিক নিয়মের অঙ্ক এখানে করা যায়।', en: 'In a proportion two fractions are equal. Example: if 3 pens cost 12 taka, how much do 9 pens cost — that kind of unitary-method problem can be solved here.' })}</p>
    </section>
  );
}
