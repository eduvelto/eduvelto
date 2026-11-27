// Eduvelto — Retirement Savings Planner tool UI.
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Pure calculation lives in src/lib/tools/retirementSavings.ts over
// the shared compound engine (src/lib/tools/compoundEngine.ts). The
// return rate is USER-ENTERED with an example starting value only —
// no future return is ever guaranteed. All results are labelled
// আনুমানিক (estimated).
//
// Design (Batch 2 pattern): gradient hero, headline projected fund
// + tiles, copy buttons, retirement-age presets, a reverse mode
// ("how much must I save monthly to reach my target?"), a growth
// table (every 5th year + final year), a formula with the user's own
// numbers, and a free summary download via RewardedAdButton. Opens
// empty — the example fills in only when tapped.

import { useMemo, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { planRetirement, requiredMonthlySaving } from '../../lib/tools/retirementSavings';
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
  tileSubStyle,
  tileValueStyle,
  useCopyText,
} from './financeUi';

const RETIREMENT_AGE_PRESETS = [55, 60, 65];

export function RetirementSavingsTool() {
  const { t } = useLanguage();
  const [currentAge, setCurrentAge] = useState('');
  const [retirementAge, setRetirementAge] = useState('60');
  const [currentSavings, setCurrentSavings] = useState('');
  const [monthly, setMonthly] = useState('');
  const [rate, setRate] = useState('8');
  const [target, setTarget] = useState('');
  const { copied, copyText } = useCopyText();

  const currentAgeV = parseAmount(currentAge);
  const retirementAgeV = parseAmount(retirementAge);
  const savingsV = parseAmount(currentSavings);
  const monthlyV = parseAmount(monthly);
  const rateV = parseAmount(rate);
  const targetV = parseAmount(target);
  const invalid =
    [currentAgeV, retirementAgeV, savingsV, monthlyV, rateV, targetV].some((v) => v !== null && v < 0) ||
    [currentAge, retirementAge, currentSavings, monthly, rate, target].some(
      (raw, i) =>
        raw.trim() !== '' && [currentAgeV, retirementAgeV, savingsV, monthlyV, rateV, targetV][i] === null,
    ) ||
    (currentAgeV !== null &&
      retirementAgeV !== null &&
      (retirementAgeV <= currentAgeV || retirementAgeV > 120));
  const ready =
    !invalid &&
    currentAgeV !== null &&
    retirementAgeV !== null &&
    retirementAgeV > currentAgeV &&
    rateV !== null;

  const result = useMemo(() => {
    if (!ready) return null;
    try {
      return planRetirement({
        currentAge: currentAgeV as number,
        retirementAge: retirementAgeV as number,
        currentSavings: savingsV ?? 0,
        monthlyContribution: monthlyV ?? 0,
        annualRatePercent: rateV as number,
      });
    } catch {
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, currentAgeV, retirementAgeV, savingsV, monthlyV, rateV]);

  const reverse =
    targetV !== null && targetV > 0 && rateV !== null && rateV >= 0 && result !== null && !invalid
      ? (() => {
          try {
            return requiredMonthlySaving({
              targetAmount: targetV,
              currentSavings: savingsV ?? 0,
              annualRatePercent: rateV,
              years: result.yearsToRetirement,
            });
          } catch {
            return null;
          }
        })()
      : null;

  function loadExample(): void {
    setCurrentAge('30');
    setRetirementAge('60');
    setCurrentSavings('200000');
    setMonthly('5000');
    setRate('8');
  }

  // Growth table: every 5th year plus the final year, so a 30-year
  // plan stays readable.
  const growthRows = result
    ? result.yearlyBalances.filter(
        (row) => row.year % 5 === 0 || row.year === result.yearlyBalances.length,
      )
    : [];

  const summary = result
    ? t({
        bn: `অবসর সঞ্চয় (আনুমানিক): বয়স ${currentAgeV} থেকে ${retirementAgeV} (${result.yearsToRetirement} বছর), বর্তমান সঞ্চয় ৳${fmtMoney(savingsV ?? 0)}, মাসে ৳${fmtMoney(monthlyV ?? 0)} করে, হার ${rateV}% — অবসরে মোট হবে ৳${fmtMoney(result.futureValue)}। মোট জমা ৳${fmtMoney(result.totalContributed)}, মুনাফা ৳${fmtMoney(result.interestEarned)}।`,
        en: `Retirement savings (estimate): age ${currentAgeV} to ${retirementAgeV} (${result.yearsToRetirement} years), current savings ৳${fmtMoney(savingsV ?? 0)}, ৳${fmtMoney(monthlyV ?? 0)}/month, rate ${rateV}% — fund at retirement ৳${fmtMoney(result.futureValue)}. Total paid in ৳${fmtMoney(result.totalContributed)}, growth ৳${fmtMoney(result.interestEarned)}.`,
      })
    : null;

  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="retirement-title">
      <FinanceHero
        titleId="retirement-title"
        titleBn="অবসর সঞ্চয় পরিকল্পনা"
        titleEn="Retirement Savings Planner"
        descBn="বর্তমান বয়স, অবসরের বয়স, বর্তমান সঞ্চয়, মাসিক জমা ও হার দিন — অবসরে কত টাকা জমবে তা দেখুন। ভবিষ্যতের মুনাফার কোনো নিশ্চয়তা নেই; সব হিসাব আনুমানিক।"
        descEn="Enter your current age, retirement age, current savings, monthly deposit and rate — see how much you will have at retirement. No future return is guaranteed; all figures are estimates."
        trustBn="১০০% ব্রাউজারে • কোনো আপলোড নয়"
        trustEn="100% in-browser • nothing uploaded"
      />
      <div style={gridStyle}>
        <div>
          <label style={labelStyle} htmlFor="retirement-current-age">
            {t({ bn: 'বর্তমান বয়স', en: 'Current age' })}
          </label>
          <input
            id="retirement-current-age"
            style={inputStyle}
            type="number"
            min="0"
            max="120"
            step="1"
            inputMode="numeric"
            value={currentAge}
            onChange={(e) => setCurrentAge(e.target.value)}
            placeholder="30"
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="retirement-age">
            {t({ bn: 'অবসরের বয়স', en: 'Retirement age' })}
          </label>
          <input
            id="retirement-age"
            style={inputStyle}
            type="number"
            min="0"
            max="120"
            step="1"
            inputMode="numeric"
            value={retirementAge}
            onChange={(e) => setRetirementAge(e.target.value)}
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="retirement-savings">
            {t({ bn: 'বর্তমান সঞ্চয়', en: 'Current savings' })}
          </label>
          <input
            id="retirement-savings"
            style={inputStyle}
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={currentSavings}
            onChange={(e) => setCurrentSavings(e.target.value)}
            placeholder="200000"
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="retirement-monthly">
            {t({ bn: 'মাসিক জমা', en: 'Monthly contribution' })}
          </label>
          <input
            id="retirement-monthly"
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
          <label style={labelStyle} htmlFor="retirement-rate">
            {t({ bn: 'বার্ষিক হার (%) — উদাহরণ মান', en: 'Annual rate (%) — example value' })}
          </label>
          <input
            id="retirement-rate"
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
          <label style={labelStyle} htmlFor="retirement-target">
            {t({ bn: 'উল্টো হিসাব — অবসরে কত চান? (ঐচ্ছিক)', en: 'Reverse — fund wanted at retirement (optional)' })}
          </label>
          <input
            id="retirement-target"
            style={inputStyle}
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="5000000"
          />
        </div>
      </div>
      <div style={{ marginTop: 14 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--heading)', margin: '0 0 4px' }}>
          {t({ bn: 'অবসরের বয়সের প্রিসেট', en: 'Retirement age presets' })}
        </p>
        <div style={presetRowStyle} role="group" aria-label={t({ bn: 'অবসরের বয়স', en: 'Retirement age' })}>
          {RETIREMENT_AGE_PRESETS.map((a) => (
            <button
              key={a}
              type="button"
              style={presetChipStyle(retirementAge === String(a))}
              aria-pressed={retirementAge === String(a)}
              onClick={() => setRetirementAge(String(a))}
            >
              {a} {t({ bn: 'বছর', en: 'years' })}
            </button>
          ))}
        </div>
      </div>
      <div style={buttonRowStyle}>
        <button type="button" className="ev-btn-outline" onClick={loadExample}>
          {t({ bn: 'উদাহরণ বসান (বয়স ৩০ → ৬০, সঞ্চয় ৳২ লাখ, মাসে ৳৫,০০০, ৮%)', en: 'Load example (age 30 → 60, savings ৳200,000, ৳5,000/month, 8%)' })}
        </button>
      </div>
      {reverse !== null && targetV !== null && result ? (
        <div style={{ ...resultStyle, background: 'var(--amber-soft)' }}>
          <p style={{ margin: 0, fontSize: 15 }}>
            {reverse === 0
              ? t({
                  bn: `বর্তমান সঞ্চয়ই ৳${fmtMoney(targetV)} ছাড়িয়ে যাবে — আলাদা মাসিক জমা লাগবে না।`,
                  en: `Your current savings alone will pass ৳${fmtMoney(targetV)} — no extra monthly saving needed.`,
                })
              : t({
                  bn: `অবসরে ৳${fmtMoney(targetV)} পেতে প্রতি মাসে ৳${fmtMoney(reverse)} করে জমাতে হবে (আনুমানিক)।`,
                  en: `To have ৳${fmtMoney(targetV)} at retirement, save ৳${fmtMoney(reverse)} every month (estimate).`,
                })}
          </p>
        </div>
      ) : null}
      {result ? (
        <div style={resultStyle} role="status">
          <p style={headlineLabelStyle}>{t({ bn: 'অবসরে মোট তহবিল — আনুমানিক', en: 'Fund at retirement — estimate' })}</p>
          <p style={headlineStyle}>৳{fmtMoney(result.futureValue)}</p>
          <div style={buttonRowStyle}>
            <button
              type="button"
              className="ev-btn-outline"
              onClick={() => void copyText(`৳${fmtMoney(result.futureValue)}`, 'fund')}
            >
              {copied === 'fund'
                ? t({ bn: 'কপি হয়েছে', en: 'Copied' })
                : t({ bn: 'তহবিল কপি করুন', en: 'Copy fund' })}
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
              <p style={tileLabelStyle}>{t({ bn: 'মুনাফা', en: 'Growth' })}</p>
              <p style={tileValueStyle}>৳{fmtMoney(result.interestEarned)}</p>
            </div>
            <div style={tileStyle}>
              <p style={tileLabelStyle}>{t({ bn: 'হাতে সময়', en: 'Years left' })}</p>
              <p style={tileValueStyle}>{result.yearsToRetirement} {t({ bn: 'বছর', en: 'years' })}</p>
              <p style={tileSubStyle}>
                {t({ bn: 'মাসিক জমা', en: 'Monthly saving' })} ৳{fmtMoney(monthlyV ?? 0)}
              </p>
            </div>
          </div>
          {growthRows.length > 0 ? (
            <>
              <h3 style={{ fontSize: 16, color: 'var(--heading)', margin: '16px 0 4px' }}>
                {t({ bn: 'তহবিলের বৃদ্ধি (প্রতি ৫ বছর)', en: 'Fund growth (every 5 years)' })}
              </h3>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={cellStyle}>{t({ bn: 'বয়স', en: 'Age' })}</th>
                    <th style={cellStyle}>{t({ bn: 'তহবিল', en: 'Fund' })}</th>
                  </tr>
                </thead>
                <tbody>
                  {growthRows.map((row) => (
                    <tr key={row.year}>
                      <td style={cellStyle}>{(currentAgeV as number) + row.year}</td>
                      <td style={cellStyle}>৳{fmtMoney(row.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : null}
          <p style={formulaStyle}>
            {t({
              bn: `সূত্র: ${result.yearsToRetirement} বছরে (${result.months} মাস) ৳${fmtMoney(savingsV ?? 0)}-এর চক্রবৃদ্ধি + মাসিক ৳${fmtMoney(monthlyV ?? 0)}-এর চক্রবৃদ্ধি (${rateV}% বার্ষিক) = ৳${fmtMoney(result.futureValue)}।`,
              en: `Formula: over ${result.yearsToRetirement} years (${result.months} months), compound growth of ৳${fmtMoney(savingsV ?? 0)} + compound growth of ৳${fmtMoney(monthlyV ?? 0)}/month (at ${rateV}% yearly) = ৳${fmtMoney(result.futureValue)}.`,
            })}
          </p>
          <p style={formulaStyle}>
            {t({
              bn: 'হারটি উদাহরণ মাত্র — আসল মুনাফা তহবিলের উপর নির্ভর করে এবং বদলাতে পারে; মুদ্রাস্ফীতিও হিসাবে ধরা হয়নি। তথ্য: 27 Nov 2026।',
              en: 'The rate is an example only — the actual return depends on the fund and can change; inflation is not included. Noted: 27 Nov 2026.',
            })}
          </p>
          <SummaryDownload filename="retirement-savings-summary.txt" text={summary} />
        </div>
      ) : invalid ? (
        <p style={errorStyle} role="alert">
          {t({ bn: 'সঠিক মান দিন — অবসরের বয়স বর্তমান বয়সের বেশি হতে হবে।', en: 'Enter valid values — the retirement age must be above the current age.' })}
        </p>
      ) : null}
    </section>
  );
}
