// Eduvelto — Base64 Encoder & Decoder tool UI.
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Pure logic lives in src/lib/tools — this file is presentation only.
// All processing is 100% in-browser; nothing is uploaded.

import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, CopyButton, ButtonRow, ClearButton, ExampleButton, inputStyle, labelStyle, cardStyle, buttonStyle, activeButtonStyle, noteStyle } from './toolUi';
import { encodeBase64, decodeBase64, encodeBase64Url, decodeBase64Url } from '../../lib/tools/base64';


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

export function Base64EncoderDecoderTool() {
  const { t } = useLanguage();
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [variant, setVariant] = useState<'standard' | 'url'>('standard');
  const output = useMemo(() => {
    if (input === '') return { text: '', error: '' };
    try {
      if (mode === 'encode') return { text: variant === 'url' ? encodeBase64Url(input) : encodeBase64(input), error: '' };
      return { text: variant === 'url' ? decodeBase64Url(input) : decodeBase64(input), error: '' };
    } catch (err) {
      return { text: '', error: err instanceof Error ? err.message : 'Could not convert.' };
    }
  }, [input, mode, variant]);
  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="বেস৬৪ এনকোডার ও ডিকোডার" titleEn="Base64 Encoder & Decoder" descBn="লেখাকে Base64-এ এনকোড করুন বা Base64 থেকে ডিকোড করুন।" descEn="Encode text to Base64 or decode Base64 back to text." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }} role="group" aria-label={t({ bn: 'ধরন', en: 'Mode' })}>
        <button type="button" style={mode === 'encode' ? activeButtonStyle : buttonStyle} aria-pressed={mode === 'encode'} onClick={() => setMode('encode')}>{t({ bn: 'এনকোড', en: 'Encode' })}</button>
        <button type="button" style={mode === 'decode' ? activeButtonStyle : buttonStyle} aria-pressed={mode === 'decode'} onClick={() => setMode('decode')}>{t({ bn: 'ডিকোড', en: 'Decode' })}</button>
        <button type="button" style={variant === 'standard' ? activeButtonStyle : buttonStyle} aria-pressed={variant === 'standard'} onClick={() => setVariant('standard')}>Base64</button>
        <button type="button" style={variant === 'url' ? activeButtonStyle : buttonStyle} aria-pressed={variant === 'url'} onClick={() => setVariant('url')}>Base64URL</button>
      </div>
      <div>
        <label style={labelStyle} htmlFor="b64-input">{mode === 'encode' ? t({ bn: 'লেখা', en: 'Text' }) : t({ bn: 'Base64 লেখা', en: 'Base64 text' })}</label>
        <textarea id="b64-input" style={inputStyle} value={input} onChange={(e) => setInput(e.target.value)} placeholder={mode === 'encode' ? 'hello world' : 'aGVsbG8gd29ybGQ='} />
      </div>
      {output.error ? <div style={errorStyle} role="alert">{output.error}</div> : null}
      <div style={{ marginTop: 12 }}>
        <label style={labelStyle} htmlFor="b64-output">{t({ bn: 'ফলাফল', en: 'Result' })}</label>
        <textarea id="b64-output" style={{ ...outputStyle, fontFamily: 'monospace' }} value={output.text} readOnly aria-readonly="true" />
      </div>
      <ButtonRow>
        <CopyButton text={output.text} />
        <ExampleButton onLoad={() => { setMode('encode'); setVariant('standard'); setInput('আমি বাংলা ভালোবাসি'); }} />
        <ClearButton onClear={() => setInput('')} disabled={input === ''} />
      </ButtonRow>
      <p style={noteStyle}>{t({ bn: 'Base64 এনকোড করা এনক্রিপশন নয় — যে কেউ ডিকোড করতে পারে। গোপন তথ্য এভাবে লুকাবেন না।', en: 'Base64 is not encryption — anyone can decode it. Do not use it to hide secrets.' })}</p>
    </section>
  );
}
