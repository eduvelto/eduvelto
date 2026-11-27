// Eduvelto — Video Format Converter tool UI (100-Tools Project, second
// batch).
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// The video is re-encoded with MediaRecorder 100% in the browser; the
// file never leaves the device. WebM is offered everywhere; MP4 is
// offered ONLY where this browser reports it can record it
// (MediaRecorder.isTypeSupported('video/mp4') — Safari supports it,
// Chrome/Firefox generally do not). The supported formats are stated
// BEFORE the user starts, and no fake conversion is ever offered.
// Real-browser re-encode check still owed before ship (Node has no
// MediaRecorder).

import { useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { Button } from '../../components/ui';
import {
  convertVideo,
  detectSupportedFormatsInBrowser,
  buildConvertedFilename,
  type VideoOutputFormat,
} from '../../lib/tools/videoFormatConverter';
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

/** Device preset chips: inactive = white bg + teal border + teal text; active = teal bg + white text. */
const presetChipStyle: CSSProperties = {
  minHeight: 40,
  padding: '8px 14px',
  borderRadius: 999,
  border: '1px solid var(--teal)',
  background: 'var(--card)',
  color: 'var(--teal-text)',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
};

const presetChipActiveStyle: CSSProperties = {
  ...presetChipStyle,
  background: 'var(--teal)',
  borderColor: 'var(--teal)',
  color: '#fff',
};

const headlineStyle: CSSProperties = {
  fontFamily: 'var(--font-head)',
  fontSize: '2rem',
  fontWeight: 700,
  color: 'var(--teal-text)',
  margin: '0 0 4px',
  lineHeight: 1.25,
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
  overflowWrap: 'anywhere',
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

export function VideoFormatConverterTool() {
  const { t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [format, setFormat] = useState<VideoOutputFormat>('webm');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultName, setResultName] = useState('');
  const [resultFormat, setResultFormat] = useState<VideoOutputFormat>('webm');
  const [copied, setCopied] = useState(false);

  // Detected once, at first render: what THIS browser can actually do.
  const [support] = useState(() => detectSupportedFormatsInBrowser());
  const supported = isMediaRecorderSupported();
  const canMp4 = support.supported.some((f) => f.format === 'mp4');
  const canWebm = support.supported.some((f) => f.format === 'webm');

  async function copySummary(): Promise<void> {
    const summary = `${t({ bn: 'রূপান্তর হয়েছে — ধরন: ', en: 'Converted — format: ' })}${resultFormat === 'mp4' ? 'MP4' : 'WebM'} (${resultName})`;
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  function handleFileChange(next: File | null): void {
    setResultUrl(null);
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

  async function handleConvert(): Promise<void> {
    if (!file || busy) return;
    setBusy(true);
    setError(null);
    setResultUrl(null);
    try {
      const result = await convertVideo(file, format, { loadVideo: loadRealVideo });
      setResultFormat(result.format);
      setResultName(buildConvertedFilename(file.name, result.format));
      setResultUrl(URL.createObjectURL(result.blob));
    } catch {
      setError('failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="video-format-converter-title">
      <div style={heroStyle}>
        <h2 id="video-format-converter-title" style={{ fontSize: 22, color: '#fff', margin: '0 0 4px', fontFamily: 'var(--font-head)' }}>
          {t({ bn: 'ভিডিওর ধরন বদলান', en: 'Convert video format' })}
        </h2>
        <p style={{ color: 'rgba(255, 255, 255, 0.92)', fontSize: 14, margin: 0 }}>
          {t({
            bn: 'ভিডিও আবার এনকোড করে WebM বা MP4 করুন। ভিডিও আপনার ডিভাইসেই থাকে, কোথাও আপলোড হয় না।',
            en: 'Re-encode a video to WebM or MP4. The video stays on your device and is never uploaded.',
          })}
        </p>
        <span style={trustChipStyle}>
          {t({ bn: '১০০% ব্রাউজারে • কোনো আপলোড নয়', en: '100% in-browser • nothing uploaded' })}
        </span>
      </div>
      <div style={resultStyle} role="status">
        <p style={{ margin: '0 0 6px', fontSize: 15 }}>
          <strong>
            {t({ bn: 'এই ব্রাউজারে যা করা যায়: ', en: 'What this browser supports: ' })}
          </strong>
          {support.supported.length > 0
            ? support.supported.map((f) => f.label).join(', ')
            : t({ bn: 'কিছুই না — ভিডিও রূপান্তর করা যাবে না', en: 'Nothing — video cannot be converted here' })}
        </p>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>
          {t({
            bn: 'MP4 শুধু সেই ব্রাউজারেই দেখায় যেখানে সেটা রেকর্ড করা যায় (যেমন Safari); Chrome/Firefox-এ সাধারণত শুধু WebM পাওয়া যায়।',
            en: 'MP4 is only offered where the browser can record it (for example Safari); Chrome/Firefox usually offer WebM only.',
          })}
        </p>
      </div>
      {!supported ? (
        <p style={errorStyle} role="alert">
          {t({
            bn: 'এই ব্রাউজারে ভিডিও রেকর্ড করা যায় না (MediaRecorder নেই) — অন্য ব্রাউজার ব্যবহার করুন।',
            en: 'This browser cannot record video (no MediaRecorder) — try a different browser.',
          })}
        </p>
      ) : null}
      <div style={{ marginTop: 14 }}>
        <label style={labelStyle} htmlFor="video-convert-file">
          {t({ bn: 'ভিডিও ফাইল', en: 'Video file' })}
        </label>
        <input
          id="video-convert-file"
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
      <div style={{ marginTop: 14 }}>
        <label style={labelStyle} htmlFor="video-convert-format">
          {t({ bn: 'আউটপুট ধরন', en: 'Output format' })}
        </label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }} role="group" aria-label={t({ bn: 'ডিভাইস অনুযায়ী বাছুন', en: 'Pick by device' })}>
          <button
            type="button"
            style={format === 'mp4' ? presetChipActiveStyle : presetChipStyle}
            aria-pressed={format === 'mp4'}
            disabled={!canMp4}
            onClick={() => setFormat('mp4')}
          >
            {t({ bn: 'আইফোন — MP4', en: 'iPhone — MP4' })}
          </button>
          <button
            type="button"
            style={format === 'webm' ? presetChipActiveStyle : presetChipStyle}
            aria-pressed={format === 'webm'}
            disabled={!canWebm}
            onClick={() => setFormat('webm')}
          >
            {t({ bn: 'অ্যান্ড্রয়েড — WebM', en: 'Android — WebM' })}
          </button>
        </div>
        <select
          id="video-convert-format"
          style={inputStyle}
          value={format}
          disabled={support.supported.length === 0}
          onChange={(e) => setFormat(e.target.value as VideoOutputFormat)}
        >
          {support.supported.map((f) => (
            <option key={f.format} value={f.format}>
              {f.label}
            </option>
          ))}
          {support.supported.length === 0 ? (
            <option value="webm">{t({ bn: 'কোনো ধরন নেই', en: 'No format available' })}</option>
          ) : null}
        </select>
        <p style={noteStyle}>
          {t({
            bn: 'কেন এই দুটি ধরন? WebM ফাইল ছোট হয় আর ব্রাউজারে সরাসরি চলে; MP4 প্রায় সব ফোন, টিভি ও প্লেয়ারে চলে। আপনার ডিভাইসে যেটা চলবে, সেটাই বাছুন।',
            en: 'Why these two formats? WebM files are smaller and play right in the browser; MP4 plays on almost every phone, TV and player. Pick the one that plays on your device.',
          })}
        </p>
      </div>
      <div style={{ marginTop: 14 }}>
        <Button
          onClick={() => void handleConvert()}
          loading={busy}
          disabled={!file || !supported || support.supported.length === 0}
        >
          {t({ bn: 'রূপান্তর করুন', en: 'Convert video' })}
        </Button>
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
              : t({ bn: 'ভিডিওটি রূপান্তর করা যায়নি — ফাইলটি নষ্ট বা অসমর্থিত ধরনের হতে পারে।', en: 'Could not convert this video — it may be corrupt or in an unsupported format.' })}
        </p>
      ) : null}
      {resultUrl ? (
        <div style={resultStyle} role="status">
          <p style={headlineStyle}>
            {t({ bn: 'রূপান্তর হয়েছে — ', en: 'Converted — ' })}
            {resultFormat === 'mp4' ? 'MP4' : 'WebM'}
          </p>
          <div style={statGridStyle}>
            <div style={statTileStyle}>
              <p style={statLabelStyle}>{t({ bn: 'ধরন', en: 'Format' })}</p>
              <p style={statValueStyle}>{resultFormat === 'mp4' ? 'MP4' : 'WebM'}</p>
            </div>
            <div style={statTileStyle}>
              <p style={statLabelStyle}>{t({ bn: 'ফাইলের নাম', en: 'File name' })}</p>
              <p style={statValueStyle}>{resultName}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12, alignItems: 'center' }}>
            <a href={resultUrl} download={resultName} style={{ ...downloadStyle, marginTop: 0 }}>
              {t({
                bn: 'রূপান্তরিত ভিডিও ডাউনলোড করুন',
                en: 'Download the converted video',
              })}
              {resultFormat === 'mp4' ? ' (MP4)' : ' (WebM)'}
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
        </div>
      ) : null}
    </section>
  );
}
