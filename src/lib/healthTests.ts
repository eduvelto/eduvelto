// Eduvelto — Lab Test Result Checker data + engine (27 Nov 2026).
//
// ONE shared data file for the `lab-test-result-checker` tool: 37 common
// lab tests in Bangladesh, each with bn+en copy, a normal range, per-band
// meanings + next steps, red-flag values, preparation checklist, repeat
// advice, approximate BDT cost and dated sources.
//
// SOURCES (checked 27 Nov 2026, 2-3 independent authoritative sources
// per test — see each test's `sources` field): ADA Standards of Care in
// Diabetes 2025/2026, MedlinePlus (U.S. National Library of Medicine),
// Mayo Clinic Laboratories, NHLBI/NIH, Cleveland Clinic, ACP reference
// ranges, StatPearls (NCBI Bookshelf), CDC, WHO, KDIGO, British Thyroid
// Foundation, University of Utah laboratory reference, Medscape lab
// values. Where sources disagree on a range, the most widely-used
// standard range is used and the variation is recorded in
// `rangeNoteBn/En`. NO range is invented: a test with no reliable
// agreement is marked coming-soon instead (none needed so far — every
// test below reached agreement across at least 2 sources).
//
// HONESTY RULES: every meaning uses "হতে পারে / may" language — never
// a diagnosis, never a disease claim. Costs are approximate
// (আনুমানিক, ল্যাবভেদে ভিন্ন, Nov 2026). The range printed on the
// user's own lab report always wins over these figures.
//
// Pure data + pure functions only: no network, no storage, no DOM.
// History persistence (localStorage) lives in the tool component.

export type Sex = 'male' | 'female';
export type ResultBand = 'normal' | 'low' | 'high' | 'critical';

export type LabPanelId =
  | 'diabetes'
  | 'cbc'
  | 'lipid'
  | 'liver'
  | 'kidney'
  | 'thyroid'
  | 'electrolyte'
  | 'vitamin'
  | 'urine'
  | 'infection'
  | 'other';

export interface LabBand {
  /** Inclusive lower bound (undefined = no lower bound). */
  min?: number;
  /** Exclusive upper bound (undefined = no upper bound). */
  max?: number;
  band: ResultBand;
  labelBn: string;
  labelEn: string;
  meaningBn: string;
  meaningEn: string;
  actionsBn: string;
  actionsEn: string;
  /** True when this band needs urgent doctor care. */
  redFlag?: boolean;
}

export interface LabCategory {
  /** Value exactly as it appears on a report, e.g. 'Negative', '1+', 'A+'. */
  value: string;
  labelBn: string;
  labelEn: string;
  band: ResultBand;
  meaningBn: string;
  meaningEn: string;
  actionsBn: string;
  actionsEn: string;
  redFlag?: boolean;
}

export interface LabTestPrep {
  waterBn: string;
  waterEn: string;
  medicinesBn: string;
  medicinesEn: string;
  bestTimeBn: string;
  bestTimeEn: string;
  notesBn: string;
  notesEn: string;
}

export interface LabTest {
  id: string;
  panel: LabPanelId;
  nameBn: string;
  nameEn: string;
  shortName: string;
  keywordsBn: string[];
  keywordsEn: string[];
  measuresBn: string;
  measuresEn: string;
  whyBn: string;
  whyEn: string;
  sampleBn: string;
  sampleEn: string;
  /** Fasting hours required, or null when no fasting is needed. */
  fastingHours: number | null;
  kind: 'numeric' | 'categorical';
  /** Primary unit for numeric tests. */
  unit?: string;
  /** Other units the user may enter (converted to the primary unit). */
  altUnits?: string[];
  /** Static bands (numeric tests without age/sex variation). */
  bands?: LabBand[];
  /** Age/sex-specific bands. Called with no args it returns the
   *  combined adult default (widest of the sex-specific ranges). */
  bandsFor?: (age?: number, sex?: Sex) => LabBand[];
  /** Categorical results (urine dipstick, serology, blood group). */
  categories?: LabCategory[];
  rangeTextBn: string;
  rangeTextEn: string;
  rangeNoteBn?: string;
  rangeNoteEn?: string;
  redFlagBn: string;
  redFlagEn: string;
  prep: LabTestPrep;
  repeatBn: string;
  repeatEn: string;
  /** Approximate cost in BDT (Nov 2026, lab-dependent), or null when
   *  the test is normally reported together with another test. */
  costBdt: { min: number; max: number } | null;
  costNoteBn?: string;
  costNoteEn?: string;
  /** 2-3 independent authoritative sources, newest first. */
  sources: string[];
  /** Date the sources were last checked (ISO). */
  sourceDate: string;
  questionsBn: string[];
  questionsEn: string[];
}

export interface LabPanel {
  id: LabPanelId;
  titleBn: string;
  titleEn: string;
  blurbBn: string;
  blurbEn: string;
}

export const LAB_PANELS: LabPanel[] = [
  { id: 'diabetes', titleBn: 'ডায়াবেটিস', titleEn: 'Diabetes', blurbBn: 'রক্তের শর্করা ও HbA1c', blurbEn: 'Blood sugar and HbA1c' },
  { id: 'cbc', titleBn: 'সিবিসি (রক্তের গণনা)', titleEn: 'CBC (Blood Count)', blurbBn: 'হিমোগ্লোবিন, শ্বেতকণিকা, প্লেটলেট', blurbEn: 'Haemoglobin, white cells, platelets' },
  { id: 'lipid', titleBn: 'লিপিড (কোলেস্টেরল)', titleEn: 'Lipid (Cholesterol)', blurbBn: 'কোলেস্টেরল ও ট্রাইগ্লিসারাইড', blurbEn: 'Cholesterol and triglycerides' },
  { id: 'liver', titleBn: 'লিভার', titleEn: 'Liver', blurbBn: 'SGPT, SGOT, বিলিরুবিন', blurbEn: 'SGPT, SGOT, bilirubin' },
  { id: 'kidney', titleBn: 'কিডনি', titleEn: 'Kidney', blurbBn: 'ক্রিয়েটিনিন, ইউরিয়া, eGFR', blurbEn: 'Creatinine, urea, eGFR' },
  { id: 'thyroid', titleBn: 'থাইরয়েড', titleEn: 'Thyroid', blurbBn: 'TSH, T3, T4', blurbEn: 'TSH, T3, T4' },
  { id: 'electrolyte', titleBn: 'ইলেক্ট্রোলাইট', titleEn: 'Electrolytes', blurbBn: 'সোডিয়াম, পটাশিয়াম, ক্যালসিয়াম', blurbEn: 'Sodium, potassium, calcium' },
  { id: 'vitamin', titleBn: 'ভিটামিন ও প্রদাহ', titleEn: 'Vitamins & Inflammation', blurbBn: 'ভিটামিন ডি, B12, ফেরিটিন, CRP', blurbEn: 'Vitamin D, B12, ferritin, CRP' },
  { id: 'urine', titleBn: 'প্রস্রাব পরীক্ষা', titleEn: 'Urine Tests', blurbBn: 'প্রস্রাবে প্রোটিন ও সুগার', blurbEn: 'Protein and sugar in urine' },
  { id: 'infection', titleBn: 'সংক্রমণ', titleEn: 'Infection', blurbBn: 'ডেঙ্গু NS1, হেপাটাইটিস বি', blurbEn: 'Dengue NS1, hepatitis B' },
  { id: 'other', titleBn: 'অন্যান্য', titleEn: 'Other', blurbBn: 'রক্তের গ্রুপ, গর্ভাবস্থা', blurbEn: 'Blood group, pregnancy' },
];

/** Shared "next step" lines, so band actions stay consistent. */
const NEXT = {
  normal: {
    bn: 'স্বাভাবিক সীমায় আছে — নিয়মিত চেকআপ চালিয়ে যান, আর রিপোর্টটি সংরক্ষণ করুন।',
    en: 'Within the normal range — keep up regular check-ups and save the report.',
  },
  doctorSoon: {
    bn: 'শীঘ্রই ডাক্তার দেখান এবং রিপোর্টটি সঙ্গে নিন। নিজে ওষুধ শুরু বা বন্ধ করবেন না।',
    en: 'See a doctor soon and take the report with you. Do not start or stop any medicine on your own.',
  },
  repeatSoon: {
    bn: 'ডাক্তারের পরামর্শে ২–৪ সপ্তাহ পর আবার পরীক্ষা করে দেখুন মানটা একই থাকে কি না।',
    en: 'On a doctor’s advice, repeat the test in 2–4 weeks to see whether the value stays the same.',
  },
  urgent: {
    bn: 'আজই ডাক্তার দেখান — জরুরি বিভাগে যান যদি শ্বাসকষ্ট, বুকে ব্যথা, অজ্ঞান ভাব বা বেশি রক্তপাত থাকে।',
    en: 'See a doctor today — go to emergency care if there is breathlessness, chest pain, fainting or heavy bleeding.',
  },
  lifestyle: {
    bn: 'খাবার, হাঁটাচলা ও ওজনের দিকে নজর দিন এবং ডাক্তারের পরামর্শে ফলো-আপ করুন।',
    en: 'Mind food, walking and weight, and follow up on a doctor’s advice.',
  },
} as const;

/** Compact band builder: min inclusive, max exclusive. */
function band(
  min: number | undefined,
  max: number | undefined,
  b: ResultBand,
  labelBn: string,
  labelEn: string,
  meaningBn: string,
  meaningEn: string,
  actions: { bn: string; en: string },
  redFlag = false,
): LabBand {
  return { min, max, band: b, labelBn, labelEn, meaningBn, meaningEn, actionsBn: actions.bn, actionsEn: actions.en, redFlag };
}

function cat(
  value: string,
  labelBn: string,
  labelEn: string,
  b: ResultBand,
  meaningBn: string,
  meaningEn: string,
  actions: { bn: string; en: string },
  redFlag = false,
): LabCategory {
  return { value, labelBn, labelEn, band: b, meaningBn, meaningEn, actionsBn: actions.bn, actionsEn: actions.en, redFlag };
}

const CHECKED = '2026-11-27';
const COST_NOTE = {
  bn: 'আনুমানিক মূল্য, ল্যাবভেদে ভিন্ন হতে পারে (নভেম্বর ২০২৬)।',
  en: 'Approximate price, varies by lab (November 2026).',
};

// ---------------------------------------------------------------------------
// Diabetes panel
// Sources: ADA Standards of Care in Diabetes 2025/2026 (Diabetes Care /
// PMC); WHO; MedlinePlus. Fasting = no calories for at least 8 h (ADA).
// Hypoglycaemia alert <70 mg/dL, clinically significant <54 mg/dL (ADA).
// ---------------------------------------------------------------------------
const DIABETES_SOURCES = [
  'ADA Standards of Care in Diabetes 2025/2026 (Diabetes Care)',
  'MedlinePlus — Diabetes tests (U.S. National Library of Medicine)',
  'WHO — Diabetes fact sheet',
];

const FBS_BANDS: LabBand[] = [
  band(undefined, 54, 'critical', 'খুব কম — জরুরি', 'Very low — urgent',
    'রক্তের শর্করা খুব কম হতে পারে (হাইপোগ্লাইসেমিয়া)। ঘাম, কাঁপুনি, মাথা ঘোরা বা অজ্ঞান ভাব হতে পারে।',
    'Blood sugar may be very low (hypoglycaemia). Sweating, shaking, dizziness or fainting may occur.',
    NEXT.urgent, true),
  band(54, 70, 'low', 'কম', 'Low',
    'রক্তের শর্করা স্বাভাবিকের নিচে হতে পারে। খালি পেটে এমন হলে খাবার বা ডাক্তারের পরামর্শ দরকার হতে পারে।',
    'Blood sugar may be below normal. On an empty stomach this may need food or a doctor’s advice.',
    NEXT.doctorSoon),
  band(70, 100, 'normal', 'স্বাভাবিক', 'Normal',
    'খালি পেটের শর্করা স্বাভাবিক সীমায় আছে।',
    'Fasting sugar is within the normal range.',
    NEXT.normal),
  band(100, 126, 'high', 'সীমান্তে বেশি (প্রি-ডায়াবেটিস সীমা)', 'Borderline high (prediabetes range)',
    'প্রি-ডায়াবেটিসের সীমায় হতে পারে — ডায়াবেটিসের ঝুঁকি বেশি থাকতে পারে, তবে এ একাই রোগ নির্ণয় নয়।',
    'May be in the prediabetes range — diabetes risk may be higher, but this alone is not a diagnosis.',
    NEXT.lifestyle),
  band(126, 250, 'high', 'বেশি (ডায়াবেটিস সীমা)', 'High (diabetes range)',
    'ডায়াবেটিসের সীমায় হতে পারে। একবারের মানেই রোগ নির্ণয় হয় না — নিশ্চিত করতে আবার পরীক্ষা লাগে।',
    'May be in the diabetes range. One value alone does not diagnose diabetes — repeat testing is needed to confirm.',
    NEXT.doctorSoon),
  band(250, undefined, 'critical', 'খুব বেশি — জরুরি', 'Very high — urgent',
    'রক্তের শর্করা খুব বেশি হতে পারে। বমি, পেট ব্যথা, দ্রুত শ্বাস বা বেশি তৃষ্ণা থাকলে জরুরি চিকিৎসা দরকার হতে পারে।',
    'Blood sugar may be very high. Vomiting, stomach pain, fast breathing or extreme thirst may need urgent care.',
    NEXT.urgent, true),
];

const RBS_BANDS: LabBand[] = [
  band(undefined, 54, 'critical', 'খুব কম — জরুরি', 'Very low — urgent',
    'রক্তের শর্করা খুব কম হতে পারে (হাইপোগ্লাইসেমিয়া)।',
    'Blood sugar may be very low (hypoglycaemia).',
    NEXT.urgent, true),
  band(54, 70, 'low', 'কম', 'Low',
    'রক্তের শর্করা স্বাভাবিকের নিচে হতে পারে।',
    'Blood sugar may be below normal.',
    NEXT.doctorSoon),
  band(70, 140, 'normal', 'স্বাভাবিক', 'Normal',
    'খাবারের পরের শর্করা সাধারণ সীমায় আছে।',
    'Random sugar is within the usual range.',
    NEXT.normal),
  band(140, 200, 'high', 'সীমান্তে বেশি', 'Borderline high',
    'খাবারের পর শর্করা কিছুটা বেশি হতে পারে। ডায়াবেটিস আছে কি না, তা একাই বলে না।',
    'Sugar after food may be a little high. This alone does not say whether there is diabetes.',
    NEXT.lifestyle),
  band(200, 300, 'high', 'বেশি (ডায়াবেটিস সীমা)', 'High (diabetes range)',
    'লক্ষণ (ঘন ঘন প্রস্রাব, পিপাসা, ওজন কমা) থাকলে ডায়াবেটিসের সীমায় হতে পারে — নিশ্চিত করতে আরও পরীক্ষা লাগে।',
    'With symptoms (frequent urination, thirst, weight loss) this may be in the diabetes range — more tests are needed to confirm.',
    NEXT.doctorSoon),
  band(300, undefined, 'critical', 'খুব বেশি — জরুরি', 'Very high — urgent',
    'রক্তের শর্করা খুব বেশি হতে পারে — জরুরি চিকিৎসা দরকার হতে পারে।',
    'Blood sugar may be very high — urgent care may be needed.',
    NEXT.urgent, true),
];

const HBA1C_BANDS: LabBand[] = [
  band(undefined, 4, 'low', 'কম', 'Low',
    'HbA1c খুব কম হতে পারে — রক্তশূন্যতা বা অন্য কারণে এমন হতে পারে।',
    'HbA1c may be very low — anaemia or other causes may do this.',
    NEXT.doctorSoon),
  band(4, 5.7, 'normal', 'স্বাভাবিক', 'Normal',
    'গত ২–৩ মাসের গড় শর্করা স্বাভাবিক সীমায় আছে।',
    'Average sugar over the last 2–3 months is within the normal range.',
    NEXT.normal),
  band(5.7, 6.5, 'high', 'সীমান্তে বেশি (প্রি-ডায়াবেটিস সীমা)', 'Borderline high (prediabetes range)',
    'প্রি-ডায়াবেটিসের সীমায় হতে পারে — ডায়াবেটিসের ঝুঁকি বেশি থাকতে পারে।',
    'May be in the prediabetes range — diabetes risk may be higher.',
    NEXT.lifestyle),
  band(6.5, 9, 'high', 'বেশি (ডায়াবেটিস সীমা)', 'High (diabetes range)',
    'ডায়াবেটিসের সীমায় হতে পারে। একবারের মানেই রোগ নির্ণয় হয় না — নিশ্চিত করতে আবার পরীক্ষা লাগে।',
    'May be in the diabetes range. One value alone does not diagnose diabetes.',
    NEXT.doctorSoon),
  band(9, undefined, 'high', 'অনেক বেশি', 'Very high',
    'গড় শর্করা অনেক বেশি হতে পারে — ডায়াবেটিস থাকলে নিয়ন্ত্রণ ভালো নাও থাকতে পারে। শীঘ্রই ডাক্তার দেখান।',
    'Average sugar may be much too high — if there is diabetes, control may be poor. See a doctor soon.',
    NEXT.doctorSoon, true),
];

const OGTT_BANDS: LabBand[] = [
  band(undefined, 70, 'low', 'কম', 'Low',
    '২ ঘণ্টা পরের শর্করা কম হতে পারে।',
    'Sugar 2 hours after the glucose drink may be low.',
    NEXT.doctorSoon),
  band(70, 140, 'normal', 'স্বাভাবিক', 'Normal',
    'গ্লুকোজ খাওয়ার ২ ঘণ্টা পর শর্করা স্বাভাবিক সীমায় আছে।',
    'Sugar 2 hours after the glucose drink is within the normal range.',
    NEXT.normal),
  band(140, 200, 'high', 'সীমান্তে বেশি (IGT সীমা)', 'Borderline high (IGT range)',
    'গ্লুকোজ সহনশীলতা কম থাকার (IGT) সীমায় হতে পারে — ডায়াবেটিসের ঝুঁকি বেশি থাকতে পারে।',
    'May be in the impaired glucose tolerance (IGT) range — diabetes risk may be higher.',
    NEXT.lifestyle),
  band(200, undefined, 'high', 'বেশি (ডায়াবেটিস সীমা)', 'High (diabetes range)',
    'ডায়াবেটিসের সীমায় হতে পারে। একবারের মানেই রোগ নির্ণয় হয় না — নিশ্চিত করতে আরও পরীক্ষা লাগে।',
    'May be in the diabetes range. One value alone does not diagnose diabetes.',
    NEXT.doctorSoon),
];

// ---------------------------------------------------------------------------
// CBC panel
// Sources: MedlinePlus — CBC blood test; NHLBI/NIH — Blood Tests;
// Cleveland Clinic — Complete Blood Count; ACP reference ranges.
// Ranges vary by lab and altitude; the report's own range wins.
// ---------------------------------------------------------------------------
const CBC_SOURCES = [
  'MedlinePlus — CBC blood test (U.S. National Library of Medicine)',
  'Cleveland Clinic — Complete Blood Count (CBC)',
  'NHLBI/NIH — Blood Tests',
];

function hbBands(age?: number, sex?: Sex): LabBand[] {
  const low = sex === 'female' ? 12 : 13;
  const high = sex === 'female' ? 16 : 17;
  void age;
  return [
    band(undefined, 7, 'critical', 'খুব কম — জরুরি', 'Very low — urgent',
      'হিমোগ্লোবিন খুব কম হতে পারে (গুরুতর রক্তশূন্যতা)। শ্বাসকষ্ট বা বুকে ব্যথা থাকলে জরুরি চিকিৎসা দরকার হতে পারে।',
      'Haemoglobin may be very low (severe anaemia). Breathlessness or chest pain may need urgent care.',
      NEXT.urgent, true),
    band(7, low, 'low', 'কম', 'Low',
      'হিমোগ্লোবিন কম হতে পারে (রক্তশূন্যতা)। আয়রনের ঘাটতি, রক্তপাত বা অন্য কারণে এমন হতে পারে।',
      'Haemoglobin may be low (anaemia). Iron deficiency, bleeding or other causes may do this.',
      NEXT.doctorSoon),
    band(low, high + 0.01, 'normal', 'স্বাভাবিক', 'Normal',
      'হিমোগ্লোবিন স্বাভাবিক সীমায় আছে।',
      'Haemoglobin is within the normal range.',
      NEXT.normal),
    band(high + 0.01, 20, 'high', 'বেশি', 'High',
      'হিমোগ্লোবিন বেশি হতে পারে — পানিশূন্যতা, ধূমপান বা অন্য কারণে এমন হতে পারে।',
      'Haemoglobin may be high — dehydration, smoking or other causes may do this.',
      NEXT.doctorSoon),
    band(20, undefined, 'critical', 'খুব বেশি — জরুরি', 'Very high — urgent',
      'হিমোগ্লোবিন খুব বেশি হতে পারে — রক্ত ঘন হয়ে যাওয়ার ঝুঁকি থাকতে পারে।',
      'Haemoglobin may be very high — blood may be too thick.',
      NEXT.urgent, true),
  ];
}

const WBC_BANDS: LabBand[] = [
  band(undefined, 2000, 'critical', 'খুব কম — জরুরি', 'Very low — urgent',
    'শ্বেতকণিকা খুব কম হতে পারে — সংক্রমণের ঝুঁকি অনেক বেশি থাকতে পারে। জ্বর থাকলে জরুরি ডাক্তার দেখান।',
    'White cells may be very low — infection risk may be much higher. Fever needs urgent care.',
    NEXT.urgent, true),
  band(2000, 4000, 'low', 'কম', 'Low',
    'শ্বেতকণিকা কম হতে পারে — ভাইরাস সংক্রমণ, ওষুধ বা অন্য কারণে এমন হতে পারে।',
    'White cells may be low — viral infection, medicines or other causes may do this.',
    NEXT.doctorSoon),
  band(4000, 11001, 'normal', 'স্বাভাবিক', 'Normal',
    'শ্বেতকণিকা স্বাভাবিক সীমায় আছে।',
    'White cells are within the normal range.',
    NEXT.normal),
  band(11001, 30000, 'high', 'বেশি', 'High',
    'শ্বেতকণিকা বেশি হতে পারে — সংক্রমণ, প্রদাহ বা অন্য কারণে এমন হতে পারে।',
    'White cells may be high — infection, inflammation or other causes may do this.',
    NEXT.doctorSoon),
  band(30000, undefined, 'critical', 'খুব বেশি — জরুরি', 'Very high — urgent',
    'শ্বেতকণিকা খুব বেশি হতে পারে — জরুরি চিকিৎসা দরকার হতে পারে।',
    'White cells may be very high — urgent care may be needed.',
    NEXT.urgent, true),
];

function rbcBands(age?: number, sex?: Sex): LabBand[] {
  const low = sex === 'female' ? 4.0 : 4.5;
  const high = sex === 'female' ? 5.4 : 6.1;
  void age;
  return [
    band(undefined, low, 'low', 'কম', 'Low',
      'লোহিতকণিকা কম হতে পারে — রক্তশূন্যতার দিকে ইঙ্গিত করতে পারে।',
      'Red cells may be low — this may point to anaemia.',
      NEXT.doctorSoon),
    band(low, high + 0.01, 'normal', 'স্বাভাবিক', 'Normal',
      'লোহিতকণিকা স্বাভাবিক সীমায় আছে।',
      'Red cells are within the normal range.',
      NEXT.normal),
    band(high + 0.01, undefined, 'high', 'বেশি', 'High',
      'লোহিতকণিকা বেশি হতে পারে — পানিশূন্যতা বা অন্য কারণে এমন হতে পারে।',
      'Red cells may be high — dehydration or other causes may do this.',
      NEXT.doctorSoon),
  ];
}

const PLATELET_BANDS: LabBand[] = [
  band(undefined, 50000, 'critical', 'খুব কম — জরুরি', 'Very low — urgent',
    'প্লেটলেট খুব কম হতে পারে — রক্তপাতের ঝুঁকি থাকতে পারে। শরীরে দাগ, নাক/মাড়ি দিয়ে রক্ত পড়লে জরুরি ডাক্তার দেখান।',
    'Platelets may be very low — bleeding risk may be high. Bruises or nose/gum bleeding need urgent care.',
    NEXT.urgent, true),
  band(50000, 150000, 'low', 'কম', 'Low',
    'প্লেটলেট কম হতে পারে — ডেঙ্গু, ভাইরাস সংক্রমণ বা অন্য কারণে এমন হতে পারে।',
    'Platelets may be low — dengue, viral infection or other causes may do this.',
    NEXT.doctorSoon),
  band(150000, 400001, 'normal', 'স্বাভাবিক', 'Normal',
    'প্লেটলেট স্বাভাবিক সীমায় আছে।',
    'Platelets are within the normal range.',
    NEXT.normal),
  band(400001, 1000000, 'high', 'বেশি', 'High',
    'প্লেটলেট বেশি হতে পারে — প্রদাহ, সংক্রমণ বা অন্য কারণে এমন হতে পারে।',
    'Platelets may be high — inflammation, infection or other causes may do this.',
    NEXT.doctorSoon),
  band(1000000, undefined, 'critical', 'খুব বেশি — জরুরি', 'Very high — urgent',
    'প্লেটলেট খুব বেশি হতে পারে — রক্ত জমাটের ঝুঁকি থাকতে পারে।',
    'Platelets may be very high — clotting risk may be higher.',
    NEXT.urgent, true),
];

function esrBands(age?: number, sex?: Sex): LabBand[] {
  const over50 = age !== undefined && age >= 50;
  const high = sex === 'female' ? (over50 ? 30 : 20) : (over50 ? 20 : 15);
  return [
    band(undefined, high + 0.01, 'normal', 'স্বাভাবিক', 'Normal',
      'ESR স্বাভাবিক সীমায় আছে — শরীরে বড় প্রদাহের লক্ষণ নেই বলে মনে হয়।',
      'ESR is within the normal range — no sign of major inflammation.',
      NEXT.normal),
    band(high + 0.01, 100, 'high', 'বেশি', 'High',
      'ESR বেশি হতে পারে — সংক্রমণ, প্রদাহ বা অন্য রোগের দিকে ইঙ্গিত করতে পারে। একাই কোনো রোগ বলে না।',
      'ESR may be high — infection, inflammation or other illness may be behind it. It alone names no disease.',
      NEXT.doctorSoon),
    band(100, undefined, 'critical', 'খুব বেশি — জরুরি', 'Very high — urgent',
      'ESR খুব বেশি হতে পারে — শীঘ্রই ডাক্তার দেখান, কারণ গুরুতর সংক্রমণ বা প্রদাহ থাকতে পারে।',
      'ESR may be very high — see a doctor soon, as serious infection or inflammation may be present.',
      NEXT.urgent, true),
  ];
}

// ---------------------------------------------------------------------------
// Lipid panel
// Sources: Mayo Clinic Laboratories — Lipid Panel (NCEP/NLA guidelines);
// MedlinePlus — Lipid profile test. Adult cut-offs (18+).
// ---------------------------------------------------------------------------
const LIPID_SOURCES = [
  'Mayo Clinic Laboratories — Lipid Panel, Serum (NCEP/NLA guidelines)',
  'MedlinePlus — Lipid profile test (U.S. National Library of Medicine)',
  'National Cholesterol Education Program (NCEP) guidelines',
];

const TC_BANDS: LabBand[] = [
  band(undefined, 200, 'normal', 'কাঙ্ক্ষিত', 'Desirable',
    'মোট কোলেস্টেরল কাঙ্ক্ষিত সীমায় আছে।',
    'Total cholesterol is in the desirable range.',
    NEXT.normal),
  band(200, 240, 'high', 'সীমান্তে বেশি', 'Borderline high',
    'মোট কোলেস্টেরল সীমান্তে বেশি হতে পারে — হৃদরোগের ঝুঁকি কিছুটা বাড়তে পারে।',
    'Total cholesterol may be borderline high — heart risk may be a little higher.',
    NEXT.lifestyle),
  band(240, undefined, 'high', 'বেশি', 'High',
    'মোট কোলেস্টেরল বেশি হতে পারে — হৃদরোগের ঝুঁকি বাড়তে পারে।',
    'Total cholesterol may be high — heart risk may be higher.',
    NEXT.doctorSoon),
];

const LDL_BANDS: LabBand[] = [
  band(undefined, 100, 'normal', 'কাঙ্ক্ষিত', 'Desirable',
    'LDL ("খারাপ") কোলেস্টেরল কাঙ্ক্ষিত সীমায় আছে।',
    'LDL (“bad”) cholesterol is in the desirable range.',
    NEXT.normal),
  band(100, 130, 'high', 'কাঙ্ক্ষিতের উপরে', 'Above desirable',
    'LDL কাঙ্ক্ষিতের উপরে হতে পারে — ডায়াবেটিস বা হৃদরোগের ঝুঁকি থাকলে লক্ষ্য আরও কম হতে পারে।',
    'LDL may be above desirable — with diabetes or heart risk the target may be lower.',
    NEXT.lifestyle),
  band(130, 160, 'high', 'সীমান্তে বেশি', 'Borderline high',
    'LDL সীমান্তে বেশি হতে পারে।',
    'LDL may be borderline high.',
    NEXT.lifestyle),
  band(160, 190, 'high', 'বেশি', 'High',
    'LDL বেশি হতে পারে — হৃদরোগের ঝুঁকি বাড়তে পারে।',
    'LDL may be high — heart risk may be higher.',
    NEXT.doctorSoon),
  band(190, undefined, 'high', 'অনেক বেশি', 'Very high',
    'LDL অনেক বেশি হতে পারে — পারিবারিক কারণেও এমন হতে পারে। শীঘ্রই ডাক্তার দেখান।',
    'LDL may be very high — family causes are possible too. See a doctor soon.',
    NEXT.doctorSoon, true),
];

function hdlBands(age?: number, sex?: Sex): LabBand[] {
  const low = sex === 'female' ? 50 : 40;
  void age;
  return [
    band(undefined, low, 'low', 'কম', 'Low',
      'HDL ("ভালো") কোলেস্টেরল কম হতে পারে — হৃদরোগের ঝুঁকি কিছুটা বাড়তে পারে।',
      'HDL (“good”) cholesterol may be low — heart risk may be a little higher.',
      NEXT.lifestyle),
    band(low, undefined, 'normal', 'স্বাভাবিক', 'Normal',
      'HDL কোলেস্টেরল স্বাভাবিক সীমায় আছে।',
      'HDL cholesterol is within the normal range.',
      NEXT.normal),
  ];
}

const TG_BANDS: LabBand[] = [
  band(undefined, 150, 'normal', 'স্বাভাবিক', 'Normal',
    'ট্রাইগ্লিসারাইড স্বাভাবিক সীমায় আছে।',
    'Triglycerides are within the normal range.',
    NEXT.normal),
  band(150, 200, 'high', 'সীমান্তে বেশি', 'Borderline high',
    'ট্রাইগ্লিসারাইড সীমান্তে বেশি হতে পারে।',
    'Triglycerides may be borderline high.',
    NEXT.lifestyle),
  band(200, 500, 'high', 'বেশি', 'High',
    'ট্রাইগ্লিসারাইড বেশি হতে পারে — হৃদরোগের ঝুঁকি বাড়তে পারে।',
    'Triglycerides may be high — heart risk may be higher.',
    NEXT.doctorSoon),
  band(500, undefined, 'critical', 'খুব বেশি — জরুরি', 'Very high — urgent',
    'ট্রাইগ্লিসারাইড খুব বেশি হতে পারে — অগ্ন্যাশয়ের প্রদাহের ঝুঁকি থাকতে পারে। পেটে তীব্র ব্যথা থাকলে জরুরি ডাক্তার দেখান।',
    'Triglycerides may be very high — pancreatitis risk may be present. Severe stomach pain needs urgent care.',
    NEXT.urgent, true),
];

// ---------------------------------------------------------------------------
// Liver panel
// Sources: MedlinePlus — Liver function tests + Comprehensive metabolic
// panel; University of Utah laboratory reference; American College of
// Gastroenterology guideline on abnormal liver chemistries (2017).
// ALT varies most between sources (MedlinePlus 4-36; Mayo 7-56; ACG
// healthy upper limit M 29-33 / F 19-25) — sex-specific Utah ranges
// used, with the variation noted on the test.
// ---------------------------------------------------------------------------
const LIVER_SOURCES = [
  'MedlinePlus — Liver function tests (U.S. National Library of Medicine)',
  'University of Utah — Laboratory Reference',
  'American College of Gastroenterology — Abnormal liver chemistries guideline (2017)',
];

function altBands(age?: number, sex?: Sex): LabBand[] {
  const low = sex === 'female' ? 7 : 10;
  const high = sex === 'female' ? 30 : 55;
  void age;
  return [
    band(undefined, low, 'low', 'কম', 'Low',
      'SGPT (ALT) কম হতে পারে — সাধারণত চিন্তার বিষয় নয়, তবে ডাক্তারকে জানান।',
      'SGPT (ALT) may be low — usually not a concern, but tell the doctor.',
      NEXT.normal),
    band(low, high + 0.01, 'normal', 'স্বাভাবিক', 'Normal',
      'SGPT (ALT) স্বাভাবিক সীমায় আছে।',
      'SGPT (ALT) is within the normal range.',
      NEXT.normal),
    band(high + 0.01, 1000, 'high', 'বেশি', 'High',
      'SGPT বেশি হতে পারে — লিভারের প্রদাহ, ফ্যাটি লিভার, ওষুধ বা অন্য কারণে এমন হতে পারে।',
      'SGPT may be high — liver inflammation, fatty liver, medicines or other causes may do this.',
      NEXT.doctorSoon),
    band(1000, undefined, 'critical', 'খুব বেশি — জরুরি', 'Very high — urgent',
      'SGPT খুব বেশি হতে পারে — লিভারের গুরুতর সমস্যা থাকতে পারে। জরুরি ডাক্তার দেখান।',
      'SGPT may be very high — serious liver trouble may be present. Urgent care may be needed.',
      NEXT.urgent, true),
  ];
}

const AST_BANDS: LabBand[] = [
  band(undefined, 10, 'low', 'কম', 'Low',
    'SGOT (AST) কম হতে পারে — সাধারণত চিন্তার বিষয় নয়।',
    'SGOT (AST) may be low — usually not a concern.',
    NEXT.normal),
  band(10, 41, 'normal', 'স্বাভাবিক', 'Normal',
    'SGOT (AST) স্বাভাবিক সীমায় আছে।',
    'SGOT (AST) is within the normal range.',
    NEXT.normal),
  band(41, 1000, 'high', 'বেশি', 'High',
    'SGOT বেশি হতে পারে — লিভার, পেশি বা হৃদপিণ্ডের সমস্যার দিকে ইঙ্গিত করতে পারে।',
    'SGOT may be high — liver, muscle or heart trouble may be behind it.',
    NEXT.doctorSoon),
  band(1000, undefined, 'critical', 'খুব বেশি — জরুরি', 'Very high — urgent',
    'SGOT খুব বেশি হতে পারে — জরুরি চিকিৎসা দরকার হতে পারে।',
    'SGOT may be very high — urgent care may be needed.',
    NEXT.urgent, true),
];

const BILIRUBIN_BANDS: LabBand[] = [
  band(undefined, 0.1, 'low', 'কম', 'Low',
    'বিলিরুবিন কম হতে পারে — সাধারণত চিন্তার বিষয় নয়।',
    'Bilirubin may be low — usually not a concern.',
    NEXT.normal),
  band(0.1, 1.21, 'normal', 'স্বাভাবিক', 'Normal',
    'মোট বিলিরুবিন স্বাভাবিক সীমায় আছে।',
    'Total bilirubin is within the normal range.',
    NEXT.normal),
  band(1.21, 3, 'high', 'বেশি', 'High',
    'বিলিরুবিন বেশি হতে পারে — লিভার বা পিত্তনালীর সমস্যার দিকে ইঙ্গিত করতে পারে।',
    'Bilirubin may be high — liver or bile-duct trouble may be behind it.',
    NEXT.doctorSoon),
  band(3, 15, 'high', 'অনেক বেশি (জন্ডিসের সীমা)', 'Much higher (jaundice range)',
    'বিলিরুবিন অনেক বেশি হতে পারে — চোখ বা গা হলুদ দেখাতে পারে। শীঘ্রই ডাক্তার দেখান।',
    'Bilirubin may be much too high — eyes or skin may look yellow. See a doctor soon.',
    NEXT.doctorSoon, true),
  band(15, undefined, 'critical', 'খুব বেশি — জরুরি', 'Very high — urgent',
    'বিলিরুবিন খুব বেশি হতে পারে — জরুরি চিকিৎসা দরকার হতে পারে।',
    'Bilirubin may be very high — urgent care may be needed.',
    NEXT.urgent, true),
];

const ALBUMIN_BANDS: LabBand[] = [
  band(undefined, 1.5, 'critical', 'খুব কম — জরুরি', 'Very low — urgent',
    'অ্যালবুমিন খুব কম হতে পারে — লিভার বা কিডনির গুরুতর সমস্যা থাকতে পারে।',
    'Albumin may be very low — serious liver or kidney trouble may be present.',
    NEXT.urgent, true),
  band(1.5, 3.5, 'low', 'কম', 'Low',
    'অ্যালবুমিন কম হতে পারে — লিভার রোগ, কিডনি রোগ, অপুষ্টি বা প্রদাহের দিকে ইঙ্গিত করতে পারে।',
    'Albumin may be low — liver disease, kidney disease, poor nutrition or inflammation may be behind it.',
    NEXT.doctorSoon),
  band(3.5, 5.01, 'normal', 'স্বাভাবিক', 'Normal',
    'অ্যালবুমিন স্বাভাবিক সীমায় আছে।',
    'Albumin is within the normal range.',
    NEXT.normal),
  band(5.01, undefined, 'high', 'বেশি', 'High',
    'অ্যালবুমিন বেশি হতে পারে — পানিশূন্যতার দিকে ইঙ্গিত করতে পারে।',
    'Albumin may be high — dehydration may be behind it.',
    NEXT.doctorSoon),
];

// ---------------------------------------------------------------------------
// Kidney panel
// Sources: MedlinePlus — Comprehensive metabolic panel; ACP reference
// ranges; Medscape — Lab Values, Normal Adult; KDIGO CKD staging (eGFR).
// ---------------------------------------------------------------------------
const KIDNEY_SOURCES = [
  'MedlinePlus — Comprehensive metabolic panel (U.S. National Library of Medicine)',
  'ACP — Reference Ranges (American College of Physicians)',
  'Medscape — Lab Values, Normal Adult',
];

function creatinineBands(age?: number, sex?: Sex): LabBand[] {
  const low = sex === 'female' ? 0.59 : 0.74;
  const high = sex === 'female' ? 1.04 : 1.35;
  void age;
  return [
    band(undefined, low, 'low', 'কম', 'Low',
      'ক্রিয়েটিনিন কম হতে পারে — পেশি কম থাকলে বা গর্ভাবস্থায় এমন হতে পারে।',
      'Creatinine may be low — low muscle mass or pregnancy may do this.',
      NEXT.normal),
    band(low, high + 0.001, 'normal', 'স্বাভাবিক', 'Normal',
      'ক্রিয়েটিনিন স্বাভাবিক সীমায় আছে।',
      'Creatinine is within the normal range.',
      NEXT.normal),
    band(high + 0.001, 4, 'high', 'বেশি', 'High',
      'ক্রিয়েটিনিন বেশি হতে পারে — কিডনির কাজ কমে যাওয়ার দিকে ইঙ্গিত করতে পারে।',
      'Creatinine may be high — kidney function may be reduced.',
      NEXT.doctorSoon),
    band(4, undefined, 'critical', 'খুব বেশি — জরুরি', 'Very high — urgent',
      'ক্রিয়েটিনিন খুব বেশি হতে পারে — কিডনির গুরুতর সমস্যা থাকতে পারে। জরুরি ডাক্তার দেখান।',
      'Creatinine may be very high — serious kidney trouble may be present. Urgent care may be needed.',
      NEXT.urgent, true),
  ];
}

const UREA_BANDS: LabBand[] = [
  band(undefined, 7, 'low', 'কম', 'Low',
    'ইউরিয়া কম হতে পারে — কম প্রোটিন খেলে বা লিভারের সমস্যায় এমন হতে পারে।',
    'Urea may be low — low protein intake or liver trouble may do this.',
    NEXT.doctorSoon),
  band(7, 21, 'normal', 'স্বাভাবিক', 'Normal',
    'ইউরিয়া স্বাভাবিক সীমায় আছে।',
    'Urea is within the normal range.',
    NEXT.normal),
  band(21, 60, 'high', 'বেশি', 'High',
    'ইউরিয়া বেশি হতে পারে — কিডনির কাজ কমে যাওয়া, পানিশূন্যতা বা বেশি প্রোটিন খাওয়ার দিকে ইঙ্গিত করতে পারে।',
    'Urea may be high — reduced kidney function, dehydration or high protein intake may be behind it.',
    NEXT.doctorSoon),
  band(60, undefined, 'critical', 'খুব বেশি — জরুরি', 'Very high — urgent',
    'ইউরিয়া খুব বেশি হতে পারে — জরুরি চিকিৎসা দরকার হতে পারে।',
    'Urea may be very high — urgent care may be needed.',
    NEXT.urgent, true),
];

const EGFR_BANDS: LabBand[] = [
  band(undefined, 15, 'critical', 'খুব কম — জরুরি', 'Very low — urgent',
    'eGFR খুব কম হতে পারে — কিডনি প্রায় কাজ করছে না বলে মনে হতে পারে (কিডনি ফেইলিউরের সীমা)। জরুরি ডাক্তার দেখান।',
    'eGFR may be very low — the kidneys may barely be working (kidney failure range). Urgent care may be needed.',
    NEXT.urgent, true),
  band(15, 30, 'critical', 'অনেক কম — জরুরি', 'Much lower — urgent',
    'eGFR অনেক কম হতে পারে — কিডনির গুরুতর সমস্যা থাকতে পারে। শীঘ্রই (আজই ভালো) ডাক্তার দেখান।',
    'eGFR may be much lower — serious kidney trouble may be present. See a doctor soon, today if possible.',
    NEXT.urgent, true),
  band(30, 60, 'low', 'মাঝারি কম', 'Moderately low',
    'eGFR মাঝারি কম হতে পারে — কিডনির কাজ কমে যাওয়ার দিকে ইঙ্গিত করতে পারে।',
    'eGFR may be moderately low — kidney function may be reduced.',
    NEXT.doctorSoon),
  band(60, 90, 'low', 'হালকা কম', 'Mildly low',
    'eGFR হালকা কম হতে পারে — বয়স বাড়লে এমন হতেই পারে, তবে ডাক্তারকে জানান।',
    'eGFR may be mildly low — this can happen with age, but tell the doctor.',
    NEXT.doctorSoon),
  band(90, undefined, 'normal', 'স্বাভাবিক', 'Normal',
    'eGFR স্বাভাবিক সীমায় আছে — কিডনির ছাঁকনির কাজ ভালো বলে মনে হয়।',
    'eGFR is within the normal range — the kidneys’ filtering looks good.',
    NEXT.normal),
];

function uricAcidBands(age?: number, sex?: Sex): LabBand[] {
  const low = sex === 'female' ? 2.4 : 3.4;
  const high = sex === 'female' ? 6.0 : 7.0;
  void age;
  return [
    band(undefined, low, 'low', 'কম', 'Low',
      'ইউরিক অ্যাসিড কম হতে পারে — সাধারণত চিন্তার বিষয় নয়।',
      'Uric acid may be low — usually not a concern.',
      NEXT.normal),
    band(low, high + 0.01, 'normal', 'স্বাভাবিক', 'Normal',
      'ইউরিক অ্যাসিড স্বাভাবিক সীমায় আছে।',
      'Uric acid is within the normal range.',
      NEXT.normal),
    band(high + 0.01, undefined, 'high', 'বেশি', 'High',
      'ইউরিক অ্যাসিড বেশি হতে পারে — গাউট (গেঁটে বাত) বা কিডনিতে পাথরের ঝুঁকি বাড়তে পারে।',
      'Uric acid may be high — gout or kidney-stone risk may be higher.',
      NEXT.doctorSoon),
  ];
}

// ---------------------------------------------------------------------------
// Thyroid panel
// Sources: MedlinePlus — TSH test; British Thyroid Foundation — Thyroid
// function testing; Medscape — Lab Values, Normal Adult; Mayo Clinic —
// Hypothyroidism diagnosis. TSH is read as a pattern with free T4.
// ---------------------------------------------------------------------------
const THYROID_SOURCES = [
  'MedlinePlus — TSH (Thyroid-stimulating hormone) test',
  'British Thyroid Foundation — Thyroid function testing',
  'Medscape — Lab Values, Normal Adult',
];

const TSH_BANDS: LabBand[] = [
  band(undefined, 0.1, 'high', 'খুব কম', 'Very low',
    'TSH খুব কম হতে পারে — থাইরয়েড বেশি কাজ করছে বলে মনে হতে পারে (হাইপারথাইরয়েডের দিকে ইঙ্গিত)। শীঘ্রই ডাক্তার দেখান।',
    'TSH may be very low — the thyroid may be overactive (hyperthyroid pattern). See a doctor soon.',
    NEXT.doctorSoon, true),
  band(0.1, 0.4, 'low', 'কম', 'Low',
    'TSH কম হতে পারে — থাইরয়েড বেশি কাজ করছে বলে মনে হতে পারে। Free T4-এর সঙ্গে মিলিয়ে দেখতে হয়।',
    'TSH may be low — the thyroid may be overactive. It is read together with free T4.',
    NEXT.doctorSoon),
  band(0.4, 4.01, 'normal', 'স্বাভাবিক', 'Normal',
    'TSH স্বাভাবিক সীমায় আছে।',
    'TSH is within the normal range.',
    NEXT.normal),
  band(4.01, 10, 'high', 'বেশি', 'High',
    'TSH বেশি হতে পারে — থাইরয়েড কম কাজ করছে বলে মনে হতে পারে। Free T4 স্বাভাবিক থাকলে একে "সাবক্লিনিক্যাল" বলা হতে পারে।',
    'TSH may be high — the thyroid may be underactive. If free T4 is normal this may be called “subclinical”.',
    NEXT.doctorSoon),
  band(10, undefined, 'high', 'অনেক বেশি', 'Much higher',
    'TSH অনেক বেশি হতে পারে — থাইরয়েডের কাজ অনেক কমে যাওয়ার দিকে ইঙ্গিত করতে পারে। শীঘ্রই ডাক্তার দেখান।',
    'TSH may be much higher — the thyroid may be working far too little. See a doctor soon.',
    NEXT.doctorSoon, true),
];

const FREE_T3_BANDS: LabBand[] = [
  band(undefined, 2.3, 'low', 'কম', 'Low',
    'Free T3 কম হতে পারে — থাইরয়েডের কাজ কমে যাওয়া বা গুরুতর অসুস্থতার দিকে ইঙ্গিত করতে পারে।',
    'Free T3 may be low — underactive thyroid or serious illness may be behind it.',
    NEXT.doctorSoon),
  band(2.3, 4.21, 'normal', 'স্বাভাবিক', 'Normal',
    'Free T3 স্বাভাবিক সীমায় আছে।',
    'Free T3 is within the normal range.',
    NEXT.normal),
  band(4.21, undefined, 'high', 'বেশি', 'High',
    'Free T3 বেশি হতে পারে — থাইরয়েড বেশি কাজ করছে বলে মনে হতে পারে।',
    'Free T3 may be high — the thyroid may be overactive.',
    NEXT.doctorSoon),
];

const FREE_T4_BANDS: LabBand[] = [
  band(undefined, 0.8, 'low', 'কম', 'Low',
    'Free T4 কম হতে পারে — থাইরয়েডের কাজ কমে যাওয়ার দিকে ইঙ্গিত করতে পারে (TSH-এর সঙ্গে মিলিয়ে দেখতে হয়)।',
    'Free T4 may be low — the thyroid may be underactive (read together with TSH).',
    NEXT.doctorSoon),
  band(0.8, 1.81, 'normal', 'স্বাভাবিক', 'Normal',
    'Free T4 স্বাভাবিক সীমায় আছে।',
    'Free T4 is within the normal range.',
    NEXT.normal),
  band(1.81, undefined, 'high', 'বেশি', 'High',
    'Free T4 বেশি হতে পারে — থাইরয়েড বেশি কাজ করছে বলে মনে হতে পারে।',
    'Free T4 may be high — the thyroid may be overactive.',
    NEXT.doctorSoon),
];

// ---------------------------------------------------------------------------
// Electrolytes
// Sources: MedlinePlus — Comprehensive metabolic panel; StatPearls —
// Electrolytes (NCBI Bookshelf); ACP reference ranges. Critical values
// (<120/>160 Na, <3.0/>6.0 K, <7.0/>13.0 Ca) are the widely-taught
// report-now lines (StatPearls / standard critical-value lists).
// ---------------------------------------------------------------------------
const ELECTROLYTE_SOURCES = [
  'MedlinePlus — Comprehensive metabolic panel',
  'StatPearls — Electrolytes (NCBI Bookshelf)',
  'ACP — Reference Ranges (American College of Physicians)',
];

const SODIUM_BANDS: LabBand[] = [
  band(undefined, 120, 'critical', 'খুব কম — জরুরি', 'Very low — urgent',
    'সোডিয়াম খুব কম হতে পারে — মাথা ঘোরা, বিভ্রান্তি বা খিঁচুনি হতে পারে। জরুরি চিকিৎসা দরকার হতে পারে।',
    'Sodium may be very low — dizziness, confusion or seizures may occur. Urgent care may be needed.',
    NEXT.urgent, true),
  band(120, 135, 'low', 'কম', 'Low',
    'সোডিয়াম কম হতে পারে — পানিশূন্যতা, ওষুধ বা অন্য কারণে এমন হতে পারে।',
    'Sodium may be low — dehydration, medicines or other causes may do this.',
    NEXT.doctorSoon),
  band(135, 146, 'normal', 'স্বাভাবিক', 'Normal',
    'সোডিয়াম স্বাভাবিক সীমায় আছে।',
    'Sodium is within the normal range.',
    NEXT.normal),
  band(146, 160, 'high', 'বেশি', 'High',
    'সোডিয়াম বেশি হতে পারে — পানি কম খাওয়া বা অন্য কারণে এমন হতে পারে।',
    'Sodium may be high — low water intake or other causes may do this.',
    NEXT.doctorSoon),
  band(160, undefined, 'critical', 'খুব বেশি — জরুরি', 'Very high — urgent',
    'সোডিয়াম খুব বেশি হতে পারে — জরুরি চিকিৎসা দরকার হতে পারে।',
    'Sodium may be very high — urgent care may be needed.',
    NEXT.urgent, true),
];

const POTASSIUM_BANDS: LabBand[] = [
  band(undefined, 3.0, 'critical', 'খুব কম — জরুরি', 'Very low — urgent',
    'পটাশিয়াম খুব কম হতে পারে — হৃদস্পন্দনে গোলমাল বা পেশির দুর্বলতা হতে পারে। জরুরি চিকিৎসা দরকার হতে পারে।',
    'Potassium may be very low — heart-rhythm trouble or muscle weakness may occur. Urgent care may be needed.',
    NEXT.urgent, true),
  band(3.0, 3.5, 'low', 'কম', 'Low',
    'পটাশিয়াম কম হতে পারে — বমি, ডায়রিয়া বা ওষুধের কারণে এমন হতে পারে।',
    'Potassium may be low — vomiting, diarrhoea or medicines may do this.',
    NEXT.doctorSoon),
  band(3.5, 5.01, 'normal', 'স্বাভাবিক', 'Normal',
    'পটাশিয়াম স্বাভাবিক সীমায় আছে।',
    'Potassium is within the normal range.',
    NEXT.normal),
  band(5.01, 6.0, 'high', 'বেশি', 'High',
    'পটাশিয়াম বেশি হতে পারে — কিডনির সমস্যা বা ওষুধের কারণে এমন হতে পারে।',
    'Potassium may be high — kidney trouble or medicines may do this.',
    NEXT.doctorSoon),
  band(6.0, undefined, 'critical', 'খুব বেশি — জরুরি', 'Very high — urgent',
    'পটাশিয়াম খুব বেশি হতে পারে — হৃদস্পন্দন বন্ধ হয়ে যাওয়ার ঝুঁকি থাকতে পারে। জরুরি চিকিৎসা দরকার হতে পারে।',
    'Potassium may be very high — the heart may stop beating normally. Urgent care may be needed.',
    NEXT.urgent, true),
];

const CALCIUM_BANDS: LabBand[] = [
  band(undefined, 7.0, 'critical', 'খুব কম — জরুরি', 'Very low — urgent',
    'ক্যালসিয়াম খুব কম হতে পারে — হাত-পায়ে ঝিনঝিন, পেশিতে টান বা খিঁচুনি হতে পারে। জরুরি চিকিৎসা দরকার হতে পারে।',
    'Calcium may be very low — tingling, muscle cramps or seizures may occur. Urgent care may be needed.',
    NEXT.urgent, true),
  band(7.0, 8.5, 'low', 'কম', 'Low',
    'ক্যালসিয়াম কম হতে পারে — ভিটামিন ডি-র ঘাটতি বা অন্য কারণে এমন হতে পারে।',
    'Calcium may be low — vitamin D deficiency or other causes may do this.',
    NEXT.doctorSoon),
  band(8.5, 10.51, 'normal', 'স্বাভাবিক', 'Normal',
    'ক্যালসিয়াম স্বাভাবিক সীমায় আছে।',
    'Calcium is within the normal range.',
    NEXT.normal),
  band(10.51, 13, 'high', 'বেশি', 'High',
    'ক্যালসিয়াম বেশি হতে পারে — প্যারাথাইরয়েড বা অন্য কারণে এমন হতে পারে।',
    'Calcium may be high — parathyroid trouble or other causes may do this.',
    NEXT.doctorSoon),
  band(13, undefined, 'critical', 'খুব বেশি — জরুরি', 'Very high — urgent',
    'ক্যালসিয়াম খুব বেশি হতে পারে — জরুরি চিকিৎসা দরকার হতে পারে।',
    'Calcium may be very high — urgent care may be needed.',
    NEXT.urgent, true),
];

// ---------------------------------------------------------------------------
// Vitamins & inflammation
// Sources: NIH Office of Dietary Supplements (vitamin D); ACP reference
// ranges; Medscape — Lab Values, Normal Adult; University of Utah
// laboratory reference; AHA/CDC (hs-CRP risk bands, noted only).
// ---------------------------------------------------------------------------
const VITAMIN_SOURCES = [
  'NIH Office of Dietary Supplements — Vitamin D fact sheet',
  'ACP — Reference Ranges (American College of Physicians)',
  'Medscape — Lab Values, Normal Adult',
];

const VITAMIN_D_BANDS: LabBand[] = [
  band(undefined, 20, 'low', 'ঘাটতি', 'Deficient',
    'ভিটামিন ডি-র ঘাটতি হতে পারে — হাড় দুর্বল হওয়ার ঝুঁকি বাড়তে পারে।',
    'Vitamin D may be deficient — weak-bone risk may be higher.',
    NEXT.doctorSoon),
  band(20, 30, 'low', 'অপর্যাপ্ত', 'Insufficient',
    'ভিটামিন ডি অপর্যাপ্ত হতে পারে — যথেষ্ট নয়, তবে ঘাটতিও নয়।',
    'Vitamin D may be insufficient — not enough, but not deficient either.',
    NEXT.lifestyle),
  band(30, 101, 'normal', 'পর্যাপ্ত', 'Sufficient',
    'ভিটামিন ডি পর্যাপ্ত সীমায় আছে।',
    'Vitamin D is in the sufficient range.',
    NEXT.normal),
  band(101, 150, 'high', 'বেশি', 'High',
    'ভিটামিন ডি বেশি হতে পারে — সাপ্লিমেন্ট বেশি খেলে এমন হতে পারে।',
    'Vitamin D may be high — taking too much supplement may do this.',
    NEXT.doctorSoon),
  band(150, undefined, 'critical', 'খুব বেশি — জরুরি', 'Very high — urgent',
    'ভিটামিন ডি খুব বেশি হতে পারে — রক্তে ক্যালসিয়াম বেড়ে যাওয়ার ঝুঁকি থাকতে পারে।',
    'Vitamin D may be very high — blood calcium may rise too much.',
    NEXT.urgent, true),
];

const B12_BANDS: LabBand[] = [
  band(undefined, 200, 'low', 'ঘাটতি', 'Deficient',
    'ভিটামিন B12-এর ঘাটতি হতে পারে — রক্তশূন্যতা বা স্নায়ুর সমস্যার দিকে ইঙ্গিত করতে পারে।',
    'Vitamin B12 may be deficient — anaemia or nerve trouble may be behind it.',
    NEXT.doctorSoon),
  band(200, 300, 'low', 'সীমান্তে কম', 'Borderline low',
    'ভিটামিন B12 সীমান্তে কম হতে পারে — ডাক্তারের পরামর্শে ফলো-আপ ভালো।',
    'Vitamin B12 may be borderline low — follow-up on a doctor’s advice is wise.',
    NEXT.doctorSoon),
  band(300, 901, 'normal', 'স্বাভাবিক', 'Normal',
    'ভিটামিন B12 স্বাভাবিক সীমায় আছে।',
    'Vitamin B12 is within the normal range.',
    NEXT.normal),
  band(901, undefined, 'high', 'বেশি', 'High',
    'ভিটামিন B12 বেশি হতে পারে — সাপ্লিমেন্ট খেলে এমন হতে পারে; সাধারণত চিন্তার বিষয় নয়।',
    'Vitamin B12 may be high — supplements may do this; usually not a concern.',
    NEXT.normal),
];

function ferritinBands(age?: number, sex?: Sex): LabBand[] {
  const low = sex === 'female' ? 10 : 12;
  const high = sex === 'female' ? 150 : 300;
  void age;
  return [
    band(undefined, low, 'low', 'কম', 'Low',
      'ফেরিটিন কম হতে পারে — শরীরে আয়রনের মজুত কম থাকতে পারে (আয়রনের ঘাটতি)।',
      'Ferritin may be low — the body’s iron stores may be low (iron deficiency).',
      NEXT.doctorSoon),
    band(low, high + 0.01, 'normal', 'স্বাভাবিক', 'Normal',
      'ফেরিটিন স্বাভাবিক সীমায় আছে — আয়রনের মজুত ঠিক আছে বলে মনে হয়।',
      'Ferritin is within the normal range — iron stores look fine.',
      NEXT.normal),
    band(high + 0.01, 1000, 'high', 'বেশি', 'High',
      'ফেরিটিন বেশি হতে পারে — প্রদাহ, লিভারের সমস্যা বা আয়রন বেশি জমার দিকে ইঙ্গিত করতে পারে।',
      'Ferritin may be high — inflammation, liver trouble or iron overload may be behind it.',
      NEXT.doctorSoon),
    band(1000, undefined, 'critical', 'খুব বেশি — জরুরি', 'Very high — urgent',
      'ফেরিটিন খুব বেশি হতে পারে — শীঘ্রই ডাক্তার দেখান।',
      'Ferritin may be very high — see a doctor soon.',
      NEXT.urgent, true),
  ];
}

const CRP_BANDS: LabBand[] = [
  band(undefined, 10, 'normal', 'স্বাভাবিক', 'Normal',
    'CRP স্বাভাবিক সীমায় আছে — শরীরে বড় প্রদাহের লক্ষণ নেই বলে মনে হয়।',
    'CRP is within the normal range — no sign of major inflammation.',
    NEXT.normal),
  band(10, 100, 'high', 'বেশি', 'High',
    'CRP বেশি হতে পারে — সংক্রমণ বা প্রদাহ থাকতে পারে। একাই কোনো রোগ বলে না।',
    'CRP may be high — infection or inflammation may be present. It alone names no disease.',
    NEXT.doctorSoon),
  band(100, undefined, 'critical', 'খুব বেশি — জরুরি', 'Very high — urgent',
    'CRP খুব বেশি হতে পারে — গুরুতর সংক্রমণ থাকতে পারে। শীঘ্রই ডাক্তার দেখান।',
    'CRP may be very high — serious infection may be present. See a doctor soon.',
    NEXT.urgent, true),
];

// ---------------------------------------------------------------------------
// Pregnancy (numeric) + categorical tests
// Sources: β-hCG — MedicineNet; Cleveland Clinic Laboratories;
// Johns Hopkins Handbook of Obstetrics and Gynecology.
// Urine — Cleveland Clinic Urinalysis; MedlinePlus Urinalysis;
// Davis's Lab & Diagnostic Tests.
// Dengue NS1 — CDC Dengue diagnosis/testing; WHO dengue fact sheet;
// Muller et al., J Infect Dis 2017 (PubMed).
// HBsAg — MedlinePlus Hepatitis virus panel; CDC Interpretation of
// Hepatitis B Serologic Test Results; U.S. VA Hepatitis B page.
// Blood group — NHS Blood and Transplant; American Red Cross
// (informational — no numeric range).
// ---------------------------------------------------------------------------
const BHCG_BANDS: LabBand[] = [
  band(undefined, 5, 'normal', 'নেগেটিভ', 'Negative',
    'β-hCG নেগেটিভ সীমায় আছে — গর্ভাবস্থা ধরা পড়েনি বলে মনে হয়। খুব আগে পরীক্ষা করলে ভুল নেগেটিভ হতে পারে।',
    'β-hCG is in the negative range — no pregnancy detected. Testing very early can give a false negative.',
    NEXT.normal),
  band(5, 25, 'high', 'অনিশ্চিত', 'Indeterminate',
    'β-hCG অনিশ্চিত সীমায় আছে — গর্ভাবস্থা আছে কি না, তা এখনই বলা যায় না। ৪৮ ঘণ্টা পর আবার পরীক্ষা লাগতে পারে।',
    'β-hCG is in the indeterminate range — pregnancy cannot be confirmed yet. A repeat test after 48 hours may be needed.',
    NEXT.repeatSoon),
  band(25, undefined, 'high', 'পজিটিভ', 'Positive',
    'β-hCG পজিটিভ সীমায় আছে — গর্ভাবস্থা থাকতে পারে। সপ্তাহ অনুযায়ী মান অনেক বদলায়, তাই ডাক্তারের পরামর্শ নিন।',
    'β-hCG is in the positive range — pregnancy may be present. Levels vary a lot by week, so take a doctor’s advice.',
    NEXT.doctorSoon),
];

const URINE_PROTEIN_CATS: LabCategory[] = [
  cat('Negative', 'নেগেটিভ', 'Negative', 'normal',
    'প্রস্রাবে প্রোটিন নেই — স্বাভাবিক।',
    'No protein in urine — normal.',
    NEXT.normal),
  cat('Trace', 'সামান্য (Trace)', 'Trace', 'normal',
    'প্রস্রাবে সামান্য প্রোটিন থাকতে পারে — জ্বর, ব্যায়াম বা পানিশূন্যতায় এমন হতে পারে। সাধারণত স্বাভাবিক ধরা হয়।',
    'A trace of protein may be present — fever, exercise or dehydration may do this. Usually counted as normal.',
    NEXT.repeatSoon),
  cat('1+', '১+ (1+)', '1+', 'high',
    'প্রস্রাবে প্রোটিন বেশি হতে পারে — কিডনির সমস্যার দিকে ইঙ্গিত করতে পারে।',
    'Protein in urine may be high — kidney trouble may be behind it.',
    NEXT.doctorSoon),
  cat('2+', '২+ (2+)', '2+', 'high',
    'প্রস্রাবে প্রোটিন অনেক বেশি হতে পারে — কিডনির সমস্যার দিকে ইঙ্গিত করতে পারে।',
    'Protein in urine may be much too high — kidney trouble may be behind it.',
    NEXT.doctorSoon),
  cat('3+', '৩+ (3+)', '3+', 'high',
    'প্রস্রাবে প্রোটিন খুব বেশি হতে পারে — শীঘ্রই ডাক্তার দেখান।',
    'Protein in urine may be very high — see a doctor soon.',
    NEXT.doctorSoon, true),
];

const URINE_SUGAR_CATS: LabCategory[] = [
  cat('Negative', 'নেগেটিভ', 'Negative', 'normal',
    'প্রস্রাবে সুগার নেই — স্বাভাবিক।',
    'No sugar in urine — normal.',
    NEXT.normal),
  cat('Trace', 'সামান্য (Trace)', 'Trace', 'high',
    'প্রস্রাবে সামান্য সুগার থাকতে পারে — রক্তের শর্করা বেশি থাকলে এমন হতে পারে।',
    'A trace of sugar may be present — blood sugar may be high.',
    NEXT.doctorSoon),
  cat('1+', '১+ (1+)', '1+', 'high',
    'প্রস্রাবে সুগার বেশি হতে পারে — রক্তের শর্করা বেশি থাকার দিকে ইঙ্গিত করতে পারে। FBS/HbA1c করিয়ে দেখুন।',
    'Sugar in urine may be high — blood sugar may be high. Check FBS/HbA1c.',
    NEXT.doctorSoon),
  cat('2+', '২+ (2+)', '2+', 'high',
    'প্রস্রাবে সুগার অনেক বেশি হতে পারে — ডায়াবেটিসের দিকে ইঙ্গিত করতে পারে।',
    'Sugar in urine may be much too high — diabetes may be behind it.',
    NEXT.doctorSoon),
  cat('3+', '৩+ (3+)', '3+', 'high',
    'প্রস্রাবে সুগার খুব বেশি হতে পারে — শীঘ্রই ডাক্তার দেখান।',
    'Sugar in urine may be very high — see a doctor soon.',
    NEXT.doctorSoon, true),
];

const DENGUE_NS1_CATS: LabCategory[] = [
  cat('Negative', 'নেগেটিভ', 'Negative', 'normal',
    'ডেঙ্গু NS1 নেগেটিভ — তবে নেগেটিভ মানেই ডেঙ্গু নেই, তা নয় (দেরিতে পরীক্ষা করলে বা অন্য কারণে হতে পারে)। জ্বর থাকলে ডাক্তারের পরামর্শ নিন।',
    'Dengue NS1 negative — but a negative result does not rule out dengue. Fever still needs a doctor’s advice.',
    NEXT.doctorSoon),
  cat('Positive', 'পজিটিভ', 'Positive', 'high',
    'ডেঙ্গু NS1 পজিটিভ হতে পারে — ডেঙ্গু জ্বর থাকতে পারে। ডাক্তার দেখান; জ্বর, রক্তপাত বা প্লেটলেট কম থাকলে জরুরি চিকিৎসা নিন।',
    'Dengue NS1 may be positive — dengue fever may be present. See a doctor; fever, bleeding or low platelets need urgent care.',
    NEXT.doctorSoon, true),
];

const HBSAG_CATS: LabCategory[] = [
  cat('Negative', 'নেগেটিভ', 'Negative', 'normal',
    'HBsAg নেগেটিভ — হেপাটাইটিস বি-র সক্রিয় সংক্রমণ ধরা পড়েনি।',
    'HBsAg negative — no active hepatitis B infection detected.',
    NEXT.normal),
  cat('Positive', 'পজিটিভ', 'Positive', 'high',
    'HBsAg পজিটিভ হতে পারে — হেপাটাইটিস বি সংক্রমণ (নতুন বা দীর্ঘদিনের) থাকতে পারে। নিশ্চিত করতে আরও পরীক্ষা লাগে — ডাক্তার দেখান।',
    'HBsAg may be positive — hepatitis B infection (new or long-standing) may be present. More tests are needed to confirm — see a doctor.',
    NEXT.doctorSoon, true),
];

const BLOOD_GROUP_CATS: LabCategory[] = [
  cat('A+', 'A+', 'A+', 'normal', 'আপনার রক্তের গ্রুপ A পজিটিভ। রক্ত দিতে পারেন A+ ও AB+ রোগীকে; নিতে পারেন A+, A-, O+, O- থেকে।', 'Your blood group is A positive. You can donate to A+ and AB+ patients; you can receive from A+, A-, O+ and O-.', NEXT.normal),
  cat('A-', 'A-', 'A-', 'normal', 'আপনার রক্তের গ্রুপ A নেগেটিভ। রক্ত দিতে পারেন A+, A-, AB+, AB- রোগীকে; নিতে পারেন A- ও O- থেকে।', 'Your blood group is A negative. You can donate to A+, A-, AB+ and AB- patients; you can receive from A- and O-.', NEXT.normal),
  cat('B+', 'B+', 'B+', 'normal', 'আপনার রক্তের গ্রুপ B পজিটিভ। রক্ত দিতে পারেন B+ ও AB+ রোগীকে; নিতে পারেন B+, B-, O+, O- থেকে।', 'Your blood group is B positive. You can donate to B+ and AB+ patients; you can receive from B+, B-, O+ and O-.', NEXT.normal),
  cat('B-', 'B-', 'B-', 'normal', 'আপনার রক্তের গ্রুপ B নেগেটিভ। রক্ত দিতে পারেন B+, B-, AB+, AB- রোগীকে; নিতে পারেন B- ও O- থেকে।', 'Your blood group is B negative. You can donate to B+, B-, AB+ and AB- patients; you can receive from B- and O-.', NEXT.normal),
  cat('AB+', 'AB+', 'AB+', 'normal', 'আপনার রক্তের গ্রুপ AB পজিটিভ — সব গ্রুপের রক্ত নিতে পারেন; দিতে পারেন শুধু AB+ রোগীকে।', 'Your blood group is AB positive — you can receive blood of any group; you can donate only to AB+ patients.', NEXT.normal),
  cat('AB-', 'AB-', 'AB-', 'normal', 'আপনার রক্তের গ্রুপ AB নেগেটিভ। রক্ত দিতে পারেন AB+ ও AB- রোগীকে; নিতে পারেন A-, B-, AB-, O- থেকে।', 'Your blood group is AB negative. You can donate to AB+ and AB- patients; you can receive from A-, B-, AB- and O-.', NEXT.normal),
  cat('O+', 'O+', 'O+', 'normal', 'আপনার রক্তের গ্রুপ O পজিটিভ। রক্ত দিতে পারেন সব পজিটিভ গ্রুপকে (O+, A+, B+, AB+); নিতে পারেন O+ ও O- থেকে।', 'Your blood group is O positive. You can donate to all positive groups (O+, A+, B+, AB+); you can receive from O+ and O-.', NEXT.normal),
  cat('O-', 'O-', 'O-', 'normal', 'আপনার রক্তের গ্রুপ O নেগেটিভ — সবাইকে রক্ত দিতে পারেন; নিতে পারেন শুধু O- থেকে।', 'Your blood group is O negative — you can donate to everyone; you can receive only from O-.', NEXT.normal),
];

// ---------------------------------------------------------------------------
// The catalogue: 37 tests. Urine R/E is intentionally NOT a separate
// numeric test — it is a multi-component panel (colour, pH, protein,
// sugar, cells...), so its two most-checked parts are covered here as
// urine-protein and urine-sugar, and the detail view explains the rest.
// ---------------------------------------------------------------------------

const PREP_FASTING_8: LabTestPrep = {
  waterBn: 'পানি খাওয়া যাবে।', waterEn: 'Drinking water is fine.',
  medicinesBn: 'ডাক্তারের অনুমতি ছাড়া ওষুধ বন্ধ করবেন না — কোন ওষুধ খেয়েছেন তা ল্যাবকে জানান।',
  medicinesEn: 'Do not stop any medicine without a doctor’s permission — tell the lab which medicines you took.',
  bestTimeBn: 'সকালে, খালি পেটে।', bestTimeEn: 'In the morning, on an empty stomach.',
  notesBn: 'পরীক্ষার আগে অন্তত ৮ ঘণ্টা কিছু খাবেন না (চা-কফি, জুসও নয়)।',
  notesEn: 'Eat nothing for at least 8 hours before the test (no tea, coffee or juice either).',
};
const PREP_FASTING_12: LabTestPrep = {
  waterBn: 'পানি খাওয়া যাবে।', waterEn: 'Drinking water is fine.',
  medicinesBn: 'ডাক্তারের অনুমতি ছাড়া ওষুধ বন্ধ করবেন না — কোন ওষুধ খেয়েছেন তা ল্যাবকে জানান।',
  medicinesEn: 'Do not stop any medicine without a doctor’s permission — tell the lab which medicines you took.',
  bestTimeBn: 'সকালে, খালি পেটে।', bestTimeEn: 'In the morning, on an empty stomach.',
  notesBn: 'পরীক্ষার আগে ৯–১২ ঘণ্টা খালি পেটে থাকুন; আগের রাতে ভারী/চর্বিযুক্ত খাবার এড়িয়ে চলুন।',
  notesEn: 'Fast for 9–12 hours before the test; avoid a heavy or fatty meal the night before.',
};
const PREP_NONE: LabTestPrep = {
  waterBn: 'সাধারণভাবে পানি খান।', waterEn: 'Drink water as usual.',
  medicinesBn: 'ডাক্তারের অনুমতি ছাড়া ওষুধ বন্ধ করবেন না — কোন ওষুধ খেয়েছেন তা ল্যাবকে জানান।',
  medicinesEn: 'Do not stop any medicine without a doctor’s permission — tell the lab which medicines you took.',
  bestTimeBn: 'দিনের যেকোনো সময়।', bestTimeEn: 'Any time of day.',
  notesBn: 'এই পরীক্ষার জন্য খালি পেটে থাকার দরকার নেই।',
  notesEn: 'No fasting is needed for this test.',
};
const PREP_MORNING: LabTestPrep = {
  waterBn: 'সাধারণভাবে পানি খান।', waterEn: 'Drink water as usual.',
  medicinesBn: 'থাইরয়েডের ওষুধ (লেভোথাইরক্সিন) থাকলে পরীক্ষার আগে খাবেন কি না, ডাক্তারকে জিজ্ঞেস করুন। বায়োটিন সাপ্লিমেন্ট ফল বদলে দিতে পারে — জানান।',
  medicinesEn: 'If you take thyroid medicine (levothyroxine), ask the doctor whether to take it before the test. Biotin supplements can change the result — tell the lab.',
  bestTimeBn: 'সকালে।', bestTimeEn: 'In the morning.',
  notesBn: 'খালি পেটে থাকার দরকার নেই, তবে প্রতিবার একই সময়ে পরীক্ষা করালে তুলনা সহজ হয়।',
  notesEn: 'No fasting is needed, but testing at the same time each time makes comparison easier.',
};

const Q_DIABETES = {
  bn: ['আমার এই মানের অর্থ কী — আমার কি আরও পরীক্ষা দরকার?', 'আমার খাবার ও হাঁটাচলায় কী বদলানো উচিত?'],
  en: ['What does this value mean for me — do I need more tests?', 'What should I change about food and walking?'],
};
const Q_CBC = {
  bn: ['আমার এই মানের কারণ কী হতে পারে?', 'আমাকে কি আয়রন বা অন্য কোনো সাপ্লিমেন্ট নিতে হবে?'],
  en: ['What could be causing this value?', 'Do I need iron or any other supplement?'],
};
const Q_LIPID = {
  bn: ['আমার হৃদরোগের ঝুঁকি কতটা?', 'আমাকে কি ওষুধ নিতে হবে, নাকি খাবার ও ব্যায়ামেই হবে?'],
  en: ['How high is my heart risk?', 'Do I need medicine, or will food and exercise be enough?'],
};
const Q_LIVER = {
  bn: ['আমার লিভারের এই মানের কারণ কী হতে পারে?', 'কোন খাবার বা ওষুধ এড়িয়ে চলা উচিত?'],
  en: ['What could be causing this liver value?', 'Which foods or medicines should I avoid?'],
};
const Q_KIDNEY = {
  bn: ['আমার কিডনির অবস্থা এখন কেমন?', 'পানি ও লবণ খাওয়ার ব্যাপারে কী মানতে হবে?'],
  en: ['How are my kidneys doing now?', 'What should I follow about water and salt?'],
};
const Q_THYROID = {
  bn: ['আমার থাইরয়েডের ওষুধের ডোজ কি ঠিক আছে?', 'কখন আবার পরীক্ষা করাতে হবে?'],
  en: ['Is my thyroid medicine dose right?', 'When should I test again?'],
};
const Q_GENERAL = {
  bn: ['আমার এই ফলাফলের অর্থ কী?', 'আমাকে কি আরও কোনো পরীক্ষা করাতে হবে?'],
  en: ['What does this result mean?', 'Do I need any more tests?'],
};

const LAB_TESTS_FIRST: LabTest[] = [
  {
    id: 'fbs', panel: 'diabetes', nameBn: 'ফাস্টিং ব্লাড সুগার', nameEn: 'Fasting Blood Sugar', shortName: 'FBS',
    keywordsBn: ['সুগার', 'ডায়াবেটিস', 'খালি পেট', 'গ্লুকোজ'], keywordsEn: ['sugar', 'diabetes', 'fasting', 'glucose'],
    measuresBn: 'খালি পেটে রক্তের শর্করা (গ্লুকোজ) মাপে।', measuresEn: 'Measures blood sugar (glucose) on an empty stomach.',
    whyBn: 'ডায়াবেটিস আছে কি না, তা দেখতে এবং ডায়াবেটিসের নিয়ন্ত্রণ বুঝতে করা হয়।',
    whyEn: 'Done to check for diabetes and to see how well diabetes is controlled.',
    sampleBn: 'রক্ত', sampleEn: 'Blood', fastingHours: 8, kind: 'numeric', unit: 'mg/dL', altUnits: ['mg/dL', 'mmol/L'],
    bands: FBS_BANDS, rangeTextBn: '৭০–৯৯ mg/dL', rangeTextEn: '70–99 mg/dL',
    redFlagBn: '৫৪-এর নিচে বা ২৫০-এর উপরে হলে জরুরি চিকিৎসা দরকার হতে পারে।',
    redFlagEn: 'Below 54 or above 250 may need urgent care.',
    prep: PREP_FASTING_8, repeatBn: 'ডায়াবেটিস থাকলে ডাক্তারের পরামর্শে নিয়মিত; প্রি-ডায়াবেটিস থাকলে বছরে অন্তত একবার।',
    repeatEn: 'Regularly on a doctor’s advice if there is diabetes; at least once a year if prediabetic.',
    costBdt: { min: 100, max: 200 }, costNoteBn: COST_NOTE.bn, costNoteEn: COST_NOTE.en,
    sources: DIABETES_SOURCES, sourceDate: CHECKED, questionsBn: Q_DIABETES.bn, questionsEn: Q_DIABETES.en,
  },
  {
    id: 'rbs', panel: 'diabetes', nameBn: 'র‍্যান্ডম ব্লাড সুগার', nameEn: 'Random Blood Sugar', shortName: 'RBS',
    keywordsBn: ['সুগার', 'ডায়াবেটিস', 'খাবারের পর', 'গ্লুকোজ'], keywordsEn: ['sugar', 'diabetes', 'random', 'glucose'],
    measuresBn: 'দিনের যেকোনো সময়ে রক্তের শর্করা মাপে।', measuresEn: 'Measures blood sugar at any time of day.',
    whyBn: 'ডায়াবেটিসের লক্ষণ থাকলে দ্রুত ধারণা পেতে করা হয়।',
    whyEn: 'Done to get a quick idea when diabetes symptoms are present.',
    sampleBn: 'রক্ত', sampleEn: 'Blood', fastingHours: null, kind: 'numeric', unit: 'mg/dL', altUnits: ['mg/dL', 'mmol/L'],
    bands: RBS_BANDS, rangeTextBn: '৭০–১৩৯ mg/dL', rangeTextEn: '70–139 mg/dL',
    redFlagBn: '৫৪-এর নিচে বা ৩০০-এর উপরে হলে জরুরি চিকিৎসা দরকার হতে পারে।',
    redFlagEn: 'Below 54 or above 300 may need urgent care.',
    prep: PREP_NONE, repeatBn: 'ডাক্তারের পরামর্শ অনুযায়ী; নিশ্চিত হতে FBS বা HbA1c করানো হয়।',
    repeatEn: 'As the doctor advises; FBS or HbA1c is done to confirm.',
    costBdt: { min: 100, max: 200 }, costNoteBn: COST_NOTE.bn, costNoteEn: COST_NOTE.en,
    sources: DIABETES_SOURCES, sourceDate: CHECKED, questionsBn: Q_DIABETES.bn, questionsEn: Q_DIABETES.en,
  },
  {
    id: 'hba1c', panel: 'diabetes', nameBn: 'HbA1c (গড় শর্করা)', nameEn: 'HbA1c (Average Sugar)', shortName: 'HbA1c',
    keywordsBn: ['সুগার', 'ডায়াবেটিস', 'গড়', 'তিন মাস'], keywordsEn: ['sugar', 'diabetes', 'average', 'three months'],
    measuresBn: 'গত ২–৩ মাসের গড় রক্তের শর্করা মাপে।', measuresEn: 'Measures average blood sugar over the last 2–3 months.',
    whyBn: 'ডায়াবেটিস নির্ণয় ও দীর্ঘমেয়াদি নিয়ন্ত্রণ দেখতে করা হয়।',
    whyEn: 'Done to diagnose diabetes and to see long-term control.',
    sampleBn: 'রক্ত', sampleEn: 'Blood', fastingHours: null, kind: 'numeric', unit: '%',
    bands: HBA1C_BANDS, rangeTextBn: '৪.০–৫.৬%', rangeTextEn: '4.0–5.6%',
    redFlagBn: '৯%-এর উপরে হলে শীঘ্রই ডাক্তার দেখান।',
    redFlagEn: 'Above 9% — see a doctor soon.',
    prep: PREP_NONE, repeatBn: 'ডায়াবেটিস থাকলে প্রতি ৩ মাসে; প্রি-ডায়াবেটিস থাকলে বছরে অন্তত একবার।',
    repeatEn: 'Every 3 months if diabetic; at least once a year if prediabetic.',
    costBdt: { min: 700, max: 1200 }, costNoteBn: COST_NOTE.bn, costNoteEn: COST_NOTE.en,
    sources: DIABETES_SOURCES, sourceDate: CHECKED, questionsBn: Q_DIABETES.bn, questionsEn: Q_DIABETES.en,
  },
  {
    id: 'ogtt', panel: 'diabetes', nameBn: 'ওজিটিটি (গ্লুকোজ খাওয়ার পর)', nameEn: 'OGTT (After Glucose Drink)', shortName: 'OGTT',
    keywordsBn: ['সুগার', 'ডায়াবেটিস', 'গ্লুকোজ', 'দুই ঘণ্টা'], keywordsEn: ['sugar', 'diabetes', 'glucose', 'two hours'],
    measuresBn: 'গ্লুকোজ পান করার ২ ঘণ্টা পর রক্তের শর্করা মাপে।', measuresEn: 'Measures blood sugar 2 hours after drinking glucose.',
    whyBn: 'ডায়াবেটিস বা গর্ভকালীন ডায়াবেটিস নির্ণয়ে করা হয়।',
    whyEn: 'Done to diagnose diabetes or gestational diabetes.',
    sampleBn: 'রক্ত', sampleEn: 'Blood', fastingHours: 8, kind: 'numeric', unit: 'mg/dL', altUnits: ['mg/dL', 'mmol/L'],
    bands: OGTT_BANDS, rangeTextBn: '৭০–১৩৯ mg/dL (২ ঘণ্টা পর)', rangeTextEn: '70–139 mg/dL (2 hours after)',
    redFlagBn: '২০০ mg/dL বা তার বেশি হলে ডাক্তার দেখান।',
    redFlagEn: '200 mg/dL or more — see a doctor.',
    prep: { ...PREP_FASTING_8, notesBn: 'খালি পেটে এসে গ্লুকোজ পান করতে হয়, তারপর ২ ঘণ্টা ল্যাবেই অপেক্ষা করতে হয়। পরীক্ষার আগের ৩ দিন স্বাভাবিক খাবার খান।', notesEn: 'Come fasting, drink the glucose, then wait 2 hours at the lab. Eat normally for the 3 days before the test.' },
    repeatBn: 'ডাক্তারের পরামর্শ অনুযায়ী; গর্ভাবস্থায় ২৪–২৮ সপ্তাহে একবার।',
    repeatEn: 'As the doctor advises; once at 24–28 weeks in pregnancy.',
    costBdt: { min: 400, max: 700 }, costNoteBn: COST_NOTE.bn, costNoteEn: COST_NOTE.en,
    sources: DIABETES_SOURCES, sourceDate: CHECKED, questionsBn: Q_DIABETES.bn, questionsEn: Q_DIABETES.en,
  },
  {
    id: 'hemoglobin', panel: 'cbc', nameBn: 'হিমোগ্লোবিন', nameEn: 'Haemoglobin', shortName: 'Hb',
    keywordsBn: ['রক্তশূন্যতা', 'হিমোগ্লোবিন', 'আয়রন', 'সিবিসি'], keywordsEn: ['anaemia', 'hemoglobin', 'iron', 'cbc'],
    measuresBn: 'রক্তে অক্সিজেন বহনকারী হিমোগ্লোবিনের পরিমাণ মাপে।', measuresEn: 'Measures haemoglobin, which carries oxygen in the blood.',
    whyBn: 'রক্তশূন্যতা (অ্যানিমিয়া) আছে কি না, তা দেখতে করা হয়।',
    whyEn: 'Done to check for anaemia (low blood).',
    sampleBn: 'রক্ত', sampleEn: 'Blood', fastingHours: null, kind: 'numeric', unit: 'g/dL',
    bandsFor: hbBands, rangeTextBn: 'পুরুষ ১৩–১৭, নারী ১২–১৬ g/dL', rangeTextEn: 'Men 13–17, women 12–16 g/dL',
    rangeNoteBn: 'সূত্রভেদে কিছুটা ভিন্ন (যেমন MedlinePlus: পুরুষ ১৩–১৮, নারী ১২–১৬; NHLBI: পুরুষ ১৪–১৭, নারী ১২–১৫)। ল্যাবের নিজের range-ই আসল।',
    rangeNoteEn: 'Sources differ slightly (e.g. MedlinePlus: men 13–18, women 12–16; NHLBI: men 14–17, women 12–15). Your lab’s own range wins.',
    redFlagBn: '৭ g/dL-এর নিচে বা ২০ g/dL-এর উপরে হলে জরুরি চিকিৎসা দরকার হতে পারে।',
    redFlagEn: 'Below 7 or above 20 g/dL may need urgent care.',
    prep: PREP_NONE, repeatBn: 'রক্তশূন্যতা থাকলে চিকিৎসার ১–৩ মাস পর আবার; সুস্থ থাকলে বছরে একবার।',
    repeatEn: '1–3 months after treatment for anaemia; once a year when healthy.',
    costBdt: { min: 400, max: 700 }, costNoteBn: 'সিবিসি (CBC) প্যাকেজের অংশ হিসেবে। ' + COST_NOTE.bn, costNoteEn: 'As part of the CBC package. ' + COST_NOTE.en,
    sources: CBC_SOURCES, sourceDate: CHECKED, questionsBn: Q_CBC.bn, questionsEn: Q_CBC.en,
  },
  {
    id: 'wbc', panel: 'cbc', nameBn: 'শ্বেতকণিকা (WBC)', nameEn: 'White Blood Cells (WBC)', shortName: 'WBC',
    keywordsBn: ['সংক্রমণ', 'জ্বর', 'সিবিসি', 'শ্বেত'], keywordsEn: ['infection', 'fever', 'cbc', 'white cells'],
    measuresBn: 'রক্তে সংক্রমণের বিরুদ্ধে লড়াই করা শ্বেতকণিকার সংখ্যা মাপে।', measuresEn: 'Counts the white cells that fight infection.',
    whyBn: 'সংক্রমণ, প্রদাহ বা রোগ প্রতিরোধ ক্ষমতার সমস্যা দেখতে করা হয়।',
    whyEn: 'Done to check for infection, inflammation or immune trouble.',
    sampleBn: 'রক্ত', sampleEn: 'Blood', fastingHours: null, kind: 'numeric', unit: '/µL',
    bands: WBC_BANDS, rangeTextBn: '৪,০০০–১১,০০০ /µL', rangeTextEn: '4,000–11,000 /µL',
    rangeNoteBn: 'সূত্রভেদে কিছুটা ভিন্ন (MedlinePlus ৪,৫০০–১১,০০০; Cleveland Clinic ৪,০০০–১০,০০০)।',
    rangeNoteEn: 'Sources differ slightly (MedlinePlus 4,500–11,000; Cleveland Clinic 4,000–10,000).',
    redFlagBn: '২,০০০-এর নিচে বা ৩০,০০০-এর উপরে হলে জরুরি ডাক্তার দেখান (জ্বর থাকলে আরও জরুরি)।',
    redFlagEn: 'Below 2,000 or above 30,000 — see a doctor urgently (more urgent with fever).',
    prep: PREP_NONE, repeatBn: 'জ্বর বা সংক্রমণের সময় ডাক্তারের পরামর্শে; সুস্থ থাকলে বছরে একবার।',
    repeatEn: 'On a doctor’s advice during fever or infection; once a year when healthy.',
    costBdt: { min: 400, max: 700 }, costNoteBn: 'সিবিসি (CBC) প্যাকেজের অংশ হিসেবে। ' + COST_NOTE.bn, costNoteEn: 'As part of the CBC package. ' + COST_NOTE.en,
    sources: CBC_SOURCES, sourceDate: CHECKED, questionsBn: Q_CBC.bn, questionsEn: Q_CBC.en,
  },
  {
    id: 'rbc', panel: 'cbc', nameBn: 'লোহিতকণিকা (RBC)', nameEn: 'Red Blood Cells (RBC)', shortName: 'RBC',
    keywordsBn: ['রক্তশূন্যতা', 'সিবিসি', 'লোহিত'], keywordsEn: ['anaemia', 'cbc', 'red cells'],
    measuresBn: 'রক্তে অক্সিজেন বহনকারী লোহিতকণিকার সংখ্যা মাপে।', measuresEn: 'Counts the red cells that carry oxygen.',
    whyBn: 'রক্তশূন্যতা বা অন্য রক্তের সমস্যা দেখতে করা হয়।',
    whyEn: 'Done to check for anaemia or other blood trouble.',
    sampleBn: 'রক্ত', sampleEn: 'Blood', fastingHours: null, kind: 'numeric', unit: 'million/µL',
    bandsFor: rbcBands, rangeTextBn: 'পুরুষ ৪.৫–৬.১, নারী ৪.০–৫.৪ million/µL', rangeTextEn: 'Men 4.5–6.1, women 4.0–5.4 million/µL',
    rangeNoteBn: 'সূত্রভেদে কিছুটা ভিন্ন (MedlinePlus: পুরুষ ৪.৬–৬.২, নারী ৪.২–৫.৪)।',
    rangeNoteEn: 'Sources differ slightly (MedlinePlus: men 4.6–6.2, women 4.2–5.4).',
    redFlagBn: 'খুব কম হলে শ্বাসকষ্ট বা বুকে ব্যথা থাকলে জরুরি ডাক্তার দেখান।',
    redFlagEn: 'Very low with breathlessness or chest pain — urgent care may be needed.',
    prep: PREP_NONE, repeatBn: 'রক্তশূন্যতা থাকলে চিকিৎসার ১–৩ মাস পর আবার; সুস্থ থাকলে বছরে একবার।',
    repeatEn: '1–3 months after treatment for anaemia; once a year when healthy.',
    costBdt: { min: 400, max: 700 }, costNoteBn: 'সিবিসি (CBC) প্যাকেজের অংশ হিসেবে। ' + COST_NOTE.bn, costNoteEn: 'As part of the CBC package. ' + COST_NOTE.en,
    sources: CBC_SOURCES, sourceDate: CHECKED, questionsBn: Q_CBC.bn, questionsEn: Q_CBC.en,
  },
  {
    id: 'platelets', panel: 'cbc', nameBn: 'প্লেটলেট', nameEn: 'Platelets', shortName: 'PLT',
    keywordsBn: ['ডেঙ্গু', 'রক্তপাত', 'সিবিসি', 'প্লেটলেট'], keywordsEn: ['dengue', 'bleeding', 'cbc', 'platelets'],
    measuresBn: 'রক্ত জমাট বাঁধতে সাহায্য করা প্লেটলেটের সংখ্যা মাপে।', measuresEn: 'Counts the platelets that help blood clot.',
    whyBn: 'রক্তপাতের ঝুঁকি, ডেঙ্গু বা অন্য রোগ দেখতে করা হয়।',
    whyEn: 'Done to check bleeding risk, dengue or other illness.',
    sampleBn: 'রক্ত', sampleEn: 'Blood', fastingHours: null, kind: 'numeric', unit: '/µL',
    bands: PLATELET_BANDS, rangeTextBn: '১৫০,০০০–৪০০,০০০ /µL', rangeTextEn: '150,000–400,000 /µL',
    rangeNoteBn: 'কিছু ল্যাব উপরের সীমা ৪৫০,০০০ দেয়।',
    rangeNoteEn: 'Some labs give an upper limit of 450,000.',
    redFlagBn: '৫০,০০০-এর নিচে বা ১০,০০,০০০-এর উপরে হলে জরুরি ডাক্তার দেখান।',
    redFlagEn: 'Below 50,000 or above 1,000,000 — urgent care may be needed.',
    prep: PREP_NONE, repeatBn: 'ডেঙ্গুতে ডাক্তারের পরামর্শে প্রতিদিন; সুস্থ থাকলে বছরে একবার।',
    repeatEn: 'Daily on a doctor’s advice in dengue; once a year when healthy.',
    costBdt: { min: 400, max: 700 }, costNoteBn: 'সিবিসি (CBC) প্যাকেজের অংশ হিসেবে। ' + COST_NOTE.bn, costNoteEn: 'As part of the CBC package. ' + COST_NOTE.en,
    sources: CBC_SOURCES, sourceDate: CHECKED, questionsBn: Q_CBC.bn, questionsEn: Q_CBC.en,
  },
  {
    id: 'esr', panel: 'cbc', nameBn: 'ইএসআর', nameEn: 'ESR', shortName: 'ESR',
    keywordsBn: ['প্রদাহ', 'জ্বর', 'ব্যথা', 'সিবিসি'], keywordsEn: ['inflammation', 'fever', 'pain', 'cbc'],
    measuresBn: 'শরীরে প্রদাহ আছে কি না, তা বোঝায় (লোহিতকণিকা কত দ্রুত থিতিয়ে পড়ে)।', measuresEn: 'Shows whether there is inflammation in the body (how fast red cells settle).',
    whyBn: 'সংক্রমণ, বাত বা অন্য প্রদাহজনিত রোগের ধারণা পেতে করা হয়।',
    whyEn: 'Done to get an idea of infection, arthritis or other inflammatory illness.',
    sampleBn: 'রক্ত', sampleEn: 'Blood', fastingHours: null, kind: 'numeric', unit: 'mm/hr',
    bandsFor: esrBands, rangeTextBn: '৫০ বছরের নিচে: পুরুষ ০–১৫, নারী ০–২০ mm/hr', rangeTextEn: 'Under 50: men 0–15, women 0–20 mm/hr',
    rangeNoteBn: 'বয়স বাড়লে সীমা বাড়ে (৫০-এর উপরে: পুরুষ ০–২০, নারী ০–৩০)। কোনো কোনো সূত্র বয়স/২ (পুরুষ) ও (বয়স+১০)/২ (নারী) সূত্র দেয়।',
    rangeNoteEn: 'The limit rises with age (over 50: men 0–20, women 0–30). Some sources use age/2 (men) and (age+10)/2 (women).',
    redFlagBn: '১০০ mm/hr-এর উপরে হলে শীঘ্রই ডাক্তার দেখান।',
    redFlagEn: 'Above 100 mm/hr — see a doctor soon.',
    prep: PREP_NONE, repeatBn: 'প্রদাহের চিকিৎসা চললে ডাক্তারের পরামর্শে; না হলে দরকার নেই।',
    repeatEn: 'On a doctor’s advice while treating inflammation; otherwise not needed.',
    costBdt: { min: 150, max: 300 }, costNoteBn: COST_NOTE.bn, costNoteEn: COST_NOTE.en,
    sources: [...CBC_SOURCES, 'Murtagh’s General Practice — Laboratory reference values'],
    sourceDate: CHECKED, questionsBn: Q_CBC.bn, questionsEn: Q_CBC.en,
  },
  {
    id: 'total-cholesterol', panel: 'lipid', nameBn: 'মোট কোলেস্টেরল', nameEn: 'Total Cholesterol', shortName: 'TC',
    keywordsBn: ['কোলেস্টেরল', 'হৃদরোগ', 'লিপিড', 'চর্বি'], keywordsEn: ['cholesterol', 'heart', 'lipid', 'fat'],
    measuresBn: 'রক্তে মোট কোলেস্টেরলের পরিমাণ মাপে।', measuresEn: 'Measures total cholesterol in the blood.',
    whyBn: 'হৃদরোগের ঝুঁকি বুঝতে করা হয়।',
    whyEn: 'Done to understand heart risk.',
    sampleBn: 'রক্ত', sampleEn: 'Blood', fastingHours: 12, kind: 'numeric', unit: 'mg/dL', altUnits: ['mg/dL', 'mmol/L'],
    bands: TC_BANDS, rangeTextBn: '২০০ mg/dL-এর নিচে', rangeTextEn: 'Below 200 mg/dL',
    redFlagBn: '২৪০ mg/dL বা তার বেশি হলে ডাক্তার দেখান।',
    redFlagEn: '240 mg/dL or more — see a doctor.',
    prep: PREP_FASTING_12, repeatBn: 'বছরে একবার; বেশি থাকলে ডাক্তারের পরামর্শে ৩–৬ মাস পর আবার।',
    repeatEn: 'Once a year; after 3–6 months on a doctor’s advice if high.',
    costBdt: { min: 250, max: 400 }, costNoteBn: COST_NOTE.bn, costNoteEn: COST_NOTE.en,
    sources: LIPID_SOURCES, sourceDate: CHECKED, questionsBn: Q_LIPID.bn, questionsEn: Q_LIPID.en,
  },
  {
    id: 'ldl', panel: 'lipid', nameBn: 'এলডিএল কোলেস্টেরল', nameEn: 'LDL Cholesterol', shortName: 'LDL',
    keywordsBn: ['কোলেস্টেরল', 'খারাপ', 'হৃদরোগ', 'লিপিড'], keywordsEn: ['cholesterol', 'bad', 'heart', 'lipid'],
    measuresBn: '"খারাপ" কোলেস্টেরল (LDL) মাপে — এটি ধমনীতে জমে।', measuresEn: 'Measures “bad” cholesterol (LDL), which builds up in arteries.',
    whyBn: 'হৃদরোগ ও স্ট্রোকের ঝুঁকি বুঝতে করা হয়।',
    whyEn: 'Done to understand heart-attack and stroke risk.',
    sampleBn: 'রক্ত', sampleEn: 'Blood', fastingHours: 12, kind: 'numeric', unit: 'mg/dL', altUnits: ['mg/dL', 'mmol/L'],
    bands: LDL_BANDS, rangeTextBn: '১০০ mg/dL-এর নিচে', rangeTextEn: 'Below 100 mg/dL',
    redFlagBn: '১৯০ mg/dL বা তার বেশি হলে শীঘ্রই ডাক্তার দেখান।',
    redFlagEn: '190 mg/dL or more — see a doctor soon.',
    prep: PREP_FASTING_12, repeatBn: 'বছরে একবার; বেশি থাকলে ডাক্তারের পরামর্শে ৩–৬ মাস পর আবার।',
    repeatEn: 'Once a year; after 3–6 months on a doctor’s advice if high.',
    costBdt: { min: 300, max: 500 }, costNoteBn: COST_NOTE.bn, costNoteEn: COST_NOTE.en,
    sources: LIPID_SOURCES, sourceDate: CHECKED, questionsBn: Q_LIPID.bn, questionsEn: Q_LIPID.en,
  },
  {
    id: 'hdl', panel: 'lipid', nameBn: 'এইচডিএল কোলেস্টেরল', nameEn: 'HDL Cholesterol', shortName: 'HDL',
    keywordsBn: ['কোলেস্টেরল', 'ভালো', 'হৃদরোগ', 'লিপিড'], keywordsEn: ['cholesterol', 'good', 'heart', 'lipid'],
    measuresBn: '"ভালো" কোলেস্টেরল (HDL) মাপে — এটি কোলেস্টেরল সরাতে সাহায্য করে।', measuresEn: 'Measures “good” cholesterol (HDL), which helps clear cholesterol.',
    whyBn: 'হৃদরোগের ঝুঁকি বুঝতে করা হয়।',
    whyEn: 'Done to understand heart risk.',
    sampleBn: 'রক্ত', sampleEn: 'Blood', fastingHours: 12, kind: 'numeric', unit: 'mg/dL', altUnits: ['mg/dL', 'mmol/L'],
    bandsFor: hdlBands, rangeTextBn: 'পুরুষ ৪০+, নারী ৫০+ mg/dL', rangeTextEn: 'Men 40+, women 50+ mg/dL',
    redFlagBn: 'খুব কম হলে ডাক্তারের পরামর্শ নিন।',
    redFlagEn: 'Very low — take a doctor’s advice.',
    prep: PREP_FASTING_12, repeatBn: 'বছরে একবার; লিপিড প্রোফাইলের সঙ্গেই করা হয়।',
    repeatEn: 'Once a year, together with the lipid profile.',
    costBdt: { min: 300, max: 500 }, costNoteBn: COST_NOTE.bn, costNoteEn: COST_NOTE.en,
    sources: LIPID_SOURCES, sourceDate: CHECKED, questionsBn: Q_LIPID.bn, questionsEn: Q_LIPID.en,
  },
  {
    id: 'triglycerides', panel: 'lipid', nameBn: 'ট্রাইগ্লিসারাইড', nameEn: 'Triglycerides', shortName: 'TG',
    keywordsBn: ['কোলেস্টেরল', 'চর্বি', 'হৃদরোগ', 'লিপিড'], keywordsEn: ['cholesterol', 'fat', 'heart', 'lipid'],
    measuresBn: 'রক্তে ট্রাইগ্লিসারাইড (এক ধরনের চর্বি) মাপে।', measuresEn: 'Measures triglycerides (a type of fat) in the blood.',
    whyBn: 'হৃদরোগের ঝুঁকি ও অগ্ন্যাশয়ের সমস্যা বুঝতে করা হয়।',
    whyEn: 'Done to understand heart risk and pancreas trouble.',
    sampleBn: 'রক্ত', sampleEn: 'Blood', fastingHours: 12, kind: 'numeric', unit: 'mg/dL', altUnits: ['mg/dL', 'mmol/L'],
    bands: TG_BANDS, rangeTextBn: '১৫০ mg/dL-এর নিচে', rangeTextEn: 'Below 150 mg/dL',
    redFlagBn: '৫০০ mg/dL বা তার বেশি হলে জরুরি ডাক্তার দেখান।',
    redFlagEn: '500 mg/dL or more — urgent care may be needed.',
    prep: PREP_FASTING_12, repeatBn: 'বছরে একবার; বেশি থাকলে ডাক্তারের পরামর্শে ৩–৬ মাস পর আবার।',
    repeatEn: 'Once a year; after 3–6 months on a doctor’s advice if high.',
    costBdt: { min: 250, max: 400 }, costNoteBn: COST_NOTE.bn, costNoteEn: COST_NOTE.en,
    sources: LIPID_SOURCES, sourceDate: CHECKED, questionsBn: Q_LIPID.bn, questionsEn: Q_LIPID.en,
  },
  {
    id: 'sgpt-alt', panel: 'liver', nameBn: 'এসজিপিটি (ALT)', nameEn: 'SGPT (ALT)', shortName: 'SGPT',
    keywordsBn: ['লিভার', 'জন্ডিস', 'এসজিপিটি', 'ফ্যাটি লিভার'], keywordsEn: ['liver', 'jaundice', 'sgpt', 'fatty liver'],
    measuresBn: 'লিভারের এনজাইম ALT মাপে — লিভার ক্ষতিগ্রস্ত হলে রক্তে বাড়ে।', measuresEn: 'Measures the liver enzyme ALT, which rises in blood when the liver is damaged.',
    whyBn: 'লিভারের প্রদাহ, ফ্যাটি লিভার বা ওষুধের প্রভাব দেখতে করা হয়।',
    whyEn: 'Done to check liver inflammation, fatty liver or medicine effects.',
    sampleBn: 'রক্ত', sampleEn: 'Blood', fastingHours: null, kind: 'numeric', unit: 'U/L',
    bandsFor: altBands, rangeTextBn: 'পুরুষ ১০–৫৫, নারী ৭–৩০ U/L', rangeTextEn: 'Men 10–55, women 7–30 U/L',
    rangeNoteBn: 'সূত্রভেদে অনেক ভিন্ন (MedlinePlus ৪–৩৬; Mayo ৭–৫৬; ACG-র সুস্থ সীমা পুরুষ ২৯–৩৩, নারী ১৯–২৫)। ল্যাবের নিজের range-ই আসল।',
    rangeNoteEn: 'Sources differ a lot (MedlinePlus 4–36; Mayo 7–56; ACG healthy limit men 29–33, women 19–25). Your lab’s own range wins.',
    redFlagBn: '১,০০০ U/L বা তার বেশি হলে জরুরি চিকিৎসা দরকার হতে পারে।',
    redFlagEn: '1,000 U/L or more may need urgent care.',
    prep: { ...PREP_NONE, medicinesBn: 'প্যারাসিটামলসহ যেসব ওষুধ লিভারে প্রভাব ফেলে, তা ল্যাবকে জানান। পরীক্ষার আগে মদ্যপান এড়িয়ে চলুন।', medicinesEn: 'Tell the lab about medicines that affect the liver, including paracetamol. Avoid alcohol before the test.' },
    repeatBn: 'বেশি থাকলে ডাক্তারের পরামর্শে ২–৪ সপ্তাহ পর আবার; সুস্থ থাকলে বছরে একবার।',
    repeatEn: 'After 2–4 weeks on a doctor’s advice if high; once a year when healthy.',
    costBdt: { min: 200, max: 350 }, costNoteBn: COST_NOTE.bn, costNoteEn: COST_NOTE.en,
    sources: LIVER_SOURCES, sourceDate: CHECKED, questionsBn: Q_LIVER.bn, questionsEn: Q_LIVER.en,
  },
  {
    id: 'sgot-ast', panel: 'liver', nameBn: 'এসজিওটি (AST)', nameEn: 'SGOT (AST)', shortName: 'SGOT',
    keywordsBn: ['লিভার', 'জন্ডিস', 'এসজিওটি'], keywordsEn: ['liver', 'jaundice', 'sgot'],
    measuresBn: 'লিভার, পেশি ও হৃদপিণ্ডে থাকা এনজাইম AST মাপে।', measuresEn: 'Measures the enzyme AST, found in liver, muscle and heart.',
    whyBn: 'লিভারের ক্ষতি বা পেশির সমস্যা দেখতে করা হয়।',
    whyEn: 'Done to check liver damage or muscle trouble.',
    sampleBn: 'রক্ত', sampleEn: 'Blood', fastingHours: null, kind: 'numeric', unit: 'U/L',
    bands: AST_BANDS, rangeTextBn: '১০–৪০ U/L', rangeTextEn: '10–40 U/L',
    rangeNoteBn: 'MedlinePlus ৮–৩৩ U/L দেয়; কিছু ল্যাব ৮–৪৮ পর্যন্ত দেয়।',
    rangeNoteEn: 'MedlinePlus gives 8–33 U/L; some labs go up to 8–48.',
    redFlagBn: '১,০০০ U/L বা তার বেশি হলে জরুরি চিকিৎসা দরকার হতে পারে।',
    redFlagEn: '1,000 U/L or more may need urgent care.',
    prep: { ...PREP_NONE, notesBn: 'ভারী ব্যায়ামের পর AST কিছুটা বাড়তে পারে — পরীক্ষার আগের দিন ভারী ব্যায়াম এড়িয়ে চলুন।', notesEn: 'Heavy exercise can raise AST a little — avoid it the day before the test.' },
    repeatBn: 'বেশি থাকলে ডাক্তারের পরামর্শে ২–৪ সপ্তাহ পর আবার; সুস্থ থাকলে বছরে একবার।',
    repeatEn: 'After 2–4 weeks on a doctor’s advice if high; once a year when healthy.',
    costBdt: { min: 200, max: 350 }, costNoteBn: COST_NOTE.bn, costNoteEn: COST_NOTE.en,
    sources: LIVER_SOURCES, sourceDate: CHECKED, questionsBn: Q_LIVER.bn, questionsEn: Q_LIVER.en,
  },
  {
    id: 'bilirubin-total', panel: 'liver', nameBn: 'মোট বিলিরুবিন', nameEn: 'Total Bilirubin', shortName: 'Bilirubin',
    keywordsBn: ['লিভার', 'জন্ডিস', 'হলুদ', 'বিলিরুবিন'], keywordsEn: ['liver', 'jaundice', 'yellow', 'bilirubin'],
    measuresBn: 'রক্তে বিলিরুবিন (লোহিতকণিকা ভাঙার ফলে তৈরি হলুদ রঞ্জক) মাপে।', measuresEn: 'Measures bilirubin in blood (the yellow pigment from broken-down red cells).',
    whyBn: 'জন্ডিস, লিভার বা পিত্তনালীর সমস্যা দেখতে করা হয়।',
    whyEn: 'Done to check jaundice, liver or bile-duct trouble.',
    sampleBn: 'রক্ত', sampleEn: 'Blood', fastingHours: null, kind: 'numeric', unit: 'mg/dL', altUnits: ['mg/dL', 'µmol/L'],
    bands: BILIRUBIN_BANDS, rangeTextBn: '০.১–১.২ mg/dL', rangeTextEn: '0.1–1.2 mg/dL',
    rangeNoteBn: 'কিছু ল্যাব ০.২–১.৯ mg/dL পর্যন্ত দেয়।',
    rangeNoteEn: 'Some labs give up to 0.2–1.9 mg/dL.',
    redFlagBn: '১৫ mg/dL বা তার বেশি হলে জরুরি চিকিৎসা দরকার হতে পারে।',
    redFlagEn: '15 mg/dL or more may need urgent care.',
    prep: PREP_NONE, repeatBn: 'বেশি থাকলে ডাক্তারের পরামর্শে ২–৪ সপ্তাহ পর আবার।',
    repeatEn: 'After 2–4 weeks on a doctor’s advice if high.',
    costBdt: { min: 200, max: 350 }, costNoteBn: COST_NOTE.bn, costNoteEn: COST_NOTE.en,
    sources: LIVER_SOURCES, sourceDate: CHECKED, questionsBn: Q_LIVER.bn, questionsEn: Q_LIVER.en,
  },
  {
    id: 'albumin', panel: 'liver', nameBn: 'অ্যালবুমিন', nameEn: 'Albumin', shortName: 'Albumin',
    keywordsBn: ['লিভার', 'প্রোটিন', 'ফোলা'], keywordsEn: ['liver', 'protein', 'swelling'],
    measuresBn: 'লিভারে তৈরি প্রোটিন অ্যালবুমিনের পরিমাণ মাপে।', measuresEn: 'Measures albumin, a protein made by the liver.',
    whyBn: 'লিভার ও কিডনির কাজ এবং পুষ্টির অবস্থা দেখতে করা হয়।',
    whyEn: 'Done to check liver and kidney function and nutrition.',
    sampleBn: 'রক্ত', sampleEn: 'Blood', fastingHours: null, kind: 'numeric', unit: 'g/dL',
    bands: ALBUMIN_BANDS, rangeTextBn: '৩.৫–৫.০ g/dL', rangeTextEn: '3.5–5.0 g/dL',
    rangeNoteBn: 'MedlinePlus ৩.৪–৫.৪ g/dL দেয়; কিছু ল্যাব ৩.৫–৫.৫ পর্যন্ত দেয়।',
    rangeNoteEn: 'MedlinePlus gives 3.4–5.4 g/dL; some labs go up to 3.5–5.5.',
    redFlagBn: '১.৫ g/dL-এর নিচে হলে জরুরি চিকিৎসা দরকার হতে পারে।',
    redFlagEn: 'Below 1.5 g/dL may need urgent care.',
    prep: PREP_NONE, repeatBn: 'কম থাকলে ডাক্তারের পরামর্শে ১–৩ মাস পর আবার।',
    repeatEn: 'After 1–3 months on a doctor’s advice if low.',
    costBdt: { min: 200, max: 350 }, costNoteBn: COST_NOTE.bn, costNoteEn: COST_NOTE.en,
    sources: LIVER_SOURCES, sourceDate: CHECKED, questionsBn: Q_LIVER.bn, questionsEn: Q_LIVER.en,
  },
];
const LAB_TESTS_REST: LabTest[] = [
  {
    id: 'creatinine', panel: 'kidney', nameBn: 'ক্রিয়েটিনিন', nameEn: 'Creatinine', shortName: 'Creatinine',
    keywordsBn: ['কিডনি', 'ক্রিয়েটিনিন'], keywordsEn: ['kidney', 'creatinine'],
    measuresBn: 'রক্তে ক্রিয়েটিনিন মাপে — কিডনি ঠিকমতো ছাঁকছে কি না, তা বোঝায়।', measuresEn: 'Measures creatinine in blood — shows whether the kidneys are filtering well.',
    whyBn: 'কিডনির কাজ পরীক্ষা করতে করা হয়।',
    whyEn: 'Done to check how the kidneys are working.',
    sampleBn: 'রক্ত', sampleEn: 'Blood', fastingHours: null, kind: 'numeric', unit: 'mg/dL', altUnits: ['mg/dL', 'µmol/L'],
    bandsFor: creatinineBands, rangeTextBn: 'পুরুষ ০.৭৪–১.৩৫, নারী ০.৫৯–১.০৪ mg/dL', rangeTextEn: 'Men 0.74–1.35, women 0.59–1.04 mg/dL',
    rangeNoteBn: 'অন্যান্য সূত্র: ACP ০.৭–১.৩; Medscape পুরুষ ০.৬–১.২, নারী ০.৫–১.১। পেশি বেশি থাকলে মান বেশি হতে পারে।',
    rangeNoteEn: 'Other sources: ACP 0.7–1.3; Medscape men 0.6–1.2, women 0.5–1.1. More muscle can raise the value.',
    redFlagBn: '৪ mg/dL বা তার বেশি হলে জরুরি ডাক্তার দেখান।',
    redFlagEn: '4 mg/dL or more — urgent care may be needed.',
    prep: { ...PREP_NONE, notesBn: 'পরীক্ষার আগে বেশি মাংস খেলে বা ক্রিয়েটিন সাপ্লিমেন্ট নিলে মান বাড়তে পারে — ল্যাবকে জানান।', notesEn: 'Eating a lot of meat or taking creatine supplements before the test can raise the value — tell the lab.' },
    repeatBn: 'কিডনির সমস্যা থাকলে ডাক্তারের পরামর্শে নিয়মিত; সুস্থ থাকলে বছরে একবার।',
    repeatEn: 'Regularly on a doctor’s advice with kidney trouble; once a year when healthy.',
    costBdt: { min: 200, max: 300 }, costNoteBn: COST_NOTE.bn, costNoteEn: COST_NOTE.en,
    sources: KIDNEY_SOURCES, sourceDate: CHECKED, questionsBn: Q_KIDNEY.bn, questionsEn: Q_KIDNEY.en,
  },
  {
    id: 'urea', panel: 'kidney', nameBn: 'ইউরিয়া (BUN)', nameEn: 'Urea (BUN)', shortName: 'Urea',
    keywordsBn: ['কিডনি', 'ইউরিয়া', 'বান'], keywordsEn: ['kidney', 'urea', 'bun'],
    measuresBn: 'রক্তে ইউরিয়া (প্রোটিন ভাঙার বর্জ্য) মাপে।', measuresEn: 'Measures urea in blood (waste from breaking down protein).',
    whyBn: 'কিডনির কাজ ও পানিশূন্যতা দেখতে করা হয়।',
    whyEn: 'Done to check kidney function and dehydration.',
    sampleBn: 'রক্ত', sampleEn: 'Blood', fastingHours: null, kind: 'numeric', unit: 'mg/dL',
    bands: UREA_BANDS, rangeTextBn: '৭–২০ mg/dL', rangeTextEn: '7–20 mg/dL',
    rangeNoteBn: 'ACP ৮–২০ ও Medscape ১০–২০ mg/dL দেয়।',
    rangeNoteEn: 'ACP gives 8–20 and Medscape 10–20 mg/dL.',
    redFlagBn: '৬০ mg/dL বা তার বেশি হলে জরুরি চিকিৎসা দরকার হতে পারে।',
    redFlagEn: '60 mg/dL or more may need urgent care.',
    prep: PREP_NONE, repeatBn: 'কিডনির সমস্যা থাকলে ডাক্তারের পরামর্শে নিয়মিত।',
    repeatEn: 'Regularly on a doctor’s advice with kidney trouble.',
    costBdt: { min: 200, max: 300 }, costNoteBn: COST_NOTE.bn, costNoteEn: COST_NOTE.en,
    sources: KIDNEY_SOURCES, sourceDate: CHECKED, questionsBn: Q_KIDNEY.bn, questionsEn: Q_KIDNEY.en,
  },
  {
    id: 'egfr', panel: 'kidney', nameBn: 'ইজিএফআর', nameEn: 'eGFR', shortName: 'eGFR',
    keywordsBn: ['কিডনি', 'ইজিএফআর', 'ছাঁকনি'], keywordsEn: ['kidney', 'egfr', 'filtration'],
    measuresBn: 'ক্রিয়েটিনিন, বয়স ও লিঙ্গ দিয়ে কিডনির ছাঁকনির হার হিসাব করে।', measuresEn: 'Estimates the kidneys’ filtering rate from creatinine, age and sex.',
    whyBn: 'কিডনি রোগের ধাপ বুঝতে করা হয়।',
    whyEn: 'Done to understand the stage of kidney disease.',
    sampleBn: 'রক্ত (ক্রিয়েটিনিন থেকে হিসাব)', sampleEn: 'Blood (calculated from creatinine)', fastingHours: null, kind: 'numeric', unit: 'mL/min/1.73m²',
    bands: EGFR_BANDS, rangeTextBn: '৯০ বা তার বেশি mL/min/1.73m²', rangeTextEn: '90 or more mL/min/1.73m²',
    rangeNoteBn: 'KDIGO ধাপ: ৬০–৮৯ হালকা কম, ৪৫–৫৯ ও ৩০–৪৪ মাঝারি কম, ১৫–২৯ অনেক কম, ১৫-এর নিচে কিডনি ফেইলিউরের সীমা। বয়স বাড়লে ৬০–৮৯ স্বাভাবিকও হতে পারে।',
    rangeNoteEn: 'KDIGO stages: 60–89 mildly low, 45–59 and 30–44 moderately low, 15–29 much lower, below 15 kidney-failure range. 60–89 can be normal with age.',
    redFlagBn: '৩০-এর নিচে হলে জরুরি ডাক্তার দেখান।',
    redFlagEn: 'Below 30 — urgent care may be needed.',
    prep: PREP_NONE, repeatBn: 'কিডনির সমস্যা থাকলে ডাক্তারের পরামর্শে প্রতি ৩–৬ মাসে।',
    repeatEn: 'Every 3–6 months on a doctor’s advice with kidney trouble.',
    costBdt: null, costNoteBn: 'সাধারণত ক্রিয়েটিনিনের রিপোর্টেই হিসাব করে দেওয়া থাকে — আলাদা খরচ নেই।',
    costNoteEn: 'Usually calculated on the creatinine report — no separate cost.',
    sources: [...KIDNEY_SOURCES, 'KDIGO — CKD staging (eGFR categories)'],
    sourceDate: CHECKED, questionsBn: Q_KIDNEY.bn, questionsEn: Q_KIDNEY.en,
  },
  {
    id: 'uric-acid', panel: 'kidney', nameBn: 'ইউরিক অ্যাসিড', nameEn: 'Uric Acid', shortName: 'Uric Acid',
    keywordsBn: ['গাউট', 'গেঁটে বাত', 'পাথর', 'কিডনি'], keywordsEn: ['gout', 'arthritis', 'stone', 'kidney'],
    measuresBn: 'রক্তে ইউরিক অ্যাসিড মাপে — বেশি হলে গাউট বা পাথর হতে পারে।', measuresEn: 'Measures uric acid in blood — high levels can lead to gout or stones.',
    whyBn: 'গাউট (গেঁটে বাত) বা কিডনিতে পাথরের ঝুঁকি দেখতে করা হয়।',
    whyEn: 'Done to check gout or kidney-stone risk.',
    sampleBn: 'রক্ত', sampleEn: 'Blood', fastingHours: null, kind: 'numeric', unit: 'mg/dL',
    bandsFor: uricAcidBands, rangeTextBn: 'পুরুষ ৩.৪–৭.০, নারী ২.৪–৬.০ mg/dL', rangeTextEn: 'Men 3.4–7.0, women 2.4–6.0 mg/dL',
    rangeNoteBn: 'ACP পুরুষের উপরের সীমা ৮.৬ পর্যন্ত দেয়।',
    rangeNoteEn: 'ACP gives a male upper limit up to 8.6.',
    redFlagBn: 'খুব বেশি হলে গাঁটে তীব্র ব্যথা বা প্রস্রাবে রক্ত দেখলে ডাক্তার দেখান।',
    redFlagEn: 'Very high with severe joint pain or blood in urine — see a doctor.',
    prep: { ...PREP_NONE, notesBn: 'পরীক্ষার আগে মাংস, কলিজা বা মদ্যপান বেশি করলে মান বাড়তে পারে।', notesEn: 'Eating a lot of meat or offal, or drinking alcohol before the test, can raise the value.' },
    repeatBn: 'গাউট থাকলে ডাক্তারের পরামর্শে ৩–৬ মাস পর আবার।',
    repeatEn: 'After 3–6 months on a doctor’s advice with gout.',
    costBdt: { min: 200, max: 300 }, costNoteBn: COST_NOTE.bn, costNoteEn: COST_NOTE.en,
    sources: KIDNEY_SOURCES, sourceDate: CHECKED, questionsBn: Q_KIDNEY.bn, questionsEn: Q_KIDNEY.en,
  },
  {
    id: 'tsh', panel: 'thyroid', nameBn: 'টিএসএইচ', nameEn: 'TSH', shortName: 'TSH',
    keywordsBn: ['থাইরয়েড', 'ওজন', 'ক্লান্তি', 'চুল'], keywordsEn: ['thyroid', 'weight', 'tired', 'hair'],
    measuresBn: 'পিটুইটারি গ্রন্থির হরমোন TSH মাপে — থাইরয়েডকে কাজের নির্দেশ দেয়।', measuresEn: 'Measures TSH, the pituitary hormone that tells the thyroid to work.',
    whyBn: 'থাইরয়েড কম বা বেশি কাজ করছে কি না, তা দেখতে করা হয়।',
    whyEn: 'Done to check whether the thyroid is under- or overactive.',
    sampleBn: 'রক্ত', sampleEn: 'Blood', fastingHours: null, kind: 'numeric', unit: 'mIU/L',
    bands: TSH_BANDS, rangeTextBn: '০.৪–৪.০ mIU/L', rangeTextEn: '0.4–4.0 mIU/L',
    rangeNoteBn: 'কিছু ল্যাব উপরের সীমা ৪.৫ বা ৪.৮ পর্যন্ত দেয়; বয়স্কদের ক্ষেত্রে সীমা কিছুটা বেশি হতে পারে।',
    rangeNoteEn: 'Some labs give an upper limit up to 4.5 or 4.8; it may be a little higher in older adults.',
    redFlagBn: '১০ mIU/L-এর বেশি বা ০.১-এর নিচে হলে শীঘ্রই ডাক্তার দেখান।',
    redFlagEn: 'Above 10 or below 0.1 mIU/L — see a doctor soon.',
    prep: PREP_MORNING, repeatBn: 'থাইরয়েডের ওষুধ চললে ৬–৮ সপ্তাহ পর আবার; সুস্থ থাকলে বছরে একবার।',
    repeatEn: 'After 6–8 weeks when on thyroid medicine; once a year when healthy.',
    costBdt: { min: 800, max: 1200 }, costNoteBn: COST_NOTE.bn, costNoteEn: COST_NOTE.en,
    sources: THYROID_SOURCES, sourceDate: CHECKED, questionsBn: Q_THYROID.bn, questionsEn: Q_THYROID.en,
  },
  {
    id: 'free-t3', panel: 'thyroid', nameBn: 'ফ্রি T3', nameEn: 'Free T3', shortName: 'FT3',
    keywordsBn: ['থাইরয়েড', 'টি৩'], keywordsEn: ['thyroid', 't3'],
    measuresBn: 'রক্তে মুক্ত (সক্রিয়) T3 হরমোন মাপে।', measuresEn: 'Measures free (active) T3 hormone in blood.',
    whyBn: 'থাইরয়েড বেশি কাজ করছে কি না, তা বুঝতে TSH-এর সঙ্গে করা হয়।',
    whyEn: 'Done with TSH to see whether the thyroid is overactive.',
    sampleBn: 'রক্ত', sampleEn: 'Blood', fastingHours: null, kind: 'numeric', unit: 'pg/mL',
    bands: FREE_T3_BANDS, rangeTextBn: '২.৩–৪.২ pg/mL', rangeTextEn: '2.3–4.2 pg/mL',
    rangeNoteBn: 'কিছু ল্যাব ২.১–৪.৪ pg/mL দেয়।',
    rangeNoteEn: 'Some labs give 2.1–4.4 pg/mL.',
    redFlagBn: 'TSH-এর সঙ্গে মিলিয়ে দেখতে হয় — একাই রোগ বলে না।',
    redFlagEn: 'Read together with TSH — it alone names no disease.',
    prep: PREP_MORNING, repeatBn: 'ডাক্তারের পরামর্শ অনুযায়ী।',
    repeatEn: 'As the doctor advises.',
    costBdt: { min: 800, max: 1200 }, costNoteBn: COST_NOTE.bn, costNoteEn: COST_NOTE.en,
    sources: THYROID_SOURCES, sourceDate: CHECKED, questionsBn: Q_THYROID.bn, questionsEn: Q_THYROID.en,
  },
  {
    id: 'free-t4', panel: 'thyroid', nameBn: 'ফ্রি T4', nameEn: 'Free T4', shortName: 'FT4',
    keywordsBn: ['থাইরয়েড', 'টি৪'], keywordsEn: ['thyroid', 't4'],
    measuresBn: 'রক্তে মুক্ত (সক্রিয়) T4 হরমোন মাপে।', measuresEn: 'Measures free (active) T4 hormone in blood.',
    whyBn: 'থাইরয়েডের কাজের অবস্থা বুঝতে TSH-এর সঙ্গে করা হয়।',
    whyEn: 'Done with TSH to understand thyroid function.',
    sampleBn: 'রক্ত', sampleEn: 'Blood', fastingHours: null, kind: 'numeric', unit: 'ng/dL',
    bands: FREE_T4_BANDS, rangeTextBn: '০.৮–১.৮ ng/dL', rangeTextEn: '0.8–1.8 ng/dL',
    redFlagBn: 'TSH-এর সঙ্গে মিলিয়ে দেখতে হয় — একাই রোগ বলে না।',
    redFlagEn: 'Read together with TSH — it alone names no disease.',
    prep: PREP_MORNING, repeatBn: 'থাইরয়েডের ওষুধ চললে ৬–৮ সপ্তাহ পর আবার।',
    repeatEn: 'After 6–8 weeks when on thyroid medicine.',
    costBdt: { min: 800, max: 1200 }, costNoteBn: COST_NOTE.bn, costNoteEn: COST_NOTE.en,
    sources: THYROID_SOURCES, sourceDate: CHECKED, questionsBn: Q_THYROID.bn, questionsEn: Q_THYROID.en,
  },
  {
    id: 'sodium', panel: 'electrolyte', nameBn: 'সোডিয়াম', nameEn: 'Sodium', shortName: 'Na+',
    keywordsBn: ['সোডিয়াম', 'লবণ', 'পানি', 'ইলেক্ট্রোলাইট'], keywordsEn: ['sodium', 'salt', 'water', 'electrolyte'],
    measuresBn: 'রক্তে সোডিয়াম (লবণের অংশ) মাপে — শরীরের পানির ভারসাম্য বোঝায়।', measuresEn: 'Measures sodium in blood — shows the body’s water balance.',
    whyBn: 'পানিশূন্যতা, কিডনি বা হরমোনের সমস্যা দেখতে করা হয়।',
    whyEn: 'Done to check dehydration, kidney or hormone trouble.',
    sampleBn: 'রক্ত', sampleEn: 'Blood', fastingHours: null, kind: 'numeric', unit: 'mmol/L',
    bands: SODIUM_BANDS, rangeTextBn: '১৩৫–১৪৫ mmol/L', rangeTextEn: '135–145 mmol/L',
    rangeNoteBn: 'ACP ১৩৬–১৪৫ দেয়।',
    rangeNoteEn: 'ACP gives 136–145.',
    redFlagBn: '১২০-এর নিচে বা ১৬০-এর উপরে হলে জরুরি চিকিৎসা দরকার হতে পারে।',
    redFlagEn: 'Below 120 or above 160 may need urgent care.',
    prep: PREP_NONE, repeatBn: 'সমস্যা থাকলে ডাক্তারের পরামর্শে।',
    repeatEn: 'On a doctor’s advice when there is a problem.',
    costBdt: { min: 250, max: 400 }, costNoteBn: COST_NOTE.bn, costNoteEn: COST_NOTE.en,
    sources: ELECTROLYTE_SOURCES, sourceDate: CHECKED, questionsBn: Q_GENERAL.bn, questionsEn: Q_GENERAL.en,
  },
  {
    id: 'potassium', panel: 'electrolyte', nameBn: 'পটাশিয়াম', nameEn: 'Potassium', shortName: 'K+',
    keywordsBn: ['পটাশিয়াম', 'হৃদস্পন্দন', 'পেশি', 'ইলেক্ট্রোলাইট'], keywordsEn: ['potassium', 'heartbeat', 'muscle', 'electrolyte'],
    measuresBn: 'রক্তে পটাশিয়াম মাপে — হৃদস্পন্দন ও পেশির কাজের জন্য জরুরি।', measuresEn: 'Measures potassium in blood — vital for heartbeat and muscle function.',
    whyBn: 'হৃদস্পন্দনের গোলমাল, পেশির দুর্বলতা বা কিডনির সমস্যা দেখতে করা হয়।',
    whyEn: 'Done to check heart-rhythm trouble, muscle weakness or kidney trouble.',
    sampleBn: 'রক্ত', sampleEn: 'Blood', fastingHours: null, kind: 'numeric', unit: 'mmol/L',
    bands: POTASSIUM_BANDS, rangeTextBn: '৩.৫–৫.০ mmol/L', rangeTextEn: '3.5–5.0 mmol/L',
    rangeNoteBn: 'MedlinePlus ৩.৭–৫.২ দেয়।',
    rangeNoteEn: 'MedlinePlus gives 3.7–5.2.',
    redFlagBn: '৩.০-এর নিচে বা ৬.০-এর উপরে হলে জরুরি চিকিৎসা দরকার হতে পারে।',
    redFlagEn: 'Below 3.0 or above 6.0 may need urgent care.',
    prep: PREP_NONE, repeatBn: 'সমস্যা থাকলে ডাক্তারের পরামর্শে।',
    repeatEn: 'On a doctor’s advice when there is a problem.',
    costBdt: { min: 250, max: 400 }, costNoteBn: COST_NOTE.bn, costNoteEn: COST_NOTE.en,
    sources: ELECTROLYTE_SOURCES, sourceDate: CHECKED, questionsBn: Q_GENERAL.bn, questionsEn: Q_GENERAL.en,
  },
  {
    id: 'calcium', panel: 'electrolyte', nameBn: 'ক্যালসিয়াম', nameEn: 'Calcium', shortName: 'Ca',
    keywordsBn: ['ক্যালসিয়াম', 'হাড়', 'পেশি'], keywordsEn: ['calcium', 'bone', 'muscle'],
    measuresBn: 'রক্তে ক্যালসিয়াম মাপে — হাড়, পেশি ও স্নায়ুর কাজের জন্য জরুরি।', measuresEn: 'Measures calcium in blood — vital for bones, muscles and nerves.',
    whyBn: 'হাড়, প্যারাথাইরয়েড বা কিডনির সমস্যা দেখতে করা হয়।',
    whyEn: 'Done to check bone, parathyroid or kidney trouble.',
    sampleBn: 'রক্ত', sampleEn: 'Blood', fastingHours: null, kind: 'numeric', unit: 'mg/dL',
    bands: CALCIUM_BANDS, rangeTextBn: '৮.৫–১০.৫ mg/dL', rangeTextEn: '8.5–10.5 mg/dL',
    rangeNoteBn: 'MedlinePlus ৮.৫–১০.২ দেয়; StatPearls ৮.৮–১০.৭ দেয়।',
    rangeNoteEn: 'MedlinePlus gives 8.5–10.2; StatPearls gives 8.8–10.7.',
    redFlagBn: '৭.০-এর নিচে বা ১৩.০-এর উপরে হলে জরুরি চিকিৎসা দরকার হতে পারে।',
    redFlagEn: 'Below 7.0 or above 13.0 may need urgent care.',
    prep: PREP_NONE, repeatBn: 'সমস্যা থাকলে ডাক্তারের পরামর্শে।',
    repeatEn: 'On a doctor’s advice when there is a problem.',
    costBdt: { min: 300, max: 500 }, costNoteBn: COST_NOTE.bn, costNoteEn: COST_NOTE.en,
    sources: ELECTROLYTE_SOURCES, sourceDate: CHECKED, questionsBn: Q_GENERAL.bn, questionsEn: Q_GENERAL.en,
  },
  {
    id: 'vitamin-d', panel: 'vitamin', nameBn: 'ভিটামিন ডি', nameEn: 'Vitamin D', shortName: 'Vit D',
    keywordsBn: ['ভিটামিন ডি', 'হাড়', 'ব্যথা', 'ক্লান্তি'], keywordsEn: ['vitamin d', 'bone', 'pain', 'tired'],
    measuresBn: 'রক্তে ২৫-হাইড্রক্সি ভিটামিন ডি মাপে — শরীরে ভিটামিন ডি-র মজুত বোঝায়।', measuresEn: 'Measures 25-hydroxy vitamin D in blood — shows the body’s vitamin D stores.',
    whyBn: 'হাড়ের ব্যথা, দুর্বলতা বা ভিটামিন ডি-র ঘাটতি দেখতে করা হয়।',
    whyEn: 'Done to check bone pain, weakness or vitamin D deficiency.',
    sampleBn: 'রক্ত', sampleEn: 'Blood', fastingHours: null, kind: 'numeric', unit: 'ng/mL',
    bands: VITAMIN_D_BANDS, rangeTextBn: '৩০–১০০ ng/mL', rangeTextEn: '30–100 ng/mL',
    rangeNoteBn: 'কিছু সূত্র ৩০–৬০ বা ৩১–৮০ ng/mL দেয়; NIH অনুযায়ী ২০ ng/mL বা তার বেশি বেশিরভাগ মানুষের জন্য যথেষ্ট।',
    rangeNoteEn: 'Some sources give 30–60 or 31–80 ng/mL; the NIH says 20 ng/mL or more is enough for most people.',
    redFlagBn: '১৫০ ng/mL-এর উপরে হলে জরুরি ডাক্তার দেখান।',
    redFlagEn: 'Above 150 ng/mL — urgent care may be needed.',
    prep: PREP_NONE, repeatBn: 'ঘাটতি থাকলে চিকিৎসার ৩ মাস পর আবার।',
    repeatEn: 'After 3 months of treatment if deficient.',
    costBdt: { min: 2500, max: 4000 }, costNoteBn: COST_NOTE.bn, costNoteEn: COST_NOTE.en,
    sources: VITAMIN_SOURCES, sourceDate: CHECKED, questionsBn: Q_GENERAL.bn, questionsEn: Q_GENERAL.en,
  },
  {
    id: 'vitamin-b12', panel: 'vitamin', nameBn: 'ভিটামিন B12', nameEn: 'Vitamin B12', shortName: 'B12',
    keywordsBn: ['ভিটামিন বি১২', 'রক্তশূন্যতা', 'স্নায়ু', 'ক্লান্তি'], keywordsEn: ['vitamin b12', 'anaemia', 'nerve', 'tired'],
    measuresBn: 'রক্তে ভিটামিন B12 মাপে — লোহিতকণিকা ও স্নায়ুর জন্য জরুরি।', measuresEn: 'Measures vitamin B12 in blood — vital for red cells and nerves.',
    whyBn: 'রক্তশূন্যতা, হাত-পায়ে ঝিনঝিন বা স্মৃতির সমস্যা দেখতে করা হয়।',
    whyEn: 'Done to check anaemia, tingling in hands/feet or memory trouble.',
    sampleBn: 'রক্ত', sampleEn: 'Blood', fastingHours: null, kind: 'numeric', unit: 'pg/mL',
    bands: B12_BANDS, rangeTextBn: '২০০–৯০০ pg/mL', rangeTextEn: '200–900 pg/mL',
    rangeNoteBn: 'ACP ও Medscape ২০০–৮০০ pg/mL দেয়; Utah ১৮০–৯১৪ দেয়।',
    rangeNoteEn: 'ACP and Medscape give 200–800 pg/mL; Utah gives 180–914.',
    redFlagBn: '২০০-এর নিচে হলে ডাক্তার দেখান।',
    redFlagEn: 'Below 200 — see a doctor.',
    prep: { ...PREP_NONE, notesBn: 'B12 সাপ্লিমেন্ট খেলে ফল বেশি দেখাতে পারে — ল্যাবকে জানান।', notesEn: 'B12 supplements can raise the result — tell the lab.' },
    repeatBn: 'ঘাটতি থাকলে চিকিৎসার ৩ মাস পর আবার।',
    repeatEn: 'After 3 months of treatment if deficient.',
    costBdt: { min: 2000, max: 3500 }, costNoteBn: COST_NOTE.bn, costNoteEn: COST_NOTE.en,
    sources: VITAMIN_SOURCES, sourceDate: CHECKED, questionsBn: Q_GENERAL.bn, questionsEn: Q_GENERAL.en,
  },
  {
    id: 'ferritin', panel: 'vitamin', nameBn: 'ফেরিটিন', nameEn: 'Ferritin', shortName: 'Ferritin',
    keywordsBn: ['আয়রন', 'ফেরিটিন', 'রক্তশূন্যতা', 'ক্লান্তি'], keywordsEn: ['iron', 'ferritin', 'anaemia', 'tired'],
    measuresBn: 'শরীরে আয়রনের মজুত (ফেরিটিন) মাপে।', measuresEn: 'Measures ferritin — the body’s iron stores.',
    whyBn: 'আয়রনের ঘাটতি বা আয়রন বেশি জমা দেখতে করা হয়।',
    whyEn: 'Done to check iron deficiency or iron overload.',
    sampleBn: 'রক্ত', sampleEn: 'Blood', fastingHours: null, kind: 'numeric', unit: 'ng/mL',
    bandsFor: ferritinBands, rangeTextBn: 'পুরুষ ১২–৩০০, নারী ১০–১৫০ ng/mL', rangeTextEn: 'Men 12–300, women 10–150 ng/mL',
    rangeNoteBn: 'ল্যাবভেদে সীমা অনেক ভিন্ন হতে পারে (কিছু ল্যাব পুরুষ ২৪–৩৩৬, নারী ১১–৩০৭ দেয়)। প্রদাহ থাকলে ফেরিটিন বাড়তে পারে।',
    rangeNoteEn: 'Limits vary a lot by lab (some give men 24–336, women 11–307). Inflammation can raise ferritin.',
    redFlagBn: '১,০০০ ng/mL-এর উপরে হলে শীঘ্রই ডাক্তার দেখান।',
    redFlagEn: 'Above 1,000 ng/mL — see a doctor soon.',
    prep: PREP_NONE, repeatBn: 'আয়রনের ঘাটতি থাকলে চিকিৎসার ৩ মাস পর আবার।',
    repeatEn: 'After 3 months of treatment if iron-deficient.',
    costBdt: { min: 1500, max: 2500 }, costNoteBn: COST_NOTE.bn, costNoteEn: COST_NOTE.en,
    sources: VITAMIN_SOURCES, sourceDate: CHECKED, questionsBn: Q_GENERAL.bn, questionsEn: Q_GENERAL.en,
  },
  {
    id: 'crp', panel: 'vitamin', nameBn: 'সিআরপি', nameEn: 'CRP', shortName: 'CRP',
    keywordsBn: ['প্রদাহ', 'সিআরপি', 'জ্বর', 'সংক্রমণ'], keywordsEn: ['inflammation', 'crp', 'fever', 'infection'],
    measuresBn: 'রক্তে C-রিঅ্যাকটিভ প্রোটিন মাপে — শরীরে প্রদাহ থাকলে বাড়ে।', measuresEn: 'Measures C-reactive protein in blood — rises when there is inflammation.',
    whyBn: 'সংক্রমণ বা প্রদাহের মাত্রা বুঝতে করা হয়।',
    whyEn: 'Done to understand the level of infection or inflammation.',
    sampleBn: 'রক্ত', sampleEn: 'Blood', fastingHours: null, kind: 'numeric', unit: 'mg/L',
    bands: CRP_BANDS, rangeTextBn: '১০ mg/L-এর নিচে', rangeTextEn: 'Below 10 mg/L',
    rangeNoteBn: 'hs-CRP (হৃদরোগের ঝুঁকির পরীক্ষা) আলাদা — সেখানে ১-এর নিচে কম ঝুঁকি, ১–৩ গড়, ৩-এর উপরে বেশি ঝুঁকি ধরা হয় (AHA/CDC)।',
    rangeNoteEn: 'hs-CRP (the heart-risk test) is different — below 1 is lower risk, 1–3 average, above 3 higher risk (AHA/CDC).',
    redFlagBn: '১০০ mg/L-এর উপরে হলে শীঘ্রই ডাক্তার দেখান।',
    redFlagEn: 'Above 100 mg/L — see a doctor soon.',
    prep: PREP_NONE, repeatBn: 'সংক্রমণের চিকিৎসা চললে ডাক্তারের পরামর্শে।',
    repeatEn: 'On a doctor’s advice while treating an infection.',
    costBdt: { min: 800, max: 1500 }, costNoteBn: COST_NOTE.bn, costNoteEn: COST_NOTE.en,
    sources: [...VITAMIN_SOURCES, 'AHA/CDC — hs-CRP cardiovascular risk bands'],
    sourceDate: CHECKED, questionsBn: Q_GENERAL.bn, questionsEn: Q_GENERAL.en,
  },
  {
    id: 'urine-protein', panel: 'urine', nameBn: 'প্রস্রাবে প্রোটিন', nameEn: 'Urine Protein', shortName: 'Urine Protein',
    keywordsBn: ['প্রস্রাব', 'প্রোটিন', 'কিডনি', 'ফোলা'], keywordsEn: ['urine', 'protein', 'kidney', 'swelling'],
    measuresBn: 'প্রস্রাবে প্রোটিন (অ্যালবুমিন) আছে কি না, তা দেখে।', measuresEn: 'Checks whether there is protein (albumin) in urine.',
    whyBn: 'কিডনির ক্ষতি বা রোগ দেখতে করা হয়।',
    whyEn: 'Done to check kidney damage or disease.',
    sampleBn: 'প্রস্রাব', sampleEn: 'Urine', fastingHours: null, kind: 'categorical',
    categories: URINE_PROTEIN_CATS, rangeTextBn: 'নেগেটিভ বা সামান্য (Trace)', rangeTextEn: 'Negative or trace',
    redFlagBn: '২+ বা ৩+ হলে শীঘ্রই ডাক্তার দেখান।',
    redFlagEn: '2+ or 3+ — see a doctor soon.',
    prep: { ...PREP_NONE, notesBn: 'সকালের প্রথম প্রস্রাবের নমুনা ভালো। নমুনা দেওয়ার আগে পরিচ্ছন্ন থাকুন।', notesEn: 'A first-morning urine sample is best. Clean yourself before giving the sample.' },
    repeatBn: 'পজিটিভ হলে ডাক্তারের পরামর্শে আবার করান (২৪ ঘণ্টার প্রস্রাব বা ACR পরীক্ষা লাগতে পারে)।',
    repeatEn: 'If positive, repeat on a doctor’s advice (a 24-hour urine or ACR test may be needed).',
    costBdt: { min: 150, max: 300 }, costNoteBn: 'প্রস্রাব R/E প্যাকেজের অংশ হিসেবে। ' + COST_NOTE.bn, costNoteEn: 'As part of the urine R/E package. ' + COST_NOTE.en,
    sources: ['Cleveland Clinic — Urinalysis', 'MedlinePlus — Urinalysis', 'Davis’s Lab & Diagnostic Tests — Urinalysis'],
    sourceDate: CHECKED, questionsBn: Q_KIDNEY.bn, questionsEn: Q_KIDNEY.en,
  },
  {
    id: 'urine-sugar', panel: 'urine', nameBn: 'প্রস্রাবে সুগার', nameEn: 'Urine Sugar', shortName: 'Urine Sugar',
    keywordsBn: ['প্রস্রাব', 'সুগার', 'ডায়াবেটিস'], keywordsEn: ['urine', 'sugar', 'diabetes'],
    measuresBn: 'প্রস্রাবে গ্লুকোজ (সুগার) আছে কি না, তা দেখে।', measuresEn: 'Checks whether there is glucose (sugar) in urine.',
    whyBn: 'ডায়াবেটিসের ধারণা পেতে বা রক্তের শর্করা খুব বেশি কি না, তা দেখতে করা হয়।',
    whyEn: 'Done to get an idea of diabetes or very high blood sugar.',
    sampleBn: 'প্রস্রাব', sampleEn: 'Urine', fastingHours: null, kind: 'categorical',
    categories: URINE_SUGAR_CATS, rangeTextBn: 'নেগেটিভ', rangeTextEn: 'Negative',
    redFlagBn: '২+ বা ৩+ হলে শীঘ্রই ডাক্তার দেখান; FBS/HbA1c করিয়ে দেখুন।',
    redFlagEn: '2+ or 3+ — see a doctor soon; check FBS/HbA1c.',
    prep: { ...PREP_NONE, notesBn: 'সকালের প্রথম প্রস্রাবের নমুনা ভালো।', notesEn: 'A first-morning urine sample is best.' },
    repeatBn: 'পজিটিভ হলে রক্তের শর্করা (FBS/HbA1c) করিয়ে দেখুন।',
    repeatEn: 'If positive, check blood sugar (FBS/HbA1c).',
    costBdt: { min: 150, max: 300 }, costNoteBn: 'প্রস্রাব R/E প্যাকেজের অংশ হিসেবে। ' + COST_NOTE.bn, costNoteEn: 'As part of the urine R/E package. ' + COST_NOTE.en,
    sources: ['Cleveland Clinic — Urinalysis', 'MedlinePlus — Urinalysis', 'Davis’s Lab & Diagnostic Tests — Urinalysis'],
    sourceDate: CHECKED, questionsBn: Q_DIABETES.bn, questionsEn: Q_DIABETES.en,
  },
  {
    id: 'dengue-ns1', panel: 'infection', nameBn: 'ডেঙ্গু NS1', nameEn: 'Dengue NS1', shortName: 'NS1',
    keywordsBn: ['ডেঙ্গু', 'জ্বর', 'এনএস১'], keywordsEn: ['dengue', 'fever', 'ns1'],
    measuresBn: 'রক্তে ডেঙ্গু ভাইরাসের NS1 অ্যান্টিজেন আছে কি না, তা দেখে (জ্বরের প্রথম দিনগুলোতে)।', measuresEn: 'Checks for dengue virus NS1 antigen in blood (in the first days of fever).',
    whyBn: 'জ্বরের শুরুর দিকে ডেঙ্গু আছে কি না, তা দেখতে করা হয়।',
    whyEn: 'Done to check for dengue in the early days of fever.',
    sampleBn: 'রক্ত', sampleEn: 'Blood', fastingHours: null, kind: 'categorical',
    categories: DENGUE_NS1_CATS, rangeTextBn: 'নেগেটিভ', rangeTextEn: 'Negative',
    redFlagBn: 'পজিটিভ হলে ডাক্তার দেখান; রক্তপাত, পেট ব্যথা বা প্লেটলেট কম থাকলে জরুরি চিকিৎসা নিন।',
    redFlagEn: 'If positive, see a doctor; bleeding, stomach pain or low platelets need urgent care.',
    prep: { ...PREP_NONE, notesBn: 'জ্বর শুরুর প্রথম ৭ দিনের মধ্যে করালে সবচেয়ে ভালো ধরা পড়ে।', notesEn: 'Best detected within the first 7 days of fever.' },
    repeatBn: 'নেগেটিভ হলেও জ্বর থাকলে ডাক্তারের পরামর্শে IgM/IgG বা প্লেটলেট পরীক্ষা লাগতে পারে।',
    repeatEn: 'Even if negative, fever may still need IgM/IgG or platelet tests on a doctor’s advice.',
    costBdt: { min: 800, max: 1500 }, costNoteBn: COST_NOTE.bn, costNoteEn: COST_NOTE.en,
    sources: ['CDC — Dengue diagnosis and testing', 'WHO — Dengue and severe dengue fact sheet', 'Muller et al., J Infect Dis 2017 (PubMed)'],
    sourceDate: CHECKED, questionsBn: Q_GENERAL.bn, questionsEn: Q_GENERAL.en,
  },
  {
    id: 'hbsag', panel: 'infection', nameBn: 'এইচবিএসএজি (হেপাটাইটিস বি)', nameEn: 'HBsAg (Hepatitis B)', shortName: 'HBsAg',
    keywordsBn: ['হেপাটাইটিস', 'জন্ডিস', 'লিভার', 'এইচবিএসএজি'], keywordsEn: ['hepatitis', 'jaundice', 'liver', 'hbsag'],
    measuresBn: 'রক্তে হেপাটাইটিস বি ভাইরাসের সারফেস অ্যান্টিজেন আছে কি না, তা দেখে।', measuresEn: 'Checks for hepatitis B virus surface antigen in blood.',
    whyBn: 'হেপাটাইটিস বি সংক্রমণ আছে কি না, তা দেখতে করা হয়।',
    whyEn: 'Done to check for hepatitis B infection.',
    sampleBn: 'রক্ত', sampleEn: 'Blood', fastingHours: null, kind: 'categorical',
    categories: HBSAG_CATS, rangeTextBn: 'নেগেটিভ', rangeTextEn: 'Negative',
    redFlagBn: 'পজিটিভ হলে ডাক্তার দেখান — আরও পরীক্ষা (anti-HBs, anti-HBc, HBV DNA) লাগতে পারে।',
    redFlagEn: 'If positive, see a doctor — more tests (anti-HBs, anti-HBc, HBV DNA) may be needed.',
    prep: PREP_NONE, repeatBn: 'পজিটিভ হলে ৬ মাস পর আবার — তখনও পজিটিভ থাকলে "ক্রনিক" বলা হতে পারে।',
    repeatEn: 'If positive, again after 6 months — still positive then may be called “chronic”.',
    costBdt: { min: 600, max: 1000 }, costNoteBn: COST_NOTE.bn, costNoteEn: COST_NOTE.en,
    sources: ['MedlinePlus — Hepatitis virus panel', 'CDC — Interpretation of Hepatitis B Serologic Test Results', 'U.S. VA — Viral Hepatitis and Liver Disease'],
    sourceDate: CHECKED, questionsBn: Q_LIVER.bn, questionsEn: Q_LIVER.en,
  },
  {
    id: 'beta-hcg', panel: 'other', nameBn: 'বিটা-এইচসিজি (গর্ভাবস্থা)', nameEn: 'Beta-hCG (Pregnancy)', shortName: 'β-hCG',
    keywordsBn: ['গর্ভাবস্থা', 'প্রেগন্যান্সি', 'এইচসিজি'], keywordsEn: ['pregnancy', 'hcg'],
    measuresBn: 'রক্তে গর্ভাবস্থার হরমোন β-hCG মাপে।', measuresEn: 'Measures the pregnancy hormone β-hCG in blood.',
    whyBn: 'গর্ভাবস্থা আছে কি না, তা নিশ্চিত করতে এবং শুরুর দিকে গর্ভের অবস্থা দেখতে করা হয়।',
    whyEn: 'Done to confirm pregnancy and to watch the early pregnancy.',
    sampleBn: 'রক্ত', sampleEn: 'Blood', fastingHours: null, kind: 'numeric', unit: 'mIU/mL',
    bands: BHCG_BANDS, rangeTextBn: 'গর্ভবতী নয়: ৫-এর নিচে mIU/mL', rangeTextEn: 'Not pregnant: below 5 mIU/mL',
    rangeNoteBn: 'গর্ভাবস্থায় সপ্তাহ অনুযায়ী মান অনেক বদলায় (যেমন ৩ সপ্তাহে ৫–৫০, ৭–৮ সপ্তাহে ৭,৬৫০–২২৯,০০০)। তাই একক মান দিয়ে সপ্তাহ বলা যায় না।',
    rangeNoteEn: 'In pregnancy the value varies a lot by week (e.g. 5–50 at 3 weeks, 7,650–229,000 at 7–8 weeks). One value cannot date the pregnancy.',
    redFlagBn: 'পেটে একদিকে তীব্র ব্যথা বা রক্তপাত থাকলে জরুরি ডাক্তার দেখান (এক্টোপিক গর্ভাবস্থার আশঙ্কা থাকতে পারে)।',
    redFlagEn: 'Severe one-sided stomach pain or bleeding — urgent care may be needed (ectopic pregnancy risk).',
    prep: { ...PREP_NONE, notesBn: 'সকালের প্রথম প্রস্রাবের নমুনা (ইউরিন টেস্টের ক্ষেত্রে) ভালো।', notesEn: 'A first-morning sample is best (for the urine test).' },
    repeatBn: 'অনিশ্চিত হলে ৪৮ ঘণ্টা পর আবার — স্বাভাবিক গর্ভাবস্থায় মান প্রায় দ্বিগুণ হয়।',
    repeatEn: 'If indeterminate, again after 48 hours — in a normal pregnancy the value roughly doubles.',
    costBdt: { min: 1000, max: 1800 }, costNoteBn: COST_NOTE.bn, costNoteEn: COST_NOTE.en,
    sources: ['MedicineNet — What Is a Positive Beta hCG Level?', 'Cleveland Clinic Laboratories — Beta hCG, Quantitative', 'Johns Hopkins Handbook of Obstetrics and Gynecology'],
    sourceDate: CHECKED, questionsBn: ['আমার এই মান অনুযায়ী গর্ভাবস্থা কত সপ্তাহের হতে পারে?', 'আমাকে কি আল্ট্রাসনোগ্রাম করাতে হবে?'], questionsEn: ['About how many weeks pregnant could I be at this value?', 'Do I need an ultrasound?'],
  },
  {
    id: 'blood-group', panel: 'other', nameBn: 'রক্তের গ্রুপ', nameEn: 'Blood Group', shortName: 'Blood Group',
    keywordsBn: ['রক্তের গ্রুপ', 'ব্লাড গ্রুপ', 'রক্তদান'], keywordsEn: ['blood group', 'blood type', 'donate'],
    measuresBn: 'রক্তের ABO গ্রুপ ও Rh (+/−) নির্ণয় করে।', measuresEn: 'Finds the ABO blood group and Rh (+/−).',
    whyBn: 'রক্ত দেওয়া-নেওয়া, গর্ভাবস্থা বা অস্ত্রোপচারের আগে জানা দরকার।',
    whyEn: 'Needed before giving or receiving blood, in pregnancy, or before surgery.',
    sampleBn: 'রক্ত', sampleEn: 'Blood', fastingHours: null, kind: 'categorical',
    categories: BLOOD_GROUP_CATS, rangeTextBn: 'A+, A-, B+, B-, AB+, AB-, O+, O-', rangeTextEn: 'A+, A-, B+, B-, AB+, AB-, O+, O-',
    redFlagBn: 'রক্তের গ্রুপের ফলাফলে "জরুরি" বলে কিছু নেই — তবে গর্ভাবস্থায় Rh নেগেটিভ হলে ডাক্তারকে জানান।',
    redFlagEn: 'No blood-group result is “urgent” — but tell the doctor if Rh-negative in pregnancy.',
    prep: PREP_NONE, repeatBn: 'জীবনে একবার জানলেই হয়; সন্দেহ থাকলে আবার করান।',
    repeatEn: 'Once in a lifetime is enough; repeat if in doubt.',
    costBdt: { min: 150, max: 250 }, costNoteBn: COST_NOTE.bn, costNoteEn: COST_NOTE.en,
    sources: ['NHS Blood and Transplant — Blood groups', 'American Red Cross — Blood types'],
    sourceDate: CHECKED, questionsBn: ['আমার গ্রুপ অনুযায়ী কাদের রক্ত দিতে পারব?', 'গর্ভাবস্থায় আমার গ্রুপের জন্য কি বিশেষ কিছু লাগবে?'], questionsEn: ['Whom can I donate blood to with my group?', 'Do I need anything special in pregnancy with my group?'],
  },
];

/** The full catalogue: 37 tests (17 + 20). */
export const LAB_TESTS: LabTest[] = [...LAB_TESTS_FIRST, ...LAB_TESTS_REST];

export const LAB_TEST_BY_ID: Record<string, LabTest> = Object.fromEntries(
  LAB_TESTS.map((t) => [t.id, t]),
);

export function labTestById(id: string): LabTest | undefined {
  return LAB_TEST_BY_ID[id];
}

export function labTestsForPanel(panel: LabPanelId): LabTest[] {
  return LAB_TESTS.filter((t) => t.panel === panel);
}

/** Search across bn/en names, short names and keywords. */
export function searchLabTests(query: string): LabTest[] {
  const q = query.trim().toLowerCase();
  if (!q) return LAB_TESTS;
  return LAB_TESTS.filter((t) => {
    const hay = [
      t.nameBn, t.nameEn, t.shortName, t.id,
      ...t.keywordsBn, ...t.keywordsEn,
    ].join(' ').toLowerCase();
    return hay.includes(q);
  });
}

// ---------------------------------------------------------------------------
// Symptom -> test finder (data-driven; never a diagnosis).
// ---------------------------------------------------------------------------
export interface SymptomEntry {
  id: string;
  labelBn: string;
  labelEn: string;
  testIds: string[];
  noteBn: string;
  noteEn: string;
}

export const SYMPTOM_FINDER: SymptomEntry[] = [
  {
    id: 'frequent-urination', labelBn: 'ঘন ঘন প্রস্রাব', labelEn: 'Frequent urination',
    testIds: ['fbs', 'rbs', 'hba1c', 'urine-sugar'],
    noteBn: 'ঘন ঘন প্রস্রাব ডায়াবেটিসের লক্ষণ হতে পারে — তবে একাই রোগ বলে না।',
    noteEn: 'Frequent urination may be a diabetes symptom — but alone it says nothing certain.',
  },
  {
    id: 'fatigue', labelBn: 'ক্লান্তি / দুর্বলতা', labelEn: 'Tiredness / weakness',
    testIds: ['hemoglobin', 'tsh', 'vitamin-d', 'vitamin-b12', 'ferritin'],
    noteBn: 'ক্লান্তির অনেক কারণ হতে পারে — রক্তশূন্যতা, থাইরয়েড বা ভিটামিনের ঘাটতি তার কয়েকটি।',
    noteEn: 'Tiredness has many causes — anaemia, thyroid or vitamin deficiency are a few.',
  },
  {
    id: 'fever', labelBn: 'জ্বর', labelEn: 'Fever',
    testIds: ['wbc', 'crp', 'esr', 'dengue-ns1', 'platelets'],
    noteBn: 'জ্বরের কারণ বোঝাতে এই পরীক্ষাগুলো সাধারণত করা হয়।',
    noteEn: 'These tests are commonly done to understand the cause of a fever.',
  },
  {
    id: 'weight-loss', labelBn: 'ওজন কমা', labelEn: 'Weight loss',
    testIds: ['fbs', 'hba1c', 'tsh', 'free-t4'],
    noteBn: 'অকারণে ওজন কমলে ডায়াবেটিস বা থাইরয়েডের পরীক্ষা সাধারণত করা হয়।',
    noteEn: 'Unexplained weight loss is commonly checked with diabetes or thyroid tests.',
  },
  {
    id: 'palpitations', labelBn: 'বুক ধড়ফড়', labelEn: 'Palpitations',
    testIds: ['tsh', 'free-t4', 'potassium', 'hemoglobin'],
    noteBn: 'বুক ধড়ফড় করলে থাইরয়েড, পটাশিয়াম ও রক্তশূন্যতা দেখা হয়।',
    noteEn: 'Palpitations are commonly checked with thyroid, potassium and anaemia tests.',
  },
  {
    id: 'swelling', labelBn: 'শরীর / পা ফোলা', labelEn: 'Swelling of body / legs',
    testIds: ['creatinine', 'urea', 'egfr', 'albumin', 'urine-protein'],
    noteBn: 'ফোলা ভাব কিডনির সমস্যার লক্ষণ হতে পারে।',
    noteEn: 'Swelling may be a sign of kidney trouble.',
  },
  {
    id: 'yellow-eyes', labelBn: 'চোখ / গা হলুদ', labelEn: 'Yellow eyes / skin',
    testIds: ['bilirubin-total', 'sgpt-alt', 'sgot-ast', 'hbsag'],
    noteBn: 'চোখ বা গা হলুদ হলে লিভারের পরীক্ষা সাধারণত করা হয়।',
    noteEn: 'Yellow eyes or skin is commonly checked with liver tests.',
  },
  {
    id: 'thirst', labelBn: 'ঘন ঘন পিপাসা', labelEn: 'Frequent thirst',
    testIds: ['fbs', 'rbs', 'hba1c'],
    noteBn: 'ঘন ঘন পিপাসা ডায়াবেটিসের লক্ষণ হতে পারে।',
    noteEn: 'Frequent thirst may be a diabetes symptom.',
  },
  {
    id: 'bone-pain', labelBn: 'হাড়ে ব্যথা', labelEn: 'Bone pain',
    testIds: ['vitamin-d', 'calcium', 'albumin'],
    noteBn: 'হাড়ে ব্যথা ভিটামিন ডি বা ক্যালসিয়ামের ঘাটতির দিকে ইঙ্গিত করতে পারে।',
    noteEn: 'Bone pain may point to vitamin D or calcium deficiency.',
  },
  {
    id: 'hair-loss', labelBn: 'চুল পড়া', labelEn: 'Hair loss',
    testIds: ['tsh', 'hemoglobin', 'ferritin', 'vitamin-d'],
    noteBn: 'চুল পড়ার অনেক কারণ হতে পারে — থাইরয়েড, আয়রন বা ভিটামিনের ঘাটতি তার কয়েকটি।',
    noteEn: 'Hair loss has many causes — thyroid, iron or vitamin deficiency are a few.',
  },
];

export function testsForSymptom(symptomId: string): LabTest[] {
  const entry = SYMPTOM_FINDER.find((s) => s.id === symptomId);
  if (!entry) return [];
  return entry.testIds
    .map((id) => LAB_TEST_BY_ID[id])
    .filter((t): t is LabTest => Boolean(t));
}

// ---------------------------------------------------------------------------
// Unit conversion (pure). Factors from the brief + standard references:
// glucose mg/dL <-> mmol/L (divide by 18); cholesterol mg/dL <->
// mmol/L (divide by 38.67); creatinine mg/dL <-> µmol/L (multiply by
// 88.4); bilirubin mg/dL <-> µmol/L (multiply by 17.1).
// ---------------------------------------------------------------------------
export type ConvertibleKind = 'glucose' | 'cholesterol' | 'creatinine' | 'bilirubin';

export const UNIT_CONVERSIONS: Record<ConvertibleKind, { from: string; to: string; factor: number }[]> = {
  glucose: [
    { from: 'mg/dL', to: 'mmol/L', factor: 1 / 18 },
    { from: 'mmol/L', to: 'mg/dL', factor: 18 },
  ],
  cholesterol: [
    { from: 'mg/dL', to: 'mmol/L', factor: 1 / 38.67 },
    { from: 'mmol/L', to: 'mg/dL', factor: 38.67 },
  ],
  creatinine: [
    { from: 'mg/dL', to: 'µmol/L', factor: 88.4 },
    { from: 'µmol/L', to: 'mg/dL', factor: 1 / 88.4 },
  ],
  bilirubin: [
    { from: 'mg/dL', to: 'µmol/L', factor: 17.1 },
    { from: 'µmol/L', to: 'mg/dL', factor: 1 / 17.1 },
  ],
};

/** Which conversion family a test belongs to (undefined = no conversion). */
export function conversionKindFor(test: LabTest): ConvertibleKind | undefined {
  if (['fbs', 'rbs', 'ogtt'].includes(test.id)) return 'glucose';
  if (['total-cholesterol', 'ldl', 'hdl', 'triglycerides'].includes(test.id)) return 'cholesterol';
  if (test.id === 'creatinine') return 'creatinine';
  if (test.id === 'bilirubin-total') return 'bilirubin';
  return undefined;
}

/** Convert a value between two units of one family; null when unknown. */
export function convertUnit(
  value: number,
  kind: ConvertibleKind,
  fromUnit: string,
  toUnit: string,
): number | null {
  if (fromUnit === toUnit) return value;
  const rule = UNIT_CONVERSIONS[kind].find((r) => r.from === fromUnit && r.to === toUnit);
  if (!rule) return null;
  return value * rule.factor;
}

// ---------------------------------------------------------------------------
// Interpreter (pure).
// ---------------------------------------------------------------------------
export interface InterpretInput {
  testId: string;
  /** Numeric value (ignored for categorical tests — use categoryValue). */
  value?: number;
  /** Unit the value was entered in (defaults to the test's primary unit). */
  unit?: string;
  /** Categorical value exactly as on the report, e.g. '1+', 'Positive'. */
  categoryValue?: string;
  age?: number;
  sex?: Sex;
}

export interface InterpretResult {
  found: boolean;
  test?: LabTest;
  band: ResultBand;
  labelBn: string;
  labelEn: string;
  meaningBn: string;
  meaningEn: string;
  actionsBn: string;
  actionsEn: string;
  redFlag: boolean;
  /** Value converted into the test's primary unit (numeric tests). */
  valueInPrimaryUnit?: number;
  primaryUnit?: string;
}

const NOT_FOUND: InterpretResult = {
  found: false,
  band: 'normal',
  labelBn: 'পরীক্ষা পাওয়া যায়নি',
  labelEn: 'Test not found',
  meaningBn: 'এই নামের কোনো পরীক্ষা এই টুলে নেই। তালিকা থেকে একটি পরীক্ষা বেছে নিন।',
  meaningEn: 'There is no test with this name in this tool. Pick a test from the list.',
  actionsBn: 'তালিকা থেকে একটি পরীক্ষা বেছে নিন।',
  actionsEn: 'Pick a test from the list.',
  redFlag: false,
};

function bandsForTest(test: LabTest, age?: number, sex?: Sex): LabBand[] {
  if (test.bandsFor) return test.bandsFor(age, sex);
  return test.bands ?? [];
}

export function interpretTest(input: InterpretInput): InterpretResult {
  const test = labTestById(input.testId);
  if (!test) return NOT_FOUND;

  if (test.kind === 'categorical') {
    const wanted = (input.categoryValue ?? '').trim().toLowerCase();
    const match = (test.categories ?? []).find(
      (c) => c.value.toLowerCase() === wanted,
    );
    if (!match) {
      return {
        found: true,
        test,
        band: 'normal',
        labelBn: 'মান বেছে নিন',
        labelEn: 'Pick a value',
        meaningBn: 'রিপোর্টে যেমন লেখা আছে, তেমন একটি মান বেছে নিন।',
        meaningEn: 'Pick a value exactly as written on the report.',
        actionsBn: 'রিপোর্টের মানটি বেছে নিন।',
        actionsEn: 'Pick the value from the report.',
        redFlag: false,
      };
    }
    return {
      found: true,
      test,
      band: match.band,
      labelBn: match.labelBn,
      labelEn: match.labelEn,
      meaningBn: match.meaningBn,
      meaningEn: match.meaningEn,
      actionsBn: match.actionsBn,
      actionsEn: match.actionsEn,
      redFlag: Boolean(match.redFlag),
    };
  }

  const value = input.value;
  if (value === undefined || !Number.isFinite(value)) {
    return {
      found: true,
      test,
      band: 'normal',
      labelBn: 'মান দিন',
      labelEn: 'Enter a value',
      meaningBn: 'পরীক্ষার মানটি সংখ্যায় দিন।',
      meaningEn: 'Enter the test value as a number.',
      actionsBn: 'মানটি সংখ্যায় দিন।',
      actionsEn: 'Enter the value as a number.',
      redFlag: false,
    };
  }

  const primaryUnit = test.unit ?? '';
  const enteredUnit = input.unit ?? primaryUnit;
  let valueInPrimary = value;
  if (enteredUnit !== primaryUnit) {
    const kind = conversionKindFor(test);
    const converted = kind ? convertUnit(value, kind, enteredUnit, primaryUnit) : null;
    if (converted === null) {
      return {
        found: true,
        test,
        band: 'normal',
        labelBn: 'একক মেলেনি',
        labelEn: 'Unit not recognised',
        meaningBn: `এই পরীক্ষার জন্য "${enteredUnit}" এককটি চেনা যায়নি। ${primaryUnit} এককে মান দিন।`,
        meaningEn: `The unit "${enteredUnit}" is not recognised for this test. Enter the value in ${primaryUnit}.`,
        actionsBn: 'সঠিক একক বেছে নিন।',
        actionsEn: 'Pick the correct unit.',
        redFlag: false,
      };
    }
    valueInPrimary = converted;
  }

  const bands = bandsForTest(test, input.age, input.sex);
  const match = bands.find(
    (b) =>
      (b.min === undefined || valueInPrimary >= b.min) &&
      (b.max === undefined || valueInPrimary < b.max),
  );
  if (!match) return { ...NOT_FOUND, found: true, test };
  return {
    found: true,
    test,
    band: match.band,
    labelBn: match.labelBn,
    labelEn: match.labelEn,
    meaningBn: match.meaningBn,
    meaningEn: match.meaningEn,
    actionsBn: match.actionsBn,
    actionsEn: match.actionsEn,
    redFlag: Boolean(match.redFlag),
    valueInPrimaryUnit: valueInPrimary,
    primaryUnit,
  };
}

// ---------------------------------------------------------------------------
// History (localStorage only — the component owns persistence; these
// helpers are pure so they can be unit-tested).
// ---------------------------------------------------------------------------
export const LAB_HISTORY_KEY = 'eduvelto-lab-history-v1';

export interface LabHistoryEntry {
  id: string;
  testId: string;
  value: number;
  unit: string;
  band: ResultBand;
  date: string;
}

export function labHistoryToCsv(entries: LabHistoryEntry[]): string {
  const header = 'date,test,value,unit,band';
  const lines = entries.map((e) => {
    const test = LAB_TEST_BY_ID[e.testId];
    const name = test ? test.nameEn.replace(/,/g, ' ') : e.testId;
    return `${e.date},${name},${e.value},${e.unit},${e.band}`;
  });
  return [header, ...lines].join('\n');
}

/** Simple trend for one test: values sorted by date, oldest first. */
export function labTrendFor(entries: LabHistoryEntry[], testId: string): LabHistoryEntry[] {
  return entries
    .filter((e) => e.testId === testId)
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date));
}
