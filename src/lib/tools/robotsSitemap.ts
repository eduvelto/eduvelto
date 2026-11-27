/**
 * Robots & Sitemap Generator — pure functions. Builds robots.txt and
 * sitemap.xml text from the user's own URLs. Nothing is fetched.
 */
export interface RobotsRule { agent: string; allow: string[]; disallow: string[]; }
export interface SitemapUrl { loc: string; lastmod?: string; changefreq?: string; priority?: number; }

function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function buildRobotsTxt(rules: RobotsRule[], sitemapUrl?: string): string {
  const lines: string[] = [];
  for (const rule of rules) {
    lines.push(`User-agent: ${rule.agent.trim() || '*'}`);
    for (const path of rule.disallow) if (path.trim()) lines.push(`Disallow: ${path.trim()}`);
    for (const path of rule.allow) if (path.trim()) lines.push(`Allow: ${path.trim()}`);
    lines.push('');
  }
  if (sitemapUrl?.trim()) lines.push(`Sitemap: ${sitemapUrl.trim()}`);
  return lines.join('\n').trim() + '\n';
}

export function buildSitemapXml(urls: SitemapUrl[]): string {
  if (urls.length === 0) throw new Error('Add at least one URL first.');
  const entries = urls.map((u) => {
    const parts = [`    <loc>${escapeXml(u.loc.trim())}</loc>`];
    if (u.lastmod?.trim()) parts.push(`    <lastmod>${escapeXml(u.lastmod.trim())}</lastmod>`);
    if (u.changefreq?.trim()) parts.push(`    <changefreq>${escapeXml(u.changefreq.trim())}</changefreq>`);
    if (u.priority !== undefined) parts.push(`    <priority>${Math.max(0, Math.min(1, u.priority)).toFixed(1)}</priority>`);
    return `  <url>\n${parts.join('\n')}\n  </url>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>`;
}

/** Split pasted URLs (one per line) into clean, validated http(s) URLs. */
export function parseUrlList(text: string): { valid: string[]; invalid: string[] } {
  const valid: string[] = [];
  const invalid: string[] = [];
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    try {
      const url = new URL(line);
      if (url.protocol === 'http:' || url.protocol === 'https:') valid.push(url.toString());
      else invalid.push(line);
    } catch {
      invalid.push(line);
    }
  }
  return { valid, invalid };
}
