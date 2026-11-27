// Eduvelto — Remove Extra Spaces tool UI.
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Pure logic lives in src/lib/tools — this file is presentation only.
// All processing is 100% in-browser; nothing is uploaded.

import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, CopyButton, Tiles, ButtonRow, ClearButton, ExampleButton, inputStyle, labelStyle, cardStyle } from './toolUi';
import { cleanExtraSpaces } from '../../lib/tools/removeExtraSpaces';
import { countText } from '../../lib/tools/textUtils';


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

export function RemoveExtraSpacesTool() {
  const { t } = useLanguage();
  const [input, setInput] = useState('');
  const [removeBlank, setRemoveBlank] = useState(false);
  const output = useMemo(() => cleanExtraSpaces(input, removeBlank), [input, removeBlank]);
  const before = useMemo(() => countText(input), [input]);
  const after = useMemo(() => countText(output), [output]);
  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="অতিরিক্ত ফাঁকা জায়গা সরান" titleEn="Remove Extra Spaces" descBn="লেখার অতিরিক্ত ফাঁকা জায়গা ও খালি লাইন সরিয়ে লেখা পরিষ্কার করুন।" descEn="Clean up text by removing extra spaces and blank lines." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div>
        <label style={labelStyle} htmlFor="rs-input">{t({ bn: 'আপনার লেখা', en: 'Your text' })}</label>
        <textarea id="rs-input" style={inputStyle} value={input} onChange={(e) => setInput(e.target.value)} placeholder={t({ bn: 'এখানে লিখুন…', en: 'Type here…' })} />
      </div>
      <div style={{ marginTop: 12 }}>
        <label style={{ fontSize: 15 }}><input type="checkbox" checked={removeBlank} onChange={(e) => setRemoveBlank(e.target.checked)} /> {t({ bn: 'খালি লাইনও সরান', en: 'Also remove blank lines' })}</label>
      </div>
      <Tiles items={[
        { labelBn: 'আগে অক্ষর', labelEn: 'Chars before', value: String(before.characters) },
        { labelBn: 'পরে অক্ষর', labelEn: 'Chars after', value: String(after.characters) },
        { labelBn: 'সরানো হয়েছে', labelEn: 'Removed', value: String(Math.max(0, before.characters - after.characters)) },
      ]} />
      <div style={{ marginTop: 12 }}>
        <label style={labelStyle} htmlFor="rs-output">{t({ bn: 'পরিষ্কার লেখা', en: 'Cleaned text' })}</label>
        <textarea id="rs-output" style={outputStyle} value={output} readOnly aria-readonly="true" />
      </div>
      <ButtonRow>
        <CopyButton text={output} />
        <ExampleButton onLoad={() => setInput('Hello    world!\n\n\nThis   is   a    test.\n\nGoodbye.')} />
        <ClearButton onClear={() => setInput('')} disabled={input === ''} />
      </ButtonRow>
    </section>
  );
}
