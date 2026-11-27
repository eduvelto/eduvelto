// Eduvelto — JSON Formatter tool UI.
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Pure logic lives in src/lib/tools — this file is presentation only.
// All processing is 100% in-browser; nothing is uploaded.

import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, CopyButton, ButtonRow, ClearButton, ExampleButton, inputStyle, labelStyle, cardStyle, buttonStyle, activeButtonStyle } from './toolUi';
import { validateJson, formatJson, minifyJson, sortJsonKeys } from '../../lib/tools/jsonFormatter';


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

const errorStyle: CSSProperties = {
  marginTop: 12,
  padding: '10px 12px',
  borderRadius: 8,
  background: '#fef2f2',
  color: '#991b1b',
  fontSize: 14,
};

export function JsonFormatterTool() {
  const { t } = useLanguage();
  const [input, setInput] = useState('');
  const [indent, setIndent] = useState(2);
  const [mode, setMode] = useState<'format' | 'minify' | 'sort'>('format');
  const [error, setError] = useState('');
  const output = useMemo(() => {
    if (input.trim() === '') return '';
    try {
      return mode === 'minify' ? minifyJson(input) : mode === 'sort' ? sortJsonKeys(input) : formatJson(input, indent);
    } catch (err) {
      return '';
    }
  }, [input, indent, mode]);
  const check = useMemo(() => validateJson(input), [input]);
  const run = (nextMode: 'format' | 'minify' | 'sort') => {
    setMode(nextMode);
    const v = validateJson(input);
    setError(v.valid ? '' : (v.error ?? ''));
  };
  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="জেসন ফরম্যাটার" titleEn="JSON Formatter" descBn="JSON ডেটা সাজিয়ে দেখুন ও যাচাই করুন।" descEn="Format and validate JSON data." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div>
        <label style={labelStyle} htmlFor="jf-input">{t({ bn: 'JSON লিখুন বা পেস্ট করুন', en: 'Paste or type JSON' })}</label>
        <textarea id="jf-input" style={inputStyle} value={input} onChange={(e) => { setInput(e.target.value); setError(''); }} placeholder='{"name": "Mizan", "age": 22}' />
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12, alignItems: 'center' }}>
        <button type="button" style={mode === 'format' ? activeButtonStyle : buttonStyle} onClick={() => run('format')}>{t({ bn: 'সাজান', en: 'Format' })}</button>
        <button type="button" style={mode === 'minify' ? activeButtonStyle : buttonStyle} onClick={() => run('minify')}>{t({ bn: 'ছোট করুন', en: 'Minify' })}</button>
        <button type="button" style={mode === 'sort' ? activeButtonStyle : buttonStyle} onClick={() => run('sort')}>{t({ bn: 'কি সাজান', en: 'Sort keys' })}</button>
        <label style={{ fontSize: 14 }}>{t({ bn: 'ইনডেন্ট', en: 'Indent' })}
          <select style={{ ...selectStyle, width: 'auto', minHeight: 44, marginLeft: 6 }} value={indent} onChange={(e) => setIndent(Number(e.target.value))}>
            <option value={2}>2</option>
            <option value={4}>4</option>
          </select>
        </label>
        <span role="status" style={{ fontSize: 14, fontWeight: 700, color: input.trim() === '' ? 'var(--muted)' : check.valid ? '#166534' : '#991b1b' }}>
          {input.trim() === '' ? '' : check.valid ? t({ bn: 'সঠিক JSON', en: 'Valid JSON' }) : t({ bn: 'ভুল JSON', en: 'Invalid JSON' })}
        </span>
      </div>
      {error ? <div style={errorStyle} role="alert">{error}</div> : null}
      <div style={{ marginTop: 12 }}>
        <label style={labelStyle} htmlFor="jf-output">{t({ bn: 'ফলাফল', en: 'Result' })}</label>
        <textarea id="jf-output" style={outputStyle} value={output} readOnly aria-readonly="true" />
      </div>
      <ButtonRow>
        <CopyButton text={output} />
        <ExampleButton onLoad={() => { setInput('{"name":"Mizan","city":"Dhaka","skills":["teaching","video"]}'); setMode('format'); setError(''); }} />
        <ClearButton onClear={() => { setInput(''); setError(''); }} disabled={input === ''} />
      </ButtonRow>
    </section>
  );
}
