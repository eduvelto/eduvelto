/**
 * Lorem Ipsum generator — pure functions. The sentences are the classic
 * public-domain Lorem Ipsum text, cycled in order so output is stable.
 */
export const LOREM_SENTENCES = [
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
  'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
  'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
  'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
  'Curabitur pretium tincidunt lacus, nulla gravida orci a odio.',
  'Nullam varius, turpis et commodo pharetra, est eros bibendum elit, nec luctus magna felis sollicitudin mauris.',
  'Integer in mauris eu nibh euismod gravida.',
  'Duis ac tellus et risus vulputate vehicula.',
  'Donec lobortis risus a elit, etiam tempor.',
];

export interface LoremOptions {
  paragraphs?: number;
  sentencesPerParagraph?: number;
  startWithLorem?: boolean;
}

export function generateLorem(options?: LoremOptions): string {
  const paragraphs = Math.min(20, Math.max(1, options?.paragraphs ?? 3));
  const perPara = Math.min(10, Math.max(1, options?.sentencesPerParagraph ?? 4));
  const out: string[] = [];
  let idx = 0;
  for (let p = 0; p < paragraphs; p++) {
    const sentences: string[] = [];
    for (let s = 0; s < perPara; s++) {
      sentences.push(LOREM_SENTENCES[idx % LOREM_SENTENCES.length]);
      idx += 1;
    }
    out.push(sentences.join(' '));
  }
  if (options?.startWithLorem === false && out.length > 0) {
    // Drop the opening "Lorem ipsum..." sentence for a non-standard start.
    out[0] = out[0].replace(/^Lorem ipsum dolor sit amet, consectetur adipiscing elit\. /, '');
  }
  return out.join('\n\n');
}
