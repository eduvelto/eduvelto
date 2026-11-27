// Eduvelto — Land Measurement tool UI (100-Tools Project, Phase 2, Wave 3).
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Pure conversion lives in src/lib/tools/landMeasurement.ts: every unit
// converts through square feet (1 decimal = 435.6 sq ft, 1 bigha =
// 33 decimal, 1 acre = 100 decimal). The module's consistent 33-decimal
// bigha is used as-is — 1 acre = 3.0303 bigha.

import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  convertLandArea,
  LAND_SQFT_PER_UNIT,
  LAND_UNIT_BENGALI,
  plotAreaFromDimensions,
  type LandUnit,
} from '../../lib/tools/landMeasurement';

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

const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  marginTop: 10,
  fontSize: 15,
};

const cellStyle: CSSProperties = {
  padding: '8px 6px',
  borderBottom: '1px solid var(--line)',
  textAlign: 'left',
};

const LAND_UNITS = Object.keys(LAND_SQFT_PER_UNIT) as LandUnit[];

const LAND_UNIT_ENGLISH: Record<LandUnit, string> = {
  decimal: 'Decimal',
  katha: 'Katha',
  bigha: 'Bigha',
  acre: 'Acre',
  hectare: 'Hectare',
  sqft: 'Square feet',
  sqm: 'Square metres',
};

function fmt(n: number): string {
  return n.toLocaleString('en-IN', { maximumFractionDigits: 4 });
}

function parseNum(raw: string): number | null {
  if (raw.trim() === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export function LandMeasurementTool() {
  const { t, lang } = useLanguage();
  const [value, setValue] = useState('');
  const [fromUnit, setFromUnit] = useState<LandUnit>('decimal');
  const [toUnit, setToUnit] = useState<LandUnit>('sqft');
  const [lengthFt, setLengthFt] = useState('');
  const [widthFt, setWidthFt] = useState('');

  const parsedValue = parseNum(value);
  const invalid = value.trim() !== '' && (parsedValue === null || parsedValue < 0);

  const converted = useMemo(() => {
    if (parsedValue === null || parsedValue < 0) return null;
    try {
      return convertLandArea(parsedValue, fromUnit, toUnit);
    } catch {
      return null;
    }
  }, [parsedValue, fromUnit, toUnit]);

  const allUnits = useMemo(() => {
    if (parsedValue === null || parsedValue < 0) return null;
    try {
      return LAND_UNITS.map((unit) => ({
        unit,
        value: convertLandArea(parsedValue, fromUnit, unit),
      }));
    } catch {
      return null;
    }
  }, [parsedValue, fromUnit]);

  const lengthV = parseNum(lengthFt);
  const widthV = parseNum(widthFt);
  const plotFilled = lengthV !== null && widthV !== null;
  const plotInvalid =
    (lengthFt.trim() !== '' && (lengthV === null || lengthV < 0)) ||
    (widthFt.trim() !== '' && (widthV === null || widthV < 0));

  const plot = useMemo(() => {
    if (!plotFilled || lengthV === null || widthV === null || lengthV < 0 || widthV < 0) {
      return null;
    }
    try {
      return plotAreaFromDimensions(lengthV, widthV);
    } catch {
      return null;
    }
  }, [plotFilled, lengthV, widthV]);

  const unitLabel = (unit: LandUnit) =>
    lang === 'bn' ? LAND_UNIT_BENGALI[unit] : LAND_UNIT_ENGLISH[unit];

  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="land-title">
      <h2 id="land-title" style={{ fontSize: 19, color: 'var(--heading)', margin: '0 0 4px' }}>
        {t({ bn: 'জমির মাপ', en: 'Land Measurement' })}
      </h2>
      <p style={{ color: 'var(--muted)', fontSize: 14, margin: '0 0 14px' }}>
        {t({
          bn: 'শতক, কাঠা, বিঘা, একর, হেক্টর, বর্গফুট ও বর্গমিটারের মধ্যে জমির মাপ রূপান্তর করুন। সব হিসাব আপনার ডিভাইসেই হয়।',
          en: 'Convert land area between decimal, katha, bigha, acre, hectare, square feet and square metres. Everything is computed on your device.',
        })}
      </p>
      <div style={gridStyle}>
        <div>
          <label style={labelStyle} htmlFor="land-value">
            {t({ bn: 'জমির পরিমাণ', en: 'Land area' })}
          </label>
          <input
            id="land-value"
            style={inputStyle}
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="land-from">
            {t({ bn: 'থেকে (একক)', en: 'From (unit)' })}
          </label>
          <select
            id="land-from"
            style={inputStyle}
            value={fromUnit}
            onChange={(e) => setFromUnit(e.target.value as LandUnit)}
          >
            {LAND_UNITS.map((unit) => (
              <option key={unit} value={unit}>
                {unitLabel(unit)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle} htmlFor="land-to">
            {t({ bn: 'এতে (একক)', en: 'To (unit)' })}
          </label>
          <select
            id="land-to"
            style={inputStyle}
            value={toUnit}
            onChange={(e) => setToUnit(e.target.value as LandUnit)}
          >
            {LAND_UNITS.map((unit) => (
              <option key={unit} value={unit}>
                {unitLabel(unit)}
              </option>
            ))}
          </select>
        </div>
      </div>
      {converted !== null && allUnits !== null ? (
        <div style={resultStyle} role="status">
          <p style={{ margin: '0 0 6px', fontSize: 16 }}>
            <strong>
              {fmt(parsedValue as number)} {unitLabel(fromUnit)} = {fmt(converted)}{' '}
              {unitLabel(toUnit)}
            </strong>
          </p>
          <table style={tableStyle}>
            <caption style={{ textAlign: 'left', fontWeight: 600, marginBottom: 6 }}>
              {t({ bn: 'সব এককে', en: 'In all units' })}
            </caption>
            <tbody>
              {allUnits.map(({ unit, value: v }) => (
                <tr key={unit}>
                  <td style={cellStyle}>{unitLabel(unit)}</td>
                  <td style={cellStyle}>{fmt(v)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={formulaStyle}>
            {t({
              bn: 'ভিত্তি: ১ শতক = ৪৩৫.৬ বর্গফুট; ১ কাঠা = ১.৬৫ শতক; ১ বিঘা = ৩৩ শতক; ১ একর = ১০০ শতক।',
              en: 'Basis: 1 decimal = 435.6 sq ft; 1 katha = 1.65 decimal; 1 bigha = 33 decimal; 1 acre = 100 decimal.',
            })}
          </p>
        </div>
      ) : invalid ? (
        <p style={errorStyle} role="alert">
          {t({
            bn: 'সঠিক পরিমাণ দিন — পরিমাণ ০ বা তার বেশি হতে হবে।',
            en: 'Enter a valid amount — it must be 0 or above.',
          })}
        </p>
      ) : null}

      <h3 style={{ fontSize: 17, color: 'var(--heading)', margin: '22px 0 4px' }}>
        {t({ bn: 'প্লটের মাপ থেকে ক্ষেত্রফল', en: 'Plot area from dimensions' })}
      </h3>
      <p style={{ color: 'var(--muted)', fontSize: 14, margin: '0 0 14px' }}>
        {t({
          bn: 'জমির দৈর্ঘ্য ও প্রস্থ (ফুটে) দিন — সব এককে ক্ষেত্রফল বের হবে।',
          en: 'Enter the plot length and width in feet — the area appears in every unit.',
        })}
      </p>
      <div style={gridStyle}>
        <div>
          <label style={labelStyle} htmlFor="land-length">
            {t({ bn: 'দৈর্ঘ্য (ফুট)', en: 'Length (feet)' })}
          </label>
          <input
            id="land-length"
            style={inputStyle}
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={lengthFt}
            onChange={(e) => setLengthFt(e.target.value)}
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="land-width">
            {t({ bn: 'প্রস্থ (ফুট)', en: 'Width (feet)' })}
          </label>
          <input
            id="land-width"
            style={inputStyle}
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={widthFt}
            onChange={(e) => setWidthFt(e.target.value)}
          />
        </div>
      </div>
      {plot ? (
        <div style={resultStyle} role="status">
          <p style={{ margin: '0 0 6px', fontSize: 16 }}>
            <strong>
              {t({ bn: 'ক্ষেত্রফল: ', en: 'Area: ' })}
              {fmt(plot.sqft)} {t({ bn: 'বর্গফুট', en: 'sq ft' })}
            </strong>
          </p>
          <table style={tableStyle}>
            <tbody>
              <tr>
                <td style={cellStyle}>{unitLabel('sqm')}</td>
                <td style={cellStyle}>{fmt(plot.sqm)}</td>
              </tr>
              <tr>
                <td style={cellStyle}>{unitLabel('decimal')}</td>
                <td style={cellStyle}>{fmt(plot.decimal)}</td>
              </tr>
              <tr>
                <td style={cellStyle}>{unitLabel('katha')}</td>
                <td style={cellStyle}>{fmt(plot.katha)}</td>
              </tr>
              <tr>
                <td style={cellStyle}>{unitLabel('bigha')}</td>
                <td style={cellStyle}>{fmt(plot.bigha)}</td>
              </tr>
              <tr>
                <td style={cellStyle}>{unitLabel('acre')}</td>
                <td style={cellStyle}>{fmt(plot.acre)}</td>
              </tr>
            </tbody>
          </table>
          <p style={formulaStyle}>
            {t({
              bn: 'সূত্র: ক্ষেত্রফল = দৈর্ঘ্য × প্রস্থ (বর্গফুট)।',
              en: 'Formula: area = length × width (square feet).',
            })}
          </p>
        </div>
      ) : plotInvalid ? (
        <p style={errorStyle} role="alert">
          {t({
            bn: 'সঠিক দৈর্ঘ্য ও প্রস্থ দিন — দুটোই ০ বা তার বেশি হতে হবে।',
            en: 'Enter a valid length and width — both must be 0 or above.',
          })}
        </p>
      ) : null}
    </section>
  );
}
