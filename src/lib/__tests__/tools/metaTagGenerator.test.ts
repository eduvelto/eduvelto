import { describe, it, expect } from 'vitest';
import { buildMetaTags } from '../../tools/metaTagGenerator';

describe('buildMetaTags', () => {
  it('builds title, description and Open Graph tags', () => {
    const tags = buildMetaTags({ title: 'My Page', description: 'A great page', url: 'https://example.com', image: 'https://example.com/img.png' });
    expect(tags).toContain('<title>My Page</title>');
    expect(tags).toContain('og:title');
    expect(tags).toContain('twitter:card');
    expect(tags).toContain('https://example.com/img.png');
  });
  it('requires title and description', () => {
    expect(() => buildMetaTags({ title: '', description: 'x' })).toThrow('both needed');
  });
});
