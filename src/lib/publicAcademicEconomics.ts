// Eduvelto — Academic Economics practice questions (Classes 9 and 11),
// verified against the NCTB books (review 26 Nov 2026; see the Class 9 / Class 11 notes below).
//
// Static data ONLY — zero Firestore reads. The 44 questions are the
// Academic Class 9 and Class 11 Economics drafts AFTER review (see
// review-academic-c9-economics-geography-verdicts.json,
// review-academic-c9-fixes-applied.md,
// review-academic-c11-12-economics-verdicts.json and
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
// to PUBLIC_ACADEMIC_ECONOMICS_QUESTIONS below (same shape, same generation
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

/** All verified Academic Economics questions, Classes 9 and 11 (in draft order). */
export const PUBLIC_ACADEMIC_ECONOMICS_QUESTIONS: PublicAcademicQuestion[] = [
  {
    id: "ACAD-1091",
    classId: "class-9",
    subjectId: "economics",
    chapterId: "acad-class-9-eco-chapter-1",
    chapterName: "অধ্যায় ১: অর্থনীতি পরিচিতি",
    unitNumber: 1,
    topicId: "chapter-1",
    questionText: "অর্থনীতি কী নিয়ে আলোচনা করে?",
    options: [
      { letter: "A", text: "শুধু বাজার" },
      { letter: "B", text: "শুধু ব্যাংক" },
      { letter: "C", text: "শুধু টাকা ছাপানো" },
      { letter: "D", text: "সীমিত সম্পদের ব্যবহার" }
    ],
    correctLetter: "D",
    explanation: "অর্থনীতি সীমিত সম্পদ দিয়ে অসীম অভাব মেটানোর উপায় নিয়ে আলোচনা করে।",
    difficulty: "easy",
    sourceNote: "NCTB অর্থনীতি, নবম-দশম শ্রেণি — অধ্যায় ১: অর্থনীতি পরিচিতি",
  },
  {
    id: "ACAD-1092",
    classId: "class-9",
    subjectId: "economics",
    chapterId: "acad-class-9-eco-topic-1",
    chapterName: "চাহিদা",
    unitNumber: 2,
    topicId: "topic-1",
    questionText: "দাম বাড়লে সাধারণত চাহিদা —",
    options: [
      { letter: "A", text: "শূন্য হয়" },
      { letter: "B", text: "একই থাকে" },
      { letter: "C", text: "বাড়ে" },
      { letter: "D", text: "কমে" }
    ],
    correctLetter: "D",
    explanation: "চাহিদা বিধি অনুযায়ী দাম বাড়লে চাহিদা কমে, দাম কমলে চাহিদা বাড়ে।",
    difficulty: "medium",
    sourceNote: "NCTB অর্থনীতি, নবম-দশম শ্রেণি — চাহিদা অধ্যায়",
  },
  {
    id: "ACAD-1093",
    classId: "class-9",
    subjectId: "economics",
    chapterId: "acad-class-9-eco-topic-2",
    chapterName: "যোগান",
    unitNumber: 3,
    topicId: "topic-2",
    questionText: "দাম বাড়লে সাধারণত যোগান —",
    options: [
      { letter: "A", text: "কমে" },
      { letter: "B", text: "বাড়ে" },
      { letter: "C", text: "একই থাকে" },
      { letter: "D", text: "শূন্য হয়" }
    ],
    correctLetter: "B",
    explanation: "যোগান বিধি অনুযায়ী দাম বাড়লে উৎপাদকরা বেশি যোগান দিতে চায়।",
    difficulty: "medium",
    sourceNote: "NCTB অর্থনীতি, নবম-দশম শ্রেণি — যোগান অধ্যায়",
  },
  {
    id: "ACAD-1094",
    classId: "class-9",
    subjectId: "economics",
    chapterId: "acad-class-9-eco-topic-3",
    chapterName: "বাজার",
    unitNumber: 4,
    topicId: "topic-3",
    questionText: "ক্রেতা ও বিক্রেতার মিলনস্থলকে কী বলে?",
    options: [
      { letter: "A", text: "ব্যাংক" },
      { letter: "B", text: "গুদাম" },
      { letter: "C", text: "বাজার" },
      { letter: "D", text: "কারখানা" }
    ],
    correctLetter: "C",
    explanation: "যেখানে ক্রেতা-বিক্রেতা পণ্য ক্রয়-বিক্রয় করে, তাকে বাজার বলে।",
    difficulty: "easy",
    sourceNote: "NCTB অর্থনীতি, নবম-দশম শ্রেণি — বাজার অধ্যায়",
  },
  {
    id: "ACAD-1095",
    classId: "class-9",
    subjectId: "economics",
    chapterId: "acad-class-9-eco-topic-4",
    chapterName: "জাতীয় আয়",
    unitNumber: 5,
    topicId: "topic-4",
    questionText: "এক বছরে দেশে উৎপাদিত চূড়ান্ত দ্রব্য ও সেবার মোট মূল্যকে কী বলে?",
    options: [
      { letter: "A", text: "রপ্তানি আয়" },
      { letter: "B", text: "মোট দেশজ উৎপাদন (GDP)" },
      { letter: "C", text: "রাজস্ব" },
      { letter: "D", text: "মাথাপিছু আয়" }
    ],
    correctLetter: "B",
    explanation: "GDP হলো এক বছরে দেশের ভেতরে উৎপাদিত চূড়ান্ত দ্রব্য ও সেবার মোট বাজারমূল্য। জাতীয় আয় (GNP/GNI-ভিত্তিক) এর সঙ্গে এক নয় — প্রশ্নে 'দেশে উৎপাদিত' বলা হয়েছে, তাই সঠিক নাম GDP (মোট দেশজ উৎপাদন)।",
    difficulty: "medium",
    sourceNote: "NCTB অর্থনীতি, নবম-দশম শ্রেণি — জাতীয় আয় অধ্যায়",
  },
  {
    id: "ACAD-1096",
    classId: "class-9",
    subjectId: "economics",
    chapterId: "acad-class-9-eco-topic-5",
    chapterName: "মুদ্রাস্ফীতি",
    unitNumber: 6,
    topicId: "topic-5",
    questionText: "দ্রব্যমূল্য ক্রমাগত বাড়াকে কী বলে?",
    options: [
      { letter: "A", text: "উন্নয়ন" },
      { letter: "B", text: "মন্দা" },
      { letter: "C", text: "মুদ্রাস্ফীতি" },
      { letter: "D", text: "মুদ্রাসংকোচন" }
    ],
    correctLetter: "C",
    explanation: "সাধারণ মূল্যস্তরের ক্রমাগত বৃদ্ধিই মুদ্রাস্ফীতি।",
    difficulty: "medium",
    sourceNote: "NCTB অর্থনীতি, নবম-দশম শ্রেণি — মুদ্রাস্ফীতি অধ্যায়",
  },
  {
    id: "ACAD-1097",
    classId: "class-9",
    subjectId: "economics",
    chapterId: "acad-class-9-eco-topic-6",
    chapterName: "বেকারত্ব",
    unitNumber: 7,
    topicId: "topic-6",
    questionText: "কাজ করতে ইচ্ছুক ও সক্ষম হয়েও কাজ না পাওয়াকে কী বলে?",
    options: [
      { letter: "A", text: "বেকারত্ব" },
      { letter: "B", text: "মন্দা" },
      { letter: "C", text: "দারিদ্র্য" },
      { letter: "D", text: "অশিক্ষা" }
    ],
    correctLetter: "A",
    explanation: "শ্রমশক্তির অংশ হয়েও কাজ না পেলে তা বেকারত্ব।",
    difficulty: "easy",
    sourceNote: "NCTB অর্থনীতি, নবম-দশম শ্রেণি — বেকারত্ব অধ্যায়",
  },
  {
    id: "ACAD-1098",
    classId: "class-9",
    subjectId: "economics",
    chapterId: "acad-class-9-eco-topic-7",
    chapterName: "বাজেট",
    unitNumber: 8,
    topicId: "topic-7",
    questionText: "সরকারের বার্ষিক আয়-ব্যয়ের হিসাবকে কী বলে?",
    options: [
      { letter: "A", text: "বাজেট" },
      { letter: "B", text: "ব্যালান্স শিট" },
      { letter: "C", text: "রেওয়ামিল" },
      { letter: "D", text: "জাবেদা" }
    ],
    correctLetter: "A",
    explanation: "সরকার প্রতি অর্থবছরের আয়-ব্যয়ের পরিকল্পনা বাজেটে উপস্থাপন করে।",
    difficulty: "easy",
    sourceNote: "NCTB অর্থনীতি, নবম-দশম শ্রেণি — সরকারি অর্থব্যবস্থা",
  },
  {
    id: "ACAD-1099",
    classId: "class-9",
    subjectId: "economics",
    chapterId: "acad-class-9-eco-topic-8",
    chapterName: "ব্যাংক",
    unitNumber: 9,
    topicId: "topic-8",
    questionText: "বাংলাদেশের কেন্দ্রীয় ব্যাংক কোনটি?",
    options: [
      { letter: "A", text: "অগ্রণী ব্যাংক" },
      { letter: "B", text: "সোনালী ব্যাংক" },
      { letter: "C", text: "বাংলাদেশ ব্যাংক" },
      { letter: "D", text: "জনতা ব্যাংক" }
    ],
    correctLetter: "C",
    explanation: "বাংলাদেশ ব্যাংক কেন্দ্রীয় ব্যাংক হিসেবে মুদ্রানীতি পরিচালনা করে।",
    difficulty: "easy",
    sourceNote: "NCTB অর্থনীতি, নবম-দশম শ্রেণি — ব্যাংক ব্যবস্থা",
  },
  {
    id: "ACAD-1100",
    classId: "class-9",
    subjectId: "economics",
    chapterId: "acad-class-9-eco-topic-9",
    chapterName: "আন্তর্জাতিক বাণিজ্য",
    unitNumber: 10,
    topicId: "topic-9",
    questionText: "দেশের বাইরে পণ্য বিক্রয়কে কী বলে?",
    options: [
      { letter: "A", text: "পুনঃরপ্তানি" },
      { letter: "B", text: "আমদানি" },
      { letter: "C", text: "রপ্তানি" },
      { letter: "D", text: "অভ্যন্তরীণ বাণিজ্য" }
    ],
    correctLetter: "C",
    explanation: "বিদেশে পণ্য বিক্রয় রপ্তানি; বিদেশ থেকে কেনা আমদানি।",
    difficulty: "medium",
    sourceNote: "NCTB অর্থনীতি, নবম-দশম শ্রেণি — আন্তর্জাতিক বাণিজ্য",
  },
  {
    id: "ACAD-6109",
    classId: "class-9",
    subjectId: "economics",
    chapterId: "acad-class-9-eco-chapter-1",
    chapterName: "অধ্যায় ১: অর্থনীতি পরিচিতি",
    unitNumber: 1,
    topicId: "chapter-1",
    questionText: "অর্থনীতির মৌলিক সমস্যা কয়টি?",
    options: [
      { letter: "A", text: "২টি" },
      { letter: "B", text: "৪টি" },
      { letter: "C", text: "৫টি" },
      { letter: "D", text: "৩টি" }
    ],
    correctLetter: "D",
    explanation: "মৌলিক সমস্যা ৩টি: কী উৎপাদন হবে, কীভাবে উৎপাদন হবে, কার জন্য উৎপাদন হবে।",
    difficulty: "medium",
    sourceNote: "NCTB অর্থনীতি — অধ্যায় ১",
  },
  {
    id: "ACAD-6110",
    classId: "class-9",
    subjectId: "economics",
    chapterId: "acad-class-9-eco-topic-1",
    chapterName: "চাহিদা",
    unitNumber: 2,
    topicId: "topic-1",
    questionText: "চাহিদার নির্ধারক কোনটি?",
    options: [
      { letter: "A", text: "দাম" },
      { letter: "B", text: "মজুরি" },
      { letter: "C", text: "উৎপাদন" },
      { letter: "D", text: "যোগান" }
    ],
    correctLetter: "A",
    explanation: "দাম, আয়, রুচি ও বিকল্প পণ্যের দাম চাহিদা নির্ধারণ করে।",
    difficulty: "medium",
    sourceNote: "NCTB অর্থনীতি — চাহিদা",
  },
  {
    id: "ACAD-6111",
    classId: "class-9",
    subjectId: "economics",
    chapterId: "acad-class-9-eco-topic-2",
    chapterName: "যোগান",
    unitNumber: 3,
    topicId: "topic-2",
    questionText: "যোগানের নির্ধারক কোনটি?",
    options: [
      { letter: "A", text: "ভোক্তার রুচি" },
      { letter: "B", text: "ভোক্তার আয়" },
      { letter: "C", text: "উৎপাদন ব্যয়" },
      { letter: "D", text: "জনসংখ্যা" }
    ],
    correctLetter: "C",
    explanation: "উৎপাদন ব্যয়, প্রযুক্তি ও কর যোগানকে প্রভাবিত করে।",
    difficulty: "medium",
    sourceNote: "NCTB অর্থনীতি — যোগান",
  },
  {
    id: "ACAD-6112",
    classId: "class-9",
    subjectId: "economics",
    chapterId: "acad-class-9-eco-topic-3",
    chapterName: "বাজার",
    unitNumber: 4,
    topicId: "topic-3",
    questionText: "ভারসাম্য দাম কী?",
    options: [
      { letter: "A", text: "সর্বনিম্ন দাম" },
      { letter: "B", text: "যে দামে চাহিদা ও যোগান সমান" },
      { letter: "C", text: "সর্বোচ্চ দাম" },
      { letter: "D", text: "সরকারি দাম" }
    ],
    correctLetter: "B",
    explanation: "যে দামে চাহিদা ও যোগান সমান হয়, তাই ভারসাম্য দাম।",
    difficulty: "medium",
    sourceNote: "NCTB অর্থনীতি — বাজার",
  },
  {
    id: "ACAD-6113",
    classId: "class-9",
    subjectId: "economics",
    chapterId: "acad-class-9-eco-topic-4",
    chapterName: "জাতীয় আয়",
    unitNumber: 5,
    topicId: "topic-4",
    questionText: "মাথাপিছু আয় কীভাবে বের করা হয়?",
    options: [
      { letter: "A", text: "GDP − জনসংখ্যা" },
      { letter: "B", text: "জাতীয় আয় × জনসংখ্যা" },
      { letter: "C", text: "রপ্তানি ÷ জনসংখ্যা" },
      { letter: "D", text: "জাতীয় আয় ÷ মোট জনসংখ্যা" }
    ],
    correctLetter: "D",
    explanation: "মাথাপিছু আয় = মোট জাতীয় আয় / মোট জনসংখ্যা।",
    difficulty: "medium",
    sourceNote: "NCTB অর্থনীতি — জাতীয় আয়",
  },
  {
    id: "ACAD-6114",
    classId: "class-9",
    subjectId: "economics",
    chapterId: "acad-class-9-eco-topic-5",
    chapterName: "মুদ্রাস্ফীতি",
    unitNumber: 6,
    topicId: "topic-5",
    questionText: "মুদ্রাস্ফীতি মাপা হয় কী দিয়ে?",
    options: [
      { letter: "A", text: "ভোক্তা মূল্য সূচক (CPI)" },
      { letter: "B", text: "বেকারত্বের হার" },
      { letter: "C", text: "জনসংখ্যা" },
      { letter: "D", text: "GDP" }
    ],
    correctLetter: "A",
    explanation: "ভোক্তা মূল্য সূচক দিয়ে দ্রব্যমূল্যের পরিবর্তন মাপা হয়।",
    difficulty: "medium",
    sourceNote: "NCTB অর্থনীতি — মুদ্রাস্ফীতি",
  },
  {
    id: "ACAD-6115",
    classId: "class-9",
    subjectId: "economics",
    chapterId: "acad-class-9-eco-topic-6",
    chapterName: "বেকারত্ব",
    unitNumber: 7,
    topicId: "topic-6",
    questionText: "শিক্ষিত বেকারত্বের কারণ কী?",
    options: [
      { letter: "A", text: "কর্মসংস্থানের অভাব" },
      { letter: "B", text: "দারিদ্র্য" },
      { letter: "C", text: "অলসতা" },
      { letter: "D", text: "শিক্ষার অভাব" }
    ],
    correctLetter: "A",
    explanation: "শিক্ষিত তরুণদের তুলনায় উপযুক্ত কর্মসংস্থান কম থাকায় শিক্ষিত বেকারত্ব বাড়ে।",
    difficulty: "medium",
    sourceNote: "NCTB অর্থনীতি — বেকারত্ব",
  },
  {
    id: "ACAD-6116",
    classId: "class-9",
    subjectId: "economics",
    chapterId: "acad-class-9-eco-topic-7",
    chapterName: "বাজেট",
    unitNumber: 8,
    topicId: "topic-7",
    questionText: "ঘাটতি বাজেট কাকে বলে?",
    options: [
      { letter: "A", text: "কর না থাকলে" },
      { letter: "B", text: "আয় ব্যয়ের চেয়ে বেশি হলে" },
      { letter: "C", text: "ব্যয় আয়ের চেয়ে বেশি হলে" },
      { letter: "D", text: "আয়-ব্যয় সমান হলে" }
    ],
    correctLetter: "C",
    explanation: "সরকারের ব্যয় আয়ের চেয়ে বেশি হলে তা ঘাটতি বাজেট।",
    difficulty: "medium",
    sourceNote: "NCTB অর্থনীতি — সরকারি অর্থব্যবস্থা",
  },
  {
    id: "ACAD-6117",
    classId: "class-9",
    subjectId: "economics",
    chapterId: "acad-class-9-eco-topic-8",
    chapterName: "ব্যাংক",
    unitNumber: 9,
    topicId: "topic-8",
    questionText: "বাণিজ্যিক ব্যাংক কীভাবে মুনাফা করে?",
    options: [
      { letter: "A", text: "শুধু সরকারি অনুদান থেকে" },
      { letter: "B", text: "শুধু চার্জ থেকে" },
      { letter: "C", text: "শুধু শেয়ার থেকে" },
      { letter: "D", text: "ঋণের সুদ ও আমানতের সুদের পার্থক্য থেকে" }
    ],
    correctLetter: "D",
    explanation: "ব্যাংক কম সুদে আমানত নিয়ে বেশি সুদে ঋণ দেয়; পার্থক্যই মুনাফা।",
    difficulty: "medium",
    sourceNote: "NCTB অর্থনীতি — ব্যাংক ব্যবস্থা",
  },
  {
    id: "ACAD-6118",
    classId: "class-9",
    subjectId: "economics",
    chapterId: "acad-class-9-eco-topic-9",
    chapterName: "আন্তর্জাতিক বাণিজ্য",
    unitNumber: 10,
    topicId: "topic-9",
    questionText: "বাণিজ্য ঘাটতি কাকে বলে?",
    options: [
      { letter: "A", text: "রপ্তানি আমদানির চেয়ে বেশি হলে" },
      { letter: "B", text: "আমদানি রপ্তানির চেয়ে বেশি হলে" },
      { letter: "C", text: "বাণিজ্য বন্ধ হলে" },
      { letter: "D", text: "আমদানি-রপ্তানি সমান হলে" }
    ],
    correctLetter: "B",
    explanation: "আমদানি রপ্তানির চেয়ে বেশি হলে বাণিজ্য ঘাটতি হয়।",
    difficulty: "medium",
    sourceNote: "NCTB অর্থনীতি — আন্তর্জাতিক বাণিজ্য",
  },
  {
    id: "ACAD-6119",
    classId: "class-9",
    subjectId: "economics",
    chapterId: "acad-class-9-eco-topic-10",
    chapterName: "দারিদ্র্য",
    unitNumber: 11,
    topicId: "topic-10",
    questionText: "দারিদ্র্য দূরীকরণে কার্যকর উপায় কোনটি?",
    options: [
      { letter: "A", text: "শুধু দান" },
      { letter: "B", text: "শিক্ষা ও কর্মসংস্থান" },
      { letter: "C", text: "শুধু ঋণ" },
      { letter: "D", text: "শুধু সাহায্য" }
    ],
    correctLetter: "B",
    explanation: "শিক্ষা ও কর্মসংস্থান দারিদ্র্য দূরীকরণের স্থায়ী উপায়।",
    difficulty: "medium",
    sourceNote: "NCTB অর্থনীতি — দারিদ্র্য",
  },
  {
    id: "ACAD-6120",
    classId: "class-9",
    subjectId: "economics",
    chapterId: "acad-class-9-eco-topic-11",
    chapterName: "উৎপাদন",
    unitNumber: 12,
    topicId: "topic-11",
    questionText: "উৎপাদনের উপাদান কয়টি?",
    options: [
      { letter: "A", text: "৫টি" },
      { letter: "B", text: "৩টি" },
      { letter: "C", text: "৪টি" },
      { letter: "D", text: "২টি" }
    ],
    correctLetter: "C",
    explanation: "উৎপাদনের উপাদান ৪টি: ভূমি, শ্রম, মূলধন ও সংগঠন।",
    difficulty: "medium",
    sourceNote: "NCTB অর্থনীতি — উৎপাদন",
  },
  {
    id: "ACAD-3011",
    classId: "class-11",
    subjectId: "economics",
    chapterId: "acad-class-11-eco-topic-1",
    chapterName: "ব্যষ্টিক অর্থনীতি",
    unitNumber: 1,
    topicId: "topic-1",
    questionText: "ব্যষ্টিক অর্থনীতি কী নিয়ে আলোচনা করে?",
    options: [
      { letter: "A", text: "জাতীয় আয়" },
      { letter: "B", text: "বেকারত্ব" },
      { letter: "C", text: "মুদ্রাস্ফীতি" },
      { letter: "D", text: "একক ভোক্তা ও ফার্ম" }
    ],
    correctLetter: "D",
    explanation: "ব্যষ্টিক অর্থনীতিতে একক ভোক্তা, ফার্ম ও বাজারের আচরণ আলোচিত হয়।",
    difficulty: "easy",
    sourceNote: "NCTB HSC অর্থনীতি ১ম পত্র — অধ্যায় ১",
  },
  {
    id: "ACAD-3012",
    classId: "class-11",
    subjectId: "economics",
    chapterId: "acad-class-11-eco-topic-2",
    chapterName: "উপযোগ",
    unitNumber: 2,
    topicId: "topic-2",
    questionText: "প্রান্তিক উপযোগ কখন শূন্য হয়?",
    options: [
      { letter: "A", text: "মোট উপযোগ শূন্য হলে" },
      { letter: "B", text: "দাম শূন্য হলে" },
      { letter: "C", text: "মোট উপযোগ সর্বোচ্চ হলে" },
      { letter: "D", text: "কখনোই নয়" }
    ],
    correctLetter: "C",
    explanation: "মোট উপযোগ সর্বোচ্চ হলে প্রান্তিক উপযোগ শূন্য হয়; এরপর তা ঋণাত্মক হয়।",
    difficulty: "medium",
    sourceNote: "NCTB HSC অর্থনীতি ১ম পত্র — উপযোগ অধ্যায়",
  },
  {
    id: "ACAD-3013",
    classId: "class-11",
    subjectId: "economics",
    chapterId: "acad-class-11-eco-topic-3",
    chapterName: "উৎপাদন",
    unitNumber: 3,
    topicId: "topic-3",
    questionText: "স্বল্পকালে কোন উপাদান স্থির থাকে?",
    options: [
      { letter: "A", text: "শ্রম" },
      { letter: "B", text: "স্থায়ী উপাদান" },
      { letter: "C", text: "বিদ্যুৎ" },
      { letter: "D", text: "কাঁচামাল" }
    ],
    correctLetter: "B",
    explanation: "স্বল্পকালে স্থায়ী উপাদান (যন্ত্রপাতি, ভবন) স্থির থাকে; পরিবর্তনশীল উপাদান বদলায়।",
    difficulty: "medium",
    sourceNote: "NCTB HSC অর্থনীতি ১ম পত্র — উৎপাদন অধ্যায়",
  },
  {
    id: "ACAD-3014",
    classId: "class-11",
    subjectId: "economics",
    chapterId: "acad-class-11-eco-topic-4",
    chapterName: "বাজার কাঠামো",
    unitNumber: 4,
    topicId: "topic-4",
    questionText: "পূর্ণ প্রতিযোগিতায় ফার্ম কী?",
    options: [
      { letter: "A", text: "দাম গ্রহীতা" },
      { letter: "B", text: "দাম নির্ধারক" },
      { letter: "C", text: "অলিগোপলি" },
      { letter: "D", text: "একচেটিয়া" }
    ],
    correctLetter: "A",
    explanation: "পূর্ণ প্রতিযোগিতায় অনেক ফার্ম থাকায় প্রতিটি ফার্ম বাজারদাম গ্রহণ করে।",
    difficulty: "medium",
    sourceNote: "NCTB HSC অর্থনীতি ১ম পত্র — বাজার কাঠামো",
  },
  {
    id: "ACAD-3015",
    classId: "class-11",
    subjectId: "economics",
    chapterId: "acad-class-11-eco-topic-5",
    chapterName: "জাতীয় আয়",
    unitNumber: 5,
    topicId: "topic-5",
    questionText: "GDP-তে কোনটি গণনা করা হয় না?",
    options: [
      { letter: "A", text: "চাল উৎপাদন" },
      { letter: "B", text: "রপ্তানি" },
      { letter: "C", text: "সরকারি সেবা" },
      { letter: "D", text: "গৃহিণীর গৃহকর্ম" }
    ],
    correctLetter: "D",
    explanation: "বাজারে লেনদেন হয় না বলে গৃহকর্ম GDP-তে ধরা হয় না।",
    difficulty: "medium",
    sourceNote: "NCTB HSC অর্থনীতি ১ম পত্র — জাতীয় আয়",
  },
  {
    id: "ACAD-3016",
    classId: "class-11",
    subjectId: "economics",
    chapterId: "acad-class-11-eco-topic-6",
    chapterName: "মুদ্রা",
    unitNumber: 6,
    topicId: "topic-6",
    questionText: "মুদ্রার প্রধান কাজ কী?",
    options: [
      { letter: "A", text: "শুধু অলংকার" },
      { letter: "B", text: "বিনিময়ের মাধ্যম" },
      { letter: "C", text: "শুধু কর" },
      { letter: "D", text: "শুধু সঞ্চয়" }
    ],
    correctLetter: "B",
    explanation: "মুদ্রা বিনিময়ের মাধ্যম, মূল্যের পরিমাপক ও সঞ্চয়ের বাহন।",
    difficulty: "easy",
    sourceNote: "NCTB HSC অর্থনীতি ১ম পত্র — অধ্যায় ১০ (মুদ্রা ও ব্যাংক)",
  },
  {
    id: "ACAD-3017",
    classId: "class-11",
    subjectId: "economics",
    chapterId: "acad-class-11-eco-topic-7",
    chapterName: "বাংলাদেশের অর্থনীতি",
    unitNumber: 7,
    topicId: "topic-7",
    questionText: "বাংলাদেশের অর্থনীতির প্রধান খাত কোনটি?",
    options: [
      { letter: "A", text: "কৃষি খাত" },
      { letter: "B", text: "শিল্প খাত" },
      { letter: "C", text: "সেবা খাত" },
      { letter: "D", text: "খনিজ খাত" }
    ],
    correctLetter: "C",
    explanation: "GDP-তে সেবা খাতের অবদান সবচেয়ে বেশি; কর্মসংস্থানে কৃষি এখনো বড়।",
    difficulty: "medium",
    sourceNote: "NCTB HSC অর্থনীতি ২য় পত্র — বাংলাদেশের অর্থনীতি",
  },
  {
    id: "ACAD-3018",
    classId: "class-11",
    subjectId: "economics",
    chapterId: "acad-class-11-eco-topic-8",
    chapterName: "দারিদ্র্য",
    unitNumber: 8,
    topicId: "topic-8",
    questionText: "দারিদ্র্য পরিমাপের সাধারণ সূচক কোনটি?",
    options: [
      { letter: "A", text: "GDP" },
      { letter: "B", text: "মাথাপিছু আয় শুধু" },
      { letter: "C", text: "রপ্তানি" },
      { letter: "D", text: "দারিদ্র্য সীমার নিচে জনসংখ্যার হার" }
    ],
    correctLetter: "D",
    explanation: "দারিদ্র্য সীমার নিচে বসবাসকারী জনসংখ্যার অনুপাতই দারিদ্র্যের প্রধান সূচক।",
    difficulty: "medium",
    sourceNote: "NCTB HSC অর্থনীতি ২য় পত্র — দারিদ্র্য অধ্যায়",
  },
  {
    id: "ACAD-3019",
    classId: "class-11",
    subjectId: "economics",
    chapterId: "acad-class-11-eco-topic-9",
    chapterName: "রাজস্ব নীতি",
    unitNumber: 9,
    topicId: "topic-9",
    questionText: "সরকারি ব্যয় বাড়ালে সামগ্রিক চাহিদা —",
    options: [
      { letter: "A", text: "কমে" },
      { letter: "B", text: "একই থাকে" },
      { letter: "C", text: "শূন্য হয়" },
      { letter: "D", text: "বাড়ে" }
    ],
    correctLetter: "D",
    explanation: "সম্প্রসারণমূলক রাজস্ব নীতিতে সরকারি ব্যয় বাড়লে চাহিদা ও উৎপাদন বাড়ে।",
    difficulty: "medium",
    sourceNote: "NCTB HSC অর্থনীতি ১ম পত্র — রাজস্ব নীতি",
  },
  {
    id: "ACAD-3020",
    classId: "class-11",
    subjectId: "economics",
    chapterId: "acad-class-11-eco-topic-10",
    chapterName: "আন্তর্জাতিক বাণিজ্য",
    unitNumber: 10,
    topicId: "topic-10",
    questionText: "তুলনামূলক সুবিধা তত্ত্বের প্রবক্তা কে?",
    options: [
      { letter: "A", text: "মার্শাল" },
      { letter: "B", text: "ডেভিড রিকার্ডো" },
      { letter: "C", text: "অ্যাডাম স্মিথ" },
      { letter: "D", text: "কেইনস" }
    ],
    correctLetter: "B",
    explanation: "ডেভিড রিকার্ডোর তুলনামূলক সুবিধা তত্ত্ব আন্তর্জাতিক বাণিজ্যের ভিত্তি।",
    difficulty: "medium",
    sourceNote: "NCTB HSC অর্থনীতি ২য় পত্র — আন্তর্জাতিক বাণিজ্য",
  },
  {
    id: "ACAD-8001",
    classId: "class-11",
    subjectId: "economics",
    chapterId: "acad-class-11-eco-topic-1",
    chapterName: "ব্যষ্টিক অর্থনীতি",
    unitNumber: 1,
    topicId: "topic-1",
    questionText: "সমষ্টিক অর্থনীতি কী নিয়ে আলোচনা করে?",
    options: [
      { letter: "A", text: "জাতীয় আয়, মুদ্রাস্ফীতি, বেকারত্ব" },
      { letter: "B", text: "একক ফার্ম" },
      { letter: "C", text: "একটি বাজার" },
      { letter: "D", text: "একক ভোক্তা" }
    ],
    correctLetter: "A",
    explanation: "সমষ্টিক অর্থনীতিতে পুরো অর্থনীতির মোট চলক (GDP, মুদ্রাস্ফীতি) আলোচিত হয়।",
    difficulty: "medium",
    sourceNote: "NCTB HSC অর্থনীতি ১ম পত্র — ব্যষ্টিক ও সমষ্টিক",
  },
  {
    id: "ACAD-8002",
    classId: "class-11",
    subjectId: "economics",
    chapterId: "acad-class-11-eco-topic-2",
    chapterName: "উপযোগ",
    unitNumber: 2,
    topicId: "topic-2",
    questionText: "ক্রমহ্রাসমান প্রান্তিক উপযোগ বিধি কে দেন?",
    options: [
      { letter: "A", text: "মার্শাল" },
      { letter: "B", text: "গসেন" },
      { letter: "C", text: "কেইনস" },
      { letter: "D", text: "রিকার্ডো" }
    ],
    correctLetter: "B",
    explanation: "গসেনের প্রথম সূত্রই ক্রমহ্রাসমান প্রান্তিক উপযোগ বিধি।",
    difficulty: "medium",
    sourceNote: "NCTB HSC অর্থনীতি ১ম পত্র — উপযোগ",
  },
  {
    id: "ACAD-8003",
    classId: "class-11",
    subjectId: "economics",
    chapterId: "acad-class-11-eco-topic-3",
    chapterName: "উৎপাদন",
    unitNumber: 3,
    topicId: "topic-3",
    questionText: "ক্রমহ্রাসমান প্রান্তিক উৎপাদন বিধি কখন প্রযোজ্য?",
    options: [
      { letter: "A", text: "স্বল্পকালে" },
      { letter: "B", text: "কখনো নয়" },
      { letter: "C", text: "সবসময়" },
      { letter: "D", text: "দীর্ঘকালে" }
    ],
    correctLetter: "A",
    explanation: "স্বল্পকালে স্থায়ী উপাদান স্থির থাকায় পরিবর্তনশীল উপাদান বাড়ালে প্রান্তিক উৎপাদন কমে।",
    difficulty: "medium",
    sourceNote: "NCTB HSC অর্থনীতি ১ম পত্র — উৎপাদন",
  },
  {
    id: "ACAD-8004",
    classId: "class-11",
    subjectId: "economics",
    chapterId: "acad-class-11-eco-topic-4",
    chapterName: "বাজার কাঠামো",
    unitNumber: 4,
    topicId: "topic-4",
    questionText: "একচেটিয়া বাজারে ফার্ম কয়টি?",
    options: [
      { letter: "A", text: "একটি" },
      { letter: "B", text: "দুটি" },
      { letter: "C", text: "কয়েকটি" },
      { letter: "D", text: "অনেক" }
    ],
    correctLetter: "A",
    explanation: "একচেটিয়ায় একটিমাত্র বিক্রেতা থাকে; সে দাম নির্ধারণ করে।",
    difficulty: "medium",
    sourceNote: "NCTB HSC অর্থনীতি ১ম পত্র — বাজার কাঠামো",
  },
  {
    id: "ACAD-8005",
    classId: "class-11",
    subjectId: "economics",
    chapterId: "acad-class-11-eco-topic-5",
    chapterName: "জাতীয় আয়",
    unitNumber: 5,
    topicId: "topic-5",
    questionText: "GNP ও GDP-এর পার্থক্য কী?",
    options: [
      { letter: "A", text: "কর" },
      { letter: "B", text: "বিদেশে অর্জিত নিট আয়" },
      { letter: "C", text: "জনসংখ্যা" },
      { letter: "D", text: "মুদ্রাস্ফীতি" }
    ],
    correctLetter: "B",
    explanation: "GNP = GDP + বিদেশ থেকে নিট আয়।",
    difficulty: "medium",
    sourceNote: "NCTB HSC অর্থনীতি ১ম পত্র — জাতীয় আয়",
  },
  {
    id: "ACAD-8006",
    classId: "class-11",
    subjectId: "economics",
    chapterId: "acad-class-11-eco-topic-6",
    chapterName: "মুদ্রা",
    unitNumber: 6,
    topicId: "topic-6",
    questionText: "কেন্দ্রীয় ব্যাংক মুদ্রা সরবরাহ কমাতে কী করে?",
    options: [
      { letter: "A", text: "কর কমায়" },
      { letter: "B", text: "সরকারি ব্যয় বাড়ায়" },
      { letter: "C", text: "ব্যাংক হার বাড়ায়" },
      { letter: "D", text: "ব্যাংক হার কমায়" }
    ],
    correctLetter: "C",
    explanation: "ব্যাংক হার বাড়ালে ঋণ কমে; মুদ্রা সরবরাহ সংকুচিত হয়।",
    difficulty: "medium",
    sourceNote: "NCTB HSC অর্থনীতি ১ম পত্র — অধ্যায় ১০ (মুদ্রা ও ব্যাংক)",
  },
  {
    id: "ACAD-8007",
    classId: "class-11",
    subjectId: "economics",
    chapterId: "acad-class-11-eco-topic-7",
    chapterName: "বাংলাদেশের অর্থনীতি",
    unitNumber: 7,
    topicId: "topic-7",
    questionText: "বাংলাদেশের GDP-তে কৃষি খাতের অবদান প্রায় কত?",
    options: [
      { letter: "A", text: "১০–১২%" },
      { letter: "B", text: "৫%" },
      { letter: "C", text: "৫০%" },
      { letter: "D", text: "৪০%" }
    ],
    correctLetter: "A",
    explanation: "বাংলাদেশ অর্থনৈতিক সমীক্ষা ২০২৫ (বিবিএস, ২০২৪-২৫ অর্থবছর, সাময়িক হিসাব) অনুযায়ী জিডিপিতে কৃষি খাতের অবদান ১০.৯৪%; সেবা খাত সবচেয়ে বড় (৫১.৬২%)।",
    difficulty: "medium",
    sourceNote: "NCTB HSC অর্থনীতি ২য় পত্র — বাংলাদেশের অর্থনীতি",
  },
  {
    id: "ACAD-8008",
    classId: "class-11",
    subjectId: "economics",
    chapterId: "acad-class-11-eco-topic-8",
    chapterName: "দারিদ্র্য",
    unitNumber: 8,
    topicId: "topic-8",
    questionText: "চরম দারিদ্র্য বলতে কী বোঝায়?",
    options: [
      { letter: "A", text: "শুধু স্বাস্থ্য খারাপ" },
      { letter: "B", text: "শুধু আয় কম" },
      { letter: "C", text: "মৌলিক চাহিদা মেটাতে না পারা" },
      { letter: "D", text: "শুধু শিক্ষা কম" }
    ],
    correctLetter: "C",
    explanation: "চরম দারিদ্র্যে খাদ্য, বস্ত্র, বাসস্থানের মতো মৌলিক চাহিদাই মেটে না।",
    difficulty: "medium",
    sourceNote: "NCTB HSC অর্থনীতি ২য় পত্র — দারিদ্র্য",
  },
  {
    id: "ACAD-8009",
    classId: "class-11",
    subjectId: "economics",
    chapterId: "acad-class-11-eco-topic-9",
    chapterName: "রাজস্ব নীতি",
    unitNumber: 9,
    topicId: "topic-9",
    questionText: "মন্দার সময় সরকার কী নীতি নেয়?",
    options: [
      { letter: "A", text: "সংকোচনমূলক নীতি" },
      { letter: "B", text: "সম্প্রসারণমূলক রাজস্ব নীতি" },
      { letter: "C", text: "কর বাড়ায়" },
      { letter: "D", text: "কিছুই করে না" }
    ],
    correctLetter: "B",
    explanation: "মন্দায় সরকার ব্যয় বাড়ায় ও কর কমায় — সম্প্রসারণমূলক নীতি।",
    difficulty: "medium",
    sourceNote: "NCTB HSC অর্থনীতি ১ম পত্র — রাজস্ব নীতি",
  },
  {
    id: "ACAD-8010",
    classId: "class-11",
    subjectId: "economics",
    chapterId: "acad-class-11-eco-topic-10",
    chapterName: "আন্তর্জাতিক বাণিজ্য",
    unitNumber: 10,
    topicId: "topic-10",
    questionText: "পরম সুবিধা তত্ত্বের প্রবক্তা কে?",
    options: [
      { letter: "A", text: "কেইনস" },
      { letter: "B", text: "ডেভিড রিকার্ডো" },
      { letter: "C", text: "মার্শাল" },
      { letter: "D", text: "অ্যাডাম স্মিথ" }
    ],
    correctLetter: "D",
    explanation: "অ্যাডাম স্মিথের পরম সুবিধা তত্ত্বের পর রিকার্ডো তুলনামূলক সুবিধা তত্ত্ব দেন।",
    difficulty: "medium",
    sourceNote: "NCTB HSC অর্থনীতি ২য় পত্র — আন্তর্জাতিক বাণিজ্য",
  },
  {
    id: "ACAD-8011",
    classId: "class-11",
    subjectId: "economics",
    chapterId: "acad-class-11-eco-topic-11",
    chapterName: "ভোক্তার উদ্বৃত্ত",
    unitNumber: 11,
    topicId: "topic-11",
    questionText: "ভোক্তার উদ্বৃত্ত কী?",
    options: [
      { letter: "A", text: "আয় − ব্যয়" },
      { letter: "B", text: "প্রকৃত দাম − ব্যয়" },
      { letter: "C", text: "দিতে ইচ্ছুক দাম − প্রকৃত দাম" },
      { letter: "D", text: "বিক্রয় − ক্রয়" }
    ],
    correctLetter: "C",
    explanation: "ভোক্তা যে দাম দিতে রাজি তার চেয়ে কম দামে পেলে পার্থক্যটুকুই উদ্বৃত্ত।",
    difficulty: "hard",
    sourceNote: "NCTB HSC অর্থনীতি ১ম পত্র — ভোক্তার উদ্বৃত্ত",
  },
  {
    id: "ACAD-8012",
    classId: "class-11",
    subjectId: "economics",
    chapterId: "acad-class-11-eco-topic-12",
    chapterName: "অর্থনৈতিক উন্নয়ন",
    unitNumber: 12,
    topicId: "topic-12",
    questionText: "মানব উন্নয়ন সূচক (HDI) কী মাপে?",
    options: [
      { letter: "A", text: "আয়, শিক্ষা ও স্বাস্থ্য" },
      { letter: "B", text: "শুধু জনসংখ্যা" },
      { letter: "C", text: "শুধু GDP" },
      { letter: "D", text: "শুধু আয়" }
    ],
    correctLetter: "A",
    explanation: "HDI-তে আয়, শিক্ষা ও আয়ুষ্কাল — তিনটি মাত্রা মাপা হয়।",
    difficulty: "medium",
    sourceNote: "NCTB HSC অর্থনীতি ২য় পত্র — অর্থনৈতিক উন্নয়ন",
  },
];
