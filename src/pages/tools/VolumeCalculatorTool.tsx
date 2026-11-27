// Eduvelto — Volume Calculator tool UI (Math batch, 27 Nov 2026).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Engine: volumeOf in src/lib/tools/mathTools.ts. Geometry volumes only —
// unit conversion lives in the unit converter tools.
import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, Tiles, CopyButton, ButtonRow, ClearButton, ExampleButton, shortInputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { volumeOf, type VolumeShape } from '../../lib/tools/mathTools';

const resultStyle: CSSProperties = { marginTop: 14, padding: '18px 16px', borderRadius: 12, background: 'var(--teal-soft)', boxShadow: 'var(--shadow-sm)' };
const errorStyle: CSSProperties = { marginTop: 14, color: '#b3261e', fontSize: 14 };
const gridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 };

function parseNum(s: string): number | null {
  if (s.trim() === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

const SHAPES: Array<{ id: VolumeShape; bn: string; en: string }> = [
  { id: 'cube', bn: 'ঘনক', en: 'Cube' },
  { id: 'cuboid', bn: 'আয়তঘন', en: 'Cuboid' },
  { id: 'cylinder', bn: 'সিলিন্ডার', en: 'Cylinder' },
  { id: 'sphere', bn: 'গোলক', en: 'Sphere' },
  { id: 'cone', bn: 'শঙ্কু', en: 'Cone' },
  { id: 'pyramid', bn: 'পিরামিড (আয়ত ভূমি)', en: 'Pyramid (rectangular base)' },
];

export function VolumeCalculatorTool() {
  const { t } = useLanguage();
  const [shape, setShape] = useState<VolumeShape>('cylinder');
  const [side, setSide] = useState('5');
  const [length, setLength] = useState('6');
  const [width, setWidth] = useState('4');
  const [height, setHeight] = useState('10');
  const [radius, setRadius] = useState('3');
  const result = useMemo(() => volumeOf(shape, {
    side: parseNum(side) ?? undefined,
    length: parseNum(length) ?? undefined,
    width: parseNum(width) ?? undefined,
    height: parseNum(height) ?? undefined,
    radius: parseNum(radius) ?? undefined,
  }), [shape, side, length, width, height, radius]);
  const clear = () => { setSide(''); setLength(''); setWidth(''); setHeight(''); setRadius(''); };
  const loadExample = () => { setSide('5'); setLength('6'); setWidth('4'); setHeight('10'); setRadius('3'); };
  const shapeName = SHAPES.find((s) => s.id === shape);

  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="আয়তন ক্যালকুলেটর" titleEn="Volume Calculator" descBn="ঘনক, আয়তঘন, সিলিন্ডার, গোলক, শঙ্কু ও পিরামিডের আয়তন বের করুন।" descEn="Find the volume of a cube, cuboid, cylinder, sphere, cone or pyramid." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle} htmlFor="vol-shape">{t({ bn: 'ঘনবস্তু', en: 'Solid' })}</label>
        <select id="vol-shape" style={shortInputStyle} value={shape} onChange={(e) => setShape(e.target.value as VolumeShape)}>
          {SHAPES.map((s) => <option key={s.id} value={s.id}>{t({ bn: s.bn, en: s.en })}</option>)}
        </select>
      </div>
      <div style={gridStyle}>
        {shape === 'cube' ? (
          <div><label style={labelStyle} htmlFor="vol-side">{t({ bn: 'বাহুর দৈর্ঘ্য', en: 'Side length' })}</label><input id="vol-side" style={shortInputStyle} type="number" min="0" step="any" inputMode="decimal" value={side} onChange={(e) => setSide(e.target.value)} placeholder="5" /></div>
        ) : null}
        {shape === 'cuboid' || shape === 'pyramid' ? (<>
          <div><label style={labelStyle} htmlFor="vol-length">{t({ bn: 'দৈর্ঘ্য', en: 'Length' })}</label><input id="vol-length" style={shortInputStyle} type="number" min="0" step="any" inputMode="decimal" value={length} onChange={(e) => setLength(e.target.value)} placeholder="6" /></div>
          <div><label style={labelStyle} htmlFor="vol-width">{t({ bn: 'প্রস্থ', en: 'Width' })}</label><input id="vol-width" style={shortInputStyle} type="number" min="0" step="any" inputMode="decimal" value={width} onChange={(e) => setWidth(e.target.value)} placeholder="4" /></div>
          <div><label style={labelStyle} htmlFor="vol-height">{t({ bn: 'উচ্চতা', en: 'Height' })}</label><input id="vol-height" style={shortInputStyle} type="number" min="0" step="any" inputMode="decimal" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="10" /></div>
        </>) : null}
        {shape === 'cylinder' || shape === 'cone' ? (<>
          <div><label style={labelStyle} htmlFor="vol-radius">{t({ bn: 'ব্যাসার্ধ', en: 'Radius' })}</label><input id="vol-radius" style={shortInputStyle} type="number" min="0" step="any" inputMode="decimal" value={radius} onChange={(e) => setRadius(e.target.value)} placeholder="3" /></div>
          <div><label style={labelStyle} htmlFor="vol-height">{t({ bn: 'উচ্চতা', en: 'Height' })}</label><input id="vol-height" style={shortInputStyle} type="number" min="0" step="any" inputMode="decimal" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="10" /></div>
        </>) : null}
        {shape === 'sphere' ? (
          <div><label style={labelStyle} htmlFor="vol-radius">{t({ bn: 'ব্যাসার্ধ', en: 'Radius' })}</label><input id="vol-radius" style={shortInputStyle} type="number" min="0" step="any" inputMode="decimal" value={radius} onChange={(e) => setRadius(e.target.value)} placeholder="3" /></div>
        ) : null}
      </div>
      {result ? (
        <>
          <div style={resultStyle} role="status">
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{t({ bn: `${shapeName?.bn}ের আয়তন`, en: `Volume of the ${shapeName?.en.toLowerCase()}` })}</p>
            <p style={{ margin: 0, fontSize: '2rem', fontFamily: 'var(--font-head)', color: 'var(--teal-deep)' }}>{result.volume}</p>
            <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--muted)' }}>{result.formula}</p>
          </div>
          <Tiles items={[{ labelBn: 'আয়তন', labelEn: 'Volume', value: `${result.volume}` }]} />
          <ButtonRow><CopyButton text={`Volume of ${shapeName?.en}: ${result.volume}`} labelBn="ফলাফল কপি করুন" labelEn="Copy result" /><ClearButton onClear={clear} /><ExampleButton onLoad={loadExample} /></ButtonRow>
        </>
      ) : (
        <p style={errorStyle} role="alert">{t({ bn: 'সব মাপে ০-এর বেশি সঠিক সংখ্যা দিন।', en: 'Enter valid numbers above 0 for every measurement.' })}</p>
      )}
      <p style={noteStyle}>{t({ bn: 'আয়তনের একক ঘন একক — যেমন দৈর্ঘ্য সেন্টিমিটারে দিলে আয়তন ঘন সেন্টিমিটারে পাবেন। একক রূপান্তরের (লিটার, গ্যালন ইত্যাদি) জন্য আয়তন রূপান্তরকারী টুল দেখুন।', en: 'Volume is in cubic units — if lengths are in centimetres, the volume is in cubic centimetres. For unit conversion (litres, gallons and so on) see the volume converter tool.' })}</p>
    </section>
  );
}
