import { useEffect, useState } from 'react';
import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { strings } from './i18n/strings';
import { useAuth } from './lib/auth';
import { isBottomBannerAllowed, adsEnabled, BOTTOM_BANNER_RESERVE_PX } from './lib/ads';
import AdSlot from './components/AdSlot';
import InstallAppPrompt from './components/InstallAppPrompt';
import HomePage from './pages/HomePage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import TeacherRegisterPage from './pages/TeacherRegisterPage';
import DirectoryPage from './pages/DirectoryPage';
import SubjectPage from './pages/SubjectPage';
import LibraryPage from './pages/LibraryPage';
import BookPage from './pages/BookPage';
import ChapterPage from './pages/ChapterPage';
import LessonPage from './pages/LessonPage';
import QuizPage from './pages/QuizPage';
import QuizResultPage from './pages/QuizResultPage';
import AdminPage from './pages/AdminPage';
import AdminAds from './pages/AdminAds';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminUserDetailPage from './pages/AdminUserDetailPage';
import AdminTeachersPage from './pages/AdminTeachersPage';
import AdminFeaturesPage from './pages/AdminFeaturesPage';
import AdminBackupPage from './pages/AdminBackupPage';
import AdminAuditPage from './pages/AdminAuditPage';
import { AdminGuard } from './components/AdminGuard';
import AiTeacherPage from './pages/AiTeacherPage';
import ExamPage from './pages/ExamPage';
import RoutinePage from './pages/RoutinePage';
import ProgressPage from './pages/ProgressPage';
import SocialPage from './pages/SocialPage';
import HealthPage from './pages/HealthPage';
import HealthMedicinesPage from './pages/HealthMedicinesPage';
import HealthDiseasesPage from './pages/HealthDiseasesPage';
import HealthDoctorsPage from './pages/HealthDoctorsPage';
import HealthHospitalsPage from './pages/HealthHospitalsPage';
import HealthReportPage from './pages/HealthReportPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';

// Routes mirror page-map.md + the Phase 2 route list.
// /social is a DESIGN PROPOSAL only (blueprint §7): no live social
// features, no messaging, until safety + moderation are ready.
// /ai-teacher is a scripted demonstration, not live AI (blueprint §5).
// Step 1: the header reflects the auth state, and a suspended account
// (profile isActive === false) sees only the suspended screen — Auth
// login still succeeds, but the app cannot be used (plan Step 1).
export default function App() {
  const nav = strings.nav;
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
    <div style={bannerLive ? { paddingBottom: `calc(${BOTTOM_BANNER_RESERVE_PX}px + env(safe-area-inset-bottom, 0px))` } : undefined}>
      <header className="ev-header">
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }} aria-label="Eduvelto — হোম">
          <img src="/logo-white.png" alt="Eduvelto" style={{ height: 40, width: 'auto', display: 'block' }} />
        </Link>
        <span className="ev-header-tagline">{strings.tagline.bn}</span>
        <button
          type="button"
          className="ev-menu-btn"
          aria-expanded={menuOpen}
          aria-controls="ev-main-nav"
          aria-label={menuOpen ? 'মেনু বন্ধ করুন / Close menu' : 'মেনু খুলুন / Open menu'}
          onClick={() => setMenuOpen((o) => !o)}
        >
          {menuOpen ? '✕ বন্ধ' : '☰ মেনু'}
        </button>
        <nav aria-label="প্রধান মেনু" id="ev-main-nav" className={`ev-header-nav${menuOpen ? ' ev-header-nav-open' : ''}`}>
          <NavLink to="/directory" className={({ isActive }) => `ev-navlink${isActive ? ' ev-navlink-active' : ''}`}>{nav.directory.bn}</NavLink>
          <NavLink to="/library" className={({ isActive }) => `ev-navlink${isActive ? ' ev-navlink-active' : ''}`}>{nav.library.bn}</NavLink>
          <NavLink to="/exam" className={({ isActive }) => `ev-navlink${isActive ? ' ev-navlink-active' : ''}`}>{nav.exam.bn}</NavLink>
          <NavLink to="/routine" className={({ isActive }) => `ev-navlink${isActive ? ' ev-navlink-active' : ''}`}>{nav.routine.bn}</NavLink>
          <NavLink to="/progress" className={({ isActive }) => `ev-navlink${isActive ? ' ev-navlink-active' : ''}`}>{nav.progress.bn}</NavLink>
          <NavLink to="/health" className={({ isActive }) => `ev-navlink${isActive ? ' ev-navlink-active' : ''}`}>{nav.health.bn}</NavLink>
          <NavLink to="/about" className={({ isActive }) => `ev-navlink${isActive ? ' ev-navlink-active' : ''}`}>{nav.about.bn}</NavLink>
          <NavLink to="/contact" className={({ isActive }) => `ev-navlink${isActive ? ' ev-navlink-active' : ''}`}>{nav.contact.bn}</NavLink>
          {profile?.role === 'owner' ? (
            <NavLink to="/admin" className={({ isActive }) => `ev-navlink${isActive ? ' ev-navlink-active' : ''}`} style={{ color: '#F1B308', fontWeight: 700 }}>{nav.admin.bn}</NavLink>
          ) : null}
          {loading ? null : user ? (
            <>
              <NavLink to="/profile" className={({ isActive }) => `ev-navlink${isActive ? ' ev-navlink-active' : ''}`}>
                {profile?.displayName ?? nav.profile.bn}
              </NavLink>
              <button
                type="button"
                onClick={() => void signOut()}
                className="ev-btn ev-btn-sm ev-btn-header"
              >
                {nav.logout.bn}
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={({ isActive }) => `ev-navlink${isActive ? ' ev-navlink-active' : ''}`}>{nav.login.bn}</NavLink>
              <NavLink to="/register" className={({ isActive }) => `ev-navlink${isActive ? ' ev-navlink-active' : ''}`}>{nav.register.bn}</NavLink>
            </>
          )}
        </nav>
      </header>
      {suspended ? (
        <main style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px', fontFamily: 'system-ui, sans-serif' }}>
          <div style={{ border: '1px solid #b00020', borderRadius: 8, padding: '20px 16px', background: '#fdf0f0' }}>
            <h1 style={{ marginTop: 0, color: '#b00020', fontSize: 24 }}>{strings.profile.suspendedTitle.bn}</h1>
            <p>{strings.profile.suspendedBody.bn}</p>
            <p style={{ color: '#555' }}>{strings.profile.suspendedBody.en}</p>
            {profile?.suspendedReason ? (
              <p>
                <strong>স্থগিতের কারণ / Reason:</strong> {profile.suspendedReason}
              </p>
            ) : null}
            <p style={{ color: '#555', fontSize: 14 }}>
              আপিল করতে অ্যাডমিনের সঙ্গে যোগাযোগ করুন (সাপোর্ট পাতা / ইমেইল)। / To appeal, contact
              an admin (support page / email). আপনি মালিক হলে: Firebase console → Firestore →
              users → আপনার ডকুমেন্ট → isActive ফিল্ডটি মুছে দিন (শুধু মালিকের অ্যাকাউন্টের
              ক্ষেত্রে)। / If you are the owner: Firebase console → Firestore → users → your
              document → delete the isActive field.
            </p>
            <button
              type="button"
              onClick={() => void signOut()}
              style={{ padding: '10px 18px', minHeight: 48, fontSize: 16, borderRadius: 6, border: 'none', background: '#0A1F44', color: '#fff', cursor: 'pointer' }}
            >
              {nav.logout.bn} / {nav.logout.en}
            </button>
          </div>
        </main>
      ) : (
        <>
        <InstallAppPrompt />
        <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/profile" element={<ProfilePage />} />
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
        <Route path="/admin/features" element={<AdminGuard><AdminFeaturesPage /></AdminGuard>} />
        <Route path="/admin/backup" element={<AdminGuard><AdminBackupPage /></AdminGuard>} />
        <Route path="/admin/audit" element={<AdminGuard><AdminAuditPage /></AdminGuard>} />
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
        <Route path="/contact" element={<ContactPage />} />
        <Route path="*" element={<HomePage />} />
        </Routes>
        {showBottomBanner ? <AdSlot placement="bottom-banner" /> : null}
        </>
      )}
    </div>
  );
}
