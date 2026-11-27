// Eduvelto — Morse Code Converter tool UI (Text batch, 27 Nov 2026).
// One bidirectional tool: text -> Morse AND Morse -> text (audit #202 + #203).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Pure logic lives in src/lib/tools/textTools.ts.
// All processing is 100% in-browser; nothing is uploaded.
import { useMemo, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, CopyButton, ButtonRow, ClearButton, ExampleButton, inputStyle, labelStyle, cardStyle, noteStyle, activeButtonStyle, buttonStyle } from './toolUi';
import { textToMorse, morseToText } from '../../lib/tools/textTools';

export function MorseCodeConverterTool() {
  const { t } = useLanguage();
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [input, setInput] = useState('SOS');
  const output = useMemo(() => (mode === 'encode' ? textToMorse(input) : morseToText(input)), [input, mode]);
  const loadExample = () => setInput(mode === 'encode' ? 'SOS' : '... --- ...');
  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="মোর্স কোড কনভার্টার" titleEn="Morse Code Converter" descBn="লেখা থেকে মোর্স কোডে, আবার মোর্স কোড থেকে লেখায় — দুই দিকেই বদলান।" descEn="Convert text to Morse code and Morse code back to text — both directions." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <button type="button" style={mode === 'encode' ? activeButtonStyle : buttonStyle} onClick={() => setMode('encode')}>{t({ bn: 'লেখা → মোর্স', en: 'Text → Morse' })}</button>
        <button type="button" style={mode === 'decode' ? activeButtonStyle : buttonStyle} onClick={() => setMode('decode')}>{t({ bn: 'মোর্স → লেখা', en: 'Morse → Text' })}</button>
      </div>
      <div>
        <label style={labelStyle} htmlFor="morse-input">{t({ bn: mode === 'encode' ? 'আপনার লেখা (A–Z, ০–৯ ও কিছু চিহ্ন)' : 'মোর্স কোড (. ও -, অক্ষরে ফাঁকা, শব্দে /)', en: mode === 'encode' ? 'Your text (A–Z, 0–9 and some punctuation)' : 'Morse code (. and -, space between letters, / between words)' })}</label>
        <textarea id="morse-input" style={inputStyle} value={input} onChange={(e) => setInput(e.target.value)} placeholder={mode === 'encode' ? 'SOS' : '... --- ...'} />
      </div>
      <ButtonRow>
        <ExampleButton onLoad={loadExample} />
        <ClearButton onClear={() => setInput('')} disabled={input === ''} />
      </ButtonRow>
      <div>
        <label style={labelStyle} htmlFor="morse-output">{t({ bn: 'ফলাফল', en: 'Result' })}</label>
        <textarea id="morse-output" style={{ ...inputStyle, minHeight: 90 }} value={output ?? ''} readOnly />
      </div>
      <ButtonRow>
        <CopyButton text={output ?? ''} disabled={!output} labelBn="ফলাফল কপি করুন" labelEn="Copy result" />
      </ButtonRow>
      {output === null ? <p style={{ color: '#b3261e', fontSize: 14, marginTop: 12 }}>{t({ bn: 'মোর্স কোড ঠিক নয় — অচেনা সংকেত আছে।', en: 'Not valid Morse code — there is an unknown signal.' })}</p> : null}
      <p style={noteStyle}>{t({ bn: 'উদাহরণ: SOS = ... --- ...। বাংলা অক্ষরের মোর্স কোড নেই, তাই শুধু ইংরেজি অক্ষর, সংখ্যা ও কিছু চিহ্ন বদলানো যায়।', en: 'Example: SOS = ... --- .... There is no Morse code for Bangla letters, so only English letters, digits and some punctuation convert.' })}</p>
    </section>
  );
}
