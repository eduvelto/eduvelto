// Eduvelto — Image to PDF tool UI (Batch 3, 27 Nov 2026).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Logic in src/lib/tools/textPdf.ts (jsPDF, lazy). Files stay on device.
// JPG, PNG and WebP are accepted; WebP is converted through canvas
// first because jsPDF embeds JPEG/PNG only.

import { useRef, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { Button } from '../../components/ui';
import RewardedAdButton from '../../components/RewardedAdButton';
import { buildImagesPdf, type PdfImageInput } from '../../lib/tools/textPdf';
import { convertImage, fileToDataUrl, realImageDeps } from '../../lib/tools/imageConvert';
import {
  cardStyle, downloadStyle, errorStyle, headlineLabelStyle, headlineStyle,
  heroDescStyle, heroStyle, heroTitleStyle, inputStyle, isOverLimit, labelStyle,
  noteStyle, PrivacyNote, resultStyle, Tile, tileGridStyle, trustChipStyle,
} from './toolShared';

interface PickedImage extends PdfImageInput {
  name: string;
  bytes: number;
}

export function ImageToPdfTool() {
  const { t, lang } = useLanguage();
  const [images, setImages] = useState<PickedImage[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultBytes, setResultBytes] = useState(0);
  const downloadRef = useRef<HTMLAnchorElement | null>(null);

  async function handleFiles(list: FileList | null): Promise<void> {
    setError(null);
    if (!list || list.length === 0) return;
    const picked: PickedImage[] = [...images];
    for (const file of Array.from(list)) {
      if (!file.type.startsWith('image/')) { setError('not-image'); continue; }
      if (isOverLimit(file)) { setError('too-big'); continue; }
      try {
        // WebP (and any non-JPEG/PNG) is re-encoded to JPEG via canvas,
        // because jsPDF embeds JPEG/PNG only.
        let dataUrl: string;
        let dims: { width: number; height: number };
        if (file.type === 'image/jpeg' || file.type === 'image/png') {
          dataUrl = await fileToDataUrl(file);
          const img = new Image();
          dims = await new Promise((resolve, reject) => {
            img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
            img.onerror = () => reject(new Error('unreadable'));
            img.src = dataUrl;
          });
        } else {
          const converted = await convertImage(file, { format: 'image/jpeg', quality: 0.92 }, realImageDeps());
          dataUrl = await fileToDataUrl(converted.blob);
          dims = { width: converted.width, height: converted.height };
        }
        picked.push({ dataUrl, width: dims.width, height: dims.height, name: file.name, bytes: file.size });
      } catch {
        setError('unreadable');
      }
    }
    setImages(picked);
    setResultUrl(null);
  }

  function move(index: number, dir: -1 | 1): void {
    setImages((prev) => {
      const next = [...prev];
      const j = index + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[index], next[j]] = [next[j], next[index]];
      return next;
    });
  }

  async function handleBuild(): Promise<void> {
    if (images.length === 0) return;
    setBusy(true); setError(null); setResultUrl(null);
    try {
      const blob = await buildImagesPdf(images);
      setResultBytes(blob.size);
      setResultUrl(URL.createObjectURL(blob));
    } catch {
      setError('failed');
    } finally {
      setBusy(false);
    }
  }

  const totalBytes = images.reduce((sum, img) => sum + img.bytes, 0);

  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="image-to-pdf-title">
      <div style={heroStyle}>
        <h2 id="image-to-pdf-title" style={heroTitleStyle}>{t({ bn: 'ছবি থেকে পিডিএফ', en: 'Image to PDF' })}</h2>
        <p style={heroDescStyle}>{t({ bn: 'এক বা একাধিক ছবি থেকে PDF ফাইল তৈরি করুন।', en: 'Turn one or more images into a PDF file.' })}</p>
        <span style={trustChipStyle}>{t({ bn: '✓ আপনার ডিভাইসেই প্রক্রিয়া হয়', en: '✓ Processed on your device' })}</span>
        <span style={trustChipStyle}>{t({ bn: 'JPG / PNG / WebP', en: 'JPG / PNG / WebP' })}</span>
      </div>
      <div>
        <label style={labelStyle} htmlFor="img-pdf-files">{t({ bn: 'ছবি (একাধিক বাছা যায়)', en: 'Images (you can pick several)' })}</label>
        <input id="img-pdf-files" style={inputStyle} type="file" accept="image/*" multiple onChange={(e) => void handleFiles(e.target.files)} />
      </div>
      {images.length > 0 ? (
        <div style={{ marginTop: 14 }}>
          <p style={noteStyle}>{t({ bn: 'প্রতিটি ছবি PDF-এর এক পাতা হবে। তীর চিহ্ন দিয়ে ক্রম বদলান।', en: 'Each image becomes one PDF page. Use the arrows to change the order.' })}</p>
          <ol style={{ listStyle: 'none', padding: 0, margin: '12px 0 0', display: 'grid', gap: 8 }}>
            {images.map((img, i) => (
              <li key={`${img.name}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid var(--line)', borderRadius: 8, padding: '8px 10px', background: 'var(--surface)' }}>
                <img src={img.dataUrl} alt={img.name} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6 }} />
                <span style={{ fontSize: 14, flex: 1, wordBreak: 'break-word' }}>{img.name} · {img.width}×{img.height}</span>
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={t({ bn: 'ওপরে নিন', en: 'Move up' })} style={{ minHeight: 36, minWidth: 36, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)' }}>↑</button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === images.length - 1} aria-label={t({ bn: 'নিচে নিন', en: 'Move down' })} style={{ minHeight: 36, minWidth: 36, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)' }}>↓</button>
                <button type="button" onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))} aria-label={t({ bn: 'সরান', en: 'Remove' })} style={{ minHeight: 36, minWidth: 36, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)' }}>✕</button>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
      <div style={{ marginTop: 14 }}>
        <Button onClick={() => void handleBuild()} loading={busy} disabled={images.length === 0}>
          {t({ bn: 'পিডিএফ বানান', en: 'Make PDF' })}
        </Button>
      </div>
      <PrivacyNote />
      {error ? (
        <p style={errorStyle} role="alert">
          {error === 'not-image' ? t({ bn: 'একটি ছবির ফাইল বাছুন (JPG, PNG, WebP বা এ জাতীয়)।', en: 'Choose an image file (JPG, PNG, WebP or similar).' })
            : error === 'too-big' ? t({ bn: 'একটি ছবি ১০ MB-এর বেশি — ছোট ছবি বাছুন।', en: 'One image is over 10 MB — choose a smaller image.' })
            : error === 'unreadable' ? t({ bn: 'একটি ছবি পড়া যায়নি — ফাইলটি নষ্ট বা অসমর্থিত হতে পারে।', en: 'One image could not be read — it may be corrupt or unsupported.' })
            : t({ bn: 'পিডিএফ বানানো যায়নি — আবার চেষ্টা করুন।', en: 'Could not make the PDF — please try again.' })}
        </p>
      ) : null}
      {resultUrl ? (
        <div style={resultStyle} role="status">
          <p style={headlineLabelStyle}>{t({ bn: 'পিডিএফের পাতা', en: 'PDF pages' })}</p>
          <p style={headlineStyle}>{images.length}</p>
          <div style={tileGridStyle}>
            <Tile label={t({ bn: 'ছবির সংখ্যা', en: 'Images' })} value={images.length} />
            <Tile label={t({ bn: 'ছবির মোট আকার', en: 'Total image size' })} value={`${(totalBytes / 1024 / 1024).toFixed(2)} MB`} />
            <Tile label={t({ bn: 'পিডিএফের আকার', en: 'PDF size' })} value={`${(resultBytes / 1024).toFixed(1)} KB`} />
          </div>
          <a ref={downloadRef} href={resultUrl} download="images.pdf" style={images.length > 5 ? { display: 'none' } : downloadStyle}>{t({ bn: 'পিডিএফ ডাউনলোড করুন', en: 'Download the PDF' })}</a>
          {images.length > 5 ? (
            <>
              <p style={noteStyle}>{t({ bn: '৫টির বেশি ছবির বাল্ক ডাউনলোড — নিচে বিনামূল্যে ডাউনলোড করুন।', en: 'Bulk download of more than 5 images — download free below.' })}</p>
              <div style={{ marginTop: 10 }}>
                <RewardedAdButton lang={lang} onFreeDownload={() => downloadRef.current?.click()} />
              </div>
            </>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
