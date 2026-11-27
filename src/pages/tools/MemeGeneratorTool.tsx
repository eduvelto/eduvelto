// Eduvelto — Meme Generator tool UI (Batch 3, 27 Nov 2026).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Text layout in src/lib/tools/faviconMeme.ts; canvas drawing here.
// The meme is made from the USER's own image — no template images
// are bundled. File stays on device.

import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { Button } from '../../components/ui';
import { memeFontSize, memeMaxChars, wrapMemeText } from '../../lib/tools/faviconMeme';
import {
  cardStyle, downloadStyle, errorStyle, gridStyle, headlineLabelStyle, headlineStyle,
  heroDescStyle, heroStyle, heroTitleStyle, inputStyle, isOverLimit, labelStyle,
  noteStyle, previewStyle, PrivacyNote, resultStyle, Tile, tileGridStyle, trustChipStyle,
} from './toolShared';

function drawMeme(canvas: HTMLCanvasElement, img: HTMLImageElement, top: string, bottom: string): void {
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.drawImage(img, 0, 0);
  const fontSize = memeFontSize(canvas.width);
  const maxChars = memeMaxChars(canvas.width);
  ctx.font = `bold ${fontSize}px Impact, Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = Math.max(2, fontSize / 10);
  const lineHeight = fontSize * 1.2;
  const topLines = wrapMemeText(top.trim(), maxChars);
  topLines.forEach((line, i) => {
    const y = fontSize + i * lineHeight + 8;
    ctx.strokeText(line.toUpperCase(), canvas.width / 2, y);
    ctx.fillText(line.toUpperCase(), canvas.width / 2, y);
  });
  const bottomLines = wrapMemeText(bottom.trim(), maxChars);
  bottomLines.forEach((line, i) => {
    const y = canvas.height - 8 - (bottomLines.length - 1 - i) * lineHeight;
    ctx.strokeText(line.toUpperCase(), canvas.width / 2, y);
    ctx.fillText(line.toUpperCase(), canvas.width / 2, y);
  });
}

export function MemeGeneratorTool() {
  const { t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [imgEl, setImgEl] = useState<HTMLImageElement | null>(null);
  const [topText, setTopText] = useState('');
  const [bottomText, setBottomText] = useState('');
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

  // Live preview: redraw on every text change.
  useEffect(() => {
    if (!imgEl || !canvasRef.current) return;
    drawMeme(canvasRef.current, imgEl, topText, bottomText);
  }, [imgEl, topText, bottomText]);

  async function handleDownload(): Promise<void> {
    if (!imgEl || (!topText.trim() && !bottomText.trim())) return;
    setBusy(true); setError(null); setResultUrl(null);
    try {
      const canvas = document.createElement('canvas');
      drawMeme(canvas, imgEl, topText, bottomText);
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('export-failed'))), 'image/png');
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
    <section className="ev-card" style={cardStyle} aria-labelledby="meme-generator-title">
      <div style={heroStyle}>
        <h2 id="meme-generator-title" style={heroTitleStyle}>{t({ bn: 'মিম জেনারেটর', en: 'Meme Generator' })}</h2>
        <p style={heroDescStyle}>{t({ bn: 'ছবিতে ওপরে ও নিচে লেখা বসিয়ে নিজের মিম বানিয়ে ডাউনলোড করুন।', en: 'Add top and bottom text to an image to make your own meme and download it.' })}</p>
        <span style={trustChipStyle}>{t({ bn: '✓ আপনার ডিভাইসেই প্রক্রিয়া হয়', en: '✓ Processed on your device' })}</span>
        <span style={trustChipStyle}>{t({ bn: 'লাইভ প্রিভিউ', en: 'Live preview' })}</span>
      </div>
      <div>
        <label style={labelStyle} htmlFor="meme-file">{t({ bn: 'নিজের ছবি', en: 'Your own image' })}</label>
        <input id="meme-file" style={inputStyle} type="file" accept="image/*" onChange={(e) => handleFile(e.target.files?.[0] ?? null)} />
      </div>
      <div style={{ ...gridStyle, marginTop: 12 }}>
        <div>
          <label style={labelStyle} htmlFor="meme-top">{t({ bn: 'ওপরের লেখা', en: 'Top text' })}</label>
          <input id="meme-top" style={inputStyle} type="text" value={topText} maxLength={80} onChange={(e) => setTopText(e.target.value)} placeholder="WHEN THE EXAM IS TOMORROW" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="meme-bottom">{t({ bn: 'নিচের লেখা', en: 'Bottom text' })}</label>
          <input id="meme-bottom" style={inputStyle} type="text" value={bottomText} maxLength={80} onChange={(e) => setBottomText(e.target.value)} placeholder="AND YOU HAVEN'T STUDIED" />
        </div>
      </div>
      {imgEl ? (
        <>
          <canvas ref={canvasRef} style={previewStyle} aria-label={t({ bn: 'মিমের প্রিভিউ', en: 'Meme preview' })} />
          <p style={noteStyle}>{t({ bn: 'নিজের ছবি ব্যবহার করুন — অন্যের ছবি বা কপিরাইট করা ছবি দিয়ে মিম বানাবেন না।', en: 'Use your own image — do not make memes from someone else’s or copyrighted photos.' })}</p>
        </>
      ) : null}
      <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Button onClick={() => void handleDownload()} loading={busy} disabled={!file || (!topText.trim() && !bottomText.trim())}>
          {t({ bn: 'মিম ডাউনলোডের জন্য তৈরি করুন', en: 'Make meme for download' })}
        </Button>
        <Button onClick={() => { setTopText('WHEN THE EXAM IS TOMORROW'); setBottomText("AND YOU HAVEN'T STUDIED"); }}>
          {t({ bn: 'উদাহরণ লোড করুন', en: 'Load example' })}
        </Button>
      </div>
      <PrivacyNote />
      {error ? (
        <p style={errorStyle} role="alert">
          {error === 'not-image' ? t({ bn: 'একটি ছবির ফাইল বাছুন (JPG, PNG, WebP বা এ জাতীয়)।', en: 'Choose an image file (JPG, PNG, WebP or similar).' })
            : error === 'too-big' ? t({ bn: 'ফাইলটি ১০ MB-এর বেশি — ছোট ফাইল বাছুন।', en: 'The file is over 10 MB — choose a smaller file.' })
            : error === 'unreadable' ? t({ bn: 'ছবিটি পড়া যায়নি — ফাইলটি নষ্ট বা অসমর্থিত হতে পারে।', en: 'The image could not be read — it may be corrupt or unsupported.' })
            : t({ bn: 'মিম বানানো যায়নি — আবার চেষ্টা করুন।', en: 'Could not make the meme — please try again.' })}
        </p>
      ) : null}
      {resultUrl && imgEl ? (
        <div style={resultStyle} role="status">
          <p style={headlineLabelStyle}>{t({ bn: 'মিম তৈরি', en: 'Meme ready' })}</p>
          <p style={headlineStyle}>{imgEl.naturalWidth}×{imgEl.naturalHeight}</p>
          <div style={tileGridStyle}>
            <Tile label={t({ bn: 'ওপরের লেখা', en: 'Top text' })} value={topText.trim() || '—'} />
            <Tile label={t({ bn: 'নিচের লেখা', en: 'Bottom text' })} value={bottomText.trim() || '—'} />
            <Tile label={t({ bn: 'ফাইলের আকার', en: 'File size' })} value={`${(resultBytes / 1024).toFixed(1)} KB`} />
          </div>
          <a href={resultUrl} download="meme.png" style={downloadStyle}>{t({ bn: 'মিম ডাউনলোড করুন (PNG)', en: 'Download the meme (PNG)' })}</a>
        </div>
      ) : null}
    </section>
  );
}
