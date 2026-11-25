// Question Paper Generator — landing page SEO, print layout, and the
// PrintScreen clipboard-clear deterrence (owner 25 Nov 08:48 / 09:02).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { resolveRouteSeo } from '../seo';

const WRAPPER_SRC = readFileSync(
  resolve(__dirname, '../../components/ProtectedContentWrapper.tsx'),
  'utf8',
);
const PRINT_CSS = readFileSync(
  resolve(__dirname, '../../components/question-paper-print.css'),
  'utf8',
);
const LANDING_SRC = readFileSync(
  resolve(__dirname, '../../pages/QuestionMakerLandingPage.tsx'),
  'utf8',
);
const GENERATOR_SRC = readFileSync(
  resolve(__dirname, '../../pages/QuestionPaperGeneratorPage.tsx'),
  'utf8',
);

describe('SEO landing page (/question-maker)', () => {
  it('resolves real SEO (no noindex fallback) for /question-maker', () => {
    const seo = resolveRouteSeo('/question-maker', 'bn');
    expect(seo).not.toBeNull();
    expect(seo?.title).toContain('প্রশ্নপত্র তৈরি করুন');
    expect(seo?.description).toContain('৩টি পেপার');
  });

  it('resolves SEO for the generator tool page too', () => {
    const seo = resolveRouteSeo('/question-paper-generator', 'en');
    expect(seo).not.toBeNull();
    expect(seo?.title).toContain('Question Paper Generator');
  });

  it('the landing page links to the generator and states the honest limits', () => {
    expect(LANDING_SRC).toContain('/question-paper-generator');
    expect(LANDING_SRC).toContain('৩৫টি');
    expect(LANDING_SRC).toContain('পুরো প্রশ্ন ব্যাংক ডাউনলোড করা যায় না');
    expect(LANDING_SRC).toContain('পুরোপুরি না');
  });
});

describe('print layout (A4, client-side)', () => {
  it('declares A4 @page and the exact footer credit', () => {
    expect(PRINT_CSS).toContain('@page');
    expect(PRINT_CSS).toContain('size: A4');
    expect(PRINT_CSS).toContain('Powered by Eduvelto.com — বাংলাদেশের ফ্রি শিক্ষা প্ল্যাটফর্ম');
  });

  it('never prints a blurred/blacked-out preview', () => {
    expect(PRINT_CSS).toContain('.qpg-protected-content');
    expect(PRINT_CSS).toContain('filter: none !important');
    expect(PRINT_CSS).toContain('.qpg-protected-obscured');
    expect(PRINT_CSS).toContain('display: none !important');
  });

  it('the generator page wires the print area, footer and print button', () => {
    expect(GENERATOR_SRC).toContain('qpg-print-area');
    expect(GENERATOR_SRC).toContain('qpg-print-footer');
    expect(GENERATOR_SRC).toContain('window.print()');
    expect(GENERATOR_SRC).toContain('question-paper-print.css');
    // The print button is honest: it prints the preview, not the full paper.
    expect(GENERATOR_SRC).toContain('পুরো পেপার PDF ডাউনলোড করুন');
  });
});

describe('PrintScreen clipboard-clear deterrence', () => {
  it('clears the clipboard best-effort on PrintScreen, never breaking the flow', () => {
    expect(WRAPPER_SRC).toContain("navigator.clipboard?.writeText('')");
    expect(WRAPPER_SRC).toContain('catch');
  });

  it('blur stays 14px (owner instruction — NOT 12px)', () => {
    expect(WRAPPER_SRC).toContain('blur(14px)');
    expect(WRAPPER_SRC).not.toContain('blur(12px)');
  });

  it('never claims full screenshot prevention', () => {
    expect(WRAPPER_SRC).not.toMatch(/screenshot-proof|screenshot proof/i);
    expect(WRAPPER_SRC).toContain('cannot be blocked');
  });
});

describe('A-Z design model on the landing page (inspiration only, 25 Nov 10:14)', () => {
  const CSS = readFileSync(resolve(__dirname, '../../index.css'), 'utf8');
  it('two-column hero with a real paper mockup (verified sample question)', () => {
    expect(LANDING_SRC).toContain('ev-qm-hero');
    expect(LANDING_SRC).toContain('ev-qm-mockup');
    // The mockup shows REAL verified content, not invented questions.
    expect(LANDING_SRC).toContain('Choose the passive form of the sentence');
    expect(LANDING_SRC).toContain('Powered by Eduvelto.com');
    expect(CSS).toContain('.ev-qm-hero');
    expect(CSS).toContain('grid-template-columns: 1.1fr 0.9fr');
  });

  it('differentiators card names the three things they do not have', () => {
    expect(LANDING_SRC).toContain('আমাদের বিশেষত্ব');
    expect(LANDING_SRC).toContain('সেট শাফলার');
    expect(LANDING_SRC).toContain('ব্রাউজার OMR মূল্যায়ন');
    expect(LANDING_SRC).toContain('ফ্রি জলছাপযুক্ত PDF');
    expect(LANDING_SRC).toContain('/omr-evaluator');
  });

  it('scoped CSS: warm cream hero, dark-green primary, gold highlight', () => {
    expect(CSS).toContain('#fdf6e9');
    expect(CSS).toContain('#14532d');
    expect(CSS).toContain('#b45309');
    // Scoped to the landing page only — no site-wide theme change.
    expect(CSS).not.toMatch(/body\s*\{[^}]*#fdf6e9/);
  });
});

describe('A-Z MVP adds wired in the generator + dialog', () => {
  const DIALOG_SRC = readFileSync(
    resolve(__dirname, '../../components/QuestionPaperDownloadDialog.tsx'),
    'utf8',
  );
  const DOCX_SRC = readFileSync(resolve(__dirname, '../questionPaperDocx.ts'), 'utf8');
  it('template selector + standard checker are in the setup step', () => {
    expect(GENERATOR_SRC).toContain('টেমপ্লেট (নামকরা পেপার');
    expect(GENERATOR_SRC).toContain('QPG_PAPER_TEMPLATES');
    expect(GENERATOR_SRC).toContain('applyTemplate');
    expect(GENERATOR_SRC).toContain('মান যাচাই (Standard Checker)');
    expect(GENERATOR_SRC).toContain('standardCheck.passes');
  });

  it('per-question replace UI exists (selected questions only)', () => {
    expect(GENERATOR_SRC).toContain('বদলান');
    expect(GENERATOR_SRC).toContain('replacingId');
    expect(GENERATOR_SRC).toContain('replaceQpgQuestion');
    expect(GENERATOR_SRC).toContain('এই প্রশ্নটি নিন');
  });

  it('DOCX download (Pro, derived status) exists in the dialog; docx loads dynamically only', () => {
    expect(DIALOG_SRC).toContain('Word (.docx) ডাউনলোড (Pro)');
    expect(DIALOG_SRC).toContain('এডিটেবল টেক্সট (.docx)');
    expect(DIALOG_SRC).toContain('downloadCleanPaperDocx');
    expect(DIALOG_SRC).toContain('downloadCleanPaperPdf');
    // Phase 2: Pro status is DERIVED from approved orders (cached
    // per session), never hard-coded false.
    expect(DIALOG_SRC).toContain('loadCachedProStatus');
    expect(DIALOG_SRC).toContain('proStatus');
    expect(DIALOG_SRC).not.toContain('const proUnlocked = false');
    expect(DOCX_SRC).toContain("await import('docx')");
    expect(DOCX_SRC).not.toMatch(/^import .* from 'docx'/m);
    expect(DOCX_SRC).toContain('proUnlocked');
  });

  it('TrxID form submits to Firestore (Phase 2); no time promise in the dialog', () => {
    expect(DIALOG_SRC).toContain('submitQpgProOrder');
    expect(DIALOG_SRC).toContain('senderLast3');
    expect(DIALOG_SRC).toContain('TrxID জমা দিন');
    expect(DIALOG_SRC).toContain('permission-denied');
    // §8.2 undecided: no turnaround promise may appear in the UI.
    expect(DIALOG_SRC).not.toContain('১২ ঘণ্টা');
    expect(DIALOG_SRC).not.toContain('12 ঘণ্টা');
  });

  it('free quota uses Firestore qpgUsage for signed-in users (Phase 2)', () => {
    expect(DIALOG_SRC).toContain('recordQpgFreeDownload');
    expect(DIALOG_SRC).toContain('getQpgUsage');
    // Guests still keep the local demo counter.
    expect(DIALOG_SRC).toContain('recordDemoFreeDownload');
  });
});
