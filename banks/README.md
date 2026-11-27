# Eduvelto question banks — landed copies (27 Nov 2026, landing/content)

How the app actually consumes this data (mechanics — read first):

- The Job / Admission / Academic banks do NOT live in the app repo as
  code. They live as JSON draft files and reach the app ONLY through
  `scripts/import-questions.mjs`, which imports them as DRAFTS into
  Firestore draft collections (`jobQuestionDrafts` /
  `admissionQuestionDrafts` / `academicQuestionDrafts`).
  - Dry-run is the default (`--dry-run`): validates, writes nothing.
  - `--live` writes ONLY to the Firestore EMULATOR (127.0.0.1:8080).
    There is NO production path in the importer.
  - The importer reads `--root <dir>`; that dir must contain
    `ID-NAMESPACES.md` (the ID registry) plus the stream dirs
    `job-questions-drafts/`, `admission-questions-drafts/`,
    `academic-questions-drafts/`. This `banks/` dir IS such a root:
    `node scripts/import-questions.mjs --root banks --dry-run`
  - The importer synthesises a NEEDS-REVIEW header for files that
    carry none, normalises the three answer-key spellings
    (`correct_index` / `correctOptionIndex` / `correct_answer_index`)
    to canonical `correct_index`, and REJECTS (with a listed reason,
    never silently): banned phrases, missing source citation,
    unregistered ID prefixes, exact-duplicate question text, and
    ID collisions.
- The Academic VERIFIED pool is different: it is BUNDLED TypeScript
  (`src/lib/publicAcademic*.ts`, combined in `src/lib/publicAcademic.ts`)
  and ships with the site. Only VERIFIED questions (or NEEDS-FIX with
  the fix applied) ever enter it. NEEDS-REVIEW drafts must NEVER be
  copied into those files — they stay here as drafts until a teacher
  reviews them.
- Published Job questions live in Firestore `jobQuestions` + bundles /
  keys; only the 35 owner-verified BCS English questions are bundled
  in code (`src/lib/publicBcsEnglish.ts`).

## What is in this directory

| Path | Contents | Status |
|---|---|---|
| `job-questions-drafts/` (144 files) | C-job normalised bank, 6,348 questions after landing (6,349 − 1 true duplicate removed, JOBQ-D157) | Labels canonical; verdicts applied; 48 files shuffled |
| `admission-questions-drafts/` (49 files) | B-admission reviewed bank, 977 questions | Labels canonical; 48 files shuffled; 0 verified |
| `academic-questions-drafts/` (2 files) | Gap #3 (33 MCQ, ACAD-8101..8133) + Madrasa batch 1 (12, ACAD-8134..8145) | NEEDS-REVIEW drafts only |
| `pyq-46th-bcs-verified.json` | 173 verified 46th BCS Preliminary PYQs (26 Apr 2024, Set-02 কপোতাক্ষ) | SEPARATE set — never merged into drafts; NOT imported by import-questions.mjs (different schema + verified status; import path is a coordinator decision) |
| `ID-NAMESPACES.md` | ID registry the importer requires (copied from the sprint root) | — |
| `shuffle-report.json` | Per-file before/after distributions, fixes, flags, verification | Seed: `eduvelto-landing-2026-11-27-v1` |
| `import-dryrun-2026-11-27.json` | Full importer dry-run report against this dir | 7,365/7,370 valid; 5 rejected (see below) |

## Verdicts after landing (Job, 6,348)

- VERIFIED 1,208 — unchanged (26 Nov BCS review program + C-job spot sample).
- VERIFIED-AFTER-FIX 133 — was 128; +5 fixed here (JOBQ-L365, JOBQ-N632,
  JOBQ-N633, JOBQ-P033 duplicate-option replacements; JOBQ-0251
  duplicated-correct-value replacement). Replacement text is new —
  content-team spot-check still recommended.
- NEEDS-REVIEW 5,007 — was 3,568; +1,437 shuffle-blocker items whose
  bias is now fixed (content still unreviewed) + 2 generic-stem items
  (JOBQ-R111/R112, false-positive NEEDS-FIX — see below).
- NEEDS-FIX 1 — JOBQ-J813 only (ambiguous stem; teacher decision owed).
- REJECTED 0.

Admission: 977 NEEDS-REVIEW, 0 verified, 0 PYQ. (The 126 items B tagged
needs-fix were label normalisations; the normalisation IS applied in
these files, so they now read needs-review.)

## Shuffle (seed `eduvelto-landing-2026-11-27-v1`)

- Job: 48 files / 1,488 questions (the `shuffle_blocker` files from
  C-job `file-position-table.json`). The 11 BCS depth files already
  shuffled 26 Nov 2026 (seed 20261126, 230 Qs) were NOT re-shuffled.
- Admission: 48 files / 961 questions (all with `shuffleRequired=true`).
  `gst-bangla-01.json` skipped (already the most balanced file).
- Method: seeded, constrained — each file's correct positions are a
  balanced multiset (each of A/B/C/D floor(n/4) or ceil(n/4) times);
  distractors shuffled in the remaining slots. Correct option TEXT
  verified unchanged for every question (0 changed). Reproducible via
  `scripts/land-content-banks.py` (refuses to run twice on shuffled
  output — the `_landing_shuffled` marker on each shuffled question).
- Gap #3 (33) and Madrasa batch 1 (12) were already balanced
  (Gap #3 A 8 / B 9 / C 8 / D 8; Madrasa 3 per position) — not shuffled.
- NOTE: the per-file criterion is met everywhere it was applied, but
  the Job bank OVERALL is still A/B-heavy (A 29.8% / B 30.5% / C 22.2% /
  D 17.5%) because files with A-share 55–89% were out of this pass's
  ≥90% scope. A follow-up pass can shuffle those too if the
  coordinator wants whole-bank balance. Admission overall is now
  A 26.6% / B 25.9% / C 24.6% / D 22.9%.

## Fixes applied here

- JOBQ-L365: duplicated 'পুরষ্কার' (A+D) → D is now 'পূরষ্কার'.
- JOBQ-N632: duplicated 'Comittee' (A+C) → C is now 'Commite'.
- JOBQ-N633: duplicated 'Grammer' (A+D) → D is now 'Grammaer'.
- JOBQ-P033: duplicated 'Knifes' (A+C) → C is now 'Knifves'.
- JOBQ-0251: '৩/৩' (= 1, a second correct option) → '৩/৬'.
- JOBQ-R111/R112: kept. They share the generic stem 'Choose the
  correct sentence:' with JOBQ-R061 but have DIFFERENT option sets
  (different sentences) — not duplicates (importer GENERIC_STEMS
  rule agrees). Verdict NEEDS-FIX → NEEDS-REVIEW.
- JOBQ-D157 REMOVED: true duplicate of JOBQ-G318 (same stem, same
  option set, same correct answer 'পশ্চিম'). G318 kept. No content lost.
  Job total 6,349 → 6,348.

## Flagged, NOT fixed (need a human)

- JOBQ-J813 ('___ cat' — no context, A/An/The all correct): needs a
  teacher-supplied stem. Left NEEDS-FIX.
- JOBQ-0310 / JOBQ-0334: orphan IDs — listed in
  `shared-bank-index.json` only, no options in any bank file.
  Flagged only; nothing deleted.
- Importer dry-run rejections (5): the importer dedups on question
  TEXT only, so it rejects the second copy of 5 same-stem pairs whose
  option sets DIFFER (distinct questions): JOBQ-D408 (of D278),
  JOBQ-D717 (of I211), JOBQ-0094 (of D060), JOBQ-J583 (of G017),
  ACAD-8135 (of JOBQ-J960, cross-stream). All 5 are kept in the bank
  files. The importer needs a same-text-different-options rule (it
  already concedes the principle for generic stems) or the coordinator
  accepts 5 rejections at import. Do NOT rewrite verified stems to
  game the dedup, and do NOT delete the second copies.

## Owner order note (27 Nov 15:23)

The owner will verify ALL questions himself (batches after exams) and
ordered: verify content FIRST, then option shuffle. This landing
shuffled now because the landing task mandated it before any use AND
because the shuffle preserves the correct option TEXT exactly
(verified: 0 correct texts changed) — his later content verification
reads the same correct answers. If the coordinator prefers to hold
these files until his verification, the shuffle is reproducible and
reversible from the pre-shuffle sources (B `reviewed/` + C
`normalised/` in `fast-program/`).

## What is NOT here (flagged for the coordinator)

- The Madrasa 409 in-scope drafts (D assessment: 675 usable total,
  409 in scope after the Class 1–5 drop) — reviewed + fixes prepared
  but never merged; there is still no Madrasa/Arabic pool file in the
  app (`src/lib/publicAcademic*.ts` has no Arabic subject). Merging
  them needs a new subject/stream decision, not just a file copy.
- The C11–12 teacher spot-check package (replacements for ACAD-3069 /
  ACAD-8069, 5 re-cited items incl. ACAD-8002, Logic chapter
  assignment, 9 fairness items) — for the owner/teacher to run; no
  replacements applied here.
- CQ-1112-020 — BLOCKED, no graph exists; nothing invented; CQ pool
  stays 359.
- ACAD-5108 (malaria) + ACAD-5096 (greenhouse gases) — stay OUT of
  the NCTB pool; teacher decision owed (drop vs move to
  general-science with WHO/IPCC citation). Already listed as excluded
  in `src/lib/publicAcademic.ts`.
- The 46th BCS PYQs are NOT imported by this importer and NOT merged
  into the drafts — their import path (verified PYQs must not enter
  as NEEDS-REVIEW drafts) is a coordinator decision.
- NTRCA 19th pattern + 52nd BCS circular + BCS viva 100 vs 200 —
  unresolved per C-job §5/§9; bank keeps targeting the verified
  50th BCS / 18th NTRCA patterns.
