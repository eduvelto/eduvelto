# Job Preparation — Section Structure Report

**Date:** 22 November 2026 (built 07:00–08:35 Asia/Dhaka, inside the owner's 2-hour order)
**Branch:** `jobs/section-structure` (HEAD `021d100`, pushed) — resumed the 21 Nov B-1.3 work (0471151 + 0f0948c + 799cefc), not restarted.
**Preview:** https://eduvelto--jobs-section-xayexyil.web.app — channel `jobs-section`, expires **29 Nov 2026 07:05 Dhaka** (29 Nov 01:05 UTC)
**Scope:** DESIGN + NAVIGATION ONLY (structure + pages). NO exam engine, NO question banks, NO mocks — those are Phase 1, months of work.

## Build / rules / verification
- `npm run build`: **PASS** (dist 71 precache entries, 1233.20 KiB)
- `npm run test:rules`: **180/180 PASS** (7 files)
- Routes curl-verified **19/19 → 200**: `/`, `/jobs`, `/jobs/bcs`, `/jobs/bank`, `/jobs/primary-teacher`, `/jobs/ntrca`, `/jobs/dgfood`, `/jobs/bpsc-non-cadre`, `/jobs/cag`, `/jobs/bfsa`, `/jobs/others`, `/jobs/ministries`, `/jobs/defence`, `/jobs/autonomous`, `/jobs/private-ngo`, `/jobs/common`, `/jobs/dashboard`, `/jobs/bcs/subjects`, `/jobs/bcs/mocks`
- Served bundle verified: deployed entry chunk hash matches the local build exactly; all new strings (ministries, defence, autonomous, private-ngo, dashboard, 18th-pattern, DPE 2025) present in the deployed chunks.
- No screenshots in this run — headless Chrome is blocked by the sandbox egress proxy (known limitation); the owner checks the preview on his phone. The 21 Nov screenshots (8 PNGs, pre-change) are in `team/jobs-section-structure-screenshots/`.

## What was built (this run)
1. **4 new exam hubs — the EXPANDED categories from the owner's 19 Nov four-section brief:**
   - `/jobs/ministries` — মন্ত্রণালয় ও অধিদপ্তর (Ministries & Directorates)
   - `/jobs/defence` — প্রতিরক্ষা: পুলিশ / সেনা / নৌ / বিমান বাহিনী (Police / Army / Navy / Air Force)
   - `/jobs/autonomous` — স্বায়ত্তশাসিত প্রতিষ্ঠান (Autonomous Institutions)
   - `/jobs/private-ngo` — বেসরকারি ও এনজিও (Private & NGO Jobs)
   - All 13 hubs now exist (9 from 21 Nov + these 4). All circular-based: no pattern, post count or date invented. `officialUrl` is now nullable — private-ngo has NO single official site and the hub says so honestly instead of linking somewhere wrong. New icons (building, star, layers, people) + AA-checked accents: indigo-800 9.93, red-700 6.47, cyan-700 5.36, fuchsia-700 6.32 (white on accent).
2. **Verified exam patterns on the 4 main hubs** (Home tab, `EXAM_PATTERNS` in `src/lib/jobExams.ts`, source: job-exam-analysis §8.1, 21 Nov 2026):
   - BCS prelim: 200 MCQ, 2h, −0.50, 10-subject breakdown (35/35/30/20/10/15/15/15/15/10); written 900 / 1,100 noted.
   - Bank prelim (Officer, Cash): 100 MCQ, 1h (25/25/20/20/10); AD 4×25 variation noted; written 200, 2h; viva usually 25 (verify per circular).
   - Primary Teacher: 90 MCQ, 90 min, −0.25, pass 50% (45); viva 10, pass 50% (5); DPE 2025 Rules (28 Aug 2025); old 80+20 pattern marked retired.
   - NTRCA: labelled **"last verified pattern (18th)" — NOT "current"**; prelim 100 MCQ, 1h, −0.25, pass 40; written 100, 3h, pass 40; viva 20 (12+8), pass 8.
   - Every pattern card carries the "verify against the latest circular" caveat + source line. All other hubs show an honest "circular-based" state instead of a table.
3. **Job Seeker Dashboard — `/jobs/dashboard`** (structure only): target exam, today's daily mock, this week's full mock (BCS → Bank → Primary → NTRCA cycle), my results, weak topics, study routine, my progress — all honest empty / Coming Soon, zero invented numbers. Signed-out visitors get the login prompt (same pattern as the student dashboard). Linked from `/jobs`. Route declared before `/jobs/:exam` so it never falls into the hub.
4. **Homepage:** the `/jobs` route in this branch is the REAL hub (JobsSection after the class cards, added 21 Nov) — not the Coming Soon placeholder that is on main.

## What is honestly empty (NOT built — Phase 1+)
- Exam engine, question banks, mock tests, previous-question bank, results/progress data, study routine, current-affairs updates — every one of these shows "শীঘ্রই আসছে" / honest empty states. **0 questions published, 0 mocks runnable.**
- No verified teachers (0) — nothing can be Published without teacher review; teacher recruitment (C-1) is the gating work.
- Tier 2/3 + new-category content: structure only, "Coming soon" chips on the cards.

## What was deliberately NOT written (per the plan + brief)
- **BCS viva marks — NEVER.** Sources dispute 200 vs 100; the hub says only that the marks are disputed and will be written after verification from the latest BPSC circular.
- **NTRCA 19th pattern — NEVER.** Claims conflict; the hub says the 19th pattern is not written until the 19th circular arrives.
- **Age limits, fees, exam dates — NEVER** (any exam). They change with every circular.
- **No "you will pass / you will get the job" claim anywhere.** No fake counts, circulars, or popularity badges.

## What remains (not in the 2-hour window)
- Phase 1: Common Exam Engine + Job core (BCS/Bank/Teacher) + question banks + mocks — 8–11 months single-agent per roadmap v1; needs teacher recruitment first.
- New screenshots of the 4 new hubs + dashboard (owner's phone check is the visual proof for now).
- NOT merged to main, NOT deployed to production — staging preview only, per the owner's standing rule (production deploy needs his separate approval).

## Files changed (commit 021d100, 6 files, +556/−21)
- `src/lib/jobExams.ts` — 4 new exam defs, nullable officialUrl, EXAM_PATTERNS
- `src/components/JobCards.tsx` — 4 new icons
- `src/pages/JobHubPage.tsx` — pattern card + nullable official-site link
- `src/pages/JobSeekerDashboardPage.tsx` — NEW
- `src/App.tsx` — `/jobs/dashboard` route + lazy import
- `src/pages/JobsPage.tsx` — dashboard link + tier comment
