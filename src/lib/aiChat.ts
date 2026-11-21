// Eduvelto AI Chat — Firestore data layer + usage caps.
//
// COLLECTIONS (firestore.rules enforces all of this server-side):
// - aiConversations/{conversationId} — one per chat thread. Owner-only:
//   the owner of the conversation is the ONLY reader — not guardians,
//   not teachers, not admins, not even the owner role (costing plan
//   §7.1: no routine access to private message content for ANYONE;
//   exceptional access is a documented, owner-approved, audited
//   process — never a rule).
// - aiConversations/{id}/messages/{messageId} — role 'user' messages
//   only from clients. Clients may NEVER write role 'assistant':
//   AI replies are written ONLY by the gateway (Admin SDK, Blaze).
//   That is what makes it impossible for a client to plant a fake AI
//   answer in history. Messages are immutable; delete the whole
//   conversation instead.
// - aiUsage/{uid}/daily/{yyyy-mm-dd} — per-user daily counters
//   (exchanges, images, voice minutes, estimated cost in BDT).
//   Counters only ever increase (rules enforce monotonicity).
// - aiUsagePlatform/daily/{yyyy-mm-dd} — platform totals for the
//   free-tier 500-requests/day ceiling. Readable by any signed-in user
//   (so the UI can warn when the platform limit is nearly reached);
//   writable ONLY by the gateway (Admin SDK) — never by clients.
//
// CAPS (costing plan §5.1, interim free tier — 500 requests/day
// platform-wide, ~50 active students/day):
//   student 10 exchanges/day, 3 images/day, voice OFF
//   teacher 15 exchanges/day (lesson + question checking)
//   guardian 5 exchanges/day (child progress only)
//   admin / owner: no per-user cap (testing), still inside the
//   platform quota. Blaze (paid) caps are higher (student 30/day)
//   and are enforced server-side by the gateway — see the approval
//   package. These client-side caps are a courtesy display + a
//   first line of defence; they are BYPASSABLE until the gateway
//   exists (costing plan §2.2 — honest limitation, not hidden).

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  startAfter,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type DocumentSnapshot,
  type QueryDocumentSnapshot,
  type Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { UserRole } from './profile';

export interface AiConversation {
  id: string;
  ownerId: string;
  title: string;
  language: 'bn' | 'en';
  status: 'active' | 'archived';
  messageCount: number;
  lastMessageAt: Timestamp | null;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export type AiMessageRole = 'user' | 'assistant' | 'system';

export interface AiMessage {
  id: string;
  conversationId: string;
  role: AiMessageRole;
  /** The sender's Auth uid for role 'user'; 'eduvelto-ai' for assistant replies. */
  senderId: string;
  /**
   * Denormalised owner of the parent conversation — the rules check
   * this field directly, so reading a message list costs no extra
   * get() on the parent document.
   */
  ownerId: string;
  body: string;
  createdAt: Timestamp | null;
}

/** Per-user daily AI usage (costing plan §5). One doc per user per day. */
export interface AiDailyUsage {
  userId: string;
  date: string; // YYYY-MM-DD, Asia/Dhaka
  exchanges: number;
  images: number;
  voiceMinutes: number;
  /** Estimated cost in BDT for this day's usage (model cost only). */
  estimatedCostBdt: number;
  updatedAt: Timestamp | null;
}

/** Platform-wide daily totals (free-tier ceiling watch). Gateway-written only. */
export interface AiPlatformUsage {
  date: string;
  totalExchanges: number;
  totalImages: number;
  updatedAt: Timestamp | null;
}

export const AI_MESSAGE_MAX_CHARS = 4000;
export const AI_CONVERSATIONS_PAGE_SIZE = 20;
export const AI_MESSAGES_PAGE_SIZE = 50;

/** Interim (free-tier) daily caps per role — costing plan §5.1. */
export const AI_DAILY_CAPS: Record<UserRole, { exchanges: number; images: number; voiceMinutes: number }> = {
  student: { exchanges: 10, images: 3, voiceMinutes: 0 },
  teacher: { exchanges: 15, images: 3, voiceMinutes: 0 },
  parent: { exchanges: 5, images: 1, voiceMinutes: 0 },
  moderator: { exchanges: 10, images: 3, voiceMinutes: 0 },
  admin: { exchanges: Number.POSITIVE_INFINITY, images: Number.POSITIVE_INFINITY, voiceMinutes: 0 },
  owner: { exchanges: Number.POSITIVE_INFINITY, images: Number.POSITIVE_INFINITY, voiceMinutes: 0 },
};

export function getDailyCap(role: UserRole): { exchanges: number; images: number; voiceMinutes: number } {
  return AI_DAILY_CAPS[role] ?? AI_DAILY_CAPS.student;
}

/** Today's date key in Asia/Dhaka (the platform's day boundary). */
export function todayKey(date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const get = (type: string): string => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export function emptyDailyUsage(userId: string, date: string): AiDailyUsage {
  return { userId, date, exchanges: 0, images: 0, voiceMinutes: 0, estimatedCostBdt: 0, updatedAt: null };
}

/** Exchanges the user may still make today under the interim cap. */
export function remainingExchangesToday(usage: AiDailyUsage, role: UserRole): number {
  const cap = getDailyCap(role).exchanges;
  if (!Number.isFinite(cap)) return Number.POSITIVE_INFINITY;
  return Math.max(0, cap - usage.exchanges);
}

/** Validate a message body before it is written. Returns an error string, or null when valid. */
export function validateMessageBody(body: string): string | null {
  const text = body.trim();
  if (text.length === 0) return 'empty';
  if (text.length > AI_MESSAGE_MAX_CHARS) return 'too-long';
  return null;
}

/** Conversation title = the first question, shortened. Never invented. */
export function titleFromFirstMessage(body: string): string {
  const text = body.trim().replace(/\s+/g, ' ');
  return text.length > 60 ? `${text.slice(0, 60)}…` : text;
}

function toConversation(id: string, data: DocumentData): AiConversation {
  return {
    id,
    ownerId: data.ownerId as string,
    title: data.title as string,
    language: data.language as 'bn' | 'en',
    status: data.status as 'active' | 'archived',
    messageCount: (data.messageCount as number) ?? 0,
    lastMessageAt: (data.lastMessageAt as Timestamp | null) ?? null,
    createdAt: (data.createdAt as Timestamp | null) ?? null,
    updatedAt: (data.updatedAt as Timestamp | null) ?? null,
  };
}

function toMessage(conversationId: string, id: string, data: DocumentData): AiMessage {
  return {
    id,
    conversationId,
    role: data.role as AiMessageRole,
    senderId: data.senderId as string,
    ownerId: data.ownerId as string,
    body: data.body as string,
    createdAt: (data.createdAt as Timestamp | null) ?? null,
  };
}

function requireDb() {
  if (!db) throw new Error('Firebase is not configured.');
  return db;
}

/** Page 1 of the user's conversations, newest first. Returns the page + a cursor for the next page. */
export async function listConversations(
  uid: string,
  pageSize = AI_CONVERSATIONS_PAGE_SIZE,
  after?: QueryDocumentSnapshot<DocumentData> | null,
): Promise<{ conversations: AiConversation[]; lastDoc: QueryDocumentSnapshot<DocumentData> | null }> {
  const firestore = requireDb();
  // The query itself is scoped to the caller's own threads
  // (where ownerId == uid) — Firestore rules do NOT filter results,
  // so an unscoped query would be denied outright. Composite index
  // (ownerId ASC + updatedAt DESC) is declared in firestore.indexes.json.
  const col = collection(firestore, 'aiConversations');
  const q = after
    ? query(col, where('ownerId', '==', uid), orderBy('updatedAt', 'desc'), startAfter(after), limit(pageSize))
    : query(col, where('ownerId', '==', uid), orderBy('updatedAt', 'desc'), limit(pageSize));
  const snap = await getDocs(q);
  return {
    conversations: snap.docs.map((d) => toConversation(d.id, d.data())),
    lastDoc: snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null,
  };
}

/**
 * Send the user's question. Creates the conversation on the first
 * message (title = the question itself) and appends the message in
 * ONE batch, so a message can never exist without its conversation.
 * The AI answer is NOT produced here — the caller asks the provider
 * separately and shows the honest not-connected state when there is
 * no provider (see AiChatPage). Returns the conversation id.
 */
export async function sendUserMessage(
  uid: string,
  text: string,
  language: 'bn' | 'en',
  conversationId?: string | null,
): Promise<{ conversationId: string; messageId: string }> {
  const error = validateMessageBody(text);
  if (error) throw new Error(`Invalid message: ${error}`);
  const firestore = requireDb();
  const body = text.trim();
  const batch = writeBatch(firestore);
  let convId = conversationId ?? null;
  let convRef;
  if (!convId) {
    convRef = doc(collection(firestore, 'aiConversations'));
    convId = convRef.id;
    batch.set(convRef, {
      ownerId: uid,
      title: titleFromFirstMessage(body),
      language,
      status: 'active',
      messageCount: 1,
      lastMessageAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } else {
    convRef = doc(firestore, 'aiConversations', convId);
    const existing = await getDoc(convRef);
    if (!existing.exists()) throw new Error('Conversation not found.');
    const data = existing.data();
    if (data.ownerId !== uid) throw new Error('Not your conversation.');
    batch.update(convRef, {
      messageCount: ((data.messageCount as number) ?? 0) + 1,
      lastMessageAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
  const msgRef = doc(collection(firestore, 'aiConversations', convId, 'messages'));
  batch.set(msgRef, {
    role: 'user',
    senderId: uid,
    ownerId: uid,
    body,
    createdAt: serverTimestamp(),
  });
  await batch.commit();
  return { conversationId: convId, messageId: msgRef.id };
}

/**
 * Newest messages first (so pagination loads the latest page first);
 * the page displays them oldest-first. `after` = last doc of the
 * previous (older) page.
 */
export async function listMessages(
  conversationId: string,
  pageSize = AI_MESSAGES_PAGE_SIZE,
  after?: QueryDocumentSnapshot<DocumentData> | null,
): Promise<{ messages: AiMessage[]; lastDoc: QueryDocumentSnapshot<DocumentData> | null }> {
  const firestore = requireDb();
  const col = collection(firestore, 'aiConversations', conversationId, 'messages');
  const q = after
    ? query(col, orderBy('createdAt', 'desc'), startAfter(after), limit(pageSize))
    : query(col, orderBy('createdAt', 'desc'), limit(pageSize));
  const snap = await getDocs(q);
  // Display oldest-first within the loaded page.
  const messages = snap.docs.map((d) => toMessage(conversationId, d.id, d.data())).reverse();
  return { messages, lastDoc: snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null };
}

/** Delete a conversation and ALL its messages (no cascade in Firestore — done here, in batches). */
export async function deleteConversation(uid: string, conversationId: string): Promise<void> {
  const firestore = requireDb();
  const convRef = doc(firestore, 'aiConversations', conversationId);
  const existing = await getDoc(convRef);
  if (!existing.exists()) return;
  if (existing.data().ownerId !== uid) throw new Error('Not your conversation.');
  let last: DocumentSnapshot<DocumentData> | null = null;
  for (;;) {
    const col = collection(firestore, 'aiConversations', conversationId, 'messages');
    const q = last
      ? query(col, orderBy('createdAt', 'desc'), startAfter(last), limit(100))
      : query(col, orderBy('createdAt', 'desc'), limit(100));
    const snap = await getDocs(q);
    if (snap.empty) break;
    const batch = writeBatch(firestore);
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    last = snap.docs[snap.docs.length - 1];
    if (snap.docs.length < 100) break;
  }
  await deleteDoc(convRef);
}

/** Archive (hide from the active list) without deleting history. */
export async function archiveConversation(uid: string, conversationId: string): Promise<void> {
  const firestore = requireDb();
  const convRef = doc(firestore, 'aiConversations', conversationId);
  const existing = await getDoc(convRef);
  if (!existing.exists() || existing.data().ownerId !== uid) throw new Error('Not your conversation.');
  await updateDoc(convRef, { status: 'archived', updatedAt: serverTimestamp() });
}

/** Read today's per-user usage counter (0 when no doc exists yet). */
export async function getTodayAiUsage(uid: string, date = todayKey()): Promise<AiDailyUsage> {
  const firestore = requireDb();
  const snap = await getDoc(doc(firestore, 'aiUsage', uid, 'daily', date));
  if (!snap.exists()) return emptyDailyUsage(uid, date);
  const d = snap.data();
  return {
    userId: uid,
    date,
    exchanges: (d.exchanges as number) ?? 0,
    images: (d.images as number) ?? 0,
    voiceMinutes: (d.voiceMinutes as number) ?? 0,
    estimatedCostBdt: (d.estimatedCostBdt as number) ?? 0,
    updatedAt: (d.updatedAt as Timestamp | null) ?? null,
  };
}

/** Read today's platform totals (0 when no doc exists yet). Gateway-written only. */
export async function getTodayPlatformUsage(date = todayKey()): Promise<AiPlatformUsage> {
  const firestore = requireDb();
  const snap = await getDoc(doc(firestore, 'aiUsagePlatform', 'daily', date));
  if (!snap.exists()) return { date, totalExchanges: 0, totalImages: 0, updatedAt: null };
  const d = snap.data();
  return {
    date,
    totalExchanges: (d.totalExchanges as number) ?? 0,
    totalImages: (d.totalImages as number) ?? 0,
    updatedAt: (d.updatedAt as Timestamp | null) ?? null,
  };
}

/** Record one completed AI exchange against the user's daily counter (gateway use). */
export async function recordAiExchange(
  uid: string,
  inputTokens: number,
  outputTokens: number,
  costPerExchangeBdt: number,
  date = todayKey(),
): Promise<void> {
  const firestore = requireDb();
  const ref = doc(firestore, 'aiUsage', uid, 'daily', date);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      userId: uid,
      date,
      exchanges: 1,
      images: 0,
      voiceMinutes: 0,
      estimatedCostBdt: costPerExchangeBdt,
      inputTokens,
      outputTokens,
      updatedAt: serverTimestamp(),
    });
    return;
  }
  const d = snap.data();
  await updateDoc(ref, {
    exchanges: ((d.exchanges as number) ?? 0) + 1,
    estimatedCostBdt: ((d.estimatedCostBdt as number) ?? 0) + costPerExchangeBdt,
    updatedAt: serverTimestamp(),
  });
}

/**
 * File a report about an AI response (or the AI service itself).
 * Uses the existing `reports` collection (targetType 'message',
 * targetAuthorId 'eduvelto-ai'). Reports are reviewed by moderators;
 * the reporter never sees other users' reports.
 */
export async function reportAiResponse(
  uid: string,
  conversationId: string,
  reason: 'spam' | 'abuse' | 'copyright' | 'personal-info' | 'other',
  details?: string,
): Promise<string> {
  const firestore = requireDb();
  const ref = await addDoc(collection(firestore, 'reports'), {
    reporterId: uid,
    status: 'open',
    reason,
    targetType: 'message',
    targetId: conversationId,
    targetAuthorId: 'eduvelto-ai',
    details: details?.trim() ? details.trim().slice(0, 2000) : null,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}
