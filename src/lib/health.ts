// Eduvelto Health — data model + Firestore access (Phase 2, Health v1).
//
// SAFETY (Blueprint v4, binding):
// - Health content is educational information only, never medical advice.
// - No diagnosis, no prescribing, no invented dosages. Medicine records
//   carry NO dosage amounts at all in v1 — only the dosage FORM
//   (tablet / syrup / injection) and "as prescribed by a qualified doctor".
// - Every fact carries a `source` (WHO, DGHS Bangladesh, or another
//   authoritative public source). Anything unverified is marked UNVERIFIED
//   in the data itself.
// - All health content is Draft / Under Review until a qualified
//   professional reviews it. Students see ONLY reviewStatus == 'Published'
//   (enforced in firestore.rules AND in these queries).
// - The report explainer is client-side only: values the user enters are
//   NEVER written to Firestore (no personal health data stored).
// - The AI Doctor is NOT built in v1 (needs safety evaluation + legal /
//   professional review first). The report explainer below is a static
//   reference table, not AI.

import { collection, getDocs, limit, query, where, type QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export type ReviewStatus = 'Not Started' | 'In Progress' | 'Under Review' | 'Published';

export interface Medicine {
  id: string;
  title: string; // generic name (used as the display name)
  titleBn: string;
  useBn: string;
  useEn: string;
  formBn: string; // dosage FORM only (e.g. ট্যাবলেট), never a dose amount
  formEn: string;
  sideEffectsBn: string;
  sideEffectsEn: string;
  warningsBn: string;
  warningsEn: string;
  prescriptionOnly: boolean;
  source: string;
  reviewStatus: ReviewStatus;
}

export interface Disease {
  id: string;
  title: string;
  titleBn: string;
  symptomsBn: string;
  symptomsEn: string;
  preventionBn: string;
  preventionEn: string;
  seeDoctorBn: string;
  seeDoctorEn: string;
  source: string;
  reviewStatus: ReviewStatus;
}

export interface Doctor {
  id: string;
  title: string; // doctor's full name
  titleBn: string;
  qualificationBn: string;
  qualificationEn: string;
  specialityBn: string;
  specialityEn: string;
  workplaceBn: string;
  workplaceEn: string;
  verificationStatus: 'pending' | 'verified' | 'rejected' | 'revoked';
  // Verification is a human check (admin-only — see firestore.rules):
  // a doctor is listed as verified only with proof (checks.identity +
  // checks.qualification + checks.adult, a reason, and the verifier must
  // not be the doctor themself).
  userId?: string;
  verifiedBy?: string;
  verifiedAt?: unknown;
  reason?: string;
  checks?: { identity?: boolean; qualification?: boolean; adult?: boolean };
  reviewStatus: ReviewStatus;
  source?: string;
}

export interface Facility {
  id: string;
  title: string;
  titleBn: string;
  kind: 'hospital' | 'clinic' | 'pharmacy';
  areaBn: string;
  areaEn: string;
  addressBn: string;
  addressEn: string;
  phone?: string;
  source: string;
  reviewStatus: ReviewStatus;
}

function toMedicine(snap: QueryDocumentSnapshot): Medicine {
  const d = snap.data();
  return {
    id: snap.id,
    title: String(d.title ?? ''),
    titleBn: String(d.titleBn ?? d.title ?? ''),
    useBn: String(d.useBn ?? ''),
    useEn: String(d.useEn ?? ''),
    formBn: String(d.formBn ?? ''),
    formEn: String(d.formEn ?? ''),
    sideEffectsBn: String(d.sideEffectsBn ?? ''),
    sideEffectsEn: String(d.sideEffectsEn ?? ''),
    warningsBn: String(d.warningsBn ?? ''),
    warningsEn: String(d.warningsEn ?? ''),
    prescriptionOnly: d.prescriptionOnly === true,
    source: String(d.source ?? ''),
    reviewStatus: (d.reviewStatus as ReviewStatus) ?? 'Under Review',
  };
}

function toDisease(snap: QueryDocumentSnapshot): Disease {
  const d = snap.data();
  return {
    id: snap.id,
    title: String(d.title ?? ''),
    titleBn: String(d.titleBn ?? d.title ?? ''),
    symptomsBn: String(d.symptomsBn ?? ''),
    symptomsEn: String(d.symptomsEn ?? ''),
    preventionBn: String(d.preventionBn ?? ''),
    preventionEn: String(d.preventionEn ?? ''),
    seeDoctorBn: String(d.seeDoctorBn ?? ''),
    seeDoctorEn: String(d.seeDoctorEn ?? ''),
    source: String(d.source ?? ''),
    reviewStatus: (d.reviewStatus as ReviewStatus) ?? 'Under Review',
  };
}

function toDoctor(snap: QueryDocumentSnapshot): Doctor {
  const d = snap.data();
  return {
    id: snap.id,
    title: String(d.title ?? ''),
    titleBn: String(d.titleBn ?? d.title ?? ''),
    qualificationBn: String(d.qualificationBn ?? ''),
    qualificationEn: String(d.qualificationEn ?? ''),
    specialityBn: String(d.specialityBn ?? ''),
    specialityEn: String(d.specialityEn ?? ''),
    workplaceBn: String(d.workplaceBn ?? ''),
    workplaceEn: String(d.workplaceEn ?? ''),
    verificationStatus: (d.verificationStatus as Doctor['verificationStatus']) ?? 'pending',
    verifiedBy: typeof d.verifiedBy === 'string' ? d.verifiedBy : undefined,
    reviewStatus: (d.reviewStatus as ReviewStatus) ?? 'Under Review',
  };
}

function toFacility(snap: QueryDocumentSnapshot): Facility {
  const d = snap.data();
  return {
    id: snap.id,
    title: String(d.title ?? ''),
    titleBn: String(d.titleBn ?? d.title ?? ''),
    kind: (d.kind as Facility['kind']) ?? 'hospital',
    areaBn: String(d.areaBn ?? ''),
    areaEn: String(d.areaEn ?? ''),
    addressBn: String(d.addressBn ?? ''),
    addressEn: String(d.addressEn ?? ''),
    phone: typeof d.phone === 'string' ? d.phone : undefined,
    source: String(d.source ?? ''),
    reviewStatus: (d.reviewStatus as ReviewStatus) ?? 'Under Review',
  };
}

// One-time reads, Published only, client-side sort — no composite index
// needed (single where() clause), so no firestore.indexes.json change.
async function listPublished<T>(
  collectionName: string,
  map: (snap: QueryDocumentSnapshot) => T,
): Promise<T[]> {
  if (!db) return [];
  const q = query(
    collection(db, collectionName),
    where('reviewStatus', '==', 'Published'),
    limit(100),
  );
  const snap = await getDocs(q);
  return snap.docs.map(map);
}

export function listPublishedMedicines(): Promise<Medicine[]> {
  return listPublished('medicines', toMedicine);
}

export function listPublishedDiseases(): Promise<Disease[]> {
  return listPublished('diseases', toDisease);
}

// Doctors: verified AND Published only. A doctor with no proof is never
// listed — verificationStatus 'verified' requires the human checklist in
// firestore.rules (identity + qualification + adult + reason).
export async function listVerifiedDoctors(): Promise<Doctor[]> {
  if (!db) return [];
  const q = query(
    collection(db, 'doctors'),
    where('reviewStatus', '==', 'Published'),
    where('verificationStatus', '==', 'verified'),
    limit(100),
  );
  const snap = await getDocs(q);
  return snap.docs.map(toDoctor);
}

export function listPublishedFacilities(): Promise<Facility[]> {
  return listPublished('facilities', toFacility);
}

// ---------- Report explainer (client-side reference table, NOT AI) ----------
// General adult reference ranges from widely published laboratory
// references. Ranges vary by lab, age and sex — the user's own report's
// reference range is what matters. This table explains what a test
// measures and what a high/low value MAY mean in general terms; it never
// diagnoses. Values are entered and explained on-device only.

export interface ReportTest {
  id: string;
  nameBn: string;
  nameEn: string;
  unit: string;
  measuresBn: string;
  measuresEn: string;
  generalRange: string;
  lowBn: string;
  lowEn: string;
  highBn: string;
  highEn: string;
  // Numeric bounds for a rough "inside / outside general range" hint.
  // null = no numeric comparison for this test (explained in words only).
  lowBound: number | null;
  highBound: number | null;
}

export const REPORT_TESTS: ReportTest[] = [
  {
    id: 'fasting-glucose',
    nameBn: 'ফাস্টিং ব্লাড সুগার (খালি পেটে)',
    nameEn: 'Fasting blood sugar',
    unit: 'mg/dL',
    measuresBn: 'খালি পেটে রক্তে গ্লুকোজের (চিনির) পরিমাণ মাপে। ডায়াবেটিস আছে কিনা বোঝার একটি পরীক্ষা।',
    measuresEn: 'Measures glucose (sugar) in the blood after fasting. One test used when checking for diabetes.',
    generalRange: '৭০–৯৯ mg/dL (সাধারণত)',
    lowBn: 'সাধারণ রেঞ্জের নিচে হলে রক্তে চিনি কম (হাইপোগ্লাইসেমিয়া) হতে পারে — মাথা ঘোরা, ঘাম, কাঁপুনি হতে পারে।',
    lowEn: 'Below the general range may mean low blood sugar — dizziness, sweating or shaking can occur.',
    highBn: 'সাধারণ রেঞ্জের উপরে হলে ডায়াবেটিস বা প্রি-ডায়াবেটিসের দিকে ইঙ্গিত করতে পারে — ডাক্তারের পরামর্শ নিন।',
    highEn: 'Above the general range may point towards pre-diabetes or diabetes — consult a doctor.',
    lowBound: 70,
    highBound: 99,
  },
  {
    id: 'hba1c',
    nameBn: 'HbA1c (তিন মাসের গড় সুগার)',
    nameEn: 'HbA1c (3-month average sugar)',
    unit: '%',
    measuresBn: 'গত ২–৩ মাসে রক্তে চিনির গড় মাত্রা মাপে।',
    measuresEn: 'Measures the average blood sugar level over the past 2–3 months.',
    generalRange: '৪.০–৫.৬% (সাধারণত); ৫.৭–৬.৪% প্রি-ডায়াবেটিস হিসেবে ধরা হয়',
    lowBn: 'খুব কম মান সাধারণত সমস্যা নয়, তবে রক্তস্বল্পতা থাকলে ফলাফল ভিন্ন হতে পারে।',
    lowEn: 'A very low value is usually not a problem, but anaemia can affect the result.',
    highBn: 'বেশি মান মানে গত কয়েক মাসে গড় চিনি বেশি ছিল — ডায়াবেটিস নিয়ন্ত্রণ নিয়ে ডাক্তারের সঙ্গে কথা বলুন।',
    highEn: 'A higher value means average sugar was high over recent months — discuss diabetes control with your doctor.',
    lowBound: 4.0,
    highBound: 5.6,
  },
  {
    id: 'haemoglobin',
    nameBn: 'হিমোগ্লোবিন (Hb)',
    nameEn: 'Haemoglobin (Hb)',
    unit: 'g/dL',
    measuresBn: 'রক্তে হিমোগ্লোবিনের পরিমাণ মাপে — এটি শরীরে অক্সিজেন বহন করে।',
    measuresEn: 'Measures haemoglobin in the blood — it carries oxygen around the body.',
    generalRange: 'পুরুষ: ১৩.৫–১৭.৫ g/dL; নারী: ১২.০–১৫.৫ g/dL (সাধারণত)',
    lowBn: 'কম হলে রক্তস্বল্পতা (অ্যানিমিয়া) হতে পারে — দুর্বলতা, ক্লান্তি, মাথা ঘোরা হতে পারে।',
    lowEn: 'Low values may mean anaemia — weakness, tiredness or dizziness can occur.',
    highBn: 'বেশি হলে শরীরে পানিশূন্যতা বা অন্য কারণ থাকতে পারে — ডাক্তারকে দেখান।',
    highEn: 'High values may be linked to dehydration or other causes — show your doctor.',
    lowBound: 12.0,
    highBound: 17.5,
  },
  {
    id: 'wbc',
    nameBn: 'WBC (শ্বেত রক্তকণিকা)',
    nameEn: 'WBC (white blood cells)',
    unit: '/µL',
    measuresBn: 'রক্তে শ্বেত রক্তকণিকার সংখ্যা মাপে — এগুলো সংক্রমণের বিরুদ্ধে লড়ে।',
    measuresEn: 'Counts white blood cells — they fight infection.',
    generalRange: '৪,০০০–১১,০০০ /µL (সাধারণত)',
    lowBn: 'কম হলে সংক্রমণের বিরুদ্ধে লড়ার ক্ষমতা কম থাকতে পারে।',
    lowEn: 'Low values may mean a reduced ability to fight infection.',
    highBn: 'বেশি হলে শরীরে সংক্রমণ বা প্রদাহ থাকতে পারে।',
    highEn: 'High values may mean infection or inflammation in the body.',
    lowBound: 4000,
    highBound: 11000,
  },
  {
    id: 'platelets',
    nameBn: 'প্লেটলেট (অণুচক্রিকা)',
    nameEn: 'Platelets',
    unit: '/µL',
    measuresBn: 'রক্ত জমাট বাঁধতে সাহায্য করা কোষের সংখ্যা মাপে।',
    measuresEn: 'Counts the cells that help blood clot.',
    generalRange: '১,৫০,০০০–৪,৫০,০০০ /µL (সাধারণত)',
    lowBn: 'খুব কম হলে রক্তপাতের ঝুঁকি বাড়তে পারে — ডেঙ্গুসহ কিছু রোগে প্লেটলেট কমে।',
    lowEn: 'Very low values can raise bleeding risk — platelets can fall in illnesses including dengue.',
    highBn: 'বেশি হলে প্রদাহ বা অন্য কারণ থাকতে পারে — ডাক্তারের পরামর্শ নিন।',
    highEn: 'High values may be linked to inflammation or other causes — consult a doctor.',
    lowBound: 150000,
    highBound: 450000,
  },
  {
    id: 'total-cholesterol',
    nameBn: 'টোটাল কোলেস্টেরল',
    nameEn: 'Total cholesterol',
    unit: 'mg/dL',
    measuresBn: 'রক্তে মোট কোলেস্টেরলের পরিমাণ মাপে।',
    measuresEn: 'Measures total cholesterol in the blood.',
    generalRange: '২০০ mg/dL-এর নিচে কাঙ্ক্ষিত (সাধারণত)',
    lowBn: 'খুব কম মান সাধারণত সমস্যা নয়।',
    lowEn: 'A very low value is usually not a problem.',
    highBn: 'বেশি হলে হৃদরোগের ঝুঁকি বাড়তে পারে — খাবার ও জীবনযাপন নিয়ে ডাক্তারের পরামর্শ নিন।',
    highEn: 'High values may raise heart-disease risk — discuss food and lifestyle with your doctor.',
    lowBound: null,
    highBound: 200,
  },
  {
    id: 'ldl',
    nameBn: 'LDL কোলেস্টেরল ("খারাপ" কোলেস্টেরল)',
    nameEn: 'LDL cholesterol ("bad" cholesterol)',
    unit: 'mg/dL',
    measuresBn: 'LDL কোলেস্টেরল মাপে — বেশি হলে ধমনিতে জমতে পারে।',
    measuresEn: 'Measures LDL cholesterol — high levels can build up in arteries.',
    generalRange: '১০০ mg/dL-এর নিচে কাঙ্ক্ষিত (সাধারণত)',
    lowBn: 'কম মান সাধারণত ভালো।',
    lowEn: 'A low value is usually good.',
    highBn: 'বেশি হলে হৃদরোগ ও স্ট্রোকের ঝুঁকি বাড়তে পারে — ডাক্তারের পরামর্শ নিন।',
    highEn: 'High values may raise the risk of heart disease and stroke — consult a doctor.',
    lowBound: null,
    highBound: 100,
  },
  {
    id: 'hdl',
    nameBn: 'HDL কোলেস্টেরল ("ভালো" কোলেস্টেরল)',
    nameEn: 'HDL cholesterol ("good" cholesterol)',
    unit: 'mg/dL',
    measuresBn: 'HDL কোলেস্টেরল মাপে — এটি ধমনি পরিষ্কার রাখতে সাহায্য করে।',
    measuresEn: 'Measures HDL cholesterol — it helps keep arteries clear.',
    generalRange: 'পুরুষ: ৪০-এর উপরে; নারী: ৫০-এর উপরে (সাধারণত)',
    lowBn: 'কম হলে হৃদরোগের ঝুঁকি বাড়তে পারে।',
    lowEn: 'Low values may raise heart-disease risk.',
    highBn: 'বেশি মান সাধারণত ভালো হিসেবে ধরা হয়।',
    highEn: 'A higher value is usually considered good.',
    lowBound: 40,
    highBound: null,
  },
  {
    id: 'triglycerides',
    nameBn: 'ট্রাইগ্লিসারাইড',
    nameEn: 'Triglycerides',
    unit: 'mg/dL',
    measuresBn: 'রক্তে ট্রাইগ্লিসারাইড (এক ধরনের চর্বি) মাপে।',
    measuresEn: 'Measures triglycerides (a type of fat) in the blood.',
    generalRange: '১৫০ mg/dL-এর নিচে কাঙ্ক্ষিত (সাধারণত)',
    lowBn: 'কম মান সাধারণত সমস্যা নয়।',
    lowEn: 'A low value is usually not a problem.',
    highBn: 'বেশি হলে হৃদরোগের ঝুঁকি বাড়তে পারে — মিষ্টি ও ভাজা খাবার কমানো নিয়ে ডাক্তারের পরামর্শ নিন।',
    highEn: 'High values may raise heart-disease risk — discuss sweets and fried food with your doctor.',
    lowBound: null,
    highBound: 150,
  },
  {
    id: 'creatinine',
    nameBn: 'ক্রিয়েটিনিন (কিডনির পরীক্ষা)',
    nameEn: 'Creatinine (kidney test)',
    unit: 'mg/dL',
    measuresBn: 'কিডনি কতটা ভালো কাজ করছে তা বোঝার একটি পরীক্ষা।',
    measuresEn: 'One test of how well the kidneys are working.',
    generalRange: 'পুরুষ: ০.৭–১.৩ mg/dL; নারী: ০.৬–১.১ mg/dL (সাধারণত)',
    lowBn: 'কম মান সাধারণত সমস্যা নয়।',
    lowEn: 'A low value is usually not a problem.',
    highBn: 'বেশি হলে কিডনির কাজ কমে যাওয়া বা পানিশূন্যতার দিকে ইঙ্গিত করতে পারে — ডাক্তারকে দেখান।',
    highEn: 'High values may point to reduced kidney function or dehydration — show your doctor.',
    lowBound: 0.6,
    highBound: 1.3,
  },
  {
    id: 'alt-sgpt',
    nameBn: 'ALT / SGPT (লিভারের পরীক্ষা)',
    nameEn: 'ALT / SGPT (liver test)',
    unit: 'U/L',
    measuresBn: 'লিভারের একটি এনজাইম মাপে — লিভারে প্রদাহ হলে বাড়তে পারে।',
    measuresEn: 'Measures a liver enzyme — it can rise when the liver is inflamed.',
    generalRange: '৭–৫৬ U/L (সাধারণত)',
    lowBn: 'কম মান সাধারণত সমস্যা নয়।',
    lowEn: 'A low value is usually not a problem.',
    highBn: 'বেশি হলে লিভারে প্রদাহ, ফ্যাটি লিভার বা অন্য কারণ থাকতে পারে — ডাক্তারের পরামর্শ নিন।',
    highEn: 'High values may mean liver inflammation, fatty liver or other causes — consult a doctor.',
    lowBound: 7,
    highBound: 56,
  },
  {
    id: 'tsh',
    nameBn: 'TSH (থাইরয়েডের পরীক্ষা)',
    nameEn: 'TSH (thyroid test)',
    unit: 'mIU/L',
    measuresBn: 'থাইরয়েড গ্রন্থি কতটা কাজ করছে তা বোঝার পরীক্ষা।',
    measuresEn: 'A test of how well the thyroid gland is working.',
    generalRange: '০.৪–৪.০ mIU/L (সাধারণত)',
    lowBn: 'কম হলে থাইরয়েড বেশি কাজ করছে (হাইপারথাইরয়েডিজম) বলে মনে হতে পারে।',
    lowEn: 'Low values may suggest an overactive thyroid.',
    highBn: 'বেশি হলে থাইরয়েড কম কাজ করছে (হাইপোথাইরয়েডিজম) বলে মনে হতে পারে।',
    highEn: 'High values may suggest an underactive thyroid.',
    lowBound: 0.4,
    highBound: 4.0,
  },
  {
    id: 'vitamin-d',
    nameBn: 'ভিটামিন ডি',
    nameEn: 'Vitamin D',
    unit: 'ng/mL',
    measuresBn: 'শরীরে ভিটামিন ডি-এর মাত্রা মাপে — হাড় ও রোগ প্রতিরোধে জরুরি।',
    measuresEn: 'Measures vitamin D — important for bones and immunity.',
    generalRange: '৩০–১০০ ng/mL পর্যাপ্ত (সাধারণত); ২০-এর নিচে ঘাটতি',
    lowBn: 'কম হলে ভিটামিন ডি-এর ঘাটতি হতে পারে — হাড় ব্যথা, দুর্বলতা হতে পারে।',
    lowEn: 'Low values may mean vitamin D deficiency — bone pain or weakness can occur.',
    highBn: 'খুব বেশি হলে সাপ্লিমেন্ট বেশি খাওয়া হয়ে থাকতে পারে — ডাক্তারকে জানান।',
    highEn: 'Very high values may mean too much supplementation — tell your doctor.',
    lowBound: 30,
    highBound: 100,
  },
  {
    id: 'blood-pressure',
    nameBn: 'ব্লাড প্রেশার (রক্তচাপ)',
    nameEn: 'Blood pressure',
    unit: 'mmHg',
    measuresBn: 'রক্তচাপ মাপে — উপরের সংখ্যা (সিস্টোলিক) ও নিচের সংখ্যা (ডায়াস্টোলিক)। এখানে শুধু উপরের সংখ্যাটি লিখুন।',
    measuresEn: 'Measures blood pressure — upper number (systolic) and lower number (diastolic). Enter only the upper number here.',
    generalRange: '১২০/৮০ mmHg-এর কাছাকাছি স্বাভাবিক (সাধারণত)',
    lowBn: 'খুব কম হলে মাথা ঘোরা বা অজ্ঞান ভাব হতে পারে।',
    lowEn: 'Very low values can cause dizziness or faintness.',
    highBn: 'বেশি হলে উচ্চ রক্তচাপ হতে পারে — নিয়মিত মাপুন ও ডাক্তারের পরামর্শ নিন। খুব বেশি (১৮০-এর উপরে) হলে জরুরি চিকিৎসা নিন।',
    highEn: 'High values may mean high blood pressure — measure regularly and consult a doctor. If very high (above 180), seek urgent care.',
    lowBound: 90,
    highBound: 120,
  },
];

// Emergency warning signs — shown on every health page (see
// HealthDisclaimer). These are standard public-health red flags.
export const EMERGENCY_SIGNS_BN = [
  'বুকে ব্যথা বা চাপ',
  'শ্বাস নিতে খুব কষ্ট',
  'হঠাৎ মুখ বেঁকে যাওয়া বা এক পাশ অবশ হওয়া',
  'অজ্ঞান হয়ে যাওয়া বা কথা জড়িয়ে যাওয়া',
  'প্রচুর রক্তপাত যা থামছে না',
  'বিষ খাওয়া বা সাপে কাটা',
];
