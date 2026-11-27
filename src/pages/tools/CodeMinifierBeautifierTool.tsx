// Eduvelto — Code Minifier & Beautifier tool UI.
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Pure logic lives in src/lib/tools — this file is presentation only.
// All processing is 100% in-browser; nothing is uploaded.

import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, CopyButton, Tiles, ButtonRow, ClearButton, ExampleButton, inputStyle, labelStyle, cardStyle, buttonStyle, activeButtonStyle, noteStyle } from './toolUi';
import { minifyCode, beautifyCode, type CodeLanguage } from '../../lib/tools/codeFormatter';


const selectStyle: CSSProperties = {
  width: '100%',
  minHeight: 44,
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid var(--line)',
  fontSize: 15,
  boxSizing: 'border-box',
  background: 'var(--surface)',
  color: 'var(--heading)',
};

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

export function CodeMinifierBeautifierTool() {
  const { t } = useLanguage();
  const [input, setInput] = useState('');
  const [lang, setLang] = useState<CodeLanguage>('css');
  const [mode, setMode] = useState<'minify' | 'beautify'>('beautify');
  const output = useMemo(() => {
    if (input.trim() === '') return '';
    try {
      return mode === 'minify' ? minifyCode(input, lang) : beautifyCode(input, lang);
    } catch {
      return '';
    }
  }, [input, lang, mode]);
  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="কোড মিনিফায়ার ও বিউটিফায়ার" titleEn="Code Minifier & Beautifier" descBn="HTML, CSS ও JavaScript কোড ছোট করুন বা সুন্দরভাবে সাজান।" descEn="Minify or neatly format HTML, CSS and JavaScript code." chipBn="সাধারণ ফরম্যাটার — পূর্ণ পার্সার নয়" chipEn="A basic formatter — not a full parser" />
      <div>
        <label style={labelStyle} htmlFor="cm-input">{t({ bn: 'কোড লিখুন বা পেস্ট করুন', en: 'Paste or type code' })}</label>
        <textarea id="cm-input" style={{ ...inputStyle, fontFamily: 'monospace' }} value={input} onChange={(e) => setInput(e.target.value)} placeholder="a { color: red; margin: 0; }" />
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12, alignItems: 'center' }}>
        <select style={{ ...selectStyle, width: 'auto', minHeight: 44 }} value={lang} onChange={(e) => setLang(e.target.value as CodeLanguage)} aria-label={t({ bn: 'ভাষা', en: 'Language' })}>
          <option value="html">HTML</option>
          <option value="css">CSS</option>
          <option value="javascript">JavaScript</option>
        </select>
        <button type="button" style={mode === 'beautify' ? activeButtonStyle : buttonStyle} aria-pressed={mode === 'beautify'} onClick={() => setMode('beautify')}>{t({ bn: 'সাজান', en: 'Beautify' })}</button>
        <button type="button" style={mode === 'minify' ? activeButtonStyle : buttonStyle} aria-pressed={mode === 'minify'} onClick={() => setMode('minify')}>{t({ bn: 'ছোট করুন', en: 'Minify' })}</button>
      </div>
      <Tiles items={[
        { labelBn: 'আগের আকার', labelEn: 'Before', value: `${input.length} ${t({ bn: 'অক্ষর', en: 'chars' })}` },
        { labelBn: 'পরের আকার', labelEn: 'After', value: `${output.length} ${t({ bn: 'অক্ষর', en: 'chars' })}` },
        { labelBn: 'পরিবর্তন', labelEn: 'Change', value: input.length === 0 ? '—' : `${Math.round((1 - output.length / input.length) * 100)}%` },
      ]} />
      <div style={{ marginTop: 12 }}>
        <label style={labelStyle} htmlFor="cm-output">{t({ bn: 'ফলাফল', en: 'Result' })}</label>
        <textarea id="cm-output" style={{ ...outputStyle, fontFamily: 'monospace' }} value={output} readOnly aria-readonly="true" />
      </div>
      <ButtonRow>
        <CopyButton text={output} />
        <ExampleButton onLoad={() => { setLang('css'); setMode('beautify'); setInput('.card { color: #14532d; padding: 16px; margin: 0; } .card h2 { font-size: 20px; }'); }} />
        <ClearButton onClear={() => setInput('')} disabled={input === ''} />
      </ButtonRow>
      <p style={noteStyle}>{t({ bn: 'এটি একটি সাধারণ ফরম্যাটার — কমেন্ট সরানো ও ফাঁকা জায়গা গোছানো হয়, কোডের অর্থ বদলানো হয় না। স্ট্রিংয়ের ভেতরে কমেন্টের মতো লেখা থাকলে সতর্ক থাকুন।', en: 'This is a basic formatter — it removes comments and tidies whitespace without changing what the code means. Be careful if a string contains comment-like text.' })}</p>
    </section>
  );
}
