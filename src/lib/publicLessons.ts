// Eduvelto — AdSense Part 1 (public content, F1 fix): sample lessons,
// visible to Googlebot WITHOUT login.
//
// Static data ONLY — zero Firestore reads. The prose is ORIGINAL,
// written in the site's own words for this page. It is NOT copied from
// any textbook, guide or question bank, and it contains no library
// book text. Each lesson is labelled on the page as an AI-drafted
// draft awaiting teacher review — never "verified" or "approved".
//
// Word counts (publicLessonWordCount, all prose fields): tense 537,
// preposition 475 — inside the required 400–700 range, asserted in
// src/lib/__tests__/publicBcsEnglish.test.ts.

export interface PublicLessonExample {
  en: string;
  bn: string;
}

export interface PublicLessonSection {
  headingBn: string;
  headingEn: string;
  bodyBn: string[];
  examples?: PublicLessonExample[];
}

export interface PublicLesson {
  slug: 'tense' | 'preposition';
  path: string;
  titleBn: string;
  titleEn: string;
  introBn: string[];
  sections: PublicLessonSection[];
  mistakesBn: string[];
}

export const PUBLIC_LESSONS: PublicLesson[] = [
  {
    slug: 'tense',
    path: '/learn/bcs-english-tense',
    titleBn: 'Tense — কাল',
    titleEn: 'Tense',
    introBn: [
      'ইংরেজি বাক্যে Tense বা কাল বলে দেয় কাজটি কখন হয়েছে — অতীতে, বর্তমানে, নাকি ভবিষ্যতে। একই ক্রিয়া সময় বদলালে রূপ বদলায়: go, went, will go — তিনটি রূপ, তিনটি সময়। বিসিএস প্রিলিমিনারি ইংরেজিতে Tense থেকে নিয়মিত প্রশ্ন আসে, কারণ এই একটি বিষয় দিয়েই বোঝা যায় পরীক্ষার্থী বাক্যের সময় ঠিকমতো ধরতে পারেন কিনা।',
      'এই পাঠে Tense-এর মূল ধারণা সহজভাবে দেখানো হয়েছে — কঠিন সংজ্ঞা মুখস্থ না করে, উদাহরণ দেখে নিয়মটি বোঝার চেষ্টা করুন। প্রতিটি নিয়মের সঙ্গে দেওয়া উদাহরণগুলো নিজে মুখে বলে অনুশীলন করলে নিয়ম মনে থাকবে বেশি।',
    ],
    sections: [
      {
        headingBn: 'Present Simple — অভ্যাস আর চিরন্তন সত্য',
        headingEn: 'Present Simple — habits and universal truths',
        bodyBn: [
          'যা নিয়মিত ঘটে বা চিরকাল সত্য, তার জন্য Present Simple। He goes to school every day — প্রতিদিনের অভ্যাস। The sun rises in the east — চিরন্তন সত্য। এই tense-এ he, she, it-এর সঙ্গে মূল verb-এর শেষে -s বা -es যোগ হয়: go → goes, watch → watches। I, you, we, they-এর সঙ্গে verb-এর মূল রূপই থাকে।',
        ],
        examples: [
          { en: 'He goes to school every day.', bn: 'সে প্রতিদিন স্কুলে যায়।' },
          { en: 'She watches TV in the evening.', bn: 'সে সন্ধ্যায় টিভি দেখে।' },
          { en: 'They play football on Friday.', bn: 'তারা শুক্রবার ফুটবল খেলে।' },
        ],
      },
      {
        headingBn: 'Present Continuous ও Present Perfect Continuous',
        headingEn: 'Present Continuous and Present Perfect Continuous',
        bodyBn: [
          'এই মুহূর্তে যা চলছে, তার জন্য Present Continuous — am/is/are + verb-ing। She is reading a book now — সে এখন বই পড়ছে।',
          'আর যা অতীতের কোনো সময় থেকে শুরু হয়ে এখনো চলছে, তার জন্য Present Perfect Continuous — has/have been + verb-ing। She has been living in Dhaka since 2015 — ২০১৫ সাল থেকে এখন পর্যন্ত ঢাকায় থাকছে। since-এর সঙ্গে শুরুর সময়, for-এর সঙ্গে সময়ের পরিমাণ বসে: since 2015, for ten years।',
        ],
        examples: [
          { en: 'I am writing a letter now.', bn: 'আমি এখন চিঠি লিখছি।' },
          { en: 'They have been playing since morning.', bn: 'তারা সকাল থেকে খেলছে।' },
        ],
      },
      {
        headingBn: 'Past Simple ও Past Perfect',
        headingEn: 'Past Simple and Past Perfect',
        bodyBn: [
          'অতীতে শেষ হয়ে যাওয়া কাজের জন্য Past Simple — verb-এর past form। He went home yesterday। অতীতে দুটি কাজ ঘটলে যেটি আগে শেষ হয়েছে, সেটি Past Perfect — had + past participle। The train had left before we reached the station — আমরা পৌঁছানোর আগেই ট্রেন ছেড়ে গিয়েছিল।',
        ],
        examples: [
          { en: 'He went home yesterday.', bn: 'সে গতকাল বাড়ি গিয়েছিল।' },
          { en: 'The train had left before we reached the station.', bn: 'আমরা স্টেশনে পৌঁছানোর আগেই ট্রেন ছেড়ে গিয়েছিল।' },
        ],
      },
      {
        headingBn: 'Future — will, going to, Future Perfect',
        headingEn: 'Future — will, going to, Future Perfect',
        bodyBn: [
          'ভবিষ্যতের সাধারণ কথা বলতে will + verb। I will help you — আমি তোমাকে সাহায্য করব। আগে থেকে ঠিক করা পরিকল্পনার ক্ষেত্রে be going to-ও চলে: We are going to visit Cox’s Bazar tomorrow।',
          'ভবিষ্যতের কোনো সময়ের আগেই একটি কাজ শেষ হয়ে যাবে — এমন অর্থে Future Perfect, will have + past participle। By the time you arrive, I will have finished my homework — তুমি আসার আগেই আমার হোমওয়ার্ক শেষ হয়ে যাবে। ‘By the time’ দেখলেই বুঝবেন, একটি কাজ আরেকটির আগেই শেষ হচ্ছে।',
        ],
        examples: [
          { en: 'I will help you.', bn: 'আমি তোমাকে সাহায্য করব।' },
          { en: 'By the time you arrive, I will have finished my homework.', bn: 'তুমি আসার আগেই আমার হোমওয়ার্ক শেষ হয়ে যাবে।' },
        ],
      },
    ],
    mistakesBn: [
      'He go to school — ভুল। He-এর সঙ্গে goes লিখতে হয়।',
      'She is living here since 2015 — ভুল। since থাকলে has been living লিখতে হয়।',
      'By the time you arrive, I will finish — ভুল। কাজটি আগেই শেষ হবে, তাই will have finished।',
      'I am knowing the answer — ভুল। know-এর মতো কিছু verb-এর continuous রূপ হয় না; I know the answer লিখুন।',
    ],
  },
  {
    slug: 'preposition',
    path: '/learn/bcs-english-preposition',
    titleBn: 'Preposition',
    titleEn: 'Preposition',
    introBn: [
      'Preposition হলো ছোট ছোট শব্দ — in, on, at, of, for, by, with — যেগুলো বাক্যের দুটি অংশের মধ্যে সম্পর্ক দেখায়: কোথায়, কখন, কীভাবে। শব্দগুলো ছোট হলেও ভুল preposition পুরো বাক্যের অর্থ বদলে দিতে পারে: good in mathematics নয়, good at mathematics।',
      'Preposition-এর সব নিয়ম একটানা মুখস্থ করা যায় না। অনেক ক্ষেত্রে নির্দিষ্ট শব্দের সঙ্গে নির্দিষ্ট preposition বসে — সেগুলো জোড়া হিসেবে শিখতে হয়। এই পাঠে সময়, স্থান আর সবচেয়ে কাজের জোড়াগুলো একসঙ্গে দেখানো হয়েছে।',
    ],
    sections: [
      {
        headingBn: 'সময় — in, on, at',
        headingEn: 'Time — in, on, at',
        bodyBn: [
          'বড় সময়ের জন্য in, দিন ও তারিখের জন্য on, নির্দিষ্ট ঘড়ির সময়ের জন্য at। in the morning, in 2015, in winter — on Monday, on 25 December — at 5 o’clock, at noon, at night। একটি সহজ উপায়: সময় যত নির্দিষ্ট, preposition তত ছোট — in (মাস/বছর) → on (দিন) → at (ঘণ্টা)।',
        ],
        examples: [
          { en: 'The exam starts at 10 o’clock.', bn: 'পরীক্ষা সকাল ১০টায় শুরু হবে।' },
          { en: 'I was born in 2002.', bn: 'আমি ২০০২ সালে জন্মেছি।' },
          { en: 'We met on Friday.', bn: 'আমাদের দেখা হয়েছিল শুক্রবার।' },
        ],
      },
      {
        headingBn: 'স্থান — in, on, at',
        headingEn: 'Place — in, on, at',
        bodyBn: [
          'বড় জায়গার জন্য in, তলের ওপর কিছু থাকলে on, নির্দিষ্ট ঠিকানার জন্য at। in Dhaka, in Bangladesh — on the table, on the wall — at home, at school, at the station। He is at school মানে সে স্কুলে আছে; He is in school মানে সে স্কুলের ভেতরে আছে — দুটির অর্থ কাছাকাছি হলেও ব্যবহারের সূক্ষ্ম পার্থক্য আছে।',
        ],
        examples: [
          { en: 'The book is on the table.', bn: 'বইটি টেবিলের ওপরে আছে।' },
          { en: 'She lives in Chattogram.', bn: 'সে চট্টগ্রামে থাকে।' },
          { en: 'Meet me at the station.', bn: 'স্টেশনে আমার সঙ্গে দেখা করো।' },
        ],
      },
      {
        headingBn: 'মুখস্থ করার মতো জোড়া',
        headingEn: 'Fixed pairs to memorise',
        bodyBn: [
          'কিছু শব্দের সঙ্গে সবসময় একই preposition বসে — এগুলো জোড়া হিসেবে মনে রাখুন: good at (কোনো বিষয়ে ভালো), interested in, afraid of, died of (রোগে মারা যাওয়া), depend on, listen to, look at। He died of cholera — রোগে মারা যাওয়া বোঝাতে of বসে, from নয়।',
        ],
        examples: [
          { en: 'She is good at mathematics.', bn: 'সে গণিতে ভালো।' },
          { en: 'He died of cholera in 1998.', bn: 'সে ১৯৯৮ সালে কলেরায় মারা গিয়েছিল।' },
          { en: 'I am interested in history.', bn: 'আমার ইতিহাসে আগ্রহ আছে।' },
        ],
      },
      {
        headingBn: 'on time বনাম in time',
        headingEn: 'on time vs in time',
        bodyBn: [
          '‘On time’ মানে ঠিক সময়ে — The train arrived on time। ‘In time’ মানে সময়ের মধ্যে, দেরি না করে — We reached the station in time to catch the train। দুটির পার্থক্য ছোট, কিন্তু পরীক্ষায় এই জোড়া থেকে প্রশ্ন আসে। আরেকটি জোড়া: arrive at (ছোট জায়গা) আর arrive in (বড় জায়গা) — arrive at the station, arrive in Dhaka।',
        ],
        examples: [
          { en: 'The train arrived on time, but the bus was late.', bn: 'ট্রেন ঠিক সময়ে পৌঁছেছিল, কিন্তু বাস দেরি করেছিল।' },
          { en: 'We arrived in Dhaka in the morning.', bn: 'আমরা সকালে ঢাকায় পৌঁছেছিলাম।' },
        ],
      },
    ],
    mistakesBn: [
      'She is good in mathematics — ভুল। good-এর পর at বসে।',
      'He died from cholera — ভুল। রোগে মারা যাওয়া বোঝাতে died of।',
      'I will meet you in 5 o’clock — ভুল। ঘড়ির সময়ের আগে at বসে।',
      'The book is in the table — ভুল। টেবিলের ওপরে কিছু থাকলে on the table।',
    ],
  },
];

export function publicLessonBySlug(
  slug: string | undefined,
): PublicLesson | undefined {
  return PUBLIC_LESSONS.find((l) => l.slug === slug);
}

/** Word count of all prose in a lesson (intro + sections + examples + mistakes). */
export function publicLessonWordCount(lesson: PublicLesson): number {
  const parts: string[] = [...lesson.introBn, ...lesson.mistakesBn];
  for (const s of lesson.sections) {
    parts.push(s.headingBn, ...s.bodyBn);
    for (const e of s.examples ?? []) parts.push(e.en, e.bn);
  }
  return parts.join(' ').split(/\s+/).filter(Boolean).length;
}
