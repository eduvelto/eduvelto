// Eduvelto — Academic Higher Mathematics (Depth) practice questions (Class 9),
// verified against the Dakhil NCTB books (review 26 Nov 2026).
//
// Static data ONLY — zero Firestore reads. The 19 questions are the
// Academic Class 9 Higher Mathematics (Depth) drafts AFTER review (see
// review-academic-c9-higher-math-depth-verdicts.json and
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
// to PUBLIC_ACADEMIC_HIGHER_MATH_DEPTH_QUESTIONS below (same shape, same generation
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

/** All verified Academic Higher Mathematics (Depth) questions, Class 9 (in draft order). */
export const PUBLIC_ACADEMIC_HIGHER_MATH_DEPTH_QUESTIONS: PublicAcademicQuestion[] = [
  {
    id: "C910HM-001",
    classId: "class-9",
    subjectId: "higher-math-depth",
    chapterId: "acad-class-9-hmat-depth-chapter-1",
    chapterName: "অধ্যায় ১: সেট ও ফাংশন",
    unitNumber: 1,
    topicId: "chapter-1",
    questionText: "f(x) = x² − ২x হলে f(৩) = কত?",
    options: [
      { letter: "A", text: "১৫" },
      { letter: "B", text: "৩" },
      { letter: "C", text: "০" },
      { letter: "D", text: "৯" }
    ],
    correctLetter: "B",
    explanation: "f(৩) = ৯ − ৬ = ৩।",
    difficulty: "medium",
    sourceNote: "NCTB উচ্চতর গণিত, ৯ম-১০ম শ্রেণি (2026 সংস্করণ) — অধ্যায় ১: সেট ও ফাংশন",
  },
  {
    id: "C910HM-002",
    classId: "class-9",
    subjectId: "higher-math-depth",
    chapterId: "acad-class-9-hmat-depth-chapter-1",
    chapterName: "অধ্যায় ১: সেট ও ফাংশন",
    unitNumber: 1,
    topicId: "chapter-1",
    questionText: "A = {১, ২}, B = {৩, ৪} হলে A × B-এর উপাদান সংখ্যা কত?",
    options: [
      { letter: "A", text: "৪" },
      { letter: "B", text: "৮" },
      { letter: "C", text: "৬" },
      { letter: "D", text: "২" }
    ],
    correctLetter: "A",
    explanation: "কার্তেসীয় গুণজের উপাদান সংখ্যা = ২ × ২ = ৪।",
    difficulty: "medium",
    sourceNote: "NCTB উচ্চতর গণিত, ৯ম-১০ম শ্রেণি (2026 সংস্করণ) — অধ্যায় ১: সেট ও ফাংশন",
  },
  {
    id: "C910HM-003",
    classId: "class-9",
    subjectId: "higher-math-depth",
    chapterId: "acad-class-9-hmat-depth-chapter-2",
    chapterName: "অধ্যায় ২: বীজগাণিতিক রাশি",
    unitNumber: 2,
    topicId: "chapter-2",
    questionText: "x³ + y³ = কত?",
    options: [
      { letter: "A", text: "(x + y)(x² + xy + y²)" },
      { letter: "B", text: "(x + y)³" },
      { letter: "C", text: "(x − y)(x² + xy + y²)" },
      { letter: "D", text: "(x + y)(x² − xy + y²)" }
    ],
    correctLetter: "D",
    explanation: "a³+b³ = (a+b)(a²−ab+b²)।",
    difficulty: "medium",
    sourceNote: "NCTB উচ্চতর গণিত, ৯ম-১০ম শ্রেণি (2026 সংস্করণ) — অধ্যায় ২: বীজগাণিতিক রাশি",
  },
  {
    id: "C910HM-004",
    classId: "class-9",
    subjectId: "higher-math-depth",
    chapterId: "acad-class-9-hmat-depth-chapter-2",
    chapterName: "অধ্যায় ২: বীজগাণিতিক রাশি",
    unitNumber: 2,
    topicId: "chapter-2",
    questionText: "x + ১/x = ৪ হলে x³ + ১/x³ = কত?",
    options: [
      { letter: "A", text: "৫২" },
      { letter: "B", text: "৬৪" },
      { letter: "C", text: "৬০" },
      { letter: "D", text: "৪০" }
    ],
    correctLetter: "A",
    explanation: "x³+১/x³ = (x+১/x)³ − ৩(x+১/x) = ৬৪ − ১২ = ৫২।",
    difficulty: "hard",
    sourceNote: "NCTB উচ্চতর গণিত, ৯ম-১০ম শ্রেণি (2026 সংস্করণ) — অধ্যায় ২: বীজগাণিতিক রাশি",
  },
  {
    id: "C910HM-005",
    classId: "class-9",
    subjectId: "higher-math-depth",
    chapterId: "acad-class-9-hmat-depth-chapter-3",
    chapterName: "অধ্যায় ৩: জ্যামিতি",
    unitNumber: 3,
    topicId: "chapter-3",
    questionText: "বৃত্তস্থ চতুর্ভুজের বিপরীত কোণদ্বয়ের সমষ্টি কত?",
    options: [
      { letter: "A", text: "৯০°" },
      { letter: "B", text: "৩৬০°" },
      { letter: "C", text: "২৭০°" },
      { letter: "D", text: "১৮০°" }
    ],
    correctLetter: "D",
    explanation: "বৃত্তস্থ চতুর্ভুজের বিপরীত কোণদ্বয় পরস্পর সম্পূরক।",
    difficulty: "medium",
    sourceNote: "NCTB উচ্চতর গণিত, ৯ম-১০ম শ্রেণি (2026 সংস্করণ) — অধ্যায় ৩: জ্যামিতি",
  },
  {
    id: "C910HM-006",
    classId: "class-9",
    subjectId: "higher-math-depth",
    chapterId: "acad-class-9-hmat-depth-chapter-3",
    chapterName: "অধ্যায় ৩: জ্যামিতি",
    unitNumber: 3,
    topicId: "chapter-3",
    questionText: "টলেমির উপপাদ্য অনুযায়ী বৃত্তস্থ চতুর্ভুজের কর্ণদ্বয়ের গুণফল কিসের সমান?",
    options: [
      { letter: "A", text: "বাহুগুলোর যোগফলের" },
      { letter: "B", text: "পরিসীমার" },
      { letter: "C", text: "বিপরীত বাহুদ্বয়ের গুণফলের সমষ্টির" },
      { letter: "D", text: "বাহুগুলোর গুণফলের" }
    ],
    correctLetter: "C",
    explanation: "টলেমির উপপাদ্য: কর্ণদ্বয়ের গুণফল = বিপরীত বাহুজোড়ার গুণফলের সমষ্টি।",
    difficulty: "medium",
    sourceNote: "NCTB উচ্চতর গণিত, ৯ম-১০ম শ্রেণি (2026 সংস্করণ) — অধ্যায় ৩: জ্যামিতি",
  },
  {
    id: "C910HM-007",
    classId: "class-9",
    subjectId: "higher-math-depth",
    chapterId: "acad-class-9-hmat-depth-chapter-4",
    chapterName: "অধ্যায় ৪: জ্যামিতিক অঙ্কন",
    unitNumber: 4,
    topicId: "chapter-4",
    questionText: "কোনো রেখাংশের লম্ব সমদ্বিখণ্ডক আঁকতে কী প্রয়োজন?",
    options: [
      { letter: "A", text: "শুধু স্কেল" },
      { letter: "B", text: "কম্পাস ও স্কেল" },
      { letter: "C", text: "শুধু চাঁদা" },
      { letter: "D", text: "সেট স্কয়ার ও চাঁদা" }
    ],
    correctLetter: "B",
    explanation: "কম্পাস দিয়ে দুই প্রান্ত থেকে সমান ব্যাসার্ধের বৃত্তচাপ এঁকে লম্ব সমদ্বিখণ্ডক আঁকা হয়।",
    difficulty: "easy",
    sourceNote: "NCTB উচ্চতর গণিত, ৯ম-১০ম শ্রেণি (2026 সংস্করণ) — অধ্যায় ৪: জ্যামিতিক অঙ্কন",
  },
  {
    id: "C910HM-008",
    classId: "class-9",
    subjectId: "higher-math-depth",
    chapterId: "acad-class-9-hmat-depth-chapter-3",
    chapterName: "অধ্যায় ৩: জ্যামিতি",
    unitNumber: 3,
    topicId: "chapter-3",
    questionText: "ত্রিভুজের তিনটি বাহু ৩, ৪, ৫ সেমি হলে এটি কোন ধরনের ত্রিভুজ?",
    options: [
      { letter: "A", text: "সমবাহু" },
      { letter: "B", text: "সমকোণী" },
      { letter: "C", text: "সমদ্বিবাহু" },
      { letter: "D", text: "স্থূলকোণী" }
    ],
    correctLetter: "B",
    explanation: "৩²+৪²=৫²; পিথাগোরাসের বিপরীত উপপাদ্য অনুযায়ী সমকোণী ত্রিভুজ।",
    difficulty: "medium",
    sourceNote: "NCTB উচ্চতর গণিত, ৯ম-১০ম শ্রেণি (2026 সংস্করণ) — অধ্যায় ৩: জ্যামিতি",
  },
  {
    id: "C910HM-009",
    classId: "class-9",
    subjectId: "higher-math-depth",
    chapterId: "acad-class-9-hmat-depth-chapter-5",
    chapterName: "অধ্যায় ৫: সমীকরণ",
    unitNumber: 5,
    topicId: "chapter-5",
    questionText: "x² − ৮x + ১৫ = ০ সমীকরণের মূলদ্বয় কত?",
    options: [
      { letter: "A", text: "৪ ও ৪" },
      { letter: "B", text: "২ ও ৬" },
      { letter: "C", text: "৩ ও ৫" },
      { letter: "D", text: "১ ও ১৫" }
    ],
    correctLetter: "C",
    explanation: "x² − ৮x + ১৫ = (x − ৩)(x − ৫) = ০, তাই মূলদ্বয় ৩ ও ৫।",
    difficulty: "medium",
    sourceNote: "NCTB উচ্চতর গণিত, ৯ম-১০ম শ্রেণি (2026 সংস্করণ) — অধ্যায় ৫: সমীকরণ",
  },
  {
    id: "C910HM-010",
    classId: "class-9",
    subjectId: "higher-math-depth",
    chapterId: "acad-class-9-hmat-depth-chapter-5",
    chapterName: "অধ্যায় ৫: সমীকরণ",
    unitNumber: 5,
    topicId: "chapter-5",
    questionText: "x² − ৫x + ৬ = ০ সমীকরণের মূলদ্বয়ের যোগফল ও গুণফল কত?",
    options: [
      { letter: "A", text: "যোগফল ৫, গুণফল −৬" },
      { letter: "B", text: "যোগফল −৫, গুণফল ৬" },
      { letter: "C", text: "যোগফল ৫, গুণফল ৬" },
      { letter: "D", text: "যোগফল ৬, গুণফল ৫" }
    ],
    correctLetter: "C",
    explanation: "ax²+bx+c=০ হলে মূলদ্বয়ের যোগফল = −b/a = ৫, গুণফল = c/a = ৬।",
    difficulty: "hard",
    sourceNote: "NCTB উচ্চতর গণিত, ৯ম-১০ম শ্রেণি (2026 সংস্করণ) — অধ্যায় ৫: সমীকরণ",
  },
  {
    id: "C910HM-011",
    classId: "class-9",
    subjectId: "higher-math-depth",
    chapterId: "acad-class-9-hmat-depth-chapter-6",
    chapterName: "অধ্যায় ৬: অসমতা",
    unitNumber: 6,
    topicId: "chapter-6",
    questionText: "x > ৩ হলে −x কেমন হবে?",
    options: [
      { letter: "A", text: "−x > ৩" },
      { letter: "B", text: "−x > −৩" },
      { letter: "C", text: "−x < −৩" },
      { letter: "D", text: "−x = −৩" }
    ],
    correctLetter: "C",
    explanation: "অসমতার উভয় পক্ষকে −১ দিয়ে গুণ করলে চিহ্ন উল্টে যায়: −x < −৩।",
    difficulty: "easy",
    sourceNote: "NCTB উচ্চতর গণিত, ৯ম-১০ম শ্রেণি (2026 সংস্করণ) — অধ্যায় ৬: অসমতা",
  },
  {
    id: "C910HM-012",
    classId: "class-9",
    subjectId: "higher-math-depth",
    chapterId: "acad-class-9-hmat-depth-chapter-6",
    chapterName: "অধ্যায় ৬: অসমতা",
    unitNumber: 6,
    topicId: "chapter-6",
    questionText: "২x − ৪ < ৬ হলে x-এর মান কত?",
    options: [
      { letter: "A", text: "x > ৫" },
      { letter: "B", text: "x < ৫" },
      { letter: "C", text: "x < ১০" },
      { letter: "D", text: "x > ১০" }
    ],
    correctLetter: "B",
    explanation: "২x < ১০; x < ৫।",
    difficulty: "medium",
    sourceNote: "NCTB উচ্চতর গণিত, ৯ম-১০ম শ্রেণি (2026 সংস্করণ) — অধ্যায় ৬: অসমতা",
  },
  {
    id: "C910HM-013",
    classId: "class-9",
    subjectId: "higher-math-depth",
    chapterId: "acad-class-9-hmat-depth-chapter-7",
    chapterName: "অধ্যায় ৭: অসীম ধারা",
    unitNumber: 7,
    topicId: "chapter-7",
    questionText: "১ + ১/২ + ১/৪ + ১/৮ + ... অসীম গুণোত্তর ধারার সমষ্টি কত?",
    options: [
      { letter: "A", text: "অসীম" },
      { letter: "B", text: "১" },
      { letter: "C", text: "২" },
      { letter: "D", text: "৪" }
    ],
    correctLetter: "C",
    explanation: "প্রথম পদ a=১, সাধারণ অনুপাত r=১/২; সমষ্টি = a/(১−r) = ১/(১/২) = ২।",
    difficulty: "medium",
    sourceNote: "NCTB উচ্চতর গণিত, ৯ম-১০ম শ্রেণি (2026 সংস্করণ) — অধ্যায় ৭: অসীম ধারা",
  },
  {
    id: "C910HM-015",
    classId: "class-9",
    subjectId: "higher-math-depth",
    chapterId: "acad-class-9-hmat-depth-chapter-9",
    chapterName: "অধ্যায় ৯: সূচকীয় ও লগারিদমীয় ফাংশন",
    unitNumber: 9,
    topicId: "chapter-9",
    questionText: "log₂ ৩২ = কত?",
    options: [
      { letter: "A", text: "৪" },
      { letter: "B", text: "৬" },
      { letter: "C", text: "১৬" },
      { letter: "D", text: "৫" }
    ],
    correctLetter: "D",
    explanation: "২⁵ = ৩২, তাই log₂ ৩২ = ৫।",
    difficulty: "medium",
    sourceNote: "NCTB উচ্চতর গণিত, ৯ম-১০ম শ্রেণি (2026 সংস্করণ) — অধ্যায় ৯: সূচকীয় ও লগারিদমীয় ফাংশন",
  },
  {
    id: "C910HM-016",
    classId: "class-9",
    subjectId: "higher-math-depth",
    chapterId: "acad-class-9-hmat-depth-chapter-10",
    chapterName: "অধ্যায় ১০: দ্বিপদী বিস্তৃতি",
    unitNumber: 10,
    topicId: "chapter-10",
    questionText: "(x + ১)³-এর বিস্তৃতিতে x²-এর সহগ কত?",
    options: [
      { letter: "A", text: "৩" },
      { letter: "B", text: "১" },
      { letter: "C", text: "৬" },
      { letter: "D", text: "৪" }
    ],
    correctLetter: "A",
    explanation: "(x+১)³ = x³ + ৩x² + ৩x + ১; x²-এর সহগ ৩।",
    difficulty: "medium",
    sourceNote: "NCTB উচ্চতর গণিত, ৯ম-১০ম শ্রেণি (2026 সংস্করণ) — অধ্যায় ১০: দ্বিপদী বিস্তৃতি",
  },
  {
    id: "C910HM-017",
    classId: "class-9",
    subjectId: "higher-math-depth",
    chapterId: "acad-class-9-hmat-depth-chapter-11",
    chapterName: "অধ্যায় ১১: স্থানাঙ্ক জ্যামিতি",
    unitNumber: 11,
    topicId: "chapter-11",
    questionText: "(১, ২) ও (৪, ৬) বিন্দুদ্বয়ের মধ্যবর্তী দূরত্ব কত?",
    options: [
      { letter: "A", text: "৭" },
      { letter: "B", text: "৩" },
      { letter: "C", text: "৪" },
      { letter: "D", text: "৫" }
    ],
    correctLetter: "D",
    explanation: "দূরত্ব = √((৪−১)² + (৬−২)²) = √(৯+১৬) = √২৫ = ৫।",
    difficulty: "medium",
    sourceNote: "NCTB উচ্চতর গণিত, ৯ম-১০ম শ্রেণি (2026 সংস্করণ) — অধ্যায় ১১: স্থানাঙ্ক জ্যামিতি",
  },
  {
    id: "C910HM-018",
    classId: "class-9",
    subjectId: "higher-math-depth",
    chapterId: "acad-class-9-hmat-depth-chapter-12",
    chapterName: "অধ্যায় ১২: সমতলীয় ভেক্টর",
    unitNumber: 12,
    topicId: "chapter-12",
    questionText: "ভেক্টর a = ৩i + ৪j-এর মান (magnitude) কত?",
    options: [
      { letter: "A", text: "৫" },
      { letter: "B", text: "১২" },
      { letter: "C", text: "২৫" },
      { letter: "D", text: "৭" }
    ],
    correctLetter: "A",
    explanation: "|a| = √(৩²+৪²) = √২৫ = ৫।",
    difficulty: "medium",
    sourceNote: "NCTB উচ্চতর গণিত, ৯ম-১০ম শ্রেণি (2026 সংস্করণ) — অধ্যায় ১২: সমতলীয় ভেক্টর",
  },
  {
    id: "C910HM-019",
    classId: "class-9",
    subjectId: "higher-math-depth",
    chapterId: "acad-class-9-hmat-depth-chapter-13",
    chapterName: "অধ্যায় ১৩: ঘন জ্যামিতি",
    unitNumber: 13,
    topicId: "chapter-13",
    questionText: "ব্যাসার্ধ ৩ সেমি গোলকের আয়তন কত? (π = ৩.১৪)",
    options: [
      { letter: "A", text: "৩৭.৬৮ ঘন সেমি" },
      { letter: "B", text: "১১৩.০৪ ঘন সেমি" },
      { letter: "C", text: "৩৩৯.১২ ঘন সেমি" },
      { letter: "D", text: "৫৬.৫২ ঘন সেমি" }
    ],
    correctLetter: "B",
    explanation: "আয়তন = (৪/৩)πr³ = (৪/৩)×৩.১৪×২৭ = ১১৩.০৪ ঘন সেমি।",
    difficulty: "medium",
    sourceNote: "NCTB উচ্চতর গণিত, ৯ম-১০ম শ্রেণি (2026 সংস্করণ) — অধ্যায় ১৩: ঘন জ্যামিতি",
  },
  {
    id: "C910HM-020",
    classId: "class-9",
    subjectId: "higher-math-depth",
    chapterId: "acad-class-9-hmat-depth-chapter-14",
    chapterName: "অধ্যায় ১৪: সম্ভাবনা",
    unitNumber: 14,
    topicId: "chapter-14",
    questionText: "একটি ছক্কা নিক্ষেপে জোড় সংখ্যা পাওয়ার সম্ভাবনা কত?",
    options: [
      { letter: "A", text: "১/২" },
      { letter: "B", text: "১/৬" },
      { letter: "C", text: "২/৩" },
      { letter: "D", text: "১/৩" }
    ],
    correctLetter: "A",
    explanation: "জোড় সংখ্যা ২, ৪, ৬ — মোট ৩টি; সম্ভাবনা = ৩/৬ = ১/২।",
    difficulty: "medium",
    sourceNote: "NCTB উচ্চতর গণিত, ৯ম-১০ম শ্রেণি (2026 সংস্করণ) — অধ্যায় ১৪: সম্ভাবনা",
  },
];
