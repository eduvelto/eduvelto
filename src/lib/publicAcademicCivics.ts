// Eduvelto — Academic Civics and Citizenship practice questions (Class 9),
// verified against the Dakhil NCTB books (review 26 Nov 2026).
//
// Static data ONLY — zero Firestore reads. The 22 questions are the
// Academic Class 9 Civics and Citizenship drafts AFTER review (see
// review-academic-c9-civics-history-verdicts.json and
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
// to PUBLIC_ACADEMIC_CIVICS_QUESTIONS below (same shape, same generation
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

/** All verified Academic Civics and Citizenship questions, Class 9 (in draft order). */
export const PUBLIC_ACADEMIC_CIVICS_QUESTIONS: PublicAcademicQuestion[] = [
  {
    id: "ACAD-1081",
    classId: "class-9",
    subjectId: "civics",
    chapterId: "acad-class-9-civ-chapter-1",
    chapterName: "অধ্যায় ১: নাগরিক",
    unitNumber: 1,
    topicId: "chapter-1",
    questionText: "রাষ্ট্রের স্থায়ী বাসিন্দা ও অধিকারভোগীকে কী বলে?",
    options: [
      { letter: "A", text: "নাগরিক" },
      { letter: "B", text: "প্রজা" },
      { letter: "C", text: "শরণার্থী" },
      { letter: "D", text: "অতিথি" }
    ],
    correctLetter: "A",
    explanation: "রাষ্ট্রের স্থায়ী সদস্য হিসেবে যিনি অধিকার ভোগ করেন ও দায়িত্ব পালন করেন, তিনিই নাগরিক।",
    difficulty: "easy",
    sourceNote: "NCTB পৌরনীতি ও নাগরিকতা, নবম-দশম শ্রেণি — অধ্যায় ১: নাগরিক",
  },
  {
    id: "ACAD-1082",
    classId: "class-9",
    subjectId: "civics",
    chapterId: "acad-class-9-civ-topic-1",
    chapterName: "রাষ্ট্র",
    unitNumber: 2,
    topicId: "topic-1",
    questionText: "রাষ্ট্র গঠনের উপাদান কয়টি?",
    options: [
      { letter: "A", text: "৬টি" },
      { letter: "B", text: "৩টি" },
      { letter: "C", text: "৫টি" },
      { letter: "D", text: "৪টি" }
    ],
    correctLetter: "D",
    explanation: "রাষ্ট্রের উপাদান ৪টি: জনসমষ্টি, নির্দিষ্ট ভূখণ্ড, সরকার ও সার্বভৌমত্ব।",
    difficulty: "medium",
    sourceNote: "NCTB পৌরনীতি ও নাগরিকতা, নবম-দশম শ্রেণি — রাষ্ট্র অধ্যায়",
  },
  {
    id: "ACAD-1083",
    classId: "class-9",
    subjectId: "civics",
    chapterId: "acad-class-9-civ-topic-2",
    chapterName: "সংবিধান",
    unitNumber: 3,
    topicId: "topic-2",
    questionText: "সংবিধান কী?",
    options: [
      { letter: "A", text: "ধর্মীয় বিধান" },
      { letter: "B", text: "সরকারি নির্দেশ" },
      { letter: "C", text: "সাধারণ আইন" },
      { letter: "D", text: "রাষ্ট্র পরিচালনার মূল আইন" }
    ],
    correctLetter: "D",
    explanation: "সংবিধান রাষ্ট্র পরিচালনার সর্বোচ্চ আইন; সব আইন সংবিধানের অধীন।",
    difficulty: "medium",
    sourceNote: "NCTB পৌরনীতি ও নাগরিকতা, নবম-দশম শ্রেণি — সংবিধান অধ্যায়",
  },
  {
    id: "ACAD-1084",
    classId: "class-9",
    subjectId: "civics",
    chapterId: "acad-class-9-civ-topic-3",
    chapterName: "গণতন্ত্র",
    unitNumber: 4,
    topicId: "topic-3",
    questionText: "গণতন্ত্রে ক্ষমতার উৎস কে?",
    options: [
      { letter: "A", text: "সেনাবাহিনী" },
      { letter: "B", text: "আমলা" },
      { letter: "C", text: "জনগণ" },
      { letter: "D", text: "রাজা" }
    ],
    correctLetter: "C",
    explanation: "গণতন্ত্রে জনগণই ক্ষমতার উৎস; জনগণ ভোটে প্রতিনিধি নির্বাচন করে।",
    difficulty: "easy",
    sourceNote: "NCTB পৌরনীতি ও নাগরিকতা, নবম-দশম শ্রেণি — গণতন্ত্র অধ্যায়",
  },
  {
    id: "ACAD-1085",
    classId: "class-9",
    subjectId: "civics",
    chapterId: "acad-class-9-civ-topic-4",
    chapterName: "নির্বাচন",
    unitNumber: 5,
    topicId: "topic-4",
    questionText: "ভোট দেওয়ার সর্বনিম্ন বয়স বাংলাদেশে কত?",
    options: [
      { letter: "A", text: "১৮ বছর" },
      { letter: "B", text: "২১ বছর" },
      { letter: "C", text: "২৫ বছর" },
      { letter: "D", text: "১৬ বছর" }
    ],
    correctLetter: "A",
    explanation: "বাংলাদেশে ১৮ বছর বয়স পূর্ণ হলে নাগরিক ভোটার হতে পারেন।",
    difficulty: "easy",
    sourceNote: "NCTB পৌরনীতি ও নাগরিকতা, নবম-দশম শ্রেণি — নির্বাচন অধ্যায়",
  },
  {
    id: "ACAD-1086",
    classId: "class-9",
    subjectId: "civics",
    chapterId: "acad-class-9-civ-topic-5",
    chapterName: "আইনের শাসন",
    unitNumber: 6,
    topicId: "topic-5",
    questionText: "আইনের শাসনের মূল কথা কী?",
    options: [
      { letter: "A", text: "আইনের ঊর্ধ্বে কেউ নয়" },
      { letter: "B", text: "আইন শুধু সাধারণ মানুষের জন্য" },
      { letter: "C", text: "আইন পরিবর্তন করা যায় না" },
      { letter: "D", text: "শাসক আইনের ঊর্ধ্বে" }
    ],
    correctLetter: "A",
    explanation: "আইনের শাসনে সবাই আইনের অধীন; কেউ আইনের ঊর্ধ্বে নয়।",
    difficulty: "medium",
    sourceNote: "NCTB পৌরনীতি ও নাগরিকতা, নবম-দশম শ্রেণি — আইনের শাসন",
  },
  {
    id: "ACAD-1087",
    classId: "class-9",
    subjectId: "civics",
    chapterId: "acad-class-9-civ-topic-6",
    chapterName: "মানবাধিকার",
    unitNumber: 7,
    topicId: "topic-6",
    questionText: "মানবাধিকারের মূল ভিত্তি কী?",
    options: [
      { letter: "A", text: "ক্ষমতা" },
      { letter: "B", text: "শিক্ষা" },
      { letter: "C", text: "মানুষ হিসেবে জন্ম" },
      { letter: "D", text: "সম্পদ" }
    ],
    correctLetter: "C",
    explanation: "মানুষ হিসেবে জন্ম নিলেই কিছু অধিকার পাওয়া যায়; এগুলো মানবাধিকার।",
    difficulty: "medium",
    sourceNote: "NCTB পৌরনীতি ও নাগরিকতা, নবম-দশম শ্রেণি — মানবাধিকার অধ্যায়",
  },
  {
    id: "ACAD-1088",
    classId: "class-9",
    subjectId: "civics",
    chapterId: "acad-class-9-civ-topic-7",
    chapterName: "স্থানীয় সরকার",
    unitNumber: 8,
    topicId: "topic-7",
    questionText: "গ্রামের স্থানীয় সরকারের সর্বনিম্ন স্তর কোনটি?",
    options: [
      { letter: "A", text: "জেলা পরিষদ" },
      { letter: "B", text: "ইউনিয়ন পরিষদ" },
      { letter: "C", text: "উপজেলা পরিষদ" },
      { letter: "D", text: "পৌরসভা" }
    ],
    correctLetter: "B",
    explanation: "ইউনিয়ন পরিষদ গ্রামীণ স্থানীয় সরকারের সর্বনিম্ন স্তর।",
    difficulty: "medium",
    sourceNote: "NCTB পৌরনীতি ও নাগরিকতা, নবম-দশম শ্রেণি — স্থানীয় সরকার",
  },
  {
    id: "ACAD-1089",
    classId: "class-9",
    subjectId: "civics",
    chapterId: "acad-class-9-civ-topic-8",
    chapterName: "দুর্নীতি",
    unitNumber: 9,
    topicId: "topic-8",
    questionText: "দুর্নীতি দমনে বাংলাদেশের সংস্থা কোনটি?",
    options: [
      { letter: "A", text: "বাংলাদেশ ব্যাংক" },
      { letter: "B", text: "পুলিশ শুধু" },
      { letter: "C", text: "দুদক" },
      { letter: "D", text: "আদালত শুধু" }
    ],
    correctLetter: "C",
    explanation: "দুর্নীতি দমন কমিশন (দুদক) দুর্নীতি প্রতিরোধ ও দমনের দায়িত্বে আছে।",
    difficulty: "easy",
    sourceNote: "NCTB পৌরনীতি ও নাগরিকতা, নবম-দশম শ্রেণি — দুর্নীতি অধ্যায়",
  },
  {
    id: "ACAD-1090",
    classId: "class-9",
    subjectId: "civics",
    chapterId: "acad-class-9-civ-topic-9",
    chapterName: "জাতীয় সংসদ",
    unitNumber: 10,
    topicId: "topic-9",
    questionText: "বাংলাদেশের জাতীয় সংসদ কয় কক্ষবিশিষ্ট?",
    options: [
      { letter: "A", text: "ত্রিকক্ষবিশিষ্ট" },
      { letter: "B", text: "দ্বিকক্ষবিশিষ্ট" },
      { letter: "C", text: "এককক্ষবিশিষ্ট" },
      { letter: "D", text: "কোনো কক্ষ নেই" }
    ],
    correctLetter: "C",
    explanation: "বাংলাদেশের জাতীয় সংসদ এককক্ষবিশিষ্ট।",
    difficulty: "medium",
    sourceNote: "NCTB পৌরনীতি ও নাগরিকতা, নবম-দশম শ্রেণি — জাতীয় সংসদ",
  },
  {
    id: "ACAD-6097",
    classId: "class-9",
    subjectId: "civics",
    chapterId: "acad-class-9-civ-topic-10",
    chapterName: "নাগরিক",
    unitNumber: 11,
    topicId: "topic-10",
    questionText: "কোনো দেশে জন্ম নিলেই সে দেশের নাগরিকত্ব পাওয়ার নীতি কোনটি?",
    options: [
      { letter: "A", text: "ভাষা" },
      { letter: "B", text: "জন্মস্থান নীতি" },
      { letter: "C", text: "বসবাসের মেয়াদ শুধু" },
      { letter: "D", text: "রক্তের সম্পর্ক শুধু" }
    ],
    correctLetter: "B",
    explanation: "জন্মস্থান নীতিতে দেশে জন্ম নিলেই সে দেশের নাগরিকত্ব মেলে; রক্তের/জন্মনীতিতে পিতা-মাতার নাগরিকত্ব দেখা হয়।",
    difficulty: "medium",
    sourceNote: "NCTB পৌরনীতি ও নাগরিকতা — নাগরিকত্ব",
  },
  {
    id: "ACAD-6098",
    classId: "class-9",
    subjectId: "civics",
    chapterId: "acad-class-9-civ-topic-1",
    chapterName: "রাষ্ট্র",
    unitNumber: 2,
    topicId: "topic-1",
    questionText: "রাষ্ট্রের সার্বভৌমত্ব কার হাতে থাকে?",
    options: [
      { letter: "A", text: "আদালতের" },
      { letter: "B", text: "রাষ্ট্রের নিজের" },
      { letter: "C", text: "জনগণের শুধু" },
      { letter: "D", text: "সরকারের শুধু" }
    ],
    correctLetter: "B",
    explanation: "সার্বভৌমত্ব রাষ্ট্রের সর্বোচ্চ ক্ষমতা; সরকার তা প্রয়োগ করে।",
    difficulty: "medium",
    sourceNote: "NCTB পৌরনীতি ও নাগরিকতা — রাষ্ট্র",
  },
  {
    id: "ACAD-6099",
    classId: "class-9",
    subjectId: "civics",
    chapterId: "acad-class-9-civ-topic-2",
    chapterName: "সংবিধান",
    unitNumber: 3,
    topicId: "topic-2",
    questionText: "বাংলাদেশের সংবিধান কয়টি ভাগে বিভক্ত?",
    options: [
      { letter: "A", text: "৯টি ভাগ" },
      { letter: "B", text: "৭টি ভাগ" },
      { letter: "C", text: "১৫টি ভাগ" },
      { letter: "D", text: "১১টি ভাগ" }
    ],
    correctLetter: "D",
    explanation: "বাংলাদেশের সংবিধানে ১১টি ভাগ ও ১৫৩টি অনুচ্ছেদ আছে।",
    difficulty: "medium",
    sourceNote: "NCTB পৌরনীতি ও নাগরিকতা — সংবিধান",
  },
  {
    id: "ACAD-6100",
    classId: "class-9",
    subjectId: "civics",
    chapterId: "acad-class-9-civ-topic-3",
    chapterName: "গণতন্ত্র",
    unitNumber: 4,
    topicId: "topic-3",
    questionText: "প্রত্যক্ষ গণতন্ত্রের উদাহরণ কোনটি?",
    options: [
      { letter: "A", text: "গণভোট" },
      { letter: "B", text: "স্থানীয় নির্বাচন" },
      { letter: "C", text: "রাষ্ট্রপতি নির্বাচন" },
      { letter: "D", text: "সংসদীয় নির্বাচন" }
    ],
    correctLetter: "A",
    explanation: "গণভোটে জনগণ সরাসরি সিদ্ধান্ত দেয় — এটাই প্রত্যক্ষ গণতন্ত্র।",
    difficulty: "medium",
    sourceNote: "NCTB পৌরনীতি ও নাগরিকতা — গণতন্ত্র",
  },
  {
    id: "ACAD-6101",
    classId: "class-9",
    subjectId: "civics",
    chapterId: "acad-class-9-civ-topic-4",
    chapterName: "নির্বাচন",
    unitNumber: 5,
    topicId: "topic-4",
    questionText: "নির্বাচনে প্রার্থী হতে সর্বনিম্ন বয়স কত?",
    options: [
      { letter: "A", text: "১৮ বছর" },
      { letter: "B", text: "৩০ বছর" },
      { letter: "C", text: "২১ বছর" },
      { letter: "D", text: "২৫ বছর" }
    ],
    correctLetter: "D",
    explanation: "সংসদ সদস্য হতে সর্বনিম্ন বয়স ২৫ বছর।",
    difficulty: "medium",
    sourceNote: "NCTB পৌরনীতি ও নাগরিকতা — নির্বাচন",
  },
  {
    id: "ACAD-6102",
    classId: "class-9",
    subjectId: "civics",
    chapterId: "acad-class-9-civ-topic-5",
    chapterName: "আইনের শাসন",
    unitNumber: 6,
    topicId: "topic-5",
    questionText: "আইনের শাসনের জন্য কী জরুরি?",
    options: [
      { letter: "A", text: "শুধু পুলিশ" },
      { letter: "B", text: "স্বাধীন বিচার বিভাগ" },
      { letter: "C", text: "শুধু সেনাবাহিনী" },
      { letter: "D", text: "শুধু আইন বই" }
    ],
    correctLetter: "B",
    explanation: "স্বাধীন বিচার বিভাগ ছাড়া আইনের শাসন টেকে না।",
    difficulty: "medium",
    sourceNote: "NCTB পৌরনীতি ও নাগরিকতা — আইনের শাসন",
  },
  {
    id: "ACAD-6103",
    classId: "class-9",
    subjectId: "civics",
    chapterId: "acad-class-9-civ-topic-6",
    chapterName: "মানবাধিকার",
    unitNumber: 7,
    topicId: "topic-6",
    questionText: "সার্বজনীন মানবাধিকার ঘোষণা হয় কত সালে?",
    options: [
      { letter: "A", text: "১৯৪৫" },
      { letter: "B", text: "১৯৫০" },
      { letter: "C", text: "১৯৬০" },
      { letter: "D", text: "১৯৪৮" }
    ],
    correctLetter: "D",
    explanation: "জাতিসংঘ ১৯৪৮ সালে সার্বজনীন মানবাধিকার ঘোষণা গ্রহণ করে।",
    difficulty: "medium",
    sourceNote: "NCTB পৌরনীতি ও নাগরিকতা — মানবাধিকার",
  },
  {
    id: "ACAD-6104",
    classId: "class-9",
    subjectId: "civics",
    chapterId: "acad-class-9-civ-topic-7",
    chapterName: "স্থানীয় সরকার",
    unitNumber: 8,
    topicId: "topic-7",
    questionText: "উপজেলা পরিষদের প্রধান কে?",
    options: [
      { letter: "A", text: "জেলা প্রশাসক" },
      { letter: "B", text: "উপজেলা চেয়ারম্যান" },
      { letter: "C", text: "মেয়র" },
      { letter: "D", text: "ইউএনও" }
    ],
    correctLetter: "B",
    explanation: "উপজেলা পরিষদের নির্বাচিত প্রধান উপজেলা চেয়ারম্যান।",
    difficulty: "medium",
    sourceNote: "NCTB পৌরনীতি ও নাগরিকতা — স্থানীয় সরকার",
  },
  {
    id: "ACAD-6105",
    classId: "class-9",
    subjectId: "civics",
    chapterId: "acad-class-9-civ-topic-8",
    chapterName: "দুর্নীতি",
    unitNumber: 9,
    topicId: "topic-8",
    questionText: "দুর্নীতির ফলে সবচেয়ে ক্ষতিগ্রস্ত হয় কারা?",
    options: [
      { letter: "A", text: "কেউ নয়" },
      { letter: "B", text: "শুধু ধনীরা" },
      { letter: "C", text: "শুধু সরকার" },
      { letter: "D", text: "সাধারণ জনগণ" }
    ],
    correctLetter: "D",
    explanation: "দুর্নীতিতে সেবা ব্যাহত হয় ও সম্পদ পাচার হয়; ক্ষতি হয় সাধারণ মানুষের।",
    difficulty: "medium",
    sourceNote: "NCTB পৌরনীতি ও নাগরিকতা — দুর্নীতি",
  },
  {
    id: "ACAD-6106",
    classId: "class-9",
    subjectId: "civics",
    chapterId: "acad-class-9-civ-topic-9",
    chapterName: "জাতীয় সংসদ",
    unitNumber: 10,
    topicId: "topic-9",
    questionText: "জাতীয় সংসদে মোট আসন কয়টি?",
    options: [
      { letter: "A", text: "৩৩০টি" },
      { letter: "B", text: "৩৫০টি" },
      { letter: "C", text: "৪০০টি" },
      { letter: "D", text: "৩০০টি" }
    ],
    correctLetter: "B",
    explanation: "জাতীয় সংসদে ৩০০টি সাধারণ ও ৫০টি সংরক্ষিত নারী আসন — মোট ৩৫০টি।",
    difficulty: "medium",
    sourceNote: "NCTB পৌরনীতি ও নাগরিকতা — জাতীয় সংসদ",
  },
  {
    id: "ACAD-6107",
    classId: "class-9",
    subjectId: "civics",
    chapterId: "acad-class-9-civ-topic-11",
    chapterName: "মৌলিক অধিকার",
    unitNumber: 12,
    topicId: "topic-11",
    questionText: "সংবিধানে মৌলিক অধিকার কোন ভাগে আছে?",
    options: [
      { letter: "A", text: "চতুর্থ ভাগ" },
      { letter: "B", text: "প্রথম ভাগ" },
      { letter: "C", text: "তৃতীয় ভাগ" },
      { letter: "D", text: "দ্বিতীয় ভাগ" }
    ],
    correctLetter: "C",
    explanation: "সংবিধানের তৃতীয় ভাগে মৌলিক অধিকারগুলো লিপিবদ্ধ আছে।",
    difficulty: "medium",
    sourceNote: "NCTB পৌরনীতি ও নাগরিকতা — মৌলিক অধিকার",
  },
  {
    id: "ACAD-6108",
    classId: "class-9",
    subjectId: "civics",
    chapterId: "acad-class-9-civ-topic-12",
    chapterName: "রাজনৈতিক দল",
    unitNumber: 13,
    topicId: "topic-12",
    questionText: "আওয়ামী লীগ কত সালে প্রতিষ্ঠিত হয়?",
    options: [
      { letter: "A", text: "১৯৫২" },
      { letter: "B", text: "১৯৪৭" },
      { letter: "C", text: "১৯৭১" },
      { letter: "D", text: "১৯৪৯" }
    ],
    correctLetter: "D",
    explanation: "১৯৪৯ সালের ২৩শে জুন ঢাকায় আওয়ামী মুসলিম লীগ নামে দলটি প্রতিষ্ঠিত হয়; ১৯৫৫ সালে নাম থেকে 'মুসলিম' শব্দটি বাদ দেওয়া হয়।",
    difficulty: "medium",
    sourceNote: "NCTB পৌরনীতি ও নাগরিকতা — রাজনৈতিক দল",
  },
];
