import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { PageShell } from '../components/PageShell';
import { Breadcrumb } from '../components/Breadcrumb';
import {
  EXPENSE_CATEGORIES,
  monthlySummary,
  savingsGoalProgress,
  type BudgetEntry,
  type ExpenseCategory,
  type SavingsGoal,
} from '../lib/lifeBudget';

// Eduvelto Life budget planner (§3C) — /life/budget.
//
// Personal budget + income-expense tracker. ALL data lives in
// localStorage under `eduvelto.life.budget.v1` — nothing is sent to any
// server and no login is required. Clearing the browser data removes it.

const STORAGE_KEY = 'eduvelto.life.budget.v1';

interface StoredBudget {
  entries: BudgetEntry[];
  goal: SavingsGoal;
}

const EMPTY_STORE: StoredBudget = {
  entries: [],
  goal: { name: '', targetAmount: 0, savedAmount: 0 },
};

const CATEGORY_LABELS: Record<ExpenseCategory, { bn: string; en: string }> = {
  rent: { bn: 'বাসা ভাড়া', en: 'House rent' },
  food: { bn: 'খাবার', en: 'Food' },
  transport: { bn: 'যাতায়াত', en: 'Transport' },
  education: { bn: 'পড়াশোনা', en: 'Education' },
  health: { bn: 'স্বাস্থ্য', en: 'Health' },
  other: { bn: 'অন্যান্য', en: 'Other' },
};

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function loadStored(): StoredBudget {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_STORE;
    const parsed = JSON.parse(raw) as Partial<StoredBudget>;
    return {
      entries: Array.isArray(parsed.entries) ? parsed.entries : [],
      goal: {
        name: typeof parsed.goal?.name === 'string' ? parsed.goal.name : '',
        targetAmount: typeof parsed.goal?.targetAmount === 'number' ? parsed.goal.targetAmount : 0,
        savedAmount: typeof parsed.goal?.savedAmount === 'number' ? parsed.goal.savedAmount : 0,
      },
    };
  } catch {
    return EMPTY_STORE;
  }
}

function formatTaka(n: number): string {
  return `৳${Math.round(n).toLocaleString('en-IN')}`;
}

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

const buttonStyle: CSSProperties = {
  minHeight: 44,
  padding: '10px 18px',
  borderRadius: 8,
  border: 'none',
  background: 'var(--link)',
  color: '#fff',
  fontSize: 15,
  fontWeight: 600,
  cursor: 'pointer',
};

export default function LifeBudgetPage() {
  const { t } = useLanguage();
  const [store, setStore] = useState<StoredBudget>(() => loadStored());
  const [month, setMonth] = useState<string>(currentMonth());
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('food');
  const [note, setNote] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [goalName, setGoalName] = useState(store.goal.name);
  const [goalTarget, setGoalTarget] = useState(store.goal.targetAmount ? String(store.goal.targetAmount) : '');
  const [goalSaved, setGoalSaved] = useState(store.goal.savedAmount ? String(store.goal.savedAmount) : '');

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch {
      // Storage full / unavailable: the page still works for this session.
    }
  }, [store]);

  const summary = useMemo(() => monthlySummary(store.entries, month), [store.entries, month]);
  const progress = useMemo(() => savingsGoalProgress(store.goal), [store.goal]);
  const monthEntries = useMemo(
    () =>
      store.entries
        .filter((e) => e.month === month)
        .slice()
        .sort((a, b) => b.createdAt - a.createdAt),
    [store.entries, month],
  );

  function resetForm() {
    setAmount('');
    setNote('');
    setEditingId(null);
  }

  function saveEntry(e: FormEvent) {
    e.preventDefault();
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) return;
    if (editingId) {
      setStore((s) => ({
        ...s,
        entries: s.entries.map((old) =>
          old.id === editingId
            ? {
                ...old,
                type,
                amount: value,
                category: type === 'expense' ? category : undefined,
                note: note.trim(),
                month,
              }
            : old,
        ),
      }));
    } else {
      const entry: BudgetEntry = {
        id: `e${Date.now()}`,
        type,
        amount: value,
        category: type === 'expense' ? category : undefined,
        note: note.trim(),
        month,
        createdAt: Date.now(),
      };
      setStore((s) => ({ ...s, entries: [...s.entries, entry] }));
    }
    resetForm();
  }

  function startEdit(entry: BudgetEntry) {
    setEditingId(entry.id);
    setType(entry.type);
    setAmount(String(entry.amount));
    setCategory(entry.category ?? 'food');
    setNote(entry.note);
  }

  function deleteEntry(id: string) {
    setStore((s) => ({ ...s, entries: s.entries.filter((e) => e.id !== id) }));
    if (editingId === id) resetForm();
  }

  function saveGoal(e: FormEvent) {
    e.preventDefault();
    setStore((s) => ({
      ...s,
      goal: {
        name: goalName.trim(),
        targetAmount: Math.max(0, Number(goalTarget) || 0),
        savedAmount: Math.max(0, Number(goalSaved) || 0),
      },
    }));
  }

  return (
    <PageShell titleBn="বাজেট পরিকল্পনা" titleEn="Budget Planner" wide>
      {/* Visible breadcrumb (24 Nov 2026 SEO pass) — labels match the BreadcrumbList JSON-LD in lib/seo.ts. */}
      <Breadcrumb items={[{ label: 'জীবন সেবা', to: '/life' }, { label: 'বাজেট প্ল্যানার' }]} />
      <p>
        {t({
          bn: 'মাসিক আয় ও ব্যয়ের হিসাব রাখুন, আর সঞ্চয়ের লক্ষ্যের অগ্রগতি দেখুন।',
          en: 'Track monthly income and expenses, and watch your savings goal progress.',
        })}
      </p>
      <p style={{ color: 'var(--muted)', fontSize: 14 }}>
        {t({
          bn: 'এই হিসাব শুধু আপনার ডিভাইসে সংরক্ষিত হয় — কোনো সার্ভারে পাঠানো হয় না, লগইনের দরকার নেই।',
          en: 'These records are stored only on your device — never sent to any server, no login needed.',
        })}
      </p>

      <label style={{ display: 'block', marginTop: 16, fontWeight: 600 }}>
        {t({ bn: 'মাস', en: 'Month' })}
        <input
          type="month"
          value={month}
          onChange={(e) => e.target.value && setMonth(e.target.value)}
          style={{ ...inputStyle, marginTop: 6, maxWidth: 220 }}
        />
      </label>

      {/* Monthly totals */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 12,
          marginTop: 20,
        }}
      >
        <div className="ev-card">
          <span style={{ color: 'var(--muted)', fontSize: 14 }}>{t({ bn: 'মোট আয়', en: 'Total income' })}</span>
          <strong style={{ display: 'block', fontSize: 22, marginTop: 4 }}>{formatTaka(summary.income)}</strong>
        </div>
        <div className="ev-card">
          <span style={{ color: 'var(--muted)', fontSize: 14 }}>{t({ bn: 'মোট ব্যয়', en: 'Total expenses' })}</span>
          <strong style={{ display: 'block', fontSize: 22, marginTop: 4 }}>{formatTaka(summary.expenses)}</strong>
        </div>
        <div className="ev-card">
          <span style={{ color: 'var(--muted)', fontSize: 14 }}>{t({ bn: 'অবশিষ্ট', en: 'Remaining' })}</span>
          <strong
            style={{
              display: 'block',
              fontSize: 22,
              marginTop: 4,
              color: summary.remaining < 0 ? '#b3261e' : 'var(--heading)',
            }}
          >
            {formatTaka(summary.remaining)}
          </strong>
          {summary.remaining < 0 && (
            <span style={{ display: 'block', color: '#b3261e', fontSize: 13, marginTop: 4 }}>
              {t({ bn: 'এই মাসে ব্যয় আয়ের চেয়ে বেশি।', en: 'Expenses exceed income this month.' })}
            </span>
          )}
        </div>
      </div>

      {/* Category breakdown */}
      <h2 style={{ fontSize: 18, marginTop: 28 }}>{t({ bn: 'খরচের বিভাজন', en: 'Spending by category' })}</h2>
      <ul style={{ listStyle: 'none', padding: 0, margin: '12px 0 0' }}>
        {EXPENSE_CATEGORIES.map((cat) => {
          const value = summary.byCategory[cat];
          const pct = summary.expenses > 0 ? Math.round((value / summary.expenses) * 100) : 0;
          return (
            <li key={cat} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                <span>{t(CATEGORY_LABELS[cat])}</span>
                <span>
                  {formatTaka(value)} · {pct}%
                </span>
              </div>
              <div
                aria-hidden="true"
                style={{ height: 8, borderRadius: 4, background: 'var(--hover)', marginTop: 4, overflow: 'hidden' }}
              >
                <div style={{ width: `${pct}%`, height: '100%', background: 'var(--link)' }} />
              </div>
            </li>
          );
        })}
      </ul>

      {/* Add / edit entry */}
      <h2 style={{ fontSize: 18, marginTop: 28 }}>
        {editingId
          ? t({ bn: 'হিসাব সম্পাদনা করুন', en: 'Edit entry' })
          : t({ bn: 'নতুন হিসাব যোগ করুন', en: 'Add a new entry' })}
      </h2>
      <form onSubmit={saveEntry} style={{ display: 'grid', gap: 12, marginTop: 12 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={() => setType('income')}
            aria-pressed={type === 'income'}
            style={{
              ...buttonStyle,
              flex: 1,
              background: type === 'income' ? 'var(--link)' : 'var(--hover)',
              color: type === 'income' ? '#fff' : 'var(--heading)',
            }}
          >
            {t({ bn: 'আয়', en: 'Income' })}
          </button>
          <button
            type="button"
            onClick={() => setType('expense')}
            aria-pressed={type === 'expense'}
            style={{
              ...buttonStyle,
              flex: 1,
              background: type === 'expense' ? 'var(--link)' : 'var(--hover)',
              color: type === 'expense' ? '#fff' : 'var(--heading)',
            }}
          >
            {t({ bn: 'ব্যয়', en: 'Expense' })}
          </button>
        </div>
        <label style={{ fontWeight: 600 }}>
          {t({ bn: 'পরিমাণ (টাকা)', en: 'Amount (taka)' })}
          <input
            type="number"
            min="1"
            step="1"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            placeholder="1000"
            style={{ ...inputStyle, marginTop: 6 }}
          />
        </label>
        {type === 'expense' && (
          <label style={{ fontWeight: 600 }}>
            {t({ bn: 'খরচের ধরন', en: 'Expense category' })}
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              style={{ ...inputStyle, marginTop: 6 }}
            >
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {t(CATEGORY_LABELS[cat])}
                </option>
              ))}
            </select>
          </label>
        )}
        <label style={{ fontWeight: 600 }}>
          {t({ bn: 'বিবরণ (ঐচ্ছিক)', en: 'Note (optional)' })}
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={100}
            placeholder={t({ bn: 'যেমন: বেতন, বাজার', en: 'e.g. salary, groceries' })}
            style={{ ...inputStyle, marginTop: 6 }}
          />
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" style={buttonStyle}>
            {editingId ? t({ bn: 'সংরক্ষণ করুন', en: 'Save changes' }) : t({ bn: 'যোগ করুন', en: 'Add' })}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} style={{ ...buttonStyle, background: 'var(--hover)', color: 'var(--heading)' }}>
              {t({ bn: 'বাতিল', en: 'Cancel' })}
            </button>
          )}
        </div>
      </form>

      {/* Entry list */}
      <h2 style={{ fontSize: 18, marginTop: 28 }}>{t({ bn: 'এই মাসের হিসাব', en: "This month's entries" })}</h2>
      {monthEntries.length === 0 ? (
        <p style={{ color: 'var(--muted)' }}>
          {t({ bn: 'এই মাসে এখনো কোনো হিসাব যোগ করা হয়নি।', en: 'No entries added for this month yet.' })}
        </p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: '12px 0 0' }}>
          {monthEntries.map((entry) => (
            <li
              key={entry.id}
              className="ev-card"
              style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong>
                  {entry.type === 'income'
                    ? t({ bn: 'আয়', en: 'Income' })
                    : t(CATEGORY_LABELS[entry.category ?? 'other'])}
                </strong>
                {entry.note && (
                  <span style={{ display: 'block', color: 'var(--muted)', fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {entry.note}
                  </span>
                )}
              </div>
              <strong style={{ color: entry.type === 'income' ? 'var(--link)' : 'var(--heading)', whiteSpace: 'nowrap' }}>
                {entry.type === 'income' ? '+' : '−'}
                {formatTaka(entry.amount)}
              </strong>
              <button
                type="button"
                onClick={() => startEdit(entry)}
                style={{ ...buttonStyle, background: 'var(--hover)', color: 'var(--heading)', padding: '10px 12px' }}
              >
                {t({ bn: 'সম্পাদনা', en: 'Edit' })}
              </button>
              <button
                type="button"
                onClick={() => deleteEntry(entry.id)}
                aria-label={t({ bn: 'মুছে ফেলুন', en: 'Delete' })}
                style={{ ...buttonStyle, background: 'var(--hover)', color: '#b3261e', padding: '10px 12px' }}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Savings goal */}
      <h2 style={{ fontSize: 18, marginTop: 28 }}>{t({ bn: 'সঞ্চয়ের লক্ষ্য', en: 'Savings goal' })}</h2>
      <form onSubmit={saveGoal} style={{ display: 'grid', gap: 12, marginTop: 12 }}>
        <label style={{ fontWeight: 600 }}>
          {t({ bn: 'লক্ষ্যের নাম', en: 'Goal name' })}
          <input
            type="text"
            value={goalName}
            onChange={(e) => setGoalName(e.target.value)}
            maxLength={80}
            placeholder={t({ bn: 'যেমন: জরুরি তহবিল', en: 'e.g. Emergency fund' })}
            style={{ ...inputStyle, marginTop: 6 }}
          />
        </label>
        <label style={{ fontWeight: 600 }}>
          {t({ bn: 'লক্ষ্যের পরিমাণ (টাকা)', en: 'Target amount (taka)' })}
          <input
            type="number"
            min="0"
            step="1"
            inputMode="decimal"
            value={goalTarget}
            onChange={(e) => setGoalTarget(e.target.value)}
            placeholder="50000"
            style={{ ...inputStyle, marginTop: 6 }}
          />
        </label>
        <label style={{ fontWeight: 600 }}>
          {t({ bn: 'এখন পর্যন্ত জমা (টাকা)', en: 'Saved so far (taka)' })}
          <input
            type="number"
            min="0"
            step="1"
            inputMode="decimal"
            value={goalSaved}
            onChange={(e) => setGoalSaved(e.target.value)}
            placeholder="10000"
            style={{ ...inputStyle, marginTop: 6 }}
          />
        </label>
        <div>
          <button type="submit" style={buttonStyle}>
            {t({ bn: 'লক্ষ্য সংরক্ষণ করুন', en: 'Save goal' })}
          </button>
        </div>
      </form>
      {progress.target > 0 && (
        <div className="ev-card" style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <strong>{progress.name || t({ bn: 'সঞ্চয়ের লক্ষ্য', en: 'Savings goal' })}</strong>
            <span>
              {formatTaka(progress.saved)} / {formatTaka(progress.target)} · {Math.round(progress.percent)}%
            </span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={Math.round(progress.percent)}
            aria-valuemin={0}
            aria-valuemax={100}
            style={{ height: 10, borderRadius: 5, background: 'var(--hover)', marginTop: 10, overflow: 'hidden' }}
          >
            <div style={{ width: `${progress.percent}%`, height: '100%', background: 'var(--link)' }} />
          </div>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 0 }}>
            {progress.reached
              ? t({ bn: 'অভিনন্দন — লক্ষ্য পূরণ হয়েছে!', en: 'Congratulations — goal reached!' })
              : t({ bn: `আরও ${formatTaka(progress.remaining)} বাকি।`, en: `${formatTaka(progress.remaining)} to go.` })}
          </p>
        </div>
      )}

      <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 28 }}>
        {t({
          bn: 'দাবিত্যাগ: এটি একটি পরিকল্পনার সহায়ক মাত্র, আর্থিক পরামর্শ নয়। কোনো সঞ্চয় বা বিনিয়োগের ফলাফলের নিশ্চয়তা দেওয়া হয় না।',
          en: 'Disclaimer: this is a planning aid only, not financial advice. No savings or investment outcome is guaranteed.',
        })}
      </p>
    </PageShell>
  );
}
