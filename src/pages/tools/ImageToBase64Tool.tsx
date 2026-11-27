// Eduvelto — Image to Base64 tool UI (Batch 3, 27 Nov 2026).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Logic in src/lib/tools/imageConvert.ts (fileToDataUrl / dataUrlToBlob).
// File stays on device. Both directions: image -> Base64 text, and
// Base64 text -> image download.

import { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { Button } from '../../components/ui';
import { dataUrlToBlob, fileToDataUrl, looksLikeBase64 } from '../../lib/tools/imageConvert';
import {
  cardStyle, CopyButton, downloadStyle, errorStyle, headlineLabelStyle, headlineStyle,
  heroDescStyle, heroStyle, heroTitleStyle, inputStyle, isOverLimit, labelStyle,
  noteStyle, previewStyle, PrivacyNote, resultStyle, Tile, tileGridStyle, trustChipStyle,
} from './toolShared';

export function ImageToBase64Tool() {
  const { t } = useLanguage();
  const [mode, setMode] = useState<'to-base64' | 'from-base64'>('to-base64');
  const [file, setFile] = useState<File | null>(null);
  const [base64, setBase64] = useState('');
  const [inputText, setInputText] = useState('');
  const [, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backUrl, setBackUrl] = useState<string | null>(null);
  const [backInfo, setBackInfo] = useState<{ type: string; bytes: number } | null>(null);

  async function handleFile(next: File | null): Promise<void> {
    setError(null); setBase64('');
    if (!next) { setFile(null); return; }
    if (!next.type.startsWith('image/')) { setFile(null); setError('not-image'); return; }
    if (isOverLimit(next)) { setFile(null); setError('too-big'); return; }
    setFile(next);
    setBusy(true);
    try {
      setBase64(await fileToDataUrl(next));
    } catch {
      setError('failed');
    } finally {
      setBusy(false);
    }
  }

  function handleDecode(): void {
    setError(null); setBackUrl(null); setBackInfo(null);
    const text = inputText.trim();
    if (!text) { setError('empty'); return; }
    try {
      const dataUrl = text.startsWith('data:') ? text : `data:image/png;base64,${text.replace(/\s/g, '')}`;
      if (!text.startsWith('data:') && !looksLikeBase64(text)) {
        setError('bad-base64');
        return;
      }
      const blob = dataUrlToBlob(dataUrl);
      if (!blob.type.startsWith('image/')) { setError('not-image-out'); return; }
      setBackInfo({ type: blob.type, bytes: blob.size });
      setBackUrl(URL.createObjectURL(blob));
    } catch {
      setError('bad-base64');
    }
  }

  const backExt = backInfo?.type === 'image/png' ? 'png' : backInfo?.type === 'image/webp' ? 'webp' : 'jpg';

  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="image-to-base64-title">
      <div style={heroStyle}>
        <h2 id="image-to-base64-title" style={heroTitleStyle}>{t({ bn: 'ছবি থেকে বেস৬৪', en: 'Image to Base64' })}</h2>
        <p style={heroDescStyle}>{t({ bn: 'ছবিকে Base64 লেখায় রূপান্তর করুন বা Base64 থেকে ছবি ফিরিয়ে আনুন।', en: 'Convert an image to Base64 text, or turn Base64 back into an image.' })}</p>
        <span style={trustChipStyle}>{t({ bn: '✓ আপনার ডিভাইসেই প্রক্রিয়া হয়', en: '✓ Processed on your device' })}</span>
        <span style={trustChipStyle}>{t({ bn: 'দুই দিকেই চলে', en: 'Works both ways' })}</span>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        <button type="button" onClick={() => setMode('to-base64')} aria-pressed={mode === 'to-base64'} style={{ minHeight: 44, padding: '8px 16px', borderRadius: 8, border: mode === 'to-base64' ? '2px solid var(--teal, #0b7285)' : '1px solid var(--line)', background: 'var(--surface)', color: 'var(--heading)', fontWeight: 700, cursor: 'pointer' }}>{t({ bn: 'ছবি → Base64', en: 'Image → Base64' })}</button>
        <button type="button" onClick={() => setMode('from-base64')} aria-pressed={mode === 'from-base64'} style={{ minHeight: 44, padding: '8px 16px', borderRadius: 8, border: mode === 'from-base64' ? '2px solid var(--teal, #0b7285)' : '1px solid var(--line)', background: 'var(--surface)', color: 'var(--heading)', fontWeight: 700, cursor: 'pointer' }}>{t({ bn: 'Base64 → ছবি', en: 'Base64 → Image' })}</button>
      </div>
      {mode === 'to-base64' ? (
        <>
          <div>
            <label style={labelStyle} htmlFor="b64-file">{t({ bn: 'ছবির ফাইল', en: 'Image file' })}</label>
            <input id="b64-file" style={inputStyle} type="file" accept="image/*" onChange={(e) => void handleFile(e.target.files?.[0] ?? null)} />
          </div>
          {base64 ? (
            <div style={resultStyle} role="status">
              <p style={headlineLabelStyle}>{t({ bn: 'Base64 লেখার দৈর্ঘ্য', en: 'Base64 text length' })}</p>
              <p style={headlineStyle}>{base64.length.toLocaleString()} {t({ bn: 'অক্ষর', en: 'characters' })}</p>
              <div style={tileGridStyle}>
                <Tile label={t({ bn: 'মূল ফাইল', en: 'Original file' })} value={file ? `${(file.size / 1024).toFixed(1)} KB` : '—'} />
                <Tile label={t({ bn: 'ধরন', en: 'Type' })} value={file?.type || '—'} />
                <Tile label={t({ bn: 'বড় হয়েছে', en: 'Grew by' })} value={file ? `~${Math.round((base64.length / file.size - 1) * 100)}%` : '—'} />
              </div>
              <textarea readOnly value={base64} rows={6} style={{ ...inputStyle, marginTop: 12, fontFamily: 'monospace', fontSize: 12, wordBreak: 'break-all' }} aria-label={t({ bn: 'Base64 লেখা', en: 'Base64 text' })} />
              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                <CopyButton text={base64} label={t({ bn: 'পুরো লেখা কপি করুন', en: 'Copy full text' })} />
              </div>
              <p style={noteStyle}>{t({ bn: 'Base64 লেখা মূল ফাইলের চেয়ে প্রায় এক-তৃতীয়াংশ বড় হয় — এটি স্বাভাবিক।', en: 'Base64 text is about a third larger than the original file — that is normal.' })}</p>
            </div>
          ) : null}
        </>
      ) : (
        <>
          <div>
            <label style={labelStyle} htmlFor="b64-input">{t({ bn: 'Base64 লেখা বা data URL', en: 'Base64 text or data URL' })}</label>
            <textarea id="b64-input" style={{ ...inputStyle, minHeight: 140, fontFamily: 'monospace', fontSize: 12 }} value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="data:image/png;base64,iVBORw0KGgo…" />
          </div>
          <p style={noteStyle}>{t({ bn: '"data:image/png;base64,..." পুরো লেখা দিলে ভালো; শুধু Base64 অংশ দিলেও চলবে (PNG ধরে নেওয়া হবে)।', en: 'A full "data:image/png;base64,..." string is best; just the Base64 part also works (assumed PNG).' })}</p>
          <div style={{ marginTop: 14 }}>
            <Button onClick={handleDecode}>{t({ bn: 'ছবিতে ফেরান', en: 'Turn back into image' })}</Button>
          </div>
          {backUrl && backInfo ? (
            <div style={resultStyle} role="status">
              <p style={headlineLabelStyle}>{t({ bn: 'ফেরানো ছবি', en: 'Recovered image' })}</p>
              <p style={headlineStyle}>{backInfo.type}</p>
              <div style={tileGridStyle}>
                <Tile label={t({ bn: 'ধরন', en: 'Type' })} value={backInfo.type} />
                <Tile label={t({ bn: 'আকার', en: 'Size' })} value={`${(backInfo.bytes / 1024).toFixed(1)} KB`} />
              </div>
              <img src={backUrl} alt={t({ bn: 'Base64 থেকে ফেরানো ছবি', en: 'Image recovered from Base64' })} style={previewStyle} />
              <a href={backUrl} download={`recovered.${backExt}`} style={downloadStyle}>{t({ bn: 'ছবি ডাউনলোড করুন', en: 'Download the image' })}</a>
            </div>
          ) : null}
        </>
      )}
      <PrivacyNote />
      {error ? (
        <p style={errorStyle} role="alert">
          {error === 'not-image' ? t({ bn: 'একটি ছবির ফাইল বাছুন (JPG, PNG, WebP বা এ জাতীয়)।', en: 'Choose an image file (JPG, PNG, WebP or similar).' })
            : error === 'too-big' ? t({ bn: 'ফাইলটি ১০ MB-এর বেশি — ছোট ফাইল বাছুন।', en: 'The file is over 10 MB — choose a smaller file.' })
            : error === 'empty' ? t({ bn: 'Base64 লেখা খালি — লেখা বসান।', en: 'The Base64 text is empty — paste some text.' })
            : error === 'bad-base64' ? t({ bn: 'এটি সঠিক Base64 লেখা মনে হচ্ছে না — লেখাটি ঠিক আছে কি না দেখুন।', en: 'This does not look like valid Base64 — please check the text.' })
            : error === 'not-image-out' ? t({ bn: 'এই Base64 লেখাটি ছবির নয় — ছবির data URL দিন।', en: 'This Base64 text is not an image — give an image data URL.' })
            : t({ bn: 'রূপান্তর করা যায়নি — আবার চেষ্টা করুন।', en: 'Could not convert — please try again.' })}
        </p>
      ) : null}
    </section>
  );
}
