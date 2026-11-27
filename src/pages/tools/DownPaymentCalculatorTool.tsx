// Eduvelto — Down Payment Calculator tool UI.
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Engine: calculateDownPayment() in src/lib/tools/financeHealthTools.ts. 100% in-browser.
import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, Tiles, CopyButton, ButtonRow, ClearButton, ExampleButton, shortInputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { calculateDownPayment } from '../../lib/tools/financeHealthTools';

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

export function DownPaymentCalculatorTool() {
  const { t } = useLanguage();
  const [price, setPrice] = useState('1000000');
  const [percent, setPercent] = useState('20');
  const [rate, setRate] = useState('12');
  const [years, setYears] = useState('5');
  const p = parseNum(price);
  const dp = parseNum(percent);
  const r = parseNum(rate);
  const y = parseNum(years);
  const result = useMemo(
    () => (p !== null && dp !== null ? calculateDownPayment(p, dp, r ?? undefined, y ?? undefined) : null),
    [p, dp, r, y],
  );
  const loadExample = () => { setPrice('1000000'); setPercent('20'); setRate('12'); setYears('5'); };
  const clear = () => { setPrice(''); setPercent(''); setRate(''); setYears(''); };

  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="ডাউন পেমেন্ট ক্যালকুলেটর" titleEn="Down Payment Calculator" descBn="দাম ও শতাংশ থেকে অগ্রিম কত দিতে হবে, কত ঋণ থাকবে ও মাসিক কিস্তি কত হতে পারে তা দেখুন।" descEn="Work out the down payment, the remaining loan and a monthly EMI preview from price and percentage." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <div>
          <label style={labelStyle} htmlFor="dp-price">{t({ bn: 'মোট দাম (টাকা)', en: 'Total price (taka)' })}</label>
          <input id="dp-price" style={shortInputStyle} type="number" min="0" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="1000000" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="dp-percent">{t({ bn: 'ডাউন পেমেন্ট (%)', en: 'Down payment (%)' })}</label>
          <input id="dp-percent" style={shortInputStyle} type="number" min="0" max="100" step="0.1" inputMode="decimal" value={percent} onChange={(e) => setPercent(e.target.value)} placeholder="20" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="dp-rate">{t({ bn: 'বার্ষিক সুদের হার (%) — কিস্তির জন্য', en: 'Annual interest rate (%) — for EMI preview' })}</label>
          <input id="dp-rate" style={shortInputStyle} type="number" min="0" step="0.1" inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="12" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="dp-years">{t({ bn: 'মেয়াদ (বছর) — কিস্তির জন্য', en: 'Term (years) — for EMI preview' })}</label>
          <input id="dp-years" style={shortInputStyle} type="number" min="0" step="0.5" inputMode="decimal" value={years} onChange={(e) => setYears(e.target.value)} placeholder="5" />
        </div>
      </div>
      {result ? (
        <>
          <div style={resultStyle} role="status">
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{t({ bn: 'ডাউন পেমেন্ট', en: 'Down payment' })}</p>
            <p style={{ margin: 0, fontSize: '2rem', fontFamily: 'var(--font-head)', color: 'var(--teal-deep)' }}>{fmtMoney(result.downPayment)}</p>
            <p style={{ margin: '8px 0 0', fontSize: 15 }}>{t({ bn: `বাকি ঋণ: ${fmtMoney(result.loanAmount)}`, en: `Remaining loan: ${fmtMoney(result.loanAmount)}` })}</p>
          </div>
          <Tiles items={[
            { labelBn: 'মোট দাম', labelEn: 'Total price', value: fmtMoney(p ?? 0) },
            { labelBn: 'বাকি ঋণ', labelEn: 'Remaining loan', value: fmtMoney(result.loanAmount) },
            { labelBn: 'মাসিক কিস্তি (আনুমানিক)', labelEn: 'Monthly EMI (preview)', value: result.monthlyEmi !== null ? fmtMoney(result.monthlyEmi) : '—' },
          ]} />
          <ButtonRow>
            <CopyButton text={`Down payment ${fmtMoney(result.downPayment)}, loan ${fmtMoney(result.loanAmount)}`} labelBn="ফলাফল কপি করুন" labelEn="Copy result" />
            <ExampleButton onLoad={loadExample} />
            <ClearButton onClear={clear} />
          </ButtonRow>
        </>
      ) : (
        <p style={errorStyle} role="alert">{t({ bn: 'সঠিক মান দিন — দাম ০-এর বেশি, শতাংশ ০ থেকে ১০০-এর মধ্যে; সুদ ও মেয়াদ একসঙ্গে দিন বা দুটোই ফাঁকা রাখুন।', en: 'Enter valid values — price above 0, percentage 0–100; give rate and term together, or leave both blank.' })}</p>
      )}
      <p style={noteStyle}>{t({ bn: 'কিস্তির হিসাব শুধু ধারণা দেওয়ার জন্য — ব্যাংকের আসল সুদ, ফি ও শর্ত আলাদা হতে পারে। সুদ ও মেয়াদ ফাঁকা রাখলে শুধু ডাউন পেমেন্ট ও ঋণ দেখাবে।', en: 'The EMI preview is only a guide — a bank’s real rate, fees and terms may differ. Leave rate and term blank to see just the down payment and loan.' })}</p>
    </section>
  );
}
