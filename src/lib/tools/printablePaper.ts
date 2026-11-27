/**
 * Printable Paper Generator — pure logic (paper specs for the PDF).
 * Types: lined, graph (grid), dot grid, blank. Pure functions only.
 */

export type PaperType = 'lined' | 'graph' | 'dot' | 'blank';

export const PAPER_TYPES: readonly PaperType[] = ['lined', 'graph', 'dot', 'blank'];

export interface PaperSpec {
  type: PaperType;
  /** Spacing between lines/dots in mm. */
  spacingMm: number;
  /** Number of lines (lined) or grid rows (graph/dot) per A4 page. */
  rowsPerPage: number;
  /** Grid columns per A4 page (graph/dot only). */
  colsPerPage: number;
  pages: number;
}

const A4_HEIGHT_MM = 297;
const A4_WIDTH_MM = 210;
const MARGIN_MM = 15;

/** Hand-check: lined 8mm -> floor((297-30)/8) = 33 lines per page. */
export function paperSpec(type: PaperType, spacingMm: number, pages: number): PaperSpec {
  if (!PAPER_TYPES.includes(type)) throw new Error(`Unknown paper type: ${type as string}`);
  if (!Number.isFinite(spacingMm) || spacingMm < 4 || spacingMm > 20) {
    throw new Error('Spacing must be 4–20 mm');
  }
  if (!Number.isInteger(pages) || pages < 1 || pages > 50) throw new Error('Pages must be 1–50');
  const usableH = A4_HEIGHT_MM - MARGIN_MM * 2;
  const usableW = A4_WIDTH_MM - MARGIN_MM * 2;
  const rowsPerPage = Math.floor(usableH / spacingMm);
  const colsPerPage = Math.floor(usableW / spacingMm);
  return { type, spacingMm, rowsPerPage, colsPerPage, pages };
}
