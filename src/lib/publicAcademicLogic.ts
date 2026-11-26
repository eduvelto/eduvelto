// Eduvelto — Academic Logic practice questions (Class 11),
// verified for fact correctness + on-syllabus (review 26 Nov 2026).
//
// Static data ONLY — zero Firestore reads. The 22 questions are the
// Academic Class 11 Logic drafts AFTER review (see
// review-academic-c11-12-logic-verdicts.json and
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
// to PUBLIC_ACADEMIC_LOGIC_QUESTIONS below (same shape, same generation
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

/** All verified Academic Logic questions, Class 11 (in draft order). */
export const PUBLIC_ACADEMIC_LOGIC_QUESTIONS: PublicAcademicQuestion[] = [
  {
    id: "ACAD-3021",
    classId: "class-11",
    subjectId: "logic",
    chapterId: "acad-class-11-log-topic-1",
    chapterName: "যুক্তিবিদ্যা",
    unitNumber: 1,
    topicId: "topic-1",
    questionText: "যুক্তিবিদ্যা কী নিয়ে আলোচনা করে?",
    options: [
      { letter: "A", text: "শুধু বিজ্ঞান" },
      { letter: "B", text: "শুধু ইতিহাস" },
      { letter: "C", text: "সঠিক চিন্তার নিয়ম" },
      { letter: "D", text: "শুধু গণিত" }
    ],
    correctLetter: "C",
    explanation: "যুক্তিবিদ্যা সঠিকভাবে চিন্তা ও যুক্তি দেওয়ার নিয়ম নিয়ে আলোচনা করে।",
    difficulty: "easy",
    sourceNote: "NCTB HSC যুক্তিবিদ্যা ১ম পত্র — অধ্যায় ১",
  },
  {
    id: "ACAD-3022",
    classId: "class-11",
    subjectId: "logic",
    chapterId: "acad-class-11-log-topic-2",
    chapterName: "পদ",
    unitNumber: 2,
    topicId: "topic-2",
    questionText: "যে শব্দ বা শব্দসমষ্টি কোনো কিছু নির্দেশ করে, তাকে কী বলে?",
    options: [
      { letter: "A", text: "পদ" },
      { letter: "B", text: "যুক্তি" },
      { letter: "C", text: "অনুমান" },
      { letter: "D", text: "বাক্য" }
    ],
    correctLetter: "A",
    explanation: "পদ হলো যুক্তিবাক্যের অংশ; বাক্য গঠিত হয় পদ দিয়ে।",
    difficulty: "medium",
    sourceNote: "NCTB HSC যুক্তিবিদ্যা ১ম পত্র — পদ অধ্যায়",
  },
  {
    id: "ACAD-3023",
    classId: "class-11",
    subjectId: "logic",
    chapterId: "acad-class-11-log-topic-3",
    chapterName: "অবরোহ অনুমান",
    unitNumber: 3,
    topicId: "topic-3",
    questionText: "সব মানুষ মরণশীল; সক্রেটিস মানুষ; সুতরাং সক্রেটিস মরণশীল — এটি কোন অনুমান?",
    options: [
      { letter: "A", text: "সাদৃশ্য" },
      { letter: "B", text: "অবরোহ" },
      { letter: "C", text: "সম্ভাবনা" },
      { letter: "D", text: "আরোহ" }
    ],
    correctLetter: "B",
    explanation: "সাধারণ সত্য থেকে বিশেষ সিদ্ধান্তে যাওয়া অবরোহ অনুমান।",
    difficulty: "medium",
    sourceNote: "NCTB HSC যুক্তিবিদ্যা ১ম পত্র — অনুমান অধ্যায়",
  },
  {
    id: "ACAD-3024",
    classId: "class-11",
    subjectId: "logic",
    chapterId: "acad-class-11-log-topic-4",
    chapterName: "আরোহ অনুমান",
    unitNumber: 4,
    topicId: "topic-4",
    questionText: "বিশেষ দৃষ্টান্ত থেকে সাধারণ সিদ্ধান্তে যাওয়া কী?",
    options: [
      { letter: "A", text: "সংজ্ঞা" },
      { letter: "B", text: "যুক্তিবাক্য" },
      { letter: "C", text: "অবরোহ অনুমান" },
      { letter: "D", text: "আরোহ অনুমান" }
    ],
    correctLetter: "D",
    explanation: "আরোহে পর্যবেক্ষণ থেকে সাধারণ নিয়মে পৌঁছানো হয়।",
    difficulty: "medium",
    sourceNote: "NCTB HSC যুক্তিবিদ্যা ১ম পত্র — আরোহ অনুমান",
  },
  {
    id: "ACAD-3025",
    classId: "class-11",
    subjectId: "logic",
    chapterId: "acad-class-11-log-topic-5",
    chapterName: "সহানুমান",
    unitNumber: 5,
    topicId: "topic-5",
    questionText: "সহানুমানে কয়টি যুক্তিবাক্য থাকে?",
    options: [
      { letter: "A", text: "৪টি" },
      { letter: "B", text: "১টি" },
      { letter: "C", text: "৩টি" },
      { letter: "D", text: "২টি" }
    ],
    correctLetter: "C",
    explanation: "সহানুমানে ২টি আশ্রয়বাক্য ও ১টি সিদ্ধান্ত — মোট ৩টি যুক্তিবাক্য।",
    difficulty: "medium",
    sourceNote: "NCTB HSC যুক্তিবিদ্যা ১ম পত্র — সহানুমান",
  },
  {
    id: "ACAD-3026",
    classId: "class-11",
    subjectId: "logic",
    chapterId: "acad-class-11-log-topic-6",
    chapterName: "অনুপপত্তি",
    unitNumber: 6,
    topicId: "topic-6",
    questionText: "অনুমানের ভুলকে কী বলে?",
    options: [
      { letter: "A", text: "অনুপপত্তি" },
      { letter: "B", text: "সংজ্ঞা" },
      { letter: "C", text: "আশ্রয়বাক্য" },
      { letter: "D", text: "সিদ্ধান্ত" }
    ],
    correctLetter: "A",
    explanation: "যুক্তিতে ভুল থাকলে তাকে অনুপপত্তি (fallacy) বলে।",
    difficulty: "hard",
    sourceNote: "NCTB HSC যুক্তিবিদ্যা ২য় পত্র — অনুপপত্তি",
  },
  {
    id: "ACAD-3027",
    classId: "class-11",
    subjectId: "logic",
    chapterId: "acad-class-11-log-topic-7",
    chapterName: "সংজ্ঞা",
    unitNumber: 7,
    topicId: "topic-7",
    questionText: "ভালো সংজ্ঞার শর্ত কোনটি?",
    options: [
      { letter: "A", text: "সংজ্ঞায় অলংকার থাকবে" },
      { letter: "B", text: "সংজ্ঞা স্পষ্ট ও সংক্ষিপ্ত হবে" },
      { letter: "C", text: "সংজ্ঞা অস্পষ্ট হবে" },
      { letter: "D", text: "সংজ্ঞা দীর্ঘ হবে" }
    ],
    correctLetter: "B",
    explanation: "ভালো সংজ্ঞা স্পষ্ট, সংক্ষিপ্ত ও সংজ্ঞেয়ের সমান ব্যাপক হয়।",
    difficulty: "medium",
    sourceNote: "NCTB HSC যুক্তিবিদ্যা ১ম পত্র — সংজ্ঞা",
  },
  {
    id: "ACAD-3028",
    classId: "class-11",
    subjectId: "logic",
    chapterId: "acad-class-11-log-topic-8",
    chapterName: "বিভাগ",
    unitNumber: 8,
    topicId: "topic-8",
    questionText: "একটি শ্রেণিকে উপশ্রেণিতে ভাগ করাকে কী বলে?",
    options: [
      { letter: "A", text: "বিভাগ" },
      { letter: "B", text: "ব্যাখ্যা" },
      { letter: "C", text: "সংজ্ঞা" },
      { letter: "D", text: "শ্রেণিকরণ শুধু" }
    ],
    correctLetter: "A",
    explanation: "বিভাগে একটি জাতিকে তার উপজাতিতে ভাগ করা হয়।",
    difficulty: "medium",
    sourceNote: "NCTB HSC যুক্তিবিদ্যা ১ম পত্র — বিভাগ",
  },
  {
    id: "ACAD-3029",
    classId: "class-11",
    subjectId: "logic",
    chapterId: "acad-class-11-log-topic-9",
    chapterName: "কার্যকারণ",
    unitNumber: 9,
    topicId: "topic-9",
    questionText: "কারণ ছাড়া কার্য হয় না — এটি কোন নীতি?",
    options: [
      { letter: "A", text: "সাদৃশ্য নীতি" },
      { letter: "B", text: "সম্ভাবনা নীতি" },
      { letter: "C", text: "অনুমান নীতি" },
      { letter: "D", text: "কার্যকারণ নীতি" }
    ],
    correctLetter: "D",
    explanation: "প্রতিটি কার্যের কারণ আছে — এটাই কার্যকারণ নীতি; বৈজ্ঞানিক অনুমানের ভিত্তি।",
    difficulty: "medium",
    sourceNote: "NCTB HSC যুক্তিবিদ্যা ২য় পত্র — কার্যকারণ",
  },
  {
    id: "ACAD-3030",
    classId: "class-11",
    subjectId: "logic",
    chapterId: "acad-class-11-log-topic-10",
    chapterName: "প্রতীকী যুক্তিবিদ্যা",
    unitNumber: 10,
    topicId: "topic-10",
    questionText: "‘p ∧ q’ চিহ্নটি কী বোঝায়?",
    options: [
      { letter: "A", text: "p হলে q" },
      { letter: "B", text: "p নয়" },
      { letter: "C", text: "p এবং q উভয়ই সত্য" },
      { letter: "D", text: "p অথবা q" }
    ],
    correctLetter: "C",
    explanation: "∧ হলো সংযোজন (conjunction): p ∧ q সত্য হয় যখন উভয়ই সত্য।",
    difficulty: "hard",
    sourceNote: "NCTB HSC যুক্তিবিদ্যা ২য় পত্র — প্রতীকী যুক্তিবিদ্যা",
  },
  {
    id: "ACAD-8013",
    classId: "class-11",
    subjectId: "logic",
    chapterId: "acad-class-11-log-topic-1",
    chapterName: "যুক্তিবিদ্যা",
    unitNumber: 1,
    topicId: "topic-1",
    questionText: "যুক্তিবিদ্যার জনক কাকে বলা হয়?",
    options: [
      { letter: "A", text: "প্লেটো" },
      { letter: "B", text: "অ্যারিস্টটল" },
      { letter: "C", text: "সক্রেটিস" },
      { letter: "D", text: "দেকার্ত" }
    ],
    correctLetter: "B",
    explanation: "অ্যারিস্টটল যুক্তিবিদ্যার প্রথম পদ্ধতিগত রূপ দেন বলে তাঁকে জনক বলা হয়।",
    difficulty: "medium",
    sourceNote: "NCTB HSC যুক্তিবিদ্যা ১ম পত্র — যুক্তিবিদ্যা পরিচিতি",
  },
  {
    id: "ACAD-8014",
    classId: "class-11",
    subjectId: "logic",
    chapterId: "acad-class-11-log-topic-2",
    chapterName: "পদ",
    unitNumber: 2,
    topicId: "topic-2",
    questionText: "পদের ব্যাপ্যতা বলতে কী বোঝায়?",
    options: [
      { letter: "A", text: "পদের দৈর্ঘ্য" },
      { letter: "B", text: "পদ কতগুলো বস্তুকে নির্দেশ করে" },
      { letter: "C", text: "পদের বানান" },
      { letter: "D", text: "পদের উচ্চারণ" }
    ],
    correctLetter: "B",
    explanation: "ব্যাপ্যতা হলো পদটি কত ব্যাপক শ্রেণিকে নির্দেশ করে।",
    difficulty: "medium",
    sourceNote: "NCTB HSC যুক্তিবিদ্যা ১ম পত্র — পদ",
  },
  {
    id: "ACAD-8015",
    classId: "class-11",
    subjectId: "logic",
    chapterId: "acad-class-11-log-topic-3",
    chapterName: "অবরোহ অনুমান",
    unitNumber: 3,
    topicId: "topic-3",
    questionText: "অবরোহ অনুমানে সিদ্ধান্ত কেমন হয়?",
    options: [
      { letter: "A", text: "অনিশ্চিত" },
      { letter: "B", text: "ভুল" },
      { letter: "C", text: "নিশ্চিত" },
      { letter: "D", text: "সম্ভাব্য" }
    ],
    correctLetter: "C",
    explanation: "অবরোহে আশ্রয়বাক্য সত্য হলে সিদ্ধান্ত নিশ্চিতভাবে সত্য হয়।",
    difficulty: "medium",
    sourceNote: "NCTB HSC যুক্তিবিদ্যা ১ম পত্র — অনুমান",
  },
  {
    id: "ACAD-8016",
    classId: "class-11",
    subjectId: "logic",
    chapterId: "acad-class-11-log-topic-4",
    chapterName: "আরোহ অনুমান",
    unitNumber: 4,
    topicId: "topic-4",
    questionText: "আরোহ অনুমানে সিদ্ধান্ত কেমন হয়?",
    options: [
      { letter: "A", text: "অপ্রয়োজনীয়" },
      { letter: "B", text: "অসম্ভব" },
      { letter: "C", text: "নিশ্চিত" },
      { letter: "D", text: "সম্ভাব্য" }
    ],
    correctLetter: "D",
    explanation: "আরোহে বিশেষ থেকে সাধারণে যাওয়া হয় বলে সিদ্ধান্ত সম্ভাব্য থাকে।",
    difficulty: "medium",
    sourceNote: "NCTB HSC যুক্তিবিদ্যা ১ম পত্র — আরোহ অনুমান",
  },
  {
    id: "ACAD-8017",
    classId: "class-11",
    subjectId: "logic",
    chapterId: "acad-class-11-log-topic-5",
    chapterName: "সহানুমান",
    unitNumber: 5,
    topicId: "topic-5",
    questionText: "সহানুমানের মধ্যপদ কী?",
    options: [
      { letter: "A", text: "যে পদ দুই আশ্রয়বাক্যেই থাকে কিন্তু সিদ্ধান্তে থাকে না" },
      { letter: "B", text: "যে পদ মুখ্য" },
      { letter: "C", text: "যে পদ সিদ্ধান্তে থাকে" },
      { letter: "D", text: "যে পদ একবারই আসে" }
    ],
    correctLetter: "A",
    explanation: "মধ্যপদ দুই আশ্রয়বাক্যকে যুক্ত করে; সিদ্ধান্তে তা থাকে না।",
    difficulty: "medium",
    sourceNote: "NCTB HSC যুক্তিবিদ্যা ১ম পত্র — সহানুমান",
  },
  {
    id: "ACAD-8018",
    classId: "class-11",
    subjectId: "logic",
    chapterId: "acad-class-11-log-topic-6",
    chapterName: "অনুপপত্তি",
    unitNumber: 6,
    topicId: "topic-6",
    questionText: "ব্যক্তিগত আক্রমণের অনুপপত্তিকে কী বলে?",
    options: [
      { letter: "A", text: "Ad hominem" },
      { letter: "B", text: "Strawman" },
      { letter: "C", text: "Slippery slope" },
      { letter: "D", text: "False dilemma" }
    ],
    correctLetter: "A",
    explanation: "যুক্তির বদলে ব্যক্তিকে আক্রমণ করাই ad hominem অনুপপত্তি।",
    difficulty: "medium",
    sourceNote: "NCTB HSC যুক্তিবিদ্যা ২য় পত্র — অনুপপত্তি",
  },
  {
    id: "ACAD-8019",
    classId: "class-11",
    subjectId: "logic",
    chapterId: "acad-class-11-log-topic-7",
    chapterName: "সংজ্ঞা",
    unitNumber: 7,
    topicId: "topic-7",
    questionText: "সংজ্ঞায় চক্রক দোষ কী?",
    options: [
      { letter: "A", text: "সংজ্ঞা সংক্ষিপ্ত করা" },
      { letter: "B", text: "সংজ্ঞা দীর্ঘ করা" },
      { letter: "C", text: "সংজ্ঞায় উদাহরণ দেওয়া" },
      { letter: "D", text: "সংজ্ঞায় সংজ্ঞেয় শব্দই ব্যবহার করা" }
    ],
    correctLetter: "D",
    explanation: "যে শব্দের সংজ্ঞা দেওয়া হচ্ছে সেই শব্দই সংজ্ঞায় থাকলে তা চক্রক দোষ।",
    difficulty: "medium",
    sourceNote: "NCTB HSC যুক্তিবিদ্যা ১ম পত্র — সংজ্ঞা",
  },
  {
    id: "ACAD-8020",
    classId: "class-11",
    subjectId: "logic",
    chapterId: "acad-class-11-log-topic-8",
    chapterName: "বিভাগ",
    unitNumber: 8,
    topicId: "topic-8",
    questionText: "ভালো বিভাগের শর্ত কোনটি?",
    options: [
      { letter: "A", text: "বিভাগ একটিই হবে" },
      { letter: "B", text: "বিভাগ পরস্পরবিরোধী ও সম্পূর্ণ হবে" },
      { letter: "C", text: "বিভাগ অসম্পূর্ণ হবে" },
      { letter: "D", text: "বিভাগে মিল থাকবে" }
    ],
    correctLetter: "B",
    explanation: "ভালো বিভাগে উপশ্রেণিগুলো পরস্পর আলাদা ও মিলে সম্পূর্ণ হয়।",
    difficulty: "medium",
    sourceNote: "NCTB HSC যুক্তিবিদ্যা ১ম পত্র — বিভাগ",
  },
  {
    id: "ACAD-8021",
    classId: "class-11",
    subjectId: "logic",
    chapterId: "acad-class-11-log-topic-9",
    chapterName: "কার্যকারণ",
    unitNumber: 9,
    topicId: "topic-9",
    questionText: "মিলের অন্বয় পদ্ধতি কী?",
    options: [
      { letter: "A", text: "কারণ খুঁজতে পার্থক্য দেখা" },
      { letter: "B", text: "কারণ অস্বীকার করা" },
      { letter: "C", text: "কারণ অনুমান করা" },
      { letter: "D", text: "কারণ খুঁজতে মিল দেখা" }
    ],
    correctLetter: "D",
    explanation: "অন্বয় পদ্ধতিতে বিভিন্ন দৃষ্টান্তের মিল থেকে কারণ নির্ণয় করা হয়।",
    difficulty: "medium",
    sourceNote: "NCTB HSC যুক্তিবিদ্যা ২য় পত্র — কার্যকারণ",
  },
  {
    id: "ACAD-8022",
    classId: "class-11",
    subjectId: "logic",
    chapterId: "acad-class-11-log-topic-10",
    chapterName: "প্রতীকী যুক্তিবিদ্যা",
    unitNumber: 10,
    topicId: "topic-10",
    questionText: "‘p ∨ q’ সত্য হয় কখন?",
    options: [
      { letter: "A", text: "কখনোই নয়" },
      { letter: "B", text: "p বা q যেকোনো একটি সত্য হলে" },
      { letter: "C", text: "উভয়ই মিথ্যা হলে" },
      { letter: "D", text: "উভয়ই সত্য হলে" }
    ],
    correctLetter: "B",
    explanation: "∨ হলো বিকল্প (disjunction): একটি সত্য হলেই সত্য হয়।",
    difficulty: "medium",
    sourceNote: "NCTB HSC যুক্তিবিদ্যা ২য় পত্র — প্রতীকী যুক্তিবিদ্যা",
  },
  {
    id: "ACAD-8023",
    classId: "class-11",
    subjectId: "logic",
    chapterId: "acad-class-11-log-topic-11",
    chapterName: "যুক্তিবাক্য",
    unitNumber: 11,
    topicId: "topic-11",
    questionText: "সার্বিক ইতিবাচক যুক্তিবাক্যের চিহ্ন কী?",
    options: [
      { letter: "A", text: "A" },
      { letter: "B", text: "I" },
      { letter: "C", text: "E" },
      { letter: "D", text: "O" }
    ],
    correctLetter: "A",
    explanation: "A = সার্বিক ইতিবাচক (সব S হয় P); E = সার্বিক নেতিবাচক; I = বিশেষ ইতিবাচক; O = বিশেষ নেতিবাচক।",
    difficulty: "medium",
    sourceNote: "NCTB HSC যুক্তিবিদ্যা ১ম পত্র — যুক্তিবাক্য",
  },
  {
    id: "ACAD-8024",
    classId: "class-11",
    subjectId: "logic",
    chapterId: "acad-class-11-log-topic-12",
    chapterName: "বৈজ্ঞানিক পদ্ধতি",
    unitNumber: 12,
    topicId: "topic-12",
    questionText: "বৈজ্ঞানিক অনুমানের প্রথম ধাপ কী?",
    options: [
      { letter: "A", text: "পরীক্ষা" },
      { letter: "B", text: "সিদ্ধান্ত" },
      { letter: "C", text: "পর্যবেক্ষণ" },
      { letter: "D", text: "তত্ত্ব" }
    ],
    correctLetter: "C",
    explanation: "বৈজ্ঞানিক পদ্ধতি শুরু হয় পর্যবেক্ষণ দিয়ে, তারপর অনুকল্প ও পরীক্ষা।",
    difficulty: "medium",
    sourceNote: "NCTB HSC যুক্তিবিদ্যা ২য় পত্র — বৈজ্ঞানিক পদ্ধতি",
  },
];
