// Eduvelto — HEIC to JPG tool UI (27 Nov 2026).
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Logic in src/lib/tools/heicToJpg.ts (heic2any 0.0.4, lazy).
// The photo never leaves the device: it is decoded 100% in the
// browser (libheif WebAssembly).

import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { Button } from '../../components/ui';
import RewardedAdButton from '../../components/RewardedAdButton';
import {
  convertHeicToJpg, heicJpegFileName, isHeicFile, validateHeicQuality,
  HEIC_MAX_MB,
} from '../../lib/tools/heicToJpg';
import {
  cardStyle, errorStyle, headlineLabelStyle, headlineStyle,
  heroDescStyle, heroStyle, heroTitleStyle, inputStyle, isOverLimit, labelStyle,
  noteStyle, PrivacyNote, resultStyle, Tile, tileGridStyle, trustChipStyle,
} from './toolShared';

export function HeicToJpgTool() {
  const { t, lang } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [quality, setQuality] = useState(0.92);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const downloadRef = useRef<HTMLAnchorElement | null>(null);
  const [resultBytes, setResultBytes] = useState(0);
  const [dims, setDims] = useState<{ width: number; height: number } | null>(null);
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    const url = urlRef.current;
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, []);

  function handleFile(next: File | null): void {
    setError(null);
    setDims(null);
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
    setResultUrl(null);
    if (!next) {
      setFile(null);
      return;
    }
    if (!isHeicFile(next, next.name)) {
      setFile(null);
      setError('not-heic');
      return;
    }
    if (isOverLimit(next, HEIC_MAX_MB)) {
      setFile(null);
      setError('too-big');
      return;
    }
    setFile(next);
  }

  async function handleConvert(): Promise<void> {
    if (!file) return;
    try {
      validateHeicQuality(quality);
    } catch {
      setError('failed');
      return;
    }
    setBusy(true);
    setError(null);
    setDims(null);
    try {
      const blob = await convertHeicToJpg(file, quality);
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      const url = URL.createObjectURL(blob);
      urlRef.current = url;
      setResultUrl(url);
      setResultBytes(blob.size);
      // Read the real JPG dimensions for the result tiles.
      const img = new Image();
      const size = await new Promise<{ width: number; height: number }>((resolve, reject) => {
        img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
        img.onerror = () => reject(new Error('unreadable'));
        img.src = url;
      });
      setDims(size);
    } catch {
      setError('failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="heic-to-jpg-title">
      <div style={heroStyle}>
        <h2 id="heic-to-jpg-title" style={heroTitleStyle}>{t({ bn: 'এইচইআইসি থেকে জেপিজি', en: 'HEIC to JPG' })}</h2>
        <p style={heroDescStyle}>{t({ bn: 'আইফোনের HEIC ছবিকে JPG-তে রূপান্তর করুন, যাতে সব জায়গায় খোলা যায়।', en: 'Convert an iPhone HEIC photo to JPG so it opens everywhere.' })}</p>
        <span style={trustChipStyle}>{t({ bn: '✓ আপনার ডিভাইসেই প্রক্রিয়া হয়', en: '✓ Processed on your device' })}</span>
        <span style={trustChipStyle}>heic2any (libheif) • 0.0.4</span>
        <span style={trustChipStyle}>{t({ bn: '১০ MB পর্যন্ত', en: 'Up to 10 MB' })}</span>
      </div>
      <div>
        <label style={labelStyle} htmlFor="heic-jpg-file">{t({ bn: 'HEIC ছবি', en: 'HEIC photo' })}</label>
        <input id="heic-jpg-file" style={inputStyle} type="file" accept=".heic,.heif,image/heic,image/heif" onChange={(e) => handleFile(e.target.files?.[0] ?? null)} />
      </div>
      {file ? (
        <div style={{ marginTop: 12 }}>
          <label style={labelStyle} htmlFor="heic-jpg-quality">
            {t({ bn: 'JPG কোয়ালিটি', en: 'JPG quality' })} — {Math.round(quality * 100)}%
          </label>
          <input
            id="heic-jpg-quality"
            style={{ width: '100%' }}
            type="range"
            min={50}
            max={100}
            value={Math.round(quality * 100)}
            onChange={(e) => setQuality(Number(e.target.value) / 100)}
          />
        </div>
      ) : null}
      <div style={{ marginTop: 14 }}>
        <Button onClick={() => void handleConvert()} loading={busy} disabled={!file}>
          {t({ bn: 'JPG-তে রূপান্তর করুন', en: 'Convert to JPG' })}
        </Button>
      </div>
      <PrivacyNote limitMb={HEIC_MAX_MB} />
      <p style={noteStyle}>
        {t({
          bn: 'আইফোনে নতুন ছবি সরাসরি JPG-তে তুলতে চাইলে সেটিংসে ক্যামেরা ফরম্যাট "Most Compatible" করে নিন।',
          en: 'To take new iPhone photos directly as JPG, set the camera format to "Most Compatible" in Settings.',
        })}
      </p>
      {error ? (
        <p style={errorStyle} role="alert">
          {error === 'not-heic' ? t({ bn: 'শুধু HEIC/HEIF ছবি চলবে — .heic বা .heif ফাইল বাছুন।', en: 'Only HEIC/HEIF photos work — choose a .heic or .heif file.' })
            : error === 'too-big' ? t({ bn: 'ছবিটি ১০ MB-এর বেশি — ছোট ছবি বাছুন।', en: 'The photo is over 10 MB — choose a smaller photo.' })
            : t({ bn: 'রূপান্তর করা যায়নি — ছবিটি নষ্ট হতে পারে বা HEIC নয়। আবার চেষ্টা করুন।', en: 'Could not convert — the photo may be corrupt or not a HEIC file. Please try again.' })}
        </p>
      ) : null}
      {resultUrl ? (
        <div style={resultStyle} role="status">
          <p style={headlineLabelStyle}>{t({ bn: 'JPG তৈরি হয়েছে', en: 'JPG created' })}</p>
          <p style={headlineStyle}>JPG</p>
          <div style={tileGridStyle}>
            <Tile label={t({ bn: 'আগের আকার', en: 'Original size' })} value={file ? `${(file.size / 1024).toFixed(1)} KB` : '—'} />
            <Tile label={t({ bn: 'JPG আকার', en: 'JPG size' })} value={`${(resultBytes / 1024).toFixed(1)} KB`} />
            <Tile label={t({ bn: 'আকার (পিক্সেল)', en: 'Dimensions (px)' })} value={dims ? `${dims.width}×${dims.height}` : '…'} />
          </div>
          <img src={resultUrl} alt={file ? heicJpegFileName(file.name) : 'JPG'} style={{ width: '100%', maxWidth: 320, borderRadius: 8, marginTop: 12, display: 'block' }} />
          <a ref={downloadRef} href={resultUrl} download={file ? heicJpegFileName(file.name) : 'photo.jpg'} style={{ display: 'none' }} aria-hidden="true" tabIndex={-1} />
          {/* Ads rollout B3 (27 Nov 2026): this image download goes through RewardedAdButton (15s) — Free Download is live, the 15s Unlock stays disabled until AdSense approval (never a fake timer). */}
          <RewardedAdButton lang={lang} durationSeconds={15} onFreeDownload={() => downloadRef.current?.click()} />
        </div>
      ) : null}
    </section>
  );
}
