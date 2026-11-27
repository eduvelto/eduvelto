// Eduvelto — Prefix & Suffix Adder tool UI (Text batch, 27 Nov 2026).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Pure logic lives in src/lib/tools/textTools.ts.
// All processing is 100% in-browser; nothing is uploaded.
import { useMemo, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, CopyButton, ButtonRow, ClearButton, ExampleButton, inputStyle, shortInputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { addPrefixSuffix } from '../../lib/tools/textTools';

export function PrefixSuffixAdderTool() {
  const { t } = useLanguage();
  const [input, setInput] = useState('apple\nbanana\nmango');
  const [prefix, setPrefix] = useState('- ');
  const [suffix, setSuffix] = useState('');
  const output = useMemo(() => addPrefixSuffix(input, prefix, suffix), [input, prefix, suffix]);
  const clearAll = () => { setInput(''); setPrefix(''); setSuffix(''); };
  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="প্রিফিক্স ও সাফিক্স যোগকারী" titleEn="Prefix & Suffix Adder" descBn="তালিকার প্রতিটি লাইনের শুরুতে ও শেষে শব্দ বা চিহ্ন যোগ করুন।" descEn="Add a word or symbol to the start and end of every line in a list." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div>
        <label style={labelStyle} htmlFor="ps-input">{t({ bn: 'তালিকা (প্রতি লাইনে একটি)', en: 'List (one item per line)' })}</label>
        <textarea id="ps-input" style={inputStyle} value={input} onChange={(e) => setInput(e.target.value)} placeholder={'apple\nbanana\nmango'} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginTop: 12 }}>
        <div>
          <label style={labelStyle} htmlFor="ps-prefix">{t({ bn: 'প্রিফিক্স (শুরুতে)', en: 'Prefix (at the start)' })}</label>
          <input id="ps-prefix" style={shortInputStyle} value={prefix} onChange={(e) => setPrefix(e.target.value)} placeholder="- " />
        </div>
        <div>
          <label style={labelStyle} htmlFor="ps-suffix">{t({ bn: 'সাফিক্স (শেষে)', en: 'Suffix (at the end)' })}</label>
          <input id="ps-suffix" style={shortInputStyle} value={suffix} onChange={(e) => setSuffix(e.target.value)} placeholder="," />
        </div>
      </div>
      <ButtonRow>
        <ExampleButton onLoad={() => { setInput('apple\nbanana\nmango'); setPrefix('- '); setSuffix(''); }} />
        <ClearButton onClear={clearAll} disabled={input === '' && prefix === '' && suffix === ''} />
      </ButtonRow>
      <div>
        <label style={labelStyle} htmlFor="ps-output">{t({ bn: 'ফলাফল', en: 'Result' })}</label>
        <textarea id="ps-output" style={{ ...inputStyle, minHeight: 90 }} value={output} readOnly />
      </div>
      <ButtonRow>
        <CopyButton text={output} disabled={output === ''} labelBn="ফলাফল কপি করুন" labelEn="Copy result" />
      </ButtonRow>
      <p style={noteStyle}>{t({ bn: 'প্রতিটি লাইনে একই প্রিফিক্স ও সাফিক্স যোগ হয়; ফাঁকা লাইনও গণনায় আসে।', en: 'The same prefix and suffix are added to every line, including blank lines.' })}</p>
    </section>
  );
}
