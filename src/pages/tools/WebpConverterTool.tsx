// Eduvelto — WebP Converter tool UI (Batch 3, 27 Nov 2026).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Logic in src/lib/tools/imageConvert.ts (canvas). File stays on device.
// Two directions: any image -> WebP, or WebP -> JPG/PNG.

import { useRef, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { Button } from '../../components/ui';
import RewardedAdButton from '../../components/RewardedAdButton';
import { convertImage, realImageDeps, type ImageMime } from '../../lib/tools/imageConvert';
import {
  cardStyle, errorStyle, fmtBytes, gridStyle, headlineLabelStyle, headlineStyle,
  heroDescStyle, heroStyle, heroTitleStyle, inputStyle, isOverLimit, labelStyle,
  noteStyle, previewStyle, PrivacyNote, resultStyle, Tile, tileGridStyle, trustChipStyle,
} from './toolShared';

type Direction = 'to-webp' | 'from-webp';

export function WebpConverterTool() {
  const { t, lang } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [direction, setDirection] = useState<Direction>('to-webp');
  const [target, setTarget] = useState<ImageMime>('image/jpeg');
  const [quality, setQuality] = useState('0.9');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const downloadRef = useRef<HTMLAnchorElement | null>(null);
  const [result, setResult] = useState<{ width: number; height: number; bytes: number; format: ImageMime } | null>(null);

  function handleFile(next: File | null): void {
    setResultUrl(null); setResult(null); setError(null); setPreview(null);
    if (!next) { setFile(null); return; }
    if (!next.type.startsWith('image/')) { setFile(null); setError('not-image'); return; }
    if (direction === 'from-webp' && next.type !== 'image/webp' && !/\.webp$/i.test(next.name)) {
      setFile(null); setError('not-webp'); return;
    }
    if (isOverLimit(next)) { setFile(null); setError('too-big'); return; }
    setFile(next);
    setPreview(URL.createObjectURL(next));
  }

  async function handleConvert(): Promise<void> {
    if (!file) return;
    setBusy(true); setError(null); setResultUrl(null);
    try {
      const format: ImageMime = direction === 'to-webp' ? 'image/webp' : target;
      const out = await convertImage(file, { format, quality: Number(quality) }, realImageDeps());
      setResult({ width: out.width, height: out.height, bytes: out.blob.size, format: out.format });
      setResultUrl(URL.createObjectURL(out.blob));
    } catch {
      setError('failed');
    } finally {
      setBusy(false);
    }
  }

  const ext = result?.format === 'image/webp' ? 'webp' : result?.format === 'image/png' ? 'png' : 'jpg';

  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="webp-converter-title">
      <div style={heroStyle}>
        <h2 id="webp-converter-title" style={heroTitleStyle}>{t({ bn: 'ওয়েবপি কনভার্টার', en: 'WebP Converter' })}</h2>
        <p style={heroDescStyle}>{t({ bn: 'ছবিকে আধুনিক WebP ফরম্যাটে বা WebP থেকে অন্য ফরম্যাটে বদলান।', en: 'Convert images to the modern WebP format, or from WebP to another format.' })}</p>
        <span style={trustChipStyle}>{t({ bn: '✓ আপনার ডিভাইসেই প্রক্রিয়া হয়', en: '✓ Processed on your device' })}</span>
        <span style={trustChipStyle}>{t({ bn: '১০ MB পর্যন্ত', en: 'Up to 10 MB' })}</span>
      </div>
      <div style={gridStyle}>
        <div>
          <label style={labelStyle} htmlFor="webp-direction">{t({ bn: 'দিক', en: 'Direction' })}</label>
          <select id="webp-direction" style={inputStyle} value={direction} onChange={(e) => { setDirection(e.target.value as Direction); setFile(null); setPreview(null); setResultUrl(null); setResult(null); setError(null); }}>
            <option value="to-webp">{t({ bn: 'ছবি → WebP', en: 'Image → WebP' })}</option>
            <option value="from-webp">{t({ bn: 'WebP → JPG / PNG', en: 'WebP → JPG / PNG' })}</option>
          </select>
        </div>
        {direction === 'from-webp' ? (
          <div>
            <label style={labelStyle} htmlFor="webp-target">{t({ bn: 'লক্ষ্য ফরম্যাট', en: 'Target format' })}</label>
            <select id="webp-target" style={inputStyle} value={target} onChange={(e) => setTarget(e.target.value as ImageMime)}>
              <option value="image/jpeg">JPG</option>
              <option value="image/png">PNG</option>
            </select>
          </div>
        ) : null}
        <div>
          <label style={labelStyle} htmlFor="webp-quality">{t({ bn: 'মান (quality): ', en: 'Quality: ' })}{Math.round(Number(quality) * 100)}%</label>
          <input id="webp-quality" style={inputStyle} type="range" min="0.1" max="1" step="0.05" value={quality} onChange={(e) => setQuality(e.target.value)} />
        </div>
      </div>
      <div style={{ marginTop: 12 }}>
        <label style={labelStyle} htmlFor="webp-file">{t({ bn: 'ছবির ফাইল', en: 'Image file' })}</label>
        <input id="webp-file" style={inputStyle} type="file" accept={direction === 'from-webp' ? 'image/webp,.webp' : 'image/*'} onChange={(e) => handleFile(e.target.files?.[0] ?? null)} />
      </div>
      {preview ? <img src={preview} alt={t({ bn: 'মূল ছবির প্রিভিউ', en: 'Preview of the original image' })} style={previewStyle} /> : null}
      <p style={noteStyle}>{t({ bn: 'WebP ছোট আকারে ভালো মান দেয় — ওয়েবসাইটে ব্যবহারের জন্য উপযোগী।', en: 'WebP gives good quality at a small size — handy for websites.' })}</p>
      <div style={{ marginTop: 14 }}>
        <Button onClick={() => void handleConvert()} loading={busy} disabled={!file}>
          {t({ bn: 'রূপান্তর করুন', en: 'Convert' })}
        </Button>
      </div>
      <PrivacyNote />
      {error ? (
        <p style={errorStyle} role="alert">
          {error === 'not-image' ? t({ bn: 'একটি ছবির ফাইল বাছুন।', en: 'Choose an image file.' })
            : error === 'not-webp' ? t({ bn: 'এই দিকে শুধু WebP ছবি চলবে — .webp ফাইল বাছুন।', en: 'This direction needs a WebP image — choose a .webp file.' })
            : error === 'too-big' ? t({ bn: 'ফাইলটি ১০ MB-এর বেশি — ছোট ফাইল বাছুন।', en: 'The file is over 10 MB — choose a smaller file.' })
            : t({ bn: 'রূপান্তর করা যায়নি — ফাইলটি নষ্ট বা অসমর্থিত হতে পারে।', en: 'Could not convert — the file may be corrupt or unsupported.' })}
        </p>
      ) : null}
      {resultUrl && result && file ? (
        <div style={resultStyle} role="status">
          <p style={headlineLabelStyle}>{t({ bn: 'নতুন ফাইল', en: 'New file' })}</p>
          <p style={headlineStyle}>{result.format === 'image/webp' ? 'WebP' : result.format === 'image/png' ? 'PNG' : 'JPG'} · {result.width}×{result.height}</p>
          <div style={tileGridStyle}>
            <Tile label={t({ bn: 'আগের আকার', en: 'Before' })} value={fmtBytes(file.size)} />
            <Tile label={t({ bn: 'পরের আকার', en: 'After' })} value={fmtBytes(result.bytes)} />
            <Tile label={t({ bn: 'মান', en: 'Quality' })} value={`${Math.round(Number(quality) * 100)}%`} />
          </div>
          <img src={resultUrl} alt={t({ bn: 'রূপান্তরিত ছবির প্রিভিউ', en: 'Preview of the converted image' })} style={previewStyle} />
          <a ref={downloadRef} href={resultUrl} download={`converted.${ext}`} style={{ display: 'none' }} aria-hidden="true" tabIndex={-1} />
          {/* Ads rollout B3 (27 Nov 2026): this image download goes through RewardedAdButton (15s) — Free Download is live, the 15s Unlock stays disabled until AdSense approval (never a fake timer). */}
          <RewardedAdButton lang={lang} durationSeconds={15} onFreeDownload={() => downloadRef.current?.click()} />
        </div>
      ) : null}
    </section>
  );
}
