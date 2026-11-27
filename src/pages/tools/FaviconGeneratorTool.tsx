// Eduvelto — Favicon Generator tool UI (Batch 3, 27 Nov 2026).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// ICO bytes are written for real in src/lib/tools/faviconMeme.ts
// (PNG-embedded ICO). PNG downloads per size are canvas exports.
// File stays on device. No ICO claim is made that is not delivered.

import { useRef, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import RewardedAdButton from '../../components/RewardedAdButton';
import { Button } from '../../components/ui';
import { buildIco, FAVICON_SIZES } from '../../lib/tools/faviconMeme';
import { realImageDeps } from '../../lib/tools/imageConvert';
import {
  cardStyle, errorStyle, headlineLabelStyle, headlineStyle,
  heroDescStyle, heroStyle, heroTitleStyle, inputStyle, isOverLimit, labelStyle,
  noteStyle, previewStyle, PrivacyNote, resultStyle, Tile, tileGridStyle, trustChipStyle,
} from './toolShared';

export function FaviconGeneratorTool() {
  const { t, lang } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [sizes, setSizes] = useState<Set<number>>(new Set([16, 32, 48]));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pngUrls, setPngUrls] = useState<{ size: number; url: string; bytes: number }[]>([]);
  const [icoUrl, setIcoUrl] = useState<string | null>(null);
  // Ads rollout B3 (27 Nov 2026): the .ico is the bundled take-away
  // (it holds every chosen size), so ITS download goes through the
  // 15s rewarded gate. The small per-size PNG links stay direct —
  // gating each of up to 6 sizes would stack six gates on one result.
  const downloadRef = useRef<HTMLAnchorElement | null>(null);
  const [icoBytes, setIcoBytes] = useState(0);

  function toggleSize(size: number): void {
    setSizes((prev) => {
      const next = new Set(prev);
      if (next.has(size)) {
        if (next.size > 1) next.delete(size);
      } else next.add(size);
      return next;
    });
  }

  function handleFile(next: File | null): void {
    setPngUrls([]); setIcoUrl(null); setError(null); setPreview(null);
    if (!next) { setFile(null); return; }
    if (!next.type.startsWith('image/')) { setFile(null); setError('not-image'); return; }
    if (isOverLimit(next)) { setFile(null); setError('too-big'); return; }
    setFile(next);
    setPreview(URL.createObjectURL(next));
  }

  async function handleGenerate(): Promise<void> {
    if (!file) return;
    setBusy(true); setError(null); setPngUrls([]); setIcoUrl(null);
    try {
      const deps = realImageDeps();
      const img = await deps.loadImage!(file);
      const chosen = [...sizes].sort((a, b) => a - b);
      const pngs: { size: number; url: string; bytes: number; buf: ArrayBuffer }[] = [];
      for (const size of chosen) {
        const canvas = deps.createCanvas!(size, size);
        const ctx = canvas.getContext('2d') as unknown as { drawImage: (img: unknown, x: number, y: number, w: number, h: number) => void } | null;
        if (!ctx) throw new Error('no-context');
        ctx.drawImage(img, 0, 0, size, size);
        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('export-failed'))), 'image/png');
        });
        pngs.push({ size, url: URL.createObjectURL(blob), bytes: blob.size, buf: await blob.arrayBuffer() });
      }
      const ico = buildIco(pngs.map((p) => ({ size: p.size, png: p.buf })));
      setIcoBytes(ico.size);
      setIcoUrl(URL.createObjectURL(ico));
      setPngUrls(pngs.map((p) => ({ size: p.size, url: p.url, bytes: p.bytes })));
    } catch {
      setError('failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="favicon-generator-title">
      <div style={heroStyle}>
        <h2 id="favicon-generator-title" style={heroTitleStyle}>{t({ bn: 'ফ্যাভিকন জেনারেটর', en: 'Favicon Generator' })}</h2>
        <p style={heroDescStyle}>{t({ bn: 'ওয়েবসাইটের ব্রাউজার ট্যাবের ছোট আইকন (ফ্যাভিকন) তৈরি করুন।', en: 'Create the small icon (favicon) shown in a website’s browser tab.' })}</p>
        <span style={trustChipStyle}>{t({ bn: '✓ আপনার ডিভাইসেই প্রক্রিয়া হয়', en: '✓ Processed on your device' })}</span>
        <span style={trustChipStyle}>{t({ bn: 'PNG + আসল .ico', en: 'PNG + real .ico' })}</span>
      </div>
      <div>
        <label style={labelStyle} htmlFor="favicon-file">{t({ bn: 'ছবির ফাইল (বর্গাকার ভালো)', en: 'Image file (square works best)' })}</label>
        <input id="favicon-file" style={inputStyle} type="file" accept="image/*" onChange={(e) => handleFile(e.target.files?.[0] ?? null)} />
      </div>
      {preview ? <img src={preview} alt={t({ bn: 'মূল ছবির প্রিভিউ', en: 'Preview of the original image' })} style={previewStyle} /> : null}
      <div style={{ marginTop: 14 }}>
        <p style={labelStyle}>{t({ bn: 'আকার বাছুন', en: 'Choose sizes' })}</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {FAVICON_SIZES.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => toggleSize(size)}
              aria-pressed={sizes.has(size)}
              style={{ minHeight: 44, minWidth: 64, padding: '8px 12px', borderRadius: 8, border: sizes.has(size) ? '2px solid var(--teal, #0b7285)' : '1px solid var(--line)', background: 'var(--surface)', color: 'var(--heading)', fontWeight: 700, cursor: 'pointer' }}
            >
              {size}×{size}
            </button>
          ))}
        </div>
        <p style={noteStyle}>{t({ bn: '১৬/৩২/৪৮ ব্রাউজার ট্যাবের জন্য; ১৮০ অ্যাপল টাচ আইকনের জন্য; ১৯২/৫১২ PWA-এর জন্য।', en: '16/32/48 are for browser tabs; 180 is for the Apple touch icon; 192/512 are for PWAs.' })}</p>
      </div>
      <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Button onClick={() => void handleGenerate()} loading={busy} disabled={!file}>
          {t({ bn: 'ফ্যাভিকন তৈরি করুন', en: 'Generate favicon' })}
        </Button>
        <Button onClick={() => setSizes(new Set([16, 32, 48]))}>{t({ bn: 'সাধারণ আকার (১৬/৩২/৪৮)', en: 'Standard sizes (16/32/48)' })}</Button>
      </div>
      <PrivacyNote />
      {error ? (
        <p style={errorStyle} role="alert">
          {error === 'not-image' ? t({ bn: 'একটি ছবির ফাইল বাছুন (JPG, PNG, WebP বা এ জাতীয়)।', en: 'Choose an image file (JPG, PNG, WebP or similar).' })
            : error === 'too-big' ? t({ bn: 'ফাইলটি ১০ MB-এর বেশি — ছোট ফাইল বাছুন।', en: 'The file is over 10 MB — choose a smaller file.' })
            : t({ bn: 'ফ্যাভিকন বানানো যায়নি — ফাইলটি নষ্ট বা অসমর্থিত হতে পারে।', en: 'Could not make the favicon — the file may be corrupt or unsupported.' })}
        </p>
      ) : null}
      {pngUrls.length > 0 ? (
        <div style={resultStyle} role="status">
          <p style={headlineLabelStyle}>{t({ bn: 'তৈরি আকার', en: 'Sizes made' })}</p>
          <p style={headlineStyle}>{pngUrls.map((p) => p.size).join(' · ')}</p>
          <div style={tileGridStyle}>
            <Tile label={t({ bn: 'PNG ফাইল', en: 'PNG files' })} value={pngUrls.length} />
            <Tile label={t({ bn: '.ico ফাইলের আকার', en: '.ico file size' })} value={`${(icoBytes / 1024).toFixed(1)} KB`} />
            <Tile label={t({ bn: 'বড় আকার', en: 'Largest size' })} value={`${Math.max(...pngUrls.map((p) => p.size))}px`} />
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {pngUrls.map((p) => (
              <span key={p.size} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: '1px solid var(--line)', borderRadius: 8, padding: '6px 8px', background: 'var(--surface)' }}>
                <img src={p.url} alt={`${p.size}px favicon`} width={Math.min(32, p.size)} height={Math.min(32, p.size)} />
                <a href={p.url} download={`favicon-${p.size}.png`} style={{ color: 'var(--teal-deep)', fontWeight: 600 }}>{p.size}px PNG</a>
              </span>
            ))}
          </div>
          {icoUrl ? (
            <>
              <a ref={downloadRef} href={icoUrl} download="favicon.ico" style={{ display: 'none' }} aria-hidden="true" tabIndex={-1} />
              {/* Ads rollout B3 (27 Nov 2026): this .ico download goes through RewardedAdButton (15s) — Free Download is live, the 15s Unlock stays disabled until AdSense approval (never a fake timer). */}
              <RewardedAdButton lang={lang} durationSeconds={15} onFreeDownload={() => downloadRef.current?.click()} />
            </>
          ) : null}
          <p style={noteStyle}>{t({ bn: '.ico ফাইলটিতে বাছা সব আকারের PNG ডেটা আসল ICO কাঠামোয় লেখা আছে।', en: 'The .ico file contains the chosen sizes as PNG data inside a real ICO container.' })}</p>
        </div>
      ) : null}
    </section>
  );
}
