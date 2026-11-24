/**
 * Eduvelto Job Preparation — Written Exam Preparation System
 * (design-grades-written-previous-admin.md §2).
 *
 * A WRITING-LEARNING system, not a model-answer library. The
 * student learns a method, practises it, self-checks against a
 * transparent rubric, and — only in a later phase — gets
 * AI-assisted feedback. The model answer is a reference, not a
 * rigid template. Different-but-correct arguments/examples are
 * never penalised — in the rubric, in AI feedback, or in teacher
 * review.
 *
 * Pure lib: no Firestore here. Firestore shapes live in
 * jobWrittenData.ts; code-shaped first content in
 * jobWrittenContent.ts.
 */

/** The 8 reusable answer-type templates (§2.2). */
export type WrittenAnswerType =
  | 'bangla-essay'
  | 'english-essay'
  | 'paragraph'
  | 'bangla-letter'
  | 'application'
  | 'english-letter'
  | 'translation'
  | 'math-solution';

export const WRITTEN_ANSWER_TYPES: WrittenAnswerType[] = [
  'bangla-essay',
  'english-essay',
  'paragraph',
  'bangla-letter',
  'application',
  'english-letter',
  'translation',
  'math-solution',
];

/** `gk-written` / `explanatory` questions reuse the essay/paragraph
 * skeletons with their own rubric profile (E-3) — they are NOT
 * separate templates unless a teacher shows the skeleton misleads
 * students. */
export type WrittenQuestionKind = WrittenAnswerType | 'gk-written' | 'explanatory';

export function writtenTemplateForKind(kind: WrittenQuestionKind): WrittenAnswerType {
  if (kind === 'gk-written' || kind === 'explanatory') return 'bangla-essay';
  return kind;
}

/** The 7 rubric dimensions (§2.5). */
export type RubricDimension =
  | 'relevance'
  | 'content'
  | 'structure'
  | 'language'
  | 'presentation'
  | 'completeness'
  | 'examples';

export const RUBRIC_DIMENSIONS: Array<{
  key: RubricDimension;
  bn: string;
  en: string;
  defaultWeight: number;
}> = [
  { key: 'relevance', bn: 'প্রাসঙ্গিকতা', en: 'Relevance', defaultWeight: 20 },
  { key: 'content', bn: 'বিষয়বস্তু ও তথ্যের সঠিকতা', en: 'Content / factual accuracy', defaultWeight: 20 },
  { key: 'structure', bn: 'গঠন', en: 'Structure / organisation', defaultWeight: 15 },
  { key: 'language', bn: 'ভাষা ও ব্যাকরণ', en: 'Language / grammar', defaultWeight: 15 },
  { key: 'presentation', bn: 'উপস্থাপনা', en: 'Presentation / readability', defaultWeight: 10 },
  { key: 'completeness', bn: 'সম্পূর্ণতা ও গভীরতা', en: 'Completeness / depth', defaultWeight: 10 },
  { key: 'examples', bn: 'উদাহরণ ও প্রমাণ', en: 'Examples / evidence', defaultWeight: 10 },
];

/** Weight profile per answer type (§2.5). Every profile sums to 100. */
export type RubricWeightProfile = Record<RubricDimension, number>;

export const RUBRIC_WEIGHT_PROFILES: Record<WrittenAnswerType, RubricWeightProfile> = {
  'bangla-essay': {
    relevance: 20, content: 20, structure: 15, language: 15,
    presentation: 10, completeness: 10, examples: 10,
  },
  'english-essay': {
    relevance: 20, content: 20, structure: 15, language: 15,
    presentation: 10, completeness: 10, examples: 10,
  },
  paragraph: {
    relevance: 25, content: 20, structure: 20, language: 15,
    presentation: 5, completeness: 10, examples: 5,
  },
  'bangla-letter': {
    relevance: 20, content: 15, structure: 20, language: 20,
    presentation: 10, completeness: 10, examples: 5,
  },
  application: {
    // Format / politeness / clarity / grammar dominate.
    relevance: 20, content: 10, structure: 25, language: 20,
    presentation: 10, completeness: 10, examples: 5,
  },
  'english-letter': {
    relevance: 20, content: 15, structure: 20, language: 20,
    presentation: 10, completeness: 10, examples: 5,
  },
  translation: {
    // Meaning / grammar / vocabulary / natural expression dominate;
    // structure weight falls.
    relevance: 30, content: 25, structure: 5, language: 25,
    presentation: 5, completeness: 5, examples: 5,
  },
  'math-solution': {
    // Correctness / method / steps / units dominate (deterministic
    // checking, §2.6); language and examples fall away.
    relevance: 15, content: 40, structure: 25, language: 5,
    presentation: 5, completeness: 10, examples: 0,
  },
};

export function rubricWeightsFor(type: WrittenAnswerType): RubricWeightProfile {
  return RUBRIC_WEIGHT_PROFILES[type];
}

/** Length by marks (§2.4) — starting defaults only; official exam
 * instructions + verified answer patterns override. Bangla guidance
 * is approximate (words or lines/pages) — never a false precision.
 * Math is counted in logical steps, not words (E-4). */
export interface WrittenLengthGuidance {
  marks: number;
  wordsMin: number | null;
  wordsMax: number | null;
  banglaBn: string;
  banglaEn: string;
  /** Math: steps, not words. */
  mathSteps: string | null;
}

export const WRITTEN_LENGTH_BY_MARKS: WrittenLengthGuidance[] = [
  {
    marks: 2, wordsMin: 30, wordsMax: 50,
    banglaBn: 'সংক্ষিপ্ত উত্তর — ২–৩ লাইন / প্রায় ৩০–৫০ শব্দ',
    banglaEn: 'Short answer — 2–3 lines / about 30–50 words',
    mathSteps: '১–২টি ধাপ',
  },
  {
    marks: 5, wordsMin: 80, wordsMax: 120,
    banglaBn: 'প্রায় ৮০–১২০ শব্দ, অথবা ৬–৮ লাইন',
    banglaEn: 'About 80–120 words, or 6–8 lines',
    mathSteps: '২–৪টি ধাপ',
  },
  {
    marks: 10, wordsMin: 150, wordsMax: 220,
    banglaBn: 'প্রায় ১৫০–২২০ শব্দ, অথবা ১–১.৫ পৃষ্ঠা (হাতের লেখা অনুযায়ী বদলায়)',
    banglaEn: 'About 150–220 words, or 1–1.5 pages (varies with handwriting)',
    mathSteps: '৪–৬টি ধাপ',
  },
  {
    marks: 15, wordsMin: 250, wordsMax: 350,
    banglaBn: 'প্রায় ২৫০–৩৫০ শব্দ, অথবা ২ পৃষ্ঠা',
    banglaEn: 'About 250–350 words, or 2 pages',
    mathSteps: '৫–৮টি ধাপ',
  },
  {
    marks: 20, wordsMin: 350, wordsMax: 500,
    banglaBn: 'প্রায় ৩৫০–৫০০ শব্দ, অথবা ২–৩ পৃষ্ঠা',
    banglaEn: 'About 350–500 words, or 2–3 pages',
    mathSteps: '৬–১০টি ধাপ',
  },
];

export function lengthGuidanceForMarks(marks: number): WrittenLengthGuidance | null {
  const exact = WRITTEN_LENGTH_BY_MARKS.find((g) => g.marks === marks);
  if (exact) return exact;
  // Nearest lower default; above 20 the 20-mark guidance applies
  // with the "longer answer" note (never a false precision).
  const below = [...WRITTEN_LENGTH_BY_MARKS].reverse().find((g) => g.marks < marks);
  return below ?? null;
}

/** The 8 teaching elements (§2.3). Step 3–6 collapse into
 * method-steps for math, format-blocks for letters/applications. */
export interface WrittenStructure {
  /** 1. What the question is asking. */
  questionAnalysisBn: string;
  questionAnalysisEn: string;
  /** 2. Answer structure (skeleton for this answer). */
  structureBn: string[];
  structureEn: string[];
  /** 3. Introduction — what a good opening does (math: given/data). */
  introductionBn: string;
  introductionEn: string;
  /** 4. Main discussion — points / paragraphs / math steps. */
  mainPointsBn: string[];
  mainPointsEn: string[];
  /** 5. Facts & examples, each with its source. Never invented. */
  factsBn: Array<{ text: string; source: string | null }>;
  factsEn: Array<{ text: string; source: string | null }>;
  /** 6. Conclusion — what a good closing does. */
  conclusionBn: string;
  conclusionEn: string;
  /** 7. Model answer (reference, §2.4). */
  modelAnswerBn: string;
  modelAnswerEn: string | null;
  /** 8. Submission — the student writes their own answer. */
  submissionPromptBn: string;
  submissionPromptEn: string;
}

export interface WrittenTemplate {
  type: WrittenAnswerType;
  nameBn: string;
  nameEn: string;
  /** Section skeleton for this type. */
  skeletonBn: string[];
  skeletonEn: string[];
  /** Does this type use intro–discussion–conclusion (prose) or
   * method-steps (math)? E-4: math is NEVER forced into
   * intro-discussion-conclusion. */
  shape: 'prose' | 'format-block' | 'method-steps';
  rubricWeights: RubricWeightProfile;
  /** Self-check checklist: 1–3 plain questions per dimension. */
  checklistBn: Partial<Record<RubricDimension, string[]>>;
  checklistEn: Partial<Record<RubricDimension, string[]>>;
  commonMistakesSlotBn: string;
  commonMistakesSlotEn: string;
}

const PROSE_SKELETON_BN = ['ভূমিকা', 'মূল আলোচনা (যুক্তি অনুযায়ী পয়েন্ট)', 'তথ্য ও উদাহরণ', 'উপসংহার'];
const PROSE_SKELETON_EN = ['Introduction', 'Main discussion (logical points)', 'Facts & examples', 'Conclusion'];

export const WRITTEN_TEMPLATES: Record<WrittenAnswerType, WrittenTemplate> = {
  'bangla-essay': {
    type: 'bangla-essay',
    nameBn: 'বাংলা প্রবন্ধ',
    nameEn: 'Bangla essay',
    skeletonBn: PROSE_SKELETON_BN,
    skeletonEn: PROSE_SKELETON_EN,
    shape: 'prose',
    rubricWeights: RUBRIC_WEIGHT_PROFILES['bangla-essay'],
    checklistBn: {
      relevance: ['প্রশ্নে যা চাওয়া হয়েছে, তার সব অংশের উত্তর দিয়েছি কি?'],
      content: ['প্রতিটি তথ্যের উৎস জানি কি? যাচাই হয়নি এমন তথ্য লিখিনি তো?'],
      structure: ['ভূমিকা, মূল আলোচনা ও উপসংহার — তিনটিই আছে কি?'],
      examples: ['প্রতিটি মূল যুক্তির সঙ্গে একটি উদাহরণ বা তথ্য দিয়েছি কি?'],
    },
    checklistEn: {
      relevance: ['Did I answer every part of what the question asked?'],
      content: ['Do I know the source of every fact? Did I avoid unverified facts?'],
      structure: ['Do I have an introduction, a main discussion and a conclusion?'],
      examples: ['Did I support each main point with an example or a fact?'],
    },
    commonMistakesSlotBn: 'প্রশ্নের বাইরে যাওয়া, যাচাই না করা তথ্য লেখা, ভূমিকা ছাড়া শুরু করা',
    commonMistakesSlotEn: 'Going off-topic, writing unverified facts, starting without an introduction',
  },
  'english-essay': {
    type: 'english-essay',
    nameBn: 'ইংরেজি প্রবন্ধ',
    nameEn: 'English essay',
    skeletonBn: PROSE_SKELETON_BN,
    skeletonEn: PROSE_SKELETON_EN,
    shape: 'prose',
    rubricWeights: RUBRIC_WEIGHT_PROFILES['english-essay'],
    checklistBn: {
      relevance: ['প্রশ্নে যা চাওয়া হয়েছে, তার সব অংশের উত্তর দিয়েছি কি?'],
      language: ['বাক্যগুলোর ব্যাকরণ ঠিক আছে কি? একই শব্দ বারবার ব্যবহার করিনি তো?'],
      structure: ['ভূমিকা, মূল আলোচনা ও উপসংহার — তিনটিই আছে কি?'],
    },
    checklistEn: {
      relevance: ['Did I answer every part of what the question asked?'],
      language: ['Is the grammar of each sentence correct? Did I avoid repeating the same word?'],
      structure: ['Do I have an introduction, a main discussion and a conclusion?'],
    },
    commonMistakesSlotBn: 'বিষয় থেকে সরে যাওয়া, ভুল tense, একই শব্দের পুনরাবৃত্তি',
    commonMistakesSlotEn: 'Going off-topic, wrong tense, repeating the same word',
  },
  paragraph: {
    type: 'paragraph',
    nameBn: 'অনুচ্ছেদ',
    nameEn: 'Paragraph',
    skeletonBn: ['মূল বাক্য (topic sentence)', 'সহায়ক বাক্য', 'সমাপনী বাক্য'],
    skeletonEn: ['Topic sentence', 'Supporting sentences', 'Concluding sentence'],
    shape: 'prose',
    rubricWeights: RUBRIC_WEIGHT_PROFILES.paragraph,
    checklistBn: {
      structure: ['একটিই অনুচ্ছেদে লিখেছি কি? মূল বাক্য প্রথমে আছে কি?'],
      relevance: ['মূল বাক্যের সঙ্গে সব বাক্যের সম্পর্ক আছে কি?'],
      completeness: ['মূল ভাবটি সম্পূর্ণ হয়েছে কি?'],
    },
    checklistEn: {
      structure: ['Did I write in a single paragraph, with the topic sentence first?'],
      relevance: ['Is every sentence related to the topic sentence?'],
      completeness: ['Is the main idea fully developed?'],
    },
    commonMistakesSlotBn: 'একাধিক মূল ভাব এক অনুচ্ছেদে, মূল বাক্য ছাড়া শুরু',
    commonMistakesSlotEn: 'More than one main idea in one paragraph, starting without a topic sentence',
  },
  'bangla-letter': {
    type: 'bangla-letter',
    nameBn: 'বাংলা পত্র',
    nameEn: 'Bangla letter',
    skeletonBn: ['ঠিকানা ও তারিখ', 'সম্বোধন', 'মূল বক্তব্য', 'সমাপনী ও স্বাক্ষর'],
    skeletonEn: ['Address and date', 'Salutation', 'Main body', 'Closing and signature'],
    shape: 'format-block',
    rubricWeights: RUBRIC_WEIGHT_PROFILES['bangla-letter'],
    checklistBn: {
      structure: ['ঠিকানা, তারিখ, সম্বোধন ও সমাপনী — সবকটি আছে কি?'],
      language: ['ভাষা প্রাপকের উপযোগী কি? বানান ঠিক আছে কি?'],
      relevance: ['চিঠির উদ্দেশ্যটি স্পষ্ট কি?'],
    },
    checklistEn: {
      structure: ['Do I have the address, date, salutation and closing?'],
      language: ['Is the language right for the recipient? Is the spelling correct?'],
      relevance: ['Is the purpose of the letter clear?'],
    },
    commonMistakesSlotBn: 'তারিখ বা ঠিকানা ভুলে যাওয়া, অশোভন ভাষা, উদ্দেশ্য অস্পষ্ট রাখা',
    commonMistakesSlotEn: 'Forgetting the date or address, impolite language, unclear purpose',
  },
  application: {
    type: 'application',
    nameBn: 'দরখাস্ত',
    nameEn: 'Application',
    skeletonBn: ['ঠিকানা ও তারিখ', 'বিষয় (subject line)', 'সম্বোধন', 'মূল বক্তব্য', 'বিনীত সমাপনী ও স্বাক্ষর'],
    skeletonEn: ['Address and date', 'Subject line', 'Salutation', 'Main body', 'Polite closing and signature'],
    shape: 'format-block',
    rubricWeights: RUBRIC_WEIGHT_PROFILES.application,
    checklistBn: {
      structure: ['বিষয়-লাইনটি স্পষ্ট কি? ঠিকানা ও তারিখ আছে কি?'],
      language: ['বিনীত ভাষা ব্যবহার করেছি কি? বানান ঠিক আছে কি?'],
      relevance: ['আবেদনের কারণটি প্রথম অনুচ্ছেদেই বলেছি কি?'],
    },
    checklistEn: {
      structure: ['Is the subject line clear? Do I have the address and date?'],
      language: ['Did I use polite language? Is the spelling correct?'],
      relevance: ['Did I state the reason for the application in the first paragraph?'],
    },
    commonMistakesSlotBn: 'বিষয়-লাইন না লেখা, দাবির ভাষা ব্যবহার করা, তারিখ ভুলে যাওয়া',
    commonMistakesSlotEn: 'Missing the subject line, demanding tone, forgetting the date',
  },
  'english-letter': {
    type: 'english-letter',
    nameBn: 'ইংরেজি পত্র',
    nameEn: 'English letter',
    skeletonBn: ['ঠিকানা ও তারিখ', 'সম্বোধন', 'মূল বক্তব্য', 'সমাপনী ও স্বাক্ষর'],
    skeletonEn: ['Address and date', 'Salutation', 'Main body', 'Closing and signature'],
    shape: 'format-block',
    rubricWeights: RUBRIC_WEIGHT_PROFILES['english-letter'],
    checklistBn: {
      structure: ['ঠিকানা, তারিখ, সম্বোধন ও সমাপনী — সবকটি আছে কি?'],
      language: ['বাক্যগুলোর ব্যাকরণ ঠিক আছে কি? ভাষা প্রাপকের উপযোগী কি?'],
      relevance: ['চিঠির উদ্দেশ্যটি স্পষ্ট কি?'],
    },
    checklistEn: {
      structure: ['Do I have the address, date, salutation and closing?'],
      language: ['Is the grammar correct? Is the language right for the recipient?'],
      relevance: ['Is the purpose of the letter clear?'],
    },
    commonMistakesSlotBn: 'ভুল salutation, তারিখের ধরন ভুল, উদ্দেশ্য অস্পষ্ট',
    commonMistakesSlotEn: 'Wrong salutation, wrong date format, unclear purpose',
  },
  translation: {
    type: 'translation',
    nameBn: 'অনুবাদ',
    nameEn: 'Translation',
    skeletonBn: ['মূল বাক্যের অর্থ বোঝা', 'শব্দচয়ন', 'স্বাভাবিক বাক্য গঠন'],
    skeletonEn: ['Understand the source meaning', 'Word choice', 'Natural sentence construction'],
    shape: 'prose',
    rubricWeights: RUBRIC_WEIGHT_PROFILES.translation,
    checklistBn: {
      relevance: ['মূল বাক্যের অর্থ পুরোপুরি এসেছে কি? কিছু বাদ পড়েনি তো?'],
      language: ['অনুবাদটি স্বাভাবিক বাংলায়/ইংরেজিতে পড়া যায় কি?'],
      content: ['কোনো শব্দের অর্থ ভুল করিনি তো?'],
    },
    checklistEn: {
      relevance: ['Did I carry the full meaning of the source? Did I leave anything out?'],
      language: ['Does the translation read naturally?'],
      content: ['Did I mistranslate any word?'],
    },
    commonMistakesSlotBn: 'শব্দ-শব্দ অনুবাদ, অর্থ বদলে যাওয়া, অস্বাভাবিক বাক্য',
    commonMistakesSlotEn: 'Word-for-word translation, changed meaning, unnatural sentences',
  },
  'math-solution': {
    type: 'math-solution',
    nameBn: 'গাণিতিক সমাধান',
    nameEn: 'Math solution',
    // E-4: steps, NOT intro-discussion-conclusion.
    skeletonBn: ['প্রদত্ত তথ্য', 'সূত্র/পদ্ধতি', 'ধাপে ধাপে সমাধান', 'একক', 'উত্তর যাচাই'],
    skeletonEn: ['Given data', 'Formula / method', 'Step-by-step working', 'Units', 'Answer check'],
    shape: 'method-steps',
    rubricWeights: RUBRIC_WEIGHT_PROFILES['math-solution'],
    checklistBn: {
      content: ['প্রতিটি ধাপের হিসাব ঠিক আছে কি? সূত্রটি ঠিক কি?'],
      structure: ['ধাপগুলো ক্রমানুযায়ী আছে কি?'],
      completeness: ['উত্তরের একক লিখেছি কি? উত্তরটি যাচাই করেছি কি?'],
    },
    checklistEn: {
      content: ['Is the arithmetic of every step correct? Is the formula right?'],
      structure: ['Are the steps in order?'],
      completeness: ['Did I write the unit of the answer? Did I check the answer?'],
    },
    commonMistakesSlotBn: 'সূত্র ভুল, একক না লেখা, উত্তর যাচাই না করা',
    commonMistakesSlotEn: 'Wrong formula, missing unit, no answer check',
  },
};

export function writtenTemplate(type: WrittenAnswerType): WrittenTemplate {
  return WRITTEN_TEMPLATES[type];
}

/** The self-check checklist for a template (§2.5): the same rubric
 * the teacher/AI later uses, so self-check trains the real
 * standard. A student's self-check is their own judgement, never a
 * score. */
export function selfCheckChecklist(type: WrittenAnswerType): Array<{
  dimension: RubricDimension;
  dimensionBn: string;
  dimensionEn: string;
  questionsBn: string[];
  questionsEn: string[];
}> {
  const template = WRITTEN_TEMPLATES[type];
  const dims = RUBRIC_DIMENSIONS.filter(
    (d) => template.checklistBn[d.key] !== undefined || template.checklistEn[d.key] !== undefined,
  );
  return dims.map((d) => ({
    dimension: d.key,
    dimensionBn: d.bn,
    dimensionEn: d.en,
    questionsBn: template.checklistBn[d.key] ?? [],
    questionsEn: template.checklistEn[d.key] ?? [],
  }));
}

/** Model-answer reference label (§2.4) — on every model answer. */
export const MODEL_ANSWER_LABEL = {
  bn: 'এটি একটি নমুনা উত্তর — একমাত্র সঠিক উত্তর নয়। ভিন্ন যুক্তি বা উদাহরণও সঠিক হতে পারে।',
  en: 'This is a sample answer — not the only correct answer. Different arguments or examples can also be correct.',
} as const;

/** Copy-paste warning (§2.3 step 8). */
export const MODEL_ANSWER_COPY_WARNING = {
  bn: 'মডেল উত্তর মুখস্থ করে লিখলে শেখা হয় না — নিজের ভাষায় লিখুন',
  en: 'Copying the model answer by heart does not teach — write in your own words',
} as const;

/**
 * Prohibited claims (§2.6) — enforced by a content test
 * (jobWritten.test.ts scans every template string + every
 * code-shaped question for these). AI must NEVER claim: AI marks =
 * an official examiner's marks; the model answer is the only
 * correct answer; every fact verified; a guaranteed score; perfect
 * evaluation of handwriting / examiner preferences / literary
 * quality; plagiarism just because an answer resembles the model
 * answer.
 */
export const WRITTEN_PROHIBITED_CLAIMS: string[] = [
  'Official Exam Result',
  'Examiner’s Marks',
  "Examiner's Marks",
  'Guaranteed Marks',
  'Final Evaluation',
  'সরকারি পরীক্ষকের মূল্যায়ন',
  'চূড়ান্ত নম্বর',
  'নিশ্চিত নম্বর',
  'এটাই একমাত্র সঠিক উত্তর',
  'is the only correct answer',
  'guaranteed score',
  'perfect evaluation of handwriting',
  'হাতের লেখার নিখুঁত মূল্যায়ন',
  'plagiarism',
  'চুরি করা উত্তর',
];

export function containsProhibitedClaim(text: string): string | null {
  const lower = text.toLowerCase();
  for (const claim of WRITTEN_PROHIBITED_CLAIMS) {
    if (lower.includes(claim.toLowerCase())) return claim;
  }
  return null;
}

/** Word count (English: whitespace split; Bangla: approximate —
 * labelled as such wherever shown). */
export function countWords(text: string): number {
  const trimmed = text.trim();
  if (trimmed === '') return 0;
  return trimmed.split(/\s+/).length;
}

/** Length status vs the guidance range — guidance, never a
 * pass/fail gate. An answer outside the range is not rejected. */
export function lengthStatusFor(
  marks: number,
  wordCount: number,
): 'within' | 'below' | 'above' | 'no-guidance' {
  const g = lengthGuidanceForMarks(marks);
  if (!g || g.wordsMin === null || g.wordsMax === null) return 'no-guidance';
  if (wordCount < g.wordsMin) return 'below';
  if (wordCount > g.wordsMax) return 'above';
  return 'within';
}
