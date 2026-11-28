// Eduvelto — Free Quiz engine (owner order 28 Nov 2026, quiz +
// certificate batch).
//
// PUBLIC, login-free, zero Firestore reads/writes: every question
// comes from a bundled static VERIFIED pool — never from the
// NEEDS-REVIEW master-bank drafts (sprint-1week-2026-11-25, whose
// BANK-INDEX.md says every draft is unverified) and never invented.
// Each attempt shuffles its category pool and takes 10 UNIQUE
// questions, so no two attempts show the same set.
//
// Category pools (all with a correct answer + an explanation):
//   - General Knowledge: 89 verified Academic BGS questions
//     (Bangladesh & Global Studies, NCTB-verified, Classes 6–9).
//   - BCS: 35 owner-verified BCS English questions
//     (bcs-english-batch1, published 22 Nov 2026).
//   - English: 95 verified Academic English questions
//     (Classes 6–8 and 11, NCTB-verified).
//   - Islamic knowledge: 90 verified Academic Islam questions
//     (Classes 6–9, NCTB-verified).
// A category with no verified questions is left out by
// FREE_QUIZ_CATEGORIES (it is derived from the pools, so a pool of
// zero simply has no entry) — nothing is ever invented to fill one.
//
// The certificate verify payload is self-contained: the QR / link
// carries the certificate data in the URL (?d= base64url JSON).
// There is NO server record — the verify page checks the data
// carried in the link and never claims a server lookup.

import { PUBLIC_ACADEMIC_BGS_QUESTIONS } from './publicAcademicBgs';
import { PUBLIC_ACADEMIC_ENGLISH_QUESTIONS } from './publicAcademicEnglish';
import { PUBLIC_ACADEMIC_ISLAM_QUESTIONS } from './publicAcademicIslam';
import {
  PUBLIC_BCS_ENGLISH_QUESTIONS,
  PUBLIC_BCS_READING_PASSAGE,
  type PublicBcsQuestion,
} from './publicBcsEnglish';
import type { PublicAcademicQuestion } from './publicAcademic';

export type FreeQuizCategoryId = 'gk' | 'bcs' | 'english' | 'islamic';
export type FreeQuizCategorySelection = FreeQuizCategoryId | 'all';

export interface FreeQuizQuestion {
  id: string;
  category: FreeQuizCategoryId;
  questionText: string;
  options: Array<{ letter: 'A' | 'B' | 'C' | 'D'; text: string }>;
  correctLetter: 'A' | 'B' | 'C' | 'D';
  /** Empty only when the bank has none — the UI then shows just the correct answer. */
  explanation: string;
  /** Reading-passage text, only for the 3 BCS reading questions. */
  passage?: string;
}

export const FREE_QUIZ_COUNT = 10;
/** 5-minute countdown per attempt. */
export const FREE_QUIZ_TIME_LIMIT_SECONDS = 300;

function fromAcademic(
  q: PublicAcademicQuestion,
  category: FreeQuizCategoryId,
): FreeQuizQuestion {
  return {
    id: q.id,
    category,
    questionText: q.questionText,
    options: q.options,
    correctLetter: q.correctLetter,
    explanation: q.explanation ?? '',
  };
}

function fromBcs(q: PublicBcsQuestion): FreeQuizQuestion {
  return {
    id: q.id,
    category: 'bcs',
    questionText: q.questionText,
    options: q.options,
    correctLetter: q.correctLetter,
    explanation: q.explanation ?? '',
    passage:
      q.topic === 'reading' ? PUBLIC_BCS_READING_PASSAGE.text : undefined,
  };
}

export const FREE_QUIZ_POOLS: Record<FreeQuizCategoryId, FreeQuizQuestion[]> = {
  gk: PUBLIC_ACADEMIC_BGS_QUESTIONS.map((q) => fromAcademic(q, 'gk')),
  bcs: PUBLIC_BCS_ENGLISH_QUESTIONS.map(fromBcs),
  english: PUBLIC_ACADEMIC_ENGLISH_QUESTIONS.map((q) =>
    fromAcademic(q, 'english'),
  ),
  islamic: PUBLIC_ACADEMIC_ISLAM_QUESTIONS.map((q) =>
    fromAcademic(q, 'islamic'),
  ),
};

/** All verified free-quiz questions across categories. */
export const FREE_QUIZ_ALL_QUESTIONS: FreeQuizQuestion[] = [
  ...FREE_QUIZ_POOLS.gk,
  ...FREE_QUIZ_POOLS.bcs,
  ...FREE_QUIZ_POOLS.english,
  ...FREE_QUIZ_POOLS.islamic,
];

export interface FreeQuizCategory {
  id: FreeQuizCategoryId;
  nameBn: string;
  nameEn: string;
  sourceBn: string;
  sourceEn: string;
  count: number;
}

/** Categories are derived from the pools — a category with zero
 *  verified questions has no entry and is never offered. */
const ALL_FREE_QUIZ_CATEGORIES: FreeQuizCategory[] = [
  {
    id: 'gk',
    nameBn: 'সাধারণ জ্ঞান',
    nameEn: 'General Knowledge',
    sourceBn: 'বাংলাদেশ ও বিশ্বপরিচয় — NCTB-যাচাইকৃত ৮৯টি প্রশ্ন',
    sourceEn: 'Bangladesh & Global Studies — 89 NCTB-verified questions',
    count: FREE_QUIZ_POOLS.gk.length,
  },
  {
    id: 'bcs',
    nameBn: 'বিসিএস (ইংরেজি)',
    nameEn: 'BCS (English)',
    sourceBn: 'যাচাইকৃত বিসিএস ইংরেজি ব্যাচ — ৩৫টি প্রশ্ন',
    sourceEn: 'Verified BCS English batch — 35 questions',
    count: FREE_QUIZ_POOLS.bcs.length,
  },
  {
    id: 'english',
    nameBn: 'ইংরেজি',
    nameEn: 'English',
    sourceBn: 'একাডেমিক ইংরেজি — NCTB-যাচাইকৃত ৯৫টি প্রশ্ন',
    sourceEn: 'Academic English — 95 NCTB-verified questions',
    count: FREE_QUIZ_POOLS.english.length,
  },
  {
    id: 'islamic',
    nameBn: 'ইসলামিক জ্ঞান',
    nameEn: 'Islamic Knowledge',
    sourceBn: 'ইসলাম শিক্ষা — NCTB-যাচাইকৃত ৯০টি প্রশ্ন',
    sourceEn: 'Islamic Studies — 90 NCTB-verified questions',
    count: FREE_QUIZ_POOLS.islamic.length,
  },
];

export const FREE_QUIZ_CATEGORIES: FreeQuizCategory[] =
  ALL_FREE_QUIZ_CATEGORIES.filter((c) => c.count > 0);

export function freeQuizPoolFor(
  selection: FreeQuizCategorySelection,
): FreeQuizQuestion[] {
  if (selection === 'all') return FREE_QUIZ_ALL_QUESTIONS;
  return FREE_QUIZ_POOLS[selection] ?? [];
}

export function freeQuizCategoryName(
  selection: FreeQuizCategorySelection,
): { bn: string; en: string } {
  if (selection === 'all')
    return { bn: 'সব বিভাগ মিলিয়ে', en: 'All categories mixed' };
  const c = FREE_QUIZ_CATEGORIES.find((x) => x.id === selection);
  return c
    ? { bn: c.nameBn, en: c.nameEn }
    : { bn: 'কুইজ', en: 'Quiz' };
}

/**
 * 10 UNIQUE questions from the selection's pool, shuffled with the
 * supplied random source (default Math.random — a fresh shuffle per
 * attempt, so two attempts show different sets). Throws when the
 * pool holds fewer than 10 verified questions.
 */
export function selectFreeQuizQuestions(
  selection: FreeQuizCategorySelection,
  count: number = FREE_QUIZ_COUNT,
  rand: () => number = Math.random,
): FreeQuizQuestion[] {
  const pool = freeQuizPoolFor(selection);
  if (pool.length < count) {
    throw new Error(
      `free quiz pool for '${selection}' has ${pool.length} verified questions, needs ${count}`,
    );
  }
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}

// ---------------------------------------------------------------------------
// Certificate verification ID + self-contained verify payload.
// ---------------------------------------------------------------------------

export const VERIFY_ID_PATTERN = /^EDU-2026-\d{4}$/;

/** Unique verification ID, e.g. EDU-2026-4821 (random client-side). */
export function makeVerificationId(rand: () => number = Math.random): string {
  const n = 1000 + Math.floor(rand() * 9000);
  return `EDU-2026-${n}`;
}

export interface CertificatePayload {
  v: 1;
  /** Verification ID, must match the :id in the URL path. */
  id: string;
  /** Recipient name, exactly as typed. */
  n: string;
  /** Quiz name. */
  q: string;
  /** Score out of 10. */
  s: number;
  /** ISO date (YYYY-MM-DD). */
  d: string;
}

function base64UrlEncode(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(raw: string): string {
  const padded = raw.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(padded);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/** Encode a certificate payload for the ?d= URL parameter. */
export function encodeCertificatePayload(p: CertificatePayload): string {
  return base64UrlEncode(JSON.stringify(p));
}

/**
 * Decode + validate a ?d= payload against the :id path param.
 * Returns null for a missing, malformed, or mismatched payload —
 * the verify page then shows its on-page "could not be verified"
 * state (never a 404).
 */
export function decodeCertificatePayload(
  raw: string | null,
  id: string,
): CertificatePayload | null {
  if (!raw || !VERIFY_ID_PATTERN.test(id)) return null;
  try {
    const parsed: unknown = JSON.parse(base64UrlDecode(raw));
    if (typeof parsed !== 'object' || parsed === null) return null;
    const p = parsed as Record<string, unknown>;
    if (p.v !== 1 || p.id !== id) return null;
    if (typeof p.n !== 'string' || p.n.trim().length === 0 || p.n.length > 100)
      return null;
    if (typeof p.q !== 'string' || p.q.trim().length === 0 || p.q.length > 120)
      return null;
    if (
      typeof p.s !== 'number' ||
      !Number.isInteger(p.s) ||
      p.s < 0 ||
      p.s > FREE_QUIZ_COUNT
    )
      return null;
    if (typeof p.d !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(p.d)) return null;
    return { v: 1, id, n: p.n, q: p.q, s: p.s, d: p.d };
  } catch {
    return null;
  }
}

/** Full verify URL for a certificate (the QR code encodes this). */
export function buildVerifyUrl(
  payload: CertificatePayload,
  origin = 'https://eduvelto.com',
): string {
  return `${origin}/verify/${payload.id}?d=${encodeCertificatePayload(payload)}`;
}
