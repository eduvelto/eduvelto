// Eduvelto — top-20 tool + core-page meta overlay tests (28 Nov 2026).
//
// The overlay (src/lib/toolsMetaI18n.ts) translates title/description/
// crumb for the top-20 tools and the 6 phased core pages into hi/ar/es/
// pt/fr/id. Everything else falls back to the English meta — never a
// raw key, never blank.
import { describe, expect, it } from 'vitest';
import { toolBySlug } from '../toolsMeta';
import {
  PHASED_ROUTE_PATHS,
  ROUTE_SEO_I18N,
  TOOLS_CRUMB,
  TOOL_DESC_SUFFIX,
  TOOL_META_I18N,
  TOP_20_TOOL_SLUGS,
  routeSeoForLang,
  toolMetaForLang,
} from '../toolsMetaI18n';

const PHASED = ['hi', 'ar', 'es', 'pt', 'fr', 'id'] as const;

describe('toolsMetaI18n — top-20 tool overlay (28 Nov 2026)', () => {
  it('lists exactly the 20 owner-approved top tool slugs', () => {
    expect([...TOP_20_TOOL_SLUGS]).toEqual([
      'pdf-merger', 'pdf-splitter', 'pdf-compressor', 'pdf-to-jpg', 'pdf-to-word',
      'pdf-page-reorder', 'pdf-watermark', 'image-to-pdf', 'text-to-pdf', 'image-resizer',
      'image-cropper', 'jpg-to-png', 'png-to-jpg', 'webp-converter', 'heic-to-jpg',
      'image-compressor', 'bmi-calculator', 'qr-code-generator', 'word-counter', 'age-calculator',
    ]);
  });

  it('has a complete title/description/crumb for every top-20 slug in all 6 languages', () => {
    for (const slug of TOP_20_TOOL_SLUGS) {
      for (const lang of PHASED) {
        const entry = TOOL_META_I18N[slug]?.[lang];
        expect(entry, `${slug} — ${lang}`).toBeDefined();
        expect(entry!.title.trim().length).toBeGreaterThan(0);
        expect(entry!.description.trim().length).toBeGreaterThan(0);
        expect(entry!.crumb.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('toolMetaForLang returns the overlay for phased langs, bn/en meta otherwise', () => {
    const meta = toolBySlug('pdf-merger')!;
    expect(toolMetaForLang(meta, 'hi').title).toBe('PDF मर्जर');
    expect(toolMetaForLang(meta, 'ar').title).toBe('دمج PDF');
    expect(toolMetaForLang(meta, 'es').title).toBe('Unir PDF');
    expect(toolMetaForLang(meta, 'bn').title).toBe(meta.titleBn);
    expect(toolMetaForLang(meta, 'en').title).toBe(meta.titleEn);
    // A non-top-20 tool has no overlay — English fallback, never blank.
    const other = toolBySlug('sql-formatter')!;
    expect(toolMetaForLang(other, 'hi').title).toBe(other.titleEn);
    expect(toolMetaForLang(other, 'fr').description).toBe(other.descriptionEn);
  });

  it('has a per-language "free tool" suffix and Tools crumb', () => {
    for (const lang of PHASED) {
      expect(TOOL_DESC_SUFFIX[lang].trim().length).toBeGreaterThan(0);
      expect(TOOLS_CRUMB[lang].trim().length).toBeGreaterThan(0);
    }
    expect(TOOLS_CRUMB.hi).toBe('टूल्स');
    expect(TOOLS_CRUMB.ar).toBe('الأدوات');
  });
});

describe('toolsMetaI18n — phased core-page SEO overlay (28 Nov 2026)', () => {
  it('covers exactly the 6 phased core pages', () => {
    expect([...PHASED_ROUTE_PATHS]).toEqual([
      '/', '/tools', '/free-quiz', '/about', '/support', '/contact',
    ]);
  });

  it('has a complete title/description/crumb for every core page in all 6 languages', () => {
    for (const path of PHASED_ROUTE_PATHS) {
      for (const lang of PHASED) {
        const entry = ROUTE_SEO_I18N[path]?.[lang];
        expect(entry, `${path} — ${lang}`).toBeDefined();
        expect(entry!.title.trim().length).toBeGreaterThan(0);
        expect(entry!.description.trim().length).toBeGreaterThan(0);
        expect(entry!.crumb.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('routeSeoForLang returns the overlay, or null for bn/en/unknown pages', () => {
    expect(routeSeoForLang('/', 'hi')!.title).toContain('Eduvelto');
    expect(routeSeoForLang('/free-quiz', 'fr')!.crumb).toBe('Quiz gratuit');
    expect(routeSeoForLang('/', 'bn')).toBeNull();
    expect(routeSeoForLang('/', 'en')).toBeNull();
    expect(routeSeoForLang('/jobs/bcs', 'hi')).toBeNull();
  });
});
