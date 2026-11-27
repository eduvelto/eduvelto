/**
 * Fancy Text Generator — maps plain A–Z / a–z / 0–9 onto Unicode styled
 * alphabets (mathematical bold, italic, script, monospace, double-struck,
 * circled, fullwidth). Characters with no styled form pass through unchanged.
 * Pure functions, no DOM.
 */
export type FancyStyle = 'bold' | 'italic' | 'boldItalic' | 'monospace' | 'script' | 'doubleStruck' | 'circled' | 'fullwidth';

export const FANCY_STYLES: FancyStyle[] = ['bold', 'italic', 'boldItalic', 'monospace', 'script', 'doubleStruck', 'circled', 'fullwidth'];

function mapRange(text: string, upperStart: number, lowerStart: number, digitStart: number | null): string {
  return [...text].map((ch) => {
    const code = ch.codePointAt(0) ?? 0;
    if (code >= 65 && code <= 90) return String.fromCodePoint(upperStart + code - 65);
    if (code >= 97 && code <= 122) return String.fromCodePoint(lowerStart + code - 97);
    if (digitStart !== null && code >= 48 && code <= 57) return String.fromCodePoint(digitStart + code - 48);
    return ch;
  }).join('');
}

const SCRIPT_EXCEPTIONS: Record<string, string> = { B: 'ℬ', E: 'ℰ', F: 'ℱ', H: 'ℋ', I: 'ℐ', L: 'ℒ', M: 'ℳ', R: 'ℛ', e: 'ℯ', g: 'ℊ', o: 'ℴ' };

export function fancyText(text: string, style: FancyStyle): string {
  switch (style) {
    case 'bold': return mapRange(text, 0x1d400, 0x1d41a, 0x1d7ce);
    case 'italic': return mapRange(text, 0x1d434, 0x1d44e, null);
    case 'boldItalic': return mapRange(text, 0x1d468, 0x1d482, null);
    case 'monospace': return mapRange(text, 0x1d670, 0x1d68a, 0x1d7f6);
    case 'script': {
      const mapped = mapRange(text, 0x1d49c, 0x1d4b6, null);
      return [...mapped].map((ch, i) => SCRIPT_EXCEPTIONS[text[i]] ?? ch).join('');
    }
    case 'doubleStruck': return mapRange(text, 0x1d538, 0x1d552, 0x1d7d8);
    case 'circled': {
      return [...text].map((ch) => {
        const code = ch.codePointAt(0) ?? 0;
        if (code >= 65 && code <= 90) return String.fromCodePoint(0x24b6 + code - 65);
        if (code >= 97 && code <= 122) return String.fromCodePoint(0x24d0 + code - 97);
        if (code >= 49 && code <= 57) return String.fromCodePoint(0x2460 + code - 49);
        if (code === 48) return '⓪';
        return ch;
      }).join('');
    }
    case 'fullwidth': {
      return [...text].map((ch) => {
        const code = ch.codePointAt(0) ?? 0;
        if (code >= 33 && code <= 126) return String.fromCodePoint(code + 0xfee0);
        if (code === 32) return '　';
        return ch;
      }).join('');
    }
    default: return text;
  }
}

export function fancyTextAllStyles(text: string): Array<{ style: FancyStyle; result: string }> {
  return FANCY_STYLES.map((style) => ({ style, result: fancyText(text, style) }));
}
