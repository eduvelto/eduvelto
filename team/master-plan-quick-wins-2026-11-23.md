# Master Plan Quick Wins — Terms + Useful 404 + www→apex Redirect
Date: 23 Nov 2026 · Branch: `feature/master-plan-quick-wins` · Commit: `c1bbb3d`
Base: main `1918766` · Worktree: `~/workspace/eduorbit/phase2-project-master-quick-wins/`
Status: **CLOSED IN STAGING** — no live changes, no deploy, no merge, $0 spent.

Preview: https://eduvelto--master-plan-quick-wins-eljew0jv.web.app
(expires 30 Nov 2026 00:49 UTC). Preview channel freed by deleting the
superseded `staging-integration` channel (50-channel quota was full).

## What was built

### (a) Terms & Conditions page — `/terms` (DRAFT)
- `src/pages/TermsPage.tsx` (new, 198 lines) — mirrors PrivacyPage
  (PageShell + Card + Section, Bangla + English). 10 sections: free
  service (no fees ever), accounts & login (account required to
  read/study and take exams — owner decisions 23 Nov 06:24–06:25;
  hub/listing pages public), acceptable use, what you submit (short
  and accurate: students cannot post/upload; only teacher applications
  and correction reports/feedback exist — verified by code grep),
  accuracy (no guarantee of marks/pass/admission/outcome; official
  circulars govern), IP, privacy summary + link to live `/privacy`
  (Firebase named as provider; student data never sold), changes to
  Terms, liability & disputes (proportionate — "to the extent
  permitted by applicable law", Bangladesh law + competent courts,
  mandatory rights preserved; NO blanket waiver / zero cap), contact
  (ahmmizan23@gmail.com, Founder & CEO Ali Hasan Mohammed Mizan).
  Dated 23 Nov 2026, with a visible DRAFT notice at the top.
- `src/components/Footer.tsx` (+1) — "শর্তাবলী / Terms" link next to
  Privacy Policy. `src/lib/seo.ts` (+11) — `/terms` SEO entry
  (title "শর্তাবলী — Eduvelto", honest description). `src/lib/__tests__/seo.test.ts`
  (+14) — test asserting the `/terms` entry + no #1-rank claim.
- `/terms` is deliberately NOT in `public/sitemap.xml` or `SITEMAP_URLS`
  (draft awaiting owner approval; sitemap belongs to the parallel SEO
  50–100 workstream). At merge time AFTER owner approval: add `/terms`
  to both — the exact-match sitemap test fails if one is added
  without the other.
- `src/App.tsx` (+3) — lazy import + `<Route path="/terms" />`.

### (b) Useful 404 page — WEB-001 fixed (two layers)
- Layer 1, real HTTP 404 (unknown top-level paths): `public/404.html`
  (new, 3,386 bytes, same copy/links as the React page, own
  `noindex, nofollow`, no inline JS per CSP) + `firebase.json`
  rewrites narrowed from a single `** → /index.html` to **41 explicit
  entries** (bare + `/**` per route family; family-only `/**` where no
  bare route exists, so bare `/subjects`, `/books`, `/lessons`, `/quiz`
  correctly 404). Verified programmatically against every `Route path=`
  in App.tsx: every top-level segment covered, no orphaned source.
  Includes the `/terms` rewrite (added at integration — without it,
  `/terms` would 404).
- Layer 2, React 404 + noindex (unknown slugs inside a known family +
  in-app navigation): `src/pages/NotFoundPage.tsx` (new) — Bangla +
  English, shows the address tried, links to Home / Jobs / Library /
  Contact. `src/App.tsx` — catch-all now renders it instead of
  HomePage. Sets its own title + `robots noindex, nofollow` via the
  shared hook below (RouteSeo renders nothing for unknown paths).
- Shared hook `src/lib/useNotFoundMeta.ts` (new, coordinator addition
  after the rendered check — see § Verification): extracted from
  NotFoundPage's effect, gated by an `active` flag, restores title +
  robots tag on unmount so it can never leak. Applied to:
  `JobHubPage` (unknown exam slug, `!def`), `NuSubjectPage` and
  `NuTopicPage` (their NotFound sub-components, which only render when
  not found — zero leak risk). NotFoundPage refactored onto the hook
  (behaviour identical); its stale LIMIT comment corrected.
- Service worker checked: navigation handler is network-first, so a
  server 404 passes through to repeat visitors — the SW does not mask it.

### (c) www→apex 301 redirect — console runbook, NO config shipped
- `docs/www-to-apex-redirect.md` (new) — the only file for this item.
  Verified against Firebase's current official docs: `firebase.json`
  `redirects` match the URL path only (no host field); a catch-all
  aimed at the apex would match apex requests too and loop. The
  purpose-built mechanism is the Firebase Hosting console domain
  redirect (connect `eduvelto.com`, add `www.eduvelto.com` as a custom
  domain, check "redirect all requests to a second specified domain").
  The builder first built a multi-site config, then REVERTED it fully
  on the correction (`firebase.json` / `.firebaserc` back to HEAD).
- Canonical audit (all clean): `seo.ts` canonicals are per-route apex
  URLs (`/terms` → `https://eduvelto.com/terms`); sitemap 31 URLs all
  apex, zero `www`; robots.txt sitemap line is apex; only `www`
  string in the repo is a test asserting it is not a preview hostname.
- Deploy-day action (owner or deploy coordinator, Firebase console):
  www is already connected as a serving domain, so it must be removed
  and re-added with the redirect checkbox (Quick Setup) — between
  removal and re-connection www requests may briefly fail, and SSL
  re-provisioning can take up to 24h per docs (usually hours). Do it
  at a quiet time. Exact verification curls are in the runbook.

## Verification
- Build: **PASS** (`tsc -b && vite build`, exit 0; precache 140 entries).
- Unit: **667/667 across 28 files PASS** (incl. new `/terms` SEO test).
- Preview BY CONTENT + status matrix (final preview, after the hook
  change): `/` 200, `/terms` 200, `/privacy` 200, `/jobs` 200,
  `/jobs/bcs` 200, `/jobs/not-an-exam` 200 (React 404), `/asdfgh` **404**
  (3,386-byte 404.html body), `/random-page` 404, `/jobsfoo` 404,
  `/subjects` 404. `/terms` absent from sitemap (0 matches — intended).
- Rendered checks (real Playwright Chromium, local CONNECT forwarder):
  - `/terms` — HTTP 200, title 'শর্তাবলী — Eduvelto', h1 1 ('শর্তাবলী'),
    draft notice 1, footer terms link 1. PASS.
  - `/jobs/not-an-exam` — HTTP 200, title 'পরীক্ষা পাওয়া যায়নি —
    Eduvelto', meta robots 1 ('noindex, nofollow'), heading 1. PASS
    (after the hook fix; first render had the home fallback title +
    no robots tag — that gap is what the hook closed).
  - `/admissions/national-university/science/subjects/no-such-subject`
    — HTTP 200, title 'বিষয় পাওয়া যায়নি — Eduvelto', robots 1, heading 1. PASS.
  - `/asdfgh` — HTTP 404, title 'পাতাটি পাওয়া যায়নি — Eduvelto',
    robots 1, body text 1. PASS.
  - `/jobs/bcs` (leak check) — HTTP 200, title 'বিসিএস প্রস্তুতি —
    বাংলাদেশ সিভিল সার্ভিস | Eduvelto', robots 0. PASS — no leak.
  - `/` — HTTP 200, robots 0. PASS.
  - Screenshots: `~/workspace/eduorbit/master-quick-wins-shots_*.png`;
    probe script `~/workspace/eduorbit/master-quick-wins-probe.py`.
  - Forwarder note: the skill's 127.0.0.1:18080 proxy is DOWN and the
    old forwarder instance's upstream token had gone stale (curl 000);
    the forwarder (`~/workspace/eduorbit/promo-shorts/forward_proxy.py`)
    was restarted with the current env on 127.0.0.1:18081 and renders
    work through it. Direct TLS fails in this sandbox; the env egress
    proxy works for curl but Chromium's CONNECT through it fails.
- Emulator check (404 builder, before integration): Firebase Hosting
  emulator + curl matrix — all 40 real routes 200, unknown paths real
  404, trailing-slash real routes 200, static files 200.
- `firestore.rules`: 0-line diff. No live Firestore reads/writes.

## Perplexity fold-in (only AI consultation for this task)
Source: https://www.perplexity.ai/session/15803c00-bfbe-4904-9f24-1d5442c6658b
(30 sources; user signed in via Google during a browser takeover).

| # | Advice | Verdict | Reason / what changed |
|---|--------|---------|----------------------|
| T1 | Terms: operator + accounts, eligibility, credential security, acceptable use, suspension/closure | USED | In §2–§3 of the draft. |
| T2 | Minors: Bangladesh counsel review of age/guardian arrangements, not a checkbox alone | USED (as owner note) | Draft references guardian consent per Privacy; flagged for owner below. |
| T3 | User content clause ONLY if uploads/posts exist; students cannot post → omit or keep minimal | USED | §4 is short and accurate (teacher applications + reports only), verified by code grep. |
| T4 | Accuracy: learning/practice only, may contain errors, check official notices; NO guarantee of marks/pass/admission/outcome | USED | §5 verbatim in substance. |
| T5 | Liability: proportionate "to the extent permitted by applicable law", NOT blanket waiver / zero cap | USED | §9; flagged for counsel review below. |
| T6 | Privacy: link separate Privacy notice, name the provider (Firebase), children's-data rules at launch | USED | §7 links /privacy, names Firebase. |
| T7 | Publish Terms AND separate Privacy Notice (don't duplicate) | USED | Privacy already live; Terms links it. |
| F1 | React 404 screen still returns HTTP 200; noindex doesn't change status | USED (correction) | Changed the plan: added the real-404 layer (rewrites + 404.html). |
| F2 | Fixed routes: remove `**` rewrite, rewrite only known routes, deploy 404.html at build root | USED | 41 explicit rewrites + `public/404.html`; verified by emulator + preview curl. |
| F3 | Dynamic families can't be slug-checked server-side; Cloud Function/Cloud Run not available on Spark free | USED (as documented limit) | Recorded as unavailable, not planned; noindex fallback instead. |
| F4 | Client fallback: excluded /not-found URL that really 404s, or noindex on the error page | ADAPTED | Noindex fallback built (shared hook); a separate excluded /not-found URL was not built — the catch-all already serves the React page, and a second URL would add a route with no benefit. |
| F5 | Do NOT claim "real 404s everywhere" unless curl proves it | USED | Claims in this report are per URL shape (see § Known limits). |
| W1 | www→apex redirect lives in the Firebase console, NOT firebase.json (path-only matching; catch-all would loop) | USED (correction) | Multi-site config built then fully reverted; runbook only. |
| W2 | Apex canonicals + sitemap must use HTTPS apex; /terms → https://eduvelto.com/terms | USED | Verified clean (see § (c)). |
| W3 | Verify live: www /terms?test=1 → 301 with path + query preserved; apex /terms 200; invented apex path 404 | ADAPTED | In the runbook, with two corrections: apex /terms can't be the 200 check until the route is live (use /jobs/bcs); invented-path 404 depends on the WEB-001 config being live. |
| W4 | Query-string preservation is documented (path preservation is) | REJECTED as assumed | Not stated in the docs read; the live `?test=1` curl check is the proof — recorded as unverified below. |

## What still needs the owner
1. **Terms text approval** — the `/terms` page is a DRAFT and must not
   go live until the owner approves the text. After approval, add
   `/terms` to `public/sitemap.xml` AND `SITEMAP_URLS` in
   `src/lib/__tests__/seo.test.ts` (exact-match test fails otherwise).
2. **Minors / guardians — counsel review advisable.** Minors can
   register (no age gate in RegisterPage); guardian accounts exist in
   the design and the draft references guardian consent, but the
   age/guardian arrangements should have Bangladesh counsel review.
   Children's-data rules in force should be checked at launch.
3. **Liability / disputes — counsel review advisable** for
   enforceability of the proportionate wording.
4. **www→apex console action on deploy day** — remove `www.eduvelto.com`
   from the site, re-add with the redirect checkbox to `eduvelto.com`
   (see runbook). Brief www downtime + SSL re-provisioning up to 24h
   possible; do it at a quiet time. Then run the runbook's curl checks.

## Known limits (honest)
- **Dynamic-family unknown slugs still return HTTP 200** — only the
  catch-all + the three hooked states carry noindex now. Remaining
  without noindex: unknown class/subject states (ClassDashboardPage,
  ClassSubjectPage, JobSubjectPage, JobTopicPage), async error states
  (Book/Chapter/Lesson/Quiz/Mock/Practice/Result pages — several are
  login-gated anyway, so Google cannot see them), unknown circular
  IDs. The shared `useNotFoundMeta` hook is ready for these as a
  follow-up; each needs its condition checked individually (a wrong
  gate would noindex a REAL page — worse than the gap).
- **Query-string preservation on the console redirect is unproven**
  until the live `?test=1` curl check runs.
- **REST API alternative** (`projects.sites.domains.update` with
  `domainRedirect`) was not verified — the console checkbox is the
  documented path.
- **Probe artifact, not a product defect:** `/jobs/bcs` never reaches
  `networkidle` in Playwright (a connection stays open — likely a
  Firestore listener); `domcontentloaded` + wait renders it fine.
- Live domain state (both domains connected to the default site) was
  taken from the brief's ground truth; the runbook's step 1 confirms
  it before anything is touched.

## Files changed (commit c1bbb3d)
- New: `src/pages/TermsPage.tsx`, `src/pages/NotFoundPage.tsx`,
  `public/404.html`, `src/lib/useNotFoundMeta.ts`,
  `docs/www-to-apex-redirect.md`
- Modified: `src/App.tsx` (+5/−2), `firebase.json` (rewrites 1→41),
  `src/components/Footer.tsx` (+1), `src/lib/seo.ts` (+11),
  `src/lib/__tests__/seo.test.ts` (+14), `src/pages/JobHubPage.tsx` (+5),
  `src/pages/NuSubjectPage.tsx` (+4), `src/pages/NuTopicPage.tsx` (+4)
- NOT touched: `firestore.rules` (0-line diff), any live service.
  No blog, GA4, or backlink work (separate sequenced follow-ups).
