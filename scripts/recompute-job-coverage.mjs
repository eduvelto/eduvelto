#!/usr/bin/env node
/**
 * Eduvelto Job Preparation — recompute the syllabus coverage
 * matrix (jobBankCoverage) from a backup JSON.
 *
 * LOCAL + DRY-RUN ONLY. Reads ~/workspace/eduorbit/backups/
 * eduvelto-backup-20261124-014508.json (or --backup <path>),
 * computes per exam-subject rows with the same rules as
 * computeCoverage in src/lib/jobBankStats.ts, and writes a report
 * JSON to ~/workspace/eduorbit/job-prep-system-evidence/.
 * It NEVER writes to Firestore — the admin applies the rows after
 * review (the migration/import script is prepared, not run).
 *
 * Verified topic lists come from --topics <json>:
 *   { "english": ["topic-id", ...], ... }
 * A subject WITHOUT a verified topic list gets coveragePct: null
 * (undefined, not 0 — same rule as jobBankStats §7.2). English
 * is the only subject with a verified list (13 topics, owner
 * verified 24 Nov 2026); every other subject is absent until a
 * verified teacher supplies its list.
 *
 * Usage:
 *   node scripts/recompute-job-coverage.mjs [--backup <path>] [--topics <json>] [--out <path>]
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const backupPath = resolve(
  flag('--backup', '/home/hatch/workspace/eduorbit/backups/eduvelto-backup-20261124-014508.json'),
);
const topicsPath = flag('--topics', null);
const outPath = resolve(
  flag(
    '--out',
    `/home/hatch/workspace/eduorbit/job-prep-system-evidence/recompute-job-coverage-${new Date().toISOString().slice(0, 10)}.json`,
  ),
);

const backup = JSON.parse(readFileSync(backupPath, 'utf8'));
/** The backup stores collections as a LIST of docs (each with an
 * `id` field), not a map — and the 35 live jobQuestions are the
 * v1 shape: `examSlug` (single exam), `subjectId` like
 * 'bcs__english' (exam-prefixed), `reviewStatus: 'Published'`.
 * The v2 central-bank shape (examMappings + verificationStatus)
 * is accepted too, so the script stays correct after the v2
 * migration lands. */
const asList = (value) => (Array.isArray(value) ? value : Object.values(value ?? {}));
const questions = asList(backup.data?.jobQuestions);
const verifiedTopics = topicsPath ? JSON.parse(readFileSync(resolve(topicsPath), 'utf8')) : {};

const canonicalSubject = (examId, subjectId) => {
  if (typeof subjectId !== 'string') return 'unknown';
  const prefix = `${examId}__`;
  return subjectId.startsWith(prefix) ? subjectId.slice(prefix.length) : subjectId;
};
const statusOf = (q) => {
  if (typeof q.verificationStatus === 'string') return q.verificationStatus;
  if (q.reviewStatus === 'Published' || q.status === 'published') return 'verified';
  if (q.reviewStatus === 'Under Review') return 'reviewed';
  return 'draft';
};

// Group by exam × subject.
const cells = new Map();
for (const q of questions) {
  const examId = typeof q.examSlug === 'string' ? q.examSlug : null;
  const mappings = Array.isArray(q.examMappings) ? q.examMappings : examId !== null ? [examId] : [];
  const subjectId = canonicalSubject(examId ?? '', q.subjectId);
  for (const exam of mappings) {
    const key = `${exam}__${subjectId}`;
    const cell = cells.get(key) ?? { examId: exam, subjectId, target: 50, verified: 0, reviewed: 0, draft: 0, perTopic: new Map() };
    const status = statusOf(q);
    if (status === 'verified') cell.verified++;
    else if (status === 'reviewed') cell.reviewed++;
    else cell.draft++;
    if (status === 'verified' && typeof q.topicId === 'string') {
      cell.perTopic.set(q.topicId, (cell.perTopic.get(q.topicId) ?? 0) + 1);
    }
    cells.set(key, cell);
  }
}

const rows = [];
for (const cell of cells.values()) {
  const topics = Array.isArray(verifiedTopics[cell.subjectId]) ? verifiedTopics[cell.subjectId] : null;
  const hasList = topics !== null;
  const missingTopics = [];
  const thinTopics = [];
  let coveragePct = null;
  if (hasList) {
    let covered = 0;
    for (const topicId of topics) {
      const n = cell.perTopic.get(topicId) ?? 0;
      if (n === 0) missingTopics.push(topicId);
      else {
        covered++;
        if (n <= 2) thinTopics.push(topicId);
      }
    }
    coveragePct = topics.length > 0 ? Math.round((covered / topics.length) * 1000) / 10 : null;
  }
  rows.push({
    examId: cell.examId,
    subjectId: cell.subjectId,
    target: cell.target,
    verified: cell.verified,
    reviewed: cell.reviewed,
    draft: cell.draft,
    coveragePct,
    missingTopics,
    thinTopics,
    hasVerifiedTopicList: hasList,
    lastCalculated: new Date().toISOString(),
  });
}

rows.sort((a, b) => (a.coveragePct ?? -1) - (b.coveragePct ?? -1) || a.examId.localeCompare(b.examId) || a.subjectId.localeCompare(b.subjectId));

const report = {
  generatedAt: new Date().toISOString(),
  backup: backupPath,
  source: 'dry-run from backup JSON — NOT written to Firestore',
  questionsRead: questions.length,
  rows: rows.length,
  rows,
};
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(report, null, 2));

console.log(`questions: ${questions.length} · cells: ${rows.length}`);
for (const r of rows) {
  console.log(
    `${r.examId}/${r.subjectId}: verified ${r.verified} reviewed ${r.reviewed} draft ${r.draft} · coverage ${r.coveragePct === null ? 'null (no verified topic list)' : `${r.coveragePct}%`} · missing ${r.missingTopics.length} · thin ${r.thinTopics.length}`,
  );
}
console.log(`report: ${outPath}`);
