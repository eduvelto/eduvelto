// Eduvelto — Job planner data (Step 12).
//
// The planner reads EXACTLY what the dashboard already reads:
// the student's own attempts (Step 8/9 collections, owner-read
// rules proven by the Step 10/11 r-tests), the published
// bundles that guard every practice link, and today's daily
// mock. One-shot getDoc/getDocs only — NO onSnapshot. Bounded:
// at most 20 practice + 20 mock attempts, plus one
// published-bundle query per exam the student actually touches
// (attempts + target exam). The page says so when a list hits
// its cap, so a capped window is never presented as a lifetime
// total.
//
// NO new collections, NO new rules: the plan, the week and the
// revision queue are all derived client-side from those reads
// (jobPlanner.ts). Both consultations suggested new
// collections (Gemini: users/{uid}/studyDays; ChatGPT:
// studyPlans / dailyGoals / revisionItems / studySessions /
// weeklyPlans) — DEFERRED (see team/job-step12-planner-
// 2026-11-23.md): each needs a rules match block against a
// 1,138-byte compiled margin, plus a writer + backfill, for
// data the existing attempts already carry. The daily goal
// itself lives on the profile (Step 3 fields, existing rules).

export {
  loadDashboardAttempts,
  loadPublishedBundlesForExams,
} from './jobDashboardData';
