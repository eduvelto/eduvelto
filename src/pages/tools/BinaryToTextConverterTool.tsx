// Eduvelto — Binary to Text Converter tool UI (Text batch, 27 Nov 2026).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Pure logic lives in src/lib/tools/textTools.ts.
// All processing is 100% in-browser; nothing is uploaded.
import { useMemo, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, CopyButton, ButtonRow, ClearButton, ExampleButton, inputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { binaryToText } from '../../lib/tools/textTools';

export function BinaryToTextConverterTool() {
  const { t } = useLanguage();
  const [input, setInput] = useState('01001000 01101001');
  const output = useMemo(() => binaryToText(input), [input]);
  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="বাইনারি থেকে টেক্সট কনভার্টার" titleEn="Binary to Text Converter" descBn="বাইনারি কোড (০ ও ১) আবার পড়ার মতো লেখায় ফেরান।" descEn="Turn binary code (0s and 1s) back into readable text." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div>
        <label style={labelStyle} htmlFor="btt-input">{t({ bn: 'বাইনারি কোড (৮-বিটের গ্রুপ, ফাঁকা দিয়ে আলাদা)', en: 'Binary code (8-bit groups, separated by spaces)' })}</label>
        <textarea id="btt-input" style={inputStyle} value={input} onChange={(e) => setInput(e.target.value)} placeholder="01001000 01101001" />
      </div>
      <ButtonRow>
        <ExampleButton onLoad={() => setInput('01001000 01101001')} />
        <ClearButton onClear={() => setInput('')} disabled={input === ''} />
      </ButtonRow>
      <div>
        <label style={labelStyle} htmlFor="btt-output">{t({ bn: 'ফলাফল', en: 'Result' })}</label>
        <textarea id="btt-output" style={{ ...inputStyle, minHeight: 90 }} value={output ?? ''} readOnly />
      </div>
      <ButtonRow>
        <CopyButton text={output ?? ''} disabled={!output} labelBn="ফলাফল কপি করুন" labelEn="Copy result" />
      </ButtonRow>
      {output === null ? <p style={{ color: '#b3261e', fontSize: 14, marginTop: 12 }}>{t({ bn: 'বাইনারি ঠিক নয় — প্রতি গ্রুপে ঠিক ৮টি ০/১ থাকতে হবে।', en: 'Not valid binary — every group must be exactly eight 0s and 1s.' })}</p> : null}
      <p style={noteStyle}>{t({ bn: 'উদাহরণ: 01001000 01101001 মানে Hi।', en: 'Example: 01001000 01101001 means Hi.' })}</p>
    </section>
  );
}
