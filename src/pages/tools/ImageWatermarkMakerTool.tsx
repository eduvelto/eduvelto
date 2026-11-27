// Eduvelto — Image Watermark Maker tool UI (Batch 3, 27 Nov 2026).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Canvas drawing in this file; pure geometry lives in imageConvert.
// File stays on device. Text watermark only (logo upload is a
// separate future step — the UI does not promise it).

import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { Button } from '../../components/ui';
import {
  cardStyle, downloadStyle, errorStyle, gridStyle, headlineLabelStyle, headlineStyle,
  heroDescStyle, heroStyle, heroTitleStyle, inputStyle, isOverLimit, labelStyle,
  noteStyle, previewStyle, PrivacyNote, resultStyle, Tile, tileGridStyle, trustChipStyle,
} from './toolShared';

type WmPosition = 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

const POSITIONS: { value: WmPosition; bn: string; en: string }[] = [
  { value: 'bottom-right', bn: 'নিচে ডানে', en: 'Bottom right' },
  { value: 'bottom-left', bn: 'নিচে বামে', en: 'Bottom left' },
  { value: 'top-left', bn: 'ওপরে বামে', en: 'Top left' },
  { value: 'top-right', bn: 'ওপরে ডানে', en: 'Top right' },
  { value: 'center', bn: 'মাঝখানে (তির্যক)', en: 'Centre (diagonal)' },
];

function drawWatermarked(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  text: string,
  opacity: number,
  position: WmPosition,
): void {
  const scale = Math.min(1, 640 / Math.max(img.naturalWidth, img.naturalHeight));
  canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const fontSize = Math.max(18, Math.round(canvas.width / 14));
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.globalAlpha = opacity;
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.lineWidth = Math.max(2, fontSize / 12);
  const w = ctx.measureText(text).width;
  const pad = 16;
  let x = canvas.width - w - pad;
  let y = canvas.height - pad;
  if (position === 'top-left') { x = pad; y = pad + fontSize; }
  if (position === 'top-right') { x = canvas.width - w - pad; y = pad + fontSize; }
  if (position === 'bottom-left') { x = pad; y = canvas.height - pad; }
  if (position === 'center') {
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(-Math.PI / 4);
    ctx.strokeText(text, -w / 2, 0);
    ctx.fillText(text, -w / 2, 0);
    ctx.restore();
    ctx.globalAlpha = 1;
    return;
  }
  ctx.strokeText(text, x, y);
  ctx.fillText(text, x, y);
  ctx.globalAlpha = 1;
}

export function ImageWatermarkMakerTool() {
  const { t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [imgEl, setImgEl] = useState<HTMLImageElement | null>(null);
  const [text, setText] = useState('');
  const [opacity, setOpacity] = useState('0.6');
  const [position, setPosition] = useState<WmPosition>('bottom-right');
  const [format, setFormat] = useState<'image/jpeg' | 'image/png'>('image/jpeg');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultBytes, setResultBytes] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  function handleFile(next: File | null): void {
    setResultUrl(null); setError(null); setImgEl(null);
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

  // Live preview.
  useEffect(() => {
    if (!imgEl || !canvasRef.current || !text.trim()) return;
    drawWatermarked(canvasRef.current, imgEl, text.trim(), Number(opacity), position);
  }, [imgEl, text, opacity, position]);

  // When there is no text yet, show the plain image.
  useEffect(() => {
    if (!imgEl || !canvasRef.current || text.trim()) return;
    const canvas = canvasRef.current;
    const scale = Math.min(1, 640 / Math.max(imgEl.naturalWidth, imgEl.naturalHeight));
    canvas.width = Math.max(1, Math.round(imgEl.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(imgEl.naturalHeight * scale));
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.drawImage(imgEl, 0, 0, canvas.width, canvas.height);
  }, [imgEl, text]);

  async function handleDownload(): Promise<void> {
    if (!imgEl || !text.trim()) return;
    setBusy(true); setError(null); setResultUrl(null);
    try {
      // Render at full resolution on a fresh canvas, then export.
      const canvas = document.createElement('canvas');
      canvas.width = imgEl.naturalWidth;
      canvas.height = imgEl.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('no-context');
      ctx.drawImage(imgEl, 0, 0);
      const fontSize = Math.max(24, Math.round(canvas.width / 14));
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.globalAlpha = Number(opacity);
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = 'rgba(0,0,0,0.6)';
      ctx.lineWidth = Math.max(2, fontSize / 12);
      const w = ctx.measureText(text.trim()).width;
      const pad = Math.round(canvas.width / 40);
      let x = canvas.width - w - pad;
      let y = canvas.height - pad;
      if (position === 'top-left') { x = pad; y = pad + fontSize; }
      if (position === 'top-right') { x = canvas.width - w - pad; y = pad + fontSize; }
      if (position === 'bottom-left') { x = pad; y = canvas.height - pad; }
      if (position === 'center') {
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(-Math.PI / 4);
        ctx.strokeText(text.trim(), -w / 2, 0);
        ctx.fillText(text.trim(), -w / 2, 0);
        ctx.restore();
      } else {
        ctx.strokeText(text.trim(), x, y);
        ctx.fillText(text.trim(), x, y);
      }
      ctx.globalAlpha = 1;
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('export-failed'))), format, 0.92);
      });
      setResultBytes(blob.size);
      setResultUrl(URL.createObjectURL(blob));
    } catch {
      setError('failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="image-watermark-title">
      <div style={heroStyle}>
        <h2 id="image-watermark-title" style={heroTitleStyle}>{t({ bn: 'ছবিতে ওয়াটারমার্ক', en: 'Image Watermark Maker' })}</h2>
        <p style={heroDescStyle}>{t({ bn: 'ছবিতে নিজের নাম বা লোগো ওয়াটারমার্ক হিসেবে বসান।', en: 'Add your name or logo as a watermark on an image.' })}</p>
        <span style={trustChipStyle}>{t({ bn: '✓ আপনার ডিভাইসেই প্রক্রিয়া হয়', en: '✓ Processed on your device' })}</span>
        <span style={trustChipStyle}>{t({ bn: 'লাইভ প্রিভিউ', en: 'Live preview' })}</span>
      </div>
      <div style={gridStyle}>
        <div>
          <label style={labelStyle} htmlFor="img-wm-file">{t({ bn: 'ছবির ফাইল', en: 'Image file' })}</label>
          <input id="img-wm-file" style={inputStyle} type="file" accept="image/*" onChange={(e) => handleFile(e.target.files?.[0] ?? null)} />
        </div>
        <div>
          <label style={labelStyle} htmlFor="img-wm-text">{t({ bn: 'ওয়াটারমার্কের লেখা', en: 'Watermark text' })}</label>
          <input id="img-wm-text" style={inputStyle} type="text" value={text} maxLength={40} onChange={(e) => setText(e.target.value)} placeholder="Eduvelto" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="img-wm-position">{t({ bn: 'অবস্থান', en: 'Position' })}</label>
          <select id="img-wm-position" style={inputStyle} value={position} onChange={(e) => setPosition(e.target.value as WmPosition)}>
            {POSITIONS.map((p) => (
              <option key={p.value} value={p.value}>{t({ bn: p.bn, en: p.en })}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle} htmlFor="img-wm-opacity">{t({ bn: 'অস্বচ্ছতা (opacity): ', en: 'Opacity: ' })}{Math.round(Number(opacity) * 100)}%</label>
          <input id="img-wm-opacity" style={inputStyle} type="range" min="0.1" max="1" step="0.05" value={opacity} onChange={(e) => setOpacity(e.target.value)} />
        </div>
      </div>
      {imgEl ? (
        <>
          <canvas ref={canvasRef} style={previewStyle} aria-label={t({ bn: 'ওয়াটারমার্কের প্রিভিউ', en: 'Watermark preview' })} />
          <p style={noteStyle}>{t({ bn: 'লেখা বাংলা হলেও ছবিতে ঠিকই দেখাবে — এটি ছবি হিসেবে আঁকা হয়, PDF ফন্ট নয়।', en: 'Bangla text draws fine here — it is painted as pixels, not a PDF font.' })}</p>
          <div style={{ marginTop: 12 }}>
            <label style={labelStyle} htmlFor="img-wm-format">{t({ bn: 'আউটপুট ফরম্যাট', en: 'Output format' })}</label>
            <select id="img-wm-format" style={inputStyle} value={format} onChange={(e) => setFormat(e.target.value as 'image/jpeg' | 'image/png')}>
              <option value="image/jpeg">JPG</option>
              <option value="image/png">PNG</option>
            </select>
          </div>
        </>
      ) : null}
      <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Button onClick={() => void handleDownload()} loading={busy} disabled={!file || !text.trim()}>
          {t({ bn: 'ওয়াটারমার্কসহ ছবি তৈরি করুন', en: 'Make watermarked image' })}
        </Button>
        <Button onClick={() => setText('Eduvelto')}>{t({ bn: 'উদাহরণ লোড করুন', en: 'Load example' })}</Button>
      </div>
      <PrivacyNote />
      {error ? (
        <p style={errorStyle} role="alert">
          {error === 'not-image' ? t({ bn: 'একটি ছবির ফাইল বাছুন (JPG, PNG, WebP বা এ জাতীয়)।', en: 'Choose an image file (JPG, PNG, WebP or similar).' })
            : error === 'too-big' ? t({ bn: 'ফাইলটি ১০ MB-এর বেশি — ছোট ফাইল বাছুন।', en: 'The file is over 10 MB — choose a smaller file.' })
            : error === 'unreadable' ? t({ bn: 'ছবিটি পড়া যায়নি — ফাইলটি নষ্ট বা অসমর্থিত হতে পারে।', en: 'The image could not be read — it may be corrupt or unsupported.' })
            : t({ bn: 'ওয়াটারমার্ক বসানো যায়নি — আবার চেষ্টা করুন।', en: 'Could not add the watermark — please try again.' })}
        </p>
      ) : null}
      {resultUrl && imgEl ? (
        <div style={resultStyle} role="status">
          <p style={headlineLabelStyle}>{t({ bn: 'ওয়াটারমার্ক', en: 'Watermark' })}</p>
          <p style={headlineStyle}>{text.trim()}</p>
          <div style={tileGridStyle}>
            <Tile label={t({ bn: 'ছবির আকার', en: 'Image size' })} value={`${imgEl.naturalWidth}×${imgEl.naturalHeight}`} />
            <Tile label={t({ bn: 'অস্বচ্ছতা', en: 'Opacity' })} value={`${Math.round(Number(opacity) * 100)}%`} />
            <Tile label={t({ bn: 'ফাইলের আকার', en: 'File size' })} value={`${(resultBytes / 1024).toFixed(1)} KB`} />
          </div>
          <a href={resultUrl} download={format === 'image/png' ? 'watermarked.png' : 'watermarked.jpg'} style={downloadStyle}>{t({ bn: 'ছবি ডাউনলোড করুন', en: 'Download the image' })}</a>
        </div>
      ) : null}
    </section>
  );
}
