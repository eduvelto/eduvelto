// National Live Exam hub — pure logic tests (no Firestore).
// The Firestore paths (1-doc bundle read, receipt-gated key
// read) are the already-tested jobPractice loaders; here the
// sessionStorage cache path is tested with a stubbed store,
// and the pre-submit key refusal is tested without any read.
import { afterEach, describe, expect, it } from 'vitest';
import {
  NATIONAL_LIVE_EXAM_SCHEDULE,
  buildNationalLiveExamList,
  canEnterLiveExam,
  clearLiveExamBundleCache,
  clearLiveExamBundleMemoryCache,
  countdownParts,
  dhakaDayWindowMillis,
  formatLiveExamCountdown,
  formatLiveExamInstant,
  jobLiveExamEntryPath,
  liveExamBundleCacheKey,
  loadLiveExamBundle,
  loadLiveExamKeyAfterSubmit,
  nationalLiveExamFromConfig,
  nationalLiveExamFromMock,
  nationalLiveExamStatus,
  readLiveExamBundleCache,
  validateLiveExamBundle,
  validateNationalLiveExamConfig,
  writeLiveExamBundleCache,
  type NationalLiveExam,
  type NationalLiveExamConfig,
} from '../liveExam';
import type { JobMockWithId } from '../jobMocks';

function mockDoc(overrides: Partial<JobMockWithId> = {}): JobMockWithId {
  return {
    docId: 'daily__2026-11-26',
    examSlug: 'bcs',
    titleBn: 'দৈনিক মক — ২৬ নভেম্বর',
    titleEn: 'Daily mock — 26 November',
    kind: 'daily',
    bundleId: 'daily__2026-11-26',
    questionSetId: 'daily__2026-11-26_v1',
    rulesSnapshot: {
      questionCount: 30,
      timeMinutes: 30,
      marksPerQuestion: 1,
      negativeMarking: 0.25,
      negativeMarkingVerified: true,
      passPercent: null,
      scoringConfigVersion: 'v1',
    },
    scheduleDate: '2026-11-26',
    examSlugCycle: null,
    status: 'published',
    retakeAllowed: true,
    maxAttempts: null,
    publishedAt: null,
    publishedBy: null,
    createdAt: null,
    updatedAt: null,
    ...overrides,
  };
}

function validConfig(overrides: Partial<NationalLiveExamConfig> = {}): NationalLiveExamConfig {
  return {
    id: 'national-bcs-2026-12-05',
    titleBn: 'জাতীয় লাইভ পরীক্ষা — বিসিএস',
    titleEn: 'National Live Exam — BCS',
    category: 'job',
    startAtDhakaISO: '2026-12-05T10:00:00+06:00',
    endAtDhakaISO: '2026-12-05T12:00:00+06:00',
    entryPath: '/jobs/live-exam/bcs',
    bundleId: 'mock__full__bcs__1',
    jobExamSlug: 'bcs',
    ...overrides,
  };
}

function examWithWindow(startAtMillis: number, endAtMillis: number): NationalLiveExam {
  return {
    id: 'x',
    titleBn: 'পরীক্ষা',
    titleEn: 'Exam',
    category: 'job',
    track: 'job',
    window: { startAtMillis, endAtMillis },
    entryPath: '/jobs/mock/x',
    jobExamSlug: 'bcs',
    bundleId: 'mock__x',
    meritExamId: 'x',
    source: 'scheduled-config',
  };
}

function stubSessionStorage(): Map<string, string> {
  const store = new Map<string, string>();
  const fake = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => {
      store.set(k, v);
    },
    removeItem: (k: string) => {
      store.delete(k);
    },
    clear: () => store.clear(),
    key: (i: number) => [...store.keys()][i] ?? null,
    get length() {
      return store.size;
    },
  };
  Object.defineProperty(globalThis, 'sessionStorage', { value: fake, configurable: true });
  return store;
}

afterEach(() => {
  clearLiveExamBundleMemoryCache();
  try {
    delete (globalThis as Record<string, unknown>).sessionStorage;
  } catch {
    // No stub installed — nothing to remove.
  }
});

describe('dhakaDayWindowMillis', () => {
  it('is the whole Dhaka day for a valid scheduleDate', () => {
    const w = dhakaDayWindowMillis('2026-11-26')!;
    expect(w.startAtMillis).toBe(Date.parse('2026-11-26T00:00:00.000+06:00'));
    expect(w.endAtMillis).toBe(Date.parse('2026-11-26T23:59:59.999+06:00'));
  });

  it('rejects malformed and impossible dates instead of guessing a day', () => {
    expect(dhakaDayWindowMillis('26-11-2026')).toBeNull();
    expect(dhakaDayWindowMillis('2026-02-30')).toBeNull();
    expect(dhakaDayWindowMillis('')).toBeNull();
  });
});

describe('nationalLiveExamStatus', () => {
  const w = { startAtMillis: 1_000, endAtMillis: 2_000 };
  it('upcoming before the window, live inside it (ends inclusive), ended after', () => {
    expect(nationalLiveExamStatus(w, 999)).toBe('upcoming');
    expect(nationalLiveExamStatus(w, 1_000)).toBe('live');
    expect(nationalLiveExamStatus(w, 2_000)).toBe('live');
    expect(nationalLiveExamStatus(w, 2_001)).toBe('ended');
  });
});

describe('countdown', () => {
  it('splits 90061 seconds into 1d 1h 1m 1s and clamps the past to zero', () => {
    const parts = countdownParts(90_061_000, 0);
    expect(parts).toMatchObject({ days: 1, hours: 1, minutes: 1, seconds: 1, expired: false });
    expect(countdownParts(0, 1_000)).toMatchObject({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      expired: true,
    });
  });

  it('formats Bangla digits with leading zeros and English plain', () => {
    const parts = countdownParts(2 * 86_400_000 + 4 * 3_600_000 + 12 * 60_000 + 33_000, 0);
    expect(formatLiveExamCountdown(parts, 'bn')).toBe('২ দিন ০৪:১২:৩৩');
    expect(formatLiveExamCountdown(parts, 'en')).toBe('2d 04:12:33');
    expect(formatLiveExamCountdown(countdownParts(61_000, 0), 'bn')).toBe('০০:০১:০১');
  });

  it('formats an instant in Dhaka time', () => {
    const text = formatLiveExamInstant(Date.parse('2026-11-26T10:00:00+06:00'), 'en');
    expect(text).toContain('26');
    expect(text).toContain('2026');
  });
});

describe('canEnterLiveExam — strict window + login', () => {
  const exam = examWithWindow(1_000, 2_000);
  it('needs login first, then the window', () => {
    expect(canEnterLiveExam(exam, 1_500, false)).toEqual({ allowed: false, reason: 'login-required' });
    expect(canEnterLiveExam(exam, 500, true)).toEqual({ allowed: false, reason: 'not-started' });
    expect(canEnterLiveExam(exam, 1_500, true)).toEqual({ allowed: true, reason: 'ok' });
    expect(canEnterLiveExam(exam, 2_001, true)).toEqual({ allowed: false, reason: 'ended' });
  });
});

describe('nationalLiveExamFromMock — derived schedule only', () => {
  it('turns a dated daily mock into a Job live exam on its Dhaka day', () => {
    const exam = nationalLiveExamFromMock(mockDoc())!;
    expect(exam.id).toBe('daily__2026-11-26');
    expect(exam.category).toBe('job');
    expect(exam.entryPath).toBe('/jobs/mock/daily__2026-11-26');
    expect(exam.bundleId).toBe('daily__2026-11-26');
    expect(exam.meritExamId).toBe('daily__2026-11-26');
    expect(exam.source).toBe('published-mock');
    expect(exam.window.startAtMillis).toBe(Date.parse('2026-11-26T00:00:00.000+06:00'));
  });

  it('never schedules a full mock (on-demand — no scheduleDate)', () => {
    expect(nationalLiveExamFromMock(mockDoc({ kind: 'full', scheduleDate: null, docId: 'full__bcs__1' }))).toBeNull();
    expect(nationalLiveExamFromMock(mockDoc({ scheduleDate: null }))).toBeNull();
    expect(nationalLiveExamFromMock(mockDoc({ scheduleDate: '2026-02-30' }))).toBeNull();
  });

  it('deep-links to the existing Job live-exam track', () => {
    expect(jobLiveExamEntryPath('bcs')).toBe('/jobs/live-exam/bcs');
  });
});

describe('owner-announced config — validated, never guessed', () => {
  it('ships empty: no national date is invented', () => {
    expect(NATIONAL_LIVE_EXAM_SCHEDULE).toEqual([]);
  });

  it('accepts a well-formed Dhaka-window config', () => {
    expect(validateNationalLiveExamConfig(validConfig())).toEqual([]);
    const exam = nationalLiveExamFromConfig(validConfig())!;
    expect(exam.window.startAtMillis).toBe(Date.parse('2026-12-05T10:00:00+06:00'));
    expect(exam.window.endAtMillis).toBe(Date.parse('2026-12-05T12:00:00+06:00'));
    expect(exam.source).toBe('scheduled-config');
  });

  it('rejects a missing offset, an inverted window, a bad category and an unknown exam', () => {
    expect(validateNationalLiveExamConfig(validConfig({ startAtDhakaISO: '2026-12-05T10:00:00' })).length).toBeGreaterThan(0);
    expect(
      validateNationalLiveExamConfig(
        validConfig({ startAtDhakaISO: '2026-12-05T12:00:00+06:00', endAtDhakaISO: '2026-12-05T10:00:00+06:00' }),
      ).length,
    ).toBeGreaterThan(0);
    expect(
      validateNationalLiveExamConfig(validConfig({ category: 'other' as never })).length,
    ).toBeGreaterThan(0);
    expect(validateNationalLiveExamConfig(validConfig({ jobExamSlug: 'not-an-exam' })).length).toBeGreaterThan(0);
    expect(validateNationalLiveExamConfig(validConfig({ entryPath: 'jobs/mock/x' })).length).toBeGreaterThan(0);
    expect(nationalLiveExamFromConfig(validConfig({ jobExamSlug: 'not-an-exam' }))).toBeNull();
  });
});

describe('buildNationalLiveExamList', () => {
  it('merges derived + configured exams, earliest first, dropping invalid ones', () => {
    const list = buildNationalLiveExamList({
      mocks: [
        mockDoc({ docId: 'weekly__2026-W48', kind: 'weekly', scheduleDate: '2026-11-30', bundleId: 'weekly__2026-W48' }),
        mockDoc(),
        mockDoc({ kind: 'full', scheduleDate: null, docId: 'full__bcs__1' }),
      ],
      configs: [validConfig(), validConfig({ id: 'bad', jobExamSlug: 'not-an-exam' })],
    });
    expect(list.map((e) => e.id)).toEqual([
      'daily__2026-11-26',
      'weekly__2026-W48',
      'national-bcs-2026-12-05',
    ]);
  });
});

describe('single compressed bundle — validation + session cache', () => {
  const bundle = {
    docId: 'mock__full__bcs__1',
    kind: 'mock',
    examSlug: 'bcs',
    titleBn: 'বিসিএস মক ১',
    titleEn: 'BCS mock 1',
    status: 'published',
    reviewStatus: 'approved',
    bundleVersion: 1,
    questionCount: 1,
    sourceQuestionIds: ['q1'],
    questions: [
      {
        n: 1,
        questionId: 'q1',
        topicId: 't1',
        subjectId: 's1',
        questionText: 'বাংলাদেশের রাজধানী কোনটি?',
        options: [
          { letter: 'A', text: 'ঢাকা' },
          { letter: 'B', text: 'চট্টগ্রাম' },
        ],
        difficulty: 'easy',
      },
    ],
  };

  it('accepts a questions-only bundle', () => {
    expect(validateLiveExamBundle(bundle)).toEqual([]);
  });

  it('refuses any key material, in the doc or inside a question', () => {
    expect(validateLiveExamBundle({ ...bundle, correctLetter: 'A' }).length).toBeGreaterThan(0);
    expect(
      validateLiveExamBundle({
        ...bundle,
        questions: [{ ...bundle.questions[0], correctLetter: 'A' }],
      }).length,
    ).toBeGreaterThan(0);
    expect(
      validateLiveExamBundle({
        ...bundle,
        questions: [{ ...bundle.questions[0], explanation: 'কারণ…' }],
      }).length,
    ).toBeGreaterThan(0);
  });

  it('refuses a count mismatch and an empty question list', () => {
    expect(validateLiveExamBundle({ ...bundle, questionCount: 2 }).length).toBeGreaterThan(0);
    expect(validateLiveExamBundle({ ...bundle, questions: [], questionCount: 0 }).length).toBeGreaterThan(0);
    expect(validateLiveExamBundle(null).length).toBeGreaterThan(0);
  });

  it('caches the bundle in sessionStorage and reads it back without Firestore', async () => {
    stubSessionStorage();
    expect(liveExamBundleCacheKey('mock__x')).toBe('eduvelto:live-exam-bundle:v1:mock__x');
    writeLiveExamBundleCache('mock__full__bcs__1', bundle as never);
    expect(readLiveExamBundleCache('mock__full__bcs__1')?.docId).toBe('mock__full__bcs__1');
    const loaded = await loadLiveExamBundle('mock__full__bcs__1');
    expect(loaded?.docId).toBe('mock__full__bcs__1');
    // A second call reuses the in-memory promise — still no Firestore.
    expect((await loadLiveExamBundle('mock__full__bcs__1'))?.docId).toBe('mock__full__bcs__1');
    clearLiveExamBundleCache('mock__full__bcs__1');
    expect(readLiveExamBundleCache('mock__full__bcs__1')).toBeNull();
  });

  it('treats corrupt cache bytes as a miss, never a crash', () => {
    const store = stubSessionStorage();
    store.set(liveExamBundleCacheKey('mock__x'), '{not json');
    expect(readLiveExamBundleCache('mock__x')).toBeNull();
  });

  it('works with no sessionStorage at all (private mode)', () => {
    expect(readLiveExamBundleCache('mock__x')).toBeNull();
    expect(() => writeLiveExamBundleCache('mock__x', bundle as never)).not.toThrow();
    expect(() => clearLiveExamBundleCache('mock__x')).not.toThrow();
  });

  it('refuses the answer key before submit — loudly, without any read', async () => {
    await expect(loadLiveExamKeyAfterSubmit('mock__full__bcs__1', false)).rejects.toThrow(
      /only after submit/,
    );
  });
});
