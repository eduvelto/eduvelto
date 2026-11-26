// 1-Click Question Swap (বদলান) — Day 4 hardening (sprint 26 Nov 2026).
//
// Regression guard for the old first-10 bug: the বদলান button used to
// render only on the first 10 questions. It must exist on EVERY question
// in BOTH places — (A) the chapter-picker list and (B) the post-generation
// মানবণ্টন editor — and a swap must replace the question in place, rebuild
// the paper, and re-render the preview.
//
// NOTE on method: this repo has no jsdom / @testing-library/react, so the
// component cannot be render-tested here. The guard is therefore twofold,
// following the established pattern in questionPaperMaster.test.ts:
//   (1) source-level assertions on QuestionPaperGeneratorPage.tsx — the
//       two render sites map the FULL lists with no index cap, and the
//       swap handlers call replaceQpgQuestion + rebuildPaper;
//   (2) functional tests of the underlying logic the JSX depends on —
//       selection (selectQpgQuestions), the visibility predicate, the
//       candidate filters, replaceQpgQuestion, and buildQpgPaper.
// If anyone re-introduces an `i < 10` / `.slice(0, 10)` guard, (1) fails.
// If the swap logic regresses, (2) fails.
//
// CAP LIFTED (comparison fixes, 26 Nov 2026 — item C): the old
// `.slice(0, 5)` candidate cap is gone. Lists now show the first 10
// with a load-more ("আরও Nটি দেখুন") that reveals ALL verified
// candidates — no valid candidate is unreachable through the UI.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  QPG_VERIFIED_CHAPTER_ID,
  QPG_VERIFIED_POOL,
  buildQpgPaper,
  defaultPaperSetup,
  replaceQpgQuestion,
  selectQpgQuestions,
  type QpgQuestion,
} from '../questionPaper';
import { loadVerifiedChapterQuestions } from '../questionPaperCache';
import { questionsForSet } from '../questionPaperSets';

const GENERATOR_SRC = readFileSync(
  resolve(__dirname, '../../pages/QuestionPaperGeneratorPage.tsx'),
  'utf8',
);

// --- Mirrors of the JSX conditions in QuestionPaperGeneratorPage.tsx ---
// (A) Picker: the বদলান button renders iff the question is selected:
//     `{selectedIds.includes(q.id) ? (<Button …>বদলান</Button>) : null}`
// (B) Editor: the বদলান button renders unconditionally for every
//     question in `paper.questions.map(...)` — no gate at all.
const pickerSwapShown = (selectedIds: string[], q: QpgQuestion): boolean =>
  selectedIds.includes(q.id);
const editorSwapShown = (_q: QpgQuestion): boolean => true;

// (A) Picker candidates: verified pool questions from the chosen chapters
// that are neither the question being replaced nor already selected.
const pickerCandidates = (
  available: QpgQuestion[],
  q: QpgQuestion,
  selectedIds: string[],
): QpgQuestion[] => available.filter((c) => c.id !== q.id && !selectedIds.includes(c.id));

// (B) Editor extras: verified pool questions not in the paper yet
// (`paperExtras` in the page).
const paperExtras = (pool: QpgQuestion[], paperQuestions: QpgQuestion[]): QpgQuestion[] =>
  pool.filter((q) => !paperQuestions.some((pq) => pq.id === q.id));

const countOccurrences = (src: string, needle: string): number =>
  src.split(needle).length - 1;

// The verified pool now holds BCS + Academic chapters (91 Q, 26 Nov 2026).
// The swap picker's "available" list is the CHAPTER-filtered selection
// (selection.questions in the page) — never the raw pool — so these
// same-chapter tests use the BCS chapter slice, exactly as production does.
const BCS_CHAPTER_POOL = QPG_VERIFIED_POOL.filter(
  (q) => q.chapterId === QPG_VERIFIED_CHAPTER_ID,
);

describe('1-click swap — no first-10 cap (source-level)', () => {
  it('no hard candidate cap: no slice(0, 5); every sliced list has a show-all', () => {
    // The old 5-cap is gone.
    expect(GENERATOR_SRC).not.toContain('slice(0, 5)');
    expect(GENERATOR_SRC).not.toContain('slice(0,5)');
    // The first-10 windows are pagination, not caps: each is paired
    // with a show-all state and an "আরও Nটি দেখুন" load-more.
    expect(GENERATOR_SRC).toContain('pickerSwapShowAll');
    expect(GENERATOR_SRC).toContain('paperSwapShowAll');
    expect(GENERATOR_SRC).toContain('extrasShowAll');
    expect(GENERATOR_SRC).toContain('আরও');
    // Any "first 10 only" index guard, in any spelling.
    expect(GENERATOR_SRC).not.toMatch(/\bi\s*<\s*10\b/);
    expect(GENERATOR_SRC).not.toMatch(/\bi\s*<=\s*9\b/);
    expect(GENERATOR_SRC).not.toMatch(/\bindex\s*<\s*10\b/);
  });

  it('exactly two বদলান buttons exist — picker + editor, no other list', () => {
    // The button label ternary appears once per swap site.
    expect(countOccurrences(GENERATOR_SRC, `'বদলানো বাতিল' : 'বদলান'`)).toBe(2);
    // The "take this question" action appears once per replacement picker.
    expect(countOccurrences(GENERATOR_SRC, 'এই প্রশ্নটি নিন')).toBe(2);
  });

  it('picker maps the FULL displayed list; swap gated only on selection', () => {
    const mapAt = GENERATOR_SRC.indexOf('displayedQuestions.map((q, i) => {');
    expect(mapAt).toBeGreaterThan(-1);
    // displayedQuestions is the whole available list (or a search filter
    // over it) — never sliced to a first-N window.
    const defAt = GENERATOR_SRC.indexOf('const displayedQuestions = ');
    expect(defAt).toBeGreaterThan(-1);
    expect(GENERATOR_SRC.slice(defAt, defAt + 400)).not.toContain('.slice(');
    // From the map to the swap button: the ONLY gate is selection.
    const buttonAt = GENERATOR_SRC.indexOf('বদলান', mapAt);
    const segment = GENERATOR_SRC.slice(mapAt, buttonAt);
    expect(segment).toContain('selectedIds.includes(q.id)');
    expect(segment).not.toMatch(/\bi\s*</);
    expect(segment).not.toContain('.slice(');
  });

  it('editor maps ALL questions of EVERY section; swap button is unconditional', () => {
    // Multi-section editor (comparison fixes, 26 Nov): the editor maps
    // editorSections, and each section maps its own questions — the
    // swap button renders unconditionally for every question.
    const headingAt = GENERATOR_SRC.indexOf('এই বিভাগের প্রশ্ন (প্রতিটিতে বদলান / সরান)');
    expect(headingAt).toBeGreaterThan(-1);
    const mapAt = GENERATOR_SRC.indexOf('secQuestions.map((q) => {', headingAt);
    expect(mapAt).toBeGreaterThan(-1);
    const buttonAt = GENERATOR_SRC.indexOf('বদলানো বাতিল', mapAt);
    const segment = GENERATOR_SRC.slice(mapAt, buttonAt);
    expect(segment).not.toContain('.slice(');
    expect(segment).not.toMatch(/\bi\s*</);
    expect(segment).toContain('setPaperReplacingId(');
  });

  it('picker swap calls replaceQpgQuestion; editor swap is staged and applied together', () => {
    // Picker: swapping updates the selection in place.
    expect(GENERATOR_SRC).toContain(
      'setSelectedIds(replaceQpgQuestion(selectedIds, q.id, c.id))',
    );
    // Editor (multi-section, comparison fixes): the swap is STAGED in
    // the section's question list — no immediate rebuild — and applied
    // together by "প্রয়োগ করুন" (applyPaperEdits → rebuildPaper).
    expect(GENERATOR_SRC).toContain(
      'questionIds: sec.questionIds.map((x) => (x === q.id ? c.id : x))',
    );
    expect(GENERATOR_SRC).toContain('applyPaperEdits');
    // rebuildPaper rebuilds with buildQpgPaper and re-renders the preview,
    // so the preview updates after an apply.
    const rebuildAt = GENERATOR_SRC.indexOf('const rebuildPaper = ');
    expect(rebuildAt).toBeGreaterThan(-1);
    const rebuildBody = GENERATOR_SRC.slice(rebuildAt, rebuildAt + 1200);
    expect(rebuildBody).toContain('buildQpgPaper({');
    expect(rebuildBody).toContain('renderPreview(built');
  });
});

describe('selection: >10 verified questions reach the picker', () => {
  it('the verified chapter yields all 35 questions — no first-10 truncation', () => {
    const res = selectQpgQuestions(
      {
        chapterIds: [QPG_VERIFIED_CHAPTER_ID],
        topicIds: [],
        type: 'mcq',
        difficulty: 'all',
        count: QPG_VERIFIED_POOL.length,
        source: 'any',
      },
      QPG_VERIFIED_POOL,
    );
    expect(res.questions).toHaveLength(35);
    expect(res.available).toBe(35);
    expect(res.questions.every((q) => q.verified === true)).toBe(true);
    expect(res.questions.every((q) => q.chapterId === QPG_VERIFIED_CHAPTER_ID)).toBe(true);
    // Honest limit: the pool carries NO difficulty tags — never invented.
    expect(res.questions.every((q) => q.difficulty === 'unspecified')).toBe(true);
  });

  it('picker: every selected question gets বদলান — including #11, #16, #35', () => {
    const res = selectQpgQuestions(
      {
        chapterIds: [QPG_VERIFIED_CHAPTER_ID],
        topicIds: [],
        type: 'mcq',
        difficulty: 'all',
        count: QPG_VERIFIED_POOL.length,
        source: 'any',
      },
      QPG_VERIFIED_POOL,
    );
    const selectedIds = res.questions.map((q) => q.id);
    expect(selectedIds).toHaveLength(35);
    // Every position — 0-based 10, 15 and 34 are past the old first-10 cut.
    for (let i = 0; i < res.questions.length; i++) {
      expect(pickerSwapShown(selectedIds, res.questions[i])).toBe(true);
    }
    expect(pickerSwapShown(selectedIds, res.questions[10])).toBe(true);
    expect(pickerSwapShown(selectedIds, res.questions[15])).toBe(true);
    expect(pickerSwapShown(selectedIds, res.questions[34])).toBe(true);
  });

  it('picker: an unselected question has no বদলান (by design — swap replaces a pick)', () => {
    const available = QPG_VERIFIED_POOL;
    const selectedIds = available.slice(0, 15).map((q) => q.id);
    // Selected past the old cut still gets the button…
    expect(pickerSwapShown(selectedIds, available[12])).toBe(true);
    // …an unselected one does not — it is added with the checkbox, and
    // once it is in the paper the editor offers বদলান unconditionally.
    expect(pickerSwapShown(selectedIds, available[20])).toBe(false);
  });

  it('editor: every paper question gets বদলান, unconditionally', () => {
    const paperQuestions = QPG_VERIFIED_POOL.slice(0, 15);
    for (let i = 0; i < paperQuestions.length; i++) {
      expect(editorSwapShown(paperQuestions[i])).toBe(true);
    }
    expect(editorSwapShown(paperQuestions[12])).toBe(true);
    expect(editorSwapShown(paperQuestions[14])).toBe(true);
  });
});

describe('swap end-to-end: replace in place + rebuild', () => {
  const ids15 = QPG_VERIFIED_POOL.slice(0, 15).map((q) => q.id);
  const replacement = QPG_VERIFIED_POOL[20];

  it('swaps in place past the first 10 — position, length and neighbours kept', () => {
    const next = replaceQpgQuestion(ids15, ids15[12], replacement.id);
    expect(next).toHaveLength(15);
    expect(next[12]).toBe(replacement.id);
    expect(next).not.toContain(ids15[12]);
    expect(next.slice(0, 12)).toEqual(ids15.slice(0, 12));
    expect(next.slice(13)).toEqual(ids15.slice(13));
    // Pure: the input list is untouched.
    expect(ids15[12]).toBe(QPG_VERIFIED_POOL[12].id);
    expect(ids15).toHaveLength(15);
  });

  it('swaps at the first and last positions too', () => {
    expect(replaceQpgQuestion(ids15, ids15[0], replacement.id)[0]).toBe(replacement.id);
    const last = replaceQpgQuestion(ids15, ids15[14], replacement.id);
    expect(last[14]).toBe(replacement.id);
    expect(last).toHaveLength(15);
  });

  it('no-ops: old id not selected, new id already selected, same id', () => {
    expect(replaceQpgQuestion(ids15, 'no-such-id', replacement.id)).toEqual(ids15);
    expect(replaceQpgQuestion(ids15, ids15[12], ids15[3])).toEqual(ids15);
    expect(replaceQpgQuestion(ids15, ids15[12], ids15[12])).toEqual(ids15);
  });

  it('rebuild: new paper carries the swap in place, answer key follows it', () => {
    const setup = defaultPaperSetup({
      title: 'মডেল টেস্ট',
      subject: 'English',
      classLabel: 'BCS',
      questionCount: 15,
      marksPerQuestion: 1,
      timeMinutes: 15,
      sectionHeading: 'ক-বিভাগ',
    });
    const before = buildQpgPaper({
      setup,
      questions: QPG_VERIFIED_POOL.slice(0, 15),
      isCustomVariant: false,
      kind: 'chapter-paper',
      patternLabelBn: 'অধ্যায়ভিত্তিক প্রশ্নপত্র — যাচাইকৃত প্রশ্ন',
      patternLabelEn: 'Chapter-based paper — verified questions',
    });
    const nextIds = replaceQpgQuestion(
      before.questions.map((q) => q.id),
      before.questions[12].id,
      replacement.id,
    );
    const byId = new Map(QPG_VERIFIED_POOL.map((q) => [q.id, q]));
    const nextQuestions = nextIds.map((id) => byId.get(id)!);
    const after = buildQpgPaper({
      setup: before.setup,
      questions: nextQuestions,
      isCustomVariant: before.isCustomVariant,
      kind: before.kind,
      patternLabelBn: before.patternLabelBn,
      patternLabelEn: before.patternLabelEn,
    });
    // A new paper object (the preview re-renders from it), same setup.
    expect(after.id).not.toBe(before.id);
    expect(after.setup.totalMarks).toBe(before.setup.totalMarks);
    expect(after.questions).toHaveLength(15);
    expect(after.questions[12].id).toBe(replacement.id);
    expect(after.questions[12].questionText).toBe(replacement.questionText);
    // The answer key follows the NEW question at the SAME position.
    expect(after.answerKey[12]).toBe(replacement.correctLetter);
    expect(after.answerKey).toHaveLength(15);
    expect(after.questions.slice(0, 12).map((q) => q.id)).toEqual(
      before.questions.slice(0, 12).map((q) => q.id),
    );
  });

  it('generation ordering (no set code) preserves the swapped position', () => {
    const swapped = replaceQpgQuestion(ids15, ids15[12], replacement.id);
    const byId = new Map(QPG_VERIFIED_POOL.map((q) => [q.id, q]));
    const ordered = questionsForSet(swapped.map((id) => byId.get(id)!), 7, '');
    expect(ordered.map((q) => q.id)).toEqual(swapped);
  });
});

describe('swap candidates: verified-only, same-chapter, not already in the paper', () => {
  it('picker candidates: 20 unselected verified same-chapter questions', () => {
    const available = BCS_CHAPTER_POOL;
    const selectedIds = available.slice(0, 15).map((q) => q.id);
    const candidates = pickerCandidates(available, available[12], selectedIds);
    expect(candidates).toHaveLength(20);
    expect(candidates.every((c) => c.verified === true)).toBe(true);
    expect(candidates.every((c) => c.chapterId === QPG_VERIFIED_CHAPTER_ID)).toBe(true);
    expect(candidates.every((c) => !selectedIds.includes(c.id))).toBe(true);
    expect(candidates.every((c) => c.id !== available[12].id)).toBe(true);
  });

  it('editor extras: 20 verified same-chapter questions not in the paper', () => {
    const paperQuestions = BCS_CHAPTER_POOL.slice(0, 15);
    const extras = paperExtras(BCS_CHAPTER_POOL, paperQuestions);
    expect(extras).toHaveLength(20);
    expect(extras.every((c) => c.verified === true)).toBe(true);
    expect(extras.every((c) => c.chapterId === QPG_VERIFIED_CHAPTER_ID)).toBe(true);
    expect(extras.every((c) => !paperQuestions.some((pq) => pq.id === c.id))).toBe(true);
  });

  it('chapter pool is verified-only at the source (cache-first, no Firestore)', () => {
    const pool = loadVerifiedChapterQuestions({
      stream: 'general',
      classId: 'honours',
      subjectId: 'english',
      chapterId: QPG_VERIFIED_CHAPTER_ID,
    });
    expect(pool).toHaveLength(35);
    expect(pool.every((q) => q.verified === true)).toBe(true);
    expect(pool.every((q) => q.chapterId === QPG_VERIFIED_CHAPTER_ID)).toBe(true);
  });

  it('Academic chapter swap candidates are Academic-only — no BCS leak from the grown pool', () => {
    // The pool grew to 1,170 (35 BCS + 1,135 Academic, 26 Nov 2026). A Class 3
    // paper's swap picker must offer only its own chapter's questions.
    // Production passes the full chapter selection as `available` and the
    // paper's ids as `selectedIds` — mirror that here.
    const res = selectQpgQuestions(
      {
        chapterIds: ['acad-class-3-eng-unit-1'],
        topicIds: [],
        type: 'mcq',
        difficulty: 'all',
        count: 10,
        source: 'any',
      },
      QPG_VERIFIED_POOL,
    );
    expect(res.questions).toHaveLength(4); // Unit 1 has 4 verified questions
    const selectedIds = res.questions.slice(0, 2).map((q) => q.id);
    const candidates = pickerCandidates(res.questions, res.questions[0], selectedIds);
    expect(candidates).toHaveLength(2);
    expect(candidates.every((c) => c.chapterId === 'acad-class-3-eng-unit-1')).toBe(true);
    expect(candidates.every((c) => c.verified === true)).toBe(true);
    const allAcad = QPG_VERIFIED_POOL.filter((q) => q.chapterId.startsWith('acad-'));
    expect(allAcad).toHaveLength(1135);
  });

  it('difficulty filter stays honest: a guessed difficulty yields nothing', () => {
    const res = selectQpgQuestions(
      {
        chapterIds: [QPG_VERIFIED_CHAPTER_ID],
        topicIds: [],
        type: 'mcq',
        difficulty: 'easy',
        count: 35,
        source: 'any',
      },
      QPG_VERIFIED_POOL,
    );
    expect(res.questions).toHaveLength(0);
    expect(res.reasonsBn.join(' ')).toContain('কাঠিন্য');
  });
});

describe('candidate cap lifted (comparison fixes, 26 Nov — item C)', () => {
  it('source: zero .slice(0, 5) candidate caps in the generator page', () => {
    // Picker candidates, editor candidates, extras "add" list — all
    // now show 10 + load-more, or all when expanded.
    expect(countOccurrences(GENERATOR_SRC, '.slice(0, 5)')).toBe(0);
  });

  it('all 20 valid candidates are reachable — first 10 + load-more reveals the rest', () => {
    const available = BCS_CHAPTER_POOL;
    const selectedIds = available.slice(0, 15).map((q) => q.id);
    const candidates = pickerCandidates(available, available[12], selectedIds);
    expect(candidates).toHaveLength(20);
    const firstPage = candidates.slice(0, 10);
    const rest = candidates.slice(10);
    expect(firstPage).toHaveLength(10);
    expect(rest).toHaveLength(10);
    expect(rest.every((c) => c.verified === true)).toBe(true);
    // A swap IS possible from the first page…
    const swapped = replaceQpgQuestion(selectedIds, available[12].id, firstPage[0].id);
    expect(swapped[12]).toBe(firstPage[0].id);
    // …and a specific valid candidate past the first 10 (e.g. rest[0])
    // is now reachable through the load-more — the old gap is closed.
    const swappedRest = replaceQpgQuestion(selectedIds, available[12].id, rest[0].id);
    expect(swappedRest[12]).toBe(rest[0].id);
  });
});
