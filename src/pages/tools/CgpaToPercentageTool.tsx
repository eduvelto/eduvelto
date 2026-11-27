// Eduvelto — CGPA to Percentage Converter tool UI.
// Pure logic in src/lib/tools/cgpaToPercentage.ts. Three labelled
// formulas — none presented as universal.
import { useMemo, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { PERCENTAGE_FORMULAS, convertCgpaToPercentage, type PercentageFormula } from '../../lib/tools/cgpaToPercentage';
import {
  CopyBtn, LoadExampleBtn, Tiles, ToolSection, errorStyle, formulaStyle,
  gridStyle, inputStyle, labelStyle, noteStyle, resultStyle,
} from './eduToolUi';

export function CgpaToPercentageTool() {
  const { t } = useLanguage();
  const [cgpa, setCgpa] = useState('');
  const [scale, setScale] = useState('4.0');
  const [formula, setFormula] = useState<PercentageFormula>('proportional');

  const result = useMemo(() => {
    if (cgpa === '') return null;
    try { return convertCgpaToPercentage(Number(cgpa), Number(scale), formula); } catch { return null; }
  }, [cgpa, scale, formula]);

  return (
    <ToolSection id="cgpa-pct-title" titleBn="সিজিপিএ থেকে শতাংশ কনভার্টার" titleEn="CGPA to Percentage Converter"
      descBn="সিজিপিএকে শতাংশে রূপান্তর করুন — সূত্রটি আপনিই বেছে নিন। সব হিসাব আপনার ডিভাইসেই হয়।"
      descEn="Convert a CGPA value into a percentage — you choose the formula. Everything is computed on your device.">
      <div style={gridStyle}>
        <div>
          <label style={labelStyle} htmlFor="cgpa-pct-value">{t({ bn: 'সিজিপিএ', en: 'CGPA' })}</label>
          <input id="cgpa-pct-value" style={inputStyle} type="number" min="0" step="0.01" value={cgpa}
            onChange={(e) => setCgpa(e.target.value)} placeholder="3.50" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="cgpa-pct-scale">{t({ bn: 'স্কেল', en: 'Scale' })}</label>
          <select id="cgpa-pct-scale" style={inputStyle} value={scale} onChange={(e) => setScale(e.target.value)}>
            <option value="4.0">4.00</option>
            <option value="5.0">5.00</option>
            <option value="10">10.00</option>
          </select>
        </div>
        <div>
          <label style={labelStyle} htmlFor="cgpa-pct-formula">{t({ bn: 'সূত্র', en: 'Formula' })}</label>
          <select id="cgpa-pct-formula" style={inputStyle} value={formula} onChange={(e) => setFormula(e.target.value as PercentageFormula)}>
            {(Object.keys(PERCENTAGE_FORMULAS) as PercentageFormula[]).map((f) => (
              <option key={f} value={f}>{t(PERCENTAGE_FORMULAS[f])}</option>
            ))}
          </select>
        </div>
      </div>
      <div style={{ marginTop: 12 }}><LoadExampleBtn onLoad={() => { setCgpa('3.5'); setScale('4.0'); setFormula('proportional'); }} /></div>
      {result ? (
        <div style={resultStyle} role="status">
          <p style={{ margin: '0 0 6px', fontSize: 16 }}><strong>{t({ bn: 'শতাংশ: ', en: 'Percentage: ' })}{result.percentage.toFixed(2)}%</strong></p>
          <Tiles items={[
            { label: t({ bn: 'শতাংশ', en: 'Percentage' }), value: `${result.percentage.toFixed(2)}%` },
            { label: t({ bn: 'সিজিপিএ', en: 'CGPA' }), value: cgpa },
            { label: t({ bn: 'স্কেল', en: 'Scale' }), value: scale },
          ]} />
          <p style={formulaStyle}>{formula === 'proportional'
            ? t({ bn: `সূত্র: ${cgpa} ÷ ${scale} × ১০০ = ${result.percentage.toFixed(2)}%`, en: `Formula: ${cgpa} ÷ ${scale} × 100 = ${result.percentage.toFixed(2)}%` })
            : formula === 'x9.5'
              ? t({ bn: `সূত্র: ${cgpa} × ৯.৫ = ${result.percentage.toFixed(2)}%`, en: `Formula: ${cgpa} × 9.5 = ${result.percentage.toFixed(2)}%` })
              : t({ bn: `সূত্র: ${cgpa} × ১০ = ${result.percentage.toFixed(2)}%`, en: `Formula: ${cgpa} × 10 = ${result.percentage.toFixed(2)}%` })}</p>
          <p style={noteStyle}>{t({ bn: 'কোনো একক সর্বজনীন সূত্র নেই — প্রতিষ্ঠানভেদে রূপান্তর ভিন্ন হতে পারে।', en: 'There is no single universal formula — conversion can differ by institution.' })}</p>
          <div style={{ marginTop: 12 }}>
            <CopyBtn text={`CGPA ${cgpa} (${scale} scale) = ${result.percentage.toFixed(2)}%`} labelBn="ফল কপি করুন" labelEn="Copy result" />
          </div>
        </div>
      ) : cgpa !== '' ? (
        <p style={errorStyle} role="alert">{t({ bn: 'সিজিপিএ স্কেলের মধ্যে হতে হবে (যেমন ৪.০ স্কেলে ০–৪)।', en: 'CGPA must be within the scale (e.g. 0–4 on the 4.0 scale).' })}</p>
      ) : null}
    </ToolSection>
  );
}
