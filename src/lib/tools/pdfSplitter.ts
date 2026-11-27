/**
 * PDF Splitter — pure logic (Tool #2).
 *
 * Extracts selected pages from a PDF into a new PDF. `pdf-lib` is loaded
 * with a dynamic `import()` INSIDE the function only (never a static
 * import), so the library is lazy-loaded when the user picks a file.
 * All processing is 100% in the browser: the file never leaves the device.
 *
 * Pure functions (apart from the lazy library load): no network, no
 * storage, no DOM.
 */

/**
 * Parse a page selection string like `"1,3-5,7"` into 1-based page
 * numbers. Ranges are inclusive; duplicates are removed, order is kept.
 *
 * @param selection e.g. `"1,3-5,7"`.
 * @param pageCount total pages in the PDF (for bounds checking).
 * @throws on empty/invalid syntax or a page number outside 1..pageCount.
 */
export function parsePageSelection(selection: string, pageCount: number): number[] {
  if (typeof selection !== 'string' || selection.trim() === '') {
    throw new Error('Page selection must not be empty (e.g. "1,3-5")');
  }
  if (!Number.isInteger(pageCount) || pageCount < 1) {
    throw new Error(`pageCount must be a positive integer, got ${pageCount}`);
  }
  const pages: number[] = [];
  const seen = new Set<number>();
  const addPage = (page: number, token: string): void => {
    if (!Number.isInteger(page) || page < 1 || page > pageCount) {
      throw new Error(
        `Page ${token} is out of range: this PDF has ${pageCount} page(s), use pages 1-${pageCount}`,
      );
    }
    if (!seen.has(page)) {
      seen.add(page);
      pages.push(page);
    }
  };
  for (const rawToken of selection.split(',')) {
    const token = rawToken.trim();
    if (token === '') {
      throw new Error(`Invalid page selection "${selection}": empty entry between commas`);
    }
    const dash = token.indexOf('-');
    if (dash === -1) {
      const page = Number(token);
      if (!/^\d+$/.test(token) || !Number.isInteger(page)) {
        throw new Error(`Invalid page number "${token}" in selection "${selection}"`);
      }
      addPage(page, token);
    } else {
      const startText = token.slice(0, dash).trim();
      const endText = token.slice(dash + 1).trim();
      const start = Number(startText);
      const end = Number(endText);
      if (!/^\d+$/.test(startText) || !/^\d+$/.test(endText)) {
        throw new Error(`Invalid page range "${token}" in selection "${selection}"`);
      }
      if (start > end) {
        throw new Error(`Invalid page range "${token}": start must not exceed end`);
      }
      for (let page = start; page <= end; page++) addPage(page, token);
    }
  }
  if (pages.length === 0) {
    throw new Error(`Invalid page selection "${selection}": no pages selected`);
  }
  return pages;
}

/**
 * Split a PDF, keeping only the given 1-based page numbers.
 *
 * @param pdf the source PDF as a File/Blob.
 * @param pages 1-based page numbers to keep, in output order.
 * @returns a Blob (`application/pdf`) with only the selected pages.
 * @throws when the input is empty/not a PDF, or any page number is
 *   invalid or out of range.
 */
export async function splitPdf(pdf: Blob, pages: number[]): Promise<Blob> {
  if (!(pdf instanceof Blob) || pdf.size === 0) {
    throw new Error('splitPdf needs a non-empty PDF file');
  }
  if (!Array.isArray(pages) || pages.length === 0) {
    throw new Error('splitPdf needs at least one page number to keep');
  }
  // Lazy-load only: pdf-lib is fetched when the user actually splits.
  const { PDFDocument } = await import('pdf-lib');
  let source: Awaited<ReturnType<typeof PDFDocument.load>>;
  try {
    source = await PDFDocument.load(await pdf.arrayBuffer());
  } catch {
    throw new Error('Could not read this file as a PDF — it may be corrupt or not a PDF');
  }
  const pageCount = source.getPageCount();
  const indices: number[] = [];
  pages.forEach((page, i) => {
    if (!Number.isInteger(page) || page < 1 || page > pageCount) {
      throw new Error(
        `Page ${page} (entry ${i + 1}) is out of range: this PDF has ${pageCount} page(s), use pages 1-${pageCount}`,
      );
    }
    indices.push(page - 1);
  });
  const output = await PDFDocument.create();
  const copied = await output.copyPages(source, indices);
  copied.forEach((page) => output.addPage(page));
  const bytes = await output.save();
  return new Blob([bytes as BlobPart], { type: 'application/pdf' });
}
