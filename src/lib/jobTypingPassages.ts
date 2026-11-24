/**
 * Eduvelto Job Preparation — typing simulator passages
 * (design-grades-written-previous-admin.md §1.8).
 *
 * ORIGINAL practice sentences only — written for this simulator,
 * never copied from a real exam paper and never presented as one.
 * A passage taken from a real exam paper would need its source and
 * a "from the paper" label; release 1 has none.
 *
 * Two passage sets per language (R-2 / E-5): one engine, separate
 * passage sets + layout per language. The simulator states which
 * keyboard layout it uses (Bijoy / Avro for Bangla) and lets the
 * student switch; a layout the authority does not use is never
 * presented as the official one.
 */

export type TypingLanguage = 'bn' | 'en';
export type BanglaLayout = 'avro' | 'bijoy';

export interface TypingPassage {
  id: string;
  lang: TypingLanguage;
  level: 1 | 2 | 3;
  titleBn: string;
  titleEn: string;
  text: string;
}

export const TYPING_LAYOUTS: Record<TypingLanguage, string[]> = {
  bn: ['avro', 'bijoy'],
  en: ['qwerty'],
};

/** Bangla passages — original sentences, progressive difficulty. */
export const TYPING_PASSAGES_BN: TypingPassage[] = [
  {
    id: 'bn-l1-01',
    lang: 'bn',
    level: 1,
    titleBn: 'সহজ বাক্য',
    titleEn: 'Easy sentences',
    text: 'আমি প্রতিদিন সকালে পড়তে বসি। বই আমার সবচেয়ে ভালো বন্ধু। সময়ের কাজ সময়ে করলে মন শান্ত থাকে।',
  },
  {
    id: 'bn-l1-02',
    lang: 'bn',
    level: 1,
    titleBn: 'সহজ বাক্য',
    titleEn: 'Easy sentences',
    text: 'সকালের আলো ঘরে ঢুকতেই আমি ঘুম থেকে উঠি। তারপর হাতমুখ ধুয়ে নাশতা করি। দিনের কাজের তালিকা আগে থেকে বানিয়ে রাখি।',
  },
  {
    id: 'bn-l2-01',
    lang: 'bn',
    level: 2,
    titleBn: 'মাঝারি বাক্য',
    titleEn: 'Medium sentences',
    text: 'নিয়মিত অনুশীলন ছাড়া কোনো দক্ষতাই গড়ে ওঠে না। প্রতিদিন একটু একটু করে এগোলে মাসের শেষে বড় পরিবর্তন চোখে পড়ে। ভুল হলে থেমে যাওয়া নয়, ভুল থেকে শেখাই আসল কাজ।',
  },
  {
    id: 'bn-l2-02',
    lang: 'bn',
    level: 2,
    titleBn: 'মাঝারি বাক্য',
    titleEn: 'Medium sentences',
    text: 'অফিসের কাজে নির্ভুল টাইপিং খুব দরকারি। চিঠি, বিজ্ঞপ্তি আর হিসাবের খাতা — সব জায়গাতেই পরিষ্কার লেখা চাই। ধীরে নির্ভুল লেখা শিখলে পরে গতি নিজে থেকেই বাড়ে।',
  },
  {
    id: 'bn-l3-01',
    lang: 'bn',
    level: 3,
    titleBn: 'কঠিন বাক্য',
    titleEn: 'Harder sentences',
    text: 'সরকারি দপ্তরের চিঠিপত্রে ভাষা হয় সংক্ষিপ্ত, স্পষ্ট ও মার্জিত। প্রতিটি বাক্যে যেন অর্থের কোনো দ্বিধা না থাকে, সেদিকে খেয়াল রাখতে হয়। ভালো মুদ্রাক্ষরিক শুধু দ্রুত লেখেন না, তিনি লেখার নির্ভুলতা আর সাজানোর দিকেও সমান যত্ন নেন।',
  },
  {
    id: 'bn-l3-02',
    lang: 'bn',
    level: 3,
    titleBn: 'কঠিন বাক্য',
    titleEn: 'Harder sentences',
    text: 'পরীক্ষার হলে সময়ের হিসাব মাথায় রেখে লিখতে হয়। প্রথমে সহজ অংশ শেষ করে কঠিন অংশে যাওয়া ভালো। উত্তরপত্রে কাটাকাটি কম হলে খাতা দেখতে পরিষ্কার লাগে, আর পরীক্ষকও সহজে নম্বর দিতে পারেন।',
  },
];

/** English passages — original sentences, progressive difficulty. */
export const TYPING_PASSAGES_EN: TypingPassage[] = [
  {
    id: 'en-l1-01',
    lang: 'en',
    level: 1,
    titleBn: 'সহজ বাক্য',
    titleEn: 'Easy sentences',
    text: 'I read every morning before work. Books are my best friends. If I finish on time, my mind stays calm.',
  },
  {
    id: 'en-l1-02',
    lang: 'en',
    level: 1,
    titleBn: 'সহজ বাক্য',
    titleEn: 'Easy sentences',
    text: 'The sun rises and I wake up early. I wash my face and eat breakfast. Then I make a list of the work for the day.',
  },
  {
    id: 'en-l2-01',
    lang: 'en',
    level: 2,
    titleBn: 'মাঝারি বাক্য',
    titleEn: 'Medium sentences',
    text: 'No skill grows without regular practice. A little progress every day becomes a big change by the end of the month. A mistake is not a reason to stop; learning from the mistake is the real work.',
  },
  {
    id: 'en-l2-02',
    lang: 'en',
    level: 2,
    titleBn: 'মাঝারি বাক্য',
    titleEn: 'Medium sentences',
    text: 'Accurate typing matters a lot in office work. Letters, notices and account books all need clear writing. If you learn to type slowly and correctly first, speed will follow on its own.',
  },
  {
    id: 'en-l3-01',
    lang: 'en',
    level: 3,
    titleBn: 'কঠিন বাক্য',
    titleEn: 'Harder sentences',
    text: 'Official letters use short, clear and polite language. Every sentence must leave no doubt about its meaning. A good typist does not only type fast; she also cares about accuracy and neat layout.',
  },
  {
    id: 'en-l3-02',
    lang: 'en',
    level: 3,
    titleBn: 'কঠিন বাক্য',
    titleEn: 'Harder sentences',
    text: 'In the exam hall you must keep an eye on the time. It is wise to finish the easy parts first and then move to the hard ones. A clean answer sheet is easy to read, and the examiner can mark it without trouble.',
  },
];

export function typingPassagesFor(lang: TypingLanguage, level?: 1 | 2 | 3): TypingPassage[] {
  const all = lang === 'bn' ? TYPING_PASSAGES_BN : TYPING_PASSAGES_EN;
  return level === undefined ? all : all.filter((p) => p.level === level);
}

export function typingPassageById(id: string): TypingPassage | undefined {
  return [...TYPING_PASSAGES_BN, ...TYPING_PASSAGES_EN].find((p) => p.id === id);
}

/* ------------------------------------------------------------------ */
/* Scoring — pure functions (tested, no Firestore here)                */
/* ------------------------------------------------------------------ */

export interface TypingScore {
  /** Words per minute: correct chars / 5 / minutes. */
  wpm: number;
  /** Correct chars / typed chars × 100. */
  accuracy: number;
  errors: number;
  correctChars: number;
  typedChars: number;
}

export function scoreTyping(args: {
  passageText: string;
  typedText: string;
  elapsedSeconds: number;
}): TypingScore {
  const { passageText, typedText, elapsedSeconds } = args;
  const typedChars = typedText.length;
  let correctChars = 0;
  let errors = 0;
  for (let i = 0; i < typedChars; i++) {
    if (typedText[i] === passageText[i]) correctChars++;
    else errors++;
  }
  const minutes = Math.max(elapsedSeconds, 1) / 60;
  const wpm = Math.round((correctChars / 5 / minutes) * 10) / 10;
  const accuracy =
    typedChars === 0 ? 100 : Math.round((correctChars / typedChars) * 1000) / 10;
  return { wpm, accuracy, errors, correctChars, typedChars };
}

/** Milestone worth storing (best WPM per language per week, §1.8):
 * keystrokes / timer updates are NEVER written to Firestore — only
 * a milestone like this, and only when the dashboard needs it. */
export interface TypingMilestone {
  lang: TypingLanguage;
  passageId: string;
  wpm: number;
  accuracy: number;
  weekKey: string;
}

export function weekKeyFor(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = (d.getUTCDay() + 6) % 7; // Monday = 0
  d.setUTCDate(d.getUTCDate() - day);
  return d.toISOString().slice(0, 10);
}

export function typingMilestoneFor(args: {
  lang: TypingLanguage;
  passageId: string;
  score: TypingScore;
  at?: Date;
}): TypingMilestone {
  return {
    lang: args.lang,
    passageId: args.passageId,
    wpm: args.score.wpm,
    accuracy: args.score.accuracy,
    weekKey: weekKeyFor(args.at ?? new Date()),
  };
}

export const TYPING_SIMULATOR_NOTICE = {
  bn: 'টাইপিং অনুশীলন — কর্তৃপক্ষের ব্যবহারিক পরীক্ষার হুবহু নকল নয়',
  en: 'Typing practice — not an exact replica of the authority’s practical test',
} as const;
