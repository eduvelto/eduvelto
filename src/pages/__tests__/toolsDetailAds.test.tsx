// Eduvelto — ads rollout B1: display slots on tool pages (27 Nov 2026).
//
// ToolsDetailPage mounts in-content (below the tool UI) + in-content-2
// (before Related tools) for EVERY tool slug, once each; Lab's own
// local slots were removed, so the Lab page must still show exactly
// one of each (no doubling to four). LifePdfToolsPage is a standalone
// route (/life/pdf-tools, no tool slug aliases to it) with real tool
// content and mounts its own two slots directly. Renders with
// renderToString in plain node (same pattern as toolGuideRender.test.tsx);
// the window hostname is faked per scenario (same pattern as
// AdSlot.test.tsx): a preview host shows the labelled placeholder,
// production renders nothing while AdSense IDs are unconfigured.
import { describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { Route, Routes } from 'react-router-dom';
import ToolsDetailPage from '../ToolsDetailPage';
import LifePdfToolsPage from '../LifePdfToolsPage';

const mockLangState = vi.hoisted(() => ({ lang: 'bn' as 'bn' | 'en' }));

vi.mock('../../i18n/LanguageContext', () => ({
  useLanguage: () => ({
    lang: mockLangState.lang,
    tabLang: mockLangState.lang,
    t: (entry: { bn: string; en: string }) => entry[mockLangState.lang],
    setLanguage: () => {},
  }),
}));

const PREVIEW_HOST = 'eduvelto--ads-placements-abc123.web.app';
const PRODUCTION_HOST = 'eduvelto.com';

function fakeWindow(hostname: string): void {
  (globalThis as unknown as { window: unknown }).window = {
    location: { hostname, search: '', href: `https://${hostname}/` },
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

function clearFakeWindow(): void {
  delete (globalThis as unknown as { window?: unknown }).window;
  delete (globalThis as unknown as { document?: unknown }).document;
}

function renderTool(hostname: string, path: string): string {
  fakeWindow(hostname);
  try {
    return renderToString(
      <StaticRouter location={path}>
        <Routes>
          <Route path="/:lang/tools/:slug" element={<ToolsDetailPage />} />
        </Routes>
      </StaticRouter>,
    );
  } finally {
    clearFakeWindow();
  }
}

function countPlacements(html: string, placement: string): number {
  return html.split(`data-ad-placement="${placement}"`).length - 1;
}

describe('ToolsDetailPage ad slots (ads rollout B1)', () => {
  it('mounts in-content + in-content-2 exactly once each on a preview host', () => {
    mockLangState.lang = 'bn';
    const html = renderTool(PREVIEW_HOST, '/bn/tools/bmi-calculator');
    expect(countPlacements(html, 'in-content')).toBe(1);
    expect(countPlacements(html, 'in-content-2')).toBe(1);
    expect(html).toContain('বিজ্ঞাপনের স্থান');
  });

  it('renders no slot at all on production while AdSense IDs are unconfigured', () => {
    mockLangState.lang = 'bn';
    const html = renderTool(PRODUCTION_HOST, '/bn/tools/bmi-calculator');
    expect(countPlacements(html, 'in-content')).toBe(0);
    expect(countPlacements(html, 'in-content-2')).toBe(0);
    expect(html).not.toContain('adsbygoogle');
  });

  it('Lab page shows exactly one of each — no doubling after the local slots were removed', () => {
    mockLangState.lang = 'bn';
    const html = renderTool(PREVIEW_HOST, '/bn/tools/lab-test-result-checker');
    expect(countPlacements(html, 'in-content')).toBe(1);
    expect(countPlacements(html, 'in-content-2')).toBe(1);
  });

  it('standalone LifePdfToolsPage (/life/pdf-tools) mounts its own two slots', () => {
    mockLangState.lang = 'bn';
    fakeWindow(PREVIEW_HOST);
    try {
      const html = renderToString(
        <StaticRouter location="/life/pdf-tools">
          <LifePdfToolsPage />
        </StaticRouter>,
      );
      expect(countPlacements(html, 'in-content')).toBe(1);
      expect(countPlacements(html, 'in-content-2')).toBe(1);
    } finally {
      clearFakeWindow();
    }
  });

  it('slots do not displace the guide: a guided tool still shows its guide', () => {
    mockLangState.lang = 'bn';
    const html = renderTool(PREVIEW_HOST, '/bn/tools/bmi-calculator');
    expect(html).toContain('কীভাবে ব্যবহার করবেন');
    expect(countPlacements(html, 'in-content')).toBe(1);
    expect(countPlacements(html, 'in-content-2')).toBe(1);
  });

  it('alias pages bypass the wrapper: the CV-builder alias renders no wrapper slots', () => {
    mockLangState.lang = 'bn';
    const html = renderTool(PREVIEW_HOST, '/bn/tools/cover-letter-builder');
    expect(countPlacements(html, 'in-content')).toBe(0);
    expect(countPlacements(html, 'in-content-2')).toBe(0);
  });
});
