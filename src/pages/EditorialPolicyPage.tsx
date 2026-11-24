// Eduvelto — Editorial Policy (24 Nov 2026, brand-SEO wave 1, F-08).
//
// A real page (route /editorial-policy, linked from the footer and
// /about). How Eduvelto content is written, sourced and reviewed —
// including the "draft awaiting teacher review" practice. Fully
// bilingual (24 Nov 2026 language system): headings + bodies in
// Bangla and English. Last updated 24 November 2026.
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

export default function EditorialPolicyPage() {
  const { t } = useLanguage();
  return (
    <PageShell titleBn="সম্পাদকীয় নীতি" titleEn="Editorial Policy — Eduvelto" wide>
      <p style={{ color: 'var(--muted-ivory)', margin: '0 0 20px', lineHeight: 1.7 }}>
        {t({
          bn: 'সর্বশেষ হালনাগাদ: ২৪ নভেম্বর ২০২৬। এই নীতিতে লেখা আছে Eduvelto-র বিষয়বস্তু কীভাবে তৈরি হয়, কে তা যাচাই করে এবং ভুল পেলে কী করা হয়।',
          en: 'Last updated: 24 November 2026. This policy explains how Eduvelto’s content is created, who reviews it, and what happens when a mistake is found.',
        })}
      </p>

      <Section
        bn="১. বিষয়বস্তু কীভাবে তৈরি হয়"
        en="1. How content is created"
        childrenEn={
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>Eduvelto’s lessons, summaries and explanations are the team’s own writing — based on textbooks and reliable sources.</li>
            <li>Factual writing cites its sources — such as official circulars, textbooks or publications of the relevant authority.</li>
            <li>Nobody else’s writing, images or questions are copied word for word — plagiarised content is prohibited on Eduvelto.</li>
          </ul>
        }
      >
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          <li>Eduvelto-র পাঠ, সারাংশ ও ব্যাখ্যা দলের নিজস্ব লেখা — পাঠ্যবই ও নির্ভরযোগ্য উৎসের ভিত্তিতে তৈরি।</li>
          <li>তথ্যভিত্তিক লেখায় তথ্যের উৎস উল্লেখ করা হয় — যেমন অফিসিয়াল বিজ্ঞপ্তি (সার্কুলার), পাঠ্যবই বা সংশ্লিষ্ট কর্তৃপক্ষের প্রকাশনা।</li>
          <li>অন্যের লেখা, ছবি বা প্রশ্ন হুবহু কপি করা হয় না — চুরি করা বিষয়বস্তু (plagiarism) Eduvelto-তে নিষিদ্ধ।</li>
        </ul>
      </Section>

      <Section
        bn="২. প্রকাশের আগে যাচাই"
        en="2. Review before publishing"
        childrenEn={
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>Before any lesson or question is published, a teacher reviews it — checking whether the information is correct, the language is clear, and the question’s answer is right.</li>
            <li>No educational content is published without review.</li>
            <li>Content still under review is marked “under review” — see the content accuracy policy for details.</li>
          </ul>
        }
      >
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          <li>কোনো পাঠ বা প্রশ্ন প্রকাশের আগে তা শিক্ষক যাচাই (teacher review) করে দেখেন — তথ্য সঠিক কি না, ভাষা স্পষ্ট কি না, প্রশ্নের উত্তর সঠিক কি না।</li>
          <li>যাচাই ছাড়া কোনো শিক্ষামূলক বিষয়বস্তু প্রকাশ করা হয় না।</li>
          <li>যাচাই চলমান এমন বিষয়বস্তুতে &ldquo;যাচাইাধীন&rdquo; লেখা থাকে — বিস্তারিত: বিষয়বস্তুর নির্ভুলতা নীতি।</li>
        </ul>
      </Section>

      <Section
        bn="৩. AI-এর ভূমিকা"
        en="3. The role of AI"
        childrenEn={
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>No AI-generated writing is published without human review, and AI writing is never presented as human-reviewed writing.</li>
            <li>AI may only be used as a draft or an aid — final responsibility rests with people.</li>
          </ul>
        }
      >
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          <li>AI দিয়ে তৈরি কোনো লেখা মানুষের যাচাই ছাড়া প্রকাশ করা হয় না, এবং AI-এর লেখাকে মানুষের যাচাইকৃত লেখা বলে দেখানো হয় না।</li>
          <li>AI শুধু খসড়া বা সহায়ক হিসেবে ব্যবহার হতে পারে — চূড়ান্ত দায়িত্ব মানুষের।</li>
        </ul>
      </Section>

      <Section
        bn="৪. ভুল সংশোধন"
        en="4. Correcting mistakes"
        childrenEn={
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>Anyone who finds a mistake in the content can report it to the email on the contact page (ahmmizan23@gmail.com) — write which page, what is wrong, and what the correct information is.</li>
            <li>Once a mistake is confirmed, it is corrected and the correction is noted on the page.</li>
            <li>For a major mistake, a note with the correction date is added, so readers can see what changed.</li>
          </ul>
        }
      >
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          <li>বিষয়বস্তুতে ভুল পেলে যে কেউ যোগাযোগ পাতার ইমেইলে (ahmmizan23@gmail.com) জানাতে পারেন — কোন পাতায়, কী ভুল, সঠিক তথ্য কী — তা লিখুন।</li>
          <li>ভুল নিশ্চিত হলে তা সংশোধন করা হয় এবং সংশোধনের কথা পাতায় উল্লেখ করা হয়।</li>
          <li>বড় ভুল হলে সংশোধনের তারিখসহ নোট দেওয়া হয়, যাতে পাঠক বুঝতে পারেন কী বদলেছে।</li>
        </ul>
      </Section>

      <Section
        bn="৫. স্বাধীনতা ও স্বার্থের সংঘাত"
        en="5. Independence and conflicts of interest"
        childrenEn={
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>Eduvelto’s content is not written under the influence of any advertiser, institution or exam authority.</li>
            <li>If any content is ever written in exchange for payment, it will be stated clearly — there is currently no such content.</li>
          </ul>
        }
      >
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          <li>Eduvelto-র বিষয়বস্তু কোনো বিজ্ঞাপনদাতা, প্রতিষ্ঠান বা পরীক্ষা কর্তৃপক্ষের প্রভাবে লেখা হয় না।</li>
          <li>কোনো বিষয়বস্তু অর্থের বিনিময়ে লেখা হলে তা স্পষ্টভাবে জানানো হবে — বর্তমানে এমন কোনো বিষয়বস্তু নেই।</li>
        </ul>
      </Section>
    </PageShell>
  );
}
