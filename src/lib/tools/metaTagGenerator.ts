/**
 * Meta Tag Generator — pure functions. Builds <title> / meta / Open Graph
 * tags from the user's own input. Nothing is fetched or verified.
 */
export interface MetaTagInput {
  title: string;
  description: string;
  url?: string;
  image?: string;
  type?: string;
  siteName?: string;
  author?: string;
  keywords?: string;
  twitterCard?: 'summary' | 'summary_large_image';
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function buildMetaTags(input: MetaTagInput): string {
  const title = input.title.trim();
  const description = input.description.trim();
  if (!title || !description) throw new Error('Title and description are both needed.');
  const lines: string[] = [];
  lines.push(`<title>${escapeHtml(title)}</title>`);
  lines.push(`<meta name="description" content="${escapeHtml(description)}">`);
  if (input.author?.trim()) lines.push(`<meta name="author" content="${escapeHtml(input.author.trim())}">`);
  if (input.keywords?.trim()) lines.push(`<meta name="keywords" content="${escapeHtml(input.keywords.trim())}">`);
  lines.push(`<meta property="og:title" content="${escapeHtml(title)}">`);
  lines.push(`<meta property="og:description" content="${escapeHtml(description)}">`);
  lines.push(`<meta property="og:type" content="${escapeHtml(input.type?.trim() || 'website')}">`);
  if (input.url?.trim()) lines.push(`<meta property="og:url" content="${escapeHtml(input.url.trim())}">`);
  if (input.siteName?.trim()) lines.push(`<meta property="og:site_name" content="${escapeHtml(input.siteName.trim())}">`);
  if (input.image?.trim()) lines.push(`<meta property="og:image" content="${escapeHtml(input.image.trim())}">`);
  lines.push(`<meta name="twitter:card" content="${input.twitterCard ?? 'summary_large_image'}">`);
  lines.push(`<meta name="twitter:title" content="${escapeHtml(title)}">`);
  lines.push(`<meta name="twitter:description" content="${escapeHtml(description)}">`);
  if (input.image?.trim()) lines.push(`<meta name="twitter:image" content="${escapeHtml(input.image.trim())}">`);
  return lines.join('\n');
}
