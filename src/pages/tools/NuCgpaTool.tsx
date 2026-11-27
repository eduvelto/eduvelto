// Eduvelto — NU CGPA Calculator tool UI (100-Tools Project, Phase 2, Wave 3).
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Pure calculation lives in src/lib/tools/nuCgpa.ts: credit-weighted CGPA
// on the National University 4.00 scale (A+ 4.00 … D 2.00, F 0.00).

import { useMemo, useRef, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  calculateNuCgpa,
  NU_GRADE_POINTS,
  type NuGradeLetter,
} from '../../lib/tools/nuCgpa';

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

const buttonStyle: CSSProperties = {
  minHeight: 44,
  padding: '10px 16px',
  borderRadius: 8,
  border: '1px solid var(--line)',
  fontSize: 15,
  background: 'var(--surface)',
  color: 'var(--heading)',
  cursor: 'pointer',
};

const GRADE_LETTERS = Object.keys(NU_GRADE_POINTS) as NuGradeLetter[];

interface CourseRow {
  id: number;
  grade: NuGradeLetter;
  credit: string;
}

function parseCredit(raw: string): number | null {
  if (raw.trim() === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export function NuCgpaTool() {
  const { t } = useLanguage();
  const nextId = useRef(4);
  const [rows, setRows] = useState<CourseRow[]>([
    { id: 1, grade: 'A', credit: '3' },
    { id: 2, grade: 'A', credit: '3' },
    { id: 3, grade: 'A', credit: '3' },
  ]);

  const credits = rows.map((row) => parseCredit(row.credit));
  const allValid = credits.every((c) => c !== null && c > 0);
  const anyInvalid = credits.some((c) => c !== null && c <= 0) || rows.some((row) => row.credit.trim() !== '' && parseCredit(row.credit) === null);
  const anyFilled = rows.some((row) => row.credit.trim() !== '');

  const result = useMemo(() => {
    if (!allValid) return null;
    try {
      return calculateNuCgpa(
        rows.map((row, i) => ({
          gradePoint: NU_GRADE_POINTS[row.grade],
          credit: credits[i] as number,
        })),
      );
    } catch {
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allValid, rows]);

  const updateRow = (id: number, patch: Partial<CourseRow>) => {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const addRow = () => {
    const id = nextId.current;
    nextId.current += 1;
    setRows((prev) => [...prev, { id, grade: 'A', credit: '3' }]);
  };

  const removeRow = (id: number) => {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((row) => row.id !== id)));
  };

  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="cgpa-title">
      <h2 id="cgpa-title" style={{ fontSize: 19, color: 'var(--heading)', margin: '0 0 4px' }}>
        {t({ bn: 'জাতীয় বিশ্ববিদ্যালয় সিজিপিএ ক্যালকুলেটর', en: 'NU CGPA Calculator' })}
      </h2>
      <p style={{ color: 'var(--muted)', fontSize: 14, margin: '0 0 14px' }}>
        {t({
          bn: 'প্রতিটি কোর্সের গ্রেড ও ক্রেডিট দিন — ক্রেডিট অনুযায়ী ওজন করে সিজিপিএ বের হবে। সব হিসাব আপনার ডিভাইসেই হয়।',
          en: 'Enter each course grade and credit — the CGPA is weighted by credit. Everything is computed on your device.',
        })}
      </p>
      {rows.map((row, index) => (
        <div key={row.id} style={{ ...gridStyle, marginBottom: 12 }}>
          <div>
            <label style={labelStyle} htmlFor={`cgpa-grade-${row.id}`}>
              {t({ bn: 'কোর্স', en: 'Course' })} {index + 1} — {t({ bn: 'গ্রেড', en: 'Grade' })}
            </label>
            <select
              id={`cgpa-grade-${row.id}`}
              style={inputStyle}
              value={row.grade}
              onChange={(e) => updateRow(row.id, { grade: e.target.value as NuGradeLetter })}
            >
              {GRADE_LETTERS.map((letter) => (
                <option key={letter} value={letter}>
                  {letter} ({NU_GRADE_POINTS[letter].toFixed(2)})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle} htmlFor={`cgpa-credit-${row.id}`}>
              {t({ bn: 'ক্রেডিট', en: 'Credit' })}
            </label>
            <input
              id={`cgpa-credit-${row.id}`}
              style={inputStyle}
              type="number"
              min="0"
              step="0.5"
              inputMode="decimal"
              value={row.credit}
              onChange={(e) => updateRow(row.id, { credit: e.target.value })}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              type="button"
              style={buttonStyle}
              onClick={() => removeRow(row.id)}
              disabled={rows.length <= 1}
              aria-label={t({ bn: 'এই কোর্সটি মুছুন', en: 'Remove this course' })}
            >
              {t({ bn: 'মুছুন', en: 'Remove' })}
            </button>
          </div>
        </div>
      ))}
      <button type="button" style={buttonStyle} onClick={addRow}>
        {t({ bn: '+ কোর্স যোগ করুন', en: '+ Add course' })}
      </button>
      {result ? (
        <div style={resultStyle} role="status">
          <p style={{ margin: '0 0 6px', fontSize: 16 }}>
            <strong>
              {t({ bn: 'সিজিপিএ: ', en: 'CGPA: ' })}
              {result.cgpa.toFixed(2)}
            </strong>{' '}
            {t({ bn: '(৪.০০ স্কেলে)', en: '(on the 4.00 scale)' })}
          </p>
          <p style={{ margin: '0 0 6px', fontSize: 15 }}>
            {t({ bn: 'মোট ক্রেডিট: ', en: 'Total credits: ' })}
            {result.totalCredits}
          </p>
          <p style={formulaStyle}>
            {t({
              bn: 'সূত্র: সিজিপিএ = Σ(গ্রেড পয়েন্ট × ক্রেডিট) ÷ মোট ক্রেডিট।',
              en: 'Formula: CGPA = Σ(grade point × credit) ÷ total credits.',
            })}
          </p>
        </div>
      ) : anyInvalid ? (
        <p style={errorStyle} role="alert">
          {t({
            bn: 'সঠিক ক্রেডিট দিন — প্রতিটি ক্রেডিট ০-এর বেশি হতে হবে।',
            en: 'Enter valid credits — every credit must be above 0.',
          })}
        </p>
      ) : anyFilled ? (
        <p style={errorStyle} role="alert">
          {t({
            bn: 'সিজিপিএ বের করতে প্রতিটি কোর্সের ক্রেডিট দিন।',
            en: 'Enter the credit for every course to calculate the CGPA.',
          })}
        </p>
      ) : null}
    </section>
  );
}
