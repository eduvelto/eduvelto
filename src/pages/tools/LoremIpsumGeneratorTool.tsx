// Eduvelto — Lorem Ipsum Generator tool UI.
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Pure logic lives in src/lib/tools — this file is presentation only.
// All processing is 100% in-browser; nothing is uploaded.

import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, CopyButton, Tiles, ButtonRow, shortInputStyle, labelStyle, cardStyle, buttonStyle, noteStyle } from './toolUi';
import { generateLorem } from '../../lib/tools/loremIpsum';
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

export function LoremIpsumGeneratorTool() {
  const { t } = useLanguage();
  const [paragraphs, setParagraphs] = useState(3);
  const [sentences, setSentences] = useState(4);
  const output = useMemo(() => generateLorem({ paragraphs, sentencesPerParagraph: sentences }), [paragraphs, sentences]);
  const words = useMemo(() => countText(output).words, [output]);
  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="লোরেম ইপসাম জেনারেটর" titleEn="Lorem Ipsum Generator" descBn="নকশা বা লেখার খসড়ার জন্য নমুনা লেখা তৈরি করুন।" descEn="Generate sample text for a design or writing draft." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <div>
          <label style={labelStyle} htmlFor="li-para">{t({ bn: 'অনুচ্ছেদের সংখ্যা', en: 'Paragraphs' })}</label>
          <input id="li-para" style={shortInputStyle} type="number" min={1} max={20} value={paragraphs} onChange={(e) => setParagraphs(Math.max(1, Math.min(20, Number(e.target.value) || 1)))} />
        </div>
        <div>
          <label style={labelStyle} htmlFor="li-sent">{t({ bn: 'প্রতি অনুচ্ছেদে বাক্য', en: 'Sentences per paragraph' })}</label>
          <input id="li-sent" style={shortInputStyle} type="number" min={1} max={10} value={sentences} onChange={(e) => setSentences(Math.max(1, Math.min(10, Number(e.target.value) || 1)))} />
        </div>
      </div>
      <Tiles items={[{ labelBn: 'মোট শব্দ', labelEn: 'Total words', value: String(words) }, { labelBn: 'অনুচ্ছেদ', labelEn: 'Paragraphs', value: String(paragraphs) }]} />
      <div style={{ marginTop: 12 }}>
        <label style={labelStyle} htmlFor="li-output">{t({ bn: 'নমুনা লেখা', en: 'Sample text' })}</label>
        <textarea id="li-output" style={outputStyle} value={output} readOnly aria-readonly="true" />
      </div>
      <ButtonRow>
        <CopyButton text={output} />
        <button type="button" style={buttonStyle} onClick={() => { setParagraphs(3); setSentences(4); }}>{t({ bn: 'আবার তৈরি করুন', en: 'Regenerate' })}</button>
      </ButtonRow>
      <p style={noteStyle}>{t({ bn: 'লোরেম ইপসাম অর্থহীন নমুনা লেখা — নকশায় জায়গা দেখানোর জন্য, পড়ার জন্য নয়।', en: 'Lorem Ipsum is meaningless sample text — for showing space in a design, not for reading.' })}</p>
    </section>
  );
}
