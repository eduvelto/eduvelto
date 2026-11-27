// Eduvelto — HTML Table Generator tool UI.
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Pure logic lives in src/lib/tools — this file is presentation only.
// All processing is 100% in-browser; nothing is uploaded.

import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, CopyButton, ButtonRow, ExampleButton, shortInputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { buildHtmlTable } from '../../lib/tools/htmlTableGenerator';


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

export function HtmlTableGeneratorTool() {
  const { t } = useLanguage();
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [headers, setHeaders] = useState('Name, Age, City');
  const [caption, setCaption] = useState('');
  const [bordered, setBordered] = useState(true);
  const [striped, setStriped] = useState(false);
  const html = useMemo(() => buildHtmlTable({
    rows, cols,
    headers: headers.split(',').map((h) => h.trim()),
    caption, bordered, striped,
  }), [rows, cols, headers, caption, bordered, striped]);
  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="এইচটিএমএল টেবিল জেনারেটর" titleEn="HTML Table Generator" descBn="সারি ও কলামের সংখ্যা দিয়ে ওয়েবসাইটের জন্য HTML টেবিল বানান।" descEn="Build an HTML table for a website by choosing rows and columns." chipBn="লাইভ প্রিভিউ সহ" chipEn="With live preview" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        <div><label style={labelStyle} htmlFor="ht-rows">{t({ bn: 'সারি', en: 'Rows' })}</label><input id="ht-rows" style={shortInputStyle} type="number" min={1} max={50} value={rows} onChange={(e) => setRows(Math.max(1, Math.min(50, Number(e.target.value) || 1)))} /></div>
        <div><label style={labelStyle} htmlFor="ht-cols">{t({ bn: 'কলাম', en: 'Columns' })}</label><input id="ht-cols" style={shortInputStyle} type="number" min={1} max={20} value={cols} onChange={(e) => setCols(Math.max(1, Math.min(20, Number(e.target.value) || 1)))} /></div>
        <div><label style={labelStyle} htmlFor="ht-caption">{t({ bn: 'শিরোনাম (ঐচ্ছিক)', en: 'Caption (optional)' })}</label><input id="ht-caption" style={shortInputStyle} value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="My table" /></div>
      </div>
      <div style={{ marginTop: 12 }}>
        <label style={labelStyle} htmlFor="ht-headers">{t({ bn: 'কলামের নাম (কমা দিয়ে)', en: 'Column names (comma separated)' })}</label>
        <input id="ht-headers" style={shortInputStyle} value={headers} onChange={(e) => setHeaders(e.target.value)} placeholder="Name, Age, City" />
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12 }}>
        <label style={{ fontSize: 15 }}><input type="checkbox" checked={bordered} onChange={(e) => setBordered(e.target.checked)} /> {t({ bn: 'বর্ডার', en: 'Bordered' })}</label>
        <label style={{ fontSize: 15 }}><input type="checkbox" checked={striped} onChange={(e) => setStriped(e.target.checked)} /> {t({ bn: 'এক লাইন পর পর রং', en: 'Striped rows' })}</label>
      </div>
      <div style={{ marginTop: 16 }}>
        <label style={labelStyle}>{t({ bn: 'প্রিভিউ', en: 'Preview' })}</label>
        <div style={{ overflowX: 'auto', padding: 12, background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 10 }} dangerouslySetInnerHTML={{ __html: html }} />
      </div>
      <div style={{ marginTop: 12 }}>
        <label style={labelStyle} htmlFor="ht-output">HTML</label>
        <textarea id="ht-output" style={{ ...outputStyle, fontFamily: 'monospace' }} value={html} readOnly aria-readonly="true" />
      </div>
      <ButtonRow>
        <CopyButton text={html} />
        <ExampleButton onLoad={() => { setRows(3); setCols(3); setHeaders('Name, Age, City'); setCaption('Students'); }} />
      </ButtonRow>
      <p style={noteStyle}>{t({ bn: 'প্রিভিউতে দেখানো ঘরগুলোতে নমুনা লেখা আছে — নিজের তথ্য দিয়ে বদলে নিন।', en: 'The preview cells show sample text — replace them with your own data.' })}</p>
    </section>
  );
}
