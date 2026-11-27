// Certificate Maker — unit tests for the pure parts.
// Every expected value below is hand-computed; see the comments.
// jspdf rendering itself is NOT tested here — only a smoke check that
// the UI source uses a dynamic import() for it (see the UI test).
import { describe, it, expect } from 'vitest';
import {
  getCertificateTemplateStyle,
  validateCertificateData,
  todayIsoDate,
  formatCertificateDate,
  buildCertificateFilename,
  type CertificateData,
} from '../../tools/certificateMaker';

const VALID: CertificateData = {
  recipient: 'Rahim Uddin',
  courseTitle: 'English Spoken Course',
  issuer: 'Eduvelto',
  date: '2026-11-27',
  template: 'classic',
};

describe('getCertificateTemplateStyle', () => {
  it('classic is navy + gold on white', () => {
    expect(getCertificateTemplateStyle('classic')).toEqual({
      borderColor: '#8a6d1b',
      accentColor: '#1f3864',
      backgroundColor: '#ffffff',
      nameColor: '#1f3864',
    });
  });

  it('modern is teal on a soft tint', () => {
    const style = getCertificateTemplateStyle('modern');
    expect(style.accentColor).toBe('#0b7285');
    expect(style.backgroundColor).toBe('#eef7f8');
  });

  it('minimal is plain grey on white', () => {
    const style = getCertificateTemplateStyle('minimal');
    expect(style.backgroundColor).toBe('#ffffff');
    expect(style.borderColor).toBe('#555555');
  });

  it('all three templates have a style and an unknown one throws', () => {
    for (const t of ['classic', 'modern', 'minimal'] as const) {
      expect(getCertificateTemplateStyle(t).borderColor).toMatch(/^#/);
    }
    expect(() =>
      getCertificateTemplateStyle('fancy' as 'classic'),
    ).toThrow(/Unknown certificate template/);
  });
});

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

  it('an unknown template is reported', () => {
    expect(
      validateCertificateData({ ...VALID, template: 'fancy' as 'classic' }),
    ).toEqual(['template']);
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

describe('buildCertificateFilename', () => {
  it('"Rahim Uddin" -> "certificate-rahim-uddin.pdf"', () => {
    expect(buildCertificateFilename('Rahim Uddin')).toBe('certificate-rahim-uddin.pdf');
  });

  it('empty and non-Latin names fall back to "certificate.pdf"', () => {
    expect(buildCertificateFilename('')).toBe('certificate.pdf');
    expect(buildCertificateFilename('   ')).toBe('certificate.pdf');
    expect(buildCertificateFilename('আলী')).toBe('certificate.pdf');
  });

  it('trims and collapses separators', () => {
    expect(buildCertificateFilename('  Rahim   Uddin  ')).toBe(
      'certificate-rahim-uddin.pdf',
    );
  });
});
