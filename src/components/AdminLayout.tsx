// Eduvelto — Admin Panel layout (owner-only, 21 Nov 2026).
//
// The desktop + mobile admin mockups: a dark-navy left sidebar on
// desktop, a top bar (hamburger, search, Live Site, bell, admin chip),
// a slide-in drawer + bottom nav on mobile. The global public header,
// footer and BottomNav are hidden on /admin* routes (App.tsx) so this
// shell owns the whole page, exactly like the CEO Panel layout.
//
// HONESTY: every sidebar item links to a REAL page or is a disabled
// "Coming soon" item — nothing pretends to work. The bell has no fake
// badge count (no notification system exists); the search finds admin
// destinations by name in Bangla/English, and an email query offers a
// real user search (/admin/users?email=…).

import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useLanguage } from '../i18n/LanguageContext';
import { getEnrolledFactors, hasTotpFactor } from '../lib/ownerMfa';

type NavLeaf = { to?: string; bn: string; en: string; soon?: boolean };
type NavSection = { bn: string; en: string; icon: string; items: NavLeaf[] };

const NAV_SECTIONS: NavSection[] = [
  {
    bn: 'ড্যাশবোর্ড',
    en: 'Dashboard',
    icon: 'home',
    items: [{ to: '/admin', bn: 'ড্যাশবোর্ড', en: 'Dashboard' }],
  },
  {
    bn: 'কনটেন্ট ব্যবস্থাপনা',
    en: 'Content Management',
    icon: 'book',
    items: [
      { to: '/library', bn: 'পাঠ ও কোর্স', en: 'Lessons & Courses' },
      { to: '/exam', bn: 'প্রশ্নব্যাংক', en: 'Question Bank' },
      { bn: 'আগের বছরের প্রশ্ন', en: 'Previous Questions', soon: true },
      { bn: 'মডেল টেস্ট', en: 'Model Tests', soon: true },
    ],
  },
  {
    bn: 'পরীক্ষা ব্যবস্থাপনা',
    en: 'Exam Management',
    icon: 'quiz',
    items: [
      { to: '/exam', bn: 'সব পরীক্ষা', en: 'All Exams' },
      { to: '/admin/question-reports', bn: 'প্রশ্নের ভুল রিপোর্ট', en: 'Question Error Reports' },
      { bn: 'পরীক্ষার সেটিংস', en: 'Exam Settings', soon: true },
      { to: '/admin/analytics', bn: 'ফলাফল ও বিশ্লেষণ', en: 'Results & Analytics' },
    ],
  },
  {
    bn: 'জব ও ভর্তি',
    en: 'Job & Admission',
    icon: 'briefcase',
    items: [
      { to: '/admin/jobs', bn: 'চাকরি প্রস্তুতি', en: 'Job Preparation' },
      { to: '/admin/jobs/circulars', bn: 'সার্কুলার যাচাই', en: 'Circular Verification' },
      { to: '/admin/jobs/reports', bn: 'ছাত্রদের রিপোর্ট', en: 'Student Reports' },
      { to: '/admin/jobs/corrections', bn: 'সংশোধনের প্রস্তাব', en: 'Correction Proposals' },
      { to: '/admin/jobs/domains', bn: 'অফিসিয়াল ডোমেইন', en: 'Official Domains' },
      { to: '/admin/admissions', bn: 'ভর্তি প্রস্তুতি', en: 'Admission Preparation' },
    ],
  },
  {
    bn: 'ব্যবহারকারী ব্যবস্থাপনা',
    en: 'User Management',
    icon: 'users',
    items: [
      { to: '/admin/users', bn: 'ব্যবহারকারী', en: 'Users' },
      { to: '/admin/teachers', bn: 'শিক্ষক যাচাই', en: 'Teacher Verification' },
      { bn: 'গ্রুপ ও কমিউনিটি', en: 'Groups & Communities', soon: true },
    ],
  },
  {
    bn: 'বিশ্লেষণ ও রিপোর্ট',
    en: 'Analytics & Reports',
    icon: 'chart',
    items: [
      { to: '/admin/analytics', bn: 'সাইট বিশ্লেষণ', en: 'Site Analytics' },
      { to: '/admin/analytics', bn: 'ব্যবহারকারী বৃদ্ধি', en: 'User Growth' },
      { to: '/admin/analytics', bn: 'পারফরম্যান্স রিপোর্ট', en: 'Performance Report' },
      { to: '/admin/referrals', bn: 'রেফারেল লিডারবোর্ড', en: 'Referral Leaderboard' },
    ],
  },
  {
    bn: 'সেটিংস',
    en: 'Settings',
    icon: 'gear',
    items: [
      { to: '/admin/settings', bn: 'সাধারণ সেটিংস', en: 'General Settings' },
      { to: '/admin/settings', bn: 'SEO সেটিংস', en: 'SEO Settings' },
      { to: '/admin/settings', bn: 'নোটিফিকেশন', en: 'Notifications' },
      { to: '/admin/security', bn: 'নিরাপত্তা (2FA)', en: 'Security (2FA)' },
    ],
  },
  {
    bn: 'সাহায্য ও সহায়তা',
    en: 'Help & Support',
    icon: 'help',
    items: [{ to: '/contact', bn: 'সাপোর্ট সেন্টার', en: 'Support Center' }],
  },
];

const BOTTOM_ITEMS = [
  { to: '/admin', bn: 'হোম', en: 'Home', icon: 'home' },
  { to: '/admin/users', bn: 'ব্যবহারকারী', en: 'Users', icon: 'users' },
  { to: '/admin/content', bn: 'কনটেন্ট', en: 'Content', icon: 'book' },
  { to: '/admin/analytics', bn: 'রিপোর্ট', en: 'Reports', icon: 'chart' },
  { to: '/admin/settings', bn: 'সেটিংস', en: 'Settings', icon: 'gear' },
] as const;

function NavIcon({ icon }: { icon: string }) {
  const p = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  } as const;
  switch (icon) {
    case 'home':
      return (
        <svg {...p}>
          <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1V9.5z" />
        </svg>
      );
    case 'book':
      return (
        <svg {...p}>
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      );
    case 'quiz':
      return (
        <svg {...p}>
          <rect x="5" y="4" width="14" height="17" rx="2" />
          <path d="M9 4.5V3h6v1.5" />
          <path d="M9 11l2 2 4-4" />
        </svg>
      );
    case 'briefcase':
      return (
        <svg {...p}>
          <rect x="3" y="7" width="18" height="13" rx="2" />
          <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
          <path d="M3 13h18" />
        </svg>
      );
    case 'users':
      return (
        <svg {...p}>
          <circle cx="9" cy="8" r="3.5" />
          <path d="M2.5 20v-1a6.5 6.5 0 0 1 13 0v1" />
          <path d="M16 4.6a3.5 3.5 0 0 1 0 6.8" />
          <path d="M17.5 13.6a6.5 6.5 0 0 1 4 5.4v1" />
        </svg>
      );
    case 'chart':
      return (
        <svg {...p}>
          <path d="M3 3v18h18" />
          <path d="M7 15l4-6 4 3 5-8" />
        </svg>
      );
    case 'gear':
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      );
    case 'help':
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="9" />
          <path d="M9.5 9a2.5 2.5 0 0 1 4.9.8c0 1.7-2.4 2-2.4 3.2" />
          <path d="M12 17h.01" />
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

export function AdminLayout() {
  const { lang, t } = useLanguage();
  const { user, profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  // Owner 2FA banner (23 Nov 2026, staging): shown until a TOTP
  // factor is enrolled. The guard (AdminGuard) blocks admin only
  // AFTER enrollment, when a session lacks the second-factor claim.
  const mfaEnrolled = user ? hasTotpFactor(getEnrolledFactors(user)) : true;
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openSections, setOpenSections] = useState<Record<number, boolean>>({});
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // Ctrl+K / Cmd+K focuses the admin search (as the mockup hints).
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setBellOpen(false);
        setDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Close the drawer on every navigation.
  useEffect(() => {
    setDrawerOpen(false);
    setSearchOpen(false);
    setBellOpen(false);
  }, [location.pathname]);

  const isSectionOpen = (i: number, section: NavSection) =>
    openSections[i] ?? section.items.some((it) => it.to && (location.pathname === it.to || location.pathname.startsWith(`${it.to}/`)));

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const out: Array<{ to: string; bn: string; en: string; sectionBn: string; sectionEn: string }> = [];
    NAV_SECTIONS.forEach((section) => {
      section.items.forEach((item) => {
        if (!item.to || item.soon) return;
        if (item.bn.toLowerCase().includes(q) || item.en.toLowerCase().includes(q)) {
          out.push({ to: item.to, bn: item.bn, en: item.en, sectionBn: section.bn, sectionEn: section.en });
        }
      });
    });
    return out.slice(0, 8);
  }, [query]);

  const isEmailQuery = query.includes('@') && query.trim().length > 3;

  function goSearch(to: string) {
    setSearchOpen(false);
    setQuery('');
    navigate(to);
  }

  const name = profile?.displayName || 'Admin';
  const initial = name.trim().charAt(0) || 'A';

  const sidebar = (
    <>
      <div className="ev-admin-brand">
        <Link to="/admin" className="ev-admin-brand-link" onClick={() => setDrawerOpen(false)}>
          <img src="/logo-white.png" alt="Eduvelto" className="ev-admin-brand-logo" />
          <span className="ev-admin-brand-text">
            <strong>Eduvelto</strong>
            <span>{t({ bn: 'শেখো · এগিয়ে যাও · স্বপ্ন গড়ো', en: 'Learn · Grow · Achieve' })}</span>
          </span>
        </Link>
      </div>
      <nav aria-label={t({ bn: 'অ্যাডমিন মেনু', en: 'Admin menu' })} className="ev-admin-nav">
        {NAV_SECTIONS.map((section, i) => {
          const open = isSectionOpen(i, section);
          const single = section.items.length === 1 && section.items[0].to;
          return (
            <div key={section.en} className="ev-admin-nav-section">
              {single ? (
                <NavLink
                  to={section.items[0].to as string}
                  end={section.items[0].to === '/admin'}
                  onClick={() => setDrawerOpen(false)}
                  className={({ isActive }) => `ev-admin-nav-head${isActive ? ' ev-admin-nav-head-active' : ''}`}
                >
                  <NavIcon icon={section.icon} />
                  <span className="ev-admin-nav-label">{t({ bn: section.bn, en: section.en })}</span>
                </NavLink>
              ) : (
                <>
                  <button
                    type="button"
                    className="ev-admin-nav-head"
                    aria-expanded={open}
                    onClick={() => setOpenSections((prev) => ({ ...prev, [i]: !open }))}
                  >
                    <NavIcon icon={section.icon} />
                    <span className="ev-admin-nav-label">{t({ bn: section.bn, en: section.en })}</span>
                    <span aria-hidden="true" className="ev-admin-nav-caret">{open ? '▾' : '▸'}</span>
                  </button>
                  {open ? (
                    <div className="ev-admin-nav-sub">
                      {section.items.map((item) =>
                        item.to && !item.soon ? (
                          <NavLink
                            key={item.en}
                            to={item.to}
                            end={item.to === '/admin'}
                            onClick={() => setDrawerOpen(false)}
                            className={({ isActive }) => `ev-admin-nav-item${isActive ? ' ev-admin-nav-item-active' : ''}`}
                          >
                            {t({ bn: item.bn, en: item.en })}
                          </NavLink>
                        ) : (
                          <span key={item.en} className="ev-admin-nav-item ev-admin-nav-item-soon" title={t({ bn: 'শীঘ্রই আসছে', en: 'Coming soon' })}>
                            {t({ bn: item.bn, en: item.en })}
                            <span className="ev-admin-soon-pill">{t({ bn: 'শীঘ্রই', en: 'Soon' })}</span>
                          </span>
                        ),
                      )}
                    </div>
                  ) : null}
                </>
              )}
            </div>
          );
        })}
        <div className="ev-admin-nav-section">
          <NavLink
            to="/ceo"
            onClick={() => setDrawerOpen(false)}
            className="ev-admin-nav-head"
            style={{ color: '#D9A441' }}
          >
            <span aria-hidden="true" style={{ fontSize: 18, lineHeight: 1 }}>★</span>
            <span className="ev-admin-nav-label">{t({ bn: 'সিইও প্যানেল', en: 'CEO Panel' })}</span>
          </NavLink>
        </div>
      </nav>
      <div className="ev-admin-sidebar-foot">
        <span>Eduvelto Admin Panel</span>
        <span>v1.0.0</span>
      </div>
    </>
  );

  return (
    <div className={`ev-admin-shell${collapsed ? ' ev-admin-collapsed' : ''}${drawerOpen ? ' ev-admin-drawer-open' : ''}`}>
      <aside className="ev-admin-sidebar" aria-label={t({ bn: 'অ্যাডমিন সাইডবার', en: 'Admin sidebar' })}>
        {sidebar}
      </aside>
      {drawerOpen ? (
        <button
          type="button"
          aria-label={t({ bn: 'মেনু বন্ধ করুন', en: 'Close menu' })}
          className="ev-admin-drawer-overlay"
          onClick={() => setDrawerOpen(false)}
        />
      ) : null}
      <div className="ev-admin-body">
        <header className="ev-admin-topbar">
          <button
            type="button"
            className="ev-admin-hamburger"
            aria-label={t({ bn: 'মেনু', en: 'Menu' })}
            onClick={() => {
              if (window.innerWidth >= 1024) setCollapsed((c) => !c);
              else setDrawerOpen((o) => !o);
            }}
          >
            ☰
          </button>
          <div className="ev-admin-search">
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              onBlur={() => window.setTimeout(() => setSearchOpen(false), 150)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (searchResults.length > 0) goSearch(searchResults[0].to);
                  else if (isEmailQuery) goSearch(`/admin/users?email=${encodeURIComponent(query.trim())}`);
                }
              }}
              placeholder={t({ bn: 'যেকোনো কিছু খুঁজুন… (Ctrl + K)', en: 'Search anything… (Ctrl + K)' })}
              aria-label={t({ bn: 'অ্যাডমিন খোঁজ', en: 'Admin search' })}
              className="ev-admin-search-input"
            />
            <span aria-hidden="true" className="ev-admin-search-icon">⌕</span>
            {searchOpen && query.trim() !== '' ? (
              <div className="ev-admin-search-results" role="listbox">
                {searchResults.map((r) => (
                  <button
                    key={`${r.to}-${r.en}`}
                    type="button"
                    role="option"
                    aria-selected="false"
                    className="ev-admin-search-result"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      goSearch(r.to);
                    }}
                  >
                    <strong>{lang === 'bn' ? r.bn : r.en}</strong>
                    <span>{lang === 'bn' ? r.sectionBn : r.sectionEn}</span>
                  </button>
                ))}
                {isEmailQuery ? (
                  <button
                    type="button"
                    className="ev-admin-search-result"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      goSearch(`/admin/users?email=${encodeURIComponent(query.trim())}`);
                    }}
                  >
                    <strong>{t({ bn: 'ইমেইল দিয়ে ব্যবহারকারী খুঁজুন', en: 'Search users by email' })}</strong>
                    <span>{query.trim()}</span>
                  </button>
                ) : null}
                {searchResults.length === 0 && !isEmailQuery ? (
                  <p className="ev-admin-search-empty">
                    {t({ bn: 'কিছু পাওয়া যায়নি — মেনুর নাম লিখে খুঁজুন।', en: 'Nothing found — search by a menu name.' })}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
          <a href="https://eduvelto.com" target="_blank" rel="noreferrer" className="ev-admin-live-site">
            {t({ bn: 'লাইভ সাইট', en: 'Live Site' })} ↗
          </a>
          <div className="ev-admin-bell-wrap">
            <button
              type="button"
              className="ev-admin-bell"
              aria-label={t({ bn: 'নোটিফিকেশন', en: 'Notifications' })}
              aria-expanded={bellOpen}
              onClick={() => setBellOpen((o) => !o)}
            >
              🔔
            </button>
            {bellOpen ? (
              <div className="ev-admin-bell-panel" role="status">
                <strong>{t({ bn: 'নোটিফিকেশন', en: 'Notifications' })}</strong>
                <p>
                  {t({
                    bn: 'কোনো নোটিফিকেশন নেই — নোটিফিকেশন ব্যবস্থা এখনো তৈরি হয়নি।',
                    en: 'No notifications — the notification system is not built yet.',
                  })}
                </p>
              </div>
            ) : null}
          </div>
          <Link to="/profile" className="ev-admin-chip">
            <span className="ev-admin-avatar" aria-hidden="true">{initial}</span>
            <span className="ev-admin-chip-text">
              <strong>{name}</strong>
              <span>{t({ bn: 'সুপার অ্যাডমিন', en: 'Super Admin' })}</span>
            </span>
          </Link>
        </header>
        <main className="ev-admin-main">
          {!mfaEnrolled ? (
            <div
              role="alert"
              style={{
                background: '#fff7e0',
                border: '1px solid #d9a441',
                borderRadius: 8,
                padding: '10px 14px',
                marginBottom: 16,
              }}
            >
              <strong>
                {t({ bn: 'দ্বিতীয় ধাপ (2FA) এখনো চালু হয়নি', en: 'Two-step verification (2FA) is not enabled yet' })}
              </strong>{' '}
              {t({
                bn: 'মালিকের অ্যাকাউন্টে এখনো অথেনটিকেটর যুক্ত হয়নি। ',
                en: 'No authenticator is linked to the owner account yet. ',
              })}
              <Link to="/admin/security">
                {t({ bn: 'নিরাপত্তা পাতায় গিয়ে চালু করুন →', en: 'Enable it on the Security page →' })}
              </Link>
            </div>
          ) : null}
          <Outlet />
        </main>
      </div>
      <nav aria-label={t({ bn: 'মোবাইল অ্যাডমিন মেনু', en: 'Mobile admin menu' })} className="ev-admin-bottom-nav">
        {BOTTOM_ITEMS.map((item) => {
          const active =
            item.to === '/admin'
              ? location.pathname === '/admin' || location.pathname === '/admin/'
              : location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              aria-current={active ? 'page' : undefined}
              className={`ev-admin-bottom-nav-item${active ? ' ev-admin-bottom-nav-item-active' : ''}`}
            >
              <NavIcon icon={item.icon} />
              <span>{t({ bn: item.bn, en: item.en })}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}

export default AdminLayout;
