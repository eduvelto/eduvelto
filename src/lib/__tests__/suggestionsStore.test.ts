// Eduvelto — Suggestion PDF Store + Supporters Wall tests
// (7-day sprint, Day 6, 26 Nov 2026,
// feature/sprint-day6-monetization-security).
//
// Guards the two honesty rules of this day:
//  (1) STORE: no verified suggestion-PDF content exists, so the
//      store shows an honest "verification in progress" state
//      only — no PDF listed, no order possible, no money moves;
//      the sales gate stays OFF. (28 Nov 2026 completeness audit:
//      the old "coming soon" chips are removed.)
//  (2) WALL + NUMBER: the Supporters Wall shows REAL donors from
//      the donations collection (never invented names/amounts),
//      and the donation number / WhatsApp number link are NEVER
//      visible to visitors — payment goes via the branded
//      eduvelto.com/whatsapp redirect only.
// Source-level assertions (same pattern as HomeHubs.test.tsx):
// the pages pull in router + Firestore imports, so the rendered
// Playwright probe is the proof they actually render.

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { legacyRedirectTarget } from '../langRouting';
import { SUGGESTION_PDF_SALES_ENABLED } from '../orders';

const STORE_SRC = readFileSync(resolve(__dirname, '../../pages/SuggestionsPage.tsx'), 'utf8');
const SUPPORT_SRC = readFileSync(resolve(__dirname, '../../pages/SupportPage.tsx'), 'utf8');
const METHODS_SRC = readFileSync(resolve(__dirname, '../../components/DonationMethods.tsx'), 'utf8');
const CARD_SRC = readFileSync(resolve(__dirname, '../../components/SuggestionPdfCard.tsx'), 'utf8');
const WALL_SRC = readFileSync(resolve(__dirname, '../../components/SupportersWall.tsx'), 'utf8');
const APP_SRC = readFileSync(resolve(__dirname, '../../App.tsx'), 'utf8');
const ADMISSIONS_SRC = readFileSync(resolve(__dirname, '../../pages/AdmissionsIndexPage.tsx'), 'utf8');
const FOOTER_SRC = readFileSync(resolve(__dirname, '../../components/Footer.tsx'), 'utf8');

// The owner's numbers — asserted ABSENT from every visitor-facing
// component below. They live only in lib (owner record) and in
// tests; they must never reach the rendered DOM.
const HIDDEN = ['8801754267001', '8801975225751', 'wa.me/880', 'wa.me/eduvelto'];

describe('Suggestion PDF Store — honest verification-in-progress state only', () => {
  it('the sales gate stays OFF (no price change, no flip)', () => {
    expect(SUGGESTION_PDF_SALES_ENABLED).toBe(false);
  });

  it('the store says plainly that no PDF is for sale yet', () => {
    expect(STORE_SRC).toContain('এখনো কোনো সাজেশন PDF বিক্রির জন্য তৈরি নয়');
    expect(STORE_SRC).toContain('এখন কোনো পেমেন্ট নেওয়া হচ্ছে না');
    expect(STORE_SRC).toContain('যাচাই চলছে');
  });

  it('the store lists planned categories only — no PDF, no download, no invented content', () => {
    for (const cat of ['বিসিএস', 'ব্যাংক', 'প্রাথমিক শিক্ষক', 'এনটিআরসিএ', 'ভর্তি পরীক্ষা']) {
      expect(STORE_SRC).toContain(cat);
    }
    expect(STORE_SRC).toContain('পরিকল্পিত ক্যাটাগরি');
    expect(STORE_SRC).toContain('৳৯৯–৳১৪৯');
    expect(STORE_SRC).not.toMatch(/href="[^"]*\.pdf"/i);
    expect(STORE_SRC).not.toContain('ডাউনলোড করুন');
  });

  it('the store renders the gated SuggestionPdfCard (single source of the sales gate)', () => {
    expect(STORE_SRC).toContain("import SuggestionPdfCard from '../components/SuggestionPdfCard'");
    expect(STORE_SRC).toContain('<SuggestionPdfCard />');
    expect(STORE_SRC).toContain('<div data-suggestions-store>');
  });

  it('no competitor name anywhere in the store', () => {
    for (const banned of ['Eproshnobank', 'Proshnobanai', 'proshnobanai']) {
      expect(STORE_SRC).not.toContain(banned);
    }
  });

  it('the store is routed under /:lang + the bare URL redirects (client + server agree)', () => {
    expect(APP_SRC).toContain('<Route path="suggestions" element={<SuggestionsPage />} />');
    expect(APP_SRC).toContain('<Route path="/suggestions" element={<LegacyRedirect />} />');
    expect(legacyRedirectTarget('/suggestions')).toBe('/bn/suggestions');
    expect(legacyRedirectTarget('/suggestions', 'en')).toBe('/en/suggestions');
  });

  it('the card is on the admissions hub too (was missing there)', () => {
    expect(ADMISSIONS_SRC).toContain("import SuggestionPdfCard from '../components/SuggestionPdfCard'");
    expect(ADMISSIONS_SRC).toContain('<SuggestionPdfCard />');
  });

  it('the footer links the store', () => {
    expect(FOOTER_SRC).toContain('<Link to="/suggestions">');
  });
});

describe('Supporters Wall — real donors only', () => {
  it('the wall is wired into the public support page', () => {
    expect(SUPPORT_SRC).toContain("import SupportersWall from '../components/SupportersWall'");
    expect(SUPPORT_SRC).toContain('<SupportersWall />');
    expect(APP_SRC).toContain('<Route path="support" element={<SupportPage />} />');
  });

  it('the wall reads real donors from the donations collection — no invented names or amounts', () => {
    expect(WALL_SRC).toContain('listSupporters');
    expect(WALL_SRC).not.toContain('useState<Supporter[]>([');
    // Honest empty state when nobody has donated yet.
    expect(WALL_SRC).toContain('এখনো কোনো সহায়তা রেকর্ড হয়নি');
    expect(WALL_SRC).toContain('No support has been recorded yet');
    // TrxIDs are never rendered.
    expect(WALL_SRC).not.toContain('trxId');
  });
});

describe('donation number — never in source, modal shows it on owner order', () => {
  // Rule as of 27 Nov 2026 20:43 (owner order): the numbers must
  // never appear as LITERALS in visitor-facing component source
  // (they come from lib/donations.ts data only), and the FULL
  // support page still hides them. EXCEPTION: the support modal
  // (compact) shows the bKash/Nagad number directly with a Copy
  // Number button, and a "পেমেন্ট করে WhatsApp-এ জানান" button
  // below — the owner explicitly ordered that. Bank Transfer was
  // NOT added (owner dropped it 20:48); no bank number is in code.
  it('no visitor-facing component contains the numbers or a raw wa.me link', () => {
    for (const src of [SUPPORT_SRC, METHODS_SRC, CARD_SRC, STORE_SRC]) {
      for (const hidden of HIDDEN) {
        expect(src, `leaked ${hidden}`).not.toContain(hidden);
      }
    }
  });

  it('payment goes via the branded /whatsapp redirect, not a raw link', () => {
    expect(METHODS_SRC).toContain('to="/whatsapp"');
    expect(SUPPORT_SRC).toContain('to="/whatsapp"');
    expect(CARD_SRC).toContain('to="/whatsapp"');
    for (const src of [METHODS_SRC, SUPPORT_SRC, CARD_SRC]) {
      expect(src).not.toContain('https://wa.me');
    }
  });

  it('the modal shows bKash + Nagad only, with number + copy + WhatsApp-notify', () => {
    expect(METHODS_SRC).toContain("m.id === 'bkash' || m.id === 'nagad'");
    expect(METHODS_SRC).toContain('<CopyNumberButton number={method.number} />');
    expect(METHODS_SRC).toContain('পেমেন্ট করে WhatsApp-এ জানান');
    expect(METHODS_SRC).toContain('Personal • Send Money');
  });
});
