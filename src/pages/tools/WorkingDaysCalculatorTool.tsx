// Eduvelto — Working Days Calculator tool UI.
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Engine: calculateWorkingDays() in src/lib/tools/financeHealthTools.ts. 100% in-browser.
import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, Tiles, CopyButton, ButtonRow, ClearButton, ExampleButton, shortInputStyle, inputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { calculateWorkingDays, type WeekendOption } from '../../lib/tools/financeHealthTools';

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

export function WorkingDaysCalculatorTool() {
  const { t } = useLanguage();
  const [start, setStart] = useState('2026-11-01');
  const [end, setEnd] = useState('2026-11-30');
  const [weekend, setWeekend] = useState<WeekendOption>('fri-sat');
  const [holidays, setHolidays] = useState('');
  const holidayList = useMemo(() => holidays.split(/[,\n]/).map((d) => d.trim()).filter(Boolean), [holidays]);
  const result = useMemo(() => calculateWorkingDays(start, end, weekend, holidayList), [start, end, weekend, holidayList]);
  const loadExample = () => { setStart('2026-11-01'); setEnd('2026-11-30'); setWeekend('fri-sat'); setHolidays(''); };
  const clear = () => { setStart(''); setEnd(''); setHolidays(''); };

  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="কর্মদিবস ক্যালকুলেটর" titleEn="Working Days Calculator" descBn="দুটি তারিখের মধ্যে ছুটির দিন বাদ দিয়ে কত কর্মদিবস আছে তা গুনুন।" descEn="Count the working days between two dates, excluding weekends and holidays." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <div>
          <label style={labelStyle} htmlFor="wd-start">{t({ bn: 'শুরুর তারিখ', en: 'Start date' })}</label>
          <input id="wd-start" style={shortInputStyle} type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle} htmlFor="wd-end">{t({ bn: 'শেষের তারিখ', en: 'End date' })}</label>
          <input id="wd-end" style={shortInputStyle} type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle} htmlFor="wd-weekend">{t({ bn: 'সাপ্তাহিক ছুটি', en: 'Weekly weekend' })}</label>
          <select id="wd-weekend" style={shortInputStyle} value={weekend} onChange={(e) => setWeekend(e.target.value as WeekendOption)}>
            <option value="fri-sat">{t({ bn: 'শুক্র–শনি (বাংলাদেশ)', en: 'Friday–Saturday (Bangladesh)' })}</option>
            <option value="sat-sun">{t({ bn: 'শনি–রবি', en: 'Saturday–Sunday' })}</option>
          </select>
        </div>
      </div>
      <div style={{ marginTop: 12 }}>
        <label style={labelStyle} htmlFor="wd-holidays">{t({ bn: 'ছুটির তারিখ (ঐচ্ছিক) — কমা বা নতুন লাইনে আলাদা করুন', en: 'Holiday dates (optional) — separate with commas or new lines' })}</label>
        <textarea id="wd-holidays" style={inputStyle} value={holidays} onChange={(e) => setHolidays(e.target.value)} placeholder="2026-11-15, 2026-11-20" />
      </div>
      {result ? (
        <>
          <div style={resultStyle} role="status">
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{t({ bn: 'কর্মদিবস', en: 'Working days' })}</p>
            <p style={{ margin: 0, fontSize: '2rem', fontFamily: 'var(--font-head)', color: 'var(--teal-deep)' }}>{result.workingDays}</p>
            <p style={{ margin: '8px 0 0', fontSize: 15 }}>{t({ bn: `মোট দিন: ${result.totalDays}`, en: `Total days: ${result.totalDays}` })}</p>
          </div>
          <Tiles items={[
            { labelBn: 'মোট দিন', labelEn: 'Total days', value: String(result.totalDays) },
            { labelBn: 'সাপ্তাহিক ছুটি', labelEn: 'Weekend days', value: String(result.weekendDays) },
            { labelBn: 'ছুটির দিন', labelEn: 'Holidays', value: String(result.holidayDays) },
          ]} />
          <ButtonRow>
            <CopyButton text={`Working days: ${result.workingDays} (total ${result.totalDays}, weekends ${result.weekendDays}, holidays ${result.holidayDays})`} labelBn="ফলাফল কপি করুন" labelEn="Copy result" />
            <ExampleButton onLoad={loadExample} />
            <ClearButton onClear={clear} />
          </ButtonRow>
        </>
      ) : (
        <p style={errorStyle} role="alert">{t({ bn: 'সঠিক তারিখ দিন — শেষের তারিখ শুরুর তারিখের আগে হতে পারবে না।', en: 'Enter valid dates — the end date cannot be before the start date.' })}</p>
      )}
      <p style={noteStyle}>{t({ bn: 'শুরু ও শেষ — দুটি তারিখই গণনায় ধরা হয়। ছুটির দিন সাপ্তাহিক ছুটির সঙ্গে মিলে গেলে সেটি সাপ্তাহিক ছুটি হিসেবেই গোনা হয়। সরকারি ছুটির তালিকা এখানে দেওয়া নেই — আপনার ছুটির তারিখগুলো নিজে লিখুন।', en: 'Both the start and end dates are counted. A holiday that falls on a weekend is counted as a weekend day. No official holiday list is built in — enter your own holiday dates.' })}</p>
    </section>
  );
}
