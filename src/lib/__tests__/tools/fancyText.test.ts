import { describe, it, expect } from 'vitest';
import { fancyText, fancyTextAllStyles } from '../../tools/fancyText';

describe('fancyText', () => {
  it('maps bold letters', () => {
    expect(fancyText('Ab', 'bold')).toBe('𝐀𝐛');
    expect(fancyText('hello', 'monospace')).toBe('𝚑𝚎𝚕𝚕𝚘');
  });
  it('leaves digits alone for italic (no italic digits in Unicode)', () => {
    expect(fancyText('a1', 'italic')).toBe('𝑎1');
  });
  it('produces all 8 styles', () => {
    expect(fancyTextAllStyles('Hi')).toHaveLength(8);
    expect(fancyTextAllStyles('Hi')[0].result).not.toBe('Hi');
  });
});
