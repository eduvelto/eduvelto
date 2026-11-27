// Emergency Numbers Directory — unit tests.
// Every expected value below is hand-computed; see the comments.
import { describe, it, expect } from 'vitest';
import {
  EMERGENCY_NUMBERS,
  filterEmergencyNumbers,
  allEntriesHaveNumbers,
  telLink,
} from '../../tools/emergencyNumbers';

describe('EMERGENCY_NUMBERS', () => {
  it('999 National Emergency Service is first', () => {
    expect(EMERGENCY_NUMBERS[0].number).toBe('999');
    expect(EMERGENCY_NUMBERS[0].nameEn).toBe('National Emergency Service');
    expect(EMERGENCY_NUMBERS[0].category).toBe('emergency');
  });

  it('every entry has a non-empty number and a tel: link', () => {
    expect(allEntriesHaveNumbers(EMERGENCY_NUMBERS)).toBe(true);
    for (const entry of EMERGENCY_NUMBERS) {
      expect(entry.number.trim()).not.toBe('');
      // Numbers are digits only (short codes) — no invented landline.
      expect(entry.number).toMatch(/^\d+$/);
      expect(telLink(entry)).toBe(`tel:${entry.number}`);
    }
  });

  it('includes the Fire Service hotline 16163 in the fire category', () => {
    const fire = EMERGENCY_NUMBERS.find((e) => e.category === 'fire');
    expect(fire?.number).toBe('16163');
    expect(fire?.nameEn).toContain('Fire Service');
  });

  it('allEntriesHaveNumbers rejects an empty list or an empty number', () => {
    expect(allEntriesHaveNumbers([])).toBe(false);
    expect(
      allEntriesHaveNumbers([{ ...EMERGENCY_NUMBERS[0], number: '  ' }]),
    ).toBe(false);
  });
});

describe('filterEmergencyNumbers', () => {
  it('empty query + all keeps the full list in order, 999 first', () => {
    const out = filterEmergencyNumbers(EMERGENCY_NUMBERS, '', 'all');
    expect(out).toEqual([...EMERGENCY_NUMBERS]);
    expect(out[0].number).toBe('999');
  });

  it('search "fire" matches only the Fire Service entry', () => {
    const out = filterEmergencyNumbers(EMERGENCY_NUMBERS, 'fire', 'all');
    expect(out.map((e) => e.number)).toEqual(['16163']);
  });

  it('search "999" matches the two 999 entries (emergency + police)', () => {
    const out = filterEmergencyNumbers(EMERGENCY_NUMBERS, '999', 'all');
    expect(out).toHaveLength(2);
    expect(out.every((e) => e.number === '999')).toBe(true);
  });

  it('search matches the Bangla name too', () => {
    const out = filterEmergencyNumbers(EMERGENCY_NUMBERS, 'ফায়ার', 'all');
    expect(out.map((e) => e.number)).toEqual(['16163']);
  });

  it('category filter "fire" returns only the Fire Service entry', () => {
    expect(
      filterEmergencyNumbers(EMERGENCY_NUMBERS, '', 'fire').map((e) => e.number),
    ).toEqual(['16163']);
  });

  it('category filter "hospital" returns only the health call centre', () => {
    expect(
      filterEmergencyNumbers(EMERGENCY_NUMBERS, '', 'hospital').map((e) => e.number),
    ).toEqual(['16263']);
  });

  it('query + category combine: "999" in police returns only the police entry', () => {
    const out = filterEmergencyNumbers(EMERGENCY_NUMBERS, '999', 'police');
    expect(out).toHaveLength(1);
    expect(out[0].category).toBe('police');
  });

  it('an unmatched query returns an empty list', () => {
    expect(filterEmergencyNumbers(EMERGENCY_NUMBERS, 'zzz-no-match', 'all')).toEqual([]);
  });
});
