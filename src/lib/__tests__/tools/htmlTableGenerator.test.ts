import { describe, it, expect } from 'vitest';
import { buildHtmlTable } from '../../tools/htmlTableGenerator';

describe('buildHtmlTable', () => {
  it('builds a table with headers and rows', () => {
    const html = buildHtmlTable({ rows: 2, cols: 2, headers: ['Name', 'Age'], caption: 'People' });
    expect(html).toContain('<table');
    expect(html).toContain('<th');
    expect(html).toContain('Name');
    expect(html).toContain('<caption>People</caption>');
    expect((html.match(/<td/g) ?? []).length).toBe(4);
  });
});
