// Eduvelto — Anagram Solver / Checker tool UI (Text batch, 27 Nov 2026).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Pure logic lives in src/lib/tools/textTools.ts + textWordList.ts.
// All processing is 100% in-browser; nothing is uploaded.
import { useMemo, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, ButtonRow, ClearButton, ExampleButton, shortInputStyle, labelStyle, cardStyle, noteStyle, activeButtonStyle, buttonStyle } from './toolUi';
import { isAnagram, findAnagrams } from '../../lib/tools/textTools';
import type { CSSProperties } from 'react';

const resultStyle: CSSProperties = { marginTop: 14, padding: '18px 16px', borderRadius: 12, background: 'var(--teal-soft)', boxShadow: 'var(--shadow-sm)' };
const headlineStyle: CSSProperties = { fontFamily: 'var(--font-head)', fontSize: '2rem', lineHeight: 1.2, color: 'var(--teal-deep)', margin: '4px 0 0' };
const headlineLabelStyle: CSSProperties = { fontSize: 13, fontWeight: 600, color: 'var(--muted)', margin: 0 };

export function AnagramSolverTool() {
  const { t } = useLanguage();
  const [mode, setMode] = useState<'check' | 'solve'>('solve');
  const [word, setWord] = useState('listen');
  const [other, setOther] = useState('silent');
  const check = useMemo(() => isAnagram(word, other), [word, other]);
  const solved = useMemo(() => findAnagrams(word), [word]);
  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="অ্যানাগ্রাম সলভার ও পরীক্ষক" titleEn="Anagram Solver & Checker" descBn="দুটি শব্দ অ্যানাগ্রাম কি না যাচাই করুন, বা একটি শব্দের সব অ্যানাগ্রাম খুঁজুন।" descEn="Check whether two words are anagrams, or find all anagrams of a word." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <button type="button" style={mode === 'solve' ? activeButtonStyle : buttonStyle} onClick={() => setMode('solve')}>{t({ bn: 'অ্যানাগ্রাম খুঁজুন', en: 'Find anagrams' })}</button>
        <button type="button" style={mode === 'check' ? activeButtonStyle : buttonStyle} onClick={() => setMode('check')}>{t({ bn: 'যাচাই করুন', en: 'Check two words' })}</button>
      </div>
      <div>
        <label style={labelStyle} htmlFor="ana-word">{t({ bn: 'শব্দ (ইংরেজি)', en: 'Word (English)' })}</label>
        <input id="ana-word" style={shortInputStyle} value={word} onChange={(e) => setWord(e.target.value)} placeholder="listen" />
      </div>
      {mode === 'check' ? (
        <div style={{ marginTop: 12 }}>
          <label style={labelStyle} htmlFor="ana-other">{t({ bn: 'অন্য শব্দ', en: 'Other word' })}</label>
          <input id="ana-other" style={shortInputStyle} value={other} onChange={(e) => setOther(e.target.value)} placeholder="silent" />
        </div>
      ) : null}
      <ButtonRow>
        <ExampleButton onLoad={() => { setWord('listen'); setOther('silent'); }} />
        <ClearButton onClear={() => { setWord(''); setOther(''); }} disabled={word === '' && other === ''} />
      </ButtonRow>
      {mode === 'check' && word.trim() !== '' && other.trim() !== '' ? (
        <div style={resultStyle} role="status">
          <p style={headlineLabelStyle}>{t({ bn: 'ফলাফল', en: 'Result' })}</p>
          <p style={headlineStyle}>{check ? t({ bn: 'হ্যাঁ, অ্যানাগ্রাম', en: 'Yes, anagrams' }) : t({ bn: 'না, অ্যানাগ্রাম নয়', en: 'No, not anagrams' })}</p>
        </div>
      ) : null}
      {mode === 'solve' && word.trim() !== '' ? (
        <div style={{ marginTop: 14 }}>
          <p style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600 }}>{t({ bn: `“${word}”-এর অ্যানাগ্রাম (${solved.length}টি)`, en: `Anagrams of “${word}” (${solved.length})` })}</p>
          {solved.length > 0 ? (
            <ul style={{ margin: 0, padding: '0 0 0 18px', fontSize: 16, lineHeight: 1.8 }}>
              {solved.map((w) => <li key={w}>{w}</li>)}
            </ul>
          ) : (
            <p style={{ color: 'var(--muted)', fontSize: 14 }}>{t({ bn: 'তালিকায় কোনো অ্যানাগ্রাম পাওয়া যায়নি।', en: 'No anagram found in the list.' })}</p>
          )}
        </div>
      ) : null}
      <p style={noteStyle}>{t({ bn: 'সলভার শুধু এই টুলের প্রচলিত শব্দের তালিকা থেকে খোঁজে — পুরো অভিধান নয়। তাই কোনো অ্যানাগ্রাম না পাওয়া মানে সেটি নেই, এমন নয়।', en: 'The solver only searches this tool’s list of common words — not a full dictionary. So no result does not mean no anagram exists.' })}</p>
    </section>
  );
}
