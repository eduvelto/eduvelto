// Eduvelto — ToolsDetailPage renders the structured guide (27 Nov 2026,
// AdSense guides).
//
// A tool with a structured guide shows its title, how-to steps and FAQ;
// a tool with only a legacy prose guide keeps the prose paragraph; a
// tool with no guide shows neither. Renders with renderToString in
// plain node (no jsdom), the same pattern as toolHubLinks.test.tsx.
//
// NOTE (27 Nov 2026): all 12 prose guides were converted to structured
// guides, so no live tool exercises the prose fallback any more. The
// fallback test below simulates a prose-only tool by hiding
// ovulation-calculator's structured guide (real prose data still flows
// through toolGuideBySlug), so the fallback path stays covered.
import { describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { Route, Routes } from 'react-router-dom';
import ToolsDetailPage from '../ToolsDetailPage';
import { TOOL_GUIDE_SECTIONS } from '../../lib/toolsGuides';

const mockLangState = vi.hoisted(() => ({ lang: 'bn' as 'bn' | 'en' }));

vi.mock('../../i18n/LanguageContext', () => ({
  useLanguage: () => ({
    lang: mockLangState.lang,
    tabLang: mockLangState.lang,
    t: (entry: { bn: string; en: string }) => entry[mockLangState.lang],
    setLanguage: () => {},
  }),
}));

// Hide ovulation-calculator's structured guide so the fallback test can
// exercise the prose path with real prose data (see NOTE above).
vi.mock('../../lib/toolsGuides', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../lib/toolsGuides')>();
  return {
    ...actual,
    toolGuideSectionsBySlug: (slug: string) =>
      slug === 'ovulation-calculator' ? undefined : actual.toolGuideSectionsBySlug(slug),
  };
});

function renderTool(path: string): string {
  return renderToString(
    <StaticRouter location={path}>
      <Routes>
        <Route path="/:lang/tools/:slug" element={<ToolsDetailPage />} />
      </Routes>
    </StaticRouter>,
  );
}

// renderToString escapes apostrophes as &#x27; — normalise before matching.
function escaped(text: string): string {
  return text.replace(/'/g, '&#x27;');
}

describe('ToolsDetailPage guide rendering', () => {
  it('renders the structured guide for a tool that has one (bn)', () => {
    mockLangState.lang = 'bn';
    const html = renderTool('/bn/tools/bmi-calculator');
    const guide = TOOL_GUIDE_SECTIONS['bmi-calculator'].bn;
    expect(html).toContain(guide.title);
    expect(html).toContain('কীভাবে ব্যবহার করবেন');
    expect(html).toContain(guide.howTo[0].slice(0, 30));
    expect(html).toContain(escaped(guide.faq[0].q));
    expect(html).toContain('সচরাচর প্রশ্ন');
  });

  it('renders the structured guide for a tool that has one (en)', () => {
    mockLangState.lang = 'en';
    const html = renderTool('/en/tools/bmi-calculator');
    const guide = TOOL_GUIDE_SECTIONS['bmi-calculator'].en;
    expect(html).toContain(guide.title);
    expect(html).toContain('How to use it');
    expect(html).toContain(escaped(guide.faq[0].q));
  });

  it('falls back to the prose guide for a tool with no structured guide', () => {
    mockLangState.lang = 'bn';
    const html = renderTool('/bn/tools/ovulation-calculator');
    expect(html).toContain('বিস্তারিত গাইড');
    expect(html).not.toContain('কীভাবে ব্যবহার করবেন');
    expect(html).not.toContain('সচরাচর প্রশ্ন');
  });

  it('renders no guide section for a tool with no guide at all', () => {
    // unit-converter is an alias slug (no structured or prose guide):
    // it renders its alias page, never ToolsDetailPage's guide section.
    mockLangState.lang = 'bn';
    const html = renderTool('/bn/tools/unit-converter');
    expect(html).not.toContain('বিস্তারিত গাইড');
    expect(html).not.toContain('কীভাবে ব্যবহার করবেন');
    expect(html).not.toContain('সচরাচর প্রশ্ন');
  });

  it('renders the FAQPage JSON-LD script for a tool with FAQs (bn)', () => {
    // Tool-SEO program (27 Nov 2026): the FAQPage script comes from the
    // guide's FAQs and carries the same canonical as resolveRouteSeo.
    mockLangState.lang = 'bn';
    const html = renderTool('/bn/tools/bmi-calculator');
    const guide = TOOL_GUIDE_SECTIONS['bmi-calculator'].bn;
    expect(html).toContain('application/ld+json');
    expect(html).toContain('"@type":"FAQPage"');
    const questions = html.match(/"@type":"Question"/g) ?? [];
    expect(questions.length).toBe(guide.faq.length);
    expect(html).toContain('https://eduvelto.com/bn/tools/bmi-calculator#faq');
  });

  it('renders exactly 5 related tool links (same-category first)', () => {
    // Tool-SEO program (27 Nov 2026): relatedToolsFor(meta, 5).
    mockLangState.lang = 'bn';
    const html = renderTool('/bn/tools/bmi-calculator');
    const links = html.match(/href="\/bn\/tools\/[a-z0-9-]+"/g) ?? [];
    expect(links.length).toBe(5);
    expect(new Set(links).size).toBe(5);
  });
});
