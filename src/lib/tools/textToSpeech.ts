/**
 * Text to Speech — pure helpers.
 *
 * Speech itself uses the browser's built-in speechSynthesis only
 * (no API, no network). The helpers here only sort and filter the
 * voice list, so they can be tested in plain node — speechSynthesis
 * is never touched in this file.
 */

export interface SpeechVoiceLike {
  name: string;
  lang: string;
}

function langLower(voice: SpeechVoiceLike): string {
  return voice.lang.toLowerCase();
}

/** Voices whose language starts with the given prefix (e.g. 'bn', 'en'). */
export function filterVoicesByLang(
  voices: readonly SpeechVoiceLike[],
  langPrefix: string,
): SpeechVoiceLike[] {
  const prefix = langPrefix.toLowerCase();
  return voices.filter((v) => langLower(v).startsWith(prefix));
}

/**
 * Sort voices so Bangla voices come first, then English, then the
 * rest (alphabetical by name within each group). Returns a new array.
 */
export function sortVoicesPreferBnEn(voices: readonly SpeechVoiceLike[]): SpeechVoiceLike[] {
  const rank = (v: SpeechVoiceLike): number => {
    const lang = langLower(v);
    if (lang.startsWith('bn')) return 0;
    if (lang.startsWith('en')) return 1;
    return 2;
  };
  return [...voices].sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));
}

/**
 * The voice the UI should pre-select: the first Bangla voice, else
 * the first English voice, else the first voice, else null.
 */
export function pickDefaultVoice(voices: readonly SpeechVoiceLike[]): SpeechVoiceLike | null {
  const sorted = sortVoicesPreferBnEn(voices);
  return sorted[0] ?? null;
}
