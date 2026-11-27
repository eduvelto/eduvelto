// Eduvelto — Week Number Calculator (Converters batch, 27 Nov 2026).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// ISO 8601 week number (Monday start, week 1 holds the first Thursday).
// 100% in-browser; nothing is uploaded.
import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, Tiles, CopyButton, ButtonRow, ClearButton, ExampleButton, shortInputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { isoWeekNumber } from '../../lib/tools/converterTools';

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

export function WeekNumberCalculatorTool() {
  const { t } = useLanguage();
  const today = new Date();
  const defaultDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const [date, setDate] = useState(defaultDate);
  const parsed = useMemo(() => {
    const parts = date.split('-').map((p) => Number(p));
    if (parts.length !== 3 || parts.some((p) => !Number.isInteger(p))) return null;
    return { y: parts[0], m: parts[1], d: parts[2] };
  }, [date]);
  const week = useMemo(() => (parsed ? isoWeekNumber(parsed.y, parsed.m, parsed.d) : null), [parsed]);
  const weekday = parsed ? new Date(parsed.y, parsed.m - 1, parsed.d).toLocaleDateString('en-US', { weekday: 'long' }) : null;
  const loadExample = () => setDate('2026-01-01');
  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="সপ্তাহ নম্বর ক্যালকুলেটর" titleEn="Week Number Calculator" descBn="যেকোনো তারিখ বছরের কত নম্বর সপ্তাহে পড়ে (ISO সপ্তাহ) তা বের করুন।" descEn="Find which ISO week of the year any date falls in." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <div>
          <label style={labelStyle} htmlFor="week-date">{t({ bn: 'তারিখ', en: 'Date' })}</label>
          <input id="week-date" style={shortInputStyle} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>
      <ButtonRow>
        <ClearButton onClear={() => setDate('')} />
        <ExampleButton onLoad={loadExample} />
      </ButtonRow>
      {week ? (
        <>
          <div style={resultStyle} role="status">
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{t({ bn: 'ISO সপ্তাহ', en: 'ISO week' })}</p>
            <p style={{ margin: 0, fontSize: '2rem', fontFamily: 'var(--font-head)', color: 'var(--teal-deep)' }}>{t({ bn: `${week.isoYear} সালের ${week.week} নম্বর সপ্তাহ`, en: `Week ${week.week} of ${week.isoYear}` })}</p>
            <p style={{ margin: '8px 0 0', fontSize: 15 }}>{t({ bn: `${date} — ${weekday ?? ''}`, en: `${date} — ${weekday ?? ''}` })}</p>
          </div>
          <Tiles items={[
            { labelBn: 'সপ্তাহ নম্বর', labelEn: 'Week number', value: String(week.week) },
            { labelBn: 'ISO বছর', labelEn: 'ISO year', value: String(week.isoYear) },
            { labelBn: 'বার', labelEn: 'Weekday', value: weekday ?? '—' },
          ]} />
          <ButtonRow><CopyButton text={`${date} is ISO week ${week.week} of ${week.isoYear}`} labelBn="ফলাফল কপি করুন" labelEn="Copy result" /></ButtonRow>
        </>
      ) : (
        <p style={errorStyle} role="alert">{t({ bn: 'সঠিক তারিখ দিন।', en: 'Enter a valid date.' })}</p>
      )}
      <p style={noteStyle}>{t({ bn: 'ISO সপ্তাহ সোমবার থেকে শুরু হয়; বছরের ১ নম্বর সপ্তাহ সেটিই যেখানে বছরের প্রথম বৃহস্পতিবার পড়ে। তাই জানুয়ারির প্রথম কয়েক দিন আগের বছরের ৫২/৫৩ নম্বর সপ্তাহে, আর ডিসেম্বরের শেষ কয়েক দিন পরের বছরের ১ নম্বর সপ্তাহে পড়তে পারে।', en: 'ISO weeks start on Monday; week 1 is the week containing the year’s first Thursday. So the first days of January can belong to week 52/53 of the previous year, and the last days of December to week 1 of the next.' })}</p>
    </section>
  );
}
