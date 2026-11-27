// Eduvelto — Question Maker landing page (public, SEO).
//
// Route: /question-maker (routing-agnostic mount for now; the parallel
// SSG branch moves public routes under /:lang — on merge, SSG lands
// first, then this route moves under the /:lang pattern; see App.tsx).
//
// Static content only — no login, no Firestore reads. Everything on
// this page is an honest claim: verified-only questions (35 BCS English
// today), free 3 papers/month, Pro prices, and the honest limits (no
// full-bank download; screenshots cannot be fully prevented anywhere
// on the web — the generator uses deterrence only).
//
// SEO entries live in src/lib/seo.ts ('/question-maker').
//
// Design (A-Z model, 25 Nov 2026 10:14 — INSPIRATION only, never
// their text/branding/images/stats): warm cream two-column hero with
// a paper mockup (a real verified sample question), dark-green
// primary CTA, gold highlight; plus the differentiators card (set
// shuffler, browser OMR evaluator, free watermarked PDF — things
// they do not have). Scoped .ev-qm-* CSS in index.css.

import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { AlertBox, Card, Chip, LinkButton } from '../components/ui';
import {
  getInitialData,
  publishQuestionMakerInitialData,
} from '../lib/questionMakerInitialData';

export default function QuestionMakerLandingPage() {
  useEffect(() => {
    publishQuestionMakerInitialData();
  }, []);
  // Numbers come from window.__INITIAL_DATA__ (pre-rendered at build
  // time, zero Firestore reads) — static fallback when absent.
  const data = getInitialData('question-maker');
  return (
    <PageShell
      titleBn="প্রশ্নপত্র তৈরি করুন — ফ্রি প্রশ্নপত্র জেনারেটর"
      titleEn="Make Question Papers — Free Question Paper Generator"
      wide
    >
      {/* Two-column hero (A-Z design model, 25 Nov 2026 10:14 —
          inspiration only): copy left, real paper mockup right. The
          mockup shows a REAL verified sample question (BCS English),
          as the free PDF renders it. */}
      <div className="ev-qm-hero">
        <div>
          <p className="ev-qm-eyebrow">শিক্ষক ও কোচিং সেন্টারের জন্য</p>
          <p className="ev-qm-hero-copy">
            Eduvelto প্রশ্নপত্র জেনারেটর — শিক্ষক ও কোচিং সেন্টারের জন্য অধ্যায়ভিত্তিক প্রশ্নপত্র তৈরির ফ্রি
            টুল। সাধারণ (NCTB), মাদ্রাসা এবং চাকরি ও ভর্তি কোচিং — তিন ধারাতেই প্রশ্নপত্র বানানো যায়।
            শুধু যাচাইকৃত প্রশ্ন দিয়ে — যাচাই হয়নি এমন প্রশ্ন কখনো দেখানো হয় না।
          </p>
          <div className="ev-qm-hero-cta">
            <LinkButton to="/question-paper-generator">প্রশ্নপত্র তৈরি শুরু করুন — ফ্রি</LinkButton>
            <LinkButton to="/jobs/bcs/practice/english" variant="outline">
              যাচাইকৃত ৩৫টি প্রশ্ন দেখুন
            </LinkButton>
          </div>
          <p style={{ fontSize: 14, margin: 0 }}>
            <span className="ev-qm-gold">মাসে ৩টা ফ্রি পেপার</span> • OMR চেক সম্পূর্ণ ফ্রি • লগইন ছাড়াই
            ব্যবহার করা যায়
          </p>
        </div>
        <div className="ev-qm-mockup" aria-hidden="true">
          <span className="ev-qm-mockup-wm">eduvelto.com</span>
          <p className="ev-qm-mockup-title">প্রশ্নপত্র — English (BCS)</p>
          <p className="ev-qm-mockup-meta">বিষয়: English • পূর্ণমান: 10 • সময়: 30 মিনিট • সেট: খ</p>
          <hr className="ev-qm-mockup-rule" />
          <p className="ev-qm-mockup-q">১. Choose the passive form of the sentence: ‘The cat chased the mouse.’</p>
          <p className="ev-qm-mockup-o">(A) The mouse was chased by the cat. (B) The mouse chased the cat.</p>
          <p className="ev-qm-mockup-q">২. Choose the correct sentence.</p>
          <p className="ev-qm-mockup-o">(A) He go to school every day. (C) He goes to school every day.</p>
          <p className="ev-qm-mockup-foot">Powered by Eduvelto.com</p>
        </div>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 17 }}>কীভাবে কাজ করে</h2>
        <ol style={{ fontSize: 14, lineHeight: 1.9, margin: 0, paddingLeft: 20 }}>
          <li>ধারা বেছে নিন — সাধারণ (NCTB), মাদ্রাসা, অথবা চাকরি ও ভর্তি কোচিং।</li>
          <li>শ্রেণি → বিষয় → অধ্যায় বেছে নিন (এক বা একাধিক অধ্যায়)।</li>
          <li>অধ্যায়ের ভেতরে টপিক, প্রশ্নের ধরন (MCQ / সৃজনশীল / সংক্ষিপ্ত), সংখ্যা ও কাঠিন্য ঠিক করুন।</li>
          <li>পেপারের সব লেখা নিজের মতো সাজান — শিরোনাম, প্রতিষ্ঠানের নাম, তারিখ, নম্বর, সময়, নির্দেশনা।</li>
          <li>সুরক্ষিত আংশিক প্রিভিউ দেখুন, তারপর ফ্রি (জলছাপসহ) PDF ডাউনলোড করুন।</li>
        </ol>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 17 }}>আমাদের বিশেষত্ব — যা অন্যদের নেই</h2>
        <ul style={{ fontSize: 14, lineHeight: 1.9, margin: 0, paddingLeft: 20 }}>
          <li>
            <strong>সেট শাফলার (ক/খ/গ/ঘ):</strong> একই প্রশ্ন, প্রতিটি সেটে আলাদা ক্রম + মিলে যাওয়া Answer
            Key — ইউনিক সেট তৈরি হয়, নতুন প্রশ্ন বানানো হয় না।
          </li>
          <li>
            <strong>ব্রাউজার OMR মূল্যায়ন (সম্পূর্ণ ফ্রি):</strong> ১০–১০০ MCQ, নেগেটিভ মার্কিং, তাৎক্ষণিক
            ফল — কোনো Pro লাগে না।{' '}
            <Link to="/omr-evaluator">OMR মূল্যায়ন পাতা</Link>
          </li>
          <li>
            <strong>ফ্রি জলছাপযুক্ত PDF:</strong> লগইন ছাড়াই ব্যবহার করা যায় — মাসে ৩টা ফ্রি পেপার, কোনো
            গেট নেই।
          </li>
        </ul>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 17 }}>ফ্রি বনাম Pro</h2>
        <p style={{ fontSize: 14, lineHeight: 1.7, margin: '0 0 8px' }}>
          <strong>ফ্রি — ৳০:</strong> প্রতি মাসে {data.freeMonthlyLimit}টি পেপার। পেপারের সব লেখা (শিরোনাম,
          প্রতিষ্ঠানের নাম, বিষয়, শ্রেণি, তারিখ, নম্বর, সময়, নির্দেশনা, বিভাগের শিরোনাম) বদলানো যায় —
          সরাসরি পরীক্ষার পেপার (যেমন “বার্ষিক পরীক্ষা ২০২৬”) বানানো যায়, শুধু মডেল টেস্ট নয়।
        </p>
        <p style={{ fontSize: 14, lineHeight: 1.7, margin: '0 0 8px' }}>
          <strong>Pro:</strong> প্রতি পেপার ৳{data.proPerPaperBdt} অথবা ৳{data.proMonthlyBdt}/মাস অথবা
          ক্লাসভিত্তিক বার্ষিক ৳{data.cheapestAnnualBdt} থেকে — {data.priceClaimBn}। জলছাপ ছাড়া পরিষ্কার
          PDF, প্রতিষ্ঠানের লোগো, Answer Key শিট, ফন্ট / কলাম / স্পেসিং / লেআউট।{' '}
          <Chip tone="gold" className="ev-qm-chip-wrap">Pro আপগ্রেড এখন পর্যালোচনাধীন — ফ্রি ডাউনলোড আজই ব্যবহার করা যাবে</Chip>
        </p>
        <p style={{ fontSize: 14, lineHeight: 1.7, margin: 0 }}>
          পুরো প্রশ্ন ব্যাংক ডাউনলোড করা যায় না — শুধু তৈরি করা পেপারটিই ডাউনলোড করা যায়।
        </p>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 17 }}>চাকরি ও ভর্তি মডেল টেস্ট</h2>
        <p style={{ fontSize: 14, lineHeight: 1.7, margin: '0 0 8px' }}>
          BCS প্রিলিমিনারি (২০০ প্রশ্ন / ১২০ মিনিট), ব্যাংক জব (১০০/৬০), প্রাথমিক শিক্ষক (৯০/৯০), NTRCA
          (১০০/৬০) ও জাতীয় বিশ্ববিদ্যালয় ভর্তি (১০০ MCQ / ৬০ মিনিট) — শুধু যাচাইকৃত অফিসিয়াল প্যাটার্ন।
          প্রাথমিকের ডিফল্ট ৯০ নম্বর; অন্য সংখ্যা চাইলে পেপারে “কাস্টম ভ্যারিয়েন্ট” লেখা থাকবে।
        </p>
        <AlertBox tone="info">
          সত্য কথা: আজ যাচাইকৃত প্রশ্ন আছে মাত্র ৩৫টি (BCS ইংরেজি)। তাই পূর্ণাঙ্গ মডেল টেস্ট এখনো বানানো
          যায় না — ঘাটতি পূরণে প্রশ্ন বানানো হবে না। যাচাই শেষে প্রশ্ন বাড়বে, তখন পূর্ণাঙ্গ মক খুলবে।
        </AlertBox>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 17 }}>সচরাচর প্রশ্ন</h2>
        <p style={{ fontSize: 14, lineHeight: 1.7, margin: '0 0 8px' }}>
          <strong>প্রশ্ন কি যাচাইকৃত?</strong> হ্যাঁ — জেনারেটরে শুধু যাচাইকৃত, ভুলমুক্ত প্রশ্ন দেখানো হয়।
          Class 9-এর সংশোধিত প্যাক এখনো মালিকের যাচাইয়ের অপেক্ষায় — যাচাই শেষ না হলে তা পুলে ঢুকবে না।
        </p>
        <p style={{ fontSize: 14, lineHeight: 1.7, margin: '0 0 8px' }}>
          <strong>স্ক্রিনশট কি আটকানো যায়?</strong> পুরোপুরি না — কোনো ওয়েবসাইটই OS স্ক্রিনশট বা মোবাইল
          ক্যামেরা আটকাতে পারে না। তাই প্রিভিউ আংশিক, জলছাপযুক্ত ও র‍্যাস্টার (লেখা সিলেক্ট করা যায় না) —
          স্ক্রিনশটে কাজের পেপার পাওয়া যায় না।
        </p>
        <p style={{ fontSize: 14, lineHeight: 1.7, margin: 0 }}>
          <strong>প্রিন্ট করা যায়?</strong> হ্যাঁ — প্রিভিউ থেকে Print / Save as PDF করা যায় (A4 লেআউট)।
          পুরো পেপার পেতে PDF ডাউনলোড করুন।
        </p>
      </Card>

      <p style={{ fontSize: 13, color: '#666' }}>
        আরও দেখুন: <Link to="/jobs/bcs/practice/english">BCS ইংরেজি অনুশীলন</Link> •{' '}
        <Link to="/learn">ফ্রি পাঠ ও গাইড</Link>
      </p>
    </PageShell>
  );
}
