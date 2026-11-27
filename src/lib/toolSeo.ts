// Eduvelto — tool SEO helpers (27 Nov 2026, tool-SEO program).
//
// Template-driven: everything derives from the toolsMeta source of truth,
// so a new tool gets its SEO automatically the moment its toolsMeta entry
// lands — no per-tool hand edits anywhere.
//
// - toolWebApplicationJsonLd: WebApplication schema for a tool page.
//   Used by resolveRouteSeo (src/lib/seo.ts) — travels through helmet
//   into <head> in the browser AND into prerendered HTML.
// - faqPageJsonLd: FAQPage schema from a structured guide's FAQs.
//   Used by ToolsDetailPage (it already imports the guide sections) —
//   rendered as a body <script>, which SSR/prerender picks up too.
//   seo.ts deliberately does NOT import toolsGuides (heavy prose must
//   not download on first paint), so the FAQPage cannot live there.
// - relatedToolsFor: 5 related tools for a tool page — same-category
//   first (curated relatedSlugs first within the category), then
//   cross-category fill from the curated list, then registry order.
//   The video category has only 5 members, so its tools get 4
//   same-category + 1 cross-category fill; every other tool gets 5
//   same-category.
import { TOOLS_META, toolBySlug, type ToolCategory, type ToolMeta } from './toolsMeta';

/** Schema.org application category per Eduvelto tool category. */
export function applicationCategoryFor(category: ToolCategory): string {
  switch (category) {
    case 'finance':
      return 'FinanceApplication';
    case 'health':
      return 'HealthApplication';
    case 'education':
    case 'teacher':
      return 'EducationalApplication';
    case 'developer':
      return 'DeveloperApplication';
    case 'video':
    case 'image':
      return 'MultimediaApplication';
    case 'job':
      return 'BusinessApplication';
    case 'pdf':
    case 'text':
    case 'utility':
    default:
      return 'UtilitiesApplication';
  }
}

export function toolWebApplicationJsonLd(
  meta: ToolMeta,
  canonical: string,
  lang: 'bn' | 'en',
  description: string,
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    '@id': `${canonical}#webapp`,
    url: canonical,
    name: lang === 'bn' ? meta.titleBn : meta.titleEn,
    description,
    applicationCategory: applicationCategoryFor(meta.category),
    operatingSystem: 'Web',
    inLanguage: [lang],
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'BDT' },
  };
}

export function faqPageJsonLd(
  faqs: Array<{ q: string; a: string }>,
  url: string,
): Record<string, unknown> | undefined {
  if (faqs.length === 0) return undefined;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${url}#faq`,
    mainEntity: faqs.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };
}

/**
 * Up to `count` related tools for a tool page. Same-category first
 * (the brief's requirement), curated relatedSlugs first within each
 * tier, never the tool itself, never a duplicate. Always returns
 * `count` items while the registry holds enough tools.
 */
export function relatedToolsFor(meta: ToolMeta, count = 5): ToolMeta[] {
  const picked: ToolMeta[] = [];
  const seen = new Set<string>([meta.slug]);
  const push = (candidate: ToolMeta | undefined): void => {
    if (candidate && !seen.has(candidate.slug)) {
      seen.add(candidate.slug);
      picked.push(candidate);
    }
  };
  const curated = meta.relatedSlugs
    .map((slug) => toolBySlug(slug))
    .filter((m): m is ToolMeta => Boolean(m));
  // 1. curated slugs that share the category.
  for (const m of curated) if (m.category === meta.category) push(m);
  // 2. other same-category tools, registry order.
  for (const m of TOOLS_META) if (m.category === meta.category) push(m);
  // 3. curated cross-category slugs.
  for (const m of curated) push(m);
  // 4. anything else, registry order.
  for (const m of TOOLS_META) push(m);
  return picked.slice(0, count);
}
