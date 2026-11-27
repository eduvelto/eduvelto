// Eduvelto — tool-hub links point at the canonical lang-prefixed URL
// (27 Nov 2026 SEO pass).
//
// Bare /tools/:slug links hit <LegacyRedirect /> (client-side redirect
// to /:lang/tools/:slug) — a redirect hop for crawlers and users alike.
// The Tools hub, the Life hub's All Free Tools section and the detail
// page's related-tools cards must link straight at /:lang/tools/:slug.
// Renders both hubs with renderToString in plain node (no jsdom), the
// same pattern as the LabTestResultCheckerTool test.
import { describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import React from 'react';
import { StaticRouter } from 'react-router-dom/server';
import ToolsHubPage from '../ToolsHubPage';
import LifeHubPage from '../LifeHubPage';
import { TOOLS_META } from '../../lib/toolsMeta';

vi.mock('../../i18n/LanguageContext', () => ({
  useLanguage: () => ({
    lang: 'bn',
    tabLang: 'bn',
    t: (entry: { bn: string; en: string }) => entry.bn,
    setLanguage: () => {},
  }),
}));

function renderPage(path: string, element: React.ReactElement): string {
  return renderToString(<StaticRouter location={path}>{element}</StaticRouter>);
}

describe('tool-hub links point at the canonical lang-prefixed URL', () => {
  it('ToolsHubPage links every tool as /bn/tools/:slug (never bare /tools/:slug)', () => {
    const html = renderPage('/bn/tools', <ToolsHubPage />);
    expect(html).toContain('href="/bn/tools/bmi-calculator"');
    expect(html).not.toContain('href="/tools/');
    for (const tool of TOOLS_META) {
      expect(html, `missing hub link for ${tool.slug}`).toContain(`href="/bn/tools/${tool.slug}"`);
    }
  });

  it("LifeHubPage's All Free Tools section links every tool as /bn/tools/:slug", () => {
    const html = renderPage('/bn/life', <LifeHubPage />);
    expect(html).toContain('সব ফ্রি টুলস');
    expect(html).not.toContain('href="/tools/');
    for (const tool of TOOLS_META) {
      expect(html, `missing life link for ${tool.slug}`).toContain(`href="/bn/tools/${tool.slug}"`);
    }
  });
});
