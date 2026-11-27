import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { loginState } from './lib/loginReturn';
import { strings } from './i18n/strings';
import { useAuth } from './lib/auth';
import {
  adsActive,
  getBannerPlacementForPath,
  getBannerReservePx,
  getBottomNavOffsetPx,
  isPreviewHost,
} from './lib/adsConfig';
import AdSlot from './components/AdSlot';
import BottomNav from './components/BottomNav';
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
import { AppLoadingScreen } from './components/AppLoadingScreen';
import { RouteSeo } from './components/RouteSeo';
import { NuQuestionWorkbenchGuard } from './components/NuQuestionWorkbenchGuard';
import { T, getStoredLanguage, useLanguage } from './i18n/LanguageContext';
import { legacyRedirectTarget, resolveRootLang } from './lib/langRouting';
import { setupNativeBackButton } from './lib/nativeBackButton';
import { setupPushNotifications } from './lib/pushNotifications';
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
const JobLiveExamPage = lazy(() => import('./pages/JobLiveExamPage'));
const LiveExamPage = lazy(() => import('./pages/LiveExamPage'));
const JobGuidePage = lazy(() => import('./pages/JobGuidePage'));
const JobPostFamilyPage = lazy(() => import('./pages/JobPostFamilyPage'));
const JobTypingPage = lazy(() => import('./pages/JobTypingPage'));
const JobWrittenIndexPage = lazy(() => import('./pages/JobWrittenIndexPage'));
const JobWrittenQuestionPage = lazy(() => import('./pages/JobWrittenQuestionPage'));
const JobModelTestPage = lazy(() => import('./pages/JobModelTestPage'));
const AdminJobQuestionsPage = lazy(() => import('./pages/AdminJobQuestionsPage'));
const AdminJobWrittenPage = lazy(() => import('./pages/AdminJobWrittenPage'));
const AdminJobPreviousPage = lazy(() => import('./pages/AdminJobPreviousPage'));
const AdminJobApprovalsPage = lazy(() => import('./pages/AdminJobApprovalsPage'));
const AdminJobSchedulePage = lazy(() => import('./pages/AdminJobSchedulePage'));
const AdminJobResultsPage = lazy(() => import('./pages/AdminJobResultsPage'));
const AdminJobSubjectsPage = lazy(() => import('./pages/AdminJobSubjectsPage'));
const AdminJobExamsPage = lazy(() => import('./pages/AdminJobExamsPage'));
/* AdSense Part 1 (public content, F1 fix): static BCS English practice
   + sample lessons, visible WITHOUT login. No Firestore reads. */
const PublicBcsEnglishPage = lazy(() => import('./pages/PublicBcsEnglishPage'));
const AcademicPracticePage = lazy(() => import('./pages/AcademicPracticePage'));
/* Question Paper Generator (Milestone 2.5, MVP 25 Nov 2026): routing-
   agnostic page. Mounted at /question-paper-generator for now; the
   parallel SSG branch restructures public routes to /:lang — on merge,
   SSG lands first, then this route moves under the /:lang pattern. */
const QuestionPaperGeneratorPage = lazy(() => import('./pages/QuestionPaperGeneratorPage'));
/* Question Maker landing page (public SEO, Milestone 2.5): routing-
   agnostic mount at /question-maker for now; the SSG branch moves
   public routes under /:lang — SSG merges first, then this route
   moves under that pattern. */
const QuestionMakerLandingPage = lazy(() => import('./pages/QuestionMakerLandingPage'));
/* Pricing page (public, PROPOSED ONLY — Turn 32) + OMR evaluator
   (Turn 32): routing-agnostic mounts at /pricing and /omr-evaluator
   for now; the SSG branch moves public routes under /:lang — SSG
   merges first, then these routes move under that pattern. */
const PricingPage = lazy(() => import('./pages/PricingPage'));
const OmrEvaluatorPage = lazy(() => import('./pages/OmrEvaluatorPage'));
/* Custom paper service (owner 25 Nov 10:50, "koro"): routing-agnostic
   mount at /custom-paper for now; the SSG branch moves public routes
   under /:lang — SSG merges first, then this route moves under that
   pattern. */
const CustomPaperPage = lazy(() => import('./pages/CustomPaperPage'));
/* Question Paper Generator Phase 2 (25 Nov 2026): Sheet Builder,
   Smartboard (+ share view), Contribute, My Orders — same /:lang
   pattern as the generator. Admin queues live under /admin. */
const SheetBuilderPage = lazy(() => import('./pages/SheetBuilderPage'));
const SmartboardPage = lazy(() => import('./pages/SmartboardPage'));
const ContributePage = lazy(() => import('./pages/ContributePage'));
const MyQpgOrdersPage = lazy(() => import('./pages/MyQpgOrdersPage'));
const AdminQpgOrdersPage = lazy(() => import('./pages/AdminQpgOrdersPage'));
const AdminQpgContributionsPage = lazy(() => import('./pages/AdminQpgContributionsPage'));
/* Branded WhatsApp redirect (owner 25 Nov 10:19): eduvelto.com/whatsapp
   hides the number; production is served by the firebase.json 302, this
   route is the dev/preview fallback. */
const WhatsappRedirectPage = lazy(() => import('./pages/WhatsappRedirectPage'));
const PublicLessonPage = lazy(() => import('./pages/PublicLessonPage'));
const LearnHubPage = lazy(() => import('./pages/LearnHubPage'));
/* Brand-SEO wave 1 (24 Nov 2026): 10 static public guides + 4 trust
   pages. Same pattern as PublicLessonPage — static data, no login,
   zero Firestore reads. Each guide route is explicit (slug prop),
   never derived from a raw URL slug. */
const PublicGuidePage = lazy(() => import('./pages/PublicGuidePage'));
/* Phase 2 (25 Nov 2026): Study Guides hub — /guides lists the 15
   long-form bilingual guides; each has an explicit route below,
   same pattern as the /learn guides (slug prop, never a raw URL). */
const GuidesHubPage = lazy(() => import('./pages/GuidesHubPage'));
const EditorialPolicyPage = lazy(() => import('./pages/EditorialPolicyPage'));
const ContentAccuracyPage = lazy(() => import('./pages/ContentAccuracyPage'));
const CertificatePolicyPage = lazy(() => import('./pages/CertificatePolicyPage'));
const DisclaimerPage = lazy(() => import('./pages/DisclaimerPage'));
const OpportunityHubPage = lazy(() => import('./pages/OpportunityHubPage'));
const OpportunityDetailPage = lazy(() => import('./pages/OpportunityDetailPage'));
const OpportunityCvBuilderPage = lazy(() => import('./pages/OpportunityCvBuilderPage'));
const OpportunityGuidePage = lazy(() => import('./pages/OpportunityGuidePage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const RoleSetupPage = lazy(() => import('./pages/RoleSetupPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const OfflinePage = lazy(() => import('./pages/OfflinePage'));
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
const AdminQuestionReportsPage = lazy(() => import('./pages/AdminQuestionReportsPage'));
const AdminJobCorrectionsPage = lazy(() => import('./pages/AdminJobCorrectionsPage'));
const AdminJobDomainsPage = lazy(() => import('./pages/AdminJobDomainsPage'));
const AdminAdmissionsPage = lazy(() => import('./pages/AdminAdmissionsPage'));
const AdminAnalyticsPage = lazy(() => import('./pages/AdminAnalyticsPage'));
const AdminSettingsPage = lazy(() => import('./pages/AdminSettingsPage'));
const OwnerSecurityPage = lazy(() => import('./pages/OwnerSecurityPage'));
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
const AiAssistantPage = lazy(() => import('./pages/AiAssistantPage'));
const ExamPage = lazy(() => import('./pages/ExamPage'));
const MockExamPage = lazy(() => import('./pages/MockExamPage'));
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
// 100-Tools Project, Phase 1 (26 Nov 2026): Tools hub + slug-driven
// detail page (one component for all 105 tools; the 8 existing
// tools render their own page via the aliasPage dispatch).
const ToolsHubPage = lazy(() => import('./pages/ToolsHubPage'));
const ToolsDetailPage = lazy(() => import('./pages/ToolsDetailPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const SupportPage = lazy(() => import('./pages/SupportPage'));
/* 7-day sprint, Day 6 (26 Nov 2026): Suggestion PDF Store —
// honest coming-soon store (no verified PDF content yet, sales
// gate in lib/orders.ts stays off); same /:lang pattern as
// /support. */
const SuggestionsPage = lazy(() => import('./pages/SuggestionsPage'));
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
  const location = useLocation();
  // Sections audit (24 Nov 2026): return to /dashboard after sign-in.
  const back = loginState(location.pathname + location.search);
  if (loading) return <AppLoadingScreen />;
  if (!user) return <Navigate to="/login" replace state={back} />;
  if (!profile) return <Navigate to="/register/role" replace />;
  if (profile.role === 'owner' || profile.role === 'admin' || profile.role === 'moderator') {
    return <Navigate to="/admin" replace />;
  }
  if (profile.role === 'teacher') return <Navigate to="/teacher" replace />;
  if (profile.role === 'parent') return <Navigate to="/guardian" replace />;
  return <Navigate to="/student" replace />;
}


// BILINGUAL ROUTING (Phase 1, 25 Nov 2026, SSG + bilingual):
// public content lives under /:lang (bn | en). Root '/' redirects
// (?lang > localStorage > user profile, default bn); legacy public
// URLs redirect to /bn/... — in-app via LegacyRedirect below, and
// for direct loads via the firebase.json 301s (which evaluate
// BEFORE rewrites). /app, /admin, /ceo, /login, /register,
// /profile, /dashboard, /student, /teacher, /guardian, /directory,
// /subjects, /quiz, /exam, /routine, /progress and /social stay
// OUTSIDE /:lang (client-only / login-gated) and never redirect.
// ALL real pages stay live — nothing is commented out (Gemini's
// draft App.tsx commented them all out; that must never happen).
function RootRedirect() {
  const location = useLocation();
  const { profile } = useAuth();
  const params = new URLSearchParams(location.search);
  const lang = resolveRootLang({
    queryLang: params.get('lang'),
    storedLang: getStoredLanguage(),
    profileLang: profile?.language ?? null,
  });
  params.delete('lang');
  const suffix = params.toString() ? `?${params.toString()}` : '';
  return <Navigate to={`/${lang}${suffix}`} replace />;
}

function LangLayout() {
  const { lang } = useParams<{ lang: string }>();
  const location = useLocation();
  const { syncLanguageFromPath } = useLanguage();
  useEffect(() => {
    if (lang === 'bn' || lang === 'en') syncLanguageFromPath(lang);
  }, [lang, syncLanguageFromPath]);
  // ?lang= fix (26 Nov 2026): an old shared link to a prefixed URL
  // (e.g. /bn/jobs/bcs?lang=en) redirects to the clean path — the
  // /:lang segment is the only language carrier. Other params stay.
  const params = new URLSearchParams(location.search);
  if (params.has('lang')) {
    params.delete('lang');
    const suffix = params.toString() ? `?${params.toString()}` : '';
    const target =
      lang === 'bn' || lang === 'en'
        ? `${location.pathname}${suffix}`
        : (legacyRedirectTarget(location.pathname) ?? `/bn${location.pathname}`) + suffix;
    return <Navigate to={target} replace />;
  }
  if (lang !== 'bn' && lang !== 'en') {
    // A non-language first segment reached the :lang route (a legacy
    // URL the static redirect routes did not outrank): send it
    // through the legacy mapping, else to /bn + the same path.
    const target = legacyRedirectTarget(location.pathname) ?? `/bn${location.pathname}`;
    return <Navigate to={`${target}${location.search}`} replace />;
  }
  return <Outlet />;
}

function LegacyRedirect() {
  const location = useLocation();
  // ?lang= fix (26 Nov 2026): an old shared link (e.g.
  // /jobs/bcs?lang=en) redirects to the clean /:lang path IN THAT
  // language — the param is consumed here, never passed through.
  const params = new URLSearchParams(location.search);
  const queryLang = params.get('lang');
  const lang = queryLang === 'bn' || queryLang === 'en' ? queryLang : 'bn';
  params.delete('lang');
  const suffix = params.toString() ? `?${params.toString()}` : '';
  const target = legacyRedirectTarget(location.pathname, lang) ?? '/bn';
  return <Navigate to={`${target}${suffix}`} replace />;
}

// D-05 (QA 27 Nov 2026): /bn/login, /bn/register, /bn/register/role,
// /bn/teacher/register and /bn/admission rendered the client-side 404
// page — login/register/admission live OUTSIDE /:lang, so the prefixed
// forms fell through to the :lang catch-all. These redirects (mounted
// as :lang children, before the catch-all) send them to the real
// routes, preserving the query string (?next= return-to included).
// /bn/admission lands on the admissions hub in the same language
// (bare /admission already 301s to /bn/admissions via firebase.json).
function PrefixedAuthRedirect({ to }: { to: string }) {
  const location = useLocation();
  return <Navigate to={`${to}${location.search}`} replace />;
}

function PrefixedAdmissionRedirect() {
  const { lang } = useParams<{ lang: string }>();
  const location = useLocation();
  const l = lang === 'bn' || lang === 'en' ? lang : 'bn';
  return <Navigate to={`/${l}/admissions${location.search}`} replace />;
}

// Routes mirror page-map.md + the Phase 2 route list.
// /social is a DESIGN PROPOSAL only (blueprint §7): no live social
// features, no messaging, until safety + moderation are ready.
// /ai-teacher is a scripted demonstration, not live AI (blueprint §5).
// Step 1: the header reflects the auth state, and a suspended account
// (profile isActive === false) sees only the suspended screen — Auth
// login still succeeds, but the app cannot be used (plan Step 1).
// SCROLL RESTORATION (owner bug report 24 Nov 2026 07:58 — "kono button a
// click korle nicher dikhe cole jai"): the app had NO scroll management at
// all, so React Router kept the scroll position across navigations. When
// the new page is data-backed (/library loads 609 books from Firestore)
// the browser's scroll anchoring pins the viewport to the document
// bottom while content grows — a tap on a content link (quick tile,
// section card, sheet link) landed the user at the BOTTOM of the new
// page (measured live 24 Nov: scrollY 53 -> 8222 = max scroll on
// /library; 1500 -> 660 = max scroll on /exam). Taps on fixed-nav links
// did not jump (no anchor in the scrolled content), which is why the bug
// looked like "any button". Fix: reset scroll to the top on every route
// change. The router is a plain BrowserRouter, so react-router's
// <ScrollRestoration/> cannot be used (it needs a data router).
// Back-button scroll positions are not restored by this — the standard
// trade-off; landing at the top of a new page is the correct behaviour.
// Non-navigating taps (sheet open/close, buttons) do not change the
// pathname, so they are unaffected.
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// ANDROID BACK BUTTON (owner bug report 24 Nov 2026 09:40): inside the
// Capacitor app, back on any in-app page exited the whole app. The
// native @capacitor/app plugin fires a backButton event; this component
// registers the listener (lib/nativeBackButton.ts) — history.back() when
// there is in-app history, App.exitApp() only on the home page. In a
// normal browser setupNativeBackButton() is a no-op, so the browser back
// button is untouched.
function NativeBackButton() {
  useEffect(() => setupNativeBackButton(), []);
  return null;
}

// Push notifications, Phase A (app audit, 24 Nov 2026): registers for
// push + subscribes to the 'eduvelto-announcements' topic once the
// user is signed in, native-app only (lib/pushNotifications.ts). A
// tap deep-links to notification data `link`. In a browser, or without
// google-services.json in the wrapper, setupPushNotifications() is a
// silent no-op.
function NativePushNotifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!user) return () => undefined;
    return setupPushNotifications(navigate);
  }, [user, navigate]);
  return null;
}

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
  // Bottom-nav offset follows the banner's ACTUAL state (owner 24 Nov
  // 2026 07:14): when AdSense reports the bottom banner unfilled the
  // slot collapses to nothing, so the nav must drop to the viewport
  // bottom instead of floating bannerReservePx up over an empty gap
  // with page content visible below it. The AdSlot reports the
  // collapse via onUnfilled (below); a new banner placement remounts
  // the slot, so the flag resets with it.
  const [bottomBannerCollapsed, setBottomBannerCollapsed] = useState(false);
  useEffect(() => {
    setBottomBannerCollapsed(false);
  }, [bannerPlacement]);
  const handleBottomBannerUnfilled = useCallback(() => {
    setBottomBannerCollapsed(true);
  }, []);
  const effectiveBannerReservePx = getBottomNavOffsetPx({
    bannerVisible,
    bannerReservePx,
    bannerCollapsed: bottomBannerCollapsed,
  });
  // Admin + CEO panels render their own shell (sidebar/top bar/bottom
  // nav) — the public header, footer and BottomNav are hidden there.
  const isAdminShell = location.pathname.startsWith('/admin') || location.pathname.startsWith('/ceo');
  return (
    <div
      className="ev-app-shell"
      style={
        effectiveBannerReservePx > 0
          ? ({ '--ev-banner': `${effectiveBannerReservePx}px` } as React.CSSProperties)
          : undefined
      }
    >
      <ScrollToTop />
      <NativeBackButton />
      <NativePushNotifications />
      {/* Light header (homepage redesign, 21 Nov 2026): Home pill + 4
          section dropdowns + search + dark-mode (Coming Soon) + auth.
          See components/HeaderNav.tsx. Hidden on /admin* and /ceo* —
          those panels render their own shell. */}
      {/* Top sticky greeting bar REMOVED (owner revision 24 Nov 2026):
          the Bismillah/ayah appeared in two places on the homepage.
          The ayah bar itself was REMOVED 25 Nov 2026 (owner: "takbe
          na") and replaced by the announcement ticker in the hero band
          below the navigation (components/AnnouncementTicker.tsx). */}
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
        <Route path="/" element={<RootRedirect />} />
        <Route path=":lang" element={<LangLayout />}>
        <Route index element={<HomePage />} />
        {/* Global Search (homepage redesign, 24 Nov 2026): /search?q=…
            searches books + jobs + opportunities + life services. The
            page is deliberately NOT in seo.ts STATIC_ROUTES and is
            disallowed in robots.txt — search result pages are noindex. */}
        <Route path="search" element={<SearchPage />} />
        {/* Four main sections (homepage redesign, 21 Nov 2026): /class is
            the real class index; /skills lands on the shared Coming Soon
            page until it is built (22 Nov 2026: /jobs moved to the real
            JobsPage below — the old /jobs Coming Soon route shadowed it).
            /admissions is now the hub index (NU-5) — see the NU routes below. */}
        <Route path="class" element={<ClassIndexPage />} />
        <Route path="skills" element={<ComingSoonPage section="skills" />} />
        {/* NU admission (NU-5, design §5): index → NU hub (8 tabs) →
            group pages → candidate dashboard. The dashboard and the
            three STATIC group routes sit above the hub's `:tab` route
            (React Router ranks static above dynamic), so
            `/admissions/national-university/science` is the Science
            group page, never the "science" tab. NU-Q6 (final):
            the dashboard is `/admissions/dashboard`. */}
        <Route path="admissions" element={<AdmissionsIndexPage />} />
        <Route path="admissions/dashboard" element={<AdmissionsDashboardPage />} />
        <Route path="admissions/national-university" element={<NuHubPage />} />
        <Route path="admissions/national-university/humanities" element={<NuGroupPage group="humanities" />} />
        <Route path="admissions/national-university/science" element={<NuGroupPage group="science" />} />
        <Route path="admissions/national-university/business" element={<NuGroupPage group="business" />} />
        {/* NU-6 (design §5.4): subject → chapter → topic pages. Five
            segments, so they never match the hub's 3-segment `:tab`
            route; a wrong group/subject/topic slug shows the page's
            own honest "not found" card. */}
        <Route path="admissions/national-university/:group/subjects/:subject" element={<NuSubjectPage />} />
        <Route path="admissions/national-university/:group/subjects/:subject/:topic" element={<NuTopicPage />} />
        <Route path="admissions/national-university/:tab" element={<NuHubPage />} />
        {/* Class-wise navigation (stage 3): Select Class → Class Dashboard → Tab → Subject → Book → Chapter. */}
        {/* Classes 1–5 were removed from the platform 27 Nov 2026
            (owner order) — old links redirect to the class index. */}
        <Route path="class/class-1-5/*" element={<Navigate to="/class" replace />} />
        <Route path="class/:slug/subjects/:dept" element={<ClassSubjectPage />} />
        <Route path="class/:slug/:tab" element={<ClassDashboardPage />} />
        <Route path="class/:slug" element={<ClassDashboardPage />} />
        {/* Job Preparation (B-1.3): /jobs → hub index, /jobs/common, /jobs/dashboard, /jobs/:exam[/:tab]. /jobs/common and /jobs/dashboard must come before /jobs/:exam. Step 6 subject/topic pages are 4- and 5-segment routes (/jobs/:exam/subjects/:subject[/:topic]) — they cannot match the 3-segment /jobs/:exam/:tab route. */}
        <Route path="jobs" element={<JobsPage />} />
        <Route path="jobs/common" element={<JobsCommonPage />} />
        <Route path="jobs/dashboard" element={<JobSeekerDashboardPage />} />
        <Route path="jobs/:exam/subjects/:subject" element={<JobSubjectPage />} />
        <Route path="jobs/:exam/subjects/:subject/:topic" element={<JobTopicPage />} />
        {/* Step 8: practice + result MUST come before /jobs/:exam/:tab
            — otherwise '/jobs/practice/:scope' matches :exam='practice'. */}
        <Route path="jobs/practice/:scope" element={<JobPracticePage />} />
        {/* Step 9: mock MUST come before /jobs/:exam/:tab for the
            same reason — otherwise '/jobs/mock/:mockId' matches
            :exam='mock'. */}
        <Route path="jobs/mock/:mockId" element={<JobMockPage />} />
        <Route path="jobs/result/:attemptId" element={<JobResultPage />} />
        {/* Step 10: analysis MUST come before /jobs/:exam/:tab
            — otherwise '/jobs/analysis' matches :exam='analysis'. */}
        <Route path="jobs/analysis" element={<JobAnalysisPage />} />
        {/* Step 12: planner MUST come before /jobs/:exam/:tab
            — otherwise '/jobs/planner' matches :exam='planner'. */}
        <Route path="jobs/planner" element={<JobPlannerPage />} />
        {/* Step 13: wrong-answer notebook + its re-practice
            session MUST come before /jobs/:exam/:tab — otherwise
            '/jobs/wrong-answers' matches :exam='wrong-answers'. */}
        <Route path="jobs/wrong-answers" element={<JobWrongAnswersPage />} />
        <Route path="jobs/wrong-answers/practice/:topicId" element={<JobWrongAnswersPracticePage />} />
        {/* Step 14: circulars + calendar + notifications MUST come
            before /jobs/:exam/:tab — otherwise '/jobs/circulars'
            matches :exam='circulars'. */}
        <Route path="jobs/circulars" element={<JobCircularsPage />} />
        <Route path="jobs/circulars/:circularId" element={<JobCircularDetailPage />} />
        <Route path="jobs/calendar" element={<JobCalendarPage />} />
        <Route path="jobs/notifications" element={<JobNotificationsPage />} />
        {/* Live Exam (design §6 item 12): MUST come before
            /jobs/:exam/:tab — otherwise '/jobs/live-exam/:exam'
            matches :exam='live-exam'. */}
        <Route path="jobs/live-exam/:exam" element={<JobLiveExamPage />} />
        {/* Job Preparation System (owner brief 24 Nov 2026 20:38):
            11–20 post-family pages, typing simulator, written
            system and model tests MUST come before /jobs/:exam/:tab
            — otherwise '/jobs/grade-11-20/posts/:postSlug' matches
            :exam='grade-11-20', :tab='posts'. */}
        <Route path="jobs/grade-11-20/posts/:postSlug" element={<JobPostFamilyPage />} />
        <Route path="jobs/grade-11-20/typing" element={<JobTypingPage />} />
        <Route path="jobs/:exam/written" element={<JobWrittenIndexPage />} />
        <Route path="jobs/:exam/written/:questionId" element={<JobWrittenQuestionPage />} />
        <Route path="jobs/model-test" element={<JobModelTestPage />} />
        <Route path="jobs/model-test/:modelTestId" element={<JobModelTestPage />} />
        {/* Step 16: guide pages MUST come before /jobs/:exam/:tab —
            otherwise '/jobs/viva' matches :exam='viva'. */}
        <Route path="jobs/viva" element={<JobGuidePage kind="viva" />} />
        <Route path="jobs/career" element={<JobGuidePage kind="career" />} />
        <Route path="jobs/cv" element={<JobGuidePage kind="cv" />} />
        {/* AdSense Part 1 (public content, F1 fix): static BCS English
            practice (hub + 3 categories) and 2 sample lessons — public,
            no login, no Firestore. Placed with the other specific /jobs
            routes, before /jobs/:exam/:tab, by the file's convention.
            The :category param is validated inside PublicBcsEnglishPage;
            unknown values show an honest not-found, never the raw slug. */}
        <Route path="jobs/bcs/practice/english" element={<PublicBcsEnglishPage />} />
        <Route path="jobs/bcs/practice/english/:category" element={<PublicBcsEnglishPage />} />
        {/* Question Paper Generator (Milestone 2.5 MVP): rebased under
            the /:lang pattern per the merge flag (SSG merged first). */}
        <Route path="question-paper-generator" element={<QuestionPaperGeneratorPage />} />
        {/* Question Maker landing page (public SEO, Milestone 2.5):
            rebased under the /:lang pattern. */}
        <Route path="question-maker" element={<QuestionMakerLandingPage />} />
        {/* Pricing (public) + OMR evaluator (Turn 32): rebased under
            the /:lang pattern. */}
        <Route path="pricing" element={<PricingPage />} />
        <Route path="omr-evaluator" element={<OmrEvaluatorPage />} />
        {/* Custom paper service (owner 25 Nov 10:50): rebased under
            the /:lang pattern. */}
        <Route path="custom-paper" element={<CustomPaperPage />} />
        {/* Question Paper Generator Phase 2 (25 Nov 2026): Sheet
            Builder, Smartboard (+ share view), Contribute, My Orders
            — same /:lang pattern as the generator. */}
        <Route path="sheet-builder" element={<SheetBuilderPage />} />
        <Route path="smartboard" element={<SmartboardPage />} />
        <Route path="smartboard/:boardId" element={<SmartboardPage />} />
        <Route path="contribute" element={<ContributePage />} />
        <Route path="my-orders" element={<MyQpgOrdersPage />} />
        {/* Branded WhatsApp redirect (owner 25 Nov 10:19): visitors see
            only eduvelto.com/whatsapp; production redirect lives in
            firebase.json (302), this route is the dev/preview fallback. */}
        <Route path="whatsapp" element={<WhatsappRedirectPage />} />
        <Route path="learn" element={<LearnHubPage />} />
        {/* Academic chapter practice (Education Hub, 26 Nov 2026):
            same verified bank as the Question Maker — hub, then one
            subject's units, then one unit's interactive practice.
            Params are validated inside AcademicPracticePage; an
            unknown class/subject/chapter shows the honest empty state. */}
        <Route path="learn/practice" element={<AcademicPracticePage />} />
        <Route path="learn/practice/:classId/:subjectId" element={<AcademicPracticePage />} />
        <Route
          path="learn/practice/:classId/:subjectId/:chapterId"
          element={<AcademicPracticePage />}
        />
        <Route path="learn/bcs-english-tense" element={<PublicLessonPage lesson="tense" />} />
        <Route path="learn/bcs-english-preposition" element={<PublicLessonPage lesson="preposition" />} />
        {/* Brand-SEO wave 1 (24 Nov 2026) + wave 2 (24 Nov 2026) +
            wave 3 (24 Nov 2026) + wave 4 (24 Nov 2026): 29 public guides — explicit routes,
            one per guide slug (see PublicGuidePage). */}
        <Route path="learn/bcs-preparation-guide" element={<PublicGuidePage guide="bcs-preparation-guide" />} />
        <Route path="learn/bank-job-preparation" element={<PublicGuidePage guide="bank-job-preparation" />} />
        <Route path="learn/primary-teacher-preparation" element={<PublicGuidePage guide="primary-teacher-preparation" />} />
        <Route path="learn/ntrca-preparation" element={<PublicGuidePage guide="ntrca-preparation" />} />
        <Route path="learn/nu-admission-guide" element={<PublicGuidePage guide="nu-admission-guide" />} />
        <Route path="learn/english-grammar-basics" element={<PublicGuidePage guide="english-grammar-basics" />} />
        <Route path="learn/scholarship-guide" element={<PublicGuidePage guide="scholarship-guide" />} />
        <Route path="learn/what-is-ai" element={<PublicGuidePage guide="what-is-ai" />} />
        <Route path="learn/cv-writing-guide" element={<PublicGuidePage guide="cv-writing-guide" />} />
        <Route path="learn/budget-planner-guide" element={<PublicGuidePage guide="budget-planner-guide" />} />
        <Route path="learn/revision-strategy" element={<PublicGuidePage guide="revision-strategy" />} />
        <Route path="learn/note-taking-guide" element={<PublicGuidePage guide="note-taking-guide" />} />
        <Route path="learn/time-management-students" element={<PublicGuidePage guide="time-management-students" />} />
        <Route path="learn/english-writing-basics" element={<PublicGuidePage guide="english-writing-basics" />} />
        <Route path="learn/online-safety-guide" element={<PublicGuidePage guide="online-safety-guide" />} />
        <Route path="learn/bangla-spelling-common-mistakes" element={<PublicGuidePage guide="bangla-spelling-common-mistakes" />} />
        <Route path="learn/computer-basics-students" element={<PublicGuidePage guide="computer-basics-students" />} />
        <Route path="learn/exam-day-strategy" element={<PublicGuidePage guide="exam-day-strategy" />} />
        <Route path="learn/mcq-answering-techniques" element={<PublicGuidePage guide="mcq-answering-techniques" />} />
        <Route path="learn/memory-techniques-students" element={<PublicGuidePage guide="memory-techniques-students" />} />
        <Route path="learn/study-routine-job-seekers" element={<PublicGuidePage guide="study-routine-job-seekers" />} />
        <Route path="learn/healthy-habits-students" element={<PublicGuidePage guide="healthy-habits-students" />} />
        <Route path="learn/digital-skills-basics" element={<PublicGuidePage guide="digital-skills-basics" />} />
        <Route path="learn/exam-anxiety-management" element={<PublicGuidePage guide="exam-anxiety-management" />} />
        <Route path="learn/presentation-skills" element={<PublicGuidePage guide="presentation-skills" />} />
        <Route path="learn/group-study-guide" element={<PublicGuidePage guide="group-study-guide" />} />
        <Route path="learn/english-vocabulary-building" element={<PublicGuidePage guide="english-vocabulary-building" />} />
        <Route path="learn/effective-reading-habits" element={<PublicGuidePage guide="effective-reading-habits" />} />
        <Route path="learn/self-motivation-students" element={<PublicGuidePage guide="self-motivation-students" />} />
        <Route path="learn/how-to-use-free-library" element={<PublicGuidePage guide="how-to-use-free-library" />} />
        <Route path="learn/how-to-use-job-practice" element={<PublicGuidePage guide="how-to-use-job-practice" />} />
        <Route path="learn/how-to-use-ai-assistant" element={<PublicGuidePage guide="how-to-use-ai-assistant" />} />
        <Route path="learn/how-to-use-opportunity-hub" element={<PublicGuidePage guide="how-to-use-opportunity-hub" />} />
        <Route path="learn/how-to-use-life-services" element={<PublicGuidePage guide="how-to-use-life-services" />} />
        <Route path="learn/spoken-english-practice" element={<PublicGuidePage guide="spoken-english-practice" />} />
        <Route path="learn/goal-setting-students" element={<PublicGuidePage guide="goal-setting-students" />} />
        <Route path="learn/staying-focused-studying" element={<PublicGuidePage guide="staying-focused-studying" />} />
        <Route path="learn/sleep-and-study" element={<PublicGuidePage guide="sleep-and-study" />} />
        <Route path="learn/reading-comprehension-strategies" element={<PublicGuidePage guide="reading-comprehension-strategies" />} />
        <Route path="learn/learning-with-phone" element={<PublicGuidePage guide="learning-with-phone" />} />
        <Route path="learn/asking-questions-class" element={<PublicGuidePage guide="asking-questions-class" />} />
        {/* Phase 2 (25 Nov 2026): Study Guides blog — /guides hub +
            15 long-form bilingual guides, one explicit route per
            slug (see PublicGuidePage). Same data file, same detail
            component as the /learn guides; NOT a parallel system. */}
        <Route path="guides" element={<GuidesHubPage />} />
        <Route path="guides/bcs-bangla-preparation" element={<PublicGuidePage guide="bcs-bangla-preparation" />} />
        <Route path="guides/bcs-english-preparation" element={<PublicGuidePage guide="bcs-english-preparation" />} />
        <Route path="guides/bcs-math-mental-ability" element={<PublicGuidePage guide="bcs-math-mental-ability" />} />
        <Route path="guides/bcs-science-ict-preparation" element={<PublicGuidePage guide="bcs-science-ict-preparation" />} />
        <Route path="guides/primary-bangla-english-preparation" element={<PublicGuidePage guide="primary-bangla-english-preparation" />} />
        <Route path="guides/primary-math-gk-preparation" element={<PublicGuidePage guide="primary-math-gk-preparation" />} />
        <Route path="guides/primary-viva-preparation" element={<PublicGuidePage guide="primary-viva-preparation" />} />
        <Route path="guides/bank-math-preparation" element={<PublicGuidePage guide="bank-math-preparation" />} />
        <Route path="guides/bank-english-gk-preparation" element={<PublicGuidePage guide="bank-english-gk-preparation" />} />
        <Route path="guides/ntrca-written-exam-preparation" element={<PublicGuidePage guide="ntrca-written-exam-preparation" />} />
        <Route path="guides/ntrca-viva-subject-preparation" element={<PublicGuidePage guide="ntrca-viva-subject-preparation" />} />
        <Route path="guides/gst-admission-preparation" element={<PublicGuidePage guide="gst-admission-preparation" />} />
        <Route path="guides/du-admission-preparation" element={<PublicGuidePage guide="du-admission-preparation" />} />
        <Route path="guides/nctb-books-study-method" element={<PublicGuidePage guide="nctb-books-study-method" />} />
        <Route path="guides/nctb-revision-before-exams" element={<PublicGuidePage guide="nctb-revision-before-exams" />} />
        {/* Global Opportunity Hub (directive §3B): static guide
            routes MUST come before /opportunities/:oppId —
            otherwise '/opportunities/cv-builder' matches
            :oppId='cv-builder'. */}
        <Route path="opportunities" element={<OpportunityHubPage />} />
        <Route path="opportunities/cv-builder" element={<OpportunityCvBuilderPage />} />
        <Route path="opportunities/interview-prep" element={<OpportunityGuidePage kind="interview-prep" />} />
        <Route path="opportunities/career-guidance" element={<OpportunityGuidePage kind="career-guidance" />} />
        <Route path="opportunities/entrepreneurship" element={<OpportunityGuidePage kind="entrepreneurship" />} />
        <Route path="opportunities/income" element={<OpportunityGuidePage kind="income" />} />
        <Route path="opportunities/:oppId" element={<OpportunityDetailPage />} />
        <Route path="jobs/:exam/:tab" element={<JobHubPage />} />
        <Route path="jobs/:exam" element={<JobHubPage />} />
        <Route path="library" element={<LibraryPage />} />
        <Route path="library/:bookId" element={<BookPage />} />
        <Route path="books" element={<LibraryPage />} />
        <Route path="books/:bookId" element={<BookPage />} />
        <Route path="books/:bookId/chapters/:chapterId" element={<ChapterPage />} />
        <Route path="lessons/:lessonId" element={<LessonPage />} />
        <Route path="install" element={<InstallPage />} />
        <Route path="ai-teacher" element={<AiTeacherPage />} />
        <Route path="ai-assistant" element={<AiAssistantPage />} />
        <Route path="health" element={<HealthPage />} />
        <Route path="health/medicines" element={<HealthMedicinesPage />} />
        <Route path="health/diseases" element={<HealthDiseasesPage />} />
        <Route path="health/doctors" element={<HealthDoctorsPage />} />
        <Route path="health/hospitals" element={<HealthHospitalsPage />} />
        <Route path="health/report" element={<HealthReportPage />} />
        <Route path="life" element={<LifeHubPage />} />
        <Route path="life/budget" element={<LifeBudgetPage />} />
        <Route path="life/calculators" element={<LifeCalculatorsPage />} />
        <Route path="life/converters" element={<LifeConvertersPage />} />
        <Route path="life/planner" element={<LifePlannerPage />} />
        <Route path="life/pdf-tools" element={<LifePdfToolsPage />} />
        <Route path="life/health" element={<LifeHealthPage />} />
        <Route path="life/government" element={<LifeGovernmentPage />} />
        <Route path="life/travel" element={<LifeTravelPage />} />
        <Route path="life/services" element={<LifeServicesPage />} />
        {/* 100-Tools Project, Phase 1 (26 Nov 2026): /:lang/tools hub
            + slug-driven detail page (one component, all 105 tools). */}
        <Route path="tools" element={<ToolsHubPage />} />
        <Route path="tools/:slug" element={<ToolsDetailPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="why-eduvelto" element={<WhyEduveltoPage />} />
        <Route path="founder" element={<FounderPage />} />
        <Route path="contact" element={<ContactPage />} />
        {/* Phase 3 (25 Nov 2026): real /:lang/support page — the
            old /support 301 to /bn/contact is replaced. */}
        <Route path="support" element={<SupportPage />} />
        {/* 7-day sprint, Day 6 (26 Nov 2026): Suggestion PDF Store —
            honest coming-soon page (no verified PDF yet); same
            /:lang duplicate-routes pattern as /support. */}
        <Route path="suggestions" element={<SuggestionsPage />} />
        <Route path="privacy-policy" element={<PrivacyPage />} />
        <Route path="terms" element={<TermsPage />} />
        {/* Brand-SEO wave 1 (24 Nov 2026, F-08): trust/policy pages
            Google expects — editorial policy, content accuracy,
            certificate policy (no certificates of any kind) and
            disclaimer. All linked from the footer. */}
        <Route path="editorial-policy" element={<EditorialPolicyPage />} />
        <Route path="content-accuracy" element={<ContentAccuracyPage />} />
        <Route path="certificate-policy" element={<CertificatePolicyPage />} />
        <Route path="disclaimer" element={<DisclaimerPage />} />
        {/* Locale-prefixed exam/progress/routine/social (25 Nov 2026):
            these four pages were top-level routes only (/exam, /progress,
            /routine, /social), so /bn/exam etc. fell through to the
            :lang catch-all NotFound page. Same components, same
            login-gated behaviour — now reachable under both /{lang}/ and
            the legacy unprefixed paths. NOT prerendered, NOT in the
            sitemap (login-gated, robots-disallowed — unchanged). */}
        <Route path="exam" element={<ExamPage />} />
        {/* General Mock Exam hub + runner (7-day sprint, Day 5):
            same locale-prefixed duplicate-routes pattern as /exam
            — renders under /:lang/mock-exam AND bare /mock-exam
            (NOT a redirect). Login-gated, not prerendered, not in
            the sitemap. Runner bundle via ?bundle=<docId>&v=<n>. */}
        <Route path="mock-exam" element={<MockExamPage />} />
        {/* National Live Exam hub (7-day sprint, Day 5):
            same locale-prefixed duplicate-routes pattern as /exam
            and /mock-exam — renders under /:lang/live-exam AND
            bare /live-exam (NOT a redirect). Public to view
            (schedule + countdown); entry itself requires login
            (the page gates it). Not prerendered, not in the
            sitemap (schedule is dynamic). */}
        <Route path="live-exam" element={<LiveExamPage />} />
        <Route path="progress" element={<ProgressPage />} />
        <Route path="routine" element={<RoutinePage />} />
        <Route path="social" element={<SocialPage />} />
        {/* D-05 (QA 27 Nov 2026): lang-prefixed auth/admission URLs
            redirect to the real top-level routes (see
            PrefixedAuthRedirect above) instead of hitting the
            catch-all 404. Query strings (?next=) are preserved. */}
        <Route path="login" element={<PrefixedAuthRedirect to="/login" />} />
        <Route path="register" element={<PrefixedAuthRedirect to="/register" />} />
        <Route path="register/role" element={<PrefixedAuthRedirect to="/register/role" />} />
        <Route path="teacher/register" element={<PrefixedAuthRedirect to="/teacher/register" />} />
        <Route path="admission" element={<PrefixedAdmissionRedirect />} />
        <Route path="*" element={<NotFoundPage />} />
        </Route>
        {/* Legacy public URLs (Phase 1): client-side equivalent of the
            firebase.json 301s — old links and bookmarks land on
            /bn/... . Direct loads get the real 301 from Hosting. */}
        <Route path="/bcs" element={<LegacyRedirect />} />
        <Route path="/bank" element={<LegacyRedirect />} />
        <Route path="/primary" element={<LegacyRedirect />} />
        <Route path="/ntrca" element={<LegacyRedirect />} />
        <Route path="/admission" element={<LegacyRedirect />} />
        <Route path="/guides" element={<LegacyRedirect />} />
        <Route path="/support" element={<LegacyRedirect />} />
        <Route path="/suggestions" element={<LegacyRedirect />} />
        <Route path="/class" element={<LegacyRedirect />} />
        <Route path="/class/*" element={<LegacyRedirect />} />
        <Route path="/skills" element={<LegacyRedirect />} />
        <Route path="/admissions" element={<LegacyRedirect />} />
        <Route path="/admissions/*" element={<LegacyRedirect />} />
        <Route path="/jobs" element={<LegacyRedirect />} />
        <Route path="/jobs/*" element={<LegacyRedirect />} />
        <Route path="/learn" element={<LegacyRedirect />} />
        <Route path="/learn/*" element={<LegacyRedirect />} />
        <Route path="/opportunities" element={<LegacyRedirect />} />
        <Route path="/opportunities/*" element={<LegacyRedirect />} />
        <Route path="/library" element={<LegacyRedirect />} />
        <Route path="/library/*" element={<LegacyRedirect />} />
        <Route path="/books" element={<LegacyRedirect />} />
        <Route path="/books/*" element={<LegacyRedirect />} />
        <Route path="/lessons/*" element={<LegacyRedirect />} />
        <Route path="/health" element={<LegacyRedirect />} />
        <Route path="/health/*" element={<LegacyRedirect />} />
        <Route path="/life" element={<LegacyRedirect />} />
        <Route path="/life/*" element={<LegacyRedirect />} />
        <Route path="/tools" element={<LegacyRedirect />} />
        <Route path="/tools/*" element={<LegacyRedirect />} />
        <Route path="/search" element={<LegacyRedirect />} />
        <Route path="/about" element={<LegacyRedirect />} />
        <Route path="/why-eduvelto" element={<LegacyRedirect />} />
        <Route path="/founder" element={<LegacyRedirect />} />
        <Route path="/contact" element={<LegacyRedirect />} />
        <Route path="/privacy" element={<LegacyRedirect />} />
        <Route path="/privacy-policy" element={<LegacyRedirect />} />
        <Route path="/terms" element={<LegacyRedirect />} />
        <Route path="/editorial-policy" element={<LegacyRedirect />} />
        <Route path="/content-accuracy" element={<LegacyRedirect />} />
        <Route path="/certificate-policy" element={<LegacyRedirect />} />
        <Route path="/disclaimer" element={<LegacyRedirect />} />
        <Route path="/install" element={<LegacyRedirect />} />
        <Route path="/ai-teacher" element={<LegacyRedirect />} />
        <Route path="/ai-assistant" element={<LegacyRedirect />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/register/role" element={<RoleSetupPage />} />
        <Route path="/login" element={<LoginPage />} />
        {/* D-04 (QA 27 Nov 2026): cleanUrls 308s /offline.html to
            /offline — this route is the target, rendering the same
            branded offline content the worker serves from precache. */}
        <Route path="/offline" element={<OfflinePage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/guardian-links" element={<GuardianLinksPage />} />
        <Route path="/dashboard" element={<DashboardRedirect />} />
        <Route path="/student" element={<StudentDashboardPage />} />
        <Route path="/teacher" element={<TeacherDashboardPage />} />
        <Route path="/guardian" element={<GuardianDashboardPage />} />
        <Route path="/teacher/register" element={<TeacherRegisterPage />} />
        <Route path="/directory" element={<DirectoryPage />} />
        <Route path="/subjects/:subjectId" element={<SubjectPage />} />
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
          <Route path="question-reports" element={<AdminQuestionReportsPage />} />
          <Route path="jobs/corrections" element={<AdminJobCorrectionsPage />} />
          <Route path="jobs/domains" element={<AdminJobDomainsPage />} />
          {/* Job Preparation System (24 Nov 2026): MCQ + written +
              previous-question + approval + schedule + results +
              subjects + exams admin (§5). */}
          <Route path="jobs/questions" element={<AdminJobQuestionsPage />} />
          <Route path="jobs/written" element={<AdminJobWrittenPage />} />
          <Route path="jobs/previous" element={<AdminJobPreviousPage />} />
          <Route path="jobs/approvals" element={<AdminJobApprovalsPage />} />
          <Route path="jobs/schedule" element={<AdminJobSchedulePage />} />
          <Route path="jobs/results" element={<AdminJobResultsPage />} />
          <Route path="jobs/subjects" element={<AdminJobSubjectsPage />} />
          <Route path="jobs/exams" element={<AdminJobExamsPage />} />
          {/* Question Paper Generator Phase 2 (25 Nov 2026): TrxID /
              custom-order review + contribution review queues. */}
          <Route path="qpg-orders" element={<AdminQpgOrdersPage />} />
          <Route path="qpg-contributions" element={<AdminQpgContributionsPage />} />
          <Route path="admissions" element={<AdminAdmissionsPage />} />
          <Route path="admissions/structure" element={<AdminNuStructurePage />} />
          <Route path="admissions/syllabus" element={<AdminNuSyllabusPage />} />
          <Route path="admissions/questions" element={<NuQuestionWorkbenchGuard><AdminNuQuestionsPage /></NuQuestionWorkbenchGuard>} />
          <Route path="analytics" element={<AdminAnalyticsPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
          <Route path="security" element={<OwnerSecurityPage />} />
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
        <Route path="/exam" element={<ExamPage />} />
        <Route path="/mock-exam" element={<MockExamPage />} />
        <Route path="/live-exam" element={<LiveExamPage />} />
        <Route path="/routine" element={<RoutinePage />} />
        <Route path="/progress" element={<ProgressPage />} />
        <Route path="/social" element={<SocialPage />} />
        <Route path="*" element={<NotFoundPage />} />
        </Routes>
        </Suspense>
        {isAdminShell ? null : <Footer />}
        {/* Mobile bottom navigation (homepage redesign, 21 Nov 2026):
            হোম / আমার কোর্স / প্রগ্রেস / বেশি কিছু / মেনু, ≤768px. Sits
            above the bottom ad banner when one is live. Hidden on /admin* and /ceo* routes — the Admin Panel and CEO Panel render their own bottom nav. */}
        {isAdminShell ? null : (
          <BottomNav bottomOffsetPx={effectiveBannerReservePx} />
        )}
        {bannerPlacement ? <AdSlot placement={bannerPlacement} onUnfilled={handleBottomBannerUnfilled} /> : null}
        </>
      )}
    </div>
  );
}
