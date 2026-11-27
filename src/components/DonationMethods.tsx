// Eduvelto — donation payment-method cards (Phase 3, 25 Nov 2026,
// feature/ssg-bilingual-support).
//
// History:
// - Day 6, 26 Nov 2026: the payment number was NEVER rendered —
//   visitors paid via the branded eduvelto.com/whatsapp redirect,
//   which shares the number on WhatsApp. The number lived only in
//   lib/donations.ts (owner record) and never reached the DOM, so
//   it could not be scraped.
// - 27 Nov 2026 20:43, OWNER ORDER (reverses Day 6 for the MODAL
//   only): the support modal (compact) shows the bKash/Nagad
//   number DIRECTLY with a one-click Copy Number button, plus a
//   "পেমেন্ট করে WhatsApp-এ জানান" button below. Rocket is removed
//   from the modal. Bank Transfer was NOT added — the owner dropped
//   it 20:48 after the public-number risk discussion, so NO bank
//   account number ever entered the code.
// - The FULL /support page (non-compact) keeps the Day 6 behavior:
//   no number rendered, payment via the /whatsapp redirect — and
//   since 28 Nov 2026 (completeness audit) it also shows bKash /
//   Nagad only: the Rocket / Bank Transfer cards only ever showed
//   a "coming soon" state.
// Copying is click-only (SSR-safe: no navigator access at render
// time) with a textarea fallback where clipboard.writeText is
// unavailable. The number itself always comes from
// lib/donations.ts data (method.number) — the literal digits never
// appear in this file's source (guarded by
// suggestionsStore.test.ts).

import { useState } from 'react';
import { Link } from 'react-router-dom';
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

/** Copy-to-clipboard button for a payment number. Used by the
 *  support modal (compact): the number is shown directly there per
 *  the owner's 27 Nov 2026 order. The full support page still
 *  hides the number (Day 6 rule). */
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

const cardStyle: React.CSSProperties = {
  border: '1px solid var(--line)',
  borderRadius: 12,
  padding: '14px 16px',
  background: 'var(--teal-soft)',
};

/** Modal card (compact): bKash / Nagad only — Personal account,
 *  Send Money, the number shown directly, one-click copy. */
function CompactMethodCard({ method }: { method: DonationMethod }) {
  const { t } = useLanguage();
  return (
    <div data-method={method.id} style={cardStyle}>
      <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 16 }}>
        {t({ bn: method.nameBn, en: method.nameEn })}
      </p>
      <p style={{ margin: '0 0 6px', color: 'var(--muted)', fontSize: 14 }}>
        Personal • Send Money
      </p>
      {method.number ? (
        <>
          <p
            style={{
              margin: '0 0 10px',
              fontWeight: 700,
              fontSize: 17,
              letterSpacing: 0.5,
              wordBreak: 'break-all',
            }}
          >
            {method.number}
          </p>
          <CopyNumberButton number={method.number} />
        </>
      ) : null}
    </div>
  );
}

function MethodCard({ method }: { method: DonationMethod }) {
  const { t } = useLanguage();
  return (
    <div data-method={method.id} style={cardStyle}>
      <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 16 }}>
        {t({ bn: method.nameBn, en: method.nameEn })}
      </p>
      {method.comingSoon || !method.number ? (
        <p style={{ margin: '0 0 8px', color: 'var(--muted)', fontSize: 14 }}>
          {t({ bn: 'শীঘ্রই আসছে', en: 'Coming soon' })}
        </p>
      ) : (
        <>
          <p style={{ margin: '0 0 8px', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
            {t({
              bn: 'পেমেন্টের নম্বর WhatsApp-এ জানিয়ে দেওয়া হবে।',
              en: 'The payment number will be shared on WhatsApp.',
            })}
          </p>
          <Link to="/whatsapp" className="ev-btn ev-btn-sm">
            {t({ bn: 'WhatsApp-এ পেমেন্ট করুন', en: 'Pay via WhatsApp' })}
          </Link>
        </>
      )}
    </div>
  );
}

export default function DonationMethods({ compact = false }: { compact?: boolean }) {
  const { t } = useLanguage();
  if (compact) {
    // Modal: bKash + Nagad only (owner order 27 Nov 2026) — Rocket
    // removed, no bank card. Number shown directly with copy.
    const methods = DONATION_METHODS.filter((m) => m.id === 'bkash' || m.id === 'nagad');
    return (
      <div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
          }}
        >
          {methods.map((m) => (
            <CompactMethodCard key={m.id} method={m} />
          ))}
        </div>
        <p style={{ margin: '12px 0 0' }}>
          <Link
            to="/whatsapp"
            className="ev-btn"
            style={{ display: 'block', textAlign: 'center' }}
          >
            {t({ bn: 'পেমেন্ট করে WhatsApp-এ জানান', en: 'Let us know on WhatsApp after paying' })}
          </Link>
        </p>
        <p style={{ margin: '10px 0 0', color: 'var(--muted)', fontSize: 13, lineHeight: 1.6 }}>
          {t({
            bn: 'নম্বর কপি করে বিকাশ/নগদ অ্যাপ থেকে Send Money করুন, তারপর উপরের বাটনে WhatsApp-এ জানান।',
            en: 'Copy the number, send money from the bKash/Nagad app, then let us know on WhatsApp above.',
          })}
        </p>
      </div>
    );
  }
  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 12,
        }}
      >
        {/* 28 Nov 2026 (completeness audit): bKash + Nagad only, same
            as the modal — the Rocket / Bank Transfer cards only ever
            showed a "coming soon" state. */}
        {DONATION_METHODS.filter((m) => m.id === 'bkash' || m.id === 'nagad').map((m) => (
          <MethodCard key={m.id} method={m} />
        ))}
      </div>
      <p style={{ margin: '10px 0 0', color: 'var(--muted)', fontSize: 13, lineHeight: 1.6 }}>
        {t({
          bn: 'বিকাশ ও নগদ — পেমেন্টের নম্বর WhatsApp-এ জানিয়ে দেওয়া হবে।',
          en: 'bKash and Nagad — the payment number will be shared on WhatsApp.',
        })}
      </p>
    </div>
  );
}
