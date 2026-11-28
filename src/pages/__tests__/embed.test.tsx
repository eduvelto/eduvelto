// Eduvelto — "Embed This Tool" tests (28 Nov 2026, growth batch item 4).
//
// Covers the embed v1 contract:
// (a) every top-20 slug has a ToolUI entry in TOOL_COMPONENTS;
// (b) buildEmbedSnippet produces the exact iframe string for 3 slugs;
// (c) EmbedToolPage renders the tool for a known slug and a minimal
//     not-found (robots noindex) for unknown / alias slugs;
// (d) no alias slug is in the top-20 list;
// plus the widget wiring on ToolsDetailPage (shown under the tool UI
// for top-20 slugs only, before the first AdSlot).
//
// Renders with renderToString in plain node (same pattern as
// toolsDetailAds.test.tsx); LanguageContext is mocked the same way.

import { describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { HelmetProvider, type HelmetServerState } from 'react-helmet-async';
import { StaticRouter } from 'react-router-dom/server';
import { Route, Routes } from 'react-router-dom';
import { TOOL_COMPONENTS } from '../ToolsDetailPage';
import ToolsDetailPage from '../ToolsDetailPage';
import EmbedToolPage from '../EmbedToolPage';
import {
  EMBEDDABLE_TOOL_SLUGS,
  buildEmbedSnippet,
  isEmbeddableTool,
} from '../../components/EmbedWidget';

const mockLangState = vi.hoisted(() => ({ lang: 'bn' as 'bn' | 'en' }));

vi.mock('../../i18n/LanguageContext', () => ({
  useLanguage: () => ({
    lang: mockLangState.lang,
    tabLang: mockLangState.lang,
    t: (entry: { bn: string; en: string }) => entry[mockLangState.lang],
    setLanguage: () => {},
    syncLanguageFromPath: () => {},
  }),
}));

const ALIAS_SLUGS = ['unit-converter', 'typing-speed-test', 'cv-builder', 'cover-letter-builder'];

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

function renderEmbedPage(location: string) {
  const helmetContext: { helmet?: HelmetServerState } = {};
  const html = renderToString(
    <HelmetProvider context={helmetContext}>
      <StaticRouter location={location}>
        <Routes>
          <Route path="/embed/:slug" element={<EmbedToolPage />} />
        </Routes>
      </StaticRouter>
    </HelmetProvider>,
  );
  return {
    html,
    title: helmetContext.helmet?.title.toString() ?? '',
    meta: helmetContext.helmet?.meta.toString() ?? '',
    link: helmetContext.helmet?.link.toString() ?? '',
  };
}

function renderToolPage(slug: string) {
  // Preview host: AdSlot renders the labelled placeholder (with
  // data-ad-placement), so the widget-before-first-slot order is
  // checkable. On the production host the slot renders nothing.
  fakeWindow('eduvelto--ads-placements-abc123.web.app');
  return renderToString(
    <StaticRouter location={`/bn/tools/${slug}`}>
      <Routes>
        <Route path="/:lang/tools/:slug" element={<ToolsDetailPage />} />
      </Routes>
    </StaticRouter>,
  );
}

describe('embed top-20 list', () => {
  it('has exactly 20 slugs, each with a ToolUI entry in TOOL_COMPONENTS', () => {
    expect(EMBEDDABLE_TOOL_SLUGS).toHaveLength(20);
    for (const slug of EMBEDDABLE_TOOL_SLUGS) {
      expect(TOOL_COMPONENTS[slug], `no ToolUI for ${slug}`).toBeDefined();
    }
  });

  it('contains the 14 owner-priority GSC slugs', () => {
    for (const slug of [
      'age-calculator',
      'bmi-calculator',
      'govt-job-age-calculator',
      'pdf-to-word',
      'pdf-merger',
      'pdf-compressor',
      'word-counter',
      'qr-code-generator',
      'ssc-hsc-gpa-calculator',
      'nu-cgpa-calculator',
      'land-measurement',
      'loan-emi-calculator',
      'assignment-cover-generator',
      'attendance-calculator',
    ]) {
      expect(isEmbeddableTool(slug)).toBe(true);
    }
  });

  it('contains the 6 extra popular calculators', () => {
    for (const slug of [
      'percentage-converter',
      'scientific-calculator',
      'compound-interest-calculator',
      'discount-vat-profit-calculator',
      'cgpa-to-percentage-converter',
      'bmr-calculator',
    ]) {
      expect(isEmbeddableTool(slug)).toBe(true);
    }
  });

  it('excludes every alias slug', () => {
    for (const slug of ALIAS_SLUGS) {
      expect(isEmbeddableTool(slug)).toBe(false);
      expect(TOOL_COMPONENTS[slug]).toBeUndefined();
    }
  });
});

describe('buildEmbedSnippet', () => {
  it('produces the exact iframe string (bn title)', () => {
    expect(buildEmbedSnippet('age-calculator', 'বয়স ক্যালকুলেটর')).toBe(
      '<iframe src="https://eduvelto.com/embed/age-calculator" width="100%" height="600" style="border:0" loading="lazy" title="বয়স ক্যালকুলেটর"></iframe>',
    );
  });

  it('produces the exact iframe string (en title)', () => {
    expect(buildEmbedSnippet('bmi-calculator', 'BMI Calculator')).toBe(
      '<iframe src="https://eduvelto.com/embed/bmi-calculator" width="100%" height="600" style="border:0" loading="lazy" title="BMI Calculator"></iframe>',
    );
  });

  it('produces the exact iframe string (pdf tool, bn title)', () => {
    expect(buildEmbedSnippet('pdf-to-word', 'পিডিএফ থেকে ওয়ার্ড')).toBe(
      '<iframe src="https://eduvelto.com/embed/pdf-to-word" width="100%" height="600" style="border:0" loading="lazy" title="পিডিএফ থেকে ওয়ার্ড"></iframe>',
    );
  });
});

describe('EmbedToolPage', () => {
  it('renders the tool for a known slug, noindex + canonical to the tool page', () => {
    mockLangState.lang = 'bn';
    const { html, meta, link } = renderEmbedPage('/embed/age-calculator');
    // AgeCalculatorTool's own label — the real tool UI, not a placeholder.
    expect(html).toContain('জন্মতারিখ');
    expect(html).toContain('Powered by Eduvelto.com');
    expect(html).toContain('href="https://eduvelto.com"');
    // No page chrome: no breadcrumb / share / guide markers.
    expect(html).not.toContain('ev-tool-desc');
    expect(meta).toContain('noindex, nofollow');
    expect(link).toContain('https://eduvelto.com/bn/tools/age-calculator');
  });

  it('renders the tool in English with ?lang=en', () => {
    mockLangState.lang = 'en';
    const { html, link } = renderEmbedPage('/embed/age-calculator?lang=en');
    expect(html).toContain('Date of birth');
    expect(html).toContain('Powered by Eduvelto.com');
    expect(link).toContain('https://eduvelto.com/en/tools/age-calculator');
  });

  it('renders a minimal not-found for an unknown slug', () => {
    mockLangState.lang = 'bn';
    const { html, meta } = renderEmbedPage('/embed/not-a-tool');
    expect(html).toContain('এই ঠিকানায় কোনো এমবেডযোগ্য টুল নেই।');
    expect(html).not.toContain('Powered by Eduvelto.com');
    expect(meta).toContain('noindex, nofollow');
  });

  it('renders a not-found for alias slugs (no single ToolUI to embed)', () => {
    mockLangState.lang = 'bn';
    for (const slug of ALIAS_SLUGS) {
      const { html } = renderEmbedPage(`/embed/${slug}`);
      expect(html).toContain('এই ঠিকানায় কোনো এমবেডযোগ্য টুল নেই।');
    }
  });
});

describe('EmbedWidget on ToolsDetailPage', () => {
  it('shows the snippet under the tool UI for a top-20 slug', () => {
    mockLangState.lang = 'bn';
    const html = renderToolPage('bmi-calculator');
    expect(html).toContain('আপনার ওয়েবসাইটে এমবেড করুন');
    expect(html).toContain('https://eduvelto.com/embed/bmi-calculator');
    expect(html).toContain('কপি করুন');
    // Widget sits before the first AdSlot: the snippet appears before
    // the in-content slot marker in the rendered output.
    expect(html.indexOf('eduvelto.com/embed/bmi-calculator')).toBeLessThan(
      html.indexOf('in-content'),
    );
  });

  it('does not show the widget for a tool outside the top-20', () => {
    mockLangState.lang = 'bn';
    const html = renderToolPage('weather');
    expect(html).not.toContain('আপনার ওয়েবসাইটে এমবেড করুন');
    expect(html).not.toContain('eduvelto.com/embed/weather');
  });
});
