// Eduvelto — language preference.
//
// OWNER RULE (24 Nov 2026, 07:27 — SUPERSEDES the 22 Nov 2026 tabs-only
// rule): the whole site follows the user's selected language — Bangla or
// English. Selecting English changes ALL UI text (headings, buttons,
// navigation, menu, forms, toasts, labels, placeholders), not just the
// navigation tab labels. Bangla is the default.
//
// How this is enforced — a single choke point, do not work around it:
// - `lang` is the selected language ('bn' | 'en'). Every existing
//   consumer (`t()`, `<T>`, and all direct `lang === 'bn' ? … : …`
//   ternaries, date locales, number formats) therefore renders in the
//   selected language with no edits at those sites.
// - `tabLang` is kept as an alias of `lang` (the header toggle and the
//   greeting bar read it; they now switch the whole site).
// - Persistence, in priority order: `?lang=` URL param (shareable links,
//   highest priority) → account preference `users.language` (adopted at
//   login — survives logout/login and follows the user cross-device;
//   firestore.rules already allow a user to update their own `language`
//   field, so NO rules change was needed) → this browser's localStorage
//   (`eduvelto-language`, the logged-out-visitor fallback) → `'bn'`.
// - `t()` / `<T>` fall back to the Bangla string when an English string
//   is missing or empty — never render blank.
// - `document.documentElement.lang` follows `lang` (screen readers, SEO).
// - Book / lesson / exam CONTENT keeps its own language per subject
//   (English-department packs stay English-with-Bangla-explanation);
//   book original names, author names and user-written content are
//   NEVER translated. This context only switches the UI chrome.
//   The Quran ayah's Arabic original never changes; its translation
//   follows the setting (see HeroGreeting).

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Lang } from './strings';
import { useAuth } from '../lib/auth';

const STORAGE_KEY = 'eduvelto-language';

function readStored(): Lang | null {
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === 'bn' || v === 'en' ? v : null;
  } catch {
    return null;
  }
}

function readUrlLang(): Lang | null {
  try {
    const v = new URLSearchParams(window.location.search).get('lang');
    return v === 'bn' || v === 'en' ? v : null;
  } catch {
    return null;
  }
}

function writeUrlLang(next: Lang): void {
  try {
    const url = new URL(window.location.href);
    url.searchParams.set('lang', next);
    window.history.replaceState(null, '', url.toString());
  } catch {
    // Non-browser environment or blocked history: the in-memory +
    // localStorage choice still applies.
  }
}

export type LangEntry = { bn: string; en: string };

export type LanguageState = {
  /** Language the UI renders in — the user's selected language. */
  lang: Lang;
  /** Alias of `lang` (kept for the header toggle + greeting bar). */
  tabLang: Lang;
  setLanguage: (next: Lang) => void;
  /** Pick the string in the selected language (Bangla fallback). */
  t: (entry: LangEntry) => string;
  /** Alias of `t` (kept for tab-label callsites). */
  tTab: (entry: LangEntry) => string;
};

export const LanguageContext = createContext<LanguageState>({
  lang: 'bn',
  tabLang: 'bn',
  setLanguage: () => {},
  t: (entry) => entry.bn,
  tTab: (entry) => entry.bn,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { user, profile, saveProfile } = useAuth();
  const [lang, setLangState] = useState<Lang>(() => {
    const fromUrl = readUrlLang();
    if (fromUrl) {
      try {
        window.localStorage.setItem(STORAGE_KEY, fromUrl);
      } catch {
        // ignore
      }
      return fromUrl;
    }
    return readStored() ?? 'bn';
  });

  // The selected language is also the tab language (alias, kept so the
  // header toggle and the greeting bar keep working unchanged).
  const tabLang: Lang = lang;

  // Account preference wins at login (cross-device): when a user signs
  // in, adopt their profile's language — so the choice survives
  // logout/login and follows them to another device. Logged out, the
  // device choice (localStorage / ?lang=) is the only source.
  useEffect(() => {
    if (!user || !profile) return;
    if (profile.language === 'bn' || profile.language === 'en') {
      setLangState((current) => {
        if (current !== profile.language) {
          try {
            window.localStorage.setItem(STORAGE_KEY, profile.language);
          } catch {
            // ignore
          }
          return profile.language;
        }
        return current;
      });
    }
  }, [user?.uid, profile?.language]);

  // Screen readers and search engines see the active language.
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLanguage = useCallback(
    (next: Lang) => {
      setLangState(next);
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // Private mode / storage blocked: the in-memory choice still applies.
      }
      writeUrlLang(next);
      if (user) {
        // Fire-and-forget: the UI already switched; the profile save only
        // makes the choice follow the user to other devices.
        void saveProfile({ language: next }).catch(() => {});
      }
    },
    [user, saveProfile],
  );

  // Selected language, falling back to Bangla when an English string is
  // missing or empty — never render blank.
  const t = useCallback(
    (entry: LangEntry) => (lang === 'bn' ? entry.bn : entry.en || entry.bn),
    [lang],
  );

  // Tab labels follow the selected language too (alias of `t`).
  const tTab = t;

  return <LanguageContext.Provider value={{ lang, tabLang, setLanguage, t, tTab }}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageState {
  return useContext(LanguageContext);
}

/**
 * Render text in the selected language (Bangla fallback when the English
 * string is missing). `<TabT>` is a back-compat alias with the same output.
 */
export function T({ bn, en }: LangEntry) {
  const { lang } = useLanguage();
  return <>{lang === 'bn' ? bn : en || bn}</>;
}

/** Render a navigation TAB label in the selected language (alias of `<T>`). */
export function TabT({ bn, en }: LangEntry) {
  const { tabLang } = useLanguage();
  return <>{tabLang === 'bn' ? bn : en || bn}</>;
}
