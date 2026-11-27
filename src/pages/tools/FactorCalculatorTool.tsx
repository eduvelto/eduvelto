// Eduvelto — Factor Calculator tool UI (Math batch, 27 Nov 2026).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Engine: factorOf in src/lib/tools/mathTools.ts.
import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, Tiles, CopyButton, ButtonRow, ClearButton, ExampleButton, shortInputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { factorOf, PRIME_LIMIT } from '../../lib/tools/mathTools';

const resultStyle: CSSProperties = { marginTop: 14, padding: '18px 16px', borderRadius: 12, background: 'var(--teal-soft)', boxShadow: 'var(--shadow-sm)' };
const errorStyle: CSSProperties = { marginTop: 14, color: '#b3261e', fontSize: 14 };

function parseIntOrNull(s: string): number | null {
  if (s.trim() === '') return null;
  const n = Number(s);
  return Number.isInteger(n) ? n : null;
}

export function FactorCalculatorTool() {
  const { t } = useLanguage();
  const [n, setN] = useState('60');
  const num = parseIntOrNull(n);
  const result = useMemo(() => (num !== null ? factorOf(num) : null), [num]);
  const clear = () => setN('');
  const loadExample = () => setN('60');
  const factorText = result ? result.primeFactorization.map((f) => (f.exponent === 1 ? `${f.prime}` : `${f.prime}^${f.exponent}`)).join(' × ') : '';

  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="গুণনীয়ক ও মৌলিক উৎপাদক ক্যালকুলেটর" titleEn="Factor Calculator" descBn="কোনো সংখ্যার সব গুণনীয়ক ও মৌলিক উৎপাদকে বিশ্লেষণ বের করুন।" descEn="Find all factors of a number and its prime factorization." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div>
        <label style={labelStyle} htmlFor="factor-n">{t({ bn: 'সংখ্যা', en: 'Number' })}</label>
        <input id="factor-n" style={shortInputStyle} type="number" step="1" min="1" inputMode="numeric" value={n} onChange={(e) => setN(e.target.value)} placeholder="60" />
      </div>
      {result ? (
        <>
          <div style={resultStyle} role="status">
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{t({ bn: 'মৌলিক উৎপাদকে বিশ্লেষণ', en: 'Prime factorization' })}</p>
            <p style={{ margin: 0, fontSize: '2rem', fontFamily: 'var(--font-head)', color: 'var(--teal-deep)' }}>{result.value} = {factorText}</p>
            <p style={{ margin: '8px 0 0', fontSize: 15 }}>{t({ bn: `সব গুণনীয়ক (${result.factors.length}টি): ${result.factors.join(', ')}`, en: `All factors (${result.factors.length}): ${result.factors.join(', ')}` })}</p>
          </div>
          <Tiles items={[
            { labelBn: 'গুণনীয়কের সংখ্যা', labelEn: 'Number of factors', value: `${result.factors.length}` },
            { labelBn: 'সবচেয়ে ছোট গুণনীয়ক', labelEn: 'Smallest factor', value: `${result.factors[0]}` },
            { labelBn: 'সবচেয়ে বড় গুণনীয়ক', labelEn: 'Largest factor', value: `${result.factors[result.factors.length - 1]}` },
          ]} />
          <ButtonRow><CopyButton text={`${result.value} = ${factorText}; factors: ${result.factors.join(', ')}`} labelBn="ফলাফল কপি করুন" labelEn="Copy result" /><ClearButton onClear={clear} /><ExampleButton onLoad={loadExample} /></ButtonRow>
        </>
      ) : (
        <p style={errorStyle} role="alert">{t({ bn: `১ থেকে ${PRIME_LIMIT.toLocaleString('en-US')} পর্যন্ত একটি পূর্ণসংখ্যা দিন।`, en: `Enter a whole number from 1 to ${PRIME_LIMIT.toLocaleString('en-US')}.` })}</p>
      )}
      <p style={noteStyle}>{t({ bn: 'গুণনীয়ক হলো সেই সংখ্যাগুলো যেগুলো দিয়ে ভাগ করলে ভাগশেষ ০ হয়। মৌলিক উৎপাদকে বিশ্লেষণে সংখ্যাটিকে শুধু মৌলিক সংখ্যার গুণফল হিসেবে লেখা হয়।', en: 'Factors are the numbers that divide it with no remainder. Prime factorization writes the number as a product of primes only.' })}</p>
    </section>
  );
}
