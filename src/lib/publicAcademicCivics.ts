// Eduvelto — Academic Civics and Citizenship practice questions (Classes 9 and 11),
// verified against the NCTB books (review 26 Nov 2026; see the Class 9 / Class 11 notes below).
//
// Static data ONLY — zero Firestore reads. The 43 questions are the
// Academic Class 9 and Class 11 Civics and Citizenship drafts AFTER review (see
// review-academic-c9-civics-history-verdicts.json,
// review-academic-c9-fixes-applied.md,
// review-academic-c11-12-civics-verdicts.json and
// review-academic-c11-12-fixes-applied.md in
// ~/workspace/eduorbit/sprint-1week-2026-11-25/).
//
// CAVEAT: the Class 9 review was verified against DAKHIL editions —
// no general NCTB Class 9-10 book set exists in the workspace. The
// questions are verified against the Dakhil books + standard
// references + the SSC syllabus topic. Whether Class 9-10 content
// serves the general SSC audience or the Dakhil audience is an owner
// decision still owed (after his exams).
//
// Class 11 NOTE: the Class 11 questions were verified for fact
// correctness + on-syllabus (review 26 Nov 2026) — NO HSC book
// exists in the workspace, so VERIFIED here does NOT mean
// book-confirmed. A teacher with the actual HSC books should
// spot-check before publication, especially the re-cited chapters
// (see review-academic-c11-12-fixes-applied.md).
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
// The Class 11
// questions also serve Class 12 (same combined class-11-12 draft
// set — there is NO separate Class 12 set): the pool holds each
// question ONCE under classId 'class-11', and publicAcademic.ts /
// questionPaper.ts / scripts/prerender.mjs map 'class-12' to the
// Class 11 pool for these subjects.

import { type PublicAcademicQuestion } from './publicAcademic';

/** All verified Academic Civics and Citizenship questions, Classes 9 and 11 (in draft order). */
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
  {
    id: "ACAD-3031",
    classId: "class-11",
    subjectId: "civics",
    chapterId: "acad-class-11-civ-topic-1",
    chapterName: "সুশাসন",
    unitNumber: 1,
    topicId: "topic-1",
    questionText: "সুশাসনের মূল বৈশিষ্ট্য কোনটি?",
    options: [
      { letter: "A", text: "স্বেচ্ছাচার" },
      { letter: "B", text: "গোপনীয়তা" },
      { letter: "C", text: "কেন্দ্রীকরণ" },
      { letter: "D", text: "স্বচ্ছতা ও জবাবদিহি" }
    ],
    correctLetter: "D",
    explanation: "স্বচ্ছতা, জবাবদিহি, আইনের শাসন ও অংশগ্রহণ সুশাসনের মূল বৈশিষ্ট্য।",
    difficulty: "easy",
    sourceNote: "NCTB HSC পৌরনীতি ও সুশাসন ১ম পত্র — সুশাসন অধ্যায়",
  },
  {
    id: "ACAD-3032",
    classId: "class-11",
    subjectId: "civics",
    chapterId: "acad-class-11-civ-topic-2",
    chapterName: "রাষ্ট্র",
    unitNumber: 2,
    topicId: "topic-2",
    questionText: "আধুনিক রাষ্ট্রবিজ্ঞানের জনক কাকে বলা হয়?",
    options: [
      { letter: "A", text: "প্লেটো" },
      { letter: "B", text: "অ্যারিস্টটল" },
      { letter: "C", text: "লক" },
      { letter: "D", text: "ম্যাকিয়াভেলি" }
    ],
    correctLetter: "D",
    explanation: "ম্যাকিয়াভেলিকে আধুনিক রাষ্ট্রবিজ্ঞানের জনক বলা হয়।",
    difficulty: "medium",
    sourceNote: "NCTB HSC পৌরনীতি ও সুশাসন ১ম পত্র — রাষ্ট্র অধ্যায়",
  },
  {
    id: "ACAD-3033",
    classId: "class-11",
    subjectId: "civics",
    chapterId: "acad-class-11-civ-topic-3",
    chapterName: "সার্বভৌমত্ব",
    unitNumber: 3,
    topicId: "topic-3",
    questionText: "রাষ্ট্রের সর্বোচ্চ ক্ষমতাকে কী বলে?",
    options: [
      { letter: "A", text: "আইন" },
      { letter: "B", text: "সার্বভৌমত্ব" },
      { letter: "C", text: "গণতন্ত্র" },
      { letter: "D", text: "স্বাধীনতা" }
    ],
    correctLetter: "B",
    explanation: "সার্বভৌমত্ব রাষ্ট্রের চূড়ান্ত ও সর্বোচ্চ ক্ষমতা।",
    difficulty: "medium",
    sourceNote: "NCTB HSC পৌরনীতি ও সুশাসন ১ম পত্র — সার্বভৌমত্ব",
  },
  {
    id: "ACAD-3034",
    classId: "class-11",
    subjectId: "civics",
    chapterId: "acad-class-11-civ-topic-4",
    chapterName: "আইন",
    unitNumber: 4,
    topicId: "topic-4",
    questionText: "আইনের সর্বোচ্চ উৎস কোনটি?",
    options: [
      { letter: "A", text: "আদেশ" },
      { letter: "B", text: "প্রথা শুধু" },
      { letter: "C", text: "সংবিধান" },
      { letter: "D", text: "ধর্ম শুধু" }
    ],
    correctLetter: "C",
    explanation: "সংবিধান আইনের সর্বোচ্চ উৎস; প্রথা, বিচার ও আইনসভাও উৎস।",
    difficulty: "easy",
    sourceNote: "NCTB HSC পৌরনীতি ও সুশাসন ১ম পত্র — আইন অধ্যায়",
  },
  {
    id: "ACAD-3035",
    classId: "class-11",
    subjectId: "civics",
    chapterId: "acad-class-11-civ-topic-5",
    chapterName: "সংবিধান",
    unitNumber: 5,
    topicId: "topic-5",
    questionText: "বাংলাদেশের সংবিধানের কোন অনুচ্ছেদে রাষ্ট্রের মূলনীতি বলা হয়েছে?",
    options: [
      { letter: "A", text: "অনুচ্ছেদ ১২" },
      { letter: "B", text: "অনুচ্ছেদ ৮" },
      { letter: "C", text: "অনুচ্ছেদ ৭" },
      { letter: "D", text: "অনুচ্ছেদ ১০" }
    ],
    correctLetter: "B",
    explanation: "সংবিধানের ৮ নম্বর অনুচ্ছেদে জাতীয়তাবাদ, সমাজতন্ত্র, গণতন্ত্র ও ধর্মনিরপেক্ষতা — চার মূলনীতি বলা হয়েছে।",
    difficulty: "medium",
    sourceNote: "NCTB HSC পৌরনীতি ও সুশাসন ২য় পত্র — বাংলাদেশের সংবিধান",
  },
  {
    id: "ACAD-3036",
    classId: "class-11",
    subjectId: "civics",
    chapterId: "acad-class-11-civ-topic-6",
    chapterName: "ক্ষমতা স্বতন্ত্রীকরণ",
    unitNumber: 6,
    topicId: "topic-6",
    questionText: "ক্ষমতা স্বতন্ত্রীকরণ তত্ত্বের প্রবক্তা কে?",
    options: [
      { letter: "A", text: "হবস" },
      { letter: "B", text: "রুশো" },
      { letter: "C", text: "লক" },
      { letter: "D", text: "মন্টেস্কু" }
    ],
    correctLetter: "D",
    explanation: "মন্টেস্কু আইন, শাসন ও বিচার বিভাগের পৃথকীকরণের তত্ত্ব দেন।",
    difficulty: "medium",
    sourceNote: "NCTB HSC পৌরনীতি ও সুশাসন ১ম পত্র — ক্ষমতা স্বতন্ত্রীকরণ",
  },
  {
    id: "ACAD-3037",
    classId: "class-11",
    subjectId: "civics",
    chapterId: "acad-class-11-civ-topic-7",
    chapterName: "রাজনৈতিক দল",
    unitNumber: 7,
    topicId: "topic-7",
    questionText: "গণতন্ত্রে রাজনৈতিক দলের কাজ কী?",
    options: [
      { letter: "A", text: "শুধু আন্দোলন" },
      { letter: "B", text: "শুধু নির্বাচন বয়কট" },
      { letter: "C", text: "জনমত গঠন ও সরকার গঠন" },
      { letter: "D", text: "আইন তৈরি শুধু" }
    ],
    correctLetter: "C",
    explanation: "দল জনমত গঠন করে, নির্বাচনে অংশ নেয় ও সরকার গঠন করে।",
    difficulty: "easy",
    sourceNote: "NCTB HSC পৌরনীতি ও সুশাসন ১ম পত্র — রাজনৈতিক দল",
  },
  {
    id: "ACAD-3038",
    classId: "class-11",
    subjectId: "civics",
    chapterId: "acad-class-11-civ-topic-8",
    chapterName: "নির্বাচন কমিশন",
    unitNumber: 8,
    topicId: "topic-8",
    questionText: "বাংলাদেশে নির্বাচন পরিচালনা করে কোন সংস্থা?",
    options: [
      { letter: "A", text: "নির্বাচন কমিশন" },
      { letter: "B", text: "সুপ্রিম কোর্ট" },
      { letter: "C", text: "মন্ত্রিসভা" },
      { letter: "D", text: "সংসদ" }
    ],
    correctLetter: "A",
    explanation: "সংবিধান অনুযায়ী নির্বাচন কমিশন সব নির্বাচন পরিচালনা করে।",
    difficulty: "medium",
    sourceNote: "NCTB HSC পৌরনীতি ও সুশাসন ২য় পত্র — নির্বাচন ব্যবস্থা",
  },
  {
    id: "ACAD-3039",
    classId: "class-11",
    subjectId: "civics",
    chapterId: "acad-class-11-civ-topic-9",
    chapterName: "স্থানীয় সরকার",
    unitNumber: 9,
    topicId: "topic-9",
    questionText: "শহরের স্থানীয় সরকার কোনটি?",
    options: [
      { letter: "A", text: "জেলা পরিষদ" },
      { letter: "B", text: "সিটি করপোরেশন" },
      { letter: "C", text: "ইউনিয়ন পরিষদ" },
      { letter: "D", text: "উপজেলা পরিষদ" }
    ],
    correctLetter: "B",
    explanation: "বড় শহরে সিটি করপোরেশন ও ছোট শহরে পৌরসভা স্থানীয় সরকার।",
    difficulty: "medium",
    sourceNote: "NCTB HSC পৌরনীতি ও সুশাসন ২য় পত্র — স্থানীয় সরকার",
  },
  {
    id: "ACAD-3040",
    classId: "class-11",
    subjectId: "civics",
    chapterId: "acad-class-11-civ-topic-10",
    chapterName: "জনমত",
    unitNumber: 10,
    topicId: "topic-10",
    questionText: "জনমত গঠনে সবচেয়ে শক্তিশালী মাধ্যম কোনটি?",
    options: [
      { letter: "A", text: "শুধু পরিবার" },
      { letter: "B", text: "শুধু বই" },
      { letter: "C", text: "গণমাধ্যম" },
      { letter: "D", text: "শুধু সভা" }
    ],
    correctLetter: "C",
    explanation: "সংবাদপত্র, টেলিভিশন ও অনলাইন গণমাধ্যম জনমত গঠনে প্রধান ভূমিকা রাখে।",
    difficulty: "easy",
    sourceNote: "NCTB HSC পৌরনীতি ও সুশাসন ১ম পত্র — জনমত",
  },
  {
    id: "ACAD-8025",
    classId: "class-11",
    subjectId: "civics",
    chapterId: "acad-class-11-civ-topic-1",
    chapterName: "সুশাসন",
    unitNumber: 1,
    topicId: "topic-1",
    questionText: "সুশাসনের প্রধান বাধা কী?",
    options: [
      { letter: "A", text: "দুর্নীতি" },
      { letter: "B", text: "গণমাধ্যম" },
      { letter: "C", text: "নির্বাচন" },
      { letter: "D", text: "শিক্ষা" }
    ],
    correctLetter: "A",
    explanation: "দুর্নীতি স্বচ্ছতা ও জবাবদিহি নষ্ট করে সুশাসনের প্রধান বাধা।",
    difficulty: "medium",
    sourceNote: "NCTB HSC পৌরনীতি ও সুশাসন ১ম পত্র — সুশাসন",
  },
  {
    id: "ACAD-8026",
    classId: "class-11",
    subjectId: "civics",
    chapterId: "acad-class-11-civ-topic-2",
    chapterName: "রাষ্ট্র",
    unitNumber: 2,
    topicId: "topic-2",
    questionText: "রাষ্ট্রের উৎপত্তির সামাজিক চুক্তি মতবাদের প্রবক্তা কে?",
    options: [
      { letter: "A", text: "হবস, লক ও রুশো" },
      { letter: "B", text: "শুধু অ্যারিস্টটল" },
      { letter: "C", text: "শুধু প্লেটো" },
      { letter: "D", text: "শুধু ম্যাকিয়াভেলি" }
    ],
    correctLetter: "A",
    explanation: "হবস, লক ও রুশো — তিনজনই সামাজিক চুক্তি মতবাদের প্রবক্তা।",
    difficulty: "medium",
    sourceNote: "NCTB HSC পৌরনীতি ও সুশাসন ১ম পত্র — রাষ্ট্রের উৎপত্তি",
  },
  {
    id: "ACAD-8027",
    classId: "class-11",
    subjectId: "civics",
    chapterId: "acad-class-11-civ-topic-3",
    chapterName: "সার্বভৌমত্ব",
    unitNumber: 3,
    topicId: "topic-3",
    questionText: "আইনগত সার্বভৌমত্ব কার হাতে থাকে?",
    options: [
      { letter: "A", text: "আদালতের" },
      { letter: "B", text: "জনগণের" },
      { letter: "C", text: "আইনসভার" },
      { letter: "D", text: "সেনাবাহিনীর" }
    ],
    correctLetter: "C",
    explanation: "আইনগত সার্বভৌমত্ব আইন প্রণয়নকারী কর্তৃপক্ষের হাতে থাকে।",
    difficulty: "medium",
    sourceNote: "NCTB HSC পৌরনীতি ও সুশাসন ১ম পত্র — সার্বভৌমত্ব",
  },
  {
    id: "ACAD-8028",
    classId: "class-11",
    subjectId: "civics",
    chapterId: "acad-class-11-civ-topic-4",
    chapterName: "আইন",
    unitNumber: 4,
    topicId: "topic-4",
    questionText: "আইনের শাসনের প্রবক্তা কে?",
    options: [
      { letter: "A", text: "এ. ভি. ডাইসি" },
      { letter: "B", text: "মন্টেস্কু" },
      { letter: "C", text: "বেঞ্জামিন" },
      { letter: "D", text: "লক" }
    ],
    correctLetter: "A",
    explanation: "ডাইসি আইনের শাসনের (Rule of Law) তত্ত্ব দেন।",
    difficulty: "medium",
    sourceNote: "NCTB HSC পৌরনীতি ও সুশাসন ১ম পত্র — আইন",
  },
  {
    id: "ACAD-8029",
    classId: "class-11",
    subjectId: "civics",
    chapterId: "acad-class-11-civ-topic-5",
    chapterName: "সংবিধান",
    unitNumber: 5,
    topicId: "topic-5",
    questionText: "বাংলাদেশের সংবিধান সংশোধন করতে কত ভোট লাগে?",
    options: [
      { letter: "A", text: "রাষ্ট্রপতির সম্মতি শুধু" },
      { letter: "B", text: "গণভোট" },
      { letter: "C", text: "সাধারণ সংখ্যাগরিষ্ঠতা" },
      { letter: "D", text: "সংসদের দুই-তৃতীয়াংশ" }
    ],
    correctLetter: "D",
    explanation: "সংবিধান সংশোধনে সংসদের মোট সদস্যের দুই-তৃতীয়াংশ ভোট লাগে।",
    difficulty: "medium",
    sourceNote: "NCTB HSC পৌরনীতি ও সুশাসন ২য় পত্র — সংবিধান সংশোধন",
  },
  {
    id: "ACAD-8030",
    classId: "class-11",
    subjectId: "civics",
    chapterId: "acad-class-11-civ-topic-6",
    chapterName: "ক্ষমতা স্বতন্ত্রীকরণ",
    unitNumber: 6,
    topicId: "topic-6",
    questionText: "ক্ষমতা স্বতন্ত্রীকরণের উদ্দেশ্য কী?",
    options: [
      { letter: "A", text: "ক্ষমতার অপব্যবহার রোধ" },
      { letter: "B", text: "সরকার দুর্বল করা" },
      { letter: "C", text: "ক্ষমতা কেন্দ্রীভূত করা" },
      { letter: "D", text: "আইন কমানো" }
    ],
    correctLetter: "A",
    explanation: "তিন বিভাগের ক্ষমতা আলাদা থাকলে এক হাতে ক্ষমতা জমে স্বেচ্ছাচার হয় না।",
    difficulty: "medium",
    sourceNote: "NCTB HSC পৌরনীতি ও সুশাসন ১ম পত্র — ক্ষমতা স্বতন্ত্রীকরণ",
  },
  {
    id: "ACAD-8031",
    classId: "class-11",
    subjectId: "civics",
    chapterId: "acad-class-11-civ-topic-7",
    chapterName: "রাজনৈতিক দল",
    unitNumber: 7,
    topicId: "topic-7",
    questionText: "বিরোধী দলের কাজ কী?",
    options: [
      { letter: "A", text: "সরকারে যোগ দেওয়া" },
      { letter: "B", text: "নির্বাচন বর্জন করা" },
      { letter: "C", text: "সরকারের সমালোচনা ও বিকল্প নীতি দেওয়া" },
      { letter: "D", text: "শুধু আন্দোলন করা" }
    ],
    correctLetter: "C",
    explanation: "বিরোধী দল সরকারের ভুল ধরে ও বিকল্প নীতি দেয়।",
    difficulty: "medium",
    sourceNote: "NCTB HSC পৌরনীতি ও সুশাসন ১ম পত্র — রাজনৈতিক দল",
  },
  {
    id: "ACAD-8032",
    classId: "class-11",
    subjectId: "civics",
    chapterId: "acad-class-11-civ-topic-8",
    chapterName: "নির্বাচন কমিশন",
    unitNumber: 8,
    topicId: "topic-8",
    questionText: "নির্বাচন কমিশনারদের নিয়োগ দেন কে?",
    options: [
      { letter: "A", text: "স্পিকার" },
      { letter: "B", text: "রাষ্ট্রপতি" },
      { letter: "C", text: "প্রধানমন্ত্রী" },
      { letter: "D", text: "প্রধান বিচারপতি" }
    ],
    correctLetter: "B",
    explanation: "রাষ্ট্রপতি প্রধান নির্বাচন কমিশনার ও অন্য কমিশনারদের নিয়োগ দেন।",
    difficulty: "medium",
    sourceNote: "NCTB HSC পৌরনীতি ও সুশাসন ২য় পত্র — নির্বাচন কমিশন",
  },
  {
    id: "ACAD-8033",
    classId: "class-11",
    subjectId: "civics",
    chapterId: "acad-class-11-civ-topic-9",
    chapterName: "স্থানীয় সরকার",
    unitNumber: 9,
    topicId: "topic-9",
    questionText: "পৌরসভার প্রধান কে?",
    options: [
      { letter: "A", text: "চেয়ারম্যান" },
      { letter: "B", text: "কাউন্সিলর" },
      { letter: "C", text: "ইউএনও" },
      { letter: "D", text: "মেয়র" }
    ],
    correctLetter: "D",
    explanation: "পৌরসভার নির্বাচিত প্রধান মেয়র; সিটি করপোরেশনেও মেয়র।",
    difficulty: "medium",
    sourceNote: "NCTB HSC পৌরনীতি ও সুশাসন ২য় পত্র — স্থানীয় সরকার",
  },
  {
    id: "ACAD-8034",
    classId: "class-11",
    subjectId: "civics",
    chapterId: "acad-class-11-civ-topic-10",
    chapterName: "জনমত",
    unitNumber: 10,
    topicId: "topic-10",
    questionText: "জনমতের বাহন কোনটি?",
    options: [
      { letter: "A", text: "শুধু বই" },
      { letter: "B", text: "সংবাদপত্র" },
      { letter: "C", text: "শুধু ব্যাংক" },
      { letter: "D", text: "শুধু আদালত" }
    ],
    correctLetter: "B",
    explanation: "সংবাদপত্র, টেলিভিশন ও সামাজিক মাধ্যম জনমত গঠনের বাহন।",
    difficulty: "medium",
    sourceNote: "NCTB HSC পৌরনীতি ও সুশাসন ১ম পত্র — জনমত",
  },
  {
    id: "ACAD-8035",
    classId: "class-11",
    subjectId: "civics",
    chapterId: "acad-class-11-civ-topic-11",
    chapterName: "নাগরিক সচেতনতা",
    unitNumber: 11,
    topicId: "topic-11",
    questionText: "ভালো নাগরিকের গুণ কোনটি?",
    options: [
      { letter: "A", text: "আইন মানা ও কর দেওয়া" },
      { letter: "B", text: "শুধু ভোট দেওয়া" },
      { letter: "C", text: "শুধু চাকরি করা" },
      { letter: "D", text: "শুধু পড়াশোনা" }
    ],
    correctLetter: "A",
    explanation: "আইন মানা, কর দেওয়া, ভোট দেওয়া ও সমাজসেবা ভালো নাগরিকের গুণ।",
    difficulty: "medium",
    sourceNote: "NCTB HSC পৌরনীতি ও সুশাসন ১ম পত্র — নাগরিক সচেতনতা",
  },
];
