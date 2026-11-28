// Eduvelto — converter pair page (28 Nov 2026).
//
// One working converter per ordered unit pair, at
// /{lang}/convert/<from>-to-<to> (e.g. /bn/convert/kg-to-lb).
// The route line lives in App.tsx (`convert/:pair` under :lang);
// this page reads the :pair param.
//
// SEO: renders <SeoHead /> directly (the BookPage pattern) —
// RouteSeo has no entry for /convert/:slug, so it falls back to
// the home title + `noindex, nofollow`. The page's own SeoHead is
// nested deeper, so its title/description/canonical win in
// react-helmet-async — BUT the fallback's robots tag would survive
// (our SeoHead emits no robots tag of its own), noindexing all 244
// pair pages in the browser AND in the prerendered HTML. Hence
// robots="index, follow" here: the explicit default, which
// overrides the fallback tag. A seo.ts entry for /convert/:slug
// (like /tools/:slug) would make this workaround unnecessary.
//
// SSR-safe: only default state at render time — no window /
// document / localStorage (useNotFoundMeta touches document only
// inside an effect, like NotFoundPage).
//
// All numbers come from the lifeConverters.ts registry via
// convertUnit() — factors are never typed by hand, and no
// verified-claim wording appears anywhere: unit conversions are
// exact constant-based conversions, not verified claims.

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { PageShell } from '../components/PageShell';
import { Breadcrumb } from '../components/Breadcrumb';
import { SeoHead } from '../components/SeoHead';
import { Card } from '../components/ui';
import { useNotFoundMeta } from '../lib/useNotFoundMeta';
import { langUrl } from '../lib/langRouting';
import { convertUnit, unitsForCategory } from '../lib/lifeConverters';
import {
  CATEGORY_LABELS,
  findUnitDef,
  relatedPairs,
  resolveConvertPairSlug,
  type ConvertPair,
} from '../lib/convertPairs';

const SITE_URL = 'https://eduvelto.com';
const COMMON_VALUES = [1, 2, 5, 10, 50, 100];

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

/** Max 6 significant digits, trailing zeros stripped (2.20462, 0.453592, 1000, 0.000001). */
function fmtSig(n: number): string {
  if (!Number.isFinite(n)) return '—';
  if (n === 0) return '0';
  return String(Number(n.toPrecision(6)));
}

/** Temperature formulas per ordered pair (from-to) — symbolic, identical in bn/en. */
const TEMPERATURE_FORMULAS: Record<string, string> = {
  'c-f': '°F = °C × 9/5 + 32',
  'f-c': '°C = (°F − 32) × 5/9',
  'c-k': 'K = °C + 273.15',
  'k-c': '°C = K − 273.15',
  'f-k': 'K = (°F − 32) × 5/9 + 273.15',
  'k-f': '°F = (K − 273.15) × 9/5 + 32',
};

/** One factual note per well-known unit, shown only when that unit is in the pair. */
const UNIT_NOTES: Record<string, { bn: string; en: string }> = {
  kg: { bn: 'কিলোগ্রাম ভরের SI একক।', en: 'The kilogram is the SI unit of mass.' },
  lb: {
    bn: 'পাউন্ড ভরের ইম্পেরিয়াল একক, যুক্তরাষ্ট্রে এখনো ব্যবহৃত হয়।',
    en: 'The pound is the imperial unit of mass, still used in the United States.',
  },
  m: { bn: 'মিটার দৈর্ঘ্যের SI একক।', en: 'The metre is the SI unit of length.' },
  c: {
    bn: 'সেলসিয়াস বাংলাদেশসহ বিশ্বের বেশিরভাগ দেশে ব্যবহৃত তাপমাত্রার স্কেল।',
    en: 'Celsius is the temperature scale used in Bangladesh and most of the world.',
  },
  f: {
    bn: 'ফারেনহাইট যুক্তরাষ্ট্রে ব্যবহৃত তাপমাত্রার স্কেল।',
    en: 'Fahrenheit is the temperature scale used in the United States.',
  },
  k: {
    bn: 'কেলভিন তাপমাত্রার SI একক, বিজ্ঞানে ব্যবহৃত হয়।',
    en: 'Kelvin is the SI unit of temperature, used in science.',
  },
  mon: {
    bn: 'মণ বাংলাদেশের প্রচলিত ওজনের একক (১ মণ = ৩৭.৩২৪২ কেজি)।',
    en: 'The maund is a traditional Bangladeshi unit of weight (1 maund = 37.3242 kg).',
  },
  ser: {
    bn: 'সের বাংলাদেশের প্রচলিত ওজনের একক (১ সের = ০.৯৩৩১ কেজি)।',
    en: 'The ser is a traditional Bangladeshi unit of weight (1 ser = 0.9331 kg).',
  },
  tola: {
    bn: 'তোলা বাংলাদেশে স্বর্ণ ওজনের প্রচলিত একক (১ তোলা = ০.০১১৬৬৩৮ কেজি)।',
    en: 'The tola is the traditional Bangladeshi unit for weighing gold (1 tola = 0.0116638 kg).',
  },
  bigha: {
    bn: 'বিঘা বাংলাদেশের জমি মাপার প্রচলিত একক।',
    en: 'The bigha is a traditional Bangladeshi unit of land area.',
  },
  katha: {
    bn: 'কাঠা বাংলাদেশের জমি মাপার প্রচলিত একক।',
    en: 'The katha is a traditional Bangladeshi unit of land area.',
  },
  decimal: {
    bn: 'শতাংশ (ডেসিমেল) বাংলাদেশের জমি মাপার প্রচলিত একক।',
    en: 'The decimal is a traditional Bangladeshi unit of land area.',
  },
};

export default function ConvertPairPage() {
  const { t, lang } = useLanguage();
  const { pair: pairSlug } = useParams<{ pair: string }>();
  // Colloquial slugs (kg-to-lbs) resolve to the canonical pair;
  // parseConvertPair stays the canonical-only check used by the
  // prerender cross-check test.
  const resolved = resolveConvertPairSlug(pairSlug ?? '');
  const pair: ConvertPair | null = resolved?.pair ?? null;

  // Not-found state (same hook NotFoundPage uses): sets
  // document.title + robots noindex while active, restores on unmount.
  useNotFoundMeta(
    t({ bn: 'পাতাটি পাওয়া যায়নি — Eduvelto', en: 'Page not found — Eduvelto' }),
    pair === null,
  );

  const [amount, setAmount] = useState('1');
  const [from, setFrom] = useState(pair?.from ?? '');
  const [to, setTo] = useState(pair?.to ?? '');

  // Navigating between pair pages reuses this component: reset the
  // converter to the new pair (client-side only; SSR renders the
  // initial state, which already matches the pair).
  const pairSlugKey = pair?.slug;
  useEffect(() => {
    if (!pair) return;
    setFrom(pair.from);
    setTo(pair.to);
    setAmount('1');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pairSlugKey]);

  const fromDef = pair ? findUnitDef(pair.category, from) : undefined;
  const toDef = pair ? findUnitDef(pair.category, to) : undefined;
  const categoryUnits = useMemo(
    () => (pair ? unitsForCategory(pair.category) : []),
    [pair?.category],
  );

  const parsed = amount.trim() === '' ? null : Number(amount);
  const valid = parsed !== null && Number.isFinite(parsed);
  const result = useMemo(
    () => (pair && valid && parsed !== null && fromDef && toDef ? convertUnit(pair.category, parsed, from, to) : null),
    [pair, valid, parsed, from, to, fromDef, toDef],
  );

  // Exact 1-unit factors from the registry (temperature: computed 1-unit example instead).
  const forwardOne = useMemo(
    () => (pair ? convertUnit(pair.category, 1, pair.from, pair.to) : null),
    [pair?.slug],
  );
  const reverseOne = useMemo(
    () => (pair ? convertUnit(pair.category, 1, pair.to, pair.from) : null),
    [pair?.slug],
  );

  // Colloquial slug alias (e.g. kg-to-lbs): redirect to the canonical
  // registry slug so only one URL is indexed per pair. Placed after
  // every hook above, before any early return.
  if (resolved && resolved.aliased && pair) {
    return <Navigate to={`/${lang}/convert/${pair.slug}`} replace />;
  }

  if (!pair) {
    return (
      <PageShell titleBn="এই পাতাটি খুঁজে পাওয়া যায়নি" titleEn="This page could not be found">
        <Card>
          <p style={{ fontSize: 16, lineHeight: 1.75, color: 'var(--ink)', margin: '0 0 12px' }}>
            {t({
              bn: 'আপনি যে রূপান্তরটি খুঁজছেন, সেটি Eduvelto-তে নেই। হয়তো ঠিকানাটি ভুল টাইপ হয়েছে।',
              en: 'The conversion you were looking for does not exist on Eduvelto. The address may have been typed incorrectly.',
            })}
          </p>
          <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--muted-ivory)', margin: '0 0 20px' }}>
            {t({ bn: 'চেষ্টা করা ঠিকানা: ', en: 'Address tried: ' })}
            <code>{`/convert/${pairSlug ?? ''}`}</code>
          </p>
          <Link
            to={langUrl('/tools/unit-converter', lang)}
            style={{
              padding: '10px 18px',
              minHeight: 48,
              display: 'inline-flex',
              alignItems: 'center',
              borderRadius: 6,
              background: '#142B3B',
              color: '#fff',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            {t({ bn: 'ইউনিট কনভার্টারে যান', en: 'Go to the Unit Converter' })}
          </Link>
        </Card>
      </PageShell>
    );
  }

  const pairFromDef = findUnitDef(pair.category, pair.from);
  const pairToDef = findUnitDef(pair.category, pair.to);
  const pairFromName = pairFromDef ? (lang === 'bn' ? pairFromDef.bn : pairFromDef.en) : pair.from;
  const pairToName = pairToDef ? (lang === 'bn' ? pairToDef.bn : pairToDef.en) : pair.to;
  const categoryLabel = CATEGORY_LABELS[pair.category];
  const isTemperature = pair.category === 'temperature';
  const tempFormula = isTemperature ? TEMPERATURE_FORMULAS[`${pair.from}-${pair.to}`] : undefined;
  const notes = [pair.from, pair.to]
    .map((id) => UNIT_NOTES[id])
    .filter((n): n is { bn: string; en: string } => Boolean(n));

  const title =
    lang === 'bn'
      ? `${pairFromName} থেকে ${pairToName} রূপান্তর | Eduvelto`
      : `Convert ${pair.from} to ${pair.to} — ${pairFromName} to ${pairToName} | Eduvelto`;
  const description =
    lang === 'bn'
      ? `${pairFromName} থেকে ${pairToName} রূপান্তর করুন: 1 ${pair.from} = ${forwardOne !== null ? fmtSig(forwardOne) : '—'} ${pair.to}। Eduvelto-তে বিনামূল্যে অনলাইন কনভার্টার।`
      : `Convert ${pairFromName} to ${pairToName}: 1 ${pair.from} = ${forwardOne !== null ? fmtSig(forwardOne) : '—'} ${pair.to}. Free online converter on Eduvelto.`;
  const canonical = `${SITE_URL}/${lang}/convert/${pair.slug}`;
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: lang === 'bn' ? 'হোম' : 'Home', item: `${SITE_URL}/${lang}/` },
      { '@type': 'ListItem', position: 2, name: lang === 'bn' ? 'টুলস' : 'Tools', item: `${SITE_URL}/${lang}/tools` },
      {
        '@type': 'ListItem',
        position: 3,
        name: lang === 'bn' ? 'একক কনভার্টার' : 'Unit Converter',
        item: `${SITE_URL}/${lang}/tools/unit-converter`,
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: lang === 'bn' ? `${pairFromName} থেকে ${pairToName}` : `${pairFromName} to ${pairToName}`,
        item: canonical,
      },
    ],
  };

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  return (
    <PageShell
      titleBn={`${pairFromName} থেকে ${pairToName} রূপান্তরকারী`}
      titleEn={`${pairFromName} to ${pairToName} Converter`}
    >
      <SeoHead
        title={title}
        description={description}
        canonical={canonical}
        lang={lang}
        robots="index, follow"
        jsonLd={[breadcrumbJsonLd]}
      />
      <Breadcrumb
        items={[
          { label: t({ bn: 'টুলস', en: 'Tools' }), to: langUrl('/tools', lang) },
          { label: t({ bn: 'একক কনভার্টার', en: 'Unit Converter' }), to: langUrl('/tools/unit-converter', lang) },
          { label: lang === 'bn' ? `${pairFromName} থেকে ${pairToName}` : `${pairFromName} to ${pairToName}` },
        ]}
      />

      <div className="ev-card" style={{ padding: '18px 16px' }}>
        <div style={gridStyle}>
          <div>
            <label style={labelStyle} htmlFor="pair-amount">
              {t({ bn: 'পরিমাণ', en: 'Amount' })}
            </label>
            <input
              id="pair-amount"
              style={inputStyle}
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle} htmlFor="pair-from">
              {t({ bn: 'থেকে', en: 'From' })}
            </label>
            <select id="pair-from" style={inputStyle} value={from} onChange={(e) => setFrom(e.target.value)}>
              {categoryUnits.map((u) => (
                <option key={u.id} value={u.id}>
                  {lang === 'bn' ? u.bn : u.en} ({u.id})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle} htmlFor="pair-to">
              {t({ bn: 'পর্যন্ত', en: 'To' })}
            </label>
            <select id="pair-to" style={inputStyle} value={to} onChange={(e) => setTo(e.target.value)}>
              {categoryUnits.map((u) => (
                <option key={u.id} value={u.id}>
                  {lang === 'bn' ? u.bn : u.en} ({u.id})
                </option>
              ))}
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={swap}
            style={{
              minHeight: 44,
              padding: '10px 16px',
              borderRadius: 999,
              border: '1px solid var(--line)',
              background: 'var(--surface)',
              color: 'var(--heading)',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            ⇄ {t({ bn: 'অদলবদল', en: 'Swap' })}
          </button>
        </div>
        <div
          style={{
            marginTop: 14,
            padding: '14px 16px',
            borderRadius: 10,
            background: 'var(--teal-soft)',
            fontSize: 17,
            fontWeight: 700,
            color: 'var(--heading)',
          }}
          aria-live="polite"
        >
          {valid && result !== null && fromDef && toDef
            ? `${fmtSig(parsed as number)} ${from} = ${fmtSig(result)} ${to}`
            : t({ bn: 'সঠিক পরিমাণ লিখুন।', en: 'Enter a valid amount.' })}
        </div>
      </div>

      <section className="ev-card" style={{ marginTop: 20, padding: '18px 16px' }} aria-labelledby="pair-formula-title">
        <h2 id="pair-formula-title" style={{ fontSize: 19, color: 'var(--heading)', margin: '0 0 8px' }}>
          {t({ bn: 'রূপান্তরের সূত্র', en: 'Conversion formula' })}
        </h2>
        {isTemperature ? (
          <p style={{ fontSize: 15, lineHeight: 1.75, color: 'var(--ink)', margin: 0 }}>
            {t({
              bn: `তাপমাত্রা রূপান্তরে নির্দিষ্ট গুণক নয়, সূত্র ব্যবহৃত হয়: ${tempFormula ?? ''}। উদাহরণ: 1 ${pair.from} = ${forwardOne !== null ? fmtSig(forwardOne) : '—'} ${pair.to} এবং 1 ${pair.to} = ${reverseOne !== null ? fmtSig(reverseOne) : '—'} ${pair.from}।`,
              en: `Temperature conversion uses a formula, not a fixed factor: ${tempFormula ?? ''}. For example: 1 ${pair.from} = ${forwardOne !== null ? fmtSig(forwardOne) : '—'} ${pair.to} and 1 ${pair.to} = ${reverseOne !== null ? fmtSig(reverseOne) : '—'} ${pair.from}.`,
            })}
          </p>
        ) : (
          <p style={{ fontSize: 15, lineHeight: 1.75, color: 'var(--ink)', margin: 0 }}>
            {t({
              bn: `1 ${pair.from} = ${forwardOne !== null ? fmtSig(forwardOne) : '—'} ${pair.to}`,
              en: `1 ${pair.from} = ${forwardOne !== null ? fmtSig(forwardOne) : '—'} ${pair.to}`,
            })}
            <br />
            {t({
              bn: `1 ${pair.to} = ${reverseOne !== null ? fmtSig(reverseOne) : '—'} ${pair.from}`,
              en: `1 ${pair.to} = ${reverseOne !== null ? fmtSig(reverseOne) : '—'} ${pair.from}`,
            })}
          </p>
        )}
        <p style={{ fontSize: 15, lineHeight: 1.75, color: 'var(--ink)', margin: '12px 0 0' }}>
          {t({
            bn: `${pairFromName} এবং ${pairToName} — দুটোই ${categoryLabel.bn} একক। রূপান্তরটি নির্দিষ্ট ধ্রুবকের ভিত্তিতে হিসাব করা হয়, তাই ফলাফল অনুমান নয়।${notes.length > 0 ? ` ${notes.map((n) => n.bn).join(' ')}` : ''}`,
            en: `${pairFromName} and ${pairToName} are both units of ${categoryLabel.en.toLowerCase()}. The conversion is calculated from fixed constants, so the result is exact, not an estimate.${notes.length > 0 ? ` ${notes.map((n) => n.en).join(' ')}` : ''}`,
          })}
        </p>
      </section>

      <section className="ev-card" style={{ marginTop: 20, padding: '18px 16px' }} aria-labelledby="pair-common-title">
        <h2 id="pair-common-title" style={{ fontSize: 19, color: 'var(--heading)', margin: '0 0 8px' }}>
          {t({ bn: 'সাধারণ মান', en: 'Common values' })}
        </h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '8px 4px', borderBottom: '1px solid var(--line)', color: 'var(--heading)' }}>
                {pairFromName} ({pair.from})
              </th>
              <th style={{ textAlign: 'left', padding: '8px 4px', borderBottom: '1px solid var(--line)', color: 'var(--heading)' }}>
                {pairToName} ({pair.to})
              </th>
            </tr>
          </thead>
          <tbody>
            {COMMON_VALUES.map((v) => {
              const converted = convertUnit(pair.category, v, pair.from, pair.to);
              return (
                <tr key={v}>
                  <td style={{ padding: '8px 4px', borderBottom: '1px solid var(--line)', color: 'var(--ink)' }}>
                    {fmtSig(v)} {pair.from}
                  </td>
                  <td style={{ padding: '8px 4px', borderBottom: '1px solid var(--line)', color: 'var(--ink)' }}>
                    {converted !== null ? `${fmtSig(converted)} ${pair.to}` : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="ev-card" style={{ marginTop: 20, padding: '18px 16px' }} aria-labelledby="pair-related-title">
        <h2 id="pair-related-title" style={{ fontSize: 19, color: 'var(--heading)', margin: '0 0 8px' }}>
          {t({ bn: 'সম্পর্কিত রূপান্তর', en: 'Related conversions' })}
        </h2>
        <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 2, fontSize: 15 }}>
          {relatedPairs(pair).map((rel) => {
            const relFrom = findUnitDef(rel.category, rel.from);
            const relTo = findUnitDef(rel.category, rel.to);
            const relFromName = relFrom ? (lang === 'bn' ? relFrom.bn : relFrom.en) : rel.from;
            const relToName = relTo ? (lang === 'bn' ? relTo.bn : relTo.en) : rel.to;
            return (
              <li key={rel.slug}>
                <Link to={langUrl(`/convert/${rel.slug}`, lang)}>
                  {lang === 'bn' ? `${relFromName} থেকে ${relToName}` : `${relFromName} to ${relToName}`}
                </Link>
              </li>
            );
          })}
        </ul>
        <p style={{ fontSize: 15, lineHeight: 1.75, margin: '16px 0 0' }}>
          <Link to={langUrl('/tools/unit-converter', lang)} style={{ fontWeight: 600 }}>
            ← {t({ bn: 'ইউনিট কনভার্টারে ফিরে যান', en: 'Back to Unit Converter' })}
          </Link>
        </p>
      </section>
    </PageShell>
  );
}
