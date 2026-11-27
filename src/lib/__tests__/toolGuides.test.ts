// Eduvelto — structured tool guides (27 Nov 2026, AdSense guides).
//
// The top-20 tools each carry a structured guide (intro, how-to,
// formula, worked example, 3-5 FAQs) in both languages. Guards:
// exactly 20 slugs, every slug is a real non-aliased tool (aliased
// slugs render their alias page, never ToolsDetailPage's guide
// section), every language complete, word counts in range.
import { describe, expect, it } from 'vitest';
import { TOOL_GUIDE_SECTIONS } from '../toolsGuides';
import { toolBySlug } from '../toolsMeta';

export const EXPECTED_GUIDE_SLUGS = [
  'bmi-calculator',
  'bmr-calculator',
  'grade-analyzer',
  'word-counter',
  'compound-interest-calculator',
  'mortgage-calculator',
  'income-tax-calculator',
  'salary-to-hourly-converter',
  'electricity-bill-calculator',
  'zakat-calculator',
  'govt-job-age-calculator',
  'prayer-times',
  'cgpa-to-percentage-converter',
  'pdf-splitter',
  'image-to-pdf',
  'bkash-nagad-calculator',
  'ssc-hsc-gpa-calculator',
  'pdf-to-jpg',
  'calorie-tdee-calculator',
  'tip-calculator',
] as const;

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function guideWords(content: {
  title: string;
  intro: string;
  howTo: string[];
  formula: string;
  example: string;
  faq: { q: string; a: string }[];
}): number {
  const parts = [
    content.title,
    content.intro,
    ...content.howTo,
    content.formula,
    content.example,
    ...content.faq.flatMap((item) => [item.q, item.a]),
  ];
  return wordCount(parts.join(' '));
}

describe('TOOL_GUIDE_SECTIONS (top 20)', () => {
  it('still covers the 20 chosen slugs — and 259 structured guides in total (27 Nov 2026: J guides + A-tools + PDF to Word + 25 Math + 12 prose conversions + 23 Text + 20 Converters + 15 Finance/Health + 10 Main tables; 28 Nov 2026: the 2 owner-approved duplicate tools, pdf-page-extractor and jpg-to-pdf, were removed with their guides, 261 -> 259)', () => {
    for (const slug of EXPECTED_GUIDE_SLUGS) {
      expect(TOOL_GUIDE_SECTIONS, slug).toHaveProperty(slug);
    }
    // 259 structured guides here + 12 prose guides in TOOLS_GUIDES =
    // 259 guided of 265 tools in toolsMeta (170 live + 25 Math + 23 Text
    // + 20 Converters + 15 Finance/Health + 10 Main tables + 1 words-to-number + 1 bangla-date). The 6 unguided
    // slugs are the 4 aliases (typing-speed-test, cv-builder,
    // cover-letter-builder, unit-converter) which render their alias page,
    // never a guide, plus words-to-number-converter and
    // bangla-date-converter, whose guides were not in the held fragments.
    // The 12 prose entries remain as a fallback; their structured versions
    // now take precedence. (All held guides are now merged — the Main
    // tables 10 landed with this batch.)
    expect(Object.keys(TOOL_GUIDE_SECTIONS)).toHaveLength(259);
  });

  it.each([...EXPECTED_GUIDE_SLUGS])('has a complete structured guide for %s', (slug) => {
    const meta = toolBySlug(slug);
    expect(meta, `${slug} must exist in toolsMeta`).toBeDefined();
    expect(meta?.aliasPage, `${slug} must not be aliased (guides render on ToolsDetailPage only)`).toBeUndefined();
    const sections = TOOL_GUIDE_SECTIONS[slug];
    expect(sections, slug).toBeDefined();
    for (const lang of ['bn', 'en'] as const) {
      const content = sections[lang];
      expect(content.title.trim(), `${slug} ${lang} title`).not.toBe('');
      expect(content.intro.trim(), `${slug} ${lang} intro`).not.toBe('');
      expect(content.howTo, `${slug} ${lang} howTo`).toHaveLength(4);
      for (const step of content.howTo) {
        expect(step.trim(), `${slug} ${lang} howTo step`).not.toBe('');
      }
      expect(content.formula.trim(), `${slug} ${lang} formula`).not.toBe('');
      expect(content.example.trim(), `${slug} ${lang} example`).not.toBe('');
      expect(content.faq.length, `${slug} ${lang} faq count`).toBeGreaterThanOrEqual(3);
      expect(content.faq.length, `${slug} ${lang} faq count`).toBeLessThanOrEqual(5);
      for (const item of content.faq) {
        expect(item.q.trim(), `${slug} ${lang} faq q`).not.toBe('');
        expect(item.a.trim(), `${slug} ${lang} faq a`).not.toBe('');
      }
      const words = guideWords(content);
      expect(words, `${slug} ${lang} words (${words})`).toBeGreaterThanOrEqual(150);
      expect(words, `${slug} ${lang} words (${words})`).toBeLessThanOrEqual(250);
      const fullText = [content.title, content.intro, ...content.howTo, content.formula, content.example, ...content.faq.flatMap((item) => [item.q, item.a])].join(' ');
      expect(fullText, `${slug} ${lang} must not claim verified status`).not.toContain('যাচাইকৃত');
      expect(fullText, `${slug} ${lang} must not claim #1`).not.toContain('#1');
    }
    const combined = guideWords(sections.bn) + guideWords(sections.en);
    expect(combined, `${slug} combined words (${combined})`).toBeGreaterThanOrEqual(300);
    expect(combined, `${slug} combined words (${combined})`).toBeLessThanOrEqual(500);
  });
});

describe('TOOL_GUIDE_SECTIONS (all guides — tool-SEO program loose guard)', () => {
  // The top-20 strict bar (howTo==4, 150–250 words/lang) applies only
  // to EXPECTED_GUIDE_SLUGS above. Older guides (e.g. the A-tools
  // batch with howTo==5 and longer text) predate it and are fine for
  // SEO, so this guard enforces only the brief's own bar on EVERY
  // guide: a real how-to, 3–5 FAQs, 300+ combined words, no
  // 'verified' / '#1' claims, and every guide slug is a real
  // non-aliased tool (guides render on ToolsDetailPage only).
  it('every structured guide meets the brief bar', () => {
    for (const [slug, sections] of Object.entries(TOOL_GUIDE_SECTIONS)) {
      const meta = toolBySlug(slug);
      expect(meta, `${slug} must exist in toolsMeta`).toBeDefined();
      expect(meta?.aliasPage, `${slug} must not be aliased`).toBeUndefined();
      for (const lang of ['bn', 'en'] as const) {
        const content = sections[lang];
        expect(content.howTo.length, `${slug} ${lang} howTo`).toBeGreaterThanOrEqual(3);
        expect(content.howTo.length, `${slug} ${lang} howTo`).toBeLessThanOrEqual(5);
        expect(content.faq.length, `${slug} ${lang} faq`).toBeGreaterThanOrEqual(3);
        expect(content.faq.length, `${slug} ${lang} faq`).toBeLessThanOrEqual(5);
        for (const item of content.faq) {
          expect(item.q.trim(), `${slug} ${lang} faq q`).not.toBe('');
          expect(item.a.trim(), `${slug} ${lang} faq a`).not.toBe('');
        }
      }
      const combined = guideWords(sections.bn) + guideWords(sections.en);
      expect(combined, `${slug} combined words (${combined})`).toBeGreaterThanOrEqual(300);
      const fullText = [
        sections.bn.title,
        sections.bn.intro,
        ...sections.bn.howTo,
        sections.bn.formula,
        sections.bn.example,
        ...sections.bn.faq.flatMap((item) => [item.q, item.a]),
        sections.en.title,
        sections.en.intro,
        ...sections.en.howTo,
        sections.en.formula,
        sections.en.example,
        ...sections.en.faq.flatMap((item) => [item.q, item.a]),
      ].join(' ');
      expect(fullText, `${slug} must not claim verified status`).not.toContain('যাচাইকৃত');
      expect(fullText, `${slug} must not claim #1`).not.toContain('#1');
    }
  });
});
