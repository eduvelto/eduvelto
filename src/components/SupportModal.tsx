// Eduvelto — "Support Eduvelto" quick modal + button (Phase 3,
// 25 Nov 2026, feature/ssg-bilingual-support).
//
// A prominent gold button (Navbar + Footer) that opens a quick
// donate modal: the payment methods (WhatsApp payment — no number
// shown) and a link to the full /:lang/support page. The modal
// renders nothing while closed (SSR/prerender-safe) and closes on
// Escape, on the overlay click, or on the close button.

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { langUrl } from '../lib/langRouting';
import DonationMethods from './DonationMethods';

export function SupportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, lang } = useLanguage();
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t({ bn: 'Eduvelto-কে সহায়তা করুন', en: 'Support Eduvelto' })}
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
          maxWidth: 560,
          width: '100%',
          maxHeight: '88vh',
          overflowY: 'auto',
          boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontFamily: "'Poppins','Hind Siliguri',system-ui,sans-serif" }}>
            {t({ bn: 'Eduvelto-কে সহায়তা করুন', en: 'Support Eduvelto' })}
          </h2>
          <button
            type="button"
            className="ev-btn ev-btn-sm"
            aria-label={t({ bn: 'বন্ধ করুন', en: 'Close' })}
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <p style={{ margin: '10px 0 14px', lineHeight: 1.7 }}>
          {t({
            bn: 'Eduvelto সম্পূর্ণ বিনামূল্যে — আপনার স্বেচ্ছা সহায়তা ফ্রি শিক্ষা চালিয়ে যেতে সাহায্য করে।',
            en: 'Eduvelto is completely free — your voluntary support helps keep free education going.',
          })}
        </p>
        <DonationMethods compact />
        <p style={{ margin: '16px 0 0' }}>
          <Link to={langUrl('/support', lang)} onClick={onClose} style={{ fontWeight: 700 }}>
            {t({ bn: 'সহায়তার পুরো পৃষ্ঠা দেখুন →', en: 'See the full support page →' })}
          </Link>
        </p>
      </div>
    </div>
  );
}

/** Gold "Support Eduvelto" button + its modal (self-contained state).
 *  Used in the Navbar and the Footer. */
export default function SupportButton() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className="ev-btn ev-btn-sm"
        onClick={() => setOpen(true)}
        style={{ background: '#F1B308', borderColor: '#F1B308', color: '#20242b', fontWeight: 700 }}
      >
        {t({ bn: 'সহায়তা করুন', en: 'Support Eduvelto' })}
      </button>
      <SupportModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
