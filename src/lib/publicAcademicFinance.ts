// Eduvelto — Academic Finance and Banking practice questions (Classes 9 and 11),
// verified against the NCTB books (review 26 Nov 2026; see the Class 9 / Class 11 notes below).
//
// Static data ONLY — zero Firestore reads. The 44 questions are the
// Academic Class 9 and Class 11 Finance and Banking drafts AFTER review (see
// review-academic-c9-business-finance-verdicts.json,
// review-academic-c9-fixes-applied.md,
// review-academic-c11-12-finance-verdicts.json and
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
// to PUBLIC_ACADEMIC_FINANCE_QUESTIONS below (same shape, same generation
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

/** All verified Academic Finance and Banking questions, Classes 9 and 11 (in draft order). */
export const PUBLIC_ACADEMIC_FINANCE_QUESTIONS: PublicAcademicQuestion[] = [
  {
    id: "ACAD-1041",
    classId: "class-9",
    subjectId: "finance",
    chapterId: "acad-class-9-fin-chapter-1",
    chapterName: "অধ্যায় ১: অর্থায়নের ধারণা",
    unitNumber: 1,
    topicId: "chapter-1",
    questionText: "অর্থায়ন বলতে কী বোঝায়?",
    options: [
      { letter: "A", text: "শুধু ঋণ নেওয়া" },
      { letter: "B", text: "শুধু সঞ্চয় করা" },
      { letter: "C", text: "শুধু কর দেওয়া" },
      { letter: "D", text: "অর্থ সংগ্রহ ও ব্যবহারের পরিকল্পনা" }
    ],
    correctLetter: "D",
    explanation: "অর্থায়ন হলো প্রয়োজনীয় অর্থ সংগ্রহ করে সঠিকভাবে ব্যবহারের পরিকল্পনা ও ব্যবস্থাপনা।",
    difficulty: "easy",
    sourceNote: "NCTB ফিন্যান্স ও ব্যাংকিং, নবম-দশম শ্রেণি — অধ্যায় ১: অর্থায়নের ধারণা",
  },
  {
    id: "ACAD-1042",
    classId: "class-9",
    subjectId: "finance",
    chapterId: "acad-class-9-fin-chapter-3",
    chapterName: "অধ্যায় ৩: অর্থের সময়মূল্য",
    unitNumber: 3,
    topicId: "chapter-3",
    questionText: "আজকের ১০০ টাকা এক বছর পরের ১০০ টাকার চেয়ে বেশি মূল্যবান কেন?",
    options: [
      { letter: "A", text: "মুদ্রাস্ফীতি নেই বলে" },
      { letter: "B", text: "টাকার রং বদলায়" },
      { letter: "C", text: "সুদের কারণে অর্থের সময়মূল্য আছে" },
      { letter: "D", text: "ব্যাংক বন্ধ থাকে বলে" }
    ],
    correctLetter: "C",
    explanation: "অর্থের সময়মূল্য থাকায় আজকের টাকা বিনিয়োগ করে সুদ পাওয়া যায়; তাই আজকের ১০০ টাকা বেশি মূল্যবান।",
    difficulty: "medium",
    sourceNote: "NCTB ফিন্যান্স ও ব্যাংকিং, নবম-দশম শ্রেণি — অধ্যায় ৩: অর্থের সময়মূল্য",
  },
  {
    id: "ACAD-1043",
    classId: "class-9",
    subjectId: "finance",
    chapterId: "acad-class-9-fin-topic-1",
    chapterName: "সরল সুদ",
    unitNumber: 4,
    topicId: "topic-1",
    questionText: "১০০০ টাকায় ১০% সরল সুদে ২ বছরের সুদ কত?",
    options: [
      { letter: "A", text: "১১০০ টাকা" },
      { letter: "B", text: "১০০ টাকা" },
      { letter: "C", text: "২০০ টাকা" },
      { letter: "D", text: "৪০০ টাকা" }
    ],
    correctLetter: "C",
    explanation: "সরল সুদ = P×r×t = ১০০০×১০%×২ = ২০০ টাকা।",
    difficulty: "medium",
    sourceNote: "NCTB ফিন্যান্স ও ব্যাংকিং, নবম-দশম শ্রেণি — সুদ অধ্যায়",
  },
  {
    id: "ACAD-1044",
    classId: "class-9",
    subjectId: "finance",
    chapterId: "acad-class-9-fin-topic-2",
    chapterName: "ব্যাংক",
    unitNumber: 5,
    topicId: "topic-2",
    questionText: "প্রধান কার্যালয়সহ বাংলাদেশ ব্যাংকের মোট কার্যালয় কয়টি?",
    options: [
      { letter: "A", text: "৯টি" },
      { letter: "B", text: "১০টি" },
      { letter: "C", text: "৮টি" },
      { letter: "D", text: "১২টি" }
    ],
    correctLetter: "B",
    explanation: "বাংলাদেশ ব্যাংকের প্রধান কার্যালয়সহ মোট ১০টি কার্যালয় রয়েছে।",
    difficulty: "easy",
    sourceNote: "NCTB ফিন্যান্স ও ব্যাংকিং, নবম-দশম শ্রেণি — ব্যাংক অধ্যায়",
  },
  {
    id: "ACAD-1045",
    classId: "class-9",
    subjectId: "finance",
    chapterId: "acad-class-9-fin-topic-3",
    chapterName: "ব্যাংক হিসাব",
    unitNumber: 6,
    topicId: "topic-3",
    questionText: "নিয়মিত লেনদেনের জন্য সাধারণত কোন হিসাব খোলা হয়?",
    options: [
      { letter: "A", text: "স্থায়ী আমানত" },
      { letter: "B", text: "চলতি হিসাব" },
      { letter: "C", text: "সঞ্চয়ী হিসাব" },
      { letter: "D", text: "ঋণ হিসাব" }
    ],
    correctLetter: "B",
    explanation: "চলতি হিসাবে দিনে একাধিকবার জমা-উত্তোলন করা যায়, তাই ব্যবসায়িক লেনদেনে এটি ব্যবহৃত হয়।",
    difficulty: "easy",
    sourceNote: "NCTB ফিন্যান্স ও ব্যাংকিং, নবম-দশম শ্রেণি — ব্যাংক হিসাব",
  },
  {
    id: "ACAD-1046",
    classId: "class-9",
    subjectId: "finance",
    chapterId: "acad-class-9-fin-topic-4",
    chapterName: "শেয়ার",
    unitNumber: 7,
    topicId: "topic-4",
    questionText: "শেয়ারহোল্ডার কে?",
    options: [
      { letter: "A", text: "কোম্পানির মালিকানার অংশীদার" },
      { letter: "B", text: "কোম্পানির কর্মচারী" },
      { letter: "C", text: "কোম্পানির গ্রাহক" },
      { letter: "D", text: "কোম্পানির ঋণদাতা" }
    ],
    correctLetter: "A",
    explanation: "শেয়ার কিনে ব্যক্তি কোম্পানির আংশিক মালিক হন; তিনিই শেয়ারহোল্ডার।",
    difficulty: "medium",
    sourceNote: "NCTB ফিন্যান্স ও ব্যাংকিং, নবম-দশম শ্রেণি — শেয়ার বাজার",
  },
  {
    id: "ACAD-1047",
    classId: "class-9",
    subjectId: "finance",
    chapterId: "acad-class-9-fin-topic-5",
    chapterName: "বিমা",
    unitNumber: 8,
    topicId: "topic-5",
    questionText: "বিমার মূল উদ্দেশ্য কী?",
    options: [
      { letter: "A", text: "ঋণ দেওয়া" },
      { letter: "B", text: "মুনাফা নিশ্চিত করা" },
      { letter: "C", text: "কর ফাঁকি দেওয়া" },
      { letter: "D", text: "ঝুঁকি থেকে আর্থিক সুরক্ষা" }
    ],
    correctLetter: "D",
    explanation: "বিমা অনিশ্চিত ক্ষতির ঝুঁকি ভাগ করে আর্থিক সুরক্ষা দেয়।",
    difficulty: "easy",
    sourceNote: "NCTB ফিন্যান্স ও ব্যাংকিং, নবম-দশম শ্রেণি — বিমা অধ্যায়",
  },
  {
    id: "ACAD-1048",
    classId: "class-9",
    subjectId: "finance",
    chapterId: "acad-class-9-fin-topic-6",
    chapterName: "মূলধন বাজেট",
    unitNumber: 9,
    topicId: "topic-6",
    questionText: "দীর্ঘমেয়াদি বিনিয়োগ সিদ্ধান্তকে কী বলে?",
    options: [
      { letter: "A", text: "নগদ বাজেট" },
      { letter: "B", text: "মূলধন বাজেটিং" },
      { letter: "C", text: "চলতি মূলধন" },
      { letter: "D", text: "বিক্রয় বাজেট" }
    ],
    correctLetter: "B",
    explanation: "স্থায়ী সম্পদে দীর্ঘমেয়াদি বিনিয়োগের সিদ্ধান্তই মূলধন বাজেটিং।",
    difficulty: "hard",
    sourceNote: "NCTB ফিন্যান্স ও ব্যাংকিং, নবম-দশম শ্রেণি — মূলধন বাজেট",
  },
  {
    id: "ACAD-1049",
    classId: "class-9",
    subjectId: "finance",
    chapterId: "acad-class-9-fin-topic-7",
    chapterName: "চেক",
    unitNumber: 10,
    topicId: "topic-7",
    questionText: "চেকের মাধ্যমে টাকা তোলার জন্য কী লাগে?",
    options: [
      { letter: "A", text: "শুধু মোবাইল" },
      { letter: "B", text: "শুধু পাসবই" },
      { letter: "C", text: "ব্যাংক হিসাব ও স্বাক্ষরিত চেক" },
      { letter: "D", text: "শুধু জাতীয় পরিচয়পত্র" }
    ],
    correctLetter: "C",
    explanation: "চেক হলো ব্যাংককে দেওয়া লিখিত নির্দেশ; হিসাবধারীর স্বাক্ষরসহ চেক জমা দিলে টাকা তোলা যায়।",
    difficulty: "easy",
    sourceNote: "NCTB ফিন্যান্স ও ব্যাংকিং, নবম-দশম শ্রেণি — ব্যাংকিং লেনদেন",
  },
  {
    id: "ACAD-1050",
    classId: "class-9",
    subjectId: "finance",
    chapterId: "acad-class-9-fin-topic-8",
    chapterName: "মুদ্রাস্ফীতি",
    unitNumber: 11,
    topicId: "topic-8",
    questionText: "মুদ্রাস্ফীতি হলে টাকার ক্রয়ক্ষমতা —",
    options: [
      { letter: "A", text: "বাড়ে" },
      { letter: "B", text: "শূন্য হয়" },
      { letter: "C", text: "একই থাকে" },
      { letter: "D", text: "কমে" }
    ],
    correctLetter: "D",
    explanation: "মূল্যস্তর বাড়লে একই টাকায় কম পণ্য কেনা যায়, অর্থাৎ ক্রয়ক্ষমতা কমে।",
    difficulty: "medium",
    sourceNote: "NCTB ফিন্যান্স ও ব্যাংকিং, নবম-দশম শ্রেণি — মুদ্রা ও মুদ্রাস্ফীতি",
  },
  {
    id: "ACAD-6049",
    classId: "class-9",
    subjectId: "finance",
    chapterId: "acad-class-9-fin-topic-9",
    chapterName: "অর্থায়ন",
    unitNumber: 12,
    topicId: "topic-9",
    questionText: "ব্যক্তিগত অর্থায়নে প্রথম ধাপ কী?",
    options: [
      { letter: "A", text: "আয়-ব্যয়ের হিসাব রাখা" },
      { letter: "B", text: "বিমা করা" },
      { letter: "C", text: "ঋণ নেওয়া" },
      { letter: "D", text: "শেয়ার কেনা" }
    ],
    correctLetter: "A",
    explanation: "আয়-ব্যয়ের হিসাব রাখলেই সঞ্চয় ও বিনিয়োগের পরিকল্পনা করা যায়।",
    difficulty: "medium",
    sourceNote: "NCTB ফিন্যান্স ও ব্যাংকিং — ব্যক্তিগত অর্থায়ন",
  },
  {
    id: "ACAD-6050",
    classId: "class-9",
    subjectId: "finance",
    chapterId: "acad-class-9-fin-topic-10",
    chapterName: "অর্থের সময়মূল্য",
    unitNumber: 13,
    topicId: "topic-10",
    questionText: "চক্রবৃদ্ধি সুদে সুদ কিসের ওপর ধরা হয়?",
    options: [
      { letter: "A", text: "শুধু আসলের ওপর" },
      { letter: "B", text: "শুধু মুনাফার ওপর" },
      { letter: "C", text: "আসল ও আগের সুদের ওপর" },
      { letter: "D", text: "কোনোটির ওপর নয়" }
    ],
    correctLetter: "C",
    explanation: "চক্রবৃদ্ধিতে প্রতি মেয়াদে আসল + আগের সুদের ওপর সুদ ধরা হয়।",
    difficulty: "medium",
    sourceNote: "NCTB ফিন্যান্স ও ব্যাংকিং — অর্থের সময়মূল্য",
  },
  {
    id: "ACAD-6051",
    classId: "class-9",
    subjectId: "finance",
    chapterId: "acad-class-9-fin-topic-11",
    chapterName: "চক্রবৃদ্ধি সুদ",
    unitNumber: 14,
    topicId: "topic-11",
    questionText: "১০০০ টাকায় ১০% চক্রবৃদ্ধি সুদে ২ বছরে সুদ-আসল কত?",
    options: [
      { letter: "A", text: "১২০০ টাকা" },
      { letter: "B", text: "১৩০০ টাকা" },
      { letter: "C", text: "১১০০ টাকা" },
      { letter: "D", text: "১২১০ টাকা" }
    ],
    correctLetter: "D",
    explanation: "সুদ-আসল = ১০০০ × (১.১)² = ১২১০ টাকা।",
    difficulty: "medium",
    sourceNote: "NCTB ফিন্যান্স ও ব্যাংকিং — সুদ",
  },
  {
    id: "ACAD-6052",
    classId: "class-9",
    subjectId: "finance",
    chapterId: "acad-class-9-fin-topic-2",
    chapterName: "ব্যাংক",
    unitNumber: 5,
    topicId: "topic-2",
    questionText: "বাংলাদেশ ব্যাংকের প্রধান কাজ কী?",
    options: [
      { letter: "A", text: "মুদ্রানীতি পরিচালনা" },
      { letter: "B", text: "শুধু হিসাব খোলা" },
      { letter: "C", text: "শুধু চেক দেওয়া" },
      { letter: "D", text: "শুধু ঋণ দেওয়া" }
    ],
    correctLetter: "A",
    explanation: "কেন্দ্রীয় ব্যাংক হিসেবে বাংলাদেশ ব্যাংক মুদ্রানীতি পরিচালনা ও ব্যাংকগুলো তদারকি করে।",
    difficulty: "medium",
    sourceNote: "NCTB ফিন্যান্স ও ব্যাংকিং — ব্যাংক",
  },
  {
    id: "ACAD-6053",
    classId: "class-9",
    subjectId: "finance",
    chapterId: "acad-class-9-fin-topic-3",
    chapterName: "ব্যাংক হিসাব",
    unitNumber: 6,
    topicId: "topic-3",
    questionText: "সঞ্চয়ী হিসাবে সুদ দেওয়া হয় কেন?",
    options: [
      { letter: "A", text: "শুধু নিয়ম বলে" },
      { letter: "B", text: "কর হিসেবে" },
      { letter: "C", text: "আমানতের ওপর আয় হিসেবে" },
      { letter: "D", text: "জরিমানা হিসেবে" }
    ],
    correctLetter: "C",
    explanation: "ব্যাংক আমানত ব্যবহার করে আয় করে বলে আমানতকারীকে সুদ দেয়।",
    difficulty: "medium",
    sourceNote: "NCTB ফিন্যান্স ও ব্যাংকিং — ব্যাংক হিসাব",
  },
  {
    id: "ACAD-6054",
    classId: "class-9",
    subjectId: "finance",
    chapterId: "acad-class-9-fin-topic-4",
    chapterName: "শেয়ার",
    unitNumber: 7,
    topicId: "topic-4",
    questionText: "লভ্যাংশ কাকে বলে?",
    options: [
      { letter: "A", text: "শেয়ারহোল্ডারকে দেওয়া মুনাফার অংশ" },
      { letter: "B", text: "শেয়ারের দাম" },
      { letter: "C", text: "কর" },
      { letter: "D", text: "কোম্পানির ঋণ" }
    ],
    correctLetter: "A",
    explanation: "কোম্পানি মুনাফার একটি অংশ শেয়ারহোল্ডারদের লভ্যাংশ হিসেবে দেয়।",
    difficulty: "medium",
    sourceNote: "NCTB ফিন্যান্স ও ব্যাংকিং — শেয়ার বাজার",
  },
  {
    id: "ACAD-6055",
    classId: "class-9",
    subjectId: "finance",
    chapterId: "acad-class-9-fin-topic-5",
    chapterName: "বিমা",
    unitNumber: 8,
    topicId: "topic-5",
    questionText: "প্রিমিয়াম কী?",
    options: [
      { letter: "A", text: "বিমার কর" },
      { letter: "B", text: "বিমার ক্ষতিপূরণ" },
      { letter: "C", text: "বিমার মুনাফা" },
      { letter: "D", text: "বিমার জন্য দেওয়া কিস্তি" }
    ],
    correctLetter: "D",
    explanation: "বিমাগ্রহীতা নিয়মিত প্রিমিয়াম দেয়; ক্ষতি হলে বিমাকারী ক্ষতিপূরণ দেয়।",
    difficulty: "medium",
    sourceNote: "NCTB ফিন্যান্স ও ব্যাংকিং — বিমা",
  },
  {
    id: "ACAD-6056",
    classId: "class-9",
    subjectId: "finance",
    chapterId: "acad-class-9-fin-topic-12",
    chapterName: "মোবাইল ব্যাংকিং",
    unitNumber: 15,
    topicId: "topic-12",
    questionText: "বিকাশ কী ধরনের সেবা?",
    options: [
      { letter: "A", text: "শুধু শেয়ার বাজার" },
      { letter: "B", text: "মোবাইল ব্যাংকিং" },
      { letter: "C", text: "শুধু বিমা" },
      { letter: "D", text: "শুধু ব্যাংক" }
    ],
    correctLetter: "B",
    explanation: "বিকাশ মোবাইল ফোনে টাকা পাঠানো ও লেনদেনের সেবা।",
    difficulty: "easy",
    sourceNote: "NCTB ফিন্যান্স ও ব্যাংকিং — আধুনিক ব্যাংকিং",
  },
  {
    id: "ACAD-6057",
    classId: "class-9",
    subjectId: "finance",
    chapterId: "acad-class-9-fin-topic-13",
    chapterName: "ঋণ",
    unitNumber: 16,
    topicId: "topic-13",
    questionText: "ঋণ নেওয়ার আগে কী যাচাই করা উচিত?",
    options: [
      { letter: "A", text: "কিছুই নয়" },
      { letter: "B", text: "শুধু মেয়াদ" },
      { letter: "C", text: "পরিশোধের সামর্থ্য" },
      { letter: "D", text: "শুধু সুদের হার" }
    ],
    correctLetter: "C",
    explanation: "পরিশোধের সামর্থ্য না থাকলে ঋণ বোঝা হয়ে যায়।",
    difficulty: "medium",
    sourceNote: "NCTB ফিন্যান্স ও ব্যাংকিং — ঋণ",
  },
  {
    id: "ACAD-6058",
    classId: "class-9",
    subjectId: "finance",
    chapterId: "acad-class-9-fin-topic-14",
    chapterName: "সঞ্চয়",
    unitNumber: 17,
    topicId: "topic-14",
    questionText: "সঞ্চয়ের মূল উদ্দেশ্য কী?",
    options: [
      { letter: "A", text: "ভবিষ্যতের প্রয়োজনে অর্থ রাখা" },
      { letter: "B", text: "শুধু কর কমানো" },
      { letter: "C", text: "শুধু সুদ পাওয়া" },
      { letter: "D", text: "শুধু ব্যাংক হিসাব খোলা" }
    ],
    correctLetter: "A",
    explanation: "সঞ্চয় ভবিষ্যতের জরুরি প্রয়োজন ও লক্ষ্য পূরণে কাজে লাগে।",
    difficulty: "easy",
    sourceNote: "NCTB ফিন্যান্স ও ব্যাংকিং — সঞ্চয়",
  },
  {
    id: "ACAD-6059",
    classId: "class-9",
    subjectId: "finance",
    chapterId: "acad-class-9-fin-topic-8",
    chapterName: "মুদ্রাস্ফীতি",
    unitNumber: 11,
    topicId: "topic-8",
    questionText: "মুদ্রাস্ফীতির সময় সঞ্চয়ের প্রকৃত মূল্য —",
    options: [
      { letter: "A", text: "কমে" },
      { letter: "B", text: "একই থাকে" },
      { letter: "C", text: "বাড়ে" },
      { letter: "D", text: "শূন্য হয়" }
    ],
    correctLetter: "A",
    explanation: "দাম বাড়লে সঞ্চিত টাকার ক্রয়ক্ষমতা কমে যায়।",
    difficulty: "medium",
    sourceNote: "NCTB ফিন্যান্স ও ব্যাংকিং — মুদ্রাস্ফীতি",
  },
  {
    id: "ACAD-6060",
    classId: "class-9",
    subjectId: "finance",
    chapterId: "acad-class-9-fin-topic-15",
    chapterName: "বাজেট",
    unitNumber: 18,
    topicId: "topic-15",
    questionText: "পারিবারিক বাজেটের উদ্দেশ্য কী?",
    options: [
      { letter: "A", text: "শুধু সঞ্চয় করা" },
      { letter: "B", text: "শুধু আয় বাড়ানো" },
      { letter: "C", text: "শুধু ঋণ নেওয়া" },
      { letter: "D", text: "আয় অনুযায়ী ব্যয় নিয়ন্ত্রণ" }
    ],
    correctLetter: "D",
    explanation: "বাজেটে আয়-ব্যয়ের পরিকল্পনা করে অপ্রয়োজনীয় খরচ কমানো যায়।",
    difficulty: "medium",
    sourceNote: "NCTB ফিন্যান্স ও ব্যাংকিং — বাজেট",
  },
  {
    id: "ACAD-3001",
    classId: "class-11",
    subjectId: "finance",
    chapterId: "acad-class-11-fin-topic-1",
    chapterName: "অর্থায়ন",
    unitNumber: 1,
    topicId: "topic-1",
    questionText: "ব্যবসায়ের অর্থায়নের মূল লক্ষ্য কী?",
    options: [
      { letter: "A", text: "শুধু কর কমানো" },
      { letter: "B", text: "সম্পদ সর্বোচ্চকরণ" },
      { letter: "C", text: "কর্মী ছাঁটাই" },
      { letter: "D", text: "শুধু ঋণ নেওয়া" }
    ],
    correctLetter: "B",
    explanation: "আধুনিক অর্থায়নের লক্ষ্য শেয়ারহোল্ডারদের সম্পদ সর্বোচ্চকরণ।",
    difficulty: "easy",
    sourceNote: "NCTB HSC ফিন্যান্স ১ম পত্র — অর্থায়নের ধারণা",
  },
  {
    id: "ACAD-3002",
    classId: "class-11",
    subjectId: "finance",
    chapterId: "acad-class-11-fin-topic-2",
    chapterName: "ঝুঁকি ও আয়",
    unitNumber: 2,
    topicId: "topic-2",
    questionText: "ঝুঁকি বাড়লে প্রত্যাশিত আয় সাধারণত —",
    options: [
      { letter: "A", text: "বাড়ে" },
      { letter: "B", text: "একই থাকে" },
      { letter: "C", text: "কমে" },
      { letter: "D", text: "শূন্য হয়" }
    ],
    correctLetter: "A",
    explanation: "ঝুঁকি ও আয়ের মধ্যে ধনাত্মক সম্পর্ক: বেশি ঝুঁকিতে বেশি আয় প্রত্যাশিত।",
    difficulty: "medium",
    sourceNote: "NCTB HSC ফিন্যান্স ১ম পত্র — ঝুঁকি ও আয়",
  },
  {
    id: "ACAD-3003",
    classId: "class-11",
    subjectId: "finance",
    chapterId: "acad-class-11-fin-topic-3",
    chapterName: "মূলধন ব্যয়",
    unitNumber: 3,
    topicId: "topic-3",
    questionText: "WACC কী?",
    options: [
      { letter: "A", text: "ঋণের ব্যয় শুধু" },
      { letter: "B", text: "শেয়ারের ব্যয় শুধু" },
      { letter: "C", text: "ভারযুক্ত গড় মূলধন ব্যয়" },
      { letter: "D", text: "মোট মূলধন ব্যয়" }
    ],
    correctLetter: "C",
    explanation: "WACC = Weighted Average Cost of Capital — সব উৎসের ভারযুক্ত গড় ব্যয়।",
    difficulty: "hard",
    sourceNote: "NCTB HSC ফিন্যান্স ১ম পত্র, ৭ম অধ্যায় — মূলধন ব্যয়",
  },
  {
    id: "ACAD-3004",
    classId: "class-11",
    subjectId: "finance",
    chapterId: "acad-class-11-fin-topic-4",
    chapterName: "ব্যাংক",
    unitNumber: 4,
    topicId: "topic-4",
    questionText: "বাণিজ্যিক ব্যাংকের প্রধান কাজ কী?",
    options: [
      { letter: "A", text: "বাজেট তৈরি" },
      { letter: "B", text: "কর আদায়" },
      { letter: "C", text: "নোট ছাপানো" },
      { letter: "D", text: "আমানত গ্রহণ ও ঋণদান" }
    ],
    correctLetter: "D",
    explanation: "বাণিজ্যিক ব্যাংক আমানত নিয়ে ঋণ দেয়; নোট ছাপায় কেন্দ্রীয় ব্যাংক।",
    difficulty: "easy",
    sourceNote: "NCTB HSC ফিন্যান্স ২য় পত্র — ব্যাংক ব্যবস্থা (বাণিজ্যিক ব্যাংক)",
  },
  {
    id: "ACAD-3005",
    classId: "class-11",
    subjectId: "finance",
    chapterId: "acad-class-11-fin-topic-5",
    chapterName: "বিমা",
    unitNumber: 5,
    topicId: "topic-5",
    questionText: "জীবন বিমায় বিমাকারী কে?",
    options: [
      { letter: "A", text: "সরকার" },
      { letter: "B", text: "যে বিমা করে" },
      { letter: "C", text: "যে প্রতিষ্ঠান ঝুঁকি নেয়" },
      { letter: "D", text: "এজেন্ট" }
    ],
    correctLetter: "C",
    explanation: "বিমাকারী (insurer) ঝুঁকি গ্রহণ করে; বিমাগ্রহীতা (insured) প্রিমিয়াম দেয়।",
    difficulty: "medium",
    sourceNote: "NCTB HSC ফিন্যান্স ২য় পত্র — বিমা",
  },
  {
    id: "ACAD-3006",
    classId: "class-11",
    subjectId: "finance",
    chapterId: "acad-class-11-fin-topic-6",
    chapterName: "শেয়ার বাজার",
    unitNumber: 6,
    topicId: "topic-6",
    questionText: "বাংলাদেশের প্রধান শেয়ার বাজার কোনটি?",
    options: [
      { letter: "A", text: "বাংলাদেশ ব্যাংক" },
      { letter: "B", text: "ঢাকা স্টক এক্সচেঞ্জ" },
      { letter: "C", text: "চট্টগ্রাম বন্দর" },
      { letter: "D", text: "বিমা উন্নয়ন কর্তৃপক্ষ" }
    ],
    correctLetter: "B",
    explanation: "ঢাকা স্টক এক্সচেঞ্জ (DSE) দেশের প্রধান শেয়ার বাজার।",
    difficulty: "medium",
    sourceNote: "NCTB HSC ফিন্যান্স ১ম পত্র, ২য় অধ্যায় — আর্থিক বাজার (মূলধন বাজার / শেয়ার বাজার)",
  },
  {
    id: "ACAD-3007",
    classId: "class-11",
    subjectId: "finance",
    chapterId: "acad-class-11-fin-topic-7",
    chapterName: "অর্থের সময়মূল্য",
    unitNumber: 7,
    topicId: "topic-7",
    questionText: "ভবিষ্যৎ মূল্য নির্ণয়ের সূত্র কোনটি?",
    options: [
      { letter: "A", text: "FV = PV + r" },
      { letter: "B", text: "FV = PV(1−r)ⁿ" },
      { letter: "C", text: "FV = PV × n" },
      { letter: "D", text: "FV = PV(1+r)ⁿ" }
    ],
    correctLetter: "D",
    explanation: "চক্রবৃদ্ধিতে FV = PV(1+r)ⁿ।",
    difficulty: "medium",
    sourceNote: "NCTB HSC ফিন্যান্স ১ম পত্র — অর্থের সময়মূল্য",
  },
  {
    id: "ACAD-3008",
    classId: "class-11",
    subjectId: "finance",
    chapterId: "acad-class-11-fin-topic-8",
    chapterName: "মূলধন বাজেট",
    unitNumber: 8,
    topicId: "topic-8",
    questionText: "NPV ধনাত্মক হলে প্রকল্প —",
    options: [
      { letter: "A", text: "ক্ষতিকর" },
      { letter: "B", text: "গ্রহণযোগ্য" },
      { letter: "C", text: "বর্জনীয়" },
      { letter: "D", text: "অনিশ্চিত" }
    ],
    correctLetter: "B",
    explanation: "NPV > 0 মানে প্রকল্প মূল্য যোগ করে, তাই গ্রহণযোগ্য।",
    difficulty: "medium",
    sourceNote: "NCTB HSC ফিন্যান্স ১ম পত্র, ৮ম অধ্যায় — মূলধন বাজেটিং",
  },
  {
    id: "ACAD-3009",
    classId: "class-11",
    subjectId: "finance",
    chapterId: "acad-class-11-fin-topic-9",
    chapterName: "চলতি মূলধন",
    unitNumber: 9,
    topicId: "topic-9",
    questionText: "চলতি মূলধন কী?",
    options: [
      { letter: "A", text: "স্থায়ী সম্পদ − স্থায়ী দায়" },
      { letter: "B", text: "মোট সম্পদ − মোট দায়" },
      { letter: "C", text: "মূলধন + ঋণ" },
      { letter: "D", text: "চলতি সম্পদ − চলতি দায়" }
    ],
    correctLetter: "D",
    explanation: "নিট চলতি মূলধন = চলতি সম্পদ − চলতি দায়।",
    difficulty: "medium",
    sourceNote: "NCTB HSC ফিন্যান্স ১ম পত্র — চলতি মূলধন",
  },
  {
    id: "ACAD-3010",
    classId: "class-11",
    subjectId: "finance",
    chapterId: "acad-class-11-fin-topic-10",
    chapterName: "বৈদেশিক মুদ্রা",
    unitNumber: 10,
    topicId: "topic-10",
    questionText: "বৈদেশিক মুদ্রা বিনিময় হার কে নির্ধারণ করে?",
    options: [
      { letter: "A", text: "বাজার ও কেন্দ্রীয় ব্যাংক" },
      { letter: "B", text: "শুধু সরকার" },
      { letter: "C", text: "শুধু বাণিজ্যিক ব্যাংক" },
      { letter: "D", text: "আদালত" }
    ],
    correctLetter: "A",
    explanation: "বিনিময় হার বাজারের চাহিদা-যোগান ও কেন্দ্রীয় ব্যাংকের হস্তক্ষেপে নির্ধারিত হয়।",
    difficulty: "easy",
    sourceNote: "NCTB HSC ফিন্যান্স ২য় পত্র — বৈদেশিক মুদ্রা",
  },
  {
    id: "ACAD-7097",
    classId: "class-11",
    subjectId: "finance",
    chapterId: "acad-class-11-fin-topic-1",
    chapterName: "অর্থায়ন",
    unitNumber: 1,
    topicId: "topic-1",
    questionText: "অর্থায়নের সিদ্ধান্ত কয় ধরনের?",
    options: [
      { letter: "A", text: "২ ধরনের" },
      { letter: "B", text: "৫ ধরনের" },
      { letter: "C", text: "৩ ধরনের" },
      { letter: "D", text: "৪ ধরনের" }
    ],
    correctLetter: "C",
    explanation: "অর্থায়নের সিদ্ধান্ত ৩ ধরনের: বিনিয়োগ, অর্থসংস্থান ও লভ্যাংশ সিদ্ধান্ত।",
    difficulty: "medium",
    sourceNote: "NCTB HSC ফিন্যান্স ১ম পত্র — অর্থায়নের সিদ্ধান্ত",
  },
  {
    id: "ACAD-7098",
    classId: "class-11",
    subjectId: "finance",
    chapterId: "acad-class-11-fin-topic-2",
    chapterName: "ঝুঁকি ও আয়",
    unitNumber: 2,
    topicId: "topic-2",
    questionText: "পদ্ধতিগত ঝুঁকি কী?",
    options: [
      { letter: "A", text: "শুধু সুদের ঝুঁকি" },
      { letter: "B", text: "একটি ফার্মের নিজস্ব ঝুঁকি" },
      { letter: "C", text: "বাজারজুড়ে প্রভাব ফেলা ঝুঁকি" },
      { letter: "D", text: "শুধু ঋণের ঝুঁকি" }
    ],
    correctLetter: "C",
    explanation: "পদ্ধতিগত ঝুঁকি পুরো বাজারকে প্রভাবিত করে; বৈচিত্র্য দিয়ে তা দূর করা যায় না।",
    difficulty: "medium",
    sourceNote: "NCTB HSC ফিন্যান্স ১ম পত্র — ঝুঁকি ও আয়",
  },
  {
    id: "ACAD-7099",
    classId: "class-11",
    subjectId: "finance",
    chapterId: "acad-class-11-fin-topic-3",
    chapterName: "মূলধন ব্যয়",
    unitNumber: 3,
    topicId: "topic-3",
    questionText: "ঋণ মূলধনের ব্যয় সাধারণত শেয়ারের চেয়ে —",
    options: [
      { letter: "A", text: "সমান" },
      { letter: "B", text: "বেশি" },
      { letter: "C", text: "শূন্য" },
      { letter: "D", text: "কম" }
    ],
    correctLetter: "D",
    explanation: "ঋণে সুদ কর-বাদযোগ্য ও ঝুঁকি কম বলে ঋণ মূলধনের ব্যয় কম হয়।",
    difficulty: "medium",
    sourceNote: "NCTB HSC ফিন্যান্স ১ম পত্র, ৭ম অধ্যায় — মূলধন ব্যয়",
  },
  {
    id: "ACAD-7100",
    classId: "class-11",
    subjectId: "finance",
    chapterId: "acad-class-11-fin-topic-4",
    chapterName: "ব্যাংক",
    unitNumber: 4,
    topicId: "topic-4",
    questionText: "ব্যাংক হার কী?",
    options: [
      { letter: "A", text: "কেন্দ্রীয় ব্যাংক বাণিজ্যিক ব্যাংককে যে হারে ঋণ দেয়" },
      { letter: "B", text: "বিনিময় হার" },
      { letter: "C", text: "ঋণের সর্বোচ্চ হার" },
      { letter: "D", text: "সঞ্চয়ী হিসাবের সুদ" }
    ],
    correctLetter: "A",
    explanation: "ব্যাংক হার (bank rate) কেন্দ্রীয় ব্যাংকের ঋণদান হার।",
    difficulty: "medium",
    sourceNote: "NCTB HSC ফিন্যান্স ২য় পত্র, ২য় অধ্যায় — কেন্দ্রীয় ব্যাংক (ব্যাংক হার)",
  },
  {
    id: "ACAD-7101",
    classId: "class-11",
    subjectId: "finance",
    chapterId: "acad-class-11-fin-topic-5",
    chapterName: "বিমা",
    unitNumber: 5,
    topicId: "topic-5",
    questionText: "নৌ-বিমা কোন ধরনের বিমা?",
    options: [
      { letter: "A", text: "সাধারণ বিমা" },
      { letter: "B", text: "জীবন বিমা" },
      { letter: "C", text: "দুর্ঘটনা বিমা" },
      { letter: "D", text: "স্বাস্থ্য বিমা" }
    ],
    correctLetter: "A",
    explanation: "নৌ, অগ্নি ও মোটর বিমা সাধারণ (non-life) বিমার অন্তর্ভুক্ত।",
    difficulty: "medium",
    sourceNote: "NCTB HSC ফিন্যান্স ২য় পত্র — বিমা",
  },
  {
    id: "ACAD-7102",
    classId: "class-11",
    subjectId: "finance",
    chapterId: "acad-class-11-fin-topic-6",
    chapterName: "শেয়ার বাজার",
    unitNumber: 6,
    topicId: "topic-6",
    questionText: "প্রাথমিক বাজারে কী হয়?",
    options: [
      { letter: "A", text: "শুধু ঋণ" },
      { letter: "B", text: "নতুন শেয়ার ইস্যু" },
      { letter: "C", text: "পুরোনো শেয়ার কেনাবেচা" },
      { letter: "D", text: "শুধু বন্ড" }
    ],
    correctLetter: "B",
    explanation: "প্রাথমিক বাজারে কোম্পানি প্রথমবার শেয়ার ইস্যু করে; মাধ্যমিক বাজারে তা কেনাবেচা হয়।",
    difficulty: "medium",
    sourceNote: "NCTB HSC ফিন্যান্স ১ম পত্র, ২য় অধ্যায় — আর্থিক বাজার (প্রাথমিক বাজার)",
  },
  {
    id: "ACAD-7103",
    classId: "class-11",
    subjectId: "finance",
    chapterId: "acad-class-11-fin-topic-7",
    chapterName: "অর্থের সময়মূল্য",
    unitNumber: 7,
    topicId: "topic-7",
    questionText: "বর্তমান মূল্য নির্ণয়ে কোন হার ব্যবহৃত হয়?",
    options: [
      { letter: "A", text: "সুদের হার শুধু" },
      { letter: "B", text: "মুদ্রাস্ফীতি শুধু" },
      { letter: "C", text: "বাট্টা হার" },
      { letter: "D", text: "করের হার" }
    ],
    correctLetter: "C",
    explanation: "ভবিষ্যৎ অর্থকে বাট্টা হারে বর্তমান মূল্যে আনা হয়।",
    difficulty: "medium",
    sourceNote: "NCTB HSC ফিন্যান্স ১ম পত্র — অর্থের সময়মূল্য",
  },
  {
    id: "ACAD-7104",
    classId: "class-11",
    subjectId: "finance",
    chapterId: "acad-class-11-fin-topic-8",
    chapterName: "মূলধন বাজেট",
    unitNumber: 8,
    topicId: "topic-8",
    questionText: "পেব্যাক সময় কী?",
    options: [
      { letter: "A", text: "বিনিয়োগ ফেরত পেতে লাগা সময়" },
      { letter: "B", text: "প্রকল্পের মেয়াদ" },
      { letter: "C", text: "লভ্যাংশের সময়" },
      { letter: "D", text: "ঋণের মেয়াদ" }
    ],
    correctLetter: "A",
    explanation: "পেব্যাক সময়ে বিনিয়োগকৃত অর্থ ফেরত আসে; যত কম তত ভালো।",
    difficulty: "medium",
    sourceNote: "NCTB HSC ফিন্যান্স ১ম পত্র, ৮ম অধ্যায় — মূলধন বাজেটিং",
  },
  {
    id: "ACAD-7105",
    classId: "class-11",
    subjectId: "finance",
    chapterId: "acad-class-11-fin-topic-9",
    chapterName: "চলতি মূলধন",
    unitNumber: 9,
    topicId: "topic-9",
    questionText: "নগদ রূপান্তর চক্র কী?",
    options: [
      { letter: "A", text: "বছরের মেয়াদ" },
      { letter: "B", text: "মজুদ কেনা থেকে নগদ পাওয়া পর্যন্ত সময়" },
      { letter: "C", text: "উৎপাদনের সময়" },
      { letter: "D", text: "ঋণ পরিশোধের সময়" }
    ],
    correctLetter: "B",
    explanation: "মজুদ কেনা, বিক্রি ও নগদ আদায়ের মধ্যবর্তী সময়ই নগদ রূপান্তর চক্র।",
    difficulty: "medium",
    sourceNote: "NCTB HSC ফিন্যান্স ১ম পত্র — চলতি মূলধন",
  },
  {
    id: "ACAD-7106",
    classId: "class-11",
    subjectId: "finance",
    chapterId: "acad-class-11-fin-topic-10",
    chapterName: "বৈদেশিক মুদ্রা",
    unitNumber: 10,
    topicId: "topic-10",
    questionText: "রেমিট্যান্স বাড়লে বৈদেশিক মুদ্রার রিজার্ভ —",
    options: [
      { letter: "A", text: "বাড়ে" },
      { letter: "B", text: "কমে" },
      { letter: "C", text: "একই থাকে" },
      { letter: "D", text: "শূন্য হয়" }
    ],
    correctLetter: "A",
    explanation: "প্রবাসী আয় বাড়লে দেশের বৈদেশিক মুদ্রার রিজার্ভ বাড়ে।",
    difficulty: "medium",
    sourceNote: "NCTB HSC ফিন্যান্স ২য় পত্র — বৈদেশিক মুদ্রা",
  },
  {
    id: "ACAD-7107",
    classId: "class-11",
    subjectId: "finance",
    chapterId: "acad-class-11-fin-topic-11",
    chapterName: "লভ্যাংশ",
    unitNumber: 11,
    topicId: "topic-11",
    questionText: "লভ্যাংশ নীতি কী ঠিক করে?",
    options: [
      { letter: "A", text: "শেয়ারের দাম" },
      { letter: "B", text: "মুনাফার কতটুকু বণ্টন হবে" },
      { letter: "C", text: "করের হার" },
      { letter: "D", text: "ঋণের পরিমাণ" }
    ],
    correctLetter: "B",
    explanation: "লভ্যাংশ নীতিতে মুনাফার কত অংশ বণ্টন ও কত অংশ সঞ্চয় হবে তা ঠিক হয়।",
    difficulty: "medium",
    sourceNote: "NCTB HSC ফিন্যান্স ১ম পত্র — দীর্ঘমেয়াদি অর্থায়ন (লভ্যাংশ নীতি)",
  },
  {
    id: "ACAD-7108",
    classId: "class-11",
    subjectId: "finance",
    chapterId: "acad-class-11-fin-topic-12",
    chapterName: "আর্থিক বাজার",
    unitNumber: 12,
    topicId: "topic-12",
    questionText: "অর্থ বাজার কী?",
    options: [
      { letter: "A", text: "শুধু বৈদেশিক মুদ্রা বাজার" },
      { letter: "B", text: "দীর্ঘমেয়াদি অর্থের বাজার" },
      { letter: "C", text: "শুধু শেয়ার বাজার" },
      { letter: "D", text: "স্বল্পমেয়াদি অর্থের বাজার" }
    ],
    correctLetter: "D",
    explanation: "অর্থ বাজারে এক বছরের কম মেয়াদের অর্থ লেনদেন হয়; মূলধন বাজারে দীর্ঘমেয়াদি।",
    difficulty: "easy",
    sourceNote: "NCTB HSC ফিন্যান্স ১ম পত্র — আর্থিক বাজার",
  },
];
