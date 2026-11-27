// Eduvelto — Translate tool UI (27 Nov 2026).
// English ↔ Bangla sentence translation via MyMemory (free, no key).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
import { useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, CopyButton, ButtonRow, ClearButton, ExampleButton, inputStyle, labelStyle, cardStyle, noteStyle, buttonStyle, primaryButtonStyle } from './toolUi';
import { translateText, type TranslateDirection } from '../../lib/tools/translateApi';

const errorStyle: CSSProperties = { marginTop: 14, color: '#b3261e', fontSize: 14 };
const resultStyle: CSSProperties = { marginTop: 14, padding: '18px 16px', borderRadius: 12, background: 'var(--teal-soft)', boxShadow: 'var(--shadow-sm)' };

export function TranslateTool() {
  const { t } = useLanguage();
  const [dir, setDir] = useState<TranslateDirection>('en|bn');
  const [input, setInput] = useState('Education is the backbone of a nation.');
  const [output, setOutput] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onTranslate() {
    setLoading(true);
    setError(null);
    setOutput(null);
    const res = await translateText(input, dir);
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setOutput(res.translated);
  }

  const swap = () => {
    setDir(dir === 'en|bn' ? 'bn|en' : 'en|bn');
    setOutput(null);
    setError(null);
  };

  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="অনুবাদ (ইংরেজি ↔ বাংলা)" titleEn="Translate (English ↔ Bangla)" descBn="বাক্য ইংরেজি থেকে বাংলায় বা বাংলা থেকে ইংরেজিতে অনুবাদ করুন।" descEn="Translate sentences between English and Bangla." chipBn="MyMemory — ফ্রি, কোনো চাবি লাগে না" chipEn="MyMemory — free, no key needed" />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <button type="button" style={dir === 'en|bn' ? primaryButtonStyle : buttonStyle} onClick={() => { setDir('en|bn'); setOutput(null); setError(null); }}>{t({ bn: 'ইংরেজি → বাংলা', en: 'English → Bangla' })}</button>
        <button type="button" style={dir === 'bn|en' ? primaryButtonStyle : buttonStyle} onClick={() => { setDir('bn|en'); setOutput(null); setError(null); }}>{t({ bn: 'বাংলা → ইংরেজি', en: 'Bangla → English' })}</button>
        <button type="button" style={buttonStyle} onClick={swap}>{t({ bn: 'দিক বদলান', en: 'Swap direction' })}</button>
      </div>
      <div>
        <label style={labelStyle} htmlFor="translate-input">{t({ bn: dir === 'en|bn' ? 'ইংরেজি বাক্য লিখুন (সর্বোচ্চ ৫০০ অক্ষর)' : 'বাংলা বাক্য লিখুন (সর্বোচ্চ ৫০০ অক্ষর)', en: dir === 'en|bn' ? 'Enter an English sentence (max 500 characters)' : 'Enter a Bangla sentence (max 500 characters)' })}</label>
        <textarea id="translate-input" style={inputStyle} value={input} onChange={(e) => setInput(e.target.value)} placeholder={dir === 'en|bn' ? 'Education is the backbone of a nation.' : 'শিক্ষা জাতির মেরুদণ্ড।'} />
      </div>
      <ButtonRow>
        <button type="button" style={primaryButtonStyle} onClick={() => void onTranslate()} disabled={loading || input.trim() === ''}>{loading ? t({ bn: 'অনুবাদ হচ্ছে…', en: 'Translating…' }) : t({ bn: 'অনুবাদ করুন', en: 'Translate' })}</button>
        <ExampleButton onLoad={() => { setInput(dir === 'en|bn' ? 'Education is the backbone of a nation.' : 'শিক্ষা জাতির মেরুদণ্ড।'); setOutput(null); setError(null); }} />
        <ClearButton onClear={() => { setInput(''); setOutput(null); setError(null); }} />
      </ButtonRow>
      {error ? <p style={errorStyle} role="alert">{error}</p> : null}
      {output ? (
        <div style={resultStyle} role="status">
          <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{t({ bn: 'অনুবাদ', en: 'Translation' })}</p>
          <p style={{ margin: 0, fontSize: 18, lineHeight: 1.6 }}>{output}</p>
          <ButtonRow><CopyButton text={output} labelBn="অনুবাদ কপি করুন" labelEn="Copy translation" /></ButtonRow>
        </div>
      ) : null}
      <p style={noteStyle}>{t({ bn: 'MyMemory কমিউনিটির অনুবাদ ব্যবহার করে, তাই মান সবসময় একরকম হয় না — গুরুত্বপূর্ণ লেখায় নিজে যাচাই করুন। বিনা লগইনে দৈনিক সীমা আছে; সীমা শেষ হলে পরের দিন আবার চেষ্টা করুন। একক শব্দের অর্থের জন্য অভিধান টুল ব্যবহার করুন।', en: 'MyMemory uses community translations, so quality varies — check important text yourself. The anonymous tier has a daily limit; if it runs out, try again tomorrow. For single words, use the Dictionary tool.' })}</p>
    </section>
  );
}
