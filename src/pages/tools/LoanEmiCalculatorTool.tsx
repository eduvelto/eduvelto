// Eduvelto — Loan EMI Calculator tool UI (landed 27 Nov 2026, A-tools).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// D-02 fix (preferred): standalone page reusing calculateEmi() in src/lib/lifeCalculators.ts. 100% in-browser; nothing is uploaded.
import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import {ToolHero, Tiles, CopyButton, ButtonRow, inputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { calculateEmi } from '../../lib/lifeCalculators';

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



export function LoanEmiCalculatorTool() {
  const { t } = useLanguage();
  const [principal, setPrincipal] = useState('100000');
  const [rate, setRate] = useState('12');
  const [months, setMonths] = useState('12');
  const p = parseNum(principal);
  const r = parseNum(rate);
  const m = parseNum(months);
  const result = useMemo(() => (p !== null && r !== null && m !== null ? calculateEmi(p, r, Math.round(m)) : null), [p, r, m]);

  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="লোন ইএমআই ক্যালকুলেটর" titleEn="Loan EMI Calculator" descBn="লোনের পরিমাণ, সুদের হার ও মেয়াদ দিয়ে মাসিক কিস্তি (EMI) হিসাব করুন।" descEn="Calculate the monthly instalment (EMI) from a loan amount, interest rate and term." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <div>
          <label style={labelStyle} htmlFor="emi-principal">{t({ bn: 'ঋণের পরিমাণ (টাকা)', en: 'Loan amount (taka)' })}</label>
          <input id="emi-principal" style={inputStyle} type="number" min="1" inputMode="decimal" value={principal} onChange={(e) => setPrincipal(e.target.value)} placeholder="100000" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="emi-rate">{t({ bn: 'বার্ষিক সুদের হার (%)', en: 'Annual interest rate (%)' })}</label>
          <input id="emi-rate" style={inputStyle} type="number" min="0" step="0.1" inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="12" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="emi-months">{t({ bn: 'মেয়াদ (মাস)', en: 'Tenure (months)' })}</label>
          <input id="emi-months" style={inputStyle} type="number" min="1" max="600" inputMode="numeric" value={months} onChange={(e) => setMonths(e.target.value)} placeholder="12" />
        </div>
      </div>
      {result ? (
        <>
          <div style={resultStyle} role="status">
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{t({ bn: 'মাসিক কিস্তি (EMI)', en: 'Monthly EMI' })}</p>
            <p style={{ margin: 0, fontSize: '2rem', fontFamily: 'var(--font-head)', color: 'var(--teal-deep)' }}>{fmtMoney(result.emi)}</p>
            <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--muted)' }}>{t({ bn: 'সূত্র: EMI = P × r × (1+r)ⁿ ÷ ((1+r)ⁿ − 1); এখানে r = মাসিক সুদের হার, n = মাসের সংখ্যা।', en: 'Formula: EMI = P × r × (1+r)ⁿ ÷ ((1+r)ⁿ − 1), where r = monthly rate, n = number of months.' })}</p>
          </div>
          <Tiles items={[
            { labelBn: 'মোট পরিশোধ', labelEn: 'Total payment', value: fmtMoney(result.totalPayment) },
            { labelBn: 'মোট সুদ', labelEn: 'Total interest', value: fmtMoney(result.totalInterest) },
            { labelBn: 'মেয়াদ', labelEn: 'Tenure', value: `${m} ${t({ bn: 'মাস', en: 'months' })}` },
          ]} />
          <ButtonRow><CopyButton text={`EMI ${fmtMoney(result.emi)} per month, total ${fmtMoney(result.totalPayment)}, interest ${fmtMoney(result.totalInterest)}`} labelBn="ফলাফল কপি করুন" labelEn="Copy result" /></ButtonRow>
        </>
      ) : (
        <p style={errorStyle} role="alert">{t({ bn: 'সঠিক মান দিন — পরিমাণ ও মেয়াদ ০-এর বেশি হতে হবে, সুদের হার ০ বা তার বেশি।', en: 'Enter valid values — amount and tenure must be above 0, rate 0 or above.' })}</p>
      )}
      <p style={noteStyle}>{t({ bn: 'এটি একটি আনুমানিক হিসাব — ব্যাংকের আসল কিস্তি প্রসেসিং ফি, বীমা বা অন্যান্য চার্জে আলাদা হতে পারে। ঋণ নেওয়ার আগে ব্যাংকের শর্ত যাচাই করুন।', en: 'This is an estimate — a bank actual instalment can differ with processing fees, insurance or other charges. Check the bank terms before borrowing.' })}</p>
    </section>
  );
}
