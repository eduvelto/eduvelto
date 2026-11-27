/**
 * Certificate Maker — pure logic.
 *
 * FREE to make; the PDF download goes through the existing
 * <RewardedAdButton> (Free Download live, Unlock disabled until
 * AdSense approves — see src/lib/rewardedAd.ts). No ad API, no timer.
 *
 * Only the pure parts live here: template data, validation, the
 * download filename and the date display. PDF rendering (jspdf,
 * dynamic import only) lives in the UI component.
 *
 * Pure functions only: no network, no storage, no DOM.
 */

export type CertificateTemplate = 'classic' | 'modern' | 'minimal';

export const CERTIFICATE_TEMPLATES: readonly CertificateTemplate[] = [
  'classic',
  'modern',
  'minimal',
];

export interface CertificateData {
  recipient: string;
  courseTitle: string;
  issuer: string;
  /** ISO date (YYYY-MM-DD). */
  date: string;
  template: CertificateTemplate;
}

export interface CertificateTemplateStyle {
  /** Outer border colour. */
  borderColor: string;
  /** Accent colour for the title / rules. */
  accentColor: string;
  /** Background colour of the certificate. */
  backgroundColor: string;
  /** Text colour for the recipient name. */
  nameColor: string;
}

/**
 * Visual data for each template. Hand-check: classic is navy + gold
 * on white; modern is teal on a soft tint; minimal is plain dark
 * grey on white with no accent fill.
 */
export function getCertificateTemplateStyle(
  template: CertificateTemplate,
): CertificateTemplateStyle {
  switch (template) {
    case 'classic':
      return {
        borderColor: '#8a6d1b',
        accentColor: '#1f3864',
        backgroundColor: '#ffffff',
        nameColor: '#1f3864',
      };
    case 'modern':
      return {
        borderColor: '#0b7285',
        accentColor: '#0b7285',
        backgroundColor: '#eef7f8',
        nameColor: '#0b7285',
      };
    case 'minimal':
      return {
        borderColor: '#555555',
        accentColor: '#333333',
        backgroundColor: '#ffffff',
        nameColor: '#222222',
      };
    default:
      throw new Error(`Unknown certificate template, got ${template as string}`);
  }
}

/**
 * Validate the form. Returns the list of missing field keys (empty
 * when the certificate is ready to preview / download). The date must
 * be a real YYYY-MM-DD date.
 */
export function validateCertificateData(data: CertificateData): string[] {
  const missing: string[] = [];
  if (data.recipient.trim() === '') missing.push('recipient');
  if (data.courseTitle.trim() === '') missing.push('courseTitle');
  if (data.issuer.trim() === '') missing.push('issuer');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date) || Number.isNaN(Date.parse(data.date))) {
    missing.push('date');
  }
  if (!CERTIFICATE_TEMPLATES.includes(data.template)) missing.push('template');
  return missing;
}

/** Today's date as YYYY-MM-DD (local time), the form's default. */
export function todayIsoDate(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Display form of an ISO date, e.g. "2026-11-27" -> "27 Nov 2026"
 * (en) / "২৭ নভেম্বর ২০২৬" is left to the UI; this returns the
 * Latin-script form used on the PDF. Hand-check: 2026-11-27 ->
 * "27 November 2026"; 2027-01-04 -> "4 January 2027".
 */
export function formatCertificateDate(isoDate: string): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  const [y, m, d] = parts;
  const monthIndex = Number(m) - 1;
  if (!Number.isInteger(monthIndex) || monthIndex < 0 || monthIndex > 11) return isoDate;
  if (!/^\d{4}$/.test(y) || !/^\d{1,2}$/.test(d)) return isoDate;
  return `${Number(d)} ${months[monthIndex]} ${y}`;
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Download filename, e.g. recipient "Rahim Uddin" ->
 * "certificate-rahim-uddin.pdf". Non-Latin names slugify to the
 * fallback "certificate.pdf" rather than an empty or broken name.
 * Hand-check: "Rahim Uddin" -> "certificate-rahim-uddin.pdf";
 * "" -> "certificate.pdf"; "আলী" -> "certificate.pdf".
 */
export function buildCertificateFilename(recipient: string): string {
  const slug = slugify(recipient);
  return slug === '' ? 'certificate.pdf' : `certificate-${slug}.pdf`;
}
