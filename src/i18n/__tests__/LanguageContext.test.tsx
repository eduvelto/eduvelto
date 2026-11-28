// Eduvelto — LanguageContext tests (owner brief 24 Nov 2026 07:27: the whole
// site follows the selected language).
//
// renderToString runs in plain node (no jsdom — the repo has none), so the
// window/document are faked per scenario, exactly like AdSlot.test.tsx does.
// Effects do not run under renderToString, so `document.documentElement.lang`
// is verified in the Playwright probe instead (see language-system-evidence).
import { describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import React from 'react';

vi.mock('../../lib/auth', () => ({
  useAuth: () => ({ user: null, profile: null, saveProfile: vi.fn(() => Promise.resolve()) }),
}));

type FakeWindow = {
  store: Record<string, string>;
  lastUrl: string;
};

function setupWindow(opts: {
  search?: string;
  stored?: string | null;
  pathname?: string;
}): FakeWindow {
  const fake: FakeWindow = { store: {}, lastUrl: '' };
  if (opts.stored) fake.store['eduvelto-language'] = opts.stored;
  (globalThis as unknown as { window: unknown }).window = {
    location: {
      pathname: opts.pathname ?? '/',
      search: opts.search ?? '',
      hash: '',
      href: `https://eduvelto.com${opts.pathname ?? '/'}${opts.search ?? ''}`,
    },
    localStorage: {
      getItem: (k: string) => fake.store[k] ?? null,
      setItem: (k: string, v: string) => {
        fake.store[k] = v;
      },
    },
    history: {
      replaceState: (_a: unknown, _b: string, url: string) => {
        fake.lastUrl = url;
      },
    },
  };
  (globalThis as unknown as { document: unknown }).document = {
    documentElement: { lang: '' },
  };
  return fake;
}

async function renderProbe(
  entry: { bn: string; en: string },
  opts: { search?: string; stored?: string | null; pathname?: string } = {},
): Promise<{ html: string; fake: FakeWindow }> {
  const fake = setupWindow(opts);
  vi.resetModules();
  const mod = await import('../LanguageContext');
  const { LanguageProvider, useLanguage, T } = mod;
  function Probe() {
    const { t, lang, tabLang } = useLanguage();
    return (
      <span data-lang={lang} data-tab={tabLang}>
        {t(entry)}|<T bn={entry.bn} en={entry.en} />
      </span>
    );
  }
  const html = renderToString(
    React.createElement(LanguageProvider, null, React.createElement(Probe)),
  );
  return { html, fake };
}

describe('LanguageContext — full-site language (24 Nov 2026 brief)', () => {
  it('defaults to Bangla with no stored choice and no ?lang=', async () => {
    const { html } = await renderProbe({ bn: 'হোম', en: 'Home' });
    expect(html).toContain('data-lang="bn"');
    expect(html).toContain('হোম');
    expect(html).not.toContain('Home');
  });

  it('adopts the stored choice (localStorage)', async () => {
    const { html } = await renderProbe({ bn: 'হোম', en: 'Home' }, { stored: 'en' });
    expect(html).toContain('data-lang="en"');
    expect(html).toContain('Home');
    expect(html).not.toContain('হোম');
  });

  it('?lang=en overrides a stored Bangla choice and persists it', async () => {
    const { html, fake } = await renderProbe(
      { bn: 'হোম', en: 'Home' },
      { search: '?lang=en', stored: 'bn' },
    );
    expect(html).toContain('data-lang="en"');
    expect(html).toContain('Home');
    expect(fake.store['eduvelto-language']).toBe('en');
  });

  it('?lang=bn overrides a stored English choice', async () => {
    const { html } = await renderProbe(
      { bn: 'হোম', en: 'Home' },
      { search: '?lang=bn', stored: 'en' },
    );
    expect(html).toContain('data-lang="bn"');
    expect(html).toContain('হোম');
  });

  it('ignores an invalid ?lang= value', async () => {
    // 'de' is registered but NOT live (28 Nov 2026 phased rollout), so
    // it is ignored like an unknown code — 'fr' is live now, do NOT
    // use it here.
    const { html } = await renderProbe(
      { bn: 'হোম', en: 'Home' },
      { search: '?lang=de', stored: 'en' },
    );
    expect(html).toContain('data-lang="en"');
  });

  it('?lang=hi adopts Hindi and renders the phased translation', async () => {
    const { html } = await renderProbe({ bn: 'হোম', en: 'Home' }, { search: '?lang=hi' });
    expect(html).toContain('data-lang="hi"');
    // 'Home' is in the phased dictionary (216 keys) — Hindi, not English.
    expect(html).toContain('होम');
  });

  it('tabLang stays an alias of lang', async () => {
    const { html } = await renderProbe({ bn: 'হোম', en: 'Home' }, { stored: 'en' });
    expect(html).toContain('data-tab="en"');
  });

  it('t() and <T> fall back to Bangla when the English string is missing', async () => {
    const { html } = await renderProbe({ bn: 'শুধু বাংলা', en: '' }, { stored: 'en' });
    expect(html).toContain('শুধু বাংলা');
  });

  it('setLanguage navigates the /:lang path and never writes ?lang= to the URL', async () => {
    const fake = setupWindow({ stored: 'bn', pathname: '/bn/jobs/bcs' });
    vi.resetModules();
    const mod = await import('../LanguageContext');
    const { LanguageProvider, useLanguage } = mod;
    let captured: ReturnType<typeof useLanguage> | null = null;
    function Capture() {
      captured = useLanguage();
      return null;
    }
    renderToString(
      React.createElement(LanguageProvider, null, React.createElement(Capture)),
    );
    expect(captured).not.toBeNull();
    captured!.setLanguage('en');
    expect(fake.store['eduvelto-language']).toBe('en');
    expect(fake.lastUrl).toBe('/en/jobs/bcs');
    expect(fake.lastUrl).not.toContain('lang=');
  });

  it('setLanguage on a private route strips a legacy ?lang= and leaves the path alone', async () => {
    const fake = setupWindow({ stored: 'bn', pathname: '/login', search: '?lang=en' });
    vi.resetModules();
    const mod = await import('../LanguageContext');
    const { LanguageProvider, useLanguage } = mod;
    let captured: ReturnType<typeof useLanguage> | null = null;
    function Capture() {
      captured = useLanguage();
      return null;
    }
    renderToString(
      React.createElement(LanguageProvider, null, React.createElement(Capture)),
    );
    captured!.setLanguage('en');
    expect(fake.lastUrl).toBe('/login');
    expect(fake.lastUrl).not.toContain('lang=');
  });

  it('an old ?lang= link to a prefixed URL keeps the path language and the param is stripped', async () => {
    const { html, fake } = await renderProbe(
      { bn: 'হোম', en: 'Home' },
      { search: '?lang=en', stored: 'bn', pathname: '/bn/jobs/bcs' },
    );
    // The /:lang path wins over ?lang=, so the language stays Bangla;
    // the legacy param is still stripped from the URL.
    expect(html).toContain('data-lang="bn"');
    expect(fake.lastUrl).toBe('/bn/jobs/bcs');
    expect(fake.lastUrl).not.toContain('lang=');
  });

  it('an old ?lang= link to a legacy path is NOT stripped at startup (LegacyRedirect consumes it)', async () => {
    const { html, fake } = await renderProbe(
      { bn: 'হোম', en: 'Home' },
      { search: '?lang=en', stored: 'bn', pathname: '/jobs/bcs' },
    );
    expect(html).toContain('data-lang="en"');
    expect(fake.lastUrl).toBe('');
  });
});
