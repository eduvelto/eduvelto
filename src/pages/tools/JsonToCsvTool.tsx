// Eduvelto — JSON to CSV tool UI (landed 27 Nov 2026, A-tools).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Engine: jsonToCsv() + csvToJson() in src/lib/tools/docConverters.ts. 100% in-browser; nothing is uploaded.
import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import RewardedAdButton from '../../components/RewardedAdButton';
import {ToolHero, CopyButton, ButtonRow, ExampleButton, ClearButton, inputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { jsonToCsv, csvToJson } from '../../lib/tools/docConverters';


const errorStyle: CSSProperties = {
  marginTop: 14,
  color: '#b3261e',
  fontSize: 14,
};



function downloadText(filename: string, text: string, type = 'text/plain'): void {
  const blob = new Blob([text], { type: `${type};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}


const SAMPLE_JSON = '[\n  {"name": "Rahim", "marks": 85},\n  {"name": "Karim", "marks": 90},\n  {"name": "Salma", "marks": 78}\n]';

export function JsonToCsvTool() {
  const { t, lang } = useLanguage();
  const [mode, setMode] = useState<'json-csv' | 'csv-json'>('json-csv');
  const [input, setInput] = useState(SAMPLE_JSON);
  const result = useMemo(() => {
    try {
      if (mode === 'json-csv') {
        const r = jsonToCsv(input);
        return { output: r.csv, info: `${r.rowCount} rows, ${r.columns.length} columns (${r.columns.join(', ')})` };
      }
      const r = csvToJson(input);
      return { output: r.json, info: `${r.rowCount} rows` };
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'Could not convert' };
    }
  }, [input, mode]);

  const tabStyle = (active: boolean): CSSProperties => ({
    minHeight: 40, padding: '0 14px', borderRadius: 8, border: '1px solid var(--line)',
    background: active ? 'var(--teal)' : 'var(--surface)', color: active ? '#fff' : 'var(--heading)', cursor: 'pointer', fontWeight: 600,
  });

  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="JSON থেকে CSV" titleEn="JSON to CSV" descBn="JSON অ্যারে থেকে CSV বানান — উল্টো দিকেও (CSV থেকে JSON) কাজ করে।" descEn="Make a CSV from a JSON array — it also works the other way (CSV to JSON)." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <button type="button" style={tabStyle(mode === 'json-csv')} onClick={() => setMode('json-csv')}>{t({ bn: 'JSON → CSV', en: 'JSON → CSV' })}</button>
        <button type="button" style={tabStyle(mode === 'csv-json')} onClick={() => setMode('csv-json')}>{t({ bn: 'CSV → JSON', en: 'CSV → JSON' })}</button>
      </div>
      <div>
        <label style={labelStyle} htmlFor="j2c-input">{mode === 'json-csv' ? t({ bn: 'JSON লেখা', en: 'JSON text' }) : t({ bn: 'CSV লেখা', en: 'CSV text' })}</label>
        <textarea id="j2c-input" style={{ ...inputStyle, minHeight: 160 }} value={input} onChange={(e) => setInput(e.target.value)} placeholder={mode === 'json-csv' ? '[{"name": "Rahim", "marks": 85}]' : 'name,marks\nRahim,85'} />
      </div>
      <ButtonRow>
        <ExampleButton onLoad={() => setInput(mode === 'json-csv' ? SAMPLE_JSON : 'name,marks\nRahim,85\nKarim,90')} />
        <ClearButton onClear={() => setInput('')} disabled={input === ''} />
      </ButtonRow>
      {'error' in result ? (
        <p style={errorStyle} role="alert">{result.error}</p>
      ) : (
        <>
          <p style={noteStyle}>{result.info}</p>
          <div style={{ marginTop: 8 }}>
            <label style={labelStyle} htmlFor="j2c-output">{t({ bn: 'ফলাফল', en: 'Result' })}</label>
            <textarea id="j2c-output" style={{ ...inputStyle, minHeight: 160 }} value={result.output} readOnly />
          </div>
          <ButtonRow>
            <CopyButton text={result.output} labelBn="ফলাফল কপি করুন" labelEn="Copy result" />
            {/* Ads rollout B3 (27 Nov 2026): this download goes through RewardedAdButton (15s) — Free Download is live, the 15s Unlock stays disabled until AdSense approval (never a fake timer). */}
            <RewardedAdButton lang={lang} durationSeconds={15} onFreeDownload={() => downloadText(mode === 'json-csv' ? 'eduvelto-table.csv' : 'eduvelto-data.json', result.output, mode === 'json-csv' ? 'text/csv' : 'application/json')} />
          </ButtonRow>
        </>
      )}
      <p style={noteStyle}>{t({ bn: 'সারি জুড়ে কলামের নাম আলাদা হলে সবগুলো কলাম নেওয়া হয়; যে সারিতে মান নেই সেখানে ঘর ফাঁকা থাকে। ভেতরের অবজেক্ট বা অ্যারে JSON লেখা হিসেবে ঘরে বসে। একক অবজেক্ট বা {"data": [...]} আকারও চলে।', en: 'When rows have different keys, all columns are used; a missing value leaves an empty cell. Nested objects or arrays go into the cell as JSON text. A single object or a {"data": [...]} wrapper also works.' })}</p>
    </section>
  );
}
