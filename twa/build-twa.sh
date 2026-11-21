#!/usr/bin/env bash
# Build the Eduvelto TWA app bundle (.aab) for Play Store submission.
# PREREQUISITES (not present in the prep sandbox — see BUILD-NOTES.md):
#   1. JDK 17 (a real JDK with javac — a JRE is NOT enough).
#   2. Android SDK (cmdline-tools + platform-34 + build-tools) — install with:
#        bubblewrap install
#      (downloads ~1 GB; accepts the Android SDK licence).
#   3. A signing keystore — create ONCE on the build machine and back it up
#      somewhere safe. NEVER commit it, NEVER lose it: without the same key
#      the app can never be updated on Play.
#        bubblewrap build   (prompts to create ./android.keystore if missing)
#      The keystore password/alias live in twa-manifest.json (path + alias only).
#   4. Digital Asset Links: after the key is created, get its SHA-256 with:
#        bubblewrap fingerprint
#      and publish /.well-known/assetlinks.json on eduvelto.web.app
#      (production change — needs the owner's permission).
#   5. A Google Play Console account + the $25 fee (owner's account/payment).
#
# Commands (run from this directory):
#   ./node_modules/.bin/bubblewrap doctor    # verify JDK + Android SDK
#   ./node_modules/.bin/bubblewrap build     # builds app-release-bundle.aab
#   ./node_modules/.bin/bubblewrap build --skipPwaValidation
#                                            # if the live manifest check fails
# Output: ./app-release-bundle.aab  (upload this to Play Console)
#         ./app-release-signed.apk   (for device testing)
set -e
cd "$(dirname "$0")"
./node_modules/.bin/bubblewrap build "$@"
