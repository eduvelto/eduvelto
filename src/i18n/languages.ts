// Phased 8-language rollout (owner order 28 Nov 2026): bn, en, es, ar,
// hi, pt, fr, id have content (phased pages + top-20 tools). de/ja stay
// NOT ready; Korean (/ko) is a separate 11th language, LATER — do not
// add it here.

export type Lang =
  | 'bn' | 'en' | 'es' | 'ar' | 'hi' | 'pt' | 'fr' | 'de' | 'id' | 'ja';

/** The languages live today (content exists) — the 8 phased codes. */
export type LiveLang = Exclude<Lang, 'de' | 'ja'>;

export interface LanguageDef {
  code: Lang;
  nameEn: string;
  nameNative: string;
  rtl: boolean;
  /** BCP 47 locale for Intl formatting. */
  locale: string;
  /** Whether tool meta/guides exist yet for this language. */
  contentReady: boolean;
}

export const SUPPORTED_LANGS: LanguageDef[] = [
  { code: 'bn', nameEn: 'Bengali', nameNative: 'বাংলা', rtl: false, locale: 'bn-BD', contentReady: true },
  { code: 'en', nameEn: 'English', nameNative: 'English', rtl: false, locale: 'en-US', contentReady: true },
  { code: 'es', nameEn: 'Spanish', nameNative: 'Español', rtl: false, locale: 'es-ES', contentReady: true },
  { code: 'ar', nameEn: 'Arabic', nameNative: 'العربية', rtl: true, locale: 'ar-EG', contentReady: true },
  { code: 'hi', nameEn: 'Hindi', nameNative: 'हिन्दी', rtl: false, locale: 'hi-IN', contentReady: true },
  { code: 'pt', nameEn: 'Portuguese', nameNative: 'Português', rtl: false, locale: 'pt-BR', contentReady: true },
  { code: 'fr', nameEn: 'French', nameNative: 'Français', rtl: false, locale: 'fr-FR', contentReady: true },
  { code: 'de', nameEn: 'German', nameNative: 'Deutsch', rtl: false, locale: 'de-DE', contentReady: false },
  { code: 'id', nameEn: 'Indonesian', nameNative: 'Bahasa Indonesia', rtl: false, locale: 'id-ID', contentReady: true },
  { code: 'ja', nameEn: 'Japanese', nameNative: '日本語', rtl: false, locale: 'ja-JP', contentReady: false },
];

export const DEFAULT_LANG: Lang = 'bn';

/** Languages a user may actually pick today (content exists). The cast
 * is safe by construction: exactly the 8 contentReady entries have a
 * LiveLang code (de/ja are contentReady: false) — see the registry above. */
export const LIVE_LANGS: LiveLang[] = SUPPORTED_LANGS.filter((l) => l.contentReady).map(
  (l) => l.code as LiveLang,
);

export function isSupportedLang(code: string): code is Lang {
  return SUPPORTED_LANGS.some((l) => l.code === code);
}

export function languageDef(code: Lang): LanguageDef {
  return SUPPORTED_LANGS.find((l) => l.code === code) ?? SUPPORTED_LANGS[0];
}

export function isRtl(code: Lang): boolean {
  return languageDef(code).rtl;
}

/** Fallback chain for a missing string: requested -> en -> bn. Never crash. */
export function resolveLang(requested: string): Lang {
  if (isSupportedLang(requested)) return requested;
  return DEFAULT_LANG;
}
