// Eduvelto — Academic Accounting practice questions (Class 9),
// verified against the Dakhil NCTB books (review 26 Nov 2026).
//
// Static data ONLY — zero Firestore reads. The 22 questions are the
// Academic Class 9 Accounting drafts AFTER review (see
// review-academic-c9-accounting-verdicts.json and
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

import { type PublicAcademicQuestion } from './publicAcademic';

/** All verified Academic Accounting questions, Class 9 (in draft order). */
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
];
