# Day 5 — National Live Exam hub route (coordinator wires this in)

Do NOT edit `src/App.tsx` from the Day-5 hub worker; the coordinator
applies this snippet. The page is `src/pages/LiveExamPage.tsx`
(already written + type-checked in this branch).

## 1. Lazy import — add after the JobLiveExamPage line

Anchor (in `src/App.tsx`, lazy-import block):

```tsx
const JobLiveExamPage = lazy(() => import('./pages/JobLiveExamPage'));
```

Add directly after it:

```tsx
const LiveExamPage = lazy(() => import('./pages/LiveExamPage'));
```

## 2. Route — add INSIDE `<Route path=":lang" element={<LangLayout />}>`

Anchor (inside the `:lang` routes, right after the search route):

```tsx
        <Route path="search" element={<SearchPage />} />
```

Add directly after it:

```tsx
        {/* National Live Exam hub (sprint Day 5): /:lang/live-exam.
            Static segment — no ordering conflict with any dynamic
            route. Public to view (schedule + countdown); entry
            itself requires login (the page gates it). */}
        <Route path="live-exam" element={<LiveExamPage />} />
```

## 3. Verify after wiring

- `npx tsc --noEmit` → 0 errors
- `npm run build` → green, and the `LiveExamPage` chunk stays
  under 200 KB gzip
- Open `/bn/live-exam` and `/en/live-exam`: the hub renders in
  both languages; with no published dated mock it honestly shows
  "no national live exam is scheduled yet", never a guessed exam.

## Notes (do not change the page for these)

- No `firestore.rules` change was needed (see `src/lib/liveExam.ts`
  header: schedule reuses `jobExamDefinitions`, questions reuse the
  single `jobQuestionBundles` doc, merit reuses
  `leaderboardSnapshots/liveMerit-{examId}`).
- The Job track is reused, not rebuilt: Job entries deep-link to
  the existing `/jobs/live-exam/:exam` page and run on
  `/jobs/mock/:docId`.
- SEO/sitemap entry for `/live-exam` (if wanted) is a separate
  follow-up, not part of this snippet.
