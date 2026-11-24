// Eduvelto Life calculators (§3C) — /life/calculators.
//
// EMI/loan, compound + simple interest, percentage, age and BMI
// calculators. Everything is computed client-side from the pure
// functions in ../lib/lifeCalculators — no network, no data stored.

import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { PageShell } from '../components/PageShell';
import { Breadcrumb } from '../components/Breadcrumb';
import {
  bmiCategoryLabel,
  calculateAge,
  calculateBmi,
  calculateCompoundInterest,
  calculateEmi,
  calculatePercentage,
  calculateSimpleInterest,
  type PercentageMode,
} from '../lib/lifeCalculators';

const inputStyle: CSSProperties = {
  width: '100%',
  minHeight: 44,
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid var(--line)',
  fontSize: 15,
  boxSizing: 'border-box',
  background: 'var(--surface)',
  color: 'var(--heading)',
};

const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--heading)',
  marginBottom: 6,
};

const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: 12,
};

const cardStyle: CSSProperties = {
  marginTop: 20,
  padding: '18px 16px',
};

const resultStyle: CSSProperties = {
  marginTop: 14,
  padding: '14px 16px',
  borderRadius: 10,
  background: 'var(--teal-soft)',
};

const formulaStyle: CSSProperties = {
  margin: '10px 0 0',
  fontSize: 13,
  color: 'var(--muted)',
};

const errorStyle: CSSProperties = {
  marginTop: 14,
  color: '#b3261e',
  fontSize: 14,
};

function fmtMoney(n: number): string {
  return `৳${Math.round(n).toLocaleString('en-IN')}`;
}

function fmtNum(n: number, digits = 2): string {
  return n.toLocaleString('en-IN', { maximumFractionDigits: digits, minimumFractionDigits: digits });
}

/** Parse a text input to a number; empty string means "not entered yet". */
function parseNum(raw: string): number | null {
  if (raw.trim() === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function SectionTitle({ bn, en }: { bn: string; en: string }) {
  const { t } = useLanguage();
  return <h2 style={{ fontSize: 19, color: 'var(--heading)', margin: '0 0 4px' }}>{t({ bn, en })}</h2>;
}

function EmiSection() {
  const { t, lang } = useLanguage();
  const [principal, setPrincipal] = useState('');
  const [rate, setRate] = useState('');
  const [months, setMonths] = useState('');
  const p = parseNum(principal);
  const r = parseNum(rate);
  const m = parseNum(months);
  const filled = p !== null || r !== null || m !== null;
  const result = useMemo(
    () => (p !== null && r !== null && m !== null ? calculateEmi(p, r, m) : null),
    [p, r, m],
  );
  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="emi-title">
      <div id="emi-title">
        <SectionTitle bn="ঋণ/ইএমআই ক্যালকুলেটর" en="EMI / Loan Calculator" />
      </div>
      <p style={{ color: 'var(--muted)', fontSize: 14, margin: '0 0 14px' }}>
        {t({
          bn: 'মাসিক কিস্তি, মোট পরিশোধ ও মোট সুদ বের করুন।',
          en: 'Find the monthly instalment, total payment and total interest.',
        })}
      </p>
      <div style={gridStyle}>
        <div>
          <label style={labelStyle} htmlFor="emi-principal">
            {t({ bn: 'ঋণের পরিমাণ (টাকা)', en: 'Loan amount (taka)' })}
          </label>
          <input
            id="emi-principal"
            style={inputStyle}
            type="number"
            min="1"
            inputMode="decimal"
            value={principal}
            onChange={(e) => setPrincipal(e.target.value)}
            placeholder={lang === 'bn' ? '১০০০০০' : '100000'}
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="emi-rate">
            {t({ bn: 'বার্ষিক সুদের হার (%)', en: 'Annual interest rate (%)' })}
          </label>
          <input
            id="emi-rate"
            style={inputStyle}
            type="number"
            min="0"
            step="0.1"
            inputMode="decimal"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            placeholder={lang === 'bn' ? '১২' : '12'}
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="emi-months">
            {t({ bn: 'মেয়াদ (মাস)', en: 'Tenure (months)' })}
          </label>
          <input
            id="emi-months"
            style={inputStyle}
            type="number"
            min="1"
            max="600"
            inputMode="numeric"
            value={months}
            onChange={(e) => setMonths(e.target.value)}
            placeholder={lang === 'bn' ? '১২' : '12'}
          />
        </div>
      </div>
      {result ? (
        <div style={resultStyle} role="status">
          <p style={{ margin: '0 0 6px', fontSize: 16 }}>
            <strong>{t({ bn: 'মাসিক কিস্তি (EMI): ', en: 'Monthly EMI: ' })}</strong>
            {fmtMoney(result.emi)}
          </p>
          <p style={{ margin: '0 0 6px', fontSize: 15 }}>
            {t({ bn: 'মোট পরিশোধ: ', en: 'Total payment: ' })}
            {fmtMoney(result.totalPayment)}
          </p>
          <p style={{ margin: 0, fontSize: 15 }}>
            {t({ bn: 'মোট সুদ: ', en: 'Total interest: ' })}
            {fmtMoney(result.totalInterest)}
          </p>
          <p style={formulaStyle}>
            {t({
              bn: 'সূত্র: EMI = P × r × (1+r)ⁿ ÷ ((1+r)ⁿ − 1); এখানে r = মাসিক সুদের হার, n = মাসের সংখ্যা।',
              en: 'Formula: EMI = P × r × (1+r)ⁿ ÷ ((1+r)ⁿ − 1), where r = monthly rate, n = number of months.',
            })}
          </p>
        </div>
      ) : filled ? (
        <p style={errorStyle} role="alert">
          {t({
            bn: 'সঠিক মান দিন — পরিমাণ ও মেয়াদ ০-এর বেশি হতে হবে, সুদের হার ০ বা তার বেশি।',
            en: 'Enter valid values — amount and tenure must be above 0, rate 0 or above.',
          })}
        </p>
      ) : null}
    </section>
  );
}

function InterestSection() {
  const { t, lang } = useLanguage();
  const [principal, setPrincipal] = useState('');
  const [rate, setRate] = useState('');
  const [years, setYears] = useState('');
  const [compounding, setCompounding] = useState('1');
  const p = parseNum(principal);
  const r = parseNum(rate);
  const y = parseNum(years);
  const n = parseNum(compounding) ?? 1;
  const filled = p !== null || r !== null || y !== null;
  const compound = useMemo(
    () => (p !== null && r !== null && y !== null ? calculateCompoundInterest(p, r, y, n) : null),
    [p, r, y, n],
  );
  const simple = useMemo(
    () => (p !== null && r !== null && y !== null ? calculateSimpleInterest(p, r, y) : null),
    [p, r, y],
  );
  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="interest-title">
      <div id="interest-title">
        <SectionTitle bn="সুদ ক্যালকুলেটর" en="Interest Calculator" />
      </div>
      <p style={{ color: 'var(--muted)', fontSize: 14, margin: '0 0 14px' }}>
        {t({
          bn: 'চক্রবৃদ্ধি ও সরল — দুইভাবেই হিসাব দেখুন।',
          en: 'See both compound and simple interest for the same inputs.',
        })}
      </p>
      <div style={gridStyle}>
        <div>
          <label style={labelStyle} htmlFor="int-principal">
            {t({ bn: 'আসল (টাকা)', en: 'Principal (taka)' })}
          </label>
          <input
            id="int-principal"
            style={inputStyle}
            type="number"
            min="1"
            inputMode="decimal"
            value={principal}
            onChange={(e) => setPrincipal(e.target.value)}
            placeholder={lang === 'bn' ? '১০০০০' : '10000'}
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="int-rate">
            {t({ bn: 'বার্ষিক সুদের হার (%)', en: 'Annual interest rate (%)' })}
          </label>
          <input
            id="int-rate"
            style={inputStyle}
            type="number"
            min="0"
            step="0.1"
            inputMode="decimal"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            placeholder={lang === 'bn' ? '১০' : '10'}
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="int-years">
            {t({ bn: 'সময় (বছর)', en: 'Time (years)' })}
          </label>
          <input
            id="int-years"
            style={inputStyle}
            type="number"
            min="0"
            step="0.5"
            inputMode="decimal"
            value={years}
            onChange={(e) => setYears(e.target.value)}
            placeholder={lang === 'bn' ? '২' : '2'}
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="int-compounding">
            {t({ bn: 'চক্রবৃদ্ধি (বছরে কতবার)', en: 'Compounding (times per year)' })}
          </label>
          <select id="int-compounding" style={inputStyle} value={compounding} onChange={(e) => setCompounding(e.target.value)}>
            <option value="1">{t({ bn: 'বছরে ১ বার', en: 'Yearly' })}</option>
            <option value="2">{t({ bn: 'বছরে ২ বার', en: 'Half-yearly' })}</option>
            <option value="4">{t({ bn: 'বছরে ৪ বার', en: 'Quarterly' })}</option>
            <option value="12">{t({ bn: 'মাসে ১ বার', en: 'Monthly' })}</option>
          </select>
        </div>
      </div>
      {compound && simple ? (
        <div style={resultStyle} role="status">
          <p style={{ margin: '0 0 6px', fontSize: 16 }}>
            <strong>{t({ bn: 'চক্রবৃদ্ধি সুদ: ', en: 'Compound interest: ' })}</strong>
            {fmtMoney(compound.interest)} · {t({ bn: 'মোট: ', en: 'Total: ' })}
            {fmtMoney(compound.maturityAmount)}
          </p>
          <p style={{ margin: '0 0 6px', fontSize: 15 }}>
            <strong>{t({ bn: 'সরল সুদ: ', en: 'Simple interest: ' })}</strong>
            {fmtMoney(simple.interest)} · {t({ bn: 'মোট: ', en: 'Total: ' })}
            {fmtMoney(simple.maturityAmount)}
          </p>
          <p style={formulaStyle}>
            {t({
              bn: 'সূত্র: চক্রবৃদ্ধি — A = P(1 + r/n)ⁿᵗ; সরল — I = P × r × t।',
              en: 'Formulas: compound — A = P(1 + r/n)ⁿᵗ; simple — I = P × r × t.',
            })}
          </p>
        </div>
      ) : filled ? (
        <p style={errorStyle} role="alert">
          {t({
            bn: 'সঠিক মান দিন — আসল ও সময় ০-এর বেশি হতে হবে, সুদের হার ০ বা তার বেশি।',
            en: 'Enter valid values — principal and time must be above 0, rate 0 or above.',
          })}
        </p>
      ) : null}
    </section>
  );
}

const PERCENTAGE_MODES: { id: PercentageMode; bn: string; en: string }[] = [
  { id: 'of', bn: 'X% এর Y কত', en: 'What is X% of Y' },
  { id: 'what-percent', bn: 'X, Y-এর কত %', en: 'X is what % of Y' },
  { id: 'increase', bn: 'X-কে Y% বাড়ালে', en: 'Increase X by Y%' },
  { id: 'decrease', bn: 'X-কে Y% কমালে', en: 'Decrease X by Y%' },
];

function PercentageSection() {
  const { t, lang } = useLanguage();
  const [mode, setMode] = useState<PercentageMode>('of');
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const av = parseNum(a);
  const bv = parseNum(b);
  const filled = av !== null || bv !== null;
  const result = useMemo(
    () => (av !== null && bv !== null ? calculatePercentage(mode, av, bv) : null),
    [av, bv, mode],
  );
  const modeLabel = PERCENTAGE_MODES.find((m) => m.id === mode)!;
  const resultSuffix =
    mode === 'what-percent'
      ? '%'
      : '';
  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="pct-title">
      <div id="pct-title">
        <SectionTitle bn="শতকরা ক্যালকুলেটর" en="Percentage Calculator" />
      </div>
      <p style={{ color: 'var(--muted)', fontSize: 14, margin: '0 0 14px' }}>
        {t({
          bn: 'শতকরার হিসাব — ছাড়, বৃদ্ধি বা অনুপাত বের করুন।',
          en: 'Percentage math — discounts, increases and ratios.',
        })}
      </p>
      <div style={gridStyle}>
        <div>
          <label style={labelStyle} htmlFor="pct-mode">
            {t({ bn: 'হিসাবের ধরন', en: 'Calculation type' })}
          </label>
          <select id="pct-mode" style={inputStyle} value={mode} onChange={(e) => setMode(e.target.value as PercentageMode)}>
            {PERCENTAGE_MODES.map((m) => (
              <option key={m.id} value={m.id}>
                {t({ bn: m.bn, en: m.en })}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle} htmlFor="pct-a">
            {t({ bn: 'প্রথম সংখ্যা (X)', en: 'First number (X)' })}
          </label>
          <input
            id="pct-a"
            style={inputStyle}
            type="number"
            inputMode="decimal"
            value={a}
            onChange={(e) => setA(e.target.value)}
            placeholder={lang === 'bn' ? '২০' : '20'}
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="pct-b">
            {t({ bn: 'দ্বিতীয় সংখ্যা (Y)', en: 'Second number (Y)' })}
          </label>
          <input
            id="pct-b"
            style={inputStyle}
            type="number"
            inputMode="decimal"
            value={b}
            onChange={(e) => setB(e.target.value)}
            placeholder={lang === 'bn' ? '১৫০' : '150'}
          />
        </div>
      </div>
      {result !== null ? (
        <div style={resultStyle} role="status">
          <p style={{ margin: 0, fontSize: 16 }}>
            <strong>
              {t({ bn: modeLabel.bn, en: modeLabel.en })}: {fmtNum(result)}
              {resultSuffix}
            </strong>
          </p>
          <p style={formulaStyle}>
            {mode === 'of' &&
              t({ bn: 'সূত্র: (X ÷ ১০০) × Y', en: 'Formula: (X ÷ 100) × Y' })}
            {mode === 'what-percent' &&
              t({ bn: 'সূত্র: (X ÷ Y) × ১০০', en: 'Formula: (X ÷ Y) × 100' })}
            {mode === 'increase' &&
              t({ bn: 'সূত্র: X × (১ + Y ÷ ১০০)', en: 'Formula: X × (1 + Y ÷ 100)' })}
            {mode === 'decrease' &&
              t({ bn: 'সূত্র: X × (১ − Y ÷ ১০০)', en: 'Formula: X × (1 − Y ÷ 100)' })}
          </p>
        </div>
      ) : filled ? (
        <p style={errorStyle} role="alert">
          {t({
            bn: 'সঠিক সংখ্যা দিন (দ্বিতীয় সংখ্যা ০ হতে পারবে না)।',
            en: 'Enter valid numbers (the second number cannot be 0).',
          })}
        </p>
      ) : null}
    </section>
  );
}

function AgeSection() {
  const { t } = useLanguage();
  const [dob, setDob] = useState('');
  const result = useMemo(() => {
    if (!dob) return null;
    const parsed = new Date(`${dob}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return null;
    return calculateAge(parsed);
  }, [dob]);
  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="age-title">
      <div id="age-title">
        <SectionTitle bn="বয়স ক্যালকুলেটর" en="Age Calculator" />
      </div>
      <p style={{ color: 'var(--muted)', fontSize: 14, margin: '0 0 14px' }}>
        {t({
          bn: 'জন্মতারিখ থেকে আজ পর্যন্ত আপনার বয়স বের করুন।',
          en: 'Find your age from your date of birth to today.',
        })}
      </p>
      <div style={gridStyle}>
        <div>
          <label style={labelStyle} htmlFor="age-dob">
            {t({ bn: 'জন্মতারিখ', en: 'Date of birth' })}
          </label>
          <input
            id="age-dob"
            style={inputStyle}
            type="date"
            max={new Date().toISOString().slice(0, 10)}
            value={dob}
            onChange={(e) => setDob(e.target.value)}
          />
        </div>
      </div>
      {result ? (
        <div style={resultStyle} role="status">
          <p style={{ margin: '0 0 6px', fontSize: 16 }}>
            <strong>
              {t({ bn: 'বয়স: ', en: 'Age: ' })}
              {result.years} {t({ bn: 'বছর', en: 'years' })} {result.months} {t({ bn: 'মাস', en: 'months' })}{' '}
              {result.days} {t({ bn: 'দিন', en: 'days' })}
            </strong>
          </p>
          <p style={{ margin: 0, fontSize: 15 }}>
            {t({ bn: 'মোট দিন: ', en: 'Total days lived: ' })}
            {result.totalDays.toLocaleString('en-IN')}
          </p>
        </div>
      ) : dob ? (
        <p style={errorStyle} role="alert">
          {t({
            bn: 'জন্মতারিখ ভবিষ্যতের হতে পারবে না — সঠিক তারিখ দিন।',
            en: 'Date of birth cannot be in the future — enter a valid date.',
          })}
        </p>
      ) : null}
    </section>
  );
}

function BmiSection() {
  const { t, lang } = useLanguage();
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const w = parseNum(weight);
  const h = parseNum(height);
  const filled = w !== null || h !== null;
  const result = useMemo(() => (w !== null && h !== null ? calculateBmi(w, h) : null), [w, h]);
  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="bmi-title">
      <div id="bmi-title">
        <SectionTitle bn="বিএমআই ক্যালকুলেটর" en="BMI Calculator" />
      </div>
      <p style={{ color: 'var(--muted)', fontSize: 14, margin: '0 0 14px' }}>
        {t({
          bn: 'ওজন ও উচ্চতা থেকে বডি মাস ইনডেক্স (BMI) বের করুন।',
          en: 'Find your Body Mass Index (BMI) from weight and height.',
        })}
      </p>
      <div style={gridStyle}>
        <div>
          <label style={labelStyle} htmlFor="bmi-weight">
            {t({ bn: 'ওজন (কেজি)', en: 'Weight (kg)' })}
          </label>
          <input
            id="bmi-weight"
            style={inputStyle}
            type="number"
            min="1"
            max="500"
            step="0.1"
            inputMode="decimal"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder={lang === 'bn' ? '৬০' : '60'}
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="bmi-height">
            {t({ bn: 'উচ্চতা (সেমি)', en: 'Height (cm)' })}
          </label>
          <input
            id="bmi-height"
            style={inputStyle}
            type="number"
            min="1"
            max="250"
            step="0.1"
            inputMode="decimal"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            placeholder={lang === 'bn' ? '১৬৫' : '165'}
          />
        </div>
      </div>
      {result ? (
        <div style={resultStyle} role="status">
          <p style={{ margin: '0 0 6px', fontSize: 16 }}>
            <strong>
              {t({ bn: 'BMI: ', en: 'BMI: ' })}
              {fmtNum(result.bmi)}
            </strong>{' '}
            — {t(bmiCategoryLabel(result.category))}
          </p>
          <p style={{ margin: '0 0 6px', fontSize: 14, color: 'var(--muted)' }}>
            {t({
              bn: 'শ্রেণি: ১৮.৫-এর নিচে ওজন কম, ১৮.৫–২৪.৯ স্বাভাবিক, ২৫–২৯.৯ ওজন বেশি, ৩০ বা তার বেশি স্থূলতা।',
              en: 'Bands: below 18.5 underweight, 18.5–24.9 normal, 25–29.9 overweight, 30 or above obese.',
            })}
          </p>
          <p style={formulaStyle}>
            {t({
              bn: 'সূত্র: BMI = ওজন (কেজি) ÷ উচ্চতা (মিটার)²',
              en: 'Formula: BMI = weight (kg) ÷ height (metre)²',
            })}
          </p>
        </div>
      ) : filled ? (
        <p style={errorStyle} role="alert">
          {t({
            bn: 'সঠিক মান দিন — ওজন ও উচ্চতা ০-এর বেশি হতে হবে।',
            en: 'Enter valid values — weight and height must be above 0.',
          })}
        </p>
      ) : null}
      <p
        style={{
          marginTop: 16,
          padding: '12px 14px',
          borderRadius: 10,
          background: 'var(--hover)',
          fontSize: 13,
          color: 'var(--muted)',
        }}
      >
        {t({
          bn: 'সতর্কতা: BMI একটি মোটামুটি ধারণা মাত্র — এটি কোনো রোগ নির্ণয় নয়। পেশি, বয়স ও শারীরিক গঠনের কারণে BMI বিভ্রান্তিকর হতে পারে। স্বাস্থ্য নিয়ে কোনো সিদ্ধান্তের আগে চিকিৎসকের পরামর্শ নিন।',
          en: 'Note: BMI is only a rough indicator — it is not a diagnosis. Muscle, age and body build can make BMI misleading. Consult a doctor before making any health decision.',
        })}
      </p>
    </section>
  );
}

export default function LifeCalculatorsPage() {
  const { t, lang } = useLanguage();
  return (
    <PageShell titleBn="ক্যালকুলেটর" titleEn="Calculators">
      {/* Visible breadcrumb (24 Nov 2026 SEO pass) — labels match the BreadcrumbList JSON-LD in lib/seo.ts. */}
      <Breadcrumb items={[{ label: lang === 'bn' ? 'জীবন সেবা' : 'Life Services', to: '/life' }, { label: lang === 'bn' ? 'ক্যালকুলেটর' : 'Calculators' }]} />
      <p style={{ color: 'var(--muted)', margin: '0 0 8px' }}>
        {t({
          bn: 'দৈনন্দিন হিসাব-নিকাশ — সব হিসাব আপনার ডিভাইসেই হয়, কোনো তথ্য কোথাও পাঠানো হয় না।',
          en: 'Everyday calculations — everything is computed on your device, no data is sent anywhere.',
        })}
      </p>
      <EmiSection />
      <InterestSection />
      <PercentageSection />
      <AgeSection />
      <BmiSection />
    </PageShell>
  );
}
