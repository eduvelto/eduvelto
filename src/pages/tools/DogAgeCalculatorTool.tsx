// Eduvelto — Dog Age Calculator tool UI.
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Engine: calculateDogAge() in src/lib/tools/financeHealthTools.ts. 100% in-browser.
import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, Tiles, CopyButton, ButtonRow, ClearButton, ExampleButton, shortInputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { calculateDogAge, type DogSize } from '../../lib/tools/financeHealthTools';

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

export function DogAgeCalculatorTool() {
  const { t } = useLanguage();
  const [age, setAge] = useState('5');
  const [size, setSize] = useState<DogSize>('medium');
  const a = parseNum(age);
  const result = useMemo(() => (a !== null ? calculateDogAge(a, size) : null), [a, size]);
  const loadExample = () => { setAge('5'); setSize('medium'); };
  const clear = () => { setAge(''); };

  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="কুকুরের বয়স ক্যালকুলেটর" titleEn="Dog Age Calculator" descBn="কুকুরের বয়স মানুষের বয়সের হিসাবে কত হবে তা দেখুন।" descEn="See how old your dog is in human-equivalent years." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <div>
          <label style={labelStyle} htmlFor="dog-age">{t({ bn: 'কুকুরের বয়স (বছর)', en: "Dog's age (years)" })}</label>
          <input id="dog-age" style={shortInputStyle} type="number" min="0" max="30" step="0.5" inputMode="decimal" value={age} onChange={(e) => setAge(e.target.value)} placeholder="5" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="dog-size">{t({ bn: 'আকার', en: 'Size' })}</label>
          <select id="dog-size" style={shortInputStyle} value={size} onChange={(e) => setSize(e.target.value as DogSize)}>
            <option value="small">{t({ bn: 'ছোট জাত', en: 'Small breed' })}</option>
            <option value="medium">{t({ bn: 'মাঝারি জাত', en: 'Medium breed' })}</option>
            <option value="large">{t({ bn: 'বড় জাত', en: 'Large breed' })}</option>
          </select>
        </div>
      </div>
      {result ? (
        <>
          <div style={resultStyle} role="status">
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{t({ bn: 'মানুষের হিসাবে বয়স (আনুমানিক)', en: 'Human-equivalent age (approximate)' })}</p>
            <p style={{ margin: 0, fontSize: '2rem', fontFamily: 'var(--font-head)', color: 'var(--teal-deep)' }}>{result.humanYears} {t({ bn: 'বছর', en: 'years' })}</p>
          </div>
          <Tiles items={[
            { labelBn: 'কুকুরের বয়স', labelEn: "Dog's age", value: `${a ?? 0} ${t({ bn: 'বছর', en: 'years' })}` },
            { labelBn: 'আকার', labelEn: 'Size', value: t({ bn: size === 'small' ? 'ছোট' : size === 'medium' ? 'মাঝারি' : 'বড়', en: size }) },
            { labelBn: 'মানুষের হিসাবে', labelEn: 'Human-equivalent', value: `${result.humanYears} ${t({ bn: 'বছর', en: 'years' })}` },
          ]} />
          <ButtonRow>
            <CopyButton text={`Dog age ${a ?? 0} years = about ${result.humanYears} human years`} labelBn="ফলাফল কপি করুন" labelEn="Copy result" />
            <ExampleButton onLoad={loadExample} />
            <ClearButton onClear={clear} />
          </ButtonRow>
        </>
      ) : (
        <p style={errorStyle} role="alert">{t({ bn: 'সঠিক বয়স দিন — ০ থেকে ৩০ বছরের মধ্যে।', en: 'Enter a valid age — between 0 and 30 years.' })}</p>
      )}
      <p style={noteStyle}>{t({ bn: 'এটি একটি প্রচলিত আনুমানিক নিয়ম: প্রথম ২ বছরে প্রত্যেক বছর ≈ ১০.৫ মানব-বছর, তারপর ছোট জাতে বছরে ≈ ৪, মাঝারি জাতে ≈ ৫ ও বড় জাতে ≈ ৭ মানব-বছর। জাত, স্বাস্থ্য ও যত্নের ওপর আসল বার্ধক্য বদলায়।', en: 'This is the common approximate rule: the first 2 years count about 10.5 human years each, then about 4 per year for small breeds, 5 for medium and 7 for large. Real ageing varies by breed, health and care.' })}</p>
    </section>
  );
}
