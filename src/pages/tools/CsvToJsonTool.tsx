// Eduvelto — CSV to JSON Converter tool UI (27 Nov 2026).
// Inverse of the live json-to-csv tool. Handles quoted fields and a
// header row; errors are shown honestly.
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, CopyButton, ButtonRow, ClearButton, ExampleButton, Tiles, inputStyle, labelStyle, cardStyle, noteStyle, buttonStyle } from './toolUi';
import { csvToJson } from '../../lib/tools/mainTablesTools';

const errorStyle: CSSProperties = { marginTop: 14, color: '#b3261e', fontSize: 14 };
const resultStyle: CSSProperties = { marginTop: 14, padding: '18px 16px', borderRadius: 12, background: 'var(--teal-soft)', boxShadow: 'var(--shadow-sm)' };

const EXAMPLE_CSV = `name,age,city
Mizan,24,"Cox's Bazar"
Ayesha,22,Dhaka
"Rahim, Jr.",30,Chittagong`;

export function CsvToJsonTool() {
  const { t } = useLanguage();
  const [input, setInput] = useState(EXAMPLE_CSV);
  const [pretty, setPretty] = useState(true);
  const result = useMemo(() => csvToJson(input, pretty), [input, pretty]);

  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="CSV থেকে JSON কনভার্টার" titleEn="CSV to JSON Converter" descBn="CSV তথ্যকে JSON-এ বদলান — উদ্ধৃতি-চিহ্নযুক্ত ক্ষেত্র ও হেডার সারি ঠিকভাবে ধরা হয়।" descEn="Convert CSV data to JSON — quoted fields and the header row are handled correctly." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div>
        <label style={labelStyle} htmlFor="csv-input">{t({ bn: 'CSV লেখা দিন (প্রথম সারি হেডার)', en: 'Enter CSV text (first row is the header)' })}</label>
        <textarea id="csv-input" style={{ ...inputStyle, fontFamily: 'monospace' }} value={input} onChange={(e) => setInput(e.target.value)} placeholder="name,age,city&#10;Mizan,24,Dhaka" />
      </div>
      <ButtonRow>
        <button type="button" style={buttonStyle} onClick={() => setPretty((v) => !v)}>{pretty ? t({ bn: 'সাজানো বন্ধ করুন', en: 'Turn off pretty print' }) : t({ bn: 'সাজিয়ে দেখান', en: 'Pretty print' })}</button>
        <ExampleButton onLoad={() => setInput(EXAMPLE_CSV)} />
        <ClearButton onClear={() => setInput('')} />
      </ButtonRow>
      {result.error ? <p style={errorStyle} role="alert">{result.error}</p> : null}
      {result.json ? (
        <>
          <Tiles items={[{ labelBn: 'সারি', labelEn: 'Rows', value: String(result.rows) }]} />
          <div style={resultStyle} role="status">
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{t({ bn: 'JSON ফলাফল', en: 'JSON result' })}</p>
            <pre style={{ margin: 0, fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{result.json}</pre>
            <ButtonRow><CopyButton text={result.json} labelBn="JSON কপি করুন" labelEn="Copy JSON" /></ButtonRow>
          </div>
        </>
      ) : null}
      <p style={noteStyle}>{t({ bn: 'সব মান লেখা (string) হিসেবে রাখা হয় — সংখ্যায় বদলানো হয় না। কমার ভেতরে থাকা মান ডাবল কোটে লিখুন ("Rahim, Jr.") আর কোটের ভেতরে কোট লিখতে "" ব্যবহার করুন। সারির ক্ষেত্রসংখ্যা হেডারের সমান না হলে ভুল দেখানো হবে। উল্টো কাজের (JSON থেকে CSV) জন্য json-to-csv টুল দেখুন।', en: 'All values are kept as strings — nothing is converted to numbers. Wrap a value containing a comma in double quotes ("Rahim, Jr.") and write "" for a quote inside a quoted value. A row with a different field count than the header is reported as an error. For the reverse job (JSON to CSV), see the json-to-csv tool.' })}</p>
    </section>
  );
}
