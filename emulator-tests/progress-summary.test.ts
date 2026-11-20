// Eduvelto — unit tests for the Step 3 monthly-summary computation.
//
// Pure function only (computeMonthlySummaries) — no emulator, no network.
// Run with the rules suite: npm run test:rules
// (vitest run emulator-tests/ picks up every *.test.ts in this folder).
//
// This is the plan Step 3 test in code form: take a quiz twice with
// different scores and confirm the monthly summary updates and the
// weak-chapter list changes.

import { describe, expect, it } from 'vitest';
import { computeMonthlySummaries, WEAK_THRESHOLD } from '../src/lib/progress';

const NOW = new Date('2026-11-21T10:00:00+06:00');

describe('computeMonthlySummaries', () => {
  it('two attempts, different scores: attempts/average/best update', () => {
    const out = computeMonthlySummaries(
      [
        { quizId: 'q-english', subject: 'English', percentage: 40, createdAt: new Date('2026-11-05T09:00:00+06:00'), answers: [] },
        { quizId: 'q-english', subject: 'English', percentage: 80, createdAt: new Date('2026-11-19T09:00:00+06:00'), answers: [] },
      ],
      NOW,
    );
    expect(out).toHaveLength(1);
    expect(out[0].subject).toBe('English');
    expect(out[0].month).toBe('2026-11');
    expect(out[0].attemptsCount).toBe(2);
    expect(out[0].averagePercentage).toBe(60);
    expect(out[0].bestPercentage).toBe(80);
  });

  it('weak list changes when a second attempt lifts a topic over 60%', () => {
    const first = computeMonthlySummaries(
      [
        {
          quizId: 'q-english',
          subject: 'English',
          percentage: 33,
          createdAt: new Date('2026-11-05T09:00:00+06:00'),
          answers: [
            { topic: 'Shakespeare', correct: false },
            { topic: 'Shakespeare', correct: false },
            { topic: 'Marlowe', correct: true },
          ],
        },
      ],
      NOW,
    );
    expect(first[0].weakChapters).toEqual(['Shakespeare']);
    expect(first[0].strongChapters).toEqual(['Marlowe']);

    const both = computeMonthlySummaries(
      [
        {
          quizId: 'q-english',
          subject: 'English',
          percentage: 33,
          createdAt: new Date('2026-11-05T09:00:00+06:00'),
          answers: [
            { topic: 'Shakespeare', correct: false },
            { topic: 'Shakespeare', correct: false },
            { topic: 'Marlowe', correct: true },
          ],
        },
        {
          quizId: 'q-english',
          subject: 'English',
          percentage: 100,
          createdAt: new Date('2026-11-19T09:00:00+06:00'),
          answers: [
            { topic: 'Shakespeare', correct: true },
            { topic: 'Shakespeare', correct: true },
            { topic: 'Shakespeare', correct: true },
            { topic: 'Marlowe', correct: true },
          ],
        },
      ],
      NOW,
    );
    // Shakespeare is now 3/5 = 60% — at the threshold, so strong.
    expect(both[0].weakChapters).toEqual([]);
    expect(both[0].strongChapters).toEqual(['Marlowe', 'Shakespeare']);
    expect(both[0].attemptsCount).toBe(2);
    expect(WEAK_THRESHOLD).toBe(60);
  });

  it('different months become separate summaries; unattributed attempts are skipped', () => {
    const out = computeMonthlySummaries(
      [
        { quizId: 'q-english', subject: 'English', percentage: 50, createdAt: new Date('2026-10-10T09:00:00+06:00'), answers: [] },
        { quizId: 'q-english', subject: 'English', percentage: 90, createdAt: new Date('2026-11-10T09:00:00+06:00'), answers: [] },
        { quizId: 'q-unknown', percentage: 100, createdAt: new Date('2026-11-10T09:00:00+06:00'), answers: [] },
      ],
      NOW,
    );
    expect(out).toHaveLength(2);
    expect(out.map((s) => s.month).sort()).toEqual(['2026-10', '2026-11']);
    expect(out.find((s) => s.month === '2026-10')?.attemptsCount).toBe(1);
    expect(out.find((s) => s.month === '2026-11')?.attemptsCount).toBe(1);
  });
});
