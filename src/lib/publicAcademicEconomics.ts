// Eduvelto — Academic Economics practice questions (Class 9),
// verified against the Dakhil NCTB books (review 26 Nov 2026).
//
// Static data ONLY — zero Firestore reads. The 22 questions are the
// Academic Class 9 Economics drafts AFTER review (see
// review-academic-c9-economics-geography-verdicts.json and
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

import { type PublicAcademicQuestion } from './publicAcademic';

/** All verified Academic Economics questions, Class 9 (in draft order). */
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
];
