// Eduvelto — Date Difference Calculator tool UI (landed 27 Nov 2026, A-tools).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Engine: dateDifference() + addDays() in src/lib/tools/dateTimeTools.ts (BD weekend Fri–Sat by default). 100% in-browser; nothing is uploaded.
import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import {ToolHero, Tiles, CopyButton, ButtonRow, inputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { dateDifference, addDays, BD_WEEKEND_DAYS } from '../../lib/tools/dateTimeTools';

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



export function DateDifferenceTool() {
  const { t } = useLanguage();
  const [from, setFrom] = useState('2026-11-25');
  const [to, setTo] = useState('2026-11-29');
  const [weekend, setWeekend] = useState<'bd' | 'intl'>('bd');
  const [includeEnd, setIncludeEnd] = useState(false);
  const [holidays, setHolidays] = useState('0');
  const [revStart, setRevStart] = useState('2026-11-25');
  const [revDays, setRevDays] = useState('30');

  const diff = useMemo(() => {
    try {
      const weekendDays = weekend === 'bd' ? BD_WEEKEND_DAYS : [0, 6];
      return dateDifference(from, to, weekendDays);
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'Invalid dates' };
    }
  }, [from, to, weekend]);
  const holidaysV = parseNum(holidays) ?? 0;
  const revEnd = useMemo(() => {
    const n = parseNum(revDays);
    if (n === null) return null;
    try { return addDays(revStart, Math.round(n)); } catch { return null; }
  }, [revStart, revDays]);
  const adjDays = 'days' in diff ? diff.days + (includeEnd ? 1 : 0) - holidaysV : null;

  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="তারিখের পার্থক্য ক্যালকুলেটর" titleEn="Date Difference Calculator" descBn="দুটি তারিখের মধ্যে কত দিন, সপ্তাহ ও কর্মদিবস — সেটি বের করুন।" descEn="Find the days, weeks and working days between two dates." chipBn="বাংলাদেশের সাপ্তাহিক ছুটি: শুক্র–শনি" chipEn="Bangladesh weekend: Friday–Saturday" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <div>
          <label style={labelStyle} htmlFor="dd-from">{t({ bn: 'শুরুর তারিখ', en: 'Start date' })}</label>
          <input id="dd-from" style={inputStyle} type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle} htmlFor="dd-to">{t({ bn: 'শেষের তারিখ', en: 'End date' })}</label>
          <input id="dd-to" style={inputStyle} type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle} htmlFor="dd-weekend">{t({ bn: 'সাপ্তাহিক ছুটি', en: 'Weekend' })}</label>
          <select id="dd-weekend" style={inputStyle} value={weekend} onChange={(e) => setWeekend(e.target.value as 'bd' | 'intl')}>
            <option value="bd">{t({ bn: 'শুক্র–শনি (বাংলাদেশ)', en: 'Fri–Sat (Bangladesh)' })}</option>
            <option value="intl">{t({ bn: 'শনি–রবি', en: 'Sat–Sun' })}</option>
          </select>
        </div>
        <div>
          <label style={labelStyle} htmlFor="dd-holidays">{t({ bn: 'বাদ দিতে চান এমন সরকারি ছুটির দিন', en: 'Public holidays to subtract' })}</label>
          <input id="dd-holidays" style={inputStyle} type="number" min="0" inputMode="numeric" value={holidays} onChange={(e) => setHolidays(e.target.value)} placeholder="0" />
        </div>
      </div>
      <div style={{ marginTop: 12, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 15 }}>
          <input type="checkbox" checked={includeEnd} onChange={(e) => setIncludeEnd(e.target.checked)} />
          {t({ bn: 'শেষের দিনটিও গুনুন', en: 'Include the end date' })}
        </label>
      </div>
      {'error' in diff ? (
        <p style={errorStyle} role="alert">{diff.error}</p>
      ) : (
        <>
          <div style={resultStyle} role="status">
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{t({ bn: 'দিনের পার্থক্য', en: 'Difference in days' })}</p>
            <p style={{ margin: 0, fontSize: '2rem', fontFamily: 'var(--font-head)', color: 'var(--teal-deep)' }}>{diff.days} {t({ bn: 'দিন', en: 'days' })}</p>
            <p style={{ margin: '8px 0 0', fontSize: 15 }}>{t({ bn: `ক্যালেন্ডার হিসাব: ${diff.calendar.years} বছর ${diff.calendar.months} মাস ${diff.calendar.days} দিন`, en: `Calendar breakdown: ${diff.calendar.years}y ${diff.calendar.months}m ${diff.calendar.days}d` })}</p>
            {diff.days < 0 ? <p style={{ margin: '4px 0 0', fontSize: 14, color: '#b3261e' }}>{t({ bn: 'শেষের তারিখ শুরুর আগে — মানটি ঋণাত্মক দেখানো হচ্ছে।', en: 'The end date is before the start — the value is shown as negative.' })}</p> : null}
          </div>
          <Tiles items={[
            { labelBn: 'সপ্তাহ', labelEn: 'Weeks', value: String(diff.weeks) },
            { labelBn: 'কর্মদিবস', labelEn: 'Working days', value: String(diff.workingDays) },
            { labelBn: 'ছুটির দিন', labelEn: 'Weekend days', value: String(diff.weekends) },
            { labelBn: 'ঘণ্টা', labelEn: 'Hours', value: String(diff.hours) },
            { labelBn: 'ছুটি বাদে দিন', labelEn: 'Days after holidays', value: adjDays === null ? '—' : String(adjDays) },
          ]} />
          <ButtonRow><CopyButton text={`${diff.days} days (${diff.calendar.years}y ${diff.calendar.months}m ${diff.calendar.days}d), ${diff.workingDays} working days`} labelBn="ফলাফল কপি করুন" labelEn="Copy result" /></ButtonRow>
        </>
      )}
      <div style={{ marginTop: 18 }}>
        <p style={{ fontSize: 15, fontWeight: 700, margin: '0 0 8px' }}>{t({ bn: 'উল্টো হিসাব — শুরুর তারিখ + দিন', en: 'Reverse — start date + days' })}</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          <div>
            <label style={labelStyle} htmlFor="dd-rev-start">{t({ bn: 'শুরুর তারিখ', en: 'Start date' })}</label>
            <input id="dd-rev-start" style={inputStyle} type="date" value={revStart} onChange={(e) => setRevStart(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle} htmlFor="dd-rev-days">{t({ bn: 'দিন যোগ করুন', en: 'Add days' })}</label>
            <input id="dd-rev-days" style={inputStyle} type="number" inputMode="numeric" value={revDays} onChange={(e) => setRevDays(e.target.value)} placeholder="30" />
          </div>
        </div>
        {revEnd ? <p style={{ marginTop: 10, fontSize: 16 }}><strong>{t({ bn: 'শেষের তারিখ: ', en: 'End date: ' })}{revEnd}</strong></p> : null}
      </div>
      <p style={noteStyle}>{t({ bn: 'ডিফল্ট হিসাবে শেষের দিনটি গোনা হয় না (৩০ দিন মানে ১ নভেম্বর → ১ ডিসেম্বর)। সরকারি ছুটির তালিকা এখানে নেই — ছুটির দিন নিজে সংখ্যায় লিখে বাদ দিন।', en: 'By default the end date is not counted (30 days means 1 Nov → 1 Dec). There is no public-holiday list here — subtract holidays by typing the number yourself.' })}</p>
    </section>
  );
}
