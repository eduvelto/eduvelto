// Eduvelto — JPG to PNG tool UI (Batch 3, 27 Nov 2026).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Logic in src/lib/tools/imageConvert.ts (canvas). File stays on device.

import { useRef, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { Button } from '../../components/ui';
import RewardedAdButton from '../../components/RewardedAdButton';
import { convertImage, realImageDeps } from '../../lib/tools/imageConvert';
import {
  cardStyle, errorStyle, fmtBytes, headlineLabelStyle, headlineStyle,
  heroDescStyle, heroStyle, heroTitleStyle, inputStyle, isOverLimit, labelStyle,
  noteStyle, previewStyle, PrivacyNote, resultStyle, Tile, tileGridStyle, trustChipStyle,
} from './toolShared';

export function JpgToPngTool() {
  const { t, lang } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const downloadRef = useRef<HTMLAnchorElement | null>(null);
  const [result, setResult] = useState<{ width: number; height: number; bytes: number } | null>(null);

  function handleFile(next: File | null): void {
    setResultUrl(null); setResult(null); setError(null); setPreview(null);
    if (!next) { setFile(null); return; }
    if (!(next.type === 'image/jpeg' || /\.jpe?g$/i.test(next.name))) {
      setFile(null); setError('not-jpg'); return;
    }
    if (isOverLimit(next)) { setFile(null); setError('too-big'); return; }
    setFile(next);
    setPreview(URL.createObjectURL(next));
  }

  async function handleConvert(): Promise<void> {
    if (!file) return;
    setBusy(true); setError(null); setResultUrl(null);
    try {
      const out = await convertImage(file, { format: 'image/png' }, realImageDeps());
      setResult({ width: out.width, height: out.height, bytes: out.blob.size });
      setResultUrl(URL.createObjectURL(out.blob));
    } catch {
      setError('failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="jpg-to-png-title">
      <div style={heroStyle}>
        <h2 id="jpg-to-png-title" style={heroTitleStyle}>{t({ bn: 'জেপিজি থেকে পিএনজি', en: 'JPG to PNG' })}</h2>
        <p style={heroDescStyle}>{t({ bn: 'JPG ছবিকে PNG ফরম্যাটে রূপান্তর করুন।', en: 'Convert a JPG image to PNG format.' })}</p>
        <span style={trustChipStyle}>{t({ bn: '✓ আপনার ডিভাইসেই প্রক্রিয়া হয়', en: '✓ Processed on your device' })}</span>
        <span style={trustChipStyle}>{t({ bn: '১০ MB পর্যন্ত', en: 'Up to 10 MB' })}</span>
      </div>
      <div>
        <label style={labelStyle} htmlFor="jpg-png-file">{t({ bn: 'JPG ছবি', en: 'JPG image' })}</label>
        <input id="jpg-png-file" style={inputStyle} type="file" accept="image/jpeg,.jpg,.jpeg" onChange={(e) => handleFile(e.target.files?.[0] ?? null)} />
      </div>
      {preview ? <img src={preview} alt={t({ bn: 'মূল ছবির প্রিভিউ', en: 'Preview of the original image' })} style={previewStyle} /> : null}
      <p style={noteStyle}>{t({ bn: 'PNG-তে রূপান্তর করলে ছবির মান কমে না; তবে ফাইলের আকার সাধারণত বড় হয়।', en: 'Converting to PNG loses no quality, but the file is usually larger.' })}</p>
      <div style={{ marginTop: 14 }}>
        <Button onClick={() => void handleConvert()} loading={busy} disabled={!file}>
          {t({ bn: 'PNG-তে রূপান্তর করুন', en: 'Convert to PNG' })}
        </Button>
      </div>
      <PrivacyNote />
      {error ? (
        <p style={errorStyle} role="alert">
          {error === 'not-jpg' ? t({ bn: 'শুধু JPG ছবি চলবে — .jpg বা .jpeg ফাইল বাছুন।', en: 'Only JPG images work — choose a .jpg or .jpeg file.' })
            : error === 'too-big' ? t({ bn: 'ফাইলটি ১০ MB-এর বেশি — ছোট ফাইল বাছুন।', en: 'The file is over 10 MB — choose a smaller file.' })
            : t({ bn: 'রূপান্তর করা যায়নি — ফাইলটি নষ্ট বা অসমর্থিত হতে পারে।', en: 'Could not convert — the file may be corrupt or unsupported.' })}
        </p>
      ) : null}
      {resultUrl && result && file ? (
        <div style={resultStyle} role="status">
          <p style={headlineLabelStyle}>{t({ bn: 'নতুন ফাইল', en: 'New file' })}</p>
          <p style={headlineStyle}>PNG · {result.width}×{result.height}</p>
          <div style={tileGridStyle}>
            <Tile label={t({ bn: 'আগের আকার', en: 'Before' })} value={fmtBytes(file.size)} />
            <Tile label={t({ bn: 'পরের আকার', en: 'After' })} value={fmtBytes(result.bytes)} />
            <Tile label={t({ bn: 'ফরম্যাট', en: 'Format' })} value="PNG" />
          </div>
          <img src={resultUrl} alt={t({ bn: 'PNG ছবির প্রিভিউ', en: 'Preview of the PNG image' })} style={previewStyle} />
          <a ref={downloadRef} href={resultUrl} download="converted.png" style={{ display: 'none' }} aria-hidden="true" tabIndex={-1} />
          {/* Ads rollout B3 (27 Nov 2026): this image download goes through RewardedAdButton (15s) — Free Download is live, the 15s Unlock stays disabled until AdSense approval (never a fake timer). */}
          <RewardedAdButton lang={lang} durationSeconds={15} onFreeDownload={() => downloadRef.current?.click()} />
        </div>
      ) : null}
    </section>
  );
}
