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
  qpgQuestionsTotalMarks,
  qpgSectionsForQuestions,
  type QpgQuestion,
} from '../questionPaper';
import {
  buildPaperDocxDocument,
  downloadCleanPaperDocx,
} from '../questionPaperDocx';

async function documentXmlFor(questions: QpgQuestion[], includeAnswerKey: boolean): Promise<string> {
  const setup = defaultPaperSetup({
    title: 'Test paper',
    subject: 'Test',
    classLabel: 'Class 9',
    questionCount: questions.length,
    marksPerQuestion: 1,
    timeMinutes: 60,
    sectionHeading: 'Test',
    totalMarks: qpgQuestionsTotalMarks(questions),
  });
  const paper = buildQpgPaper({
    setup,
    questions,
    sections: qpgSectionsForQuestions(questions),
    isCustomVariant: false,
    kind: 'chapter-paper',
    patternLabelBn: 'Test',
    patternLabelEn: 'Test',
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
    patternLabelBn: 'অধ্যায়ভিত্তিক প্রশ্নপত্র — যাচাইকৃত অনুশীলন প্রশ্ন',
    patternLabelEn: 'Chapter-based paper — verified practice questions',
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

  it('renders a CQ-only paper as stimulus + 4 parts with marks, and no Answer Key (CQ has no key)', async () => {
    const cq = QPG_VERIFIED_POOL.filter((q) => q.type === 'cq').slice(0, 2);
    const xml = await documentXmlFor(cq, true);
    // Stimulus + the read-the-stimulus instruction + each part with its mark.
    expect(xml).toContain(cq[0].stimulus!);
    expect(xml).toContain('উদ্দীপকটি পড়ে নিচের প্রশ্নগুলোর উত্তর দাও।');
    expect(xml).toContain(cq[0].parts![0].question);
    expect(xml).toContain('(1 নম্বর)');
    expect(xml).toContain('(4 নম্বর)');
    expect(xml).not.toContain('Answer Key');
  });

  it('renders a Combined paper (MCQ + CQ) and its Answer Key lists only the MCQ numbers (paper numbering preserved)', async () => {
    const mcq = QPG_VERIFIED_POOL.filter((q) => q.type === 'mcq').slice(0, 2);
    const cq = QPG_VERIFIED_POOL.filter((q) => q.type === 'cq').slice(0, 1);
    // Paper order: MCQ, CQ, MCQ — so the key must list 1 and 3, never 2.
    const questions = [mcq[0], cq[0], mcq[1]];
    const xml = await documentXmlFor(questions, true);
    expect(xml).toContain(mcq[0].questionText);
    expect(xml).toContain(cq[0].stimulus!);
    expect(xml).toContain(cq[0].parts![0].question);
    const keyTail = xml.split('Answer Key')[1];
    expect(keyTail).toBeDefined();
    expect(keyTail).toContain(`1. ${mcq[0].correctLetter}`);
    expect(keyTail).toContain(`3. ${mcq[1].correctLetter}`);
    expect(keyTail).not.toContain('2. ');
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
