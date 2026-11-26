// Eduvelto — Academic Statistics practice questions (Class 11),
// verified for fact correctness + on-syllabus (review 26 Nov 2026).
//
// Static data ONLY — zero Firestore reads. The 22 questions are the
// Academic Class 11 Statistics drafts AFTER review (see
// review-academic-c11-12-statistics-verdicts.json and
// review-academic-c11-12-fixes-applied.md in
// ~/workspace/eduorbit/sprint-1week-2026-11-25/).
//
// CAVEAT: NO HSC book exists in the workspace — VERIFIED here means
// "fact correct per a standard reference + topic within the cited HSC
// syllabus", NOT "confirmed against the book lesson". A teacher with
// the actual HSC books should spot-check before publication,
// especially the re-cited chapters.
//
// HONESTY: these are ORIGINAL practice questions written for the
// NCTB lessons — NOT board / university / previous-year questions.
// Every question was checked against its cited HSC syllabus topic +
// a standard reference. The draft files' `status` field still says
// NEEDS-REVIEW — the verdict files are the review record, and this
// file contains ONLY the verified questions (VERIFIED as-is +
// NEEDS-FIX items with their fixes applied). Every question in this batch passed review — no question was skipped.
//
// HOW NEW BATCHES JOIN: append the next verified batch's questions
// to PUBLIC_ACADEMIC_STATISTICS_QUESTIONS below (same shape, same generation
// script with the new draft + verdict files). Chapters, counts and
// the practice pages are DERIVED from the combined pool in
// src/lib/publicAcademic.ts, so no component or route change is
// needed when a batch is verified. NEVER add a question whose
// verdict is not VERIFIED (or NEEDS-FIX with the fix applied) —
// unverified drafts must never reach students. The Class 11
// questions also serve Class 12 (same combined class-11-12 draft
// set — there is NO separate Class 12 set): the pool holds each
// question ONCE under classId 'class-11', and publicAcademic.ts /
// questionPaper.ts / scripts/prerender.mjs map 'class-12' to the
// Class 11 pool for these subjects.

import { type PublicAcademicQuestion } from './publicAcademic';

/** All verified Academic Statistics questions, Class 11 (in draft order). */
export const PUBLIC_ACADEMIC_STATISTICS_QUESTIONS: PublicAcademicQuestion[] = [
  {
    id: "ACAD-3081",
    classId: "class-11",
    subjectId: "statistics",
    chapterId: "acad-class-11-sta-topic-1",
    chapterName: "পরিসংখ্যান",
    unitNumber: 1,
    topicId: "topic-1",
    questionText: "পরিসংখ্যান কী?",
    options: [
      { letter: "A", text: "শুধু গ্রাফ আঁকা" },
      { letter: "B", text: "সংখ্যাভিত্তিক তথ্য সংগ্রহ ও বিশ্লেষণের বিজ্ঞান" },
      { letter: "C", text: "শুধু গড় বের করা" },
      { letter: "D", text: "শুধু গণনা" }
    ],
    correctLetter: "B",
    explanation: "পরিসংখ্যানে তথ্য সংগ্রহ, উপস্থাপন, বিশ্লেষণ ও সিদ্ধান্ত গ্রহণ করা হয়।",
    difficulty: "easy",
    sourceNote: "NCTB HSC পরিসংখ্যান ১ম পত্র — অধ্যায় ১",
  },
  {
    id: "ACAD-3082",
    classId: "class-11",
    subjectId: "statistics",
    chapterId: "acad-class-11-sta-topic-2",
    chapterName: "গড়",
    unitNumber: 2,
    topicId: "topic-2",
    questionText: "২, ৪, ৬, ৮-এর গাণিতিক গড় কত?",
    options: [
      { letter: "A", text: "৪" },
      { letter: "B", text: "২০" },
      { letter: "C", text: "৫" },
      { letter: "D", text: "৬" }
    ],
    correctLetter: "C",
    explanation: "(২+৪+৬+৮) ÷ ৪ = ২০ ÷ ৪ = ৫।",
    difficulty: "easy",
    sourceNote: "NCTB HSC পরিসংখ্যান ১ম পত্র — কেন্দ্রীয় প্রবণতা",
  },
  {
    id: "ACAD-3083",
    classId: "class-11",
    subjectId: "statistics",
    chapterId: "acad-class-11-sta-topic-3",
    chapterName: "মধ্যক",
    unitNumber: 3,
    topicId: "topic-3",
    questionText: "৩, ৫, ৭, ৯, ১১-এর মধ্যক কত?",
    options: [
      { letter: "A", text: "৬" },
      { letter: "B", text: "৯" },
      { letter: "C", text: "৭" },
      { letter: "D", text: "৫" }
    ],
    correctLetter: "C",
    explanation: "সাজানো তথ্যের মাঝের মানই মধ্যক; এখানে ৭।",
    difficulty: "medium",
    sourceNote: "NCTB HSC পরিসংখ্যান ১ম পত্র — কেন্দ্রীয় প্রবণতা",
  },
  {
    id: "ACAD-3084",
    classId: "class-11",
    subjectId: "statistics",
    chapterId: "acad-class-11-sta-topic-4",
    chapterName: "প্রচুরক",
    unitNumber: 4,
    topicId: "topic-4",
    questionText: "২, ৩, ৩, ৫, ৬-এর প্রচুরক কত?",
    options: [
      { letter: "A", text: "২" },
      { letter: "B", text: "৫" },
      { letter: "C", text: "৬" },
      { letter: "D", text: "৩" }
    ],
    correctLetter: "D",
    explanation: "সবচেয়ে বেশি বার আসা মানই প্রচুরক; ৩ দুবার এসেছে।",
    difficulty: "medium",
    sourceNote: "NCTB HSC পরিসংখ্যান ১ম পত্র — কেন্দ্রীয় প্রবণতা",
  },
  {
    id: "ACAD-3085",
    classId: "class-11",
    subjectId: "statistics",
    chapterId: "acad-class-11-sta-topic-5",
    chapterName: "পরিমিত ব্যবধান",
    unitNumber: 5,
    topicId: "topic-5",
    questionText: "পরিমিত ব্যবধান কী মাপে?",
    options: [
      { letter: "A", text: "মোট" },
      { letter: "B", text: "তথ্যের বিস্তৃতি/বিচ্যুতি" },
      { letter: "C", text: "গড়" },
      { letter: "D", text: "মধ্যক" }
    ],
    correctLetter: "B",
    explanation: "পরিমিত ব্যবধান (SD) গড় থেকে তথ্যের বিচ্যুতির পরিমাণ মাপে।",
    difficulty: "hard",
    sourceNote: "NCTB HSC পরিসংখ্যান ১ম পত্র — বিস্তৃতি পরিমাপ",
  },
  {
    id: "ACAD-3086",
    classId: "class-11",
    subjectId: "statistics",
    chapterId: "acad-class-11-sta-topic-6",
    chapterName: "সম্ভাবনা",
    unitNumber: 6,
    topicId: "topic-6",
    questionText: "একটি মুদ্রা নিক্ষেপে Head পাওয়ার সম্ভাবনা কত?",
    options: [
      { letter: "A", text: "১/২" },
      { letter: "B", text: "১" },
      { letter: "C", text: "১/৪" },
      { letter: "D", text: "১/৩" }
    ],
    correctLetter: "A",
    explanation: "দুটি সমসম্ভাব্য ফলাফলের একটি Head, তাই ১/২।",
    difficulty: "medium",
    sourceNote: "NCTB HSC পরিসংখ্যান ১ম পত্র — সম্ভাবনা",
  },
  {
    id: "ACAD-3087",
    classId: "class-11",
    subjectId: "statistics",
    chapterId: "acad-class-11-sta-topic-7",
    chapterName: "দ্বিপদী বিন্যাস",
    unitNumber: 7,
    topicId: "topic-7",
    questionText: "দ্বিপদী বিন্যাসের শর্ত কোনটি?",
    options: [
      { letter: "A", text: "সম্ভাবনা বদলায়" },
      { letter: "B", text: "প্রতিটি পরীক্ষায় সাফল্যের সম্ভাবনা একই" },
      { letter: "C", text: "পরীক্ষা একবার হয়" },
      { letter: "D", text: "ফলাফল অসীম" }
    ],
    correctLetter: "B",
    explanation: "দ্বিপদী বিন্যাসে n স্বাধীন বার্নুলি পরীক্ষায় সাফল্যের সম্ভাবনা p ধ্রুব থাকে।",
    difficulty: "hard",
    sourceNote: "NCTB HSC পরিসংখ্যান ২য় পত্র — সম্ভাবনা বিন্যাস",
  },
  {
    id: "ACAD-3088",
    classId: "class-11",
    subjectId: "statistics",
    chapterId: "acad-class-11-sta-topic-8",
    chapterName: "সহসম্পর্ক",
    unitNumber: 8,
    topicId: "topic-8",
    questionText: "সহসম্পর্ক গুণাঙ্কের মানের সীমা কত?",
    options: [
      { letter: "A", text: "০ থেকে ১০০" },
      { letter: "B", text: "০ থেকে ১" },
      { letter: "C", text: "−১ থেকে +১" },
      { letter: "D", text: "−১০ থেকে ১০" }
    ],
    correctLetter: "C",
    explanation: "r-এর মান −১ থেকে +১-এর মধ্যে থাকে; +১ পূর্ণ ধনাত্মক সম্পর্ক।",
    difficulty: "medium",
    sourceNote: "NCTB HSC পরিসংখ্যান ২য় পত্র — সহসম্পর্ক",
  },
  {
    id: "ACAD-3089",
    classId: "class-11",
    subjectId: "statistics",
    chapterId: "acad-class-11-sta-topic-9",
    chapterName: "সমাশ্রয়ণ",
    unitNumber: 9,
    topicId: "topic-9",
    questionText: "সমাশ্রয়ণ রেখা কী দেখায়?",
    options: [
      { letter: "A", text: "শুধু বিস্তৃতি" },
      { letter: "B", text: "শুধু গড়" },
      { letter: "C", text: "শুধু সম্ভাবনা" },
      { letter: "D", text: "এক চলকের ওপর অন্য চলকের নির্ভরতা" }
    ],
    correctLetter: "D",
    explanation: "সমাশ্রয়ণে স্বাধীন চলক থেকে নির্ভরশীল চলকের মান অনুমান করা হয়।",
    difficulty: "medium",
    sourceNote: "NCTB HSC পরিসংখ্যান ২য় পত্র — সমাশ্রয়ণ",
  },
  {
    id: "ACAD-3090",
    classId: "class-11",
    subjectId: "statistics",
    chapterId: "acad-class-11-sta-topic-10",
    chapterName: "নমুনায়ন",
    unitNumber: 10,
    topicId: "topic-10",
    questionText: "সমগ্রক থেকে অংশ নেওয়াকে কী বলে?",
    options: [
      { letter: "A", text: "আদমশুমারি" },
      { letter: "B", text: "গড় নির্ণয়" },
      { letter: "C", text: "নমুনায়ন" },
      { letter: "D", text: "তথ্য সংগ্রহ শুধু" }
    ],
    correctLetter: "C",
    explanation: "সমগ্রকের প্রতিনিধিত্বকারী অংশ নেওয়াই নমুনায়ন।",
    difficulty: "medium",
    sourceNote: "NCTB HSC পরিসংখ্যান ২য় পত্র — নমুনায়ন",
  },
  {
    id: "ACAD-8085",
    classId: "class-11",
    subjectId: "statistics",
    chapterId: "acad-class-11-sta-topic-1",
    chapterName: "পরিসংখ্যান",
    unitNumber: 1,
    topicId: "topic-1",
    questionText: "প্রাথমিক তথ্য কী?",
    options: [
      { letter: "A", text: "সরাসরি সংগ্রহ করা তথ্য" },
      { letter: "B", text: "পুরোনো তথ্য" },
      { letter: "C", text: "অনুমান করা তথ্য" },
      { letter: "D", text: "বই থেকে নেওয়া তথ্য" }
    ],
    correctLetter: "A",
    explanation: "গবেষক নিজে সরাসরি সংগ্রহ করলে তা প্রাথমিক তথ্য; অন্যের সংগৃহীত তথ্য গৌণ তথ্য।",
    difficulty: "medium",
    sourceNote: "NCTB HSC পরিসংখ্যান ১ম পত্র — তথ্য সংগ্রহ",
  },
  {
    id: "ACAD-8086",
    classId: "class-11",
    subjectId: "statistics",
    chapterId: "acad-class-11-sta-topic-2",
    chapterName: "গড়",
    unitNumber: 2,
    topicId: "topic-2",
    questionText: "৫, ১০, ১৫-এর গাণিতিক গড় কত?",
    options: [
      { letter: "A", text: "১০" },
      { letter: "B", text: "৫" },
      { letter: "C", text: "১৫" },
      { letter: "D", text: "৩০" }
    ],
    correctLetter: "A",
    explanation: "(৫+১০+১৫) ÷ ৩ = ৩০ ÷ ৩ = ১০।",
    difficulty: "medium",
    sourceNote: "NCTB HSC পরিসংখ্যান ১ম পত্র — কেন্দ্রীয় প্রবণতা",
  },
  {
    id: "ACAD-8087",
    classId: "class-11",
    subjectId: "statistics",
    chapterId: "acad-class-11-sta-topic-3",
    chapterName: "মধ্যক",
    unitNumber: 3,
    topicId: "topic-3",
    questionText: "২, ৪, ৬, ৮-এর মধ্যক কত?",
    options: [
      { letter: "A", text: "৫" },
      { letter: "B", text: "৬" },
      { letter: "C", text: "৩" },
      { letter: "D", text: "৪" }
    ],
    correctLetter: "A",
    explanation: "জোড় সংখ্যক তথ্যে মাঝের দুটির গড়ই মধ্যক: (৪+৬)/২ = ৫।",
    difficulty: "medium",
    sourceNote: "NCTB HSC পরিসংখ্যান ১ম পত্র — কেন্দ্রীয় প্রবণতা",
  },
  {
    id: "ACAD-8088",
    classId: "class-11",
    subjectId: "statistics",
    chapterId: "acad-class-11-sta-topic-4",
    chapterName: "প্রচুরক",
    unitNumber: 4,
    topicId: "topic-4",
    questionText: "১, ২, ২, ৩, ৪-এর প্রচুরক কত?",
    options: [
      { letter: "A", text: "২" },
      { letter: "B", text: "৪" },
      { letter: "C", text: "১" },
      { letter: "D", text: "৩" }
    ],
    correctLetter: "A",
    explanation: "২ সবচেয়ে বেশি বার (দুবার) এসেছে।",
    difficulty: "medium",
    sourceNote: "NCTB HSC পরিসংখ্যান ১ম পত্র — কেন্দ্রীয় প্রবণতা",
  },
  {
    id: "ACAD-8089",
    classId: "class-11",
    subjectId: "statistics",
    chapterId: "acad-class-11-sta-topic-5",
    chapterName: "পরিমিত ব্যবধান",
    unitNumber: 5,
    topicId: "topic-5",
    questionText: "ভেদাঙ্ক কী?",
    options: [
      { letter: "A", text: "প্রচুরকের বর্গ" },
      { letter: "B", text: "গড়ের বর্গ" },
      { letter: "C", text: "পরিমিত ব্যবধানের বর্গ" },
      { letter: "D", text: "মধ্যকের বর্গ" }
    ],
    correctLetter: "C",
    explanation: "ভেদাঙ্ক (variance) = (পরিমিত ব্যবধান)²।",
    difficulty: "medium",
    sourceNote: "NCTB HSC পরিসংখ্যান ১ম পত্র — বিস্তৃতি পরিমাপ",
  },
  {
    id: "ACAD-8090",
    classId: "class-11",
    subjectId: "statistics",
    chapterId: "acad-class-11-sta-topic-6",
    chapterName: "সম্ভাবনা",
    unitNumber: 6,
    topicId: "topic-6",
    questionText: "একটি ছক্কা নিক্ষেপে ৩-এর বেশি পাওয়ার সম্ভাবনা কত?",
    options: [
      { letter: "A", text: "১/৩" },
      { letter: "B", text: "১/২" },
      { letter: "C", text: "২/৩" },
      { letter: "D", text: "১/৬" }
    ],
    correctLetter: "B",
    explanation: "৩-এর বেশি: ৪, ৫, ৬ — ৩টি; মোট ৬টি — ৩/৬ = ১/২।",
    difficulty: "medium",
    sourceNote: "NCTB HSC পরিসংখ্যান ১ম পত্র — সম্ভাবনা",
  },
  {
    id: "ACAD-8091",
    classId: "class-11",
    subjectId: "statistics",
    chapterId: "acad-class-11-sta-topic-7",
    chapterName: "দ্বিপদী বিন্যাস",
    unitNumber: 7,
    topicId: "topic-7",
    questionText: "দ্বিপদী বিন্যাসে গড় কত?",
    options: [
      { letter: "A", text: "n/p" },
      { letter: "B", text: "np" },
      { letter: "C", text: "p/n" },
      { letter: "D", text: "n + p" }
    ],
    correctLetter: "B",
    explanation: "দ্বিপদী বিন্যাসে গড় = np; ভেদাঙ্ক = npq।",
    difficulty: "medium",
    sourceNote: "NCTB HSC পরিসংখ্যান ২য় পত্র — সম্ভাবনা বিন্যাস",
  },
  {
    id: "ACAD-8092",
    classId: "class-11",
    subjectId: "statistics",
    chapterId: "acad-class-11-sta-topic-8",
    chapterName: "সহসম্পর্ক",
    unitNumber: 8,
    topicId: "topic-8",
    questionText: "r = 0 মানে কী?",
    options: [
      { letter: "A", text: "পূর্ণ সম্পর্ক" },
      { letter: "B", text: "কোনো রৈখিক সম্পর্ক নেই" },
      { letter: "C", text: "বিপরীত সম্পর্ক" },
      { letter: "D", text: "কার্যকারণ সম্পর্ক" }
    ],
    correctLetter: "B",
    explanation: "r = 0 মানে চলকদ্বয়ের মধ্যে রৈখিক সম্পর্ক নেই।",
    difficulty: "medium",
    sourceNote: "NCTB HSC পরিসংখ্যান ২য় পত্র — সহসম্পর্ক",
  },
  {
    id: "ACAD-8093",
    classId: "class-11",
    subjectId: "statistics",
    chapterId: "acad-class-11-sta-topic-9",
    chapterName: "সমাশ্রয়ণ",
    unitNumber: 9,
    topicId: "topic-9",
    questionText: "সমাশ্রয়ণ সমীকরণ y = a + bx-এ b কী?",
    options: [
      { letter: "A", text: "ঢাল" },
      { letter: "B", text: "ছেদাংশ" },
      { letter: "C", text: "ভেদাঙ্ক" },
      { letter: "D", text: "গড়" }
    ],
    correctLetter: "A",
    explanation: "b ঢাল — x এক একক বাড়লে y কত বাড়ে; a ছেদাংশ।",
    difficulty: "medium",
    sourceNote: "NCTB HSC পরিসংখ্যান ২য় পত্র — সমাশ্রয়ণ",
  },
  {
    id: "ACAD-8094",
    classId: "class-11",
    subjectId: "statistics",
    chapterId: "acad-class-11-sta-topic-10",
    chapterName: "নমুনায়ন",
    unitNumber: 10,
    topicId: "topic-10",
    questionText: "দৈব নমুনায়ন কী?",
    options: [
      { letter: "A", text: "শুধু সহজলভ্য একক নেওয়া" },
      { letter: "B", text: "ইচ্ছামতো নেওয়া" },
      { letter: "C", text: "শুধু বড় একক নেওয়া" },
      { letter: "D", text: "প্রতিটি এককের সমান সুযোগ" }
    ],
    correctLetter: "D",
    explanation: "দৈব নমুনায়নে সমগ্রকের প্রতিটি এককের নির্বাচিত হওয়ার সমান সুযোগ থাকে।",
    difficulty: "medium",
    sourceNote: "NCTB HSC পরিসংখ্যান ২য় পত্র — নমুনায়ন",
  },
  {
    id: "ACAD-8095",
    classId: "class-11",
    subjectId: "statistics",
    chapterId: "acad-class-11-sta-topic-11",
    chapterName: "চিত্র উপস্থাপন",
    unitNumber: 11,
    topicId: "topic-11",
    questionText: "তথ্য উপস্থাপনে পাই চার্ট কী দেখায়?",
    options: [
      { letter: "A", text: "সময়ের পরিবর্তন" },
      { letter: "B", text: "শুধু গড়" },
      { letter: "C", text: "শুধু মোট" },
      { letter: "D", text: "অংশের অনুপাত" }
    ],
    correctLetter: "D",
    explanation: "পাই চার্টে বৃত্তের অংশ দিয়ে প্রতিটি শ্রেণির অনুপাত দেখানো হয়।",
    difficulty: "medium",
    sourceNote: "NCTB HSC পরিসংখ্যান ১ম পত্র — তথ্য উপস্থাপন",
  },
  {
    id: "ACAD-8096",
    classId: "class-11",
    subjectId: "statistics",
    chapterId: "acad-class-11-sta-topic-12",
    chapterName: "সূচক সংখ্যা",
    unitNumber: 12,
    topicId: "topic-12",
    questionText: "মূল্য সূচক কী মাপে?",
    options: [
      { letter: "A", text: "জনসংখ্যা" },
      { letter: "B", text: "আয়" },
      { letter: "C", text: "পরিমাণের পরিবর্তন" },
      { letter: "D", text: "সময়ের সঙ্গে দামের পরিবর্তন" }
    ],
    correctLetter: "D",
    explanation: "মূল্য সূচকে ভিত্তি বছরের তুলনায় দামের পরিবর্তন মাপা হয়।",
    difficulty: "medium",
    sourceNote: "NCTB HSC পরিসংখ্যান ২য় পত্র — সূচক সংখ্যা",
  },
];
