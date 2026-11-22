# Job Preparation — Beginner/Advanced Mode Report (Task 1)

**Date:** 22 November 2026 (owner order 07:19 + 07:20 "no more planning, just build")
**Branch:** `jobs/section-structure` (HEAD `3dea7c9`, pushed)
**Preview:** https://eduvelto--jobs-section-xayexyil.web.app — channel `jobs-section`, expires **29 Nov 2026 07:25 Dhaka** (29 Nov 01:25 UTC)
**Scope:** Task 1 ONLY — Beginner/Advanced Mode. No engine, no question bank, no mocks, no migration work.

## What was built
- **Mode switch (segmented toggle, Bangla + English)** — component `src/components/JobModeSwitch.tsx`, rendered on `/jobs`, under the tab bar of **every** exam hub page (`/jobs/:exam[/:tab]`), and on `/jobs/dashboard`. Shows a one-line description of the active mode + "switch any time" note.
- **Beginner hub view** (`JobHubPage.tsx`, home tab, mode = beginner): an "easy explanation" card (what the exam is, who runs it, the stages — plain words, from the exam's own data, nothing invented) + a 3-step basic practice path (Subjects → topic-wise basic practice → start with easy questions), each step linking to its tab. **No timers, no competitive elements** anywhere in this view.
- **Advanced hub view** (home tab, mode = advanced): timed-mock entry (real pattern time + negative marking from `EXAM_PATTERNS` where verified, e.g. BCS 2h / −0.50; circular-based note otherwise), full model test entry, and a competitive-preparation card (weekly mock cycle BCS → Bank → Primary → NTRCA + the note that results/weak-topic analysis appear after mocks run). **No rank / leaderboard** — competitive scores are never shown without server-side verification.
- **Dashboard** (`/jobs/dashboard`): a "My mode" card showing the current mode (Beginner / Advanced) with the switch inside it.

## How the mode is stored
- **Signed in:** `users/{uid}.jobMode` (`'beginner' | 'advanced'`, default/absent = beginner) — `src/lib/profile.ts` (`UserProfile`, `ProfileEdit`, `EDITABLE_KEYS`). Firestore rules: added to the self-update allowlist with enum validation, to the owner-update allowlist, and to the create validation (`firestore.rules`). A user can change ONLY their own doc, and only to the two valid values.
- **Signed out:** `localStorage` key `eduvelto-job-mode` (fallback only). When signed in, the profile wins; the local value is kept in sync.
- **Hook:** `src/lib/jobMode.ts` (`useJobMode`, `resolveJobMode`) — mirrors the LanguageContext pattern. Switching is fire-and-forget via `saveProfile({ jobMode })`; a failed save leaves the local choice in place.
- **Progress is never lost on switch:** the mode only changes what is SHOWN, never stored progress/results (there is no mode-keyed progress data; nothing is deleted or reset).

## Honestly empty (NOT built — this task is structure only)
- **0 questions in the database.** Every practice / mock / model-test entry shows "শীঘ্রই আসছে" / an honest empty state. No fake questions, counts, timers running on nothing, or ranks.
- No student question submission exists anywhere (owner rule: students can NEVER create/submit questions) — nothing of that kind was built.
- No screenshots in this run — headless Chrome is blocked by the sandbox egress proxy (known limit); the owner's phone check is the visual proof.

## Verification
- `npm run build`: **PASS**
- `npm run test:rules`: **182/182 PASS** (7 files — 180 existing + 2 new: self-update `jobMode='advanced'` ALLOWED, `jobMode='expert'` DENIED)
- Routes curl-verified **5/5 → 200**: `/`, `/jobs`, `/jobs/bcs`, `/jobs/bank`, `/jobs/dashboard`
- Served bundle verified: deployed entry chunk hash matches the local build exactly (`index-BlcLw2Hv.js`); the new strings are present in the served lazy chunks (`JobModeSwitch-CtUZyepW.js`: `eduvelto-job-mode`, `নতুনদের জন্য`, `অভিজ্ঞদের জন্য`, `সহজ ব্যাখ্যা`; `JobHubPage-DwSMgxD7.js`: `সময়ভিত্তিক মক টেস্ট`, `সহজ ব্যাখ্যা`; `JobSeekerDashboardPage-CElW6vwy.js`: `আমার মোড`, `বর্তমান মোড`). Note: job pages are lazy-loaded chunks, so the strings are NOT in the entry chunk — that is expected, not a missing deploy.

## Files changed (commit 3dea7c9, 8 files, +368/−3)
- `src/lib/profile.ts` — `jobMode` on `UserProfile` / `ProfileEdit` / `EDITABLE_KEYS`
- `src/lib/jobMode.ts` — NEW: `JobMode`, `resolveJobMode`, `useJobMode`
- `src/components/JobModeSwitch.tsx` — NEW: segmented toggle
- `src/pages/JobsPage.tsx` — toggle under the hero
- `src/pages/JobHubPage.tsx` — toggle under the tab bar + Beginner/Advanced home-tab views
- `src/pages/JobSeekerDashboardPage.tsx` — "My mode" card
- `firestore.rules` — `jobMode` in create validation + self-update + owner-update allowlists
- `emulator-tests/rules.test.ts` — 2 new tests (d4/d5)

## Not merged, not deployed to production
Staging preview only, per the standing rule (production deploy needs the owner's separate approval).
