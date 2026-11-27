// Eduvelto — SQL Formatter tool UI (27 Nov 2026).
// Format/beautify SQL queries in the browser with a small
// tokenizer-based formatter — uppercase keywords, indented clauses.
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, CopyButton, ButtonRow, ClearButton, ExampleButton, inputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { formatSql } from '../../lib/tools/mainTablesTools';

const resultStyle: CSSProperties = { marginTop: 14, padding: '18px 16px', borderRadius: 12, background: 'var(--teal-soft)', boxShadow: 'var(--shadow-sm)' };

const EXAMPLE_SQL = "select id, name, age from students where age >= 18 and city = 'Dhaka' order by name limit 10;";

export function SqlFormatterTool() {
  const { t } = useLanguage();
  const [input, setInput] = useState(EXAMPLE_SQL);
  const output = useMemo(() => formatSql(input), [input]);

  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="SQL ফরম্যাটার" titleEn="SQL Formatter" descBn="SQL কোয়েরি সুন্দর করে সাজান — কীওয়ার্ড বড় হাতের, প্রতিটি ক্লজ আলাদা লাইনে।" descEn="Format and beautify SQL queries — uppercase keywords, one clause per line." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div>
        <label style={labelStyle} htmlFor="sql-input">{t({ bn: 'SQL কোয়েরি দিন', en: 'Enter a SQL query' })}</label>
        <textarea id="sql-input" style={{ ...inputStyle, fontFamily: 'monospace' }} value={input} onChange={(e) => setInput(e.target.value)} placeholder="select * from students where age > 18;" />
      </div>
      <ButtonRow>
        <ExampleButton onLoad={() => setInput(EXAMPLE_SQL)} />
        <ClearButton onClear={() => setInput('')} />
      </ButtonRow>
      {output !== '' ? (
        <div style={resultStyle} role="status">
          <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{t({ bn: 'সাজানো SQL', en: 'Formatted SQL' })}</p>
          <pre style={{ margin: 0, fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'monospace' }}>{output}</pre>
          <ButtonRow><CopyButton text={output} labelBn="SQL কপি করুন" labelEn="Copy SQL" /></ButtonRow>
        </div>
      ) : null}
      <p style={noteStyle}>{t({ bn: 'এটি একটি ছোট টোকেন-ভিত্তিক ফরম্যাটার, পূর্ণ SQL পার্সার নয় — উদ্ধৃত লেখা ও মন্তব্য অপরিবর্তিত রাখা হয়, কিন্তু জটিল নেস্টেড কোয়েরির সাজানো সবসময় নিখুঁত নাও হতে পারে। আপনার তথ্য ব্রাউজার ছাড়ে না।', en: 'This is a small tokenizer-based formatter, not a full SQL parser — quoted strings and comments are kept intact, but deeply nested queries may not format perfectly. Your data never leaves the browser.' })}</p>
    </section>
  );
}
