// Eduvelto — Attendance Calculator tool UI.
// Pure logic in src/lib/tools/attendance.ts. Default target 75%.
import { useMemo, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { calculateAttendance } from '../../lib/tools/attendance';
import {
  CopyBtn, LoadExampleBtn, Tiles, ToolSection, errorStyle, formulaStyle,
  gridStyle, inputStyle, labelStyle, resultStyle,
} from './eduToolUi';

export function AttendanceTool() {
  const { t } = useLanguage();
  const [attended, setAttended] = useState('');
  const [total, setTotal] = useState('');
  const [target, setTarget] = useState('75');

  const result = useMemo(() => {
    if (attended === '' || total === '') return null;
    try { return calculateAttendance(Number(attended), Number(total), Number(target)); } catch { return null; }
  }, [attended, total, target]);

  return (
    <ToolSection id="attendance-title" titleBn="উপস্থিতি ক্যালকুলেটর" titleEn="Attendance Calculator"
      descBn="৭৫% উপস্থিতি পূরণ করতে আর কত ক্লাস করতে হবে তা হিসাব করুন। সব হিসাব আপনার ডিভাইসেই হয়।"
      descEn="Work out how many more classes to attend to reach 75% attendance. Everything is computed on your device.">
      <div style={gridStyle}>
        <div>
          <label style={labelStyle} htmlFor="att-attended">{t({ bn: 'উপস্থিত ক্লাস', en: 'Classes attended' })}</label>
          <input id="att-attended" style={inputStyle} type="number" min="0" step="1" value={attended} onChange={(e) => setAttended(e.target.value)} placeholder="60" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="att-total">{t({ bn: 'মোট ক্লাস', en: 'Total classes' })}</label>
          <input id="att-total" style={inputStyle} type="number" min="1" step="1" value={total} onChange={(e) => setTotal(e.target.value)} placeholder="80" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="att-target">{t({ bn: 'লক্ষ্য (%)', en: 'Target (%)' })}</label>
          <input id="att-target" style={inputStyle} type="number" min="1" max="99" step="1" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="75" />
        </div>
      </div>
      <div style={{ marginTop: 12 }}><LoadExampleBtn onLoad={() => { setAttended('70'); setTotal('100'); setTarget('75'); }} /></div>
      {result ? (
        <div style={resultStyle} role="status">
          <p style={{ margin: '0 0 6px', fontSize: 16 }}><strong>{t({ bn: 'উপস্থিতি: ', en: 'Attendance: ' })}{result.percentage}%</strong></p>
          <Tiles items={[
            { label: t({ bn: 'উপস্থিতি', en: 'Attendance' }), value: `${result.percentage}%` },
            { label: t({ bn: 'আরও ক্লাস লাগবে', en: 'More classes needed' }), value: String(result.classesNeeded) },
            { label: t({ bn: 'বাদ দেওয়া যাবে', en: 'Can miss' }), value: String(result.classesCanMiss) },
            { label: t({ bn: 'লক্ষ্য', en: 'Target' }), value: `${result.target}%` },
          ]} />
          <p style={formulaStyle}>{t({ bn: `সূত্র: উপস্থিতি = ${result.attended} ÷ ${result.total} × ১০০ = ${result.percentage}%`, en: `Formula: attendance = ${result.attended} ÷ ${result.total} × 100 = ${result.percentage}%` })}</p>
          <div style={{ marginTop: 12 }}>
            <CopyBtn text={`Attendance: ${result.percentage}% (${result.attended}/${result.total}), target ${result.target}%. Need ${result.classesNeeded} more classes.`} labelBn="ফল কপি করুন" labelEn="Copy result" />
          </div>
        </div>
      ) : attended !== '' || total !== '' ? (
        <p style={errorStyle} role="alert">{t({ bn: 'সঠিক সংখ্যা দিন — উপস্থিত ক্লাস মোট ক্লাসের বেশি হতে পারে না।', en: 'Enter valid numbers — attended classes cannot exceed total classes.' })}</p>
      ) : null}
    </ToolSection>
  );
}
