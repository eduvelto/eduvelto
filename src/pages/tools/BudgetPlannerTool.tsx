// Eduvelto — Budget Planner tool UI.
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Pure calculation lives in src/lib/tools/budgetPlanner.ts: total
// expenses = sum of categories, remaining = income - expenses,
// savings rate = remaining / income x 100.
//
// Design polish (batch 2): hero band, headline remaining + tiles,
// split presets (50/30/20, 60/20/20, 60/30/10 + custom) shown as
// target-vs-actual buckets, emergency-fund goal tile (3× and 6×
// monthly needs), copy-summary button, one-tap BD example
// (৳30,000 income with typical Dhaka expense lines), and a formula
// with the user's own numbers. The tool still opens empty (tests
// assert no result on load) — the example fills in only when tapped.
// A donut/bar chart and localStorage persistence were skipped —
// they need new chart code and storage plumbing, a rework of the
// finished tool (noted in the batch report).

import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { calculateBudget } from '../../lib/tools/budgetPlanner';

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

const tileSubStyle: CSSProperties = {
  fontSize: 12,
  color: 'var(--muted)',
  margin: '4px 0 0',
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

const listStyle: CSSProperties = {
  margin: '8px 0 0',
  paddingLeft: 20,
  fontSize: 15,
  lineHeight: 1.7,
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

const SPLIT_PRESETS: { key: string; needs: number; wants: number; savings: number }[] = [
  { key: '50/30/20', needs: 50, wants: 30, savings: 20 },
  { key: '60/20/20', needs: 60, wants: 20, savings: 20 },
  { key: '60/30/10', needs: 60, wants: 30, savings: 10 },
];

export function BudgetPlannerTool() {
  const { t } = useLanguage();
  const [income, setIncome] = useState('');
  const [housing, setHousing] = useState('');
  const [food, setFood] = useState('');
  const [transport, setTransport] = useState('');
  const [utilities, setUtilities] = useState('');
  const [other, setOther] = useState('');
  const [splitKey, setSplitKey] = useState<string>('custom');
  const [copied, setCopied] = useState(false);

  const values = {
    income: parseAmount(income),
    housing: parseAmount(housing),
    food: parseAmount(food),
    transport: parseAmount(transport),
    utilities: parseAmount(utilities),
    other: parseAmount(other),
  };
  const raws = [income, housing, food, transport, utilities, other];
  const parsed = [values.income, values.housing, values.food, values.transport, values.utilities, values.other];
  const invalid =
    parsed.some((v) => v !== null && v < 0) ||
    raws.some((raw, i) => raw.trim() !== '' && parsed[i] === null);
  const anyFilled = raws.some((raw) => raw.trim() !== '');
  const ready = !invalid && values.income !== null;

  const result = useMemo(() => {
    if (!ready) return null;
    try {
      return calculateBudget({
        income: values.income as number,
        housing: values.housing ?? 0,
        food: values.food ?? 0,
        transport: values.transport ?? 0,
        utilities: values.utilities ?? 0,
        other: values.other ?? 0,
      });
    } catch {
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, values.income, values.housing, values.food, values.transport, values.utilities, values.other]);

  const categoryLabels: Record<string, { bn: string; en: string }> = {
    housing: { bn: 'বাসস্থান', en: 'Housing' },
    food: { bn: 'খাবার', en: 'Food' },
    transport: { bn: 'যাতায়াত', en: 'Transport' },
    utilities: { bn: 'বিল (বিদ্যুৎ, গ্যাস, পানি, ইন্টারনেট)', en: 'Utilities' },
    other: { bn: 'অন্যান্য', en: 'Other' },
  };

  // Buckets for the split comparison: needs = housing + food +
  // transport + utilities; wants = other; savings = what remains.
  const needsActual =
    (values.housing ?? 0) + (values.food ?? 0) + (values.transport ?? 0) + (values.utilities ?? 0);
  const wantsActual = values.other ?? 0;
  const savingsActual = result ? result.remaining : 0;
  const incomeV = values.income ?? 0;
  const activeSplit = SPLIT_PRESETS.find((s) => s.key === splitKey) ?? null;
  const emergency3x = needsActual * 3;
  const emergency6x = needsActual * 6;

  async function copySummary(): Promise<void> {
    if (!result) return;
    const text = t({
      bn: `মাসিক আয় ৳${fmtMoney(incomeV)}, মোট খরচ ৳${fmtMoney(result.totalExpenses)}, হাতে থাকবে ৳${fmtMoney(result.remaining)}, সঞ্চয়ের হার ${result.savingsRate}%।`,
      en: `Monthly income ৳${fmtMoney(incomeV)}, total expenses ৳${fmtMoney(result.totalExpenses)}, remaining ৳${fmtMoney(result.remaining)}, savings rate ${result.savingsRate}%.`,
    });
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      setCopied(false);
    }
  }

  function loadExample(): void {
    setIncome('30000');
    setHousing('8000');
    setFood('6000');
    setTransport('2000');
    setUtilities('2500');
    setOther('3000');
    setSplitKey('50/30/20');
  }

  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="budget-title">
      <div style={heroStyle}>
        <h2 id="budget-title" style={heroTitleStyle}>
          {t({ bn: 'বাজেট পরিকল্পনা', en: 'Budget Planner' })}
        </h2>
        <p style={heroDescStyle}>
          {t({
            bn: 'মাসিক আয় ও খরচের খাতগুলো দিন — মোট খরচ, হাতে কত থাকবে আর সঞ্চয়ের হার বের হয়ে যাবে। সব হিসাব আপনার ডিভাইসেই হয়।',
            en: 'Enter your monthly income and expenses by category — see total expenses, what remains, and your savings rate. Everything is computed on your device.',
          })}
        </p>
        <span style={trustChipStyle}>
          {t({ bn: '১০০% ব্রাউজারে • কোনো আপলোড নয়', en: '100% in-browser • nothing uploaded' })}
        </span>
      </div>
      <div style={gridStyle}>
        <div>
          <label style={labelStyle} htmlFor="budget-income">
            {t({ bn: 'মাসিক আয়', en: 'Monthly income' })}
          </label>
          <input
            id="budget-income"
            style={inputStyle}
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={income}
            onChange={(e) => setIncome(e.target.value)}
            placeholder="30000"
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="budget-housing">
            {t({ bn: 'বাসস্থান', en: 'Housing' })}
          </label>
          <input
            id="budget-housing"
            style={inputStyle}
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={housing}
            onChange={(e) => setHousing(e.target.value)}
            placeholder="8000"
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="budget-food">
            {t({ bn: 'খাবার', en: 'Food' })}
          </label>
          <input
            id="budget-food"
            style={inputStyle}
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={food}
            onChange={(e) => setFood(e.target.value)}
            placeholder="6000"
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="budget-transport">
            {t({ bn: 'যাতায়াত', en: 'Transport' })}
          </label>
          <input
            id="budget-transport"
            style={inputStyle}
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={transport}
            onChange={(e) => setTransport(e.target.value)}
            placeholder="2000"
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="budget-utilities">
            {t({ bn: 'বিল (বিদ্যুৎ, গ্যাস, পানি, ইন্টারনেট)', en: 'Utilities' })}
          </label>
          <input
            id="budget-utilities"
            style={inputStyle}
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={utilities}
            onChange={(e) => setUtilities(e.target.value)}
            placeholder="2500"
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="budget-other">
            {t({ bn: 'অন্যান্য খরচ', en: 'Other expenses' })}
          </label>
          <input
            id="budget-other"
            style={inputStyle}
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={other}
            onChange={(e) => setOther(e.target.value)}
            placeholder="3000"
          />
        </div>
      </div>
      <div style={{ marginTop: 14 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--heading)', margin: '0 0 4px' }}>
          {t({ bn: 'বাজেটের ভাগ (প্রয়োজন / চাওয়া / সঞ্চয়)', en: 'Budget split (needs / wants / savings)' })}
        </p>
        <div style={presetRowStyle} role="group" aria-label={t({ bn: 'বাজেটের ভাগ', en: 'Budget split' })}>
          {SPLIT_PRESETS.map((s) => (
            <button
              key={s.key}
              type="button"
              style={presetChipStyle(splitKey === s.key)}
              aria-pressed={splitKey === s.key}
              onClick={() => setSplitKey(s.key)}
            >
              {s.key}
            </button>
          ))}
          <button
            type="button"
            style={presetChipStyle(splitKey === 'custom')}
            aria-pressed={splitKey === 'custom'}
            onClick={() => setSplitKey('custom')}
          >
            {t({ bn: 'নিজের মতো', en: 'Custom' })}
          </button>
        </div>
      </div>
      <div style={buttonRowStyle}>
        <button type="button" className="ev-btn-outline" onClick={loadExample}>
          {t({ bn: 'উদাহরণ বসান (আয় ৳৩০,০০০)', en: 'Load example (income ৳30,000)' })}
        </button>
      </div>
      {result ? (
        <div style={resultStyle} role="status">
          <p style={headlineLabelStyle}>{t({ bn: 'হাতে থাকবে', en: 'Remaining' })}</p>
          <p style={headlineStyle}>৳{fmtMoney(result.remaining)}</p>
          <div style={buttonRowStyle}>
            <button type="button" className="ev-btn-outline" onClick={() => void copySummary()}>
              {copied
                ? t({ bn: 'কপি হয়েছে', en: 'Copied' })
                : t({ bn: 'সারাংশ কপি করুন', en: 'Copy summary' })}
            </button>
          </div>
          <div style={tileGridStyle}>
            <div style={tileStyle}>
              <p style={tileLabelStyle}>{t({ bn: 'মোট খরচ', en: 'Total expenses' })}</p>
              <p style={tileValueStyle}>৳{fmtMoney(result.totalExpenses)}</p>
            </div>
            <div style={tileStyle}>
              <p style={tileLabelStyle}>{t({ bn: 'সঞ্চয়ের হার', en: 'Savings rate' })}</p>
              <p style={tileValueStyle}>{result.savingsRate}%</p>
            </div>
            <div style={tileStyle}>
              <p style={tileLabelStyle}>{t({ bn: 'মাসিক আয়', en: 'Monthly income' })}</p>
              <p style={tileValueStyle}>৳{fmtMoney(incomeV)}</p>
            </div>
            {needsActual > 0 ? (
              <div style={tileStyle}>
                <p style={tileLabelStyle}>{t({ bn: 'জরুরি তহবিলের লক্ষ্য (প্রয়োজন × ৩ / × ৬)', en: 'Emergency fund goal (needs × 3 / × 6)' })}</p>
                <p style={tileValueStyle}>৳{fmtMoney(emergency3x)} / ৳{fmtMoney(emergency6x)}</p>
                <p style={tileSubStyle}>
                  {t({
                    bn: `মাসিক প্রয়োজন ৳${fmtMoney(needsActual)} — ৩ মাসের তহবিল গড়তে ${savingsActual > 0 ? `প্রায় ${Math.ceil(emergency3x / savingsActual)} মাস লাগবে` : 'সঞ্চয় থেকে টাকা রাখতে হবে'}।`,
                    en: `Monthly needs ৳${fmtMoney(needsActual)} — funding 3 months takes ${savingsActual > 0 ? `about ${Math.ceil(emergency3x / savingsActual)} months` : 'money set aside from savings'}.`,
                  })}
                </p>
              </div>
            ) : null}
          </div>
          {activeSplit ? (
            <div style={tileGridStyle}>
              {[
                { label: t({ bn: 'প্রয়োজন', en: 'Needs' }), pct: activeSplit.needs, actual: needsActual },
                { label: t({ bn: 'চাওয়া', en: 'Wants' }), pct: activeSplit.wants, actual: wantsActual },
                { label: t({ bn: 'সঞ্চয়', en: 'Savings' }), pct: activeSplit.savings, actual: savingsActual },
              ].map((b) => {
                const target = (incomeV * b.pct) / 100;
                const diff = b.actual - target;
                return (
                  <div key={b.label} style={tileStyle}>
                    <p style={tileLabelStyle}>
                      {b.label} — {t({ bn: 'লক্ষ্য', en: 'target' })} {b.pct}%
                    </p>
                    <p style={tileValueStyle}>৳{fmtMoney(b.actual)}</p>
                    <p style={tileSubStyle}>
                      {t({ bn: 'লক্ষ্য: ', en: 'Target: ' })}৳{fmtMoney(target)}
                      {' · '}
                      {diff > 0
                        ? t({ bn: `৳${fmtMoney(diff)} বেশি`, en: `৳${fmtMoney(diff)} over` })
                        : diff < 0
                          ? t({ bn: `৳${fmtMoney(-diff)} কম`, en: `৳${fmtMoney(-diff)} under` })
                          : t({ bn: 'লক্ষ্য মতো', en: 'On target' })}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : null}
          <ul style={listStyle}>
            {result.breakdown.map((row) => (
              <li key={row.category}>
                {t(categoryLabels[row.category])}
                {': '}
                {fmtMoney(row.amount)}
                {' ('}
                {row.percentOfIncome}
                {'%)'}
              </li>
            ))}
          </ul>
          <p style={formulaStyle}>
            {t({
              bn: `সূত্র: মোট খরচ = ৳${fmtMoney(result.totalExpenses)}; হাতে থাকবে = ৳${fmtMoney(incomeV)} − ৳${fmtMoney(result.totalExpenses)} = ৳${fmtMoney(result.remaining)}; সঞ্চয়ের হার = ৳${fmtMoney(result.remaining)} ÷ ৳${fmtMoney(incomeV)} × ১০০ = ${result.savingsRate}%।`,
              en: `Formula: total expenses = ৳${fmtMoney(result.totalExpenses)}; remaining = ৳${fmtMoney(incomeV)} − ৳${fmtMoney(result.totalExpenses)} = ৳${fmtMoney(result.remaining)}; savings rate = ৳${fmtMoney(result.remaining)} ÷ ৳${fmtMoney(incomeV)} × 100 = ${result.savingsRate}%.`,
            })}
          </p>
        </div>
      ) : invalid ? (
        <p style={errorStyle} role="alert">
          {t({ bn: 'সঠিক মান দিন — কোনো পরিমাণ ঋণাত্মক হতে পারবে না।', en: 'Enter valid values — no amount can be negative.' })}
        </p>
      ) : anyFilled ? (
        <p style={errorStyle} role="alert">
          {t({ bn: 'হিসাব দেখতে মাসিক আয় দিন।', en: 'Enter your monthly income to see the budget.' })}
        </p>
      ) : null}
    </section>
  );
}
