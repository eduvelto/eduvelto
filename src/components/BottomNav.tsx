import { Link, useLocation } from 'react-router-dom';
import { strings } from '../i18n/strings';

// Mobile bottom navigation (owner brief 21 Nov 07:32 — website-first PWA:
// "Mobile-friendly navigation and bottom navigation where appropriate").
// Shown ONLY on small screens (<= 768px) via the media query in the
// <style> block below; desktop keeps the header nav. The bar sits above
// the bottom ad banner when one is live (bottomOffsetPx), and respects
// the iOS safe-area inset. Content clearance is handled by the
// `.eduvelto-app-shell` padding rule in the same <style> block.
// NOTE: this is PWA navigation, not general UI polish — the ui/premium-polish
// workstream owns wider visual polish; overlap is noted in the PWA report.
const ITEMS = [
  { to: '/', bn: 'হোম', en: 'Home' },
  { to: '/library', bn: 'লাইব্রেরি', en: 'Library' },
  { to: '/exam', bn: 'পরীক্ষা', en: 'Exam' },
  { to: '/routine', bn: 'রুটিন', en: 'Routine' },
  { to: '/profile', bn: 'প্রোফাইল', en: 'Profile' },
] as const;

export default function BottomNav(props: { bottomOffsetPx: number }) {
  const location = useLocation();
  const nav = strings.nav;
  return (
    <>
      <style>{`
        .eduvelto-bottom-nav { display: none; }
        @media (max-width: 768px) {
          .eduvelto-bottom-nav {
            display: flex;
            position: fixed;
            left: 0;
            right: 0;
            z-index: 40;
            background: #0A1F44;
            border-top: 2px solid #F1B308;
            padding-bottom: env(safe-area-inset-bottom, 0px);
          }
          .eduvelto-app-shell {
            padding-bottom: calc(60px + env(safe-area-inset-bottom, 0px));
          }
        }
      `}</style>
      <nav
        aria-label="মোবাইল মেনু"
        className="eduvelto-bottom-nav"
        style={{ bottom: props.bottomOffsetPx }}
      >
        {ITEMS.map((item) => {
          const active =
            item.to === '/'
              ? location.pathname === '/'
              : location.pathname === item.to || location.pathname.startsWith(item.to + '/');
          const label =
            item.to === '/'
              ? nav.home.bn
              : item.to === '/library'
                ? nav.library.bn
                : item.to === '/exam'
                  ? nav.exam.bn
                  : item.to === '/routine'
                    ? nav.routine.bn
                    : nav.profile.bn;
          return (
            <Link
              key={item.to}
              to={item.to}
              aria-current={active ? 'page' : undefined}
              style={{
                flex: 1,
                textAlign: 'center',
                textDecoration: 'none',
                color: active ? '#F1B308' : '#fff',
                fontWeight: active ? 700 : 400,
                fontSize: 13,
                padding: '12px 4px',
                minHeight: 48,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
