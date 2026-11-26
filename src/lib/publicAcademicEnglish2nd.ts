// Eduvelto — Academic English 2nd Paper practice questions (Class 9),
// verified against the Dakhil NCTB books (review 26 Nov 2026).
//
// Static data ONLY — zero Firestore reads. The 21 questions are the
// Academic Class 9 English 2nd Paper drafts AFTER review (see
// review-academic-c9-english-2nd-verdicts.json and
// review-academic-c9-fixes-applied.md in
// ~/workspace/eduorbit/sprint-1week-2026-11-25/).
//
// CAVEAT: the Class 9 review was verified against DAKHIL editions —
// no general NCTB Class 9-10 book set exists in the workspace. The
// questions are verified against the Dakhil books + standard
// references + the SSC syllabus topic. Whether Class 9-10 content
// serves the general SSC audience or the Dakhil audience is an owner
// decision still owed (after his exams).
//
// HONESTY: these are ORIGINAL practice questions written for the
// NCTB lessons — NOT board / university / previous-year questions.
// Every question was checked against its cited NCTB book lesson.
// The draft files' `status` field still says NEEDS-REVIEW — the
// verdict files are the review record, and this file contains ONLY
// the verified questions (VERIFIED as-is + NEEDS-FIX items with
// their fixes applied). Every question in this batch passed review — no question was skipped.
//
// HOW NEW BATCHES JOIN: append the next verified batch's questions
// to PUBLIC_ACADEMIC_ENGLISH_2ND_QUESTIONS below (same shape, same generation
// script with the new draft + verdict files). Chapters, counts and
// the practice pages are DERIVED from the combined pool in
// src/lib/publicAcademic.ts, so no component or route change is
// needed when a batch is verified. NEVER add a question whose
// verdict is not VERIFIED (or NEEDS-FIX with the fix applied) —
// unverified drafts must never reach students. The Class 9
// questions also serve Class 10 (same combined class-9-10 draft
// set — there is NO separate Class 10 set): the pool holds each
// question ONCE under classId 'class-9', and publicAcademic.ts /
// questionPaper.ts / scripts/prerender.mjs map 'class-10' to the
// Class 9 pool for these subjects.

import { type PublicAcademicQuestion } from './publicAcademic';

/** All verified Academic English 2nd Paper questions, Class 9 (in draft order). */
export const PUBLIC_ACADEMIC_ENGLISH_2ND_QUESTIONS: PublicAcademicQuestion[] = [
  {
    id: "ACAD-0031",
    classId: "class-9",
    subjectId: "english-2nd",
    chapterId: "acad-class-9-eng-2nd-topic-1",
    chapterName: "Tense",
    unitNumber: 1,
    topicId: "topic-1",
    questionText: "Choose the correct form: He ___ to school every day.",
    options: [
      { letter: "A", text: "goes" },
      { letter: "B", text: "gone" },
      { letter: "C", text: "going" },
      { letter: "D", text: "go" }
    ],
    correctLetter: "A",
    explanation: "Third person singular in the present simple takes 'goes'.",
    difficulty: "easy",
    sourceNote: "NCTB English Grammar and Composition — Tense",
  },
  {
    id: "ACAD-0032",
    classId: "class-9",
    subjectId: "english-2nd",
    chapterId: "acad-class-9-eng-2nd-topic-2",
    chapterName: "Articles",
    unitNumber: 2,
    topicId: "topic-2",
    questionText: "Choose the correct article: ___ honest man is respected everywhere.",
    options: [
      { letter: "A", text: "An" },
      { letter: "B", text: "A" },
      { letter: "C", text: "The" },
      { letter: "D", text: "No article" }
    ],
    correctLetter: "A",
    explanation: "'Honest' begins with a vowel sound (the 'h' is silent), so 'an' is used.",
    difficulty: "medium",
    sourceNote: "NCTB English Grammar and Composition — Articles",
  },
  {
    id: "ACAD-0033",
    classId: "class-9",
    subjectId: "english-2nd",
    chapterId: "acad-class-9-eng-2nd-topic-3",
    chapterName: "Prepositions",
    unitNumber: 3,
    topicId: "topic-3",
    questionText: "She is weak ___ English.",
    options: [
      { letter: "A", text: "at" },
      { letter: "B", text: "in" },
      { letter: "C", text: "on" },
      { letter: "D", text: "of" }
    ],
    correctLetter: "B",
    explanation: "The correct preposition after weak is in.",
    difficulty: "medium",
    sourceNote: "NCTB English Grammar and Composition — Prepositions",
  },
  {
    id: "ACAD-0034",
    classId: "class-9",
    subjectId: "english-2nd",
    chapterId: "acad-class-9-eng-2nd-topic-4",
    chapterName: "Voice",
    unitNumber: 4,
    topicId: "topic-4",
    questionText: "Change to passive: 'She writes a letter.'",
    options: [
      { letter: "A", text: "A letter is written by her." },
      { letter: "B", text: "A letter has written by her." },
      { letter: "C", text: "A letter was written by her." },
      { letter: "D", text: "A letter is wrote by her." }
    ],
    correctLetter: "A",
    explanation: "Present simple passive: object + is/am/are + past participle — 'A letter is written by her.'",
    difficulty: "medium",
    sourceNote: "NCTB English Grammar and Composition — Voice",
  },
  {
    id: "ACAD-0035",
    classId: "class-9",
    subjectId: "english-2nd",
    chapterId: "acad-class-9-eng-2nd-topic-5",
    chapterName: "Narration",
    unitNumber: 5,
    topicId: "topic-5",
    questionText: "He said, 'I am busy.' (Indirect)",
    options: [
      { letter: "A", text: "He told that he is busy." },
      { letter: "B", text: "He said that I was busy." },
      { letter: "C", text: "He said that he was busy." },
      { letter: "D", text: "He said that he is busy." }
    ],
    correctLetter: "C",
    explanation: "In indirect speech the present simple shifts to past simple and the pronoun changes: 'he was busy'.",
    difficulty: "medium",
    sourceNote: "NCTB English Grammar and Composition — Narration",
  },
  {
    id: "ACAD-0036",
    classId: "class-9",
    subjectId: "english-2nd",
    chapterId: "acad-class-9-eng-2nd-topic-6",
    chapterName: "Right form of verbs",
    unitNumber: 6,
    topicId: "topic-6",
    questionText: "It is high time we ___ the decision.",
    options: [
      { letter: "A", text: "will take" },
      { letter: "B", text: "taking" },
      { letter: "C", text: "take" },
      { letter: "D", text: "took" }
    ],
    correctLetter: "D",
    explanation: "After 'It is high time' the past indefinite form is used.",
    difficulty: "hard",
    sourceNote: "NCTB English Grammar and Composition — Right form of verbs",
  },
  {
    id: "ACAD-0037",
    classId: "class-9",
    subjectId: "english-2nd",
    chapterId: "acad-class-9-eng-2nd-topic-7",
    chapterName: "Conditional",
    unitNumber: 7,
    topicId: "topic-7",
    questionText: "If he worked hard, he ___ succeed.",
    options: [
      { letter: "A", text: "shall" },
      { letter: "B", text: "will" },
      { letter: "C", text: "can" },
      { letter: "D", text: "would" }
    ],
    correctLetter: "D",
    explanation: "In a second conditional sentence, would is used in the main clause.",
    difficulty: "medium",
    sourceNote: "NCTB English Grammar and Composition — Conditional sentences",
  },
  {
    id: "ACAD-0038",
    classId: "class-9",
    subjectId: "english-2nd",
    chapterId: "acad-class-9-eng-2nd-topic-8",
    chapterName: "Tag question",
    unitNumber: 8,
    topicId: "topic-8",
    questionText: "She is a teacher, ___?",
    options: [
      { letter: "A", text: "is she" },
      { letter: "B", text: "doesn't she" },
      { letter: "C", text: "isn't she" },
      { letter: "D", text: "aren't she" }
    ],
    correctLetter: "C",
    explanation: "A positive statement takes a negative tag with the same auxiliary: 'isn't she?'",
    difficulty: "easy",
    sourceNote: "NCTB English Grammar and Composition — Tag questions",
  },
  {
    id: "ACAD-0039",
    classId: "class-9",
    subjectId: "english-2nd",
    chapterId: "acad-class-9-eng-2nd-topic-9",
    chapterName: "Suffix/Prefix",
    unitNumber: 9,
    topicId: "topic-9",
    questionText: "The noun form of 'honest' is —",
    options: [
      { letter: "A", text: "honestness" },
      { letter: "B", text: "dishonest" },
      { letter: "C", text: "honesty" },
      { letter: "D", text: "honestly" }
    ],
    correctLetter: "C",
    explanation: "'Honesty' is the noun; 'honestly' is the adverb and 'dishonest' the opposite adjective.",
    difficulty: "easy",
    sourceNote: "NCTB English Grammar and Composition — Suffix and prefix",
  },
  {
    id: "ACAD-0040",
    classId: "class-9",
    subjectId: "english-2nd",
    chapterId: "acad-class-9-eng-2nd-topic-10",
    chapterName: "Composition — Paragraph",
    unitNumber: 10,
    topicId: "topic-10",
    questionText: "A good paragraph mainly needs —",
    options: [
      { letter: "A", text: "unity of one main idea" },
      { letter: "B", text: "many unrelated ideas" },
      { letter: "C", text: "no topic sentence" },
      { letter: "D", text: "only long sentences" }
    ],
    correctLetter: "A",
    explanation: "A paragraph develops one main idea with unity, a topic sentence and supporting details.",
    difficulty: "easy",
    sourceNote: "NCTB English Grammar and Composition — Paragraph writing",
  },
  {
    id: "ACAD-5037",
    classId: "class-9",
    subjectId: "english-2nd",
    chapterId: "acad-class-9-eng-2nd-topic-1",
    chapterName: "Tense",
    unitNumber: 1,
    topicId: "topic-1",
    questionText: "Choose the correct form: I ___ here since 2015.",
    options: [
      { letter: "A", text: "am living" },
      { letter: "B", text: "have lived" },
      { letter: "C", text: "lived" },
      { letter: "D", text: "live" }
    ],
    correctLetter: "B",
    explanation: "With 'since' + past point, present perfect is used: 'have lived'.",
    difficulty: "medium",
    sourceNote: "NCTB English Grammar and Composition — Tense",
  },
  {
    id: "ACAD-5038",
    classId: "class-9",
    subjectId: "english-2nd",
    chapterId: "acad-class-9-eng-2nd-topic-2",
    chapterName: "Articles",
    unitNumber: 2,
    topicId: "topic-2",
    questionText: "Choose the correct article: He is ___ honest boy.",
    options: [
      { letter: "A", text: "a" },
      { letter: "B", text: "an" },
      { letter: "C", text: "the" },
      { letter: "D", text: "no article" }
    ],
    correctLetter: "B",
    explanation: "'Honest' begins with a vowel sound (silent h), so 'an' is used.",
    difficulty: "medium",
    sourceNote: "NCTB English Grammar and Composition — Articles",
  },
  {
    id: "ACAD-5040",
    classId: "class-9",
    subjectId: "english-2nd",
    chapterId: "acad-class-9-eng-2nd-topic-4",
    chapterName: "Voice",
    unitNumber: 4,
    topicId: "topic-4",
    questionText: "Change to passive: 'They play football.'",
    options: [
      { letter: "A", text: "Football is played by them." },
      { letter: "B", text: "Football has played by them." },
      { letter: "C", text: "Football is play by them." },
      { letter: "D", text: "Football was played by them." }
    ],
    correctLetter: "A",
    explanation: "Present simple passive: is + past participle.",
    difficulty: "medium",
    sourceNote: "NCTB English Grammar and Composition — Voice",
  },
  {
    id: "ACAD-5041",
    classId: "class-9",
    subjectId: "english-2nd",
    chapterId: "acad-class-9-eng-2nd-topic-5",
    chapterName: "Narration",
    unitNumber: 5,
    topicId: "topic-5",
    questionText: "She said, 'I will go.' (Indirect)",
    options: [
      { letter: "A", text: "She told that she will go." },
      { letter: "B", text: "She said that she would go." },
      { letter: "C", text: "She said that I would go." },
      { letter: "D", text: "She said that she will go." }
    ],
    correctLetter: "B",
    explanation: "'Will' becomes 'would' in indirect speech.",
    difficulty: "medium",
    sourceNote: "NCTB English Grammar and Composition — Narration",
  },
  {
    id: "ACAD-5042",
    classId: "class-9",
    subjectId: "english-2nd",
    chapterId: "acad-class-9-eng-2nd-topic-6",
    chapterName: "Right form of verbs",
    unitNumber: 6,
    topicId: "topic-6",
    questionText: "Had I been rich, I ___ helped you.",
    options: [
      { letter: "A", text: "have" },
      { letter: "B", text: "will have" },
      { letter: "C", text: "would" },
      { letter: "D", text: "would have" }
    ],
    correctLetter: "D",
    explanation: "Third conditional: Had + past participle, would have + past participle.",
    difficulty: "hard",
    sourceNote: "NCTB English Grammar and Composition — Right form of verbs",
  },
  {
    id: "ACAD-5043",
    classId: "class-9",
    subjectId: "english-2nd",
    chapterId: "acad-class-9-eng-2nd-topic-7",
    chapterName: "Conditional",
    unitNumber: 7,
    topicId: "topic-7",
    questionText: "If I were you, I ___ apologize.",
    options: [
      { letter: "A", text: "would" },
      { letter: "B", text: "shall" },
      { letter: "C", text: "will" },
      { letter: "D", text: "can" }
    ],
    correctLetter: "A",
    explanation: "Second conditional: If + past simple, would + verb.",
    difficulty: "medium",
    sourceNote: "NCTB English Grammar and Composition — Conditional sentences",
  },
  {
    id: "ACAD-5044",
    classId: "class-9",
    subjectId: "english-2nd",
    chapterId: "acad-class-9-eng-2nd-topic-8",
    chapterName: "Tag question",
    unitNumber: 8,
    topicId: "topic-8",
    questionText: "Nobody called, ___?",
    options: [
      { letter: "A", text: "did he" },
      { letter: "B", text: "did they" },
      { letter: "C", text: "didn't they" },
      { letter: "D", text: "doesn't he" }
    ],
    correctLetter: "B",
    explanation: "'Nobody' is negative in sense, so the tag is positive: 'did they?'",
    difficulty: "medium",
    sourceNote: "NCTB English Grammar and Composition — Tag questions",
  },
  {
    id: "ACAD-5045",
    classId: "class-9",
    subjectId: "english-2nd",
    chapterId: "acad-class-9-eng-2nd-topic-9",
    chapterName: "Suffix/Prefix",
    unitNumber: 9,
    topicId: "topic-9",
    questionText: "The noun form of 'strong' is —",
    options: [
      { letter: "A", text: "strongly" },
      { letter: "B", text: "strongness" },
      { letter: "C", text: "strengthen" },
      { letter: "D", text: "strength" }
    ],
    correctLetter: "D",
    explanation: "'Strength' is the noun; 'strongly' the adverb; 'strengthen' the verb.",
    difficulty: "medium",
    sourceNote: "NCTB English Grammar and Composition — Suffix and prefix",
  },
  {
    id: "ACAD-5046",
    classId: "class-9",
    subjectId: "english-2nd",
    chapterId: "acad-class-9-eng-2nd-topic-11",
    chapterName: "Transformation",
    unitNumber: 11,
    topicId: "topic-11",
    questionText: "Change to negative: 'He is always honest.'",
    options: [
      { letter: "A", text: "He is never honest." },
      { letter: "B", text: "He is always not honest." },
      { letter: "C", text: "He is never dishonest." },
      { letter: "D", text: "He is not always honest." }
    ],
    correctLetter: "C",
    explanation: "The negative without changing meaning: 'He is never dishonest.'",
    difficulty: "medium",
    sourceNote: "NCTB English Grammar and Composition — Transformation",
  },
  {
    id: "ACAD-5047",
    classId: "class-9",
    subjectId: "english-2nd",
    chapterId: "acad-class-9-eng-2nd-topic-12",
    chapterName: "Completing sentence",
    unitNumber: 12,
    topicId: "topic-12",
    questionText: "Complete: 'Though he is poor, ___'",
    options: [
      { letter: "A", text: "he is dishonest" },
      { letter: "B", text: "he is rich" },
      { letter: "C", text: "he is honest" },
      { letter: "D", text: "he is lazy" }
    ],
    correctLetter: "C",
    explanation: "'Though' introduces contrast; the honest poor man is the natural completion.",
    difficulty: "medium",
    sourceNote: "NCTB English Grammar and Composition — Completing sentences",
  },
  {
    id: "ACAD-5048",
    classId: "class-9",
    subjectId: "english-2nd",
    chapterId: "acad-class-9-eng-2nd-topic-13",
    chapterName: "Composition — CV",
    unitNumber: 13,
    topicId: "topic-13",
    questionText: "A CV mainly contains —",
    options: [
      { letter: "A", text: "only photos" },
      { letter: "B", text: "only certificates" },
      { letter: "C", text: "only hobbies" },
      { letter: "D", text: "personal and academic details" }
    ],
    correctLetter: "D",
    explanation: "A CV lists personal details, education, skills and experience.",
    difficulty: "easy",
    sourceNote: "NCTB English Grammar and Composition — CV writing",
  },
];
