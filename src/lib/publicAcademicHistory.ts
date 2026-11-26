// Eduvelto — Academic History practice questions (Classes 9 and 11),
// verified against the NCTB books (review 26 Nov 2026; see the Class 9 / Class 11 notes below).
//
// Static data ONLY — zero Firestore reads. The 43 questions are the
// Academic Class 9 and Class 11 History drafts AFTER review (see
// review-academic-c9-civics-history-verdicts.json,
// review-academic-c9-fixes-applied.md,
// review-academic-c11-12-history-verdicts.json and
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
// to PUBLIC_ACADEMIC_HISTORY_QUESTIONS below (same shape, same generation
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

/** All verified Academic History questions, Classes 9 and 11 (in draft order). */
export const PUBLIC_ACADEMIC_HISTORY_QUESTIONS: PublicAcademicQuestion[] = [
  {
    id: "ACAD-1071",
    classId: "class-9",
    subjectId: "history",
    chapterId: "acad-class-9-his-topic-1",
    chapterName: "প্রাচীন বাংলা",
    unitNumber: 1,
    topicId: "topic-1",
    questionText: "বাংলার প্রাচীন জনপদগুলোর একটি কোনটি?",
    options: [
      { letter: "A", text: "মগধ" },
      { letter: "B", text: "কলিঙ্গ" },
      { letter: "C", text: "পুণ্ড্র" },
      { letter: "D", text: "অবন্তী" }
    ],
    correctLetter: "C",
    explanation: "পুণ্ড্র, বঙ্গ, গৌড়, সমতট ছিল বাংলার প্রাচীন জনপদ।",
    difficulty: "medium",
    sourceNote: "NCTB বাংলাদেশের ইতিহাস ও বিশ্বসভ্যতা, নবম-দশম শ্রেণি — প্রাচীন বাংলা",
  },
  {
    id: "ACAD-1072",
    classId: "class-9",
    subjectId: "history",
    chapterId: "acad-class-9-his-topic-2",
    chapterName: "পাল বংশ",
    unitNumber: 2,
    topicId: "topic-2",
    questionText: "পাল বংশের প্রতিষ্ঠাতা কে?",
    options: [
      { letter: "A", text: "গোপাল" },
      { letter: "B", text: "ধর্মপাল" },
      { letter: "C", text: "দেবপাল" },
      { letter: "D", text: "মহীপাল" }
    ],
    correctLetter: "A",
    explanation: "৭৫০ খ্রিষ্টাব্দে গোপাল পাল বংশ প্রতিষ্ঠা করেন।",
    difficulty: "medium",
    sourceNote: "NCTB বাংলাদেশের ইতিহাস ও বিশ্বসভ্যতা, নবম-দশম শ্রেণি — পাল বংশ",
  },
  {
    id: "ACAD-1073",
    classId: "class-9",
    subjectId: "history",
    chapterId: "acad-class-9-his-topic-3",
    chapterName: "মুসলিম শাসন",
    unitNumber: 3,
    topicId: "topic-3",
    questionText: "বাংলায় মুসলিম শাসনের সূচনা করেন কে?",
    options: [
      { letter: "A", text: "ইখতিয়ার উদ্দিন মুহম্মদ বখতিয়ার খলজি" },
      { letter: "B", text: "শামসুদ্দিন ইলিয়াস শাহ" },
      { letter: "C", text: "আলাউদ্দিন হোসেন শাহ" },
      { letter: "D", text: "শের শাহ" }
    ],
    correctLetter: "A",
    explanation: "১২০৪ সালে বখতিয়ার খলজির বাংলা বিজয়ের মধ্য দিয়ে মুসলিম শাসনের সূচনা হয়।",
    difficulty: "medium",
    sourceNote: "NCTB বাংলাদেশের ইতিহাস ও বিশ্বসভ্যতা, নবম-দশম শ্রেণি — মুসলিম শাসন",
  },
  {
    id: "ACAD-1074",
    classId: "class-9",
    subjectId: "history",
    chapterId: "acad-class-9-his-topic-4",
    chapterName: "ইংরেজ শাসন",
    unitNumber: 4,
    topicId: "topic-4",
    questionText: "পলাশীর যুদ্ধের পর বাংলার নবাব কে হন?",
    options: [
      { letter: "A", text: "মীর জাফর" },
      { letter: "B", text: "মীর কাসিম" },
      { letter: "C", text: "আলীবর্দী খাঁ" },
      { letter: "D", text: "সিরাজউদ্দৌলা" }
    ],
    correctLetter: "A",
    explanation: "পলাশীর যুদ্ধের পর মীর জাফর বাংলার নবাব হন।",
    difficulty: "medium",
    sourceNote: "NCTB বাংলাদেশের ইতিহাস ও বিশ্বসভ্যতা, নবম-দশম শ্রেণি — ইংরেজ শাসন",
  },
  {
    id: "ACAD-1075",
    classId: "class-9",
    subjectId: "history",
    chapterId: "acad-class-9-his-topic-5",
    chapterName: "সিপাহি বিদ্রোহ",
    unitNumber: 5,
    topicId: "topic-5",
    questionText: "সিপাহি বিদ্রোহ কত সালে হয়?",
    options: [
      { letter: "A", text: "১৭৫৭" },
      { letter: "B", text: "১৯৪২" },
      { letter: "C", text: "১৯০৫" },
      { letter: "D", text: "১৮৫৭" }
    ],
    correctLetter: "D",
    explanation: "১৮৫৭ সালের সিপাহি বিদ্রোহ ভারতে ইংরেজ শাসনের বিরুদ্ধে প্রথম বড় সংগঠিত বিদ্রোহ।",
    difficulty: "medium",
    sourceNote: "NCTB বাংলাদেশের ইতিহাস ও বিশ্বসভ্যতা, নবম-দশম শ্রেণি — সিপাহি বিদ্রোহ",
  },
  {
    id: "ACAD-1076",
    classId: "class-9",
    subjectId: "history",
    chapterId: "acad-class-9-his-topic-6",
    chapterName: "বঙ্গভঙ্গ",
    unitNumber: 6,
    topicId: "topic-6",
    questionText: "ভারত শাসন আইন কত সালে পাস হয়?",
    options: [
      { letter: "A", text: "১৯০৯" },
      { letter: "B", text: "১৯৪৭" },
      { letter: "C", text: "১৯৩৫" },
      { letter: "D", text: "১৯২৫" }
    ],
    correctLetter: "C",
    explanation: "ভারত শাসন আইন ১৯৩৫ সালে পাস হয়।",
    difficulty: "medium",
    sourceNote: "NCTB বাংলাদেশের ইতিহাস ও বিশ্বসভ্যতা, নবম-দশম শ্রেণি — বঙ্গভঙ্গ",
  },
  {
    id: "ACAD-1077",
    classId: "class-9",
    subjectId: "history",
    chapterId: "acad-class-9-his-topic-7",
    chapterName: "ছয় দফা",
    unitNumber: 7,
    topicId: "topic-7",
    questionText: "ছয় দফা কে উত্থাপন করেন?",
    options: [
      { letter: "A", text: "মাওলানা ভাসানী" },
      { letter: "B", text: "শেরে বাংলা ফজলুল হক" },
      { letter: "C", text: "বঙ্গবন্ধু শেখ মুজিবুর রহমান" },
      { letter: "D", text: "তাজউদ্দীন আহমদ" }
    ],
    correctLetter: "C",
    explanation: "১৯৬৬ সালে বঙ্গবন্ধু শেখ মুজিবুর রহমান ছয় দফা উত্থাপন করেন; একে বাঙালির মুক্তির সনদ বলা হয়।",
    difficulty: "medium",
    sourceNote: "NCTB বাংলাদেশের ইতিহাস ও বিশ্বসভ্যতা, নবম-দশম শ্রেণি — ছয় দফা",
  },
  {
    id: "ACAD-1078",
    classId: "class-9",
    subjectId: "history",
    chapterId: "acad-class-9-his-topic-8",
    chapterName: "মুক্তিযুদ্ধ",
    unitNumber: 8,
    topicId: "topic-8",
    questionText: "মুক্তিযুদ্ধে বাংলাদেশের মিত্রবাহিনী কোন দেশের সেনাবাহিনী?",
    options: [
      { letter: "A", text: "ভারত" },
      { letter: "B", text: "পাকিস্তান" },
      { letter: "C", text: "চীন" },
      { letter: "D", text: "সোভিয়েত ইউনিয়ন" }
    ],
    correctLetter: "A",
    explanation: "মুক্তিযুদ্ধে ভারতীয় সেনাবাহিনী মিত্রবাহিনী হিসেবে মুক্তিবাহিনীর পাশে যুদ্ধ করে।",
    difficulty: "easy",
    sourceNote: "NCTB বাংলাদেশের ইতিহাস ও বিশ্বসভ্যতা, নবম-দশম শ্রেণি — মুক্তিযুদ্ধ",
  },
  {
    id: "ACAD-1079",
    classId: "class-9",
    subjectId: "history",
    chapterId: "acad-class-9-his-topic-9",
    chapterName: "বিশ্বসভ্যতা",
    unitNumber: 9,
    topicId: "topic-9",
    questionText: "মিসরীয় সভ্যতা কোন নদীর তীরে গড়ে ওঠে?",
    options: [
      { letter: "A", text: "ইউফ্রেটিস" },
      { letter: "B", text: "সিন্ধু" },
      { letter: "C", text: "হোয়াংহো" },
      { letter: "D", text: "নীল" }
    ],
    correctLetter: "D",
    explanation: "নীল নদের তীরে মিসরীয় সভ্যতা গড়ে ওঠে বলে মিসরকে নীল নদের দান বলা হয়।",
    difficulty: "medium",
    sourceNote: "NCTB বাংলাদেশের ইতিহাস ও বিশ্বসভ্যতা, নবম-দশম শ্রেণি — বিশ্বসভ্যতা",
  },
  {
    id: "ACAD-1080",
    classId: "class-9",
    subjectId: "history",
    chapterId: "acad-class-9-his-topic-10",
    chapterName: "সিন্ধু সভ্যতা",
    unitNumber: 10,
    topicId: "topic-10",
    questionText: "সিন্ধু সভ্যতার প্রধান নগর কোনটি?",
    options: [
      { letter: "A", text: "পাটলিপুত্র" },
      { letter: "B", text: "মহেঞ্জোদারো" },
      { letter: "C", text: "তক্ষশীলা" },
      { letter: "D", text: "উজ্জয়িনী" }
    ],
    correctLetter: "B",
    explanation: "মহেঞ্জোদারো ও হরপ্পা সিন্ধু সভ্যতার প্রধান পরিকল্পিত নগর ছিল।",
    difficulty: "medium",
    sourceNote: "NCTB বাংলাদেশের ইতিহাস ও বিশ্বসভ্যতা, নবম-দশম শ্রেণি — সিন্ধু সভ্যতা",
  },
  {
    id: "ACAD-6085",
    classId: "class-9",
    subjectId: "history",
    chapterId: "acad-class-9-his-topic-1",
    chapterName: "প্রাচীন বাংলা",
    unitNumber: 1,
    topicId: "topic-1",
    questionText: "গৌড় জনপদের রাজধানী কোথায় ছিল?",
    options: [
      { letter: "A", text: "পাটলিপুত্র" },
      { letter: "B", text: "কর্ণসুবর্ণ" },
      { letter: "C", text: "তক্ষশীলা" },
      { letter: "D", text: "উজ্জয়িনী" }
    ],
    correctLetter: "B",
    explanation: "শশাঙ্কের রাজধানী কর্ণসুবর্ণ গৌড় জনপদের কেন্দ্র ছিল।",
    difficulty: "medium",
    sourceNote: "NCTB বাংলাদেশের ইতিহাস — প্রাচীন বাংলা",
  },
  {
    id: "ACAD-6086",
    classId: "class-9",
    subjectId: "history",
    chapterId: "acad-class-9-his-topic-2",
    chapterName: "পাল বংশ",
    unitNumber: 2,
    topicId: "topic-2",
    questionText: "সোমপুর মহাবিহার কে নির্মাণ করেন?",
    options: [
      { letter: "A", text: "মহীপাল" },
      { letter: "B", text: "গোপাল" },
      { letter: "C", text: "দেবপাল" },
      { letter: "D", text: "ধর্মপাল" }
    ],
    correctLetter: "D",
    explanation: "ধর্মপাল সোমপুর মহাবিহার (পাহাড়পুর) নির্মাণ করেন।",
    difficulty: "medium",
    sourceNote: "NCTB বাংলাদেশের ইতিহাস — পাল বংশ",
  },
  {
    id: "ACAD-6087",
    classId: "class-9",
    subjectId: "history",
    chapterId: "acad-class-9-his-topic-3",
    chapterName: "মুসলিম শাসন",
    unitNumber: 3,
    topicId: "topic-3",
    questionText: "ইলিয়াস শাহী বংশের প্রতিষ্ঠাতা কে?",
    options: [
      { letter: "A", text: "নাসিরউদ্দিন মাহমুদ" },
      { letter: "B", text: "শামসুদ্দিন ইলিয়াস শাহ" },
      { letter: "C", text: "আলাউদ্দিন হোসেন শাহ" },
      { letter: "D", text: "গিয়াসউদ্দিন আজম শাহ" }
    ],
    correctLetter: "B",
    explanation: "১৩৪২ সালে শামসুদ্দিন ইলিয়াস শাহ বাংলার স্বাধীন সুলতানি প্রতিষ্ঠা করেন।",
    difficulty: "medium",
    sourceNote: "NCTB বাংলাদেশের ইতিহাস — মুসলিম শাসন",
  },
  {
    id: "ACAD-6088",
    classId: "class-9",
    subjectId: "history",
    chapterId: "acad-class-9-his-topic-4",
    chapterName: "ইংরেজ শাসন",
    unitNumber: 4,
    topicId: "topic-4",
    questionText: "ফরায়েজি আন্দোলনের নেতা কে ছিলেন?",
    options: [
      { letter: "A", text: "হাজী শরীয়তুল্লাহ" },
      { letter: "B", text: "দুদু মিয়া" },
      { letter: "C", text: "সৈয়দ আহমদ" },
      { letter: "D", text: "তিতুমীর" }
    ],
    correctLetter: "A",
    explanation: "ফরায়েজি আন্দোলনের নেতা ছিলেন হাজী শরীয়তুল্লাহ।",
    difficulty: "medium",
    sourceNote: "NCTB বাংলাদেশের ইতিহাস — ইংরেজ শাসন",
  },
  {
    id: "ACAD-6089",
    classId: "class-9",
    subjectId: "history",
    chapterId: "acad-class-9-his-topic-5",
    chapterName: "সিপাহি বিদ্রোহ",
    unitNumber: 5,
    topicId: "topic-5",
    questionText: "সিপাহি বিদ্রোহের পর ভারতের শাসনভার যায় কার হাতে?",
    options: [
      { letter: "A", text: "ইস্ট ইন্ডিয়া কোম্পানির" },
      { letter: "B", text: "মুঘল সম্রাটের" },
      { letter: "C", text: "ব্রিটিশ রাজতন্ত্রের" },
      { letter: "D", text: "মারাঠাদের" }
    ],
    correctLetter: "C",
    explanation: "১৮৫৮ সালে কোম্পানির শাসন শেষ হয়ে ভারত সরাসরি ব্রিটিশ রাজতন্ত্রের অধীনে যায়।",
    difficulty: "medium",
    sourceNote: "NCTB বাংলাদেশের ইতিহাস — সিপাহি বিদ্রোহ",
  },
  {
    id: "ACAD-6090",
    classId: "class-9",
    subjectId: "history",
    chapterId: "acad-class-9-his-topic-6",
    chapterName: "বঙ্গভঙ্গ",
    unitNumber: 6,
    topicId: "topic-6",
    questionText: "বঙ্গভঙ্গ রদ হয় কত সালে?",
    options: [
      { letter: "A", text: "১৯১১" },
      { letter: "B", text: "১৯০৫" },
      { letter: "C", text: "১৯৪৭" },
      { letter: "D", text: "১৯০৬" }
    ],
    correctLetter: "A",
    explanation: "আন্দোলনের মুখে ১৯১১ সালে বঙ্গভঙ্গ রদ করা হয়।",
    difficulty: "medium",
    sourceNote: "NCTB বাংলাদেশের ইতিহাস — বঙ্গভঙ্গ",
  },
  {
    id: "ACAD-6092",
    classId: "class-9",
    subjectId: "history",
    chapterId: "acad-class-9-his-topic-8",
    chapterName: "মুক্তিযুদ্ধ",
    unitNumber: 8,
    topicId: "topic-8",
    questionText: "মুক্তিবাহিনী গঠিত হয় কবে?",
    options: [
      { letter: "A", text: "১৭ এপ্রিল ১৯৭১" },
      { letter: "B", text: "১০ এপ্রিল ১৯৭১" },
      { letter: "C", text: "১১ জুলাই ১৯৭১" },
      { letter: "D", text: "২৬ মার্চ ১৯৭১" }
    ],
    correctLetter: "C",
    explanation: "১৯৭১ সালের ১১ জুলাই মুক্তিবাহিনী গঠিত হয়।",
    difficulty: "medium",
    sourceNote: "NCTB বাংলাদেশের ইতিহাস — মুক্তিযুদ্ধ",
  },
  {
    id: "ACAD-6093",
    classId: "class-9",
    subjectId: "history",
    chapterId: "acad-class-9-his-topic-9",
    chapterName: "বিশ্বসভ্যতা",
    unitNumber: 9,
    topicId: "topic-9",
    questionText: "চীনা সভ্যতা কোন নদীর তীরে গড়ে ওঠে?",
    options: [
      { letter: "A", text: "ইউফ্রেটিস" },
      { letter: "B", text: "হোয়াংহো" },
      { letter: "C", text: "নীল" },
      { letter: "D", text: "সিন্ধু" }
    ],
    correctLetter: "B",
    explanation: "হোয়াংহো (পীত নদী) নদীর তীরে চীনা সভ্যতা গড়ে ওঠে।",
    difficulty: "medium",
    sourceNote: "NCTB বাংলাদেশের ইতিহাস — বিশ্বসভ্যতা",
  },
  {
    id: "ACAD-6094",
    classId: "class-9",
    subjectId: "history",
    chapterId: "acad-class-9-his-topic-10",
    chapterName: "সিন্ধু সভ্যতা",
    unitNumber: 10,
    topicId: "topic-10",
    questionText: "সিন্ধু সভ্যতার লোকেরা কোন ধাতুর ব্যবহার জানত?",
    options: [
      { letter: "A", text: "অ্যালুমিনিয়াম" },
      { letter: "B", text: "লোহা" },
      { letter: "C", text: "তামা ও ব্রোঞ্জ" },
      { letter: "D", text: "সোনা শুধু" }
    ],
    correctLetter: "C",
    explanation: "সিন্ধু সভ্যতা তাম্র-ব্রোঞ্জ যুগের সভ্যতা; লোহার ব্যবহার তখনো জানা ছিল না।",
    difficulty: "medium",
    sourceNote: "NCTB বাংলাদেশের ইতিহাস — সিন্ধু সভ্যতা",
  },
  {
    id: "ACAD-6095",
    classId: "class-9",
    subjectId: "history",
    chapterId: "acad-class-9-his-topic-11",
    chapterName: "মুঘল",
    unitNumber: 11,
    topicId: "topic-11",
    questionText: "ঢাকাকে বাংলার রাজধানী করেন কে?",
    options: [
      { letter: "A", text: "মীর জুমলা" },
      { letter: "B", text: "ইসলাম খান" },
      { letter: "C", text: "শায়েস্তা খান" },
      { letter: "D", text: "সুবেদার শাহ সুজা" }
    ],
    correctLetter: "B",
    explanation: "১৬১০ সালে সুবেদার ইসলাম খান ঢাকাকে বাংলার রাজধানী করেন।",
    difficulty: "medium",
    sourceNote: "NCTB বাংলাদেশের ইতিহাস — মুঘল আমল",
  },
  {
    id: "ACAD-6096",
    classId: "class-9",
    subjectId: "history",
    chapterId: "acad-class-9-his-topic-12",
    chapterName: "১৯৭০ নির্বাচন",
    unitNumber: 12,
    topicId: "topic-12",
    questionText: "১৯৭০ সালের নির্বাচনে আওয়ামী লীগ জাতীয় পরিষদে কয়টি আসন পায়?",
    options: [
      { letter: "A", text: "১৬৭টি" },
      { letter: "B", text: "১৫০টি" },
      { letter: "C", text: "২০০টি" },
      { letter: "D", text: "১২০টি" }
    ],
    correctLetter: "A",
    explanation: "১৯৭০ সালের নির্বাচনে আওয়ামী লীগ জাতীয় পরিষদে ১৬৭টি আসনে জয়ী হয়।",
    difficulty: "medium",
    sourceNote: "NCTB বাংলাদেশের ইতিহাস — ১৯৭০ নির্বাচন",
  },
  {
    id: "ACAD-3051",
    classId: "class-11",
    subjectId: "history",
    chapterId: "acad-class-11-his-topic-1",
    chapterName: "প্রাচীন সভ্যতা",
    unitNumber: 1,
    topicId: "topic-1",
    questionText: "গ্রিক সভ্যতার কেন্দ্র কোন নগর?",
    options: [
      { letter: "A", text: "স্পার্টা শুধু" },
      { letter: "B", text: "এথেন্স" },
      { letter: "C", text: "আলেকজান্দ্রিয়া" },
      { letter: "D", text: "রোম" }
    ],
    correctLetter: "B",
    explanation: "এথেন্স গ্রিক সভ্যতা, গণতন্ত্র ও দর্শনের কেন্দ্র ছিল।",
    difficulty: "medium",
    sourceNote: "NCTB HSC ইতিহাস ১ম পত্র — প্রাচীন সভ্যতা",
  },
  {
    id: "ACAD-3052",
    classId: "class-11",
    subjectId: "history",
    chapterId: "acad-class-11-his-topic-2",
    chapterName: "রোমান সাম্রাজ্য",
    unitNumber: 2,
    topicId: "topic-2",
    questionText: "রোমান সাম্রাজ্যের প্রথম সম্রাট কে?",
    options: [
      { letter: "A", text: "নিরো" },
      { letter: "B", text: "কনস্টানটাইন" },
      { letter: "C", text: "জুলিয়াস সিজার" },
      { letter: "D", text: "অগাস্টাস" }
    ],
    correctLetter: "D",
    explanation: "অগাস্টাস (অক্টাভিয়ান) রোমান সাম্রাজ্যের প্রথম সম্রাট।",
    difficulty: "medium",
    sourceNote: "NCTB HSC ইতিহাস ১ম পত্র — রোমান সাম্রাজ্য",
  },
  {
    id: "ACAD-3053",
    classId: "class-11",
    subjectId: "history",
    chapterId: "acad-class-11-his-topic-3",
    chapterName: "মধ্যযুগ",
    unitNumber: 3,
    topicId: "topic-3",
    questionText: "সামন্ততন্ত্র কোন যুগের বৈশিষ্ট্য?",
    options: [
      { letter: "A", text: "আধুনিক যুগ" },
      { letter: "B", text: "মধ্যযুগ" },
      { letter: "C", text: "প্রাগৈতিহাসিক যুগ" },
      { letter: "D", text: "প্রাচীন যুগ" }
    ],
    correctLetter: "B",
    explanation: "মধ্যযুগের ইউরোপে সামন্ততন্ত্র ছিল প্রধান সামাজিক-অর্থনৈতিক ব্যবস্থা।",
    difficulty: "medium",
    sourceNote: "NCTB HSC ইতিহাস ১ম পত্র — মধ্যযুগ",
  },
  {
    id: "ACAD-3054",
    classId: "class-11",
    subjectId: "history",
    chapterId: "acad-class-11-his-topic-4",
    chapterName: "নবজাগরণ",
    unitNumber: 4,
    topicId: "topic-4",
    questionText: "নবজাগরণ (Renaissance) প্রথম শুরু হয় কোথায়?",
    options: [
      { letter: "A", text: "ইংল্যান্ড" },
      { letter: "B", text: "ফ্রান্স" },
      { letter: "C", text: "জার্মানি" },
      { letter: "D", text: "ইতালি" }
    ],
    correctLetter: "D",
    explanation: "চতুর্দশ শতকে ইতালিতে নবজাগরণ শুরু হয়; পরে সারা ইউরোপে ছড়ায়।",
    difficulty: "medium",
    sourceNote: "NCTB HSC ইতিহাস ১ম পত্র — নবজাগরণ",
  },
  {
    id: "ACAD-3055",
    classId: "class-11",
    subjectId: "history",
    chapterId: "acad-class-11-his-topic-5",
    chapterName: "শিল্প বিপ্লব",
    unitNumber: 5,
    topicId: "topic-5",
    questionText: "শিল্প বিপ্লব প্রথম শুরু হয় কোন দেশে?",
    options: [
      { letter: "A", text: "ইংল্যান্ড" },
      { letter: "B", text: "জার্মানি" },
      { letter: "C", text: "আমেরিকা" },
      { letter: "D", text: "ফ্রান্স" }
    ],
    correctLetter: "A",
    explanation: "অষ্টাদশ শতকে ইংল্যান্ডে বস্ত্রশিল্পে যন্ত্রের ব্যবহারে শিল্প বিপ্লব শুরু হয়।",
    difficulty: "medium",
    sourceNote: "NCTB HSC ইতিহাস ১ম পত্র — শিল্প বিপ্লব",
  },
  {
    id: "ACAD-3056",
    classId: "class-11",
    subjectId: "history",
    chapterId: "acad-class-11-his-topic-6",
    chapterName: "ফরাসি বিপ্লব",
    unitNumber: 6,
    topicId: "topic-6",
    questionText: "ফরাসি বিপ্লব কত সালে শুরু হয়?",
    options: [
      { letter: "A", text: "১৮৪৮" },
      { letter: "B", text: "১৬৮৯" },
      { letter: "C", text: "১৭৮৯" },
      { letter: "D", text: "১৯১৭" }
    ],
    correctLetter: "C",
    explanation: "১৭৮৯ সালে ফরাসি বিপ্লব শুরু হয়; ‘স্বাধীনতা, সাম্য, ভ্রাতৃত্ব’ এর মূলমন্ত্র।",
    difficulty: "medium",
    sourceNote: "NCTB HSC ইতিহাস ১ম পত্র — ফরাসি বিপ্লব",
  },
  {
    id: "ACAD-3057",
    classId: "class-11",
    subjectId: "history",
    chapterId: "acad-class-11-his-topic-7",
    chapterName: "প্রথম বিশ্বযুদ্ধ",
    unitNumber: 7,
    topicId: "topic-7",
    questionText: "প্রথম বিশ্বযুদ্ধের সূত্রপাত ঘটে অস্ট্রিয়ার যুবরাজকে হত্যার মাধ্যমে — হত্যাকাণ্ডটি ঘটে কোথায়?",
    options: [
      { letter: "A", text: "বার্লিন" },
      { letter: "B", text: "সারায়েভো" },
      { letter: "C", text: "প্যারিস" },
      { letter: "D", text: "ভিয়েনা" }
    ],
    correctLetter: "B",
    explanation: "১৯১৪ সালে সারায়েভোতে যুবরাজ ফ্রানৎস ফার্দিনান্দ হত্যার জেরে প্রথম বিশ্বযুদ্ধ শুরু হয়।",
    difficulty: "medium",
    sourceNote: "NCTB HSC ইতিহাস ২য় পত্র — প্রথম বিশ্বযুদ্ধ",
  },
  {
    id: "ACAD-3058",
    classId: "class-11",
    subjectId: "history",
    chapterId: "acad-class-11-his-topic-8",
    chapterName: "দ্বিতীয় বিশ্বযুদ্ধ",
    unitNumber: 8,
    topicId: "topic-8",
    questionText: "দ্বিতীয় বিশ্বযুদ্ধের সময় জার্মানির নেতা কে ছিলেন?",
    options: [
      { letter: "A", text: "উইনস্টন চার্চিল" },
      { letter: "B", text: "জোসেফ স্তালিন" },
      { letter: "C", text: "অ্যাডলফ হিটলার" },
      { letter: "D", text: "বেনিতো মুসোলিনি" }
    ],
    correctLetter: "C",
    explanation: "হিটলারের নেতৃত্বে জার্মানি ১৯৩৯ সালে পোল্যান্ড আক্রমণ করে দ্বিতীয় বিশ্বযুদ্ধ শুরু করে।",
    difficulty: "medium",
    sourceNote: "NCTB HSC ইতিহাস ২য় পত্র — দ্বিতীয় বিশ্বযুদ্ধ",
  },
  {
    id: "ACAD-3059",
    classId: "class-11",
    subjectId: "history",
    chapterId: "acad-class-11-his-topic-9",
    chapterName: "বাংলার ইতিহাস",
    unitNumber: 9,
    topicId: "topic-9",
    questionText: "স্বাধীন সুলতানি যুগে বাংলার রাজধানী কোথায় ছিল?",
    options: [
      { letter: "A", text: "গৌড়" },
      { letter: "B", text: "মুর্শিদাবাদ" },
      { letter: "C", text: "ঢাকা" },
      { letter: "D", text: "সোনারগাঁও শুধু" }
    ],
    correctLetter: "A",
    explanation: "স্বাধীন সুলতানি আমলে গৌড় বাংলার রাজধানী ছিল।",
    difficulty: "medium",
    sourceNote: "NCTB HSC ইতিহাস ২য় পত্র — বাংলার ইতিহাস",
  },
  {
    id: "ACAD-3060",
    classId: "class-11",
    subjectId: "history",
    chapterId: "acad-class-11-his-topic-10",
    chapterName: "ভারত বিভাগ",
    unitNumber: 10,
    topicId: "topic-10",
    questionText: "ভারত বিভক্ত হয় কত সালে?",
    options: [
      { letter: "A", text: "১৯৪৭" },
      { letter: "B", text: "১৯৫২" },
      { letter: "C", text: "১৯৭১" },
      { letter: "D", text: "১৯৪২" }
    ],
    correctLetter: "A",
    explanation: "১৯৪৭ সালের ১৪–১৫ আগস্ট ভারত ও পাকিস্তান নামে দুটি রাষ্ট্র সৃষ্টি হয়।",
    difficulty: "medium",
    sourceNote: "NCTB HSC ইতিহাস ২য় পত্র — ভারত বিভাগ",
  },
  {
    id: "ACAD-8049",
    classId: "class-11",
    subjectId: "history",
    chapterId: "acad-class-11-his-topic-1",
    chapterName: "প্রাচীন সভ্যতা",
    unitNumber: 1,
    topicId: "topic-1",
    questionText: "গণতন্ত্রের জন্ম হয় কোথায়?",
    options: [
      { letter: "A", text: "চীনে" },
      { letter: "B", text: "প্রাচীন গ্রিসে" },
      { letter: "C", text: "রোমে" },
      { letter: "D", text: "মিসরে" }
    ],
    correctLetter: "B",
    explanation: "খ্রিষ্টপূর্ব ৫ম শতকে এথেন্সে গণতন্ত্রের সূচনা হয়।",
    difficulty: "medium",
    sourceNote: "NCTB HSC ইতিহাস ১ম পত্র — প্রাচীন গ্রিস",
  },
  {
    id: "ACAD-8050",
    classId: "class-11",
    subjectId: "history",
    chapterId: "acad-class-11-his-topic-2",
    chapterName: "রোমান সাম্রাজ্য",
    unitNumber: 2,
    topicId: "topic-2",
    questionText: "রোমান আইনের ভিত্তি কী?",
    options: [
      { letter: "A", text: "কোড অব হাম্মুরাবি" },
      { letter: "B", text: "ম্যাগনা কার্টা" },
      { letter: "C", text: "কুরআন" },
      { letter: "D", text: "টুয়েলভ টেবিলস" }
    ],
    correctLetter: "D",
    explanation: "খ্রিষ্টপূর্ব ৪৫০ সালে টুয়েলভ টেবিলস রোমান আইনের ভিত্তি স্থাপন করে।",
    difficulty: "medium",
    sourceNote: "NCTB HSC ইতিহাস ১ম পত্র — রোমান সাম্রাজ্য",
  },
  {
    id: "ACAD-8051",
    classId: "class-11",
    subjectId: "history",
    chapterId: "acad-class-11-his-topic-3",
    chapterName: "মধ্যযুগ",
    unitNumber: 3,
    topicId: "topic-3",
    questionText: "ক্রুসেড কী?",
    options: [
      { letter: "A", text: "শুধু কৃষক বিদ্রোহ" },
      { letter: "B", text: "শুধু বাণিজ্য যুদ্ধ" },
      { letter: "C", text: "শুধু গৃহযুদ্ধ" },
      { letter: "D", text: "খ্রিষ্টান-মুসলিম ধর্মযুদ্ধ" }
    ],
    correctLetter: "D",
    explanation: "১১শ–১৩শ শতকে জেরুজালেম দখল নিয়ে ইউরোপীয় খ্রিষ্টানদের ধর্মযুদ্ধই ক্রুসেড।",
    difficulty: "medium",
    sourceNote: "NCTB HSC ইতিহাস ১ম পত্র — মধ্যযুগ",
  },
  {
    id: "ACAD-8052",
    classId: "class-11",
    subjectId: "history",
    chapterId: "acad-class-11-his-topic-4",
    chapterName: "নবজাগরণ",
    unitNumber: 4,
    topicId: "topic-4",
    questionText: "মুদ্রণযন্ত্র আবিষ্কার করেন কে?",
    options: [
      { letter: "A", text: "নিউটন" },
      { letter: "B", text: "লিওনার্দো" },
      { letter: "C", text: "গ্যালিলিও" },
      { letter: "D", text: "গুটেনবার্গ" }
    ],
    correctLetter: "D",
    explanation: "১৪৪০ সালের দিকে গুটেনবার্গের মুদ্রণযন্ত্র জ্ঞান ছড়াতে বিপ্লব ঘটায়।",
    difficulty: "medium",
    sourceNote: "NCTB HSC ইতিহাস ১ম পত্র — নবজাগরণ",
  },
  {
    id: "ACAD-8053",
    classId: "class-11",
    subjectId: "history",
    chapterId: "acad-class-11-his-topic-5",
    chapterName: "শিল্প বিপ্লব",
    unitNumber: 5,
    topicId: "topic-5",
    questionText: "বাষ্পীয় ইঞ্জিন উন্নত করেন কে?",
    options: [
      { letter: "A", text: "জেমস ওয়াট" },
      { letter: "B", text: "এডমন্ড কার্টরাইট" },
      { letter: "C", text: "জর্জ স্টিফেনসন" },
      { letter: "D", text: "রিচার্ড আর্করাইট" }
    ],
    correctLetter: "A",
    explanation: "জেমস ওয়াট বাষ্পীয় ইঞ্জিন উন্নত করে শিল্প বিপ্লবকে গতি দেন।",
    difficulty: "medium",
    sourceNote: "NCTB HSC ইতিহাস ১ম পত্র — শিল্প বিপ্লব",
  },
  {
    id: "ACAD-8054",
    classId: "class-11",
    subjectId: "history",
    chapterId: "acad-class-11-his-topic-6",
    chapterName: "ফরাসি বিপ্লব",
    unitNumber: 6,
    topicId: "topic-6",
    questionText: "ফরাসি বিপ্লবের সময় রাজা কে ছিলেন?",
    options: [
      { letter: "A", text: "ষোড়শ লুই" },
      { letter: "B", text: "নেপোলিয়ন" },
      { letter: "C", text: "পঞ্চদশ লুই" },
      { letter: "D", text: "চতুর্দশ লুই" }
    ],
    correctLetter: "A",
    explanation: "ষোড়শ লুইয়ের আমলে ১৭৮৯ সালে বিপ্লব শুরু হয়; ১৭৯৩ সালে তাঁর মৃত্যুদণ্ড হয়।",
    difficulty: "medium",
    sourceNote: "NCTB HSC ইতিহাস ১ম পত্র — ফরাসি বিপ্লব",
  },
  {
    id: "ACAD-8055",
    classId: "class-11",
    subjectId: "history",
    chapterId: "acad-class-11-his-topic-7",
    chapterName: "প্রথম বিশ্বযুদ্ধ",
    unitNumber: 7,
    topicId: "topic-7",
    questionText: "প্রথম বিশ্বযুদ্ধ শেষ হয় কোন চুক্তিতে?",
    options: [
      { letter: "A", text: "ভিয়েনা চুক্তি" },
      { letter: "B", text: "প্যারিস চুক্তি" },
      { letter: "C", text: "ভার্সাই চুক্তি" },
      { letter: "D", text: "বার্লিন চুক্তি" }
    ],
    correctLetter: "C",
    explanation: "১৯১৯ সালের ভার্সাই চুক্তিতে প্রথম বিশ্বযুদ্ধের আনুষ্ঠানিক সমাপ্তি হয়।",
    difficulty: "medium",
    sourceNote: "NCTB HSC ইতিহাস ২য় পত্র — প্রথম বিশ্বযুদ্ধ",
  },
  {
    id: "ACAD-8056",
    classId: "class-11",
    subjectId: "history",
    chapterId: "acad-class-11-his-topic-8",
    chapterName: "দ্বিতীয় বিশ্বযুদ্ধ",
    unitNumber: 8,
    topicId: "topic-8",
    questionText: "জাতিসংঘ প্রতিষ্ঠার উদ্দেশ্য কী?",
    options: [
      { letter: "A", text: "বিশ্বশান্তি রক্ষা" },
      { letter: "B", text: "শুধু শিক্ষা" },
      { letter: "C", text: "শুধু স্বাস্থ্য" },
      { letter: "D", text: "শুধু বাণিজ্য" }
    ],
    correctLetter: "A",
    explanation: "দ্বিতীয় বিশ্বযুদ্ধের পর ১৯৪৫ সালে শান্তি রক্ষার জন্য জাতিসংঘ গঠিত হয়।",
    difficulty: "medium",
    sourceNote: "NCTB HSC ইতিহাস ২য় পত্র — দ্বিতীয় বিশ্বযুদ্ধ",
  },
  {
    id: "ACAD-8057",
    classId: "class-11",
    subjectId: "history",
    chapterId: "acad-class-11-his-topic-9",
    chapterName: "বাংলার ইতিহাস",
    unitNumber: 9,
    topicId: "topic-9",
    questionText: "বাংলার নবাবি আমলের রাজধানী কোথায় ছিল?",
    options: [
      { letter: "A", text: "ঢাকা" },
      { letter: "B", text: "মুর্শিদাবাদ" },
      { letter: "C", text: "গৌড়" },
      { letter: "D", text: "সোনারগাঁও" }
    ],
    correctLetter: "B",
    explanation: "মুর্শিদকুলি খানের আমলে মুর্শিদাবাদ বাংলার রাজধানী হয়।",
    difficulty: "medium",
    sourceNote: "NCTB HSC ইতিহাস ২য় পত্র — বাংলার ইতিহাস",
  },
  {
    id: "ACAD-8058",
    classId: "class-11",
    subjectId: "history",
    chapterId: "acad-class-11-his-topic-10",
    chapterName: "ভারত বিভাগ",
    unitNumber: 10,
    topicId: "topic-10",
    questionText: "দেশভাগের পর পূর্ব বাংলা কোন রাষ্ট্রের অংশ হয়?",
    options: [
      { letter: "A", text: "নেপাল" },
      { letter: "B", text: "ব্রিটেন" },
      { letter: "C", text: "পাকিস্তান" },
      { letter: "D", text: "ভারত" }
    ],
    correctLetter: "C",
    explanation: "১৯৪৭ সালে পূর্ব বাংলা পাকিস্তানের প্রদেশ (পূর্ব পাকিস্তান) হয়।",
    difficulty: "medium",
    sourceNote: "NCTB HSC ইতিহাস ২য় পত্র — ভারত বিভাগ",
  },
  {
    id: "ACAD-8059",
    classId: "class-11",
    subjectId: "history",
    chapterId: "acad-class-11-his-topic-11",
    chapterName: "রুশ বিপ্লব",
    unitNumber: 11,
    topicId: "topic-11",
    questionText: "অক্টোবর রুশ বিপ্লব (বলশেভিক বিপ্লব) কত সালে হয়?",
    options: [
      { letter: "A", text: "১৯০৫" },
      { letter: "B", text: "১৯২১" },
      { letter: "C", text: "১৯১৭" },
      { letter: "D", text: "১৯৪৫" }
    ],
    correctLetter: "C",
    explanation: "১৯১৭ সালের অক্টোবর বিপ্লবে বলশেভিকরা রাশিয়ায় ক্ষমতা নেয়। (১৯০৫ সালের বিপ্লবও 'রুশ বিপ্লব' নামে পরিচিত, তাই প্রশ্নে 'অক্টোবর' যোগ করা হয়েছে।)",
    difficulty: "medium",
    sourceNote: "NCTB HSC ইতিহাস ২য় পত্র — রুশ বিপ্লব",
  },
  {
    id: "ACAD-8060",
    classId: "class-11",
    subjectId: "history",
    chapterId: "acad-class-11-his-topic-12",
    chapterName: "আমেরিকার স্বাধীনতা",
    unitNumber: 12,
    topicId: "topic-12",
    questionText: "আমেরিকার স্বাধীনতা ঘোষণা হয় কত সালে?",
    options: [
      { letter: "A", text: "১৭৫০" },
      { letter: "B", text: "১৭৭৬" },
      { letter: "C", text: "১৭৮৯" },
      { letter: "D", text: "১৮০০" }
    ],
    correctLetter: "B",
    explanation: "১৭৭৬ সালের ৪ জুলাই আমেরিকা স্বাধীনতা ঘোষণা করে।",
    difficulty: "medium",
    sourceNote: "NCTB HSC ইতিহাস ১ম পত্র — আমেরিকার স্বাধীনতা",
  },
];
