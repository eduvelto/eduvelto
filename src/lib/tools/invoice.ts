/**
 * Invoice Generator — pure logic.
 *
 * subtotal   = sum over items of (quantity x unit price)
 * tax        = subtotal x taxPercent / 100
 * grandTotal = subtotal + tax
 *
 * The tax / VAT percent is USER-ENTERED. Pure functions only: no
 * network, no storage, no DOM. PDF download lives in the UI and
 * loads jspdf with a dynamic import() only.
 */

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface InvoiceInput {
  items: InvoiceItem[];
  /** Tax / VAT in percent, user-entered (e.g. 5 means 5%). */
  taxPercent: number;
}

export interface InvoiceResult {
  /** Sum of all line totals. */
  subtotal: number;
  /** Tax on the subtotal. */
  tax: number;
  /** Subtotal + tax. */
  grandTotal: number;
  /** Per-line totals, in the same order as the input items. */
  lineTotals: number[];
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Line total for one item: quantity x unit price. */
export function lineTotal(item: InvoiceItem): number {
  return roundMoney(item.quantity * item.unitPrice);
}

/**
 * Calculate invoice totals.
 *
 * Hand-check: 2 x 500 + 3 x 200 = 1000 + 600 = 1600 subtotal;
 * tax 5% = 80; grand total = 1680.
 */
export function calculateInvoice(input: InvoiceInput): InvoiceResult {
  if (!Number.isFinite(input.taxPercent) || input.taxPercent < 0) {
    throw new Error(`taxPercent must be a finite number >= 0, got ${input.taxPercent}`);
  }
  if (!Array.isArray(input.items)) {
    throw new Error('items must be an array');
  }
  const lineTotals = input.items.map((item) => {
    if (!Number.isFinite(item.quantity) || item.quantity < 0) {
      throw new Error(`quantity must be a finite number >= 0, got ${item.quantity}`);
    }
    if (!Number.isFinite(item.unitPrice) || item.unitPrice < 0) {
      throw new Error(`unitPrice must be a finite number >= 0, got ${item.unitPrice}`);
    }
    return lineTotal(item);
  });
  const subtotal = roundMoney(lineTotals.reduce((sum, v) => sum + v, 0));
  const tax = roundMoney((subtotal * input.taxPercent) / 100);
  return { subtotal, tax, grandTotal: roundMoney(subtotal + tax), lineTotals };
}
