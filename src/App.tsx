import { Link, Route, Routes, useLocation } from 'react-router-dom';
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
import AdminTeamPage from './pages/AdminTeamPage';
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
import FounderPage from './pages/FounderPage';
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
        <Route path="/admin/team" element={<AdminGuard><AdminTeamPage /></AdminGuard>} />
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
        {showBottomBanner ? <AdSlot placement="bottom-banner" /> : null}
        </>
      )}
    </div>
  );
}
