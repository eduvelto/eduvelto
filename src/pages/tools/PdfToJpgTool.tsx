// Eduvelto — PDF to JPG tool UI (27 Nov 2026).
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Logic in src/lib/tools/pdfToJpg.ts (pdf.js 5.4.624 legacy, lazy).
// The PDF never leaves the device: it is rendered 100% in the
// browser. Scale presets: 1x = 72 DPI, 2x = 144 DPI, 3x = 216 DPI.

import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { Button } from '../../components/ui';
import RewardedAdButton from '../../components/RewardedAdButton';
import {
  baseNameOf, getPdfInfo, isPdfFile, jpegFileName, renderPdfToJpegs,
  PDF_TO_JPG_MAX_MB, PDF_TO_JPG_MAX_PAGES, type PdfInfo, type RenderedPage,
} from '../../lib/tools/pdfToJpg';
import {
  cardStyle, errorStyle, headlineLabelStyle, headlineStyle,
  heroDescStyle, heroStyle, heroTitleStyle, inputStyle, isOverLimit, labelStyle,
  noteStyle, PrivacyNote, resultStyle, Tile, tileGridStyle, trustChipStyle,
} from './toolShared';

interface RenderedJpg {
  pageNumber: number;
  width: number;
  height: number;
  url: string;
  name: string;
  bytes: number;
}

const SCALE_PRESETS = [1, 1.5, 2, 3];

export function PdfToJpgTool() {
  const { t, lang } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [info, setInfo] = useState<PdfInfo | null>(null);
  const [scale, setScale] = useState(1.5);
  const [quality, setQuality] = useState(0.9);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<RenderedJpg[]>([]);
  // Ads rollout B3 (27 Nov 2026): one hidden anchor per page row, so
  // each page's JPG download goes through its own 15s rewarded gate
  // (one gate per download action, never two on the same file).
  const rowRefs = useRef(new Map<number, HTMLAnchorElement | null>());
  const urlsRef = useRef<string[]>([]);

  useEffect(() => {
    const urls = urlsRef.current;
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);

  function clearResults(): void {
    urlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    urlsRef.current = [];
    setResults([]);
  }

  async function renderAll(pdf: File, renderScale: number, renderQuality: number): Promise<void> {
    setBusy(true);
    setError(null);
    clearResults();
    setProgress('');
    try {
      const pages: RenderedPage[] = await renderPdfToJpegs(
        pdf,
        {
          scale: renderScale,
          quality: renderQuality,
          onProgress: (done, total) => setProgress(`${done}/${total}`),
        },
      );
      const base = baseNameOf(pdf.name);
      const made: RenderedJpg[] = pages.map((p) => {
        const url = URL.createObjectURL(p.blob);
        urlsRef.current.push(url);
        return {
          pageNumber: p.pageNumber,
          width: p.width,
          height: p.height,
          url,
          name: jpegFileName(base, p.pageNumber, pages.length),
          bytes: p.blob.size,
        };
      });
      setResults(made);
      setProgress('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'failed');
    } finally {
      setBusy(false);
    }
  }

  async function handleFile(next: File | null): Promise<void> {
    setError(null);
    setInfo(null);
    clearResults();
    setProgress('');
    if (!next) {
      setFile(null);
      return;
    }
    if (!isPdfFile(next, next.name)) {
      setFile(null);
      setError('not-pdf');
      return;
    }
    if (isOverLimit(next, PDF_TO_JPG_MAX_MB)) {
      setFile(null);
      setError('too-big');
      return;
    }
    setFile(next);
    try {
      const pdfInfo = await getPdfInfo(next);
      if (pdfInfo.pageCount > PDF_TO_JPG_MAX_PAGES) {
        setError('too-many-pages');
        return;
      }
      setInfo(pdfInfo);
      await renderAll(next, scale, quality);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'failed';
      setError(
        message.includes('password-protected')
          ? 'password-protected'
          : message.includes('Could not read')
            ? 'unreadable'
            : 'failed',
      );
    }
  }

  const totalJpgBytes = results.reduce((sum, r) => sum + r.bytes, 0);

  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="pdf-to-jpg-title">
      <div style={heroStyle}>
        <h2 id="pdf-to-jpg-title" style={heroTitleStyle}>{t({ bn: 'পিডিএফ থেকে জেপিজি', en: 'PDF to JPG' })}</h2>
        <p style={heroDescStyle}>{t({ bn: 'PDF-এর পাতাগুলোকে JPG ছবিতে রূপান্তর করুন।', en: 'Convert PDF pages into JPG images.' })}</p>
        <span style={trustChipStyle}>{t({ bn: '✓ আপনার ডিভাইসেই প্রক্রিয়া হয়', en: '✓ Processed on your device' })}</span>
        <span style={trustChipStyle}>PDF.js (Mozilla) • 5.4.624</span>
        <span style={trustChipStyle}>{t({ bn: '১০ MB পর্যন্ত, সর্বোচ্চ ৫০ পাতা', en: 'Up to 10 MB, max 50 pages' })}</span>
      </div>
      <div>
        <label style={labelStyle} htmlFor="pdf-jpg-file">{t({ bn: 'পিডিএফ ফাইল', en: 'PDF file' })}</label>
        <input id="pdf-jpg-file" style={inputStyle} type="file" accept="application/pdf,.pdf" onChange={(e) => void handleFile(e.target.files?.[0] ?? null)} />
      </div>
      {info ? (
        <div style={{ marginTop: 14 }}>
          <p style={noteStyle} role="status">
            {t({ bn: 'এই পিডিএফে মোট পাতা: ', en: 'This PDF has ' })}
            {info.pageCount}
            {t({ bn: 'টি।', en: ' page(s).' })}
          </p>
          <div style={{ marginTop: 10 }}>
            <span style={labelStyle}>{t({ bn: 'ছবির মান (DPI)', en: 'Image quality (DPI)' })}</span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
              {SCALE_PRESETS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setScale(s)}
                  aria-pressed={scale === s}
                  style={{
                    minHeight: 40, padding: '0 14px', borderRadius: 8, fontSize: 14, fontWeight: 600,
                    border: scale === s ? '2px solid var(--teal, #0b7285)' : '1px solid var(--line)',
                    background: scale === s ? 'var(--teal-soft)' : 'var(--surface)',
                    color: 'var(--heading)', cursor: 'pointer',
                  }}
                >
                  {s}× ({Math.round(s * 72)} DPI)
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 10 }}>
            <label style={labelStyle} htmlFor="pdf-jpg-quality">
              {t({ bn: 'JPG কোয়ালিটি', en: 'JPG quality' })} — {Math.round(quality * 100)}%
            </label>
            <input
              id="pdf-jpg-quality"
              style={{ width: '100%' }}
              type="range"
              min={50}
              max={100}
              value={Math.round(quality * 100)}
              onChange={(e) => setQuality(Number(e.target.value) / 100)}
            />
          </div>
          <div style={{ marginTop: 14 }}>
            <Button onClick={() => file && info && void renderAll(file, scale, quality)} loading={busy} disabled={!file || !info}>
              {t({ bn: 'আবার রূপান্তর করুন', en: 'Convert again' })}
            </Button>
            {busy && progress ? (
              <p style={noteStyle} role="status">
                {t({ bn: 'রূপান্তর চলছে: ', en: 'Converting: ' })}
                {progress}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
      <PrivacyNote limitMb={PDF_TO_JPG_MAX_MB} />
      {error ? (
        <p style={errorStyle} role="alert">
          {error === 'not-pdf' ? t({ bn: 'শুধু পিডিএফ ফাইল চলবে — একটি .pdf ফাইল বাছুন।', en: 'Only PDF files work — choose a .pdf file.' })
            : error === 'too-big' ? t({ bn: 'ফাইলটি ১০ MB-এর বেশি — ছোট পিডিএফ বাছুন।', en: 'The file is over 10 MB — choose a smaller PDF.' })
            : error === 'too-many-pages' ? t({ bn: 'এই পিডিএফে ৫০টির বেশি পাতা আছে — একবারে সর্বোচ্চ ৫০ পাতা রূপান্তর করা যায়।', en: 'This PDF has more than 50 pages — at most 50 pages can be converted at once.' })
            : error === 'password-protected' ? t({ bn: 'এই পিডিএফে পাসওয়ার্ড দেওয়া আছে — আগে পাসওয়ার্ড সরিয়ে নিন।', en: 'This PDF is password-protected — remove the password first.' })
            : error === 'unreadable' ? t({ bn: 'এই ফাইলটি পিডিএফ হিসেবে পড়া যায়নি — ফাইলটি নষ্ট বা পিডিএফ নয়।', en: 'This file could not be read as a PDF — it may be corrupt or not a PDF.' })
            : t({ bn: 'রূপান্তর করা যায়নি — আবার চেষ্টা করুন।', en: 'Could not convert — please try again.' })}
        </p>
      ) : null}
      {results.length > 0 ? (
        <div style={resultStyle} role="status">
          <p style={headlineLabelStyle}>{t({ bn: 'JPG ছবি তৈরি হয়েছে', en: 'JPG images created' })}</p>
          <p style={headlineStyle}>{results.length}</p>
          <div style={tileGridStyle}>
            <Tile label={t({ bn: 'পাতা', en: 'Pages' })} value={results.length} />
            <Tile label={t({ bn: 'মোট JPG আকার', en: 'Total JPG size' })} value={`${(totalJpgBytes / 1024).toFixed(1)} KB`} />
            <Tile label={t({ bn: 'ছবির মান', en: 'Quality' })} value={`${Math.round(scale * 72)} DPI`} />
          </div>
          <ol style={{ listStyle: 'none', padding: 0, margin: '14px 0 0', display: 'grid', gap: 10 }}>
            {results.map((r) => (
              <li key={r.pageNumber} style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px solid var(--line)', borderRadius: 8, padding: '8px 10px', background: 'var(--surface)' }}>
                <img src={r.url} alt={r.name} style={{ width: 48, height: 64, objectFit: 'cover', borderRadius: 6 }} />
                <span style={{ fontSize: 14, flex: 1, wordBreak: 'break-word' }}>
                  {t({ bn: 'পাতা ', en: 'Page ' })}{r.pageNumber} · {r.width}×{r.height} · {(r.bytes / 1024).toFixed(1)} KB
                </span>
                <a ref={(el) => { rowRefs.current.set(r.pageNumber, el); }} href={r.url} download={r.name} style={{ display: 'none' }} aria-hidden="true" tabIndex={-1} />
                {/* Ads rollout B3 (27 Nov 2026): each page's JPG download goes through RewardedAdButton (15s) — Free Download is live, the 15s Unlock stays disabled until AdSense approval (never a fake timer). */}
                <RewardedAdButton lang={lang} durationSeconds={15} onFreeDownload={() => rowRefs.current.get(r.pageNumber)?.click()} />
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </section>
  );
}
