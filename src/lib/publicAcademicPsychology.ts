// Eduvelto — Academic Psychology practice questions (Class 11),
// verified for fact correctness + on-syllabus (review 26 Nov 2026).
//
// Static data ONLY — zero Firestore reads. The 22 questions are the
// Academic Class 11 Psychology drafts AFTER review (see
// review-academic-c11-12-psychology-verdicts.json and
// review-academic-c11-12-fixes-applied.md in
// ~/workspace/eduorbit/sprint-1week-2026-11-25/).
//
// CAVEAT: NO HSC book exists in the workspace — VERIFIED here means
// "fact correct per a standard reference + topic within the cited HSC
// syllabus", NOT "confirmed against the book lesson". A teacher with
// the actual HSC books should spot-check before publication,
// especially the re-cited chapters.
//
// HONESTY: these are ORIGINAL practice questions written for the
// NCTB lessons — NOT board / university / previous-year questions.
// Every question was checked against its cited HSC syllabus topic +
// a standard reference. The draft files' `status` field still says
// NEEDS-REVIEW — the verdict files are the review record, and this
// file contains ONLY the verified questions (VERIFIED as-is +
// NEEDS-FIX items with their fixes applied). Every question in this batch passed review — no question was skipped.
//
// HOW NEW BATCHES JOIN: append the next verified batch's questions
// to PUBLIC_ACADEMIC_PSYCHOLOGY_QUESTIONS below (same shape, same generation
// script with the new draft + verdict files). Chapters, counts and
// the practice pages are DERIVED from the combined pool in
// src/lib/publicAcademic.ts, so no component or route change is
// needed when a batch is verified. NEVER add a question whose
// verdict is not VERIFIED (or NEEDS-FIX with the fix applied) —
// unverified drafts must never reach students. The Class 11
// questions also serve Class 12 (same combined class-11-12 draft
// set — there is NO separate Class 12 set): the pool holds each
// question ONCE under classId 'class-11', and publicAcademic.ts /
// questionPaper.ts / scripts/prerender.mjs map 'class-12' to the
// Class 11 pool for these subjects.

import { type PublicAcademicQuestion } from './publicAcademic';

/** All verified Academic Psychology questions, Class 11 (in draft order). */
export const PUBLIC_ACADEMIC_PSYCHOLOGY_QUESTIONS: PublicAcademicQuestion[] = [
  {
    id: "ACAD-3071",
    classId: "class-11",
    subjectId: "psychology",
    chapterId: "acad-class-11-psy-topic-1",
    chapterName: "মনোবিজ্ঞান",
    unitNumber: 1,
    topicId: "topic-1",
    questionText: "মনোবিজ্ঞান কী নিয়ে আলোচনা করে?",
    options: [
      { letter: "A", text: "শুধু মস্তিষ্কের গঠন" },
      { letter: "B", text: "শুধু রোগ" },
      { letter: "C", text: "মানুষের আচরণ ও মানসিক প্রক্রিয়া" },
      { letter: "D", text: "শুধু স্বপ্ন" }
    ],
    correctLetter: "C",
    explanation: "মনোবিজ্ঞান মানুষের আচরণ ও মানসিক প্রক্রিয়া (চিন্তা, অনুভূতি, শেখা) নিয়ে আলোচনা করে।",
    difficulty: "easy",
    sourceNote: "NCTB HSC মনোবিজ্ঞান ১ম পত্র — অধ্যায় ১",
  },
  {
    id: "ACAD-3072",
    classId: "class-11",
    subjectId: "psychology",
    chapterId: "acad-class-11-psy-topic-2",
    chapterName: "শেখা",
    unitNumber: 2,
    topicId: "topic-2",
    questionText: "শেখার একটি প্রাথমিক রূপ কোনটি?",
    options: [
      { letter: "A", text: "অন্তর্দৃষ্টি" },
      { letter: "B", text: "স্মৃতি" },
      { letter: "C", text: "ভাষা" },
      { letter: "D", text: "অভ্যাস গঠন (conditioning)" }
    ],
    correctLetter: "D",
    explanation: "কন্ডিশনিং শেখার একটি প্রাথমিক রূপ — উদ্দীপক ও প্রতিক্রিয়ার সংযোগে শেখা হয়; প্যাভলভের পরীক্ষা এর উদাহরণ।",
    difficulty: "medium",
    sourceNote: "NCTB HSC মনোবিজ্ঞান ১ম পত্র — শিক্ষণ ও স্মৃতি অধ্যায়",
  },
  {
    id: "ACAD-3073",
    classId: "class-11",
    subjectId: "psychology",
    chapterId: "acad-class-11-psy-topic-3",
    chapterName: "স্মৃতি",
    unitNumber: 3,
    topicId: "topic-3",
    questionText: "স্বল্পমেয়াদি স্মৃতি কতক্ষণ থাকে?",
    options: [
      { letter: "A", text: "কয়েক ঘণ্টা" },
      { letter: "B", text: "কয়েক সেকেন্ড থেকে মিনিট" },
      { letter: "C", text: "সারাজীবন" },
      { letter: "D", text: "কয়েক বছর" }
    ],
    correctLetter: "B",
    explanation: "স্বল্পমেয়াদি স্মৃতি সেকেন্ড থেকে মিনিটখানেক থাকে; পুনরাবৃত্তিতে দীর্ঘমেয়াদি হয়।",
    difficulty: "medium",
    sourceNote: "NCTB HSC মনোবিজ্ঞান ১ম পত্র — স্মৃতি অধ্যায়",
  },
  {
    id: "ACAD-3074",
    classId: "class-11",
    subjectId: "psychology",
    chapterId: "acad-class-11-psy-topic-4",
    chapterName: "প্রেষণা",
    unitNumber: 4,
    topicId: "topic-4",
    questionText: "ক্ষুধা কোন ধরনের প্রেষণা?",
    options: [
      { letter: "A", text: "অর্জিত" },
      { letter: "B", text: "সামাজিক" },
      { letter: "C", text: "জৈবিক" },
      { letter: "D", text: "কৃত্রিম" }
    ],
    correctLetter: "C",
    explanation: "ক্ষুধা, তৃষ্ণা, ঘুম জৈবিক প্রেষণা; এগুলো দেহের প্রয়োজন থেকে আসে।",
    difficulty: "medium",
    sourceNote: "NCTB HSC মনোবিজ্ঞান ১ম পত্র — প্রেষণা অধ্যায়",
  },
  {
    id: "ACAD-3075",
    classId: "class-11",
    subjectId: "psychology",
    chapterId: "acad-class-11-psy-topic-5",
    chapterName: "ব্যক্তিত্ব",
    unitNumber: 5,
    topicId: "topic-5",
    questionText: "ব্যক্তিত্ব পরিমাপের একটি পদ্ধতি কোনটি?",
    options: [
      { letter: "A", text: "রক্ত পরীক্ষা" },
      { letter: "B", text: "প্রশ্নমালা (questionnaire)" },
      { letter: "C", text: "ওজন মাপা" },
      { letter: "D", text: "এক্স-রে" }
    ],
    correctLetter: "B",
    explanation: "প্রশ্নমালা, সাক্ষাৎকার ও অভিক্ষেপমূলক পরীক্ষায় ব্যক্তিত্বের বৈশিষ্ট্য মাপা হয়।",
    difficulty: "medium",
    sourceNote: "NCTB HSC মনোবিজ্ঞান ২য় পত্র — ব্যক্তিত্ব অধ্যায়",
  },
  {
    id: "ACAD-3076",
    classId: "class-11",
    subjectId: "psychology",
    chapterId: "acad-class-11-psy-topic-6",
    chapterName: "সংবেদন",
    unitNumber: 6,
    topicId: "topic-6",
    questionText: "পাঁচটি জ্ঞানেন্দ্রিয়ের একটি কোনটি?",
    options: [
      { letter: "A", text: "যকৃৎ" },
      { letter: "B", text: "হৃৎপিণ্ড" },
      { letter: "C", text: "চোখ" },
      { letter: "D", text: "ফুসফুস" }
    ],
    correctLetter: "C",
    explanation: "চোখ, কান, নাক, জিহ্বা ও ত্বক — এই পাঁচ জ্ঞানেন্দ্রিয় দিয়ে সংবেদন হয়।",
    difficulty: "easy",
    sourceNote: "NCTB HSC মনোবিজ্ঞান ১ম পত্র — সংবেদন ও প্রত্যক্ষণ",
  },
  {
    id: "ACAD-3077",
    classId: "class-11",
    subjectId: "psychology",
    chapterId: "acad-class-11-psy-topic-7",
    chapterName: "বুদ্ধি",
    unitNumber: 7,
    topicId: "topic-7",
    questionText: "IQ নির্ণয়ের সূত্র কোনটি?",
    options: [
      { letter: "A", text: "(মানসিক বয়স ÷ প্রকৃত বয়স) × ১০০" },
      { letter: "B", text: "প্রকৃত বয়স ÷ মানসিক বয়স" },
      { letter: "C", text: "মানসিক বয়স − প্রকৃত বয়স" },
      { letter: "D", text: "মানসিক বয়স + প্রকৃত বয়স" }
    ],
    correctLetter: "A",
    explanation: "স্ট্যানফোর্ড-বিনে পদ্ধতিতে IQ = (MA/CA) × 100।",
    difficulty: "medium",
    sourceNote: "NCTB HSC মনোবিজ্ঞান ২য় পত্র — বুদ্ধি অধ্যায়",
  },
  {
    id: "ACAD-3078",
    classId: "class-11",
    subjectId: "psychology",
    chapterId: "acad-class-11-psy-topic-8",
    chapterName: "আবেগ",
    unitNumber: 8,
    topicId: "topic-8",
    questionText: "আবেগের একটি উদাহরণ কোনটি?",
    options: [
      { letter: "A", text: "ঘুম" },
      { letter: "B", text: "ভয়" },
      { letter: "C", text: "ক্ষুধা" },
      { letter: "D", text: "ক্লান্তি" }
    ],
    correctLetter: "B",
    explanation: "ভয়, আনন্দ, রাগ, দুঃখ আবেগ; ক্ষুধা ও ঘুম জৈবিক প্রয়োজন।",
    difficulty: "easy",
    sourceNote: "NCTB HSC মনোবিজ্ঞান ১ম পত্র — আবেগ অধ্যায়",
  },
  {
    id: "ACAD-3079",
    classId: "class-11",
    subjectId: "psychology",
    chapterId: "acad-class-11-psy-topic-9",
    chapterName: "মানসিক স্বাস্থ্য",
    unitNumber: 9,
    topicId: "topic-9",
    questionText: "মানসিক চাপ কমাতে কার্যকর উপায় কোনটি?",
    options: [
      { letter: "A", text: "একা থাকা" },
      { letter: "B", text: "কাজ এড়ানো" },
      { letter: "C", text: "ঘুম কমানো" },
      { letter: "D", text: "নিয়মিত ব্যায়াম ও পর্যাপ্ত ঘুম" }
    ],
    correctLetter: "D",
    explanation: "ব্যায়াম, ঘুম ও সামাজিক সহায়তা মানসিক চাপ কমাতে সাহায্য করে।",
    difficulty: "medium",
    sourceNote: "NCTB HSC মনোবিজ্ঞান ২য় পত্র — মানসিক চাপ এবং চাপ মোকাবেলা (৫ম অধ্যায়)",
  },
  {
    id: "ACAD-3080",
    classId: "class-11",
    subjectId: "psychology",
    chapterId: "acad-class-11-psy-topic-10",
    chapterName: "শিশুর বিকাশ",
    unitNumber: 10,
    topicId: "topic-10",
    questionText: "শিশুর ভাষা বিকাশে সবচেয়ে গুরুত্বপূর্ণ কী?",
    options: [
      { letter: "A", text: "পরিবেশ ও পারস্পরিক কথা বলা" },
      { letter: "B", text: "একা খেলা" },
      { letter: "C", text: "শুধু টিভি" },
      { letter: "D", text: "শুধু বই" }
    ],
    correctLetter: "A",
    explanation: "পরিবারের সঙ্গে কথা বলা ও মিথস্ক্রিয়ায় শিশুর ভাষা বিকাশ ঘটে।",
    difficulty: "medium",
    sourceNote: "NCTB HSC মনোবিজ্ঞান ১ম পত্র — আচরণ ও আচরণের বিকাশ (২য় অধ্যায়)",
  },
  {
    id: "ACAD-8073",
    classId: "class-11",
    subjectId: "psychology",
    chapterId: "acad-class-11-psy-topic-1",
    chapterName: "মনোবিজ্ঞান",
    unitNumber: 1,
    topicId: "topic-1",
    questionText: "মনোবিজ্ঞানের জনক কাকে বলা হয়?",
    options: [
      { letter: "A", text: "উইলহেম উন্ডট" },
      { letter: "B", text: "ওয়াটসন" },
      { letter: "C", text: "ফ্রয়েড" },
      { letter: "D", text: "প্যাভলভ" }
    ],
    correctLetter: "A",
    explanation: "উন্ডট ১৮৭৯ সালে প্রথম মনোবিজ্ঞান গবেষণাগার স্থাপন করেন।",
    difficulty: "medium",
    sourceNote: "NCTB HSC মনোবিজ্ঞান ১ম পত্র — মনোবিজ্ঞানের ইতিহাস",
  },
  {
    id: "ACAD-8074",
    classId: "class-11",
    subjectId: "psychology",
    chapterId: "acad-class-11-psy-topic-2",
    chapterName: "শেখা",
    unitNumber: 2,
    topicId: "topic-2",
    questionText: "প্যাভলভের পরীক্ষায় কুকুরটি কী শিখেছিল?",
    options: [
      { letter: "A", text: "বই পড়া" },
      { letter: "B", text: "ঘুমানো" },
      { letter: "C", text: "দৌড়ানো" },
      { letter: "D", text: "ঘণ্টা শুনে লালা ঝরানো" }
    ],
    correctLetter: "D",
    explanation: "প্যাভলভের ক্লাসিক্যাল কন্ডিশনিংয়ে ঘণ্টা খাবারের সংকেত হয়ে লালা ঝরায়।",
    difficulty: "medium",
    sourceNote: "NCTB HSC মনোবিজ্ঞান ১ম পত্র — শেখা",
  },
  {
    id: "ACAD-8075",
    classId: "class-11",
    subjectId: "psychology",
    chapterId: "acad-class-11-psy-topic-3",
    chapterName: "স্মৃতি",
    unitNumber: 3,
    topicId: "topic-3",
    questionText: "এবিংহাউসের ভুলে যাওয়ার রেখা অনুযায়ী, শেখার পর অনুশীলন না করলে কী হয়?",
    options: [
      { letter: "A", text: "স্মৃতির কোনো পরিবর্তন হয় না" },
      { letter: "B", text: "স্মৃতি দ্রুত দুর্বল হয়" },
      { letter: "C", text: "স্মৃতি আরও শক্ত হয়" },
      { letter: "D", text: "স্মৃতি স্থায়ী হয়" }
    ],
    correctLetter: "B",
    explanation: "এবিংহাউস দেখিয়েছেন অনুশীলন/পুনরাবৃত্তি ছাড়া নতুন শেখা তথ্য দ্রুত ভুলে যাওয়া যায় — প্রথম ঘণ্টায় প্রায় অর্ধেক ভুলে যায়; নিয়মিত অনুশীলনে স্মৃতি দীর্ঘমেয়াদি হয়।",
    difficulty: "medium",
    sourceNote: "NCTB HSC মনোবিজ্ঞান ১ম পত্র — শিক্ষণ ও স্মৃতি (৫ম অধ্যায়)",
  },
  {
    id: "ACAD-8076",
    classId: "class-11",
    subjectId: "psychology",
    chapterId: "acad-class-11-psy-topic-4",
    chapterName: "প্রেষণা",
    unitNumber: 4,
    topicId: "topic-4",
    questionText: "মাসলোর চাহিদা স্তরে সবচেয়ে নিচে কোনটি?",
    options: [
      { letter: "A", text: "আত্মোপলব্ধি" },
      { letter: "B", text: "সম্মান" },
      { letter: "C", text: "শারীরবৃত্তীয় চাহিদা" },
      { letter: "D", text: "নিরাপত্তা" }
    ],
    correctLetter: "C",
    explanation: "মাসলোর স্তরে নিচে খাদ্য-পানির মতো শারীরবৃত্তীয় চাহিদা, ওপরে আত্মোপলব্ধি।",
    difficulty: "medium",
    sourceNote: "NCTB HSC মনোবিজ্ঞান ১ম পত্র — প্রেষণা",
  },
  {
    id: "ACAD-8077",
    classId: "class-11",
    subjectId: "psychology",
    chapterId: "acad-class-11-psy-topic-5",
    chapterName: "ব্যক্তিত্ব",
    unitNumber: 5,
    topicId: "topic-5",
    questionText: "ফ্রয়েডের মতে ব্যক্তিত্বের অংশ কয়টি?",
    options: [
      { letter: "A", text: "২টি" },
      { letter: "B", text: "৫টি" },
      { letter: "C", text: "৪টি" },
      { letter: "D", text: "৩টি (ইদ, ইগো, সুপার-ইগো)" }
    ],
    correctLetter: "D",
    explanation: "ফ্রয়েডের মতে ইদ, ইগো ও সুপার-ইগো মিলে ব্যক্তিত্ব গঠিত।",
    difficulty: "medium",
    sourceNote: "NCTB HSC মনোবিজ্ঞান ২য় পত্র — ব্যক্তিত্ব",
  },
  {
    id: "ACAD-8078",
    classId: "class-11",
    subjectId: "psychology",
    chapterId: "acad-class-11-psy-topic-6",
    chapterName: "সংবেদন",
    unitNumber: 6,
    topicId: "topic-6",
    questionText: "চোখের আলোকসংবেদী কোষ কোনটি?",
    options: [
      { letter: "A", text: "আইরিস" },
      { letter: "B", text: "লেন্স" },
      { letter: "C", text: "কর্নিয়া" },
      { letter: "D", text: "রড ও কোন" }
    ],
    correctLetter: "D",
    explanation: "রড অল্প আলোতে ও কোন রঙ দেখতে সাহায্য করে।",
    difficulty: "medium",
    sourceNote: "NCTB HSC মনোবিজ্ঞান ১ম পত্র — সংবেদন",
  },
  {
    id: "ACAD-8079",
    classId: "class-11",
    subjectId: "psychology",
    chapterId: "acad-class-11-psy-topic-7",
    chapterName: "বুদ্ধি",
    unitNumber: 7,
    topicId: "topic-7",
    questionText: "গড় IQ কত?",
    options: [
      { letter: "A", text: "১০০" },
      { letter: "B", text: "৮০" },
      { letter: "C", text: "১২০" },
      { letter: "D", text: "৯০" }
    ],
    correctLetter: "A",
    explanation: "IQ পরীক্ষায় গড় মান ১০০ ধরা হয়।",
    difficulty: "medium",
    sourceNote: "NCTB HSC মনোবিজ্ঞান ২য় পত্র — বুদ্ধি",
  },
  {
    id: "ACAD-8080",
    classId: "class-11",
    subjectId: "psychology",
    chapterId: "acad-class-11-psy-topic-8",
    chapterName: "আবেগ",
    unitNumber: 8,
    topicId: "topic-8",
    questionText: "আবেগের শারীরিক প্রকাশ কোনটি?",
    options: [
      { letter: "A", text: "শুধু ঘুম" },
      { letter: "B", text: "হৃৎস্পন্দন বেড়ে যাওয়া" },
      { letter: "C", text: "শুধু স্মৃতি" },
      { letter: "D", text: "শুধু চিন্তা" }
    ],
    correctLetter: "B",
    explanation: "ভয় বা রাগে হৃৎস্পন্দন বাড়ে, ঘাম হয় — এগুলো আবেগের শারীরিক প্রকাশ।",
    difficulty: "medium",
    sourceNote: "NCTB HSC মনোবিজ্ঞান ১ম পত্র — আবেগ",
  },
  {
    id: "ACAD-8081",
    classId: "class-11",
    subjectId: "psychology",
    chapterId: "acad-class-11-psy-topic-9",
    chapterName: "মানসিক স্বাস্থ্য",
    unitNumber: 9,
    topicId: "topic-9",
    questionText: "বিষণ্ণতার লক্ষণ কোনটি?",
    options: [
      { letter: "A", text: "দীর্ঘদিন মন খারাপ ও আগ্রহ হারানো" },
      { letter: "B", text: "শুধু ঘুম বেশি হওয়া" },
      { letter: "C", text: "শুধু ক্ষুধা বাড়া" },
      { letter: "D", text: "শুধু ক্লান্তি" }
    ],
    correctLetter: "A",
    explanation: "দুই সপ্তাহের বেশি মন খারাপ ও আগ্রহ হারানো বিষণ্ণতার লক্ষণ; চিকিৎসা দরকার।",
    difficulty: "medium",
    sourceNote: "NCTB HSC মনোবিজ্ঞান ১ম পত্র — বয়ঃসন্ধিকাল ও মানসিক স্বাস্থ্য (৭ম অধ্যায়)",
  },
  {
    id: "ACAD-8082",
    classId: "class-11",
    subjectId: "psychology",
    chapterId: "acad-class-11-psy-topic-10",
    chapterName: "শিশুর বিকাশ",
    unitNumber: 10,
    topicId: "topic-10",
    questionText: "শিশুর সামাজিক বিকাশে সবচেয়ে গুরুত্বপূর্ণ কী?",
    options: [
      { letter: "A", text: "শুধু একা থাকা" },
      { letter: "B", text: "পরিবার ও খেলার সঙ্গী" },
      { letter: "C", text: "শুধু বই" },
      { letter: "D", text: "শুধু টিভি" }
    ],
    correctLetter: "B",
    explanation: "পরিবার ও সঙ্গীদের সঙ্গে মিথস্ক্রিয়ায় শিশুর সামাজিক দক্ষতা গড়ে ওঠে।",
    difficulty: "medium",
    sourceNote: "NCTB HSC মনোবিজ্ঞান ১ম পত্র — আচরণ ও আচরণের বিকাশ (২য় অধ্যায়)",
  },
  {
    id: "ACAD-8083",
    classId: "class-11",
    subjectId: "psychology",
    chapterId: "acad-class-11-psy-topic-11",
    chapterName: "মনোযোগ",
    unitNumber: 11,
    topicId: "topic-11",
    questionText: "মনোযোগ কী?",
    options: [
      { letter: "A", text: "শুধু দেখা" },
      { letter: "B", text: "শুধু মনে রাখা" },
      { letter: "C", text: "কোনো বিষয়ে মন কেন্দ্রীভূত করা" },
      { letter: "D", text: "শুধু শোনা" }
    ],
    correctLetter: "C",
    explanation: "মনোযোগ হলো চেতনাকে একটি বিষয়ে কেন্দ্রীভূত করা; শেখার প্রথম শর্ত।",
    difficulty: "medium",
    sourceNote: "NCTB HSC মনোবিজ্ঞান ১ম পত্র — সংবেদন ও প্রত্যক্ষণ অধ্যায়",
  },
  {
    id: "ACAD-8084",
    classId: "class-11",
    subjectId: "psychology",
    chapterId: "acad-class-11-psy-topic-12",
    chapterName: "স্বপ্ন",
    unitNumber: 12,
    topicId: "topic-12",
    questionText: "ফ্রয়েডের মতে স্বপ্ন কী?",
    options: [
      { letter: "A", text: "অবচেতন মনের প্রকাশ" },
      { letter: "B", text: "শুধু কল্পনা" },
      { letter: "C", text: "অর্থহীন ছবি" },
      { letter: "D", text: "ভবিষ্যদ্বাণী" }
    ],
    correctLetter: "A",
    explanation: "ফ্রয়েড স্বপ্নকে অবচেতন ইচ্ছার ছদ্মবেশী প্রকাশ বলেছেন।",
    difficulty: "medium",
    sourceNote: "NCTB HSC মনোবিজ্ঞান ২য় পত্র — ব্যক্তিত্ব অধ্যায় (ফ্রয়েডের মনঃসমীক্ষণ তত্ত্ব)",
  },
];
