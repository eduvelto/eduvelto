// Eduvelto — Essay / Thesis Statement Generator tool UI (Text batch, 27 Nov 2026).
// Template-based builder (no AI). Renders inside ToolsDetailPage's PageShell.
// Pure logic lives in src/lib/tools/textTools.ts.
// All processing is 100% in-browser; nothing is uploaded.
import { useMemo, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, CopyButton, ButtonRow, ClearButton, ExampleButton, shortInputStyle, inputStyle, labelStyle, cardStyle, noteStyle, activeButtonStyle, buttonStyle } from './toolUi';
import { generateThesis, generateThesisBangla } from '../../lib/tools/textTools';

export function EssayThesisGeneratorTool() {
  const { t } = useLanguage();
  const [lang, setLang] = useState<'en' | 'bn'>('en');
  const [topic, setTopic] = useState('online learning');
  const [position, setPosition] = useState('is better than classroom learning');
  const [reasons, setReasons] = useState('it is flexible\nit saves money');
  const reasonList = useMemo(() => reasons.split('\n'), [reasons]);
  const thesis = useMemo(
    () => (lang === 'en' ? generateThesis(topic, position, reasonList) : generateThesisBangla(topic, position, reasonList)),
    [lang, topic, position, reasonList],
  );
  const loadExample = () => {
    if (lang === 'en') {
      setTopic('online learning');
      setPosition('is better than classroom learning');
      setReasons('it is flexible\nit saves money');
    } else {
      setTopic('বই পড়া');
      setPosition('জ্ঞান বাড়ায়');
      setReasons('এটি চিন্তা বাড়ায়\nএটি ভাষা শেখায়');
    }
  };
  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="রচনা / থিসিস বিবৃতি জেনারেটর" titleEn="Essay / Thesis Statement Generator" descBn="বিষয়, মত ও কারণ দিলে রচনার থিসিস বিবৃতি বানিয়ে দেয় — টেমপ্লেটভিত্তিক।" descEn="Give a topic, position and reasons to build an essay thesis statement — template-based." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <button type="button" style={lang === 'en' ? activeButtonStyle : buttonStyle} onClick={() => setLang('en')}>English</button>
        <button type="button" style={lang === 'bn' ? activeButtonStyle : buttonStyle} onClick={() => setLang('bn')}>বাংলা</button>
      </div>
      <div>
        <label style={labelStyle} htmlFor="thesis-topic">{t({ bn: 'বিষয়', en: 'Topic' })}</label>
        <input id="thesis-topic" style={shortInputStyle} value={topic} onChange={(e) => setTopic(e.target.value)} placeholder={lang === 'en' ? 'online learning' : 'বই পড়া'} />
      </div>
      <div style={{ marginTop: 12 }}>
        <label style={labelStyle} htmlFor="thesis-position">{t({ bn: 'আপনার মত', en: 'Your position' })}</label>
        <input id="thesis-position" style={shortInputStyle} value={position} onChange={(e) => setPosition(e.target.value)} placeholder={lang === 'en' ? 'is better than classroom learning' : 'জ্ঞান বাড়ায়'} />
      </div>
      <div style={{ marginTop: 12 }}>
        <label style={labelStyle} htmlFor="thesis-reasons">{t({ bn: 'কারণ (প্রতি লাইনে একটি)', en: 'Reasons (one per line)' })}</label>
        <textarea id="thesis-reasons" style={inputStyle} value={reasons} onChange={(e) => setReasons(e.target.value)} placeholder={lang === 'en' ? 'it is flexible\nit saves money' : 'এটি চিন্তা বাড়ায়\nএটি ভাষা শেখায়'} />
      </div>
      <ButtonRow>
        <ExampleButton onLoad={loadExample} />
        <ClearButton onClear={() => { setTopic(''); setPosition(''); setReasons(''); }} disabled={topic === '' && position === '' && reasons === ''} />
      </ButtonRow>
      <div>
        <label style={labelStyle} htmlFor="thesis-output">{t({ bn: 'থিসিস বিবৃতি', en: 'Thesis statement' })}</label>
        <textarea id="thesis-output" style={{ ...inputStyle, minHeight: 90 }} value={thesis ?? ''} readOnly />
      </div>
      <ButtonRow>
        <CopyButton text={thesis ?? ''} disabled={!thesis} labelBn="বিবৃতি কপি করুন" labelEn="Copy statement" />
      </ButtonRow>
      {thesis === null ? <p style={{ color: '#b3261e', fontSize: 14, marginTop: 12 }}>{t({ bn: 'বিষয়, মত ও অন্তত একটি কারণ লিখুন।', en: 'Enter a topic, a position and at least one reason.' })}</p> : null}
      <p style={noteStyle}>{t({ bn: 'এটি একটি টেমপ্লেট দিয়ে বানানো খসড়া — নিজের ভাষায় সাজিয়ে নিলে ভালো রচনা হয়।', en: 'This is a template-based draft — rewriting it in your own words makes a better essay.' })}</p>
    </section>
  );
}
