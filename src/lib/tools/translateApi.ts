// Eduvelto — MyMemory translation API client (27 Nov 2026).
// FREE, no key: https://api.mymemory.translated.net/get
// Community translations — quality varies, and the anonymous tier has a
// daily limit. Thin fetch wrapper: typed result or a clear error string,
// never throws.

export type TranslateDirection = 'en|bn' | 'bn|en';

export type TranslateResult =
  | { ok: true; translated: string; match: number | null }
  | { ok: false; error: string };

const API_URL = 'https://api.mymemory.translated.net/get';

export async function translateText(text: string, langpair: TranslateDirection): Promise<TranslateResult> {
  const trimmed = text.trim();
  if (!trimmed) return { ok: false, error: 'Enter some text to translate.' };
  if (trimmed.length > 500) return { ok: false, error: 'Keep the text under 500 characters (MyMemory limit).' };
  try {
    const res = await fetch(`${API_URL}?q=${encodeURIComponent(trimmed)}&langpair=${langpair}`);
    if (!res.ok) return { ok: false, error: `Translation service returned ${res.status}.` };
    const json = (await res.json()) as {
      responseData?: { translatedText?: string; match?: number };
      responseStatus?: number;
      responseDetails?: string;
    };
    if (json.responseStatus === 429 || json.responseStatus === 403) {
      return { ok: false, error: 'Daily translation limit reached — please try again tomorrow.' };
    }
    const out = json.responseData?.translatedText;
    if (typeof out !== 'string' || out.trim() === '') {
      return { ok: false, error: 'Translation service returned no result.' };
    }
    if (out.trim().toLowerCase() === trimmed.toLowerCase() && langpair === 'en|bn') {
      // MyMemory echoes the input when it has no translation; say so honestly.
      return { ok: false, error: 'No Bangla translation found for this text.' };
    }
    return { ok: true, translated: out, match: json.responseData?.match ?? null };
  } catch {
    return { ok: false, error: 'Network error — check your internet connection and try again.' };
  }
}
