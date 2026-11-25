// Eduvelto — "Buy Printed Hardcopy" affiliate slot (Phase 3
// Commit 4, 25 Nov 2026, feature/ssg-bilingual-support).
//
// LINK SLOT ONLY. This renders a clearly-marked placeholder until
// the owner supplies a real Rokomari affiliate URL:
//   <HardcopyAffiliateSlot affiliateUrl="<rokomari-affiliate-url>" />
// The URL goes in as the `affiliateUrl` prop from the call site
// (BookPage) — it is NOT hardcoded here and NO Rokomari URL is
// invented anywhere in this file. While `affiliateUrl` is empty,
// the slot shows a disabled "coming soon" button and no link.
// When a real URL is supplied, the button becomes a real
// outbound link (rel="sponsored noopener", new tab).

import { useLanguage } from '../i18n/LanguageContext';

/** Slot state — pure, for the unit tests. */
export function hardcopySlotState(affiliateUrl?: string | null): 'placeholder' | 'live' {
  return affiliateUrl && affiliateUrl.trim().length > 0 ? 'live' : 'placeholder';
}

export default function HardcopyAffiliateSlot({ affiliateUrl }: { affiliateUrl?: string }) {
  const { t } = useLanguage();
  const state = hardcopySlotState(affiliateUrl);
  if (state === 'live') {
    return (
      <p style={{ margin: '0 0 20px' }}>
        <a
          href={(affiliateUrl as string).trim()}
          target="_blank"
          rel="sponsored noopener noreferrer"
          className="ev-btn"
          data-hardcopy-affiliate="live"
          style={{ display: 'inline-block', textDecoration: 'none' }}
        >
          {t({ bn: 'প্রিন্টেড হার্ডকপি কিনুন', en: 'Buy Printed Hardcopy' })}
        </a>
      </p>
    );
  }
  return (
    <div
      data-hardcopy-affiliate="placeholder"
      style={{
        margin: '0 0 20px',
        border: '1px dashed var(--line)',
        borderRadius: 12,
        padding: '14px 16px',
      }}
    >
      <p style={{ margin: '0 0 4px', fontWeight: 700 }}>
        {t({ bn: 'প্রিন্টেড হার্ডকপি কিনুন', en: 'Buy Printed Hardcopy' })}
      </p>
      <p style={{ margin: 0, color: 'var(--muted)', fontSize: 14, lineHeight: 1.6 }}>
        {t({
          bn: 'শীঘ্রই আসছে — প্রিন্টেড বইয়ের লিংক এখনো দেওয়া হয়নি।',
          en: 'Coming soon — the printed-book link is not set yet.',
        })}
      </p>
      <button type="button" className="ev-btn ev-btn-sm" disabled style={{ marginTop: 10, opacity: 0.6 }}>
        {t({ bn: 'প্রিন্টেড হার্ডকপি কিনুন', en: 'Buy Printed Hardcopy' })}
      </button>
    </div>
  );
}
