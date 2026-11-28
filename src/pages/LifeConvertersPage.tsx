// Eduvelto Life converters (§3C) — /life/converters.
//
// Currency converter (static indicative rates table — NOT live) and
// unit converter (length, weight, temperature, volume, area).
// Everything is computed client-side from ../lib/lifeConverters.

import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { PageShell } from '../components/PageShell';
import EditorialBadge from '../components/EditorialBadge';
import { Breadcrumb } from '../components/Breadcrumb';
import ShareButton from '../components/ShareButton';
import {
  CURRENCY_NAMES,
  CURRENCY_RATES_AS_OF,
  CURRENCY_RATES_BDT,
  SUPPORTED_CURRENCIES,
  convertCurrency,
  convertUnit,
  unitsForCategory,
  type UnitCategory,
} from '../lib/lifeConverters';

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

const disclaimerStyle: CSSProperties = {
  marginTop: 16,
  padding: '12px 14px',
  borderRadius: 10,
  background: 'var(--hover)',
  fontSize: 13,
  color: 'var(--muted)',
};

const tabButtonStyle = (active: boolean): CSSProperties => ({
  minHeight: 44,
  padding: '10px 16px',
  borderRadius: 999,
  border: active ? 'none' : '1px solid var(--line)',
  background: active ? 'var(--link)' : 'var(--surface)',
  color: active ? '#fff' : 'var(--heading)',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
});

function fmtAmount(n: number): string {
  return n.toLocaleString('en-IN', { maximumFractionDigits: 4 });
}

function SectionTitle({ bn, en }: { bn: string; en: string }) {
  const { t } = useLanguage();
  return <h2 style={{ fontSize: 19, color: 'var(--heading)', margin: '0 0 4px' }}>{t({ bn, en })}</h2>;
}

function CurrencySection() {
  const { t, lang } = useLanguage();
  const [amount, setAmount] = useState('');
  const [from, setFrom] = useState('USD');
  const [to, setTo] = useState('BDT');
  const value = amount.trim() === '' ? null : Number(amount);
  const valid = value !== null && Number.isFinite(value) && value >= 0;
  const result = useMemo(
    () => (valid && value !== null ? convertCurrency(value, from, to) : null),
    [valid, value, from, to],
  );
  const rate = useMemo(() => convertCurrency(1, from, to), [from, to]);
  const swap = () => {
    setFrom(to);
    setTo(from);
  };
  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="currency-title">
      <div id="currency-title">
        <SectionTitle bn="মুদ্রা রূপান্তরকারী" en="Currency Converter" />
      </div>
      <p style={{ color: 'var(--muted)', fontSize: 14, margin: '0 0 14px' }}>
        {t({
          bn: 'বিদেশি মুদ্রা থেকে টাকায় — বা উল্টো — হিসাব করুন।',
          en: 'Convert between foreign currencies and taka, either way.',
        })}
      </p>
      <div style={gridStyle}>
        <div>
          <label style={labelStyle} htmlFor="cur-amount">
            {t({ bn: 'পরিমাণ', en: 'Amount' })}
          </label>
          <input
            id="cur-amount"
            style={inputStyle}
            type="number"
            min="0"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={lang === 'bn' ? '১০০' : '100'}
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="cur-from">
            {t({ bn: 'থেকে', en: 'From' })}
          </label>
          <select id="cur-from" style={inputStyle} value={from} onChange={(e) => setFrom(e.target.value)}>
            {SUPPORTED_CURRENCIES.map((code) => (
              <option key={code} value={code}>
                {code} — {t(CURRENCY_NAMES[code])}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle} htmlFor="cur-to">
            {t({ bn: 'এতে', en: 'To' })}
          </label>
          <select id="cur-to" style={inputStyle} value={to} onChange={(e) => setTo(e.target.value)}>
            {SUPPORTED_CURRENCIES.map((code) => (
              <option key={code} value={code}>
                {code} — {t(CURRENCY_NAMES[code])}
              </option>
            ))}
          </select>
        </div>
      </div>
      <button
        type="button"
        onClick={swap}
        style={{
          marginTop: 12,
          minHeight: 44,
          padding: '10px 18px',
          borderRadius: 8,
          border: '1px solid var(--line)',
          background: 'var(--surface)',
          color: 'var(--heading)',
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        {t({ bn: '⇄ উল্টে দিন', en: '⇄ Swap' })}
      </button>
      {result !== null && value !== null ? (
        <div style={resultStyle} role="status">
          <p style={{ margin: '0 0 6px', fontSize: 17 }}>
            <strong>
              {fmtAmount(value)} {from} = {fmtAmount(result)} {to}
            </strong>
          </p>
          {rate !== null && (
            <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)' }}>
              {t({ bn: 'হার: ১ ', en: 'Rate: 1 ' })}
              {from} = {fmtAmount(rate)} {to}
            </p>
          )}
        </div>
      ) : amount.trim() !== '' ? (
        <p style={{ marginTop: 14, color: '#b3261e', fontSize: 14 }} role="alert">
          {t({ bn: 'সঠিক পরিমাণ দিন (০ বা তার বেশি)।', en: 'Enter a valid amount (0 or more).' })}
        </p>
      ) : null}
      <p style={disclaimerStyle}>
        {t({
          bn: `নির্দেশক হার — ব্যাংক/এক্সচেঞ্জের আসল হার ভিন্ন হতে পারে; লেনদেনের আগে যাচাই করুন। হারগুলো ${CURRENCY_RATES_AS_OF} তারিখের নির্দেশক মধ্যবাজার হার (প্রতি ১ ইউনিট = টাকা)। এটি লাইভ হার নয়।`,
          en: `Indicative rates — the bank/exchange's actual rate may differ; check before transacting. Rates are indicative mid-market rates as of ${CURRENCY_RATES_AS_OF} (BDT per 1 unit). These are not live rates.`,
        })}
      </p>
      <div style={{ overflowX: 'auto', marginTop: 14 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <caption style={{ textAlign: 'left', fontWeight: 700, color: 'var(--heading)', paddingBottom: 8 }}>
            {t({
              bn: `নির্দেশক হার (${CURRENCY_RATES_AS_OF} অনুযায়ী)`,
              en: `Indicative rates (as of ${CURRENCY_RATES_AS_OF})`,
            })}
          </caption>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--line)', color: 'var(--muted)', textAlign: 'left' }}>
              <th style={{ padding: '8px 8px 8px 0' }}>{t({ bn: 'মুদ্রা', en: 'Currency' })}</th>
              <th style={{ padding: 8, textAlign: 'right' }}>{t({ bn: '১ ইউনিট = টাকা', en: '1 unit = BDT' })}</th>
            </tr>
          </thead>
          <tbody>
            {SUPPORTED_CURRENCIES.filter((c) => c !== 'BDT').map((code) => (
              <tr key={code} style={{ borderBottom: '1px solid var(--line)' }}>
                <td style={{ padding: '8px 8px 8px 0' }}>
                  {code} — {t(CURRENCY_NAMES[code])}
                </td>
                <td style={{ padding: 8, textAlign: 'right' }}>৳{fmtAmount(CURRENCY_RATES_BDT[code])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const UNIT_CATEGORY_LABELS: { id: UnitCategory; bn: string; en: string }[] = [
  { id: 'length', bn: 'দৈর্ঘ্য', en: 'Length' },
  { id: 'weight', bn: 'ওজন', en: 'Weight' },
  { id: 'temperature', bn: 'তাপমাত্রা', en: 'Temperature' },
  { id: 'volume', bn: 'আয়তন', en: 'Volume' },
  { id: 'area', bn: 'ক্ষেত্রফল', en: 'Area' },
  // Speed tab (28 Nov 2026, converter pair pages): the 'speed'
  // category was added to lifeConverters.ts, so this label +
  // DEFAULT_UNITS entry keep the hub converter's Record<UnitCategory>
  // complete (tsc) and expose the new category in the UI.
  { id: 'speed', bn: 'গতি', en: 'Speed' },
];

const DEFAULT_UNITS: Record<UnitCategory, { from: string; to: string }> = {
  length: { from: 'km', to: 'm' },
  weight: { from: 'kg', to: 'g' },
  temperature: { from: 'c', to: 'f' },
  volume: { from: 'l', to: 'ml' },
  area: { from: 'acre', to: 'm2' },
  speed: { from: 'kmh', to: 'ms' },
};

function UnitSection() {
  const { t, lang } = useLanguage();
  const [category, setCategory] = useState<UnitCategory>('length');
  const [value, setValue] = useState('');
  const [from, setFrom] = useState('km');
  const [to, setTo] = useState('m');
  const units = unitsForCategory(category);
  const parsed = value.trim() === '' ? null : Number(value);
  const valid = parsed !== null && Number.isFinite(parsed);
  const result = useMemo(
    () => (valid && parsed !== null ? convertUnit(category, parsed, from, to) : null),
    [valid, parsed, category, from, to],
  );
  const pickCategory = (next: UnitCategory) => {
    setCategory(next);
    setFrom(DEFAULT_UNITS[next].from);
    setTo(DEFAULT_UNITS[next].to);
  };
  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="unit-title">
      <div id="unit-title">
        <SectionTitle bn="একক রূপান্তরকারী" en="Unit Converter" />
      </div>
      <p style={{ color: 'var(--muted)', fontSize: 14, margin: '0 0 14px' }}>
        {t({
          bn: 'দৈর্ঘ্য, ওজন, তাপমাত্রা, আয়তন, ক্ষেত্রফল ও গতি — দেশি এককসহ (মণ, সের, তোলা, কাঠা, বিঘা, শতাংশ)।',
          en: 'Length, weight, temperature, volume, area and speed — including local units (mon, ser, tola, katha, bigha, decimal).',
        })}
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }} role="tablist" aria-label={t({ bn: 'এককের ধরন', en: 'Unit type' })}>
        {UNIT_CATEGORY_LABELS.map((c) => (
          <button
            key={c.id}
            type="button"
            role="tab"
            aria-selected={category === c.id}
            style={tabButtonStyle(category === c.id)}
            onClick={() => pickCategory(c.id)}
          >
            {t({ bn: c.bn, en: c.en })}
          </button>
        ))}
      </div>
      <div style={gridStyle}>
        <div>
          <label style={labelStyle} htmlFor="unit-value">
            {t({ bn: 'মান', en: 'Value' })}
          </label>
          <input
            id="unit-value"
            style={inputStyle}
            type="number"
            inputMode="decimal"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={lang === 'bn' ? '১' : '1'}
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="unit-from">
            {t({ bn: 'থেকে', en: 'From' })}
          </label>
          <select id="unit-from" style={inputStyle} value={from} onChange={(e) => setFrom(e.target.value)}>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {t({ bn: u.bn, en: u.en })}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle} htmlFor="unit-to">
            {t({ bn: 'এতে', en: 'To' })}
          </label>
          <select id="unit-to" style={inputStyle} value={to} onChange={(e) => setTo(e.target.value)}>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {t({ bn: u.bn, en: u.en })}
              </option>
            ))}
          </select>
        </div>
      </div>
      {result !== null && parsed !== null ? (
        <div style={resultStyle} role="status">
          <p style={{ margin: 0, fontSize: 17 }}>
            <strong>
              {fmtAmount(parsed)} {t(units.find((u) => u.id === from)!)} = {fmtAmount(result)}{' '}
              {t(units.find((u) => u.id === to)!)}
            </strong>
          </p>
        </div>
      ) : value.trim() !== '' ? (
        <p style={{ marginTop: 14, color: '#b3261e', fontSize: 14 }} role="alert">
          {t({ bn: 'সঠিক সংখ্যা দিন।', en: 'Enter a valid number.' })}
        </p>
      ) : null}
    </section>
  );
}

export default function LifeConvertersPage() {
  const { t, lang } = useLanguage();
  return (
    <PageShell titleBn="রূপান্তরকারী" titleEn="Converters">
      {/* Visible breadcrumb (24 Nov 2026 SEO pass) — labels match the BreadcrumbList JSON-LD in lib/seo.ts. */}
      <Breadcrumb items={[{ label: lang === 'bn' ? 'জীবন সেবা' : 'Life Services', to: '/life' }, { label: lang === 'bn' ? 'কনভার্টার' : 'Converters' }]} />
      <div style={{ margin: '4px 0 16px' }}>
        <ShareButton />
      </div>
      <p style={{ color: 'var(--muted)', margin: '0 0 8px' }}>
        {t({
          bn: 'মুদ্রা ও একক রূপান্তর — সব হিসাব আপনার ডিভাইসেই হয়, কোনো তথ্য কোথাও পাঠানো হয় না।',
          en: 'Currency and unit conversion — everything is computed on your device, no data is sent anywhere.',
        })}
      </p>
      <CurrencySection />
      <UnitSection />
      {/* Editorial verification badge (owner order 28 Nov 2026):
          this page is also the /tools/unit-converter hub — it
          carries the badge like every other tool page. */}
      <EditorialBadge />
    </PageShell>
  );
}
