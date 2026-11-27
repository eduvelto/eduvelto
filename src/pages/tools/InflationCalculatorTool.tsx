// Eduvelto — Inflation Calculator tool UI.
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Engine: calculateInflation() in src/lib/tools/financeHealthTools.ts. 100% in-browser.
import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, Tiles, CopyButton, ButtonRow, ClearButton, ExampleButton, shortInputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { calculateInflation } from '../../lib/tools/financeHealthTools';

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

export function InflationCalculatorTool() {
  const { t } = useLanguage();
  const [direction, setDirection] = useState<'future' | 'past'>('future');
  const [amount, setAmount] = useState('10000');
  const [rate, setRate] = useState('6');
  const [years, setYears] = useState('5');
  const a = parseNum(amount);
  const r = parseNum(rate);
  const y = parseNum(years);
  const result = useMemo(
    () => (a !== null && r !== null && y !== null ? calculateInflation(a, r, y, direction) : null),
    [a, r, y, direction],
  );
  const loadExample = () => { setDirection('future'); setAmount('10000'); setRate('6'); setYears('5'); };
  const clear = () => { setAmount(''); setRate(''); setYears(''); };

  const tabStyle = (active: boolean): CSSProperties => ({
    minHeight: 40, padding: '0 14px', borderRadius: 8, border: '1px solid var(--line)',
    background: active ? 'var(--teal)' : 'var(--surface)', color: active ? '#fff' : 'var(--heading)', cursor: 'pointer', fontWeight: 600,
  });

  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="মুদ্রাস্ফীতি ক্যালকুলেটর" titleEn="Inflation Calculator" descBn="মুদ্রাস্ফীতির পর টাকার মূল্য ভবিষ্যতে কত হবে বা অতীতে কত ছিল তা দেখুন।" descEn="See what money will be worth in the future — or was worth in the past — after inflation." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <button type="button" style={tabStyle(direction === 'future')} onClick={() => setDirection('future')}>{t({ bn: 'ভবিষ্যতের মূল্য', en: 'Future value' })}</button>
        <button type="button" style={tabStyle(direction === 'past')} onClick={() => setDirection('past')}>{t({ bn: 'অতীতের মূল্য', en: 'Past value' })}</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <div>
          <label style={labelStyle} htmlFor="inf-amount">{t({ bn: 'টাকার পরিমাণ', en: 'Amount (taka)' })}</label>
          <input id="inf-amount" style={shortInputStyle} type="number" min="0" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="10000" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="inf-rate">{t({ bn: 'মুদ্রাস্ফীতির হার (%) — আপনি নিজে দিন', en: 'Inflation rate (%) — enter it yourself' })}</label>
          <input id="inf-rate" style={shortInputStyle} type="number" min="0" max="100" step="0.1" inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="6" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="inf-years">{t({ bn: 'বছর', en: 'Years' })}</label>
          <input id="inf-years" style={shortInputStyle} type="number" min="0" step="0.5" inputMode="decimal" value={years} onChange={(e) => setYears(e.target.value)} placeholder="5" />
        </div>
      </div>
      {result ? (
        <>
          <div style={resultStyle} role="status">
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{t({ bn: direction === 'future' ? 'ভবিষ্যতে মূল্য হবে' : 'অতীতে মূল্য ছিল', en: direction === 'future' ? 'Value in the future' : 'Value in the past' })}</p>
            <p style={{ margin: 0, fontSize: '2rem', fontFamily: 'var(--font-head)', color: 'var(--teal-deep)' }}>{fmtMoney(result.result)}</p>
            <p style={{ margin: '8px 0 0', fontSize: 15 }}>{t({ bn: `পরিবর্তন: ${result.changePercent > 0 ? '+' : ''}${result.changePercent.toFixed(2)}%`, en: `Change: ${result.changePercent > 0 ? '+' : ''}${result.changePercent.toFixed(2)}%` })}</p>
          </div>
          <Tiles items={[
            { labelBn: 'আজকের টাকা', labelEn: 'Amount today', value: fmtMoney(a ?? 0) },
            { labelBn: 'হার', labelEn: 'Rate', value: `${r ?? 0}%` },
            { labelBn: 'বছর', labelEn: 'Years', value: String(y ?? 0) },
          ]} />
          <ButtonRow>
            <CopyButton text={`Inflation: ${fmtMoney(a ?? 0)} becomes ${fmtMoney(result.result)} in ${y ?? 0} years at ${r ?? 0}%`} labelBn="ফলাফল কপি করুন" labelEn="Copy result" />
            <ExampleButton onLoad={loadExample} />
            <ClearButton onClear={clear} />
          </ButtonRow>
        </>
      ) : (
        <p style={errorStyle} role="alert">{t({ bn: 'সঠিক মান দিন — টাকা ০ বা তার বেশি, হার ০ থেকে ১০০-এর মধ্যে, বছর ০ বা তার বেশি হতে হবে।', en: 'Enter valid values — amount 0 or above, rate 0–100, years 0 or above.' })}</p>
      )}
      <p style={noteStyle}>{t({ bn: 'মুদ্রাস্ফীতির হারটি আপনি নিজে দেবেন — এটি কোনো লাইভ বা সরকারি হার নয়, এবং ভবিষ্যতের হার একই থাকবে এমন কোনো নিশ্চয়তা নেই।', en: 'You enter the inflation rate yourself — it is not a live or official rate, and there is no guarantee the future rate will stay the same.' })}</p>
    </section>
  );
}
