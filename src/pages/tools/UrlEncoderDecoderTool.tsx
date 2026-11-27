// Eduvelto — URL Encoder & Decoder tool UI.
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Pure logic lives in src/lib/tools — this file is presentation only.
// All processing is 100% in-browser; nothing is uploaded.

import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, CopyButton, Tiles, ButtonRow, ClearButton, ExampleButton, inputStyle, shortInputStyle, labelStyle, cardStyle, buttonStyle, activeButtonStyle } from './toolUi';
import { encodeUrl, decodeUrl, buildUtmUrl, parseUrlParts } from '../../lib/tools/urlTools';


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

export function UrlEncoderDecoderTool() {
  const { t } = useLanguage();
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [source, setSource] = useState('');
  const [medium, setMedium] = useState('');
  const [campaign, setCampaign] = useState('');
  const [utmResult, setUtmResult] = useState('');
  const [utmError, setUtmError] = useState('');
  const output = useMemo(() => {
    if (input === '') return { text: '', error: '' };
    try {
      return { text: mode === 'encode' ? encodeUrl(input) : decodeUrl(input), error: '' };
    } catch (err) {
      return { text: '', error: err instanceof Error ? err.message : 'Could not convert.' };
    }
  }, [input, mode]);
  const parts = useMemo(() => parseUrlParts(input), [input]);
  const buildUtm = () => {
    try {
      setUtmResult(buildUtmUrl(input, { source, medium, campaign }));
      setUtmError('');
    } catch (err) {
      setUtmError(err instanceof Error ? err.message : '');
      setUtmResult('');
    }
  };
  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="ইউআরএল এনকোডার ও ডিকোডার" titleEn="URL Encoder & Decoder" descBn="URL এনকোড করুন, ডিকোড করুন ও UTM প্যারামিটার যোগ করুন।" descEn="Encode or decode a URL and add UTM parameters." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }} role="group" aria-label={t({ bn: 'ধরন', en: 'Mode' })}>
        <button type="button" style={mode === 'encode' ? activeButtonStyle : buttonStyle} aria-pressed={mode === 'encode'} onClick={() => setMode('encode')}>{t({ bn: 'এনকোড', en: 'Encode' })}</button>
        <button type="button" style={mode === 'decode' ? activeButtonStyle : buttonStyle} aria-pressed={mode === 'decode'} onClick={() => setMode('decode')}>{t({ bn: 'ডিকোড', en: 'Decode' })}</button>
      </div>
      <div>
        <label style={labelStyle} htmlFor="url-input">{t({ bn: 'URL বা লেখা', en: 'URL or text' })}</label>
        <textarea id="url-input" style={inputStyle} value={input} onChange={(e) => setInput(e.target.value)} placeholder="https://eduvelto.com/tools?search=বাংলা বই" />
      </div>
      {parts ? (
        <Tiles items={[
          { labelBn: 'হোস্ট', labelEn: 'Host', value: parts.host },
          { labelBn: 'পথ', labelEn: 'Path', value: parts.path || '/' },
          { labelBn: 'কোয়েরি', labelEn: 'Query', value: parts.query || '—' },
        ]} />
      ) : null}
      {output.error ? <div style={errorStyle} role="alert">{output.error}</div> : null}
      <div style={{ marginTop: 12 }}>
        <label style={labelStyle} htmlFor="url-output">{t({ bn: 'ফলাফল', en: 'Result' })}</label>
        <textarea id="url-output" style={{ ...outputStyle, fontFamily: 'monospace' }} value={output.text} readOnly aria-readonly="true" />
      </div>
      <ButtonRow>
        <CopyButton text={output.text} />
        <ExampleButton onLoad={() => { setMode('encode'); setInput('https://eduvelto.com/tools?search=বাংলা বই'); }} />
        <ClearButton onClear={() => setInput('')} disabled={input === ''} />
      </ButtonRow>
      <div style={{ marginTop: 20, borderTop: '1px solid var(--line)', paddingTop: 16 }}>
        <h3 style={{ fontSize: 17, margin: '0 0 10px' }}>{t({ bn: 'UTM প্যারামিটার যোগ করুন', en: 'Add UTM parameters' })}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          <div><label style={labelStyle} htmlFor="utm-source">utm_source</label><input id="utm-source" style={shortInputStyle} value={source} onChange={(e) => setSource(e.target.value)} placeholder="facebook" /></div>
          <div><label style={labelStyle} htmlFor="utm-medium">utm_medium</label><input id="utm-medium" style={shortInputStyle} value={medium} onChange={(e) => setMedium(e.target.value)} placeholder="social" /></div>
          <div><label style={labelStyle} htmlFor="utm-campaign">utm_campaign</label><input id="utm-campaign" style={shortInputStyle} value={campaign} onChange={(e) => setCampaign(e.target.value)} placeholder="launch" /></div>
        </div>
        <ButtonRow>
          <button type="button" style={buttonStyle} onClick={buildUtm}>{t({ bn: 'UTM লিংক বানান', en: 'Build UTM link' })}</button>
          {utmResult ? <CopyButton text={utmResult} /> : null}
        </ButtonRow>
        {utmError ? <div style={errorStyle} role="alert">{utmError}</div> : null}
        {utmResult ? <div style={{ ...resultStyle, wordBreak: 'break-all' }}>{utmResult}</div> : null}
      </div>
    </section>
  );
}
