// Eduvelto — Small Text & Superscript Generator tool UI (Text batch, 27 Nov 2026).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Pure logic lives in src/lib/tools/textTools.ts.
// All processing is 100% in-browser; nothing is uploaded.
import { useMemo, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, CopyButton, ButtonRow, ClearButton, ExampleButton, shortInputStyle, inputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { smallText } from '../../lib/tools/textTools';

export function SmallTextGeneratorTool() {
  const { t } = useLanguage();
  const [input, setInput] = useState('Hello 123');
  const output = useMemo(() => smallText(input), [input]);
  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="ছোট লেখা ও সুপারস্ক্রিপ্ট জেনারেটর" titleEn="Small Text & Superscript Generator" descBn="লেখাকে ছোট সুপারস্ক্রিপ্ট অক্ষরে বদলান — সোশ্যাল মিডিয়া বায়ো ও ক্যাপশনের জন্য।" descEn="Convert text to small superscript characters — for social media bios and captions." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div>
        <label style={labelStyle} htmlFor="small-input">{t({ bn: 'আপনার লেখা (ইংরেজি অক্ষর ও সংখ্যা)', en: 'Your text (English letters and numbers)' })}</label>
        <input id="small-input" style={shortInputStyle} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Hello 123" />
      </div>
      <ButtonRow>
        <ExampleButton onLoad={() => setInput('Hello 123')} />
        <ClearButton onClear={() => setInput('')} disabled={input === ''} />
      </ButtonRow>
      <div>
        <label style={labelStyle} htmlFor="small-output">{t({ bn: 'ফলাফল', en: 'Result' })}</label>
        <textarea id="small-output" style={{ ...inputStyle, minHeight: 90 }} value={output} readOnly />
      </div>
      <ButtonRow>
        <CopyButton text={output} disabled={output === ''} labelBn="ফলাফল কপি করুন" labelEn="Copy result" />
      </ButtonRow>
      <p style={noteStyle}>{t({ bn: 'ছোট অক্ষরগুলো ইউনিকোড সুপারস্ক্রিপ্ট/স্মল-ক্যাপ অক্ষর — A–Z, a–z ও ০–৯ বদলায়; বাংলা অক্ষর ও অন্য চিহ্ন যেমন আছে তেমনই থাকে।', en: 'The small letters are Unicode superscript / small-cap characters — A–Z, a–z and 0–9 are converted; Bangla letters and other symbols stay unchanged.' })}</p>
    </section>
  );
}
