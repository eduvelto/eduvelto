// Eduvelto — ROI Calculator tool UI.
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Engine: calculateRoi() in src/lib/tools/financeHealthTools.ts. 100% in-browser.
import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, Tiles, CopyButton, ButtonRow, ClearButton, ExampleButton, shortInputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { calculateRoi } from '../../lib/tools/financeHealthTools';

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

export function RoiCalculatorTool() {
  const { t } = useLanguage();
  const [cost, setCost] = useState('10000');
  const [gain, setGain] = useState('12000');
  const [years, setYears] = useState('2');
  const c = parseNum(cost);
  const g = parseNum(gain);
  const y = parseNum(years);
  const result = useMemo(() => (c !== null && g !== null ? calculateRoi(c, g, y ?? undefined) : null), [c, g, y]);
  const loadExample = () => { setCost('10000'); setGain('12000'); setYears('2'); };
  const clear = () => { setCost(''); setGain(''); setYears(''); };

  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="আরওআই (ROI) ক্যালকুলেটর" titleEn="ROI Calculator" descBn="বিনিয়োগে কত লাভ বা ক্ষতি হলো, শতকরা হিসাবে দেখুন — সঙ্গে বার্ষিক আরওআই।" descEn="See your profit or loss as a percentage of what you invested — plus the annualized ROI." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <div>
          <label style={labelStyle} htmlFor="roi-cost">{t({ bn: 'বিনিয়োগের খরচ (টাকা)', en: 'Investment cost (taka)' })}</label>
          <input id="roi-cost" style={shortInputStyle} type="number" min="0" inputMode="decimal" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="10000" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="roi-gain">{t({ bn: 'ফেরত পাওয়া টাকা (টাকা)', en: 'Money received back (taka)' })}</label>
          <input id="roi-gain" style={shortInputStyle} type="number" min="0" inputMode="decimal" value={gain} onChange={(e) => setGain(e.target.value)} placeholder="12000" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="roi-years">{t({ bn: 'সময় (বছর) — বার্ষিক আরওআইয়ের জন্য', en: 'Time (years) — for annualized ROI' })}</label>
          <input id="roi-years" style={shortInputStyle} type="number" min="0" step="0.1" inputMode="decimal" value={years} onChange={(e) => setYears(e.target.value)} placeholder="2" />
        </div>
      </div>
      {result ? (
        <>
          <div style={resultStyle} role="status">
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{t({ bn: 'আরওআই (ROI)', en: 'Return on investment (ROI)' })}</p>
            <p style={{ margin: 0, fontSize: '2rem', fontFamily: 'var(--font-head)', color: 'var(--teal-deep)' }}>{result.roiPercent.toFixed(2)}%</p>
            <p style={{ margin: '8px 0 0', fontSize: 15 }}>{t({ bn: `লাভ: ${fmtMoney(result.profit)}`, en: `Profit: ${fmtMoney(result.profit)}` })}</p>
            <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--muted)' }}>{t({ bn: `সূত্র: আরওআই = (ফেরত − খরচ) ÷ খরচ × ১০০`, en: 'Formula: ROI = (received − cost) ÷ cost × 100' })}</p>
          </div>
          <Tiles items={[
            { labelBn: 'বিনিয়োগ', labelEn: 'Invested', value: fmtMoney(c ?? 0) },
            { labelBn: 'ফেরত', labelEn: 'Received', value: fmtMoney(g ?? 0) },
            { labelBn: 'বার্ষিক আরওআই', labelEn: 'Annualized ROI', value: result.annualizedRoiPercent !== null ? `${result.annualizedRoiPercent.toFixed(2)}%` : '—' },
          ]} />
          <ButtonRow>
            <CopyButton text={`ROI ${result.roiPercent.toFixed(2)}%, profit ${fmtMoney(result.profit)}`} labelBn="ফলাফল কপি করুন" labelEn="Copy result" />
            <ExampleButton onLoad={loadExample} />
            <ClearButton onClear={clear} />
          </ButtonRow>
        </>
      ) : (
        <p style={errorStyle} role="alert">{t({ bn: 'সঠিক মান দিন — খরচ ০-এর বেশি এবং ফেরত ০ বা তার বেশি হতে হবে।', en: 'Enter valid values — cost must be above 0 and received amount 0 or above.' })}</p>
      )}
      <p style={noteStyle}>{t({ bn: 'আরওআই শুধু লাভের হার দেখায় — ঝুঁকি, ফি বা কর এতে ধরা হয় না। বার্ষিক আরওআই দেখতে সময়ের ঘরটি পূরণ করুন।', en: 'ROI shows only the rate of return — it does not include risk, fees or tax. Fill in the time to see the annualized ROI.' })}</p>
    </section>
  );
}
