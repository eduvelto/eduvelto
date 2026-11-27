// Eduvelto — Electricity Bill Calculator tool UI.
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Logic in src/lib/tools/electricityBill.ts. The slab RATES are
// USER-EDITABLE, labelled with source + date, and the result is
// labelled আনুমানিক — the rates change and published sources
// disagree on the higher slabs, so they are never hard-coded as
// fact. Default: BERC residential tariff as reported for June 2026.

import { useMemo, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { calculateElectricityBill, DEFAULT_TARIFF, type Tariff } from '../../lib/tools/electricityBill';
import {
  inputStyle, labelStyle, gridStyle, cardStyle, resultStyle, headlineStyle,
  headlineLabelStyle, tileGridStyle, noteStyle, buttonRowStyle, ToolHero, CopyButton, Tile,
} from './toolUiShared';

function parseNum(raw: string): number | null {
  if (raw.trim() === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function fmt(n: number): string {
  return n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

export function ElectricityBillCalculatorTool() {
  const { t, lang } = useLanguage();
  const [units, setUnits] = useState('');
  const [loadKw, setLoadKw] = useState('1');
  // Editable rates, pre-filled with the June 2026 reported tariff.
  const [rates, setRates] = useState<number[]>(() => [
    DEFAULT_TARIFF.lifelineRate,
    ...DEFAULT_TARIFF.slabs.map((s) => s.rate),
  ]);
  const [demandRate, setDemandRate] = useState(String(DEFAULT_TARIFF.demandChargePerKw));
  const [vatPct, setVatPct] = useState(String(DEFAULT_TARIFF.vatPercent));
  const [meterRent, setMeterRent] = useState('0');

  const unitsN = parseNum(units);
  const loadN = parseNum(loadKw);
  const demandN = parseNum(demandRate);
  const vatN = parseNum(vatPct);
  const rentN = parseNum(meterRent);

  const tariff: Tariff | null = useMemo(() => {
    if (rates.some((r) => !Number.isFinite(r) || r < 0) || demandN === null || vatN === null || rentN === null) {
      return null;
    }
    return {
      ...DEFAULT_TARIFF,
      lifelineRate: rates[0],
      slabs: DEFAULT_TARIFF.slabs.map((s, i) => ({ ...s, rate: rates[i + 1] })),
      demandChargePerKw: demandN,
      vatPercent: vatN,
      meterRent: rentN,
    };
  }, [rates, demandN, vatN, rentN]);

  const result = useMemo(() => {
    if (unitsN === null || unitsN < 0 || loadN === null || loadN < 0 || !tariff) return null;
    try {
      return calculateElectricityBill(unitsN, loadN, tariff);
    } catch {
      return null;
    }
  }, [unitsN, loadN, tariff]);

  function loadExample(): void {
    setUnits('200');
    setLoadKw('1');
  }

  function resetRates(): void {
    setRates([DEFAULT_TARIFF.lifelineRate, ...DEFAULT_TARIFF.slabs.map((s) => s.rate)]);
    setDemandRate(String(DEFAULT_TARIFF.demandChargePerKw));
    setVatPct(String(DEFAULT_TARIFF.vatPercent));
    setMeterRent('0');
  }

  const slabLabels = [
    { bn: 'লাইফলাইন (≤৫০ ইউনিট)', en: 'Lifeline (≤50 units)' },
    { bn: '০–৭৫ ইউনিট', en: '0–75 units' },
    { bn: '৭৬–২০০ ইউনিট', en: '76–200 units' },
    { bn: '২০১–৩০০ ইউনিট', en: '201–300 units' },
    { bn: '৩০১–৪০০ ইউনিট', en: '301–400 units' },
    { bn: '৪০১–৬০০ ইউনিট', en: '401–600 units' },
    { bn: '৬০০+ ইউনিট', en: '600+ units' },
  ];

  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="bill-title">
      <ToolHero
        titleId="bill-title"
        titleBn="বিদ্যুৎ বিল ক্যালকুলেটর"
        titleEn="Electricity Bill Calculator"
        descBn="ব্যবহৃত ইউনিট দিয়ে বিদ্যুৎ বিলের আনুমানিক হিসাব করুন।"
        descEn="Estimate an electricity bill from the units used."
        chipBn="আনুমানিক হিসাব • হার বদলানো যায়"
        chipEn="Approximate estimate • rates are editable"
      />
      <div style={gridStyle}>
        <div>
          <label style={labelStyle} htmlFor="bill-units">
            {t({ bn: 'ব্যবহৃত ইউনিট (kWh)', en: 'Units used (kWh)' })}
          </label>
          <input id="bill-units" style={inputStyle} type="number" min="0" step="1" inputMode="decimal" value={units} onChange={(e) => setUnits(e.target.value)} placeholder="200" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="bill-load">
            {t({ bn: 'অনুমোদিত লোড (kW)', en: 'Sanctioned load (kW)' })}
          </label>
          <input id="bill-load" style={inputStyle} type="number" min="0" step="0.5" inputMode="decimal" value={loadKw} onChange={(e) => setLoadKw(e.target.value)} placeholder="1" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="bill-rent">
            {t({ bn: 'মিটার ভাড়া (৳/মাস)', en: 'Meter rent (৳/month)' })}
          </label>
          <input id="bill-rent" style={inputStyle} type="number" min="0" step="1" inputMode="decimal" value={meterRent} onChange={(e) => setMeterRent(e.target.value)} placeholder="0" />
        </div>
      </div>
      <div style={buttonRowStyle}>
        <button type="button" className="ev-btn-outline" onClick={loadExample}>
          {t({ bn: 'উদাহরণ বসান (২০০ ইউনিট)', en: 'Load example (200 units)' })}
        </button>
      </div>
      <div style={{ marginTop: 16 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--heading)', margin: '0 0 4px' }}>
          {t({ bn: 'হার (৳/ইউনিট) — আপনার বিলের সঙ্গে মিলিয়ে বদলে নিন', en: 'Rates (৳/unit) — edit them to match your bill' })}
        </p>
        <div style={gridStyle}>
          {slabLabels.map((sl, i) => (
            <div key={sl.en}>
              <label style={labelStyle} htmlFor={`bill-rate-${i}`}>
                {lang === 'bn' ? sl.bn : sl.en}
              </label>
              <input
                id={`bill-rate-${i}`}
                style={inputStyle}
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={rates[i]}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setRates((prev) => prev.map((r, j) => (j === i ? (Number.isFinite(v) ? v : 0) : r)));
                }}
              />
            </div>
          ))}
          <div>
            <label style={labelStyle} htmlFor="bill-demand">
              {t({ bn: 'ডিমান্ড চার্জ (৳/kW)', en: 'Demand charge (৳/kW)' })}
            </label>
            <input id="bill-demand" style={inputStyle} type="number" min="0" step="1" value={demandRate} onChange={(e) => setDemandRate(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle} htmlFor="bill-vat">
              {t({ bn: 'ভ্যাট (%)', en: 'VAT (%)' })}
            </label>
            <input id="bill-vat" style={inputStyle} type="number" min="0" step="0.5" value={vatPct} onChange={(e) => setVatPct(e.target.value)} />
          </div>
        </div>
        <div style={buttonRowStyle}>
          <button type="button" className="ev-btn-outline" onClick={resetRates}>
            {t({ bn: 'হার আগের মতো করুন', en: 'Reset rates' })}
          </button>
        </div>
      </div>
      {result ? (
        <div style={resultStyle} role="status">
          <p style={headlineLabelStyle}>{t({ bn: 'আনুমানিক মোট বিল', en: 'Approximate total bill' })}</p>
          <p style={headlineStyle}>৳{fmt(result.total)}</p>
          <div style={buttonRowStyle}>
            <CopyButton
              text={t({
                bn: `${result.units} ইউনিটের আনুমানিক বিদ্যুৎ বিল ৳${fmt(result.total)} (জ্বালানি চার্জ ৳${fmt(result.energyCharge)}, ডিমান্ড চার্জ ৳${fmt(result.demandCharge)}, ভ্যাট ৳${fmt(result.vat)})।`,
                en: `Approximate electricity bill for ${result.units} units: ৳${fmt(result.total)} (energy ৳${fmt(result.energyCharge)}, demand ৳${fmt(result.demandCharge)}, VAT ৳${fmt(result.vat)}).`,
              })}
              labelBn="হিসাব কপি করুন"
              labelEn="Copy estimate"
            />
          </div>
          <div style={tileGridStyle}>
            <Tile label={t({ bn: 'জ্বালানি চার্জ', en: 'Energy charge' })} value={`৳${fmt(result.energyCharge)}`} />
            <Tile label={t({ bn: 'ডিমান্ড চার্জ', en: 'Demand charge' })} value={`৳${fmt(result.demandCharge)}`} />
            <Tile label={t({ bn: 'ভ্যাট', en: 'VAT' })} value={`৳${fmt(result.vat)}`} />
            <Tile label={t({ bn: 'গড় খরচ / ইউনিট', en: 'Average per unit' })} value={`৳${fmt(result.averagePerUnit)}`} />
          </div>
          <ul style={{ margin: '12px 0 0', paddingLeft: 20, fontSize: 15, lineHeight: 1.7 }}>
            {result.breakdown.map((row) => (
              <li key={row.labelEn}>
                {lang === 'bn' ? row.labelBn : row.labelEn}: {row.units} × ৳{fmt(row.rate)} = ৳{fmt(row.amount)}
              </li>
            ))}
          </ul>
          <p style={noteStyle}>
            {t({
              bn: 'আনুমানিক হিসাব — এটি আপনার সরকারি বিল নয়। হার: BERC আবাসিক ট্যারিফ, জুন ২০২৬ বিলিং মাসের হিসাবে প্রকাশিত হার। DPDC, DESCO, BREB, NESCO, WZPDCL — সবার আবাসিক ট্যারিফ একই BERC হারে হয়, তবে উচ্চ স্ল্যাবের হার নিয়ে প্রকাশিত সূত্রগুলো একমত নয়, তাই আপনার সর্বশেষ বিলের সঙ্গে মিলিয়ে হার বদলে নিন।',
              en: 'Approximate estimate — this is not your official bill. Rates: BERC residential tariff as reported for the June 2026 billing month. DPDC, DESCO, BREB, NESCO and WZPDCL all use the same BERC residential tariff, but published sources disagree on the higher-slab rates, so check them against your latest bill and edit the rates.',
            })}
          </p>
        </div>
      ) : unitsN === null && units !== '' ? (
        <p style={{ marginTop: 14, color: '#b3261e', fontSize: 14 }} role="alert">
          {t({ bn: 'সঠিক সংখ্যা দিন।', en: 'Enter valid numbers.' })}
        </p>
      ) : null}
    </section>
  );
}
