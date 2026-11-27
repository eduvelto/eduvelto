// Eduvelto — QR Code Reader tool UI (landed 27 Nov 2026, A-tools).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Engine: decodeQrFromImageData() + classifyQrText() in src/lib/tools/qrBarcode.ts; jsQR loads via dynamic import() only. Camera is opt-in. 100% in-browser; nothing is uploaded.
import { useRef, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, CopyButton, ButtonRow, inputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { decodeQrFromImageData, classifyQrText } from '../../lib/tools/qrBarcode';

const resultStyle: CSSProperties = {
  marginTop: 14,
  padding: '18px 16px',
  borderRadius: 12,
  background: 'var(--teal-soft)',
  boxShadow: 'var(--shadow-sm)',
};

const errorStyle: CSSProperties = {
  marginTop: 14,
  color: '#b3261e',
  fontSize: 14,
};





export function QrCodeReaderTool() {
  const { t } = useLanguage();
  const [decoded, setDecoded] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimerRef = useRef<number | null>(null);

  function stopCamera(): void {
    if (scanTimerRef.current !== null) { window.clearInterval(scanTimerRef.current); scanTimerRef.current = null; }
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
    setCameraOn(false);
  }

  async function decodeImage(img: HTMLImageElement): Promise<void> {
    setBusy(true);
    setError(null);
    setDecoded(null);
    try {
      const canvas = document.createElement('canvas');
      const scale = Math.min(1, 1200 / Math.max(img.naturalWidth, img.naturalHeight));
      canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas is unavailable');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const text = await decodeQrFromImageData(data);
      if (text) setDecoded(text);
      else setError(t({ bn: 'এই ছবিতে কিউআর কোড পাওয়া যায়নি — পরিষ্কার ছবি দিয়ে আবার চেষ্টা করুন।', en: 'No QR code was found in this image — try a clearer photo.' }));
    } catch {
      setError(t({ bn: 'ছবিটি পড়া যায়নি — ফাইলটি সঠিক ছবি কি না দেখুন।', en: 'Could not read the image — check it is a valid image file.' }));
    } finally {
      setBusy(false);
    }
  }

  async function handleFile(file: File | null): Promise<void> {
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError(t({ bn: 'একটি ছবির ফাইল বাছুন (JPG, PNG, WebP)।', en: 'Choose an image file (JPG, PNG, WebP).' })); return; }
    if (file.size > 10 * 1024 * 1024) { setError(t({ bn: 'ফাইলটি ১০ MB-এর বেশি — ছোট ফাইল বাছুন।', en: 'The file is over 10 MB — choose a smaller file.' })); return; }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    const img = new Image();
    img.onload = () => { void decodeImage(img); };
    img.onerror = () => setError(t({ bn: 'ছবিটি পড়া যায়নি।', en: 'Could not read the image.' }));
    img.src = url;
  }

  async function startCamera(): Promise<void> {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError(t({ bn: 'এই ব্রাউজারে ক্যামেরা চলে না — ছবি আপলোড করে পড়ুন।', en: 'The camera does not work in this browser — upload an image instead.' }));
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      setCameraOn(true);
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play();
        scanTimerRef.current = window.setInterval(() => {
          if (!video.videoWidth) return;
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          ctx.drawImage(video, 0, 0);
          const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
          void decodeQrFromImageData(data).then((text) => {
            if (text) { setDecoded(text); stopCamera(); }
          }).catch(() => { /* keep scanning */ });
        }, 500);
      }
    } catch {
      setError(t({ bn: 'ক্যামেরা খোলা যায়নি — অনুমতি দিন, অথবা ছবি আপলোড করে পড়ুন।', en: 'Could not open the camera — allow permission, or upload an image instead.' }));
    }
  }

  const classified = decoded ? classifyQrText(decoded) : null;

  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="কিউআর কোড রিডার" titleEn="QR Code Reader" descBn="ছবি থেকে কিউআর কোড পড়ুন — ক্যামেরা চাইলে নিজে চালু করুন।" descEn="Read a QR code from a photo — turn the camera on yourself if you want it." chipBn="ক্যামেরার ছবি কোথাও আপলোড হয় না" chipEn="Camera frames are never uploaded" />
      <div>
        <label style={labelStyle} htmlFor="qr-file">{t({ bn: 'কিউআর কোডের ছবি', en: 'Image with a QR code' })}</label>
        <input id="qr-file" style={inputStyle} type="file" accept="image/*" onChange={(e) => void handleFile(e.target.files?.[0] ?? null)} />
      </div>
      <ButtonRow>
        {!cameraOn ? (
          <button type="button" style={{ minHeight: 44, padding: '0 18px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--heading)', fontWeight: 600, cursor: 'pointer' }} onClick={() => void startCamera()}>
            {t({ bn: 'ক্যামেরা দিয়ে স্ক্যান করুন', en: 'Scan with camera' })}
          </button>
        ) : (
          <button type="button" style={{ minHeight: 44, padding: '0 18px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--heading)', fontWeight: 600, cursor: 'pointer' }} onClick={stopCamera}>
            {t({ bn: 'ক্যামেরা বন্ধ করুন', en: 'Stop camera' })}
          </button>
        )}
      </ButtonRow>
      {cameraOn ? (
        <video ref={videoRef} style={{ width: '100%', maxHeight: 360, borderRadius: 12, marginTop: 12, background: '#000' }} playsInline muted />
      ) : null}
      {previewUrl && !cameraOn ? (
        <img src={previewUrl} alt={t({ bn: 'আপলোড করা ছবি', en: 'Uploaded image' })} style={{ maxWidth: '100%', maxHeight: 320, borderRadius: 12, marginTop: 12 }} />
      ) : null}
      {busy ? <p style={noteStyle} role="status">{t({ bn: 'কিউআর কোড খোঁজা হচ্ছে…', en: 'Looking for a QR code…' })}</p> : null}
      {error ? <p style={errorStyle} role="alert">{error}</p> : null}
      {decoded && classified ? (
        <div style={resultStyle} role="status">
          <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{t({ bn: `পাওয়া গেছে: ${classified.label}`, en: `Found: ${classified.label}` })}</p>
          <p style={{ margin: 0, fontSize: 16, wordBreak: 'break-all' }}><strong>{decoded}</strong></p>
          <ButtonRow>
            <CopyButton text={decoded} labelBn="লেখাটি কপি করুন" labelEn="Copy the text" />
            {classified.kind === 'url' ? (
              <a href={decoded} target="_blank" rel="noopener noreferrer" style={{ minHeight: 44, lineHeight: '44px', padding: '0 18px', borderRadius: 8, background: 'var(--teal)', color: '#fff', fontWeight: 700, textDecoration: 'none' }}>{t({ bn: 'লিংক খুলুন', en: 'Open link' })}</a>
            ) : null}
            {classified.kind === 'tel' ? (
              <a href={decoded} style={{ minHeight: 44, lineHeight: '44px', padding: '0 18px', borderRadius: 8, background: 'var(--teal)', color: '#fff', fontWeight: 700, textDecoration: 'none' }}>{t({ bn: 'কল করুন', en: 'Call' })}</a>
            ) : null}
            {classified.kind === 'email' ? (
              <a href={decoded} style={{ minHeight: 44, lineHeight: '44px', padding: '0 18px', borderRadius: 8, background: 'var(--teal)', color: '#fff', fontWeight: 700, textDecoration: 'none' }}>{t({ bn: 'ইমেইল করুন', en: 'Send email' })}</a>
            ) : null}
          </ButtonRow>
          {classified.kind === 'url' ? (
            <p style={{ margin: '10px 0 0', fontSize: 13, color: '#b3261e' }}>{t({ bn: 'খোলার আগে ঠিকানাটি দেখে নিন — কিউআর কোডে ক্ষতিকর লিংক লুকানো থাকতে পারে।', en: 'Check the address before opening — a QR code can hide a harmful link.' })}</p>
          ) : null}
          {classified.kind === 'wifi' ? (
            <p style={{ margin: '10px 0 0', fontSize: 13, color: 'var(--muted)' }}>{t({ bn: 'এটি একটি ওয়াই-ফাই নেটওয়ার্কের তথ্য — এখান থেকে স্বয়ংক্রিয়ভাবে সংযোগ করা হয় না।', en: 'This is Wi-Fi network information — it never connects automatically from here.' })}</p>
          ) : null}
        </div>
      ) : null}
      <p style={noteStyle}>{t({ bn: 'ছবি আপলোড করাই ডিফল্ট উপায়; ক্যামেরা শুধু আপনি চাপ দিলেই চালু হয় এবং টুল বন্ধ করলে বা “বন্ধ করুন” চাপলে থেমে যায়। ঝাপসা বা কম আলোর ছবিতে কোড নাও পড়তে পারে — তখন পরিষ্কার ছবি তুলে আবার চেষ্টা করুন।', en: 'Uploading an image is the default; the camera only starts when you tap it and stops when you close the tool or tap Stop. A blurry or dark photo may not read — retake a clearer photo and try again.' })}</p>
    </section>
  );
}
