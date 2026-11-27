// Eduvelto — server-rendered HTML evidence for LabTestResultCheckerTool.
//
// renderToString runs in plain node (no jsdom): it proves the disclaimer,
// search box, checker inputs, tab labels and the default FBS panel render
// in bn AND en, and that the empty initial state shows no result card.
// Interpretation correctness is covered by the pure-logic tests in
// src/lib/__tests__/tools/healthTests.test.ts.
import { describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import React from 'react';

vi.mock('../../../lib/auth', () => ({
  useAuth: () => ({ user: null, profile: null, saveProfile: vi.fn(() => Promise.resolve()) }),
}));

async function renderTool(stored?: string | null): Promise<string> {
  const store: Record<string, string> = {};
  if (stored) store['eduvelto-language'] = stored;
  (globalThis as unknown as { window: unknown }).window = {
    location: { hostname: 'eduvelto.web.app', pathname: '/', search: '', href: 'https://eduvelto.web.app/' },
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
    import('../LabTestResultCheckerTool'),
    import('../../../i18n/LanguageContext'),
  ]);
  const { LabTestResultCheckerTool } = toolMod;
  const { LanguageProvider } = ctxMod;
  try {
    return renderToString(
      React.createElement(LanguageProvider, null, React.createElement(LabTestResultCheckerTool)),
    );
  } finally {
    delete (globalThis as unknown as { window?: unknown }).window;
    delete (globalThis as unknown as { document?: unknown }).document;
  }
}

describe('LabTestResultCheckerTool rendered HTML', () => {
  it('renders the disclaimer, search box and checker in Bangla by default', async () => {
    const html = await renderTool();
    expect(html).toContain('এটি শুধু তথ্য, রোগ নির্ণয় নয়');
    expect(html).toContain('আপনার রিপোর্টে ল্যাবের নিজের range-ই আসল');
    expect(html).toContain('পরীক্ষা খুঁজুন');
    expect(html).toContain('ফাস্টিং ব্লাড সুগার');
    expect(html).toContain('স্বাভাবিক সীমা');
    expect(html).toContain('ফলাফল দেখুন');
    expect(html).toContain('ফলাফল যাচাই');
    expect(html).toContain('সব পরীক্ষা');
    expect(html).toContain('লক্ষণ দিয়ে খুঁজুন');
    expect(html).toContain('আমার ইতিহাস');
    expect(html).toContain('আপনার মান');
    expect(html).toContain('একক');
  });

  it('renders the same tool in English when the stored language is en', async () => {
    const html = await renderTool('en');
    expect(html).toContain('Lab Test Result Checker');
    expect(html).toContain('This is information only, not a diagnosis');
    expect(html).toContain('Fasting Blood Sugar');
    expect(html).toContain('Check result');
    expect(html).toContain('All tests');
    expect(html).toContain('Find by symptom');
    expect(html).toContain('My history');
    expect(html).toContain('Your value');
  });

  it('shows no result card before a check (no band label yet)', async () => {
    const html = await renderTool();
    expect(html).not.toContain('ডাক্তারের জন্য সারসংক্ষেপ');
    expect(html).not.toContain('ইতিহাসে সংরক্ষণ করুন');
  });

  it('states that everything runs in the browser and nothing is sent anywhere', async () => {
    const html = await renderTool();
    expect(html).toContain('আমার ইতিহাস');
    expect(html).toContain('সব হিসাব আপনার ব্রাউজারেই হয়');
  });
});
