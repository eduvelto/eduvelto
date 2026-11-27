// Eduvelto — HTML Entity Encoder & Decoder tool UI (27 Nov 2026).
// Convert characters to HTML entities and back, both directions.
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, CopyButton, ButtonRow, ClearButton, ExampleButton, inputStyle, labelStyle, cardStyle, noteStyle, buttonStyle, primaryButtonStyle } from './toolUi';
import { decodeHtmlEntities, encodeHtmlEntities, encodeHtmlEntitiesNumeric } from '../../lib/tools/mainTablesTools';

const resultStyle: CSSProperties = { marginTop: 14, padding: '18px 16px', borderRadius: 12, background: 'var(--teal-soft)', boxShadow: 'var(--shadow-sm)' };

type Mode = 'encode' | 'encode-numeric' | 'decode';

export function HtmlEntityTool() {
  const { t } = useLanguage();
  const [mode, setMode] = useState<Mode>('encode');
  const [input, setInput] = useState('<p class="hi">Tom & Jerry — 5 > 3</p>');
  const output = useMemo(() => {
    if (input === '') return '';
    if (mode === 'encode') return encodeHtmlEntities(input);
    if (mode === 'encode-numeric') return encodeHtmlEntitiesNumeric(input);
    return decodeHtmlEntities(input);
  }, [input, mode]);

  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="HTML এনটিটি এনকোডার ও ডিকোডার" titleEn="HTML Entity Encoder & Decoder" descBn="অক্ষরকে HTML এনটিটিতে বদলান, আবার এনটিটি থেকে আসল অক্ষরে ফিরিয়ে আনুন।" descEn="Convert characters to HTML entities and back again." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <button type="button" style={mode === 'encode' ? primaryButtonStyle : buttonStyle} onClick={() => setMode('encode')}>{t({ bn: 'এনকোড (নামসহ)', en: 'Encode (named)' })}</button>
        <button type="button" style={mode === 'encode-numeric' ? primaryButtonStyle : buttonStyle} onClick={() => setMode('encode-numeric')}>{t({ bn: 'এনকোড (সংখ্যাসহ)', en: 'Encode (numeric)' })}</button>
        <button type="button" style={mode === 'decode' ? primaryButtonStyle : buttonStyle} onClick={() => setMode('decode')}>{t({ bn: 'ডিকোড', en: 'Decode' })}</button>
      </div>
      <div>
        <label style={labelStyle} htmlFor="html-entity-input">{t({ bn: mode === 'decode' ? 'HTML এনটিটিসহ লেখা দিন' : 'লেখা দিন', en: mode === 'decode' ? 'Enter text with HTML entities' : 'Enter text' })}</label>
        <textarea id="html-entity-input" style={inputStyle} value={input} onChange={(e) => setInput(e.target.value)} placeholder={mode === 'decode' ? '&lt;p&gt;Tom &amp; Jerry&lt;/p&gt;' : '<p>Tom & Jerry</p>'} />
      </div>
      <ButtonRow>
        <ExampleButton onLoad={() => setInput(mode === 'decode' ? '&lt;p class=&quot;hi&quot;&gt;Tom &amp; Jerry &mdash; 5 &gt; 3&lt;/p&gt;' : '<p class="hi">Tom & Jerry — 5 > 3</p>')} />
        <ClearButton onClear={() => setInput('')} />
      </ButtonRow>
      {output !== '' ? (
        <div style={resultStyle} role="status">
          <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{t({ bn: 'ফলাফল', en: 'Result' })}</p>
          <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{output}</p>
          <ButtonRow><CopyButton text={output} labelBn="ফলাফল কপি করুন" labelEn="Copy result" /></ButtonRow>
        </div>
      ) : null}
      <p style={noteStyle}>{t({ bn: 'নামসহ এনকোডে &, <, >, " ও \' বদলে &amp;, &lt;, &gt;, &quot;, &apos; হয়। সংখ্যাসহ এনকোডে বাংলা-সহ সব অ-ইংরেজি অক্ষরও &#সংখ্যা; আকারে বদলায়। অচেনা এনটিটি ডিকোডে যেমন আছে তেমনই থাকে।', en: 'Named encoding turns &, <, >, " and \' into &amp;, &lt;, &gt;, &quot; and &apos;. Numeric encoding also turns every non-English character (including Bangla) into &#number;. Unknown entities are left as they are when decoding.' })}</p>
    </section>
  );
}
