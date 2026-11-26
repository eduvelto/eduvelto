// Eduvelto — Academic Chemistry practice questions (Class 9),
// verified against the Dakhil NCTB books (review 26 Nov 2026).
//
// Static data ONLY — zero Firestore reads. The 23 questions are the
// Academic Class 9 Chemistry drafts AFTER review (see
// review-academic-c9-chemistry-verdicts.json and
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
// their fixes applied). The one NEEDS-FIX item left out (ACAD-5096) is NOT here — its citation is unresolved and a teacher decision is owed.
//
// HOW NEW BATCHES JOIN: append the next verified batch's questions
// to PUBLIC_ACADEMIC_CHEMISTRY_QUESTIONS below (same shape, same generation
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

/** All verified Academic Chemistry questions, Class 9 (in draft order). */
export const PUBLIC_ACADEMIC_CHEMISTRY_QUESTIONS: PublicAcademicQuestion[] = [
  {
    id: "ACAD-0075",
    classId: "class-9",
    subjectId: "chemistry",
    chapterId: "acad-class-9-che-chapter-1",
    chapterName: "অধ্যায় ১: রসায়নের ধারণা",
    unitNumber: 1,
    topicId: "chapter-1",
    questionText: "পদার্থের ক্ষুদ্রতম কণা যা রাসায়নিক বিক্রিয়ায় অংশ নেয়, তাকে কী বলে?",
    options: [
      { letter: "A", text: "পরমাণু" },
      { letter: "B", text: "নিউট্রন" },
      { letter: "C", text: "অণু" },
      { letter: "D", text: "ইলেকট্রন" }
    ],
    correctLetter: "A",
    explanation: "পরমাণু মৌলের ক্ষুদ্রতম কণা যা রাসায়নিক বিক্রিয়ায় অংশ নেয়।",
    difficulty: "easy",
    sourceNote: "NCTB রসায়ন, নবম-দশম শ্রেণি — অধ্যায় ১: রসায়নের ধারণা",
  },
  {
    id: "ACAD-0076",
    classId: "class-9",
    subjectId: "chemistry",
    chapterId: "acad-class-9-che-chapter-2",
    chapterName: "অধ্যায় ২: পদার্থের অবস্থা",
    unitNumber: 2,
    topicId: "chapter-2",
    questionText: "কোন প্রক্রিয়ায় কঠিন সরাসরি গ্যাসে পরিণত হয়?",
    options: [
      { letter: "A", text: "ঘনীভবন" },
      { letter: "B", text: "গলন" },
      { letter: "C", text: "ঊর্ধ্বপাতন" },
      { letter: "D", text: "বাষ্পীভবন" }
    ],
    correctLetter: "C",
    explanation: "ঊর্ধ্বপাতনে (যেমন কর্পূর) কঠিন তরল না হয়ে সরাসরি গ্যাসে পরিণত হয়।",
    difficulty: "easy",
    sourceNote: "NCTB রসায়ন, নবম-দশম শ্রেণি — অধ্যায় ২: পদার্থের অবস্থা",
  },
  {
    id: "ACAD-0077",
    classId: "class-9",
    subjectId: "chemistry",
    chapterId: "acad-class-9-che-chapter-3",
    chapterName: "অধ্যায় ৩: পরমাণুর গঠন",
    unitNumber: 3,
    topicId: "chapter-3",
    questionText: "পরমাণুর নিউক্লিয়াসে কী থাকে?",
    options: [
      { letter: "A", text: "ইলেকট্রন ও প্রোটন" },
      { letter: "B", text: "প্রোটন ও নিউট্রন" },
      { letter: "C", text: "শুধু নিউট্রন" },
      { letter: "D", text: "শুধু ইলেকট্রন" }
    ],
    correctLetter: "B",
    explanation: "নিউক্লিয়াসে প্রোটন ও নিউট্রন থাকে; ইলেকট্রন নিউক্লিয়াসের চারপাশে ঘোরে।",
    difficulty: "medium",
    sourceNote: "NCTB রসায়ন, নবম-দশম শ্রেণি — অধ্যায় ৩: পরমাণুর গঠন",
  },
  {
    id: "ACAD-0078",
    classId: "class-9",
    subjectId: "chemistry",
    chapterId: "acad-class-9-che-chapter-4",
    chapterName: "অধ্যায় ৪: পর্যায় সারণি",
    unitNumber: 4,
    topicId: "chapter-4",
    questionText: "পর্যায় সারণিতে মৌলগুলো কী অনুযায়ী সাজানো হয়?",
    options: [
      { letter: "A", text: "পারমাণবিক ভর" },
      { letter: "B", text: "ঘনত্ব" },
      { letter: "C", text: "পারমাণবিক সংখ্যা" },
      { letter: "D", text: "গলনাঙ্ক" }
    ],
    correctLetter: "C",
    explanation: "আধুনিক পর্যায় সারণিতে মৌল পারমাণবিক সংখ্যার ক্রমে সাজানো হয়।",
    difficulty: "medium",
    sourceNote: "NCTB রসায়ন, নবম-দশম শ্রেণি — অধ্যায় ৪: পর্যায় সারণি",
  },
  {
    id: "ACAD-0079",
    classId: "class-9",
    subjectId: "chemistry",
    chapterId: "acad-class-9-che-chapter-5",
    chapterName: "অধ্যায় ৫: রাসায়নিক বন্ধন",
    unitNumber: 5,
    topicId: "chapter-5",
    questionText: "NaCl-এ কোন ধরনের বন্ধন আছে?",
    options: [
      { letter: "A", text: "আয়নিক" },
      { letter: "B", text: "হাইড্রোজেন" },
      { letter: "C", text: "ধাতব" },
      { letter: "D", text: "সমযোজী" }
    ],
    correctLetter: "A",
    explanation: "Na⁺ ও Cl⁻ আয়নের মধ্যে স্থির তড়িৎ আকর্ষণে আয়নিক বন্ধন গঠিত হয়।",
    difficulty: "medium",
    sourceNote: "NCTB রসায়ন, নবম-দশম শ্রেণি — অধ্যায় ৫: রাসায়নিক বন্ধন",
  },
  {
    id: "ACAD-0080",
    classId: "class-9",
    subjectId: "chemistry",
    chapterId: "acad-class-9-che-chapter-7",
    chapterName: "অধ্যায় ৭: রাসায়নিক বিক্রিয়া",
    unitNumber: 7,
    topicId: "chapter-7",
    questionText: "Zn + H₂SO₄ → ZnSO₄ + H₂ — এটি কোন ধরনের বিক্রিয়া?",
    options: [
      { letter: "A", text: "প্রতিস্থাপন" },
      { letter: "B", text: "সংযোজন" },
      { letter: "C", text: "বিয়োজন" },
      { letter: "D", text: "দহন" }
    ],
    correctLetter: "A",
    explanation: "Zn হাইড্রোজেনকে প্রতিস্থাপন করে বলে এটি প্রতিস্থাপন বিক্রিয়া।",
    difficulty: "easy",
    sourceNote: "NCTB রসায়ন, নবম-দশম শ্রেণি — অধ্যায় ৭: রাসায়নিক বিক্রিয়া",
  },
  {
    id: "ACAD-0081",
    classId: "class-9",
    subjectId: "chemistry",
    chapterId: "acad-class-9-che-chapter-6",
    chapterName: "অধ্যায় ৬: মোলের ধারণা ও রাসায়নিক গণনা",
    unitNumber: 6,
    topicId: "chapter-6",
    questionText: "১ মোল পানিতে অণুর সংখ্যা কত?",
    options: [
      { letter: "A", text: "৬.০২ × ১০²²" },
      { letter: "B", text: "১.২০ × ১০²⁴" },
      { letter: "C", text: "৬.০২ × ১০²³" },
      { letter: "D", text: "৩.০১ × ১০²³" }
    ],
    correctLetter: "C",
    explanation: "১ মোল = অ্যাভোগাড্রো সংখ্যা = ৬.০২ × ১০²³টি কণা।",
    difficulty: "medium",
    sourceNote: "NCTB রসায়ন, নবম-দশম শ্রেণি — অধ্যায় ৬: মোলের ধারণা ও রাসায়নিক গণনা",
  },
  {
    id: "ACAD-0082",
    classId: "class-9",
    subjectId: "chemistry",
    chapterId: "acad-class-9-che-chapter-9",
    chapterName: "অধ্যায় ৯: অ্যাসিড-ক্ষারক ও লবণ",
    unitNumber: 9,
    topicId: "chapter-9",
    questionText: "pH ১০-এর দ্রবণ কেমন?",
    options: [
      { letter: "A", text: "অম্লীয়" },
      { letter: "B", text: "লবণাক্ত" },
      { letter: "C", text: "প্রশম" },
      { letter: "D", text: "ক্ষারীয়" }
    ],
    correctLetter: "D",
    explanation: "pH ৭-এর বেশি হলে দ্রবণ ক্ষারীয় হয়; pH ১০-এর দ্রবণ ক্ষারীয়।",
    difficulty: "easy",
    sourceNote: "NCTB রসায়ন, নবম-দশম শ্রেণি — অধ্যায় ৯: অ্যাসিড-ক্ষারক ও লবণ",
  },
  {
    id: "ACAD-0083",
    classId: "class-9",
    subjectId: "chemistry",
    chapterId: "acad-class-9-che-chapter-8",
    chapterName: "অধ্যায় ৮: রসায়ন ও শক্তি",
    unitNumber: 8,
    topicId: "chapter-8",
    questionText: "তড়িৎ বিশ্লেষণে অ্যানোডে কী ঘটে?",
    options: [
      { letter: "A", text: "বিজারণ" },
      { letter: "B", text: "জারণ" },
      { letter: "C", text: "দহন" },
      { letter: "D", text: "প্রশমন" }
    ],
    correctLetter: "B",
    explanation: "অ্যানোডে জারণ (ইলেকট্রন ত্যাগ) ঘটে; ক্যাথোডে বিজারণ ঘটে।",
    difficulty: "medium",
    sourceNote: "NCTB রসায়ন, নবম-দশম শ্রেণি — অধ্যায় ৮: রসায়ন ও শক্তি",
  },
  {
    id: "ACAD-0084",
    classId: "class-9",
    subjectId: "chemistry",
    chapterId: "acad-class-9-che-chapter-11",
    chapterName: "অধ্যায় ১১: খনিজ সম্পদ: জীবাশ্ম",
    unitNumber: 11,
    topicId: "chapter-11",
    questionText: "পেট্রোলিয়ামের প্রধান উপাদান কোনটি?",
    options: [
      { letter: "A", text: "কার্বন ডাই-অক্সাইড" },
      { letter: "B", text: "হাইড্রোকার্বন" },
      { letter: "C", text: "সালফার" },
      { letter: "D", text: "নাইট্রোজেন" }
    ],
    correctLetter: "B",
    explanation: "পেট্রোলিয়ামের প্রধান উপাদান হাইড্রোকার্বন।",
    difficulty: "easy",
    sourceNote: "NCTB রসায়ন, নবম-দশম শ্রেণি — অধ্যায় ১১: খনিজ সম্পদ: জীবাশ্ম",
  },
  {
    id: "ACAD-0085",
    classId: "class-9",
    subjectId: "chemistry",
    chapterId: "acad-class-9-che-chapter-11",
    chapterName: "অধ্যায় ১১: খনিজ সম্পদ: জীবাশ্ম",
    unitNumber: 11,
    topicId: "chapter-11",
    questionText: "অ্যালকেনের সাধারণ সংকেত কোনটি?",
    options: [
      { letter: "A", text: "CₙH₂ₙ₊₂" },
      { letter: "B", text: "CₙH₂ₙ" },
      { letter: "C", text: "CₙH₂ₙ₋₂" },
      { letter: "D", text: "CₙH₂ₙ₊₁" }
    ],
    correctLetter: "A",
    explanation: "অ্যালকেনের সাধারণ সংকেত CₙH₂ₙ₊₂; অ্যালকিনের CₙH₂ₙ।",
    difficulty: "medium",
    sourceNote: "NCTB রসায়ন, নবম-দশম শ্রেণি — অধ্যায় ১১: খনিজ সম্পদ: জীবাশ্ম",
  },
  {
    id: "ACAD-0086",
    classId: "class-9",
    subjectId: "chemistry",
    chapterId: "acad-class-9-che-chapter-9",
    chapterName: "অধ্যায় ৯: অ্যাসিড-ক্ষারক ও লবণ",
    unitNumber: 9,
    topicId: "chapter-9",
    questionText: "অ্যাসিড বৃষ্টির জন্য প্রধানত দায়ী গ্যাস কোনটি?",
    options: [
      { letter: "A", text: "অক্সিজেন" },
      { letter: "B", text: "নাইট্রোজেন" },
      { letter: "C", text: "সালফার ডাইঅক্সাইড" },
      { letter: "D", text: "হিলিয়াম" }
    ],
    correctLetter: "C",
    explanation: "SO₂ ও NOₓ বৃষ্টির পানিতে মিশে সালফিউরিক ও নাইট্রিক অ্যাসিড তৈরি করে অ্যাসিড বৃষ্টি ঘটায়।",
    difficulty: "easy",
    sourceNote: "NCTB রসায়ন, নবম-দশম শ্রেণি — অধ্যায় ৯: এসিড-ক্ষারক সমতা",
  },
  {
    id: "ACAD-5085",
    classId: "class-9",
    subjectId: "chemistry",
    chapterId: "acad-class-9-che-chapter-3",
    chapterName: "অধ্যায় ৩: পরমাণুর গঠন",
    unitNumber: 3,
    topicId: "chapter-3",
    questionText: "অক্সিজেন পরমাণুর ভরসংখ্যা কত?",
    options: [
      { letter: "A", text: "১৬" },
      { letter: "B", text: "১৪" },
      { letter: "C", text: "৩২" },
      { letter: "D", text: "৮" }
    ],
    correctLetter: "A",
    explanation: "অক্সিজেনের পারমাণবিক সংখ্যা ৮ ও ভরসংখ্যা ১৬।",
    difficulty: "medium",
    sourceNote: "NCTB রসায়ন — অধ্যায় ৩: পরমাণুর গঠন",
  },
  {
    id: "ACAD-5086",
    classId: "class-9",
    subjectId: "chemistry",
    chapterId: "acad-class-9-che-chapter-3",
    chapterName: "অধ্যায় ৩: পরমাণুর গঠন",
    unitNumber: 3,
    topicId: "chapter-3",
    questionText: "কার্বন-১৪ কী?",
    options: [
      { letter: "A", text: "কার্বনের যৌগ" },
      { letter: "B", text: "কার্বনের রূপভেদ" },
      { letter: "C", text: "কার্বনের আইসোটোপ" },
      { letter: "D", text: "কার্বনের আয়ন" }
    ],
    correctLetter: "C",
    explanation: "একই মৌলের ভিন্ন ভরসংখ্যার পরমাণুই আইসোটোপ; C-12, C-14 কার্বনের আইসোটোপ।",
    difficulty: "medium",
    sourceNote: "NCTB রসায়ন — অধ্যায় ৩: পরমাণুর গঠন",
  },
  {
    id: "ACAD-5087",
    classId: "class-9",
    subjectId: "chemistry",
    chapterId: "acad-class-9-che-chapter-4",
    chapterName: "অধ্যায় ৪: পর্যায় সারণি",
    unitNumber: 4,
    topicId: "chapter-4",
    questionText: "নিষ্ক্রিয় গ্যাস কোন শ্রেণিতে আছে?",
    options: [
      { letter: "A", text: "শ্রেণি ১৭" },
      { letter: "B", text: "শ্রেণি ১" },
      { letter: "C", text: "শ্রেণি ১৮" },
      { letter: "D", text: "শ্রেণি ২" }
    ],
    correctLetter: "C",
    explanation: "হিলিয়াম, নিয়ন, আর্গনসহ নিষ্ক্রিয় গ্যাস শ্রেণি ১৮-তে আছে।",
    difficulty: "medium",
    sourceNote: "NCTB রসায়ন — অধ্যায় ৪: পর্যায় সারণি",
  },
  {
    id: "ACAD-5088",
    classId: "class-9",
    subjectId: "chemistry",
    chapterId: "acad-class-9-che-chapter-5",
    chapterName: "অধ্যায় ৫: রাসায়নিক বন্ধন",
    unitNumber: 5,
    topicId: "chapter-5",
    questionText: "পানির অণুতে কোন বন্ধন আছে?",
    options: [
      { letter: "A", text: "ধাতব" },
      { letter: "B", text: "সমযোজী" },
      { letter: "C", text: "হাইড্রোজেন বন্ধন শুধু" },
      { letter: "D", text: "আয়নিক" }
    ],
    correctLetter: "B",
    explanation: "H₂O-তে H ও O-এর মধ্যে সমযোজী বন্ধন; অণুগুলোর মধ্যে হাইড্রোজেন বন্ধনও আছে।",
    difficulty: "medium",
    sourceNote: "NCTB রসায়ন — অধ্যায় ৫: রাসায়নিক বন্ধন",
  },
  {
    id: "ACAD-5089",
    classId: "class-9",
    subjectId: "chemistry",
    chapterId: "acad-class-9-che-chapter-7",
    chapterName: "অধ্যায় ৭: রাসায়নিক বিক্রিয়া",
    unitNumber: 7,
    topicId: "chapter-7",
    questionText: "CaCO₃ → CaO + CO₂ — এটি কোন বিক্রিয়া?",
    options: [
      { letter: "A", text: "দহন" },
      { letter: "B", text: "সংযোজন" },
      { letter: "C", text: "প্রতিস্থাপন" },
      { letter: "D", text: "বিয়োজন" }
    ],
    correctLetter: "D",
    explanation: "একটি যৌগ ভেঙে দুটি পদার্থ হওয়ায় এটি বিয়োজন বিক্রিয়া।",
    difficulty: "medium",
    sourceNote: "NCTB রসায়ন — অধ্যায় ৭: রাসায়নিক বিক্রিয়া",
  },
  {
    id: "ACAD-5090",
    classId: "class-9",
    subjectId: "chemistry",
    chapterId: "acad-class-9-che-chapter-6",
    chapterName: "অধ্যায় ৬: মোলের ধারণা ও রাসায়নিক গণনা",
    unitNumber: 6,
    topicId: "chapter-6",
    questionText: "১২ গ্রাম কার্বনে কত মোল আছে?",
    options: [
      { letter: "A", text: "১ মোল" },
      { letter: "B", text: "২ মোল" },
      { letter: "C", text: "৬ মোল" },
      { letter: "D", text: "১২ মোল" }
    ],
    correctLetter: "A",
    explanation: "কার্বনের পারমাণবিক ভর ১২; ১২ গ্রাম = ১ মোল।",
    difficulty: "medium",
    sourceNote: "NCTB রসায়ন — অধ্যায় ৬: মোলের ধারণা",
  },
  {
    id: "ACAD-5091",
    classId: "class-9",
    subjectId: "chemistry",
    chapterId: "acad-class-9-che-chapter-9",
    chapterName: "অধ্যায় ৯: অ্যাসিড-ক্ষারক ও লবণ",
    unitNumber: 9,
    topicId: "chapter-9",
    questionText: "ভিনেগারে কোন অ্যাসিড থাকে?",
    options: [
      { letter: "A", text: "নাইট্রিক অ্যাসিড" },
      { letter: "B", text: "অ্যাসিটিক অ্যাসিড" },
      { letter: "C", text: "সালফিউরিক অ্যাসিড" },
      { letter: "D", text: "সাইট্রিক অ্যাসিড" }
    ],
    correctLetter: "B",
    explanation: "ভিনেগারে অ্যাসিটিক অ্যাসিড (CH₃COOH) থাকে।",
    difficulty: "medium",
    sourceNote: "NCTB রসায়ন — অধ্যায় ৯: অ্যাসিড-ক্ষারক ও লবণ",
  },
  {
    id: "ACAD-5092",
    classId: "class-9",
    subjectId: "chemistry",
    chapterId: "acad-class-9-che-chapter-9",
    chapterName: "অধ্যায় ৯: অ্যাসিড-ক্ষারক ও লবণ",
    unitNumber: 9,
    topicId: "chapter-9",
    questionText: "চুনের রাসায়নিক নাম কী?",
    options: [
      { letter: "A", text: "সোডিয়াম হাইড্রোক্সাইড" },
      { letter: "B", text: "সোডিয়াম ক্লোরাইড" },
      { letter: "C", text: "ক্যালসিয়াম কার্বনেট" },
      { letter: "D", text: "ক্যালসিয়াম অক্সাইড" }
    ],
    correctLetter: "D",
    explanation: "চুনের রাসায়নিক নাম ক্যালসিয়াম অক্সাইড।",
    difficulty: "easy",
    sourceNote: "NCTB রসায়ন — অধ্যায় ৯: অ্যাসিড-ক্ষারক ও লবণ",
  },
  {
    id: "ACAD-5093",
    classId: "class-9",
    subjectId: "chemistry",
    chapterId: "acad-class-9-che-chapter-7",
    chapterName: "অধ্যায় ৭: রাসায়নিক বিক্রিয়া",
    unitNumber: 7,
    topicId: "chapter-7",
    questionText: "জারণ মানে —",
    options: [
      { letter: "A", text: "প্রোটন ত্যাগ" },
      { letter: "B", text: "ইলেকট্রন ত্যাগ" },
      { letter: "C", text: "ইলেকট্রন গ্রহণ" },
      { letter: "D", text: "নিউট্রন গ্রহণ" }
    ],
    correctLetter: "B",
    explanation: "জারণে ইলেকট্রন ত্যাগ হয়; বিজারণে ইলেকট্রন গ্রহণ হয়।",
    difficulty: "medium",
    sourceNote: "NCTB রসায়ন, নবম-দশম শ্রেণি — অধ্যায় ৭: রাসায়নিক বিক্রিয়া",
  },
  {
    id: "ACAD-5094",
    classId: "class-9",
    subjectId: "chemistry",
    chapterId: "acad-class-9-che-chapter-11",
    chapterName: "অধ্যায় ১১: খনিজ সম্পদ: জীবাশ্ম",
    unitNumber: 11,
    topicId: "chapter-11",
    questionText: "ইথেনের সংকেত কোনটি?",
    options: [
      { letter: "A", text: "C₃H₈" },
      { letter: "B", text: "CH₄" },
      { letter: "C", text: "C₂H₄" },
      { letter: "D", text: "C₂H₆" }
    ],
    correctLetter: "D",
    explanation: "ইথেন C₂H₆; মিথেন CH₄; ইথিলিন C₂H₄।",
    difficulty: "medium",
    sourceNote: "NCTB রসায়ন, নবম-দশম শ্রেণি — অধ্যায় ১১: খনিজ সম্পদ: জীবাশ্ম",
  },
  {
    id: "ACAD-5095",
    classId: "class-9",
    subjectId: "chemistry",
    chapterId: "acad-class-9-che-chapter-2",
    chapterName: "অধ্যায় ২: পদার্থের অবস্থা",
    unitNumber: 2,
    topicId: "chapter-2",
    questionText: "বরফ গলতে শুরু করে কত তাপমাত্রায়?",
    options: [
      { letter: "A", text: "−১০°C" },
      { letter: "B", text: "১০০°C" },
      { letter: "C", text: "৩৭°C" },
      { letter: "D", text: "০°C" }
    ],
    correctLetter: "D",
    explanation: "সাধারণ চাপে বরফ ০°C-এ গলে।",
    difficulty: "easy",
    sourceNote: "NCTB রসায়ন — অধ্যায় ২: পদার্থের অবস্থা",
  },
];
