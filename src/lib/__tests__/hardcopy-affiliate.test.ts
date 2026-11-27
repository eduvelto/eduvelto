// Eduvelto — "Buy Printed Hardcopy" affiliate-slot tests (Phase 3,
// 25 Nov 2026, feature/ssg-bilingual-support).
//
// The slot is a LINK SLOT ONLY: with no affiliate URL it renders
// a disabled "coming soon" placeholder, and NO Rokomari URL may
// ever be invented or hardcoded — the real affiliate link arrives
// later as a prop from the call site.
//
// 28 Nov 2026 (completeness audit): BookPage no longer renders the
// slot at all — the placeholder box on every book page is removed
// until a real affiliate URL exists. The component file stays on
// disk (unused) and its own state tests below still apply.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { hardcopySlotState } from '../../components/HardcopyAffiliateSlot';

describe('hardcopySlotState', () => {
  it('is a placeholder with no URL', () => {
    expect(hardcopySlotState(undefined)).toBe('placeholder');
    expect(hardcopySlotState(null)).toBe('placeholder');
    expect(hardcopySlotState('')).toBe('placeholder');
    expect(hardcopySlotState('   ')).toBe('placeholder');
  });

  it('is live only with a real URL', () => {
    expect(hardcopySlotState('https://example.com/book')).toBe('live');
  });
});

describe('affiliate slot — no invented link', () => {
  it('no Rokomari (or any shop) URL is hardcoded in the slot or BookPage', () => {
    // The word "Rokomari" in prose comments is fine — it names the
    // affiliate programme the link will come from. What is banned
    // is any URL: rokomari.com, or any http(s) link at all.
    for (const file of [
      '../../components/HardcopyAffiliateSlot.tsx',
      '../../pages/BookPage.tsx',
    ]) {
      const src = readFileSync(resolve(__dirname, file), 'utf8');
      expect(src).not.toContain('rokomari.com');
    }
    // The slot itself holds no outbound URL at all — the real link
    // arrives later as a prop; a hardcoded href would be an
    // invented link.
    const slot = readFileSync(resolve(__dirname, '../../components/HardcopyAffiliateSlot.tsx'), 'utf8');
    expect(slot).not.toContain('http');
  });

  it('the placeholder says coming soon', () => {
    const src = readFileSync(
      resolve(__dirname, '../../components/HardcopyAffiliateSlot.tsx'),
      'utf8',
    );
    expect(src).toContain('শীঘ্রই আসছে');
    expect(src).toContain('data-hardcopy-affiliate="placeholder"');
  });

  it('BookPage does NOT render the slot (placeholder removed 28 Nov 2026)', () => {
    const src = readFileSync(resolve(__dirname, '../../pages/BookPage.tsx'), 'utf8');
    expect(src).not.toContain('<HardcopyAffiliateSlot />');
    expect(src).not.toContain('HardcopyAffiliateSlot');
  });
});
