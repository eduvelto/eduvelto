// + option types + validation. DO NOT hand-roll QR/barcode codecs.
// Libraries (decide before landing; see specs/spec-04):
//   QR generate: `qrcode` (npm, MIT) — toDataURL / toString (SVG).
//   QR read:     `jsQR` (npm, MIT) on image data; BarcodeDetector API where supported.
//   Barcode:    `JsBarcode` (npm, MIT) — CODE128 / EAN-13 / CODE39 / UPC-A.
// All three load via dynamic import() inside the function that needs them.

export type QrContentKind = 'text' | 'url' | 'wifi' | 'tel' | 'sms' | 'email' | 'vcard';
export type QrErrorCorrection = 'L' | 'M' | 'Q' | 'H';

export interface QrGenerateOptions {
  kind: QrContentKind;
  text: string;
  sizePx?: number; // 256 | 512 | 1024, default 512
  errorCorrection?: QrErrorCorrection; // default 'M'
  darkColor?: string; // default '#000000'
  lightColor?: string; // default '#ffffff'
}

/** Build the payload string for structured kinds (Wi-Fi / tel / mailto / vCard). */
export function buildQrPayload(kind: QrContentKind, fields: Record<string, string>): string {
  switch (kind) {
    case 'wifi': {
      const ssid = fields.ssid ?? '';
      const password = fields.password ?? '';
      const encryption = fields.encryption ?? 'WPA';
      if (ssid === '') throw new Error('Wi-Fi network name (SSID) cannot be empty');
      const hidden = fields.hidden === 'true' ? 'H:true;' : '';
      return `WIFI:T:${encryption};S:${ssid};P:${password};${hidden};`;
    }
    case 'tel': {
      if ((fields.phone ?? '').trim() === '') throw new Error('Phone number cannot be empty');
      return `tel:${fields.phone.trim()}`;
    }
    case 'sms': {
      if ((fields.phone ?? '').trim() === '') throw new Error('Phone number cannot be empty');
      return `SMSTO:${fields.phone.trim()}:${fields.message ?? ''}`;
    }
    case 'email': {
      if ((fields.email ?? '').trim() === '') throw new Error('Email address cannot be empty');
      return `mailto:${fields.email.trim()}?subject=${encodeURIComponent(fields.subject ?? '')}&body=${encodeURIComponent(fields.body ?? '')}`;
    }
    case 'vcard': {
      const name = fields.name ?? '';
      if (name.trim() === '') throw new Error('Name cannot be empty for a contact QR');
      return [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `N:${name}`,
        `FN:${name}`,
        fields.phone ? `TEL:${fields.phone}` : '',
        fields.email ? `EMAIL:${fields.email}` : '',
        'END:VCARD',
      ]
        .filter(Boolean)
        .join('\n');
    }
    case 'url': {
      const url = (fields.text ?? '').trim();
      if (!/^https?:\/\//i.test(url)) throw new Error('URL must start with http:// or https://');
      return url;
    }
    case 'text':
    default:
      return fields.text ?? '';
  }
}

/** QR capacity guard: ~4,296 alphanumeric chars at level L; fail honestly above it. */
export function checkQrLength(payload: string, level: QrErrorCorrection): void {
  if (payload === '') throw new Error('Type something first — an empty QR code means nothing');
  const limits: Record<QrErrorCorrection, number> = { L: 4296, M: 3391, Q: 2420, H: 1852 };
  if (payload.length > limits[level]) {
    throw new Error(
      `This text (${payload.length} characters) is too long for a QR code at level ${level} (max ${limits[level]}) — shorten it or use level L`,
    );
  }
}

/** Contrast guard: warn when dark/light colours are too close to scan reliably. */
export function qrContrastOk(dark: string, light: string): boolean {
  const lum = (hex: string): number => {
    const c = hex.replace('#', '');
    const r = parseInt(c.slice(0, 2), 16);
    const g = parseInt(c.slice(2, 4), 16);
    const b = parseInt(c.slice(4, 6), 16);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  return Math.abs(lum(dark) - lum(light)) >= 100;
}

export type BarcodeFormat = 'CODE128' | 'EAN13' | 'CODE39' | 'UPC';

/** Compute the EAN-13 check digit for 12 digits. Throws on non-digits. */
export function ean13CheckDigit(first12: string): string {
  if (!/^\d{12}$/.test(first12)) {
    throw new Error(`EAN-13 needs exactly 12 digits first, got "${first12}"`);
  }
  let sum = 0;
  for (let i = 0; i < 12; i += 1) {
    const d = Number(first12[i]);
    sum += i % 2 === 0 ? d : d * 3;
  }
  return String((10 - (sum % 10)) % 10);
}

export function validateBarcodeValue(format: BarcodeFormat, value: string): void {
  if (value === '') throw new Error('Type the barcode value first');
  if (format === 'EAN13' && !/^\d{12,13}$/.test(value)) {
    throw new Error('EAN-13 needs 12 digits (check digit is computed) or 13 digits');
  }
  if (format === 'EAN13' && value.length === 13) {
    const expected = ean13CheckDigit(value.slice(0, 12));
    if (value[12] !== expected) {
      throw new Error(`EAN-13 check digit is wrong — the last digit should be ${expected}`);
    }
  }
  if (format === 'UPC' && !/^\d{11,12}$/.test(value)) {
    throw new Error('UPC-A needs 11 digits (check digit is computed) or 12 digits');
  }
  if (format === 'CODE39' && /[^A-Z0-9 \-. $/+%]/.test(value.toUpperCase())) {
    throw new Error('CODE39 only supports A-Z, 0-9 and - . space $ / + %');
  }
}

/** Classify decoded QR text for the Reader's action buttons. */
export function classifyQrText(text: string): { kind: QrContentKind; label: string } {
  if (/^https?:\/\//i.test(text)) return { kind: 'url', label: 'Web link' };
  if (/^WIFI:/i.test(text)) return { kind: 'wifi', label: 'Wi-Fi network' };
  if (/^tel:/i.test(text)) return { kind: 'tel', label: 'Phone number' };
  if (/^SMSTO:/i.test(text)) return { kind: 'sms', label: 'SMS' };
  if (/^mailto:/i.test(text)) return { kind: 'email', label: 'Email' };
  if (/^BEGIN:VCARD/i.test(text)) return { kind: 'vcard', label: 'Contact card' };
  return { kind: 'text', label: 'Plain text' };
}

/* --------------------------------------- Lazy library wrappers (A-tools landing) */
/* qrcode / jsQR / JsBarcode load ONLY via dynamic import() inside these functions —
   never a static import, never in the main bundle. */

export interface QrRenderOptions {
  sizePx?: number; // default 512
  errorCorrection?: QrErrorCorrection; // default 'M'
  darkColor?: string; // default '#000000'
  lightColor?: string; // default '#ffffff'
}

/** Render a QR payload to a PNG data URL (for <img> + download). */
export async function generateQrDataUrl(payload: string, opts: QrRenderOptions = {}): Promise<string> {
  checkQrLength(payload, opts.errorCorrection ?? 'M');
  const QRCode = (await import('qrcode')).default;
  return QRCode.toDataURL(payload, {
    width: opts.sizePx ?? 512,
    errorCorrectionLevel: opts.errorCorrection ?? 'M',
    margin: 1,
    color: { dark: opts.darkColor ?? '#000000', light: opts.lightColor ?? '#ffffff' },
  });
}

/** Render a QR payload to an SVG string (for download). */
export async function generateQrSvg(payload: string, opts: QrRenderOptions = {}): Promise<string> {
  checkQrLength(payload, opts.errorCorrection ?? 'M');
  const QRCode = (await import('qrcode')).default;
  return QRCode.toString(payload, {
    type: 'svg',
    width: opts.sizePx ?? 512,
    errorCorrectionLevel: opts.errorCorrection ?? 'M',
    margin: 1,
    color: { dark: opts.darkColor ?? '#000000', light: opts.lightColor ?? '#ffffff' },
  });
}

/** Decode a QR code from canvas ImageData. Returns the text, or null when none is found. */
export async function decodeQrFromImageData(imageData: ImageData): Promise<string | null> {
  const jsQR = (await import('jsqr')).default;
  const result = jsQR(imageData.data, imageData.width, imageData.height, {
    inversionAttempts: 'attemptBoth',
  });
  return result ? result.data : null;
}

export interface BarcodeRenderOptions {
  width?: number; // bar width, default 2
  height?: number; // default 100
  displayValue?: boolean; // default true
  fontSize?: number; // default 20
  lineColor?: string; // default '#000000'
  background?: string; // default '#ffffff'
}

/**
 * Render a barcode into an <svg> element (JsBarcode draws into it).
 * CODE39 values are upper-cased first (the symbology has no lowercase).
 */
export async function renderBarcode(
  element: SVGElement,
  value: string,
  format: BarcodeFormat,
  opts: BarcodeRenderOptions = {},
): Promise<void> {
  validateBarcodeValue(format, value);
  const JsBarcode = (await import('jsbarcode')).default;
  const finalValue = format === 'CODE39' ? value.toUpperCase() : value;
  JsBarcode(element, finalValue, {
    format: format === 'EAN13' ? 'EAN13' : format === 'UPC' ? 'UPC' : format,
    width: opts.width ?? 2,
    height: opts.height ?? 100,
    displayValue: opts.displayValue ?? true,
    fontSize: opts.fontSize ?? 20,
    lineColor: opts.lineColor ?? '#000000',
    background: opts.background ?? '#ffffff',
    margin: 10,
  });
}
