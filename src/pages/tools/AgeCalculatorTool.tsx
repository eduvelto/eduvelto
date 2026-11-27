// Eduvelto — Age Calculator tool UI (landed 27 Nov 2026, A-tools).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// D-02 fix (preferred): standalone page reusing calculateAge() in src/lib/lifeCalculators.ts — the hub page keeps its own Age widget. 100% in-browser; nothing is uploaded.
import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import {ToolHero, Tiles, CopyButton, ButtonRow, inputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { calculateAge } from '../../lib/lifeCalculators';

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





function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function AgeCalculatorTool() {
  const { t } = useLanguage();
  const [dob, setDob] = useState('2000-01-01');
  const [asOf, setAsOf] = useState(todayIso);
  const result = useMemo(() => {
    if (!dob) return null;
    const parsed = new Date(`${dob}T00:00:00`);
    const ref = new Date(`${asOf}T00:00:00`);
    if (Number.isNaN(parsed.getTime()) || Number.isNaN(ref.getTime())) return null;
    return calculateAge(parsed, ref);
  }, [dob, asOf]);

  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="বয়স ক্যালকুলেটর" titleEn="Age Calculator" descBn="জন্মতারিখ দিয়ে বয়স বছর, মাস ও দিনে হিসাব করুন।" descEn="Calculate age in years, months and days from a date of birth." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <div>
          <label style={labelStyle} htmlFor="age-dob">{t({ bn: 'জন্মতারিখ', en: 'Date of birth' })}</label>
          <input id="age-dob" style={inputStyle} type="date" max={todayIso()} value={dob} onChange={(e) => setDob(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle} htmlFor="age-asof">{t({ bn: 'কোন তারিখ পর্যন্ত (ডিফল্ট: আজ)', en: 'Age as of (default: today)' })}</label>
          <input id="age-asof" style={inputStyle} type="date" value={asOf} onChange={(e) => setAsOf(e.target.value)} />
        </div>
      </div>
      {result ? (
        <>
          <div style={resultStyle} role="status">
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{t({ bn: 'বয়স', en: 'Age' })}</p>
            <p style={{ margin: 0, fontSize: '2rem', fontFamily: 'var(--font-head)', color: 'var(--teal-deep)' }}>
              {result.years} {t({ bn: 'বছর', en: 'years' })} {result.months} {t({ bn: 'মাস', en: 'months' })} {result.days} {t({ bn: 'দিন', en: 'days' })}
            </p>
          </div>
          <Tiles items={[
            { labelBn: 'মোট দিন', labelEn: 'Total days', value: String(result.totalDays) },
            { labelBn: 'মোট মাস (আনুমানিক)', labelEn: 'Total months (approx.)', value: String(Math.floor(result.totalDays / 30.44)) },
            { labelBn: 'মোট সপ্তাহ', labelEn: 'Total weeks', value: String(Math.floor(result.totalDays / 7)) },
          ]} />
          <ButtonRow><CopyButton text={`${result.years} years ${result.months} months ${result.days} days (${result.totalDays} days in total)`} labelBn="ফলাফল কপি করুন" labelEn="Copy result" /></ButtonRow>
        </>
      ) : (
        <p style={errorStyle} role="alert">{t({ bn: 'সঠিক জন্মতারিখ দিন — জন্মতারিখ ভবিষ্যতের হতে পারবে না।', en: 'Enter a valid date of birth — it cannot be in the future.' })}</p>
      )}
      <p style={noteStyle}>{t({ bn: 'সরকারি চাকরির বয়সসীমার হিসাবের জন্য সরকারি চাকরির বয়স ক্যালকুলেটর টুলটি দেখুন।', en: 'For government-job age limits, see the government job age calculator tool.' })}</p>
    </section>
  );
}
