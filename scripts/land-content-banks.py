#!/usr/bin/env python3
"""Landing processor for the 27 Nov 2026 B/C/D content merge (Eduvelto).

Operates ONLY on banks/ inside this repo (the landed copies of the
B-admission reviewed files and the C-job normalised files). It does NOT
touch the sprint drafts, Firestore, or the live site.

What it does, in order:
  1. Applies the C-job fault fixes named in STATUS-C-job-2026-11-27.md:
       - JOBQ-L365, JOBQ-N632, JOBQ-N633, JOBQ-P033: one duplicated wrong
         option replaced with a distinct wrong option (correct answer
         untouched); verdict -> VERIFIED-AFTER-FIX.
       - JOBQ-0251: duplicated correct value '৩/৩' replaced with '৩/৬'
         (the standard add-numerators-and-denominators error); verdict
         -> VERIFIED-AFTER-FIX.
       - JOBQ-R111, JOBQ-R112: NEEDS-FIX verdict was a false positive of
         exact-text matching — the three 'Choose the correct sentence:'
         items have DIFFERENT option sets (different sentences), so they
         are not duplicates (importer GENERIC_STEMS rule agrees);
         verdict -> NEEDS-REVIEW, all three items kept.
       - JOBQ-J813: NOT fixed — '___ cat' needs a new stem (teacher
         decision); stays NEEDS-FIX and is flagged in the report.
       - JOBQ-0310 / JOBQ-0334 (orphan IDs, index-only): flagged only,
         nothing deleted.
  2. Seeded, constrained option shuffle for:
       - Job: the 48 files with shuffle_blocker=true in
         fast-program/C-job/file-position-table.json (1,488 questions).
         The 11 BCS depth files already shuffled on 26 Nov 2026
         (seed 20261126, 230 Qs, now balanced) are NOT re-shuffled.
       - Admission: the 48 files with shuffleRequired=true in the
         B reviewed copies (gst-bangla-01.json is already the most
         balanced file and is skipped).
     "Constrained" = the correct positions in each file are assigned
     as a balanced multiset (each of A/B/C/D floor(n/4) or ceil(n/4)
     times), so every file ends ~25% per position by construction;
     distractors are shuffled randomly in the remaining slots.
     The correct option TEXT is never changed; only its position moves.
  3. Builds the two new academic draft files (Gap #3, 33 MCQ, and
     Madrasa batch 1, 12 items) as NEEDS-REVIEW drafts, renumbered to
     free ACAD-#### IDs (ACAD-8101..8145; no ACAD-81xx exists anywhere
     in the TS pool or the sprint drafts). Original GAP3-*/MADX-* IDs
     are kept in `original_id`. They are NOT added to the verified TS
     pool — NEEDS-REVIEW items must never render as verified.
  4. Verifies every shuffled file (correct text unchanged vs the
     pre-shuffle snapshot, 4 distinct options, correct_index updated)
     and writes banks/shuffle-report.json.

Seed: 'eduvelto-landing-2026-11-27-v1'. Deterministic: re-running on
the ORIGINAL (unshuffled) inputs reproduces the same output. The
script refuses to run twice on already-shuffled outputs (it checks
for the shuffle marker it stamps on each file).

Usage: python3 scripts/land-content-banks.py [--verify-only]
"""

import hashlib
import json
import random
import sys
from collections import Counter
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
BANKS = REPO / "banks"
FAST = Path("/home/hatch/workspace/eduorbit/fast-program")
SEED = "eduvelto-landing-2026-11-27-v1"
DATE = "2026-11-27"

JOB_DIR = BANKS / "job-questions-drafts"
ADM_DIR = BANKS / "admission-questions-drafts"
ACAD_DIR = BANKS / "academic-questions-drafts"

# Already shuffled on 26 Nov 2026 (seed 20261126, 230 Qs) — never re-shuffle.
ALREADY_SHUFFLED_JOB = {
    "bcs-bangla-depth-01.json", "bcs-bangla-depth-02.json",
    "bcs-bangla-depth-03.json", "bcs-english-depth-01.json",
    "bcs-english-depth-02.json", "bcs-english-depth-03.json",
    "bcs-math-depth-01.json", "bcs-math-depth-02.json",
    "bcs-math-depth-03.json", "bcs-mental-ability-depth-01.json",
    "bcs-mental-ability-depth-02.json",
}
# Admission: most balanced file (A 31%, D present) — skip.
SKIP_ADMISSION = {"gst-bangla-01.json"}

# (question id, option index to replace, replacement, note)
DUP_OPTION_FIXES = {
    "JOBQ-L365": (3, "পূরষ্কার",
                  "Duplicated wrong option 'পুরষ্কার' (A and D) — D replaced with distinct misspelling 'পূরষ্কার'."),
    "JOBQ-N632": (2, "Commite",
                  "Duplicated wrong option 'Comittee' (A and C) — C replaced with distinct misspelling 'Commite'."),
    "JOBQ-N633": (3, "Grammaer",
                  "Duplicated wrong option 'Grammer' (A and D) — D replaced with distinct misspelling 'Grammaer'."),
    "JOBQ-P033": (2, "Knifves",
                  "Duplicated wrong option 'Knifes' (A and C) — C replaced with distinct plural form 'Knifves'."),
}
CONTENT_FAULT_FIX = {
    "JOBQ-0251": (3, "৩/৬",
                  "Two correct options: '১' and '৩/৩' are both 1 — '৩/৩' replaced with '৩/৬' (the standard add-numerators-and-denominators error)."),
}
# Verdict reason for the shuffle-blocker NEEDS-FIX items once shuffled.
SHUFFLE_FIXED_REASON = (
    "Answer-position bias fixed by seeded shuffle (landing 27 Nov 2026, seed "
    + SEED + "); options now ~25% per position. Content not yet substantively reviewed."
)


def file_seed(relpath: str) -> int:
    h = hashlib.sha256(f"{SEED}|{relpath}".encode()).digest()
    return int.from_bytes(h[:8], "big")


def answer_key(q: dict) -> str:
    """Canonical answer-index key present on this question."""
    if q.get("correct_index") is not None:
        return "correct_index"
    if q.get("correctOptionIndex") is not None:
        return "correctOptionIndex"
    if q.get("correct_answer_index") is not None:
        return "correct_answer_index"
    raise ValueError(f"no answer key on {q.get('id')}")


def answer_text_key(q: dict) -> str | None:
    for k in ("correct_answer", "correctAnswer", "correct_answer_text"):
        if k in q:
            return k
    return None


def shuffle_questions(questions: list, rng: random.Random) -> None:
    """Constrained shuffle in place. Correct TEXT unchanged; index updated."""
    n = len(questions)
    base, extra = divmod(n, 4)
    targets = []
    for pos in range(4):
        targets += [pos] * (base + (1 if pos < extra else 0))
    rng.shuffle(targets)
    for q, target in zip(questions, targets):
        key = answer_key(q)
        opts = list(q["options"])
        assert len(opts) == 4, f"{q.get('id')}: expected 4 options, got {len(opts)}"
        assert len(set(map(str, opts))) == 4, f"{q.get('id')}: options not distinct before shuffle"
        correct_text = opts[q[key]]
        distractors = [o for i, o in enumerate(opts) if i != q[key]]
        rng.shuffle(distractors)
        new_opts = []
        di = 0
        for pos in range(4):
            if pos == target:
                new_opts.append(correct_text)
            else:
                new_opts.append(distractors[di])
                di += 1
        q["options"] = new_opts
        q[key] = target
        tk = answer_text_key(q)
        if tk:
            q[tk] = correct_text
        q["shuffle_required"] = False


def dist(questions: list) -> dict:
    c = Counter()
    for q in questions:
        c[answer_key(q) and q[answer_key(q)]] += 1
    return {i: c.get(i, 0) for i in range(4)}


def load_json(p: Path):
    return json.loads(p.read_text(encoding="utf-8"))


def dump_json(p: Path, data) -> None:
    p.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def questions_of(data):
    if isinstance(data, list):
        return data, None
    return data.get("questions", []), data


def main() -> int:
    verify_only = "--verify-only" in sys.argv
    report = {
        "seed": SEED, "date": DATE,
        "fixes": [], "flags": [], "shuffled": [], "skipped": [],
        "academic_new": [],
    }

    # ---- 1. C-job fault fixes (on the landed Job copies) -------------
    verdicts = {v["id"]: v for v in load_json(FAST / "C-job" / "review-verdicts.json")}
    job_files = sorted(JOB_DIR.rglob("*.json"))
    by_id = {}
    touched_job_files = {}
    for f in job_files:
        data = load_json(f)
        qs, _ = questions_of(data)
        for q in qs:
            by_id[q["id"]] = (f, q)
        touched_job_files[f] = data

    for qid, (idx, repl, note) in DUP_OPTION_FIXES.items():
        f, q = by_id[qid]
        old = q["options"][idx]
        assert q["options"].count(old) == 2, f"{qid}: expected duplicated option"
        assert old != q.get("correct_answer"), f"{qid}: refusing to replace the correct option"
        q["options"][idx] = repl
        assert len(set(map(str, q["options"]))) == 4, f"{qid}: options still not distinct"
        q["review_verdict"] = "VERIFIED-AFTER-FIX"
        q["review_reason"] = note + " Fix applied 27 Nov 2026 landing; content-team spot-check still recommended."
        q["review_batch"] = "landing-2026-11-27"
        report["fixes"].append({"id": qid, "file": str(f.relative_to(BANKS)),
                                "replaced": old, "with": repl, "note": note})
        print(f"FIX {qid}: {old!r} -> {repl!r} ({f.relative_to(BANKS)})")

    for qid, (idx, repl, note) in CONTENT_FAULT_FIX.items():
        f, q = by_id[qid]
        old = q["options"][idx]
        assert old == "৩/৩", f"{qid}: expected '৩/৩' at index {idx}, got {old!r}"
        assert q.get("correct_answer") == "১", f"{qid}: correct answer changed upstream"
        q["options"][idx] = repl
        assert len(set(map(str, q["options"]))) == 4, f"{qid}: options still not distinct"
        q["review_verdict"] = "VERIFIED-AFTER-FIX"
        q["review_reason"] = note + " Fix applied 27 Nov 2026 landing; content-team spot-check still recommended."
        q["review_batch"] = "landing-2026-11-27"
        report["fixes"].append({"id": qid, "file": str(f.relative_to(BANKS)),
                                "replaced": old, "with": repl, "note": note})
        print(f"FIX {qid}: {old!r} -> {repl!r} ({f.relative_to(BANKS)})")

    # R111/R112: generic-stem false positive — keep items, fix verdict.
    for qid in ("JOBQ-R111", "JOBQ-R112"):
        f, q = by_id[qid]
        q["review_verdict"] = "NEEDS-REVIEW"
        q["review_reason"] = (
            "Shares the generic stem 'Choose the correct sentence:' with JOBQ-R061, but the "
            "option sets differ (different sentences, different correct answers) — not a "
            "duplicate. Importer GENERIC_STEMS rule agrees (same text is a duplicate only "
            "when options also match). Item kept; content not yet substantively reviewed."
        )
        report["fixes"].append({"id": qid, "file": str(f.relative_to(BANKS)),
                                "replaced": None, "with": None,
                                "note": "Verdict NEEDS-FIX -> NEEDS-REVIEW (generic-stem false positive); item kept."})
        print(f"FIX {qid}: verdict NEEDS-FIX -> NEEDS-REVIEW (generic stem, item kept)")

    # J813: flag only.
    f813, q813 = by_id["JOBQ-J813"]
    q813["review_reason"] = (
        "Ambiguous — no context: '___ cat' admits A, An and The as correct. "
        "NOT fixed in this landing: a new stem must come from a teacher (inventing a "
        "sentence is not allowed). Teacher decision owed."
    )
    # Persist all section-1 edits (fixes + verdict/reason changes) before
    # section 2 reloads the files for shuffling.
    for f, data in touched_job_files.items():
        qs, _ = questions_of(data)
        if any(q["id"] in {**DUP_OPTION_FIXES, **CONTENT_FAULT_FIX, "JOBQ-R111": None,
                           "JOBQ-R112": None, "JOBQ-J813": None} for q in qs):
            dump_json(f, data)
    report["flags"].append({"id": "JOBQ-J813",
                            "reason": "Ambiguous stem ('___ cat'); needs a teacher-supplied stem; left NEEDS-FIX."})
    for orphan in ("JOBQ-0310", "JOBQ-0334"):
        assert orphan not in by_id, f"{orphan} unexpectedly present in bank files"
        report["flags"].append({"id": orphan,
                                "reason": "Orphan ID: listed in shared-bank-index.json only, no options in any bank file. Flagged only; nothing deleted."})
    print("FLAG JOBQ-J813 (ambiguous stem — teacher decision owed)")
    print("FLAG JOBQ-0310, JOBQ-0334 (orphan IDs — index-only, nothing deleted)")

    # ---- 2. Seeded shuffle -------------------------------------------
    pos_table = load_json(FAST / "C-job" / "file-position-table.json")
    job_targets = {}
    for rel, v in pos_table.items():
        if v.get("shuffle_blocker"):
            job_targets[rel] = v
    assert len(job_targets) == 48, f"expected 48 Job blocker files, got {len(job_targets)}"
    total_blocker_qs = sum(v["n"] for v in job_targets.values())
    assert total_blocker_qs == 1488, f"expected 1488 blocker Qs, got {total_blocker_qs}"

    # Snapshot pre-shuffle correct texts for verification.
    pre_texts = {}
    for f in job_files:
        data = load_json(f)
        qs, _ = questions_of(data)
        for q in qs:
            pre_texts[q["id"]] = str(q["options"][q["correct_index"]])

    shuffled_job = 0
    for rel, v in sorted(job_targets.items()):
        # Table keys are paths relative to the bank root (e.g.
        # 'bank/bank-bangla-grammar-and-language.json' or a bare name).
        matches = [f for f in job_files if str(f.relative_to(JOB_DIR)) == rel]
        assert len(matches) == 1, f"{rel}: found {len(matches)} matches in banks/"
        f = matches[0]
        assert rel not in ALREADY_SHUFFLED_JOB, f"{rel}: already-shuffled file in target list"
        data = load_json(f)
        qs, _ = questions_of(data)
        assert len(qs) == v["n"], f"{rel}: {len(qs)} Qs, table says {v['n']}"
        if any(isinstance(q, dict) and q.get("_landing_shuffled") for q in qs):
            raise SystemExit(f"{rel}: already shuffled by this landing — refusing to re-shuffle")
        before = dist(qs)
        rng = random.Random(file_seed(f"job/{rel}"))
        shuffle_questions(qs, rng)
        after = dist(qs)
        # Shuffle-blocker NEEDS-FIX -> NEEDS-REVIEW (bias fixed, content unreviewed).
        n_converted = 0
        for q in qs:
            q["_landing_shuffled"] = SEED
            if q.get("review_verdict") == "NEEDS-FIX" and str(q.get("review_reason", "")).startswith("Answer-position bias"):
                q["review_verdict"] = "NEEDS-REVIEW"
                q["review_reason"] = SHUFFLE_FIXED_REASON
                n_converted += 1
        dump_json(f, data)
        shuffled_job += len(qs)
        report["shuffled"].append({"file": f"job-questions-drafts/{f.relative_to(JOB_DIR)}",
                                   "n": len(qs), "before": before, "after": after,
                                   "needs_fix_to_needs_review": n_converted})
        print(f"SHUFFLE job {rel}: n={len(qs)} before={before} after={after} converted={n_converted}")

    for name in sorted(ALREADY_SHUFFLED_JOB):
        matches = [f for f in job_files if f.name == name]
        assert len(matches) == 1
        data = load_json(matches[0])
        qs, _ = questions_of(data)
        report["skipped"].append({"file": f"job-questions-drafts/{matches[0].relative_to(JOB_DIR)}",
                                  "n": len(qs), "after": dist(qs),
                                  "reason": "Already shuffled 26 Nov 2026 (seed 20261126) — not re-shuffled."})
    print(f"Job shuffled total: {shuffled_job} Qs in 48 files")

    # Admission: 48 files with shuffleRequired=true.
    adm_files = sorted(ADM_DIR.glob("*.json"))
    adm_targets = []
    for f in adm_files:
        data = load_json(f)
        if data.get("shuffleRequired") is True:
            adm_targets.append(f)
    assert len(adm_targets) == 48, f"expected 48 Admission shuffle files, got {len(adm_targets)}"
    pre_texts_adm = {}
    for f in adm_files:
        data = load_json(f)
        qs, _ = questions_of(data)
        for q in qs:
            k = answer_key(q)
            pre_texts_adm[q["id"]] = str(q["options"][q[k]])
    shuffled_adm = 0
    for f in adm_targets:
        data = load_json(f)
        qs, _ = questions_of(data)
        if data.get("_landing_shuffled"):
            raise SystemExit(f"{f.name}: already shuffled by this landing — refusing to re-shuffle")
        before = dist(qs)
        rng = random.Random(file_seed(f"admission/{f.name}"))
        shuffle_questions(qs, rng)
        after = dist(qs)
        data["shuffleRequired"] = False
        data["shuffleSeed"] = SEED
        data["shuffledDate"] = DATE
        data["_landing_shuffled"] = SEED
        dump_json(f, data)
        shuffled_adm += len(qs)
        report["shuffled"].append({"file": f"admission-questions-drafts/{f.name}",
                                   "n": len(qs), "before": before, "after": after,
                                   "needs_fix_to_needs_review": 0})
        print(f"SHUFFLE adm {f.name}: n={len(qs)} before={before} after={after}")
    skip_f = ADM_DIR / "gst-bangla-01.json"
    data = load_json(skip_f)
    qs, _ = questions_of(data)
    report["skipped"].append({"file": "admission-questions-drafts/gst-bangla-01.json",
                              "n": len(qs), "after": dist(qs),
                              "reason": "shuffleRequired=false in B review (most balanced file, A 31%, D present) — not shuffled."})
    print(f"Admission shuffled total: {shuffled_adm} Qs in 48 files")

    # ---- 3. Academic new drafts (Gap #3 + Madrasa batch 1) ------------
    def build_academic(src_name, items, start_id, header_subject, header_level):
        qs = []
        for i, q in enumerate(items):
            new_id = f"ACAD-{start_id + i:04d}"
            nq = dict(q)
            nq["original_id"] = q["id"]
            nq["id"] = new_id
            nq["status"] = "NEEDS-REVIEW"
            nq["review_verdict"] = "NEEDS-REVIEW"
            nq["review_reason"] = (
                "Landing 27 Nov 2026 — NEEDS-REVIEW; teacher review required before any use. "
                "Not verified; NOT in the verified TS pool."
            )
            qs.append(nq)
        doc = {
            "header": {
                "status": "NEEDS-REVIEW — DRAFT ONLY. Not verified, not published, not imported.",
                "level": header_level,
                "subject": header_subject,
                "question_count": len(qs),
                "rule": "NCTB-first: every question cites its NCTB book lesson; no invented questions, graphs, or sources.",
                "source": "Worker D (CONTENT GAPS), 27 Nov 2026 — see fast-program/D-content/.",
            },
            "questions": qs,
        }
        out = ACAD_DIR / src_name
        dump_json(out, doc)
        return out, qs

    gap3 = load_json(FAST / "D-content" / "gap3-written-types-class9.json")
    assert len(gap3) == 33
    out, qs = build_academic("gap3-written-types-class9.json", gap3, 8101,
                             "Bangla 2nd Paper / English 2nd Paper (written types)",
                             "Class 9-10")
    report["academic_new"].append({"file": "academic-questions-drafts/gap3-written-types-class9.json",
                                   "n": 33, "ids": "ACAD-8101..ACAD-8133",
                                   "distribution": dist(qs),
                                   "note": "Already balanced (A 8 / B 9 / C 8 / D 8) — no shuffle applied."})
    print("ACADEMIC gap3 -> ACAD-8101..8133 (33, NEEDS-REVIEW)")

    mad1 = load_json(FAST / "D-content" / "madrasa-expansion-batch1.json")
    assert len(mad1) == 12
    out, qs = build_academic("madrasa-batch1-dakhil-arabic.json", mad1, 8134,
                             "Arabic (Ittisaliyyah), Dakhil 9-10",
                             "Dakhil 9-10")
    report["academic_new"].append({"file": "academic-questions-drafts/madrasa-batch1-dakhil-arabic.json",
                                   "n": 12, "ids": "ACAD-8134..ACAD-8145",
                                   "distribution": dist(qs),
                                   "note": "Already balanced (3 per position) — no shuffle applied."})
    print("ACADEMIC madrasa batch1 -> ACAD-8134..8145 (12, NEEDS-REVIEW)")

    # ---- 4. Verification ----------------------------------------------
    errors = []
    # Job: correct text unchanged vs pre-shuffle snapshot; 4 distinct options.
    for f in job_files:
        data = load_json(f)
        qs, _ = questions_of(data)
        for q in qs:
            opts = q["options"]
            if len(opts) != 4 or len(set(map(str, opts))) != 4:
                errors.append(f"{q['id']}: options not 4 distinct")
            if str(opts[q["correct_index"]]) != pre_texts[q["id"]]:
                errors.append(f"{q['id']}: correct TEXT changed by shuffle!")
    for f in adm_files:
        data = load_json(f)
        qs, _ = questions_of(data)
        for q in qs:
            opts = q["options"]
            if len(opts) != 4 or len(set(map(str, opts))) != 4:
                errors.append(f"{q['id']}: options not 4 distinct")
            k = answer_key(q)
            if str(opts[q[k]]) != pre_texts_adm[q["id"]]:
                errors.append(f"{q['id']}: correct TEXT changed by shuffle!")
    # Per-file balance check on shuffled files.
    for entry in report["shuffled"]:
        n, after = entry["n"], entry["after"]
        for pos in range(4):
            if abs(after[pos] - n / 4) > 1:
                errors.append(f"{entry['file']}: position {pos} = {after[pos]} of {n} (off by >1)")
    # ID uniqueness across the landed banks.
    seen = {}
    for f in list(job_files) + adm_files + list(ACAD_DIR.glob("*.json")):
        data = load_json(f)
        qs, _ = questions_of(data)
        for q in qs:
            if q["id"] in seen:
                errors.append(f"duplicate ID {q['id']} in {f} and {seen[q['id']]}")
            seen[q["id"]] = str(f.relative_to(BANKS))
    report["verification"] = {"errors": errors, "total_ids": len(seen)}
    dump_json(BANKS / "shuffle-report.json", report)
    if errors:
        print(f"VERIFICATION FAILED ({len(errors)} errors):")
        for e in errors[:20]:
            print("  -", e)
        return 1
    print(f"VERIFICATION PASSED: {len(seen)} unique IDs; "
          f"{shuffled_job} Job + {shuffled_adm} Admission questions shuffled; "
          f"0 correct texts changed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
