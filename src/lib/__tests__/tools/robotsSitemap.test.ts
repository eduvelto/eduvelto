import { describe, it, expect } from 'vitest';
import { buildRobotsTxt, buildSitemapXml, parseUrlList } from '../../tools/robotsSitemap';

describe('robotsSitemap', () => {
  it('builds robots.txt', () => {
    const txt = buildRobotsTxt([{ agent: '*', allow: [], disallow: ['/admin'] }], 'https://example.com/sitemap.xml');
    expect(txt).toContain('User-agent: *');
    expect(txt).toContain('Disallow: /admin');
    expect(txt).toContain('Sitemap: https://example.com/sitemap.xml');
  });
  it('builds sitemap.xml', () => {
    const xml = buildSitemapXml([{ loc: 'https://example.com/', priority: 1 }]);
    expect(xml).toContain('<urlset');
    expect(xml).toContain('<loc>https://example.com/</loc>');
  });
  it('splits a pasted URL list', () => {
    const { valid, invalid } = parseUrlList('https://example.com\nnot a url\n');
    expect(valid).toEqual(['https://example.com/']);
    expect(invalid).toEqual(['not a url']);
  });
});
