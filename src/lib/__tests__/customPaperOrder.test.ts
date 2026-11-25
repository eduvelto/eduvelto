// Done-for-you custom paper service (owner 25 Nov 10:50, "koro") —
// price ৳49/paper (70%-rule: theirs ৳150–200 → ৳45–60, set at ৳49).
// The ৳29 override (10:52) was REVERSED at 10:53 ("tahole 49 rhako")
// — ৳29 must NOT appear as the price anywhere; these tests pin ৳49.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  QPG_CUSTOM_PAPER_BDT,
  QPG_CUSTOM_PAPER_THEIR_MAX_BDT,
  QPG_CUSTOM_PAPER_THEIR_MIN_BDT,
  QPG_PRICE_CLAIM_BN,
} from '../questionPaper';
import {
  buildCustomPaperOrderText,
  emptyCustomPaperOrder,
  validateCustomPaperOrder,
  type CustomPaperOrder,
} from '../customPaperOrder';
import { resolveRouteSeo } from '../seo';

const PAGE_SRC = readFileSync(resolve(__dirname, '../../pages/CustomPaperPage.tsx'), 'utf8');
const PRICING_SRC = readFileSync(resolve(__dirname, '../../pages/PricingPage.tsx'), 'utf8');

const validOrder = (): CustomPaperOrder => ({
  ...emptyCustomPaperOrder(),
  buyerName: 'রহিম উদ্দিন',
  buyerWhatsapp: '01XXXXXXXXX',
  className: '৯ম শ্রেণি',
  subject: 'গণিত',
  chapters: 'বীজগণিত — সূচক ও লগারিদম',
  questionTypes: 'MCQ ২০টি, সৃজনশীল ৫টি',
  totalMarks: 100,
  markDistribution: 'ক-বিভাগ ২০, খ-বিভাগ ৩০, গ-বিভাগ ৫০',
  examTitle: 'বার্ষিক পরীক্ষা ২০২৬',
  institutionName: 'মডেল হাই স্কুল',
  dateNeeded: '২৮ নভেম্বর',
  instructions: 'সহজ-মাঝারি প্রশ্ন বেশি রাখবেন।',
});

describe('custom paper service pricing (owner 25 Nov 10:50 + reversal 10:53)', () => {
  it('is ৳49/paper — inside the 70%-rule range, and ৳29 is gone', () => {
    expect(QPG_CUSTOM_PAPER_BDT).toBe(49);
    expect(QPG_CUSTOM_PAPER_THEIR_MIN_BDT).toBe(150);
    expect(QPG_CUSTOM_PAPER_THEIR_MAX_BDT).toBe(200);
    // 30% of theirs: 150×0.3=45 … 200×0.3=60 — ৳49 sits inside.
    expect(QPG_CUSTOM_PAPER_BDT).toBeGreaterThanOrEqual(45);
    expect(QPG_CUSTOM_PAPER_BDT).toBeLessThanOrEqual(60);
    expect(QPG_PRICE_CLAIM_BN).toContain('৭০% ছাড়ে');
  });

  it('validates the required fields (class, subject, marks, date needed)', () => {
    expect(validateCustomPaperOrder(validOrder())).toEqual([]);
    expect(validateCustomPaperOrder({ ...validOrder(), className: ' ' })).toContain('শ্রেণি লিখুন।');
    expect(validateCustomPaperOrder({ ...validOrder(), subject: '' })).toContain('বিষয় লিখুন।');
    expect(validateCustomPaperOrder({ ...validOrder(), totalMarks: 0 })).toContain(
      'মোট নম্বর ০-এর বেশি হতে হবে।',
    );
    expect(validateCustomPaperOrder({ ...validOrder(), dateNeeded: '' })).toContain(
      'কবে নাগাদ পেপার লাগবে, তা লিখুন।',
    );
  });

  it('builds a WhatsApp order text with all fields + ৳49, never the WhatsApp number', () => {
    const text = buildCustomPaperOrderText(validOrder());
    expect(text).toContain('কাস্টম প্রশ্নপত্রের অর্ডার');
    expect(text).toContain('৯ম শ্রেণি');
    expect(text).toContain('গণিত');
    expect(text).toContain('মোট নম্বর: 100');
    expect(text).toContain('ক-বিভাগ ২০, খ-বিভাগ ৩০, গ-বিভাগ ৫০');
    expect(text).toContain('৳49');
    expect(text).toContain('TrxID');
    expect(text).not.toContain('৳29');
    // Hide-number rule: the pasted order text must never carry the
    // Eduvelto WhatsApp number (the buyer is already in that chat).
    expect(text).not.toContain('8801975225751');
    expect(text).not.toContain('wa.me/8801975225751');
    expect(text).not.toContain('wa.me/eduvelto');
  });
});

describe('custom paper page (/custom-paper)', () => {
  it('resolves real SEO (no noindex fallback)', () => {
    const seo = resolveRouteSeo('/custom-paper', 'bn');
    expect(seo).not.toBeNull();
    expect(seo?.title).toContain('কাস্টম প্রশ্নপত্র');
    expect(seo?.description).toContain('৳৪৯');
  });

  it('orders via the branded WhatsApp redirect, never the raw number', () => {
    expect(PAGE_SRC).toContain('QPG_WHATSAPP_URL');
    expect(PAGE_SRC).toContain('অর্ডারের বিবরণ কপি করুন');
    expect(PAGE_SRC).toContain('QPG_PRICE_CLAIM_BN');
    expect(PAGE_SRC).toContain('QPG_PAYMENT_NUMBER');
    expect(PAGE_SRC).not.toContain('8801975225751');
    expect(PAGE_SRC).not.toContain('wa.me/8801975225751');
    expect(PAGE_SRC).not.toContain('wa.me/eduvelto');
    // Human service, never automated; Phase 2 (25 Nov 2026): a
    // signed-in buyer's order is ALSO recorded in Firestore
    // (qpgCustomOrders) for tracking — the WhatsApp text stays the
    // primary channel, and guests still order via WhatsApp only.
    expect(PAGE_SRC).toContain('মানুষের সেবা');
    expect(PAGE_SRC).toContain('submitQpgCustomOrder');
    expect(PAGE_SRC).toContain('buildQpgCustomOrder');
  });

  it('is linked from the pricing page with the 70% display', () => {
    expect(PRICING_SRC).toContain('/custom-paper');
    expect(PRICING_SRC).toContain('কাস্টম প্রশ্নপত্র — আমরা বানিয়ে দিই');
    expect(PRICING_SRC).toContain('QPG_CUSTOM_PAPER_BDT');
    expect(PRICING_SRC).toContain('QPG_CUSTOM_PAPER_THEIR_MIN_BDT');
  });
});
