// Eduvelto — Academic Bangla 2nd Paper practice questions (Class 9),
// verified against the Dakhil NCTB books (review 26 Nov 2026).
//
// Static data ONLY — zero Firestore reads. The 18 questions are the
// Academic Class 9 Bangla 2nd Paper drafts AFTER review (see
// review-academic-c9-bangla-2nd-verdicts.json and
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
// their fixes applied). The one REJECTED item (ACAD-0018) is NOT here — no complete replacement was recorded; a teacher must supply one before it can ever be used.
//
// HOW NEW BATCHES JOIN: append the next verified batch's questions
// to PUBLIC_ACADEMIC_BANGLA_2ND_QUESTIONS below (same shape, same generation
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

/** All verified Academic Bangla 2nd Paper questions, Class 9 (in draft order). */
export const PUBLIC_ACADEMIC_BANGLA_2ND_QUESTIONS: PublicAcademicQuestion[] = [
  {
    id: "ACAD-0011",
    classId: "class-9",
    subjectId: "bangla-2nd",
    chapterId: "acad-class-9-ban-2nd-topic-1",
    chapterName: "ধ্বনি ও বর্ণ",
    unitNumber: 1,
    topicId: "topic-1",
    questionText: "বাংলা ভাষায় মৌলিক স্বরধ্বনির সংখ্যা কত?",
    options: [
      { letter: "A", text: "৭টি" },
      { letter: "B", text: "১১টি" },
      { letter: "C", text: "৩৯টি" },
      { letter: "D", text: "৩০টি" }
    ],
    correctLetter: "A",
    explanation: "বাংলা ভাষায় মৌলিক স্বরধ্বনি ৭টি — অ, আ, ই, উ, এ, ও, অ্যা।",
    difficulty: "easy",
    sourceNote: "NCTB বাংলা ভাষার ব্যাকরণ ও নির্মিতি — ধ্বনি ও বর্ণ অধ্যায়",
  },
  {
    id: "ACAD-0012",
    classId: "class-9",
    subjectId: "bangla-2nd",
    chapterId: "acad-class-9-ban-2nd-topic-2",
    chapterName: "সন্ধি",
    unitNumber: 2,
    topicId: "topic-2",
    questionText: "‘বিদ্যালয়’ শব্দটি কোন সন্ধির উদাহরণ?",
    options: [
      { letter: "A", text: "বিসর্গসন্ধি" },
      { letter: "B", text: "ব্যঞ্জনসন্ধি" },
      { letter: "C", text: "স্বরসন্ধি" },
      { letter: "D", text: "নিপাতনে সিদ্ধ" }
    ],
    correctLetter: "C",
    explanation: "বিদ্যা + আলয় = বিদ্যালয়; আ + আ = আ হওয়ায় এটি স্বরসন্ধি।",
    difficulty: "medium",
    sourceNote: "NCTB বাংলা ভাষার ব্যাকরণ ও নির্মিতি — সন্ধি অধ্যায়",
  },
  {
    id: "ACAD-0014",
    classId: "class-9",
    subjectId: "bangla-2nd",
    chapterId: "acad-class-9-ban-2nd-topic-3",
    chapterName: "কারক",
    unitNumber: 3,
    topicId: "topic-3",
    questionText: "‘গাছে ফল ধরেছে’ — এখানে ‘গাছে’ কোন কারক?",
    options: [
      { letter: "A", text: "কর্ম" },
      { letter: "B", text: "করণ" },
      { letter: "C", text: "অধিকরণ" },
      { letter: "D", text: "অপাদান" }
    ],
    correctLetter: "C",
    explanation: "যেখানে ক্রিয়া সম্পন্ন হয় তা অধিকরণ কারক; গাছে ফল ধরার স্থান বলে ‘গাছে’ অধিকরণ।",
    difficulty: "medium",
    sourceNote: "NCTB বাংলা ভাষার ব্যাকরণ ও নির্মিতি — কারক অধ্যায়",
  },
  {
    id: "ACAD-0015",
    classId: "class-9",
    subjectId: "bangla-2nd",
    chapterId: "acad-class-9-ban-2nd-topic-4",
    chapterName: "প্রত্যয়",
    unitNumber: 4,
    topicId: "topic-4",
    questionText: "‘দৈনিক’ শব্দে কোন প্রত্যয় যুক্ত হয়েছে?",
    options: [
      { letter: "A", text: "ত্ব" },
      { letter: "B", text: "অ" },
      { letter: "C", text: "তা" },
      { letter: "D", text: "ইক" }
    ],
    correctLetter: "D",
    explanation: "দিন + ইক = দৈনিক; 'ইক' তদ্ধিত প্রত্যয় (বই, পরিচ্ছেদ ১১, পৃ. ৩৩-এর সারণি)।",
    difficulty: "medium",
    sourceNote: "NCTB বাংলা ভাষার ব্যাকরণ ও নির্মিতি — প্রত্যয় অধ্যায়",
  },
  {
    id: "ACAD-0016",
    classId: "class-9",
    subjectId: "bangla-2nd",
    chapterId: "acad-class-9-ban-2nd-topic-5",
    chapterName: "বাক্য",
    unitNumber: 5,
    topicId: "topic-5",
    questionText: "অর্থ অনুসারে বাক্য প্রধানত কত প্রকার?",
    options: [
      { letter: "A", text: "৭ প্রকার" },
      { letter: "B", text: "৩ প্রকার" },
      { letter: "C", text: "৫ প্রকার" },
      { letter: "D", text: "৪ প্রকার" }
    ],
    correctLetter: "C",
    explanation: "অর্থ (বক্তব্যের লক্ষ্য) অনুসারে বাক্য ৫ প্রকার: বিবৃতিবাচক, নেতিবাচক, প্রশ্নবাচক, অনুজ্ঞাবাচক ও আবেগবাচক (বই, পরিচ্ছেদ ৩১, পৃ. ৮৪)।",
    difficulty: "easy",
    sourceNote: "NCTB বাংলা ভাষার ব্যাকরণ ও নির্মিতি — বাক্য অধ্যায়",
  },
  {
    id: "ACAD-0019",
    classId: "class-9",
    subjectId: "bangla-2nd",
    chapterId: "acad-class-9-ban-2nd-topic-6",
    chapterName: "বাগধারা",
    unitNumber: 6,
    topicId: "topic-6",
    questionText: "‘অন্ধের যষ্টি’ বাগধারাটির অর্থ কী?",
    options: [
      { letter: "A", text: "একমাত্র অবলম্বন" },
      { letter: "B", text: "অন্ধকার রাত" },
      { letter: "C", text: "অসহায় লোক" },
      { letter: "D", text: "অন্ধ মানুষ" }
    ],
    correctLetter: "A",
    explanation: "‘অন্ধের যষ্টি’ অর্থ একমাত্র অবলম্বন; অন্ধের কাছে লাঠি যেমন একমাত্র ভরসা।",
    difficulty: "easy",
    sourceNote: "NCTB বাংলা ভাষার ব্যাকরণ ও নির্মিতি — বাগধারা অধ্যায়",
  },
  {
    id: "ACAD-0020",
    classId: "class-9",
    subjectId: "bangla-2nd",
    chapterId: "acad-class-9-ban-2nd-topic-7",
    chapterName: "বিরাম চিহ্ন",
    unitNumber: 7,
    topicId: "topic-7",
    questionText: "বাংলায় প্রশ্নচিহ্ন কোনটি?",
    options: [
      { letter: "A", text: "।" },
      { letter: "B", text: "?" },
      { letter: "C", text: "!" },
      { letter: "D", text: "," }
    ],
    correctLetter: "B",
    explanation: "প্রশ্ন বোঝাতে প্রশ্নচিহ্ন (?) ব্যবহৃত হয় (বই, পরিচ্ছেদ ৩৮, পৃ. ১০৩–১০৪)।",
    difficulty: "easy",
    sourceNote: "NCTB বাংলা ভাষার ব্যাকরণ ও নির্মিতি — বিরাম চিহ্ন অধ্যায়",
  },
  {
    id: "ACAD-5013",
    classId: "class-9",
    subjectId: "bangla-2nd",
    chapterId: "acad-class-9-ban-2nd-topic-8",
    chapterName: "বর্ণ",
    unitNumber: 8,
    topicId: "topic-8",
    questionText: "বাংলা বর্ণমালায় কারবর্ণ কয়টি?",
    options: [
      { letter: "A", text: "১০টি" },
      { letter: "B", text: "১১টি" },
      { letter: "C", text: "৭টি" },
      { letter: "D", text: "১২টি" }
    ],
    correctLetter: "A",
    explanation: "বাংলা বর্ণমালায় কারবর্ণ ১০টি — স্বরবর্ণের ১০টি সংক্ষিপ্ত রূপের নাম কারবর্ণ (বই, পরিচ্ছেদ ৫, পৃ. ১২)।",
    difficulty: "easy",
    sourceNote: "NCTB বাংলা ব্যাকরণ — ধ্বনি ও বর্ণ",
  },
  {
    id: "ACAD-5014",
    classId: "class-9",
    subjectId: "bangla-2nd",
    chapterId: "acad-class-9-ban-2nd-topic-2",
    chapterName: "সন্ধি",
    unitNumber: 2,
    topicId: "topic-2",
    questionText: "‘পরীক্ষা’ কোন সন্ধির উদাহরণ?",
    options: [
      { letter: "A", text: "নিপাতনে সিদ্ধ" },
      { letter: "B", text: "ব্যঞ্জনসন্ধি" },
      { letter: "C", text: "বিসর্গসন্ধি" },
      { letter: "D", text: "স্বরসন্ধি" }
    ],
    correctLetter: "C",
    explanation: "পরিঃ + ঈক্ষা = পরীক্ষা; বিসর্গের পরিবর্তনে এটি বিসর্গসন্ধি।",
    difficulty: "medium",
    sourceNote: "NCTB বাংলা ব্যাকরণ — সন্ধি",
  },
  {
    id: "ACAD-5015",
    classId: "class-9",
    subjectId: "bangla-2nd",
    chapterId: "acad-class-9-ban-2nd-topic-9",
    chapterName: "সমাস",
    unitNumber: 9,
    topicId: "topic-9",
    questionText: "‘গোলাপফুল’ কোন সমাস?",
    options: [
      { letter: "A", text: "দ্বিগু" },
      { letter: "B", text: "তৎপুরুষ" },
      { letter: "C", text: "বহুব্রীহি" },
      { letter: "D", text: "কর্মধারয়" }
    ],
    correctLetter: "D",
    explanation: "গোলাপ নামের ফুল = গোলাপফুল; পরপদের অর্থ প্রাধান্য পায় বলে এটি কর্মধারয় সমাস (বই, পরিচ্ছেদ ১২, পৃ. ৩৮)।",
    difficulty: "medium",
    sourceNote: "NCTB বাংলা ব্যাকরণ — সমাস",
  },
  {
    id: "ACAD-5016",
    classId: "class-9",
    subjectId: "bangla-2nd",
    chapterId: "acad-class-9-ban-2nd-topic-9",
    chapterName: "সমাস",
    unitNumber: 9,
    topicId: "topic-9",
    questionText: "'ত্রিলোক' কোন সমাস?",
    options: [
      { letter: "A", text: "দ্বিগু" },
      { letter: "B", text: "বহুব্রীহি" },
      { letter: "C", text: "তৎপুরুষ" },
      { letter: "D", text: "কর্মধারয়" }
    ],
    correctLetter: "A",
    explanation: "'ত্রিলোক' দ্বিগু সমাস (তিন লোকের সমাহার)।",
    difficulty: "medium",
    sourceNote: "NCTB বাংলা ব্যাকরণ — সমাস",
  },
  {
    id: "ACAD-5017",
    classId: "class-9",
    subjectId: "bangla-2nd",
    chapterId: "acad-class-9-ban-2nd-topic-3",
    chapterName: "কারক",
    unitNumber: 3,
    topicId: "topic-3",
    questionText: "‘তিলে তৈল হয়’ — ‘তিলে’ কোন কারক?",
    options: [
      { letter: "A", text: "করণ" },
      { letter: "B", text: "অধিকরণ" },
      { letter: "C", text: "অপাদান" },
      { letter: "D", text: "কর্ম" }
    ],
    correctLetter: "C",
    explanation: "যা থেকে কিছু উৎপন্ন হয় তা অপাদান কারক।",
    difficulty: "medium",
    sourceNote: "NCTB বাংলা ব্যাকরণ — কারক",
  },
  {
    id: "ACAD-5018",
    classId: "class-9",
    subjectId: "bangla-2nd",
    chapterId: "acad-class-9-ban-2nd-topic-10",
    chapterName: "বিভক্তি",
    unitNumber: 10,
    topicId: "topic-10",
    questionText: "‘কে’ বিভক্তি কোন কারকে ব্যবহৃত হয়?",
    options: [
      { letter: "A", text: "অপাদান" },
      { letter: "B", text: "কর্ম" },
      { letter: "C", text: "করণ" },
      { letter: "D", text: "অধিকরণ" }
    ],
    correctLetter: "B",
    explanation: "কর্মকারকে ‘কে’ বিভক্তি যুক্ত হয়, যেমন ‘ছেলেকে ডাকো’।",
    difficulty: "easy",
    sourceNote: "NCTB বাংলা ব্যাকরণ — কারক ও বিভক্তি",
  },
  {
    id: "ACAD-5019",
    classId: "class-9",
    subjectId: "bangla-2nd",
    chapterId: "acad-class-9-ban-2nd-topic-11",
    chapterName: "প্রকৃতি-প্রত্যয়",
    unitNumber: 11,
    topicId: "topic-11",
    questionText: "‘দোলনা’ শব্দে কোন প্রত্যয় আছে?",
    options: [
      { letter: "A", text: "অনা" },
      { letter: "B", text: "ইক" },
      { letter: "C", text: "তা" },
      { letter: "D", text: "ত্ব" }
    ],
    correctLetter: "A",
    explanation: "দুল্ + অনা = দোলনা; 'অনা' কৃৎ প্রত্যয় (বই, পরিচ্ছেদ ১১, পৃ. ৩২-এর সারণি)।",
    difficulty: "medium",
    sourceNote: "NCTB বাংলা ব্যাকরণ — প্রত্যয়",
  },
  {
    id: "ACAD-5020",
    classId: "class-9",
    subjectId: "bangla-2nd",
    chapterId: "acad-class-9-ban-2nd-topic-5",
    chapterName: "বাক্য",
    unitNumber: 5,
    topicId: "topic-5",
    questionText: "গঠন অনুসারে বাক্য কত প্রকার?",
    options: [
      { letter: "A", text: "২ প্রকার" },
      { letter: "B", text: "৪ প্রকার" },
      { letter: "C", text: "৫ প্রকার" },
      { letter: "D", text: "৩ প্রকার" }
    ],
    correctLetter: "D",
    explanation: "গঠন অনুসারে বাক্য ৩ প্রকার: সরল, যৌগিক ও জটিল।",
    difficulty: "medium",
    sourceNote: "NCTB বাংলা ব্যাকরণ — বাক্য",
  },
  {
    id: "ACAD-5021",
    classId: "class-9",
    subjectId: "bangla-2nd",
    chapterId: "acad-class-9-ban-2nd-topic-6",
    chapterName: "বাগধারা",
    unitNumber: 6,
    topicId: "topic-6",
    questionText: "‘কাঁচা পয়সা’ বাগধারার অর্থ কী?",
    options: [
      { letter: "A", text: "ভাঙতি পয়সা" },
      { letter: "B", text: "নগদ টাকা" },
      { letter: "C", text: "অপরিপক্ব ফল" },
      { letter: "D", text: "কম দাম" }
    ],
    correctLetter: "B",
    explanation: "‘কাঁচা পয়সা’ অর্থ নগদ টাকা।",
    difficulty: "medium",
    sourceNote: "NCTB বাংলা ব্যাকরণ — বাগধারা",
  },
  {
    id: "ACAD-5022",
    classId: "class-9",
    subjectId: "bangla-2nd",
    chapterId: "acad-class-9-ban-2nd-topic-12",
    chapterName: "সমার্থক শব্দ",
    unitNumber: 12,
    topicId: "topic-12",
    questionText: "‘চাঁদ’ শব্দের সমার্থক কোনটি?",
    options: [
      { letter: "A", text: "তারা" },
      { letter: "B", text: "সূর্য" },
      { letter: "C", text: "দিন" },
      { letter: "D", text: "চন্দ্র" }
    ],
    correctLetter: "D",
    explanation: "চন্দ্র, শশী, সুধাকর চাঁদের সমার্থক শব্দ।",
    difficulty: "easy",
    sourceNote: "NCTB বাংলা ব্যাকরণ — শব্দভাণ্ডার",
  },
  {
    id: "ACAD-5023",
    classId: "class-9",
    subjectId: "bangla-2nd",
    chapterId: "acad-class-9-ban-2nd-topic-13",
    chapterName: "বিপরীত শব্দ",
    unitNumber: 13,
    topicId: "topic-13",
    questionText: "‘আলো’ শব্দের বিপরীত কোনটি?",
    options: [
      { letter: "A", text: "রোদ" },
      { letter: "B", text: "অন্ধকার" },
      { letter: "C", text: "সকাল" },
      { letter: "D", text: "দিন" }
    ],
    correctLetter: "B",
    explanation: "আলোর বিপরীত অন্ধকার।",
    difficulty: "easy",
    sourceNote: "NCTB বাংলা ব্যাকরণ — শব্দভাণ্ডার",
  },
];
