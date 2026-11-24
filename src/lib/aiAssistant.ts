// Eduvelto AI Life Assistant — deterministic daily-life tools.
//
// These tools run ENTIRELY on the device: pure functions, no network,
// no API key, no AI model. They are the part of the assistant that
// works today, with or without a live AI provider. Live AI answers are
// a separate layer (see ./aiProviders.ts) and are NEVER faked here:
// nothing in this file pretends to be an AI reply.
//
// Language: Bangla first, English second — the same `t({bn, en})`
// pattern the rest of the app uses. Errors carry both languages so
// the UI can show the user's language.

export type ToolId =
  | 'chat'
  | 'calculator'
  | 'converter'
  | 'budget'
  | 'planner'
  | 'letter'
  | 'application'
  | 'cv'
  | 'email'
  | 'phrases'
  | 'study';

export type ToolCategory = 'ai' | 'calculate' | 'plan' | 'write' | 'learn';

export interface AssistantToolMeta {
  id: ToolId;
  category: ToolCategory;
  nameBn: string;
  nameEn: string;
  descBn: string;
  descEn: string;
  /** False for every MVP tool: nothing here needs an account. Saved
   *  work (later) will be login-gated; the tools themselves are not. */
  needsLogin: false;
}

export const ASSISTANT_TOOLS: AssistantToolMeta[] = [
  {
    id: 'chat',
    category: 'ai',
    nameBn: 'AI চ্যাট',
    nameEn: 'AI Chat',
    descBn: 'প্রশ্নের উত্তর — AI সংযুক্ত হলে চালু হবে; এখনো সংযুক্ত হয়নি।',
    descEn: 'Answers to questions — starts when AI is connected; not connected yet.',
    needsLogin: false,
  },
  {
    id: 'calculator',
    category: 'calculate',
    nameBn: 'হিসাব-নিকাশ',
    nameEn: 'Calculators',
    descBn: 'EMI, সুদ, BMI ও শতাংশ — এখনই কাজ করে।',
    descEn: 'EMI, interest, BMI and percent — works right now.',
    needsLogin: false,
  },
  {
    id: 'converter',
    category: 'calculate',
    nameBn: 'কনভার্টার',
    nameEn: 'Converters',
    descBn: 'দৈর্ঘ্য, ওজন, তাপমাত্রা ও মুদ্রা রূপান্তর।',
    descEn: 'Length, weight, temperature and currency conversion.',
    needsLogin: false,
  },
  {
    id: 'budget',
    category: 'plan',
    nameBn: 'বাজেট পরিকল্পনা',
    nameEn: 'Budget Planner',
    descBn: 'আয়-ব্যয়ের হিসাব — মাস শেষে কত থাকবে, এক নজরে।',
    descEn: 'Income vs expenses — see what is left at month end.',
    needsLogin: false,
  },
  {
    id: 'planner',
    category: 'plan',
    nameBn: 'দিনের পরিকল্পনা',
    nameEn: 'Day Planner',
    descBn: 'আজকের কাজগুলো সময় অনুযায়ী সাজান।',
    descEn: 'Arrange today’s tasks by time.',
    needsLogin: false,
  },
  {
    id: 'letter',
    category: 'write',
    nameBn: 'চিঠি লেখা',
    nameEn: 'Letter Builder',
    descBn: 'তথ্য দিলেই সাজানো চিঠি তৈরি — বাংলা ও ইংরেজি।',
    descEn: 'Fill in the details and get a formatted letter — Bangla and English.',
    needsLogin: false,
  },
  {
    id: 'application',
    category: 'write',
    nameBn: 'আবেদনপত্র',
    nameEn: 'Application Builder',
    descBn: 'চাকরি, ছুটি বা অন্য আবেদনের খসড়া তৈরি।',
    descEn: 'Draft a job, leave or general application.',
    needsLogin: false,
  },
  {
    id: 'cv',
    category: 'write',
    nameBn: 'সিভি তৈরি',
    nameEn: 'CV Builder',
    descBn: 'তথ্য দিয়ে সাজানো সিভি তৈরি করুন।',
    descEn: 'Build a tidy CV from your details.',
    needsLogin: false,
  },
  {
    id: 'email',
    category: 'write',
    nameBn: 'ইমেইল লেখা',
    nameEn: 'Email Builder',
    descBn: 'পেশাদার ইমেইলের খসড়া — বিষয়, সম্ভাষণ, সমাপ্তিসহ।',
    descEn: 'Draft a professional email — subject, greeting and closing included.',
    needsLogin: false,
  },
  {
    id: 'phrases',
    category: 'learn',
    nameBn: 'বাংলা–English কথোপকথন',
    nameEn: 'Bangla–English Phrases',
    descBn: 'প্রতিদিনের প্রয়োজনীয় বাক্য — বাংলা ও ইংরেজি।',
    descEn: 'Everyday sentences — Bangla and English.',
    needsLogin: false,
  },
  {
    id: 'study',
    category: 'learn',
    nameBn: 'পড়ার পরিকল্পনা',
    nameEn: 'Study Plan',
    descBn: 'যেকোনো বিষয়ের পড়ার রূপরেখা তৈরি — টেমপ্লেট, AI উত্তর নয়।',
    descEn: 'A study outline for any topic — a template, not an AI answer.',
    needsLogin: false,
  },
];

export type Result<T> =
  | { ok: true; value: T }
  | { ok: false; errorBn: string; errorEn: string };

function fail<T>(errorBn: string, errorEn: string): Result<T> {
  return { ok: false, errorBn, errorEn };
}

function isFiniteNumber(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n);
}

function validAmount(n: unknown, fieldBn: string, fieldEn: string): Result<number> {
  if (!isFiniteNumber(n)) return fail(`${fieldBn} সঠিক সংখ্যায় লিখুন।`, `Enter ${fieldEn} as a number.`);
  if (n < 0) return fail(`${fieldBn} ঋণাত্মক হতে পারবে না।`, `${fieldEn} cannot be negative.`);
  return { ok: true, value: n };
}

// ---------------------------------------------------------------------------
// Calculators
// ---------------------------------------------------------------------------

export interface EmiResult {
  emi: number;
  totalPayable: number;
  totalInterest: number;
}

/** Monthly EMI for a loan. Annual rate is a percent (e.g. 12 = 12%). */
export function calcEmi(principal: number, annualRatePct: number, months: number): Result<EmiResult> {
  const p = validAmount(principal, 'আসল', 'principal');
  if (!p.ok) return p;
  const r = validAmount(annualRatePct, 'সুদের হার', 'interest rate');
  if (!r.ok) return r;
  if (!isFiniteNumber(months) || months <= 0 || !Number.isInteger(months)) {
    return fail('মেয়াদ পূর্ণ মাসে লিখুন (১ বা তার বেশি)।', 'Enter the term in whole months (1 or more).');
  }
  const monthlyRate = r.value / 100 / 12;
  let emi: number;
  if (monthlyRate === 0) {
    emi = p.value / months;
  } else {
    const factor = Math.pow(1 + monthlyRate, months);
    emi = (p.value * monthlyRate * factor) / (factor - 1);
  }
  const totalPayable = emi * months;
  return { ok: true, value: { emi, totalPayable, totalInterest: totalPayable - p.value } };
}

export interface InterestResult {
  interest: number;
  total: number;
}

export function calcSimpleInterest(principal: number, annualRatePct: number, years: number): Result<InterestResult> {
  const p = validAmount(principal, 'আসল', 'principal');
  if (!p.ok) return p;
  const r = validAmount(annualRatePct, 'সুদের হার', 'interest rate');
  if (!r.ok) return r;
  if (!isFiniteNumber(years) || years <= 0) {
    return fail('সময় ০-এর বেশি বছরে লিখুন।', 'Enter a time greater than 0 years.');
  }
  const interest = (p.value * r.value * years) / 100;
  return { ok: true, value: { interest, total: p.value + interest } };
}

export function calcCompoundInterest(
  principal: number,
  annualRatePct: number,
  years: number,
  compoundsPerYear: number,
): Result<InterestResult> {
  const p = validAmount(principal, 'আসল', 'principal');
  if (!p.ok) return p;
  const r = validAmount(annualRatePct, 'সুদের হার', 'interest rate');
  if (!r.ok) return r;
  if (!isFiniteNumber(years) || years <= 0) {
    return fail('সময় ০-এর বেশি বছরে লিখুন।', 'Enter a time greater than 0 years.');
  }
  if (!isFiniteNumber(compoundsPerYear) || compoundsPerYear <= 0 || !Number.isInteger(compoundsPerYear)) {
    return fail('বছরে কতবার সুদ যোগ হয়, পূর্ণ সংখ্যায় লিখুন।', 'Enter how many times a year interest compounds, as a whole number.');
  }
  const total = p.value * Math.pow(1 + r.value / 100 / compoundsPerYear, compoundsPerYear * years);
  return { ok: true, value: { interest: total - p.value, total } };
}

export interface BmiResult {
  bmi: number;
  categoryBn: string;
  categoryEn: string;
}

export function calcBmi(weightKg: number, heightCm: number): Result<BmiResult> {
  const w = validAmount(weightKg, 'ওজন', 'weight');
  if (!w.ok) return w;
  const h = validAmount(heightCm, 'উচ্চতা', 'height');
  if (!h.ok) return h;
  if (w.value <= 0 || h.value <= 0) {
    return fail('ওজন ও উচ্চতা ০-এর বেশি হতে হবে।', 'Weight and height must be greater than 0.');
  }
  const heightM = h.value / 100;
  const bmi = w.value / (heightM * heightM);
  let categoryBn = 'স্বাভাবিক';
  let categoryEn = 'Normal';
  if (bmi < 18.5) {
    categoryBn = 'ওজন কম';
    categoryEn = 'Underweight';
  } else if (bmi >= 25 && bmi < 30) {
    categoryBn = 'ওজন বেশি';
    categoryEn = 'Overweight';
  } else if (bmi >= 30) {
    categoryBn = 'স্থূলতা';
    categoryEn = 'Obese';
  }
  return { ok: true, value: { bmi, categoryBn, categoryEn } };
}

/** What percent `part` is of `whole`. */
export function calcPercentage(part: number, whole: number): Result<number> {
  if (!isFiniteNumber(part) || !isFiniteNumber(whole)) {
    return fail('দুটোই সঠিক সংখ্যায় লিখুন।', 'Enter both values as numbers.');
  }
  if (whole === 0) return fail('মোট (হর) ০ হতে পারবে না।', 'The total (denominator) cannot be 0.');
  return { ok: true, value: (part / whole) * 100 };
}

// ---------------------------------------------------------------------------
// Converters — factors are exact definitions, not live data.
// Currency is DIFFERENT: rates change daily, so the user enters today's
// rate. We never present a stored rate as a live rate.
// ---------------------------------------------------------------------------

const LENGTH_IN_METRES: Record<string, number> = {
  mm: 0.001,
  cm: 0.01,
  m: 1,
  km: 1000,
  inch: 0.0254,
  foot: 0.3048,
  yard: 0.9144,
  mile: 1609.344,
};

const WEIGHT_IN_GRAMS: Record<string, number> = {
  g: 1,
  kg: 1000,
  ton: 1000000,
  oz: 28.349523125,
  lb: 453.59237,
};

export function convertLength(value: number, from: string, to: string): Result<number> {
  if (!isFiniteNumber(value)) return fail('সংখ্যায় লিখুন।', 'Enter a number.');
  if (!(from in LENGTH_IN_METRES) || !(to in LENGTH_IN_METRES)) {
    return fail('একক ঠিকভাবে বেছে নিন।', 'Choose the units correctly.');
  }
  return { ok: true, value: (value * LENGTH_IN_METRES[from]) / LENGTH_IN_METRES[to] };
}

export function convertWeight(value: number, from: string, to: string): Result<number> {
  if (!isFiniteNumber(value)) return fail('সংখ্যায় লিখুন।', 'Enter a number.');
  if (!(from in WEIGHT_IN_GRAMS) || !(to in WEIGHT_IN_GRAMS)) {
    return fail('একক ঠিকভাবে বেছে নিন।', 'Choose the units correctly.');
  }
  return { ok: true, value: (value * WEIGHT_IN_GRAMS[from]) / WEIGHT_IN_GRAMS[to] };
}

export function convertTemperature(value: number, from: 'C' | 'F' | 'K', to: 'C' | 'F' | 'K'): Result<number> {
  if (!isFiniteNumber(value)) return fail('সংখ্যায় লিখুন।', 'Enter a number.');
  let celsius: number;
  if (from === 'C') celsius = value;
  else if (from === 'F') celsius = ((value - 32) * 5) / 9;
  else celsius = value - 273.15;
  if (celsius < -273.15) {
    return fail('তাপমাত্রা পরম শূন্যের (−২৭৩.১৫°C) নিচে হতে পারে না।', 'Temperature cannot be below absolute zero (−273.15°C).');
  }
  if (to === 'C') return { ok: true, value: celsius };
  if (to === 'F') return { ok: true, value: (celsius * 9) / 5 + 32 };
  return { ok: true, value: celsius + 273.15 };
}

/**
 * Currency conversion with a USER-ENTERED rate: `rate` = how many units
 * of the target currency 1 unit of the source buys. We store no rate
 * and never claim a stored rate is today's rate.
 */
export function convertCurrency(amount: number, rate: number): Result<number> {
  const a = validAmount(amount, 'পরিমাণ', 'amount');
  if (!a.ok) return a;
  if (!isFiniteNumber(rate) || rate <= 0) {
    return fail('আজকের বিনিময় হার (০-এর বেশি) লিখুন।', 'Enter today’s exchange rate (greater than 0).');
  }
  return { ok: true, value: a.value * rate };
}

export const CURRENCY_RATE_NOTE_BN =
  'বিনিময় হার প্রতিদিন বদলায় — ব্যাংক বা নির্ভরযোগ্য উৎস থেকে আজকের হার দেখে এখানে লিখুন। এখানে কোনো হার সংরক্ষিত নেই।';
export const CURRENCY_RATE_NOTE_EN =
  'Exchange rates change daily — check today’s rate from your bank or a reliable source and enter it here. No rate is stored here.';

// ---------------------------------------------------------------------------
// Budget planner (session-only: nothing is saved anywhere)
// ---------------------------------------------------------------------------

export interface BudgetExpense {
  label: string;
  amount: number;
}

export interface BudgetSummary {
  income: number;
  totalExpenses: number;
  remaining: number;
  savingsRatePct: number;
  overBudget: boolean;
}

export function summarizeBudget(income: number, expenses: BudgetExpense[]): Result<BudgetSummary> {
  const inc = validAmount(income, 'মাসিক আয়', 'monthly income');
  if (!inc.ok) return inc;
  let total = 0;
  for (const e of expenses) {
    if (!e.label.trim()) return fail('প্রতিটি খরচের নাম লিখুন।', 'Enter a name for every expense.');
    const a = validAmount(e.amount, 'খরচের পরিমাণ', 'expense amount');
    if (!a.ok) return a;
    total += a.value;
  }
  const remaining = inc.value - total;
  return {
    ok: true,
    value: {
      income: inc.value,
      totalExpenses: total,
      remaining,
      savingsRatePct: inc.value === 0 ? 0 : (remaining / inc.value) * 100,
      overBudget: remaining < 0,
    },
  };
}

// ---------------------------------------------------------------------------
// Day planner — sorts tasks by time; no AI, just ordering.
// ---------------------------------------------------------------------------

export interface DayTask {
  time: string; // HH:MM, 24-hour
  label: string;
}

export interface PlannedDay {
  tasks: DayTask[];
  count: number;
}

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export function buildDayPlan(tasks: DayTask[]): Result<PlannedDay> {
  const cleaned: DayTask[] = [];
  for (const task of tasks) {
    if (!task.label.trim()) continue;
    if (!TIME_RE.test(task.time.trim())) {
      return fail(`সময় HH:MM আকারে লিখুন (যেমন ০৯:৩০ বা 09:30)।`, `Enter time as HH:MM (e.g. 09:30).`);
    }
    cleaned.push({ time: task.time.trim(), label: task.label.trim() });
  }
  cleaned.sort((a, b) => (a.time < b.time ? -1 : a.time > b.time ? 1 : 0));
  return { ok: true, value: { tasks: cleaned, count: cleaned.length } };
}

// ---------------------------------------------------------------------------
// Document builders — fill a fixed, honest template with the user's own
// words. The template is deterministic; nothing here is "written by AI".
// ---------------------------------------------------------------------------

export interface LetterFields {
  senderName: string;
  senderAddress: string;
  date: string;
  recipientName: string;
  recipientAddress: string;
  subject: string;
  body: string;
  lang: 'bn' | 'en';
}

export function buildLetter(f: LetterFields): Result<string> {
  for (const [key, bn, en] of [
    ['senderName', 'প্রেরকের নাম', 'sender name'],
    ['subject', 'বিষয়', 'subject'],
    ['body', 'চিঠির মূল বক্তব্য', 'letter body'],
  ] as const) {
    if (!f[key].trim()) return fail(`${bn} লিখুন।`, `Enter the ${en}.`);
  }
  if (f.lang === 'bn') {
    return {
      ok: true,
      value: [
        f.senderName,
        f.senderAddress,
        f.date,
        '',
        `প্রতি,`,
        f.recipientName,
        f.recipientAddress,
        '',
        `বিষয়: ${f.subject}`,
        '',
        `জনাব/জনাবা,`,
        f.body,
        '',
        `বিনীত,`,
        f.senderName,
      ].join('\n'),
    };
  }
  return {
    ok: true,
    value: [
      f.senderName,
      f.senderAddress,
      f.date,
      '',
      `To,`,
      f.recipientName,
      f.recipientAddress,
      '',
      `Subject: ${f.subject}`,
      '',
      `Dear Sir/Madam,`,
      f.body,
      '',
      `Sincerely,`,
      f.senderName,
    ].join('\n'),
  };
}

export interface ApplicationFields {
  applicantName: string;
  applicantAddress: string;
  date: string;
  authorityName: string;
  authorityAddress: string;
  purpose: string;
  details: string;
  lang: 'bn' | 'en';
}

export function buildApplication(f: ApplicationFields): Result<string> {
  for (const [key, bn, en] of [
    ['applicantName', 'আবেদনকারীর নাম', 'applicant name'],
    ['purpose', 'আবেদনের উদ্দেশ্য', 'purpose of the application'],
    ['details', 'বিস্তারিত', 'details'],
  ] as const) {
    if (!f[key].trim()) return fail(`${bn} লিখুন।`, `Enter the ${en}.`);
  }
  if (f.lang === 'bn') {
    return {
      ok: true,
      value: [
        f.applicantName,
        f.applicantAddress,
        f.date,
        '',
        `বরাবর,`,
        f.authorityName,
        f.authorityAddress,
        '',
        `বিষয়: ${f.purpose}`,
        '',
        `জনাব,`,
        f.details,
        '',
        `অতএব, অনুগ্রহ করে আমার আবেদনটি বিবেচনা করবেন।`,
        '',
        `বিনীত নিবেদক,`,
        f.applicantName,
      ].join('\n'),
    };
  }
  return {
    ok: true,
    value: [
      f.applicantName,
      f.applicantAddress,
      f.date,
      '',
      `To,`,
      f.authorityName,
      f.authorityAddress,
      '',
      `Subject: ${f.purpose}`,
      '',
      `Respected Sir/Madam,`,
      f.details,
      '',
      `I therefore request you to kindly consider my application.`,
      '',
      `Sincerely yours,`,
      f.applicantName,
    ].join('\n'),
  };
}

export interface EmailFields {
  to: string;
  subject: string;
  greeting: string;
  body: string;
  closing: string;
  senderName: string;
  lang: 'bn' | 'en';
}

export function buildEmail(f: EmailFields): Result<string> {
  for (const [key, bn, en] of [
    ['subject', 'বিষয়', 'subject'],
    ['body', 'ইমেইলের মূল বক্তব্য', 'email body'],
    ['senderName', 'প্রেরকের নাম', 'sender name'],
  ] as const) {
    if (!f[key].trim()) return fail(`${bn} লিখুন।`, `Enter the ${en}.`);
  }
  const greeting = f.greeting.trim() || (f.lang === 'bn' ? 'জনাব/জনাবা,' : 'Dear Sir/Madam,');
  const closing = f.closing.trim() || (f.lang === 'bn' ? 'ধন্যবাদান্তে,' : 'Thank you,');
  return {
    ok: true,
    value: [
      f.to.trim() ? `To: ${f.to.trim()}` : '',
      `Subject: ${f.subject.trim()}`,
      '',
      greeting,
      '',
      f.body.trim(),
      '',
      closing,
      f.senderName.trim(),
    ]
      .filter((line, i) => line !== '' || i > 0)
      .join('\n'),
  };
}

export interface CvFields {
  name: string;
  phone: string;
  email: string;
  address: string;
  objective: string;
  education: string[];
  skills: string[];
  experience: string[];
  lang: 'bn' | 'en';
}

export function buildCv(f: CvFields): Result<string> {
  if (!f.name.trim()) return fail('নাম লিখুন।', 'Enter your name.');
  if (!f.objective.trim()) return fail('উদ্দেশ্য (objective) লিখুন।', 'Enter your objective.');
  const section = (titleBn: string, titleEn: string, items: string[]): string[] => {
    const title = f.lang === 'bn' ? titleBn : titleEn;
    const lines = items.map((s) => s.trim()).filter(Boolean);
    if (lines.length === 0) return [];
    return ['', title, ...lines.map((l) => `• ${l}`)];
  };
  const head =
    f.lang === 'bn'
      ? [f.name.trim(), `ফোন: ${f.phone.trim()}`, `ইমেইল: ${f.email.trim()}`, f.address.trim(), '', 'উদ্দেশ্য', f.objective.trim()]
      : [f.name.trim(), `Phone: ${f.phone.trim()}`, `Email: ${f.email.trim()}`, f.address.trim(), '', 'Objective', f.objective.trim()];
  return {
    ok: true,
    value: [
      ...head,
      ...section('শিক্ষা', 'Education', f.education),
      ...section('দক্ষতা', 'Skills', f.skills),
      ...section('অভিজ্ঞতা', 'Experience', f.experience),
    ].join('\n'),
  };
}

// ---------------------------------------------------------------------------
// Phrasebook — fixed, verified everyday sentences. Not translation AI:
// a lookup list, honestly labelled as such.
// ---------------------------------------------------------------------------

export interface Phrase {
  bn: string;
  en: string;
  categoryBn: string;
  categoryEn: string;
}

export const COMMON_PHRASES: Phrase[] = [
  { bn: 'আসসালামু আলাইকুম। আপনি কেমন আছেন?', en: 'Hello. How are you?', categoryBn: 'শুভেচ্ছা', categoryEn: 'Greetings' },
  { bn: 'আমার নাম …।', en: 'My name is ….', categoryBn: 'শুভেচ্ছা', categoryEn: 'Greetings' },
  { bn: 'আপনার সঙ্গে দেখা করে ভালো লাগলো।', en: 'Nice to meet you.', categoryBn: 'শুভেচ্ছা', categoryEn: 'Greetings' },
  { bn: 'দয়া করে সাহায্য করবেন?', en: 'Could you please help me?', categoryBn: 'সাহায্য', categoryEn: 'Help' },
  { bn: 'এটা কত টাকা?', en: 'How much does this cost?', categoryBn: 'বাজার', categoryEn: 'Shopping' },
  { bn: 'আমি এটা কিনতে চাই।', en: 'I would like to buy this.', categoryBn: 'বাজার', categoryEn: 'Shopping' },
  { bn: 'দাম কি একটু কম হবে?', en: 'Can the price be a little lower?', categoryBn: 'বাজার', categoryEn: 'Shopping' },
  { bn: 'বাস স্টেশন কোথায়?', en: 'Where is the bus station?', categoryBn: 'ভ্রমণ', categoryEn: 'Travel' },
  { bn: 'আমি হারিয়ে গেছি।', en: 'I am lost.', categoryBn: 'ভ্রমণ', categoryEn: 'Travel' },
  { bn: 'হাসপাতাল কোথায়?', en: 'Where is the hospital?', categoryBn: 'ভ্রমণ', categoryEn: 'Travel' },
  { bn: 'আমি ইংরেজি শিখছি।', en: 'I am learning English.', categoryBn: 'পড়াশোনা', categoryEn: 'Study' },
  { bn: 'এই শব্দের অর্থ কী?', en: 'What does this word mean?', categoryBn: 'পড়াশোনা', categoryEn: 'Study' },
  { bn: 'আমাকে বুঝিয়ে বলবেন?', en: 'Could you please explain it to me?', categoryBn: 'পড়াশোনা', categoryEn: 'Study' },
  { bn: 'আমি আগামীকাল আসব।', en: 'I will come tomorrow.', categoryBn: 'কাজ', categoryEn: 'Work' },
  { bn: 'কাজটি শেষ হয়েছে।', en: 'The work is done.', categoryBn: 'কাজ', categoryEn: 'Work' },
  { bn: 'আমার একটু সময় লাগবে।', en: 'I need a little more time.', categoryBn: 'কাজ', categoryEn: 'Work' },
  { bn: 'ধন্যবাদ।', en: 'Thank you.', categoryBn: 'শুভেচ্ছা', categoryEn: 'Greetings' },
  { bn: 'দুঃখিত।', en: 'Sorry.', categoryBn: 'শুভেচ্ছা', categoryEn: 'Greetings' },
  { bn: 'আবার দেখা হবে।', en: 'See you again.', categoryBn: 'শুভেচ্ছা', categoryEn: 'Greetings' },
  { bn: 'আমি বাংলা বলতে পারি।', en: 'I can speak Bangla.', categoryBn: 'পড়াশোনা', categoryEn: 'Study' },
];

// ---------------------------------------------------------------------------
// Study plan — a deterministic outline template for any topic. It is a
// planning template, NOT an AI-written lesson: it contains no facts
// about the topic, only the steps to study it.
// ---------------------------------------------------------------------------

export function buildStudyPlan(topic: string, lang: 'bn' | 'en'): Result<string> {
  if (!topic.trim()) return fail('বিষয়ের নাম লিখুন।', 'Enter the topic name.');
  const t = topic.trim();
  if (lang === 'bn') {
    return {
      ok: true,
      value: [
        `পড়ার পরিকল্পনা: ${t}`,
        '',
        '১. লক্ষ্য ঠিক করুন — এই বিষয় থেকে আপনি কী শিখতে চান, এক লাইনে লিখুন।',
        '২. মূল ধারণা — বই বা নির্ভরযোগ্য উৎস থেকে মূল সংজ্ঞা ও ধারণাগুলো নোট করুন।',
        '৩. উদাহরণ — প্রতিটি ধারণার একটি করে বাস্তব উদাহরণ লিখুন।',
        '৪. অনুশীলন — বিষয়টির ১০টি প্রশ্ন নিজে তৈরি করে উত্তর লিখুন।',
        '৫. ভুল থেকে শেখা — ভুল উত্তরগুলো আলাদা খাতায় লিখে আবার পড়ুন।',
        '৬. পুনরাবৃত্তি — ১ দিন পর, ৩ দিন পর ও ৭ দিন পর আবার পড়ুন।',
        '৭. নিজেকে পরীক্ষা — বই বন্ধ করে মূল বিষয়গুলো মুখে বলুন।',
        '',
        'এটি একটি পরিকল্পনার ছক — বিষয়ের তথ্য আপনার বই বা শিক্ষকের কাছ থেকে নিন।',
      ].join('\n'),
    };
  }
  return {
    ok: true,
    value: [
      `Study plan: ${t}`,
      '',
      '1. Set a goal — write in one line what you want to learn from this topic.',
      '2. Key ideas — note the main definitions and ideas from your book or a reliable source.',
      '3. Examples — write one real example for each idea.',
      '4. Practice — write 10 questions on the topic and answer them yourself.',
      '5. Learn from mistakes — copy wrong answers into a separate notebook and re-read them.',
      '6. Repeat — revise after 1 day, 3 days and 7 days.',
      '7. Test yourself — close the book and say the main points aloud.',
      '',
      'This is a planning template — take the facts of the topic from your book or teacher.',
    ].join('\n'),
  };
}
