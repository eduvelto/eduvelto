import { describe, it, expect } from 'vitest';
import { formatCitation } from '../../tools/citation';

const input = { author: 'Rahman, A.', year: '2024', title: 'Learning Bangla', source: 'Dhaka Press' };

describe('formatCitation', () => {
  it('formats APA', () => {
    expect(formatCitation('apa', input)).toBe('Rahman, A. (2024). Learning Bangla. Dhaka Press.');
  });
  it('formats MLA', () => {
    expect(formatCitation('mla', input)).toBe('Rahman, A.. "Learning Bangla." Dhaka Press, 2024.');
  });
  it('formats Chicago', () => {
    expect(formatCitation('chicago', input)).toBe('Rahman, A.. 2024. "Learning Bangla." Dhaka Press.');
  });
  it('requires all fields', () => {
    expect(() => formatCitation('apa', { ...input, title: '' })).toThrow('all needed');
  });
});
