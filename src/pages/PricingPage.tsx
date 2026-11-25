// Eduvelto — Pricing page (public, PRICING FINAL — owner 25 Nov 09:34).
//
// Route: /pricing (routing-agnostic mount for now; the SSG branch
// moves public routes under /:lang — SSG merges first, then this
// route moves under that pattern; see App.tsx).
//
// RULE: every Eduvelto generator price = 30% of Eproshnobank's
// equivalent price (৭০% ছাড়ে), rounded to the nearest ৳10. This table
// SUPERSEDES all earlier tiers — the 09:19 50% table, and the
// ৳999/year, ৳799-proposed and ৳1,499-coaching tiers (Gemini
// proposals) — they must NOT appear as Eduvelto prices anywhere;
// ৳1,499 appears below ONLY as Eproshnobank's price for Class 9–10,
// struck through and labeled. There is NO single all-in-one yearly
// tier anymore.
//
// DISPLAY RULE (owner's marketing): each tier shows THEIR price as the
// main/original price (struck through), LABELED as Eproshnobank's
// price, then "৭০% ছাড়ে", then OUR price. The reference price MUST be
// labeled as Eproshnobank's — NEVER as our own former price. NEVER use
// the six-times-cheaper style claim (theirs is 3.33× ours, not 6×).
//
// Data comes from window.__INITIAL_DATA__ (pre-rendered at build time,
// zero Firestore reads) — see src/lib/questionMakerInitialData.ts.

import { useEffect } from 'react';
import { PageShell } from '../components/PageShell';
import { AlertBox, Card, Chip, LinkButton } from '../components/ui';
import {
  getInitialData,
  publishQuestionMakerInitialData,
} from '../lib/questionMakerInitialData';
import {
  QPG_CUSTOM_PAPER_BDT,
  QPG_CUSTOM_PAPER_THEIR_MAX_BDT,
  QPG_CUSTOM_PAPER_THEIR_MIN_BDT,
  QPG_PRICE_CLAIM_BN,
  QPG_WHATSAPP_USERNAME,
  type QpgPriceTier,
} from '../lib/questionPaper';

function TierTable(props: { titleBn: string; tiers: QpgPriceTier[] }) {
  return (
    <Card style={{ marginTop: 16 }}>
      <h2 style={{ margin: '0 0 8px', fontSize: 17 }}>{props.titleBn}</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '2px solid #ddd' }}>
            <th style={{ padding: '6px 4px' }}>প্যাকেজ</th>
            <th style={{ padding: '6px 4px' }}>Eproshnobank-এর মূল্য</th>
            <th style={{ padding: '6px 4px' }}></th>
            <th style={{ padding: '6px 4px' }}>আমাদের মূল্য</th>
          </tr>
        </thead>
        <tbody>
          {props.tiers.map((t) => (
            <tr key={t.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '6px 4px' }}>{t.nameBn}</td>
              <td style={{ padding: '6px 4px' }}>
                <s style={{ color: '#888' }}>৳{t.eproshnobankBdt.toLocaleString('en-IN')}</s>
              </td>
              <td style={{ padding: '6px 4px' }}>
                <Chip tone="gold">৭০% ছাড়ে</Chip>
              </td>
              <td style={{ padding: '6px 4px', fontWeight: 700 }}>৳{t.eduveltoBdt.toLocaleString('en-IN')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

export default function PricingPage() {
  useEffect(() => {
    publishQuestionMakerInitialData();
  }, []);
  const data = getInitialData('pricing');
  const byGroup = (g: QpgPriceTier['group']) => data.pricing.filter((t) => t.group === g);

  return (
    <PageShell titleBn="মূল্য — প্রশ্নপত্র জেনারেটর" titleEn="Pricing — Question Paper Generator" wide className="ev-qpg-theme">
      <AlertBox tone="info">
        {data.priceClaimBn} — প্রতিটি মূল্য Eproshnobank-এর সমতুল্য মূল্যের ৩০% (নিকটতম ৳১০-এ গোল করা)।
        কাটা দামটি Eproshnobank-এর মূল্য — আমাদের আগের দাম নয়। ফ্রি টিয়ার আপাতত থাকছে।
      </AlertBox>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginTop: 16 }}>
        <Card>
          <h2 style={{ margin: '0 0 4px', fontSize: 17 }}>ফ্রি</h2>
          <p style={{ fontSize: 22, fontWeight: 700, margin: '0 0 8px' }}>৳০</p>
          <p style={{ fontSize: 14, lineHeight: 1.7, margin: 0 }}>
            প্রতি মাসে {data.freeMonthlyLimit}টি পেপার • জলছাপসহ (watermarked) PDF • পেপারের সব লেখা বদলানো
            যায় • অধ্যায়ভিত্তিক প্রশ্নপত্র
          </p>
        </Card>
        <Card>
          <h2 style={{ margin: '0 0 4px', fontSize: 17 }}>Single Paper</h2>
          <p style={{ fontSize: 22, fontWeight: 700, margin: '0 0 8px' }}>৳{data.proPerPaperBdt}</p>
          <p style={{ fontSize: 14, lineHeight: 1.7, margin: 0 }}>
            একটি পেপারের জন্য — জলছাপ ছাড়া পরিষ্কার PDF • প্রতিষ্ঠানের লোগো • Answer Key শিট
          </p>
        </Card>
        <Card>
          <h2 style={{ margin: '0 0 4px', fontSize: 17 }}>Teacher Monthly</h2>
          <p style={{ fontSize: 22, fontWeight: 700, margin: '0 0 8px' }}>৳{data.proMonthlyBdt}/মাস</p>
          <p style={{ fontSize: 14, lineHeight: 1.7, margin: 0 }}>
            আনলিমিটেড পেপার • জলছাপ ছাড়া PDF • লোগো • Answer Key শিট • লেআউট (ফন্ট/কলাম/স্পেসিং)
          </p>
        </Card>
        <Card>
          <h2 style={{ margin: '0 0 4px', fontSize: 17 }}>কাস্টম প্রশ্নপত্র — আমরা বানিয়ে দিই</h2>
          <p style={{ fontSize: 14, lineHeight: 1.7, margin: '0 0 8px' }}>
            <s style={{ color: '#888' }}>
              Eproshnobank-এর মূল্য ৳{QPG_CUSTOM_PAPER_THEIR_MIN_BDT}–{QPG_CUSTOM_PAPER_THEIR_MAX_BDT}
            </s>{' '}
            <Chip tone="gold">{QPG_PRICE_CLAIM_BN}</Chip>
          </p>
          <p style={{ fontSize: 22, fontWeight: 700, margin: '0 0 8px' }}>৳{QPG_CUSTOM_PAPER_BDT}/পেপার</p>
          <p style={{ fontSize: 14, lineHeight: 1.7, margin: '0 0 12px' }}>
            নম্বর বণ্টন + যা যা লাগবে লিখে WhatsApp-এ অর্ডার করুন — আমরা হাতে বানিয়ে PDF পাঠিয়ে দিই।
          </p>
          <LinkButton to="/custom-paper">অর্ডার করুন</LinkButton>
        </Card>
      </div>

      <TierTable titleBn="প্রতি ক্লাস বার্ষিক — সব বিষয় (১ বছর)" tiers={byGroup('per-class')} />
      <TierTable titleBn="প্রতি বিষয় (৬ষ্ঠ শ্রেণি+)" tiers={byGroup('per-subject')} />
      <TierTable titleBn="বান্ডেল — সব বিষয় (১ বছর)" tiers={byGroup('bundle')} />
      <TierTable titleBn="কোচিং / প্রতিষ্ঠান — সব বিষয় (১ বছর)" tiers={byGroup('coaching')} />

      <p style={{ fontSize: 14, marginTop: 16 }}>
        পেমেন্ট: bKash / Nagad (TrxID) — Pro আপগ্রেড এখন পর্যালোচনাধীন, ফ্রি ডাউনলোড আজই ব্যবহার করা যাবে।
      </p>
      <Card style={{ marginTop: 16 }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 17 }}>পেমেন্টের পর WhatsApp-এ জানান</h2>
        <p style={{ fontSize: 14, lineHeight: 1.7, margin: '0 0 8px' }}>
          পেমেন্ট করার পর WhatsApp-এ ({QPG_WHATSAPP_USERNAME}) আপনার TrxID + পাঠানো bKash/Nagad নম্বরের শেষ ৩
          সংখ্যা পাঠান — তাহলে Pro দ্রুত সক্রিয় করা হবে। কোনো সমস্যা হলে একই WhatsApp-এ যোগাযোগ করুন। অন-সাইট
          TrxID ফর্মটিই অর্ডারের রেকর্ড থাকবে; WhatsApp হলো নিশ্চিতকরণ ও সাপোর্টের মাধ্যম।
        </p>
        <a
          href={data.whatsappUrl}
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'inline-block',
            padding: '10px 18px',
            borderRadius: 8,
            background: '#128c4a',
            color: '#fff',
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          WhatsApp-এ মেসেজ করুন — {QPG_WHATSAPP_USERNAME}
        </a>
      </Card>
      <LinkButton to="/question-paper-generator">প্রশ্নপত্র তৈরি শুরু করুন — ফ্রি</LinkButton>
    </PageShell>
  );
}
