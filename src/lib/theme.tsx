// Eduvelto — dark-mode theme (owner request 22 Nov 2026, "dark mode ta o
// tik kore daw").
//
// Root cause found 22 Nov 2026: there was NO dark-mode theme system at
// all. The header moon icon only opened a "ডার্ক মোড শীঘ্রই আসছে /
// Dark mode coming soon" note (see HeaderNav.tsx before this change).
// This provider makes the toggle real:
//
// - `theme` is 'light' | 'dark'. It is a DEVICE preference, stored in
//   this browser's localStorage (`eduvelto-theme`). Default (no stored
//   choice): the OS preference via matchMedia('(prefers-color-scheme:
//   dark)').
// - The active theme is applied as `data-theme` on <html>; index.css
//   scopes every dark colour under `html[data-theme="dark"]`.
//   index.html also sets data-theme from storage before React loads,
//   so the first paint already uses the right theme (no white flash).
// - The <meta name="theme-color"> is updated too, so the browser
//   chrome / PWA status bar matches the theme.
// - Mirrors LanguageContext's storage pattern; no Firestore, no rules
//   change — the theme is a device choice, not an account preference.

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'eduvelto-theme';

function readStored(): Theme | null {
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === 'light' || v === 'dark' ? v : null;
  } catch {
    return null;
  }
}

function readSystemPrefersDark(): boolean {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch {
    return false;
  }
}

/** Pure helper (unit-tested): stored choice wins, else the OS preference. */
export function resolveInitialTheme(stored: Theme | null, prefersDark: boolean): Theme {
  if (stored === 'light' || stored === 'dark') return stored;
  return prefersDark ? 'dark' : 'light';
}

/** Pure helper (unit-tested): apply a theme to a document-like object. */
export function applyThemeToDocument(
  theme: Theme,
  doc: { documentElement: { dataset: Record<string, string | undefined> }; querySelector: (sel: string) => { setAttribute: (k: string, v: string) => void } | null },
): void {
  doc.documentElement.dataset.theme = theme;
  const meta = doc.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme === 'dark' ? '#0f1b24' : '#142b3b');
}

export type ThemeState = {
  theme: Theme;
  setTheme: (next: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeState>({
  theme: 'light',
  setTheme: () => {},
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => resolveInitialTheme(readStored(), readSystemPrefersDark()));

  useEffect(() => {
    applyThemeToDocument(theme, document);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Private mode / storage blocked: the in-memory choice still applies.
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      const next: Theme = current === 'dark' ? 'light' : 'dark';
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // ignore — in-memory choice still applies
      }
      return next;
    });
  }, []);

  return <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeState {
  return useContext(ThemeContext);
}
