// Eduvelto — Duplicate Line Remover tool UI.
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Pure logic lives in src/lib/tools — this file is presentation only.
// All processing is 100% in-browser; nothing is uploaded.

import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, CopyButton, Tiles, ButtonRow, ClearButton, ExampleButton, inputStyle, labelStyle, cardStyle } from './toolUi';
import { removeDuplicateLines } from '../../lib/tools/duplicateLines';


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

export function DuplicateLineRemoverTool() {
  const { t } = useLanguage();
  const [input, setInput] = useState('');
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [sort, setSort] = useState(false);
  const result = useMemo(() => removeDuplicateLines(input, { ignoreCase, sort }), [input, ignoreCase, sort]);
  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="ডুপ্লিকেট লাইন রিমুভার" titleEn="Duplicate Line Remover" descBn="লেখা থেকে একই লাইন বারবার থাকলে তা সরিয়ে লাইন সাজান।" descEn="Remove repeated lines from a text and sort the remaining lines." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div>
        <label style={labelStyle} htmlFor="dl-input">{t({ bn: 'আপনার লেখা (প্রতি লাইনে একটি)', en: 'Your text (one item per line)' })}</label>
        <textarea id="dl-input" style={inputStyle} value={input} onChange={(e) => setInput(e.target.value)} placeholder={'apple\nbanana\napple\norange\nbanana'} />
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 12 }}>
        <label style={{ fontSize: 15 }}><input type="checkbox" checked={ignoreCase} onChange={(e) => setIgnoreCase(e.target.checked)} /> {t({ bn: 'বড়/ছোট হাতের পার্থক্য উপেক্ষা করুন', en: 'Ignore upper/lower case' })}</label>
        <label style={{ fontSize: 15 }}><input type="checkbox" checked={sort} onChange={(e) => setSort(e.target.checked)} /> {t({ bn: 'লাইন সাজান (A–Z)', en: 'Sort lines (A–Z)' })}</label>
      </div>
      <Tiles items={[
        { labelBn: 'মোট লাইন', labelEn: 'Total lines', value: String(result.originalCount) },
        { labelBn: 'অনন্য লাইন', labelEn: 'Unique lines', value: String(result.uniqueCount) },
        { labelBn: 'সরানো হয়েছে', labelEn: 'Removed', value: String(result.removed) },
      ]} />
      <div style={{ marginTop: 12 }}>
        <label style={labelStyle} htmlFor="dl-output">{t({ bn: 'ফলাফল', en: 'Result' })}</label>
        <textarea id="dl-output" style={outputStyle} value={result.result} readOnly aria-readonly="true" />
      </div>
      <ButtonRow>
        <CopyButton text={result.result} />
        <ExampleButton onLoad={() => setInput('apple\nbanana\napple\norange\nbanana\nmango')} />
        <ClearButton onClear={() => setInput('')} disabled={input === ''} />
      </ButtonRow>
    </section>
  );
}
