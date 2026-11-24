/**
 * Eduvelto Job Preparation — written AI feedback stub tests
 * (design-grades-written-previous-admin.md §7 step 9).
 */
import { describe, it, expect } from 'vitest';
import {
  askWrittenFeedback,
  buildWrittenFeedbackPrompt,
  validateWrittenFeedback,
  AI_FEEDBACK_LABEL,
  AI_FEEDBACK_NOTICE,
  AI_FEEDBACK_CHECK_CATEGORIES,
  WRITTEN_FEEDBACK_MAX_CHARS,
  type WrittenFeedback,
  type WrittenFeedbackRequest,
} from '../jobWrittenFeedback';

function baseRequest(overrides: Partial<WrittenFeedbackRequest> = {}): WrittenFeedbackRequest {
  return {
    questionId: 'wq-en-essay-001',
    answerType: 'english-essay',
    questionTextBn: 'নিচের বিষয়ে একটি ইংরেজি প্রবন্ধ লেখো।',
    questionTextEn: 'Write an essay in English on "The Importance of Reading Books".',
    answerText: 'Books are silent teachers. They open the door of knowledge.',
    rubricVersion: 'v1',
    consented: true,
    ...overrides,
  };
}

function baseFeedback(overrides: Partial<WrittenFeedback> = {}): WrittenFeedback {
  return {
    feedbackId: 'fb-001',
    submissionId: 'sub-001',
    questionId: 'wq-en-essay-001',
    rubricVersion: 'v1',
    evaluationType: 'teacher',
    criteria: [
      { dimension: 'relevance', score: 16, max: 20, comment: 'On topic throughout.', confidence: 'high' },
    ],
    corrections: [{ original: 'He go to school.', improved: 'He goes to school.', note: 'Subject-verb agreement.' }],
    strengths: ['Clear introduction, quoted: "Books are silent teachers."'],
    improvements: ['Add one example per main point.'],
    factualWarnings: [],
    overallFeedback: 'Good structure. Next practice step: পরের বার ভূমিকায় প্রশ্নের মূল শব্দটি ব্যবহার করে লিখুন।',
    ...overrides,
  };
}

describe('askWrittenFeedback — ships DISABLED (§2.8)', () => {
  it('returns not-configured when no proxy URL is set', async () => {
    const res = await askWrittenFeedback(baseRequest());
    expect(res.kind).toBe('not-configured');
  });

  it('requires the student’s explicit per-submission consent (§2.7)', async () => {
    const res = await askWrittenFeedback(baseRequest({ consented: false }));
    expect(res.kind).toBe('error');
    if (res.kind === 'error') {
      expect(res.messageBn).toContain('সম্মতি');
    }
  });

  it('never presents raw model text as structured feedback — even with a live-looking proxy', async () => {
    const stubFetch = (async () =>
      new Response(JSON.stringify({ reply: 'Great essay! 90/100.', provider: 'gemini' }), { status: 200 })) as unknown as typeof fetch;
    const res = await askWrittenFeedback(
      baseRequest({ proxyUrl: 'https://proxy.example.test', fetchImpl: stubFetch }),
    );
    // The stub returns 'error — not on yet', never an 'ai' result with
    // the raw text dressed up as feedback. Step 19 (live-gated) is
    // what would parse it — and only after a live Worker check.
    expect(res.kind).toBe('error');
    if (res.kind === 'error') {
      expect(res.messageEn).toContain('not on yet');
    }
  });

  it('maps quota exhaustion honestly', async () => {
    const stubFetch = (async () => new Response('{}', { status: 429 })) as unknown as typeof fetch;
    const res = await askWrittenFeedback(
      baseRequest({ proxyUrl: 'https://proxy.example.test', fetchImpl: stubFetch }),
    );
    expect(res.kind).toBe('quota-exhausted');
  });
});

describe('buildWrittenFeedbackPrompt (§2.8 — new Worker prompt mode)', () => {
  it('carries the rubric, 6 categories, 4-way fact distinction and per-item confidence', () => {
    const prompt = buildWrittenFeedbackPrompt(baseRequest());
    expect(prompt).toContain('relevance');
    expect(prompt).toContain('verified-incorrect');
    expect(prompt).toContain('could-not-verify');
    expect(prompt).toContain('per feedback item');
    expect(prompt).toContain('Never give predicted examiner marks');
    expect(prompt).toContain('never an official examiner');
  });

  it('carries only answer text + question — no identity, no UID', () => {
    const prompt = buildWrittenFeedbackPrompt(baseRequest());
    expect(prompt).not.toMatch(/uid|email|@|phone|location/i);
  });

  it('truncates a long answer to the 2000-char discipline', () => {
    const prompt = buildWrittenFeedbackPrompt(baseRequest({ answerText: 'x'.repeat(5000) }));
    expect(prompt.length).toBeLessThan(5000);
    expect(WRITTEN_FEEDBACK_MAX_CHARS).toBe(2000);
  });

  it('the 6 check categories are spelling, grammar, facts, relevance, presentation, structure', () => {
    expect([...AI_FEEDBACK_CHECK_CATEGORIES]).toEqual([
      'spelling',
      'grammar',
      'facts',
      'relevance',
      'presentation',
      'structure',
    ]);
  });
});

describe('validateWrittenFeedback — never just a number (§2.6)', () => {
  it('passes a complete teacher feedback', () => {
    expect(validateWrittenFeedback(baseFeedback())).toEqual([]);
  });

  it('rejects feedback with no strengths', () => {
    const problems = validateWrittenFeedback(baseFeedback({ strengths: [] }));
    expect(problems.some((p) => p.includes('strengths'))).toBe(true);
  });

  it('rejects feedback with no improvements', () => {
    const problems = validateWrittenFeedback(baseFeedback({ improvements: [] }));
    expect(problems.some((p) => p.includes('areas to improve'))).toBe(true);
  });

  it('rejects more than 3 improvements', () => {
    const problems = validateWrittenFeedback(baseFeedback({ improvements: ['a', 'b', 'c', 'd'] }));
    expect(problems.some((p) => p.includes('at most 3'))).toBe(true);
  });

  it('rejects feedback with no next practice step', () => {
    const problems = validateWrittenFeedback(baseFeedback({ overallFeedback: 'Good essay.' }));
    expect(problems.some((p) => p.includes('next practice step'))).toBe(true);
  });

  it('rejects a prohibited claim inside AI feedback', () => {
    const problems = validateWrittenFeedback(
      baseFeedback({ evaluationType: 'ai', overallFeedback: 'Your Official Exam Result is 72. Next: practise more.' }),
    );
    expect(problems.some((p) => p.includes('prohibited claim'))).toBe(true);
  });

  it('rejects an out-of-range criterion score', () => {
    const problems = validateWrittenFeedback(
      baseFeedback({
        criteria: [{ dimension: 'relevance', score: 25, max: 20, comment: 'x', confidence: 'high' }],
      }),
    );
    expect(problems.some((p) => p.includes('out of range'))).toBe(true);
  });

  it('AI label + notice are exact (§2.6)', () => {
    expect(AI_FEEDBACK_LABEL.bn).toBe('AI সহায়ক মূল্যায়ন (Practice Feedback)');
    expect(AI_FEEDBACK_NOTICE.bn).toContain('শুধু অনুশীলনের জন্য');
    expect(AI_FEEDBACK_NOTICE.bn).toContain('কোনো সরকারি পরীক্ষকের মূল্যায়ন বা চূড়ান্ত নম্বর নয়');
    expect(AI_FEEDBACK_NOTICE.en).toContain('for practice only');
  });
});
