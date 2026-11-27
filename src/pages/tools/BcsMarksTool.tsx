// Eduvelto — BCS Marks Calculator tool UI.
// Pure logic in src/lib/tools/bcsMarks.ts. The structure is editable
// data with source + date (BPSC published structure, Nov 2026).
import { useMemo, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { BCS_STRUCTURE, calculateBcsMarks } from '../../lib/tools/bcsMarks';
import {
  CopyBtn, LoadExampleBtn, Tiles, ToolSection, errorStyle, formulaStyle,
  gridStyle, inputStyle, labelStyle, noteStyle, resultStyle,
} from './eduToolUi';

const EXAMPLE_WRITTEN: Record<string, string> = {
  bangla: '150', english: '140', bangladeshAffairs: '160',
  internationalAffairs: '70', mathMental: '80', scienceTech: '75',
};

export function BcsMarksTool() {
  const { t } = useLanguage();
  const [correct, setCorrect] = useState('');
  const [wrong, setWrong] = useState('');
  const [written, setWritten] = useState<Record<string, string>>({});
  const [viva, setViva] = useState('');

  const result = useMemo(() => {
    if (correct === '' && wrong === '' && viva === '' && Object.keys(written).length === 0) return null;
    try {
      const w: Record<string, number> = {};
      for (const s of BCS_STRUCTURE.writtenSubjects) w[s.key] = Number(written[s.key] ?? 0);
      return calculateBcsMarks({
        prelimCorrect: Number(correct || 0),
        prelimWrong: Number(wrong || 0),
        written: w,
        viva: Number(viva || 0),
      });
    } catch { return null; }
  }, [correct, wrong, written, viva]);

  const setWrittenMark = (key: string, value: string) =>
    setWritten((prev) => ({ ...prev, [key]: value }));

  return (
    <ToolSection id="bcs-marks-title" titleBn="বিসিএস নম্বর ক্যালকুলেটর" titleEn="BCS Marks Calculator"
      descBn="বিসিএস পরীক্ষার বিষয়ভিত্তিক নম্বর যোগ করে মোট নম্বর হিসাব করুন। সব হিসাব আপনার ডিভাইসেই হয়।"
      descEn="Add up subject-wise marks to work out a total BCS score. Everything is computed on your device.">
      <div style={gridStyle}>
        <div>
          <label style={labelStyle} htmlFor="bcs-correct">{t({ bn: 'প্রিলি সঠিক উত্তর (২০০-এর মধ্যে)', en: 'Prelim correct (of 200)' })}</label>
          <input id="bcs-correct" style={inputStyle} type="number" min="0" max="200" value={correct} onChange={(e) => setCorrect(e.target.value)} placeholder="150" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="bcs-wrong">{t({ bn: 'প্রিলি ভুল উত্তর', en: 'Prelim wrong' })}</label>
          <input id="bcs-wrong" style={inputStyle} type="number" min="0" max="200" value={wrong} onChange={(e) => setWrong(e.target.value)} placeholder="30" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="bcs-viva">{t({ bn: 'ভাইভা (১০০-এর মধ্যে)', en: 'Viva (of 100)' })}</label>
          <input id="bcs-viva" style={inputStyle} type="number" min="0" max="100" value={viva} onChange={(e) => setViva(e.target.value)} placeholder="80" />
        </div>
        {BCS_STRUCTURE.writtenSubjects.map((s) => (
          <div key={s.key}>
            <label style={labelStyle} htmlFor={`bcs-${s.key}`}>{t({ bn: s.bn, en: s.en })} ({s.max})</label>
            <input id={`bcs-${s.key}`} style={inputStyle} type="number" min="0" max={s.max} value={written[s.key] ?? ''}
              onChange={(e) => setWrittenMark(s.key, e.target.value)} placeholder="0" />
          </div>
        ))}
      </div>
      <div style={{ marginTop: 12 }}>
        <LoadExampleBtn onLoad={() => { setCorrect('150'); setWrong('30'); setViva('80'); setWritten({ ...EXAMPLE_WRITTEN }); }} />
      </div>
      {result ? (
        <div style={resultStyle} role="status">
          <p style={{ margin: '0 0 6px', fontSize: 16 }}><strong>{t({ bn: 'মোট নম্বর: ', en: 'Total marks: ' })}{result.grandTotal} / {BCS_STRUCTURE.grandTotal} ({result.overallPct}%)</strong></p>
          <Tiles items={[
            { label: t({ bn: 'প্রিলি', en: 'Prelim' }), value: `${result.prelimScore} / 200` },
            { label: t({ bn: 'লিখিত', en: 'Written' }), value: `${result.writtenTotal} / 900` },
            { label: t({ bn: 'ভাইভা', en: 'Viva' }), value: `${result.viva} / 100` },
            { label: t({ bn: 'মোট', en: 'Total' }), value: `${result.grandTotal} / 1200` },
          ]} />
          <p style={formulaStyle}>{t({ bn: `প্রিলি: ${correct || 0} সঠিক − ${wrong || 0} ভুল × ০.৫ = ${result.prelimScore}; লিখিত ${result.writtenTotal} + ভাইভা ${result.viva} = মোট ${result.grandTotal}`, en: `Prelim: ${correct || 0} correct − ${wrong || 0} wrong × 0.5 = ${result.prelimScore}; written ${result.writtenTotal} + viva ${result.viva} = total ${result.grandTotal}` })}</p>
          <p style={noteStyle}>{t({ bn: BCS_STRUCTURE.sourceBn, en: BCS_STRUCTURE.sourceEn })}</p>
          <div style={{ marginTop: 12 }}>
            <CopyBtn text={`BCS total: ${result.grandTotal}/1200 (${result.overallPct}%). Prelim ${result.prelimScore}/200, Written ${result.writtenTotal}/900, Viva ${result.viva}/100.`} labelBn="ফল কপি করুন" labelEn="Copy result" />
          </div>
        </div>
      ) : (
        <p style={noteStyle}>{t({ bn: 'প্রিলি ২০০, লিখিত ৯০০, ভাইভা ১০০ — মোট ১২০০ নম্বর।', en: 'Prelim 200, Written 900, Viva 100 — 1200 marks in total.' })}</p>
      )}
      {result === null && (correct !== '' || wrong !== '' || viva !== '') ? (
        <p style={errorStyle} role="alert">{t({ bn: 'নম্বর সীমার মধ্যে দিন — প্রিলি সঠিক+ভুল ২০০-এর বেশি হতে পারে না।', en: 'Keep marks within range — prelim correct + wrong cannot exceed 200.' })}</p>
      ) : null}
    </ToolSection>
  );
}
