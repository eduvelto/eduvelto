// Eduvelto — ToolsDetailPage renders the structured guide (27 Nov 2026,
// AdSense guides).
//
// A tool with a structured guide shows its title, how-to steps and FAQ;
// a tool with only a legacy prose guide keeps the prose paragraph; a
// tool with no guide shows neither. Renders with renderToString in
// plain node (no jsdom), the same pattern as toolHubLinks.test.tsx.
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
});
