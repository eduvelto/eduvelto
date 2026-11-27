/**
 * Number to words — English and Bangla. Pure functions.
 * English uses thousand/million/billion/trillion groups; Bangla uses the
 * South Asian system (হাজার / লক্ষ / কোটি) with the standard 0–99 word list.
 * Supports negatives and decimals (spoken digit by digit after "point" /
 * "দশমিক"). Safe integers only beyond the decimal point are spoken exactly.
 */

const EN_ONES = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const EN_TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
const EN_SCALES = ['', 'thousand', 'million', 'billion', 'trillion'];

function enBelow1000(n: number): string {
  const parts: string[] = [];
  if (n >= 100) {
    parts.push(`${EN_ONES[Math.floor(n / 100)]} hundred`);
    n %= 100;
  }
  if (n >= 20) {
    parts.push(EN_TENS[Math.floor(n / 10)] + (n % 10 ? `-${EN_ONES[n % 10]}` : ''));
  } else if (n > 0) {
    parts.push(EN_ONES[n]);
  }
  return parts.join(' ');
}

export function numberToEnglishWords(value: number): string {
  if (!Number.isFinite(value)) throw new Error('Enter a finite number.');
  if (value === 0) return 'zero';
  const negative = value < 0;
  const abs = Math.abs(value);
  const intPart = Math.floor(abs);
  const fracPart = abs - intPart;
  let groups: string[] = [];
  let rest = intPart;
  let scale = 0;
  if (intPart === 0) groups = ['zero'];
  while (rest > 0) {
    const chunk = rest % 1000;
    if (chunk > 0) {
      const words = enBelow1000(chunk);
      groups.unshift(EN_SCALES[scale] ? `${words} ${EN_SCALES[scale]}` : words);
    }
    rest = Math.floor(rest / 1000);
    scale += 1;
  }
  let out = groups.join(' ');
  if (fracPart > 0) {
    const digits = String(abs).split('.')[1] ?? '';
    out += ` point ${[...digits].map((d) => EN_ONES[Number(d)]).join(' ')}`;
  }
  return negative ? `negative ${out}` : out;
}

const BN_WORDS = ['শূন্য', 'এক', 'দুই', 'তিন', 'চার', 'পাঁচ', 'ছয়', 'সাত', 'আট', 'নয়',
  'দশ', 'এগারো', 'বারো', 'তেরো', 'চৌদ্দ', 'পনেরো', 'ষোলো', 'সতেরো', 'আঠারো', 'উনিশ',
  'বিশ', 'একুশ', 'বাইশ', 'তেইশ', 'চব্বিশ', 'পঁচিশ', 'ছাব্বিশ', 'সাতাশ', 'আটাশ', 'ঊনত্রিশ',
  'ত্রিশ', 'একত্রিশ', 'বত্রিশ', 'তেত্রিশ', 'চৌত্রিশ', 'পঁয়ত্রিশ', 'ছত্রিশ', 'সাঁইত্রিশ', 'আটত্রিশ', 'ঊনচল্লিশ',
  'চল্লিশ', 'একচল্লিশ', 'বিয়াল্লিশ', 'তেতাল্লিশ', 'চুয়াল্লিশ', 'পঁয়তাল্লিশ', 'ছেচল্লিশ', 'সাতচল্লিশ', 'আটচল্লিশ', 'ঊনপঞ্চাশ',
  'পঞ্চাশ', 'একান্ন', 'বাহান্ন', 'তিপ্পান্ন', 'চুয়ান্ন', 'পঞ্চান্ন', 'ছাপ্পান্ন', 'সাতান্ন', 'আটান্ন', 'ঊনষাট',
  'ষাট', 'একষট্টি', 'বাষট্টি', 'তেষট্টি', 'চৌষট্টি', 'পঁয়ষট্টি', 'ছেষট্টি', 'সাতষট্টি', 'আটষট্টি', 'ঊনসত্তর',
  'সত্তর', 'একাত্তর', 'বাহাত্তর', 'তিয়াত্তর', 'চুয়াত্তর', 'পঁচাত্তর', 'ছিয়াত্তর', 'সাতাত্তর', 'আটাত্তর', 'ঊনআশি',
  'আশি', 'একাশি', 'বিরাশি', 'তিরাশি', 'চুরাশি', 'পঁচাশি', 'ছিয়াশি', 'সাতাশি', 'আটাশি', 'ঊননব্বই',
  'নব্বই', 'একানব্বই', 'বিরানব্বই', 'তিরানব্বই', 'চুরানব্বই', 'পঁচানব্বই', 'ছিয়ানব্বই', 'সাতানব্বই', 'আটানব্বই', 'নিরানব্বই'];

function bnInt(n: number): string {
  if (n < 100) return BN_WORDS[n];
  if (n < 1000) {
    const h = Math.floor(n / 100);
    const rest = n % 100;
    return rest === 0 ? `${BN_WORDS[h]} শত` : `${BN_WORDS[h]} শত ${BN_WORDS[rest]}`;
  }
  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const rest = n % 1000;
  const parts: string[] = [];
  if (crore > 0) parts.push(`${bnInt(crore)} কোটি`);
  if (lakh > 0) parts.push(`${bnInt(lakh)} লক্ষ`);
  if (thousand > 0) parts.push(`${bnInt(thousand)} হাজার`);
  if (rest > 0) parts.push(bnInt(rest));
  return parts.join(' ');
}

export function numberToBanglaWords(value: number): string {
  if (!Number.isFinite(value)) throw new Error('Enter a finite number.');
  if (value === 0) return 'শূন্য';
  const negative = value < 0;
  const abs = Math.abs(value);
  const intPart = Math.floor(abs);
  const fracPart = abs - intPart;
  let out = bnInt(intPart);
  if (fracPart > 0) {
    const digits = String(abs).split('.')[1] ?? '';
    out += ` দশমিক ${[...digits].map((d) => BN_WORDS[Number(d)]).join(' ')}`;
  }
  return negative ? `ঋণাত্মক ${out}` : out;
}

/** Parse a user-typed number (accepts commas and Bangla digits). Returns null when invalid. */
export function parseNumberInput(raw: string): number | null {
  const bnDigits = '০১২৩৪৫৬৭৮৯';
  const latin = raw.trim().replace(/[০-৯]/g, (d) => String(bnDigits.indexOf(d))).replace(/,/g, '');
  if (latin === '' || !/^-?\d+(\.\d+)?$/.test(latin)) return null;
  const n = Number(latin);
  return Number.isFinite(n) ? n : null;
}
