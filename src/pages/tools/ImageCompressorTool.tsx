// Eduvelto — Image Compressor tool UI (100-Tools Project, Phase 2, Wave 3).
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// The image never leaves the device: it is downscaled and re-encoded
// 100% in the browser via canvas. The UI reports the real before/after
// byte counts and never promises a ratio.
//
// REAL-DOM DEPS (important): the logic module's default loadImage
// resolves only { naturalWidth, naturalHeight } — a plain object a real
// canvas drawImage() cannot draw. So this component passes explicit
// deps whose loadImage resolves the REAL HTMLImageElement (which has
// naturalWidth/naturalHeight AND is a valid drawImage source), and a
// createCanvas backed by document.createElement('canvas').
// Real-browser canvas encoding itself was not verified in Node (no DOM
// there) — a live-browser encode check is still owed before ship.

import { useRef, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { Button } from '../../components/ui';
import RewardedAdButton from '../../components/RewardedAdButton';
import {
  assertImageFile,
  compressImage,
  type ImageDomDeps,
  type MinimalCanvas,
} from '../../lib/tools/imageCompressor';

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

const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: 12,
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

const previewStyle: CSSProperties = {
  display: 'block',
  maxWidth: '100%',
  maxHeight: 320,
  marginTop: 12,
  borderRadius: 8,
  border: '1px solid var(--line)',
};

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

/** HEIC/HEIF is not supported yet (no converter) — fail honestly, never pretend. */
function isHeicFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return (
    name.endsWith('.heic') ||
    name.endsWith('.heif') ||
    file.type === 'image/heic' ||
    file.type === 'image/heif'
  );
}

/** Real browser DOM deps: loadImage resolves the actual Image element. */
export function realImageDeps(): ImageDomDeps {
  return {
    loadImage: (file: Blob) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
          URL.revokeObjectURL(url);
          // The real element: valid drawImage source + natural size.
          resolve(img);
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          reject(
            new Error('Could not decode this image — it may be corrupt or in an unsupported format'),
          );
        };
        img.src = url;
      }),
    createCanvas: (width: number, height: number): MinimalCanvas => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      return canvas as unknown as MinimalCanvas;
    },
  };
}

export function ImageCompressorTool() {
  const { t, lang } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [quality, setQuality] = useState('0.8');
  const [maxDimension, setMaxDimension] = useState('1920');
  const [outputType, setOutputType] = useState<'image/jpeg' | 'image/webp' | 'image/png'>('image/jpeg');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const downloadRef = useRef<HTMLAnchorElement | null>(null);
  const [originalBytes, setOriginalBytes] = useState(0);
  const [newBytes, setNewBytes] = useState(0);
  const [savedPercent, setSavedPercent] = useState(0);
  const [resultDims, setResultDims] = useState<{ width: number; height: number } | null>(null);

  function handleFileChange(next: File | null): void {
    setResultUrl(null);
    setResultDims(null);
    setError(null);
    if (!next) {
      setFile(null);
      return;
    }
    if (isHeicFile(next)) {
      setFile(null);
      setError('heic');
      return;
    }
    try {
      assertImageFile(next);
    } catch {
      setFile(null);
      setError('not-image');
      return;
    }
    setFile(next);
  }

  async function handleCompress(): Promise<void> {
    if (!file) return;
    setBusy(true);
    setError(null);
    setResultUrl(null);
    setResultDims(null);
    try {
      const result = await compressImage(
        file,
        {
          quality: Number(quality),
          maxDimension: Number(maxDimension),
          outputType,
        },
        realImageDeps(),
      );
      setOriginalBytes(result.originalBytes);
      setNewBytes(result.newBytes);
      setSavedPercent(result.savedPercent);
      setResultDims({ width: result.width, height: result.height });
      setResultUrl(URL.createObjectURL(result.blob));
    } catch {
      setError('failed');
    } finally {
      setBusy(false);
    }
  }

  const qualityNum = Number(quality);

  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="image-compressor-title">
      <h2 id="image-compressor-title" style={{ fontSize: 19, color: 'var(--heading)', margin: '0 0 4px' }}>
        {t({ bn: 'ছবি ছোট করুন', en: 'Compress image' })}
      </h2>
      <p style={{ color: 'var(--muted)', fontSize: 14, margin: '0 0 14px' }}>
        {t({
          bn: 'ছবি ছোট করে JPG/WebP-তে রূপান্তর করুন। ছবি আপনার ডিভাইসেই থাকে, কোথাও আপলোড হয় না।',
          en: 'Shrink an image and convert it to JPG/WebP. The image stays on your device and is never uploaded.',
        })}
      </p>
      <div style={gridStyle}>
        <div>
          <label style={labelStyle} htmlFor="img-compress-file">
            {t({ bn: 'ছবির ফাইল', en: 'Image file' })}
          </label>
          <input
            id="img-compress-file"
            style={inputStyle}
            type="file"
            accept="image/*"
            onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="img-compress-quality">
            {t({ bn: 'মান (quality): ', en: 'Quality: ' })}
            {Number.isFinite(qualityNum) ? Math.round(qualityNum * 100) : '—'}%
          </label>
          <input
            id="img-compress-quality"
            style={{ ...inputStyle, padding: '10px 12px' }}
            type="range"
            min="0.1"
            max="1"
            step="0.05"
            value={quality}
            onChange={(e) => setQuality(e.target.value)}
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="img-compress-maxdim">
            {t({ bn: 'সবচেয়ে বড় দিক (পিক্সেল)', en: 'Longest side (pixels)' })}
          </label>
          <input
            id="img-compress-maxdim"
            style={inputStyle}
            type="number"
            min="1"
            max="8000"
            step="1"
            inputMode="numeric"
            value={maxDimension}
            onChange={(e) => setMaxDimension(e.target.value)}
            placeholder="1920"
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="img-compress-format">
            {t({ bn: 'আউটপুট ধরন', en: 'Output format' })}
          </label>
          <select
            id="img-compress-format"
            style={inputStyle}
            value={outputType}
            onChange={(e) => setOutputType(e.target.value as 'image/jpeg' | 'image/webp' | 'image/png')}
          >
            <option value="image/jpeg">JPEG</option>
            <option value="image/webp">WebP</option>
            <option value="image/png">PNG</option>
          </select>
        </div>
      </div>
      <div style={{ marginTop: 14 }}>
        <Button onClick={() => void handleCompress()} loading={busy} disabled={!file}>
          {t({ bn: 'ছোট করুন', en: 'Compress image' })}
        </Button>
      </div>
      {error ? (
        <p style={errorStyle} role="alert">
          {error === 'heic'
            ? t({
                bn: 'HEIC ছবি এখনো সমর্থিত নয় — JPG বা PNG ছবি বাছুন।',
                en: 'HEIC images are not supported yet — choose a JPG or PNG image.',
              })
            : error === 'not-image'
              ? t({ bn: 'একটি ছবির ফাইল বাছুন (JPG, PNG, WebP বা এ জাতীয়)।', en: 'Choose an image file (JPG, PNG, WebP or similar).' })
              : t({ bn: 'ছবিটি ছোট করা যায়নি — ফাইলটি নষ্ট বা অসমর্থিত ধরনের হতে পারে।', en: 'Could not compress this image — it may be corrupt or in an unsupported format.' })}
        </p>
      ) : null}
      {resultUrl && resultDims ? (
        <div style={resultStyle} role="status">
          <p style={{ margin: '0 0 6px', fontSize: 16 }}>
            <strong>
              {t({ bn: 'আগে: ', en: 'Before: ' })}
              {fmtBytes(originalBytes)}
              {' · '}
              {t({ bn: 'পরে: ', en: 'After: ' })}
              {fmtBytes(newBytes)}
            </strong>
          </p>
          <p style={{ margin: '0 0 6px', fontSize: 15 }}>
            {t({ bn: 'আকার: ', en: 'Size: ' })}
            {resultDims.width}×{resultDims.height}
            {t({ bn: ' পিক্সেল', en: ' px' })}
            {savedPercent > 0
              ? ` · ${t({ bn: 'সাশ্রয়: ', en: 'Saved: ' })}${savedPercent}%`
              : ` · ${t({ bn: 'আর ছোট হয়নি', en: 'No bytes saved' })}`}
          </p>
          <img src={resultUrl} alt={t({ bn: 'ছোট করা ছবির প্রিভিউ', en: 'Preview of the compressed image' })} style={previewStyle} />
          <a ref={downloadRef} href={resultUrl} download={outputType === 'image/png' ? 'compressed.png' : outputType === 'image/webp' ? 'compressed.webp' : 'compressed.jpg'} style={{ display: 'none' }} aria-hidden="true" tabIndex={-1} />
          {/* Ads rollout B3 (27 Nov 2026): this image download goes through RewardedAdButton (15s) — Free Download is live, the 15s Unlock stays disabled until AdSense approval (never a fake timer). */}
          <RewardedAdButton lang={lang} durationSeconds={15} onFreeDownload={() => downloadRef.current?.click()} />
          <p style={noteStyle}>
            {t({
              bn: 'কতটা ছোট হবে তা ছবির ওপর নির্ভর করে — কোনো নির্দিষ্ট হার দেওয়ার প্রতিশ্রুতি দেওয়া হয় না।',
              en: 'How much smaller it gets depends on the image — no fixed saving is promised.',
            })}
          </p>
        </div>
      ) : null}
    </section>
  );
}
