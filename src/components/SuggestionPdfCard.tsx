// Eduvelto — ৳149 suggestion-PDF card + order modal (Phase 3
// Commit 3, 25 Nov 2026, feature/ssg-bilingual-support).
//
// Secondary monetization card for Exam Hubs and Book pages.
// The modal accepts a bKash/Nagad TrxID into the `orders`
// collection (signed-in buyers only; the owner fulfils the PDF
// by hand until a delivery flow exists).
//
// ⚠️ UI-ONLY UNTIL VERIFIED CONTENT EXISTS. SUGGESTION_PDF_SALES_ENABLED
// is false: the card shows "শীঘ্রই আসছে" and the order button is
// disabled, because no verified suggestion-PDF content exists
// (library audit: 506 wrong books). No money may move for a PDF
// that does not exist yet. The modal code is complete and tested,
// but unreachable from the UI until the flag flips with verified
// content + the owner's written approval.

import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { loginState } from '../lib/loginReturn';
import { SUPPORT_BKASH_NAGAD_NUMBER } from '../lib/donations';
import {
  ORDER_TRXID_MAX,
  SUGGESTION_PDF_SALES_ENABLED,
  submitOrder,
  type OrderValidationError,
} from '../lib/orders';
import { useAuth } from '../lib/auth';
import { useLanguage } from '../i18n/LanguageContext';
import { AlertBox, Button, Card } from './ui';
import { CopyNumberButton } from './DonationMethods';

const ERROR_TEXT: Record<OrderValidationError, { bn: string; en: string }> = {
  'signin-required': { bn: 'অর্ডার করতে লগইন করুন।', en: 'Please log in to order.' },
  'product-invalid': { bn: 'পণ্যের তথ্য ভুল — আবার চেষ্টা করুন।', en: 'Product details are wrong — please try again.' },
  'amount-invalid': { bn: 'পরিমাণ ভুল — আবার চেষ্টা করুন।', en: 'The amount is wrong — please try again.' },
  'trxid-required': { bn: 'TrxID লিখুন — বিকাশ/নগদ অ্যাপে পাবেন।', en: 'Please enter the TrxID — you will find it in the bKash/Nagad app.' },
  'trxid-too-long': { bn: 'TrxID ৫০ অক্ষরের মধ্যে লিখুন।', en: 'Please keep the TrxID within 50 characters.' },
  'status-invalid': { bn: 'অর্ডারের অবস্থা ভুল — আবার চেষ্টা করুন।', en: 'The order status is wrong — please try again.' },
};

function OrderModal({ onClose }: { onClose: () => void }) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const location = useLocation();
  const back = loginState(location.pathname + location.search);
  const [trxId, setTrxId] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function submit() {
    if (!user) return;
    setStatus('sending');
    setError('');
    const res = await submitOrder(user.uid, trxId);
    if (res.ok) {
      setStatus('sent');
      setTrxId('');
    } else if (res.reason && res.reason in ERROR_TEXT) {
      setError(t(ERROR_TEXT[res.reason as OrderValidationError]));
      setStatus('error');
    } else {
      setError(t({ bn: 'অর্ডার জমা দেওয়া যায়নি — আবার চেষ্টা করুন।', en: 'Could not place the order — please try again.' }));
      setStatus('error');
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t({ bn: 'সাজেশন PDF অর্ডার', en: 'Suggestion PDF order' })}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--surface, #fff)',
          color: 'var(--ink, #1a2b1a)',
          borderRadius: 16,
          padding: '20px 20px 16px',
          maxWidth: 520,
          width: '100%',
          maxHeight: '88vh',
          overflowY: 'auto',
          boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontFamily: "'Poppins','Hind Siliguri',system-ui,sans-serif" }}>
            {t({ bn: 'সাজেশন PDF অর্ডার — ৳১৪৯', en: 'Suggestion PDF order — ৳149' })}
          </h2>
          <button type="button" className="ev-btn ev-btn-sm" aria-label={t({ bn: 'বন্ধ করুন', en: 'Close' })} onClick={onClose}>
            ✕
          </button>
        </div>
        {!user ? (
          <p style={{ lineHeight: 1.7, margin: '14px 0 0' }}>
            {t({ bn: 'অর্ডার করতে', en: 'To order,' })}{' '}
            <Link to="/login" state={back} style={{ fontWeight: 700 }}>
              {t({ bn: 'লগইন করুন', en: 'log in' })}
            </Link>
            {t({ bn: ' — অর্ডার আপনার অ্যাকাউন্টের সঙ্গে যুক্ত থাকে।', en: ' — orders are tied to your account.' })}
          </p>
        ) : status === 'sent' ? (
          <AlertBox tone="ok">
            {t({
              bn: 'ধন্যবাদ! আপনার অর্ডার পৌঁছেছে — যাচাই করে PDF পাঠানো হবে।',
              en: 'Thank you! Your order was received — the PDF will be sent after verification.',
            })}
          </AlertBox>
        ) : (
          <>
            <p style={{ lineHeight: 1.7, margin: '14px 0 6px' }}>
              {t({
                bn: 'বিকাশ বা নগদে ৳১৪৯ Send Money করুন, তারপর TrxID লিখুন।',
                en: 'Send ৳149 via bKash or Nagad (Send Money), then enter the TrxID.',
              })}
            </p>
            <p style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 700 }}>{SUPPORT_BKASH_NAGAD_NUMBER}</p>
            <CopyNumberButton number={SUPPORT_BKASH_NAGAD_NUMBER} />
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void submit();
              }}
              style={{ marginTop: 16 }}
            >
              <label className="ev-label" style={{ display: 'block', marginBottom: 12 }}>
                {t({ bn: 'TrxID *', en: 'TrxID *' })}
                <input
                  type="text"
                  value={trxId}
                  onChange={(e) => setTrxId(e.target.value)}
                  maxLength={ORDER_TRXID_MAX}
                  placeholder={t({ bn: 'যেমন: 9HX7K2M4P1', en: 'e.g. 9HX7K2M4P1' })}
                  className="ev-input"
                  style={{ marginTop: 4 }}
                  required
                />
              </label>
              {status === 'error' && error ? (
                <p role="alert" style={{ color: 'var(--danger, #b3261e)', margin: '0 0 12px' }}>
                  {error}
                </p>
              ) : null}
              <Button type="submit" loading={status === 'sending'}>
                {t({ bn: 'অর্ডার করুন — ৳১৪৯', en: 'Order — ৳149' })}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function SuggestionPdfCard({ examName }: { examName?: string }) {
  const { t } = useLanguage();
  const [modalOpen, setModalOpen] = useState(false);
  const salesOn = SUGGESTION_PDF_SALES_ENABLED;
  return (
    <Card
      data-suggestion-pdf-card
      style={{ marginBottom: 20, borderTop: '4px solid #F1B308' }}
    >
      <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 17 }}>
        {t({
          bn: 'শেষ মুহূর্তের পরীক্ষার সাজেশন ও স্পেশাল মডেল টেস্ট PDF — ৳১৪৯',
          en: 'Download Last-Minute Exam Suggestion & Special Model Test PDF (৳149)',
        })}
      </p>
      {examName ? (
        <p style={{ margin: '0 0 8px', color: 'var(--muted)', fontSize: 14 }}>
          {t({ bn: `${examName}-এর জন্য`, en: `For ${examName}` })}
        </p>
      ) : null}
      <p style={{ margin: '0 0 12px', lineHeight: 1.7, color: 'var(--muted)' }}>
        {salesOn
          ? t({
              bn: 'পরীক্ষার আগের শেষ প্রস্তুতির জন্য সাজেশন ও মডেল টেস্ট — বিকাশ/নগদে পেমেন্ট করে TrxID দিয়ে অর্ডার করুন।',
              en: 'Suggestion and model tests for last-minute exam preparation — pay via bKash/Nagad and order with the TrxID.',
            })
          : t({
              bn: 'শীঘ্রই আসছে — বিষয়বস্তু যাচাই চলছে, তাই এখনো বিক্রি শুরু হয়নি। যাচাই শেষ হলে এখান থেকেই অর্ডার করা যাবে।',
              en: 'Coming soon — content is being verified, so sales have not started yet. You will be able to order from here once verification is done.',
            })}
      </p>
      <Button disabled={!salesOn} onClick={() => setModalOpen(true)}>
        {salesOn
          ? t({ bn: 'অর্ডার করুন — ৳১৪৯', en: 'Order — ৳149' })
          : t({ bn: 'শীঘ্রই আসছে', en: 'Coming soon' })}
      </Button>
      {modalOpen && salesOn ? <OrderModal onClose={() => setModalOpen(false)} /> : null}
    </Card>
  );
}
