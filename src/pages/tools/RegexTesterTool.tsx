// Eduvelto — Regex Tester tool UI.
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Pure logic lives in src/lib/tools — this file is presentation only.
// All processing is 100% in-browser; nothing is uploaded.

import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, CopyButton, Tiles, ButtonRow, ExampleButton, inputStyle, shortInputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { testRegex, replaceWithRegex } from '../../lib/tools/regexTester';


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

export function RegexTesterTool() {
  const { t } = useLanguage();
  const [pattern, setPattern] = useState('\\d+');
  const [flags, setFlags] = useState('g');
  const [text, setText] = useState('Call 01712345678 or 01987654321');
  const [replacement, setReplacement] = useState('#');
  const result = useMemo(() => testRegex(pattern, flags, text), [pattern, flags, text]);
  const replaced = useMemo(() => (result.valid ? replaceWithRegex(pattern, flags, text, replacement).result : ''), [result.valid, pattern, flags, text, replacement]);
  const highlighted = useMemo(() => {
    if (!result.valid || result.matches.length === 0) return text;
    let out = '';
    let last = 0;
    for (const m of result.matches) {
      out += text.slice(last, m.index);
      out += `⟦${m.match}⟧`;
      last = m.index + m.match.length;
    }
    return out + text.slice(last);
  }, [result, text]);
  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="রেগেক্স টেস্টার" titleEn="Regex Tester" descBn="রেগুলার এক্সপ্রেশন লিখে লেখার সাথে মিলিয়ে পরীক্ষা করুন।" descEn="Test a regular expression against sample text." chipBn="আপনার কোড চালানো হয় না — শুধু মিল খোঁজা হয়" chipEn="Your code is never run — only matches are found" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <div>
          <label style={labelStyle} htmlFor="rx-pattern">{t({ bn: 'প্যাটার্ন', en: 'Pattern' })}</label>
          <input id="rx-pattern" style={{ ...shortInputStyle, fontFamily: 'monospace' }} value={pattern} onChange={(e) => setPattern(e.target.value)} placeholder="\\d+" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="rx-flags">{t({ bn: 'ফ্ল্যাগ (g i m s u y)', en: 'Flags (g i m s u y)' })}</label>
          <input id="rx-flags" style={{ ...shortInputStyle, fontFamily: 'monospace' }} value={flags} onChange={(e) => setFlags(e.target.value)} placeholder="g" />
        </div>
      </div>
      <div style={{ marginTop: 12 }}>
        <label style={labelStyle} htmlFor="rx-text">{t({ bn: 'পরীক্ষার লেখা', en: 'Test text' })}</label>
        <textarea id="rx-text" style={inputStyle} value={text} onChange={(e) => setText(e.target.value)} />
      </div>
      {result.valid ? (
        <Tiles items={[{ labelBn: 'মিল পাওয়া গেছে', labelEn: 'Matches', value: String(result.total) }]} />
      ) : (
        <div style={errorStyle} role="alert">{result.error}</div>
      )}
      <div style={{ marginTop: 12 }}>
        <label style={labelStyle}>{t({ bn: 'মিলগুলো (⟦ ⟧ চিহ্নের ভেতরে)', en: 'Matches (inside ⟦ ⟧)' })}</label>
        <div style={{ ...outputStyle, whiteSpace: 'pre-wrap' }}>{highlighted || '—'}</div>
      </div>
      {result.valid && result.matches.length > 0 ? (
        <div style={{ marginTop: 12 }}>
          <label style={labelStyle}>{t({ bn: 'মিলের তালিকা', en: 'Match list' })}</label>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, lineHeight: 1.8 }}>
            {result.matches.slice(0, 20).map((m, i) => (
              <li key={i}><code>{m.match}</code> {t({ bn: 'অবস্থান', en: 'at' })} {m.index}{m.groups.length > 0 && m.groups.some((g) => g !== '') ? ` — ${t({ bn: 'গ্রুপ', en: 'groups' })}: ${m.groups.join(', ')}` : ''}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <div style={{ marginTop: 12 }}>
        <label style={labelStyle} htmlFor="rx-replace">{t({ bn: 'বদলে লিখুন (ঐচ্ছিক)', en: 'Replace with (optional)' })}</label>
        <input id="rx-replace" style={shortInputStyle} value={replacement} onChange={(e) => setReplacement(e.target.value)} />
        {replaced !== '' && replaced !== text ? <div style={{ ...resultStyle, wordBreak: 'break-word' }}>{replaced}</div> : null}
      </div>
      <ButtonRow>
        <CopyButton text={highlighted} />
        <ExampleButton onLoad={() => { setPattern('\\d+'); setFlags('g'); setText('Call 01712345678 or 01987654321'); }} />
      </ButtonRow>
      <p style={noteStyle}>{t({ bn: 'ভুল প্যাটার্ন লিখলে স্পষ্ট বার্তা দেখাবে; আপনার কোড চালানো হয় না, শুধু RegExp দিয়ে মিল খোঁজা হয়।', en: 'An invalid pattern shows a clear message; your code is never executed, matches are only found with RegExp.' })}</p>
    </section>
  );
}
