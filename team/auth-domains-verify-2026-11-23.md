# Authorized-domains re-verification — Step 20 Phase 3 pre-deploy check

**Date:** 23 Nov 2026 ~21:17 Asia/Dhaka
**Method:** read-only Identity Toolkit API call (`GET /v2/projects/eduvelto/config`), token via the established Firebase-CLI refresh-token exchange (token in memory only). Script: `~/workspace/eduorbit/check-auth-domains.mjs`; full output: `~/workspace/eduorbit/auth-domains-2026-11-23.txt`.
**Result: PASS — HTTP 200.**

Production domains authorized:
- `eduvelto.com` — present
- `www.eduvelto.com` — present
- `eduvelto.firebaseapp.com`, `eduvelto.web.app`, `localhost` — present

Also present: 49 `eduvelto--*.web.app` preview-channel domains (accumulated from staging previews; harmless, no action needed).

**Verdict:** the Phase 3 pre-deploy checklist item "re-verify authorized domains (read-only)" added by the 19:16 AI fold-in is now CLOSED with fresh evidence. No change needed before deploy. (Deploy itself still needs the owner's "koro" approval; this check does not authorize it.)
