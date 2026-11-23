import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { strings } from './i18n/strings';
import { useAuth } from './lib/auth';
import {
  adsActive,
  getBannerPlacementForPath,
  getBannerReservePx,
  isPreviewHost,
} from './lib/adsConfig';
import AdSlot from './components/AdSlot';
import BottomNav from './components/BottomNav';
import GreetingBar from './components/GreetingBar';
import HeaderNav from './components/HeaderNav';
import Footer from './components/Footer';
import InstallAppPrompt from './components/InstallAppPrompt';
import {
  AppVersionBlockedScreen,
  AppVersionUpdateBar,
  isGateExemptPath,
  useAppVersionGate,
} from './components/AppVersionGate';
import { AdminGuard } from './components/AdminGuard';
import { RouteSeo } from './components/RouteSeo';
import { NuQuestionWorkbenchGuard } from './components/NuQuestionWorkbenchGuard';
import { T, useLanguage } from './i18n/LanguageContext';
// SCALE (10k users): route-level code splitting. Before this change the
// first visit downloaded ALL 35 pages in one 909 kB bundle (admin pages
// included, for every visitor). Now the first load is only the shell +
// Home; each route's chunk loads on demand. The header, auth and ad
// shell stay static — they are small and needed on every page.
const HomePage = lazy(() => import('./pages/HomePage'));
const ClassIndexPage = lazy(() => import('./pages/ClassIndexPage'));
const ComingSoonPage = lazy(() => import('./pages/ComingSoonPage'));
const ClassDashboardPage = lazy(() => import('./pages/ClassDashboardPage'));
const ClassSubjectPage = lazy(() => import('./pages/ClassSubjectPage'));
const JobsPage = lazy(() => import('./pages/JobsPage'));
const JobHubPage = lazy(() => import('./pages/JobHubPage'));
const JobSubjectPage = lazy(() => import('./pages/JobSubjectPage'));
const JobTopicPage = lazy(() => import('./pages/JobTopicPage'));
const JobsCommonPage = lazy(() => import('./pages/JobsCommonPage'));
const JobPracticePage = lazy(() => import('./pages/JobPracticePage'));
const JobMockPage = lazy(() => import('./pages/JobMockPage'));
const JobResultPage = lazy(() => import('./pages/JobResultPage'));
const JobAnalysisPage = lazy(() => import('./pages/JobAnalysisPage'));
const JobSeekerDashboardPage = lazy(() => import('./pages/JobSeekerDashboardPage'));
const JobPlannerPage = lazy(() => import('./pages/JobPlannerPage'));
const JobWrongAnswersPage = lazy(() => import('./pages/JobWrongAnswersPage'));
const JobWrongAnswersPracticePage = lazy(() => import('./pages/JobWrongAnswersPracticePage'));
const JobCircularsPage = lazy(() => import('./pages/JobCircularsPage'));
const JobCircularDetailPage = lazy(() => import('./pages/JobCircularDetailPage'));
const JobCalendarPage = lazy(() => import('./pages/JobCalendarPage'));
const JobNotificationsPage = lazy(() => import('./pages/JobNotificationsPage'));
const JobGuidePage = lazy(() => import('./pages/JobGuidePage'));
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
const AdminNuStructurePage = lazy(() => import('./pages/AdminNuStructurePage'));
const AdminNuSyllabusPage = lazy(() => import('./pages/AdminNuSyllabusPage'));
const AdminNuQuestionsPage = lazy(() => import('./pages/AdminNuQuestionsPage'));
// NU-5: National University admission hub (design §5) — index, hub +
// 8 tabs, group pages, candidate dashboard. Static group routes rank
// above the hub's `:tab` route, so the two never collide.
const AdminLayout = lazy(() => import('./components/AdminLayout'));
const AdminJobsPage = lazy(() => import('./pages/AdminJobsPage'));
const AdminJobCircularsPage = lazy(() => import('./pages/AdminJobCircularsPage'));
const AdminJobCircularEditPage = lazy(() => import('./pages/AdminJobCircularEditPage'));
const AdminJobReportsPage = lazy(() => import('./pages/AdminJobReportsPage'));
const AdminJobCorrectionsPage = lazy(() => import('./pages/AdminJobCorrectionsPage'));
const AdminJobDomainsPage = lazy(() => import('./pages/AdminJobDomainsPage'));
const AdminAdmissionsPage = lazy(() => import('./pages/AdminAdmissionsPage'));
const AdminAnalyticsPage = lazy(() => import('./pages/AdminAnalyticsPage'));
const AdminSettingsPage = lazy(() => import('./pages/AdminSettingsPage'));
const AdminContentPage = lazy(() => import('./pages/AdminContentPage'));
const AdminExamsPage = lazy(() => import('./pages/AdminExamsPage'));
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
const AdminAppVersionPage = lazy(() => import('./pages/AdminAppVersionPage'));
const InstallPage = lazy(() => import('./pages/InstallPage'));
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
const LifeHubPage = lazy(() => import('./pages/LifeHubPage'));
const LifeBudgetPage = lazy(() => import('./pages/LifeBudgetPage'));
const LifeCalculatorsPage = lazy(() => import('./pages/LifeCalculatorsPage'));
const LifeConvertersPage = lazy(() => import('./pages/LifeConvertersPage'));
const LifePlannerPage = lazy(() => import('./pages/LifePlannerPage'));
const LifePdfToolsPage = lazy(() => import('./pages/LifePdfToolsPage'));
const LifeHealthPage = lazy(() => import('./pages/LifeHealthPage'));
const LifeGovernmentPage = lazy(() => import('./pages/LifeGovernmentPage'));
const LifeTravelPage = lazy(() => import('./pages/LifeTravelPage'));
const LifeServicesPage = lazy(() => import('./pages/LifeServicesPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
// STAGING MERGE (scale #4): FounderPage added as lazy — the scale branch
// was based on f112b5c (pre-founder) and had no /founder route at all;
// main 054c230 + the live site do, so the route is restored here.
const FounderPage = lazy(() => import('./pages/FounderPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const WhyEduveltoPage = lazy(() => import('./pages/WhyEduveltoPage'));
const AdmissionsIndexPage = lazy(() => import('./pages/AdmissionsIndexPage'));
const NuHubPage = lazy(() => import('./pages/NuHubPage'));
const NuGroupPage = lazy(() => import('./pages/NuGroupPage'));
const NuSubjectPage = lazy(() => import('./pages/NuSubjectPage'));
const NuTopicPage = lazy(() => import('./pages/NuTopicPage'));
const AdmissionsDashboardPage = lazy(() => import('./pages/AdmissionsDashboardPage'));

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
  const { t } = useLanguage();
  const { profile, suspended, signOut } = useAuth();
  const location = useLocation();
  // FORCED APP UPDATE (owner brief 22 Nov 2026): on every app load the
  // gate fetches config/appVersion from the server (no cache). If this
  // bundled version is below minVersion, the WHOLE shell is replaced by
  // the block screen — no header, nav, footer or routes are usable.
  // /install, /login and /admin/* are exempt (see AppVersionGate), so the
  // owner can always reach the fix. While 'checking'/'unknown' (offline)
  // the app renders normally — fail open, never block on a slow check.
  const { status: appVersionStatus, config: appVersionConfig } = useAppVersionGate();
  if (appVersionStatus === 'blocked' && !isGateExemptPath(location.pathname)) {
    return <AppVersionBlockedScreen config={appVersionConfig} />;
  }
  // Persistent bottom banner (ads placement plan 22 Nov 2026 — see
  // team/ads-placement-plan-2026-11-22.md and lib/adsConfig.ts).
  // getBannerPlacementForPath() decides the variant per route:
  // - null: NO banner at all — login/register, admin, EXAM pages
  //   (23 Nov 2026: NO ads during exams — the 22 Nov small-banner rule
  //   is superseded), AI Teacher pages (the whole page is a conversation
  //   surface), and profile pages.
  // - 'bottom-banner': every other page, INCLUDING quiz/job RESULT
  //   pages (after the quiz ends — "quiz only AFTER the quiz ends").
  //   Mandatory, no off-switch.
  // - 'bottom-banner-small': RETAINED as a code path only; no route
  //   returns it any more.
  // The banner renders nothing until AdSense is configured AND the
  // master switch is on (adsActive). While live — or while its labelled
  // preview placeholder shows on a preview host — the page reserves the
  // banner's height (+ safe-area inset) as bottom padding, so the fixed
  // banner never covers content, buttons or essential controls. When
  // ads are not configured there is no reservation and no gap.
  const bannerPlacement = getBannerPlacementForPath(location.pathname);
  const bannerLive = bannerPlacement !== null && adsActive(bannerPlacement);
  const bannerReservePx =
    bannerPlacement !== null ? getBannerReservePx(bannerPlacement) : 0;
  // The preview placeholder (labelled, preview host only) also needs
  // its reserved space, or it would cover content in the preview.
  const bannerVisible =
    bannerPlacement !== null && (bannerLive || isPreviewHost());
  // Admin + CEO panels render their own shell (sidebar/top bar/bottom
  // nav) — the public header, footer and BottomNav are hidden there.
  const isAdminShell = location.pathname.startsWith('/admin') || location.pathname.startsWith('/ceo');
  return (
    <div
      className="ev-app-shell"
      style={
        bannerVisible
          ? ({ '--ev-banner': `${bannerReservePx}px` } as React.CSSProperties)
          : undefined
      }
    >
      {/* Light header (homepage redesign, 21 Nov 2026): Home pill + 4
          section dropdowns + search + dark-mode (Coming Soon) + auth.
          See components/HeaderNav.tsx. Hidden on /admin* and /ceo* —
          those panels render their own shell. */}
      {/* Premium Islamic Greeting Bar (23 Nov 2026): permanent brand
          signature at the very top of the public site, in normal flow
          above the header — never a fixed overlay, so it never covers
          content. Hidden on /admin* and /ceo* like HeaderNav — those
          panels render their own shell. */}
      {isAdminShell ? null : <GreetingBar />}
      {isAdminShell ? null : <HeaderNav />}
      {/* Route-level SEO (22 Nov 2026, feature/seo-visibility): title,
          meta description, Open Graph, canonical + JSON-LD per public
          route. Renders nothing on auth/admin/founder routes. */}
      <RouteSeo />
      {suspended ? (
        <main style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px', fontFamily: 'system-ui, sans-serif' }}>
          <div style={{ border: '1px solid var(--error)', borderRadius: 8, padding: '20px 16px', background: 'var(--error-bg)' }}>
            <h1 style={{ marginTop: 0, color: 'var(--error)', fontSize: 24 }}>{t(strings.profile.suspendedTitle)}</h1>
            <p>{t(strings.profile.suspendedBody)}</p>
            {profile?.suspendedReason ? (
              <p>
                <strong>{t({ bn: 'স্থগিতের কারণ', en: 'Reason' })}:</strong> {profile.suspendedReason}
              </p>
            ) : null}
            <p style={{ color: 'var(--ink-soft)', fontSize: 14 }}>
              {t({ bn: 'আপিল করতে অ্যাডমিনের সঙ্গে যোগাযোগ করুন (সাপোর্ট পাতা / ইমেইল)। আপনি মালিক হলে: Firebase console → Firestore → users → আপনার ডকুমেন্ট → isActive ফিল্ডটি মুছে দিন (শুধু মালিকের অ্যাকাউন্টের ক্ষেত্রে)।', en: 'To appeal, contact an admin (support page / email). If you are the owner: Firebase console → Firestore → users → your document → delete the isActive field.' })}
            </p>
            <button
              type="button"
              onClick={() => void signOut()}
              style={{ padding: '10px 18px', minHeight: 48, fontSize: 16, borderRadius: 6, border: 'none', background: '#142B3B', color: '#fff', cursor: 'pointer' }}
            >
              <T bn={strings.nav.logout.bn} en={strings.nav.logout.en} />
            </button>
          </div>
        </main>
      ) : (
        <>
        <InstallAppPrompt />
        {appVersionStatus === 'update-available' ? (
          <AppVersionUpdateBar config={appVersionConfig} />
        ) : null}
        <Suspense fallback={<main style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px' }}><p>{t(strings.common.loading)}</p></main>}>
        <Routes>
        <Route path="/" element={<HomePage />} />
        {/* Four main sections (homepage redesign, 21 Nov 2026): /class is
            the real class index; /skills lands on the shared Coming Soon
            page until it is built (22 Nov 2026: /jobs moved to the real
            JobsPage below — the old /jobs Coming Soon route shadowed it).
            /admissions is now the hub index (NU-5) — see the NU routes below. */}
        <Route path="/class" element={<ClassIndexPage />} />
        <Route path="/skills" element={<ComingSoonPage section="skills" />} />
        {/* NU admission (NU-5, design §5): index → NU hub (8 tabs) →
            group pages → candidate dashboard. The dashboard and the
            three STATIC group routes sit above the hub's `:tab` route
            (React Router ranks static above dynamic), so
            `/admissions/national-university/science` is the Science
            group page, never the "science" tab. NU-Q6 (final):
            the dashboard is `/admissions/dashboard`. */}
        <Route path="/admissions" element={<AdmissionsIndexPage />} />
        <Route path="/admissions/dashboard" element={<AdmissionsDashboardPage />} />
        <Route path="/admissions/national-university" element={<NuHubPage />} />
        <Route path="/admissions/national-university/humanities" element={<NuGroupPage group="humanities" />} />
        <Route path="/admissions/national-university/science" element={<NuGroupPage group="science" />} />
        <Route path="/admissions/national-university/business" element={<NuGroupPage group="business" />} />
        {/* NU-6 (design §5.4): subject → chapter → topic pages. Five
            segments, so they never match the hub's 3-segment `:tab`
            route; a wrong group/subject/topic slug shows the page's
            own honest "not found" card. */}
        <Route path="/admissions/national-university/:group/subjects/:subject" element={<NuSubjectPage />} />
        <Route path="/admissions/national-university/:group/subjects/:subject/:topic" element={<NuTopicPage />} />
        <Route path="/admissions/national-university/:tab" element={<NuHubPage />} />
        {/* Class-wise navigation (stage 3): Select Class → Class Dashboard → Tab → Subject → Book → Chapter. */}
        <Route path="/class/:slug/subjects/:dept" element={<ClassSubjectPage />} />
        <Route path="/class/:slug/:tab" element={<ClassDashboardPage />} />
        <Route path="/class/:slug" element={<ClassDashboardPage />} />
        {/* Job Preparation (B-1.3): /jobs → hub index, /jobs/common, /jobs/dashboard, /jobs/:exam[/:tab]. /jobs/common and /jobs/dashboard must come before /jobs/:exam. Step 6 subject/topic pages are 4- and 5-segment routes (/jobs/:exam/subjects/:subject[/:topic]) — they cannot match the 3-segment /jobs/:exam/:tab route. */}
        <Route path="/jobs" element={<JobsPage />} />
        <Route path="/jobs/common" element={<JobsCommonPage />} />
        <Route path="/jobs/dashboard" element={<JobSeekerDashboardPage />} />
        <Route path="/jobs/:exam/subjects/:subject" element={<JobSubjectPage />} />
        <Route path="/jobs/:exam/subjects/:subject/:topic" element={<JobTopicPage />} />
        {/* Step 8: practice + result MUST come before /jobs/:exam/:tab
            — otherwise '/jobs/practice/:scope' matches :exam='practice'. */}
        <Route path="/jobs/practice/:scope" element={<JobPracticePage />} />
        {/* Step 9: mock MUST come before /jobs/:exam/:tab for the
            same reason — otherwise '/jobs/mock/:mockId' matches
            :exam='mock'. */}
        <Route path="/jobs/mock/:mockId" element={<JobMockPage />} />
        <Route path="/jobs/result/:attemptId" element={<JobResultPage />} />
        {/* Step 10: analysis MUST come before /jobs/:exam/:tab
            — otherwise '/jobs/analysis' matches :exam='analysis'. */}
        <Route path="/jobs/analysis" element={<JobAnalysisPage />} />
        {/* Step 12: planner MUST come before /jobs/:exam/:tab
            — otherwise '/jobs/planner' matches :exam='planner'. */}
        <Route path="/jobs/planner" element={<JobPlannerPage />} />
        {/* Step 13: wrong-answer notebook + its re-practice
            session MUST come before /jobs/:exam/:tab — otherwise
            '/jobs/wrong-answers' matches :exam='wrong-answers'. */}
        <Route path="/jobs/wrong-answers" element={<JobWrongAnswersPage />} />
        <Route path="/jobs/wrong-answers/practice/:topicId" element={<JobWrongAnswersPracticePage />} />
        {/* Step 14: circulars + calendar + notifications MUST come
            before /jobs/:exam/:tab — otherwise '/jobs/circulars'
            matches :exam='circulars'. */}
        <Route path="/jobs/circulars" element={<JobCircularsPage />} />
        <Route path="/jobs/circulars/:circularId" element={<JobCircularDetailPage />} />
        <Route path="/jobs/calendar" element={<JobCalendarPage />} />
        <Route path="/jobs/notifications" element={<JobNotificationsPage />} />
        {/* Step 16: guide pages MUST come before /jobs/:exam/:tab —
            otherwise '/jobs/viva' matches :exam='viva'. */}
        <Route path="/jobs/viva" element={<JobGuidePage kind="viva" />} />
        <Route path="/jobs/career" element={<JobGuidePage kind="career" />} />
        <Route path="/jobs/cv" element={<JobGuidePage kind="cv" />} />
        <Route path="/jobs/:exam/:tab" element={<JobHubPage />} />
        <Route path="/jobs/:exam" element={<JobHubPage />} />
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
        <Route path="/admin" element={<AdminGuard><AdminLayout /></AdminGuard>}>
          <Route index element={<AdminPage />} />
          <Route path="ads" element={<AdminAds />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="users/:uid" element={<AdminUserDetailPage />} />
          <Route path="teachers" element={<AdminTeachersPage />} />
          <Route path="guardians" element={<AdminGuardiansPage />} />
          <Route path="features" element={<AdminFeaturesPage />} />
          <Route path="backup" element={<AdminBackupPage />} />
          <Route path="audit" element={<AdminAuditPage />} />
          <Route path="app-version" element={<AdminAppVersionPage />} />
          <Route path="jobs" element={<AdminJobsPage />} />
          <Route path="jobs/circulars" element={<AdminJobCircularsPage />} />
          <Route path="jobs/circulars/new" element={<AdminJobCircularEditPage />} />
          <Route path="jobs/circulars/:circularId" element={<AdminJobCircularEditPage />} />
          <Route path="jobs/reports" element={<AdminJobReportsPage />} />
          <Route path="jobs/corrections" element={<AdminJobCorrectionsPage />} />
          <Route path="jobs/domains" element={<AdminJobDomainsPage />} />
          <Route path="admissions" element={<AdminAdmissionsPage />} />
          <Route path="admissions/structure" element={<AdminNuStructurePage />} />
          <Route path="admissions/syllabus" element={<AdminNuSyllabusPage />} />
          <Route path="admissions/questions" element={<NuQuestionWorkbenchGuard><AdminNuQuestionsPage /></NuQuestionWorkbenchGuard>} />
          <Route path="analytics" element={<AdminAnalyticsPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
          <Route path="content" element={<AdminContentPage />} />
          <Route path="exams" element={<AdminExamsPage />} />
        </Route>
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
        <Route path="/install" element={<InstallPage />} />
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
        <Route path="/life" element={<LifeHubPage />} />
        <Route path="/life/budget" element={<LifeBudgetPage />} />
        <Route path="/life/calculators" element={<LifeCalculatorsPage />} />
        <Route path="/life/converters" element={<LifeConvertersPage />} />
        <Route path="/life/planner" element={<LifePlannerPage />} />
        <Route path="/life/pdf-tools" element={<LifePdfToolsPage />} />
        <Route path="/life/health" element={<LifeHealthPage />} />
        <Route path="/life/government" element={<LifeGovernmentPage />} />
        <Route path="/life/travel" element={<LifeTravelPage />} />
        <Route path="/life/services" element={<LifeServicesPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/why-eduvelto" element={<WhyEduveltoPage />} />
        <Route path="/founder" element={<FounderPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="*" element={<NotFoundPage />} />
        </Routes>
        </Suspense>
        {isAdminShell ? null : <Footer />}
        {/* Mobile bottom navigation (homepage redesign, 21 Nov 2026):
            হোম / আমার কোর্স / প্রগ্রেস / বেশি কিছু / মেনু, ≤768px. Sits
            above the bottom ad banner when one is live. Hidden on /admin* and /ceo* routes — the Admin Panel and CEO Panel render their own bottom nav. */}
        {isAdminShell ? null : (
          <BottomNav bottomOffsetPx={bannerVisible ? bannerReservePx : 0} />
        )}
        {bannerPlacement ? <AdSlot placement={bannerPlacement} /> : null}
        </>
      )}
    </div>
  );
}
