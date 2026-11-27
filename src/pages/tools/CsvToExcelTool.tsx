// Eduvelto — CSV to Excel tool UI (landed 27 Nov 2026, A-tools).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Engine: parseCsv() / detectDelimiter() in src/lib/tools/docConverters.ts; .xlsx writing via SheetJS (xlsx) loaded with dynamic import() only. 100% in-browser; nothing is uploaded.
import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import {ToolHero, Tiles, ButtonRow, ExampleButton, ClearButton, inputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { parseCsv, detectDelimiter } from '../../lib/tools/docConverters';


const errorStyle: CSSProperties = {
  marginTop: 14,
  color: '#b3261e',
  fontSize: 14,
};




function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const SAMPLE_CSV = 'নাম,রোল,নম্বর\nরহিম,1,85\nকরিম,2,90\nসালমা,3,78';

export function CsvToExcelTool() {
  const { t } = useLanguage();
  const [csv, setCsv] = useState(SAMPLE_CSV);
  const [delimiter, setDelimiter] = useState<',' | ';' | '\t' | 'auto'>('auto');
  const [hasHeader, setHasHeader] = useState(true);
  const [sheetName, setSheetName] = useState('Sheet1');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const parsed = useMemo(() => {
    try {
      const delim = delimiter === 'auto' ? detectDelimiter(csv) : delimiter;
      const rows = parseCsv(csv, delim);
      return { rows, delim };
    } catch (e) {
      return { rows: [] as string[][], error: e instanceof Error ? e.message : 'Could not parse the CSV' };
    }
  }, [csv, delimiter]);
  const rows = 'rows' in parsed ? parsed.rows : [];
  const parseError = 'error' in parsed ? parsed.error : null;
  const preview = rows.slice(0, 11);

  async function handleFile(file: File | null): Promise<void> {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setError(t({ bn: 'ফাইলটি ১০ MB-এর বেশি — ছোট ফাইল বাছুন।', en: 'The file is over 10 MB — choose a smaller file.' })); return; }
    setCsv(await file.text());
    setError(null);
    setDone(null);
  }

  async function handleDownload(): Promise<void> {
    setError(null);
    setDone(null);
    const safeName = sheetName.replace(/[\[\]:*?/\\]/g, '').trim() || 'Sheet1';
    if (safeName !== sheetName) {
      setError(t({ bn: 'শিটের নামে [ ] : * ? / \ চিহ্ন দেওয়া যায় না।', en: 'Sheet names cannot contain [ ] : * ? / \.' }));
      return;
    }
    if (rows.length === 0) { setError(t({ bn: 'প্রথমে CSV লিখুন বা ফাইল বাছুন।', en: 'First type CSV or choose a file.' })); return; }
    setBusy(true);
    try {
      const XLSX = await import('xlsx');
      const data = hasHeader ? rows : [rows[0].map((_, i) => `Column ${i + 1}`), ...rows];
      const body = data;
      const ws = XLSX.utils.aoa_to_sheet(body);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, safeName);
      const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
      downloadBlob('eduvelto-table.xlsx', new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
      setDone(t({ bn: `ডাউনলোড হয়েছে: ${rows.length} সারি, ${rows[0]?.length ?? 0} কলাম।`, en: `Downloaded: ${rows.length} rows, ${rows[0]?.length ?? 0} columns.` }));
    } catch {
      setError(t({ bn: 'Excel ফাইল বানানো যায়নি — আবার চেষ্টা করুন।', en: 'Could not create the Excel file — please try again.' }));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="CSV থেকে Excel" titleEn="CSV to Excel" descBn="CSV লেখা বা ফাইল থেকে .xlsx ফাইল বানান — সংখ্যা সংখ্যাই থাকে, তারিখ লেখা হিসেবে থাকে।" descEn="Make a .xlsx file from CSV text or a file — numbers stay numbers, dates stay text." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div>
        <label style={labelStyle} htmlFor="c2e-file">{t({ bn: 'CSV ফাইল (ঐচ্ছিক)', en: 'CSV file (optional)' })}</label>
        <input id="c2e-file" style={inputStyle} type="file" accept=".csv,text/csv" onChange={(e) => void handleFile(e.target.files?.[0] ?? null)} />
      </div>
      <div style={{ marginTop: 12 }}>
        <label style={labelStyle} htmlFor="c2e-input">{t({ bn: 'CSV লেখা', en: 'CSV text' })}</label>
        <textarea id="c2e-input" style={{ ...inputStyle, minHeight: 140 }} value={csv} onChange={(e) => setCsv(e.target.value)} placeholder="নাম,রোল,নম্বর" />
      </div>
      <ButtonRow>
        <ExampleButton onLoad={() => setCsv(SAMPLE_CSV)} />
        <ClearButton onClear={() => setCsv('')} disabled={csv === ''} />
      </ButtonRow>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginTop: 12 }}>
        <div>
          <label style={labelStyle} htmlFor="c2e-delim">{t({ bn: 'বিভাজক', en: 'Delimiter' })}</label>
          <select id="c2e-delim" style={inputStyle} value={delimiter} onChange={(e) => setDelimiter(e.target.value as ',' | ';' | '\t' | 'auto')}>
            <option value="auto">{t({ bn: 'নিজে শনাক্ত করুন', en: 'Auto-detect' })}</option>
            <option value=",">{t({ bn: 'কমা (,)', en: 'Comma (,)' })}</option>
            <option value=";">{t({ bn: 'সেমিকোলন (;)', en: 'Semicolon (;)' })}</option>
            <option value={'\t'}>{t({ bn: 'ট্যাব', en: 'Tab' })}</option>
          </select>
        </div>
        <div>
          <label style={labelStyle} htmlFor="c2e-sheet">{t({ bn: 'শিটের নাম', en: 'Sheet name' })}</label>
          <input id="c2e-sheet" style={inputStyle} type="text" value={sheetName} onChange={(e) => setSheetName(e.target.value)} placeholder="Sheet1" />
        </div>
      </div>
      <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 15, marginTop: 12 }}>
        <input type="checkbox" checked={hasHeader} onChange={(e) => setHasHeader(e.target.checked)} />
        {t({ bn: 'প্রথম সারিটি শিরোনাম', en: 'First row is a header' })}
      </label>
      {parseError ? <p style={errorStyle} role="alert">{parseError}</p> : null}
      {rows.length > 0 ? (
        <>
          <Tiles items={[
            { labelBn: 'সারি', labelEn: 'Rows', value: String(rows.length) },
            { labelBn: 'কলাম', labelEn: 'Columns', value: String(rows[0]?.length ?? 0) },
          ]} />
          <div style={{ overflowX: 'auto', marginTop: 12 }}>
            <table style={{ borderCollapse: 'collapse', fontSize: 14, width: '100%' }}>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i} style={{ background: i === 0 && hasHeader ? 'var(--teal-soft)' : undefined }}>
                    {row.map((cell, j) => (
                      <td key={j} style={{ border: '1px solid var(--line)', padding: '6px 8px', fontWeight: i === 0 && hasHeader ? 700 : 400 }}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 11 ? <p style={noteStyle}>{t({ bn: `প্রথম ১১ সারি দেখানো হচ্ছে — মোট ${rows.length} সারি।`, en: `Showing the first 11 rows of ${rows.length}.` })}</p> : null}
          </div>
          <ButtonRow>
            <button type="button" style={{ minHeight: 44, padding: '0 18px', borderRadius: 8, border: 'none', background: 'var(--teal)', color: '#fff', fontWeight: 700, cursor: 'pointer' }} onClick={() => void handleDownload()} disabled={busy}>
              {busy ? t({ bn: 'বানানো হচ্ছে…', en: 'Creating…' }) : t({ bn: '.xlsx ডাউনলোড করুন', en: 'Download .xlsx' })}
            </button>
          </ButtonRow>
          {done ? <p style={noteStyle} role="status">{done}</p> : null}
        </>
      ) : null}
      {error ? <p style={errorStyle} role="alert">{error}</p> : null}
      <p style={noteStyle}>{t({ bn: 'সংখ্যা সংখ্যা হিসেবেই থাকে; তারিখ আন্দাজ করে বদলানো হয় না — ভুল তারিখ ধরা পড়ার চেয়ে লেখা হিসেবে থাকা নিরাপদ। পুরনো .xls (Excel ৯৭–২০০৩) সমর্থিত নয় — Excel বা Sheets-এ খুলে .xlsx হিসেবে সংরক্ষণ করুন।', en: 'Numbers stay numbers; dates are not guessed — keeping them as text is safer than a wrong guess. Old .xls (Excel 97–2003) is not supported — open it in Excel or Sheets and save as .xlsx first.' })}</p>
    </section>
  );
}
