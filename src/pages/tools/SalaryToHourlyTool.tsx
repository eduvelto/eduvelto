// Eduvelto — Salary to Hourly Converter tool UI.
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Pure calculation lives in src/lib/tools/salaryToHourly.ts: yearly =
// monthly x 12 = weekly x 52 = daily x 5 x 52; hourly = yearly /
// (hours per week x 52). A 5-day working week is assumed for the
// daily rate (stated in the UI). No salary figure is hardcoded —
// every number is the user's own. All results are estimates.
//
// Design (Batch 2 pattern): gradient hero, headline hourly rate +
// tiles, copy buttons, working-hours presets, a reverse mode
// ("hourly rate -> monthly salary"), a formula with the user's own
// numbers, and a free summary download via RewardedAdButton. Opens
// empty — the example fills in only when tapped.

import { useMemo, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { convertSalary, hourlyToSalary, type SalaryPeriod } from '../../lib/tools/salaryToHourly';
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

const HOURS_PRESETS = [40, 45, 48];

export function SalaryToHourlyTool() {
  const { t } = useLanguage();
  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState<SalaryPeriod>('monthly');
  const [hoursPerWeek, setHoursPerWeek] = useState('40');
  const [hourlyRate, setHourlyRate] = useState('');
  const { copied, copyText } = useCopyText();

  const amountV = parseAmount(amount);
  const hoursV = parseAmount(hoursPerWeek);
  const hourlyV = parseAmount(hourlyRate);
  const invalid =
    [amountV, hoursV, hourlyV].some((v) => v !== null && v < 0) ||
    [amount, hoursPerWeek, hourlyRate].some(
      (raw, i) => raw.trim() !== '' && [amountV, hoursV, hourlyV][i] === null,
    ) ||
    (hoursV !== null && hoursV <= 0);
  const ready = !invalid && amountV !== null && hoursV !== null && hoursV > 0;

  const result = useMemo(() => {
    if (!ready) return null;
    try {
      return convertSalary({ amount: amountV as number, period, hoursPerWeek: hoursV as number });
    } catch {
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, amountV, period, hoursV]);

  const reverse =
    hourlyV !== null && hourlyV >= 0 && hoursV !== null && hoursV > 0 && !invalid
      ? (() => {
          try {
            return hourlyToSalary({ hourlyRate: hourlyV, hoursPerWeek: hoursV });
          } catch {
            return null;
          }
        })()
      : null;

  function loadExample(): void {
    setAmount('50000');
    setPeriod('monthly');
    setHoursPerWeek('40');
  }

  const periodLabel = t({
    bn: period === 'monthly' ? 'মাসিক' : period === 'yearly' ? 'বার্ষিক' : period === 'weekly' ? 'সাপ্তাহিক' : 'দৈনিক',
    en: period,
  });

  const summary = result
    ? t({
        bn: `বেতন রূপান্তর (আনুমানিক): ${periodLabel} বেতন ৳${fmtMoney(amountV as number)}, সপ্তাহে ${hoursV} ঘণ্টা — ঘণ্টাপ্রতি ৳${fmtMoney(result.hourly)}, দৈনিক ৳${fmtMoney(result.daily)}, সাপ্তাহিক ৳${fmtMoney(result.weekly)}, মাসিক ৳${fmtMoney(result.monthly)}, বার্ষিক ৳${fmtMoney(result.yearly)}।`,
        en: `Salary conversion (estimate): ${period} salary ৳${fmtMoney(amountV as number)}, ${hoursV} hours/week — hourly ৳${fmtMoney(result.hourly)}, daily ৳${fmtMoney(result.daily)}, weekly ৳${fmtMoney(result.weekly)}, monthly ৳${fmtMoney(result.monthly)}, yearly ৳${fmtMoney(result.yearly)}.`,
      })
    : null;

  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="salary-title">
      <FinanceHero
        titleId="salary-title"
        titleBn="বেতন থেকে ঘণ্টাপ্রতি হার"
        titleEn="Salary to Hourly Converter"
        descBn="মাসিক বা বার্ষিক বেতন ও সপ্তাহে কত ঘণ্টা কাজ করেন তা দিন — ঘণ্টাপ্রতি, দৈনিক, সাপ্তাহিক ও বার্ষিক হার বের হয়ে যাবে। দৈনিক হারে ৫ দিনের কর্মসপ্তাহ ধরা হয়েছে।"
        descEn="Enter a monthly or yearly salary and your weekly working hours — see the hourly, daily, weekly and yearly rates. The daily rate assumes a 5-day working week."
        trustBn="১০০% ব্রাউজারে • কোনো আপলোড নয়"
        trustEn="100% in-browser • nothing uploaded"
      />
      <div style={gridStyle}>
        <div>
          <label style={labelStyle} htmlFor="salary-amount">
            {t({ bn: 'বেতনের পরিমাণ', en: 'Salary amount' })}
          </label>
          <input
            id="salary-amount"
            style={inputStyle}
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="50000"
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="salary-period">
            {t({ bn: 'বেতনের সময়কাল', en: 'Salary period' })}
          </label>
          <select
            id="salary-period"
            style={inputStyle}
            value={period}
            onChange={(e) => setPeriod(e.target.value as SalaryPeriod)}
          >
            <option value="monthly">{t({ bn: 'মাসিক', en: 'Monthly' })}</option>
            <option value="yearly">{t({ bn: 'বার্ষিক', en: 'Yearly' })}</option>
            <option value="weekly">{t({ bn: 'সাপ্তাহিক', en: 'Weekly' })}</option>
            <option value="daily">{t({ bn: 'দৈনিক', en: 'Daily' })}</option>
          </select>
        </div>
        <div>
          <label style={labelStyle} htmlFor="salary-hours">
            {t({ bn: 'সপ্তাহে কাজের ঘণ্টা', en: 'Working hours per week' })}
          </label>
          <input
            id="salary-hours"
            style={inputStyle}
            type="number"
            min="0"
            step="0.5"
            inputMode="decimal"
            value={hoursPerWeek}
            onChange={(e) => setHoursPerWeek(e.target.value)}
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="salary-hourly-reverse">
            {t({ bn: 'উল্টো হিসাব — ঘণ্টাপ্রতি হার (ঐচ্ছিক)', en: 'Reverse — hourly rate (optional)' })}
          </label>
          <input
            id="salary-hourly-reverse"
            style={inputStyle}
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={hourlyRate}
            onChange={(e) => setHourlyRate(e.target.value)}
            placeholder="300"
          />
        </div>
      </div>
      <div style={{ marginTop: 14 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--heading)', margin: '0 0 4px' }}>
          {t({ bn: 'সাপ্তাহিক ঘণ্টার প্রিসেট', en: 'Weekly hours presets' })}
        </p>
        <div style={presetRowStyle} role="group" aria-label={t({ bn: 'সপ্তাহে কাজের ঘণ্টা', en: 'Working hours per week' })}>
          {HOURS_PRESETS.map((h) => (
            <button
              key={h}
              type="button"
              style={presetChipStyle(hoursPerWeek === String(h))}
              aria-pressed={hoursPerWeek === String(h)}
              onClick={() => setHoursPerWeek(String(h))}
            >
              {h} {t({ bn: 'ঘণ্টা', en: 'hours' })}
            </button>
          ))}
        </div>
      </div>
      <div style={buttonRowStyle}>
        <button type="button" className="ev-btn-outline" onClick={loadExample}>
          {t({ bn: 'উদাহরণ বসান (মাসিক ৳৫০,০০০, সপ্তাহে ৪০ ঘণ্টা)', en: 'Load example (৳50,000/month, 40 hours/week)' })}
        </button>
      </div>
      {reverse && hourlyV !== null ? (
        <div style={{ ...resultStyle, background: 'var(--amber-soft)' }}>
          <p style={{ margin: 0, fontSize: 15 }}>
            {t({
              bn: `ঘণ্টায় ৳${fmtMoney(hourlyV)} হলে মাসিক বেতন ৳${fmtMoney(reverse.monthly)}, বার্ষিক ৳${fmtMoney(reverse.yearly)} (আনুমানিক)।`,
              en: `At ৳${fmtMoney(hourlyV)}/hour, the monthly salary is ৳${fmtMoney(reverse.monthly)} and yearly ৳${fmtMoney(reverse.yearly)} (estimate).`,
            })}
          </p>
        </div>
      ) : null}
      {result ? (
        <div style={resultStyle} role="status">
          <p style={headlineLabelStyle}>{t({ bn: 'ঘণ্টাপ্রতি হার — আনুমানিক', en: 'Hourly rate — estimate' })}</p>
          <p style={headlineStyle}>৳{fmtMoney(result.hourly)}</p>
          <div style={buttonRowStyle}>
            <button
              type="button"
              className="ev-btn-outline"
              onClick={() => void copyText(`৳${fmtMoney(result.hourly)}`, 'hourly')}
            >
              {copied === 'hourly'
                ? t({ bn: 'কপি হয়েছে', en: 'Copied' })
                : t({ bn: 'ঘণ্টাপ্রতি হার কপি করুন', en: 'Copy hourly rate' })}
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
              <p style={tileLabelStyle}>{t({ bn: 'দৈনিক', en: 'Daily' })}</p>
              <p style={tileValueStyle}>৳{fmtMoney(result.daily)}</p>
            </div>
            <div style={tileStyle}>
              <p style={tileLabelStyle}>{t({ bn: 'সাপ্তাহিক', en: 'Weekly' })}</p>
              <p style={tileValueStyle}>৳{fmtMoney(result.weekly)}</p>
            </div>
            <div style={tileStyle}>
              <p style={tileLabelStyle}>{t({ bn: 'মাসিক', en: 'Monthly' })}</p>
              <p style={tileValueStyle}>৳{fmtMoney(result.monthly)}</p>
            </div>
            <div style={tileStyle}>
              <p style={tileLabelStyle}>{t({ bn: 'বার্ষিক', en: 'Yearly' })}</p>
              <p style={tileValueStyle}>৳{fmtMoney(result.yearly)}</p>
            </div>
          </div>
          <p style={formulaStyle}>
            {t({
              bn: `সূত্র: বার্ষিক বেতন = ৳${fmtMoney(result.yearly)}; বছরে কাজের ঘণ্টা = ${hoursV} × ৫২ = ${(hoursV as number) * 52}; ঘণ্টাপ্রতি = ৳${fmtMoney(result.yearly)} ÷ ${(hoursV as number) * 52} = ৳${fmtMoney(result.hourly)}। দৈনিক হার ৫ দিনের কর্মসপ্তাহ ধরে হিসাব করা হয়েছে।`,
              en: `Formula: yearly salary = ৳${fmtMoney(result.yearly)}; working hours per year = ${hoursV} × 52 = ${(hoursV as number) * 52}; hourly = ৳${fmtMoney(result.yearly)} ÷ ${(hoursV as number) * 52} = ৳${fmtMoney(result.hourly)}. The daily rate assumes a 5-day working week.`,
            })}
          </p>
          <SummaryDownload filename="salary-to-hourly-summary.txt" text={summary} />
        </div>
      ) : invalid ? (
        <p style={errorStyle} role="alert">
          {t({ bn: 'সঠিক মান দিন — সপ্তাহের কাজের ঘণ্টা শূন্যের বেশি হতে হবে।', en: 'Enter valid values — weekly working hours must be above zero.' })}
        </p>
      ) : null}
    </section>
  );
}
