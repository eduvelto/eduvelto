// Eduvelto — private messaging + notifications (Phase 1: text only).
//
// Privacy model (approved privacy + messaging proposal, 21 Nov 2026;
// master directive 21 Nov 07:34): DMs are private — NO routine access
// to message content for anyone, including the Owner. The Firestore
// rules (firestore.rules, messenger section) are the enforcement layer;
// this module only ever writes what the rules allow. In particular:
//
// - Thread ids are the sorted pair id `{smallerUid}_{largerUid}`.
// - A DM thread can be created only when the rules' permission matrix
//   allows that pair (adult/adult, minor/minor friends with guardian
//   consent, minor/teacher same institution, minor/guardian via a
//   verified parentLink, teacher/teacher, guardian/teacher about a
//   verified-linked child). The client pre-checks for a friendly error;
//   the rules are the final authority.
// - Messages are text only, max 2000 chars, immutable (no edit/delete).
// - Notifications NEVER carry private message text — a new-message
//   notification says only who wrote, never what they wrote.
// - Exceptional access to DM content is possible ONLY through an
//   Owner-approved, time-boxed grant (dmAccessGrants); every read under
//   a grant is logged to adminActions and the affected users are
//   notified afterwards. The dashboard code does the logging (see
//   readGrantedThread); the rules cannot force a client to log, so the
//   grant itself is the hard control.
// - "Verified" for a student means an active account with a date of
//   birth on file — student identity verification was removed entirely
//   by the owner's decision (21 Nov 06:53). Teachers/guardians need
//   verificationStatus 'verified' (free manual verification).

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  deleteDoc,
  startAfter,
  where,
  writeBatch,
  type DocumentData,
  type Firestore,
  type QueryDocumentSnapshot,
  type Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { logAdminAction } from './admin';

export const DM_MESSAGE_MAX_CHARS = 2000;
export const DM_FLOOD_SECONDS = 3;
export const DM_GRANT_MAX_HOURS = 72;
const THREAD_PAGE_SIZE = 50;
const MESSAGE_PAGE_SIZE = 50;

export function dmPairId(a: string, b: string): string {
  return [a, b].sort().join('_');
}

export function otherParticipant(participants: string[], me: string): string {
  return participants[0] === me ? participants[1] : participants[0];
}

export interface DmThread {
  id: string;
  participants: string[];
  type: 'dm';
  status: 'active' | 'closed';
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
  lastMessageAt?: Timestamp | null;
  lastMessagePreview?: string;
  lastMessageSenderId?: string;
  aboutStudentId?: string;
}

export interface DmMessage {
  id: string;
  senderId: string;
  kind: 'text';
  body: string;
  createdAt?: Timestamp | null;
}

export interface PublicProfile {
  uid: string;
  displayName: string;
  role: string;
  institution?: string | null;
  classLevel?: string | null;
  updatedAt?: Timestamp | null;
}

export type NotificationType =
  | 'message'
  | 'group_message'
  | 'verification'
  | 'exam_result'
  | 'admin_notice'
  | 'report_update'
  | 'friend_request'
  | 'group_invite';

export interface NotificationItem {
  id: string;
  recipientId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  conversationId?: string;
  groupId?: string;
  refId?: string;
  read: boolean;
  createdAt?: Timestamp | null;
}

export interface DmAccessGrant {
  id: string;
  threadId: string;
  grantedTo: string;
  grantedBy: string;
  reason: string;
  status: 'approved' | 'revoked';
  createdAt?: Timestamp | null;
  expiresAt?: Timestamp | null;
}

export interface ReportRow {
  id: string;
  reporterId: string;
  status: string;
  reason: string;
  targetType: string;
  targetId: string;
  targetAuthorId: string;
  details?: string;
  createdAt?: Timestamp | null;
}

export interface StudyGroup {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'closed';
  createdBy: string;
  memberCount?: number;
  createdAt?: Timestamp | null;
}

export interface GroupMembership {
  id: string;
  groupId: string;
  userId: string;
  status: 'pending' | 'active' | 'rejected' | 'removed';
}

export interface FriendRequest {
  id: string;
  userA: string;
  userB: string;
  status: 'pending' | 'accepted' | 'declined' | 'blocked';
  guardianApproved: boolean;
}

export interface DmConsent {
  childUid: string;
  guardianUid: string;
  status: 'granted' | 'revoked';
  grantedBy: string;
  reason?: string;
}

function toDmThread(id: string, data: DocumentData): DmThread {
  return {
    id,
    participants: Array.isArray(data.participants) ? (data.participants as string[]) : [],
    type: 'dm',
    status: data.status === 'closed' ? 'closed' : 'active',
    createdAt: (data.createdAt as Timestamp | null) ?? null,
    updatedAt: (data.updatedAt as Timestamp | null) ?? null,
    lastMessageAt: (data.lastMessageAt as Timestamp | null) ?? null,
    lastMessagePreview: typeof data.lastMessagePreview === 'string' ? data.lastMessagePreview : '',
    lastMessageSenderId: typeof data.lastMessageSenderId === 'string' ? data.lastMessageSenderId : '',
    aboutStudentId: typeof data.aboutStudentId === 'string' ? data.aboutStudentId : '',
  };
}

function toDmMessage(id: string, data: DocumentData): DmMessage {
  return {
    id,
    senderId: typeof data.senderId === 'string' ? data.senderId : '',
    kind: 'text',
    body: typeof data.body === 'string' ? data.body : '',
    createdAt: (data.createdAt as Timestamp | null) ?? null,
  };
}

function toNotification(id: string, data: DocumentData): NotificationItem {
  return {
    id,
    recipientId: typeof data.recipientId === 'string' ? data.recipientId : '',
    type: (data.type as NotificationType) ?? 'admin_notice',
    title: typeof data.title === 'string' ? data.title : '',
    body: typeof data.body === 'string' ? data.body : '',
    link: typeof data.link === 'string' ? data.link : undefined,
    conversationId: typeof data.conversationId === 'string' ? data.conversationId : undefined,
    groupId: typeof data.groupId === 'string' ? data.groupId : undefined,
    refId: typeof data.refId === 'string' ? data.refId : undefined,
    read: data.read === true,
    createdAt: (data.createdAt as Timestamp | null) ?? null,
  };
}

/** Friendly message for a DM failure (rules deny with permission-denied). */
export function friendlyDmError(error: unknown): string {
  const code = error instanceof Error ? error.message : String(error);
  if (code.includes('permission-denied')) {
    return 'এই বার্তা পাঠানোর অনুমতি নেই — বয়স, যাচাই, ব্লক বা বন্ধুত্বের নিয়ম দেখুন।';
  }
  if (code.includes('unavailable') || code.includes('network')) {
    return 'নেটওয়ার্ক সমস্যা। সংযোগ দেখে আবার চেষ্টা করুন।';
  }
  return 'বার্তা পাঠানো যায়নি। আবার চেষ্টা করুন।';
}

// ---------------------------------------------------------------------------
// Public profiles (DM directory)
// ---------------------------------------------------------------------------

/**
 * Write (or refresh) the caller's public profile mirror. The rules
 * require the mirror to match the users doc exactly, so this reads the
 * users doc first. Called after profile saves and when opening
 * /messages if the mirror is missing.
 */
export async function syncPublicProfile(db: Firestore, uid: string): Promise<void> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) throw new Error('profile-missing');
  const d = snap.data();
  await setDoc(doc(db, 'publicProfiles', uid), {
    displayName: typeof d.displayName === 'string' ? d.displayName : '',
    role: typeof d.role === 'string' ? d.role : 'student',
    institution: typeof d.institution === 'string' ? d.institution : null,
    classLevel: typeof d.classLevel === 'string' ? d.classLevel : null,
    updatedAt: serverTimestamp(),
  });
}

export async function getPublicProfile(db: Firestore, uid: string): Promise<PublicProfile | null> {
  const snap = await getDoc(doc(db, 'publicProfiles', uid));
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    uid: snap.id,
    displayName: typeof d.displayName === 'string' ? d.displayName : '(নাম নেই)',
    role: typeof d.role === 'string' ? d.role : 'student',
    institution: typeof d.institution === 'string' ? d.institution : null,
    classLevel: typeof d.classLevel === 'string' ? d.classLevel : null,
    updatedAt: (d.updatedAt as Timestamp | null) ?? null,
  };
}

/** Prefix search on displayName (signed-in users only, rules-enforced). */
export async function searchPublicProfiles(db: Firestore, prefix: string, max = 10): Promise<PublicProfile[]> {
  const q = query(
    collection(db, 'publicProfiles'),
    orderBy('displayName'),
    where('displayName', '>=', prefix),
    where('displayName', '<=', prefix + '\uf8ff'),
    limit(max),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      uid: d.id,
      displayName: typeof data.displayName === 'string' ? data.displayName : '(নাম নেই)',
      role: typeof data.role === 'string' ? data.role : 'student',
      institution: typeof data.institution === 'string' ? data.institution : null,
      classLevel: typeof data.classLevel === 'string' ? data.classLevel : null,
      updatedAt: (data.updatedAt as Timestamp | null) ?? null,
    };
  });
}

// ---------------------------------------------------------------------------
// DM threads + messages
// ---------------------------------------------------------------------------

export async function getDmThread(db: Firestore, threadId: string): Promise<DmThread | null> {
  const snap = await getDoc(doc(db, 'directMessages', threadId));
  if (!snap.exists()) return null;
  return toDmThread(snap.id, snap.data());
}

/**
 * Create a DM thread between the caller and another user. The rules
 * enforce the permission matrix; this only checks the thread does not
 * already exist (so a duplicate create fails with a clear error instead
 * of a rules denial).
 */
export async function createDmThread(
  db: Firestore,
  meUid: string,
  otherUid: string,
  aboutStudentId = '',
): Promise<DmThread> {
  const id = dmPairId(meUid, otherUid);
  const existing = await getDmThread(db, id);
  if (existing) return existing;
  const data = {
    participants: [meUid, otherUid].sort(),
    type: 'dm' as const,
    status: 'active' as const,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastMessageAt: null,
    lastMessagePreview: '',
    lastMessageSenderId: '',
    aboutStudentId,
  };
  await setDoc(doc(db, 'directMessages', id), data);
  const created = await getDmThread(db, id);
  if (!created) throw new Error('thread-create-failed');
  return created;
}

/** Live list of the caller's threads, newest first (50/page via onSnapshot). */
export function subscribeMyThreads(
  db: Firestore,
  uid: string,
  cb: (threads: DmThread[]) => void,
  onError: (e: Error) => void,
): Unsubscribe {
  const q = query(
    collection(db, 'directMessages'),
    where('participants', 'array-contains', uid),
    orderBy('updatedAt', 'desc'),
    limit(THREAD_PAGE_SIZE),
  );
  return onSnapshot(
    q,
    (snap) => cb(snap.docs.map((d) => toDmThread(d.id, d.data()))),
    (e) => onError(e as Error),
  );
}

/** Paginated message history, newest first. Pass the last doc to load more. */
export async function listThreadMessages(
  db: Firestore,
  threadId: string,
  after?: QueryDocumentSnapshot<DocumentData> | null,
): Promise<{ messages: DmMessage[]; lastDoc: QueryDocumentSnapshot<DocumentData> | null; hasMore: boolean }> {
  const base = query(
    collection(db, 'directMessages', threadId, 'messages'),
    orderBy('createdAt', 'desc'),
    limit(MESSAGE_PAGE_SIZE),
  );
  const paged = after
    ? query(
        collection(db, 'directMessages', threadId, 'messages'),
        orderBy('createdAt', 'desc'),
        startAfter(after),
        limit(MESSAGE_PAGE_SIZE),
      )
    : base;
  const snap = await getDocs(paged);
  const messages = snap.docs.map((d) => toDmMessage(d.id, d.data()));
  return {
    messages,
    lastDoc: snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null,
    hasMore: snap.docs.length === MESSAGE_PAGE_SIZE,
  };
}

/**
 * Send a text message. One atomic batch: the message + the thread's
 * last-message preview + a notification for the other participant (no
 * message text inside the notification — sender name only).
 */
export async function sendDmMessage(
  db: Firestore,
  thread: DmThread,
  senderUid: string,
  senderName: string,
  text: string,
): Promise<void> {
  const body = text.trim();
  if (body.length === 0 || body.length > DM_MESSAGE_MAX_CHARS) {
    throw new Error('message-length');
  }
  const recipientId = otherParticipant(thread.participants, senderUid);
  const batch = writeBatch(db);
  batch.set(doc(collection(db, 'directMessages', thread.id, 'messages')), {
    senderId: senderUid,
    kind: 'text',
    body,
    createdAt: serverTimestamp(),
  });
  batch.update(doc(db, 'directMessages', thread.id), {
    lastMessageAt: serverTimestamp(),
    lastMessagePreview: body.slice(0, 200),
    lastMessageSenderId: senderUid,
    updatedAt: serverTimestamp(),
  });
  batch.set(doc(collection(db, 'notifications', recipientId, 'items')), {
    recipientId,
    type: 'message',
    title: 'নতুন বার্তা',
    body: `${senderName} আপনাকে একটি বার্তা পাঠিয়েছেন।`,
    conversationId: thread.id,
    createdAt: serverTimestamp(),
    read: false,
  });
  await batch.commit();
}

/** Close (or reopen) a thread. Either participant may do it. */
export async function setThreadStatus(db: Firestore, threadId: string, status: 'active' | 'closed'): Promise<void> {
  await updateDoc(doc(db, 'directMessages', threadId), { status, updatedAt: serverTimestamp() });
}

// ---------------------------------------------------------------------------
// Blocks
// ---------------------------------------------------------------------------

export async function getMyBlocks(db: Firestore, uid: string): Promise<string[]> {
  const snap = await getDoc(doc(db, 'blocks', uid));
  if (!snap.exists()) return [];
  const list = snap.data().blockedUids;
  return Array.isArray(list) ? (list as string[]) : [];
}

export async function blockUser(db: Firestore, uid: string, targetUid: string): Promise<void> {
  const current = await getMyBlocks(db, uid);
  if (current.includes(targetUid)) return;
  await setDoc(
    doc(db, 'blocks', uid),
    { blockedUids: [...current, targetUid].slice(0, 500), updatedAt: serverTimestamp() },
    { merge: true },
  );
}

export async function unblockUser(db: Firestore, uid: string, targetUid: string): Promise<void> {
  const current = await getMyBlocks(db, uid);
  await setDoc(
    doc(db, 'blocks', uid),
    { blockedUids: current.filter((u) => u !== targetUid), updatedAt: serverTimestamp() },
    { merge: true },
  );
}

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

export async function reportMessage(
  db: Firestore,
  reporterUid: string,
  opts: {
    targetType: 'message' | 'groupMessage' | 'user' | 'conversation';
    targetId: string;
    targetAuthorId: string;
    reason: 'spam' | 'abuse' | 'copyright' | 'personal-info' | 'other';
    details?: string;
    conversationId?: string;
  },
): Promise<string> {
  const ref = await addDoc(collection(db, 'reports'), {
    reporterId: reporterUid,
    status: 'open',
    reason: opts.reason,
    targetType: opts.targetType,
    targetId: opts.targetId,
    targetAuthorId: opts.targetAuthorId,
    details: (opts.details ?? '').slice(0, 2000),
    conversationId: opts.conversationId ?? '',
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

// ---------------------------------------------------------------------------
// Friendships
// ---------------------------------------------------------------------------

export async function sendFriendRequest(db: Firestore, meUid: string, otherUid: string): Promise<void> {
  const id = dmPairId(meUid, otherUid);
  await setDoc(doc(db, 'friendships', id), {
    userA: [meUid, otherUid].sort()[0],
    userB: [meUid, otherUid].sort()[1],
    status: 'pending',
    guardianApproved: false,
    createdAt: serverTimestamp(),
  });
  // Notify the recipient (rules verify the pending friendship exists).
  await addDoc(collection(db, 'notifications', otherUid, 'items'), {
    recipientId: otherUid,
    type: 'friend_request',
    title: 'বন্ধুত্বের অনুরোধ',
    body: 'একজন ব্যবহারকারী আপনাকে বন্ধুত্বের অনুরোধ পাঠিয়েছেন।',
    refId: id,
    createdAt: serverTimestamp(),
    read: false,
  });
}

export async function listIncomingFriendRequests(db: Firestore, uid: string): Promise<FriendRequest[]> {
  const snap = await getDocs(
    query(collection(db, 'friendships'), where('userB', '==', uid), where('status', '==', 'pending'), limit(25)),
  );
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      userA: typeof data.userA === 'string' ? data.userA : '',
      userB: typeof data.userB === 'string' ? data.userB : '',
      status: (data.status as FriendRequest['status']) ?? 'pending',
      guardianApproved: data.guardianApproved === true,
    };
  });
}

export async function respondFriendRequest(db: Firestore, pairIdValue: string, accept: boolean): Promise<void> {
  await updateDoc(doc(db, 'friendships', pairIdValue), {
    status: accept ? 'accepted' : 'declined',
    updatedAt: serverTimestamp(),
  });
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export async function listNotifications(db: Firestore, uid: string, max = 50): Promise<NotificationItem[]> {
  const snap = await getDocs(
    query(collection(db, 'notifications', uid, 'items'), orderBy('createdAt', 'desc'), limit(max)),
  );
  return snap.docs.map((d) => toNotification(d.id, d.data()));
}

export function subscribeNotifications(
  db: Firestore,
  uid: string,
  cb: (items: NotificationItem[]) => void,
  onError: (e: Error) => void,
): Unsubscribe {
  const q = query(collection(db, 'notifications', uid, 'items'), orderBy('createdAt', 'desc'), limit(50));
  return onSnapshot(
    q,
    (snap) => cb(snap.docs.map((d) => toNotification(d.id, d.data()))),
    (e) => onError(e as Error),
  );
}

export async function markNotificationRead(db: Firestore, uid: string, itemId: string): Promise<void> {
  await updateDoc(doc(db, 'notifications', uid, 'items', itemId), { read: true });
}

export async function markAllNotificationsRead(db: Firestore, uid: string): Promise<void> {
  const items = await listNotifications(db, uid, 50);
  const batch = writeBatch(db);
  for (const item of items) {
    if (!item.read) batch.update(doc(db, 'notifications', uid, 'items', item.id), { read: true });
  }
  await batch.commit();
}

export async function deleteNotification(db: Firestore, uid: string, itemId: string): Promise<void> {
  await deleteDoc(doc(db, 'notifications', uid, 'items', itemId));
}

/** Exam-result notification for the user themself (wired by QuizPage later). */
export async function notifyExamResult(db: Firestore, uid: string, title: string, body: string, link = ''): Promise<void> {
  await addDoc(collection(db, 'notifications', uid, 'items'), {
    recipientId: uid,
    type: 'exam_result',
    title: title.slice(0, 200),
    body: body.slice(0, 500),
    link: link.slice(0, 500),
    createdAt: serverTimestamp(),
    read: false,
  });
}

// ---------------------------------------------------------------------------
// Groups (admin-created, member-only)
// ---------------------------------------------------------------------------

export async function createGroup(db: Firestore, name: string, description: string, creatorUid: string): Promise<string> {
  const ref = await addDoc(collection(db, 'studyGroups'), {
    name: name.trim().slice(0, 100),
    description: description.trim().slice(0, 500),
    status: 'active',
    createdBy: creatorUid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    memberCount: 0,
  });
  await logAdminAction(db, 'group-created', name.trim().slice(0, 200), ref.id);
  return ref.id;
}

export async function listGroups(db: Firestore, max = 50): Promise<StudyGroup[]> {
  const snap = await getDocs(query(collection(db, 'studyGroups'), orderBy('createdAt', 'desc'), limit(max)));
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      name: typeof data.name === 'string' ? data.name : '(নাম নেই)',
      description: typeof data.description === 'string' ? data.description : '',
      status: data.status === 'closed' ? 'closed' : 'active',
      createdBy: typeof data.createdBy === 'string' ? data.createdBy : '',
      memberCount: typeof data.memberCount === 'number' ? data.memberCount : 0,
      createdAt: (data.createdAt as Timestamp | null) ?? null,
    };
  });
}

export async function listMyGroups(db: Firestore, uid: string): Promise<{ group: StudyGroup; membership: GroupMembership }[]> {
  const snap = await getDocs(
    query(collection(db, 'groupMemberships'), where('userId', '==', uid), where('status', '==', 'active'), limit(50)),
  );
  const out: { group: StudyGroup; membership: GroupMembership }[] = [];
  for (const m of snap.docs) {
    const md = m.data();
    const gSnap = await getDoc(doc(db, 'studyGroups', String(md.groupId)));
    if (!gSnap.exists()) continue;
    const gd = gSnap.data();
    out.push({
      group: {
        id: gSnap.id,
        name: typeof gd.name === 'string' ? gd.name : '(নাম নেই)',
        description: typeof gd.description === 'string' ? gd.description : '',
        status: gd.status === 'closed' ? 'closed' : 'active',
        createdBy: typeof gd.createdBy === 'string' ? gd.createdBy : '',
        memberCount: typeof gd.memberCount === 'number' ? gd.memberCount : 0,
        createdAt: (gd.createdAt as Timestamp | null) ?? null,
      },
      membership: {
        id: m.id,
        groupId: String(md.groupId),
        userId: String(md.userId),
        status: (md.status as GroupMembership['status']) ?? 'pending',
      },
    });
  }
  return out;
}

export async function getGroupMembership(db: Firestore, groupId: string, uid: string): Promise<GroupMembership | null> {
  const snap = await getDoc(doc(db, 'groupMemberships', `${groupId}_${uid}`));
  if (!snap.exists()) return null;
  const d = snap.data();
  return { id: snap.id, groupId: String(d.groupId), userId: String(d.userId), status: (d.status as GroupMembership['status']) ?? 'pending' };
}

export async function requestJoinGroup(db: Firestore, groupId: string, uid: string): Promise<void> {
  await setDoc(doc(db, 'groupMemberships', `${groupId}_${uid}`), {
    groupId,
    userId: uid,
    status: 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function setMembershipStatus(
  db: Firestore,
  groupId: string,
  userId: string,
  status: 'active' | 'rejected' | 'removed',
): Promise<void> {
  await updateDoc(doc(db, 'groupMemberships', `${groupId}_${userId}`), { status, updatedAt: serverTimestamp() });
  await logAdminAction(
    db,
    status === 'active' ? 'group-member-added' : 'group-member-removed',
    `group ${groupId}`,
    userId,
  );
}

export async function leaveGroup(db: Firestore, groupId: string, uid: string): Promise<void> {
  await deleteDoc(doc(db, 'groupMemberships', `${groupId}_${uid}`));
}

export async function listGroupMessages(
  db: Firestore,
  groupId: string,
  after?: QueryDocumentSnapshot<DocumentData> | null,
): Promise<{ messages: DmMessage[]; lastDoc: QueryDocumentSnapshot<DocumentData> | null; hasMore: boolean }> {
  const paged = after
    ? query(
        collection(db, 'groupMessages', groupId, 'messages'),
        orderBy('createdAt', 'desc'),
        startAfter(after),
        limit(MESSAGE_PAGE_SIZE),
      )
    : query(collection(db, 'groupMessages', groupId, 'messages'), orderBy('createdAt', 'desc'), limit(MESSAGE_PAGE_SIZE));
  const snap = await getDocs(paged);
  return {
    messages: snap.docs.map((d) => toDmMessage(d.id, d.data())),
    lastDoc: snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null,
    hasMore: snap.docs.length === MESSAGE_PAGE_SIZE,
  };
}

export async function sendGroupMessage(db: Firestore, groupId: string, senderUid: string, text: string): Promise<void> {
  const body = text.trim();
  if (body.length === 0 || body.length > DM_MESSAGE_MAX_CHARS) throw new Error('message-length');
  await addDoc(collection(db, 'groupMessages', groupId, 'messages'), {
    senderId: senderUid,
    kind: 'text',
    body,
    createdAt: serverTimestamp(),
  });
}

// ---------------------------------------------------------------------------
// Admin / owner moderation helpers
// (Rules are the enforcement layer: grants are owner-only, consents are
// admin-only, suspension is admin/owner, report review is admin-only.
// Every action is also logged to adminActions by these helpers.)
// ---------------------------------------------------------------------------

export async function listOpenReports(db: Firestore, max = 50): Promise<ReportRow[]> {
  const snap = await getDocs(
    query(collection(db, 'reports'), where('status', '==', 'open'), orderBy('createdAt', 'desc'), limit(max)),
  );
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      reporterId: typeof data.reporterId === 'string' ? data.reporterId : '',
      status: typeof data.status === 'string' ? data.status : 'open',
      reason: typeof data.reason === 'string' ? data.reason : 'other',
      targetType: typeof data.targetType === 'string' ? data.targetType : '',
      targetId: typeof data.targetId === 'string' ? data.targetId : '',
      targetAuthorId: typeof data.targetAuthorId === 'string' ? data.targetAuthorId : '',
      details: typeof data.details === 'string' ? data.details : '',
      createdAt: (data.createdAt as Timestamp | null) ?? null,
    };
  });
}

export async function resolveReport(
  db: Firestore,
  reportId: string,
  resolution: string,
  notifyReporterId?: string,
): Promise<void> {
  const batch = writeBatch(db);
  batch.update(doc(db, 'reports', reportId), { status: 'resolved', resolution: resolution.slice(0, 500) });
  await batch.commit();
  await logAdminAction(db, 'report-resolved', resolution.slice(0, 500), reportId);
  if (notifyReporterId) {
    await addDoc(collection(db, 'notifications', notifyReporterId, 'items'), {
      recipientId: notifyReporterId,
      type: 'report_update',
      title: 'আপনার রিপোর্ট নিষ্পত্তি হয়েছে',
      body: 'মডারেটর আপনার রিপোর্টটি পর্যালোচনা করে সমাধান করেছেন।',
      refId: reportId,
      createdAt: serverTimestamp(),
      read: false,
    });
  }
}

export async function dismissReport(db: Firestore, reportId: string, reason: string): Promise<void> {
  await updateDoc(doc(db, 'reports', reportId), { status: 'dismissed', resolution: reason.slice(0, 500) });
  await logAdminAction(db, 'report-dismissed', reason.slice(0, 500), reportId);
}

/**
 * Owner-only: create an exceptional-access grant. The rules require a
 * written reason (≥10 chars), a single admin, a single conversation,
 * and an expiry at most 72 hours after creation.
 */
export async function createDmAccessGrant(
  db: Firestore,
  ownerUid: string,
  threadId: string,
  grantedTo: string,
  reason: string,
  hours: number,
): Promise<DmAccessGrant> {
  if (reason.trim().length < 10) throw new Error('grant-reason-too-short');
  if (hours <= 0 || hours > DM_GRANT_MAX_HOURS) throw new Error('grant-hours-out-of-range');
  const grantId = `${threadId}_${grantedTo}`;
  const expiresAt = new Date(Date.now() + hours * 3600 * 1000);
  const data = {
    threadId,
    grantedTo,
    grantedBy: ownerUid,
    reason: reason.trim().slice(0, 1000),
    status: 'approved' as const,
    createdAt: serverTimestamp(),
    expiresAt,
  };
  await setDoc(doc(db, 'dmAccessGrants', grantId), data);
  await logAdminAction(db, 'dm-access-approved', reason.trim().slice(0, 500), threadId);
  const snap = await getDoc(doc(db, 'dmAccessGrants', grantId));
  const d = snap.data() ?? {};
  return {
    id: grantId,
    threadId,
    grantedTo,
    grantedBy: ownerUid,
    reason: reason.trim().slice(0, 1000),
    status: 'approved',
    createdAt: (d.createdAt as Timestamp | null) ?? null,
    expiresAt: (d.expiresAt as Timestamp | null) ?? null,
  };
}

export async function listDmAccessGrants(db: Firestore, max = 50): Promise<DmAccessGrant[]> {
  const snap = await getDocs(query(collection(db, 'dmAccessGrants'), orderBy('createdAt', 'desc'), limit(max)));
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      threadId: typeof data.threadId === 'string' ? data.threadId : '',
      grantedTo: typeof data.grantedTo === 'string' ? data.grantedTo : '',
      grantedBy: typeof data.grantedBy === 'string' ? data.grantedBy : '',
      reason: typeof data.reason === 'string' ? data.reason : '',
      status: data.status === 'revoked' ? 'revoked' : 'approved',
      createdAt: (data.createdAt as Timestamp | null) ?? null,
      expiresAt: (data.expiresAt as Timestamp | null) ?? null,
    };
  });
}

export async function revokeDmAccessGrant(db: Firestore, grantId: string, threadId: string): Promise<void> {
  await updateDoc(doc(db, 'dmAccessGrants', grantId), { status: 'revoked' });
  await logAdminAction(db, 'dm-access-revoked', grantId, threadId);
}

export function grantIsValid(grant: DmAccessGrant, nowMs = Date.now()): boolean {
  if (grant.status !== 'approved') return false;
  const exp = grant.expiresAt;
  if (!exp) return false;
  const expMs = typeof exp.toMillis === 'function' ? exp.toMillis() : (exp as unknown as Date).getTime();
  return expMs > nowMs;
}

/**
 * Read a thread under an exceptional-access grant. This is the ONLY
 * path by which a non-participant may read DM content. It verifies the
 * grant, reads the thread, then writes the audit entry AND notifies both
 * participants (owner decision: users notified afterwards unless
 * endangerment — the caller passes notify: false only when the Owner
 * has documented endangerment in the grant reason).
 */
export async function readGrantedThread(
  db: Firestore,
  adminUid: string,
  threadId: string,
  opts: { notify?: boolean } = {},
): Promise<DmThread> {
  const grantId = `${threadId}_${adminUid}`;
  const grantSnap = await getDoc(doc(db, 'dmAccessGrants', grantId));
  if (!grantSnap.exists()) throw new Error('no-grant');
  const gd = grantSnap.data();
  const grant: DmAccessGrant = {
    id: grantId,
    threadId: String(gd.threadId ?? ''),
    grantedTo: String(gd.grantedTo ?? ''),
    grantedBy: String(gd.grantedBy ?? ''),
    reason: String(gd.reason ?? ''),
    status: gd.status === 'revoked' ? 'revoked' : 'approved',
    createdAt: (gd.createdAt as Timestamp | null) ?? null,
    expiresAt: (gd.expiresAt as Timestamp | null) ?? null,
  };
  if (!grantIsValid(grant)) throw new Error('grant-invalid');
  const thread = await getDmThread(db, threadId);
  if (!thread) throw new Error('thread-missing');
  await logAdminAction(db, 'dm-access-read', `Exceptional access by ${adminUid} under grant ${grantId}: ${grant.reason.slice(0, 200)}`, threadId);
  if (opts.notify !== false) {
    for (const uid of thread.participants) {
      await addDoc(collection(db, 'notifications', uid, 'items'), {
        recipientId: uid,
        type: 'admin_notice',
        title: 'আপনার বার্তা যাচাই করা হয়েছে',
        body: 'সুরক্ষা তদন্তের জন্য অনুমোদিত প্রক্রিয়ায় আপনার বার্তার বিষয়বস্তু একজন মডারেটর পর্যালোচনা করেছেন।',
        conversationId: threadId,
        createdAt: serverTimestamp(),
        read: false,
      });
    }
    await logAdminAction(db, 'dm-access-notified', grantId, threadId);
  }
  return thread;
}

/** Admin: grant DM consent for a minor (rules: admin-only create/update). */
export async function grantDmConsent(
  db: Firestore,
  childUid: string,
  guardianUid: string,
  adminUid: string,
  reason: string,
): Promise<void> {
  await setDoc(doc(db, 'dmConsents', childUid), {
    childUid,
    guardianUid,
    status: 'granted',
    grantedBy: adminUid,
    reason: reason.slice(0, 500),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await logAdminAction(db, 'dm-consent-granted', `guardian ${guardianUid}: ${reason.slice(0, 200)}`, childUid);
}

export async function revokeDmConsent(db: Firestore, childUid: string, reason: string): Promise<void> {
  await updateDoc(doc(db, 'dmConsents', childUid), { status: 'revoked', reason: reason.slice(0, 500), updatedAt: serverTimestamp() });
  await logAdminAction(db, 'dm-consent-revoked', reason.slice(0, 200), childUid);
}

export async function getDmConsent(db: Firestore, childUid: string): Promise<DmConsent | null> {
  const snap = await getDoc(doc(db, 'dmConsents', childUid));
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    childUid: String(d.childUid ?? childUid),
    guardianUid: typeof d.guardianUid === 'string' ? d.guardianUid : '',
    status: d.status === 'revoked' ? 'revoked' : 'granted',
    grantedBy: typeof d.grantedBy === 'string' ? d.grantedBy : '',
    reason: typeof d.reason === 'string' ? d.reason : '',
  };
}

/** Admin/owner: suspend (or lift) a user's DM ability after confirmed reports. */
export async function setDmSuspended(db: Firestore, targetUid: string, suspended: boolean, reason: string): Promise<void> {
  await updateDoc(doc(db, 'users', targetUid), { dmSuspended: suspended });
  await logAdminAction(db, suspended ? 'dm-suspended' : 'dm-unsuspended', reason.slice(0, 500), targetUid);
}
