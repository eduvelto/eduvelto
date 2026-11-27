// Eduvelto — Auto Loan Calculator tool UI.
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Engine: calculateAutoLoan() in src/lib/tools/financeHealthTools.ts. 100% in-browser.
import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, Tiles, CopyButton, ButtonRow, ClearButton, ExampleButton, shortInputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { calculateAutoLoan } from '../../lib/tools/financeHealthTools';

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

export function AutoLoanCalculatorTool() {
  const { t } = useLanguage();
  const [price, setPrice] = useState('1000000');
  const [down, setDown] = useState('100000');
  const [rate, setRate] = useState('10');
  const [years, setYears] = useState('5');
  const p = parseNum(price);
  const d = parseNum(down);
  const r = parseNum(rate);
  const y = parseNum(years);
  const result = useMemo(
    () => (p !== null && d !== null && r !== null && y !== null ? calculateAutoLoan(p, d, r, y) : null),
    [p, d, r, y],
  );
  const loadExample = () => { setPrice('1000000'); setDown('100000'); setRate('10'); setYears('5'); };
  const clear = () => { setPrice(''); setDown(''); setRate(''); setYears(''); };

  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="গাড়ির ঋণ ক্যালকুলেটর" titleEn="Auto Loan Calculator" descBn="গাড়ির দাম, ডাউন পেমেন্ট, সুদ ও মেয়াদ থেকে মাসিক কিস্তি ও মোট সুদ দেখুন।" descEn="Work out the monthly payment and total interest for a car loan." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <div>
          <label style={labelStyle} htmlFor="al-price">{t({ bn: 'গাড়ির দাম (টাকা)', en: 'Car price (taka)' })}</label>
          <input id="al-price" style={shortInputStyle} type="number" min="0" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="1000000" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="al-down">{t({ bn: 'ডাউন পেমেন্ট (টাকা)', en: 'Down payment (taka)' })}</label>
          <input id="al-down" style={shortInputStyle} type="number" min="0" inputMode="decimal" value={down} onChange={(e) => setDown(e.target.value)} placeholder="100000" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="al-rate">{t({ bn: 'বার্ষিক সুদের হার (%)', en: 'Annual interest rate (%)' })}</label>
          <input id="al-rate" style={shortInputStyle} type="number" min="0" step="0.1" inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="10" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="al-years">{t({ bn: 'মেয়াদ (বছর)', en: 'Term (years)' })}</label>
          <input id="al-years" style={shortInputStyle} type="number" min="0" step="0.5" inputMode="decimal" value={years} onChange={(e) => setYears(e.target.value)} placeholder="5" />
        </div>
      </div>
      {result ? (
        <>
          <div style={resultStyle} role="status">
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{t({ bn: 'মাসিক কিস্তি', en: 'Monthly payment' })}</p>
            <p style={{ margin: 0, fontSize: '2rem', fontFamily: 'var(--font-head)', color: 'var(--teal-deep)' }}>{fmtMoney(result.monthlyPayment)}</p>
            <p style={{ margin: '8px 0 0', fontSize: 15 }}>{t({ bn: `মোট সুদ: ${fmtMoney(result.totalInterest)}`, en: `Total interest: ${fmtMoney(result.totalInterest)}` })}</p>
          </div>
          <Tiles items={[
            { labelBn: 'ঋণের পরিমাণ', labelEn: 'Loan amount', value: fmtMoney(result.loanAmount) },
            { labelBn: 'মোট পরিশোধ', labelEn: 'Total payment', value: fmtMoney(result.totalPayment) },
            { labelBn: 'মোট সুদ', labelEn: 'Total interest', value: fmtMoney(result.totalInterest) },
          ]} />
          <ButtonRow>
            <CopyButton text={`Auto loan EMI ${fmtMoney(result.monthlyPayment)}/month, total interest ${fmtMoney(result.totalInterest)}`} labelBn="ফলাফল কপি করুন" labelEn="Copy result" />
            <ExampleButton onLoad={loadExample} />
            <ClearButton onClear={clear} />
          </ButtonRow>
        </>
      ) : (
        <p style={errorStyle} role="alert">{t({ bn: 'সঠিক মান দিন — দাম ০-এর বেশি, ডাউন পেমেন্ট দামের চেয়ে কম, সুদ ০ বা তার বেশি ও মেয়াদ ০-এর বেশি হতে হবে।', en: 'Enter valid values — price above 0, down payment below the price, rate 0 or above, term above 0.' })}</p>
      )}
      <p style={noteStyle}>{t({ bn: 'এটি একটি ধারণামূলক হিসাব — ব্যাংকের আসল সুদ, প্রসেসিং ফি, বীমা ও শর্ত আলাদা হতে পারে। ঋণ নেওয়ার আগে ব্যাংকের কাছ থেকে লিখিত হিসাব নিন।', en: 'This is a guide only — a bank’s real rate, processing fees, insurance and terms may differ. Get a written quote from the bank before borrowing.' })}</p>
    </section>
  );
}
