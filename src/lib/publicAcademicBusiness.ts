// Eduvelto — Academic Business Entrepreneurship practice questions (Class 9),
// verified against the Dakhil NCTB books (review 26 Nov 2026).
//
// Static data ONLY — zero Firestore reads. The 22 questions are the
// Academic Class 9 Business Entrepreneurship drafts AFTER review (see
// review-academic-c9-business-finance-verdicts.json and
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
// to PUBLIC_ACADEMIC_BUSINESS_QUESTIONS below (same shape, same generation
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

/** All verified Academic Business Entrepreneurship questions, Class 9 (in draft order). */
export const PUBLIC_ACADEMIC_BUSINESS_QUESTIONS: PublicAcademicQuestion[] = [
  {
    id: "ACAD-1051",
    classId: "class-9",
    subjectId: "business",
    chapterId: "acad-class-9-bus-chapter-1",
    chapterName: "অধ্যায় ১: ব্যবসায় পরিচিতি",
    unitNumber: 1,
    topicId: "chapter-1",
    questionText: "মুনাফা অর্জনের উদ্দেশ্যে পণ্য বা সেবা ক্রয়-বিক্রয়কে কী বলে?",
    options: [
      { letter: "A", text: "ব্যবসায়" },
      { letter: "B", text: "চাকরি" },
      { letter: "C", text: "সেবা" },
      { letter: "D", text: "কৃষি" }
    ],
    correctLetter: "A",
    explanation: "মুনাফার উদ্দেশ্যে বৈধভাবে পণ্য/সেবা ক্রয়-বিক্রয়ই ব্যবসায়।",
    difficulty: "easy",
    sourceNote: "NCTB ব্যবসায় উদ্যোগ, নবম-দশম শ্রেণি — অধ্যায় ১: ব্যবসায় পরিচিতি",
  },
  {
    id: "ACAD-1052",
    classId: "class-9",
    subjectId: "business",
    chapterId: "acad-class-9-bus-topic-1",
    chapterName: "উদ্যোক্তা",
    unitNumber: 2,
    topicId: "topic-1",
    questionText: "উদ্যোক্তার প্রধান গুণ কোনটি?",
    options: [
      { letter: "A", text: "ঝুঁকি এড়ানো" },
      { letter: "B", text: "ঝুঁকি নেওয়ার মানসিকতা" },
      { letter: "C", text: "অলসতা" },
      { letter: "D", text: "অন্যের ওপর নির্ভরতা" }
    ],
    correctLetter: "B",
    explanation: "উদ্যোক্তা নতুন ব্যবসা শুরু করেন ও ঝুঁকি নেন; সৃজনশীলতা ও সাহস তাঁর প্রধান গুণ।",
    difficulty: "medium",
    sourceNote: "NCTB ব্যবসায় উদ্যোগ, নবম-দশম শ্রেণি — উদ্যোক্তা অধ্যায়",
  },
  {
    id: "ACAD-1053",
    classId: "class-9",
    subjectId: "business",
    chapterId: "acad-class-9-bus-topic-2",
    chapterName: "একমালিকানা",
    unitNumber: 3,
    topicId: "topic-2",
    questionText: "একজন মালিকের ব্যবসাকে কী বলে?",
    options: [
      { letter: "A", text: "সমবায়" },
      { letter: "B", text: "যৌথ মূলধনী কোম্পানি" },
      { letter: "C", text: "একমালিকানা ব্যবসায়" },
      { letter: "D", text: "অংশীদারি ব্যবসায়" }
    ],
    correctLetter: "C",
    explanation: "একজন ব্যক্তি মূলধন দিয়ে পরিচালনা করলে তা একমালিকানা ব্যবসায়।",
    difficulty: "easy",
    sourceNote: "NCTB ব্যবসায় উদ্যোগ, নবম-দশম শ্রেণি — ব্যবসায়ের ধরন",
  },
  {
    id: "ACAD-1054",
    classId: "class-9",
    subjectId: "business",
    chapterId: "acad-class-9-bus-topic-3",
    chapterName: "অংশীদারি",
    unitNumber: 4,
    topicId: "topic-3",
    questionText: "অংশীদারি ব্যবসায়ে অংশীদারদের দায় কেমন?",
    options: [
      { letter: "A", text: "শূন্য" },
      { letter: "B", text: "অসীম" },
      { letter: "C", text: "সীমিত" },
      { letter: "D", text: "শুধু মূলধন পর্যন্ত" }
    ],
    correctLetter: "B",
    explanation: "সাধারণ অংশীদারি ব্যবসায়ে অংশীদারদের দায় অসীম হয়।",
    difficulty: "medium",
    sourceNote: "NCTB ব্যবসায় উদ্যোগ, নবম-দশম শ্রেণি — অংশীদারি ব্যবসায়",
  },
  {
    id: "ACAD-1055",
    classId: "class-9",
    subjectId: "business",
    chapterId: "acad-class-9-bus-topic-4",
    chapterName: "বাজারজাতকরণ",
    unitNumber: 5,
    topicId: "topic-4",
    questionText: "পণ্য ভোক্তার কাছে পৌঁছে দেওয়ার কাজকে কী বলে?",
    options: [
      { letter: "A", text: "বাজারজাতকরণ" },
      { letter: "B", text: "গুদামজাতকরণ" },
      { letter: "C", text: "ক্রয়" },
      { letter: "D", text: "উৎপাদন" }
    ],
    correctLetter: "A",
    explanation: "বাজারজাতকরণে পণ্যের প্রচার, বিতরণ ও বিক্রয়ের সব কাজ অন্তর্ভুক্ত।",
    difficulty: "medium",
    sourceNote: "NCTB ব্যবসায় উদ্যোগ, নবম-দশম শ্রেণি — বাজারজাতকরণ",
  },
  {
    id: "ACAD-1056",
    classId: "class-9",
    subjectId: "business",
    chapterId: "acad-class-9-bus-topic-5",
    chapterName: "ব্যবসায় পরিকল্পনা",
    unitNumber: 6,
    topicId: "topic-5",
    questionText: "ব্যবসা শুরুর আগে লিখিত পরিকল্পনা কেন দরকার?",
    options: [
      { letter: "A", text: "শুধু ঋণ পেতে" },
      { letter: "B", text: "লক্ষ্য, ব্যয় ও ঝুঁকি আগেই ঠিক করা যায়" },
      { letter: "C", text: "শুধু লাইসেন্স পেতে" },
      { letter: "D", text: "কোনো দরকার নেই" }
    ],
    correctLetter: "B",
    explanation: "পরিকল্পনায় লক্ষ্য, মূলধন, বাজার ও ঝুঁকি আগে থেকে ঠিক করা যায় বলে ব্যবসা সফল হওয়ার সম্ভাবনা বাড়ে।",
    difficulty: "medium",
    sourceNote: "NCTB ব্যবসায় উদ্যোগ, নবম-দশম শ্রেণি — ব্যবসায় পরিকল্পনা",
  },
  {
    id: "ACAD-1057",
    classId: "class-9",
    subjectId: "business",
    chapterId: "acad-class-9-bus-topic-6",
    chapterName: "মুনাফা",
    unitNumber: 7,
    topicId: "topic-6",
    questionText: "বিক্রয়মূল্য ক্রয়মূল্যের চেয়ে বেশি হলে কী হয়?",
    options: [
      { letter: "A", text: "মুনাফা" },
      { letter: "B", text: "ভারসাম্য" },
      { letter: "C", text: "ক্ষতি" },
      { letter: "D", text: "দেউলিয়া" }
    ],
    correctLetter: "A",
    explanation: "বিক্রয়মূল্য − ক্রয়মূল্য ধনাত্মক হলে মুনাফা হয়।",
    difficulty: "easy",
    sourceNote: "NCTB ব্যবসায় উদ্যোগ, নবম-দশম শ্রেণি — মুনাফা অধ্যায়",
  },
  {
    id: "ACAD-1058",
    classId: "class-9",
    subjectId: "business",
    chapterId: "acad-class-9-bus-topic-7",
    chapterName: "সমবায়",
    unitNumber: 8,
    topicId: "topic-7",
    questionText: "সমবায় সমিতির মূলনীতি কী?",
    options: [
      { letter: "A", text: "মুনাফা একা ভোগ" },
      { letter: "B", text: "একক মালিকানা" },
      { letter: "C", text: "সরকারি নিয়ন্ত্রণ" },
      { letter: "D", text: "পারস্পরিক সহযোগিতা" }
    ],
    correctLetter: "D",
    explanation: "সমবায়ে সদস্যরা পারস্পরিক সহযোগিতায় নিজেদের অর্থনৈতিক উন্নতি করেন।",
    difficulty: "medium",
    sourceNote: "NCTB ব্যবসায় উদ্যোগ, নবম-দশম শ্রেণি — সমবায়",
  },
  {
    id: "ACAD-1059",
    classId: "class-9",
    subjectId: "business",
    chapterId: "acad-class-9-bus-topic-8",
    chapterName: "ট্রেড লাইসেন্স",
    unitNumber: 9,
    topicId: "topic-8",
    questionText: "ব্যবসা পরিচালনার জন্য স্থানীয় কর্তৃপক্ষের অনুমতিপত্রকে কী বলে?",
    options: [
      { letter: "A", text: "ভিসা" },
      { letter: "B", text: "ট্রেড লাইসেন্স" },
      { letter: "C", text: "পাসপোর্ট" },
      { letter: "D", text: "সনদপত্র" }
    ],
    correctLetter: "B",
    explanation: "সিটি করপোরেশন/ইউনিয়ন পরিষদ থেকে নেওয়া ট্রেড লাইসেন্স ছাড়া বৈধভাবে ব্যবসা করা যায় না।",
    difficulty: "easy",
    sourceNote: "NCTB ব্যবসায় উদ্যোগ, নবম-দশম শ্রেণি — ব্যবসায়ের আইনগত দিক",
  },
  {
    id: "ACAD-1060",
    classId: "class-9",
    subjectId: "business",
    chapterId: "acad-class-9-bus-topic-9",
    chapterName: "ক্ষুদ্র ব্যবসায়",
    unitNumber: 10,
    topicId: "topic-9",
    questionText: "ক্ষুদ্র ব্যবসায়ের বৈশিষ্ট্য কোনটি?",
    options: [
      { letter: "A", text: "বিদেশে রপ্তানি বাধ্যতামূলক" },
      { letter: "B", text: "বিশাল মূলধন" },
      { letter: "C", text: "শত শত শাখা" },
      { letter: "D", text: "কম মূলধন ও কম কর্মী" }
    ],
    correctLetter: "D",
    explanation: "ক্ষুদ্র ব্যবসায়ে মূলধন ও কর্মী কম থাকে; এটি গ্রামীণ অর্থনীতির গুরুত্বপূর্ণ অংশ।",
    difficulty: "easy",
    sourceNote: "NCTB ব্যবসায় উদ্যোগ, নবম-দশম শ্রেণি — ক্ষুদ্র ব্যবসায়",
  },
  {
    id: "ACAD-6061",
    classId: "class-9",
    subjectId: "business",
    chapterId: "acad-class-9-bus-topic-10",
    chapterName: "ব্যবসায়",
    unitNumber: 11,
    topicId: "topic-10",
    questionText: "ব্যবসায়ের ঝুঁকি বলতে কী বোঝায়?",
    options: [
      { letter: "A", text: "শুধু প্রতিযোগিতা" },
      { letter: "B", text: "নিশ্চিত মুনাফা" },
      { letter: "C", text: "ক্ষতির সম্ভাবনা" },
      { letter: "D", text: "শুধু কর" }
    ],
    correctLetter: "C",
    explanation: "বাজারের অনিশ্চয়তায় মুনাফার বদলে ক্ষতিও হতে পারে — এটাই ঝুঁকি।",
    difficulty: "medium",
    sourceNote: "NCTB ব্যবসায় উদ্যোগ — ব্যবসায়ের ঝুঁকি",
  },
  {
    id: "ACAD-6062",
    classId: "class-9",
    subjectId: "business",
    chapterId: "acad-class-9-bus-topic-1",
    chapterName: "উদ্যোক্তা",
    unitNumber: 2,
    topicId: "topic-1",
    questionText: "সফল উদ্যোক্তা হতে কী দরকার?",
    options: [
      { letter: "A", text: "শুধু মূলধন" },
      { letter: "B", text: "শুধু শিক্ষা" },
      { letter: "C", text: "শুধু ভাগ্য" },
      { letter: "D", text: "পরিকল্পনা, ধৈর্য ও পরিশ্রম" }
    ],
    correctLetter: "D",
    explanation: "মূলধনের পাশাপাশি পরিকল্পনা, ধৈর্য ও পরিশ্রম ছাড়া ব্যবসা টেকে না।",
    difficulty: "medium",
    sourceNote: "NCTB ব্যবসায় উদ্যোগ — উদ্যোক্তা",
  },
  {
    id: "ACAD-6063",
    classId: "class-9",
    subjectId: "business",
    chapterId: "acad-class-9-bus-topic-2",
    chapterName: "একমালিকানা",
    unitNumber: 3,
    topicId: "topic-2",
    questionText: "একমালিকানা ব্যবসায়ের অসুবিধা কোনটি?",
    options: [
      { letter: "A", text: "সীমিত মূলধন" },
      { letter: "B", text: "গোপনীয়তা" },
      { letter: "C", text: "দ্রুত সিদ্ধান্ত" },
      { letter: "D", text: "সহজ গঠন" }
    ],
    correctLetter: "A",
    explanation: "একজনের মূলধন সীমিত বলে বড় ব্যবসা করা কঠিন।",
    difficulty: "medium",
    sourceNote: "NCTB ব্যবসায় উদ্যোগ — ব্যবসায়ের ধরন",
  },
  {
    id: "ACAD-6064",
    classId: "class-9",
    subjectId: "business",
    chapterId: "acad-class-9-bus-topic-3",
    chapterName: "অংশীদারি",
    unitNumber: 4,
    topicId: "topic-3",
    questionText: "অংশীদারি ব্যবসায়ে অংশীদারদের মধ্যে বিরোধ এড়াতে কী করা উচিত?",
    options: [
      { letter: "A", text: "সরকারি লাইসেন্স শুধু" },
      { letter: "B", text: "শুধু টাকা" },
      { letter: "C", text: "শুধু মৌখিক কথা" },
      { letter: "D", text: "চুক্তিপত্র" }
    ],
    correctLetter: "D",
    explanation: "অংশীদারদের মধ্যে লিখিত চুক্তিপত্র থাকলে বিরোধ কম হয়।",
    difficulty: "medium",
    sourceNote: "NCTB ব্যবসায় উদ্যোগ — অংশীদারি ব্যবসায়",
  },
  {
    id: "ACAD-6065",
    classId: "class-9",
    subjectId: "business",
    chapterId: "acad-class-9-bus-topic-4",
    chapterName: "বাজারজাতকরণ",
    unitNumber: 5,
    topicId: "topic-4",
    questionText: "বাজারজাতকরণের ৪P-তে কী কী আছে?",
    options: [
      { letter: "A", text: "পণ্য, মূল্য, স্থান, প্রচার" },
      { letter: "B", text: "পণ্য, মুনাফা, ঋণ, কর" },
      { letter: "C", text: "উৎপাদন, গুদাম, ব্যাংক, বিমা" },
      { letter: "D", text: "ক্রয়, বিক্রয়, মজুদ, পরিবহন" }
    ],
    correctLetter: "A",
    explanation: "৪P: Product, Price, Place, Promotion — পণ্য, মূল্য, স্থান ও প্রচার।",
    difficulty: "medium",
    sourceNote: "NCTB ব্যবসায় উদ্যোগ — বাজারজাতকরণ",
  },
  {
    id: "ACAD-6066",
    classId: "class-9",
    subjectId: "business",
    chapterId: "acad-class-9-bus-topic-5",
    chapterName: "ব্যবসায় পরিকল্পনা",
    unitNumber: 6,
    topicId: "topic-5",
    questionText: "ব্যবসায় পরিকল্পনায় প্রথমে কী ঠিক করতে হয়?",
    options: [
      { letter: "A", text: "শুধু লোগো" },
      { letter: "B", text: "শুধু দোকানের নাম" },
      { letter: "C", text: "শুধু কর্মী" },
      { letter: "D", text: "লক্ষ্য ও পণ্য" }
    ],
    correctLetter: "D",
    explanation: "কী পণ্য/সেবা, কাদের কাছে বিক্রি হবে ও লক্ষ্য কী — এটাই পরিকল্পনার শুরু।",
    difficulty: "medium",
    sourceNote: "NCTB ব্যবসায় উদ্যোগ — ব্যবসায় পরিকল্পনা",
  },
  {
    id: "ACAD-6067",
    classId: "class-9",
    subjectId: "business",
    chapterId: "acad-class-9-bus-topic-6",
    chapterName: "মুনাফা",
    unitNumber: 7,
    topicId: "topic-6",
    questionText: "ক্রয়মূল্য ১০০ টাকা, বিক্রয়মূল্য ১২০ টাকা হলে মুনাফার হার কত?",
    options: [
      { letter: "A", text: "১২%" },
      { letter: "B", text: "২৫%" },
      { letter: "C", text: "২০%" },
      { letter: "D", text: "১০%" }
    ],
    correctLetter: "C",
    explanation: "মুনাফা ২০ টাকা; ক্রয়মূল্যের ওপর হার ২০/১০০ = ২০%।",
    difficulty: "medium",
    sourceNote: "NCTB ব্যবসায় উদ্যোগ — মুনাফা",
  },
  {
    id: "ACAD-6068",
    classId: "class-9",
    subjectId: "business",
    chapterId: "acad-class-9-bus-topic-7",
    chapterName: "সমবায়",
    unitNumber: 8,
    topicId: "topic-7",
    questionText: "সমবায়ে সিদ্ধান্ত নেওয়া হয় কীভাবে?",
    options: [
      { letter: "A", text: "সরকারের নির্দেশে" },
      { letter: "B", text: "মূলধনের অনুপাতে" },
      { letter: "C", text: "সদস্যদের ভোটে" },
      { letter: "D", text: "শুধু সভাপতির কথায়" }
    ],
    correctLetter: "C",
    explanation: "সমবায়ে এক সদস্য এক ভোট নীতিতে গণতান্ত্রিকভাবে সিদ্ধান্ত হয়।",
    difficulty: "medium",
    sourceNote: "NCTB ব্যবসায় উদ্যোগ — সমবায়",
  },
  {
    id: "ACAD-6069",
    classId: "class-9",
    subjectId: "business",
    chapterId: "acad-class-9-bus-topic-11",
    chapterName: "ক্রেতা",
    unitNumber: 12,
    topicId: "topic-11",
    questionText: "ব্যবসায়ের সফলতার মূল চাবিকাঠি কী?",
    options: [
      { letter: "A", text: "শুধু বিজ্ঞাপন" },
      { letter: "B", text: "সন্তুষ্ট ক্রেতা" },
      { letter: "C", text: "শুধু কম দাম" },
      { letter: "D", text: "শুধু বড় দোকান" }
    ],
    correctLetter: "B",
    explanation: "সন্তুষ্ট ক্রেতাই বারবার আসে ও অন্যকে জানায় — এটাই ব্যবসার ভিত্তি।",
    difficulty: "easy",
    sourceNote: "NCTB ব্যবসায় উদ্যোগ — ক্রেতা সন্তুষ্টি",
  },
  {
    id: "ACAD-6070",
    classId: "class-9",
    subjectId: "business",
    chapterId: "acad-class-9-bus-topic-12",
    chapterName: "অনলাইন ব্যবসা",
    unitNumber: 13,
    topicId: "topic-12",
    questionText: "অনলাইন ব্যবসায় ক্রেতার আস্থা বাড়ে কীভাবে?",
    options: [
      { letter: "A", text: "শুধু কম দামে" },
      { letter: "B", text: "সঠিক পণ্য ও সময়মতো ডেলিভারি" },
      { letter: "C", text: "শুধু বিজ্ঞাপনে" },
      { letter: "D", text: "শুধু ছবি দিয়ে" }
    ],
    correctLetter: "B",
    explanation: "সঠিক পণ্য, স্বচ্ছ দাম ও সময়মতো ডেলিভারিতেই অনলাইন ক্রেতার আস্থা তৈরি হয়।",
    difficulty: "medium",
    sourceNote: "NCTB ব্যবসায় উদ্যোগ — অনলাইন ব্যবসা",
  },
  {
    id: "ACAD-6071",
    classId: "class-9",
    subjectId: "business",
    chapterId: "acad-class-9-bus-topic-13",
    chapterName: "মূলধন",
    unitNumber: 14,
    topicId: "topic-13",
    questionText: "ব্যবসায়ের মূলধনের উৎস কোনটি?",
    options: [
      { letter: "A", text: "শুধু সরকারি ভাতা" },
      { letter: "B", text: "নিজের সঞ্চয় ও ব্যাংক ঋণ" },
      { letter: "C", text: "শুধু বন্ধুর টাকা" },
      { letter: "D", text: "শুধু দান" }
    ],
    correctLetter: "B",
    explanation: "নিজের সঞ্চয়, আত্মীয়ের সহায়তা ও ব্যাংক ঋণ মূলধনের প্রধান উৎস।",
    difficulty: "medium",
    sourceNote: "NCTB ব্যবসায় উদ্যোগ — মূলধন",
  },
  {
    id: "ACAD-6072",
    classId: "class-9",
    subjectId: "business",
    chapterId: "acad-class-9-bus-topic-14",
    chapterName: "হিসাব",
    unitNumber: 15,
    topicId: "topic-14",
    questionText: "ব্যবসায়ে প্রতিদিনের আয়-ব্যয় লেখা কেন জরুরি?",
    options: [
      { letter: "A", text: "কোনো দরকার নেই" },
      { letter: "B", text: "শুধু কর দিতে" },
      { letter: "C", text: "মুনাফা-ক্ষতি জানা যায়" },
      { letter: "D", text: "শুধু দেখাতে" }
    ],
    correctLetter: "C",
    explanation: "হিসাব রাখলে মুনাফা-ক্ষতি, বাকি ও নগদ অবস্থা স্পষ্ট থাকে।",
    difficulty: "easy",
    sourceNote: "NCTB ব্যবসায় উদ্যোগ — হিসাব রাখা",
  },
];
