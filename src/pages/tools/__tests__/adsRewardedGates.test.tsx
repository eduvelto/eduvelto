// Eduvelto — ads rollout B2: one rewarded gate per download action
// (27 Nov 2026).
//
// Source-level guard: every download flow that takes a file away has
// AT MOST ONE rewarded gate, and each gate in a multi-gate file guards
// a DIFFERENT download (distinct filename / handler). A second gate on
// the same download would stack two rewarded ads on one action, which
// the owner order forbids. Render checks below prove the gate is absent
// until a result exists (the tool itself is never blocked behind an ad).
//
// The 15s gates (B3) are covered by the same map (ONE_GATE_15S /
// TWO_GATE_15S below, plus the finance 15s fix and the Lab history-CSV
// 15s fix). B2 files must all use the 30s default (no
// durationSeconds={15} may appear in a B2 file).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import React from 'react';

vi.mock('../../../lib/auth', () => ({
  useAuth: () => ({ user: null, profile: null, saveProfile: vi.fn(() => Promise.resolve()) }),
}));

const TOOLS_DIR = join(__dirname, '..');
const PAGES_DIR = join(__dirname, '../..');
const COMPONENTS_DIR = join(__dirname, '../../..', 'components');

function src(dir: string, file: string): string {
  const raw = readFileSync(join(dir, file), 'utf8');
  // Strip comments first: header comments name <RewardedAdButton> without
  // mounting one (e.g. CertificateMakerTool, Lab) and would inflate the count.
  // Only real comments are stripped — a /* inside a string literal such as
  // accept="image/*" (BackgroundRemoverTool) must NOT start a comment span.
  return raw
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/^\s*\/\*[\s\S]*?\*\//gm, '')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
}

function gateCount(text: string): number {
  const direct = (text.match(/<RewardedAdButton/g) ?? []).length;
  const summary = (text.match(/<SummaryDownload/g) ?? []).length;
  return direct + summary;
}

/** One gate per file, 30s default (no explicit 15s). */
const ONE_GATE_30S = [
  'PdfSplitterTool.tsx',
  'PdfCompressorTool.tsx',
  'PdfPageExtractorTool.tsx',
  'PdfPageReorderTool.tsx',
  'PdfWatermarkTool.tsx',
  'PdfPasswordProtectorTool.tsx',
  'PdfPageRemoverTool.tsx',
  'TextToPdfTool.tsx',
  'VideoTrimmerTool.tsx',
  'VideoFormatConverterTool.tsx',
  'VideoToAudioTool.tsx',
  'PdfMergerTool.tsx',
  'PdfRotateTool.tsx',
  'PdfPageNumberTool.tsx',
  'InvoiceGeneratorTool.tsx',
  'JpgToPdfTool.tsx',
  'ImageToPdfTool.tsx',
  'CertificateMakerTool.tsx',
  'AssignmentCoverTool.tsx',
  'AcademicCalendarTool.tsx',
  'ExamSeatPlanTool.tsx',
  'StudyRoutineTool.tsx',
  'PrintablePaperTool.tsx',
  'VideoCompressorTool.tsx',
];

/** One gate per file, 15s (ads rollout B3). */
const ONE_GATE_15S = [
  'ImageCompressorTool.tsx',
  'ImageResizerTool.tsx',
  'ImageCropperTool.tsx',
  'JpgToPngTool.tsx',
  'PngToJpgTool.tsx',
  'WebpConverterTool.tsx',
  'HeicToJpgTool.tsx',
  'ImageWatermarkMakerTool.tsx',
  'ImageRotateFlipTool.tsx',
  'ImageFilterTool.tsx',
  'FaviconGeneratorTool.tsx',
  'MemeGeneratorTool.tsx',
  'ExifViewerRemoverTool.tsx',
  'CsvToExcelTool.tsx',
  'CharacterCounterTool.tsx',
  'TextSorterTool.tsx',
  'StopwatchTool.tsx',
  'RandomNumberTool.tsx',
  'FlashcardMakerTool.tsx',
  'ExcelToCsvTool.tsx',
  'JsonToCsvTool.tsx',
  'XmlFormatterTool.tsx',
  'MarkdownToHtmlTool.tsx',
  'HtmlToMarkdownTool.tsx',
];

/** Two gates per file, 15s — each guards a DIFFERENT download. */
const TWO_GATE_15S: Record<string, string[]> = {
  'ImageColorPickerTool.tsx': ['eduvelto-palette.txt', 'eduvelto-palette.css'],
  'QrCodeGeneratorTool.tsx': ['eduvelto-qr.png', 'downloadSvg'],
  'BarcodeGeneratorTool.tsx': ['downloadPng', 'downloadSvg'],
  'BackgroundRemoverTool.tsx': ['background-removed.png', 'background-removed-ai.png'],
};

/** Finance summaries (B3 duration fix: all 15s now): one gate per
 *  summary, three per tabbed tool — each tab is its own download
 *  action with its own filename. */
const SUMMARY_GATES: Record<string, { count: number; filenames: string[] }> = {
  'MortgageTool.tsx': { count: 1, filenames: ['mortgage-summary.txt'] },
  'CompoundInterestTool.tsx': { count: 1, filenames: ['compound-interest-summary.txt'] },
  'CreditCardPayoffTool.tsx': { count: 1, filenames: ['credit-card-payoff-summary.txt'] },
  'SalaryToHourlyTool.tsx': { count: 1, filenames: ['salary-to-hourly-summary.txt'] },
  'RetirementSavingsTool.tsx': { count: 1, filenames: ['retirement-savings-summary.txt'] },
  'IncomeTaxTool.tsx': { count: 1, filenames: ['income-tax-summary.txt'] },
  'BankEmiDpsFdrTool.tsx': {
    count: 3,
    filenames: ['bank-emi-summary.txt', 'bank-dps-summary.txt', 'bank-fdr-summary.txt'],
  },
  'DiscountVatProfitTool.tsx': {
    count: 3,
    filenames: ['discount-summary.txt', 'vat-summary.txt', 'profit-summary.txt'],
  },
  'ExpenseSplitterTool.tsx': { count: 1, filenames: ['expense-split-summary.txt'] },
  'BreakEvenTool.tsx': { count: 1, filenames: ['break-even-summary.txt'] },
};

describe('ads rollout: one rewarded gate per download action', () => {
  it('each 30s tool file has exactly one gate, at the 30s default', () => {
    for (const file of ONE_GATE_30S) {
      const text = src(TOOLS_DIR, file);
      expect(gateCount(text), `${file}: exactly one rewarded gate`).toBe(1);
      expect(text, `${file}: no 15s duration in a 30s file`).not.toContain('durationSeconds={15}');
    }
  });

  it('each 15s tool file has exactly one gate, at 15s', () => {
    for (const file of ONE_GATE_15S) {
      const text = src(TOOLS_DIR, file);
      expect(gateCount(text), `${file}: exactly one rewarded gate`).toBe(1);
      expect(text, `${file}: the gate is 15s`).toContain('durationSeconds={15}');
      expect(text, `${file}: no 30s gate`).not.toContain('durationSeconds={30}');
    }
  });

  it('each two-download 15s tool has exactly two gates, each for its own file', () => {
    for (const [file, markers] of Object.entries(TWO_GATE_15S)) {
      const text = src(TOOLS_DIR, file);
      expect(gateCount(text), `${file}: exactly two rewarded gates`).toBe(2);
      expect((text.match(/durationSeconds=\{15\}/g) ?? []).length, `${file}: both gates 15s`).toBe(2);
      for (const marker of markers) {
        expect(text, `${file}: guards ${marker}`).toContain(marker);
      }
    }
  });

  it('PdfToJpg has one gate source line, rendered once per page row', () => {
    const text = src(TOOLS_DIR, 'PdfToJpgTool.tsx');
    expect(gateCount(text)).toBe(1);
    expect(text).toContain('durationSeconds={15}');
    expect(text).toContain('results.map');
    expect(text).toContain('rowRefs');
  });

  it('Smartboard PNG export has exactly one 15s gate; Pro exports have none', () => {
    const text = src(PAGES_DIR, 'SmartboardPage.tsx');
    expect(gateCount(text)).toBe(1);
    expect(text).toContain('durationSeconds={15}');
    expect(text).toContain('exportPng');
    expect(text).toContain('exportPdf');
  });

  it('Lab history CSV is 15s and the summary PDF stays 30s', () => {
    const text = src(TOOLS_DIR, 'LabTestResultCheckerTool.tsx');
    expect(gateCount(text)).toBe(2);
    expect((text.match(/durationSeconds=\{15\}/g) ?? []).length).toBe(1);
    expect(text).not.toContain('durationSeconds={30}');
    expect(text).toContain('handleExportHistory');
    expect(text).toContain('onSummaryPdf');
  });

  it('every finance SummaryDownload site is 15s', () => {
    for (const [file, expected] of Object.entries(SUMMARY_GATES)) {
      const text = src(TOOLS_DIR, file);
      expect(gateCount(text), `${file}: gate count`).toBe(expected.count);
      expect(
        (text.match(/<SummaryDownload[^>]*durationSeconds=\{15\}/g) ?? []).length,
        `${file}: all SummaryDownload sites 15s`,
      ).toBe(expected.count);
    }
  });

  it('LifePdfToolsPage has exactly two gates for its two PDF downloads', () => {
    const text = src(PAGES_DIR, 'LifePdfToolsPage.tsx');
    expect(gateCount(text)).toBe(2);
    expect(text).toContain('textPdf.blob');
    expect(text).toContain('mergedPdf.blob');
  });

  it('QPG download dialog has exactly one gate, on the free PDF only', () => {
    const text = src(COMPONENTS_DIR, 'QuestionPaperDownloadDialog.tsx');
    expect(gateCount(text)).toBe(1);
    // The Pro clean PDF / DOCX buttons are payment-gated only — no
    // rewarded gate may ever sit on them.
    expect(text).toContain('onCleanPdfDownload');
    expect(text).toContain('onDocxDownload');
    const gateIdx = text.indexOf('<RewardedAdButton');
    const cleanIdx = text.indexOf('onCleanPdfDownload');
    expect(gateIdx).toBeGreaterThan(-1);
    expect(cleanIdx).toBeGreaterThan(-1);
  });

  it('each finance summary gate guards its own filename (no shared gate)', () => {
    for (const [file, expected] of Object.entries(SUMMARY_GATES)) {
      const text = src(TOOLS_DIR, file);
      expect(gateCount(text), `${file}: gate count`).toBe(expected.count);
      for (const name of expected.filenames) {
        expect(text, `${file}: has its own ${name} summary`).toContain(name);
      }
    }
  });
});

// --- Render checks: no gate until a result exists -----------------------

async function renderTool(modulePath: string, exportName: string): Promise<string> {
  (globalThis as unknown as { window: unknown }).window = {
    location: { hostname: 'eduvelto.web.app', search: '', href: 'https://eduvelto.web.app/' },
    localStorage: { getItem: () => null, setItem: () => {} },
    history: { replaceState: () => {} },
  };
  (globalThis as unknown as { document: unknown }).document = {
    documentElement: { lang: '' },
  };
  vi.resetModules();
  const [toolMod, ctxMod] = await Promise.all([
    import(modulePath),
    import('../../../i18n/LanguageContext'),
  ]);
  const Tool = toolMod[exportName] as React.ComponentType;
  const { LanguageProvider } = ctxMod;
  try {
    return renderToString(
      React.createElement(LanguageProvider, null, React.createElement(Tool)),
    );
  } finally {
    delete (globalThis as unknown as { window?: unknown }).window;
    delete (globalThis as unknown as { document?: unknown }).document;
  }
}

describe('ads rollout: no gate before a result exists', () => {
  it('empty tool states render no Free Download button', async () => {
    for (const [mod, name] of [
      ['../PdfSplitterTool', 'PdfSplitterTool'],
      ['../PdfMergerTool', 'PdfMergerTool'],
      ['../PdfCompressorTool', 'PdfCompressorTool'],
      ['../InvoiceGeneratorTool', 'InvoiceGeneratorTool'],
      ['../VideoTrimmerTool', 'VideoTrimmerTool'],
      // B3: 15s tools — no gate until a result/export exists. (Tools
      // whose old download button was always visible, e.g.
      // CharacterCounter / Barcode, keep an always-visible gate in its
      // place — the gate IS the download button there — so they are
      // covered by the source counts above, not by this render check.)
      ['../ImageCompressorTool', 'ImageCompressorTool'],
      ['../QrCodeGeneratorTool', 'QrCodeGeneratorTool'],
      ['../CsvToExcelTool', 'CsvToExcelTool'],
      ['../ImageColorPickerTool', 'ImageColorPickerTool'],
    ] as const) {
      const html = await renderTool(mod, name);
      expect(html, `${name}: no gate in the empty state`).not.toContain('Free Download');
    }
  });
});
