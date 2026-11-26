// Eduvelto — Academic Agriculture practice questions (Class 6),
// verified against the NCTB books (review 26 Nov 2026).
//
// Static data ONLY — zero Firestore reads. The 24 questions are the
// Academic Class 6 Agriculture drafts AFTER review (see
// review-academic-c6-agriculture-verdicts.json and
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
// to PUBLIC_ACADEMIC_AGRICULTURE_QUESTIONS below (same shape, same generation
// script with the new draft + verdict files). Chapters, counts and
// the practice pages are DERIVED from the combined pool in
// src/lib/publicAcademic.ts, so no component or route change is
// needed when a batch is verified. NEVER add a question whose
// verdict is not VERIFIED (or NEEDS-FIX / REJECTED with the fix
// applied) — unverified drafts must never reach students.

import { type PublicAcademicQuestion } from './publicAcademic';

/** All verified Academic Agriculture questions, in draft order (Class 6). */
export const PUBLIC_ACADEMIC_AGRICULTURE_QUESTIONS: PublicAcademicQuestion[] = [
  {
    id: "ACAD-C6-AGR-001",
    classId: "class-6",
    subjectId: "agriculture",
    chapterId: "acad-class-6-agr-chapter-1",
    chapterName: "১. আমাদের জীবনে কৃষি",
    unitNumber: 1,
    topicId: "importance",
    questionText: "কৃষি থেকে আমরা প্রধানত কী পাই?",
    options: [
      { letter: "A", text: "বাড়ি পাই" },
      { letter: "B", text: "গাড়ি পাই" },
      { letter: "C", text: "খাদ্য পাই" },
      { letter: "D", text: "পোশাক পাই" }
    ],
    correctLetter: "C",
    explanation: "কৃষি থেকে আমরা খাদ্য পাই।",
    difficulty: "easy",
    sourceNote: "কৃষিশিক্ষা, ষষ্ঠ শ্রেণি (NCTB), অধ্যায় ১: আমাদের জীবনে কৃষি",
  },
  {
    id: "ACAD-C6-AGR-002",
    classId: "class-6",
    subjectId: "agriculture",
    chapterId: "acad-class-6-agr-chapter-1",
    chapterName: "১. আমাদের জীবনে কৃষি",
    unitNumber: 1,
    topicId: "importance",
    questionText: "বাংলাদেশের বেশিরভাগ মানুষ কিসের উপর নির্ভরশীল?",
    options: [
      { letter: "A", text: "বাণিজ্যের উপর" },
      { letter: "B", text: "শিল্পের উপর" },
      { letter: "C", text: "পর্যটনের উপর" },
      { letter: "D", text: "কৃষির উপর" }
    ],
    correctLetter: "D",
    explanation: "বাংলাদেশের বেশিরভাগ মানুষ কৃষির উপর নির্ভরশীল।",
    difficulty: "medium",
    sourceNote: "কৃষিশিক্ষা, ষষ্ঠ শ্রেণি (NCTB), অধ্যায় ১: আমাদের জীবনে কৃষি",
  },
  {
    id: "ACAD-C6-AGR-003",
    classId: "class-6",
    subjectId: "agriculture",
    chapterId: "acad-class-6-agr-chapter-1",
    chapterName: "১. আমাদের জীবনে কৃষি",
    unitNumber: 1,
    topicId: "crops",
    questionText: "নিচের কোনটি কৃষিজ ফসল?",
    options: [
      { letter: "A", text: "ধান" },
      { letter: "B", text: "লোহা" },
      { letter: "C", text: "সোনা" },
      { letter: "D", text: "কয়লা" }
    ],
    correctLetter: "A",
    explanation: "ধান, গম, পাট — এগুলো কৃষিজ ফসল।",
    difficulty: "medium",
    sourceNote: "কৃষিশিক্ষা, ষষ্ঠ শ্রেণি (NCTB), অধ্যায় ১: আমাদের জীবনে কৃষি",
  },
  {
    id: "ACAD-C6-AGR-004",
    classId: "class-6",
    subjectId: "agriculture",
    chapterId: "acad-class-6-agr-chapter-1",
    chapterName: "১. আমাদের জীবনে কৃষি",
    unitNumber: 1,
    topicId: "economy",
    questionText: "বাংলাদেশের অর্থনীতির মূল ভিত্তি কী?",
    options: [
      { letter: "A", text: "কৃষি" },
      { letter: "B", text: "শিল্প" },
      { letter: "C", text: "পর্যটন" },
      { letter: "D", text: "বাণিজ্য" }
    ],
    correctLetter: "A",
    explanation: "কৃষি বাংলাদেশের অর্থনীতির মূল ভিত্তি।",
    difficulty: "easy",
    sourceNote: "কৃষিশিক্ষা, ষষ্ঠ শ্রেণি (NCTB), অধ্যায় ১: আমাদের জীবনে কৃষি",
  },
  {
    id: "ACAD-C6-AGR-005",
    classId: "class-6",
    subjectId: "agriculture",
    chapterId: "acad-class-6-agr-chapter-2",
    chapterName: "২. কৃষি প্রযুক্তি ও যন্ত্রপাতি",
    unitNumber: 2,
    topicId: "technology",
    questionText: "জমি চাষের আধুনিক যন্ত্র কোনটি?",
    options: [
      { letter: "A", text: "দা" },
      { letter: "B", text: "লাঙল" },
      { letter: "C", text: "কোদাল" },
      { letter: "D", text: "ট্রাক্টর" }
    ],
    correctLetter: "D",
    explanation: "ট্রাক্টর জমি চাষের আধুনিক যন্ত্র।",
    difficulty: "easy",
    sourceNote: "কৃষিশিক্ষা, ষষ্ঠ শ্রেণি (NCTB), অধ্যায় ২: কৃষি প্রযুক্তি ও যন্ত্রপাতি",
  },
  {
    id: "ACAD-C6-AGR-006",
    classId: "class-6",
    subjectId: "agriculture",
    chapterId: "acad-class-6-agr-chapter-2",
    chapterName: "২. কৃষি প্রযুক্তি ও যন্ত্রপাতি",
    unitNumber: 2,
    topicId: "technology",
    questionText: "জমিতে পানি দেওয়ার যন্ত্র কোনটি?",
    options: [
      { letter: "A", text: "লাঙল" },
      { letter: "B", text: "কোদাল" },
      { letter: "C", text: "সেচযন্ত্র" },
      { letter: "D", text: "ট্রাক্টর" }
    ],
    correctLetter: "C",
    explanation: "সেচযন্ত্র দিয়ে জমিতে পানি দেওয়া হয়।",
    difficulty: "medium",
    sourceNote: "কৃষিশিক্ষা, ষষ্ঠ শ্রেণি (NCTB), অধ্যায় ২: কৃষি প্রযুক্তি ও যন্ত্রপাতি",
  },
  {
    id: "ACAD-C6-AGR-007",
    classId: "class-6",
    subjectId: "agriculture",
    chapterId: "acad-class-6-agr-chapter-2",
    chapterName: "২. কৃষি প্রযুক্তি ও যন্ত্রপাতি",
    unitNumber: 2,
    topicId: "technology",
    questionText: "আধুনিক যন্ত্র ব্যবহারের সুফল কী?",
    options: [
      { letter: "A", text: "ফসল কম হয়" },
      { letter: "B", text: "কৃষিকাজ দ্রুত ও সহজ হয়" },
      { letter: "C", text: "খরচ বাড়ে" },
      { letter: "D", text: "কৃষিকাজ কঠিন হয়" }
    ],
    correctLetter: "B",
    explanation: "আধুনিক যন্ত্র ব্যবহারে কৃষিকাজ দ্রুত ও সহজ হয়।",
    difficulty: "medium",
    sourceNote: "কৃষিশিক্ষা, ষষ্ঠ শ্রেণি (NCTB), অধ্যায় ২: কৃষি প্রযুক্তি ও যন্ত্রপাতি",
  },
  {
    id: "ACAD-C6-AGR-008",
    classId: "class-6",
    subjectId: "agriculture",
    chapterId: "acad-class-6-agr-chapter-2",
    chapterName: "২. কৃষি প্রযুক্তি ও যন্ত্রপাতি",
    unitNumber: 2,
    topicId: "technology",
    questionText: "জমি চাষের প্রাচীন যন্ত্র কোনটি?",
    options: [
      { letter: "A", text: "ট্রাক্টর" },
      { letter: "B", text: "হারভেস্টার" },
      { letter: "C", text: "লাঙল" },
      { letter: "D", text: "সেচযন্ত্র" }
    ],
    correctLetter: "C",
    explanation: "লাঙল জমি চাষের প্রাচীন যন্ত্র।",
    difficulty: "easy",
    sourceNote: "কৃষিশিক্ষা, ষষ্ঠ শ্রেণি (NCTB), অধ্যায় ২: কৃষি প্রযুক্তি ও যন্ত্রপাতি",
  },
  {
    id: "ACAD-C6-AGR-009",
    classId: "class-6",
    subjectId: "agriculture",
    chapterId: "acad-class-6-agr-chapter-3",
    chapterName: "৩. কৃষি উপকরণ",
    unitNumber: 3,
    topicId: "inputs",
    questionText: "কৃষির একটি প্রধান উপকরণ কোনটি?",
    options: [
      { letter: "A", text: "কয়লা" },
      { letter: "B", text: "পাথর" },
      { letter: "C", text: "বীজ" },
      { letter: "D", text: "লোহা" }
    ],
    correctLetter: "C",
    explanation: "বীজ কৃষির একটি প্রধান উপকরণ।",
    difficulty: "easy",
    sourceNote: "কৃষিশিক্ষা, ষষ্ঠ শ্রেণি (NCTB), অধ্যায় ৩: কৃষি উপকরণ",
  },
  {
    id: "ACAD-C6-AGR-010",
    classId: "class-6",
    subjectId: "agriculture",
    chapterId: "acad-class-6-agr-chapter-3",
    chapterName: "৩. কৃষি উপকরণ",
    unitNumber: 3,
    topicId: "inputs",
    questionText: "মাটির উর্বরতা বাড়াতে কী ব্যবহার করা হয়?",
    options: [
      { letter: "A", text: "পানি" },
      { letter: "B", text: "কীটনাশক" },
      { letter: "C", text: "বীজ" },
      { letter: "D", text: "সার" }
    ],
    correctLetter: "D",
    explanation: "সার মাটির উর্বরতা বাড়ায়।",
    difficulty: "medium",
    sourceNote: "কৃষিশিক্ষা, ষষ্ঠ শ্রেণি (NCTB), অধ্যায় ৩: কৃষি উপকরণ",
  },
  {
    id: "ACAD-C6-AGR-011",
    classId: "class-6",
    subjectId: "agriculture",
    chapterId: "acad-class-6-agr-chapter-3",
    chapterName: "৩. কৃষি উপকরণ",
    unitNumber: 3,
    topicId: "inputs",
    questionText: "বেশি ফসল পেতে কেমন বীজ দরকার?",
    options: [
      { letter: "A", text: "খারাপ বীজ" },
      { letter: "B", text: "ভালো বীজ" },
      { letter: "C", text: "পচা বীজ" },
      { letter: "D", text: "শুকনো বীজ" }
    ],
    correctLetter: "B",
    explanation: "ভালো বীজ থেকে ভালো ফসল হয়।",
    difficulty: "medium",
    sourceNote: "কৃষিশিক্ষা, ষষ্ঠ শ্রেণি (NCTB), অধ্যায় ৩: কৃষি উপকরণ",
  },
  {
    id: "ACAD-C6-AGR-012",
    classId: "class-6",
    subjectId: "agriculture",
    chapterId: "acad-class-6-agr-chapter-3",
    chapterName: "৩. কৃষি উপকরণ",
    unitNumber: 3,
    topicId: "inputs",
    questionText: "কীটনাশকের কাজ কী?",
    options: [
      { letter: "A", text: "ফসলের ক্ষতিকর পোকা দমন করে" },
      { letter: "B", text: "ফসল বাড়ায়" },
      { letter: "C", text: "পানি দেয়" },
      { letter: "D", text: "মাটি নরম করে" }
    ],
    correctLetter: "A",
    explanation: "কীটনাশক ফসলের ক্ষতিকর পোকা দমন করে।",
    difficulty: "medium",
    sourceNote: "কৃষিশিক্ষা, ষষ্ঠ শ্রেণি (NCTB), অধ্যায় ৩: কৃষি উপকরণ",
  },
  {
    id: "ACAD-C6-AGR-013",
    classId: "class-6",
    subjectId: "agriculture",
    chapterId: "acad-class-6-agr-chapter-4",
    chapterName: "৪. কৃষি ও জলবায়ু",
    unitNumber: 4,
    topicId: "climate",
    questionText: "কৃষির জন্য প্রয়োজনীয় পানি দেয় কোনটি?",
    options: [
      { letter: "A", text: "বৃষ্টি" },
      { letter: "B", text: "খরা" },
      { letter: "C", text: "বন্যা" },
      { letter: "D", text: "ঝড়" }
    ],
    correctLetter: "A",
    explanation: "বৃষ্টি কৃষির জন্য প্রয়োজনীয় পানি দেয়।",
    difficulty: "easy",
    sourceNote: "কৃষিশিক্ষা, ষষ্ঠ শ্রেণি (NCTB), অধ্যায় ৪: কৃষি ও জলবায়ু",
  },
  {
    id: "ACAD-C6-AGR-014",
    classId: "class-6",
    subjectId: "agriculture",
    chapterId: "acad-class-6-agr-chapter-4",
    chapterName: "৪. কৃষি ও জলবায়ু",
    unitNumber: 4,
    topicId: "climate",
    questionText: "বন্যা কৃষিতে কী প্রভাব ফেলে?",
    options: [
      { letter: "A", text: "কিছুই করে না" },
      { letter: "B", text: "ফসলের ক্ষতি করে" },
      { letter: "C", text: "ফসল বাড়ায়" },
      { letter: "D", text: "মাটি উর্বর করে" }
    ],
    correctLetter: "B",
    explanation: "বন্যা ফসলের ক্ষতি করে।",
    difficulty: "medium",
    sourceNote: "কৃষিশিক্ষা, ষষ্ঠ শ্রেণি (NCTB), অধ্যায় ৪: কৃষি ও জলবায়ু",
  },
  {
    id: "ACAD-C6-AGR-015",
    classId: "class-6",
    subjectId: "agriculture",
    chapterId: "acad-class-6-agr-chapter-4",
    chapterName: "৪. কৃষি ও জলবায়ু",
    unitNumber: 4,
    topicId: "climate",
    questionText: "খরা বলতে কী বোঝায়?",
    options: [
      { letter: "A", text: "ঝড়" },
      { letter: "B", text: "বেশি বৃষ্টি" },
      { letter: "C", text: "বন্যা" },
      { letter: "D", text: "দীর্ঘদিন বৃষ্টি না হওয়া" }
    ],
    correctLetter: "D",
    explanation: "খরা মানে দীর্ঘদিন বৃষ্টি না হওয়া — এতে ফসল নষ্ট হয়।",
    difficulty: "medium",
    sourceNote: "কৃষিশিক্ষা, ষষ্ঠ শ্রেণি (NCTB), অধ্যায় ৪: কৃষি ও জলবায়ু",
  },
  {
    id: "ACAD-C6-AGR-016",
    classId: "class-6",
    subjectId: "agriculture",
    chapterId: "acad-class-6-agr-chapter-4",
    chapterName: "৪. কৃষি ও জলবায়ু",
    unitNumber: 4,
    topicId: "climate",
    questionText: "আমন ধান কোন মৌসুমে চাষ করা হয়?",
    options: [
      { letter: "A", text: "সব সময়" },
      { letter: "B", text: "শীতকালে" },
      { letter: "C", text: "গ্রীষ্মকালে" },
      { letter: "D", text: "বর্ষাকালে" }
    ],
    correctLetter: "D",
    explanation: "আমন ধান বর্ষাকালে চাষ করা হয়।",
    difficulty: "medium",
    sourceNote: "কৃষিশিক্ষা, ষষ্ঠ শ্রেণি (NCTB), অধ্যায় ৪: কৃষি ও জলবায়ু",
  },
  {
    id: "ACAD-C6-AGR-017",
    classId: "class-6",
    subjectId: "agriculture",
    chapterId: "acad-class-6-agr-chapter-5",
    chapterName: "৫. কৃষিজ উৎপাদন",
    unitNumber: 5,
    topicId: "production",
    questionText: "বাংলাদেশের প্রধান কৃষিজ উৎপাদন কোনটি?",
    options: [
      { letter: "A", text: "ভুট্টা" },
      { letter: "B", text: "ধান" },
      { letter: "C", text: "গম" },
      { letter: "D", text: "আলু" }
    ],
    correctLetter: "B",
    explanation: "ধান বাংলাদেশের প্রধান কৃষিজ উৎপাদন।",
    difficulty: "easy",
    sourceNote: "কৃষিশিক্ষা, ষষ্ঠ শ্রেণি (NCTB), অধ্যায় ৫: কৃষিজ উৎপাদন",
  },
  {
    id: "ACAD-C6-AGR-018",
    classId: "class-6",
    subjectId: "agriculture",
    chapterId: "acad-class-6-agr-chapter-5",
    chapterName: "৫. কৃষিজ উৎপাদন",
    unitNumber: 5,
    topicId: "production",
    questionText: "পুষ্টিকর খাদ্য হিসেবে কোন ফসল চাষ করা হয়?",
    options: [
      { letter: "A", text: "পাট" },
      { letter: "B", text: "সবজি" },
      { letter: "C", text: "ধান" },
      { letter: "D", text: "তুলা" }
    ],
    correctLetter: "B",
    explanation: "সবজি চাষ থেকে আমরা পুষ্টিকর খাদ্য পাই।",
    difficulty: "medium",
    sourceNote: "কৃষিশিক্ষা, ষষ্ঠ শ্রেণি (NCTB), অধ্যায় ৫: কৃষিজ উৎপাদন",
  },
  {
    id: "ACAD-C6-AGR-019",
    classId: "class-6",
    subjectId: "agriculture",
    chapterId: "acad-class-6-agr-chapter-5",
    chapterName: "৫. কৃষিজ উৎপাদন",
    unitNumber: 5,
    topicId: "production",
    questionText: "পশুপালন বলতে কী বোঝায়?",
    options: [
      { letter: "A", text: "মাছ ধরা" },
      { letter: "B", text: "গরু-ছাগল পালন" },
      { letter: "C", text: "ধান চাষ" },
      { letter: "D", text: "বনায়ন" }
    ],
    correctLetter: "B",
    explanation: "গরু, ছাগল, মুরগি — এগুলো পশুপালনের অন্তর্ভুক্ত।",
    difficulty: "medium",
    sourceNote: "কৃষিশিক্ষা, ষষ্ঠ শ্রেণি (NCTB), অধ্যায় ৫: কৃষিজ উৎপাদন",
  },
  {
    id: "ACAD-C6-AGR-020",
    classId: "class-6",
    subjectId: "agriculture",
    chapterId: "acad-class-6-agr-chapter-5",
    chapterName: "৫. কৃষিজ উৎপাদন",
    unitNumber: 5,
    topicId: "production",
    questionText: "আমিষের উৎস হিসেবে কোনটি চাষ করা হয়?",
    options: [
      { letter: "A", text: "মাছ চাষ" },
      { letter: "B", text: "ধান চাষ" },
      { letter: "C", text: "বনায়ন" },
      { letter: "D", text: "পাট চাষ" }
    ],
    correctLetter: "A",
    explanation: "মাছ চাষ থেকে আমরা আমিষ পাই।",
    difficulty: "medium",
    sourceNote: "কৃষিশিক্ষা, ষষ্ঠ শ্রেণি (NCTB), অধ্যায় ৫: কৃষিজ উৎপাদন",
  },
  {
    id: "ACAD-C6-AGR-021",
    classId: "class-6",
    subjectId: "agriculture",
    chapterId: "acad-class-6-agr-chapter-6",
    chapterName: "৬. বনায়ন",
    unitNumber: 6,
    topicId: "forestry",
    questionText: "বনায়ন বলতে কী বোঝায়?",
    options: [
      { letter: "A", text: "গাছ কাটা" },
      { letter: "B", text: "গাছ পোড়ানো" },
      { letter: "C", text: "গাছ বিক্রি করা" },
      { letter: "D", text: "গাছ লাগানো" }
    ],
    correctLetter: "D",
    explanation: "গাছ লাগানোকে বনায়ন বলে।",
    difficulty: "easy",
    sourceNote: "কৃষিশিক্ষা, ষষ্ঠ শ্রেণি (NCTB), অধ্যায় ৬: বনায়ন",
  },
  {
    id: "ACAD-C6-AGR-022",
    classId: "class-6",
    subjectId: "agriculture",
    chapterId: "acad-class-6-agr-chapter-6",
    chapterName: "৬. বনায়ন",
    unitNumber: 6,
    topicId: "forestry",
    questionText: "গাছ থেকে আমরা কোন গ্যাস পাই?",
    options: [
      { letter: "A", text: "অক্সিজেন" },
      { letter: "B", text: "হাইড্রোজেন" },
      { letter: "C", text: "নাইট্রোজেন" },
      { letter: "D", text: "কার্বন ডাই-অক্সাইড" }
    ],
    correctLetter: "A",
    explanation: "গাছ থেকে আমরা অক্সিজেন পাই।",
    difficulty: "medium",
    sourceNote: "কৃষিশিক্ষা, ষষ্ঠ শ্রেণি (NCTB), অধ্যায় ৬: বনায়ন",
  },
  {
    id: "ACAD-C6-AGR-023",
    classId: "class-6",
    subjectId: "agriculture",
    chapterId: "acad-class-6-agr-chapter-6",
    chapterName: "৬. বনায়ন",
    unitNumber: 6,
    topicId: "forestry",
    questionText: "বনের একটি গুরুত্বপূর্ণ কাজ কী?",
    options: [
      { letter: "A", text: "বন্যা বাড়ায়" },
      { letter: "B", text: "খরা বাড়ায়" },
      { letter: "C", text: "পরিবেশের ভারসাম্য রক্ষা করে" },
      { letter: "D", text: "মাটি ক্ষয় করে" }
    ],
    correctLetter: "C",
    explanation: "বন পরিবেশের ভারসাম্য রক্ষা করে।",
    difficulty: "medium",
    sourceNote: "কৃষিশিক্ষা, ষষ্ঠ শ্রেণি (NCTB), অধ্যায় ৬: বনায়ন",
  },
  {
    id: "ACAD-C6-AGR-024",
    classId: "class-6",
    subjectId: "agriculture",
    chapterId: "acad-class-6-agr-chapter-6",
    chapterName: "৬. বনায়ন",
    unitNumber: 6,
    topicId: "forestry",
    questionText: "বাংলাদেশের সবচেয়ে বড় বন কোনটি?",
    options: [
      { letter: "A", text: "মধুপুর বন" },
      { letter: "B", text: "ভাওয়াল বন" },
      { letter: "C", text: "সুন্দরবন" },
      { letter: "D", text: "লাউয়াছড়া বন" }
    ],
    correctLetter: "C",
    explanation: "সুন্দরবন বাংলাদেশের সবচেয়ে বড় বন।",
    difficulty: "medium",
    sourceNote: "কৃষিশিক্ষা, ষষ্ঠ শ্রেণি (NCTB), অধ্যায় ৬: বনায়ন",
  },
];
