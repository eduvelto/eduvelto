// Eduvelto — PDF Page Extractor tool UI (Batch 3, 27 Nov 2026).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Logic in src/lib/tools/pdfPageOps.ts (pdf-lib, lazy). File stays on device.

import { useRef, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { Button } from '../../components/ui';
import RewardedAdButton from '../../components/RewardedAdButton';
import { extractPdfPages, getPdfPageCount, parsePageSelection } from '../../lib/tools/pdfPageOps';
import {
  cardStyle, errorStyle, gridStyle, headlineLabelStyle, headlineStyle,
  heroDescStyle, heroStyle, heroTitleStyle, inputStyle, isOverLimit, labelStyle,
  noteStyle, PrivacyNote, resultStyle, sectionDescStyle, Tile, tileGridStyle, trustChipStyle,
} from './toolShared';

export function PdfPageExtractorTool() {
  const { t, lang } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [selection, setSelection] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const downloadRef = useRef<HTMLAnchorElement | null>(null);
  const [keptPages, setKeptPages] = useState<number[]>([]);
  const [resultBytes, setResultBytes] = useState(0);

  async function handleFile(next: File | null): Promise<void> {
    setResultUrl(null); setKeptPages([]); setPageCount(null); setError(null);
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

  async function handleExtract(): Promise<void> {
    if (!file || pageCount === null) return;
    setBusy(true); setError(null); setResultUrl(null);
    try {
      const pages = parsePageSelection(selection, pageCount);
      const blob = await extractPdfPages(file, pages);
      setKeptPages(pages);
      setResultBytes(blob.size);
      setResultUrl(URL.createObjectURL(blob));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="pdf-page-extractor-title">
      <div style={heroStyle}>
        <h2 id="pdf-page-extractor-title" style={heroTitleStyle}>{t({ bn: 'পিডিএফ পাতা এক্সট্রাক্টর', en: 'PDF Page Extractor' })}</h2>
        <p style={heroDescStyle}>{t({ bn: 'PDF থেকে একটি বা একাধিক পাতা বেছে আলাদা PDF হিসেবে সংরক্ষণ করুন।', en: 'Pick one or more pages from a PDF and save them as a separate PDF.' })}</p>
        <span style={trustChipStyle}>{t({ bn: '✓ আপনার ডিভাইসেই প্রক্রিয়া হয়', en: '✓ Processed on your device' })}</span>
        <span style={trustChipStyle}>{t({ bn: '১০ MB পর্যন্ত', en: 'Up to 10 MB' })}</span>
      </div>
      <p style={sectionDescStyle}>{t({ bn: 'পাতা বাছাই করুন — যেমন "1,3-5" মানে ১, ৩, ৪ ও ৫ নম্বর পাতা।', en: 'Choose pages — e.g. "1,3-5" means pages 1, 3, 4 and 5.' })}</p>
      <div style={gridStyle}>
        <div>
          <label style={labelStyle} htmlFor="pdf-extract-file">{t({ bn: 'পিডিএফ ফাইল', en: 'PDF file' })}</label>
          <input id="pdf-extract-file" style={inputStyle} type="file" accept="application/pdf,.pdf" onChange={(e) => void handleFile(e.target.files?.[0] ?? null)} />
        </div>
        <div>
          <label style={labelStyle} htmlFor="pdf-extract-selection">{t({ bn: 'পাতা বাছাই (যেমন 1,3-5)', en: 'Page selection (e.g. 1,3-5)' })}</label>
          <input id="pdf-extract-selection" style={inputStyle} type="text" inputMode="numeric" value={selection} onChange={(e) => setSelection(e.target.value)} placeholder="1,3-5" disabled={pageCount === null} />
        </div>
      </div>
      {pageCount !== null && file ? (
        <p style={noteStyle} role="status">{t({ bn: 'এই পিডিএফে মোট পাতা: ', en: 'This PDF has ' })}{pageCount}{t({ bn: 'টি।', en: ' page(s).' })}</p>
      ) : null}
      <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Button onClick={() => void handleExtract()} loading={busy} disabled={!file || pageCount === null || selection.trim() === ''}>
          {t({ bn: 'পাতা আলাদা করুন', en: 'Extract pages' })}
        </Button>
        <Button onClick={() => setSelection(pageCount ? `1-${pageCount}` : '')} disabled={pageCount === null}>
          {t({ bn: 'সব পাতা বাছুন', en: 'Select all pages' })}
        </Button>
      </div>
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
          <p style={headlineLabelStyle}>{t({ bn: 'আলাদা করা পাতা', en: 'Extracted pages' })}</p>
          <p style={headlineStyle}>{keptPages.join(', ')}</p>
          <div style={tileGridStyle}>
            <Tile label={t({ bn: 'পাতার সংখ্যা', en: 'Pages' })} value={keptPages.length} />
            <Tile label={t({ bn: 'নতুন ফাইলের আকার', en: 'New file size' })} value={`${(resultBytes / 1024).toFixed(1)} KB`} />
            <Tile label={t({ bn: 'মূল পাতা', en: 'Original pages' })} value={pageCount ?? '—'} />
          </div>
          <a ref={downloadRef} href={resultUrl} download="extracted-pages.pdf" style={{ display: 'none' }} aria-hidden="true" tabIndex={-1} />
          {/* Ads rollout B2 (27 Nov 2026): this download goes through RewardedAdButton — Free Download is live, the 30s Unlock stays disabled until AdSense approval (never a fake timer). */}
          <RewardedAdButton lang={lang} onFreeDownload={() => downloadRef.current?.click()} />
        </div>
      ) : null}
    </section>
  );
}
