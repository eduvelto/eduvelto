import { describe, it, expect } from 'vitest';
import { wordCount } from '../../tools/wordCounter';

describe('wordCounter', () => {
  it('counts a sentence', () => {
    expect(wordCount('Hello world').words).toBe(2);
    expect(wordCount('Hello world').characters).toBe(11);
  });
});
