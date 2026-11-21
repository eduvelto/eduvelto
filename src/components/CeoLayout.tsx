// Eduvelto — CEO Panel layout (owner-only section, 21 Nov 2026).
//
// Mobile-first, exactly like the owner's 8-screen CEO mockup: a narrow
// phone-width column (max 560px, centred on desktop), a dark-navy header
// with a back arrow + screen title, and a bottom nav (Home / Reports /
// Team / More) on small screens. The global public BottomNav is hidden
// on /ceo* routes (App.tsx) so the two bars never double up.

import type { ReactNode } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';

const BOTTOM_ITEMS = [
  { to: '/ceo', bn: 'হোম', en: 'Home' },
  { to: '/ceo/growth', bn: 'রিপোর্ট', en: 'Reports' },
  { to: '/ceo/team', bn: 'টিম', en: 'Team' },
  { to: '/ceo/settings', bn: 'আরও', en: 'More' },
] as const;

function BottomIcon({ to }: { to: string }) {
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
    case '/ceo':
      return (
        <svg {...p}>
          <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1V9.5z" />
        </svg>
      );
    case '/ceo/growth':
      return (
        <svg {...p}>
          <path d="M3 3v18h18" />
          <path d="M7 15l4-6 4 3 5-8" />
        </svg>
      );
    case '/ceo/team':
      return (
        <svg {...p}>
          <circle cx="9" cy="8" r="3.5" />
          <path d="M2.5 20v-1a6.5 6.5 0 0 1 13 0v1" />
          <path d="M16 4.6a3.5 3.5 0 0 1 0 6.8" />
          <path d="M17.5 13.6a6.5 6.5 0 0 1 4 5.4v1" />
        </svg>
      );
    default:
      return (
        <svg {...p}>
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      );
  }
}

export function CeoLayout(props: { titleBn: string; titleEn: string; children?: ReactNode }) {
  const { lang, t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/ceo' || location.pathname === '/ceo/';
  return (
    <div className="ev-ceo-shell">
      <header className="ev-ceo-header">
        {isHome ? (
          <span className="ev-ceo-header-title" style={{ fontSize: 20 }}>
            Edu<span style={{ color: '#4ADE80' }}>velto</span>
          </span>
        ) : (
          <>
            <button
              type="button"
              className="ev-ceo-back"
              aria-label={t({ bn: 'পেছনে যান', en: 'Go back' })}
              onClick={() => navigate(-1)}
            >
              ←
            </button>
            <span className="ev-ceo-header-title">
              {lang === 'bn' ? props.titleBn : props.titleEn}
            </span>
          </>
        )}
        <span className="ev-ceo-badge">{t({ bn: 'সিইও প্যানেল', en: 'CEO Panel' })}</span>
      </header>
      <main className="ev-ceo-main">
        {props.children ?? <Outlet />}
      </main>
      <nav aria-label={t({ bn: 'সিইও মেনু', en: 'CEO menu' })} className="ev-ceo-bottom-nav">
        {BOTTOM_ITEMS.map((item) => {
          const active =
            item.to === '/ceo'
              ? location.pathname === '/ceo' || location.pathname === '/ceo/'
              : location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              aria-current={active ? 'page' : undefined}
              className={`ev-ceo-bottom-nav-item${active ? ' ev-ceo-bottom-nav-item-active' : ''}`}
            >
              <BottomIcon to={item.to} />
              <span>{t(item)}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}

export default CeoLayout;
