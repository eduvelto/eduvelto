// Eduvelto — Video to Audio tool UI (100-Tools Project, second batch).
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// The video's audio track is decoded with the Web Audio API and encoded
// to WAV with a hand-written encoder, 100% in the browser; the file
// never leaves the device. The output is honestly WAV audio — MP3 is
// not possible without an encoder library, and none is added, so the
// UI never promises it. Real-browser decode check still owed before
// ship (Node has no AudioContext).

import { useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { Button } from '../../components/ui';
import {
  extractAudioToWav,
  buildAudioFilename,
  isWebAudioSupported,
} from '../../lib/tools/videoToAudio';
import {
  assertVideoFile,
  formatBytes,
  formatSeconds,
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
};

const copyButtonStyle: CSSProperties = {
  minHeight: 36,
  padding: '6px 12px',
  fontSize: 14,
};

export function VideoToAudioTool() {
  const { t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultName, setResultName] = useState('');
  const [audioInfo, setAudioInfo] = useState<{
    sampleRate: number;
    numberOfChannels: number;
    duration: number;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  async function copySummary(): Promise<void> {
    if (!audioInfo) return;
    const channels =
      audioInfo.numberOfChannels === 1
        ? t({ bn: 'মনো', en: 'Mono' })
        : audioInfo.numberOfChannels === 2
          ? t({ bn: 'স্টেরিও', en: 'Stereo' })
          : `${audioInfo.numberOfChannels} ${t({ bn: 'চ্যানেল', en: 'channels' })}`;
    const summary = `${t({ bn: 'অডিও তৈরি হয়েছে — ধরন: WAV', en: 'Audio ready — format: WAV' })} (${t({ bn: 'দৈর্ঘ্য: ', en: 'Length: ' })}${formatSeconds(audioInfo.duration)}, ${audioInfo.sampleRate} Hz, ${channels})`;
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  const supported = isWebAudioSupported();

  function handleFileChange(next: File | null): void {
    setResultUrl(null);
    setAudioInfo(null);
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

  async function handleExtract(): Promise<void> {
    if (!file || busy) return;
    setBusy(true);
    setError(null);
    setResultUrl(null);
    setAudioInfo(null);
    try {
      const result = await extractAudioToWav(file);
      setAudioInfo({
        sampleRate: result.sampleRate,
        numberOfChannels: result.numberOfChannels,
        duration: result.duration,
      });
      setResultName(buildAudioFilename(file.name));
      setResultUrl(URL.createObjectURL(result.blob));
    } catch {
      setError('failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="video-to-audio-title">
      <div style={heroStyle}>
        <h2 id="video-to-audio-title" style={{ fontSize: 22, color: '#fff', margin: '0 0 4px', fontFamily: 'var(--font-head)' }}>
          {t({ bn: 'ভিডিও থেকে অডিও নিন', en: 'Extract audio from video' })}
        </h2>
        <p style={{ color: 'rgba(255, 255, 255, 0.92)', fontSize: 14, margin: 0 }}>
          {t({
            bn: 'ভিডিওর সাউন্ড আলাদা করে WAV অডিও ফাইল হিসেবে নামান। ভিডিও আপনার ডিভাইসেই থাকে, কোথাও আপলোড হয় না। আউটপুট WAV ফাইল হবে।',
            en: 'Take the sound out of a video and download it as a WAV audio file. The video stays on your device and is never uploaded. The output is a WAV file.',
          })}
        </p>
        <span style={trustChipStyle}>
          {t({ bn: '১০০% ব্রাউজারে • কোনো আপলোড নয়', en: '100% in-browser • nothing uploaded' })}
        </span>
      </div>
      <p style={noteStyle}>
        {t({
          bn: 'শুধু নিজের বানানো, বা ব্যবহারের অধিকার আছে এমন ভিডিও থেকেই অডিও নিন। WAV হলো কম্প্রেশন ছাড়া পূর্ণ মানের অডিও — ফাইলটি বড় হবে, তবে সাউন্ডের মান একদম ঠিক থাকবে।',
          en: 'Only convert videos you made or have the right to use. WAV is uncompressed, full-quality audio — the file will be larger, but the sound quality stays exactly as it was.',
        })}
      </p>
      {!supported ? (
        <p style={errorStyle} role="alert">
          {t({
            bn: 'এই ব্রাউজারে অডিও ডিকোড করা যায় না (Web Audio নেই) — অন্য ব্রাউজার ব্যবহার করুন।',
            en: 'This browser cannot decode audio (no Web Audio) — try a different browser.',
          })}
        </p>
      ) : null}
      <div>
        <label style={labelStyle} htmlFor="video-to-audio-file">
          {t({ bn: 'ভিডিও ফাইল', en: 'Video file' })}
        </label>
        <input
          id="video-to-audio-file"
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
        <Button onClick={() => void handleExtract()} loading={busy} disabled={!file || !supported}>
          {t({ bn: 'অডিও বের করুন (WAV)', en: 'Extract audio (WAV)' })}
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
              : t({
                  bn: 'অডিও বের করা যায়নি — ভিডিওতে কোনো সাউন্ড নাও থাকতে পারে, বা এই ব্রাউজারে এই ধরনটি সমর্থিত নয়।',
                  en: 'Could not extract the audio — the video may have no sound track, or this format is not supported in this browser.',
                })}
        </p>
      ) : null}
      {resultUrl && audioInfo ? (
        <div style={resultStyle} role="status">
          <p style={headlineStyle}>
            {t({ bn: 'অডিও তৈরি হয়েছে — WAV', en: 'Audio ready — WAV' })}
          </p>
          <div style={statGridStyle}>
            <div style={statTileStyle}>
              <p style={statLabelStyle}>{t({ bn: 'দৈর্ঘ্য', en: 'Length' })}</p>
              <p style={statValueStyle}>{formatSeconds(audioInfo.duration)}</p>
            </div>
            <div style={statTileStyle}>
              <p style={statLabelStyle}>{t({ bn: 'স্যাম্পল রেট', en: 'Sample rate' })}</p>
              <p style={statValueStyle}>{audioInfo.sampleRate} Hz</p>
            </div>
            <div style={statTileStyle}>
              <p style={statLabelStyle}>{t({ bn: 'চ্যানেল', en: 'Channels' })}</p>
              <p style={statValueStyle}>
                {audioInfo.numberOfChannels === 1
                  ? t({ bn: 'মনো', en: 'Mono' })
                  : audioInfo.numberOfChannels === 2
                    ? t({ bn: 'স্টেরিও', en: 'Stereo' })
                    : `${audioInfo.numberOfChannels}`}
              </p>
            </div>
            <div style={statTileStyle}>
              <p style={statLabelStyle}>{t({ bn: 'ধরন', en: 'Format' })}</p>
              <p style={statValueStyle}>WAV</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12, alignItems: 'center' }}>
            <a href={resultUrl} download={resultName} style={{ ...downloadStyle, marginTop: 0 }}>
              {t({ bn: 'অডিও ডাউনলোড করুন (WAV)', en: 'Download the audio (WAV)' })}
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
