// Eduvelto — Image Resizer tool UI (100-Tools Project, Phase 2, Wave 3).
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// The image never leaves the device: it is resized 100% in the browser
// via canvas. Presets: Teletalk photo 300×300, Teletalk signature
// 300×80, Passport 600×600. HEIC is NOT supported yet (no converter) —
// a .heic file gets an honest "not supported yet" message.
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
  computeResizeDimensions,
  IMAGE_RESIZE_PRESETS,
  resizeImage,
  type ImageResizePresetName,
} from '../../lib/tools/imageResizer';
import {
  assertImageFile,
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
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
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

const errorStyle: CSSProperties = {
  marginTop: 14,
  color: '#b3261e',
  fontSize: 14,
};

const presetButtonStyle: CSSProperties = {
  minHeight: 44,
  padding: '8px 14px',
  borderRadius: 8,
  border: '1px solid var(--line)',
  background: 'var(--surface)',
  color: 'var(--heading)',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
};

const previewStyle: CSSProperties = {
  display: 'block',
  maxWidth: '100%',
  maxHeight: 320,
  marginTop: 12,
  borderRadius: 8,
  border: '1px solid var(--line)',
};

const PRESETS: { name: ImageResizePresetName; bn: string; en: string }[] = [
  { name: 'teletalkPhoto', bn: 'টেলিটক ছবি (৩০০×৩০০)', en: 'Teletalk photo (300×300)' },
  { name: 'teletalkSignature', bn: 'টেলিটক স্বাক্ষর (৩০০×৮০)', en: 'Teletalk signature (300×80)' },
  { name: 'passport', bn: 'পাসপোর্ট ছবি (৬০০×৬০০)', en: 'Passport photo (600×600)' },
];

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
function realImageDeps(): ImageDomDeps {
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
            new Error('Could not decode this image — it may be corrupt, HEIC (not supported yet), or in an unsupported format'),
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

export function ImageResizerTool() {
  const { t, lang } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [width, setWidth] = useState('300');
  const [height, setHeight] = useState('300');
  const [lockAspect, setLockAspect] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const downloadRef = useRef<HTMLAnchorElement | null>(null);
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

  function applyPreset(name: ImageResizePresetName): void {
    const preset = IMAGE_RESIZE_PRESETS[name];
    setWidth(String(preset.width));
    setHeight(String(preset.height));
  }

  async function handleResize(): Promise<void> {
    if (!file) return;
    const targetWidth = Number(width);
    const targetHeight = Number(height);
    if (!Number.isFinite(targetWidth) || targetWidth <= 0 || !Number.isFinite(targetHeight) || targetHeight <= 0) {
      setError('bad-size');
      return;
    }
    setBusy(true);
    setError(null);
    setResultUrl(null);
    setResultDims(null);
    try {
      // Capture the source size while loading, so the shown result
      // dimensions are computed from the same numbers the resize used.
      let sourceWidth = 0;
      let sourceHeight = 0;
      const deps = realImageDeps();
      const capturingDeps: ImageDomDeps = {
        ...deps,
        loadImage: async (blob: Blob) => {
          const loaded = await deps.loadImage!(blob);
          sourceWidth = loaded.naturalWidth;
          sourceHeight = loaded.naturalHeight;
          return loaded;
        },
      };
      const blob = await resizeImage(
        file,
        { width: targetWidth, height: targetHeight, lockAspectRatio: lockAspect },
        capturingDeps,
      );
      setResultDims(
        computeResizeDimensions(sourceWidth, sourceHeight, {
          width: targetWidth,
          height: targetHeight,
          lockAspectRatio: lockAspect,
        }),
      );
      setResultUrl(URL.createObjectURL(blob));
    } catch {
      setError('failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="image-resizer-title">
      <h2 id="image-resizer-title" style={{ fontSize: 19, color: 'var(--heading)', margin: '0 0 4px' }}>
        {t({ bn: 'ছবির আকার বদলান', en: 'Resize image' })}
      </h2>
      <p style={{ color: 'var(--muted)', fontSize: 14, margin: '0 0 14px' }}>
        {t({
          bn: 'ছবির প্রস্থ ও উচ্চতা বদলান — চাকরির আবেদনের ছবি ও স্বাক্ষরের মাপ আগে থেকে দেওয়া আছে। ছবি আপনার ডিভাইসেই থাকে, কোথাও আপলোড হয় না।',
          en: 'Change an image’s width and height — job-application photo and signature sizes are preset. The image stays on your device and is never uploaded.',
        })}
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
        {PRESETS.map((preset) => (
          <button
            key={preset.name}
            type="button"
            style={presetButtonStyle}
            onClick={() => applyPreset(preset.name)}
          >
            {t({ bn: preset.bn, en: preset.en })}
          </button>
        ))}
      </div>
      <div style={gridStyle}>
        <div>
          <label style={labelStyle} htmlFor="img-resize-file">
            {t({ bn: 'ছবির ফাইল', en: 'Image file' })}
          </label>
          <input
            id="img-resize-file"
            style={inputStyle}
            type="file"
            accept="image/*"
            onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="img-resize-width">
            {t({ bn: 'প্রস্থ (পিক্সেল)', en: 'Width (pixels)' })}
          </label>
          <input
            id="img-resize-width"
            style={inputStyle}
            type="number"
            min="1"
            max="8000"
            step="1"
            inputMode="numeric"
            value={width}
            onChange={(e) => setWidth(e.target.value)}
            placeholder="300"
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="img-resize-height">
            {t({ bn: 'উচ্চতা (পিক্সেল)', en: 'Height (pixels)' })}
          </label>
          <input
            id="img-resize-height"
            style={inputStyle}
            type="number"
            min="1"
            max="8000"
            step="1"
            inputMode="numeric"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            placeholder="300"
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 4 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, minHeight: 44 }}>
            <input
              type="checkbox"
              checked={lockAspect}
              onChange={(e) => setLockAspect(e.target.checked)}
            />
            {t({ bn: 'অনুপাত ঠিক রাখুন', en: 'Keep aspect ratio' })}
          </label>
        </div>
      </div>
      <div style={{ marginTop: 14 }}>
        <Button onClick={() => void handleResize()} loading={busy} disabled={!file}>
          {t({ bn: 'আকার বদলান', en: 'Resize image' })}
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
              : error === 'bad-size'
                ? t({ bn: 'সঠিক প্রস্থ ও উচ্চতা দিন — দুটোই ০-এর বেশি হতে হবে।', en: 'Enter a valid width and height — both must be above 0.' })
                : t({ bn: 'ছবির আকার বদলানো যায়নি — ফাইলটি নষ্ট বা অসমর্থিত ধরনের হতে পারে।', en: 'Could not resize this image — it may be corrupt or in an unsupported format.' })}
        </p>
      ) : null}
      {resultUrl && resultDims ? (
        <div style={resultStyle} role="status">
          <p style={{ margin: '0 0 6px', fontSize: 16 }}>
            <strong>
              {t({ bn: 'ফলাফলের আকার: ', en: 'Result size: ' })}
              {resultDims.width}×{resultDims.height}
              {t({ bn: ' পিক্সেল', en: ' px' })}
            </strong>
          </p>
          {lockAspect ? (
            <p style={{ margin: '0 0 6px', fontSize: 14, color: 'var(--muted)' }}>
              {t({
                bn: 'অনুপাত ঠিক রাখা হয়েছে — ছবিটি দেওয়া বাক্সের ভেতরে ফিট করা হয়েছে, টেনে বড় করা হয়নি।',
                en: 'Aspect ratio kept — the image was fitted inside the box, not stretched.',
              })}
            </p>
          ) : null}
          <img src={resultUrl} alt={t({ bn: 'আকার বদলানো ছবির প্রিভিউ', en: 'Preview of the resized image' })} style={previewStyle} />
          <a ref={downloadRef} href={resultUrl} download="resized.jpg" style={{ display: 'none' }} aria-hidden="true" tabIndex={-1} />
          {/* Ads rollout B3 (27 Nov 2026): this image download goes through RewardedAdButton (15s) — Free Download is live, the 15s Unlock stays disabled until AdSense approval (never a fake timer). */}
          <RewardedAdButton lang={lang} durationSeconds={15} onFreeDownload={() => downloadRef.current?.click()} />
        </div>
      ) : null}
    </section>
  );
}
