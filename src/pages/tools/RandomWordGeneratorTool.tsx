// Eduvelto — Random Word Generator tool UI (Text batch, 27 Nov 2026).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Pure logic lives in src/lib/tools/textTools.ts + textWordList.ts.
// All processing is 100% in-browser; nothing is uploaded.
import { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, CopyButton, ButtonRow, cardStyle, noteStyle, buttonStyle, primaryButtonStyle } from './toolUi';
import { pickRandomWords, type RandomWord } from '../../lib/tools/textTools';

export function RandomWordGeneratorTool() {
  const { t } = useLanguage();
  const [count, setCount] = useState('5');
  const [showMeaning, setShowMeaning] = useState(true);
  const [words, setWords] = useState<RandomWord[]>(() => pickRandomWords(5));
  const n = Math.min(20, Math.max(1, Number(count) || 5));
  const copyText = words.map((w) => (showMeaning ? `${w.word} — ${w.meaningBn}` : w.word)).join('\n');
  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="র‍্যান্ডম শব্দ জেনারেটর" titleEn="Random Word Generator" descBn="ইংরেজি শব্দ শিখুন বা লেখার অনুপ্রেরণা নিন — প্রতিটি শব্দের বাংলা অর্থসহ।" descEn="Learn English words or get writing inspiration — each word with its Bangla meaning." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <label style={{ fontSize: 14, fontWeight: 600 }}>{t({ bn: 'কয়টি শব্দ', en: 'How many words' })}</label>
        <select value={count} onChange={(e) => setCount(e.target.value)} style={{ ...buttonStyle, minHeight: 40 }}>
          {['1', '3', '5', '10', '20'].map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <label style={{ fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={showMeaning} onChange={(e) => setShowMeaning(e.target.checked)} />
          {t({ bn: 'বাংলা অর্থ দেখান', en: 'Show Bangla meaning' })}
        </label>
      </div>
      <ButtonRow>
        <button type="button" style={primaryButtonStyle} onClick={() => setWords(pickRandomWords(n))}>
          {t({ bn: 'নতুন শব্দ নিন', en: 'Get new words' })}
        </button>
        <CopyButton text={copyText} disabled={words.length === 0} labelBn="সব কপি করুন" labelEn="Copy all" />
      </ButtonRow>
      <ul style={{ margin: '14px 0 0', padding: 0, listStyle: 'none' }}>
        {words.map((w) => (
          <li key={w.word} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '10px 12px', marginBottom: 8, background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 10 }}>
            <span style={{ fontSize: 17, fontWeight: 700 }}>{w.word}</span>
            {showMeaning ? <span style={{ fontSize: 15, color: 'var(--muted)' }}>{w.meaningBn}</span> : null}
          </li>
        ))}
      </ul>
      <p style={noteStyle}>{t({ bn: 'তালিকায় ১৩২টি প্রচলিত ইংরেজি শব্দ আছে; অর্থগুলো যাচাই করা সাধারণ অনুবাদ।', en: 'The list holds 132 common English words; the meanings are checked, everyday translations.' })}</p>
    </section>
  );
}
