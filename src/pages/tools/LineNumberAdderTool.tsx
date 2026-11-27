// Eduvelto — Line Number Adder tool UI (Text batch, 27 Nov 2026).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Pure logic lives in src/lib/tools/textTools.ts.
// All processing is 100% in-browser; nothing is uploaded.
import { useMemo, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, CopyButton, ButtonRow, ClearButton, ExampleButton, shortInputStyle, inputStyle, labelStyle, cardStyle, noteStyle, activeButtonStyle, buttonStyle } from './toolUi';
import { addLineNumbers, type LineNumberFormat } from '../../lib/tools/textTools';

const EXAMPLE = 'function hello() {\n  console.log("Hi");\n}';
const FORMATS: LineNumberFormat[] = ['plain', 'padded', 'dot'];

export function LineNumberAdderTool() {
  const { t } = useLanguage();
  const [input, setInput] = useState(EXAMPLE);
  const [start, setStart] = useState('1');
  const [format, setFormat] = useState<LineNumberFormat>('plain');
  const output = useMemo(() => addLineNumbers(input, { start: Number(start) || 1, format }), [input, start, format]);
  const formatLabel: Record<LineNumberFormat, { bn: string; en: string }> = {
    plain: { bn: '১ | লেখা', en: '1 | text' },
    padded: { bn: 'সারিবদ্ধ', en: 'Padded' },
    dot: { bn: '১. লেখা', en: '1. text' },
  };
  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="লাইন নম্বর যোগকারী" titleEn="Line Number Adder" descBn="লেখা বা কোডের প্রতিটি লাইনের পাশে নম্বর যোগ করুন।" descEn="Add line numbers to pasted text or code." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div>
        <label style={labelStyle} htmlFor="ln-input">{t({ bn: 'আপনার লেখা বা কোড', en: 'Your text or code' })}</label>
        <textarea id="ln-input" style={inputStyle} value={input} onChange={(e) => setInput(e.target.value)} placeholder={EXAMPLE} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginTop: 12 }}>
        <div>
          <label style={labelStyle} htmlFor="ln-start">{t({ bn: 'শুরুর নম্বর', en: 'Starting number' })}</label>
          <input id="ln-start" style={shortInputStyle} type="number" inputMode="numeric" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>{t({ bn: 'ধরন', en: 'Format' })}</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {FORMATS.map((f) => (
              <button key={f} type="button" style={format === f ? activeButtonStyle : buttonStyle} onClick={() => setFormat(f)}>
                {t(formatLabel[f])}
              </button>
            ))}
          </div>
        </div>
      </div>
      <ButtonRow>
        <ExampleButton onLoad={() => setInput(EXAMPLE)} />
        <ClearButton onClear={() => setInput('')} disabled={input === ''} />
      </ButtonRow>
      <div>
        <label style={labelStyle} htmlFor="ln-output">{t({ bn: 'ফলাফল', en: 'Result' })}</label>
        <textarea id="ln-output" style={{ ...inputStyle, minHeight: 90 }} value={output} readOnly />
      </div>
      <ButtonRow>
        <CopyButton text={output} disabled={output === ''} labelBn="ফলাফল কপি করুন" labelEn="Copy result" />
      </ButtonRow>
      <p style={noteStyle}>{t({ bn: 'প্রতিটি লাইনে নম্বর যোগ হয়; ফাঁকা লাইনেও নম্বর পড়ে।', en: 'Every line gets a number, including blank lines.' })}</p>
    </section>
  );
}
