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

function CeoBadge() {
  return (
    <span
      style={{
        display: 'inline-block',
        background: '#F1B308',
        color: '#041742',
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
  return (
    <PageShell titleBn="Eduvelto সম্পর্কে" titleEn="About Eduvelto">
      <p style={{ fontSize: 17, lineHeight: 1.7 }}>
        <strong>Eduvelto</strong> — শেখো, এগিয়ে যাও, স্বপ্ন গড়ো / Learn, Grow, Achieve.
      </p>
      <p style={{ lineHeight: 1.7 }}>
        Eduvelto is a free digital education platform for Bangladesh. It brings together lessons,
        exams, a digital library and smart study planning — with a personal AI teacher planned for
        the future — in Bangla and in English — so that a student anywhere in the country can
        learn, grow and achieve, without cost standing in the way. / Eduvelto বাংলাদেশের
        শিক্ষার্থীদের জন্য একটি বিনামূল্যের ডিজিটাল শিক্ষা প্ল্যাটফর্ম। এখানে পাঠ, পরীক্ষা,
        ডিজিটাল লাইব্রেরি ও স্মার্ট পড়ার পরিকল্পনা এক জায়গায় — ভবিষ্যতে ব্যক্তিগত AI শিক্ষকসহ —
        বাংলায় ও ইংরেজিতে — যাতে দেশের যেকোনো প্রান্তের শিক্ষার্থী শিখতে, এগিয়ে যেতে ও স্বপ্ন
        গড়তে পারে.
      </p>
      <h2 style={{ fontFamily: "'Poppins','Hind Siliguri',system-ui,sans-serif", fontSize: 20, color: '#0A1F44', margin: '28px 0 12px' }}>যা যা আছে / What Eduvelto offers</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
        <div className="ev-card ev-card-hover">
          <Link to="/library" style={{ fontWeight: 700, color: '#0A1F44' }}>ডিজিটাল লাইব্রেরি / Digital Library</Link>
          <p style={{ margin: '6px 0 0', color: '#5A6478', fontSize: 14 }}>বই, প্রশ্নোত্তর ও সহজ ব্যাখ্যাসহ পরীক্ষার প্রস্তুতি (অনার্স, আলিম, এইচএসসি, এসএসসি ও কারিগরি)।</p>
        </div>
        <div className="ev-card ev-card-hover">
          <Link to="/directory" style={{ fontWeight: 700, color: '#0A1F44' }}>শিক্ষা নির্দেশিকা / Education Directory</Link>
          <p style={{ margin: '6px 0 0', color: '#5A6478', fontSize: 14 }}>ধাপে ধাপে বিষয় ও বই খুঁজুন: শিক্ষার ধারা → বোর্ড → প্রোগ্রাম → শ্রেণি → বিষয়।</p>
        </div>
        <div className="ev-card ev-card-hover">
          <Link to="/exam" style={{ fontWeight: 700, color: '#0A1F44' }}>পরীক্ষা / Exams</Link>
          <p style={{ margin: '6px 0 0', color: '#5A6478', fontSize: 14 }}>বিনামূল্যে পরীক্ষা ও ফলাফল।</p>
        </div>
        <div className="ev-card ev-card-hover">
          <Link to="/routine" style={{ fontWeight: 700, color: '#0A1F44' }}>রুটিন / Study Routine</Link>
          <p style={{ margin: '6px 0 0', color: '#5A6478', fontSize: 14 }}>স্মার্ট পড়ার পরিকল্পনা — শীঘ্রই আসছে। / Coming soon.</p>
        </div>
        <div className="ev-card">
          <strong style={{ color: '#0A1F44' }}>ব্যক্তিগত AI শিক্ষক / Personal AI Teacher</strong>
          <p style={{ margin: '6px 0 0', color: '#5A6478', fontSize: 14 }}>শিগগিরই আসছে। / Coming soon.</p>
        </div>
      </div>

      <h2 style={{ fontFamily: "'Poppins','Hind Siliguri',system-ui,sans-serif", fontSize: 20, color: '#0A1F44', margin: '28px 0 12px' }}>প্রতিষ্ঠাতা / Founder</h2>
      <section
        className="ev-card"
        style={{
          display: 'flex',
          gap: 20,
          flexWrap: 'wrap',
          alignItems: 'flex-start',
          padding: 20,
          background: '#F7F9FC',
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
          <p style={{ margin: '0 0 12px', color: '#0A1F44', fontWeight: 600 }}>
            Founder &amp; CEO, Eduvelto
          </p>
          {/* DOB shown per the owner's 21 Nov 07:24 decision (factual date only, no age).
              Birthplace is NOT shown — not approved for the public profile. */}
          <p style={{ margin: '0 0 12px', color: '#5A6478', fontSize: 14 }}>
            জন্ম: ২১ ফেব্রুয়ারি ২০০৫ / Born: 21 February 2005
          </p>
          <p style={{ lineHeight: 1.7, margin: '0 0 12px' }}>
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
        </div>
      </section>

      <p style={{ marginTop: 20, lineHeight: 1.7 }}>
        <Link to="/founder">সম্পূর্ণ প্রতিষ্ঠাতা প্রোফাইল / Full founder profile →</Link>
      </p>

      <p style={{ marginTop: 20, lineHeight: 1.7 }}>
        যোগাযোগ করতে চান? / Want to get in touch?{' '}
        <Link to="/contact">যোগাযোগ পাতা / Contact page</Link> — অফিসিয়াল ইমেইল{' '}
        <a href="mailto:ahmmizan23@gmail.com">ahmmizan23@gmail.com</a>।
        {/* No phone number on the founder profile — owner's 21 Nov 07:24 decision.
            The Contact page itself is unchanged. */}
      </p>
    </PageShell>
  );
}
