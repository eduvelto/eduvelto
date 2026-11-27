// Eduvelto — Leap Year Checker (Converters batch, 27 Nov 2026).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Gregorian leap-year rule with the explanation. 100% in-browser.
import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, Tiles, CopyButton, ButtonRow, ClearButton, ExampleButton, shortInputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { isLeapYear, leapYearExplanation } from '../../lib/tools/converterTools';

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

function parseYear(s: string): number | null {
  if (s.trim() === '') return null;
  const n = Number(s);
  return Number.isInteger(n) ? n : null;
}

export function LeapYearCheckerTool() {
  const { t } = useLanguage();
  const [year, setYear] = useState('2028');
  const y = parseYear(year);
  const leap = useMemo(() => (y === null ? null : isLeapYear(y)), [y]);
  const reason = useMemo(() => (y === null ? null : leapYearExplanation(y)), [y]);
  const yesNo = (cond: boolean): string => (cond ? '✓' : '✗');
  const loadExample = () => setYear('2028');
  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="অধিবর্ষ (লিপ ইয়ার) যাচাই" titleEn="Leap Year Checker" descBn="যেকোনো সাল অধিবর্ষ (লিপ ইয়ার) কি না যাচাই করুন ও নিয়মটি দেখুন।" descEn="Check whether any year is a leap year, with the rule explained." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <div>
          <label style={labelStyle} htmlFor="leap-year">{t({ bn: 'সাল', en: 'Year' })}</label>
          <input id="leap-year" style={shortInputStyle} type="number" step="1" inputMode="numeric" value={year} onChange={(e) => setYear(e.target.value)} placeholder="2028" />
        </div>
      </div>
      <ButtonRow>
        <ClearButton onClear={() => setYear('')} />
        <ExampleButton onLoad={loadExample} />
      </ButtonRow>
      {leap !== null && y !== null ? (
        <>
          <div style={resultStyle} role="status">
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{t({ bn: `${y} সাল`, en: `Year ${y}` })}</p>
            <p style={{ margin: 0, fontSize: '2rem', fontFamily: 'var(--font-head)', color: 'var(--teal-deep)' }}>{leap ? t({ bn: 'অধিবর্ষ — ৩৬৬ দিন', en: 'Leap year — 366 days' }) : t({ bn: 'অধিবর্ষ নয় — ৩৬৫ দিন', en: 'Not a leap year — 365 days' })}</p>
            <p style={{ margin: '8px 0 0', fontSize: 15 }}>
              {reason === 'leap'
                ? t({ bn: '৪ দিয়ে ভাগ যায়, আর ১০০ দিয়ে ভাগ গেলেও ৪০০ দিয়ে ভাগ যায় — তাই ফেব্রুয়ারি ২৯ দিনের।', en: 'Divisible by 4, and even though it is divisible by 100 it is also divisible by 400 — so February has 29 days.' })
                : reason === 'not-leap-divisible-100'
                  ? t({ bn: '১০০ দিয়ে ভাগ যায় কিন্তু ৪০০ দিয়ে যায় না — তাই অধিবর্ষ নয়, ফেব্রুয়ারি ২৮ দিনের।', en: 'Divisible by 100 but not by 400 — so it is not a leap year, and February has 28 days.' })
                  : t({ bn: '৪ দিয়ে ভাগ যায় না — তাই অধিবর্ষ নয়, ফেব্রুয়ারি ২৮ দিনের।', en: 'Not divisible by 4 — so it is not a leap year, and February has 28 days.' })}
            </p>
          </div>
          <Tiles items={[
            { labelBn: '৪ দিয়ে ভাগ যায়', labelEn: 'Divisible by 4', value: yesNo(y % 4 === 0) },
            { labelBn: '১০০ দিয়ে ভাগ যায়', labelEn: 'Divisible by 100', value: yesNo(y % 100 === 0) },
            { labelBn: '৪০০ দিয়ে ভাগ যায়', labelEn: 'Divisible by 400', value: yesNo(y % 400 === 0) },
            { labelBn: 'ফেব্রুয়ারি', labelEn: 'February', value: leap ? t({ bn: '২৯ দিন', en: '29 days' }) : t({ bn: '২৮ দিন', en: '28 days' }) },
          ]} />
          <ButtonRow><CopyButton text={`${y} is ${leap ? 'a leap year (366 days)' : 'not a leap year (365 days)'}`} labelBn="ফলাফল কপি করুন" labelEn="Copy result" /></ButtonRow>
        </>
      ) : (
        <p style={errorStyle} role="alert">{t({ bn: 'সঠিক সাল দিন — পূর্ণসংখ্যা লিখুন।', en: 'Enter a valid year — a whole number.' })}</p>
      )}
      <p style={noteStyle}>{t({ bn: 'গ্রেগরিয়ান নিয়ম: ৪ দিয়ে ভাগ গেলে অধিবর্ষ, তবে ১০০ দিয়ে ভাগ গেলে নয় — যদি না ৪০০ দিয়েও ভাগ যায়। তাই ২০০০ অধিবর্ষ ছিল, কিন্তু ১৯০০ ও ২১০০ নয়।', en: 'Gregorian rule: divisible by 4 is a leap year, unless divisible by 100 — except when also divisible by 400. So 2000 was a leap year, but 1900 and 2100 are not.' })}</p>
    </section>
  );
}
