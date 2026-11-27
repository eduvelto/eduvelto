/** Find and Replace — pure logic (see ./textUtils). */
import { findAndReplace as doFindReplace, type FindReplaceOptions, type FindReplaceResult } from './textUtils';
export type { FindReplaceOptions, FindReplaceResult };
export function findReplace(text: string, find: string, replace: string, options?: FindReplaceOptions): FindReplaceResult {
  return doFindReplace(text, find, replace, options);
}
