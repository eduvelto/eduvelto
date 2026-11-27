// Eduvelto — Text Case Converter tool UI.
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Pure logic lives in src/lib/tools — this file is presentation only.
// All processing is 100% in-browser; nothing is uploaded.

import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, CopyButton, ButtonRow, ClearButton, ExampleButton, inputStyle, labelStyle, cardStyle, buttonStyle, activeButtonStyle } from './toolUi';
import { convertTextCase, CASE_MODES, type CaseMode } from '../../lib/tools/textCase';


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

export function TextCaseConverterTool() {
  const { t } = useLanguage();
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<CaseMode>('title');
  const output = useMemo(() => convertTextCase(input, mode), [input, mode]);
  const modeLabel: Record<CaseMode, { bn: string; en: string }> = {
    upper: { bn: 'বড় হাতের', en: 'UPPER CASE' },
    lower: { bn: 'ছোট হাতের', en: 'lower case' },
    title: { bn: 'শিরোনাম', en: 'Title Case' },
    sentence: { bn: 'বাক্য', en: 'Sentence case' },
    capitalized: { bn: 'প্রতিটি শব্দের প্রথম অক্ষর বড়', en: 'Capitalized Words' },
    toggle: { bn: 'উল্টো কেস', en: 'tOGGLE cASE' },
    camel: { bn: 'camelCase', en: 'camelCase' },
    snake: { bn: 'snake_case', en: 'snake_case' },
    kebab: { bn: 'kebab-case', en: 'kebab-case' },
  };
  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="লেখার কেস কনভার্টার" titleEn="Text Case Converter" descBn="লেখাকে বড় হাতের, ছোট হাতের বা শিরোনামের আকারে বদলান।" descEn="Change text to upper case, lower case or title case." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div>
        <label style={labelStyle} htmlFor="tc-input">{t({ bn: 'আপনার লেখা', en: 'Your text' })}</label>
        <textarea id="tc-input" style={inputStyle} value={input} onChange={(e) => setInput(e.target.value)} placeholder={t({ bn: 'এখানে লিখুন…', en: 'Type here…' })} />
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }} role="group" aria-label={t({ bn: 'কেস', en: 'Case' })}>
        {CASE_MODES.map((m) => (
          <button key={m} type="button" style={mode === m ? activeButtonStyle : buttonStyle} aria-pressed={mode === m} onClick={() => setMode(m)}>
            {t(modeLabel[m])}
          </button>
        ))}
      </div>
      <div style={{ marginTop: 12 }}>
        <label style={labelStyle} htmlFor="tc-output">{t({ bn: 'ফলাফল', en: 'Result' })}</label>
        <textarea id="tc-output" style={outputStyle} value={output} readOnly aria-readonly="true" />
      </div>
      <ButtonRow>
        <CopyButton text={output} />
        <ExampleButton onLoad={() => setInput('hello world, welcome to eduvelto')} />
        <ClearButton onClear={() => setInput('')} disabled={input === ''} />
      </ButtonRow>
    </section>
  );
}
