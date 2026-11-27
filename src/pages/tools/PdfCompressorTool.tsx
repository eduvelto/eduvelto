// Eduvelto — PDF Compressor tool UI (100-Tools Project, Phase 2, Wave 3).
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// The PDF never leaves the device: it is re-saved 100% in the browser.
// Best-effort only — the UI reports the real before/after byte counts
// and never promises a ratio. pdf-lib is loaded with a dynamic import()
// only (never a static import), so it stays out of the main bundle.

import { useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { Button } from '../../components/ui';
import {
  PDF_COMPRESSION_LEVELS,
  PDF_COMPRESS_PRESETS,
  compressPdf,
  type PdfCompressionLevel,
  type PdfCompressPreset,
} from '../../lib/tools/pdfCompressor';

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

const chipStyle = (active: boolean): CSSProperties => ({
  minHeight: 40,
  padding: '8px 14px',
  borderRadius: 999,
  border: '1px solid var(--teal)',
  background: active ? 'var(--teal)' : 'var(--card)',
  color: active ? '#fff' : 'var(--teal-text)',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
});

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

function isPdfFile(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}

export function PdfCompressorTool() {
  const { t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [originalBytes, setOriginalBytes] = useState(0);
  const [newBytes, setNewBytes] = useState(0);
  const [savedPercent, setSavedPercent] = useState(0);
  // Customizable options (owner order, 27 Nov 2026). Defaults = the
  // pre-existing behaviour: Balanced level / Web preset.
  const [level, setLevel] = useState<PdfCompressionLevel>('balanced');
  const [quality, setQuality] = useState(70);
  const [maxDpi, setMaxDpi] = useState(150);
  const [preset, setPreset] = useState<PdfCompressPreset | 'custom'>('web');
  const [targetEnabled, setTargetEnabled] = useState(false);
  const [targetValue, setTargetValue] = useState('');
  const [targetUnit, setTargetUnit] = useState<'KB' | 'MB'>('MB');
  const [targetMet, setTargetMet] = useState<boolean | null>(null);
  const [targetBytes, setTargetBytes] = useState<number | null>(null);
  const [imagesProcessed, setImagesProcessed] = useState(0);
  const [imagesSkipped, setImagesSkipped] = useState(0);

  function applyPreset(next: PdfCompressPreset): void {
    const p = PDF_COMPRESS_PRESETS[next];
    setPreset(next);
    setLevel(p.level);
    setQuality(Math.round(p.imageQuality * 100));
    setMaxDpi(p.maxDpi);
  }

  function applyLevel(next: PdfCompressionLevel): void {
    const l = PDF_COMPRESSION_LEVELS[next];
    setPreset('custom');
    setLevel(next);
    setQuality(Math.round(l.imageQuality * 100));
    setMaxDpi(l.maxDpi);
  }

  function handleFileChange(next: File | null): void {
    setResultUrl(null);
    setError(null);
    setTargetMet(null);
    setTargetBytes(null);
    if (!next) {
      setFile(null);
      return;
    }
    if (!isPdfFile(next)) {
      setFile(null);
      setError('not-pdf');
      return;
    }
    setFile(next);
  }

  async function handleCompress(): Promise<void> {
    if (!file) return;
    setBusy(true);
    setError(null);
    setResultUrl(null);
    setTargetMet(null);
    try {
      const value = Number(targetValue);
      const target =
        targetEnabled && Number.isFinite(value) && value > 0
          ? Math.floor(value * (targetUnit === 'MB' ? 1024 * 1024 : 1024))
          : null;
      const result = await compressPdf(file, {
        level,
        imageQuality: quality / 100,
        maxDpi,
        targetBytes: target,
      });
      setOriginalBytes(result.originalBytes);
      setNewBytes(result.newBytes);
      setSavedPercent(result.savedPercent);
      setTargetMet(result.targetMet);
      setTargetBytes(result.targetBytes);
      setImagesProcessed(result.imagesProcessed);
      setImagesSkipped(result.imagesSkipped);
      setResultUrl(URL.createObjectURL(result.blob));
    } catch {
      setError('failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="pdf-compressor-title">
      <h2 id="pdf-compressor-title" style={{ fontSize: 19, color: 'var(--heading)', margin: '0 0 4px' }}>
        {t({ bn: 'পিডিএফ ছোট করুন', en: 'Compress PDF' })}
      </h2>
      <p style={{ color: 'var(--muted)', fontSize: 14, margin: '0 0 14px' }}>
        {t({
          bn: 'পিডিএফটি আবার সংরক্ষণ করে অপ্রয়োজনীয় অংশ ফেলে দেওয়া হয়। ফাইল আপনার ডিভাইসেই থাকে, কোথাও আপলোড হয় না।',
          en: 'The PDF is re-saved, dropping unused parts. The file stays on your device and is never uploaded.',
        })}
      </p>
      <div>
        <label style={labelStyle} htmlFor="pdf-compress-file">
          {t({ bn: 'পিডিএফ ফাইল', en: 'PDF file' })}
        </label>
        <input
          id="pdf-compress-file"
          style={inputStyle}
          type="file"
          accept="application/pdf,.pdf"
          onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
        />
      </div>
      {/* Customizable options (owner order, 27 Nov 2026). Defaults = Balanced / Web. */}
      <div style={{ marginTop: 16 }}>
        <p style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700, color: 'var(--heading)' }}>
          {t({ bn: 'প্রিসেট', en: 'Presets' })}
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }} role="group" aria-label={t({ bn: 'প্রিসেট', en: 'Presets' })}>
          {(['email', 'web', 'print'] as const).map((p) => (
            <button
              key={p}
              type="button"
              style={chipStyle(preset === p)}
              aria-pressed={preset === p}
              onClick={() => applyPreset(p)}
            >
              {t({ bn: PDF_COMPRESS_PRESETS[p].labelBn, en: PDF_COMPRESS_PRESETS[p].labelEn })}
            </button>
          ))}
          {preset === 'custom' ? (
            <span style={{ alignSelf: 'center', fontSize: 14, color: 'var(--muted)' }}>
              {t({ bn: 'কাস্টম সেটিংস', en: 'Custom settings' })}
            </span>
          ) : null}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginTop: 16 }}>
        <div>
          <p style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700, color: 'var(--heading)' }}>
            {t({ bn: 'কমপ্রেশন লেভেল', en: 'Compression level' })}
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }} role="group" aria-label={t({ bn: 'কমপ্রেশন লেভেল', en: 'Compression level' })}>
            {(['light', 'balanced', 'strong'] as const).map((l) => (
              <button
                key={l}
                type="button"
                style={chipStyle(level === l)}
                aria-pressed={level === l}
                onClick={() => applyLevel(l)}
              >
                {t({ bn: PDF_COMPRESSION_LEVELS[l].labelBn, en: PDF_COMPRESSION_LEVELS[l].labelEn })}
              </button>
            ))}
          </div>
          <p style={noteStyle}>
            {level === 'light'
              ? t({ bn: 'হালকা: ছবির মান প্রায় একই থাকে, আকার কম কমে।', en: 'Light: image quality stays near-original, size drops a little.' })
              : level === 'strong'
                ? t({ bn: 'শক্তিশালী: ছবি ছোট ও নিম্নমানের হয়, আকার সবচেয়ে বেশি কমে।', en: 'Strong: images get smaller and lower quality, size drops the most.' })
                : t({ bn: 'মাঝারি: মান ও আকারের ভারসাম্য — ডিফল্ট।', en: 'Balanced: a balance of quality and size — the default.' })}
          </p>
        </div>
        <div>
          <label style={labelStyle} htmlFor="pdf-compress-quality">
            {t({ bn: 'ছবির মান: ', en: 'Image quality: ' })}
            {quality}%
          </label>
          <input
            id="pdf-compress-quality"
            style={{ ...inputStyle, padding: '10px 0' }}
            type="range"
            min="10"
            max="95"
            value={quality}
            onChange={(e) => { setQuality(Number(e.target.value)); setPreset('custom'); }}
          />
          <p style={noteStyle}>
            {t({ bn: 'কম মান হলে ছবি ঝাপসা হতে পারে, তবে ফাইল অনেক ছোট হয়।', en: 'Lower quality can blur images, but the file gets much smaller.' })}
          </p>
        </div>
        <div>
          <label style={labelStyle} htmlFor="pdf-compress-dpi">
            {t({ bn: 'ছবির সর্বোচ্চ রেজোলিউশন (DPI)', en: 'Max image resolution (DPI)' })}
          </label>
          <select
            id="pdf-compress-dpi"
            style={inputStyle}
            value={maxDpi}
            onChange={(e) => { setMaxDpi(Number(e.target.value)); setPreset('custom'); }}
          >
            <option value={72}>72 DPI — {t({ bn: 'স্ক্রিনের জন্য', en: 'for screens' })}</option>
            <option value={150}>150 DPI — {t({ bn: 'ওয়েবের জন্য', en: 'for web' })}</option>
            <option value={300}>300 DPI — {t({ bn: 'প্রিন্টের জন্য', en: 'for print' })}</option>
          </select>
          <p style={noteStyle}>
            {t({ bn: 'এর চেয়ে বড় ছবি ছোট করা হয়; ছোট ছবি বড় করা হয় না।', en: 'Larger images are shrunk to this; smaller images are never enlarged.' })}
          </p>
        </div>
        <div>
          <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 15, fontWeight: 600, color: 'var(--heading)' }}>
            <input
              type="checkbox"
              checked={targetEnabled}
              onChange={(e) => setTargetEnabled(e.target.checked)}
            />
            {t({ bn: 'লক্ষ্য আকারের নিচে নামান', en: 'Compress to under a target size' })}
          </label>
          {targetEnabled ? (
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <input
                style={inputStyle}
                type="number"
                min="1"
                inputMode="decimal"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                placeholder="500"
                aria-label={t({ bn: 'লক্ষ্য আকার', en: 'Target size' })}
              />
              <select
                style={{ ...inputStyle, maxWidth: 110 }}
                value={targetUnit}
                onChange={(e) => setTargetUnit(e.target.value as 'KB' | 'MB')}
                aria-label={t({ bn: 'একক', en: 'Unit' })}
              >
                <option value="KB">KB</option>
                <option value="MB">MB</option>
              </select>
            </div>
          ) : null}
          <p style={noteStyle}>
            {t({ bn: 'লক্ষ্য দিলে টুলটি মান ধাপে ধাপে কমিয়ে লক্ষ্যে পৌঁছানোর চেষ্টা করে। না পারলে সবচেয়ে ছোট সংস্করণটি দেয় ও জানিয়ে দেয়।', en: 'With a target, the tool steps the quality down to try to hit it. If it cannot, it gives the smallest version and says so.' })}
          </p>
        </div>
      </div>
      <div style={{ marginTop: 14 }}>
        <Button onClick={() => void handleCompress()} loading={busy} disabled={!file}>
          {t({ bn: 'ছোট করুন', en: 'Compress PDF' })}
        </Button>
      </div>
      {error ? (
        <p style={errorStyle} role="alert">
          {error === 'not-pdf'
            ? t({ bn: 'শুধু পিডিএফ ফাইল চলবে — একটি .pdf ফাইল বাছুন।', en: 'Only PDF files work — choose a .pdf file.' })
            : t({ bn: 'এই ফাইলটি পিডিএফ হিসেবে পড়া যায়নি — ফাইলটি নষ্ট বা পিডিএফ নয়।', en: 'This file could not be read as a PDF — it may be corrupt or not a PDF.' })}
        </p>
      ) : null}
      {resultUrl ? (
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
            {savedPercent > 0
              ? t({ bn: 'সাশ্রয়: ', en: 'Saved: ' }) + `${savedPercent}%`
              : t({
                  bn: 'এই ফাইলটি আর ছোট করা যায়নি — এটি আগেই যতটা ছোট হওয়া যায় ততটাই ছোট। শক্তিশালী (Strong) লেভেল বা কম ছবির মান দিয়ে আবার চেষ্টা করতে পারেন।',
                  en: 'Nothing more could be saved — this file is already as small as it can be. You can try again with the Strong level or a lower image quality.',
                })}
          </p>
          {targetMet === false && targetBytes !== null ? (
            <p style={{ margin: '0 0 6px', fontSize: 15, color: 'var(--danger, #b42318)' }}>
              {t({
                bn: `লক্ষ্য আকার ${fmtBytes(targetBytes)}-এর নিচে নামানো যায়নি — ${fmtBytes(newBytes)} পাওয়া গেছে, এটাই সবচেয়ে ছোট সংস্করণ।`,
                en: `The target size of ${fmtBytes(targetBytes)} could not be reached — ${fmtBytes(newBytes)} is the smallest version we could make.`,
              })}
            </p>
          ) : null}
          {targetMet === true && targetBytes !== null ? (
            <p style={{ margin: '0 0 6px', fontSize: 15 }}>
              {t({
                bn: `লক্ষ্য আকার ${fmtBytes(targetBytes)} অর্জিত হয়েছে।`,
                en: `Target size of ${fmtBytes(targetBytes)} reached.`,
              })}
            </p>
          ) : null}
          {imagesProcessed > 0 || imagesSkipped > 0 ? (
            <p style={{ margin: '0 0 6px', fontSize: 14, color: 'var(--muted)' }}>
              {t({
                bn: `${imagesProcessed}টি ছবি ছোট করা হয়েছে${imagesSkipped > 0 ? `, ${imagesSkipped}টি ছবি এড়িয়ে যাওয়া হয়েছে` : ''}।`,
                en: `${imagesProcessed} image(s) resized${imagesSkipped > 0 ? `, ${imagesSkipped} image(s) skipped` : ''}.`,
              })}
            </p>
          ) : null}
          <a href={resultUrl} download="compressed.pdf" style={downloadStyle}>
            {t({ bn: 'ছোট পিডিএফ ডাউনলোড করুন', en: 'Download the compressed PDF' })}
          </a>
          <p style={noteStyle}>
            {t({
              bn: 'কতটা ছোট হবে তা ফাইলের ওপর নির্ভর করে — কোনো নির্দিষ্ট হার দেওয়ার প্রতিশ্রুতি দেওয়া হয় না।',
              en: 'How much smaller it gets depends on the file — no fixed saving is promised.',
            })}
          </p>
        </div>
      ) : null}
    </section>
  );
}
