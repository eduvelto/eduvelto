// Eduvelto — Sehri & Iftar Time tool UI.
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Reuses the Prayer Times engine exactly (src/lib/tools/sehriIftar.ts
// -> calculatePrayerTimes): Sehri ends at Fajr, Iftar is at Maghrib.
// One calculation, no duplicate solar code. Methods and local
// mosques differ by a few minutes — the UI says so.

import { useMemo, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { getSehriIftar, fastingMinutes } from '../../lib/tools/sehriIftar';
import { BANGLADESH_CITIES, cityByKey } from '../../lib/tools/bangladeshCities';
import {
  inputStyle, labelStyle, gridStyle, cardStyle, resultStyle, headlineStyle,
  headlineLabelStyle, tileGridStyle, noteStyle, buttonRowStyle, ToolHero, CopyButton, Tile,
} from './toolUiShared';

function todayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function parseNum(raw: string): number | null {
  if (raw.trim() === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function fmtDuration(mins: number | null): string {
  if (mins === null) return '—';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

export function SehriIftarTool() {
  const { t, lang } = useLanguage();
  const [date, setDate] = useState(todayLocal);
  const [cityKey, setCityKey] = useState('dhaka');
  const [latitude, setLatitude] = useState('23.8103');
  const [longitude, setLongitude] = useState('90.4125');

  const lat = parseNum(latitude);
  const lon = parseNum(longitude);

  const result = useMemo(() => {
    if (!date || lat === null || lon === null) return null;
    const parsed = new Date(`${date}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return null;
    try {
      return getSehriIftar({ latitude: lat, longitude: lon, date: parsed, timeZone: 6 });
    } catch {
      return null;
    }
  }, [date, lat, lon]);

  function pickCity(key: string): void {
    setCityKey(key);
    const city = cityByKey(key);
    if (city) {
      setLatitude(String(city.latitude));
      setLongitude(String(city.longitude));
    }
  }

  const fastMins = result ? fastingMinutes(result) : null;

  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="sehri-title">
      <ToolHero
        titleId="sehri-title"
        titleBn="সেহরি ও ইফতারের সময়"
        titleEn="Sehri & Iftar Time"
        descBn="রমজানে সেহরি ও ইফতারের সময় দেখুন।"
        descEn="See Sehri and Iftar times during Ramadan."
        chipBn="নামাজের সময়ের হিসাবই ব্যবহৃত হয় • সেহরি = ফজর, ইফতার = মাগরিব"
        chipEn="Uses the same prayer-times calculation • Sehri = Fajr, Iftar = Maghrib"
      />
      <div style={gridStyle}>
        <div>
          <label style={labelStyle} htmlFor="sehri-date">
            {t({ bn: 'তারিখ', en: 'Date' })}
          </label>
          <input id="sehri-date" style={inputStyle} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle} htmlFor="sehri-city">
            {t({ bn: 'শহর (বাংলাদেশ)', en: 'City (Bangladesh)' })}
          </label>
          <select id="sehri-city" style={inputStyle} value={cityKey} onChange={(e) => pickCity(e.target.value)}>
            {BANGLADESH_CITIES.map((c) => (
              <option key={c.key} value={c.key}>
                {lang === 'bn' ? c.nameBn : c.nameEn}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle} htmlFor="sehri-lat">
            {t({ bn: 'অক্ষাংশ', en: 'Latitude' })}
          </label>
          <input id="sehri-lat" style={inputStyle} type="number" min="-90" max="90" step="0.0001" value={latitude} onChange={(e) => { setLatitude(e.target.value); setCityKey(''); }} />
        </div>
        <div>
          <label style={labelStyle} htmlFor="sehri-lon">
            {t({ bn: 'দ্রাঘিমাংশ', en: 'Longitude' })}
          </label>
          <input id="sehri-lon" style={inputStyle} type="number" min="-180" max="180" step="0.0001" value={longitude} onChange={(e) => { setLongitude(e.target.value); setCityKey(''); }} />
        </div>
      </div>
      {result ? (
        <div style={resultStyle} role="status">
          <p style={headlineLabelStyle}>{t({ bn: 'সেহরির শেষ সময়', en: 'Sehri ends' })}</p>
          <p style={headlineStyle}>{result.sehri ?? '—'}</p>
          <div style={tileGridStyle}>
            <Tile label={t({ bn: 'ইফতার', en: 'Iftar' })} value={result.iftar ?? '—'} />
            <Tile label={t({ bn: 'রোজার সময়', en: 'Fasting duration' })} value={fmtDuration(fastMins)} />
            <Tile label={t({ bn: 'সূর্যোদয়', en: 'Sunrise' })} value={result.sunrise ?? '—'} />
            <Tile label={t({ bn: 'ইশা', en: 'Isha' })} value={result.isha ?? '—'} />
          </div>
          <div style={buttonRowStyle}>
            <CopyButton
              text={t({
                bn: `সেহরির শেষ সময় ${result.sehri ?? '—'}, ইফতার ${result.iftar ?? '—'} (${date})।`,
                en: `Sehri ends ${result.sehri ?? '—'}, Iftar ${result.iftar ?? '—'} (${date}).`,
              })}
              labelBn="সময় কপি করুন"
              labelEn="Copy times"
            />
          </div>
          <p style={noteStyle}>
            {t({
              bn: 'পদ্ধতি: মুসলিম ওয়ার্ল্ড লীগ (ফজর ১৮°, ইশা ১৭°) — সেহরি শেষ হয় ফজরের সময়, ইফতার মাগরিবের সময়। বিভিন্ন পদ্ধতি ও স্থানীয় মসজিদের সময় কয়েক মিনিট এদিক-ওদিক হতে পারে; অনেক সময়সূচিতে সেহরির জন্য ফজরের কয়েক মিনিট আগেই সতর্কতামূলক সময় ধরা হয়। স্থানীয় মসজিদের সময় মিলিয়ে নিন।',
              en: 'Method: Muslim World League (Fajr 18°, Isha 17°) — Sehri ends at Fajr, Iftar is at Maghrib. Times may differ by a few minutes between methods and local mosques, and many timetables keep a small precautionary margin before Fajr for Sehri. Check your local mosque timetable.',
            })}
          </p>
        </div>
      ) : (
        <p style={{ marginTop: 14, color: '#b3261e', fontSize: 14 }} role="alert">
          {t({ bn: 'সঠিক তারিখ ও অবস্থান দিন।', en: 'Enter a valid date and location.' })}
        </p>
      )}
    </section>
  );
}
