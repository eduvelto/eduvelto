// Eduvelto — Academic Accounting practice questions (Classes 9 and 11),
// verified against the NCTB books (review 26 Nov 2026; see the Class 9 / Class 11 notes below).
//
// Static data ONLY — zero Firestore reads. The 44 questions are the
// Academic Class 9 and Class 11 Accounting drafts AFTER review (see
// review-academic-c9-accounting-verdicts.json,
// review-academic-c9-fixes-applied.md,
// review-academic-c11-12-accounting-verdicts.json and
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
// to PUBLIC_ACADEMIC_ACCOUNTING_QUESTIONS below (same shape, same generation
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

/** All verified Academic Accounting questions, Classes 9 and 11 (in draft order). */
export const PUBLIC_ACADEMIC_ACCOUNTING_QUESTIONS: PublicAcademicQuestion[] = [
  {
    id: "ACAD-1031",
    classId: "class-9",
    subjectId: "accounting",
    chapterId: "acad-class-9-acc-chapter-1",
    chapterName: "অধ্যায় ১: হিসাববিজ্ঞান পরিচিতি",
    unitNumber: 1,
    topicId: "chapter-1",
    questionText: "হিসাববিজ্ঞানের মূল উদ্দেশ্য কী?",
    options: [
      { letter: "A", text: "আর্থিক তথ্য সংগ্রহ, লিপিবদ্ধকরণ ও পরিবেশন" },
      { letter: "B", text: "শুধু মজুরি দেওয়া" },
      { letter: "C", text: "শুধু কর আদায়" },
      { letter: "D", text: "শুধু ব্যাংক হিসাব রাখা" }
    ],
    correctLetter: "A",
    explanation: "হিসাববিজ্ঞান আর্থিক লেনদেন লিপিবদ্ধ করে তথ্য সরবরাহ করে, যাতে সিদ্ধান্ত নেওয়া যায়।",
    difficulty: "easy",
    sourceNote: "NCTB হিসাববিজ্ঞান, নবম-দশম শ্রেণি — অধ্যায় ১: হিসাববিজ্ঞান পরিচিতি",
  },
  {
    id: "ACAD-1032",
    classId: "class-9",
    subjectId: "accounting",
    chapterId: "acad-class-9-acc-chapter-2",
    chapterName: "অধ্যায় ২: লেনদেন",
    unitNumber: 2,
    topicId: "chapter-2",
    questionText: "নগদে পণ্য ক্রয় করলে কোন হিসাব ডেবিট হয়?",
    options: [
      { letter: "A", text: "মূলধন হিসাব" },
      { letter: "B", text: "নগদান হিসাব" },
      { letter: "C", text: "বিক্রয় হিসাব" },
      { letter: "D", text: "ক্রয় হিসাব" }
    ],
    correctLetter: "D",
    explanation: "ক্রয়ে সম্পদ/ব্যয় বাড়ে বলে ক্রয় হিসাব ডেবিট ও নগদান হিসাব ক্রেডিট হয়।",
    difficulty: "easy",
    sourceNote: "NCTB হিসাববিজ্ঞান, নবম-দশম শ্রেণি — অধ্যায় ২: লেনদেন",
  },
  {
    id: "ACAD-1033",
    classId: "class-9",
    subjectId: "accounting",
    chapterId: "acad-class-9-acc-chapter-3",
    chapterName: "অধ্যায় ৩: দুতরফা দাখিলা পদ্ধতি",
    unitNumber: 3,
    topicId: "chapter-3",
    questionText: "দুতরফা দাখিলা পদ্ধতির মূলনীতি কী?",
    options: [
      { letter: "A", text: "শুধু ক্রেডিট লেখা" },
      { letter: "B", text: "প্রতিটি লেনদেনে ডেবিট ও ক্রেডিট সমান" },
      { letter: "C", text: "শুধু ডেবিট লেখা" },
      { letter: "D", text: "কোনো হিসাব না রাখা" }
    ],
    correctLetter: "B",
    explanation: "দুতরফা দাখিলায় প্রত্যেক লেনদেনের ডেবিট ও ক্রেডিট সমান হয়।",
    difficulty: "medium",
    sourceNote: "NCTB হিসাববিজ্ঞান, নবম-দশম শ্রেণি — অধ্যায় ৩: দুতরফা দাখিলা পদ্ধতি",
  },
  {
    id: "ACAD-1034",
    classId: "class-9",
    subjectId: "accounting",
    chapterId: "acad-class-9-acc-chapter-6",
    chapterName: "অধ্যায় ৬: জাবেদা",
    unitNumber: 6,
    topicId: "chapter-6",
    questionText: "জাবেদায় লেনদেন লেখার সময় প্রথমে কী লেখা হয়?",
    options: [
      { letter: "A", text: "হিসাবের নাম" },
      { letter: "B", text: "তারিখ" },
      { letter: "C", text: "টাকার পরিমাণ" },
      { letter: "D", text: "ব্যাখ্যা" }
    ],
    correctLetter: "B",
    explanation: "জাবেদায় প্রতিটি লেনদেনের শুরুতে তারিখ লেখা হয়, তারপর হিসাবের নাম ও টাকার পরিমাণ।",
    difficulty: "medium",
    sourceNote: "NCTB হিসাববিজ্ঞান, নবম-দশম শ্রেণি — অধ্যায় ৬: জাবেদা",
  },
  {
    id: "ACAD-1035",
    classId: "class-9",
    subjectId: "accounting",
    chapterId: "acad-class-9-acc-chapter-7",
    chapterName: "অধ্যায় ৭: খতিয়ান",
    unitNumber: 7,
    topicId: "chapter-7",
    questionText: "খতিয়ান কী?",
    options: [
      { letter: "A", text: "নগদ বই" },
      { letter: "B", text: "চূড়ান্ত হিসাব" },
      { letter: "C", text: "প্রতিটি হিসাবের পৃথক বিবরণী" },
      { letter: "D", text: "ব্যাংক বিবরণী" }
    ],
    correctLetter: "C",
    explanation: "খতিয়ানে প্রতিটি হিসাব খাতের আলাদা পাতায় লেনদেন শ্রেণিবদ্ধ করা হয়।",
    difficulty: "easy",
    sourceNote: "NCTB হিসাববিজ্ঞান, নবম-দশম শ্রেণি — অধ্যায় ৭: খতিয়ান",
  },
  {
    id: "ACAD-1036",
    classId: "class-9",
    subjectId: "accounting",
    chapterId: "acad-class-9-acc-chapter-8",
    chapterName: "অধ্যায় ৮: নগদান বই",
    unitNumber: 8,
    topicId: "chapter-8",
    questionText: "নগদান বইয়ের ডেবিট দিকে কী লেখা হয়?",
    options: [
      { letter: "A", text: "নগদ প্রদান" },
      { letter: "B", text: "ধারে বিক্রয়" },
      { letter: "C", text: "ধারে ক্রয়" },
      { letter: "D", text: "নগদ প্রাপ্তি" }
    ],
    correctLetter: "D",
    explanation: "নগদান বইয়ের ডেবিট দিকে নগদ প্রাপ্তি ও ক্রেডিট দিকে নগদ প্রদান লেখা হয়।",
    difficulty: "medium",
    sourceNote: "NCTB হিসাববিজ্ঞান, নবম-দশম শ্রেণি — অধ্যায় ৮: নগদান বই",
  },
  {
    id: "ACAD-1037",
    classId: "class-9",
    subjectId: "accounting",
    chapterId: "acad-class-9-acc-chapter-9",
    chapterName: "অধ্যায় ৯: রেওয়ামিল",
    unitNumber: 9,
    topicId: "chapter-9",
    questionText: "রেওয়ামিলের উদ্দেশ্য কী?",
    options: [
      { letter: "A", text: "কর নির্ণয়" },
      { letter: "B", text: "মুনাফা নির্ণয়" },
      { letter: "C", text: "হিসাবের গাণিতিক শুদ্ধতা যাচাই" },
      { letter: "D", text: "সম্পদ মূল্যায়ন" }
    ],
    correctLetter: "C",
    explanation: "রেওয়ামিলে ডেবিট-ক্রেডিট জের মিলিয়ে হিসাবের গাণিতিক শুদ্ধতা যাচাই করা হয়।",
    difficulty: "medium",
    sourceNote: "NCTB হিসাববিজ্ঞান, নবম-দশম শ্রেণি — অধ্যায় ৯: রেওয়ামিল",
  },
  {
    id: "ACAD-1038",
    classId: "class-9",
    subjectId: "accounting",
    chapterId: "acad-class-9-acc-chapter-10",
    chapterName: "অধ্যায় ১০: আর্থিক বিবরণী",
    unitNumber: 10,
    topicId: "chapter-10",
    questionText: "বিশদ আয় বিবরণীতে কী নির্ণয় করা হয়?",
    options: [
      { letter: "A", text: "মূলধন" },
      { letter: "B", text: "দেনাদার" },
      { letter: "C", text: "নগদ জের" },
      { letter: "D", text: "নিট মুনাফা" }
    ],
    correctLetter: "D",
    explanation: "বিশদ আয় বিবরণীতে আয়-ব্যয়ের হিসাব করে মোট ও নিট মুনাফা নির্ণয় করা হয়।",
    difficulty: "medium",
    sourceNote: "NCTB হিসাববিজ্ঞান, নবম-দশম শ্রেণি — অধ্যায় ১০: আর্থিক বিবরণী",
  },
  {
    id: "ACAD-1039",
    classId: "class-9",
    subjectId: "accounting",
    chapterId: "acad-class-9-acc-topic-1",
    chapterName: "হিসাবের সমীকরণ",
    unitNumber: 11,
    topicId: "topic-1",
    questionText: "হিসাব সমীকরণ কোনটি?",
    options: [
      { letter: "A", text: "সম্পদ = দায় + মালিকানা স্বত্ব" },
      { letter: "B", text: "দায় = সম্পদ + মালিকানা স্বত্ব" },
      { letter: "C", text: "মালিকানা স্বত্ব = সম্পদ + দায়" },
      { letter: "D", text: "সম্পদ = দায় − মালিকানা স্বত্ব" }
    ],
    correctLetter: "A",
    explanation: "মৌলিক হিসাব সমীকরণ: সম্পদ = দায় + মালিকানা স্বত্ব।",
    difficulty: "medium",
    sourceNote: "NCTB হিসাববিজ্ঞান, নবম-দশম শ্রেণি — হিসাব সমীকরণ",
  },
  {
    id: "ACAD-1040",
    classId: "class-9",
    subjectId: "accounting",
    chapterId: "acad-class-9-acc-topic-2",
    chapterName: "অবচয়",
    unitNumber: 12,
    topicId: "topic-2",
    questionText: "স্থায়ী সম্পদের মূল্য হ্রাসকে কী বলে?",
    options: [
      { letter: "A", text: "অবচয়" },
      { letter: "B", text: "অবলোপন" },
      { letter: "C", text: "ক্ষতি" },
      { letter: "D", text: "মুনাফা" }
    ],
    correctLetter: "A",
    explanation: "ব্যবহার ও সময়ের কারণে স্থায়ী সম্পদের মূল্য হ্রাসই অবচয়।",
    difficulty: "hard",
    sourceNote: "NCTB হিসাববিজ্ঞান, নবম-দশম শ্রেণি — স্থায়ী সম্পদ ও অবচয়",
  },
  {
    id: "ACAD-6037",
    classId: "class-9",
    subjectId: "accounting",
    chapterId: "acad-class-9-acc-chapter-1",
    chapterName: "অধ্যায় ১: হিসাববিজ্ঞান পরিচিতি",
    unitNumber: 1,
    topicId: "chapter-1",
    questionText: "হিসাববিজ্ঞানের তথ্য কারা ব্যবহার করে?",
    options: [
      { letter: "A", text: "শুধু সরকার" },
      { letter: "B", text: "মালিক, ঋণদাতা, সরকারসহ সবাই" },
      { letter: "C", text: "শুধু ব্যাংক" },
      { letter: "D", text: "শুধু মালিক" }
    ],
    correctLetter: "B",
    explanation: "হিসাবের তথ্য অভ্যন্তরীণ (মালিক, ব্যবস্থাপক) ও বাহ্যিক (ঋণদাতা, সরকার) সবাই ব্যবহার করে।",
    difficulty: "medium",
    sourceNote: "NCTB হিসাববিজ্ঞান — অধ্যায় ১",
  },
  {
    id: "ACAD-6038",
    classId: "class-9",
    subjectId: "accounting",
    chapterId: "acad-class-9-acc-chapter-2",
    chapterName: "অধ্যায় ২: লেনদেন",
    unitNumber: 2,
    topicId: "chapter-2",
    questionText: "ধারে পণ্য বিক্রয় করলে কোন হিসাব ডেবিট হয়?",
    options: [
      { letter: "A", text: "বিক্রয় হিসাব" },
      { letter: "B", text: "ক্রয় হিসাব" },
      { letter: "C", text: "নগদান হিসাব" },
      { letter: "D", text: "দেনাদার হিসাব" }
    ],
    correctLetter: "D",
    explanation: "ধারে বিক্রয়ে দেনাদার (সম্পদ) বাড়ে বলে দেনাদার ডেবিট ও বিক্রয় ক্রেডিট হয়।",
    difficulty: "medium",
    sourceNote: "NCTB হিসাববিজ্ঞান — অধ্যায় ২: লেনদেন",
  },
  {
    id: "ACAD-6039",
    classId: "class-9",
    subjectId: "accounting",
    chapterId: "acad-class-9-acc-chapter-3",
    chapterName: "অধ্যায় ৩: দুতরফা দাখিলা পদ্ধতি",
    unitNumber: 3,
    topicId: "chapter-3",
    questionText: "মালিক ব্যবসায়ে নগদ ৫০,০০০ টাকা দিলে জাবেদা কী হবে?",
    options: [
      { letter: "A", text: "নগদান হিসাব ডেবিট, মূলধন হিসাব ক্রেডিট" },
      { letter: "B", text: "মূলধন ডেবিট, নগদান ক্রেডিট" },
      { letter: "C", text: "ক্রয় ডেবিট, নগদান ক্রেডিট" },
      { letter: "D", text: "নগদান ডেবিট, বিক্রয় ক্রেডিট" }
    ],
    correctLetter: "A",
    explanation: "নগদ (সম্পদ) বাড়ে বলে নগদান ডেবিট; মূলধন বাড়ে বলে মূলধন ক্রেডিট।",
    difficulty: "medium",
    sourceNote: "NCTB হিসাববিজ্ঞান — অধ্যায় ৩: দুতরফা দাখিলা",
  },
  {
    id: "ACAD-6040",
    classId: "class-9",
    subjectId: "accounting",
    chapterId: "acad-class-9-acc-chapter-6",
    chapterName: "অধ্যায় ৬: জাবেদা",
    unitNumber: 6,
    topicId: "chapter-6",
    questionText: "জাবেদার ছকে কয়টি কলাম থাকে?",
    options: [
      { letter: "A", text: "৩টি" },
      { letter: "B", text: "৬টি" },
      { letter: "C", text: "৪টি" },
      { letter: "D", text: "৫টি" }
    ],
    correctLetter: "D",
    explanation: "জাবেদায় তারিখ, বিবরণ, খতিয়ান পৃষ্ঠা, ডেবিট টাকা ও ক্রেডিট টাকা — ৫টি কলাম থাকে।",
    difficulty: "medium",
    sourceNote: "NCTB হিসাববিজ্ঞান — অধ্যায় ৬: জাবেদা",
  },
  {
    id: "ACAD-6041",
    classId: "class-9",
    subjectId: "accounting",
    chapterId: "acad-class-9-acc-chapter-7",
    chapterName: "অধ্যায় ৭: খতিয়ান",
    unitNumber: 7,
    topicId: "chapter-7",
    questionText: "খতিয়ানের জের কী?",
    options: [
      { letter: "A", text: "মোট লেনদেন" },
      { letter: "B", text: "মুনাফা" },
      { letter: "C", text: "হিসাবের ডেবিট-ক্রেডিটের পার্থক্য" },
      { letter: "D", text: "নগদ টাকা" }
    ],
    correctLetter: "C",
    explanation: "খতিয়ানে প্রতিটি হিসাবের ডেবিট-ক্রেডিটের পার্থক্যই জের।",
    difficulty: "medium",
    sourceNote: "NCTB হিসাববিজ্ঞান — অধ্যায় ৭: খতিয়ান",
  },
  {
    id: "ACAD-6042",
    classId: "class-9",
    subjectId: "accounting",
    chapterId: "acad-class-9-acc-chapter-8",
    chapterName: "অধ্যায় ৮: নগদান বই",
    unitNumber: 8,
    topicId: "chapter-8",
    questionText: "নগদান বইয়ে ব্যাংক জমার জের কোন দিকে থাকে?",
    options: [
      { letter: "A", text: "কোথাও নয়" },
      { letter: "B", text: "ডেবিট দিকে" },
      { letter: "C", text: "ক্রেডিট দিকে" },
      { letter: "D", text: "দুই দিকেই" }
    ],
    correctLetter: "B",
    explanation: "ব্যাংকে জমা থাকলে তা সম্পদ, তাই নগদান বইয়ের ডেবিট দিকে জের থাকে।",
    difficulty: "medium",
    sourceNote: "NCTB হিসাববিজ্ঞান — অধ্যায় ৮: নগদান বই",
  },
  {
    id: "ACAD-6043",
    classId: "class-9",
    subjectId: "accounting",
    chapterId: "acad-class-9-acc-chapter-9",
    chapterName: "অধ্যায় ৯: রেওয়ামিল",
    unitNumber: 9,
    topicId: "chapter-9",
    questionText: "রেওয়ামিলের দুই দিক না মিললে কী বোঝায়?",
    options: [
      { letter: "A", text: "হিসাব ঠিক আছে" },
      { letter: "B", text: "কোথাও ভুল হয়েছে" },
      { letter: "C", text: "মুনাফা হয়েছে" },
      { letter: "D", text: "ক্ষতি হয়েছে" }
    ],
    correctLetter: "B",
    explanation: "ডেবিট-ক্রেডিট না মিললে লেখায় ভুল আছে বলে ধরা হয়।",
    difficulty: "medium",
    sourceNote: "NCTB হিসাববিজ্ঞান — অধ্যায় ৯: রেওয়ামিল",
  },
  {
    id: "ACAD-6044",
    classId: "class-9",
    subjectId: "accounting",
    chapterId: "acad-class-9-acc-chapter-10",
    chapterName: "অধ্যায় ১০: আর্থিক বিবরণী",
    unitNumber: 10,
    topicId: "chapter-10",
    questionText: "মোট মুনাফা নির্ণয় করা হয় কোন হিসাবে?",
    options: [
      { letter: "A", text: "রেওয়ামিলে" },
      { letter: "B", text: "ক্রয়-বিক্রয় হিসাবে" },
      { letter: "C", text: "মূলধন হিসাবে" },
      { letter: "D", text: "নগদান বইয়ে" }
    ],
    correctLetter: "B",
    explanation: "ক্রয়-বিক্রয় হিসাবে বিক্রয় থেকে বিক্রীত পণ্যের ব্যয় বাদ দিয়ে মোট মুনাফা বের হয়।",
    difficulty: "medium",
    sourceNote: "NCTB হিসাববিজ্ঞান — অধ্যায় ১০: আর্থিক বিবরণী",
  },
  {
    id: "ACAD-6045",
    classId: "class-9",
    subjectId: "accounting",
    chapterId: "acad-class-9-acc-topic-1",
    chapterName: "হিসাবের সমীকরণ",
    unitNumber: 11,
    topicId: "topic-1",
    questionText: "সম্পদ ১,০০,০০০ টাকা ও দায় ৪০,০০০ টাকা হলে মালিকানা স্বত্ব কত?",
    options: [
      { letter: "A", text: "৬০,০০০ টাকা" },
      { letter: "B", text: "৪০,০০০ টাকা" },
      { letter: "C", text: "১,৪০,০০০ টাকা" },
      { letter: "D", text: "১,০০,০০০ টাকা" }
    ],
    correctLetter: "A",
    explanation: "মালিকানা স্বত্ব = সম্পদ − দায় = ১,০০,০০০ − ৪০,০০০ = ৬০,০০০ টাকা।",
    difficulty: "medium",
    sourceNote: "NCTB হিসাববিজ্ঞান — হিসাব সমীকরণ",
  },
  {
    id: "ACAD-6046",
    classId: "class-9",
    subjectId: "accounting",
    chapterId: "acad-class-9-acc-topic-2",
    chapterName: "অবচয়",
    unitNumber: 12,
    topicId: "topic-2",
    questionText: "অবচয় কোন ধরনের ব্যয়?",
    options: [
      { letter: "A", text: "অনগদ ব্যয়" },
      { letter: "B", text: "প্রত্যক্ষ ব্যয়" },
      { letter: "C", text: "নগদ ব্যয়" },
      { letter: "D", text: "আয়" }
    ],
    correctLetter: "A",
    explanation: "অবচয়ে নগদ টাকা খরচ হয় না বলে এটি অনগদ ব্যয়।",
    difficulty: "medium",
    sourceNote: "NCTB হিসাববিজ্ঞান — স্থায়ী সম্পদ ও অবচয়",
  },
  {
    id: "ACAD-6047",
    classId: "class-9",
    subjectId: "accounting",
    chapterId: "acad-class-9-acc-topic-3",
    chapterName: "মূলধন",
    unitNumber: 13,
    topicId: "topic-3",
    questionText: "ব্যবসায়ে মালিকের বিনিয়োগকে কী বলে?",
    options: [
      { letter: "A", text: "দায়" },
      { letter: "B", text: "ঋণ" },
      { letter: "C", text: "মূলধন" },
      { letter: "D", text: "সম্পদ" }
    ],
    correctLetter: "C",
    explanation: "মালিকের বিনিয়োগই মূলধন; এটি মালিকানা স্বত্বের অংশ।",
    difficulty: "easy",
    sourceNote: "NCTB হিসাববিজ্ঞান — মূলধন অধ্যায়",
  },
  {
    id: "ACAD-6048",
    classId: "class-9",
    subjectId: "accounting",
    chapterId: "acad-class-9-acc-topic-4",
    chapterName: "দেনা-পাওনা",
    unitNumber: 14,
    topicId: "topic-4",
    questionText: "পাওনাদার কে?",
    options: [
      { letter: "A", text: "যার কাছে টাকা পাওয়া যাবে" },
      { letter: "B", text: "ব্যাংক" },
      { letter: "C", text: "যার কাছে টাকা দিতে হবে" },
      { letter: "D", text: "মালিক" }
    ],
    correctLetter: "C",
    explanation: "যার কাছে ব্যবসায়ের টাকা দেওয়ার বাকি আছে, তিনি পাওনাদার; দেনাদারের কাছে টাকা পাওয়া যাবে।",
    difficulty: "medium",
    sourceNote: "NCTB হিসাববিজ্ঞান — দেনা-পাওনা",
  },
  {
    id: "ACAD-2077",
    classId: "class-11",
    subjectId: "accounting",
    chapterId: "acad-class-11-acc-topic-1",
    chapterName: "হিসাববিজ্ঞান নীতিমালা",
    unitNumber: 1,
    topicId: "topic-1",
    questionText: "লেনদেন লিপিবদ্ধ করার পদ্ধতি কোনটি?",
    options: [
      { letter: "A", text: "দুতরফা দাখিলা" },
      { letter: "B", text: "কোনো নীতি নেই" },
      { letter: "C", text: "একতরফা দাখিলা" },
      { letter: "D", text: "নগদ ভিত্তি শুধু" }
    ],
    correctLetter: "A",
    explanation: "দুতরফা দাখিলা পদ্ধতিতে প্রতিটি লেনদেনের ডেবিট-ক্রেডিট সমানভাবে লেখা হয়।",
    difficulty: "medium",
    sourceNote: "NCTB HSC হিসাববিজ্ঞান ১ম পত্র — হিসাববিজ্ঞান পরিচিতি",
  },
  {
    id: "ACAD-2078",
    classId: "class-11",
    subjectId: "accounting",
    chapterId: "acad-class-11-acc-topic-2",
    chapterName: "অবচয়",
    unitNumber: 2,
    topicId: "topic-2",
    questionText: "সরলরৈখিক পদ্ধতিতে বার্ষিক অবচয় কীভাবে নির্ণয় হয়?",
    options: [
      { letter: "A", text: "ক্রয়মূল্য × সুদের হার" },
      { letter: "B", text: "ক্রয়মূল্য ÷ আয়ুষ্কাল" },
      { letter: "C", text: "বাজারমূল্য − ক্রয়মূল্য" },
      { letter: "D", text: "(ক্রয়মূল্য − ভগ্নাবশেষ মূল্য) ÷ আয়ুষ্কাল" }
    ],
    correctLetter: "D",
    explanation: "সরলরৈখিক পদ্ধতিতে অবচয় = (মূল্য − ভগ্নাবশেষ মূল্য) ÷ কার্যকর আয়ুষ্কাল।",
    difficulty: "medium",
    sourceNote: "NCTB HSC হিসাববিজ্ঞান ১ম পত্র — অবচয়",
  },
  {
    id: "ACAD-2079",
    classId: "class-11",
    subjectId: "accounting",
    chapterId: "acad-class-11-acc-topic-3",
    chapterName: "অংশীদারি",
    unitNumber: 3,
    topicId: "topic-3",
    questionText: "অংশীদারি চুক্তি না থাকলে মুনাফা কীভাবে বণ্টিত হয়?",
    options: [
      { letter: "A", text: "শুধু সক্রিয় অংশীদার পায়" },
      { letter: "B", text: "সমানভাবে" },
      { letter: "C", text: "মূলধনের অনুপাতে" },
      { letter: "D", text: "সরকার ঠিক করে" }
    ],
    correctLetter: "B",
    explanation: "চুক্তি না থাকলে অংশীদারি আইন অনুযায়ী মুনাফা সমানভাবে বণ্টিত হয়।",
    difficulty: "medium",
    sourceNote: "NCTB HSC হিসাববিজ্ঞান ২য় পত্র — অংশীদারি হিসাব",
  },
  {
    id: "ACAD-2080",
    classId: "class-11",
    subjectId: "accounting",
    chapterId: "acad-class-11-acc-topic-4",
    chapterName: "যৌথ মূলধনী কোম্পানি",
    unitNumber: 4,
    topicId: "topic-4",
    questionText: "শেয়ার ইস্যুতে অতিরিক্ত আদায়কে কী বলে?",
    options: [
      { letter: "A", text: "লভ্যাংশ" },
      { letter: "B", text: "শেয়ার অধিহার" },
      { letter: "C", text: "শেয়ার অবহার" },
      { letter: "D", text: "সঞ্চিতি" }
    ],
    correctLetter: "B",
    explanation: "অভিহিত মূল্যের বেশি দামে শেয়ার বিক্রি হলে অতিরিক্ত অংশ শেয়ার অধিহার।",
    difficulty: "medium",
    sourceNote: "NCTB HSC হিসাববিজ্ঞান ২য় পত্র — যৌথ মূলধনী কোম্পানির হিসাব",
  },
  {
    id: "ACAD-2081",
    classId: "class-11",
    subjectId: "accounting",
    chapterId: "acad-class-11-acc-topic-5",
    chapterName: "আর্থিক বিবরণী বিশ্লেষণ",
    unitNumber: 5,
    topicId: "topic-5",
    questionText: "চলতি অনুপাতের সূত্র কোনটি?",
    options: [
      { letter: "A", text: "মোট সম্পদ ÷ মোট দায়" },
      { letter: "B", text: "মূলধন ÷ দায়" },
      { letter: "C", text: "চলতি সম্পদ ÷ চলতি দায়" },
      { letter: "D", text: "নিট মুনাফা ÷ বিক্রয়" }
    ],
    correctLetter: "C",
    explanation: "চলতি অনুপাত = চলতি সম্পদ / চলতি দায়; এটি স্বল্পমেয়াদি সচ্ছলতা মাপে।",
    difficulty: "medium",
    sourceNote: "NCTB HSC হিসাববিজ্ঞান ২য় পত্র — আর্থিক বিবরণী বিশ্লেষণ",
  },
  {
    id: "ACAD-2082",
    classId: "class-11",
    subjectId: "accounting",
    chapterId: "acad-class-11-acc-topic-6",
    chapterName: "উৎপাদন ব্যয়",
    unitNumber: 6,
    topicId: "topic-6",
    questionText: "প্রত্যক্ষ কাঁচামাল + প্রত্যক্ষ শ্রম + প্রত্যক্ষ খরচ = ?",
    options: [
      { letter: "A", text: "কারখানা ব্যয়" },
      { letter: "B", text: "বিক্রয় ব্যয়" },
      { letter: "C", text: "মোট ব্যয়" },
      { letter: "D", text: "মুখ্য ব্যয়" }
    ],
    correctLetter: "D",
    explanation: "প্রত্যক্ষ ব্যয়গুলোর যোগফলই মুখ্য ব্যয় (prime cost)।",
    difficulty: "medium",
    sourceNote: "NCTB HSC হিসাববিজ্ঞান ২য় পত্র — উৎপাদন ব্যয় হিসাব",
  },
  {
    id: "ACAD-2083",
    classId: "class-11",
    subjectId: "accounting",
    chapterId: "acad-class-11-acc-topic-7",
    chapterName: "নগদ প্রবাহ",
    unitNumber: 7,
    topicId: "topic-7",
    questionText: "নগদ প্রবাহ বিবরণীতে কার্যক্রম কয় ভাগে ভাগ করা হয়?",
    options: [
      { letter: "A", text: "৫ ভাগে" },
      { letter: "B", text: "২ ভাগে" },
      { letter: "C", text: "৩ ভাগে" },
      { letter: "D", text: "৪ ভাগে" }
    ],
    correctLetter: "C",
    explanation: "পরিচালন, বিনিয়োগ ও অর্থায়ন — এই ৩ ভাগে নগদ প্রবাহ দেখানো হয়।",
    difficulty: "medium",
    sourceNote: "NCTB HSC হিসাববিজ্ঞান ২য় পত্র — নগদ প্রবাহ বিবরণী",
  },
  {
    id: "ACAD-2084",
    classId: "class-11",
    subjectId: "accounting",
    chapterId: "acad-class-11-acc-topic-8",
    chapterName: "ব্যাংক সমন্বয়",
    unitNumber: 8,
    topicId: "topic-8",
    questionText: "ব্যাংক সমন্বয় বিবরণী কেন তৈরি করা হয়?",
    options: [
      { letter: "A", text: "মুনাফা বাড়াতে" },
      { letter: "B", text: "ঋণ নিতে" },
      { letter: "C", text: "কর কমাতে" },
      { letter: "D", text: "নগদান বই ও ব্যাংক বিবরণীর পার্থক্য মেলাতে" }
    ],
    correctLetter: "D",
    explanation: "সময় ও লেনদেনের পার্থক্যে নগদান বই ও ব্যাংক বিবরণীর জের না মিললে সমন্বয় বিবরণী তৈরি হয়।",
    difficulty: "medium",
    sourceNote: "NCTB HSC হিসাববিজ্ঞান ১ম পত্র — ব্যাংক সমন্বয় বিবরণী",
  },
  {
    id: "ACAD-2085",
    classId: "class-11",
    subjectId: "accounting",
    chapterId: "acad-class-11-acc-topic-9",
    chapterName: "কুঋণ",
    unitNumber: 9,
    topicId: "topic-9",
    questionText: "আদায় হবে না এমন দেনাকে কী বলে?",
    options: [
      { letter: "A", text: "কুঋণ" },
      { letter: "B", text: "অগ্রিম" },
      { letter: "C", text: "দায়" },
      { letter: "D", text: "সন্দেহজনক ঋণ" }
    ],
    correctLetter: "A",
    explanation: "দেনাদারের কাছ থেকে যে পাওনা আর আদায় হবে না, তা কুঋণ হিসেবে লেখা হয়।",
    difficulty: "easy",
    sourceNote: "NCTB HSC হিসাববিজ্ঞান ১ম পত্র — কুঋণ ও সন্দেহজনক ঋণ",
  },
  {
    id: "ACAD-2086",
    classId: "class-11",
    subjectId: "accounting",
    chapterId: "acad-class-11-acc-topic-10",
    chapterName: "মজুদ",
    unitNumber: 10,
    topicId: "topic-10",
    questionText: "সমাপনী মজুদপণ্য আর্থিক অবস্থার বিবরণীতে কোথায় দেখানো হয়?",
    options: [
      { letter: "A", text: "চলতি সম্পদে" },
      { letter: "B", text: "স্থায়ী সম্পদে" },
      { letter: "C", text: "মূলধনে" },
      { letter: "D", text: "দায়ে" }
    ],
    correctLetter: "A",
    explanation: "সমাপনী মজুদ চলতি সম্পদ; আয় বিবরণীতে এটি বিক্রীত পণ্যের ব্যয় নির্ণয়ে ব্যবহৃত হয়।",
    difficulty: "medium",
    sourceNote: "NCTB HSC হিসাববিজ্ঞান ১ম পত্র — মজুদপণ্য",
  },
  {
    id: "ACAD-7085",
    classId: "class-11",
    subjectId: "accounting",
    chapterId: "acad-class-11-acc-topic-1",
    chapterName: "হিসাববিজ্ঞান নীতিমালা",
    unitNumber: 1,
    topicId: "topic-1",
    questionText: "চলমান প্রতিষ্ঠান ধারণা কী?",
    options: [
      { letter: "A", text: "প্রতিষ্ঠান বিক্রি হবে" },
      { letter: "B", text: "প্রতিষ্ঠান অনির্দিষ্টকাল চলবে" },
      { letter: "C", text: "প্রতিষ্ঠান ঋণ নেবে" },
      { letter: "D", text: "প্রতিষ্ঠান বন্ধ হবে" }
    ],
    correctLetter: "B",
    explanation: "চলমান প্রতিষ্ঠান ধারণায় ধরা হয় প্রতিষ্ঠান ভবিষ্যতেও চলবে; তাই সম্পদ ক্রয়মূল্যে দেখানো হয়।",
    difficulty: "medium",
    sourceNote: "NCTB HSC হিসাববিজ্ঞান ১ম পত্র — হিসাববিজ্ঞান নীতিমালা",
  },
  {
    id: "ACAD-7086",
    classId: "class-11",
    subjectId: "accounting",
    chapterId: "acad-class-11-acc-topic-2",
    chapterName: "অবচয়",
    unitNumber: 2,
    topicId: "topic-2",
    questionText: "ক্রমহ্রাসমান জের পদ্ধতিতে অবচয় ধরা হয় —",
    options: [
      { letter: "A", text: "বাজারমূল্যের ওপর" },
      { letter: "B", text: "ভগ্নাবশেষ মূল্যের ওপর" },
      { letter: "C", text: "ক্রয়মূল্যের ওপর" },
      { letter: "D", text: "বইমূল্যের ওপর" }
    ],
    correctLetter: "D",
    explanation: "ক্রমহ্রাসমান পদ্ধতিতে প্রতি বছর বইমূল্যের ওপর নির্দিষ্ট হারে অবচয় ধরা হয়।",
    difficulty: "medium",
    sourceNote: "NCTB HSC হিসাববিজ্ঞান ১ম পত্র — অবচয়",
  },
  {
    id: "ACAD-7087",
    classId: "class-11",
    subjectId: "accounting",
    chapterId: "acad-class-11-acc-topic-3",
    chapterName: "অংশীদারি",
    unitNumber: 3,
    topicId: "topic-3",
    questionText: "অংশীদারদের মূলধনের ওপর সুদ দেওয়া হয় কখন?",
    options: [
      { letter: "A", text: "চুক্তিতে থাকলে" },
      { letter: "B", text: "সবসময়" },
      { letter: "C", text: "কখনো নয়" },
      { letter: "D", text: "সরকার বললে" }
    ],
    correctLetter: "A",
    explanation: "চুক্তিতে না থাকলে মূলধনের ওপর সুদ দেওয়া হয় না।",
    difficulty: "medium",
    sourceNote: "NCTB HSC হিসাববিজ্ঞান ২য় পত্র — অংশীদারি হিসাব",
  },
  {
    id: "ACAD-7088",
    classId: "class-11",
    subjectId: "accounting",
    chapterId: "acad-class-11-acc-topic-4",
    chapterName: "যৌথ মূলধনী কোম্পানি",
    unitNumber: 4,
    topicId: "topic-4",
    questionText: "শেয়ার অবহার কী?",
    options: [
      { letter: "A", text: "অভিহিত মূল্যের বেশি বিক্রি" },
      { letter: "B", text: "সঞ্চিতি" },
      { letter: "C", text: "লভ্যাংশ" },
      { letter: "D", text: "অভিহিত মূল্যের কমে শেয়ার বিক্রি" }
    ],
    correctLetter: "D",
    explanation: "অভিহিত মূল্যের কম দামে শেয়ার বিক্রি হলে পার্থক্যটুকু শেয়ার অবহার।",
    difficulty: "medium",
    sourceNote: "NCTB HSC হিসাববিজ্ঞান ২য় পত্র — যৌথ মূলধনী কোম্পানি",
  },
  {
    id: "ACAD-7089",
    classId: "class-11",
    subjectId: "accounting",
    chapterId: "acad-class-11-acc-topic-5",
    chapterName: "আর্থিক বিবরণী বিশ্লেষণ",
    unitNumber: 5,
    topicId: "topic-5",
    questionText: "মোট মুনাফার হার নির্ণয়ের সূত্র কোনটি?",
    options: [
      { letter: "A", text: "নিট মুনাফা ÷ মোট সম্পদ" },
      { letter: "B", text: "মূলধন ÷ বিক্রয়" },
      { letter: "C", text: "মোট মুনাফা ÷ নিট বিক্রয় × ১০০" },
      { letter: "D", text: "বিক্রয় ÷ ক্রয়" }
    ],
    correctLetter: "C",
    explanation: "মোট মুনাফার হার = (মোট মুনাফা / নিট বিক্রয়) × ১০০।",
    difficulty: "medium",
    sourceNote: "NCTB HSC হিসাববিজ্ঞান ২য় পত্র — আর্থিক বিবরণী বিশ্লেষণ",
  },
  {
    id: "ACAD-7090",
    classId: "class-11",
    subjectId: "accounting",
    chapterId: "acad-class-11-acc-topic-6",
    chapterName: "উৎপাদন ব্যয়",
    unitNumber: 6,
    topicId: "topic-6",
    questionText: "কারখানা ব্যয়ে কী যোগ করলে উৎপাদন ব্যয় হয়?",
    options: [
      { letter: "A", text: "মুনাফা" },
      { letter: "B", text: "প্রশাসনিক ব্যয়" },
      { letter: "C", text: "মুখ্য ব্যয়" },
      { letter: "D", text: "বিক্রয় ব্যয়" }
    ],
    correctLetter: "B",
    explanation: "মুখ্য ব্যয় + কারখানা উপরি ব্যয় = কারখানা ব্যয়; তার সঙ্গে প্রশাসনিক ব্যয় যোগ করলে উৎপাদন ব্যয় হয়। মোট ব্যয় পেতে এর সঙ্গে বিক্রয় ও বণ্টন ব্যয় যোগ করতে হয়।",
    difficulty: "medium",
    sourceNote: "NCTB HSC হিসাববিজ্ঞান ২য় পত্র — উৎপাদন ব্যয় হিসাব",
  },
  {
    id: "ACAD-7091",
    classId: "class-11",
    subjectId: "accounting",
    chapterId: "acad-class-11-acc-topic-7",
    chapterName: "নগদ প্রবাহ",
    unitNumber: 7,
    topicId: "topic-7",
    questionText: "পরিচালন কার্যক্রমে নগদ প্রবাহের উদাহরণ কোনটি?",
    options: [
      { letter: "A", text: "যন্ত্র ক্রয়" },
      { letter: "B", text: "পণ্য বিক্রয় থেকে প্রাপ্তি" },
      { letter: "C", text: "শেয়ার বিক্রয়" },
      { letter: "D", text: "ঋণ গ্রহণ" }
    ],
    correctLetter: "B",
    explanation: "পণ্য বিক্রয়, সরবরাহকারীকে প্রদান — এগুলো পরিচালন কার্যক্রম।",
    difficulty: "medium",
    sourceNote: "NCTB HSC হিসাববিজ্ঞান ২য় পত্র — নগদ প্রবাহ বিবরণী",
  },
  {
    id: "ACAD-7092",
    classId: "class-11",
    subjectId: "accounting",
    chapterId: "acad-class-11-acc-topic-8",
    chapterName: "ব্যাংক সমন্বয়",
    unitNumber: 8,
    topicId: "topic-8",
    questionText: "ব্যাংক কর্তৃক সরাসরি আদায় করা টাকা নগদান বইয়ে —",
    options: [
      { letter: "A", text: "দ্বিগুণ করতে হয়" },
      { letter: "B", text: "জমা করতে হয়" },
      { letter: "C", text: "বাদ দিতে হয়" },
      { letter: "D", text: "কিছু করতে হয় না" }
    ],
    correctLetter: "B",
    explanation: "ব্যাংক সরাসরি আদায় করলে নগদান বইয়ে তা জমা (ডেবিট) করতে হয়।",
    difficulty: "medium",
    sourceNote: "NCTB HSC হিসাববিজ্ঞান ১ম পত্র — ব্যাংক সমন্বয় বিবরণী",
  },
  {
    id: "ACAD-7093",
    classId: "class-11",
    subjectId: "accounting",
    chapterId: "acad-class-11-acc-topic-9",
    chapterName: "কুঋণ",
    unitNumber: 9,
    topicId: "topic-9",
    questionText: "সন্দেহজনক ঋণ সঞ্চিতি কী?",
    options: [
      { letter: "A", text: "ভবিষ্যতে কুঋণের জন্য রাখা অর্থ" },
      { letter: "B", text: "মুনাফা" },
      { letter: "C", text: "নিশ্চিত কুঋণ" },
      { letter: "D", text: "মূলধন" }
    ],
    correctLetter: "A",
    explanation: "যে পাওনা আদায় অনিশ্চিত, তার জন্য সঞ্চিতি রাখা হয়।",
    difficulty: "medium",
    sourceNote: "NCTB HSC হিসাববিজ্ঞান ১ম পত্র — কুঋণ সঞ্চিতি",
  },
  {
    id: "ACAD-7094",
    classId: "class-11",
    subjectId: "accounting",
    chapterId: "acad-class-11-acc-topic-10",
    chapterName: "মজুদ",
    unitNumber: 10,
    topicId: "topic-10",
    questionText: "FIFO পদ্ধতিতে প্রথমে কী বিক্রি ধরা হয়?",
    options: [
      { letter: "A", text: "আগে কেনা মজুদ" },
      { letter: "B", text: "দামি মজুদ" },
      { letter: "C", text: "পরে কেনা মজুদ" },
      { letter: "D", text: "সস্তা মজুদ" }
    ],
    correctLetter: "A",
    explanation: "FIFO (First In First Out): আগে কেনা পণ্য আগে বিক্রি ধরা হয়।",
    difficulty: "medium",
    sourceNote: "NCTB HSC হিসাববিজ্ঞান ১ম পত্র — মজুদপণ্য",
  },
  {
    id: "ACAD-7095",
    classId: "class-11",
    subjectId: "accounting",
    chapterId: "acad-class-11-acc-topic-11",
    chapterName: "অন্তর্বর্তী হিসাব",
    unitNumber: 11,
    topicId: "topic-11",
    questionText: "অগ্রিম খরচ কোন ধরনের হিসাব?",
    options: [
      { letter: "A", text: "ব্যয়" },
      { letter: "B", text: "দায়" },
      { letter: "C", text: "সম্পদ" },
      { letter: "D", text: "আয়" }
    ],
    correctLetter: "C",
    explanation: "অগ্রিম খরচ ভবিষ্যতে সুবিধা দেবে বলে চলতি সম্পদ হিসেবে দেখানো হয়।",
    difficulty: "medium",
    sourceNote: "NCTB HSC হিসাববিজ্ঞান ১ম পত্র — সমন্বয় দাখিলা",
  },
  {
    id: "ACAD-7096",
    classId: "class-11",
    subjectId: "accounting",
    chapterId: "acad-class-11-acc-topic-12",
    chapterName: "বোনাস শেয়ার",
    unitNumber: 12,
    topicId: "topic-12",
    questionText: "বোনাস শেয়ার দেওয়া হয় —",
    options: [
      { letter: "A", text: "নতুন মূলধন থেকে" },
      { letter: "B", text: "লভ্যাংশ নগদে দিয়ে" },
      { letter: "C", text: "সঞ্চিতি থেকে" },
      { letter: "D", text: "ঋণ থেকে" }
    ],
    correctLetter: "C",
    explanation: "সঞ্চিত মুনাফা থেকে শেয়ারহোল্ডারদের বিনামূল্যে বোনাস শেয়ার দেওয়া হয়।",
    difficulty: "medium",
    sourceNote: "NCTB HSC হিসাববিজ্ঞান ২য় পত্র — যৌথ মূলধনী কোম্পানি",
  },
];
