import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { PageShell } from '../components/PageShell';
import { Breadcrumb } from '../components/Breadcrumb';

// Eduvelto Life services directory (§3C) — /life/services.
//
// Links ONLY to official portals and to Eduvelto's own life tools.
// No phone numbers or addresses are listed here — official sites carry
// the current contact details, and any number copied here would go stale
// or, worse, be wrong.

interface ServiceLink {
  nameBn: string;
  nameEn: string;
  descBn: string;
  descEn: string;
  /** External official portal, or an internal Eduvelto route. */
  href: string;
  internal?: boolean;
}

interface ServiceCategory {
  titleBn: string;
  titleEn: string;
  icon: string;
  links: ServiceLink[];
}

const CATEGORIES: ServiceCategory[] = [
  {
    titleBn: 'সরকারি সেবা',
    titleEn: 'Government Services',
    icon: '🏛',
    links: [
      { nameBn: 'মাইগভ — এক ঠিকানায় সরকারি সেবা', nameEn: 'MyGov — government services in one place', descBn: 'বিভিন্ন সরকারি সেবার আবেদন ও তথ্য', descEn: 'Applications and information for government services', href: 'https://www.mygov.bd' },
      { nameBn: 'বাংলাদেশ জাতীয় তথ্য বাতায়ন', nameEn: 'Bangladesh National Portal', descBn: 'সরকারি অফিস ও সেবার তথ্য', descEn: 'Government office and service information', href: 'https://bangladesh.gov.bd' },
      { nameBn: 'জাতীয় পরিচয়পত্র সেবা', nameEn: 'National ID (NID) Services', descBn: 'এনআইডি সংশোধন, হারানো কার্ড ও তথ্য', descEn: 'NID correction, lost card and information', href: 'https://services.nidw.gov.bd' },
      { nameBn: 'পাসপোর্ট সেবা', nameEn: 'Passport Services', descBn: 'ই-পাসপোর্ট আবেদন ও স্ট্যাটাস', descEn: 'E-passport application and status', href: 'https://www.epassport.gov.bd/landing' },
      { nameBn: 'বিআরটিএ', nameEn: 'BRTA', descBn: 'ড্রাইভিং লাইসেন্স ও যানবাহন নিবন্ধন', descEn: 'Driving licence and vehicle registration', href: 'https://brta.gov.bd' },
      { nameBn: 'ভূমি সেবা', nameEn: 'Land Services', descBn: 'খতিয়ান, নামজারি ও ভূমি উন্নয়ন কর', descEn: 'Khatian, mutation and land development tax', href: 'https://land.gov.bd' },
      { nameBn: 'সরকারি সেবা — Eduvelto নির্দেশিকা', nameEn: 'Government services — Eduvelto guide', descBn: 'Eduvelto-র সরকারি সেবা পাতা', descEn: "Eduvelto's government services page", href: '/life/government', internal: true },
    ],
  },
  {
    titleBn: 'স্বাস্থ্য',
    titleEn: 'Health',
    icon: '✚',
    links: [
      { nameBn: 'স্বাস্থ্য অধিদপ্তর', nameEn: 'Directorate General of Health Services', descBn: 'সরকারি স্বাস্থ্যসেবার তথ্য', descEn: 'Government health service information', href: 'https://dghs.gov.bd' },
      { nameBn: 'স্বাস্থ্য — Eduvelto', nameEn: 'Health — Eduvelto', descBn: 'ঔষধ, রোগ ও হাসপাতালের তথ্য', descEn: 'Medicine, disease and hospital information', href: '/life/health', internal: true },
    ],
  },
  {
    titleBn: 'শিক্ষা',
    titleEn: 'Education',
    icon: '📚',
    links: [
      { nameBn: 'শিক্ষা মন্ত্রণালয়', nameEn: 'Ministry of Education', descBn: 'শিক্ষা সংক্রান্ত সরকারি তথ্য', descEn: 'Government education information', href: 'https://moedu.gov.bd' },
      { nameBn: 'মাধ্যমিক ও উচ্চ শিক্ষা অধিদপ্তর', nameEn: 'Directorate of Secondary and Higher Education', descBn: 'মাধ্যমিক ও উচ্চশিক্ষার তথ্য', descEn: 'Secondary and higher education information', href: 'https://dshe.gov.bd' },
      { nameBn: 'জাতীয় বিশ্ববিদ্যালয়', nameEn: 'National University', descBn: 'পরীক্ষার রুটিন, ফলাফল ও নোটিশ', descEn: 'Exam routines, results and notices', href: 'https://www.nu.ac.bd' },
      { nameBn: 'শিক্ষা বোর্ড ফলাফল', nameEn: 'Education Board Results', descBn: 'এসএসসি/এইচএসসি পরীক্ষার ফলাফল', descEn: 'SSC/HSC exam results', href: 'https://www.educationboardresults.gov.bd' },
    ],
  },
  {
    titleBn: 'চাকরি',
    titleEn: 'Jobs',
    icon: '💼',
    links: [
      { nameBn: 'বাংলাদেশ সরকারি কর্ম কমিশন', nameEn: 'Bangladesh Public Service Commission', descBn: 'বিসিএস ও সরকারি নিয়োগের বিজ্ঞপ্তি', descEn: 'BCS and government recruitment notices', href: 'https://bpsc.gov.bd' },
      { nameBn: 'চাকরি প্রস্তুতি — Eduvelto', nameEn: 'Job Preparation — Eduvelto', descBn: 'চাকরির পরীক্ষার প্রস্তুতি ও মক টেস্ট', descEn: 'Job exam preparation and mock tests', href: '/jobs', internal: true },
    ],
  },
  {
    titleBn: 'অর্থ',
    titleEn: 'Finance',
    icon: '৳',
    links: [
      { nameBn: 'বাংলাদেশ ব্যাংক', nameEn: 'Bangladesh Bank', descBn: 'মুদ্রানীতি, বিনিময় হার ও ব্যাংকিং তথ্য', descEn: 'Monetary policy, exchange rates and banking information', href: 'https://www.bb.org.bd' },
      { nameBn: 'জাতীয় রাজস্ব বোর্ড', nameEn: 'National Board of Revenue', descBn: 'আয়কর ও ভ্যাট সংক্রান্ত তথ্য', descEn: 'Income tax and VAT information', href: 'https://nbr.gov.bd' },
      { nameBn: 'বাজেট পরিকল্পনা — Eduvelto', nameEn: 'Budget Planner — Eduvelto', descBn: 'মাসিক আয়-ব্যয়ের হিসাব রাখুন', descEn: 'Track your monthly income and expenses', href: '/life/budget', internal: true },
    ],
  },
  {
    titleBn: 'ভ্রমণ',
    titleEn: 'Travel',
    icon: '✈',
    links: [
      { nameBn: 'বাংলাদেশ রেলওয়ে ই-টিকিট', nameEn: 'Bangladesh Railway E-Ticket', descBn: 'ট্রেনের টিকিট অনলাইনে', descEn: 'Train tickets online', href: 'https://eticket.railway.gov.bd' },
      { nameBn: 'বিমান বাংলাদেশ এয়ারলাইন্স', nameEn: 'Biman Bangladesh Airlines', descBn: 'ফ্লাইটের তথ্য ও টিকিট', descEn: 'Flight information and tickets', href: 'https://www.biman-airlines.com' },
      { nameBn: 'ভ্রমণ পরিকল্পনা — Eduvelto', nameEn: 'Travel Planning — Eduvelto', descBn: 'ভ্রমণের পরিকল্পনা ও তথ্য', descEn: 'Travel planning and information', href: '/life/travel', internal: true },
    ],
  },
  {
    titleBn: 'দৈনন্দিন',
    titleEn: 'Everyday',
    icon: '🗓',
    links: [
      { nameBn: 'বাজেট পরিকল্পনা', nameEn: 'Budget Planner', descBn: 'মাসিক আয়-ব্যয়ের হিসাব', descEn: 'Monthly income and expenses', href: '/life/budget', internal: true },
      { nameBn: 'ক্যালকুলেটর', nameEn: 'Calculators', descBn: 'দৈনন্দিন হিসাবের ক্যালকুলেটর', descEn: 'Everyday calculators', href: '/life/calculators', internal: true },
      { nameBn: 'কনভার্টার', nameEn: 'Converters', descBn: 'একক ও মুদ্রা রূপান্তর', descEn: 'Unit and currency conversion', href: '/life/converters', internal: true },
      { nameBn: 'দৈনন্দিন পরিকল্পনা', nameEn: 'Daily Planner', descBn: 'দিনের কাজ ও সময়ের পরিকল্পনা', descEn: 'Plan your day and tasks', href: '/life/planner', internal: true },
      { nameBn: 'পিডিএফ টুলস', nameEn: 'PDF Tools', descBn: 'পিডিএফ নিয়ে দরকারি কাজ', descEn: 'Handy PDF tools', href: '/life/pdf-tools', internal: true },
    ],
  },
];

export default function LifeServicesPage() {
  const { t, lang } = useLanguage();

  return (
    <PageShell titleBn="সেবা নির্দেশিকা" titleEn="Services Directory" wide>
      {/* Visible breadcrumb (24 Nov 2026 SEO pass) — labels match the BreadcrumbList JSON-LD in lib/seo.ts. */}
      <Breadcrumb items={[{ label: lang === 'bn' ? 'জীবন সেবা' : 'Life Services', to: '/life' }, { label: lang === 'bn' ? 'সেবা নির্দেশিকা' : 'Services Guide' }]} />
      <p>
        {t({
          bn: 'দৈনন্দিন জীবনে দরকারি সেবাগুলোর অফিসিয়াল লিংক এক জায়গায়। কোনো ফোন নম্বর বা ঠিকানা এখানে দেওয়া হয়নি — সঠিক ও হালনাগাদ যোগাযোগের তথ্য অফিসিয়াল সাইটেই পাবেন।',
          en: 'Official links for everyday services, in one place. No phone numbers or addresses are listed here — you will find the correct, up-to-date contact details on the official sites themselves.',
        })}
      </p>
      {CATEGORIES.map((cat) => (
        <section key={cat.titleEn} style={{ marginTop: 28 }}>
          <h2 style={{ fontSize: 18, margin: '0 0 12px' }}>
            <span aria-hidden="true" style={{ marginRight: 8 }}>{cat.icon}</span>
            {t({ bn: cat.titleBn, en: cat.titleEn })}
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: 12,
            }}
          >
            {cat.links.map((link) =>
              link.internal ? (
                <Link
                  key={link.href + link.nameEn}
                  to={link.href}
                  className="ev-card ev-card-hover"
                  style={{ display: 'block', textDecoration: 'none', color: 'var(--heading)', minHeight: 44 }}
                >
                  <strong style={{ display: 'block', fontSize: 15 }}>{t({ bn: link.nameBn, en: link.nameEn })}</strong>
                  <span style={{ display: 'block', color: 'var(--muted)', fontSize: 14, marginTop: 6 }}>
                    {t({ bn: link.descBn, en: link.descEn })}
                  </span>
                </Link>
              ) : (
                <a
                  key={link.href + link.nameEn}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ev-card ev-card-hover"
                  style={{ display: 'block', textDecoration: 'none', color: 'var(--heading)', minHeight: 44 }}
                >
                  <strong style={{ display: 'block', fontSize: 15 }}>{t({ bn: link.nameBn, en: link.nameEn })}</strong>
                  <span style={{ display: 'block', color: 'var(--muted)', fontSize: 14, marginTop: 6 }}>
                    {t({ bn: link.descBn, en: link.descEn })}
                  </span>
                  <span style={{ display: 'block', color: 'var(--link)', fontSize: 13, marginTop: 6 }}>
                    {link.href.replace(/^https:\/\//, '')} ↗
                  </span>
                </a>
              ),
            )}
          </div>
        </section>
      ))}
      <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 28 }}>
        {t({
          bn: 'সতর্কতা: কোনো সেবার জন্য টাকা চাওয়া হলে বা সন্দেহজনক লিংক পেলে অফিসিয়াল সাইটে যাচাই না করে এগোবেন না।',
          en: 'Caution: if anyone asks for money for a service or sends a suspicious link, do not proceed without verifying on the official site.',
        })}
      </p>
    </PageShell>
  );
}
