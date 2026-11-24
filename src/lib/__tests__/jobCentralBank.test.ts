/**
 * Eduvelto Job Preparation — Central Question Bank unit tests
 * (design-central-bank.md §10 step 13).
 *
 * Covers: schema validation (all §1.1 field rules + §1.3 key
 * allow-list + §1.5 derivation table), the ID scheme, hash v2
 * (Bangla-digit folding + option-order invariance + correct-text-
 * not-letter), duplicate classes (§4.1 incl. the 026/027 keep-case),
 * mapping agreement (examMappings ⟺ syllabusMappings keys), the
 * passage join, and the §8 transparency labels.
 */
import { describe, it, expect } from 'vitest';
import {
  CENTRAL_BANK_CONFIG_VERSION,
  CENTRAL_BANK_SCHEMA_VERSION,
  BCS_SYLLABUS_VERSION,
  deriveVerificationStatus,
  newQuestionIdFor,
  isValidCentralBankQuestionId,
  normalizeCentralBankText,
  foldBanglaDigits,
  stemHashFor,
  duplicateHashV2For,
  correctTextFor,
  classifyDuplicateCandidate,
  questionTransparencyLabel,
  extractPassageStem,
  validateCentralBankQuestion,
  type CentralBankQuestion,
} from '../jobCentralBank';
import { JOB_QUESTION_CONFIG_VERSION } from '../jobQuestions';
import { PUBLIC_BCS_READING_PASSAGE } from '../publicBcsEnglish';

const OWNER_UID = 'nczNklmktsVrxg43UzcgdSm6v0j2';

function validV2(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  const question = 'Choose the correct sentence.';
  const options = [
    { letter: 'A', text: 'He go to school every day.' },
    { letter: 'B', text: 'He going to school every day.' },
    { letter: 'C', text: 'He goes to school every day.' },
    { letter: 'D', text: 'He gone to school every day.' },
  ];
  const base: Record<string, unknown> = {
    questionId: 'q_english_0001',
    subjectId: 'english',
    topicId: 'english__grammar__tense',
    subtopicId: null,
    difficulty: 'medium',
    questionType: 'mcq',
    question,
    options,
    correctAnswer: 'C',
    explanation: 'He হলো third person singular, তাই present simple-এ verb-এর শেষে -s/-es বসে।',
    whyWrong: null,
    examMappings: ['bcs'],
    syllabusMappings: {
      bcs: {
        subjectId: 'bcs__english',
        chapterId: 'bcs__english__grammar',
        topicId: 'bcs__english__grammar__tense',
        syllabusVersion: BCS_SYLLABUS_VERSION,
        syllabusTopicId: 'english__grammar__tense',
        verified: true,
      },
    },
    verificationStatus: 'verified',
    isActive: true,
    origin: 'admin-practice',
    source: {
      type: 'original-practice',
      reference: 'owner-verified BCS English Batch 1, 22 Nov 2026',
      url: null,
    },
    examYear: null,
    tags: ['english', 'english__grammar__tense', 'bcs', 'batch:bcs-english-batch1'],
    passageId: null,
    duplicateHash: 'abcdef0123456789',
    duplicateHashV2: duplicateHashV2For({ question, subjectId: 'english', options, correctAnswer: 'C' }),
    stemHash: stemHashFor(question),
    duplicateOf: null,
    duplicateCandidates: null,
    duplicateReview: null,
    authorId: null,
    verifiedBy: OWNER_UID,
    verifiedAt: '2026-11-22T00:00:00.000Z',
    reviewerId: null,
    reviewContentPassed: false,
    version: 1,
    configVersion: CENTRAL_BANK_CONFIG_VERSION,
    schemaVersion: CENTRAL_BANK_SCHEMA_VERSION,
    status: 'published',
    reviewStatus: 'Published',
    createdBy: null,
    legacyId: null,
    rejectionReason: null,
  };
  return { ...base, ...overrides };
}

describe('question ID scheme (§1.2)', () => {
  it('(cb1) new IDs are q_<subject>_<seq4>', () => {
    expect(newQuestionIdFor('english', 1)).toBe('q_english_0001');
    expect(newQuestionIdFor('bangla', 42)).toBe('q_bangla_0042');
    expect(newQuestionIdFor('mathematical-reasoning', 9999)).toBe('q_mathematical-reasoning_9999');
  });
  it('(cb2) newQuestionIdFor rejects a non-canonical subject', () => {
    expect(() => newQuestionIdFor('constitution', 1)).toThrow(/not a canonical bank subject/);
    expect(() => newQuestionIdFor('bcs__english', 1)).toThrow(/not a canonical bank subject/);
  });
  it('(cb3) newQuestionIdFor rejects an out-of-range sequence', () => {
    expect(() => newQuestionIdFor('english', 0)).toThrow(/1–9999/);
    expect(() => newQuestionIdFor('english', 10000)).toThrow(/1–9999/);
  });
  it('(cb4) legacy IDs stay valid, sample IDs never do', () => {
    expect(isValidCentralBankQuestionId('bcs-eng-001')).toBe(true);
    expect(isValidCentralBankQuestionId('bcs-eng-035')).toBe(true);
    expect(isValidCentralBankQuestionId('q_english_0001')).toBe(true);
    expect(isValidCentralBankQuestionId('bcs-eng-lit-001')).toBe(false);
    expect(isValidCentralBankQuestionId('q_english_1')).toBe(false);
    expect(isValidCentralBankQuestionId('bcs-eng-1')).toBe(false);
    expect(isValidCentralBankQuestionId('')).toBe(false);
  });
  it('(cb5) the bank config version matches the Step 7 seed version', () => {
    expect(CENTRAL_BANK_CONFIG_VERSION).toBe(JOB_QUESTION_CONFIG_VERSION);
    expect(CENTRAL_BANK_CONFIG_VERSION).toBe('2026-11-22.1');
  });
});

describe('verificationStatus derivation (§1.5)', () => {
  it('(cb6) published + Published → verified', () => {
    expect(deriveVerificationStatus('published', 'Published')).toBe('verified');
  });
  it('(cb7) Under Review without a content pass → draft', () => {
    expect(deriveVerificationStatus('draft', 'Under Review', false)).toBe('draft');
    expect(deriveVerificationStatus('draft', 'Under Review')).toBe('draft');
  });
  it('(cb8) Under Review WITH a content pass → reviewed', () => {
    expect(deriveVerificationStatus('draft', 'Under Review', true)).toBe('reviewed');
  });
  it('(cb9) any other draft state → draft', () => {
    expect(deriveVerificationStatus('draft', 'Not Started')).toBe('draft');
    expect(deriveVerificationStatus('draft', 'In Progress')).toBe('draft');
    expect(deriveVerificationStatus('draft', 'Rejected')).toBe('draft');
  });
});

describe('hash v2 (§4.2)', () => {
  const q = {
    question: 'In which year was the exam held? ২০২৫',
    subjectId: 'english',
    options: [
      { letter: 'A', text: '2024' },
      { letter: 'B', text: '2025' },
      { letter: 'C', text: '2026' },
      { letter: 'D', text: '2027' },
    ],
    correctAnswer: 'B' as const,
  };
  it('(cb10) Bangla digits fold to Latin digits', () => {
    expect(foldBanglaDigits('২০২৫')).toBe('2025');
    expect(normalizeCentralBankText('২০২৫')).toBe(normalizeCentralBankText('2025'));
    expect(duplicateHashV2For(q)).toBe(
      duplicateHashV2For({ ...q, question: 'In which year was the exam held? 2025' }),
    );
  });
  it('(cb11) normalisation strips punctuation/whitespace and folds case', () => {
    expect(normalizeCentralBankText('Hello, World!')).toBe('helloworld');
    expect(normalizeCentralBankText('সন্ধি কাকে বলে?')).toBe('সন্ধিকাকেবলে');
  });
  it('(cb12) option order does NOT change the hash (options are a set)', () => {
    const shuffled = {
      ...q,
      options: [
        { letter: 'A', text: '2026' },
        { letter: 'B', text: '2024' },
        { letter: 'C', text: '2025' },
        { letter: 'D', text: '2027' },
      ],
      correctAnswer: 'C' as const,
    };
    expect(duplicateHashV2For(q)).toBe(duplicateHashV2For(shuffled));
  });
  it('(cb13) the correct answer enters as TEXT, not the letter', () => {
    const differentAnswer = { ...q, correctAnswer: 'C' as const };
    expect(duplicateHashV2For(q)).not.toBe(duplicateHashV2For(differentAnswer));
  });
  it('(cb14) a different subject gives a different hash', () => {
    expect(duplicateHashV2For(q)).not.toBe(duplicateHashV2For({ ...q, subjectId: 'bangla' }));
  });
  it('(cb15) hashes are 16 hex chars', () => {
    expect(duplicateHashV2For(q)).toMatch(/^[0-9a-f]{16}$/);
    expect(stemHashFor(q.question)).toMatch(/^[0-9a-f]{16}$/);
  });
  it('(cb16) correctText is derived from the options, never stored', () => {
    expect(correctTextFor(q)).toBe('2025');
  });
});

describe('duplicate classification (§4.1)', () => {
  const base = {
    question: 'Choose the correctly spelled word.',
    subjectId: 'english',
    options: [
      { letter: 'A', text: 'Receive' },
      { letter: 'B', text: 'Recieve' },
      { letter: 'C', text: 'Receeve' },
      { letter: 'D', text: 'Receiv' },
    ],
    correctAnswer: 'A' as const,
  };
  it('(cb17) identical stem + options + correct text → exact (BLOCK)', () => {
    expect(classifyDuplicateCandidate(base, { ...base }).class).toBe('exact');
    expect(classifyDuplicateCandidate(base, { ...base }).score).toBe(1);
  });
  it('(cb18) the 026/027 spelling pair → near-stem (FLAG, recorded KEEP)', () => {
    const other = {
      question: 'Choose the correctly spelled word.',
      subjectId: 'english',
      options: [
        { letter: 'A', text: 'Accomodation' },
        { letter: 'B', text: 'Acommodation' },
        { letter: 'C', text: 'Accomodattion' },
        { letter: 'D', text: 'Accommodation' },
      ],
      correctAnswer: 'D' as const,
    };
    expect(classifyDuplicateCandidate(base, other).class).toBe('near-stem');
  });
  it('(cb19) same options, different stem → near-options (FLAG)', () => {
    const paraphrase = { ...base, question: 'Pick the word with the right spelling.' };
    expect(classifyDuplicateCandidate(base, paraphrase).class).toBe('near-options');
  });
  it('(cb20) a different subject is not a duplicate by construction', () => {
    expect(classifyDuplicateCandidate(base, { ...base, subjectId: 'bangla' }).class).toBe('none');
  });
  it('(cb21) an unrelated question → none', () => {
    expect(
      classifyDuplicateCandidate(base, {
        question: 'What is the capital of Bangladesh?',
        subjectId: 'english',
        options: [
          { letter: 'A', text: 'Dhaka' },
          { letter: 'B', text: 'Chittagong' },
          { letter: 'C', text: 'Khulna' },
          { letter: 'D', text: 'Sylhet' },
        ],
        correctAnswer: 'A' as const,
      }).class,
    ).toBe('none');
  });
});

describe('validateCentralBankQuestion (§1.1)', () => {
  it('(cb22) a well-formed verified v2 doc passes', () => {
    expect(validateCentralBankQuestion(validV2())).toEqual([]);
  });
  it('(cb23) a legacy top-level field fails (renames are enforced)', () => {
    for (const legacy of ['examSlug', 'chapterId', 'bundleId', 'isPreviousYear', 'sourceUrl', 'questionText', 'correctLetter']) {
      expect(validateCentralBankQuestion({ ...validV2(), [legacy]: 'x' }).length).toBeGreaterThan(0);
    }
  });
  it('(cb24) a non-canonical subject fails (exam-scoped form is rejected)', () => {
    expect(validateCentralBankQuestion(validV2({ subjectId: 'bcs__english' })).length).toBeGreaterThan(0);
    expect(validateCentralBankQuestion(validV2({ subjectId: 'constitution' })).length).toBeGreaterThan(0);
  });
  it('(cb25) a topicId outside its subject fails', () => {
    expect(validateCentralBankQuestion(validV2({ topicId: 'bangla__grammar__shomash' })).length).toBeGreaterThan(0);
  });
  it('(cb26) the shorthand exam key "primary" fails (canonical is primary-teacher)', () => {
    const doc = validV2({
      examMappings: ['primary'],
      syllabusMappings: {
        primary: {
          subjectId: 'primary-teacher__english',
          topicId: 'primary-teacher__english__grammar__tense',
          syllabusVersion: 'dpe-rules-2025',
          syllabusTopicId: 'english__grammar__tense',
          verified: false,
        },
      },
    });
    expect(validateCentralBankQuestion(doc).length).toBeGreaterThan(0);
  });
  it('(cb27) examMappings ⟺ syllabusMappings keys must agree exactly', () => {
    const doc = validV2({ examMappings: ['bcs', 'bank'] });
    expect(validateCentralBankQuestion(doc).length).toBeGreaterThan(0);
    const withBoth = validV2({
      examMappings: ['bcs', 'bank'],
      syllabusMappings: {
        bcs: (validV2().syllabusMappings as Record<string, unknown>).bcs,
        bank: {
          subjectId: 'bank__english',
          topicId: 'bank__english__grammar__tense',
          syllabusVersion: 'bscs-115/2025',
          syllabusTopicId: 'english__grammar__tense',
          verified: false,
        },
      },
    });
    expect(validateCentralBankQuestion(withBoth)).toEqual([]);
  });
  it('(cb28) syllabusTopicId must equal the canonical topicId', () => {
    const mappings = JSON.parse(JSON.stringify(validV2().syllabusMappings)) as Record<string, Record<string, unknown>>;
    mappings.bcs.syllabusTopicId = 'english__grammar__voice';
    expect(validateCentralBankQuestion(validV2({ syllabusMappings: mappings })).length).toBeGreaterThan(0);
  });
  it('(cb29) verificationStatus must match the derived level', () => {
    expect(validateCentralBankQuestion(validV2({ verificationStatus: 'draft' })).length).toBeGreaterThan(0);
    expect(validateCentralBankQuestion(validV2({ verificationStatus: 'reviewed' })).length).toBeGreaterThan(0);
    const reviewed = validV2({
      verificationStatus: 'reviewed',
      status: 'draft',
      reviewStatus: 'Under Review',
      reviewContentPassed: true,
      reviewerId: 'moderator-1',
      verifiedBy: null,
      verifiedAt: null,
    });
    expect(validateCentralBankQuestion(reviewed)).toEqual([]);
  });
  it('(cb30) origin ⟺ source.type must agree', () => {
    expect(validateCentralBankQuestion(validV2({
      origin: 'ai-generated-practice',
      source: { type: 'original-practice', reference: 'x', url: null },
    })).length).toBeGreaterThan(0);
    expect(validateCentralBankQuestion(validV2({
      origin: 'ai-generated-practice',
      source: { type: 'ai-generated', reference: 'model batch ai-1', url: null },
    }))).toEqual([]);
  });
  it('(cb31) verified-previous needs examYear + source.url proof', () => {
    expect(validateCentralBankQuestion(validV2({ origin: 'verified-previous' })).length).toBeGreaterThan(0);
    expect(validateCentralBankQuestion(validV2({
      origin: 'verified-previous',
      examYear: 2023,
      source: { type: 'previous-year', reference: 'BCS 2023 preliminary', url: 'https://bpsc.gov.bd/paper-2023' },
    }))).toEqual([]);
  });
  it('(cb32) examYear must be null unless the origin is verified-previous', () => {
    expect(validateCentralBankQuestion(validV2({ examYear: 2023 })).length).toBeGreaterThan(0);
  });
  it('(cb33) free-form tags fail; the controlled vocabulary passes', () => {
    expect(validateCentralBankQuestion(validV2({ tags: ['my-favourite'] })).length).toBeGreaterThan(0);
    expect(validateCentralBankQuestion(validV2({ tags: ['english', 'general-practice'] }))).toEqual([]);
    expect(validateCentralBankQuestion(validV2({ tags: ['english', 'previous-year'] })).length).toBeGreaterThan(0);
  });
  it('(cb34) duplicate option text fails', () => {
    const doc = validV2();
    const options = JSON.parse(JSON.stringify(doc.options)) as Array<Record<string, unknown>>;
    options[3].text = options[0].text;
    expect(validateCentralBankQuestion(validV2({ options })).length).toBeGreaterThan(0);
  });
  it('(cb35) a verified question with unreviewed duplicateCandidates fails (publish gate)', () => {
    expect(validateCentralBankQuestion(validV2({
      duplicateCandidates: [{ questionId: 'q_english_0002', class: 'near-stem', score: 0.6 }],
    })).length).toBeGreaterThan(0);
  });
  it('(cb36) the verifier is never the author (second eye)', () => {
    expect(validateCentralBankQuestion(validV2({ authorId: OWNER_UID })).length).toBeGreaterThan(0);
    expect(validateCentralBankQuestion(validV2({ authorId: 'teacher-1' }))).toEqual([]);
  });
  it('(cb37) a non-MCQ questionType fails (this bank is MCQ-only)', () => {
    expect(validateCentralBankQuestion(validV2({ questionType: 'written' })).length).toBeGreaterThan(0);
  });
});

describe('transparency labels (§8)', () => {
  it('(cb38) every origin has a label, and the set is exhaustive', () => {
    expect(questionTransparencyLabel('verified-previous', 'verified').bn).toBe('যাচাইকৃত বিগত বছরের প্রশ্ন');
    expect(questionTransparencyLabel('admin-practice', 'verified').bn).toBe('অনুশীলনী প্রশ্ন');
    expect(questionTransparencyLabel('official-fact', 'verified').bn).toBe('সরকারি তথ্য');
    const ai = questionTransparencyLabel('ai-generated-practice', 'verified');
    expect(ai.bn).toBe('AI-সহায়তায় তৈরি অনুশীলনী');
    expect(ai.practiceOnly).toBe(false);
  });
  it('(cb39) a reviewed practice question carries the practice-only qualifier', () => {
    const label = questionTransparencyLabel('admin-practice', 'reviewed');
    expect(label.practiceOnly).toBe(true);
    expect(label.bn).toContain('পর্যালোচনাধীন');
  });
  it('(cb40) the AI label is never dropped on verification', () => {
    expect(questionTransparencyLabel('ai-generated-practice', 'verified').bn).toContain('AI');
    expect(questionTransparencyLabel('ai-generated-practice', 'draft').bn).toContain('AI');
  });
});

describe('passage de-inlining (§1.4)', () => {
  const passage = PUBLIC_BCS_READING_PASSAGE.text;
  const inlined = `Read the following passage and answer the question:\n\n"${passage}"\n\nHow does Rahim go to school?`;
  it('(cb41) the Firestore inlined shape de-inlines to the stem', () => {
    expect(extractPassageStem(inlined, passage)).toBe('How does Rahim go to school?');
  });
  it('(cb42) stem-only text returns null (already de-inlined)', () => {
    expect(extractPassageStem('How does Rahim go to school?', passage)).toBeNull();
  });
  it('(cb43) a different passage returns null (never guess)', () => {
    expect(extractPassageStem(inlined, 'Some other passage.')).toBeNull();
  });
  it('(cb44) the passage constant is the shared passage doc', () => {
    expect(PUBLIC_BCS_READING_PASSAGE.id).toBe('bcs-eng-passage-01');
    expect(PUBLIC_BCS_READING_PASSAGE.usedBy).toEqual(['bcs-eng-033', 'bcs-eng-034', 'bcs-eng-035']);
  });
});

describe('types', () => {
  it('(cb45) a CentralBankQuestion carries the §1.1 fields', () => {
    const q = validV2() as unknown as CentralBankQuestion;
    expect(q.questionId).toBe('q_english_0001');
    expect(q.questionType).toBe('mcq');
    expect(q.schemaVersion).toBe(CENTRAL_BANK_SCHEMA_VERSION);
  });
});
