/**
 * Citation generator — formats the USER's own input into APA / MLA /
 * Chicago style. It does not fetch sources and does not verify the
 * details; it only arranges the fields the user typed.
 */

export type CitationStyle = 'apa' | 'mla' | 'chicago';

export interface CitationInput {
  author: string;
  year: string;
  title: string;
  source: string;
  url?: string;
}

export function formatCitation(style: CitationStyle, input: CitationInput): string {
  const author = input.author.trim();
  const year = input.year.trim();
  const title = input.title.trim();
  const source = input.source.trim();
  const url = (input.url ?? '').trim();
  if (!author || !year || !title || !source) {
    throw new Error('Author, year, title and source are all needed for a citation.');
  }
  const urlPart = url ? ` ${url}` : '';
  switch (style) {
    case 'apa':
      return `${author} (${year}). ${title}. ${source}.${urlPart}`;
    case 'mla':
      return `${author}. "${title}." ${source}, ${year}.${urlPart}`;
    case 'chicago':
      return `${author}. ${year}. "${title}." ${source}.${urlPart}`;
    default:
      throw new Error(`Unknown citation style: ${String(style)}`);
  }
}
