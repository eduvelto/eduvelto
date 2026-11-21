import { Suspense, lazy, useEffect, useState } from 'react';
import { Link, Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { strings } from './i18n/strings';
import { useAuth } from './lib/auth';
import { isBottomBannerAllowed, adsEnabled, BOTTOM_BANNER_RESERVE_PX } from './lib/ads';
import AdSlot from './components/AdSlot';
import BottomNav from './components/BottomNav';
import Footer from './components/Footer';
import InstallAppPrompt from './components/InstallAppPrompt';
import { AdminGuard } from './components/AdminGuard';
import { T, useLanguage } from './i18n/LanguageContext';
// SCALE (10k users): route-level code splitting. Before this change the
// first visit downloaded ALL 35 pages in one 909 kB bundle (admin pages
// included, for every visitor). Now the first load is only the shell +
// Home; each route's chunk loads on demand. The header, auth and ad
// shell stay static — they are small and needed on every page.
const HomePage = lazy(() => import('./pages/HomePage'));
const ClassDashboardPage = lazy(() => import('./pages/ClassDashboardPage'));
const ClassSubjectPage = lazy(() => import('./pages/ClassSubjectPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const RoleSetupPage = lazy(() => import('./pages/RoleSetupPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const StudentDashboardPage = lazy(() => import('./pages/StudentDashboardPage'));
const TeacherDashboardPage = lazy(() => import('./pages/TeacherDashboardPage'));
const GuardianDashboardPage = lazy(() => import('./pages/GuardianDashboardPage'));
const GuardianLinksPage = lazy(() => import('./pages/GuardianLinksPage'));
const TeacherRegisterPage = lazy(() => import('./pages/TeacherRegisterPage'));
const DirectoryPage = lazy(() => import('./pages/DirectoryPage'));
const SubjectPage = lazy(() => import('./pages/SubjectPage'));
const LibraryPage = lazy(() => import('./pages/LibraryPage'));
const BookPage = lazy(() => import('./pages/BookPage'));
const ChapterPage = lazy(() => import('./pages/ChapterPage'));
const LessonPage = lazy(() => import('./pages/LessonPage'));
const QuizPage = lazy(() => import('./pages/QuizPage'));
const QuizResultPage = lazy(() => import('./pages/QuizResultPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const AdminAds = lazy(() => import('./pages/AdminAds'));
const AdminUsersPage = lazy(() => import('./pages/AdminUsersPage'));
const AdminUserDetailPage = lazy(() => import('./pages/AdminUserDetailPage'));
const AdminTeachersPage = lazy(() => import('./pages/AdminTeachersPage'));
const AdminGuardiansPage = lazy(() => import('./pages/AdminGuardiansPage'));
const AdminFeaturesPage = lazy(() => import('./pages/AdminFeaturesPage'));
const AdminBackupPage = lazy(() => import('./pages/AdminBackupPage'));
const AdminAuditPage = lazy(() => import('./pages/AdminAuditPage'));
const CeoLayout = lazy(() => import('./components/CeoLayout'));
const CeoHomePage = lazy(() => import('./pages/CeoHomePage'));
const CeoDashboardPage = lazy(() => import('./pages/CeoDashboardPage'));
const CeoStrategyPage = lazy(() => import('./pages/CeoStrategyPage'));
const CeoRevenuePage = lazy(() => import('./pages/CeoRevenuePage'));
const CeoTeamPage = lazy(() => import('./pages/CeoTeamPage'));
const CeoContentPage = lazy(() => import('./pages/CeoContentPage'));
const CeoGrowthPage = lazy(() => import('./pages/CeoGrowthPage'));
const CeoSettingsPage = lazy(() => import('./pages/CeoSettingsPage'));
const CeoApprovalsPage = lazy(() => import('./pages/CeoApprovalsPage'));
const AiTeacherPage = lazy(() => import('./pages/AiTeacherPage'));
const ExamPage = lazy(() => import('./pages/ExamPage'));
const RoutinePage = lazy(() => import('./pages/RoutinePage'));
const ProgressPage = lazy(() => import('./pages/ProgressPage'));
const SocialPage = lazy(() => import('./pages/SocialPage'));
const HealthPage = lazy(() => import('./pages/HealthPage'));
const HealthMedicinesPage = lazy(() => import('./pages/HealthMedicinesPage'));
const HealthDiseasesPage = lazy(() => import('./pages/HealthDiseasesPage'));
const HealthDoctorsPage = lazy(() => import('./pages/HealthDoctorsPage'));
const HealthHospitalsPage = lazy(() => import('./pages/HealthHospitalsPage'));
const HealthReportPage = lazy(() => import('./pages/HealthReportPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
// STAGING MERGE (scale #4): FounderPage added as lazy — the scale branch
// was based on f112b5c (pre-founder) and had no /founder route at all;
// main 054c230 + the live site do, so the route is restored here.
const FounderPage = lazy(() => import('./pages/FounderPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));

// Step 5 — role-based dashboards: /dashboard routes by the signed-in
// user's role. Owner/admin/moderator go to the Owner Admin Dashboard
// (/admin); student → /student, teacher → /teacher, guardian →
// /guardian. A signed-in user with NO profile yet (Google sign-in
// mid-role-setup) goes to /register/role; a signed-out visitor goes
// to /login.
function DashboardRedirect() {
  const { user, profile, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!profile) return <Navigate to="/register/role" replace />;
  if (profile.role === 'owner' || profile.role === 'admin' || profile.role === 'moderator') {
    return <Navigate to="/admin" replace />;
  }
  if (profile.role === 'teacher') return <Navigate to="/teacher" replace />;
  if (profile.role === 'parent') return <Navigate to="/guardian" replace />;
  return <Navigate to="/student" replace />;
}

// Routes mirror page-map.md + the Phase 2 route list.
// /social is a DESIGN PROPOSAL only (blueprint §7): no live social
// features, no messaging, until safety + moderation are ready.
// /ai-teacher is a scripted demonstration, not live AI (blueprint §5).
// Step 1: the header reflects the auth state, and a suspended account
// (profile isActive === false) sees only the suspended screen — Auth
// login still succeeds, but the app cannot be used (plan Step 1).
export default function App() {
  const nav = strings.nav;
  const { t } = useLanguage();
  const { user, profile, suspended, loading, signOut } = useAuth();
  const location = useLocation();
  // Persistent bottom banner (owner brief 20 Nov 21:52): fixed to the
  // viewport bottom, outside the router outlet, on all eligible pages
  // (including lessons, quizzes, exams, AI Teacher). It renders nothing
  // until AdSense is configured, so the banner is live only when
  // adsEnabled('bottom-banner') is true. While live, the page reserves
  // the banner's height (+ safe-area inset) as bottom padding, so the
  // fixed banner never covers content, buttons or essential controls.
  // When ads are not configured there is no reservation and no gap.
  const showBottomBanner = isBottomBannerAllowed(location.pathname);
  const bannerLive = showBottomBanner && adsEnabled('bottom-banner');
  // Mobile menu (≤860px): the full nav would wrap into 3 rows, so it lives
  // behind a hamburger button and closes on every navigation.
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);
  return (
    <div
      className="ev-app-shell"
      style={
        bannerLive
          ? ({ '--ev-banner': `${BOTTOM_BANNER_RESERVE_PX}px` } as React.CSSProperties)
          : undefined
      }
    >
      <header className="ev-header">
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }} aria-label={t({ bn: 'Eduvelto — হোম', en: 'Eduvelto — Home' })}>
          <img src="/logo-white.png" alt="Eduvelto" style={{ height: 40, width: 'auto', display: 'block' }} />
        </Link>
        <span className="ev-header-tagline">{t(strings.tagline)}</span>
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
          <NavLink to="/directory" className={({ isActive }) => `ev-navlink${isActive ? ' ev-navlink-active' : ''}`}>{t(nav.directory)}</NavLink>
          <NavLink to="/library" className={({ isActive }) => `ev-navlink${isActive ? ' ev-navlink-active' : ''}`}>{t(nav.library)}</NavLink>
          <NavLink to="/exam" className={({ isActive }) => `ev-navlink${isActive ? ' ev-navlink-active' : ''}`}>{t(nav.exam)}</NavLink>
          <NavLink to="/routine" className={({ isActive }) => `ev-navlink${isActive ? ' ev-navlink-active' : ''}`}>{t(nav.routine)}</NavLink>
          <NavLink to="/progress" className={({ isActive }) => `ev-navlink${isActive ? ' ev-navlink-active' : ''}`}>{t(nav.progress)}</NavLink>
          <NavLink to="/health" className={({ isActive }) => `ev-navlink${isActive ? ' ev-navlink-active' : ''}`}>{t(nav.health)}</NavLink>
          <NavLink to="/about" className={({ isActive }) => `ev-navlink${isActive ? ' ev-navlink-active' : ''}`}>{t(nav.about)}</NavLink>
          <NavLink to="/founder" className={({ isActive }) => `ev-navlink${isActive ? ' ev-navlink-active' : ''}`}>{t(nav.founder)}</NavLink>
          <NavLink to="/contact" className={({ isActive }) => `ev-navlink${isActive ? ' ev-navlink-active' : ''}`}>{t(nav.contact)}</NavLink>
          {profile?.role === 'owner' ? (
            <NavLink to="/admin" className={({ isActive }) => `ev-navlink${isActive ? ' ev-navlink-active' : ''}`} style={{ color: '#D9A441', fontWeight: 700 }}>{t(nav.admin)}</NavLink>
          ) : null}
          {loading ? null : user ? (
            <>
              <NavLink to="/dashboard" className={({ isActive }) => `ev-navlink${isActive ? ' ev-navlink-active' : ''}`}>{t(nav.dashboard)}</NavLink>
              <NavLink to="/profile" className={({ isActive }) => `ev-navlink${isActive ? ' ev-navlink-active' : ''}`}>
                {profile?.displayName ?? t(nav.profile)}
              </NavLink>
              <button
                type="button"
                onClick={() => void signOut()}
                className="ev-btn ev-btn-sm ev-btn-header"
              >
                {t(nav.logout)}
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={({ isActive }) => `ev-navlink${isActive ? ' ev-navlink-active' : ''}`}>{t(nav.login)}</NavLink>
              <NavLink to="/register" className={({ isActive }) => `ev-navlink${isActive ? ' ev-navlink-active' : ''}`}>{t(nav.register)}</NavLink>
            </>
          )}
        </nav>
      </header>
      {suspended ? (
        <main style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px', fontFamily: 'system-ui, sans-serif' }}>
          <div style={{ border: '1px solid #b00020', borderRadius: 8, padding: '20px 16px', background: '#fdf0f0' }}>
            <h1 style={{ marginTop: 0, color: '#b00020', fontSize: 24 }}>{t(strings.profile.suspendedTitle)}</h1>
            <p>{t(strings.profile.suspendedBody)}</p>
            {profile?.suspendedReason ? (
              <p>
                <strong>{t({ bn: 'স্থগিতের কারণ', en: 'Reason' })}:</strong> {profile.suspendedReason}
              </p>
            ) : null}
            <p style={{ color: '#555', fontSize: 14 }}>
              {t({ bn: 'আপিল করতে অ্যাডমিনের সঙ্গে যোগাযোগ করুন (সাপোর্ট পাতা / ইমেইল)। আপনি মালিক হলে: Firebase console → Firestore → users → আপনার ডকুমেন্ট → isActive ফিল্ডটি মুছে দিন (শুধু মালিকের অ্যাকাউন্টের ক্ষেত্রে)।', en: 'To appeal, contact an admin (support page / email). If you are the owner: Firebase console → Firestore → users → your document → delete the isActive field.' })}
            </p>
            <button
              type="button"
              onClick={() => void signOut()}
              style={{ padding: '10px 18px', minHeight: 48, fontSize: 16, borderRadius: 6, border: 'none', background: '#142B3B', color: '#fff', cursor: 'pointer' }}
            >
              <T bn={nav.logout.bn} en={nav.logout.en} />
            </button>
          </div>
        </main>
      ) : (
        <>
        <InstallAppPrompt />
        <Suspense fallback={<main style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px' }}><p>{t(strings.common.loading)}</p></main>}>
        <Routes>
        <Route path="/" element={<HomePage />} />
        {/* Class-wise navigation (stage 3): Select Class → Class Dashboard → Tab → Subject → Book → Chapter. */}
        <Route path="/class/:slug/subjects/:dept" element={<ClassSubjectPage />} />
        <Route path="/class/:slug/:tab" element={<ClassDashboardPage />} />
        <Route path="/class/:slug" element={<ClassDashboardPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/register/role" element={<RoleSetupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/guardian-links" element={<GuardianLinksPage />} />
        <Route path="/dashboard" element={<DashboardRedirect />} />
        <Route path="/student" element={<StudentDashboardPage />} />
        <Route path="/teacher" element={<TeacherDashboardPage />} />
        <Route path="/guardian" element={<GuardianDashboardPage />} />
        <Route path="/teacher/register" element={<TeacherRegisterPage />} />
        <Route path="/directory" element={<DirectoryPage />} />
        <Route path="/subjects/:subjectId" element={<SubjectPage />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/library/:bookId" element={<BookPage />} />
        <Route path="/books/:bookId/chapters/:chapterId" element={<ChapterPage />} />
        <Route path="/lessons/:lessonId" element={<LessonPage />} />
        <Route path="/quiz/:quizId" element={<QuizPage />} />
        <Route path="/quiz/:quizId/result/:attemptId" element={<QuizResultPage />} />
        <Route path="/admin" element={<AdminGuard><AdminPage /></AdminGuard>} />
        <Route path="/admin/ads" element={<AdminGuard><AdminAds /></AdminGuard>} />
        <Route path="/admin/users" element={<AdminGuard><AdminUsersPage /></AdminGuard>} />
        <Route path="/admin/users/:uid" element={<AdminGuard><AdminUserDetailPage /></AdminGuard>} />
        <Route path="/admin/teachers" element={<AdminGuard><AdminTeachersPage /></AdminGuard>} />
        <Route path="/admin/guardians" element={<AdminGuard><AdminGuardiansPage /></AdminGuard>} />
        <Route path="/admin/features" element={<AdminGuard><AdminFeaturesPage /></AdminGuard>} />
        <Route path="/admin/backup" element={<AdminGuard><AdminBackupPage /></AdminGuard>} />
        <Route path="/admin/audit" element={<AdminGuard><AdminAuditPage /></AdminGuard>} />
        {/* CEO Panel (owner-only, 21 Nov 2026): the 8-screen mobile
            design from the owner's mockup. Same AdminGuard as /admin —
            owner role only; the layout renders the CEO bottom nav. */}
        <Route path="/ceo" element={<AdminGuard><CeoLayout titleBn="সিইও প্যানেল" titleEn="CEO Panel" /></AdminGuard>}>
          <Route index element={<CeoHomePage />} />
          <Route path="dashboard" element={<CeoDashboardPage />} />
          <Route path="strategy" element={<CeoStrategyPage />} />
          <Route path="revenue" element={<CeoRevenuePage />} />
          <Route path="team" element={<CeoTeamPage />} />
          <Route path="content" element={<CeoContentPage />} />
          <Route path="growth" element={<CeoGrowthPage />} />
          <Route path="settings" element={<CeoSettingsPage />} />
          <Route path="approvals" element={<CeoApprovalsPage />} />
        </Route>
        <Route path="/ai-teacher" element={<AiTeacherPage />} />
        <Route path="/exam" element={<ExamPage />} />
        <Route path="/routine" element={<RoutinePage />} />
        <Route path="/progress" element={<ProgressPage />} />
        <Route path="/social" element={<SocialPage />} />
        <Route path="/health" element={<HealthPage />} />
        <Route path="/health/medicines" element={<HealthMedicinesPage />} />
        <Route path="/health/diseases" element={<HealthDiseasesPage />} />
        <Route path="/health/doctors" element={<HealthDoctorsPage />} />
        <Route path="/health/hospitals" element={<HealthHospitalsPage />} />
        <Route path="/health/report" element={<HealthReportPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/founder" element={<FounderPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="*" element={<HomePage />} />
        </Routes>
        </Suspense>
        <Footer />
        {/* Mobile bottom navigation (stage 3): Home / Books / Tests / Progress / Profile, ≤768px. Sits above the bottom ad banner when one is live. Hidden on /ceo* routes — the CEO Panel renders its own bottom nav. */}
        {location.pathname.startsWith('/ceo') ? null : (
          <BottomNav bottomOffsetPx={bannerLive ? BOTTOM_BANNER_RESERVE_PX : 0} />
        )}
        {showBottomBanner ? <AdSlot placement="bottom-banner" /> : null}
        </>
      )}
    </div>
  );
}
