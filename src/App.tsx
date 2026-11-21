import { Suspense, lazy } from 'react';
import { Link, Route, Routes, useLocation } from 'react-router-dom';
import { strings } from './i18n/strings';
import { useAuth } from './lib/auth';
import { isBottomBannerAllowed, adsEnabled, BOTTOM_BANNER_RESERVE_PX } from './lib/ads';
import AdSlot from './components/AdSlot';
import InstallAppPrompt from './components/InstallAppPrompt';
import { AdminGuard } from './components/AdminGuard';
// SCALE (10k users): route-level code splitting. Before this change the
// first visit downloaded ALL 35 pages in one 909 kB bundle (admin pages
// included, for every visitor). Now the first load is only the shell +
// Home; each route's chunk loads on demand. The header, auth and ad
// shell stay static — they are small and needed on every page.
const HomePage = lazy(() => import('./pages/HomePage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
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
const AdminFeaturesPage = lazy(() => import('./pages/AdminFeaturesPage'));
const AdminBackupPage = lazy(() => import('./pages/AdminBackupPage'));
const AdminAuditPage = lazy(() => import('./pages/AdminAuditPage'));
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
  return (
    <div style={bannerLive ? { paddingBottom: `calc(${BOTTOM_BANNER_RESERVE_PX}px + env(safe-area-inset-bottom, 0px))` } : undefined}>
      <header
        style={{
          background: '#0A1F44',
          color: '#fff',
          padding: '12px 16px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 16,
          alignItems: 'center',
        }}
      >
        <Link to="/" style={{ color: '#f5c542', fontWeight: 700, textDecoration: 'none', fontSize: 20 }}>
          Eduvelto
        </Link>
        <span style={{ fontSize: 14 }}>{strings.tagline.bn}</span>
        <nav aria-label="প্রধান মেনু" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginLeft: 'auto', alignItems: 'center' }}>
          <Link to="/directory" style={{ color: '#fff', padding: '10px 6px' }}>{nav.directory.bn}</Link>
          <Link to="/library" style={{ color: '#fff', padding: '10px 6px' }}>{nav.library.bn}</Link>
          <Link to="/exam" style={{ color: '#fff', padding: '10px 6px' }}>{nav.exam.bn}</Link>
          <Link to="/routine" style={{ color: '#fff', padding: '10px 6px' }}>{nav.routine.bn}</Link>
          <Link to="/progress" style={{ color: '#fff', padding: '10px 6px' }}>{nav.progress.bn}</Link>
          <Link to="/health" style={{ color: '#fff', padding: '10px 6px' }}>{nav.health.bn}</Link>
          <Link to="/about" style={{ color: '#fff', padding: '10px 6px' }}>{nav.about.bn}</Link>
          <Link to="/founder" style={{ color: '#fff', padding: '10px 6px' }}>{nav.founder.bn}</Link>
          <Link to="/contact" style={{ color: '#fff', padding: '10px 6px' }}>{nav.contact.bn}</Link>
          {profile?.role === 'owner' ? (
            <Link to="/admin" style={{ color: '#F1B308', padding: '10px 6px', fontWeight: 700 }}>{nav.admin.bn}</Link>
          ) : null}
          {loading ? null : user ? (
            <>
              <Link to="/profile" style={{ color: '#fff', padding: '10px 6px' }}>
                {profile?.displayName ?? nav.profile.bn}
              </Link>
              <button
                type="button"
                onClick={() => void signOut()}
                style={{ background: 'transparent', border: '1px solid #fff', color: '#fff', borderRadius: 6, padding: '10px 16px', minHeight: 44, cursor: 'pointer', fontSize: 14 }}
              >
                {nav.logout.bn}
              </button>
            </>
          ) : (
            <>
              <Link to="/login" style={{ color: '#fff', padding: '10px 6px' }}>{nav.login.bn}</Link>
              <Link to="/register" style={{ color: '#fff', padding: '10px 6px' }}>{nav.register.bn}</Link>
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
        <Suspense fallback={<main style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px' }}><p>লোড হচ্ছে… / Loading…</p></main>}>
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
        <Route path="/founder" element={<FounderPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="*" element={<HomePage />} />
        </Routes>
        </Suspense>
        {showBottomBanner ? <AdSlot placement="bottom-banner" /> : null}
        </>
      )}
    </div>
  );
}
