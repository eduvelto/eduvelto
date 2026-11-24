#!/usr/bin/env node
/**
 * Eduvelto Job Preparation — recompute topic analytics
 * (topicAnalytics) from a backup JSON.
 *
 * LOCAL + DRY-RUN ONLY. Reads the backup JSON (or --backup
 * <path>), computes per-topic Frequency (Ft) and Recency (Rt)
 * from historicalQuestions + jobQuestions, and writes a report
 * JSON to ~/workspace/eduorbit/job-prep-system-evidence/.
 * It NEVER writes to Firestore.
 *
 * P = 0.35F + 0.25R + 0.25S + 0.15C (design §4.5) is computed
 * ONLY when all four inputs exist. S (syllabus weight) comes
 * from --syllabus <json> ({ examId: { topicId: 0–100 } }); C
 * (coverage) comes from --coverage <json> (the recompute-job-
 * coverage report). Without them, the report shows Ft and Rt
 * and marks P as "not computable" — never a guessed number.
 * A P value is a Preparation Priority Score, NEVER a probability
 * ("88/100 is never an 88% chance"). Every exam starts at
 * evidence Level C until real previous-year data exists.
 *
 * Usage:
 *   node scripts/recompute-topic-analytics.mjs [--backup <path>] [--syllabus <json>] [--coverage <json>] [--out <path>]
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const backupPath = resolve(
  flag('--backup', '/home/hatch/workspace/eduorbit/backups/eduvelto-backup-20261124-014508.json'),
);
const syllabusPath = flag('--syllabus', null);
const coveragePath = flag('--coverage', null);
const outPath = resolve(
  flag(
    '--out',
    `/home/hatch/workspace/eduorbit/job-prep-system-evidence/recompute-topic-analytics-${new Date().toISOString().slice(0, 10)}.json`,
  ),
);

const backup = JSON.parse(readFileSync(backupPath, 'utf8'));
/** Backup shape (see recompute-job-coverage.mjs): collections
 * are LISTS of docs; the live jobQuestions are v1
 * (`examSlug`, `subjectId: 'bcs__english'`, `reviewStatus`).
 * The v2 shape (examMappings + verificationStatus) is accepted
 * too. Historical records link by questionId; the topic comes
 * from the linked central question when the record itself has
 * no topicId. */
const asList = (value) => (Array.isArray(value) ? value : Object.values(value ?? {}));
const historical = asList(backup.data?.historicalQuestions);
const questions = asList(backup.data?.jobQuestions);
const syllabus = syllabusPath ? JSON.parse(readFileSync(resolve(syllabusPath), 'utf8')) : {};
const coverage = coveragePath ? JSON.parse(readFileSync(resolve(coveragePath), 'utf8')) : null;

const canonicalSubject = (examId, subjectId) => {
  if (typeof subjectId !== 'string') return 'unknown';
  const prefix = `${examId}__`;
  return subjectId.startsWith(prefix) ? subjectId.slice(prefix.length) : subjectId;
};
const questionById = new Map();
for (const q of questions) {
  if (typeof q.id === 'string') questionById.set(q.id, q);
  if (typeof q.questionId === 'string') questionById.set(q.questionId, q);
}
const examOf = (q) => {
  if (Array.isArray(q.examMappings)) return q.examMappings;
  return typeof q.examSlug === 'string' ? [q.examSlug] : [];
};

const currentYear = new Date().getFullYear();
// Frequency: appearances per (exam, topic) across verified
// historical records; Recency: years since the most recent
// appearance (0 = this year, capped at 10 for the 0–100 scale).
const stats = new Map();
const note = (examId, topicId) => {
  const key = `${examId}__${topicId}`;
  const entry = stats.get(key) ?? { examId, topicId, appearances: 0, lastYear: null };
  stats.set(key, entry);
  return entry;
};
for (const h of historical) {
  if (h.verificationStatus !== 'Verified') continue;
  const linked = typeof h.questionId === 'string' ? questionById.get(h.questionId) : undefined;
  const examId = typeof h.examId === 'string' ? h.examId : linked ? examOf(linked)[0] ?? '' : '';
  const topicId = typeof h.topicId === 'string' ? h.topicId : linked?.topicId ?? '';
  if (examId === '' || topicId === '') continue;
  const entry = note(examId, topicId);
  entry.appearances++;
  if (typeof h.examYear === 'number' && (entry.lastYear === null || h.examYear > entry.lastYear)) {
    entry.lastYear = h.examYear;
  }
}
// Topics that exist in the bank but have no historical record yet
// still appear (Ft = 0, Rt = 0) — Level C, syllabus-based only.
for (const q of questions) {
  for (const examId of examOf(q)) {
    note(String(examId), String(q.topicId ?? ''));
  }
}

const coverageByKey = new Map();
if (coverage?.rows) {
  for (const row of coverage.rows) {
    coverageByKey.set(`${row.examId}__${row.subjectId}`, row.coveragePct);
  }
}

const rows = [];
for (const entry of stats.values()) {
  const f = Math.min(100, entry.appearances * 20); // 5 appearances = 100
  const r = entry.lastYear === null ? 0 : Math.max(0, 100 - (currentYear - entry.lastYear) * 10);
  const s = syllabus[entry.examId]?.[entry.topicId] ?? null;
  // C is per-SUBJECT coverage (the coverage report's rows are
  // exam/subject); the topic's subject is the second '__' segment
  // of its topicId ('bcs__english__grammar__tense' → 'english').
  const topicSubject = entry.topicId.split('__')[1] ?? '';
  const c = coverageByKey.get(`${entry.examId}__${topicSubject}`) ?? null;
  const computable = s !== null && c !== null;
  const p = computable ? Math.round((0.35 * f + 0.25 * r + 0.25 * s + 0.15 * c) * 10) / 10 : null;
  rows.push({
    examId: entry.examId,
    topicId: entry.topicId,
    appearances: entry.appearances,
    lastYear: entry.lastYear,
    f,
    r,
    s,
    c,
    p,
    evidenceLevel: entry.appearances >= 3 ? 'A' : entry.appearances >= 1 ? 'B' : 'C',
    pNote: computable ? 'P = 0.35F + 0.25R + 0.25S + 0.15C — a priority score, never a probability' : 'P not computable — syllabus weight (S) and/or coverage (C) missing',
  });
}

rows.sort((a, b) => (b.p ?? -1) - (a.p ?? -1) || b.appearances - a.appearances);

const report = {
  generatedAt: new Date().toISOString(),
  backup: backupPath,
  source: 'dry-run from backup JSON — NOT written to Firestore',
  historicalVerified: historical.filter((h) => h.verificationStatus === 'Verified').length,
  topics: rows.length,
  rows,
};
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(report, null, 2));

console.log(`historical verified: ${report.historicalVerified} · topics: ${rows.length}`);
for (const r of rows.slice(0, 20)) {
  console.log(`${r.examId}/${r.topicId}: F=${r.f} R=${r.r} S=${r.s ?? '—'} C=${r.c ?? '—'} P=${r.p ?? 'not computable'} · Level ${r.evidenceLevel}`);
}
console.log(`report: ${outPath}`);
