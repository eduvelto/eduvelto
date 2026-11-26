// Eduvelto — Academic Biology (Depth) practice questions (Class 9),
// verified against the Dakhil NCTB books (review 26 Nov 2026).
//
// Static data ONLY — zero Firestore reads. The 32 questions are the
// Academic Class 9 Biology (Depth) drafts AFTER review (see
// review-academic-c9-biology-depth-verdicts.json and
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
// to PUBLIC_ACADEMIC_BIOLOGY_DEPTH_QUESTIONS below (same shape, same generation
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

/** All verified Academic Biology (Depth) questions, Class 9 (in draft order). */
export const PUBLIC_ACADEMIC_BIOLOGY_DEPTH_QUESTIONS: PublicAcademicQuestion[] = [
  {
    id: "C910B-001",
    classId: "class-9",
    subjectId: "biology-depth",
    chapterId: "acad-class-9-bio-depth-chapter-1",
    chapterName: "অধ্যায় ১: জীবন পাঠ",
    unitNumber: 1,
    topicId: "chapter-1",
    questionText: "উদ্ভিদবিজ্ঞানের জনক কাকে বলা হয়?",
    options: [
      { letter: "A", text: "লিনিয়াস" },
      { letter: "B", text: "থিওফ্রাস্টাস" },
      { letter: "C", text: "মেন্ডেল" },
      { letter: "D", text: "অ্যারিস্টটল" }
    ],
    correctLetter: "B",
    explanation: "গ্রিক দার্শনিক থিওফ্রাস্টাসকে উদ্ভিদবিজ্ঞানের জনক বলা হয়।",
    difficulty: "easy",
    sourceNote: "NCTB জীববিজ্ঞান, ৯ম-১০ম শ্রেণি (2026 সংস্করণ) — অধ্যায় ১: জীবন পাঠ",
  },
  {
    id: "C910B-002",
    classId: "class-9",
    subjectId: "biology-depth",
    chapterId: "acad-class-9-bio-depth-chapter-1",
    chapterName: "অধ্যায় ১: জীবন পাঠ",
    unitNumber: 1,
    topicId: "chapter-1",
    questionText: "জীবের শ্রেণিবিন্যাসের জনক কে?",
    options: [
      { letter: "A", text: "মেন্ডেল" },
      { letter: "B", text: "ক্যারোলাস লিনিয়াস" },
      { letter: "C", text: "ডারউইন" },
      { letter: "D", text: "ল্যামার্ক" }
    ],
    correctLetter: "B",
    explanation: "লিনিয়াস দ্বিপদ নামকরণ পদ্ধতি প্রবর্তন করেন।",
    difficulty: "medium",
    sourceNote: "NCTB জীববিজ্ঞান, ৯ম-১০ম শ্রেণি (2026 সংস্করণ) — অধ্যায় ১: জীবন পাঠ",
  },
  {
    id: "C910B-003",
    classId: "class-9",
    subjectId: "biology-depth",
    chapterId: "acad-class-9-bio-depth-chapter-1",
    chapterName: "অধ্যায় ১: জীবন পাঠ",
    unitNumber: 1,
    topicId: "chapter-1",
    questionText: "মানুষের বৈজ্ঞানিক নাম কী?",
    options: [
      { letter: "A", text: "Homo sapiens" },
      { letter: "B", text: "Panthera tigris" },
      { letter: "C", text: "Oryza sativa" },
      { letter: "D", text: "Mangifera indica" }
    ],
    correctLetter: "A",
    explanation: "দ্বিপদ নামকরণে মানুষের বৈজ্ঞানিক নাম Homo sapiens।",
    difficulty: "medium",
    sourceNote: "NCTB জীববিজ্ঞান, ৯ম-১০ম শ্রেণি (2026 সংস্করণ) — অধ্যায় ১: জীবন পাঠ",
  },
  {
    id: "C910B-004",
    classId: "class-9",
    subjectId: "biology-depth",
    chapterId: "acad-class-9-bio-depth-chapter-2",
    chapterName: "অধ্যায় ২: জীবের কোষ ও কলা",
    unitNumber: 2,
    topicId: "chapter-2",
    questionText: "কোষ আবিষ্কার করেন কে?",
    options: [
      { letter: "A", text: "রবার্ট হুক" },
      { letter: "B", text: "শ্লাইডেন" },
      { letter: "C", text: "শোয়ান" },
      { letter: "D", text: "লিউয়েনহুক" }
    ],
    correctLetter: "A",
    explanation: "১৬৬৫ সালে রবার্ট হুক কর্কের টুকরোয় কোষ দেখেন।",
    difficulty: "easy",
    sourceNote: "NCTB জীববিজ্ঞান, ৯ম-১০ম শ্রেণি (2026 সংস্করণ) — অধ্যায় ২: জীবের কোষ ও কলা",
  },
  {
    id: "C910B-005",
    classId: "class-9",
    subjectId: "biology-depth",
    chapterId: "acad-class-9-bio-depth-chapter-2",
    chapterName: "অধ্যায় ২: জীবের কোষ ও কলা",
    unitNumber: 2,
    topicId: "chapter-2",
    questionText: "উদ্ভিদের কোন কলা খাদ্য পরিবহন করে?",
    options: [
      { letter: "A", text: "ফ্লোয়েম" },
      { letter: "B", text: "জাইলেম" },
      { letter: "C", text: "কোলেনকাইমা" },
      { letter: "D", text: "প্যারেনকাইমা" }
    ],
    correctLetter: "A",
    explanation: "ফ্লোয়েম খাদ্য পরিবহন করে; জাইলেম পানি ও খনিজ লবণ পরিবহন করে।",
    difficulty: "medium",
    sourceNote: "NCTB জীববিজ্ঞান, ৯ম-১০ম শ্রেণি (2026 সংস্করণ) — অধ্যায় ২: জীবের কোষ ও কলা",
  },
  {
    id: "C910B-006",
    classId: "class-9",
    subjectId: "biology-depth",
    chapterId: "acad-class-9-bio-depth-chapter-2",
    chapterName: "অধ্যায় ২: জীবের কোষ ও কলা",
    unitNumber: 2,
    topicId: "chapter-2",
    questionText: "প্রাণীর রক্ত কোন ধরনের কলা?",
    options: [
      { letter: "A", text: "আবরণী কলা" },
      { letter: "B", text: "পেশি কলা" },
      { letter: "C", text: "স্নায়ু কলা" },
      { letter: "D", text: "যোজক কলা" }
    ],
    correctLetter: "D",
    explanation: "রক্ত তরল যোজক কলা; এটি সারা দেহে পদার্থ পরিবহন করে।",
    difficulty: "medium",
    sourceNote: "NCTB জীববিজ্ঞান, ৯ম-১০ম শ্রেণি (2026 সংস্করণ) — অধ্যায় ২: জীবের কোষ ও কলা",
  },
  {
    id: "C910B-007",
    classId: "class-9",
    subjectId: "biology-depth",
    chapterId: "acad-class-9-bio-depth-chapter-3",
    chapterName: "অধ্যায় ৩: কোষ বিভাজন",
    unitNumber: 3,
    topicId: "chapter-3",
    questionText: "মিয়োসিস বিভাজন কোথায় ঘটে?",
    options: [
      { letter: "A", text: "দেহকোষে" },
      { letter: "B", text: "পাতায়" },
      { letter: "C", text: "জনন মাতৃকোষে" },
      { letter: "D", text: "মূলের অগ্রভাগে" }
    ],
    correctLetter: "C",
    explanation: "মিয়োসিস জনন মাতৃকোষে ঘটে; এতে ক্রোমোজোম সংখ্যা অর্ধেক হয়।",
    difficulty: "easy",
    sourceNote: "NCTB জীববিজ্ঞান, ৯ম-১০ম শ্রেণি (2026 সংস্করণ) — অধ্যায় ৩: কোষ বিভাজন",
  },
  {
    id: "C910B-008",
    classId: "class-9",
    subjectId: "biology-depth",
    chapterId: "acad-class-9-bio-depth-chapter-3",
    chapterName: "অধ্যায় ৩: কোষ বিভাজন",
    unitNumber: 3,
    topicId: "chapter-3",
    questionText: "মাইটোসিস বিভাজনের ফলে কয়টি অপত্য কোষ তৈরি হয়?",
    options: [
      { letter: "A", text: "৪টি" },
      { letter: "B", text: "৮টি" },
      { letter: "C", text: "২টি" },
      { letter: "D", text: "১টি" }
    ],
    correctLetter: "C",
    explanation: "মাইটোসিসে একটি কোষ থেকে ক্রোমোজোম সংখ্যা সমান দুটি অপত্য কোষ তৈরি হয়।",
    difficulty: "medium",
    sourceNote: "NCTB জীববিজ্ঞান, ৯ম-১০ম শ্রেণি (2026 সংস্করণ) — অধ্যায় ৩: কোষ বিভাজন",
  },
  {
    id: "C910B-009",
    classId: "class-9",
    subjectId: "biology-depth",
    chapterId: "acad-class-9-bio-depth-chapter-3",
    chapterName: "অধ্যায় ৩: কোষ বিভাজন",
    unitNumber: 3,
    topicId: "chapter-3",
    questionText: "কোষ চক্রের কোন ধাপে DNA প্রতিলিপি তৈরি হয়?",
    options: [
      { letter: "A", text: "G1 ধাপে" },
      { letter: "B", text: "S ধাপে" },
      { letter: "C", text: "M ধাপে" },
      { letter: "D", text: "G2 ধাপে" }
    ],
    correctLetter: "B",
    explanation: "ইন্টারফেজের S (সংশ্লেষণ) ধাপে DNA-এর প্রতিলিপি তৈরি হয়।",
    difficulty: "medium",
    sourceNote: "NCTB জীববিজ্ঞান, ৯ম-১০ম শ্রেণি (2026 সংস্করণ) — অধ্যায় ৩: কোষ বিভাজন",
  },
  {
    id: "C910B-010",
    classId: "class-9",
    subjectId: "biology-depth",
    chapterId: "acad-class-9-bio-depth-chapter-4",
    chapterName: "অধ্যায় ৪: জীবনীশক্তি",
    unitNumber: 4,
    topicId: "chapter-4",
    questionText: "সালোকসংশ্লেষণ কোথায় ঘটে?",
    options: [
      { letter: "A", text: "নিউক্লিয়াসে" },
      { letter: "B", text: "রাইবোজোমে" },
      { letter: "C", text: "ক্লোরোপ্লাস্টে" },
      { letter: "D", text: "মাইটোকন্ড্রিয়ায়" }
    ],
    correctLetter: "C",
    explanation: "ক্লোরোপ্লাস্টের ক্লোরোফিল সূর্যের আলো ধরে সালোকসংশ্লেষণ ঘটায়।",
    difficulty: "easy",
    sourceNote: "NCTB জীববিজ্ঞান, ৯ম-১০ম শ্রেণি (2026 সংস্করণ) — অধ্যায় ৪: জীবনীশক্তি",
  },
  {
    id: "C910B-011",
    classId: "class-9",
    subjectId: "biology-depth",
    chapterId: "acad-class-9-bio-depth-chapter-4",
    chapterName: "অধ্যায় ৪: জীবনীশক্তি",
    unitNumber: 4,
    topicId: "chapter-4",
    questionText: "শ্বসনের মোট বিক্রিয়াটি কোনটি?",
    options: [
      { letter: "A", text: "C₆H₁₂O₆ + ৬O₂ → ৬CO₂ + ৬H₂O + শক্তি" },
      { letter: "B", text: "C₆H₁₂O₆ → ২C₂H₅OH + ২CO₂" },
      { letter: "C", text: "৬CO₂ + ৬H₂O → C₆H₁₂O₆ + ৬O₂" },
      { letter: "D", text: "৬CO₂ + ১২H₂O → C₆H₁₂O₆ + ৬H₂O + ৬O₂" }
    ],
    correctLetter: "A",
    explanation: "শ্বসনে গ্লুকোজ অক্সিজেনে জারিত হয়ে কার্বন ডাই-অক্সাইড, পানি ও শক্তি দেয়।",
    difficulty: "medium",
    sourceNote: "NCTB জীববিজ্ঞান, ৯ম-১০ম শ্রেণি (2026 সংস্করণ) — অধ্যায় ৪: জীবনীশক্তি",
  },
  {
    id: "C910B-012",
    classId: "class-9",
    subjectId: "biology-depth",
    chapterId: "acad-class-9-bio-depth-chapter-4",
    chapterName: "অধ্যায় ৪: জীবনীশক্তি",
    unitNumber: 4,
    topicId: "chapter-4",
    questionText: "ATP-কে কী বলা হয়?",
    options: [
      { letter: "A", text: "শক্তির ঘর" },
      { letter: "B", text: "শক্তির মুদ্রা (energy currency)" },
      { letter: "C", text: "শক্তির উৎস" },
      { letter: "D", text: "শক্তির ভাণ্ডার" }
    ],
    correctLetter: "B",
    explanation: "ATP কোষের শক্তি সংরক্ষণ ও সরবরাহ করে বলে একে শক্তির মুদ্রা বলে।",
    difficulty: "medium",
    sourceNote: "NCTB জীববিজ্ঞান, ৯ম-১০ম শ্রেণি (2026 সংস্করণ) — অধ্যায় ৪: জীবনীশক্তি",
  },
  {
    id: "C910B-013",
    classId: "class-9",
    subjectId: "biology-depth",
    chapterId: "acad-class-9-bio-depth-chapter-5",
    chapterName: "অধ্যায় ৫: খাদ্য, পুষ্টি ও পরিপাক",
    unitNumber: 5,
    topicId: "chapter-5",
    questionText: "আক্কেল দাঁতসহ প্রাপ্তবয়স্ক মানুষের স্থায়ী দাঁতের সংখ্যা কত?",
    options: [
      { letter: "A", text: "২৮টি" },
      { letter: "B", text: "৩০টি" },
      { letter: "C", text: "৩৬টি" },
      { letter: "D", text: "৩২টি" }
    ],
    correctLetter: "D",
    explanation: "প্রাপ্তবয়স্ক মানুষের স্থায়ী দাঁত ২৮–৩২টি; আক্কেল দাঁতসহ পূর্ণ সেট ৩২টি (উপরে ও নিচের চোয়ালে ১৪–১৬টি করে)।",
    difficulty: "easy",
    sourceNote: "NCTB জীববিজ্ঞান, ৯ম-১০ম শ্রেণি (2026 সংস্করণ) — অধ্যায় ৫: খাদ্য, পুষ্টি ও পরিপাক",
  },
  {
    id: "C910B-015",
    classId: "class-9",
    subjectId: "biology-depth",
    chapterId: "acad-class-9-bio-depth-chapter-5",
    chapterName: "অধ্যায় ৫: খাদ্য, পুষ্টি ও পরিপাক",
    unitNumber: 5,
    topicId: "chapter-5",
    questionText: "শর্করার পরিপাক শেষে কী তৈরি হয়?",
    options: [
      { letter: "A", text: "গ্লিসারল" },
      { letter: "B", text: "অ্যামাইনো অ্যাসিড" },
      { letter: "C", text: "গ্লুকোজ" },
      { letter: "D", text: "ফ্যাটি অ্যাসিড" }
    ],
    correctLetter: "C",
    explanation: "শর্করা পরিপাক হয়ে গ্লুকোজে পরিণত হয়, যা রক্তে শোষিত হয়।",
    difficulty: "medium",
    sourceNote: "NCTB জীববিজ্ঞান, ৯ম-১০ম শ্রেণি (2026 সংস্করণ) — অধ্যায় ৫: খাদ্য, পুষ্টি ও পরিপাক",
  },
  {
    id: "C910B-016",
    classId: "class-9",
    subjectId: "biology-depth",
    chapterId: "acad-class-9-bio-depth-chapter-6",
    chapterName: "অধ্যায় ৬: জীবে পরিবহন",
    unitNumber: 6,
    topicId: "chapter-6",
    questionText: "উদ্ভিদে পানি পরিবহন করে কোন কলা?",
    options: [
      { letter: "A", text: "ক্যাম্বিয়াম" },
      { letter: "B", text: "জাইলেম" },
      { letter: "C", text: "এপিডার্মিস" },
      { letter: "D", text: "ফ্লোয়েম" }
    ],
    correctLetter: "B",
    explanation: "জাইলেম মূল থেকে পাতায় পানি ও খনিজ লবণ পরিবহন করে।",
    difficulty: "easy",
    sourceNote: "NCTB জীববিজ্ঞান, ৯ম-১০ম শ্রেণি (2026 সংস্করণ) — অধ্যায় ৬: জীবে পরিবহন",
  },
  {
    id: "C910B-017",
    classId: "class-9",
    subjectId: "biology-depth",
    chapterId: "acad-class-9-bio-depth-chapter-6",
    chapterName: "অধ্যায় ৬: জীবে পরিবহন",
    unitNumber: 6,
    topicId: "chapter-6",
    questionText: "মানুষের রক্তচাপ মাপার যন্ত্র কোনটি?",
    options: [
      { letter: "A", text: "থার্মোমিটার" },
      { letter: "B", text: "স্ফিগমোম্যানোমিটার" },
      { letter: "C", text: "স্টেথোস্কোপ" },
      { letter: "D", text: "ব্যারোমিটার" }
    ],
    correctLetter: "B",
    explanation: "স্ফিগমোম্যানোমিটার দিয়ে রক্তচাপ মাপা হয়; স্বাভাবিক ১২০/৮০ mmHg।",
    difficulty: "medium",
    sourceNote: "NCTB জীববিজ্ঞান, ৯ম-১০ম শ্রেণি (2026 সংস্করণ) — অধ্যায় ৬: জীবে পরিবহন",
  },
  {
    id: "C910B-019",
    classId: "class-9",
    subjectId: "biology-depth",
    chapterId: "acad-class-9-bio-depth-chapter-7",
    chapterName: "অধ্যায় ৭: গ্যাসীয় বিনিময়",
    unitNumber: 7,
    topicId: "chapter-7",
    questionText: "মানুষের গ্যাসীয় বিনিময় কোথায় ঘটে?",
    options: [
      { letter: "A", text: "ডায়াফ্রামে" },
      { letter: "B", text: "ফুসফুসের বায়ুথলি (অ্যালভিওলাস)" },
      { letter: "C", text: "শ্বাসনালিতে" },
      { letter: "D", text: "নাসারন্ধ্রে" }
    ],
    correctLetter: "B",
    explanation: "অ্যালভিওলাসে অক্সিজেন রক্তে যায় ও কার্বন ডাই-অক্সাইড বের হয়।",
    difficulty: "easy",
    sourceNote: "NCTB জীববিজ্ঞান, ৯ম-১০ম শ্রেণি (2026 সংস্করণ) — অধ্যায় ৭: গ্যাসীয় বিনিময়",
  },
  {
    id: "C910B-020",
    classId: "class-9",
    subjectId: "biology-depth",
    chapterId: "acad-class-9-bio-depth-chapter-7",
    chapterName: "অধ্যায় ৭: গ্যাসীয় বিনিময়",
    unitNumber: 7,
    topicId: "chapter-7",
    questionText: "উদ্ভিদের গ্যাসীয় বিনিময় হয় কোনটি দিয়ে?",
    options: [
      { letter: "A", text: "পত্ররন্ধ্র (স্টোমাটা)" },
      { letter: "B", text: "মূলরোম" },
      { letter: "C", text: "কাণ্ডের ছাল" },
      { letter: "D", text: "ফুল" }
    ],
    correctLetter: "A",
    explanation: "পত্ররন্ধ্র দিয়ে উদ্ভিদ অক্সিজেন ও কার্বন ডাই-অক্সাইড বিনিময় করে।",
    difficulty: "medium",
    sourceNote: "NCTB জীববিজ্ঞান, ৯ম-১০ম শ্রেণি (2026 সংস্করণ) — অধ্যায় ৭: গ্যাসীয় বিনিময়",
  },
  {
    id: "C910B-021",
    classId: "class-9",
    subjectId: "biology-depth",
    chapterId: "acad-class-9-bio-depth-chapter-7",
    chapterName: "অধ্যায় ৭: গ্যাসীয় বিনিময়",
    unitNumber: 7,
    topicId: "chapter-7",
    questionText: "শ্বাস-প্রশ্বাসে ডায়াফ্রাম সংকুচিত হলে কী ঘটে?",
    options: [
      { letter: "A", text: "কিছুই ঘটে না" },
      { letter: "B", text: "ফুসফুস সংকুচিত হয়" },
      { letter: "C", text: "বুকের খাঁচা প্রসারিত হয়ে বায়ু ভেতরে যায় (শ্বাস গ্রহণ)" },
      { letter: "D", text: "বায়ু বের হয়" }
    ],
    correctLetter: "C",
    explanation: "ডায়াফ্রাম সংকুচিত হলে বুকের আয়তন বাড়ে, চাপ কমে, বায়ু ভেতরে ঢোকে।",
    difficulty: "medium",
    sourceNote: "NCTB জীববিজ্ঞান, ৯ম-১০ম শ্রেণি (2026 সংস্করণ) — অধ্যায় ৭: গ্যাসীয় বিনিময়",
  },
  {
    id: "C910B-022",
    classId: "class-9",
    subjectId: "biology-depth",
    chapterId: "acad-class-9-bio-depth-chapter-8",
    chapterName: "অধ্যায় ৮: রেচন",
    unitNumber: 8,
    topicId: "chapter-8",
    questionText: "মানুষের রেচন অঙ্গ কোনটি?",
    options: [
      { letter: "A", text: "ফুসফুস" },
      { letter: "B", text: "হৃৎপিণ্ড" },
      { letter: "C", text: "যকৃৎ" },
      { letter: "D", text: "বৃক্ক (কিডনি)" }
    ],
    correctLetter: "D",
    explanation: "বৃক্ক রক্ত ছেঁকে ইউরিয়া ও অতিরিক্ত পানি মূত্র হিসেবে বের করে।",
    difficulty: "easy",
    sourceNote: "NCTB জীববিজ্ঞান, ৯ম-১০ম শ্রেণি (2026 সংস্করণ) — অধ্যায় ৮: রেচন",
  },
  {
    id: "C910B-023",
    classId: "class-9",
    subjectId: "biology-depth",
    chapterId: "acad-class-9-bio-depth-chapter-8",
    chapterName: "অধ্যায় ৮: রেচন",
    unitNumber: 8,
    topicId: "chapter-8",
    questionText: "বৃক্কের কার্যকরী একক কোনটি?",
    options: [
      { letter: "A", text: "ভিলাই" },
      { letter: "B", text: "অ্যালভিওলাস" },
      { letter: "C", text: "নেফ্রন" },
      { letter: "D", text: "নিউরন" }
    ],
    correctLetter: "C",
    explanation: "নেফ্রনে রক্ত ছাঁকা ও মূত্র তৈরি হয়।",
    difficulty: "medium",
    sourceNote: "NCTB জীববিজ্ঞান, ৯ম-১০ম শ্রেণি (2026 সংস্করণ) — অধ্যায় ৮: রেচন",
  },
  {
    id: "C910B-024",
    classId: "class-9",
    subjectId: "biology-depth",
    chapterId: "acad-class-9-bio-depth-chapter-10",
    chapterName: "অধ্যায় ১০: সমন্বয়",
    unitNumber: 10,
    topicId: "chapter-10",
    questionText: "স্নায়ুতন্ত্রের গাঠনিক ও কার্যিক একক কোনটি?",
    options: [
      { letter: "A", text: "কোষ" },
      { letter: "B", text: "নেফ্রন" },
      { letter: "C", text: "অ্যালভিওলাস" },
      { letter: "D", text: "নিউরন" }
    ],
    correctLetter: "D",
    explanation: "নিউরন উদ্দীপনা গ্রহণ ও প্রেরণ করে।",
    difficulty: "easy",
    sourceNote: "NCTB জীববিজ্ঞান, ৯ম-১০ম শ্রেণি (2026 সংস্করণ) — অধ্যায় ১০: সমন্বয়",
  },
  {
    id: "C910B-025",
    classId: "class-9",
    subjectId: "biology-depth",
    chapterId: "acad-class-9-bio-depth-chapter-10",
    chapterName: "অধ্যায় ১০: সমন্বয়",
    unitNumber: 10,
    topicId: "chapter-10",
    questionText: "মানুষের কেন্দ্রীয় স্নায়ুতন্ত্র গঠিত হয় কী দিয়ে?",
    options: [
      { letter: "A", text: "মস্তিষ্ক ও স্নায়ু" },
      { letter: "B", text: "শুধু মস্তিষ্ক" },
      { letter: "C", text: "সুষুম্নাকাণ্ড ও স্নায়ু" },
      { letter: "D", text: "মস্তিষ্ক ও সুষুম্নাকাণ্ড" }
    ],
    correctLetter: "D",
    explanation: "কেন্দ্রীয় স্নায়ুতন্ত্র = মস্তিষ্ক + সুষুম্নাকাণ্ড; প্রান্তীয় স্নায়ুতন্ত্র = স্নায়ুসমূহ।",
    difficulty: "medium",
    sourceNote: "NCTB জীববিজ্ঞান, ৯ম-১০ম শ্রেণি (2026 সংস্করণ) — অধ্যায় ১০: সমন্বয়",
  },
  {
    id: "C910B-026",
    classId: "class-9",
    subjectId: "biology-depth",
    chapterId: "acad-class-9-bio-depth-chapter-11",
    chapterName: "অধ্যায় ১১: জীবের প্রজনন",
    unitNumber: 11,
    topicId: "chapter-11",
    questionText: "ফুলের স্ত্রী প্রজনন অঙ্গ কোনটি?",
    options: [
      { letter: "A", text: "গর্ভকেশর" },
      { letter: "B", text: "পাপড়ি" },
      { letter: "C", text: "পুংকেশর" },
      { letter: "D", text: "বৃতি" }
    ],
    correctLetter: "A",
    explanation: "গর্ভকেশরের গর্ভাশয়ে ডিম্বক থাকে; পুংকেশর পুরুষ অঙ্গ।",
    difficulty: "easy",
    sourceNote: "NCTB জীববিজ্ঞান, ৯ম-১০ম শ্রেণি (2026 সংস্করণ) — অধ্যায় ১১: জীবের প্রজনন",
  },
  {
    id: "C910B-027",
    classId: "class-9",
    subjectId: "biology-depth",
    chapterId: "acad-class-9-bio-depth-chapter-11",
    chapterName: "অধ্যায় ১১: জীবের প্রজনন",
    unitNumber: 11,
    topicId: "chapter-11",
    questionText: "মানুষের নিষেক কোথায় ঘটে?",
    options: [
      { letter: "A", text: "যোনিতে" },
      { letter: "B", text: "জরায়ুতে" },
      { letter: "C", text: "ডিম্বাশয়ে" },
      { letter: "D", text: "ডিম্বনালিতে" }
    ],
    correctLetter: "D",
    explanation: "ডিম্বনালিতে শুক্রাণু ও ডিম্বাণুর মিলনে নিষেক ঘটে; ভ্রূণ জরায়ুতে বড় হয়।",
    difficulty: "medium",
    sourceNote: "NCTB জীববিজ্ঞান, ৯ম-১০ম শ্রেণি (2026 সংস্করণ) — অধ্যায় ১১: জীবের প্রজনন",
  },
  {
    id: "C910B-029",
    classId: "class-9",
    subjectId: "biology-depth",
    chapterId: "acad-class-9-bio-depth-chapter-12",
    chapterName: "অধ্যায় ১২: জীবের বংশগতি ও জৈব অভিব্যক্তি",
    unitNumber: 12,
    topicId: "chapter-12",
    questionText: "মানুষের দেহকোষে অটোজোম কত জোড়া?",
    options: [
      { letter: "A", text: "১ জোড়া" },
      { letter: "B", text: "৪৪ জোড়া" },
      { letter: "C", text: "২২ জোড়া" },
      { letter: "D", text: "২৩ জোড়া" }
    ],
    correctLetter: "C",
    explanation: "মানুষের ৪৬টি ক্রোমোজোমের মধ্যে ২২ জোড়া অটোজোম ও ১ জোড়া যৌন ক্রোমোজোম থাকে।",
    difficulty: "medium",
    sourceNote: "NCTB জীববিজ্ঞান, ৯ম-১০ম শ্রেণি (2026 সংস্করণ) — অধ্যায় ১২: জীবের বংশগতি ও জৈব অভিব্যক্তি",
  },
  {
    id: "C910B-030",
    classId: "class-9",
    subjectId: "biology-depth",
    chapterId: "acad-class-9-bio-depth-chapter-13",
    chapterName: "অধ্যায় ১৩: জীবের পরিবেশ",
    unitNumber: 13,
    topicId: "chapter-13",
    questionText: "বাস্তুতন্ত্রের জড় উপাদান কোনটি?",
    options: [
      { letter: "A", text: "ব্যাকটেরিয়া" },
      { letter: "B", text: "প্রাণী" },
      { letter: "C", text: "উদ্ভিদ" },
      { letter: "D", text: "পানি, বায়ু, মাটি" }
    ],
    correctLetter: "D",
    explanation: "পানি, বায়ু, মাটি, আলো, তাপমাত্রা জড় উপাদান; উদ্ভিদ-প্রাণী জীব উপাদান।",
    difficulty: "easy",
    sourceNote: "NCTB জীববিজ্ঞান, ৯ম-১০ম শ্রেণি (2026 সংস্করণ) — অধ্যায় ১৩: জীবের পরিবেশ",
  },
  {
    id: "C910B-031",
    classId: "class-9",
    subjectId: "biology-depth",
    chapterId: "acad-class-9-bio-depth-chapter-13",
    chapterName: "অধ্যায় ১৩: জীবের পরিবেশ",
    unitNumber: 13,
    topicId: "chapter-13",
    questionText: "খাদ্যজাল বলতে কী বোঝায়?",
    options: [
      { letter: "A", text: "পরস্পর যুক্ত একাধিক খাদ্যশৃঙ্খল" },
      { letter: "B", text: "একটিমাত্র খাদ্যশৃঙ্খল" },
      { letter: "C", text: "শুধু উদ্ভিদের খাদ্য" },
      { letter: "D", text: "শুধু প্রাণীর খাদ্য" }
    ],
    correctLetter: "A",
    explanation: "বাস্তুতন্ত্রে একাধিক খাদ্যশৃঙ্খল পরস্পর যুক্ত হয়ে খাদ্যজাল গঠন করে।",
    difficulty: "medium",
    sourceNote: "NCTB জীববিজ্ঞান, ৯ম-১০ম শ্রেণি (2026 সংস্করণ) — অধ্যায় ১৩: জীবের পরিবেশ",
  },
  {
    id: "C910B-032",
    classId: "class-9",
    subjectId: "biology-depth",
    chapterId: "acad-class-9-bio-depth-chapter-13",
    chapterName: "অধ্যায় ১৩: জীবের পরিবেশ",
    unitNumber: 13,
    topicId: "chapter-13",
    questionText: "নবায়নযোগ্য প্রাকৃতিক সম্পদ কোনটি?",
    options: [
      { letter: "A", text: "সৌরশক্তি" },
      { letter: "B", text: "কয়লা" },
      { letter: "C", text: "পেট্রোল" },
      { letter: "D", text: "প্রাকৃতিক গ্যাস" }
    ],
    correctLetter: "A",
    explanation: "সৌরশক্তি, বায়ুশক্তি, পানিশক্তি নবায়নযোগ্য; কয়লা, পেট্রোল অনবায়নযোগ্য।",
    difficulty: "easy",
    sourceNote: "NCTB জীববিজ্ঞান, ৯ম-১০ম শ্রেণি (2026 সংস্করণ) — অধ্যায় ১৩: জীবের পরিবেশ",
  },
  {
    id: "C910B-033",
    classId: "class-9",
    subjectId: "biology-depth",
    chapterId: "acad-class-9-bio-depth-chapter-13",
    chapterName: "অধ্যায় ১৩: জীবের পরিবেশ",
    unitNumber: 13,
    topicId: "chapter-13",
    questionText: "বন উজাড়ের একটি ক্ষতিকর প্রভাব কোনটি?",
    options: [
      { letter: "A", text: "বায়ুদূষণ কমা" },
      { letter: "B", text: "মাটির উর্বরতা বৃদ্ধি" },
      { letter: "C", text: "বৃষ্টি বৃদ্ধি" },
      { letter: "D", text: "ভূমিক্ষয় ও বন্যা বৃদ্ধি" }
    ],
    correctLetter: "D",
    explanation: "গাছ কাটলে মাটি আলগা হয়ে ভূমিক্ষয় ও বন্যা বাড়ে, কার্বন ডাই-অক্সাইড বাড়ে।",
    difficulty: "medium",
    sourceNote: "NCTB জীববিজ্ঞান, ৯ম-১০ম শ্রেণি (2026 সংস্করণ) — অধ্যায় ১৩: জীবের পরিবেশ",
  },
  {
    id: "C910B-034",
    classId: "class-9",
    subjectId: "biology-depth",
    chapterId: "acad-class-9-bio-depth-chapter-14",
    chapterName: "অধ্যায় ১৪: জৈবপ্রযুক্তি",
    unitNumber: 14,
    topicId: "chapter-14",
    questionText: "জৈবপ্রযুক্তির একটি ব্যবহার কোনটি?",
    options: [
      { letter: "A", text: "কয়লা উত্তোলন" },
      { letter: "B", text: "ইনসুলিন উৎপাদন" },
      { letter: "C", text: "ইস্পাত তৈরি" },
      { letter: "D", text: "প্লাস্টিক তৈরি" }
    ],
    correctLetter: "B",
    explanation: "জিন প্রকৌশলে ব্যাকটেরিয়া দিয়ে মানব ইনসুলিন তৈরি করা হয়।",
    difficulty: "easy",
    sourceNote: "NCTB জীববিজ্ঞান, ৯ম-১০ম শ্রেণি (2026 সংস্করণ) — অধ্যায় ১৪: জৈবপ্রযুক্তি",
  },
  {
    id: "C910B-035",
    classId: "class-9",
    subjectId: "biology-depth",
    chapterId: "acad-class-9-bio-depth-chapter-14",
    chapterName: "অধ্যায় ১৪: জৈবপ্রযুক্তি",
    unitNumber: 14,
    topicId: "chapter-14",
    questionText: "টিস্যু কালচারের মাধ্যমে কী করা হয়?",
    options: [
      { letter: "A", text: "প্রাণীর ক্লোন তৈরি" },
      { letter: "B", text: "বীজ সংরক্ষণ" },
      { letter: "C", text: "একটি উদ্ভিদ থেকে অসংখ্য চারা তৈরি" },
      { letter: "D", text: "মাটি পরীক্ষা" }
    ],
    correctLetter: "C",
    explanation: "টিস্যু কালচারে উদ্ভিদের ছোট অংশ থেকে জীবাণুমুক্ত পরিবেশে অনেক চারা তৈরি করা হয়।",
    difficulty: "medium",
    sourceNote: "NCTB জীববিজ্ঞান, ৯ম-১০ম শ্রেণি (2026 সংস্করণ) — অধ্যায় ১৪: জৈবপ্রযুক্তি",
  },
];
