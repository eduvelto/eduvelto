/**
 * ONE base64 engine, shared by base64-encoder-decoder and jwt-token-decoder.
 * Pure functions, no DOM. UTF-8 text in and out; base64url variant for JWT.
 * Uses the platform btoa/atob (available in browsers and in Node 16+).
 */

function utf8ToBinary(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return binary;
}

function binaryToUtf8(binary: string): string {
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

export function encodeBase64(text: string): string {
  return btoa(utf8ToBinary(text));
}

export function decodeBase64(encoded: string): string {
  const cleaned = encoded.replace(/\s/g, '');
  if (cleaned === '') return '';
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleaned) || cleaned.length % 4 !== 0) {
    throw new Error('Not valid Base64: use only A–Z, a–z, 0–9, + and /, with up to two = at the end.');
  }
  try {
    return binaryToUtf8(atob(cleaned));
  } catch {
    throw new Error('Not valid Base64 text (decoding failed).');
  }
}

export function encodeBase64Url(text: string): string {
  return encodeBase64(text).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeBase64Url(encoded: string): string {
  const cleaned = encoded.replace(/\s/g, '');
  if (!/^[A-Za-z0-9_-]*$/.test(cleaned)) {
    throw new Error('Not valid Base64URL: use only A–Z, a–z, 0–9, - and _.');
  }
  const padded = cleaned + '='.repeat((4 - (cleaned.length % 4)) % 4);
  return decodeBase64(padded.replace(/-/g, '+').replace(/_/g, '/'));
}

export function isValidBase64(value: string): boolean {
  try {
    decodeBase64(value);
    return true;
  } catch {
    return false;
  }
}
