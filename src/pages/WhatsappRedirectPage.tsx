// Eduvelto — /whatsapp branded redirect (owner 25 Nov 2026 10:19).
//
// Visitors see and click ONLY eduvelto.com/whatsapp — the raw number
// never appears in any link text or button. In production the
// firebase.json hosting redirect (302) handles this path before the
// SPA loads; this route is the dev/preview fallback (vite preview
// does not read firebase.json) and the safety net if hosting ever
// serves the SPA for this path.
//
// Target: the WhatsApp Business short link (wa.me/message/...) when
// the owner sends it, else the number link. PENDING short link —
// QPG_WHATSAPP_SHORT_LINK is null until then; do NOT invent one.
import { useEffect } from 'react';
import {
  QPG_WHATSAPP_SHORT_LINK,
  QPG_WHATSAPP_TARGET_URL,
  QPG_WHATSAPP_USERNAME,
} from '../lib/questionPaper';

export function qpgWhatsappRedirectTarget(): string {
  return QPG_WHATSAPP_SHORT_LINK ?? QPG_WHATSAPP_TARGET_URL;
}

export default function WhatsappRedirectPage() {
  useEffect(() => {
    window.location.replace(qpgWhatsappRedirectTarget());
  }, []);
  return (
    <main style={{ maxWidth: 560, margin: '0 auto', padding: '48px 16px', textAlign: 'center' }}>
      <h1 style={{ fontSize: 20 }}>WhatsApp-এ যাওয়া হচ্ছে…</h1>
      <p style={{ fontSize: 14, color: '#555' }}>
        স্বয়ংক্রিয়ভাবে না গেলে নিচের লিংকে চাপুন — পেমেন্টের পর TrxID + পাঠানো bKash/Nagad নম্বরের শেষ ৩
        সংখ্যা পাঠাবেন।
      </p>
      <a href={qpgWhatsappRedirectTarget()} style={{ fontSize: 15, fontWeight: 700 }}>
        WhatsApp-এ মেসেজ করুন — {QPG_WHATSAPP_USERNAME}
      </a>
    </main>
  );
}
