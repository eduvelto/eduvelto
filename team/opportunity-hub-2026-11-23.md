# Global Opportunity Hub — build + curation report (23 Nov 2026)

Directive §3B, owner brief 23 Nov 2026 22:13. Branch `feature/opportunity-hub`
(worktree `phase2-project-opportunity-hub/`), from main `fe1bd7e`.
Staging only — no live deploy in this task; the parent sequences the deploy.

## What was built

Public pages (no login) under `/opportunities`:

- `/opportunities` — hub list: search + type chips + status chips +
  verified-only filter (all in the URL), scam warning, tools & guides section.
- `/opportunities/:oppId` — detail: full listing + verification box
  (what was checked, when, at what level, any caveat) + source/apply
  links with hostnames visible.
- `/opportunities/cv-builder` — CV + cover-letter builder, client-side
  only (form → live preview → print/Save as PDF / copy as text).
  Nothing is saved, nothing leaves the browser. Adds to the existing
  `/jobs/cv` reading guide — it does not replace it.
- `/opportunities/interview-prep`, `/opportunities/career-guidance`,
  `/opportunities/entrepreneurship`, `/opportunities/income` — reading
  guides (general guidance, disclaimer on every page, no income
  figure promised anywhere, scam red flags named explicitly).

Wiring: lazy routes in `App.tsx` (static guide routes BEFORE dynamic
`:oppId`); SEO entries in `src/lib/seo.ts` (6 static + seed-based
dynamic detail SEO — an unknown/unpublished doc resolves to null and
falls back to noindex); `public/sitemap.xml` +13 URLs (79 → 92);
`firebase.json` rewrites `/opportunities` + `/opportunities/**`;
HeaderNav jobs-menu item + SECONDARY list + Footer link.

## Data model — `opportunities` (Firestore, Phase 4 rules already live)

Fields (allowlist `OPPORTUNITY_ALLOWED_KEYS` in `src/lib/opportunities.ts`):

| Field | Meaning |
|---|---|
| `docId` | Stable slug, e.g. `bpsc-non-cadre-2026` |
| `type` | `job \| remote \| freelance \| internship \| scholarship \| skill` |
| `titleBn / titleEn`, `organizationBn / organizationEn`, `countryBn / countryEn` | Bilingual display |
| `eligibilityBn / eligibilityEn`, `descriptionBn / descriptionEn` | From the official source |
| `sourceName`, `sourceUrl` | The official page that was verified |
| `applyUrl` (nullable) | Official application link, or null when not confirmed |
| `publishedDate` (nullable) | When the official source published it; null when not stated |
| `applicationDeadline` (nullable) + `deadlinePrecision` (`date_only \| datetime`) | Null when not stated — never guessed |
| `isPlatform` | True for continuously-open platforms/courses (no deadline) |
| `verificationLevel` | `official` (official page read) or `official-indexed` (official site's own indexed record corroborated; full notice not rendered) |
| `verificationNoteBn / verificationNoteEn` (nullable) | Caveats — shown on the detail page |
| `verifiedBy` (nullable), `verifiedAt` | Presence of `verifiedBy` is what makes a listing "verified" in the UI |
| `reviewStatus` | `Published \| Not Started \| In Progress \| Under Review \| Rejected` (capital-`Published` — the rules check exactly that) |
| `authorId`, `createdAt`, `updatedAt` | Audit |

Rules (Phase 4, unchanged in this branch): public read only when
`reviewStatus == 'Published'`; moderator create (draft only) /
update; Admin delete. Proven by `emulator-tests/rules-opportunities.test.ts`
(17 checks: public read, draft hiding, create-draft-only, publish-via-update,
delete admin-only, suspended moderator blocked, careerPaths reads).

Honesty model (mirrors `jobCirculars.ts`):

- **Verified ≠ published.** A Published listing without `verifiedBy`
  is published, not verified.
- **Status is computed, never stored** (`opportunityStatus`): `rolling`
  for platforms; `unknown` for a dated listing with no deadline;
  `date_only` deadlines close at end of day Asia/Dhaka; `datetime`
  deadlines close at the exact instant; ≤3 days left is `closing-soon`.
- **No confirmed deadline, no countdown, no Open badge.**
- **Apply button only** when verified + `applyUrl` present +
  status open/closing-soon/rolling.
- **Expired listings stay listed, marked "আবেদন শেষ"** — never deleted.
- **No income is ever promised.** Platforms are described as platforms.

Seed = v1 source of truth (`src/lib/opportunitySeed.ts`): the hub renders
the static verified seed when the Firestore `opportunities` collection
is empty; Firestore Published docs take precedence by docId once
moderators publish. `scripts/seed-opportunities.mjs` writes exactly these
docs to the EMULATOR only (dry-run + apply, idempotent, validated
before write, refuses live). No production data writes in this task.

No save/applied tracking in v1 — deferred as a login-gated Phase-2
feature (`opportunitySaves` collection + rules). `BACKUP_COLLECTIONS`
already contains `opportunities` and `careerPaths` (22 Nov) — no change.

## Verified seed listings (23 Nov 2026 — quality over count)

Every listing below was verified from its official source on 23 Nov 2026.
Nothing invented: a date the official page did not show is null; a vacancy
total two summaries disagree on is NOT published.

| # | Listing | Source | Deadline |
|---|---|---|---|
| 1 | BPSC Non-Cadre Recruitment 2026, Circulars (78–82)/2026 and (83–96)/2026 — 19 post categories, Grades 5–12, Form-5A, fee by Teletalk SMS | https://www.bpsc.gov.bd; apply http://bpsc.teletalk.com.bd | **30 Nov 2026, 6:00 PM Dhaka** (datetime). Published date not stated → null. Level `official-indexed`. **Caveat: vacancy total NOT published (133 vs 147 disagree) — re-check the official PDF in a live browser before the live deploy.** |
| 2 | Writer/Editor, UNICEF Bangladesh Country Office (Consultant, International, Remote, 5 months) — Master's + 10 years; no fee at any stage | UNICEF Careers (job 597004) | **25 Nov 2026** (date-only). Published 16 Nov 2026. Level `official`. Closing soon at build time. |
| 3 | Intern — Project Management, UNDRR, Geneva (remote or in-person), Job Opening ID 288035 — full-time, unpaid, ≥6 months from Jan 2027 | https://careers.un.org/jobSearchDescription/288035?language=en | **30 Nov 2026** (date-only). Published 15 Nov 2026. Level `official-indexed` (UN Careers page returned only a JS shell; details from the official indexed record — **re-check in a live browser before the live deploy**). |
| 4 | Commonwealth Shared Scholarships 2027/28 — one-year taught Master's, Bangladesh explicitly eligible, fully funded (tuition, airfare, stipend), no fee | https://cscuk.fcdo.gov.uk/scholarships/commonwealth-shared-scholarships-applications/ | **8 Dec 2026, 16:00 GMT** (datetime). Published date not stated → null. Level `official`. |
| 5 | Kaggle Learn — free micro-courses (Python, ML, Pandas, SQL, Data Visualisation, Deep Learning) | https://www.kaggle.com/learn | Rolling, no deadline, `isPlatform: true`. Level `official`. |
| 6 | Google Skillshop — free training/certification (Google Ads, GA4, etc.) | https://skillshop.withgoogle.com/ | Rolling, no deadline, `isPlatform: true`. Level `official`. |
| 7 | Upwork — freelance marketplace, platform description only (no job posting, no income claim) | https://www.upwork.com/ | Rolling, no deadline, `isPlatform: true`. Level `official`. |

Rejected (do NOT add without fresh verification): Chevening 2026/27
(closed 6 Oct 2026); Australia Awards Bangladesh 2027 (closed 30 Apr 2026);
Commonwealth Master's/PhD 2027/28 (closed 20 Oct 2026); 51st Special BCS
Health Cadre (closed 25 Oct 2026); World Bank WBG Pioneers Internship
Fall/Winter 2026 (closed); Google Data Analytics Certificate on Coursera
(not free — certificate needs subscription/aid); UN OHCHR Human Rights
Internship (deadline 23 Nov 2026, same day); Fiverr (homepage fetch
blocked HTTP 403 — legitimate platform but NOT counted as verified;
needs a live-browser check before adding).

## Expiry + freshness process (moderator routine)

1. **Daily expiry check (automated where possible, manual otherwise):**
   run the hub list and confirm every dated listing's computed status
   matches its official source. Expired listings stay listed, marked
   "আবেদন শেষ" — they are never deleted, so the record survives.
2. **Weekly re-verification:** open each listing's `sourceUrl` and
   confirm the deadline/status still matches. If the official page
   changed, update the doc (moderator update) with a new `verifiedAt`
   and a note; if the listing was withdrawn, set `reviewStatus` to
   `Rejected` with a note (the detail page then renders "not found").
3. **Closing-soon watch:** listings ≤3 days from deadline show
   "closing-soon" automatically; moderators prioritise re-checking
   those first.
4. **New listings:** only from the official source, with the same
   verification record (`verifiedBy`, `verifiedAt`, level, note).
   Aggregator copies without an official-source check are never added.
   A listing whose official page cannot be read is `official-indexed`
   with its caveat stated — never presented as a full official-page read.
5. **Seed maintenance:** when the TS seed changes, the emulator seed
   is re-applied with `scripts/seed-opportunities.mjs --apply --emulator
   127.0.0.1:8080 --allow-modify` (createdAt preserved; audit file in
   `team/`). Production seeding is a separate, owner-approved step.
6. **Scam reports:** any user report of a fee/OTP/payment request on a
   listed opportunity → the listing is pulled to draft immediately
   (moderator update) pending re-verification.

## Bugs found + fixed in this branch

1. **Seed rendered nothing (critical, caught by the new unit tests).**
   `seedOpportunities()` passed seed rows straight into
   `opportunityFromStored`, but rows carry millis fields
   (`publishedDateMillis`, …) plus `docId`, while the validator
   expects the stored shape (`publishedDate`, `applicationDeadline`, …)
   and rejects unexpected keys — every row failed validation and the
   hub would have shown empty. Fixed by converting rows to stored
   shape in `seedOpportunities()`; the unit test "all 7 seed rows
   validate and render" pins it.
2. **Sitemap/SEO docId drift:** the first sitemap draft used
   `undrr-intern-project-management-2026` and
   `commonwealth-shared-scholarships-2027`; the seed uses
   `undrr-intern-pm-2026` and `commonwealth-shared-2027`. Fixed in
   `public/sitemap.xml` + `seo.test.ts`; the SEO test
   ("every sitemap URL resolves to real SEO") now guards this.
3. **Seed-script loader matched the wrong `[` (caught by the first
   emulator dry-run, which planned 0 docs).** `loadSeedRows` took
   the first `[` after `OPPORTUNITY_SEED` — which is the `[` in the
   type annotation `OpportunitySeedRow[]`, extracting an empty array.
   Fixed to start after the `=`; rows also reference the file-level
   `SEED_AUTHOR` / `VERIFIED_AT` constants, so their declarations
   are evaluated in the same scope now.
4. **Read-back timestamp precision (caught by the first emulator
   apply, exit 2).** The REST API returns timestamps with nanosecond
   precision (`…00.000000000Z`) while `Date.toISOString()` emits
   milliseconds (`…00.000Z`) — a raw string comparison always
   mismatched. `docsEqual` now compares timestamps by instant
   (`Date.parse` both sides).
5. **Apply was never idempotent (caught by the re-run dry-run).**
   The plan compared `updatedAt`, which the script refreshes on
   every write — so every doc always read "modified". The plan now
   excludes `updatedAt` from the comparison; the read-back still
   verifies the refreshed value. Verified: apply exit 0, re-run
   dry-run reports 7 unchanged.

## Tests (this branch)

- Unit: `src/lib/__tests__/opportunities.test.ts` — 35 tests (status,
  deadline lines, Apply gating, published-vs-verified, validation,
  sort, filters, seed integrity with source + deadline per listing).
- Unit: `src/lib/__tests__/seo.test.ts` — 29 tests (13 new hub URLs
  in sitemap + SEO, titles unique, no forbidden rank claims).
- Rules: `emulator-tests/rules-opportunities.test.ts` — 17 checks
  (see §Data model). Full rules suite: 1,213 tests across 37 files,
  all passing — run in 3 chunks + the opportunities file standalone
  (the single `npm run test:rules` run was interrupted twice by
  runtime restarts; chunk logs in
  `opportunity-hub-preview-checks/rules-chunk-*.log`). Chunk B/C
  showed 5 transient failures on the first parallel run
  ("client is offline" / empty query results under emulator load);
  every one passes on re-run alone (step2 25/25, rules.test.ts
  79/79) — emulator/load flakes, not code failures.
- Seed script verified against a live emulator (23 Nov 2026, ~17:45):
  dry-run planned 7 new → apply exit 0 (audit
  `team/opportunity-seed-apply-audit-2026-11-23.json`, read-back
  passed) → re-run dry-run reports 7 unchanged; REST list confirms
  exactly 7 Published docs with the correct deadlines.

## What remains (parent / later)

- Live-browser re-checks before the live deploy: BPSC official PDF
  (133 vs 147 vacancy discrepancy) and the UNDRR UN Careers page
  (JS shell in fetch). Fiverr needs a live-browser check before adding.
- Moderator admin UI for `/opportunities` (create/edit/publish flow)
  — v1 has no admin page; moderators publish via the seed script or
  direct Firestore writes for now.
- Save/applied tracking (login-gated Phase 2, `opportunitySaves`).
- The two seed caveats above must be cleared or carried into the
  live listing notes before deploy.
- Live deploy sequencing is the parent's job (staging only here).
