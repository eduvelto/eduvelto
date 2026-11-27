// Eduvelto — Pythagorean Theorem Calculator tool UI (Math batch, 27 Nov 2026).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Engine: pythagoras in src/lib/tools/mathTools.ts.
import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, Tiles, CopyButton, ButtonRow, ClearButton, ExampleButton, shortInputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { pythagoras } from '../../lib/tools/mathTools';

const resultStyle: CSSProperties = { marginTop: 14, padding: '18px 16px', borderRadius: 12, background: 'var(--teal-soft)', boxShadow: 'var(--shadow-sm)' };
const errorStyle: CSSProperties = { marginTop: 14, color: '#b3261e', fontSize: 14 };
const gridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 };

function parseNum(s: string): number | null {
  if (s.trim() === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

type Missing = 'a' | 'b' | 'c';

export function PythagoreanTheoremCalculatorTool() {
  const { t } = useLanguage();
  const [missing, setMissing] = useState<Missing>('c');
  const [a, setA] = useState('3');
  const [b, setB] = useState('4');
  const [c, setC] = useState('5');
  const result = useMemo(() => pythagoras(
    missing === 'a' ? null : parseNum(a),
    missing === 'b' ? null : parseNum(b),
    missing === 'c' ? null : parseNum(c),
  ), [missing, a, b, c]);
  const clear = () => { setA(''); setB(''); setC(''); };
  const loadExample = () => { setA('3'); setB('4'); setC('5'); setMissing('c'); };

  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="পিথাগোরাসের উপপাদ্য ক্যালকুলেটর" titleEn="Pythagorean Theorem Calculator" descBn="সমকোণী ত্রিভুজের অনুপস্থিত বাহুটি বের করুন — অতিভুজ বা যেকোনো একটি লম্ব বাহু।" descEn="Find the missing side of a right triangle — the hypotenuse or either leg." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle} htmlFor="pyth-missing">{t({ bn: 'কোন বাহুটি বের করবেন?', en: 'Which side is missing?' })}</label>
        <select id="pyth-missing" style={shortInputStyle} value={missing} onChange={(e) => setMissing(e.target.value as Missing)}>
          <option value="c">{t({ bn: 'অতিভুজ (c)', en: 'Hypotenuse (c)' })}</option>
          <option value="a">{t({ bn: 'লম্ব বাহু a', en: 'Leg a' })}</option>
          <option value="b">{t({ bn: 'লম্ব বাহু b', en: 'Leg b' })}</option>
        </select>
      </div>
      <div style={gridStyle}>
        {missing !== 'a' ? (
          <div><label style={labelStyle} htmlFor="pyth-a">{t({ bn: 'লম্ব বাহু a', en: 'Leg a' })}</label><input id="pyth-a" style={shortInputStyle} type="number" min="0" step="any" inputMode="decimal" value={a} onChange={(e) => setA(e.target.value)} placeholder="3" /></div>
        ) : null}
        {missing !== 'b' ? (
          <div><label style={labelStyle} htmlFor="pyth-b">{t({ bn: 'লম্ব বাহু b', en: 'Leg b' })}</label><input id="pyth-b" style={shortInputStyle} type="number" min="0" step="any" inputMode="decimal" value={b} onChange={(e) => setB(e.target.value)} placeholder="4" /></div>
        ) : null}
        {missing !== 'c' ? (
          <div><label style={labelStyle} htmlFor="pyth-c">{t({ bn: 'অতিভুজ c', en: 'Hypotenuse c' })}</label><input id="pyth-c" style={shortInputStyle} type="number" min="0" step="any" inputMode="decimal" value={c} onChange={(e) => setC(e.target.value)} placeholder="5" /></div>
        ) : null}
      </div>
      {result ? (
        <>
          <div style={resultStyle} role="status">
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{t({ bn: `অনুপস্থিত বাহু ${result.missing}`, en: `Missing side ${result.missing}` })}</p>
            <p style={{ margin: 0, fontSize: '2rem', fontFamily: 'var(--font-head)', color: 'var(--teal-deep)' }}>{result.missing} = {result.value}</p>
            <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--muted)' }}>{result.formula}</p>
          </div>
          <Tiles items={[
            { labelBn: 'বাহু a', labelEn: 'Side a', value: missing === 'a' ? `${result.value}` : `${a}` },
            { labelBn: 'বাহু b', labelEn: 'Side b', value: missing === 'b' ? `${result.value}` : `${b}` },
            { labelBn: 'অতিভুজ c', labelEn: 'Hypotenuse c', value: missing === 'c' ? `${result.value}` : `${c}` },
          ]} />
          <ButtonRow><CopyButton text={`Right triangle: a=${missing === 'a' ? result.value : a}, b=${missing === 'b' ? result.value : b}, c=${missing === 'c' ? result.value : c}`} labelBn="ফলাফল কপি করুন" labelEn="Copy result" /><ClearButton onClear={clear} /><ExampleButton onLoad={loadExample} /></ButtonRow>
        </>
      ) : (
        <p style={errorStyle} role="alert">{t({ bn: 'সঠিক সংখ্যা দিন — অতিভুজ সবসময় লম্ব বাহুর চেয়ে বড় হতে হবে।', en: 'Enter valid numbers — the hypotenuse must always be longer than either leg.' })}</p>
      )}
      <p style={noteStyle}>{t({ bn: 'পিথাগোরাসের উপপাদ্য: a² + b² = c², যেখানে c অতিভুজ (সমকোণের বিপরীত বাহু)।', en: 'Pythagoras’ theorem: a² + b² = c², where c is the hypotenuse (the side opposite the right angle).' })}</p>
    </section>
  );
}
