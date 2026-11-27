// Eduvelto — Tip Calculator tool UI.
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Pure calculation lives in src/lib/tools/tipCalculator.ts: tip =
// bill x percent / 100, total = bill + tip, per person = total / people.
// Design polish (batch 2): hero band, headline result + tiles, preset
// chips, copy buttons, quick tip table, pre/post-tax comparison, a
// "service charge included?" note and a one-tap example. The tool
// still opens empty (tests assert no result on load) — the example
// fills in only when the user taps the button.

import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { calculateTip } from '../../lib/tools/tipCalculator';

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
  marginTop: 16,
  padding: '18px 16px',
};

const heroStyle: CSSProperties = {
  background: 'linear-gradient(135deg, var(--forest), var(--teal-deep))',
  borderRadius: 12,
  padding: '20px 18px',
  marginBottom: 16,
  boxShadow: 'var(--shadow-md)',
};

const heroTitleStyle: CSSProperties = {
  fontFamily: 'var(--font-head)',
  fontSize: 22,
  color: '#ffffff',
  margin: '0 0 6px',
};

const heroDescStyle: CSSProperties = {
  color: 'rgba(255, 255, 255, 0.88)',
  fontSize: 14,
  lineHeight: 1.6,
  margin: '0 0 12px',
};

const trustChipStyle: CSSProperties = {
  display: 'inline-block',
  fontSize: 12,
  fontWeight: 600,
  color: '#ffffff',
  background: 'rgba(255, 255, 255, 0.14)',
  border: '1px solid rgba(255, 255, 255, 0.45)',
  borderRadius: 999,
  padding: '4px 10px',
};

const resultStyle: CSSProperties = {
  marginTop: 14,
  padding: '18px 16px',
  borderRadius: 12,
  background: 'var(--teal-soft)',
  boxShadow: 'var(--shadow-sm)',
};

const headlineStyle: CSSProperties = {
  fontFamily: 'var(--font-head)',
  fontSize: '2.5rem',
  lineHeight: 1.15,
  color: 'var(--teal-deep)',
  margin: '4px 0 0',
};

const headlineLabelStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--muted)',
  margin: 0,
};

const tileGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
  gap: 10,
  marginTop: 14,
};

const tileStyle: CSSProperties = {
  background: 'var(--card)',
  border: '1px solid var(--line)',
  borderRadius: 12,
  padding: '12px',
  boxShadow: 'var(--shadow-sm)',
};

const tileLabelStyle: CSSProperties = {
  fontSize: 12,
  color: 'var(--muted)',
  margin: '0 0 4px',
};

const tileValueStyle: CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  color: 'var(--heading)',
  margin: 0,
};

const formulaStyle: CSSProperties = {
  margin: '12px 0 0',
  fontSize: 13,
  color: 'var(--muted)',
};

const errorStyle: CSSProperties = {
  marginTop: 14,
  color: '#b3261e',
  fontSize: 14,
};

const presetRowStyle: CSSProperties = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
  marginTop: 8,
};

const buttonRowStyle: CSSProperties = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
  marginTop: 14,
};

const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 14,
  marginTop: 12,
};

const cellStyle: CSSProperties = {
  borderBottom: '1px solid var(--line)',
  padding: '6px 4px',
  textAlign: 'left',
};

function presetChipStyle(active: boolean): CSSProperties {
  return {
    borderRadius: 999,
    padding: '6px 14px',
    minHeight: 36,
    border: '1px solid var(--teal)',
    background: active ? 'var(--teal)' : 'var(--card)',
    color: active ? '#ffffff' : 'var(--teal-deep)',
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
  };
}

function parseAmount(raw: string): number | null {
  if (raw.trim() === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function fmtMoney(n: number): string {
  return n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

const TIP_PRESETS = [5, 10, 15, 18, 20, 25];
const QUICK_TABLE_PERCENTS = [10, 15, 20, 25];

export function TipCalculatorTool() {
  const { t } = useLanguage();
  const [bill, setBill] = useState('');
  const [tipPercent, setTipPercent] = useState('10');
  const [people, setPeople] = useState('1');
  const [taxPercent, setTaxPercent] = useState('');
  const [tipBase, setTipBase] = useState<'pre' | 'post'>('pre');
  const [serviceIncluded, setServiceIncluded] = useState(false);
  const [copied, setCopied] = useState('');

  const billV = parseAmount(bill);
  const tipV = parseAmount(tipPercent);
  const peopleV = parseAmount(people);
  const taxV = parseAmount(taxPercent);
  const invalid =
    (billV !== null && billV < 0) ||
    (tipV !== null && tipV < 0) ||
    (taxV !== null && taxV < 0) ||
    (peopleV !== null && (!Number.isInteger(peopleV) || peopleV < 1)) ||
    (bill.trim() !== '' && billV === null) ||
    (tipPercent.trim() !== '' && tipV === null) ||
    (taxPercent.trim() !== '' && taxV === null) ||
    (people.trim() !== '' && peopleV === null);
  const ready =
    billV !== null && billV >= 0 && tipV !== null && tipV >= 0 &&
    peopleV !== null && Number.isInteger(peopleV) && peopleV >= 1;

  // Tip base: pre-tax tips on the bill as entered; post-tax tips on
  // bill + tax. With no tax entered both are identical.
  const taxAmount = billV !== null && taxV !== null && taxV > 0 ? (billV * taxV) / 100 : 0;
  const effectiveBill =
    billV === null ? null : tipBase === 'post' ? billV + taxAmount : billV;

  const result = useMemo(() => {
    if (!ready || effectiveBill === null) return null;
    try {
      return calculateTip({
        bill: effectiveBill,
        tipPercent: tipV as number,
        people: peopleV as number,
      });
    } catch {
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, effectiveBill, tipV, peopleV]);

  // Pre-tax vs post-tax comparison (only meaningful when tax is entered).
  const preTaxTip = billV !== null && tipV !== null ? (billV * tipV) / 100 : null;
  const postTaxTip =
    billV !== null && tipV !== null && taxV !== null && taxV > 0
      ? ((billV + taxAmount) * tipV) / 100
      : null;

  const tipPerPerson = result && peopleV ? result.tip / peopleV : null;

  async function copyText(value: string, key: string): Promise<void> {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(value);
        setCopied(key);
        window.setTimeout(() => setCopied(''), 2000);
      }
    } catch {
      setCopied('');
    }
  }

  function loadExample(): void {
    setBill('1000');
    setTipPercent('15');
    setPeople('2');
    setTaxPercent('');
    setTipBase('pre');
    setServiceIncluded(false);
  }

  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="tip-title">
      <div style={heroStyle}>
        <h2 id="tip-title" style={heroTitleStyle}>
          {t({ bn: 'টিপ ক্যালকুলেটর', en: 'Tip Calculator' })}
        </h2>
        <p style={heroDescStyle}>
          {t({
            bn: 'বিলের পরিমাণ ও টিপের হার দিন — কত টিপ দেবেন, মোট কত হবে, আর প্রত্যেকে কত দেবে বের হয়ে যাবে। সব হিসাব আপনার ডিভাইসেই হয়।',
            en: 'Enter the bill and the tip percent — see the tip, the total, and what each person pays. Everything is computed on your device.',
          })}
        </p>
        <span style={trustChipStyle}>
          {t({ bn: '১০০% ব্রাউজারে • কোনো আপলোড নয়', en: '100% in-browser • nothing uploaded' })}
        </span>
      </div>
      <div style={gridStyle}>
        <div>
          <label style={labelStyle} htmlFor="tip-bill">
            {t({ bn: 'বিলের পরিমাণ', en: 'Bill amount' })}
          </label>
          <input
            id="tip-bill"
            style={inputStyle}
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={bill}
            onChange={(e) => setBill(e.target.value)}
            placeholder="1000"
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="tip-percent">
            {t({ bn: 'টিপ (%)', en: 'Tip (%)' })}
          </label>
          <input
            id="tip-percent"
            style={inputStyle}
            type="number"
            min="0"
            step="0.5"
            inputMode="decimal"
            value={tipPercent}
            onChange={(e) => setTipPercent(e.target.value)}
          />
          <div style={presetRowStyle}>
            {TIP_PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                style={presetChipStyle(tipV === p)}
                aria-pressed={tipV === p}
                onClick={() => setTipPercent(String(p))}
              >
                {p}%
              </button>
            ))}
          </div>
        </div>
        <div>
          <label style={labelStyle} htmlFor="tip-people">
            {t({ bn: 'কতজন ভাগ করবে', en: 'Number of people' })}
          </label>
          <input
            id="tip-people"
            style={inputStyle}
            type="number"
            min="1"
            step="1"
            inputMode="numeric"
            value={people}
            onChange={(e) => setPeople(e.target.value)}
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="tip-tax">
            {t({ bn: 'কর / ভ্যাট (%) — ঐচ্ছিক', en: 'Tax / VAT (%) — optional' })}
          </label>
          <input
            id="tip-tax"
            style={inputStyle}
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={taxPercent}
            onChange={(e) => setTaxPercent(e.target.value)}
            placeholder="0"
          />
          <div style={presetRowStyle} role="group" aria-label={t({ bn: 'টিপ কিসের ওপর', en: 'Tip base' })}>
            <button
              type="button"
              style={presetChipStyle(tipBase === 'pre')}
              aria-pressed={tipBase === 'pre'}
              onClick={() => setTipBase('pre')}
            >
              {t({ bn: 'করের আগে', en: 'Pre-tax' })}
            </button>
            <button
              type="button"
              style={presetChipStyle(tipBase === 'post')}
              aria-pressed={tipBase === 'post'}
              onClick={() => setTipBase('post')}
            >
              {t({ bn: 'করের পরে', en: 'Post-tax' })}
            </button>
          </div>
        </div>
      </div>
      <div style={{ marginTop: 12 }}>
        <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 14, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={serviceIncluded}
            onChange={(e) => setServiceIncluded(e.target.checked)}
            style={{ marginTop: 3 }}
          />
          {t({ bn: 'সার্ভিস চার্জ ইতিমধ্যে অন্তর্ভুক্ত?', en: 'Service charge already included?' })}
        </label>
        {serviceIncluded ? (
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: '6px 0 0' }}>
            {t({
              bn: 'বাংলাদেশের অনেক রেস্তোরাঁয় সার্ভিস চার্জ বিলেই যোগ করা থাকে — সেক্ষেত্রে আলাদা টিপ দেওয়া ঐচ্ছিক।',
              en: 'Many restaurants in Bangladesh already add a service charge to the bill — in that case an extra tip is optional.',
            })}
          </p>
        ) : null}
      </div>
      <div style={buttonRowStyle}>
        <button type="button" className="ev-btn-outline" onClick={loadExample}>
          {t({ bn: 'উদাহরণ বসান (৳১০০০ বিল, ১৫%, ২ জন)', en: 'Load example (৳1000 bill, 15%, 2 people)' })}
        </button>
      </div>
      {result ? (
        <div style={resultStyle} role="status">
          <p style={headlineLabelStyle}>
            {t({ bn: 'টিপ', en: 'Tip' })}
          </p>
          <p style={headlineStyle}>৳{fmtMoney(result.tip)}</p>
          <div style={buttonRowStyle}>
            <button
              type="button"
              className="ev-btn-outline"
              onClick={() => void copyText(`৳${fmtMoney(result.tip)}`, 'tip')}
            >
              {copied === 'tip'
                ? t({ bn: 'কপি হয়েছে', en: 'Copied' })
                : t({ bn: 'টিপ কপি করুন', en: 'Copy tip' })}
            </button>
            <button
              type="button"
              className="ev-btn-outline"
              onClick={() => void copyText(`৳${fmtMoney(result.total)}`, 'total')}
            >
              {copied === 'total'
                ? t({ bn: 'কপি হয়েছে', en: 'Copied' })
                : t({ bn: 'মোট কপি করুন', en: 'Copy total' })}
            </button>
          </div>
          <div style={tileGridStyle}>
            <div style={tileStyle}>
              <p style={tileLabelStyle}>{t({ bn: 'মোট', en: 'Total' })}</p>
              <p style={tileValueStyle}>৳{fmtMoney(result.total)}</p>
            </div>
            <div style={tileStyle}>
              <p style={tileLabelStyle}>{t({ bn: 'প্রত্যেকে দেবে', en: 'Per person' })}</p>
              <p style={tileValueStyle}>৳{fmtMoney(result.perPerson)}</p>
            </div>
            <div style={tileStyle}>
              <p style={tileLabelStyle}>{t({ bn: 'প্রত্যেকের টিপ', en: 'Tip per person' })}</p>
              <p style={tileValueStyle}>৳{fmtMoney(tipPerPerson ?? 0)}</p>
            </div>
            {taxAmount > 0 ? (
              <div style={tileStyle}>
                <p style={tileLabelStyle}>{t({ bn: 'কর', en: 'Tax' })}</p>
                <p style={tileValueStyle}>৳{fmtMoney(taxAmount)}</p>
              </div>
            ) : null}
          </div>
          {preTaxTip !== null && postTaxTip !== null ? (
            <p style={{ fontSize: 14, margin: '12px 0 0' }}>
              {t({
                bn: `তুলনা: করের আগে টিপ ৳${fmtMoney(preTaxTip)}; করের পরে টিপ ৳${fmtMoney(postTaxTip)} — পার্থক্য ৳${fmtMoney(postTaxTip - preTaxTip)}।`,
                en: `Comparison: pre-tax tip ৳${fmtMoney(preTaxTip)}; post-tax tip ৳${fmtMoney(postTaxTip)} — a difference of ৳${fmtMoney(postTaxTip - preTaxTip)}.`,
              })}
            </p>
          ) : null}
          <p style={formulaStyle}>
            {t({
              bn: `সূত্র: টিপ = ${fmtMoney(effectiveBill ?? 0)} × ${tipV ?? 0}% ÷ ১০০ = ৳${fmtMoney(result.tip)}; মোট = ${fmtMoney(effectiveBill ?? 0)} + ৳${fmtMoney(result.tip)}; প্রত্যেকে = মোট ÷ ${peopleV ?? 1} জন।`,
              en: `Formula: tip = ${fmtMoney(effectiveBill ?? 0)} × ${tipV ?? 0}% ÷ 100 = ৳${fmtMoney(result.tip)}; total = ${fmtMoney(effectiveBill ?? 0)} + ৳${fmtMoney(result.tip)}; per person = total ÷ ${peopleV ?? 1}.`,
            })}
          </p>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={cellStyle}>{t({ bn: 'টিপের হার', en: 'Tip %' })}</th>
                <th style={cellStyle}>{t({ bn: 'টিপ', en: 'Tip' })}</th>
                <th style={cellStyle}>{t({ bn: 'মোট', en: 'Total' })}</th>
              </tr>
            </thead>
            <tbody>
              {QUICK_TABLE_PERCENTS.map((p) => {
                const quickTip = (billV as number) * p / 100;
                return (
                  <tr key={p}>
                    <td style={cellStyle}>{p}%</td>
                    <td style={cellStyle}>৳{fmtMoney(quickTip)}</td>
                    <td style={cellStyle}>৳{fmtMoney((billV as number) + quickTip)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : invalid ? (
        <p style={errorStyle} role="alert">
          {t({
            bn: 'সঠিক মান দিন — বিল ও টিপ ঋণাত্মক হতে পারবে না, আর লোকের সংখ্যা কমপক্ষে ১ হতে হবে।',
            en: 'Enter valid values — bill and tip cannot be negative, and people must be at least 1.',
          })}
        </p>
      ) : null}
    </section>
  );
}
