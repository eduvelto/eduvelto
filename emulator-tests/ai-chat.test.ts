/**
 * Eduvelto AI Chat — Firestore security-rules tests (branch ai-chat/ui).
 *
 * WHAT THIS PROVES (each test name states the expected result):
 *  - A conversation is readable ONLY by its owner — not another student,
 *    not a guardian, not a teacher, not an admin, NOT EVEN the owner role.
 *    No routine access to private message content for ANYONE (costing
 *    plan §7.1). Exceptional access is a documented, owner-approved,
 *    audited process — never a rule, so there is no rule to test for it.
 *  - Clients may create ONLY role 'user' messages. A client that tries
 *    to write an 'assistant' message is DENIED — so nobody can plant a
 *    fake AI answer in history.
 *  - Messages are immutable (update/delete DENIED); delete the whole
 *    conversation instead.
 *  - Usage counters only ever increase (a decrease is DENIED); platform
 *    totals are readable by any signed-in user but writable by NOBODY
 *    from a client (gateway-only via Admin SDK).
 *
 * RUN IT (needs Java 17+ for the Firestore emulator):
 *   npm run test:rules            — full suite, emulator on 8080/9099
 *   — or this file alone, on alt ports when 8080 is held by another
 *     workstream's emulator (each workstream runs its own emulator):
 *     1. start the emulator from THIS worktree on alt ports:
 *          JAVA_TOOL_OPTIONS="-Djava.net.preferIPv4Stack=true" \
 *            npx firebase emulators:start --only firestore,auth \
 *            --config firebase.alt-ports.json
 *        (firebase.alt-ports.json: firestore 8082, auth 9098 — 8080/8081
 *        are held by other workstreams' emulators)
 *     2. AI_CHAT_FIRESTORE_PORT=8082 \
 *          npx vitest run emulator-tests/ai-chat.test.ts
 *   The ports below default to 8080/9099, so `npm run test:rules`
 *   needs no env vars. The emulator loads firestore.rules from
 *   firebase.json at startup — always start it from this project
 *   directory, or the tests would run against open/wrong rules.
 *
 * These tests use @firebase/rules-unit-testing against the LOCAL
 * emulator only. They never touch a live project.
 */
import { describe, it, beforeAll, afterAll } from 'vitest';
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  addDoc,
} from 'firebase/firestore';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PROJECT_ID = 'eduvelto-rules-test';
const FIRESTORE_PORT = Number(process.env.AI_CHAT_FIRESTORE_PORT ?? 8080);
let env: RulesTestEnvironment;

const RULES_PATH = resolve(__dirname, '../firestore.rules');
const RULES_TEXT = readFileSync(RULES_PATH, 'utf8');
if (!RULES_TEXT.includes('aiConversations')) {
  throw new Error('firestore.rules does not contain the AI Chat section — wrong rules file?');
}

const NOW = new Date();
const VALID_CONVERSATION = {
  ownerId: 'student-1',
  title: 'What is photosynthesis?',
  language: 'bn',
  status: 'active',
  messageCount: 1,
  lastMessageAt: NOW,
  createdAt: NOW,
  updatedAt: NOW,
};

async function seed() {
  // Users + one conversation + messages + usage counters, written with
  // rules DISABLED (admin context) — the tests then exercise the rules.
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    for (const [uid, role] of [
      ['student-1', 'student'],
      ['student-2', 'student'],
      ['parent-1', 'parent'],
      ['admin-1', 'admin'],
      ['owner-1', 'owner'],
      ['suspended-1', 'student'],
    ] as const) {
      await setDoc(doc(db, 'users', uid), {
        displayName: uid,
        email: `${uid}@example.com`,
        role,
        language: 'bn',
        isActive: uid !== 'suspended-1',
      });
    }
    await setDoc(doc(db, 'aiConversations', 'ai-conv-1'), {
      ...VALID_CONVERSATION,
    });
    await setDoc(doc(db, 'aiConversations', 'ai-conv-1', 'messages', 'ai-msg-1'), {
      role: 'user',
      senderId: 'student-1',
      ownerId: 'student-1',
      body: 'What is photosynthesis?',
      createdAt: NOW,
    });
    await setDoc(doc(db, 'aiUsage', 'student-1', 'daily', '2026-11-21'), {
      userId: 'student-1',
      date: '2026-11-21',
      exchanges: 3,
      images: 0,
      voiceMinutes: 0,
      estimatedCostBdt: 0.48,
      inputTokens: 3600,
      outputTokens: 1200,
      updatedAt: NOW,
    });
  });
}

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    // NOTE: no `rules:` option — same reason as rules.test.ts (the
    // emulator loads firestore.rules from firebase.json at startup).
    // No `auth:` option either — authenticatedContext() works without
    // the Auth emulator; only the Firestore emulator is needed here.
    firestore: { host: '127.0.0.1', port: FIRESTORE_PORT },
  });
  await seed();
}, 120000); // 120s: first Firestore ops on a cold emulator take ~2s each in this sandbox

afterAll(async () => {
  await env.cleanup();
});

const unauth = () => env.unauthenticatedContext().firestore();
const asStudent1 = () => env.authenticatedContext('student-1').firestore();
const asStudent2 = () => env.authenticatedContext('student-2').firestore();
const asParent = () => env.authenticatedContext('parent-1').firestore();
const asSuspended = () => env.authenticatedContext('suspended-1').firestore();
const asAdmin = () => env.authenticatedContext('admin-1').firestore();
const asOwner = () => env.authenticatedContext('owner-1').firestore();

describe('AI Chat security rules', () => {
  // (a) Conversation privacy — owner-only reads.
  it('(a1) owner reading their own conversation is ALLOWED', async () => {
    await assertSucceeds(getDoc(doc(asStudent1(), 'aiConversations', 'ai-conv-1')));
  });
  it('(a2) another student reading the conversation is DENIED', async () => {
    await assertFails(getDoc(doc(asStudent2(), 'aiConversations', 'ai-conv-1')));
  });
  it('(a3) unauthenticated read of a conversation is DENIED', async () => {
    await assertFails(getDoc(doc(unauth(), 'aiConversations', 'ai-conv-1')));
  });
  it('(a4) a guardian (parent) reading the child’s conversation is DENIED', async () => {
    await assertFails(getDoc(doc(asParent(), 'aiConversations', 'ai-conv-1')));
  });
  it('(a5) an admin reading a student’s conversation is DENIED', async () => {
    await assertFails(getDoc(doc(asAdmin(), 'aiConversations', 'ai-conv-1')));
  });
  it('(a6) even the OWNER role reading a student’s conversation is DENIED', async () => {
    await assertFails(getDoc(doc(asOwner(), 'aiConversations', 'ai-conv-1')));
  });
  it('(a7) owner reading their own message is ALLOWED; another student is DENIED', async () => {
    await assertSucceeds(
      getDoc(doc(asStudent1(), 'aiConversations', 'ai-conv-1', 'messages', 'ai-msg-1')),
    );
    await assertFails(
      getDoc(doc(asStudent2(), 'aiConversations', 'ai-conv-1', 'messages', 'ai-msg-1')),
    );
  });

  // (b) Conversation creation.
  it('(b1) student creating their own conversation is ALLOWED', async () => {
    await assertSucceeds(addDoc(collection(asStudent1(), 'aiConversations'), VALID_CONVERSATION));
  });
  it('(b2) student creating a conversation owned by someone else is DENIED', async () => {
    await assertFails(
      addDoc(collection(asStudent1(), 'aiConversations'), { ...VALID_CONVERSATION, ownerId: 'student-2' }),
    );
  });
  it('(b3) student creating a conversation with an invalid status is DENIED', async () => {
    await assertFails(
      addDoc(collection(asStudent1(), 'aiConversations'), { ...VALID_CONVERSATION, status: 'deleted' }),
    );
  });
  it('(b4) suspended user creating a conversation is DENIED', async () => {
    await assertFails(
      addDoc(collection(asSuspended(), 'aiConversations'), {
        ...VALID_CONVERSATION,
        ownerId: 'suspended-1',
      }),
    );
  });
  it('(b5) owner updating only messageCount/title on their conversation is ALLOWED', async () => {
    await assertSucceeds(
      updateDoc(doc(asStudent1(), 'aiConversations', 'ai-conv-1'), {
        messageCount: 2,
        updatedAt: new Date(),
      }),
    );
  });
  it('(b6) owner changing the conversation ownerId is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asStudent1(), 'aiConversations', 'ai-conv-1'), { ownerId: 'student-2' }),
    );
  });
  it('(b7) owner deleting their own conversation is ALLOWED', async () => {
    const ref = await addDoc(collection(asStudent1(), 'aiConversations'), VALID_CONVERSATION);
    await assertSucceeds(deleteDoc(ref));
  });
  it('(b8) another student deleting the conversation is DENIED', async () => {
    await assertFails(deleteDoc(doc(asStudent2(), 'aiConversations', 'ai-conv-1')));
  });

  // (c) Messages — user-only writes, immutable, no fake AI replies.
  it('(c1) owner creating a role=user message in their conversation is ALLOWED', async () => {
    await assertSucceeds(
      addDoc(collection(asStudent1(), 'aiConversations', 'ai-conv-1', 'messages'), {
        role: 'user',
        senderId: 'student-1',
        ownerId: 'student-1',
        body: 'Can you explain it more simply?',
        createdAt: new Date(),
      }),
    );
  });
  it('(c2) client creating a role=assistant message is DENIED (no fake AI answers)', async () => {
    await assertFails(
      addDoc(collection(asStudent1(), 'aiConversations', 'ai-conv-1', 'messages'), {
        role: 'assistant',
        senderId: 'eduvelto-ai',
        ownerId: 'student-1',
        body: 'Photosynthesis is… (planted fake answer)',
        createdAt: new Date(),
      }),
    );
  });
  it('(c3) another student creating a message in someone else’s conversation is DENIED', async () => {
    await assertFails(
      addDoc(collection(asStudent2(), 'aiConversations', 'ai-conv-1', 'messages'), {
        role: 'user',
        senderId: 'student-2',
        ownerId: 'student-2',
        body: 'Hello?',
        createdAt: new Date(),
      }),
    );
  });
  it('(c4) updating a message is DENIED (messages are immutable)', async () => {
    await assertFails(
      updateDoc(doc(asStudent1(), 'aiConversations', 'ai-conv-1', 'messages', 'ai-msg-1'), {
        body: 'Edited question',
      }),
    );
  });
  it('(c5) deleting a message is DENIED (delete the whole conversation instead)', async () => {
    await assertFails(
      deleteDoc(doc(asStudent1(), 'aiConversations', 'ai-conv-1', 'messages', 'ai-msg-1')),
    );
  });
  it('(c6) an empty message body is DENIED', async () => {
    await assertFails(
      addDoc(collection(asStudent1(), 'aiConversations', 'ai-conv-1', 'messages'), {
        role: 'user',
        senderId: 'student-1',
        ownerId: 'student-1',
        body: '',
        createdAt: new Date(),
      }),
    );
  });

  // (d) Per-user daily usage counters — monotonic, owner/admin counts only.
  it('(d1) owner reading their own daily usage is ALLOWED', async () => {
    await assertSucceeds(getDoc(doc(asStudent1(), 'aiUsage', 'student-1', 'daily', '2026-11-21')));
  });
  it('(d2) another student reading someone else’s usage is DENIED', async () => {
    await assertFails(getDoc(doc(asStudent2(), 'aiUsage', 'student-1', 'daily', '2026-11-21')));
  });
  it('(d3) admin reading a student’s usage COUNTS is ALLOWED (counts only, never message content)', async () => {
    await assertSucceeds(getDoc(doc(asAdmin(), 'aiUsage', 'student-1', 'daily', '2026-11-21')));
  });
  it('(d4) increasing the counter is ALLOWED; decreasing it is DENIED (monotonic)', async () => {
    const ref = doc(asStudent1(), 'aiUsage', 'student-1', 'daily', '2026-11-21');
    await assertSucceeds(
      updateDoc(ref, { exchanges: 4, estimatedCostBdt: 0.64, updatedAt: new Date() }),
    );
    await assertFails(updateDoc(ref, { exchanges: 2, updatedAt: new Date() }));
  });
  it('(d5) deleting a usage counter is DENIED', async () => {
    await assertFails(deleteDoc(doc(asStudent1(), 'aiUsage', 'student-1', 'daily', '2026-11-21')));
  });

  // (e) Platform-wide daily totals — readable by all signed-in users, writable by nobody.
  it('(e1) signed-in user reading platform totals is ALLOWED', async () => {
    await assertSucceeds(getDoc(doc(asStudent1(), 'aiUsagePlatform', '2026-11-21')));
  });
  it('(e2) unauthenticated read of platform totals is DENIED', async () => {
    await assertFails(getDoc(doc(unauth(), 'aiUsagePlatform', '2026-11-21')));
  });
  it('(e3) client writing platform totals is DENIED (gateway-only)', async () => {
    await assertFails(
      setDoc(doc(asOwner(), 'aiUsagePlatform', '2026-11-21'), {
        date: '2026-11-21',
        totalExchanges: 1,
        totalImages: 0,
        updatedAt: new Date(),
      }),
    );
  });
});
