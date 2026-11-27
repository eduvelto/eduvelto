// PDF to Word (Tool #142) — engine tests.
//
// The .docx is verified for real: Packer output unzipped with fflate
// (docx's own zip dependency) and read as word/document.xml — text
// present, w:rFonts on the right runs, Bijoy round-trip for SutonnyMJ.
//
// Bangla fixture PDFs are hand-built (no fontkit in the repo, and
// pdf-lib's standard fonts cannot carry Bengali glyphs): a minimal
// PDF with a Type1 font + a ToUnicode CMap mapping byte codes to
// Bengali Unicode, exactly the mapping pdf.js uses for extraction.
// ASCII characters use their real codes and /Encoding /WinAnsiEncoding
// (verified 27 Nov 2026: arbitrary low codes make pdf.js merge all
// lines into one item; real codes give one item per line with
// hasEOL). English fixtures use pdf-lib itself.
import { describe, expect, it } from 'vitest';
import { unzipSync } from 'fflate';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { bijoyToUnicode, unicodeToBijoy } from '../../tools/bijoy';
import {
  BANGLA_FONTS, DEFAULT_BANGLA_FONT, DEFAULT_ENGLISH_FONT, ENGLISH_FONTS,
  PDF_TO_WORD_MAX_PAGES, PDF_TO_WORD_MIN_TEXT_CHARS,
  buildWordDocument, convertPdfToWord, docxFileName, extractPdfText,
  splitLineIntoRuns, styleLineRuns, triggerBlobDownload,
  type ExtractedPdfText,
} from '../../tools/pdfToWord';

const STANDARD_FONTS = new URL(
  '../../../../node_modules/pdfjs-dist/standard_fonts/',
  import.meta.url,
).pathname;

const BN_SENTENCE = 'আমি বাংলা শিখছি।';
const BN_CONJUNCTS = 'ক্ষ জ্ঞ স্ত ষ্ট ন্ত';
const BN_PARAGRAPH =
  'বাংলাদেশের রাজধানী ঢাকা। শিক্ষা জীবনে আলো আনে।';
const EN_LINE = 'Hello World 2026';
const MIXED_LINE = 'আমি 2026 সালে Dhaka যাবো।';

interface FixtureLine {
  text: string;
  x?: number;
  y?: number;
}

/**
 * Minimal one-font PDF: every page gets its own content stream, all
 * pages share one font + one ToUnicode CMap. ASCII chars keep their
 * real codes; every other char gets a code from 128 up, mapped to its
 * Unicode value in the CMap.
 */
function makeCMapPdf(pages: FixtureLine[][]): Blob {
  const charToCode = new Map<string, number>();
  let nextCode = 128;
  const encodeLine = (line: string): number[] => {
    const codes: number[] = [];
    for (const ch of line) {
      const cp = ch.codePointAt(0) as number;
      if (cp < 128) {
        codes.push(cp);
      } else {
        if (!charToCode.has(ch)) charToCode.set(ch, nextCode++);
        codes.push(charToCode.get(ch) as number);
      }
    }
    return codes;
  };
  // Encode every line first: the CMap below needs the full char set.
  const encodedPages = pages.map((lines) =>
    lines.map((line, i) => ({
      codes: encodeLine(line.text),
      x: line.x ?? 40,
      y: line.y ?? 740 - i * 40,
    })),
  );
  const bfchars = [...charToCode.entries()]
    .map(
      ([ch, code]) =>
        `<${code.toString(16).padStart(2, '0')}> <${(ch.codePointAt(0) as number).toString(16).padStart(4, '0')}>`,
    )
    .join('\n');
  const cmap = `/CIDInit /ProcSet findresource begin\n12 dict begin\nbegincmap\n/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def\n/CMapName /Adobe-Identity-UCS def\n/CMapType 2 def\n1 begincodespacerange\n<00> <FF>\nendcodespacerange\n${charToCode.size} beginbfchar\n${bfchars}\nendbfchar\nendcmap\nCMapName currentdict /CMap defineresource pop\nend\nend`;
  // Object numbering: 1 catalog, 2 pages, 3 font, 4 ToUnicode,
  // 5.. contents (one per page), then page objects.
  const pageCount = pages.length;
  const contentStart = 5;
  const pageStart = 5 + pageCount;
  const objects: string[] = [];
  objects[0] = `<< /Type /Catalog /Pages 2 0 R >>`;
  objects[1] = `<< /Type /Pages /Kids [${pages
    .map((_, i) => `${pageStart + i} 0 R`)
    .join(' ')}] /Count ${pageCount} >>`;
  objects[2] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding /ToUnicode 4 0 R >>`;
  objects[3] = `<< /Length ${Buffer.byteLength(cmap)} >>\nstream\n${cmap}\nendstream`;
  encodedPages.forEach((lines, pageIndex) => {
    const content = lines
      .map((line) => {
        const hex = line.codes.map((c) => c.toString(16).padStart(2, '0')).join('');
        return `BT /F1 16 Tf 1 0 0 1 ${line.x} ${line.y} Tm <${hex}> Tj ET`;
      })
      .join('\n');
    objects[contentStart + pageIndex - 1] =
      `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`;
    objects[pageStart + pageIndex - 1] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentStart + pageIndex} 0 R >>`;
  });
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  for (let i = 0; i < objects.length; i++) {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xrefPos = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;
  return new Blob([Buffer.from(pdf, 'latin1')], { type: 'application/pdf' });
}

/** English PDF via pdf-lib (Helvetica, embedded the usual way). */
async function makeEnglishPdf(pages: string[][]): Promise<Blob> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (const lines of pages) {
    const page = doc.addPage([400, 600]);
    lines.forEach((line, i) => {
      page.drawText(line, { x: 40, y: 500 - i * 30, size: 14, font, color: rgb(0, 0, 0) });
    });
  }
  const bytes = await doc.save();
  return new Blob([bytes as BlobPart], { type: 'application/pdf' });
}

async function documentXmlFor(
  extracted: ExtractedPdfText,
  fonts: { banglaFont: string; englishFont: string },
): Promise<string> {
  const { document } = await buildWordDocument(extracted, {
    banglaFont: fonts.banglaFont as never,
    englishFont: fonts.englishFont as never,
  });
  const { Packer } = await import('docx');
  const buf = await Packer.toBuffer(document);
  const files = unzipSync(new Uint8Array(buf));
  const xml = files['word/document.xml'];
  expect(xml).toBeDefined();
  return new TextDecoder().decode(xml);
}

const unescapeXml = (s: string): string =>
  s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'");

/** Ordered (font, text) runs from word/document.xml. */
function runsFromXml(xml: string): Array<{ font: string; text: string }> {
  const runs: Array<{ font: string; text: string }> = [];
  const re = /<w:r>(?:(?!<w:r>)[\s\S])*?<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    const chunk = m[0];
    const fontMatch = /w:ascii="([^"]+)"/.exec(chunk);
    runs.push({ font: fontMatch?.[1] ?? '', text: unescapeXml(m[1]) });
  }
  return runs;
}

describe('extractPdfText', () => {
  it('extracts real Bangla text incl. conjuncts, line by line', async () => {
    const pdf = makeCMapPdf([[{ text: BN_SENTENCE }, { text: BN_CONJUNCTS }, { text: EN_LINE }]]);
    const out = await extractPdfText(pdf, { standardFontDataUrl: STANDARD_FONTS });
    expect(out.pageCount).toBe(1);
    expect(out.pages).toHaveLength(1);
    expect(out.pages[0].lines).toEqual([BN_SENTENCE, BN_CONJUNCTS, EN_LINE]);
    expect(out.totalChars).toBeGreaterThan(0);
  });

  it('extracts a full Bangla paragraph + English across 2 pages', async () => {
    const pdf = makeCMapPdf([
      [{ text: BN_SENTENCE }, { text: BN_PARAGRAPH }],
      [{ text: MIXED_LINE }, { text: EN_LINE }],
    ]);
    const out = await extractPdfText(pdf, { standardFontDataUrl: STANDARD_FONTS });
    expect(out.pageCount).toBe(2);
    expect(out.pages[0].lines).toEqual([BN_SENTENCE, BN_PARAGRAPH]);
    expect(out.pages[1].lines).toEqual([MIXED_LINE, EN_LINE]);
  });

  it('extracts English lines from a pdf-lib PDF, page by page', async () => {
    const pdf = await makeEnglishPdf([
      ['First line of English text.', 'Second line here.'],
      ['Third line 12345.'],
    ]);
    const out = await extractPdfText(pdf, { standardFontDataUrl: STANDARD_FONTS });
    expect(out.pageCount).toBe(2);
    expect(out.pages[0].lines).toEqual(['First line of English text.', 'Second line here.']);
    expect(out.pages[1].lines).toEqual(['Third line 12345.']);
  });

  it('inserts a paragraph gap where the line gap is much larger than usual', async () => {
    const pdf = makeCMapPdf([
      [
        { text: 'প্রথম অনুচ্ছেদের লাইন।', y: 740 },
        { text: 'একই অনুচ্ছেদের পরের লাইন।', y: 700 },
        { text: 'দ্বিতীয় অনুচ্ছেদ শুরু।', y: 500 },
      ],
    ]);
    const out = await extractPdfText(pdf, { standardFontDataUrl: STANDARD_FONTS });
    expect(out.pages[0].lines).toEqual([
      'প্রথম অনুচ্ছেদের লাইন।',
      'একই অনুচ্ছেদের পরের লাইন।',
      '',
      'দ্বিতীয় অনুচ্ছেদ শুরু।',
    ]);
  });

  it('reports zero characters for a blank (image/scanned-like) PDF', async () => {
    const doc = await PDFDocument.create();
    doc.addPage([400, 600]);
    const bytes = await doc.save();
    const pdf = new Blob([bytes as BlobPart], { type: 'application/pdf' });
    const out = await extractPdfText(pdf, { standardFontDataUrl: STANDARD_FONTS });
    expect(out.pageCount).toBe(1);
    expect(out.totalChars).toBe(0);
    expect(out.pages[0].lines).toEqual([]);
  });

  it('rejects a non-PDF and a password-protected-looking corrupt file', async () => {
    await expect(
      extractPdfText(new Blob(['not a pdf at all'], { type: 'application/pdf' }), {
        standardFontDataUrl: STANDARD_FONTS,
      }),
    ).rejects.toThrow(/Could not read this file as a PDF/);
    await expect(
      extractPdfText(new Blob([], { type: 'application/pdf' }), {
        standardFontDataUrl: STANDARD_FONTS,
      }),
    ).rejects.toThrow(/non-empty PDF/);
  });

  it('refuses more pages than the limit', async () => {
    const pdf = await makeEnglishPdf([['p1'], ['p2'], ['p3']]);
    await expect(
      extractPdfText(pdf, { maxPages: 2, standardFontDataUrl: STANDARD_FONTS }),
    ).rejects.toThrow(/up to 2 pages/);
    expect(PDF_TO_WORD_MAX_PAGES).toBe(50);
  });
});

describe('splitLineIntoRuns', () => {
  it('splits a mixed line into per-script runs, spaces riding with the run before', () => {
    expect(splitLineIntoRuns(MIXED_LINE)).toEqual([
      { text: 'আমি ', script: 'bn' },
      { text: '2026 ', script: 'en' },
      { text: 'সালে ', script: 'bn' },
      { text: 'Dhaka ', script: 'en' },
      { text: 'যাবো।', script: 'bn' },
    ]);
  });

  it('treats the danda as Bangla and keeps a pure English line whole', () => {
    expect(splitLineIntoRuns('ঢাকা। Dhaka')).toEqual([
      { text: 'ঢাকা। ', script: 'bn' },
      { text: 'Dhaka', script: 'en' },
    ]);
    expect(splitLineIntoRuns('Hello World 2026')).toEqual([
      { text: 'Hello World 2026', script: 'en' },
    ]);
  });
});

describe('styleLineRuns + Bijoy', () => {
  it('round-trips the existing Bijoy engine on the fixture conjuncts', () => {
    for (const text of [BN_SENTENCE, BN_CONJUNCTS, BN_PARAGRAPH]) {
      expect(bijoyToUnicode(unicodeToBijoy(text))).toBe(text);
    }
  });

  it('styles Bangla runs in the chosen Bangla font, English in the English font', () => {
    const styled = styleLineRuns(MIXED_LINE, {
      banglaFont: 'SolaimanLipi',
      englishFont: 'Georgia',
    });
    expect(styled.fallbackRuns).toBe(0);
    expect(styled.convertedRuns).toBe(0);
    expect(styled.runs).toEqual([
      { text: 'আমি ', font: 'SolaimanLipi' },
      { text: '2026 ', font: 'Georgia' },
      { text: 'সালে ', font: 'SolaimanLipi' },
      { text: 'Dhaka ', font: 'Georgia' },
      { text: 'যাবো।', font: 'SolaimanLipi' },
    ]);
  });

  it('converts Bangla runs to Bijoy when SutonnyMJ is picked', () => {
    const styled = styleLineRuns(BN_SENTENCE, {
      banglaFont: 'SutonnyMJ',
      englishFont: 'Times New Roman',
    });
    expect(styled.convertedRuns).toBe(1);
    expect(styled.fallbackRuns).toBe(0);
    expect(styled.runs).toHaveLength(1);
    expect(styled.runs[0].font).toBe('SutonnyMJ');
    // The Bijoy text converts back to the exact original.
    expect(bijoyToUnicode(styled.runs[0].text)).toBe(BN_SENTENCE);
    expect(styled.runs[0].text).not.toBe(BN_SENTENCE);
  });

  it('falls back to SolaimanLipi (original Unicode) for a run with no Bijoy mapping', () => {
    // ৰ (U+09F0, Assamese ra) has no entry in the Bijoy tables:
    // the engine leaves it as Unicode, so the run must not ship as SutonnyMJ.
    expect(unicodeToBijoy('ৰ')).toBe('ৰ');
    const line = 'অসমৰ কথা';
    const styled = styleLineRuns(line, {
      banglaFont: 'SutonnyMJ',
      englishFont: 'Times New Roman',
    });
    expect(styled.fallbackRuns).toBe(1);
    expect(styled.convertedRuns).toBe(0);
    expect(styled.runs).toEqual([{ text: line, font: 'SolaimanLipi' }]);
  });
});

describe('buildWordDocument (.docx XML)', () => {
  it('puts the extracted text in the doc with the right fonts on the right runs', async () => {
    const extracted: ExtractedPdfText = {
      pageCount: 1,
      pages: [{ pageNumber: 1, lines: [BN_SENTENCE, MIXED_LINE, EN_LINE] }],
      totalChars: 60,
    };
    const xml = await documentXmlFor(extracted, {
      banglaFont: DEFAULT_BANGLA_FONT,
      englishFont: DEFAULT_ENGLISH_FONT,
    });
    const runs = runsFromXml(xml);
    expect(runs.length).toBeGreaterThan(0);
    expect(runs.map((r) => r.text).join('\n')).toContain(BN_SENTENCE);
    expect(runs.map((r) => r.text).join('\n')).toContain(EN_LINE);
    // Bangla runs carry the Bangla font, English runs the English font.
    const bnRun = runs.find((r) => r.text.includes('আমি'));
    expect(bnRun?.font).toBe('Noto Sans Bengali');
    const enRun = runs.find((r) => r.text === EN_LINE);
    expect(enRun?.font).toBe('Times New Roman');
    expect(xml).toContain('Noto Sans Bengali');
    expect(xml).toContain('Times New Roman');
  });

  it('with SutonnyMJ the Bangla runs hold Bijoy text that round-trips to the original', async () => {
    const extracted: ExtractedPdfText = {
      pageCount: 1,
      pages: [{ pageNumber: 1, lines: [BN_SENTENCE, BN_CONJUNCTS] }],
      totalChars: 40,
    };
    const xml = await documentXmlFor(extracted, {
      banglaFont: 'SutonnyMJ',
      englishFont: 'Calibri',
    });
    const runs = runsFromXml(xml);
    const bnRuns = runs.filter((r) => r.font === 'SutonnyMJ');
    expect(bnRuns.length).toBe(2);
    expect(bijoyToUnicode(bnRuns[0].text)).toBe(BN_SENTENCE);
    expect(bijoyToUnicode(bnRuns[1].text)).toBe(BN_CONJUNCTS);
    // No Unicode Bangla survives in a SutonnyMJ run.
    for (const r of bnRuns) {
      expect(r.text).not.toMatch(/[\u0980-\u09FF]/);
    }
    expect(xml).toContain('SutonnyMJ');
    // Download-clean: no watermark / brand text in the document.
    expect(xml).not.toContain('Eduvelto');
  });

  it('reports fallback runs and keeps their text in Unicode with SolaimanLipi', async () => {
    const extracted: ExtractedPdfText = {
      pageCount: 1,
      pages: [{ pageNumber: 1, lines: ['অসমৰ কথা', BN_SENTENCE] }],
      totalChars: 30,
    };
    const built = await buildWordDocument(extracted, {
      banglaFont: 'SutonnyMJ',
      englishFont: 'Arial',
    });
    expect(built.fallbackRuns).toBe(1);
    expect(built.convertedRuns).toBe(1);
    const { Packer } = await import('docx');
    const buf = await Packer.toBuffer(built.document);
    const files = unzipSync(new Uint8Array(buf));
    const xml = new TextDecoder().decode(files['word/document.xml']);
    const runs = runsFromXml(xml);
    const fallback = runs.find((r) => r.text === 'অসমৰ কথা');
    expect(fallback?.font).toBe('SolaimanLipi');
  });

  it('separates pages with a page break and keeps empty lines as empty paragraphs', async () => {
    const extracted: ExtractedPdfText = {
      pageCount: 2,
      pages: [
        { pageNumber: 1, lines: ['Page one.', ''] },
        { pageNumber: 2, lines: ['Page two.'] },
      ],
      totalChars: 18,
    };
    const xml = await documentXmlFor(extracted, {
      banglaFont: 'Noto Sans Bengali',
      englishFont: 'Times New Roman',
    });
    expect(xml).toContain('Page one.');
    expect(xml).toContain('Page two.');
    expect(xml).toContain('w:br w:type="page"');
  });
});

describe('convertPdfToWord (full pipeline)', () => {
  it('converts a real Bangla PDF end to end into a named .docx blob', async () => {
    const pdf = makeCMapPdf([[{ text: BN_SENTENCE }, { text: BN_CONJUNCTS }, { text: EN_LINE }]]);
    const file = new File([pdf], 'report.pdf', { type: 'application/pdf' });
    const out = await convertPdfToWord(file, {
      banglaFont: 'SutonnyMJ',
      englishFont: 'Georgia',
      standardFontDataUrl: STANDARD_FONTS,
    });
    expect(out.fileName).toBe('report.docx');
    expect(out.pageCount).toBe(1);
    expect(out.totalChars).toBeGreaterThan(0);
    expect(out.convertedRuns).toBe(2);
    expect(out.fallbackRuns).toBe(0);
    expect(out.blob.type).toBe(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    );
    const files = unzipSync(new Uint8Array(await out.blob.arrayBuffer()));
    const xml = new TextDecoder().decode(files['word/document.xml']);
    const runs = runsFromXml(xml);
    const bnRuns = runs.filter((r) => r.font === 'SutonnyMJ');
    expect(bnRuns.length).toBe(2);
    expect(bijoyToUnicode(bnRuns[0].text)).toBe(BN_SENTENCE);
    expect(bijoyToUnicode(bnRuns[1].text)).toBe(BN_CONJUNCTS);
    expect(runs.find((r) => r.text === EN_LINE)?.font).toBe('Georgia');
    // DOWNLOAD-CLEAN (owner 27 Nov 17:19): the preview watermark never
    // reaches the document — no brand text in the .docx at all.
    expect(xml).not.toContain('Eduvelto');
    expect(xml).not.toContain('watermark');
  });

  it('refuses a scanned/image PDF instead of delivering an empty document', async () => {
    const doc = await PDFDocument.create();
    doc.addPage([400, 600]);
    const bytes = await doc.save();
    const pdf = new File([bytes as BlobPart], 'scan.pdf', { type: 'application/pdf' });
    await expect(
      convertPdfToWord(pdf, {
        banglaFont: 'Noto Sans Bengali',
        englishFont: 'Times New Roman',
        standardFontDataUrl: STANDARD_FONTS,
      }),
    ).rejects.toThrow(/no readable text/);
    expect(PDF_TO_WORD_MIN_TEXT_CHARS).toBe(20);
  });
});

describe('triggerBlobDownload (download flow)', () => {
  it('clicks a temporary anchor with the blob URL and .docx name, then removes it', () => {
    const anchor = {
      href: '',
      download: '',
      clicked: false,
      removed: false,
      click() {
        this.clicked = true;
      },
      remove() {
        this.removed = true;
      },
    };
    const appended: unknown[] = [];
    const removed: unknown[] = [];
    const previous = (globalThis as { document?: unknown }).document;
    (globalThis as { document: unknown }).document = {
      createElement: () => anchor,
      body: {
        appendChild: (el: unknown) => {
          appended.push(el);
        },
        removeChild: (el: unknown) => {
          removed.push(el);
        },
      },
    };
    try {
      triggerBlobDownload('blob:fake-docx', 'report.docx');
    } finally {
      if (previous === undefined) delete (globalThis as { document?: unknown }).document;
      else (globalThis as { document: unknown }).document = previous;
    }
    expect(anchor.href).toBe('blob:fake-docx');
    expect(anchor.download).toBe('report.docx');
    expect(appended).toEqual([anchor]);
    expect(anchor.clicked).toBe(true);
    expect(anchor.removed).toBe(true);
  });
});

describe('font options (pure)', () => {
  it('offers 6 Bangla fonts and 4 English fonts with the stated defaults', () => {
    expect(BANGLA_FONTS).toEqual([
      'Noto Sans Bengali',
      'SolaimanLipi',
      'Siyam Rupali',
      'SutonnyMJ',
      'Nikosh',
      'Kalpurush',
    ]);
    expect(ENGLISH_FONTS).toEqual(['Times New Roman', 'Calibri', 'Arial', 'Georgia']);
    expect(DEFAULT_BANGLA_FONT).toBe('Noto Sans Bengali');
    expect(DEFAULT_ENGLISH_FONT).toBe('Times New Roman');
  });

  it('names the .docx after the PDF, sanitised', () => {
    expect(docxFileName('my report')).toBe('my report.docx');
    expect(docxFileName('a/b:c')).toBe('a_b_c.docx');
    expect(docxFileName('')).toBe('document.docx');
  });
});
