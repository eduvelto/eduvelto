import { useLanguage } from '../i18n/LanguageContext';
import { PageShell } from '../components/PageShell';
import { Breadcrumb } from '../components/Breadcrumb';
import { lifeSource } from '../lib/lifeContent';

// Everyday Life Services (§3C) — Government services + required documents.
// Guides only: what each document is, who needs it, steps to apply,
// documents needed, official portal link. Fees and processing times are
// NOT stated — they change, so every card says to verify them on the
// official site. Eduvelto is NOT a government office and takes no
// applications and no payments.

const FEE_NOTE_BN =
  'ফি ও সময় অফিসিয়াল সাইটে যাচাই করুন — এই পাতায় কোনো ফি বা সময়সীমা দেওয়া হয়নি, কারণ তা পরিবর্তন হতে পারে।';
const FEE_NOTE_EN =
  'Verify the fee and processing time on the official site — no fee or time limit is stated here, because they can change.';

interface GovDoc {
  id: string;
  portalId: string;
  titleBn: string;
  titleEn: string;
  whatBn: string;
  whatEn: string;
  whoBn: string;
  whoEn: string;
  stepsBn: string[];
  stepsEn: string[];
  docsBn: string[];
  docsEn: string[];
  extraBn?: string;
  extraEn?: string;
}

const DOCS: GovDoc[] = [
  {
    id: 'nid',
    portalId: 'nid',
    titleBn: 'জাতীয় পরিচয়পত্র (NID)',
    titleEn: 'National Identity Card (NID)',
    whatBn: 'বাংলাদেশের নাগরিকদের পরিচয়ের প্রধান সরকারি কার্ড। ব্যাংক হিসাব, সিম, পাসপোর্ট, ভোটসহ বহু সরকারি সেবায় এটি লাগে। পরিচালনা করে নির্বাচন কমিশন।',
    whatEn: 'The main government identity card for citizens of Bangladesh. It is needed for bank accounts, SIMs, passports, voting and many government services. It is managed by the Election Commission.',
    whoBn: '১৮ বছর বা তার বেশি বয়সী বাংলাদেশের সব নাগরিকের জন্য।',
    whoEn: 'For every Bangladeshi citizen aged 18 years or older.',
    stepsBn: [
      'অফিসিয়াল পোর্টালে (services.nidw.gov.bd) গিয়ে নতুন NID-এর আবেদন ফরম পূরণ করুন।',
      'চাওয়া কাগজপত্র আপলোড করুন ও আবেদন জমা দিন; আবেদন নম্বর সংরক্ষণ করুন।',
      'নির্দেশনা অনুযায়ী বায়োমেট্রিক (আঙুলের ছাপ, চোখের স্ক্যান, ছবি ও স্বাক্ষর) দিতে নির্ধারিত অফিসে যান।',
      'যাচাই শেষে NID সংগ্রহ করুন; স্মার্ট কার্ডের স্ট্যাটাস পোর্টালেই দেখা যায়।',
    ],
    stepsEn: [
      'Go to the official portal (services.nidw.gov.bd) and fill in the new NID application form.',
      'Upload the requested documents and submit; keep your application number.',
      'Visit the assigned office for biometrics (fingerprints, iris scan, photo and signature) as instructed.',
      'Collect the NID after verification; Smart Card status can be checked on the portal.',
    ],
    docsBn: [
      'জন্ম নিবন্ধন সনদ',
      'ঠিকানার প্রমাণ (পোর্টালে যা চাওয়া হয়)',
      'পোর্টালের নির্দেশনা অনুযায়ী অন্যান্য কাগজপত্র',
    ],
    docsEn: [
      'Birth registration certificate',
      'Proof of address (as requested on the portal)',
      'Other documents as instructed on the portal',
    ],
    extraBn: 'NID-সংক্রান্ত সহায়তার জন্য অফিসিয়াল হেল্পলাইন ১০৫। তথ্য সংশোধন ও হারানো কার্ডের আবেদনও একই পোর্টালে করা যায়।',
    extraEn: 'The official NID helpline is 105. Corrections and lost-card applications are also made on the same portal.',
  },
  {
    id: 'passport',
    portalId: 'epassport',
    titleBn: 'পাসপোর্ট (ই-পাসপোর্ট)',
    titleEn: 'Passport (e-Passport)',
    whatBn: 'বিদেশ ভ্রমণের জন্য বাংলাদেশের নাগরিকদের পরিচয় ও ভ্রমণ দলিল। বর্তমানে ই-পাসপোর্ট দেওয়া হয়। পরিচালনা করে ইমিগ্রেশন ও পাসপোর্ট অধিদপ্তর (DIP)।',
    whatEn: 'The identity and travel document for Bangladeshi citizens travelling abroad. E-passports are issued now. It is managed by the Department of Immigration and Passports (DIP).',
    whoBn: 'বিদেশে ভ্রমণ করতে চান এমন বাংলাদেশের নাগরিকদের জন্য।',
    whoEn: 'For Bangladeshi citizens who want to travel abroad.',
    stepsBn: [
      'অফিসিয়াল ই-পাসপোর্ট পোর্টালে (epassport.gov.bd) গিয়ে অনলাইন আবেদন ফরম পূরণ করুন।',
      'পোর্টালের নির্দেশনা অনুযায়ী ফি পরিশোধ করুন।',
      'অ্যাপয়েন্টমেন্টের দিনে নিজ জেলার পাসপোর্ট অফিসে গিয়ে বায়োমেট্রিক (আঙুলের ছাপ, চোখের স্ক্যান ও স্বাক্ষর) দিন।',
      'আবেদন নম্বর দিয়ে পোর্টালে স্ট্যাটাস দেখুন; তৈরি হলে ডেলিভারি স্লিপ নিয়ে পাসপোর্ট সংগ্রহ করুন।',
    ],
    stepsEn: [
      'Go to the official e-passport portal (epassport.gov.bd) and fill in the online application form.',
      'Pay the fee as instructed on the portal.',
      'On your appointment date, visit the passport office of your district for biometrics (fingerprints, iris scan and signature).',
      'Track the status on the portal with your application number; collect the passport with the delivery slip when ready.',
    ],
    docsBn: [
      'প্রাপ্তবয়স্কদের জন্য জাতীয় পরিচয়পত্র (NID)',
      '১৮ বছরের কম বয়সীদের জন্য অনলাইন জন্ম নিবন্ধন (ইংরেজি সংস্করণ)',
      'পোর্টালে চাওয়া অন্যান্য কাগজপত্র (মূল কপি সঙ্গে নিন)',
    ],
    docsEn: [
      'National Identity Card (NID) for adults',
      'Online birth registration (English version) for applicants under 18',
      'Other documents requested on the portal (bring the originals)',
    ],
    extraBn: 'ই-পাসপোর্টের আবেদনে কোনো ছবি সংযুক্ত করতে হয় না এবং কাগজ সত্যায়িত করতে হয় না — ছবি অফিসেই তোলা হয়। সর্বশেষ নিয়ম পোর্টালে যাচাই করুন।',
    extraEn: 'No photo needs to be attached and no document needs attestation for an e-passport — the photo is taken at the office. Verify the latest rules on the portal.',
  },
  {
    id: 'birth',
    portalId: 'bdris',
    titleBn: 'জন্ম নিবন্ধন (জন্ম সনদ)',
    titleEn: 'Birth Registration (Birth Certificate)',
    whatBn: 'নাগরিকের জন্মের প্রথম সরকারি স্বীকৃতি। NID, পাসপোর্ট, স্কুলে ভর্তি ও পরীক্ষার নিবন্ধনসহ বহু সেবায় এটি লাগে। জন্ম ও মৃত্যু নিবন্ধন আইন, ২০০৪ অনুযায়ী নিবন্ধন বাধ্যতামূলক।',
    whatEn: 'The first official recognition of a citizen’s birth. It is needed for NID, passports, school admission, exam registration and many services. Registration is compulsory under the Births and Deaths Registration Act, 2004.',
    whoBn: 'বাংলাদেশে জন্ম নেওয়া প্রত্যেক শিশুর জন্য — অভিভাবক আবেদন করেন।',
    whoEn: 'For every child born in Bangladesh — a parent or guardian applies.',
    stepsBn: [
      'অফিসিয়াল BDRIS পোর্টালে (bdris.gov.bd) গিয়ে নতুন আবেদনের ফরম পূরণ করুন।',
      'আবেদন জমা দিয়ে আবেদন নম্বর সংরক্ষণ করুন; ফরমটি প্রিন্ট করুন।',
      'প্রিন্ট করা ফরম ও মূল কাগজপত্র নিয়ে সংশ্লিষ্ট নিবন্ধন অফিসে (ইউনিয়ন পরিষদ / পৌরসভা / সিটি করপোরেশন) জমা দিন।',
      'আবেদন নম্বর দিয়ে পোর্টালে স্ট্যাটাস দেখুন; সনদ সংগ্রহ করুন।',
    ],
    stepsEn: [
      'Go to the official BDRIS portal (bdris.gov.bd) and fill in the new application form.',
      'Submit the application, keep the application number, and print the form.',
      'Submit the printed form with the original documents at the registration office (Union Parishad / Municipality / City Corporation).',
      'Check the status on the portal with the application number; collect the certificate.',
    ],
    docsBn: [
      'শিশুর জন্ম সংক্রান্ত কাগজ (যেমন হাসপাতালের ছাড়পত্র বা টিকা কার্ড) — বয়স অনুযায়ী ভিন্ন হতে পারে',
      'বাবা-মায়ের পরিচয় সংক্রান্ত কাগজ (যেমন জন্ম নিবন্ধন / NID)',
      'সঠিক তালিকা আবেদনের সময় পোর্টালে দেখে নিন',
    ],
    docsEn: [
      'Papers about the child’s birth (such as a hospital discharge paper or vaccination card) — this varies by age',
      'Parents’ identity papers (such as birth registration / NID)',
      'Check the exact list on the portal when applying',
    ],
    extraBn: 'সনদ যাচাই করতে everify.bdris.gov.bd-তে জন্ম নিবন্ধন নম্বর ও জন্মতারিখ দিন।',
    extraEn: 'To verify a certificate, enter the birth registration number and date of birth at everify.bdris.gov.bd.',
  },
  {
    id: 'driving',
    portalId: 'brta-bsp',
    titleBn: 'ড্রাইভিং লাইসেন্স',
    titleEn: 'Driving Licence',
    whatBn: 'মোটরযান চালানোর আইনি অনুমতিপত্র। পরিচালনা করে বাংলাদেশ সড়ক পরিবহন কর্তৃপক্ষ (BRTA)। লাইসেন্স ছাড়া গাড়ি চালানো বেআইনি।',
    whatEn: 'The legal permit to drive a motor vehicle. It is managed by the Bangladesh Road Transport Authority (BRTA). Driving without a licence is illegal.',
    whoBn: 'অপেশাদার লাইসেন্সের জন্য ন্যূনতম বয়স ১৮ বছর। পেশাদার লাইসেন্সের বয়সসীমা ও অন্যান্য শর্ত অফিসিয়াল সাইটে যাচাই করুন।',
    whoEn: 'Minimum age is 18 years for a non-professional licence. Check the age limit and other conditions for a professional licence on the official site.',
    stepsBn: [
      'BRTA সার্ভিস পোর্টালে (bsp.brta.gov.bd) অ্যাকাউন্ট খুলে লার্নার (শিক্ষানবিশ) লাইসেন্সের আবেদন করুন — এটিই প্রথম ধাপ।',
      'পোর্টালের নির্দেশনা অনুযায়ী ফি পরিশোধ করুন।',
      'লিখিত, মৌখিক ও ফিল্ড (ব্যবহারিক) পরীক্ষায় অংশ নিন।',
      'পরীক্ষায় উত্তীর্ণ হলে স্মার্ট কার্ড লাইসেন্সের জন্য আবেদন করুন; বায়োমেট্রিক দিয়ে কার্ড সংগ্রহ করুন।',
    ],
    stepsEn: [
      'Create an account on the BRTA Service Portal (bsp.brta.gov.bd) and apply for a learner licence — this is the first step.',
      'Pay the fee as instructed on the portal.',
      'Take the written, oral and field (practical) tests.',
      'After passing, apply for the smart card licence; give biometrics and collect the card.',
    ],
    docsBn: [
      'জাতীয় পরিচয়পত্র (NID)',
      'রেজিস্টার্ড ডাক্তারের মেডিকেল সার্টিফিকেট',
      'শিক্ষাগত যোগ্যতার সনদ (ন্যূনতম ৮ম শ্রেণি পাস)',
      'পাসপোর্ট সাইজ ছবি; বর্তমান ঠিকানা NID-এর ঠিকানা থেকে ভিন্ন হলে ইউটিলিটি বিল',
    ],
    docsEn: [
      'National Identity Card (NID)',
      'Medical certificate from a registered doctor',
      'Educational certificate (minimum Class 8 pass)',
      'Passport-size photo; a utility bill if the present address differs from the NID address',
    ],
    extraBn: 'BRTA হেল্পলাইন ১৬১০৭। আবেদন ও পেমেন্ট শুধু অফিসিয়াল পোর্টালেই করুন — দালালের মাধ্যমে নয়।',
    extraEn: 'BRTA helpline 16107. Apply and pay only on the official portal — never through a broker.',
  },
];

export default function LifeGovernmentPage() {
  const { t, lang } = useLanguage();

  return (
    <PageShell titleBn="সরকারি সেবা ও প্রয়োজনীয় কাগজপত্র" titleEn="Government Services & Required Documents">
      {/* Visible breadcrumb (24 Nov 2026 SEO pass) — labels match the BreadcrumbList JSON-LD in lib/seo.ts. */}
      <Breadcrumb items={[{ label: lang === 'bn' ? 'জীবন সেবা' : 'Life Services', to: '/life' }, { label: lang === 'bn' ? 'সরকারি সেবা' : 'Government Services' }]} />
      <p>
        {t({
          bn: 'NID, পাসপোর্ট, জন্ম নিবন্ধন ও ড্রাইভিং লাইসেন্সের আবেদন কীভাবে করবেন — তার সহজ নির্দেশিকা। সব তথ্য অফিসিয়াল পোর্টালের আলোকে দেওয়া; আবেদনের আগে সর্বশেষ নিয়ম অফিসিয়াল সাইটেই যাচাই করুন।',
          en: 'A simple guide to applying for an NID, passport, birth registration or driving licence. Everything is based on the official portals; verify the latest rules on the official site before applying.',
        })}
      </p>
      <div
        role="note"
        style={{
          border: '1px solid var(--error)',
          borderRadius: 8,
          padding: '14px 16px',
          background: 'var(--error-bg)',
          marginTop: 16,
        }}
      >
        <p style={{ margin: 0, fontWeight: 700, color: 'var(--error)' }}>
          {t({
            bn: 'গুরুত্বপূর্ণ: Eduvelto কোনো সরকারি অফিস নয়।',
            en: 'Important: Eduvelto is not a government office.',
          })}
        </p>
        <p style={{ margin: '8px 0 0' }}>
          {t({
            bn: 'এই পাতা শুধু তথ্য দেয় — এখানে আবেদন করা যায় না, টাকা নেওয়া হয় না। আবেদন, ফি ও কাগজপত্র জমা দিতে হবে শুধু অফিসিয়াল সরকারি পোর্টালে বা সংশ্লিষ্ট অফিসে। ব্যক্তিগত তথ্য (NID নম্বর, পাসওয়ার্ড, OTP) কাউকে দেবেন না।',
            en: 'This page only gives information — you cannot apply here and no money is taken here. Apply, pay and submit documents only on the official government portal or at the relevant office. Never share personal information (NID number, password, OTP) with anyone.',
          })}
        </p>
      </div>

      {DOCS.map((doc) => {
        const portal = lifeSource(doc.portalId);
        return (
          <section
            key={doc.id}
            className="ev-card"
            style={{ marginTop: 16 }}
          >
            <h2 style={{ marginTop: 0 }}>{t({ bn: doc.titleBn, en: doc.titleEn })}</h2>
            <p>{t({ bn: doc.whatBn, en: doc.whatEn })}</p>
            <p>
              <strong>{t({ bn: 'কার জন্য: ', en: 'Who needs it: ' })}</strong>
              {t({ bn: doc.whoBn, en: doc.whoEn })}
            </p>
            <h3>{t({ bn: 'আবেদনের ধাপ', en: 'Steps to apply' })}</h3>
            <ol>
              {doc.stepsBn.map((_, i) => (
                <li key={i} style={{ marginBottom: 6 }}>
                  {t({ bn: doc.stepsBn[i], en: doc.stepsEn[i] })}
                </li>
              ))}
            </ol>
            <h3>{t({ bn: 'যা যা লাগবে', en: 'Documents needed' })}</h3>
            <ul>
              {doc.docsBn.map((_, i) => (
                <li key={i} style={{ marginBottom: 6 }}>
                  {t({ bn: doc.docsBn[i], en: doc.docsEn[i] })}
                </li>
              ))}
            </ul>
            {doc.extraBn && (
              <p style={{ color: 'var(--muted)', fontSize: 14 }}>
                {t({ bn: doc.extraBn, en: doc.extraEn ?? '' })}
              </p>
            )}
            <p style={{ color: 'var(--muted)', fontSize: 14 }}>
              {t({ bn: FEE_NOTE_BN, en: FEE_NOTE_EN })}
            </p>
            {portal && (
              <p style={{ marginBottom: 0 }}>
                <strong>{t({ bn: 'অফিসিয়াল পোর্টাল: ', en: 'Official portal: ' })}</strong>
                <a href={portal.url} target="_blank" rel="noreferrer">
                  {portal.url.replace(/^https?:\/\//, '')}
                </a>
              </p>
            )}
            {doc.id === 'birth' && (
              <p style={{ marginBottom: 0 }}>
                <strong>{t({ bn: 'সনদ যাচাই: ', en: 'Verify a certificate: ' })}</strong>
                <a href="https://everify.bdris.gov.bd/" target="_blank" rel="noreferrer">
                  everify.bdris.gov.bd
                </a>
              </p>
            )}
          </section>
        );
      })}

      <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 24 }}>
        {t({
          bn: 'সরকারি নিয়ম ও ফি পরিবর্তন হতে পারে। এই পাতার কোনো তথ্য অফিসিয়াল সাইটের সঙ্গে না মিললে অফিসিয়াল সাইটের তথ্যই সঠিক ধরুন।',
          en: 'Government rules and fees can change. If anything on this page differs from the official site, the official site is correct.',
        })}
      </p>
    </PageShell>
  );
}
