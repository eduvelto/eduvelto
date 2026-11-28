// Eduvelto — Certificate Policy (24 Nov 2026, brand-SEO wave 1, F-08).
//
// A real page (route /certificate-policy, linked from the footer,
// /about and /terms). The plain statement: Eduvelto issues NO
// certificates of any kind — now or in future, unless this policy is
// updated. Practice test scores are for self-assessment only and
// carry no recognised weight. Fully bilingual (24 Nov 2026 language
// system): headings + bodies in Bangla and English.
// Last updated 24 November 2026. Contact: ahmmizan23@gmail.com.

import { PageShell } from '../components/PageShell';
import { Card } from '../components/ui';
import { useLanguage } from '../i18n/LanguageContext';

function Section({
  bn,
  en,
  children,
  childrenEn,
}: {
  bn: string;
  en: string;
  children: React.ReactNode;
  childrenEn?: React.ReactNode;
}) {
  const { lang } = useLanguage();
  return (
    <Card style={{ marginBottom: 14 }}>
      <h2 style={{ fontSize: 18, color: 'var(--heading)', margin: '0 0 10px' }}>{lang === 'bn' ? bn : en}</h2>
      <div style={{ fontSize: 15, lineHeight: 1.75, color: 'var(--ink)' }}>
        {lang === 'bn' ? children : (childrenEn ?? children)}
      </div>
    </Card>
  );
}

export default function CertificatePolicyPage() {
  const { t } = useLanguage();
  return (
    <PageShell titleBn="সার্টিফিকেট নীতি" titleEn="Certificate Policy — Eduvelto" wide>
      <p style={{ color: 'var(--muted-ivory)', margin: '0 0 20px', lineHeight: 1.7 }}>
        {t({ bn: 'সর্বশেষ হালনাগাদ: ২৪ নভেম্বর ২০২৬।', en: 'Last updated: 24 November 2026.' })}
      </p>

      <Section
        bn="Eduvelto কোনো সার্টিফিকেট দেয় না"
        en="Eduvelto issues no certificates"
        childrenEn={
          <p style={{ margin: 0 }}>
            <strong>
              Eduvelto issues no certificate, diploma, testimonial or any other kind of recognised
              qualification (credential) — not now, and not on completing any course or exam. The
              only certificates on Eduvelto are free practice-quiz certificates: a self-contained
              record of a practice score, whose details live only in its own verify link — they
              carry no recognised value with any employer, institution or authority.
            </strong>
          </p>
        }
      >
        <p style={{ margin: 0 }}>
          <strong>
            Eduvelto কোনো সার্টিফিকেট, ডিপ্লোমা, সনদ বা অন্য কোনো ধরনের স্বীকৃত যোগ্যতা (credential) দেয় না — এখনো নয়, কোনো কোর্স বা পরীক্ষা শেষেও নয়। Eduvelto-তে একমাত্র সার্টিফিকেট হলো ফ্রি অনুশীলন-কুইজের সার্টিফিকেট: অনুশীলন নম্বরের একটি স্বয়ংসম্পূর্ণ রেকর্ড, যার তথ্য শুধু এর যাচাই লিংকেই থাকে — চাকরিদাতা, শিক্ষা প্রতিষ্ঠান বা কোনো কর্তৃপক্ষের কাছে এর কোনো স্বীকৃত মূল্য নেই।
          </strong>
        </p>
      </Section>

      <Section
        bn="অনুশীলন পরীক্ষার নম্বর কী"
        en="What practice test scores mean"
        childrenEn={
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>Practice test scores, results and progress information are only for your own assessment — to understand how much you have learned, which topics you are weak in, and what the next step is.</li>
            <li>These scores and progress records carry no recognised value with employers, educational institutions or any authority.</li>
            <li>A practice test result is not an official exam result.</li>
          </ul>
        }
      >
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          <li>অনুশীলন পরীক্ষার নম্বর, ফলাফল ও অগ্রগতির তথ্য শুধু আপনার নিজের মূল্যায়নের জন্য — আপনি কতটা শিখলেন, কোন বিষয়ে দুর্বল, পরের ধাপ কী — তা বোঝার জন্য।</li>
          <li>এই নম্বর বা অগ্রগতির তথ্যের চাকরিদাতা, শিক্ষা প্রতিষ্ঠান বা কোনো কর্তৃপক্ষের কাছে কোনো স্বীকৃত মূল্য নেই।</li>
          <li>অনুশীলন পরীক্ষার ফলাফল কোনো অফিসিয়াল পরীক্ষার ফলাফল নয়।</li>
        </ul>
      </Section>

      <Section
        bn="ভবিষ্যতে কি সার্টিফিকেট দেওয়া হবে?"
        en="Will certificates be issued in future?"
        childrenEn={
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>No recognised certificate will be issued in future unless this policy is updated. If this policy changes, it will be announced on this page with a new date. The free practice-quiz certificate (28 November 2026) is not a recognised qualification — it is a self-contained practice record only.</li>
            <li>If anyone claims to issue certificates in Eduvelto’s name, that is not from Eduvelto — if you receive such a claim, report it to the email on the contact page (ahmmizan23@gmail.com).</li>
          </ul>
        }
      >
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          <li>ভবিষ্যতে স্বীকৃত সার্টিফিকেট দেওয়া হবে না, যতক্ষণ না এই নীতি হালনাগাদ করা হয়। এই নীতি বদলালে এই পাতায় নতুন তারিখসহ জানানো হবে। ফ্রি অনুশীলন-কুইজের সার্টিফিকেট (২৮ নভেম্বর ২০২৬) কোনো স্বীকৃত যোগ্যতা নয় — এটি শুধু অনুশীলনের স্বয়ংসম্পূর্ণ রেকর্ড।</li>
          <li>কেউ যদি Eduvelto-র নামে সার্টিফিকেট দেওয়ার কথা বলে, তা Eduvelto-র পক্ষ থেকে নয় — এমন দাবি পেলে যোগাযোগ পাতার ইমেইলে (ahmmizan23@gmail.com) জানান।</li>
        </ul>
      </Section>
    </PageShell>
  );
}
