// Eduvelto — PDF Page Remover tool UI (Batch 3, 27 Nov 2026).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Logic in src/lib/tools/pdfPageOps.ts (pdf-lib, lazy). File stays on device.

import { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { Button } from '../../components/ui';
import { getPdfPageCount, removePdfPages } from '../../lib/tools/pdfPageOps';
import {
  cardStyle, downloadStyle, errorStyle, headlineLabelStyle, headlineStyle,
  heroDescStyle, heroStyle, heroTitleStyle, inputStyle, isOverLimit, labelStyle,
  noteStyle, PrivacyNote, resultStyle, Tile, tileGridStyle, trustChipStyle,
} from './toolShared';

export function PdfPageRemoverTool() {
  const { t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [remove, setRemove] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [keptCount, setKeptCount] = useState(0);
  const [resultBytes, setResultBytes] = useState(0);

  async function handleFile(next: File | null): Promise<void> {
    setResultUrl(null); setRemove(new Set()); setPageCount(null); setError(null);
    if (!next) { setFile(null); return; }
    if (next.type !== 'application/pdf' && !next.name.toLowerCase().endsWith('.pdf')) {
      setFile(null); setError('not-pdf'); return;
    }
    if (isOverLimit(next)) { setFile(null); setError('too-big'); return; }
    setFile(next);
    try {
      setPageCount(await getPdfPageCount(next));
    } catch {
      setFile(null); setError('unreadable');
    }
  }

  function toggle(page: number): void {
    setRemove((prev) => {
      const next = new Set(prev);
      if (next.has(page)) next.delete(page); else next.add(page);
      return next;
    });
  }

  async function handleRemove(): Promise<void> {
    if (!file || pageCount === null || remove.size === 0) return;
    setBusy(true); setError(null); setResultUrl(null);
    try {
      const blob = await removePdfPages(file, [...remove].sort((a, b) => a - b));
      setKeptCount(pageCount - remove.size);
      setResultBytes(blob.size);
      setResultUrl(URL.createObjectURL(blob));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="pdf-page-remover-title">
      <div style={heroStyle}>
        <h2 id="pdf-page-remover-title" style={heroTitleStyle}>{t({ bn: 'পিডিএফ পাতা রিমুভার', en: 'PDF Page Remover' })}</h2>
        <p style={heroDescStyle}>{t({ bn: 'PDF থেকে অপ্রয়োজনীয় পাতা সরিয়ে নতুন PDF সংরক্ষণ করুন।', en: 'Remove unwanted pages from a PDF and save a new PDF.' })}</p>
        <span style={trustChipStyle}>{t({ bn: '✓ আপনার ডিভাইসেই প্রক্রিয়া হয়', en: '✓ Processed on your device' })}</span>
        <span style={trustChipStyle}>{t({ bn: '১০ MB পর্যন্ত', en: 'Up to 10 MB' })}</span>
      </div>
      <div>
        <label style={labelStyle} htmlFor="pdf-remove-file">{t({ bn: 'পিডিএফ ফাইল', en: 'PDF file' })}</label>
        <input id="pdf-remove-file" style={inputStyle} type="file" accept="application/pdf,.pdf" onChange={(e) => void handleFile(e.target.files?.[0] ?? null)} />
      </div>
      {pageCount !== null && file ? (
        <div style={{ marginTop: 14 }}>
          <p style={noteStyle}>{t({ bn: 'সরাতে চাওয়া পাতাগুলোতে টিক দিন (মোট পাতা: ', en: 'Tick the pages to remove (total pages: ' })}{pageCount}{t({ bn: ')। কমপক্ষে একটি পাতা থাকতে হবে।', en: '). At least one page must remain.' })}</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
            {Array.from({ length: pageCount }, (_, i) => i + 1).map((page) => (
              <label key={page} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: '1px solid var(--line)', borderRadius: 8, padding: '8px 12px', fontSize: 14, background: remove.has(page) ? 'var(--teal-soft)' : 'var(--surface)', cursor: 'pointer' }}>
                <input type="checkbox" checked={remove.has(page)} onChange={() => toggle(page)} />
                {t({ bn: 'পাতা ', en: 'Page ' })}{page}
              </label>
            ))}
          </div>
          <div style={{ marginTop: 14 }}>
            <Button onClick={() => void handleRemove()} loading={busy} disabled={remove.size === 0}>
              {t({ bn: 'পাতা সরিয়ে নতুন পিডিএফ বানান', en: 'Remove pages & make new PDF' })}
            </Button>
          </div>
        </div>
      ) : null}
      <PrivacyNote />
      {error ? (
        <p style={errorStyle} role="alert">
          {error === 'not-pdf' ? t({ bn: 'শুধু পিডিএফ ফাইল চলবে — একটি .pdf ফাইল বাছুন।', en: 'Only PDF files work — choose a .pdf file.' })
            : error === 'too-big' ? t({ bn: 'ফাইলটি ১০ MB-এর বেশি — ছোট ফাইল বাছুন।', en: 'The file is over 10 MB — choose a smaller file.' })
            : error === 'unreadable' ? t({ bn: 'এই ফাইলটি পিডিএফ হিসেবে পড়া যায়নি — ফাইলটি নষ্ট বা পিডিএফ নয়।', en: 'This file could not be read as a PDF — it may be corrupt or not a PDF.' })
            : error}
        </p>
      ) : null}
      {resultUrl ? (
        <div style={resultStyle} role="status">
          <p style={headlineLabelStyle}>{t({ bn: 'বাকি পাতা', en: 'Pages kept' })}</p>
          <p style={headlineStyle}>{keptCount}</p>
          <div style={tileGridStyle}>
            <Tile label={t({ bn: 'সরানো পাতা', en: 'Pages removed' })} value={remove.size} />
            <Tile label={t({ bn: 'নতুন ফাইলের আকার', en: 'New file size' })} value={`${(resultBytes / 1024).toFixed(1)} KB`} />
            <Tile label={t({ bn: 'মূল পাতা', en: 'Original pages' })} value={pageCount ?? '—'} />
          </div>
          <a href={resultUrl} download="pages-removed.pdf" style={downloadStyle}>{t({ bn: 'নতুন পিডিএফ ডাউনলোড করুন', en: 'Download the new PDF' })}</a>
        </div>
      ) : null}
    </section>
  );
}
