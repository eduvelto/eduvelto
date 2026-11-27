# Books fixture for prerender

`books.json` is the ONLY book data the Cloudflare Pages build may use.
It is a minimal, public-safe extract from a daily Firestore backup:

- **Published books only** (609) + all chapters (2,307), with ONLY the
  fields `scripts/prerender.mjs` reads (`normalizeBooksFixture` /
  `normalizeChaptersFixture` whitelist). No users, donations, orders,
  emails, phone numbers, or any other collection — the raw backup
  (57 MB) must NEVER be committed to this public repo.
- Source: `eduvelto-backup-20261127-082915.json` (exported
  2026-11-27T08:29:15Z). All 609 books were Published; the library has
  no Class 1–5 books, so the 27 Nov Class 1–5 deletion did not change
  this fixture.
- Chapters carry `reviewStatus` + `isPreview`; none has `isPreview`
  set, so book payloads honestly carry zero preview chapters (same as
  the full-backup path — see the comment in `prerender.mjs` main()).

## Why a fixture, not --live

`npm run prerender -- --live` reads books/chapters from live Firestore
via REST. That broke the Pages build on 27 Nov 2026
(`Firestore REST 400 reading books`) and is documented in
`prerender.mjs` as unreliable while quota/rules block the unauthenticated
list read. The fixture path is the supported fallback.

## Regenerating

After the library changes (new books / new published chapters), rebuild
the fixture from the freshest daily backup and commit it:

```bash
python3 ~/workspace/eduorbit/fast-program/extract-books-fixture.py \
  ~/workspace/eduorbit/backups/eduvelto-backup-YYYYMMDD-HHMMSS.json \
  scripts/fixtures/books.json
```

Then verify the safety audit in the script output (non-whitelisted keys:
NONE; 0 emails) and run `npm run build:pages` locally before pushing.
A stale fixture does NOT break the build — it only means new books
appear after the next fixture refresh.
