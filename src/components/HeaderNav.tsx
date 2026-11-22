// Eduvelto — site header (homepage redesign, 21 Nov 2026).
//
// Owner-approved mockups (desktop + mobile, "same arokom hobe"):
// a LIGHT header — white background, forest text — replacing the old
// forest-navy header. Nav: Home (blue pill), Job Preparation,
// Admission Preparation, Academic Learning, Professional Skills
// (dropdowns), search icon, dark-mode toggle, Login / Register
// (signed out) or profile + Dashboard + Log out (signed in).
// Mobile (≤860px): logo + notification bell + avatar (signed in) +
// hamburger opening the full menu (sections as accordions + secondary
// links). The header is shared chrome, so the new nav appears on every
// page, not only the homepage. A language toggle button (globe icon +
// "EN"/"বাং") sits at the top-right beside the profile on desktop and
// mobile alike — it switches ONLY the navigation tab labels (owner
// rule 22 Nov 2026); everything else stays Bangla.
//
// HONESTY: there is NO dark-mode theme system and NO notifications
// system in this codebase — the moon icon and the bell open a small
// "শীঘ্রই আসছে / Coming soon" note instead of pretending to work.
// The bell shows NO count badge (no real notification count exists).
// Dropdown items that lead to unbuilt sections (/jobs, /admissions,
// /skills) carry a "শীঘ্রই আসছে" chip and land on the shared
// Coming Soon page; items that lead to working pages have no chip.

import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useLanguage } from '../i18n/LanguageContext';
import type { Lang } from '../i18n/strings';

type MenuItem = { to: string; bn: string; en: string; soon?: boolean };
type Menu = { id: string; bn: string; en: string; icon: React.ReactNode; items: MenuItem[] };

function BriefcaseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}
function CapIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 10L12 5 2 10l10 5 10-5z" />
      <path d="M6 12.5V17c0 1.66 2.69 3 6 3s6-1.34 6-3v-4.5" />
      <path d="M22 10v6" />
    </svg>
  );
}
function BookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}
function SkillsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 3v18h18" />
      <path d="M7 15l4-6 4 3 5-8" />
    </svg>
  );
}
function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ transform: open ? 'rotate(180deg)' : undefined, transition: 'transform 120ms ease', flex: 'none' }}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  );
}
function MoonIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}
function BellIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}
function HomeIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1V9.5z" />
    </svg>
  );
}
function LanguageIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a13.5 13.5 0 0 1 3.5 9 13.5 13.5 0 0 1-3.5 9 13.5 13.5 0 0 1-3.5-9A13.5 13.5 0 0 1 12 3z" />
    </svg>
  );
}

/**
 * Header language toggle (owner rule 22 Nov 2026): an icon button at the
 * top-right, beside the profile, that switches ONLY the navigation tab
 * labels between Bangla and English. The visible label is the TARGET
 * language (EN when tabs are Bangla, বাং when tabs are English); the
 * button itself and everything else stays Bangla. It reads/writes the
 * same `tabLang` as the Settings language selector, so the two stay
 * in sync. Rendered twice (desktop actions + mobile actions) — CSS
 * shows exactly one per viewport.
 */
function LangToggleButton() {
  const { tabLang, setLanguage, t } = useLanguage();
  const next: Lang = tabLang === 'bn' ? 'en' : 'bn';
  return (
    <button
      type="button"
      className="ev-header-lang-btn"
      aria-label={t({ bn: 'ট্যাবের ভাষা বদলান', en: 'Change tab language' })}
      title={t({ bn: 'ট্যাবের ভাষা বদলান', en: 'Change tab language' })}
      onClick={() => setLanguage(next)}
    >
      <LanguageIcon />
      <span>{tabLang === 'bn' ? 'EN' : 'বাং'}</span>
    </button>
  );
}

const MENUS: Menu[] = [
  {
    id: 'jobs',
    bn: 'চাকরি প্রস্তুতি',
    en: 'Job Preparation',
    icon: <BriefcaseIcon />,
    items: [
      { to: '/jobs', bn: 'চাকরি প্রস্তুতি', en: 'Job Preparation', soon: true },
      { to: '/jobs', bn: 'BCS প্রস্তুতি', en: 'BCS Preparation', soon: true },
      { to: '/jobs', bn: 'ব্যাংক চাকরি', en: 'Bank Jobs', soon: true },
      { to: '/jobs', bn: 'প্রাইমারি শিক্ষক', en: 'Primary Teacher', soon: true },
      { to: '/jobs', bn: 'NTRCA প্রস্তুতি', en: 'NTRCA Preparation', soon: true },
      { to: '/exam', bn: 'মডেল টেস্ট', en: 'Model Tests' },
    ],
  },
  {
    id: 'admissions',
    bn: 'ভর্তি প্রস্তুতি',
    en: 'Admission Preparation',
    icon: <CapIcon />,
    items: [
      { to: '/admissions', bn: 'ভর্তি প্রস্তুতি', en: 'Admission Preparation', soon: true },
      { to: '/admissions', bn: 'বিশ্ববিদ্যালয় ভর্তি', en: 'University Admission', soon: true },
      { to: '/admissions', bn: 'মেডিকেল ভর্তি', en: 'Medical Admission', soon: true },
      { to: '/admissions', bn: 'ইঞ্জিনিয়ারিং ভর্তি', en: 'Engineering Admission', soon: true },
      { to: '/exam', bn: 'মডেল টেস্ট', en: 'Model Tests' },
    ],
  },
  {
    id: 'academic',
    bn: 'শিক্ষা কার্যক্রম',
    en: 'Academic Learning',
    icon: <BookIcon />,
    items: [
      { to: '/class', bn: 'শ্রেণি বেছে নিন', en: 'Choose Your Class' },
      { to: '/class/class-1-5', bn: 'শ্রেণি ১–৫', en: 'Class 1–5' },
      { to: '/class/class-6-8', bn: 'শ্রেণি ৬–৮', en: 'Class 6–8' },
      { to: '/class/class-9-10', bn: 'শ্রেণি ৯–১০', en: 'Class 9–10' },
      { to: '/class/hsc', bn: 'HSC', en: 'HSC' },
      { to: '/class/honours-masters', bn: 'অনার্স ও মাস্টার্স', en: 'Honours & Masters' },
      { to: '/library', bn: 'লাইব্রেরি', en: 'Library' },
      { to: '/directory', bn: 'শিক্ষা নির্দেশিকা', en: 'Education Directory' },
    ],
  },
  {
    id: 'skills',
    bn: 'দক্ষতা উন্নয়ন',
    en: 'Professional Skills',
    icon: <SkillsIcon />,
    items: [
      { to: '/skills', bn: 'দক্ষতা উন্নয়ন', en: 'Professional Skills', soon: true },
      { to: '/skills', bn: 'English', en: 'English', soon: true },
      { to: '/skills', bn: 'Computer', en: 'Computer', soon: true },
      { to: '/skills', bn: 'Digital Skills', en: 'Digital Skills', soon: true },
    ],
  },
];

// Secondary pages — reachable from the mobile menu (and the footer).
const SECONDARY: MenuItem[] = [
  { to: '/directory', bn: 'শিক্ষা নির্দেশিকা', en: 'Education Directory' },
  { to: '/library', bn: 'লাইব্রেরি', en: 'Library' },
  { to: '/exam', bn: 'পরীক্ষা', en: 'Exams' },
  { to: '/routine', bn: 'রুটিন', en: 'Study Routine' },
  { to: '/progress', bn: 'অগ্রগতি', en: 'Progress' },
  { to: '/health', bn: 'স্বাস্থ্য', en: 'Health' },
  { to: '/about', bn: 'আমাদের সম্পর্কে', en: 'About' },
  { to: '/founder', bn: 'প্রতিষ্ঠাতা', en: 'Founder' },
  { to: '/contact', bn: 'যোগাযোগ', en: 'Contact' },
  { to: '/privacy', bn: 'গোপনীয়তা নীতি', en: 'Privacy Policy' },
];

export default function HeaderNav() {
  const { t, tTab } = useLanguage();
  const { user, profile, loading, signOut } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [darkNote, setDarkNote] = useState(false);
  const [bellNote, setBellNote] = useState(false);
  const navRef = useRef<HTMLElement | null>(null);

  // Close every open menu on navigation.
  useEffect(() => {
    setMenuOpen(false);
    setOpenMenu(null);
    setDarkNote(false);
    setBellNote(false);
  }, [location.pathname]);

  // Close dropdowns on Escape / outside click.
  useEffect(() => {
    if (!openMenu && !darkNote && !bellNote) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpenMenu(null);
        setDarkNote(false);
        setBellNote(false);
      }
    }
    function onClick(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
        setDarkNote(false);
        setBellNote(false);
      }
    }
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [openMenu, darkNote, bellNote]);

  const initial = (profile?.displayName ?? user?.email ?? '?').trim().charAt(0).toUpperCase() || '?';

  return (
    <header className="ev-header" ref={navRef}>
      <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none', flex: 'none' }} aria-label={t({ bn: 'Eduvelto — হোম', en: 'Eduvelto — Home' })}>
        <img src="/logo.png" alt="Eduvelto" style={{ height: 44, width: 'auto', display: 'block' }} />
      </Link>

      {/* Mobile-only: bell (Coming Soon) + avatar (signed in). */}
      <span className="ev-header-mobile-actions">
        <span style={{ position: 'relative' }}>
          <button
            type="button"
            className="ev-header-icon-btn"
            aria-label={t({ bn: 'নোটিফিকেশন', en: 'Notifications' })}
            aria-expanded={bellNote}
            onClick={() => {
              setBellNote((v) => !v);
              setDarkNote(false);
            }}
          >
            <BellIcon />
          </button>
          {bellNote ? (
            <span className="ev-header-note" role="status">
              {t({ bn: 'নোটিফিকেশন শীঘ্রই আসছে', en: 'Notifications coming soon' })}
            </span>
          ) : null}
        </span>
        {/* Language toggle — top-right, beside the profile (owner rule 22 Nov 2026). */}
        <LangToggleButton />
        {loading ? null : user ? (
          <Link to="/profile" className="ev-header-avatar" aria-label={t({ bn: 'প্রোফাইল', en: 'Profile' })}>
            {initial}
          </Link>
        ) : null}
      </span>

      <button
        type="button"
        className="ev-menu-btn"
        aria-expanded={menuOpen}
        aria-controls="ev-main-nav"
        aria-label={menuOpen ? t({ bn: 'মেনু বন্ধ করুন', en: 'Close menu' }) : t({ bn: 'মেনু খুলুন', en: 'Open menu' })}
        onClick={() => setMenuOpen((o) => !o)}
      >
        {menuOpen ? `✕ ${t({ bn: 'বন্ধ', en: 'Close' })}` : `☰ ${t({ bn: 'মেনু', en: 'Menu' })}`}
      </button>

      <nav aria-label={t({ bn: 'প্রধান মেনু', en: 'Main menu' })} id="ev-main-nav" className={`ev-header-nav${menuOpen ? ' ev-header-nav-open' : ''}`}>
        <NavLink to="/" end className={({ isActive }) => `ev-hnav-home${isActive ? ' ev-hnav-home-active' : ''}`}>
          <HomeIcon /> {tTab({ bn: 'হোম', en: 'Home' })}
        </NavLink>
        {MENUS.map((menu) => {
          const open = openMenu === menu.id;
          return (
            <div key={menu.id} className="ev-hnav-drop">
              <button
                type="button"
                className={`ev-hnav-drop-btn${open ? ' ev-hnav-drop-btn-open' : ''}`}
                aria-expanded={open}
                aria-haspopup="true"
                onClick={() => setOpenMenu(open ? null : menu.id)}
              >
                {menu.icon} {tTab({ bn: menu.bn, en: menu.en })} <ChevronIcon open={open} />
              </button>
              {open ? (
                <div className="ev-hnav-panel" role="menu">
                  {menu.items.map((item) => (
                    <NavLink key={`${item.to}-${item.bn}`} to={item.to} className="ev-hnav-panel-link" role="menuitem">
                      <span>{t({ bn: item.bn, en: item.en })}</span>
                      {item.soon ? <span className="ev-hnav-soon">{t({ bn: 'শীঘ্রই আসছে', en: 'Coming soon' })}</span> : null}
                    </NavLink>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}

        {/* Secondary pages — desktop keeps them out of the mockup nav;
            they stay reachable from the mobile menu + footer. */}
        <span className="ev-hnav-secondary">
          {SECONDARY.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `ev-navlink${isActive ? ' ev-navlink-active' : ''}`}>
              {tTab({ bn: item.bn, en: item.en })}
            </NavLink>
          ))}
          {profile?.role === 'owner' ? (
            <NavLink to="/admin" className={({ isActive }) => `ev-navlink${isActive ? ' ev-navlink-active' : ''}`} style={{ color: '#8A6100', fontWeight: 700 }}>
              {tTab({ bn: 'অ্যাডমিন', en: 'Admin' })}
            </NavLink>
          ) : null}
        </span>

        <span className="ev-header-actions">
          <Link to="/library" className="ev-header-icon-btn" aria-label={t({ bn: 'খুঁজুন', en: 'Search' })}>
            <SearchIcon />
          </Link>
          <span style={{ position: 'relative' }}>
            <button
              type="button"
              className="ev-header-icon-btn"
              aria-label={t({ bn: 'ডার্ক মোড', en: 'Dark mode' })}
              aria-expanded={darkNote}
              onClick={() => {
                setDarkNote((v) => !v);
                setBellNote(false);
              }}
            >
              <MoonIcon />
            </button>
            {darkNote ? (
              <span className="ev-header-note" role="status">
                {t({ bn: 'ডার্ক মোড শীঘ্রই আসছে', en: 'Dark mode coming soon' })}
              </span>
            ) : null}
          </span>
          {/* Language toggle — top-right, beside the profile (owner rule 22 Nov 2026). */}
          <LangToggleButton />
          {loading ? null : user ? (
            <>
              <NavLink to="/dashboard" className={({ isActive }) => `ev-navlink${isActive ? ' ev-navlink-active' : ''}`}>
                {tTab({ bn: 'ড্যাশবোর্ড', en: 'Dashboard' })}
              </NavLink>
              <NavLink to="/profile" className={({ isActive }) => `ev-navlink${isActive ? ' ev-navlink-active' : ''}`}>
                {profile?.displayName ?? tTab({ bn: 'প্রোফাইল', en: 'Profile' })}
              </NavLink>
              <button type="button" onClick={() => void signOut()} className="ev-btn ev-btn-sm ev-header-btn-outline">
                {t({ bn: 'লগআউট', en: 'Log out' })}
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="ev-btn ev-btn-sm ev-header-btn-login">
                {t({ bn: 'লগইন', en: 'Log in' })}
              </NavLink>
              <NavLink to="/register" className="ev-btn ev-btn-sm ev-header-btn-register">
                {t({ bn: 'রেজিস্টার', en: 'Register' })}
              </NavLink>
            </>
          )}
        </span>
      </nav>
    </header>
  );
}
