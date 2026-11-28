// Eduvelto — converter pair pages tests (28 Nov 2026).
//
// (a) every CONVERT_PAIRS slug parses back to its pair;
// (b) exact total count 244 with per-category counts;
// (c) convertUnit round-trip for every pair (there and back ≈
//     original within 1e-9 relative);
// (d) the prerender derivation matches the runtime SITEMAP list
//     exactly (same registry, same order — getConvertPairPaths
//     regex-parses src/lib/lifeConverters.ts, incl. the
//     SITEMAP_FROM_UNITS tier sets); the sitemap lists 152 pairs,
//     the route still renders all 244.
// (e) temperature spot checks.
// Plus: unknown slugs (incl. currency pairs — deliberately never
// built, see convertPairs.ts) parse to null, and relatedPairs
// stays same-category, shared-unit, ≤ 8.

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  CONVERT_PAIRS,
  CONVERT_PAIR_COUNTS,
  SITEMAP_PAIRS,
  UNIT_SLUG_ALIASES,
  parseConvertPair,
  relatedPairs,
  resolveConvertPairSlug,
} from '../convertPairs';
import { SITEMAP_FROM_UNITS, convertUnit, unitsForCategory } from '../lifeConverters';
import { getConvertPairPaths } from '../../../scripts/prerender.mjs';

describe('CONVERT_PAIRS', () => {
  it('has the exact expected total and per-category counts', () => {
    expect(CONVERT_PAIRS).toHaveLength(244);
    expect(CONVERT_PAIR_COUNTS).toEqual({
      length: 56,
      weight: 72,
      temperature: 6,
      volume: 42,
      area: 56,
      speed: 12,
    });
  });

  it('every slug is unique and parses back to its pair', () => {
    const slugs = CONVERT_PAIRS.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const pair of CONVERT_PAIRS) {
      expect(parseConvertPair(pair.slug)).toEqual(pair);
    }
  });

  it('round-trips every pair within 1e-9 relative', () => {
    for (const pair of CONVERT_PAIRS) {
      const there = convertUnit(pair.category, 7.5, pair.from, pair.to);
      expect(there).not.toBeNull();
      const back = convertUnit(pair.category, there as number, pair.to, pair.from);
      expect(back).not.toBeNull();
      expect(Math.abs((back as number) - 7.5) / 7.5).toBeLessThan(1e-9);
    }
  });

  it('temperature spot checks', () => {
    expect(convertUnit('temperature', 0, 'c', 'f')).toBeCloseTo(32, 9);
    expect(convertUnit('temperature', 100, 'c', 'f')).toBeCloseTo(212, 9);
    expect(convertUnit('temperature', 0, 'c', 'k')).toBeCloseTo(273.15, 9);
    expect(convertUnit('temperature', 32, 'f', 'c')).toBeCloseTo(0, 9);
  });

  it('speed factors are exact', () => {
    expect(convertUnit('speed', 1, 'kmh', 'ms')).toBeCloseTo(1 / 3.6, 12);
    expect(convertUnit('speed', 1, 'mph', 'ms')).toBeCloseTo(0.44704, 12);
    expect(convertUnit('speed', 1, 'knot', 'ms')).toBeCloseTo(0.514444, 12);
    expect(convertUnit('speed', 3.6, 'kmh', 'ms')).toBeCloseTo(1, 12);
  });

  it('prerender derivation matches the runtime SITEMAP list exactly', () => {
    const source = readFileSync(join(process.cwd(), 'src', 'lib', 'lifeConverters.ts'), 'utf8');
    const paths = getConvertPairPaths(source);
    expect(paths).toHaveLength(152);
    expect(paths).toEqual(SITEMAP_PAIRS.map((p) => `/convert/${p.slug}`));
  });

  it('sitemap subset: 152 pairs, all from a Tier-1 unit, marquee pairs in', () => {
    expect(SITEMAP_PAIRS).toHaveLength(152);
    const counts: Record<string, number> = {};
    for (const p of SITEMAP_PAIRS) {
      counts[p.category] = (counts[p.category] ?? 0) + 1;
      expect(SITEMAP_FROM_UNITS[p.category]).toContain(p.from);
    }
    expect(counts).toEqual({ length: 42, weight: 32, volume: 24, area: 42, speed: 6, temperature: 6 });
    // Marquee pairs (owner's example + the most-searched conversions).
    for (const slug of [
      'kg-to-lb',
      'lb-to-kg',
      'kg-to-g',
      'm-to-ft',
      'ft-to-m',
      'km-to-mi',
      'mi-to-km',
      'cm-to-in',
      'in-to-cm',
      'c-to-f',
      'f-to-c',
      'c-to-k',
      'l-to-ml',
      'ml-to-l',
      'l-to-gal',
      'gal-to-l',
      'acre-to-decimal',
      'katha-to-bigha',
      'kmh-to-mph',
      'mph-to-kmh',
    ]) {
      expect(SITEMAP_PAIRS.some((p) => p.slug === slug)).toBe(true);
    }
    // Non-sitemap pairs still exist on the route (just not listed):
    // the dynamic /convert/:pair template renders all 244.
    expect(parseConvertPair('mg-to-g')).not.toBeNull();
    expect(SITEMAP_PAIRS.some((p) => p.slug === 'mg-to-g')).toBe(false);
    expect(parseConvertPair('mm-to-yd')).not.toBeNull();
    expect(SITEMAP_PAIRS.some((p) => p.slug === 'mm-to-yd')).toBe(false);
    expect(SITEMAP_PAIRS.length).toBeLessThan(CONVERT_PAIRS.length);
  });

  it('relatedPairs returns up to 8 same-category pairs sharing from or to', () => {
    const pair = parseConvertPair('kg-to-lb');
    expect(pair).not.toBeNull();
    const rel = relatedPairs(pair as NonNullable<typeof pair>);
    expect(rel.length).toBeGreaterThan(0);
    expect(rel.length).toBeLessThanOrEqual(8);
    for (const r of rel) {
      expect(r.category).toBe(pair?.category);
      expect(r.from === pair?.from || r.to === pair?.to).toBe(true);
      expect(r.slug).not.toBe(pair?.slug);
    }
  });

  it('rejects unknown, same-unit and currency slugs', () => {
    expect(parseConvertPair('')).toBeNull();
    expect(parseConvertPair('not-a-pair')).toBeNull();
    expect(parseConvertPair('kg-to-kg')).toBeNull();
    expect(parseConvertPair('kg-to-xyz')).toBeNull();
    // No currency pair pages: no live exchange-rate source.
    expect(parseConvertPair('usd-to-bdt')).toBeNull();
    expect(parseConvertPair('usd-to-inr')).toBeNull();
  });

  it('colloquial aliases resolve to the canonical pair (aliased: true)', () => {
    // Canonical slugs are not aliases.
    expect(resolveConvertPairSlug('kg-to-lb')).toEqual({ pair: parseConvertPair('kg-to-lb'), aliased: false });
    // The owner's example URL form.
    const lbs = resolveConvertPairSlug('kg-to-lbs');
    expect(lbs?.aliased).toBe(true);
    expect(lbs?.pair.slug).toBe('kg-to-lb');
    expect(resolveConvertPairSlug('feet-to-meters')?.pair.slug).toBe('ft-to-m');
    expect(resolveConvertPairSlug('miles-to-km')?.pair.slug).toBe('mi-to-km');
    expect(resolveConvertPairSlug('inches-to-cm')?.pair.slug).toBe('in-to-cm');
    expect(resolveConvertPairSlug('gallons-to-liters')?.pair.slug).toBe('gal-to-l');
    expect(resolveConvertPairSlug('pounds-to-kilograms')?.pair.slug).toBe('lb-to-kg');
    // Alias on one side + unknown unit on the other is still null,
    // and currency stays excluded even in alias form.
    expect(resolveConvertPairSlug('lbs-to-xyz')).toBeNull();
    expect(resolveConvertPairSlug('usd-to-lbs')).toBeNull();
    expect(resolveConvertPairSlug('lbs-to-lbs')).toBeNull();
  });

  it('every alias value is a real registry unit id', () => {
    const allIds = new Set(
      (['length', 'weight', 'volume', 'area', 'speed', 'temperature'] as const).flatMap((c) =>
        unitsForCategory(c).map((u) => u.id),
      ),
    );
    for (const [alias, id] of Object.entries(UNIT_SLUG_ALIASES)) {
      expect(allIds.has(id)).toBe(true);
      expect(alias).not.toBe(id);
    }
  });
});
