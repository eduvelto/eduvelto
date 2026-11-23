# Forced App Update — build report (22 Nov 2026)

Owner brief 22 Nov 2026 ~10:26–10:28 (BINDING): when a new version comes,
users on the OLD version must be told to download the new version, the
download link must sit in a tab, and the OLD version must NOT be usable
anymore — only an "update" message shows. He also said "ata o akn live a
kore felba" (make this live now too) — this branch is STAGING ONLY; the
parent deploys it after the Job+NU deploy lands.

## Honest fact that shapes the whole design

There is NO native app (Android/iOS 0%) and NO Play Store listing. The
"app" users download is the PWA (Add to Home Screen). So the "download
link" is the in-app `/install` page — no Play Store / APK link was
invented anywhere. The PWA service worker auto-updates code on next
visit, so enforcement is a version check on app load, not a store
mechanism. Every screen says this plainly.

## What was built

Branch `feature/forced-app-update`, from main `0b9fe0d`, HEAD `7a90870`,
pushed. Worktree `~/workspace/eduorbit/phase2-project-app-update/`.
15 files, +1,382 / −1.

### 1. Version config in Firestore — `config/appVersion`

Doc fields: `latestVersion`, `minVersion`, `releaseNotes`,
`downloadUrl` (default `/install`), `updatedAt`. The owner publishes a
new version from the dashboard with NO code/deploy (no-code admin rule).

Rules (`firestore.rules`, new `match /config/{docId}` section):
- Read: PUBLIC (anyone, incl. signed-out — the gate runs before sign-in).
- Write: admin/owner only, `appVersion` doc only, fixed key set,
  semver-ish versions (`x`, `x.y` or `x.y.z`, digits only),
  `downloadUrl` a site path or `https://` URL, `updatedAt` a real
  timestamp. Any other config docId denied; delete denied.

### 2. App's own version — `src/lib/appVersion.ts`

- `APP_VERSION = '0.1.0'` — single source of truth, in step with
  `package.json` "version". The next real release bumps BOTH together;
  the owner then publishes it via `/admin/app-version`.
- `parseVersion` / `isValidVersion` / `compareVersions` (numeric, not
  lexicographic: 0.9.0 < 0.10.0; missing parts = 0; malformed compares
  EQUAL to anything — fail open, a bad value never blocks anyone).
- `checkAppVersion(config, bundled)`: bundled < minVersion → `blocked`;
  minVersion ≤ bundled < latestVersion → `update-available`; else
  `current`; null config (nothing published yet) → `current`.
- `fetchAppVersionConfig(db)`: `getDocFromServer` — NEVER a cached read
  (a cached check would defeat the block). Malformed stored config
  returns null (fail open). Throws only on transport errors.

### 3. The gate — `src/components/AppVersionGate.tsx`

Wired in `src/App.tsx`: on every app load the gate fetches the config
and, if `blocked`, the WHOLE shell is replaced by the block screen —
no header, nav, footer or routes are usable. The block screen (Bangla):
"নতুন ভার্সন এসেছে" + "এই পুরোনো ভার্সনটি আর ব্যবহার করা যাবে না। নতুন
ভার্সন ডাউনলোড করুন।" + release notes (if any) + current/latest
version + ONE big button "নতুন ভার্সন ডাউনলোড করুন" → downloadUrl
(`/install` by default). A newer non-forced version shows a small
dismissible "আপডেট এসেছে" bar instead (link to `/install`).

Escape hatches — the gate NEVER blocks these, or a too-high minVersion
would lock the owner out of the only fix: `/install` (download
destination), `/login` (sign in to reach the admin fix), `/admin/*`
(the owner lowers minVersion again from `/admin/app-version`).
`isGateExemptPath()` is unit-tested for all three.

### 4. Where the download link lives (the persistent tab)

- **`/install`** — NEW page (`src/pages/InstallPage.tsx`), the download
  tab. Shows the App Update section (current/latest/status), the
  install button (Android/Chrome `beforeinstallprompt`), iOS
  Share → Add to Home Screen steps, Android/computer steps, and the
  plain statement that there is no Play Store app yet.
- **Profile Settings** — "অ্যাপ আপডেট" section on `/profile`
  (`src/components/AppUpdateSection.tsx`, shared with `/install`):
  current version, latest version, status, download link — visible
  even when no update is forced.
- **Footer** — "অ্যাপ ইনস্টল / আপডেট" link in the Platform column
  (also fixed the stale comment that said /install lives on the PWA
  branch — that branch was never merged; the route is built here).
- **Admin dashboard** — new "অ্যাপ আপডেট (ভার্সন)" card on `/admin`
  (status working → `/admin/app-version`).

### 5. Admin control — `/admin/app-version`

`src/pages/AdminAppVersionPage.tsx` (owner-only via existing
`AdminGuard`) + `updateAppVersionConfig()` in `src/lib/admin.ts`:
form for latestVersion / minVersion / releaseNotes / downloadUrl, with
client validation (semver, min ≤ latest, URL must start with `/` or
`https://`). Save writes `config/appVersion` + one `adminActions`
audit entry (`app-version-change`, before/after versions) in ONE
batch — a version change can never happen with no audit trail. The
page warns in plain Bangla that a minVersion above the installed
version blocks EVERY user, and how to undo it.

## Verification (all PASS)

- Build: `tsc -b` exit 0; `vite build` exit 0 (70 modules; chunks
  verified in dist: `InstallPage-*`, `AdminAppVersionPage-*`,
  block-screen copy in the main shell chunk).
- Unit tests: `vitest run src/lib/appVersion.test.ts
  src/components/AppVersionGate.test.tsx` — **20/20 pass** (14 version
  logic incl. malformed/equal/older/newer edge cases; 6 gate render
  tests incl. block screen HTML containing the Bangla message,
  release notes and `href="/install"`, and the exemption paths).
- Rules tests: `emulator-tests/rules-app-version.test.ts` — **13/13
  pass** (av0–av11: public read incl. signed-out, student write denied,
  admin/owner write allowed, malformed version denied, extra key
  denied, `javascript:` URL denied, delete denied, other docId denied,
  create without timestamp denied).
- Gate end-to-end: `emulator-tests/app-version-gate.test.ts` — **3/3
  pass**. Seeds config in the emulator, reads it back with the REAL app
  code path (unauthenticated SDK `getDocFromServer`) and asserts the
  decision: 9.9.9/9.9.9 → blocked with download `/install`; 0.2.0/0.1.0
  → update-available; 0.1.0/0.1.0 → current. (First run failed 2/3 on
  emulator coldness/contention — 30s timeout + a briefly stale read
  under 3 simultaneous emulators on 1.5 shared CPUs; fixed with 120s
  per-test timeouts + poll-until-fresh read. The fix is test-only.)
- Full rules suite (regression): **9 files, 196 tests, all pass**.
- Preview: https://eduvelto--app-update-v4fpoqki.web.app
  (expires 2026-11-29 04:54 UTC). Routes 200: `/`, `/install`,
  `/admin/app-version`, `/profile`, `/library`.

Emulator ports: the default 8080/9099 were busy (deploy + Google-fix
agents running). Tests ran on alt ports 8084/9096 (hub 4404, logging
4504) via untracked `firebase.app-update-ports.json` in the worktree.
A shared tracked `firebase.alt-ports.json` was briefly overwritten
with my ports in commit 8abc2b0 and restored in 7a90870 — net diff
vs main for that file is zero.

## Honest limits (NOT verified — do not claim otherwise)

1. **No browser click-through.** The block screen rendering is verified
   by `renderToStaticMarkup` tests + the real-SDK gate tests, and the
   preview routes return 200 — but nobody has opened the preview on a
   phone, set a minVersion above the installed version, and watched the
   block screen appear. Owner phone check owed after deploy.
2. **Offline = fail open (by design).** If the config cannot be fetched
   (offline), the user gets in and the check re-runs on the `online`
   event. Offline blocking is NOT possible without a server, and is not
   claimed.
3. **No config published yet.** Until the owner publishes a version in
   `/admin/app-version`, the gate does nothing (`current` for everyone).
   Publishing `minVersion 0.1.0 / latestVersion 0.1.0` (or leaving it
   unpublished) is the safe first state after deploy.
4. **Admin page is owner-only in the UI** (`AdminGuard` = owner role
   only, same as all admin pages); the rules allow admin + owner
   writes. Same split as the rest of the dashboard.

## What the parent must do to deploy

1. Merge AFTER the Job+NU deploy lands (this branch is from main
   `0b9fe0d`; rebase/merge onto the post-Job+NU main and re-run
   build + full rules suite — the branch touches `src/App.tsx`,
   `firestore.rules`, `src/pages/ProfilePage.tsx` and `Footer.tsx`,
   all of which the Job/NU branches also touch).
2. Deploy hosting + firestore rules together (the gate reads the new
   rules' public `config/appVersion`; the admin page needs the write
   rule). Verify `/install` 200 live.
3. Leave `config/appVersion` unpublished (or publish 0.1.0/0.1.0) until
   the owner is ready to force the first real update.
4. No live-DB writes were made by this work (emulator/seed only).
   No Google-login change. No other section touched.
