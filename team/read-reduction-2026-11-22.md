# Firestore read reduction — fix/read-usage (22 Nov 2026)

## Why
The site hit the 50,000/day Spark read quota on 22 Nov evening (backup
export failed with HTTP 429). The standing structural hog was the class
dashboard: every Honours visit read 439 books + 199 quizzes = **638
reads**, and the class index / subject pages read all 609 books.
Owner direction 21:18–21:27: fix it WITHOUT a card, and design for sudden
spikes of thousands to lakhs of visitors (per-visit cost is what decides
how many visitors the free tier can serve).

## What changed (branch fix/read-usage, staging -> production 22 Nov)
- **Loader-maintained stats docs** — one doc per class level in
  `leaderboardSnapshots` as `classStats-<slug>` (`kind: 'classStats'`):
  book/quiz counts, total questions/chapters, per-subject aggregates,
  quiz titles. Placement needs **ZERO rules change** (that collection is
  already public-read + moderator-write, no client listers, already in
  BACKUP_COLLECTIONS) — the compiled-rules margin is only ~1,138 bytes,
  so no new rule was added. Stats carry only aggregates + titles — no
  questions, no answer keys.
- **Dashboard reads 1 stats doc + first page of books (20)** on mount;
  the quiz list (20) loads lazily only when the Tests tab opens.
  Books/Tests tabs page server-side (20/page, session-cached).
  Guests see the quiz COUNT from stats; the quiz LIST stays signed-in-only.
- **Class index: 5 stats reads** (was 609). **Subject page: 1 stats +
  20 books** (was 609).
- **Session caching everywhere**: stats doc, book/quiz pages (keyed by
  cursor) — revisiting a page costs 0 extra reads.
- **Graceful fallback**: when a stats doc does not exist yet, every page
  falls back to the old full-list fetch — same reads as before, never a
  zero. The fix activates live only once the stats docs are written (see
  Activation below).
- **Loaders keep stats fresh**: `load-library-content.mjs` writes the
  book half, `load-quizzes.mjs` the quiz half (merge semantics on the
  `subjects` array); both skip stats on partial (--only/--limit) runs.
- **Favicon** (same branch): the green-circle placeholder is gone.
  `public/favicon.svg` is now the approved emblem (white open-book E +
  blue orbit + gold star on Deep Navy), plus `public/favicon.png`
  (180×180, same emblem) and `public/favicon.ico`. Google still takes
  days to show it in search after re-crawling — not immediate.

## Before / after (emulator-measured, live-scale seed)
`emulator-tests/read-usage-measure.test.ts` — baseline + after, 2/2 PASS.

| Visit | Before | After |
|---|---|---|
| Honours dashboard, guest Home | 439 books | **21** (1 stats + 20 books) |
| Honours dashboard, signed-in Home | 638 | **30** (1 + 20 + 3 attempts + 2 bookmarks + 2 progress + 1 summary + 1 off-page bookmarked book) |
| Honours Home + Tests tab | 638 | **50** (+20 quizzes) |
| Honours Books tab, extra page | 0 (already loaded) | **+20** per new page (revisits 0) |
| Honours subject page (e.g. English) | 609 | **20** (stats cached) |
| Class index (/class) | 609 | **5** |
| SSC dashboard Home | 81 | **21** |
| HSC dashboard Home | 84 | **21** |
| Quiz page (one quiz) | 1 | 1 (unchanged — single-doc read) |
| Homepage, guest | 0 | 0 (static; signed-in progress = own docs only) |

One quiz Tests page still transfers ~74 KB (20 full quiz docs with their
`questions` arrays) — reads are fixed; bytes are a follow-up (a
metadata-only quiz collection would cut them; not built here).

Order note (honest): server pages partition by document-ID order — the
same accepted trade-off as LibraryPage/ExamPage. Within a page the order
is the old (class, department, title) order; which 20 books land on page
1 follows document IDs, so the Home "first 6 books" preview may show
different books than before. The SET is identical. Restoring the old
global order needs a composite index (owner follow-up).

## Per-visit budget + what the free tier covers
Typical visit (homepage + dashboard + one quiz page): **~25–35 reads**.
- 50,000/day covers **~1,400–2,000 visits/day**.
- Spike: ~1,000 visitors ≈ 25–35k reads — fits. ~2,000 ≈ 50–70k — at/over
  the cap. ~10,000 ≈ 250–350k — fails. A sudden lakh (100,000) ≈
  2.5–3.5M reads — **fails no matter how efficient the reads are**.
- Second cap: Hosting transfer 360 MB/day. First visit downloads a few
  hundred KB (hashed assets are cached afterwards, so repeat visits cost
  ~0 transfer); the transfer cap binds at roughly ~1,000 NEW visitors/day.
- **Honest limit: the free tier CANNOT handle lakhs of visitors.**
  That scale needs Blaze (card; ~$0.06/100k reads — a few taka/day at
  realistic near-term traffic). Firebase infra itself scales (CDN +
  Firestore, no server to crash) — the limit is the billing cap, not
  capacity.

## Activation (REQUIRED — the fix is dormant until this runs)
The deployed code falls back to full-list reads until the stats docs
exist live. Run **right after the ~14:00 Dhaka quota reset** (never in
the evening):
```
node scripts/write-class-stats.mjs
```
Cost ~1,623 live reads (609 books + 1,014 quizzes listed) + 5 writes.
Verify: the 5 docs `leaderboardSnapshots/classStats-*` exist with
sane counts. After that, dashboard visits drop to the "After" numbers
above. The loaders keep stats fresh on every full re-run.

## Card-free operating rules (standing)
1. **All testing/verification on the EMULATOR, never live reads.**
   Live reads are for real visitors + the post-reset jobs only.
2. **Heavy live jobs (loader re-runs, backup exports, stats writes) run
   right after the ~14:00 Dhaka quota reset** when the 50k is fresh —
   never in the evening after a day of testing.
3. Never deploy rules without the comment-strip step + a compiled-size
   re-measure (margin ~1,138 bytes). This fix deliberately touched NO
   rules file, so its deploy is hosting-only.

## What tonight does NOT do
- It does NOT restore tonight's exhausted quota — the 50k/day resets
  ~14:00 Dhaka tomorrow, and the backup export stays blocked until then.
- It does NOT change what students see (same books/quizzes/counts),
  except the page-1 order note above and guests now seeing the quiz
  count on the Tests tab (with a sign-in prompt).
- No security rule was weakened; no new collection rule was added.
