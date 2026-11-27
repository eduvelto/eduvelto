/** Duplicate Line Remover — pure logic (see ./textUtils). */
import { dedupeLines, type DedupeOptions, type DedupeResult } from './textUtils';
export type { DedupeOptions, DedupeResult };
export function removeDuplicateLines(text: string, options?: DedupeOptions): DedupeResult { return dedupeLines(text, options); }
