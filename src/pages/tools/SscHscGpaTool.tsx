// Eduvelto — SSC/HSC GPA Calculator tool UI (100-Tools Project, Phase 2, Wave 3).
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Pure calculation lives in src/lib/tools/sscHscGpa.ts:
// GPA = (sum of 6 main-subject grade points
//        + max(0, 4th-subject grade point - 2)) / 6, capped at 5.0.
// The 4th-subject extra is capped at 3.0; any main-subject F fails.

import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  calculateSscHscGpa,
  SSC_HSC_GRADE_POINTS,
  type SscHscGradeLetter,
} from '../../lib/tools/sscHscGpa';

const inputStyle: CSSProperties = {
  width: '100%',
  minHeight: 44,
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid var(--line)',
  fontSize: 15,
  boxSizing: 'border-box',
  background: 'var(--surface)',
  color: 'var(--heading)',
};

const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--heading)',
  marginBottom: 6,
};

const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 12,
};

const cardStyle: CSSProperties = {
  marginTop: 16,
  padding: '18px 16px',
};

const resultStyle: CSSProperties = {
  marginTop: 14,
  padding: '14px 16px',
  borderRadius: 10,
  background: 'var(--teal-soft)',
};

const formulaStyle: CSSProperties = {
  margin: '10px 0 0',
  fontSize: 13,
  color: 'var(--muted)',
};

const errorStyle: CSSProperties = {
  marginTop: 14,
  color: '#b3261e',
  fontSize: 14,
};

const GRADE_LETTERS = Object.keys(SSC_HSC_GRADE_POINTS) as SscHscGradeLetter[];

function fmt(n: number): string {
  return n.toFixed(2);
}

export function SscHscGpaTool() {
  const { t } = useLanguage();
  const [main, setMain] = useState<string[]>(['', '', '', '', '', '']);
  const [fourth, setFourth] = useState('');

  const filled = main.some((g) => g !== '') || fourth !== '';

  const result = useMemo(() => {
    if (main.some((g) => g === '')) return null;
    try {
      const points = main.map((g) => SSC_HSC_GRADE_POINTS[g as SscHscGradeLetter]);
      const fourthPoint =
        fourth === '' ? undefined : SSC_HSC_GRADE_POINTS[fourth as SscHscGradeLetter];
      return calculateSscHscGpa(points, fourthPoint);
    } catch {
      return null;
    }
  }, [main, fourth]);

  const mainSum = useMemo(
    () =>
      main.reduce(
        (sum, g) => sum + (g === '' ? 0 : SSC_HSC_GRADE_POINTS[g as SscHscGradeLetter]),
        0,
      ),
    [main],
  );
  const fourthExtra =
    fourth === ''
      ? 0
      : Math.min(3, Math.max(0, SSC_HSC_GRADE_POINTS[fourth as SscHscGradeLetter] - 2));

  const setMainGrade = (index: number, value: string) => {
    setMain((prev) => prev.map((g, i) => (i === index ? value : g)));
  };

  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="gpa-title">
      <h2 id="gpa-title" style={{ fontSize: 19, color: 'var(--heading)', margin: '0 0 4px' }}>
        {t({ bn: 'এসএসসি/এইচএসসি জিপিএ ক্যালকুলেটর', en: 'SSC/HSC GPA Calculator' })}
      </h2>
      <p style={{ color: 'var(--muted)', fontSize: 14, margin: '0 0 14px' }}>
        {t({
          bn: '৬টি মূল বিষয়ের গ্রেড দিন — চতুর্থ বিষয়ের গ্রেড থাকলে সেটিও দিন। সব হিসাব আপনার ডিভাইসেই হয়।',
          en: 'Enter the grades of the 6 main subjects — and the 4th subject grade if there is one. Everything is computed on your device.',
        })}
      </p>
      <div style={gridStyle}>
        {main.map((grade, i) => (
          <div key={i}>
            <label style={labelStyle} htmlFor={`gpa-main-${i + 1}`}>
              {t({ bn: 'মূল বিষয়', en: 'Main subject' })} {i + 1}
            </label>
            <select
              id={`gpa-main-${i + 1}`}
              style={inputStyle}
              value={grade}
              onChange={(e) => setMainGrade(i, e.target.value)}
            >
              <option value="">
                {t({ bn: 'গ্রেড বেছে নিন', en: 'Choose a grade' })}
              </option>
              {GRADE_LETTERS.map((letter) => (
                <option key={letter} value={letter}>
                  {letter} ({fmt(SSC_HSC_GRADE_POINTS[letter])})
                </option>
              ))}
            </select>
          </div>
        ))}
        <div>
          <label style={labelStyle} htmlFor="gpa-fourth">
            {t({ bn: 'চতুর্থ বিষয় (ঐচ্ছিক)', en: '4th subject (optional)' })}
          </label>
          <select
            id="gpa-fourth"
            style={inputStyle}
            value={fourth}
            onChange={(e) => setFourth(e.target.value)}
          >
            <option value="">{t({ bn: 'নেই', en: 'None' })}</option>
            {GRADE_LETTERS.map((letter) => (
              <option key={letter} value={letter}>
                {letter} ({fmt(SSC_HSC_GRADE_POINTS[letter])})
              </option>
            ))}
          </select>
        </div>
      </div>
      {result ? (
        <div style={resultStyle} role="status">
          <p style={{ margin: '0 0 6px', fontSize: 16 }}>
            <strong>
              {t({ bn: 'জিপিএ: ', en: 'GPA: ' })}
              {fmt(result.gpa)}
            </strong>{' '}
            — {t({ bn: 'গ্রেড: ', en: 'Grade: ' })}
            {result.gradeLetter}
          </p>
          <p style={{ margin: '0 0 6px', fontSize: 15 }}>
            {result.passed
              ? t({ bn: 'ফল: পাস', en: 'Result: Pass' })
              : t({
                  bn: 'ফল: ফেল — কোনো মূল বিষয়ে F থাকলে জিপিএ ০ হয়।',
                  en: 'Result: Fail — an F in any main subject makes the GPA 0.',
                })}
          </p>
          <p style={formulaStyle}>
            {t({
              bn: `সূত্র: জিপিএ = (মূল বিষয়ের মোট ${fmt(mainSum)} + চতুর্থ বিষয়ের অতিরিক্ত ${fmt(fourthExtra)}) ÷ ৬; চতুর্থ বিষয়ের অতিরিক্ত সর্বোচ্চ ৩.০, জিপিএ সর্বোচ্চ ৫.০।`,
              en: `Formula: GPA = (main-subject total ${fmt(mainSum)} + 4th-subject extra ${fmt(fourthExtra)}) ÷ 6; 4th-subject extra is capped at 3.0 and GPA at 5.0.`,
            })}
          </p>
        </div>
      ) : filled ? (
        <p style={errorStyle} role="alert">
          {t({
            bn: 'জিপিএ বের করতে ৬টি মূল বিষয়ের গ্রেডই দিন।',
            en: 'Enter all 6 main-subject grades to calculate the GPA.',
          })}
        </p>
      ) : null}
    </section>
  );
}
