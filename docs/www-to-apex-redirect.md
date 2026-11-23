# www.eduvelto.com → eduvelto.com (301) — deploy-day runbook

**Status: NOT shippable from this branch.** The redirect is a Firebase
Hosting console action on the domain mapping. No `firebase.json` change
implements it, and this branch ships none — `firebase.json` and
`.firebaserc` are untouched. The redirect needs the owner's (or deploy
coordinator's) Firebase console action on deploy day.

## Why the console, not firebase.json

Verified against Firebase's current docs (23 Nov 2026), not from
second-hand advice:

- `firebase.json` `redirects` rules match **the URL path only**.
  Firebase Hosting docs ("Configure Hosting behavior"):
  "Firebase Hosting compares the `source` or `regex` value against all
  URL paths at the start of every request." The rule fields are only
  `source`/`regex`, `destination`, `type` — there is **no host field**.
- A catch-all such as `/** → https://eduvelto.com/$1` in the single-site
  config would therefore match apex requests too and redirect
  `eduvelto.com` to itself — an infinite redirect loop. **Never add it.**
- The purpose-built mechanism is the domain-level redirect in the
  "Connect a custom domain" wizard (Firebase Hosting docs, "Connect a
  custom domain", Step 1.3): "Check the box to redirect all requests on
  the custom domain to a second specified domain (such that `example.com`
  and `www.example.com` redirect to the same content)."
- Hosting API (`projects.sites.domains`): `domainRedirect` — "Domain
  redirects preserve the path of the redirect but replace the requested
  domain with the one specified in the redirect configuration", with
  `type` = the redirect status code. The console redirect answers
  **HTTP 301**. Query-string preservation is not stated explicitly in
  the docs — confirm it live with the `?test=1` check below.

(A separate second Hosting site whose config only redirects would also
be host-safe in principle, but it was deliberately NOT built: it still
needs console work — create the site, move the domain between sites —
and adds a permanent second site + deploy target + doubled `dist`
uploads to a Spark project for a one-line redirect. The console domain
redirect is the simpler, purpose-built mechanism.)

## Deploy-day console steps (owner / deploy coordinator)

Precondition: in the Firebase console → project `eduvelto` → Hosting,
confirm `eduvelto.com` and `www.eduvelto.com` are both listed under the
default site and both **Connected**. Do not change DNS: the www A/AAAA
records already point at Firebase Hosting.

`www.eduvelto.com` is already connected as a serving domain, so the
redirect checkbox is not directly available on it — the domain must be
removed and re-added with the redirect:

1. Hosting page → default site → `www.eduvelto.com` → remove the domain.
   (DNS records stay as they are.)
2. **Add custom domain** → enter `www.eduvelto.com` → **check** "Redirect
   all requests on the custom domain to a second specified domain" and
   select/enter `eduvelto.com` as the target.
3. Complete the wizard (**Quick Setup** — the docs list "domains that you
   are attempting to transfer from another Hosting site" as a Quick
   Setup case). Follow whatever ownership verification the wizard asks
   for; the apex TXT record already exists.
4. Wait until the domain shows **Connected** and the SSL certificate is
   provisioned.

**Risk to know before doing it:** between removal and re-connection
`www.eduvelto.com` has no domain mapping, so www requests may briefly
fail; SSL re-provisioning can take up to 24h per the docs (usually a
few hours). Do this at a quiet time and verify immediately (below).

Alternative without remove/re-add: Hosting REST API
`projects.sites.domains.update` on
`projects/eduvelto/sites/eduvelto/domains/www.eduvelto.com`, setting
`domainRedirect` to `eduvelto.com` with a 301 type. The exact `type`
enum string was **not** verified from the API reference in this task —
confirm it there at deploy time, or use the console checkbox above,
which sets it correctly.

## Deploy-day verification (run after the domain shows Connected)

```bash
# 1. www root → 301 to apex root
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" https://www.eduvelto.com/
# expect: 301 https://eduvelto.com/

# 2. www deep path + query → 301, path AND query preserved
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" "https://www.eduvelto.com/terms?test=1"
# expect: 301 https://eduvelto.com/terms?test=1

# 3. www deep path without query
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" https://www.eduvelto.com/jobs/bcs
# expect: 301 https://eduvelto.com/jobs/bcs

# 4. apex serves a real route normally (200). Use /jobs/bcs — NOT /terms:
#    /terms has no route in App.tsx yet (Terms page work pending), so it
#    404s on the apex until that lands. /jobs/bcs is live.
curl -s -o /dev/null -w "%{http_code}\n" https://eduvelto.com/jobs/bcs
# expect: 200

# 5. apex unknown path — expected status depends on which hosting
#    config is live:
#    - WITH the WEB-001 rewrite allowlist merged (in flight in this
#      branch: explicit rewrites, no catch-all, public/404.html):
#      an unknown TOP-LEVEL path returns a real HTTP 404.
curl -s -o /dev/null -w "%{http_code}\n" https://eduvelto.com/this-page-does-not-exist
# expect (WEB-001 live): 404
#    - WITHOUT WEB-001 (HEAD catch-all ** -> /index.html): the same URL
#      returns HTTP 200 with the SPA shell and the app renders its
#      NotFound page (noindex) client-side. Do NOT expect curl to show
#      404 in that case.
#    - Either way, an unknown path INSIDE a known route family
#      (e.g. /jobs/not-an-exam) returns 200 + the React NotFoundPage —
#      a backend cannot tell a bad slug from a good one on Spark.
#    ALSO: /terms is missing from the in-flight WEB-001 rewrite
#    allowlist. Fine today (no /terms route yet), but the allowlist
#    MUST gain "/terms" when the Terms route lands, or /terms will
#    404 on the apex. Flagged to the coordinator.
```

**A preview channel cannot prove any of this.** Preview URLs
(`eduvelto--*.web.app`) serve the default site under a different
hostname; the redirect lives on the `www.eduvelto.com` domain mapping,
not in deployable config. Only the live curl checks above prove it.

## Canonical side — already correct (verified 23 Nov 2026)

- `SITE_URL = 'https://eduvelto.com'` (`src/lib/seo.ts`); every
  indexable page's canonical is per-route apex:
  `canonical = SITE_URL + path`, so `/terms` →
  `https://eduvelto.com/terms`, `/jobs/bcs` →
  `https://eduvelto.com/jobs/bcs`. No canonical points at `www` or at
  the homepage (except `/` itself).
- `/founder` canonical is `https://eduvelto.com/founder`
  (`src/pages/FounderPage.tsx`); `index.html` static fallback canonical
  is the apex homepage (`https://eduvelto.com/`) and is overwritten per
  route by the app's SEO hook.
- `public/sitemap.xml`: 31 URLs, all apex, zero `www` references.
  `/terms` is not in the sitemap yet (joins at merge time; the SEO
  50–100 workstream owns `sitemap.xml`).
- `public/robots.txt` sitemap line is the apex URL. `NotFoundPage`
  deliberately sets no canonical and `noindex, nofollow`.
- Only `www.eduvelto.com` string in the repo is a test asserting it is
  NOT a preview hostname (`src/lib/__tests__/adsConfig.test.ts`) —
  correct as-is.

## Sources

- https://firebase.google.com/docs/hosting/full-config (redirects:
  path-only matching; field table has no host field)
- https://support.google.com/firebase/answer/9137747 (custom domain:
  redirect checkbox, Step 1.3; Quick Setup for transfers)
- Firebase Hosting API, `projects.sites.domains` (`domainRedirect`:
  preserves path, replaces domain; `update` can set it on an existing
  mapping)
