/**
 * JWT Token Decoder — pure logic. Splits the token and Base64URL-decodes
 * the header and payload. The signature is NEVER verified here — decoding
 * is not verification, and the UI says so plainly. The token never leaves
 * the device (no network call).
 */
import { decodeBase64Url } from './base64';

export interface JwtDecoded {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
  /** Expiry as an ISO date string when the payload has a numeric `exp`. */
  expiresAt?: string;
  /** True when `exp` is in the past. */
  expired?: boolean;
}

export function decodeJwt(token: string): JwtDecoded {
  const parts = token.trim().split('.');
  if (parts.length !== 3 || parts.some((p) => p === '')) {
    throw new Error('A JWT has three parts separated by dots: header.payload.signature');
  }
  let header: unknown;
  let payload: unknown;
  try {
    header = JSON.parse(decodeBase64Url(parts[0]));
    payload = JSON.parse(decodeBase64Url(parts[1]));
  } catch {
    throw new Error('The header or payload is not valid Base64URL JSON — check the token.');
  }
  if (typeof header !== 'object' || header === null || Array.isArray(header)) {
    throw new Error('The JWT header is not a JSON object.');
  }
  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
    throw new Error('The JWT payload is not a JSON object.');
  }
  const decoded: JwtDecoded = {
    header: header as Record<string, unknown>,
    payload: payload as Record<string, unknown>,
    signature: parts[2],
  };
  const exp = (payload as Record<string, unknown>).exp;
  if (typeof exp === 'number') {
    const date = new Date(exp * 1000);
    decoded.expiresAt = date.toISOString();
    decoded.expired = date.getTime() < Date.now();
  }
  return decoded;
}
