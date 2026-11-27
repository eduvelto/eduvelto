// Eduvelto — Main-tables batch tests (27 Nov 2026).
// Known-answer tests for every pure engine function + data spot-checks.
import { describe, expect, it } from 'vitest';
import {
  encodeHtmlEntities,
  encodeHtmlEntitiesNumeric,
  decodeHtmlEntities,
  parseCsvLine,
  csvToJson,
  tokenizeSql,
  formatSql,
  computeFormula,
  dayOfYear,
} from '../../../lib/tools/mainTablesTools';
import { PERIODIC_TABLE, elementBySymbol, elementByAtomicNumber } from '../../../lib/tools/periodicTable';
import { COUNTRY_CODES, findCountryCodes } from '../../../lib/tools/countryCodes';
import { QUOTES, quoteOfTheDay } from '../../../lib/tools/quotesData';
import { FULL_FORMS, searchFullForms } from '../../../lib/tools/fullFormsData';
import { FORMULA_GROUPS } from '../../../lib/tools/formulasData';
import { weatherDescription } from '../../../lib/tools/weatherApi';

describe('HTML entities', () => {
  it('encodes the five named characters', () => {
    expect(encodeHtmlEntities('<a href="x">Tom & Jerry\'s</a>')).toBe(
      '&lt;a href=&quot;x&quot;&gt;Tom &amp; Jerry&apos;s&lt;/a&gt;',
    );
  });
  it('leaves plain text unchanged', () => {
    expect(encodeHtmlEntities('hello world')).toBe('hello world');
  });
  it('numeric-encodes non-ASCII characters', () => {
    expect(encodeHtmlEntitiesNumeric('ক')).toBe('&#2453;');
    expect(encodeHtmlEntitiesNumeric('a<b')).toBe('a&lt;b');
  });
  it('decodes named, decimal and hex entities', () => {
    expect(decodeHtmlEntities('&lt;p&gt;Tom &amp; Jerry&lt;/p&gt;')).toBe('<p>Tom & Jerry</p>');
    expect(decodeHtmlEntities('&#65;&#x42;')).toBe('AB');
    expect(decodeHtmlEntities('&copy; 2026 &mdash; done')).toBe('© 2026 — done');
  });
  it('round-trips encode then decode', () => {
    const src = '<div class="x">5 > 3 & "quoted" — বাংলা</div>';
    expect(decodeHtmlEntities(encodeHtmlEntitiesNumeric(src))).toBe(src);
  });
  it('leaves unknown entities alone', () => {
    expect(decodeHtmlEntities('&notreal; &amp;')).toBe('&notreal; &');
  });
});

describe('CSV → JSON', () => {
  it('parses quoted fields with commas and escaped quotes', () => {
    expect(parseCsvLine('a,"b,c","d""e",f')).toEqual(['a', 'b,c', 'd"e', 'f']);
  });
  it('converts a basic CSV with a header row', () => {
    const res = csvToJson('name,age\nMizan,24\nAyesha,22');
    expect(res.error).toBeNull();
    expect(res.rows).toBe(2);
    expect(JSON.parse(res.json!)).toEqual([
      { name: 'Mizan', age: '24' },
      { name: 'Ayesha', age: '22' },
    ]);
  });
  it('handles a quoted field containing a comma', () => {
    const res = csvToJson('name,city\n"Rahim, Jr.",Dhaka');
    expect(res.error).toBeNull();
    expect(JSON.parse(res.json!)).toEqual([{ name: 'Rahim, Jr.', city: 'Dhaka' }]);
  });
  it('reports a row with the wrong field count', () => {
    const res = csvToJson('a,b,c\n1,2');
    expect(res.json).toBeNull();
    expect(res.error).toMatch(/Row 2 has 2 fields/);
  });
  it('reports empty input and header-only input', () => {
    expect(csvToJson('').error).toMatch(/Empty/);
    expect(csvToJson('a,b').error).toMatch(/header row/);
  });
  it('reports duplicate headers', () => {
    expect(csvToJson('a,a\n1,2').error).toMatch(/Duplicate header/);
  });
});

describe('SQL formatter', () => {
  it('tokenizes strings and comments intact', () => {
    expect(tokenizeSql("select 'a b', 1 -- note\nfrom t")).toEqual(['select', "'a b'", ',', '1', '-- note', 'from', 't']);
  });
  it('uppercases keywords and puts clauses on their own lines', () => {
    const out = formatSql("select id, name from students where age >= 18 order by name limit 10;");
    expect(out).toBe('SELECT id,\nname\nFROM students\nWHERE age >= 18\nORDER BY name\nLIMIT 10;');
  });
  it('handles GROUP BY and JOIN', () => {
    const out = formatSql('select city, count(*) from users group by city;');
    expect(out).toContain('GROUP BY city');
    expect(formatSql('select * from a left join b on a.id = b.id;')).toContain('LEFT JOIN b');
  });
  it('returns empty for empty input', () => {
    expect(formatSql('   ')).toBe('');
  });
});

describe('formula calculators', () => {
  it('pythagoras 3-4-5', () => {
    expect(computeFormula('pythagoras', { a: 3, b: 4 })?.value).toBeCloseTo(5);
  });
  it('circle area r=7', () => {
    expect(computeFormula('circle-area', { r: 7 })?.value).toBeCloseTo(Math.PI * 49);
  });
  it('triangle area 10x6', () => {
    expect(computeFormula('triangle-area', { base: 10, height: 6 })?.value).toBe(30);
  });
  it('rectangle area 8x5', () => {
    expect(computeFormula('rectangle-area', { length: 8, width: 5 })?.value).toBe(40);
  });
  it('speed 100m in 20s', () => {
    expect(computeFormula('speed', { distance: 100, time: 20 })?.value).toBe(5);
  });
  it('force 10kg x 2', () => {
    expect(computeFormula('force', { mass: 10, acceleration: 2 })?.value).toBe(20);
  });
  it('kinetic energy 2kg at 10m/s', () => {
    expect(computeFormula('kinetic-energy', { mass: 2, velocity: 10 })?.value).toBe(100);
  });
  it('potential energy 5kg at 10m', () => {
    expect(computeFormula('potential-energy', { mass: 5, height: 10 })?.value).toBe(490);
  });
  it('work 20N over 5m', () => {
    expect(computeFormula('work', { force: 20, distance: 5 })?.value).toBe(100);
  });
  it('power 1000J in 10s', () => {
    expect(computeFormula('power', { work: 1000, time: 10 })?.value).toBe(100);
  });
  it("ohm's law 2A x 5Ω", () => {
    expect(computeFormula('ohms-law', { current: 2, resistance: 5 })?.value).toBe(10);
  });
  it('quadratic x²-3x+2 roots 1 and 2', () => {
    const r = computeFormula('quadratic', { a: 1, b: -3, c: 2 });
    expect(r?.value).toBeCloseTo(2);
    expect(r?.steps).toContain('x₂ = 1.0000');
  });
  it('quadratic with negative discriminant reports no real roots', () => {
    const r = computeFormula('quadratic', { a: 1, b: 0, c: 1 });
    expect(r?.steps).toMatch(/no real roots/);
  });
  it('trig identity is ~1 for any angle', () => {
    expect(computeFormula('trig-identity', { angle: 30 })?.value).toBeCloseTo(1, 10);
    expect(computeFormula('trig-identity', { angle: 77 })?.value).toBeCloseTo(1, 10);
  });
  it('returns null for invalid inputs', () => {
    expect(computeFormula('speed', { distance: 100, time: 0 })).toBeNull();
    expect(computeFormula('circle-area', { r: -2 })).toBeNull();
  });
  it('every formula in the data has a working calculator', () => {
    for (const group of FORMULA_GROUPS) {
      for (const item of group.items) {
        const values: Record<string, number> = {};
        for (const inp of item.inputs) values[inp.key] = Number(inp.defaultValue);
        const result = computeFormula(item.id, values);
        expect(result, `formula ${item.id}`).not.toBeNull();
        expect(Number.isFinite(result!.value), `formula ${item.id}`).toBe(true);
      }
    }
  });
});

describe('periodic table data', () => {
  it('has exactly 118 elements with atomic numbers 1–118', () => {
    expect(PERIODIC_TABLE).toHaveLength(118);
    expect(PERIODIC_TABLE.map((e) => e.z).sort((a, b) => a - b)).toEqual(Array.from({ length: 118 }, (_, i) => i + 1));
  });
  it('has unique symbols', () => {
    const symbols = PERIODIC_TABLE.map((e) => e.symbol);
    expect(new Set(symbols).size).toBe(118);
  });
  it('spot-checks known elements', () => {
    expect(elementBySymbol('Fe')).toMatchObject({ z: 26, nameEn: 'Iron', mass: 55.845 });
    expect(elementBySymbol('O')).toMatchObject({ z: 8, mass: 15.999 });
    expect(elementBySymbol('Au')).toMatchObject({ z: 79, mass: 196.97 });
    expect(elementByAtomicNumber(118)).toMatchObject({ symbol: 'Og' });
    expect(elementByAtomicNumber(1)).toMatchObject({ symbol: 'H' });
  });
  it('every element has a name, mass and valid position', () => {
    for (const e of PERIODIC_TABLE) {
      expect(e.nameEn).not.toBe('');
      expect(e.mass).toBeGreaterThan(0);
      expect(e.period).toBeGreaterThanOrEqual(1);
      expect(e.period).toBeLessThanOrEqual(7);
    }
  });
});

describe('country calling codes data', () => {
  it('covers 190+ countries', () => {
    expect(COUNTRY_CODES.length).toBeGreaterThanOrEqual(190);
  });
  it('every code starts with +', () => {
    for (const c of COUNTRY_CODES) {
      expect(c.code.startsWith('+')).toBe(true);
      expect(c.nameEn).not.toBe('');
    }
  });
  it('spot-checks known codes', () => {
    const byName = (n: string) => COUNTRY_CODES.find((c) => c.nameEn === n)?.code;
    expect(byName('Bangladesh')).toBe('+880');
    expect(byName('India')).toBe('+91');
    expect(byName('United States')).toBe('+1');
    expect(byName('United Kingdom')).toBe('+44');
    expect(byName('Japan')).toBe('+81');
    expect(byName('Saudi Arabia')).toBe('+966');
  });
  it('search finds by name and by code', () => {
    expect(findCountryCodes('bangla')).toHaveLength(1);
    expect(findCountryCodes('880')[0].nameEn).toBe('Bangladesh');
    expect(findCountryCodes('')).toHaveLength(COUNTRY_CODES.length);
  });
});

describe('quotes data', () => {
  it('has 60+ quotes, every one with non-empty text and author', () => {
    expect(QUOTES.length).toBeGreaterThanOrEqual(60);
    for (const q of QUOTES) {
      expect(q.text.trim()).not.toBe('');
      expect(q.author.trim()).not.toBe('');
      expect(['bn', 'en']).toContain(q.lang);
    }
  });
  it('has both Bangla and English quotes', () => {
    expect(QUOTES.some((q) => q.lang === 'bn')).toBe(true);
    expect(QUOTES.some((q) => q.lang === 'en')).toBe(true);
  });
  it('quote of the day is deterministic for a date', () => {
    const d = new Date(2026, 10, 27);
    expect(quoteOfTheDay(d)).toBe(quoteOfTheDay(new Date(2026, 10, 27)));
  });
});

describe('full forms data', () => {
  it('has 80+ entries, every full form non-empty', () => {
    expect(FULL_FORMS.length).toBeGreaterThanOrEqual(80);
    for (const f of FULL_FORMS) {
      expect(f.short.trim()).not.toBe('');
      expect(f.full.trim()).not.toBe('');
    }
  });
  it('has unique abbreviations', () => {
    const shorts = FULL_FORMS.map((f) => f.short);
    expect(new Set(shorts).size).toBe(shorts.length);
  });
  it('spot-checks known full forms', () => {
    const byShort = (s: string) => FULL_FORMS.find((f) => f.short === s)?.full;
    expect(byShort('CPU')).toBe('Central Processing Unit');
    expect(byShort('BCS')).toBe('Bangladesh Civil Service');
    expect(byShort('SSC')).toBe('Secondary School Certificate');
    expect(byShort('NID')).toBe('National Identity Card');
    expect(byShort('ATM')).toBe('Automated Teller Machine');
    expect(byShort('GPS')).toBe('Global Positioning System');
    expect(byShort('MBBS')).toBe('Bachelor of Medicine, Bachelor of Surgery');
  });
  it('search is case-insensitive and filters by category', () => {
    expect(searchFullForms('cpu', 'all')[0].short).toBe('CPU');
    expect(searchFullForms('', 'medical').every((f) => f.category === 'medical')).toBe(true);
    expect(searchFullForms('', 'medical').length).toBeGreaterThan(0);
  });
});

describe('weather descriptions', () => {
  it('maps common WMO codes', () => {
    expect(weatherDescription(0).en).toBe('Clear sky');
    expect(weatherDescription(61).en).toBe('Rain');
    expect(weatherDescription(95).bn).toBe('বজ্রঝড়');
  });
});

describe('dayOfYear', () => {
  it('returns 1 for 1 January', () => {
    expect(dayOfYear(new Date(2026, 0, 1))).toBe(1);
  });
});
