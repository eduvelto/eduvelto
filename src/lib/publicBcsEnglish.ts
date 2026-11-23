// Eduvelto — AdSense Part 1 (public content, F1 fix): BCS English
// practice questions, visible to Googlebot WITHOUT login.
//
// Static data ONLY — zero Firestore reads. The 35 questions are the
// owner-verified BCS English Batch 1, published 22 Nov 2026
// (import audit: bcs-english-batch1-import-audit-2026-11-22.json,
// read-back 35/35 ok). Question text, options and correct letters
// are VERBATIM from the published batch. The single difference
// from the draft is the audit's own fix to bcs-eng-001's
// explanation ("he third person singular" -> "He হলো third person
// singular"). No other change was made.
//
// The 3 reading questions (bcs-eng-033..035) need the short passage
// below to be answerable; the passage is the batch's own original
// draft text (bcs-eng-passage-01), included verbatim.
//
// NEVER source questions from the paid Gumroad 500-question product
// (~/workspace/freelancing/income-system/p3-bcs-english-question-bank*).

export type PublicBcsTopic =
  | 'antonym'
  | 'articles'
  | 'conditionals'
  | 'idiom'
  | 'narration'
  | 'one-word-substitution'
  | 'preposition'
  | 'reading'
  | 'right-form-of-verbs'
  | 'spelling'
  | 'synonym'
  | 'tense'
  | 'voice';

export type PublicBcsCategory = 'grammar' | 'vocabulary' | 'reading';

export interface PublicBcsQuestion {
  id: string;
  topic: PublicBcsTopic;
  questionText: string;
  options: Array<{ letter: 'A' | 'B' | 'C' | 'D'; text: string }>;
  correctLetter: 'A' | 'B' | 'C' | 'D';
  explanation: string;
}

/** The 13 topics in this batch, with their question counts. */
export const PUBLIC_BCS_TOPICS: Array<{
  topic: PublicBcsTopic;
  nameBn: string;
  nameEn: string;
  count: number;
  category: PublicBcsCategory;
}> = [
  { topic: 'tense', nameBn: "Tense — কাল", nameEn: "Tense", count: 3, category: 'grammar' },
  { topic: 'voice', nameBn: "Voice — বাচ্য", nameEn: "Voice", count: 3, category: 'grammar' },
  { topic: 'narration', nameBn: "Narration — উক্তি", nameEn: "Narration", count: 3, category: 'grammar' },
  { topic: 'preposition', nameBn: "Preposition", nameEn: "Preposition", count: 3, category: 'grammar' },
  { topic: 'right-form-of-verbs', nameBn: "Right Form of Verbs — ক্রিয়ার সঠিক রূপ", nameEn: "Right Form of Verbs", count: 3, category: 'grammar' },
  { topic: 'conditionals', nameBn: "Conditionals — শর্তমূলক বাক্য", nameEn: "Conditionals", count: 3, category: 'grammar' },
  { topic: 'articles', nameBn: "Articles", nameEn: "Articles", count: 2, category: 'grammar' },
  { topic: 'synonym', nameBn: "Synonym — সমার্থক শব্দ", nameEn: "Synonym", count: 3, category: 'vocabulary' },
  { topic: 'antonym', nameBn: "Antonym — বিপরীতার্থক শব্দ", nameEn: "Antonym", count: 2, category: 'vocabulary' },
  { topic: 'spelling', nameBn: "Spelling — বানান", nameEn: "Spelling", count: 2, category: 'vocabulary' },
  { topic: 'idiom', nameBn: "Idiom — বাগধারা", nameEn: "Idiom", count: 3, category: 'vocabulary' },
  { topic: 'one-word-substitution', nameBn: "One Word Substitution — এক শব্দে প্রকাশ", nameEn: "One Word Substitution", count: 2, category: 'vocabulary' },
  { topic: 'reading', nameBn: "Reading Comprehension — পাঠ বোঝা", nameEn: "Reading Comprehension", count: 3, category: 'reading' },
];

/** Category labels (Bangla-first). */
export const PUBLIC_BCS_CATEGORIES: Array<{
  category: PublicBcsCategory;
  nameBn: string;
  nameEn: string;
  introBn: string;
  introEn: string;
}> = [
  {
    category: 'grammar',
    nameBn: 'ব্যাকরণ (Grammar)',
    nameEn: 'Grammar',
    introBn: 'ব্যাকরণের ২০টি প্রশ্ন — Tense, Voice, Narration, Preposition, Right Form of Verbs, Conditionals ও Articles। প্রতিটি প্রশ্নের সঠিক উত্তর ও ব্যাখ্যা নিচে দেওয়া আছে।',
    introEn: '20 grammar questions — Tense, Voice, Narration, Preposition, Right Form of Verbs, Conditionals and Articles. Each question shows its correct answer and explanation below.',
  },
  {
    category: 'vocabulary',
    nameBn: 'শব্দভাণ্ডার (Vocabulary)',
    nameEn: 'Vocabulary',
    introBn: 'শব্দভাণ্ডারের ১২টি প্রশ্ন — Synonym, Antonym, Spelling, Idiom ও One Word Substitution। প্রতিটি প্রশ্নের সঠিক উত্তর ও ব্যাখ্যা নিচে দেওয়া আছে।',
    introEn: '12 vocabulary questions — Synonym, Antonym, Spelling, Idiom and One Word Substitution. Each question shows its correct answer and explanation below.',
  },
  {
    category: 'reading',
    nameBn: 'পাঠ বোঝা (Reading)',
    nameEn: 'Reading',
    introBn: 'ছোট একটি অনুচ্ছেদ পড়ে ৩টি প্রশ্নের উত্তর — নিচে অনুচ্ছেদটি দেওয়া আছে, তারপর প্রশ্নগুলো। প্রতিটি প্রশ্নের সঠিক উত্তর ও ব্যাখ্যা নিচে দেওয়া আছে।',
    introEn: '3 questions on a short passage — the passage is printed below, followed by the questions. Each question shows its correct answer and explanation below.',
  },
];

/** The passage the 3 reading questions are based on (verbatim). */
export const PUBLIC_BCS_READING_PASSAGE = {
  id: "bcs-eng-passage-01",
  text: "Rahim is a school teacher in a small village. Every morning he walks two kilometres to reach his school. His students love him because he explains every lesson with simple examples. He believes that education can change the life of a poor child. In the evening, he teaches the village children for free.",
  usedBy: ['bcs-eng-033', 'bcs-eng-034', 'bcs-eng-035'],
} as const;

/** All 35 questions, in batch order. */
export const PUBLIC_BCS_ENGLISH_QUESTIONS: PublicBcsQuestion[] = [
  {
    id: "bcs-eng-001",
    topic: 'tense',
    questionText: "Choose the correct sentence.",
    options: [
      { letter: 'A', text: "He go to school every day." },
      { letter: 'B', text: "He going to school every day." },
      { letter: 'C', text: "He goes to school every day." },
      { letter: 'D', text: "He gone to school every day." },
    ],
    correctLetter: 'C',
    explanation: "He হলো third person singular, তাই present simple-এ verb-এর শেষে -s/-es বসে — goes সঠিক।",
  },
  {
    id: "bcs-eng-002",
    topic: 'tense',
    questionText: "By the time you arrive, I ___ my homework.",
    options: [
      { letter: 'A', text: "will have finished" },
      { letter: 'B', text: "will finish" },
      { letter: 'C', text: "finish" },
      { letter: 'D', text: "have finished" },
    ],
    correctLetter: 'A',
    explanation: "'By the time you arrive' — ভবিষ্যতের একটা সময়ের আগেই কাজ শেষ হয়ে যাবে, তাই future perfect (will have + past participle) হয়।",
  },
  {
    id: "bcs-eng-003",
    topic: 'tense',
    questionText: "She ___ in Dhaka since 2015.",
    options: [
      { letter: 'A', text: "lives" },
      { letter: 'B', text: "is living" },
      { letter: 'C', text: "lived" },
      { letter: 'D', text: "has been living" },
    ],
    correctLetter: 'D',
    explanation: "'since 2015' — অতীত থেকে এখন পর্যন্ত চলছে, তাই present perfect continuous (has/have been + verb-ing) হয়।",
  },
  {
    id: "bcs-eng-004",
    topic: 'voice',
    questionText: "Choose the passive form of the sentence: 'The cat chased the mouse.'",
    options: [
      { letter: 'A', text: "The mouse was chased by the cat." },
      { letter: 'B', text: "The mouse chased the cat." },
      { letter: 'C', text: "The mouse is chasing the cat." },
      { letter: 'D', text: "The cat was chased by the mouse." },
    ],
    correctLetter: 'A',
    explanation: "Past simple-এর passive হয় was/were + past participle — the mouse was chased by the cat।",
  },
  {
    id: "bcs-eng-005",
    topic: 'voice',
    questionText: "Choose the passive form of the sentence: 'Someone stole my bicycle yesterday.'",
    options: [
      { letter: 'A', text: "My bicycle is stolen yesterday." },
      { letter: 'B', text: "My bicycle was stolen yesterday." },
      { letter: 'C', text: "My bicycle has stolen yesterday." },
      { letter: 'D', text: "My bicycle had been stole yesterday." },
    ],
    correctLetter: 'B',
    explanation: "Past simple passive — was stolen। 'Someone' কে করেছে তা জানা না থাকলে passive-এ কর্তা বাদ যায়।",
  },
  {
    id: "bcs-eng-006",
    topic: 'voice',
    questionText: "Choose the passive form of the sentence: 'They are building a new bridge over the river.'",
    options: [
      { letter: 'A', text: "A new bridge is built over the river." },
      { letter: 'B', text: "A new bridge was being built over the river." },
      { letter: 'C', text: "A new bridge is being built over the river." },
      { letter: 'D', text: "A new bridge has been built over the river." },
    ],
    correctLetter: 'C',
    explanation: "Present continuous passive হয় is/am/are + being + past participle — is being built।",
  },
  {
    id: "bcs-eng-007",
    topic: 'narration',
    questionText: "Choose the correct indirect speech: He said, 'I am busy today.'",
    options: [
      { letter: 'A', text: "He said that he was busy that day." },
      { letter: 'B', text: "He said that he is busy today." },
      { letter: 'C', text: "He said that he had been busy today." },
      { letter: 'D', text: "He said that I was busy that day." },
    ],
    correctLetter: 'A',
    explanation: "Reporting verb past tense হলে reported speech-এর present simple → past simple হয়, আর today → that day, I → he বদলায়।",
  },
  {
    id: "bcs-eng-008",
    topic: 'narration',
    questionText: "Choose the correct indirect speech: She asked me, 'Where do you live?'",
    options: [
      { letter: 'A', text: "She asked me where do I live." },
      { letter: 'B', text: "She asked me where did I live." },
      { letter: 'C', text: "She asked me where I lived." },
      { letter: 'D', text: "She asked me where I live." },
    ],
    correctLetter: 'C',
    explanation: "Wh-question-এর indirect speech-এ question word-এর পর statement-এর ক্রম হয় (where I lived), আর tense past হয়।",
  },
  {
    id: "bcs-eng-009",
    topic: 'narration',
    questionText: "Choose the correct indirect speech: The teacher said to the students, 'Do not make a noise.'",
    options: [
      { letter: 'A', text: "The teacher told the students do not make a noise." },
      { letter: 'B', text: "The teacher told the students not to make a noise." },
      { letter: 'C', text: "The teacher said the students not to make a noise." },
      { letter: 'D', text: "The teacher told to the students not to make a noise." },
    ],
    correctLetter: 'B',
    explanation: "না-বোধক imperative-এর indirect speech হয় told + not to + verb — told the students not to make a noise।",
  },
  {
    id: "bcs-eng-010",
    topic: 'articles',
    questionText: "Fill in the blank: ___ sun rises in the east.",
    options: [
      { letter: 'A', text: "A" },
      { letter: 'B', text: "An" },
      { letter: 'C', text: "(no article)" },
      { letter: 'D', text: "The" },
    ],
    correctLetter: 'D',
    explanation: "সূর্য একটাই — তাই the sun। একমাত্র জিনিসের আগে the বসে।",
  },
  {
    id: "bcs-eng-011",
    topic: 'articles',
    questionText: "Fill in the blank: He is ___ honest man.",
    options: [
      { letter: 'A', text: "a" },
      { letter: 'B', text: "the" },
      { letter: 'C', text: "an" },
      { letter: 'D', text: "(no article)" },
    ],
    correctLetter: 'C',
    explanation: "'honest' শব্দের h উচ্চারিত হয় না, vowel sound দিয়ে শুরু হয় — তাই a নয়, an বসে।",
  },
  {
    id: "bcs-eng-012",
    topic: 'preposition',
    questionText: "Fill in the blank: She is good ___ mathematics.",
    options: [
      { letter: 'A', text: "in" },
      { letter: 'B', text: "at" },
      { letter: 'C', text: "on" },
      { letter: 'D', text: "for" },
    ],
    correctLetter: 'B',
    explanation: "'good at' — কোনো বিষয়ে ভালো বোঝাতে good-এর পর at বসে।",
  },
  {
    id: "bcs-eng-013",
    topic: 'preposition',
    questionText: "Fill in the blank: The train arrived ___ time, but the bus was late.",
    options: [
      { letter: 'A', text: "in" },
      { letter: 'B', text: "at" },
      { letter: 'C', text: "on" },
      { letter: 'D', text: "by" },
    ],
    correctLetter: 'C',
    explanation: "'on time' মানে ঠিক সময়ে। 'in time' মানে সময়ের মধ্যে (দেরি না করে)।",
  },
  {
    id: "bcs-eng-014",
    topic: 'preposition',
    questionText: "Fill in the blank: He died ___ cholera in 1998.",
    options: [
      { letter: 'A', text: "of" },
      { letter: 'B', text: "from" },
      { letter: 'C', text: "by" },
      { letter: 'D', text: "with" },
    ],
    correctLetter: 'A',
    explanation: "রোগে মারা যাওয়া বোঝাতে die-এর পর of বসে — died of cholera।",
  },
  {
    id: "bcs-eng-015",
    topic: 'right-form-of-verbs',
    questionText: "Fill in the blank: It is high time we ___ the work.",
    options: [
      { letter: 'A', text: "start" },
      { letter: 'B', text: "will start" },
      { letter: 'C', text: "started" },
      { letter: 'D', text: "have started" },
    ],
    correctLetter: 'C',
    explanation: "'It is high time'-এর পর past simple হয় — it is high time we started।",
  },
  {
    id: "bcs-eng-016",
    topic: 'right-form-of-verbs',
    questionText: "Fill in the blank: If I ___ rich, I would travel the world.",
    options: [
      { letter: 'A', text: "am" },
      { letter: 'B', text: "were" },
      { letter: 'C', text: "was" },
      { letter: 'D', text: "will be" },
    ],
    correctLetter: 'B',
    explanation: "অবাস্তব শর্তে (unreal condition) সব person-এর সঙ্গেই were বসে — If I were rich...।",
  },
  {
    id: "bcs-eng-017",
    topic: 'right-form-of-verbs',
    questionText: "Fill in the blank: It is essential that the meeting ___ on time.",
    options: [
      { letter: 'A', text: "starts" },
      { letter: 'B', text: "started" },
      { letter: 'C', text: "will start" },
      { letter: 'D', text: "start" },
    ],
    correctLetter: 'D',
    explanation: "'essential that'-এর পর subjunctive হয় — verb-এর base form বসে, -s যোগ হয় না — the meeting start।",
  },
  {
    id: "bcs-eng-018",
    topic: 'conditionals',
    questionText: "Fill in the blank: If it rains tomorrow, we ___ at home.",
    options: [
      { letter: 'A', text: "stay" },
      { letter: 'B', text: "would stay" },
      { letter: 'C', text: "will stay" },
      { letter: 'D', text: "stayed" },
    ],
    correctLetter: 'C',
    explanation: "First conditional — if + present simple, will + verb — If it rains, we will stay।",
  },
  {
    id: "bcs-eng-019",
    topic: 'conditionals',
    questionText: "Fill in the blank: If I had studied harder, I ___ the exam.",
    options: [
      { letter: 'A', text: "would pass" },
      { letter: 'B', text: "would have passed" },
      { letter: 'C', text: "will pass" },
      { letter: 'D', text: "pass" },
    ],
    correctLetter: 'B',
    explanation: "Third conditional — if + past perfect, would have + past participle — If I had studied, I would have passed।",
  },
  {
    id: "bcs-eng-020",
    topic: 'conditionals',
    questionText: "Fill in the blank: Had I known the truth, I ___ differently.",
    options: [
      { letter: 'A', text: "would have acted" },
      { letter: 'B', text: "would act" },
      { letter: 'C', text: "will act" },
      { letter: 'D', text: "acted" },
    ],
    correctLetter: 'A',
    explanation: "'Had I known...' মানে If I had known... — তৃতীয় শর্ত, তাই would have + past participle হয়।",
  },
  {
    id: "bcs-eng-021",
    topic: 'synonym',
    questionText: "Choose the synonym of 'happy'.",
    options: [
      { letter: 'A', text: "sad" },
      { letter: 'B', text: "joyful" },
      { letter: 'C', text: "angry" },
      { letter: 'D', text: "tired" },
    ],
    correctLetter: 'B',
    explanation: "'happy' মানে আনন্দিত — এর সমার্থক joyful।",
  },
  {
    id: "bcs-eng-022",
    topic: 'synonym',
    questionText: "Choose the synonym of 'abandon'.",
    options: [
      { letter: 'A', text: "desert" },
      { letter: 'B', text: "keep" },
      { letter: 'C', text: "protect" },
      { letter: 'D', text: "build" },
    ],
    correctLetter: 'A',
    explanation: "'abandon' মানে পরিত্যাগ করা — এর সমার্থক desert।",
  },
  {
    id: "bcs-eng-023",
    topic: 'synonym',
    questionText: "Choose the synonym of 'meticulous'.",
    options: [
      { letter: 'A', text: "careless" },
      { letter: 'B', text: "hasty" },
      { letter: 'C', text: "thorough" },
      { letter: 'D', text: "lazy" },
    ],
    correctLetter: 'C',
    explanation: "'meticulous' মানে খুঁটিনাটি বিষয়ে যত্নশীল — এর সমার্থক thorough।",
  },
  {
    id: "bcs-eng-024",
    topic: 'antonym',
    questionText: "Choose the antonym of 'brave'.",
    options: [
      { letter: 'A', text: "bold" },
      { letter: 'B', text: "strong" },
      { letter: 'C', text: "honest" },
      { letter: 'D', text: "cowardly" },
    ],
    correctLetter: 'D',
    explanation: "'brave' মানে সাহসী — এর বিপরীত cowardly (ভীরু)।",
  },
  {
    id: "bcs-eng-025",
    topic: 'antonym',
    questionText: "Choose the antonym of 'ancient'.",
    options: [
      { letter: 'A', text: "old" },
      { letter: 'B', text: "modern" },
      { letter: 'C', text: "historic" },
      { letter: 'D', text: "antique" },
    ],
    correctLetter: 'B',
    explanation: "'ancient' মানে প্রাচীন — এর বিপরীত modern (আধুনিক)।",
  },
  {
    id: "bcs-eng-026",
    topic: 'spelling',
    questionText: "Choose the correctly spelled word.",
    options: [
      { letter: 'A', text: "Receive" },
      { letter: 'B', text: "Recieve" },
      { letter: 'C', text: "Receeve" },
      { letter: 'D', text: "Receiv" },
    ],
    correctLetter: 'A',
    explanation: "'i before e except after c' — receive বানানে c-এর পর ei হয়।",
  },
  {
    id: "bcs-eng-027",
    topic: 'spelling',
    questionText: "Choose the correctly spelled word.",
    options: [
      { letter: 'A', text: "Accomodation" },
      { letter: 'B', text: "Acommodation" },
      { letter: 'C', text: "Accomodattion" },
      { letter: 'D', text: "Accommodation" },
    ],
    correctLetter: 'D',
    explanation: "'accommodation' বানানে double c আর double m হয়।",
  },
  {
    id: "bcs-eng-028",
    topic: 'one-word-substitution',
    questionText: "A person who speaks many languages is called a —",
    options: [
      { letter: 'A', text: "linguist" },
      { letter: 'B', text: "polyglot" },
      { letter: 'C', text: "bilingual" },
      { letter: 'D', text: "orator" },
    ],
    correctLetter: 'B',
    explanation: "'polyglot' মানে বহু ভাষায় কথা বলতে পারে এমন ব্যক্তি। 'linguist' মানে ভাষা নিয়ে গবেষণা করে এমন ব্যক্তি।",
  },
  {
    id: "bcs-eng-029",
    topic: 'one-word-substitution',
    questionText: "A place where birds are kept is called a —",
    options: [
      { letter: 'A', text: "apiary" },
      { letter: 'B', text: "aquarium" },
      { letter: 'C', text: "stable" },
      { letter: 'D', text: "aviary" },
    ],
    correctLetter: 'D',
    explanation: "'aviary' মানে পাখির খাঁচা বা পাখিশালা। apiary = মৌমাছির খামার, aquarium = মাছের জায়গা।",
  },
  {
    id: "bcs-eng-030",
    topic: 'idiom',
    questionText: "What does the idiom 'to bite the dust' mean?",
    options: [
      { letter: 'A', text: "to be defeated" },
      { letter: 'B', text: "to eat dust" },
      { letter: 'C', text: "to work hard" },
      { letter: 'D', text: "to hide" },
    ],
    correctLetter: 'A',
    explanation: "'To bite the dust' মানে পরাজিত হওয়া।",
  },
  {
    id: "bcs-eng-031",
    topic: 'idiom',
    questionText: "What does the idiom 'a blessing in disguise' mean?",
    options: [
      { letter: 'A', text: "a hidden curse" },
      { letter: 'B', text: "something good that seemed bad at first" },
      { letter: 'C', text: "a secret gift" },
      { letter: 'D', text: "a lucky charm" },
    ],
    correctLetter: 'B',
    explanation: "'A blessing in disguise' মানে প্রথমে খারাপ মনে হলেও পরে ভালো প্রমাণিত হওয়া জিনিস।",
  },
  {
    id: "bcs-eng-032",
    topic: 'idiom',
    questionText: "What does the idiom 'to burn the midnight oil' mean?",
    options: [
      { letter: 'A', text: "to waste oil" },
      { letter: 'B', text: "to light a lamp" },
      { letter: 'C', text: "to work late into the night" },
      { letter: 'D', text: "to sleep early" },
    ],
    correctLetter: 'C',
    explanation: "'To burn the midnight oil' মানে গভীর রাত পর্যন্ত পড়াশোনা বা কাজ করা।",
  },
  {
    id: "bcs-eng-033",
    topic: 'reading',
    questionText: "How does Rahim go to school?",
    options: [
      { letter: 'A', text: "By bus" },
      { letter: 'B', text: "By bicycle" },
      { letter: 'C', text: "By boat" },
      { letter: 'D', text: "On foot" },
    ],
    correctLetter: 'D',
    explanation: "Passage-এ আছে — Rahim walks two kilometres to school, মানে সে হেঁটে যায় (on foot)।",
  },
  {
    id: "bcs-eng-034",
    topic: 'reading',
    questionText: "Why do his students love him?",
    options: [
      { letter: 'A', text: "Because he explains lessons with simple examples" },
      { letter: 'B', text: "Because he gives them money" },
      { letter: 'C', text: "Because he is strict" },
      { letter: 'D', text: "Because he gives them gifts" },
    ],
    correctLetter: 'A',
    explanation: "Passage-এ আছে — he explains every lesson with simple examples, তাই ছাত্ররা তাকে ভালোবাসে।",
  },
  {
    id: "bcs-eng-035",
    topic: 'reading',
    questionText: "What does Rahim believe?",
    options: [
      { letter: 'A', text: "That money can change life" },
      { letter: 'B', text: "That education can change the life of a poor child" },
      { letter: 'C', text: "That village life is easy" },
      { letter: 'D', text: "That children should work" },
    ],
    correctLetter: 'B',
    explanation: "Passage-এ আছে — He believes that education can change the life of a poor child।",
  },
];

export function publicBcsCategoryOf(topic: PublicBcsTopic): PublicBcsCategory {
  return PUBLIC_BCS_TOPICS.find((t) => t.topic === topic)?.category ?? 'grammar';
}

export function publicBcsQuestionsFor(category: PublicBcsCategory): PublicBcsQuestion[] {
  return PUBLIC_BCS_ENGLISH_QUESTIONS.filter(
    (q) => publicBcsCategoryOf(q.topic) === category,
  );
}

export function publicBcsQuestionsByTopic(topic: PublicBcsTopic): PublicBcsQuestion[] {
  return PUBLIC_BCS_ENGLISH_QUESTIONS.filter((q) => q.topic === topic);
}

