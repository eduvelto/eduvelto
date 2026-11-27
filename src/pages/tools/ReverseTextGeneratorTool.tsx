// Eduvelto — Reverse Text Generator tool UI.
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Pure logic lives in src/lib/tools — this file is presentation only.
// All processing is 100% in-browser; nothing is uploaded.

import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, CopyButton, ButtonRow, ClearButton, ExampleButton, inputStyle, labelStyle, cardStyle, buttonStyle, activeButtonStyle } from './toolUi';
import { reverseTextContent, type ReverseMode } from '../../lib/tools/reverseText';


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

export function ReverseTextGeneratorTool() {
  const { t } = useLanguage();
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<ReverseMode>('characters');
  const output = useMemo(() => reverseTextContent(input, mode), [input, mode]);
  const modes: ReverseMode[] = ['characters', 'words', 'lines'];
  const modeLabel: Record<ReverseMode, { bn: string; en: string }> = {
    characters: { bn: 'অক্ষর উল্টো', en: 'Reverse letters' },
    words: { bn: 'শব্দ উল্টো', en: 'Reverse words' },
    lines: { bn: 'লাইন উল্টো', en: 'Reverse lines' },
  };
  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="উল্টো লেখা জেনারেটর" titleEn="Reverse Text Generator" descBn="লেখাকে উল্টো করে সাজান — অক্ষর, শব্দ বা লাইনের ক্রম বদলে দিন।" descEn="Reverse text — flip the order of letters, words or lines." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div>
        <label style={labelStyle} htmlFor="rt-input">{t({ bn: 'আপনার লেখা', en: 'Your text' })}</label>
        <textarea id="rt-input" style={inputStyle} value={input} onChange={(e) => setInput(e.target.value)} placeholder="hello world" />
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }} role="group" aria-label={t({ bn: 'উল্টানোর ধরন', en: 'Reverse mode' })}>
        {modes.map((m) => (
          <button key={m} type="button" style={mode === m ? activeButtonStyle : buttonStyle} aria-pressed={mode === m} onClick={() => setMode(m)}>
            {t(modeLabel[m])}
          </button>
        ))}
      </div>
      <div style={{ marginTop: 12 }}>
        <label style={labelStyle} htmlFor="rt-output">{t({ bn: 'ফলাফল', en: 'Result' })}</label>
        <textarea id="rt-output" style={outputStyle} value={output} readOnly aria-readonly="true" />
      </div>
      <ButtonRow>
        <CopyButton text={output} />
        <ExampleButton onLoad={() => { setMode('characters'); setInput('hello world'); }} />
        <ClearButton onClear={() => setInput('')} disabled={input === ''} />
      </ButtonRow>
    </section>
  );
}
