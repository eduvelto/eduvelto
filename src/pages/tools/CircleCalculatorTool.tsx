// Eduvelto — Circle Calculator tool UI (Math batch, 27 Nov 2026).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Engine: circleFromRadius/Diameter/Circumference in src/lib/tools/mathTools.ts.
import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, Tiles, CopyButton, ButtonRow, ClearButton, ExampleButton, shortInputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { circleFromRadius, circleFromDiameter, circleFromCircumference } from '../../lib/tools/mathTools';

const resultStyle: CSSProperties = { marginTop: 14, padding: '18px 16px', borderRadius: 12, background: 'var(--teal-soft)', boxShadow: 'var(--shadow-sm)' };
const errorStyle: CSSProperties = { marginTop: 14, color: '#b3261e', fontSize: 14 };

function parseNum(s: string): number | null {
  if (s.trim() === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

type Mode = 'radius' | 'diameter' | 'circumference';

export function CircleCalculatorTool() {
  const { t } = useLanguage();
  const [mode, setMode] = useState<Mode>('radius');
  const [value, setValue] = useState('7');
  const v = parseNum(value);
  const result = useMemo(() => {
    if (v === null) return null;
    if (mode === 'radius') return circleFromRadius(v);
    if (mode === 'diameter') return circleFromDiameter(v);
    return circleFromCircumference(v);
  }, [mode, v]);
  const clear = () => setValue('');
  const loadExample = () => setValue('7');
  const tabStyle = (active: boolean): CSSProperties => ({ minHeight: 40, padding: '0 14px', borderRadius: 8, border: '1px solid var(--line)', background: active ? 'var(--teal)' : 'var(--surface)', color: active ? '#fff' : 'var(--heading)', cursor: 'pointer', fontWeight: 600 });
  const labelBn = mode === 'radius' ? 'ব্যাসার্ধ' : mode === 'diameter' ? 'ব্যাস' : 'পরিধি';
  const labelEn = mode === 'radius' ? 'Radius' : mode === 'diameter' ? 'Diameter' : 'Circumference';

  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="বৃত্ত ক্যালকুলেটর" titleEn="Circle Calculator" descBn="ব্যাসার্ধ, ব্যাস বা পরিধি থেকে বৃত্তের সব মাপ বের করুন।" descEn="Find every measurement of a circle from its radius, diameter or circumference." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <button type="button" style={tabStyle(mode === 'radius')} onClick={() => setMode('radius')}>{t({ bn: 'ব্যাসার্ধ থেকে', en: 'From radius' })}</button>
        <button type="button" style={tabStyle(mode === 'diameter')} onClick={() => setMode('diameter')}>{t({ bn: 'ব্যাস থেকে', en: 'From diameter' })}</button>
        <button type="button" style={tabStyle(mode === 'circumference')} onClick={() => setMode('circumference')}>{t({ bn: 'পরিধি থেকে', en: 'From circumference' })}</button>
      </div>
      <div>
        <label style={labelStyle} htmlFor="circle-value">{t({ bn: labelBn, en: labelEn })}</label>
        <input id="circle-value" style={shortInputStyle} type="number" min="0" step="any" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} placeholder="7" />
      </div>
      {result ? (
        <>
          <div style={resultStyle} role="status">
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{t({ bn: 'বৃত্তের ক্ষেত্রফল', en: 'Area of the circle' })}</p>
            <p style={{ margin: 0, fontSize: '2rem', fontFamily: 'var(--font-head)', color: 'var(--teal-deep)' }}>{result.area}</p>
            <p style={{ margin: '8px 0 0', fontSize: 15 }}>{t({ bn: `পরিধি: ${result.circumference} • ব্যাস: ${result.diameter}`, en: `Circumference: ${result.circumference} • Diameter: ${result.diameter}` })}</p>
          </div>
          <Tiles items={[
            { labelBn: 'ব্যাসার্ধ', labelEn: 'Radius', value: `${result.radius}` },
            { labelBn: 'ব্যাস', labelEn: 'Diameter', value: `${result.diameter}` },
            { labelBn: 'পরিধি', labelEn: 'Circumference', value: `${result.circumference}` },
            { labelBn: 'ক্ষেত্রফল', labelEn: 'Area', value: `${result.area}` },
          ]} />
          <ButtonRow><CopyButton text={`Circle: radius ${result.radius}, diameter ${result.diameter}, circumference ${result.circumference}, area ${result.area}`} labelBn="ফলাফল কপি করুন" labelEn="Copy result" /><ClearButton onClear={clear} /><ExampleButton onLoad={loadExample} /></ButtonRow>
        </>
      ) : (
        <p style={errorStyle} role="alert">{t({ bn: '০-এর বেশি একটি সঠিক সংখ্যা দিন।', en: 'Enter a valid number above 0.' })}</p>
      )}
      <p style={noteStyle}>{t({ bn: 'সূত্র: ব্যাস = ২ × ব্যাসার্ধ, পরিধি = ২π × ব্যাসার্ধ, ক্ষেত্রফল = π × ব্যাসার্ধ²।', en: 'Formulas: diameter = 2 × radius, circumference = 2π × radius, area = π × radius².' })}</p>
    </section>
  );
}
