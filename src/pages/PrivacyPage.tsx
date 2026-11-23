// Eduvelto — Privacy Policy (stage 3: class-wise homepage + mobile app).
//
// A real page (route /privacy, linked from the footer). Required BEFORE
// any AdSense submission. Bangla + English, written for a free education
// platform for Bangladesh. It states what is collected (account +
// learning progress), that student data is NEVER sold, the child-safety
// and guardian rules, and that ads are non-personalised only.
// Contact: ahmmizan23@gmail.com. Last updated 23 November 2026.
// NOTE: ads are NOT active on the site yet — the AdSense verification
// script loads (index.html), but no ad unit renders until activation is
// separately approved (Launch step 6). This policy already covers how ads
// will work when they launch, so no policy change is needed at launch.
// EXAM ADS (binding, Hybrid Ad Strategy — owner brief 23 Nov 2026
// 21:52): NO ads during exams — the 22 Nov small-banner rule is
// superseded. Ads appear only AFTER a quiz/exam ends (result page
// banner). No ads inside AI answers or student conversations, and no
// ads on login/register, profile or admin pages.

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

export default function PrivacyPage() {
  const { t } = useLanguage();
  return (
    <PageShell titleBn="গোপনীয়তা নীতি" titleEn="Privacy Policy — Eduvelto" wide>
      <p style={{ color: 'var(--muted-ivory)', margin: '0 0 20px', lineHeight: 1.7 }}>
        {t({ bn: 'সর্বশেষ হালনাগাদ: ২৩ নভেম্বর ২০২৬।', en: 'Last updated: 23 November 2026.' })} Eduvelto বাংলাদেশের        শিক্ষার্থীদের জন্য একটি সম্পূর্ণ বিনামূল্যের শিক্ষা প্ল্যাটফর্ম। এই নীতিতে বলা আছে আমরা
        কী তথ্য সংগ্রহ করি, কেন করি, আর আপনার তথ্য কীভাবে সুরক্ষিত থাকে।
      </p>

      <Section bn="১. আমরা কী তথ্য সংগ্রহ করি" en="1. What data we collect">
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          <li>
            <strong>অ্যাকাউন্টের তথ্য:</strong> নাম, ইমেইল ঠিকানা, আর রেজিস্ট্রেশনের সময় আপনি যা
            দেন — শিক্ষার ধারা, শ্রেণি/বর্ষ, বিভাগ, বোর্ড/বিশ্ববিদ্যালয়, প্রতিষ্ঠান।
          </li>
          <li>
            <strong>শেখার তথ্য:</strong> কোন পাঠ পড়েছেন, কোন পরীক্ষা দিয়েছেন, ফলাফল, বুকমার্ক,
            অগ্রগতি। এগুলো শুধু আপনার পড়াশোনা দেখানোর জন্য।
          </li>
          <li>
            <strong>কারিগরি তথ্য:</strong> ডিভাইস ও ব্রাউজারের সাধারণ তথ্য — নিরাপত্তা ও সাইটের
            গতি ঠিক রাখার জন্য। আমরা আপনার সঠিক অবস্থান (location) সংগ্রহ করি না।
          </li>
        </ul>
        <p style={{ margin: '10px 0 0' }}>
          <strong>আমরা যা সংগ্রহ করি না:</strong> জাতীয় পরিচয়পত্র (NID), মুখের ছবি বা বায়োমেট্রিক,
          কোনো নথি আপলোড, আর কোনো পেমেন্ট/কার্ডের তথ্য — Eduvelto সম্পূর্ণ বিনামূল্যে, তাই পেমেন্ট
          নেওয়াই হয় না।
        </p>
      </Section>

      <Section bn="২. তথ্য কীভাবে ব্যবহার করি" en="2. How we use your data">
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          <li>আপনার শ্রেণির সঠিক বই, বিষয়, পাঠ ও পরীক্ষা দেখানো।</li>
          <li>আপনার অগ্রগতি ও ফলাফল সংরক্ষণ ও দেখানো।</li>
          <li>অ্যাকাউন্টের নিরাপত্তা রক্ষা করা ও অপব্যবহার ঠেকানো।</li>
          <li>প্ল্যাটফর্মটি আরও ভালো করা।</li>
        </ul>
        <p style={{ margin: '10px 0 0' }}>
          আপনার তথ্য কখনো বিজ্ঞাপনের টার্গেটিংয়ের জন্য ব্যবহার করা হয় না।
        </p>
      </Section>

      <Section bn="৩. শিক্ষার্থীর তথ্য কখনো বিক্রি করা হয় না" en="3. Student data is never sold">
        <p style={{ margin: 0 }}>
          <strong>
            আমরা শিক্ষার্থীর ব্যক্তিগত তথ্য কখনো বিক্রি করি না, ভাড়া দিই না, আর মার্কেটিংয়ের
            জন্য কোনো তৃতীয় পক্ষের সঙ্গে ভাগ করি না — কখনোই না।
          </strong>{' '}
          আপনার তথ্য শুধু Eduvelto চালানোর জন্য ব্যবহার হয়। আইনগত বাধ্যবাধকতা ছাড়া আপনার তথ্য
          কারো কাছে দেওয়া হয় না।
        </p>
      </Section>

      <Section bn="৪. শিশুদের সুরক্ষা ও অভিভাবক" en="4. Child safety and guardians">
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          <li>
            ১৮ বছরের কম শিক্ষার্থীর অ্যাকাউন্টে অভিভাবকের সম্মতি ও লিংক যেখানে প্রয়োজন, সেখানে
            প্রযোজ্য।
          </li>
          <li>
            অভিভাবক শুধু নিজের সন্তানের অগ্রগতি, ফলাফল ও রুটিন দেখতে পান — অন্য কোনো পরিবারের
            সন্তানের তথ্য কখনো দেখতে পান না।
          </li>
          <li>
            শিশুর ব্যক্তিগত যোগাযোগের তথ্য (ফোন, ইমেইল) অন্য কারো কাছে দেখানো হয় না; ১৮ বছরের কম
            বয়সীদের যোগাযোগের তথ্য সবসময় &ldquo;শুধু আমি&rdquo; থাকে।
          </li>
          <li>শিশুর মুখের ছবি বা বায়োমেট্রিক তথ্য আমরা কখনো সংগ্রহ করি না।</li>
          <li>
            শিক্ষক বা অন্য কেউ শিক্ষার্থীর ব্যক্তিগত বার্তা পড়তে পারে না — ব্যতিক্রমী ক্ষেত্রে
            শুধু লিখিত প্রক্রিয়ায়, মালিকের অনুমোদনে, সীমিত সময়ের জন্য।
          </li>
        </ul>
      </Section>

      <Section bn="৫. বিজ্ঞাপন" en="5. Advertising">
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          <li>
            <strong>শুধু নন-পার্সোনালাইজড (অ-ব্যক্তিগত) বিজ্ঞাপন:</strong> শিশুদের জন্য নিরাপদ,
            পরিবার-উপযোগী বিজ্ঞাপনই শুধু দেখানো হবে। কোনো টার্গেটেড/ব্যক্তিগত বিজ্ঞাপন নয়।
          </li>
          <li>বিজ্ঞাপনের জন্য শিক্ষার্থীদের আলাদাভাবে ট্র্যাক করা হয় না।</li>
          <li>
            <strong>পরীক্ষা চলাকালীন কোনো বিজ্ঞাপন নয়:</strong> পরীক্ষা বা কুইজ চলার সময়
            কোনো বিজ্ঞাপন দেখানো হয় না — প্রশ্নের মাঝখানে কখনো নয়। পরীক্ষা শেষ হওয়ার
            পর ফলাফলের পাতায় নিচের ব্যানার বিজ্ঞাপন থাকতে পারে।
          </li>
          <li>
            <strong>কোথায় বিজ্ঞাপন থাকে:</strong> হোমপেজে উপরের ব্যানার (হিরোর নিচে) ও
            নিচের ব্যানার; লাইব্রেরি ও বইয়ের তালিকার ভেতরে ও শেষে; পাঠের মাঝখানে ও
            শেষে; নিবন্ধে উপরে, মাঝখানে ও শেষে। AI শিক্ষকের উত্তরের ভেতরে, লগইন/
            রেজিস্ট্রেশন, প্রোফাইল বা অ্যাডমিন পাতায় কোনো বিজ্ঞাপন থাকে না।
          </li>
          <li>
            <strong>প্রতিটি বিজ্ঞাপন স্পষ্টভাবে চেনা যায়:</strong> বিজ্ঞাপনের উপরে
            &ldquo;বিজ্ঞাপন&rdquo; লেখা থাকে, আর কোনো বিজ্ঞাপন ডাউনলোড/পরের ধাপের
            বোতামের মতো দেখতে হয় না। বিজ্ঞাপন না পাওয়া গেলে জায়গাটি ফাঁকা না থেকে
            সরে যায়।
          </li>
        </ul>
        <p style={{ margin: '10px 0 0' }}>
          <em>
            দ্রষ্টব্য: সাইটে এখনো বিজ্ঞাপন চালু হয়নি — Google AdSense-এর যাচাইকরণ কোড
            আছে, কিন্তু কোনো বিজ্ঞাপন দেখানো হয় না। বিজ্ঞাপন চালু হলেও এই নীতিই
            প্রযোজ্য থাকবে।
          </em>
        </p>
      </Section>

      <Section bn="৬. তথ্যের নিরাপত্তা" en="6. Data security">
        <p style={{ margin: 0 }}>
          আপনার তথ্য Firebase-এর নিরাপত্তা নিয়ম (Security Rules) ও ভূমিকা-ভিত্তিক অ্যাক্সেস
          (role-based access) দিয়ে সুরক্ষিত থাকে — শিক্ষার্থী শুধু নিজের তথ্য দেখে, শিক্ষক শুধু
          নিজের যাচাইকৃত বিষয় দেখে, আর গুরুত্বপূর্ণ কাজগুলো অডিট লগে থাকে। কোনো সিস্টেমই ১০০%
          নিরাপদ নয় — কোনো সমস্যা দেখলে আমাদের জানান: ahmmizan23@gmail.com।
        </p>
      </Section>

      <Section bn="৭. কুকি" en="7. Cookies">
        <p style={{ margin: 0 }}>
          সাইটটি শুধু লগইন সেশন ও আপনার পছন্দ (যেমন ভাষা ও থিম) সংরক্ষণের জন্য কুকি
          ও লোকাল স্টোরেজ ব্যবহার করে। Google AdSense-এর যাচাইকরণ কোড সাইটে লোড
          হয়, কিন্তু এখনো কোনো বিজ্ঞাপন দেখানো হয় না, তাই বিজ্ঞাপন-কুকি দিয়ে
          আপনাকে ট্র্যাক করা হয় না। বিজ্ঞাপন চালু হলে Google AdSense কুকি ব্যবহার
          করতে পারে — তবে বিজ্ঞাপন হবে নন-পার্সোনালাইজড, আপনার তথ্য দিয়ে টার্গেট
          করা হবে না।
        </p>
        <p style={{ margin: '10px 0 0' }}>
          বিজ্ঞাপন চালু হলে বিজ্ঞাপন-কুকি সম্পর্কে এই তিনটি কথা প্রযোজ্য হবে: (১)
          Google-সহ তৃতীয় পক্ষের বিজ্ঞাপনদাতারা এই সাইটে বা অন্য সাইটে আপনার আগের
          ভিজিটের ভিত্তিতে বিজ্ঞাপন দেখাতে কুকি ব্যবহার করে; (২) Google-এর
          বিজ্ঞাপন-কুকির ব্যবহারের ফলে Google ও তার অংশীদাররা এই সাইট ও/অথবা অন্য
          সাইটে আপনার ভিজিটের ভিত্তিতে বিজ্ঞাপন দেখাতে পারে; (৩) আপনি{' '}
          <a href="https://adssettings.google.com" target="_blank" rel="noreferrer">
            Google Ads Settings
          </a>{' '}
          ও{' '}
          <a href="https://www.aboutads.info" target="_blank" rel="noreferrer">
            www.aboutads.info
          </a>{' '}
          থেকে পার্সোনালাইজড বিজ্ঞাপন বন্ধ (opt out) করতে পারেন।
        </p>
        <p style={{ margin: '10px 0 0' }}>
          <em>
            In English — when ads run: (1) third-party vendors, including Google, use
            cookies to serve ads based on a user&apos;s prior visits to this site or
            other sites; (2) Google&apos;s use of advertising cookies enables it and
            its partners to serve ads based on visits to this site and/or other sites;
            (3) users may opt out of personalised advertising via{' '}
            <a href="https://adssettings.google.com" target="_blank" rel="noreferrer">
              Google Ads Settings
            </a>{' '}
            and{' '}
            <a href="https://www.aboutads.info" target="_blank" rel="noreferrer">
              www.aboutads.info
            </a>
            .
          </em>
        </p>
      </Section>

      <Section bn="৮. আপনার অধিকার" en="8. Your rights">
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          <li>আপনার তথ্য দেখতে, ঠিক করতে বা মুছতে চাইলে আমাদের লিখুন।</li>
          <li>
            অ্যাকাউন্ট মুছতে চাইলে ইমেইলে অনুরোধ করুন — আপনার শেখার তথ্যসহ অ্যাকাউন্ট মুছে দেওয়া
            হবে।
          </li>
          <li>কোনো তথ্য ভুল থাকলে আমাদের জানালে তা ঠিক করে দেওয়া হবে।</li>
        </ul>
      </Section>

      <Section bn="৯. নীতির পরিবর্তন" en="9. Changes to this policy">
        <p style={{ margin: 0 }}>
          এই নীতি বদলালে নতুন সংস্করণ এখানেই প্রকাশ করা হবে, তারিখসহ। বড় কোনো পরিবর্তন হলে
          অ্যাকাউন্টধারীদের জানানো হবে।
        </p>
      </Section>

      <Section bn="১০. যোগাযোগ" en="10. Contact">
        <p style={{ margin: 0 }}>
          গোপনীয়তা নিয়ে কোনো প্রশ্ন থাকলে লিখুন: <strong>ahmmizan23@gmail.com</strong>
          <br />
          Eduvelto — Founder &amp; CEO: Ali Hasan Mohammed Mizan
        </p>
      </Section>
    </PageShell>
  );
}
