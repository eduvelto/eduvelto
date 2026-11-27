// Eduvelto — Julian Date Converter (Converters batch, 27 Nov 2026).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Calendar date ↔ Julian day number, both directions. 100% in-browser.
import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, Tiles, CopyButton, ButtonRow, ClearButton, ExampleButton, shortInputStyle, labelStyle, cardStyle, noteStyle, buttonStyle, activeButtonStyle } from './toolUi';
import { gregorianToJulianDay, julianDayToGregorian } from '../../lib/tools/converterTools';

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

function parseIntOrNull(s: string): number | null {
  if (s.trim() === '') return null;
  const n = Number(s);
  return Number.isInteger(n) ? n : null;
}

export function JulianDateConverterTool() {
  const { t } = useLanguage();
  const [mode, setMode] = useState<'to-jd' | 'to-date'>('to-jd');
  const [year, setYear] = useState('2000');
  const [month, setMonth] = useState('1');
  const [day, setDay] = useState('1');
  const [jd, setJd] = useState('2451545');
  const y = parseIntOrNull(year);
  const mo = parseIntOrNull(month);
  const d = parseIntOrNull(day);
  const jdNum = parseIntOrNull(jd);
  const jdResult = useMemo(
    () => (y !== null && mo !== null && d !== null ? gregorianToJulianDay(y, mo, d) : null),
    [y, mo, d],
  );
  const dateResult = useMemo(() => (jdNum !== null ? julianDayToGregorian(jdNum) : null), [jdNum]);
  const loadExample = () => {
    if (mode === 'to-jd') { setYear('2000'); setMonth('1'); setDay('1'); }
    else setJd('2451545');
  };
  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="জুলিয়ান তারিখ কনভার্টার" titleEn="Julian Date Converter" descBn="ইংরেজি তারিখ ↔ জুলিয়ান দিন সংখ্যা — দুই দিকেই বদলান।" descEn="Convert between calendar dates and Julian day numbers, both ways." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <button type="button" style={mode === 'to-jd' ? activeButtonStyle : buttonStyle} onClick={() => setMode('to-jd')}>{t({ bn: 'তারিখ → জুলিয়ান দিন', en: 'Date → Julian day' })}</button>
        <button type="button" style={mode === 'to-date' ? activeButtonStyle : buttonStyle} onClick={() => setMode('to-date')}>{t({ bn: 'জুলিয়ান দিন → তারিখ', en: 'Julian day → Date' })}</button>
      </div>
      {mode === 'to-jd' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          <div>
            <label style={labelStyle} htmlFor="jd-year">{t({ bn: 'বছর', en: 'Year' })}</label>
            <input id="jd-year" style={shortInputStyle} type="number" step="1" inputMode="numeric" value={year} onChange={(e) => setYear(e.target.value)} placeholder="2000" />
          </div>
          <div>
            <label style={labelStyle} htmlFor="jd-month">{t({ bn: 'মাস (১–১২)', en: 'Month (1–12)' })}</label>
            <input id="jd-month" style={shortInputStyle} type="number" min="1" max="12" inputMode="numeric" value={month} onChange={(e) => setMonth(e.target.value)} placeholder="1" />
          </div>
          <div>
            <label style={labelStyle} htmlFor="jd-day">{t({ bn: 'দিন (১–৩১)', en: 'Day (1–31)' })}</label>
            <input id="jd-day" style={shortInputStyle} type="number" min="1" max="31" inputMode="numeric" value={day} onChange={(e) => setDay(e.target.value)} placeholder="1" />
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          <div>
            <label style={labelStyle} htmlFor="jd-number">{t({ bn: 'জুলিয়ান দিন সংখ্যা', en: 'Julian day number' })}</label>
            <input id="jd-number" style={shortInputStyle} type="number" step="1" inputMode="numeric" value={jd} onChange={(e) => setJd(e.target.value)} placeholder="2451545" />
          </div>
        </div>
      )}
      <ButtonRow>
        <ClearButton onClear={() => { if (mode === 'to-jd') { setYear(''); setMonth(''); setDay(''); } else setJd(''); }} />
        <ExampleButton onLoad={loadExample} />
      </ButtonRow>
      {mode === 'to-jd' ? (
        jdResult !== null ? (
          <>
            <div style={resultStyle} role="status">
              <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{t({ bn: 'জুলিয়ান দিন সংখ্যা', en: 'Julian day number' })}</p>
              <p style={{ margin: 0, fontSize: '2rem', fontFamily: 'var(--font-head)', color: 'var(--teal-deep)' }}>{jdResult.toLocaleString('en-US')}</p>
              <p style={{ margin: '8px 0 0', fontSize: 15 }}>{t({ bn: `${y}-${mo}-${d} তারিখের জুলিয়ান দিন সংখ্যা`, en: `Julian day number of ${y}-${mo}-${d}` })}</p>
            </div>
            <Tiles items={[
              { labelBn: 'তারিখ', labelEn: 'Date', value: `${y}-${mo}-${d}` },
              { labelBn: 'জুলিয়ান দিন', labelEn: 'Julian day', value: String(jdResult) },
              { labelBn: '২০০০-০১-০১ =', labelEn: '2000-01-01 =', value: '2451545' },
            ]} />
            <ButtonRow><CopyButton text={`${y}-${mo}-${d} = Julian day ${jdResult}`} labelBn="ফলাফল কপি করুন" labelEn="Copy result" /></ButtonRow>
          </>
        ) : (
          <p style={errorStyle} role="alert">{t({ bn: 'সঠিক তারিখ দিন — বছর, মাস (১–১২) ও দিন (১–৩১) পূর্ণসংখ্যা হতে হবে।', en: 'Enter a valid date — year, month (1–12) and day (1–31) must be whole numbers.' })}</p>
        )
      ) : dateResult !== null ? (
        <>
          <div style={resultStyle} role="status">
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{t({ bn: 'ইংরেজি তারিখ', en: 'Calendar date' })}</p>
            <p style={{ margin: 0, fontSize: '2rem', fontFamily: 'var(--font-head)', color: 'var(--teal-deep)' }}>{dateResult.year}-{dateResult.month}-{dateResult.day}</p>
            <p style={{ margin: '8px 0 0', fontSize: 15 }}>{t({ bn: `জুলিয়ান দিন ${jdNum} এর তারিখ`, en: `Date of Julian day ${jdNum}` })}</p>
          </div>
          <ButtonRow><CopyButton text={`Julian day ${jdNum} = ${dateResult.year}-${dateResult.month}-${dateResult.day}`} labelBn="ফলাফল কপি করুন" labelEn="Copy result" /></ButtonRow>
        </>
      ) : (
        <p style={errorStyle} role="alert">{t({ bn: 'সঠিক জুলিয়ান দিন সংখ্যা দিন — পূর্ণসংখ্যা হতে হবে।', en: 'Enter a valid Julian day number — a whole number.' })}</p>
      )}
      <p style={noteStyle}>{t({ bn: 'জুলিয়ান দিন সংখ্যা হলো খ্রিস্টপূর্ব ৪৭১৩ সালের ১ জানুয়ারি দুপুর থেকে গোনা দিনের সংখ্যা — জ্যোতির্বিদ্যা ও ক্যালেন্ডার হিসাবে ব্যবহৃত হয়। এখানে পূর্ণসংখ্যার দিন সংখ্যা (দুপুরের ভিত্তি) ব্যবহার করা হয়েছে; জ্যোতির্বিদ্যার ভগ্নাংশসহ JD (যেমন ২৪৫১৫৪৫.০) একই দিন বোঝায়।', en: 'The Julian day number counts days since noon on 1 January 4713 BC — used in astronomy and calendar math. Whole day numbers (noon basis) are used here; the astronomical JD with a fraction (e.g. 2451545.0) means the same day.' })}</p>
    </section>
  );
}
