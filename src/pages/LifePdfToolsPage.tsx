import { useRef, useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { PageShell } from '../components/PageShell';
import { Breadcrumb } from '../components/Breadcrumb';
import { downloadBlobInApp } from '../lib/nativeFileDownload';

// Eduvelto PDF Tools (§3C) — genuinely working client-side PDF tools.
// No server is involved: text-to-PDF and merge-PDF both run entirely in
// the browser, and the files never leave the user's device.
//
// Bangla note: jsPDF's built-in text engine cannot shape Bengali script
// (conjuncts break — verified 23 Nov 2026), so text containing Bengali
// is drawn onto a canvas with the page's own Bangla font (correct
// shaping) and placed into the PDF as a page image. Latin-only text goes
// in as real, selectable PDF text. The page says this plainly.

const BENGALI_RE = /[\u0980-\u09FF]/;

// jspdf and pdf-lib are loaded on demand (Phase 2b, Spark Optimization):
// the PDF libraries are fetched only when the user actually uses a PDF
// tool — never on page visit. The page itself is already route-lazy
// (App.tsx), so neither library was ever in the entry chunk; this
// removes both from the page chunk too. pdf-lib loads only when the
// user clicks Merge (loadPdfLib, same pattern as loadJsPdf below).
async function loadJsPdf() {
  const { jsPDF } = await import('jspdf');
  return jsPDF;
}

async function loadPdfLib() {
  const { PDFDocument } = await import('pdf-lib');
  return PDFDocument;
}

// IN-APP (audit, 24 Nov 2026): a stock Android WebView does not
// download blob: URLs, so the anchor below silently does nothing
// inside the app. Try the native path first (cache file + system share
// sheet); the browser keeps the anchor download.
async function downloadBlob(blob: Blob, filename: string) {
  if (await downloadBlobInApp(blob, filename)) {
    return;
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function safeFilename(name: string, fallback: string): string {
  const cleaned = name.trim().replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, '-');
  if (!cleaned) return fallback;
  return cleaned.toLowerCase().endsWith('.pdf') ? cleaned : `${cleaned}.pdf`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Latin-only text → real selectable PDF text, paginated on A4. */
async function textToPdfLatin(text: string, filename: string) {
  const jsPDF = await loadJsPdf();
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  const lines = doc.splitTextToSize(text, 170);
  const lineHeight = 7;
  const linesPerPage = Math.floor(257 / lineHeight);
  let page = 0;
  for (let i = 0; i < lines.length; i += linesPerPage) {
    if (page > 0) doc.addPage();
    const chunk = lines.slice(i, i + linesPerPage);
    chunk.forEach((line: string, idx: number) => {
      doc.text(line, 20, 20 + idx * lineHeight);
    });
    page += 1;
  }
  void downloadBlob(doc.output('blob'), filename);
}

/** Wrap paragraphs to canvas lines (word wrap + hard-split overlong words). Exported for unit tests. */
export function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const out: string[] = [];
  for (const paragraph of text.split('\n')) {
    if (paragraph.trim() === '') {
      out.push('');
      continue;
    }
    const words = paragraph.split(/\s+/).filter(Boolean);
    let line = '';
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (ctx.measureText(candidate).width <= maxWidth) {
        line = candidate;
        continue;
      }
      if (line) out.push(line);
      if (ctx.measureText(word).width <= maxWidth) {
        line = word;
      } else {
        // One overlong word (e.g. a long URL): split it by characters.
        let chunk = '';
        for (const ch of word) {
          if (ctx.measureText(chunk + ch).width > maxWidth && chunk) {
            out.push(chunk);
            chunk = ch;
          } else {
            chunk += ch;
          }
        }
        line = chunk;
      }
    }
    if (line) out.push(line);
  }
  return out;
}

/** Text containing Bengali → canvas-rendered pages (correct shaping). */
async function textToPdfBengali(text: string, filename: string) {
  const jsPDF = await loadJsPdf();
  try {
    await document.fonts.load('22px "Hind Siliguri"');
    await document.fonts.ready;
  } catch {
    // Offline / font blocked: the browser still shapes Bengali with any
    // system Bengali font, so rendering continues.
  }
  const PAGE_W = 1240;
  const PAGE_H = 1754; // A4 at 150 dpi
  const MARGIN = 90;
  const FONT = '22px "Hind Siliguri", "Noto Sans Bengali", sans-serif';
  const LINE_HEIGHT = 38;
  const maxWidth = PAGE_W - MARGIN * 2;
  const linesPerPage = Math.floor((PAGE_H - MARGIN * 2) / LINE_HEIGHT);

  const measure = document.createElement('canvas').getContext('2d');
  if (!measure) throw new Error('canvas-unavailable');
  measure.font = FONT;
  const lines = wrapLines(measure, text, maxWidth);

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  for (let start = 0; start < lines.length; start += linesPerPage) {
    const canvas = document.createElement('canvas');
    canvas.width = PAGE_W;
    canvas.height = PAGE_H;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas-unavailable');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, PAGE_W, PAGE_H);
    ctx.fillStyle = '#111111';
    ctx.font = FONT;
    ctx.textBaseline = 'top';
    const chunk = lines.slice(start, start + linesPerPage);
    chunk.forEach((line, idx) => {
      ctx.fillText(line, MARGIN, MARGIN + idx * LINE_HEIGHT);
    });
    if (start > 0) doc.addPage();
    doc.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 210, 297);
  }
  void downloadBlob(doc.output('blob'), filename);
}

export default function LifePdfToolsPage() {
  const { t, lang } = useLanguage();
  const [text, setText] = useState('');
  const [pdfName, setPdfName] = useState('');
  const [textBusy, setTextBusy] = useState(false);
  const [textMsg, setTextMsg] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [mergeBusy, setMergeBusy] = useState(false);
  const [mergeMsg, setMergeMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasBengali = BENGALI_RE.test(text);

  async function handleTextToPdf() {
    setTextMsg('');
    if (!text.trim()) {
      setTextMsg(t({ bn: 'প্রথমে কিছু লেখা লিখুন বা পেস্ট করুন।', en: 'First type or paste some text.' }));
      return;
    }
    setTextBusy(true);
    try {
      const filename = safeFilename(pdfName, 'eduvelto-text.pdf');
      if (hasBengali) {
        await textToPdfBengali(text, filename);
      } else {
        await textToPdfLatin(text, filename);
      }
      setTextMsg(t({ bn: `PDF ডাউনলোড হয়েছে: ${filename}`, en: `PDF downloaded: ${filename}` }));
    } catch {
      setTextMsg(
        t({ bn: 'PDF তৈরি করা যায়নি। আবার চেষ্টা করুন।', en: 'Could not create the PDF. Please try again.' }),
      );
    } finally {
      setTextBusy(false);
    }
  }

  function handleFilesSelected(selected: FileList | null) {
    if (!selected) return;
    const pdfs = Array.from(selected).filter((f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
    setFiles((prev) => [...prev, ...pdfs]);
    if (pdfs.length < selected.length) {
      setMergeMsg(t({ bn: 'শুধু PDF ফাইল যোগ করা হয়েছে; অন্য ফাইলগুলো বাদ দেওয়া হয়েছে।', en: 'Only PDF files were added; other files were skipped.' }));
    } else {
      setMergeMsg('');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleMerge() {
    setMergeMsg('');
    if (files.length < 2) {
      setMergeMsg(t({ bn: 'মার্জ করতে অন্তত ২টি PDF ফাইল লাগবে।', en: 'Merging needs at least 2 PDF files.' }));
      return;
    }
    setMergeBusy(true);
    try {
      const PDFDocument = await loadPdfLib();
      const merged = await PDFDocument.create();
      for (const file of files) {
        const bytes = await file.arrayBuffer();
        const src = await PDFDocument.load(bytes, { ignoreEncryption: false });
        const pages = await merged.copyPages(src, src.getPageIndices());
        pages.forEach((page) => merged.addPage(page));
      }
      const out = await merged.save();
      await downloadBlob(new Blob([out.buffer as ArrayBuffer], { type: 'application/pdf' }), 'eduvelto-merged.pdf');
      setMergeMsg(
        t({ bn: `${files.length}টি PDF একত্র করে ডাউনলোড হয়েছে।`, en: `${files.length} PDFs merged and downloaded.` }),
      );
    } catch {
      setMergeMsg(
        t({
          bn: 'মার্জ করা যায়নি — ফাইলগুলো সঠিক PDF কি না দেখুন (পাসওয়ার্ড দেওয়া PDF মার্জ হয় না)।',
          en: 'Could not merge — check the files are valid PDFs (password-protected PDFs cannot be merged).',
        }),
      );
    } finally {
      setMergeBusy(false);
    }
  }

  return (
    <PageShell titleBn="PDF টুলস" titleEn="PDF Tools" wide>
      {/* Visible breadcrumb (24 Nov 2026 SEO pass) — labels match the BreadcrumbList JSON-LD in lib/seo.ts. */}
      <Breadcrumb items={[{ label: lang === 'bn' ? 'জীবন সেবা' : 'Life Services', to: '/life' }, { label: lang === 'bn' ? 'PDF টুলস' : 'PDF Tools' }]} />
      <p style={{ color: 'var(--muted)' }}>
        {t({
          bn: 'দুটো ছোট PDF টুল — সব কাজ আপনার ব্রাউজারেই হয়। আপনার ফাইল বা লেখা কোথাও আপলোড হয় না, কোনো সার্ভারে যায় না।',
          en: 'Two small PDF tools — everything runs in your browser. Your files and text are never uploaded or sent to any server.',
        })}
      </p>

      {/* (1) Text to PDF */}
      <section className="ev-card" style={{ marginTop: 16, display: 'grid', gap: 12 }} aria-labelledby="text-to-pdf-heading">
        <h2 id="text-to-pdf-heading" style={{ margin: 0, fontSize: 20, color: 'var(--heading)' }}>
          {t({ bn: '১. লেখা থেকে PDF', en: '1. Text to PDF' })}
        </h2>
        <label style={{ display: 'grid', gap: 6, fontWeight: 600 }}>
          {t({ bn: 'আপনার লেখা', en: 'Your text' })}
          <textarea
            className="ev-textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            placeholder={t({ bn: 'এখানে লিখুন বা পেস্ট করুন…', en: 'Type or paste here…' })}
          />
        </label>
        <label style={{ display: 'grid', gap: 6, fontWeight: 600 }}>
          {t({ bn: 'ফাইলের নাম (ঐচ্ছিক)', en: 'File name (optional)' })}
          <input
            className="ev-input"
            type="text"
            value={pdfName}
            onChange={(e) => setPdfName(e.target.value)}
            placeholder="eduvelto-text.pdf"
            maxLength={100}
          />
        </label>
        <p style={{ color: 'var(--muted)', fontSize: 14, margin: 0 }}>
          {hasBengali
            ? t({
                bn: 'বাংলা লেখা PDF-এ ছবি আকারে যাবে, যাতে যুক্তাক্ষর ঠিকভাবে দেখায় — তাই বাংলা PDF-এর ভেতরের লেখা কপি করা যাবে না। ইংরেজি লেখা সাধারণ PDF টেক্সট হিসেবে যাবে।',
                en: 'Bengali text goes into the PDF as an image so conjuncts render correctly — so Bengali text inside the PDF cannot be copied. English text goes in as normal PDF text.',
              })
            : t({
                bn: 'ইংরেজি লেখা সাধারণ PDF টেক্সট হিসেবে যাবে — কপি ও খোঁজা যাবে। বাংলা লিখলে তা ছবি আকারে যাবে, যাতে যুক্তাক্ষর ঠিক থাকে।',
                en: 'English text goes in as normal PDF text — copyable and searchable. Bengali text goes in as an image so conjuncts render correctly.',
              })}
        </p>
        <div>
          <button
            className="ev-btn ev-btn-primary"
            type="button"
            style={{ minHeight: 44 }}
            disabled={textBusy}
            onClick={() => void handleTextToPdf()}
          >
            {textBusy
              ? t({ bn: 'তৈরি হচ্ছে…', en: 'Creating…' })
              : t({ bn: 'PDF ডাউনলোড করুন', en: 'Download PDF' })}
          </button>
        </div>
        {textMsg ? (
          <p role="status" style={{ margin: 0 }}>
            {textMsg}
          </p>
        ) : null}
      </section>

      {/* (2) Merge PDFs */}
      <section className="ev-card" style={{ marginTop: 16, display: 'grid', gap: 12 }} aria-labelledby="merge-pdf-heading">
        <h2 id="merge-pdf-heading" style={{ margin: 0, fontSize: 20, color: 'var(--heading)' }}>
          {t({ bn: '২. PDF একত্র করুন', en: '2. Merge PDFs' })}
        </h2>
        <p style={{ margin: 0, color: 'var(--muted)' }}>
          {t({
            bn: '২টি বা তার বেশি PDF ফাইল বেছে নিন — সেগুলো একই ক্রমে একটি PDF-এ জোড়া হবে।',
            en: 'Choose 2 or more PDF files — they will be joined into one PDF in the same order.',
          })}
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,.pdf"
          multiple
          onChange={(e) => handleFilesSelected(e.target.files)}
          style={{ minHeight: 44 }}
          aria-label={t({ bn: 'PDF ফাইল বেছে নিন', en: 'Choose PDF files' })}
        />
        {files.length > 0 ? (
          <ol style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 8 }}>
            {files.map((file, idx) => (
              <li key={`${file.name}-${idx}`} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ flex: 1, minWidth: 0, overflowWrap: 'anywhere' }}>
                  {idx + 1}. {file.name} ({formatFileSize(file.size)})
                </span>
                <button
                  className="ev-btn ev-btn-ghost"
                  type="button"
                  style={{ minHeight: 44, flexShrink: 0 }}
                  onClick={() => setFiles((prev) => prev.filter((_, i) => i !== idx))}
                  aria-label={t({ bn: `বাদ দিন: ${file.name}`, en: `Remove: ${file.name}` })}
                >
                  {t({ bn: 'বাদ দিন', en: 'Remove' })}
                </button>
              </li>
            ))}
          </ol>
        ) : null}
        <div>
          <button
            className="ev-btn ev-btn-primary"
            type="button"
            style={{ minHeight: 44 }}
            disabled={mergeBusy || files.length < 2}
            onClick={() => void handleMerge()}
          >
            {mergeBusy
              ? t({ bn: 'মার্জ হচ্ছে…', en: 'Merging…' })
              : t({ bn: 'একত্র করে ডাউনলোড করুন', en: 'Merge and download' })}
          </button>
        </div>
        {mergeMsg ? (
          <p role="status" style={{ margin: 0 }}>
            {mergeMsg}
          </p>
        ) : null}
      </section>

      <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 20 }}>
        {t({
          bn: 'গোপনীয়তা: এই টুলগুলো সম্পূর্ণ আপনার ডিভাইসে চলে — কোনো ফাইল বা লেখা ইন্টারনেটে পাঠানো হয় না।',
          en: 'Privacy: these tools run entirely on your device — no file or text is sent over the internet.',
        })}
      </p>
    </PageShell>
  );
}
