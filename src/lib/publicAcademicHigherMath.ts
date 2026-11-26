// Eduvelto — Academic Higher Mathematics practice questions (Class 9),
// verified against the Dakhil NCTB books (review 26 Nov 2026).
//
// Static data ONLY — zero Firestore reads. The 18 questions are the
// Academic Class 9 Higher Mathematics drafts AFTER review (see
// review-academic-c9-higher-math-verdicts.json and
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
// their fixes applied). The 3 REJECTED items (ACAD-0053, ACAD-5061, ACAD-5068) are NOT here — no complete replacement was recorded; a teacher must supply replacements before they can ever be used.
//
// HOW NEW BATCHES JOIN: append the next verified batch's questions
// to PUBLIC_ACADEMIC_HIGHER_MATH_QUESTIONS below (same shape, same generation
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

/** All verified Academic Higher Mathematics questions, Class 9 (in draft order). */
export const PUBLIC_ACADEMIC_HIGHER_MATH_QUESTIONS: PublicAcademicQuestion[] = [
  {
    id: "ACAD-0054",
    classId: "class-9",
    subjectId: "higher-math",
    chapterId: "acad-class-9-hmat-topic-1",
    chapterName: "বহুপদী",
    unitNumber: 1,
    topicId: "topic-1",
    questionText: "x² − 5x + 6 এর উৎপাদক কোনটি?",
    options: [
      { letter: "A", text: "(x + 2)(x + 3)" },
      { letter: "B", text: "(x + 1)(x − 6)" },
      { letter: "C", text: "(x − 2)(x − 3)" },
      { letter: "D", text: "(x − 1)(x − 6)" }
    ],
    correctLetter: "C",
    explanation: "x² − 5x + 6 = (x − 2)(x − 3), কারণ −2 −3 = −5 এবং (−2)(−3) = 6।",
    difficulty: "medium",
    sourceNote: "NCTB উচ্চতর গণিত, নবম-দশম শ্রেণি — বহুপদী",
  },
  {
    id: "ACAD-0055",
    classId: "class-9",
    subjectId: "higher-math",
    chapterId: "acad-class-9-hmat-topic-2",
    chapterName: "দ্বিঘাত সমীকরণ",
    unitNumber: 2,
    topicId: "topic-2",
    questionText: "x² − 9 = 0 এর মূল কী?",
    options: [
      { letter: "A", text: "±3" },
      { letter: "B", text: "3" },
      { letter: "C", text: "9" },
      { letter: "D", text: "−3" }
    ],
    correctLetter: "A",
    explanation: "x² = 9 হলে x = ±3।",
    difficulty: "medium",
    sourceNote: "NCTB উচ্চতর গণিত, নবম-দশম শ্রেণি — দ্বিঘাত সমীকরণ",
  },
  {
    id: "ACAD-0056",
    classId: "class-9",
    subjectId: "higher-math",
    chapterId: "acad-class-9-hmat-topic-3",
    chapterName: "জ্যামিতি — বৃত্ত",
    unitNumber: 3,
    topicId: "topic-3",
    questionText: "বৃত্তের একই চাপের ওপর কেন্দ্রস্থ কোণ পরিধিস্থ কোণের কত গুণ?",
    options: [
      { letter: "A", text: "তিনগুণ" },
      { letter: "B", text: "অর্ধেক" },
      { letter: "C", text: "সমান" },
      { letter: "D", text: "দ্বিগুণ" }
    ],
    correctLetter: "D",
    explanation: "একই চাপের ওপর কেন্দ্রস্থ কোণ পরিধিস্থ কোণের দ্বিগুণ হয়।",
    difficulty: "medium",
    sourceNote: "NCTB সাধারণ গণিত, নবম-দশম শ্রেণি — বৃত্ত (অধ্যায় ৮)",
  },
  {
    id: "ACAD-0057",
    classId: "class-9",
    subjectId: "higher-math",
    chapterId: "acad-class-9-hmat-topic-4",
    chapterName: "ত্রিকোণমিতি",
    unitNumber: 4,
    topicId: "topic-4",
    questionText: "sin²θ + cos²θ এর মান কত?",
    options: [
      { letter: "A", text: "১" },
      { letter: "B", text: "০" },
      { letter: "C", text: "tan²θ" },
      { letter: "D", text: "২" }
    ],
    correctLetter: "A",
    explanation: "মৌলিক ত্রিকোণমিতিক অভেদ: sin²θ + cos²θ = 1।",
    difficulty: "medium",
    sourceNote: "NCTB উচ্চতর গণিত, নবম-দশম শ্রেণি — ত্রিকোণমিতি",
  },
  {
    id: "ACAD-0058",
    classId: "class-9",
    subjectId: "higher-math",
    chapterId: "acad-class-9-hmat-topic-5",
    chapterName: "সূচকীয় ও লগারিদমীয় ফাংশন",
    unitNumber: 5,
    topicId: "topic-5",
    questionText: "2³ × 2² এর মান কত?",
    options: [
      { letter: "A", text: "৮" },
      { letter: "B", text: "৩২" },
      { letter: "C", text: "৬৪" },
      { letter: "D", text: "১৬" }
    ],
    correctLetter: "B",
    explanation: "2³ × 2² = 2⁵ = 32।",
    difficulty: "medium",
    sourceNote: "NCTB উচ্চতর গণিত, নবম-দশম শ্রেণি — সূচকীয় ফাংশন",
  },
  {
    id: "ACAD-0059",
    classId: "class-9",
    subjectId: "higher-math",
    chapterId: "acad-class-9-hmat-topic-6",
    chapterName: "অসীম ধারা",
    unitNumber: 6,
    topicId: "topic-6",
    questionText: "1 + 1/2 + 1/4 + 1/8 + ... অসীম ধারার সমষ্টি কত?",
    options: [
      { letter: "A", text: "২" },
      { letter: "B", text: "অসীম" },
      { letter: "C", text: "১" },
      { letter: "D", text: "৪" }
    ],
    correctLetter: "A",
    explanation: "গুণোত্তর ধারা a=1, r=1/2; সমষ্টি = a/(1−r) = 1/(1/2) = 2।",
    difficulty: "hard",
    sourceNote: "NCTB উচ্চতর গণিত, নবম-দশম শ্রেণি — অসীম ধারা",
  },
  {
    id: "ACAD-0060",
    classId: "class-9",
    subjectId: "higher-math",
    chapterId: "acad-class-9-hmat-topic-7",
    chapterName: "স্থানাঙ্ক জ্যামিতি",
    unitNumber: 7,
    topicId: "topic-7",
    questionText: "(0, 0) ও (3, 4) বিন্দুদ্বয়ের দূরত্ব কত?",
    options: [
      { letter: "A", text: "৪" },
      { letter: "B", text: "৫" },
      { letter: "C", text: "৩" },
      { letter: "D", text: "৭" }
    ],
    correctLetter: "B",
    explanation: "দূরত্ব = √(3² + 4²) = √25 = 5।",
    difficulty: "medium",
    sourceNote: "NCTB উচ্চতর গণিত, নবম-দশম শ্রেণি — স্থানাঙ্ক জ্যামিতি",
  },
  {
    id: "ACAD-0061",
    classId: "class-9",
    subjectId: "higher-math",
    chapterId: "acad-class-9-hmat-topic-8",
    chapterName: "সমতলীয় ভেক্টর",
    unitNumber: 8,
    topicId: "topic-8",
    questionText: "দুটি ভেক্টর সমান্তরাল হওয়ার শর্ত কী?",
    options: [
      { letter: "A", text: "এদের দিক বিপরীত" },
      { letter: "B", text: "এরা লম্ব" },
      { letter: "C", text: "একটি অপরটির স্কেলার গুণিতক" },
      { letter: "D", text: "এদের মান সমান" }
    ],
    correctLetter: "C",
    explanation: "একটি ভেক্টর অপরটির স্কেলার গুণিতক হলে ভেক্টরদ্বয় সমান্তরাল হয়।",
    difficulty: "medium",
    sourceNote: "NCTB উচ্চতর গণিত, নবম-দশম শ্রেণি — ভেক্টর",
  },
  {
    id: "ACAD-0062",
    classId: "class-9",
    subjectId: "higher-math",
    chapterId: "acad-class-9-hmat-topic-9",
    chapterName: "সম্ভাবনা",
    unitNumber: 9,
    topicId: "topic-9",
    questionText: "দুটি মুদ্রা একসঙ্গে নিক্ষেপে দুটিতেই Head পাওয়ার সম্ভাবনা কত?",
    options: [
      { letter: "A", text: "১/৩" },
      { letter: "B", text: "৩/৪" },
      { letter: "C", text: "১/২" },
      { letter: "D", text: "১/৪" }
    ],
    correctLetter: "D",
    explanation: "মোট ফলাফল ৪টি (HH, HT, TH, TT); অনুকূল ১টি, তাই ১/৪।",
    difficulty: "medium",
    sourceNote: "NCTB উচ্চতর গণিত, নবম-দশম শ্রেণি — সম্ভাবনা",
  },
  {
    id: "ACAD-5062",
    classId: "class-9",
    subjectId: "higher-math",
    chapterId: "acad-class-9-hmat-topic-1",
    chapterName: "বহুপদী",
    unitNumber: 1,
    topicId: "topic-1",
    questionText: "x² + 5x + 6 = 0 এর মূল কী?",
    options: [
      { letter: "A", text: "২, ৩" },
      { letter: "B", text: "১, ৬" },
      { letter: "C", text: "−১, −৬" },
      { letter: "D", text: "−২, −৩" }
    ],
    correctLetter: "D",
    explanation: "(x + 2)(x + 3) = 0, তাই x = −2, −3।",
    difficulty: "medium",
    sourceNote: "NCTB উচ্চতর গণিত — বহুপদী",
  },
  {
    id: "ACAD-5063",
    classId: "class-9",
    subjectId: "higher-math",
    chapterId: "acad-class-9-hmat-topic-2",
    chapterName: "দ্বিঘাত সমীকরণ",
    unitNumber: 2,
    topicId: "topic-2",
    questionText: "x² − 4x + 4 = 0 এর মূলের প্রকৃতি কেমন?",
    options: [
      { letter: "A", text: "শূন্য" },
      { letter: "B", text: "অসমান বাস্তব" },
      { letter: "C", text: "জটিল" },
      { letter: "D", text: "সমান ও বাস্তব" }
    ],
    correctLetter: "D",
    explanation: "নিশ্চায়ক b² − 4ac = 16 − 16 = 0, তাই মূলদ্বয় সমান।",
    difficulty: "hard",
    sourceNote: "NCTB উচ্চতর গণিত — দ্বিঘাত সমীকরণ",
  },
  {
    id: "ACAD-5065",
    classId: "class-9",
    subjectId: "higher-math",
    chapterId: "acad-class-9-hmat-topic-4",
    chapterName: "ত্রিকোণমিতি",
    unitNumber: 4,
    topicId: "topic-4",
    questionText: "cos 60° এর মান কত?",
    options: [
      { letter: "A", text: "১" },
      { letter: "B", text: "০" },
      { letter: "C", text: "১/২" },
      { letter: "D", text: "√৩/২" }
    ],
    correctLetter: "C",
    explanation: "cos 60° = 1/2; sin 60° = √3/2।",
    difficulty: "medium",
    sourceNote: "NCTB উচ্চতর গণিত — ত্রিকোণমিতি",
  },
  {
    id: "ACAD-5066",
    classId: "class-9",
    subjectId: "higher-math",
    chapterId: "acad-class-9-hmat-topic-10",
    chapterName: "সূচকীয়",
    unitNumber: 10,
    topicId: "topic-10",
    questionText: "3² × 3³ এর মান কত?",
    options: [
      { letter: "A", text: "২৪৩" },
      { letter: "B", text: "৮১" },
      { letter: "C", text: "২৭" },
      { letter: "D", text: "৯" }
    ],
    correctLetter: "A",
    explanation: "3² × 3³ = 3⁵ = 243।",
    difficulty: "medium",
    sourceNote: "NCTB উচ্চতর গণিত — সূচকীয় ফাংশন",
  },
  {
    id: "ACAD-5067",
    classId: "class-9",
    subjectId: "higher-math",
    chapterId: "acad-class-9-hmat-topic-11",
    chapterName: "ধারা",
    unitNumber: 11,
    topicId: "topic-11",
    questionText: "2 + 4 + 6 + ... + 20 ধারার সমষ্টি কত?",
    options: [
      { letter: "A", text: "৯০" },
      { letter: "B", text: "১২০" },
      { letter: "C", text: "১১০" },
      { letter: "D", text: "১০০" }
    ],
    correctLetter: "C",
    explanation: "পদসংখ্যা ১০; সমষ্টি = n/2(a + l) = 5×22 = 110।",
    difficulty: "medium",
    sourceNote: "NCTB উচ্চতর গণিত — ধারা",
  },
  {
    id: "ACAD-5069",
    classId: "class-9",
    subjectId: "higher-math",
    chapterId: "acad-class-9-hmat-topic-12",
    chapterName: "ভেক্টর",
    unitNumber: 12,
    topicId: "topic-12",
    questionText: "একক ভেক্টর কাকে বলে?",
    options: [
      { letter: "A", text: "সমান ভেক্টর" },
      { letter: "B", text: "মান ০ বিশিষ্ট ভেক্টর" },
      { letter: "C", text: "শূন্য ভেক্টর" },
      { letter: "D", text: "মান ১ বিশিষ্ট ভেক্টর" }
    ],
    correctLetter: "D",
    explanation: "যে ভেক্টরের মান ১, তাকে একক ভেক্টর বলে।",
    difficulty: "medium",
    sourceNote: "NCTB উচ্চতর গণিত — ভেক্টর",
  },
  {
    id: "ACAD-5070",
    classId: "class-9",
    subjectId: "higher-math",
    chapterId: "acad-class-9-hmat-topic-9",
    chapterName: "সম্ভাবনা",
    unitNumber: 9,
    topicId: "topic-9",
    questionText: "একটি পাশা নিক্ষেপে ৫ পাওয়ার সম্ভাবনা কত?",
    options: [
      { letter: "A", text: "১/৩" },
      { letter: "B", text: "১/২" },
      { letter: "C", text: "১/৬" },
      { letter: "D", text: "৫/৬" }
    ],
    correctLetter: "C",
    explanation: "মোট ৬টি ফলাফল, অনুকূল ১টি — ১/৬।",
    difficulty: "medium",
    sourceNote: "NCTB উচ্চতর গণিত — সম্ভাবনা",
  },
  {
    id: "ACAD-5071",
    classId: "class-9",
    subjectId: "higher-math",
    chapterId: "acad-class-9-hmat-topic-13",
    chapterName: "লগারিদম",
    unitNumber: 13,
    topicId: "topic-13",
    questionText: "log₂ 8 এর মান কত?",
    options: [
      { letter: "A", text: "৩" },
      { letter: "B", text: "৮" },
      { letter: "C", text: "৪" },
      { letter: "D", text: "২" }
    ],
    correctLetter: "A",
    explanation: "2³ = 8, তাই log₂ 8 = 3।",
    difficulty: "medium",
    sourceNote: "NCTB উচ্চতর গণিত — লগারিদম",
  },
  {
    id: "ACAD-5072",
    classId: "class-9",
    subjectId: "higher-math",
    chapterId: "acad-class-9-hmat-topic-14",
    chapterName: "ফাংশন",
    unitNumber: 14,
    topicId: "topic-14",
    questionText: "f(x) = 2x + 1 হলে f(3) কত?",
    options: [
      { letter: "A", text: "৫" },
      { letter: "B", text: "৭" },
      { letter: "C", text: "৯" },
      { letter: "D", text: "৬" }
    ],
    correctLetter: "B",
    explanation: "f(3) = 2×3 + 1 = 7।",
    difficulty: "easy",
    sourceNote: "NCTB উচ্চতর গণিত — ফাংশন",
  },
];
