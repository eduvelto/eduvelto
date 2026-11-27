// Eduvelto — Mortgage & Home Loan Calculator tool UI.
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Pure calculation lives in src/lib/tools/mortgage.ts over the shared
// EMI engine (src/lib/tools/emiEngine.ts): loan = home price - down
// payment. The interest rate is USER-ENTERED with an example starting
// value only — no bank rate is stated as a fact. All results are
// labelled আনুমানিক (estimated).
//
// Design (Batch 2 pattern): gradient hero, headline EMI + tiles, copy
// buttons, year presets, a reverse mode ("what home price can I
// afford?"), a formula with the user's own numbers, and a free
// summary download via RewardedAdButton. Opens empty — the example
// fills in only when tapped.

import { useMemo, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { calculateMortgage, affordableHomePrice } from '../../lib/tools/mortgage';
import {
  buttonRowStyle,
  cardStyle,
  errorStyle,
  FinanceHero,
  fmtMoney,
  formulaStyle,
  gridStyle,
  headlineLabelStyle,
  headlineStyle,
  inputStyle,
  labelStyle,
  parseAmount,
  presetChipStyle,
  presetRowStyle,
  resultStyle,
  SummaryDownload,
  tileGridStyle,
  tileLabelStyle,
  tileStyle,
  tileSubStyle,
  tileValueStyle,
  useCopyText,
} from './financeUi';

const YEAR_PRESETS = [10, 15, 20, 25, 30];

export function MortgageTool() {
  const { t } = useLanguage();
  const [homePrice, setHomePrice] = useState('');
  const [downPayment, setDownPayment] = useState('');
  const [rate, setRate] = useState('9');
  const [years, setYears] = useState('20');
  const [monthlyBudget, setMonthlyBudget] = useState('');
  const { copied, copyText } = useCopyText();

  const homePriceV = parseAmount(homePrice);
  const downPaymentV = parseAmount(downPayment);
  const rateV = parseAmount(rate);
  const yearsV = parseAmount(years);
  const budgetV = parseAmount(monthlyBudget);
  const invalid =
    [homePriceV, downPaymentV, rateV, yearsV, budgetV].some((v) => v !== null && v < 0) ||
    [homePrice, downPayment, rate, years, monthlyBudget].some(
      (raw, i) =>
        raw.trim() !== '' &&
        [homePriceV, downPaymentV, rateV, yearsV, budgetV][i] === null,
    ) ||
    (downPaymentV !== null && homePriceV !== null && downPaymentV > homePriceV) ||
    (yearsV !== null && (!Number.isInteger(yearsV) || yearsV <= 0));
  const ready =
    !invalid &&
    homePriceV !== null &&
    rateV !== null &&
    yearsV !== null &&
    Number.isInteger(yearsV) &&
    yearsV > 0;

  const result = useMemo(() => {
    if (!ready) return null;
    try {
      return calculateMortgage({
        homePrice: homePriceV as number,
        downPayment: downPaymentV ?? 0,
        annualRatePercent: rateV as number,
        years: yearsV as number,
      });
    } catch {
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, homePriceV, downPaymentV, rateV, yearsV]);

  const reverse =
    budgetV !== null && budgetV > 0 && rateV !== null && rateV >= 0 && yearsV !== null && Number.isInteger(yearsV) && yearsV > 0 && !invalid
      ? (() => {
          try {
            return affordableHomePrice({
              monthlyBudget: budgetV,
              downPayment: downPaymentV ?? 0,
              annualRatePercent: rateV,
              years: yearsV,
            });
          } catch {
            return null;
          }
        })()
      : null;

  function loadExample(): void {
    setHomePrice('5000000');
    setDownPayment('1000000');
    setRate('9');
    setYears('20');
  }

  const summary = result
    ? t({
        bn: `মর্টগেজ হিসাব (আনুমানিক): বাড়ির দাম ৳${fmtMoney(homePriceV as number)}, ডাউন পেমেন্ট ৳${fmtMoney(downPaymentV ?? 0)}, লোন ৳${fmtMoney(result.loanAmount)}, হার ${rateV}%, মেয়াদ ${yearsV} বছর। মাসিক কিস্তি (EMI) ৳${fmtMoney(result.emi)}, মোট সুদ ৳${fmtMoney(result.totalInterest)}, মোট পরিশোধ ৳${fmtMoney(result.totalPayment)}।`,
        en: `Mortgage estimate: home price ৳${fmtMoney(homePriceV as number)}, down payment ৳${fmtMoney(downPaymentV ?? 0)}, loan ৳${fmtMoney(result.loanAmount)}, rate ${rateV}%, term ${yearsV} years. Monthly EMI ৳${fmtMoney(result.emi)}, total interest ৳${fmtMoney(result.totalInterest)}, total payment ৳${fmtMoney(result.totalPayment)}.`,
      })
    : null;

  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="mortgage-title">
      <FinanceHero
        titleId="mortgage-title"
        titleBn="মর্টগেজ ও হোম লোন ক্যালকুলেটর"
        titleEn="Mortgage & Home Loan Calculator"
        descBn="বাড়ির দাম, ডাউন পেমেন্ট, সুদের হার ও মেয়াদ দিন — মাসিক কিস্তি (EMI) ও মোট সুদ বের হয়ে যাবে। সব হিসাব আনুমানিক, আপনার ডিভাইসেই হয়।"
        descEn="Enter the home price, down payment, interest rate and term — see the monthly instalment (EMI) and total interest. All figures are estimates, computed on your device."
        trustBn="১০০% ব্রাউজারে • কোনো আপলোড নয়"
        trustEn="100% in-browser • nothing uploaded"
      />
      <div style={gridStyle}>
        <div>
          <label style={labelStyle} htmlFor="mortgage-home-price">
            {t({ bn: 'বাড়ির দাম', en: 'Home price' })}
          </label>
          <input
            id="mortgage-home-price"
            style={inputStyle}
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={homePrice}
            onChange={(e) => setHomePrice(e.target.value)}
            placeholder="5000000"
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="mortgage-down-payment">
            {t({ bn: 'ডাউন পেমেন্ট', en: 'Down payment' })}
          </label>
          <input
            id="mortgage-down-payment"
            style={inputStyle}
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={downPayment}
            onChange={(e) => setDownPayment(e.target.value)}
            placeholder="1000000"
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="mortgage-rate">
            {t({ bn: 'বার্ষিক সুদের হার (%) — উদাহরণ মান', en: 'Annual interest rate (%) — example value' })}
          </label>
          <input
            id="mortgage-rate"
            style={inputStyle}
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="mortgage-years">
            {t({ bn: 'মেয়াদ (বছর)', en: 'Term (years)' })}
          </label>
          <input
            id="mortgage-years"
            style={inputStyle}
            type="number"
            min="1"
            step="1"
            inputMode="numeric"
            value={years}
            onChange={(e) => setYears(e.target.value)}
          />
        </div>
      </div>
      <div style={{ marginTop: 14 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--heading)', margin: '0 0 4px' }}>
          {t({ bn: 'মেয়াদের প্রিসেট', en: 'Term presets' })}
        </p>
        <div style={presetRowStyle} role="group" aria-label={t({ bn: 'মেয়াদ', en: 'Term' })}>
          {YEAR_PRESETS.map((y) => (
            <button
              key={y}
              type="button"
              style={presetChipStyle(years === String(y))}
              aria-pressed={years === String(y)}
              onClick={() => setYears(String(y))}
            >
              {y} {t({ bn: 'বছর', en: 'years' })}
            </button>
          ))}
        </div>
      </div>
      <div style={gridStyle}>
        <div style={{ marginTop: 12 }}>
          <label style={labelStyle} htmlFor="mortgage-budget">
            {t({ bn: 'উল্টো হিসাব — মাসে কত কিস্তি দিতে পারবেন? (ঐচ্ছিক)', en: 'Reverse — monthly payment you can afford (optional)' })}
          </label>
          <input
            id="mortgage-budget"
            style={inputStyle}
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={monthlyBudget}
            onChange={(e) => setMonthlyBudget(e.target.value)}
            placeholder="36000"
          />
        </div>
      </div>
      <div style={buttonRowStyle}>
        <button type="button" className="ev-btn-outline" onClick={loadExample}>
          {t({ bn: 'উদাহরণ বসান (দাম ৳৫০ লাখ, ডাউন ৳১০ লাখ, ৯%, ২০ বছর)', en: 'Load example (price ৳5,000,000, down ৳1,000,000, 9%, 20 years)' })}
        </button>
      </div>
      {reverse ? (
        <div style={{ ...resultStyle, background: 'var(--amber-soft)' }}>
          <p style={{ margin: 0, fontSize: 15 }}>
            {t({
              bn: `মাসে ৳${fmtMoney(budgetV as number)} কিস্তি দিতে পারলে সর্বোচ্চ লোন ৳${fmtMoney(reverse.maxLoanAmount)} — অর্থাৎ সর্বোচ্চ ৳${fmtMoney(reverse.maxHomePrice)} দামের বাড়ি কিনতে পারবেন (আনুমানিক)।`,
              en: `With ৳${fmtMoney(budgetV as number)}/month you can borrow up to ৳${fmtMoney(reverse.maxLoanAmount)} — a home up to ৳${fmtMoney(reverse.maxHomePrice)} (estimate).`,
            })}
          </p>
        </div>
      ) : null}
      {result ? (
        <div style={resultStyle} role="status">
          <p style={headlineLabelStyle}>{t({ bn: 'মাসিক কিস্তি (EMI) — আনুমানিক', en: 'Monthly EMI — estimate' })}</p>
          <p style={headlineStyle}>৳{fmtMoney(result.emi)}</p>
          <div style={buttonRowStyle}>
            <button
              type="button"
              className="ev-btn-outline"
              onClick={() => void copyText(`৳${fmtMoney(result.emi)}`, 'emi')}
            >
              {copied === 'emi'
                ? t({ bn: 'কপি হয়েছে', en: 'Copied' })
                : t({ bn: 'কিস্তি কপি করুন', en: 'Copy EMI' })}
            </button>
            <button
              type="button"
              className="ev-btn-outline"
              onClick={() => void copyText(summary ?? '', 'summary')}
            >
              {copied === 'summary'
                ? t({ bn: 'কপি হয়েছে', en: 'Copied' })
                : t({ bn: 'সারাংশ কপি করুন', en: 'Copy summary' })}
            </button>
          </div>
          <div style={tileGridStyle}>
            <div style={tileStyle}>
              <p style={tileLabelStyle}>{t({ bn: 'লোনের পরিমাণ', en: 'Loan amount' })}</p>
              <p style={tileValueStyle}>৳{fmtMoney(result.loanAmount)}</p>
            </div>
            <div style={tileStyle}>
              <p style={tileLabelStyle}>{t({ bn: 'মোট সুদ', en: 'Total interest' })}</p>
              <p style={tileValueStyle}>৳{fmtMoney(result.totalInterest)}</p>
            </div>
            <div style={tileStyle}>
              <p style={tileLabelStyle}>{t({ bn: 'মোট পরিশোধ', en: 'Total payment' })}</p>
              <p style={tileValueStyle}>৳{fmtMoney(result.totalPayment)}</p>
            </div>
            <div style={tileStyle}>
              <p style={tileLabelStyle}>{t({ bn: 'ডাউন পেমেন্ট', en: 'Down payment' })}</p>
              <p style={tileValueStyle}>{result.downPaymentPercent}%</p>
              <p style={tileSubStyle}>৳{fmtMoney(downPaymentV ?? 0)}</p>
            </div>
          </div>
          <p style={formulaStyle}>
            {t({
              bn: `সূত্র: লোন = ৳${fmtMoney(homePriceV as number)} − ৳${fmtMoney(downPaymentV ?? 0)} = ৳${fmtMoney(result.loanAmount)}; মাসিক হার = ${rateV}% ÷ ১২; ${result.months} কিস্তিতে EMI = ৳${fmtMoney(result.emi)}। মোট সুদ = ৳${fmtMoney(result.totalPayment)} − ৳${fmtMoney(result.loanAmount)} = ৳${fmtMoney(result.totalInterest)}।`,
              en: `Formula: loan = ৳${fmtMoney(homePriceV as number)} − ৳${fmtMoney(downPaymentV ?? 0)} = ৳${fmtMoney(result.loanAmount)}; monthly rate = ${rateV}% ÷ 12; EMI over ${result.months} payments = ৳${fmtMoney(result.emi)}. Total interest = ৳${fmtMoney(result.totalPayment)} − ৳${fmtMoney(result.loanAmount)} = ৳${fmtMoney(result.totalInterest)}.`,
            })}
          </p>
          <p style={formulaStyle}>
            {t({
              bn: 'সুদের হারটি উদাহরণ মাত্র — ব্যাংকের হার সময়ের সাথে বদলায়। লোন নেওয়ার আগে নিজের ব্যাংকে বর্তমান হার, প্রসেসিং ফি ও অন্যান্য শর্ত যাচাই করুন। তথ্য: 27 Nov 2026।',
              en: 'The interest rate is an example only — bank rates change over time. Before taking a loan, check the current rate, processing fee and other terms with your bank. Noted: 27 Nov 2026.',
            })}
          </p>
          <SummaryDownload filename="mortgage-summary.txt" text={summary} />
        </div>
      ) : invalid ? (
        <p style={errorStyle} role="alert">
          {t({ bn: 'সঠিক মান দিন — ডাউন পেমেন্ট বাড়ির দামের বেশি হতে পারবে না, মেয়াদ পূর্ণসংখ্যা বছর হতে হবে।', en: 'Enter valid values — the down payment cannot exceed the home price, and the term must be a whole number of years.' })}
        </p>
      ) : null}
    </section>
  );
}
