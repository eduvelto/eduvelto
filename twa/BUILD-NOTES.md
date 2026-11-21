# TWA build notes — Eduvelto Android app (Bubblewrap)

**Date:** 21 November 2026
**Status:** PREPARATION ONLY. Config ready; no bundle built, no key created,
nothing submitted, nothing published.

## What is here

- `twa-manifest.json` — Bubblewrap TWA config, generated from the live web
  manifest (https://eduvelto.web.app/manifest.webmanifest) + approved brand
  values. Package ID `bd.eduvelto.app` is PROPOSED (reverse domain of
  eduvelto.com) — the owner must confirm it before first submission, because
  a Play package ID can never change after the first upload.
- `package.json` / `package-lock.json` — Bubblewrap CLI 1.27.0 (installed
  locally in `node_modules/`, not committed).
- `build-twa.sh` — the exact commands to build on a machine that has the
  prerequisites (see below).
- `build-attempt-2026-11-21.log` — the verbatim log of the build attempt in
  this sandbox.

## Why the build does NOT work in this sandbox (exact errors)

1. `bubblewrap doctor` → exit 1:
   `ERROR The androidSdkPath isn't correct, please run the following command
   to update it: bubblewrap updateConfig --androidSdkPath <path-to-sdk>,
   such that the folder of the path contains the folder "build". Then run
   bubblewrap doctor again.`
   There is NO Android SDK in this environment: `ANDROID_HOME` /
   `ANDROID_SDK_ROOT` are unset; no `~/Android`, `/opt/android*` or
   `/usr/lib/android-sdk` exists.
2. `bubblewrap build` → exit 1:
   `ERROR The provided androidSdk isn't correct.`
   The build stops at Android SDK validation, before any Gradle work.
3. Java is a **JRE only**: `~/workspace/eduorbit/tools/jdk-17.0.21.1+2-jre`
   (Temurin 17.0.21.1) has `java`/`keytool` but NO `javac`. It passes
   Bubblewrap's version check (the `release` file contains
   `JAVA_VERSION="17.0.21.1"`), so `doctor` reports no JDK error — but a
   Gradle build cannot compile without `javac`. A real JDK 17 is required.
4. **No signing key was created (deliberate).** `twa-manifest.json` points at
   `./android.keystore` (alias `android`), which does not exist. The keystore
   must be created ONCE on the build machine (`bubblewrap build` prompts for
   it) and backed up safely. Losing it means the app can never be updated on
   Play. Never commit a keystore or its passwords to git.

## Notes on the CLI itself

- Bubblewrap 1.27.0 prompts interactively on EVERY command (even
  `--version`/`doctor`) when no `~/.bubblewrap/config.json` exists — with no
  TTY it hangs waiting on stdin. The sandbox config was written directly:
  `{"jdkPath": "<temurin-jre>", "androidSdkPath": "<default location>"}`.
  The `androidSdkPath` value is the default location Bubblewrap would use
  (`~/.bubblewrap/android_sdk`); no SDK is installed there.
- `bubblewrap updateConfig` also prompts on first run (it calls the same
  config loader), so it is not a non-interactive workaround.

## What the TWA is — and is not

A TWA wraps the live website (https://eduvelto.web.app) inside an Android
app shell. It is NOT a native app: every feature is the website's feature.
Per the owner's revised priorities (21 Nov 2026), the goal is a FULL platform
on website + Android + iOS — the TWA-vs-Native/Hybrid (Android) and
Capacitor-vs-Swift (iOS) strategy comparison is a SEPARATE deliverable, and
the website must be completed first. This TWA package is preparation for the
Android route only; it does not decide the strategy.

## Before first submission (owner / build machine)

1. Confirm the package ID `bd.eduvelto.app`.
2. Install JDK 17 + Android SDK (`bubblewrap install`, ~1 GB download).
3. Create the signing keystore once; back it up off-machine.
4. Run `./build-twa.sh` → `app-release-bundle.aab`.
5. Run `bubblewrap fingerprint`, publish `/.well-known/assetlinks.json` on
   the live site with the SHA-256 fingerprint — WITHOUT this, the app opens
   with a browser URL bar instead of fullscreen. This is a production
   change: it needs the owner's explicit permission (and, under the 21 Nov
   security phase, no production change happens without it).
6. Play Console account + $25 fee (owner's account/payment), 12 testers,
   14-day closed test, then Google review.
