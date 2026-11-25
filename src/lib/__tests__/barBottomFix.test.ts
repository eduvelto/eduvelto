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
// 25 Nov 2026: the ayah bar (HeroGreeting) was REMOVED by the owner
// ("takbe na") and replaced by the announcement ticker
// (AnnouncementTicker). The two greeting-bar tests below were rewritten
// to the ticker's equivalent contract: items scroll whole instead of
// truncating, the scroll is slow, and reduced motion stops it.
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
  it('ticker items NEVER truncate: no ellipsis — the marquee scrolls whole items', () => {
    const block = ruleBlock(CSS, '.ev-ticker-item');
    // Marquee items stay whole (nowrap) and scroll through; they are
    // never cut with an ellipsis the way the old greeting line was
    // on the owner's phone.
    expect(block).toMatch(/white-space\s*:\s*nowrap/);
    expect(block).not.toMatch(/text-overflow\s*:\s*ellipsis/);
    // The track scrolls (80s loop) instead of truncating.
    const track = ruleBlock(CSS, '.ev-ticker-track');
    expect(track).toMatch(/animation\s*:\s*ev-ticker-scroll 80s linear infinite/);
    expect(stripComments(CSS)).toMatch(/@keyframes ev-ticker-scroll/);
  });

  it('ticker: slow scroll + Arabic item class exist + reduced motion stops it', () => {
    // Owner 25 Nov 10:03 — the ticker replaces the ayah bar. Slow
    // 80s loop, pause on hover, no flashing/fast movement; the
    // Arabic ayat rides in its own class (Amiri/Naskh serif, rtl).
    const track = ruleBlock(CSS, '.ev-ticker-track');
    expect(track).toMatch(/animation\s*:\s*ev-ticker-scroll 80s linear infinite/);
    const clean = stripComments(CSS);
    expect(clean).toMatch(/@keyframes ev-ticker-scroll[\s\S]*?translateX\(-25%\)/);
    const arBlock = ruleBlock(CSS, '.ev-ticker-ayat-ar');
    expect(arBlock).toMatch(/font-family\s*:\s*'Amiri'/);
    // Reduced motion: the scroll is disabled and a single static
    // copy shows instead of four scrolling ones.
    expect(clean).toMatch(
      /prefers-reduced-motion:\s*reduce[\s\S]*?\.ev-ticker-track\s*\{[^}]*animation\s*:\s*none/,
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

  it('bottom-nav links share the width equally (no bunching, no run-off)', () => {
    // Owner 24 Nov 12:28 screenshot: without flex the five links
    // bunched into the left half (0–188px of a 360px nav on live,
    // right half empty) and looked cramped / running off the edges
    // on his phone's wider font. Equal cells use the full width;
    // min-width:0 keeps a wide label inside its cell instead of
    // pushing siblings off the viewport edge.
    const block = ruleBlock(CSS, '.ev-bottom-nav-link');
    expect(block).toMatch(/flex\s*:\s*1/);
    expect(block).toMatch(/min-width\s*:\s*0/);
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
