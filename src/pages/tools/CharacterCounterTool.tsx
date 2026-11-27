// Eduvelto — Character Counter tool UI (landed 27 Nov 2026, A-tools).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Engine: countText() in src/lib/tools/textUtils.ts (Unicode-aware). 100% in-browser; nothing is uploaded.
import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import RewardedAdButton from '../../components/RewardedAdButton';
import { ToolHero, Tiles, CopyButton, ButtonRow, ExampleButton, ClearButton, inputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { countText } from '../../lib/tools/textUtils';

const resultStyle: CSSProperties = {
  marginTop: 14,
  padding: '18px 16px',
  borderRadius: 12,
  background: 'var(--teal-soft)',
  boxShadow: 'var(--shadow-sm)',
};




function downloadText(filename: string, text: string, type = 'text/plain'): void {
  const blob = new Blob([text], { type: `${type};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const LIMITS: readonly { id: string; bn: string; en: string; limit: number | null }[] = [
  { id: 'none', bn: 'সীমা নেই', en: 'No limit', limit: null },
  { id: 'sms', bn: 'এসএমএস (১৬০)', en: 'SMS (160)', limit: 160 },
  { id: 'x', bn: 'এক্স পোস্ট (২৮০)', en: 'X post (280)', limit: 280 },
  { id: 'seo-title', bn: 'এসইও শিরোনাম (~৬০)', en: 'SEO title (~60)', limit: 60 },
  { id: 'meta', bn: 'মেটা বিবরণ (~১৫৫)', en: 'Meta description (~155)', limit: 155 },
];

const EXAMPLE = 'আমি বাংলা ভালোবাসি। Eduvelto is a free learning platform for Bangladesh — শেখো, এগিয়ে যাও, স্বপ্ন গড়ো।';

export function CharacterCounterTool() {
  const { t, lang } = useLanguage();
  const [input, setInput] = useState(EXAMPLE);
  const [preset, setPreset] = useState('sms');
  const counts = useMemo(() => countText(input), [input]);
  const active = LIMITS.find((l) => l.id === preset) ?? LIMITS[0];
  const remaining = active.limit === null ? null : active.limit - counts.characters;
  const pct = active.limit === null ? 0 : Math.min(100, Math.round((counts.characters / active.limit) * 100));
  const summary = `${counts.characters} characters (${counts.charactersNoSpaces} without spaces), ${counts.words} words, ${counts.lines} lines`;
  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="অক্ষর গণনা" titleEn="Character Counter" descBn="লেখার অক্ষর, শব্দ ও লাইন গুনুন — সীমা বেছে দেখুন কত অক্ষর বাকি আছে।" descEn="Count the characters, words and lines of a text — pick a limit to see how many characters are left." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div>
        <label style={labelStyle} htmlFor="cc-input">{t({ bn: 'আপনার লেখা', en: 'Your text' })}</label>
        <textarea id="cc-input" style={{ ...inputStyle, minHeight: 140 }} value={input} onChange={(e) => setInput(e.target.value)} placeholder={t({ bn: 'এখানে লিখুন বা পেস্ট করুন…', en: 'Type or paste text here…' })} />
      </div>
      <ButtonRow>
        <ExampleButton onLoad={() => setInput(EXAMPLE)} />
        <ClearButton onClear={() => setInput('')} disabled={input === ''} />
      </ButtonRow>
      <Tiles items={[
        { labelBn: 'অক্ষর (ফাঁকাসহ)', labelEn: 'Characters', value: String(counts.characters) },
        { labelBn: 'অক্ষর (ফাঁকা ছাড়া)', labelEn: 'Chars (no spaces)', value: String(counts.charactersNoSpaces) },
        { labelBn: 'শব্দ', labelEn: 'Words', value: String(counts.words) },
        { labelBn: 'লাইন', labelEn: 'Lines', value: String(counts.lines) },
      ]} />
      <div style={{ marginTop: 14 }}>
        <label style={labelStyle} htmlFor="cc-limit">{t({ bn: 'সীমা', en: 'Limit' })}</label>
        <select id="cc-limit" style={inputStyle} value={preset} onChange={(e) => setPreset(e.target.value)}>
          {LIMITS.map((l) => (<option key={l.id} value={l.id}>{t({ bn: l.bn, en: l.en })}</option>))}
        </select>
      </div>
      {remaining !== null ? (
        <div style={resultStyle} role="status">
          <p style={{ margin: '0 0 8px', fontSize: 16 }}>
            <strong>
              {remaining >= 0
                ? t({ bn: `${remaining} অক্ষর বাকি আছে`, en: `${remaining} characters left` })
                : t({ bn: `${-remaining} অক্ষর বেশি হয়েছে`, en: `${-remaining} characters over` })}
            </strong>
          </p>
          <div style={{ height: 10, borderRadius: 999, background: 'var(--line)', overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: remaining < 0 ? '#b3261e' : 'var(--teal)', borderRadius: 999 }} />
          </div>
          <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--muted)' }}>{pct}% {t({ bn: 'ব্যবহৃত', en: 'used' })}</p>
        </div>
      ) : (
        <p style={noteStyle}>{t({ bn: 'ফেসবুক পোস্টের বাস্তবে কোনো ছোট সীমা নেই — তাই এখানে কোনো সীমা দেখানো হচ্ছে না।', en: 'A Facebook post has no small practical limit, so no limit is shown here.' })}</p>
      )}
      <ButtonRow>
        <CopyButton text={summary} labelBn="সারাংশ কপি করুন" labelEn="Copy summary" />
        {/* Ads rollout B3 (27 Nov 2026): this download goes through RewardedAdButton (15s) — Free Download is live, the 15s Unlock stays disabled until AdSense approval (never a fake timer). */}
        <RewardedAdButton lang={lang} durationSeconds={15} onFreeDownload={() => downloadText('eduvelto-text.txt', input)} />
      </ButtonRow>
      <p style={noteStyle}>{t({ bn: 'অক্ষর গোনা হয় ইউনিকোড কোড পয়েন্ট দিয়ে — “আমি” ৩ অক্ষর। যুক্তাক্ষর একাধিক কোড পয়েন্ট হতে পারে, তাই গণনাটি আনুমানিক হতে পারে।', en: 'Characters are counted as Unicode code points — "আমি" counts as 3. Combined letters can be several code points, so the count is approximate.' })}</p>
    </section>
  );
}
