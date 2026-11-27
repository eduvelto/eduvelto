# ID Namespaces — Eduvelto Question Bank (registry)

**Rule: a new worker MUST claim a free prefix in this file BEFORE writing a single
question. The checker (`scripts/check_bank.py`) warns when a file's ID prefix does
not match its filename/worker. An ID collision (same ID, two different questions)
blocks any ID-based import.**

Last updated: 26 Nov 2026 ~06:30 (checker snapshot scanned 11043 / unique 10622 /
ID collisions **0**; importer dry-run 10621 valid / 422 rejected, 0 prefix rejections).

## Job bank — `JOBQ-`

| Prefix | Worker | Files | IDs | Status |
|---|---|---|---|---|
| `JOBQ-####` (numeric, no letter) | Core (content coordinator) | `job-questions-drafts/bcs/*.json`, `bank/*.json`, `primary/*.json`, `ntrca/*.json`, `ministries/*.json`, `grade11-20/*.json` (base files) + `shared-bank-index.json` | JOBQ-0001–JOBQ-0457 (core 457) | done |
| `JOBQ-D###` | A — BCS + Bank depth | `job-questions-drafts/bcs/*depth*.json`, `bank/*depth*.json` | D001–D800 | done (800) |
| `JOBQ-P###` | B — Primary depth | `job-questions-drafts/primary/*depth*.json` | P001–P250 | done |
| `JOBQ-N###` | B — NTRCA depth | `job-questions-drafts/ntrca/*depth*.json` | N001–N250 | done |
| `JOBQ-M###` | B — Ministries depth | `job-questions-drafts/ministries/*depth*.json` | M001–M150 | done |
| `JOBQ-L###` | B — Grade 11–20 depth | `job-questions-drafts/grade11-20/*depth*.json` | L291–L441 (150) | done |
| `JOBQ-R###` | E — recurring / high-frequency topics | `job-questions-drafts/recurring-*.json` | R001–R400 | done |
| `JOBQ-G###` | G — BCS Bangla/English/Math/Mental | `job-questions-drafts/bcs-g-*.json` | G001–G1000 | done |
| `JOBQ-H###` | H — BCS GK/Science/ICT/Geography/Constitution/Ethics | `job-questions-drafts/bcs-h-*.json` | H001–H1078 | done (1078) |
| `JOBQ-I###` | I — Bank + Primary expansion | `job-questions-drafts/bank-i-*.json`, `primary-i-*.json` | I001–I1000 | done |
| `JOBQ-J###` | J — NTRCA + ministries + 11–20 expansion | `job-questions-drafts/ntrca/ntrca-j-*.json`, `ministries/ministries-j-*.json` | J001–J1000 (1000 on disk; parent confirmation of "finished" pending) | drafting/finishing |

Free Job letters (as of 26 Nov): A, B, C, E, F, K, O, Q, S, T, U, V, W, X, Y, Z.
**Do NOT use K for a Job prefix without asking the keeper** — "Worker K" is the
Admission DU/GST/RU worker (ADMQ family), so the letter K is confusing in Job
context even though `JOBQ-K###` strings would not collide with `ADMQ-*`.

## Admission bank — `ADMQ-`

| Prefix | Worker | Files | IDs | Status |
|---|---|---|---|---|
| `ADMQ-DU###` | K — DU | `admission-questions-drafts/du-*.json` | DU001–DU200 | done |
| `ADMQ-GST###` | K — GST | `admission-questions-drafts/gst-*.json` | GST001–GST150 | done |
| `ADMQ-RU###` | K — RU | `admission-questions-drafts/ru-*.json` | RU001–RU150 | done |
| `ADMQ-CU###` | L — CU | `admission-questions-drafts/cu-*.json` | CU001–CU125 | done |
| `ADMQ-JU###` | L — JU | `admission-questions-drafts/ju-*.json` | JU001–JU125 | done |
| `ADMQ-MED###` | L — Medical | `admission-questions-drafts/med-*.json` | MED001–MED125 | done |
| `ADMQ-ENG###` | L — Engineering | `admission-questions-drafts/eng-*.json` | ENG001–ENG125 | done |

Note: "Worker K" and "Worker L" are the **admission** workers. They do NOT use
`JOBQ-K` / `JOBQ-L` — `JOBQ-L###` is Worker B's grade 11–20 depth (see above).
Admission IDs are namespaced by university in the ID itself, so a new admission
worker for a new university claims a new `ADMQ-<UNI>` prefix here first.

## Academic bank — `ACAD-` / class prefixes

| Prefix | Worker | Files | Status |
|---|---|---|---|
| `ACAD-####` (numeric) + `ACAD-#####` (5-digit, 10000-block) | D — Class 9–12 + Honours | `academic-questions-drafts/class-9-10-*.json`, `class-11-12-*.json`, `hons-*.json` | done (1110); 5-digit block = hons set 3 (`hons-english-*-03.json`, ACAD-10001–10104, 104 qs, 26 Nov 2026) |
| `CQ-1112-###` | CQ worker — Class 11–12 Creative Questions | `academic-questions-drafts/cq-11-12-*.json` | done 26 Nov 2026 (170 CQs, CQ-1112-001–170, 17 files × 10) |
| `CQ-910-###` | CQ worker — Class 9–10 Creative Questions (separate worker) | `academic-questions-drafts/cq-9-10-*.json` | reserved — do NOT use for 11–12 |
| `ACAD-C3-*` … `ACAD-C8-*` | C — Class 3–8 | `academic-questions-drafts/class-3-*.json` … `class-8-*.json` | in progress |
| `MAD-D9-###` | Madrasah worker — Dakhil 9–10 | `academic-questions-drafts/mad-dakhil-9-10-*.json` | drafting (26 Nov 2026) |
| `MAD-E-###` | Madrasah worker — Ebtedayi 1–5 | `academic-questions-drafts/mad-ebtedayi-*.json` | drafting 26 Nov 2026 (E-001–E-280, 280 qs) |
| `MAD-D-###` | Madrasah worker — Dakhil 6–8 | `academic-questions-drafts/mad-dakhil-6-*.json`, `mad-dakhil-7-*.json`, `mad-dakhil-8-*.json` | drafting 26 Nov 2026 (D-001–D-120, 120 qs) |
| `MAD-A-###` | Madrasah worker — Alim (XI–XII) | `academic-questions-drafts/mad-alim-*.json` | drafting (26 Nov 2026) |
| `CQ-910-###` | CQ worker — Class 9–10 Creative Questions (সৃজনশীল প্রশ্ন) | `academic-questions-drafts/cq-9-10-*.json` | in progress (claimed 26 Nov 2026) |
| `C6M-###`, `C6S-###`, `C7M-###`, `C7S-###`, `C8M-###`, `C8S-###`, `C910M-###`, `C910C-###`, `C910B-###`, `C910P-###`, `C910HM-###` | F — Science/Math depth (Class 6–10) | `academic-questions-drafts/class-*-depth-01.json` | done (383 on disk, 26 Nov 2026) |

## Schema variants (must be normalised before import)

The bank has **three answer-key spellings**. The canonical field is
`correct_index`. `scripts/import-questions.mjs` (Day 3) must accept all three
and write `correct_index`:

| Variant | Files | Answer key | Header | Source field |
|---|---|---|---|---|
| Canonical | most files (A–H, J, L, core, academic) | `correct_index` | `header.status: NEEDS-REVIEW` | `syllabus_source` + `fact_reference` |
| K (DU/GST/RU) | `admission-questions-drafts/du-*.json`, `gst-*.json`, `ru-*.json` (24 files, 500 qs) | `correctOptionIndex` (+ `correctAnswer` text) | **none** — add before import | `source` + `sourceType`; has `isPreviousYear: false`, `isVerified: false`, `subjectSlug`, `unit` |
| I (Bank/Primary) | `job-questions-drafts/bank-i-*.json`, `primary-i-*.json` (9 files, 1000 qs) | `correct_answer_index` (+ `correct_answer` text) | **none** — add before import | `source` |

The checker accepts the two aliases so duplicate/answer checks can run, and
flags each affected file once (33 files at the 26 Nov 00:00 snapshot).

## History (why this file exists)

- **25 Nov — A/B collision:** Workers A and B both used `JOBQ-D001–D800`
  (799 overlapping IDs, two different questions per ID). Fixed 25 Nov: B's
  depth re-IDed to `JOBQ-P/N/M/G` by exam (backup
  `backup-reid-2026-11-26/b-depth-before-reid.tar.gz`).
- **25 Nov — G/H collision (keeper error, corrected):** `bcs-g-*` was wrongly
  re-IDed G→H by the keeper; the parent clarified `JOBQ-G` belongs to Worker G
  and Worker H is separate (`bcs-h-*`). G regenerated with G IDs; H writes
  only `bcs-h-*` (its generator asserts the basename). Verified 26 Nov 00:00:
  G 1000 all `JOBQ-G`, H 1078 all `JOBQ-H`, overlap 0. Closed — no further action.
- **26 Nov — grade 11–20 G→L:** B's grade 11–20 depth (`JOBQ-G291–G441`)
  collided with Worker G's `JOBQ-G`. Re-IDed to `JOBQ-L` (backup
  `backup-reid-2026-11-26/b-grade11-20-before-G-to-L.tar.gz`; 150 IDs;
  `NEAR-DUP-DECISIONS.md` refs updated). L = "eLeven–20". Verified 0 collisions.
- **26 Nov — Bank Keeper registration (Day 3 follow-up):** 244 prefixes
  REGISTERED, 0 re-ID'd — Worker F depth `C7S-###` (38), `C8M-###` (38),
  `C910B-###` (32), `C910P-###` (32) and Worker D 5-digit `ACAD-#####`
  (10000-block, hons set 3, ACAD-10001–10104, 104 qs). All follow the
  established schemes (F: `C<class><subject>`; D: numeric block continuation),
  IDs unique and non-colliding, so registration beat re-ID churn. Verified
  end-to-end by importer dry-run (branch `feature/day3-import-questions`,
  26 Nov ~06:30): 11043 seen, 10621 valid, 422 rejected (360 CQ "bad options"
  — importer is MCQ-only — + 62 real exact duplicates), **0 prefix
  rejections**. Backup `backup-bankkeeper-2026-11-26/`.
