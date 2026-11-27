// Eduvelto — Word Counter tool UI.
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Pure logic lives in src/lib/tools — this file is presentation only.
// All processing is 100% in-browser; nothing is uploaded.

import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, Tiles, ButtonRow, ClearButton, ExampleButton, inputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { wordCount } from '../../lib/tools/wordCounter';


const resultStyle: CSSProperties = {
  marginTop: 14,
  padding: '18px 16px',
  borderRadius: 12,
  background: 'var(--teal-soft)',
  boxShadow: 'var(--shadow-sm)',
};

export function WordCounterTool() {
  const { t } = useLanguage();
  const [input, setInput] = useState('');
  const counts = useMemo(() => wordCount(input), [input]);
  const reading = counts.readingSeconds >= 60
    ? `${Math.floor(counts.readingSeconds / 60)} ${t({ bn: 'মিনিট', en: 'min' })} ${counts.readingSeconds % 60} ${t({ bn: 'সেকেন্ড', en: 'sec' })}`
    : `${counts.readingSeconds} ${t({ bn: 'সেকেন্ড', en: 'sec' })}`;
  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="শব্দ গণনা" titleEn="Word Counter" descBn="লেখার শব্দ, অক্ষর ও পড়ার সময় গুনুন।" descEn="Count the words, characters and reading time of a text." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div>
        <label style={labelStyle} htmlFor="wc-input">{t({ bn: 'আপনার লেখা', en: 'Your text' })}</label>
        <textarea id="wc-input" style={inputStyle} value={input} onChange={(e) => setInput(e.target.value)} placeholder={t({ bn: 'এখানে লিখুন বা পেস্ট করুন…', en: 'Type or paste text here…' })} />
      </div>
      <ButtonRow>
        <ExampleButton onLoad={() => setInput('আমি বাংলা ভালোবাসি। Eduvelto is a free learning platform for Bangladesh.')} />
        <ClearButton onClear={() => setInput('')} disabled={input === ''} />
      </ButtonRow>
      <Tiles items={[
        { labelBn: 'শব্দ', labelEn: 'Words', value: String(counts.words) },
        { labelBn: 'অক্ষর', labelEn: 'Characters', value: String(counts.characters) },
        { labelBn: 'ফাঁকা ছাড়া অক্ষর', labelEn: 'Chars (no spaces)', value: String(counts.charactersNoSpaces) },
        { labelBn: 'বাক্য', labelEn: 'Sentences', value: String(counts.sentences) },
        { labelBn: 'অনুচ্ছেদ', labelEn: 'Paragraphs', value: String(counts.paragraphs) },
        { labelBn: 'লাইন', labelEn: 'Lines', value: String(counts.lines) },
      ]} />
      <div style={resultStyle} role="status">
        <strong>{t({ bn: 'পড়ার সময়', en: 'Reading time' })}: </strong>{reading}
        <span style={{ color: 'var(--muted)' }}> ({t({ bn: 'প্রায় ২০০ শব্দ/মিনিট', en: 'about 200 words per minute' })})</span>
      </div>
      <p style={noteStyle}>{t({ bn: 'শব্দ গোনা হয় ফাঁকা জায়গা দিয়ে ভাগ করে; পড়ার সময় একটি অনুমান।', en: 'Words are counted by splitting on whitespace; reading time is an estimate.' })}</p>
    </section>
  );
}
