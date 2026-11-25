// Eduvelto — Word (.docx) export tests (A-Z parity, Proshnobanai read
// 25 Nov 2026 10:14): Word download alongside PDF — a PRO feature.
//
// The builder is real (docx Packer output, unzipped with fflate —
// docx's own zip dependency — and read as word/document.xml), but the
// UI keeps it LOCKED in the MVP: downloadCleanPaperDocx throws unless
// proUnlocked is true, and nothing in the MVP passes true.
import { describe, expect, it } from 'vitest';
import { unzipSync } from 'fflate';
import {
  QPG_VERIFIED_POOL,
  buildQpgPaper,
  defaultPaperSetup,
} from '../questionPaper';
import {
  buildPaperDocxDocument,
  downloadCleanPaperDocx,
} from '../questionPaperDocx';

async function documentXml(includeAnswerKey: boolean): Promise<string> {
  const setup = defaultPaperSetup({
    title: 'বার্ষিক পরীক্ষা — English (অনার্স)',
    subject: 'English',
    classLabel: 'অনার্স',
    questionCount: 10,
    marksPerQuestion: 1,
    timeMinutes: 30,
    sectionHeading: 'ক-বিভাগ: বহুনির্বাচনি প্রশ্ন (MCQ)',
    setCode: 'খ',
  });
  const paper = buildQpgPaper({
    setup,
    questions: QPG_VERIFIED_POOL.slice(0, 10),
    isCustomVariant: false,
    kind: 'chapter-paper',
    patternLabelBn: 'অধ্যায়ভিত্তিক প্রশ্নপত্র — যাচাইকৃত প্রশ্ন',
    patternLabelEn: 'Chapter-based paper — verified questions',
  });
  const doc = await buildPaperDocxDocument(paper, {
    proUnlocked: true,
    includeAnswerKey,
  });
  const { Packer } = await import('docx');
  const buf = await Packer.toBuffer(doc);
  const files = unzipSync(new Uint8Array(buf));
  const xml = files['word/document.xml'];
  expect(xml).toBeDefined();
  return new TextDecoder().decode(xml);
}

describe('Word (.docx) export (Pro)', () => {
  it('builds a real .docx with title, set code, questions, options, border credit', async () => {
    const xml = await documentXml(false);
    expect(xml).toContain('বার্ষিক পরীক্ষা — English (অনার্স)');
    expect(xml).toContain('সেট: খ');
    expect(xml).toContain('Choose the passive form of the sentence');
    expect(xml).toContain('The mouse was chased by the cat.');
    expect(xml).toContain('Powered by Eduvelto.com');
    expect(xml).not.toContain('Answer Key');
  });

  it('includes the Answer Key sheet when requested', async () => {
    const xml = await documentXml(true);
    expect(xml).toContain('Answer Key');
  });

  it('throws unless Pro is unlocked (MVP: Pro locked)', async () => {
    const setup = defaultPaperSetup({
      title: 't',
      subject: 'English',
      classLabel: 'অনার্স',
      questionCount: 1,
      marksPerQuestion: 1,
      timeMinutes: 30,
      sectionHeading: 's',
    });
    const paper = buildQpgPaper({
      setup,
      questions: QPG_VERIFIED_POOL.slice(0, 1),
      isCustomVariant: false,
      kind: 'chapter-paper',
      patternLabelBn: 'x',
      patternLabelEn: 'x',
    });
    await expect(
      buildPaperDocxDocument(paper, { proUnlocked: false }),
    ).rejects.toThrow('Pro-only');
    await expect(
      downloadCleanPaperDocx(paper, { proUnlocked: false }),
    ).rejects.toThrow('Pro-only');
  });
});
