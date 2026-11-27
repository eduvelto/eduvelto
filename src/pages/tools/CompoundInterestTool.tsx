// Eduvelto — Compound Interest Calculator tool UI.
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Pure calculation lives in src/lib/tools/compoundInterest.ts over the
// shared compound engine (src/lib/tools/compoundEngine.ts). The rate
// is USER-ENTERED with an example starting value only — no return is
// ever guaranteed. All results are labelled আনুমানিক (estimated).
//
// Design (Batch 2 pattern): gradient hero, headline future value +
// tiles, copy buttons, year presets, a reverse mode ("how much must
// I save monthly to reach my target?"), a yearly growth table, a
// formula with the user's own numbers, and a free summary download
// via RewardedAdButton. Opens empty — the example fills in only
// when tapped.

import { useMemo, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { calculateCompoundInterest } from '../../lib/tools/compoundInterest';
import { requiredMonthlyContribution } from '../../lib/tools/compoundEngine';
import {
  buttonRowStyle,
  cardStyle,
  cellStyle,
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
  tableStyle,
  tileGridStyle,
  tileLabelStyle,
  tileStyle,
  tileValueStyle,
  useCopyText,
} from './financeUi';

const YEAR_PRESETS = [5, 10, 15, 20];

export function CompoundInterestTool() {
  const { t } = useLanguage();
  const [principal, setPrincipal] = useState('');
  const [monthly, setMonthly] = useState('');
  const [rate, setRate] = useState('8');
  const [years, setYears] = useState('10');
  const [target, setTarget] = useState('');
  const { copied, copyText } = useCopyText();

  const principalV = parseAmount(principal);
  const monthlyV = parseAmount(monthly);
  const rateV = parseAmount(rate);
  const yearsV = parseAmount(years);
  const targetV = parseAmount(target);
  const invalid =
    [principalV, monthlyV, rateV, yearsV, targetV].some((v) => v !== null && v < 0) ||
    [principal, monthly, rate, years, target].some(
      (raw, i) =>
        raw.trim() !== '' && [principalV, monthlyV, rateV, yearsV, targetV][i] === null,
    ) ||
    (yearsV !== null && yearsV <= 0);
  const ready = !invalid && principalV !== null && rateV !== null && yearsV !== null && yearsV > 0;

  const result = useMemo(() => {
    if (!ready) return null;
    try {
      return calculateCompoundInterest({
        principal: principalV as number,
        monthlyContribution: monthlyV ?? 0,
        annualRatePercent: rateV as number,
        years: yearsV as number,
      });
    } catch {
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, principalV, monthlyV, rateV, yearsV]);

  const reverse =
    targetV !== null && targetV > 0 && rateV !== null && rateV >= 0 && yearsV !== null && yearsV > 0 && !invalid
      ? (() => {
          try {
            return requiredMonthlyContribution({
              target: targetV,
              principal: principalV ?? 0,
              annualRatePercent: rateV,
              years: yearsV,
            });
          } catch {
            return null;
          }
        })()
      : null;

  function loadExample(): void {
    setPrincipal('100000');
    setMonthly('5000');
    setRate('8');
    setYears('10');
  }

  const summary = result
    ? t({
        bn: `চক্রবৃদ্ধি সুদ (আনুমানিক): শুরুর টাকা ৳${fmtMoney(principalV as number)}, মাসে ৳${fmtMoney(monthlyV ?? 0)} করে, হার ${rateV}%, ${yearsV} বছর পর মোট হবে ৳${fmtMoney(result.futureValue)}। মোট জমা ৳${fmtMoney(result.totalContributed)}, সুদ/মুনাফা ৳${fmtMoney(result.interestEarned)}।`,
        en: `Compound interest (estimate): starting ৳${fmtMoney(principalV as number)}, ৳${fmtMoney(monthlyV ?? 0)}/month, rate ${rateV}%, after ${yearsV} years the total is ৳${fmtMoney(result.futureValue)}. Total paid in ৳${fmtMoney(result.totalContributed)}, interest earned ৳${fmtMoney(result.interestEarned)}.`,
      })
    : null;

  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="compound-title">
      <FinanceHero
        titleId="compound-title"
        titleBn="চক্রবৃদ্ধি সুদ ক্যালকুলেটর"
        titleEn="Compound Interest Calculator"
        descBn="শুরুর টাকা, মাসিক জমা, হার ও মেয়াদ দিন — চক্রবৃদ্ধি সুদে বিনিয়োগ কত বাড়বে তা দেখুন। ভবিষ্যতের মুনাফার কোনো নিশ্চয়তা নেই; সব হিসাব আনুমানিক।"
        descEn="Enter the starting amount, monthly deposit, rate and term — see how an investment grows with compound interest. No future return is guaranteed; all figures are estimates."
        trustBn="১০০% ব্রাউজারে • কোনো আপলোড নয়"
        trustEn="100% in-browser • nothing uploaded"
      />
      <div style={gridStyle}>
        <div>
          <label style={labelStyle} htmlFor="compound-principal">
            {t({ bn: 'শুরুর টাকা', en: 'Starting amount' })}
          </label>
          <input
            id="compound-principal"
            style={inputStyle}
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={principal}
            onChange={(e) => setPrincipal(e.target.value)}
            placeholder="100000"
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="compound-monthly">
            {t({ bn: 'মাসিক জমা', en: 'Monthly contribution' })}
          </label>
          <input
            id="compound-monthly"
            style={inputStyle}
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={monthly}
            onChange={(e) => setMonthly(e.target.value)}
            placeholder="5000"
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="compound-rate">
            {t({ bn: 'বার্ষিক হার (%) — উদাহরণ মান', en: 'Annual rate (%) — example value' })}
          </label>
          <input
            id="compound-rate"
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
          <label style={labelStyle} htmlFor="compound-years">
            {t({ bn: 'মেয়াদ (বছর)', en: 'Term (years)' })}
          </label>
          <input
            id="compound-years"
            style={inputStyle}
            type="number"
            min="0"
            step="0.5"
            inputMode="decimal"
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
          <label style={labelStyle} htmlFor="compound-target">
            {t({ bn: 'উল্টো হিসাব — কত টাকা পেতে চান? (ঐচ্ছিক)', en: 'Reverse — target amount you want (optional)' })}
          </label>
          <input
            id="compound-target"
            style={inputStyle}
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="500000"
          />
        </div>
      </div>
      <div style={buttonRowStyle}>
        <button type="button" className="ev-btn-outline" onClick={loadExample}>
          {t({ bn: 'উদাহরণ বসান (৳১ লাখ + মাসে ৳৫,০০০, ৮%, ১০ বছর)', en: 'Load example (৳100,000 + ৳5,000/month, 8%, 10 years)' })}
        </button>
      </div>
      {reverse !== null && targetV !== null ? (
        <div style={{ ...resultStyle, background: 'var(--amber-soft)' }}>
          <p style={{ margin: 0, fontSize: 15 }}>
            {reverse === 0
              ? t({
                  bn: `শুরুর টাকাতেই ৳${fmtMoney(targetV)} হয়ে যাবে — আলাদা মাসিক জমা লাগবে না।`,
                  en: `Your starting amount alone reaches ৳${fmtMoney(targetV)} — no extra monthly contribution needed.`,
                })
              : t({
                  bn: `${yearsV} বছরে ৳${fmtMoney(targetV)} পেতে প্রতি মাসে ৳${fmtMoney(reverse)} করে জমাতে হবে (আনুমানিক)।`,
                  en: `To reach ৳${fmtMoney(targetV)} in ${yearsV} years, save ৳${fmtMoney(reverse)} every month (estimate).`,
                })}
          </p>
        </div>
      ) : null}
      {result ? (
        <div style={resultStyle} role="status">
          <p style={headlineLabelStyle}>{t({ bn: 'মেয়াদ শেষে মোট — আনুমানিক', en: 'Total at maturity — estimate' })}</p>
          <p style={headlineStyle}>৳{fmtMoney(result.futureValue)}</p>
          <div style={buttonRowStyle}>
            <button
              type="button"
              className="ev-btn-outline"
              onClick={() => void copyText(`৳${fmtMoney(result.futureValue)}`, 'future')}
            >
              {copied === 'future'
                ? t({ bn: 'কপি হয়েছে', en: 'Copied' })
                : t({ bn: 'মোট কপি করুন', en: 'Copy total' })}
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
              <p style={tileLabelStyle}>{t({ bn: 'মোট জমা', en: 'Total paid in' })}</p>
              <p style={tileValueStyle}>৳{fmtMoney(result.totalContributed)}</p>
            </div>
            <div style={tileStyle}>
              <p style={tileLabelStyle}>{t({ bn: 'সুদ / মুনাফা', en: 'Interest earned' })}</p>
              <p style={tileValueStyle}>৳{fmtMoney(result.interestEarned)}</p>
            </div>
            <div style={tileStyle}>
              <p style={tileLabelStyle}>{t({ bn: 'মাসিক জমার সংখ্যা', en: 'Monthly deposits' })}</p>
              <p style={tileValueStyle}>{result.months}</p>
            </div>
          </div>
          {result.yearlyBalances.length > 0 ? (
            <>
              <h3 style={{ fontSize: 16, color: 'var(--heading)', margin: '16px 0 4px' }}>
                {t({ bn: 'বছরভিত্তিক বৃদ্ধি', en: 'Growth year by year' })}
              </h3>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={cellStyle}>{t({ bn: 'বছর', en: 'Year' })}</th>
                    <th style={cellStyle}>{t({ bn: 'মোট', en: 'Balance' })}</th>
                  </tr>
                </thead>
                <tbody>
                  {result.yearlyBalances.map((row) => (
                    <tr key={row.year}>
                      <td style={cellStyle}>{row.year}</td>
                      <td style={cellStyle}>৳{fmtMoney(row.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : null}
          <p style={formulaStyle}>
            {t({
              bn: `সূত্র: প্রতি মাসে হার = ${rateV}% ÷ ১২; ${result.months} মাস পর মোট = ৳${fmtMoney(principalV as number)}-এর চক্রবৃদ্ধি + মাসিক ৳${fmtMoney(monthlyV ?? 0)}-এর চক্রবৃদ্ধি = ৳${fmtMoney(result.futureValue)}। মুনাফা = ৳${fmtMoney(result.futureValue)} − ৳${fmtMoney(result.totalContributed)} = ৳${fmtMoney(result.interestEarned)}।`,
              en: `Formula: monthly rate = ${rateV}% ÷ 12; after ${result.months} months the total = compound growth of ৳${fmtMoney(principalV as number)} + compound growth of ৳${fmtMoney(monthlyV ?? 0)}/month = ৳${fmtMoney(result.futureValue)}. Interest = ৳${fmtMoney(result.futureValue)} − ৳${fmtMoney(result.totalContributed)} = ৳${fmtMoney(result.interestEarned)}.`,
            })}
          </p>
          <p style={formulaStyle}>
            {t({
              bn: 'হারটি উদাহরণ মাত্র — আসল মুনাফা ব্যাংক বা তহবিলের উপর নির্ভর করে এবং বদলাতে পারে। তথ্য: 27 Nov 2026।',
              en: 'The rate is an example only — the actual return depends on the bank or fund and can change. Noted: 27 Nov 2026.',
            })}
          </p>
          <SummaryDownload filename="compound-interest-summary.txt" text={summary} />
        </div>
      ) : invalid ? (
        <p style={errorStyle} role="alert">
          {t({ bn: 'সঠিক মান দিন — কোনো মান ঋণাত্মক হতে পারবে না, মেয়াদ শূন্যের বেশি হতে হবে।', en: 'Enter valid values — no value can be negative, and the term must be above zero.' })}
        </p>
      ) : null}
    </section>
  );
}
