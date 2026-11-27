// Eduvelto — Text Sorter tool UI (landed 27 Nov 2026, A-tools).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Engine: sortTextLines() in src/lib/tools/textUtils.ts (Bangla-aware collation via Intl.Collator bn). 100% in-browser; nothing is uploaded.
import { useMemo, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, Tiles, CopyButton, ButtonRow, ExampleButton, ClearButton, inputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { sortTextLines, type SortMode } from '../../lib/tools/textUtils';





function downloadText(filename: string, text: string, type = 'text/plain'): void {
  const blob = new Blob([text], { type: `${type};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}


const MODES: readonly { id: SortMode; bn: string; en: string }[] = [
  { id: 'az', bn: 'অ–হ (A→Z)', en: 'A → Z' },
  { id: 'za', bn: 'হ–অ (Z→A)', en: 'Z → A' },
  { id: 'numeric', bn: 'সংখ্যা অনুযায়ী (২-এর আগে ১০ নয়)', en: 'Numeric (2 before 10)' },
  { id: 'length', bn: 'দৈর্ঘ্য অনুযায়ী (ছোট → বড়)', en: 'By length (short → long)' },
  { id: 'length-desc', bn: 'দৈর্ঘ্য অনুযায়ী (বড় → ছোট)', en: 'By length (long → short)' },
  { id: 'reverse', bn: 'উল্টো ক্রম', en: 'Reverse order' },
  { id: 'shuffle', bn: 'এলোমেলো', en: 'Shuffle' },
];

const EXAMPLE = 'রহিম\nকরিম\nরহিম\nসালমা\n\nআরিফ\n10\n2\n1';

export function TextSorterTool() {
  const { t } = useLanguage();
  const [input, setInput] = useState(EXAMPLE);
  const [mode, setMode] = useState<SortMode>('az');
  const [dedupe, setDedupe] = useState<'none' | 'first' | 'last'>('none');
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [trim, setTrim] = useState(true);
  const [blanks, setBlanks] = useState<'keep' | 'remove' | 'one'>('remove');
  const [lineNumbers, setLineNumbers] = useState(false);

  const result = useMemo(
    () => sortTextLines(input, { mode, dedupe, ignoreCase, trim, blanks }),
    [input, mode, dedupe, ignoreCase, trim, blanks],
  );
  const output = lineNumbers ? result.lines.map((l, i) => `${i + 1}. ${l}`).join('\n') : result.lines.join('\n');
  const reduction = result.totalLines > 0 ? Math.round(((result.totalLines - result.lines.length) / result.totalLines) * 100) : 0;

  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="লেখা সাজানো (Text Sorter)" titleEn="Text Sorter" descBn="লাইনের তালিকা সাজান, ডুপ্লিকেট সরান ও বিশ্লেষণ দেখুন — বাংলা ক্রম ঠিকভাবে ধরা হয়।" descEn="Sort a list of lines, remove duplicates and see the analysis — Bangla ordering handled correctly." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div>
        <label style={labelStyle} htmlFor="ts-input">{t({ bn: 'লাইনগুলো (প্রতি লাইনে একটি)', en: 'Lines (one per line)' })}</label>
        <textarea id="ts-input" style={{ ...inputStyle, minHeight: 140 }} value={input} onChange={(e) => setInput(e.target.value)} placeholder={t({ bn: 'নাম, রোল বা যেকোনো তালিকা লিখুন…', en: 'Type a list of names, rolls or anything…' })} />
      </div>
      <ButtonRow>
        <ExampleButton onLoad={() => setInput(EXAMPLE)} />
        <ClearButton onClear={() => setInput('')} disabled={input === ''} />
      </ButtonRow>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginTop: 12 }}>
        <div>
          <label style={labelStyle} htmlFor="ts-mode">{t({ bn: 'সাজানোর ধরন', en: 'Sort mode' })}</label>
          <select id="ts-mode" style={inputStyle} value={mode} onChange={(e) => setMode(e.target.value as SortMode)}>
            {MODES.map((m) => (<option key={m.id} value={m.id}>{t({ bn: m.bn, en: m.en })}</option>))}
          </select>
        </div>
        <div>
          <label style={labelStyle} htmlFor="ts-dedupe">{t({ bn: 'ডুপ্লিকেট', en: 'Duplicates' })}</label>
          <select id="ts-dedupe" style={inputStyle} value={dedupe} onChange={(e) => setDedupe(e.target.value as 'none' | 'first' | 'last')}>
            <option value="none">{t({ bn: 'রাখুন', en: 'Keep all' })}</option>
            <option value="first">{t({ bn: 'প্রথমটি রাখুন', en: 'Keep first' })}</option>
            <option value="last">{t({ bn: 'শেষেরটি রাখুন', en: 'Keep last' })}</option>
          </select>
        </div>
        <div>
          <label style={labelStyle} htmlFor="ts-blanks">{t({ bn: 'ফাঁকা লাইন', en: 'Blank lines' })}</label>
          <select id="ts-blanks" style={inputStyle} value={blanks} onChange={(e) => setBlanks(e.target.value as 'keep' | 'remove' | 'one')}>
            <option value="keep">{t({ bn: 'রাখুন', en: 'Keep' })}</option>
            <option value="remove">{t({ bn: 'সরান', en: 'Remove' })}</option>
            <option value="one">{t({ bn: 'একটি করে রাখুন', en: 'Collapse to one' })}</option>
          </select>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12 }}>
        <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 15 }}>
          <input type="checkbox" checked={ignoreCase} onChange={(e) => setIgnoreCase(e.target.checked)} />
          {t({ bn: 'বড়-ছোট অক্ষর এক ধরে নিন', en: 'Ignore case' })}
        </label>
        <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 15 }}>
          <input type="checkbox" checked={trim} onChange={(e) => setTrim(e.target.checked)} />
          {t({ bn: 'প্রতি লাইনের ফাঁকা জায়গা ছাঁটুন', en: 'Trim each line' })}
        </label>
        <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 15 }}>
          <input type="checkbox" checked={lineNumbers} onChange={(e) => setLineNumbers(e.target.checked)} />
          {t({ bn: 'লাইন নম্বর যোগ করুন', en: 'Add line numbers' })}
        </label>
      </div>
      <Tiles items={[
        { labelBn: 'মোট লাইন', labelEn: 'Total lines', value: String(result.totalLines) },
        { labelBn: 'ফাঁকা ছাড়া', labelEn: 'Non-blank', value: String(result.nonBlank) },
        { labelBn: 'আলাদা লাইন', labelEn: 'Distinct', value: String(result.distinct) },
        { labelBn: 'ডুপ্লিকেট ঘটনা', labelEn: 'Duplicate occurrences', value: String(result.duplicateOccurrences) },
        { labelBn: 'ডুপ্লিকেট দল', labelEn: 'Duplicate groups', value: String(result.duplicateGroups) },
        { labelBn: 'কমেছে', labelEn: 'Reduction', value: `${reduction}%` },
      ]} />
      <div style={{ marginTop: 14 }}>
        <label style={labelStyle} htmlFor="ts-output">{t({ bn: 'ফলাফল', en: 'Result' })}</label>
        <textarea id="ts-output" style={{ ...inputStyle, minHeight: 140 }} value={output} readOnly />
      </div>
      <ButtonRow>
        <CopyButton text={output} labelBn="ফলাফল কপি করুন" labelEn="Copy result" />
        <button type="button" style={{ minHeight: 44, padding: '0 18px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--heading)', fontWeight: 600, cursor: 'pointer' }} onClick={() => downloadText('eduvelto-sorted.txt', output)}>
          {t({ bn: '.txt ডাউনলোড করুন', en: 'Download .txt' })}
        </button>
      </ButtonRow>
      <p style={noteStyle}>{t({ bn: 'বাংলা লাইন বাংলার বর্ণক্রমে সাজানো হয় (অ-এর আগে আ নয়) — ইংরেজি ক্রমে সাজালে বাংলা ভুলভাবে সাজে। সংখ্যা মোডে ২-এর আগে ১০ আসে না; ১, ২, ১০ এই ক্রমে আসে।', en: 'Bangla lines sort in Bangla alphabetical order — English collation would order them wrongly. In numeric mode 2 comes before 10, as 1, 2, 10.' })}</p>
    </section>
  );
}
