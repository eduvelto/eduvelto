/**
 * EXIF reader — pure JPEG header parser (Batch 3, 27 Nov 2026).
 *
 * Reads basic EXIF tags straight from a JPEG's APP1 segment (TIFF
 * header, IFD0 + Exif + GPS IFDs). No library, no upload. Only the
 * common tags are reported — a missing tag is reported as missing,
 * never invented. Removing EXIF is done by re-encoding through canvas
 * (see stripExif below), which drops all metadata.
 */

export interface GpsCoords {
  latitude: number;
  longitude: number;
  latitudeRef: string;
  longitudeRef: string;
}

export interface ExifData {
  make?: string;
  model?: string;
  software?: string;
  dateTime?: string;
  dateTimeOriginal?: string;
  orientation?: number;
  imageWidth?: number;
  imageHeight?: number;
  exposureTime?: string;
  fNumber?: number;
  iso?: number;
  focalLengthMm?: number;
  gps?: GpsCoords;
  /** How many EXIF tags were found in total. */
  tagCount: number;
}

function readAscii(view: DataView, offset: number, length: number): string {
  let s = '';
  for (let i = 0; i < length; i++) {
    const c = view.getUint8(offset + i);
    if (c === 0) break;
    s += String.fromCharCode(c);
  }
  return s.trim();
}

function readRational(view: DataView, offset: number, little: boolean): number {
  const num = view.getUint32(offset, little);
  const den = view.getUint32(offset + 4, little);
  return den === 0 ? 0 : num / den;
}

type TagMap = Map<number, { type: number; count: number; valueOffset: number }>;

function readIfd(view: DataView, tiffStart: number, ifdOffset: number, little: boolean): TagMap {
  const tags: TagMap = new Map();
  if (ifdOffset < 0 || tiffStart + ifdOffset + 2 > view.byteLength) return tags;
  const count = view.getUint16(tiffStart + ifdOffset, little);
  for (let i = 0; i < count; i++) {
    const entry = tiffStart + ifdOffset + 2 + i * 12;
    if (entry + 12 > view.byteLength) break;
    const tag = view.getUint16(entry, little);
    const type = view.getUint16(entry + 2, little);
    const num = view.getUint32(entry + 4, little);
    const valueOffset = view.getUint32(entry + 8, little);
    tags.set(tag, { type, count: num, valueOffset });
  }
  return tags;
}

function tagString(view: DataView, tiffStart: number, tag: { type: number; count: number; valueOffset: number }, little: boolean): string {
  const size = tag.count;
  if (size <= 4) {
    // Inline ASCII: the bytes live inside the 4-byte value field.
    let s = '';
    for (let i = 0; i < size; i++) {
      const shift = little ? i * 8 : (3 - i) * 8;
      const c = (tag.valueOffset >> shift) & 0xff;
      if (c === 0) break;
      s += String.fromCharCode(c);
    }
    return s.trim();
  }
  return readAscii(view, tiffStart + tag.valueOffset, size);
}

function tagNumber(view: DataView, tiffStart: number, tag: { type: number; count: number; valueOffset: number }, little: boolean): number {
  const { type, count, valueOffset } = tag;
  // SHORT / BYTE with count 1 (or few) are stored inline in the value
  // field itself — they are NOT offsets.
  if (type === 3 && count === 1) return little ? valueOffset & 0xffff : (valueOffset >>> 16) & 0xffff;
  if (type === 1 && count === 1) return little ? valueOffset & 0xff : (valueOffset >>> 24) & 0xff;
  if (type === 4 && count === 1) return valueOffset;
  if (type === 3) return view.getUint16(tiffStart + valueOffset, little);
  if (type === 4) return view.getUint32(tiffStart + valueOffset, little);
  if (type === 5) return readRational(view, tiffStart + valueOffset, little);
  if (type === 1) return view.getUint8(tiffStart + valueOffset);
  return valueOffset;
}

function tagRational(view: DataView, tiffStart: number, tag: { type: number; count: number; valueOffset: number }, little: boolean): number {
  if (tag.type === 5) return readRational(view, tiffStart + tag.valueOffset, little);
  return tagNumber(view, tiffStart, tag, little);
}

function gpsCoord(view: DataView, tiffStart: number, tag: { type: number; count: number; valueOffset: number }, little: boolean): number {
  const base = tiffStart + tag.valueOffset;
  const d = readRational(view, base, little);
  const m = readRational(view, base + 8, little);
  const s = readRational(view, base + 16, little);
  return d + m / 60 + s / 3600;
}

/** Format GPS as decimal degrees with hemisphere. Pure. */
export function formatGps(gps: GpsCoords): string {
  return `${gps.latitude.toFixed(6)}° ${gps.latitudeRef}, ${gps.longitude.toFixed(6)}° ${gps.longitudeRef}`;
}

/**
 * Parse EXIF from a JPEG ArrayBuffer. Returns the tags found
 * (tagCount 0 = no EXIF segment). Throws only on a non-JPEG buffer.
 */
export function parseExif(buffer: ArrayBuffer): ExifData {
  const view = new DataView(buffer);
  if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) {
    throw new Error('Not a JPEG file — EXIF can only be read from JPEG photos');
  }
  let offset = 2;
  let exifStart = -1;
  while (offset + 4 <= view.byteLength) {
    if (view.getUint8(offset) !== 0xff) break;
    const marker = view.getUint8(offset + 1);
    if (marker === 0xd9 || marker === 0xda) break; // EOI / SOS
    const length = view.getUint16(offset + 2);
    if (marker === 0xe1 && length >= 8) {
      const header = readAscii(view, offset + 4, 6);
      if (header === 'Exif') {
        exifStart = offset + 10;
        break;
      }
    }
    offset += 2 + length;
  }
  if (exifStart === -1) return { tagCount: 0 };
  const tiffStart = exifStart;
  const byteOrder = view.getUint16(tiffStart);
  const little = byteOrder === 0x4949;
  if (byteOrder !== 0x4949 && byteOrder !== 0x4d4d) return { tagCount: 0 };
  if (view.getUint16(tiffStart + 2, little) !== 42) return { tagCount: 0 };
  const ifd0Offset = view.getUint32(tiffStart + 4, little);
  const ifd0 = readIfd(view, tiffStart, ifd0Offset, little);
  const out: ExifData = { tagCount: ifd0.size };
  const getStr = (tags: TagMap, id: number): string | undefined => {
    const tag = tags.get(id);
    if (!tag || tag.type !== 2) return undefined;
    return tagString(view, tiffStart, tag, little) || undefined;
  };
  const getNum = (tags: TagMap, id: number): number | undefined => {
    const tag = tags.get(id);
    if (!tag) return undefined;
    return tagNumber(view, tiffStart, tag, little);
  };
  out.make = getStr(ifd0, 0x010f);
  out.model = getStr(ifd0, 0x0110);
  out.software = getStr(ifd0, 0x0131);
  out.dateTime = getStr(ifd0, 0x0132);
  const orientation = getNum(ifd0, 0x0112);
  if (orientation !== undefined) out.orientation = orientation;
  const w = getNum(ifd0, 0x0100);
  const h = getNum(ifd0, 0x0101);
  if (w !== undefined) out.imageWidth = w;
  if (h !== undefined) out.imageHeight = h;
  // Exif sub-IFD.
  const exifPtr = ifd0.get(0x8769);
  if (exifPtr) {
    const sub = readIfd(view, tiffStart, tagNumber(view, tiffStart, exifPtr, little), little);
    out.tagCount += sub.size;
    out.dateTimeOriginal = getStr(sub, 0x9003);
    const f = sub.get(0x829d);
    if (f) out.fNumber = tagRational(view, tiffStart, f, little);
    const iso = getNum(sub, 0x8827);
    if (iso !== undefined) out.iso = iso;
    const exp = sub.get(0x829a);
    if (exp) {
      const v = tagRational(view, tiffStart, exp, little);
      out.exposureTime = v > 0 && v < 1 ? `1/${Math.round(1 / v)} s` : `${v} s`;
    }
    const focal = sub.get(0x920a);
    if (focal) out.focalLengthMm = tagRational(view, tiffStart, focal, little);
  }
  // GPS IFD.
  const gpsPtr = ifd0.get(0x8825);
  if (gpsPtr) {
    const gps = readIfd(view, tiffStart, tagNumber(view, tiffStart, gpsPtr, little), little);
    out.tagCount += gps.size;
    const latRef = getStr(gps, 0x0001) ?? 'N';
    const lonRef = getStr(gps, 0x0003) ?? 'E';
    const latTag = gps.get(0x0002);
    const lonTag = gps.get(0x0004);
    if (latTag && lonTag) {
      let lat = gpsCoord(view, tiffStart, latTag, little);
      let lon = gpsCoord(view, tiffStart, lonTag, little);
      if (latRef === 'S') lat = -lat;
      if (lonRef === 'W') lon = -lon;
      out.gps = { latitude: Math.abs(lat), longitude: Math.abs(lon), latitudeRef: latRef, longitudeRef: lonRef };
    }
  }
  return out;
}

/**
 * Strip EXIF by re-encoding the image through canvas. The output is a
 * fresh JPEG/PNG with no metadata segments at all. Needs real browser
 * canvas deps (realImageDeps from imageConvert).
 */
export async function stripExif(
  file: Blob,
  format: 'image/jpeg' | 'image/png' = 'image/jpeg',
  deps?: { loadImage?: (f: Blob) => Promise<HTMLImageElement>; createCanvas?: (w: number, h: number) => import('./imageCompressor').MinimalCanvas },
): Promise<Blob> {
  const { convertImage, realImageDeps } = await import('./imageConvert');
  const result = await convertImage(file, { format, quality: 0.92 }, deps ?? realImageDeps());
  return result.blob;
}
