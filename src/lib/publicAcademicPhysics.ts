// Eduvelto — Academic Physics practice questions (Class 9),
// verified against the Dakhil NCTB books (review 26 Nov 2026).
//
// Static data ONLY — zero Firestore reads. The 23 questions are the
// Academic Class 9 Physics drafts AFTER review (see
// review-academic-c9-physics-verdicts.json and
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
// to PUBLIC_ACADEMIC_PHYSICS_QUESTIONS below (same shape, same generation
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

/** All verified Academic Physics questions, Class 9 (in draft order). */
export const PUBLIC_ACADEMIC_PHYSICS_QUESTIONS: PublicAcademicQuestion[] = [
  {
    id: "ACAD-0064",
    classId: "class-9",
    subjectId: "physics",
    chapterId: "acad-class-9-phy-chapter-2",
    chapterName: "অধ্যায় ২: গতি",
    unitNumber: 2,
    topicId: "chapter-2",
    questionText: "স্থির অবস্থা থেকে সুষম ত্বরণে চলমান বস্তুর ক্ষেত্রে v = u + at — এখানে v কী?",
    options: [
      { letter: "A", text: "ত্বরণ" },
      { letter: "B", text: "আদি বেগ" },
      { letter: "C", text: "গড় বেগ" },
      { letter: "D", text: "শেষ বেগ" }
    ],
    correctLetter: "D",
    explanation: "v = শেষ বেগ, u = আদি বেগ, a = ত্বরণ, t = সময়।",
    difficulty: "medium",
    sourceNote: "NCTB পদার্থবিজ্ঞান, নবম-দশম শ্রেণি — অধ্যায় ২: গতি",
  },
  {
    id: "ACAD-0065",
    classId: "class-9",
    subjectId: "physics",
    chapterId: "acad-class-9-phy-chapter-3",
    chapterName: "অধ্যায় ৩: বল",
    unitNumber: 3,
    topicId: "chapter-3",
    questionText: "বলের SI একক কী?",
    options: [
      { letter: "A", text: "নিউটন" },
      { letter: "B", text: "প্যাসকেল" },
      { letter: "C", text: "জুল" },
      { letter: "D", text: "ওয়াট" }
    ],
    correctLetter: "A",
    explanation: "বলের SI একক নিউটন (N); 1 N = 1 kg·m/s²।",
    difficulty: "easy",
    sourceNote: "NCTB পদার্থবিজ্ঞান, নবম-দশম শ্রেণি — অধ্যায় ৩: বল",
  },
  {
    id: "ACAD-0066",
    classId: "class-9",
    subjectId: "physics",
    chapterId: "acad-class-9-phy-chapter-4",
    chapterName: "অধ্যায় ৪: কাজ, ক্ষমতা ও শক্তি",
    unitNumber: 4,
    topicId: "chapter-4",
    questionText: "১০ N বল প্রয়োগে বস্তু ৫ m সরে গেলে কৃতকার্য কত?",
    options: [
      { letter: "A", text: "২ J" },
      { letter: "B", text: "১৫ J" },
      { letter: "C", text: "৫০ J" },
      { letter: "D", text: "৫ J" }
    ],
    correctLetter: "C",
    explanation: "কাজ W = F × s = 10 × 5 = 50 J।",
    difficulty: "medium",
    sourceNote: "NCTB পদার্থবিজ্ঞান, নবম-দশম শ্রেণি — অধ্যায় ৪: কাজ, ক্ষমতা ও শক্তি",
  },
  {
    id: "ACAD-0067",
    classId: "class-9",
    subjectId: "physics",
    chapterId: "acad-class-9-phy-chapter-5",
    chapterName: "অধ্যায় ৫: পদার্থের অবস্থা ও চাপ",
    unitNumber: 5,
    topicId: "chapter-5",
    questionText: "চাপের SI একক কী?",
    options: [
      { letter: "A", text: "নিউটন" },
      { letter: "B", text: "জুল" },
      { letter: "C", text: "প্যাসকেল" },
      { letter: "D", text: "বার" }
    ],
    correctLetter: "C",
    explanation: "চাপ P = F/A; SI একক প্যাসকেল (Pa = N/m²)।",
    difficulty: "medium",
    sourceNote: "NCTB পদার্থবিজ্ঞান, নবম-দশম শ্রেণি — অধ্যায় ৫: পদার্থের অবস্থা ও চাপ",
  },
  {
    id: "ACAD-0068",
    classId: "class-9",
    subjectId: "physics",
    chapterId: "acad-class-9-phy-chapter-6",
    chapterName: "অধ্যায় ৬: বস্তুর ওপর তাপের প্রভাব",
    unitNumber: 6,
    topicId: "chapter-6",
    questionText: "কোন তাপমাত্রায় পানি বরফে পরিণত হয়?",
    options: [
      { letter: "A", text: "৪° সেলসিয়াস" },
      { letter: "B", text: "১০০° সেলসিয়াস" },
      { letter: "C", text: "-১০° সেলসিয়াস" },
      { letter: "D", text: "০° সেলসিয়াস" }
    ],
    correctLetter: "D",
    explanation: "০° সেলসিয়াস তাপমাত্রায় পানি বরফে পরিণত হয়।",
    difficulty: "easy",
    sourceNote: "NCTB পদার্থবিজ্ঞান, নবম-দশম শ্রেণি — অধ্যায় ৬: বস্তুর ওপর তাপের প্রভাব",
  },
  {
    id: "ACAD-0069",
    classId: "class-9",
    subjectId: "physics",
    chapterId: "acad-class-9-phy-chapter-7",
    chapterName: "অধ্যায় ৭: তরঙ্গ ও শব্দ",
    unitNumber: 7,
    topicId: "chapter-7",
    questionText: "বায়ুতে শব্দের বেগ প্রতি সেকেন্ডে কত মিটার?",
    options: [
      { letter: "A", text: "৩০০ মিটার" },
      { letter: "B", text: "৫০০ মিটার" },
      { letter: "C", text: "৩৩০ মিটার" },
      { letter: "D", text: "১৫০ মিটার" }
    ],
    correctLetter: "C",
    explanation: "বইয়ের টেবিল ৭.০১ (পৃ. ২০২) অনুযায়ী বাতাসে শব্দের বেগ ৩৩০ m/s; প্রতিধ্বনি আলোচনাতেও (পৃ. ২০১) শব্দের বেগ ৩৩০ m/s ধরা হয়েছে।",
    difficulty: "medium",
    sourceNote: "NCTB পদার্থবিজ্ঞান, নবম-দশম শ্রেণি — অধ্যায় ৭: তরঙ্গ ও শব্দ",
  },
  {
    id: "ACAD-0070",
    classId: "class-9",
    subjectId: "physics",
    chapterId: "acad-class-9-phy-chapter-8",
    chapterName: "অধ্যায় ৮: আলোর প্রতিফলন",
    unitNumber: 8,
    topicId: "chapter-8",
    questionText: "আপতন কোণ ৩০° হলে প্রতিফলন কোণ কত?",
    options: [
      { letter: "A", text: "৩০°" },
      { letter: "B", text: "৯০°" },
      { letter: "C", text: "১৫°" },
      { letter: "D", text: "৬০°" }
    ],
    correctLetter: "A",
    explanation: "প্রতিফলনের সূত্র: আপতন কোণ = প্রতিফলন কোণ, তাই ৩০°।",
    difficulty: "medium",
    sourceNote: "NCTB পদার্থবিজ্ঞান, নবম-দশম শ্রেণি — অধ্যায় ৮: আলোর প্রতিফলন",
  },
  {
    id: "ACAD-0071",
    classId: "class-9",
    subjectId: "physics",
    chapterId: "acad-class-9-phy-chapter-9",
    chapterName: "অধ্যায় ৯: আলোর প্রতিসরণ",
    unitNumber: 9,
    topicId: "chapter-9",
    questionText: "লেন্সের ক্ষমতার একক কী?",
    options: [
      { letter: "A", text: "ডায়প্টার" },
      { letter: "B", text: "সেন্টিমিটার" },
      { letter: "C", text: "জুল" },
      { letter: "D", text: "মিটার" }
    ],
    correctLetter: "A",
    explanation: "লেন্সের ক্ষমতা P = 1/f; একক ডায়প্টার (D)।",
    difficulty: "medium",
    sourceNote: "NCTB পদার্থবিজ্ঞান, নবম-দশম শ্রেণি — অধ্যায় ৯: আলোর প্রতিসরণ",
  },
  {
    id: "ACAD-0072",
    classId: "class-9",
    subjectId: "physics",
    chapterId: "acad-class-9-phy-chapter-10",
    chapterName: "অধ্যায় ১০: স্থির তড়িৎ",
    unitNumber: 10,
    topicId: "chapter-10",
    questionText: "তড়িৎ আধানের SI একক কী?",
    options: [
      { letter: "A", text: "অ্যাম্পিয়ার" },
      { letter: "B", text: "কুলম্ব" },
      { letter: "C", text: "ভোল্ট" },
      { letter: "D", text: "ওহম" }
    ],
    correctLetter: "B",
    explanation: "আধানের SI একক কুলম্ব (C)।",
    difficulty: "easy",
    sourceNote: "NCTB পদার্থবিজ্ঞান, নবম-দশম শ্রেণি — অধ্যায় ১০: স্থির তড়িৎ",
  },
  {
    id: "ACAD-0073",
    classId: "class-9",
    subjectId: "physics",
    chapterId: "acad-class-9-phy-chapter-11",
    chapterName: "অধ্যায় ১১: চল তড়িৎ",
    unitNumber: 11,
    topicId: "chapter-11",
    questionText: "তড়িৎ প্রবাহ, বিভব পার্থক্য ও রোধের মধ্যে সম্পর্ক কোন সূত্রে প্রকাশ পায়?",
    options: [
      { letter: "A", text: "নিউটনের সূত্র" },
      { letter: "B", text: "ওহমের সূত্র" },
      { letter: "C", text: "ফ্যারাডের সূত্র" },
      { letter: "D", text: "কুলম্বের সূত্র" }
    ],
    correctLetter: "B",
    explanation: "ওহমের সূত্র অনুযায়ী V = IR, অর্থাৎ বিভব পার্থক্য = প্রবাহ × রোধ।",
    difficulty: "medium",
    sourceNote: "NCTB পদার্থবিজ্ঞান, নবম-দশম শ্রেণি — অধ্যায় ১১: চল তড়িৎ",
  },
  {
    id: "ACAD-0074",
    classId: "class-9",
    subjectId: "physics",
    chapterId: "acad-class-9-phy-chapter-12",
    chapterName: "অধ্যায় ১২: তড়িতের চৌম্বক ক্রিয়া",
    unitNumber: 12,
    topicId: "chapter-12",
    questionText: "তড়িৎ মোটরের মূল কাজ কী?",
    options: [
      { letter: "A", text: "তাপ উৎপাদন" },
      { letter: "B", text: "তড়িৎ শক্তিকে যান্ত্রিক শক্তিতে রূপান্তর" },
      { letter: "C", text: "আলো উৎপাদন" },
      { letter: "D", text: "যান্ত্রিক শক্তিকে তড়িৎ শক্তিতে রূপান্তর" }
    ],
    correctLetter: "B",
    explanation: "তড়িৎ মোটর তড়িৎ শক্তিকে যান্ত্রিক শক্তিতে রূপান্তর করে; জেনারেটর করে উল্টোটা।",
    difficulty: "medium",
    sourceNote: "NCTB পদার্থবিজ্ঞান, নবম-দশম শ্রেণি — অধ্যায় ১২: তড়িতের চৌম্বক ক্রিয়া",
  },
  {
    id: "ACAD-5073",
    classId: "class-9",
    subjectId: "physics",
    chapterId: "acad-class-9-phy-chapter-2",
    chapterName: "অধ্যায় ২: গতি",
    unitNumber: 2,
    topicId: "chapter-2",
    questionText: "বেগ 20 m/s হলে 5 s-এ অতিক্রান্ত দূরত্ব কত?",
    options: [
      { letter: "A", text: "100 m" },
      { letter: "B", text: "25 m" },
      { letter: "C", text: "15 m" },
      { letter: "D", text: "4 m" }
    ],
    correctLetter: "A",
    explanation: "দূরত্ব = বেগ × সময় = 20 × 5 = 100 m।",
    difficulty: "medium",
    sourceNote: "NCTB পদার্থবিজ্ঞান — অধ্যায় ২: গতি",
  },
  {
    id: "ACAD-5074",
    classId: "class-9",
    subjectId: "physics",
    chapterId: "acad-class-9-phy-chapter-3",
    chapterName: "অধ্যায় ৩: বল",
    unitNumber: 3,
    topicId: "chapter-3",
    questionText: "ভর 5 kg বস্তুতে 10 N বল প্রয়োগে ত্বরণ কত?",
    options: [
      { letter: "A", text: "15 m/s²" },
      { letter: "B", text: "0.5 m/s²" },
      { letter: "C", text: "50 m/s²" },
      { letter: "D", text: "2 m/s²" }
    ],
    correctLetter: "D",
    explanation: "a = F/m = 10/5 = 2 m/s²।",
    difficulty: "medium",
    sourceNote: "NCTB পদার্থবিজ্ঞান — অধ্যায় ৩: বল",
  },
  {
    id: "ACAD-5075",
    classId: "class-9",
    subjectId: "physics",
    chapterId: "acad-class-9-phy-chapter-4",
    chapterName: "অধ্যায় ৪: কাজ, ক্ষমতা ও শক্তি",
    unitNumber: 4,
    topicId: "chapter-4",
    questionText: "বিভবশক্তির সূত্র কোনটি?",
    options: [
      { letter: "A", text: "½mv²" },
      { letter: "B", text: "mgh" },
      { letter: "C", text: "mv" },
      { letter: "D", text: "mg" }
    ],
    correctLetter: "B",
    explanation: "বিভবশক্তি EP = mgh; গতিশক্তি = ½mv²।",
    difficulty: "medium",
    sourceNote: "NCTB পদার্থবিজ্ঞান — অধ্যায় ৪: কাজ, ক্ষমতা ও শক্তি",
  },
  {
    id: "ACAD-5076",
    classId: "class-9",
    subjectId: "physics",
    chapterId: "acad-class-9-phy-chapter-4",
    chapterName: "অধ্যায় ৪: কাজ, ক্ষমতা ও শক্তি",
    unitNumber: 4,
    topicId: "chapter-4",
    questionText: "100 J কাজ 5 s-এ করলে ক্ষমতা কত?",
    options: [
      { letter: "A", text: "20 W" },
      { letter: "B", text: "500 W" },
      { letter: "C", text: "0.05 W" },
      { letter: "D", text: "105 W" }
    ],
    correctLetter: "A",
    explanation: "ক্ষমতা P = W/t = 100/5 = 20 W।",
    difficulty: "medium",
    sourceNote: "NCTB পদার্থবিজ্ঞান — অধ্যায় ৪: কাজ, ক্ষমতা ও শক্তি",
  },
  {
    id: "ACAD-5077",
    classId: "class-9",
    subjectId: "physics",
    chapterId: "acad-class-9-phy-chapter-5",
    chapterName: "অধ্যায় ৫: পদার্থের অবস্থা ও চাপ",
    unitNumber: 5,
    topicId: "chapter-5",
    questionText: "1 Pa সমান কত?",
    options: [
      { letter: "A", text: "1 N·m" },
      { letter: "B", text: "1 W" },
      { letter: "C", text: "1 J" },
      { letter: "D", text: "1 N/m²" }
    ],
    correctLetter: "D",
    explanation: "চাপ = বল/ক্ষেত্রফল; 1 Pa = 1 N/m²।",
    difficulty: "medium",
    sourceNote: "NCTB পদার্থবিজ্ঞান — অধ্যায় ৫: পদার্থের অবস্থা ও চাপ",
  },
  {
    id: "ACAD-5078",
    classId: "class-9",
    subjectId: "physics",
    chapterId: "acad-class-9-phy-chapter-6",
    chapterName: "অধ্যায় ৬: বস্তুর ওপর তাপের প্রভাব",
    unitNumber: 6,
    topicId: "chapter-6",
    questionText: "একই ভরের পানি ও লোহাকে সমান তাপ দিলে কোনটির তাপমাত্রা বেশি বাড়ে?",
    options: [
      { letter: "A", text: "কোনোটিই নয়" },
      { letter: "B", text: "লোহা" },
      { letter: "C", text: "সমান বাড়ে" },
      { letter: "D", text: "পানি" }
    ],
    correctLetter: "B",
    explanation: "লোহার আপেক্ষিক তাপ পানির চেয়ে অনেক কম, তাই সমান তাপে লোহার তাপমাত্রা বেশি বাড়ে।",
    difficulty: "medium",
    sourceNote: "NCTB পদার্থবিজ্ঞান — অধ্যায় ৬: বস্তুর ওপর তাপের প্রভাব",
  },
  {
    id: "ACAD-5079",
    classId: "class-9",
    subjectId: "physics",
    chapterId: "acad-class-9-phy-chapter-7",
    chapterName: "অধ্যায় ৭: তরঙ্গ ও শব্দ",
    unitNumber: 7,
    topicId: "chapter-7",
    questionText: "শব্দের কম্পাঙ্কের একক কী?",
    options: [
      { letter: "A", text: "মিটার" },
      { letter: "B", text: "সেকেন্ড" },
      { letter: "C", text: "হার্জ" },
      { letter: "D", text: "ডেসিবেল" }
    ],
    correctLetter: "C",
    explanation: "কম্পাঙ্কের একক হার্জ (Hz); তীব্রতার একক ডেসিবেল।",
    difficulty: "medium",
    sourceNote: "NCTB পদার্থবিজ্ঞান — অধ্যায় ৭: তরঙ্গ ও শব্দ",
  },
  {
    id: "ACAD-5080",
    classId: "class-9",
    subjectId: "physics",
    chapterId: "acad-class-9-phy-chapter-9",
    chapterName: "অধ্যায় ৯: আলোর প্রতিসরণ",
    unitNumber: 9,
    topicId: "chapter-9",
    questionText: "শূন্য মাধ্যমে আলোর বেগ কত?",
    options: [
      { letter: "A", text: "3 × 10⁶ m/s" },
      { letter: "B", text: "3 × 10⁸ m/s" },
      { letter: "C", text: "340 m/s" },
      { letter: "D", text: "1.5 × 10⁸ m/s" }
    ],
    correctLetter: "B",
    explanation: "শূন্য মাধ্যমে আলোর বেগ প্রায় 3 × 10⁸ m/s।",
    difficulty: "medium",
    sourceNote: "NCTB পদার্থবিজ্ঞান — অধ্যায় ৯: আলোর প্রতিসরণ",
  },
  {
    id: "ACAD-5081",
    classId: "class-9",
    subjectId: "physics",
    chapterId: "acad-class-9-phy-chapter-9",
    chapterName: "অধ্যায় ৯: আলোর প্রতিসরণ",
    unitNumber: 9,
    topicId: "chapter-9",
    questionText: "উত্তল লেন্সের ফোকাস দূরত্ব 20 cm হলে ক্ষমতা কত?",
    options: [
      { letter: "A", text: "−5 D" },
      { letter: "B", text: "+20 D" },
      { letter: "C", text: "+0.05 D" },
      { letter: "D", text: "+5 D" }
    ],
    correctLetter: "D",
    explanation: "P = 1/f(m) = 1/0.2 = +5 D।",
    difficulty: "medium",
    sourceNote: "NCTB পদার্থবিজ্ঞান — অধ্যায় ৯: আলোর প্রতিসরণ",
  },
  {
    id: "ACAD-5082",
    classId: "class-9",
    subjectId: "physics",
    chapterId: "acad-class-9-phy-chapter-11",
    chapterName: "অধ্যায় ১১: চল তড়িৎ",
    unitNumber: 11,
    topicId: "chapter-11",
    questionText: "10 Ω রোধে 2 A প্রবাহে বিভব পার্থক্য কত?",
    options: [
      { letter: "A", text: "20 V" },
      { letter: "B", text: "12 V" },
      { letter: "C", text: "8 V" },
      { letter: "D", text: "5 V" }
    ],
    correctLetter: "A",
    explanation: "V = IR = 2 × 10 = 20 V।",
    difficulty: "medium",
    sourceNote: "NCTB পদার্থবিজ্ঞান — অধ্যায় ১১: চল তড়িৎ",
  },
  {
    id: "ACAD-5083",
    classId: "class-9",
    subjectId: "physics",
    chapterId: "acad-class-9-phy-chapter-11",
    chapterName: "অধ্যায় ১১: চল তড়িৎ",
    unitNumber: 11,
    topicId: "chapter-11",
    questionText: "দুটি 10 Ω রোধ শ্রেণিতে যুক্ত করলে তুল্য রোধ কত?",
    options: [
      { letter: "A", text: "5 Ω" },
      { letter: "B", text: "10 Ω" },
      { letter: "C", text: "20 Ω" },
      { letter: "D", text: "100 Ω" }
    ],
    correctLetter: "C",
    explanation: "শ্রেণিতে R = R₁ + R₂ = 20 Ω; সমান্তরালে 5 Ω হতো।",
    difficulty: "medium",
    sourceNote: "NCTB পদার্থবিজ্ঞান — অধ্যায় ১১: চল তড়িৎ",
  },
  {
    id: "ACAD-5084",
    classId: "class-9",
    subjectId: "physics",
    chapterId: "acad-class-9-phy-chapter-12",
    chapterName: "অধ্যায় ১২: তড়িতের চৌম্বক ক্রিয়া",
    unitNumber: 12,
    topicId: "chapter-12",
    questionText: "চুম্বকের সমমেরু পরস্পরকে —",
    options: [
      { letter: "A", text: "আকর্ষণ করে" },
      { letter: "B", text: "ভেঙে ফেলে" },
      { letter: "C", text: "বিকর্ষণ করে" },
      { letter: "D", text: "স্পর্শ করে না" }
    ],
    correctLetter: "C",
    explanation: "সমমেরু বিকর্ষণ করে, বিপরীত মেরু আকর্ষণ করে।",
    difficulty: "easy",
    sourceNote: "NCTB পদার্থবিজ্ঞান — অধ্যায় ১২: তড়িতের চৌম্বক ক্রিয়া",
  },
];
