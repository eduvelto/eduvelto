// Eduvelto — EXIF Viewer & Remover tool UI (Batch 3, 27 Nov 2026).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// EXIF parsing in src/lib/tools/exif.ts (pure JPEG header parser).
// Removal = canvas re-encode, which drops every metadata segment.
// File stays on device. A missing tag is shown as missing, never invented.

import { useRef, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { Button } from '../../components/ui';
import RewardedAdButton from '../../components/RewardedAdButton';
import { formatGps, parseExif, stripExif, type ExifData } from '../../lib/tools/exif';
import {
  cardStyle, errorStyle, headlineLabelStyle, headlineStyle,
  heroDescStyle, heroStyle, heroTitleStyle, inputStyle, isOverLimit, labelStyle,
  noteStyle, previewStyle, PrivacyNote, resultStyle, Tile, tileGridStyle, trustChipStyle,
} from './toolShared';

function Row({ label, value }: { label: string; value: string | number | undefined }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--line)', fontSize: 14 }}>
      <span style={{ color: 'var(--muted)', fontWeight: 600 }}>{label}</span>
      <span style={{ color: 'var(--heading)', textAlign: 'right', wordBreak: 'break-word' }}>{value ?? '—'}</span>
    </div>
  );
}

export function ExifViewerRemoverTool() {
  const { t, lang } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [exif, setExif] = useState<ExifData | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cleanUrl, setCleanUrl] = useState<string | null>(null);
  const downloadRef = useRef<HTMLAnchorElement | null>(null);
  const [cleanBytes, setCleanBytes] = useState(0);
  const [cleanFormat, setCleanFormat] = useState<'image/jpeg' | 'image/png'>('image/jpeg');

  async function handleFile(next: File | null): Promise<void> {
    setExif(null); setCleanUrl(null); setError(null); setPreview(null);
    if (!next) { setFile(null); return; }
    if (!next.type.startsWith('image/')) { setFile(null); setError('not-image'); return; }
    if (isOverLimit(next)) { setFile(null); setError('too-big'); return; }
    setFile(next);
    setPreview(URL.createObjectURL(next));
    if (next.type !== 'image/jpeg' && !/\.jpe?g$/i.test(next.name)) {
      setExif({ tagCount: 0 });
      return;
    }
    try {
      setExif(parseExif(await next.arrayBuffer()));
    } catch {
      setError('unreadable');
    }
  }

  async function handleStrip(): Promise<void> {
    if (!file) return;
    setBusy(true); setError(null); setCleanUrl(null);
    try {
      const blob = await stripExif(file, cleanFormat);
      setCleanBytes(blob.size);
      setCleanUrl(URL.createObjectURL(blob));
    } catch {
      setError('failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="exif-viewer-title">
      <div style={heroStyle}>
        <h2 id="exif-viewer-title" style={heroTitleStyle}>{t({ bn: 'এক্সিফ ভিউয়ার ও রিমুভার', en: 'EXIF Viewer & Remover' })}</h2>
        <p style={heroDescStyle}>{t({ bn: 'ছবির লুকানো তথ্য যেমন তোলার তারিখ ও অবস্থান দেখুন এবং প্রয়োজনে মুছে ফেলুন।', en: 'View hidden photo details such as the date and location, and remove them when needed.' })}</p>
        <span style={trustChipStyle}>{t({ bn: '✓ আপনার ডিভাইসেই প্রক্রিয়া হয়', en: '✓ Processed on your device' })}</span>
        <span style={trustChipStyle}>{t({ bn: 'JPEG-এর EXIF পড়া হয়', en: 'Reads JPEG EXIF' })}</span>
      </div>
      <div>
        <label style={labelStyle} htmlFor="exif-file">{t({ bn: 'ছবির ফাইল', en: 'Image file' })}</label>
        <input id="exif-file" style={inputStyle} type="file" accept="image/*" onChange={(e) => void handleFile(e.target.files?.[0] ?? null)} />
      </div>
      {preview ? <img src={preview} alt={t({ bn: 'ছবির প্রিভিউ', en: 'Preview of the image' })} style={previewStyle} /> : null}
      {exif ? (
        <div style={resultStyle} role="status">
          <p style={headlineLabelStyle}>{t({ bn: 'পাওয়া EXIF ট্যাগ', en: 'EXIF tags found' })}</p>
          <p style={headlineStyle}>{exif.tagCount}</p>
          {exif.tagCount === 0 ? (
            <p style={noteStyle}>{t({ bn: 'এই ছবিতে কোনো EXIF তথ্য পাওয়া যায়নি — অনেক ছবিতে (যেমন PNG) EXIF থাকেই না।', en: 'No EXIF data was found in this image — many images (such as PNG) never carry EXIF.' })}</p>
          ) : (
            <div style={{ marginTop: 8 }}>
              <Row label={t({ bn: 'ক্যামেরা কোম্পানি', en: 'Camera make' })} value={exif.make} />
              <Row label={t({ bn: 'ক্যামেরা মডেল', en: 'Camera model' })} value={exif.model} />
              <Row label={t({ bn: 'তোলার তারিখ', en: 'Date taken' })} value={exif.dateTimeOriginal ?? exif.dateTime} />
              <Row label={t({ bn: 'সফটওয়্যার', en: 'Software' })} value={exif.software} />
              <Row label={t({ bn: 'ছবির মাপ', en: 'Dimensions' })} value={exif.imageWidth && exif.imageHeight ? `${exif.imageWidth}×${exif.imageHeight}` : undefined} />
              <Row label={t({ bn: 'দিক (orientation)', en: 'Orientation' })} value={exif.orientation} />
              <Row label={t({ bn: 'শাটার গতি', en: 'Shutter speed' })} value={exif.exposureTime} />
              <Row label={t({ bn: 'অ্যাপারচার (f-number)', en: 'Aperture (f-number)' })} value={exif.fNumber ? `f/${exif.fNumber}` : undefined} />
              <Row label={t({ bn: 'ISO', en: 'ISO' })} value={exif.iso} />
              <Row label={t({ bn: 'ফোকাল দৈর্ঘ্য', en: 'Focal length' })} value={exif.focalLengthMm ? `${exif.focalLengthMm} mm` : undefined} />
              <Row label={t({ bn: 'অবস্থান (GPS)', en: 'Location (GPS)' })} value={exif.gps ? formatGps(exif.gps) : undefined} />
            </div>
          )}
          {exif.gps ? (
            <p style={noteStyle}>{t({ bn: 'সতর্কতা: এই ছবিতে অবস্থান (GPS) তথ্য আছে — শেয়ার করার আগে নিচে মুছে নিন।', en: 'Warning: this photo contains location (GPS) data — remove it below before sharing.' })}</p>
          ) : null}
          <div style={{ marginTop: 14 }}>
            <label style={labelStyle} htmlFor="exif-format">{t({ bn: 'মুছে ফেলার পর ফরম্যাট', en: 'Format after removal' })}</label>
            <select id="exif-format" style={inputStyle} value={cleanFormat} onChange={(e) => setCleanFormat(e.target.value as 'image/jpeg' | 'image/png')}>
              <option value="image/jpeg">JPG</option>
              <option value="image/png">PNG</option>
            </select>
          </div>
          <div style={{ marginTop: 12 }}>
            <Button onClick={() => void handleStrip()} loading={busy} disabled={!file}>
              {t({ bn: 'EXIF মুছে পরিষ্কার ছবি বানান', en: 'Remove EXIF & make clean image' })}
            </Button>
          </div>
          <p style={noteStyle}>{t({ bn: 'মুছে ফেলা মানে ছবিটিকে নতুন করে সংরক্ষণ করা — নতুন ছবিতে কোনো EXIF থাকবে না।', en: 'Removal re-saves the image — the new image carries no EXIF at all.' })}</p>
        </div>
      ) : null}
      <PrivacyNote />
      {error ? (
        <p style={errorStyle} role="alert">
          {error === 'not-image' ? t({ bn: 'একটি ছবির ফাইল বাছুন (JPG, PNG, WebP বা এ জাতীয়)।', en: 'Choose an image file (JPG, PNG, WebP or similar).' })
            : error === 'too-big' ? t({ bn: 'ফাইলটি ১০ MB-এর বেশি — ছোট ফাইল বাছুন।', en: 'The file is over 10 MB — choose a smaller file.' })
            : error === 'unreadable' ? t({ bn: 'ছবিটি পড়া যায়নি — ফাইলটি নষ্ট বা অসমর্থিত হতে পারে।', en: 'The image could not be read — it may be corrupt or unsupported.' })
            : t({ bn: 'EXIF মোছা যায়নি — আবার চেষ্টা করুন।', en: 'Could not remove the EXIF data — please try again.' })}
        </p>
      ) : null}
      {cleanUrl ? (
        <div style={resultStyle} role="status">
          <p style={headlineLabelStyle}>{t({ bn: 'পরিষ্কার ছবি', en: 'Clean image' })}</p>
          <p style={headlineStyle}>{t({ bn: 'EXIF মোছা হয়েছে', en: 'EXIF removed' })}</p>
          <div style={tileGridStyle}>
            <Tile label={t({ bn: 'আগের আকার', en: 'Before' })} value={file ? `${(file.size / 1024).toFixed(1)} KB` : '—'} />
            <Tile label={t({ bn: 'পরের আকার', en: 'After' })} value={`${(cleanBytes / 1024).toFixed(1)} KB`} />
            <Tile label={t({ bn: 'ফরম্যাট', en: 'Format' })} value={cleanFormat === 'image/png' ? 'PNG' : 'JPG'} />
          </div>
          <a ref={downloadRef} href={cleanUrl} download={cleanFormat === 'image/png' ? 'clean.png' : 'clean.jpg'} style={{ display: 'none' }} aria-hidden="true" tabIndex={-1} />
          {/* Ads rollout B3 (27 Nov 2026): this image download goes through RewardedAdButton (15s) — Free Download is live, the 15s Unlock stays disabled until AdSense approval (never a fake timer). */}
          <RewardedAdButton lang={lang} durationSeconds={15} onFreeDownload={() => downloadRef.current?.click()} />
        </div>
      ) : null}
    </section>
  );
}
