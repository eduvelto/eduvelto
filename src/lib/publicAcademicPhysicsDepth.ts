// Eduvelto — Academic Physics (Depth) practice questions (Class 9),
// verified against the Dakhil NCTB books (review 26 Nov 2026).
//
// Static data ONLY — zero Firestore reads. The 31 questions are the
// Academic Class 9 Physics (Depth) drafts AFTER review (see
// review-academic-c9-physics-depth-verdicts.json and
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
// their fixes applied). The one NEEDS-FIX item left out (C910P-018) is NOT here — its citation is unresolved and a teacher decision is owed.
//
// HOW NEW BATCHES JOIN: append the next verified batch's questions
// to PUBLIC_ACADEMIC_PHYSICS_DEPTH_QUESTIONS below (same shape, same generation
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

/** All verified Academic Physics (Depth) questions, Class 9 (in draft order). */
export const PUBLIC_ACADEMIC_PHYSICS_DEPTH_QUESTIONS: PublicAcademicQuestion[] = [
  {
    id: "C910P-001",
    classId: "class-9",
    subjectId: "physics-depth",
    chapterId: "acad-class-9-phy-depth-chapter-1",
    chapterName: "অধ্যায় ১: ভৌত রাশি ও পরিমাপ",
    unitNumber: 1,
    topicId: "chapter-1",
    questionText: "নিচের কোনটি মৌলিক রাশি?",
    options: [
      { letter: "A", text: "বল" },
      { letter: "B", text: "দৈর্ঘ্য" },
      { letter: "C", text: "বেগ" },
      { letter: "D", text: "কাজ" }
    ],
    correctLetter: "B",
    explanation: "দৈর্ঘ্য, ভর, সময় ইত্যাদি মৌলিক রাশি; বেগ, বল, কাজ লব্ধ রাশি।",
    difficulty: "easy",
    sourceNote: "NCTB পদার্থবিজ্ঞান, ৯ম-১০ম শ্রেণি (2026 সংস্করণ) — অধ্যায় ১: ভৌত রাশি ও পরিমাপ",
  },
  {
    id: "C910P-002",
    classId: "class-9",
    subjectId: "physics-depth",
    chapterId: "acad-class-9-phy-depth-chapter-1",
    chapterName: "অধ্যায় ১: ভৌত রাশি ও পরিমাপ",
    unitNumber: 1,
    topicId: "chapter-1",
    questionText: "বলের মাত্রা (dimension) কোনটি?",
    options: [
      { letter: "A", text: "ML²T⁻²" },
      { letter: "B", text: "MLT⁻¹" },
      { letter: "C", text: "MLT⁻²" },
      { letter: "D", text: "MT⁻²" }
    ],
    correctLetter: "C",
    explanation: "বল = ভর × ত্বরণ; মাত্রা M × LT⁻² = MLT⁻²।",
    difficulty: "medium",
    sourceNote: "NCTB পদার্থবিজ্ঞান, ৯ম-১০ম শ্রেণি (2026 সংস্করণ) — অধ্যায় ১: ভৌত রাশি ও পরিমাপ",
  },
  {
    id: "C910P-003",
    classId: "class-9",
    subjectId: "physics-depth",
    chapterId: "acad-class-9-phy-depth-chapter-1",
    chapterName: "অধ্যায় ১: ভৌত রাশি ও পরিমাপ",
    unitNumber: 1,
    topicId: "chapter-1",
    questionText: "ভার্নিয়ার স্কেলের মূল ব্যবহার কোনটি?",
    options: [
      { letter: "A", text: "ভর মাপা" },
      { letter: "B", text: "সময় মাপা" },
      { letter: "C", text: "তাপমাত্রা মাপা" },
      { letter: "D", text: "সূক্ষ্মভাবে দৈর্ঘ্য মাপা" }
    ],
    correctLetter: "D",
    explanation: "ভার্নিয়ার স্কেল দিয়ে ০.১ মিমি পর্যন্ত সূক্ষ্ম দৈর্ঘ্য মাপা যায়।",
    difficulty: "medium",
    sourceNote: "NCTB পদার্থবিজ্ঞান, ৯ম-১০ম শ্রেণি (2026 সংস্করণ) — অধ্যায় ১: ভৌত রাশি ও পরিমাপ",
  },
  {
    id: "C910P-004",
    classId: "class-9",
    subjectId: "physics-depth",
    chapterId: "acad-class-9-phy-depth-chapter-2",
    chapterName: "অধ্যায় ২: গতি",
    unitNumber: 2,
    topicId: "chapter-2",
    questionText: "বেগের SI একক কোনটি?",
    options: [
      { letter: "A", text: "কিলোমিটার/ঘণ্টা" },
      { letter: "B", text: "মিটার/সেকেন্ড" },
      { letter: "C", text: "মিটার/সেকেন্ড²" },
      { letter: "D", text: "নিউটন" }
    ],
    correctLetter: "B",
    explanation: "বেগ = সরণ ÷ সময়; SI একক m/s।",
    difficulty: "easy",
    sourceNote: "NCTB পদার্থবিজ্ঞান, ৯ম-১০ম শ্রেণি (2026 সংস্করণ) — অধ্যায় ২: গতি",
  },
  {
    id: "C910P-005",
    classId: "class-9",
    subjectId: "physics-depth",
    chapterId: "acad-class-9-phy-depth-chapter-2",
    chapterName: "অধ্যায় ২: গতি",
    unitNumber: 2,
    topicId: "chapter-2",
    questionText: "স্থির অবস্থা থেকে ২ মি/সে² ত্বরণে ৫ সেকেন্ড চললে বেগ কত হবে?",
    options: [
      { letter: "A", text: "২.৫ মি/সে" },
      { letter: "B", text: "১০ মি/সে" },
      { letter: "C", text: "২৫ মি/সে" },
      { letter: "D", text: "৭ মি/সে" }
    ],
    correctLetter: "B",
    explanation: "v = u + at = ০ + ২×৫ = ১০ মি/সে।",
    difficulty: "medium",
    sourceNote: "NCTB পদার্থবিজ্ঞান, ৯ম-১০ম শ্রেণি (2026 সংস্করণ) — অধ্যায় ২: গতি",
  },
  {
    id: "C910P-006",
    classId: "class-9",
    subjectId: "physics-depth",
    chapterId: "acad-class-9-phy-depth-chapter-2",
    chapterName: "অধ্যায় ২: গতি",
    unitNumber: 2,
    topicId: "chapter-2",
    questionText: "স্থির অবস্থা থেকে ২ মি/সে² ত্বরণে ৫ সেকেন্ডে অতিক্রান্ত দূরত্ব কত?",
    options: [
      { letter: "A", text: "১০ মিটার" },
      { letter: "B", text: "১৫ মিটার" },
      { letter: "C", text: "২৫ মিটার" },
      { letter: "D", text: "৫০ মিটার" }
    ],
    correctLetter: "C",
    explanation: "s = ut + ½at² = ০ + ½×২×২৫ = ২৫ মিটার।",
    difficulty: "medium",
    sourceNote: "NCTB পদার্থবিজ্ঞান, ৯ম-১০ম শ্রেণি (2026 সংস্করণ) — অধ্যায় ২: গতি",
  },
  {
    id: "C910P-007",
    classId: "class-9",
    subjectId: "physics-depth",
    chapterId: "acad-class-9-phy-depth-chapter-3",
    chapterName: "অধ্যায় ৩: বল",
    unitNumber: 3,
    topicId: "chapter-3",
    questionText: "নিউটনের দ্বিতীয় সূত্র কোনটি?",
    options: [
      { letter: "A", text: "F = ma" },
      { letter: "B", text: "F = kx" },
      { letter: "C", text: "F = mv" },
      { letter: "D", text: "F = mgh" }
    ],
    correctLetter: "A",
    explanation: "নিউটনের দ্বিতীয় সূত্র: বল = ভর × ত্বরণ।",
    difficulty: "easy",
    sourceNote: "NCTB পদার্থবিজ্ঞান, ৯ম-১০ম শ্রেণি (2026 সংস্করণ) — অধ্যায় ৩: বল",
  },
  {
    id: "C910P-008",
    classId: "class-9",
    subjectId: "physics-depth",
    chapterId: "acad-class-9-phy-depth-chapter-3",
    chapterName: "অধ্যায় ৩: বল",
    unitNumber: 3,
    topicId: "chapter-3",
    questionText: "ভর ২ কেজি বস্তুতে ১০ নিউটন বল প্রয়োগ করলে ত্বরণ কত?",
    options: [
      { letter: "A", text: "৫ মি/সে²" },
      { letter: "B", text: "২ মি/সে²" },
      { letter: "C", text: "২০ মি/সে²" },
      { letter: "D", text: "১২ মি/সে²" }
    ],
    correctLetter: "A",
    explanation: "a = F/m = ১০/২ = ৫ মি/সে²।",
    difficulty: "medium",
    sourceNote: "NCTB পদার্থবিজ্ঞান, ৯ম-১০ম শ্রেণি (2026 সংস্করণ) — অধ্যায় ৩: বল",
  },
  {
    id: "C910P-009",
    classId: "class-9",
    subjectId: "physics-depth",
    chapterId: "acad-class-9-phy-depth-chapter-3",
    chapterName: "অধ্যায় ৩: বল",
    unitNumber: 3,
    topicId: "chapter-3",
    questionText: "বলের ঘাত কিসের সমান?",
    options: [
      { letter: "A", text: "বল ও সময়ের গুণফল" },
      { letter: "B", text: "ভর ও ত্বরণের গুণফল" },
      { letter: "C", text: "ভর ও বেগের গুণফল" },
      { letter: "D", text: "বল ও দূরত্বের গুণফল" }
    ],
    correctLetter: "A",
    explanation: "বলের ঘাত = বল × সময়।",
    difficulty: "medium",
    sourceNote: "NCTB পদার্থবিজ্ঞান, ৯ম-১০ম শ্রেণি (2026 সংস্করণ) — অধ্যায় ৩: বল",
  },
  {
    id: "C910P-011",
    classId: "class-9",
    subjectId: "physics-depth",
    chapterId: "acad-class-9-phy-depth-chapter-4",
    chapterName: "অধ্যায় ৪: কাজ, ক্ষমতা ও শক্তি",
    unitNumber: 4,
    topicId: "chapter-4",
    questionText: "১০ নিউটন বল ৫ মিটার সরণ ঘটালে কৃতকাজ কত?",
    options: [
      { letter: "A", text: "১৫ জুল" },
      { letter: "B", text: "৫০০ জুল" },
      { letter: "C", text: "২ জুল" },
      { letter: "D", text: "৫০ জুল" }
    ],
    correctLetter: "D",
    explanation: "W = Fs = ১০×৫ = ৫০ জুল।",
    difficulty: "medium",
    sourceNote: "NCTB পদার্থবিজ্ঞান, ৯ম-১০ম শ্রেণি (2026 সংস্করণ) — অধ্যায় ৪: কাজ, ক্ষমতা ও শক্তি",
  },
  {
    id: "C910P-012",
    classId: "class-9",
    subjectId: "physics-depth",
    chapterId: "acad-class-9-phy-depth-chapter-4",
    chapterName: "অধ্যায় ৪: কাজ, ক্ষমতা ও শক্তি",
    unitNumber: 4,
    topicId: "chapter-4",
    questionText: "গতিশক্তির সূত্র কোনটি?",
    options: [
      { letter: "A", text: "E = ½mgh" },
      { letter: "B", text: "E = ½mv²" },
      { letter: "C", text: "E = mgh" },
      { letter: "D", text: "E = mv²" }
    ],
    correctLetter: "B",
    explanation: "গতিশক্তি Eₖ = ½mv²; বিভবশক্তি Eₚ = mgh।",
    difficulty: "medium",
    sourceNote: "NCTB পদার্থবিজ্ঞান, ৯ম-১০ম শ্রেণি (2026 সংস্করণ) — অধ্যায় ৪: কাজ, ক্ষমতা ও শক্তি",
  },
  {
    id: "C910P-014",
    classId: "class-9",
    subjectId: "physics-depth",
    chapterId: "acad-class-9-phy-depth-chapter-5",
    chapterName: "অধ্যায় ৫: পদার্থের অবস্থা ও চাপ",
    unitNumber: 5,
    topicId: "chapter-5",
    questionText: "বায়ুমণ্ডলীয় চাপ মাপার যন্ত্র কোনটি?",
    options: [
      { letter: "A", text: "থার্মোমিটার" },
      { letter: "B", text: "ব্যারোমিটার" },
      { letter: "C", text: "ম্যানোমিটার" },
      { letter: "D", text: "অ্যামিটার" }
    ],
    correctLetter: "B",
    explanation: "ব্যারোমিটার দিয়ে বায়ুমণ্ডলীয় চাপ মাপা হয়।",
    difficulty: "medium",
    sourceNote: "NCTB পদার্থবিজ্ঞান, ৯ম-১০ম শ্রেণি (2026 সংস্করণ) — অধ্যায় ৫: পদার্থের অবস্থা ও চাপ",
  },
  {
    id: "C910P-015",
    classId: "class-9",
    subjectId: "physics-depth",
    chapterId: "acad-class-9-phy-depth-chapter-5",
    chapterName: "অধ্যায় ৫: পদার্থের অবস্থা ও চাপ",
    unitNumber: 5,
    topicId: "chapter-5",
    questionText: "পানির ঘনত্ব কত?",
    options: [
      { letter: "A", text: "১ কেজি/মি³" },
      { letter: "B", text: "১০০০০ কেজি/মি³" },
      { letter: "C", text: "১০০০ কেজি/মি³" },
      { letter: "D", text: "১০০ কেজি/মি³" }
    ],
    correctLetter: "C",
    explanation: "পানির ঘনত্ব ১০০০ kg/m³ (১ গ্রাম/ঘন সেমি)।",
    difficulty: "medium",
    sourceNote: "NCTB পদার্থবিজ্ঞান, ৯ম-১০ম শ্রেণি (2026 সংস্করণ) — অধ্যায় ৫: পদার্থের অবস্থা ও চাপ",
  },
  {
    id: "C910P-016",
    classId: "class-9",
    subjectId: "physics-depth",
    chapterId: "acad-class-9-phy-depth-chapter-6",
    chapterName: "অধ্যায় ৬: তাপের প্রভাবে পদার্থের পরিবর্তন",
    unitNumber: 6,
    topicId: "chapter-6",
    questionText: "তাপের SI একক কোনটি?",
    options: [
      { letter: "A", text: "জুল" },
      { letter: "B", text: "কেলভিন" },
      { letter: "C", text: "ক্যালরি" },
      { letter: "D", text: "ওয়াট" }
    ],
    correctLetter: "A",
    explanation: "তাপ এক ধরনের শক্তি; SI একক জুল।",
    difficulty: "easy",
    sourceNote: "NCTB পদার্থবিজ্ঞান, ৯ম-১০ম শ্রেণি (2026 সংস্করণ) — অধ্যায় ৬: তাপের প্রভাবে পদার্থের পরিবর্তন",
  },
  {
    id: "C910P-017",
    classId: "class-9",
    subjectId: "physics-depth",
    chapterId: "acad-class-9-phy-depth-chapter-6",
    chapterName: "অধ্যায় ৬: তাপের প্রভাবে পদার্থের পরিবর্তন",
    unitNumber: 6,
    topicId: "chapter-6",
    questionText: "পানির আপেক্ষিক তাপ কত?",
    options: [
      { letter: "A", text: "৪২০ J/kg·K" },
      { letter: "B", text: "২১০০ J/kg·K" },
      { letter: "C", text: "৪২০০ J/kg·K" },
      { letter: "D", text: "৯০০ J/kg·K" }
    ],
    correctLetter: "C",
    explanation: "পানির আপেক্ষিক তাপ ৪২০০ J/kg·K — অন্যান্য পদার্থের তুলনায় বেশি।",
    difficulty: "medium",
    sourceNote: "NCTB পদার্থবিজ্ঞান, ৯ম-১০ম শ্রেণি (2026 সংস্করণ) — অধ্যায় ৬: তাপের প্রভাবে পদার্থের পরিবর্তন",
  },
  {
    id: "C910P-019",
    classId: "class-9",
    subjectId: "physics-depth",
    chapterId: "acad-class-9-phy-depth-chapter-7",
    chapterName: "অধ্যায় ৭: তরঙ্গ ও শব্দ",
    unitNumber: 7,
    topicId: "chapter-7",
    questionText: "শব্দের বেগ বায়ুতে প্রায় কত?",
    options: [
      { letter: "A", text: "১০০ মি/সে" },
      { letter: "B", text: "৩×১০⁸ মি/সে" },
      { letter: "C", text: "১৫০০ মি/সে" },
      { letter: "D", text: "৩৩২ মি/সে" }
    ],
    correctLetter: "D",
    explanation: "০° সেলসিয়াসে বায়ুতে শব্দের বেগ প্রায় ৩৩২ মি/সে।",
    difficulty: "easy",
    sourceNote: "NCTB পদার্থবিজ্ঞান, ৯ম-১০ম শ্রেণি (2026 সংস্করণ) — অধ্যায় ৭: তরঙ্গ ও শব্দ",
  },
  {
    id: "C910P-020",
    classId: "class-9",
    subjectId: "physics-depth",
    chapterId: "acad-class-9-phy-depth-chapter-7",
    chapterName: "অধ্যায় ৭: তরঙ্গ ও শব্দ",
    unitNumber: 7,
    topicId: "chapter-7",
    questionText: "তরঙ্গের বেগ v, কম্পাঙ্ক f ও তরঙ্গদৈর্ঘ্য λ-এর সম্পর্ক কোনটি?",
    options: [
      { letter: "A", text: "v = fλ" },
      { letter: "B", text: "v = f/λ" },
      { letter: "C", text: "v = f + λ" },
      { letter: "D", text: "v = λ/f" }
    ],
    correctLetter: "A",
    explanation: "তরঙ্গের বেগ = কম্পাঙ্ক × তরঙ্গদৈর্ঘ্য।",
    difficulty: "medium",
    sourceNote: "NCTB পদার্থবিজ্ঞান, ৯ম-১০ম শ্রেণি (2026 সংস্করণ) — অধ্যায় ৭: তরঙ্গ ও শব্দ",
  },
  {
    id: "C910P-021",
    classId: "class-9",
    subjectId: "physics-depth",
    chapterId: "acad-class-9-phy-depth-chapter-7",
    chapterName: "অধ্যায় ৭: তরঙ্গ ও শব্দ",
    unitNumber: 7,
    topicId: "chapter-7",
    questionText: "কম্পাঙ্ক ৫০০ Hz ও তরঙ্গদৈর্ঘ্য ০.৬৬ মিটার হলে শব্দের বেগ কত?",
    options: [
      { letter: "A", text: "৩৩ মি/সে" },
      { letter: "B", text: "৩০০ মি/সে" },
      { letter: "C", text: "৭৫৭ মি/সে" },
      { letter: "D", text: "৩৩০ মি/সে" }
    ],
    correctLetter: "D",
    explanation: "v = fλ = ৫০০ × ০.৬৬ = ৩৩০ মি/সে।",
    difficulty: "medium",
    sourceNote: "NCTB পদার্থবিজ্ঞান, ৯ম-১০ম শ্রেণি (2026 সংস্করণ) — অধ্যায় ৭: তরঙ্গ ও শব্দ",
  },
  {
    id: "C910P-022",
    classId: "class-9",
    subjectId: "physics-depth",
    chapterId: "acad-class-9-phy-depth-chapter-8",
    chapterName: "অধ্যায় ৮: আলোর প্রতিফলন",
    unitNumber: 8,
    topicId: "chapter-8",
    questionText: "প্রতিফলনের সূত্র অনুযায়ী আপতন কোণ ও প্রতিফলন কোণের সম্পর্ক কী?",
    options: [
      { letter: "A", text: "প্রতিফলন কোণ দ্বিগুণ" },
      { letter: "B", text: "সমষ্টি ৯০°" },
      { letter: "C", text: "আপতন কোণ দ্বিগুণ" },
      { letter: "D", text: "সমান" }
    ],
    correctLetter: "D",
    explanation: "আপতন কোণ = প্রতিফলন কোণ।",
    difficulty: "easy",
    sourceNote: "NCTB পদার্থবিজ্ঞান, ৯ম-১০ম শ্রেণি (2026 সংস্করণ) — অধ্যায় ৮: আলোর প্রতিফলন",
  },
  {
    id: "C910P-023",
    classId: "class-9",
    subjectId: "physics-depth",
    chapterId: "acad-class-9-phy-depth-chapter-8",
    chapterName: "অধ্যায় ৮: আলোর প্রতিফলন",
    unitNumber: 8,
    topicId: "chapter-8",
    questionText: "সমতল দর্পণ থেকে ৫ মিটার দূরে দাঁড়ালে প্রতিবিম্ব দর্পণ থেকে কত দূরে গঠিত হয়?",
    options: [
      { letter: "A", text: "১০ মিটার পেছনে" },
      { letter: "B", text: "৫ মিটার পেছনে" },
      { letter: "C", text: "দর্পণের ওপর" },
      { letter: "D", text: "২.৫ মিটার পেছনে" }
    ],
    correctLetter: "B",
    explanation: "সমতল দর্পণে বস্তুর দূরত্ব = প্রতিবিম্বের দূরত্ব (দর্পণের পেছনে)।",
    difficulty: "medium",
    sourceNote: "NCTB পদার্থবিজ্ঞান, ৯ম-১০ম শ্রেণি (2026 সংস্করণ) — অধ্যায় ৮: আলোর প্রতিফলন",
  },
  {
    id: "C910P-024",
    classId: "class-9",
    subjectId: "physics-depth",
    chapterId: "acad-class-9-phy-depth-chapter-8",
    chapterName: "অধ্যায় ৮: আলোর প্রতিফলন",
    unitNumber: 8,
    topicId: "chapter-8",
    questionText: "অবতল দর্পণের প্রধান ফোকাসে বস্তু রাখলে প্রতিবিম্ব কোথায় গঠিত হয়?",
    options: [
      { letter: "A", text: "দর্পণের পেছনে" },
      { letter: "B", text: "ফোকাসে" },
      { letter: "C", text: "অসীমে" },
      { letter: "D", text: "কেন্দ্রে" }
    ],
    correctLetter: "C",
    explanation: "ফোকাসে বস্তু থাকলে প্রতিফলিত রশ্মিগুলো সমান্তরাল হয়, প্রতিবিম্ব অসীমে গঠিত হয়।",
    difficulty: "medium",
    sourceNote: "NCTB পদার্থবিজ্ঞান, ৯ম-১০ম শ্রেণি (2026 সংস্করণ) — অধ্যায় ৮: আলোর প্রতিফলন",
  },
  {
    id: "C910P-025",
    classId: "class-9",
    subjectId: "physics-depth",
    chapterId: "acad-class-9-phy-depth-chapter-9",
    chapterName: "অধ্যায় ৯: আলোর প্রতিসরণ",
    unitNumber: 9,
    topicId: "chapter-9",
    questionText: "পানির প্রতিসরাঙ্ক প্রায় কত?",
    options: [
      { letter: "A", text: "২.৪২" },
      { letter: "B", text: "১.০০" },
      { letter: "C", text: "১.৩৩" },
      { letter: "D", text: "১.৫০" }
    ],
    correctLetter: "C",
    explanation: "পানির প্রতিসরাঙ্ক ৪/৩ ≈ ১.৩৩; কাচের প্রায় ১.৫।",
    difficulty: "easy",
    sourceNote: "NCTB পদার্থবিজ্ঞান, ৯ম-১০ম শ্রেণি (2026 সংস্করণ) — অধ্যায় ৯: আলোর প্রতিসরণ",
  },
  {
    id: "C910P-026",
    classId: "class-9",
    subjectId: "physics-depth",
    chapterId: "acad-class-9-phy-depth-chapter-9",
    chapterName: "অধ্যায় ৯: আলোর প্রতিসরণ",
    unitNumber: 9,
    topicId: "chapter-9",
    questionText: "পূর্ণ অভ্যন্তরীণ প্রতিফলন ঘটতে হলে আলো কোন দিক থেকে আসতে হবে?",
    options: [
      { letter: "A", text: "ঘন মাধ্যম থেকে লঘু মাধ্যমে" },
      { letter: "B", text: "যেকোনো দিক থেকে" },
      { letter: "C", text: "শূন্য থেকে পানিতে" },
      { letter: "D", text: "লঘু মাধ্যম থেকে ঘন মাধ্যমে" }
    ],
    correctLetter: "A",
    explanation: "ঘন থেকে লঘু মাধ্যমে আপতন কোণ সংকট কোণের বেশি হলে পূর্ণ অভ্যন্তরীণ প্রতিফলন ঘটে।",
    difficulty: "medium",
    sourceNote: "NCTB পদার্থবিজ্ঞান, ৯ম-১০ম শ্রেণি (2026 সংস্করণ) — অধ্যায় ৯: আলোর প্রতিসরণ",
  },
  {
    id: "C910P-027",
    classId: "class-9",
    subjectId: "physics-depth",
    chapterId: "acad-class-9-phy-depth-chapter-9",
    chapterName: "অধ্যায় ৯: আলোর প্রতিসরণ",
    unitNumber: 9,
    topicId: "chapter-9",
    questionText: "উত্তল লেন্সের ফোকাস দূরত্ব ১০ সেমি হলে এর ক্ষমতা কত ডায়প্টার?",
    options: [
      { letter: "A", text: "+০.১ D" },
      { letter: "B", text: "+১০ D" },
      { letter: "C", text: "+১ D" },
      { letter: "D", text: "−১০ D" }
    ],
    correctLetter: "B",
    explanation: "ক্ষমতা P = ১/f (মিটারে) = ১/০.১ = +১০ ডায়প্টার।",
    difficulty: "medium",
    sourceNote: "NCTB পদার্থবিজ্ঞান, ৯ম-১০ম শ্রেণি (2026 সংস্করণ) — অধ্যায় ৯: আলোর প্রতিসরণ",
  },
  {
    id: "C910P-028",
    classId: "class-9",
    subjectId: "physics-depth",
    chapterId: "acad-class-9-phy-depth-chapter-10",
    chapterName: "অধ্যায় ১০: স্থির বিদ্যুৎ",
    unitNumber: 10,
    topicId: "chapter-10",
    questionText: "একই ধরনের আধান পরস্পরকে কী করে?",
    options: [
      { letter: "A", text: "নিরপেক্ষ করে" },
      { letter: "B", text: "বিকর্ষণ করে" },
      { letter: "C", text: "কিছুই করে না" },
      { letter: "D", text: "আকর্ষণ করে" }
    ],
    correctLetter: "B",
    explanation: "সমজাতীয় আধান বিকর্ষণ ও বিজাতীয় আধান আকর্ষণ করে।",
    difficulty: "easy",
    sourceNote: "NCTB পদার্থবিজ্ঞান, ৯ম-১০ম শ্রেণি (2026 সংস্করণ) — অধ্যায় ১০: স্থির বিদ্যুৎ",
  },
  {
    id: "C910P-029",
    classId: "class-9",
    subjectId: "physics-depth",
    chapterId: "acad-class-9-phy-depth-chapter-10",
    chapterName: "অধ্যায় ১০: স্থির বিদ্যুৎ",
    unitNumber: 10,
    topicId: "chapter-10",
    questionText: "তড়িৎক্ষেত্রের প্রাবল্যের একক কোনটি?",
    options: [
      { letter: "A", text: "V·m" },
      { letter: "B", text: "J/C" },
      { letter: "C", text: "C/N" },
      { letter: "D", text: "N/C" }
    ],
    correctLetter: "D",
    explanation: "তড়িৎক্ষেত্রের প্রাবল্য E = F/q; একক N/C (বা V/m)।",
    difficulty: "medium",
    sourceNote: "NCTB পদার্থবিজ্ঞান, ৯ম-১০ম শ্রেণি (2026 সংস্করণ) — অধ্যায় ১০: স্থির বিদ্যুৎ",
  },
  {
    id: "C910P-030",
    classId: "class-9",
    subjectId: "physics-depth",
    chapterId: "acad-class-9-phy-depth-chapter-11",
    chapterName: "অধ্যায় ১১: চলবিদ্যুৎ",
    unitNumber: 11,
    topicId: "chapter-11",
    questionText: "রোধের SI একক কোনটি?",
    options: [
      { letter: "A", text: "ওহম" },
      { letter: "B", text: "ওয়াট" },
      { letter: "C", text: "ভোল্ট" },
      { letter: "D", text: "অ্যাম্পিয়ার" }
    ],
    correctLetter: "A",
    explanation: "রোধের SI একক ওহম।",
    difficulty: "easy",
    sourceNote: "NCTB পদার্থবিজ্ঞান, ৯ম-১০ম শ্রেণি (2026 সংস্করণ) — অধ্যায় ১১: চলবিদ্যুৎ",
  },
  {
    id: "C910P-031",
    classId: "class-9",
    subjectId: "physics-depth",
    chapterId: "acad-class-9-phy-depth-chapter-11",
    chapterName: "অধ্যায় ১১: চলবিদ্যুৎ",
    unitNumber: 11,
    topicId: "chapter-11",
    questionText: "২ ওহম ও ৩ ওহম রোধ শ্রেণিতে যুক্ত করলে তুল্য রোধ কত?",
    options: [
      { letter: "A", text: "১.২ ওহম" },
      { letter: "B", text: "২.৫ ওহম" },
      { letter: "C", text: "৬ ওহম" },
      { letter: "D", text: "৫ ওহম" }
    ],
    correctLetter: "D",
    explanation: "শ্রেণি সংযোগে তুল্য রোধ = রোধগুলোর যোগফল = ২+৩ = ৫ ওহম।",
    difficulty: "medium",
    sourceNote: "NCTB পদার্থবিজ্ঞান, ৯ম-১০ম শ্রেণি (2026 সংস্করণ) — অধ্যায় ১১: চলবিদ্যুৎ",
  },
  {
    id: "C910P-033",
    classId: "class-9",
    subjectId: "physics-depth",
    chapterId: "acad-class-9-phy-depth-chapter-12",
    chapterName: "অধ্যায় ১২: তড়িৎপ্রবাহের চৌম্বক ক্রিয়া",
    unitNumber: 12,
    topicId: "chapter-12",
    questionText: "তড়িৎচুম্বকের শক্তি বাড়ানোর উপায় কোনটি?",
    options: [
      { letter: "A", text: "প্যাঁচ সংখ্যা কমানো" },
      { letter: "B", text: "লোহার কোর সরিয়ে ফেলা" },
      { letter: "C", text: "কুণ্ডলীর প্যাঁচ সংখ্যা বাড়ানো" },
      { letter: "D", text: "তড়িৎপ্রবাহ বন্ধ করা" }
    ],
    correctLetter: "C",
    explanation: "প্যাঁচ সংখ্যা ও তড়িৎপ্রবাহ বাড়ালে এবং লোহার কোর ব্যবহারে তড়িৎচুম্বক শক্তিশালী হয়।",
    difficulty: "medium",
    sourceNote: "NCTB পদার্থবিজ্ঞান, ৯ম-১০ম শ্রেণি (2026 সংস্করণ) — অধ্যায় ১২: তড়িৎপ্রবাহের চৌম্বক ক্রিয়া",
  },
  {
    id: "C910P-034",
    classId: "class-9",
    subjectId: "physics-depth",
    chapterId: "acad-class-9-phy-depth-chapter-13",
    chapterName: "অধ্যায় ১৩: তেজস্ক্রিয়তা ও ইলেকট্রনিক্স",
    unitNumber: 13,
    topicId: "chapter-13",
    questionText: "তেজস্ক্রিয়তার আবিষ্কারক কে?",
    options: [
      { letter: "A", text: "হেনরি বেকেরেল" },
      { letter: "B", text: "রাদারফোর্ড" },
      { letter: "C", text: "মাদাম কুরি" },
      { letter: "D", text: "নিউটন" }
    ],
    correctLetter: "A",
    explanation: "১৮৯৬ সালে হেনরি বেকেরেল ইউরেনিয়াম লবণ থেকে তেজস্ক্রিয়তা আবিষ্কার করেন।",
    difficulty: "easy",
    sourceNote: "NCTB পদার্থবিজ্ঞান, ৯ম-১০ম শ্রেণি (2026 সংস্করণ) — অধ্যায় ১৩: তেজস্ক্রিয়তা ও ইলেকট্রনিক্স",
  },
  {
    id: "C910P-035",
    classId: "class-9",
    subjectId: "physics-depth",
    chapterId: "acad-class-9-phy-depth-chapter-13",
    chapterName: "অধ্যায় ১৩: তেজস্ক্রিয়তা ও ইলেকট্রনিক্স",
    unitNumber: 13,
    topicId: "chapter-13",
    questionText: "অর্ধায়ু (half-life) বলতে কী বোঝায়?",
    options: [
      { letter: "A", text: "ইলেকট্রন অর্ধেক হতে যে সময় লাগে" },
      { letter: "B", text: "পরমাণুর অর্ধেক ভর কমতে যে সময় লাগে" },
      { letter: "C", text: "তেজস্ক্রিয় পরমাণুর অর্ধেক ক্ষয় হতে যে সময় লাগে" },
      { letter: "D", text: "তাপ অর্ধেক হতে যে সময় লাগে" }
    ],
    correctLetter: "C",
    explanation: "অর্ধায়ু হলো তেজস্ক্রিয় নমুনার অর্ধেক পরমাণু ক্ষয় হতে প্রয়োজনীয় সময়।",
    difficulty: "medium",
    sourceNote: "NCTB পদার্থবিজ্ঞান, ৯ম-১০ম শ্রেণি (2026 সংস্করণ) — অধ্যায় ১৩: তেজস্ক্রিয়তা ও ইলেকট্রনিক্স",
  },
];
