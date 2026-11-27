/** Remove Extra Spaces — pure logic (see ./textUtils). */
import { removeExtraSpaces as cleanSpaces } from './textUtils';
export function cleanExtraSpaces(text: string, removeBlankLines = false): string { return cleanSpaces(text, removeBlankLines); }
