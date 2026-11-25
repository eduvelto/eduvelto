// Eduvelto — Terms & Conditions (Master Plan quick-wins, 23 Nov 2026).
//
// A real page (route /terms, linked from the footer). Honest terms for a
// 100% free education platform for Bangladesh. Mirrors PrivacyPage's
// tone + structure (PageShell + Card + Section, bilingual Bangla +
// English throughout — 24 Nov 2026 language system).
// Contact: ahmmizan23@gmail.com. Dated 23 November 2026.
//
// APPROVED by the owner 23 Nov 2026 06:57 ("onomoti dilam"), after a
// full parent check of the text for mistakes (none found). The visible
// draft notice was removed at merge prep; the page goes live with the
// post-cron deploy batch.
// Owner decisions recorded here (23 Nov 2026): an account is needed
// to read/study ("porar jnno o login kortr hobe") and to take exams
// ("exam dite obossoi login korte hobe"); hub/listing pages are public.
// No promises the platform cannot keep: no guaranteed exam results,
// admission, or any outcome; official circulars govern.
//
// Perplexity baseline refinements (23 Nov 2026, folded in):
//  - User content is SHORT and accurate: students cannot post or
//    upload anything. What users actually submit today is teacher
//    applications and correction reports/feedback (verified in
//    TeacherRegisterPage.tsx; no student posting/upload UI exists).
//  - Liability is PROPORTIONATE ("to the extent permitted by
//    applicable law"), never a blanket waiver or a zero cap based on
//    fees paid (there are no fees). Bangladesh law + competent
//    courts in Bangladesh, subject to mandatory rights.
//  - Privacy is summarised here and linked, not duplicated; Firebase
//    is named as the provider (see PrivacyPage).
// OWNER NOTES (in the delivery report, not solved in this draft):
//  - Minors can register: age/guardian arrangements should have
//    Bangladesh counsel review, not a checkbox alone (guardian
//    accounts exist in the design).
//  - Local counsel review is advisable for the enforceability of the
//    liability/disputes wording.

import { Link } from 'react-router-dom';
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

export default function TermsPage() {
  const { lang, t } = useLanguage();
  return (
    <PageShell titleBn="শর্তাবলী" titleEn="Terms & Conditions — Eduvelto" wide>
      <p style={{ color: 'var(--muted-ivory)', margin: '0 0 20px', lineHeight: 1.7 }}>
        {t({
          bn: 'তারিখ: ২৩ নভেম্বর ২০২৬। Eduvelto বাংলাদেশের শিক্ষার্থীদের জন্য একটি সম্পূর্ণ বিনামূল্যের শিক্ষা প্ল্যাটফর্ম। এই শর্তাবলীতে বলা আছে Eduvelto ব্যবহারের নিয়ম, আপনার দায়িত্ব, আর আমরা কী দিতে পারি আর কী পারি না।',
          en: 'Date: 23 November 2026. Eduvelto is a completely free education platform for students of Bangladesh. These terms explain the rules of using Eduvelto, your responsibilities, and what we can and cannot provide.',
        })}
      </p>

      <Section bn="১. সেবা — সম্পূর্ণ বিনামূল্যে" en="1. Service — completely free">
        {lang === 'bn' ? (
          <>
            <p style={{ margin: 0 }}>
              Eduvelto পরিচালনা করেন Founder &amp; CEO Ali Hasan Mohammed Mizan — যোগাযোগ:
              ahmmizan23@gmail.com। এই শর্তাবলী ২৩ নভেম্বর ২০২৬ থেকে কার্যকর।
            </p>
            <p style={{ margin: '10px 0 0' }}>
              Eduvelto সম্পূর্ণ বিনামূল্যে — পাঠ পড়া, পরীক্ষা দেওয়া, লাইব্রেরি ব্যবহার — কোনো
              কিছুর জন্য কোনো ফি নেই, কখনোই নয়। আমরা কোনো পেমেন্ট নিই না, তাই কোনো কার্ড বা
              পেমেন্টের তথ্য সংগ্রহ করা হয় না।
            </p>
          </>
        ) : (
          <>
            <p style={{ margin: 0 }}>
              Eduvelto is run by Founder &amp; CEO Ali Hasan Mohammed Mizan — contact:
              ahmmizan23@gmail.com. These terms are effective from 23 November 2026.
            </p>
            <p style={{ margin: '10px 0 0' }}>
              Eduvelto is completely free — reading lessons, taking exams, using the library —
              there is no fee for anything, ever. We take no payment, so no card or payment
              information is collected.
            </p>
          </>
        )}
      </Section>

      <Section bn="২. অ্যাকাউন্ট ও লগইন" en="2. Accounts & login">
        {lang === 'bn' ? (
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>
              পাঠ পড়তে ও পরীক্ষা দিতে অ্যাকাউন্ট লাগে — লগইন ছাড়া পাঠ পড়া বা পরীক্ষা দেওয়া
              যায় না।
            </li>
            <li>
              হাব ও তালিকার পাতা (যেমন বিষয়, বইয়ের তালিকা) সবার জন্য উন্মুক্ত — সেগুলো দেখতে
              লগইন লাগে না।
            </li>
            <li>
              অ্যাকাউন্ট খুলতে সঠিক তথ্য দিন। ১৮ বছরের কম শিক্ষার্থীর ক্ষেত্রে অভিভাবকের সম্মতি
              ও লিংকের নিয়ম প্রযোজ্য — বিস্তারিত গোপনীয়তা নীতিতে আছে।
            </li>
            <li>
              আপনার অ্যাকাউন্টের নিরাপত্তা আপনার দায়িত্ব — পাসওয়ার্ড কারো সঙ্গে ভাগ করবেন না,
              আর আপনার অ্যাকাউন্ট দিয়ে যা করা হয় তার দায় আপনার।
            </li>
            <li>
              এই শর্ত ভাঙলে, ভুয়া তথ্য দিলে বা প্ল্যাটফর্মের ক্ষতি করলে অ্যাকাউন্ট সাময়িকভাবে
              সীমিত বা স্থায়ীভাবে বন্ধ করা হতে পারে — গুরুতর ক্ষেত্রে মালিকের সিদ্ধান্তই
              চূড়ান্ত।
            </li>
          </ul>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>
              An account is needed to read lessons and take exams — without login, lessons
              cannot be read and exams cannot be taken.
            </li>
            <li>
              Hub and listing pages (such as subjects and book lists) are open to everyone —
              no login is needed to view them.
            </li>
            <li>
              Give correct information when opening an account. For students under 18, the
              guardian consent and linking rules apply — details are in the privacy policy.
            </li>
            <li>
              Your account's security is your responsibility — do not share your password with
              anyone, and you are responsible for what is done with your account.
            </li>
            <li>
              If you break these terms, give false information, or harm the platform, your
              account may be temporarily limited or permanently closed — in serious cases,
              the owner's decision is final.
            </li>
          </ul>
        )}
      </Section>

      <Section bn="৩. গ্রহণযোগ্য ব্যবহার" en="3. Acceptable use">
        {lang === 'bn' ? (
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>প্ল্যাটফর্মের ক্ষতি করা, অপব্যবহার করা বা অন্যের ক্ষতি করা যাবে না।</li>
            <li>সাইট থেকে তথ্য গণহারে কপি করা (scraping) বা স্বয়ংক্রিয়ভাবে তোলা যাবে না।</li>
            <li>অন্য কারো পরিচয়ে অ্যাকাউন্ট খোলা বা অন্য কারো সেজে ব্যবহার করা যাবে না।</li>
          </ul>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>The platform must not be harmed, misused, or used to harm others.</li>
            <li>Information must not be copied from the site in bulk (scraping) or taken automatically.</li>
            <li>An account must not be opened in someone else's identity, or used pretending to be someone else.</li>
          </ul>
        )}
      </Section>

      <Section bn="৪. আপনি যা জমা দেন" en="4. What you submit">
        {lang === 'bn' ? (
          <>
            <p style={{ margin: 0 }}>
              শিক্ষার্থীরা Eduvelto-তে কিছু পোস্ট বা আপলোড করতে পারে না। আপনি যা জমা দিতে পারেন
              তা হলো: শিক্ষক হওয়ার আবেদন, ভুল সংশোধনের প্রতিবেদন ও মতামত — আর কিছু নয়।
            </p>
            <p style={{ margin: '10px 0 0' }}>
              আপনি যা জমা দেন তার মালিকানা আপনারই থাকে। জমা দিয়ে আপনি আমাদের শুধু সেইটুকু
              অনুমতি দেন যা দরকার — আবেদন যাচাই, ভুল ঠিক করা ও দেখানো, আর নিয়ম রক্ষার জন্য
              পর্যালোচনা (moderation)। বেআইনি, অন্যের অধিকার লঙ্ঘন করে, বা আপত্তিকর কিছু জমা
              দেওয়া যাবে না; এমন কিছু পেলে তা সরিয়ে দেওয়া হবে। আপত্তিকর কিছু দেখলে জানান:
              ahmmizan23@gmail.com।
            </p>
          </>
        ) : (
          <>
            <p style={{ margin: 0 }}>
              Students cannot post or upload anything on Eduvelto. What you can submit is: a
              teacher application, a correction report, and feedback — nothing else.
            </p>
            <p style={{ margin: '10px 0 0' }}>
              What you submit remains yours. By submitting, you give us only the permission
              needed — to check the application, fix and show corrections, and review for
              rule-keeping (moderation). Nothing unlawful, violating someone else's rights, or
              objectionable may be submitted; if such a thing is found, it will be removed.
              If you see something objectionable, report it: ahmmizan23@gmail.com.
            </p>
          </>
        )}
      </Section>

      <Section bn="৫. তথ্যের নির্ভুলতা — কোনো গ্যারান্টি নেই" en="5. Accuracy — no guarantee of results">
        {lang === 'bn' ? (
          <p style={{ margin: 0 }}>
            আমাদের পাঠ ও প্রশ্ন শেখা ও অনুশীলনের জন্য, যত্ন করে যাচাই করা হয় — তবু তাতে ভুল
            থাকতে পারে, আর সময়ের সঙ্গে তা পুরোনোও হতে পারে। ব্যবহারের আগে অফিসিয়াল সিলেবাস
            ও সর্বশেষ পরীক্ষার বিজ্ঞপ্তির সঙ্গে মিলিয়ে নিন। Eduvelto নম্বর, পাস, ভর্তি, চাকরি
            বা অন্য কোনো পরীক্ষার ফলাফলের গ্যারান্টি দেয় না। চাকরি ও ভর্তির ক্ষেত্রে সরকারি
            বিজ্ঞপ্তি ও অফিসিয়াল সার্কুলারই চূড়ান্ত — সিদ্ধান্ত নেওয়ার আগে সেগুলো দেখে নিন।
          </p>
        ) : (
          <p style={{ margin: 0 }}>
            Our lessons and questions are for learning and practice, carefully checked — yet
            they may contain mistakes, and may become outdated over time. Before use, check
            them against the official syllabus and the latest exam notice. Eduvelto does not
            guarantee marks, passing, admission, jobs, or any other exam result. For jobs and
            admissions, government notices and official circulars are final — read them
            before deciding.
          </p>
        )}
      </Section>

      <Section bn="৬. মেধাস্বত্ব" en="6. Intellectual property">
        {lang === 'bn' ? (
          <p style={{ margin: 0 }}>
            Eduvelto-র পাঠ ও প্রশ্ন শেখার জন্য বিনামূল্যে ব্যবহার করা যায়। এগুলো বিক্রি করা,
            নিজের নামে চালানো বা নিজের ব্র্যান্ড হিসেবে ব্যবহার করা যাবে না। অন্যের কনটেন্ট
            ব্যবহার করলে তার উৎস উল্লেখ করতে হবে।
          </p>
        ) : (
          <p style={{ margin: 0 }}>
            Eduvelto's lessons and questions may be used for free for learning. They may not
            be sold, passed off as your own, or used as your own brand. If you use someone
            else's content, its source must be mentioned.
          </p>
        )}
      </Section>

      <Section bn="৭. গোপনীয়তা" en="7. Privacy">
        {lang === 'bn' ? (
          <p style={{ margin: 0 }}>
            আপনার অ্যাকাউন্টের তথ্য (নাম, ইমেইল, শ্রেণি/বর্ষ) ও শেখার তথ্য (পাঠ, পরীক্ষা,
            ফলাফল, অগ্রগতি) শুধু আপনার পড়াশোনা দেখানো, অগ্রগতি সংরক্ষণ ও অ্যাকাউন্টের
            নিরাপত্তার জন্য ব্যবহার হয় — তথ্য Firebase-এর মাধ্যমে সংরক্ষিত ও সুরক্ষিত থাকে।
            শিক্ষার্থীর ব্যক্তিগত তথ্য কখনো বিক্রি করা হয় না। বিস্তারিত জানতে দেখুন{' '}
            <Link to="/privacy-policy">গোপনীয়তা নীতি</Link> — তথ্য কী সংগ্রহ করা হয়, কীভাবে ব্যবহার
            হয় আর কীভাবে সুরক্ষিত থাকে, তা সেখানেই লেখা আছে।
          </p>
        ) : (
          <p style={{ margin: 0 }}>
            Your account information (name, email, class/year) and learning information
            (lessons, exams, results, progress) are used only to show your studies, save your
            progress, and keep your account secure — the data is stored and protected
            through Firebase. A student's personal data is never sold. For details, see the{' '}
            <Link to="/privacy-policy">Privacy Policy</Link> — what data is collected, how it is used,
            and how it is protected is written there.
          </p>
        )}
      </Section>

      <Section bn="৮. শর্তাবলীর পরিবর্তন" en="8. Changes to these terms">
        {lang === 'bn' ? (
          <p style={{ margin: 0 }}>
            এই শর্তাবলী বদলালে নতুন সংস্করণ তারিখসহ এখানেই প্রকাশ করা হবে। বড় কোনো পরিবর্তন
            হলে অ্যাকাউন্টধারীদের জানানো হবে।
          </p>
        ) : (
          <p style={{ margin: 0 }}>
            If these terms change, the new version will be published here with the date.
            Account holders will be told about any big change.
          </p>
        )}
      </Section>

      <Section bn="৯. দায় ও বিরোধ" en="9. Liability & disputes">
        {lang === 'bn' ? (
          <>
            <p style={{ margin: 0 }}>
              Eduvelto বিনামূল্যে দেওয়া হয়, আর আমরা যথাসাধ্য চেষ্টা করি সাইটটি সচল ও নির্ভুল
              রাখতে — তবু কোনো বাধা, ভুল বা পুরোনো তথ্যের কারণে ক্ষতি হলে আমাদের দায় প্রযোজ্য
              আইনে যতটুকু অনুমোদিত, ততটুকুর মধ্যেই সীমিত থাকবে; এই শর্তাবলী আপনার আইনগত
              বাধ্যতামূলক অধিকার কেড়ে নেয় না।
            </p>
            <p style={{ margin: '10px 0 0' }}>
              এই শর্তাবলী বাংলাদেশের আইন অনুযায়ী পরিচালিত হবে, আর কোনো বিরোধ বাংলাদেশের
              উপযুক্ত আদালতে নিষ্পত্তি হবে। বিরোধ দেখা দিলে প্রথমে লিখিতভাবে জানান — আমরা
              সমাধানের চেষ্টা করব।
            </p>
          </>
        ) : (
          <>
            <p style={{ margin: 0 }}>
              Eduvelto is given free, and we try our best to keep the site running and
              accurate — yet if any interruption, mistake, or outdated information causes
              harm, our liability will stay limited to what applicable law allows; these
              terms do not take away your mandatory legal rights.
            </p>
            <p style={{ margin: '10px 0 0' }}>
              These terms are governed by the laws of Bangladesh, and any dispute will be
              settled in the competent courts of Bangladesh. If a dispute arises, first
              inform us in writing — we will try to resolve it.
            </p>
          </>
        )}
      </Section>

      <Section bn="১০. যোগাযোগ" en="10. Contact">
        {lang === 'bn' ? (
          <p style={{ margin: 0 }}>
            শর্তাবলী নিয়ে কোনো প্রশ্ন থাকলে লিখুন: <strong>ahmmizan23@gmail.com</strong>
            <br />
            Eduvelto — Founder &amp; CEO: Ali Hasan Mohammed Mizan
          </p>
        ) : (
          <p style={{ margin: 0 }}>
            Questions about the terms? Write to: <strong>ahmmizan23@gmail.com</strong>
            <br />
            Eduvelto — Founder &amp; CEO: Ali Hasan Mohammed Mizan
          </p>
        )}
      </Section>
    </PageShell>
  );
}
