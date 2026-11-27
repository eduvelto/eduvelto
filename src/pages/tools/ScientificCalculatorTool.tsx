// Eduvelto — Scientific Calculator tool UI.
// Pure logic in src/lib/tools/scientificCalculator.ts — a safe
// expression parser (tokenizer + recursive descent). NEVER eval().
import { useMemo, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { evaluateExpression, formatCalcResult, type AngleMode } from '../../lib/tools/scientificCalculator';
import {
  CopyBtn, LoadExampleBtn, ToolSection, errorStyle, formulaStyle,
  inputStyle, labelStyle, noteStyle, resultStyle,
} from './eduToolUi';

const BUTTONS = ['7', '8', '9', '/', '(', '4', '5', '6', '*', ')', '1', '2', '3', '-', '^', '0', '.', '%', '+', 'pi', 'sin(', 'cos(', 'tan(', 'sqrt(', 'log(', 'ln('];

export function ScientificCalculatorTool() {
  const { t } = useLanguage();
  const [expr, setExpr] = useState('');
  const [mode, setMode] = useState<AngleMode>('deg');

  const { value, error } = useMemo(() => {
    if (expr.trim() === '') return { value: null as string | null, error: null as string | null };
    try {
      return { value: formatCalcResult(evaluateExpression(expr, mode)), error: null as string | null };
    } catch (e) {
      return { value: null as string | null, error: e instanceof Error ? e.message : 'error' };
    }
  }, [expr, mode]);

  return (
    <ToolSection id="sci-calc-title" titleBn="বৈজ্ঞানিক ক্যালকুলেটর" titleEn="Scientific Calculator"
      descBn="ত্রিকোণমিতি, লগ ও ঘাতসহ বৈজ্ঞানিক হিসাব করুন। ফল টাইপ করার সাথে সাথে দেখা যায়।"
      descEn="Do scientific calculations including trigonometry, logarithms and powers. The result appears as you type.">
      <div>
        <label style={labelStyle} htmlFor="sci-expr">{t({ bn: 'হিসাব', en: 'Expression' })}</label>
        <input id="sci-expr" style={{ ...inputStyle, fontSize: 18, fontFamily: 'monospace' }} type="text" value={expr}
          onChange={(e) => setExpr(e.target.value)} placeholder="sin(30) + 2^3" />
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
        <LoadExampleBtn onLoad={() => setExpr('sin(30) + 2^3')} />
        <button type="button" className="ev-btn ev-btn-outline" style={{ minHeight: 36 }}
          onClick={() => setMode(mode === 'deg' ? 'rad' : 'deg')}>
          {t({ bn: mode === 'deg' ? 'ডিগ্রি (বদলে রেডিয়ান)' : 'রেডিয়ান (বদলে ডিগ্রি)', en: mode === 'deg' ? 'Degrees (switch to radians)' : 'Radians (switch to degrees)' })}
        </button>
        <button type="button" className="ev-btn ev-btn-outline" style={{ minHeight: 36 }} onClick={() => setExpr('')}>
          {t({ bn: 'মুছে ফেলুন', en: 'Clear' })}
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginTop: 12 }}>
        {BUTTONS.map((b) => (
          <button key={b} type="button" className="ev-btn ev-btn-outline" style={{ minHeight: 44, fontFamily: 'monospace' }}
            onClick={() => setExpr((prev) => prev + b)}>
            {b}
          </button>
        ))}
        <button type="button" className="ev-btn ev-btn-outline" style={{ minHeight: 44 }}
          onClick={() => setExpr((prev) => prev.slice(0, -1))}>⌫</button>
      </div>
      {value !== null ? (
        <div style={resultStyle} role="status">
          <p style={{ margin: '0 0 6px', fontSize: 16 }}><strong>{t({ bn: 'ফল: ', en: 'Result: ' })}{value}</strong></p>
          <p style={formulaStyle}>{t({ bn: `${expr} = ${value} (${mode === 'deg' ? 'ডিগ্রি' : 'রেডিয়ান'} মোড)`, en: `${expr} = ${value} (${mode} mode)` })}</p>
          <div style={{ marginTop: 12 }}><CopyBtn text={`${expr} = ${value}`} labelBn="ফল কপি করুন" labelEn="Copy result" /></div>
        </div>
      ) : error ? (
        <p style={errorStyle} role="alert">{error}</p>
      ) : null}
      <p style={noteStyle}>{t({ bn: 'sin, cos, tan, asin, acos, atan, log, ln, sqrt, abs, pi ও e ব্যবহার করা যায়।', en: 'sin, cos, tan, asin, acos, atan, log, ln, sqrt, abs, pi and e are supported.' })}</p>
    </ToolSection>
  );
}
