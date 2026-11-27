// Eduvelto — Video Trimmer tool UI (100-Tools Project, second batch).
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// The user picks start/end seconds; the video is seeked to the start,
// its stream is captured and recorded with MediaRecorder until the end.
// The video never leaves the device. The trimmed clip is honestly
// WebM (MediaRecorder's native format) — never labelled MP4.
// Real-browser trim check still owed before ship (Node has no
// MediaRecorder).

import { useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { Button } from '../../components/ui';
import {
  trimVideo,
  validateTrimRange,
  buildTrimmedFilename,
} from '../../lib/tools/videoTrimmer';
import {
  assertVideoFile,
  formatBytes,
  formatSeconds,
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

export function VideoTrimmerTool() {
  const { t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [start, setStart] = useState('0');
  const [end, setEnd] = useState('10');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultName, setResultName] = useState('');
  const [trimmedSeconds, setTrimmedSeconds] = useState(0);
  const [copied, setCopied] = useState(false);

  async function copySummary(): Promise<void> {
    const summary = `${t({ bn: 'কাটা অংশের দৈর্ঘ্য: ', en: 'Trimmed clip length: ' })}${formatSeconds(trimmedSeconds)} (${formatSeconds(Number(start))} – ${formatSeconds(Number(end))}, WebM)`;
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  const supported = isMediaRecorderSupported();
  const startNum = Number(start);
  const endNum = Number(end);
  const rangeInvalid =
    duration !== null &&
    Number.isFinite(startNum) &&
    Number.isFinite(endNum) &&
    !(startNum >= 0 && endNum <= duration && startNum < endNum);

  function handleFileChange(next: File | null): void {
    setResultUrl(null);
    setError(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setDuration(null);
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
    const url = URL.createObjectURL(next);
    setPreviewUrl(url);
    // Read the real duration with a separate object URL so revoking it
    // after metadata loads cannot break the preview element.
    const probeUrl = URL.createObjectURL(next);
    const probe = document.createElement('video');
    probe.preload = 'metadata';
    probe.onloadedmetadata = () => {
      setDuration(probe.duration);
      setStart('0');
      setEnd(String(Math.min(10, Math.floor(probe.duration))));
      URL.revokeObjectURL(probeUrl);
    };
    probe.onerror = () => {
      setError('failed');
      URL.revokeObjectURL(probeUrl);
    };
    probe.src = probeUrl;
  }

  async function handleTrim(): Promise<void> {
    if (!file || busy || duration === null) return;
    setBusy(true);
    setError(null);
    setResultUrl(null);
    try {
      const range = validateTrimRange(Number(start), Number(end), duration);
      const result = await trimVideo(file, range.start, range.end, { loadVideo: loadRealVideo });
      setTrimmedSeconds(result.trimmedSeconds);
      setResultName(buildTrimmedFilename(file.name));
      setResultUrl(URL.createObjectURL(result.blob));
    } catch {
      setError('failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="video-trimmer-title">
      <div style={heroStyle}>
        <h2 id="video-trimmer-title" style={{ fontSize: 22, color: '#fff', margin: '0 0 4px', fontFamily: 'var(--font-head)' }}>
          {t({ bn: 'ভিডিও কাটুন', en: 'Trim video' })}
        </h2>
        <p style={{ color: 'rgba(255, 255, 255, 0.92)', fontSize: 14, margin: 0 }}>
          {t({
            bn: 'ভিডিওর শুরুর ও শেষের সময় বাছুন — শুধু ওই অংশটুকু WebM ফাইল হিসেবে নামবে। ভিডিও আপনার ডিভাইসেই থাকে, কোথাও আপলোড হয় না।',
            en: 'Pick the start and end time — only that part downloads as a WebM file. The video stays on your device and is never uploaded.',
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
        <label style={labelStyle} htmlFor="video-trim-file">
          {t({ bn: 'ভিডিও ফাইল', en: 'Video file' })}
        </label>
        <input
          id="video-trim-file"
          style={inputStyle}
          type="file"
          accept="video/*"
          onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
        />
        <p style={noteStyle}>
          {t({ bn: 'সর্বোচ্চ ফাইল সাইজ: ', en: 'Maximum file size: ' })}
          {formatBytes(MAX_VIDEO_FILE_BYTES)}
          {duration !== null
            ? ` · ${t({ bn: 'ভিডিওর দৈর্ঘ্য: ', en: 'Video length: ' })}${formatSeconds(duration)}`
            : ''}
        </p>
      </div>
      {previewUrl ? (
        <video src={previewUrl} controls style={previewStyle} aria-label={t({ bn: 'ভিডিও প্রিভিউ', en: 'Video preview' })} />
      ) : null}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginTop: 14 }}>
        <div>
          <label style={labelStyle} htmlFor="video-trim-start">
            {t({ bn: 'শুরু (সেকেন্ড): ', en: 'Start (seconds): ' })}
            {Number.isFinite(startNum) ? formatSeconds(startNum) : '—'}
          </label>
          <input
            id="video-trim-start"
            style={inputStyle}
            type="number"
            min="0"
            max={duration ?? 0}
            step="0.1"
            inputMode="decimal"
            value={start}
            disabled={duration === null}
            onChange={(e) => setStart(e.target.value)}
          />
          <input
            id="video-trim-start-range"
            style={{ ...inputStyle, padding: '10px 12px', marginTop: 8 }}
            type="range"
            min="0"
            max={duration ?? 0}
            step="0.1"
            value={Number.isFinite(startNum) ? Math.min(startNum, duration ?? 0) : 0}
            disabled={duration === null}
            onChange={(e) => setStart(e.target.value)}
            aria-label={t({ bn: 'শুরুর সময় স্লাইডার', en: 'Start time slider' })}
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="video-trim-end">
            {t({ bn: 'শেষ (সেকেন্ড): ', en: 'End (seconds): ' })}
            {Number.isFinite(endNum) ? formatSeconds(endNum) : '—'}
          </label>
          <input
            id="video-trim-end"
            style={inputStyle}
            type="number"
            min="0"
            max={duration ?? 0}
            step="0.1"
            inputMode="decimal"
            value={end}
            disabled={duration === null}
            onChange={(e) => setEnd(e.target.value)}
          />
          <input
            id="video-trim-end-range"
            style={{ ...inputStyle, padding: '10px 12px', marginTop: 8 }}
            type="range"
            min="0"
            max={duration ?? 0}
            step="0.1"
            value={Number.isFinite(endNum) ? Math.min(endNum, duration ?? 0) : 0}
            disabled={duration === null}
            onChange={(e) => setEnd(e.target.value)}
            aria-label={t({ bn: 'শেষের সময় স্লাইডার', en: 'End time slider' })}
          />
        </div>
      </div>
      {rangeInvalid ? (
        <p style={errorStyle} role="alert">
          {t({
            bn: 'শুরুর সময় শেষের সময়ের আগে হতে হবে, ভিডিওর দৈর্ঘ্যের ভেতরে।',
            en: 'The start must be before the end, within the video length.',
          })}
        </p>
      ) : null}
      <div style={{ marginTop: 14 }}>
        <Button
          onClick={() => void handleTrim()}
          loading={busy}
          disabled={!file || !supported || duration === null || rangeInvalid}
        >
          {t({ bn: 'কাটুন', en: 'Trim video' })}
        </Button>
      </div>
      <p style={noteStyle}>
        {t({
          bn: 'এই টুলটি বাছা অংশটি আবার রেকর্ড করে কাটে, তাই কাটা অংশটি আপনার দেওয়া শুরুর সময় থেকেই শুরু হয়। বড় ভিডিওতে কাটতে একটু সময় লাগতে পারে, কারণ পুরো অংশটি আবার রেকর্ড করা হয়।',
          en: 'This tool re-records the selected part to cut it, so the clip starts at the start time you chose. Longer clips take a little while, because the whole part is recorded again.',
        })}
      </p>
      <p style={noteStyle}>
        {t({ bn: 'কাটা ভিডিওটি আরও ছোট করতে চাইলে ', en: 'To make the trimmed clip smaller, use the ' })}
        <a href="/tools/video-compressor" style={{ color: 'var(--teal-text)', fontWeight: 600 }}>
          {t({ bn: 'ভিডিও ছোট করার টুল', en: 'video compressor tool' })}
        </a>
        {t({ bn: ' — কাটা ফাইলটি ডাউনলোড করে সেখানে বাছুন।', en: ' — download the trimmed file and pick it there.' })}
      </p>
      {error ? (
        <p style={errorStyle} role="alert">
          {error === 'not-video'
            ? t({ bn: 'একটি ভিডিও ফাইল বাছুন (MP4, WebM বা এ জাতীয়)।', en: 'Choose a video file (MP4, WebM or similar).' })
            : error === 'too-large'
              ? t({
                  bn: 'ফাইলটি অনেক বড় — সর্বোচ্চ 200 MB পর্যন্ত ভিডিও নেওয়া হয়।',
                  en: 'The file is too large — videos up to 200 MB are accepted.',
                })
              : t({ bn: 'ভিডিওটি কাটা যায়নি — ফাইলটি নষ্ট বা অসমর্থিত ধরনের হতে পারে।', en: 'Could not trim this video — it may be corrupt or in an unsupported format.' })}
        </p>
      ) : null}
      {resultUrl ? (
        <div style={resultStyle} role="status">
          <p style={headlineStyle}>{formatSeconds(trimmedSeconds)}</p>
          <div style={statGridStyle}>
            <div style={statTileStyle}>
              <p style={statLabelStyle}>{t({ bn: 'শুরু', en: 'Start' })}</p>
              <p style={statValueStyle}>{formatSeconds(Number(start))}</p>
            </div>
            <div style={statTileStyle}>
              <p style={statLabelStyle}>{t({ bn: 'শেষ', en: 'End' })}</p>
              <p style={statValueStyle}>{formatSeconds(Number(end))}</p>
            </div>
            <div style={statTileStyle}>
              <p style={statLabelStyle}>{t({ bn: 'ধরন', en: 'Format' })}</p>
              <p style={statValueStyle}>WebM</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12, alignItems: 'center' }}>
            <a href={resultUrl} download={resultName} style={{ ...downloadStyle, marginTop: 0 }}>
              {t({ bn: 'কাটা ভিডিও ডাউনলোড করুন (WebM)', en: 'Download the trimmed video (WebM)' })}
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
