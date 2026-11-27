/**
 * PDF Compressor — pure logic (Tool #3), best-effort.
 *
 * Re-saves the PDF through `pdf-lib` (dynamic `import()` INSIDE the
 * function only — never a static import) with object streams enabled,
 * which drops unused objects and re-serialises the file. How much (if
 * anything) is saved depends entirely on the input file: a PDF that is
 * already compact comes back the same size, and this module never claims
 * a guaranteed ratio. The result always reports the real byte counts.
 * All processing is 100% in the browser: the file never leaves the device.
 *
 * Pure function (apart from the lazy library load): no network, no
 * storage, no DOM.
 */

export interface PdfCompressionResult {
  /** The re-saved PDF. */
  blob: Blob;
  /** Input size in bytes. */
  originalBytes: number;
  /** Output size in bytes. */
  newBytes: number;
  /** Percent saved: (original - new) / original * 100 (0 when nothing saved). */
  savedPercent: number;
}

/**
 * Best-effort PDF compression by re-saving via pdf-lib.
 *
 * @param pdf the source PDF as a File/Blob.
 * @returns `{ blob, originalBytes, newBytes, savedPercent }`.
 * @throws when the input is empty or cannot be read as a PDF.
 */
export async function compressPdf(pdf: Blob): Promise<PdfCompressionResult> {
  if (!(pdf instanceof Blob) || pdf.size === 0) {
    throw new Error('compressPdf needs a non-empty PDF file');
  }
  const originalBytes = pdf.size;
  // Lazy-load only: pdf-lib is fetched when the user actually compresses.
  const { PDFDocument } = await import('pdf-lib');
  let doc: Awaited<ReturnType<typeof PDFDocument.load>>;
  try {
    doc = await PDFDocument.load(await pdf.arrayBuffer());
  } catch {
    throw new Error('Could not read this file as a PDF — it may be corrupt or not a PDF');
  }
  const bytes = await doc.save({ useObjectStreams: true });
  const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
  const newBytes = blob.size;
  const savedPercent =
    newBytes >= originalBytes ? 0 : Math.round(((originalBytes - newBytes) / originalBytes) * 1000) / 10;
  return { blob, originalBytes, newBytes, savedPercent };
}
