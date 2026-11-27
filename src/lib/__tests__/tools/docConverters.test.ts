// path to src/lib/tools/docConverters.ts). sortTextLines lands in textUtils.ts;
// its tests move to the textUtils test file at landing.
import { describe, expect, it } from 'vitest';
import {
  parseCsv,
  toCsv,
  detectDelimiter,
  jsonToCsv,
  csvToJson,
  formatXml,
  markdownToHtml,
  sortTextLines,
} from '../../tools/docConverters';

describe('parseCsv / toCsv', () => {
  it('handles quoted commas and embedded newlines', () => {
    const rows = parseCsv('name,city\n"Rahim","Dhaka, Bangladesh"\n"Karim","Line1\nLine2"');
    expect(rows).toEqual([
      ['name', 'city'],
      ['Rahim', 'Dhaka, Bangladesh'],
      ['Karim', 'Line1\nLine2'],
    ]);
  });
  it('handles "" escapes and CRLF and BOM', () => {
    const rows = parseCsv('\uFEFFa,b\r\n"He said ""hi""",2\r\n');
    expect(rows).toEqual([
      ['a', 'b'],
      ['He said "hi"', '2'],
    ]);
  });
  it('round-trips Bangla text', () => {
    const csv = toCsv([['নাম', 'নম্বর'], ['রহিম', '৮৫']]);
    expect(parseCsv(csv)).toEqual([
      ['নাম', 'নম্বর'],
      ['রহিম', '৮৫'],
    ]);
  });
  it('detects semicolon and tab delimiters', () => {
    expect(detectDelimiter('a;b;c\n1;2;3')).toBe(';');
    expect(detectDelimiter('a\tb\n1\t2')).toBe('\t');
    expect(detectDelimiter('a,b\n1,2')).toBe(',');
  });
});

describe('jsonToCsv / csvToJson', () => {
  it('converts an array of objects with a union of keys', () => {
    const { csv, rowCount } = jsonToCsv(
      '[{"name":"Rahim","marks":85},{"name":"Karim","marks":90,"grade":"A"}]',
    );
    expect(rowCount).toBe(2);
    expect(parseCsv(csv)[0]).toEqual(['name', 'marks', 'grade']);
    expect(parseCsv(csv)[2]).toEqual(['Karim', '90', 'A']);
  });
  it('accepts a {"data": [...]} wrapper and a single object', () => {
    expect(jsonToCsv('{"data":[{"a":1}]}').rowCount).toBe(1);
    expect(jsonToCsv('{"a":1}').rowCount).toBe(1);
  });
  it('stringifies nested objects into the cell', () => {
    const { csv } = jsonToCsv('[{"a":{"b":1}}]');
    expect(parseCsv(csv)[1][0]).toBe('{"b":1}');
  });
  it('throws a helpful error on invalid JSON', () => {
    expect(() => jsonToCsv('{bad')).toThrow(/Could not parse the JSON/);
  });
  it('csvToJson round-trips', () => {
    const { json, rowCount } = csvToJson('name,marks\nRahim,85');
    expect(rowCount).toBe(1);
    expect(JSON.parse(json)).toEqual([{ name: 'Rahim', marks: '85' }]);
  });
});

describe('formatXml', () => {
  it('indents nested elements', () => {
    const { formatted } = formatXml('<root><child><leaf>1</leaf></child></root>');
    expect(formatted).toBe('<root>\n  <child>\n    <leaf>1</leaf>\n  </child>\n</root>');
  });
  it('preserves CDATA and entities', () => {
    const { formatted } = formatXml('<a><![CDATA[x < y]]>&amp;</a>');
    expect(formatted).toContain('<![CDATA[x < y]]>');
    expect(formatted).toContain('&amp;');
  });
  it('reports mismatched and unclosed tags with names', () => {
    expect(() => formatXml('<note><to>x</note>')).toThrow(/expected "<\/to>"/);
    expect(() => formatXml('<note><to>x</to>')).toThrow(/Unclosed tag: "<note>"/);
  });
});

describe('markdownToHtml', () => {
  it('renders headings, bold, links and lists', () => {
    const { html } = markdownToHtml('# Title\n\nHello **world** and [Eduvelto](https://eduvelto.com)\n\n- one\n- two');
    expect(html).toContain('<h1>Title</h1>');
    expect(html).toContain('<strong>world</strong>');
    expect(html).toContain('<a href="https://eduvelto.com" rel="noopener" target="_blank">Eduvelto</a>');
    expect(html).toContain('<ul><li>one</li><li>two</li></ul>');
  });
  it('escapes raw HTML instead of rendering it', () => {
    const { html } = markdownToHtml('Hello <script>alert(1)</script>');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });
  it('renders Bangla headings and code blocks', () => {
    const { html } = markdownToHtml('## শিরোনাম\n\n```\ncode <here>\n```');
    expect(html).toContain('<h2>শিরোনাম</h2>');
    expect(html).toContain('<pre><code>code &lt;here&gt;</code></pre>');
  });
});

describe('sortTextLines', () => {
  it('sorts numerically: 2 before 10', () => {
    expect(sortTextLines('10\n2\n1', { mode: 'numeric' }).lines).toEqual(['1', '2', '10']);
  });
  it('dedupes keep-last and reports stats', () => {
    const r = sortTextLines('a\nb\na\nc\nb', { mode: 'az', dedupe: 'last' });
    expect(r.lines).toEqual(['a', 'b', 'c']);
    expect(r.totalLines).toBe(5);
    expect(r.distinct).toBe(3);
    expect(r.duplicateOccurrences).toBe(2);
    expect(r.duplicateGroups).toBe(2);
  });
  it('blank handling: remove and one', () => {
    expect(sortTextLines('a\n\n\nb', { mode: 'reverse', blanks: 'remove' }).lines).toEqual(['b', 'a']);
    expect(sortTextLines('a\n\n\nb', { mode: 'reverse', blanks: 'one' }).lines).toEqual(['b', '', 'a']);
  });
  it('shuffle returns the same multiset', () => {
    const r = sortTextLines('a\nb\nc\nd', { mode: 'shuffle' });
    expect([...r.lines].sort()).toEqual(['a', 'b', 'c', 'd']);
  });
});
