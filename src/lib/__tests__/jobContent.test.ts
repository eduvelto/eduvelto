/**
 * Eduvelto Job Preparation — Step 6 unit tests (Subject / Chapter /
 * Topic / Lesson system — LIBRARY + SEED, 22 Nov 2026).
 *
 * Covers:
 *  (1) subjects per exam — counts 10/5/4/4, marks sums 200/100/90/100,
 *      order 1..N, unique slugs, doc IDs well-formed, exact names
 *      cross-checked against the verified rulesConfig (the lib
 *      derives from it, so this pins the derivation);
 *  (2) jobSubjectById — found, not-found, wrong-exam, malformed;
 *  (3) jobSubjectSyllabusReady — true for the 4 verified exams,
 *      false for it-professional, the 9 other null-config exams and
 *      unknown slugs;
 *  (4) review-state helpers — every enum value incl. rejects
 *      ('Published' is not a draft state; literal 'draft', empty and
 *      missing are not review states at all);
 *  (5) taxonomy validation — the canonical taxonomy passes; tampered
 *      taxonomies fail (subject under it-professional, subject under
 *      a null-config exam, duplicate slug, marks sum wrong, order
 *      gap, missing syllabusSource, empty name, unknown exam);
 *  (6) lesson types — only 'lesson' creatable in Step 6;
 *  (7) the Firestore seed (team/job-content-seed.json) — 23 subject
 *      docs deep-matched against JOB_SUBJECTS (seed and code cannot
 *      drift apart), all draft / Not Started, no chapters / topics /
 *      lessons, every marks value matching the rulesConfig source,
 *      every doc stamped with the config version (P2-02).
 *
 * Runs under plain node: `npm run test:unit`.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  JOB_RULES_CONFIGS,
  JOB_EXAMS,
  jobRulesConfig,
} from '../jobExams';
import {
  JOB_SUBJECTS,
  JOB_CONTENT_COLLECTIONS,
  JOB_CONTENT_CONFIG_VERSION,
  JOB_CONTENT_REVIEW_STATES,
  JOB_STEP6_LESSON_TYPES,
  jobSubjectsForExam,
  jobSubjectById,
  jobSubjectId,
  jobSubjectSyllabusReady,
  isJobContentReviewState,
  isDraftJobContentReviewState,
  validateJobContentTaxonomy,
  validateJobContentTaxonomyAgainst,
  type JobSubjectDef,
} from '../jobContent';

const SEED_PATH = fileURLToPath(
  new URL('../../../team/job-content-seed.json', import.meta.url),
);
const SEED = JSON.parse(readFileSync(SEED_PATH, 'utf8')) as {
  _meta: Record<string, string>;
  jobSubjects: Record<string, Record<string, unknown>>;
  jobChapters: unknown[];
  jobTopics: unknown[];
  jobLessons: unknown[];
};

function cloneSubjects(): Record<string, JobSubjectDef[]> {
  return JSON.parse(JSON.stringify(JOB_SUBJECTS)) as Record<string, JobSubjectDef[]>;
}

describe('subjects per exam (Step 6 — derived from verified rulesConfig)', () => {
  it('has exactly the 4 verified exams, counts 10/5/4/4', () => {
    expect(Object.keys(JOB_SUBJECTS).sort()).toEqual([
      'bank',
      'bcs',
      'ntrca',
      'primary-teacher',
    ]);
    expect(JOB_SUBJECTS.bcs).toHaveLength(10);
    expect(JOB_SUBJECTS.bank).toHaveLength(5);
    expect(JOB_SUBJECTS['primary-teacher']).toHaveLength(4);
    expect(JOB_SUBJECTS.ntrca).toHaveLength(4);
  });

  it('marks sum to each exam questionCount (200/100/90/100)', () => {
    for (const [examSlug, list] of Object.entries(JOB_SUBJECTS)) {
      const sum = list.reduce((a, s) => a + (s.marks ?? 0), 0);
      expect(sum).toBe(JOB_RULES_CONFIGS[examSlug].questionCount);
    }
  });

  it('orders are 1..N contiguous and slugs unique within each exam', () => {
    for (const list of Object.values(JOB_SUBJECTS)) {
      expect(list.map((s) => s.order)).toEqual(
        Array.from({ length: list.length }, (_, i) => i + 1),
      );
      expect(new Set(list.map((s) => s.slug)).size).toBe(list.length);
    }
  });

  it('names and marks match the verified rulesConfig subject lists verbatim', () => {
    for (const [examSlug, list] of Object.entries(JOB_SUBJECTS)) {
      const config = JOB_RULES_CONFIGS[examSlug];
      expect(list.map((s) => s.nameBn)).toEqual(config.subjects.map((r) => r.nameBn));
      expect(list.map((s) => s.nameEn)).toEqual(config.subjects.map((r) => r.nameEn));
      expect(list.map((s) => s.marks)).toEqual(config.subjects.map((r) => r.marks));
      expect(list.every((s) => s.syllabusSource === config.patternSource)).toBe(true);
    }
  });

  it('BCS subject slugs and marks are exactly the canonical list', () => {
    expect(JOB_SUBJECTS.bcs.map((s) => [s.slug, s.marks])).toEqual([
      ['bangla', 35],
      ['english', 35],
      ['bangladesh-affairs', 30],
      ['international-affairs', 20],
      ['geography', 10],
      ['general-science', 15],
      ['computer-ict', 15],
      ['mathematical-reasoning', 15],
      ['mental-ability', 15],
      ['ethics', 10],
    ]);
  });

  it('Bank / Primary / NTRCA subject slugs and marks are exactly the canonical lists', () => {
    expect(JOB_SUBJECTS.bank.map((s) => [s.slug, s.marks])).toEqual([
      ['bangla', 25],
      ['english', 25],
      ['math', 20],
      ['general-knowledge', 20],
      ['computer', 10],
    ]);
    expect(JOB_SUBJECTS['primary-teacher'].map((s) => [s.slug, s.marks])).toEqual([
      ['bangla', 25],
      ['english', 25],
      ['math-science', 20],
      ['general-knowledge', 20],
    ]);
    expect(JOB_SUBJECTS.ntrca.map((s) => [s.slug, s.marks])).toEqual([
      ['bangla', 25],
      ['english', 25],
      ['math', 25],
      ['general-knowledge', 25],
    ]);
  });

  it('doc IDs are well-formed {examSlug}__{subjectSlug}', () => {
    for (const [examSlug, list] of Object.entries(JOB_SUBJECTS)) {
      for (const s of list) {
        expect(jobSubjectId(examSlug, s.slug)).toBe(`${examSlug}__${s.slug}`);
        expect(s.examSlug).toBe(examSlug);
      }
    }
  });

  it('jobSubjectsForExam returns a copy and [] (never throws) for exams with no subjects', () => {
    expect(jobSubjectsForExam('bcs')).toHaveLength(10);
    expect(jobSubjectsForExam('it-professional')).toEqual([]);
    expect(jobSubjectsForExam('dgfood')).toEqual([]);
    expect(jobSubjectsForExam('no-such-exam')).toEqual([]);
    const first = jobSubjectsForExam('bcs');
    first.push({ slug: 'x', examSlug: 'bcs', nameBn: 'x', nameEn: 'x', marks: 1, order: 99, syllabusSource: null });
    expect(jobSubjectsForExam('bcs')).toHaveLength(10);
  });
});

describe('jobSubjectById', () => {
  it('finds a subject by its doc ID', () => {
    const s = jobSubjectById('bcs__ethics');
    expect(s).toMatchObject({
      slug: 'ethics',
      examSlug: 'bcs',
      nameBn: 'নৈতিকতা, মূল্যবোধ ও সুশাসন',
      nameEn: 'Ethics, Values & Good Governance',
      marks: 10,
      order: 10,
      syllabusSource: 'BPSC বিজ্ঞপ্তি',
    });
    expect(jobSubjectById('ntrca__math')).toMatchObject({
      slug: 'math',
      examSlug: 'ntrca',
      marks: 25,
    });
  });

  it('returns null for not-found, wrong-exam and malformed IDs', () => {
    expect(jobSubjectById('bcs__no-such-subject')).toBeNull();
    // Ethics is a BCS subject, not a Bank one.
    expect(jobSubjectById('bank__ethics')).toBeNull();
    // No subjects under it-professional or a null-config exam.
    expect(jobSubjectById('it-professional__bangla')).toBeNull();
    expect(jobSubjectById('dgfood__bangla')).toBeNull();
    expect(jobSubjectById('bcs')).toBeNull();
    expect(jobSubjectById('')).toBeNull();
    expect(jobSubjectById('__bangla')).toBeNull();
    expect(jobSubjectById('bcs__')).toBeNull();
    expect(jobSubjectById('bcs__bangla__extra')).toBeNull();
  });
});

describe('jobSubjectSyllabusReady (Step 6 guard)', () => {
  it('is true only for the 4 verified exams', () => {
    for (const slug of ['bcs', 'bank', 'primary-teacher', 'ntrca']) {
      expect(jobSubjectSyllabusReady(slug)).toBe(true);
    }
  });

  it('is false for it-professional (scope_pending, 13.8)', () => {
    expect(jobSubjectSyllabusReady('it-professional')).toBe(false);
  });

  it('is false for the 9 other null-config exams and unknown slugs', () => {
    for (const slug of [
      'dgfood',
      'bpsc-non-cadre',
      'cag',
      'bfsa',
      'others',
      'ministries',
      'defence',
      'autonomous',
      'private-ngo',
    ]) {
      expect(jobRulesConfig(slug)).toBeNull();
      expect(jobSubjectSyllabusReady(slug)).toBe(false);
    }
    expect(jobSubjectSyllabusReady('no-such-exam')).toBe(false);
    expect(jobSubjectSyllabusReady('')).toBe(false);
  });

  it('covers all 14 hubs: exactly 4 ready, 10 not', () => {
    const ready = JOB_EXAMS.map((e) => e.slug).filter((s) => jobSubjectSyllabusReady(s));
    expect(ready.sort()).toEqual(['bank', 'bcs', 'ntrca', 'primary-teacher']);
  });
});

describe('review-state helpers (Step 5 P1-1, shared enum)', () => {
  it('JOB_CONTENT_REVIEW_STATES is the 4 states, 3 of them draft', () => {
    expect([...JOB_CONTENT_REVIEW_STATES]).toEqual([
      'Not Started',
      'In Progress',
      'Under Review',
      'Published',
    ]);
  });

  it('isJobContentReviewState accepts every enum value', () => {
    for (const s of JOB_CONTENT_REVIEW_STATES) {
      expect(isJobContentReviewState(s)).toBe(true);
    }
  });

  it('isJobContentReviewState rejects non-states', () => {
    for (const s of ['draft', 'Draft', 'published', '', '  ', null, undefined, 0, {}, []]) {
      expect(isJobContentReviewState(s)).toBe(false);
    }
  });

  it('isDraftJobContentReviewState accepts exactly the 3 draft states', () => {
    for (const s of ['Not Started', 'In Progress', 'Under Review']) {
      expect(isDraftJobContentReviewState(s)).toBe(true);
    }
  });

  it("isDraftJobContentReviewState rejects 'Published', 'draft', empty and missing", () => {
    for (const s of ['Published', 'draft', 'Draft', '', null, undefined, 0]) {
      expect(isDraftJobContentReviewState(s)).toBe(false);
    }
  });
});

describe('validateJobContentTaxonomy', () => {
  it('accepts the canonical taxonomy', () => {
    expect(validateJobContentTaxonomy()).toEqual([]);
  });

  it('rejects a subject under it-professional (scope undecided, 13.8)', () => {
    const bad = cloneSubjects();
    bad['it-professional'] = [
      { slug: 'bangla', examSlug: 'it-professional', nameBn: 'বাংলা', nameEn: 'Bangla', marks: 25, order: 1, syllabusSource: 'x' },
    ];
    expect(validateJobContentTaxonomyAgainst({ subjects: bad })).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/it-professional.*scope is undecided/),
        expect.stringMatching(/rulesConfig is null/),
      ]),
    );
  });

  it('rejects a subject under a null-config exam', () => {
    const bad = cloneSubjects();
    bad.dgfood = [
      { slug: 'bangla', examSlug: 'dgfood', nameBn: 'বাংলা', nameEn: 'Bangla', marks: 25, order: 1, syllabusSource: 'x' },
    ];
    expect(validateJobContentTaxonomyAgainst({ subjects: bad })).toEqual(
      expect.arrayContaining([expect.stringMatching(/dgfood.*rulesConfig is null/)]),
    );
  });

  it('rejects an unknown exam slug', () => {
    const bad = cloneSubjects();
    bad['nasa'] = [
      { slug: 'bangla', examSlug: 'nasa', nameBn: 'বাংলা', nameEn: 'Bangla', marks: 25, order: 1, syllabusSource: 'x' },
    ];
    expect(validateJobContentTaxonomyAgainst({ subjects: bad })).toEqual(
      expect.arrayContaining([expect.stringMatching(/unknown exam 'nasa'/)]),
    );
  });

  it('rejects a duplicate slug within an exam', () => {
    const bad = cloneSubjects();
    bad.bank.push({ ...bad.bank[0] });
    expect(validateJobContentTaxonomyAgainst({ subjects: bad })).toEqual(
      expect.arrayContaining([expect.stringMatching(/duplicate subject slug 'bangla'/)]),
    );
  });

  it('rejects a marks sum that differs from questionCount', () => {
    const bad = cloneSubjects();
    bad.bcs[0] = { ...bad.bcs[0], marks: 36 };
    expect(validateJobContentTaxonomyAgainst({ subjects: bad })).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/subject marks sum \(201\) != questionCount \(200\)/),
      ]),
    );
  });

  it('rejects an order gap', () => {
    const bad = cloneSubjects();
    bad.ntrca[3] = { ...bad.ntrca[3], order: 5 };
    expect(validateJobContentTaxonomyAgainst({ subjects: bad })).toEqual(
      expect.arrayContaining([expect.stringMatching(/orders are not exactly 1\.\.4/)]),
    );
  });

  it('rejects a missing syllabusSource', () => {
    const bad = cloneSubjects();
    bad.bank[0] = { ...bad.bank[0], syllabusSource: null };
    expect(validateJobContentTaxonomyAgainst({ subjects: bad })).toEqual(
      expect.arrayContaining([expect.stringMatching(/missing syllabusSource/)]),
    );
  });

  it('rejects an empty nameBn / nameEn and a mismatched examSlug', () => {
    const bad = cloneSubjects();
    bad.bank[0] = { ...bad.bank[0], nameBn: '' };
    bad.bank[1] = { ...bad.bank[1], nameEn: '' };
    bad.bank[2] = { ...bad.bank[2], examSlug: 'bcs' };
    expect(validateJobContentTaxonomyAgainst({ subjects: bad })).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/empty nameBn/),
        expect.stringMatching(/empty nameEn/),
        expect.stringMatching(/carries examSlug 'bcs'/),
      ]),
    );
  });
});

describe('lesson types (Step 6)', () => {
  it("only 'lesson' is creatable in Step 6", () => {
    expect([...JOB_STEP6_LESSON_TYPES]).toEqual(['lesson']);
  });

  it('the four content collections are the Step 3 §2.3–§2.6 names', () => {
    expect([...JOB_CONTENT_COLLECTIONS]).toEqual([
      'jobSubjects',
      'jobChapters',
      'jobTopics',
      'jobLessons',
    ]);
  });
});

describe('content seed (team/job-content-seed.json)', () => {
  it('has 23 subject docs, all draft / Not Started, nothing verified', () => {
    expect(Object.keys(SEED.jobSubjects)).toHaveLength(23);
    for (const [id, doc] of Object.entries(SEED.jobSubjects)) {
      expect(doc.status).toBe('draft');
      expect(doc.reviewStatus).toBe('Not Started');
      expect(doc.authorId).toBeNull();
      expect(doc.verifiedBy).toBeNull();
      expect(doc.verifiedAt).toBeNull();
      expect(id).toBe(`${doc.examSlug}__${doc.slug}`);
    }
  });

  it('deep-matches the canonical JOB_SUBJECTS (seed and code cannot drift)', () => {
    for (const [examSlug, list] of Object.entries(JOB_SUBJECTS)) {
      for (const s of list) {
        const doc = SEED.jobSubjects[`${examSlug}__${s.slug}`];
        expect(doc).toBeDefined();
        expect(doc).toMatchObject({
          examSlug,
          slug: s.slug,
          nameBn: s.nameBn,
          nameEn: s.nameEn,
          marks: s.marks,
          order: s.order,
          syllabusSource: s.syllabusSource,
        });
      }
    }
  });

  it('every seed doc carries the config version (Step 6 fold-in, P2-02)', () => {
    expect(JOB_CONTENT_CONFIG_VERSION).toMatch(/^\d{4}-\d{2}-\d{2}\.\d+$/);
    expect(SEED._meta.version).toBe(JOB_CONTENT_CONFIG_VERSION);
    expect(SEED._meta.configVersion).toBe(JOB_CONTENT_CONFIG_VERSION);
    for (const doc of Object.values(SEED.jobSubjects)) {
      expect(doc.configVersion).toBe(JOB_CONTENT_CONFIG_VERSION);
    }
  });

  it('every marks value matches the rulesConfig source', () => {    for (const [examSlug, list] of Object.entries(JOB_SUBJECTS)) {
      const config = JOB_RULES_CONFIGS[examSlug];
      for (const s of list) {
        const doc = SEED.jobSubjects[`${examSlug}__${s.slug}`];
        const source = config.subjects.find((r) => r.nameEn === s.nameEn);
        expect(source).toBeDefined();
        expect(doc.marks).toBe(source!.marks);
      }
    }
  });

  it('has no chapters, topics or lessons (nothing invented)', () => {
    expect(SEED.jobChapters).toEqual([]);
    expect(SEED.jobTopics).toEqual([]);
    expect(SEED.jobLessons).toEqual([]);
    expect(SEED._meta.emptyCollections).toMatch(/no verified chapter\/topic\/lesson lists/i);
  });

  it('marks the NTRCA subjects applicableCycle 18th, all others null', () => {
    for (const [id, doc] of Object.entries(SEED.jobSubjects)) {
      if (doc.examSlug === 'ntrca') expect(doc.applicableCycle).toBe('18th');
      else expect(doc.applicableCycle).toBeNull();
      expect(id.startsWith('ntrca__')).toBe(doc.examSlug === 'ntrca');
    }
  });

  it('carries ISO timestamps and a disk-only _meta note', () => {
    for (const doc of Object.values(SEED.jobSubjects)) {
      expect(doc.createdAt).toBe('2026-11-22T00:00:00.000Z');
      expect(doc.updatedAt).toBe('2026-11-22T00:00:00.000Z');
    }
    expect(SEED._meta.status).toMatch(/DISK ONLY/);
    expect(SEED._meta.verifiedFiguresOnly).toMatch(/it-professional.*scope_pending/);
  });
});
