// Eduvelto — Number to Words Converter tool UI.
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Pure logic lives in src/lib/tools — this file is presentation only.
// All processing is 100% in-browser; nothing is uploaded.

import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, CopyButton, ButtonRow, ClearButton, ExampleButton, shortInputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { numberToEnglishWords, numberToBanglaWords, parseNumberInput } from '../../lib/tools/numberWords';


const resultStyle: CSSProperties = {
  marginTop: 14,
  padding: '18px 16px',
  borderRadius: 12,
  background: 'var(--teal-soft)',
  boxShadow: 'var(--shadow-sm)',
};

const errorStyle: CSSProperties = {
  marginTop: 12,
  padding: '10px 12px',
  borderRadius: 8,
  background: '#fef2f2',
  color: '#991b1b',
  fontSize: 14,
};

export function NumberToWordsConverterTool() {
  const { t } = useLanguage();
  const [raw, setRaw] = useState('');
  const parsed = useMemo(() => parseNumberInput(raw), [raw]);
  const en = useMemo(() => (parsed === null ? '' : numberToEnglishWords(parsed)), [parsed]);
  const bn = useMemo(() => (parsed === null ? '' : numberToBanglaWords(parsed)), [parsed]);
  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="সংখ্যা থেকে শব্দ কনভার্টার" titleEn="Number to Words Converter" descBn="সংখ্যাকে ইংরেজি ও বাংলা শব্দে লিখুন, যেমন টাকার অঙ্ক।" descEn="Write a number out in English and Bangla words, for example an amount in taka." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div>
        <label style={labelStyle} htmlFor="nw-input">{t({ bn: 'সংখ্যা লিখুন', en: 'Enter a number' })}</label>
        <input id="nw-input" style={shortInputStyle} inputMode="decimal" value={raw} onChange={(e) => setRaw(e.target.value)} placeholder="123456" />
      </div>
      {raw.trim() !== '' && parsed === null ? (
        <div style={errorStyle} role="alert">{t({ bn: 'সঠিক সংখ্যা লিখুন (কমা ও বাংলা সংখ্যাও চলবে)।', en: 'Enter a valid number (commas and Bangla digits work too).' })}</div>
      ) : null}
      <div style={resultStyle} role="status">
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>{t({ bn: 'ইংরেজিতে', en: 'In English' })}</div>
          <div style={{ fontSize: 18, fontWeight: 700, textTransform: 'capitalize' }}>{en || '—'}</div>
          <div style={{ marginTop: 6 }}><CopyButton text={en} /></div>
        </div>
        <div>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>{t({ bn: 'বাংলায়', en: 'In Bangla' })}</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{bn || '—'}</div>
          <div style={{ marginTop: 6 }}><CopyButton text={bn} /></div>
        </div>
      </div>
      <ButtonRow>
        <ExampleButton onLoad={() => setRaw('123456')} />
        <ClearButton onClear={() => setRaw('')} disabled={raw === ''} />
      </ButtonRow>
      <p style={noteStyle}>{t({ bn: 'বাংলায় হাজার / লক্ষ / কোটি পদ্ধতি ব্যবহার করা হয়। দশমিকের পরের সংখ্যা একে একে পড়া হয়।', en: 'Bangla uses the হাজার / লক্ষ / কোটি system. Digits after the decimal point are read one by one.' })}</p>
    </section>
  );
}
