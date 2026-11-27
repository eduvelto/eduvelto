// Landed 27 Nov 2026 (A-tools): pure-function tests for the QR/barcode
// wrapper engine. Library round-trips (qrcode -> jsQR) are exercised in
// the UI smoke checks, not here — these tests cover payload building,
// validation and classification only (no DOM, no network).
import { describe, expect, it } from 'vitest';
import {
  buildQrPayload,
  checkQrLength,
  classifyQrText,
  ean13CheckDigit,
  qrContrastOk,
  validateBarcodeValue,
} from '../../tools/qrBarcode';

describe('buildQrPayload', () => {
  it('builds a Wi-Fi payload', () => {
    expect(buildQrPayload('wifi', { ssid: 'HomeNet', password: 'secret123', encryption: 'WPA' })).toBe(
      'WIFI:T:WPA;S:HomeNet;P:secret123;;',
    );
  });
  it('rejects an empty SSID', () => {
    expect(() => buildQrPayload('wifi', { ssid: '', password: 'x' })).toThrow(/SSID/);
  });
  it('builds tel / mailto / vCard payloads', () => {
    expect(buildQrPayload('tel', { phone: '01712345678' })).toBe('tel:01712345678');
    expect(buildQrPayload('email', { email: 'a@b.com', subject: 'Hi', body: '' })).toBe(
      'mailto:a@b.com?subject=Hi&body=',
    );
    const v = buildQrPayload('vcard', { name: 'Rahim Uddin', phone: '01712345678', email: 'r@x.com' });
    expect(v).toContain('BEGIN:VCARD');
    expect(v).toContain('FN:Rahim Uddin');
  });
  it('rejects a URL without http(s)', () => {
    expect(() => buildQrPayload('url', { text: 'eduvelto.com' })).toThrow(/http/);
  });
});

describe('checkQrLength', () => {
  it('rejects empty payloads and over-long payloads', () => {
    expect(() => checkQrLength('', 'M')).toThrow(/empty/);
    expect(() => checkQrLength('x'.repeat(2000), 'H')).toThrow(/too long/);
    expect(() => checkQrLength('x'.repeat(4296), 'L')).not.toThrow();
  });
  it('flags low-contrast colour pairs', () => {
    expect(qrContrastOk('#000000', '#ffffff')).toBe(true);
    expect(qrContrastOk('#777777', '#888888')).toBe(false);
  });
});

describe('ean13CheckDigit / validateBarcodeValue', () => {
  it('computes the EAN-13 check digit', () => {
    // 890103089523: odd positions sum 19, even positions sum 29 x 3 = 87,
    // total 106 -> check digit (10 - 6) % 10 = 4.
    expect(ean13CheckDigit('890103089523')).toBe('4');
  });
  it('rejects a wrong EAN-13 check digit', () => {
    expect(() => validateBarcodeValue('EAN13', '8901030895231')).toThrow(/should be 4/);
    expect(() => validateBarcodeValue('EAN13', '8901030895234')).not.toThrow();
  });
  it('rejects bad CODE39 characters', () => {
    expect(() => validateBarcodeValue('CODE39', 'hello!')).toThrow(/CODE39/);
    expect(() => validateBarcodeValue('CODE39', 'HELLO-123')).not.toThrow();
  });
});

describe('classifyQrText', () => {
  it('classifies URLs, Wi-Fi, tel and plain text', () => {
    expect(classifyQrText('https://eduvelto.com').kind).toBe('url');
    expect(classifyQrText('WIFI:T:WPA;S:X;P:Y;;').kind).toBe('wifi');
    expect(classifyQrText('tel:01712345678').kind).toBe('tel');
    expect(classifyQrText('hello world').kind).toBe('text');
  });
});
