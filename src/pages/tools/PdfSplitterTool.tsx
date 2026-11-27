// Eduvelto — PDF Splitter tool UI (100-Tools Project, Phase 2, Wave 3).
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// The PDF never leaves the device: it is read and split 100% in the
// browser. pdf-lib is loaded with a dynamic import() only (never a
// static import), so it stays out of the main bundle. Page selection
// syntax: "1,3-5" — 1-based, bounds-checked against the real page count.

import { useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { Button } from '../../components/ui';
import { parsePageSelection, splitPdf } from '../../lib/tools/pdfSplitter';

const inputStyle: CSSProperties = {
  width: '100%',
  minHeight: 44,
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid var(--line)',
  fontSize: 15,
  boxSizing: 'border-box',
  background: 'var(--surface)',
  color: 'var(--heading)',
};

const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--heading)',
  marginBottom: 6,
};

const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: 12,
};

const cardStyle: CSSProperties = {
  marginTop: 16,
  padding: '18px 16px',
};

const resultStyle: CSSProperties = {
  marginTop: 14,
  padding: '14px 16px',
  borderRadius: 10,
  background: 'var(--teal-soft)',
};

const noteStyle: CSSProperties = {
  margin: '10px 0 0',
  fontSize: 13,
  color: 'var(--muted)',
};

const errorStyle: CSSProperties = {
  marginTop: 14,
  color: '#b3261e',
  fontSize: 14,
};

const downloadStyle: CSSProperties = {
  display: 'inline-block',
  marginTop: 10,
  minHeight: 44,
  lineHeight: '44px',
  padding: '0 18px',
  borderRadius: 8,
  background: 'var(--teal, #0b7285)',
  color: '#fff',
  fontWeight: 600,
  textDecoration: 'none',
};

function isPdfFile(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}

export function PdfSplitterTool() {
  const { t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [selection, setSelection] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultPages, setResultPages] = useState<number[]>([]);

  async function handleFileChange(next: File | null): Promise<void> {
    setResultUrl(null);
    setResultPages([]);
    setPageCount(null);
    setError(null);
    if (!next) {
      setFile(null);
      return;
    }
    if (!isPdfFile(next)) {
      setFile(null);
      setError('not-pdf');
      return;
    }
    setFile(next);
    // Read the real page count (lazy pdf-lib load — dynamic import only).
    try {
      const { PDFDocument } = await import('pdf-lib');
      const doc = await PDFDocument.load(await next.arrayBuffer());
      setPageCount(doc.getPageCount());
    } catch {
      setFile(null);
      setError('unreadable');
    }
  }

  async function handleSplit(): Promise<void> {
    if (!file || pageCount === null) return;
    setBusy(true);
    setError(null);
    setResultUrl(null);
    setResultPages([]);
    try {
      const pages = parsePageSelection(selection, pageCount);
      const blob = await splitPdf(file, pages);
      setResultPages(pages);
      setResultUrl(URL.createObjectURL(blob));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="pdf-splitter-title">
      <h2 id="pdf-splitter-title" style={{ fontSize: 19, color: 'var(--heading)', margin: '0 0 4px' }}>
        {t({ bn: 'পিডিএফ ভাগ করুন', en: 'Split PDF' })}
      </h2>
      <p style={{ color: 'var(--muted)', fontSize: 14, margin: '0 0 14px' }}>
        {t({
          bn: 'পিডিএফ থেকে দরকারি পাতাগুলো আলাদা করে নতুন পিডিএফ বানান। ফাইল আপনার ডিভাইসেই থাকে, কোথাও আপলোড হয় না।',
          en: 'Extract the pages you need from a PDF into a new PDF. The file stays on your device and is never uploaded.',
        })}
      </p>
      <div style={gridStyle}>
        <div>
          <label style={labelStyle} htmlFor="pdf-split-file">
            {t({ bn: 'পিডিএফ ফাইল', en: 'PDF file' })}
          </label>
          <input
            id="pdf-split-file"
            style={inputStyle}
            type="file"
            accept="application/pdf,.pdf"
            onChange={(e) => void handleFileChange(e.target.files?.[0] ?? null)}
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="pdf-split-selection">
            {t({ bn: 'পাতা বাছাই (যেমন 1,3-5)', en: 'Page selection (e.g. 1,3-5)' })}
          </label>
          <input
            id="pdf-split-selection"
            style={inputStyle}
            type="text"
            inputMode="numeric"
            value={selection}
            onChange={(e) => setSelection(e.target.value)}
            placeholder="1,3-5"
            disabled={pageCount === null}
          />
        </div>
      </div>
      {pageCount !== null && file ? (
        <p style={noteStyle} role="status">
          {t({ bn: 'এই পিডিএফে মোট পাতা: ', en: 'This PDF has ' })}
          {pageCount}
          {t({ bn: 'টি।', en: ' page(s).' })}
        </p>
      ) : null}
      <div style={{ marginTop: 14 }}>
        <Button onClick={() => void handleSplit()} loading={busy} disabled={!file || pageCount === null || selection.trim() === ''}>
          {t({ bn: 'ভাগ করুন', en: 'Split PDF' })}
        </Button>
      </div>
      {error ? (
        <p style={errorStyle} role="alert">
          {error === 'not-pdf'
            ? t({ bn: 'শুধু পিডিএফ ফাইল চলবে — একটি .pdf ফাইল বাছুন।', en: 'Only PDF files work — choose a .pdf file.' })
            : error === 'unreadable'
              ? t({ bn: 'এই ফাইলটি পিডিএফ হিসেবে পড়া যায়নি — ফাইলটি নষ্ট বা পিডিএফ নয়।', en: 'This file could not be read as a PDF — it may be corrupt or not a PDF.' })
              : error === 'failed'
                ? t({ bn: 'ভাগ করা যায়নি — আবার চেষ্টা করুন।', en: 'Could not split — please try again.' })
                : error}
        </p>
      ) : null}
      {resultUrl ? (
        <div style={resultStyle} role="status">
          <p style={{ margin: '0 0 6px', fontSize: 16 }}>
            <strong>
              {t({ bn: 'তৈরি! পাতা: ', en: 'Done! Pages: ' })}
              {resultPages.join(', ')}
            </strong>
          </p>
          <a href={resultUrl} download="split-pages.pdf" style={downloadStyle}>
            {t({ bn: 'নতুন পিডিএফ ডাউনলোড করুন', en: 'Download the new PDF' })}
          </a>
          <p style={noteStyle}>
            {t({
              bn: 'পাতা ১ থেকে গোনা হয়; যেমন "1,3-5" মানে ১, ৩, ৪ ও ৫ নম্বর পাতা।',
              en: 'Pages are counted from 1; e.g. "1,3-5" means pages 1, 3, 4 and 5.',
            })}
          </p>
        </div>
      ) : null}
    </section>
  );
}
