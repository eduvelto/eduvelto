// Eduvelto — Grade Analyzer tool UI.
// Pure logic in src/lib/tools/gradeAnalyzer.ts + gradeEngine.ts
// (Bangladesh SSC/HSC marks -> grade scale, pass mark 33).
import { useMemo, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { analyzeMarks, parseMarksList } from '../../lib/tools/gradeAnalyzer';
import {
  CopyBtn, LoadExampleBtn, Tiles, ToolSection, errorStyle, formulaStyle,
  gridStyle, inputStyle, labelStyle, noteStyle, resultStyle,
} from './eduToolUi';

export function GradeAnalyzerTool() {
  const { t } = useLanguage();
  const [text, setText] = useState('');

  const result = useMemo(() => {
    if (text.trim() === '') return null;
    try { return analyzeMarks(parseMarksList(text)); } catch { return null; }
  }, [text]);

  const copyText = result
    ? result.subjects.map((s, i) => `Subject ${i + 1}: ${s.marks} — ${s.gradeLetter} (${s.gradePoint})`).join('\n')
      + `\nTotal: ${result.total}, Average: ${result.average}, GPA: ${result.gpa}, ${result.passed ? 'Pass' : 'Fail'}`
    : '';

  return (
    <ToolSection id="grade-analyzer-title" titleBn="গ্রেড বিশ্লেষক" titleEn="Grade Analyzer"
      descBn="নম্বর দিয়ে গ্রেড ও জিপিএ বিশ্লেষণ করুন (বাংলাদেশের এসএসসি/এইচএসসি স্কেল, পাস নম্বর ৩৩)।"
      descEn="Analyse grades and GPA from marks (Bangladesh SSC/HSC scale, pass mark 33).">
      <div style={gridStyle}>
        <div>
          <label style={labelStyle} htmlFor="grade-marks">{t({ bn: 'বিষয়ের নম্বর (কমা বা লাইন দিয়ে আলাদা করুন)', en: 'Subject marks (separate with commas or lines)' })}</label>
          <textarea id="grade-marks" style={{ ...inputStyle, minHeight: 90, resize: 'vertical' }} value={text}
            onChange={(e) => setText(e.target.value)} placeholder="85, 72, 65, 90, 78" />
        </div>
      </div>
      <div style={{ marginTop: 12 }}><LoadExampleBtn onLoad={() => setText('85, 72, 65, 90, 78, 88')} /></div>
      {result ? (
        <div style={resultStyle} role="status">
          <p style={{ margin: '0 0 6px', fontSize: 16 }}>
            <strong>{t({ bn: 'জিপিএ: ', en: 'GPA: ' })}{result.gpa.toFixed(2)}</strong> — {result.passed ? t({ bn: 'পাস', en: 'Pass' }) : t({ bn: 'ফেল', en: 'Fail' })}
          </p>
          <Tiles items={[
            { label: t({ bn: 'জিপিএ', en: 'GPA' }), value: result.gpa.toFixed(2) },
            { label: t({ bn: 'মোট নম্বর', en: 'Total' }), value: String(result.total) },
            { label: t({ bn: 'গড়', en: 'Average' }), value: result.average.toFixed(2) },
            { label: t({ bn: 'বিষয়', en: 'Subjects' }), value: String(result.subjects.length) },
          ]} />
          <div style={{ marginTop: 12, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead><tr>
                <th style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid var(--line)' }}>{t({ bn: 'বিষয়', en: 'Subject' })}</th>
                <th style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid var(--line)' }}>{t({ bn: 'নম্বর', en: 'Marks' })}</th>
                <th style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid var(--line)' }}>{t({ bn: 'গ্রেড', en: 'Grade' })}</th>
                <th style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid var(--line)' }}>{t({ bn: 'পয়েন্ট', en: 'Point' })}</th>
              </tr></thead>
              <tbody>
                {result.subjects.map((s, i) => (
                  <tr key={i}>
                    <td style={{ padding: '6px 8px' }}>{i + 1}</td>
                    <td style={{ padding: '6px 8px' }}>{s.marks}</td>
                    <td style={{ padding: '6px 8px' }}>{s.gradeLetter}</td>
                    <td style={{ padding: '6px 8px' }}>{s.gradePoint.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={formulaStyle}>{t({ bn: `সূত্র: জিপিএ = গ্রেড পয়েন্টের গড়; ৮০+ = A+ (৫.০), ৭০+ = A (৪.০), ৬০+ = A− (৩.৫), ৫০+ = B (৩.০), ৪০+ = C (২.০), ৩৩+ = D (১.০), ৩৩-এর নিচে F`, en: 'Formula: GPA = average of grade points; 80+ = A+ (5.0), 70+ = A (4.0), 60+ = A− (3.5), 50+ = B (3.0), 40+ = C (2.0), 33+ = D (1.0), below 33 = F' })}</p>
          <p style={noteStyle}>{t({ bn: 'কোনো বিষয়ে F থাকলে ফল ফেল।', en: 'Any F in a subject means an overall fail.' })}</p>
          <div style={{ marginTop: 12 }}><CopyBtn text={copyText} labelBn="ফল কপি করুন" labelEn="Copy result" /></div>
        </div>
      ) : text.trim() !== '' ? (
        <p style={errorStyle} role="alert">{t({ bn: '০–১০০ এর মধ্যে নম্বর দিন।', en: 'Enter marks between 0 and 100.' })}</p>
      ) : null}
    </ToolSection>
  );
}
