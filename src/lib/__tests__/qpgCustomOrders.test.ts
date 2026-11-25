// Question Paper Generator Phase 2 — Firestore-backed custom-order
// tracking tests (spec §6). Tracking only; fulfilment stays human.
import { describe, it, expect } from 'vitest';
import {
  buildQpgCustomOrder,
  canTransitionCustomOrder,
  QPG_CUSTOM_ORDER_STATUSES,
  validateQpgCustomOrder,
} from '../qpgCustomOrders';
import { QPG_CUSTOM_PAPER_BDT } from '../questionPaper';

function validOrder() {
  return buildQpgCustomOrder({
    uid: 'buyer-1',
    buyerName: 'করিম',
    className: '৯ম শ্রেণি',
    subject: 'গণিত',
    chapters: 'অধ্যায় ২',
    questionTypes: 'MCQ ১০টি',
    totalMarks: 50,
    markDistribution: 'MCQ ১০×১=১০, CQ ৪×১০=৪০',
    examTitle: 'মডেল টেস্ট',
    institutionName: 'কক্সবাজার উচ্চ বিদ্যালয়',
    dateNeeded: '2026-12-01',
    instructions: '',
  });
}

describe('buildQpgCustomOrder + validateQpgCustomOrder', () => {
  it('builds a pending_payment order at the fixed ৳49 price', () => {
    const order = validOrder();
    expect(order.status).toBe('pending_payment');
    expect(order.priceBdt).toBe(QPG_CUSTOM_PAPER_BDT);
    expect(order.priceBdt).toBe(49);
    expect(order.source).toBe('onsite');
    expect(validateQpgCustomOrder(order)).toEqual([]);
  });

  it('rejects a wrong price and a missing class/subject/date', () => {
    const order = validOrder();
    expect(validateQpgCustomOrder({ ...order, priceBdt: 29 }).length).toBeGreaterThan(0);
    expect(validateQpgCustomOrder({ ...order, className: '' }).length).toBeGreaterThan(0);
    expect(validateQpgCustomOrder({ ...order, totalMarks: 0 }).length).toBeGreaterThan(0);
    expect(validateQpgCustomOrder({ ...order, dateNeeded: '' }).length).toBeGreaterThan(0);
  });
});

describe('status transitions (forward only, one step at a time)', () => {
  it('allows pending_payment → paid → building → delivered', () => {
    expect(canTransitionCustomOrder('pending_payment', 'paid')).toBe(true);
    expect(canTransitionCustomOrder('paid', 'building')).toBe(true);
    expect(canTransitionCustomOrder('building', 'delivered')).toBe(true);
  });

  it('refuses skips and backwards moves', () => {
    expect(canTransitionCustomOrder('pending_payment', 'building')).toBe(false);
    expect(canTransitionCustomOrder('pending_payment', 'delivered')).toBe(false);
    expect(canTransitionCustomOrder('paid', 'pending_payment')).toBe(false);
    expect(canTransitionCustomOrder('delivered', 'building')).toBe(false);
    expect(canTransitionCustomOrder('delivered', 'delivered')).toBe(false);
  });

  it('lists exactly the four statuses', () => {
    expect(QPG_CUSTOM_ORDER_STATUSES.map((s) => s.id)).toEqual([
      'pending_payment', 'paid', 'building', 'delivered',
    ]);
  });
});
