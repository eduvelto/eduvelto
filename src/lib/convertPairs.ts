// Eduvelto — converter pair pages (28 Nov 2026).
//
// Every ordered unit pair (from !== to) as a rankable page:
// slug `<from>-to-<to>` (e.g. kg-to-lb, c-to-f), served at
// /{lang}/convert/<slug> by ONE dynamic client-side route
// (ConvertPairPage) — no per-pair static HTML files (owner safety
// rule 4, 28 Nov 2026).
//
// The list is derived from the src/lib/lifeConverters.ts registry —
// never hand-listed — so a future unit adds its pairs automatically.
// Total: 244 (length 56 + weight 72 + volume 42 + area 56 +
// speed 12 + temperature 6). The count is asserted in
// convertPairs.test.ts. The SITEMAP list is the bounded subset:
// only pairs starting from a commonly-used unit (152) —
// SITEMAP_PAIRS below; the route still renders all 244.
//
// CURRENCY IS DELIBERATELY EXCLUDED: the site has no live
// exchange-rate source (owner's FOREVER-AUTO rule — currency is
// user-entered rate only), so a usd-to-bdt pair page would show a
// stale or invented rate and mislead users. Currency conversion
// stays in the existing converter as-is.
//
// Enumeration order mirrors the registry file: the UNIT_CATEGORIES
// blocks in file order, then TEMPERATURE_UNITS — so the prerender
// derivation (getConvertPairPaths in scripts/prerender.mjs, which
// regex-parses the same file) produces the identical ordered list,
// and the cross-check test can compare exactly.

import {
  SITEMAP_FROM_UNITS,
  TEMPERATURE_UNITS,
  UNIT_CATEGORIES,
  unitsForCategory,
  type UnitCategory,
  type UnitDef,
} from './lifeConverters';

/** Category order = registry-file order (see header). */
export const CONVERT_PAIR_CATEGORIES: UnitCategory[] = [
  'length',
  'weight',
  'volume',
  'area',
  'speed',
  'temperature',
];

export const CATEGORY_LABELS: Record<UnitCategory, { bn: string; en: string }> = {
  length: { bn: 'দৈর্ঘ্য', en: 'Length' },
  weight: { bn: 'ওজন', en: 'Weight' },
  volume: { bn: 'আয়তন', en: 'Volume' },
  area: { bn: 'ক্ষেত্রফল', en: 'Area' },
  speed: { bn: 'গতি', en: 'Speed' },
  temperature: { bn: 'তাপমাত্রা', en: 'Temperature' },
};

export interface ConvertPair {
  slug: string;
  category: UnitCategory;
  from: string;
  to: string;
}

function buildPairs(): ConvertPair[] {
  const pairs: ConvertPair[] = [];
  for (const category of CONVERT_PAIR_CATEGORIES) {
    const units = category === 'temperature' ? TEMPERATURE_UNITS : UNIT_CATEGORIES[category];
    for (const from of units) {
      for (const to of units) {
        if (from.id === to.id) continue;
        pairs.push({ slug: `${from.id}-to-${to.id}`, category, from: from.id, to: to.id });
      }
    }
  }
  return pairs;
}

export const CONVERT_PAIRS: ConvertPair[] = buildPairs();

/** Sitemap subset (owner safety rule 4, 28 Nov 2026): ONLY pairs
 *  starting from a commonly-used unit (SITEMAP_FROM_UNITS) — 152 of
 *  the 244 registry pairs. The /convert/:pair route still renders ANY
 *  registry pair when visited; only the sitemap list is bounded, so
 *  no pair page is ever a dead link. */
export const SITEMAP_PAIRS: ConvertPair[] = CONVERT_PAIRS.filter((p) =>
  SITEMAP_FROM_UNITS[p.category].includes(p.from),
);

/** Per-category pair counts (length 56, weight 72, volume 42, area 56, speed 12, temperature 6). */
export const CONVERT_PAIR_COUNTS: Record<UnitCategory, number> = Object.fromEntries(
  CONVERT_PAIR_CATEGORIES.map((category) => [
    category,
    CONVERT_PAIRS.filter((p) => p.category === category).length,
  ]),
) as Record<UnitCategory, number>;

const PAIR_BY_SLUG = new Map(CONVERT_PAIRS.map((p) => [p.slug, p]));

/**
 * Colloquial slug spellings people actually type and search for
 * (28 Nov 2026, growth batch item 3): `lbs` for `lb`, `feet` for
 * `ft`, `inches` for `in`, `miles` for `mi`, `yards` for `yd`,
 * `gallons` for `gal`, `ounces` for `oz`, `pounds` for `lb`, plus
 * the full-name forms of the metric units. The canonical slug stays
 * the registry id — aliases only redirect to it (see
 * ConvertPairPage), so exactly one URL is indexed per pair.
 */
export const UNIT_SLUG_ALIASES: Record<string, string> = {
  lbs: 'lb',
  pounds: 'lb',
  feet: 'ft',
  inches: 'in',
  miles: 'mi',
  yards: 'yd',
  gallons: 'gal',
  ounces: 'oz',
  cups: 'cup',
  teaspoons: 'tsp',
  tablespoons: 'tbsp',
  kilograms: 'kg',
  kilogram: 'kg',
  grams: 'g',
  gram: 'g',
  meters: 'm',
  metres: 'm',
  meter: 'm',
  metre: 'm',
  kilometers: 'km',
  kilometres: 'km',
  kilometer: 'km',
  kilometre: 'km',
  liters: 'l',
  litres: 'l',
  liter: 'l',
  litre: 'l',
  millimeters: 'mm',
  millimetres: 'mm',
  centimeters: 'cm',
  centimetres: 'cm',
};

/**
 * Resolve a `<from>-to-<to>` slug, accepting the colloquial aliases
 * above. Returns the canonical pair plus whether an alias was used
 * (the page redirects aliased URLs to the canonical slug). Returns
 * null for anything that is not a real registry pair — including
 * same-unit slugs, unknown units (usd-to-bdt) and malformed slugs.
 */
export function resolveConvertPairSlug(slug: string): { pair: ConvertPair; aliased: boolean } | null {
  if (typeof slug !== 'string' || !slug) return null;
  const direct = PAIR_BY_SLUG.get(slug);
  if (direct) return { pair: direct, aliased: false };
  const m = /^([a-z0-9]+)-to-([a-z0-9]+)$/.exec(slug);
  if (!m) return null;
  const from = UNIT_SLUG_ALIASES[m[1]] ?? m[1];
  const to = UNIT_SLUG_ALIASES[m[2]] ?? m[2];
  if (from === m[1] && to === m[2]) return null;
  const pair = PAIR_BY_SLUG.get(`${from}-to-${to}`);
  return pair ? { pair, aliased: true } : null;
}

/** The registry definition for a unit in a category (undefined when unknown). */
export function findUnitDef(category: UnitCategory, unitId: string): UnitDef | undefined {
  return unitsForCategory(category).find((u) => u.id === unitId);
}

/**
 * Parse a `<from>-to-<to>` slug back to its pair. Returns null for
 * anything that is not a real registry pair — including same-unit
 * slugs (kg-to-kg), unknown units (usd-to-bdt) and malformed slugs.
 */
export function parseConvertPair(slug: string): ConvertPair | null {
  if (typeof slug !== 'string' || !slug) return null;
  return PAIR_BY_SLUG.get(slug) ?? null;
}

/**
 * Up to `limit` same-category pairs sharing the pair's `from` or
 * `to` unit (same-`from` first, then same-`to`, registry order),
 * excluding the pair itself. Used for the related-pairs links.
 */
export function relatedPairs(pair: ConvertPair, limit = 8): ConvertPair[] {
  const out: ConvertPair[] = [];
  const seen = new Set<string>([pair.slug]);
  for (const candidate of CONVERT_PAIRS) {
    if (candidate.category !== pair.category || candidate.from !== pair.from) continue;
    if (seen.has(candidate.slug)) continue;
    seen.add(candidate.slug);
    out.push(candidate);
    if (out.length >= limit) return out;
  }
  for (const candidate of CONVERT_PAIRS) {
    if (candidate.category !== pair.category || candidate.to !== pair.to) continue;
    if (seen.has(candidate.slug)) continue;
    seen.add(candidate.slug);
    out.push(candidate);
    if (out.length >= limit) return out;
  }
  return out;
}
