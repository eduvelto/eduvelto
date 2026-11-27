/**
 * HTML Table Generator — pure functions. Builds an HTML <table> from the
 * user's row/column counts and header labels. Nothing is fetched.
 */
export interface HtmlTableOptions {
  rows: number;
  cols: number;
  headers?: string[];
  caption?: string;
  bordered?: boolean;
  striped?: boolean;
  firstRowHeader?: boolean;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function buildHtmlTable(options: HtmlTableOptions): string {
  const rows = Math.min(50, Math.max(1, Math.floor(options.rows)));
  const cols = Math.min(20, Math.max(1, Math.floor(options.cols)));
  const headers = options.headers ?? [];
  const lines: string[] = [];
  const style = options.bordered
    ? ' style="border-collapse: collapse; width: 100%;"'
    : ' style="width: 100%;"';
  const cellStyle = options.bordered ? ' style="border: 1px solid #999; padding: 8px;"' : ' style="padding: 8px;"';
  lines.push(`<table${style}>`);
  if (options.caption?.trim()) lines.push(`  <caption>${escapeHtml(options.caption.trim())}</caption>`);
  if (options.firstRowHeader !== false) {
    lines.push('  <thead>');
    lines.push('    <tr>');
    for (let c = 0; c < cols; c++) {
      lines.push(`      <th${cellStyle}>${escapeHtml(headers[c]?.trim() || `Column ${c + 1}`)}</th>`);
    }
    lines.push('    </tr>');
    lines.push('  </thead>');
  }
  lines.push('  <tbody>');
  for (let r = 0; r < rows; r++) {
    const rowStyle = options.striped && r % 2 === 1 ? ' style="background: #f1f5f9;"' : '';
    lines.push(`    <tr${rowStyle}>`);
    for (let c = 0; c < cols; c++) {
      lines.push(`      <td${cellStyle}>Row ${r + 1}, Col ${c + 1}</td>`);
    }
    lines.push('    </tr>');
  }
  lines.push('  </tbody>');
  lines.push('</table>');
  return lines.join('\n');
}
