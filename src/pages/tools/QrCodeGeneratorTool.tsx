// Eduvelto — QR Code Generator tool UI (landed 27 Nov 2026, A-tools).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Engine: buildQrPayload() + generateQrDataUrl()/generateQrSvg() in src/lib/tools/qrBarcode.ts; qrcode loads via dynamic import() only. 100% in-browser; nothing is uploaded.
import { useRef, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import RewardedAdButton from '../../components/RewardedAdButton';
import {ToolHero, CopyButton, ButtonRow, inputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { buildQrPayload, checkQrLength, qrContrastOk, type QrContentKind, type QrErrorCorrection } from '../../lib/tools/qrBarcode';
import { generateQrDataUrl, generateQrSvg } from '../../lib/tools/qrBarcode';


const errorStyle: CSSProperties = {
  marginTop: 14,
  color: '#b3261e',
  fontSize: 14,
};



function downloadText(filename: string, text: string, type = 'text/plain'): void {
  const blob = new Blob([text], { type: `${type};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}


const KINDS: readonly { id: QrContentKind; bn: string; en: string }[] = [
  { id: 'text', bn: 'লেখা', en: 'Text' },
  { id: 'url', bn: 'ওয়েব লিংক', en: 'Web link' },
  { id: 'wifi', bn: 'ওয়াই-ফাই', en: 'Wi-Fi' },
  { id: 'tel', bn: 'ফোন', en: 'Phone' },
  { id: 'sms', bn: 'এসএমএস', en: 'SMS' },
  { id: 'email', bn: 'ইমেইল', en: 'Email' },
  { id: 'vcard', bn: 'যোগাযোগ (vCard)', en: 'Contact (vCard)' },
];

export function QrCodeGeneratorTool() {
  const { t, lang } = useLanguage();
  const [kind, setKind] = useState<QrContentKind>('url');
  const [text, setText] = useState('https://eduvelto.com');
  const [ssid, setSsid] = useState('');
  const [wifiPass, setWifiPass] = useState('');
  const [encryption, setEncryption] = useState('WPA');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [name, setName] = useState('');
  const [size, setSize] = useState(512);
  const [level, setLevel] = useState<QrErrorCorrection>('M');
  const [dark, setDark] = useState('#000000');
  const [light, setLight] = useState('#ffffff');
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const downloadRef = useRef<HTMLAnchorElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  const payload = useMemo(() => {
    try {
      return buildQrPayload(kind, { text, ssid, password: wifiPass, encryption, phone, message, email, subject, body: message, name });
    } catch (e) {
      return null;
    }
  }, [kind, text, ssid, wifiPass, encryption, phone, message, email, subject, name]);

  useEffect(() => {
    if (payload === null) { setDataUrl(null); setError(null); return; }
    let cancelled = false;
    const id = window.setTimeout(() => {
      try {
        checkQrLength(payload, level);
        void generateQrDataUrl(payload, { sizePx: size, errorCorrection: level, darkColor: dark, lightColor: light }).then((url) => {
          if (!cancelled) { setDataUrl(url); setError(null); }
        }).catch((e: unknown) => {
          if (!cancelled) setError(e instanceof Error ? e.message : 'Could not draw the QR code');
        });
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Could not draw the QR code');
      }
    }, 300);
    return () => { cancelled = true; window.clearTimeout(id); };
  }, [payload, size, level, dark, light]);

  const contrastOk = qrContrastOk(dark, light);

  async function downloadSvg(): Promise<void> {
    if (payload === null) return;
    try {
      const svg = await generateQrSvg(payload, { sizePx: size, errorCorrection: level, darkColor: dark, lightColor: light });
      downloadText('eduvelto-qr.svg', svg, 'image/svg+xml');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create the SVG');
    }
  }

  const tabStyle = (active: boolean): CSSProperties => ({
    minHeight: 40, padding: '0 14px', borderRadius: 8, border: '1px solid var(--line)',
    background: active ? 'var(--teal)' : 'var(--surface)', color: active ? '#fff' : 'var(--heading)', cursor: 'pointer', fontWeight: 600,
  });

  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="কিউআর কোড জেনারেটর" titleEn="QR Code Generator" descBn="লিংক, ওয়াই-ফাই, ফোন বা লেখা থেকে কিউআর কোড বানান — PNG ও SVG ডাউনলোডসহ।" descEn="Make a QR code from a link, Wi-Fi, phone number or text — with PNG and SVG download." chipBn="কিউআর আপনার ব্রাউজারেই আঁকা হয় — লেখা কোথাও যায় না" chipEn="The QR is drawn in your browser — your text never leaves the device" />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {KINDS.map((k) => (
          <button key={k.id} type="button" style={tabStyle(kind === k.id)} onClick={() => setKind(k.id)}>{t({ bn: k.bn, en: k.en })}</button>
        ))}
      </div>
      {kind === 'text' || kind === 'url' ? (
        <div>
          <label style={labelStyle} htmlFor="qr-text">{kind === 'url' ? t({ bn: 'ওয়েব ঠিকানা (https:// দিয়ে)', en: 'Web address (starting with https://)' }) : t({ bn: 'লেখা', en: 'Text' })}</label>
          <input id="qr-text" style={inputStyle} type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder={kind === 'url' ? 'https://eduvelto.com' : 'Type something…'} />
        </div>
      ) : null}
      {kind === 'wifi' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          <div>
            <label style={labelStyle} htmlFor="qr-ssid">{t({ bn: 'ওয়াই-ফাইয়ের নাম (SSID)', en: 'Wi-Fi name (SSID)' })}</label>
            <input id="qr-ssid" style={inputStyle} type="text" value={ssid} onChange={(e) => setSsid(e.target.value)} placeholder="HomeNet" />
          </div>
          <div>
            <label style={labelStyle} htmlFor="qr-wifipass">{t({ bn: 'পাসওয়ার্ড', en: 'Password' })}</label>
            <input id="qr-wifipass" style={inputStyle} type="text" value={wifiPass} onChange={(e) => setWifiPass(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle} htmlFor="qr-enc">{t({ bn: 'নিরাপত্তা', en: 'Security' })}</label>
            <select id="qr-enc" style={inputStyle} value={encryption} onChange={(e) => setEncryption(e.target.value)}>
              <option value="WPA">WPA/WPA2</option>
              <option value="WEP">WEP</option>
              <option value="nopass">{t({ bn: 'পাসওয়ার্ড নেই', en: 'No password' })}</option>
            </select>
          </div>
        </div>
      ) : null}
      {kind === 'tel' || kind === 'sms' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          <div>
            <label style={labelStyle} htmlFor="qr-phone">{t({ bn: 'ফোন নম্বর', en: 'Phone number' })}</label>
            <input id="qr-phone" style={inputStyle} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01712345678" />
          </div>
          {kind === 'sms' ? (
            <div>
              <label style={labelStyle} htmlFor="qr-msg">{t({ bn: 'বার্তা (ঐচ্ছিক)', en: 'Message (optional)' })}</label>
              <input id="qr-msg" style={inputStyle} type="text" value={message} onChange={(e) => setMessage(e.target.value)} />
            </div>
          ) : null}
        </div>
      ) : null}
      {kind === 'email' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          <div>
            <label style={labelStyle} htmlFor="qr-email">{t({ bn: 'ইমেইল ঠিকানা', en: 'Email address' })}</label>
            <input id="qr-email" style={inputStyle} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
          </div>
          <div>
            <label style={labelStyle} htmlFor="qr-subject">{t({ bn: 'বিষয় (ঐচ্ছিক)', en: 'Subject (optional)' })}</label>
            <input id="qr-subject" style={inputStyle} type="text" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle} htmlFor="qr-body">{t({ bn: 'বার্তা (ঐচ্ছিক)', en: 'Message (optional)' })}</label>
            <input id="qr-body" style={inputStyle} type="text" value={message} onChange={(e) => setMessage(e.target.value)} />
          </div>
        </div>
      ) : null}
      {kind === 'vcard' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          <div>
            <label style={labelStyle} htmlFor="qr-name">{t({ bn: 'নাম', en: 'Name' })}</label>
            <input id="qr-name" style={inputStyle} type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Rahim Uddin" />
          </div>
          <div>
            <label style={labelStyle} htmlFor="qr-vphone">{t({ bn: 'ফোন (ঐচ্ছিক)', en: 'Phone (optional)' })}</label>
            <input id="qr-vphone" style={inputStyle} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle} htmlFor="qr-vemail">{t({ bn: 'ইমেইল (ঐচ্ছিক)', en: 'Email (optional)' })}</label>
            <input id="qr-vemail" style={inputStyle} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>
      ) : null}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginTop: 12 }}>
        <div>
          <label style={labelStyle} htmlFor="qr-size">{t({ bn: 'আকার (পিক্সেল)', en: 'Size (pixels)' })}</label>
          <select id="qr-size" style={inputStyle} value={size} onChange={(e) => setSize(Number(e.target.value))}>
            <option value={256}>256</option>
            <option value={512}>512</option>
            <option value={1024}>1024</option>
          </select>
        </div>
        <div>
          <label style={labelStyle} htmlFor="qr-level">{t({ bn: 'ভুল-সংশোধন স্তর', en: 'Error-correction level' })}</label>
          <select id="qr-level" style={inputStyle} value={level} onChange={(e) => setLevel(e.target.value as QrErrorCorrection)}>
            <option value="L">L — {t({ bn: 'সবচেয়ে বেশি তথ্য', en: 'most data' })}</option>
            <option value="M">M — {t({ bn: 'সাধারণ', en: 'standard' })}</option>
            <option value="Q">Q — {t({ bn: 'বেশি সহনশীল', en: 'more tolerant' })}</option>
            <option value="H">H — {t({ bn: 'সবচেয়ে সহনশীল', en: 'most tolerant' })}</option>
          </select>
        </div>
        <div>
          <label style={labelStyle} htmlFor="qr-dark">{t({ bn: 'গাঢ় রং', en: 'Dark colour' })}</label>
          <input id="qr-dark" style={inputStyle} type="color" value={dark} onChange={(e) => setDark(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle} htmlFor="qr-light">{t({ bn: 'হালকা রং', en: 'Light colour' })}</label>
          <input id="qr-light" style={inputStyle} type="color" value={light} onChange={(e) => setLight(e.target.value)} />
        </div>
      </div>
      {!contrastOk ? <p style={errorStyle} role="alert">{t({ bn: 'দুটি রং কাছাকাছি — স্ক্যানার পড়তে না-ও পারে। রংয়ের পার্থক্য বাড়ান।', en: 'The two colours are too close — scanners may fail. Increase the contrast.' })}</p> : null}
      {payload === null ? (
        <p style={errorStyle} role="alert">{t({ bn: 'প্রয়োজনীয় তথ্য দিন — যেমন ওয়াই-ফাইয়ের নাম বা ফোন নম্বর।', en: 'Fill in the required field — e.g. the Wi-Fi name or phone number.' })}</p>
      ) : null}
      {error ? <p style={errorStyle} role="alert">{error}</p> : null}
      {dataUrl ? (
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <img src={dataUrl} alt={t({ bn: 'তৈরি করা কিউআর কোড', en: 'Generated QR code' })} style={{ width: 256, height: 256, imageRendering: 'pixelated', border: '1px solid var(--line)', borderRadius: 12, background: light }} />
          <ButtonRow>
            <a ref={downloadRef} href={dataUrl} download="eduvelto-qr.png" style={{ display: 'none' }} aria-hidden="true" tabIndex={-1} />
            {/* Ads rollout B3 (27 Nov 2026): this download goes through RewardedAdButton (15s) — Free Download is live, the 15s Unlock stays disabled until AdSense approval (never a fake timer). PNG download. */}
            <RewardedAdButton lang={lang} durationSeconds={15} onFreeDownload={() => downloadRef.current?.click()} />
            {/* Ads rollout B3 (27 Nov 2026): this download goes through RewardedAdButton (15s) — Free Download is live, the 15s Unlock stays disabled until AdSense approval (never a fake timer). SVG download. */}
            <RewardedAdButton lang={lang} durationSeconds={15} onFreeDownload={() => void downloadSvg()} />
            <CopyButton text={payload ?? ''} labelBn="লেখাটি কপি করুন" labelEn="Copy the text" />
          </ButtonRow>
        </div>
      ) : null}
      <p style={noteStyle}>{t({ bn: 'ভুল-সংশোধন স্তর বেশি হলে কিউআর কোডের কিছু অংশ নষ্ট হলেও পড়া যায়, তবে কম তথ্য ধরে। লেখা খুব লম্বা হলে স্তর L বাছুন বা লেখা ছোট করুন।', en: 'A higher error-correction level survives damage but holds less data. If the text is very long, pick level L or shorten it.' })}</p>
    </section>
  );
}
