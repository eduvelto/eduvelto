// Eduvelto — Area Calculator tool UI (Math batch, 27 Nov 2026).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Engine: areaOf in src/lib/tools/mathTools.ts.
import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, CopyButton, ButtonRow, ClearButton, ExampleButton, shortInputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { areaOf, type AreaShape } from '../../lib/tools/mathTools';

const resultStyle: CSSProperties = { marginTop: 14, padding: '18px 16px', borderRadius: 12, background: 'var(--teal-soft)', boxShadow: 'var(--shadow-sm)' };
const errorStyle: CSSProperties = { marginTop: 14, color: '#b3261e', fontSize: 14 };
const gridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 };

function parseNum(s: string): number | null {
  if (s.trim() === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

const SHAPES: Array<{ id: AreaShape; bn: string; en: string }> = [
  { id: 'rectangle', bn: 'আয়তক্ষেত্র', en: 'Rectangle' },
  { id: 'circle', bn: 'বৃত্ত', en: 'Circle' },
  { id: 'triangle', bn: 'ত্রিভুজ', en: 'Triangle' },
  { id: 'square', bn: 'বর্গক্ষেত্র', en: 'Square' },
  { id: 'parallelogram', bn: 'সামান্তরিক', en: 'Parallelogram' },
  { id: 'trapezium', bn: 'ট্রাপিজিয়াম', en: 'Trapezium' },
  { id: 'ellipse', bn: 'উপবৃত্ত', en: 'Ellipse' },
];

const EXAMPLES: Record<AreaShape, { length: string; width: string; radius: string; base: string; height: string; side: string; a: string; b: string }> = {
  rectangle: { length: '10', width: '5', radius: '', base: '', height: '', side: '', a: '', b: '' },
  circle: { length: '', width: '', radius: '7', base: '', height: '', side: '', a: '', b: '' },
  triangle: { length: '', width: '', radius: '', base: '8', height: '5', side: '', a: '', b: '' },
  square: { length: '', width: '', radius: '', base: '', height: '', side: '6', a: '', b: '' },
  parallelogram: { length: '', width: '', radius: '', base: '9', height: '4', side: '', a: '', b: '' },
  trapezium: { length: '', width: '', radius: '', base: '', height: '5', side: '', a: '6', b: '10' },
  ellipse: { length: '', width: '', radius: '', base: '', height: '', side: '', a: '5', b: '3' },
};

export function AreaCalculatorTool() {
  const { t } = useLanguage();
  const [shape, setShape] = useState<AreaShape>('rectangle');
  const [length, setLength] = useState('10');
  const [width, setWidth] = useState('5');
  const [radius, setRadius] = useState('7');
  const [base, setBase] = useState('8');
  const [height, setHeight] = useState('5');
  const [side, setSide] = useState('6');
  const [a, setA] = useState('6');
  const [b, setB] = useState('10');
  const result = useMemo(() => areaOf(shape, {
    length: parseNum(length) ?? undefined,
    width: parseNum(width) ?? undefined,
    radius: parseNum(radius) ?? undefined,
    base: parseNum(base) ?? undefined,
    height: parseNum(height) ?? undefined,
    side: parseNum(side) ?? undefined,
    a: parseNum(a) ?? undefined,
    b: parseNum(b) ?? undefined,
  }), [shape, length, width, radius, base, height, side, a, b]);
  const clear = () => { setLength(''); setWidth(''); setRadius(''); setBase(''); setHeight(''); setSide(''); setA(''); setB(''); };
  const loadExample = () => {
    const ex = EXAMPLES[shape];
    setLength(ex.length); setWidth(ex.width); setRadius(ex.radius); setBase(ex.base);
    setHeight(ex.height); setSide(ex.side); setA(ex.a); setB(ex.b);
  };
  const shapeName = SHAPES.find((s) => s.id === shape);

  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="ক্ষেত্রফল ক্যালকুলেটর" titleEn="Area Calculator" descBn="আয়তক্ষেত্র, বৃত্ত, ত্রিভুজ, বর্গক্ষেত্র, সামান্তরিক, ট্রাপিজিয়াম ও উপবৃত্তের ক্ষেত্রফল বের করুন।" descEn="Find the area of a rectangle, circle, triangle, square, parallelogram, trapezium or ellipse." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle} htmlFor="area-shape">{t({ bn: 'আকৃতি', en: 'Shape' })}</label>
        <select id="area-shape" style={shortInputStyle} value={shape} onChange={(e) => setShape(e.target.value as AreaShape)}>
          {SHAPES.map((s) => <option key={s.id} value={s.id}>{t({ bn: s.bn, en: s.en })}</option>)}
        </select>
      </div>
      <div style={gridStyle}>
        {shape === 'rectangle' ? (<>
          <div><label style={labelStyle} htmlFor="area-length">{t({ bn: 'দৈর্ঘ্য', en: 'Length' })}</label><input id="area-length" style={shortInputStyle} type="number" min="0" step="any" inputMode="decimal" value={length} onChange={(e) => setLength(e.target.value)} placeholder="10" /></div>
          <div><label style={labelStyle} htmlFor="area-width">{t({ bn: 'প্রস্থ', en: 'Width' })}</label><input id="area-width" style={shortInputStyle} type="number" min="0" step="any" inputMode="decimal" value={width} onChange={(e) => setWidth(e.target.value)} placeholder="5" /></div>
        </>) : null}
        {shape === 'circle' ? (
          <div><label style={labelStyle} htmlFor="area-radius">{t({ bn: 'ব্যাসার্ধ', en: 'Radius' })}</label><input id="area-radius" style={shortInputStyle} type="number" min="0" step="any" inputMode="decimal" value={radius} onChange={(e) => setRadius(e.target.value)} placeholder="7" /></div>
        ) : null}
        {shape === 'triangle' || shape === 'parallelogram' ? (<>
          <div><label style={labelStyle} htmlFor="area-base">{t({ bn: 'ভূমি', en: 'Base' })}</label><input id="area-base" style={shortInputStyle} type="number" min="0" step="any" inputMode="decimal" value={base} onChange={(e) => setBase(e.target.value)} placeholder="8" /></div>
          <div><label style={labelStyle} htmlFor="area-height">{t({ bn: 'উচ্চতা', en: 'Height' })}</label><input id="area-height" style={shortInputStyle} type="number" min="0" step="any" inputMode="decimal" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="5" /></div>
        </>) : null}
        {shape === 'square' ? (
          <div><label style={labelStyle} htmlFor="area-side">{t({ bn: 'বাহুর দৈর্ঘ্য', en: 'Side length' })}</label><input id="area-side" style={shortInputStyle} type="number" min="0" step="any" inputMode="decimal" value={side} onChange={(e) => setSide(e.target.value)} placeholder="6" /></div>
        ) : null}
        {shape === 'trapezium' ? (<>
          <div><label style={labelStyle} htmlFor="area-a">{t({ bn: 'সমান্তরাল বাহু a', en: 'Parallel side a' })}</label><input id="area-a" style={shortInputStyle} type="number" min="0" step="any" inputMode="decimal" value={a} onChange={(e) => setA(e.target.value)} placeholder="6" /></div>
          <div><label style={labelStyle} htmlFor="area-b">{t({ bn: 'সমান্তরাল বাহু b', en: 'Parallel side b' })}</label><input id="area-b" style={shortInputStyle} type="number" min="0" step="any" inputMode="decimal" value={b} onChange={(e) => setB(e.target.value)} placeholder="10" /></div>
          <div><label style={labelStyle} htmlFor="area-height">{t({ bn: 'উচ্চতা', en: 'Height' })}</label><input id="area-height" style={shortInputStyle} type="number" min="0" step="any" inputMode="decimal" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="5" /></div>
        </>) : null}
        {shape === 'ellipse' ? (<>
          <div><label style={labelStyle} htmlFor="area-a">{t({ bn: 'অর্ধ-প্রধান অক্ষ a', en: 'Semi-major axis a' })}</label><input id="area-a" style={shortInputStyle} type="number" min="0" step="any" inputMode="decimal" value={a} onChange={(e) => setA(e.target.value)} placeholder="5" /></div>
          <div><label style={labelStyle} htmlFor="area-b">{t({ bn: 'অর্ধ-গৌণ অক্ষ b', en: 'Semi-minor axis b' })}</label><input id="area-b" style={shortInputStyle} type="number" min="0" step="any" inputMode="decimal" value={b} onChange={(e) => setB(e.target.value)} placeholder="3" /></div>
        </>) : null}
      </div>
      {result ? (
        <>
          <div style={resultStyle} role="status">
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{t({ bn: `${shapeName?.bn}ের ক্ষেত্রফল`, en: `Area of the ${shapeName?.en.toLowerCase()}` })}</p>
            <p style={{ margin: 0, fontSize: '2rem', fontFamily: 'var(--font-head)', color: 'var(--teal-deep)' }}>{result.area}</p>
            <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--muted)' }}>{result.formula}</p>
          </div>
          <ButtonRow><CopyButton text={`Area of ${shapeName?.en}: ${result.area}`} labelBn="ফলাফল কপি করুন" labelEn="Copy result" /><ClearButton onClear={clear} /><ExampleButton onLoad={loadExample} /></ButtonRow>
        </>
      ) : (
        <p style={errorStyle} role="alert">{t({ bn: 'সব মাপে ০-এর বেশি সঠিক সংখ্যা দিন।', en: 'Enter valid numbers above 0 for every measurement.' })}</p>
      )}
      <p style={noteStyle}>{t({ bn: 'ক্ষেত্রফলের একক বর্গ একক — যেমন দৈর্ঘ্য সেন্টিমিটারে দিলে ক্ষেত্রফল বর্গ সেন্টিমিটারে পাবেন।', en: 'Area is in square units — if lengths are in centimetres, the area is in square centimetres.' })}</p>
    </section>
  );
}
