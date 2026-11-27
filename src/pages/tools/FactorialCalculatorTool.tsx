// Eduvelto — Factorial Calculator tool UI (Math batch, 27 Nov 2026).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Engine: factorialOf in src/lib/tools/mathTools.ts.
// Honest limit: 170! is the largest factorial a double can hold (171! overflows).
import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, Tiles, CopyButton, ButtonRow, ClearButton, ExampleButton, shortInputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { factorialOf, FACTORIAL_LIMIT } from '../../lib/tools/mathTools';

const resultStyle: CSSProperties = { marginTop: 14, padding: '18px 16px', borderRadius: 12, background: 'var(--teal-soft)', boxShadow: 'var(--shadow-sm)' };
const errorStyle: CSSProperties = { marginTop: 14, color: '#b3261e', fontSize: 14 };

function parseIntOrNull(s: string): number | null {
  if (s.trim() === '') return null;
  const n = Number(s);
  return Number.isInteger(n) ? n : null;
}

export function FactorialCalculatorTool() {
  const { t } = useLanguage();
  const [n, setN] = useState('5');
  const num = parseIntOrNull(n);
  const result = useMemo(() => (num !== null ? factorialOf(num) : null), [num]);
  const clear = () => setN('');
  const loadExample = () => setN('5');

  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="ফ্যাক্টোরিয়াল ক্যালকুলেটর" titleEn="Factorial Calculator" descBn="n! বের করুন — ১ থেকে n পর্যন্ত সব সংখ্যার গুণফল।" descEn="Find n! — the product of all numbers from 1 to n." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div>
        <label style={labelStyle} htmlFor="fact-n">{t({ bn: 'n', en: 'n' })}</label>
        <input id="fact-n" style={shortInputStyle} type="number" step="1" min="0" max={FACTORIAL_LIMIT} inputMode="numeric" value={n} onChange={(e) => setN(e.target.value)} placeholder="5" />
      </div>
      {result !== null && num !== null ? (
        <>
          <div style={resultStyle} role="status">
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{t({ bn: `${num}!-এর মান`, en: `Value of ${num}!` })}</p>
            <p style={{ margin: 0, fontSize: '2rem', fontFamily: 'var(--font-head)', color: 'var(--teal-deep)', wordBreak: 'break-all' }}>{result.toLocaleString('en-US')}</p>
            <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--muted)' }}>{num <= 10 ? t({ bn: `${num}! = ${Array.from({ length: num }, (_, i) => i + 1).join(' × ')}${num === 0 ? ' (সংজ্ঞা অনুযায়ী ০! = ১)' : ''}`, en: `${num}! = ${Array.from({ length: num }, (_, i) => i + 1).join(' × ')}${num === 0 ? ' (by definition 0! = 1)' : ''}` }) : null}</p>
          </div>
          <Tiles items={[
            { labelBn: 'n', labelEn: 'n', value: `${num}` },
            { labelBn: 'n!', labelEn: 'n!', value: `${result.toLocaleString('en-US')}` },
          ]} />
          <ButtonRow><CopyButton text={`${num}! = ${result}`} labelBn="ফলাফল কপি করুন" labelEn="Copy result" /><ClearButton onClear={clear} /><ExampleButton onLoad={loadExample} /></ButtonRow>
        </>
      ) : (
        <p style={errorStyle} role="alert">{t({ bn: `০ থেকে ${FACTORIAL_LIMIT} পর্যন্ত একটি পূর্ণসংখ্যা দিন।`, en: `Enter a whole number from 0 to ${FACTORIAL_LIMIT}.` })}</p>
      )}
      <p style={noteStyle}>{t({ bn: `০! = ১ (সংজ্ঞা অনুযায়ী)। ${FACTORIAL_LIMIT} পর্যন্ত হিসাব করা যায় — ১৭১! এত বড় যে কম্পিউটারের সাধারণ সংখ্যায় আর ধরে না, তাই সেটি দেখানো হয় না।`, en: `0! = 1 (by definition). Values up to ${FACTORIAL_LIMIT} can be calculated — 171! is too large for an ordinary computer number, so it is not shown.` })}</p>
    </section>
  );
}
