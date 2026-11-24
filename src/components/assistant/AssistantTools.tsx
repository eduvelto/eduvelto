// Eduvelto AI Life Assistant — deterministic tools UI.
// Every tool here works with zero AI: pure maths + templates, computed
// in the browser. No data leaves the device, no login is needed.

import { useMemo, useState, type ReactNode } from 'react';
import { Button, Card, AlertBox } from '../ui';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  calcBmi,
  calcCompoundInterest,
  calcEmi,
  calcPercentage,
  calcSimpleInterest,
  COMMON_PHRASES,
  convertCurrency,
  convertLength,
  convertTemperature,
  convertWeight,
  summarizeBudget,
  buildDayPlan,
  buildStudyPlan,
} from '../../lib/aiAssistant';

function fmt(n: number, digits = 2): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: 0 });
}

function Field(props: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: 'block', marginBottom: 10 }}>
      <span className="ev-label">{props.label}</span>
      {props.children}
    </label>
  );
}

function NumInput(props: { value: string; onChange: (v: string) => void; placeholder?: string; ariaLabel: string }) {
  return (
    <input
      className="ev-input"
      type="number"
      inputMode="decimal"
      value={props.value}
      onChange={(e) => props.onChange(e.target.value)}
      placeholder={props.placeholder}
      aria-label={props.ariaLabel}
    />
  );
}

function TextInput(props: { value: string; onChange: (v: string) => void; placeholder?: string; ariaLabel: string }) {
  return (
    <input
      className="ev-input"
      type="text"
      value={props.value}
      onChange={(e) => props.onChange(e.target.value)}
      placeholder={props.placeholder}
      aria-label={props.ariaLabel}
    />
  );
}

function CopyButton(props: { text: string }) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(props.text);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          setCopied(false);
        }
      }}
    >
      {copied ? t({ bn: 'কপি হয়েছে ✓', en: 'Copied ✓' }) : t({ bn: 'কপি করুন', en: 'Copy' })}
    </Button>
  );
}

function OutputBox(props: { text: string }) {
  return (
    <div>
      <pre
        style={{
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          background: 'var(--surface-muted, #f4f6fb)',
          border: '1px solid var(--border, #dbe2ef)',
          borderRadius: 10,
          padding: 14,
          fontSize: 15,
          lineHeight: 1.7,
          margin: '12px 0 8px',
        }}
      >
        {props.text}
      </pre>
      <CopyButton text={props.text} />
    </div>
  );
}

/* ---------------- Calculator ---------------- */

type CalcKind = 'emi' | 'simple' | 'compound' | 'bmi' | 'percentage';

export function CalculatorTool() {
  const { t } = useLanguage();
  const [kind, setKind] = useState<CalcKind>('emi');
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [c, setC] = useState('');
  const [d, setD] = useState('12');
  const [out, setOut] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const labels: Record<CalcKind, [string, string, string, string?]> = {
    emi: [t({ bn: 'ঋণের পরিমাণ (টাকা)', en: 'Loan amount (৳)' }), t({ bn: 'বছরে সুদের হার (%)', en: 'Annual interest rate (%)' }), t({ bn: 'মেয়াদ (মাস)', en: 'Term (months)' })],
    simple: [t({ bn: 'আসল (টাকা)', en: 'Principal (৳)' }), t({ bn: 'বছরে সুদের হার (%)', en: 'Annual interest rate (%)' }), t({ bn: 'সময় (বছর)', en: 'Time (years)' })],
    compound: [t({ bn: 'আসল (টাকা)', en: 'Principal (৳)' }), t({ bn: 'বছরে সুদের হার (%)', en: 'Annual interest rate (%)' }), t({ bn: 'সময় (বছর)', en: 'Time (years)' }), t({ bn: 'বছরে কতবার সুদ যোগ হয়', en: 'Compounds per year' })],
    bmi: [t({ bn: 'ওজন (কেজি)', en: 'Weight (kg)' }), t({ bn: 'উচ্চতা (সেমি)', en: 'Height (cm)' }), ''],
    percentage: [t({ bn: 'অংশ', en: 'Part' }), t({ bn: 'মোট', en: 'Total' }), ''],
  };

  function compute() {
    setErr(null);
    setOut(null);
    const n = (s: string) => Number(s);
    if (kind === 'emi') {
      const r = calcEmi(n(a), n(b), n(c));
      if (!r.ok) return setErr(t({ bn: r.errorBn, en: r.errorEn }));
      setOut(
        t({ bn: `মাসিক কিস্তি (EMI): ৳${fmt(r.value.emi)}\nমোট পরিশোধ: ৳${fmt(r.value.totalPayable)}\nমোট সুদ: ৳${fmt(r.value.totalInterest)}`, en: `Monthly instalment (EMI): ৳${fmt(r.value.emi)}\nTotal payable: ৳${fmt(r.value.totalPayable)}\nTotal interest: ৳${fmt(r.value.totalInterest)}` }),
      );
    } else if (kind === 'simple') {
      const r = calcSimpleInterest(n(a), n(b), n(c));
      if (!r.ok) return setErr(t({ bn: r.errorBn, en: r.errorEn }));
      setOut(t({ bn: `সুদ: ৳${fmt(r.value.interest)}\nমোট: ৳${fmt(r.value.total)}`, en: `Interest: ৳${fmt(r.value.interest)}\nTotal: ৳${fmt(r.value.total)}` }));
    } else if (kind === 'compound') {
      const r = calcCompoundInterest(n(a), n(b), n(c), n(d));
      if (!r.ok) return setErr(t({ bn: r.errorBn, en: r.errorEn }));
      setOut(t({ bn: `সুদ: ৳${fmt(r.value.interest)}\nমোট: ৳${fmt(r.value.total)}`, en: `Interest: ৳${fmt(r.value.interest)}\nTotal: ৳${fmt(r.value.total)}` }));
    } else if (kind === 'bmi') {
      const r = calcBmi(n(a), n(b));
      if (!r.ok) return setErr(t({ bn: r.errorBn, en: r.errorEn }));
      setOut(t({ bn: `BMI: ${fmt(r.value.bmi, 1)} (${r.value.categoryBn})\nএটি সাধারণ তথ্য — চিকিৎসা পরামর্শ নয়।`, en: `BMI: ${fmt(r.value.bmi, 1)} (${r.value.categoryEn})\nGeneral information only — not medical advice.` }));
    } else {
      const r = calcPercentage(n(a), n(b));
      if (!r.ok) return setErr(t({ bn: r.errorBn, en: r.errorEn }));
      setOut(t({ bn: `${fmt(r.value)}%`, en: `${fmt(r.value)}%` }));
    }
  }

  const L = labels[kind];
  return (
    <div>
      <Field label={t({ bn: 'কোন হিসাব?', en: 'Which calculation?' })}>
        <select
          className="ev-input"
          value={kind}
          onChange={(e) => {
            setKind(e.target.value as CalcKind);
            setOut(null);
            setErr(null);
          }}
          aria-label={t({ bn: 'হিসাবের ধরন', en: 'Calculation type' })}
        >
          <option value="emi">{t({ bn: 'মাসিক কিস্তি (EMI)', en: 'Monthly instalment (EMI)' })}</option>
          <option value="simple">{t({ bn: 'সরল সুদ', en: 'Simple interest' })}</option>
          <option value="compound">{t({ bn: 'চক্রবৃদ্ধি সুদ', en: 'Compound interest' })}</option>
          <option value="bmi">{t({ bn: 'BMI (ওজন-উচ্চতা)', en: 'BMI (weight–height)' })}</option>
          <option value="percentage">{t({ bn: 'শতকরা হার', en: 'Percentage' })}</option>
        </select>
      </Field>
      <Field label={L[0]}>
        <NumInput value={a} onChange={setA} ariaLabel={L[0]} />
      </Field>
      <Field label={L[1]}>
        <NumInput value={b} onChange={setB} ariaLabel={L[1]} />
      </Field>
      {L[2] !== '' ? (
        <Field label={L[2]}>
          <NumInput value={c} onChange={setC} ariaLabel={L[2]} />
        </Field>
      ) : null}
      {kind === 'compound' && L[3] ? (
        <Field label={L[3]}>
          <NumInput value={d} onChange={setD} ariaLabel={L[3]} />
        </Field>
      ) : null}
      <Button onClick={compute}>{t({ bn: 'হিসাব করুন', en: 'Calculate' })}</Button>
      {err ? (
        <div style={{ marginTop: 12 }}>
          <AlertBox tone="error">{err}</AlertBox>
        </div>
      ) : null}
      {out ? <OutputBox text={out} /> : null}
    </div>
  );
}

/* ---------------- Converter ---------------- */

type ConvKind = 'length' | 'weight' | 'temperature' | 'currency';

const UNITS: Record<ConvKind, { value: string; labelBn: string; labelEn: string }[]> = {
  length: [
    { value: 'm', labelBn: 'মিটার', labelEn: 'metre' },
    { value: 'km', labelBn: 'কিলোমিটার', labelEn: 'kilometre' },
    { value: 'cm', labelBn: 'সেন্টিমিটার', labelEn: 'centimetre' },
    { value: 'mile', labelBn: 'মাইল', labelEn: 'mile' },
    { value: 'ft', labelBn: 'ফুট', labelEn: 'foot' },
    { value: 'inch', labelBn: 'ইঞ্চি', labelEn: 'inch' },
  ],
  weight: [
    { value: 'kg', labelBn: 'কিলোগ্রাম', labelEn: 'kilogram' },
    { value: 'g', labelBn: 'গ্রাম', labelEn: 'gram' },
    { value: 'lb', labelBn: 'পাউন্ড', labelEn: 'pound' },
    { value: 'oz', labelBn: 'আউন্স', labelEn: 'ounce' },
  ],
  temperature: [
    { value: 'C', labelBn: 'সেলসিয়াস (°C)', labelEn: 'Celsius (°C)' },
    { value: 'F', labelBn: 'ফারেনহাইট (°F)', labelEn: 'Fahrenheit (°F)' },
    { value: 'K', labelBn: 'কেলভিন (K)', labelEn: 'Kelvin (K)' },
  ],
  currency: [
    { value: 'USD', labelBn: 'মার্কিন ডলার (USD)', labelEn: 'US dollar (USD)' },
    { value: 'BDT', labelBn: 'বাংলাদেশি টাকা (BDT)', labelEn: 'Bangladeshi taka (BDT)' },
  ],
};

export function ConverterTool() {
  const { t } = useLanguage();
  const [kind, setKind] = useState<ConvKind>('length');
  const [value, setValue] = useState('');
  const [from, setFrom] = useState('km');
  const [to, setTo] = useState('m');
  const [rate, setRate] = useState('');
  const [out, setOut] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function labelOf(u: { labelBn: string; labelEn: string }): string {
    return t({ bn: u.labelBn, en: u.labelEn });
  }

  function convert() {
    setErr(null);
    setOut(null);
    const v = Number(value);
    const units = UNITS[kind];
    const fromLabel = units.find((u) => u.value === from);
    const toLabel = units.find((u) => u.value === to);
    const fl = fromLabel ? labelOf(fromLabel) : from;
    const tl = toLabel ? labelOf(toLabel) : to;
    if (kind === 'length') {
      const r = convertLength(v, from, to);
      if (!r.ok) return setErr(t({ bn: r.errorBn, en: r.errorEn }));
      setOut(`${fmt(v, 4)} ${fl} = ${fmt(r.value, 4)} ${tl}`);
    } else if (kind === 'weight') {
      const r = convertWeight(v, from, to);
      if (!r.ok) return setErr(t({ bn: r.errorBn, en: r.errorEn }));
      setOut(`${fmt(v, 4)} ${fl} = ${fmt(r.value, 4)} ${tl}`);
    } else if (kind === 'temperature') {
      const r = convertTemperature(v, from as 'C' | 'F' | 'K', to as 'C' | 'F' | 'K');
      if (!r.ok) return setErr(t({ bn: r.errorBn, en: r.errorEn }));
      setOut(`${fmt(v, 4)} ${fl} = ${fmt(r.value, 4)} ${tl}`);
    } else {
      const r = convertCurrency(v, Number(rate));
      if (!r.ok) return setErr(t({ bn: r.errorBn, en: r.errorEn }));
      setOut(
        `${fmt(v, 4)} ${fl} = ${fmt(r.value, 2)} ${tl}\n${t({ bn: 'হারটি আপনি নিজে দিয়েছেন — দৈনিক বদলায়, ব্যাংক/এক্সচেঞ্জ থেকে যাচাই করুন।', en: 'You entered the rate yourself — it changes daily, check with a bank or exchange.' })}`,
      );
    }
  }

  const units = UNITS[kind];
  return (
    <div>
      <Field label={t({ bn: 'কোন রূপান্তর?', en: 'Which conversion?' })}>
        <select
          className="ev-input"
          value={kind}
          onChange={(e) => {
            const k = e.target.value as ConvKind;
            setKind(k);
            setFrom(UNITS[k][0].value);
            setTo(UNITS[k][1].value);
            setOut(null);
            setErr(null);
          }}
          aria-label={t({ bn: 'রূপান্তরের ধরন', en: 'Conversion type' })}
        >
          <option value="length">{t({ bn: 'দৈর্ঘ্য', en: 'Length' })}</option>
          <option value="weight">{t({ bn: 'ওজন', en: 'Weight' })}</option>
          <option value="temperature">{t({ bn: 'তাপমাত্রা', en: 'Temperature' })}</option>
          <option value="currency">{t({ bn: 'মুদ্রা (নিজের হারে)', en: 'Currency (your own rate)' })}</option>
        </select>
      </Field>
      <Field label={t({ bn: 'মান', en: 'Value' })}>
        <NumInput value={value} onChange={setValue} ariaLabel={t({ bn: 'মান', en: 'Value' })} />
      </Field>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 140 }}>
          <Field label={t({ bn: 'থেকে', en: 'From' })}>
            <select className="ev-input" value={from} onChange={(e) => setFrom(e.target.value)} aria-label={t({ bn: 'থেকে', en: 'From' })}>
              {units.map((u) => (
                <option key={u.value} value={u.value}>
                  {t({ bn: u.labelBn, en: u.labelEn })}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div style={{ flex: 1, minWidth: 140 }}>
          <Field label={t({ bn: 'এ', en: 'To' })}>
            <select className="ev-input" value={to} onChange={(e) => setTo(e.target.value)} aria-label={t({ bn: 'এ', en: 'To' })}>
              {units.map((u) => (
                <option key={u.value} value={u.value}>
                  {t({ bn: u.labelBn, en: u.labelEn })}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </div>
      {kind === 'currency' ? (
        <Field label={t({ bn: 'বিনিময় হার (১ USD = কত টাকা)', en: 'Exchange rate (1 USD = how many taka)' })}>
          <NumInput value={rate} onChange={setRate} placeholder="যেমন: 122.5" ariaLabel={t({ bn: 'বিনিময় হার', en: 'Exchange rate' })} />
        </Field>
      ) : null}
      <Button onClick={convert}>{t({ bn: 'রূপান্তর করুন', en: 'Convert' })}</Button>
      {err ? (
        <div style={{ marginTop: 12 }}>
          <AlertBox tone="error">{err}</AlertBox>
        </div>
      ) : null}
      {out ? <OutputBox text={out} /> : null}
    </div>
  );
}

/* ---------------- Budget planner ---------------- */

export function BudgetTool() {
  const { t } = useLanguage();
  const [income, setIncome] = useState('');
  const [rows, setRows] = useState<{ label: string; amount: string }[]>([
    { label: '', amount: '' },
    { label: '', amount: '' },
    { label: '', amount: '' },
  ]);
  const [out, setOut] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function compute() {
    setErr(null);
    setOut(null);
    const expenses = rows
      .filter((r) => r.label.trim() !== '' || r.amount.trim() !== '')
      .map((r) => ({ label: r.label, amount: Number(r.amount) }));
    const r = summarizeBudget(Number(income), expenses);
    if (!r.ok) return setErr(t({ bn: r.errorBn, en: r.errorEn }));
    const lines = [
      t({ bn: `মাসিক আয়: ৳${fmt(r.value.income)}`, en: `Monthly income: ৳${fmt(r.value.income)}` }),
      t({ bn: `মোট খরচ: ৳${fmt(r.value.totalExpenses)}`, en: `Total expenses: ৳${fmt(r.value.totalExpenses)}` }),
      t({ bn: `বাকি থাকে: ৳${fmt(r.value.remaining)}`, en: `Remaining: ৳${fmt(r.value.remaining)}` }),
      t({ bn: `সঞ্চয়ের হার: ${fmt(r.value.savingsRatePct, 1)}%`, en: `Savings rate: ${fmt(r.value.savingsRatePct, 1)}%` }),
    ];
    if (r.value.overBudget) {
      lines.push(t({ bn: 'সতর্কতা: খরচ আয়ের চেয়ে বেশি — কোনো খাতে কমাতে হবে।', en: 'Warning: expenses exceed income — reduce spending somewhere.' }));
    }
    setOut(lines.join('\n'));
  }

  return (
    <div>
      <Field label={t({ bn: 'মাসিক আয় (টাকা)', en: 'Monthly income (৳)' })}>
        <NumInput value={income} onChange={setIncome} ariaLabel={t({ bn: 'মাসিক আয়', en: 'Monthly income' })} />
      </Field>
      {rows.map((row, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <TextInput
            value={row.label}
            onChange={(v) => setRows(rows.map((r, j) => (j === i ? { ...r, label: v } : r)))}
            placeholder={t({ bn: 'খাতের নাম (যেমন: বাড়ি ভাড়া)', en: 'Expense name (e.g. rent)' })}
            ariaLabel={t({ bn: 'খাতের নাম', en: 'Expense name' })}
          />
          <div style={{ width: 140 }}>
            <NumInput
              value={row.amount}
              onChange={(v) => setRows(rows.map((r, j) => (j === i ? { ...r, amount: v } : r)))}
              placeholder="৳"
              ariaLabel={t({ bn: 'পরিমাণ', en: 'Amount' })}
            />
          </div>
        </div>
      ))}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <Button variant="outline" size="sm" onClick={() => setRows([...rows, { label: '', amount: '' }])}>
          {t({ bn: '+ আরেকটি খাত', en: '+ Add another expense' })}
        </Button>
        <Button onClick={compute}>{t({ bn: 'হিসাব দেখুন', en: 'See the summary' })}</Button>
      </div>
      {err ? (
        <div style={{ marginTop: 12 }}>
          <AlertBox tone="error">{err}</AlertBox>
        </div>
      ) : null}
      {out ? <OutputBox text={out} /> : null}
    </div>
  );
}

/* ---------------- Day planner ---------------- */

export function PlannerTool() {
  const { t } = useLanguage();
  const [rows, setRows] = useState<{ time: string; label: string }[]>([
    { time: '06:00', label: '' },
    { time: '09:00', label: '' },
    { time: '14:00', label: '' },
    { time: '20:00', label: '' },
  ]);
  const [out, setOut] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function build() {
    setErr(null);
    setOut(null);
    const r = buildDayPlan(rows);
    if (!r.ok) return setErr(t({ bn: r.errorBn, en: r.errorEn }));
    setOut(r.value.tasks.map((task) => `${task.time} — ${task.label}`).join('\n'));
  }

  return (
    <div>
      <p style={{ marginTop: 0 }}>{t({ bn: 'দিনের কাজগুলো সময়সহ লিখুন — সময় অনুযায়ী সাজিয়ে দেওয়া হবে।', en: 'Write the day’s tasks with times — they will be sorted by time.' })}</p>
      {rows.map((row, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <div style={{ width: 110 }}>
            <input
              className="ev-input"
              type="time"
              value={row.time}
              onChange={(e) => setRows(rows.map((r, j) => (j === i ? { ...r, time: e.target.value } : r)))}
              aria-label={t({ bn: 'সময়', en: 'Time' })}
            />
          </div>
          <TextInput
            value={row.label}
            onChange={(v) => setRows(rows.map((r, j) => (j === i ? { ...r, label: v } : r)))}
            placeholder={t({ bn: 'কাজের নাম', en: 'Task name' })}
            ariaLabel={t({ bn: 'কাজের নাম', en: 'Task name' })}
          />
        </div>
      ))}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <Button variant="outline" size="sm" onClick={() => setRows([...rows, { time: '12:00', label: '' }])}>
          {t({ bn: '+ আরেকটি কাজ', en: '+ Add another task' })}
        </Button>
        <Button onClick={build}>{t({ bn: 'পরিকল্পনা সাজান', en: 'Arrange the plan' })}</Button>
      </div>
      {err ? (
        <div style={{ marginTop: 12 }}>
          <AlertBox tone="error">{err}</AlertBox>
        </div>
      ) : null}
      {out ? <OutputBox text={out} /> : null}
    </div>
  );
}

/* ---------------- Phrasebook ---------------- */

export function PhrasebookTool() {
  const { t } = useLanguage();
  const [q, setQ] = useState('');
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (needle === '') return COMMON_PHRASES;
    return COMMON_PHRASES.filter((p) => p.bn.includes(q.trim()) || p.en.toLowerCase().includes(needle));
  }, [q]);
  return (
    <div>
      <p style={{ marginTop: 0 }}>
        {t({ bn: '২০টি দরকারি বাক্য — বাংলা ও ইংরেজি। এটি একটি নির্দিষ্ট তালিকা, অনুবাদ AI নয়।', en: '20 useful sentences — Bangla and English. This is a fixed list, not translation AI.' })}
      </p>
      <Field label={t({ bn: 'খুঁজুন', en: 'Search' })}>
        <TextInput value={q} onChange={setQ} placeholder={t({ bn: 'যেমন: ধন্যবাদ / thank', en: 'e.g. ধন্যবাদ / thank' })} ariaLabel={t({ bn: 'খুঁজুন', en: 'Search' })} />
      </Field>
      {filtered.length === 0 ? (
        <AlertBox tone="info">{t({ bn: 'এই তালিকায় মিললো না — AI সংযুক্ত হলে যেকোনো বাক্য অনুবাদ করা যাবে।', en: 'No match in this list — once AI is connected, any sentence can be translated.' })}</AlertBox>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {filtered.map((p, i) => (
            <Card key={i} className="">
              <div style={{ fontWeight: 700 }}>{p.bn}</div>
              <div style={{ color: 'var(--muted, #5b6472)' }}>{p.en}</div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- Study plan ---------------- */

export function StudyPlanTool() {
  const { t } = useLanguage();
  const [topic, setTopic] = useState('');
  const [out, setOut] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function build() {
    setErr(null);
    setOut(null);
    const r = buildStudyPlan(topic, 'bn');
    if (!r.ok) return setErr(t({ bn: r.errorBn, en: r.errorEn }));
    setOut(r.value);
  }

  return (
    <div>
      <p style={{ marginTop: 0 }}>
        {t({ bn: 'যেকোনো বিষয়ের পড়ার পরিকল্পনার ছক বানান — ধাপে ধাপে কী করবেন, তা সাজিয়ে দেয়। বিষয়টির তথ্য এতে থাকে না।', en: 'Make a study-plan outline for any topic — it arranges what to do step by step. It contains no facts about the topic itself.' })}
      </p>
      <Field label={t({ bn: 'বিষয়ের নাম', en: 'Topic name' })}>
        <TextInput value={topic} onChange={setTopic} placeholder={t({ bn: 'যেমন: ভগ্নাংশ / ইংরেজি গ্রামার', en: 'e.g. Fractions / English grammar' })} ariaLabel={t({ bn: 'বিষয়ের নাম', en: 'Topic name' })} />
      </Field>
      <Button onClick={build}>{t({ bn: 'পরিকল্পনা বানান', en: 'Make the plan' })}</Button>
      {err ? (
        <div style={{ marginTop: 12 }}>
          <AlertBox tone="error">{err}</AlertBox>
        </div>
      ) : null}
      {out ? <OutputBox text={out} /> : null}
    </div>
  );
}
