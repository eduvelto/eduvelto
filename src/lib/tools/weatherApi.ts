// Eduvelto — Open-Meteo weather API client (27 Nov 2026).
// FREE, no key: geocoding + forecast APIs. Thin fetch wrappers that
// return a typed result or a clear error string — never throw.

export interface GeoPlace {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  admin1?: string;
}

export interface DailyForecast {
  date: string;
  code: number;
  max: number;
  min: number;
  precipProb: number | null;
}

export interface WeatherData {
  place: GeoPlace;
  temperature: number;
  humidity: number;
  code: number;
  windSpeed: number;
  daily: DailyForecast[];
}

export type WeatherResult = { ok: true; data: WeatherData } | { ok: false; error: string };

const GEO_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

export type SearchPlacesResult = { ok: true; places: GeoPlace[] } | { ok: false; error: string };

export async function searchPlaces(query: string): Promise<SearchPlacesResult> {
  try {
    const res = await fetch(`${GEO_URL}?name=${encodeURIComponent(query)}&count=6&language=en&format=json`);
    if (!res.ok) return { ok: false, error: `Geocoding service returned ${res.status}.` };
    const json = (await res.json()) as { results?: Array<{ name: string; country?: string; latitude: number; longitude: number; admin1?: string }> };
    const places: GeoPlace[] = (json.results ?? []).map((r) => ({
      name: r.name,
      country: r.country ?? '',
      latitude: r.latitude,
      longitude: r.longitude,
      admin1: r.admin1,
    }));
    return { ok: true, places };
  } catch {
    return { ok: false, error: 'Network error — check your internet connection and try again.' };
  }
}

export async function fetchWeather(place: GeoPlace): Promise<WeatherResult> {
  try {
    const params = new URLSearchParams({
      latitude: String(place.latitude),
      longitude: String(place.longitude),
      current: 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
      timezone: 'auto',
      forecast_days: '7',
    });
    const res = await fetch(`${FORECAST_URL}?${params.toString()}`);
    if (!res.ok) return { ok: false, error: `Weather service returned ${res.status}.` };
    const json = (await res.json()) as {
      current?: { temperature_2m: number; relative_humidity_2m: number; weather_code: number; wind_speed_10m: number };
      daily?: { time: string[]; weather_code: number[]; temperature_2m_max: number[]; temperature_2m_min: number[]; precipitation_probability_max: (number | null)[] };
    };
    if (!json.current || !json.daily) return { ok: false, error: 'Weather service returned an unexpected response.' };
    const daily: DailyForecast[] = json.daily.time.map((date, i) => ({
      date,
      code: json.daily!.weather_code[i],
      max: json.daily!.temperature_2m_max[i],
      min: json.daily!.temperature_2m_min[i],
      precipProb: json.daily!.precipitation_probability_max[i] ?? null,
    }));
    return {
      ok: true,
      data: {
        place,
        temperature: json.current.temperature_2m,
        humidity: json.current.relative_humidity_2m,
        code: json.current.weather_code,
        windSpeed: json.current.wind_speed_10m,
        daily,
      },
    };
  } catch {
    return { ok: false, error: 'Network error — check your internet connection and try again.' };
  }
}

/** WMO weather-code → short English/Bangla description. */
export function weatherDescription(code: number): { en: string; bn: string } {
  if (code === 0) return { en: 'Clear sky', bn: 'পরিষ্কার আকাশ' };
  if (code === 1) return { en: 'Mainly clear', bn: 'প্রায় পরিষ্কার' };
  if (code === 2) return { en: 'Partly cloudy', bn: 'আংশিক মেঘলা' };
  if (code === 3) return { en: 'Overcast', bn: 'মেঘাচ্ছন্ন' };
  if (code === 45 || code === 48) return { en: 'Fog', bn: 'কুয়াশা' };
  if (code >= 51 && code <= 55) return { en: 'Drizzle', bn: 'গুঁড়ি গুঁড়ি বৃষ্টি' };
  if (code >= 56 && code <= 57) return { en: 'Freezing drizzle', bn: 'বরফ-মিশ্রিত গুঁড়ি বৃষ্টি' };
  if (code >= 61 && code <= 65) return { en: 'Rain', bn: 'বৃষ্টি' };
  if (code >= 66 && code <= 67) return { en: 'Freezing rain', bn: 'বরফ-মিশ্রিত বৃষ্টি' };
  if (code >= 71 && code <= 77) return { en: 'Snow', bn: 'তুষারপাত' };
  if (code >= 80 && code <= 82) return { en: 'Rain showers', bn: 'বৃষ্টির ঝাপটা' };
  if (code >= 85 && code <= 86) return { en: 'Snow showers', bn: 'তুষার ঝড়' };
  if (code === 95) return { en: 'Thunderstorm', bn: 'বজ্রঝড়' };
  if (code >= 96 && code <= 99) return { en: 'Thunderstorm with hail', bn: 'শিলাসহ বজ্রঝড়' };
  return { en: 'Unknown', bn: 'অজানা' };
}
