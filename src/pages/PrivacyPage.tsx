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
  const { lang, t } = useLanguage();
  return (
    <PageShell titleBn="গোপনীয়তা নীতি" titleEn="Privacy Policy — Eduvelto" wide>
      <p style={{ color: 'var(--muted-ivory)', margin: '0 0 20px', lineHeight: 1.7 }}>
        {t({
          bn: 'সর্বশেষ হালনাগাদ: ২৩ নভেম্বর ২০২৬। Eduvelto বাংলাদেশের শিক্ষার্থীদের জন্য একটি সম্পূর্ণ বিনামূল্যের শিক্ষা প্ল্যাটফর্ম। এই নীতিতে বলা আছে আমরা কী তথ্য সংগ্রহ করি, কেন করি, আর আপনার তথ্য কীভাবে সুরক্ষিত থাকে।',
          en: 'Last updated: 23 November 2026. Eduvelto is a completely free education platform for students of Bangladesh. This policy explains what data we collect, why we collect it, and how your data stays protected.',
        })}
      </p>

      <Section bn="১. আমরা কী তথ্য সংগ্রহ করি" en="1. What data we collect">
        {lang === 'bn' ? (
          <>
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
          </>
        ) : (
          <>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              <li>
                <strong>Account data:</strong> your name, email address, and what you give at
                registration — education stream, class/year, department, board/university, institution.
              </li>
              <li>
                <strong>Learning data:</strong> which lessons you read, which exams you took,
                results, bookmarks, progress. These are only used to show your studies.
              </li>
              <li>
                <strong>Technical data:</strong> general device and browser information — to keep
                security and site speed right. We do not collect your exact location.
              </li>
            </ul>
            <p style={{ margin: '10px 0 0' }}>
              <strong>What we do NOT collect:</strong> National Identity Card (NID), face photo or
              biometrics, any document upload, or any payment/card information — Eduvelto is
              completely free, so payment is never taken.
            </p>
          </>
        )}
      </Section>

      <Section bn="২. তথ্য কীভাবে ব্যবহার করি" en="2. How we use your data">
        {lang === 'bn' ? (
          <>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              <li>আপনার শ্রেণির সঠিক বই, বিষয়, পাঠ ও পরীক্ষা দেখানো।</li>
              <li>আপনার অগ্রগতি ও ফলাফল সংরক্ষণ ও দেখানো।</li>
              <li>অ্যাকাউন্টের নিরাপত্তা রক্ষা করা ও অপব্যবহার ঠেকানো।</li>
              <li>প্ল্যাটফর্মটি আরও ভালো করা।</li>
            </ul>
            <p style={{ margin: '10px 0 0' }}>
              আপনার তথ্য কখনো বিজ্ঞাপনের টার্গেটিংয়ের জন্য ব্যবহার করা হয় না।
            </p>
          </>
        ) : (
          <>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              <li>Showing the right books, subjects, lessons and exams for your class.</li>
              <li>Saving and showing your progress and results.</li>
              <li>Protecting your account's security and preventing misuse.</li>
              <li>Making the platform better.</li>
            </ul>
            <p style={{ margin: '10px 0 0' }}>
              Your data is never used for advertising targeting.
            </p>
          </>
        )}
      </Section>

      <Section bn="৩. শিক্ষার্থীর তথ্য কখনো বিক্রি করা হয় না" en="3. Student data is never sold">
        {lang === 'bn' ? (
          <p style={{ margin: 0 }}>
            <strong>
              আমরা শিক্ষার্থীর ব্যক্তিগত তথ্য কখনো বিক্রি করি না, ভাড়া দিই না, আর মার্কেটিংয়ের
              জন্য কোনো তৃতীয় পক্ষের সঙ্গে ভাগ করি না — কখনোই না।
            </strong>{' '}
            আপনার তথ্য শুধু Eduvelto চালানোর জন্য ব্যবহার হয়। আইনগত বাধ্যবাধকতা ছাড়া আপনার তথ্য
            কারো কাছে দেওয়া হয় না।
          </p>
        ) : (
          <p style={{ margin: 0 }}>
            <strong>
              We never sell, rent, or share a student's personal data with any third party for
              marketing — never.
            </strong>{' '}
            Your data is used only to run Eduvelto. Without a legal obligation, your data is
            given to nobody.
          </p>
        )}
      </Section>

      <Section bn="৪. শিশুদের সুরক্ষা ও অভিভাবক" en="4. Child safety and guardians">
        {lang === 'bn' ? (
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
        ) : (
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>
              For students under 18, guardian consent and linking apply where needed.
            </li>
            <li>
              A guardian sees only their own child's progress, results and routine — never
              another family's child's data.
            </li>
            <li>
              A child's personal contact information (phone, email) is never shown to anyone
              else; for under-18s, contact information is always &ldquo;only me&rdquo;.
            </li>
            <li>We never collect a child's face photo or biometric data.</li>
            <li>
              No teacher or anyone else can read a student's personal messages — except in
              exceptional cases, only through a written process, with the owner's approval,
              for a limited time.
            </li>
          </ul>
        )}
      </Section>

      <Section bn="৫. বিজ্ঞাপন" en="5. Advertising">
        {lang === 'bn' ? (
          <>
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
          </>
        ) : (
          <>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              <li>
                <strong>Only non-personalised ads:</strong> only safe, family-friendly ads for
                children will be shown. No targeted or personal ads.
              </li>
              <li>Students are not separately tracked for ads.</li>
              <li>
                <strong>No ads during exams:</strong> no ads are shown while an exam or quiz is
                running — never in the middle of questions. After the exam ends, a bottom
                banner ad may appear on the result page.
              </li>
              <li>
                <strong>Where ads appear:</strong> the homepage top banner (below the hero) and
                bottom banner; inside and at the end of library and book lists; in the middle
                and at the end of lessons; at the top, middle and end of articles. No ads inside
                AI Teacher answers, or on login/registration, profile or admin pages.
              </li>
              <li>
                <strong>Every ad is clearly recognisable:</strong> &ldquo;বিজ্ঞাপন&rdquo; is
                written above the ad, and no ad looks like a download or next-step button.
                If no ad is available, the space collapses instead of staying empty.
              </li>
            </ul>
            <p style={{ margin: '10px 0 0' }}>
              <em>
                Note: ads have not started on the site yet — the Google AdSense verification
                code is present, but no ad is shown. When ads start, this same policy will
                apply.
              </em>
            </p>
          </>
        )}
      </Section>

      <Section bn="৬. তথ্যের নিরাপত্তা" en="6. Data security">
        {lang === 'bn' ? (
          <p style={{ margin: 0 }}>
            আপনার তথ্য Firebase-এর নিরাপত্তা নিয়ম (Security Rules) ও ভূমিকা-ভিত্তিক অ্যাক্সেস
            (role-based access) দিয়ে সুরক্ষিত থাকে — শিক্ষার্থী শুধু নিজের তথ্য দেখে, শিক্ষক শুধু
            নিজের যাচাইকৃত বিষয় দেখে, আর গুরুত্বপূর্ণ কাজগুলো অডিট লগে থাকে। কোনো সিস্টেমই ১০০%
            নিরাপদ নয় — কোনো সমস্যা দেখলে আমাদের জানান: ahmmizan23@gmail.com।
          </p>
        ) : (
          <p style={{ margin: 0 }}>
            Your data stays protected by Firebase Security Rules and role-based access — a
            student sees only their own data, a teacher sees only their own verified subjects,
            and important actions stay in the audit log. No system is 100% safe — if you see
            a problem, tell us: ahmmizan23@gmail.com.
          </p>
        )}
      </Section>

      <Section bn="৭. কুকি" en="7. Cookies">
        {lang === 'bn' ? (
          <>
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
          </>
        ) : (
          <>
            <p style={{ margin: 0 }}>
              The site uses cookies and local storage only to save your login session and your
              preferences (such as language and theme). The Google AdSense verification code
              loads on the site, but no ad is shown yet, so you are not tracked with
              advertising cookies. When ads start, Google AdSense may use cookies — but the
              ads will be non-personalised, not targeted with your data.
            </p>
            <p style={{ margin: '10px 0 0' }}>
              When ads start, these three points about advertising cookies will apply: (1)
              third-party vendors, including Google, use cookies to serve ads based on a
              user's prior visits to this site or other sites; (2) Google's use of
              advertising cookies enables it and its partners to serve ads based on visits
              to this site and/or other sites; (3) you may opt out of personalised
              advertising from{' '}
              <a href="https://adssettings.google.com" target="_blank" rel="noreferrer">
                Google Ads Settings
              </a>{' '}
              and{' '}
              <a href="https://www.aboutads.info" target="_blank" rel="noreferrer">
                www.aboutads.info
              </a>
              .
            </p>
          </>
        )}
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
        {lang === 'bn' ? (
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>আপনার তথ্য দেখতে, ঠিক করতে বা মুছতে চাইলে আমাদের লিখুন।</li>
            <li>
              অ্যাকাউন্ট মুছতে চাইলে ইমেইলে অনুরোধ করুন — আপনার শেখার তথ্যসহ অ্যাকাউন্ট মুছে দেওয়া
              হবে।
            </li>
            <li>কোনো তথ্য ভুল থাকলে আমাদের জানালে তা ঠিক করে দেওয়া হবে।</li>
          </ul>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>Write to us if you want to see, correct or delete your data.</li>
            <li>
              To delete your account, request by email — your account will be deleted along
              with your learning data.
            </li>
            <li>If any data is wrong, tell us and it will be corrected.</li>
          </ul>
        )}
      </Section>

      <Section bn="৯. নীতির পরিবর্তন" en="9. Changes to this policy">
        {lang === 'bn' ? (
          <p style={{ margin: 0 }}>
            এই নীতি বদলালে নতুন সংস্করণ এখানেই প্রকাশ করা হবে, তারিখসহ। বড় কোনো পরিবর্তন হলে
            অ্যাকাউন্টধারীদের জানানো হবে।
          </p>
        ) : (
          <p style={{ margin: 0 }}>
            If this policy changes, the new version will be published here, with the date.
            Account holders will be told about any big change.
          </p>
        )}
      </Section>

      <Section bn="১০. যোগাযোগ" en="10. Contact">
        {lang === 'bn' ? (
          <p style={{ margin: 0 }}>
            গোপনীয়তা নিয়ে কোনো প্রশ্ন থাকলে লিখুন: <strong>ahmmizan23@gmail.com</strong>
            <br />
            Eduvelto — Founder &amp; CEO: Ali Hasan Mohammed Mizan
          </p>
        ) : (
          <p style={{ margin: 0 }}>
            Questions about privacy? Write to: <strong>ahmmizan23@gmail.com</strong>
            <br />
            Eduvelto — Founder &amp; CEO: Ali Hasan Mohammed Mizan
          </p>
        )}
      </Section>
    </PageShell>
  );
}
