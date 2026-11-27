// EXIF parser — pure JPEG header parser unit tests (Batch 3).
import { describe, it, expect } from 'vitest';
import { formatGps, parseExif } from '../../tools/exif';

/** Build a minimal little-endian JPEG with a known EXIF block. */
function makeExifJpeg(): ArrayBuffer {
  // TIFF layout (offsets relative to TIFF start):
  // header 8 | IFD0 (6 entries) 78 | strings 86..119 | Exif IFD 119..149 |
  // GPS IFD (4 entries) 149..203 | lat rationals 203..227 |
  // lon rationals 227..251 | DateTimeOriginal string 251..271.
  const tiffLen = 271;
  const total = 2 + 2 + 2 + 6 + tiffLen + 2; // SOI + APP1 marker/len + "Exif\0\0" + TIFF + EOI
  const buf = new ArrayBuffer(total);
  const view = new DataView(buf);
  let o = 0;
  const u8 = (v: number): void => { view.setUint8(o++, v); };
  const u16 = (v: number): void => { view.setUint16(o, v); o += 2; };
  const u16le = (v: number): void => { view.setUint16(o, v, true); o += 2; };
  const u32le = (v: number): void => { view.setUint32(o, v, true); o += 4; };
  const ascii = (s: string): void => { for (let i = 0; i < s.length; i++) u8(s.charCodeAt(i)); };
  u8(0xff); u8(0xd8); // SOI
  u8(0xff); u8(0xe1); // APP1
  u16(2 + 6 + tiffLen); // segment length
  ascii('Exif\0\0');
  const tiffStart = o;
  // TIFF header: "II", 42, IFD0 at 8.
  ascii('II'); u16le(42); u32le(8);
  // IFD0: 6 entries.
  u16le(6);
  const entry = (tag: number, type: number, count: number, value: number): void => {
    u16le(tag); u16le(type); u32le(count); u32le(value);
  };
  // Data area starts at tiff offset 86.
  entry(0x010f, 2, 6, 86); // Make "Canon\0"
  entry(0x0110, 2, 7, 92); // Model "EOS 5D\0"
  entry(0x0112, 3, 1, 1); // Orientation = 1 (inline SHORT)
  entry(0x0132, 2, 20, 99); // DateTime
  entry(0x8769, 4, 1, 119); // Exif sub-IFD at 119
  entry(0x8825, 4, 1, 149); // GPS IFD at 149
  u32le(0); // next IFD = none
  // Strings.
  o = tiffStart + 86; ascii('Canon\0');
  o = tiffStart + 92; ascii('EOS 5D\0');
  o = tiffStart + 99; ascii('2026:11:27 10:00:00\0');
  // Exif sub-IFD at 119: DateTimeOriginal + ISO 200.
  o = tiffStart + 119;
  u16le(2);
  entry(0x9003, 2, 20, 251); // DateTimeOriginal string at 251
  entry(0x8827, 3, 1, 200); // ISO inline
  u32le(0);
  o = tiffStart + 251; ascii('2026:11:27 09:59:00\0');
  // GPS IFD at 149: LatRef N, LonRef E, Lat 25°30'0", Lon 90°15'0".
  o = tiffStart + 149;
  u16le(4);
  // ASCII "N\0" inline: little-endian value field bytes are 'N', 0, 0, 0.
  entry(0x0001, 2, 2, 0x0000004e);
  entry(0x0003, 2, 2, 0x00000045);
  entry(0x0002, 5, 3, 203); // lat rationals at 203
  entry(0x0004, 5, 3, 227); // lon rationals at 227
  u32le(0);
  const rational = (num: number, den: number): void => { u32le(num); u32le(den); };
  o = tiffStart + 203;
  rational(25, 1); rational(30, 1); rational(0, 1);
  o = tiffStart + 227;
  rational(90, 1); rational(15, 1); rational(0, 1);
  // EOI.
  o = total - 2; u8(0xff); u8(0xd9);
  return buf;
}

function makePlainJpeg(): ArrayBuffer {
  const buf = new ArrayBuffer(22);
  const view = new DataView(buf);
  view.setUint16(0, 0xffd8);
  view.setUint16(2, 0xffe0); // APP0 JFIF
  view.setUint16(4, 16);
  const text = 'JFIF\0';
  for (let i = 0; i < text.length; i++) view.setUint8(6 + i, text.charCodeAt(i));
  view.setUint16(20, 0xffd9);
  return buf;
}

describe('parseExif', () => {
  it('reads Make, Model, Orientation, dates and ISO from the fixture', () => {
    const exif = parseExif(makeExifJpeg());
    expect(exif.make).toBe('Canon');
    expect(exif.model).toBe('EOS 5D');
    expect(exif.orientation).toBe(1);
    expect(exif.dateTime).toBe('2026:11:27 10:00:00');
    expect(exif.dateTimeOriginal).toBe('2026:11:27 09:59:00');
    expect(exif.iso).toBe(200);
    expect(exif.tagCount).toBeGreaterThan(0);
  });

  it('reads GPS 25.5 N, 90.25 E', () => {
    const exif = parseExif(makeExifJpeg());
    expect(exif.gps).toBeDefined();
    expect(exif.gps!.latitude).toBeCloseTo(25.5);
    expect(exif.gps!.longitude).toBeCloseTo(90.25);
    expect(formatGps(exif.gps!)).toContain('25.500000° N');
  });

  it('returns tagCount 0 for a JPEG without EXIF', () => {
    const exif = parseExif(makePlainJpeg());
    expect(exif.tagCount).toBe(0);
    expect(exif.make).toBeUndefined();
  });

  it('throws on a non-JPEG buffer', () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47]).buffer;
    expect(() => parseExif(png)).toThrow(/Not a JPEG/);
  });
});
