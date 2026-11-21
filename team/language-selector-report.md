# Language Selector — Report

**Branch:** `i18n/language-selector` (from `staging/integration` 90a83e5) · **Worktree:** `~/workspace/eduorbit/phase2-project-i18n/`
**Preview (staging channel):** https://eduvelto--language-selector-66nlpwbc.web.app — expires 2026-11-28
**Status:** complete, build PASS, rules 180/180 PASS. **No production deploy.** No `firestore.rules` change. No content/exam/security logic changed.

## 1. The problem (audit)

The site rendered Bangla + English **together** on nearly every label — e.g. "শিক্ষার্থী ড্যাশবোর্ড / Student Dashboard", "আমার বই / My Books", and two stacked paragraphs (one Bangla, one muted English) for intros, disclaimers, labels and empty states. Three mechanisms produced the mix:

| Mechanism | Where | Count (before) |
|---|---|---|
| Hardcoded dual strings `'বাংলা / English'` in JSX | Header/nav, footer, buttons, labels, error strings, placeholders across ~35 files | ~330 sites |
| Two-paragraph renders `{x.bn}</p>` + `{x.en}</p>` | Page intros, health disclaimers, admin cards, suspended screen, AiTeacher/Social notes | ~40 pairs |
| `.bn`-only renders (`{x.bn}` with no `.en` anywhere) | Nav links, login/register/profile labels, dashboard buttons, class cards, BottomNav | ~60 sites (showed Bangla even in English mode) |
| Dual data labels at the source | `classFilterOptions` (`${def.bn} · ${def.en}`), `formatTime` (hard-coded `bn-BD` locale), `friendlyAdminError` (Bangla-only strings) | 3 lib sites |

Strings lived in `src/i18n/strings.ts` as `{bn, en}` pairs (good), but most pages rendered **both** fields instead of picking one. Book/lesson/exam **content** was already single-language per subject and is untouched.

## 2. What was built

### `src/i18n/LanguageContext.tsx` (new)
- `LanguageProvider` + `useLanguage()` returning `{ lang: 'bn' | 'en', t, setLanguage }`; `<T bn en />` component for JSX text.
- `t({bn, en})` returns the string in the active language; `document.documentElement.lang` is set (`bn` / `en`).
- Default `bn`. Switching updates the whole UI instantly (context re-render, no reload).
- Fonts: the design system's Poppins + Hind Siliguri pairing is already in `index.css` — no change needed.

### Persistence — account preference, cross-device (owner brief 21 Nov 16:11)
- Signed-in user: `users/{uid}.language` in Firestore, read at login and applied immediately; changing it in Profile → Settings writes the field, so the choice survives logout/login and applies on another device.
- **No rules change was needed — verified:** `firestore.rules` already allows it: create requires `request.resource.data.language in ['bn', 'en']` (≈L136), and `language` is in the allowed own-profile update fields list (≈L168). The rules suite (180 tests) passes unchanged.
- Logged-out visitors: `localStorage` key `eduvelto-language` only (fallback).
- Profile → Settings already had a language `<select>` that saved but did nothing; it is now wired to the context.

### Conversion pattern used everywhere
- UI strings: `{t({ bn: '…', en: '…' })}` or `<T bn="…" en="…" />`; existing `{bn, en}` string objects: `{t(obj)}`.
- Data with Bn/En fields (class levels, health records, filters): `{lang === 'bn' ? xBn : xEn}`.
- **Do-not-translate rules applied:** book original names, author names, original academic terms, paper codes, class/subject/board values, exam question/answer content, and all user-written content (names, reasons, messages, posts) are rendered as-is in both modes.
- **Lib fixes (the duals that lived outside pages):**
  - `src/lib/classLevels.ts` — `ClassFilterOption.label` (dual `${bn} · ${en}`) split into `labelBn`/`labelEn`; Library/Directory render via `t()`.
  - `src/lib/admin.ts` — `formatTime(value, lang)` (was hard-coded `bn-BD`; now `en-GB` in English mode) — 18 call sites in 6 admin pages pass `lang`.
  - `src/lib/admin.ts` — `friendlyAdminError(error, lang)` rewritten as a bn/en table (18 messages + default) — 17 call sites pass `lang`.
  - `FounderPage` — `useSeo` tab title/description now follow the active language (JSON-LD stays English: structured data, not visible UI).

### Codemod damage repaired (found during this work)
- A previous codemod had corrupted the import blocks of `GuardianLinksPage.tsx` and `TeacherRegisterPage.tsx` (`import {` left dangling with the `T` import inserted inside it) — fixed.
- `AdminGuardiansPage.tsx` was missing its `T` import and was only half-converted — fully converted.

## 3. What changed per area

| Area | Files | Strings converted |
|---|---|---|
| Shell (header, nav, footer, mobile nav, menus) | `App.tsx`, `Footer.tsx`, `BottomNav.tsx`, `ComingSoon.tsx`, `ClassCards.tsx`, `InstallAppPrompt.tsx`, `AdminGuard.tsx`, `ui.tsx`, `AdPlaceholder.tsx` | ~45 |
| Lesson reader | `LessonReader.tsx` | 15 |
| Health (hub + 5 sub-pages + disclaimer) | `HealthPage.tsx`, `HealthMedicinesPage.tsx`, `HealthDiseasesPage.tsx`, `HealthDoctorsPage.tsx`, `HealthHospitalsPage.tsx`, `HealthReportPage.tsx`, `HealthDisclaimer.tsx` | ~40 |
| Admin guardians | `AdminGuardiansPage.tsx` | ~25 |
| Browse flow | `HomePage.tsx` (56), `LibraryPage.tsx` (29), `DirectoryPage.tsx` (23), `ClassDashboardPage.tsx` (32+2 `<T>`), `ClassDashboardTabs.tsx` (49), `ClassSubjectPage.tsx` (9), `SubjectPage.tsx` (8), `BookPage.tsx` (11), `ChapterPage.tsx` (4), `LessonPage.tsx` (5) | 226 |
| Practice / progress | `ExamPage.tsx` (17), `QuizPage.tsx` (14), `QuizResultPage.tsx` (14), `ProgressPage.tsx` (26), `RoutinePage.tsx` (5), `AiTeacherPage.tsx` (1 block), `SocialPage.tsx` (1 block) | ~78 |
| Auth / profile / dashboards | `LoginPage.tsx` (9), `RegisterPage.tsx` (25), `ProfilePage.tsx` (34), `RoleSetupPage.tsx` (22), `TeacherRegisterPage.tsx` (34), `GuardianLinksPage.tsx` (21), `GuardianDashboardPage.tsx` (30), `StudentDashboardPage.tsx` (16), `TeacherDashboardPage.tsx` (27) | ~218 |
| Static pages | `AboutPage.tsx` (22), `FounderPage.tsx` (56), `ContactPage.tsx` (15), `PrivacyPage.tsx` (4) | 97 |
| Admin pages | `AdminPage.tsx` (36), `AdminAds.tsx` (43), `AdminAuditPage.tsx` (13), `AdminBackupPage.tsx` (32), `AdminFeaturesPage.tsx` (12), `AdminTeachersPage.tsx` (28), `AdminUserDetailPage.tsx` (45), `AdminUsersPage.tsx` (15) | 224 |
| Shared libs | `lib/classLevels.ts`, `lib/admin.ts` (`formatTime`, `friendlyAdminError`) | 3 sites + 35 call sites |
| **Total** | **61 files changed, +1,860 / −1,648 lines** | **≈950 UI strings** (repo now: 874 `t({…})` sites + 139 `<T>` uses) |

Notes on specific decisions:
- `HomePage` FEATURE_STRIP / WHY_CHOOSE: the old `bn`/`en` fields were **not** translations — `bn` held the English headline and `en` the English subline. Restructured to real `bn`/`en` title pairs + `subBn`/`subEn` sublines.
- `BookPage`/`ChapterPage`/`LessonPage` had `titleEn={'Book'/'Lesson'}` — English mode showed a generic word instead of the title. `titleEn` is now the actual title (data names stay untranslated in both languages).
- `GuardianLinksPage`: the original "হ্যাঁ, এনি আমার অভিভাবক" typo ("এনি") is preserved verbatim — content fix is the owner's call, not this branch's.
- Dates/numbers now follow the active language (`bn-BD` vs `en-GB` locales; Bangla digits in Bangla mode, plain digits in English mode) on: Profile member-since, ClassDashboardTabs result dates, AdminAudit day keys, ExamPage result dates, QuizPage timer, AdminPage/Backup/AdminUsers timestamps.
- The brand logo image (`logo-white.png`) contains "Learn • Grow • Achieve" as pixels — it is the logo asset, not UI text; unchanged.

## 4. Per-page coverage table

"✓" = whole page renders one language in both modes (verified by grep + screenshots for the key pages; all pages by code audit). "△" = covered except a listed incomplete item (§5).

| Route | Page | bn | en | Notes |
|---|---|---|---|---|
| `/` | HomePage | ✓ | ✓ | Screenshot both modes |
| `/directory` | DirectoryPage | ✓ | ✓ | Screenshot both modes; cascading-filter redesign is a separate brief, not this branch |
| `/library` | LibraryPage | ✓ | ✓ | Screenshot both modes |
| `/library/:id` | BookPage | ✓ | ✓ | Book titles/content untranslated by design |
| `/books/:id/chapters/:cid` | ChapterPage | ✓ | ✓ | |
| `/lessons/:id` | LessonPage | ✓ | ✓ | Questions/answers are content |
| `/class/:slug` (+ tabs) | ClassDashboardPage, ClassDashboardTabs | ✓ | ✓ | |
| `/class/:slug/subjects/:dept` | ClassSubjectPage | ✓ | ✓ | |
| `/subjects/:id` | SubjectPage | ✓ | ✓ | |
| `/exam` | ExamPage | ✓ | ✓ | Question content untouched |
| `/quiz/:id`, `/quiz/:id/result` | QuizPage, QuizResultPage | ✓ | ✓ | |
| `/progress` | ProgressPage | ✓ | ✓ | |
| `/routine` | RoutinePage | ✓ | ✓ | |
| `/health` + 5 sub-pages | Health* | ✓ | ✓ | Screenshot (hub, en); health data picks Bn/En per language |
| `/ai-teacher` | AiTeacherPage | ✓ | ✓ | Demo disclaimer single-language |
| `/social` | SocialPage | ✓ | ✓ | Proposal-only note single-language |
| `/login`, `/register`, `/register/role` | Login/Register/RoleSetup | ✓ | ✓ | Validation + errors translated |
| `/profile` | ProfilePage | ✓ | ✓ | Screenshot (signed-out state, bn); language `<select>` lives here |
| `/dashboard` | Student/Teacher/Guardian dashboards | ✓ | ✓ | Screenshot (signed-out → login, en mobile); signed-in dashboards need an account to view — see §6 |
| `/guardian/links` | GuardianLinksPage | ✓ | ✓ | |
| `/teacher/register` | TeacherRegisterPage | ✓ | ✓ | |
| `/about`, `/founder`, `/contact`, `/privacy` | Static pages | ✓ | ✓ | Privacy body: see §5 |
| `/admin`, `/admin/*` | Admin pages (8) | ✓ | ✓ | Timestamps + admin errors now lang-aware |
| Header / footer / bottom nav / install prompt / skeletons / alerts | Shell components | ✓ | ✓ | Screenshot both modes |

## 5. Incomplete-translation list (nothing shown wrong or mixed — these stay in their original language and are flagged, per the brief)

1. **Privacy Policy body text** (`PrivacyPage.tsx`): headings, intro date line and section headings are translated; the 10 sections' **body paragraphs/lists remain Bangla-only** in English mode. An English privacy policy still needs to be written and approved — legal text was not invented.
2. **Auth-provider error text** (`src/lib/auth.tsx`): Firebase/auth error strings shown via `shownError` on Login/Register/Profile come from the auth library in whatever language Firebase returns; not converted (outside page scope).
3. **`err.message` passthroughs** in catch blocks (RoleSetup, GuardianLinks, GuardianDashboard, TeacherDashboard, LessonReader bookmark/progress): the raw library/Firebase message is shown after the translated fallback; its language depends on the error source.
4. **Static `index.html` meta description**: "Eduvelto — শেখো, এগিয়ে যাও, স্বপ্ন গড়ো | Learn, Grow, Achieve. …" is dual-language in the HTML shell (visible in search results/link previews, not on the page). No page overrides it via `useSeo` yet. Fix: add a lang-aware description on HomePage (follow-up).
5. **JSON-LD structured data** (FounderPage `PERSON_JSON_LD` etc.): English-only by design — machine-readable data, not visible UI. Tab title/description are translated.
6. **User-written content** (by design, per the do-not-translate rule): user/admin names, decision reasons, support messages, posts, questions, `suspendedReason`, `academicProfileSummary`, audit `details`/`before`/`after`.
7. **AdminAds checklist item "Privacy Policy — not written yet"** (AdminAds.tsx:152–154): stale — the Privacy Policy page now exists. Translated as-is; the checklist text itself needs a content fix (separate).

## 6. Test results

- **Build:** `npm run build` — **PASS** (tsc + vite, PWA precache 65 entries). Two intermediate failures were found and fixed during the work (corrupted import blocks, missing `T` import, `ClassFilterOption.label` rename fallout).
- **Rules suite:** `npm run test:rules` — **PASS, 180/180 tests, 7 test files** (emulator, `JAVA_TOOL_OPTIONS=-Djava.net.preferIPv4Stack=true`, bundled Temurin JRE 17 — Java had to be put on PATH first; first run failed with `Could not spawn java -version`). `firestore.rules` untouched.
- **Audit greps after conversion:**
  - Hardcoded dual strings `[অ-হ] / [A-Za-z]` in rendered code: **0** (remaining hits: 1 CSS comment, 1 `whereBn` data value whose "/" separates two Bangla navigation steps, not languages).
  - Dual-paragraph `.bn}</p>` + `.en}</p>` pairs: **0**.
  - `.bn}`-only renders: **0** (every remaining `.bn`/`.en` use is inside a `<T>`, a `titleBn/titleEn` prop, or a `t()` pair — all single-language renders).
- **Screenshots** (`team/language-selector-screenshots/`, 24 files — 6 pages × 2 modes × desktop 1280 + mobile 390):
  - Home, Library, Dashboard (signed-out → login), Profile/Settings (signed-out), Directory, Health — each in Bangla + English, desktop + mobile.
  - Verified visually: each mode shows **one language only**; mobile 390px has no overflow (bottom nav, hamburger menu, forms all fit).
  - Signed-in dashboard/settings states could **not** be screenshotted — no test account exists in this worktree and creating one would touch live auth. The signed-out states shown are the translated login prompts; the dashboard components themselves are converted in code (same `t()` pattern, audited).
  - Screenshot method: headless Chromium via CDP against the preview channel, `localStorage eduvelto-language` set to `bn`/`en` before load. (Chrome could not use the VM's credentialed egress proxy directly — a local CONNECT forwarder was used for the screenshot run only; script kept at `~/workspace/eduorbit/i18n-shots-tmp/`.)
- **What was NOT verified live:** cross-device account persistence end-to-end (needs a real sign-in on two devices + Firestore write; the code path is `LanguageContext` → `users.language` and the rules allow it — see §2). Recommend the owner check: set English on his phone, log in on desktop, confirm English.

## 7. Remaining issues / follow-ups (not blockers)

- Privacy Policy English body (§5.1) — needs writing/approval.
- `index.html` meta description dual (§5.4) — lang-aware HomePage `useSeo` follow-up.
- AdminAds stale "Privacy Policy — not written yet" checklist (§5.7).
- `GuardianLinksPage` "এনি" typo preserved — content fix for the owner.
- Cross-device persistence live check (§6) — owner to confirm on his devices.
- The cascading Directory filter system (brief 21 Nov 16:12) is a separate task — not started here; when built it must reuse `labelBn/labelEn` + `t()`.

## 8. Guardrails respected

- Staging branch only; `main` and `staging/integration` untouched; no merge.
- No production deploy (preview channel only).
- No `firestore.rules`, content, exam, or security-logic changes (only the two lang-aware lib helpers in `lib/admin.ts` + `lib/classLevels.ts`, which change **rendering** of labels/times/errors, not access rules).
- No paid services. No new dependencies.
