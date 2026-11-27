// Eduvelto — ASCII Art Generator tool UI (Text batch, 27 Nov 2026).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Pure logic lives in src/lib/tools/textTools.ts.
// All processing is 100% in-browser; nothing is uploaded.
import { useMemo, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, CopyButton, ButtonRow, ClearButton, ExampleButton, shortInputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { asciiArt, ASCII_ART_COVERED } from '../../lib/tools/textTools';

export function AsciiArtGeneratorTool() {
  const { t } = useLanguage();
  const [input, setInput] = useState('HI');
  const output = useMemo(() => asciiArt(input), [input]);
  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="আসকি আর্ট জেনারেটর" titleEn="ASCII Art Generator" descBn="লেখাকে বড় ব্লক অক্ষরের আসকি আর্টে বদলান।" descEn="Turn text into big block-letter ASCII art." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div>
        <label style={labelStyle} htmlFor="ascii-input">{t({ bn: 'আপনার লেখা', en: 'Your text' })}</label>
        <input id="ascii-input" style={shortInputStyle} value={input} onChange={(e) => setInput(e.target.value)} placeholder="HI" />
      </div>
      <ButtonRow>
        <ExampleButton onLoad={() => setInput('HI')} />
        <ClearButton onClear={() => setInput('')} disabled={input === ''} />
      </ButtonRow>
      <pre style={{ margin: '14px 0 0', padding: '14px 12px', background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 10, overflowX: 'auto', fontSize: 14, lineHeight: 1.3, whiteSpace: 'pre' }}>{output || t({ bn: 'এখানে আর্ট দেখাবে।', en: 'The art will show here.' })}</pre>
      <ButtonRow>
        <CopyButton text={output} disabled={output === ''} labelBn="আর্ট কপি করুন" labelEn="Copy art" />
      </ButtonRow>
      <p style={noteStyle}>{t({ bn: `এই ফন্টে আছে: ${ASCII_ART_COVERED}। এর বাইরের অক্ষর ফাঁকা ব্লক হিসেবে দেখায়।`, en: `This font covers: ${ASCII_ART_COVERED}. Characters outside that show as a blank block.` })}</p>
    </section>
  );
}
