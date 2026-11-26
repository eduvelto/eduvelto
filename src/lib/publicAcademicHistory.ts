// Eduvelto — Academic History practice questions (Class 9),
// verified against the Dakhil NCTB books (review 26 Nov 2026).
//
// Static data ONLY — zero Firestore reads. The 21 questions are the
// Academic Class 9 History drafts AFTER review (see
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

import { type PublicAcademicQuestion } from './publicAcademic';

/** All verified Academic History questions, Class 9 (in draft order). */
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
];
