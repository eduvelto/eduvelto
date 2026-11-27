// Eduvelto — Image Rotate & Flip tool UI (Batch 3, 27 Nov 2026).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Logic in src/lib/tools/imageConvert.ts (canvas). File stays on device.
// Live preview redraws on every rotate/flip change.

import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { Button } from '../../components/ui';
import RewardedAdButton from '../../components/RewardedAdButton';
import { computeRotatedDimensions, convertImage, realImageDeps } from '../../lib/tools/imageConvert';
import {
  cardStyle, errorStyle, headlineLabelStyle, headlineStyle,
  heroDescStyle, heroStyle, heroTitleStyle, inputStyle, isOverLimit, labelStyle,
  noteStyle, previewStyle, PrivacyNote, resultStyle, Tile, tileGridStyle, trustChipStyle,
} from './toolShared';

export function ImageRotateFlipTool() {
  const { t, lang } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [imgEl, setImgEl] = useState<HTMLImageElement | null>(null);
  const [rotate, setRotate] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [format, setFormat] = useState<'image/jpeg' | 'image/png' | 'image/webp'>('image/jpeg');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const downloadRef = useRef<HTMLAnchorElement | null>(null);
  const [result, setResult] = useState<{ width: number; height: number; bytes: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  function handleFile(next: File | null): void {
    setResultUrl(null); setResult(null); setError(null); setImgEl(null);
    setRotate(0); setFlipH(false); setFlipV(false);
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

  // Live preview with the same transform the download uses.
  useEffect(() => {
    if (!imgEl || !canvasRef.current) return;
    const { width, height } = computeRotatedDimensions(imgEl.naturalWidth, imgEl.naturalHeight, rotate);
    const canvas = canvasRef.current;
    const scale = Math.min(1, 480 / Math.max(width, height));
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotate * Math.PI) / 180);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    ctx.drawImage(imgEl, -imgEl.naturalWidth * scale / 2, -imgEl.naturalHeight * scale / 2, imgEl.naturalWidth * scale, imgEl.naturalHeight * scale);
    ctx.restore();
  }, [imgEl, rotate, flipH, flipV]);

  async function handleApply(): Promise<void> {
    if (!file) return;
    setBusy(true); setError(null); setResultUrl(null);
    try {
      const out = await convertImage(file, { format, quality: 0.92, rotateDeg: rotate, flipH, flipV }, realImageDeps());
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
    <section className="ev-card" style={cardStyle} aria-labelledby="image-rotate-flip-title">
      <div style={heroStyle}>
        <h2 id="image-rotate-flip-title" style={heroTitleStyle}>{t({ bn: 'ছবি ঘোরানো ও উল্টানো', en: 'Image Rotate & Flip' })}</h2>
        <p style={heroDescStyle}>{t({ bn: 'ছবি ঘোরান বা আয়নার মতো উল্টে সোজা করুন।', en: 'Rotate an image or flip it like a mirror to fix its orientation.' })}</p>
        <span style={trustChipStyle}>{t({ bn: '✓ আপনার ডিভাইসেই প্রক্রিয়া হয়', en: '✓ Processed on your device' })}</span>
        <span style={trustChipStyle}>{t({ bn: 'লাইভ প্রিভিউ', en: 'Live preview' })}</span>
      </div>
      <div>
        <label style={labelStyle} htmlFor="rotate-file">{t({ bn: 'ছবির ফাইল', en: 'Image file' })}</label>
        <input id="rotate-file" style={inputStyle} type="file" accept="image/*" onChange={(e) => handleFile(e.target.files?.[0] ?? null)} />
      </div>
      {imgEl ? (
        <>
          <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" onClick={() => setRotate((r) => (r + 90) % 360)} style={{ minHeight: 44, padding: '8px 16px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--heading)', fontWeight: 600, cursor: 'pointer' }}>{t({ bn: '↻ ৯০° ডানে ঘোরান', en: '↻ Rotate 90° right' })}</button>
            <button type="button" onClick={() => setRotate((r) => (r + 270) % 360)} style={{ minHeight: 44, padding: '8px 16px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--heading)', fontWeight: 600, cursor: 'pointer' }}>{t({ bn: '↺ ৯০° বামে ঘোরান', en: '↺ Rotate 90° left' })}</button>
            <button type="button" onClick={() => setFlipH((v) => !v)} aria-pressed={flipH} style={{ minHeight: 44, padding: '8px 16px', borderRadius: 8, border: flipH ? '2px solid var(--teal, #0b7285)' : '1px solid var(--line)', background: 'var(--surface)', color: 'var(--heading)', fontWeight: 600, cursor: 'pointer' }}>{t({ bn: '↔ আড়াআড়ি উল্টান', en: '↔ Flip horizontal' })}</button>
            <button type="button" onClick={() => setFlipV((v) => !v)} aria-pressed={flipV} style={{ minHeight: 44, padding: '8px 16px', borderRadius: 8, border: flipV ? '2px solid var(--teal, #0b7285)' : '1px solid var(--line)', background: 'var(--surface)', color: 'var(--heading)', fontWeight: 600, cursor: 'pointer' }}>{t({ bn: '↕ লম্বালম্বি উল্টান', en: '↕ Flip vertical' })}</button>
          </div>
          <canvas ref={canvasRef} style={previewStyle} aria-label={t({ bn: 'ঘোরানো ছবির প্রিভিউ', en: 'Preview of the rotated image' })} />
          <p style={noteStyle} role="status">
            {t({ bn: 'ঘোরানো: ', en: 'Rotation: ' })}{rotate}°
            {' · '}
            {t({ bn: 'আড়াআড়ি: ', en: 'Flipped horizontal: ' })}{flipH ? t({ bn: 'হ্যাঁ', en: 'Yes' }) : t({ bn: 'না', en: 'No' })}
            {' · '}
            {t({ bn: 'লম্বালম্বি: ', en: 'Flipped vertical: ' })}{flipV ? t({ bn: 'হ্যাঁ', en: 'Yes' }) : t({ bn: 'না', en: 'No' })}
          </p>
          <div style={{ marginTop: 12 }}>
            <label style={labelStyle} htmlFor="rotate-format">{t({ bn: 'আউটপুট ফরম্যাট', en: 'Output format' })}</label>
            <select id="rotate-format" style={inputStyle} value={format} onChange={(e) => setFormat(e.target.value as 'image/jpeg' | 'image/png' | 'image/webp')}>
              <option value="image/jpeg">JPG</option>
              <option value="image/png">PNG</option>
              <option value="image/webp">WebP</option>
            </select>
          </div>
        </>
      ) : null}
      <div style={{ marginTop: 14 }}>
        <Button onClick={() => void handleApply()} loading={busy} disabled={!file}>
          {t({ bn: 'প্রয়োগ করে ডাউনলোডের জন্য তৈরি করুন', en: 'Apply & prepare download' })}
        </Button>
      </div>
      <PrivacyNote />
      {error ? (
        <p style={errorStyle} role="alert">
          {error === 'not-image' ? t({ bn: 'একটি ছবির ফাইল বাছুন (JPG, PNG, WebP বা এ জাতীয়)।', en: 'Choose an image file (JPG, PNG, WebP or similar).' })
            : error === 'too-big' ? t({ bn: 'ফাইলটি ১০ MB-এর বেশি — ছোট ফাইল বাছুন।', en: 'The file is over 10 MB — choose a smaller file.' })
            : error === 'unreadable' ? t({ bn: 'ছবিটি পড়া যায়নি — ফাইলটি নষ্ট বা অসমর্থিত হতে পারে।', en: 'The image could not be read — it may be corrupt or unsupported.' })
            : t({ bn: 'ঘোরানো যায়নি — আবার চেষ্টা করুন।', en: 'Could not rotate — please try again.' })}
        </p>
      ) : null}
      {resultUrl && result ? (
        <div style={resultStyle} role="status">
          <p style={headlineLabelStyle}>{t({ bn: 'নতুন ছবি', en: 'New image' })}</p>
          <p style={headlineStyle}>{result.width}×{result.height}</p>
          <div style={tileGridStyle}>
            <Tile label={t({ bn: 'ঘোরানো', en: 'Rotation' })} value={`${rotate}°`} />
            <Tile label={t({ bn: 'ফরম্যাট', en: 'Format' })} value={ext.toUpperCase()} />
            <Tile label={t({ bn: 'ফাইলের আকার', en: 'File size' })} value={`${(result.bytes / 1024).toFixed(1)} KB`} />
          </div>
          <a ref={downloadRef} href={resultUrl} download={`rotated.${ext}`} style={{ display: 'none' }} aria-hidden="true" tabIndex={-1} />
          {/* Ads rollout B3 (27 Nov 2026): this image download goes through RewardedAdButton (15s) — Free Download is live, the 15s Unlock stays disabled until AdSense approval (never a fake timer). */}
          <RewardedAdButton lang={lang} durationSeconds={15} onFreeDownload={() => downloadRef.current?.click()} />
        </div>
      ) : null}
    </section>
  );
}
