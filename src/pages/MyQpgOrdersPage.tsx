// Eduvelto — Question Paper Generator Phase 2: My Orders.
//
// Route: /my-orders (signed-in). The buyer's own Pro orders
// (qpgProOrders) + custom-paper orders (qpgCustomOrders) with their
// status, plus the current derived Pro status. No admin powers here —
// the buyer only ever reads their own rows (the rules enforce it).

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { AlertBox, Card } from '../components/ui';
import { useAuth } from '../lib/auth';
import { db } from '../firebase';
import { qpgPriceTierById, type QpgProPlan } from '../lib/questionPaper';
import {
  loadCachedProStatus,
  loadMyQpgCustomOrders,
  loadMyQpgProOrders,
  type QpgCustomOrderRow,
  type QpgProOrderRow,
} from '../lib/qpgFirestore';
import { QPG_PRO_LOCKED, type QpgProStatus } from '../lib/qpgProOrders';
import { QPG_CUSTOM_ORDER_STATUSES } from '../lib/qpgCustomOrders';

const PRO_STATUS_BN: Record<QpgProOrderRow['status'], string> = {
  'pending-review': 'পর্যালোচনাধীন',
  approved: 'অনুমোদিত',
  rejected: 'বাতিল',
};

function planLabel(plan: QpgProPlan): string {
  if (plan === 'per-paper') return 'প্রতি পেপার';
  if (plan === 'monthly') return 'মাসিক';
  return qpgPriceTierById(plan)?.nameBn ?? plan;
}

export default function MyQpgOrdersPage() {
  const { user } = useAuth();
  const uid = user?.uid ?? 'guest';
  const isGuest = uid === 'guest';
  const [proStatus, setProStatus] = useState<QpgProStatus>(QPG_PRO_LOCKED);
  const [proOrders, setProOrders] = useState<QpgProOrderRow[] | null>(null);
  const [customOrders, setCustomOrders] = useState<QpgCustomOrderRow[] | null>(null);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (isGuest || !db) return;
    let alive = true;
    void loadCachedProStatus(db, uid)
      .then((s) => {
        if (alive) setProStatus(s);
      })
      .catch(() => undefined);
    void loadMyQpgProOrders(db, uid)
      .then((rows) => {
        if (alive) setProOrders(rows);
      })
      .catch((err) => {
        if (alive) setLoadError(err instanceof Error ? err.message : 'অর্ডার আনা যায়নি।');
      });
    void loadMyQpgCustomOrders(db, uid)
      .then((rows) => {
        if (alive) setCustomOrders(rows);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [isGuest, uid]);

  return (
    <PageShell titleBn="আমার অর্ডার" titleEn="My Orders" wide className="ev-qpg-theme">
      {isGuest ? (
        <AlertBox tone="info">
          অর্ডার দেখতে <Link to="/login">লগইন করুন</Link>।
        </AlertBox>
      ) : (
        <>
          <Card style={{ marginBottom: 16 }}>
            <h2 style={{ margin: '0 0 8px', fontSize: 16 }}>Pro অবস্থা</h2>
            {proStatus.proUnlocked ? (
              <p style={{ fontSize: 13, margin: 0 }}>
                Pro সক্রিয় আছে
                {proStatus.plan ? ` — ${planLabel(proStatus.plan)}` : ''}
                {proStatus.plan === 'per-paper'
                  ? ` — একক পেপার ক্রেডিট বাকি ${proStatus.singlePaperCredits}টি।`
                  : proStatus.expiresAt
                    ? ` — মেয়াদ ${new Date(proStatus.expiresAt).toLocaleDateString('bn-BD')}.`
                    : '।'}
              </p>
            ) : (
              <p style={{ fontSize: 13, margin: '0 0 10px' }}>
                Pro সক্রিয় নেই। Pro নিতে জেনারেটরের ডাউনলোড ডায়ালগে TrxID জমা দিন, অথবা{' '}
                <Link to="/pricing">মূল্য তালিকা</Link> দেখুন।
              </p>
            )}
          </Card>

          {loadError ? <AlertBox tone="error">{loadError}</AlertBox> : null}

          <Card style={{ marginBottom: 16 }}>
            <h2 style={{ margin: '0 0 8px', fontSize: 16 }}>Pro অর্ডার</h2>
            {proOrders === null ? (
              <p style={{ fontSize: 13 }}>অর্ডার আনা হচ্ছে…</p>
            ) : proOrders.length === 0 ? (
              <p style={{ fontSize: 13, margin: 0 }}>এখনো কোনো Pro অর্ডার নেই।</p>
            ) : (
              proOrders.map((o) => (
                <div key={o.id} style={{ borderTop: '1px solid #eee', padding: '10px 0' }}>
                  <p style={{ fontSize: 13, margin: '0 0 4px' }}>
                    {planLabel(o.plan)} — ৳{o.amountBdt} ({o.paymentMethod === 'bkash' ? 'bKash' : 'Nagad'})
                    {' — '}
                    {PRO_STATUS_BN[o.status]}
                  </p>
                  <p style={{ fontSize: 12, color: '#666', margin: 0 }}>
                    TrxID: {o.trxId} · শেষ ৩ সংখ্যা: {o.senderLast3} · জমা: {new Date(o.createdAt).toLocaleDateString('bn-BD')}
                    {o.status === 'rejected' && o.decisionNote ? ` · কারণ: ${o.decisionNote}` : ''}
                    {o.status === 'approved' && o.proEnd ? ` · মেয়াদ: ${new Date(o.proEnd).toLocaleDateString('bn-BD')}` : ''}
                    {o.status === 'approved' && typeof o.remainingUses === 'number' ? ` · ক্রেডিট বাকি: ${o.remainingUses}` : ''}
                  </p>
                </div>
              ))
            )}
          </Card>

          <Card style={{ marginBottom: 16 }}>
            <h2 style={{ margin: '0 0 8px', fontSize: 16 }}>কাস্টম পেপার অর্ডার</h2>
            {customOrders === null ? (
              <p style={{ fontSize: 13 }}>অর্ডার আনা হচ্ছে…</p>
            ) : customOrders.length === 0 ? (
              <p style={{ fontSize: 13, margin: '0 0 10px' }}>
                এখনো কোনো কাস্টম পেপার অর্ডার নেই।{' '}
                <Link to="/custom-paper">কাস্টম পেপার অর্ডার করুন (৳৪৯)</Link>
              </p>
            ) : (
              customOrders.map((o) => (
                <div key={o.id} style={{ borderTop: '1px solid #eee', padding: '10px 0' }}>
                  <p style={{ fontSize: 13, margin: '0 0 4px' }}>
                    {o.examTitle || `${o.className} — ${o.subject}`} — ৳{o.priceBdt} —{' '}
                    {QPG_CUSTOM_ORDER_STATUSES.find((s) => s.id === o.status)?.nameBn ?? o.status}
                  </p>
                  <p style={{ fontSize: 12, color: '#666', margin: 0 }}>
                    মোট নম্বর: {o.totalMarks} · প্রয়োজন: {o.dateNeeded} · জমা:{' '}
                    {new Date(o.submittedAt).toLocaleDateString('bn-BD')}
                    {o.status === 'delivered' && o.deliveredAt ? ` · ডেলিভারি: ${new Date(o.deliveredAt).toLocaleDateString('bn-BD')}` : ''}
                  </p>
                </div>
              ))
            )}
          </Card>
          <p style={{ fontSize: 13 }}>
            <Link to="/question-paper-generator">← প্রশ্নপত্র জেনারেটর</Link>
          </p>
        </>
      )}
    </PageShell>
  );
}
