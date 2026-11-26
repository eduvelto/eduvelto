// Eduvelto — Academic Bangla Grammar practice questions (Class 6),
// verified against the NCTB books (review 26 Nov 2026).
//
// Static data ONLY — zero Firestore reads. The 24 questions are the
// Academic Class 6 Bangla Grammar drafts AFTER review (see
// review-academic-c6-bangla-grammar-verdicts.json and
// review-academic-c6-fixes-applied.md in
// ~/workspace/eduorbit/sprint-1week-2026-11-25/).
//
// HONESTY: these are ORIGINAL practice questions written for the
// NCTB lessons — NOT board / university / previous-year questions.
// Every question was checked against its cited NCTB book lesson.
// The draft files' `status` field still says NEEDS-REVIEW — the
// verdict files are the review record, and this file contains ONLY
// the verified questions (VERIFIED as-is + NEEDS-FIX / REJECTED
// items with their fixes applied). The five REJECTED items with no
// complete replacement recorded are NOT here (see the generation
// script's EXCLUDED set).
//
// HOW NEW BATCHES JOIN: append the next verified batch's questions
// to PUBLIC_ACADEMIC_BANGLA_GRAMMAR_QUESTIONS below (same shape, same generation
// script with the new draft + verdict files). Chapters, counts and
// the practice pages are DERIVED from the combined pool in
// src/lib/publicAcademic.ts, so no component or route change is
// needed when a batch is verified. NEVER add a question whose
// verdict is not VERIFIED (or NEEDS-FIX / REJECTED with the fix
// applied) — unverified drafts must never reach students.

import { type PublicAcademicQuestion } from './publicAcademic';

/** All verified Academic Bangla Grammar questions, in draft order (Class 6). */
export const PUBLIC_ACADEMIC_BANGLA_GRAMMAR_QUESTIONS: PublicAcademicQuestion[] = [
  {
    id: "ACAD-C6-GRA-001",
    classId: "class-6",
    subjectId: "bangla-grammar",
    chapterId: "acad-class-6-bgr-chapter-1",
    chapterName: "১. ভাষা ও বাংলা ভাষা",
    unitNumber: 1,
    topicId: "language",
    questionText: "ভাষা কাকে বলে?",
    options: [
      { letter: "A", text: "শুধু লেখার মাধ্যম" },
      { letter: "B", text: "শুধু গানের মাধ্যম" },
      { letter: "C", text: "মানুষের মনের ভাব প্রকাশের মাধ্যম" },
      { letter: "D", text: "শুধু ছবির মাধ্যম" }
    ],
    correctLetter: "C",
    explanation: "ভাষা হলো মানুষের মনের ভাব প্রকাশের মাধ্যম।",
    difficulty: "easy",
    sourceNote: "বাংলা ব্যাকরণ ও নির্মিতি, ষষ্ঠ শ্রেণি (NCTB), অধ্যায় ১: ভাষা ও বাংলা ভাষা",
  },
  {
    id: "ACAD-C6-GRA-002",
    classId: "class-6",
    subjectId: "bangla-grammar",
    chapterId: "acad-class-6-bgr-chapter-1",
    chapterName: "১. ভাষা ও বাংলা ভাষা",
    unitNumber: 1,
    topicId: "language",
    questionText: "ভাষা কত প্রকার?",
    options: [
      { letter: "A", text: "৩" },
      { letter: "B", text: "১" },
      { letter: "C", text: "৪" },
      { letter: "D", text: "২" }
    ],
    correctLetter: "D",
    explanation: "ভাষা দুই প্রকার — (ক) মৌখিক ভাষা ও (খ) লিখিত ভাষা (বই পৃ. ২)।",
    difficulty: "medium",
    sourceNote: "বাংলা ব্যাকরণ ও নির্মিতি, ষষ্ঠ শ্রেণি (NCTB), অধ্যায় ১: ভাষা ও বাংলা ভাষা",
  },
  {
    id: "ACAD-C6-GRA-003",
    classId: "class-6",
    subjectId: "bangla-grammar",
    chapterId: "acad-class-6-bgr-chapter-2",
    chapterName: "২. ধ্বনিতত্ত্ব",
    unitNumber: 2,
    topicId: "phonetics",
    questionText: "ভাষার ক্ষুদ্রতম একক কোনটি?",
    options: [
      { letter: "A", text: "অক্ষর" },
      { letter: "B", text: "বাক্য" },
      { letter: "C", text: "শব্দ" },
      { letter: "D", text: "ধ্বনি" }
    ],
    correctLetter: "D",
    explanation: "ধ্বনি হলো ভাষার ক্ষুদ্রতম একক।",
    difficulty: "easy",
    sourceNote: "বাংলা ব্যাকরণ ও নির্মিতি, ষষ্ঠ শ্রেণি (NCTB), অধ্যায় ২: ধ্বনিতত্ত্ব",
  },
  {
    id: "ACAD-C6-GRA-004",
    classId: "class-6",
    subjectId: "bangla-grammar",
    chapterId: "acad-class-6-bgr-chapter-2",
    chapterName: "২. ধ্বনিতত্ত্ব",
    unitNumber: 2,
    topicId: "phonetics",
    questionText: "বাংলা বর্ণমালায় স্বরবর্ণ কয়টি?",
    options: [
      { letter: "A", text: "৫০টি" },
      { letter: "B", text: "১১টি" },
      { letter: "C", text: "৩৯টি" },
      { letter: "D", text: "৭টি" }
    ],
    correctLetter: "B",
    explanation: "বাংলা বর্ণমালায় স্বরবর্ণ ১১টি।",
    difficulty: "medium",
    sourceNote: "বাংলা ব্যাকরণ ও নির্মিতি, ষষ্ঠ শ্রেণি (NCTB), অধ্যায় ২: ধ্বনিতত্ত্ব",
  },
  {
    id: "ACAD-C6-GRA-005",
    classId: "class-6",
    subjectId: "bangla-grammar",
    chapterId: "acad-class-6-bgr-chapter-3",
    chapterName: "৩. রূপতত্ত্ব",
    unitNumber: 3,
    topicId: "morphology",
    questionText: "শব্দ গঠন নিয়ে কোন তত্ত্ব আলোচনা করে?",
    options: [
      { letter: "A", text: "রূপতত্ত্ব" },
      { letter: "B", text: "বাগর্থ" },
      { letter: "C", text: "ধ্বনিতত্ত্ব" },
      { letter: "D", text: "বাক্যতত্ত্ব" }
    ],
    correctLetter: "A",
    explanation: "শব্দ গঠনের উপায় নিয়ে আলোচনা করে রূপতত্ত্ব।",
    difficulty: "medium",
    sourceNote: "বাংলা ব্যাকরণ ও নির্মিতি, ষষ্ঠ শ্রেণি (NCTB), অধ্যায় ৩: রূপতত্ত্ব",
  },
  {
    id: "ACAD-C6-GRA-006",
    classId: "class-6",
    subjectId: "bangla-grammar",
    chapterId: "acad-class-6-bgr-chapter-3",
    chapterName: "৩. রূপতত্ত্ব",
    unitNumber: 3,
    topicId: "morphology",
    questionText: "'বই' কোন পদ?",
    options: [
      { letter: "A", text: "বিশেষ্য" },
      { letter: "B", text: "বিশেষণ" },
      { letter: "C", text: "সর্বনাম" },
      { letter: "D", text: "ক্রিয়া" }
    ],
    correctLetter: "A",
    explanation: "'বই' একটি বিশেষ্য পদ।",
    difficulty: "medium",
    sourceNote: "বাংলা ব্যাকরণ ও নির্মিতি, ষষ্ঠ শ্রেণি (NCTB), অধ্যায় ৩: রূপতত্ত্ব",
  },
  {
    id: "ACAD-C6-GRA-007",
    classId: "class-6",
    subjectId: "bangla-grammar",
    chapterId: "acad-class-6-bgr-chapter-1",
    chapterName: "১. ভাষা ও বাংলা ভাষা",
    unitNumber: 1,
    topicId: "syntax",
    questionText: "ভাষার উপাদানগুলোর মধ্যে প্রথম উপাদান কোনটি?",
    options: [
      { letter: "A", text: "শব্দ" },
      { letter: "B", text: "বর্ণ" },
      { letter: "C", text: "বাক্য" },
      { letter: "D", text: "ধ্বনি" }
    ],
    correctLetter: "D",
    explanation: "ধ্বনি ভাষার মূল উপাদান।",
    difficulty: "easy",
    sourceNote: "বাংলা ব্যাকরণ ও নির্মিতি, ষষ্ঠ শ্রেণি (NCTB), অধ্যায় ১: ভাষা ও বাংলা ভাষা",
  },
  {
    id: "ACAD-C6-GRA-008",
    classId: "class-6",
    subjectId: "bangla-grammar",
    chapterId: "acad-class-6-bgr-chapter-4",
    chapterName: "৪. বাক্যতত্ত্ব",
    unitNumber: 4,
    topicId: "syntax",
    questionText: "প্রশ্নবোধক বাক্যের শেষে কোন চিহ্ন বসে?",
    options: [
      { letter: "A", text: "প্রশ্নবোধক চিহ্ন (?)" },
      { letter: "B", text: "দাঁড়ি" },
      { letter: "C", text: "বিস্ময়চিহ্ন" },
      { letter: "D", text: "কমা" }
    ],
    correctLetter: "A",
    explanation: "প্রশ্নবোধক বাক্যের শেষে প্রশ্নবোধক চিহ্ন (?) বসে।",
    difficulty: "medium",
    sourceNote: "বাংলা ব্যাকরণ ও নির্মিতি, ষষ্ঠ শ্রেণি (NCTB), অধ্যায় ৪: বাক্যতত্ত্ব",
  },
  {
    id: "ACAD-C6-GRA-009",
    classId: "class-6",
    subjectId: "bangla-grammar",
    chapterId: "acad-class-6-bgr-chapter-5",
    chapterName: "৫. বাগর্থ",
    unitNumber: 5,
    topicId: "semantics",
    questionText: "বাগর্থ বলতে কী বোঝায়?",
    options: [
      { letter: "A", text: "শব্দের গঠন" },
      { letter: "B", text: "শব্দের ধ্বনি" },
      { letter: "C", text: "শব্দের অর্থ ও প্রয়োগ" },
      { letter: "D", text: "শব্দের বানান" }
    ],
    correctLetter: "C",
    explanation: "বাগর্থ মানে শব্দের অর্থ ও প্রয়োগ।",
    difficulty: "medium",
    sourceNote: "বাংলা ব্যাকরণ ও নির্মিতি, ষষ্ঠ শ্রেণি (NCTB), অধ্যায় ৫: বাগর্থ",
  },
  {
    id: "ACAD-C6-GRA-010",
    classId: "class-6",
    subjectId: "bangla-grammar",
    chapterId: "acad-class-6-bgr-chapter-5",
    chapterName: "৫. বাগর্থ",
    unitNumber: 5,
    topicId: "semantics",
    questionText: "'আকাশে চাঁদ উঠেছে' বাক্যে 'চাঁদ' শব্দের কোন অর্থ ব্যবহৃত হয়েছে?",
    options: [
      { letter: "A", text: "রূপক অর্থ" },
      { letter: "B", text: "প্রতীকী অর্থ" },
      { letter: "C", text: "ব্যঙ্গার্থ" },
      { letter: "D", text: "আক্ষরিক অর্থ" }
    ],
    correctLetter: "D",
    explanation: "'আকাশে চাঁদ উঠেছে' — এখানে 'চাঁদ' শব্দের আক্ষরিক অর্থ ব্যবহৃত হয়েছে।",
    difficulty: "medium",
    sourceNote: "বাংলা ব্যাকরণ ও নির্মিতি, ষষ্ঠ শ্রেণি (NCTB), অধ্যায় ৫: বাগর্থ",
  },
  {
    id: "ACAD-C6-GRA-011",
    classId: "class-6",
    subjectId: "bangla-grammar",
    chapterId: "acad-class-6-bgr-chapter-6",
    chapterName: "৬. বানান",
    unitNumber: 6,
    topicId: "spelling",
    questionText: "শুদ্ধ বানান লিখতে কী দরকার?",
    options: [
      { letter: "A", text: "যেমন ইচ্ছা লেখা যায়" },
      { letter: "B", text: "শুদ্ধ বানানের জন্য বানানের নিয়ম জানা দরকার" },
      { letter: "C", text: "বানানের নিয়ম না জানলেও চলে" },
      { letter: "D", text: "বানান ভুল হলে ক্ষতি নেই" }
    ],
    correctLetter: "B",
    explanation: "শুদ্ধ বানান লেখার জন্য বানানের নিয়ম জানা দরকার।",
    difficulty: "easy",
    sourceNote: "বাংলা ব্যাকরণ ও নির্মিতি, ষষ্ঠ শ্রেণি (NCTB), অধ্যায় ৬: বানান",
  },
  {
    id: "ACAD-C6-GRA-012",
    classId: "class-6",
    subjectId: "bangla-grammar",
    chapterId: "acad-class-6-bgr-chapter-6",
    chapterName: "৬. বানান",
    unitNumber: 6,
    topicId: "spelling",
    questionText: "নিচের কোনটি শুদ্ধ বানান?",
    options: [
      { letter: "A", text: "বিদ্যালয়়" },
      { letter: "B", text: "বিদ্যালয়" },
      { letter: "C", text: "বিদ্দালয়" },
      { letter: "D", text: "বিদ্দ্যালয়" }
    ],
    correctLetter: "B",
    explanation: "'বিদ্যালয়' শব্দের শুদ্ধ বানান 'বিদ্যালয়'।",
    difficulty: "medium",
    sourceNote: "বাংলা ব্যাকরণ ও নির্মিতি, ষষ্ঠ শ্রেণি (NCTB), অধ্যায় ৬: বানান",
  },
  {
    id: "ACAD-C6-GRA-013",
    classId: "class-6",
    subjectId: "bangla-grammar",
    chapterId: "acad-class-6-bgr-chapter-7",
    chapterName: "৭. বিরামচিহ্ন",
    unitNumber: 7,
    topicId: "punctuation",
    questionText: "বিবৃতিমূলক বাক্যের শেষে কোন চিহ্ন বসে?",
    options: [
      { letter: "A", text: "দাঁড়ি (।)" },
      { letter: "B", text: "কমা" },
      { letter: "C", text: "বিস্ময়চিহ্ন" },
      { letter: "D", text: "প্রশ্নবোধক চিহ্ন" }
    ],
    correctLetter: "A",
    explanation: "বিবৃতিমূলক বাক্যের শেষে দাঁড়ি (।) বসে — বাক্যের সমাপ্তি বোঝায় (বই পৃ. ৫৬)।",
    difficulty: "easy",
    sourceNote: "বাংলা ব্যাকরণ ও নির্মিতি, ষষ্ঠ শ্রেণি (NCTB), অধ্যায় ৭: বিরামচিহ্ন",
  },
  {
    id: "ACAD-C6-GRA-014",
    classId: "class-6",
    subjectId: "bangla-grammar",
    chapterId: "acad-class-6-bgr-chapter-7",
    chapterName: "৭. বিরামচিহ্ন",
    unitNumber: 7,
    topicId: "punctuation",
    questionText: "বিস্ময় প্রকাশ করতে কোন চিহ্ন ব্যবহার করা হয়?",
    options: [
      { letter: "A", text: "কমা" },
      { letter: "B", text: "কোলন" },
      { letter: "C", text: "বিস্ময়চিহ্ন (! )" },
      { letter: "D", text: "দাঁড়ি" }
    ],
    correctLetter: "C",
    explanation: "বিস্ময় প্রকাশ করতে বিস্ময়চিহ্ন (!) ব্যবহার করা হয়।",
    difficulty: "medium",
    sourceNote: "বাংলা ব্যাকরণ ও নির্মিতি, ষষ্ঠ শ্রেণি (NCTB), অধ্যায় ৭: বিরামচিহ্ন",
  },
  {
    id: "ACAD-C6-GRA-015",
    classId: "class-6",
    subjectId: "bangla-grammar",
    chapterId: "acad-class-6-bgr-chapter-8",
    chapterName: "৮. অভিধান",
    unitNumber: 8,
    topicId: "dictionary",
    questionText: "অভিধানে কী পাওয়া যায়?",
    options: [
      { letter: "A", text: "শুধু গল্প" },
      { letter: "B", text: "শুধু কবিতা" },
      { letter: "C", text: "শব্দের অর্থ ও বানান" },
      { letter: "D", text: "শুধু ছবি" }
    ],
    correctLetter: "C",
    explanation: "অভিধানে শব্দের অর্থ ও বানান পাওয়া যায়।",
    difficulty: "easy",
    sourceNote: "বাংলা ব্যাকরণ ও নির্মিতি, ষষ্ঠ শ্রেণি (NCTB), অধ্যায় ৮: অভিধান",
  },
  {
    id: "ACAD-C6-GRA-016",
    classId: "class-6",
    subjectId: "bangla-grammar",
    chapterId: "acad-class-6-bgr-chapter-8",
    chapterName: "৮. অভিধান",
    unitNumber: 8,
    topicId: "dictionary",
    questionText: "অভিধানে শব্দ কীভাবে সাজানো থাকে?",
    options: [
      { letter: "A", text: "এলোমেলোভাবে" },
      { letter: "B", text: "বর্ণানুক্রমে" },
      { letter: "C", text: "সংখ্যা অনুযায়ী" },
      { letter: "D", text: "উল্টোভাবে" }
    ],
    correctLetter: "B",
    explanation: "অভিধানে শব্দ বর্ণানুক্রমে সাজানো থাকে।",
    difficulty: "medium",
    sourceNote: "বাংলা ব্যাকরণ ও নির্মিতি, ষষ্ঠ শ্রেণি (NCTB), অধ্যায় ৮: অভিধান",
  },
  {
    id: "ACAD-C6-GRA-017",
    classId: "class-6",
    subjectId: "bangla-grammar",
    chapterId: "acad-class-6-bgr-nirmiti-1",
    chapterName: "১. অনুধাবন",
    unitNumber: 1,
    topicId: "comprehension",
    questionText: "অনুধাবন বলতে কী বোঝায়?",
    options: [
      { letter: "A", text: "শুধু লেখা" },
      { letter: "B", text: "শুধু পড়া" },
      { letter: "C", text: "মুখস্থ করা" },
      { letter: "D", text: "পাঠ পড়ে তার মূলভাব বোঝা" }
    ],
    correctLetter: "D",
    explanation: "অনুধাবন মানে পাঠ পড়ে তার মূলভাব বোঝা।",
    difficulty: "medium",
    sourceNote: "বাংলা ব্যাকরণ ও নির্মিতি, ষষ্ঠ শ্রেণি (NCTB), নির্মিতি ১: অনুধাবন",
  },
  {
    id: "ACAD-C6-GRA-018",
    classId: "class-6",
    subjectId: "bangla-grammar",
    chapterId: "acad-class-6-bgr-nirmiti-2",
    chapterName: "২. সারাংশ ও সারমর্ম রচনা",
    unitNumber: 2,
    topicId: "summary",
    questionText: "সারাংশ কাকে বলে?",
    options: [
      { letter: "A", text: "কোনো রচনার সংক্ষিপ্ত মূলভাব" },
      { letter: "B", text: "রচনার শুধু শুরু" },
      { letter: "C", text: "পুরো রচনা হুবহু লেখা" },
      { letter: "D", text: "রচনার শুধু শেষ" }
    ],
    correctLetter: "A",
    explanation: "সারাংশ হলো কোনো রচনার সংক্ষিপ্ত মূলভাব।",
    difficulty: "medium",
    sourceNote: "বাংলা ব্যাকরণ ও নির্মিতি, ষষ্ঠ শ্রেণি (NCTB), নির্মিতি ২: সারাংশ ও সারমর্ম রচনা",
  },
  {
    id: "ACAD-C6-GRA-019",
    classId: "class-6",
    subjectId: "bangla-grammar",
    chapterId: "acad-class-6-bgr-nirmiti-3",
    chapterName: "৩. ভাবসম্প্রসারণ",
    unitNumber: 3,
    topicId: "expansion",
    questionText: "ভাবসম্প্রসারণ বলতে কী বোঝায়?",
    options: [
      { letter: "A", text: "ভাব সংক্ষেপ করা" },
      { letter: "B", text: "ভাব মুখস্থ করা" },
      { letter: "C", text: "ভাবকে বিস্তারিতভাবে ব্যাখ্যা করা" },
      { letter: "D", text: "ভাব বাদ দেওয়া" }
    ],
    correctLetter: "C",
    explanation: "ভাবসম্প্রসারণ মানে কোনো ভাব বা উক্তিকে বিস্তারিতভাবে ব্যাখ্যা করা।",
    difficulty: "medium",
    sourceNote: "বাংলা ব্যাকরণ ও নির্মিতি, ষষ্ঠ শ্রেণি (NCTB), নির্মিতি ৩: ভাবসম্প্রসারণ",
  },
  {
    id: "ACAD-C6-GRA-020",
    classId: "class-6",
    subjectId: "bangla-grammar",
    chapterId: "acad-class-6-bgr-nirmiti-4",
    chapterName: "৪. পত্র রচনা",
    unitNumber: 4,
    topicId: "letter",
    questionText: "পত্র রচনায় কী লিখতে হয়?",
    options: [
      { letter: "A", text: "পত্রে তারিখ লেখা যায় না" },
      { letter: "B", text: "পত্রে সম্বোধন লেখা যায় না" },
      { letter: "C", text: "প্রাপকের নাম ও ঠিকানা লিখতে হয়" },
      { letter: "D", text: "প্রাপকের নাম লেখা যায় না" }
    ],
    correctLetter: "C",
    explanation: "পত্রে প্রাপকের নাম ও ঠিকানা লিখতে হয়।",
    difficulty: "easy",
    sourceNote: "বাংলা ব্যাকরণ ও নির্মিতি, ষষ্ঠ শ্রেণি (NCTB), নির্মিতি ৪: পত্র রচনা",
  },
  {
    id: "ACAD-C6-GRA-021",
    classId: "class-6",
    subjectId: "bangla-grammar",
    chapterId: "acad-class-6-bgr-nirmiti-5",
    chapterName: "৫. অনুচ্ছেদ রচনা",
    unitNumber: 5,
    topicId: "paragraph",
    questionText: "অনুচ্ছেদ কাকে বলে?",
    options: [
      { letter: "A", text: "শুধু চিঠি" },
      { letter: "B", text: "শুধু কবিতা" },
      { letter: "C", text: "বড় প্রবন্ধ" },
      { letter: "D", text: "কোনো বিষয়ের উপর সংক্ষিপ্ত রচনা" }
    ],
    correctLetter: "D",
    explanation: "অনুচ্ছেদ হলো কোনো বিষয়ের উপর সংক্ষিপ্ত রচনা।",
    difficulty: "medium",
    sourceNote: "বাংলা ব্যাকরণ ও নির্মিতি, ষষ্ঠ শ্রেণি (NCTB), নির্মিতি ৫: অনুচ্ছেদ রচনা",
  },
  {
    id: "ACAD-C6-GRA-022",
    classId: "class-6",
    subjectId: "bangla-grammar",
    chapterId: "acad-class-6-bgr-nirmiti-6",
    chapterName: "৬. প্রবন্ধ রচনা",
    unitNumber: 6,
    topicId: "essay",
    questionText: "প্রবন্ধ রচনার অংশগুলো কী কী?",
    options: [
      { letter: "A", text: "শুধু ভূমিকা" },
      { letter: "B", text: "ভূমিকা, মূল আলোচনা ও উপসংহার" },
      { letter: "C", text: "শুধু মূল আলোচনা" },
      { letter: "D", text: "শুধু উপসংহার" }
    ],
    correctLetter: "B",
    explanation: "প্রবন্ধ রচনায় ভূমিকা, মূল আলোচনা ও উপসংহার থাকে।",
    difficulty: "medium",
    sourceNote: "বাংলা ব্যাকরণ ও নির্মিতি, ষষ্ঠ শ্রেণি (NCTB), নির্মিতি ৬: প্রবন্ধ রচনা",
  },
  {
    id: "ACAD-C6-GRA-023",
    classId: "class-6",
    subjectId: "bangla-grammar",
    chapterId: "acad-class-6-bgr-chapter-2",
    chapterName: "২. ধ্বনিতত্ত্ব",
    unitNumber: 2,
    topicId: "phonetics",
    questionText: "বাংলা বর্ণমালায় ব্যঞ্জনবর্ণ কয়টি?",
    options: [
      { letter: "A", text: "৩৯টি" },
      { letter: "B", text: "৭টি" },
      { letter: "C", text: "১১টি" },
      { letter: "D", text: "৫০টি" }
    ],
    correctLetter: "A",
    explanation: "বাংলা বর্ণমালায় ব্যঞ্জনবর্ণ ৩৯টি।",
    difficulty: "medium",
    sourceNote: "বাংলা ব্যাকরণ ও নির্মিতি, ষষ্ঠ শ্রেণি (NCTB), অধ্যায় ২: ধ্বনিতত্ত্ব",
  },
  {
    id: "ACAD-C6-GRA-024",
    classId: "class-6",
    subjectId: "bangla-grammar",
    chapterId: "acad-class-6-bgr-chapter-3",
    chapterName: "৩. রূপতত্ত্ব",
    unitNumber: 3,
    topicId: "morphology",
    questionText: "'সে' কোন পদ?",
    options: [
      { letter: "A", text: "ক্রিয়া" },
      { letter: "B", text: "সর্বনাম" },
      { letter: "C", text: "বিশেষ্য" },
      { letter: "D", text: "বিশেষণ" }
    ],
    correctLetter: "B",
    explanation: "'সে' একটি সর্বনাম পদ।",
    difficulty: "medium",
    sourceNote: "বাংলা ব্যাকরণ ও নির্মিতি, ষষ্ঠ শ্রেণি (NCTB), অধ্যায় ৩: রূপতত্ত্ব",
  },
];
