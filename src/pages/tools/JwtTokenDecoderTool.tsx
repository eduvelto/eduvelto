// Eduvelto — JWT Token Decoder tool UI.
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Pure logic lives in src/lib/tools — this file is presentation only.
// All processing is 100% in-browser; nothing is uploaded.

import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, CopyButton, Tiles, ButtonRow, ClearButton, ExampleButton, inputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { decodeJwt } from '../../lib/tools/jwtDecoder';


const outputStyle: CSSProperties = {
  width: '100%',
  minHeight: 120,
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid var(--line)',
  fontSize: 15,
  boxSizing: 'border-box',
  background: 'var(--teal-soft)',
  color: 'var(--heading)',
  fontFamily: 'inherit',
  resize: 'vertical',
};

const errorStyle: CSSProperties = {
  marginTop: 12,
  padding: '10px 12px',
  borderRadius: 8,
  background: '#fef2f2',
  color: '#991b1b',
  fontSize: 14,
};

export function JwtTokenDecoderTool() {
  const { t } = useLanguage();
  const [input, setInput] = useState('');
  const decoded = useMemo(() => {
    if (input.trim() === '') return { data: null as ReturnType<typeof decodeJwt> | null, error: '' };
    try {
      return { data: decodeJwt(input), error: '' };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : '' };
    }
  }, [input]);
  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="জেডব্লিউটি টোকেন ডিকোডার" titleEn="JWT Token Decoder" descBn="JWT টোকেনের ভেতরের তথ্য ডিকোড করে দেখুন — টোকেন কোথাও পাঠানো হয় না।" descEn="Decode a JWT token to see the information inside it — the token is never sent anywhere." chipBn="স্বাক্ষর যাচাই করা হয় না — ডিকোড মানেই বৈধ নয়" chipEn="Signature is NOT verified — decoding is not validation" />
      <div>
        <label style={labelStyle} htmlFor="jwt-input">{t({ bn: 'JWT টোকেন পেস্ট করুন', en: 'Paste a JWT token' })}</label>
        <textarea id="jwt-input" style={{ ...inputStyle, fontFamily: 'monospace' }} value={input} onChange={(e) => setInput(e.target.value)} placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.signature" />
      </div>
      <p style={noteStyle}>{t({ bn: 'টোকেনটি আপনার ডিভাইসেই ডিকোড হয়, কোথাও পাঠানো হয় না। আসল টোকেন (বিশেষ করে অন্যের) এখানে পেস্ট করা নিরাপদ নয় — শুধু পরীক্ষার টোকেন ব্যবহার করুন।', en: 'The token is decoded on your device and never sent anywhere. Pasting a real token (especially someone else’s) is still not safe — use a test token only.' })}</p>
      {decoded.error ? <div style={errorStyle} role="alert">{decoded.error}</div> : null}
      {decoded.data ? (
        <>
          <Tiles items={[
            { labelBn: 'অ্যালগরিদম', labelEn: 'Algorithm', value: String(decoded.data.header.alg ?? '—') },
            { labelBn: 'মেয়াদ শেষ', labelEn: 'Expires', value: decoded.data.expiresAt ? new Date(decoded.data.expiresAt).toLocaleString() : t({ bn: 'নেই', en: 'None' }) },
            { labelBn: 'মেয়াদোত্তীর্ণ?', labelEn: 'Expired?', value: decoded.data.expired === undefined ? '—' : decoded.data.expired ? t({ bn: 'হ্যাঁ', en: 'Yes' }) : t({ bn: 'না', en: 'No' }) },
          ]} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, marginTop: 12 }}>
            <div>
              <label style={labelStyle}>Header</label>
              <pre style={{ ...outputStyle, fontFamily: 'monospace', fontSize: 13, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{JSON.stringify(decoded.data.header, null, 2)}</pre>
              <div style={{ marginTop: 8 }}><CopyButton text={JSON.stringify(decoded.data.header, null, 2)} /></div>
            </div>
            <div>
              <label style={labelStyle}>Payload</label>
              <pre style={{ ...outputStyle, fontFamily: 'monospace', fontSize: 13, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{JSON.stringify(decoded.data.payload, null, 2)}</pre>
              <div style={{ marginTop: 8 }}><CopyButton text={JSON.stringify(decoded.data.payload, null, 2)} /></div>
            </div>
          </div>
          <p style={noteStyle}>{t({ bn: 'স্বাক্ষর (signature) এখানে যাচাই করা হয় না। ডিকোড করা মানেই টোকেনটি বৈধ বা বিশ্বাসযোগ্য নয় — যে কেউ এমন টোকেন বানাতে পারে।', en: 'The signature is NOT verified here. Decoding does not mean the token is valid or trustworthy — anyone can make a token like this.' })}</p>
        </>
      ) : null}
      <ButtonRow>
        <ExampleButton onLoad={() => setInput('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJuYW1lIjoiTWl6YW4iLCJpYXQiOjE1MTYyMzkwMjJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c')} />
        <ClearButton onClear={() => setInput('')} disabled={input === ''} />
      </ButtonRow>
    </section>
  );
}
