/**
 * Eduvelto Job Preparation — Step 7 unit tests (jobQuestions.ts).
 *
 * Covers: duplicate hash (normalisation + stability), question
 * validation (all failure modes + the previous-year proof rule),
 * bundle validation (key-leak ban, count mismatch), the state
 * machine (author vs Moderator/Admin moves, no direct draft ->
 * published), the bundle builder (Published-only, key separation,
 * deterministic IDs), receipt freshness, and the review-queue
 * constraints.
 */
import { describe, it, expect } from 'vitest';
import {
  JOB_QUESTION_CONFIG_VERSION,
  JOB_RECEIPT_WINDOW_MINUTES,
  jobQuestionDuplicateHash,
  normalizeJobQuestionText,
  validateJobQuestion,
  validateJobQuestionBundle,
  jobQuestionAllowedMoves,
  buildJobBundle,
  jobBundleIdForTopic,
  jobBundleIdForMock,
  jobBundleIdForDaily,
  jobBundleIdForWeekly,
  jobBundleIdForPrevious,
  jobBundleQuestionById,
  isJobReceiptFresh,
  jobReviewQueueConstraints,
  type JobQuestion,
} from '../jobQuestions';

const BASE_QUESTION: Record<string, unknown> = {
  examSlug: 'bcs',
  subjectId: 'bcs__bangla',
  chapterId: 'bcs__bangla__grammar',
  topicId: 'bcs__bangla__grammar__sandhi',
  questionText: 'সন্ধি কাকে বলে?',
  options: [
    { letter: 'A', text: 'দুটি স্বরের মিলন' },
    { letter: 'B', text: 'দুটি ধ্বনির মিলন' },
    { letter: 'C', text: 'দুটি শব্দের মিলন' },
    { letter: 'D', text: 'দুটি বাক্যের মিলন' },
  ],
  correctLetter: 'B',
  explanation: 'সন্ধি হলো দুটি ধ্বনির মিলন।',
  whyWrong: null,
  difficulty: 'medium',
  isPreviousYear: false,
  examYear: null,
  source: 'BCS প্রিলিমিনারি সিলেবাস',
  sourceUrl: null,
  status: 'draft',
  reviewStatus: 'Not Started',
  reviewerId: null,
  verifiedBy: null,
  verifiedAt: null,
  rejectionReason: null,
  duplicateHash: 'abcdef0123456789',
  duplicateOf: null,
  bundleId: null,
  version: 1,
  configVersion: JOB_QUESTION_CONFIG_VERSION,
  authorId: 'teacher-v',
  createdBy: 'teacher-v',
};

const BASE_BUNDLE: Record<string, unknown> = {
  kind: 'topic',
  examSlug: 'bcs',
  topicId: 'bcs__bangla__grammar__sandhi',
  mockId: null,
  year: null,
  titleBn: 'সন্ধি — অনুশীলন',
  titleEn: 'Sandhi — Practice',
  questions: [
    {
      n: 1,
      questionId: 'q1',
      topicId: 'bcs__bangla__grammar__sandhi',
      subjectId: 'bcs__bangla',
      questionText: 'সন্ধি কাকে বলে?',
      options: [
        { letter: 'A', text: 'দুটি স্বরের মিলন' },
        { letter: 'B', text: 'দুটি ধ্বনির মিলন' },
        { letter: 'C', text: 'দুটি শব্দের মিলন' },
        { letter: 'D', text: 'দুটি বাক্যের মিলন' },
      ],
      difficulty: 'medium',
    },
  ],
  questionCount: 1,
  bundleVersion: 1,
  status: 'published',
  reviewStatus: 'Published',
  sourceQuestionIds: ['q1'],
  configVersion: JOB_QUESTION_CONFIG_VERSION,
};

describe('duplicate hash', () => {
  it('(u1) identical text gives the same hash', () => {
    expect(jobQuestionDuplicateHash('সন্ধি কাকে বলে?')).toBe(
      jobQuestionDuplicateHash('সন্ধি কাকে বলে?'),
    );
  });
  it('(u2) punctuation/whitespace/case differences do NOT change the hash', () => {
    expect(jobQuestionDuplicateHash('সন্ধি কাকে বলে?')).toBe(
      jobQuestionDuplicateHash('  সন্ধি   কাকে বলে ! '),
    );
    expect(jobQuestionDuplicateHash('What is sandhi?')).toBe(
      jobQuestionDuplicateHash('WHAT IS SANDHI'),
    );
  });
  it('(u3) different text gives a different hash', () => {
    expect(jobQuestionDuplicateHash('সন্ধি কাকে বলে?')).not.toBe(
      jobQuestionDuplicateHash('সমাস কাকে বলে?'),
    );
  });
  it('(u4) normalisation strips punctuation and folds case', () => {
    expect(normalizeJobQuestionText('Hello, World!')).toBe('helloworld');
  });
  it('(u5) hash is 16 hex chars', () => {
    expect(jobQuestionDuplicateHash('সন্ধি কাকে বলে?')).toMatch(/^[0-9a-f]{16}$/);
  });
  it('(u51) same text in a different subject gives a different hash (P2-01 context)', () => {
    const ctx = {
      subjectId: 'bcs__bangla',
      chapterId: 'bcs__bangla__grammar',
      topicId: 'bcs__bangla__grammar__sandhi',
      correctLetter: 'B',
    };
    expect(jobQuestionDuplicateHash('সন্ধি কাকে বলে?', ctx)).not.toBe(
      jobQuestionDuplicateHash('সন্ধি কাকে বলে?', { ...ctx, subjectId: 'bcs__english' }),
    );
  });
  it('(u52) same text + same context gives the same hash', () => {
    const ctx = {
      subjectId: 'bcs__bangla',
      chapterId: 'bcs__bangla__grammar',
      topicId: 'bcs__bangla__grammar__sandhi',
      correctLetter: 'B',
    };
    expect(jobQuestionDuplicateHash('সন্ধি কাকে বলে?', ctx)).toBe(
      jobQuestionDuplicateHash('সন্ধি কাকে বলে?', ctx),
    );
  });
  it('(u53) same text with a different correct answer gives a different hash', () => {
    const ctx = {
      subjectId: 'bcs__bangla',
      chapterId: 'bcs__bangla__grammar',
      topicId: 'bcs__bangla__grammar__sandhi',
      correctLetter: 'B',
    };
    expect(jobQuestionDuplicateHash('সন্ধি কাকে বলে?', ctx)).not.toBe(
      jobQuestionDuplicateHash('সন্ধি কাকে বলে?', { ...ctx, correctLetter: 'C' }),
    );
  });
});

describe('validateJobQuestion', () => {
  it('(u6) a well-formed draft passes', () => {
    expect(validateJobQuestion(BASE_QUESTION)).toEqual([]);
  });
  it('(u7) missing explanation fails (no explanation, no publication)', () => {
    expect(validateJobQuestion({ ...BASE_QUESTION, explanation: '' }).length).toBeGreaterThan(0);
  });
  it('(u8) 3 options fail', () => {
    const options = (BASE_QUESTION.options as unknown[]).slice(0, 3);
    expect(validateJobQuestion({ ...BASE_QUESTION, options }).length).toBeGreaterThan(0);
  });
  it('(u9) wrong option letter order fails', () => {
    const options = (BASE_QUESTION.options as Array<Record<string, unknown>>).map((o, i) => ({
      ...o,
      letter: ['B', 'A', 'C', 'D'][i],
    }));
    expect(validateJobQuestion({ ...BASE_QUESTION, options }).length).toBeGreaterThan(0);
  });
  it('(u10) correctLetter outside A–D fails', () => {
    expect(validateJobQuestion({ ...BASE_QUESTION, correctLetter: 'E' }).length).toBeGreaterThan(0);
  });
  it('(u11) previous-year without examYear + sourceUrl fails', () => {
    expect(validateJobQuestion({ ...BASE_QUESTION, isPreviousYear: true }).length).toBeGreaterThan(0);
  });
  it('(u12) previous-year with examYear + sourceUrl passes', () => {
    expect(
      validateJobQuestion({
        ...BASE_QUESTION,
        isPreviousYear: true,
        examYear: 2024,
        sourceUrl: 'https://example.gov.bd/circular-2024',
      }),
    ).toEqual([]);
  });
  it('(u13) previous-year with an out-of-range year fails', () => {
    expect(
      validateJobQuestion({
        ...BASE_QUESTION,
        isPreviousYear: true,
        examYear: 1800,
        sourceUrl: 'https://example.gov.bd/circular',
      }).length,
    ).toBeGreaterThan(0);
  });
  it('(u14) status published with reviewStatus Not Started fails (two-field consistency)', () => {
    expect(validateJobQuestion({ ...BASE_QUESTION, status: 'published' }).length).toBeGreaterThan(0);
  });
  it('(u15) status published + reviewStatus Published passes', () => {
    expect(
      validateJobQuestion({ ...BASE_QUESTION, status: 'published', reviewStatus: 'Published' }),
    ).toEqual([]);
  });
  it('(u16) unknown reviewStatus fails', () => {
    expect(validateJobQuestion({ ...BASE_QUESTION, reviewStatus: 'Approved' }).length).toBeGreaterThan(0);
  });
  it('(u17) it-professional fails (scope pending)', () => {
    expect(
      validateJobQuestion({
        ...BASE_QUESTION,
        examSlug: 'it-professional',
        subjectId: 'it-professional__programming',
        chapterId: 'it-professional__programming__basics',
        topicId: 'it-professional__programming__basics__intro',
      }).length,
    ).toBeGreaterThan(0);
  });
  it('(u18) cross-exam parent chain fails', () => {
    expect(validateJobQuestion({ ...BASE_QUESTION, subjectId: 'bank__bangla' }).length).toBeGreaterThan(0);
  });
  it('(u19) unknown subject fails (not one of the 23 canonical subjects)', () => {
    expect(validateJobQuestion({ ...BASE_QUESTION, subjectId: 'bcs__no-such-subject' }).length).toBeGreaterThan(0);
  });
  it('(u20) 3-segment topicId fails', () => {
    expect(validateJobQuestion({ ...BASE_QUESTION, topicId: 'bcs__bangla__sandhi' }).length).toBeGreaterThan(0);
  });
  it('(u21) bad difficulty fails', () => {
    expect(validateJobQuestion({ ...BASE_QUESTION, difficulty: 'extreme' }).length).toBeGreaterThan(0);
  });
  it('(u22) version 0 fails', () => {
    expect(validateJobQuestion({ ...BASE_QUESTION, version: 0 }).length).toBeGreaterThan(0);
  });
  it('(u23) missing duplicateHash fails', () => {
    expect(validateJobQuestion({ ...BASE_QUESTION, duplicateHash: '' }).length).toBeGreaterThan(0);
  });
});

describe('validateJobQuestionBundle', () => {
  it('(u24) a well-formed Published bundle passes', () => {
    expect(validateJobQuestionBundle(BASE_BUNDLE)).toEqual([]);
  });
  it('(u25) a bundle containing correctLetter fails (key leak)', () => {
    const questions = [
      { ...(BASE_BUNDLE.questions as Array<Record<string, unknown>>)[0], correctLetter: 'B' },
    ];
    expect(validateJobQuestionBundle({ ...BASE_BUNDLE, questions }).length).toBeGreaterThan(0);
  });
  it('(u26) a bundle containing explanation fails (key leak)', () => {
    const questions = [
      { ...(BASE_BUNDLE.questions as Array<Record<string, unknown>>)[0], explanation: 'leaked' },
    ];
    expect(validateJobQuestionBundle({ ...BASE_BUNDLE, questions }).length).toBeGreaterThan(0);
  });
  it('(u27) questionCount != questions.length fails', () => {
    expect(validateJobQuestionBundle({ ...BASE_BUNDLE, questionCount: 5 }).length).toBeGreaterThan(0);
  });
  it('(u28) topic kind without topicId fails', () => {
    expect(validateJobQuestionBundle({ ...BASE_BUNDLE, topicId: null }).length).toBeGreaterThan(0);
  });
  it('(u29) mock kind without mockId fails', () => {
    expect(
      validateJobQuestionBundle({ ...BASE_BUNDLE, kind: 'mock', topicId: null, mockId: null }).length,
    ).toBeGreaterThan(0);
  });
  it('(u30) previous kind without year fails', () => {
    expect(
      validateJobQuestionBundle({ ...BASE_BUNDLE, kind: 'previous', topicId: null, year: null }).length,
    ).toBeGreaterThan(0);
  });
  it('(u31) previous kind with year passes', () => {
    expect(
      validateJobQuestionBundle({ ...BASE_BUNDLE, kind: 'previous', topicId: null, year: 2024 }),
    ).toEqual([]);
  });
  it('(u32) unknown kind fails', () => {
    expect(validateJobQuestionBundle({ ...BASE_BUNDLE, kind: 'surprise' }).length).toBeGreaterThan(0);
  });
  it('(u55) questionCount 0 fails (a bundle must answer at least one question)', () => {
    expect(validateJobQuestionBundle({ ...BASE_BUNDLE, questions: [], questionCount: 0 }).length).toBeGreaterThan(0);
  });
  it('(u56) questionCount 201 fails (largest verified exam: BCS 200)', () => {
    const questions = Array.from({ length: 201 }, (_, i) => ({
      ...(BASE_BUNDLE.questions as Array<Record<string, unknown>>)[0],
      n: i + 1,
      questionId: `q${i + 1}`,
    }));
    expect(
      validateJobQuestionBundle({ ...BASE_BUNDLE, questions, questionCount: 201 }).length,
    ).toBeGreaterThan(0);
  });
});

describe('state machine', () => {
  it('(u33) author may submit Not Started → Under Review', () => {
    expect(jobQuestionAllowedMoves('Not Started', 'author')).toContain('Under Review');
  });
  it('(u34) author may NOT publish', () => {
    expect(jobQuestionAllowedMoves('Not Started', 'author')).not.toContain('Published');
    expect(jobQuestionAllowedMoves('Under Review', 'author')).toEqual([]);
  });
  it('(u35) moderator may publish from Under Review', () => {
    expect(jobQuestionAllowedMoves('Under Review', 'moderator')).toContain('Published');
  });
  it('(u36) moderator may NOT publish from Not Started (no direct draft → published)', () => {
    expect(jobQuestionAllowedMoves('Not Started', 'moderator')).not.toContain('Published');
    expect(jobQuestionAllowedMoves('In Progress', 'moderator')).not.toContain('Published');
  });
  it('(u37) moderator may reject or archive from any non-published state', () => {
    expect(jobQuestionAllowedMoves('In Progress', 'moderator')).toContain('Rejected');
    expect(jobQuestionAllowedMoves('Under Review', 'moderator')).toContain('Archived');
  });
  it('(u38) a Published question returns to Not Started or Archived only', () => {
    expect(jobQuestionAllowedMoves('Published', 'moderator')).toEqual(['Not Started', 'Archived']);
  });
  it('(u39) a Rejected question returns to Not Started or Archived', () => {
    expect(jobQuestionAllowedMoves('Rejected', 'admin')).toEqual(['Not Started', 'Archived']);
  });
});

describe('buildJobBundle', () => {
  const published = (id: string): JobQuestion & { id: string } => ({
    ...(BASE_QUESTION as unknown as JobQuestion),
    id,
    status: 'published',
    reviewStatus: 'Published',
  });
  const meta = {
    bundleId: 'topic__bcs__bangla__grammar__sandhi',
    kind: 'topic' as const,
    examSlug: 'bcs',
    topicId: 'bcs__bangla__grammar__sandhi',
    titleBn: 'সন্ধি — অনুশীলন',
    titleEn: 'Sandhi — Practice',
  };

  it('(u40) builds a bundle + key from Published questions', () => {
    const { bundle, key } = buildJobBundle([published('q1'), published('q2')], meta);
    expect(bundle.questionCount).toBe(2);
    expect(bundle.bundleVersion).toBe(1);
    expect(bundle.questions[0].n).toBe(1);
    expect(bundle.questions[1].n).toBe(2);
    expect(key.bundleId).toBe(meta.bundleId);
    expect(key.answers).toHaveLength(2);
    expect(key.answers[0].correctLetter).toBe('B');
    expect(key.answers[0].explanation).toBe('সন্ধি হলো দুটি ধ্বনির মিলন।');
  });
  it('(u41) the bundle contains NO key material', () => {
    const { bundle } = buildJobBundle([published('q1')], meta);
    const flat = JSON.stringify(bundle);
    expect(flat).not.toContain('correctLetter');
    expect(flat).not.toContain('explanation');
    expect(flat).not.toContain('correctText');
  });
  it('(u42) a draft question refuses to build', () => {
    const draft = { ...published('q1'), status: 'draft' as const, reviewStatus: 'Not Started' as const };
    expect(() => buildJobBundle([draft], meta)).toThrow(/not Published/);
  });
  it('(u43) a question without an explanation refuses to build', () => {
    const noExpl = { ...published('q1'), explanation: '' };
    expect(() => buildJobBundle([noExpl], meta)).toThrow(/incomplete/);
  });
  it('(u44) bundle IDs are deterministic', () => {
    expect(jobBundleIdForTopic('bcs__bangla__grammar__sandhi')).toBe('topic__bcs__bangla__grammar__sandhi');
    expect(jobBundleIdForMock('bcs-mock-01')).toBe('mock__bcs-mock-01');
    expect(jobBundleIdForDaily('2026-11-22')).toBe('daily__2026-11-22');
    expect(jobBundleIdForWeekly('2026-W47')).toBe('weekly__2026-W47');
    expect(jobBundleIdForPrevious('bcs', 2024)).toBe('previous__bcs__2024');
  });
  it('(u54) the built key carries the bundle configVersion (P1-06)', () => {
    const { bundle, key } = buildJobBundle([published('q1')], meta);
    expect(bundle.configVersion).toBe(JOB_QUESTION_CONFIG_VERSION);
    expect(key.configVersion).toBe(JOB_QUESTION_CONFIG_VERSION);
    expect(key.configVersion).toBe(bundle.configVersion);
  });
  it('(u57) bundleVersion 0 / missing fails validation (Step 8 fold-in, finding 5)', () => {
    expect(validateJobQuestionBundle({ ...BASE_BUNDLE, bundleVersion: 0 }).length).toBeGreaterThan(0);
    const { bundleVersion: _v, ...noVersion } = BASE_BUNDLE;
    expect(validateJobQuestionBundle(noVersion).length).toBeGreaterThan(0);
    expect(validateJobQuestionBundle(BASE_BUNDLE)).toEqual([]);
  });
  it('(u58) the builder denormalizes difficulty into the bundle (Step 8 fold-in, finding 3)', () => {
    const { bundle } = buildJobBundle([
      { ...published('q1'), difficulty: 'hard' as const },
      { ...published('q2'), difficulty: 'easy' as const },
    ], meta);
    expect(bundle.questions[0].difficulty).toBe('hard');
    expect(bundle.questions[1].difficulty).toBe('easy');
    expect(validateJobQuestionBundle(bundle as unknown as Record<string, unknown>)).toEqual([]);
  });
  it('(u59) a bundle question without a valid difficulty fails validation', () => {
    const { bundle } = buildJobBundle([published('q1')], meta);
    const noDiff = { ...bundle, questions: [{ ...bundle.questions[0], difficulty: undefined }] };
    expect(validateJobQuestionBundle(noDiff as unknown as Record<string, unknown>).length).toBeGreaterThan(0);
    const badDiff = { ...bundle, questions: [{ ...bundle.questions[0], difficulty: 'extreme' }] };
    expect(validateJobQuestionBundle(badDiff as unknown as Record<string, unknown>).length).toBeGreaterThan(0);
  });
  it('(u60) jobBundleQuestionById finds by questionId, not by position', () => {
    const { bundle } = buildJobBundle([published('q1'), published('q2')], meta);
    expect(jobBundleQuestionById(bundle.questions, 'q2')?.n).toBe(2);
    expect(jobBundleQuestionById(bundle.questions, 'q-missing')).toBeUndefined();
  });
});

describe('receipt freshness', () => {
  it('(u45) a receipt 5 minutes old is fresh', () => {
    const now = Date.now();
    expect(isJobReceiptFresh(now - 5 * 60 * 1000, now)).toBe(true);
  });
  it('(u46) a receipt 11 minutes old is stale', () => {
    const now = Date.now();
    expect(isJobReceiptFresh(now - 11 * 60 * 1000, now)).toBe(false);
  });
  it('(u47) a receipt from the future is not fresh', () => {
    const now = Date.now();
    expect(isJobReceiptFresh(now + 60 * 1000, now)).toBe(false);
  });
  it('(u48) the window is 10 minutes', () => {
    expect(JOB_RECEIPT_WINDOW_MINUTES).toBe(10);
  });
});

describe('review queue', () => {
  it('(u49) the queue is reviewStatus == Under Review', () => {
    expect(jobReviewQueueConstraints()).toEqual([
      { field: 'reviewStatus', op: '==', value: 'Under Review' },
    ]);
  });
  it('(u50) the config version matches the Step 6 seed version', () => {
    expect(JOB_QUESTION_CONFIG_VERSION).toBe('2026-11-22.1');
  });
});
