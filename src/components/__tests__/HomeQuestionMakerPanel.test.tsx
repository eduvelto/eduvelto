// Eduvelto — homepage Question Maker tab panel tests (owner 25 Nov
// 2026 18:26: the question-making feature gets its own tab).
//
// renderToString runs in plain node (no jsdom — the repo has none),
// so window/document are faked per scenario, exactly like
// HomeTabs.test.tsx. The panel is the generator's ENTRY POINT only
// (no builder embedded): asserts the landing-page intro copy, the
// real key points (free papers, 70% offer, free OMR, custom paper,
// no login), the prominent CTA into /question-maker, and that no
// competitor name appears anywhere.
import { describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../lib/auth', () => ({
  useAuth: () => ({ user: null, profile: null, saveProfile: vi.fn(() => Promise.resolve()) }),
}));

function setupWindow(stored: string | null) {
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
    history: { replaceState: () => undefined },
  };
  (globalThis as unknown as { document: unknown }).document = {
    documentElement: { lang: '' },
  };
}

async function renderPanel(stored: string | null): Promise<string> {
  setupWindow(stored);
  vi.resetModules();
  const { LanguageProvider } = await import('../../i18n/LanguageContext');
  const { default: HomeQuestionMakerPanel } = await import('../HomeQuestionMakerPanel');
  return renderToString(
    React.createElement(
      LanguageProvider,
      null,
      React.createElement(MemoryRouter, null, React.createElement(HomeQuestionMakerPanel)),
    ),
  );
}

describe('HomeQuestionMakerPanel (owner 25 Nov 18:26)', () => {
  it('shows the landing-page intro and the real key points, Bangla', async () => {
    const html = await renderPanel('bn');
    expect(html).toContain('প্রশ্নপত্র তৈরি');
    expect(html).toContain('অধ্যায়ভিত্তিক প্রশ্নপত্র তৈরির ফ্রি টুল');
    expect(html).toContain('শুধু যাচাইকৃত অনুশীলন প্রশ্ন দিয়ে');
    expect(html).toContain('মাসে ৩টা ফ্রি পেপার (জলছাপসহ)');
    expect(html).toContain('সব প্রশ্নপত্রে ৭০% ছাড়ে');
    expect(html).toContain('OMR চেক সম্পূর্ণ ফ্রি');
    expect(html).toContain('কাস্টম পেপার ৳৪৯/পেপার');
    expect(html).toContain('লগইন ছাড়াই ব্যবহার করা যায়');
  });

  it('shows the same points in English', async () => {
    const html = await renderPanel('en');
    expect(html).toContain('Question Maker');
    expect(html).toContain('free tool for teachers and coaching centres');
    expect(html).toContain('Only verified practice questions');
    expect(html).toContain('3 free papers a month (watermarked)');
    expect(html).toContain('70% off all question papers');
    expect(html).toContain('OMR checking completely free');
    expect(html).toContain('Custom paper ৳49/paper');
    expect(html).toContain('No login needed');
  });

  it('links the prominent CTA into the full generator at /question-maker', async () => {
    const html = await renderPanel('bn');
    expect(html).toContain('href="/question-maker"');
    expect(html).toContain('প্রশ্নপত্র তৈরি করুন');
    // Secondary links: OMR evaluator + custom paper service.
    expect(html).toContain('href="/omr-evaluator"');
    expect(html).toContain('href="/custom-paper"');
  });

  it('never names a competitor', async () => {
    const html = await renderPanel('bn');
    for (const banned of ['Proshnobanai', 'proshnobanai', 'Eproshnobank', 'eproshnobank']) {
      expect(html).not.toContain(banned);
    }
  });
});
