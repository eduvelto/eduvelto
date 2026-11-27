// Eduvelto — bKash / Nagad Cash Out Charge Calculator tool UI.
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Pure calculation lives in src/lib/tools/bkashNagad.ts: charge =
// amount x rate / 100. The rate is USER-ENTERED with a starting
// value only — rates change, so no rate is ever stated here as a fact.
//
// Design polish (batch 2): hero band, headline charge + tiles, copy
// buttons, a comparison table (same amount on every channel, each
// rate editable and labelled example-only), a reverse mode ("cash I
// want in hand" -> amount to send), a dated rate stamp and a
// Priyo-limit note. The tool still opens empty (tests assert no
// result on load) — the example fills in only when tapped.

import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  calculateCashOutCharge,
  type CashOutMethod,
  type CashOutProvider,
} from '../../lib/tools/bkashNagad';

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
  marginTop: 8,
};

const cellStyle: CSSProperties = {
  borderBottom: '1px solid var(--line)',
  padding: '6px 4px',
  textAlign: 'left',
};

const rateInputStyle: CSSProperties = {
  width: 84,
  minHeight: 36,
  padding: '6px 8px',
  borderRadius: 8,
  border: '1px solid var(--line)',
  fontSize: 14,
  boxSizing: 'border-box',
  background: 'var(--surface)',
  color: 'var(--heading)',
};

function parseAmount(raw: string): number | null {
  if (raw.trim() === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function fmtMoney(n: number): string {
  return n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

// Comparison channels. Every rate below is an EXAMPLE starting
// value only (labelled as such in the UI) — never a live or
// official rate. The user can edit each one.
const COMPARE_CHANNELS: {
  key: string;
  bn: string;
  en: string;
  exampleRate: string;
}[] = [
  { key: 'bkash-agent', bn: 'বিকাশ এজেন্ট', en: 'bKash agent', exampleRate: '1.85' },
  { key: 'bkash-priyo', bn: 'বিকাশ প্রিয় এজেন্ট', en: 'bKash Priyo agent', exampleRate: '1.49' },
  { key: 'bkash-app', bn: 'বিকাশ অ্যাপ', en: 'bKash app', exampleRate: '1.49' },
  { key: 'nagad-app', bn: 'নগদ অ্যাপ', en: 'Nagad app', exampleRate: '1.299' },
  { key: 'nagad-ussd', bn: 'নগদ ইউএসএসডি (*১৬৭#)', en: 'Nagad USSD (*167#)', exampleRate: '1.5' },
];

export function BkashNagadTool() {
  const { t } = useLanguage();
  const [amount, setAmount] = useState('');
  const [provider, setProvider] = useState<CashOutProvider>('bkash');
  const [method, setMethod] = useState<CashOutMethod>('agent');
  const [rate, setRate] = useState('1.49');
  const [targetInHand, setTargetInHand] = useState('');
  const [compareRates, setCompareRates] = useState<Record<string, string>>(
    Object.fromEntries(COMPARE_CHANNELS.map((c) => [c.key, c.exampleRate])),
  );
  const [copied, setCopied] = useState('');

  const amountV = parseAmount(amount);
  const rateV = parseAmount(rate);
  const targetV = parseAmount(targetInHand);
  const invalid =
    (amountV !== null && amountV < 0) ||
    (rateV !== null && rateV < 0) ||
    (targetV !== null && targetV < 0) ||
    (amount.trim() !== '' && amountV === null) ||
    (rate.trim() !== '' && rateV === null) ||
    (targetInHand.trim() !== '' && targetV === null);
  const ready = amountV !== null && amountV >= 0 && rateV !== null && rateV >= 0;

  const result = useMemo(() => {
    if (!ready) return null;
    try {
      return calculateCashOutCharge({ amount: amountV as number, chargeRatePercent: rateV as number });
    } catch {
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, amountV, rateV]);

  // Reverse mode: to receive `target` in hand, how much must be sent?
  // send = target / (1 - rate/100); charge = send - target.
  const reverse =
    targetV !== null && targetV >= 0 && rateV !== null && rateV >= 0 && rateV < 100
      ? {
          send: targetV / (1 - rateV / 100),
          charge: targetV / (1 - rateV / 100) - targetV,
        }
      : null;

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
    setAmount('10000');
    setProvider('bkash');
    setMethod('agent');
    setRate('1.85');
  }

  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="bkash-nagad-title">
      <div style={heroStyle}>
        <h2 id="bkash-nagad-title" style={heroTitleStyle}>
          {t({ bn: 'বিকাশ / নগদ ক্যাশ আউট চার্জ ক্যালকুলেটর', en: 'bKash / Nagad Cash Out Charge Calculator' })}
        </h2>
        <p style={heroDescStyle}>
          {t({
            bn: 'টাকার পরিমাণ ও চার্জের হার বসান। হারটি শুরুর মান হিসেবে দেওয়া আছে — চার্জের হার সময়ের সাথে বদলায়, তাই টাকা পাঠানোর আগে বর্তমান হারটি যাচাই করে নিন। সব হিসাব আপনার ডিভাইসেই হয়।',
            en: 'Enter the amount and the charge rate. The rate is only a starting value — charge rates change over time, so check the current rate before sending money. Everything is computed on your device.',
          })}
        </p>
        <span style={trustChipStyle}>
          {t({ bn: '১০০% ব্রাউজারে • কোনো আপলোড নয়', en: '100% in-browser • nothing uploaded' })}
        </span>
      </div>
      <div style={gridStyle}>
        <div>
          <label style={labelStyle} htmlFor="bkash-nagad-amount">
            {t({ bn: 'টাকার পরিমাণ', en: 'Amount' })}
          </label>
          <input
            id="bkash-nagad-amount"
            style={inputStyle}
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="10000"
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="bkash-nagad-provider">
            {t({ bn: 'সেবা', en: 'Provider' })}
          </label>
          <select
            id="bkash-nagad-provider"
            style={inputStyle}
            value={provider}
            onChange={(e) => setProvider(e.target.value as CashOutProvider)}
          >
            <option value="bkash">{t({ bn: 'বিকাশ', en: 'bKash' })}</option>
            <option value="nagad">{t({ bn: 'নগদ', en: 'Nagad' })}</option>
          </select>
        </div>
        <div>
          <label style={labelStyle} htmlFor="bkash-nagad-method">
            {t({ bn: 'পদ্ধতি', en: 'Method' })}
          </label>
          <select
            id="bkash-nagad-method"
            style={inputStyle}
            value={method}
            onChange={(e) => setMethod(e.target.value as CashOutMethod)}
          >
            <option value="agent">{t({ bn: 'এজেন্ট', en: 'Agent' })}</option>
            <option value="personal">{t({ bn: 'পার্সোনাল নম্বর', en: 'Personal number' })}</option>
            <option value="app">{t({ bn: 'অ্যাপ', en: 'App' })}</option>
          </select>
        </div>
        <div>
          <label style={labelStyle} htmlFor="bkash-nagad-rate">
            {t({ bn: 'চার্জের হার (%)', en: 'Charge rate (%)' })}
          </label>
          <input
            id="bkash-nagad-rate"
            style={inputStyle}
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
          />
        </div>
      </div>
      <div style={gridStyle}>
        <div style={{ marginTop: 12 }}>
          <label style={labelStyle} htmlFor="bkash-nagad-reverse">
            {t({ bn: 'উল্টো হিসাব — হাতে কত পেতে চান? (ঐচ্ছিক)', en: 'Reverse — cash you want in hand (optional)' })}
          </label>
          <input
            id="bkash-nagad-reverse"
            style={inputStyle}
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={targetInHand}
            onChange={(e) => setTargetInHand(e.target.value)}
            placeholder="5000"
          />
        </div>
      </div>
      <div style={buttonRowStyle}>
        <button type="button" className="ev-btn-outline" onClick={loadExample}>
          {t({ bn: 'উদাহরণ বসান (৳১০,০০০, বিকাশ এজেন্ট)', en: 'Load example (৳10,000, bKash agent)' })}
        </button>
      </div>
      {reverse && targetV !== null ? (
        <div style={{ ...resultStyle, background: 'var(--amber-soft)' }}>
          <p style={{ margin: 0, fontSize: 15 }}>
            {t({
              bn: `হাতে ৳${fmtMoney(targetV)} পেতে পাঠাতে হবে ৳${fmtMoney(reverse.send)} (চার্জ ৳${fmtMoney(reverse.charge)} সহ)।`,
              en: `To receive ৳${fmtMoney(targetV)} in hand, send ৳${fmtMoney(reverse.send)} (including ৳${fmtMoney(reverse.charge)} charge).`,
            })}
          </p>
        </div>
      ) : null}
      {result ? (
        <div style={resultStyle} role="status">
          <p style={headlineLabelStyle}>{t({ bn: 'চার্জ', en: 'Charge' })}</p>
          <p style={headlineStyle}>৳{fmtMoney(result.charge)}</p>
          <div style={buttonRowStyle}>
            <button
              type="button"
              className="ev-btn-outline"
              onClick={() => void copyText(`৳${fmtMoney(result.charge)}`, 'charge')}
            >
              {copied === 'charge'
                ? t({ bn: 'কপি হয়েছে', en: 'Copied' })
                : t({ bn: 'চার্জ কপি করুন', en: 'Copy charge' })}
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
              <p style={tileLabelStyle}>{t({ bn: 'মোট (পরিমাণ + চার্জ)', en: 'Total (amount + charge)' })}</p>
              <p style={tileValueStyle}>৳{fmtMoney(result.total)}</p>
            </div>
            <div style={tileStyle}>
              <p style={tileLabelStyle}>{t({ bn: 'হাতে পাবেন', en: 'Cash in hand' })}</p>
              <p style={tileValueStyle}>৳{fmtMoney(amountV as number)}</p>
            </div>
            <div style={tileStyle}>
              <p style={tileLabelStyle}>{t({ bn: 'কার্যকর হার', en: 'Effective rate' })}</p>
              <p style={tileValueStyle}>{rateV ?? 0}%</p>
            </div>
          </div>
          <p style={formulaStyle}>
            {t({
              bn: `সূত্র: চার্জ = ৳${fmtMoney(amountV as number)} × ${rateV ?? 0}% ÷ ১০০ = ৳${fmtMoney(result.charge)}; মোট = ৳${fmtMoney(amountV as number)} + ৳${fmtMoney(result.charge)}।`,
              en: `Formula: charge = ৳${fmtMoney(amountV as number)} × ${rateV ?? 0}% ÷ 100 = ৳${fmtMoney(result.charge)}; total = ৳${fmtMoney(amountV as number)} + ৳${fmtMoney(result.charge)}.`,
            })}
          </p>
          <h3 style={{ fontSize: 16, color: 'var(--heading)', margin: '16px 0 4px' }}>
            {t({ bn: 'একই টাকায় সব চ্যানেলে তুলনা', en: 'Same amount on every channel' })}
          </h3>
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 4px' }}>
            {t({
              bn: 'নিচের হারগুলো উদাহরণ মাত্র — নিজের হার বসিয়ে নিন। হার যাচাই: 27 Nov 2026 — বড় লেনদেনের আগে নিজের অ্যাপে বর্তমান হার অবশ্যই যাচাই করুন।',
              en: 'The rates below are examples only — edit them to your own rates. Rates checked 27 Nov 2026 — always confirm the current rate in your app before a large transaction.',
            })}
          </p>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={cellStyle}>{t({ bn: 'চ্যানেল', en: 'Channel' })}</th>
                <th style={cellStyle}>{t({ bn: 'হার (%)', en: 'Rate (%)' })}</th>
                <th style={cellStyle}>{t({ bn: 'চার্জ', en: 'Charge' })}</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE_CHANNELS.map((c) => {
                const r = parseAmount(compareRates[c.key] ?? '');
                const charge = r !== null && r >= 0 ? ((amountV as number) * r) / 100 : null;
                return (
                  <tr key={c.key}>
                    <td style={cellStyle}>{t({ bn: c.bn, en: c.en })}</td>
                    <td style={cellStyle}>
                      <input
                        style={rateInputStyle}
                        type="number"
                        min="0"
                        step="0.01"
                        inputMode="decimal"
                        aria-label={t({ bn: `${c.bn} হার`, en: `${c.en} rate` })}
                        value={compareRates[c.key] ?? ''}
                        onChange={(e) =>
                          setCompareRates((prev) => ({ ...prev, [c.key]: e.target.value }))
                        }
                      />
                    </td>
                    <td style={cellStyle}>{charge !== null ? `৳${fmtMoney(charge)}` : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p style={formulaStyle}>
            {t({
              bn: 'বিকাশ প্রিয় এজেন্ট: মাসে ৳৫০,০০০ পর্যন্ত ছাড়ের হার প্রযোজ্য হতে পারে — এর বেশি হলে সাধারণ হার প্রযোজ্য হতে পারে; নিজের অ্যাপে যাচাই করুন।',
              en: 'bKash Priyo agent: a discounted rate may apply up to ৳50,000 per month — above that the standard rate may apply; check in your app.',
            })}
          </p>
        </div>
      ) : invalid ? (
        <p style={errorStyle} role="alert">
          {t({ bn: 'সঠিক মান দিন — কোনো মান ঋণাত্মক হতে পারবে না।', en: 'Enter valid values — no value can be negative.' })}
        </p>
      ) : null}
    </section>
  );
}
