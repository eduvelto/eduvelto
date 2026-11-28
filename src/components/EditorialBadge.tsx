// Eduvelto — editorial verification badge (owner order 28 Nov 2026,
// trust/content batch).
//
// Shown ONLY at the bottom of article (guide) pages and tool pages —
// never on question banks, books, or exam pages (verification there
// is genuinely pending). The exact wording is the owner's:
//
//   bn: 'যাচাইকৃত: Eduvelto শিক্ষা ও গবেষণা টিম — হালনাগাদ: নভেম্বর ২০২৬'
//   en: 'Verified: Eduvelto Education & Research Team — Updated: November 2026'
//
// One shared component so the wording cannot drift between the two
// page types (PublicGuidePage, ToolsDetailPage).

import { useLanguage } from '../i18n/LanguageContext';

export const EDITORIAL_BADGE_BN =
  'যাচাইকৃত: Eduvelto শিক্ষা ও গবেষণা টিম — হালনাগাদ: নভেম্বর ২০২৬';
export const EDITORIAL_BADGE_EN =
  'Verified: Eduvelto Education & Research Team — Updated: November 2026';

export default function EditorialBadge() {
  const { lang } = useLanguage();
  return (
    <p className="ev-editorial-badge">
      <span aria-hidden="true">✓ </span>
      {lang === 'bn' ? EDITORIAL_BADGE_BN : EDITORIAL_BADGE_EN}
    </p>
  );
}
