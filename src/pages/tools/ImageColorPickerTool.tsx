// Eduvelto — Image Color Picker tool UI (Batch 3, 27 Nov 2026).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Colour math in src/lib/tools/imageConvert.ts; pixel reading via
// canvas getImageData in this file. File stays on device. Click (or
// tap) anywhere on the image to pick that pixel's colour.

import { useRef, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { hexToRgb, rgbToHex, rgbToHsl } from '../../lib/tools/imageConvert';
import {
  cardStyle, CopyButton, errorStyle, gridStyle, headlineLabelStyle, headlineStyle,
  heroDescStyle, heroStyle, heroTitleStyle, inputStyle, isOverLimit, labelStyle,
  noteStyle, previewStyle, PrivacyNote, resultStyle, Tile, tileGridStyle, trustChipStyle,
} from './toolShared';

interface Picked { r: number; g: number; b: number; x: number; y: number; }

const PRESET_HEX = ['#0b7285', '#14532d', '#f59e0b', '#dc2626', '#2563eb', '#7c3aed', '#db2777', '#111827', '#ffffff', '#f8fafc'];

export function ImageColorPickerTool() {
  const { t } = useLanguage();
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [imgEl, setImgEl] = useState<HTMLImageElement | null>(null);
  const [picked, setPicked] = useState<Picked | null>(null);
  const [history, setHistory] = useState<Picked[]>([]);
  const [hexInput, setHexInput] = useState('');
  const [hexError, setHexError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  function handleFile(next: File | null): void {
    setError(null); setImgEl(null); setImgUrl(null); setPicked(null);
    if (!next) return;
    if (!next.type.startsWith('image/')) { setError('not-image'); return; }
    if (isOverLimit(next)) { setError('too-big'); return; }
    const url = URL.createObjectURL(next);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); setImgEl(img); setImgUrl(URL.createObjectURL(next)); };
    img.onerror = () => { URL.revokeObjectURL(url); setError('unreadable'); };
    img.src = url;
  }

  function pickFromEvent(e: React.MouseEvent<HTMLCanvasElement>): void {
    const canvas = canvasRef.current;
    if (!canvas || !imgEl) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = imgEl.naturalWidth / rect.width;
    const scaleY = imgEl.naturalHeight / rect.height;
    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);
    // Draw the image at natural size on an offscreen canvas to read the pixel.
    const off = document.createElement('canvas');
    off.width = imgEl.naturalWidth;
    off.height = imgEl.naturalHeight;
    const ctx = off.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(imgEl, 0, 0);
    const data = ctx.getImageData(Math.max(0, Math.min(x, imgEl.naturalWidth - 1)), Math.max(0, Math.min(y, imgEl.naturalHeight - 1)), 1, 1).data;
    const p: Picked = { r: data[0], g: data[1], b: data[2], x, y };
    setPicked(p);
    setHistory((prev) => [p, ...prev].slice(0, 8));
  }

  function applyHex(): void {
    setHexError(null);
    try {
      const { r, g, b } = hexToRgb(hexInput);
      const p: Picked = { r, g, b, x: -1, y: -1 };
      setPicked(p);
      setHistory((prev) => [p, ...prev].slice(0, 8));
    } catch {
      setHexError('bad-hex');
    }
  }

  const hex = picked ? rgbToHex(picked.r, picked.g, picked.b) : null;
  const hsl = picked ? rgbToHsl(picked.r, picked.g, picked.b) : null;
  const rgbText = picked ? `rgb(${picked.r}, ${picked.g}, ${picked.b})` : '';
  const hslText = hsl ? `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` : '';

  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="image-color-picker-title">
      <div style={heroStyle}>
        <h2 id="image-color-picker-title" style={heroTitleStyle}>{t({ bn: 'ছবির রং বাছাই', en: 'Image Color Picker' })}</h2>
        <p style={heroDescStyle}>{t({ bn: 'ছবির যেকোনো জায়গার রং বেছে তার HEX ও RGB মান দেখুন।', en: 'Pick any colour from an image and see its HEX and RGB values.' })}</p>
        <span style={trustChipStyle}>{t({ bn: '✓ আপনার ডিভাইসেই প্রক্রিয়া হয়', en: '✓ Processed on your device' })}</span>
        <span style={trustChipStyle}>{t({ bn: 'ছবিতে ক্লিক করে বাছুন', en: 'Click the image to pick' })}</span>
      </div>
      <div>
        <label style={labelStyle} htmlFor="color-file">{t({ bn: 'ছবির ফাইল', en: 'Image file' })}</label>
        <input id="color-file" style={inputStyle} type="file" accept="image/*" onChange={(e) => handleFile(e.target.files?.[0] ?? null)} />
      </div>
      {imgEl && imgUrl ? (
        <canvas
          ref={canvasRef}
          style={{ ...previewStyle, cursor: 'crosshair', backgroundImage: `url(${imgUrl})`, backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', width: '100%', height: 320 }}
          width={imgEl.naturalWidth}
          height={imgEl.naturalHeight}
          onClick={pickFromEvent}
          aria-label={t({ bn: 'রং বাছতে ছবিতে ক্লিক করুন', en: 'Click the image to pick a colour' })}
        />
      ) : null}
      <p style={noteStyle}>{t({ bn: 'ছবিতে ক্লিক করলেই সেই জায়গার রং দেখাবে। নিচে HEX লিখেও রং দেখতে পারেন।', en: 'Click the image to see the colour at that spot. You can also type a HEX value below.' })}</p>
      <div style={{ ...gridStyle, marginTop: 12 }}>
        <div>
          <label style={labelStyle} htmlFor="color-hex-input">{t({ bn: 'HEX লিখে দেখুন (যেমন #0b7285)', en: 'Type a HEX value (e.g. #0b7285)' })}</label>
          <input id="color-hex-input" style={inputStyle} type="text" value={hexInput} onChange={(e) => setHexInput(e.target.value)} placeholder="#0b7285" />
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button type="button" onClick={applyHex} style={{ minHeight: 44, padding: '0 18px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--heading)', fontWeight: 600, cursor: 'pointer' }}>{t({ bn: 'রং দেখুন', en: 'Show colour' })}</button>
        </div>
      </div>
      {hexError ? <p style={errorStyle} role="alert">{t({ bn: 'সঠিক HEX লিখুন — যেমন #0b7285।', en: 'Enter a valid HEX value — e.g. #0b7285.' })}</p> : null}
      <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {PRESET_HEX.map((h) => (
          <button key={h} type="button" onClick={() => { setHexInput(h); try { const { r, g, b } = hexToRgb(h); const p = { r, g, b, x: -1, y: -1 }; setPicked(p); setHistory((prev) => [p, ...prev].slice(0, 8)); } catch { /* preset is valid */ } }} aria-label={`${t({ bn: 'রং ', en: 'Colour ' })}${h}`} style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid var(--line)', background: h, cursor: 'pointer' }} />
        ))}
      </div>
      {error ? (
        <p style={errorStyle} role="alert">
          {error === 'not-image' ? t({ bn: 'একটি ছবির ফাইল বাছুন (JPG, PNG, WebP বা এ জাতীয়)।', en: 'Choose an image file (JPG, PNG, WebP or similar).' })
            : error === 'too-big' ? t({ bn: 'ফাইলটি ১০ MB-এর বেশি — ছোট ফাইল বাছুন।', en: 'The file is over 10 MB — choose a smaller file.' })
            : t({ bn: 'ছবিটি পড়া যায়নি — ফাইলটি নষ্ট বা অসমর্থিত হতে পারে।', en: 'The image could not be read — it may be corrupt or unsupported.' })}
        </p>
      ) : null}
      {picked && hex ? (
        <div style={resultStyle} role="status">
          <p style={headlineLabelStyle}>{t({ bn: 'বাছা রং', en: 'Picked colour' })}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ width: 56, height: 56, borderRadius: 12, border: '1px solid var(--line)', background: hex, flexShrink: 0 }} />
            <p style={headlineStyle}>{hex.toUpperCase()}</p>
          </div>
          <div style={tileGridStyle}>
            <Tile label="HEX" value={hex.toUpperCase()} />
            <Tile label="RGB" value={rgbText} />
            <Tile label="HSL" value={hslText} />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <CopyButton text={hex.toUpperCase()} label={t({ bn: 'HEX কপি করুন', en: 'Copy HEX' })} />
            <CopyButton text={rgbText} label={t({ bn: 'RGB কপি করুন', en: 'Copy RGB' })} />
            <CopyButton text={hslText} label={t({ bn: 'HSL কপি করুন', en: 'Copy HSL' })} />
          </div>
          {picked.x >= 0 ? (
            <p style={noteStyle}>{t({ bn: 'অবস্থান: ', en: 'Position: ' })}x={picked.x}, y={picked.y}</p>
          ) : null}
          {history.length > 1 ? (
            <div style={{ marginTop: 12 }}>
              <p style={noteStyle}>{t({ bn: 'আগের বাছা রং:', en: 'Previously picked:' })}</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {history.map((h, i) => (
                  <button key={i} type="button" onClick={() => setPicked(h)} aria-label={rgbToHex(h.r, h.g, h.b)} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--line)', background: rgbToHex(h.r, h.g, h.b), cursor: 'pointer' }} />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
      <PrivacyNote />
    </section>
  );
}
