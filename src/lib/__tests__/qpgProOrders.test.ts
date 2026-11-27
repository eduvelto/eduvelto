// Question Paper Generator Phase 2 — TrxID review / Pro unlock tests.
// Validation, order building, duplicate-TrxID warning, approval
// window, Pro-status derivation, single-paper credit decrement.
import { describe, it, expect } from 'vitest';
import {
  buildQpgProOrder,
  deriveQpgProStatus,
  findDuplicateTrxIdOrders,
  nextSinglePaperUses,
  qpgApprovalWindow,
  QPG_SINGLE_PAPER_CREDIT_DAYS_PROPOSAL,
  validateQpgProOrderSubmission,
  validateSenderLast3,
  validateTrxId,
} from '../qpgProOrders';
import type { QpgProPlan } from '../questionPaper';

describe('TrxID + sender last-3 validation (client-side, strict)', () => {
  it('accepts a 10-char alphanumeric TrxID', () => {
    expect(validateTrxId('ABC1234567')).toBeNull();
    expect(validateTrxId('abc1234567')).toBeNull();
  });

  it('rejects short, long, or non-alphanumeric TrxIDs', () => {
    expect(validateTrxId('ABC123')).not.toBeNull();
    expect(validateTrxId('ABC12345678')).not.toBeNull();
    expect(validateTrxId('ABC-123456')).not.toBeNull();
    expect(validateTrxId('')).not.toBeNull();
  });

  it('sender last-3 must be exactly 3 digits', () => {
    expect(validateSenderLast3('123')).toBeNull();
    expect(validateSenderLast3('12')).not.toBeNull();
    expect(validateSenderLast3('1234')).not.toBeNull();
    expect(validateSenderLast3('12a')).not.toBeNull();
  });
});

describe('buildQpgProOrder + validateQpgProOrderSubmission', () => {
  it('builds a pending-review order at the exact plan amount', () => {
    const order = buildQpgProOrder({
      uid: 'u1',
      plan: 'monthly',
      paymentMethod: 'bkash',
      trxId: 'abc1234567',
      senderLast3: '456',
      now: new Date('2026-11-25T10:00:00Z'),
    });
    expect(order.status).toBe('pending-review');
    expect(order.amountBdt).toBe(199);
    expect(order.trxId).toBe('ABC1234567');
    expect(order.source).toBe('onsite');
    expect(order.createdAt).toBe('2026-11-25T10:00:00.000Z');
    expect(validateQpgProOrderSubmission(order)).toEqual([]);
  });

  it('rejects a wrong amount and a missing senderLast3', () => {
    const order = buildQpgProOrder({
      uid: 'u1', plan: 'per-paper', paymentMethod: 'nagad',
      trxId: 'ABC1234567', senderLast3: '789',
    });
    expect(validateQpgProOrderSubmission({ ...order, amountBdt: 199 }).length).toBeGreaterThan(0);
    expect(validateQpgProOrderSubmission({ ...order, senderLast3: '78' }).length).toBeGreaterThan(0);
  });

  it('a new order must not carry unlock fields', () => {
    const order = buildQpgProOrder({
      uid: 'u1', plan: 'monthly', paymentMethod: 'bkash',
      trxId: 'ABC1234567', senderLast3: '123',
    });
    expect(validateQpgProOrderSubmission({ ...order, proStart: 'x' }).length).toBeGreaterThan(0);
  });
});

describe('duplicate TrxID warning', () => {
  it('flags another order with the same TrxID, ignores self', () => {
    const orders = [
      { id: 'o1', trxId: 'ABC1234567' },
      { id: 'o2', trxId: 'XYZ9876543' },
      { id: 'o3', trxId: 'abc1234567' },
    ];
    expect(findDuplicateTrxIdOrders(orders, 'ABC1234567', 'o1')).toEqual([
      { id: 'o3', trxId: 'abc1234567' },
    ]);
    expect(findDuplicateTrxIdOrders(orders, 'XYZ9876543')).toEqual([
      { id: 'o2', trxId: 'XYZ9876543' },
    ]);
    expect(findDuplicateTrxIdOrders(orders, 'NOPE123456')).toEqual([]);
  });
});

describe('approval window', () => {
  it('monthly = 30 days, annual = 365, per-paper = 1 credit + 30-day window (PROPOSAL)', () => {
    const at = new Date('2026-11-25T10:00:00Z');
    const monthly = qpgApprovalWindow('monthly', at);
    expect(monthly.proEnd).toBe(new Date(at.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString());
    expect(monthly.remainingUses).toBeUndefined();
    const annual = qpgApprovalWindow('class-6-8', at);
    expect(annual.proEnd).toBe(new Date(at.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString());
    const paper = qpgApprovalWindow('per-paper', at);
    expect(paper.remainingUses).toBe(1);
    expect(QPG_SINGLE_PAPER_CREDIT_DAYS_PROPOSAL).toBe(30);
    expect(paper.proEnd).toBe(new Date(at.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString());
  });
});

describe('deriveQpgProStatus', () => {
  const now = new Date('2026-11-25T10:00:00Z');
  const future = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString();
  const past = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  it('locked when there are no approved orders', () => {
    expect(deriveQpgProStatus([], now).proUnlocked).toBe(false);
  });

  it('unlocks from an approved, unexpired monthly order (scope all)', () => {
    const s = deriveQpgProStatus(
      [{ id: 'o1', plan: 'monthly' as QpgProPlan, proStart: now.toISOString(), proEnd: future }],
      now,
    );
    expect(s.proUnlocked).toBe(true);
    expect(s.plan).toBe('monthly');
    expect(s.scope).toEqual({ kind: 'all' });
    expect(s.orderId).toBe('o1');
  });

  it('a per-class order unlocks that class only (tier-scoped PROPOSAL)', () => {
    const s = deriveQpgProStatus(
      [{ id: 'o1', plan: 'class-6-8' as QpgProPlan, proStart: now.toISOString(), proEnd: future }],
      now,
    );
    expect(s.proUnlocked).toBe(true);
    expect(s.scope).toEqual({ kind: 'classes', classIds: ['class-6', 'class-7', 'class-8'] });
  });

  it('an expired order grants nothing', () => {
    const s = deriveQpgProStatus(
      [{ id: 'o1', plan: 'monthly' as QpgProPlan, proStart: past, proEnd: past }],
      now,
    );
    expect(s.proUnlocked).toBe(false);
  });

  it('a single-paper credit is counted, not a time unlock', () => {
    const s = deriveQpgProStatus(
      [{ id: 'o1', plan: 'per-paper' as QpgProPlan, proStart: now.toISOString(), proEnd: future, remainingUses: 1 }],
      now,
    );
    expect(s.proUnlocked).toBe(false);
    expect(s.singlePaperCredits).toBe(1);
    expect(s.plan).toBe('per-paper');
  });

  it('a spent single-paper credit counts as 0', () => {
    const s = deriveQpgProStatus(
      [{ id: 'o1', plan: 'per-paper' as QpgProPlan, proStart: now.toISOString(), proEnd: future, remainingUses: 0 }],
      now,
    );
    expect(s.singlePaperCredits).toBe(0);
  });
});

describe('nextSinglePaperUses', () => {
  it('decrements 1 → 0, refuses 0 and expired credits', () => {
    const future = new Date(Date.now() + 86400000).toISOString();
    expect(nextSinglePaperUses(1, future)).toBe(0);
    expect(nextSinglePaperUses(0, future)).toBeNull();
    expect(nextSinglePaperUses(undefined, future)).toBeNull();
    expect(nextSinglePaperUses(1, new Date(Date.now() - 1000).toISOString())).toBeNull();
  });
});
