/**
 * Text to PDF + Images to PDF — jsPDF engine (Batch 3, 27 Nov 2026).
 *
 * jsPDF is loaded with a dynamic `import()` INSIDE the build function
 * only. HONEST LIMIT (same precedent as Certificate Maker): jsPDF has
 * NO Bangla glyphs — Bangla (and any non-Latin-1) characters cannot be
 * rendered into the PDF. The UI shows the text on screen in full, and
 * the PDF contains the English/Latin text only; non-Latin characters
 * are replaced with '?' and the count is reported. Nothing is silently
 * dropped.
 */

/** Replace every non-Latin-1 character with '?'. Returns the cleaned text + how many were replaced. Pure. */
export function sanitizeForPdf(text: string): { clean: string; replaced: number; hadBangla: boolean } {
  let replaced = 0;
  let hadBangla = false;
  const clean = text.replace(/[^\x00-\xFF]/g, (ch) => {
    replaced++;
    if (/[\u0980-\u09FF]/.test(ch)) hadBangla = true;
    return '?';
  });
  return { clean, replaced, hadBangla };
}

/** Wrap text into lines of at most `maxChars` characters, keeping words whole where possible. Pure. */
export function splitTextToLines(text: string, maxChars: number): string[] {
  if (!Number.isInteger(maxChars) || maxChars < 10) {
    throw new Error(`maxChars must be an integer of at least 10, got ${maxChars}`);
  }
  const lines: string[] = [];
  for (const paragraph of text.split('\n')) {
    if (paragraph.trim() === '') {
      lines.push('');
      continue;
    }
    let current = '';
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      if (word.length > maxChars) {
        if (current) { lines.push(current); current = ''; }
        for (let i = 0; i < word.length; i += maxChars) lines.push(word.slice(i, i + maxChars));
        continue;
      }
      const next = current ? `${current} ${word}` : word;
      if (next.length > maxChars) {
        lines.push(current);
        current = word;
      } else {
        current = next;
      }
    }
    if (current) lines.push(current);
  }
  return lines;
}

export interface TextPdfOptions {
  title?: string;
  /** Font size in points (default 12). */
  fontSize?: number;
}

/** Build a PDF from plain text (Latin only — see sanitizeForPdf). */
export async function buildTextPdf(text: string, options: TextPdfOptions = {}): Promise<Blob> {
  if (typeof text !== 'string' || text.trim() === '') {
    throw new Error('Text must not be empty');
  }
  const fontSize = options.fontSize ?? 12;
  if (!Number.isFinite(fontSize) || fontSize < 8 || fontSize > 24) {
    throw new Error(`fontSize must be between 8 and 24, got ${fontSize}`);
  }
  const { clean } = sanitizeForPdf(text);
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 48;
  const lineHeight = fontSize * 1.5;
  const maxChars = Math.max(20, Math.floor((pageWidth - margin * 2) / (fontSize * 0.55)));
  let y = margin;
  if (options.title) {
    const { clean: title } = sanitizeForPdf(options.title);
    doc.setFontSize(18);
    doc.text(title || 'Document', margin, y);
    y += 30;
  }
  doc.setFontSize(fontSize);
  for (const line of splitTextToLines(clean, maxChars)) {
    if (y + lineHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
    if (line) doc.text(line, margin, y);
    y += lineHeight;
  }
  const out = doc.output('arraybuffer');
  return new Blob([out], { type: 'application/pdf' });
}

/** Fit an image inside a page box (margins included), keeping aspect ratio. Pure. */
export function fitImageToPage(
  imgW: number,
  imgH: number,
  pageW: number,
  pageH: number,
  margin: number,
): { w: number; h: number; x: number; y: number } {
  if (imgW <= 0 || imgH <= 0 || pageW <= 0 || pageH <= 0 || margin < 0) {
    throw new Error('fitImageToPage needs positive dimensions and a non-negative margin');
  }
  const availW = pageW - margin * 2;
  const availH = pageH - margin * 2;
  if (availW <= 0 || availH <= 0) throw new Error('Margin is too large for this page size');
  const scale = Math.min(availW / imgW, availH / imgH, 1);
  const w = imgW * scale;
  const h = imgH * scale;
  return { w, h, x: (pageW - w) / 2, y: (pageH - h) / 2 };
}

export interface PdfImageInput {
  /** data:image/... URL of the image. */
  dataUrl: string;
  width: number;
  height: number;
}

/**
 * Build a PDF with one image per page from data URLs (JPEG/PNG).
 * PNG images with transparency get a white page behind them.
 */
export async function buildImagesPdf(images: PdfImageInput[]): Promise<Blob> {
  if (!Array.isArray(images) || images.length === 0) {
    throw new Error('At least one image is required');
  }
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 36;
  images.forEach((img, i) => {
    if (i > 0) doc.addPage();
    const format = img.dataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
    const { w, h, x, y } = fitImageToPage(img.width, img.height, pageW, pageH, margin);
    doc.addImage(img.dataUrl, format, x, y, w, h);
  });
  const out = doc.output('arraybuffer');
  return new Blob([out], { type: 'application/pdf' });
}
