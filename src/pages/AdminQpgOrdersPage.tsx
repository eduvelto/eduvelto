// Eduvelto — Admin: Question Paper Generator orders (Phase 2).
//
// /admin/qpg-orders — two tabs:
//   (1) Pro orders (TrxID review queue): the admin MANUALLY checks
//       each TrxID in the bKash/Nagad app (amount + sender's last 3
//       digits) and approves/rejects. Approve sets the unlock window
//       (and one credit for a single-paper order); a coupon, when
//       present, is verified first (belongs to the buyer, unused,
//       unexpired) and marked used in the same batch. Reusing a TrxID
//       is rejected — the queue warns on duplicates.
//   (2) Custom-paper orders (delivery workflow): forward-only status
//       steps pending_payment → paid → building → delivered.
//
// Owner-only route (AdminGuard). The rules are the real enforcement;
// this page is the review UI. No time promise is shown to buyers.

import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import { AlertBox, Button, Card } from '../components/ui';
import { AdminBackLink, EmptyAdminBox, LoadingBox, requireDb } from '../components/AdminShared';
import {
  decideQpgProOrder,
  loadContributionByCoupon,
  loadCustomOrderQueue,
  loadMyQpgProOrders,
  loadProOrderReviewQueue,
  updateCustomOrderStatus,
  type QpgCustomOrderRow,
  type QpgProOrderRow,
} from '../lib/qpgFirestore';
import { findDuplicateTrxIdOrders } from '../lib/qpgProOrders';
import { qpgPriceTierById } from '../lib/questionPaper';
import { type QpgProPlan } from '../lib/questionPaperUsage';
import { QPG_CUSTOM_ORDER_STATUSES, type QpgCustomOrderStatus } from '../lib/qpgCustomOrders';
import { friendlyAdminError } from '../lib/admin';

function planLabel(plan: QpgProPlan): string {
  if (plan === 'per-paper') return 'প্রতি পেপার';
  if (plan === 'monthly') return 'মাসিক';
  return qpgPriceTierById(plan)?.nameBn ?? plan;
}

const NEXT_CUSTOM_STATUS: Record<QpgCustomOrderStatus, QpgCustomOrderStatus | null> = {
  pending_payment: 'paid',
  paid: 'building',
  building: 'delivered',
  delivered: null,
};

export default function AdminQpgOrdersPage() {
  const { user } = useAuth();
  const uid = user?.uid ?? '';
  const [tab, setTab] = useState<'pro' | 'custom'>('pro');
  const [orders, setOrders] = useState<QpgProOrderRow[] | null>(null);
  const [customOrders, setCustomOrders] = useState<QpgCustomOrderRow[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [note, setNote] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [doneMsg, setDoneMsg] = useState<string | null>(null);
  // Per-order verification results (TrxID duplicates + coupon check).
  const [verifyResult, setVerifyResult] = useState<Record<string, string>>({});
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const reload = async () => {
    setOrders(null);
    setCustomOrders(null);
    setLoadError(false);
    try {
      const [pro, custom] = await Promise.all([loadProOrderReviewQueue(requireDb()), loadCustomOrderQueue(requireDb())]);
      setOrders(pro);
      setCustomOrders(custom);
    } catch {
      setLoadError(true);
    }
  };

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const [pro, custom] = await Promise.all([loadProOrderReviewQueue(requireDb()), loadCustomOrderQueue(requireDb())]);
        if (alive) {
          setOrders(pro);
          setCustomOrders(custom);
        }
      } catch {
        if (alive) setLoadError(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const verifyOrder = async (order: QpgProOrderRow) => {
    setVerifyingId(order.id);
    setVerifyResult((prev) => ({ ...prev, [order.id]: '' }));
    try {
      const parts: string[] = [];
      // Duplicate TrxID: the buyer's own history + the visible queue.
      const buyerOrders = await loadMyQpgProOrders(requireDb(), order.uid);
      const dups = findDuplicateTrxIdOrders([...buyerOrders, ...(orders ?? [])], order.trxId, order.id);
      if (dups.length > 0) {
        parts.push(`⚠ একই TrxID আরও ${dups.length}টি অর্ডারে আছে — যাচাই না করে অনুমোদন করবেন না।`);
      } else {
        parts.push('TrxID: এই ক্রেতার অন্য কোনো অর্ডারে একই TrxID নেই।');
      }
      if (order.couponCode) {
        const c = await loadContributionByCoupon(requireDb(), order.couponCode);
        if (!c) parts.push(`কুপন ${order.couponCode}: এমন কোনো কুপন পাওয়া যায়নি।`);
        else if (c.contributorUid !== order.uid) parts.push(`কুপন ${order.couponCode}: এটি অন্য ক্রেতার কুপন।`);
        else if (c.couponUsedAt) parts.push(`কুপন ${order.couponCode}: ইতিমধ্যে ব্যবহৃত হয়েছে।`);
        else if (c.couponExpiresAt && new Date(c.couponExpiresAt) < new Date()) parts.push(`কুপন ${order.couponCode}: মেয়াদ শেষ।`);
        else parts.push(`কুপন ${order.couponCode}: বৈধ (অবদান ${c.id.slice(0, 8)}…, ${c.pointsAwarded ?? 0} পয়েন্ট)।`);
      }
      setVerifyResult((prev) => ({ ...prev, [order.id]: parts.join(' ') }));
    } catch (err) {
      setVerifyResult((prev) => ({ ...prev, [order.id]: friendlyAdminError(err) }));
    } finally {
      setVerifyingId(null);
    }
  };

  const decide = async (order: QpgProOrderRow, decision: 'approved' | 'rejected') => {
    const decisionNote = (note[order.id] ?? '').trim();
    if (decisionNote.length < 10) {
      setError('সিদ্ধান্তের কারণ কমপক্ষে ১০ অক্ষর লিখুন।');
      return;
    }
    if (decision === 'approved') {
      const dups = findDuplicateTrxIdOrders(orders ?? [], order.trxId, order.id);
      if (dups.length > 0) {
        setError('একই TrxID অন্য অর্ডারে আছে — আগে যাচাই করুন, তারপর অনুমোদন দিন।');
        return;
      }
    }
    setBusyId(order.id);
    setError(null);
    setDoneMsg(null);
    try {
      let couponContributionId: string | undefined;
      if (decision === 'approved' && order.couponCode) {
        const c = await loadContributionByCoupon(requireDb(), order.couponCode);
        if (c && c.contributorUid === order.uid && !c.couponUsedAt && (!c.couponExpiresAt || new Date(c.couponExpiresAt) >= new Date())) {
          couponContributionId = c.id;
        }
      }
      await decideQpgProOrder(requireDb(), {
        orderId: order.id,
        adminUid: uid,
        decision,
        decisionNote,
        couponContributionId,
      });
      setDoneMsg(decision === 'approved' ? 'অর্ডার অনুমোদিত — Pro সক্রিয় হয়েছে।' : 'অর্ডার বাতিল হয়েছে।');
      await reload();
    } catch (err) {
      setError(friendlyAdminError(err));
    } finally {
      setBusyId(null);
    }
  };

  const advanceCustom = async (order: QpgCustomOrderRow) => {
    const next = NEXT_CUSTOM_STATUS[order.status];
    if (!next) return;
    setBusyId(order.id);
    setError(null);
    setDoneMsg(null);
    try {
      await updateCustomOrderStatus(requireDb(), { orderId: order.id, to: next, adminUid: uid });
      setDoneMsg(`কাস্টম অর্ডার ${QPG_CUSTOM_ORDER_STATUSES.find((s) => s.id === next)?.nameBn ?? next} হয়েছে।`);
      await reload();
    } catch (err) {
      setError(friendlyAdminError(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="ev-qpg-theme" style={{ padding: '4px 0' }}>
      <AdminBackLink />
      <h1 style={{ fontSize: 22, margin: '8px 0 4px' }}>প্রশ্নপত্র জেনারেটর — অর্ডার</h1>
      <p style={{ fontSize: 13, color: '#555', margin: '0 0 12px' }}>
        TrxID হাতে যাচাই করুন (bKash/Nagad অ্যাপে টাকা + পাঠানো নম্বরের শেষ ৩ সংখ্যা মিলিয়ে) — তারপর অনুমোদন
        দিন। কুপন থাকলে যাচাই ছাড়া অনুমোদন করবেন না।
      </p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <Button variant={tab === 'pro' ? 'primary' : 'outline'} onClick={() => setTab('pro')}>
          Pro অর্ডার {orders ? `(${orders.length})` : ''}
        </Button>
        <Button variant={tab === 'custom' ? 'primary' : 'outline'} onClick={() => setTab('custom')}>
          কাস্টম পেপার {customOrders ? `(${customOrders.length})` : ''}
        </Button>
      </div>
      {error ? <AlertBox tone="error">{error}</AlertBox> : null}
      {doneMsg ? <AlertBox tone="ok">{doneMsg}</AlertBox> : null}
      {loadError ? (
        <AlertBox tone="error">অর্ডার আনা যায়নি — আবার চেষ্টা করুন।</AlertBox>
      ) : tab === 'pro' ? (
        orders === null ? (
          <LoadingBox label="Pro অর্ডার আনা হচ্ছে…" />
        ) : orders.length === 0 ? (
          <EmptyAdminBox bn="পর্যালোচনার অপেক্ষায় কোনো Pro অর্ডার নেই।" en="No Pro orders awaiting review." />
        ) : (
          orders.map((o) => (
            <Card key={o.id} style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 14, margin: '0 0 4px' }}>
                <strong>{planLabel(o.plan)}</strong> — ৳{o.amountBdt} ({o.paymentMethod === 'bkash' ? 'bKash' : 'Nagad'})
                {' · '}
                {o.source === 'whatsapp' ? 'WhatsApp পথে' : 'সাইটের ফর্মে'}
              </p>
              <p style={{ fontSize: 13, margin: '0 0 4px' }}>
                TrxID: <strong>{o.trxId}</strong> · পাঠানো নম্বরের শেষ ৩: <strong>{o.senderLast3}</strong>
                {o.senderWhatsapp ? ` · WhatsApp: ${o.senderWhatsapp}` : ''}
                {o.couponCode ? ` · কুপন: ${o.couponCode}` : ''}
              </p>
              <p style={{ fontSize: 12, color: '#666', margin: '0 0 8px' }}>
                ক্রেতা: {o.uid.slice(0, 8)}… · জমা: {new Date(o.createdAt).toLocaleString('bn-BD')}
              </p>
              {findDuplicateTrxIdOrders(orders, o.trxId, o.id).length > 0 ? (
                <AlertBox tone="error">⚠ এই TrxID এই সারিতেই আরও অর্ডারে আছে — অনুমোদনের আগে যাচাই করুন।</AlertBox>
              ) : null}
              {verifyResult[o.id] ? <AlertBox tone="info">{verifyResult[o.id]}</AlertBox> : null}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                <Button variant="outline" onClick={() => void verifyOrder(o)} disabled={verifyingId === o.id}>
                  {verifyingId === o.id ? 'যাচাই হচ্ছে…' : 'TrxID + কুপন যাচাই'}
                </Button>
              </div>
              <label style={{ fontSize: 13, display: 'block', marginTop: 10 }}>
                সিদ্ধান্তের কারণ (কমপক্ষে ১০ অক্ষর)
                <input
                  type="text"
                  value={note[o.id] ?? ''}
                  onChange={(e) => setNote((prev) => ({ ...prev, [o.id]: e.target.value }))}
                  style={{ display: 'block', width: '100%', marginTop: 4, padding: 8, boxSizing: 'border-box' }}
                />
              </label>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <Button onClick={() => void decide(o, 'approved')} disabled={busyId === o.id}>
                  অনুমোদন করুন
                </Button>
                <Button variant="outline" onClick={() => void decide(o, 'rejected')} disabled={busyId === o.id}>
                  বাতিল করুন
                </Button>
              </div>
            </Card>
          ))
        )
      ) : customOrders === null ? (
        <LoadingBox label="কাস্টম অর্ডার আনা হচ্ছে…" />
      ) : customOrders.length === 0 ? (
        <EmptyAdminBox bn="কোনো কাস্টম পেপার অর্ডার নেই।" en="No custom paper orders." />
      ) : (
        customOrders.map((o) => {
          const next = NEXT_CUSTOM_STATUS[o.status];
          return (
            <Card key={o.id} style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 14, margin: '0 0 4px' }}>
                <strong>{o.examTitle || `${o.className} — ${o.subject}`}</strong> — ৳{o.priceBdt} —{' '}
                {QPG_CUSTOM_ORDER_STATUSES.find((s) => s.id === o.status)?.nameBn ?? o.status}
              </p>
              <p style={{ fontSize: 13, margin: '0 0 4px' }}>
                ক্রেতা: {o.buyerName}
                {o.buyerWhatsapp ? ` (${o.buyerWhatsapp})` : ''} · মোট নম্বর: {o.totalMarks} · প্রয়োজন: {o.dateNeeded}
              </p>
              <p style={{ fontSize: 12, color: '#666', margin: '0 0 8px' }}>
                অধ্যায়: {o.chapters || '—'} · ধরন: {o.questionTypes || '—'}
                {o.instructions ? ` · নির্দেশনা: ${o.instructions}` : ''} · জমা:{' '}
                {new Date(o.submittedAt).toLocaleDateString('bn-BD')}
              </p>
              {next ? (
                <Button onClick={() => void advanceCustom(o)} disabled={busyId === o.id}>
                  → {QPG_CUSTOM_ORDER_STATUSES.find((s) => s.id === next)?.nameBn ?? next}
                </Button>
              ) : (
                <span style={{ fontSize: 13, color: '#14532d' }}>ডেলিভারি সম্পন্ন ✓</span>
              )}
            </Card>
          );
        })
      )}
    </div>
  );
}
