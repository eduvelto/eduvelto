// Eduvelto — Image to Text (OCR) Multi-Language Extractor tool UI (28 Nov 2026, global batch item 2).
//
// tesseract.js is loaded with a LAZY dynamic import() only inside this
// tool, and OCR language data loads ON DEMAND per language at runtime
// (never bundled). Supported: English, Bangla, Hindi, Arabic, Spanish,
// and English+Bangla together. Large images are downscaled in the
// browser before OCR. If OCR fails, the tool says why plainly.
import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { Tiles, ToolSection, gridStyle, inputStyle, labelStyle, noteStyle, resultStyle, errorStyle } from './eduToolUi';
import RewardedAdButton from '../../components/RewardedAdButton';

const LANGUAGES = [
  { code: 'eng', bn: 'ইংরেজি', en: 'English' },
  { code: 'ben', bn: 'বাংলা', en: 'Bangla' },
  { code: 'hin', bn: 'হিন্দি', en: 'Hindi' },
  { code: 'ara', bn: 'আরবি', en: 'Arabic' },
  { code: 'spa', bn: 'স্প্যানিশ', en: 'Spanish' },
  { code: 'eng+ben', bn: 'ইংরেজি + বাংলা', en: 'English + Bangla' },
] as const;

const MAX_DIM = 2000;

async function downscaleImage(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const im = new Image();
      im.onload = () => resolve(im);
      im.onerror = () => reject(new Error('image-load'));
      im.src = url;
    });
    const scale = Math.min(1, MAX_DIM / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/png');
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function ImageToTextOcrTool() {
  const { t, lang } = useLanguage();
  const [langCode, setLangCode] = useState<string>('eng');
  const [fileName, setFileName] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [imageDataUrl, setImageDataUrl] = useState('');
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [text, setText] = useState('');
  const [txtUrl, setTxtUrl] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const workerRef = useRef<{ terminate: () => Promise<unknown> } | null>(null);
  const downloadRef = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => () => {
    void workerRef.current?.terminate().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!text) { setTxtUrl(''); return; }
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    setTxtUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [text]);

  async function onFile(file: File | undefined) {
    setError('');
    setText('');
    setProgress(0);
    setStatus('');
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError(t({ bn: 'শুধু ছবির ফাইল দিন (JPG, PNG ইত্যাদি)।', en: 'Please choose an image file (JPG, PNG, etc.).' }));
      return;
    }
    try {
      const dataUrl = await downscaleImage(file);
      setImageDataUrl(dataUrl);
      setPreviewUrl(dataUrl);
      setFileName(file.name);
    } catch {
      setError(t({ bn: 'ছবিটি পড়া যায়নি। অন্য একটি ছবি দিয়ে চেষ্টা করুন।', en: 'This image could not be read. Try a different image.' }));
    }
  }

  async function runOcr() {
    if (!imageDataUrl || running) return;
    setRunning(true);
    setError('');
    setText('');
    setProgress(0);
    setStatus(t({ bn: 'শুরু হচ্ছে…', en: 'Starting…' }));
    try {
      const { createWorker } = await import('tesseract.js');
      setStatus(t({ bn: 'ভাষার ডেটা নামানো হচ্ছে… (প্রথমবার ইন্টারনেট লাগবে)', en: 'Loading language data… (needs internet the first time)' }));
      const worker = await createWorker(langCode, undefined, {
        logger: (m: { status: string; progress: number }) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round((m.progress || 0) * 100));
            setStatus(t({ bn: 'লেখা পড়া হচ্ছে…', en: 'Reading text…' }));
          } else if (m.status) {
            setStatus(m.status);
          }
        },
      });
      workerRef.current = worker;
      const { data } = await worker.recognize(imageDataUrl);
      const out = (data.text || '').trim();
      setText(out);
      if (!out) {
        setError(t({ bn: 'ছবিতে পড়ার মতো লেখা পাওয়া যায়নি। ঝাপসা বা হাতের লেখা ছবিতে OCR কাজ নাও করতে পারে — পরিষ্কার, ছাপা লেখার ছবি দিন।', en: 'No readable text was found in the image. OCR may not work on blurry or handwritten images — try a clear photo of printed text.' }));
      }
      await worker.terminate();
      workerRef.current = null;
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      setError(t({
        bn: `OCR চালানো যায়নি। ${/network|fetch|load|Failed to fetch/i.test(msg) ? 'ভাষার ডেটা নামাতে ইন্টারনেট লাগবে — সংযোগ দেখে আবার চেষ্টা করুন।' : 'আবার চেষ্টা করুন; সমস্যা থাকলে অন্য ছবি বা ভাষা দিয়ে দেখুন।'}`,
        en: `OCR could not run. ${/network|fetch|load|Failed to fetch/i.test(msg) ? 'Language data needs the internet to download — check your connection and try again.' : 'Please try again; if it persists, try another image or language.'}`,
      }));
    } finally {
      setRunning(false);
      setStatus('');
    }
  }

  async function copyText() {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError(t({ bn: 'কপি করা যায়নি — লেখাটি নিজে সিলেক্ট করে কপি করুন।', en: 'Copy failed — select the text yourself and copy it.' }));
    }
  }

  const wordCount = text ? text.split(/\s+/).filter(Boolean).length : 0;

  return (
    <ToolSection id="image-to-text-ocr-title" titleBn="ছবি থেকে লেখা (OCR)" titleEn="Image to Text (OCR)"
      descBn="ছবির ছাপা লেখা পড়ে টেক্সট বানান — ইংরেজি, বাংলা, হিন্দি, আরবি, স্প্যানিশ। ভাষার ডেটা শুধু যখন লাগে তখনই নামে।"
      descEn="Read printed text from an image — English, Bangla, Hindi, Arabic, Spanish. Language data downloads only when needed.">
      <div style={gridStyle}>
        <div>
          <label style={labelStyle} htmlFor="ocr-lang">{t({ bn: 'ছবির লেখার ভাষা', en: 'Language of the text in the image' })}</label>
          <select id="ocr-lang" style={inputStyle} value={langCode} onChange={(e) => setLangCode(e.target.value)}>
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>{lang === 'bn' ? l.bn : l.en}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle} htmlFor="ocr-file">{t({ bn: 'ছবি আপলোড করুন', en: 'Upload an image' })}</label>
          <input id="ocr-file" style={inputStyle} type="file" accept="image/*"
            onChange={(e) => void onFile(e.target.files?.[0])} />
        </div>
      </div>
      {previewUrl ? (
        <div style={{ marginTop: 12 }}>
          <img src={previewUrl} alt={fileName} style={{ maxWidth: '100%', maxHeight: 320, borderRadius: 8, border: '1px solid var(--line)' }} />
          <p style={noteStyle}>{fileName} — {t({ bn: 'বড় ছবি OCR-এর আগে ২০০০ পিক্সেলে ছোট করা হয়।', en: 'Large images are downscaled to 2000 px before OCR.' })}</p>
        </div>
      ) : null}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
        <button type="button" className="ev-btn ev-btn-primary" style={{ minHeight: 44 }}
          onClick={() => void runOcr()} disabled={!imageDataUrl || running}>
          {running ? t({ bn: 'পড়া হচ্ছে…', en: 'Reading…' }) : t({ bn: 'লেখা বের করুন', en: 'Extract text' })}
        </button>
      </div>
      {running ? (
        <div style={{ marginTop: 12 }} role="status">
          <p style={{ margin: '0 0 6px' }}>{status} {progress > 0 ? `${progress}%` : ''}</p>
          <div style={{ height: 8, borderRadius: 4, background: 'var(--line)', overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: 'var(--teal-deep)' }} />
          </div>
        </div>
      ) : null}
      {error ? <p style={errorStyle} role="alert">{error}</p> : null}
      {text ? (
        <div style={resultStyle}>
          <Tiles items={[
            { label: t({ bn: 'অক্ষর', en: 'Characters' }), value: String(text.length) },
            { label: t({ bn: 'শব্দ', en: 'Words' }), value: String(wordCount) },
          ]} />
          <label style={{ ...labelStyle, marginTop: 10 }} htmlFor="ocr-result">{t({ bn: 'পাওয়া লেখা', en: 'Extracted text' })}</label>
          <textarea id="ocr-result" readOnly value={text} rows={10}
            style={{ ...inputStyle, minHeight: 160, resize: 'vertical', fontFamily: 'inherit' }} />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
            <button type="button" className="ev-btn ev-btn-outline" style={{ minHeight: 44 }} onClick={() => void copyText()}>
              {copied ? t({ bn: '✓ কপি হয়েছে', en: '✓ Copied' }) : t({ bn: 'কপি করুন', en: 'Copy text' })}
            </button>
            <a ref={downloadRef} href={txtUrl}
              download="extracted-text.txt" style={{ display: 'none' }} aria-hidden="true" tabIndex={-1} />
            {/* Ads rollout: a .txt export is a light output (15s rewarded unlock; free download live, never a fake timer). */}
            <RewardedAdButton lang={lang} durationSeconds={15} onFreeDownload={() => downloadRef.current?.click()} />
          </div>
          <p style={noteStyle}>{t({ bn: 'সীমা: হাতের লেখা, ঝাপসা ছবি বা বাঁকা লেখায় ভুল হতে পারে — ফলাফল মিলিয়ে নিন। ছবি কোথাও আপলোড হয়নি।', en: 'Limits: handwriting, blurry photos or skewed text can give errors — check the result. The image was never uploaded.' })}</p>
        </div>
      ) : null}
    </ToolSection>
  );
}
