// Eduvelto — Palindrome Checker tool UI (Text batch, 27 Nov 2026).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Pure logic lives in src/lib/tools/textTools.ts.
// All processing is 100% in-browser; nothing is uploaded.
import { useMemo, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, Tiles, ButtonRow, ClearButton, ExampleButton, shortInputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { palindromeInfo } from '../../lib/tools/textTools';
import type { CSSProperties } from 'react';

const resultStyle: CSSProperties = { marginTop: 14, padding: '18px 16px', borderRadius: 12, background: 'var(--teal-soft)', boxShadow: 'var(--shadow-sm)' };
const headlineStyle: CSSProperties = { fontFamily: 'var(--font-head)', fontSize: '2rem', lineHeight: 1.2, color: 'var(--teal-deep)', margin: '4px 0 0' };
const headlineLabelStyle: CSSProperties = { fontSize: 13, fontWeight: 600, color: 'var(--muted)', margin: 0 };

export function PalindromeCheckerTool() {
  const { t } = useLanguage();
  const [input, setInput] = useState('Madam');
  const info = useMemo(() => palindromeInfo(input), [input]);
  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="প্যালিনড্রোম পরীক্ষক" titleEn="Palindrome Checker" descBn="শব্দ বা বাক্য উল্টো দিক থেকে একইভাবে পড়া যায় কি না দেখুন।" descEn="Check whether a word or phrase reads the same backwards." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div>
        <label style={labelStyle} htmlFor="pal-input">{t({ bn: 'শব্দ বা বাক্য', en: 'Word or phrase' })}</label>
        <input id="pal-input" style={shortInputStyle} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Madam" />
      </div>
      <ButtonRow>
        <ExampleButton onLoad={() => setInput('A man, a plan, a canal: Panama')} />
        <ClearButton onClear={() => setInput('')} disabled={input === ''} />
      </ButtonRow>
      {input.trim() !== '' ? (
        <>
          <div style={resultStyle} role="status">
            <p style={headlineLabelStyle}>{t({ bn: 'ফলাফল', en: 'Result' })}</p>
            <p style={headlineStyle}>{info.isPalindrome ? t({ bn: 'হ্যাঁ, প্যালিনড্রোম', en: 'Yes, a palindrome' }) : t({ bn: 'না, প্যালিনড্রোম নয়', en: 'No, not a palindrome' })}</p>
          </div>
          <Tiles items={[
            { labelBn: 'পরিষ্কার করা লেখা', labelEn: 'Cleaned text', value: info.cleaned || '—' },
            { labelBn: 'উল্টো লেখা', labelEn: 'Reversed', value: info.reversed || '—' },
          ]} />
        </>
      ) : null}
      <p style={noteStyle}>{t({ bn: 'পরীক্ষায় বড়-ছোট হাতের অক্ষর, ফাঁকা জায়গা ও যতিচিহ্ন ধরা হয় না — শুধু অক্ষর ও সংখ্যা মেলানো হয়।', en: 'The check ignores letter case, spaces and punctuation — only letters and numbers are compared.' })}</p>
    </section>
  );
}
