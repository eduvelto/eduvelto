// Eduvelto — Income Tax Calculator tool UI.
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Pure calculation lives in src/lib/tools/incomeTax.ts. The tax slabs
// are EDITABLE DATA: every limit and rate below is a user-editable
// field, and the defaults are STARTING VALUES ONLY from the general
// individual slabs of the Finance Act 2025 (NBR, assessment year
// 2025-26). Rates change with every budget — the result is labelled
// আনুমানিক (estimated) and the UI tells the user to check the
// current NBR slabs before filing. This is not tax advice.
//
// Design (Batch 2 pattern): gradient hero, headline annual tax +
// tiles, copy buttons, an editable slab table with a per-slab
// breakdown, a formula with the user's own numbers, and a free
// summary download via RewardedAdButton. Opens empty — the example
// fills in only when tapped.

import { useMemo, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  BD_TAX_SOURCE_BN,
  BD_TAX_SOURCE_EN,
  calculateIncomeTax,
  DEFAULT_BD_TAX_SLABS_2025_26,
  type TaxSlab,
} from '../../lib/tools/incomeTax';
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
  resultStyle,
  SummaryDownload,
  tableStyle,
  tileGridStyle,
  tileLabelStyle,
  tileStyle,
  tileValueStyle,
  useCopyText,
} from './financeUi';

const rateInputStyle = { ...inputStyle, width: 90, minHeight: 36, padding: '6px 8px' };

export function IncomeTaxTool() {
  const { t } = useLanguage();
  const [income, setIncome] = useState('');
  const [taxFree, setTaxFree] = useState(String(DEFAULT_BD_TAX_SLABS_2025_26[0].upTo));
  const [limit2, setLimit2] = useState(String(DEFAULT_BD_TAX_SLABS_2025_26[1].upTo));
  const [limit3, setLimit3] = useState(String(DEFAULT_BD_TAX_SLABS_2025_26[2].upTo));
  const [limit4, setLimit4] = useState(String(DEFAULT_BD_TAX_SLABS_2025_26[3].upTo));
  const [limit5, setLimit5] = useState(String(DEFAULT_BD_TAX_SLABS_2025_26[4].upTo));
  const [rate2, setRate2] = useState(String(DEFAULT_BD_TAX_SLABS_2025_26[1].ratePercent));
  const [rate3, setRate3] = useState(String(DEFAULT_BD_TAX_SLABS_2025_26[2].ratePercent));
  const [rate4, setRate4] = useState(String(DEFAULT_BD_TAX_SLABS_2025_26[3].ratePercent));
  const [rate5, setRate5] = useState(String(DEFAULT_BD_TAX_SLABS_2025_26[4].ratePercent));
  const [rate6, setRate6] = useState(String(DEFAULT_BD_TAX_SLABS_2025_26[5].ratePercent));
  const { copied, copyText } = useCopyText();

  const incomeV = parseAmount(income);
  const limits = [parseAmount(taxFree), parseAmount(limit2), parseAmount(limit3), parseAmount(limit4), parseAmount(limit5)];
  const rates = [parseAmount(rate2), parseAmount(rate3), parseAmount(rate4), parseAmount(rate5), parseAmount(rate6)];
  const slabRaws = [taxFree, limit2, limit3, limit4, limit5, rate2, rate3, rate4, rate5, rate6];
  const slabVals = [...limits, ...rates];
  const limitsAscending =
    limits.every((v) => v !== null && v > 0) &&
    limits.every((v, i) => i === 0 || (v as number) > (limits[i - 1] as number));
  const ratesValid = rates.every((v) => v !== null && v >= 0 && v <= 100);
  const invalid =
    (incomeV !== null && incomeV < 0) ||
    (income.trim() !== '' && incomeV === null) ||
    slabRaws.some((raw, i) => raw.trim() !== '' && slabVals[i] === null) ||
    !limitsAscending ||
    !ratesValid;
  const ready = !invalid && incomeV !== null;

  const slabs: TaxSlab[] | null =
    limitsAscending && ratesValid
      ? [
          { upTo: limits[0], ratePercent: 0 },
          { upTo: limits[1], ratePercent: rates[0] as number },
          { upTo: limits[2], ratePercent: rates[1] as number },
          { upTo: limits[3], ratePercent: rates[2] as number },
          { upTo: limits[4], ratePercent: rates[3] as number },
          { upTo: null, ratePercent: rates[4] as number },
        ]
      : null;

  const result = useMemo(() => {
    if (!ready || !slabs) return null;
    try {
      return calculateIncomeTax({ annualIncome: incomeV as number, slabs });
    } catch {
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, incomeV, slabs]);

  function loadExample(): void {
    setIncome('600000');
  }

  function slabRangeLabel(index: number, upTo: number | null, lower: number): string {
    if (upTo === null) return `৳${fmtMoney(lower + 1)}+`;
    if (index === 0) return `৳0 – ৳${fmtMoney(upTo)}`;
    return `৳${fmtMoney(lower + 1)} – ৳${fmtMoney(upTo)}`;
  }

  const summary = result
    ? t({
        bn: `আয়কর (আনুমানিক): বার্ষিক আয় ৳${fmtMoney(incomeV as number)}-এর উপর আনুমানিক কর ৳${fmtMoney(result.tax)} (মাসে ৳${fmtMoney(result.monthlyTax)}), কার্যকর হার ${result.effectiveRatePercent}%। হার প্রতি বাজেটে বদলাতে পারে — দাখিলের আগে NBR-এ যাচাই করুন।`,
        en: `Income tax (estimate): on yearly income ৳${fmtMoney(incomeV as number)}, estimated tax ৳${fmtMoney(result.tax)} (৳${fmtMoney(result.monthlyTax)}/month), effective rate ${result.effectiveRatePercent}%. Rates change with every budget — check the current NBR slabs before filing.`,
      })
    : null;

  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="income-tax-title">
      <FinanceHero
        titleId="income-tax-title"
        titleBn="আয়কর ক্যালকুলেটর"
        titleEn="Income Tax Calculator"
        descBn="বার্ষিক আয় দিন — আনুমানিক আয়কর বের হয়ে যাবে। করের ধাপ (স্ল্যাব) ও হার নিচে নিজে বদলাতে পারবেন; এগুলো শুরুর মান মাত্র। এটি কর-পরামর্শ নয়।"
        descEn="Enter your yearly income — see the estimated income tax. You can change the tax slabs and rates below; they are starting values only. This is not tax advice."
        trustBn="১০০% ব্রাউজারে • কোনো আপলোড নয়"
        trustEn="100% in-browser • nothing uploaded"
      />
      <div style={gridStyle}>
        <div>
          <label style={labelStyle} htmlFor="income-tax-income">
            {t({ bn: 'বার্ষিক আয়', en: 'Annual income' })}
          </label>
          <input
            id="income-tax-income"
            style={inputStyle}
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={income}
            onChange={(e) => setIncome(e.target.value)}
            placeholder="600000"
          />
        </div>
      </div>
      <h3 style={{ fontSize: 16, color: 'var(--heading)', margin: '16px 0 4px' }}>
        {t({ bn: 'করের ধাপ (স্ল্যাব) — নিজে বদলাতে পারবেন', en: 'Tax slabs — you can change these' })}
      </h3>
      <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 4px' }}>
        {t({ bn: BD_TAX_SOURCE_BN, en: BD_TAX_SOURCE_EN })}
      </p>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={cellStyle}>{t({ bn: 'ধাপ', en: 'Slab' })}</th>
            <th style={cellStyle}>{t({ bn: 'ঊর্ধ্বসীমা (৳)', en: 'Upper limit (৳)' })}</th>
            <th style={cellStyle}>{t({ bn: 'হার (%)', en: 'Rate (%)' })}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={cellStyle}>{t({ bn: 'করমুক্ত', en: 'Tax-free' })}</td>
            <td style={cellStyle}>
              <input
                style={rateInputStyle}
                type="number"
                min="0"
                inputMode="decimal"
                aria-label={t({ bn: 'করমুক্ত সীমা', en: 'Tax-free limit' })}
                value={taxFree}
                onChange={(e) => setTaxFree(e.target.value)}
              />
            </td>
            <td style={cellStyle}>0%</td>
          </tr>
          {[
            { limit: limit2, setLimit: setLimit2, rate: rate2, setRate: setRate2, label: '2' },
            { limit: limit3, setLimit: setLimit3, rate: rate3, setRate: setRate3, label: '3' },
            { limit: limit4, setLimit: setLimit4, rate: rate4, setRate: setRate4, label: '4' },
            { limit: limit5, setLimit: setLimit5, rate: rate5, setRate: setRate5, label: '5' },
          ].map((row) => (
            <tr key={row.label}>
              <td style={cellStyle}>
                {t({ bn: `ধাপ ${row.label}`, en: `Slab ${row.label}` })}
              </td>
              <td style={cellStyle}>
                <input
                  style={rateInputStyle}
                  type="number"
                  min="0"
                  inputMode="decimal"
                  aria-label={t({ bn: `ধাপ ${row.label} ঊর্ধ্বসীমা`, en: `Slab ${row.label} upper limit` })}
                  value={row.limit}
                  onChange={(e) => row.setLimit(e.target.value)}
                />
              </td>
              <td style={cellStyle}>
                <input
                  style={rateInputStyle}
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  inputMode="decimal"
                  aria-label={t({ bn: `ধাপ ${row.label} হার`, en: `Slab ${row.label} rate` })}
                  value={row.rate}
                  onChange={(e) => row.setRate(e.target.value)}
                />
              </td>
            </tr>
          ))}
          <tr>
            <td style={cellStyle}>{t({ bn: 'সর্বোচ্চ ধাপ', en: 'Top slab' })}</td>
            <td style={cellStyle}>{t({ bn: 'সীমাহীন', en: 'No limit' })}</td>
            <td style={cellStyle}>
              <input
                style={rateInputStyle}
                type="number"
                min="0"
                max="100"
                step="0.01"
                inputMode="decimal"
                aria-label={t({ bn: 'সর্বোচ্চ ধাপের হার', en: 'Top slab rate' })}
                value={rate6}
                onChange={(e) => setRate6(e.target.value)}
              />
            </td>
          </tr>
        </tbody>
      </table>
      <div style={buttonRowStyle}>
        <button type="button" className="ev-btn-outline" onClick={loadExample}>
          {t({ bn: 'উদাহরণ বসান (বার্ষিক আয় ৳৬ লাখ)', en: 'Load example (yearly income ৳600,000)' })}
        </button>
      </div>
      {result ? (
        <div style={resultStyle} role="status">
          <p style={headlineLabelStyle}>{t({ bn: 'আনুমানিক বার্ষিক কর', en: 'Estimated annual tax' })}</p>
          <p style={headlineStyle}>৳{fmtMoney(result.tax)}</p>
          <div style={buttonRowStyle}>
            <button
              type="button"
              className="ev-btn-outline"
              onClick={() => void copyText(`৳${fmtMoney(result.tax)}`, 'tax')}
            >
              {copied === 'tax'
                ? t({ bn: 'কপি হয়েছে', en: 'Copied' })
                : t({ bn: 'কর কপি করুন', en: 'Copy tax' })}
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
              <p style={tileLabelStyle}>{t({ bn: 'মাসিক কর', en: 'Monthly tax' })}</p>
              <p style={tileValueStyle}>৳{fmtMoney(result.monthlyTax)}</p>
            </div>
            <div style={tileStyle}>
              <p style={tileLabelStyle}>{t({ bn: 'কার্যকর হার', en: 'Effective rate' })}</p>
              <p style={tileValueStyle}>{result.effectiveRatePercent}%</p>
            </div>
            <div style={tileStyle}>
              <p style={tileLabelStyle}>{t({ bn: 'করযোগ্য আয়', en: 'Taxable income' })}</p>
              <p style={tileValueStyle}>৳{fmtMoney(result.taxableIncome)}</p>
            </div>
          </div>
          <h3 style={{ fontSize: 16, color: 'var(--heading)', margin: '16px 0 4px' }}>
            {t({ bn: 'ধাপভিত্তিক হিসাব', en: 'Breakdown by slab' })}
          </h3>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={cellStyle}>{t({ bn: 'ধাপ', en: 'Slab' })}</th>
                <th style={cellStyle}>{t({ bn: 'হার', en: 'Rate' })}</th>
                <th style={cellStyle}>{t({ bn: 'কর', en: 'Tax' })}</th>
              </tr>
            </thead>
            <tbody>
              {result.breakdown.map((row, i) => {
                const lower = i === 0 ? 0 : (result.breakdown[i - 1].upTo as number);
                return (
                  <tr key={i}>
                    <td style={cellStyle}>{slabRangeLabel(i, row.upTo, lower)}</td>
                    <td style={cellStyle}>{row.ratePercent}%</td>
                    <td style={cellStyle}>৳{fmtMoney(row.taxInSlab)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p style={formulaStyle}>
            {t({
              bn: `সূত্র: বার্ষিক আয় ৳${fmtMoney(incomeV as number)}; করমুক্ত ৳${fmtMoney(limits[0] as number)} বাদে করযোগ্য আয় ৳${fmtMoney(result.taxableIncome)}; প্রতিটি ধাপে (ধাপের আয় × ধাপের হার) যোগ করে মোট কর ৳${fmtMoney(result.tax)}। কার্যকর হার = ৳${fmtMoney(result.tax)} ÷ ৳${fmtMoney(incomeV as number)} × ১০০ = ${result.effectiveRatePercent}%।`,
              en: `Formula: yearly income ৳${fmtMoney(incomeV as number)}; taxable income ৳${fmtMoney(result.taxableIncome)} after the ৳${fmtMoney(limits[0] as number)} tax-free slab; adding (income in each slab × slab rate) gives total tax ৳${fmtMoney(result.tax)}. Effective rate = ৳${fmtMoney(result.tax)} ÷ ৳${fmtMoney(incomeV as number)} × 100 = ${result.effectiveRatePercent}%.`,
            })}
          </p>
          <p style={formulaStyle}>
            {t({
              bn: 'এটি একটি আনুমানিক হিসাব — ছাড়, রিবেট, সারচার্জ ও অন্যান্য শ্রেণির (নারী, প্রবীণ, প্রতিবন্ধী) করমুক্ত সীমা এখানে ধরা হয়নি। দাখিলের আগে NBR-এর বর্তমান নিয়ম যাচাই করুন।',
              en: 'This is an estimate — exemptions, rebates, surcharge and other categories (different tax-free limits) are not included. Check the current NBR rules before filing.',
            })}
          </p>
          <SummaryDownload filename="income-tax-summary.txt" text={summary} durationSeconds={15} />
        </div>
      ) : invalid ? (
        <p style={errorStyle} role="alert">
          {t({ bn: 'সঠিক মান দিন — ধাপের সীমাগুলো ক্রমবর্ধমান হতে হবে, হার ০–১০০%-এর মধ্যে হতে হবে।', en: 'Enter valid values — slab limits must increase, and rates must be between 0% and 100%.' })}
        </p>
      ) : null}
    </section>
  );
}
