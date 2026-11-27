// Eduvelto — Fuel Cost Calculator tool UI (landed 27 Nov 2026, A-tools).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Engine: fuelCost() + BD_FUEL_PRICES (BPC/Energy Division, checked 2026-11-27) in src/lib/tools/financeNew.ts. 100% in-browser; nothing is uploaded.
import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import {ToolHero, Tiles, CopyButton, ButtonRow, inputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { BD_FUEL_PRICES, fuelCost, distanceForBudget } from '../../lib/tools/financeNew';

const resultStyle: CSSProperties = {
  marginTop: 14,
  padding: '18px 16px',
  borderRadius: 12,
  background: 'var(--teal-soft)',
  boxShadow: 'var(--shadow-sm)',
};

const errorStyle: CSSProperties = {
  marginTop: 14,
  color: '#b3261e',
  fontSize: 14,
};

function parseNum(s: string): number | null {
  if (s.trim() === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

const fmtMoney = (n: number): string => `৳${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;


type FuelKey = keyof typeof BD_FUEL_PRICES;
const FUEL_LABELS: Record<FuelKey, { bn: string; en: string }> = {
  diesel: { bn: 'ডিজেল', en: 'Diesel' },
  petrol: { bn: 'পেট্রল', en: 'Petrol' },
  octane: { bn: 'অকটেন', en: 'Octane' },
  kerosene: { bn: 'কেরোসিন', en: 'Kerosene' },
  cng: { bn: 'সিএনজি', en: 'CNG' },
  lpg: { bn: 'এলপিজি (অটোগ্যাস)', en: 'LPG (autogas)' },
};

export function FuelCostTool() {
  const { t, lang } = useLanguage();
  const [distance, setDistance] = useState('100');
  const [mileage, setMileage] = useState('10');
  const [fuel, setFuel] = useState<FuelKey>('octane');
  const [price, setPrice] = useState(String(BD_FUEL_PRICES.octane.pricePerLitre));
  const [trips, setTrips] = useState('26');
  const [budget, setBudget] = useState('5000');
  const distanceV = parseNum(distance);
  const mileageV = parseNum(mileage);
  const priceV = parseNum(price);
  const tripsV = parseNum(trips) ?? 26;
  const budgetV = parseNum(budget);

  const result = useMemo(() => {
    if (distanceV === null || mileageV === null || priceV === null) return null;
    try { return fuelCost({ distanceKm: distanceV, mileageKmPerLitre: mileageV, pricePerLitre: priceV, tripsPerMonth: tripsV }); } catch { return null; }
  }, [distanceV, mileageV, priceV, tripsV]);
  const budgetKm = useMemo(() => {
    if (budgetV === null || mileageV === null || priceV === null) return null;
    try { return distanceForBudget(budgetV, mileageV, priceV); } catch { return null; }
  }, [budgetV, mileageV, priceV]);
  const fuelInfo = BD_FUEL_PRICES[fuel];

  function pickFuel(next: FuelKey): void {
    setFuel(next);
    setPrice(String(BD_FUEL_PRICES[next].pricePerLitre));
  }

  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="জ্বালানি খরচ ক্যালকুলেটর" titleEn="Fuel Cost Calculator" descBn="যাত্রার দূরত্ব ও গাড়ির মাইলেজ দিয়ে তেলের খরচ বের করুন।" descEn="Work out fuel cost from trip distance and vehicle mileage." chipBn="দাম সম্পাদনযোগ্য — সরকারি বিজ্ঞপ্তিতে মাসে বদলায়" chipEn="Prices are editable — they change monthly by government notice" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <div>
          <label style={labelStyle} htmlFor="fc-distance">{t({ bn: 'দূরত্ব (কিমি)', en: 'Distance (km)' })}</label>
          <input id="fc-distance" style={inputStyle} type="number" min="0" inputMode="decimal" value={distance} onChange={(e) => setDistance(e.target.value)} placeholder="100" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="fc-mileage">{t({ bn: 'মাইলেজ (কিমি/লিটার)', en: 'Mileage (km/litre)' })}</label>
          <input id="fc-mileage" style={inputStyle} type="number" min="0" step="0.1" inputMode="decimal" value={mileage} onChange={(e) => setMileage(e.target.value)} placeholder="10" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="fc-fuel">{t({ bn: 'জ্বালানির ধরন', en: 'Fuel type' })}</label>
          <select id="fc-fuel" style={inputStyle} value={fuel} onChange={(e) => pickFuel(e.target.value as FuelKey)}>
            {(Object.keys(BD_FUEL_PRICES) as FuelKey[]).map((k) => (<option key={k} value={k}>{t({ bn: FUEL_LABELS[k].bn, en: FUEL_LABELS[k].en })} — ৳{BD_FUEL_PRICES[k].pricePerLitre}</option>))}
          </select>
        </div>
        <div>
          <label style={labelStyle} htmlFor="fc-price">{t({ bn: 'দাম (টাকা/লিটার) — নিজে বদলাতে পারেন', en: 'Price (taka/litre) — you can change it' })}</label>
          <input id="fc-price" style={inputStyle} type="number" min="0" step="0.01" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle} htmlFor="fc-trips">{t({ bn: 'মাসে যাত্রা সংখ্যা', en: 'Trips per month' })}</label>
          <input id="fc-trips" style={inputStyle} type="number" min="0" inputMode="numeric" value={trips} onChange={(e) => setTrips(e.target.value)} placeholder="26" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="fc-budget">{t({ bn: 'মাসিক বাজেট (টাকা) — কত কিমি চলবে?', en: 'Monthly budget (taka) — how far will it go?' })}</label>
          <input id="fc-budget" style={inputStyle} type="number" min="0" inputMode="decimal" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="5000" />
        </div>
      </div>
      <ButtonRow>
        <button type="button" style={{ minHeight: 40, padding: '0 14px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--heading)', cursor: 'pointer', fontWeight: 600 }} onClick={() => { setDistance('400'); setMileage('12'); }}>{t({ bn: 'ঢাকা → কক্সবাজার (~৪০০ কিমি)', en: 'Dhaka → Cox’s Bazar (~400 km)' })}</button>
        <button type="button" style={{ minHeight: 40, padding: '0 14px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--heading)', cursor: 'pointer', fontWeight: 600 }} onClick={() => { setDistance('30'); setMileage('45'); pickFuel('petrol'); }}>{t({ bn: 'দৈনিক অফিস যাতায়াত (মোটরসাইকেল)', en: 'Daily office commute (motorcycle)' })}</button>
      </ButtonRow>
      {result ? (
        <>
          <div style={resultStyle} role="status">
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{t({ bn: 'প্রতি যাত্রায় খরচ', en: 'Cost per trip' })}</p>
            <p style={{ margin: 0, fontSize: '2rem', fontFamily: 'var(--font-head)', color: 'var(--teal-deep)' }}>{fmtMoney(result.costPerTrip)}</p>
            <p style={{ margin: '8px 0 0', fontSize: 15 }}>{t({ bn: `সূত্র: ${distanceV} কিমি ÷ ${mileageV} কিমি/লিটার = ${result.litres} লিটার × ৳${priceV}`, en: `Formula: ${distanceV} km ÷ ${mileageV} km/L = ${result.litres} L × ৳${priceV}` })}</p>
          </div>
          <Tiles items={[
            { labelBn: 'লিটার লাগবে', labelEn: 'Litres needed', value: String(result.litres) },
            { labelBn: 'প্রতি কিমি খরচ', labelEn: 'Cost per km', value: fmtMoney(result.costPerKm) },
            { labelBn: 'মাসিক খরচ', labelEn: 'Monthly cost', value: fmtMoney(result.costPerMonth) },
            { labelBn: 'মাসিক লিটার', labelEn: 'Litres per month', value: String(result.litresPerMonth) },
            { labelBn: 'বাজেটে চলবে', labelEn: 'Budget buys', value: budgetKm === null ? '—' : `${budgetKm} km` },
          ]} />
          <ButtonRow><CopyButton text={`Fuel cost ${fmtMoney(result.costPerTrip)} per trip, ${fmtMoney(result.costPerMonth)} per month`} labelBn="ফলাফল কপি করুন" labelEn="Copy result" /></ButtonRow>
        </>
      ) : (
        <p style={errorStyle} role="alert">{t({ bn: 'সঠিক মান দিন — মাইলেজ ০-এর বেশি হতে হবে।', en: 'Enter valid values — mileage must be more than 0.' })}</p>
      )}
      <p style={noteStyle}>{t({ bn: lang === 'bn' ? fuelInfo.sourceLabelBn : fuelInfo.sourceLabelEn, en: fuelInfo.sourceLabelEn })} • {t({ bn: `যাচাই: ${fuelInfo.checkedOn}`, en: `Checked: ${fuelInfo.checkedOn}` })}</p>
      <p style={noteStyle}>{t({ bn: 'সিএনজি ও এলপিজির দাম তালিকাভুক্ত মূল্য মাত্র — পাম্পে যাচাই করুন। জ্বালানির দাম সরকারি বিজ্ঞপ্তিতে মাসে বদলাতে পারে, তাই ভ্রমণের আগে দামটি মিলিয়ে নিন।', en: 'CNG and LPG prices are secondary listings only — check at the pump. Fuel prices can change monthly by government notification, so confirm the price before a trip.' })}</p>
    </section>
  );
}
