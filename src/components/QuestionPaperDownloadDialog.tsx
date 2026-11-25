// Eduvelto — Question Paper Generator: download dialog.
//
// Shown when the teacher clicks "Generate Question Paper" (i.e. at
// download time, for a GENERATED PAPER ONLY — never a full-bank
// download; no code path here can download the question bank).
//
//   Option 1 — Download Free (With Eduvelto Watermark), ৳0:
//     rasterized canvas PDF, ONE large centered eduvelto.com
//     watermark per page (owner 25 Nov 19:03),
//     "Powered by Eduvelto.com" inside the question border. Counts
//     against the 3/month free quota — Firestore qpgUsage for
//     signed-in users (Phase 2, spec §5), the local demo counter
//     only for guests and as a fallback while the qpg rules are not
//     yet deployed (the fallback is labelled "ডেমো কোটা, স্থানীয়").
//   Option 2 — Download Without Eduvelto Watermark (Pro):
//     ৳49 per paper OR ৳199/month OR class-based annual from ৳150 —
//     PRICING FINAL (owner 25 Nov 09:34): every price is 30% of the
//     reference price (৭০% ছাড়ে). Clean PDF + institution logo +
//     optional Answer Key sheet + Word (.docx).
//     Phase 2: the TrxID form SUBMITS to qpgProOrders (pending-review)
//     — the admin reviews the TrxID manually and approves/rejects;
//     approval unlocks Pro (single-paper credit, monthly 30 days,
//     annual 365 days, tier-scoped). The rules are in firestore.rules
//     but NOT deployed yet — until the owner approves the rules deploy
//     (§8.6), a submit fails with permission-denied and the dialog
//     says so honestly and points to WhatsApp instead of pretending
//     the order went through. NO time promise is shown anywhere
//     (turnaround proposal 12h, §8.2, undecided).
//
// A single-paper credit is consumed ONCE per paper: the first clean
// export (PDF or DOCX) in this dialog decrements remainingUses; later
// clean exports of the same paper in the same dialog do not. (A
// reopened dialog re-derives the status — the credit is already spent.)

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertBox, Button, Card } from './ui';
import { db } from '../firebase';
import {
  QPG_CHEAPEST_ANNUAL_BDT,
  QPG_FREE_MONTHLY_LIMIT,
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
import {
  buildQpgProOrder,
  QPG_PRO_LOCKED,
  validateQpgProOrderSubmission,
  type QpgProStatus,
} from '../lib/qpgProOrders';
import {
  clearCachedProStatus,
  decrementSinglePaperCredit,
  getQpgUsage,
  loadCachedProStatus,
  loadQpgProStatus,
  recordQpgFreeDownload,
  submitQpgProOrder,
} from '../lib/qpgFirestore';
import { downloadCleanPaperPdf, downloadWatermarkedPaperPdf } from '../lib/questionPaperPdf';
import { downloadCleanPaperDocx } from '../lib/questionPaperDocx';

interface QpgUsageView {
  used: number;
  limit: number;
  remaining: number;
}

export function QuestionPaperDownloadDialog(props: {
  paper: QpgPaper;
  /** Signed-in uid, or 'guest' when signed out (demo quota key). */
  uid: string;
  /** Attach the printable OMR Bubble Sheet — free toggle (owner
   *  25 Nov 09:43): watermarked on free papers, clean on Pro papers. */
  includeOmrSheet?: boolean;
  /** Pro status loaded by the parent (one query per session). When
   *  absent and the user is signed in, the dialog loads it itself
   *  (sessionStorage-cached). */
  proStatus?: QpgProStatus | null;
  onClose: () => void;
}) {
  const isGuest = props.uid === 'guest';
  const [usage, setUsage] = useState<QpgUsageView>(() => getDemoUsage(props.uid));
  /** 'firestore' once the real qpgUsage doc has been read; 'demo'
   *  for guests and while the qpg rules are not yet deployed (the
   *  local counter then enforces the quota, labelled honestly). */
  const [usageSource, setUsageSource] = useState<'firestore' | 'demo'>('demo');
  const [downloading, setDownloading] = useState(false);
  const [freeDone, setFreeDone] = useState(false);
  const [freeError, setFreeError] = useState('');
  const [proStatus, setProStatus] = useState<QpgProStatus>(props.proStatus ?? QPG_PRO_LOCKED);
  const [cleanBusy, setCleanBusy] = useState(false);
  const [cleanError, setCleanError] = useState('');
  const [cleanNote, setCleanNote] = useState('');
  /** True once this paper's single-paper credit was spent in this dialog. */
  const [creditSpent, setCreditSpent] = useState(false);
  const [plan, setPlan] = useState<QpgProPlan>('monthly');
  const [method, setMethod] = useState<'bkash' | 'nagad'>('bkash');
  const [trxId, setTrxId] = useState('');
  const [senderLast3, setSenderLast3] = useState('');
  const [senderWhatsapp, setSenderWhatsapp] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitDone, setSubmitDone] = useState(false);

  const proUnlocked = proStatus.proUnlocked;

  // Signed-in users: read the real Firestore quota + Pro status.
  // Any Firestore failure (rules not deployed yet) keeps the demo
  // counter — the quota still holds locally, labelled honestly.
  useEffect(() => {
    if (props.proStatus) {
      setProStatus(props.proStatus);
    } else if (!isGuest && db) {
      let alive = true;
      void loadCachedProStatus(db, props.uid)
        .then((s) => {
          if (alive) setProStatus(s);
        })
        .catch(() => {
          // Rules not deployed yet — Pro stays locked, honestly.
        });
      return () => {
        alive = false;
      };
    }
  }, [props.proStatus, isGuest, props.uid]);

  useEffect(() => {
    if (isGuest || !db) return;
    let alive = true;
    void getQpgUsage(db, props.uid)
      .then((r) => {
        if (!alive) return;
        setUsage({ used: r.freeDownloads, limit: QPG_FREE_MONTHLY_LIMIT, remaining: Math.max(0, QPG_FREE_MONTHLY_LIMIT - r.freeDownloads) });
        setUsageSource('firestore');
      })
      .catch(() => {
        // Rules not deployed yet — keep the demo counter.
      });
    return () => {
      alive = false;
    };
  }, [isGuest, props.uid]);

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
      // The demo counter returns { allowed, usage }; the Firestore
      // counter returns { allowed, used, remaining, limit } — both
      // are normalised to the same shape here.
      let rec: { allowed: boolean; used: number; remaining: number; limit: number };
      if (isGuest || !db) {
        const demo = recordDemoFreeDownload(props.uid);
        rec = { allowed: demo.allowed, used: demo.usage.used, remaining: demo.usage.remaining, limit: demo.usage.limit };
      } else {
        try {
          rec = await recordQpgFreeDownload(db, props.uid);
          setUsageSource('firestore');
        } catch {
          // Rules not deployed yet — the local counter enforces the
          // quota instead (labelled "ডেমো কোটা, স্থানীয়").
          const demo = recordDemoFreeDownload(props.uid);
          rec = { allowed: demo.allowed, used: demo.usage.used, remaining: demo.usage.remaining, limit: demo.usage.limit };
          setUsageSource('demo');
        }
      }
      if (!rec.allowed) {
        setUsage({ used: rec.used, limit: rec.limit, remaining: rec.remaining });
        setFreeError(`এই মাসের ${rec.limit}টি ফ্রি পেপার শেষ — Pro নিলে আনলিমিটেড ডাউনলোড করা যাবে।`);
        return;
      }
      await downloadWatermarkedPaperPdf(props.paper, {
        includeOmrSheet: props.includeOmrSheet,
        userLabel: props.uid,
      });
      setUsage({ used: rec.used, limit: rec.limit, remaining: rec.remaining });
      setFreeDone(true);
    } catch (err) {
      setFreeError(`PDF তৈরি করা যায়নি: ${err instanceof Error ? err.message : 'অজানা ত্রুটি'}`);
    } finally {
      setDownloading(false);
    }
  };

  /** After a clean export, spend the single-paper credit once per
   *  paper (this dialog). A failed decrement is reported honestly —
   *  the download already happened, so the buyer is told to contact
   *  support rather than silently keeping the credit. */
  const consumeCreditIfNeeded = async () => {
    if (creditSpent) return;
    if (proStatus.plan !== 'per-paper' || !proStatus.orderId) return;
    if (!db) {
      setCleanNote('ক্রেডিট কাটা যায়নি — ডাউনলোড হয়েছে, তবে ক্রেডিটের বিষয়ে WhatsApp-এ জানান।');
      return;
    }
    setCreditSpent(true);
    try {
      await decrementSinglePaperCredit(db, proStatus.orderId);
      clearCachedProStatus();
      const fresh = await loadQpgProStatus(db, props.uid);
      setProStatus(fresh);
      setCleanNote('একক পেপারের ক্রেডিট ব্যবহার হয়েছে।');
    } catch {
      setCleanNote('ক্রেডিট কাটা যায়নি — ডাউনলোড হয়েছে, তবে ক্রেডিটের বিষয়ে WhatsApp-এ জানান।');
    }
  };

  const onCleanPdfDownload = async () => {
    setCleanError('');
    setCleanNote('');
    setCleanBusy(true);
    try {
      await downloadCleanPaperPdf(props.paper, {
        proUnlocked,
        includeAnswerKey: false,
        includeOmrSheet: props.includeOmrSheet,
      });
      await consumeCreditIfNeeded();
    } catch (err) {
      setCleanError(err instanceof Error ? err.message : 'পরিষ্কার PDF ডাউনলোড করা যায়নি।');
    } finally {
      setCleanBusy(false);
    }
  };

  const onDocxDownload = async () => {
    setCleanError('');
    setCleanNote('');
    try {
      await downloadCleanPaperDocx(props.paper, { proUnlocked, includeAnswerKey: false });
      await consumeCreditIfNeeded();
    } catch (err) {
      setCleanError(err instanceof Error ? err.message : 'Word ডাউনলোড করা যায়নি।');
    }
  };

  const onTrxSubmit = async () => {
    setSubmitError('');
    setSubmitting(true);
    try {
      const order = buildQpgProOrder({
        uid: props.uid,
        plan,
        paymentMethod: method,
        trxId,
        senderLast3,
        senderWhatsapp: senderWhatsapp.trim() || undefined,
        couponCode: couponCode.trim() || undefined,
        source: 'onsite',
      });
      const errors = validateQpgProOrderSubmission(order);
      if (errors.length > 0) {
        setSubmitError(errors.join(' '));
        return;
      }
      if (isGuest) {
        setSubmitError('TrxID জমা দিতে লগইন করুন — অর্ডার আপনার অ্যাকাউন্টের সঙ্গে যুক্ত থাকবে।');
        return;
      }
      if (!db) {
        setSubmitError(
          'অর্ডার জমা দেওয়া যায়নি — Pro যাচাই ব্যবস্থা এখনো চালু হয়নি। অনুগ্রহ করে WhatsApp-এ TrxID + পাঠানো নম্বরের শেষ ৩ সংখ্যা পাঠান, তাহলে Pro সক্রিয় করা হবে।',
        );
        return;
      }
      await submitQpgProOrder(db, order);
      setSubmitDone(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (/permission-denied/i.test(msg)) {
        setSubmitError(
          'অর্ডার জমা দেওয়া যায়নি — Pro যাচাই ব্যবস্থা এখনো চালু হয়নি। অনুগ্রহ করে WhatsApp-এ TrxID + পাঠানো নম্বরের শেষ ৩ সংখ্যা পাঠান, তাহলে Pro সক্রিয় করা হবে।',
        );
      } else {
        setSubmitError(`অর্ডার জমা দেওয়া যায়নি: ${msg || 'অজানা ত্রুটি'} — অনুগ্রহ করে WhatsApp-এ জানান।`);
      }
    } finally {
      setSubmitting(false);
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
            ফ্রি কোটা{usageSource === 'demo' ? ' (ডেমো, স্থানীয়)' : ''}: এই মাসে ব্যবহার {usage.used}/{usage.limit} — বাকি {usage.remaining}টি
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

        {/* Option 2 — Pro */}
        <Card>
          <h3 style={{ margin: '0 0 6px', fontSize: 16 }}>
            Download Without Eduvelto Watermark (Pro) {proUnlocked ? '' : '🔒'}
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
          {proUnlocked ? (
            <AlertBox tone="ok">
              Pro সক্রিয় আছে
              {proStatus.plan === 'per-paper'
                ? ` — একক পেপার ক্রেডিট বাকি ${proStatus.singlePaperCredits}টি।`
                : proStatus.expiresAt
                  ? ` — মেয়াদ ${new Date(proStatus.expiresAt).toLocaleDateString('bn-BD')}.`
                  : '।'}
            </AlertBox>
          ) : (
            <AlertBox tone="info">
              নিচের ফর্মে পেমেন্টের TrxID জমা দিন — যাচাইয়ের পর Pro সক্রিয় হবে। যাচাই হাতে করা হয়, তাই
              অনুমোদনের জন্য অপেক্ষা করুন।
            </AlertBox>
          )}
          <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button disabled={!proUnlocked || cleanBusy} onClick={() => void onCleanPdfDownload()}>
              {cleanBusy ? 'PDF তৈরি হচ্ছে…' : 'পরিষ্কার PDF ডাউনলোড (Pro)'}
            </Button>
            <Button disabled={!proUnlocked} onClick={() => void onDocxDownload()}>
              Word (.docx) ডাউনলোড (Pro)
            </Button>
          </div>
          {!proUnlocked ? (
            <p style={{ fontSize: 12, color: '#666', margin: '6px 0 0' }}>
              Pro সক্রিয় থাকলে এই বোতামগুলো চালু হবে।
            </p>
          ) : null}
          {cleanError ? (
            <p style={{ fontSize: 13, color: '#a00', margin: '6px 0 0' }}>{cleanError}</p>
          ) : null}
          {cleanNote ? (
            <p style={{ fontSize: 13, color: '#14532d', margin: '6px 0 0' }}>{cleanNote}</p>
          ) : null}
          <p style={{ fontSize: 12, color: '#666', margin: '6px 0 0' }}>
            Pro Word ডাউনলোড: এডিটেবল টেক্সট (.docx) — PDF-এর মতো রাস্টার নয়। পেপার + ঐচ্ছিক Answer Key
            শিট।
          </p>
          <fieldset style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12, marginTop: 12 }}>
            <legend style={{ fontSize: 13, fontWeight: 700 }}>Pro আপগ্রেড — bKash / Nagad TrxID</legend>
            {submitDone ? (
              <AlertBox tone="ok">
                অর্ডার জমা হয়েছে — যাচাইয়ের পর Pro সক্রিয় হবে। আপনার অর্ডারের অবস্থা{' '}
                <Link to="/my-orders">আমার অর্ডার</Link> পাতায় দেখতে পাবেন।
              </AlertBox>
            ) : (
              <>
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
                  TrxID (১০ অক্ষর)
                  <input
                    type="text"
                    value={trxId}
                    onChange={(e) => setTrxId(e.target.value)}
                    placeholder="পেমেন্টের TrxID লিখুন"
                    style={{ display: 'block', width: '100%', marginTop: 4, padding: 8, boxSizing: 'border-box' }}
                  />
                </label>
                <label style={{ fontSize: 13, display: 'block', marginBottom: 10 }}>
                  পাঠানো নম্বরের শেষ ৩ সংখ্যা
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={3}
                    value={senderLast3}
                    onChange={(e) => setSenderLast3(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))}
                    placeholder="যেমন: 123"
                    style={{ display: 'block', width: '100%', marginTop: 4, padding: 8, boxSizing: 'border-box' }}
                  />
                </label>
                <label style={{ fontSize: 13, display: 'block', marginBottom: 10 }}>
                  আপনার WhatsApp নম্বর (ঐচ্ছিক)
                  <input
                    type="text"
                    value={senderWhatsapp}
                    onChange={(e) => setSenderWhatsapp(e.target.value)}
                    placeholder="যেমন: 01XXXXXXXXX"
                    style={{ display: 'block', width: '100%', marginTop: 4, padding: 8, boxSizing: 'border-box' }}
                  />
                </label>
                <label style={{ fontSize: 13, display: 'block', marginBottom: 10 }}>
                  কুপন কোড (যদি থাকে)
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="অবদানের কুপন কোড"
                    style={{ display: 'block', width: '100%', marginTop: 4, padding: 8, boxSizing: 'border-box' }}
                  />
                </label>
                <p style={{ fontSize: 12, color: '#666', margin: '0 0 10px' }}>
                  কুপন থাকলে যাচাই সাপেক্ষে প্রযোজ্য হবে — ছাড় নিজে থেকে কাটা হয় না।
                </p>
                <p style={{ fontSize: 13, margin: '0 0 10px' }}>
                  মোট: ৳{planPrice} ({planLabel}) — {method === 'bkash' ? 'bKash' : 'Nagad'} ({QPG_PAYMENT_NUMBER})
                </p>
                <label style={{ fontSize: 13, display: 'block', marginBottom: 10 }}>
                  প্রতিষ্ঠানের লোগো আপলোড (Pro) 🔒
                  <input type="file" accept="image/*" disabled={!proUnlocked} style={{ display: 'block', marginTop: 4 }} />
                </label>
                <p style={{ fontSize: 12, color: '#666', margin: '0 0 10px' }}>
                  Pro-তে লোগো আপলোড করলে ছবিটি ব্রাউজারেই ৫০KB-এর নিচে কম্প্রেস হয়ে শুধু এই সেশনের মেমরিতে
                  থাকে — কোনো ফাইল সার্ভারে/স্টোরেজে যায় না।
                </p>
                {submitError ? <AlertBox tone="error">{submitError}</AlertBox> : null}
                <Button onClick={() => void onTrxSubmit()} disabled={submitting}>
                  {submitting ? 'জমা দেওয়া হচ্ছে…' : 'TrxID জমা দিন'}
                </Button>
              </>
            )}
          </fieldset>
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
