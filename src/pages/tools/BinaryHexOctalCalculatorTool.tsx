// Eduvelto — Binary / Hex / Octal Calculator tool UI (Math batch, 27 Nov 2026).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Engine: convertBase + baseArithmetic in src/lib/tools/mathTools.ts.
import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, Tiles, CopyButton, ButtonRow, ClearButton, ExampleButton, shortInputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { convertBase, baseArithmetic } from '../../lib/tools/mathTools';

const resultStyle: CSSProperties = { marginTop: 14, padding: '18px 16px', borderRadius: 12, background: 'var(--teal-soft)', boxShadow: 'var(--shadow-sm)' };
const errorStyle: CSSProperties = { marginTop: 14, color: '#b3261e', fontSize: 14 };
const gridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 };

type Base = 2 | 8 | 10 | 16;
const BASES: Array<{ id: Base; bn: string; en: string }> = [
  { id: 2, bn: 'বাইনারি (২)', en: 'Binary (2)' },
  { id: 8, bn: 'অক্টাল (৮)', en: 'Octal (8)' },
  { id: 10, bn: 'দশমিক (১০)', en: 'Decimal (10)' },
  { id: 16, bn: 'হেক্স (১৬)', en: 'Hexadecimal (16)' },
];

export function BinaryHexOctalCalculatorTool() {
  const { t } = useLanguage();
  const [base, setBase] = useState<Base>(2);
  const [value, setValue] = useState('1010');
  const [a, setA] = useState('1010');
  const [b, setB] = useState('1100');
  const [op, setOp] = useState<'add' | 'subtract'>('add');
  const converted = useMemo(() => convertBase(value, base), [value, base]);
  const calc = useMemo(() => baseArithmetic(a, b, op, base), [a, b, op, base]);
  const clear = () => { setValue(''); setA(''); setB(''); };
  const loadExample = () => { setBase(2); setValue('1010'); setA('1010'); setB('1100'); setOp('add'); };

  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="বাইনারি / হেক্স / অক্টাল ক্যালকুলেটর" titleEn="Binary / Hex / Octal Calculator" descBn="বাইনারি, অক্টাল, দশমিক ও হেক্সের মধ্যে রূপান্তর করুন, আর একই ভিত্তিতে যোগ-বিয়োগ করুন।" descEn="Convert between binary, octal, decimal and hex, and add or subtract in the same base." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle} htmlFor="base-from">{t({ bn: 'ভিত্তি', en: 'Base' })}</label>
        <select id="base-from" style={shortInputStyle} value={base} onChange={(e) => { const nb = Number(e.target.value) as Base; setBase(nb); }}>
          {BASES.map((x) => <option key={x.id} value={x.id}>{t({ bn: x.bn, en: x.en })}</option>)}
        </select>
      </div>
      <div>
        <label style={labelStyle} htmlFor="base-value">{t({ bn: 'সংখ্যা', en: 'Number' })}</label>
        <input id="base-value" style={shortInputStyle} type="text" inputMode="text" value={value} onChange={(e) => setValue(e.target.value)} placeholder="1010" />
      </div>
      {converted ? (
        <>
          <div style={resultStyle} role="status">
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{t({ bn: 'দশমিক মান', en: 'Decimal value' })}</p>
            <p style={{ margin: 0, fontSize: '2rem', fontFamily: 'var(--font-head)', color: 'var(--teal-deep)' }}>{converted.decimal}</p>
          </div>
          <Tiles items={[
            { labelBn: 'বাইনারি', labelEn: 'Binary', value: converted.binary },
            { labelBn: 'অক্টাল', labelEn: 'Octal', value: converted.octal },
            { labelBn: 'দশমিক', labelEn: 'Decimal', value: `${converted.decimal}` },
            { labelBn: 'হেক্স', labelEn: 'Hexadecimal', value: converted.hex },
          ]} />
        </>
      ) : (
        <p style={errorStyle} role="alert">{t({ bn: 'নির্বাচিত ভিত্তির জন্য সঠিক অঙ্ক দিন — বাইনারিতে শুধু ০/১, অক্টালে ০–৭, হেক্সে ০–৯ ও A–F।', en: 'Enter valid digits for the chosen base — binary takes only 0/1, octal 0–7, hex 0–9 and A–F.' })}</p>
      )}
      <div style={{ marginTop: 16 }}>
        <p style={{ fontSize: 14, fontWeight: 700, margin: '0 0 8px' }}>{t({ bn: 'একই ভিত্তিতে যোগ / বিয়োগ', en: 'Add / subtract in the same base' })}</p>
        <div style={gridStyle}>
          <div>
            <label style={labelStyle} htmlFor="base-a">{t({ bn: 'প্রথম সংখ্যা', en: 'First number' })}</label>
            <input id="base-a" style={shortInputStyle} type="text" inputMode="text" value={a} onChange={(e) => setA(e.target.value)} placeholder="1010" />
          </div>
          <div>
            <label style={labelStyle} htmlFor="base-b">{t({ bn: 'দ্বিতীয় সংখ্যা', en: 'Second number' })}</label>
            <input id="base-b" style={shortInputStyle} type="text" inputMode="text" value={b} onChange={(e) => setB(e.target.value)} placeholder="1100" />
          </div>
          <div>
            <label style={labelStyle} htmlFor="base-op">{t({ bn: 'অপারেশন', en: 'Operation' })}</label>
            <select id="base-op" style={shortInputStyle} value={op} onChange={(e) => setOp(e.target.value as 'add' | 'subtract')}>
              <option value="add">{t({ bn: 'যোগ (+)', en: 'Add (+)' })}</option>
              <option value="subtract">{t({ bn: 'বিয়োগ (−)', en: 'Subtract (−)' })}</option>
            </select>
          </div>
        </div>
        {calc ? (
          <Tiles items={[
            { labelBn: 'ফলাফল (বাইনারি)', labelEn: 'Result (binary)', value: calc.binary },
            { labelBn: 'ফলাফল (অক্টাল)', labelEn: 'Result (octal)', value: calc.octal },
            { labelBn: 'ফলাফল (দশমিক)', labelEn: 'Result (decimal)', value: `${calc.decimal}` },
            { labelBn: 'ফলাফল (হেক্স)', labelEn: 'Result (hex)', value: calc.hex },
          ]} />
        ) : (
          <p style={errorStyle} role="alert">{t({ bn: 'সঠিক সংখ্যা দিন — বিয়োগের ফলাফল ঋণাত্মক হতে পারবে না।', en: 'Enter valid numbers — a subtraction result cannot be negative.' })}</p>
        )}
      </div>
      <ButtonRow><CopyButton text={converted ? `Binary ${converted.binary}, octal ${converted.octal}, decimal ${converted.decimal}, hex ${converted.hex}` : ''} labelBn="ফলাফল কপি করুন" labelEn="Copy result" /><ClearButton onClear={clear} /><ExampleButton onLoad={loadExample} /></ButtonRow>
      <p style={noteStyle}>{t({ bn: 'শুধু ধনাত্মক পূর্ণসংখ্যা সমর্থিত, নিরাপদ সীমার মধ্যে (২⁵³-এর কম)। হেক্সে A–F বড় বা ছোট যেকোনো হাতের অক্ষরে লেখা যায়।', en: 'Only non-negative whole numbers are supported, within the safe range (below 2⁵³). Hex letters A–F can be upper- or lowercase.' })}</p>
    </section>
  );
}
