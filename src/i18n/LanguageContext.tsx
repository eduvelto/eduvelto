// Eduvelto — language preference (owner brief 21 Nov 16:09, BINDING).
//
// The site used to render Bangla + English TOGETHER on nearly every label
// ("শিক্ষার্থী ড্যাশবোর্ড / Student Dashboard"). Now the UI renders ONE
// language only: `bn` (Bangla, default) or `en` (English).
//
// - The choice is an ACCOUNT PREFERENCE (owner brief 21 Nov 16:11,
//   binding). It lives in the signed-in user's profile
//   (`users.language` — firestore.rules already allow a user to update
//   their own `language` field, rules:136 + :168, so NO rules change
//   was needed) and in this browser's localStorage
//   (`eduvelto-language`) as the logged-out-visitor fallback only.
//   When a user logs in, their account preference is adopted (so it
//   follows them to another device); it survives logout/login.
// - Changing it switches the WHOLE UI immediately (the provider
//   re-renders every consumer). Nothing is fetched from the server
//   for this.
// - `useLanguage()` gives `{ lang, setLanguage, t }` for logic/attributes;
//   `<T bn en />` renders one language inside JSX text — the mechanical
//   conversion of the old `{x.bn} / {x.en}` pairs.
// - Book / lesson / exam CONTENT keeps its own language per subject
//   (English-department packs stay English-with-Bangla-explanation);
//   book original names, author names and user-written content are
//   NEVER translated. This context only switches the UI chrome.

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
  lang: Lang;
  setLanguage: (next: Lang) => void;
  /** Pick one language from a { bn, en } pair. */
  t: (entry: LangEntry) => string;
};

const LanguageContext = createContext<LanguageState>({
  lang: 'bn',
  setLanguage: () => {},
  t: (entry) => entry.bn,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { user, profile, saveProfile } = useAuth();
  const [lang, setLangState] = useState<Lang>(() => readStored() ?? 'bn');

  // Account preference wins at login (cross-device): when a user signs
  // in, adopt their profile's language — so the choice survives
  // logout/login and follows them to another device. Logged out, the
  // device choice (localStorage) is the only source.
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
      if (user) {
        // Fire-and-forget: the UI already switched; the profile save only
        // makes the choice follow the user to other devices.
        void saveProfile({ language: next }).catch(() => {});
      }
    },
    [user, saveProfile],
  );

  const t = useCallback((entry: LangEntry) => entry[lang], [lang]);

  return <LanguageContext.Provider value={{ lang, setLanguage, t }}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageState {
  return useContext(LanguageContext);
}

/** Render one language inside JSX text: `<T bn="…" en="…" />`. */
export function T({ bn, en }: LangEntry) {
  const { lang } = useLanguage();
  return <>{lang === 'bn' ? bn : en}</>;
}
