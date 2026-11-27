// Eduvelto — Bank EMI, DPS & FDR Calculator tool UI.
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Pure calculation lives in src/lib/tools/bankEmiDpsFdr.ts:
// - EMI mode uses the shared EMI engine (emiEngine.ts) — the same
//   formula as the mortgage calculator, never written twice.
// - DPS mode uses the shared compound engine (compoundEngine.ts).
// - FDR mode is a lump-sum fixed deposit with periodic compounding.
// All rates are USER-ENTERED with example starting values only —
// no bank rate is stated as a fact. All results are labelled
// আনুমানিক (estimated).
//
// Design (Batch 2 pattern): gradient hero, mode tabs, headline +
// tiles per mode, copy buttons, a formula with the user's own
// numbers, and a free summary download via RewardedAdButton. Opens
// empty — the example fills in only when tapped.

import { useMemo, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { calculateBankEmi, calculateDps, calculateFdr } from '../../lib/tools/bankEmiDpsFdr';
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
  tileValueStyle,
  useCopyText,
} from './financeUi';

type BankMode = 'emi' | 'dps' | 'fdr';

export function BankEmiDpsFdrTool() {
  const { t } = useLanguage();
  const [mode, setMode] = useState<BankMode>('emi');
  // EMI fields
  const [loanAmount, setLoanAmount] = useState('');
  const [emiRate, setEmiRate] = useState('9');
  const [emiYears, setEmiYears] = useState('5');
  // DPS fields
  const [monthlyDeposit, setMonthlyDeposit] = useState('');
  const [dpsRate, setDpsRate] = useState('8');
  const [dpsMonths, setDpsMonths] = useState('60');
  // FDR fields
  const [principal, setPrincipal] = useState('');
  const [fdrRate, setFdrRate] = useState('8');
  const [fdrYears, setFdrYears] = useState('3');
  const [compounding, setCompounding] = useState('4');
  const { copied, copyText } = useCopyText();

  const loanV = parseAmount(loanAmount);
  const emiRateV = parseAmount(emiRate);
  const emiYearsV = parseAmount(emiYears);
  const depositV = parseAmount(monthlyDeposit);
  const dpsRateV = parseAmount(dpsRate);
  const dpsMonthsV = parseAmount(dpsMonths);
  const principalV = parseAmount(principal);
  const fdrRateV = parseAmount(fdrRate);
  const fdrYearsV = parseAmount(fdrYears);
  const compoundingV = parseAmount(compounding);
  const allVals = [loanV, emiRateV, emiYearsV, depositV, dpsRateV, dpsMonthsV, principalV, fdrRateV, fdrYearsV, compoundingV];
  const allRaws = [loanAmount, emiRate, emiYears, monthlyDeposit, dpsRate, dpsMonths, principal, fdrRate, fdrYears, compounding];
  const invalid =
    allVals.some((v) => v !== null && v < 0) ||
    allRaws.some((raw, i) => raw.trim() !== '' && allVals[i] === null) ||
    (emiYearsV !== null && (!Number.isInteger(emiYearsV) || emiYearsV <= 0)) ||
    (dpsMonthsV !== null && (!Number.isInteger(dpsMonthsV) || dpsMonthsV <= 0)) ||
    (fdrYearsV !== null && fdrYearsV <= 0) ||
    (compoundingV !== null && (!Number.isInteger(compoundingV) || compoundingV <= 0));

  const emiResult = useMemo(() => {
    if (mode !== 'emi' || invalid || loanV === null || emiRateV === null || emiYearsV === null) return null;
    try {
      return calculateBankEmi({ loanAmount: loanV, annualRatePercent: emiRateV, years: emiYearsV });
    } catch {
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, invalid, loanV, emiRateV, emiYearsV]);

  const dpsResult = useMemo(() => {
    if (mode !== 'dps' || invalid || depositV === null || dpsRateV === null || dpsMonthsV === null) return null;
    try {
      return calculateDps({ monthlyDeposit: depositV, annualRatePercent: dpsRateV, months: dpsMonthsV });
    } catch {
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, invalid, depositV, dpsRateV, dpsMonthsV]);

  const fdrResult = useMemo(() => {
    if (mode !== 'fdr' || invalid || principalV === null || fdrRateV === null || fdrYearsV === null) return null;
    try {
      return calculateFdr({
        principal: principalV,
        annualRatePercent: fdrRateV,
        years: fdrYearsV,
        compoundingPerYear: (compoundingV ?? 4) as number,
      });
    } catch {
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, invalid, principalV, fdrRateV, fdrYearsV, compoundingV]);

  function loadExample(): void {
    if (mode === 'emi') {
      setLoanAmount('500000');
      setEmiRate('9');
      setEmiYears('5');
    } else if (mode === 'dps') {
      setMonthlyDeposit('5000');
      setDpsRate('8');
      setDpsMonths('60');
    } else {
      setPrincipal('100000');
      setFdrRate('8');
      setFdrYears('3');
    }
  }

  const modeLabel = t({
    bn: mode === 'emi' ? 'EMI' : mode === 'dps' ? 'DPS' : 'FDR',
    en: mode.toUpperCase(),
  });
  const summary = emiResult
    ? t({
        bn: `ব্যাংক EMI (আনুমানিক): লোন ৳${fmtMoney(loanV as number)}, হার ${emiRateV}%, ${emiYearsV} বছর — মাসিক কিস্তি ৳${fmtMoney(emiResult.emi)}, মোট সুদ ৳${fmtMoney(emiResult.totalInterest)}, মোট পরিশোধ ৳${fmtMoney(emiResult.totalPayment)}।`,
        en: `Bank EMI (estimate): loan ৳${fmtMoney(loanV as number)}, rate ${emiRateV}%, ${emiYearsV} years — monthly instalment ৳${fmtMoney(emiResult.emi)}, total interest ৳${fmtMoney(emiResult.totalInterest)}, total payment ৳${fmtMoney(emiResult.totalPayment)}.`,
      })
    : dpsResult
      ? t({
          bn: `DPS (আনুমানিক): মাসে ৳${fmtMoney(depositV as number)} করে ${dpsMonthsV} মাস, হার ${dpsRateV}% — মেয়াদ শেষে ৳${fmtMoney(dpsResult.maturityValue)}। মোট জমা ৳${fmtMoney(dpsResult.totalDeposited)}, মুনাফা ৳${fmtMoney(dpsResult.interestEarned)}।`,
          en: `DPS (estimate): ৳${fmtMoney(depositV as number)}/month for ${dpsMonthsV} months, rate ${dpsRateV}% — maturity value ৳${fmtMoney(dpsResult.maturityValue)}. Total deposited ৳${fmtMoney(dpsResult.totalDeposited)}, profit ৳${fmtMoney(dpsResult.interestEarned)}.`,
        })
      : fdrResult
        ? t({
            bn: `FDR (আনুমানিক): জমা ৳${fmtMoney(principalV as number)}, হার ${fdrRateV}%, ${fdrYearsV} বছর — মেয়াদ শেষে ৳${fmtMoney(fdrResult.maturityValue)}। মুনাফা ৳${fmtMoney(fdrResult.interestEarned)}।`,
            en: `FDR (estimate): deposit ৳${fmtMoney(principalV as number)}, rate ${fdrRateV}%, ${fdrYearsV} years — maturity value ৳${fmtMoney(fdrResult.maturityValue)}. Profit ৳${fmtMoney(fdrResult.interestEarned)}.`,
          })
        : null;

  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="bank-title">
      <FinanceHero
        titleId="bank-title"
        titleBn="ব্যাংক ইএমআই, ডিপিএস ও এফডিআর ক্যালকুলেটর"
        titleEn="Bank EMI, DPS & FDR Calculator"
        descBn="ব্যাংকের EMI, DPS ও FDR — তিনটি হিসাব এক জায়গায়। হারগুলো উদাহরণ মান মাত্র; নিজের ব্যাংকের বর্তমান হার বসিয়ে নিন। সব হিসাব আনুমানিক।"
        descEn="Bank EMI, DPS and FDR — three calculations in one place. The rates are example values only; enter your bank's current rate. All figures are estimates."
        trustBn="১০০% ব্রাউজারে • কোনো আপলোড নয়"
        trustEn="100% in-browser • nothing uploaded"
      />
      <div style={presetRowStyle} role="group" aria-label={t({ bn: 'হিসাবের ধরন', en: 'Calculation type' })}>
        {(['emi', 'dps', 'fdr'] as BankMode[]).map((m) => (
          <button
            key={m}
            type="button"
            style={presetChipStyle(mode === m)}
            aria-pressed={mode === m}
            onClick={() => setMode(m)}
          >
            {m.toUpperCase()}
          </button>
        ))}
      </div>
      {mode === 'emi' ? (
        <div style={{ ...gridStyle, marginTop: 14 }}>
          <div>
            <label style={labelStyle} htmlFor="bank-loan-amount">
              {t({ bn: 'লোনের পরিমাণ', en: 'Loan amount' })}
            </label>
            <input
              id="bank-loan-amount"
              style={inputStyle}
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={loanAmount}
              onChange={(e) => setLoanAmount(e.target.value)}
              placeholder="500000"
            />
          </div>
          <div>
            <label style={labelStyle} htmlFor="bank-emi-rate">
              {t({ bn: 'বার্ষিক সুদের হার (%) — উদাহরণ মান', en: 'Annual interest rate (%) — example value' })}
            </label>
            <input
              id="bank-emi-rate"
              style={inputStyle}
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={emiRate}
              onChange={(e) => setEmiRate(e.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle} htmlFor="bank-emi-years">
              {t({ bn: 'মেয়াদ (বছর)', en: 'Term (years)' })}
            </label>
            <input
              id="bank-emi-years"
              style={inputStyle}
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              value={emiYears}
              onChange={(e) => setEmiYears(e.target.value)}
            />
          </div>
        </div>
      ) : mode === 'dps' ? (
        <div style={{ ...gridStyle, marginTop: 14 }}>
          <div>
            <label style={labelStyle} htmlFor="bank-dps-deposit">
              {t({ bn: 'মাসিক জমা', en: 'Monthly deposit' })}
            </label>
            <input
              id="bank-dps-deposit"
              style={inputStyle}
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={monthlyDeposit}
              onChange={(e) => setMonthlyDeposit(e.target.value)}
              placeholder="5000"
            />
          </div>
          <div>
            <label style={labelStyle} htmlFor="bank-dps-rate">
              {t({ bn: 'বার্ষিক হার (%) — উদাহরণ মান', en: 'Annual rate (%) — example value' })}
            </label>
            <input
              id="bank-dps-rate"
              style={inputStyle}
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={dpsRate}
              onChange={(e) => setDpsRate(e.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle} htmlFor="bank-dps-months">
              {t({ bn: 'মেয়াদ (মাস)', en: 'Term (months)' })}
            </label>
            <input
              id="bank-dps-months"
              style={inputStyle}
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              value={dpsMonths}
              onChange={(e) => setDpsMonths(e.target.value)}
            />
          </div>
        </div>
      ) : (
        <div style={{ ...gridStyle, marginTop: 14 }}>
          <div>
            <label style={labelStyle} htmlFor="bank-fdr-principal">
              {t({ bn: 'জমার পরিমাণ', en: 'Deposit amount' })}
            </label>
            <input
              id="bank-fdr-principal"
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
            <label style={labelStyle} htmlFor="bank-fdr-rate">
              {t({ bn: 'বার্ষিক হার (%) — উদাহরণ মান', en: 'Annual rate (%) — example value' })}
            </label>
            <input
              id="bank-fdr-rate"
              style={inputStyle}
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={fdrRate}
              onChange={(e) => setFdrRate(e.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle} htmlFor="bank-fdr-years">
              {t({ bn: 'মেয়াদ (বছর)', en: 'Term (years)' })}
            </label>
            <input
              id="bank-fdr-years"
              style={inputStyle}
              type="number"
              min="0"
              step="0.5"
              inputMode="decimal"
              value={fdrYears}
              onChange={(e) => setFdrYears(e.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle} htmlFor="bank-fdr-compounding">
              {t({ bn: 'চক্রবৃদ্ধি (বছরে কতবার)', en: 'Compounding (times per year)' })}
            </label>
            <select
              id="bank-fdr-compounding"
              style={inputStyle}
              value={compounding}
              onChange={(e) => setCompounding(e.target.value)}
            >
              <option value="1">{t({ bn: 'বার্ষিক (১ বার)', en: 'Yearly (1)' })}</option>
              <option value="2">{t({ bn: 'অর্ধবার্ষিক (২ বার)', en: 'Half-yearly (2)' })}</option>
              <option value="4">{t({ bn: 'ত্রৈমাসিক (৪ বার)', en: 'Quarterly (4)' })}</option>
              <option value="12">{t({ bn: 'মাসিক (১২ বার)', en: 'Monthly (12)' })}</option>
            </select>
          </div>
        </div>
      )}
      <div style={buttonRowStyle}>
        <button type="button" className="ev-btn-outline" onClick={loadExample}>
          {t({
            bn: `উদাহরণ বসান (${modeLabel})`,
            en: `Load example (${modeLabel})`,
          })}
        </button>
      </div>
      {emiResult ? (
        <div style={resultStyle} role="status">
          <p style={headlineLabelStyle}>{t({ bn: 'মাসিক কিস্তি (EMI) — আনুমানিক', en: 'Monthly EMI — estimate' })}</p>
          <p style={headlineStyle}>৳{fmtMoney(emiResult.emi)}</p>
          <div style={buttonRowStyle}>
            <button
              type="button"
              className="ev-btn-outline"
              onClick={() => void copyText(`৳${fmtMoney(emiResult.emi)}`, 'emi')}
            >
              {copied === 'emi' ? t({ bn: 'কপি হয়েছে', en: 'Copied' }) : t({ bn: 'কিস্তি কপি করুন', en: 'Copy EMI' })}
            </button>
            <button
              type="button"
              className="ev-btn-outline"
              onClick={() => void copyText(summary ?? '', 'summary')}
            >
              {copied === 'summary' ? t({ bn: 'কপি হয়েছে', en: 'Copied' }) : t({ bn: 'সারাংশ কপি করুন', en: 'Copy summary' })}
            </button>
          </div>
          <div style={tileGridStyle}>
            <div style={tileStyle}>
              <p style={tileLabelStyle}>{t({ bn: 'মোট সুদ', en: 'Total interest' })}</p>
              <p style={tileValueStyle}>৳{fmtMoney(emiResult.totalInterest)}</p>
            </div>
            <div style={tileStyle}>
              <p style={tileLabelStyle}>{t({ bn: 'মোট পরিশোধ', en: 'Total payment' })}</p>
              <p style={tileValueStyle}>৳{fmtMoney(emiResult.totalPayment)}</p>
            </div>
          </div>
          <p style={formulaStyle}>
            {t({
              bn: `সূত্র: মাসিক হার = ${emiRateV}% ÷ ১২; ${(emiYearsV as number) * 12} কিস্তিতে EMI = ৳${fmtMoney(emiResult.emi)}। মোট সুদ = ৳${fmtMoney(emiResult.totalPayment)} − ৳${fmtMoney(loanV as number)} = ৳${fmtMoney(emiResult.totalInterest)}।`,
              en: `Formula: monthly rate = ${emiRateV}% ÷ 12; EMI over ${(emiYearsV as number) * 12} payments = ৳${fmtMoney(emiResult.emi)}. Total interest = ৳${fmtMoney(emiResult.totalPayment)} − ৳${fmtMoney(loanV as number)} = ৳${fmtMoney(emiResult.totalInterest)}.`,
            })}
          </p>
          <SummaryDownload filename="bank-emi-summary.txt" text={summary} />
        </div>
      ) : dpsResult ? (
        <div style={resultStyle} role="status">
          <p style={headlineLabelStyle}>{t({ bn: 'মেয়াদ শেষে মোট — আনুমানিক', en: 'Maturity value — estimate' })}</p>
          <p style={headlineStyle}>৳{fmtMoney(dpsResult.maturityValue)}</p>
          <div style={buttonRowStyle}>
            <button
              type="button"
              className="ev-btn-outline"
              onClick={() => void copyText(`৳${fmtMoney(dpsResult.maturityValue)}`, 'maturity')}
            >
              {copied === 'maturity' ? t({ bn: 'কপি হয়েছে', en: 'Copied' }) : t({ bn: 'মোট কপি করুন', en: 'Copy total' })}
            </button>
            <button
              type="button"
              className="ev-btn-outline"
              onClick={() => void copyText(summary ?? '', 'summary')}
            >
              {copied === 'summary' ? t({ bn: 'কপি হয়েছে', en: 'Copied' }) : t({ bn: 'সারাংশ কপি করুন', en: 'Copy summary' })}
            </button>
          </div>
          <div style={tileGridStyle}>
            <div style={tileStyle}>
              <p style={tileLabelStyle}>{t({ bn: 'মোট জমা', en: 'Total deposited' })}</p>
              <p style={tileValueStyle}>৳{fmtMoney(dpsResult.totalDeposited)}</p>
            </div>
            <div style={tileStyle}>
              <p style={tileLabelStyle}>{t({ bn: 'মুনাফা', en: 'Profit earned' })}</p>
              <p style={tileValueStyle}>৳{fmtMoney(dpsResult.interestEarned)}</p>
            </div>
          </div>
          <p style={formulaStyle}>
            {t({
              bn: `সূত্র: মাসে ৳${fmtMoney(depositV as number)} করে ${dpsMonthsV} মাস, ${dpsRateV}% বার্ষিক হারে চক্রবৃদ্ধি — মেয়াদ শেষে ৳${fmtMoney(dpsResult.maturityValue)}। মুনাফা = ৳${fmtMoney(dpsResult.maturityValue)} − ৳${fmtMoney(dpsResult.totalDeposited)} = ৳${fmtMoney(dpsResult.interestEarned)}।`,
              en: `Formula: ৳${fmtMoney(depositV as number)}/month for ${dpsMonthsV} months, compounded at ${dpsRateV}% yearly — maturity ৳${fmtMoney(dpsResult.maturityValue)}. Profit = ৳${fmtMoney(dpsResult.maturityValue)} − ৳${fmtMoney(dpsResult.totalDeposited)} = ৳${fmtMoney(dpsResult.interestEarned)}.`,
            })}
          </p>
          <SummaryDownload filename="bank-dps-summary.txt" text={summary} />
        </div>
      ) : fdrResult ? (
        <div style={resultStyle} role="status">
          <p style={headlineLabelStyle}>{t({ bn: 'মেয়াদ শেষে মোট — আনুমানিক', en: 'Maturity value — estimate' })}</p>
          <p style={headlineStyle}>৳{fmtMoney(fdrResult.maturityValue)}</p>
          <div style={buttonRowStyle}>
            <button
              type="button"
              className="ev-btn-outline"
              onClick={() => void copyText(`৳${fmtMoney(fdrResult.maturityValue)}`, 'maturity')}
            >
              {copied === 'maturity' ? t({ bn: 'কপি হয়েছে', en: 'Copied' }) : t({ bn: 'মোট কপি করুন', en: 'Copy total' })}
            </button>
            <button
              type="button"
              className="ev-btn-outline"
              onClick={() => void copyText(summary ?? '', 'summary')}
            >
              {copied === 'summary' ? t({ bn: 'কপি হয়েছে', en: 'Copied' }) : t({ bn: 'সারাংশ কপি করুন', en: 'Copy summary' })}
            </button>
          </div>
          <div style={tileGridStyle}>
            <div style={tileStyle}>
              <p style={tileLabelStyle}>{t({ bn: 'জমা', en: 'Deposit' })}</p>
              <p style={tileValueStyle}>৳{fmtMoney(principalV as number)}</p>
            </div>
            <div style={tileStyle}>
              <p style={tileLabelStyle}>{t({ bn: 'মুনাফা', en: 'Profit earned' })}</p>
              <p style={tileValueStyle}>৳{fmtMoney(fdrResult.interestEarned)}</p>
            </div>
          </div>
          <p style={formulaStyle}>
            {t({
              bn: `সূত্র: ৳${fmtMoney(principalV as number)} × (১ + ${fdrRateV}% ÷ ${compoundingV})^{${compoundingV} × ${fdrYearsV}} = ৳${fmtMoney(fdrResult.maturityValue)}।`,
              en: `Formula: ৳${fmtMoney(principalV as number)} × (1 + ${fdrRateV}% ÷ ${compoundingV})^(${compoundingV} × ${fdrYearsV}) = ৳${fmtMoney(fdrResult.maturityValue)}.`,
            })}
          </p>
          <SummaryDownload filename="bank-fdr-summary.txt" text={summary} />
        </div>
      ) : invalid ? (
        <p style={errorStyle} role="alert">
          {t({ bn: 'সঠিক মান দিন — কোনো মান ঋণাত্মক হতে পারবে না, মেয়াদ পূর্ণসংখ্যা হতে হবে।', en: 'Enter valid values — no value can be negative, and terms must be whole numbers.' })}
        </p>
      ) : null}
      <p style={formulaStyle}>
        {t({
          bn: 'হারগুলো উদাহরণ মাত্র — ব্যাংকের হার সময়ের সাথে বদলায়। টাকা জমা দেওয়া বা লোন নেওয়ার আগে নিজের ব্যাংকে বর্তমান হার যাচাই করুন। তথ্য: 27 Nov 2026।',
          en: 'The rates are examples only — bank rates change over time. Before depositing money or taking a loan, check the current rate with your bank. Noted: 27 Nov 2026.',
        })}
      </p>
    </section>
  );
}
