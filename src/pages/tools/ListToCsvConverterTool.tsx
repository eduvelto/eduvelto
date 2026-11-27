// Eduvelto — List to CSV Converter tool UI (Text batch, 27 Nov 2026).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Pure logic lives in src/lib/tools/textTools.ts.
// All processing is 100% in-browser; nothing is uploaded.
import { useMemo, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, CopyButton, ButtonRow, ClearButton, ExampleButton, inputStyle, labelStyle, cardStyle, noteStyle, activeButtonStyle, buttonStyle } from './toolUi';
import { listToCsv, csvToList } from '../../lib/tools/textTools';

export function ListToCsvConverterTool() {
  const { t } = useLanguage();
  const [mode, setMode] = useState<'listToCsv' | 'csvToList'>('listToCsv');
  const [input, setInput] = useState('apple\nbanana\nmango');
  const output = useMemo(() => {
    if (mode === 'listToCsv') return listToCsv(input);
    const parsed = csvToList(input);
    return parsed === null ? '' : parsed.join('\n');
  }, [input, mode]);
  const invalid = mode === 'csvToList' && input.trim() !== '' && csvToList(input) === null;
  const loadExample = () => {
    if (mode === 'listToCsv') setInput('apple\nbanana\nmango');
    else setInput('apple,banana,mango');
  };
  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="তালিকা থেকে CSV কনভার্টার" titleEn="List to CSV Converter" descBn="লাইনের তালিকাকে কমা দিয়ে আলাদা করা তালিকায় বদলান — আবার উল্টোটাও করুন।" descEn="Turn a line list into comma-separated values — and back again." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <button type="button" style={mode === 'listToCsv' ? activeButtonStyle : buttonStyle} onClick={() => setMode('listToCsv')}>{t({ bn: 'তালিকা → CSV', en: 'List → CSV' })}</button>
        <button type="button" style={mode === 'csvToList' ? activeButtonStyle : buttonStyle} onClick={() => setMode('csvToList')}>{t({ bn: 'CSV → তালিকা', en: 'CSV → List' })}</button>
      </div>
      <div>
        <label style={labelStyle} htmlFor="csv-input">{t({ bn: mode === 'listToCsv' ? 'তালিকা (প্রতি লাইনে একটি)' : 'CSV লেখা', en: mode === 'listToCsv' ? 'List (one item per line)' : 'CSV text' })}</label>
        <textarea id="csv-input" style={inputStyle} value={input} onChange={(e) => setInput(e.target.value)} placeholder={mode === 'listToCsv' ? 'apple\nbanana\nmango' : 'apple,banana,mango'} />
      </div>
      <ButtonRow>
        <ExampleButton onLoad={loadExample} />
        <ClearButton onClear={() => setInput('')} disabled={input === ''} />
      </ButtonRow>
      <div>
        <label style={labelStyle} htmlFor="csv-output">{t({ bn: 'ফলাফল', en: 'Result' })}</label>
        <textarea id="csv-output" style={{ ...inputStyle, minHeight: 90 }} value={output} readOnly />
      </div>
      <ButtonRow>
        <CopyButton text={output} disabled={output === ''} labelBn="ফলাফল কপি করুন" labelEn="Copy result" />
      </ButtonRow>
      {invalid ? <p style={{ color: '#b3261e', fontSize: 14, marginTop: 12 }}>{t({ bn: 'CSV-টি ঠিক নয় — উদ্ধৃতি চিহ্নের জোড়া মেলেনি।', en: 'The CSV is not valid — a quote is left unclosed.' })}</p> : null}
      <p style={noteStyle}>{t({ bn: 'কমা থাকা আইটেম স্বয়ংক্রিয়ভাবে উদ্ধৃতি চিহ্নে মোড়ানো হয়, যাতে CSV ঠিক থাকে।', en: 'Items containing a comma are wrapped in quotes automatically, so the CSV stays valid.' })}</p>
    </section>
  );
}
