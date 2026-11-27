// Eduvelto — Background Remover (SIMPLE version) tool UI (100-Tools Project, Phase 2).
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Canvas solid-colour removal, 100% in the browser, FREE: a pixel goes
// transparent when its colour is within the chosen tolerance of the
// picked background colour. The AI version (ONNX model ~40 MB) is a
// LATER batch — no model is loaded here and no model dependency exists.
//
// Pure colour logic lives in src/lib/tools/backgroundRemover.ts.
// File limit is 10 MB, with a clear error above it.

import { useRef, useState, type CSSProperties, type MouseEvent } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  BACKGROUND_REMOVER_MAX_BYTES,
  parseHexColor,
  removeBackgroundPixels,
  toleranceSliderToDistance,
  validateBackgroundImageFile,
} from '../../lib/tools/backgroundRemover';

const inputStyle: CSSProperties = {
  width: '100%',
  minHeight: 44,
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid var(--line)',
  fontSize: 15,
  boxSizing: 'border-box',
  background: 'var(--surface)',
  color: 'var(--heading)',
};

const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--heading)',
  marginBottom: 6,
};

const cardStyle: CSSProperties = {
  marginTop: 16,
  padding: '18px 16px',
};

const resultStyle: CSSProperties = {
  marginTop: 14,
  padding: '14px 16px',
  borderRadius: 10,
  background: 'var(--teal-soft)',
};

const noteStyle: CSSProperties = {
  margin: '10px 0 0',
  fontSize: 13,
  color: 'var(--muted)',
};

const errorStyle: CSSProperties = {
  marginTop: 14,
  color: '#b3261e',
  fontSize: 14,
};

const downloadStyle: CSSProperties = {
  display: 'inline-block',
  marginTop: 10,
  minHeight: 44,
  lineHeight: '44px',
  padding: '0 18px',
  borderRadius: 8,
  background: 'var(--teal, #0b7285)',
  color: '#fff',
  fontWeight: 600,
  textDecoration: 'none',
};

/** Hero band: forest → teal-deep gradient, white title + trust chip. */
const heroStyle: CSSProperties = {
  margin: '-18px -16px 16px',
  padding: '20px 16px 18px',
  borderRadius: '12px 12px 0 0',
  background: 'linear-gradient(135deg, var(--forest), var(--teal-deep))',
  color: '#fff',
};

const trustChipStyle: CSSProperties = {
  display: 'inline-block',
  marginTop: 10,
  padding: '5px 12px',
  borderRadius: 999,
  border: '1px solid rgba(255, 255, 255, 0.5)',
  background: 'rgba(255, 255, 255, 0.14)',
  color: '#fff',
  fontSize: 13,
  fontWeight: 600,
};

/** Preset chips: inactive = white bg + teal border + teal text; active = teal bg + white text. */
const presetChipStyle: CSSProperties = {
  minHeight: 40,
  padding: '8px 14px',
  borderRadius: 999,
  border: '1px solid var(--teal)',
  background: 'var(--card)',
  color: 'var(--teal-text)',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
};

const presetChipActiveStyle: CSSProperties = {
  ...presetChipStyle,
  background: 'var(--teal)',
  borderColor: 'var(--teal)',
  color: '#fff',
};

const headlineStyle: CSSProperties = {
  fontFamily: 'var(--font-head)',
  fontSize: '1.9rem',
  fontWeight: 700,
  color: 'var(--teal-text)',
  margin: '0 0 4px',
  lineHeight: 1.25,
};

const statGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
  gap: 8,
  marginTop: 12,
};

const statTileStyle: CSSProperties = {
  background: 'var(--card)',
  border: '1px solid var(--line)',
  borderRadius: 10,
  padding: '10px 12px',
};

const statLabelStyle: CSSProperties = {
  margin: 0,
  fontSize: 12,
  color: 'var(--muted)',
};

const statValueStyle: CSSProperties = {
  margin: '2px 0 0',
  fontSize: 16,
  fontWeight: 700,
  color: 'var(--heading)',
};

/** Checkerboard behind the transparent result, so see-through pixels read clearly. */
const checkerStyle: CSSProperties = {
  backgroundImage:
    'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
  backgroundSize: '20px 20px',
  backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0',
  backgroundColor: '#fff',
};

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

export function BackgroundRemoverTool() {
  const { t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultBytes, setResultBytes] = useState<number | null>(null);
  const [view, setView] = useState<'before' | 'after' | 'both'>('both');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [tolerance, setTolerance] = useState(20);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  function loadImageElement(blob: Blob): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Could not decode this image'));
      };
      img.src = url;
    });
  }

  async function handleFileChange(next: File | null): Promise<void> {
    setResultUrl(null);
    setResultBytes(null);
    setOriginalUrl(null);
    setFile(null);
    imageRef.current = null;
    setError(null);
    if (!next) return;
    const problem = validateBackgroundImageFile(next);
    if (problem) {
      setError(problem);
      return;
    }
    try {
      const img = await loadImageElement(next);
      imageRef.current = img;
      setFile(next);
      setOriginalUrl(URL.createObjectURL(next));
    } catch {
      setError('unreadable');
    }
  }

  /** Click-to-sample: tap the original image to pick its background colour. */
  function handleSampleClick(e: MouseEvent<HTMLImageElement>): void {
    const img = imageRef.current;
    if (!img) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * img.naturalWidth);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * img.naturalHeight);
    if (x < 0 || y < 0 || x >= img.naturalWidth || y >= img.naturalHeight) return;
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(img, 0, 0);
    const px = ctx.getImageData(x, y, 1, 1).data;
    const toHex = (v: number): string => v.toString(16).padStart(2, '0');
    setBgColor(`#${toHex(px[0])}${toHex(px[1])}${toHex(px[2])}`);
  }

  async function handleRemove(): Promise<void> {
    const img = imageRef.current;
    if (!img || busy) return;
    setBusy(true);
    setError(null);
    setResultUrl(null);
    setResultBytes(null);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('No 2d canvas context');
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const cleaned = removeBackgroundPixels(
        imageData.data,
        canvas.width,
        canvas.height,
        parseHexColor(bgColor),
        toleranceSliderToDistance(tolerance),
      );
      const outImage = ctx.createImageData(canvas.width, canvas.height);
      outImage.data.set(cleaned);
      ctx.putImageData(outImage, 0, 0);
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (result) =>
            result ? resolve(result) : reject(new Error('Canvas export failed')),
          'image/png',
        );
      });
      setResultUrl(URL.createObjectURL(blob));
      setResultBytes(blob.size);
      setView('both');
    } catch {
      setError('failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="bg-remover-title">
      <div style={heroStyle}>
        <h2 id="bg-remover-title" style={{ fontSize: 22, color: '#fff', margin: '0 0 4px', fontFamily: 'var(--font-head)' }}>
          {t({ bn: 'ব্যাকগ্রাউন্ড সরান', en: 'Background Remover' })}
        </h2>
        <p style={{ color: 'rgba(255, 255, 255, 0.92)', fontSize: 14, margin: 0 }}>
          {t({
            bn: 'একরঙা ব্যাকগ্রাউন্ডের ছবি থেকে ব্যাকগ্রাউন্ড সরান — সম্পূর্ণ ফ্রি, ছবি আপনার ডিভাইসেই থাকে, কোথাও আপলোড হয় না। সাদা বা সবুজ ব্যাকগ্রাউন্ডের ছবিতে সবচেয়ে ভালো কাজ করে।',
            en: 'Remove a solid-colour background from an image — completely free, the image stays on your device and is never uploaded. Works best on photos with a white or green background.',
          })}
        </p>
        <span style={trustChipStyle}>
          {t({ bn: '১০০% ব্রাউজারে • কোনো আপলোড নয়', en: '100% in-browser • nothing uploaded' })}
        </span>
      </div>
      <div>
        <label style={labelStyle} htmlFor="bg-file">
          {t({ bn: 'ছবির ফাইল (সর্বোচ্চ ১০ MB)', en: 'Image file (max 10 MB)' })}
        </label>
        <input
          id="bg-file"
          style={inputStyle}
          type="file"
          accept="image/*"
          onChange={(e) => void handleFileChange(e.target.files?.[0] ?? null)}
        />
      </div>
      {file ? (
        <p style={noteStyle} role="status">
          {file.name} — {formatBytes(file.size)}
        </p>
      ) : null}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 12,
          marginTop: 12,
        }}
      >
        <div>
          <label style={labelStyle} htmlFor="bg-color">
            {t({ bn: 'ব্যাকগ্রাউন্ডের রং', en: 'Background colour' })}
          </label>
          <input
            id="bg-color"
            style={{ ...inputStyle, padding: 4, height: 44 }}
            type="color"
            value={bgColor}
            onChange={(e) => setBgColor(e.target.value)}
          />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }} role="group" aria-label={t({ bn: 'এক ক্লিকে বাছুন', en: 'One-click presets' })}>
            <button
              type="button"
              style={bgColor === '#ffffff' ? presetChipActiveStyle : presetChipStyle}
              aria-pressed={bgColor === '#ffffff'}
              onClick={() => setBgColor('#ffffff')}
            >
              {t({ bn: 'সাদা ব্যাকগ্রাউন্ড', en: 'White background' })}
            </button>
            <button
              type="button"
              style={bgColor === '#00ff00' ? presetChipActiveStyle : presetChipStyle}
              aria-pressed={bgColor === '#00ff00'}
              onClick={() => setBgColor('#00ff00')}
            >
              {t({ bn: 'সবুজ স্ক্রিন', en: 'Green screen' })}
            </button>
          </div>
          <p style={noteStyle}>
            {t({
              bn: 'অথবা নিচের আসল ছবিতে ব্যাকগ্রাউন্ডের ওপর ট্যাপ করুন — সেই রংটি বেছে নেওয়া হবে।',
              en: 'Or tap the background in the original image below to pick that colour.',
            })}
          </p>
        </div>
        <div>
          <label style={labelStyle} htmlFor="bg-tolerance">
            {t({ bn: 'সহনশীলতা (tolerance): ', en: 'Tolerance: ' })}
            {tolerance}
          </label>
          <input
            id="bg-tolerance"
            style={{ ...inputStyle, padding: '10px 0' }}
            type="range"
            min="0"
            max="100"
            value={tolerance}
            onChange={(e) => setTolerance(Number(e.target.value))}
          />
          <p style={noteStyle}>
            {t({
              bn: 'বেশি মান হলে কাছাকাছি রংগুলোও সরবে; কম মান হলে শুধু হুবহু একই রং সরবে।',
              en: 'Higher values also remove near-matching colours; lower values remove only the exact colour.',
            })}
          </p>
        </div>
      </div>
      <div style={{ marginTop: 14 }}>
        <button
          className="ev-btn ev-btn-primary"
          type="button"
          style={{ minHeight: 44 }}
          onClick={() => void handleRemove()}
          disabled={!file || busy}
        >
          {busy
            ? t({ bn: 'সরানো হচ্ছে…', en: 'Removing…' })
            : t({ bn: 'ব্যাকগ্রাউন্ড সরান', en: 'Remove background' })}
        </button>
      </div>
      {error ? (
        <p style={errorStyle} role="alert">
          {error === 'not-image'
            ? t({ bn: 'শুধু ছবির ফাইল চলবে — একটি JPG, PNG বা WebP ছবি বাছুন।', en: 'Only image files work — choose a JPG, PNG or WebP image.' })
            : error === 'too-large'
              ? t({
                  bn: `ফাইলটি ১০ MB-এর বেশি — ${formatBytes(BACKGROUND_REMOVER_MAX_BYTES)} বা তার কম আকারের ছবি বাছুন।`,
                  en: `The file is over 10 MB — choose an image of ${formatBytes(BACKGROUND_REMOVER_MAX_BYTES)} or less.`,
                })
              : error === 'unreadable'
                ? t({ bn: 'এই ছবিটি পড়া যায়নি — ফাইলটি নষ্ট বা অসমর্থিত হতে পারে।', en: 'This image could not be read — it may be corrupt or unsupported.' })
                : t({ bn: 'ব্যাকগ্রাউন্ড সরানো যায়নি — আবার চেষ্টা করুন।', en: 'Could not remove the background — please try again.' })}
        </p>
      ) : null}
      {originalUrl || resultUrl ? (
        <div style={resultStyle} role="status">
          {resultUrl ? (
            <p style={headlineStyle}>
              {t({ bn: 'ব্যাকগ্রাউন্ড সরানো হয়েছে', en: 'Background removed' })}
            </p>
          ) : null}
          {file && resultUrl && resultBytes !== null ? (
            <div style={statGridStyle}>
              <div style={statTileStyle}>
                <p style={statLabelStyle}>{t({ bn: 'আসল ছবি', en: 'Original' })}</p>
                <p style={statValueStyle}>{formatBytes(file.size)}</p>
              </div>
              <div style={statTileStyle}>
                <p style={statLabelStyle}>{t({ bn: 'ফলাফল (PNG)', en: 'Result (PNG)' })}</p>
                <p style={statValueStyle}>{formatBytes(resultBytes)}</p>
              </div>
            </div>
          ) : null}
          {originalUrl && resultUrl ? (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }} role="group" aria-label={t({ bn: 'আগে / পরে দেখুন', en: 'Before / after view' })}>
              {(
                [
                  ['before', t({ bn: 'আগে', en: 'Before' })],
                  ['after', t({ bn: 'পরে', en: 'After' })],
                  ['both', t({ bn: 'পাশাপাশি', en: 'Side by side' })],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  style={view === value ? presetChipActiveStyle : presetChipStyle}
                  aria-pressed={view === value}
                  onClick={() => setView(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          ) : null}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 12,
              marginTop: 12,
            }}
          >
            {originalUrl && view !== 'after' ? (
              <div>
                <p style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 600, color: 'var(--heading)' }}>
                  {t({ bn: 'আসল ছবি (রং বাছতে ট্যাপ করুন)', en: 'Original (tap to pick a colour)' })}
                </p>
                <img
                  src={originalUrl}
                  alt={t({ bn: 'আসল ছবি', en: 'Original image' })}
                  style={{ maxWidth: '100%', borderRadius: 8, cursor: 'crosshair', display: 'block' }}
                  onClick={handleSampleClick}
                />
              </div>
            ) : null}
            {resultUrl && view !== 'before' ? (
              <div>
                <p style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 600, color: 'var(--heading)' }}>
                  {t({ bn: 'ফলাফল (স্বচ্ছ ব্যাকগ্রাউন্ড)', en: 'Result (transparent background)' })}
                </p>
                <div style={{ ...checkerStyle, borderRadius: 8, padding: 4 }}>
                  <img
                    src={resultUrl}
                    alt={t({ bn: 'ব্যাকগ্রাউন্ড ছাড়া ছবি', en: 'Image without background' })}
                    style={{ maxWidth: '100%', borderRadius: 4, display: 'block' }}
                  />
                </div>
                <a href={resultUrl} download="background-removed.png" style={downloadStyle}>
                  {t({ bn: 'PNG ডাউনলোড করুন', en: 'Download PNG' })}
                </a>
              </div>
            ) : null}
          </div>
          <p style={noteStyle}>
            {t({
              bn: 'এটি সাধারণ সংস্করণ: শুধু একরঙা ব্যাকগ্রাউন্ড সরায়। জটিল ব্যাকগ্রাউন্ডের জন্য AI সংস্করণ পরে আসবে।',
              en: 'This is the simple version: it removes only a solid-colour background. An AI version for complex backgrounds will come later.',
            })}
          </p>
        </div>
      ) : null}
    </section>
  );
}
