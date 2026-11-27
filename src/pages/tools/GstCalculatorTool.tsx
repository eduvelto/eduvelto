// Eduvelto — GST / VAT Calculator tool UI.
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Engine: calculateGst() in src/lib/tools/financeHealthTools.ts. 100% in-browser.
import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, Tiles, CopyButton, ButtonRow, ClearButton, ExampleButton, shortInputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { calculateGst } from '../../lib/tools/financeHealthTools';

const resultStyle: CSSProperties = {
  marginTop: 14,
  padding: '18px 16px',
  borderRadius: 12,
  background: 'var(--teal-soft)',
  boxShadow: 'var(--shadow-sm)',
};

const errorStyle: CSSProperties = {
  marginTop: 14,
  color: '#b3261e',
  fontSize: 14,
};

function parseNum(s: string): number | null {
  if (s.trim() === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

const fmtMoney = (n: number): string => `৳${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;

export function GstCalculatorTool() {
  const { t } = useLanguage();
  const [mode, setMode] = useState<'add' | 'remove'>('add');
  const [amount, setAmount] = useState('1000');
  const [rate, setRate] = useState('15');
  const a = parseNum(amount);
  const r = parseNum(rate);
  const result = useMemo(() => (a !== null && r !== null ? calculateGst(a, r, mode) : null), [a, r, mode]);
  const loadExample = () => { setMode('add'); setAmount('1000'); setRate('15'); };
  const clear = () => { setAmount(''); setRate(''); };

  const tabStyle = (active: boolean): CSSProperties => ({
    minHeight: 40, padding: '0 14px', borderRadius: 8, border: '1px solid var(--line)',
    background: active ? 'var(--teal)' : 'var(--surface)', color: active ? '#fff' : 'var(--heading)', cursor: 'pointer', fontWeight: 600,
  });

  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="জিএসটি / ভ্যাট ক্যালকুলেটর" titleEn="GST / VAT Calculator" descBn="দামের সঙ্গে কর যোগ করুন বা করসহ দাম থেকে করের অংশ আলাদা করুন।" descEn="Add tax to a price, or split the tax out of a tax-inclusive price." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <button type="button" style={tabStyle(mode === 'add')} onClick={() => setMode('add')}>{t({ bn: 'কর যোগ করুন', en: 'Add tax' })}</button>
        <button type="button" style={tabStyle(mode === 'remove')} onClick={() => setMode('remove')}>{t({ bn: 'কর বাদ দিন', en: 'Remove tax' })}</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <div>
          <label style={labelStyle} htmlFor="gst-amount">{t({ bn: mode === 'add' ? 'কর ছাড়া দাম (টাকা)' : 'করসহ দাম (টাকা)', en: mode === 'add' ? 'Price without tax (taka)' : 'Price including tax (taka)' })}</label>
          <input id="gst-amount" style={shortInputStyle} type="number" min="0" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="1000" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="gst-rate">{t({ bn: 'করের হার (%) — আপনি নিজে দিন', en: 'Tax rate (%) — enter it yourself' })}</label>
          <input id="gst-rate" style={shortInputStyle} type="number" min="0" max="100" step="0.1" inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="15" />
        </div>
      </div>
      {result ? (
        <>
          <div style={resultStyle} role="status">
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{t({ bn: 'করের পরিমাণ', en: 'Tax amount' })}</p>
            <p style={{ margin: 0, fontSize: '2rem', fontFamily: 'var(--font-head)', color: 'var(--teal-deep)' }}>{fmtMoney(result.tax)}</p>
            <p style={{ margin: '8px 0 0', fontSize: 15 }}>{t({ bn: `মোট দাম: ${fmtMoney(result.total)}`, en: `Total price: ${fmtMoney(result.total)}` })}</p>
          </div>
          <Tiles items={[
            { labelBn: 'কর ছাড়া দাম', labelEn: 'Price without tax', value: fmtMoney(result.base) },
            { labelBn: 'কর', labelEn: 'Tax', value: fmtMoney(result.tax) },
            { labelBn: 'করসহ দাম', labelEn: 'Price with tax', value: fmtMoney(result.total) },
          ]} />
          <ButtonRow>
            <CopyButton text={`Tax ${fmtMoney(result.tax)}, total ${fmtMoney(result.total)}`} labelBn="ফলাফল কপি করুন" labelEn="Copy result" />
            <ExampleButton onLoad={loadExample} />
            <ClearButton onClear={clear} />
          </ButtonRow>
        </>
      ) : (
        <p style={errorStyle} role="alert">{t({ bn: 'সঠিক মান দিন — দাম ০ বা তার বেশি, হার ০ থেকে ১০০-এর মধ্যে হতে হবে।', en: 'Enter valid values — price 0 or above, rate between 0 and 100.' })}</p>
      )}
      <p style={noteStyle}>{t({ bn: 'বাংলাদেশে জিএসটি নয়, ভ্যাট প্রযোজ্য — তবে যোগ-বিয়োগের হিসাব একই। হারটি আপনি নিজে দেবেন; এটি কোনো সরকারি হারের তালিকা নয়।', en: 'Bangladesh uses VAT, not GST — but the add/remove-tax maths is the same. You enter the rate yourself; this is not an official rate list.' })}</p>
    </section>
  );
}
