// Eduvelto — donation payment-method cards (Phase 3, 25 Nov 2026,
// feature/ssg-bilingual-support).
//
// Used by the Support page and the quick Support modal. bKash and
// Nagad show the owner's real number (+8801754267001) with a
// copy-to-clipboard button; Rocket and Bank Transfer are
// coming-soon placeholders with NO number — they show "শীঘ্রই
// আসছে" and have no copy button, so no number can ever be
// invented for them. Copying is click-only (SSR-safe: no
// navigator access at render time) with a textarea fallback
// where clipboard.writeText is unavailable.

import { useState } from 'react';
import { DONATION_METHODS, type DonationMethod } from '../lib/donations';
import { useLanguage } from '../i18n/LanguageContext';

async function copyText(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to the textarea fallback.
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

/** Copy-to-clipboard button for a payment number (shared by the
 *  Support page/modal and the suggestion-PDF order modal). */
export function CopyNumberButton({ number }: { number: string }) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="ev-btn ev-btn-sm"
      data-copy-number={number}
      onClick={() => {
        void copyText(number).then((ok) => {
          setCopied(ok);
          if (ok) window.setTimeout(() => setCopied(false), 2000);
        });
      }}
    >
      {copied
        ? t({ bn: 'কপি হয়েছে ✓', en: 'Copied ✓' })
        : t({ bn: 'নম্বর কপি করুন', en: 'Copy number' })}
    </button>
  );
}

function MethodCard({ method }: { method: DonationMethod }) {
  const { t } = useLanguage();
  return (
    <div
      data-method={method.id}
      style={{
        border: '1px solid var(--line)',
        borderRadius: 12,
        padding: '14px 16px',
        background: 'var(--teal-soft)',
      }}
    >
      <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 16 }}>
        {t({ bn: method.nameBn, en: method.nameEn })}
      </p>
      {method.comingSoon || !method.number ? (
        <p style={{ margin: '0 0 8px', color: 'var(--muted)', fontSize: 14 }}>
          {t({ bn: 'শীঘ্রই আসছে', en: 'Coming soon' })}
        </p>
      ) : (
        <>
          <p style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, letterSpacing: 0.5 }}>
            {method.number}
          </p>
          <CopyNumberButton number={method.number} />
        </>
      )}
    </div>
  );
}

export default function DonationMethods({ compact = false }: { compact?: boolean }) {
  const { t } = useLanguage();
  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: compact ? '1fr 1fr' : 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 12,
        }}
      >
        {DONATION_METHODS.map((m) => (
          <MethodCard key={m.id} method={m} />
        ))}
      </div>
      <p style={{ margin: '10px 0 0', color: 'var(--muted)', fontSize: 13, lineHeight: 1.6 }}>
        {t({
          bn: 'বিকাশ ও নগদ — একই নম্বর। রকেট ও ব্যাংক ট্রান্সফার শীঘ্রই আসছে।',
          en: 'bKash and Nagad share the same number. Rocket and Bank Transfer are coming soon.',
        })}
      </p>
    </div>
  );
}
