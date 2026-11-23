# Eduvelto — Hybrid Ad Strategy (owner brief 23 Nov 2026, 21:52)

**Status:** implemented on branch `adsense/hybrid-ads` (based on
`fix/adsense-auto-ads-code`); master switch stays **OFF** until AdSense
approval AND the owner sends real slot IDs. Nothing renders live while
the master is off.

**This policy SUPERSEDES** the 22 Nov 2026 placement plan
(`team/ads-placement-plan-2026-11-22.md`) and the 22 Nov 10:45 exam
rule ("akdom cuto" small banner). The biggest change: **NO ads during
exams** — the exam small banner is removed from exam pages (its code
path is retained but disabled; no route returns it any more).

## Account setup (owner-side, already done)

- Auto ads **ON** in the AdSense account (owner screenshots 23 Nov
  21:22), Auto optimize ON.
- Manual display units are created by the owner in his AdSense account;
  he sends the slot IDs to Muse. **Never invent a slot ID.**
- Non-personalised ads only, always (`data-npa=1`,
  `google_non_personalized_ads: 1`); child safety: family-safe ads only,
  sensitive-category blocks in the AdSense account.

## Display placements (manual units)

| Placement | Size / format | Where |
|---|---|---|
| `bottom-banner` | responsive, fixed to viewport bottom | App layout, all eligible pages (see below) |
| `top-banner` | 728×90 | Homepage, directly below the hero slider (nothing above the fold); future articles |
| `sidebar` | 300×250, sticky ≥1280px | Class dashboard (desktop) |
| `mobile` | 320×50, ≤768px | Class dashboard (mobile) |
| `in-content` | 300×250 | Class dashboard list (after item 9); directory list (after item 9); lesson mid-point (halfway through the questions, ≥ 4 questions only) |
| `in-content-2` | 300×250 | End of lesson (after the progress card); future articles |
| `in-feed` | responsive | Library list (after item 9); book chapter grid (after chapter 10, books with > 10 chapters) |
| `in-feed-2` | responsive | End of library list; end of book chapter list |
| `bottom-banner-small` | horizontal, max 50px | **DISABLED — retained code path only** |

## Page rules (enforced in `src/lib/adsConfig.ts`)

- **Homepage — LIMITED:** top-banner below the hero + bottom banner
  only. Nothing above the fold.
- **Books / library:** in-list + end (`in-feed`, `in-feed-2`).
- **Chapter / lesson:** mid-content (`in-content`, between the two
  halves of the questions list) + end (`in-content-2`, after the
  progress card). The mid slot never sits before the first question or
  between a question and its answer; numbering continues across the
  split list via `<ol start>`.
- **Articles:** top / mid / end (`top-banner`, `in-content`,
  `in-content-2`). No article routes exist yet (`/blog` is a Part 1
  item) — the policy is ready so a future article template only has to
  mount the slots.
- **Quiz:** ads only **AFTER** the quiz ends — never between questions.
  Quiz/job result pages get the normal bottom banner; no in-page slots.
- **EXAM: NO ads during exams.** Timed job mocks (`/jobs/mock/:mockId`)
  count as exams. This supersedes the 22 Nov small-banner rule.
- **AI Teacher:** no ads inside AI answers or student conversations.
  The whole page is a conversation surface, so the bottom banner is
  removed from the page entirely.
- **Login, registration, profile, admin:** no ads. (No private-message
  routes exist yet; `/social` is a design proposal only.)
- **Every ad is clearly labelled** "বিজ্ঞাপন" in plain muted text
  above the unit — never styled like a Download / Next / Continue
  button.
- **Unfilled slots collapse:** AdSlot watches `data-ad-status` with a
  MutationObserver and unmounts the whole slot (label included) when
  AdSense reports `unfilled` — no empty box, no blank strip. Auto ads'
  own units are Google-managed and collapse themselves.
- **No duplicate ad requests:** the AdSense library loads once
  (`loadAdsenseScript` guard in `src/lib/ads.ts`).
- **Mobile + desktop:** sidebar sticky ≥1280px, mobile slot ≤768px
  (`.ev-ad-slot-sidebar` / `.ev-ad-slot-mobile` in `src/index.css`).

## What is NOT in this task (separate Part 1 work)

- AdSense account review status (owner-side; check the account).
- Privacy §7 Google ad-cookie disclosures (research finding F3).
- Public sample content / coming-soon pages / blog (findings F1, F2, F4).
- The three owner-side steps after approval: (1) owner creates ad units
  + sends slot IDs; (2) deploy built with `VITE_ADSENSE_CLIENT_ID` +
  `VITE_ADSENSE_SLOT_*`; (3) flip `ADS_MASTER_ENABLED` to true +
  redeploy. There is **no ads toggle in the admin dashboard** — the
  AdminAds page only displays.

## Verification

- Build: `npx tsc -b && npx vite build` — PASS.
- Unit tests: `npx vitest run src` — **43 files, 843 tests, all PASS**
  (adsConfig 22, AdSlot 6, adsenseScript 5, LessonReaderAds 4).
  NOTE: a plain `npx vitest run` (no path) also picks up
  `emulator-tests/` and hangs without the Firestore emulator running
  (gRPC retries to 127.0.0.1:8080 forever) — that is the pre-existing
  `test:rules` setup, not this branch; the rules suite needs
  `firebase emulators:exec`. No `firestore.rules` change in this task.
- Preview OFF (committed branch, channel `adsense-hybrid-off`):
  https://eduvelto--adsense-hybrid-off-nj1ym0u5.web.app (expires
  30 Nov 2026). Playwright probe `hybrid-probe.py` (evidence dir):
  home = top-banner + bottom-banner placeholders; library = in-feed +
  in-feed-2 + bottom-banner; exam / ai-teacher / profile = ZERO ad
  slots; quiz result = bottom-banner placeholder only; 0 console
  errors everywhere; 0 AdSense script, 0 `<ins>`, 0 pagead2 requests.
- Preview ON (temporary master-flip + real client ID
  `ca-pub-6571267788512484` + test-only slot `test-only-not-a-real-unit`,
  flip reverted after; channel `adsense-hybrid-on`):
  https://eduvelto--adsense-hybrid-on-rx06tgtv.web.app (expires
  30 Nov 2026). Desktop + mobile probes agree: script in `<head>`
  exactly once on home/library/book/quiz-result, `window.adsbygoogle`
  loaded, 1 real `<ins>` for the bottom banner; top-banner/in-feed/
  in-feed-2 stay labelled placeholders (no slot IDs set — by design);
  exam / ai-teacher / profile load NO script at all (0 requests, 0
  errors) even with the master ON — the gate holds. Console errors:
  only the expected HTTP 400 for the fake test slot, on pages where
  the banner rendered. Unfilled-collapse observed live: the fake-slot
  banner disappears from the DOM after AdSense answers (book page
  screenshot shows the footer with no banner and no empty strip;
  `data-ad-placement` gone on library/book, timing varies per page).
  The 1 leftover `<ins>` on collapsed pages is an Auto ads insertion
  (Google-managed, no `data-ad-placement`), not our banner.
- LessonReader slots are proven by `LessonReaderAds.test.tsx`
  (renderToString) rather than the preview probe — see below.
- Live deploy follows the verified runbook
  (`team/deploy-batch-post-cron-2026-11-23.md`): real merge in a scratch
  worktree, rebuild deploy-main BEFORE the hosting deploy, dist-freshness
  check, hosting-only deploy (no `firestore.rules` change), live probe BY
  CONTENT on eduvelto.com + www.eduvelto.com.

## Judgment calls (flagged for ChatGPT/Gemini review by the parent)

1. **Exam-result pages → normal `bottom-banner`.** The brief says quiz
   ads only AFTER the quiz ends; result pages are after the exam.
2. **AI Teacher → no banner at all** (not just "no ads inside
   answers"). The whole page is a conversation surface; a fixed banner
   would sit under the chat input during the conversation.
3. **Unfilled-collapse via MutationObserver on `data-ad-status`.**
   Standard AdSense behaviour, but worth a second pair of eyes.

## Known gaps found during verification (NOT caused by this branch)

- **No live chapter carries `isPreview=true`.** The guest preview
  feature exists in code (`listPublishedChapters({ previewOnly })`,
  ChapterPage wall), but 8 probed books all show 0 chapters for
  guests, so no guest can read any lesson and no signed-out probe can
  reach a LessonReader or a BookPage chapter list. BookPage
  `in-feed`/`in-feed-2` and LessonReader `in-content`/`in-content-2`
  therefore have no rendered-preview evidence for guests; the lesson
  slots are proven by `LessonReaderAds.test.tsx`, the book slots by
  code review (same AdSlot component already probe-verified on
  /library). If the owner wants guest preview chapters, some chapter
  per book needs `isPreview=true` set in the data (separate content
  task — the import never sets the flag).
- **Relay flakiness:** the CONNECT relay (127.0.0.1:18099) stalls
  intermittently on `*.web.app` hosts (curl exit 56 / probe
  ERR_EMPTY_RESPONSE) while raw CONNECT + TLS through the same relay
  works — transient upstream congestion, retries succeed. If a probe
  fails this way, retry before concluding the preview is down.
