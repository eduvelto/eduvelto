// Eduvelto — Bio / Username Generator tool UI (Text batch, 27 Nov 2026).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Pure logic lives in src/lib/tools/textTools.ts.
// All processing is 100% in-browser; nothing is uploaded.
import { useMemo, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, CopyButton, ButtonRow, ClearButton, ExampleButton, shortInputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { generateUsernameIdeas, generateBioIdeas } from '../../lib/tools/textTools';

export function BioUsernameGeneratorTool() {
  const { t } = useLanguage();
  const [keyword, setKeyword] = useState('photography');
  const usernames = useMemo(() => generateUsernameIdeas(keyword), [keyword]);
  const bios = useMemo(() => generateBioIdeas(keyword), [keyword]);
  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="বায়ো ও ইউজারনেম জেনারেটর" titleEn="Bio & Username Generator" descBn="কীওয়ার্ড দিলে সোশ্যাল মিডিয়ার বায়ো ও ইউজারনেমের আইডিয়া বানিয়ে দেয়।" descEn="Give a keyword to get social-media bio and username ideas." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div>
        <label style={labelStyle} htmlFor="bio-keyword">{t({ bn: 'কীওয়ার্ড (ইংরেজি)', en: 'Keyword (English)' })}</label>
        <input id="bio-keyword" style={shortInputStyle} value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="photography" />
      </div>
      <ButtonRow>
        <ExampleButton onLoad={() => setKeyword('photography')} />
        <ClearButton onClear={() => setKeyword('')} disabled={keyword === ''} />
      </ButtonRow>
      {usernames.length > 0 ? (
        <>
          <p style={{ margin: '14px 0 8px', fontSize: 14, fontWeight: 600 }}>{t({ bn: 'ইউজারনেম আইডিয়া', en: 'Username ideas' })}</p>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {usernames.map((u) => (
              <li key={u} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 8, padding: '10px 12px', background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 10 }}>
                <span style={{ fontSize: 16, fontWeight: 600, wordBreak: 'break-all' }}>{u}</span>
                <CopyButton text={u} />
              </li>
            ))}
          </ul>
          <p style={{ margin: '14px 0 8px', fontSize: 14, fontWeight: 600 }}>{t({ bn: 'বায়ো আইডিয়া', en: 'Bio ideas' })}</p>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {bios.map((b) => (
              <li key={b} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 8, padding: '10px 12px', background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 10 }}>
                <span style={{ fontSize: 15 }}>{b}</span>
                <CopyButton text={b} />
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 14 }}>{t({ bn: 'কীওয়ার্ড দিলে আইডিয়া দেখাবে।', en: 'Enter a keyword to see ideas.' })}</p>
      )}
      <p style={noteStyle}>{t({ bn: 'এগুলো আইডিয়া মাত্র — ইউজারনেমটি ইতিমধ্যে কেউ নিয়েছে কি না, তা সংশ্লিষ্ট অ্যাপেই যাচাই করতে হবে।', en: 'These are ideas only — check in the app itself whether a username is already taken.' })}</p>
    </section>
  );
}
