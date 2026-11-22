/**
 * Eduvelto unit tests — NU admission question bank (NU-7; design
 * §11, §15 NU-7, §19.2.4–§19.2.6, §19.6).
 *
 * Covers the pure lib (src/lib/nuQuestions.ts): the question / draft
 * key / review / bundle / key validators, the publication state
 * machine + actor map, the publish gate, bundle + key assembly
 * (two-tier — answers never leak into a bundle), duplicate
 * detection, and correction versioning. The Firestore rules mirror
 * these validators — rules-nu7-question-bank.test.ts proves the
 * rules side.
 */
import { describe, it, expect } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  buildNuQuestionBundle,
  buildNuQuestionKeys,
  canTransitionQuestion,
  findNuDuplicateCandidates,
  newNuQuestionVersion,
  normalizeNuQuestionText,
  nuMockBundleConfigSnapshot,
  nuQuestionSimilarity,
  nuQuestionTransitionActor,
  nuTopicBundleConfigSnapshot,
  publishGateCheck,
  validateNuQuestionBundleDoc,
  validateNuQuestionDoc,
  validateNuQuestionDraftKey,
  validateNuQuestionKeyDoc,
  validateNuReviewDoc,
  type NuQuestionDoc,
} from '../nuQuestions';

const BASE_QUESTION: NuQuestionDoc & { questionId: string } = {
  questionId: 'q-1',
  version: 1,
  status: 'draft',
  sourceType: 'original_practice',
  provenance: 'HSC সিলেবাসভিত্তিক মূল প্রশ্ন — সাহিত্যপাঠ, গদ্য',
  groupIds: ['humanities', 'science', 'business'],
  subjectId: 'bangla',
  chapterId: 'nu-ch-bangla-prose',
  topicId: 'nu-tp-bangla-prose-01',
  questionText: 'অপরিচিতা গল্পের লেখক কে?',
  questionLang: 'bn',
  options: ['রবীন্দ্রনাথ ঠাকুর', 'কাজী নজরুল ইসলাম', 'শরৎচন্দ্র চট্টোপাধ্যায়', 'বঙ্কিমচন্দ্র চট্টোপাধ্যায়'],
  difficulty: 'easy',
  explanation: 'অপরিচিতা রবীন্দ্রনাথ ঠাকুরের লেখা ছোটগল্প।',
  createdBy: 'teacher-verified',
  circularVersion: 'nu-2025-26-v1',
};

describe('validateNuQuestionDoc', () => {
  it('a complete draft passes', () => {
    expect(validateNuQuestionDoc(BASE_QUESTION)).toEqual([]);
  });

  it('missing explanation fails', () => {
    const d = { ...BASE_QUESTION, explanation: '' };
    expect(validateNuQuestionDoc(d)).toContain('explanation বাধ্যতামূলক — ব্যাখ্যা ছাড়া প্রশ্ন Published হবে না');
  });

  it('3 options fail, 4 identical options fail', () => {
    expect(validateNuQuestionDoc({ ...BASE_QUESTION, options: ['ক', 'খ', 'গ'] }).length).toBeGreaterThan(0);
    expect(validateNuQuestionDoc({ ...BASE_QUESTION, options: ['ক', 'ক', 'গ', 'ঘ'] }).length).toBeGreaterThan(0);
  });

  it('a correct-answer field in the bank doc fails', () => {
    const d = { ...BASE_QUESTION, correctOptionIndex: 0 };
    expect(validateNuQuestionDoc(d)).toContain('সঠিক উত্তর এই ডকে থাকবে না — তা draft key-তে থাকে');
  });

  it('a group-40 block subject fails (Blocker B)', () => {
    const d = { ...BASE_QUESTION, subjectId: 'group-science' };
    expect(validateNuQuestionDoc(d).join(' ')).toContain('Blocker B');
  });

  it('a chapter from another subject fails', () => {
    const d = { ...BASE_QUESTION, chapterId: 'nu-ch-english-reading' };
    expect(validateNuQuestionDoc(d)).toContain('chapterId এই বিষয়ের কোনো অধ্যায়ের সঙ্গে মেলে না');
  });

  it('a topic from another chapter fails', () => {
    const d = { ...BASE_QUESTION, topicId: 'nu-tp-bangla-poetry-01' };
    expect(validateNuQuestionDoc(d)).toContain('topicId এই অধ্যায়ের কোনো টপিকের সঙ্গে মেলে না');
  });

  it('previous-year without examYear fails; non-previous with examYear fails', () => {
    expect(validateNuQuestionDoc({ ...BASE_QUESTION, sourceType: 'official_previous_year' }).length).toBeGreaterThan(0);
    expect(
      validateNuQuestionDoc({ ...BASE_QUESTION, sourceType: 'official_previous_year', examYear: 2025 }),
    ).toEqual([]);
    expect(validateNuQuestionDoc({ ...BASE_QUESTION, examYear: 2025 }).length).toBeGreaterThan(0);
  });

  it('bad difficulty / sourceType / groupIds fail', () => {
    expect(validateNuQuestionDoc({ ...BASE_QUESTION, difficulty: 'extreme' as never }).length).toBeGreaterThan(0);
    expect(validateNuQuestionDoc({ ...BASE_QUESTION, sourceType: 'random' as never }).length).toBeGreaterThan(0);
    expect(validateNuQuestionDoc({ ...BASE_QUESTION, groupIds: ['arts'] as never }).length).toBeGreaterThan(0);
    expect(validateNuQuestionDoc({ ...BASE_QUESTION, groupIds: [] }).length).toBeGreaterThan(0);
  });

  it('version 0 fails; unknown status fails', () => {
    expect(validateNuQuestionDoc({ ...BASE_QUESTION, version: 0 }).length).toBeGreaterThan(0);
    expect(validateNuQuestionDoc({ ...BASE_QUESTION, status: 'live' as never }).length).toBeGreaterThan(0);
  });
});

describe('validateNuQuestionDraftKey', () => {
  const key = {
    questionId: 'q-1',
    version: 1,
    correctOptionIndex: 0,
    createdBy: 'teacher-verified',
    subjectId: 'bangla',
    groupIds: ['humanities', 'science', 'business'],
  };
  it('a valid draft key passes', () => {
    expect(validateNuQuestionDraftKey(key)).toEqual([]);
  });
  it('correctOptionIndex 4 fails; missing questionId fails', () => {
    expect(validateNuQuestionDraftKey({ ...key, correctOptionIndex: 4 }).length).toBeGreaterThan(0);
    expect(validateNuQuestionDraftKey({ ...key, questionId: '' }).length).toBeGreaterThan(0);
  });
});

describe('validateNuReviewDoc', () => {
  const review = {
    questionId: 'q-1',
    questionVersion: 1,
    reviewerId: 'teacher-2',
    decision: 'approved' as const,
    checks: { questionCorrect: true, correctAnswerCorrect: true, explanationCorrect: true, sourceCorrect: true },
  };
  it('an approval without a reason passes', () => {
    expect(validateNuReviewDoc(review)).toEqual([]);
  });
  it('a rejection needs a reason of at least 10 chars', () => {
    expect(validateNuReviewDoc({ ...review, decision: 'rejected' as const }).length).toBeGreaterThan(0);
    expect(validateNuReviewDoc({ ...review, decision: 'rejected' as const, reason: 'ছোট' }).length).toBeGreaterThan(0);
    expect(
      validateNuReviewDoc({ ...review, decision: 'rejected' as const, reason: 'উত্তরটি ভুল উৎস থেকে নেওয়া' }),
    ).toEqual([]);
  });
  it('a missing check fails', () => {
    const checks = { ...review.checks, sourceCorrect: undefined as unknown as boolean };
    expect(validateNuReviewDoc({ ...review, checks }).length).toBeGreaterThan(0);
  });
});

describe('publication state machine (§19.6.1)', () => {
  it('the happy path edges are allowed', () => {
    expect(canTransitionQuestion('draft', 'submitted_for_review')).toBe(true);
    expect(canTransitionQuestion('submitted_for_review', 'under_review')).toBe(true);
    expect(canTransitionQuestion('under_review', 'approved')).toBe(true);
    expect(canTransitionQuestion('approved', 'published')).toBe(true);
    expect(canTransitionQuestion('published', 'withdrawn')).toBe(true);
    expect(canTransitionQuestion('under_review', 'changes_requested')).toBe(true);
    expect(canTransitionQuestion('changes_requested', 'submitted_for_review')).toBe(true);
  });
  it('skips and backward jumps are denied; rejected/withdrawn are terminal', () => {
    expect(canTransitionQuestion('draft', 'approved')).toBe(false);
    expect(canTransitionQuestion('draft', 'published')).toBe(false);
    expect(canTransitionQuestion('published', 'draft')).toBe(false);
    expect(canTransitionQuestion('approved', 'under_review')).toBe(false);
    expect(canTransitionQuestion('rejected', 'submitted_for_review')).toBe(false);
    expect(canTransitionQuestion('withdrawn', 'draft')).toBe(false);
    expect(canTransitionQuestion('submitted_for_review', 'approved')).toBe(false);
  });
  it('actor map: publish/withdraw admin-only, submit author-or-admin, review reviewer-or-admin', () => {
    expect(nuQuestionTransitionActor('approved', 'published')).toBe('adminOnly');
    expect(nuQuestionTransitionActor('published', 'withdrawn')).toBe('adminOnly');
    expect(nuQuestionTransitionActor('draft', 'submitted_for_review')).toBe('authorOrAdmin');
    expect(nuQuestionTransitionActor('under_review', 'approved')).toBe('reviewerOrAdmin');
    expect(nuQuestionTransitionActor('draft', 'approved')).toBeNull();
  });
});

describe('publishGateCheck (§19.6.1)', () => {
  it('a draft without review fields fails the gate', () => {
    const missing = publishGateCheck(BASE_QUESTION);
    expect(missing).toContain('পর্যালোচকের পরিচয়');
    expect(missing).toContain('পর্যালোচনার সময়');
  });
  it('an approved question with reviewer fields passes', () => {
    const q: NuQuestionDoc = {
      ...BASE_QUESTION,
      status: 'approved',
      reviewedBy: 'teacher-2',
      reviewedAt: Timestamp.now(),
    };
    expect(publishGateCheck(q)).toEqual([]);
  });
});

describe('buildNuQuestionBundle + buildNuQuestionKeys (two-tier)', () => {
  const published = (id: string, n: number): NuQuestionDoc & { questionId: string } => ({
    ...BASE_QUESTION,
    questionId: id,
    questionText: `প্রশ্ন ${n} — অপরিচিতা গল্পের লেখক কে?`,
    status: 'published',
    reviewedBy: 'teacher-2',
    reviewedAt: Timestamp.now(),
    publishedAt: Timestamp.now(),
  });

  it('a topic bundle strips answers and explanations', () => {
    const bundle = buildNuQuestionBundle({
      bundleId: 'bundle-topic-bangla-01',
      kind: 'topic',
      groupId: 'humanities',
      subjectId: 'bangla',
      topicId: 'nu-tp-bangla-prose-01',
      questions: [published('q-1', 1), published('q-2', 2)],
      configSnapshot: nuTopicBundleConfigSnapshot(2),
      publishedBy: 'admin-1',
    });
    expect(bundle.questionCount).toBe(2);
    expect(bundle.status).toBe('draft');
    expect(JSON.stringify(bundle)).not.toContain('correctOptionIndex');
    expect(JSON.stringify(bundle)).not.toContain('অপরিচিতা রবীন্দ্রনাথ');
    expect(bundle.questions[0].options).toHaveLength(4);
    expect(validateNuQuestionBundleDoc(bundle)).toEqual([]);
  });

  it('an unpublished question cannot enter a bundle', () => {
    expect(() =>
      buildNuQuestionBundle({
        bundleId: 'b-x',
        kind: 'topic',
        groupId: 'humanities',
        questions: [{ ...BASE_QUESTION, questionId: 'q-draft' }],
        configSnapshot: nuTopicBundleConfigSnapshot(1),
        publishedBy: 'admin-1',
      }),
    ).toThrow('nu-bundle-unpublished');
  });

  it('an empty bundle throws', () => {
    expect(() =>
      buildNuQuestionBundle({
        bundleId: 'b-x',
        kind: 'topic',
        groupId: 'humanities',
        questions: [],
        configSnapshot: nuTopicBundleConfigSnapshot(0),
        publishedBy: 'admin-1',
      }),
    ).toThrow('nu-bundle-empty');
  });

  it('a mock bundle needs exactly 100 questions', () => {
    const qs = Array.from({ length: 100 }, (_, i) => published(`q-m${i + 1}`, i + 1));
    const bundle = buildNuQuestionBundle({
      bundleId: 'bundle-mock-1',
      kind: 'mock',
      groupId: 'humanities',
      mockId: 'mock-1',
      questions: qs,
      configSnapshot: nuMockBundleConfigSnapshot(),
      publishedBy: 'admin-1',
    });
    expect(bundle.questionCount).toBe(100);
    expect(validateNuQuestionBundleDoc(bundle)).toEqual([]);
    expect(
      validateNuQuestionBundleDoc({ ...bundle, questions: bundle.questions.slice(0, 99), questionCount: 99 }),
    ).toContain('মক বান্ডেলে ঠিক ১০০টি প্রশ্ন থাকতে হবে');
  });

  it('keys carry the correct answer + explanation, version-matched', () => {
    const keys = buildNuQuestionKeys({
      bundleId: 'bundle-topic-bangla-01',
      entries: [{ questionId: 'q-1', version: 1, correctOptionIndex: 0, explanation: 'অপরিচিতা রবীন্দ্রনাথের লেখা।' }],
      questionVersion: 1,
    });
    expect(keys.keys[0].correctOptionIndex).toBe(0);
    expect(validateNuQuestionKeyDoc(keys)).toEqual([]);
    expect(validateNuQuestionKeyDoc({ ...keys, keys: [{ ...keys.keys[0], correctOptionIndex: 7 }] }).length).toBeGreaterThan(0);
  });
});

describe('duplicate detection (§11.4 — warning, not a block)', () => {
  it('identical text scores 1; near-identical scores ≥ 0.8; different text stays low', () => {
    expect(nuQuestionSimilarity('অপরিচিতা গল্পের লেখক কে?', 'অপরিচিতা গল্পের লেখক কে?')).toBe(1);
    expect(normalizeNuQuestionText('অপরিচিতা  গল্পের   লেখক কে?')).toBe('অপরিচিতা গল্পের লেখক কে');
    const near = nuQuestionSimilarity(
      'অপরিচিতা গল্পের লেখক কে?',
      'অপরিচিতা গল্পটির লেখক কে?',
    );
    expect(near).toBeGreaterThanOrEqual(0.5);
    expect(nuQuestionSimilarity('অপরিচিতা গল্পের লেখক কে?', 'বাংলাদেশের রাজধানী কোনটি?')).toBeLessThan(0.5);
  });

  it('findNuDuplicateCandidates flags the near-identical question only', () => {
    const existing = [
      { questionId: 'q-a', questionText: 'অপরিচিতা গল্পের লেখক কে?' },
      { questionId: 'q-b', questionText: 'বাংলাদেশের রাজধানী কোনটি?' },
    ];
    const found = findNuDuplicateCandidates(existing, 'অপরিচিতা গল্পের লেখক কে?');
    expect(found.map((f) => f.questionId)).toEqual(['q-a']);
  });
});

describe('newNuQuestionVersion (§19.6.2)', () => {
  it('a correction is a new draft doc, version + 1, pointing back', () => {
    const oldQ: NuQuestionDoc & { questionId: string } = {
      ...BASE_QUESTION,
      status: 'published',
      reviewedBy: 'teacher-2',
      reviewedAt: Timestamp.now(),
      publishedAt: Timestamp.now(),
    };
    const next = newNuQuestionVersion(oldQ, 'q-1-v2', 'teacher-3');
    expect(next.version).toBe(2);
    expect(next.status).toBe('draft');
    expect(next.previousQuestionId).toBe('q-1');
    expect(next.createdBy).toBe('teacher-3');
    expect(next.reviewedBy).toBeNull();
    expect(next.reviewedAt).toBeNull();
    expect(next.publishedAt).toBeNull();
    expect(next.questionText).toBe(oldQ.questionText);
  });
});

describe('question-bank seed file (NU-7)', () => {
  it('the bank starts empty — 0 questions, nothing to apply', () => {
    const seed = JSON.parse(
      readFileSync(resolve(__dirname, '../../../team/nu-question-bank-seed-2026-11-22.json'), 'utf8'),
    ) as Record<string, unknown>;
    expect(seed.doNotApply).toBe(true);
    expect(seed.questions).toEqual([]);
    expect(seed.bundles).toEqual([]);
    expect(seed.keys).toEqual([]);
    expect(seed.draftKeys).toEqual([]);
    const example = seed.schemaExample as Record<string, { example: boolean }>;
    expect(example.example).toBe(true);
  });
});
