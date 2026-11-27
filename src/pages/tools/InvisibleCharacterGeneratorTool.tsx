// Eduvelto — Invisible Character Generator tool UI (Text batch, 27 Nov 2026).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Pure data lives in src/lib/tools/textTools.ts.
// All processing is 100% in-browser; nothing is uploaded.
import { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, CopyButton, ButtonRow, shortInputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { INVISIBLE_CHARS, invisibleString } from '../../lib/tools/textTools';

export function InvisibleCharacterGeneratorTool() {
  const { t } = useLanguage();
  const [selected, setSelected] = useState('zwsp');
  const [count, setCount] = useState('1');
  const entry = INVISIBLE_CHARS.find((c) => c.id === selected) ?? INVISIBLE_CHARS[0];
  const n = Math.min(100, Math.max(1, Number(count) || 1));
  const generated = invisibleString(selected, n) ?? '';
  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="অদৃশ্য অক্ষর জেনারেটর" titleEn="Invisible Character Generator" descBn="দেখা যায় না এমন ফাঁকা ইউনিকোড অক্ষর কপি করুন — ফাঁকা নাম বা ফাঁকা মেসেজের জন্য।" descEn="Copy invisible blank Unicode characters — for blank names or empty messages." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div>
        <label style={labelStyle} htmlFor="inv-select">{t({ bn: 'অক্ষর বাছুন', en: 'Choose a character' })}</label>
        <select id="inv-select" value={selected} onChange={(e) => setSelected(e.target.value)} style={{ ...shortInputStyle, minHeight: 44 }}>
          {INVISIBLE_CHARS.map((c) => (
            <option key={c.id} value={c.id}>{t({ bn: `${c.nameBn} (${c.codePoint})`, en: `${c.nameEn} (${c.codePoint})` })}</option>
          ))}
        </select>
      </div>
      <div style={{ marginTop: 12 }}>
        <label style={labelStyle} htmlFor="inv-count">{t({ bn: 'কয়টি (১–১০০)', en: 'How many (1–100)' })}</label>
        <input id="inv-count" style={shortInputStyle} type="number" min="1" max="100" inputMode="numeric" value={count} onChange={(e) => setCount(e.target.value)} />
      </div>
      <div style={{ marginTop: 14, padding: '14px 12px', background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 10 }}>
        <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600 }}>{t({ bn: entry.nameBn, en: entry.nameEn })}</p>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>{t({ bn: `কোড পয়েন্ট: ${entry.codePoint} • সংখ্যা: ${n}টি — অক্ষরটি চোখে দেখা যায় না, তাই বাক্সটি ফাঁকা দেখাবে।`, en: `Code point: ${entry.codePoint} • Count: ${n} — the character is invisible, so the box looks empty.` })}</p>
      </div>
      <ButtonRow>
        <CopyButton text={generated} labelBn="অদৃশ্য অক্ষর কপি করুন" labelEn="Copy invisible character" />
      </ButtonRow>
      <p style={noteStyle}>{t({ bn: 'কপি করা অক্ষর পেস্ট করলে চোখে কিছু দেখা যাবে না — সেটাই এর কাজ। কিছু অ্যাপ এই অক্ষর মুছে ফেলতে পারে।', en: 'Pasted, the copied character shows nothing — that is the point. Some apps strip these characters.' })}</p>
    </section>
  );
}
