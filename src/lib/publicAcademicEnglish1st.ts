// Eduvelto — Academic English 1st Paper practice questions (Class 9),
// verified against the Dakhil NCTB books (review 26 Nov 2026).
//
// Static data ONLY — zero Firestore reads. The 22 questions are the
// Academic Class 9 English 1st Paper drafts AFTER review (see
// review-academic-c9-english-1st-verdicts.json and
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
// to PUBLIC_ACADEMIC_ENGLISH_1ST_QUESTIONS below (same shape, same generation
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

/** All verified Academic English 1st Paper questions, Class 9 (in draft order). */
export const PUBLIC_ACADEMIC_ENGLISH_1ST_QUESTIONS: PublicAcademicQuestion[] = [
  {
    id: "ACAD-0021",
    classId: "class-9",
    subjectId: "english-1st",
    chapterId: "acad-class-9-eng-1st-topic-1",
    chapterName: "Reading — Good citizens",
    unitNumber: 1,
    topicId: "topic-1",
    questionText: "A good citizen is someone who —",
    options: [
      { letter: "A", text: "obeys the law and helps others" },
      { letter: "B", text: "never speaks in public" },
      { letter: "C", text: "only pays taxes" },
      { letter: "D", text: "lives alone" }
    ],
    correctLetter: "A",
    explanation: "A good citizen obeys the law, respects others and contributes to society.",
    difficulty: "easy",
    sourceNote: "NCTB English For Today, Class 9-10 — Unit One: Sense of Self",
  },
  {
    id: "ACAD-0022",
    classId: "class-9",
    subjectId: "english-1st",
    chapterId: "acad-class-9-eng-1st-topic-2",
    chapterName: "Vocabulary",
    unitNumber: 2,
    topicId: "topic-2",
    questionText: "Choose the synonym of 'large'.",
    options: [
      { letter: "A", text: "Short" },
      { letter: "B", text: "Little" },
      { letter: "C", text: "Big" },
      { letter: "D", text: "Small" }
    ],
    correctLetter: "C",
    explanation: "'Large' means big in size, so its synonym is 'Big'.",
    difficulty: "easy",
    sourceNote: "NCTB English For Today, Class 9-10 — vocabulary in reading texts",
  },
  {
    id: "ACAD-0023",
    classId: "class-9",
    subjectId: "english-1st",
    chapterId: "acad-class-9-eng-1st-topic-3",
    chapterName: "Reading — Environment",
    unitNumber: 3,
    topicId: "topic-3",
    questionText: "Which of these is a major cause of environmental pollution?",
    options: [
      { letter: "A", text: "using solar power" },
      { letter: "B", text: "burning fossil fuels" },
      { letter: "C", text: "planting trees" },
      { letter: "D", text: "recycling paper" }
    ],
    correctLetter: "B",
    explanation: "Burning fossil fuels releases harmful gases and is a major cause of air pollution.",
    difficulty: "medium",
    sourceNote: "NCTB English For Today, Class 9-10 — Unit: Environment and nature",
  },
  {
    id: "ACAD-0024",
    classId: "class-9",
    subjectId: "english-1st",
    chapterId: "acad-class-9-eng-1st-topic-4",
    chapterName: "Reading — Pastimes",
    unitNumber: 4,
    topicId: "topic-4",
    questionText: "Which one is an indoor pastime?",
    options: [
      { letter: "A", text: "playing football" },
      { letter: "B", text: "reading books" },
      { letter: "C", text: "cycling" },
      { letter: "D", text: "swimming" }
    ],
    correctLetter: "B",
    explanation: "Reading books is done indoors, while the others are outdoor activities.",
    difficulty: "easy",
    sourceNote: "NCTB English For Today, Class 9-10 — Unit: Pastimes",
  },
  {
    id: "ACAD-0025",
    classId: "class-9",
    subjectId: "english-1st",
    chapterId: "acad-class-9-eng-1st-topic-5",
    chapterName: "Comprehension — May Day",
    unitNumber: 5,
    topicId: "topic-5",
    questionText: "May Day is observed to honour —",
    options: [
      { letter: "A", text: "the workers" },
      { letter: "B", text: "the farmers only" },
      { letter: "C", text: "the students" },
      { letter: "D", text: "the soldiers" }
    ],
    correctLetter: "A",
    explanation: "May Day (1 May) honours the struggles and rights of workers around the world.",
    difficulty: "medium",
    sourceNote: "NCTB English For Today, Class 9-10 — Unit: May Day",
  },
  {
    id: "ACAD-0026",
    classId: "class-9",
    subjectId: "english-1st",
    chapterId: "acad-class-9-eng-1st-topic-2",
    chapterName: "Vocabulary",
    unitNumber: 2,
    topicId: "topic-2",
    questionText: "Choose the antonym of 'cold'.",
    options: [
      { letter: "A", text: "Cool" },
      { letter: "B", text: "Chilly" },
      { letter: "C", text: "Hot" },
      { letter: "D", text: "Warm" }
    ],
    correctLetter: "C",
    explanation: "'Cold' means having a low temperature, so its antonym is 'Hot'.",
    difficulty: "medium",
    sourceNote: "NCTB English For Today, Class 9-10 — vocabulary in reading texts",
  },
  {
    id: "ACAD-0027",
    classId: "class-9",
    subjectId: "english-1st",
    chapterId: "acad-class-9-eng-1st-topic-6",
    chapterName: "Reading — Education",
    unitNumber: 6,
    topicId: "topic-6",
    questionText: "Education helps a person to —",
    options: [
      { letter: "A", text: "think and act wisely" },
      { letter: "B", text: "avoid all work" },
      { letter: "C", text: "earn money only" },
      { letter: "D", text: "live without friends" }
    ],
    correctLetter: "A",
    explanation: "Education develops thinking, character and the ability to act wisely — its value goes beyond earning.",
    difficulty: "easy",
    sourceNote: "NCTB English For Today, Class 9-10 — Unit: Education and life",
  },
  {
    id: "ACAD-0028",
    classId: "class-9",
    subjectId: "english-1st",
    chapterId: "acad-class-9-eng-1st-topic-7",
    chapterName: "Grammar in context",
    unitNumber: 7,
    topicId: "topic-7",
    questionText: "Choose the correct sentence.",
    options: [
      { letter: "A", text: "She has been reading since morning." },
      { letter: "B", text: "She has read since morning." },
      { letter: "C", text: "She is reading since morning." },
      { letter: "D", text: "She has been reading from morning." }
    ],
    correctLetter: "A",
    explanation: "With 'since' + point of time, the present perfect continuous is used: 'has been reading since morning'.",
    difficulty: "medium",
    sourceNote: "NCTB English For Today, Class 9-10 — tense in context",
  },
  {
    id: "ACAD-0029",
    classId: "class-9",
    subjectId: "english-1st",
    chapterId: "acad-class-9-eng-1st-topic-8",
    chapterName: "Reading — Media",
    unitNumber: 8,
    topicId: "topic-8",
    questionText: "Newspapers, radio and television are examples of —",
    options: [
      { letter: "A", text: "mass media" },
      { letter: "B", text: "school subjects" },
      { letter: "C", text: "sports" },
      { letter: "D", text: "social customs" }
    ],
    correctLetter: "A",
    explanation: "These channels reach large audiences at once, so they are called mass media.",
    difficulty: "medium",
    sourceNote: "NCTB English For Today, Class 9-10 — Unit: Media and modes of communication",
  },
  {
    id: "ACAD-0030",
    classId: "class-9",
    subjectId: "english-1st",
    chapterId: "acad-class-9-eng-1st-topic-9",
    chapterName: "Writing — Letter",
    unitNumber: 9,
    topicId: "topic-9",
    questionText: "A formal letter begins with —",
    options: [
      { letter: "A", text: "a quotation only" },
      { letter: "B", text: "a poem" },
      { letter: "C", text: "a joke" },
      { letter: "D", text: "a formal salutation such as 'Dear Sir,'" }
    ],
    correctLetter: "D",
    explanation: "A formal letter opens with a respectful salutation like 'Dear Sir,' followed by the subject.",
    difficulty: "easy",
    sourceNote: "NCTB English For Today, Class 9-10 — writing: letters",
  },
  {
    id: "ACAD-5025",
    classId: "class-9",
    subjectId: "english-1st",
    chapterId: "acad-class-9-eng-1st-topic-10",
    chapterName: "Reading — Festivals",
    unitNumber: 10,
    topicId: "topic-10",
    questionText: "Pahela Boishakh is celebrated on —",
    options: [
      { letter: "A", text: "1 January" },
      { letter: "B", text: "16 December" },
      { letter: "C", text: "21 February" },
      { letter: "D", text: "14 April" }
    ],
    correctLetter: "D",
    explanation: "Pahela Boishakh, the Bangla New Year, falls on 14 April.",
    difficulty: "easy",
    sourceNote: "NCTB English For Today — Unit: Festivals",
  },
  {
    id: "ACAD-5026",
    classId: "class-9",
    subjectId: "english-1st",
    chapterId: "acad-class-9-eng-1st-topic-11",
    chapterName: "Reading — Health",
    unitNumber: 11,
    topicId: "topic-11",
    questionText: "Which habit keeps the body healthy?",
    options: [
      { letter: "A", text: "Regular exercise" },
      { letter: "B", text: "Skipping meals" },
      { letter: "C", text: "Eating only sweets" },
      { letter: "D", text: "Sleeping all day" }
    ],
    correctLetter: "A",
    explanation: "Regular exercise, balanced food and enough sleep keep the body healthy.",
    difficulty: "medium",
    sourceNote: "NCTB English For Today — Unit: Health",
  },
  {
    id: "ACAD-5027",
    classId: "class-9",
    subjectId: "english-1st",
    chapterId: "acad-class-9-eng-1st-topic-12",
    chapterName: "Reading — Science",
    unitNumber: 12,
    topicId: "topic-12",
    questionText: "The computer was invented to —",
    options: [
      { letter: "A", text: "play music only" },
      { letter: "B", text: "process information quickly" },
      { letter: "C", text: "cook food" },
      { letter: "D", text: "wash clothes" }
    ],
    correctLetter: "B",
    explanation: "Computers process and store information at great speed.",
    difficulty: "medium",
    sourceNote: "NCTB English For Today — Unit: Science and technology",
  },
  {
    id: "ACAD-5028",
    classId: "class-9",
    subjectId: "english-1st",
    chapterId: "acad-class-9-eng-1st-topic-2",
    chapterName: "Vocabulary",
    unitNumber: 2,
    topicId: "topic-2",
    questionText: "The brave soldier fought well. 'Brave' means —",
    options: [
      { letter: "A", text: "cowardly" },
      { letter: "B", text: "fearless" },
      { letter: "C", text: "timid" },
      { letter: "D", text: "weak" }
    ],
    correctLetter: "B",
    explanation: "'Brave' means fearless.",
    difficulty: "easy",
    sourceNote: "NCTB English For Today — vocabulary",
  },
  {
    id: "ACAD-5029",
    classId: "class-9",
    subjectId: "english-1st",
    chapterId: "acad-class-9-eng-1st-topic-2",
    chapterName: "Vocabulary",
    unitNumber: 2,
    topicId: "topic-2",
    questionText: "Choose the antonym of 'modern'.",
    options: [
      { letter: "A", text: "recent" },
      { letter: "B", text: "new" },
      { letter: "C", text: "ancient" },
      { letter: "D", text: "current" }
    ],
    correctLetter: "C",
    explanation: "'Modern' means new or recent; its opposite is 'ancient'.",
    difficulty: "medium",
    sourceNote: "NCTB English For Today — vocabulary",
  },
  {
    id: "ACAD-5030",
    classId: "class-9",
    subjectId: "english-1st",
    chapterId: "acad-class-9-eng-1st-topic-13",
    chapterName: "Reading — Nature",
    unitNumber: 13,
    topicId: "topic-13",
    questionText: "The Sundarbans is the largest —",
    options: [
      { letter: "A", text: "mountain range" },
      { letter: "B", text: "coral island" },
      { letter: "C", text: "mangrove forest" },
      { letter: "D", text: "desert" }
    ],
    correctLetter: "C",
    explanation: "The Sundarbans is the world's largest mangrove forest.",
    difficulty: "medium",
    sourceNote: "NCTB English For Today — Unit: Nature",
  },
  {
    id: "ACAD-5031",
    classId: "class-9",
    subjectId: "english-1st",
    chapterId: "acad-class-9-eng-1st-topic-14",
    chapterName: "Reading — Travel",
    unitNumber: 14,
    topicId: "topic-14",
    questionText: "Saint Martin's Island is famous as —",
    options: [
      { letter: "A", text: "a tea garden" },
      { letter: "B", text: "a mangrove forest" },
      { letter: "C", text: "a hill tract" },
      { letter: "D", text: "a coral island" }
    ],
    correctLetter: "D",
    explanation: "Saint Martin's is Bangladesh's only coral island.",
    difficulty: "easy",
    sourceNote: "NCTB English For Today — Unit: Travel",
  },
  {
    id: "ACAD-5032",
    classId: "class-9",
    subjectId: "english-1st",
    chapterId: "acad-class-9-eng-1st-topic-7",
    chapterName: "Grammar in context",
    unitNumber: 7,
    topicId: "topic-7",
    questionText: "Which sentence correctly uses 'one of' with a singular verb?",
    options: [
      { letter: "A", text: "One of my friends are a doctor." },
      { letter: "B", text: "One of my friends is a doctor." },
      { letter: "C", text: "One of my friends is doctors." },
      { letter: "D", text: "One of my friends are doctors." }
    ],
    correctLetter: "B",
    explanation: "'One of' takes a singular verb: 'One of my friends is a doctor.'",
    difficulty: "medium",
    sourceNote: "NCTB English For Today — grammar in context",
  },
  {
    id: "ACAD-5033",
    classId: "class-9",
    subjectId: "english-1st",
    chapterId: "acad-class-9-eng-1st-topic-15",
    chapterName: "Reading — People Who Stand Out",
    unitNumber: 15,
    topicId: "topic-15",
    questionText: "Mother Teresa is remembered for —",
    options: [
      { letter: "A", text: "leading a political movement" },
      { letter: "B", text: "discovering a new medicine" },
      { letter: "C", text: "serving the poor and the sick" },
      { letter: "D", text: "writing famous novels" }
    ],
    correctLetter: "C",
    explanation: "Mother Teresa devoted her life to caring for the poorest of the poor in Kolkata; she founded the Missionaries of Charity and the home 'Nirmal Hriday' for the dying destitute, and received the Nobel Peace Prize in 1979.",
    difficulty: "medium",
    sourceNote: "NCTB English For Today, Class 9-10 — Unit Seven: People Who Stand Out (Lessons 3–5: Mother Teresa)",
  },
  {
    id: "ACAD-5034",
    classId: "class-9",
    subjectId: "english-1st",
    chapterId: "acad-class-9-eng-1st-topic-16",
    chapterName: "Reading — Disasters",
    unitNumber: 16,
    topicId: "topic-16",
    questionText: "Cyclone shelters are built to —",
    options: [
      { letter: "A", text: "hold meetings" },
      { letter: "B", text: "store food only" },
      { letter: "C", text: "house animals" },
      { letter: "D", text: "protect people during cyclones" }
    ],
    correctLetter: "D",
    explanation: "Cyclone shelters protect coastal people during storms.",
    difficulty: "easy",
    sourceNote: "NCTB English For Today — Unit: Natural disasters",
  },
  {
    id: "ACAD-5035",
    classId: "class-9",
    subjectId: "english-1st",
    chapterId: "acad-class-9-eng-1st-topic-17",
    chapterName: "Writing — Dialogue",
    unitNumber: 17,
    topicId: "topic-17",
    questionText: "A dialogue is —",
    options: [
      { letter: "A", text: "a poem" },
      { letter: "B", text: "a story" },
      { letter: "C", text: "a letter" },
      { letter: "D", text: "a conversation between two or more people" }
    ],
    correctLetter: "D",
    explanation: "Dialogue presents direct conversation between speakers.",
    difficulty: "easy",
    sourceNote: "NCTB English For Today — writing: dialogue",
  },
  {
    id: "ACAD-5036",
    classId: "class-9",
    subjectId: "english-1st",
    chapterId: "acad-class-9-eng-1st-topic-18",
    chapterName: "Reading — Sports",
    unitNumber: 18,
    topicId: "topic-18",
    questionText: "Cricket is played with —",
    options: [
      { letter: "A", text: "a net only" },
      { letter: "B", text: "a bat and a ball" },
      { letter: "C", text: "a stick and a puck" },
      { letter: "D", text: "a racket" }
    ],
    correctLetter: "B",
    explanation: "Cricket uses a bat, a ball, wickets and 11 players a side.",
    difficulty: "medium",
    sourceNote: "NCTB English For Today — Unit: Sports",
  },
];
