// Eduvelto — Question Paper Generator: download dialog.
//
// Shown when the teacher clicks "Generate Question Paper" (i.e. at
// download time, for a GENERATED PAPER ONLY — never a full-bank
// download; no code path here can download the question bank).
//
//   Option 1 — Download Free (With Eduvelto Watermark), ৳0:
//     rasterized canvas PDF, diagonal eduvelto.com watermark,
//     "Powered by Eduvelto.com" inside the question border. Counts
//     against the 3/month free quota (demo: local stand-in).
//   Option 2 — Download Without Eduvelto Watermark (Pro):
//     ৳49 per paper OR ৳199/month OR class-based annual from ৳150 —
//     PRICING FINAL (owner 25 Nov 09:34): every price is 30% of
//     Eproshnobank's equivalent (৭০% ছাড়ে). Clean PDF + institution
//     logo + optional Answer Key sheet.
//     LOCKED in the MVP: the upgrade prompt + TrxID form are present,
//     but submit is DISABLED with an honest note — payment
//     verification activates after review. NO live Firestore writes.

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertBox, Button, Card } from './ui';
import {
  QPG_CHEAPEST_ANNUAL_BDT,
  QPG_PAYMENT_NUMBER,
  QPG_PRICE_CLAIM_BN,
  QPG_PRICE_TIERS,
  QPG_PRO_MONTHLY_BDT,
  QPG_PRO_PER_PAPER_BDT,
  QPG_PRO_PLAN_AMOUNTS,
  QPG_WHATSAPP_URL,
  QPG_WHATSAPP_USERNAME,
  qpgPriceTierById,
  type QpgPaper,
  type QpgPriceTier,
} from '../lib/questionPaper';
import {
  getDemoUsage,
  recordDemoFreeDownload,
  type QpgProPlan,
} from '../lib/questionPaperUsage';
import { downloadWatermarkedPaperPdf } from '../lib/questionPaperPdf';
import { downloadCleanPaperDocx } from '../lib/questionPaperDocx';

export function QuestionPaperDownloadDialog(props: {
  paper: QpgPaper;
  /** Signed-in uid, or 'guest' when signed out (demo quota key). */
  uid: string;
  /** Attach the printable OMR Bubble Sheet — free toggle (owner
   *  25 Nov 09:43): watermarked on free papers, clean on Pro papers. */
  includeOmrSheet?: boolean;
  onClose: () => void;
}) {
  const [usage, setUsage] = useState(() => getDemoUsage(props.uid));
  const [downloading, setDownloading] = useState(false);
  const [freeDone, setFreeDone] = useState(false);
  const [freeError, setFreeError] = useState('');
  const [plan, setPlan] = useState<QpgProPlan>('monthly');
  const [method, setMethod] = useState<'bkash' | 'nagad'>('bkash');
  const [trxId, setTrxId] = useState('');
  const [docxError, setDocxError] = useState('');
  /** MVP lock: Pro is not live — nothing passes proUnlocked=true.
   *  The Word (.docx) button below stays disabled until payment
   *  verification goes live; the handler is wired so flipping this
   *  flag is the only change needed then. */
  const proUnlocked = false;

  const onDocxDownload = async () => {
    setDocxError('');
    try {
      await downloadCleanPaperDocx(props.paper, { proUnlocked, includeAnswerKey: false });
    } catch (err) {
      setDocxError(err instanceof Error ? err.message : 'Word ডাউনলোড করা যায়নি।');
    }
  };

  const planPrice = QPG_PRO_PLAN_AMOUNTS[plan];
  const planLabel =
    plan === 'per-paper'
      ? `প্রতি পেপার ৳${QPG_PRO_PER_PAPER_BDT}`
      : plan === 'monthly'
        ? `মাসিক ৳${QPG_PRO_MONTHLY_BDT}`
        : (qpgPriceTierById(plan)?.nameBn ?? plan);

  const onFreeDownload = async () => {
    setFreeError('');
    setDownloading(true);
    try {
      const rec = recordDemoFreeDownload(props.uid);
      if (!rec.allowed) {
        setUsage(rec.usage);
        setFreeError(`এই মাসের ${rec.usage.limit}টি ফ্রি পেপার শেষ — Pro নিলে আনলিমিটেড ডাউনলোড করা যাবে।`);
        return;
      }
      await downloadWatermarkedPaperPdf(props.paper, { includeOmrSheet: props.includeOmrSheet });
      setUsage(rec.usage);
      setFreeDone(true);
    } catch (err) {
      setFreeError(`PDF তৈরি করা যায়নি: ${err instanceof Error ? err.message : 'অজানা ত্রুটি'}`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-label="প্রশ্নপত্র ডাউনলোড"
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(0,0,0,0.55)', display: 'flex',
        alignItems: 'flex-start', justifyContent: 'center',
        overflowY: 'auto', padding: '24px 12px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) props.onClose();
      }}
    >
      <div style={{ background: '#fff', borderRadius: 12, maxWidth: 640, width: '100%', padding: 20 }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 20 }}>প্রশ্নপত্র ডাউনলোড</h2>
        <p style={{ margin: '0 0 16px', fontSize: 13, color: '#555' }}>
          শুধু এই তৈরি করা পেপারটি ডাউনলোড করা যায় — পুরো প্রশ্ন ব্যাংক ডাউনলোড করা যায় না।
        </p>

        {/* Option 1 — Free, watermarked */}
        <Card style={{ marginBottom: 16 }}>
          <h3 style={{ margin: '0 0 6px', fontSize: 16 }}>
            Download Free (With Eduvelto Watermark) — ৳০
          </h3>
          <p style={{ margin: '0 0 8px', fontSize: 13, color: '#444' }}>
            জলছাপসহ (watermarked) র‍্যাস্টার PDF — প্রতি পাতায় eduvelto.com জলছাপ, প্রশ্নের বাক্সের ভেতরে
            “Powered by Eduvelto.com” লেখা। PDF-এর লেখা সিলেক্ট/এডিট করা যায় না।
            {props.includeOmrSheet
              ? ' OMR Bubble Sheet সংযুক্ত আছে — জলছাপসহ (ফ্রি পেপারের নিয়মে)। OMR যাচাই সম্পূর্ণ ফ্রি।'
              : ''}
          </p>
          <p style={{ margin: '0 0 10px', fontSize: 13 }}>
            ফ্রি কোটা (ডেমো, স্থানীয়): এই মাসে ব্যবহার {usage.used}/{usage.limit} — বাকি {usage.remaining}টি
          </p>
          {freeError ? <AlertBox tone="error">{freeError}</AlertBox> : null}
          {freeDone ? (
            <AlertBox tone="ok">ফ্রি PDF ডাউনলোড হয়েছে। কোটা: {usage.used}/{usage.limit} ব্যবহৃত।</AlertBox>
          ) : (
            <Button onClick={() => void onFreeDownload()} disabled={downloading || usage.remaining <= 0}>
              {downloading ? 'PDF তৈরি হচ্ছে…' : 'Download Free (With Eduvelto Watermark)'}
            </Button>
          )}
          {usage.remaining <= 0 && !freeDone ? (
            <p style={{ fontSize: 13, color: '#a33', margin: '8px 0 0' }}>
              এই মাসের {usage.limit}টি ফ্রি পেপার শেষ। Pro নিলে আনলিমিটেড ডাউনলোড করা যাবে।
            </p>
          ) : null}
        </Card>

        {/* Option 2 — Pro, locked in the MVP */}
        <Card>
          <h3 style={{ margin: '0 0 6px', fontSize: 16 }}>
            Download Without Eduvelto Watermark (Pro) 🔒
          </h3>
          <p style={{ margin: '0 0 8px', fontSize: 13, color: '#444' }}>
            জলছাপ ছাড়া পরিষ্কার PDF — প্রতিষ্ঠানের নিজস্ব লোগো, ঐচ্ছিক Answer Key শিট। মূল্য: প্রতি পেপার ৳
            {QPG_PRO_PER_PAPER_BDT} অথবা ৳{QPG_PRO_MONTHLY_BDT}/মাস অথবা ক্লাসভিত্তিক বার্ষিক ৳
            {QPG_CHEAPEST_ANNUAL_BDT} থেকে — {QPG_PRICE_CLAIM_BN}।{' '}
            <Link to="/pricing">সম্পূর্ণ মূল্য তালিকা দেখুন</Link>
          </p>
          <p style={{ margin: '0 0 8px', fontSize: 13, color: '#444' }}>
            Pro-তে আরও আছে: ফন্ট / কলাম / স্পেসিং / ডিভাইডার স্টাইল, কাস্টম লোগো আপলোড, এডিটেবল লেআউট,
            এক ক্লিকে Answer Key শিট, Word (.docx) ডাউনলোড। OMR Bubble Sheet পেপারের টিয়ার অনুযায়ী আসে —
            ফ্রি পেপারে জলছাপসহ, Pro পেপারে পরিষ্কার; OMR যাচাই (স্কোর করা) সম্পূর্ণ ফ্রি, কোনো Pro লাগে না।
          </p>
          <AlertBox tone="info">
            Pro এখনো চালু হয়নি (MVP ডেমো)। নিচের ফর্মটি দেখানো হয়েছে, কিন্তু জমা দেওয়া বন্ধ আছে — পেমেন্ট
            যাচাই পর্যালোচনার পরে সক্রিয় হয়।
          </AlertBox>
          <fieldset disabled style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12, marginTop: 12 }}>
            <legend style={{ fontSize: 13, fontWeight: 700 }}>Pro আপগ্রেড — bKash / Nagad TrxID</legend>
            <p style={{ fontSize: 13, margin: '0 0 8px' }}>
              পেমেন্ট নম্বর (শুধু এই ধাপে দেখানো হয়): <strong>{QPG_PAYMENT_NUMBER}</strong> (bKash / Nagad)
            </p>
            <label style={{ fontSize: 13, display: 'block', marginBottom: 10 }}>
              প্ল্যান
              <select
                value={plan}
                onChange={(e) => setPlan(e.target.value as QpgProPlan)}
                style={{ display: 'block', width: '100%', marginTop: 4, padding: 8, boxSizing: 'border-box' }}
              >
                <optgroup label="একক / মাসিক">
                  <option value="per-paper">প্রতি পেপার — ৳{QPG_PRO_PER_PAPER_BDT}</option>
                  <option value="monthly">মাসিক — ৳{QPG_PRO_MONTHLY_BDT}</option>
                </optgroup>
                {(
                  [
                    ['per-class', 'প্রতি ক্লাস বার্ষিক — সব বিষয়'],
                    ['per-subject', 'প্রতি বিষয়'],
                    ['bundle', 'বান্ডেল — সব বিষয় (১ বছর)'],
                    ['coaching', 'কোচিং / প্রতিষ্ঠান — সব বিষয় (১ বছর)'],
                  ] as Array<[QpgPriceTier['group'], string]>
                ).map(([group, label]) => (
                  <optgroup key={group} label={label}>
                    {QPG_PRICE_TIERS.filter((t) => t.group === group).map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nameBn} — ৳{t.eduveltoBdt}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
              {(['bkash', 'nagad'] as const).map((m) => (
                <label key={m} style={{ fontSize: 13 }}>
                  <input
                    type="radio"
                    name="qpg-method"
                    checked={method === m}
                    onChange={() => setMethod(m)}
                  />{' '}
                  {m === 'bkash' ? 'bKash' : 'Nagad'}
                </label>
              ))}
            </div>
            <label style={{ fontSize: 13, display: 'block', marginBottom: 10 }}>
              TrxID
              <input
                type="text"
                value={trxId}
                onChange={(e) => setTrxId(e.target.value)}
                placeholder="পেমেন্টের TrxID লিখুন"
                style={{ display: 'block', width: '100%', marginTop: 4, padding: 8, boxSizing: 'border-box' }}
              />
            </label>
            <p style={{ fontSize: 13, margin: '0 0 10px' }}>
              মোট: ৳{planPrice} ({planLabel}) — {method === 'bkash' ? 'bKash' : 'Nagad'} ({QPG_PAYMENT_NUMBER})
            </p>
            <label style={{ fontSize: 13, display: 'block', marginBottom: 10 }}>
              প্রতিষ্ঠানের লোগো আপলোড (Pro) 🔒
              <input type="file" accept="image/*" disabled style={{ display: 'block', marginTop: 4 }} />
            </label>
            <p style={{ fontSize: 12, color: '#666', margin: '0 0 10px' }}>
              Pro-তে লোগো আপলোড করলে ছবিটি ব্রাউজারেই ৫০KB-এর নিচে কম্প্রেস হয়ে শুধু এই সেশনের মেমরিতে
              থাকে — কোনো ফাইল সার্ভারে/স্টোরেজে যায় না।
            </p>
            <Button disabled>
              জমা দিন (বন্ধ আছে — পেমেন্ট যাচাই পর্যালোচনার পরে সক্রিয় হবে)
            </Button>
          </fieldset>
          <div style={{ marginTop: 12 }}>
            <Button disabled={!proUnlocked} onClick={onDocxDownload}>
              Word (.docx) ডাউনলোড (Pro) 🔒 — পর্যালোচনার পরে চালু হবে
            </Button>
            {docxError ? (
              <p style={{ fontSize: 13, color: '#a00', margin: '6px 0 0' }}>{docxError}</p>
            ) : null}
            <p style={{ fontSize: 12, color: '#666', margin: '6px 0 0' }}>
              Pro Word ডাউনলোড: এডিটেবল টেক্সট (.docx) — PDF-এর মতো রাস্টার নয়। পেপার + ঐচ্ছিক Answer Key
              শিট।
            </p>
          </div>
          <div style={{ marginTop: 12, fontSize: 13, lineHeight: 1.7 }}>
            <strong>পেমেন্টের পর WhatsApp-এ জানান:</strong> পেমেন্ট করার পর WhatsApp-এ (
            {QPG_WHATSAPP_USERNAME}) আপনার TrxID + পাঠানো bKash/Nagad নম্বরের শেষ ৩ সংখ্যা পাঠান — তাহলে Pro
            দ্রুত সক্রিয় করা হবে। কোনো সমস্যা হলে একই WhatsApp-এ যোগাযোগ করুন।{' '}
            <a href={QPG_WHATSAPP_URL} target="_blank" rel="noreferrer">
              WhatsApp-এ মেসেজ করুন — {QPG_WHATSAPP_USERNAME}
            </a>
          </div>
        </Card>

        <div style={{ textAlign: 'right', marginTop: 16 }}>
          <Button onClick={props.onClose}>বন্ধ করুন</Button>
        </div>
      </div>
    </div>
  );
}
