/**
 * PDF Compressor — pure logic (Tool #3), best-effort.
 *
 * Two mechanisms, both 100% in the browser (the file never leaves the
 * device):
 *
 * 1. Re-save through `pdf-lib` with object streams enabled, which drops
 *    unused objects and re-serialises the file. How much (if anything)
 *    is saved depends entirely on the input file: a PDF that is already
 *    compact comes back the same size.
 * 2. Image downsampling + JPEG re-encoding (27 Nov 2026, owner order):
 *    embedded images are decoded, downscaled to a max resolution
 *    (DPI) and re-encoded as JPEG at the chosen quality. This is where
 *    real savings come from on image-heavy files — the plain re-save
 *    above barely moves them (owner's file: 4.71 MB -> 4.70 MB).
 *
 * Honesty rules: the result always reports the real byte counts, never
 * a promised ratio. If compression would make the file BIGGER, the
 * ORIGINAL file is returned (savedPercent 0) — a compressor must never
 * deliver a bigger file. In target-size mode, if the target cannot be
 * hit, the smallest attempt is returned with `targetMet: false` and the
 * UI says so instead of silently delivering a bigger file. (If the
 * ORIGINAL is already under the target, the target is met — the
 * delivered file is what is judged, not the attempt.)
 *
 * Implementation notes:
 * - pdf-lib is loaded with a dynamic `import()` INSIDE the function
 *   only — never a static import.
 * - pdf-lib's `save()` does NOT drop unreferenced objects, so replacing
 *   an image XObject in place never shrinks the file. When images were
 *   replaced, the document is rebuilt into a FRESH PDFDocument with
 *   `copyPages` (verified 27 Nov 2026: 16,556 B -> 954 B on a fixture),
 *   which copies only what the pages reference. The plain re-save path
 *   is used when no image was replaced, so metadata/outline survive.
 * - The rebuild drops document-level extras (outline, AcroForm). If the
 *   source has an AcroForm, the image pass is skipped entirely — a form
 *   must not be silently broken. Standard info-dict fields
 *   (Title/Author/Subject/Keywords/Creator/Producer) are copied over.
 * - The image pass needs canvas + createImageBitmap (browser only). In
 *   node (tests) it is skipped and the plain re-save runs instead.
 * - Only 8-bit DeviceRGB / DeviceGray Flate images and DCTDecode
 *   (JPEG) images are re-encoded. JPX/CCITT/JBIG2 images, images with
 *   an SMask, CMYK/Indexed images and tiny images (< 8 px) are skipped
 *   and counted honestly.
 *
 * Pure function (apart from the lazy library load): no network, no
 * storage, no DOM — except the canvas image pass, which is guarded.
 */

export type PdfCompressionLevel = 'light' | 'balanced' | 'strong';
export type PdfCompressPreset = 'email' | 'web' | 'print';

export interface PdfCompressSettings {
  level: PdfCompressionLevel;
  /** JPEG quality 0.1–1. */
  imageQuality: number;
  /** Max image resolution in DPI. */
  maxDpi: number;
}

export const PDF_COMPRESSION_LEVELS: Record<
  PdfCompressionLevel,
  { imageQuality: number; maxDpi: number; labelBn: string; labelEn: string }
> = {
  light: { imageQuality: 0.85, maxDpi: 300, labelBn: 'হালকা', labelEn: 'Light' },
  balanced: { imageQuality: 0.7, maxDpi: 150, labelBn: 'মাঝারি', labelEn: 'Balanced' },
  strong: { imageQuality: 0.5, maxDpi: 72, labelBn: 'শক্তিশালী', labelEn: 'Strong' },
};

/** Presets are just named settings — Email is the smallest, Print keeps the most quality. */
export const PDF_COMPRESS_PRESETS: Record<
  PdfCompressPreset,
  { level: PdfCompressionLevel; imageQuality: number; maxDpi: number; labelBn: string; labelEn: string }
> = {
  email: { level: 'strong', imageQuality: 0.5, maxDpi: 72, labelBn: 'ইমেইল (সবচেয়ে ছোট)', labelEn: 'Email (smallest)' },
  web: { level: 'balanced', imageQuality: 0.7, maxDpi: 150, labelBn: 'ওয়েব', labelEn: 'Web' },
  print: { level: 'light', imageQuality: 0.85, maxDpi: 300, labelBn: 'প্রিন্ট মান', labelEn: 'Print quality' },
};

/** Default settings — the pre-existing behaviour (Balanced / Web). */
export const DEFAULT_COMPRESS_SETTINGS: PdfCompressSettings = {
  level: 'balanced',
  imageQuality: PDF_COMPRESSION_LEVELS.balanced.imageQuality,
  maxDpi: PDF_COMPRESSION_LEVELS.balanced.maxDpi,
};

export function clampQuality(q: number): number {
  if (!Number.isFinite(q)) return DEFAULT_COMPRESS_SETTINGS.imageQuality;
  return Math.min(1, Math.max(0.1, q));
}

export function clampDpi(dpi: number): number {
  if (!Number.isFinite(dpi)) return DEFAULT_COMPRESS_SETTINGS.maxDpi;
  return Math.min(600, Math.max(36, Math.round(dpi)));
}

/**
 * Resolve the effective settings for a level + manual overrides.
 * Manual overrides win; everything is clamped to sane ranges.
 */
export function resolveCompressSettings(
  level: PdfCompressionLevel = 'balanced',
  overrides: { imageQuality?: number; maxDpi?: number } = {},
): PdfCompressSettings {
  const base = PDF_COMPRESSION_LEVELS[level] ?? PDF_COMPRESSION_LEVELS.balanced;
  return {
    level,
    imageQuality: overrides.imageQuality === undefined ? base.imageQuality : clampQuality(overrides.imageQuality),
    maxDpi: overrides.maxDpi === undefined ? base.maxDpi : clampDpi(overrides.maxDpi),
  };
}

export function presetSettings(preset: PdfCompressPreset): PdfCompressSettings {
  const p = PDF_COMPRESS_PRESETS[preset] ?? PDF_COMPRESS_PRESETS.web;
  return { level: p.level, imageQuality: p.imageQuality, maxDpi: p.maxDpi };
}

/**
 * Quality ladder for target-size mode: start at the chosen quality,
 * then step down. At most 4 attempts — each attempt re-runs the whole
 * compression, so the ladder is short on purpose.
 */
export function targetQualitySteps(startQuality: number): number[] {
  const start = clampQuality(startQuality);
  const ladder = [start, 0.6, 0.45, 0.3, 0.2, 0.1];
  const steps: number[] = [];
  for (const q of ladder) {
    if (q <= start && !steps.includes(q)) steps.push(q);
    if (steps.length >= 4) break;
  }
  return steps;
}

export interface PdfCompressOptions {
  level?: PdfCompressionLevel;
  /** JPEG quality 0.1–1 (overrides the level default). */
  imageQuality?: number;
  /** Max image resolution in DPI (overrides the level default). */
  maxDpi?: number;
  /** Target-size mode: try to get under this many bytes. Null = off. */
  targetBytes?: number | null;
}

export interface PdfCompressionResult {
  /** The compressed PDF — or the ORIGINAL file when nothing saved. */
  blob: Blob;
  /** Input size in bytes. */
  originalBytes: number;
  /** Output size in bytes. */
  newBytes: number;
  /** Percent saved: (original - new) / original * 100 (0 when nothing saved). */
  savedPercent: number;
  /** Target-size mode: true when the target was hit, false when it was
   *  not, null when no target was set. */
  targetMet: boolean | null;
  /** The target in bytes (null when target-size mode is off). */
  targetBytes: number | null;
  /** How many compression attempts ran (1 without a target). */
  attempts: number;
  /** Images actually downsampled/re-encoded in the DELIVERED file. */
  imagesProcessed: number;
  /** Images found but left alone (unsupported format, too small, …). */
  imagesSkipped: number;
  level: PdfCompressionLevel;
}

function savedPercentOf(originalBytes: number, newBytes: number): number {
  if (newBytes >= originalBytes) return 0;
  return Math.round(((originalBytes - newBytes) / originalBytes) * 1000) / 10;
}

/** Long edge of an image, in px, allowed at `maxDpi` on a page of this size (points). */
export function maxImageEdgePx(pageWidthPt: number, pageHeightPt: number, maxDpi: number): number {
  const inches = Math.max(pageWidthPt, pageHeightPt) / 72;
  return Math.max(8, Math.floor(inches * clampDpi(maxDpi)));
}

export function fitWithin(width: number, height: number, maxEdge: number): { width: number; height: number } {
  const long = Math.max(width, height);
  if (long <= maxEdge) return { width, height };
  const scale = maxEdge / long;
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

function canvasAvailable(): boolean {
  try {
    return (
      typeof document !== 'undefined' &&
      typeof document.createElement === 'function' &&
      typeof (globalThis as unknown as { createImageBitmap?: unknown }).createImageBitmap === 'function'
    );
  } catch {
    return false;
  }
}

function canvasToJpegBytes(canvas: HTMLCanvasElement, quality: number): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas JPEG export failed'));
          return;
        }
        blob.arrayBuffer().then(
          (buf) => resolve(new Uint8Array(buf)),
          (e) => reject(e instanceof Error ? e : new Error('Canvas JPEG export failed')),
        );
      },
      'image/jpeg',
      clampQuality(quality),
    );
  });
}

function drawToCanvas(source: CanvasImageSource, width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is unavailable in this browser');
  ctx.drawImage(source, 0, 0, width, height);
  return canvas;
}

interface ImagePassCounts {
  processed: number;
  skipped: number;
}

type PdfLib = typeof import('pdf-lib');

/**
 * Downsample + JPEG re-encode the images of one loaded document.
 * Returns the counts. Throws nothing — per-image failures count as skipped.
 * Requires canvas + createImageBitmap (browser only); callers must guard.
 */
async function imagePass(
  doc: Awaited<ReturnType<PdfLib['PDFDocument']['load']>>,
  pdfLib: PdfLib,
  quality: number,
  maxDpi: number,
): Promise<ImagePassCounts> {
  const { PDFName, PDFDict, PDFRawStream, PDFNumber, PDFArray, decodePDFRawStream } = pdfLib;
  let processed = 0;
  let skipped = 0;

  const pages = doc.getPages();
  for (const page of pages) {
    let resources: unknown = null;
    try {
      resources = page.node.Resources();
    } catch {
      continue;
    }
    if (!(resources instanceof PDFDict)) continue;
    const xobjects = resources.lookup(PDFName.of('XObject'));
    if (!(xobjects instanceof PDFDict)) continue;
    const maxEdge = maxImageEdgePx(page.getWidth(), page.getHeight(), maxDpi);

    for (const [name, ref] of xobjects.entries()) {
      try {
        const obj = doc.context.lookup(ref);
        if (!(obj instanceof PDFRawStream)) {
          skipped += 1;
          continue;
        }
        const dict = obj.dict;
        const subtype = dict.lookup(PDFName.of('Subtype'));
        if (!(subtype instanceof PDFName) || subtype.asString() !== '/Image') {
          skipped += 1;
          continue;
        }
        // Transparency masks must survive — never touch masked images.
        if (dict.lookup(PDFName.of('SMask'))) {
          skipped += 1;
          continue;
        }
        const widthObj = dict.lookup(PDFName.of('Width'));
        const heightObj = dict.lookup(PDFName.of('Height'));
        const bpcObj = dict.lookup(PDFName.of('BitsPerComponent'));
        if (!(widthObj instanceof PDFNumber) || !(heightObj instanceof PDFNumber)) {
          skipped += 1;
          continue;
        }
        const width = widthObj.asNumber();
        const height = heightObj.asNumber();
        if (width < 8 || height < 8) {
          skipped += 1;
          continue;
        }
        // Filter names (single name or array of names).
        const filterObj = dict.lookup(PDFName.of('Filter'));
        const filters: string[] = [];
        if (filterObj instanceof PDFName) filters.push(filterObj.asString());
        else if (filterObj instanceof PDFArray) {
          for (let i = 0; i < filterObj.size(); i += 1) {
            const f = filterObj.lookup(i, PDFName);
            if (f) filters.push(f.asString());
          }
        }
        if (filters.some((f) => f === '/JPXDecode' || f === '/CCITTFaxDecode' || f === '/JBIG2Decode')) {
          skipped += 1;
          continue;
        }
        const isJpeg = filters.includes('/DCTDecode');
        const target = fitWithin(width, height, maxEdge);
        const needsDownscale = target.width < width || target.height < height;
        // A JPEG at high quality that is already small enough gains nothing.
        if (isJpeg && !needsDownscale && quality >= 0.9) {
          skipped += 1;
          continue;
        }

        let canvas: HTMLCanvasElement;
        if (isJpeg) {
          const jpegBytes = obj.getContents();
          const bitmap = await createImageBitmap(
            new Blob([jpegBytes as BlobPart], { type: 'image/jpeg' }),
          );
          try {
            canvas = drawToCanvas(bitmap, target.width, target.height);
          } finally {
            bitmap.close();
          }
        } else {
          // Flate/LZW/RunLength/ASCII: decode to raw samples, then paint.
          const bpc = bpcObj instanceof PDFNumber ? bpcObj.asNumber() : 0;
          if (bpc !== 8) {
            skipped += 1;
            continue;
          }
          const csObj = dict.lookup(PDFName.of('ColorSpace'));
          let colorSpace = '';
          if (csObj instanceof PDFName) colorSpace = csObj.asString();
          else if (csObj instanceof PDFArray) {
            const first = csObj.lookup(0, PDFName);
            colorSpace = first ? first.asString() : '';
          }
          if (colorSpace !== '/DeviceRGB' && colorSpace !== '/DeviceGray') {
            skipped += 1;
            continue;
          }
          const samples = decodePDFRawStream(obj).decode();
          const expected = width * height * (colorSpace === '/DeviceRGB' ? 3 : 1);
          if (samples.length < expected) {
            skipped += 1;
            continue;
          }
          const full = document.createElement('canvas');
          full.width = width;
          full.height = height;
          const fullCtx = full.getContext('2d');
          if (!fullCtx) {
            skipped += 1;
            continue;
          }
          const imageData = fullCtx.createImageData(width, height);
          if (colorSpace === '/DeviceRGB') {
            for (let i = 0; i < width * height; i += 1) {
              imageData.data[i * 4] = samples[i * 3];
              imageData.data[i * 4 + 1] = samples[i * 3 + 1];
              imageData.data[i * 4 + 2] = samples[i * 3 + 2];
              imageData.data[i * 4 + 3] = 255;
            }
          } else {
            for (let i = 0; i < width * height; i += 1) {
              const v = samples[i];
              imageData.data[i * 4] = v;
              imageData.data[i * 4 + 1] = v;
              imageData.data[i * 4 + 2] = v;
              imageData.data[i * 4 + 3] = 255;
            }
          }
          fullCtx.putImageData(imageData, 0, 0);
          canvas = drawToCanvas(full, target.width, target.height);
        }

        const jpegBytes = await canvasToJpegBytes(canvas, quality);
        const replacement = await doc.embedJpg(jpegBytes);
        xobjects.set(name, replacement.ref);
        processed += 1;
      } catch {
        skipped += 1;
      }
    }
  }
  return { processed, skipped };
}

function hasAcroForm(
  doc: Awaited<ReturnType<PdfLib['PDFDocument']['load']>>,
  pdfLib: PdfLib,
): boolean {
  try {
    return !!doc.catalog.lookup(pdfLib.PDFName.of('AcroForm'));
  } catch {
    return false;
  }
}

function copyInfoDict(
  src: Awaited<ReturnType<PdfLib['PDFDocument']['load']>>,
  dst: Awaited<ReturnType<PdfLib['PDFDocument']['create']>>,
): void {
  try {
    const title = src.getTitle();
    if (title) dst.setTitle(title);
    const author = src.getAuthor();
    if (author) dst.setAuthor(author);
    const subject = src.getSubject();
    if (subject) dst.setSubject(subject);
    const keywords = src.getKeywords();
    if (keywords) dst.setKeywords(keywords.split(/[,\s]+/).filter(Boolean));
    const creator = src.getCreator();
    if (creator) dst.setCreator(creator);
    const producer = src.getProducer();
    if (producer) dst.setProducer(producer);
  } catch {
    // Metadata is best-effort; a failure here must not break compression.
  }
}

interface CompressOnceResult {
  blob: Blob;
  imagesProcessed: number;
  imagesSkipped: number;
}

async function compressOnce(
  pdfBytes: Uint8Array,
  settings: PdfCompressSettings,
  pdfLib: PdfLib,
): Promise<CompressOnceResult> {
  const { PDFDocument } = pdfLib;
  const doc = await PDFDocument.load(pdfBytes);
  let imagesProcessed = 0;
  let imagesSkipped = 0;

  // Image pass only when it can actually run and cannot break a form.
  if (canvasAvailable() && !hasAcroForm(doc, pdfLib)) {
    try {
      const counts = await imagePass(doc, pdfLib, settings.imageQuality, settings.maxDpi);
      imagesProcessed = counts.processed;
      imagesSkipped = counts.skipped;
    } catch {
      // Image pass failed wholesale — fall through to plain re-save.
      imagesProcessed = 0;
    }
  }

  let bytes: Uint8Array;
  if (imagesProcessed > 0) {
    // Rebuild so the replaced (orphaned) images are dropped — pdf-lib's
    // save() keeps unreferenced objects, so an in-place save would grow.
    const fresh = await PDFDocument.create();
    copyInfoDict(doc, fresh);
    const copied = await fresh.copyPages(doc, doc.getPageIndices());
    copied.forEach((page) => fresh.addPage(page));
    bytes = await fresh.save({ useObjectStreams: true });
  } else {
    bytes = await doc.save({ useObjectStreams: true });
  }
  return {
    blob: new Blob([bytes as BlobPart], { type: 'application/pdf' }),
    imagesProcessed,
    imagesSkipped,
  };
}

/**
 * Best-effort PDF compression: re-save + (in the browser) image
 * downsampling / JPEG re-encoding at the chosen level, with an
 * optional target-size mode that steps the quality down until the
 * target is hit (or the ladder runs out).
 *
 * Default = Balanced (the pre-existing behaviour). Never returns a
 * file bigger than the input — when nothing saves, the ORIGINAL blob
 * is returned with savedPercent 0.
 *
 * @throws when the input is empty or cannot be read as a PDF.
 */
export async function compressPdf(pdf: Blob, options: PdfCompressOptions = {}): Promise<PdfCompressionResult> {
  if (!(pdf instanceof Blob) || pdf.size === 0) {
    throw new Error('compressPdf needs a non-empty PDF file');
  }
  const originalBytes = pdf.size;
  const settings = resolveCompressSettings(options.level ?? 'balanced', {
    imageQuality: options.imageQuality,
    maxDpi: options.maxDpi,
  });
  const targetBytes =
    options.targetBytes !== undefined && options.targetBytes !== null && Number.isFinite(options.targetBytes) && options.targetBytes > 0
      ? Math.floor(options.targetBytes)
      : null;

  // Lazy-load only: pdf-lib is fetched when the user actually compresses.
  const pdfLib = (await import('pdf-lib')) as PdfLib;
  const pdfBytes = new Uint8Array(await pdf.arrayBuffer());
  // Validate readability up front (same error as before).
  try {
    await pdfLib.PDFDocument.load(pdfBytes);
  } catch {
    throw new Error('Could not read this file as a PDF — it may be corrupt or not a PDF');
  }

  const qualities = targetBytes === null ? [settings.imageQuality] : targetQualitySteps(settings.imageQuality);
  let best: CompressOnceResult | null = null;
  let attempts = 0;
  for (const quality of qualities) {
    attempts += 1;
    const attempt = await compressOnce(pdfBytes, { ...settings, imageQuality: quality }, pdfLib);
    if (!best || attempt.blob.size < best.blob.size) best = attempt;
    if (targetBytes !== null && attempt.blob.size <= targetBytes) break;
  }
  const winner = best as CompressOnceResult;
  const targetMet = targetBytes === null ? null : winner.blob.size <= targetBytes;

  // Never deliver a bigger file than the input.
  if (winner.blob.size >= originalBytes) {
    return {
      blob: pdf,
      originalBytes,
      newBytes: originalBytes,
      savedPercent: 0,
      // The delivered file is the original itself: the target is met
      // when the original is already under it.
      targetMet: targetBytes === null ? null : originalBytes <= targetBytes,
      targetBytes,
      attempts,
      imagesProcessed: 0,
      imagesSkipped: winner.imagesSkipped,
      level: settings.level,
    };
  }
  return {
    blob: winner.blob,
    originalBytes,
    newBytes: winner.blob.size,
    savedPercent: savedPercentOf(originalBytes, winner.blob.size),
    targetMet,
    targetBytes,
    attempts,
    imagesProcessed: winner.imagesProcessed,
    imagesSkipped: winner.imagesSkipped,
    level: settings.level,
  };
}
