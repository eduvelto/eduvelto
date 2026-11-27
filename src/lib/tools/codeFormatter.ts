/**
 * Code Minifier & Beautifier — BASIC regex/indent formatter, not a full
 * parser. It strips comments and collapses whitespace for minify, and
 * re-indents by brace/tag depth for beautify. Strings that contain
 * comment-like text can be affected — the UI says so plainly.
 * Pure functions, no DOM.
 */
export type CodeLanguage = 'html' | 'css' | 'javascript';

export function minifyCode(code: string, lang: CodeLanguage): string {
  let out = code;
  if (lang === 'javascript' || lang === 'css') {
    out = out.replace(/\/\*[\s\S]*?\*\//g, '');
    if (lang === 'javascript') out = out.replace(/(^|\s)\/\/[^\n]*/g, '$1');
  }
  if (lang === 'html') out = out.replace(/<!--[\s\S]*?-->/g, '');
  return out
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}();,:<>])\s*/g, '$1')
    .replace(/;\}/g, '}')
    .trim();
}

export function beautifyCode(code: string, lang: CodeLanguage): string {
  const indent = '  ';
  if (lang === 'html') {
    const tokens = code
      .replace(/>\s+</g, '><')
      .split(/(?=<)|(?<=>)/g)
      .map((t) => t.trim())
      .filter(Boolean);
    const lines: string[] = [];
    let depth = 0;
    let lastWasOpenTag = false;
    let lastWasText = false;
    for (const token of tokens) {
      if (token.startsWith('</')) {
        depth = Math.max(0, depth - 1);
        // Keep `<p>hi</p>` on one line: append a closing tag to a text line.
        if (lastWasText && lines.length > 0) {
          lines[lines.length - 1] += token;
        } else {
          lines.push(indent.repeat(depth) + token);
        }
        lastWasOpenTag = false;
        lastWasText = false;
      } else if (token.startsWith('<')) {
        const isVoid = token.endsWith('/>') || /^<(meta|link|br|hr|img|input|source)\b/.test(token);
        lines.push(indent.repeat(depth) + token);
        if (!isVoid) depth += 1;
        lastWasOpenTag = !isVoid;
        lastWasText = false;
      } else {
        // Text: append to its opening tag's line when possible.
        if (lastWasOpenTag && lines.length > 0) {
          lines[lines.length - 1] += token;
        } else {
          lines.push(indent.repeat(depth) + token);
        }
        lastWasOpenTag = false;
        lastWasText = true;
      }
    }
    return lines.join('\n');
  }
  // CSS / JavaScript: indent by brace depth, one statement per line.
  const spaced = code
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s*([{};])\s*/g, '$1\n')
    .replace(/\n\s*\n/g, '\n');
  const lines: string[] = [];
  let depth = 0;
  for (const raw of spaced.split('\n')) {
    const line = raw.trim();
    if (line === '') continue;
    if (line.startsWith('}')) depth = Math.max(0, depth - 1);
    lines.push(indent.repeat(depth) + line);
    depth += (line.match(/\{/g) ?? []).length - (line.match(/\}/g) ?? []).length;
    if (depth < 0) depth = 0;
  }
  return lines.join('\n');
}
