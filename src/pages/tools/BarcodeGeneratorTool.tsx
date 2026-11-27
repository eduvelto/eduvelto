// Eduvelto — Barcode Generator tool UI (landed 27 Nov 2026, A-tools).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Engine: validateBarcodeValue() + ean13CheckDigit() + renderBarcode() in src/lib/tools/qrBarcode.ts; JsBarcode loads via dynamic import() only. 100% in-browser; nothing is uploaded.
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, CopyButton, ButtonRow, ExampleButton, inputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { validateBarcodeValue, ean13CheckDigit, renderBarcode, type BarcodeFormat } from '../../lib/tools/qrBarcode';


const errorStyle: CSSProperties = {
  marginTop: 14,
  color: '#b3261e',
  fontSize: 14,
};



function downloadText(filename: string, text: string, type = 'text/plain'): void {
  const blob = new Blob([text], { type: `${type};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const FORMATS: readonly { id: BarcodeFormat; bn: string; en: string }[] = [
  { id: 'CODE128', bn: 'CODE128 (সাধারণ)', en: 'CODE128 (general)' },
  { id: 'EAN13', bn: 'EAN-13 (পণ্য/বই)', en: 'EAN-13 (products/books)' },
  { id: 'CODE39', bn: 'CODE39', en: 'CODE39' },
  { id: 'UPC', bn: 'UPC-A', en: 'UPC-A' },
];

export function BarcodeGeneratorTool() {
  const { t } = useLanguage();
  const [format, setFormat] = useState<BarcodeFormat>('CODE128');
  const [value, setValue] = useState('HELLO123');
  const [height, setHeight] = useState(100);
  const [showValue, setShowValue] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkHint, setCheckHint] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    try {
      validateBarcodeValue(format, value);
      setError(null);
      void renderBarcode(svg, value, format, { height, displayValue: showValue }).catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Could not draw the barcode');
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid barcode value');
    }
  }, [format, value, height, showValue]);

  function computeCheckDigit(): void {
    if (format !== 'EAN13') return;
    try {
      const d = ean13CheckDigit(value);
      setValue(`${value}${d}`);
      setCheckHint(t({ bn: `চেক ডিজিট ${d} যোগ করা হয়েছে।`, en: `Check digit ${d} added.` }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Need 12 digits first');
    }
  }

  function downloadSvg(): void {
    const svg = svgRef.current;
    if (!svg) return;
    const text = new XMLSerializer().serializeToString(svg);
    downloadText('eduvelto-barcode.svg', text, 'image/svg+xml');
  }

  function downloadPng(): void {
    const svg = svgRef.current;
    if (!svg) return;
    const text = new XMLSerializer().serializeToString(svg);
    const url = URL.createObjectURL(new Blob([text], { type: 'image/svg+xml;charset=utf-8' }));
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width || 400;
      canvas.height = img.height || 140;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) downloadBlob('eduvelto-barcode.png', blob);
        URL.revokeObjectURL(url);
      }, 'image/png');
    };
    img.onerror = () => URL.revokeObjectURL(url);
    img.src = url;
  }

  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="বারকোড জেনারেটর" titleEn="Barcode Generator" descBn="দোকানের লেবেল, লাইব্রেরির বই বা পরীক্ষার প্রবেশপত্রের জন্য বারকোড বানান।" descEn="Make barcodes for shop price labels, library books or exam admit cards." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <div>
          <label style={labelStyle} htmlFor="bc-format">{t({ bn: 'বারকোডের ধরন', en: 'Barcode type' })}</label>
          <select id="bc-format" style={inputStyle} value={format} onChange={(e) => { setFormat(e.target.value as BarcodeFormat); setCheckHint(null); }}>
            {FORMATS.map((f) => (<option key={f.id} value={f.id}>{t({ bn: f.bn, en: f.en })}</option>))}
          </select>
        </div>
        <div>
          <label style={labelStyle} htmlFor="bc-value">{t({ bn: 'বারকোডের মান', en: 'Barcode value' })}</label>
          <input id="bc-value" style={inputStyle} type="text" value={value} onChange={(e) => setValue(e.target.value)} placeholder={format === 'EAN13' ? '890103089523' : 'HELLO123'} />
        </div>
        <div>
          <label style={labelStyle} htmlFor="bc-height">{t({ bn: 'উচ্চতা (পিক্সেল)', en: 'Height (pixels)' })}</label>
          <input id="bc-height" style={inputStyle} type="number" min={40} max={200} value={height} onChange={(e) => setHeight(Number(e.target.value) || 100)} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12, alignItems: 'center' }}>
        <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 15 }}>
          <input type="checkbox" checked={showValue} onChange={(e) => setShowValue(e.target.checked)} />
          {t({ bn: 'নিচে মানটি দেখান', en: 'Show the value below' })}
        </label>
        {format === 'EAN13' ? (
          <button type="button" style={{ minHeight: 40, padding: '0 14px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--heading)', cursor: 'pointer', fontWeight: 600 }} onClick={computeCheckDigit}>
            {t({ bn: 'চেক ডিজিট হিসাব করুন', en: 'Compute check digit' })}
          </button>
        ) : null}
        <ExampleButton onLoad={() => { setFormat('CODE128'); setValue('HELLO123'); }} />
      </div>
      {checkHint ? <p style={noteStyle} role="status">{checkHint}</p> : null}
      {error ? <p style={errorStyle} role="alert">{error}</p> : (
        <>
          <div style={{ marginTop: 16, textAlign: 'center', background: '#fff', border: '1px solid var(--line)', borderRadius: 12, padding: 16 }}>
            <svg ref={svgRef} style={{ maxWidth: '100%' }} role="img" aria-label={t({ bn: 'তৈরি করা বারকোড', en: 'Generated barcode' })} />
          </div>
          <ButtonRow>
            <button type="button" style={{ minHeight: 44, padding: '0 18px', borderRadius: 8, border: 'none', background: 'var(--teal)', color: '#fff', fontWeight: 700, cursor: 'pointer' }} onClick={downloadPng}>{t({ bn: 'PNG ডাউনলোড করুন', en: 'Download PNG' })}</button>
            <button type="button" style={{ minHeight: 44, padding: '0 18px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--heading)', fontWeight: 600, cursor: 'pointer' }} onClick={downloadSvg}>{t({ bn: 'SVG ডাউনলোড করুন', en: 'Download SVG' })}</button>
            <CopyButton text={value} labelBn="মানটি কপি করুন" labelEn="Copy the value" />
          </ButtonRow>
        </>
      )}
      <p style={noteStyle}>{t({ bn: 'EAN-13-এ ১২ অঙ্ক দিলে ১৩তম চেক ডিজিট হিসাব করে দেওয়া হয়; ভুল চেক ডিজিট থাকলে কোন অঙ্কটি হওয়া উচিত তা জানানো হয়। বইয়ের ISBN-13 আসলে ৯৭৮/৯৭৯ দিয়ে শুরু হওয়া EAN-13। CODE39-এ ছোট হাতের অক্ষর আপনা থেকে বড় হাতে বদলে যায়।', en: 'For EAN-13, enter 12 digits and the 13th check digit is computed; a wrong check digit tells you which digit it should be. A book ISBN-13 is EAN-13 starting with 978/979. CODE39 upper-cases lowercase letters automatically.' })}</p>
    </section>
  );
}
