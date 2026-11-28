/**
 * Certificate Maker — pure logic.
 *
 * FREE to make; the download goes through the existing
 * <RewardedAdButton> (Free Download live, Unlock disabled until
 * AdSense approves — see src/lib/rewardedAd.ts). No ad API, no timer.
 *
 * The certificate itself is drawn by the SHARED renderer in
 * src/lib/certificate.ts — the same premium design as the quiz
 * certificate (wave header, ribbon + rosette, logo, QR +
 * verification ID). There is exactly ONE design: the old
 * classic/modern/minimal templates were removed 28 Nov 2026.
 *
 * Only the pure parts live here: validation and the date display.
 * Rendering + download live in the UI component via the shared
 * renderer. Pure functions only: no network, no storage, no DOM.
 */

export interface CertificateData {
  recipient: string;
  courseTitle: string;
  issuer: string;
  /** ISO date (YYYY-MM-DD). */
  date: string;
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
