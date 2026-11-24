// Eduvelto — About page (Phase 2, Step 2).
//
// About Eduvelto + the Founder section. The biography is the text the
// owner approved on 20 Nov 2026 (21:08, both languages), with the
// private-tuition clause omitted per his public-details rule (20 Nov
// 22:54: never write in public details that he does private tuition;
// Madrasa teaching stays). The CEO badge is shown here because this is
// the owner's official Founder section — it is visual only and grants
// nothing (founder profile, 20 Nov 21:53).
// Owner decisions 21 Nov 07:24 (ui/premium-polish): DOB (21 Feb 2005)
// shown, factual date only, no age; birthplace NOT shown (not approved);
// phone number NOT shown on the founder profile (email only); no
// LinkedIn (not created); no team section (no real members to list);
// Available vs Coming-soon is stated explicitly (AI Teacher + Routine
// are coming soon, not live). Contact page itself is unchanged.

import { Link } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { useLanguage } from '../i18n/LanguageContext';

function CeoBadge() {
  return (
    <span
      style={{
        display: 'inline-block',
        background: '#F1B308',
        color: 'var(--heading)',
        fontWeight: 800,
        fontSize: 13,
        letterSpacing: 1,
        padding: '3px 10px',
        borderRadius: 999,
        marginLeft: 8,
        verticalAlign: 'middle',
        whiteSpace: 'nowrap',
      }}
    >
      ★ CEO
    </span>
  );
}

export default function AboutPage() {
  const { lang, t } = useLanguage();
  return (
    <PageShell titleBn="Eduvelto সম্পর্কে" titleEn="About Eduvelto">
      <p style={{ fontSize: 17, lineHeight: 1.7 }}>
        <strong>Eduvelto</strong> — {t({ bn: 'শেখো, এগিয়ে যাও, স্বপ্ন গড়ো', en: 'Learn, Grow, Achieve' })}.
      </p>
      <p style={{ lineHeight: 1.7 }}>
        {t({
          bn: 'Eduvelto বাংলাদেশের শিক্ষার্থীদের জন্য একটি বিনামূল্যের ডিজিটাল শিক্ষা প্ল্যাটফর্ম। এখানে পাঠ, পরীক্ষা ও ডিজিটাল লাইব্রেরি এক জায়গায় — ভবিষ্যতে স্মার্ট পড়ার পরিকল্পনা ও ব্যক্তিগত AI শিক্ষকসহ — বাংলায় ও ইংরেজিতে — যাতে দেশের যেকোনো প্রান্তের শিক্ষার্থী শিখতে, এগিয়ে যেতে ও স্বপ্ন গড়তে পারে.',
          en: 'Eduvelto is a free digital education platform for Bangladesh. It brings together lessons, exams and a digital library in one place — with smart study planning and a personal AI teacher planned for the future — in Bangla and in English — so that a student anywhere in the country can learn, grow and achieve, without cost standing in the way.',
        })}
      </p>
      <h2 style={{ fontFamily: "'Poppins','Hind Siliguri',system-ui,sans-serif", fontSize: 20, color: 'var(--heading)', margin: '28px 0 12px' }}>{t({ bn: 'যা যা আছে', en: 'What Eduvelto offers' })}</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
        <div className="ev-card ev-card-hover">
          <Link to="/jobs" style={{ fontWeight: 700, color: 'var(--heading)' }}>{t({ bn: 'চাকরি প্রস্তুতি', en: 'Job Preparation' })}</Link>
          <p style={{ margin: '6px 0 0', color: 'var(--muted)', fontSize: 14 }}>{t({ bn: 'বিসিএস, ব্যাংক, প্রাথমিক শিক্ষক, NTRCA ও অন্যান্য চাকরির পরীক্ষার প্রস্তুতি।', en: 'Preparation for BCS, bank, primary teacher, NTRCA and other job exams.' })}</p>
        </div>
        <div className="ev-card ev-card-hover">
          <Link to="/admissions" style={{ fontWeight: 700, color: 'var(--heading)' }}>{t({ bn: 'ভর্তি প্রস্তুতি', en: 'Admission Preparation' })}</Link>
          <p style={{ margin: '6px 0 0', color: 'var(--muted)', fontSize: 14 }}>{t({ bn: 'জাতীয় বিশ্ববিদ্যালয়সহ বিশ্ববিদ্যালয় ভর্তি পরীক্ষার প্রস্তুতি।', en: 'University admission preparation, including National University.' })}</p>
        </div>
        <div className="ev-card ev-card-hover">
          <Link to="/library" style={{ fontWeight: 700, color: 'var(--heading)' }}>{t({ bn: 'ডিজিটাল লাইব্রেরি', en: 'Digital Library' })}</Link>
          <p style={{ margin: '6px 0 0', color: 'var(--muted)', fontSize: 14 }}>{t({ bn: 'বই, প্রশ্নোত্তর ও সহজ ব্যাখ্যাসহ পরীক্ষার প্রস্তুতি (শ্রেণি ৯–১০, এইচএসসি, অনার্স ও মাস্টার্স)।', en: 'Exam preparation with books, Q&A and simple explanations (Class 9–10, HSC, Honours and Masters).' })}</p>        </div>
        <div className="ev-card ev-card-hover">
          <Link to="/directory" style={{ fontWeight: 700, color: 'var(--heading)' }}>{t({ bn: 'শিক্ষা নির্দেশিকা', en: 'Education Directory' })}</Link>
          <p style={{ margin: '6px 0 0', color: 'var(--muted)', fontSize: 14 }}>{t({ bn: 'ধাপে ধাপে বিষয় ও বই খুঁজুন: শিক্ষার ধারা → বোর্ড → প্রোগ্রাম → শ্রেণি → বিষয়।', en: 'Find subjects and books step by step: education stream → board → programme → class → subject.' })}</p>
        </div>
        <div className="ev-card ev-card-hover">
          <Link to="/exam" style={{ fontWeight: 700, color: 'var(--heading)' }}>{t({ bn: 'পরীক্ষা', en: 'Exams' })}</Link>
          <p style={{ margin: '6px 0 0', color: 'var(--muted)', fontSize: 14 }}>{t({ bn: 'বিনামূল্যে পরীক্ষা ও ফলাফল।', en: 'Free exams and results.' })}</p>
        </div>
        <div className="ev-card ev-card-hover">
          <Link to="/routine" style={{ fontWeight: 700, color: 'var(--heading)' }}>{t({ bn: 'রুটিন', en: 'Study Routine' })}</Link>
          <p style={{ margin: '6px 0 0', color: 'var(--muted)', fontSize: 14 }}>{t({ bn: 'স্মার্ট পড়ার পরিকল্পনা — শীঘ্রই আসছে।', en: 'Smart study planning — coming soon.' })}</p>
        </div>
        <div className="ev-card">
          <strong style={{ color: 'var(--heading)' }}>{t({ bn: 'ব্যক্তিগত AI শিক্ষক', en: 'Personal AI Teacher' })}</strong>
          <p style={{ margin: '6px 0 0', color: 'var(--muted)', fontSize: 14 }}>{t({ bn: 'শিগগিরই আসছে।', en: 'Coming soon.' })}</p>
        </div>
      </div>

      {/* Live counts + what Eduvelto is NOT (24 Nov 2026, brand-SEO
          wave 1, trust draft §1): the counts are the live library
          numbers (609 books / 2,307 chapters / 23,346 questions),
          the 35 published BCS English questions and the 7 Opportunity
          Hub listings. Classes 1–5 and 6–8 have no books yet — the
          page says so plainly instead of implying full coverage. */}
      <p style={{ marginTop: 20, lineHeight: 1.7 }}>
        {t({
          bn: 'আজ Eduvelto-তে আছে: ডিজিটাল লাইব্রেরিতে ৬০৯টি বই, ২,৩০৭টি অধ্যায় ও ২৩,৩৪৬টি প্রশ্ন; বিসিএস ইংরেজির ৩৫টি যাচাইকৃত প্রশ্ন; Opportunity Hub-এ ৭টি যাচাইকৃত সুযোগের তালিকা। শ্রেণি ৯–১০, এইচএসসি ও অনার্স–মাস্টার্সের বই লাইব্রেরিতে আছে; শ্রেণি ১–৫ ও ৬–৮-এর বই এখনো আসেনি — আসছে। সব পরীক্ষা MCQ-ভিত্তিক। পড়া ও পরীক্ষা দেওয়ার জন্য লগইন করতে হয়; লাইব্রেরি ও তথ্যভিত্তিক পাতা সবার জন্য উন্মুক্ত।',
          en: 'Eduvelto today: a digital library of 609 books, 2,307 chapters and 23,346 questions; 35 verified BCS English questions; 7 verified Opportunity Hub listings. Books for Class 9–10, HSC and Honours–Masters are in the library; Class 1–5 and 6–8 books have not arrived yet — they are coming. All exams are MCQ-based. Reading and taking exams needs a login; the library and information pages are open to everyone.',
        })}
      </p>

      <h2 style={{ fontFamily: "'Poppins','Hind Siliguri',system-ui,sans-serif", fontSize: 20, color: 'var(--heading)', margin: '28px 0 12px' }}>{t({ bn: 'Eduvelto কী নয়', en: 'What Eduvelto is not' })}</h2>
      <ul style={{ lineHeight: 1.9, paddingLeft: 20, margin: 0 }}>
        <li>{t({ bn: 'Eduvelto কোনো বিশ্ববিদ্যালয়, কলেজ বা শিক্ষা প্রতিষ্ঠান নয়।', en: 'Eduvelto is not a university, college or educational institution.' })}</li>
        <li>{t({ bn: 'Eduvelto কোনো পরীক্ষা কর্তৃপক্ষের (BCS/BPSC, NTRCA, ব্যাংক বা জাতীয় বিশ্ববিদ্যালয়) সঙ্গে সম্পৃক্ত নয় — এটি শুধু পরীক্ষার প্রস্তুতিতে সাহায্য করে।', en: 'Eduvelto is not affiliated with any exam authority (BCS/BPSC, NTRCA, banks or National University) — it only helps with exam preparation.' })}</li>
        <li>{t({ bn: 'Eduvelto কোনো সার্টিফিকেট, ডিপ্লোমা বা স্বীকৃত যোগ্যতা দেয় না। অনুশীলন পরীক্ষার নম্বর শুধু নিজের মূল্যায়নের জন্য।', en: 'Eduvelto issues no certificate, diploma or recognised qualification. Practice test scores are only for self-assessment.' })} <Link to="/certificate-policy">{t({ bn: 'সার্টিফিকেট নীতি', en: 'Certificate policy' })}</Link></li>
        <li>{t({ bn: 'Eduvelto-র কোনো পেইড স্তর নেই — সবকিছু ১০০% বিনামূল্যে, চিরকাল। কোনো ফি, কোনো সাবস্ক্রিপশন নেই।', en: 'Eduvelto has no paid tier — everything is 100% free, forever. No fees, no subscription.' })}</li>
      </ul>

      <p style={{ marginTop: 20, lineHeight: 1.7 }}>
        {t({ bn: 'আমাদের নীতি: ', en: 'Our policies: ' })}
        <Link to="/editorial-policy">{t({ bn: 'সম্পাদকীয় নীতি', en: 'Editorial policy' })}</Link>
        {' · '}
        <Link to="/content-accuracy">{t({ bn: 'বিষয়বস্তুর নির্ভুলতা', en: 'Content accuracy' })}</Link>
        {' · '}
        <Link to="/disclaimer">{t({ bn: 'দায়বর্জন', en: 'Disclaimer' })}</Link>
        {' · '}
        <Link to="/privacy">{t({ bn: 'গোপনীয়তা নীতি', en: 'Privacy policy' })}</Link>
        {' · '}
        <Link to="/terms">{t({ bn: 'শর্তাবলি', en: 'Terms' })}</Link>
      </p>

      <h2 style={{ fontFamily: "'Poppins','Hind Siliguri',system-ui,sans-serif", fontSize: 20, color: 'var(--heading)', margin: '28px 0 12px' }}>{t({ bn: 'প্রতিষ্ঠাতা', en: 'Founder' })}</h2>
      <section
        className="ev-card"
        style={{
          display: 'flex',
          gap: 20,
          flexWrap: 'wrap',
          alignItems: 'flex-start',
          padding: 20,
          background: 'var(--card)',
        }}
      >
        <img
          src="/founder-photo.jpg"
          alt="Ali Hasan Mohammed Mizan, Founder & CEO, Eduvelto"
          style={{ width: 160, height: 160, objectFit: 'cover', borderRadius: '50%', border: '3px solid #F1B308' }}
        />
        <div style={{ flex: '1 1 320px', minWidth: 260 }}>
          <h3 style={{ margin: '0 0 4px', fontSize: 20 }}>
            Ali Hasan Mohammed Mizan
            <CeoBadge />
          </h3>
          <p style={{ margin: '0 0 12px', color: 'var(--heading)', fontWeight: 600 }}>
            {t({ bn: 'প্রতিষ্ঠাতা ও CEO, Eduvelto', en: 'Founder & CEO, Eduvelto' })}
          </p>
          {/* DOB shown per the owner's 21 Nov 07:24 decision (factual date only, no age).
              Birthplace is NOT shown — not approved for the public profile. */}
          <p style={{ margin: '0 0 12px', color: 'var(--muted)', fontSize: 14 }}>
            {t({ bn: 'জন্ম: ২১ ফেব্রুয়ারি ২০০৫', en: 'Born: 21 February 2005' })}
          </p>
          {lang === 'bn' ? (
            <p style={{ lineHeight: 1.7, margin: 0 }}>
              আলী হাসান মোহাম্মদ মিজান Eduvelto-র প্রতিষ্ঠাতা ও মালিক। তিনি ২০২৩ সাল থেকে
              তাহসিনুল উম্মাহ ইন্টারন্যাশনাল মাদ্রাসায় ইংরেজি পড়াচ্ছেন। তিনি জাতীয়
              বিশ্ববিদ্যালয়ে ইংরেজি বিষয়ে অনার্স তৃতীয় বর্ষের শিক্ষার্থী। ২০২০ সালে বিজ্ঞান বিভাগে
              এসএসসি এবং ২০২২ সালে বিজ্ঞান বিভাগ থেকে কক্সবাজার সিটি কলেজ থেকে এইচএসসি সম্পন্ন
              করেন। পড়ালেখার পাশাপাশি তিনি বাবার ব্যবসা দেখাশোনা করেন। তাঁর বিশ্বাস — মানসম্মত
              শিক্ষা বাংলাদেশের প্রত্যেক শিক্ষার্থীর জন্য বিনামূল্যে পৌঁছে দেওয়া উচিত, বাংলায় ও
              ইংরেজিতে। সেই লক্ষ্যেই তিনি Eduvelto গড়েছেন — পাঠ, পরীক্ষা, ডিজিটাল লাইব্রেরি ও
              স্মার্ট পড়ার পরিকল্পনা এক জায়গায়, ভবিষ্যতে ব্যক্তিগত AI শিক্ষকসহ, যাতে দেশের
              যেকোনো প্রান্তের শিক্ষার্থী শিখতে, এগিয়ে যেতে ও স্বপ্ন গড়তে পারে।
            </p>
          ) : (
            <p style={{ lineHeight: 1.7, margin: 0 }}>
              Ali Hasan Mohammed Mizan is the Founder and Owner of Eduvelto. He has taught English
              at Tahsinul Ummah International Madrasa since 2023, and is currently in his third year
              of Honours in English at the National University. He completed his SSC in Science in
              2020 and his HSC in Science in 2022 at Cox&apos;s Bazar City College. Alongside his
              studies, he helps look after his father&apos;s business. He founded Eduvelto with a
              simple belief: quality education should be free and within reach of every student in
              Bangladesh — in Bangla and in English. Eduvelto brings together lessons, exams, a
              digital library and smart study planning — with a personal AI teacher planned for the
              future — so that a student anywhere in the country can learn, grow and achieve,
              without cost standing in the way.
            </p>
          )}
        </div>
      </section>

      <p style={{ marginTop: 20, lineHeight: 1.7 }}>
        <Link to="/founder">{t({ bn: 'সম্পূর্ণ প্রতিষ্ঠাতা প্রোফাইল', en: 'Full founder profile' })} →</Link>
      </p>

      <p style={{ marginTop: 20, lineHeight: 1.7 }}>
        {t({ bn: 'যোগাযোগ করতে চান?', en: 'Want to get in touch?' })}{' '}
        <Link to="/contact">{t({ bn: 'যোগাযোগ পাতা', en: 'Contact page' })}</Link>
        {t({ bn: ' — অফিসিয়াল ইমেইল ', en: ' — official email ' })}
        <a href="mailto:ahmmizan23@gmail.com">ahmmizan23@gmail.com</a>
        {lang === 'bn' ? '।' : '.'}
        {/* No phone number on the founder profile — owner's 21 Nov 07:24 decision.
            The Contact page itself is unchanged. */}
      </p>
    </PageShell>
  );
}
