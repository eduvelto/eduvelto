// Eduvelto — Quiz certificate renderer (owner order 28 Nov 2026,
// quiz + certificate batch).
//
// CORRECTED SPEC: recipient name YES (exactly as typed, prominent);
// issuer person's name / signature NO — no founder name, no
// handwritten image, no stylised signature text. The issuer side is
// ONLY Eduvelto's name + logo + the official Eduvelto seal (a
// circular emblem drawn on the canvas — NOT a personal seal).
// There is no handwritten signature image on file; none is faked.
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
  score: number;
  total: number;
  /** ISO date (YYYY-MM-DD). */
  dateIso: string;
  verificationId: string;
  verifyUrl: string;
}

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

export function certificateFileBase(data: QuizCertificateData): string {
  const safe = data.recipientName
    .replace(/[^\p{L}\p{N} _-]/gu, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60);
  return `Eduvelto-Certificate-${safe || 'Student'}-${data.verificationId}`;
}

const NAVY = '#0A1F44';
const NAVY_DEEP = '#071633';
const GOLD = '#C9A227';
const GOLD_DARK = '#8A6D1B';
const IVORY = '#FDFBF3';
const INK = '#1A1A1A';
const MUTED = '#5B6B8C';

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

/** Draw the official Eduvelto seal: a circular gold emblem with the
 *  Eduvelto monogram + name. No person's name, no signature. */
function drawSeal(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
): void {
  ctx.save();
  ctx.strokeStyle = GOLD_DARK;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, r - 9, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = NAVY;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `800 ${Math.round(r * 0.72)}px Poppins, "Hind Siliguri", sans-serif`;
  ctx.fillText('E', cx, cy - r * 0.22);
  ctx.font = `700 ${Math.round(r * 0.2)}px Poppins, "Hind Siliguri", sans-serif`;
  ctx.fillText('EDUVELTO', cx, cy + r * 0.32);
  ctx.font = `600 ${Math.round(r * 0.14)}px Poppins, "Hind Siliguri", sans-serif`;
  ctx.fillStyle = GOLD_DARK;
  ctx.fillText('OFFICIAL SEAL', cx, cy + r * 0.58);
  ctx.restore();
}

/**
 * Render the premium (gold + dark navy, ornamental border)
 * certificate onto a canvas — A4 landscape at ~210 DPI
 * (2480 × 1754 px, print-ready). The QR data URL (from the `qrcode`
 * package) is drawn bottom-right; pass null to omit it.
 */
export async function drawQuizCertificateCanvas(
  data: QuizCertificateData,
  qrDataUrl: string | null,
): Promise<HTMLCanvasElement> {
  // Let the Bangla webfont arrive before shaping the name — this is
  // what keeps a Bangla name from rendering as boxes.
  try {
    await Promise.all([
      document.fonts.load('700 90px "Hind Siliguri"'),
      document.fonts.load('400 40px "Hind Siliguri"'),
      document.fonts.load('700 80px "Poppins"'),
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
  const cx = W / 2;

  // Background + ornamental double border (navy outer, gold inner).
  ctx.fillStyle = IVORY;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = NAVY;
  ctx.lineWidth = 14;
  ctx.strokeRect(36, 36, W - 72, H - 72);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 5;
  ctx.strokeRect(64, 64, W - 128, H - 128);
  ctx.lineWidth = 2;
  ctx.strokeRect(78, 78, W - 156, H - 156);
  // Corner diamonds.
  ctx.fillStyle = GOLD;
  for (const [x, y] of [
    [64, 64],
    [W - 64, 64],
    [64, H - 64],
    [W - 64, H - 64],
  ] as const) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-14, -14, 28, 28);
    ctx.restore();
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let y = 150;
  // Logo (or wordmark fallback) — the issuer is Eduvelto only.
  if (logo) {
    const lh = 120;
    const lw = (logo.naturalWidth / logo.naturalHeight) * lh;
    ctx.drawImage(logo, cx - lw / 2, y, lw, lh);
    y += lh + 30;
  } else {
    ctx.fillStyle = NAVY;
    ctx.font = '800 96px Poppins, "Hind Siliguri", sans-serif';
    ctx.fillText('EDUVELTO', cx, y + 40);
    y += 130;
  }
  // Title.
  ctx.fillStyle = NAVY;
  ctx.font = '800 92px Poppins, "Hind Siliguri", sans-serif';
  ctx.fillText('Certificate of Achievement', cx, y + 46);
  y += 150;
  ctx.fillStyle = GOLD_DARK;
  ctx.font = '700 44px "Hind Siliguri", Poppins, sans-serif';
  ctx.fillText('সার্টিফিকেট', cx, y);
  y += 70;
  // Gold rule.
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cx - 260, y);
  ctx.lineTo(cx + 260, y);
  ctx.stroke();
  y += 80;
  // Presented-to.
  ctx.fillStyle = MUTED;
  ctx.font = '400 40px "Hind Siliguri", Poppins, sans-serif';
  ctx.fillText('This certificate is proudly presented to', cx, y);
  y += 90;
  // Recipient name — exactly as typed, prominent.
  ctx.fillStyle = NAVY_DEEP;
  ctx.font = '700 110px "Hind Siliguri", Poppins, sans-serif';
  const nameLines = wrapText(ctx, data.recipientName, W - 480);
  for (const line of nameLines) {
    ctx.fillText(line, cx, y);
    y += 120;
  }
  y += 10;
  ctx.fillStyle = MUTED;
  ctx.font = '400 40px "Hind Siliguri", Poppins, sans-serif';
  ctx.fillText('for successfully completing', cx, y);
  y += 80;
  ctx.fillStyle = NAVY;
  ctx.font = '700 58px "Hind Siliguri", Poppins, sans-serif';
  const quizLines = wrapText(ctx, data.quizName, W - 480);
  for (const line of quizLines) {
    ctx.fillText(line, cx, y);
    y += 72;
  }
  y += 30;
  ctx.fillStyle = INK;
  ctx.font = '600 46px "Hind Siliguri", Poppins, sans-serif';
  ctx.fillText(`Score: ${data.score} / ${data.total}`, cx, y);

  // Bottom row: date (left), seal (centre), QR + ID (right).
  const bottomY = H - 300;
  ctx.textAlign = 'left';
  ctx.fillStyle = MUTED;
  ctx.font = '400 34px "Hind Siliguri", Poppins, sans-serif';
  ctx.fillText('Date', 200, bottomY - 60);
  ctx.fillStyle = INK;
  ctx.font = '600 38px "Hind Siliguri", Poppins, sans-serif';
  ctx.fillText(data.dateIso, 200, bottomY - 10);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(200, bottomY + 30);
  ctx.lineTo(560, bottomY + 30);
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = MUTED;
  ctx.font = '400 30px "Hind Siliguri", Poppins, sans-serif';
  ctx.fillText('Issued by Eduvelto', cx, bottomY + 130);
  drawSeal(ctx, cx, bottomY - 40, 105);

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
  ctx.fillText(
    'Practice certificate — the details in this certificate are carried in its verify link; Eduvelto keeps no server record of it.',
    cx,
    H - 130,
  );
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
