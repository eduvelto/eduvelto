// Eduvelto — Content Accuracy Policy (24 Nov 2026, brand-SEO wave 1, F-08).
//
// A real page (route /content-accuracy, linked from the footer and
// /about). How accurate Eduvelto's information is, what "verified"
// means, and where to check important dates and fees. Fully bilingual
// (24 Nov 2026 language system): headings + bodies in Bangla and
// English. Last updated 24 November 2026.
// Contact: ahmmizan23@gmail.com.

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

export default function ContentAccuracyPage() {
  const { t } = useLanguage();
  return (
    <PageShell titleBn="বিষয়বস্তুর নির্ভুলতা নীতি" titleEn="Content Accuracy Policy — Eduvelto" wide>
      <p style={{ color: 'var(--muted-ivory)', margin: '0 0 20px', lineHeight: 1.7 }}>
        {t({
          bn: 'সর্বশেষ হালনাগাদ: ২৪ নভেম্বর ২০২৬। Eduvelto সঠিক তথ্য দেওয়ার চেষ্টা করে। এই নীতিতে লেখা আছে আমরা নির্ভুলতা কীভাবে ধরে রাখি এবং আমাদের সীমা কোথায়।',
          en: 'Last updated: 24 November 2026. Eduvelto tries to give accurate information. This policy explains how we maintain accuracy and where our limits are.',
        })}
      </p>

      <Section
        bn="১. নির্ভুলতার মান"
        en="1. Accuracy standard"
        childrenEn={
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>Before any information is published, it is checked against an official source — an official circular, a textbook, or a publication of the relevant authority.</li>
            <li>If information cannot be verified, it is not published — or it is published marked “under review”.</li>
          </ul>
        }
      >
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          <li>কোনো তথ্য প্রকাশের আগে তা অফিসিয়াল উৎসের সঙ্গে মিলিয়ে দেখা হয় — অফিসিয়াল বিজ্ঞপ্তি, পাঠ্যবই বা সংশ্লিষ্ট কর্তৃপক্ষের প্রকাশনা।</li>
          <li>তথ্য যাচাই না হলে তা প্রকাশ করা হয় না, অথবা &ldquo;যাচাইাধীন&rdquo; লেখা দিয়ে প্রকাশ করা হয়।</li>
        </ul>
      </Section>

      <Section
        bn="২. “যাচাইকৃত” মানে কী"
        en='2. What "verified" means'
        childrenEn={
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>The word “verified” is used only when the information has actually been checked against an official source.</li>
            <li>Unverified information is never labelled “verified”.</li>
          </ul>
        }
      >
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          <li>&ldquo;যাচাইকৃত&rdquo; লেখা শুধু তখনই ব্যবহার করা হয়, যখন তথ্যটি আসলেই অফিসিয়াল উৎসের সঙ্গে মিলিয়ে যাচাই করা হয়েছে।</li>
          <li>যাচাই না করা তথ্যে &ldquo;যাচাইকৃত&rdquo; লেখা হয় না।</li>
        </ul>
      </Section>

      <Section
        bn="৩. পরীক্ষা-সংক্রান্ত তথ্য"
        en="3. Exam-related information"
        childrenEn={
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>Information about exam patterns, syllabuses or question types carries its source and date — so readers can tell when the information is from.</li>
            <li>Exam dates, fees and application deadlines can change over time — always verify them against the relevant authority’s official circular.</li>
          </ul>
        }
      >
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          <li>পরীক্ষার ধরন, সিলেবাস বা প্রশ্নের ধরন-সংক্রান্ত তথ্যে উৎস ও তারিখ উল্লেখ করা হয় — যাতে পাঠক বুঝতে পারেন তথ্যটি কবের।</li>
          <li>পরীক্ষার তারিখ, ফি ও আবেদনের শেষ তারিখ সময়ের সঙ্গে বদলাতে পারে — এগুলো সবসময় সংশ্লিষ্ট কর্তৃপক্ষের অফিসিয়াল বিজ্ঞপ্তি থেকে যাচাই করুন।</li>
        </ul>
      </Section>

      <Section
        bn="৪. পুরনো তথ্য"
        en="4. Outdated information"
        childrenEn={
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>When outdated or expired information is found, it is updated, or marked on the page as “outdated information — update in progress”.</li>
            <li>The update date is shown on the page.</li>
          </ul>
        }
      >
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          <li>পুরনো বা মেয়াদোত্তীর্ণ তথ্য পেলে তা হালনাগাদ করা হয়, অথবা পাতায় &ldquo;পুরনো তথ্য — হালনাগাদ চলছে&rdquo; বলে চিহ্নিত করা হয়।</li>
          <li>হালনাগাদের তারিখ পাতায় দেখানো হয়।</li>
        </ul>
      </Section>

      <Section
        bn="৫. ১০০% নির্ভুলতার নিশ্চয়তা নেই"
        en="5. No guarantee of 100% accuracy"
        childrenEn={
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>Despite our best efforts, mistakes can remain. Eduvelto does not guarantee 100% accuracy of its information.</li>
            <li>Before making an important decision — especially about exam dates, fees and eligibility — verify it against an official source.</li>
            <li>If you find a mistake, report it to the email on the contact page (ahmmizan23@gmail.com) — the correction process is described in the editorial policy.</li>
          </ul>
        }
      >
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          <li>সর্বোচ্চ চেষ্টা সত্ত্বেও ভুল থাকতে পারে। Eduvelto তার তথ্যের ১০০% নির্ভুলতার নিশ্চয়তা দেয় না।</li>
          <li>গুরুত্বপূর্ণ সিদ্ধান্তের আগে — বিশেষ করে পরীক্ষার তারিখ, ফি ও যোগ্যতা — অফিসিয়াল উৎস থেকে যাচাই করুন।</li>
          <li>ভুল পেলে যোগাযোগ পাতার ইমেইলে (ahmmizan23@gmail.com) জানান — সংশোধনের প্রক্রিয়া সম্পাদকীয় নীতিতে লেখা আছে।</li>
        </ul>
      </Section>
    </PageShell>
  );
}
