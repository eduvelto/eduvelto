// Question Paper Generator Phase 2 — Question Contribution tests.
// Validation, duplicate detection, points/coupon proposals, levels,
// approval outcome, leaderboard.
import { describe, it, expect } from 'vitest';
import {
  contributionApprovalFor,
  contributorLevelFor,
  findPossibleDuplicates,
  generateCouponCode,
  normalizeQuestionText,
  QPG_CONTRIBUTION_COUPON_BDT,
  QPG_CONTRIBUTION_COUPON_MAX_PER_ORDER,
  QPG_CONTRIBUTION_COUPON_VALID_DAYS,
  QPG_CONTRIBUTION_POINTS_PER_APPROVAL,
  QPG_CONTRIBUTOR_ACTIVE_POINTS,
  topContributors,
  validateQpgContribution,
  type QpgContributionDoc,
} from '../qpgContributions';

function validContribution(overrides: Partial<QpgContributionDoc> = {}): QpgContributionDoc {
  return {
    contributorUid: 'teacher-1',
    contributorName: 'রহিমা খাতুন',
    institution: 'কক্সবাজার উচ্চ বিদ্যালয়',
    stream: 'general',
    classId: 'class-9',
    subjectId: 'english',
    chapterId: 'ch-1',
    topic: 'Tense',
    type: 'mcq',
    questionText: 'Which sentence is in the present perfect tense?',
    options: ['He goes to school.', 'He has gone to school.', 'He went to school.', 'He will go.'],
    correctAnswer: 1,
    explanation: 'has gone — present perfect (have/has + past participle).',
    source: 'English For Today IX–X, Chapter 1 (reference only — own wording)',
    difficulty: 'medium',
    cognitiveLevel: 'application',
    nature: 'theoretical',
    ownWordingConfirmed: true,
    status: 'pending_review',
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('validateQpgContribution', () => {
  it('accepts a well-formed MCQ submission', () => {
    expect(validateQpgContribution(validContribution())).toEqual([]);
  });

  it('rejects MCQ without exactly 4 options or without one correct answer', () => {
    expect(
      validateQpgContribution(validContribution({ options: ['a', 'b', 'c'] })).length,
    ).toBeGreaterThan(0);
    expect(
      validateQpgContribution(validContribution({ correctAnswer: 4 })).length,
    ).toBeGreaterThan(0);
    expect(
      validateQpgContribution(validContribution({ correctAnswer: 'B' as never })).length,
    ).toBeGreaterThan(0);
  });

  it('rejects a submission that is not the teacher’s own wording', () => {
    expect(
      validateQpgContribution(validContribution({ ownWordingConfirmed: false })).join(' '),
    ).toContain('own wording');
  });

  it('rejects a submission that does not start as pending_review', () => {
    expect(
      validateQpgContribution(validContribution({ status: 'approved' })).length,
    ).toBeGreaterThan(0);
  });

  it('rejects a bare board-question claim without a verifiable source', () => {
    expect(
      validateQpgContribution(validContribution({ source: 'বোর্ড প্রশ্ন' })).length,
    ).toBeGreaterThan(0);
    // A full citation passes validation (the ADMIN still verifies it).
    expect(
      validateQpgContribution(
        validContribution({ source: 'ঢাকা বোর্ড ২০২৪, ইংরেজি ১ম পত্র, প্রশ্ন ৩' }),
      ),
    ).toEqual([]);
  });

  it('requires an explanation', () => {
    expect(validateQpgContribution(validContribution({ explanation: '' })).length).toBeGreaterThan(0);
  });
});

describe('duplicate detection (normalized text)', () => {
  it('matches exact, case-insensitive and punctuation-insensitive text', () => {
    const pool = [{ id: 'q1', questionText: 'What is the capital of Bangladesh?' }];
    expect(findPossibleDuplicates('what is the capital of bangladesh?', pool)).toHaveLength(1);
    expect(findPossibleDuplicates('What is the capital of Bangladesh', pool)).toHaveLength(1);
    expect(findPossibleDuplicates('What is the capital of India?', pool)).toHaveLength(0);
  });

  it('folds Bangla digits and catches containment', () => {
    const pool = [{ id: 'q1', questionText: '৩ + ৪ = কত?' }];
    expect(findPossibleDuplicates('3 + 4 = কত?', pool)).toHaveLength(1);
    const pool2 = [{ id: 'q2', questionText: 'The quick brown fox jumps over the lazy dog today.' }];
    expect(findPossibleDuplicates('The quick brown fox jumps over the lazy dog', pool2)).toHaveLength(1);
  });

  it('normalizes whitespace and punctuation', () => {
    expect(normalizeQuestionText('  Hello,   World!  ')).toBe('hello world');
  });
});

describe('points / coupons / levels (PROPOSALS — owner confirms)', () => {
  it('uses the spec proposal values as named constants', () => {
    expect(QPG_CONTRIBUTION_POINTS_PER_APPROVAL).toBe(10);
    expect(QPG_CONTRIBUTOR_ACTIVE_POINTS).toBe(50);
    expect(QPG_CONTRIBUTION_COUPON_BDT).toBe(10);
    expect(QPG_CONTRIBUTION_COUPON_MAX_PER_ORDER).toBe(3);
    expect(QPG_CONTRIBUTION_COUPON_VALID_DAYS).toBe(30);
  });

  it('levels: নবীন below 50 points, সক্রিয় at 50', () => {
    expect(contributorLevelFor(0)).toBe('নবীন');
    expect(contributorLevelFor(49)).toBe('নবীন');
    expect(contributorLevelFor(50)).toBe('সক্রিয়');
  });

  it('approval awards 10 points + a coupon valid 30 days', () => {
    const now = new Date('2026-11-25T10:00:00Z');
    const outcome = contributionApprovalFor({ approved: 4, points: 40 }, now);
    expect(outcome.pointsAwarded).toBe(10);
    expect(outcome.newStats).toEqual({ approved: 5, points: 50, level: 'সক্রিয়' });
    expect(outcome.couponCode).toMatch(/^EDU-[A-Z2-9]{12}$/);
    expect(outcome.couponExpiresAt).toBe(new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString());
  });

  it('coupon codes are random and not guessable', () => {
    const codes = new Set(Array.from({ length: 20 }, () => generateCouponCode()));
    expect(codes.size).toBe(20);
  });
});

describe('leaderboard', () => {
  it('sorts by points desc, then approved desc, top 20', () => {
    const stats = Array.from({ length: 25 }, (_, i) => ({
      uid: `u${i}`,
      displayName: `T${i}`,
      institution: 'X',
      totalSubmitted: i,
      approved: i,
      rejected: 0,
      points: i * 10,
      level: 'নবীন' as const,
      updatedAt: '',
    }));
    const top = topContributors(stats);
    expect(top).toHaveLength(20);
    expect(top[0].points).toBe(240);
    expect(top[19].points).toBe(50);
  });
});
