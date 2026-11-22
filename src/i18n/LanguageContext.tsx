// Eduvelto — language preference.
//
// OWNER RULE (22 Nov 2026, BINDING — supersedes the 21 Nov full-English
// behaviour): the site keeps ONE language — Bangla. The Settings language
// option (বাংলা / English) stays, but selecting English changes ONLY the
// navigation TAB labels to English; EVERYTHING else stays Bangla
// (headings, buttons, content, forms, toasts, labels).
//
// How this is enforced — a single choke point, do not work around it:
// - `lang` is the CONTENT language and is ALWAYS 'bn'. Every existing
//   consumer (`t()`, `<T>`, and all direct `lang === 'bn' ? … : …`
//   ternaries, date locales, number formats) therefore renders Bangla
//   with no edits at those sites.
// - `tabLang` is the user's selected language (the Settings choice). It
//   is stored exactly as before — account preference `users.language`
//   (firestore.rules already allow a user to update their own `language`
//   field, so NO rules change was needed) + this browser's localStorage
//   (`eduvelto-language`) as the logged-out-visitor fallback; when a
//   user logs in, their account preference is adopted (cross-device).
// - ONLY the tab-label path reads `tabLang`: `tTab()` and `<TabT>`,
//   plus the header language toggle (it reads `tabLang` to show the
//   target language and calls `setLanguage` to switch it).
//   The complete English surface of the site is therefore the list of
//   `tTab` / `<TabT>` call sites — audit it with:
//   `grep -rn "tTab\|TabT\|tabLang" src/`
//   (inventory: team/i18n-tabs-only-english-report.md).
// - `document.documentElement.lang` stays 'bn': the page content IS
//   Bangla; only a few tab labels switch.
// - Book / lesson / exam CONTENT keeps its own language per subject
//   (English-department packs stay English-with-Bangla-explanation);
//   book original names, author names and user-written content are
//   NEVER translated. This context only switches the UI chrome.
// - The English strings are NOT deleted — they still back the tab
//   labels (and the Settings selector's own "English" option).

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

export type LangEntry = { bn: string; en: string };

export type LanguageState = {
  /** Language the UI content renders in — always 'bn' (owner rule 22 Nov 2026). */
  lang: Lang;
  /** The user's selected language — ONLY navigation tab labels follow it. */
  tabLang: Lang;
  setLanguage: (next: Lang) => void;
  /** Pick the Bangla string — always, for every non-tab string. */
  t: (entry: LangEntry) => string;
  /** Pick the string in the user's selected language — tab labels ONLY. */
  tTab: (entry: LangEntry) => string;
};

const LanguageContext = createContext<LanguageState>({
  lang: 'bn',
  tabLang: 'bn',
  setLanguage: () => {},
  t: (entry) => entry.bn,
  tTab: (entry) => entry.bn,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { user, profile, saveProfile } = useAuth();
  const [tabLang, setTabLangState] = useState<Lang>(() => readStored() ?? 'bn');

  // Content language — always Bangla (owner rule 22 Nov 2026).
  const lang: Lang = 'bn';

  // Account preference wins at login (cross-device): when a user signs
  // in, adopt their profile's language — so the choice survives
  // logout/login and follows them to another device. Logged out, the
  // device choice (localStorage) is the only source. This drives the
  // TAB labels only; all other UI stays Bangla (see header comment).
  useEffect(() => {
    if (!user || !profile) return;
    if (profile.language === 'bn' || profile.language === 'en') {
      setTabLangState((current) => {
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
  // The page content is Bangla, so this stays 'bn' even when the user
  // picked English (only tab labels switch).
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLanguage = useCallback(
    (next: Lang) => {
      setTabLangState(next);
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // Private mode / storage blocked: the in-memory choice still applies.
      }
      if (user) {
        // Fire-and-forget: the tabs already switched; the profile save only
        // makes the choice follow the user to other devices.
        void saveProfile({ language: next }).catch(() => {});
      }
    },
    [user, saveProfile],
  );

  // Non-tab strings: ALWAYS Bangla (owner rule 22 Nov 2026).
  const t = useCallback((entry: LangEntry) => entry.bn, []);

  // Tab labels only: follow the user's selected language.
  const tTab = useCallback((entry: LangEntry) => entry[tabLang], [tabLang]);

  return <LanguageContext.Provider value={{ lang, tabLang, setLanguage, t, tTab }}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageState {
  return useContext(LanguageContext);
}

/**
 * Render the Bangla text inside JSX — always, for every non-tab string
 * (owner rule 22 Nov 2026). For navigation tab labels use `<TabT>`.
 */
export function T({ bn }: LangEntry) {
  return <>{bn}</>;
}

/** Render a navigation TAB label in the user's selected language. */
export function TabT({ bn, en }: LangEntry) {
  const { tabLang } = useLanguage();
  return <>{tabLang === 'bn' ? bn : en}</>;
}
