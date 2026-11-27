/** Reverse Text Generator — pure logic (see ./textUtils). */
import { reverseText as doReverse, type ReverseMode } from './textUtils';
export type { ReverseMode };
export function reverseTextContent(text: string, mode: ReverseMode): string { return doReverse(text, mode); }
