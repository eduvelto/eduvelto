/**
 * URL Encoder & Decoder + UTM builder — pure functions.
 * encodeURIComponent / decodeURIComponent, with a clear error on bad input.
 */
export function encodeUrl(text: string): string {
  return encodeURIComponent(text);
}

export function decodeUrl(text: string): string {
  try {
    return decodeURIComponent(text);
  } catch {
    throw new Error('Not a valid percent-encoded URL — check for a lone % sign.');
  }
}

export interface UtmParams {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
}

export function buildUtmUrl(baseUrl: string, utm: UtmParams): string {
  let url: URL;
  try {
    url = new URL(baseUrl.trim());
  } catch {
    throw new Error('Enter a full URL starting with http:// or https:// first.');
  }
  if (utm.source) url.searchParams.set('utm_source', utm.source);
  if (utm.medium) url.searchParams.set('utm_medium', utm.medium);
  if (utm.campaign) url.searchParams.set('utm_campaign', utm.campaign);
  if (utm.term) url.searchParams.set('utm_term', utm.term);
  if (utm.content) url.searchParams.set('utm_content', utm.content);
  return url.toString();
}

export function parseUrlParts(raw: string): { protocol: string; host: string; path: string; query: string; hash: string } | null {
  try {
    const url = new URL(raw.trim());
    return { protocol: url.protocol, host: url.host, path: url.pathname, query: url.search, hash: url.hash };
  } catch {
    return null;
  }
}
