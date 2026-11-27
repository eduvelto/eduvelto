// Eduvelto — Simple Interest Calculator tool UI (landed 27 Nov 2026, A-tools).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Engine: calculateSimpleInterest() + calculateCompoundInterest() in src/lib/lifeCalculators.ts. 100% in-browser; nothing is uploaded.
import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import {ToolHero, Tiles, CopyButton, ButtonRow, inputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { calculateSimpleInterest, calculateCompoundInterest } from '../../lib/lifeCalculators';

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


export function SimpleInterestTool() {
  const { t } = useLanguage();
  const [mode, setMode] = useState<'forward' | 'reverse'>('forward');
  const [principal, setPrincipal] = useState('10000');
  const [rate, setRate] = useState('10');
  const [years, setYears] = useState('2');
  const [months, setMonths] = useState('0');
  const [targetInterest, setTargetInterest] = useState('2000');
  const p = parseNum(principal);
  const r = parseNum(rate);
  const y = parseNum(years);
  const m = parseNum(months);
  const target = parseNum(targetInterest);
  const timeYears = (y ?? 0) + (m ?? 0) / 12;
  const simple = useMemo(() => (p !== null && r !== null && timeYears > 0 ? calculateSimpleInterest(p, r, timeYears) : null), [p, r, timeYears]);
  const compound = useMemo(() => (p !== null && r !== null && timeYears > 0 ? calculateCompoundInterest(p, r, timeYears, 1) : null), [p, r, timeYears]);
  const reverseRate = mode === 'reverse' && p !== null && p > 0 && target !== null && timeYears > 0 ? (target * 100) / (p * timeYears) : null;

  const tabStyle = (active: boolean): CSSProperties => ({
    minHeight: 40, padding: '0 14px', borderRadius: 8, border: '1px solid var(--line)',
    background: active ? 'var(--teal)' : 'var(--surface)', color: active ? '#fff' : 'var(--heading)', cursor: 'pointer', fontWeight: 600,
  });

  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="সরল সুদ ক্যালকুলেটর" titleEn="Simple Interest Calculator" descBn="সরল সুদে কত সুদ হবে ও মোট কত টাকা পাবেন তা হিসাব করুন।" descEn="Work out the interest and maturity amount on simple interest." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <button type="button" style={tabStyle(mode === 'forward')} onClick={() => setMode('forward')}>{t({ bn: 'সুদ হিসাব করুন', en: 'Calculate interest' })}</button>
        <button type="button" style={tabStyle(mode === 'reverse')} onClick={() => setMode('reverse')}>{t({ bn: 'কত হারে এই সুদ পাব?', en: 'What rate gives this interest?' })}</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <div>
          <label style={labelStyle} htmlFor="si-principal">{t({ bn: 'মূলধন (টাকা)', en: 'Principal (taka)' })}</label>
          <input id="si-principal" style={inputStyle} type="number" min="0" inputMode="decimal" value={principal} onChange={(e) => setPrincipal(e.target.value)} placeholder="10000" />
        </div>
        {mode === 'forward' ? (
          <div>
            <label style={labelStyle} htmlFor="si-rate">{t({ bn: 'বার্ষিক সুদের হার (%)', en: 'Annual interest rate (%)' })}</label>
            <input id="si-rate" style={inputStyle} type="number" min="0" step="0.1" inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="10" />
          </div>
        ) : (
          <div>
            <label style={labelStyle} htmlFor="si-target">{t({ bn: 'লক্ষ্য সুদ (টাকা)', en: 'Target interest (taka)' })}</label>
            <input id="si-target" style={inputStyle} type="number" min="0" inputMode="decimal" value={targetInterest} onChange={(e) => setTargetInterest(e.target.value)} placeholder="2000" />
          </div>
        )}
        <div>
          <label style={labelStyle} htmlFor="si-years">{t({ bn: 'সময় (বছর)', en: 'Time (years)' })}</label>
          <input id="si-years" style={inputStyle} type="number" min="0" inputMode="decimal" value={years} onChange={(e) => setYears(e.target.value)} placeholder="2" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="si-months">{t({ bn: 'সময় (মাস)', en: 'Time (months)' })}</label>
          <input id="si-months" style={inputStyle} type="number" min="0" max="11" inputMode="numeric" value={months} onChange={(e) => setMonths(e.target.value)} placeholder="0" />
        </div>
      </div>
      {mode === 'forward' && simple ? (
        <>
          <div style={resultStyle} role="status">
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{t({ bn: 'সরল সুদ', en: 'Simple interest' })}</p>
            <p style={{ margin: 0, fontSize: '2rem', fontFamily: 'var(--font-head)', color: 'var(--teal-deep)' }}>{fmtMoney(simple.interest)}</p>
            <p style={{ margin: '8px 0 0', fontSize: 15 }}>{t({ bn: `মোট পাবেন: ${fmtMoney(simple.maturityAmount)}`, en: `Maturity amount: ${fmtMoney(simple.maturityAmount)}` })}</p>
            <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--muted)' }}>{t({ bn: `সূত্র: সুদ = মূলধন × হার × সময় ÷ ১০০ = ${p} × ${r}% × ${timeYears} বছর`, en: `Formula: interest = principal × rate × time ÷ 100 = ${p} × ${r}% × ${timeYears} years` })}</p>
          </div>
          <Tiles items={[
            { labelBn: 'মূলধন', labelEn: 'Principal', value: fmtMoney(p ?? 0) },
            { labelBn: 'চক্রবৃদ্ধি সুদে সুদ হতো', labelEn: 'Compound interest would be', value: compound ? fmtMoney(compound.interest) : '—' },
            { labelBn: 'চক্রবৃদ্ধিতে মোট হতো', labelEn: 'Compound maturity', value: compound ? fmtMoney(compound.maturityAmount) : '—' },
          ]} />
          <ButtonRow><CopyButton text={`Simple interest ${fmtMoney(simple.interest)}, maturity ${fmtMoney(simple.maturityAmount)}`} labelBn="ফলাফল কপি করুন" labelEn="Copy result" /></ButtonRow>
        </>
      ) : null}
      {mode === 'reverse' && reverseRate !== null ? (
        <div style={resultStyle} role="status">
          <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{t({ bn: 'দরকারি বার্ষিক হার', en: 'Annual rate needed' })}</p>
          <p style={{ margin: 0, fontSize: '2rem', fontFamily: 'var(--font-head)', color: 'var(--teal-deep)' }}>{reverseRate.toFixed(2)}%</p>
          <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--muted)' }}>{t({ bn: `সূত্র: হার = সুদ × ১০০ ÷ (মূলধন × সময়)`, en: 'Formula: rate = interest × 100 ÷ (principal × time)' })}</p>
        </div>
      ) : null}
      {(mode === 'forward' && !simple) || (mode === 'reverse' && reverseRate === null) ? (
        <p style={errorStyle} role="alert">{t({ bn: 'সঠিক মান দিন — মূলধন ও সময় ০-এর বেশি, হার ০ বা তার বেশি হতে হবে।', en: 'Enter valid values — principal and time must be above 0, rate 0 or above.' })}</p>
      ) : null}
      <p style={noteStyle}>{t({ bn: 'সরল সুদে সুদ শুধু মূলধনের ওপর ধরা হয়; চক্রবৃদ্ধিতে সুদের ওপরও সুদ ধরে, তাই একই হারে চক্রবৃদ্ধির অঙ্ক বড় হয়। মাসিক কিস্তির ডিপিএস হিসাব এখানে নয় — সেটি সঞ্চয় লক্ষ্য বা ব্যাংক ইএমআই-ডিপিএস-এফডিআর টুলে দেখুন।', en: 'Simple interest is charged on the principal only; compound interest also earns on the interest, so it grows larger at the same rate. A monthly DPS plan is not simple interest — see the savings goal or bank EMI-DPS-FDR tool.' })}</p>
    </section>
  );
}
