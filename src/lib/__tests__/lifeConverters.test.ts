// Eduvelto — Life converters unit tests (§3C).
// Expected values are hand-computed from the conversion constants.

import { describe, expect, it } from 'vitest';
import {
  CURRENCY_RATES_AS_OF,
  CURRENCY_RATES_BDT,
  SUPPORTED_CURRENCIES,
  convertCurrency,
  convertUnit,
  unitsForCategory,
} from '../lifeConverters';

describe('convertCurrency', () => {
  it('USD → BDT uses the static table', () => {
    expect(convertCurrency(100, 'USD', 'BDT')).toBeCloseTo(100 * CURRENCY_RATES_BDT.USD, 6);
  });

  it('BDT → USD inverts the rate', () => {
    const r = convertCurrency(CURRENCY_RATES_BDT.USD, 'BDT', 'USD');
    expect(r).toBeCloseTo(1, 9);
  });

  it('converts between two foreign currencies via BDT', () => {
    // 100 USD → EUR = 100 × 124.42 / 136.35
    expect(convertCurrency(100, 'USD', 'EUR')).toBeCloseTo(91.25, 1);
  });

  it('same currency is identity', () => {
    expect(convertCurrency(123.45, 'INR', 'INR')).toBeCloseTo(123.45, 9);
  });

  it('rejects unknown currencies and negative amounts', () => {
    expect(convertCurrency(10, 'XXX', 'BDT')).toBeNull();
    expect(convertCurrency(10, 'USD', 'XXX')).toBeNull();
    expect(convertCurrency(-10, 'USD', 'BDT')).toBeNull();
  });

  it('rates table covers the required currencies with a dated as-of', () => {
    for (const code of ['USD', 'EUR', 'GBP', 'INR', 'SAR', 'AED', 'MYR', 'SGD', 'AUD', 'CAD', 'CNY', 'JPY', 'BDT']) {
      expect(SUPPORTED_CURRENCIES).toContain(code);
      expect(CURRENCY_RATES_BDT[code]).toBeGreaterThan(0);
    }
    expect(CURRENCY_RATES_AS_OF).toBe('2026-11-23');
  });
});

describe('convertUnit', () => {
  it('length: 1 km = 1000 m; 1 mile = 1609.344 m', () => {
    expect(convertUnit('length', 1, 'km', 'm')).toBe(1000);
    expect(convertUnit('length', 1, 'mi', 'm')).toBeCloseTo(1609.344, 6);
    expect(convertUnit('length', 12, 'in', 'ft')).toBeCloseTo(1, 9);
  });

  it('weight: 1 kg = 1000 g; 1 lb ≈ 0.4536 kg; 1 mon = 40 ser', () => {
    expect(convertUnit('weight', 1, 'kg', 'g')).toBe(1000);
    expect(convertUnit('weight', 1, 'lb', 'kg')).toBeCloseTo(0.45359237, 8);
    expect(convertUnit('weight', 1, 'mon', 'ser')).toBeCloseTo(40, 1);
  });

  it('temperature: 0 °C = 32 °F = 273.15 K; 100 °C = 212 °F', () => {
    expect(convertUnit('temperature', 0, 'c', 'f')).toBe(32);
    expect(convertUnit('temperature', 0, 'c', 'k')).toBe(273.15);
    expect(convertUnit('temperature', 100, 'c', 'f')).toBe(212);
    expect(convertUnit('temperature', 32, 'f', 'c')).toBe(0);
    expect(convertUnit('temperature', 273.15, 'k', 'c')).toBeCloseTo(0, 9);
  });

  it('volume: 1 litre = 1000 ml; 1 gallon (US) ≈ 3.7854 l', () => {
    expect(convertUnit('volume', 1, 'l', 'ml')).toBe(1000);
    expect(convertUnit('volume', 1, 'gal', 'l')).toBeCloseTo(3.785411784, 6);
  });

  it('area: 1 acre ≈ 4046.86 m²; 1 bigha = 20 katha', () => {
    expect(convertUnit('area', 1, 'acre', 'm2')).toBeCloseTo(4046.8564224, 4);
    expect(convertUnit('area', 1, 'bigha', 'katha')).toBeCloseTo(20, 6);
    expect(convertUnit('area', 100, 'decimal', 'acre')).toBeCloseTo(1, 6);
  });

  it('rejects unknown units', () => {
    expect(convertUnit('length', 1, 'parsec', 'm')).toBeNull();
    expect(convertUnit('length', 1, 'm', 'kg')).toBeNull();
    expect(convertUnit('length', Number.NaN, 'm', 'km')).toBeNull();
  });

  it('every category exposes units', () => {
    for (const cat of ['length', 'weight', 'temperature', 'volume', 'area'] as const) {
      expect(unitsForCategory(cat).length).toBeGreaterThanOrEqual(3);
    }
  });
});
