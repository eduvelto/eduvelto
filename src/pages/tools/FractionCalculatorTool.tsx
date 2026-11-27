// Eduvelto — Fraction Calculator tool UI (Math batch, 27 Nov 2026).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Engine: fractionAdd/Subtract/Multiply/Divide in src/lib/tools/mathTools.ts.
import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, Tiles, CopyButton, ButtonRow, ClearButton, ExampleButton, shortInputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { fractionAdd, fractionSubtract, fractionMultiply, fractionDivide } from '../../lib/tools/mathTools';

const resultStyle: CSSProperties = { marginTop: 14, padding: '18px 16px', borderRadius: 12, background: 'var(--teal-soft)', boxShadow: 'var(--shadow-sm)' };
const errorStyle: CSSProperties = { marginTop: 14, color: '#b3261e', fontSize: 14 };
const gridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 };

function parseIntOrNull(s: string): number | null {
  if (s.trim() === '') return null;
  const n = Number(s);
  return Number.isInteger(n) ? n : null;
}

type Op = 'add' | 'sub' | 'mul' | 'div';
const OP_SYMBOL: Record<Op, string> = { add: '+', sub: '−', mul: '×', div: '÷' };

export function FractionCalculatorTool() {
  const { t } = useLanguage();
  const [op, setOp] = useState<Op>('add');
  const [aNum, setANum] = useState('1');
  const [aDen, setADen] = useState('2');
  const [bNum, setBNum] = useState('1');
  const [bDen, setBDen] = useState('3');
  const an = parseIntOrNull(aNum);
  const ad = parseIntOrNull(aDen);
  const bn = parseIntOrNull(bNum);
  const bd = parseIntOrNull(bDen);
  const result = useMemo(() => {
    if (an === null || ad === null || bn === null || bd === null) return null;
    if (op === 'add') return fractionAdd(an, ad, bn, bd);
    if (op === 'sub') return fractionSubtract(an, ad, bn, bd);
    if (op === 'mul') return fractionMultiply(an, ad, bn, bd);
    return fractionDivide(an, ad, bn, bd);
  }, [an, ad, bn, bd, op]);
  const clear = () => { setANum(''); setADen(''); setBNum(''); setBDen(''); };
  const loadExample = () => { setANum('1'); setADen('2'); setBNum('1'); setBDen('3'); setOp('add'); };

  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="ভগ্নাংশ ক্যালকুলেটর" titleEn="Fraction Calculator" descBn="দুটি ভগ্নাংশ যোগ, বিয়োগ, গুণ বা ভাগ করুন — ফলাফল সরলীকৃত আকারে ও মিশ্র ভগ্নাংশে দেখাবে।" descEn="Add, subtract, multiply or divide two fractions — the result is simplified and shown as a mixed number when needed." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {(['add', 'sub', 'mul', 'div'] as Op[]).map((o) => (
          <button key={o} type="button" style={{ ...shortInputStyle, minHeight: 40, width: 'auto', padding: '0 16px', cursor: 'pointer', background: op === o ? 'var(--teal)' : 'var(--surface)', color: op === o ? '#fff' : 'var(--heading)', fontWeight: 600 }} onClick={() => setOp(o)}>{OP_SYMBOL[o]}</button>
        ))}
      </div>
      <div style={gridStyle}>
        <div>
          <label style={labelStyle} htmlFor="frac-a-num">{t({ bn: 'প্রথম ভগ্নাংশের লব', en: 'First fraction numerator' })}</label>
          <input id="frac-a-num" style={shortInputStyle} type="number" step="1" inputMode="numeric" value={aNum} onChange={(e) => setANum(e.target.value)} placeholder="1" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="frac-a-den">{t({ bn: 'প্রথম ভগ্নাংশের হর', en: 'First fraction denominator' })}</label>
          <input id="frac-a-den" style={shortInputStyle} type="number" step="1" inputMode="numeric" value={aDen} onChange={(e) => setADen(e.target.value)} placeholder="2" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="frac-b-num">{t({ bn: 'দ্বিতীয় ভগ্নাংশের লব', en: 'Second fraction numerator' })}</label>
          <input id="frac-b-num" style={shortInputStyle} type="number" step="1" inputMode="numeric" value={bNum} onChange={(e) => setBNum(e.target.value)} placeholder="1" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="frac-b-den">{t({ bn: 'দ্বিতীয় ভগ্নাংশের হর', en: 'Second fraction denominator' })}</label>
          <input id="frac-b-den" style={shortInputStyle} type="number" step="1" inputMode="numeric" value={bDen} onChange={(e) => setBDen(e.target.value)} placeholder="3" />
        </div>
      </div>
      {result ? (
        <>
          <div style={resultStyle} role="status">
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{t({ bn: 'ফলাফল', en: 'Result' })}</p>
            <p style={{ margin: 0, fontSize: '2rem', fontFamily: 'var(--font-head)', color: 'var(--teal-deep)' }}>{result.text}</p>
            <p style={{ margin: '8px 0 0', fontSize: 15 }}>{t({ bn: `দশমিকে: ${result.decimal}`, en: `As a decimal: ${result.decimal}` })}</p>
          </div>
          <Tiles items={[
            { labelBn: 'সরলীকৃত ভগ্নাংশ', labelEn: 'Simplified fraction', value: `${result.num}/${result.den}` },
            { labelBn: 'দশমিক মান', labelEn: 'Decimal value', value: `${result.decimal}` },
          ]} />
          <ButtonRow><CopyButton text={`${aNum}/${aDen} ${OP_SYMBOL[op]} ${bNum}/${bDen} = ${result.text} (${result.decimal})`} labelBn="ফলাফল কপি করুন" labelEn="Copy result" /><ClearButton onClear={clear} /><ExampleButton onLoad={loadExample} /></ButtonRow>
        </>
      ) : (
        <p style={errorStyle} role="alert">{t({ bn: 'সঠিক পূর্ণসংখ্যা দিন — হর ০ হতে পারবে না, আর ভাগের ক্ষেত্রে দ্বিতীয় ভগ্নাংশের লবও ০ হতে পারবে না।', en: 'Enter whole numbers — denominators cannot be 0, and for division the second numerator cannot be 0 either.' })}</p>
      )}
      <p style={noteStyle}>{t({ bn: 'ফলাফল সর্বদা সবচেয়ে ছোট আকারে সরল করা হয়। যেমন ২/৪ লিখলে ফলাফলে ১/২ দেখাবে।', en: 'The result is always simplified to lowest terms. For example 2/4 is shown as 1/2.' })}</p>
    </section>
  );
}
