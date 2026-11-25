/**
 * Eduvelto unit tests — dark-mode theme (22 Nov 2026, owner: "dark mode
 * ta o tik kore daw"). Pure helpers only — no window/document: the
 * provider itself is exercised by the preview check.
 * Run: npx vitest run src/lib/__tests__/theme.test.ts
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolveInitialTheme, applyThemeToDocument } from '../theme';

describe('resolveInitialTheme', () => {
  it('a stored choice wins over the OS preference', () => {
    expect(resolveInitialTheme('dark', false)).toBe('dark');
    expect(resolveInitialTheme('light', true)).toBe('light');
  });
  it('no stored choice falls back to the OS preference', () => {
    expect(resolveInitialTheme(null, true)).toBe('dark');
    expect(resolveInitialTheme(null, false)).toBe('light');
  });
});

describe('applyThemeToDocument', () => {
  function fakeDoc() {
    const meta = {
      content: '',
      setAttribute(k: string, v: string) {
        if (k === 'content') this.content = v;
      },
    };
    return {
      documentElement: { dataset: {} as Record<string, string | undefined> },
      querySelector: (sel: string) => (sel === 'meta[name="theme-color"]' ? meta : null),
      meta,
    };
  }
  it('dark sets data-theme=dark and a dark theme-color', () => {
    const doc = fakeDoc();
    applyThemeToDocument('dark', doc);
    expect(doc.documentElement.dataset.theme).toBe('dark');
    expect(doc.meta.content).toBe('#0f1b24');
  });
  it('light sets data-theme=light and the navy theme-color', () => {
    const doc = fakeDoc();
    applyThemeToDocument('light', doc);
    expect(doc.documentElement.dataset.theme).toBe('light');
    expect(doc.meta.content).toBe('#142b3b');
  });
  it('does not crash when the theme-color meta is absent', () => {
    const doc = {
      documentElement: { dataset: {} as Record<string, string | undefined> },
      querySelector: () => null,
    };
    expect(() => applyThemeToDocument('dark', doc)).not.toThrow();
    expect(doc.documentElement.dataset.theme).toBe('dark');
  });
});

describe('dark-mode CSS contract', () => {
  const css = readFileSync(fileURLToPath(new URL('../../index.css', import.meta.url)), 'utf8');

  it('defines a dark variable block', () => {
    expect(css).toContain('html[data-theme="dark"] {');
    expect(css).toContain('--bg: #0f1b24;');
    expect(css).toContain('--card: #1a2b38;');
    expect(css).toContain('--ink: #e8eef2;');
  });

  it('has no leftover hardcoded light surfaces or text colours', () => {
    // Every one of these was a light-mode surface/text/border that
    // stayed light in dark mode before this fix.
    for (const gone of [
      'border: 1px solid #e3e7ea;',
      'background: #eaf3fb;',
      'color: #3a444b;',
      'color: #68747b;',
      'color: #8a6100;',
      'background: #f8fafb;',
      'background: #e8f5e9;',
    ]) {
      expect(css, `still present: ${gone}`).not.toContain(gone);
    }
    // No plain `color: var(--forest)` text colour remains (the one
    // match is `border-top-color` on the spinner, which the dark
    // override block handles).
    expect(css).not.toMatch(/(?<![\w-])color: var\(--forest\);/);
    // Exactly two `background: #fff;` and one
    // `border: 1px solid #e5e8e5;` remain: the Coming-Soon chip,
    // which is deliberately hardcoded light (see the test below),
    // plus the QPG paper-preview guard (`.ev-qpg-theme
    // .qpg-print-area`), which MUST stay black-on-white in both
    // themes for print/scan fidelity (Phase 2, spec §5 GUARD).
    expect(css.match(/background: #fff;/g)?.length ?? 0).toBe(2);
    expect(css.match(/border: 1px solid #e5e8e5;/g)?.length ?? 0).toBe(1);
  });

  it('keeps the QPG paper preview hardcoded white in both themes (print/scan fidelity)', () => {
    expect(css).toContain('.ev-qpg-theme .qpg-print-area {');
    expect(css).toMatch(/\.ev-qpg-theme \.qpg-print-area \{[^}]*background: #fff;/);
    // No dark-mode override may recolor it.
    expect(css).not.toMatch(/html\[data-theme="dark"\] \.ev-qpg-theme \.qpg-print-area \{/);
  });

  it('keeps the Coming-Soon chip hardcoded light (its parent tint is light in both themes)', () => {
    expect(css).toContain('.ev-coming-soon-chip {');
    expect(css).toMatch(/\.ev-coming-soon-chip \{[^}]*background: #fff;/);
  });
});
