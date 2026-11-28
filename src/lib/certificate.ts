// Eduvelto — Quiz certificate renderer (owner order 28 Nov 2026,
// quiz + certificate batch).
//
// CORRECTED SPEC: recipient name YES (exactly as typed, prominent);
// issuer person's name / signature NO — no founder name, no
// handwritten image, no stylised signature text. The issuer side is
// ONLY Eduvelto's name + logo + the "Issued by Eduvelto" line.
// There is NO seal on the certificate (removed 28 Nov 2026, owner
// design correction — supersedes the earlier remove-only-the-text
// note). There is no handwritten signature image on file; none is
// faked.
//
// Bangla fix: the certificate is drawn on a canvas (the browser
// shapes Bangla with the loaded Hind Siliguri webfont — awaited via
// document.fonts before drawing) and exported as PNG from the
// canvas; the PDF embeds that canvas image, never jsPDF text, so a
// Bangla name can never render as boxes.
//
// HONESTY: client-side only, no server record. The certificate
// carries a unique verification ID (EDU-2026-XXXX, random
// client-side) + a QR code encoding the self-contained verify URL.
// Nothing here says "server-verified" or claims backend verification.

import {
  encodeCertificatePayload,
  makeVerificationId,
  type CertificatePayload,
} from './freeQuiz';

export interface QuizCertificateData {
  recipientName: string;
  quizName: string;
  /** Quiz score — absent for maker certificates, which have no score. */
  score?: number;
  /** Total the score is out of — only meaningful with `score`. */
  total?: number;
  /** ISO date (YYYY-MM-DD). */
  dateIso: string;
  verificationId: string;
  verifyUrl: string;
  /** Footer honesty line; defaults to the quiz line when absent. */
  footerNote?: string;
  /**
   * Achievement line above the course title, e.g.
   * "for successfully completing". Defaults to that line when
   * absent — the quiz keeps its exact current line; the maker lets
   * the user rewrite it.
   */
  achievementLine?: string;
  /**
   * Premium theme — a colour map over the SAME layout (same wave
   * header, ribbon, rosette, logo, fonts; only header / ribbon /
   * accent colours differ). Defaults to 'gold-navy'; the quiz always
   * uses the default.
   */
  theme?: CertificateThemeId;
}

/**
 * Premium certificate themes — variants of the SAME wave layout,
 * not the old classic/modern/minimal templates (removed 28 Nov
 * 2026). Only the header / ribbon / accent colours differ; the wave
 * layout, logo and fonts are identical in all three.
 * Gold stays the accent in every theme so all three look premium.
 */
export type CertificateThemeId = 'gold-navy' | 'teal-gold' | 'maroon-gold';

export interface CertificateTheme {
  id: CertificateThemeId;
  nameEn: string;
  nameBn: string;
  /** Primary (wave header + ribbon) colour. */
  navy: string;
  /** Darker shade of the primary, for the recipient name. */
  navyDeep: string;
  /** Accent (title, rosette, rules). */
  gold: string;
  /** Darker gold, for secondary text. */
  goldDark: string;
  /** Page background. */
  ivory: string;
  ink: string;
  muted: string;
}

export const CERTIFICATE_THEMES: readonly CertificateTheme[] = [
  {
    id: 'gold-navy',
    nameEn: 'Gold & Navy',
    nameBn: 'সোনালি ও নেভি',
    navy: '#0A1F44',
    navyDeep: '#071633',
    gold: '#C9A227',
    goldDark: '#8A6D1B',
    ivory: '#FDFBF3',
    ink: '#1A1A1A',
    muted: '#5B6B8C',
  },
  {
    id: 'teal-gold',
    nameEn: 'Teal & Gold',
    nameBn: 'টিল ও সোনালি',
    navy: '#0B4F4A',
    navyDeep: '#07332F',
    gold: '#C9A227',
    goldDark: '#8A6D1B',
    ivory: '#FDFBF3',
    ink: '#1A1A1A',
    muted: '#4E6B68',
  },
  {
    id: 'maroon-gold',
    nameEn: 'Maroon & Gold',
    nameBn: 'মেরুন ও সোনালি',
    navy: '#5B1F2A',
    navyDeep: '#3D121B',
    gold: '#C9A227',
    goldDark: '#8A6D1B',
    ivory: '#FDFBF3',
    ink: '#1A1A1A',
    muted: '#6E5560',
  },
];

/** Resolve a theme id; unknown ids fall back to the gold-navy default. */
export function getCertificateTheme(
  id: CertificateThemeId = 'gold-navy',
): CertificateTheme {
  return CERTIFICATE_THEMES.find((t) => t.id === id) ?? CERTIFICATE_THEMES[0];
}

/** Default footer line for quiz certificates. */
export const QUIZ_CERTIFICATE_FOOTER =
  'Practice certificate — the details in this certificate are carried in its verify link; Eduvelto keeps no server record of it.';

/** Footer line for maker certificates — honest, and never calls the
 *  certificate a "Practice certificate" (that wording is quiz-only). */
export const MAKER_CERTIFICATE_FOOTER =
  'The details in this certificate are carried in its verify link; Eduvelto keeps no server record of it.';

export function buildQuizCertificateData(
  recipientName: string,
  quizName: string,
  score: number,
  total: number,
  dateIso: string,
): QuizCertificateData {
  const verificationId = makeVerificationId();
  const payload: CertificatePayload = {
    v: 1,
    id: verificationId,
    n: recipientName.trim(),
    q: quizName,
    s: score,
    d: dateIso,
  };
  return {
    recipientName: recipientName.trim(),
    quizName,
    score,
    total,
    dateIso,
    verificationId,
    verifyUrl: `https://eduvelto.com/verify/${verificationId}?d=${encodeCertificatePayload(payload)}`,
  };
}

/**
 * Build certificate data for a Certificate Maker certificate: no
 * score (the maker has none), so the payload carries no `s` and the
 * rendered certificate shows no score line. The caller owns the
 * verification ID — mint it once with makeVerificationId() and keep
 * it in state, so the ID never changes on keystrokes. `opts` carries
 * the maker's customizations (achievement line + theme); both flow
 * into the preview canvas and the download, which are the same canvas.
 */
export function buildMakerCertificateData(
  recipientName: string,
  courseTitle: string,
  dateIso: string,
  verificationId: string,
  opts?: { achievementLine?: string; theme?: CertificateThemeId },
): QuizCertificateData {
  const payload: CertificatePayload = {
    v: 1,
    id: verificationId,
    n: recipientName.trim(),
    q: courseTitle,
    d: dateIso,
  };
  return {
    recipientName: recipientName.trim(),
    quizName: courseTitle,
    dateIso,
    verificationId,
    verifyUrl: `https://eduvelto.com/verify/${verificationId}?d=${encodeCertificatePayload(payload)}`,
    footerNote: MAKER_CERTIFICATE_FOOTER,
    achievementLine: opts?.achievementLine,
    theme: opts?.theme,
  };
}

export function certificateFileBase(data: QuizCertificateData): string {
  const safe = data.recipientName
    .replace(/[^\p{L}\p{N} _-]/gu, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60);
  return `Eduvelto-Certificate-${safe || 'Student'}-${data.verificationId}`;
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth || !line) {
      line = test;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

async function loadImage(
  src: string,
  timeoutMs = 2500,
): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    const timer = window.setTimeout(() => resolve(null), timeoutMs);
    img.onload = () => {
      window.clearTimeout(timer);
      resolve(img);
    };
    img.onerror = () => {
      window.clearTimeout(timer);
      resolve(null);
    };
    img.src = src;
  });
}

async function loadQrImage(
  dataUrl: string | null,
): Promise<HTMLImageElement | null> {
  if (!dataUrl) return null;
  return loadImage(dataUrl, 5000);
}

/**
 * Render the premium WAVE certificate onto a canvas — A4 landscape
 * at ~210 DPI (2480 × 1754 px, print-ready). Owner reference design
 * (28 Nov 2026, "make it like this"), adapted per the binding rules:
 * dark-navy wave header across the top, gold CERTIFICATE title
 * top-left, navy vertical ribbon on the left carrying a gold rosette
 * (white centre: small logo above "QUIZ" / "AWARDS" in navy bold),
 * white body with a faint guilloche wavy-line pattern, script-style
 * recipient name. The QR data URL (from the `qrcode` package) is
 * drawn bottom-right; pass null to omit it.
 *
 * BINDING: NO signature lines anywhere; NO seal anywhere (no emblem,
 * no seal text). The bottom row carries date (left), QR + ID (right)
 * and the centred "Issued by Eduvelto" line. The previous
 * ornamental-border design is retired — it is not kept as a theme.
 */
function drawWaveEdge(ctx: CanvasRenderingContext2D, W: number): void {
  // Bottom edge of the wave header, right → left. The header is a
  // band ~330 px deep on the right, dipping to ~430–480 px on the
  // left through two smooth bezier swells.
  ctx.moveTo(W, 330);
  ctx.bezierCurveTo(W * 0.78, 470, W * 0.58, 300, W * 0.38, 400);
  ctx.bezierCurveTo(W * 0.22, 480, W * 0.08, 380, 0, 430);
}

function drawGuilloche(
  ctx: CanvasRenderingContext2D,
  theme: CertificateTheme,
  x0: number,
  x1: number,
  y0: number,
  y1: number,
): void {
  // Faint wavy lines across the body — decorative only, low opacity
  // so the text stays perfectly readable.
  ctx.save();
  ctx.strokeStyle = theme.navy;
  ctx.globalAlpha = 0.05;
  ctx.lineWidth = 1.5;
  const rows = 12;
  for (let i = 0; i < rows; i++) {
    const yBase = y0 + ((y1 - y0) * (i + 0.5)) / rows;
    ctx.beginPath();
    ctx.moveTo(x0, yBase);
    for (let x = x0; x <= x1; x += 40) {
      const t = (x - x0) / (x1 - x0);
      ctx.lineTo(x, yBase + Math.sin(t * Math.PI * 6 + i) * 10);
    }
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Draw the gold award rosette pinned on the ribbon: a scalloped
 * gold disc whose white centre reads "QUIZ AWARDS" — small Eduvelto
 * logo image on top, then "QUIZ" / "AWARDS" stacked below it in
 * navy bold (owner correction 28 Nov 14:00; supersedes the earlier
 * "logo only, no text" note). If the logo fails to load, the text
 * stays, centred in the disc. This is an award rosette, not a seal.
 */
function drawRosette(
  ctx: CanvasRenderingContext2D,
  theme: CertificateTheme,
  cx: number,
  cy: number,
  logo: HTMLImageElement | null,
): void {
  ctx.save();
  // Scalloped edge: small gold circles around the rim.
  ctx.fillStyle = theme.gold;
  const petals = 18;
  for (let i = 0; i < petals; i++) {
    const a = (i / petals) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * 88, cy + Math.sin(a) * 88, 17, 0, Math.PI * 2);
    ctx.fill();
  }
  // Main disc + inner ring.
  ctx.beginPath();
  ctx.arc(cx, cy, 92, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = theme.goldDark;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, 78, 0, Math.PI * 2);
  ctx.stroke();
  // White centre.
  ctx.beginPath();
  ctx.arc(cx, cy, 64, 0, Math.PI * 2);
  ctx.fillStyle = '#FFFDF5';
  ctx.fill();
  // Centre content, top to bottom: small logo, "QUIZ", "AWARDS".
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = theme.navy;
  ctx.font = '700 24px Poppins, "Hind Siliguri", sans-serif';
  if (logo) {
    const scale = Math.min(
      90 / logo.naturalWidth,
      36 / logo.naturalHeight,
    );
    const dw = logo.naturalWidth * scale;
    const dh = logo.naturalHeight * scale;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, 64, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(logo, cx - dw / 2, cy - 58 + (36 - dh) / 2, dw, dh);
    ctx.restore();
    ctx.fillText('QUIZ', cx, cy + 6);
    ctx.fillText('AWARDS', cx, cy + 32);
  } else {
    // No logo: the text stays, centred in the disc.
    ctx.fillText('QUIZ', cx, cy - 14);
    ctx.fillText('AWARDS', cx, cy + 14);
  }
  ctx.restore();
}

/**
 * Script detection for the recipient name (Bangla range
 * U+0980–U+09FF). Latin names get an elegant italic serif; Bangla
 * names get a bold Bangla sans. A mixed name (any Bangla character)
 * uses the Bangla stack, which also shapes Latin cleanly.
 *
 * Fonts, checked against what the site loads (index.html): the site
 * loads Noto Serif Bengali (600/700, no italic file — the browser
 * synthesises the oblique) and Hind Siliguri, but NOT Playfair
 * Display or Noto Sans Bengali, so the stacks below fall back to
 * the loaded fonts: Noto Serif Bengali for Latin italic serif,
 * Hind Siliguri for Bangla.
 */
export function recipientNameFont(name: string): string {
  if (/[\u0980-\u09FF]/.test(name)) {
    return '700 120px "Noto Sans Bengali", "Hind Siliguri", sans-serif';
  }
  return 'italic 700 120px "Noto Serif Bengali", Georgia, "DejaVu Serif", serif';
}

export async function drawQuizCertificateCanvas(
  data: QuizCertificateData,
  qrDataUrl: string | null,
): Promise<HTMLCanvasElement> {
  // Let the webfonts arrive before shaping the name — this is what
  // keeps a Bangla name from rendering as boxes.
  try {
    await Promise.all([
      document.fonts.load('700 90px "Hind Siliguri"'),
      document.fonts.load('400 40px "Hind Siliguri"'),
      document.fonts.load('700 80px "Poppins"'),
      document.fonts.load('italic 700 120px "Noto Serif Bengali"'),
      document.fonts.load('700 120px "Noto Sans Bengali"'),
    ]);
    await document.fonts.ready;
  } catch {
    // Fall back to whatever fonts the browser has; the canvas still
    // renders (system Bangla fonts shape correctly on most devices).
  }
  const logo = await loadImage('/logo.png');
  const qr = await loadQrImage(qrDataUrl);

  const W = 2480;
  const H = 1754;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is unavailable in this browser');
  // Theme colours — the default (gold-navy) keeps the original
  // palette's navy + gold; themes differ ONLY in header / ribbon /
  // accent colours, never in layout.
  const theme = getCertificateTheme(data.theme);
  const NAVY = theme.navy;
  const NAVY_DEEP = theme.navyDeep;
  const GOLD = theme.gold;
  const IVORY = theme.ivory;
  const INK = theme.ink;
  const MUTED = theme.muted;
  // Body text is centred clear of the left ribbon.
  const cx = (180 + W) / 2;

  // Body background.
  ctx.fillStyle = IVORY;
  ctx.fillRect(0, 0, W, H);

  // Guilloche: faint wavy lines across the body (below the header).
  drawGuilloche(ctx, theme, 200, W - 50, 560, 1420);

  // Wave header: navy band with a wavy bottom edge + gold edge line.
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(W, 0);
  drawWaveEdge(ctx, W);
  ctx.lineTo(0, 430);
  ctx.closePath();
  ctx.fillStyle = NAVY;
  ctx.fill();
  ctx.beginPath();
  drawWaveEdge(ctx, W);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 7;
  ctx.stroke();

  // Header title, top-left in gold.
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = GOLD;
  ctx.font = '800 116px Poppins, "Hind Siliguri", sans-serif';
  ctx.fillText('CERTIFICATE', 220, 148);
  ctx.fillStyle = IVORY;
  ctx.font = '600 46px Poppins, "Hind Siliguri", sans-serif';
  try {
    (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing =
      '14px';
  } catch {
    // Older browsers ignore letter spacing; the title still renders.
  }
  ctx.fillText('OF ACHIEVEMENT', 224, 248);
  try {
    (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing =
      '0px';
  } catch {
    // Ignore.
  }
  ctx.fillStyle = GOLD;
  ctx.font = '700 40px "Hind Siliguri", Poppins, sans-serif';
  ctx.fillText('সার্টিফিকেট', 224, 318);

  // Logo top-right inside the header (wordmark fallback if missing).
  if (logo) {
    const lh = 130;
    const lw = (logo.naturalWidth / logo.naturalHeight) * lh;
    ctx.drawImage(logo, W - 220 - lw, 88, lw, lh);
  } else {
    ctx.textAlign = 'right';
    ctx.fillStyle = IVORY;
    ctx.font = '800 72px Poppins, "Hind Siliguri", sans-serif';
    ctx.fillText('EDUVELTO', W - 220, 150);
    ctx.textAlign = 'left';
  }

  // Left vertical ribbon with a V-cut tail + gold edge lines.
  ctx.beginPath();
  ctx.moveTo(0, 430);
  ctx.lineTo(150, 430);
  ctx.lineTo(150, H - 170);
  ctx.lineTo(75, H - 260);
  ctx.lineTo(0, H - 170);
  ctx.closePath();
  ctx.fillStyle = NAVY;
  ctx.fill();
  ctx.strokeStyle = GOLD;
  ctx.globalAlpha = 0.85;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(10, 450);
  ctx.lineTo(10, H - 200);
  ctx.moveTo(140, 450);
  ctx.lineTo(140, H - 200);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Gold rosette pinned on the ribbon — logo image only, no text.
  drawRosette(ctx, theme, 75, 780, logo);

  // Body copy, centred clear of the ribbon.
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let y = 610;
  ctx.fillStyle = MUTED;
  ctx.font = '400 40px "Hind Siliguri", Poppins, sans-serif';
  ctx.fillText('This certificate is proudly presented to', cx, y);
  y += 100;
  // Recipient name — exactly as typed, prominent, script-style.
  ctx.fillStyle = NAVY_DEEP;
  ctx.font = recipientNameFont(data.recipientName);
  const nameLines = wrapText(ctx, data.recipientName, W - 480);
  for (const line of nameLines) {
    ctx.fillText(line, cx, y);
    y += 132;
  }
  y += 8;
  ctx.fillStyle = MUTED;
  ctx.font = '400 40px "Hind Siliguri", Poppins, sans-serif';
  // Achievement line — the quiz default, or the maker's custom text.
  // Wrapped so a long custom line stays inside the body; a
  // single-line value takes exactly the same vertical space as before.
  const achievementLines = wrapText(
    ctx,
    data.achievementLine ?? 'for successfully completing',
    W - 480,
  );
  for (const line of achievementLines) {
    ctx.fillText(line, cx, y);
    y += 56;
  }
  y += 24;
  ctx.fillStyle = NAVY;
  ctx.font = '700 58px "Hind Siliguri", Poppins, sans-serif';
  const quizLines = wrapText(ctx, data.quizName, W - 480);
  for (const line of quizLines) {
    ctx.fillText(line, cx, y);
    y += 72;
  }
  y += 30;
  // Score line — quiz certificates only. Maker certificates carry
  // no score, so the line is omitted entirely.
  if (data.score !== undefined && data.total !== undefined) {
    ctx.fillStyle = INK;
    ctx.font = '600 46px "Hind Siliguri", Poppins, sans-serif';
    ctx.fillText(`Score: ${data.score} / ${data.total}`, cx, y);
  }

  // Bottom row: date (left), QR + ID (right), and the centred
  // "Issued by Eduvelto" line below. NO signature lines, NO seal:
  // the centre of the row stays clear apart from that line.
  const bottomY = H - 300;
  ctx.textAlign = 'left';
  ctx.fillStyle = MUTED;
  ctx.font = '400 34px "Hind Siliguri", Poppins, sans-serif';
  ctx.fillText('Date', 260, bottomY - 60);
  ctx.fillStyle = INK;
  ctx.font = '600 38px "Hind Siliguri", Poppins, sans-serif';
  ctx.fillText(data.dateIso, 260, bottomY - 10);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(260, bottomY + 30);
  ctx.lineTo(620, bottomY + 30);
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = MUTED;
  ctx.font = '400 30px "Hind Siliguri", Poppins, sans-serif';
  ctx.fillText('Issued by Eduvelto', cx, bottomY + 130);

  if (qr) {
    const qs = 210;
    ctx.drawImage(qr, W - 200 - qs, bottomY - qs - 10, qs, qs);
    ctx.textAlign = 'right';
    ctx.fillStyle = INK;
    ctx.font = '700 32px Poppins, "Hind Siliguri", sans-serif';
    ctx.fillText(data.verificationId, W - 200, bottomY + 10);
    ctx.fillStyle = MUTED;
    ctx.font = '400 26px Poppins, "Hind Siliguri", sans-serif';
    ctx.fillText('Scan to verify', W - 200, bottomY + 48);
  } else {
    ctx.textAlign = 'right';
    ctx.fillStyle = INK;
    ctx.font = '700 32px Poppins, "Hind Siliguri", sans-serif';
    ctx.fillText(data.verificationId, W - 200, bottomY - 10);
  }
  // Honesty footer — self-contained, no server record claimed.
  ctx.textAlign = 'center';
  ctx.fillStyle = MUTED;
  ctx.font = '400 26px "Hind Siliguri", Poppins, sans-serif';
  ctx.fillText(data.footerNote ?? QUIZ_CERTIFICATE_FOOTER, cx, H - 130);
  return canvas;
}

/** High-resolution PNG download, client-side only. */
export function downloadCanvasPng(
  canvas: HTMLCanvasElement,
  filename: string,
): void {
  const a = document.createElement('a');
  a.href = canvas.toDataURL('image/png');
  a.download = filename;
  a.click();
}

/** Print-ready PDF (A4 landscape) from the canvas image — never
 *  jsPDF text, so Bangla renders exactly as on the canvas. */
export async function downloadCertificatePdf(
  canvas: HTMLCanvasElement,
  filename: string,
): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  doc.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 297, 210);
  doc.save(filename);
}
