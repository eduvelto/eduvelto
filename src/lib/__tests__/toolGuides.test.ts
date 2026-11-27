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
  it('still covers the 20 chosen slugs — and 155 structured guides in total (27 Nov 2026: J guides + A-tools)', () => {
    for (const slug of EXPECTED_GUIDE_SLUGS) {
      expect(TOOL_GUIDE_SECTIONS, slug).toHaveProperty(slug);
    }
    // 155 structured guides here + 12 prose guides in TOOLS_GUIDES =
    // 167 guided of 171 live tools. The 4 unguided slugs are the
    // aliases (typing-speed-test, cv-builder, cover-letter-builder,
    // unit-converter) which render their alias page, never a guide.
    expect(Object.keys(TOOL_GUIDE_SECTIONS)).toHaveLength(155);
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
