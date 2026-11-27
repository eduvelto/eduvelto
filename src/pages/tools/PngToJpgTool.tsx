// Eduvelto — PNG to JPG tool UI (Batch 3, 27 Nov 2026).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Logic in src/lib/tools/imageConvert.ts (canvas). File stays on device.
// JPG has no transparency: transparent areas become white (stated here).

import { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { Button } from '../../components/ui';
import { convertImage, realImageDeps } from '../../lib/tools/imageConvert';
import {
  cardStyle, downloadStyle, errorStyle, fmtBytes, headlineLabelStyle, headlineStyle,
  heroDescStyle, heroStyle, heroTitleStyle, inputStyle, isOverLimit, labelStyle,
  noteStyle, previewStyle, PrivacyNote, resultStyle, Tile, tileGridStyle, trustChipStyle,
} from './toolShared';

export function PngToJpgTool() {
  const { t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [quality, setQuality] = useState('0.92');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [result, setResult] = useState<{ width: number; height: number; bytes: number } | null>(null);

  function handleFile(next: File | null): void {
    setResultUrl(null); setResult(null); setError(null); setPreview(null);
    if (!next) { setFile(null); return; }
    if (!(next.type === 'image/png' || /\.png$/i.test(next.name))) {
      setFile(null); setError('not-png'); return;
    }
    if (isOverLimit(next)) { setFile(null); setError('too-big'); return; }
    setFile(next);
    setPreview(URL.createObjectURL(next));
  }

  async function handleConvert(): Promise<void> {
    if (!file) return;
    setBusy(true); setError(null); setResultUrl(null);
    try {
      const out = await convertImage(file, { format: 'image/jpeg', quality: Number(quality) }, realImageDeps());
      setResult({ width: out.width, height: out.height, bytes: out.blob.size });
      setResultUrl(URL.createObjectURL(out.blob));
    } catch {
      setError('failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="png-to-jpg-title">
      <div style={heroStyle}>
        <h2 id="png-to-jpg-title" style={heroTitleStyle}>{t({ bn: 'পিএনজি থেকে জেপিজি', en: 'PNG to JPG' })}</h2>
        <p style={heroDescStyle}>{t({ bn: 'PNG ছবিকে JPG ফরম্যাটে রূপান্তর করুন।', en: 'Convert a PNG image to JPG format.' })}</p>
        <span style={trustChipStyle}>{t({ bn: '✓ আপনার ডিভাইসেই প্রক্রিয়া হয়', en: '✓ Processed on your device' })}</span>
        <span style={trustChipStyle}>{t({ bn: '১০ MB পর্যন্ত', en: 'Up to 10 MB' })}</span>
      </div>
      <div>
        <label style={labelStyle} htmlFor="png-jpg-file">{t({ bn: 'PNG ছবি', en: 'PNG image' })}</label>
        <input id="png-jpg-file" style={inputStyle} type="file" accept="image/png,.png" onChange={(e) => handleFile(e.target.files?.[0] ?? null)} />
      </div>
      <div style={{ marginTop: 12 }}>
        <label style={labelStyle} htmlFor="png-jpg-quality">{t({ bn: 'মান (quality): ', en: 'Quality: ' })}{Math.round(Number(quality) * 100)}%</label>
        <input id="png-jpg-quality" style={inputStyle} type="range" min="0.1" max="1" step="0.05" value={quality} onChange={(e) => setQuality(e.target.value)} />
      </div>
      {preview ? <img src={preview} alt={t({ bn: 'মূল ছবির প্রিভিউ', en: 'Preview of the original image' })} style={previewStyle} /> : null}
      <p style={noteStyle}>{t({ bn: 'JPG-এ স্বচ্ছতা (transparency) থাকে না — স্বচ্ছ অংশ সাদা হয়ে যাবে।', en: 'JPG has no transparency — transparent areas become white.' })}</p>
      <div style={{ marginTop: 14 }}>
        <Button onClick={() => void handleConvert()} loading={busy} disabled={!file}>
          {t({ bn: 'JPG-তে রূপান্তর করুন', en: 'Convert to JPG' })}
        </Button>
      </div>
      <PrivacyNote />
      {error ? (
        <p style={errorStyle} role="alert">
          {error === 'not-png' ? t({ bn: 'শুধু PNG ছবি চলবে — .png ফাইল বাছুন।', en: 'Only PNG images work — choose a .png file.' })
            : error === 'too-big' ? t({ bn: 'ফাইলটি ১০ MB-এর বেশি — ছোট ফাইল বাছুন।', en: 'The file is over 10 MB — choose a smaller file.' })
            : t({ bn: 'রূপান্তর করা যায়নি — ফাইলটি নষ্ট বা অসমর্থিত হতে পারে।', en: 'Could not convert — the file may be corrupt or unsupported.' })}
        </p>
      ) : null}
      {resultUrl && result && file ? (
        <div style={resultStyle} role="status">
          <p style={headlineLabelStyle}>{t({ bn: 'নতুন ফাইল', en: 'New file' })}</p>
          <p style={headlineStyle}>JPG · {result.width}×{result.height}</p>
          <div style={tileGridStyle}>
            <Tile label={t({ bn: 'আগের আকার', en: 'Before' })} value={fmtBytes(file.size)} />
            <Tile label={t({ bn: 'পরের আকার', en: 'After' })} value={fmtBytes(result.bytes)} />
            <Tile label={t({ bn: 'মান', en: 'Quality' })} value={`${Math.round(Number(quality) * 100)}%`} />
          </div>
          <img src={resultUrl} alt={t({ bn: 'JPG ছবির প্রিভিউ', en: 'Preview of the JPG image' })} style={previewStyle} />
          <a href={resultUrl} download="converted.jpg" style={downloadStyle}>{t({ bn: 'JPG ডাউনলোড করুন', en: 'Download the JPG' })}</a>
        </div>
      ) : null}
    </section>
  );
}
