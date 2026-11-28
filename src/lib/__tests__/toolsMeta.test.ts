// Tools metadata (second batch, 27 Nov 2026) — integrity tests.
//
// Guards the TOOLS_META contract in src/lib/toolsMeta.ts: 171 slugs,
// every related slug resolves, no self-references, no duplicates, and
// every entry has non-empty Bangla/English titles and descriptions.
// Also guards the three second-batch Finance/Health guides in
// src/lib/toolsGuides.ts: each guide is 300-400 words in both languages.
import { describe, it, expect } from 'vitest';
import { TOOLS_META } from '../toolsMeta';
import { TOOLS_GUIDES } from '../toolsGuides';
import { toolIconFor, TOOL_ICON_NAMES, TOOL_ICON_BY_SLUG, CATEGORY_ICON } from '../../components/ToolIcon';

const ALLOWED_CATEGORIES = new Set([
  'pdf',
  'image',
  'finance',
  'health',
  'education',
  'job',
  'teacher',
  'text',
  'developer',
  'utility',
  'video',
]);

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

describe('TOOLS_META', () => {
  it('has exactly 271 slugs', () => {
    expect(TOOLS_META.length).toBe(271);
  });

  it('has no duplicate slugs', () => {
    const slugs = TOOLS_META.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('uses only allowed categories', () => {
    for (const tool of TOOLS_META) {
      expect(ALLOWED_CATEGORIES.has(tool.category)).toBe(true);
    }
  });

  it('gives every tool a non-empty bn/en title and description', () => {
    for (const tool of TOOLS_META) {
      expect(tool.titleBn.trim().length, `${tool.slug} titleBn`).toBeGreaterThan(0);
      expect(tool.titleEn.trim().length, `${tool.slug} titleEn`).toBeGreaterThan(0);
      expect(tool.descriptionBn.trim().length, `${tool.slug} descriptionBn`).toBeGreaterThan(0);
      expect(tool.descriptionEn.trim().length, `${tool.slug} descriptionEn`).toBeGreaterThan(0);
      expect(tool.crumbBn.trim().length, `${tool.slug} crumbBn`).toBeGreaterThan(0);
      expect(tool.crumbEn.trim().length, `${tool.slug} crumbEn`).toBeGreaterThan(0);
    }
  });

  it('gives every tool unique SEO titles/descriptions within Google length limits (27 Nov 2026 SEO pass)', () => {
    // Mirrors seo.ts tool SEO exactly: title `${title} | Eduvelto`,
    // description `${description} — বিনামূল্যের টুল। Eduvelto।` (bn) /
    // `${description} — a free Eduvelto tool.` (en). Titles must fit
    // ~60 chars; descriptions must be >40 (sitemap sweep) and <=160.
    // No competitor names, no "verified" wording, no #1/best claims.
    const BN_DESC_SUFFIX = ' — বিনামূল্যের টুল। Eduvelto।';
    const EN_DESC_SUFFIX = ' — a free Eduvelto tool.';
    const FORBIDDEN = [
      'proshnobanai', 'প্রশ্নবানাই', 'eproshnobank', 'remove.bg',
      'smallpdf', 'ilovepdf', 'যাচাইকৃত', 'verified', 'সেরা', '#1', 'নম্বর ১',
    ];
    const seen = {
      titleBn: new Map<string, string>(),
      titleEn: new Map<string, string>(),
      descriptionBn: new Map<string, string>(),
      descriptionEn: new Map<string, string>(),
    };
    for (const tool of TOOLS_META) {
      const bnTitle = `${tool.titleBn} | Eduvelto`;
      const enTitle = `${tool.titleEn} | Eduvelto`;
      const bnDesc = `${tool.descriptionBn}${BN_DESC_SUFFIX}`;
      const enDesc = `${tool.descriptionEn}${EN_DESC_SUFFIX}`;
      expect(bnTitle.length, `${tool.slug} bn title (${bnTitle})`).toBeLessThanOrEqual(60);
      expect(enTitle.length, `${tool.slug} en title (${enTitle})`).toBeLessThanOrEqual(60);
      expect(bnDesc.length, `${tool.slug} bn desc`).toBeGreaterThan(40);
      expect(bnDesc.length, `${tool.slug} bn desc`).toBeLessThanOrEqual(160);
      expect(enDesc.length, `${tool.slug} en desc`).toBeGreaterThan(40);
      expect(enDesc.length, `${tool.slug} en desc`).toBeLessThanOrEqual(160);
      for (const word of FORBIDDEN) {
        for (const [field, value] of [
          ['titleBn', tool.titleBn], ['titleEn', tool.titleEn],
          ['descriptionBn', tool.descriptionBn], ['descriptionEn', tool.descriptionEn],
        ] as const) {
          expect(value.toLowerCase().includes(word.toLowerCase()), `${tool.slug} ${field} contains "${word}"`).toBe(false);
        }
      }
      for (const [key, value] of [
        ['titleBn', bnTitle], ['titleEn', enTitle],
        ['descriptionBn', bnDesc], ['descriptionEn', enDesc],
      ] as const) {
        const map = seen[key as keyof typeof seen];
        expect(map.has(value), `${key} "${value}" duplicated by ${tool.slug} (first: ${map.get(value)})`).toBe(false);
        map.set(value, tool.slug);
      }
    }
  });

  it('gives every tool exactly 3 related slugs', () => {
    for (const tool of TOOLS_META) {
      expect(tool.relatedSlugs.length, `${tool.slug} relatedSlugs`).toBe(3);
    }
  });

  it('resolves every related slug to a real slug', () => {
    const slugs = new Set(TOOLS_META.map((t) => t.slug));
    for (const tool of TOOLS_META) {
      for (const related of tool.relatedSlugs) {
        expect(slugs.has(related), `${tool.slug} -> ${related}`).toBe(true);
      }
    }
  });

  it('never lists a slug as related to itself', () => {
    for (const tool of TOOLS_META) {
      expect(tool.relatedSlugs, tool.slug).not.toContain(tool.slug);
    }
  });

  it('contains all 35 second-batch slugs', () => {
    const slugs = new Set(TOOLS_META.map((t) => t.slug));
    for (const slug of [
      'tip-calculator',
      'invoice-generator',
      'budget-planner',
      'expense-splitter',
      'break-even-calculator',
      'meeting-time-planner',
      'world-date-converter',
      'meme-generator',
      'exif-viewer-remover',
      'emergency-numbers',
      'govt-service-links',
      'results-hub',
      'dictionary',
      'text-to-speech',
      'notes-todo',
      'tasbih-counter',
      'bkash-nagad-calculator',
      'image-rotate-flip',
      'image-to-base64',
      'image-filter',
      'pdf-password-protector',
      'pdf-page-remover',
      'remove-extra-spaces',
      'speech-to-text',
      'fancy-text-generator',
      'reverse-text-generator',
      'ovulation-calculator',
      'credit-card-validator',
      'roman-numeral-converter',
      'jwt-token-decoder',
      'html-table-generator',
      'youtube-thumbnail-downloader',
      'whatsapp-link-generator',
      'screen-resolution-checker',
      'background-remover',
    ]) {
      expect(slugs.has(slug), slug).toBe(true);
    }
  });
});

describe('tool icons (27 Nov 2026 — picture tiles, never a letter)', () => {
  it('maps every tool slug to a known icon', () => {
    const known = new Set(TOOL_ICON_NAMES);
    for (const tool of TOOLS_META) {
      const icon = toolIconFor(tool.slug, tool.category);
      expect(known.has(icon), `${tool.slug} -> ${icon}`).toBe(true);
    }
  });

  it('has an explicit mapping entry for all 271 slugs (no silent fallback reliance)', () => {
    for (const tool of TOOLS_META) {
      expect(TOOL_ICON_BY_SLUG[tool.slug], tool.slug).toBeDefined();
      expect(TOOL_ICON_NAMES, tool.slug).toContain(TOOL_ICON_BY_SLUG[tool.slug]);
    }
  });

  it('uses every icon at least once (no dead glyphs)', () => {
    const used = new Set(TOOLS_META.map((t) => toolIconFor(t.slug, t.category)));
    for (const name of TOOL_ICON_NAMES) {
      expect(used.has(name), `unused icon: ${name}`).toBe(true);
    }
  });

  it('falls back to the category icon for an unknown slug (never a letter or undefined)', () => {
    for (const category of Object.keys(CATEGORY_ICON) as (keyof typeof CATEGORY_ICON)[]) {
      const icon = toolIconFor('not-a-real-slug', category);
      expect(icon).toBe(CATEGORY_ICON[category]);
      expect(TOOL_ICON_NAMES).toContain(icon);
    }
  });

  it('has no letter or generic placeholder icon in the set', () => {
    for (const name of TOOL_ICON_NAMES) {
      expect(name, name).not.toMatch(/letter|generic|placeholder|initial/i);
    }
  });
});

describe('TOOLS_GUIDES (second batch)', () => {
  // tip-calculator and bkash-nagad-calculator moved to structured guides
  // (TOOL_GUIDE_SECTIONS) on 27 Nov 2026; only ovulation-calculator
  // keeps its prose guide.
  it.each(['ovulation-calculator'])(
    'has a 300-400 word guide in both languages for %s',
    (slug) => {
      const guide = TOOLS_GUIDES[slug];
      expect(guide, slug).toBeDefined();
      const enWords = wordCount(guide.guideEn);
      const bnWords = wordCount(guide.guideBn);
      expect(enWords, `${slug} guideEn (${enWords} words)`).toBeGreaterThanOrEqual(300);
      expect(enWords, `${slug} guideEn (${enWords} words)`).toBeLessThanOrEqual(400);
      expect(bnWords, `${slug} guideBn (${bnWords} words)`).toBeGreaterThanOrEqual(300);
      expect(bnWords, `${slug} guideBn (${bnWords} words)`).toBeLessThanOrEqual(400);
    },
  );
});
