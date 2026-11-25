# Eduvelto — Suggestion Booklets (Phase 3, 25 Nov 2026)

Print-ready HTML booklets for the ৳149 suggestion-PDF product.
Each file is a complete, self-contained HTML document with print
CSS (A4). No PDF binary is committed — the PDF is produced by
printing the HTML (see below), so the content stays reviewable
as text.

## ⛔ NOT FOR SALE YET

**None of these booklets is for sale until its content is
verified and the owner approves the sale in writing.**

- The BCS booklet's English section (35 questions) is verified,
  but its study guidance is draft and the other 9 subjects have
  no questions at all.
- The Primary booklet has NO questions at all yet.
- The Honours booklet has NO questions and NO marks split.

The ৳149 card on the site is gated off
(`SUGGESTION_PDF_SALES_ENABLED = false` in `src/lib/orders.ts`)
until verified content exists. Selling wrong paid content would
damage the owner's reputation (the library audit found 506
wrong books) — so nothing here is sold on a promise.

## The three booklets

| File | Verified | Draft / missing |
|---|---|---|
| `bcs-preliminary-suggestion.html` | 50th BCS preliminary pattern (200 marks, 2h, −0.50; BPSC official PDF, 9 Dec 2025); 35 BCS English MCQs (grammar 20, vocabulary 12, comprehension 3 — owner-verified Batch 1) | Study guidance (draft, teacher review pending); model test (outline only); the other 9 subjects' questions (none yet); the 10-Q English Literature SAMPLE batch is EXCLUDED (owner review pending) |
| `primary-teacher-suggestion.html` | DPE 2025 pattern (90Q, 90 min, 25/25/20/20, pass 50%, viva 10, −0.25; Recruitment Rules 2025, 28 Aug 2025) | Study guidance (draft); model test (outline only); ALL practice questions (none yet — none verified) |
| `honours-quick-guide.html` | Honours 3rd Year Exam-2025 routine, session 2022/23, 1–5 PM, 8 papers with codes 231101–231115 (owner-sent routine, 23 Nov 2026; weekdays re-verified) | Study guidance (draft); ALL questions (none yet); marks split Part A/B/C (NOT written — Part B marks unverified; the library audit found the 5-mark label wrong everywhere against the real 4 marks) |

Rules that govern every booklet (enforced by
`src/lib/__tests__/booklets.test.ts`):

- NEVER invent questions, never label a guess as a past
  question, never claim guaranteed outcomes — no "100% কমন",
  "নিশ্চিত কমন" or "guaranteed" string appears in any booklet.
- Anything not verified is marked **খসড়া (draft)** / "নেই"
  inside the booklet, and each booklet states plainly what it
  does NOT contain.
- The BCS questions are verbatim from
  `src/lib/publicBcsEnglish.ts` — they were generated from that
  source (see below), never transcribed by hand, and the test
  re-verifies all 35 (id, text, 4 options, correct letter).

## How to produce the PDF

1. Open the `.html` file in a desktop browser (Chrome/Edge).
2. Print → Destination: **Save as PDF**.
3. Paper size **A4**, margins **Default** (the file sets
   `@page` 18mm/16mm), enable **Background graphics** so the
   notice boxes print.
4. Check the first page: the red "এখনো বিক্রির জন্য প্রস্তুত
   নয়" notice must be visible, and the verified-vs-draft
   table must be on page 1 or 2.
5. Headless alternative:
   `google-chrome --headless --print-to-pdf=out.pdf file.html`
   (or `chromium --headless --print-to-pdf=out.pdf file.html`).

## Regenerating the BCS questions

The 35 questions in `bcs-preliminary-suggestion.html` were
generated from the verified source — they must never be edited
by hand in the HTML:

```
cd phase2-project-ssg-support
npx vite-node ~/workspace/eduorbit/ssg-support-roadmap-evidence/generate-bcs-questions.mjs \
  ~/workspace/eduorbit/ssg-support-roadmap-evidence/bcs-questions-fragment.html
# then re-assemble: head + fragment + tail (see the evidence dir)
# and re-run: npx vitest run src/lib/__tests__/booklets.test.ts
```

If any question text changes in `src/lib/publicBcsEnglish.ts`,
regenerate and re-run the test — the test fails loudly on any
drift between the booklet and the source.
