// Eduvelto — Image Filter tool UI (Batch 3, 27 Nov 2026).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Logic in src/lib/tools/imageConvert.ts (canvas + CSS filters).
// File stays on device. Live preview via ctx.filter on a canvas.

import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { Button } from '../../components/ui';
import RewardedAdButton from '../../components/RewardedAdButton';
import { convertImage, FILTER_LABELS, IMAGE_FILTERS, realImageDeps } from '../../lib/tools/imageConvert';
import {
  cardStyle, errorStyle, headlineLabelStyle, headlineStyle,
  heroDescStyle, heroStyle, heroTitleStyle, inputStyle, isOverLimit, labelStyle,
  noteStyle, previewStyle, PrivacyNote, resultStyle, Tile, tileGridStyle, trustChipStyle,
} from './toolShared';

export function ImageFilterTool() {
  const { t, lang } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [imgEl, setImgEl] = useState<HTMLImageElement | null>(null);
  const [filter, setFilter] = useState('none');
  const [format, setFormat] = useState<'image/jpeg' | 'image/png' | 'image/webp'>('image/jpeg');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const downloadRef = useRef<HTMLAnchorElement | null>(null);
  const [result, setResult] = useState<{ width: number; height: number; bytes: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  function handleFile(next: File | null): void {
    setResultUrl(null); setResult(null); setError(null); setImgEl(null);
    if (!next) { setFile(null); return; }
    if (!next.type.startsWith('image/')) { setFile(null); setError('not-image'); return; }
    if (isOverLimit(next)) { setFile(null); setError('too-big'); return; }
    setFile(next);
    const url = URL.createObjectURL(next);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); setImgEl(img); };
    img.onerror = () => { URL.revokeObjectURL(url); setFile(null); setError('unreadable'); };
    img.src = url;
  }

  // Live preview with the chosen CSS filter.
  useEffect(() => {
    if (!imgEl || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const scale = Math.min(1, 480 / Math.max(imgEl.naturalWidth, imgEl.naturalHeight));
    canvas.width = Math.max(1, Math.round(imgEl.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(imgEl.naturalHeight * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.filter = IMAGE_FILTERS[filter] ?? 'none';
    ctx.drawImage(imgEl, 0, 0, canvas.width, canvas.height);
    ctx.filter = 'none';
  }, [imgEl, filter]);

  async function handleApply(): Promise<void> {
    if (!file) return;
    setBusy(true); setError(null); setResultUrl(null);
    try {
      const out = await convertImage(file, { format, quality: 0.92, filter }, realImageDeps());
      setResult({ width: out.width, height: out.height, bytes: out.blob.size });
      setResultUrl(URL.createObjectURL(out.blob));
    } catch {
      setError('failed');
    } finally {
      setBusy(false);
    }
  }

  const ext = format === 'image/png' ? 'png' : format === 'image/webp' ? 'webp' : 'jpg';

  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="image-filter-title">
      <div style={heroStyle}>
        <h2 id="image-filter-title" style={heroTitleStyle}>{t({ bn: 'ছবির ফিল্টার', en: 'Image Filter' })}</h2>
        <p style={heroDescStyle}>{t({ bn: 'ছবিতে সাদা-কালো, ঝাপসা ও অন্যান্য ফিল্টার বসিয়ে নতুন রূপ দিন।', en: 'Apply black-and-white, blur and other filters to give an image a new look.' })}</p>
        <span style={trustChipStyle}>{t({ bn: '✓ আপনার ডিভাইসেই প্রক্রিয়া হয়', en: '✓ Processed on your device' })}</span>
        <span style={trustChipStyle}>{t({ bn: 'লাইভ প্রিভিউ', en: 'Live preview' })}</span>
      </div>
      <div>
        <label style={labelStyle} htmlFor="filter-file">{t({ bn: 'ছবির ফাইল', en: 'Image file' })}</label>
        <input id="filter-file" style={inputStyle} type="file" accept="image/*" onChange={(e) => handleFile(e.target.files?.[0] ?? null)} />
      </div>
      {imgEl ? (
        <>
          <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }} role="group" aria-label={t({ bn: 'ফিল্টার বাছুন', en: 'Choose a filter' })}>
            {Object.keys(IMAGE_FILTERS).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                aria-pressed={filter === key}
                style={{ minHeight: 36, padding: '6px 14px', borderRadius: 999, border: filter === key ? '2px solid var(--teal, #0b7285)' : '1px solid var(--line)', background: 'var(--surface)', color: 'var(--heading)', fontWeight: 600, cursor: 'pointer' }}
              >
                {t({ bn: FILTER_LABELS[key].bn, en: FILTER_LABELS[key].en })}
              </button>
            ))}
          </div>
          <canvas ref={canvasRef} style={previewStyle} aria-label={t({ bn: 'ফিল্টারের প্রিভিউ', en: 'Filter preview' })} />
          <p style={noteStyle}>{t({ bn: 'বর্তমান ফিল্টার: ', en: 'Current filter: ' })}{t({ bn: FILTER_LABELS[filter].bn, en: FILTER_LABELS[filter].en })}</p>
          <div style={{ marginTop: 12 }}>
            <label style={labelStyle} htmlFor="filter-format">{t({ bn: 'আউটপুট ফরম্যাট', en: 'Output format' })}</label>
            <select id="filter-format" style={inputStyle} value={format} onChange={(e) => setFormat(e.target.value as 'image/jpeg' | 'image/png' | 'image/webp')}>
              <option value="image/jpeg">JPG</option>
              <option value="image/png">PNG</option>
              <option value="image/webp">WebP</option>
            </select>
          </div>
        </>
      ) : null}
      <div style={{ marginTop: 14 }}>
        <Button onClick={() => void handleApply()} loading={busy} disabled={!file}>
          {t({ bn: 'ফিল্টার প্রয়োগ করুন', en: 'Apply filter' })}
        </Button>
      </div>
      <PrivacyNote />
      {error ? (
        <p style={errorStyle} role="alert">
          {error === 'not-image' ? t({ bn: 'একটি ছবির ফাইল বাছুন (JPG, PNG, WebP বা এ জাতীয়)।', en: 'Choose an image file (JPG, PNG, WebP or similar).' })
            : error === 'too-big' ? t({ bn: 'ফাইলটি ১০ MB-এর বেশি — ছোট ফাইল বাছুন।', en: 'The file is over 10 MB — choose a smaller file.' })
            : error === 'unreadable' ? t({ bn: 'ছবিটি পড়া যায়নি — ফাইলটি নষ্ট বা অসমর্থিত হতে পারে।', en: 'The image could not be read — it may be corrupt or unsupported.' })
            : t({ bn: 'ফিল্টার প্রয়োগ করা যায়নি — আবার চেষ্টা করুন।', en: 'Could not apply the filter — please try again.' })}
        </p>
      ) : null}
      {resultUrl && result ? (
        <div style={resultStyle} role="status">
          <p style={headlineLabelStyle}>{t({ bn: 'ফিল্টার দেওয়া ছবি', en: 'Filtered image' })}</p>
          <p style={headlineStyle}>{t({ bn: FILTER_LABELS[filter].bn, en: FILTER_LABELS[filter].en })} · {result.width}×{result.height}</p>
          <div style={tileGridStyle}>
            <Tile label={t({ bn: 'ফিল্টার', en: 'Filter' })} value={t({ bn: FILTER_LABELS[filter].bn, en: FILTER_LABELS[filter].en })} />
            <Tile label={t({ bn: 'ফরম্যাট', en: 'Format' })} value={ext.toUpperCase()} />
            <Tile label={t({ bn: 'ফাইলের আকার', en: 'File size' })} value={`${(result.bytes / 1024).toFixed(1)} KB`} />
          </div>
          <a ref={downloadRef} href={resultUrl} download={`filtered.${ext}`} style={{ display: 'none' }} aria-hidden="true" tabIndex={-1} />
          {/* Ads rollout B3 (27 Nov 2026): this image download goes through RewardedAdButton (15s) — Free Download is live, the 15s Unlock stays disabled until AdSense approval (never a fake timer). */}
          <RewardedAdButton lang={lang} durationSeconds={15} onFreeDownload={() => downloadRef.current?.click()} />
        </div>
      ) : null}
    </section>
  );
}
