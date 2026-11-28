// Certificate Maker — unit tests for the pure parts.
// Every expected value below is hand-computed; see the comments.
// The certificate itself is drawn by the shared renderer in
// src/lib/certificate.ts (same design as the quiz certificate) —
// the old classic/modern/minimal templates were removed 28 Nov
// 2026, so there is no template logic left to test here.
import { describe, it, expect } from 'vitest';
import {
  validateCertificateData,
  todayIsoDate,
  formatCertificateDate,
  type CertificateData,
} from '../../tools/certificateMaker';

const VALID: CertificateData = {
  recipient: 'Rahim Uddin',
  courseTitle: 'English Spoken Course',
  issuer: 'Eduvelto',
  date: '2026-11-27',
};

describe('validateCertificateData', () => {
  it('a complete form has no missing fields', () => {
    expect(validateCertificateData(VALID)).toEqual([]);
  });

  it('blank recipient / course / issuer are reported', () => {
    expect(
      validateCertificateData({ ...VALID, recipient: '   ', issuer: '' }),
    ).toEqual(['recipient', 'issuer']);
    expect(validateCertificateData({ ...VALID, courseTitle: '' })).toEqual([
      'courseTitle',
    ]);
  });

  it('a malformed or impossible date is reported', () => {
    expect(validateCertificateData({ ...VALID, date: '27-11-2026' })).toEqual([
      'date',
    ]);
    expect(validateCertificateData({ ...VALID, date: '' })).toEqual(['date']);
  });
});

describe('todayIsoDate', () => {
  it('formats a fixed local date as YYYY-MM-DD', () => {
    // new Date(2026, 10, 27) is 27 Nov 2026 in local time (month is 0-based).
    expect(todayIsoDate(new Date(2026, 10, 27))).toBe('2026-11-27');
    expect(todayIsoDate(new Date(2027, 0, 4))).toBe('2027-01-04');
  });
});

describe('formatCertificateDate', () => {
  it('2026-11-27 -> "27 November 2026"', () => {
    expect(formatCertificateDate('2026-11-27')).toBe('27 November 2026');
  });

  it('2027-01-04 -> "4 January 2027"', () => {
    expect(formatCertificateDate('2027-01-04')).toBe('4 January 2027');
  });

  it('passes an unparseable value through unchanged', () => {
    expect(formatCertificateDate('not-a-date')).toBe('not-a-date');
  });
});
