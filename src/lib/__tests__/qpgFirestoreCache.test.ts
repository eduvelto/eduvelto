// Eduvelto — Question Paper Generator Phase 2: session-cache +
// Smartboard handoff helpers (pure sessionStorage logic, no Firestore
// reads in these tests — the Firestore path is covered by the
// emulator rules suite + the dialog/page probes).

import { describe, it, expect, beforeEach } from 'vitest';
import {
  QPG_PRO_STATUS_CACHE_KEY,
  clearCachedProStatus,
  loadCachedProStatus,
} from '../qpgFirestore';
import { QPG_PRO_LOCKED, type QpgProStatus } from '../qpgProOrders';
import {
  readPaperForSmartboard,
  savePaperForSmartboard,
} from '../qpgSmartboard';
import {
  QPG_VERIFIED_POOL,
  buildQpgPaper,
  defaultPaperSetup,
} from '../questionPaper';

// The unit suite runs in node (no sessionStorage) — stub a minimal
// one so the helpers exercise their real read/write paths.
function installSessionStorageStub() {
  const store: Record<string, string> = {};
  (globalThis as unknown as Record<string, unknown>).sessionStorage = {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => {
      store[k] = v;
    },
    removeItem: (k: string) => {
      delete store[k];
    },
    clear: () => {
      for (const k of Object.keys(store)) delete store[k];
    },
  };
  return store;
}

const UNLOCKED: QpgProStatus = {
  proUnlocked: true,
  plan: 'monthly',
  expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
  singlePaperCredits: 0,
  scope: { kind: 'all' },
  orderId: 'order-1',
};

describe('loadCachedProStatus', () => {
  beforeEach(() => {
    installSessionStorageStub();
  });

  it('guests never read Firestore — always locked', async () => {
    const status = await loadCachedProStatus(
      // No Firestore call happens for guests; any object would do.
      null as never,
      'guest',
    );
    expect(status).toEqual(QPG_PRO_LOCKED);
  });

  it('a fresh cached status is returned without a Firestore read', async () => {
    const store = installSessionStorageStub();
    store[QPG_PRO_STATUS_CACHE_KEY] = JSON.stringify({
      status: UNLOCKED,
      fetchedAt: Date.now(),
    });
    const status = await loadCachedProStatus(
      // If the cache were missed, this dummy db would throw.
      null as never,
      'uid-1',
    );
    expect(status).toEqual(UNLOCKED);
  });

  it('a stale cache (> 5 min) is ignored and falls through to Firestore', async () => {
    const store = installSessionStorageStub();
    store[QPG_PRO_STATUS_CACHE_KEY] = JSON.stringify({
      status: UNLOCKED,
      fetchedAt: Date.now() - 6 * 60 * 1000,
    });
    await expect(loadCachedProStatus(null as never, 'uid-1')).rejects.toThrow();
  });

  it('clearCachedProStatus drops the entry so the next load re-reads', async () => {
    const store = installSessionStorageStub();
    store[QPG_PRO_STATUS_CACHE_KEY] = JSON.stringify({
      status: UNLOCKED,
      fetchedAt: Date.now(),
    });
    clearCachedProStatus();
    expect(store[QPG_PRO_STATUS_CACHE_KEY]).toBeUndefined();
    await expect(loadCachedProStatus(null as never, 'uid-1')).rejects.toThrow();
  });
});

describe('Smartboard paper handoff (sessionStorage)', () => {
  beforeEach(() => {
    installSessionStorageStub();
  });

  it('reading with nothing saved returns null', () => {
    expect(readPaperForSmartboard()).toBeNull();
  });

  it('save → read returns the paper; a second read returns null (consumed)', () => {
    const paper = buildQpgPaper({
      setup: defaultPaperSetup({
        title: 'Test',
        subject: 'English',
        classLabel: 'Honours',
        questionCount: 1,
        marksPerQuestion: 1,
        timeMinutes: 1,
        sectionHeading: 'Test',
      }),
      questions: [QPG_VERIFIED_POOL[0]],
      isCustomVariant: true,
      kind: 'chapter-paper',
      patternLabelBn: 'শিট',
      patternLabelEn: 'Sheet',
    });
    expect(savePaperForSmartboard(paper)).toBe(true);
    const read = readPaperForSmartboard();
    expect(read?.id).toBe(paper.id);
    expect(read?.questions).toHaveLength(1);
    expect(readPaperForSmartboard()).toBeNull();
  });
});
