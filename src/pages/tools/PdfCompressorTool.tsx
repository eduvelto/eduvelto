// Eduvelto — PDF Compressor tool UI (100-Tools Project, Phase 2, Wave 3).
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// The PDF never leaves the device: it is re-saved 100% in the browser.
// Best-effort only — the UI reports the real before/after byte counts
// and never promises a ratio. pdf-lib is loaded with a dynamic import()
// only (never a static import), so it stays out of the main bundle.

import { useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { Button } from '../../components/ui';
import { compressPdf } from '../../lib/tools/pdfCompressor';

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

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

function isPdfFile(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}

export function PdfCompressorTool() {
  const { t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [originalBytes, setOriginalBytes] = useState(0);
  const [newBytes, setNewBytes] = useState(0);
  const [savedPercent, setSavedPercent] = useState(0);

  function handleFileChange(next: File | null): void {
    setResultUrl(null);
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
  }

  async function handleCompress(): Promise<void> {
    if (!file) return;
    setBusy(true);
    setError(null);
    setResultUrl(null);
    try {
      const result = await compressPdf(file);
      setOriginalBytes(result.originalBytes);
      setNewBytes(result.newBytes);
      setSavedPercent(result.savedPercent);
      setResultUrl(URL.createObjectURL(result.blob));
    } catch {
      setError('failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="pdf-compressor-title">
      <h2 id="pdf-compressor-title" style={{ fontSize: 19, color: 'var(--heading)', margin: '0 0 4px' }}>
        {t({ bn: 'পিডিএফ ছোট করুন', en: 'Compress PDF' })}
      </h2>
      <p style={{ color: 'var(--muted)', fontSize: 14, margin: '0 0 14px' }}>
        {t({
          bn: 'পিডিএফটি আবার সংরক্ষণ করে অপ্রয়োজনীয় অংশ ফেলে দেওয়া হয়। ফাইল আপনার ডিভাইসেই থাকে, কোথাও আপলোড হয় না।',
          en: 'The PDF is re-saved, dropping unused parts. The file stays on your device and is never uploaded.',
        })}
      </p>
      <div>
        <label style={labelStyle} htmlFor="pdf-compress-file">
          {t({ bn: 'পিডিএফ ফাইল', en: 'PDF file' })}
        </label>
        <input
          id="pdf-compress-file"
          style={inputStyle}
          type="file"
          accept="application/pdf,.pdf"
          onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
        />
      </div>
      <div style={{ marginTop: 14 }}>
        <Button onClick={() => void handleCompress()} loading={busy} disabled={!file}>
          {t({ bn: 'ছোট করুন', en: 'Compress PDF' })}
        </Button>
      </div>
      {error ? (
        <p style={errorStyle} role="alert">
          {error === 'not-pdf'
            ? t({ bn: 'শুধু পিডিএফ ফাইল চলবে — একটি .pdf ফাইল বাছুন।', en: 'Only PDF files work — choose a .pdf file.' })
            : t({ bn: 'এই ফাইলটি পিডিএফ হিসেবে পড়া যায়নি — ফাইলটি নষ্ট বা পিডিএফ নয়।', en: 'This file could not be read as a PDF — it may be corrupt or not a PDF.' })}
        </p>
      ) : null}
      {resultUrl ? (
        <div style={resultStyle} role="status">
          <p style={{ margin: '0 0 6px', fontSize: 16 }}>
            <strong>
              {t({ bn: 'আগে: ', en: 'Before: ' })}
              {fmtBytes(originalBytes)}
              {' · '}
              {t({ bn: 'পরে: ', en: 'After: ' })}
              {fmtBytes(newBytes)}
            </strong>
          </p>
          <p style={{ margin: '0 0 6px', fontSize: 15 }}>
            {savedPercent > 0
              ? t({ bn: 'সাশ্রয়: ', en: 'Saved: ' }) + `${savedPercent}%`
              : t({
                  bn: 'এই ফাইলটি আর ছোট করা যায়নি — এটি আগেই যতটা ছোট হওয়া যায় ততটাই ছোট।',
                  en: 'Nothing more could be saved — this file is already as small as it can be.',
                })}
          </p>
          <a href={resultUrl} download="compressed.pdf" style={downloadStyle}>
            {t({ bn: 'ছোট পিডিএফ ডাউনলোড করুন', en: 'Download the compressed PDF' })}
          </a>
          <p style={noteStyle}>
            {t({
              bn: 'কতটা ছোট হবে তা ফাইলের ওপর নির্ভর করে — কোনো নির্দিষ্ট হার দেওয়ার প্রতিশ্রুতি দেওয়া হয় না।',
              en: 'How much smaller it gets depends on the file — no fixed saving is promised.',
            })}
          </p>
        </div>
      ) : null}
    </section>
  );
}
