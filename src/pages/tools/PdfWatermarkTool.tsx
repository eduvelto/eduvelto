// Eduvelto — PDF Watermark tool UI (Batch 3, 27 Nov 2026).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Logic in src/lib/tools/pdfPageOps.ts (pdf-lib, lazy). File stays on device.
// HONEST LIMIT: the watermark uses pdf-lib's built-in Helvetica font,
// which has no Bangla glyphs — Bangla letters become '?' in the PDF.
// The UI states this plainly and shows the Latin-safe preview.

import { useRef, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { Button } from '../../components/ui';
import RewardedAdButton from '../../components/RewardedAdButton';
import { getPdfPageCount, latinSafeText, stampPdfWatermark, type WatermarkPosition } from '../../lib/tools/pdfPageOps';
import {
  cardStyle, errorStyle, gridStyle, headlineLabelStyle, headlineStyle,
  heroDescStyle, heroStyle, heroTitleStyle, inputStyle, isOverLimit, labelStyle,
  noteStyle, PrivacyNote, resultStyle, Tile, tileGridStyle, trustChipStyle,
} from './toolShared';

const POSITIONS: { value: WatermarkPosition; bn: string; en: string }[] = [
  { value: 'center', bn: 'মাঝখানে (তির্যক)', en: 'Centre (diagonal)' },
  { value: 'top-left', bn: 'ওপরে বামে', en: 'Top left' },
  { value: 'top-right', bn: 'ওপরে ডানে', en: 'Top right' },
  { value: 'bottom-left', bn: 'নিচে বামে', en: 'Bottom left' },
  { value: 'bottom-right', bn: 'নিচে ডানে', en: 'Bottom right' },
];

export function PdfWatermarkTool() {
  const { t, lang } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [text, setText] = useState('');
  const [opacity, setOpacity] = useState('0.3');
  const [fontSize, setFontSize] = useState('48');
  const [position, setPosition] = useState<WatermarkPosition>('center');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const downloadRef = useRef<HTMLAnchorElement | null>(null);
  const [resultBytes, setResultBytes] = useState(0);

  async function handleFile(next: File | null): Promise<void> {
    setResultUrl(null); setPageCount(null); setError(null);
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

  async function handleStamp(): Promise<void> {
    if (!file || !text.trim()) return;
    setBusy(true); setError(null); setResultUrl(null);
    try {
      const blob = await stampPdfWatermark(file, {
        text,
        opacity: Number(opacity),
        fontSize: Number(fontSize),
        position,
      });
      setResultBytes(blob.size);
      setResultUrl(URL.createObjectURL(blob));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'failed');
    } finally {
      setBusy(false);
    }
  }

  const safePreview = latinSafeText(text);

  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="pdf-watermark-title">
      <div style={heroStyle}>
        <h2 id="pdf-watermark-title" style={heroTitleStyle}>{t({ bn: 'পিডিএফ ওয়াটারমার্ক', en: 'PDF Watermark' })}</h2>
        <p style={heroDescStyle}>{t({ bn: 'PDF-এর প্রতিটি পাতায় নিজের নাম বা লেখা ওয়াটারমার্ক হিসেবে বসান।', en: 'Add your name or text as a watermark on every page of a PDF.' })}</p>
        <span style={trustChipStyle}>{t({ bn: '✓ আপনার ডিভাইসেই প্রক্রিয়া হয়', en: '✓ Processed on your device' })}</span>
        <span style={trustChipStyle}>{t({ bn: '১০ MB পর্যন্ত', en: 'Up to 10 MB' })}</span>
      </div>
      <div style={gridStyle}>
        <div>
          <label style={labelStyle} htmlFor="pdf-wm-file">{t({ bn: 'পিডিএফ ফাইল', en: 'PDF file' })}</label>
          <input id="pdf-wm-file" style={inputStyle} type="file" accept="application/pdf,.pdf" onChange={(e) => void handleFile(e.target.files?.[0] ?? null)} />
        </div>
        <div>
          <label style={labelStyle} htmlFor="pdf-wm-text">{t({ bn: 'ওয়াটারমার্কের লেখা', en: 'Watermark text' })}</label>
          <input id="pdf-wm-text" style={inputStyle} type="text" value={text} maxLength={60} onChange={(e) => setText(e.target.value)} placeholder="Eduvelto" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="pdf-wm-position">{t({ bn: 'অবস্থান', en: 'Position' })}</label>
          <select id="pdf-wm-position" style={inputStyle} value={position} onChange={(e) => setPosition(e.target.value as WatermarkPosition)}>
            {POSITIONS.map((p) => (
              <option key={p.value} value={p.value}>{t({ bn: p.bn, en: p.en })}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle} htmlFor="pdf-wm-opacity">{t({ bn: 'অস্বচ্ছতা (opacity): ', en: 'Opacity: ' })}{Math.round(Number(opacity) * 100)}%</label>
          <input id="pdf-wm-opacity" style={inputStyle} type="range" min="0.1" max="1" step="0.05" value={opacity} onChange={(e) => setOpacity(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle} htmlFor="pdf-wm-size">{t({ bn: 'অক্ষরের আকার (pt)', en: 'Font size (pt)' })}</label>
          <input id="pdf-wm-size" style={inputStyle} type="number" min="8" max="200" value={fontSize} onChange={(e) => setFontSize(e.target.value)} />
        </div>
      </div>
      {text.trim() ? (
        <p style={noteStyle} role="status">
          {t({ bn: 'পিডিএফে যেভাবে বসবে: ', en: 'How it will appear in the PDF: ' })}
          <strong>{safePreview}</strong>
          {safePreview !== text.trim() ? ` — ${t({ bn: 'বাংলা অক্ষর PDF-এর ফন্টে নেই, তাই "?" দেখাবে। ইংরেজি লেখা ব্যবহার করুন।', en: 'Bangla letters are not in the PDF font, so they show as "?". Please use English text.' })}` : ''}
        </p>
      ) : null}
      {pageCount !== null && file ? (
        <p style={noteStyle}>{t({ bn: 'এই পিডিএফে মোট পাতা: ', en: 'This PDF has ' })}{pageCount}{t({ bn: 'টি — ওয়াটারমার্ক সব পাতায় বসবে।', en: ' page(s) — the watermark goes on every page.' })}</p>
      ) : null}
      <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Button onClick={() => void handleStamp()} loading={busy} disabled={!file || !text.trim()}>
          {t({ bn: 'ওয়াটারমার্ক বসান', en: 'Add watermark' })}
        </Button>
        <Button onClick={() => setText('Eduvelto')}>{t({ bn: 'উদাহরণ লোড করুন', en: 'Load example' })}</Button>
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
          <p style={headlineLabelStyle}>{t({ bn: 'ওয়াটারমার্ক', en: 'Watermark' })}</p>
          <p style={headlineStyle}>{safePreview}</p>
          <div style={tileGridStyle}>
            <Tile label={t({ bn: 'পাতা', en: 'Pages' })} value={pageCount ?? '—'} />
            <Tile label={t({ bn: 'অস্বচ্ছতা', en: 'Opacity' })} value={`${Math.round(Number(opacity) * 100)}%`} />
            <Tile label={t({ bn: 'নতুন ফাইলের আকার', en: 'New file size' })} value={`${(resultBytes / 1024).toFixed(1)} KB`} />
          </div>
          <a ref={downloadRef} href={resultUrl} download="watermarked.pdf" style={{ display: 'none' }} aria-hidden="true" tabIndex={-1} />
          {/* Ads rollout B2 (27 Nov 2026): this download goes through RewardedAdButton — Free Download is live, the 30s Unlock stays disabled until AdSense approval (never a fake timer). */}
          <RewardedAdButton lang={lang} onFreeDownload={() => downloadRef.current?.click()} />
        </div>
      ) : null}
    </section>
  );
}
