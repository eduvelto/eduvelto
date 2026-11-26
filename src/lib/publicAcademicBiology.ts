// Eduvelto — Academic Biology practice questions (Class 9),
// verified against the Dakhil NCTB books (review 26 Nov 2026).
//
// Static data ONLY — zero Firestore reads. The 22 questions are the
// Academic Class 9 Biology drafts AFTER review (see
// review-academic-c9-biology-verdicts.json and
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
// their fixes applied). The one NEEDS-FIX item left out (ACAD-5108) is NOT here — its citation is unresolved and a teacher decision is owed.
//
// HOW NEW BATCHES JOIN: append the next verified batch's questions
// to PUBLIC_ACADEMIC_BIOLOGY_QUESTIONS below (same shape, same generation
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

/** All verified Academic Biology questions, Class 9 (in draft order). */
export const PUBLIC_ACADEMIC_BIOLOGY_QUESTIONS: PublicAcademicQuestion[] = [
  {
    id: "ACAD-0087",
    classId: "class-9",
    subjectId: "biology",
    chapterId: "acad-class-9-bio-chapter-1",
    chapterName: "অধ্যায় ১: জীবন পাঠ",
    unitNumber: 1,
    topicId: "chapter-1",
    questionText: "জীববিজ্ঞানের জনক কাকে বলা হয়?",
    options: [
      { letter: "A", text: "অ্যারিস্টটল" },
      { letter: "B", text: "ডারউইন" },
      { letter: "C", text: "মেন্ডেল" },
      { letter: "D", text: "লিনিয়াস" }
    ],
    correctLetter: "A",
    explanation: "অ্যারিস্টটলকে জীববিজ্ঞানের জনক বলা হয়।",
    difficulty: "easy",
    sourceNote: "NCTB জীববিজ্ঞান, নবম-দশম শ্রেণি — অধ্যায় ১: জীবন পাঠ",
  },
  {
    id: "ACAD-0088",
    classId: "class-9",
    subjectId: "biology",
    chapterId: "acad-class-9-bio-chapter-2",
    chapterName: "অধ্যায় ২: জীবকোষ ও টিস্যু",
    unitNumber: 2,
    topicId: "chapter-2",
    questionText: "কোষের শক্তিঘর কোনটি?",
    options: [
      { letter: "A", text: "গলগি বস্তু" },
      { letter: "B", text: "রাইবোসোম" },
      { letter: "C", text: "নিউক্লিয়াস" },
      { letter: "D", text: "মাইটোকন্ড্রিয়া" }
    ],
    correctLetter: "D",
    explanation: "মাইটোকন্ড্রিয়ায় শ্বসন প্রক্রিয়ায় ATP তৈরি হয় বলে একে কোষের শক্তিঘর বলে।",
    difficulty: "medium",
    sourceNote: "NCTB জীববিজ্ঞান, নবম-দশম শ্রেণি — অধ্যায় ২: জীবকোষ ও টিস্যু",
  },
  {
    id: "ACAD-0089",
    classId: "class-9",
    subjectId: "biology",
    chapterId: "acad-class-9-bio-chapter-4",
    chapterName: "অধ্যায় ৪: জীবনীশক্তি",
    unitNumber: 4,
    topicId: "chapter-4",
    questionText: "সালোকসংশ্লেষণের জন্য অপরিহার্য রঞ্জক কোনটি?",
    options: [
      { letter: "A", text: "ক্লোরোফিল" },
      { letter: "B", text: "ক্যারোটিন" },
      { letter: "C", text: "জ্যান্থোফিল" },
      { letter: "D", text: "অ্যান্থোসায়ানিন" }
    ],
    correctLetter: "A",
    explanation: "ক্লোরোফিল সূর্যের আলো শোষণ করে সালোকসংশ্লেষণ ঘটায়।",
    difficulty: "medium",
    sourceNote: "NCTB জীববিজ্ঞান, নবম-দশম শ্রেণি — অধ্যায় ৪: জীবনীশক্তি (সালোকসংশ্লেষণ)",
  },
  {
    id: "ACAD-0090",
    classId: "class-9",
    subjectId: "biology",
    chapterId: "acad-class-9-bio-chapter-4",
    chapterName: "অধ্যায় ৪: জীবনীশক্তি",
    unitNumber: 4,
    topicId: "chapter-4",
    questionText: "মানবদেহে গ্যাসীয় বিনিময় কোথায় ঘটে?",
    options: [
      { letter: "A", text: "যকৃতে" },
      { letter: "B", text: "বৃক্কে" },
      { letter: "C", text: "হৃৎপিণ্ডে" },
      { letter: "D", text: "ফুসফুসের অ্যালভিওলাসে" }
    ],
    correctLetter: "D",
    explanation: "ফুসফুসের অ্যালভিওলাসে (বায়ুথলিতে) অক্সিজেন ও কার্বন ডাইঅক্সাইডের বিনিময় ঘটে।",
    difficulty: "medium",
    sourceNote: "NCTB জীববিজ্ঞান, নবম-দশম শ্রেণি — অধ্যায় ৪: জীবনীশক্তি (শ্বসন/গ্যাসীয় বিনিময়)",
  },
  {
    id: "ACAD-0091",
    classId: "class-9",
    subjectId: "biology",
    chapterId: "acad-class-9-bio-chapter-6",
    chapterName: "অধ্যায় ৬: জীবে পরিবহন",
    unitNumber: 6,
    topicId: "chapter-6",
    questionText: "মানবদেহে রক্ত সংবহনের কেন্দ্র কোনটি?",
    options: [
      { letter: "A", text: "হৃৎপিণ্ড" },
      { letter: "B", text: "যকৃৎ" },
      { letter: "C", text: "প্লীহা" },
      { letter: "D", text: "ফুসফুস" }
    ],
    correctLetter: "A",
    explanation: "হৃৎপিণ্ড পাম্প করে সারা দেহে রক্ত পাঠায়।",
    difficulty: "easy",
    sourceNote: "NCTB জীববিজ্ঞান, নবম-দশম শ্রেণি — অধ্যায় ৬: জীবে পরিবহন",
  },
  {
    id: "ACAD-0092",
    classId: "class-9",
    subjectId: "biology",
    chapterId: "acad-class-9-bio-chapter-7",
    chapterName: "অধ্যায় ৭: রেচন প্রক্রিয়া",
    unitNumber: 7,
    topicId: "chapter-7",
    questionText: "মানবদেহের প্রধান রেচন অঙ্গ কোনটি?",
    options: [
      { letter: "A", text: "ত্বক" },
      { letter: "B", text: "যকৃৎ" },
      { letter: "C", text: "বৃক্ক" },
      { letter: "D", text: "ফুসফুস" }
    ],
    correctLetter: "C",
    explanation: "বৃক্ক রক্ত ছেঁকে ইউরিয়া ও অতিরিক্ত পানি মূত্র হিসেবে বের করে দেয়।",
    difficulty: "medium",
    sourceNote: "NCTB জীববিজ্ঞান, নবম-দশম শ্রেণি — অধ্যায় ৭: রেচন প্রক্রিয়া",
  },
  {
    id: "ACAD-0093",
    classId: "class-9",
    subjectId: "biology",
    chapterId: "acad-class-9-bio-chapter-8",
    chapterName: "অধ্যায় ৮: সমন্বয় ও নিয়ন্ত্রণ",
    unitNumber: 8,
    topicId: "chapter-8",
    questionText: "মানবদেহের প্রধান সমন্বয়কারী অঙ্গ কোনটি?",
    options: [
      { letter: "A", text: "হৃৎপিণ্ড" },
      { letter: "B", text: "অগ্ন্যাশয়" },
      { letter: "C", text: "মস্তিষ্ক" },
      { letter: "D", text: "যকৃৎ" }
    ],
    correctLetter: "C",
    explanation: "মস্তিষ্ক স্নায়ুতন্ত্রের কেন্দ্র হিসেবে দেহের কাজ সমন্বয় করে।",
    difficulty: "easy",
    sourceNote: "NCTB জীববিজ্ঞান, নবম-দশম শ্রেণি — অধ্যায় ৮: সমন্বয় ও নিয়ন্ত্রণ",
  },
  {
    id: "ACAD-0094",
    classId: "class-9",
    subjectId: "biology",
    chapterId: "acad-class-9-bio-chapter-9",
    chapterName: "অধ্যায় ৯: জীবে প্রজনন",
    unitNumber: 9,
    topicId: "chapter-9",
    questionText: "উদ্ভিদে পরাগায়ণের পর নিষেক কোথায় ঘটে?",
    options: [
      { letter: "A", text: "বৃতিতে" },
      { letter: "B", text: "পুষ্পাক্ষে" },
      { letter: "C", text: "পরাগধানীতে" },
      { letter: "D", text: "ডিম্বকে" }
    ],
    correctLetter: "D",
    explanation: "পরাগরেণু গর্ভমুণ্ডে পড়ে পরাগনালি দিয়ে ডিম্বকে পৌঁছে নিষেক ঘটায়।",
    difficulty: "medium",
    sourceNote: "NCTB জীববিজ্ঞান, নবম-দশম শ্রেণি — অধ্যায় ৯: জীবে প্রজনন",
  },
  {
    id: "ACAD-0095",
    classId: "class-9",
    subjectId: "biology",
    chapterId: "acad-class-9-bio-chapter-11",
    chapterName: "অধ্যায় ১১: জীবের বংশগতি ও বিবর্তন",
    unitNumber: 11,
    topicId: "chapter-11",
    questionText: "মেন্ডেল তাঁর পরীক্ষায় কোন উদ্ভিদ ব্যবহার করেন?",
    options: [
      { letter: "A", text: "আম গাছ" },
      { letter: "B", text: "ধান গাছ" },
      { letter: "C", text: "মটর গাছ" },
      { letter: "D", text: "গোলাপ গাছ" }
    ],
    correctLetter: "C",
    explanation: "মেন্ডেল তাঁর বংশগতি পরীক্ষায় মটর গাছ ব্যবহার করেন।",
    difficulty: "medium",
    sourceNote: "NCTB জীববিজ্ঞান, নবম-দশম শ্রেণি — অধ্যায় ১১: জীবের বংশগতি ও বিবর্তন",
  },
  {
    id: "ACAD-0096",
    classId: "class-9",
    subjectId: "biology",
    chapterId: "acad-class-9-bio-chapter-12",
    chapterName: "অধ্যায় ১২: জীবের পরিবেশ",
    unitNumber: 12,
    topicId: "chapter-12",
    questionText: "খাদ্য শৃঙ্খলে বিয়োজক কারা?",
    options: [
      { letter: "A", text: "সবুজ উদ্ভিদ" },
      { letter: "B", text: "ছত্রাক ও ব্যাকটেরিয়া" },
      { letter: "C", text: "মাংসাশী প্রাণী" },
      { letter: "D", text: "তৃণভোজী প্রাণী" }
    ],
    correctLetter: "B",
    explanation: "ছত্রাক ও ব্যাকটেরিয়া মৃত জীবদেহ পচিয়ে বিয়োজক হিসেবে কাজ করে।",
    difficulty: "easy",
    sourceNote: "NCTB জীববিজ্ঞান, নবম-দশম শ্রেণি — অধ্যায় ১২: জীবের পরিবেশ",
  },
  {
    id: "ACAD-0097",
    classId: "class-9",
    subjectId: "biology",
    chapterId: "acad-class-9-bio-chapter-13",
    chapterName: "অধ্যায় ১৩: জীবপ্রযুক্তি",
    unitNumber: 13,
    topicId: "chapter-13",
    questionText: "ইনসুলিন তৈরিতে কোন প্রযুক্তি ব্যবহৃত হয়?",
    options: [
      { letter: "A", text: "হাইব্রিডাইজেশন" },
      { letter: "B", text: "রিকম্বিন্যান্ট DNA প্রযুক্তি" },
      { letter: "C", text: "টিস্যু কালচার" },
      { letter: "D", text: "ক্লোনিং" }
    ],
    correctLetter: "B",
    explanation: "ব্যাকটেরিয়ায় মানব ইনসুলিন জিন ঢুকিয়ে রিকম্বিন্যান্ট DNA প্রযুক্তিতে ইনসুলিন তৈরি হয়।",
    difficulty: "medium",
    sourceNote: "NCTB জীববিজ্ঞান, নবম-দশম শ্রেণি — অধ্যায় ১৩: জীবপ্রযুক্তি",
  },
  {
    id: "ACAD-0098",
    classId: "class-9",
    subjectId: "biology",
    chapterId: "acad-class-9-bio-chapter-2",
    chapterName: "অধ্যায় ২: জীবকোষ ও টিস্যু",
    unitNumber: 2,
    topicId: "chapter-2",
    questionText: "উদ্ভিদের বৃদ্ধিতে সাহায্যকারী টিস্যু কোনটি?",
    options: [
      { letter: "A", text: "প্যারেনকাইমা" },
      { letter: "B", text: "ভাজক টিস্যু" },
      { letter: "C", text: "কোলেনকাইমা" },
      { letter: "D", text: "স্ক্লেরেনকাইমা" }
    ],
    correctLetter: "B",
    explanation: "ভাজক টিস্যুর কোষ বিভাজিত হয়ে উদ্ভিদের দৈর্ঘ্য ও প্রস্থে বৃদ্ধি ঘটায়।",
    difficulty: "easy",
    sourceNote: "NCTB জীববিজ্ঞান, নবম-দশম শ্রেণি — অধ্যায় ২: জীবকোষ ও টিস্যু",
  },
  {
    id: "ACAD-5097",
    classId: "class-9",
    subjectId: "biology",
    chapterId: "acad-class-9-bio-chapter-2",
    chapterName: "অধ্যায় ২: জীবকোষ ও টিস্যু",
    unitNumber: 2,
    topicId: "chapter-2",
    questionText: "প্রাণীকোষে নেই কোনটি?",
    options: [
      { letter: "A", text: "কোষঝিল্লি" },
      { letter: "B", text: "কোষপ্রাচীর" },
      { letter: "C", text: "মাইটোকন্ড্রিয়া" },
      { letter: "D", text: "নিউক্লিয়াস" }
    ],
    correctLetter: "B",
    explanation: "কোষপ্রাচীর উদ্ভিদকোষে থাকে; প্রাণীকোষে থাকে না।",
    difficulty: "medium",
    sourceNote: "NCTB জীববিজ্ঞান — অধ্যায় ২: জীবকোষ ও টিস্যু",
  },
  {
    id: "ACAD-5098",
    classId: "class-9",
    subjectId: "biology",
    chapterId: "acad-class-9-bio-chapter-4",
    chapterName: "অধ্যায় ৪: জীবনীশক্তি",
    unitNumber: 4,
    topicId: "chapter-4",
    questionText: "সালোকসংশ্লেষণে কোন গ্যাস নির্গত হয়?",
    options: [
      { letter: "A", text: "হাইড্রোজেন" },
      { letter: "B", text: "অক্সিজেন" },
      { letter: "C", text: "কার্বন ডাই-অক্সাইড" },
      { letter: "D", text: "নাইট্রোজেন" }
    ],
    correctLetter: "B",
    explanation: "সালোকসংশ্লেষণের সময় অক্সিজেন গ্যাস নির্গত হয়।",
    difficulty: "medium",
    sourceNote: "NCTB জীববিজ্ঞান — অধ্যায় ৪: জীবনীশক্তি",
  },
  {
    id: "ACAD-5099",
    classId: "class-9",
    subjectId: "biology",
    chapterId: "acad-class-9-bio-chapter-5",
    chapterName: "অধ্যায় ৫: খাদ্য, পুষ্টি ও পরিপাক",
    unitNumber: 5,
    topicId: "chapter-5",
    questionText: "মানুষের পাকস্থলীতে কোন অ্যাসিড থাকে?",
    options: [
      { letter: "A", text: "CH₃COOH" },
      { letter: "B", text: "H₂SO₄" },
      { letter: "C", text: "HCl" },
      { letter: "D", text: "HNO₃" }
    ],
    correctLetter: "C",
    explanation: "পাকস্থলীর HCl খাদ্য হজমে ও জীবাণু মারতে সাহায্য করে।",
    difficulty: "medium",
    sourceNote: "NCTB জীববিজ্ঞান — অধ্যায় ৫: খাদ্য, পুষ্টি ও পরিপাক",
  },
  {
    id: "ACAD-5100",
    classId: "class-9",
    subjectId: "biology",
    chapterId: "acad-class-9-bio-chapter-6",
    chapterName: "অধ্যায় ৬: জীবে পরিবহন",
    unitNumber: 6,
    topicId: "chapter-6",
    questionText: "রক্তের লোহিত কণিকার কাজ কী?",
    options: [
      { letter: "A", text: "অক্সিজেন পরিবহন" },
      { letter: "B", text: "হরমোন বহন" },
      { letter: "C", text: "রক্ত জমাট বাঁধানো" },
      { letter: "D", text: "রোগ প্রতিরোধ" }
    ],
    correctLetter: "A",
    explanation: "লোহিত কণিকার হিমোগ্লোবিন অক্সিজেন বহন করে।",
    difficulty: "medium",
    sourceNote: "NCTB জীববিজ্ঞান — অধ্যায় ৬: জীবে পরিবহন",
  },
  {
    id: "ACAD-5101",
    classId: "class-9",
    subjectId: "biology",
    chapterId: "acad-class-9-bio-chapter-6",
    chapterName: "অধ্যায় ৬: জীবে পরিবহন",
    unitNumber: 6,
    topicId: "chapter-6",
    questionText: "সার্বজনীন দাতা কোন গ্রুপ?",
    options: [
      { letter: "A", text: "A" },
      { letter: "B", text: "B" },
      { letter: "C", text: "AB" },
      { letter: "D", text: "O" }
    ],
    correctLetter: "D",
    explanation: "O গ্রুপের রক্ত সবাইকে দেওয়া যায়; AB সার্বজনীন গ্রহীতা।",
    difficulty: "easy",
    sourceNote: "NCTB জীববিজ্ঞান — অধ্যায় ৬: জীবে পরিবহন",
  },
  {
    id: "ACAD-5102",
    classId: "class-9",
    subjectId: "biology",
    chapterId: "acad-class-9-bio-chapter-4",
    chapterName: "অধ্যায় ৪: জীবনীশক্তি",
    unitNumber: 4,
    topicId: "chapter-4",
    questionText: "অবাত শ্বসনে কী উৎপন্ন হয়?",
    options: [
      { letter: "A", text: "বেশি শক্তি" },
      { letter: "B", text: "শুধু CO₂" },
      { letter: "C", text: "অল্প শক্তি ও ল্যাকটিক অ্যাসিড/অ্যালকোহল" },
      { letter: "D", text: "শুধু পানি" }
    ],
    correctLetter: "C",
    explanation: "অবাত শ্বসনে অক্সিজেন ছাড়া অল্প ATP ও ল্যাকটিক অ্যাসিড বা অ্যালকোহল তৈরি হয়।",
    difficulty: "medium",
    sourceNote: "NCTB জীববিজ্ঞান — অধ্যায় ৪: জীবনীশক্তি",
  },
  {
    id: "ACAD-5103",
    classId: "class-9",
    subjectId: "biology",
    chapterId: "acad-class-9-bio-chapter-8",
    chapterName: "অধ্যায় ৮: সমন্বয় ও নিয়ন্ত্রণ",
    unitNumber: 8,
    topicId: "chapter-8",
    questionText: "মানুষের মস্তিষ্কের সবচেয়ে বড় অংশ কোনটি?",
    options: [
      { letter: "A", text: "মধ্যমস্তিষ্ক" },
      { letter: "B", text: "গুরুমস্তিষ্ক" },
      { letter: "C", text: "লঘুমস্তিষ্ক" },
      { letter: "D", text: "সুষুম্না" }
    ],
    correctLetter: "B",
    explanation: "গুরুমস্তিষ্ক (সেরিব্রাম) চিন্তা, স্মৃতি ও সচেতন কাজ নিয়ন্ত্রণ করে।",
    difficulty: "medium",
    sourceNote: "NCTB জীববিজ্ঞান — অধ্যায় ৮: সমন্বয় ও নিয়ন্ত্রণ",
  },
  {
    id: "ACAD-5104",
    classId: "class-9",
    subjectId: "biology",
    chapterId: "acad-class-9-bio-chapter-8",
    chapterName: "অধ্যায় ৮: সমন্বয় ও নিয়ন্ত্রণ",
    unitNumber: 8,
    topicId: "chapter-8",
    questionText: "থাইরয়েড গ্রন্থি থেকে কোন হরমোন নিঃসৃত হয়?",
    options: [
      { letter: "A", text: "থাইরক্সিন" },
      { letter: "B", text: "টেস্টোস্টেরন" },
      { letter: "C", text: "ইনসুলিন" },
      { letter: "D", text: "অ্যাড্রেনালিন" }
    ],
    correctLetter: "A",
    explanation: "থাইরয়েড গ্রন্থি থেকে থাইরক্সিন নিঃসৃত হয়; এটি দেহের বিপাক নিয়ন্ত্রণ করে।",
    difficulty: "medium",
    sourceNote: "NCTB জীববিজ্ঞান — অধ্যায় ৮: সমন্বয় ও নিয়ন্ত্রণ",
  },
  {
    id: "ACAD-5106",
    classId: "class-9",
    subjectId: "biology",
    chapterId: "acad-class-9-bio-chapter-11",
    chapterName: "অধ্যায় ১১: জীবের বংশগতি ও বিবর্তন",
    unitNumber: 11,
    topicId: "chapter-11",
    questionText: "প্রাকৃতিক নির্বাচন তত্ত্বের প্রবক্তা কে?",
    options: [
      { letter: "A", text: "মেন্ডেল" },
      { letter: "B", text: "লিনিয়াস" },
      { letter: "C", text: "চার্লস ডারউইন" },
      { letter: "D", text: "ল্যামার্ক" }
    ],
    correctLetter: "C",
    explanation: "ডারউইনের প্রাকৃতিক নির্বাচনে যোগ্যতম জীব বেঁচে থেকে বংশবৃদ্ধি করে।",
    difficulty: "medium",
    sourceNote: "NCTB জীববিজ্ঞান — অধ্যায় ১১: জীবের বংশগতি ও বিবর্তন",
  },
  {
    id: "ACAD-5107",
    classId: "class-9",
    subjectId: "biology",
    chapterId: "acad-class-9-bio-chapter-12",
    chapterName: "অধ্যায় ১২: জীবের পরিবেশ",
    unitNumber: 12,
    topicId: "chapter-12",
    questionText: "খাদ্যশৃঙ্খলের প্রথম ধাপে কারা থাকে?",
    options: [
      { letter: "A", text: "মাংসাশী" },
      { letter: "B", text: "তৃণভোজী" },
      { letter: "C", text: "বিয়োজক" },
      { letter: "D", text: "উৎপাদক" }
    ],
    correctLetter: "D",
    explanation: "উৎপাদক (সবুজ উদ্ভিদ) খাদ্যশৃঙ্খলের ভিত্তি।",
    difficulty: "easy",
    sourceNote: "NCTB জীববিজ্ঞান — অধ্যায় ১২: জীবের পরিবেশ",
  },
];
