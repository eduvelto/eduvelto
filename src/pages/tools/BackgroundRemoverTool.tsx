// Eduvelto — Background Remover (SIMPLE + AI) tool UI (100-Tools Project, Phase 2).
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Two modes: SIMPLE (canvas solid-colour removal, free) and AI (ONNX
// model, landed 27 Nov 2026 — A-tools spec-07). The AI model file is
// NOT shipped yet (owner to confirm the model; /models/bg-remover-v1.onnx
// is a placeholder) — on load failure the UI says so honestly and
// offers the simple remover on the same page. onnxruntime-web is loaded
// ONLY by dynamic import() inside bgRemoverOnnx.ts, never statically.
//
// Pure colour logic lives in src/lib/tools/backgroundRemover.ts;
// the AI loader lives in src/lib/tools/bgRemoverOnnx.ts.
// File limit is 10 MB, with a clear error above it.

import { useRef, useState, type CSSProperties, type MouseEvent } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import RewardedAdButton from '../../components/RewardedAdButton';
import {
  BACKGROUND_REMOVER_MAX_BYTES,
  flattenOnBackground,
  parseHexColor,
  removeBackgroundPixels,
  toleranceSliderToDistance,
  validateBackgroundImageFile,
} from '../../lib/tools/backgroundRemover';
import { BG_ONNX_CONFIG, loadBgModel, removeBackgroundAI } from '../../lib/tools/bgRemoverOnnx';

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
  const { t, lang } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  // Ads rollout B3 (27 Nov 2026): hidden anchors for the two PNG
  // downloads below — each goes through its own 15s rewarded gate.
  const localDownloadRef = useRef<HTMLAnchorElement | null>(null);
  const [resultBytes, setResultBytes] = useState<number | null>(null);
  const [view, setView] = useState<'before' | 'after' | 'both'>('both');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [tolerance, setTolerance] = useState(20);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // New background (owner order, 27 Nov 2026): an optional solid colour
  // to put behind the subject. '' = keep transparent. The cleaned
  // pixels are kept so the background-changed version can be
  // downloaded as a real file (PNG with the colour as pixels, JPG
  // flattened onto the colour).
  const [newBgColor, setNewBgColor] = useState('');
  const [bgDownloadBusy, setBgDownloadBusy] = useState(false);
  const [bgDownloadError, setBgDownloadError] = useState<string | null>(null);
  const resultDataRef = useRef<{
    data: Uint8ClampedArray;
    width: number;
    height: number;
  } | null>(null);
  // AI mode (A-tools spec-07, landed 27 Nov 2026).
  const [mode, setMode] = useState<'simple' | 'ai'>('simple');
  const [aiStatus, setAiStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [aiLoadedBytes, setAiLoadedBytes] = useState(0);
  const [aiTotalBytes, setAiTotalBytes] = useState<number | null>(null);
  const [aiFeather, setAiFeather] = useState(2);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiResultUrl, setAiResultUrl] = useState<string | null>(null);
  const aiDownloadRef = useRef<HTMLAnchorElement | null>(null);
  const [aiResultBytes, setAiResultBytes] = useState<number | null>(null);
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
    setBgDownloadError(null);
    resultDataRef.current = null;
    setAiResultUrl(null);
    setAiResultBytes(null);
    setAiError(null);
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

  /** AI mode: load the model once (with progress), then run it on the image. */
  async function handleAiRemove(): Promise<void> {
    const img = imageRef.current;
    if (!img || aiBusy) return;
    setAiBusy(true);
    setAiError(null);
    setAiResultUrl(null);
    setAiResultBytes(null);
    try {
      if (aiStatus !== 'ready') {
        setAiStatus('loading');
        await loadBgModel((p) => {
          setAiLoadedBytes(p.loadedBytes);
          setAiTotalBytes(p.totalBytes);
        });
        setAiStatus('ready');
      }
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('No 2d canvas context');
      ctx.drawImage(img, 0, 0);
      const out = await removeBackgroundAI(canvas, { featherPx: aiFeather });
      const blob = await new Promise<Blob>((resolve, reject) => {
        out.toBlob(
          (result) => (result ? resolve(result) : reject(new Error('Canvas export failed'))),
          'image/png',
        );
      });
      setAiResultUrl(URL.createObjectURL(blob));
      setAiResultBytes(blob.size);
    } catch (e) {
      setAiStatus('error');
      setAiError(e instanceof Error ? e.message : 'AI model could not be loaded');
    } finally {
      setAiBusy(false);
    }
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
      // Keep the cleaned pixels so the background-changed version can
      // be downloaded later without re-running the removal.
      resultDataRef.current = { data: cleaned, width: canvas.width, height: canvas.height };
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

  /**
   * Download the result composited onto the chosen solid background.
   * PNG keeps the solid background as real pixels; JPG is flattened
   * onto the same colour (JPEG has no transparency). The file is built
   * in the browser from the cleaned pixels — nothing is uploaded.
   */
  async function downloadWithBackground(format: 'png' | 'jpg'): Promise<void> {
    const kept = resultDataRef.current;
    if (!kept || !newBgColor || bgDownloadBusy) return;
    setBgDownloadBusy(true);
    setBgDownloadError(null);
    try {
      const flat = flattenOnBackground(kept.data, kept.width, kept.height, parseHexColor(newBgColor));
      const canvas = document.createElement('canvas');
      canvas.width = kept.width;
      canvas.height = kept.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('No 2d canvas context');
      const image = ctx.createImageData(kept.width, kept.height);
      image.data.set(flat);
      ctx.putImageData(image, 0, 0);
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (result) => (result ? resolve(result) : reject(new Error('Canvas export failed'))),
          format === 'jpg' ? 'image/jpeg' : 'image/png',
          format === 'jpg' ? 0.92 : undefined,
        );
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `background-changed.${format === 'jpg' ? 'jpg' : 'png'}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setBgDownloadError('failed');
    } finally {
      setBgDownloadBusy(false);
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
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 4 }} role="tablist" aria-label={t({ bn: 'ব্যাকগ্রাউন্ড সরানোর ধরন', en: 'Removal mode' })}>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'simple'}
          style={mode === 'simple' ? presetChipActiveStyle : presetChipStyle}
          onClick={() => setMode('simple')}
        >
          {t({ bn: 'সাধারণ (একরঙা)', en: 'Simple (solid colour)' })}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'ai'}
          style={mode === 'ai' ? presetChipActiveStyle : presetChipStyle}
          onClick={() => setMode('ai')}
        >
          {t({ bn: 'AI (যেকোনো ব্যাকগ্রাউন্ড) — বিটা', en: 'AI (any background) — beta' })}
        </button>
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
      {mode === 'simple' ? (
      <>
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
        <div>
          <label style={labelStyle} htmlFor="bg-new-color">
            {t({ bn: 'নতুন ব্যাকগ্রাউন্ডের রং (ঐচ্ছিক)', en: 'New background colour (optional)' })}
          </label>
          <input
            id="bg-new-color"
            style={{ ...inputStyle, padding: 4, height: 44 }}
            type="color"
            value={newBgColor || '#ffffff'}
            onChange={(e) => setNewBgColor(e.target.value)}
          />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }} role="group" aria-label={t({ bn: 'নতুন ব্যাকগ্রাউন্ড বাছুন', en: 'Choose a new background' })}>
            <button
              type="button"
              style={newBgColor === '' ? presetChipActiveStyle : presetChipStyle}
              aria-pressed={newBgColor === ''}
              onClick={() => setNewBgColor('')}
            >
              {t({ bn: 'স্বচ্ছ রাখুন', en: 'Keep transparent' })}
            </button>
            {(['#ffffff', '#000000', '#2563eb', '#16a34a'] as const).map((c) => (
              <button
                key={c}
                type="button"
                style={newBgColor === c ? presetChipActiveStyle : presetChipStyle}
                aria-pressed={newBgColor === c}
                onClick={() => setNewBgColor(c)}
              >
                {c === '#ffffff'
                  ? t({ bn: 'সাদা', en: 'White' })
                  : c === '#000000'
                    ? t({ bn: 'কালো', en: 'Black' })
                    : c === '#2563eb'
                      ? t({ bn: 'নীল', en: 'Blue' })
                      : t({ bn: 'সবুজ', en: 'Green' })}
              </button>
            ))}
          </div>
          <p style={noteStyle}>
            {t({
              bn: 'রং বাছলে ব্যাকগ্রাউন্ড সরানোর পর সেই রংসহ ছবিটি দেখতে ও ডাউনলোড করতে পারবেন (PNG ও JPG)।',
              en: 'Pick a colour to preview and download the image with that background after removal (PNG and JPG).',
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
                {newBgColor ? (
                  <>
                    <p style={{ margin: '12px 0 6px', fontSize: 14, fontWeight: 600, color: 'var(--heading)' }}>
                      {t({ bn: 'ফলাফল (নতুন ব্যাকগ্রাউন্ডসহ)', en: 'Result (with new background)' })}
                    </p>
                    <div style={{ backgroundColor: newBgColor, borderRadius: 8, padding: 4 }}>
                      <img
                        src={resultUrl}
                        alt={t({ bn: 'নতুন ব্যাকগ্রাউন্ডসহ ছবি', en: 'Image with new background' })}
                        style={{ maxWidth: '100%', borderRadius: 4, display: 'block' }}
                      />
                    </div>
                  </>
                ) : null}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <a ref={localDownloadRef} href={resultUrl} download="background-removed.png" style={{ display: 'none' }} aria-hidden="true" tabIndex={-1} />
                  {/* Ads rollout B3 (27 Nov 2026): this PNG download goes through RewardedAdButton (15s) — Free Download is live, the 15s Unlock stays disabled until AdSense approval (never a fake timer). */}
                  <RewardedAdButton lang={lang} durationSeconds={15} onFreeDownload={() => localDownloadRef.current?.click()} />
                  {newBgColor ? (
                    <>
                      <button
                        type="button"
                        style={{ ...downloadStyle, border: 'none', cursor: bgDownloadBusy ? 'wait' : 'pointer', fontSize: 14 }}
                        onClick={() => void downloadWithBackground('png')}
                        disabled={bgDownloadBusy}
                      >
                        {bgDownloadBusy
                          ? t({ bn: 'তৈরি হচ্ছে…', en: 'Preparing…' })
                          : t({ bn: 'PNG ডাউনলোড করুন (নতুন ব্যাকগ্রাউন্ডসহ)', en: 'Download PNG (with new background)' })}
                      </button>
                      <button
                        type="button"
                        style={{ ...downloadStyle, border: 'none', cursor: bgDownloadBusy ? 'wait' : 'pointer', fontSize: 14 }}
                        onClick={() => void downloadWithBackground('jpg')}
                        disabled={bgDownloadBusy}
                      >
                        {bgDownloadBusy
                          ? t({ bn: 'তৈরি হচ্ছে…', en: 'Preparing…' })
                          : t({ bn: 'JPG ডাউনলোড করুন (নতুন ব্যাকগ্রাউন্ডসহ)', en: 'Download JPG (with new background)' })}
                      </button>
                    </>
                  ) : null}
                </div>
                {bgDownloadError ? (
                  <p style={errorStyle} role="alert">
                    {t({ bn: 'নতুন ব্যাকগ্রাউন্ডসহ ছবিটি ডাউনলোড করা যায়নি — আবার চেষ্টা করুন।', en: 'Could not download the image with the new background — please try again.' })}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
          <p style={noteStyle}>
            {t({
              bn: 'এটি সাধারণ সংস্করণ: শুধু একরঙা ব্যাকগ্রাউন্ড সরায়। জটিল ব্যাকগ্রাউন্ডের জন্য উপরের AI ট্যাবটি ব্যবহার করুন।',
              en: 'This is the simple version: it removes only a solid-colour background. For complex backgrounds, use the AI tab above.',
            })}
          </p>
        </div>
      ) : null}
      </>
      ) : null}
      {mode === 'ai' ? (
        <div style={{ marginTop: 14 }}>
          <p style={noteStyle}>
            {t({
              bn: `AI সংস্করণ যেকোনো ব্যাকগ্রাউন্ড সরায় — মানুষ, পণ্য বা পোষা প্রাণীর ছবিতে ভালো কাজ করে। মডেল: ${BG_ONNX_CONFIG.modelName}। প্রথমবার মডেলটি ডাউনলোড হয় (~২৫ MB), তারপর একই পাতায় আবার ডাউনলোড লাগে না।`,
              en: `The AI version removes any background — best on photos of people, products or pets. Model: ${BG_ONNX_CONFIG.modelName}. The model downloads once (~25 MB) on first use, then not again on the same page.`,
            })}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginTop: 12 }}>
            <div>
              <label style={labelStyle} htmlFor="bg-ai-feather">
                {t({ bn: 'কিনারা নরম করুন (feather): ', en: 'Edge feather: ' })}
                {aiFeather}px
              </label>
              <input
                id="bg-ai-feather"
                style={{ ...inputStyle, padding: '10px 0' }}
                type="range"
                min="0"
                max="10"
                value={aiFeather}
                onChange={(e) => setAiFeather(Number(e.target.value))}
              />
              <p style={noteStyle}>
                {t({
                  bn: 'বেশি মান হলে কিনারা নরম হয় (চুলের ক্ষেত্রে ভালো); কম মান হলে কিনারা ধারালো থাকে।',
                  en: 'Higher values soften the edge (good for hair); lower values keep it sharp.',
                })}
              </p>
            </div>
          </div>
          {aiStatus === 'loading' ? (
            <div style={{ marginTop: 12 }} role="status">
              <p style={{ margin: '0 0 6px', fontSize: 14 }}>
                {t({
                  bn: `AI মডেল ডাউনলোড হচ্ছে… ${formatBytes(aiLoadedBytes)}${aiTotalBytes ? ` / ${formatBytes(aiTotalBytes)}` : ''}`,
                  en: `Downloading AI model… ${formatBytes(aiLoadedBytes)}${aiTotalBytes ? ` / ${formatBytes(aiTotalBytes)}` : ''}`,
                })}
              </p>
              <div style={{ height: 10, borderRadius: 999, background: 'var(--line)', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: aiTotalBytes ? `${Math.min(100, Math.round((aiLoadedBytes / aiTotalBytes) * 100))}%` : '8%',
                    background: 'var(--teal)',
                    transition: 'width 0.2s',
                  }}
                />
              </div>
            </div>
          ) : null}
          <div style={{ marginTop: 14 }}>
            <button
              className="ev-btn ev-btn-primary"
              type="button"
              style={{ minHeight: 44 }}
              onClick={() => void handleAiRemove()}
              disabled={!file || aiBusy}
            >
              {aiBusy
                ? t({ bn: 'AI কাজ করছে…', en: 'AI is working…' })
                : aiStatus === 'ready'
                  ? t({ bn: 'AI দিয়ে ব্যাকগ্রাউন্ড সরান', en: 'Remove background with AI' })
                  : t({ bn: 'AI মডেল ডাউনলোড করে ব্যাকগ্রাউন্ড সরান', en: 'Download AI model & remove background' })}
            </button>
          </div>
          {aiError ? (
            <p style={errorStyle} role="alert">
              {t({
                bn: `AI মডেল লোড করা যায়নি: ${aiError} — মডেলটি এখনো প্রকাশিত হয়নি, বা নেটওয়ার্কে সমস্যা হয়েছে। সাধারণ ট্যাবে একরঙা ব্যাকগ্রাউন্ড সরানো যাবে।`,
                en: `The AI model could not be loaded: ${aiError} — the model is not published yet, or there is a network problem. The simple tab can still remove a solid-colour background.`,
              })}
            </p>
          ) : null}
          {aiResultUrl && file && aiResultBytes !== null ? (
            <div style={resultStyle} role="status">
              <p style={headlineStyle}>{t({ bn: 'AI ব্যাকগ্রাউন্ড সরিয়েছে', en: 'AI removed the background' })}</p>
              <div style={statGridStyle}>
                <div style={statTileStyle}>
                  <p style={statLabelStyle}>{t({ bn: 'আসল ছবি', en: 'Original' })}</p>
                  <p style={statValueStyle}>{formatBytes(file.size)}</p>
                </div>
                <div style={statTileStyle}>
                  <p style={statLabelStyle}>{t({ bn: 'ফলাফল (PNG)', en: 'Result (PNG)' })}</p>
                  <p style={statValueStyle}>{formatBytes(aiResultBytes)}</p>
                </div>
              </div>
              <div style={{ ...checkerStyle, borderRadius: 8, padding: 4, marginTop: 12 }}>
                <img
                  src={aiResultUrl}
                  alt={t({ bn: 'AI দিয়ে ব্যাকগ্রাউন্ড ছাড়া ছবি', en: 'Image without background (AI)' })}
                  style={{ maxWidth: '100%', borderRadius: 4, display: 'block' }}
                />
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                <a ref={aiDownloadRef} href={aiResultUrl} download="background-removed-ai.png" style={{ display: 'none' }} aria-hidden="true" tabIndex={-1} />
                {/* Ads rollout B3 (27 Nov 2026): this AI-result PNG download goes through its own RewardedAdButton (15s) — a different file from the local result above, so its own gate is one per download action, not a stack. */}
                <RewardedAdButton lang={lang} durationSeconds={15} onFreeDownload={() => aiDownloadRef.current?.click()} />
                <button
                  type="button"
                  style={{ ...downloadStyle, background: 'var(--muted)', cursor: 'not-allowed', border: 'none' }}
                  disabled
                  title={t({ bn: 'HD আউটপুট ৩০ সেকেন্ডের Rewarded Ad দেখার পর চালু হবে — AdSense অনুমোদনের পর।', en: 'HD output unlocks after a 30-second Rewarded Ad — after AdSense approval.' })}
                >
                  {t({ bn: 'HD ডাউনলোড (শীঘ্রই)', en: 'HD download (coming soon)' })}
                </button>
              </div>
              <p style={noteStyle}>
                {t({
                  bn: 'স্ট্যান্ডার্ড PNG ফ্রি। HD আউটপুট ৩০ সেকেন্ডের Rewarded Ad দেখার পর চালু হবে — AdSense অনুমোদনের পর।',
                  en: 'Standard PNG is free. HD output unlocks after a 30-second Rewarded Ad — after AdSense approval.',
                })}
              </p>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
