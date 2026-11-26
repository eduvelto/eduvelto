// Eduvelto — Academic Geography and Environment practice questions (Class 9),
// verified against the Dakhil NCTB books (review 26 Nov 2026).
//
// Static data ONLY — zero Firestore reads. The 20 questions are the
// Academic Class 9 Geography and Environment drafts AFTER review (see
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
// to PUBLIC_ACADEMIC_GEOGRAPHY_QUESTIONS below (same shape, same generation
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

/** All verified Academic Geography and Environment questions, Class 9 (in draft order). */
export const PUBLIC_ACADEMIC_GEOGRAPHY_QUESTIONS: PublicAcademicQuestion[] = [
  {
    id: "ACAD-1062",
    classId: "class-9",
    subjectId: "geography",
    chapterId: "acad-class-9-geo-topic-1",
    chapterName: "পৃথিবীর গঠন",
    unitNumber: 1,
    topicId: "topic-1",
    questionText: "পৃথিবীর কেন্দ্রীয় স্তরকে কী বলে?",
    options: [
      { letter: "A", text: "গুরুমণ্ডল" },
      { letter: "B", text: "ভূত্বক" },
      { letter: "C", text: "অশ্মমণ্ডল" },
      { letter: "D", text: "কেন্দ্রমণ্ডল" }
    ],
    correctLetter: "D",
    explanation: "পৃথিবীর স্তর: ভূত্বক, গুরুমণ্ডল ও কেন্দ্রমণ্ডল; কেন্দ্রমণ্ডল সবচেয়ে ভেতরে।",
    difficulty: "medium",
    sourceNote: "NCTB ভূগোল ও পরিবেশ, নবম-দশম শ্রেণি — পৃথিবীর গঠন",
  },
  {
    id: "ACAD-1063",
    classId: "class-9",
    subjectId: "geography",
    chapterId: "acad-class-9-geo-topic-2",
    chapterName: "জলবায়ু",
    unitNumber: 2,
    topicId: "topic-2",
    questionText: "বাংলাদেশে শীতকালে কোন দিক থেকে শীতল বায়ু আসে?",
    options: [
      { letter: "A", text: "উত্তর-পশ্চিম" },
      { letter: "B", text: "দক্ষিণ-পূর্ব" },
      { letter: "C", text: "দক্ষিণ-পশ্চিম" },
      { letter: "D", text: "উত্তর-পূর্ব" }
    ],
    correctLetter: "A",
    explanation: "শীতকালে স্থলভাগ থেকে উত্তর-পশ্চিম দিকের শীতল ও শুষ্ক বায়ু বাংলাদেশে প্রবাহিত হয়।",
    difficulty: "medium",
    sourceNote: "NCTB ভূগোল ও পরিবেশ, নবম-দশম শ্রেণি — জলবায়ু অধ্যায়",
  },
  {
    id: "ACAD-1064",
    classId: "class-9",
    subjectId: "geography",
    chapterId: "acad-class-9-geo-topic-3",
    chapterName: "নদী",
    unitNumber: 3,
    topicId: "topic-3",
    questionText: "বাংলাদেশের প্রধান নদীগুলো কোন সাগরে পড়েছে?",
    options: [
      { letter: "A", text: "আরব সাগর" },
      { letter: "B", text: "বঙ্গোপসাগর" },
      { letter: "C", text: "ভারত মহাসাগর সরাসরি" },
      { letter: "D", text: "প্রশান্ত মহাসাগর" }
    ],
    correctLetter: "B",
    explanation: "পদ্মা-মেঘনা-যমুনা মিলে বঙ্গোপসাগরে পড়েছে।",
    difficulty: "easy",
    sourceNote: "NCTB ভূগোল ও পরিবেশ, নবম-দশম শ্রেণি — নদ-নদী",
  },
  {
    id: "ACAD-1065",
    classId: "class-9",
    subjectId: "geography",
    chapterId: "acad-class-9-geo-topic-4",
    chapterName: "মানচিত্র",
    unitNumber: 4,
    topicId: "topic-4",
    questionText: "মানচিত্রে উত্তর দিক সাধারণত কোন দিকে দেখানো হয়?",
    options: [
      { letter: "A", text: "বামে" },
      { letter: "B", text: "ডানে" },
      { letter: "C", text: "ওপরে" },
      { letter: "D", text: "নিচে" }
    ],
    correctLetter: "C",
    explanation: "প্রচলিত মানচিত্রে ওপরের দিক উত্তর ধরা হয়।",
    difficulty: "easy",
    sourceNote: "NCTB ভূগোল ও পরিবেশ, নবম-দশম শ্রেণি — মানচিত্র অধ্যায়",
  },
  {
    id: "ACAD-1066",
    classId: "class-9",
    subjectId: "geography",
    chapterId: "acad-class-9-geo-topic-5",
    chapterName: "ভূমিকম্প",
    unitNumber: 5,
    topicId: "topic-5",
    questionText: "ভূমিকম্প মাপার যন্ত্র কোনটি?",
    options: [
      { letter: "A", text: "অ্যানিমোমিটার" },
      { letter: "B", text: "সিসমোগ্রাফ" },
      { letter: "C", text: "ব্যারোমিটার" },
      { letter: "D", text: "থার্মোমিটার" }
    ],
    correctLetter: "B",
    explanation: "সিসমোগ্রাফে ভূমিকম্পের তরঙ্গ ধরা পড়ে; মাত্রা রিখটার স্কেলে মাপা হয়।",
    difficulty: "medium",
    sourceNote: "NCTB ভূগোল ও পরিবেশ, নবম-দশম শ্রেণি — দুর্যোগ অধ্যায়",
  },
  {
    id: "ACAD-1067",
    classId: "class-9",
    subjectId: "geography",
    chapterId: "acad-class-9-geo-topic-6",
    chapterName: "বনভূমি",
    unitNumber: 6,
    topicId: "topic-6",
    questionText: "বাংলাদেশ বন গবেষণা ইনস্টিটিউট কোথায় অবস্থিত?",
    options: [
      { letter: "A", text: "ঢাকা" },
      { letter: "B", text: "চট্টগ্রাম" },
      { letter: "C", text: "সিলেট" },
      { letter: "D", text: "খুলনা" }
    ],
    correctLetter: "B",
    explanation: "বাংলাদেশ বন গবেষণা ইনস্টিটিউট (BFRI) চট্টগ্রামে অবস্থিত।",
    difficulty: "medium",
    sourceNote: "NCTB ভূগোল ও পরিবেশ, নবম-দশম শ্রেণি — বনভূমি",
  },
  {
    id: "ACAD-1068",
    classId: "class-9",
    subjectId: "geography",
    chapterId: "acad-class-9-geo-topic-7",
    chapterName: "কৃষি",
    unitNumber: 7,
    topicId: "topic-7",
    questionText: "বাংলাদেশে ধান কয়টি মৌসুমে চাষ হয়?",
    options: [
      { letter: "A", text: "৪টি" },
      { letter: "B", text: "১টি" },
      { letter: "C", text: "২টি" },
      { letter: "D", text: "৩টি" }
    ],
    correctLetter: "D",
    explanation: "বাংলাদেশে ধান তিন মৌসুমে চাষ হয়: আউশ, আমন ও বোরো।",
    difficulty: "easy",
    sourceNote: "NCTB ভূগোল ও পরিবেশ, নবম-দশম শ্রেণি — কৃষি অধ্যায়",
  },
  {
    id: "ACAD-1069",
    classId: "class-9",
    subjectId: "geography",
    chapterId: "acad-class-9-geo-topic-8",
    chapterName: "শিল্প",
    unitNumber: 8,
    topicId: "topic-8",
    questionText: "বাংলাদেশের বৃহত্তম শিল্প কোনটি?",
    options: [
      { letter: "A", text: "চিনি শিল্প" },
      { letter: "B", text: "সিমেন্ট শিল্প" },
      { letter: "C", text: "কাগজ শিল্প" },
      { letter: "D", text: "তৈরি পোশাক শিল্প" }
    ],
    correctLetter: "D",
    explanation: "তৈরি পোশাক শিল্প বাংলাদেশের বৃহত্তম রপ্তানিমুখী শিল্প।",
    difficulty: "medium",
    sourceNote: "NCTB ভূগোল ও পরিবেশ, নবম-দশম শ্রেণি — শিল্প অধ্যায়",
  },
  {
    id: "ACAD-1070",
    classId: "class-9",
    subjectId: "geography",
    chapterId: "acad-class-9-geo-topic-9",
    chapterName: "পরিবেশ দূষণ",
    unitNumber: 9,
    topicId: "topic-9",
    questionText: "বায়ুদূষণের প্রধান কারণ কোনটি?",
    options: [
      { letter: "A", text: "সৌরশক্তি" },
      { letter: "B", text: "বৃষ্টি" },
      { letter: "C", text: "গাছ লাগানো" },
      { letter: "D", text: "যানবাহন ও কলকারখানার ধোঁয়া" }
    ],
    correctLetter: "D",
    explanation: "যানবাহন ও শিল্পকারখানার ধোঁয়া বায়ুতে ক্ষতিকর গ্যাস ও কণা ছড়ায়।",
    difficulty: "easy",
    sourceNote: "NCTB ভূগোল ও পরিবেশ, নবম-দশম শ্রেণি — পরিবেশ দূষণ",
  },
  {
    id: "ACAD-6073",
    classId: "class-9",
    subjectId: "geography",
    chapterId: "acad-class-9-geo-topic-10",
    chapterName: "ভূগোল",
    unitNumber: 10,
    topicId: "topic-10",
    questionText: "অক্ষাংশ কী?",
    options: [
      { letter: "A", text: "বিষুবরেখা থেকে উত্তর-দক্ষিণের কৌণিক দূরত্ব" },
      { letter: "B", text: "দ্রাঘিমা" },
      { letter: "C", text: "গভীরতা" },
      { letter: "D", text: "উচ্চতা" }
    ],
    correctLetter: "A",
    explanation: "অক্ষাংশ বিষুবরেখা থেকে উত্তর বা দক্ষিণের কৌণিক দূরত্ব মাপে।",
    difficulty: "medium",
    sourceNote: "NCTB ভূগোল ও পরিবেশ — অক্ষাংশ-দ্রাঘিমা",
  },
  {
    id: "ACAD-6074",
    classId: "class-9",
    subjectId: "geography",
    chapterId: "acad-class-9-geo-topic-1",
    chapterName: "পৃথিবীর গঠন",
    unitNumber: 1,
    topicId: "topic-1",
    questionText: "ভূত্বকের প্রধান উপাদান কী?",
    options: [
      { letter: "A", text: "বায়ু" },
      { letter: "B", text: "পানি" },
      { letter: "C", text: "আগুন" },
      { letter: "D", text: "শিলা" }
    ],
    correctLetter: "D",
    explanation: "ভূত্বক শিলা দিয়ে গঠিত; এর নিচে গুরুমণ্ডল ও কেন্দ্রমণ্ডল।",
    difficulty: "medium",
    sourceNote: "NCTB ভূগোল ও পরিবেশ — পৃথিবীর গঠন",
  },
  {
    id: "ACAD-6075",
    classId: "class-9",
    subjectId: "geography",
    chapterId: "acad-class-9-geo-topic-2",
    chapterName: "জলবায়ু",
    unitNumber: 2,
    topicId: "topic-2",
    questionText: "বাংলাদেশে শীতকাল কোন মাসে?",
    options: [
      { letter: "A", text: "সেপ্টেম্বর–নভেম্বর" },
      { letter: "B", text: "ডিসেম্বর–ফেব্রুয়ারি" },
      { letter: "C", text: "মার্চ–মে" },
      { letter: "D", text: "জুন–আগস্ট" }
    ],
    correctLetter: "B",
    explanation: "ডিসেম্বর থেকে ফেব্রুয়ারি বাংলাদেশে শীতকাল।",
    difficulty: "medium",
    sourceNote: "NCTB ভূগোল ও পরিবেশ — জলবায়ু",
  },
  {
    id: "ACAD-6076",
    classId: "class-9",
    subjectId: "geography",
    chapterId: "acad-class-9-geo-topic-3",
    chapterName: "নদী",
    unitNumber: 3,
    topicId: "topic-3",
    questionText: "যমুনা নদীর উৎপত্তি কোথায়?",
    options: [
      { letter: "A", text: "আসাম" },
      { letter: "B", text: "মেঘালয়" },
      { letter: "C", text: "আরাকান পাহাড়" },
      { letter: "D", text: "তিব্বতের মানস সরোবর" }
    ],
    correctLetter: "D",
    explanation: "ব্রহ্মপুত্র তিব্বত থেকে এসে বাংলাদেশে যমুনা নামে প্রবাহিত হয়।",
    difficulty: "medium",
    sourceNote: "NCTB ভূগোল ও পরিবেশ — নদ-নদী",
  },
  {
    id: "ACAD-6077",
    classId: "class-9",
    subjectId: "geography",
    chapterId: "acad-class-9-geo-topic-4",
    chapterName: "মানচিত্র",
    unitNumber: 4,
    topicId: "topic-4",
    questionText: "মানচিত্রের স্কেল কী বোঝায়?",
    options: [
      { letter: "A", text: "শুধু জনসংখ্যা" },
      { letter: "B", text: "মানচিত্র ও ভূমির দূরত্বের অনুপাত" },
      { letter: "C", text: "শুধু উচ্চতা" },
      { letter: "D", text: "শুধু দিক" }
    ],
    correctLetter: "B",
    explanation: "স্কেলে মানচিত্রের ১ একক ভূমিতে কত দূরত্ব বোঝায় তা ঠিক করা হয়।",
    difficulty: "medium",
    sourceNote: "NCTB ভূগোল ও পরিবেশ — মানচিত্র",
  },
  {
    id: "ACAD-6078",
    classId: "class-9",
    subjectId: "geography",
    chapterId: "acad-class-9-geo-topic-5",
    chapterName: "ভূমিকম্প",
    unitNumber: 5,
    topicId: "topic-5",
    questionText: "রিখটার স্কেলে কী মাপা হয়?",
    options: [
      { letter: "A", text: "ভূমিকম্পের মাত্রা" },
      { letter: "B", text: "বাতাসের গতি" },
      { letter: "C", text: "তাপমাত্রা" },
      { letter: "D", text: "বৃষ্টির পরিমাণ" }
    ],
    correctLetter: "A",
    explanation: "রিখটার স্কেলে ভূমিকম্পের মাত্রা (শক্তি) মাপা হয়।",
    difficulty: "medium",
    sourceNote: "NCTB ভূগোল ও পরিবেশ — দুর্যোগ",
  },
  {
    id: "ACAD-6080",
    classId: "class-9",
    subjectId: "geography",
    chapterId: "acad-class-9-geo-topic-7",
    chapterName: "কৃষি",
    unitNumber: 7,
    topicId: "topic-7",
    questionText: "বোরো ধান কোন মৌসুমে চাষ হয়?",
    options: [
      { letter: "A", text: "শরতে" },
      { letter: "B", text: "বর্ষায়" },
      { letter: "C", text: "শীতকালে (রবি)" },
      { letter: "D", text: "গ্রীষ্মে" }
    ],
    correctLetter: "C",
    explanation: "বোরো শীতকালে সেচ দিয়ে চাষ হয়; বাংলাদেশের ধান উৎপাদনে এর অবদান সবচেয়ে বেশি।",
    difficulty: "medium",
    sourceNote: "NCTB ভূগোল ও পরিবেশ — কৃষি",
  },
  {
    id: "ACAD-6081",
    classId: "class-9",
    subjectId: "geography",
    chapterId: "acad-class-9-geo-topic-8",
    chapterName: "শিল্প",
    unitNumber: 8,
    topicId: "topic-8",
    questionText: "বাংলাদেশের চা শিল্পের প্রধান অঞ্চল কোনটি?",
    options: [
      { letter: "A", text: "সিলেট" },
      { letter: "B", text: "খুলনা" },
      { letter: "C", text: "ঢাকা" },
      { letter: "D", text: "রাজশাহী" }
    ],
    correctLetter: "A",
    explanation: "সিলেট ও চট্টগ্রামের পাহাড়ি এলাকায় চা চাষ হয়।",
    difficulty: "medium",
    sourceNote: "NCTB ভূগোল ও পরিবেশ — শিল্প",
  },
  {
    id: "ACAD-6082",
    classId: "class-9",
    subjectId: "geography",
    chapterId: "acad-class-9-geo-topic-9",
    chapterName: "পরিবেশ দূষণ",
    unitNumber: 9,
    topicId: "topic-9",
    questionText: "পানিদূষণের প্রধান কারণ কী?",
    options: [
      { letter: "A", text: "শিল্পবর্জ্য ও পয়ঃনিষ্কাশন" },
      { letter: "B", text: "গাছ লাগানো" },
      { letter: "C", text: "সৌরশক্তি" },
      { letter: "D", text: "বৃষ্টি" }
    ],
    correctLetter: "A",
    explanation: "কলকারখানার বর্জ্য ও পয়ঃনিষ্কাশন নদীর পানি দূষিত করে।",
    difficulty: "medium",
    sourceNote: "NCTB ভূগোল ও পরিবেশ — পরিবেশ দূষণ",
  },
  {
    id: "ACAD-6083",
    classId: "class-9",
    subjectId: "geography",
    chapterId: "acad-class-9-geo-topic-11",
    chapterName: "জনসংখ্যা",
    unitNumber: 11,
    topicId: "topic-11",
    questionText: "বাংলাদেশের সবচেয়ে ঘনবসতিপূর্ণ জেলা কোনটি?",
    options: [
      { letter: "A", text: "ঢাকা" },
      { letter: "B", text: "চট্টগ্রাম" },
      { letter: "C", text: "নারায়ণগঞ্জ" },
      { letter: "D", text: "কুমিল্লা" }
    ],
    correctLetter: "A",
    explanation: "ঢাকা জেলায় জনসংখ্যার ঘনত্ব সবচেয়ে বেশি।",
    difficulty: "medium",
    sourceNote: "NCTB ভূগোল ও পরিবেশ — জনসংখ্যা",
  },
  {
    id: "ACAD-6084",
    classId: "class-9",
    subjectId: "geography",
    chapterId: "acad-class-9-geo-topic-12",
    chapterName: "প্রাকৃতিক সম্পদ",
    unitNumber: 12,
    topicId: "topic-12",
    questionText: "বাংলাদেশের প্রধান খনিজ সম্পদ কোনটি?",
    options: [
      { letter: "A", text: "লোহা" },
      { letter: "B", text: "প্রাকৃতিক গ্যাস" },
      { letter: "C", text: "কয়লা" },
      { letter: "D", text: "তেল" }
    ],
    correctLetter: "B",
    explanation: "প্রাকৃতিক গ্যাস বাংলাদেশের প্রধান খনিজ সম্পদ; বিদ্যুৎ ও সার শিল্পে ব্যবহৃত হয়।",
    difficulty: "medium",
    sourceNote: "NCTB ভূগোল ও পরিবেশ — প্রাকৃতিক সম্পদ",
  },
];
