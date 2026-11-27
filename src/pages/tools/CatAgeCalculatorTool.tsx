// Eduvelto — Cat Age Calculator tool UI.
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Engine: calculateCatAge() in src/lib/tools/financeHealthTools.ts. 100% in-browser.
import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, Tiles, CopyButton, ButtonRow, ClearButton, ExampleButton, shortInputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { calculateCatAge } from '../../lib/tools/financeHealthTools';

const resultStyle: CSSProperties = {
  marginTop: 14,
  padding: '18px 16px',
  borderRadius: 12,
  background: 'var(--teal-soft)',
  boxShadow: 'var(--shadow-sm)',
};

const errorStyle: CSSProperties = {
  marginTop: 14,
  color: '#b3261e',
  fontSize: 14,
};

function parseNum(s: string): number | null {
  if (s.trim() === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function CatAgeCalculatorTool() {
  const { t } = useLanguage();
  const [age, setAge] = useState('5');
  const a = parseNum(age);
  const result = useMemo(() => (a !== null ? calculateCatAge(a) : null), [a]);
  const loadExample = () => { setAge('5'); };
  const clear = () => { setAge(''); };

  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="বিড়ালের বয়স ক্যালকুলেটর" titleEn="Cat Age Calculator" descBn="বিড়ালের বয়স মানুষের বয়সের হিসাবে কত হবে তা দেখুন।" descEn="See how old your cat is in human-equivalent years." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <div>
          <label style={labelStyle} htmlFor="cat-age">{t({ bn: 'বিড়ালের বয়স (বছর)', en: "Cat's age (years)" })}</label>
          <input id="cat-age" style={shortInputStyle} type="number" min="0" max="30" step="0.5" inputMode="decimal" value={age} onChange={(e) => setAge(e.target.value)} placeholder="5" />
        </div>
      </div>
      {result ? (
        <>
          <div style={resultStyle} role="status">
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{t({ bn: 'মানুষের হিসাবে বয়স (আনুমানিক)', en: 'Human-equivalent age (approximate)' })}</p>
            <p style={{ margin: 0, fontSize: '2rem', fontFamily: 'var(--font-head)', color: 'var(--teal-deep)' }}>{result.humanYears} {t({ bn: 'বছর', en: 'years' })}</p>
          </div>
          <Tiles items={[
            { labelBn: 'বিড়ালের বয়স', labelEn: "Cat's age", value: `${a ?? 0} ${t({ bn: 'বছর', en: 'years' })}` },
            { labelBn: 'মানুষের হিসাবে', labelEn: 'Human-equivalent', value: `${result.humanYears} ${t({ bn: 'বছর', en: 'years' })}` },
            { labelBn: 'প্রথম বছর', labelEn: 'First year', value: `15 ${t({ bn: 'বছর', en: 'years' })}` },
          ]} />
          <ButtonRow>
            <CopyButton text={`Cat age ${a ?? 0} years = about ${result.humanYears} human years`} labelBn="ফলাফল কপি করুন" labelEn="Copy result" />
            <ExampleButton onLoad={loadExample} />
            <ClearButton onClear={clear} />
          </ButtonRow>
        </>
      ) : (
        <p style={errorStyle} role="alert">{t({ bn: 'সঠিক বয়স দিন — ০ থেকে ৩০ বছরের মধ্যে।', en: 'Enter a valid age — between 0 and 30 years.' })}</p>
      )}
      <p style={noteStyle}>{t({ bn: 'এটি একটি প্রচলিত আনুমানিক নিয়ম: প্রথম বছর ≈ ১৫ মানব-বছর, দ্বিতীয় বছর আরও ≈ ৯ (২ বছরে মোট ২৪), তারপর প্রত্যেক বছর ≈ ৪ মানব-বছর। জাত ও স্বাস্থ্যের ওপর আসল বার্ধক্য বদলায়।', en: 'This is the common approximate rule: the first year is about 15 human years, the second adds about 9 (24 by age 2), then about 4 per year. Real ageing varies by breed and health.' })}</p>
    </section>
  );
}
