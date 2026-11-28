// Eduvelto — Calendar 3-in-1 tool UI (English + Bangla + Hijri).
//
// Month view: every day cell shows the Gregorian day, the Bangla date
// (Bangladesh revised 2019 calendar, via ./banglaDate) and the Hijri date
// (Kuwaiti tabular algorithm, via ./hijriDate). No network, no AI —
// everything is calculated in the browser.
import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolSection, labelStyle, noteStyle, resultStyle } from './eduToolUi';
import { banglaMonthName, gregorianToBangla } from '../../lib/tools/banglaDate';
import { gregorianToHijri, hijriMonthName } from '../../lib/tools/hijriDate';
import {
  GREGORIAN_MONTHS,
  buildMonthGrid,
  formatGregorian,
  formatThreeCalendars,
  gregorianMonthName,
  nextMonth,
  prevMonth,
  toBanglaDigits,
  weekdayName,
} from '../../lib/tools/calendar3in1';

const YEAR_MIN = 1900;
const YEAR_MAX = 2100;

const navRowStyle: CSSProperties = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
  alignItems: 'center',
  marginTop: 12,
};

const selectStyle: CSSProperties = {
  minHeight: 44,
  padding: '8px 10px',
  borderRadius: 8,
  border: '1px solid var(--line)',
  fontSize: 15,
  boxSizing: 'border-box',
  background: 'var(--surface)',
  color: 'var(--heading)',
};

const tableWrapStyle: CSSProperties = {
  marginTop: 14,
  overflowX: 'auto',
};

const tableStyle: CSSProperties = {
  width: '100%',
  minWidth: 560,
  borderCollapse: 'collapse',
  tableLayout: 'fixed',
};

const headCellStyle: CSSProperties = {
  padding: '8px 4px',
  fontSize: 13,
  fontWeight: 700,
  color: 'var(--heading)',
  borderBottom: '2px solid var(--line)',
  textAlign: 'center',
};

const cellStyle: CSSProperties = {
  verticalAlign: 'top',
  height: 64,
  padding: '6px 4px',
  border: '1px solid var(--line)',
  textAlign: 'center',
};

const todayCellStyle: CSSProperties = {
  ...cellStyle,
  background: 'var(--teal-soft)',
  outline: '2px solid var(--teal-deep)',
  outlineOffset: -2,
};

const gregDayStyle: CSSProperties = {
  fontSize: 17,
  fontWeight: 700,
  color: 'var(--heading)',
  lineHeight: 1.2,
};

const subDateStyle: CSSProperties = {
  fontSize: 11,
  lineHeight: 1.35,
  color: 'var(--muted)',
  marginTop: 2,
};

export function Calendar3In1Tool() {
  const { lang, t } = useLanguage();
  const displayLang: 'bn' | 'en' = lang === 'bn' ? 'bn' : 'en';
  const now = useMemo(() => new Date(), []);
  const todayYear = now.getFullYear();
  const todayMonth = now.getMonth() + 1;
  const todayDay = now.getDate();

  const [year, setYear] = useState(todayYear);
  const [month, setMonth] = useState(todayMonth);

  const grid = useMemo(() => buildMonthGrid(year, month), [year, month]);
  const todayThree = useMemo(
    () => formatThreeCalendars(todayYear, todayMonth, todayDay, displayLang),
    [todayYear, todayMonth, todayDay, displayLang],
  );

  function goPrev() {
    const p = prevMonth(year, month);
    setYear(p.year);
    setMonth(p.month);
  }

  function goNext() {
    const n = nextMonth(year, month);
    setYear(n.year);
    setMonth(n.month);
  }

  function goToday() {
    setYear(todayYear);
    setMonth(todayMonth);
  }

  const years: number[] = [];
  for (let y = YEAR_MIN; y <= YEAR_MAX; y++) years.push(y);

  return (
    <ToolSection
      id="calendar-3in1-title"
      titleBn="ক্যালেন্ডার ৩-ইন-১ — ইংরেজি + বাংলা + হিজরি"
      titleEn="Calendar 3-in-1 — English + Bangla + Hijri"
      descBn="একই মাসের ক্যালেন্ডারে ইংরেজি, বাংলা ও হিজরি তারিখ একসাথে দেখুন। সব হিসাব আপনার ব্রাউজারেই হয়, ইন্টারনেট লাগে না।"
      descEn="See the English, Bangla and Hijri dates together in one monthly calendar. Everything is calculated in your browser — no internet needed."
    >
      <div style={navRowStyle}>
        <button type="button" className="ev-btn ev-btn-outline" style={{ minHeight: 44 }} onClick={goPrev}
          aria-label={t({ bn: 'আগের মাস', en: 'Previous month' })}>
          {t({ bn: '‹ আগের মাস', en: '‹ Prev' })}
        </button>
        <button type="button" className="ev-btn ev-btn-outline" style={{ minHeight: 44 }} onClick={goToday}>
          {t({ bn: 'আজ', en: 'Today' })}
        </button>
        <button type="button" className="ev-btn ev-btn-outline" style={{ minHeight: 44 }} onClick={goNext}
          aria-label={t({ bn: 'পরের মাস', en: 'Next month' })}>
          {t({ bn: 'পরের মাস ›', en: 'Next ›' })}
        </button>
        <div>
          <label style={{ ...labelStyle, display: 'inline-block', margin: '0 6px 0 0' }} htmlFor="cal3-month">
            {t({ bn: 'মাস', en: 'Month' })}
          </label>
          <select id="cal3-month" style={selectStyle} value={month}
            onChange={(e) => setMonth(Number(e.target.value))}>
            {GREGORIAN_MONTHS.map((m, i) => (
              <option key={m.en} value={i + 1}>{displayLang === 'bn' ? m.bn : m.en}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ ...labelStyle, display: 'inline-block', margin: '0 6px 0 0' }} htmlFor="cal3-year">
            {t({ bn: 'বছর', en: 'Year' })}
          </label>
          <select id="cal3-year" style={selectStyle} value={year}
            onChange={(e) => setYear(Number(e.target.value))}>
            {years.map((y) => (
              <option key={y} value={y}>{displayLang === 'bn' ? toBanglaDigits(y) : y}</option>
            ))}
          </select>
        </div>
      </div>

      <h3 style={{ margin: '16px 0 0', fontSize: 20, color: 'var(--heading)', fontFamily: 'var(--font-head)' }}>
        {gregorianMonthName(month, displayLang)}{' '}
        {displayLang === 'bn' ? toBanglaDigits(year) : year}
      </h3>
      <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--muted)' }}>
        {t({
          bn: 'প্রতিটি ঘরে উপরে ইংরেজি তারিখ, নিচে বাংলা ও হিজরি তারিখ। আজকের দিনটি রঙ দিয়ে চিহ্নিত।',
          en: 'Each cell shows the English date on top, with the Bangla and Hijri dates below. Today is highlighted.',
        })}
      </p>

      <div style={tableWrapStyle}>
        <table style={tableStyle}>
          <thead>
            <tr>
              {[0, 1, 2, 3, 4, 5, 6].map((w) => (
                <th key={w} scope="col" style={headCellStyle}>
                  {weekdayName(w, displayLang)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.weeks.map((week, wi) => (
              <tr key={wi}>
                {week.map((day, di) => {
                  if (day === null) return <td key={di} style={cellStyle} />;
                  const bangla = gregorianToBangla(year, month, day);
                  const hijri = gregorianToHijri(year, month, day);
                  const isToday = year === todayYear && month === todayMonth && day === todayDay;
                  return (
                    <td key={di} style={isToday ? todayCellStyle : cellStyle}
                      aria-label={isToday
                        ? t({ bn: `আজ, ${formatGregorian(year, month, day, displayLang)}`, en: `Today, ${formatGregorian(year, month, day, displayLang)}` })
                        : undefined}>
                      <div style={gregDayStyle}>
                        {displayLang === 'bn' ? toBanglaDigits(day) : day}
                      </div>
                      <div style={subDateStyle}>
                        {bangla
                          ? `${displayLang === 'bn' ? toBanglaDigits(bangla.day) : bangla.day} ${banglaMonthName(bangla.month, displayLang)}`
                          : '—'}
                      </div>
                      <div style={subDateStyle}>
                        {`${displayLang === 'bn' ? toBanglaDigits(hijri.day) : hijri.day} ${hijriMonthName(hijri.month, displayLang)}`}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {todayThree && (
        <div style={resultStyle} role="status">
          <p style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 700, color: 'var(--heading)' }}>
            {t({ bn: 'আজকের তারিখ', en: "Today's date" })}
          </p>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--heading)', lineHeight: 1.6 }}>
            {todayThree.gregorian} • {todayThree.bangla} • {todayThree.hijri}
          </p>
        </div>
      )}

      <p style={noteStyle}>
        {t({
          bn: 'হিজরি তারিখ হিসাবভিত্তিক (ট্যাবুলার) — চাঁদ দেখার উপর নির্ভরশীল স্থানীয় তারিখ থেকে ±১ দিনের পার্থক্য হতে পারে। ধর্মীয় দিন (রমজান, ঈদ) চাঁদ দেখার ঘোষণা অনুযায়ী পালন করুন।',
          en: 'Hijri dates are tabular/approximate — they can differ by ±1 day from the locally moon-sighted date. Observe religious days (Ramadan, Eid) according to the local moon-sighting announcement.',
        })}
      </p>
      <p style={noteStyle}>
        {t({
          bn: 'বাংলা তারিখ বাংলাদেশের সংশোধিত ক্যালেন্ডার (২০১৯) অনুযায়ী — ১ বৈশাখ ১৪ এপ্রিল। পশ্চিমবঙ্গের প্রচলিত পঞ্জিকা থেকে এক দিনের পার্থক্য হতে পারে।',
          en: 'Bangla dates follow the Bangladesh revised calendar (2019) — 1 Boishakh is 14 April. They can differ by a day from the West Bengal traditional calendar.',
        })}
      </p>
    </ToolSection>
  );
}
