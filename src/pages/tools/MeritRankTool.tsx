// Eduvelto — Merit Rank & Result Sheet tool UI.
// Pure logic in src/lib/tools/meritRank.ts + gradeEngine.ts.
import { useMemo, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { buildMeritSheet } from '../../lib/tools/meritRank';
import {
  CopyBtn, LoadExampleBtn, Tiles, ToolSection, errorStyle,
  inputStyle, labelStyle, noteStyle, resultStyle,
} from './eduToolUi';

const EXAMPLE = 'Rahim, 85, 72, 65\nKarim, 90, 88, 92\nSalma, 78, 81, 74\nTanvir, 90, 88, 92\nNusrat, 65, 70, 68';

export function MeritRankTool() {
  const { t } = useLanguage();
  const [text, setText] = useState('');

  const result = useMemo(() => {
    if (text.trim() === '') return null;
    try { return buildMeritSheet(text); } catch { return null; }
  }, [text]);

  const copyText = result
    ? result.ranked.map((s) => `#${s.rank} ${s.name} — ${s.total} (GPA ${s.gpa}, ${s.passed ? 'Pass' : 'Fail'})`).join('\n')
    : '';

  return (
    <ToolSection id="merit-title" titleBn="মেধাক্রম ও ফলাফল শিট" titleEn="Merit Rank & Result Sheet"
      descBn="শিক্ষার্থীদের নম্বর দিয়ে মেধাক্রম ও ফলাফল শিট তৈরি করুন। সমান নম্বরে একই মেধাক্রম হয়।"
      descEn="Create a merit ranking and result sheet from student marks. Equal totals share a rank.">
      <div>
        <label style={labelStyle} htmlFor="merit-rows">{t({ bn: 'শিক্ষার্থী ও নম্বর (প্রতি লাইনে: নাম, নম্বর, নম্বর…)', en: 'Students & marks (one line each: name, marks, marks…)' })}</label>
        <textarea id="merit-rows" style={{ ...inputStyle, minHeight: 120, resize: 'vertical' }} value={text}
          onChange={(e) => setText(e.target.value)} placeholder={EXAMPLE} />
      </div>
      <div style={{ marginTop: 12 }}><LoadExampleBtn onLoad={() => setText(EXAMPLE)} /></div>
      {result ? (
        <div style={resultStyle} role="status">
          <p style={{ margin: '0 0 6px', fontSize: 16 }}>
            <strong>{t({ bn: 'প্রথম স্থান: ', en: 'Topper: ' })}{result.topper?.name} ({result.topper?.total})</strong>
          </p>
          <Tiles items={[
            { label: t({ bn: 'শিক্ষার্থী', en: 'Students' }), value: String(result.summary.total) },
            { label: t({ bn: 'পাস', en: 'Passed' }), value: String(result.summary.passed) },
            { label: t({ bn: 'ফেল', en: 'Failed' }), value: String(result.summary.failed) },
            { label: t({ bn: 'পাসের হার', en: 'Pass rate' }), value: `${result.summary.passRate}%` },
          ]} />
          <div style={{ marginTop: 12, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead><tr>
                <th style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid var(--line)' }}>{t({ bn: 'মেধাক্রম', en: 'Rank' })}</th>
                <th style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid var(--line)' }}>{t({ bn: 'নাম', en: 'Name' })}</th>
                <th style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid var(--line)' }}>{t({ bn: 'মোট', en: 'Total' })}</th>
                <th style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid var(--line)' }}>{t({ bn: 'জিপিএ', en: 'GPA' })}</th>
                <th style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid var(--line)' }}>{t({ bn: 'ফল', en: 'Result' })}</th>
              </tr></thead>
              <tbody>
                {result.ranked.map((s) => (
                  <tr key={s.name}>
                    <td style={{ padding: '6px 8px', fontWeight: 700 }}>{s.rank}</td>
                    <td style={{ padding: '6px 8px' }}>{s.name}</td>
                    <td style={{ padding: '6px 8px' }}>{s.total}</td>
                    <td style={{ padding: '6px 8px' }}>{s.gpa.toFixed(2)}</td>
                    <td style={{ padding: '6px 8px' }}>{s.passed ? t({ bn: 'পাস', en: 'Pass' }) : t({ bn: 'ফেল', en: 'Fail' })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={noteStyle}>{t({ bn: 'গ্রেড স্কেল: ৮০+ A+, ৭০+ A, ৬০+ A−, ৫০+ B, ৪০+ C, ৩৩+ D, ৩৩-এর নিচে F।', en: 'Grade scale: 80+ A+, 70+ A, 60+ A−, 50+ B, 40+ C, 33+ D, below 33 F.' })}</p>
          <div style={{ marginTop: 12 }}><CopyBtn text={copyText} labelBn="শিট কপি করুন" labelEn="Copy sheet" /></div>
        </div>
      ) : text.trim() !== '' ? (
        <p style={errorStyle} role="alert">{t({ bn: 'প্রতি লাইনে "নাম, নম্বর, নম্বর…" লিখুন — নম্বর ০–১০০ হতে হবে।', en: 'Write "name, marks, marks…" on each line — marks must be 0–100.' })}</p>
      ) : null}
    </ToolSection>
  );
}
