/** Word Counter — pure logic (see ./textUtils for the shared counter). */
import { countText, type TextCounts } from './textUtils';
export type { TextCounts };
export function wordCount(text: string): TextCounts { return countText(text); }
