// Eduvelto — homepage tabs tests (owner 25 Nov 2026 17:40: "home page
// a tab koro sudnor kore sajiye"; 18:26: the question-maker tab).
//
// renderToString runs in plain node (no jsdom — the repo has none),
// so window/document are faked per scenario, exactly like
// AnnouncementTicker.test.tsx. Asserts: the six tabs (only sections
// that really exist), the default active tab, the controlled active
// tab, the ARIA tab wiring, the arrow-key helper (pure function), the
// tab CSS (pill bar, active teal, hidden panels, mobile scroll,
// reduced motion), and that no competitor name appears anywhere.
import { describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import React from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

vi.mock('../../lib/auth', () => ({
  useAuth: () => ({ user: null, profile: null, saveProfile: vi.fn(() => Promise.resolve()) }),
}));

const CSS_SRC = readFileSync(resolve(__dirname, '../home-redesign.css'), 'utf8');

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

type HomeTabId = 'education' | 'question-maker' | 'jobs' | 'admissions' | 'opportunities' | 'services';

async function renderTabs(stored: string | null, activeId: HomeTabId): Promise<string> {
  setupWindow(stored);
  vi.resetModules();
  const { LanguageProvider } = await import('../../i18n/LanguageContext');
  const { default: HomeTabs, HOME_TABS } = await import('../HomeTabs');
  const panels = {
    education: React.createElement('div', null, 'EDU PANEL'),
    'question-maker': React.createElement('div', null, 'QM PANEL'),
    jobs: React.createElement('div', null, 'JOBS PANEL'),
    admissions: React.createElement('div', null, 'ADMISSIONS PANEL'),
    opportunities: React.createElement('div', null, 'OPPORTUNITIES PANEL'),
    services: React.createElement('div', null, 'SERVICES PANEL'),
  };
  return renderToString(
    React.createElement(
      LanguageProvider,
      null,
      React.createElement(HomeTabs, { tabs: HOME_TABS, activeId, onActiveChange: () => undefined, panels }),
    ),
  );
}

describe('HomeTabs tabs (owner 25 Nov 17:40)', () => {
  it('renders the six real sections as tabs, Bangla labels in bn mode', async () => {
    const html = await renderTabs('bn', 'education');
    expect(html).toContain('শিক্ষা');
    expect(html).toContain('প্রশ্নপত্র তৈরি');
    expect(html).toContain('চাকরি প্রস্তুতি');
    expect(html).toContain('ভর্তি প্রস্তুতি');
    expect(html).toContain('সুযোগ কেন্দ্র');
    expect(html).toContain('AI ও সেবা');
    expect(html).toContain('সবকিছু এক জায়গায়');
    // All six panels render in the DOM (inactive ones hidden).
    for (const panel of ['EDU PANEL', 'QM PANEL', 'JOBS PANEL', 'ADMISSIONS PANEL', 'OPPORTUNITIES PANEL', 'SERVICES PANEL']) {
      expect(html).toContain(panel);
    }
  });

  it('places the question-maker tab right after education', async () => {
    setupWindow('bn');
    vi.resetModules();
    const { HOME_TABS } = await import('../HomeTabs');
    expect(HOME_TABS.map((tab) => tab.id)).toEqual([
      'education',
      'question-maker',
      'jobs',
      'admissions',
      'opportunities',
      'services',
    ]);
  });

  it('renders the English labels in en mode', async () => {
    const html = await renderTabs('en', 'education');
    expect(html).toContain('Education');
    expect(html).toContain('Question Maker');
    expect(html).toContain('Job Preparation');
    expect(html).toContain('Admission Preparation');
    expect(html).toContain('Opportunity Hub');
    expect(html).toContain('AI &amp; Services');
    expect(html).toContain('Everything in one place');
  });

  it('defaults to the education tab: only it is selected and visible', async () => {
    const html = await renderTabs('bn', 'education');
    expect(html).toContain('id="ev-home-tab-education"');
    expect(html).toMatch(/id="ev-home-tab-education"[^>]*aria-selected="true"/);
    for (const id of ['question-maker', 'jobs', 'admissions', 'opportunities', 'services']) {
      expect(html).toMatch(new RegExp(`id="ev-home-tab-${id}"[^>]*aria-selected="false"`));
    }
    // Education panel has no hidden attribute; the other five do.
    expect(html).not.toMatch(/id="ev-home-panel-education"[^>]*hidden/);
    for (const id of ['question-maker', 'jobs', 'admissions', 'opportunities', 'services']) {
      expect(html).toMatch(new RegExp(`id="ev-home-panel-${id}"[^>]*hidden`));
    }
  });

  it('controlled activeId switches to the question-maker tab and its panel', async () => {
    const html = await renderTabs('bn', 'question-maker');
    expect(html).toMatch(/id="ev-home-tab-question-maker"[^>]*aria-selected="true"/);
    expect(html).toMatch(/id="ev-home-tab-education"[^>]*aria-selected="false"/);
    expect(html).not.toMatch(/id="ev-home-panel-question-maker"[^>]*hidden/);
    expect(html).toMatch(/id="ev-home-panel-education"[^>]*hidden/);
    expect(html).toContain('QM PANEL');
  });

  it('controlled activeId switches the selected tab and the visible panel', async () => {
    const html = await renderTabs('bn', 'jobs');
    expect(html).toMatch(/id="ev-home-tab-jobs"[^>]*aria-selected="true"/);
    expect(html).toMatch(/id="ev-home-tab-education"[^>]*aria-selected="false"/);
    expect(html).not.toMatch(/id="ev-home-panel-jobs"[^>]*hidden/);
    expect(html).toMatch(/id="ev-home-panel-education"[^>]*hidden/);
  });

  it('wires tabs to panels with roles, ids and aria attributes', async () => {
    const html = await renderTabs('bn', 'education');
    expect(html).toContain('role="tablist"');
    expect(html.match(/role="tab"/g)?.length).toBe(6);
    expect(html.match(/role="tabpanel"/g)?.length).toBe(6);
    for (const id of ['education', 'question-maker', 'jobs', 'admissions', 'opportunities', 'services']) {
      expect(html).toContain(`aria-controls="ev-home-panel-${id}"`);
      expect(html).toContain(`aria-labelledby="ev-home-tab-${id}"`);
    }
    // Only the active tab is in the tab order (roving tabindex).
    expect(html.match(/tabindex="0"/g)?.length).toBe(1);
    expect(html.match(/tabindex="-1"/g)?.length).toBe(5);
  });

  it('never names a competitor in the tab labels or heading', async () => {
    const html = await renderTabs('bn', 'education');
    for (const banned of ['Proshnobanai', 'proshnobanai', 'Eproshnobank', 'eproshnobank']) {
      expect(html).not.toContain(banned);
    }
  });
});

describe('getNextTabId arrow-key navigation (pure)', () => {
  it('moves forward and backward with wrap-around', async () => {
    setupWindow('bn');
    vi.resetModules();
    const { HOME_TABS, getNextTabId } = await import('../HomeTabs');
    expect(getNextTabId(HOME_TABS, 'education', 1)).toBe('question-maker');
    expect(getNextTabId(HOME_TABS, 'question-maker', 1)).toBe('jobs');
    expect(getNextTabId(HOME_TABS, 'question-maker', -1)).toBe('education');
    expect(getNextTabId(HOME_TABS, 'jobs', -1)).toBe('question-maker');
    expect(getNextTabId(HOME_TABS, 'services', 1)).toBe('education');
    expect(getNextTabId(HOME_TABS, 'education', -1)).toBe('services');
    expect(getNextTabId(HOME_TABS, 'admissions', 1)).toBe('opportunities');
  });
});

describe('HomeTabs display (CSS)', () => {
  it('pill bar with solid-teal active tab and hidden inactive panels', () => {
    expect(CSS_SRC).toContain('.ev-home-tabbar');
    expect(CSS_SRC).toContain('border-radius: 999px');
    expect(CSS_SRC).toContain('.ev-home-tab[aria-selected="true"]');
    expect(CSS_SRC).toContain('background: var(--teal-deep)');
    expect(CSS_SRC).toContain('.ev-home-tabpanel[hidden]');
    expect(CSS_SRC).toContain('display: none');
  });

  it('scrolls horizontally on mobile and respects reduced motion', () => {
    expect(CSS_SRC).toContain('.ev-home-tabbar');
    expect(CSS_SRC).toContain('overflow-x: auto');
    const reduced = CSS_SRC.split('prefers-reduced-motion: reduce').slice(1).join('');
    expect(reduced).toContain('.ev-home-tabpanel');
    expect(reduced).toContain('animation: none');
  });

  it('gives the active tab a visible focus ring', () => {
    expect(CSS_SRC).toContain('.ev-home-tab:focus-visible');
    expect(CSS_SRC).toContain('outline: 2px solid var(--teal-text)');
  });
});
