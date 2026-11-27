// Eduvelto — Hashtag Generator tool UI (Text batch, 27 Nov 2026).
// Keyword -> hashtag GENERATOR only. Never scrapes any site and never
// extracts tags from a URL. Renders inside ToolsDetailPage's PageShell.
// Pure logic lives in src/lib/tools/textTools.ts.
// All processing is 100% in-browser; nothing is uploaded.
import { useMemo, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, CopyButton, ButtonRow, ClearButton, ExampleButton, inputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { generateHashtags } from '../../lib/tools/textTools';

export function HashtagGeneratorTool() {
  const { t } = useLanguage();
  const [input, setInput] = useState('bangladesh, cricket, world cup');
  const tags = useMemo(() => generateHashtags(input), [input]);
  const allTags = tags.join(' ');
  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="হ্যাশট্যাগ জেনারেটর" titleEn="Hashtag Generator" descBn="কীওয়ার্ড থেকে হ্যাশট্যাগ বানান — কোনো সাইট থেকে নেওয়া হয় না।" descEn="Generate hashtags from keywords — nothing is taken from any site." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div>
        <label style={labelStyle} htmlFor="tag-input">{t({ bn: 'কীওয়ার্ড (কমা বা নতুন লাইনে আলাদা)', en: 'Keywords (separated by commas or new lines)' })}</label>
        <textarea id="tag-input" style={inputStyle} value={input} onChange={(e) => setInput(e.target.value)} placeholder="bangladesh, cricket, world cup" />
      </div>
      <ButtonRow>
        <ExampleButton onLoad={() => setInput('bangladesh, cricket, world cup')} />
        <ClearButton onClear={() => setInput('')} disabled={input === ''} />
      </ButtonRow>
      {tags.length > 0 ? (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
            {tags.map((tag) => (
              <span key={tag} style={{ padding: '8px 12px', background: 'var(--teal-soft)', border: '1px solid var(--line)', borderRadius: 999, fontSize: 15, fontWeight: 600 }}>{tag}</span>
            ))}
          </div>
          <ButtonRow>
            <CopyButton text={allTags} labelBn="সব হ্যাশট্যাগ কপি করুন" labelEn="Copy all hashtags" />
          </ButtonRow>
        </>
      ) : (
        <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 14 }}>{t({ bn: 'কীওয়ার্ড দিলে হ্যাশট্যাগ দেখাবে।', en: 'Enter keywords to see hashtags.' })}</p>
      )}
      <p style={noteStyle}>{t({ bn: 'এই টুল শুধু আপনার দেওয়া কীওয়ার্ড থেকে হ্যাশট্যাগ বানায় — কোনো সাইট ঘেঁটে বা কোনো লিংক থেকে ট্যাগ তোলে না। সর্বোচ্চ ৩০টি হ্যাশট্যাগ দেওয়া হয়।', en: 'This tool only builds hashtags from the keywords you type — it never scrapes any site or extracts tags from a link. At most 30 hashtags are shown.' })}</p>
    </section>
  );
}
