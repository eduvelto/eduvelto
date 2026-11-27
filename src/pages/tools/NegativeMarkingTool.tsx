// Eduvelto — Negative Marking Calculator tool UI.
// Pure logic in src/lib/tools/negativeMarking.ts. The 0.5 default is
// the published BCS prelim rule (Nov 2026) and stays editable.
import { useMemo, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { BCS_PRELIM_NEGATIVE, calculateNegativeMarking } from '../../lib/tools/negativeMarking';
import {
  CopyBtn, LoadExampleBtn, Tiles, ToolSection, errorStyle, formulaStyle,
  gridStyle, inputStyle, labelStyle, noteStyle, resultStyle,
} from './eduToolUi';

export function NegativeMarkingTool() {
  const { t } = useLanguage();
  const [total, setTotal] = useState('');
  const [attempted, setAttempted] = useState('');
  const [correct, setCorrect] = useState('');
  const [perQ, setPerQ] = useState('1');
  const [negative, setNegative] = useState(String(BCS_PRELIM_NEGATIVE));

  const result = useMemo(() => {
    if (total === '' || attempted === '' || correct === '') return null;
    try {
      return calculateNegativeMarking({
        totalQuestions: Number(total),
        attempted: Number(attempted),
        correct: Number(correct),
        marksPerQuestion: Number(perQ),
        negativePerWrong: Number(negative),
      });
    } catch { return null; }
  }, [total, attempted, correct, perQ, negative]);

  return (
    <ToolSection id="neg-marking-title" titleBn="নেগেটিভ মার্কিং ক্যালকুলেটর" titleEn="Negative Marking Calculator"
      descBn="ভুল উত্তরের জন্য কাটা নম্বরসহ চূড়ান্ত নম্বর হিসাব করুন। সব হিসাব আপনার ডিভাইসেই হয়।"
      descEn="Calculate a final score after deducting marks for wrong answers. Everything is computed on your device.">
      <div style={gridStyle}>
        <div>
          <label style={labelStyle} htmlFor="neg-total">{t({ bn: 'মোট প্রশ্ন', en: 'Total questions' })}</label>
          <input id="neg-total" style={inputStyle} type="number" min="1" value={total} onChange={(e) => setTotal(e.target.value)} placeholder="200" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="neg-attempted">{t({ bn: 'উত্তর দিয়েছেন', en: 'Attempted' })}</label>
          <input id="neg-attempted" style={inputStyle} type="number" min="0" value={attempted} onChange={(e) => setAttempted(e.target.value)} placeholder="180" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="neg-correct">{t({ bn: 'সঠিক উত্তর', en: 'Correct' })}</label>
          <input id="neg-correct" style={inputStyle} type="number" min="0" value={correct} onChange={(e) => setCorrect(e.target.value)} placeholder="150" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="neg-perq">{t({ bn: 'প্রতি প্রশ্নে নম্বর', en: 'Marks per question' })}</label>
          <input id="neg-perq" style={inputStyle} type="number" min="0" step="0.25" value={perQ} onChange={(e) => setPerQ(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle} htmlFor="neg-neg">{t({ bn: 'প্রতি ভুলে কাটা নম্বর', en: 'Negative per wrong' })}</label>
          <input id="neg-neg" style={inputStyle} type="number" min="0" step="0.25" value={negative} onChange={(e) => setNegative(e.target.value)} />
        </div>
      </div>
      <div style={{ marginTop: 12 }}><LoadExampleBtn onLoad={() => { setTotal('200'); setAttempted('180'); setCorrect('150'); setPerQ('1'); setNegative('0.5'); }} /></div>
      {result ? (
        <div style={resultStyle} role="status">
          <p style={{ margin: '0 0 6px', fontSize: 16 }}><strong>{t({ bn: 'চূড়ান্ত নম্বর: ', en: 'Final score: ' })}{result.finalScore} / {result.maxScore}</strong></p>
          <Tiles items={[
            { label: t({ bn: 'চূড়ান্ত নম্বর', en: 'Final score' }), value: String(result.finalScore) },
            { label: t({ bn: 'ভুল', en: 'Wrong' }), value: String(result.wrong) },
            { label: t({ bn: 'কাটা গেছে', en: 'Deducted' }), value: String(result.deduction) },
            { label: t({ bn: 'নির্ভুলতা', en: 'Accuracy' }), value: `${result.accuracy}%` },
            { label: t({ bn: 'উত্তর দেননি', en: 'Unattempted' }), value: String(result.unattempted) },
          ]} />
          <p style={formulaStyle}>{t({ bn: `সূত্র: ${correct} × ${perQ} − ${result.wrong} × ${negative} = ${result.rawScore} − ${result.deduction} = ${result.finalScore}`, en: `Formula: ${correct} × ${perQ} − ${result.wrong} × ${negative} = ${result.rawScore} − ${result.deduction} = ${result.finalScore}` })}</p>
          <p style={noteStyle}>{t({ bn: 'বিসিএস প্রিলিতে প্রতি ভুলে ০.৫ নম্বর কাটা যায় (প্রকাশিত নিয়ম, নভেম্বর ২০২৬) — অন্য পরীক্ষায় ভিন্ন হতে পারে।', en: 'BCS prelim deducts 0.5 per wrong answer (published rule, Nov 2026) — other exams may differ.' })}</p>
          <div style={{ marginTop: 12 }}>
            <CopyBtn text={`Final score: ${result.finalScore}/${result.maxScore}. Correct ${correct}, wrong ${result.wrong}, deducted ${result.deduction}, accuracy ${result.accuracy}%.`} labelBn="ফল কপি করুন" labelEn="Copy result" />
          </div>
        </div>
      ) : total !== '' || attempted !== '' || correct !== '' ? (
        <p style={errorStyle} role="alert">{t({ bn: 'সঠিক সংখ্যা দিন — সঠিক উত্তর, উত্তর দেওয়া প্রশ্নের বেশি হতে পারে না।', en: 'Enter valid numbers — correct answers cannot exceed attempted.' })}</p>
      ) : null}
    </ToolSection>
  );
}
