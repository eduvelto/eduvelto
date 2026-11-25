// Question Paper Generator Phase 2 — page/route/theme wiring
// (source-level checks; rendered behaviour is covered by the
// Playwright probes in question-paper-generator-evidence/).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (p: string) => readFileSync(resolve(__dirname, p), 'utf8');

const APP_SRC = read('../../App.tsx');
const CSS_SRC = read('../../index.css');
const PAGE_SHELL_SRC = read('../../components/PageShell.tsx');
const SHEET_SRC = read('../../pages/SheetBuilderPage.tsx');
const BOARD_SRC = read('../../pages/SmartboardPage.tsx');
const CONTRIBUTE_SRC = read('../../pages/ContributePage.tsx');
const MY_ORDERS_SRC = read('../../pages/MyQpgOrdersPage.tsx');
const ADMIN_ORDERS_SRC = read('../../pages/AdminQpgOrdersPage.tsx');
const ADMIN_CONTRIB_SRC = read('../../pages/AdminQpgContributionsPage.tsx');
const DIALOG_SRC = read('../../components/QuestionPaperDownloadDialog.tsx');
const GENERATOR_SRC = read('../../pages/QuestionPaperGeneratorPage.tsx');

describe('Phase 2 routes (App.tsx)', () => {
  it('mounts the new pages under /:lang + the admin queues under /admin', () => {
    expect(APP_SRC).toContain('<Route path="sheet-builder" element={<SheetBuilderPage />} />');
    expect(APP_SRC).toContain('<Route path="smartboard" element={<SmartboardPage />} />');
    expect(APP_SRC).toContain('<Route path="smartboard/:boardId" element={<SmartboardPage />} />');
    expect(APP_SRC).toContain('<Route path="contribute" element={<ContributePage />} />');
    expect(APP_SRC).toContain('<Route path="my-orders" element={<MyQpgOrdersPage />} />');
    expect(APP_SRC).toContain('<Route path="qpg-orders" element={<AdminQpgOrdersPage />} />');
    expect(APP_SRC).toContain('<Route path="qpg-contributions" element={<AdminQpgContributionsPage />} />');
  });
});

describe('Phase 2 theming (§5)', () => {
  it('defines the cream/green/gold theme and PageShell accepts a className', () => {
    expect(CSS_SRC).toContain('.ev-qpg-theme');
    expect(CSS_SRC).toContain('#fdf6e9');
    expect(CSS_SRC).toContain('#14532d');
    expect(CSS_SRC).toContain('#b45309');
    expect(PAGE_SHELL_SRC).toContain('className?: string');
    // GUARD: the paper preview stays black-on-white.
    expect(CSS_SRC).toContain('.ev-qpg-theme .qpg-print-area');
  });

  it('the generator, pricing and OMR pages use the theme', () => {
    expect(GENERATOR_SRC).toContain('className="ev-qpg-theme"');
    expect(read('../../pages/PricingPage.tsx')).toContain('className="ev-qpg-theme"');
    expect(read('../../pages/OmrEvaluatorPage.tsx')).toContain('className="ev-qpg-theme"');
  });
});

describe('Sheet Builder (§1)', () => {
  it('expands chapters into exercises and shows the honest unavailable state', () => {
    expect(SHEET_SRC).toContain('qpgExercisesFor');
    expect(SHEET_SRC).toContain('QPG_EXERCISE_UNAVAILABLE_BN');
    expect(SHEET_SRC).toContain('qpgSheetQuestionsFor');
    expect(SHEET_SRC).toContain('ProtectedContentWrapper');
    expect(SHEET_SRC).toContain('QuestionPaperDownloadDialog');
  });
});

describe('Smartboard (§2)', () => {
  it('is our own Canvas 2D implementation — no Excalidraw anywhere', () => {
    // No Excalidraw import or usage (the header comment names it only
    // to record the explicit no-Excalidraw decision).
    expect(BOARD_SRC).not.toMatch(/import[^;]*[Ee]xcalidraw/);
    expect(BOARD_SRC).not.toContain('@excalidraw');
    expect(BOARD_SRC).not.toContain('<Excalidraw');
    expect(BOARD_SRC).toContain('getContext(\'2d\')');
    expect(BOARD_SRC).toContain('উত্তর দেখান');
    expect(BOARD_SRC).toContain('formatBoardTimer');
    expect(BOARD_SRC).toContain('requestFullscreen');
    expect(BOARD_SRC).toContain('createDebouncedBoardSaver');
  });

  it('keeps the board canvas white and gates PDF export + share on Pro', () => {
    expect(BOARD_SRC).toContain("fillStyle = '#ffffff'");
    expect(BOARD_SRC).toContain('PDF এক্সপোর্ট (Pro)');
    expect(BOARD_SRC).toContain('শেয়ার লিংক চালু করুন (Pro)');
  });
});

describe('Contribution (§3) + orders (§4/§6)', () => {
  it('the contribute page is Pro-gated and never promises decided rewards', () => {
    expect(CONTRIBUTE_SRC).toContain('proUnlocked');
    expect(CONTRIBUTE_SRC).toContain('Pro প্রয়োজন');
    expect(CONTRIBUTE_SRC).toContain('findPossibleDuplicates');
    expect(CONTRIBUTE_SRC).toContain('submitQpgContribution');
    expect(CONTRIBUTE_SRC).not.toContain('১০ পয়েন্ট');
  });

  it('my-orders shows the derived Pro status + both order kinds', () => {
    expect(MY_ORDERS_SRC).toContain('loadCachedProStatus');
    expect(MY_ORDERS_SRC).toContain('loadMyQpgProOrders');
    expect(MY_ORDERS_SRC).toContain('loadMyQpgCustomOrders');
  });

  it('the admin orders page verifies TrxID duplicates + coupons before deciding', () => {
    expect(ADMIN_ORDERS_SRC).toContain('findDuplicateTrxIdOrders');
    expect(ADMIN_ORDERS_SRC).toContain('loadContributionByCoupon');
    expect(ADMIN_ORDERS_SRC).toContain('decideQpgProOrder');
    expect(ADMIN_ORDERS_SRC).toContain('updateCustomOrderStatus');
  });

  it('the admin contributions page flags duplicates and requires a reject reason', () => {
    expect(ADMIN_CONTRIB_SRC).toContain('findPossibleDuplicates');
    expect(ADMIN_CONTRIB_SRC).toContain('decideQpgContribution');
    expect(ADMIN_CONTRIB_SRC).toContain('QPG_CONTRIBUTION_REJECT_REASONS');
  });
});

describe('Generator wiring (§5)', () => {
  it('loads the Pro status once per session and hands the paper to the Smartboard', () => {
    expect(GENERATOR_SRC).toContain('loadCachedProStatus');
    expect(GENERATOR_SRC).toContain('proStatus={proStatus}');
    expect(GENERATOR_SRC).toContain('savePaperForSmartboard');
    expect(GENERATOR_SRC).toContain('Smartboard-এ খুলুন');
  });

  it('the dialog consumes a single-paper credit at most once per paper', () => {
    expect(DIALOG_SRC).toContain('decrementSinglePaperCredit');
    expect(DIALOG_SRC).toContain('creditSpent');
  });
});
