// Eduvelto — Academic Islamic History and Culture practice questions (Class 11),
// verified for fact correctness + on-syllabus (review 26 Nov 2026).
//
// Static data ONLY — zero Firestore reads. The 20 questions are the
// Academic Class 11 Islamic History and Culture drafts AFTER review (see
// review-academic-c11-12-islamic-history-verdicts.json and
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
// NEEDS-FIX items with their fixes applied). The 2 REJECTED items (ACAD-3069, ACAD-8069) are NOT here — complete replacements were recorded, but they are new text needing a content-team spot-check before they can ever be used.
//
// HOW NEW BATCHES JOIN: append the next verified batch's questions
// to PUBLIC_ACADEMIC_ISLAMIC_HISTORY_QUESTIONS below (same shape, same generation
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

/** All verified Academic Islamic History and Culture questions, Class 11 (in draft order). */
export const PUBLIC_ACADEMIC_ISLAMIC_HISTORY_QUESTIONS: PublicAcademicQuestion[] = [
  {
    id: "ACAD-3061",
    classId: "class-11",
    subjectId: "islamic-history",
    chapterId: "acad-class-11-isl-his-topic-1",
    chapterName: "ইসলামের আবির্ভাব",
    unitNumber: 1,
    topicId: "topic-1",
    questionText: "হযরত মুহাম্মদ (সা.) নবুয়ত লাভ করেন কত খ্রিষ্টাব্দে?",
    options: [
      { letter: "A", text: "৬২২" },
      { letter: "B", text: "৬৩২" },
      { letter: "C", text: "৫৭০" },
      { letter: "D", text: "৬১০" }
    ],
    correctLetter: "D",
    explanation: "৬১০ খ্রিষ্টাব্দে হেরা গুহায় প্রথম ওহি নাজিল হয়।",
    difficulty: "medium",
    sourceNote: "NCTB HSC ইসলামের ইতিহাস ও সংস্কৃতি ১ম পত্র — ইসলামের আবির্ভাব",
  },
  {
    id: "ACAD-3062",
    classId: "class-11",
    subjectId: "islamic-history",
    chapterId: "acad-class-11-isl-his-topic-2",
    chapterName: "খিলাফত",
    unitNumber: 2,
    topicId: "topic-2",
    questionText: "প্রথম খলিফা হযরত আবু বকর (রা.) কত সালে খলিফা হন?",
    options: [
      { letter: "A", text: "৬১০" },
      { letter: "B", text: "৬২২" },
      { letter: "C", text: "৬৪৪" },
      { letter: "D", text: "৬৩২" }
    ],
    correctLetter: "D",
    explanation: "৬৩২ সালে হযরত মুহাম্মদ (সা.)-এর ইন্তেকালের পর আবু বকর (রা.) প্রথম খলিফা নির্বাচিত হন।",
    difficulty: "medium",
    sourceNote: "NCTB HSC ইসলামের ইতিহাস ১ম পত্র — খিলাফতে রাশেদা",
  },
  {
    id: "ACAD-3063",
    classId: "class-11",
    subjectId: "islamic-history",
    chapterId: "acad-class-11-isl-his-topic-3",
    chapterName: "উমাইয়া",
    unitNumber: 3,
    topicId: "topic-3",
    questionText: "উমাইয়া বংশের প্রতিষ্ঠাতা কে?",
    options: [
      { letter: "A", text: "ওমর ইবনে আবদুল আজিজ" },
      { letter: "B", text: "মুয়াবিয়া (রা.)" },
      { letter: "C", text: "ইয়াজিদ" },
      { letter: "D", text: "আবদুল মালিক" }
    ],
    correctLetter: "B",
    explanation: "মুয়াবিয়া (রা.) ৬৬১ সালে উমাইয়া খিলাফত প্রতিষ্ঠা করেন; রাজধানী দামেস্ক।",
    difficulty: "medium",
    sourceNote: "NCTB HSC ইসলামের ইতিহাস ১ম পত্র — উমাইয়া খিলাফত",
  },
  {
    id: "ACAD-3064",
    classId: "class-11",
    subjectId: "islamic-history",
    chapterId: "acad-class-11-isl-his-topic-4",
    chapterName: "আব্বাসীয়",
    unitNumber: 4,
    topicId: "topic-4",
    questionText: "আব্বাসীয় খিলাফতের রাজধানী কোথায় ছিল?",
    options: [
      { letter: "A", text: "বাগদাদ" },
      { letter: "B", text: "দামেস্ক" },
      { letter: "C", text: "কর্ডোভা" },
      { letter: "D", text: "কায়রো" }
    ],
    correctLetter: "A",
    explanation: "৭৬২ সালে খলিফা আল-মনসুর বাগদাদ নগর প্রতিষ্ঠা করেন।",
    difficulty: "medium",
    sourceNote: "NCTB HSC ইসলামের ইতিহাস ১ম পত্র — আব্বাসীয় খিলাফত",
  },
  {
    id: "ACAD-3065",
    classId: "class-11",
    subjectId: "islamic-history",
    chapterId: "acad-class-11-isl-his-topic-5",
    chapterName: "স্পেনে ইসলাম",
    unitNumber: 5,
    topicId: "topic-5",
    questionText: "স্পেনে মুসলিম শাসনের সূচনা করেন কে?",
    options: [
      { letter: "A", text: "তারিক ইবনে জিয়াদ" },
      { letter: "B", text: "ইউসুফ ইবনে তাশফিন" },
      { letter: "C", text: "আবদুর রহমান" },
      { letter: "D", text: "মুসা ইবনে নুসাইর" }
    ],
    correctLetter: "A",
    explanation: "৭১১ সালে তারিক ইবনে জিয়াদ স্পেন বিজয় করেন।",
    difficulty: "medium",
    sourceNote: "NCTB HSC ইসলামের ইতিহাস ১ম পত্র — স্পেনে মুসলিম শাসন",
  },
  {
    id: "ACAD-3066",
    classId: "class-11",
    subjectId: "islamic-history",
    chapterId: "acad-class-11-isl-his-topic-6",
    chapterName: "ভারতে ইসলাম",
    unitNumber: 6,
    topicId: "topic-6",
    questionText: "ভারতে মুসলিম শাসনের ভিত্তি স্থাপন করেন কে?",
    options: [
      { letter: "A", text: "মাহমুদ গজনভি" },
      { letter: "B", text: "বাবর" },
      { letter: "C", text: "মুহম্মদ ঘুরি" },
      { letter: "D", text: "কুতুবউদ্দিন আইবেক" }
    ],
    correctLetter: "C",
    explanation: "১১৯২ সালে তরাইনের দ্বিতীয় যুদ্ধে জয়ের পর মুহম্মদ ঘুরি দিল্লিতে মুসলিম শাসনের ভিত্তি স্থাপন করেন।",
    difficulty: "medium",
    sourceNote: "NCTB HSC ইসলামের ইতিহাস ২য় পত্র — ভারতে মুসলিম শাসন",
  },
  {
    id: "ACAD-3067",
    classId: "class-11",
    subjectId: "islamic-history",
    chapterId: "acad-class-11-isl-his-topic-7",
    chapterName: "মুঘল",
    unitNumber: 7,
    topicId: "topic-7",
    questionText: "মুঘল সাম্রাজ্যের প্রতিষ্ঠাতা কে?",
    options: [
      { letter: "A", text: "হুমায়ূন" },
      { letter: "B", text: "আকবর" },
      { letter: "C", text: "বাবর" },
      { letter: "D", text: "শাহজাহান" }
    ],
    correctLetter: "C",
    explanation: "১৫২৬ সালে পানিপথের প্রথম যুদ্ধে জিতে বাবর মুঘল সাম্রাজ্য প্রতিষ্ঠা করেন।",
    difficulty: "medium",
    sourceNote: "NCTB HSC ইসলামের ইতিহাস ২য় পত্র — মুঘল সাম্রাজ্য",
  },
  {
    id: "ACAD-3068",
    classId: "class-11",
    subjectId: "islamic-history",
    chapterId: "acad-class-11-isl-his-topic-8",
    chapterName: "বাংলায় ইসলাম",
    unitNumber: 8,
    topicId: "topic-8",
    questionText: "বাংলায় ইসলাম প্রচারে প্রধান ভূমিকা রাখেন কারা?",
    options: [
      { letter: "A", text: "শুধু শাসকরা" },
      { letter: "B", text: "সুফি সাধকরা" },
      { letter: "C", text: "শুধু ব্যবসায়ীরা" },
      { letter: "D", text: "শুধু সৈন্যরা" }
    ],
    correctLetter: "B",
    explanation: "সুফি সাধকদের শান্তিপূর্ণ প্রচারে বাংলায় ইসলাম ব্যাপকভাবে ছড়ায়।",
    difficulty: "medium",
    sourceNote: "NCTB HSC ইসলামের ইতিহাস ২য় পত্র — বাংলায় ইসলাম",
  },
  {
    id: "ACAD-3070",
    classId: "class-11",
    subjectId: "islamic-history",
    chapterId: "acad-class-11-isl-his-topic-9",
    chapterName: "ইসলামী সভ্যতা",
    unitNumber: 9,
    topicId: "topic-9",
    questionText: "বায়তুল হিকমা কী ছিল?",
    options: [
      { letter: "A", text: "জ্ঞানচর্চার কেন্দ্র (গ্রন্থাগার ও গবেষণাগার)" },
      { letter: "B", text: "মসজিদ" },
      { letter: "C", text: "দুর্গ" },
      { letter: "D", text: "বাজার" }
    ],
    correctLetter: "A",
    explanation: "বাগদাদের বায়তুল হিকমা ছিল অনুবাদ ও গবেষণার বিখ্যাত কেন্দ্র।",
    difficulty: "medium",
    sourceNote: "NCTB HSC ইসলামের ইতিহাস ১ম পত্র — ইসলামী সভ্যতা",
  },
  {
    id: "ACAD-8061",
    classId: "class-11",
    subjectId: "islamic-history",
    chapterId: "acad-class-11-isl-his-topic-1",
    chapterName: "ইসলামের আবির্ভাব",
    unitNumber: 1,
    topicId: "topic-1",
    questionText: "হিজরত হয় কত খ্রিষ্টাব্দে?",
    options: [
      { letter: "A", text: "৬২২" },
      { letter: "B", text: "৬৩০" },
      { letter: "C", text: "৬১০" },
      { letter: "D", text: "৬৩২" }
    ],
    correctLetter: "A",
    explanation: "৬২২ খ্রিষ্টাব্দে হযরত মুহাম্মদ (সা.) মক্কা থেকে মদিনায় হিজরত করেন।",
    difficulty: "medium",
    sourceNote: "NCTB HSC ইসলামের ইতিহাস ১ম পত্র — হিজরত",
  },
  {
    id: "ACAD-8062",
    classId: "class-11",
    subjectId: "islamic-history",
    chapterId: "acad-class-11-isl-his-topic-2",
    chapterName: "খিলাফত",
    unitNumber: 2,
    topicId: "topic-2",
    questionText: "দ্বিতীয় খলিফা কে ছিলেন?",
    options: [
      { letter: "A", text: "হযরত আলী (রা.)" },
      { letter: "B", text: "হযরত আবু বকর (রা.)" },
      { letter: "C", text: "হযরত ওসমান (রা.)" },
      { letter: "D", text: "হযরত ওমর (রা.)" }
    ],
    correctLetter: "D",
    explanation: "হযরত ওমর (রা.) ৬৩৪–৬৪৪ সালে খলিফা ছিলেন।",
    difficulty: "medium",
    sourceNote: "NCTB HSC ইসলামের ইতিহাস ১ম পত্র — খিলাফতে রাশেদা",
  },
  {
    id: "ACAD-8063",
    classId: "class-11",
    subjectId: "islamic-history",
    chapterId: "acad-class-11-isl-his-topic-3",
    chapterName: "উমাইয়া",
    unitNumber: 3,
    topicId: "topic-3",
    questionText: "উমাইয়া খিলাফতের রাজধানী কোথায় ছিল?",
    options: [
      { letter: "A", text: "মদিনা" },
      { letter: "B", text: "কায়রো" },
      { letter: "C", text: "দামেস্ক" },
      { letter: "D", text: "বাগদাদ" }
    ],
    correctLetter: "C",
    explanation: "উমাইয়া খিলাফতের রাজধানী ছিল দামেস্ক।",
    difficulty: "medium",
    sourceNote: "NCTB HSC ইসলামের ইতিহাস ১ম পত্র — উমাইয়া খিলাফত",
  },
  {
    id: "ACAD-8064",
    classId: "class-11",
    subjectId: "islamic-history",
    chapterId: "acad-class-11-isl-his-topic-4",
    chapterName: "আব্বাসীয়",
    unitNumber: 4,
    topicId: "topic-4",
    questionText: "আব্বাসীয় যুগের শ্রেষ্ঠ খলিফা কে ছিলেন?",
    options: [
      { letter: "A", text: "আল-মনসুর" },
      { letter: "B", text: "আল-মামুন" },
      { letter: "C", text: "হারুনুর রশিদ" },
      { letter: "D", text: "আল-মুতাওয়াক্কিল" }
    ],
    correctLetter: "C",
    explanation: "হারুনুর রশিদের (৭৮৬–৮০৯) আমলে বাগদাদ জ্ঞান-বিজ্ঞানে শ্রেষ্ঠত্বে পৌঁছায়।",
    difficulty: "medium",
    sourceNote: "NCTB HSC ইসলামের ইতিহাস ১ম পত্র — আব্বাসীয় খিলাফত",
  },
  {
    id: "ACAD-8065",
    classId: "class-11",
    subjectId: "islamic-history",
    chapterId: "acad-class-11-isl-his-topic-5",
    chapterName: "স্পেনে ইসলাম",
    unitNumber: 5,
    topicId: "topic-5",
    questionText: "কর্ডোভা ছিল —",
    options: [
      { letter: "A", text: "মিসরের রাজধানী" },
      { letter: "B", text: "পারস্যের শহর" },
      { letter: "C", text: "স্পেনে মুসলিম জ্ঞানের কেন্দ্র" },
      { letter: "D", text: "তুরস্কের বন্দর" }
    ],
    correctLetter: "C",
    explanation: "কর্ডোভা উমাইয়া স্পেনের রাজধানী ও জ্ঞানচর্চার কেন্দ্র ছিল।",
    difficulty: "medium",
    sourceNote: "NCTB HSC ইসলামের ইতিহাস ১ম পত্র — স্পেনে মুসলিম শাসন",
  },
  {
    id: "ACAD-8066",
    classId: "class-11",
    subjectId: "islamic-history",
    chapterId: "acad-class-11-isl-his-topic-6",
    chapterName: "ভারতে ইসলাম",
    unitNumber: 6,
    topicId: "topic-6",
    questionText: "দিল্লি সালতানাতের প্রথম সুলতান কে?",
    options: [
      { letter: "A", text: "কুতুবউদ্দিন আইবেক" },
      { letter: "B", text: "আলাউদ্দিন খলজি" },
      { letter: "C", text: "ইলতুতমিশ" },
      { letter: "D", text: "বলবন" }
    ],
    correctLetter: "A",
    explanation: "১২০৬ সালে কুতুবউদ্দিন আইবেক দিল্লি সালতানাত প্রতিষ্ঠা করেন।",
    difficulty: "medium",
    sourceNote: "NCTB HSC ইসলামের ইতিহাস ২য় পত্র — দিল্লি সালতানাত",
  },
  {
    id: "ACAD-8067",
    classId: "class-11",
    subjectId: "islamic-history",
    chapterId: "acad-class-11-isl-his-topic-7",
    chapterName: "মুঘল",
    unitNumber: 7,
    topicId: "topic-7",
    questionText: "আকবর কোন নীতি প্রবর্তন করেন?",
    options: [
      { letter: "A", text: "মনসবদারি শুধু" },
      { letter: "B", text: "সুলহ-ই-কুল" },
      { letter: "C", text: "জিজিয়া" },
      { letter: "D", text: "জমিদারি" }
    ],
    correctLetter: "B",
    explanation: "আকবরের সুলহ-ই-কুল নীতিতে সব ধর্মের প্রতি সহনশীলতা দেখানো হয়।",
    difficulty: "medium",
    sourceNote: "NCTB HSC ইসলামের ইতিহাস ২য় পত্র — মুঘল সাম্রাজ্য",
  },
  {
    id: "ACAD-8068",
    classId: "class-11",
    subjectId: "islamic-history",
    chapterId: "acad-class-11-isl-his-topic-8",
    chapterName: "বাংলায় ইসলাম",
    unitNumber: 8,
    topicId: "topic-8",
    questionText: "শাহ জালাল (র.) কোথায় ইসলাম প্রচার করেন?",
    options: [
      { letter: "A", text: "খুলনা" },
      { letter: "B", text: "সিলেট" },
      { letter: "C", text: "ঢাকা" },
      { letter: "D", text: "চট্টগ্রাম" }
    ],
    correctLetter: "B",
    explanation: "হযরত শাহজালাল (র.) সিলেটে ইসলাম প্রচার করেন।",
    difficulty: "medium",
    sourceNote: "NCTB HSC ইসলামের ইতিহাস ২য় পত্র — বাংলায় ইসলাম",
  },
  {
    id: "ACAD-8070",
    classId: "class-11",
    subjectId: "islamic-history",
    chapterId: "acad-class-11-isl-his-topic-9",
    chapterName: "ইসলামী সভ্যতা",
    unitNumber: 9,
    topicId: "topic-9",
    questionText: "আল-খোয়ারিজমি কোন বিষয়ে বিখ্যাত?",
    options: [
      { letter: "A", text: "জ্যোতির্বিজ্ঞান শুধু" },
      { letter: "B", text: "দর্শন শুধু" },
      { letter: "C", text: "চিকিৎসা" },
      { letter: "D", text: "বীজগণিত" }
    ],
    correctLetter: "D",
    explanation: "আল-খোয়ারিজমির বই থেকেই 'অ্যালজেবরা' (বীজগণিত) শব্দটি এসেছে।",
    difficulty: "medium",
    sourceNote: "NCTB HSC ইসলামের ইতিহাস ১ম পত্র — ইসলামী সভ্যতা",
  },
  {
    id: "ACAD-8071",
    classId: "class-11",
    subjectId: "islamic-history",
    chapterId: "acad-class-11-isl-his-topic-10",
    chapterName: "চিকিৎসা",
    unitNumber: 10,
    topicId: "topic-10",
    questionText: "ইবনে সিনা কোন গ্রন্থের লেখক?",
    options: [
      { letter: "A", text: "তুহফাত" },
      { letter: "B", text: "কানুন ফিত-তিব্ব" },
      { letter: "C", text: "শিফা শুধু" },
      { letter: "D", text: "আল-জাবর" }
    ],
    correctLetter: "B",
    explanation: "ইবনে সিনার 'কানুন ফিত-তিব্ব' (Canon of Medicine) শতাব্দী ধরে চিকিৎসার পাঠ্য ছিল।",
    difficulty: "medium",
    sourceNote: "NCTB HSC ইসলামের ইতিহাস ১ম পত্র — ইসলামী সভ্যতা",
  },
  {
    id: "ACAD-8072",
    classId: "class-11",
    subjectId: "islamic-history",
    chapterId: "acad-class-11-isl-his-topic-11",
    chapterName: "স্থাপত্য",
    unitNumber: 11,
    topicId: "topic-11",
    questionText: "তাজমহল নির্মাণ করেন কে?",
    options: [
      { letter: "A", text: "বাবর" },
      { letter: "B", text: "শাহজাহান" },
      { letter: "C", text: "জাহাঙ্গীর" },
      { letter: "D", text: "আকবর" }
    ],
    correctLetter: "B",
    explanation: "শাহজাহান স্ত্রী মমতাজের স্মরণে আগ্রায় তাজমহল নির্মাণ করেন।",
    difficulty: "medium",
    sourceNote: "NCTB HSC ইসলামের ইতিহাস ২য় পত্র — মুঘল স্থাপত্য",
  },
];
