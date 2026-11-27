// Eduvelto — Weather tool UI (27 Nov 2026).
// Current weather + 7-day forecast via Open-Meteo (free, no key).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
import { useEffect, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, Tiles, ButtonRow, shortInputStyle, labelStyle, cardStyle, noteStyle, buttonStyle, primaryButtonStyle } from './toolUi';
import { fetchWeather, searchPlaces, weatherDescription, type GeoPlace, type WeatherData } from '../../lib/tools/weatherApi';

const DHAKA: GeoPlace = { name: 'Dhaka', country: 'Bangladesh', latitude: 23.8103, longitude: 90.4125 };

const errorStyle: CSSProperties = { marginTop: 14, color: '#b3261e', fontSize: 14 };
const resultStyle: CSSProperties = { marginTop: 14, padding: '18px 16px', borderRadius: 12, background: 'var(--teal-soft)', boxShadow: 'var(--shadow-sm)' };
const dayStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--line)', fontSize: 14 };

export function WeatherTool() {
  const { t, lang } = useLanguage();
  const [city, setCity] = useState('Dhaka');
  const [places, setPlaces] = useState<GeoPlace[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  async function load(place: GeoPlace) {
    setLoading(true);
    setError(null);
    setPlaces([]);
    const res = await fetchWeather(place);
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      setWeather(null);
      return;
    }
    setWeather(res.data);
  }

  useEffect(() => {
    void load(DHAKA);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSearch() {
    const q = city.trim();
    if (!q) {
      setError(t({ bn: 'শহরের নাম লিখুন।', en: 'Enter a city name.' }));
      return;
    }
    setLoading(true);
    setError(null);
    const res = await searchPlaces(q);
    setLoading(false);
    setSearched(true);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    if (res.places.length === 0) {
      setError(t({ bn: 'এই নামে কোনো শহর পাওয়া যায়নি — বানান দেখে আবার চেষ্টা করুন।', en: 'No city found with that name — check the spelling and try again.' }));
      setPlaces([]);
      return;
    }
    setPlaces(res.places);
  }

  const desc = weather ? weatherDescription(weather.code) : null;
  const dayName = (iso: string) => {
    try {
      return new Date(`${iso}T12:00:00`).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
    } catch {
      return iso;
    }
  };

  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="আবহাওয়া" titleEn="Weather" descBn="যেকোনো শহরের বর্তমান আবহাওয়া ও ৭ দিনের পূর্বাভাস দেখুন।" descEn="Current weather and a 7-day forecast for any city." chipBn="Open-Meteo — ফ্রি, কোনো চাবি লাগে না" chipEn="Open-Meteo — free, no key needed" />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 220px' }}>
          <label style={labelStyle} htmlFor="weather-city">{t({ bn: 'শহরের নাম', en: 'City name' })}</label>
          <input id="weather-city" style={shortInputStyle} type="text" value={city} onChange={(e) => setCity(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') void onSearch(); }} placeholder="Dhaka" />
        </div>
        <div style={{ alignSelf: 'flex-end' }}>
          <button type="button" style={primaryButtonStyle} onClick={() => void onSearch()} disabled={loading}>{t({ bn: 'খুঁজুন', en: 'Search' })}</button>
        </div>
      </div>
      {places.length > 0 ? (
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {places.map((p) => (
            <button key={`${p.name}-${p.latitude}-${p.longitude}`} type="button" style={{ ...buttonStyle, textAlign: 'left' }} onClick={() => void load(p)}>
              {p.name}{p.admin1 ? `, ${p.admin1}` : ''}{p.country ? ` — ${p.country}` : ''}
            </button>
          ))}
        </div>
      ) : null}
      {loading ? <p style={{ marginTop: 14, fontSize: 14 }}>{t({ bn: 'আবহাওয়া আনা হচ্ছে…', en: 'Loading weather…' })}</p> : null}
      {error ? <p style={errorStyle} role="alert">{error}</p> : null}
      {!loading && !error && searched && places.length === 0 && !weather ? null : null}
      {weather && !loading ? (
        <>
          <div style={resultStyle} role="status">
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>
              {weather.place.name}{weather.place.country ? `, ${weather.place.country}` : ''}
            </p>
            <p style={{ margin: 0, fontSize: '2rem', fontFamily: 'var(--font-head)', color: 'var(--teal-deep)' }}>
              {Math.round(weather.temperature)}°C
            </p>
            <p style={{ margin: '8px 0 0', fontSize: 15 }}>{t({ bn: desc?.bn ?? '', en: desc?.en ?? '' })}</p>
          </div>
          <Tiles items={[
            { labelBn: 'আর্দ্রতা', labelEn: 'Humidity', value: `${weather.humidity}%` },
            { labelBn: 'বাতাসের গতি', labelEn: 'Wind speed', value: `${weather.windSpeed} km/h` },
            { labelBn: 'আজকের সর্বোচ্চ', labelEn: "Today's high", value: weather.daily[0] ? `${Math.round(weather.daily[0].max)}°C` : '—' },
            { labelBn: 'আজকের সর্বনিম্ন', labelEn: "Today's low", value: weather.daily[0] ? `${Math.round(weather.daily[0].min)}°C` : '—' },
          ]} />
          <h3 style={{ margin: '18px 0 4px', fontSize: 16 }}>{t({ bn: '৭ দিনের পূর্বাভাস', en: '7-day forecast' })}</h3>
          <div>
            {weather.daily.map((d) => {
              const dd = weatherDescription(d.code);
              return (
                <div key={d.date} style={dayStyle}>
                  <span>{dayName(d.date)}</span>
                  <span>{t({ bn: dd.bn, en: dd.en })}</span>
                  <span>{d.precipProb !== null ? t({ bn: `বৃষ্টির সম্ভাবনা ${d.precipProb}%`, en: `Rain ${d.precipProb}%` }) : ''}</span>
                  <span style={{ fontWeight: 700 }}>{Math.round(d.max)}° / {Math.round(d.min)}°</span>
                </div>
              );
            })}
          </div>
          <ButtonRow>
            <button type="button" style={buttonStyle} onClick={() => void load(DHAKA)}>{t({ bn: 'ঢাকায় ফিরুন', en: 'Back to Dhaka' })}</button>
          </ButtonRow>
        </>
      ) : null}
      <p style={noteStyle}>{t({ bn: 'তথ্য: Open-Meteo (open-meteo.com)। ইন্টারনেট না থাকলে বা সেবা বন্ধ থাকলে আবহাওয়া দেখানো যাবে না — তখন কোনো ভুয়া তথ্য দেখানো হয় না।', en: 'Data: Open-Meteo (open-meteo.com). Without internet, or if the service is down, no weather is shown — fake weather is never displayed.' })}</p>
    </section>
  );
}
