/**
 * UUID & hash generator — pure logic.
 * UUIDs use crypto.randomUUID (fallback: getRandomValues). SHA-1/256/384/512
 * use Web Crypto (crypto.subtle, async); MD5 uses the local implementation
 * in ./md5.ts because browsers have no MD5 API. No network, no DOM.
 */
import { md5Hex } from './md5';

export type ShaAlgorithm = 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512';

export function generateUuid(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  const bytes = new Uint8Array(16);
  if (c && typeof c.getRandomValues === 'function') c.getRandomValues(bytes);
  else for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.trim());
}

export async function shaHex(text: string, algorithm: ShaAlgorithm): Promise<string> {
  const c = globalThis.crypto;
  if (!c || !c.subtle) throw new Error('SHA hashing needs Web Crypto (crypto.subtle), which this browser does not provide.');
  const digest = await c.subtle.digest(algorithm, new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function md5(text: string): string {
  return md5Hex(text);
}

export async function hashText(text: string, algorithm: 'MD5' | ShaAlgorithm): Promise<string> {
  if (algorithm === 'MD5') return md5Hex(text);
  return shaHex(text, algorithm);
}
