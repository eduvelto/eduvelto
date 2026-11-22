// Eduvelto — National University exam configuration (NU-4, 22 Nov 2026;
// design doc §19.1.2, §19.2.1, §19.7).
//
// `nuExamConfigs` is a VERSIONED, RULES-VALIDATED FIRESTORE DOCUMENT —
// never a hardcoded constant in app code (§18 R1: the example JS object
// in the consultation was REJECTED as a literal; the values live in a
// Firestore document so a new circular changes the document, not a code
// deploy, and the version + audit history survive). This module defines
// the TYPES and the VALIDATOR the app (and the seed) use; the app reads
// the document from Firestore at runtime. The seed payload lives in
// `team/nu-exam-config-seed-2026-11-22.json` (disk only — NEVER applied
// to the live database in NU-4; applying it is an NU-5 admin action).
//
// All NU values below are VERIFIED from the official circular:
// National University, memo 10(226)জাতী:বি:/রেজি:/অ্যাকা:/2026/3348,
// dated 20/11/2025. Unverified values are null / absent — never guessed
// (§19.0): `sections.groupSubjectsDetail` is null until the Guideline
// arrives (Blocker B); `examDate` on the circular config is null — the
// exam date was never announced in the circular (§3 #1).

/** The circular version every NU rule in this release is pinned to. */
export const NU_CIRCULAR_VERSION = 'nu-2025-26-v1';

/** Merit-calculation version recorded on every merit estimate (§19.7.3)
 * so a future circular can never silently change what an old result meant. */
export const NU_MERIT_CALCULATION_VERSION = 'nu-merit-v1';

export type NuExamType = 'NU_ADMISSION' | 'NU_DAILY';

export interface NuExamMarking {
  correct: number;
  incorrect: number;
  unanswered: number;
  negativeMarking: boolean;
}

export interface NuExamSections {
  bangla: number;
  english: number;
  generalKnowledge: number;
  groupSubjects: number;
  /** Sub-split of the group-40 block — null until the Guideline
   * verifies it (design §3 #2, Blocker B). */
  groupSubjectsDetail: null | Record<string, number>;
}

export interface NuExamConfig {
  configId: string;
  examType: NuExamType;
  questionMode: 'MCQ';
  totalQuestions: number;
  durationSeconds: number;
  marking: NuExamMarking;
  passMark: { value: number; displayOnly: boolean };
  sections: NuExamSections;
  meritCalculationEnabled: boolean;
  officialRankEnabled: boolean;
  vivaEnabled: boolean;
  circularVersion: string;
  configVersion: number;
  status: 'draft' | 'published' | 'withdrawn';
}

export interface NuCircularConfig {
  admissionId: string;
  academicSession: string;
  status: 'draft' | 'verified' | 'published' | 'historical' | 'superseded';
  sourceType: 'official_circular';
  sourceReference: string;
  /** Verified dates only; null when not announced (§19.2.1). */
  applicationStart: string | null;
  applicationEnd: string | null;
  examDate: string | null;
  eligibilityRulesVersion: string;
  meritRulesVersion: string;
}

/**
 * The verified 2025-26 full-mock config, as a Firestore document
 * payload (SEED ONLY — see the module header). 100 MCQ / 60 minutes /
 * no negative marking / pass 35 (comparison only) / sections
 * 20+20+20+40. The 2025-26 circular config document today is
 * `status: 'historical'` (application window closed 31 Dec 2025);
 * the exam config stays `published` as the pattern for mocks until a
 * 2026-27 circular is verified (Blocker A).
 */
export function nuFullMockConfigSeed(): NuExamConfig {
  return {
    configId: 'nu-admission-full-2025-26-v1',
    examType: 'NU_ADMISSION',
    questionMode: 'MCQ',
    totalQuestions: 100,
    durationSeconds: 3600,
    marking: { correct: 1, incorrect: 0, unanswered: 0, negativeMarking: false },
    passMark: { value: 35, displayOnly: true },
    sections: {
      bangla: 20,
      english: 20,
      generalKnowledge: 20,
      groupSubjects: 40,
      groupSubjectsDetail: null,
    },
    meritCalculationEnabled: true,
    officialRankEnabled: false,
    vivaEnabled: false,
    circularVersion: NU_CIRCULAR_VERSION,
    configVersion: 1,
    status: 'published',
  };
}

/** The verified 2025-26 circular config, as a Firestore document
 * payload (SEED ONLY). `examDate` is null — never announced. */
export function nuCircularConfigSeed(): NuCircularConfig {
  return {
    admissionId: 'nu-2025-26',
    academicSession: '2025-26',
    status: 'historical',
    sourceType: 'official_circular',
    sourceReference:
      'NU circular memo 10(226)জাতী:বি:/রেজি:/অ্যাকা:/2026/3348, dated 20/11/2025 — https://www.nu.ac.bd/uploads/notices/notice_3348_pub_date_23112025.pdf',
    applicationStart: '2025-11-23T16:00:00+06:00',
    applicationEnd: '2025-12-31T23:59:59+06:00',
    examDate: null,
    eligibilityRulesVersion: 'v1',
    meritRulesVersion: 'v1',
  };
}

/**
 * Validate a `nuExamConfigs` document (client-side mirror of the
 * firestore.rules checks in §19.3.4). Returns every problem — empty
 * means the config is valid. A config that fails here must NEVER be
 * used to build or score a mock: a mock built on the wrong structure
 * (80 questions, Job timing, a negative-marking formula) is a wrong
 * exam, not a small bug (§18 (a)-2).
 */
export function validateNuExamConfig(doc: unknown): string[] {
  const problems: string[] = [];
  if (typeof doc !== 'object' || doc === null) return ['config is not an object'];
  const d = doc as Record<string, unknown>;

  if (d.examType !== 'NU_ADMISSION' && d.examType !== 'NU_DAILY') {
    problems.push(`examType must be 'NU_ADMISSION' or 'NU_DAILY', got ${String(d.examType)}`);
  }
  if (d.questionMode !== 'MCQ') problems.push('questionMode must be MCQ — no written exam exists');
  if (typeof d.configVersion !== 'number' || !Number.isInteger(d.configVersion) || d.configVersion < 1) {
    problems.push('configVersion must be an integer >= 1');
  }
  if (typeof d.circularVersion !== 'string' || d.circularVersion.length === 0) {
    problems.push('circularVersion must be a non-empty string');
  }
  if (d.status !== 'draft' && d.status !== 'published' && d.status !== 'withdrawn') {
    problems.push(`status must be draft/published/withdrawn, got ${String(d.status)}`);
  }

  const marking = d.marking as Record<string, unknown> | undefined;
  if (typeof marking !== 'object' || marking === null) {
    problems.push('marking must be an object');
  } else {
    if (marking.correct !== 1) problems.push('marking.correct must be 1');
    if (marking.incorrect !== 0) problems.push('marking.incorrect must be 0');
    if (marking.unanswered !== 0) problems.push('marking.unanswered must be 0');
    if (marking.negativeMarking !== false) {
      problems.push('marking.negativeMarking must be false — the circular says no marks are cut for wrong answers');
    }
  }
  if (d.vivaEnabled !== false) problems.push('vivaEnabled must be false — the circular has no viva step');
  if (d.officialRankEnabled !== false) problems.push('officialRankEnabled must be false — no rank is ever displayed');

  const passMark = d.passMark as Record<string, unknown> | undefined;
  if (typeof passMark !== 'object' || passMark === null) {
    problems.push('passMark must be an object');
  } else {
    if (passMark.value !== 35) problems.push('passMark.value must be 35 (circular §4(a))');
    if (passMark.displayOnly !== true) {
      problems.push('passMark.displayOnly must be true — 35 is a comparison only, never a pass/fail verdict');
    }
  }

  if (d.examType === 'NU_ADMISSION') {
    if (d.totalQuestions !== 100) problems.push('NU_ADMISSION totalQuestions must be 100');
    if (d.durationSeconds !== 3600) problems.push('NU_ADMISSION durationSeconds must be 3600 (1 hour)');
    const sections = d.sections as Record<string, unknown> | undefined;
    if (typeof sections !== 'object' || sections === null) {
      problems.push('sections must be an object');
    } else {
      if (sections.bangla !== 20) problems.push('sections.bangla must be 20');
      if (sections.english !== 20) problems.push('sections.english must be 20');
      if (sections.generalKnowledge !== 20) problems.push('sections.generalKnowledge must be 20');
      if (sections.groupSubjects !== 40) problems.push('sections.groupSubjects must be 40');
      if (sections.groupSubjectsDetail !== null) {
        problems.push('sections.groupSubjectsDetail must be null until the Guideline verifies the sub-split (Blocker B)');
      }
    }
  } else if (d.examType === 'NU_DAILY') {
    if (
      typeof d.totalQuestions !== 'number' ||
      !Number.isInteger(d.totalQuestions) ||
      d.totalQuestions < 20 ||
      d.totalQuestions > 30
    ) {
      problems.push('NU_DAILY totalQuestions must be an integer 20–30');
    }
    if (
      typeof d.durationSeconds !== 'number' ||
      !Number.isInteger(d.durationSeconds) ||
      d.durationSeconds < 1200 ||
      d.durationSeconds > 1800
    ) {
      problems.push('NU_DAILY durationSeconds must be an integer 1200–1800 (20–30 minutes)');
    }
  }

  return problems;
}
