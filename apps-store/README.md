# Eduvelto — Play Store / App Store preparation

**Date:** 21 November 2026
**Status:** PREPARATION ONLY. Nothing published, nothing submitted, no
account created, no money spent, no change made to the live site.

## Where things live

> Note on paths: the task brief said `~/workspace/eduorbit/apps-store/`.
> That folder is OUTSIDE the git repo, so it cannot be pushed. Everything
> below lives in `phase2-project/apps-store/` (this folder) and
> `phase2-project/twa/`, on branch `apps/twa-prep` — the same content, in
> the committable location.

## What is ready

| Item | File | Verified |
|---|---|---|
| TWA config (Bubblewrap 1.27.0) | `../twa/twa-manifest.json` | Manifest parsed by `bubblewrap build` (fails later, at the missing Android SDK — see below) |
| TWA build notes + exact build commands | `../twa/BUILD-NOTES.md`, `../twa/build-twa.sh` | — |
| Build attempt log (exit 1) | `../twa/build-attempt-2026-11-21.log` | `ERROR The provided androidSdk isn't correct.` |
| Play Store app icon 512×512 | `assets/app-icon-512.png` | Approved brand icon, copied verbatim, 512×512 |
| Feature graphic 1024×500 | `assets/feature-graphic-1024x500.png` | Built with Pillow from the approved white symbol; DejaVu Bold stands in for Poppins/Montserrat (not installed here) |
| Phone screenshots (real, 1080×1920) | `screenshots/shot-01-home.png` … `shot-05-about.png` | Real screenshots of the live site (home, library, exam, health, about) — home shows "609টি বই প্রকাশিত", exam shows "212টি পরীক্ষা · 5326টি প্রশ্ন" |
| Store descriptions (EN + BN) | `store-descriptions.md` | Short EN 77/80 chars, short BN 53/80, full EN 1,410/4,000, full BN 1,294/4,000. Counts verified on the live site 21 Nov 2026; re-verify before submission |
| Privacy Policy draft | `privacy-policy-draft.md` | Based on the approved privacy proposal §1; [PLANNED] sections flagged; lawyer review required |
| Terms of Service draft | `terms-draft.md` | Plain language; lawyer review required |

## What is NOT ready — the blockers

1. **No Android SDK in this environment.** `bubblewrap doctor` exit 1
   ("The androidSdkPath isn't correct"); `bubblewrap build` exit 1
   ("The provided androidSdk isn't correct"). No SDK exists anywhere
   here (`ANDROID_HOME` unset; no `~/Android`, `/opt/android*`,
   `/usr/lib/android-sdk`). Fix: install on a build machine with
   `bubblewrap install` (~1 GB download).
2. **Java is a JRE only** (Temurin 17.0.21.1, no `javac`). It passes
   Bubblewrap's version check, but Gradle cannot compile with it. A real
   JDK 17 is required on the build machine.
3. **No signing keystore — deliberate.** `twa-manifest.json` points at
   `./android.keystore` (alias `android`), which does not exist. It must
   be created ONCE on the build machine and backed up safely. Losing it
   means the app can never be updated on Play. Never commit a keystore.
4. **No Digital Asset Links.** `twa-manifest.json` has empty
   `fingerprints`. After the key is created, `bubblewrap fingerprint`
   gives the SHA-256, and `/.well-known/assetlinks.json` must be published
   on the live site — otherwise the app opens with a browser URL bar.
   This is a PRODUCTION change: it needs the owner's explicit permission
   (and under the 21 Nov security phase, no production change happens
   without it). Not done here.
5. **Package ID is proposed, not confirmed:** `bd.eduvelto.app`. The
   owner must confirm it — it can never change after the first upload.
6. **No Play Console / Apple Developer account.** Per the owner's
   revised priorities (21 Nov 2026): NO Play Console or Apple Developer
   account now, NO spending, NO enrollment. Those are owner actions for
   later (see below).

## Important: what a TWA is — and the owner's revised priorities

A TWA wraps the live website inside an Android app shell. It is NOT a
native app — every feature is the website's feature. The owner's revised
priorities (21 Nov 2026, binding) say the goal is a FULL platform on
website + Android + iOS, website completion FIRST, and that the
TWA-vs-Native/Hybrid (Android) and Capacitor-vs-Swift (iOS) strategy
comparison is a SEPARATE deliverable with reasoned recommendations. This
package prepares the Android/TWA route only. It does not decide the
strategy, and no app is submitted until the website is complete, the
strategy is approved, and everything is tested on all three platforms
together.

## What the owner must do — in order

### A. Before any submission (owner decisions)
1. Confirm the package ID `bd.eduvelto.app` (or choose another — then it
   must be changed in `twa/twa-manifest.json` before the first build).
2. Review + approve: store descriptions, Privacy Policy draft, Terms
   draft (lawyer review for both legal drafts first), icon, feature
   graphic, screenshots.
3. Decide the app strategy (TWA vs Native/Hybrid) when the strategy
   comparison is delivered — this package does not pre-decide it.

### B. Android submission (only after A + website complete)
4. Create a Google Play Console account + pay the $25 one-time fee
   (owner's account and payment).
5. On a build machine with JDK 17 + Android SDK: create the signing
   keystore once (back it up off-machine), run `../twa/build-twa.sh`
   → `app-release-bundle.aab`.
6. Approve + publish `/.well-known/assetlinks.json` on the live site
   (fingerprint from `bubblewrap fingerprint`).
7. Play Console: create the app, upload the .aab, fill the listing
   (descriptions, icon, feature graphic, screenshots, Privacy Policy
   URL, Data Safety form — it must match the Privacy Policy exactly),
   set the content rating questionnaire, and add 12 testers.
8. Closed test for 14 days (Google requirement), fix issues, then
   production review.

### C. iOS (separate track — nothing built here)
9. Apple Developer account ($99/year, owner's payment) — NOT now, per
   the revised priorities.
10. iOS route is Capacitor vs Swift — comparison pending in the strategy
    deliverable. No Xcode work was done in this sandbox (no macOS here).

## Screenshot method (honest note)

The 5 screenshots are REAL renders of https://eduvelto.web.app, taken
21 Nov 2026 with headless Chrome (Playwright-cached build) via a local
proxy shim: sandbox Chromium cannot use the egress proxy directly
(`ERR_NO_SUPPORTED_PROXIES` on credentialed proxy URLs), so a throwaway
localhost forwarder (`/tmp/proxy-shim.js`, not committed) added the
proxy auth header, and `--ignore-certificate-errors` was used because
the proxy does TLS interception. The plain `--screenshot` flag took the
shot before Firestore content loaded ("লোড হচ্ছে..."), so the final
shots used puppeteer-core with a real wait for network idle + content.
Re-take them before submission if the site's design changes.

## Costs (no spending in this package)

- Play Console: $25 one-time (owner pays at account creation).
- Apple Developer: $99/year (owner pays, iOS track only).
- Everything in this folder: ৳0.
