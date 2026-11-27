/**
 * Credit Card Validator — Luhn check ONLY. This checks whether a number
 * is structurally well-formed; it does NOT check whether a card is real,
 * active, or belongs to anyone. NEVER enter a real card number here —
 * use a test number (e.g. 4242 4242 4242 4242). Pure functions, no DOM.
 */
export type CardBrand = 'Visa' | 'Mastercard' | 'American Express' | 'Discover' | 'Unknown';

export function detectCardBrand(digits: string): CardBrand {
  if (/^4/.test(digits)) return 'Visa';
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'Mastercard';
  if (/^3[47]/.test(digits)) return 'American Express';
  if (/^6/.test(digits)) return 'Discover';
  return 'Unknown';
}

export function luhnCheck(digits: string): boolean {
  let sum = 0;
  let doubleNext = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = Number(digits[i]);
    if (doubleNext) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    doubleNext = !doubleNext;
  }
  return sum % 10 === 0;
}

export interface CardValidation { digits: string; brand: CardBrand; length: number; luhnValid: boolean; }

export function validateCardNumber(input: string): CardValidation {
  const digits = input.replace(/[\s-]/g, '');
  if (!/^\d+$/.test(digits)) throw new Error('Enter digits only (spaces and dashes are allowed).');
  if (digits.length < 13 || digits.length > 19) throw new Error('A card number has 13–19 digits.');
  return { digits, brand: detectCardBrand(digits), length: digits.length, luhnValid: luhnCheck(digits) };
}

/** Mask all but the last 4 digits, e.g. •••• •••• •••• 4242. */
export function maskCardNumber(digits: string): string {
  const last4 = digits.slice(-4);
  const masked = '•'.repeat(Math.max(0, digits.length - 4));
  return `${masked} ${last4}`.trim();
}
