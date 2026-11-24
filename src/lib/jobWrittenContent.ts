/**
 * Eduvelto Job Preparation — first written questions, code-shaped
 * (design-grades-written-previous-admin.md §2.7/§2.8, Step 16
 * precedent: code shaped 1:1 on the Firestore schema because the
 * rules change lands in Phase 4).
 *
 * ENGLISH FIRST (owner is the English verifier). Every question
 * here is status 'draft' + reviewStatus 'Not Started' until the
 * owner verifies it — nothing here is Published. Bangla/GK/math
 * questions stay DRAFT/UNVERIFIED until a verified teacher reviews
 * them; the one Bangla question below carries that label on the
 * page, never a clean publish.
 *
 * Marks are null wherever the verified pattern does not state them
 * (then DRAFT) — never a guessed mark. Model answers are original
 * teaching content written for this system, not copied from any
 * exam paper. Facts carry a source or null (null renders as
 * "যাচাই হয়নি" — never invented as fact).
 */

import type { WrittenAnswerType, WrittenStructure } from './jobWritten';

export type WrittenReviewStatus =
  | 'Not Started'
  | 'In Progress'
  | 'Under Review'
  | 'Published'
  | 'Rejected'
  | 'Archived';

export interface WrittenQuestion {
  questionId: string;
  questionTextBn: string;
  questionTextEn: string | null;
  answerType: WrittenAnswerType;
  /** examSlug__subjectSlug, same stable-id rule as jobContent.ts #6. */
  subjectId: string;
  examSlug: string;
  postFamilySlug: string | null;
  /** As the verified pattern states; null when unverified (then DRAFT). */
  marks: number | null;
  instructionsBn: string;
  instructionsEn: string | null;
  structure: WrittenStructure;
  markingGuidelines: string;
  commonMistakes: string[];
  referenceSources: string[];
  version: number;
  status: 'draft' | 'published';
  reviewStatus: WrittenReviewStatus;
  verifiedBy: string | null;
  verifiedAt: string | null;
}

export const WRITTEN_QUESTIONS: WrittenQuestion[] = [
  {
    questionId: 'wq-en-essay-001',
    questionTextBn: 'নিচের বিষয়ে একটি ইংরেজি প্রবন্ধ লেখো: "The Importance of Reading Books"',
    questionTextEn: 'Write an essay in English on "The Importance of Reading Books".',
    answerType: 'english-essay',
    subjectId: 'bcs__english',
    examSlug: 'bcs',
    postFamilySlug: null,
    marks: null,
    instructionsBn: 'নিজের ভাষায় লেখো। মডেল উত্তরটি শুধু নমুনা — হুবহু মুখস্থ করে লিখবে না।',
    instructionsEn: 'Write in your own words. The model answer is only a sample — do not copy it by heart.',
    structure: {
      questionAnalysisBn: 'প্রশ্নটি চাইছে: বই পড়া কেন গুরুত্বপূর্ণ — তার কারণ ও ফল। "Importance" শব্দটি মূল শব্দ: কারণগুলো যুক্তি দিয়ে সাজাতে হবে, শুধু "বই ভালো" বললেই হবে না। বইয়ের তালিকা দেওয়া চাওয়া হয়নি।',
      questionAnalysisEn: 'The question asks: why reading books matters — its reasons and results. "Importance" is the key word: the reasons must be arranged as arguments, not just "books are good". No list of books is asked for.',
      structureBn: ['ভূমিকা', 'মূল আলোচনা (যুক্তি অনুযায়ী পয়েন্ট)', 'তথ্য ও উদাহরণ', 'উপসংহার'],
      structureEn: ['Introduction', 'Main discussion (logical points)', 'Facts & examples', 'Conclusion'],
      introductionBn: 'একটি সাধারণ সত্য বা প্রশ্ন দিয়ে শুরু করো — যেমন, বই মানুষের নীরব শিক্ষক। ভূমিকায় পুরো প্রবন্ধের মূল কথাটি এক লাইনে বলো।',
      introductionEn: 'Start with a general truth or a question — for example, books are silent teachers. State the main idea of the whole essay in one line in the introduction.',
      mainPointsBn: [
        'বই জ্ঞান বাড়ায় — নতুন বিষয়, নতুন দেশ, নতুন ভাবনা জানা যায়।',
        'ভাষা ও শব্দভাণ্ডার শক্ত হয় — পড়তে পড়তে নতুন শব্দ শেখা যায়।',
        'চিন্তা করার অভ্যাস গড়ে ওঠে — ভালো বই প্রশ্ন করতে শেখায়।',
        'অবসর সময় ভালো কাজে যায় — বই মনকে শান্ত রাখে।',
      ],
      mainPointsEn: [
        'Books increase knowledge — new subjects, new countries, new ideas.',
        'Language and vocabulary grow stronger — new words are learned while reading.',
        'The habit of thinking develops — good books teach us to ask questions.',
        'Free time is well spent — books keep the mind calm.',
      ],
      factsBn: [
        { text: 'একটি প্রবন্ধের তিনটি অংশ থাকে: ভূমিকা, মূল আলোচনা ও উপসংহার।', source: 'Teaching point — standard essay structure' },
        { text: 'বিশ্ব বই দিবস প্রতি বছর ২৩ এপ্রিল পালিত হয়।', source: null },
      ],
      factsEn: [
        { text: 'An essay has three parts: introduction, main discussion and conclusion.', source: 'Teaching point — standard essay structure' },
        { text: 'World Book Day is observed every year on 23 April.', source: null },
      ],
      conclusionBn: 'শেষে মূল কথাটি আবার বলো — বই পড়া শুধু পরীক্ষার জন্য নয়, সারা জীবনের জন্য। একটি ছোট সুপারিশ দিয়ে শেষ করো: প্রতিদিন কিছুটা সময় বইয়ের জন্য রাখা উচিত।',
      conclusionEn: 'Restate the main idea at the end — reading books is not only for exams, but for life. Finish with a small recommendation: some time every day should be kept for books.',
      modelAnswerBn: '',
      modelAnswerEn:
        'Books are silent teachers. They open the door of knowledge without asking for anything in return. A person who reads books regularly learns new things every day — about the world, about people, and about life itself.\n\nFirst, books increase our knowledge. Through books we can travel to distant countries, learn about history, and understand new ideas without leaving our room. Second, reading strengthens our language. New words, new sentence patterns and new styles of expression come to us naturally while we read. Third, books teach us to think. A good book does not give us ready answers only; it raises questions in our mind and trains us to judge things ourselves. Finally, books are good companions in our free time. When we feel tired or lonely, a good book keeps our mind calm and fresh.\n\nIn short, reading books is not only useful for examinations. It builds knowledge, language and character for the whole of life. So we should keep some time every day for books.',
      submissionPromptBn: 'নিজের ভাষায় প্রবন্ধটি লেখো, তারপর নিচের স্ব-যাচাই তালিকাটি পূরণ করো।',
      submissionPromptEn: 'Write the essay in your own words, then complete the self-check list below.',
    },
    markingGuidelines: 'DRAFT — owner (English verifier) to confirm. What an examiner looks for: relevance to the question, clear structure, correct grammar, varied vocabulary, relevant examples.',
    commonMistakes: [
      'প্রশ্নের বাইরে গিয়ে বইয়ের তালিকা দেওয়া',
      'ভূমিকা ছাড়া সরাসরি পয়েন্ট শুরু করা',
      'একই শব্দ (good, important) বারবার ব্যবহার করা',
      'Tense বদলে যাওয়া — এক অনুচ্ছেদে present, পরেরটিতে past',
    ],
    referenceSources: ['Teacher-written model answer (original)', 'Standard essay structure — teaching point'],
    version: 1,
    status: 'draft',
    reviewStatus: 'Not Started',
    verifiedBy: null,
    verifiedAt: null,
  },
  {
    questionId: 'wq-en-paragraph-001',
    questionTextBn: 'নিচের বিষয়ে একটি অনুচ্ছেদ লেখো: "Your Aim in Life"',
    questionTextEn: 'Write a paragraph on "Your Aim in Life".',
    answerType: 'paragraph',
    subjectId: 'bcs__english',
    examSlug: 'bcs',
    postFamilySlug: null,
    marks: null,
    instructionsBn: 'একটিই অনুচ্ছেদে লেখো। মূল বাক্যটি প্রথমে লেখো।',
    instructionsEn: 'Write in a single paragraph. Put the topic sentence first.',
    structure: {
      questionAnalysisBn: 'প্রশ্নটি চাইছে: তোমার জীবনের লক্ষ্য কী এবং কেন। "Aim" শব্দটি মূল — লক্ষ্যটি কী, তা স্পষ্ট করে বলতে হবে, শুধু "আমি বড় হতে চাই" বললেই হবে না।',
      questionAnalysisEn: 'The question asks: what your aim in life is, and why. "Aim" is the key word — the aim must be stated clearly; "I want to be great" is not enough.',
      structureBn: ['মূল বাক্য (topic sentence)', 'সহায়ক বাক্য', 'সমাপনী বাক্য'],
      structureEn: ['Topic sentence', 'Supporting sentences', 'Concluding sentence'],
      introductionBn: 'অনুচ্ছেদে আলাদা ভূমিকা থাকে না — প্রথম বাক্যটিই মূল বাক্য। তাতে লক্ষ্যটি সরাসরি বলো: "My aim in life is to become a teacher."',
      introductionEn: 'A paragraph has no separate introduction — the first sentence is the topic sentence. State the aim directly in it: "My aim in life is to become a teacher."',
      mainPointsBn: [
        'লক্ষ্যটি কী — এক লাইনে স্পষ্ট করে বলা।',
        'কেন এই লক্ষ্য — একটি কারণ।',
        'লক্ষ্য পূরণে কী করবে — একটি পরিকল্পনা।',
      ],
      mainPointsEn: [
        'What the aim is — stated clearly in one line.',
        'Why this aim — one reason.',
        'What you will do to reach it — one plan.',
      ],
      factsBn: [{ text: 'একটি ভালো অনুচ্ছেদে একটিই মূল ভাব থাকে।', source: 'Teaching point — standard paragraph structure' }],
      factsEn: [{ text: 'A good paragraph has only one main idea.', source: 'Teaching point — standard paragraph structure' }],
      conclusionBn: 'শেষ বাক্যে মূল ভাবটি আবার বলো — লক্ষ্যের প্রতি তোমার দৃঢ়তা দিয়ে শেষ করো।',
      conclusionEn: 'Restate the main idea in the last sentence — finish with your determination to reach the aim.',
      modelAnswerBn: '',
      modelAnswerEn:
        'My aim in life is to become a teacher. A teacher builds the future of a nation by teaching its children, and I want to be a part of that noble work. I have always loved learning, and I enjoy explaining difficult things in simple words to my friends. To reach my aim, I will study hard, read good books, and learn from my own teachers. I know the path is not easy, but I am determined to work for it every day. If I become a good teacher one day, I will try to make learning easy and joyful for my students.',
      submissionPromptBn: 'নিজের ভাষায় অনুচ্ছেদটি লেখো, তারপর নিচের স্ব-যাচাই তালিকাটি পূরণ করো।',
      submissionPromptEn: 'Write the paragraph in your own words, then complete the self-check list below.',
    },
    markingGuidelines: 'DRAFT — owner (English verifier) to confirm. What an examiner looks for: single-paragraph discipline, topic sentence first, unity of idea, correct grammar.',
    commonMistakes: [
      'এক অনুচ্ছেদে একাধিক মূল ভাব লেখা',
      'মূল বাক্য ছাড়া শুরু করা',
      'লক্ষ্যটি অস্পষ্ট রাখা ("আমি বড় হতে চাই")',
    ],
    referenceSources: ['Teacher-written model answer (original)', 'Standard paragraph structure — teaching point'],
    version: 1,
    status: 'draft',
    reviewStatus: 'Not Started',
    verifiedBy: null,
    verifiedAt: null,
  },
  {
    questionId: 'wq-en-application-001',
    questionTextBn: 'তোমার কলেজের অধ্যক্ষের কাছে একটি চারিত্রিক সনদপত্রের জন্য দরখাস্ত লেখো।',
    questionTextEn: 'Write an application to the Principal of your college for a character certificate.',
    answerType: 'application',
    subjectId: 'bcs__english',
    examSlug: 'bcs',
    postFamilySlug: null,
    marks: null,
    instructionsBn: 'দরখাস্তের ধরন (format) ঠিক রাখো — ঠিকানা, তারিখ, বিষয়-লাইন, সম্বোধন, সমাপনী।',
    instructionsEn: 'Keep the application format correct — address, date, subject line, salutation, closing.',
    structure: {
      questionAnalysisBn: 'প্রশ্নটি চাইছে: অধ্যক্ষের কাছে চারিত্রিক সনদপত্র চেয়ে একটি দরখাস্ত। মূল বিষয়: কী চাইছো (সনদপত্র) এবং কেন চাইছো (চাকরির আবেদনের জন্য)।',
      questionAnalysisEn: 'The question asks: an application to the Principal asking for a character certificate. The key points: what you want (the certificate) and why (for a job application).',
      structureBn: ['ঠিকানা ও তারিখ', 'বিষয় (subject line)', 'সম্বোধন', 'মূল বক্তব্য', 'বিনীত সমাপনী ও স্বাক্ষর'],
      structureEn: ['Address and date', 'Subject line', 'Salutation', 'Main body', 'Polite closing and signature'],
      introductionBn: 'দরখাস্তে আলাদা ভূমিকা থাকে না — প্রথম অনুচ্ছেদেই বলো তুমি কে এবং কী চাইছো।',
      introductionEn: 'An application has no separate introduction — the first paragraph states who you are and what you want.',
      mainPointsBn: [
        'নিজের পরিচয়: নাম, শ্রেণি/বিভাগ, রোল নম্বর।',
        'কী চাইছো: চারিত্রিক সনদপত্র।',
        'কেন চাইছো: চাকরির আবেদনের সঙ্গে জমা দিতে হবে।',
        'বিনীত অনুরোধ: সনদপত্রটি দেওয়ার জন্য অনুরোধ।',
      ],
      mainPointsEn: [
        'Your identity: name, class/department, roll number.',
        'What you want: a character certificate.',
        'Why you want it: to submit with a job application.',
        'A polite request for the certificate.',
      ],
      factsBn: [{ text: 'একটি দরখাস্তে বিষয়-লাইন (subject line) থাকা বাধ্যতামূলক — তা না থাকলে আবেদনের উদ্দেশ্য স্পষ্ট হয় না।', source: 'Teaching point — standard application format' }],
      factsEn: [{ text: 'An application must have a subject line — without it the purpose is unclear.', source: 'Teaching point — standard application format' }],
      conclusionBn: 'বিনীত সমাপনী দিয়ে শেষ করো — "I shall remain ever grateful to you for this kindness."',
      conclusionEn: 'Finish with a polite closing — "I shall remain ever grateful to you for this kindness."',
      modelAnswerBn: '',
      modelAnswerEn:
        'To\nThe Principal\nDistrict College\nChattogram\n\n12 November 2026\n\nSubject: Prayer for a character certificate\n\nSir,\n\nI beg most respectfully to state that I am a student of your college. I passed the HSC examination in 2022 from the Science group. My roll number was 214.\n\nI need a character certificate to submit with an application for a government job. The last date for submission is near, so I need the certificate urgently.\n\nI therefore pray and hope that you would be kind enough to issue me a character certificate at an early date.\n\nI remain,\nSir,\nYour most obedient pupil\nRahim Uddin\nClass: HSC (Science), Roll: 214',
      submissionPromptBn: 'নিজের ভাষায় দরখাস্তটি লেখো, তারপর নিচের স্ব-যাচাই তালিকাটি পূরণ করো।',
      submissionPromptEn: 'Write the application in your own words, then complete the self-check list below.',
    },
    markingGuidelines: 'DRAFT — owner (English verifier) to confirm. What an examiner looks for: correct format (address, date, subject line, salutation, closing), polite language, clear purpose, correct grammar.',
    commonMistakes: [
      'বিষয়-লাইন না লেখা',
      'তারিখ ভুলে যাওয়া',
      'দাবির ভাষা ব্যবহার করা ("আমাকে দিতে হবে")',
      'নিজের পরিচয় (নাম, রোল) না দেওয়া',
    ],
    referenceSources: ['Teacher-written model answer (original)', 'Standard application format — teaching point'],
    version: 1,
    status: 'draft',
    reviewStatus: 'Not Started',
    verifiedBy: null,
    verifiedAt: null,
  },
  {
    questionId: 'wq-en-letter-001',
    questionTextBn: 'তোমার বন্ধুকে একটি চিঠি লেখো — BCS পরীক্ষার জন্য তোমার প্রস্তুতির কথা জানিয়ে।',
    questionTextEn: 'Write a letter to your friend describing your preparation for the BCS examination.',
    answerType: 'english-letter',
    subjectId: 'bcs__english',
    examSlug: 'bcs',
    postFamilySlug: null,
    marks: null,
    instructionsBn: 'চিঠির ধরন ঠিক রাখো — ঠিকানা, তারিখ, সম্বোধন, সমাপনী। বন্ধুর সঙ্গে কথা বলার মতো সহজ ভাষায় লেখো।',
    instructionsEn: 'Keep the letter format correct — address, date, salutation, closing. Write in easy language, as if talking to a friend.',
    structure: {
      questionAnalysisBn: 'প্রশ্নটি চাইছে: বন্ধুকে তোমার BCS প্রস্তুতির কথা জানানো। মূল বিষয়: কী পড়ছো, কীভাবে পড়ছো, কোন বিষয়ে দুর্বলতা আছে।',
      questionAnalysisEn: 'The question asks: telling your friend about your BCS preparation. The key points: what you are studying, how you study, and which subject is weak.',
      structureBn: ['ঠিকানা ও তারিখ', 'সম্বোধন', 'মূল বক্তব্য', 'সমাপনী ও স্বাক্ষর'],
      structureEn: ['Address and date', 'Salutation', 'Main body', 'Closing and signature'],
      introductionBn: 'প্রথমে কুশল জিজ্ঞেস করো, তারপর মূল কথায় যাও — "I am glad to tell you about my preparation for the BCS examination."',
      introductionEn: 'Ask after your friend first, then come to the main point — "I am glad to tell you about my preparation for the BCS examination."',
      mainPointsBn: [
        'কী পড়ছো: বাংলা, ইংরেজি, গণিত, সাধারণ জ্ঞান।',
        'কীভাবে পড়ছো: প্রতিদিনের রুটিন।',
        'কোন বিষয়ে দুর্বলতা আছে এবং তা কাটাতে কী করছো।',
      ],
      mainPointsEn: [
        'What you are studying: Bangla, English, Math, General Knowledge.',
        'How you study: your daily routine.',
        'Which subject is weak and what you are doing about it.',
      ],
      factsBn: [{ text: 'বন্ধুর কাছে লেখা চিঠিতে (informal letter) ভাষা হয় সহজ ও আন্তরিক।', source: 'Teaching point — standard letter format' }],
      factsEn: [{ text: 'A letter to a friend (informal letter) uses easy and warm language.', source: 'Teaching point — standard letter format' }],
      conclusionBn: 'শেষে বন্ধুকে নিজের প্রস্তুতির কথা জানতে চাও এবং শুভকামনা দিয়ে শেষ করো।',
      conclusionEn: 'At the end, ask your friend about their own preparation and finish with good wishes.',
      modelAnswerBn: '',
      modelAnswerEn:
        'Chattogram\n12 November 2026\n\nDear Rahim,\n\nI hope you are well. I am glad to tell you about my preparation for the BCS examination.\n\nI study every day from morning to night. In the morning I read Bangla and English. In the afternoon I practise Mathematics and General Knowledge. I also solve previous questions to understand the pattern of the examination.\n\nMy weak subject is Mathematics. To improve it, I practise ten sums every day and I take help from my teacher when I cannot solve a sum. My English is improving day by day because I read an English newspaper daily.\n\nHow is your preparation going? Please write to me about your routine. I hope we both succeed.\n\nYour loving friend\nKarim',
      submissionPromptBn: 'নিজের ভাষায় চিঠিটি লেখো, তারপর নিচের স্ব-যাচাই তালিকাটি পূরণ করো।',
      submissionPromptEn: 'Write the letter in your own words, then complete the self-check list below.',
    },
    markingGuidelines: 'DRAFT — owner (English verifier) to confirm. What an examiner looks for: correct format, natural friendly tone, clear description of preparation, correct grammar.',
    commonMistakes: [
      'ঠিকানা বা তারিখ ভুলে যাওয়া',
      'আনুষ্ঠানিক (formal) ভাষায় বন্ধুকে চিঠি লেখা',
      'প্রস্তুতির বর্ণনা না দিয়ে শুধু শুভেচ্ছা লেখা',
    ],
    referenceSources: ['Teacher-written model answer (original)', 'Standard letter format — teaching point'],
    version: 1,
    status: 'draft',
    reviewStatus: 'Not Started',
    verifiedBy: null,
    verifiedAt: null,
  },
  {
    questionId: 'wq-en-translation-001',
    questionTextBn: 'নিচের বাংলা বাক্যগুলো ইংরেজিতে অনুবাদ করো।',
    questionTextEn: 'Translate the following Bangla sentences into English.',
    answerType: 'translation',
    subjectId: 'bcs__english',
    examSlug: 'bcs',
    postFamilySlug: null,
    marks: null,
    instructionsBn: 'শব্দ-শব্দ অনুবাদ করবে না — অর্থ ঠিক রেখে স্বাভাবিক ইংরেজি বাক্য লেখো। মূল বাক্যগুলো: (১) সে প্রতিদিন সকালে হাঁটতে যায়। (২) পরিশ্রম ছাড়া সাফল্য আসে না। (৩) আমি তোমাকে সাহায্য করতে চাই।',
    instructionsEn: 'Do not translate word for word — keep the meaning and write natural English sentences. The source sentences are: (1) সে প্রতিদিন সকালে হাঁটতে যায়। (2) পরিশ্রম ছাড়া সাফল্য আসে না। (3) আমি তোমাকে সাহায্য করতে চাই।',
    structure: {
      questionAnalysisBn: 'প্রশ্নটি চাইছে: তিনটি বাংলা বাক্যের অর্থ ঠিক রেখে স্বাভাবিক ইংরেজিতে অনুবাদ। "অর্থ" মূল — শব্দ-শব্দ মিল নয়।',
      questionAnalysisEn: 'The question asks: translate three Bangla sentences into natural English, keeping the meaning. "Meaning" is the key — not a word-for-word match.',
      structureBn: ['মূল বাক্যের অর্থ বোঝা', 'শব্দচয়ন', 'স্বাভাবিক বাক্য গঠন'],
      structureEn: ['Understand the source meaning', 'Word choice', 'Natural sentence construction'],
      introductionBn: 'প্রথমে প্রতিটি বাক্যের অর্থ বোঝো — কে কী করছে, কখন করছে। তারপর ইংরেজিতে ভাবো, বাংলায় নয়।',
      introductionEn: 'First understand the meaning of each sentence — who does what, and when. Then think in English, not in Bangla.',
      mainPointsBn: [
        'বাক্য ১: অভ্যাস বোঝায় (প্রতিদিন) — present simple tense।',
        'বাক্য ২: একটি সাধারণ সত্য — "ছাড়া" মানে "without"।',
        'বাক্য ৩: ইচ্ছা বোঝায় — "want to" ব্যবহার করো।',
      ],
      mainPointsEn: [
        'Sentence 1: a habit (every day) — present simple tense.',
        'Sentence 2: a general truth — "ছাড়া" means "without".',
        'Sentence 3: a wish — use "want to".',
      ],
      factsBn: [{ text: 'অনুবাদে অর্থই প্রধান — শব্দ-শব্দ মিল নয়।', source: 'Teaching point — translation method' }],
      factsEn: [{ text: 'In translation, meaning comes first — not a word-for-word match.', source: 'Teaching point — translation method' }],
      conclusionBn: 'অনুবাদ শেষে প্রতিটি বাক্য আবার পড়ো — ইংরেজি বাক্যটি স্বাভাবিক শোনায় কি না, তা যাচাই করো।',
      conclusionEn: 'After translating, read each sentence again — check whether the English sentence sounds natural.',
      modelAnswerBn: '',
      modelAnswerEn:
        '(1) He goes for a walk every morning.\n(2) There is no success without hard work.\n(3) I want to help you.',
      submissionPromptBn: 'তিনটি বাক্যের অনুবাদ লেখো, তারপর নিচের স্ব-যাচাই তালিকাটি পূরণ করো।',
      submissionPromptEn: 'Write the translation of the three sentences, then complete the self-check list below.',
    },
    markingGuidelines: 'DRAFT — owner (English verifier) to confirm. What an examiner looks for: meaning carried fully, natural English, correct tense and word choice.',
    commonMistakes: [
      'শব্দ-শব্দ অনুবাদ ("He every morning walking goes")',
      'Tense ভুল করা',
      '"ছাড়া" শব্দের অর্থ বাদ দেওয়া',
    ],
    referenceSources: ['Teacher-written model answer (original)', 'Translation method — teaching point'],
    version: 1,
    status: 'draft',
    reviewStatus: 'Not Started',
    verifiedBy: null,
    verifiedAt: null,
  },
  {
    // DRAFT/UNVERIFIED — Bangla content until a verified teacher
    // reviews it (0 verified teachers for non-English subjects).
    // The page shows the DRAFT label, never a clean publish.
    questionId: 'wq-bn-paragraph-001',
    questionTextBn: 'নিচের বিষয়ে একটি অনুচ্ছেদ লেখো: "আমার প্রিয় বই"',
    questionTextEn: null,
    answerType: 'paragraph',
    subjectId: 'bcs__bangla',
    examSlug: 'bcs',
    postFamilySlug: null,
    marks: null,
    instructionsBn: 'একটিই অনুচ্ছেদে লেখো। মূল বাক্যটি প্রথমে লেখো।',
    instructionsEn: null,
    structure: {
      questionAnalysisBn: 'প্রশ্নটি চাইছে: তোমার প্রিয় বই কোনটি এবং কেন। মূল বিষয়: বইটির নাম, কী আছে তাতে, কেন প্রিয়।',
      questionAnalysisEn: 'The question asks: which book is your favourite, and why. The key points: the name of the book, what is in it, why it is dear to you.',
      structureBn: ['মূল বাক্য (topic sentence)', 'সহায়ক বাক্য', 'সমাপনী বাক্য'],
      structureEn: ['Topic sentence', 'Supporting sentences', 'Concluding sentence'],
      introductionBn: 'প্রথম বাক্যেই বইটির নাম বলো — "আমার প্রিয় বই ___।"',
      introductionEn: 'Name the book in the first sentence — "My favourite book is ___."',
      mainPointsBn: [
        'বইটির নাম ও লেখক।',
        'বইটিতে কী আছে — গল্প, জ্ঞান, শিক্ষা।',
        'কেন প্রিয় — বইটি তোমাকে কী শিখিয়েছে।',
      ],
      mainPointsEn: ['The name of the book and its author.', 'What is in the book — story, knowledge, lessons.', 'Why it is dear — what the book taught you.'],
      factsBn: [{ text: 'একটি ভালো অনুচ্ছেদে একটিই মূল ভাব থাকে।', source: 'Teaching point — standard paragraph structure' }],
      factsEn: [{ text: 'A good paragraph has only one main idea.', source: 'Teaching point — standard paragraph structure' }],
      conclusionBn: 'শেষ বাক্যে মূল ভাবটি আবার বলো।',
      conclusionEn: 'Restate the main idea in the last sentence.',
      modelAnswerBn:
        'আমার প্রিয় বই "আমার জীবন" — একটি স্মৃতিকথা। বইটিতে লেখকের ছোটবেলার গল্প, সংগ্রাম আর স্বপ্নের কথা আছে। বইটি পড়ে আমি শিখেছি — কঠিন সময়ে হাল ছাড়া যায় না। তাই বইটি আমার কাছে শুধু পড়ার বই নয়, জীবনের পথ দেখানো বন্ধু।',
      modelAnswerEn: null,
      submissionPromptBn: 'নিজের ভাষায় অনুচ্ছেদটি লেখো, তারপর নিচের স্ব-যাচাই তালিকাটি পূরণ করো।',
      submissionPromptEn: 'Write the paragraph in your own words, then complete the self-check list below.',
    },
    markingGuidelines: 'DRAFT/UNVERIFIED — no verified Bangla teacher yet. Owner (English verifier) cannot verify Bangla content; a verified teacher must review before Publish.',
    commonMistakes: ['এক অনুচ্ছেদে একাধিক মূল ভাব লেখা', 'বইটির নাম না লেখা', 'মূল বাক্য ছাড়া শুরু করা'],
    referenceSources: ['Teacher-written model answer (original — DRAFT, unverified)'],
    version: 1,
    status: 'draft',
    reviewStatus: 'Not Started',
    verifiedBy: null,
    verifiedAt: null,
  },
];

export function writtenQuestionById(questionId: string): WrittenQuestion | undefined {
  return WRITTEN_QUESTIONS.find((q) => q.questionId === questionId);
}

export function writtenQuestionsForExam(examSlug: string): WrittenQuestion[] {
  return WRITTEN_QUESTIONS.filter((q) => q.examSlug === examSlug);
}

export function writtenQuestionsForPostFamily(postFamilySlug: string): WrittenQuestion[] {
  return WRITTEN_QUESTIONS.filter((q) => q.postFamilySlug === postFamilySlug);
}

/** Validate one code-shaped question. Returns problem strings. */
export function validateWrittenQuestion(q: WrittenQuestion): string[] {
  const problems: string[] = [];
  const label = `writtenQuestions/${q.questionId}`;
  if (!/^wq-[a-z]{2}-[a-z]+-\d{3}$/.test(q.questionId)) {
    problems.push(`${label}: questionId must look like wq-<lang>-<type>-<NNN>`);
  }
  if (q.status === 'published' && q.reviewStatus !== 'Published') {
    problems.push(`${label}: published requires reviewStatus 'Published'`);
  }
  if (q.status === 'published' && q.verifiedBy === null) {
    problems.push(`${label}: published requires a verifier (second-eye rule)`);
  }
  const s = q.structure;
  const missing = [
    'questionAnalysisBn',
    'introductionBn',
    'conclusionBn',
    'modelAnswerBn',
    'submissionPromptBn',
  ].filter((k) => (s as unknown as Record<string, unknown>)[k] === undefined);
  if (missing.length > 0) problems.push(`${label}: structure is missing ${missing.join(', ')}`);
  if (s.structureBn.length === 0 || s.mainPointsBn.length === 0) {
    problems.push(`${label}: structure and main points must not be empty`);
  }
  if (s.factsBn.some((f) => typeof f.text !== 'string' || f.text.length === 0)) {
    problems.push(`${label}: every fact needs text`);
  }
  if (q.commonMistakes.length === 0) problems.push(`${label}: commonMistakes must not be empty`);
  if (q.referenceSources.length === 0) problems.push(`${label}: referenceSources must not be empty`);
  if (q.marks !== null && (!Number.isInteger(q.marks) || q.marks <= 0)) {
    problems.push(`${label}: marks must be a positive integer or null`);
  }
  return problems;
}
