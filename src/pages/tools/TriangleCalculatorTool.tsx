// Eduvelto — Triangle Calculator tool UI (Math batch, 27 Nov 2026).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Engine: solveTriangle in src/lib/tools/mathTools.ts.
// Modes: SSS (three sides), SAS (two sides + included angle), ASA (two angles + one side).
import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, Tiles, CopyButton, ButtonRow, ClearButton, ExampleButton, shortInputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { solveTriangle } from '../../lib/tools/mathTools';

const resultStyle: CSSProperties = { marginTop: 14, padding: '18px 16px', borderRadius: 12, background: 'var(--teal-soft)', boxShadow: 'var(--shadow-sm)' };
const errorStyle: CSSProperties = { marginTop: 14, color: '#b3261e', fontSize: 14 };
const gridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 };

function parseNum(s: string): number | null {
  if (s.trim() === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

type Mode = 'sss' | 'sas' | 'asa';

export function TriangleCalculatorTool() {
  const { t } = useLanguage();
  const [mode, setMode] = useState<Mode>('sss');
  const [a, setA] = useState('3');
  const [b, setB] = useState('4');
  const [c, setC] = useState('5');
  const [A, setAang] = useState('30');
  const [B, setBang] = useState('60');
  const [cAngle, setCAngle] = useState('90');
  const result = useMemo(() => {
    if (mode === 'sss') return solveTriangle({ a: parseNum(a) ?? undefined, b: parseNum(b) ?? undefined, c: parseNum(c) ?? undefined });
    if (mode === 'sas') return solveTriangle({ a: parseNum(a) ?? undefined, b: parseNum(b) ?? undefined, C: parseNum(cAngle) ?? undefined });
    return solveTriangle({ A: parseNum(A) ?? undefined, B: parseNum(B) ?? undefined, c: parseNum(c) ?? undefined });
  }, [mode, a, b, c, A, B, cAngle]);
  const clear = () => { setA(''); setB(''); setC(''); setAang(''); setBang(''); setCAngle(''); };
  const loadExample = () => { setA('3'); setB('4'); setC('5'); setAang('30'); setBang('60'); setCAngle('90'); };
  const tabStyle = (active: boolean): CSSProperties => ({ minHeight: 40, padding: '0 14px', borderRadius: 8, border: '1px solid var(--line)', background: active ? 'var(--teal)' : 'var(--surface)', color: active ? '#fff' : 'var(--heading)', cursor: 'pointer', fontWeight: 600 });

  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="ত্রিভুজ ক্যালকুলেটর" titleEn="Triangle Calculator" descBn="জানা বাহু ও কোণ থেকে ত্রিভুজের বাকি বাহু ও কোণগুলো বের করুন।" descEn="Find the remaining sides and angles of a triangle from the ones you know." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <button type="button" style={tabStyle(mode === 'sss')} onClick={() => setMode('sss')}>{t({ bn: 'তিন বাহু (SSS)', en: 'Three sides (SSS)' })}</button>
        <button type="button" style={tabStyle(mode === 'sas')} onClick={() => setMode('sas')}>{t({ bn: 'দুই বাহু ও অন্তর্ভুক্ত কোণ (SAS)', en: 'Two sides + included angle (SAS)' })}</button>
        <button type="button" style={tabStyle(mode === 'asa')} onClick={() => setMode('asa')}>{t({ bn: 'দুই কোণ ও এক বাহু (ASA)', en: 'Two angles + one side (ASA)' })}</button>
      </div>
      <div style={gridStyle}>
        {mode === 'sss' ? (<>
          <div><label style={labelStyle} htmlFor="tri-a">{t({ bn: 'বাহু a', en: 'Side a' })}</label><input id="tri-a" style={shortInputStyle} type="number" min="0" step="any" inputMode="decimal" value={a} onChange={(e) => setA(e.target.value)} placeholder="3" /></div>
          <div><label style={labelStyle} htmlFor="tri-b">{t({ bn: 'বাহু b', en: 'Side b' })}</label><input id="tri-b" style={shortInputStyle} type="number" min="0" step="any" inputMode="decimal" value={b} onChange={(e) => setB(e.target.value)} placeholder="4" /></div>
          <div><label style={labelStyle} htmlFor="tri-c">{t({ bn: 'বাহু c', en: 'Side c' })}</label><input id="tri-c" style={shortInputStyle} type="number" min="0" step="any" inputMode="decimal" value={c} onChange={(e) => setC(e.target.value)} placeholder="5" /></div>
        </>) : null}
        {mode === 'sas' ? (<>
          <div><label style={labelStyle} htmlFor="tri-a">{t({ bn: 'বাহু a', en: 'Side a' })}</label><input id="tri-a" style={shortInputStyle} type="number" min="0" step="any" inputMode="decimal" value={a} onChange={(e) => setA(e.target.value)} placeholder="3" /></div>
          <div><label style={labelStyle} htmlFor="tri-b">{t({ bn: 'বাহু b', en: 'Side b' })}</label><input id="tri-b" style={shortInputStyle} type="number" min="0" step="any" inputMode="decimal" value={b} onChange={(e) => setB(e.target.value)} placeholder="4" /></div>
          <div><label style={labelStyle} htmlFor="tri-c-angle">{t({ bn: 'অন্তর্ভুক্ত কোণ C (ডিগ্রি)', en: 'Included angle C (degrees)' })}</label><input id="tri-c-angle" style={shortInputStyle} type="number" min="0" max="180" step="any" inputMode="decimal" value={cAngle} onChange={(e) => setCAngle(e.target.value)} placeholder="90" /></div>
        </>) : null}
        {mode === 'asa' ? (<>
          <div><label style={labelStyle} htmlFor="tri-A">{t({ bn: 'কোণ A (ডিগ্রি)', en: 'Angle A (degrees)' })}</label><input id="tri-A" style={shortInputStyle} type="number" min="0" max="180" step="any" inputMode="decimal" value={A} onChange={(e) => setAang(e.target.value)} placeholder="30" /></div>
          <div><label style={labelStyle} htmlFor="tri-B">{t({ bn: 'কোণ B (ডিগ্রি)', en: 'Angle B (degrees)' })}</label><input id="tri-B" style={shortInputStyle} type="number" min="0" max="180" step="any" inputMode="decimal" value={B} onChange={(e) => setBang(e.target.value)} placeholder="60" /></div>
          <div><label style={labelStyle} htmlFor="tri-c">{t({ bn: 'বাহু c (A ও B-এর মাঝের বাহু)', en: 'Side c (between A and B)' })}</label><input id="tri-c" style={shortInputStyle} type="number" min="0" step="any" inputMode="decimal" value={c} onChange={(e) => setC(e.target.value)} placeholder="5" /></div>
        </>) : null}
      </div>
      {result ? (
        <>
          <div style={resultStyle} role="status">
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{t({ bn: 'সমাধান করা ত্রিভুজ', en: 'Solved triangle' })}</p>
            <p style={{ margin: 0, fontSize: '1.4rem', fontFamily: 'var(--font-head)', color: 'var(--teal-deep)' }}>{t({ bn: `বাহু: a=${result.a}, b=${result.b}, c=${result.c}`, en: `Sides: a=${result.a}, b=${result.b}, c=${result.c}` })}</p>
            <p style={{ margin: '8px 0 0', fontSize: 15 }}>{t({ bn: `কোণ: A=${result.A}°, B=${result.B}°, C=${result.C}°`, en: `Angles: A=${result.A}°, B=${result.B}°, C=${result.C}°` })}</p>
          </div>
          <Tiles items={[
            { labelBn: 'বাহু a', labelEn: 'Side a', value: `${result.a}` },
            { labelBn: 'বাহু b', labelEn: 'Side b', value: `${result.b}` },
            { labelBn: 'বাহু c', labelEn: 'Side c', value: `${result.c}` },
            { labelBn: 'কোণ A', labelEn: 'Angle A', value: `${result.A}°` },
            { labelBn: 'কোণ B', labelEn: 'Angle B', value: `${result.B}°` },
            { labelBn: 'কোণ C', labelEn: 'Angle C', value: `${result.C}°` },
          ]} />
          <ButtonRow><CopyButton text={`Triangle: a=${result.a}, b=${result.b}, c=${result.c}; A=${result.A}°, B=${result.B}°, C=${result.C}°`} labelBn="ফলাফল কপি করুন" labelEn="Copy result" /><ClearButton onClear={clear} /><ExampleButton onLoad={loadExample} /></ButtonRow>
        </>
      ) : (
        <p style={errorStyle} role="alert">{t({ bn: 'সঠিক মান দিন — বাহুগুলোকে ত্রিভুজের অসমতা মানতে হবে (যেকোনো দুই বাহুর যোগফল তৃতীয় বাহুর চেয়ে বড়), আর কোণগুলোর যোগফল ১৮০°-এর কম হতে হবে।', en: 'Enter valid values — the sides must satisfy the triangle inequality (any two sides together longer than the third), and the angles must add up to less than 180°.' })}</p>
      )}
      <p style={noteStyle}>{t({ bn: 'তিনটি মোড: তিন বাহু (SSS), দুই বাহু ও তাদের মাঝের কোণ (SAS), অথবা দুই কোণ ও একটি বাহু (ASA)। সব কোণ ডিগ্রিতে। দুই বাহু ও একটি অ-অন্তর্ভুক্ত কোণ (SSA) দিয়ে ত্রিভুজ সবসময় একভাবে নির্ধারিত হয় না, তাই সেটি এখানে নেই।', en: 'Three modes: three sides (SSS), two sides and the angle between them (SAS), or two angles and one side (ASA). All angles are in degrees. Two sides and a non-included angle (SSA) do not always determine a unique triangle, so that case is not included.' })}</p>
    </section>
  );
}
