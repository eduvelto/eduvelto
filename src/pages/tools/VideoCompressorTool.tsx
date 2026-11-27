// Eduvelto — Video Compressor tool UI (100-Tools Project, second batch).
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// The video never leaves the device: frames are drawn to a canvas and
// re-recorded with MediaRecorder 100% in the browser. The output is
// honestly WebM (MediaRecorder's native format) — never labelled MP4.
// SD (480p) is free; HD (720p) goes through the existing
// RewardedAdButton placeholder (Unlock disabled until AdSense approves).
// Real-browser encode check still owed before ship (Node has no
// MediaRecorder).

import { useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { Button } from '../../components/ui';
import RewardedAdButton from '../../components/RewardedAdButton';
import {
  compressVideo,
  buildCompressedFilename,
  selectPreset,
  type VideoQuality,
} from '../../lib/tools/videoCompressor';
import {
  assertVideoFile,
  formatBytes,
  isMediaRecorderSupported,
  MAX_VIDEO_FILE_BYTES,
} from '../../lib/tools/videoCommon';

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

const previewStyle: CSSProperties = {
  display: 'block',
  maxWidth: '100%',
  maxHeight: 320,
  marginTop: 12,
  borderRadius: 8,
  border: '1px solid var(--line)',
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

/** Big bold headline result (font-head, ~2.5rem). Colour is
 * var(--teal-text) — identical to teal-deep in light mode, but still
 * readable on the dark theme's teal-soft card. */
const headlineStyle: CSSProperties = {
  fontFamily: 'var(--font-head)',
  fontSize: '2.5rem',
  fontWeight: 700,
  color: 'var(--teal-text)',
  margin: 0,
  lineHeight: 1.15,
};

const statGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
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

const copyButtonStyle: CSSProperties = {
  minHeight: 36,
  padding: '6px 12px',
  fontSize: 14,
};

/** Real browser video loading: resolve the actual <video> element. */
function loadRealVideo(file: Blob): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(video);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not decode this video'));
    };
    video.src = url;
  });
}

export function VideoCompressorTool() {
  const { t, lang } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [quality, setQuality] = useState<VideoQuality>('sd');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultName, setResultName] = useState('');
  const [originalBytes, setOriginalBytes] = useState(0);
  const [newBytes, setNewBytes] = useState(0);
  const [savedPercent, setSavedPercent] = useState(0);
  const [resultDims, setResultDims] = useState<{ width: number; height: number } | null>(null);
  const [copied, setCopied] = useState(false);

  async function copySummary(): Promise<void> {
    if (!resultDims) return;
    const summary =
      savedPercent > 0
        ? `${t({ bn: 'আগে: ', en: 'Before: ' })}${formatBytes(originalBytes)} → ${t({ bn: 'পরে: ', en: 'After: ' })}${formatBytes(newBytes)} (${t({ bn: 'সাশ্রয়: ', en: 'Saved: ' })}${savedPercent}%, WebM ${resultDims.width}×${resultDims.height})`
        : `${t({ bn: 'আগে: ', en: 'Before: ' })}${formatBytes(originalBytes)} → ${t({ bn: 'পরে: ', en: 'After: ' })}${formatBytes(newBytes)} (WebM ${resultDims.width}×${resultDims.height})`;
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  const supported = isMediaRecorderSupported();
  const preset = selectPreset(quality);

  function handleFileChange(next: File | null): void {
    setResultUrl(null);
    setResultDims(null);
    setError(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (!next) {
      setFile(null);
      return;
    }
    try {
      assertVideoFile(next);
    } catch (e) {
      setFile(null);
      setError(e instanceof Error && /too large/.test(e.message) ? 'too-large' : 'not-video');
      return;
    }
    setFile(next);
    setPreviewUrl(URL.createObjectURL(next));
  }

  async function handleCompress(): Promise<void> {
    if (!file || busy) return;
    setBusy(true);
    setError(null);
    setResultUrl(null);
    setResultDims(null);
    try {
      const result = await compressVideo(file, quality, { loadVideo: loadRealVideo });
      setOriginalBytes(result.originalBytes);
      setNewBytes(result.newBytes);
      setSavedPercent(result.savedPercent);
      setResultDims({ width: result.width, height: result.height });
      setResultName(buildCompressedFilename(file.name, quality));
      setResultUrl(URL.createObjectURL(result.blob));
    } catch {
      setError('failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="video-compressor-title">
      <div style={heroStyle}>
        <h2 id="video-compressor-title" style={{ fontSize: 22, color: '#fff', margin: '0 0 4px', fontFamily: 'var(--font-head)' }}>
          {t({ bn: 'ভিডিও ছোট করুন', en: 'Compress video' })}
        </h2>
        <p style={{ color: 'rgba(255, 255, 255, 0.92)', fontSize: 14, margin: 0 }}>
          {t({
            bn: 'ভিডিও ছোট করে WebM-এ রূপান্তর করুন। ভিডিও আপনার ডিভাইসেই থাকে, কোথাও আপলোড হয় না। আউটপুট WebM ফাইল হবে।',
            en: 'Shrink a video and convert it to WebM. The video stays on your device and is never uploaded. The output is a WebM file.',
          })}
        </p>
        <span style={trustChipStyle}>
          {t({ bn: '১০০% ব্রাউজারে • কোনো আপলোড নয়', en: '100% in-browser • nothing uploaded' })}
        </span>
      </div>
      {!supported ? (
        <p style={errorStyle} role="alert">
          {t({
            bn: 'এই ব্রাউজারে ভিডিও রেকর্ড করা যায় না (MediaRecorder নেই) — অন্য ব্রাউজার ব্যবহার করুন।',
            en: 'This browser cannot record video (no MediaRecorder) — try a different browser.',
          })}
        </p>
      ) : null}
      <div>
        <label style={labelStyle} htmlFor="video-compress-file">
          {t({ bn: 'ভিডিও ফাইল', en: 'Video file' })}
        </label>
        <input
          id="video-compress-file"
          style={inputStyle}
          type="file"
          accept="video/*"
          onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
        />
        <p style={noteStyle}>
          {t({ bn: 'সর্বোচ্চ ফাইল সাইজ: ', en: 'Maximum file size: ' })}
          {formatBytes(MAX_VIDEO_FILE_BYTES)}
        </p>
      </div>
      {previewUrl ? (
        <video src={previewUrl} controls style={previewStyle} aria-label={t({ bn: 'ভিডিও প্রিভিউ', en: 'Video preview' })} />
      ) : null}
      <fieldset style={{ border: '1px solid var(--line)', borderRadius: 8, marginTop: 14, padding: '12px' }}>
        <legend style={{ fontSize: 14, fontWeight: 600, color: 'var(--heading)' }}>
          {t({ bn: 'মান (quality)', en: 'Quality' })}
        </legend>
        <label style={{ display: 'block', fontSize: 15, color: 'var(--heading)', marginBottom: 8 }}>
          <input
            type="radio"
            name="video-quality"
            value="sd"
            checked={quality === 'sd'}
            onChange={() => setQuality('sd')}
          />{' '}
          {t({ bn: 'SD — 480p, ফ্রি', en: 'SD — 480p, free' })}
        </label>
        <label style={{ display: 'block', fontSize: 15, color: 'var(--heading)' }}>
          <input
            type="radio"
            name="video-quality"
            value="hd"
            checked={quality === 'hd'}
            onChange={() => setQuality('hd')}
          />{' '}
          {t({ bn: 'HD — 720p', en: 'HD — 720p' })}
        </label>
        <p style={noteStyle}>
          {t({
            bn: 'HD-তে বিটরেট বেশি: ',
            en: 'HD uses a higher bitrate: ',
          })}
          {(preset.videoBitsPerSecond / 1_000_000).toFixed(1)}
          {' Mbps · '}
          {t({ bn: 'SD-তে: ', en: 'SD: ' })}
          {(selectPreset('sd').videoBitsPerSecond / 1_000_000).toFixed(1)}
          {' Mbps'}
        </p>
      </fieldset>
      <p style={noteStyle}>
        {t({
          bn: 'কোথায় পাঠাবেন? WhatsApp-এ সাধারণত 16 MB-এর নিচে, Discord-এ 20 MB-এর নিচে আর ইমেইলে 25 MB-এর নিচে রাখতে হয় — ছোট করার পর ফলাফলে আকার দেখে নিন। ছবি নরম মনে হলে আসল ভিডিওটি আবার ছোট করুন, ছোট করা ফাইলটি আর ছোট করবেন না।',
          en: 'Where will you send it? WhatsApp usually needs under 16 MB, Discord under 20 MB and email under 25 MB — check the size in the result below. If the picture looks soft, re-compress the original video instead of compressing the compressed file again.',
        })}
      </p>
      <div style={{ marginTop: 14 }}>
        {quality === 'hd' ? (
          <RewardedAdButton lang={lang} onFreeDownload={() => void handleCompress()} />
        ) : (
          <Button onClick={() => void handleCompress()} loading={busy} disabled={!file || !supported}>
            {t({ bn: 'ছোট করুন', en: 'Compress video' })}
          </Button>
        )}
      </div>
      {error ? (
        <p style={errorStyle} role="alert">
          {error === 'not-video'
            ? t({ bn: 'একটি ভিডিও ফাইল বাছুন (MP4, WebM বা এ জাতীয়)।', en: 'Choose a video file (MP4, WebM or similar).' })
            : error === 'too-large'
              ? t({
                  bn: 'ফাইলটি অনেক বড় — সর্বোচ্চ 200 MB পর্যন্ত ভিডিও নেওয়া হয়।',
                  en: 'The file is too large — videos up to 200 MB are accepted.',
                })
              : t({ bn: 'ভিডিওটি ছোট করা যায়নি — ফাইলটি নষ্ট বা অসমর্থিত ধরনের হতে পারে।', en: 'Could not compress this video — it may be corrupt or in an unsupported format.' })}
        </p>
      ) : null}
      {resultUrl && resultDims ? (
        <div style={resultStyle} role="status">
          <p style={headlineStyle}>
            {savedPercent > 0
              ? `${t({ bn: 'সাশ্রয়: ', en: 'Saved: ' })}${savedPercent}%`
              : t({ bn: 'আর ছোট হয়নি', en: 'No bytes saved' })}
          </p>
          <div style={statGridStyle}>
            <div style={statTileStyle}>
              <p style={statLabelStyle}>{t({ bn: 'আগে', en: 'Before' })}</p>
              <p style={statValueStyle}>{formatBytes(originalBytes)}</p>
            </div>
            <div style={statTileStyle}>
              <p style={statLabelStyle}>{t({ bn: 'পরে', en: 'After' })}</p>
              <p style={statValueStyle}>{formatBytes(newBytes)}</p>
            </div>
            <div style={statTileStyle}>
              <p style={statLabelStyle}>{t({ bn: 'আকার', en: 'Size' })}</p>
              <p style={statValueStyle}>
                {resultDims.width}×{resultDims.height}
              </p>
            </div>
            <div style={statTileStyle}>
              <p style={statLabelStyle}>{t({ bn: 'ধরন', en: 'Format' })}</p>
              <p style={statValueStyle}>WebM</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12, alignItems: 'center' }}>
            <a href={resultUrl} download={resultName} style={{ ...downloadStyle, marginTop: 0 }}>
              {t({ bn: 'ছোট ভিডিও ডাউনলোড করুন (WebM)', en: 'Download the compressed video (WebM)' })}
            </a>
            <button
              type="button"
              className="ev-btn ev-btn-outline"
              style={copyButtonStyle}
              onClick={() => void copySummary()}
            >
              {copied
                ? t({ bn: 'কপি হয়েছে', en: 'Copied' })
                : t({ bn: 'ফলাফল কপি করুন', en: 'Copy result' })}
            </button>
          </div>
          <p style={noteStyle}>
            {t({
              bn: 'কতটা ছোট হবে তা ভিডিওর ওপর নির্ভর করে — কোনো নির্দিষ্ট হার দেওয়ার প্রতিশ্রুতি দেওয়া হয় না।',
              en: 'How much smaller it gets depends on the video — no fixed saving is promised.',
            })}
          </p>
        </div>
      ) : null}
    </section>
  );
}
