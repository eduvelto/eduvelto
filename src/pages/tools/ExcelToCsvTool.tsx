// Eduvelto — Excel to CSV tool UI (landed 27 Nov 2026, A-tools).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Engine: parseCsv() / toCsv() in src/lib/tools/docConverters.ts; .xlsx reading via SheetJS (xlsx) loaded with dynamic import() only. 100% in-browser; nothing is uploaded.
import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import {ToolHero, Tiles, CopyButton, ButtonRow, inputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { toCsv } from '../../lib/tools/docConverters';


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


export function ExcelToCsvTool() {
  const { t } = useLanguage();
  const [fileName, setFileName] = useState('');
  const [sheets, setSheets] = useState<{ name: string; rows: string[][] }[]>([]);
  const [activeSheet, setActiveSheet] = useState(0);
  const [delimiter, setDelimiter] = useState<',' | ';' | '\t'>(',');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | null): Promise<void> {
    if (!file) return;
    setError(null);
    setSheets([]);
    setFileName(file.name);
    if (file.name.toLowerCase().endsWith('.xls') && !file.name.toLowerCase().endsWith('.xlsx')) {
      setError(t({ bn: '.xls (Excel ৯৭–২০০৩) সমর্থিত নয় — Excel বা Sheets-এ খুলে .xlsx হিসেবে সংরক্ষণ করুন।', en: '.xls (Excel 97–2003) is not supported — open it in Excel or Sheets and save as .xlsx first.' }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) { setError(t({ bn: 'ফাইলটি ৫ MB-এর বেশি — ছোট ফাইল বাছুন।', en: 'The file is over 5 MB — choose a smaller file.' })); return; }
    setBusy(true);
    try {
      const XLSX = await import('xlsx');
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const loaded = wb.SheetNames.map((name) => {
        const ws = wb.Sheets[name];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: '' }) as unknown[][];
        return { name, rows: rows.map((r) => r.map((c) => (c === null || c === undefined ? '' : String(c)))) };
      });
      setSheets(loaded);
      setActiveSheet(0);
    } catch {
      setError(t({ bn: 'ফাইলটি পড়া যায়নি — এটি সঠিক .xlsx ফাইল কি না দেখুন।', en: 'Could not read the file — check it is a valid .xlsx file.' }));
    } finally {
      setBusy(false);
    }
  }

  const active = sheets[activeSheet];
  const csv = useMemo(() => {
    if (!active) return '';
    try { return toCsv(active.rows, delimiter); } catch { return ''; }
  }, [active, delimiter]);
  const preview = active ? active.rows.slice(0, 11) : [];

  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="Excel থেকে CSV" titleEn="Excel to CSV" descBn=".xlsx ফাইল থেকে CSV বানান — একাধিক শিট থাকলে শিট বেছে নিন।" descEn="Make a CSV from a .xlsx file — pick a sheet when there are several." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div>
        <label style={labelStyle} htmlFor="e2c-file">{t({ bn: 'Excel ফাইল (.xlsx)', en: 'Excel file (.xlsx)' })}</label>
        <input id="e2c-file" style={inputStyle} type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(e) => void handleFile(e.target.files?.[0] ?? null)} />
      </div>
      {busy ? <p style={noteStyle} role="status">{t({ bn: 'ফাইল পড়া হচ্ছে…', en: 'Reading the file…' })}</p> : null}
      {error ? <p style={errorStyle} role="alert">{error}</p> : null}
      {sheets.length > 0 && active ? (
        <>
          <p style={noteStyle}>{t({ bn: `ফাইল: ${fileName}`, en: `File: ${fileName}` })}</p>
          {sheets.length > 1 ? (
            <div style={{ marginTop: 12 }}>
              <label style={labelStyle} htmlFor="e2c-sheet">{t({ bn: 'শিট বাছুন', en: 'Choose a sheet' })}</label>
              <select id="e2c-sheet" style={inputStyle} value={activeSheet} onChange={(e) => setActiveSheet(Number(e.target.value))}>
                {sheets.map((s, i) => (<option key={s.name} value={i}>{s.name} ({s.rows.length} {t({ bn: 'সারি', en: 'rows' })})</option>))}
              </select>
            </div>
          ) : null}
          <div style={{ marginTop: 12 }}>
            <label style={labelStyle} htmlFor="e2c-delim">{t({ bn: 'CSV বিভাজক', en: 'CSV delimiter' })}</label>
            <select id="e2c-delim" style={inputStyle} value={delimiter} onChange={(e) => setDelimiter(e.target.value as ',' | ';' | '\t')}>
              <option value=",">{t({ bn: 'কমা (,)', en: 'Comma (,)' })}</option>
              <option value=";">{t({ bn: 'সেমিকোলন (;)', en: 'Semicolon (;)' })}</option>
              <option value={'\t'}>{t({ bn: 'ট্যাব', en: 'Tab' })}</option>
            </select>
          </div>
          {active.rows.length === 0 ? (
            <p style={noteStyle}>{t({ bn: 'এই শিটটি ফাঁকা।', en: 'This sheet is empty.' })}</p>
          ) : (
            <>
              <Tiles items={[
                { labelBn: 'সারি', labelEn: 'Rows', value: String(active.rows.length) },
                { labelBn: 'কলাম', labelEn: 'Columns', value: String(active.rows[0]?.length ?? 0) },
                { labelBn: 'শিট', labelEn: 'Sheets', value: String(sheets.length) },
              ]} />
              <div style={{ overflowX: 'auto', marginTop: 12 }}>
                <table style={{ borderCollapse: 'collapse', fontSize: 14, width: '100%' }}>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i} style={{ background: i === 0 ? 'var(--teal-soft)' : undefined }}>
                        {row.map((cell, j) => (
                          <td key={j} style={{ border: '1px solid var(--line)', padding: '6px 8px', fontWeight: i === 0 ? 700 : 400 }}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: 14 }}>
                <label style={labelStyle} htmlFor="e2c-output">{t({ bn: 'CSV ফলাফল', en: 'CSV result' })}</label>
                <textarea id="e2c-output" style={{ ...inputStyle, minHeight: 120 }} value={csv} readOnly />
              </div>
              <ButtonRow>
                <CopyButton text={csv} labelBn="CSV কপি করুন" labelEn="Copy CSV" />
                <button type="button" style={{ minHeight: 44, padding: '0 18px', borderRadius: 8, border: 'none', background: 'var(--teal)', color: '#fff', fontWeight: 700, cursor: 'pointer' }} onClick={() => downloadText('eduvelto-table.csv', csv, 'text/csv')}>
                  {t({ bn: '.csv ডাউনলোড করুন', en: 'Download .csv' })}
                </button>
              </ButtonRow>
            </>
          )}
        </>
      ) : null}
      <p style={noteStyle}>{t({ bn: 'সংখ্যা মূল মানেই থাকে — অঙ্কের শেষের ঘর কেটে ফেলা হয় না। ফাইলটি ৫ MB পর্যন্ত; বড় ফাইলে সময় লাগতে পারে।', en: 'Numbers keep their raw values — trailing digits are not rounded away. Files up to 5 MB; larger files may take a while.' })}</p>
    </section>
  );
}
