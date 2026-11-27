// at landing review — the draft keeps it here so the tests run in one file).
// Pure string functions only: no DOM, no network, no storage.

/* ------------------------------------------------------------------ CSV */

// RFC 4180-ish CSV parser: quoted fields (embedded commas/newlines, "" escapes),
// CRLF + LF, UTF-8 BOM stripped. Bangla text passes through untouched (UTF-8).
export function parseCsv(text: string, delimiter = ','): string[][] {
  const src = text.replace(/^\uFEFF/, '');
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  let i = 0;
  const pushField = () => {
    row.push(field);
    field = '';
  };
  const pushRow = () => {
    pushField();
    rows.push(row);
    row = [];
  };
  while (i < src.length) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i += 2;
        } else {
          inQuotes = false;
          i += 1;
        }
      } else {
        field += ch;
        i += 1;
      }
    } else if (ch === '"') {
      // A quote at the start of a field opens quoting; elsewhere it is literal.
      if (field === '') {
        inQuotes = true;
        i += 1;
      } else {
        field += ch;
        i += 1;
      }
    } else if (ch === delimiter) {
      pushField();
      i += 1;
    } else if (ch === '\r') {
      if (src[i + 1] === '\n') i += 1;
      pushRow();
      i += 1;
    } else if (ch === '\n') {
      pushRow();
      i += 1;
    } else {
      field += ch;
      i += 1;
    }
  }
  pushRow();
  // Drop the single trailing empty row produced by a final newline.
  if (rows.length > 0 && rows[rows.length - 1].length === 1 && rows[rows.length - 1][0] === '') {
    rows.pop();
  }
  return rows;
}

export function detectDelimiter(text: string): ',' | ';' | '\t' {
  const firstLine = text.replace(/^\uFEFF/, '').split(/\r?\n/)[0] ?? '';
  const counts = {
    ',': (firstLine.match(/,/g) ?? []).length,
    ';': (firstLine.match(/;/g) ?? []).length,
    '\t': (firstLine.match(/\t/g) ?? []).length,
  };
  if (counts[';'] > counts[','] && counts[';'] >= counts['\t']) return ';';
  if (counts['\t'] > counts[',']) return '\t';
  return ',';
}

function csvEscape(field: string, delimiter: string): string {
  if (field.includes('"') || field.includes(delimiter) || field.includes('\n') || field.includes('\r')) {
    return `"${field.split('"').join('""')}"`;
  }
  return field;
}

export function toCsv(rows: readonly (readonly string[])[], delimiter = ','): string {
  return rows.map((row) => row.map((f) => csvEscape(f, delimiter)).join(delimiter)).join('\r\n');
}

/* ------------------------------------------------------------- JSON <-> CSV */

export function jsonToCsv(jsonText: string): { csv: string; columns: string[]; rowCount: number } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'invalid JSON';
    throw new Error(`Could not parse the JSON: ${msg}`);
  }
  let arr: unknown[] = [];
  if (Array.isArray(parsed)) arr = parsed;
  else if (parsed && typeof parsed === 'object' && Array.isArray((parsed as Record<string, unknown>).data)) {
    arr = (parsed as Record<string, unknown>).data as unknown[];
  } else if (parsed && typeof parsed === 'object') arr = [parsed];
  else throw new Error('JSON to CSV needs an array of objects (or one object, or {"data": [...]})');
  if (arr.length === 0) throw new Error('The JSON array is empty — there are no rows to convert');
  const columns: string[] = [];
  for (const item of arr) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw new Error('Every row must be an object — found a row that is not one');
    }
    for (const key of Object.keys(item as Record<string, unknown>)) {
      if (!columns.includes(key)) columns.push(key);
    }
  }
  const rows: string[][] = [columns];
  for (const item of arr) {
    const obj = item as Record<string, unknown>;
    rows.push(
      columns.map((col) => {
        const v = obj[col];
        if (v === undefined || v === null) return '';
        if (typeof v === 'object') return JSON.stringify(v);
        return String(v);
      }),
    );
  }
  return { csv: toCsv(rows), columns, rowCount: arr.length };
}

export function csvToJson(csvText: string, delimiter = ','): { json: string; rowCount: number } {
  const rows = parseCsv(csvText, delimiter);
  if (rows.length === 0) throw new Error('The CSV is empty');
  const header = rows[0];
  if (header.some((h) => h.trim() === '')) {
    throw new Error('The first row must be a header row with a name in every column');
  }
  const out = rows.slice(1).map((row) => {
    const obj: Record<string, string> = {};
    header.forEach((h, i) => {
      obj[h] = row[i] ?? '';
    });
    return obj;
  });
  return { json: JSON.stringify(out, null, 2), rowCount: out.length };
}

/* ------------------------------------------------------------------ XML */

export function formatXml(xmlText: string, indentSpaces = 2): { formatted: string } {
  const src = xmlText.trim();
  if (src === '') throw new Error('Paste some XML first');
  if (!src.startsWith('<')) throw new Error('This does not look like XML — it should start with "<"');
  const indent = ' '.repeat(indentSpaces);
  // Tokenize: comments, CDATA, processing instructions, doctype, tags, text.
  const tokens = src.match(/<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<\?[\s\S]*?\?>|<!DOCTYPE[^>]*>|<\/?[A-Za-z_][\w.:-]*(?:\s+[^<>]*?)?\/?>|[^<>]+/g) ?? [];
  let depth = 0;
  const lines: string[] = [];
  let openStack: string[] = [];
  // Inline text: <leaf>1</leaf> stays on one line (standard pretty-printer
  // behaviour). Set when a text token is appended to an open-tag line; the
  // following close tag then appends to the same line.
  let inlineOpen = false;
  const tagName = (tok: string): string | null => {
    const m = tok.match(/^<\/?([A-Za-z_][\w.:-]*)/);
    return m ? m[1] : null;
  };
  const isOpenTagLine = (line: string): boolean =>
    /^<[^/!?][^>]*[^/]>$/.test(line.trim()) && !line.trim().endsWith('/>');
  for (let ti = 0; ti < tokens.length; ti += 1) {
    const raw = tokens[ti];
    const tok = raw.trim();
    if (tok === '') continue;
    if (tok.startsWith('</')) {
      const name = tagName(tok);
      if (openStack.length === 0 || openStack[openStack.length - 1] !== name) {
        const expected = openStack.length > 0 ? openStack[openStack.length - 1] : '(nothing open)';
        throw new Error(`Mismatched tag: expected "</${expected}>" but found "${tok}"`);
      }
      openStack.pop();
      depth = Math.max(0, depth - 1);
      if (inlineOpen) {
        lines[lines.length - 1] += tok;
        inlineOpen = false;
      } else {
        lines.push(indent.repeat(depth) + tok);
      }
    } else if (tok.startsWith('<') && !tok.startsWith('<!--') && !tok.startsWith('<![CDATA[') && !tok.startsWith('<?') && !tok.startsWith('<!DOCTYPE')) {
      const selfClosing = tok.endsWith('/>');
      const name = tagName(tok);
      lines.push(indent.repeat(depth) + tok);
      inlineOpen = false;
      if (!selfClosing && name) {
        openStack.push(name);
        depth += 1;
      }
    } else {
      // Text / comment / CDATA / PI / doctype.
      if (lines.length > 0 && isOpenTagLine(lines[lines.length - 1]) && !tok.startsWith('<!--')) {
        lines[lines.length - 1] += tok;
        inlineOpen = true;
      } else {
        lines.push(indent.repeat(depth) + tok);
        inlineOpen = false;
      }
    }
  }
  if (openStack.length > 0) {
    throw new Error(`Unclosed tag: "<${openStack[openStack.length - 1]}>" was opened but never closed`);
  }
  return { formatted: lines.join('\n') };
}

export function minifyXml(xmlText: string): { minified: string } {
  const { formatted } = formatXml(xmlText, 0);
  return { minified: formatted.replace(/\n/g, '') };
}

/* ------------------------------------------------------- Markdown <-> HTML */

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function inlineMarkdown(s: string): string {
  // Order matters: code first (protect its contents), then bold/italic/links.
  const codeSpans: string[] = [];
  let out = s.replace(/`([^`]+)`/g, (_, c: string) => {
    codeSpans.push(`<code>${escapeHtml(c)}</code>`);
    return `\u0000${codeSpans.length - 1}\u0000`;
  });
  out = escapeHtml(out);
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  out = out.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  out = out.replace(/_([^_]+)_/g, '<em>$1</em>');
  out = out.replace(/~~([^~]+)~~/g, '<del>$1</del>');
  out = out.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" rel="noopener" target="_blank">$1</a>');
  out = out.replace(/\u0000(\d+)\u0000/g, (_, i: string) => codeSpans[Number(i)]);
  return out;
}

/**
 * Safe-subset Markdown -> HTML. Raw HTML in the input is ESCAPED, never
 * rendered (XSS rule). Supports headings, bold/italic/strikethrough, links,
 * images, lists, code blocks, blockquotes, hr, paragraphs.
 */
export function markdownToHtml(md: string): { html: string } {
  if (md.trim() === '') throw new Error('Type or paste some Markdown first');
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const out: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === '') {
      i += 1;
      continue;
    }
    const fence = line.match(/^```(\w*)\s*$/);
    if (fence) {
      const buf: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i].startsWith('```')) {
        buf.push(lines[i]);
        i += 1;
      }
      i += 1; // closing fence
      out.push(`<pre><code>${escapeHtml(buf.join('\n'))}</code></pre>`);
      continue;
    }
    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      out.push(`<h${heading[1].length}>${inlineMarkdown(heading[2])}</h${heading[1].length}>`);
      i += 1;
      continue;
    }
    if (/^---+$/.test(line.trim()) || /^\*\*\*+$/.test(line.trim())) {
      out.push('<hr>');
      i += 1;
      continue;
    }
    const quote = line.match(/^>\s?(.*)$/);
    if (quote) {
      out.push(`<blockquote>${inlineMarkdown(quote[1])}</blockquote>`);
      i += 1;
      continue;
    }
    const img = line.match(/^!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)\s*$/);
    if (img) {
      out.push(`<p><img src="${img[2]}" alt="${escapeHtml(img[1])}"></p>`);
      i += 1;
      continue;
    }
    const ul = line.match(/^[-*]\s+(.*)$/);
    const ol = line.match(/^\d+\.\s+(.*)$/);
    if (ul || ol) {
      const tag = ul ? 'ul' : 'ol';
      const items: string[] = [];
      while (i < lines.length) {
        const m = ul ? lines[i].match(/^[-*]\s+(.*)$/) : lines[i].match(/^\d+\.\s+(.*)$/);
        if (!m) break;
        items.push(`<li>${inlineMarkdown(m[1])}</li>`);
        i += 1;
      }
      out.push(`<${tag}>${items.join('')}</${tag}>`);
      continue;
    }
    // Paragraph: gather consecutive plain lines.
    const buf: string[] = [line];
    i += 1;
    while (i < lines.length && lines[i].trim() !== '' && !lines[i].match(/^(#{1,6}\s|```|[-*]\s|\d+\.\s|>\s?)/)) {
      buf.push(lines[i]);
      i += 1;
    }
    out.push(`<p>${buf.map(inlineMarkdown).join('<br>')}</p>`);
  }
  return { html: out.join('\n') };
}

/**
 * Safe-subset HTML -> Markdown. Parses with DOMParser into a detached document
 * (never inserted, never innerHTML on user content in the live page).
 * Strips script/style/event attributes.
 */
export function htmlToMarkdown(html: string): { markdown: string } {
  if (html.trim() === '') throw new Error('Paste some HTML first');
  if (typeof DOMParser === 'undefined') throw new Error('HTML to Markdown needs a browser');
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('script, style').forEach((el) => el.remove());
  const lines: string[] = [];
  const inline = (el: Element): string => {
    let s = '';
    el.childNodes.forEach((node) => {
      if (node.nodeType === 3) s += node.textContent ?? '';
      else if (node.nodeType === 1) s += inline(node as Element);
    });
    const tag = el.tagName.toLowerCase();
    if (tag === 'strong' || tag === 'b') return `**${s}**`;
    if (tag === 'em' || tag === 'i') return `*${s}*`;
    if (tag === 'code') return `\`${s}\``;
    if (tag === 'a') return `[${s}](${(el as HTMLAnchorElement).href || ''})`;
    return s;
  };
  doc.body.childNodes.forEach((node) => {
    if (node.nodeType === 3) {
      const t = (node.textContent ?? '').trim();
      if (t) lines.push(t);
      return;
    }
    if (node.nodeType !== 1) return;
    const el = node as Element;
    const tag = el.tagName.toLowerCase();
    if (/^h[1-6]$/.test(tag)) {
      lines.push(`${'#'.repeat(Number(tag[1]))} ${inline(el)}`);
    } else if (tag === 'p') {
      lines.push(inline(el));
    } else if (tag === 'ul' || tag === 'ol') {
      el.querySelectorAll('li').forEach((li, idx) => {
        lines.push(tag === 'ul' ? `- ${inline(li)}` : `${idx + 1}. ${inline(li)}`);
      });
    } else if (tag === 'blockquote') {
      lines.push(`> ${inline(el)}`);
    } else if (tag === 'pre') {
      lines.push('```\n' + (el.textContent ?? '') + '\n```');
    } else if (tag === 'hr') {
      lines.push('---');
    } else if (tag === 'img') {
      lines.push(`![${el.getAttribute('alt') ?? ''}](${el.getAttribute('src') ?? ''})`);
    }
  });
  return { markdown: lines.join('\n\n') };
}

/* Text sorting lives in textUtils.ts (shared with Duplicate Line Remover); re-exported here. */
export { sortTextLines } from './textUtils';
export type { SortLinesOptions, SortMode, SortedLines } from './textUtils';
