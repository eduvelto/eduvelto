// Eduvelto — homepage Question Maker tab panel (owner 25 Nov 2026
// 18:26: "question banai j setar akta tab dite bolci j" — the
// question-making feature gets its own tab).
//
// ENTRY POINT only — the full builder lives on /question-maker (and
// the builder itself on /question-paper-generator); nothing of the
// builder is embedded here. Copy is reused verbatim from the
// QuestionMakerLandingPage hero + free-vs-Pro card; numbers come from
// the same pricing data (getInitialData + QPG constants) — no
// invented claims, no invented numbers, no competitor names (owner
// rule 25 Nov 17:28).

import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { getInitialData } from '../lib/questionMakerInitialData';
import { QPG_CUSTOM_PAPER_BDT, QPG_PRICE_CLAIM_EN } from '../lib/questionPaper';

export default function HomeQuestionMakerPanel() {
  const { t, lang } = useLanguage();
  // Static build-time data (pre-rendered store with static fallback,
  // zero Firestore reads) — the same source the landing page reads.
  const data = getInitialData('question-maker');
  const freeN = lang === 'bn' ? data.freeMonthlyLimit.toLocaleString('bn-BD') : String(data.freeMonthlyLimit);
  const customBdt = lang === 'bn' ? QPG_CUSTOM_PAPER_BDT.toLocaleString('bn-BD') : String(QPG_CUSTOM_PAPER_BDT);
  return (
    <section className="ev-rd-section" aria-label={t({ bn: 'প্রশ্নপত্র তৈরি', en: 'Question Maker' })}>
      <div className="ev-rd-head">
        <h2>{t({ bn: '📝 প্রশ্নপত্র তৈরি', en: '📝 Question Maker' })}</h2>
        <Link to="/question-maker">{t({ bn: 'সব দেখুন →', en: 'See all →' })}</Link>
      </div>
      <p className="ev-rd-sub">
        {t({
          bn: 'Eduvelto প্রশ্নপত্র জেনারেটর — শিক্ষক ও কোচিং সেন্টারের জন্য অধ্যায়ভিত্তিক প্রশ্নপত্র তৈরির ফ্রি টুল। সাধারণ (NCTB), মাদ্রাসা এবং চাকরি ও ভর্তি কোচিং — তিন ধারাতেই প্রশ্নপত্র বানানো যায়। শুধু যাচাইকৃত প্রশ্ন দিয়ে — যাচাই হয়নি এমন প্রশ্ন কখনো দেখানো হয় না।',
          en: 'Eduvelto Question Paper Generator — a free tool for teachers and coaching centres to build chapter-wise question papers. General (NCTB), Madrasa, and job & admission coaching — all three streams. Only verified questions — unverified questions are never shown.',
        })}
      </p>
      <ul style={{ fontSize: 14, lineHeight: 1.9, margin: '0 0 4px', paddingLeft: 20 }}>
        <li>
          {t({
            bn: `মাসে ${freeN}টা ফ্রি পেপার (জলছাপসহ)`,
            en: `${freeN} free papers a month (watermarked)`,
          })}
        </li>
        <li>{t({ bn: data.priceClaimBn, en: QPG_PRICE_CLAIM_EN })}</li>
        <li>
          <Link to="/omr-evaluator">{t({ bn: 'OMR চেক সম্পূর্ণ ফ্রি', en: 'OMR checking completely free' })}</Link>
        </li>
        <li>
          <Link to="/custom-paper">
            {t({ bn: `কাস্টম পেপার ৳${customBdt}/পেপার`, en: `Custom paper ৳${customBdt}/paper` })}
          </Link>
          {t({ bn: ' — হাতে বানিয়ে দেওয়া হয়', en: ' — built by hand' })}
        </li>
        <li>{t({ bn: 'লগইন ছাড়াই ব্যবহার করা যায়', en: 'No login needed' })}</li>
      </ul>
      <div style={{ marginTop: 14 }}>
        <Link to="/question-maker" className="ev-btn ev-btn-primary">
          {t({ bn: 'প্রশ্নপত্র তৈরি করুন →', en: 'Make question papers →' })}
        </Link>
      </div>
    </section>
  );
}
