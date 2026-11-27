// Eduvelto — Meeting Time Planner tool UI.
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Browser Intl API only (src/lib/tools/timeZones.ts): no live data,
// no network. Pick a time in one zone and see it in the others,
// with a working-hours (09:00–17:00) flag per zone.

import { useMemo, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  COMMON_TIME_ZONES, planMeetingTime, wallClockInZoneToDate,
} from '../../lib/tools/timeZones';
import {
  inputStyle, labelStyle, gridStyle, cardStyle, resultStyle, headlineStyle,
  headlineLabelStyle, tileGridStyle, noteStyle, buttonRowStyle, ToolHero, CopyButton, Tile,
} from './toolUiShared';

function todayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const PRESET_ZONES = ['Asia/Dhaka', 'Asia/Kolkata', 'Asia/Dubai', 'Europe/London', 'America/New_York'];

export function MeetingTimePlannerTool() {
  const { t, lang } = useLanguage();
  const [date, setDate] = useState(todayLocal);
  const [time, setTime] = useState('15:00');
  const [baseZone, setBaseZone] = useState('Asia/Dhaka');
  const [zones, setZones] = useState<string[]>(PRESET_ZONES);

  const instant = useMemo(
    () => wallClockInZoneToDate(date, time, baseZone),
    [date, time, baseZone],
  );
  const rows = useMemo(() => (instant ? planMeetingTime(instant, zones) : null), [instant, zones]);

  const workingCount = rows ? rows.filter((r) => r.workingHour).length : 0;

  function toggleZone(zone: string): void {
    setZones((prev) => (prev.includes(zone) ? prev.filter((z) => z !== zone) : [...prev, zone]));
  }

  function zoneName(zone: string): string {
    const found = COMMON_TIME_ZONES.find((z) => z.zone === zone);
    return found ? (lang === 'bn' ? found.nameBn : found.nameEn) : zone;
  }

  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="meeting-title">
      <ToolHero
        titleId="meeting-title"
        titleBn="মিটিং সময় পরিকল্পনা"
        titleEn="Meeting Time Planner"
        descBn="বিভিন্ন দেশের সময় অঞ্চল মিলিয়ে সবার জন্য উপযুক্ত মিটিং সময় বের করুন।"
        descEn="Find a meeting time that suits everyone across different time zones."
        chipBn="ব্রাউজারের সময় অঞ্চল হিসাব • কোনো লাইভ ডেটা নয়"
        chipEn="Browser time-zone calculation • no live data"
      />
      <div style={gridStyle}>
        <div>
          <label style={labelStyle} htmlFor="meeting-date">
            {t({ bn: 'তারিখ', en: 'Date' })}
          </label>
          <input id="meeting-date" style={inputStyle} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle} htmlFor="meeting-time">
            {t({ bn: 'সময়', en: 'Time' })}
          </label>
          <input id="meeting-time" style={inputStyle} type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle} htmlFor="meeting-base">
            {t({ bn: 'এই সময়টি কোন অঞ্চলের', en: 'This time is in' })}
          </label>
          <select id="meeting-base" style={inputStyle} value={baseZone} onChange={(e) => setBaseZone(e.target.value)}>
            {COMMON_TIME_ZONES.map((z) => (
              <option key={z.zone} value={z.zone}>
                {lang === 'bn' ? z.nameBn : z.nameEn}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div style={{ marginTop: 14 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--heading)', margin: '0 0 4px' }}>
          {t({ bn: 'কোন কোন অঞ্চলে দেখবেন', en: 'Show time in' })}
        </p>
        <div style={buttonRowStyle}>
          {COMMON_TIME_ZONES.map((z) => (
            <button
              key={z.zone}
              type="button"
              aria-pressed={zones.includes(z.zone)}
              onClick={() => toggleZone(z.zone)}
              style={{
                borderRadius: 999,
                padding: '6px 14px',
                minHeight: 36,
                border: '1px solid var(--teal)',
                background: zones.includes(z.zone) ? 'var(--teal)' : 'var(--card)',
                color: zones.includes(z.zone) ? '#ffffff' : 'var(--teal-deep)',
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              {lang === 'bn' ? z.nameBn : z.nameEn}
            </button>
          ))}
        </div>
      </div>
      {rows ? (
        <div style={resultStyle} role="status">
          <p style={headlineLabelStyle}>{t({ bn: 'কর্মঘণ্টার (সকাল ৯টা–বিকেল ৫টা) মধ্যে আছে', en: 'Inside working hours (09:00–17:00) in' })}</p>
          <p style={headlineStyle}>
            {workingCount} / {rows.length} {t({ bn: 'অঞ্চল', en: 'zones' })}
          </p>
          <div style={buttonRowStyle}>
            <CopyButton
              text={rows.map((r) => `${zoneName(r.zone)}: ${r.localTime} (${r.offsetLabel})`).join('\n')}
              labelBn="সময়গুলো কপি করুন"
              labelEn="Copy times"
            />
          </div>
          <div style={tileGridStyle}>
            {rows.map((r) => (
              <Tile
                key={r.zone}
                label={`${zoneName(r.zone)} · ${r.offsetLabel}`}
                value={r.localTime}
                sub={r.workingHour
                  ? t({ bn: 'কর্মঘণ্টার মধ্যে', en: 'Working hours' })
                  : t({ bn: 'কর্মঘণ্টার বাইরে', en: 'Outside working hours' })}
              />
            ))}
          </div>
          <p style={noteStyle}>
            {t({
              bn: 'সময় অঞ্চলের হিসাব আপনার ব্রাউজারের Intl তথ্য দিয়ে হয় — দিনের আলো সংরক্ষণ (DST) পরিবর্তনও এতে ধরা থাকে।',
              en: 'Time-zone conversion uses your browser’s Intl data, so daylight-saving (DST) changes are included.',
            })}
          </p>
        </div>
      ) : (
        <p style={{ marginTop: 14, color: '#b3261e', fontSize: 14 }} role="alert">
          {t({ bn: 'সঠিক তারিখ ও সময় দিন।', en: 'Enter a valid date and time.' })}
        </p>
      )}
    </section>
  );
}
