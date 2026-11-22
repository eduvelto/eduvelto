/**
 * NU admission — question-bank flow (NU-7; design §11, §15 NU-7,
 * §19.2.4–§19.2.6, §19.6).
 *
 * Firestore I/O for the draft → review → publish pipeline. Every
 * step re-checks the same conditions the rules enforce, so a
 * denied write fails here with a Bangla-coded error before it
 * reaches Firestore (the rules are the final word — these checks
 * are the friendly first word).
 *
 * Role model (the rules mirror it):
 * - author: Owner, Admin, or a VERIFIED teacher
 *   (profile.role == 'teacher' AND verificationStatus == 'verified').
 *   A pending/rejected teacher, a student, a guardian, or a
 *   signed-out visitor can NEVER create a question.
 * - reviewer: Owner, Admin, or a verified teacher who is NOT the
 *   question's author.
 * - publish / withdraw: Owner / Admin only.
 * - the correct answer lives ONLY in `nuQuestionDraftKeys` until a
 *   bundle is built; it is never written into `nuQuestions` and
 *   never sent to a student.
 *
 * Audit trail: review decisions live in `nuReviews` (append-only);
 * publish / withdraw live in `nuPublications` (append-only) AND in
 * `adminActions` (actions 'nu-question-published' /
 * 'nu-question-withdrawn' — added to the rules enum in NU-7).
 * Status changes themselves are the record for submit / claim.
 *
 * The bank starts EMPTY (0 questions, 0 verified teachers — NU-Q4).
 * Nothing here invents a question or a teacher.
 */
import {
  addDoc,
  collection,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Firestore,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import { NU_CIRCULAR_VERSION } from './nuExamConfig';
import { isNuGroupSlug } from './nuProfile';
import type { UserProfile } from './profile';
import {
  buildNuQuestionBundle,
  buildNuQuestionKeys,
  canTransitionQuestion,
  findNuDuplicateCandidates,
  newNuQuestionVersion,
  nuMockBundleConfigSnapshot,
  nuTopicBundleConfigSnapshot,
  publishGateCheck,
  validateNuQuestionDoc,
  validateNuQuestionDraftKey,
  validateNuReviewDoc,
  type NuQuestionBundleDoc,
  type NuQuestionDoc,
  type NuQuestionKeyDoc,
  type NuQuestionStatus,
  type NuReviewDecision,
} from './nuQuestions';

// ---------------------------------------------------------------------------
// Roles (UI-level mirror of the rules helpers)
// ---------------------------------------------------------------------------

export function isNuAdminProfile(profile: UserProfile | null | undefined): boolean {
  return profile?.role === 'owner' || profile?.role === 'admin';
}

/** A teacher counts as verified ONLY while verificationStatus is
 * 'verified' right now — the rules check the same current value
 * (§19.3.2 isVerifiedTeacher). */
export function isVerifiedTeacherProfile(profile: UserProfile | null | undefined): boolean {
  return profile?.role === 'teacher' && profile?.verificationStatus === 'verified';
}

/** Who may write a question: Owner, Admin, or a verified teacher. */
export function canAuthorNuQuestion(profile: UserProfile | null | undefined): boolean {
  return isNuAdminProfile(profile) || isVerifiedTeacherProfile(profile);
}

/** Who may review a question: Owner, Admin, or a verified teacher
 * who is NOT the question's author (§19.6.1 — no self-review). */
export function canReviewNuQuestion(
  profile: UserProfile | null | undefined,
  actorUid: string,
  authorUid: string,
): boolean {
  if (actorUid === authorUid) return false;
  return isNuAdminProfile(profile) || isVerifiedTeacherProfile(profile);
}

// ---------------------------------------------------------------------------
// Errors — short codes the page maps to Bangla messages
// ---------------------------------------------------------------------------

export class NuQuestionFlowError extends Error {
  constructor(public readonly code: string) {
    super(code);
  }
}

function fail(code: string): never {
  throw new NuQuestionFlowError(code);
}

/** serverTimestamp() is a FieldValue sentinel; the typed docs declare
 * Timestamp fields. The rules require createdAt/reviewedAt ==
 * request.time on the audit docs, so client-side Timestamp.now()
 * would fail them — the server value is the only correct one. */
const serverNow = () => serverTimestamp() as unknown as Timestamp;

function newQuestionId(): string {
  return `nu-q-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export type NuQuestionWithId = NuQuestionDoc & { questionId: string };

function toQuestionWithId(snap: QueryDocumentSnapshot): NuQuestionWithId {
  return { ...(snap.data() as NuQuestionDoc), questionId: snap.id };
}

async function readQuestion(db: Firestore, questionId: string): Promise<NuQuestionWithId> {
  const snap = await getDoc(doc(db, 'nuQuestions', questionId));
  if (!snap.exists()) fail('nu-question-not-found');
  return toQuestionWithId(snap as QueryDocumentSnapshot);
}

/** The review queue — one status at a time, newest first
 * (index: nuQuestions status + createdAt). */
export async function listNuQuestionQueue(
  db: Firestore,
  status: NuQuestionStatus,
  limitCount = 50,
): Promise<NuQuestionWithId[]> {
  const snap = await getDocs(
    query(
      collection(db, 'nuQuestions'),
      where('status', '==', status),
      orderBy('createdAt', 'desc'),
      limit(limitCount),
    ),
  );
  return snap.docs.map(toQuestionWithId);
}

/** Questions for one subject (+ optional status), newest first
 * (index: nuQuestions status + subjectId + createdAt). */
export async function listNuQuestionsBySubject(
  db: Firestore,
  subjectId: string,
  status: NuQuestionStatus | null = null,
  limitCount = 50,
): Promise<NuQuestionWithId[]> {
  const clauses = [where('subjectId', '==', subjectId)];
  if (status) clauses.push(where('status', '==', status));
  const snap = await getDocs(
    query(collection(db, 'nuQuestions'), ...clauses, orderBy('createdAt', 'desc'), limit(limitCount)),
  );
  return snap.docs.map(toQuestionWithId);
}

/** Bank summary — counts per status (count() = 1 read per 1000 docs). */
export async function nuBankSummary(db: Firestore): Promise<Record<NuQuestionStatus, number> & { total: number }> {
  const statuses: NuQuestionStatus[] = [
    'draft',
    'submitted_for_review',
    'under_review',
    'approved',
    'published',
    'rejected',
    'changes_requested',
    'withdrawn',
  ];
  const out = {} as Record<NuQuestionStatus, number> & { total: number };
  let total = 0;
  for (const status of statuses) {
    const snap = await getCountFromServer(
      query(collection(db, 'nuQuestions'), where('status', '==', status)),
    );
    out[status] = snap.data().count;
    total += snap.data().count;
  }
  out.total = total;
  return out;
}

// ---------------------------------------------------------------------------
// Draft + draft key (create / re-save the correct answer)
// ---------------------------------------------------------------------------

export interface NuQuestionDraftInput {
  subjectId: string;
  chapterId: string;
  topicId: string;
  groupIds: string[];
  questionText: string;
  questionLang: 'bn' | 'en';
  options: [string, string, string, string];
  difficulty: 'easy' | 'medium' | 'hard';
  explanation: string;
  sourceType: 'original_practice' | 'official_previous_year' | 'board_question' | 'textbook_based';
  provenance: string;
  examYear?: number;
}

/**
 * Create a draft question + its draft key (the correct answer).
 * Returns the new question id and any near-duplicate warnings
 * (≥ 0.8 similarity against the same subject+topic — a warning
 * only, never a block; §11.4).
 *
 * The question and its key are two separate writes. If the key
 * write fails after the question was written, the draft exists
 * without a key — `saveNuQuestionDraftKey` re-saves it, and
 * submit-for-review refuses until the key exists.
 */
export async function createNuQuestionDraft(
  db: Firestore,
  actorUid: string,
  profile: UserProfile | null | undefined,
  input: NuQuestionDraftInput,
  correctOptionIndex: number,
): Promise<{ questionId: string; duplicateWarnings: { questionId: string; similarity: number }[] }> {
  if (!canAuthorNuQuestion(profile)) fail('nu-forbidden-author');

  const questionId = newQuestionId();
  const question: NuQuestionDoc = {
    version: 1,
    status: 'draft',
    sourceType: input.sourceType,
    provenance: input.provenance,
    ...(input.examYear !== undefined ? { examYear: input.examYear } : {}),
    groupIds: input.groupIds,
    subjectId: input.subjectId,
    chapterId: input.chapterId,
    topicId: input.topicId,
    questionText: input.questionText,
    questionLang: input.questionLang,
    options: input.options,
    difficulty: input.difficulty,
    explanation: input.explanation,
    createdBy: actorUid,
    circularVersion: NU_CIRCULAR_VERSION,
    createdAt: serverNow(),
    updatedAt: serverNow(),
  };
  const problems = validateNuQuestionDoc(question);
  if (problems.length > 0) fail(`nu-invalid: ${problems.join(' | ')}`);

  const draftKey = {
    questionId,
    version: 1,
    correctOptionIndex,
    createdBy: actorUid,
    subjectId: input.subjectId,
    groupIds: input.groupIds,
  };
  const keyProblems = validateNuQuestionDraftKey(draftKey);
  if (keyProblems.length > 0) fail(`nu-invalid-key: ${keyProblems.join(' | ')}`);

  // Duplicate warning (same subject + topic, first 50 by creation).
  let duplicateWarnings: { questionId: string; similarity: number }[] = [];
  try {
    const existing = await getDocs(
      query(
        collection(db, 'nuQuestions'),
        where('subjectId', '==', input.subjectId),
        where('topicId', '==', input.topicId),
        limit(50),
      ),
    );
    duplicateWarnings = findNuDuplicateCandidates(
      existing.docs.map((d) => ({ questionId: d.id, questionText: String(d.data().questionText ?? '') })),
      input.questionText,
    );
  } catch {
    // A failed duplicate scan must not block writing the draft.
    duplicateWarnings = [];
  }

  await setDoc(doc(db, 'nuQuestions', questionId), question);
  await setDoc(doc(db, 'nuQuestionDraftKeys', questionId), draftKey);
  return { questionId, duplicateWarnings };
}

/** Re-save (or first-save) the draft key — used after a partial
 * create, or when the author changes the correct answer while the
 * question is still a draft. */
export async function saveNuQuestionDraftKey(
  db: Firestore,
  actorUid: string,
  profile: UserProfile | null | undefined,
  questionId: string,
  correctOptionIndex: number,
): Promise<void> {
  const q = await readQuestion(db, questionId);
  if (q.status !== 'draft') fail('nu-not-draft');
  if (q.createdBy !== actorUid && !isNuAdminProfile(profile)) fail('nu-forbidden-author');
  const draftKey = {
    questionId,
    version: q.version,
    correctOptionIndex,
    createdBy: actorUid,
    subjectId: q.subjectId,
    groupIds: q.groupIds,
  };
  const problems = validateNuQuestionDraftKey(draftKey);
  if (problems.length > 0) fail(`nu-invalid-key: ${problems.join(' | ')}`);
  await setDoc(doc(db, 'nuQuestionDraftKeys', questionId), draftKey);
}

// ---------------------------------------------------------------------------
// Submit / claim / review
// ---------------------------------------------------------------------------

/** Draft (or changes-requested) → submitted for review. Requires
 * the draft key to exist — without it the reviewer could not see
 * the correct answer (§19.6.1). */
export async function submitNuQuestionForReview(
  db: Firestore,
  actorUid: string,
  profile: UserProfile | null | undefined,
  questionId: string,
): Promise<void> {
  const q = await readQuestion(db, questionId);
  if (q.createdBy !== actorUid && !isNuAdminProfile(profile)) fail('nu-forbidden-author');
  if (!canTransitionQuestion(q.status, 'submitted_for_review')) fail('nu-bad-transition');
  const keySnap = await getDoc(doc(db, 'nuQuestionDraftKeys', questionId));
  if (!keySnap.exists()) fail('nu-draft-key-missing');
  const key = keySnap.data() as { version?: number };
  if (key.version !== q.version) fail('nu-draft-key-version-mismatch');
  await updateDoc(doc(db, 'nuQuestions', questionId), {
    status: 'submitted_for_review',
    updatedAt: serverNow(),
  });
}

/** Submitted → under review. Sets reviewedBy/reviewedAt — the
 * approve step requires reviewedBy == the approver's uid. */
export async function claimNuQuestionReview(
  db: Firestore,
  actorUid: string,
  profile: UserProfile | null | undefined,
  questionId: string,
): Promise<void> {
  const q = await readQuestion(db, questionId);
  if (!canReviewNuQuestion(profile, actorUid, q.createdBy)) fail('nu-forbidden-reviewer');
  if (!canTransitionQuestion(q.status, 'under_review')) fail('nu-bad-transition');
  await updateDoc(doc(db, 'nuQuestions', questionId), {
    status: 'under_review',
    reviewedBy: actorUid,
    reviewedAt: serverNow(),
    updatedAt: serverNow(),
  });
}

export interface NuReviewChecks {
  questionCorrect: boolean;
  correctAnswerCorrect: boolean;
  explanationCorrect: boolean;
  sourceCorrect: boolean;
}

/**
 * Submit a review decision. Writes the append-only `nuReviews`
 * record AND moves the question (approved / rejected /
 * changes_requested). A review can only be submitted by the
 * reviewer who claimed the question (reviewedBy == uid).
 * A rejection or changes-requested decision needs a reason of at
 * least 10 characters — the author must know what to fix.
 */
export async function submitNuReview(
  db: Firestore,
  actorUid: string,
  questionId: string,
  decision: NuReviewDecision,
  checks: NuReviewChecks,
  reason?: string,
): Promise<void> {
  const q = await readQuestion(db, questionId);
  if (q.status !== 'under_review') fail('nu-not-under-review');
  if (q.reviewedBy !== actorUid) fail('nu-not-claimed-reviewer');
  const nextStatus: NuQuestionStatus =
    decision === 'approved' ? 'approved' : decision === 'rejected' ? 'rejected' : 'changes_requested';
  if (!canTransitionQuestion(q.status, nextStatus)) fail('nu-bad-transition');
  const review = {
    questionId,
    questionVersion: q.version,
    reviewerId: actorUid,
    decision,
    ...(reason !== undefined ? { reason } : {}),
    checks,
    reviewedAt: serverNow(),
  };
  const problems = validateNuReviewDoc(review);
  if (problems.length > 0) fail(`nu-invalid-review: ${problems.join(' | ')}`);
  await addDoc(collection(db, 'nuReviews'), review);
  await updateDoc(doc(db, 'nuQuestions', questionId), {
    status: nextStatus,
    reviewedAt: serverNow(),
    updatedAt: serverNow(),
  });
}

// ---------------------------------------------------------------------------
// Publish / withdraw (Owner / Admin only)
// ---------------------------------------------------------------------------

async function writeNuPublicationAndAudit(
  db: Firestore,
  actorUid: string,
  questionId: string,
  version: number,
  action: 'published' | 'withdrawn',
): Promise<void> {
  await addDoc(collection(db, 'nuPublications'), {
    questionId,
    questionVersion: version,
    action,
    actorId: actorUid,
    createdAt: serverNow(),
  });
  await addDoc(collection(db, 'adminActions'), {
    actorId: actorUid,
    action: action === 'published' ? 'nu-question-published' : 'nu-question-withdrawn',
    details: `NU প্রশ্ন ${questionId} (v${version}) ${action === 'published' ? 'প্রকাশিত' : 'প্রত্যাহার'}`,
    targetId: questionId,
    createdAt: serverNow(),
  });
}

/** Approved → published. The publish gate (§19.6.1) must pass:
 * explanation, 4 options, syllabus references, difficulty,
 * source, reviewer + review time, circular version. */
export async function publishNuQuestion(
  db: Firestore,
  actorUid: string,
  profile: UserProfile | null | undefined,
  questionId: string,
): Promise<void> {
  if (!isNuAdminProfile(profile)) fail('nu-forbidden-admin');
  const q = await readQuestion(db, questionId);
  if (!canTransitionQuestion(q.status, 'published')) fail('nu-bad-transition');
  const missing = publishGateCheck(q);
  if (missing.length > 0) fail(`nu-publish-gate: ${missing.join(' | ')}`);
  await updateDoc(doc(db, 'nuQuestions', questionId), {
    status: 'published',
    publishedAt: serverNow(),
    updatedAt: serverNow(),
  });
  await writeNuPublicationAndAudit(db, actorUid, questionId, q.version, 'published');
}

/** Published → withdrawn (the old version stays as history until
 * the Admin withdraws it — §19.6.2). */
export async function withdrawNuQuestion(
  db: Firestore,
  actorUid: string,
  profile: UserProfile | null | undefined,
  questionId: string,
): Promise<void> {
  if (!isNuAdminProfile(profile)) fail('nu-forbidden-admin');
  const q = await readQuestion(db, questionId);
  if (!canTransitionQuestion(q.status, 'withdrawn')) fail('nu-bad-transition');
  await updateDoc(doc(db, 'nuQuestions', questionId), {
    status: 'withdrawn',
    updatedAt: serverNow(),
  });
  await writeNuPublicationAndAudit(db, actorUid, questionId, q.version, 'withdrawn');
}

// ---------------------------------------------------------------------------
// Correction — a new version (§19.6.2)
// ---------------------------------------------------------------------------

/**
 * Correct a published (or approved) question: a NEW doc, version
 * + 1, `previousQuestionId` pointing back, review fields cleared.
 * The correct answer is copied from the old draft key unless the
 * caller supplies a new one. The old doc stays until the new
 * version publishes — then the Admin withdraws the old one.
 */
export async function correctNuQuestion(
  db: Firestore,
  actorUid: string,
  profile: UserProfile | null | undefined,
  oldQuestionId: string,
  changes: Partial<Pick<NuQuestionDoc, 'questionText' | 'options' | 'explanation' | 'difficulty' | 'provenance' | 'sourceType' | 'examYear'>>,
  correctOptionIndex?: number,
): Promise<{ questionId: string }> {
  if (!canAuthorNuQuestion(profile)) fail('nu-forbidden-author');
  const oldQ = await readQuestion(db, oldQuestionId);
  if (oldQ.status !== 'published' && oldQ.status !== 'approved') fail('nu-cannot-correct');
  if (oldQ.createdBy !== actorUid && !isNuAdminProfile(profile)) fail('nu-forbidden-author');

  let answer = correctOptionIndex;
  if (answer === undefined) {
    const keySnap = await getDoc(doc(db, 'nuQuestionDraftKeys', oldQuestionId));
    if (!keySnap.exists()) fail('nu-draft-key-missing');
    const key = keySnap.data() as { correctOptionIndex?: number };
    if (typeof key.correctOptionIndex !== 'number') fail('nu-draft-key-missing');
    answer = key.correctOptionIndex;
  }

  const newId = newQuestionId();
  const next = newNuQuestionVersion(oldQ, newId, actorUid);
  const merged: NuQuestionDoc = { ...next, ...changes, createdAt: serverNow(), updatedAt: serverNow() };
  const problems = validateNuQuestionDoc(merged);
  if (problems.length > 0) fail(`nu-invalid: ${problems.join(' | ')}`);
  const keyProblems = validateNuQuestionDraftKey({
    questionId: newId,
    version: merged.version,
    correctOptionIndex: answer,
    createdBy: actorUid,
    subjectId: merged.subjectId,
    groupIds: merged.groupIds,
  });
  if (keyProblems.length > 0) fail(`nu-invalid-key: ${keyProblems.join(' | ')}`);

  await setDoc(doc(db, 'nuQuestions', newId), merged);
  await setDoc(doc(db, 'nuQuestionDraftKeys', newId), {
    questionId: newId,
    version: merged.version,
    correctOptionIndex: answer,
    createdBy: actorUid,
    subjectId: merged.subjectId,
    groupIds: merged.groupIds,
  });
  return { questionId: newId };
}

// ---------------------------------------------------------------------------
// Bundle preview (NU-8/NU-9 groundwork — NOT written to Firestore)
// ---------------------------------------------------------------------------

export interface NuBundlePreview {
  bundle: NuQuestionBundleDoc;
  keys: NuQuestionKeyDoc;
}

/**
 * Assemble a topic bundle PREVIEW from published questions — the
 * bundle and its keys are built in memory only, nothing is
 * written. The admin page shows the preview; NU-8/NU-9 decide
 * when a bundle is actually created and published. A topic bundle
 * is capped at 50 questions (a practice set, not a mock).
 */
export async function previewNuTopicBundle(
  db: Firestore,
  topicId: string,
  limitCount = 50,
): Promise<NuBundlePreview> {
  const snap = await getDocs(
    query(
      collection(db, 'nuQuestions'),
      where('topicId', '==', topicId),
      where('status', '==', 'published'),
      limit(limitCount),
    ),
  );
  const questions = snap.docs.map(toQuestionWithId);
  if (questions.length === 0) fail('nu-bundle-empty');
  const firstGroup = questions[0].groupIds[0];
  const groupId = isNuGroupSlug(firstGroup) ? firstGroup : 'humanities';
  const bundle = buildNuQuestionBundle({
    bundleId: `preview-${topicId}`,
    kind: 'topic',
    groupId,
    subjectId: questions[0].subjectId,
    topicId,
    questions,
    configSnapshot: nuTopicBundleConfigSnapshot(questions.length),
    publishedBy: '',
  });
  // The preview bundle is a draft — it has no publisher yet.
  const keyEntries: { questionId: string; version: number; correctOptionIndex: number; explanation: string }[] = [];
  for (const q of questions) {
    const keySnap = await getDoc(doc(db, 'nuQuestionDraftKeys', q.questionId));
    if (!keySnap.exists()) fail('nu-draft-key-missing');
    const key = keySnap.data() as { correctOptionIndex?: number; version?: number };
    if (typeof key.correctOptionIndex !== 'number') fail('nu-draft-key-missing');
    keyEntries.push({
      questionId: q.questionId,
      version: q.version,
      correctOptionIndex: key.correctOptionIndex,
      explanation: q.explanation,
    });
  }
  const keys = buildNuQuestionKeys({
    bundleId: bundle.bundleId,
    entries: keyEntries,
    questionVersion: 1,
  });
  return { bundle, keys };
}

/** Mock bundle preview (100 published questions, one group) — same
 * in-memory-only rule as the topic preview. */
export async function previewNuMockBundle(db: Firestore, groupId: string): Promise<NuBundlePreview> {
  const snap = await getDocs(
    query(
      collection(db, 'nuQuestions'),
      where('groupIds', 'array-contains', groupId),
      where('status', '==', 'published'),
      limit(100),
    ),
  );
  const questions = snap.docs.map(toQuestionWithId);
  if (questions.length < 100) fail('nu-mock-not-ready');
  const bundle = buildNuQuestionBundle({
    bundleId: `preview-mock-${groupId}`,
    kind: 'mock',
    groupId,
    mockId: `preview-mock-${groupId}`,
    questions,
    configSnapshot: nuMockBundleConfigSnapshot(),
    publishedBy: '',
  });
  const keyEntries: { questionId: string; version: number; correctOptionIndex: number; explanation: string }[] = [];
  for (const q of questions) {
    const keySnap = await getDoc(doc(db, 'nuQuestionDraftKeys', q.questionId));
    if (!keySnap.exists()) fail('nu-draft-key-missing');
    const key = keySnap.data() as { correctOptionIndex?: number };
    if (typeof key.correctOptionIndex !== 'number') fail('nu-draft-key-missing');
    keyEntries.push({
      questionId: q.questionId,
      version: q.version,
      correctOptionIndex: key.correctOptionIndex,
      explanation: q.explanation,
    });
  }
  const keys = buildNuQuestionKeys({ bundleId: bundle.bundleId, entries: keyEntries, questionVersion: 1 });
  return { bundle, keys };
}
