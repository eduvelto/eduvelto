// Eduvelto — Percentage Change Calculator tool UI (Math batch, 27 Nov 2026).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Engine: percentageChange in src/lib/tools/mathTools.ts.
import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, Tiles, CopyButton, ButtonRow, ClearButton, ExampleButton, shortInputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { percentageChange } from '../../lib/tools/mathTools';

const resultStyle: CSSProperties = { marginTop: 14, padding: '18px 16px', borderRadius: 12, background: 'var(--teal-soft)', boxShadow: 'var(--shadow-sm)' };
const errorStyle: CSSProperties = { marginTop: 14, color: '#b3261e', fontSize: 14 };
const gridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 };

function parseNum(s: string): number | null {
  if (s.trim() === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function PercentageChangeCalculatorTool() {
  const { t } = useLanguage();
  const [oldV, setOldV] = useState('200');
  const [newV, setNewV] = useState('250');
  const o = parseNum(oldV);
  const n = parseNum(newV);
  const result = useMemo(() => (o !== null && n !== null ? percentageChange(o, n) : null), [o, n]);
  const clear = () => { setOldV(''); setNewV(''); };
  const loadExample = () => { setOldV('200'); setNewV('250'); };

  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="শতকরা পরিবর্তন ক্যালকুলেটর" titleEn="Percentage Change Calculator" descBn="দুটি মানের মধ্যে শতকরা কত বৃদ্ধি বা হ্রাস হয়েছে তা বের করুন।" descEn="Find the percentage increase or decrease between two values." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div style={gridStyle}>
        <div>
          <label style={labelStyle} htmlFor="pc-old">{t({ bn: 'আগের মান', en: 'Old value' })}</label>
          <input id="pc-old" style={shortInputStyle} type="number" step="any" inputMode="decimal" value={oldV} onChange={(e) => setOldV(e.target.value)} placeholder="200" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="pc-new">{t({ bn: 'নতুন মান', en: 'New value' })}</label>
          <input id="pc-new" style={shortInputStyle} type="number" step="any" inputMode="decimal" value={newV} onChange={(e) => setNewV(e.target.value)} placeholder="250" />
        </div>
      </div>
      {result ? (
        <>
          <div style={resultStyle} role="status">
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{t({ bn: result.direction === 'increase' ? 'শতকরা বৃদ্ধি' : result.direction === 'decrease' ? 'শতকরা হ্রাস' : 'কোনো পরিবর্তন হয়নি', en: result.direction === 'increase' ? 'Percentage increase' : result.direction === 'decrease' ? 'Percentage decrease' : 'No change' })}</p>
            <p style={{ margin: 0, fontSize: '2rem', fontFamily: 'var(--font-head)', color: 'var(--teal-deep)' }}>{result.percent}%</p>
            <p style={{ margin: '8px 0 0', fontSize: 15 }}>{t({ bn: `পরিবর্তন: ${result.change} (${oldV} থেকে ${newV})`, en: `Change: ${result.change} (from ${oldV} to ${newV})` })}</p>
          </div>
          <Tiles items={[
            { labelBn: 'পরিবর্তনের পরিমাণ', labelEn: 'Amount of change', value: `${result.change}` },
            { labelBn: 'শতকরা পরিবর্তন', labelEn: 'Percentage change', value: `${result.percent}%` },
          ]} />
          <ButtonRow><CopyButton text={`Change from ${oldV} to ${newV}: ${result.percent}% (${result.direction})`} labelBn="ফলাফল কপি করুন" labelEn="Copy result" /><ClearButton onClear={clear} /><ExampleButton onLoad={loadExample} /></ButtonRow>
        </>
      ) : (
        <p style={errorStyle} role="alert">{t({ bn: 'সঠিক সংখ্যা দিন — আগের মান ০ হতে পারবে না (০ থেকে শতকরা পরিবর্তন সংজ্ঞায়িত নয়)।', en: 'Enter valid numbers — the old value cannot be 0 (percentage change from 0 is undefined).' })}</p>
      )}
      <p style={noteStyle}>{t({ bn: 'সূত্র: শতকরা পরিবর্তন = (নতুন মান − আগের মান) ÷ আগের মান × ১০০। ফলাফল ধনাত্মক হলে বৃদ্ধি, ঋণাত্মক হলে হ্রাস।', en: 'Formula: percentage change = (new value − old value) ÷ old value × 100. A positive result is an increase, a negative one a decrease.' })}</p>
    </section>
  );
}
