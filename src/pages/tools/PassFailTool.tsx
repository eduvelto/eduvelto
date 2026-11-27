// Eduvelto — Pass-Fail Analyzer tool UI.
// Pure logic in src/lib/tools/passFail.ts + gradeEngine.ts.
import { useMemo, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { analyzePassFail } from '../../lib/tools/passFail';
import {
  CopyBtn, LoadExampleBtn, Tiles, ToolSection, errorStyle,
  inputStyle, labelStyle, resultStyle,
} from './eduToolUi';

const EXAMPLE = 'Rahim, 85, 72, 65\nKarim, 90, 88, 92\nSalma, 28, 81, 74\nTanvir, 45, 30, 55\nNusrat, 65, 70, 68';

export function PassFailTool() {
  const { t } = useLanguage();
  const [text, setText] = useState('');
  const [passMark, setPassMark] = useState('33');

  const result = useMemo(() => {
    if (text.trim() === '') return null;
    try { return analyzePassFail(text, Number(passMark)); } catch { return null; }
  }, [text, passMark]);

  const copyText = result
    ? `${t({ bn: 'পাস', en: 'Passed' })} (${result.summary.passed}): ${result.passed.map((s) => `${s.name} (${s.total})`).join(', ')}\n${t({ bn: 'ফেল', en: 'Failed' })} (${result.summary.failed}): ${result.failed.map((s) => `${s.name} (${s.total})`).join(', ')}`
    : '';

  return (
    <ToolSection id="passfail-title" titleBn="পাস-ফেল বিশ্লেষক" titleEn="Pass-Fail Analyzer"
      descBn="নম্বর দিয়ে কে পাস আর কে ফেল করেছে তা বিশ্লেষণ করুন (পাস নম্বর ৩৩, বদলানো যায়)।"
      descEn="Analyse who passed and who failed from marks (pass mark 33, changeable).">
      <div>
        <label style={labelStyle} htmlFor="pf-rows">{t({ bn: 'শিক্ষার্থী ও নম্বর (প্রতি লাইনে: নাম, নম্বর, নম্বর…)', en: 'Students & marks (one line each: name, marks, marks…)' })}</label>
        <textarea id="pf-rows" style={{ ...inputStyle, minHeight: 120, resize: 'vertical' }} value={text}
          onChange={(e) => setText(e.target.value)} placeholder={EXAMPLE} />
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12, alignItems: 'flex-end' }}>
        <div>
          <label style={labelStyle} htmlFor="pf-passmark">{t({ bn: 'পাস নম্বর', en: 'Pass mark' })}</label>
          <input id="pf-passmark" style={{ ...inputStyle, width: 120 }} type="number" min="1" max="100" value={passMark} onChange={(e) => setPassMark(e.target.value)} />
        </div>
        <LoadExampleBtn onLoad={() => setText(EXAMPLE)} />
      </div>
      {result ? (
        <div style={resultStyle} role="status">
          <p style={{ margin: '0 0 6px', fontSize: 16 }}>
            <strong>{t({ bn: 'পাসের হার: ', en: 'Pass rate: ' })}{result.summary.passRate}%</strong>
          </p>
          <Tiles items={[
            { label: t({ bn: 'মোট', en: 'Total' }), value: String(result.summary.total) },
            { label: t({ bn: 'পাস', en: 'Passed' }), value: String(result.summary.passed) },
            { label: t({ bn: 'ফেল', en: 'Failed' }), value: String(result.summary.failed) },
            { label: t({ bn: 'পাসের হার', en: 'Pass rate' }), value: `${result.summary.passRate}%` },
          ]} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginTop: 12 }}>
            <div>
              <p style={{ margin: '0 0 6px', fontWeight: 700, color: 'var(--heading)' }}>{t({ bn: 'পাস করেছে', en: 'Passed' })} ({result.passed.length})</p>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14 }}>
                {result.passed.map((s) => (<li key={s.name}>{s.name} — {s.total} (GPA {s.gpa.toFixed(2)})</li>))}
              </ul>
            </div>
            <div>
              <p style={{ margin: '0 0 6px', fontWeight: 700, color: 'var(--heading)' }}>{t({ bn: 'ফেল করেছে', en: 'Failed' })} ({result.failed.length})</p>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14 }}>
                {result.failed.map((s) => (<li key={s.name}>{s.name} — {s.total} (GPA {s.gpa.toFixed(2)})</li>))}
              </ul>
            </div>
          </div>
          <div style={{ marginTop: 12 }}><CopyBtn text={copyText} labelBn="ফল কপি করুন" labelEn="Copy result" /></div>
        </div>
      ) : text.trim() !== '' ? (
        <p style={errorStyle} role="alert">{t({ bn: 'প্রতি লাইনে "নাম, নম্বর, নম্বর…" লিখুন — নম্বর ০–১০০ হতে হবে।', en: 'Write "name, marks, marks…" on each line — marks must be 0–100.' })}</p>
      ) : null}
    </ToolSection>
  );
}
