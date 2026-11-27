// Eduvelto — Find and Replace tool UI.
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Pure logic lives in src/lib/tools — this file is presentation only.
// All processing is 100% in-browser; nothing is uploaded.

import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, CopyButton, Tiles, ButtonRow, ClearButton, ExampleButton, inputStyle, shortInputStyle, labelStyle, cardStyle } from './toolUi';
import { findReplace } from '../../lib/tools/findReplace';


const outputStyle: CSSProperties = {
  width: '100%',
  minHeight: 120,
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid var(--line)',
  fontSize: 15,
  boxSizing: 'border-box',
  background: 'var(--teal-soft)',
  color: 'var(--heading)',
  fontFamily: 'inherit',
  resize: 'vertical',
};

const errorStyle: CSSProperties = {
  marginTop: 12,
  padding: '10px 12px',
  borderRadius: 8,
  background: '#fef2f2',
  color: '#991b1b',
  fontSize: 14,
};

export function FindAndReplaceTool() {
  const { t } = useLanguage();
  const [input, setInput] = useState('');
  const [find, setFind] = useState('');
  const [replace, setReplace] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const result = useMemo(() => {
    try {
      return { ...findReplace(input, find, replace, { caseSensitive, wholeWord, useRegex }), error: '' };
    } catch (err) {
      return { result: input, count: 0, error: err instanceof Error ? err.message : 'Invalid pattern.' };
    }
  }, [input, find, replace, caseSensitive, wholeWord, useRegex]);
  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="খুঁজুন ও বদলান" titleEn="Find and Replace" descBn="লেখার মধ্যে নির্দিষ্ট শব্দ খুঁজে অন্য শব্দ দিয়ে বদলে দিন।" descEn="Find a word in a text and replace it with another word." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div>
        <label style={labelStyle} htmlFor="fr-input">{t({ bn: 'আপনার লেখা', en: 'Your text' })}</label>
        <textarea id="fr-input" style={inputStyle} value={input} onChange={(e) => setInput(e.target.value)} placeholder={t({ bn: 'এখানে লিখুন…', en: 'Type here…' })} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginTop: 12 }}>
        <div>
          <label style={labelStyle} htmlFor="fr-find">{t({ bn: 'খুঁজুন', en: 'Find' })}</label>
          <input id="fr-find" style={shortInputStyle} value={find} onChange={(e) => setFind(e.target.value)} placeholder="cat" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="fr-replace">{t({ bn: 'বদলে লিখুন', en: 'Replace with' })}</label>
          <input id="fr-replace" style={shortInputStyle} value={replace} onChange={(e) => setReplace(e.target.value)} placeholder="dog" />
        </div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 12 }}>
        <label style={{ fontSize: 15 }}><input type="checkbox" checked={caseSensitive} onChange={(e) => setCaseSensitive(e.target.checked)} /> {t({ bn: 'বড়/ছোট হাতের পার্থক্য ধরুন', en: 'Case sensitive' })}</label>
        <label style={{ fontSize: 15 }}><input type="checkbox" checked={wholeWord} onChange={(e) => setWholeWord(e.target.checked)} /> {t({ bn: 'শুধু পুরো শব্দ', en: 'Whole word only' })}</label>
        <label style={{ fontSize: 15 }}><input type="checkbox" checked={useRegex} onChange={(e) => setUseRegex(e.target.checked)} /> {t({ bn: 'রেগেক্স ব্যবহার করুন', en: 'Use regex' })}</label>
      </div>
      {result.error ? <div style={errorStyle} role="alert">{result.error}</div> : null}
      <Tiles items={[{ labelBn: 'বদলানো হয়েছে', labelEn: 'Replacements', value: String(result.count) }]} />
      <div style={{ marginTop: 12 }}>
        <label style={labelStyle} htmlFor="fr-output">{t({ bn: 'ফলাফল', en: 'Result' })}</label>
        <textarea id="fr-output" style={outputStyle} value={result.result} readOnly aria-readonly="true" />
      </div>
      <ButtonRow>
        <CopyButton text={result.result} />
        <ExampleButton onLoad={() => { setInput('The cat sat on the mat. The cat is happy.'); setFind('cat'); setReplace('dog'); }} />
        <ClearButton onClear={() => { setInput(''); setFind(''); setReplace(''); }} disabled={input === ''} />
      </ButtonRow>
    </section>
  );
}
