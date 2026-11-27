// Eduvelto — Prayer Times tool UI (100-Tools Project, Phase 2, Wave 3).
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Local solar-position calculation only — no API, no network, no data
// sent anywhere. Method: Muslim World League (Fajr 18°, Isha 17°,
// Asr shadow factor 1). Methods legitimately disagree by a few minutes,
// so the UI says so honestly instead of claiming exact-minute accuracy.

import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { calculatePrayerTimes, type PrayerTimesResult } from '../../lib/tools/prayerTimes';

const inputStyle: CSSProperties = {
  width: '100%',
  minHeight: 44,
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid var(--line)',
  fontSize: 15,
  boxSizing: 'border-box',
  background: 'var(--surface)',
  color: 'var(--heading)',
};

const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--heading)',
  marginBottom: 6,
};

const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 12,
};

const cardStyle: CSSProperties = {
  marginTop: 16,
  padding: '18px 16px',
};

const resultStyle: CSSProperties = {
  marginTop: 14,
  padding: '14px 16px',
  borderRadius: 10,
  background: 'var(--teal-soft)',
};

const noteStyle: CSSProperties = {
  margin: '10px 0 0',
  fontSize: 13,
  color: 'var(--muted)',
};

const errorStyle: CSSProperties = {
  marginTop: 14,
  color: '#b3261e',
  fontSize: 14,
};

const timeRowStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  padding: '8px 0',
  borderBottom: '1px solid var(--line)',
  fontSize: 16,
};

/** Today's date as a local YYYY-MM-DD string (not UTC, so it never slips a day). */
function todayLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseNum(raw: string): number | null {
  if (raw.trim() === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

const PRAYER_ROWS: { key: keyof PrayerTimesResult; bn: string; en: string }[] = [
  { key: 'fajr', bn: 'ফজর', en: 'Fajr' },
  { key: 'sunrise', bn: 'সূর্যোদয়', en: 'Sunrise' },
  { key: 'dhuhr', bn: 'যোহর', en: 'Dhuhr' },
  { key: 'asr', bn: 'আসর', en: 'Asr' },
  { key: 'maghrib', bn: 'মাগরিব', en: 'Maghrib' },
  { key: 'isha', bn: 'ইশা', en: 'Isha' },
];

export function PrayerTimesTool() {
  const { t } = useLanguage();
  const [date, setDate] = useState(todayLocal);
  const [latitude, setLatitude] = useState('23.8103');
  const [longitude, setLongitude] = useState('90.4125');
  const [utcOffset, setUtcOffset] = useState('6');

  const lat = parseNum(latitude);
  const lon = parseNum(longitude);
  const offset = parseNum(utcOffset);

  const computed = useMemo((): { times: PrayerTimesResult | null; error: boolean } => {
    if (!date || lat === null || lon === null || offset === null) return { times: null, error: true };
    const parsed = new Date(`${date}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return { times: null, error: true };
    try {
      return {
        times: calculatePrayerTimes({
          latitude: lat,
          longitude: lon,
          date: parsed,
          timeZone: offset,
        }),
        error: false,
      };
    } catch {
      return { times: null, error: true };
    }
  }, [date, lat, lon, offset]);

  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="prayer-times-title">
      <h2 id="prayer-times-title" style={{ fontSize: 19, color: 'var(--heading)', margin: '0 0 4px' }}>
        {t({ bn: 'নামাজের সময়', en: 'Prayer times' })}
      </h2>
      <p style={{ color: 'var(--muted)', fontSize: 14, margin: '0 0 14px' }}>
        {t({
          bn: 'তারিখ ও অবস্থান দিন — সময় আপনার ডিভাইসেই হিসাব হয়, কোনো তথ্য কোথাও পাঠানো হয় না।',
          en: 'Enter a date and location — times are calculated on your device, no data is sent anywhere.',
        })}
      </p>
      <div style={gridStyle}>
        <div>
          <label style={labelStyle} htmlFor="prayer-date">
            {t({ bn: 'তারিখ', en: 'Date' })}
          </label>
          <input
            id="prayer-date"
            style={inputStyle}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="prayer-lat">
            {t({ bn: 'অক্ষাংশ (latitude)', en: 'Latitude' })}
          </label>
          <input
            id="prayer-lat"
            style={inputStyle}
            type="number"
            min="-90"
            max="90"
            step="0.0001"
            inputMode="decimal"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            placeholder="23.8103"
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="prayer-lon">
            {t({ bn: 'দ্রাঘিমাংশ (longitude)', en: 'Longitude' })}
          </label>
          <input
            id="prayer-lon"
            style={inputStyle}
            type="number"
            min="-180"
            max="180"
            step="0.0001"
            inputMode="decimal"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            placeholder="90.4125"
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="prayer-tz">
            {t({ bn: 'সময় অঞ্চল (UTC+ঘণ্টা)', en: 'Time zone (UTC+ hours)' })}
          </label>
          <input
            id="prayer-tz"
            style={inputStyle}
            type="number"
            min="-12"
            max="14"
            step="0.5"
            inputMode="decimal"
            value={utcOffset}
            onChange={(e) => setUtcOffset(e.target.value)}
            placeholder="6"
          />
        </div>
      </div>
      {computed.times ? (
        <div style={resultStyle} role="status">
          {PRAYER_ROWS.map((row) => (
            <p key={row.key} style={timeRowStyle}>
              <span>{t({ bn: row.bn, en: row.en })}</span>
              <strong>{computed.times?.[row.key] ?? '—'}</strong>
            </p>
          ))}
          <p style={noteStyle}>
            {t({
              bn: 'পদ্ধতি: মুসলিম ওয়ার্ল্ড লীগ — ফজর ১৮°, ইশা ১৭°, আসর ছায়া ১। বিভিন্ন পদ্ধতিতে সময় কয়েক মিনিট এদিক-ওদিক হতে পারে।',
              en: 'Method: Muslim World League — Fajr 18°, Isha 17°, Asr shadow factor 1. Times may differ by a few minutes between methods.',
            })}
          </p>
        </div>
      ) : (
        <p style={errorStyle} role="alert">
          {t({
            bn: 'সঠিক তারিখ ও অবস্থান দিন — অক্ষাংশ −৯০ থেকে ৯০, দ্রাঘিমাংশ −১৮০ থেকে ১৮০, সময় অঞ্চল −১২ থেকে +১৪।',
            en: 'Enter a valid date and location — latitude −90 to 90, longitude −180 to 180, time zone −12 to +14.',
          })}
        </p>
      )}
    </section>
  );
}
