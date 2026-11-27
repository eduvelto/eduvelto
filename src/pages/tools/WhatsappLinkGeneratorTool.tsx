// Eduvelto — WhatsApp Link Generator tool UI.
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Pure logic lives in src/lib/tools — this file is presentation only.
// All processing is 100% in-browser; nothing is uploaded.

import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, CopyButton, ButtonRow, ClearButton, ExampleButton, shortInputStyle, labelStyle, cardStyle, buttonStyle, noteStyle } from './toolUi';
import { buildWhatsAppLink } from '../../lib/tools/whatsappLink';


const resultStyle: CSSProperties = {
  marginTop: 14,
  padding: '18px 16px',
  borderRadius: 12,
  background: 'var(--teal-soft)',
  boxShadow: 'var(--shadow-sm)',
};

const errorStyle: CSSProperties = {
  marginTop: 12,
  padding: '10px 12px',
  borderRadius: 8,
  background: '#fef2f2',
  color: '#991b1b',
  fontSize: 14,
};

export function WhatsappLinkGeneratorTool() {
  const { t } = useLanguage();
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const link = useMemo(() => {
    if (phone.trim() === '') return { text: '', error: '' };
    try {
      return { text: buildWhatsAppLink(phone, message), error: '' };
    } catch (err) {
      return { text: '', error: err instanceof Error ? err.message : '' };
    }
  }, [phone, message]);
  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="হোয়াটসঅ্যাপ লিংক জেনারেটর" titleEn="WhatsApp Link Generator" descBn="ফোন নম্বর ও বার্তা দিয়ে হোয়াটসঅ্যাপে সরাসরি চ্যাটের লিংক বানান।" descEn="Create a direct WhatsApp chat link from a phone number and a message." chipBn="১০০% ব্রাউজারেই — কিছু পাঠানো হয় না" chipEn="100% in-browser — nothing is sent" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
        <div>
          <label style={labelStyle} htmlFor="wa-phone">{t({ bn: 'ফোন নম্বর (দেশের কোডসহ বা 0 দিয়ে)', en: 'Phone number (with country code, or starting with 0)' })}</label>
          <input id="wa-phone" style={shortInputStyle} inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01712345678" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="wa-msg">{t({ bn: 'বার্তা (ঐচ্ছিক)', en: 'Message (optional)' })}</label>
          <input id="wa-msg" style={shortInputStyle} value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t({ bn: 'আসসালামু আলাইকুম', en: 'Hello' })} />
        </div>
      </div>
      <p style={noteStyle}>{t({ bn: '0 দিয়ে শুরু করলে বাংলাদেশের নম্বর ধরা হবে (0 → 880)।', en: 'A number starting with 0 is treated as a Bangladesh number (0 → 880).' })}</p>
      {link.error ? <div style={errorStyle} role="alert">{link.error}</div> : null}
      {link.text ? (
        <div style={{ ...resultStyle, wordBreak: 'break-all' }} role="status">
          <div style={{ fontSize: 15, fontWeight: 600 }}>{link.text}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            <CopyButton text={link.text} />
            <a href={link.text} target="_blank" rel="noreferrer" style={{ ...buttonStyle, display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>{t({ bn: 'হোয়াটসঅ্যাপে খুলুন', en: 'Open in WhatsApp' })}</a>
          </div>
        </div>
      ) : null}
      <ButtonRow>
        <ExampleButton onLoad={() => { setPhone('01712345678'); setMessage('আসসালামু আলাইকুম, Eduvelto সম্পর্কে জানতে চাই।'); }} />
        <ClearButton onClear={() => { setPhone(''); setMessage(''); }} disabled={phone === '' && message === ''} />
      </ButtonRow>
    </section>
  );
}
