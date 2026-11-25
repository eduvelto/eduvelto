// Eduvelto — Question Paper Generator: Word (.docx) export (Pro).
//
// A-Z parity (Proshnobanai read, 25 Nov 2026 10:14): Word download
// alongside PDF — a PRO feature. Unlike the free rasterized PDF, the
// Pro DOCX is EDITABLE TEXT by design (that is what Pro pays for:
// editable layout + clean export). The free tier never gets a DOCX.
//
// LOCKED in the MVP like the clean PDF: the builder exists here and
// is unit-tested, but the UI never calls it with proUnlocked=true
// until payment verification is live (see QuestionPaperDownloadDialog).
// `downloadCleanPaperDocx` throws unless `proUnlocked` is true.
//
// ZERO-BUNDLE BLOAT (owner 25 Nov 08:48, BINDING): `docx` loads ONLY
// via dynamic import() inside functions invoked from click handlers
// — never statically imported — so it lands in a separate lazy chunk
// and public pages stay fast on 4G mobile.
//
// ZERO SERVER STORAGE: generation is 100% client-side; the .docx is
// built in memory and downloaded via a blob URL. No server cost.
import { QPG_BORDER_CREDIT, type QpgPaper } from './questionPaper';

export interface QpgDocxOptions {
  /** Pro gate — must be true or the export throws. */
  proUnlocked: boolean;
  /** One-click Answer Key sheet (Pro). */
  includeAnswerKey?: boolean;
}

function safeDocxFileName(paper: QpgPaper): string {
  const base =
    paper.setup.title.replace(/[^\p{L}\p{N}]+/gu, '-').slice(0, 40) || 'question-paper';
  return `${base}-pro-clean.docx`;
}

function headerLine(paper: QpgPaper): string {
  const s = paper.setup;
  const set = s.setCode ? `সেট: ${s.setCode}` : 'সেট: —';
  const code = s.subjectCode ? s.subjectCode : '—';
  return [
    `বিষয়: ${s.subject} • শ্রেণি: ${s.classLabel} • অধ্যায়: ${paper.chapterNameBn}`,
    `তারিখ: ${s.examDate} • পূর্ণমান: ${s.totalMarks} • সময়: ${s.timeMinutes} মিনিট • বিষয় কোড: ${code} • ${set}`,
  ].join('\n');
}

/**
 * Build the editable Word document for a paper. Dynamic-imports `docx`
 * internally (see the bundle rule above). Exported for unit tests:
 * the test packs it with Packer.toBuffer and reads document.xml.
 */
export async function buildPaperDocxDocument(
  paper: QpgPaper,
  opts: QpgDocxOptions,
): Promise<import('docx').Document> {
  if (!opts.proUnlocked) {
    throw new Error('Word (.docx) export is Pro-only — payment verification activates after review.');
  }
  const { AlignmentType, Document, HeadingLevel, Paragraph, TextRun } = await import('docx');
  const s = paper.setup;
  const children: import('docx').Paragraph[] = [];

  children.push(
    new Paragraph({
      text: s.title,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
    }),
  );
  if (s.institutionName.trim()) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: s.institutionName, bold: true })],
        alignment: AlignmentType.CENTER,
      }),
    );
  }
  if (s.institutionAddress.trim() || s.institutionMotto.trim()) {
    children.push(
      new Paragraph({
        text: [s.institutionAddress, s.institutionMotto].filter(Boolean).join(' • '),
        alignment: AlignmentType.CENTER,
      }),
    );
  }
  children.push(
    new Paragraph({ text: headerLine(paper), alignment: AlignmentType.CENTER }),
  );
  if (s.instructions.trim()) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'নির্দেশনা: ', bold: true }),
          new TextRun({ text: s.instructions }),
        ],
      }),
    );
  }
  children.push(
    new Paragraph({ text: s.sectionHeading, heading: HeadingLevel.HEADING_2 }),
  );
  paper.questions.forEach((q, i) => {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: `${i + 1}. ${q.questionText}`, bold: true })],
      }),
    );
    q.options.forEach((o) => {
      children.push(new Paragraph({ text: `(${o.letter}) ${o.text}` }));
    });
  });
  if (opts.includeAnswerKey) {
    children.push(
      new Paragraph({ text: 'Answer Key', heading: HeadingLevel.HEADING_2 }),
    );
    paper.questions.forEach((q, i) => {
      children.push(new Paragraph({ text: `${i + 1}. ${q.correctLetter}` }));
    });
  }
  children.push(
    new Paragraph({
      children: [new TextRun({ text: QPG_BORDER_CREDIT, italics: true })],
      alignment: AlignmentType.CENTER,
    }),
  );

  return new Document({
    sections: [{ children }],
  });
}

/** Download the Pro .docx (click handler only). Throws unless Pro. */
export async function downloadCleanPaperDocx(
  paper: QpgPaper,
  opts: QpgDocxOptions,
): Promise<void> {
  const doc = await buildPaperDocxDocument(paper, opts);
  const { Packer } = await import('docx');
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement('a');
    a.href = url;
    a.download = safeDocxFileName(paper);
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    URL.revokeObjectURL(url);
  }
}
