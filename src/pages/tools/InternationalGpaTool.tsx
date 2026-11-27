// Eduvelto — International GPA Calculator tool UI.
// Pure logic in src/lib/tools/internationalGpa.ts: credit-weighted GPA
// on the 4.0 (US +/-) and 5.0 scales.
import { useMemo, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  calculateInternationalGpa,
  convertGpaScale,
  gradePointsForScale,
  type GpaScale,
} from '../../lib/tools/internationalGpa';
import {
  CopyBtn, LoadExampleBtn, Tiles, ToolSection, errorStyle, formulaStyle,
  gridStyle, inputStyle, labelStyle, resultStyle,
} from './eduToolUi';

interface Row { grade: string; credit: string; }

const EXAMPLE: Row[] = [
  { grade: 'A', credit: '3' }, { grade: 'B', credit: '3' },
  { grade: 'A-', credit: '2' }, { grade: 'B+', credit: '3' }, { grade: 'A', credit: '2' },
];

export function InternationalGpaTool() {
  const { t } = useLanguage();
  const [scale, setScale] = useState<GpaScale>('4.0');
  const [rows, setRows] = useState<Row[]>([{ grade: '', credit: '' }, { grade: '', credit: '' }, { grade: '', credit: '' }]);
  const points = gradePointsForScale(scale);
  const letters = Object.keys(points);

  const result = useMemo(() => {
    const courses = rows
      .filter((r) => r.grade !== '' && r.credit !== '')
      .map((r) => ({ gradePoint: points[r.grade], credit: Number(r.credit) }));
    if (courses.length === 0) return null;
    try { return calculateInternationalGpa(courses, scale); } catch { return null; }
  }, [rows, scale, points]);

  const filled = rows.some((r) => r.grade !== '' || r.credit !== '');
  const setRow = (i: number, patch: Partial<Row>) =>
    setRows((prev) => prev.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  return (
    <ToolSection id="intl-gpa-title" titleBn="আন্তর্জাতিক জিপিএ ক্যালকুলেটর" titleEn="International GPA Calculator"
      descBn="৪.০ ও ৫.০ স্কেলে আন্তর্জাতিক জিপিএ হিসাব করুন। সব হিসাব আপনার ডিভাইসেই হয়।"
      descEn="Calculate GPA on the international 4.0 and 5.0 scales. Everything is computed on your device.">
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <div>
          <label style={labelStyle} htmlFor="intl-scale">{t({ bn: 'স্কেল', en: 'Scale' })}</label>
          <select id="intl-scale" style={{ ...inputStyle, width: 140 }} value={scale}
            onChange={(e) => { setScale(e.target.value as GpaScale); setRows(EXAMPLE.map((r) => ({ ...r, grade: '' }))); }}>
            <option value="4.0">4.0</option>
            <option value="5.0">5.0</option>
          </select>
        </div>
        <div style={{ alignSelf: 'flex-end' }}>
          <LoadExampleBtn onLoad={() => setRows(EXAMPLE.map((r) => ({ ...r })))} />
        </div>
      </div>
      <div style={gridStyle}>
        {rows.map((row, i) => (
          <div key={i} style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle} htmlFor={`intl-grade-${i}`}>{t({ bn: 'গ্রেড', en: 'Grade' })} {i + 1}</label>
              <select id={`intl-grade-${i}`} style={inputStyle} value={row.grade} onChange={(e) => setRow(i, { grade: e.target.value })}>
                <option value="">{t({ bn: 'বেছে নিন', en: 'Choose' })}</option>
                {letters.map((l) => (<option key={l} value={l}>{l} ({points[l].toFixed(1)})</option>))}
              </select>
            </div>
            <div style={{ width: 100 }}>
              <label style={labelStyle} htmlFor={`intl-credit-${i}`}>{t({ bn: 'ক্রেডিট', en: 'Credit' })}</label>
              <input id={`intl-credit-${i}`} style={inputStyle} type="number" min="0" step="1" value={row.credit}
                onChange={(e) => setRow(i, { credit: e.target.value })} placeholder="3" />
            </div>
          </div>
        ))}
      </div>
      <button type="button" className="ev-btn ev-btn-outline" style={{ marginTop: 12, minHeight: 36 }}
        onClick={() => setRows((prev) => [...prev, { grade: '', credit: '' }])}>
        {t({ bn: '+ আরেকটি কোর্স যোগ করুন', en: '+ Add another course' })}
      </button>
      {result ? (
        <div style={resultStyle} role="status">
          <p style={{ margin: '0 0 6px', fontSize: 16 }}><strong>{t({ bn: 'জিপিএ: ', en: 'GPA: ' })}{result.gpa.toFixed(2)}</strong> {t({ bn: 'স্কেল', en: 'on the' })} {result.scale} {t({ bn: 'স্কেল', en: 'scale' })}</p>
          <Tiles items={[
            { label: t({ bn: 'জিপিএ', en: 'GPA' }), value: result.gpa.toFixed(2) },
            { label: t({ bn: 'মোট ক্রেডিট', en: 'Total credits' }), value: String(result.totalCredits) },
            { label: t({ bn: 'অন্য স্কেলে', en: 'Other scale' }), value: convertGpaScale(result.gpa, result.scale, result.scale === '4.0' ? '5.0' : '4.0').toFixed(2) },
          ]} />
          <p style={formulaStyle}>{t({ bn: `সূত্র: জিপিএ = Σ(গ্রেড পয়েন্ট × ক্রেডিট) ÷ মোট ক্রেডিট (${result.totalCredits})`, en: `Formula: GPA = Σ(grade point × credit) ÷ total credits (${result.totalCredits})` })}</p>
          <div style={{ marginTop: 12 }}>
            <CopyBtn text={`GPA: ${result.gpa.toFixed(2)} (${result.scale} scale), ${result.totalCredits} credits`} labelBn="ফল কপি করুন" labelEn="Copy result" />
          </div>
        </div>
      ) : filled ? (
        <p style={errorStyle} role="alert">{t({ bn: 'কমপক্ষে একটি কোর্সের গ্রেড ও ক্রেডিট দিন।', en: 'Enter a grade and credit for at least one course.' })}</p>
      ) : null}
    </ToolSection>
  );
}
