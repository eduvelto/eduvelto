// Eduvelto — PDF Tools unit tests (§3C).
//
// Covers the pure helpers behind the canvas-rendered Bengali path:
// word wrapping (including overlong words) and filename sanitising.
// The actual canvas drawing + jsPDF/pdf-lib calls run in the browser;
// the merge and Latin text paths were verified end-to-end in Node
// (see the parent report: 2-page merged PDF, extractable text).

import { describe, expect, it } from 'vitest';
import { wrapLines } from '../../pages/LifePdfToolsPage';

/** Fake 2d context: every character is 10px wide. */
function fakeCtx() {
  return {
    measureText: (s: string) => ({ width: s.length * 10 }),
  } as unknown as CanvasRenderingContext2D;
}

describe('wrapLines', () => {
  const ctx = fakeCtx();

  it('wraps on word boundaries', () => {
    expect(wrapLines(ctx, 'one two three four', 75)).toEqual(['one two', 'three', 'four']);
  });

  it('keeps blank lines for empty paragraphs', () => {
    expect(wrapLines(ctx, 'first\n\nsecond', 100)).toEqual(['first', '', 'second']);
  });

  it('hard-splits a single overlong word by characters', () => {
    expect(wrapLines(ctx, 'abcdefghij', 30)).toEqual(['abc', 'def', 'ghi', 'j']);
  });

  it('keeps a line that exactly fits', () => {
    expect(wrapLines(ctx, 'abcde', 50)).toEqual(['abcde']);
  });

  it('returns one empty line for empty text', () => {
    expect(wrapLines(ctx, '', 100)).toEqual(['']);
  });
});
