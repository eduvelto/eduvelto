// Eduvelto — Disclaimer (24 Nov 2026, brand-SEO wave 1, F-08).
//
// A real page (route /disclaimer, linked from the footer). Educational
// information only — not professional advice; verify official exam
// dates, fees and deadlines against official sources. Bangla content
// with bilingual headings, mirroring PrivacyPage's tone + structure
// (PageShell + Card + Section). Last updated 24 November 2026.
// Contact: ahmmizan23@gmail.com.

import { PageShell } from '../components/PageShell';
import { Card } from '../components/ui';
import { useLanguage } from '../i18n/LanguageContext';

function Section({ bn, en, children }: { bn: string; en: string; children: React.ReactNode }) {
  const { lang } = useLanguage();
  return (
    <Card style={{ marginBottom: 14 }}>
      <h2 style={{ fontSize: 18, color: 'var(--heading)', margin: '0 0 10px' }}>{lang === 'bn' ? bn : en}</h2>
      <div style={{ fontSize: 15, lineHeight: 1.75, color: 'var(--ink)' }}>{children}</div>
    </Card>
  );
}

export default function DisclaimerPage() {
  const { t } = useLanguage();
  return (
    <PageShell titleBn="দায়বর্জন" titleEn="Disclaimer — Eduvelto" wide>
      <p style={{ color: 'var(--muted-ivory)', margin: '0 0 20px', lineHeight: 1.7 }}>
        {t({ bn: 'সর্বশেষ হালনাগাদ: ২৪ নভেম্বর ২০২৬।', en: 'Last updated: 24 November 2026.' })}
      </p>

      <Section bn="১. শুধু শিক্ষামূলক তথ্য" en="1. Educational information only">
        <p style={{ margin: 0 }}>
          Eduvelto-র সব তথ্য শুধু শিক্ষা ও সাধারণ জ্ঞানের জন্য। এটি কোনো পেশাদার পরামর্শ নয় — চিকিৎসা, আইন, আর্থিক বা ক্যারিয়ার-সংক্রান্ত পরামর্শ নয়।
        </p>
      </Section>

      <Section bn="২. স্বাস্থ্য ও আর্থিক তথ্য সাধারণ তথ্য মাত্র" en="2. Health and finance content is general information only">
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          <li>স্বাস্থ্য-সংক্রান্ত পাতায় (ওষুধ, রোগ, চিকিৎসক, হাসপাতাল) দেওয়া তথ্য শুধু সাধারণ তথ্য — এটি চিকিৎসকের পরামর্শের বিকল্প নয়। কোনো ওষুধ খাওয়া বা চিকিৎসা নেওয়ার আগে চিকিৎসকের পরামর্শ নিন।</li>
          <li>আর্থিক বা ক্যারিয়ার-সংক্রান্ত কোনো তথ্য পেশাদার পরামর্শ হিসেবে নেবেন না।</li>
        </ul>
      </Section>

      <Section bn="৩. অফিসিয়াল তথ্য যাচাই করুন" en="3. Verify official information">
        <p style={{ margin: 0 }}>
          পরীক্ষার তারিখ, ফি, আবেদনের শেষ তারিখ, যোগ্যতা ও নিয়মের ক্ষেত্রে সবসময় সংশ্লিষ্ট কর্তৃপক্ষের অফিসিয়াল বিজ্ঞপ্তি (সার্কুলার) যাচাই করুন। Eduvelto-র তথ্য ভুল বা পুরনো হতে পারে — এর ওপর নির্ভর করে কোনো সিদ্ধান্ত নেওয়ার দায় আপনার নিজের।
        </p>
      </Section>

      <Section bn="৪. বাইরের লিংক" en="4. External links">
        <p style={{ margin: 0 }}>
          Eduvelto-র পাতায় বাইরের ওয়েবসাইটের লিংক থাকতে পারে। সেই সাইটের বিষয়বস্তু বা সেবার জন্য Eduvelto দায়ী নয় — বাইরের লিংক দেওয়া মানেই সেই সাইটকে সমর্থন (endorsement) করা নয়।
        </p>
      </Section>

      <Section bn="৫. সেবা “যেমন আছে” তেমনই" en='5. Service provided "as is"'>
        <p style={{ margin: 0 }}>
          Eduvelto সেবা &ldquo;যেমন আছে&rdquo; (as-is) ভিত্তিতে দেওয়া হয় — সেবা সবসময় নিরবচ্ছিন্ন বা ত্রুটিমুক্ত থাকবে, এমন নিশ্চয়তা দেওয়া হয় না। কোনো তথ্যের ভুল বা সেবার সাময়িক বন্ধের জন্য Eduvelto দায়ী থাকবে না।
        </p>
      </Section>
    </PageShell>
  );
}
