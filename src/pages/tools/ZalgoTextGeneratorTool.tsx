// Eduvelto — Zalgo / Glitch Text Generator tool UI (Text batch, 27 Nov 2026).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Pure logic lives in src/lib/tools/textTools.ts.
// All processing is 100% in-browser; nothing is uploaded.
import { useMemo, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, CopyButton, ButtonRow, ClearButton, ExampleButton, shortInputStyle, inputStyle, labelStyle, cardStyle, noteStyle, activeButtonStyle, buttonStyle } from './toolUi';
import { zalgoText, type ZalgoIntensity } from '../../lib/tools/textTools';

const INTENSITIES: ZalgoIntensity[] = ['light', 'medium', 'heavy'];

export function ZalgoTextGeneratorTool() {
  const { t } = useLanguage();
  const [input, setInput] = useState('Hello World');
  const [intensity, setIntensity] = useState<ZalgoIntensity>('medium');
  const output = useMemo(() => zalgoText(input, intensity), [input, intensity]);
  const intensityLabel: Record<ZalgoIntensity, { bn: string; en: string }> = {
    light: { bn: 'হালকা', en: 'Light' },
    medium: { bn: 'মাঝারি', en: 'Medium' },
    heavy: { bn: 'ভারী', en: 'Heavy' },
  };
  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="জালগো / গ্লিচ টেক্সট জেনারেটর" titleEn="Zalgo / Glitch Text Generator" descBn="সাধারণ লেখাকে জালগো স্টাইলে সাজিয়ে মজার গ্লিচ লেখা বানান।" descEn="Turn plain text into Zalgo-style glitchy decorated text." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div>
        <label style={labelStyle} htmlFor="zalgo-input">{t({ bn: 'আপনার লেখা', en: 'Your text' })}</label>
        <input id="zalgo-input" style={shortInputStyle} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Hello World" />
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
        {INTENSITIES.map((level) => (
          <button key={level} type="button" style={intensity === level ? activeButtonStyle : buttonStyle} onClick={() => setIntensity(level)}>
            {t(intensityLabel[level])}
          </button>
        ))}
      </div>
      <ButtonRow>
        <ExampleButton onLoad={() => setInput('Hello World')} />
        <ClearButton onClear={() => setInput('')} disabled={input === ''} />
      </ButtonRow>
      <div>
        <label style={labelStyle} htmlFor="zalgo-output">{t({ bn: 'ফলাফল', en: 'Result' })}</label>
        <textarea id="zalgo-output" style={{ ...inputStyle, minHeight: 90 }} value={output} readOnly />
      </div>
      <ButtonRow>
        <CopyButton text={output} disabled={output === ''} labelBn="ফলাফল কপি করুন" labelEn="Copy result" />
      </ButtonRow>
      <p style={noteStyle}>{t({ bn: 'জালগো চিহ্ন ইউনিকোড কম্বাইনিং চিহ্ন — বেশিরভাগ অ্যাপে দেখা যায়, তবে কিছু জায়গায় ভেঙে যেতে পারে।', en: 'Zalgo marks are Unicode combining characters — they show in most apps, but may break in some places.' })}</p>
    </section>
  );
}
