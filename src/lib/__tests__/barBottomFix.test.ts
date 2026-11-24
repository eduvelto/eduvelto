// Eduvelto — CSS contract for the 24 Nov 2026 owner-reported fixes
// (bar truncation + bottom-bar position + right-side menu drawer).
//
// These three bugs were all caused by CSS values that a DOM probe at
// 390px could not catch (the owner's phone is ~360 CSS px with
// wider-rendering fonts): the greeting line was one-line + ellipsis,
// the shell's bottom clearance exactly equalled the nav height (zero
// margin), and the menu panel was a bottom sheet. Pin the load-bearing
// declarations here so a future edit cannot silently reintroduce them.
//
// The assertions read src/index.css and inspect the RULE BLOCKS (with
// comments stripped — the comments themselves mention the forbidden
// values). Behaviour (wrap, clearance, drawer slide) is verified by
// the Playwright probe in bar-bottom-fix-evidence/.
//
// Run: npx vitest run src/lib/__tests__/barBottomFix.test.ts
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const CSS = readFileSync(resolve(__dirname, '../../index.css'), 'utf8');

function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

function ruleBlock(css: string, selector: string): string {
  const clean = stripComments(css);
  const re = new RegExp(
    selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*\\{([^}]*)\\}',
  );
  const m = clean.match(re);
  if (!m) throw new Error(`CSS rule not found: ${selector}`);
  return m[1];
}

function allRuleBlocks(css: string, selector: string): string[] {
  const clean = stripComments(css);
  const re = new RegExp(
    selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*\\{([^}]*)\\}',
    'g',
  );
  return [...clean.matchAll(re)].map((m) => m[1]);
}

describe('bar + bottom-nav CSS contract (owner 24 Nov 2026)', () => {
  it('greeting line NEVER truncates: no nowrap, no hidden overflow, no ellipsis', () => {
    const block = ruleBlock(CSS, '.ev-hero-greeting-line');
    expect(block).not.toMatch(/white-space\s*:\s*nowrap/);
    expect(block).not.toMatch(/overflow\s*:\s*hidden/);
    expect(block).not.toMatch(/text-overflow\s*:\s*ellipsis/);
    // Free wrapping is the fix: the sentence takes a second line on
    // narrow screens instead of being cut.
    expect(block).toMatch(/overflow-wrap\s*:\s*break-word/);
  });

  it('v6 cycle: gentle fade-in on phase switch + Arabic line class exist', () => {
    // Owner 24 Nov 11:31 — the bar cycles ar → en → bn. The line
    // re-mounts per phase (key={phase}); this fade is the ONLY
    // animation on the bar (no sweep, no slide, no border).
    const block = ruleBlock(CSS, '.ev-hero-greeting-line');
    expect(block).toMatch(/animation\s*:\s*ev-greeting-fade-in/);
    expect(stripComments(CSS)).toMatch(/@keyframes ev-greeting-fade-in/);
    const arBlock = ruleBlock(CSS, '.ev-hero-greeting-line-ar');
    expect(arBlock).toMatch(/font-size\s*:\s*22px/);
    // Reduced motion: the fade is disabled (the hook freezes the
    // phase on Arabic, so the static ayah shows instantly).
    expect(stripComments(CSS)).toMatch(
      /prefers-reduced-motion:\s*reduce[\s\S]*?\.ev-hero-greeting-line\s*\{[^}]*animation\s*:\s*none/,
    );
  });

  it('shell bottom clearance EXCEEDS the 60px nav height (breathing room)', () => {
    const blocks = allRuleBlocks(CSS, '.ev-app-shell');
    expect(blocks.length).toBeGreaterThanOrEqual(2);
    // The mobile reserve: 60px nav + 16px gap = 76px (banner reserve
    // rides on top via var(--ev-banner)). Zero-margin 60px let the
    // footer touch the nav at max scroll (measured 0.4px overlap).
    expect(blocks.some((b) => /padding-bottom\s*:\s*calc\(76px/.test(b))).toBe(
      true,
    );
    expect(blocks.some((b) => /padding-bottom\s*:\s*calc\(60px/.test(b))).toBe(
      false,
    );
  });

  it('bottom-nav labels never wrap (a wrapped label grows the nav past 60px)', () => {
    const block = ruleBlock(CSS, '.ev-bottom-nav-link');
    expect(block).toMatch(/white-space\s*:\s*nowrap/);
    expect(block).toMatch(/min-height\s*:\s*58px/);
  });

  it('menu panel is a RIGHT-side drawer, not a bottom sheet', () => {
    const backdrop = ruleBlock(CSS, '.ev-sheet-backdrop');
    expect(backdrop).toMatch(/justify-content\s*:\s*flex-end/);
    expect(backdrop).toMatch(/align-items\s*:\s*stretch/);
    expect(backdrop).not.toMatch(/align-items\s*:\s*flex-end/);
    // The drawer is full-height, so its top sits under the sticky
    // header (z-index 50) — the backdrop must exceed 50 or the header
    // paints over the drawer's Close button (caught by probe).
    const z = backdrop.match(/z-index\s*:\s*(\d+)/);
    expect(z).not.toBeNull();
    expect(Number(z![1])).toBeGreaterThan(50);

    const sheet = ruleBlock(CSS, '.ev-sheet');
    expect(sheet).toMatch(/width\s*:\s*min\(340px,\s*88vw\)/);
    expect(sheet).toMatch(/height\s*:\s*100%/);
    expect(sheet).toMatch(/animation\s*:\s*ev-sheet-in/);
    expect(sheet).not.toMatch(/max-height\s*:\s*70vh/);

    const clean = stripComments(CSS);
    expect(clean).toMatch(/@keyframes ev-sheet-in[\s\S]*?translateX\(100%\)/);
    expect(clean).toMatch(/@keyframes ev-sheet-out[\s\S]*?translateX\(100%\)/);
    expect(clean).toMatch(/\.ev-sheet-closing\s*\{[^}]*animation\s*:\s*ev-sheet-out/);
  });

  it('BottomNav wires the drawer close animation (exit slide to the right)', () => {
    const tsx = readFileSync(
      resolve(__dirname, '../../components/BottomNav.tsx'),
      'utf8',
    );
    expect(tsx).toContain('ev-sheet-closing');
    expect(tsx).toContain('closeSheet');
    // Backdrop tap and the Close button both use the animated close.
    expect(tsx).toMatch(/onClick=\{closeSheet\}/);
  });
});
