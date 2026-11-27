/**
 * Application Fee Calculator — pure logic.
 * Total = fee x copies + VAT (default 15%, the standard Bangladesh
 * VAT rate — editable) + service charge. Pure functions only.
 */

export const DEFAULT_VAT_RATE = 15;

export interface ApplicationFeeInput {
  feePerApplication: number;
  copies: number;
  vatRate: number;
  serviceCharge: number;
}

export interface ApplicationFeeResult {
  baseTotal: number;
  vat: number;
  serviceCharge: number;
  grandTotal: number;
}

/**
 * Hand-check: fee 500, 2 copies, VAT 15%, charge 50 ->
 * base 1000, VAT 150, total 1200.
 */
export function calculateApplicationFee(input: ApplicationFeeInput): ApplicationFeeResult {
  const { feePerApplication, copies, vatRate, serviceCharge } = input;
  if (feePerApplication < 0) throw new Error('Fee cannot be negative');
  if (!Number.isInteger(copies) || copies < 1) throw new Error('Copies must be at least 1');
  if (vatRate < 0 || vatRate > 100) throw new Error('VAT rate must be 0–100');
  if (serviceCharge < 0) throw new Error('Service charge cannot be negative');
  const baseTotal = Math.round(feePerApplication * copies * 100) / 100;
  const vat = Math.round(baseTotal * (vatRate / 100) * 100) / 100;
  const grandTotal = Math.round((baseTotal + vat + serviceCharge) * 100) / 100;
  return { baseTotal, vat, serviceCharge, grandTotal };
}
