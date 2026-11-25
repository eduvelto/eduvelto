// Eduvelto — pre-rendered initial data for the public Question Maker
// pages (Spark rule, parent 25 Nov 09:18).
//
// Public pages (/:lang/question-maker, /:lang/pricing) must read from
// `window.__INITIAL_DATA__` — data pre-rendered at BUILD time — with
// ZERO client Firestore reads: only the data that page needs is
// embedded, never the whole library on every page.
//
// How it works in this SPA: the content below is static build-time
// data (bundled, no Firestore import anywhere in these pages). On
// first import it is published to `window.__INITIAL_DATA__` under its
// page key, and the pages read it back through getInitialData() — so
// the read path is the pre-rendered store, with the static object as
// the fallback when no pre-render exists (e.g. tests, dev). The
// generator's own authenticated flow is NOT covered by this — it uses
// the sessionStorage chapter-question cache (Spark rules, Turn 32).

import {
  QPG_CHEAPEST_ANNUAL_BDT,
  QPG_FREE_MONTHLY_LIMIT,
  QPG_PRICE_CLAIM_BN,
  QPG_PRICE_TIERS,
  QPG_WHATSAPP_URL,
  type QpgPriceTier,
} from './questionPaper';

export interface QpgInitialData {
  freeMonthlyLimit: number;
  proPerPaperBdt: number;
  proMonthlyBdt: number;
  /** PRICING FINAL (owner 25 Nov 09:34): every tier is 30% of
   *  Eproshnobank's equivalent (70% off), rounded to the nearest ৳10.
   *  No single all-in-one yearly tier exists anymore. */
  pricing: QpgPriceTier[];
  /** Cheapest annual tier (for the dialog's Pro summary). */
  cheapestAnnualBdt: number;
  /** The only honest price claim. */
  priceClaimBn: string;
  /** Payment-confirmation WhatsApp (owner 25 Nov 10:16–10:17, FINAL):
   *  https://wa.me/eduvelto — username @eduvelto. */
  whatsappUrl: string;
  verifiedQuestionCount: number;
  verifiedBatchLabelBn: string;
}

export const QUESTION_MAKER_INITIAL_DATA: QpgInitialData = {
  freeMonthlyLimit: QPG_FREE_MONTHLY_LIMIT,
  proPerPaperBdt: 49,
  proMonthlyBdt: 199,
  pricing: QPG_PRICE_TIERS,
  cheapestAnnualBdt: QPG_CHEAPEST_ANNUAL_BDT,
  priceClaimBn: QPG_PRICE_CLAIM_BN,
  whatsappUrl: QPG_WHATSAPP_URL,
  verifiedQuestionCount: 35,
  verifiedBatchLabelBn: 'BCS ইংরেজি ব্যাচ ১ (মালিক-যাচাইকৃত, ২২ নভেম্বর ২০২৬)',
};

// NOTE (merge 25 Nov 2026): this declaration MUST match the one in
// src/lib/initialData.ts (`__INITIAL_DATA__?: unknown`) — interface
// merging requires identical types. Use a local cast where a record
// shape is needed; do not widen the global declaration.
declare global {
  interface Window {
    __INITIAL_DATA__?: unknown;
  }
}

/** Publish the build-time data to window.__INITIAL_DATA__ (idempotent). */
export function publishQuestionMakerInitialData(): QpgInitialData {
  if (typeof window !== 'undefined') {
    const store = (window.__INITIAL_DATA__ ??= {}) as Record<string, unknown>;
    store['question-maker'] ??= QUESTION_MAKER_INITIAL_DATA;
    store['pricing'] ??= QUESTION_MAKER_INITIAL_DATA;
  }
  return QUESTION_MAKER_INITIAL_DATA;
}

/** Read a page's pre-rendered data (static fallback when absent). */
export function getInitialData(pageKey: 'question-maker' | 'pricing'): QpgInitialData {
  if (typeof window !== 'undefined') {
    const raw = window.__INITIAL_DATA__ as Record<string, unknown> | undefined;
    const stored = raw?.[pageKey] as QpgInitialData | undefined;
    if (stored && typeof stored.freeMonthlyLimit === 'number') return stored;
  }
  return QUESTION_MAKER_INITIAL_DATA;
}
