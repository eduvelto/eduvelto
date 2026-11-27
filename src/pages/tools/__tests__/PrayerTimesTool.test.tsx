// Eduvelto — server-rendered HTML evidence for PrayerTimesTool
// (100-Tools Project, Phase 2, Wave 3).
//
// renderToString runs in plain node (no jsdom): it proves the form
// renders (date / latitude / longitude / time-zone inputs) in bn AND
// en, and that the default Dhaka inputs produce a real six-time table
// (HH:MM) with the honest method note — no bogus result, no error.

import { describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import React from 'react';

vi.mock('../../../lib/auth', () => ({
  useAuth: () => ({ user: null, profile: null, saveProfile: vi.fn(() => Promise.resolve()) }),
}));

async function renderTool(storedLang?: string): Promise<string> {
  const store: Record<string, string> = {};
  if (storedLang) store['eduvelto-language'] = storedLang;
  (globalThis as unknown as { window: unknown }).window = {
    location: { hostname: 'eduvelto.web.app', search: '', href: 'https://eduvelto.web.app/' },
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
  vi.resetModules();
  const [toolMod, ctxMod] = await Promise.all([
    import('../PrayerTimesTool'),
    import('../../../i18n/LanguageContext'),
  ]);
  const { PrayerTimesTool } = toolMod;
  const { LanguageProvider } = ctxMod;
  try {
    return renderToString(
      React.createElement(LanguageProvider, null, React.createElement(PrayerTimesTool)),
    );
  } finally {
    delete (globalThis as unknown as { window?: unknown }).window;
    delete (globalThis as unknown as { document?: unknown }).document;
  }
}

describe('PrayerTimesTool rendered HTML', () => {
  it('renders the form with Dhaka defaults in Bangla', async () => {
    const html = await renderTool();
    expect(html).toContain('নামাজের সময়');
    expect(html).toContain('তারিখ');
    expect(html).toContain('অক্ষাংশ');
    expect(html).toContain('দ্রাঘিমাংশ');
    expect(html).toContain('id="prayer-date"');
    expect(html).toContain('id="prayer-lat"');
    expect(html).toContain('value="23.8103"');
    expect(html).toContain('value="90.4125"');
    expect(html).toContain('value="6"');
  });

  it('renders the six prayer times as HH:MM with the method note (no error)', async () => {
    const html = await renderTool();
    for (const label of ['ফজর', 'সূর্যোদয়', 'যোহর', 'আসর', 'মাগরিব', 'ইশা']) {
      expect(html).toContain(label);
    }
    // Six HH:MM times (defaults are valid Dhaka inputs, so a real table shows).
    expect(html.match(/\d{2}:\d{2}/g)?.length).toBeGreaterThanOrEqual(6);
    expect(html).toContain('মুসলিম ওয়ার্ল্ড লীগ');
    expect(html).toContain('কয়েক মিনিট');
    expect(html).not.toContain('role="alert"');
  });

  it('follows the selected language (English)', async () => {
    const html = await renderTool('en');
    expect(html).toContain('Prayer times');
    expect(html).toContain('Latitude');
    expect(html).toContain('Longitude');
    expect(html).toContain('Fajr');
    expect(html).toContain('Sunrise');
    expect(html).toContain('Dhuhr');
    expect(html).toContain('Muslim World League');
    expect(html).not.toContain('নামাজের সময়');
  });
});
