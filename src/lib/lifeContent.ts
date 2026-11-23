// Eduvelto Everyday Life Services (§3C) — shared source of truth.
//
// Every URL here was verified by web search on 23 Nov 2026. Pages import
// from here so the official portals and emergency numbers stay consistent.
// RULE: never add a URL, phone number, fee or processing time here unless
// it was verified from the official source (or, for emergency numbers,
// corroborated by at least two independent sources). If a fact cannot be
// verified, leave it out — do not guess.

export interface LifeSource {
  id: string;
  labelBn: string;
  labelEn: string;
  url: string;
  purposeBn: string;
  purposeEn: string;
}

export const LIFE_SOURCES: LifeSource[] = [
  {
    id: 'who-diet',
    labelBn: 'বিশ্ব স্বাস্থ্য সংস্থা (WHO) — স্বাস্থ্যকর খাদ্য',
    labelEn: 'World Health Organization (WHO) — Healthy diet',
    url: 'https://www.who.int/news-room/fact-sheets/detail/Healthy-diet',
    purposeBn: 'সুষম খাদ্য, ফল-সবজি, চিনি, লবণ ও চর্বি সম্পর্কে নির্দেশনা',
    purposeEn: 'Guidance on a balanced diet, fruit and vegetables, sugar, salt and fats',
  },
  {
    id: 'who-activity',
    labelBn: 'বিশ্ব স্বাস্থ্য সংস্থা (WHO) — সুস্থ জীবনযাপন',
    labelEn: 'World Health Organization (WHO) — Healthy lifestyle',
    url: 'https://www.who.int/Europe/News-Room/Fact-Sheets/Item/a-Healthy-Lifestyle---Who-Recommendations?webview_progress_bar=1&show_loading=0',
    purposeBn: 'শারীরিক সক্রিয়তা: প্রাপ্তবয়স্কদের সাপ্তাহিক ব্যায়ামের পরিমাণ',
    purposeEn: 'Physical activity: recommended weekly activity for adults',
  },
  {
    id: 'who-hand-hygiene',
    labelBn: 'বিশ্ব স্বাস্থ্য সংস্থা (WHO) — হাতের স্বাস্থ্যবিধি নির্দেশিকা',
    labelEn: 'World Health Organization (WHO) — Hand hygiene guidelines',
    url: 'https://www.who.int/news/item/15-10-2025-new-guidelines-on-community-hand-hygiene-to-help-governments-reduce-the-spread-of-infectious-diseases',
    purposeBn: 'কখন ও কীভাবে হাত ধুতে হবে — সাবান-পানি ও হ্যান্ড রাব',
    purposeEn: 'When and how to clean hands — soap and water, and hand rub',
  },
  {
    id: 'cdc-sleep',
    labelBn: 'CDC — কতটুকু ঘুম দরকার',
    labelEn: 'CDC — How much sleep do I need?',
    url: 'https://www.cdc.gov/sleep/about_sleep/how_much_sleep.html',
    purposeBn: 'প্রাপ্তবয়স্কদের জন্য ঘুমের পরিমাণ (৭ ঘণ্টা বা বেশি)',
    purposeEn: 'Recommended sleep duration for adults (7 or more hours)',
  },
  {
    id: 'dghs',
    labelBn: 'স্বাস্থ্য অধিদপ্তর (DGHS), বাংলাদেশ',
    labelEn: 'Directorate General of Health Services (DGHS), Bangladesh',
    url: 'https://www.dghs.gov.bd/',
    purposeBn: 'বাংলাদেশের সরকারি স্বাস্থ্যসেবা ও স্বাস্থ্য বাতায়ন ১৬২৬৩',
    purposeEn: 'Government health services in Bangladesh and Shasthyo Batayon 16263',
  },
  {
    id: 'emergency-999',
    labelBn: 'জাতীয় জরুরি সেবা ৯৯৯',
    labelEn: 'National Emergency Service 999',
    url: 'https://bangladesh.gov.bd',
    purposeBn: 'জরুরি অবস্থায় পুলিশ, ফায়ার সার্ভিস ও অ্যাম্বুলেন্স — এক নম্বরে (৯৯৯ একটি ফোন সেবা; বিস্তারিত জাতীয় তথ্য বাতায়নে)',
    purposeEn: 'Police, fire service and ambulance in an emergency — one number',
  },
  {
    id: 'nid',
    labelBn: 'জাতীয় পরিচয়পত্র সেবা (NID) — নির্বাচন কমিশন',
    labelEn: 'National ID (NID) services — Election Commission',
    url: 'https://services.nidw.gov.bd/',
    purposeBn: 'নতুন NID আবেদন, সংশোধন, হারানো কার্ড ও স্মার্ট NID',
    purposeEn: 'New NID application, corrections, lost cards and Smart NID',
  },
  {
    id: 'epassport',
    labelBn: 'ই-পাসপোর্ট — ইমিগ্রেশন ও পাসপোর্ট অধিদপ্তর',
    labelEn: 'E-Passport — Department of Immigration and Passports',
    url: 'https://www.epassport.gov.bd/landing',
    purposeBn: 'অনলাইনে ই-পাসপোর্ট আবেদন, ফি ও অ্যাপয়েন্টমেন্ট',
    purposeEn: 'Online e-passport application, fees and appointments',
  },
  {
    id: 'bdris',
    labelBn: 'জন্ম ও মৃত্যু নিবন্ধন (BDRIS)',
    labelEn: 'Birth and Death Registration (BDRIS)',
    url: 'https://bdris.gov.bd/',
    purposeBn: 'জন্ম নিবন্ধন আবেদন, স্ট্যাটাস যাচাই ও সংশোধন',
    purposeEn: 'Birth registration application, status check and corrections',
  },
  {
    id: 'bdris-verify',
    labelBn: 'জন্ম নিবন্ধন যাচাই (BDRIS Everify)',
    labelEn: 'Birth registration verification (BDRIS Everify)',
    url: 'https://everify.bdris.gov.bd/',
    purposeBn: 'জন্ম নিবন্ধন নম্বর দিয়ে সনদ যাচাই',
    purposeEn: 'Verify a birth registration certificate by its number',
  },
  {
    id: 'brta',
    labelBn: 'বাংলাদেশ সড়ক পরিবহন কর্তৃপক্ষ (BRTA)',
    labelEn: 'Bangladesh Road Transport Authority (BRTA)',
    url: 'https://brta.gov.bd/',
    purposeBn: 'ড্রাইভিং লাইসেন্স ও যানবাহন সংক্রান্ত সরকারি তথ্য',
    purposeEn: 'Official information on driving licences and vehicles',
  },
  {
    id: 'brta-bsp',
    labelBn: 'BRTA সার্ভিস পোর্টাল (BSP)',
    labelEn: 'BRTA Service Portal (BSP)',
    url: 'https://bsp.brta.gov.bd/',
    purposeBn: 'অনলাইনে লার্নার ও ড্রাইভিং লাইসেন্স আবেদন',
    purposeEn: 'Online learner and driving licence applications',
  },
  {
    id: 'railway',
    labelBn: 'বাংলাদেশ রেলওয়ে ই-টিকিট',
    labelEn: 'Bangladesh Railway e-ticketing',
    url: 'https://eticket.railway.gov.bd/',
    purposeBn: 'অনলাইনে ট্রেনের টিকিট — সময়সূচি ও ভাড়া এখানেই যাচাই করুন',
    purposeEn: 'Train tickets online — check timetable and fare here',
  },
  {
    id: 'biman',
    labelBn: 'বিমান বাংলাদেশ এয়ারলাইন্স',
    labelEn: 'Biman Bangladesh Airlines',
    url: 'https://www.biman-airlines.com/',
    purposeBn: 'বিমানের টিকিট বুকিং — ফ্লাইটের সময় ও ভাড়া এখানেই যাচাই করুন',
    purposeEn: 'Flight booking — check flight times and fares here',
  },
];

export function lifeSource(id: string): LifeSource | undefined {
  return LIFE_SOURCES.find((s) => s.id === id);
}

// Emergency numbers — each corroborated by at least two independent
// sources on 23 Nov 2026 (National Portal, DGHS material, Tourist
// Police pages). 999 is the number to call FIRST in any emergency;
// the others are direct lines for one service.
export interface EmergencyNumber {
  number: string;
  nameBn: string;
  nameEn: string;
  useBn: string;
  useEn: string;
}

export const EMERGENCY_NUMBERS: EmergencyNumber[] = [
  {
    number: '999',
    nameBn: 'জাতীয় জরুরি সেবা',
    nameEn: 'National Emergency Service',
    useBn: 'পুলিশ, ফায়ার সার্ভিস বা অ্যাম্বুলেন্স — যেকোনো জরুরি অবস্থায় প্রথমে এই নম্বরে কল করুন। ২৪ ঘণ্টা, কল বিনামূল্যে।',
    useEn: 'Police, fire service or ambulance — call this number first in any emergency. 24 hours, free call.',
  },
  {
    number: '102',
    nameBn: 'ফায়ার সার্ভিস ও সিভিল ডিফেন্স',
    nameEn: 'Fire Service and Civil Defence',
    useBn: 'আগুন, উদ্ধার, ভবন ধস বা আটকে পড়া — সরাসরি ফায়ার সার্ভিসের হটলাইন।',
    useEn: 'Fire, rescue, building collapse or trapped people — the fire service hotline directly.',
  },
  {
    number: '16263',
    nameBn: 'স্বাস্থ্য বাতায়ন (DGHS)',
    nameEn: 'Shasthyo Batayon (DGHS)',
    useBn: '২৪ ঘণ্টা স্বাস্থ্য পরামর্শ — ফোনে ডাক্তারের সঙ্গে কথা বলা ও স্বাস্থ্য তথ্য। জরুরি অবস্থায় ৯৯৯-এ কল করুন।',
    useEn: '24-hour health advice — talk to a doctor on the phone and get health information. In an emergency call 999.',
  },
  {
    number: '333',
    nameBn: 'জাতীয় নাগরিক সেবা হেল্পলাইন',
    nameEn: 'National Citizen Services Helpline',
    useBn: 'সরকারি সেবা ও তথ্যের জন্য — জরুরি নম্বর নয়, সাধারণ তথ্য ও অভিযোগের জন্য।',
    useEn: 'For government services and information — not an emergency number; for general information and complaints.',
  },
  {
    number: '01320-222222',
    nameBn: 'ট্যুরিস্ট পুলিশ হেল্পলাইন',
    nameEn: 'Tourist Police Helpline',
    useBn: 'ভ্রমণের সময় পর্যটকদের সহায়তা — ২৪ ঘণ্টা। বিকল্প নম্বর: ০১৮৮৭-৮৭৮৭৮৭।',
    useEn: 'Help for travellers while travelling — 24 hours. Alternative number: 01887-878787.',
  },
];
