# Step 20 Phase 1, gate 1.9 — Lighthouse + offline-state + WebKit checks (LIVE site)

**Date:** 23 Nov 2026, runs 12:32–12:38 UTC (18:32–18:38 +06) · **Site:** live https://eduvelto.com (= main `5a3f90e` per brief)
**Mode:** REPORT ONLY — no edits, no deploys, no spending, no sign-in, no writes to the live site.
**Scope:** scoping note `team/job-step20-release-scoping-2026-11-23.md` §4 R7/R10, §6 gate 1.9.
**Evidence dir:** `team/step20-evidence/` (raw Lighthouse JSONs, offline screenshots + JSONs, probe scripts).

## Method (how the numbers were obtained — read before quoting them)

- **Lighthouse 13.6.0** via `npx -y lighthouse` (downloaded from npm, $0), default **mobile emulation**
  (Moto G Power viewport + simulated slow-4G throttling), categories
  performance / accessibility / best-practices / SEO, one run per page.
- **Sandbox networking:** the live egress proxy MITMs TLS and Chromium through it gets
  `403 policy_denied` / `ERR_CERT_AUTHORITY_INVALID`. Used the local CONNECT relay
  `eduorbit/h1-fix-deploy-evidence/connect_relay.py` on **127.0.0.1:18099**
  (verified: `curl --proxy http://127.0.0.1:18099 https://eduvelto.com/` → HTTP 200).
  Lighthouse was run with `CHROME_PATH=$HOME/.cache/ms-playwright/chromium-1255/chrome-linux64/chrome`
  (Google Chrome for Testing 159.0.8154.6) and flags
  `--headless=new --proxy-server=http://127.0.0.1:18099 --no-sandbox
  --ignore-certificate-errors --disable-dev-shm-usage`.
  Two false starts on the record: (1) without `--ignore-certificate-errors` the runs died in
  `chrome-launcher` before auditing; (2) without `--headless=new` Chrome tried to open headed
  and failed with "Missing X server or $DISPLAY". No numbers were produced by those attempts.
- **Offline check:** Playwright Chromium (`~/workspace/.venv-img/bin/python`, Chromium 1255)
  through the same relay, `ignore_https_errors=True`. Fresh browser profile each run.
- **Targets vs results:** the scoping note records NO numeric Lighthouse targets for R7
  (only "performance targets" in prose). Therefore **no pass/fail verdict is given against a
  target** — scores are reported as measured. For context only: Lighthouse's own scale treats
  90–100 as good and 0–49 as poor.

## 1. Lighthouse — per-page scores

| Page | Performance | Accessibility | Best practices | SEO | FCP | LCP | Time to Interactive | Total Blocking Time | CLS | Speed Index |
|---|---|---|---|---|---|---|---|---|---|---|
| `/` | **25** | 100 | 92 | 100 | 3.1 s | 3.1 s | 18.1 s | 12,520 ms | 0.793 | 18.2 s |
| `/jobs` | **3** | 96 | 92 | 100 | 4.5 s | 14.2 s | 16.2 s | 9,260 ms | 0.791 | 17.6 s |
| `/jobs/bcs` | **8** | 96 | 92 | 100 | 3.3 s | 13.8 s | 13.8 s | 2,900 ms | 0.788 | 8.8 s |
| `/library` | **22** | 94 | 92 | 100 | 3.8 s | 9.3 s | 10.1 s | 630 ms | 0.574 | 8.2 s |
| `/about` | **28** | 95 | 92 | 100 | 4.0 s | 7.2 s | 9.2 s | 420 ms | 0.802 | 7.1 s |

Raw JSONs: `team/step20-evidence/lh-home.json`, `lh-jobs.json`, `lh-jobs_bcs.json`,
`lh-library.json`, `lh-about.json` (fetchTimes 12:32:29, 12:34:12, 12:35:33, 12:36:38, 12:37:44 UTC).

### Top 3 concrete findings per page

**`/` (perf 25, a11y 100, BP 92, SEO 100)**
1. Time to Interactive 18.1 s / Total Blocking Time 12,520 ms — main-thread work 24.1 s,
   JS execution 12.2 s. The page is not usable for ~18 s under simulated slow 4G.
2. Cumulative Layout Shift 0.793 (8 layout shifts) — far above the 0.1 "good" bar.
3. Console errors on the page (see §1.6) — these alone cap Best Practices at 92.

**`/jobs` (perf 3, a11y 96, BP 92, SEO 100)**
1. LCP 14.2 s / Speed Index 17.6 s / TTI 16.2 s — the worst page of the five.
2. CLS 0.791 (4 layout shifts); main-thread work 21.5 s, JS execution 8.3 s.
3. Accessibility: colour-contrast failure (background/foreground contrast insufficient) +
   visible-text labels without matching accessible names. Also unused JS est. 192 KiB,
   unminified JS est. 27 KiB.

**`/jobs/bcs` (perf 8, a11y 96, BP 92, SEO 100)**
1. LCP 13.8 s / TTI 13.8 s — second-worst page.
2. CLS 0.788; image delivery est. savings 626 KiB; render-blocking requests est. 1,570 ms.
3. Accessibility: same colour-contrast + label-mismatch failures as `/jobs`; unsized images
   (score 0.5 — image elements without explicit `width`/`height`).

**`/library` (perf 22, a11y 94, BP 92, SEO 100)**
1. LCP 9.3 s / TTI 10.1 s / Speed Index 8.2 s.
2. CLS 0.574; render-blocking requests est. 1,700 ms; image delivery est. savings 626 KiB.
3. Accessibility: colour-contrast failure + heading-order failure (headings not in
   sequentially-descending order) + label-mismatch.

**`/about` (perf 28, a11y 95, BP 92, SEO 100)**
1. CLS 0.802 — the worst layout shift of the five; LCP 7.2 s / TTI 9.2 s.
2. Render-blocking requests est. 2,030 ms (largest of the five); image delivery est.
   savings 690 KiB.
3. Accessibility: label-mismatch + links that rely on colour alone to be distinguishable
   (`link-in-text-block`); unused JS est. 191 KiB.

### Cross-page patterns (all 5 pages)

- **Performance is poor everywhere under Lighthouse mobile throttling: 3–28.** Every page
  has CLS 0.57–0.80 (good is ≤0.1), LCP 3.1–14.2 s (good is ≤2.5 s) and TTI 9.2–18.1 s.
  The two Job pages are the worst (3 and 8). Real-device numbers will differ from
  simulated throttling, but the pattern — huge layout shift, seconds of blocking JS,
  multi-second LCP on Job pages — is consistent across all five runs, not a one-page fluke.
- **Accessibility 94–100, SEO 100 on all five pages.** No SEO failures anywhere.
- **Best Practices is 92 on all five pages, driven by exactly two failing audits:**
  `errors-in-console` and `inspector-issues`. Nothing else fails in this category.
- **Console errors (same on every page — see `errors-in-console` in the JSONs):**
  - CSP violations blocking Google/AdSense scripts: `https://apis.google.com/js/api.js?...`
    and `https://ep2.adtrafficquality.google/sodar/sodar2.js` violate the `script-src`
    directive. This is the known open item **F6** (AdSense CSP `connect-src`/script noise),
    now confirmed present on every audited page.
  - `Failed to load resource: net::ERR_CONNECTION_CLOSED` (×2 on `/`).
  - `Uncaught (in promise) undefined` (on `/`).
- **Recurring opportunities on every page:** unused JavaScript est. 189–192 KiB,
  unminified JavaScript est. 27 KiB, unsized images (header logo `img` inside
  `div.ev-app-shell > header.ev-header > a` is named in the image-delivery detail on
  `/jobs/bcs` — a likely CLS contributor).

## 2. Bangla offline-state message — VERDICT: NO dedicated Bangla offline message exists

**What was done** (Playwright Chromium, fresh profile, relay 127.0.0.1:18099):
1. Online load of `https://eduvelto.com/` → HTTP 200, h1 `EduveltoLearn • Grow • Achieve`,
   title `Eduvelto — বাংলাদেশের সেরা ফ্রি শিক্ষা প্ল্যাটফর্ম`. Screenshot `offline-01-online-home.png`.
2. Context set offline → **reload** → navigation failed: `net::ERR_INTERNET_DISCONNECTED`;
   URL became `chrome-error://chromewebdata/`; page body text empty; no Bangla keywords
   (`অফলাইন`, `ইন্টারনেট`, `সংযোগ`, `নেটওয়ার্ক`) found. Screenshot `offline-02-reload-offline.png`.
3. Still offline → **navigate to `/jobs`** → same failure: `net::ERR_INTERNET_DISCONNECTED`,
   `chrome-error://chromewebdata/`, no message. Screenshot `offline-03-nav-jobs-offline.png`.
4. Supplementary run: **network dropped while the homepage was already loaded** (no reload) →
   page stayed exactly as-is, `navigator.onLine` flipped to `false`, **no banner, no toast,
   no message of any kind appeared** (full body text captured in `offline-check-part2.json` —
   ordinary homepage content only). Screenshot `offline-05-drop-while-loaded.png`.
5. **Service worker: 0 registrations** (`navigator.serviceWorker.getRegistrations()` → `[]`)
   on the live homepage in a fresh profile — there is no service worker to serve an offline
   page, which explains steps 2–3.
6. Back online → `/jobs` loaded normally (h1 `চাকরির প্রস্তুতি — এক জায়গায়`), so the
   failure was the offline state, not the site. Screenshot `offline-04-back-online-jobs.png`.

**Verdict:** the app shows **no explicit Bangla offline message** — there is no wording to
quote, because none exists. On reload/navigation while offline the user gets only the
browser's generic error page (`chrome-error://chromewebdata/`, `ERR_INTERNET_DISCONNECTED`).
Two honest caveats: (a) the offline screenshots render blank white and the error page's DOM
reads as empty (`<html><head></head><body></body></html>`) — that is headless Chromium's
rendering of its built-in error page, not the app serving a blank page; the navigation
failure itself is the evidence. (b) A client-side in-app navigation click while offline was
attempted but timed out waiting for the (below-the-fold) `/jobs` CTA link to become visible,
so that sub-case is untested — it does not change the verdict, since reload and direct
navigation both fail at the browser level before any app code can run.
**Gate 1.9 R10 therefore remains OWED / NOT PASSED** — a dedicated Bangla offline message
still needs to be built (it also depends on the service-worker work in R9, which found
no SW registered).

## 3. WebKit availability — VERDICT: UNAVAILABLE

- `~/.cache/ms-playwright/` contains only `chromium-1255`, `chromium_headless_shell-1255`,
  `ffmpeg-1010`, `ffmpeg-1013`. **No `webkit-*` directory exists.**
- `playwright.webkit.launch()` fails: `Executable doesn't exist at
  /home/hatch/.cache/ms-playwright/webkit-2388/pw_run.sh`.
- Per the scoping note (§4 R8: "only if a WebKit binary is available in the sandbox; else
  record as unavailable"), **WebKit is recorded as UNAVAILABLE with that reason. No
  WebKit render check was run, and none is claimed.** (Installing the WebKit binary was
  not attempted — it is outside this report-only check's scope.)

## 4. Gate 1.9 disposition (honest summary)

| Sub-item | Result |
|---|---|
| R7 Lighthouse run | **DONE, results recorded** — perf 3–28, a11y 94–100, BP 92, SEO 100 (table §1). No numeric target exists in the scoping note, so no pass/fail is claimed; on Lighthouse's own scale every page's performance is "poor" (0–49). |
| R10 Bangla offline-state message | **NOT PASSED / still owed** — no dedicated Bangla message; offline reload shows only the browser's generic error page; no service worker registered. |
| R8 WebKit check | **UNAVAILABLE** — no WebKit binary in the sandbox (see §3). |
| R9 SW-update test | Not part of this task (separate item). Note: §2 step 5 found **0 service-worker registrations** on live, which is relevant context for R9. |

## 5. Files produced

- This report: `team/step20-lighthouse-2026-11-23.md`
- `team/step20-evidence/lh-home.json`, `lh-jobs.json`, `lh-jobs_bcs.json`, `lh-library.json`,
  `lh-about.json` — full Lighthouse JSON output per page.
- `team/step20-evidence/offline-check.json`, `offline-check-part2.json` — offline probe results.
- `team/step20-evidence/offline-01-online-home.png` … `offline-07-error-page.png` — offline screenshots.
- `team/step20-evidence/offline_check.py`, `offline_check_part2.py` — probe scripts (re-runnable).
- Relay used: `eduorbit/h1-fix-deploy-evidence/connect_relay.py` on 127.0.0.1:18099
  (started for this task, stopped afterwards; the fallback `seo-verify/egress-relay.py`
  on 18081 was NOT needed).

Nothing was edited, deployed, signed into, or spent. $0.
