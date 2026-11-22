# CSP Google Fonts fix — report (22 Nov 2026)

## Bug
The Bangla deploy loads Poppins / Hind Siliguri / Noto Serif Bengali from
`fonts.googleapis.com` (stylesheet link + preconnects in `index.html`
lines 15–18), but the live CSP `style-src` was `'self' 'unsafe-inline'
https://*.gstatic.com` — no `fonts.googleapis.com`. Browsers blocked the
stylesheet, so NO webfont loaded and headings fell back to system serif
(which still looked "stylish serif", hiding the bug). Parent-verified from
the live response header 22 Nov ~14:30.

## Fix (branch `fix/csp-google-fonts`, HEAD 001820a, off origin/main 9495cdf)
`firebase.json` ONLY — one token added to `style-src`:

```diff
- style-src 'self' 'unsafe-inline' https://*.gstatic.com;
+ style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.gstatic.com;
```

Every other directive byte-identical. No script-src, font-src, rules, or
code changes. `font-src` already allowed `https://*.gstatic.com` (font
files), so only the stylesheet origin was missing.

## Verification
- **Build PASS** (exit 0, `~/workspace/csp-fonts-build.log`).
- **Preview:** https://eduvelto--csp-google-fonts-o8yfijmp.web.app
  (expires 29 Nov 08:31 UTC). Routes `/`, `/jobs`, `/library` all 200.
- **CSP header on preview (curl -sSI):**
  `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.gstatic.com`
  — the new origin is present; `font-src 'self' data: https://*.gstatic.com`
  unchanged.
- **Stylesheet fetchable:** the exact css2 URL returns HTTP 200
  (11,832 bytes) with `@font-face` rules for all three families
  (Poppins, Hind Siliguri, Noto Serif Bengali).
- **Built CSS** references `Noto Serif Bengali` and `Hind Siliguri`
  (headings/body font stacks).
- **Real-merge check:** merged the branch into a scratch worktree off
  origin/main 9495cdf — clean, zero conflicts, only `firebase.json`
  changed. Scratch worktree removed.

## NOT verified — rendered font loading
Playwright rendered check (document.fonts status + heading computed
font-family) was attempted 4 ways and could NOT run: the sandbox proxy
`127.0.0.1:18080` is DOWN (curl: connection refused, HTTP 000; it worked
at ~14:17 for the language-toggle probe and has failed since ~14:26), and
Chromium through the egress proxy fails with
`ERR_TUNNEL_CONNECTION_FAILED`. Direct curl to the preview works (200).
So: the CSP blocker is proven fixed at the header level and the stylesheet
is proven fetchable, but in-browser `document.fonts` loading + heading
computed font-family were NOT observed. Do NOT claim the fonts render until
a rendered check (Playwright once the proxy recovers, or the owner's phone
after deploy) confirms it. A browser-task visual check is NOT decisive for
fonts and was not used.

## Status
NOT merged to main, NOT deployed to production — production deploy needs
the owner's separate approval. Deploy = merge (clean per the scratch
check) + `firebase deploy --only hosting` (firebase.json is a hosting
config; no rules deploy needed — no rules changed).
