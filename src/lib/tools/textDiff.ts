/**
 * Text Diff Checker — line diff via longest-common-subsequence.
 * Pure functions, no DOM. Output is a list of ops the UI renders
 * green (added), red (removed) and plain (unchanged).
 */
export type DiffOpType = 'same' | 'add' | 'remove';
export interface DiffOp { type: DiffOpType; text: string; }
export interface DiffResult {
  ops: DiffOp[];
  added: number;
  removed: number;
  unchanged: number;
}

export function lineDiff(a: string, b: string): DiffResult {
  const aLines = a === '' ? [] : a.split('\n');
  const bLines = b === '' ? [] : b.split('\n');
  const m = aLines.length;
  const n = bLines.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      dp[i][j] = aLines[i] === bLines[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const ops: DiffOp[] = [];
  let i = 0;
  let j = 0;
  while (i < m && j < n) {
    if (aLines[i] === bLines[j]) { ops.push({ type: 'same', text: aLines[i] }); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { ops.push({ type: 'remove', text: aLines[i] }); i++; }
    else { ops.push({ type: 'add', text: bLines[j] }); j++; }
  }
  while (i < m) { ops.push({ type: 'remove', text: aLines[i] }); i++; }
  while (j < n) { ops.push({ type: 'add', text: bLines[j] }); j++; }
  return {
    ops,
    added: ops.filter((o) => o.type === 'add').length,
    removed: ops.filter((o) => o.type === 'remove').length,
    unchanged: ops.filter((o) => o.type === 'same').length,
  };
}
