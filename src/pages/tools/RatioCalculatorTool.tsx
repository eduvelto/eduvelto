// Eduvelto — Ratio Calculator tool UI (Math batch, 27 Nov 2026).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Engine: simplifyRatio + solveRatio in src/lib/tools/mathTools.ts.
import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, Tiles, CopyButton, ButtonRow, ClearButton, ExampleButton, shortInputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { simplifyRatio, solveRatio } from '../../lib/tools/mathTools';

const resultStyle: CSSProperties = { marginTop: 14, padding: '18px 16px', borderRadius: 12, background: 'var(--teal-soft)', boxShadow: 'var(--shadow-sm)' };
const errorStyle: CSSProperties = { marginTop: 14, color: '#b3261e', fontSize: 14 };
const gridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 };

function parseNum(s: string): number | null {
  if (s.trim() === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
function parseIntOrNull(s: string): number | null {
  if (s.trim() === '') return null;
  const n = Number(s);
  return Number.isInteger(n) ? n : null;
}

export function RatioCalculatorTool() {
  const { t } = useLanguage();
  const [mode, setMode] = useState<'simplify' | 'solve'>('simplify');
  const [a, setA] = useState('12');
  const [b, setB] = useState('18');
  const [c, setC] = useState('4');
  const ai = parseIntOrNull(a);
  const bi = parseIntOrNull(b);
  const cn = parseNum(c);
  const simplified = useMemo(() => (ai !== null && bi !== null ? simplifyRatio(ai, bi) : null), [ai, bi]);
  const solved = useMemo(() => (mode === 'solve' && ai !== null && bi !== null && cn !== null ? solveRatio(ai, bi, cn) : null), [mode, ai, bi, cn]);
  const clear = () => { setA(''); setB(''); setC(''); };
  const loadExample = () => { setA('12'); setB('18'); setC('4'); setMode('simplify'); };
  const tabStyle = (active: boolean): CSSProperties => ({ minHeight: 40, padding: '0 14px', borderRadius: 8, border: '1px solid var(--line)', background: active ? 'var(--teal)' : 'var(--surface)', color: active ? '#fff' : 'var(--heading)', cursor: 'pointer', fontWeight: 600 });

  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="অনুপাত ক্যালকুলেটর" titleEn="Ratio Calculator" descBn="অনুপাত সরল করুন, অথবা অনুপাতের অনুপস্থিত পদটি বের করুন।" descEn="Simplify a ratio, or solve for a missing term in a ratio." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <button type="button" style={tabStyle(mode === 'simplify')} onClick={() => setMode('simplify')}>{t({ bn: 'অনুপাত সরল করুন', en: 'Simplify ratio' })}</button>
        <button type="button" style={tabStyle(mode === 'solve')} onClick={() => setMode('solve')}>{t({ bn: 'অনুপস্থিত পদ বের করুন', en: 'Find missing term' })}</button>
      </div>
      <div style={gridStyle}>
        <div>
          <label style={labelStyle} htmlFor="ratio-a">{t({ bn: 'প্রথম পদ', en: 'First term' })}</label>
          <input id="ratio-a" style={shortInputStyle} type="number" step="1" inputMode="numeric" value={a} onChange={(e) => setA(e.target.value)} placeholder="12" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="ratio-b">{t({ bn: 'দ্বিতীয় পদ', en: 'Second term' })}</label>
          <input id="ratio-b" style={shortInputStyle} type="number" step="1" inputMode="numeric" value={b} onChange={(e) => setB(e.target.value)} placeholder="18" />
        </div>
        {mode === 'solve' ? (
          <div>
            <label style={labelStyle} htmlFor="ratio-c">{t({ bn: 'নতুন প্রথম পদ', en: 'New first term' })}</label>
            <input id="ratio-c" style={shortInputStyle} type="number" step="any" inputMode="decimal" value={c} onChange={(e) => setC(e.target.value)} placeholder="4" />
          </div>
        ) : null}
      </div>
      {mode === 'simplify' && simplified ? (
        <>
          <div style={resultStyle} role="status">
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{t({ bn: 'সরল অনুপাত', en: 'Simplified ratio' })}</p>
            <p style={{ margin: 0, fontSize: '2rem', fontFamily: 'var(--font-head)', color: 'var(--teal-deep)' }}>{simplified.text}</p>
          </div>
          <Tiles items={[
            { labelBn: 'আসল অনুপাত', labelEn: 'Original ratio', value: `${a} : ${b}` },
            { labelBn: 'সরল অনুপাত', labelEn: 'Simplified ratio', value: simplified.text },
          ]} />
          <ButtonRow><CopyButton text={`Ratio ${a}:${b} simplifies to ${simplified.text}`} labelBn="ফলাফল কপি করুন" labelEn="Copy result" /><ClearButton onClear={clear} /><ExampleButton onLoad={loadExample} /></ButtonRow>
        </>
      ) : null}
      {mode === 'solve' && solved !== null ? (
        <>
          <div style={resultStyle} role="status">
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{t({ bn: 'অনুপস্থিত পদ', en: 'Missing term' })}</p>
            <p style={{ margin: 0, fontSize: '2rem', fontFamily: 'var(--font-head)', color: 'var(--teal-deep)' }}>{solved}</p>
            <p style={{ margin: '8px 0 0', fontSize: 15 }}>{t({ bn: `${a} : ${b} = ${c} : ${solved}`, en: `${a} : ${b} = ${c} : ${solved}` })}</p>
          </div>
          <ButtonRow><CopyButton text={`${a}:${b} = ${c}:${solved}`} labelBn="ফলাফল কপি করুন" labelEn="Copy result" /><ClearButton onClear={clear} /><ExampleButton onLoad={loadExample} /></ButtonRow>
        </>
      ) : null}
      {((mode === 'simplify' && !simplified) || (mode === 'solve' && solved === null)) ? (
        <p style={errorStyle} role="alert">{t({ bn: 'সঠিক পূর্ণসংখ্যা দিন — অনুপাতের কোনো পদই ০ হতে পারবে না।', en: 'Enter whole numbers — no ratio term can be 0.' })}</p>
      ) : null}
      <p style={noteStyle}>{t({ bn: 'অনুপাত সরল করতে দুটি পদকেই তাদের গরিষ্ঠ সাধারণ গুণনীয়ক দিয়ে ভাগ করা হয়। অনুপস্থিত পদ বের করতে বজ্রগুণন (cross-multiplication) ব্যবহার করা হয়।', en: 'To simplify a ratio both terms are divided by their greatest common divisor. Cross-multiplication finds the missing term.' })}</p>
    </section>
  );
}
