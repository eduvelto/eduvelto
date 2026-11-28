// Eduvelto — alias tool hubs + library sentence tests (28 Nov 2026,
// SEO/meta batch).
//
// The 4 alias tool slugs (typing-speed-test, cv-builder,
// cover-letter-builder, unit-converter) render full hub pages via
// ToolsDetailPage's alias dispatch instead of the shared tool
// layout, so they missed the EditorialBadge every other tool page
// carries. These tests pin the badge on the three hub components
// themselves (JobTypingPage, OpportunityCvBuilderPage,
// LifeConvertersPage) in both languages. LibraryPage must state
// plainly, on the page itself, that Class 6–8 books have not
// arrived in the library yet.
//
// renderToString in plain node (no jsdom — the repo has none), same
// pattern as HomeQuestionMakerPanel.test.tsx: window/document are
// faked per render, modules are reset, and the real
// LanguageProvider + page are dynamically imported so they share
// one fresh module graph.
import { describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { EDITORIAL_BADGE_BN, EDITORIAL_BADGE_EN } from '../../components/EditorialBadge';

vi.mock('../../lib/auth', () => ({
  useAuth: () => ({ user: null, profile: null, saveProfile: vi.fn(() => Promise.resolve()) }),
}));

vi.mock('../../lib/content', () => ({
  getAllPublishedBooksCached: () => Promise.resolve([]),
  listPublishedBooksPage: () => Promise.resolve({ items: [], lastDoc: null, hasMore: false }),
  listPublishedBooksPageById: () => Promise.resolve({ items: [], lastDocId: null }),
  sortBooks: (books: unknown[]) => books,
  PAGE_SIZE: 50,
}));

vi.mock('../../lib/initialData', () => ({
  takeLibraryInitialData: () => null,
}));

function setupWindow(lang: 'bn' | 'en') {
  const store: Record<string, string> = { 'eduvelto-language': lang };
  (globalThis as unknown as { window: unknown }).window = {
    location: { search: '', href: 'https://eduvelto.com/', hostname: 'eduvelto.com' },
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
    title: 'Eduvelto',
  };
}

type HubPage = 'typing' | 'cv' | 'converters' | 'library';

async function renderPage(page: HubPage, lang: 'bn' | 'en'): Promise<string> {
  setupWindow(lang);
  vi.resetModules();
  const { LanguageProvider } = await import('../../i18n/LanguageContext');
  let Page: React.ComponentType;
  if (page === 'typing') ({ default: Page } = await import('../JobTypingPage'));
  else if (page === 'cv') ({ default: Page } = await import('../OpportunityCvBuilderPage'));
  else if (page === 'converters') ({ default: Page } = await import('../LifeConvertersPage'));
  else ({ default: Page } = await import('../LibraryPage'));
  return renderToString(
    React.createElement(
      LanguageProvider,
      null,
      React.createElement(MemoryRouter, null, React.createElement(Page)),
    ),
  );
}

describe('alias tool hubs carry the EditorialBadge (28 Nov 2026)', () => {
  const hubs: Array<{ page: HubPage; slug: string }> = [
    { page: 'typing', slug: 'typing-speed-test' },
    { page: 'cv', slug: 'cv-builder + cover-letter-builder' },
    { page: 'converters', slug: 'unit-converter' },
  ];
  for (const { page, slug } of hubs) {
    it(`${slug} renders the badge in Bangla`, async () => {
      const html = await renderPage(page, 'bn');
      expect(html).toContain(EDITORIAL_BADGE_BN);
      expect(html).not.toContain('Verified: Eduvelto Education');
    });

    it(`${slug} renders the badge in English`, async () => {
      const html = await renderPage(page, 'en');
      // renderToString escapes & as &amp;.
      expect(html).toContain(EDITORIAL_BADGE_EN.replace('&', '&amp;'));
      expect(html).not.toContain('যাচাইকৃত');
    });
  }
});

describe('LibraryPage states Class 6–8 books have not arrived (28 Nov 2026)', () => {
  it('shows the sentence in Bangla', async () => {
    const html = await renderPage('library', 'bn');
    expect(html).toContain('শ্রেণি ৬–৮-এর বই এখনো লাইব্রেরিতে আসেনি।');
  });

  it('shows the sentence in English', async () => {
    const html = await renderPage('library', 'en');
    expect(html).toContain('Class 6–8 books have not arrived in the library yet.');
  });
});
