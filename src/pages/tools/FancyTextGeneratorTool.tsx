// Eduvelto — Fancy Text Generator tool UI.
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Pure logic lives in src/lib/tools — this file is presentation only.
// All processing is 100% in-browser; nothing is uploaded.

import { useMemo, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, CopyButton, ButtonRow, ClearButton, ExampleButton, shortInputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { fancyTextAllStyles } from '../../lib/tools/fancyText';


export function FancyTextGeneratorTool() {
  const { t } = useLanguage();
  const [input, setInput] = useState('');
  const styles = useMemo(() => fancyTextAllStyles(input), [input]);
  const styleLabel: Record<string, { bn: string; en: string }> = {
    bold: { bn: 'মোটা', en: 'Bold' },
    italic: { bn: 'বাঁকা', en: 'Italic' },
    boldItalic: { bn: 'মোটা ও বাঁকা', en: 'Bold Italic' },
    monospace: { bn: 'মনোস্পেস', en: 'Monospace' },
    script: { bn: 'হাতের লেখা', en: 'Script' },
    doubleStruck: { bn: 'ডাবল স্ট্রাক', en: 'Double-struck' },
    circled: { bn: 'বৃত্তে ঘেরা', en: 'Circled' },
    fullwidth: { bn: 'চওড়া', en: 'Fullwidth' },
  };
  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="স্টাইলিশ লেখা জেনারেটর" titleEn="Fancy Text Generator" descBn="সাধারণ লেখাকে স্টাইলিশ অক্ষরে বদলে সোশ্যাল মিডিয়ায় ব্যবহার করুন।" descEn="Turn plain text into stylish lettering for social media." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div>
        <label style={labelStyle} htmlFor="ft-input">{t({ bn: 'আপনার লেখা (ইংরেজি অক্ষর)', en: 'Your text (English letters)' })}</label>
        <input id="ft-input" style={shortInputStyle} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Hello World" />
      </div>
      <ButtonRow>
        <ExampleButton onLoad={() => setInput('Hello World')} />
        <ClearButton onClear={() => setInput('')} disabled={input === ''} />
      </ButtonRow>
      {input === '' ? (
        <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 14 }}>{t({ bn: 'উপরে লিখলে ৮টি স্টাইলে ফল দেখাবে।', en: 'Type above to see 8 styles.' })}</p>
      ) : (
        <ul style={{ margin: '14px 0 0', padding: 0, listStyle: 'none' }}>
          {styles.map((s) => (
            <li key={s.style} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 8, padding: '10px 12px', background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 10 }}>
              <span>
                <span style={{ display: 'block', fontSize: 12, color: 'var(--muted)' }}>{t(styleLabel[s.style])}</span>
                <span style={{ fontSize: 17, wordBreak: 'break-all' }}>{s.result}</span>
              </span>
              <CopyButton text={s.result} />
            </li>
          ))}
        </ul>
      )}
      <p style={noteStyle}>{t({ bn: 'এই স্টাইলগুলো ইউনিকোড অক্ষর — বেশিরভাগ অ্যাপে দেখা যায়, তবে কিছু পুরনো ফন্টে বাক্স দেখাতে পারে।', en: 'These styles are Unicode characters — they show in most apps, but some old fonts may show boxes.' })}</p>
    </section>
  );
}
