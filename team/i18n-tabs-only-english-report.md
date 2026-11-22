# i18n — Tabs-only English (owner rule 22 Nov 2026)

**Branch:** `i18n/tabs-only-english` (from main `0b9fe0d`, incl. the two AdSense commits)
**Worktree:** `~/workspace/eduorbit/phase2-project-i18n-tabs/`
**Preview:** https://eduvelto--i18n-tabs-only-w38ngyyj.web.app (channel `i18n-tabs-only`, expires 29 Nov 2026 02:15 UTC)
**Status:** Staging only. NOT merged, NOT deployed to production. Production deploy needs the owner's separate approval.

## The rule (binding, 22 Nov 2026 — supersedes the 21 Nov full-English mode)

The site keeps ONE language — Bangla, auto-selected by default. The Settings
language option (বাংলা / English) stays, but selecting English changes ONLY
the navigation **tab labels** to English; EVERYTHING else stays Bangla
(headings, buttons, content, forms, toasts, labels).

## What changed (4 files)

| File | Change |
| --- | --- |
| `src/i18n/LanguageContext.tsx` | Core enforcement (see below). `t()` / `<T>` now always Bangla; new `tTab()` / `<TabT>` follow the selected language; new `tabLang` holds the setting. `setLanguage` still persists to `users.language` + localStorage exactly as before. `document.documentElement.lang` stays `'bn'`. |
| `src/components/BottomNav.tsx` | The 5 bottom-nav labels use `tTab` (হোম/Home, আমার কোর্স/My Courses, প্রগ্রেস/Progress, বেশি কিছু/More, মেনু/Menu). |
| `src/pages/ClassDashboardPage.tsx` | The 8-tab bar uses `<TabT>` (হোম/Home, বই/Books, বিষয়/Subjects, অনুশীলন/Practice, পরীক্ষা/Tests, ফলাফল/Results, অগ্রগতি/Progress, প্রোফাইল/Profile). |
| `src/components/HeaderNav.tsx` | Top-level nav labels use `tTab` (Home, the 4 section dropdown titles, secondary nav links, Dashboard / Profile / Admin links). |

English translation files were **not** deleted — they still back the tab
labels (and the Settings selector's own "English" option). The default
stays Bangla. No database / Firestore rules change (none needed — the
setting was already stored in `users.language`).

## How it is enforced (single choke point)

`lang` (the content language) is now **always `'bn'`** in the provider.
Every existing consumer — `t()`, `<T>`, and all direct
`lang === 'bn' ? … : …` ternaries, date locales (`bn-BD`), number formats —
therefore renders Bangla with **no edits at those sites**. Only the
tab-label path reads `tabLang` (the user's setting): `tTab()` / `<TabT>`.

The complete English surface of the site is therefore exactly the
`tTab` / `<TabT>` call sites — audit with:

```
grep -rn "tTab\|TabT\|tabLang" src/
```

## Tab inventory (what switches to English)

1. **Mobile bottom nav** — 5 labels: হোম/Home, আমার কোর্স/My Courses,
   প্রগ্রেস/Progress, বেশি কিছু/More, মেনু/Menu.
2. **Class dashboard tab bar** — 8 labels (see above).
3. **Header nav (top level)** — Home, চাকরি প্রস্তুতি/Job Preparation,
   ভর্তি প্রস্তুতি/Admission Preparation, শিক্ষা কার্যক্রম/Academic
   Learning, দক্ষতা উন্নয়ন/Professional Skills, secondary nav links,
   ড্যাশবোর্ড/Dashboard, প্রোফাইল/Profile, অ্যাডমিন/Admin.
4. **Guardian dashboard child-switcher** — labels are children's names
   (user data, never translated); nothing to change.
5. **Homepage hero carousel dots** — no labels; nothing to change.

## Deliberately left Bangla (not tabs)

- Bottom-nav **sheet contents** (More/Menu link lists, section titles,
  auth buttons, Close, "Coming soon" chips), sheet titles and aria-labels.
- Header **dropdown panel items**, Login/Register/Log out buttons, the
  hamburger button (☰ মেনু), "Coming soon" chips, dark-mode/bell notes,
  aria-labels.
- Class dashboard **Quick Access tiles** (বই/পরীক্ষা/অনুশীলন/ফলাফল/
  অগ্রগতি/আরও) — tiles, not the tab bar.
- Footer links, PageShell titles, all headings, buttons, forms, toasts,
  chips, date/number formats, admin pages, lesson content.
- The Settings language selector itself (Profile → Settings): it uses its
  own local state synced from `profile.language` and is untouched; it
  still shows বাংলা/English and saves the choice as before.

## Follow-ups (not in this branch — the tabs do not exist on main yet)

- **Job hub / Job Seeker Dashboard tabs** live on branch
  `jobs/section-structure` (Job program). That branch must apply the same
  `tTab` / `<TabT>` treatment to its hub tab bars and dashboard tabs when
  it merges. The Job program was notified (Bangla-first, tabs only).
- **Admin sidebar + CEO panel tab bars** live on branch
  `admin/redesign-dashboard`. Same treatment needed there on merge.

## Verification

- `npm run build` — **PASS** (exit 0).
- `npm run test:rules` — **180/180 PASS** (7 test files; this branch is
  from main, so no `jobMode` tests — those live on the jobs branch).
  Log: `~/workspace/i18n-tabs-rules-2026-11-22.log`.
- **Runtime behaviour test** (server-render with the real
  `LanguageProvider`, auth stubbed, `localStorage` seeded):
  - English mode probe: `t()` → `পরীক্ষা`, `<T>` → `লগইন`,
    `tTab()` → `Home`, `<TabT>` → `Books`.
  - Bangla mode probe: all four → Bangla (`পরীক্ষা`, `লগইন`, `হোম`, `বই`).
  - English mode BottomNav renders `['Home', 'My Courses', 'Progress',
    'More', 'Menu']`; Bangla mode renders
    `['হোম', 'আমার কোর্স', 'প্রগ্রেস', 'বেশি কিছু', 'মেনু']`.
  - Scratch test (not part of the app): `~/workspace/i18n-tabs-render-test/`;
    logs `~/workspace/i18n-tabs-render-en.log`,
    `~/workspace/i18n-tabs-render-bn.log`.
- **Preview channel** — deployed exit 0;
  `https://eduvelto--i18n-tabs-only-w38ngyyj.web.app` serves the new
  bundle (`index-4yK2Yhmz.js`, contains the tab strings).
  curl: 10/10 routes → 200
  (`/`, `/jobs`, `/library`, `/class`, `/class/class-1-5`, `/dashboard`,
  `/login`, `/privacy`, `/exam`, `/directory`).
- **Static audit** — `grep -rn "tTab\|TabT\|tabLang" src/` returns only the
  inventory above plus the provider itself; no other code path can render
  English, because `lang` is constant `'bn'`.
- **Screenshots — not obtained.** Headless Chrome is blocked by the
  sandbox egress proxy (same limitation as earlier deliveries). The
  server-render test above is the behavioural proof; the owner should
  check the preview on his phone (sign in on the preview itself, pick
  English in Profile → Settings, confirm the tabs switch while the rest
  stays Bangla).

## Decisions recorded

- Header top-level nav labels count as tabs (they are the primary
  navigation); dropdown panel items and buttons do not.
- Quick Access tiles are content, not tabs.
- `document.documentElement.lang` stays `'bn'` — the page content IS
  Bangla; only tab labels switch.
- The context's `setLanguage` is kept (same persistence behaviour) even
  though no component currently calls it directly — ProfilePage saves the
  choice via `saveProfile`, and the provider adopts `profile.language`.

## Addendum — production deploy (22 Nov 2026, owner approved "daw" 13:28)

**Branch rebased:** `i18n/tabs-only-english` rebased onto `origin/main`
`a5f9ed7` (the /jobs Coming Soon fix) — **clean, zero conflicts**.
New HEADs: `a0b66d8` (rebased tabs-only commit) + `a90aeef` (header
button + fonts, below). The /jobs fix survived the rebase: `src/App.tsx`
has exactly one `/jobs` route → `<JobsPage />` (line 187), no
ComingSoon `/jobs` route.

### New in this deploy (owner requirements 13:30–13:34)

1. **Header language toggle button** (22 Nov 13:30–13:31): globe icon +
   target-language label (`EN` / `বাং`), top-right beside the profile.
   Rendered in BOTH the desktop header actions and the mobile header
   actions (CSS shows exactly one per viewport); the PWA and the web
   share this header, so the button is in both. Tapping it toggles
   `tabLang` only — the same state as the Profile → Settings selector,
   so the two stay in sync. Everything else stays Bangla.
   Files: `src/components/HeaderNav.tsx` (`LanguageIcon` +
   `LangToggleButton`), `src/index.css` (`.ev-header-lang-btn`).
2. **Stylish Bangla fonts** (22 Nov 13:34): headings now use
   **Noto Serif Bengali 600/700** (Google Fonts, `display=swap`, only
   the two heading weights); body stays clean **Hind Siliguri**
   (400/500/600/700, unchanged). `--font-head` updated in
   `src/index.css`; the hero wordmark stays Poppins (Latin brand text).
   The family is a real Google Fonts variable font (weights 100–900,
   Bengali + Latin), so `wght@600;700` is valid. Per-character fallback
   renders Bangla in the serif and Latin in Poppins.
   Files: `index.html` (fonts link), `src/index.css` (`--font-head`).

### Verification (rebased branch, HEAD a90aeef)

- `npm run build` — **PASS** (exit 0; rebuilt after the button + fonts).
- `npm run test:unit` — **131/131 PASS** (6 files).
- `npm run test:rules` — **415/415 PASS** (13 files, sequential
  `--fileParallelism=false`). NOTE: the first parallel run died
  mid-suite (3 files ✓, 0 failures, then the process vanished — the
  known cross-file emulator interference); the sequential re-run
  completed clean. A plain `vitest` binary is not on PATH inside
  `emulators:exec` (exit 127) — the working invocation is
  `./node_modules/.bin/vitest run emulator-tests/ --fileParallelism=false`.
  Log: `~/workspace/i18n-rules3.log`.
- **Runtime behaviour test** (server-render, real `LanguageProvider`,
  auth stubbed, `localStorage` seeded; scratch test extended for the
  header): logs `~/workspace/i18n-render-bn2.log`,
  `~/workspace/i18n-render-en2.log`.
  - Bangla mode: header renders the language button ×2 (desktop +
    mobile copies, globe icon, label `EN`), tab labels Bangla
    (হোম, চাকরি প্রস্তুতি), Login stays `লগইন`.
  - English mode: button ×2, label `বাং`, tab labels English
    (Home, Job Preparation), everything else still Bangla (`লগইন`).
  - DOM order: mobile bell → language button → avatar; desktop
    search/moon → language button → Login/Profile. The button sits
    immediately beside the profile in both viewports.
  - The click-toggle itself is not exercised by server rendering; it
    calls the same `setLanguage` the Settings selector uses. The
    owner should tap it once on the preview (mobile + desktop) to see
    the tabs switch.
- **Preview channel** — (see below).
- **Screenshots — not obtained** (headless Chrome blocked by the
  sandbox egress proxy, as before). The server-render test + the
  owner's phone check are the visual proof.

### Second rebase — auth-gating landed on main first (22 Nov ~14:00)

While the first preview was being verified, `origin/main` moved:
`671d32c` (merge of `feature/auth-gating-exams-reading`) landed. The
branch was rebased a second time onto `671d32c` — **clean, zero
conflicts** — new HEAD `53a2977` (commits `da137c8` + `0514fba` +
`53a2977` on top of `671d32c`). Verified after the rebase: single
`/jobs` route → `<JobsPage />` (App.tsx line 187) AND the auth-gating
code present (`পরীক্ষা দিতে লগইন করুন` in `src/lib/gating.ts` +
`ExamPage.tsx`, `isPreview` in `src/lib/content.ts`). Rebuilt +
re-verified on the rebased HEAD: build PASS, unit **131/131 PASS**,
rules **434/434 PASS** (14 files, sequential — see below), preview
re-deployed to the same channel (new bundle hash
`index-gIYds9XO.js`; button, fonts link, font in CSS, and the
auth-gating `LoginWall` chunk all confirmed served). Merging this
branch therefore ships the i18n changes **together with** the
auth-gating changes already on main — the production hosting deploy
cannot serve i18n without auth-gating.

### Rules-suite flake (documented, not a product issue)

- First full run on the rebased tree (`i18n-rules5.log`): 432/434 —
  2 failures, both in `rules-step2.test.ts` (teacher draft-create of
  a book / a lesson, `PERMISSION_DENIED` evaluation error inside
  `contentCreate()`). **This branch changes no rules and no tests**
  (`git diff 671d32c HEAD -- firestore.rules emulator-tests/` is
  empty), so the failure cannot be from this branch.
- Isolated re-run of that one file (`i18n-rules-step2-only.log`):
  **25/25 PASS**, exit 0.
- Full re-run (`i18n-rules6.log`): **14 files, 434/434 PASS**,
  exit 0. The pair is a flaky emulator failure in the full-suite run,
  not a rules regression. (An earlier rules run also failed once with
  exit 127 because `java` was not on PATH in the fresh shell — the
  bundled JRE `~/workspace/eduorbit/tools/jdk-17.0.21.1+2-jre/bin`
  must be prepended; the `npm run test:rules` script's bare `vitest`
  also fails with 127 under `emulators:exec` — use the explicit
  `./node_modules/.bin/vitest` path.)
