// Eduvelto — "Support Eduvelto" page (Phase 3, 25 Nov 2026,
// feature/ssg-bilingual-support).
//
// The site is 100% FREE — this page explains that and invites
// VOLUNTARY support. Donors send money via bKash / Nagad to the
// owner's number; the TrxID form + Supporters Wall arrive with
// Commit 2 (donations collection + rules). No donor phone number
// is ever asked for or shown. Rocket and Bank Transfer are coming
// soon — no numbers are invented for them (see lib/donations.ts).
//
// SSR-safe: the wall + form fetch Firestore in effects only, so
// the prerendered page is the static shell + methods.

import { Link } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { Card } from '../components/ui';
import { useLanguage } from '../i18n/LanguageContext';
import DonationMethods from '../components/DonationMethods';

export default function SupportPage() {
  const { t } = useLanguage();
  return (
    <PageShell titleBn="Eduvelto-কে সহায়তা করুন" titleEn="Support Eduvelto">
      <p style={{ lineHeight: 1.8 }}>
        {t({
          bn: 'Eduvelto সম্পূর্ণ বিনামূল্যে — পড়া, পরীক্ষা, লাইব্রেরি — সবকিছুই ফ্রি, আজও এবং ভবিষ্যতেও। সহায়তা সম্পূর্ণ স্বেচ্ছামূলক: আপনি না দিলেও সবকিছু আগের মতোই ফ্রি থাকবে।',
          en: 'Eduvelto is completely free — lessons, exams, the library — everything is free, today and in the future. Support is entirely voluntary: everything stays free whether you give or not.',
        })}
      </p>
      <p style={{ lineHeight: 1.8 }}>
        {t({
          bn: 'আপনার সহায়তা যায় সাইট চালু রাখতে — হোস্টিং ও সার্ভার খরচ, নতুন বই ও প্রশ্ন তৈরি, এবং শিক্ষক-যাচাইয়ের কাজে। ছোট সহায়তাও বড় কাজে লাগে।',
          en: 'Your support goes to keeping the site running — hosting and server costs, creating new books and questions, and teacher verification work. Even a small contribution helps a lot.',
        })}
      </p>

      <h2 style={{ fontSize: 20, margin: '28px 0 10px' }}>
        {t({ bn: 'কীভাবে সহায়তা করবেন', en: 'How to support' })}
      </h2>
      <ol style={{ lineHeight: 1.9, paddingLeft: 20 }}>
        <li>
          {t({
            bn: 'নিচের বিকাশ বা নগদ নম্বরে আপনার সুবিধামতো টাকা পাঠান (Send Money)।',
            en: 'Send any amount you like (Send Money) to the bKash or Nagad number below.',
          })}
        </li>
        <li>
          {t({
            bn: 'পেমেন্টের TrxID (লেনদেন আইডি) সংরক্ষণ করুন — বিকাশ/নগদ অ্যাপে পাবেন।',
            en: 'Keep the payment TrxID (transaction ID) — you will find it in the bKash/Nagad app.',
          })}
        </li>
      </ol>

      <h2 style={{ fontSize: 20, margin: '28px 0 10px' }}>
        {t({ bn: 'পেমেন্ট মাধ্যম', en: 'Payment methods' })}
      </h2>
      <DonationMethods />

      <Card style={{ marginTop: 28 }}>
        <p style={{ margin: 0, lineHeight: 1.7 }}>
          {t({
            bn: 'সহায়তা করতে না পারলেও সমস্যা নেই — বন্ধুদের সঙ্গে Eduvelto শেয়ার করলেও অনেক সাহায্য হয়। কোনো প্রশ্ন থাকলে যোগাযোগ পৃষ্ঠায় লিখুন।',
            en: 'If you cannot support financially, no problem — sharing Eduvelto with friends helps a lot too. For any question, write on the contact page.',
          })}
        </p>
        <p style={{ margin: '10px 0 0' }}>
          <Link to="/contact" style={{ fontWeight: 600 }}>
            {t({ bn: 'যোগাযোগ →', en: 'Contact →' })}
          </Link>
        </p>
      </Card>
    </PageShell>
  );
}
