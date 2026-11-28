// Eduvelto — Free Quiz + certificate tests (owner order 28 Nov
// 2026). Pins: the four verified pools and their sizes, 10 unique
// questions per attempt, explanations present on every pooled
// question, verification-ID format, and the self-contained verify
// payload round-trip + its invalid cases.
import { describe, it, expect } from 'vitest';
import {
  FREE_QUIZ_ALL_QUESTIONS,
  FREE_QUIZ_CATEGORIES,
  FREE_QUIZ_COUNT,
  FREE_QUIZ_POOLS,
  buildVerifyUrl,
  decodeCertificatePayload,
  encodeCertificatePayload,
  makeVerificationId,
  selectFreeQuizQuestions,
  type CertificatePayload,
} from '../freeQuiz';

describe('free quiz pools — only verified questions', () => {
  it('covers all four requested categories with the verified counts', () => {
    expect(FREE_QUIZ_POOLS.gk).toHaveLength(89);
    expect(FREE_QUIZ_POOLS.bcs).toHaveLength(35);
    expect(FREE_QUIZ_POOLS.english).toHaveLength(95);
    expect(FREE_QUIZ_POOLS.islamic).toHaveLength(90);
    expect(FREE_QUIZ_ALL_QUESTIONS).toHaveLength(309);
    expect(FREE_QUIZ_CATEGORIES.map((c) => c.id)).toEqual([
      'gk',
      'bcs',
      'english',
      'islamic',
    ]);
  });

  it('every pooled question has a unique id, 4 options, one correct letter and an explanation', () => {
    const ids = new Set(FREE_QUIZ_ALL_QUESTIONS.map((q) => q.id));
    expect(ids.size).toBe(309);
    for (const q of FREE_QUIZ_ALL_QUESTIONS) {
      expect(q.questionText.trim().length).toBeGreaterThan(0);
      expect(q.options).toHaveLength(4);
      expect(new Set(q.options.map((o) => o.text)).size).toBe(4);
      expect(['A', 'B', 'C', 'D']).toContain(q.correctLetter);
      expect(q.explanation.trim().length).toBeGreaterThan(0);
    }
  });

  it('the 3 BCS reading questions carry their passage', () => {
    const reading = FREE_QUIZ_POOLS.bcs.filter((q) => q.passage);
    expect(reading).toHaveLength(3);
    for (const q of reading) {
      expect(q.passage).toContain('Rahim is a school teacher');
    }
  });
});

describe('selectFreeQuizQuestions', () => {
  it('returns 10 unique questions per attempt', () => {
    for (const sel of ['all', 'gk', 'bcs', 'english', 'islamic'] as const) {
      const qs = selectFreeQuizQuestions(sel);
      expect(qs).toHaveLength(FREE_QUIZ_COUNT);
      expect(new Set(qs.map((q) => q.id)).size).toBe(FREE_QUIZ_COUNT);
    }
  });

  it('two attempts with different seeds differ', () => {
    let seed = 12345;
    const rand = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };
    const a = selectFreeQuizQuestions('all', 10, rand);
    const b = selectFreeQuizQuestions('all', 10, rand);
    expect(a.map((q) => q.id).join(',')).not.toBe(b.map((q) => q.id).join(','));
  });

  it('throws for a pool smaller than 10', () => {
    expect(() => selectFreeQuizQuestions('bcs', 36)).toThrow();
  });
});

describe('verification id + payload', () => {
  it('makes EDU-2026-XXXX ids', () => {
    for (let i = 0; i < 20; i++) {
      expect(makeVerificationId()).toMatch(/^EDU-2026-\d{4}$/);
    }
  });

  const payload: CertificatePayload = {
    v: 1,
    id: 'EDU-2026-4821',
    n: 'রহিম উদ্দিন',
    q: 'Free Quiz — English',
    s: 8,
    d: '2026-11-28',
  };

  it('round-trips a Bangla name through the URL payload', () => {
    const raw = encodeCertificatePayload(payload);
    expect(raw).not.toContain('+');
    expect(raw).not.toContain('/');
    expect(decodeCertificatePayload(raw, 'EDU-2026-4821')).toEqual(payload);
  });

  it('builds a verify URL that decodes back to the same certificate', () => {
    const url = buildVerifyUrl(payload);
    expect(url).toBe(
      `https://eduvelto.com/verify/EDU-2026-4821?d=${encodeCertificatePayload(payload)}`,
    );
    const parsed = new URL(url);
    expect(
      decodeCertificatePayload(
        parsed.searchParams.get('d'),
        parsed.pathname.split('/').pop() ?? '',
      ),
    ).toEqual(payload);
  });

  it('rejects missing, malformed, mismatched and tampered payloads', () => {
    expect(decodeCertificatePayload(null, 'EDU-2026-4821')).toBeNull();
    expect(decodeCertificatePayload('!!!not-base64!!!', 'EDU-2026-4821')).toBeNull();
    expect(
      decodeCertificatePayload(encodeCertificatePayload(payload), 'EDU-2026-9999'),
    ).toBeNull();
    expect(
      decodeCertificatePayload(encodeCertificatePayload(payload), 'EDU-2026-8492'),
    ).toBeNull();
    expect(
      decodeCertificatePayload(encodeCertificatePayload({ ...payload, s: 11 }), payload.id),
    ).toBeNull();
    expect(
      decodeCertificatePayload(encodeCertificatePayload({ ...payload, n: '' }), payload.id),
    ).toBeNull();
    expect(decodeCertificatePayload(encodeCertificatePayload(payload), 'bad-id')).toBeNull();
  });

  it('round-trips a no-score payload (Certificate Maker: no score)', () => {
    const noScore: CertificatePayload = {
      v: 1,
      id: 'EDU-2026-4821',
      n: 'রহিম উদ্দিন',
      q: 'English Spoken Course',
      d: '2026-11-28',
    };
    const raw = encodeCertificatePayload(noScore);
    const decoded = decodeCertificatePayload(raw, 'EDU-2026-4821');
    expect(decoded).toEqual(noScore);
    expect(decoded?.s).toBeUndefined();
    const url = buildVerifyUrl(noScore);
    const parsed = new URL(url);
    expect(
      decodeCertificatePayload(
        parsed.searchParams.get('d'),
        parsed.pathname.split('/').pop() ?? '',
      ),
    ).toEqual(noScore);
  });

  it('rejects a present-but-invalid score while accepting its absence', () => {
    const base: CertificatePayload = {
      v: 1,
      id: 'EDU-2026-4821',
      n: 'রহিম উদ্দিন',
      q: 'English Spoken Course',
      d: '2026-11-28',
    };
    // Non-integer, negative and out-of-range scores are still rejected.
    expect(
      decodeCertificatePayload(
        encodeCertificatePayload({ ...base, s: 8.5 }),
        base.id,
      ),
    ).toBeNull();
    expect(
      decodeCertificatePayload(
        encodeCertificatePayload({ ...base, s: -1 }),
        base.id,
      ),
    ).toBeNull();
    expect(
      decodeCertificatePayload(
        encodeCertificatePayload({ ...base, s: '8' as unknown as number }),
        base.id,
      ),
    ).toBeNull();
    // A valid score still decodes exactly as before.
    expect(
      decodeCertificatePayload(
        encodeCertificatePayload({ ...base, s: 0 }),
        base.id,
      ),
    ).toEqual({ ...base, s: 0 });
  });
});
