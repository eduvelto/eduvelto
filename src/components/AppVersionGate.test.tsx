// Render tests for the forced-app-update block screen + update bar.
// No DOM needed: react-dom/server renders to static HTML. The components
// follow the selected language (24 Nov 2026 language system), so renders
// are wrapped in LanguageProvider with a faked window (same pattern as
// LanguageContext.test.tsx). MemoryRouter provides the router context
// for the download <Link>. Both the gate and the context are imported
// fresh per test (after vi.resetModules) so the provider and the hook
// share one context instance.
// Run: npx vitest run src/components/AppVersionGate.test.tsx
import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import type { AppVersionConfig } from '../lib/appVersion';

type GlobalWindow = { window?: unknown };

function setWindow(win: unknown) {
  (globalThis as unknown as GlobalWindow).window = win;
}

function clearWindow() {
  delete (globalThis as unknown as GlobalWindow).window;
}

vi.mock('../lib/auth', () => ({
  useAuth: () => ({ user: null, profile: null, saveProfile: vi.fn(() => Promise.resolve()) }),
}));

const forcedConfig: AppVersionConfig = {
  latestVersion: '0.2.0',
  minVersion: '0.2.0',
  releaseNotes: 'নতুন চ্যাপ্টার ও পরীক্ষা যোগ হয়েছে।',
  downloadUrl: '/install',
  updatedAt: null,
};

type GateMod = typeof import('./AppVersionGate');

function setupWindow(stored?: string | null) {
  const store: Record<string, string> = {};
  if (stored) store['eduvelto-language'] = stored;
  (globalThis as unknown as { window: unknown }).window = {
    location: { search: '', href: 'https://eduvelto.com/' },
    localStorage: {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
    },
    history: { replaceState: () => {} },
  };
  (globalThis as unknown as { document: unknown }).document = {
    documentElement: { lang: '' },
  };
}

async function renderWith(
  render: (mod: GateMod) => React.ReactElement,
  stored?: string | null,
): Promise<string> {
  setupWindow(stored);
  vi.resetModules();
  const [gateMod, ctxMod] = await Promise.all([
    import('./AppVersionGate'),
    import('../i18n/LanguageContext'),
  ]);
  const { LanguageProvider } = ctxMod;
  try {
    return renderToStaticMarkup(
      React.createElement(
        LanguageProvider,
        null,
        React.createElement(MemoryRouter, null, render(gateMod)),
      ),
    );
  } finally {
    delete (globalThis as unknown as { window?: unknown }).window;
    delete (globalThis as unknown as { document?: unknown }).document;
  }
}

async function loadGate(): Promise<GateMod> {
  vi.resetModules();
  return import('./AppVersionGate');
}

describe('AppVersionBlockedScreen', () => {
  const originalWindow = (globalThis as unknown as GlobalWindow).window;

  afterEach(() => {
    if (originalWindow === undefined) {
      clearWindow();
    } else {
      setWindow(originalWindow);
    }
  });

  it('renders the Bangla block message, release notes and a working download link', async () => {
    const html = await renderWith((m) =>
      React.createElement(m.AppVersionBlockedScreen, { config: forcedConfig }),
    );
    );
    expect(html).toContain('নতুন ভার্সন এসেছে');
    expect(html).toContain('এই পুরোনো ভার্সনটি আর ব্যবহার করা যাবে না');
    expect(html).toContain('নতুন চ্যাপ্টার ও পরীক্ষা যোগ হয়েছে।');
    expect(html).toContain('নতুন ভার্সন ডাউনলোড করুন');
    expect(html).toContain('href="/install"');
    expect(html).toContain('0.2.0');
  });

  it('renders the English block message when English is selected', async () => {
    const html = await renderWith(
      (m) => React.createElement(m.AppVersionBlockedScreen, { config: forcedConfig }),
      'en',
    );
    expect(html).toContain('A new version is available');
    expect(html).toContain('This old version can no longer be used');
    expect(html).toContain('Download the new version');
    expect(html).not.toContain('নতুন ভার্সন এসেছে');
  });

  it('renders even without a config (defensive)', async () => {
    const html = await renderWith((m) =>
      React.createElement(m.AppVersionBlockedScreen, { config: null }),
    );
    expect(html).toContain('নতুন ভার্সন এসেছে');
    expect(html).toContain('href="/install"');
  });

  it('uses a plain <a> for an absolute download URL', async () => {
    const html = await renderWith((m) =>
      React.createElement(m.AppVersionBlockedScreen, {
        config: { ...forcedConfig, downloadUrl: 'https://example.com/app' },
      }),
    );
    expect(html).toContain('href="https://example.com/app"');
  });

  it('in-app without a real download URL: honest message, no dead /install link', () => {
    // Audit 24 Nov 2026 (F3): inside the app a button to /install is a
    // dead end — the in-app /install view has no download link. The
    // blocked screen must say so and offer the login escape hatch
    // instead of a button that goes nowhere.
    setWindow({ Capacitor: { isNativePlatform: () => true } });
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <AppVersionBlockedScreen config={forcedConfig} />
      </MemoryRouter>,
    );
    expect(html).toContain('ডাউনলোড লিঙ্ক এখনো দেওয়া হয়নি');
    expect(html).toContain('আপনি Eduvelto Android অ্যাপ ব্যবহার করছেন');
    expect(html).not.toContain('নতুন ভার্সন ডাউনলোড করুন');
    expect(html).not.toContain('href="/install"');
    expect(html).toContain('href="/login"');
  });

  it('in-app with a real download URL: still shows the download button', () => {
    setWindow({ Capacitor: { isNativePlatform: () => true } });
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <AppVersionBlockedScreen
          config={{ ...forcedConfig, downloadUrl: 'https://example.com/app' }}
        />
      </MemoryRouter>,
    );
    expect(html).toContain('নতুন ভার্সন ডাউনলোড করুন');
    expect(html).toContain('href="https://example.com/app"');
  });
});

describe('AppVersionUpdateBar', () => {
  it('shows the newer version and links to /install', async () => {
    const html = await renderWith((m) =>
      React.createElement(m.AppVersionUpdateBar, { config: forcedConfig }),
    );
    expect(html).toContain('নতুন ভার্সন এসেছে');
    expect(html).toContain('0.2.0');
    expect(html).toContain('href="/install"');
  });

  it('shows the English update bar when English is selected', async () => {
    const html = await renderWith(
      (m) => React.createElement(m.AppVersionUpdateBar, { config: forcedConfig }),
      'en',
    );
    expect(html).toContain('A new version is available');
    expect(html).toContain('Update →');
    expect(html).not.toContain('নতুন ভার্সন এসেছে');
  });
});

describe('isGateExemptPath', () => {
  it('exempts the download destination, sign-in and admin routes', async () => {
    const { isGateExemptPath } = await loadGate();
    expect(isGateExemptPath('/install')).toBe(true);
    expect(isGateExemptPath('/login')).toBe(true);
    expect(isGateExemptPath('/admin/app-version')).toBe(true);
    expect(isGateExemptPath('/admin')).toBe(true);
  });
  it('does not exempt content routes', async () => {
    const { isGateExemptPath } = await loadGate();
    expect(isGateExemptPath('/')).toBe(false);
    expect(isGateExemptPath('/library')).toBe(false);
    expect(isGateExemptPath('/profile')).toBe(false);
    expect(isGateExemptPath('/quiz/abc')).toBe(false);
  });
});
