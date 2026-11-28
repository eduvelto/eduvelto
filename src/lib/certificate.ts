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
   * Template — which of the five designs to draw. Defaults to
   * 'wave' (the quiz design); the maker lets the user pick any of
   * the five. The quiz always uses the default.
   */
  template?: CertificateTemplateId;
}

/**
 * Five certificate templates, all drawn by the SHARED renderer in
 * this file (owner order 28 Nov 2026). The WAVE is the original
 * premium design (navy wave header, ribbon + rosette) and stays
 * the quiz certificate's design. The other four are framed designs
 * matched to the Pillow sample mocks in ~/workspace/your_files/:
 * emerald-royal (emerald band, Bangla-first title), modern-minimal
 * (white body, single gold frame, English-first), heritage
 * (terracotta band + footer band, Bangla-first), classic-gold
 * (navy band, English-first). The previous three colour variants
 * of the wave layout are superseded by these five templates and
 * removed.
 *
 * Common to all five: QR + verification ID, NO seal, NO signature
 * lines, NO issuer person's name. The recipient name is script
 * italic serif on the wave and BOLD serif on the other four.
 */
export type CertificateTemplateId =
  | 'wave'
  | 'emerald-royal'
  | 'modern-minimal'
  | 'heritage'
  | 'classic-gold';

export interface CertificateTemplate {
  id: CertificateTemplateId;
  nameEn: string;
  nameBn: string;
  /** Title order: Bangla-first for emerald / heritage. */
  titleOrder: 'bn-first' | 'en-first';
  /** Outer band colour; 'none' for the white minimal body. */
  band: string | 'none';
  /** Page body colour inside the band. */
  body: string;
  /** Primary colour (title / name on bn-first templates). */
  primary: string;
  /** Darker shade of the primary, for the recipient name. */
  primaryDeep: string;
  /** Recipient-name colour (bold serif on framed templates). */
  nameColor: string;
  /** Accent (gold rules, borders, rosette). */
  gold: string;
  /** Darker gold, for secondary text. */
  goldDark: string;
  /** Teal used for the Bangla subtitle on en-first templates. */
  teal: string;
  ink: string;
  muted: string;
  /** Corner ornament on the gold frame. */
  corner: 'diamond' | 'circle' | 'square' | 'none';
  /** Terracotta footer band (heritage only). */
  footerBand: boolean;
  /** Verification-ID block position. */
  idPosition: 'center' | 'right';
}

export const CERTIFICATE_TEMPLATES: readonly CertificateTemplate[] = [
  {
    id: 'wave',
    nameEn: 'Wave',
    nameBn: 'ওয়েভ',
    titleOrder: 'en-first',
    band: '#0A1F44',
    body: '#FDFBF3',
    primary: '#0A1F44',
    primaryDeep: '#071633',
    nameColor: '#071633',
    gold: '#C9A227',
    goldDark: '#8A6D1B',
    teal: '#17807A',
    ink: '#1A1A1A',
    muted: '#5B6B8C',
    corner: 'none',
    footerBand: false,
    idPosition: 'center',
  },
  {
    id: 'emerald-royal',
    nameEn: 'Emerald Royal',
    nameBn: 'এমারাল্ড রয়্যাল',
    titleOrder: 'bn-first',
    band: '#0B3D2E',
    body: '#F7F5EC',
    primary: '#0B4D33',
    primaryDeep: '#073325',
    nameColor: '#0B4D33',
    gold: '#D9A441',
    goldDark: '#8A6D1B',
    teal: '#17807A',
    ink: '#1A1A1A',
    muted: '#6B7280',
    corner: 'diamond',
    footerBand: false,
    idPosition: 'center',
  },
  {
    id: 'modern-minimal',
    nameEn: 'Modern Minimal',
    nameBn: 'মডার্ন মিনিমাল',
    titleOrder: 'en-first',
    band: 'none',
    body: '#FFFFFF',
    primary: '#142B3B',
    primaryDeep: '#0F2230',
    nameColor: '#142B3B',
    gold: '#D9A441',
    goldDark: '#8A6D1B',
    teal: '#17807A',
    ink: '#1A1A1A',
    muted: '#6B7280',
    corner: 'square',
    footerBand: false,
    idPosition: 'right',
  },
  {
    id: 'heritage',
    nameEn: 'Heritage',
    nameBn: 'হেরিটেজ',
    titleOrder: 'bn-first',
    band: '#B4552D',
    body: '#FBF3DF',
    primary: '#B4552D',
    primaryDeep: '#7A3416',
    nameColor: '#3D1F0F',
    gold: '#D9A441',
    goldDark: '#8A6D1B',
    teal: '#17807A',
    ink: '#1A1A1A',
    muted: '#6B7280',
    corner: 'circle',
    footerBand: true,
    idPosition: 'center',
  },
  {
    id: 'classic-gold',
    nameEn: 'Classic Gold',
    nameBn: 'ক্লাসিক গোল্ড',
    titleOrder: 'en-first',
    band: '#142B3B',
    body: '#F4F1E9',
    primary: '#142B3B',
    primaryDeep: '#0F2230',
    nameColor: '#142B3B',
    gold: '#D9A441',
    goldDark: '#8A6D1B',
    teal: '#17807A',
    ink: '#1A1A1A',
    muted: '#6B7280',
    corner: 'diamond',
    footerBand: false,
    idPosition: 'center',
  },
];

/** Resolve a template id; unknown ids fall back to the wave default. */
export function getCertificateTemplate(
  id: CertificateTemplateId = 'wave',
): CertificateTemplate {
  return (
    CERTIFICATE_TEMPLATES.find((t) => t.id === id) ?? CERTIFICATE_TEMPLATES[0]
  );
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
 * the maker's customizations (achievement line + template); both flow
 * into the preview canvas and the download, which are the same canvas.
 */
export function buildMakerCertificateData(
  recipientName: string,
  courseTitle: string,
  dateIso: string,
  verificationId: string,
  opts?: { achievementLine?: string; template?: CertificateTemplateId },
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
    template: opts?.template,
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
  //
  // BINDING (regression 28 Nov 2026): this MUST start with lineTo,
  // never moveTo. The header fill path runs (0, 0) → (W, 0) and then
  // continues down the right edge into this curve; a moveTo here
  // splits the path into a zero-area top subpath plus the thin lens
  // between the curve and its closing chord, so the fill covers only
  // that lens and the whole title area stays ivory — and the ivory
  // OF ACHIEVEMENT line drawn on it vanishes. When the edge is
  // stroked on its own, the caller moveTo's to (W, 330) first, so
  // the lineTo below is a no-op there.
  ctx.lineTo(W, 330);
  ctx.bezierCurveTo(W * 0.78, 470, W * 0.58, 300, W * 0.38, 400);
  ctx.bezierCurveTo(W * 0.22, 480, W * 0.08, 380, 0, 430);
}

function drawGuilloche(
  ctx: CanvasRenderingContext2D,
  theme: CertificateTemplate,
  x0: number,
  x1: number,
  y0: number,
  y1: number,
): void {
  // Faint wavy lines across the body — decorative only, low opacity
  // so the text stays perfectly readable.
  ctx.save();
  ctx.strokeStyle = theme.primary;
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
  theme: CertificateTemplate,
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
  ctx.fillStyle = theme.primary;
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
 * U+0980–U+09FF). On the WAVE template Latin names get an elegant
 * italic serif; Bangla names get a bold Bangla sans. On the four
 * framed templates the name is BOLD serif in the template's name
 * colour — Latin in bold Noto Serif Bengali / Georgia, Bangla in
 * bold Noto Sans Bengali / Hind Siliguri. A mixed name (any Bangla
 * character) uses the Bangla stack, which also shapes Latin cleanly.
 *
 * Fonts, checked against what the site loads (index.html): the site
 * loads Noto Serif Bengali (600/700, no italic file — the browser
 * synthesises the oblique) and Hind Siliguri, but NOT Playfair
 * Display or Noto Sans Bengali, so the stacks below fall back to
 * the loaded fonts: Noto Serif Bengali for Latin italic serif,
 * Hind Siliguri for Bangla.
 */
export function recipientNameFont(
  name: string,
  template: CertificateTemplateId = 'wave',
): string {
  const isBn = /[\u0980-\u09FF]/.test(name);
  if (template !== 'wave') {
    if (isBn) {
      return '700 100px "Noto Sans Bengali", "Hind Siliguri", sans-serif';
    }
    return '700 100px "Noto Serif Bengali", Georgia, "DejaVu Serif", serif';
  }
  if (isBn) {
    return '700 120px "Noto Sans Bengali", "Hind Siliguri", sans-serif';
  }
  return 'italic 700 120px "Noto Serif Bengali", Georgia, "DejaVu Serif", serif';
}

/**
 * Format an ISO date (YYYY-MM-DD) as "28 November 2026" for the
 * framed templates (their samples show the long date). Falls back
 * to the raw string when it does not parse. The wave template keeps
 * the raw ISO date, exactly as before.
 */
export function formatCertificateDateLong(isoDate: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.trim());
  if (!m) return isoDate;
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const month = months[Number(m[2]) - 1];
  const day = Number(m[3]);
  if (!month || day < 1 || day > 31) return isoDate;
  return `${day} ${month} ${m[1]}`;
}

/** Footer line printed on the four framed templates (and in the
 *  heritage footer band, in white). */
export const FRAMED_CERTIFICATE_FOOTER =
  'Eduvelto • Free Education for Bangladesh • eduvelto.com';

function setLetterSpacing(
  ctx: CanvasRenderingContext2D,
  px: string,
): void {
  try {
    (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = px;
  } catch {
    // Older browsers ignore letter spacing; the text still renders.
  }
}

/**
 * Draw one of the four FRAMED templates — matched proportionally
 * to the 1600×1131 Pillow sample mocks (scale ×1.55 to 2480×1754):
 * outer band + gold double border with corner ornaments, logo
 * top-centre, letterspaced EDUVELTO, title (Bangla-first for
 * emerald / heritage, English-first for minimal / classic), bold
 * serif recipient name with a gold rule, course line, date, QR
 * bottom-left with ONE clean "Scan to verify" caption + URL, and
 * the verification ID (centre, or bottom-right on minimal).
 * Heritage gets its terracotta footer band with white text.
 * NO seal, NO signature lines anywhere. The score line appears
 * only when a score exists (quiz); the maker has none, so it is
 * omitted there.
 */
function drawFramedCertificate(
  ctx: CanvasRenderingContext2D,
  template: CertificateTemplate,
  data: QuizCertificateData,
  logo: HTMLImageElement | null,
  qr: HTMLImageElement | null,
): void {
  const W = 2480;
  const H = 1754;
  const cx = W / 2;
  const GOLD = template.gold;
  const INK = template.ink;
  const MUTED = template.muted;

  // Outer band (none on minimal — the body is the whole page).
  if (template.band !== 'none') {
    ctx.fillStyle = template.band;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = template.body;
    ctx.fillRect(44, 44, W - 88, H - 88);
  } else {
    ctx.fillStyle = template.body;
    ctx.fillRect(0, 0, W, H);
  }

  // Gold double border + corner ornaments (minimal: one thin frame
  // with small gold corner squares instead).
  if (template.id === 'modern-minimal') {
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 3;
    ctx.strokeRect(44, 44, W - 88, H - 88);
    ctx.fillStyle = GOLD;
    for (const [ox, oy] of [[44, 44], [W - 44, 44], [44, H - 44], [W - 44, H - 44]] as const) {
      ctx.fillRect(ox - 9, oy - 9, 18, 18);
    }
  } else {
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 6;
    ctx.strokeRect(80, 80, W - 160, H - 160);
    ctx.lineWidth = 3;
    ctx.strokeRect(104, 104, W - 208, H - 208);
    for (const [ox, oy] of [[80, 80], [W - 80, 80], [80, H - 80], [W - 80, H - 80]] as const) {
      if (template.corner === 'diamond') {
        ctx.fillStyle = GOLD;
        ctx.beginPath();
        ctx.moveTo(ox, oy - 22);
        ctx.lineTo(ox + 22, oy);
        ctx.lineTo(ox, oy + 22);
        ctx.lineTo(ox - 22, oy);
        ctx.closePath();
        ctx.fill();
      } else if (template.corner === 'circle') {
        ctx.fillStyle = GOLD;
        ctx.beginPath();
        ctx.arc(ox, oy, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = template.goldDark;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(ox, oy, 16, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = GOLD;
      }
    }
  }

  // Logo top-centre (wordmark is the EDUVELTO text below, so a
  // missing logo leaves no gap in the design).
  if (logo) {
    const lh = 150;
    const lw = (logo.naturalWidth / logo.naturalHeight) * lh;
    ctx.drawImage(logo, cx - lw / 2, 130, lw, lh);
  }

  // Letterspaced EDUVELTO + short gold rule.
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = template.primary;
  ctx.font = '800 62px Poppins, "Hind Siliguri", sans-serif';
  setLetterSpacing(ctx, '22px');
  ctx.fillText('EDUVELTO', cx, 350);
  setLetterSpacing(ctx, '0px');
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cx - 170, 428);
  ctx.lineTo(cx + 170, 428);
  ctx.stroke();

  // Title — Bangla-first (emerald / heritage) or English-first
  // (minimal / classic), exactly as in the samples.
  let y = 540;
  if (template.titleOrder === 'bn-first') {
    ctx.fillStyle = template.primary;
    ctx.font = '700 88px "Hind Siliguri", "Noto Sans Bengali", sans-serif';
    ctx.fillText('সাফল্যের সনদপত্র', cx, y);
    y += 105;
    ctx.fillStyle = MUTED;
    ctx.font = '700 54px "Noto Serif Bengali", Georgia, serif';
    ctx.fillText('Certificate of Achievement', cx, y);
    y += 95;
  } else {
    ctx.fillStyle = template.primary;
    ctx.font = '700 88px "Noto Serif Bengali", Georgia, "DejaVu Serif", serif';
    ctx.fillText('Certificate of Achievement', cx, y);
    y += 105;
    ctx.fillStyle = template.teal;
    ctx.font = '700 50px "Hind Siliguri", "Noto Sans Bengali", sans-serif';
    ctx.fillText('সাফল্যের সনদপত্র', cx, y);
    y += 95;
  }

  // Presented-to line + BOLD serif recipient name + gold rule.
  ctx.fillStyle = MUTED;
  ctx.font = '400 40px "Hind Siliguri", Poppins, sans-serif';
  ctx.fillText('This certificate is proudly presented to', cx, y);
  y += 95;
  ctx.fillStyle = template.nameColor;
  ctx.font = recipientNameFont(data.recipientName, template.id);
  const nameLines = wrapText(ctx, data.recipientName, W - 500);
  for (const line of nameLines) {
    ctx.fillText(line, cx, y);
    y += 122;
  }
  y += 18;
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cx - 230, y);
  ctx.lineTo(cx + 230, y);
  ctx.stroke();
  y += 70;

  // Course line: achievement line + course title as one wrapped
  // line, then the score (quiz only) and the long-form date.
  ctx.fillStyle = INK;
  ctx.font = '400 44px "Hind Siliguri", Poppins, sans-serif';
  const courseText = `${data.achievementLine ?? 'for successfully completing'} ${data.quizName}`.trim();
  const courseLines = wrapText(ctx, courseText, W - 500);
  for (const line of courseLines) {
    ctx.fillText(line, cx, y);
    y += 58;
  }
  y += 18;
  if (data.score !== undefined && data.total !== undefined) {
    ctx.fillStyle = template.primary;
    ctx.font = '700 44px "Hind Siliguri", Poppins, sans-serif';
    ctx.fillText(`Score: ${data.score} out of ${data.total}`, cx, y);
    y += 62;
  }
  ctx.fillStyle = MUTED;
  ctx.font = '400 38px "Hind Siliguri", Poppins, sans-serif';
  ctx.fillText(formatCertificateDateLong(data.dateIso), cx, y);

  // Bottom row: QR bottom-left with ONE clean caption + URL.
  // (The minimal sample mock doubled the caption — that glitch is
  // NOT reproduced; the caption is drawn exactly once here.)
  const qrSize = template.footerBand ? 190 : 210;
  const qrX = 170;
  const qrTop = template.footerBand ? 1270 : 1290;
  if (qr) {
    ctx.drawImage(qr, qrX, qrTop, qrSize, qrSize);
  }
  ctx.textAlign = 'left';
  ctx.fillStyle = MUTED;
  ctx.font = '400 28px Poppins, "Hind Siliguri", sans-serif';
  ctx.fillText('Scan to verify', qrX, qrTop + qrSize + 34);
  ctx.font = '400 24px Poppins, "Hind Siliguri", sans-serif';
  ctx.fillText(`eduvelto.com/verify/${data.verificationId}`, qrX, qrTop + qrSize + 68);

  // Verification ID: centre (emerald / heritage / classic) or
  // bottom-right (minimal).
  if (template.idPosition === 'right') {
    ctx.textAlign = 'right';
    ctx.fillStyle = MUTED;
    ctx.font = '700 32px Poppins, "Hind Siliguri", sans-serif';
    setLetterSpacing(ctx, '4px');
    ctx.fillText('VERIFICATION ID', W - 170, 1330);
    setLetterSpacing(ctx, '0px');
    ctx.fillStyle = template.primary;
    ctx.font = '700 56px Poppins, "Hind Siliguri", sans-serif';
    ctx.fillText(data.verificationId, W - 170, 1400);
    ctx.fillStyle = MUTED;
    ctx.font = '400 30px Poppins, "Hind Siliguri", sans-serif';
    ctx.fillText('Verify at eduvelto.com/verify', W - 170, 1462);
  } else {
    ctx.textAlign = 'center';
    ctx.fillStyle = MUTED;
    ctx.font = '700 32px Poppins, "Hind Siliguri", sans-serif';
    setLetterSpacing(ctx, '4px');
    ctx.fillText('VERIFICATION ID', cx, 1330);
    setLetterSpacing(ctx, '0px');
    ctx.fillStyle = template.primary;
    ctx.font = '700 56px Poppins, "Hind Siliguri", sans-serif';
    ctx.fillText(data.verificationId, cx, 1400);
    ctx.fillStyle = MUTED;
    ctx.font = '400 30px Poppins, "Hind Siliguri", sans-serif';
    ctx.fillText('Verify at eduvelto.com/verify', cx, 1462);
  }

  // Footer: terracotta band with white text (heritage) or the
  // plain footer line (emerald / minimal / classic).
  if (template.footerBand) {
    // Band sits low (top 1555, bottom 1650 = the inner gold frame)
    // so the QR caption URL (baseline 1528, glyphs to ~1534) clears
    // it with ~20px of cream — the sample's own spacing. A taller
    // band (top 1520) covered all but the tops of that line.
    ctx.fillStyle = template.band === 'none' ? template.primary : template.band;
    ctx.fillRect(104, 1555, W - 208, 95);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '400 34px Poppins, "Hind Siliguri", sans-serif';
    ctx.fillText(FRAMED_CERTIFICATE_FOOTER, cx, 1602);
  } else {
    ctx.textAlign = 'center';
    ctx.fillStyle = MUTED;
    ctx.font = '400 30px Poppins, "Hind Siliguri", sans-serif';
    ctx.fillText(FRAMED_CERTIFICATE_FOOTER, cx, 1614);
  }
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
  // Template dispatch — the wave is the default (and the quiz's
  // only design); the four framed templates share one renderer.
  const template = getCertificateTemplate(data.template);
  if (template.id !== 'wave') {
    drawFramedCertificate(ctx, template, data, logo, qr);
    return canvas;
  }
  // Theme colours — the wave keeps the original palette's navy +
  // gold; the template's primary IS the wave navy.
  const theme = template;
  const NAVY = theme.primary;
  const NAVY_DEEP = theme.primaryDeep;
  const GOLD = theme.gold;
  const IVORY = theme.body;
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
  // Single closed subpath — top edge across, wave curve back, close
  // along the left edge — so the navy covers the whole title block.
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(W, 0);
  drawWaveEdge(ctx, W);
  ctx.lineTo(0, 430);
  ctx.closePath();
  ctx.fillStyle = NAVY;
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(W, 330);
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
  // Gold, like the title — never ivory: the subtitle sits on the
  // navy header, and ivory-on-ivory is exactly how it vanished when
  // the header fill broke (regression 28 Nov 2026). Gold on navy
  // stays visible regardless.
  ctx.fillStyle = GOLD;
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

/** JPEG quality for the certificate image embedded in the PDF
 *  (28 Nov 2026 shrink: the full-size PNG embed made a ~13 MB
 *  PDF; JPEG at 0.92 keeps the certificate visually identical —
 *  flat fills + large type compress cleanly — at ~0.27 MB, and
 *  the QR still decodes from the embedded image). */
export const CERTIFICATE_PDF_JPEG_QUALITY = 0.92;

/** Print-ready PDF (A4 landscape) from the canvas image — never
 *  jsPDF text, so Bangla renders exactly as on the canvas.
 *  The image is embedded as JPEG (not PNG): the 2480×1754
 *  canvas as PNG is ~13 MB inside the PDF; as JPEG it is
 *  ~0.27 MB with no visible difference. The PNG download path
 *  (downloadCanvasPng) is untouched. */
async function createCertificatePdfDoc(canvas: HTMLCanvasElement) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  doc.addImage(
    canvas.toDataURL('image/jpeg', CERTIFICATE_PDF_JPEG_QUALITY),
    'JPEG',
    0,
    0,
    297,
    210,
  );
  return doc;
}

/** Build the certificate PDF bytes (same document the download
 *  saves) — exported so tests can measure it without a browser. */
export async function buildCertificatePdfBytes(
  canvas: HTMLCanvasElement,
): Promise<Uint8Array> {
  const doc = await createCertificatePdfDoc(canvas);
  return new Uint8Array(doc.output('arraybuffer'));
}

export async function downloadCertificatePdf(
  canvas: HTMLCanvasElement,
  filename: string,
): Promise<void> {
  const doc = await createCertificatePdfDoc(canvas);
  doc.save(filename);
}
