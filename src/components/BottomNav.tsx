// Eduvelto — mobile bottom navigation (homepage redesign, 21 Nov 2026).
//
// Owner-approved mobile mockup: হোম, আমার কোর্স, প্রগ্রেস, বেশি কিছু, মেনু.
// This REPLACES the production bottom nav (Home, Books, Tests, Progress,
// Profile). It is rendered on every page at ≤768px (see App.tsx) and the
// 60px bottom clearance in App.tsx / index.css keeps it from covering
// content. The bar sits above the bottom ad banner when one is live
// (bottomOffsetPx, same pattern as before). "বেশি কিছু" opens a bottom
// sheet and "মেনু" opens a SIDE drawer (right) instead of routing:
//  - বেশি কিছু = secondary pages (Directory, Exams, Health, About,
//    Founder, Contact, Privacy) + auth / Dashboard.
//  - মেনু = the four main sections (Job / Admission / Academic / Skills)
//    with their key destinations.
// Sheet/drawer close on backdrop tap, Close button, or navigation.

import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useLanguage } from '../i18n/LanguageContext';

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1V9.5z" />
    </svg>
  );
}
function CoursesIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}
function ProgressIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 3v18h18" />
      <path d="M7 15l4-6 4 3 5-8" />
    </svg>
  );
}
function GridIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}
function MenuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

type Sheet = 'more' | 'menu' | null;

const MORE_LINKS = [
  { to: '/directory', bn: 'শিক্ষা নির্দেশিকা', en: 'Education Directory' },
  { to: '/exam', bn: 'পরীক্ষা', en: 'Exams' },
  { to: '/health', bn: 'স্বাস্থ্য', en: 'Health' },
  { to: '/about', bn: 'আমাদের সম্পর্কে', en: 'About' },
  { to: '/founder', bn: 'প্রতিষ্ঠাতা', en: 'Founder' },
  { to: '/contact', bn: 'যোগাযোগ', en: 'Contact' },
  { to: '/privacy', bn: 'গোপনীয়তা নীতি', en: 'Privacy Policy' },
];

const MENU_SECTIONS = [
  {
    titleBn: 'চাকরি প্রস্তুতি', titleEn: 'Job Preparation',
    links: [
      { to: '/jobs', bn: 'চাকরি প্রস্তুতি', en: 'Job Preparation', soon: true },
      { to: '/exam', bn: 'মডেল টেস্ট', en: 'Model Tests' },
    ],
  },
  {
    titleBn: 'ভর্তি প্রস্তুতি', titleEn: 'Admission Preparation',
    links: [
      { to: '/admissions', bn: 'ভর্তি প্রস্তুতি', en: 'Admission Preparation', soon: true },
      { to: '/exam', bn: 'মডেল টেস্ট', en: 'Model Tests' },
    ],
  },
  {
    titleBn: 'শিক্ষা কার্যক্রম', titleEn: 'Academic Learning',
    links: [
      { to: '/class', bn: 'শ্রেণি বেছে নিন', en: 'Choose Your Class' },
      { to: '/library', bn: 'লাইব্রেরি', en: 'Library' },
      { to: '/directory', bn: 'শিক্ষা নির্দেশিকা', en: 'Education Directory' },
    ],
  },
  {
    titleBn: 'দক্ষতা উন্নয়ন', titleEn: 'Professional Skills',
    links: [{ to: '/skills', bn: 'দক্ষতা উন্নয়ন', en: 'Professional Skills', soon: true }],
  },
];

export default function BottomNav(props: { bottomOffsetPx: number }) {
  const { t } = useLanguage();
  const { user, profile, signOut } = useAuth();
  const location = useLocation();
  const [sheet, setSheet] = useState<Sheet>(null);

  useEffect(() => {
    setSheet(null);
  }, [location.pathname]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setSheet(null);
    }
    if (sheet) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [sheet]);

  const soonChip = <span className="ev-hnav-soon">{t({ bn: 'শীঘ্রই আসছে', en: 'Coming soon' })}</span>;

  return (
    <>
      <nav className="ev-bottom-nav" style={{ bottom: props.bottomOffsetPx }} aria-label={t({ bn: 'মোবাইল মেনু', en: 'Mobile menu' })}>
        <NavLink to="/" end className={({ isActive }) => `ev-bottom-nav-link${isActive ? ' ev-bottom-nav-link-active' : ''}`}>
          <HomeIcon active={location.pathname === '/'} />
          <span>{t({ bn: 'হোম', en: 'Home' })}</span>
        </NavLink>
        <NavLink to="/library" className={({ isActive }) => `ev-bottom-nav-link${isActive ? ' ev-bottom-nav-link-active' : ''}`}>
          <CoursesIcon active={location.pathname.startsWith('/library') || location.pathname.startsWith('/book')} />
          <span>{t({ bn: 'আমার কোর্স', en: 'My Courses' })}</span>
        </NavLink>
        <NavLink to="/progress" className={({ isActive }) => `ev-bottom-nav-link${isActive ? ' ev-bottom-nav-link-active' : ''}`}>
          <ProgressIcon active={location.pathname.startsWith('/progress')} />
          <span>{t({ bn: 'প্রগ্রেস', en: 'Progress' })}</span>
        </NavLink>
        <button
          type="button"
          className={`ev-bottom-nav-link${sheet === 'more' ? ' ev-bottom-nav-link-active' : ''}`}
          aria-expanded={sheet === 'more'}
          onClick={() => setSheet(sheet === 'more' ? null : 'more')}
        >
          <GridIcon />
          <span>{t({ bn: 'বেশি কিছু', en: 'More' })}</span>
        </button>
        <button
          type="button"
          className={`ev-bottom-nav-link${sheet === 'menu' ? ' ev-bottom-nav-link-active' : ''}`}
          aria-expanded={sheet === 'menu'}
          onClick={() => setSheet(sheet === 'menu' ? null : 'menu')}
        >
          <MenuIcon />
          <span>{t({ bn: 'মেনু', en: 'Menu' })}</span>
        </button>
      </nav>

      {sheet ? (
        <div
          className={sheet === 'menu' ? 'ev-sheet-backdrop ev-sheet-backdrop-side' : 'ev-sheet-backdrop'}
          onClick={() => setSheet(null)}
        >
          <div
            className={sheet === 'menu' ? 'ev-sheet ev-drawer' : 'ev-sheet'}
            role="dialog"
            aria-modal="true"
            aria-label={sheet === 'more' ? t({ bn: 'বেশি কিছু', en: 'More' }) : t({ bn: 'মেনু', en: 'Menu' })}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: '1.05rem', margin: 0, color: 'var(--forest)' }}>
                {sheet === 'more' ? t({ bn: 'বেশি কিছু', en: 'More' }) : t({ bn: 'মেনু', en: 'Menu' })}
              </h2>
              <button type="button" className="ev-btn ev-btn-sm" onClick={() => setSheet(null)}>
                ✕ {t({ bn: 'বন্ধ', en: 'Close' })}
              </button>
            </div>

            {sheet === 'more' ? (
              <div style={{ marginTop: 12 }}>
                {MORE_LINKS.map((item) => (
                  <Link key={item.to} to={item.to} className="ev-sheet-link">
                    {t({ bn: item.bn, en: item.en })}
                  </Link>
                ))}
                {profile?.role === 'owner' ? (
                  <Link to="/admin" className="ev-sheet-link" style={{ color: '#8A6100', fontWeight: 700 }}>
                    {t({ bn: 'অ্যাডমিন', en: 'Admin' })}
                  </Link>
                ) : null}
                <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                  {user ? (
                    <>
                      <Link to="/dashboard" className="ev-btn ev-btn-primary ev-btn-sm">
                        {t({ bn: 'ড্যাশবোর্ড', en: 'Dashboard' })}
                      </Link>
                      <button type="button" onClick={() => void signOut()} className="ev-btn ev-btn-sm">
                        {t({ bn: 'লগআউট', en: 'Log out' })}
                      </button>
                    </>
                  ) : (
                    <>
                      <Link to="/login" className="ev-btn ev-btn-primary ev-btn-sm">
                        {t({ bn: 'লগইন', en: 'Log in' })}
                      </Link>
                      <Link to="/register" className="ev-btn ev-btn-sm">
                        {t({ bn: 'রেজিস্টার', en: 'Register' })}
                      </Link>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ marginTop: 12 }}>
                {MENU_SECTIONS.map((section) => (
                  <div key={section.titleBn} style={{ marginBottom: 14 }}>
                    <div style={{ fontWeight: 700, color: 'var(--forest)', marginBottom: 4 }}>
                      {t({ bn: section.titleBn, en: section.titleEn })}
                    </div>
                    {section.links.map((link) => (
                      <Link key={`${link.to}-${link.bn}`} to={link.to} className="ev-sheet-link">
                        <span>{t({ bn: link.bn, en: link.en })}</span>
                        {link.soon ? soonChip : null}
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
