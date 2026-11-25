// Eduvelto — legal pages + Footer links tests (Phase 2, 25 Nov 2026).
//
// renderToString runs in plain node (no jsdom — the repo has none),
// following the LanguageContext.test.tsx pattern: useAuth is mocked
// (logged out), the window is faked per language (the /:lang path
// segment drives the provider), and modules are re-imported per
// scenario so the provider reads the fresh fake window. Effects do
// not run under renderToString, so this proves the FIRST paint —
// the copy a crawler and a first visitor see.
//
// The consumer and the provider must come from the SAME module
// instance, so every render re-imports LanguageContext AND the
// component after vi.resetModules().

import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { SITE_URL, resolveRouteSeo } from '../seo';

vi.mock('../../lib/auth', () => ({
  useAuth: () => ({ user: null, profile: null, saveProfile: vi.fn(() => Promise.resolve()) }),
}));

type Lang = 'bn' | 'en';

function setupWindow(lang: Lang) {
  (globalThis as unknown as { window: unknown }).window = {
    location: { pathname: `/${lang}`, search: '', href: `https://eduvelto.com/${lang}` },
    localStorage: {
      getItem: () => null,
      setItem: () => {},
    },
    history: { replaceState: () => {} },
  };
  (globalThis as unknown as { document: unknown }).document = {
    documentElement: { lang: '' },
  };
}

afterEach(() => {
  delete (globalThis as unknown as { window?: unknown }).window;
  delete (globalThis as unknown as { document?: unknown }).document;
});

async function renderComponent(lang: Lang, modulePath: string): Promise<string> {
  setupWindow(lang);
  vi.resetModules();
  const { LanguageProvider } = await import('../../i18n/LanguageContext');
  const mod = await import(modulePath);
  const Comp = mod.default as React.ComponentType;
  return renderToString(
    React.createElement(
      HelmetProvider,
      null,
      React.createElement(
        MemoryRouter,
        { initialEntries: [`/${lang}`] },
        React.createElement(LanguageProvider, null, React.createElement(Comp)),
      ),
    ),
  );
}

const LEGAL_PATHS = ['/about', '/contact', '/privacy-policy', '/terms'] as const;

describe('legal pages — SEO (both languages)', () => {
  it.each(LEGAL_PATHS)('%s resolves, indexable, with the lang-prefixed canonical', (path) => {
    for (const lang of ['bn', 'en'] as const) {
      const seo = resolveRouteSeo(path, lang);
      expect(seo, `no SEO for ${path} (${lang})`).not.toBeNull();
      expect(seo!.robots, `${path} (${lang}) robots`).toBeUndefined();
      expect(seo!.canonical).toBe(`${SITE_URL}/${lang}${path}`);
      expect(seo!.title.length, `${path} (${lang}) title`).toBeGreaterThan(10);
      expect(seo!.description.length, `${path} (${lang}) description`).toBeGreaterThan(40);
    }
  });
});

describe('legal pages — rendered copy (both languages)', () => {
  it('Privacy Policy discloses the DoubleClick DART cookie', async () => {
    const bn = await renderComponent('bn', '../../pages/PrivacyPage');
    expect(bn).toContain('DoubleClick DART কুকি');
    const en = await renderComponent('en', '../../pages/PrivacyPage');
    expect(en).toContain('DoubleClick DART cookie');
  });

  it('Privacy + Contact use the real contact email, never the invented support@ address', async () => {
    for (const page of ['PrivacyPage', 'ContactPage'] as const) {
      for (const lang of ['bn', 'en'] as const) {
        const html = await renderComponent(lang, `../../pages/${page}`);
        expect(html, `${page} (${lang})`).toContain('ahmmizan23@gmail.com');
        expect(html, `${page} (${lang})`).not.toContain('support@eduvelto.com');
      }
    }
  });

  it('About states the honest library size (609 books)', async () => {
    expect(await renderComponent('bn', '../../pages/AboutPage')).toContain('৬০৯টি বই');
    expect(await renderComponent('en', '../../pages/AboutPage')).toContain('609 books');
  });

  it('Terms carries the educational disclaimer — no guaranteed results', async () => {
    expect(await renderComponent('bn', '../../pages/TermsPage')).toContain(
      'তথ্যের নির্ভুলতা — কোনো গ্যারান্টি নেই',
    );
    expect(await renderComponent('en', '../../pages/TermsPage')).toContain(
      'Accuracy — no guarantee of results',
    );
  });
});

describe('Footer links all four legal pages (both languages)', () => {
  it('links /about, /contact, /privacy-policy and /terms with the right labels', async () => {
    const bn = await renderComponent('bn', '../../components/Footer');
    for (const path of LEGAL_PATHS) {
      expect(bn, `Footer (bn) missing ${path}`).toContain(`href="${path}"`);
    }
    for (const label of ['আমাদের সম্পর্কে', 'যোগাযোগ', 'গোপনীয়তা নীতি', 'শর্তাবলী']) {
      expect(bn, `Footer (bn) missing label ${label}`).toContain(label);
    }

    const en = await renderComponent('en', '../../components/Footer');
    for (const path of LEGAL_PATHS) {
      expect(en, `Footer (en) missing ${path}`).toContain(`href="${path}"`);
    }
    for (const label of ['About', 'Contact', 'Privacy Policy', 'Terms']) {
      expect(en, `Footer (en) missing label ${label}`).toContain(label);
    }
  });
});
