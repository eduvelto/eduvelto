// Eduvelto — Image Cropper tool UI (Batch 3, 27 Nov 2026).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Logic in src/lib/tools/imageConvert.ts (canvas). File stays on device.
// Crop is chosen with sliders (fractions of the image) + ratio presets;
// the preview canvas redraws live as the sliders move.

import { useEffect, useRef, useState, type ReactElement } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { Button } from '../../components/ui';
import { computeCropRect, convertImage, realImageDeps } from '../../lib/tools/imageConvert';
import {
  cardStyle, downloadStyle, errorStyle, gridStyle, headlineLabelStyle, headlineStyle,
  heroDescStyle, heroStyle, heroTitleStyle, inputStyle, isOverLimit, labelStyle,
  noteStyle, previewStyle, PrivacyNote, resultStyle, Tile, tileGridStyle, trustChipStyle,
} from './toolShared';

interface Crop { x: number; y: number; w: number; h: number; }

const PRESETS: { id: string; bn: string; en: string; crop: Crop }[] = [
  { id: 'square', bn: 'বর্গ (১:১)', en: 'Square (1:1)', crop: { x: 0.1, y: 0.1, w: 0.8, h: 0.8 } },
  { id: 'wide', bn: 'চওড়া (১৬:৯)', en: 'Wide (16:9)', crop: { x: 0, y: 0.2, w: 1, h: 0.6 } },
  { id: 'tall', bn: 'লম্বা (৯:১৬)', en: 'Tall (9:16)', crop: { x: 0.2, y: 0, w: 0.6, h: 1 } },
  { id: 'photo', bn: 'ছবি (৪:৩)', en: 'Photo (4:3)', crop: { x: 0.05, y: 0.1, w: 0.9, h: 0.8 } },
  { id: 'center', bn: 'মাঝের অংশ', en: 'Centre', crop: { x: 0.25, y: 0.25, w: 0.5, h: 0.5 } },
];

export function ImageCropperTool() {
  const { t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [imgEl, setImgEl] = useState<HTMLImageElement | null>(null);
  const [crop, setCrop] = useState<Crop>({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 });
  const [format, setFormat] = useState<'image/jpeg' | 'image/png'>('image/jpeg');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
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

  // Live preview: draw the cropped region on the canvas.
  useEffect(() => {
    if (!imgEl || !canvasRef.current) return;
    try {
      const rect = computeCropRect(imgEl.naturalWidth, imgEl.naturalHeight, crop);
      const canvas = canvasRef.current;
      const scale = Math.min(1, 480 / rect.w);
      canvas.width = Math.max(1, Math.round(rect.w * scale));
      canvas.height = Math.max(1, Math.round(rect.h * scale));
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.drawImage(imgEl, rect.x, rect.y, rect.w, rect.h, 0, 0, canvas.width, canvas.height);
    } catch {
      // Invalid crop while sliders move — the convert step validates.
    }
  }, [imgEl, crop]);

  async function handleCrop(): Promise<void> {
    if (!file) return;
    setBusy(true); setError(null); setResultUrl(null);
    try {
      const out = await convertImage(file, { format, quality: 0.92, crop }, realImageDeps());
      setResult({ width: out.width, height: out.height, bytes: out.blob.size });
      setResultUrl(URL.createObjectURL(out.blob));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'failed');
    } finally {
      setBusy(false);
    }
  }

  function slider(id: string, labelBn: string, labelEn: string, value: number, onChange: (v: number) => void): ReactElement {
    return (
      <div>
        <label style={labelStyle} htmlFor={id}>{t({ bn: labelBn, en: labelEn })}: {Math.round(value * 100)}%</label>
        <input id={id} style={inputStyle} type="range" min="0" max="1" step="0.01" value={value} onChange={(e) => onChange(Number(e.target.value))} />
      </div>
    );
  }

  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="image-cropper-title">
      <div style={heroStyle}>
        <h2 id="image-cropper-title" style={heroTitleStyle}>{t({ bn: 'ছবি ক্রপার', en: 'Image Cropper' })}</h2>
        <p style={heroDescStyle}>{t({ bn: 'ছবির অপ্রয়োজনীয় অংশ কেটে নির্দিষ্ট অংশটুকু রাখুন।', en: 'Cut away unwanted parts of an image and keep only the part you need.' })}</p>
        <span style={trustChipStyle}>{t({ bn: '✓ আপনার ডিভাইসেই প্রক্রিয়া হয়', en: '✓ Processed on your device' })}</span>
        <span style={trustChipStyle}>{t({ bn: 'লাইভ প্রিভিউ', en: 'Live preview' })}</span>
      </div>
      <div>
        <label style={labelStyle} htmlFor="crop-file">{t({ bn: 'ছবির ফাইল', en: 'Image file' })}</label>
        <input id="crop-file" style={inputStyle} type="file" accept="image/*" onChange={(e) => handleFile(e.target.files?.[0] ?? null)} />
      </div>
      {imgEl ? (
        <>
          <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {PRESETS.map((p) => (
              <button key={p.id} type="button" onClick={() => setCrop(p.crop)} style={{ minHeight: 36, padding: '6px 12px', borderRadius: 999, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--heading)', fontWeight: 600, cursor: 'pointer' }}>
                {t({ bn: p.bn, en: p.en })}
              </button>
            ))}
          </div>
          <div style={gridStyle}>
            {slider('crop-x', 'বাম থেকে', 'From left', crop.x, (v) => setCrop((c) => ({ ...c, x: Math.min(v, 1 - c.w) })))}
            {slider('crop-y', 'ওপর থেকে', 'From top', crop.y, (v) => setCrop((c) => ({ ...c, y: Math.min(v, 1 - c.h) })))}
            {slider('crop-w', 'প্রস্থ', 'Width', crop.w, (v) => setCrop((c) => ({ ...c, w: Math.max(0.05, Math.min(v, 1 - c.x)) })))}
            {slider('crop-h', 'উচ্চতা', 'Height', crop.h, (v) => setCrop((c) => ({ ...c, h: Math.max(0.05, Math.min(v, 1 - c.y)) })))}
          </div>
          <canvas ref={canvasRef} style={previewStyle} aria-label={t({ bn: 'ক্রপের প্রিভিউ', en: 'Crop preview' })} />
          <p style={noteStyle}>
            {t({ bn: 'মূল ছবি: ', en: 'Original: ' })}{imgEl.naturalWidth}×{imgEl.naturalHeight}
            {' · '}
            {t({ bn: 'ক্রপের পর: ', en: 'After crop: ' })}
            {(() => { try { const r = computeCropRect(imgEl.naturalWidth, imgEl.naturalHeight, crop); return `${r.w}×${r.h}`; } catch { return '—'; } })()}
          </p>
          <div style={{ marginTop: 12 }}>
            <label style={labelStyle} htmlFor="crop-format">{t({ bn: 'আউটপুট ফরম্যাট', en: 'Output format' })}</label>
            <select id="crop-format" style={inputStyle} value={format} onChange={(e) => setFormat(e.target.value as 'image/jpeg' | 'image/png')}>
              <option value="image/jpeg">JPG</option>
              <option value="image/png">PNG</option>
            </select>
          </div>
        </>
      ) : null}
      <div style={{ marginTop: 14 }}>
        <Button onClick={() => void handleCrop()} loading={busy} disabled={!file}>
          {t({ bn: 'ক্রপ করুন', en: 'Crop image' })}
        </Button>
      </div>
      <PrivacyNote />
      {error ? (
        <p style={errorStyle} role="alert">
          {error === 'not-image' ? t({ bn: 'একটি ছবির ফাইল বাছুন (JPG, PNG, WebP বা এ জাতীয়)।', en: 'Choose an image file (JPG, PNG, WebP or similar).' })
            : error === 'too-big' ? t({ bn: 'ফাইলটি ১০ MB-এর বেশি — ছোট ফাইল বাছুন।', en: 'The file is over 10 MB — choose a smaller file.' })
            : error === 'unreadable' ? t({ bn: 'ছবিটি পড়া যায়নি — ফাইলটি নষ্ট বা অসমর্থিত হতে পারে।', en: 'The image could not be read — it may be corrupt or unsupported.' })
            : t({ bn: 'ক্রপ করা যায়নি — আবার চেষ্টা করুন।', en: 'Could not crop — please try again.' })}
        </p>
      ) : null}
      {resultUrl && result ? (
        <div style={resultStyle} role="status">
          <p style={headlineLabelStyle}>{t({ bn: 'ক্রপ করা ছবি', en: 'Cropped image' })}</p>
          <p style={headlineStyle}>{result.width}×{result.height}</p>
          <div style={tileGridStyle}>
            <Tile label={t({ bn: 'মূল আকার', en: 'Original' })} value={imgEl ? `${imgEl.naturalWidth}×${imgEl.naturalHeight}` : '—'} />
            <Tile label={t({ bn: 'নতুন আকার', en: 'New size' })} value={`${result.width}×${result.height}`} />
            <Tile label={t({ bn: 'ফাইলের আকার', en: 'File size' })} value={`${(result.bytes / 1024).toFixed(1)} KB`} />
          </div>
          <a href={resultUrl} download={format === 'image/png' ? 'cropped.png' : 'cropped.jpg'} style={downloadStyle}>{t({ bn: 'ক্রপ করা ছবি ডাউনলোড করুন', en: 'Download the cropped image' })}</a>
        </div>
      ) : null}
    </section>
  );
}
