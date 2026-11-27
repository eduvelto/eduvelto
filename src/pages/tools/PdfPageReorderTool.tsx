// Eduvelto — PDF Page Reorder tool UI (Batch 3, 27 Nov 2026).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Logic in src/lib/tools/pdfPageOps.ts (pdf-lib, lazy). File stays on device.

import { useRef, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { Button } from '../../components/ui';
import RewardedAdButton from '../../components/RewardedAdButton';
import { getPdfPageCount, reorderPdfPages } from '../../lib/tools/pdfPageOps';
import {
  cardStyle, errorStyle, headlineLabelStyle, headlineStyle,
  heroDescStyle, heroStyle, heroTitleStyle, inputStyle, isOverLimit, labelStyle,
  noteStyle, PrivacyNote, resultStyle, Tile, tileGridStyle, trustChipStyle,
} from './toolShared';

export function PdfPageReorderTool() {
  const { t, lang } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [order, setOrder] = useState<number[]>([]);
  const [rotations, setRotations] = useState<Record<number, number>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const downloadRef = useRef<HTMLAnchorElement | null>(null);
  const [resultBytes, setResultBytes] = useState(0);

  async function handleFile(next: File | null): Promise<void> {
    setResultUrl(null); setOrder([]); setRotations({}); setPageCount(null); setError(null);
    if (!next) { setFile(null); return; }
    if (next.type !== 'application/pdf' && !next.name.toLowerCase().endsWith('.pdf')) {
      setFile(null); setError('not-pdf'); return;
    }
    if (isOverLimit(next)) { setFile(null); setError('too-big'); return; }
    setFile(next);
    try {
      const count = await getPdfPageCount(next);
      setPageCount(count);
      setOrder(Array.from({ length: count }, (_, i) => i + 1));
    } catch {
      setFile(null); setError('unreadable');
    }
  }

  function move(index: number, dir: -1 | 1): void {
    setOrder((prev) => {
      const next = [...prev];
      const j = index + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[index], next[j]] = [next[j], next[index]];
      return next;
    });
  }

  async function handleReorder(): Promise<void> {
    if (!file || order.length === 0) return;
    setBusy(true); setError(null); setResultUrl(null);
    try {
      const blob = await reorderPdfPages(file, order, rotations);
      setResultBytes(blob.size);
      setResultUrl(URL.createObjectURL(blob));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="pdf-page-reorder-title">
      <div style={heroStyle}>
        <h2 id="pdf-page-reorder-title" style={heroTitleStyle}>{t({ bn: 'পিডিএফ পাতা সাজানো', en: 'PDF Page Reorder' })}</h2>
        <p style={heroDescStyle}>{t({ bn: 'PDF-এর পাতার ক্রম বদলে বা ঘুরিয়ে নতুনভাবে সাজান।', en: 'Rearrange or rotate the pages of a PDF into a new order.' })}</p>
        <span style={trustChipStyle}>{t({ bn: '✓ আপনার ডিভাইসেই প্রক্রিয়া হয়', en: '✓ Processed on your device' })}</span>
        <span style={trustChipStyle}>{t({ bn: '১০ MB পর্যন্ত', en: 'Up to 10 MB' })}</span>
      </div>
      <div>
        <label style={labelStyle} htmlFor="pdf-reorder-file">{t({ bn: 'পিডিএফ ফাইল', en: 'PDF file' })}</label>
        <input id="pdf-reorder-file" style={inputStyle} type="file" accept="application/pdf,.pdf" onChange={(e) => void handleFile(e.target.files?.[0] ?? null)} />
      </div>
      {pageCount !== null && file ? (
        <div style={{ marginTop: 14 }}>
          <p style={noteStyle}>{t({ bn: 'তীর চিহ্ন দিয়ে পাতার ক্রম বদলান; প্রয়োজনে কোনো পাতা ঘোরান।', en: 'Use the arrows to change the page order; rotate a page if needed.' })}</p>
          <ol style={{ listStyle: 'none', padding: 0, margin: '12px 0 0', display: 'grid', gap: 8 }}>
            {order.map((page, i) => (
              <li key={page} style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid var(--line)', borderRadius: 8, padding: '8px 10px', background: 'var(--surface)' }}>
                <span style={{ fontWeight: 700, minWidth: 90 }}>{t({ bn: 'পাতা ', en: 'Page ' })}{page}</span>
                <span style={{ color: 'var(--muted)', fontSize: 13 }}>{t({ bn: 'নতুন অবস্থান ', en: 'New position ' })}{i + 1}</span>
                <span style={{ flex: 1 }} />
                <select
                  aria-label={t({ bn: `পাতা ${page} ঘোরান`, en: `Rotate page ${page}` })}
                  style={{ ...inputStyle, width: 110, minHeight: 36, padding: '6px 8px' }}
                  value={rotations[page] ?? 0}
                  onChange={(e) => setRotations((prev) => ({ ...prev, [page]: Number(e.target.value) }))}
                >
                  <option value={0}>{t({ bn: 'ঘোরাবেন না', en: 'No rotation' })}</option>
                  <option value={90}>90°</option>
                  <option value={180}>180°</option>
                  <option value={270}>270°</option>
                </select>
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={t({ bn: 'ওপরে নিন', en: 'Move up' })} style={{ minHeight: 36, minWidth: 36, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', cursor: i === 0 ? 'default' : 'pointer' }}>↑</button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === order.length - 1} aria-label={t({ bn: 'নিচে নিন', en: 'Move down' })} style={{ minHeight: 36, minWidth: 36, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', cursor: i === order.length - 1 ? 'default' : 'pointer' }}>↓</button>
              </li>
            ))}
          </ol>
          <div style={{ marginTop: 14 }}>
            <Button onClick={() => void handleReorder()} loading={busy} disabled={order.length === 0}>
              {t({ bn: 'নতুন ক্রমে পিডিএফ বানান', en: 'Build PDF in new order' })}
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
          <p style={headlineLabelStyle}>{t({ bn: 'নতুন ক্রম', en: 'New order' })}</p>
          <p style={headlineStyle}>{order.join(' → ')}</p>
          <div style={tileGridStyle}>
            <Tile label={t({ bn: 'পাতার সংখ্যা', en: 'Pages' })} value={pageCount ?? '—'} />
            <Tile label={t({ bn: 'ঘোরানো পাতা', en: 'Rotated pages' })} value={Object.values(rotations).filter((r) => r !== 0).length} />
            <Tile label={t({ bn: 'নতুন ফাইলের আকার', en: 'New file size' })} value={`${(resultBytes / 1024).toFixed(1)} KB`} />
          </div>
          <a ref={downloadRef} href={resultUrl} download="reordered.pdf" style={{ display: 'none' }} aria-hidden="true" tabIndex={-1} />
          {/* Ads rollout B2 (27 Nov 2026): this download goes through RewardedAdButton — Free Download is live, the 30s Unlock stays disabled until AdSense approval (never a fake timer). */}
          <RewardedAdButton lang={lang} onFreeDownload={() => downloadRef.current?.click()} />
        </div>
      ) : null}
    </section>
  );
}
