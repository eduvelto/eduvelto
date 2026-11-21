// Eduvelto — mobile bottom navigation (stage 3: class-wise homepage +
// mobile app preview).
//
// App-like bottom bar on small screens (≤768px): Home / Books / Tests /
// Progress / Profile — the five items from the owner's brief (21 Nov
// 12:21). Desktop keeps the header nav. Icons are inline SVG (currentColor);
// active item is amber on forest navy (6.49:1, AA) with a 3px amber top
// indicator; inactive items are white 85%. The bar sits above the bottom
// ad banner when one is live (bottomOffsetPx, same pattern as the PWA
// branch's BottomNav) and respects the iOS safe-area inset. Content
// clearance is the `.ev-app-shell` padding rule in index.css — the bar
// must never cover content or buttons (PWA design-review must-fix, 21 Nov).

import { NavLink, useLocation } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';

const ITEMS = [
  { to: '/', bn: 'হোম', en: 'Home' },
  { to: '/library', bn: 'লাইব্রেরি', en: 'Books' },
  { to: '/exam', bn: 'পরীক্ষা', en: 'Tests' },
  { to: '/progress', bn: 'অগ্রগতি', en: 'Progress' },
  { to: '/profile', bn: 'প্রোফাইল', en: 'Profile' },
] as const;

function NavIcon({ to }: { to: string }) {
  const p = {
    width: 22,
    height: 22,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  } as const;
  switch (to) {
    case '/':
      return (
        <svg {...p}>
          <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1V9.5z" />
        </svg>
      );
    case '/library':
      return (
        <svg {...p}>
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      );
    case '/exam':
      return (
        <svg {...p}>
          <rect x="5" y="4" width="14" height="17" rx="2" />
          <path d="M9 4.5V3h6v1.5" />
          <path d="M9 11l2 2 4-4" />
        </svg>
      );
    case '/progress':
      return (
        <svg {...p}>
          <path d="M3 3v18h18" />
          <path d="M7 15l4-6 4 3 5-8" />
        </svg>
      );
    default:
      return (
        <svg {...p}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21v-1a8 8 0 0 1 16 0v1" />
        </svg>
      );
  }
}

export default function BottomNav(props: { bottomOffsetPx: number }) {
  const location = useLocation();
  const { t } = useLanguage();
  return (
    <nav aria-label={t({ bn: 'মোবাইল মেনু', en: 'Mobile menu' })} className="ev-bottom-nav" style={{ bottom: props.bottomOffsetPx }}>
      {ITEMS.map((item) => {
        const active =
          item.to === '/'
            ? location.pathname === '/'
            : location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
        return (
          <NavLink
            key={item.to}
            to={item.to}
            aria-current={active ? 'page' : undefined}
            className={`ev-bottom-nav-item${active ? ' ev-bottom-nav-item-active' : ''}`}
          >
            <NavIcon to={item.to} />
            <span>{t(item)}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
