// Eduvelto — Signature Maker & PDF E-Sign tool UI (28 Nov 2026, global batch item 2).
//
// Draw a signature on canvas (mouse + touch) or type to sign, then
// place the signature image onto an uploaded PDF client-side with
// pdf-lib (dynamic import) and download the signed PDF. Everything
// happens in the browser — the PDF is never uploaded.
//
// HONEST LABEL, permanently visible: a drawn signature is NOT a
// certified/legal digital signature.
import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { Tiles, ToolSection, gridStyle, inputStyle, labelStyle, noteStyle, resultStyle, errorStyle } from './eduToolUi';
import RewardedAdButton from '../../components/RewardedAdButton';

type Position = 'bottom-right' | 'bottom-left' | 'bottom-center';

const POSITIONS: Position[] = ['bottom-right', 'bottom-left', 'bottom-center'];

export function SignatureMakerTool() {
  const { t, lang } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const lastRef = useRef<{ x: number; y: number } | null>(null);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [penColor, setPenColor] = useState('#1a1a2e');
  const [penWidth, setPenWidth] = useState(3);
  const [typedName, setTypedName] = useState('');
  const [pdfName, setPdfName] = useState('');
  const [pdfBytes, setPdfBytes] = useState<ArrayBuffer | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [page, setPage] = useState(1);
  const [position, setPosition] = useState<Position>('bottom-right');
  const [signedUrl, setSignedUrl] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const downloadRef = useRef<HTMLAnchorElement | null>(null);

  // White canvas background so the signature PNG is visible on any PDF.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  function canvasPos(e: React.PointerEvent<HTMLCanvasElement>): { x: number; y: number } {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  }

  function startDraw(e: React.PointerEvent<HTMLCanvasElement>) {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    drawingRef.current = true;
    lastRef.current = canvasPos(e);
  }

  function draw(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !lastRef.current) return;
    const pos = canvasPos(e);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(lastRef.current.x, lastRef.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastRef.current = pos;
    setHasDrawn(true);
  }

  function endDraw() {
    drawingRef.current = false;
    lastRef.current = null;
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  }

  function typeToSign() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !typedName.trim()) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = penColor;
    ctx.font = 'italic 64px "Segoe Script", "Brush Script MT", cursive';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(typedName.trim(), canvas.width / 2, canvas.height / 2, canvas.width - 40);
    setHasDrawn(true);
  }

  async function onPdfFile(file: File | undefined) {
    setError('');
    setSignedUrl('');
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError(t({ bn: 'শুধু PDF ফাইল দিন।', en: 'Please choose a PDF file.' }));
      return;
    }
    try {
      const bytes = await file.arrayBuffer();
      const { PDFDocument } = await import('pdf-lib');
      const doc = await PDFDocument.load(bytes);
      setPageCount(doc.getPageCount());
      setPage(1);
      setPdfBytes(bytes);
      setPdfName(file.name);
    } catch {
      setError(t({ bn: 'PDFটি পড়া যায়নি — ফাইলটি ভাঙা বা পাসওয়ার্ড-সুরক্ষিত হতে পারে।', en: 'This PDF could not be read — it may be damaged or password-protected.' }));
      setPdfBytes(null);
    }
  }

  async function signPdf() {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn || !pdfBytes) return;
    setBusy(true);
    setError('');
    try {
      const { PDFDocument } = await import('pdf-lib');
      const doc = await PDFDocument.load(pdfBytes);
      const pages = doc.getPages();
      const target = pages[Math.min(Math.max(page - 1, 0), pages.length - 1)];
      const png = await doc.embedPng(canvas.toDataURL('image/png'));
      const sigW = 180;
      const sigH = (png.height / png.width) * sigW;
      const { width } = target.getSize();
      const margin = 36;
      const x = position === 'bottom-right' ? width - sigW - margin
        : position === 'bottom-left' ? margin
        : (width - sigW) / 2;
      target.drawImage(png, { x, y: margin, width: sigW, height: sigH });
      const out = await doc.save();
      const blob = new Blob([out as unknown as BlobPart], { type: 'application/pdf' });
      if (signedUrl) URL.revokeObjectURL(signedUrl);
      setSignedUrl(URL.createObjectURL(blob));
    } catch {
      setError(t({ bn: 'স্বাক্ষর বসানো যায়নি — আবার চেষ্টা করুন।', en: 'The signature could not be placed — please try again.' }));
    } finally {
      setBusy(false);
    }
  }

  return (
    <ToolSection id="signature-maker-title" titleBn="স্বাক্ষর তৈরি ও পিডিএফ ই-সাইন" titleEn="Signature Maker & PDF E-Sign"
      descBn="আঁকুন বা টাইপ করে স্বাক্ষর বানান, তারপর PDF-এ বসিয়ে ডাউনলোড করুন — সব আপনার ব্রাউজারেই।"
      descEn="Draw or type a signature, place it on a PDF and download — all in your browser.">
      <p style={{ ...noteStyle, fontWeight: 700, color: 'var(--heading)' }}>
        {t({
          bn: 'সৎ সতর্কতা: এটি হাতে আঁকা ছবির স্বাক্ষর — সার্টিফায়েড বা আইনি ডিজিটাল স্বাক্ষর নয়। ব্যাংক, আদালত বা সরকারি কাজে গ্রহণযোগ্য কি না, আগে সংশ্লিষ্ট কর্তৃপক্ষকে জিজ্ঞেস করুন।',
          en: 'Honest warning: this is a drawn picture of a signature — NOT a certified or legal digital signature. Ask the relevant authority first whether it is acceptable for bank, court or government work.',
        })}
      </p>
      <div>
        <p style={labelStyle}>{t({ bn: '১. স্বাক্ষর আঁকুন (মাউস বা আঙুল)', en: '1. Draw your signature (mouse or finger)' })}</p>
        <canvas
          ref={canvasRef}
          width={600}
          height={220}
          style={{ width: '100%', maxWidth: 600, height: 'auto', border: '1px solid var(--line)', borderRadius: 8, touchAction: 'none', background: '#fff', cursor: 'crosshair' }}
          onPointerDown={startDraw}
          onPointerMove={draw}
          onPointerUp={endDraw}
          onPointerLeave={endDraw}
          aria-label={t({ bn: 'স্বাক্ষর আঁকার জায়গা', en: 'Signature drawing area' })}
        />
        <div style={{ ...gridStyle, marginTop: 10 }}>
          <div>
            <label style={labelStyle} htmlFor="sig-color">{t({ bn: 'কলমের রং', en: 'Pen colour' })}</label>
            <input id="sig-color" style={{ ...inputStyle, padding: 4 }} type="color" value={penColor} onChange={(e) => setPenColor(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle} htmlFor="sig-width">{t({ bn: 'কলমের মোটা (১–৮)', en: 'Pen thickness (1–8)' })}</label>
            <input id="sig-width" style={inputStyle} type="range" min="1" max="8" value={penWidth} onChange={(e) => setPenWidth(Number(e.target.value))} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
          <button type="button" className="ev-btn ev-btn-outline" style={{ minHeight: 44 }} onClick={clearCanvas}>
            {t({ bn: 'মুছুন', en: 'Clear' })}
          </button>
        </div>
        <p style={{ ...labelStyle, marginTop: 16 }}>{t({ bn: 'অথবা টাইপ করে স্বাক্ষর বানান', en: 'Or type to sign' })}</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input style={{ ...inputStyle, flex: '1 1 200px' }} type="text" value={typedName}
            placeholder={t({ bn: 'আপনার নাম লিখুন', en: 'Type your name' })}
            onChange={(e) => setTypedName(e.target.value)} aria-label={t({ bn: 'নাম', en: 'Name' })} />
          <button type="button" className="ev-btn ev-btn-outline" style={{ minHeight: 44 }} onClick={typeToSign} disabled={!typedName.trim()}>
            {t({ bn: 'টাইপ করা স্বাক্ষর বসান', en: 'Use typed signature' })}
          </button>
        </div>
      </div>
      <div style={{ marginTop: 16 }}>
        <p style={labelStyle}>{t({ bn: '২. PDF আপলোড করুন', en: '2. Upload a PDF' })}</p>
        <input style={inputStyle} type="file" accept="application/pdf,.pdf"
          onChange={(e) => void onPdfFile(e.target.files?.[0])} aria-label={t({ bn: 'PDF ফাইল', en: 'PDF file' })} />
        {pdfBytes ? (
          <div style={{ marginTop: 10 }}>
            <Tiles items={[
              { label: t({ bn: 'ফাইল', en: 'File' }), value: pdfName },
              { label: t({ bn: 'মোট পাতা', en: 'Pages' }), value: String(pageCount) },
            ]} />
            <div style={{ ...gridStyle, marginTop: 10 }}>
              <div>
                <label style={labelStyle} htmlFor="sig-page">{t({ bn: 'কোন পাতায় বসবে', en: 'Page to sign' })}</label>
                <input id="sig-page" style={inputStyle} type="number" min="1" max={pageCount} value={page}
                  onChange={(e) => setPage(Number(e.target.value) || 1)} />
              </div>
              <div>
                <label style={labelStyle} htmlFor="sig-pos">{t({ bn: 'পাতার কোথায়', en: 'Position on page' })}</label>
                <select id="sig-pos" style={inputStyle} value={position} onChange={(e) => setPosition(e.target.value as Position)}>
                  {POSITIONS.map((p) => (
                    <option key={p} value={p}>{t({
                      bn: p === 'bottom-right' ? 'নিচে ডানে' : p === 'bottom-left' ? 'নিচে বামে' : 'নিচে মাঝখানে',
                      en: p === 'bottom-right' ? 'Bottom right' : p === 'bottom-left' ? 'Bottom left' : 'Bottom centre',
                    })}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
              <button type="button" className="ev-btn ev-btn-primary" style={{ minHeight: 44 }}
                onClick={() => void signPdf()} disabled={!hasDrawn || busy}>
                {busy ? t({ bn: 'বসানো হচ্ছে…', en: 'Placing…' }) : t({ bn: 'PDF-এ স্বাক্ষর বসান', en: 'Place signature on PDF' })}
              </button>
            </div>
          </div>
        ) : null}
      </div>
      {error ? <p style={errorStyle} role="alert">{error}</p> : null}
      {signedUrl ? (
        <div style={resultStyle}>
          <p style={{ margin: '0 0 10px' }}><strong>{t({ bn: 'স্বাক্ষর করা PDF তৈরি!', en: 'Signed PDF ready!' })}</strong></p>
          <a ref={downloadRef} href={signedUrl} download={`signed-${pdfName || 'document.pdf'}`} style={{ display: 'none' }} aria-hidden="true" tabIndex={-1} />
          {/* Ads rollout: a signed PDF is a high-value take-away file (30s rewarded unlock; free download live, never a fake timer). */}
          <RewardedAdButton lang={lang} durationSeconds={30} onFreeDownload={() => downloadRef.current?.click()} />
          <p style={noteStyle}>{t({ bn: 'আপনার PDF কোথাও আপলোড হয়নি — স্বাক্ষর আপনার ব্রাউজারেই বসানো হয়েছে।', en: 'Your PDF was never uploaded — the signature was placed in your browser.' })}</p>
        </div>
      ) : null}
    </ToolSection>
  );
}
