// Eduvelto — Savings Goal Calculator tool UI (landed 27 Nov 2026, A-tools).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Engine: savingsGoalMonthly() + monthsToReachTarget() in src/lib/tools/financeNew.ts. 100% in-browser; nothing is uploaded.
import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import {ToolHero, Tiles, CopyButton, ButtonRow, inputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { savingsGoalMonthly, monthsToReachTarget } from '../../lib/tools/financeNew';

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


export function SavingsGoalTool() {
  const { t } = useLanguage();
  const [mode, setMode] = useState<'goal' | 'reverse'>('goal');
  const [target, setTarget] = useState('120000');
  const [months, setMonths] = useState('24');
  const [saved, setSaved] = useState('0');
  const [rate, setRate] = useState('0');
  const [monthlySave, setMonthlySave] = useState('5000');
  const targetV = parseNum(target);
  const monthsV = parseNum(months);
  const savedV = parseNum(saved) ?? 0;
  const rateV = parseNum(rate) ?? 0;
  const monthlyV = parseNum(monthlySave);

  const result = useMemo(() => {
    if (targetV === null || monthsV === null) return null;
    try {
      return savingsGoalMonthly({ target: targetV, months: Math.round(monthsV), annualRatePercent: rateV, alreadySaved: savedV });
    } catch {
      return null;
    }
  }, [targetV, monthsV, rateV, savedV]);
  const reverseMonths = mode === 'reverse' && targetV !== null && monthlyV !== null ? (() => {
    try { return monthsToReachTarget(targetV, monthlyV, rateV, savedV); } catch { return null; }
  })() : null;

  const tabStyle = (active: boolean): CSSProperties => ({
    minHeight: 40, padding: '0 14px', borderRadius: 8, border: '1px solid var(--line)',
    background: active ? 'var(--teal)' : 'var(--surface)', color: active ? '#fff' : 'var(--heading)', cursor: 'pointer', fontWeight: 600,
  });

  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="সঞ্চয় লক্ষ্য ক্যালকুলেটর" titleEn="Savings Goal Calculator" descBn="লক্ষ্য টাকায় পৌঁছাতে প্রতি মাসে কত জমাতে হবে তা হিসাব করুন।" descEn="Work out how much to save each month to reach a money goal." chipBn="সুদের হার আপনি লিখবেন — কোনো হার ধরে নেওয়া হয়নি" chipEn="You enter the return rate — none is assumed" />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <button type="button" style={tabStyle(mode === 'goal')} onClick={() => setMode('goal')}>{t({ bn: 'মাসে কত জমাব?', en: 'How much per month?' })}</button>
        <button type="button" style={tabStyle(mode === 'reverse')} onClick={() => setMode('reverse')}>{t({ bn: 'কত মাস লাগবে?', en: 'How many months?' })}</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <div>
          <label style={labelStyle} htmlFor="sg-target">{t({ bn: 'লক্ষ্য (টাকা)', en: 'Target (taka)' })}</label>
          <input id="sg-target" style={inputStyle} type="number" min="0" inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="120000" />
        </div>
        {mode === 'goal' ? (
          <div>
            <label style={labelStyle} htmlFor="sg-months">{t({ bn: 'সময় (মাস)', en: 'Time (months)' })}</label>
            <input id="sg-months" style={inputStyle} type="number" min="1" inputMode="numeric" value={months} onChange={(e) => setMonths(e.target.value)} placeholder="24" />
          </div>
        ) : (
          <div>
            <label style={labelStyle} htmlFor="sg-monthly">{t({ bn: 'মাসে জমাবেন (টাকা)', en: 'Monthly saving (taka)' })}</label>
            <input id="sg-monthly" style={inputStyle} type="number" min="0" inputMode="decimal" value={monthlySave} onChange={(e) => setMonthlySave(e.target.value)} placeholder="5000" />
          </div>
        )}
        <div>
          <label style={labelStyle} htmlFor="sg-saved">{t({ bn: 'ইতিমধ্যে জমানো (টাকা)', en: 'Already saved (taka)' })}</label>
          <input id="sg-saved" style={inputStyle} type="number" min="0" inputMode="decimal" value={saved} onChange={(e) => setSaved(e.target.value)} placeholder="0" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="sg-rate">{t({ bn: 'বার্ষিক রিটার্ন (%) — ০ মানে সুদ নেই', en: 'Annual return (%) — 0 means no interest' })}</label>
          <input id="sg-rate" style={inputStyle} type="number" min="0" step="0.1" inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="0" />
        </div>
      </div>
      {mode === 'goal' && result ? (
        result.goalAlreadyReached ? (
          <div style={resultStyle} role="status">
            <p style={{ margin: 0, fontSize: 16 }}><strong>{t({ bn: 'লক্ষ্য ইতিমধ্যে পূর্ণ হয়েছে — আর জমাতে হবে না।', en: 'Goal already reached — nothing more to save.' })}</strong></p>
          </div>
        ) : (
          <>
            <div style={resultStyle} role="status">
              <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{t({ bn: 'প্রতি মাসে জমাতে হবে', en: 'Save per month' })}</p>
              <p style={{ margin: 0, fontSize: '2rem', fontFamily: 'var(--font-head)', color: 'var(--teal-deep)' }}>{fmtMoney(result.monthlyNeeded)}</p>
              <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--muted)' }}>{t({ bn: 'মাসিক জমার অঙ্ক পরের পূর্ণ টাকায় ধরা হয়েছে — ভগ্নাংশ কম পড়লে লক্ষ্য ছুঁতে পারবেন না।', en: 'The monthly figure is rounded up to the next whole taka — a fraction short would miss the goal.' })}</p>
            </div>
            <Tiles items={[
              { labelBn: 'মোট জমা দেবেন', labelEn: 'Total you put in', value: fmtMoney(result.totalContributions) },
              { labelBn: 'সুদ/রিটার্ন থেকে', labelEn: 'Interest earned', value: fmtMoney(result.interestEarned) },
              { labelBn: 'মাস', labelEn: 'Months', value: String(monthsV) },
            ]} />
            <ButtonRow><CopyButton text={`Save ${fmtMoney(result.monthlyNeeded)} per month for ${monthsV} months to reach ${fmtMoney(targetV ?? 0)}`} labelBn="ফলাফল কপি করুন" labelEn="Copy result" /></ButtonRow>
          </>
        )
      ) : null}
      {mode === 'reverse' && reverseMonths !== null ? (
        <div style={resultStyle} role="status">
          <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{t({ bn: 'লক্ষ্যে পৌঁছাতে সময় লাগবে', en: 'Time to reach the goal' })}</p>
          <p style={{ margin: 0, fontSize: '2rem', fontFamily: 'var(--font-head)', color: 'var(--teal-deep)' }}>{reverseMonths} {t({ bn: 'মাস', en: 'months' })}</p>
        </div>
      ) : null}
      {((mode === 'goal' && !result) || (mode === 'reverse' && reverseMonths === null)) ? (
        <p style={errorStyle} role="alert">{t({ bn: 'সঠিক মান দিন — লক্ষ্য ০-এর বেশি, মাস কমপক্ষে ১ হতে হবে।', en: 'Enter valid values — target must be above 0, months at least 1.' })}</p>
      ) : null}
      <p style={noteStyle}>{t({ bn: 'হারের ঘরে কোনো ডিপিএস বা ব্যাংক হার আগে থেকে বসানো নেই — আপনার ব্যাংক বা ডিপিএসের হার জেনে নিজে লিখুন। মুদ্রাস্ফীতি এখানে ধরা হয়নি।', en: 'No DPS or bank rate is pre-filled — type the rate your bank or DPS actually offers. Inflation is not included here.' })}</p>
    </section>
  );
}
