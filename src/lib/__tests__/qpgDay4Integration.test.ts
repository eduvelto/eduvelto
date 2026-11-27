// Day 4 integration — coordinator fixes (26 Nov 2026):
// (a) the set seed is carried through the paper setup and printed on
// set papers (ক/খ/গ/ঘ) so re-entering it rebuilds the identical set;
// (b) the download dialog wires the Answer Key checkbox + the
// institution logo upload into the Pro exports (previously both were
// dead: includeAnswerKey hardcoded false, file input had no onChange).
// DOM-dependent behaviour is asserted source-level (the repo's
// established pattern — no jsdom/testing-library here).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  QPG_VERIFIED_POOL,
  buildQpgPaper,
  defaultPaperSetup,
} from '../questionPaper';

const PDF_SRC = readFileSync(resolve(__dirname, '../questionPaperPdf.ts'), 'utf8');
const DIALOG_SRC = readFileSync(
  resolve(__dirname, '../../components/QuestionPaperDownloadDialog.tsx'),
  'utf8',
);

function chapterSetup(overrides: { setCode?: '' | 'ক' | 'খ' | 'গ' | 'ঘ'; seed?: number } = {}) {
  return defaultPaperSetup({
    title: 'পরীক্ষা — গণিত',
    subject: 'গণিত',
    classLabel: '৬ষ্ঠ শ্রেণি',
    questionCount: 10,
    marksPerQuestion: 1,
    timeMinutes: 60,
    sectionHeading: 'ক-বিভাগ: বহুনির্বাচনি প্রশ্ন (MCQ)',
    setCode: overrides.setCode ?? 'খ',
    seed: overrides.seed,
  });
}

describe('Day 4 integration — set seed on the paper', () => {
  it('defaultPaperSetup carries the seed through to the setup', () => {
    const setup = chapterSetup({ setCode: 'খ', seed: 123456789 });
    expect(setup.setCode).toBe('খ');
    expect(setup.seed).toBe(123456789);
  });

  it('a single-set paper carries no seed', () => {
    const setup = chapterSetup({ setCode: '' });
    expect(setup.setCode).toBe('');
    expect(setup.seed).toBeUndefined();
  });

  it('buildQpgPaper keeps the seed on the built paper', () => {
    const setup = chapterSetup({ setCode: 'গ', seed: 42 });
    const paper = buildQpgPaper({
      setup,
      questions: QPG_VERIFIED_POOL.slice(0, 5),
      isCustomVariant: false,
      kind: 'chapter-paper',
      patternLabelBn: 'অধ্যায়ভিত্তিক প্রশ্নপত্র — যাচাইকৃত অনুশীলন প্রশ্ন',
      patternLabelEn: 'Chapter-based paper — verified practice questions',
    });
    expect(paper.setup.seed).toBe(42);
    expect(paper.setup.setCode).toBe('গ');
  });

  it('the paper header prints the seed for set papers only', () => {
    // First-page meta line + continuation header + OMR header all
    // carry the seed when (and only when) a set code is present.
    expect(PDF_SRC).toContain('Seed: ${setup.seed}');
    expect(PDF_SRC).toContain('Seed: ${paper.setup.seed}');
    expect(PDF_SRC).toContain('setup.setCode && setup.seed !== undefined');
    expect(PDF_SRC).toContain('paper.setup.setCode && paper.setup.seed !== undefined');
  });
});

describe('Day 4 integration — dialog wires Answer Key + logo', () => {
  it('the Answer Key checkbox state feeds both Pro exports (not hardcoded false)', () => {
    expect(DIALOG_SRC).toContain('const [includeAnswerKey, setIncludeAnswerKey] = useState(true)');
    expect(DIALOG_SRC).toContain('includeAnswerKey,');
    expect(DIALOG_SRC).not.toContain('includeAnswerKey: false');
    expect(DIALOG_SRC).toContain('Answer Key শিট যুক্ত করুন');
  });

  it('the logo upload compresses in-browser and feeds the clean PDF', () => {
    expect(DIALOG_SRC).toContain("import { compressLogoToDataUrl } from '../lib/questionPaperLogo'");
    expect(DIALOG_SRC).toContain('compressLogoToDataUrl(f)');
    expect(DIALOG_SRC).toContain('const [customLogoDataUrl, setCustomLogoDataUrl]');
    expect(DIALOG_SRC).toContain('customLogoDataUrl,');
    expect(DIALOG_SRC).toContain('লোগো আপলোড হয়েছে');
  });
});
