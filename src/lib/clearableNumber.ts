// Clearable number input logic (QPG setup form, 26 Nov 2026).
//
// Bug (owner report 07:41, 26 Nov 2026): the last character of the
// পূর্ণমান (Full Marks) and সময় (মিনিট) (Time) fields could not be
// deleted — backspace on a single remaining digit did nothing, so the
// old value could not be cleared and re-typed.
//
// Root cause: the controlled inputs committed on every keystroke with
// `Math.max(min, Number(e.target.value) || min)`. When the field is
// cleared, `Number('')` is `0`, and `0 || min` is `min`, so the value
// snapped straight back to the minimum (1 for marks, 5 for minutes)
// and the input never showed empty. The same pattern was on every
// numeric field in the generator (seed, job question count, and the
// post-generation মানবণ্টন editor's count / marks-per-question /
// time fields).
//
// Fix: keep the raw text in a draft while the user edits; only commit
// when it parses to a valid number. An empty or non-numeric draft
// commits nothing, so the field stays clearable. On blur the draft is
// discarded and the field shows the committed value again. Validation
// (min/max clamping) is applied when committing and on blur — never by
// blocking deletion.

/**
 * Resolve raw input text to the number to commit, or `undefined` when
 * nothing should be committed (empty / whitespace / non-numeric — the
 * field stays clearable and the previous committed value is kept).
 * A valid number is floored to an integer and clamped to [min, max].
 */
export function commitClearableNumber(raw: string, min: number, max?: number): number | undefined {
  if (raw.trim() === '') return undefined;
  const n = Number(raw);
  if (!Number.isFinite(n)) return undefined;
  const floored = Math.floor(n);
  return max === undefined ? Math.max(min, floored) : Math.max(min, Math.min(max, floored));
}
