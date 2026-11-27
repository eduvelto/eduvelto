/** Text Case Converter — pure logic (see ./textUtils for the shared converter). */
import { convertCase, type CaseMode } from './textUtils';
export type { CaseMode };
export const CASE_MODES: CaseMode[] = ['upper', 'lower', 'title', 'sentence', 'capitalized', 'toggle', 'camel', 'snake', 'kebab'];
export function convertTextCase(text: string, mode: CaseMode): string { return convertCase(text, mode); }
