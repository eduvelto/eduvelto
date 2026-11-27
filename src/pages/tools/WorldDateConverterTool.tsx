// Eduvelto — World Date Converter tool UI.
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Browser Intl API only (src/lib/tools/timeZones.ts): no live data,
// no network. Convert a date + time from one zone to another, with
// a "Load example" (15:00 Dhaka) button.

import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { COMMON_TIME_ZONES, convertBetweenZones, formatInZone } from '../../lib/tools/timeZones';
import {
  inputStyle, labelStyle, gridStyle, cardStyle, resultStyle, headlineStyle,
  headlineLabelStyle, tileGridStyle, noteStyle, buttonRowStyle, ToolHero, CopyButton, Tile,
} from './toolUiShared';

function todayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function WorldDateConverterTool() {
  const { t, lang } = useLanguage();
  const [date, setDate] = useState(todayLocal);
  const [time, setTime] = useState('15:00');
  const [fromZone, setFromZone] = useState('Asia/Dhaka');
  const [toZone, setToZone] = useState('Europe/London');
  // Live "current time in each zone" line (A-tools, landed 27 Nov 2026):
  // ticks once a second so the two zones can be compared right now.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const result = useMemo(
    () => convertBetweenZones(date, time, fromZone, toZone),
    [date, time, fromZone, toZone],
  );

  function zoneName(zone: string): string {
    const found = COMMON_TIME_ZONES.find((z) => z.zone === zone);
    return found ? (lang === 'bn' ? found.nameBn : found.nameEn) : zone;
  }

  function loadExample(): void {
    setDate(todayLocal());
    setTime('15:00');
    setFromZone('Asia/Dhaka');
    setToZone('Europe/London');
  }

  function swap(): void {
    setFromZone(toZone);
    setToZone(fromZone);
  }

  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="world-date-title">
      <ToolHero
        titleId="world-date-title"
        titleBn="বিশ্ব তারিখ কনভার্টার"
        titleEn="World Date Converter"
        descBn="এক দেশের তারিখ ও সময় অন্য দেশের সময় অঞ্চলে রূপান্তর করুন।"
        descEn="Convert a date and time from one time zone to another."
        chipBn="ব্রাউজারের সময় অঞ্চল হিসাব • কোনো লাইভ ডেটা নয়"
        chipEn="Browser time-zone calculation • no live data"
      />
      <div style={gridStyle}>
        <div>
          <label style={labelStyle} htmlFor="world-date">
            {t({ bn: 'তারিখ', en: 'Date' })}
          </label>
          <input id="world-date" style={inputStyle} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle} htmlFor="world-time">
            {t({ bn: 'সময়', en: 'Time' })}
          </label>
          <input id="world-time" style={inputStyle} type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle} htmlFor="world-from">
            {t({ bn: 'কোন অঞ্চল থেকে', en: 'From time zone' })}
          </label>
          <select id="world-from" style={inputStyle} value={fromZone} onChange={(e) => setFromZone(e.target.value)}>
            {COMMON_TIME_ZONES.map((z) => (
              <option key={z.zone} value={z.zone}>
                {lang === 'bn' ? z.nameBn : z.nameEn}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle} htmlFor="world-to">
            {t({ bn: 'কোন অঞ্চলে', en: 'To time zone' })}
          </label>
          <select id="world-to" style={inputStyle} value={toZone} onChange={(e) => setToZone(e.target.value)}>
            {COMMON_TIME_ZONES.map((z) => (
              <option key={z.zone} value={z.zone}>
                {lang === 'bn' ? z.nameBn : z.nameEn}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div style={buttonRowStyle}>
        <button type="button" className="ev-btn-outline" onClick={loadExample}>
          {t({ bn: 'উদাহরণ বসান (ঢাকা ১৫:০০)', en: 'Load example (Dhaka 15:00)' })}
        </button>
        <button type="button" className="ev-btn-outline" onClick={swap}>
          {t({ bn: 'অঞ্চল বদলান', en: 'Swap zones' })}
        </button>
      </div>
      {result ? (
        <div style={resultStyle} role="status">
          <p style={headlineLabelStyle}>{t({ bn: `${zoneName(toZone)}-এ সময়`, en: `Time in ${zoneName(toZone)}` })}</p>
          <p style={headlineStyle}>{result.toLocal}</p>
          <div style={buttonRowStyle}>
            <CopyButton
              text={t({
                bn: `${zoneName(fromZone)}-এ ${result.fromLocal} = ${zoneName(toZone)}-এ ${result.toLocal}।`,
                en: `${result.fromLocal} in ${zoneName(fromZone)} = ${result.toLocal} in ${zoneName(toZone)}.`,
              })}
              labelBn="ফলাফল কপি করুন"
              labelEn="Copy result"
            />
          </div>
          <div style={tileGridStyle}>
            <Tile label={t({ bn: 'মূল সময়', en: 'Original time' })} value={result.fromLocal} sub={zoneName(fromZone)} />
            <Tile label={t({ bn: 'রূপান্তরিত সময়', en: 'Converted time' })} value={result.toLocal} sub={zoneName(toZone)} />
          </div>
          <p style={noteStyle}>
            {t({
              bn: 'সময় অঞ্চলের হিসাব আপনার ব্রাউজারের Intl তথ্য দিয়ে হয় — দিনের আলো সংরক্ষণ (DST) পরিবর্তনও এতে ধরা থাকে। তারিখ বদলে গেলে (যেমন রাতের সময়) রূপান্তরিত তারিখটিই দেখানো হয়।',
              en: 'Time-zone conversion uses your browser’s Intl data, so daylight-saving (DST) changes are included. When the conversion crosses midnight, the converted date is shown.',
            })}
          </p>
        </div>
      ) : (
        <p style={{ marginTop: 14, color: '#b3261e', fontSize: 14 }} role="alert">
          {t({ bn: 'সঠিক তারিখ ও সময় দিন।', en: 'Enter a valid date and time.' })}
        </p>
      )}
      <p style={noteStyle}>
        {t({
          bn: `এখন: ${zoneName(fromZone)}-এ ${formatInZone(now, fromZone, lang)} • ${zoneName(toZone)}-এ ${formatInZone(now, toZone, lang)}।`,
          en: `Now: ${formatInZone(now, fromZone, lang)} in ${zoneName(fromZone)} • ${formatInZone(now, toZone, lang)} in ${zoneName(toZone)}.`,
        })}
      </p>
    </section>
  );
}
