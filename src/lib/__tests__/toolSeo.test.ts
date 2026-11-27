// Eduvelto — tool SEO helpers (27 Nov 2026, tool-SEO program).
//
// Guards for the template-driven tool SEO in src/lib/toolSeo.ts:
// every tool page gets a WebApplication object, every structured
// guide yields a valid FAQPage, and every tool page links 5 related
// tools (same-category first). The tests derive expectations from
// the toolsMeta registry itself, so they stay green as new tools land.
import { describe, expect, it } from 'vitest';
import { TOOLS_META, toolBySlug } from '../toolsMeta';
import {
  applicationCategoryFor,
  faqPageJsonLd,
  relatedToolsFor,
  toolWebApplicationJsonLd,
} from '../toolSeo';

describe('applicationCategoryFor', () => {
  it('maps every tool category to a schema.org application category', () => {
    const categories = [...new Set(TOOLS_META.map((m) => m.category))];
    expect(categories.length).toBeGreaterThanOrEqual(11);
    for (const category of categories) {
      const mapped = applicationCategoryFor(category);
      expect(mapped, category).toMatch(/Application$/);
    }
  });
});

describe('toolWebApplicationJsonLd', () => {
  it('builds a free WebApplication from the toolsMeta entry', () => {
    const meta = toolBySlug('pdf-compressor')!;
    const canonical = 'https://eduvelto.com/bn/tools/pdf-compressor';
    const obj = toolWebApplicationJsonLd(meta, canonical, 'bn', 'পিডিএফ ছোট করুন — বিনামূল্যের টুল।');
    expect(obj['@type']).toBe('WebApplication');
    expect(obj['@id']).toBe(`${canonical}#webapp`);
    expect(obj.url).toBe(canonical);
    expect(obj.name).toBe(meta.titleBn);
    expect(obj.description).toBe('পিডিএফ ছোট করুন — বিনামূল্যের টুল।');
    expect(obj.applicationCategory).toBe('UtilitiesApplication');
    expect(obj.operatingSystem).toBe('Web');
    expect(obj.inLanguage).toEqual(['bn']);
    expect(obj.isAccessibleForFree).toBe(true);
    expect(obj.offers).toEqual({ '@type': 'Offer', price: '0', priceCurrency: 'BDT' });
  });

  it('uses the English title for the en variant', () => {
    const meta = toolBySlug('bmi-calculator')!;
    const obj = toolWebApplicationJsonLd(
      meta,
      'https://eduvelto.com/en/tools/bmi-calculator',
      'en',
      'Calculate your BMI — a free Eduvelto tool.',
    );
    expect(obj.name).toBe(meta.titleEn);
    expect(obj.applicationCategory).toBe('HealthApplication');
  });
});

describe('faqPageJsonLd', () => {
  it('builds a FAQPage with one Question per FAQ', () => {
    const faqs = [
      { q: 'Is this free?', a: 'Yes, completely free.' },
      { q: 'Is my file uploaded?', a: 'No, everything runs in your browser.' },
    ];
    const obj = faqPageJsonLd(faqs, 'https://eduvelto.com/bn/tools/pdf-compressor')!;
    expect(obj['@type']).toBe('FAQPage');
    expect(obj['@id']).toBe('https://eduvelto.com/bn/tools/pdf-compressor#faq');
    const entities = obj.mainEntity as Array<Record<string, unknown>>;
    expect(entities).toHaveLength(2);
    expect(entities[0]['@type']).toBe('Question');
    expect(entities[0].name).toBe('Is this free?');
    const answer = entities[0].acceptedAnswer as Record<string, unknown>;
    expect(answer['@type']).toBe('Answer');
    expect(answer.text).toBe('Yes, completely free.');
  });

  it('returns undefined when there are no FAQs', () => {
    expect(faqPageJsonLd([], 'https://eduvelto.com/bn/tools/pdf-compressor')).toBeUndefined();
  });
});

describe('relatedToolsFor', () => {
  it('returns exactly 5 distinct tools, never the tool itself', () => {
    for (const meta of TOOLS_META) {
      const related = relatedToolsFor(meta, 5);
      expect(related, meta.slug).toHaveLength(5);
      expect(new Set(related.map((m) => m.slug)).size, meta.slug).toBe(5);
      expect(related.map((m) => m.slug), meta.slug).not.toContain(meta.slug);
    }
  });

  it('prefers same-category tools (video tools get 4 same + 1 fill)', () => {
    for (const meta of TOOLS_META) {
      const related = relatedToolsFor(meta, 5);
      const sameCategory = related.filter((m) => m.category === meta.category);
      const categorySize = TOOLS_META.filter((m) => m.category === meta.category).length;
      const expectedSame = Math.min(5, categorySize - 1);
      expect(sameCategory.length, `${meta.slug} (${meta.category})`).toBe(expectedSame);
    }
  });

  it('keeps the curated same-category slugs first', () => {
    const meta = toolBySlug('pdf-compressor')!;
    const related = relatedToolsFor(meta, 5);
    const curatedSame = meta.relatedSlugs
      .map((slug) => toolBySlug(slug))
      .filter((m) => m && m.category === meta.category)
      .map((m) => m!.slug);
    expect(related.slice(0, curatedSame.length).map((m) => m.slug)).toEqual(curatedSame);
  });
});
