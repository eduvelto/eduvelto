// Eduvelto — Academic Bangla 1st Paper practice questions (Class 9),
// verified against the Dakhil NCTB books (review 26 Nov 2026).
//
// Static data ONLY — zero Firestore reads. The 21 questions are the
// Academic Class 9 Bangla 1st Paper drafts AFTER review (see
// review-academic-c9-bangla-1st-verdicts.json and
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
// to PUBLIC_ACADEMIC_BANGLA_1ST_QUESTIONS below (same shape, same generation
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

/** All verified Academic Bangla 1st Paper questions, Class 9 (in draft order). */
export const PUBLIC_ACADEMIC_BANGLA_1ST_QUESTIONS: PublicAcademicQuestion[] = [
  {
    id: "ACAD-0001",
    classId: "class-9",
    subjectId: "bangla-1st",
    chapterId: "acad-class-9-ban-1st-topic-1",
    chapterName: "গদ্য — বইপড়া",
    unitNumber: 1,
    topicId: "topic-1",
    questionText: "‘বইপড়া’ প্রবন্ধটির লেখক কে?",
    options: [
      { letter: "A", text: "কাজী নজরুল ইসলাম" },
      { letter: "B", text: "প্রমথ চৌধুরী" },
      { letter: "C", text: "বঙ্কিমচন্দ্র চট্টোপাধ্যায়" },
      { letter: "D", text: "রবীন্দ্রনাথ ঠাকুর" }
    ],
    correctLetter: "B",
    explanation: "‘বইপড়া’ প্রমথ চৌধুরীর লেখা প্রবন্ধ; এতে বই পড়ার আনন্দ ও প্রয়োজনীয়তার কথা বলা হয়েছে।",
    difficulty: "easy",
    sourceNote: "NCTB বাংলা সাহিত্য, নবম-দশম শ্রেণি — গদ্য: বইপড়া",
  },
  {
    id: "ACAD-0002",
    classId: "class-9",
    subjectId: "bangla-1st",
    chapterId: "acad-class-9-ban-1st-topic-2",
    chapterName: "গদ্য — অভাগীর স্বর্গ",
    unitNumber: 2,
    topicId: "topic-2",
    questionText: "‘অভাগীর স্বর্গ’ গল্পে অভাগীর ছেলের নাম কী?",
    options: [
      { letter: "A", text: "নিবারণ" },
      { letter: "B", text: "রাখাল" },
      { letter: "C", text: "গদাধর" },
      { letter: "D", text: "কাঙালী" }
    ],
    correctLetter: "D",
    explanation: "শরৎচন্দ্র চট্টোপাধ্যায়ের ‘অভাগীর স্বর্গ’ গল্পে অভাগীর ছেলে কাঙালী; মায়ের শেষ ইচ্ছা পূরণের চেষ্টাই গল্পের মূল।",
    difficulty: "medium",
    sourceNote: "NCTB বাংলা সাহিত্য, নবম-দশম শ্রেণি — গদ্য: অভাগীর স্বর্গ",
  },
  {
    id: "ACAD-0003",
    classId: "class-9",
    subjectId: "bangla-1st",
    chapterId: "acad-class-9-ban-1st-topic-3",
    chapterName: "কবিতা — মানুষ",
    unitNumber: 3,
    topicId: "topic-3",
    questionText: "‘মানুষ’ কবিতাটি কে লিখেছেন?",
    options: [
      { letter: "A", text: "কাজী নজরুল ইসলাম" },
      { letter: "B", text: "জীবনানন্দ দাশ" },
      { letter: "C", text: "সুকান্ত ভট্টাচার্য" },
      { letter: "D", text: "জসীমউদ্দীন" }
    ],
    correctLetter: "A",
    explanation: "‘মানুষ’ কবিতা কাজী নজরুল ইসলামের লেখা; এতে ধর্ম-বর্ণের ঊর্ধ্বে মানুষের মর্যাদার কথা বলা হয়েছে।",
    difficulty: "easy",
    sourceNote: "NCTB বাংলা সাহিত্য, নবম-দশম শ্রেণি — কবিতা: মানুষ",
  },
  {
    id: "ACAD-0004",
    classId: "class-9",
    subjectId: "bangla-1st",
    chapterId: "acad-class-9-ban-1st-topic-4",
    chapterName: "কবিতা — কবর",
    unitNumber: 4,
    topicId: "topic-4",
    questionText: "‘কবর’ কবিতার কবি কে?",
    options: [
      { letter: "A", text: "ফররুখ আহমদ" },
      { letter: "B", text: "আহসান হাবীব" },
      { letter: "C", text: "জসীমউদ্দীন" },
      { letter: "D", text: "রবীন্দ্রনাথ ঠাকুর" }
    ],
    correctLetter: "C",
    explanation: "‘কবর’ জসীমউদ্দীনের বিখ্যাত কবিতা; দাদুর মুখে মৃত স্বজনদের স্মৃতিকথা কবিতাটির বিষয়।",
    difficulty: "medium",
    sourceNote: "NCTB বাংলা সাহিত্য (সাধারণ শিক্ষা সংস্করণ), নবম-দশম শ্রেণি — কবিতা: কবর (জসীমউদ্দীন)",
  },
  {
    id: "ACAD-0005",
    classId: "class-9",
    subjectId: "bangla-1st",
    chapterId: "acad-class-9-ban-1st-topic-5",
    chapterName: "কবিতা — আমার পরিচয়",
    unitNumber: 5,
    topicId: "topic-5",
    questionText: "‘আমার পরিচয়’ কবিতায় কবি নিজেকে কীসের সন্তান বলে পরিচয় দিয়েছেন?",
    options: [
      { letter: "A", text: "পদ্মার" },
      { letter: "B", text: "হিমালয়ের" },
      { letter: "C", text: "বাংলার" },
      { letter: "D", text: "সাগরের" }
    ],
    correctLetter: "C",
    explanation: "সৈয়দ শামসুল হকের ‘আমার পরিচয়’ কবিতায় কবি নিজেকে বাংলার সন্তান বলে গর্বের সঙ্গে পরিচয় দিয়েছেন।",
    difficulty: "easy",
    sourceNote: "NCTB বাংলা সাহিত্য (সাধারণ শিক্ষা সংস্করণ), নবম-দশম শ্রেণি — কবিতা: আমার পরিচয় (সৈয়দ শামসুল হক)",
  },
  {
    id: "ACAD-0006",
    classId: "class-9",
    subjectId: "bangla-1st",
    chapterId: "acad-class-9-ban-1st-topic-6",
    chapterName: "গদ্য — শিক্ষা ও মনুষ্যত্ব",
    unitNumber: 6,
    topicId: "topic-6",
    questionText: "‘শিক্ষা ও মনুষ্যত্ব’ প্রবন্ধের লেখক কে?",
    options: [
      { letter: "A", text: "মোতাহের হোসেন চৌধুরী" },
      { letter: "B", text: "প্রমথ চৌধুরী" },
      { letter: "C", text: "আবুল ফজল" },
      { letter: "D", text: "গোলাম মোস্তফা" }
    ],
    correctLetter: "A",
    explanation: "‘শিক্ষা ও মনুষ্যত্ব’ মোতাহের হোসেন চৌধুরীর প্রবন্ধ; প্রকৃত শিক্ষা যে মনুষ্যত্বের বিকাশ ঘটায়, এটাই এর মূল বক্তব্য।",
    difficulty: "medium",
    sourceNote: "NCTB বাংলা সাহিত্য, নবম-দশম শ্রেণি — গদ্য: শিক্ষা ও মনুষ্যত্ব",
  },
  {
    id: "ACAD-0007",
    classId: "class-9",
    subjectId: "bangla-1st",
    chapterId: "acad-class-9-ban-1st-topic-7",
    chapterName: "উপন্যাস — কাকতাড়ুয়া",
    unitNumber: 7,
    topicId: "topic-7",
    questionText: "‘কাকতাড়ুয়া’ উপন্যাসটির লেখক কে?",
    options: [
      { letter: "A", text: "আখতারুজ্জামান ইলিয়াস" },
      { letter: "B", text: "সেলিনা হোসেন" },
      { letter: "C", text: "হুমায়ূন আহমেদ" },
      { letter: "D", text: "শওকত ওসমান" }
    ],
    correctLetter: "B",
    explanation: "‘কাকতাড়ুয়া’ সেলিনা হোসেনের মুক্তিযুদ্ধভিত্তিক কিশোর উপন্যাস; বুধা চরিত্রটি এর কেন্দ্রে।",
    difficulty: "medium",
    sourceNote: "NCTB বাংলা সহপাঠ, নবম-দশম শ্রেণি — উপন্যাস: কাকতাড়ুয়া",
  },
  {
    id: "ACAD-0008",
    classId: "class-9",
    subjectId: "bangla-1st",
    chapterId: "acad-class-9-ban-1st-topic-8",
    chapterName: "নাটক — বহিপীর",
    unitNumber: 8,
    topicId: "topic-8",
    questionText: "‘বহিপীর’ নাটকের রচয়িতা কে?",
    options: [
      { letter: "A", text: "সৈয়দ ওয়ালীউল্লাহ" },
      { letter: "B", text: "আবদুল্লাহ আল-মামুন" },
      { letter: "C", text: "নূরুল মোমেন" },
      { letter: "D", text: "মুনীর চৌধুরী" }
    ],
    correctLetter: "A",
    explanation: "‘বহিপীর’ সৈয়দ ওয়ালীউল্লাহর নাটক; পীর-ফকিরের ভণ্ডামি ও গ্রামীণ সমাজের কুসংস্কার এর বিষয়।",
    difficulty: "medium",
    sourceNote: "NCTB বাংলা সহপাঠ, নবম-দশম শ্রেণি — নাটক: বহিপীর",
  },
  {
    id: "ACAD-0009",
    classId: "class-9",
    subjectId: "bangla-1st",
    chapterId: "acad-class-9-ban-1st-topic-9",
    chapterName: "কবিতা — স্বাধীনতা, এ শব্দটি কীভাবে আমাদের হলো",
    unitNumber: 9,
    topicId: "topic-9",
    questionText: "‘স্বাধীনতা, এ শব্দটি কীভাবে আমাদের হলো’ কবিতাটির কবি কে?",
    options: [
      { letter: "A", text: "আল মাহমুদ" },
      { letter: "B", text: "শামসুর রাহমান" },
      { letter: "C", text: "সৈয়দ শামসুল হক" },
      { letter: "D", text: "নির্মলেন্দু গুণ" }
    ],
    correctLetter: "D",
    explanation: "কবিতাটি নির্মলেন্দু গুণের লেখা; বঙ্গবন্ধুর ৭ই মার্চের ভাষণ ও স্বাধীনতার ইতিহাস এর পটভূমি।",
    difficulty: "medium",
    sourceNote: "NCTB বাংলা সাহিত্য (সাধারণ শিক্ষা সংস্করণ), নবম-দশম শ্রেণি — কবিতা: স্বাধীনতা, এ শব্দটি কীভাবে আমাদের হলো (নির্মলেন্দু গুণ)",
  },
  {
    id: "ACAD-0010",
    classId: "class-9",
    subjectId: "bangla-1st",
    chapterId: "acad-class-9-ban-1st-topic-10",
    chapterName: "গদ্য — একাত্তরের দিনগুলি",
    unitNumber: 10,
    topicId: "topic-10",
    questionText: "‘একাত্তরের দিনগুলি’ গ্রন্থের লেখক কে?",
    options: [
      { letter: "A", text: "সুফিয়া কামাল" },
      { letter: "B", text: "সেলিনা হোসেন" },
      { letter: "C", text: "রাবেয়া খাতুন" },
      { letter: "D", text: "জাহানারা ইমাম" }
    ],
    correctLetter: "D",
    explanation: "‘একাত্তরের দিনগুলি’ জাহানারা ইমামের স্মৃতিকথামূলক গ্রন্থ; মুক্তিযুদ্ধের দিনগুলোর অভিজ্ঞতা এতে লিপিবদ্ধ।",
    difficulty: "easy",
    sourceNote: "NCTB বাংলা সাহিত্য, নবম-দশম শ্রেণি — গদ্য: একাত্তরের দিনগুলি",
  },
  {
    id: "ACAD-5001",
    classId: "class-9",
    subjectId: "bangla-1st",
    chapterId: "acad-class-9-ban-1st-topic-11",
    chapterName: "গদ্য — সুভা",
    unitNumber: 11,
    topicId: "topic-11",
    questionText: "‘সুভা’ গল্পে সুভার বাবার নাম কী?",
    options: [
      { letter: "A", text: "বাণীকণ্ঠ" },
      { letter: "B", text: "গদাধর" },
      { letter: "C", text: "নিবারণ" },
      { letter: "D", text: "প্রতাপ" }
    ],
    correctLetter: "A",
    explanation: "বাণীকণ্ঠের মেয়ে সুভা; বাকপ্রতিবন্ধী মেয়ের প্রতি বাবার স্নেহ গল্পে ফুটে উঠেছে।",
    difficulty: "medium",
    sourceNote: "NCTB বাংলা সাহিত্য — গদ্য: সুভা",
  },
  {
    id: "ACAD-5002",
    classId: "class-9",
    subjectId: "bangla-1st",
    chapterId: "acad-class-9-ban-1st-topic-12",
    chapterName: "গদ্য — পল্লীসাহিত্য",
    unitNumber: 12,
    topicId: "topic-12",
    questionText: "‘পল্লীসাহিত্য’ প্রবন্ধের লেখক কে?",
    options: [
      { letter: "A", text: "মুহম্মদ শহীদুল্লাহ" },
      { letter: "B", text: "আবুল ফজল" },
      { letter: "C", text: "প্রমথ চৌধুরী" },
      { letter: "D", text: "গোলাম মোস্তফা" }
    ],
    correctLetter: "A",
    explanation: "মুহম্মদ শহীদুল্লাহর ‘পল্লীসাহিত্য’ প্রবন্ধে গ্রামীণ সাহিত্যের গুরুত্ব বলা হয়েছে।",
    difficulty: "medium",
    sourceNote: "NCTB বাংলা সাহিত্য — গদ্য: পল্লীসাহিত্য",
  },
  {
    id: "ACAD-5003",
    classId: "class-9",
    subjectId: "bangla-1st",
    chapterId: "acad-class-9-ban-1st-topic-13",
    chapterName: "কবিতা — রানার",
    unitNumber: 13,
    topicId: "topic-13",
    questionText: "‘রানার’ কবিতার কবি কে?",
    options: [
      { letter: "A", text: "আহসান হাবীব" },
      { letter: "B", text: "কাজী নজরুল ইসলাম" },
      { letter: "C", text: "সুকান্ত ভট্টাচার্য" },
      { letter: "D", text: "জসীমউদ্দীন" }
    ],
    correctLetter: "C",
    explanation: "‘রানার’ সুকান্তের কবিতা; ডাকহরকরা রানারের পরিশ্রম ও সংগ্রাম এর বিষয়।",
    difficulty: "easy",
    sourceNote: "NCTB বাংলা সাহিত্য — কবিতা: রানার",
  },
  {
    id: "ACAD-5004",
    classId: "class-9",
    subjectId: "bangla-1st",
    chapterId: "acad-class-9-ban-1st-topic-14",
    chapterName: "কবিতা — বঙ্গবাণী",
    unitNumber: 14,
    topicId: "topic-14",
    questionText: "‘বঙ্গবাণী’ কবিতার কবি কে?",
    options: [
      { letter: "A", text: "দৌলত কাজী" },
      { letter: "B", text: "আবদুল হাকিম" },
      { letter: "C", text: "মুহম্মদ শহীদুল্লাহ" },
      { letter: "D", text: "আলাওল" }
    ],
    correctLetter: "B",
    explanation: "আবদুল হাকিমের ‘বঙ্গবাণী’ কবিতায় বাংলা ভাষার প্রতি ভালোবাসা প্রকাশ পেয়েছে।",
    difficulty: "medium",
    sourceNote: "NCTB বাংলা সাহিত্য — কবিতা: বঙ্গবাণী",
  },
  {
    id: "ACAD-5006",
    classId: "class-9",
    subjectId: "bangla-1st",
    chapterId: "acad-class-9-ban-1st-topic-15",
    chapterName: "গদ্য — মমতাদি",
    unitNumber: 15,
    topicId: "topic-15",
    questionText: "‘মমতাদি’ গল্পের লেখক কে?",
    options: [
      { letter: "A", text: "তারাশঙ্কর বন্দ্যোপাধ্যায়" },
      { letter: "B", text: "মানিক বন্দ্যোপাধ্যায়" },
      { letter: "C", text: "বিভূতিভূষণ বন্দ্যোপাধ্যায়" },
      { letter: "D", text: "শরৎচন্দ্র চট্টোপাধ্যায়" }
    ],
    correctLetter: "B",
    explanation: "‘মমতাদি’ মানিক বন্দ্যোপাধ্যায়ের গল্প; গৃহকর্মী মমতাদির জীবন এর বিষয়।",
    difficulty: "medium",
    sourceNote: "NCTB বাংলা সাহিত্য — গদ্য: মমতাদি",
  },
  {
    id: "ACAD-5007",
    classId: "class-9",
    subjectId: "bangla-1st",
    chapterId: "acad-class-9-ban-1st-topic-16",
    chapterName: "কবিতা — জীবন-সঙ্গীত",
    unitNumber: 16,
    topicId: "topic-16",
    questionText: "‘জীবন-সঙ্গীত’ কবিতার কবি কে?",
    options: [
      { letter: "A", text: "বিহারীলাল চক্রবর্তী" },
      { letter: "B", text: "হেমচন্দ্র বন্দ্যোপাধ্যায়" },
      { letter: "C", text: "মাইকেল মধুসূদন দত্ত" },
      { letter: "D", text: "নবীনচন্দ্র সেন" }
    ],
    correctLetter: "B",
    explanation: "হেমচন্দ্রের ‘জীবন-সঙ্গীত’ কবিতায় জীবনকে কর্ম ও সংগ্রামের গান বলা হয়েছে।",
    difficulty: "medium",
    sourceNote: "NCTB বাংলা সাহিত্য — কবিতা: জীবন-সঙ্গীত",
  },
  {
    id: "ACAD-5008",
    classId: "class-9",
    subjectId: "bangla-1st",
    chapterId: "acad-class-9-ban-1st-topic-17",
    chapterName: "গদ্য — নিমগাছ",
    unitNumber: 17,
    topicId: "topic-17",
    questionText: "‘নিমগাছ’ গল্পের লেখক কে?",
    options: [
      { letter: "A", text: "মানিক বন্দ্যোপাধ্যায়" },
      { letter: "B", text: "বিভূতিভূষণ বন্দ্যোপাধ্যায়" },
      { letter: "C", text: "বনফুল" },
      { letter: "D", text: "শরৎচন্দ্র চট্টোপাধ্যায়" }
    ],
    correctLetter: "C",
    explanation: "বনফুলের (বলাইচাঁদ মুখোপাধ্যায়) ‘নিমগাছ’ গল্পে গাছের নিঃস্বার্থ সেবার সঙ্গে গৃহবধূর জীবনের তুলনা আছে।",
    difficulty: "easy",
    sourceNote: "NCTB বাংলা সাহিত্য — গদ্য: নিমগাছ",
  },
  {
    id: "ACAD-5009",
    classId: "class-9",
    subjectId: "bangla-1st",
    chapterId: "acad-class-9-ban-1st-topic-18",
    chapterName: "কবিতা — আশা",
    unitNumber: 18,
    topicId: "topic-18",
    questionText: "‘আশা’ কবিতার কবি কে?",
    options: [
      { letter: "A", text: "আল মাহমুদ" },
      { letter: "B", text: "শামসুর রাহমান" },
      { letter: "C", text: "নির্মলেন্দু গুণ" },
      { letter: "D", text: "সিকান্দার আবু জাফর" }
    ],
    correctLetter: "D",
    explanation: "‘আশা’ সিকান্দার আবু জাফরের কবিতা; আশাই মানুষকে বাঁচিয়ে রাখে।",
    difficulty: "easy",
    sourceNote: "NCTB বাংলা সাহিত্য — কবিতা: আশা",
  },
  {
    id: "ACAD-5010",
    classId: "class-9",
    subjectId: "bangla-1st",
    chapterId: "acad-class-9-ban-1st-topic-19",
    chapterName: "উপন্যাস — হাজার বছর ধরে",
    unitNumber: 19,
    topicId: "topic-19",
    questionText: "‘হাজার বছর ধরে’ উপন্যাসটি কোন সালে প্রকাশিত হয়?",
    options: [
      { letter: "A", text: "১৯৬৪ সালে" },
      { letter: "B", text: "১৯৭১ সালে" },
      { letter: "C", text: "১৯৫২ সালে" },
      { letter: "D", text: "১৯৮০ সালে" }
    ],
    correctLetter: "A",
    explanation: "‘হাজার বছর ধরে’ উপন্যাসটি ১৯৬৪ সালে প্রকাশিত হয়।",
    difficulty: "medium",
    sourceNote: "জহির রায়হান — হাজার বছর ধরে (প্রথম প্রকাশ ১৯৬৪); standard literary reference",
  },
  {
    id: "ACAD-5011",
    classId: "class-9",
    subjectId: "bangla-1st",
    chapterId: "acad-class-9-ban-1st-topic-20",
    chapterName: "নাটক — কবর",
    unitNumber: 20,
    topicId: "topic-20",
    questionText: "‘কবর’ নাটকটি কোন আন্দোলনের পটভূমিতে লেখা?",
    options: [
      { letter: "A", text: "গণঅভ্যুত্থান" },
      { letter: "B", text: "মুক্তিযুদ্ধ" },
      { letter: "C", text: "ভাষা আন্দোলন" },
      { letter: "D", text: "স্বদেশি আন্দোলন" }
    ],
    correctLetter: "C",
    explanation: "মুনীর চৌধুরীর ‘কবর’ ১৯৫২ সালের ভাষা আন্দোলনের পটভূমিতে রচিত নাটক।",
    difficulty: "medium",
    sourceNote: "মুনীর চৌধুরী — কবর (রচনা ১৯৫৩, ১৯৫২ সালের ভাষা আন্দোলনের পটভূমি); standard literary reference",
  },
  {
    id: "ACAD-5012",
    classId: "class-9",
    subjectId: "bangla-1st",
    chapterId: "acad-class-9-ban-1st-topic-21",
    chapterName: "গদ্য — প্রবাস বন্ধু",
    unitNumber: 21,
    topicId: "topic-21",
    questionText: "‘প্রবাস বন্ধু’ গল্পে লেখকের বন্ধু কে?",
    options: [
      { letter: "A", text: "একজন শিক্ষক" },
      { letter: "B", text: "একজন ইংরেজ" },
      { letter: "C", text: "একজন বাঙালি ছাত্র" },
      { letter: "D", text: "একজন পাঠান যুবক" }
    ],
    correctLetter: "D",
    explanation: "সৈয়দ মুজতবা আলীর ‘প্রবাস বন্ধু’ গল্পে কাবুলের পাঠান বন্ধুর কথা বলা হয়েছে।",
    difficulty: "easy",
    sourceNote: "NCTB বাংলা সাহিত্য — গদ্য: প্রবাস বন্ধু",
  },
];
