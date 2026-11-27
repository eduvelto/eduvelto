/**
 * WhatsApp Link Generator — pure functions. Builds a wa.me link from a
 * phone number and message. A leading 0 is treated as a Bangladesh local
 * number (0 -> 880); any other number is used as-is after stripping
 * spaces, dashes and a leading +. Nothing is sent.
 */
export function normalizePhone(raw: string): string {
  let digits = raw.replace(/[^\d]/g, '');
  if (digits.startsWith('0')) digits = `880${digits.slice(1)}`;
  return digits;
}

export function buildWhatsAppLink(phone: string, message: string): string {
  const digits = normalizePhone(phone);
  if (!/^\d{8,15}$/.test(digits)) {
    throw new Error('Enter a valid phone number with country code (e.g. 8801712345678) or a local number starting with 0.');
  }
  const base = `https://wa.me/${digits}`;
  return message.trim() ? `${base}?text=${encodeURIComponent(message.trim())}` : base;
}
