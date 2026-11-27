// Eduvelto — Text to Binary Converter tool UI (Text batch, 27 Nov 2026).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Pure logic lives in src/lib/tools/textTools.ts.
// All processing is 100% in-browser; nothing is uploaded.
import { useMemo, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, CopyButton, ButtonRow, ClearButton, ExampleButton, inputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { textToBinary } from '../../lib/tools/textTools';

export function TextToBinaryConverterTool() {
  const { t } = useLanguage();
  const [input, setInput] = useState('Hi');
  const output = useMemo(() => textToBinary(input), [input]);
  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="টেক্সট থেকে বাইনারি কনভার্টার" titleEn="Text to Binary Converter" descBn="লেখাকে ০ ও ১-এর বাইনারি কোডে বদলান।" descEn="Convert text into binary code of 0s and 1s." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div>
        <label style={labelStyle} htmlFor="ttb-input">{t({ bn: 'আপনার লেখা', en: 'Your text' })}</label>
        <textarea id="ttb-input" style={inputStyle} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Hi" />
      </div>
      <ButtonRow>
        <ExampleButton onLoad={() => setInput('Hi')} />
        <ClearButton onClear={() => setInput('')} disabled={input === ''} />
      </ButtonRow>
      <div>
        <label style={labelStyle} htmlFor="ttb-output">{t({ bn: 'বাইনারি কোড (প্রতি অক্ষরে ৮ বিট)', en: 'Binary code (8 bits per character)' })}</label>
        <textarea id="ttb-output" style={{ ...inputStyle, minHeight: 90 }} value={output} readOnly />
      </div>
      <ButtonRow>
        <CopyButton text={output} disabled={output === ''} labelBn="ফলাফল কপি করুন" labelEn="Copy result" />
      </ButtonRow>
      <p style={noteStyle}>{t({ bn: 'প্রতিটি অক্ষর UTF-8 বাইট হিসেবে ৮-বিটের গ্রুপে দেখানো হয়; বাংলা অক্ষর একাধিক বাইট নেয়।', en: 'Each character is shown as UTF-8 bytes in 8-bit groups; a Bangla letter takes more than one byte.' })}</p>
    </section>
  );
}
