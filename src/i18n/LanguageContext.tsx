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
// - Persistence, in priority order: the /:lang URL segment (the ONLY
//   language carrier in the URL — ?lang= fix, 26 Nov 2026: `?lang=` is
//   legacy-only, adopted once from old shared links and then STRIPPED
//   from the URL, never written) → account preference
//   `users.language` (adopted at login — survives logout/login and
//   follows the user cross-device; firestore.rules already allow a
//   user to update their own `language` field, so NO rules change was
//   needed) → this browser's localStorage (`eduvelto-language`, the
//   logged-out-visitor fallback) → `'bn'`.
// - `t()` / `<T>` fall back to the Bangla string when an English string
//   is missing or empty — never render blank.
// - `document.documentElement.lang` follows `lang` (screen readers, SEO).
// - Book / lesson / exam CONTENT keeps its own language per subject
//   (English-department packs stay English-with-Bangla-explanation);
//   book original names, author names and user-written content are
//   NEVER translated. This context only switches the UI chrome.
//   The Quran ayah's Arabic original never changes; its translation
//   follows the setting (see AnnouncementTicker).

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Lang } from './strings';
import { useAuth } from '../lib/auth';
import {
  isSupportedLang,
  langSwitchTarget,
  legacyRedirectTarget,
  parseLangSegment,
  withoutLangParam,
} from '../lib/langRouting';

const STORAGE_KEY = 'eduvelto-language';

export function getStoredLanguage(): Lang | null {
  return readStored();
}

function readStored(): Lang | null {
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === 'bn' || v === 'en' ? v : null;
  } catch {
    return null;
  }
}

function readPathLang(): Lang | null {
  try {
    return parseLangSegment(window.location.pathname);
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

/** ?lang= fix (26 Nov 2026): the language switch navigates to the
 *  /:lang path — it NEVER writes ?lang= to the URL. On a public page
 *  the same page is re-addressed under the new /:lang prefix
 *  (replaceState, no extra history entry); on a private/app route,
 *  which has no lang prefix, the path is left alone and any legacy
 *  ?lang= param is stripped. Other query params and the hash are
 *  preserved. */
function navigateToLang(next: Lang): void {
  try {
    const pathname = window.location.pathname ?? '/';
    const search = window.location.search ?? '';
    const hash = window.location.hash ?? '';
    const target = langSwitchTarget(pathname, next);
    const cleanSearch = withoutLangParam(search);
    const nextUrl = target ? `${target}${cleanSearch}${hash}` : `${pathname}${cleanSearch}${hash}`;
    const currentUrl = `${pathname}${search}${hash}`;
    if (nextUrl !== currentUrl) {
      window.history.replaceState(null, '', nextUrl);
    }
  } catch {
    // Non-browser environment or blocked history: the in-memory +
    // localStorage choice still applies.
  }
}

/** Strip a legacy ?lang= param from the current URL (in place, no
 *  navigation). Used once at startup for old shared links — EXCEPT
 *  on legacy public paths, where LegacyRedirect (App.tsx) consumes
 *  the param to pick the redirect language first. */
function stripLegacyLangParamAtStartup(): void {
  try {
    const pathname = window.location.pathname ?? '/';
    if (pathname === '/') return; // RootRedirect strips it.
    if (legacyRedirectTarget(pathname)) return; // LegacyRedirect consumes it.
    const search = window.location.search ?? '';
    const cleanSearch = withoutLangParam(search);
    if (cleanSearch !== search) {
      window.history.replaceState(null, '', `${pathname}${cleanSearch}${window.location.hash ?? ''}`);
    }
  } catch {
    // ignore
  }
}

export type LangEntry = { bn: string; en: string };

export type LanguageState = {
  /** Language the UI renders in — the user's selected language. */
  lang: Lang;
  /** Alias of `lang` (kept for the header toggle + greeting bar). */
  tabLang: Lang;
  setLanguage: (next: Lang) => void;
  /** Adopt the language from a /:lang URL navigation (LangLayout).
   *  Sets state + localStorage only — it never rewrites the URL and
   *  never saves the profile (the URL is already the choice). */
  syncLanguageFromPath: (next: Lang) => void;
  /** Pick the string in the selected language (Bangla fallback). */
  t: (entry: LangEntry) => string;
  /** Alias of `t` (kept for tab-label callsites). */
  tTab: (entry: LangEntry) => string;
};

export const LanguageContext = createContext<LanguageState>({
  lang: 'bn',
  tabLang: 'bn',
  setLanguage: () => {},
  syncLanguageFromPath: () => {},
  t: (entry) => entry.bn,
  tTab: (entry) => entry.bn,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { user, profile, saveProfile } = useAuth();
  const [lang, setLangState] = useState<Lang>(() => {
    // Phase 1 (25 Nov 2026): the /:lang URL segment is the source of
    // truth and outranks ?lang (kept for old shared links).
    const fromPath = readPathLang();
    if (fromPath) {
      // A legacy ?lang= on an already-prefixed URL is stripped at
      // once — the path is the language now.
      stripLegacyLangParamAtStartup();
      return fromPath;
    }
    const fromUrl = readUrlLang();
    if (fromUrl) {
      try {
        window.localStorage.setItem(STORAGE_KEY, fromUrl);
      } catch {
        // ignore
      }
      // Old shared link: adopt the language, then strip the param
      // (legacy paths are left for LegacyRedirect to consume).
      stripLegacyLangParamAtStartup();
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
    // A /:lang URL already states the language — it wins over the
    // profile (Phase 1). The profile is adopted only on legacy
    // (unprefixed) URLs, e.g. right after sign-in from /login.
    if (parseLangSegment(window.location.pathname)) return;
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

  const syncLanguageFromPath = useCallback((next: Lang) => {
    if (!isSupportedLang(next)) return;
    setLangState((current) => {
      if (current === next) return current;
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const setLanguage = useCallback(
    (next: Lang) => {
      setLangState(next);
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // Private mode / storage blocked: the in-memory choice still applies.
      }
      // ?lang= fix (26 Nov 2026): navigate the /:lang path, never
      // write ?lang= to the URL.
      navigateToLang(next);
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

  return (
    <LanguageContext.Provider value={{ lang, tabLang, setLanguage, syncLanguageFromPath, t, tTab }}>
      {children}
    </LanguageContext.Provider>
  );
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
