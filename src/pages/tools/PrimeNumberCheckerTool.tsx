// Eduvelto — Prime Number Checker tool UI (Math batch, 27 Nov 2026).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Engine: primeCheck in src/lib/tools/mathTools.ts.
import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, Tiles, CopyButton, ButtonRow, ClearButton, ExampleButton, shortInputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { primeCheck, PRIME_LIMIT } from '../../lib/tools/mathTools';

const resultStyle: CSSProperties = { marginTop: 14, padding: '18px 16px', borderRadius: 12, background: 'var(--teal-soft)', boxShadow: 'var(--shadow-sm)' };
const errorStyle: CSSProperties = { marginTop: 14, color: '#b3261e', fontSize: 14 };

function parseIntOrNull(s: string): number | null {
  if (s.trim() === '') return null;
  const n = Number(s);
  return Number.isInteger(n) ? n : null;
}

export function PrimeNumberCheckerTool() {
  const { t } = useLanguage();
  const [n, setN] = useState('97');
  const num = parseIntOrNull(n);
  const result = useMemo(() => (num !== null ? primeCheck(num) : null), [num]);
  const clear = () => setN('');
  const loadExample = () => setN('97');

  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="মৌলিক সংখ্যা পরীক্ষক" titleEn="Prime Number Checker" descBn="কোনো সংখ্যা মৌলিক কি না যাচাই করুন, আর আগের ও পরের মৌলিক সংখ্যাটিও দেখুন।" descEn="Check whether a number is prime, and see the previous and next primes too." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div>
        <label style={labelStyle} htmlFor="prime-n">{t({ bn: 'সংখ্যা', en: 'Number' })}</label>
        <input id="prime-n" style={shortInputStyle} type="number" step="1" min="0" inputMode="numeric" value={n} onChange={(e) => setN(e.target.value)} placeholder="97" />
      </div>
      {result ? (
        <>
          <div style={resultStyle} role="status">
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{t({ bn: `${result.value} কি মৌলিক?`, en: `Is ${result.value} prime?` })}</p>
            <p style={{ margin: 0, fontSize: '2rem', fontFamily: 'var(--font-head)', color: 'var(--teal-deep)' }}>{result.isPrime ? t({ bn: 'হ্যাঁ, মৌলিক', en: 'Yes, prime' }) : t({ bn: 'না, মৌলিক নয়', en: 'No, not prime' })}</p>
            <p style={{ margin: '8px 0 0', fontSize: 15 }}>{t({ bn: `আগের মৌলিক: ${result.prevPrime === null ? 'নেই (২-এর নিচে কোনো মৌলিক সংখ্যা নেই)' : result.prevPrime} • পরের মৌলিক: ${result.nextPrime}`, en: `Previous prime: ${result.prevPrime === null ? 'none (no prime below 2)' : result.prevPrime} • Next prime: ${result.nextPrime}` })}</p>
          </div>
          <Tiles items={[
            { labelBn: 'আগের মৌলিক', labelEn: 'Previous prime', value: result.prevPrime === null ? '—' : `${result.prevPrime}` },
            { labelBn: 'পরের মৌলিক', labelEn: 'Next prime', value: `${result.nextPrime}` },
          ]} />
          <ButtonRow><CopyButton text={`${result.value} is ${result.isPrime ? '' : 'not '}prime; previous prime ${result.prevPrime ?? 'none'}, next prime ${result.nextPrime}`} labelBn="ফলাফল কপি করুন" labelEn="Copy result" /><ClearButton onClear={clear} /><ExampleButton onLoad={loadExample} /></ButtonRow>
        </>
      ) : (
        <p style={errorStyle} role="alert">{t({ bn: `একটি পূর্ণসংখ্যা দিন (০ থেকে ${PRIME_LIMIT.toLocaleString('en-US')} পর্যন্ত)।`, en: `Enter a whole number (from 0 to ${PRIME_LIMIT.toLocaleString('en-US')}).` })}</p>
      )}
      <p style={noteStyle}>{t({ bn: 'মৌলিক সংখ্যা হলো ১-এর চেয়ে বড় সেই সংখ্যা যাকে ১ ও নিজে ছাড়া আর কোনো সংখ্যা দিয়ে ভাগ করা যায় না। ১ মৌলিক নয়।', en: 'A prime number is greater than 1 and divisible only by 1 and itself. 1 is not prime.' })}</p>
    </section>
  );
}
