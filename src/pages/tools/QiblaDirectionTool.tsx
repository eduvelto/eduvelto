// Eduvelto — Qibla Direction tool UI.
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Great-circle bearing to the Kaaba (src/lib/tools/qibla.ts) with
// Bangladesh city presets (src/lib/tools/bangladeshCities.ts). The
// compass is a GUIDE: a phone compass needs calibration and magnetic
// north is not true north — the UI says so plainly.

import { useMemo, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { calculateQibla } from '../../lib/tools/qibla';
import { BANGLADESH_CITIES, cityByKey } from '../../lib/tools/bangladeshCities';
import {
  inputStyle, labelStyle, gridStyle, cardStyle, resultStyle, headlineStyle,
  headlineLabelStyle, tileGridStyle, noteStyle, buttonRowStyle, ToolHero, CopyButton, Tile,
} from './toolUiShared';

function parseNum(raw: string): number | null {
  if (raw.trim() === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export function QiblaDirectionTool() {
  const { t, lang } = useLanguage();
  const [cityKey, setCityKey] = useState('dhaka');
  const [latitude, setLatitude] = useState('23.8103');
  const [longitude, setLongitude] = useState('90.4125');

  const lat = parseNum(latitude);
  const lon = parseNum(longitude);

  const result = useMemo(() => {
    if (lat === null || lon === null) return null;
    try {
      return calculateQibla(lat, lon);
    } catch {
      return null;
    }
  }, [lat, lon]);

  function pickCity(key: string): void {
    setCityKey(key);
    const city = cityByKey(key);
    if (city) {
      setLatitude(String(city.latitude));
      setLongitude(String(city.longitude));
    }
  }

  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="qibla-title">
      <ToolHero
        titleId="qibla-title"
        titleBn="কিবলার দিক"
        titleEn="Qibla Direction"
        descBn="আপনার অবস্থান থেকে কিবলার দিক নির্ণয় করুন।"
        descEn="Find the direction of the Qibla from your location."
        chipBn="১০০% ব্রাউজারে • কোনো আপলোড নয়"
        chipEn="100% in-browser • nothing uploaded"
      />
      <div style={gridStyle}>
        <div>
          <label style={labelStyle} htmlFor="qibla-city">
            {t({ bn: 'শহর (বাংলাদেশ)', en: 'City (Bangladesh)' })}
          </label>
          <select id="qibla-city" style={inputStyle} value={cityKey} onChange={(e) => pickCity(e.target.value)}>
            {BANGLADESH_CITIES.map((c) => (
              <option key={c.key} value={c.key}>
                {lang === 'bn' ? c.nameBn : c.nameEn}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle} htmlFor="qibla-lat">
            {t({ bn: 'অক্ষাংশ (latitude)', en: 'Latitude' })}
          </label>
          <input id="qibla-lat" style={inputStyle} type="number" min="-90" max="90" step="0.0001" inputMode="decimal" value={latitude} onChange={(e) => { setLatitude(e.target.value); setCityKey(''); }} placeholder="23.8103" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="qibla-lon">
            {t({ bn: 'দ্রাঘিমাংশ (longitude)', en: 'Longitude' })}
          </label>
          <input id="qibla-lon" style={inputStyle} type="number" min="-180" max="180" step="0.0001" inputMode="decimal" value={longitude} onChange={(e) => { setLongitude(e.target.value); setCityKey(''); }} placeholder="90.4125" />
        </div>
      </div>
      {result ? (
        <div style={resultStyle} role="status">
          <p style={headlineLabelStyle}>{t({ bn: 'কিবলার দিক (সত্যিকারের উত্তর থেকে)', en: 'Qibla direction (from true north)' })}</p>
          <p style={headlineStyle}>
            {result.bearingDegrees}° {lang === 'bn' ? result.compassPointBn : result.compassPointEn}
          </p>
          <div
            aria-hidden="true"
            style={{
              margin: '16px auto 4px',
              width: 120,
              height: 120,
              borderRadius: '50%',
              border: '2px solid var(--teal)',
              background: 'var(--card)',
              position: 'relative',
            }}
          >
            <span style={{ position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)', fontWeight: 700, color: 'var(--heading)' }}>N</span>
            <span
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: 4,
                height: 52,
                background: 'var(--teal-deep)',
                borderRadius: 2,
                transformOrigin: '50% 100%',
                transform: `translate(-50%, -100%) rotate(${result.bearingDegrees}deg)`,
              }}
            />
            <span style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', fontSize: 12, color: 'var(--muted)' }}>
              {t({ bn: 'কিবলা', en: 'Qibla' })}
            </span>
          </div>
          <div style={buttonRowStyle}>
            <CopyButton
              text={t({
                bn: `কিবলার দিক ${result.bearingDegrees}° (${result.compassPointBn}), মক্কা থেকে দূরত্ব প্রায় ${result.distanceKm} কিমি।`,
                en: `Qibla direction ${result.bearingDegrees}° (${result.compassPointEn}), about ${result.distanceKm} km from Makkah.`,
              })}
              labelBn="ফলাফল কপি করুন"
              labelEn="Copy result"
            />
          </div>
          <div style={tileGridStyle}>
            <Tile label={t({ bn: 'মক্কার দূরত্ব', en: 'Distance to Makkah' })} value={`${result.distanceKm.toLocaleString('en-IN')} km`} />
            <Tile label={t({ bn: 'কম্পাস দিক', en: 'Compass point' })} value={lang === 'bn' ? result.compassPointBn : result.compassPointEn} />
          </div>
          <p style={noteStyle}>
            {t({
              bn: 'এটি একটি নির্দেশক মাত্র — ফোনের কম্পাস ব্যবহারের আগে ক্যালিব্রেট করে নিন, আর চৌম্বক উত্তর সত্যিকারের উত্তর থেকে আলাদা হতে পারে। সন্দেহ হলে স্থানীয় মসজিদের কিবলার দিক মিলিয়ে নিন।',
              en: 'This is a guide only — calibrate your phone compass before using it, and magnetic north can differ from true north. When in doubt, check against your local mosque’s Qibla direction.',
            })}
          </p>
        </div>
      ) : (
        <p style={{ marginTop: 14, color: '#b3261e', fontSize: 14 }} role="alert">
          {t({ bn: 'সঠিক অক্ষাংশ (−৯০ থেকে ৯০) ও দ্রাঘিমাংশ (−১৮০ থেকে ১৮০) দিন।', en: 'Enter a valid latitude (−90 to 90) and longitude (−180 to 180).' })}
        </p>
      )}
    </section>
  );
}
