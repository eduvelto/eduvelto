// Eduvelto — Emoji Picker tool UI (Text batch, 27 Nov 2026).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Pure data lives in src/lib/tools/textTools.ts (real Unicode emoji).
// All processing is 100% in-browser; nothing is uploaded.
import { useMemo, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, ButtonRow, shortInputStyle, labelStyle, cardStyle, noteStyle, activeButtonStyle, buttonStyle } from './toolUi';
import { EMOJI_CATEGORIES, searchEmojis } from '../../lib/tools/textTools';

export function EmojiPickerTool() {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [picked, setPicked] = useState<string[]>([]);
  const [copied, setCopied] = useState('');
  const shown = useMemo(() => {
    if (query.trim() !== '') return searchEmojis(query);
    if (category === 'all') return EMOJI_CATEGORIES.flatMap((c) => c.emojis);
    return EMOJI_CATEGORIES.find((c) => c.id === category)?.emojis ?? [];
  }, [query, category]);
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(text);
      window.setTimeout(() => setCopied(''), 1500);
    } catch { /* clipboard unavailable */ }
  };
  const addPicked = (emoji: string) => setPicked((p) => [...p, emoji]);
  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="ইমোজি পিকার" titleEn="Emoji Picker" descBn="ক্যাটাগরি বা খোঁজ দিয়ে ইমোজি বেছে কপি করুন — আসল ইউনিকোড ইমোজি।" descEn="Browse emojis by category or search and copy them — real Unicode emoji." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div>
        <label style={labelStyle} htmlFor="emoji-search">{t({ bn: 'খুঁজুন (যেমন: love, cat, food)', en: 'Search (e.g. love, cat, food)' })}</label>
        <input id="emoji-search" style={shortInputStyle} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="love" />
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
        <button type="button" style={category === 'all' && query === '' ? activeButtonStyle : buttonStyle} onClick={() => { setCategory('all'); setQuery(''); }}>{t({ bn: 'সব', en: 'All' })}</button>
        {EMOJI_CATEGORIES.map((c) => (
          <button key={c.id} type="button" style={category === c.id && query === '' ? activeButtonStyle : buttonStyle} onClick={() => { setCategory(c.id); setQuery(''); }}>
            {t({ bn: c.nameBn, en: c.nameEn })}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
        {shown.map((emoji) => (
          <button key={emoji} type="button" aria-label={emoji} onClick={() => { void addPicked(emoji); void copy(emoji); }} style={{ fontSize: 26, padding: '6px 8px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--card)', cursor: 'pointer' }}>
            {emoji}
          </button>
        ))}
      </div>
      {shown.length === 0 ? <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 12 }}>{t({ bn: 'কিছু পাওয়া যায়নি — অন্য শব্দ লিখে দেখুন।', en: 'Nothing found — try another word.' })}</p> : null}
      {picked.length > 0 ? (
        <div style={{ marginTop: 14, padding: '12px', background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 10 }}>
          <p style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600 }}>{t({ bn: 'আপনার বাছাই', en: 'Your picks' })}</p>
          <p style={{ margin: '0 0 10px', fontSize: 26, lineHeight: 1.5 }}>{picked.join('')}</p>
          <ButtonRow>
            <button type="button" style={buttonStyle} onClick={() => void copy(picked.join(''))}>{copied === picked.join('') ? t({ bn: 'কপি হয়েছে', en: 'Copied' }) : t({ bn: 'সব কপি করুন', en: 'Copy all' })}</button>
            <button type="button" style={buttonStyle} onClick={() => setPicked([])}>{t({ bn: 'মুছুন', en: 'Clear' })}</button>
          </ButtonRow>
        </div>
      ) : null}
      <p style={noteStyle}>{t({ bn: 'ইমোজিতে ক্লিক করলেই সেটি কপি হয় ও নিচের বাছাইয়ে যোগ হয়। খোঁজে ইংরেজি শব্দ ব্যবহার করুন।', en: 'Click an emoji to copy it and add it to your picks below. Use English words for search.' })}</p>
    </section>
  );
}
