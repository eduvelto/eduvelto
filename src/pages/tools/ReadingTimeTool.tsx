// Eduvelto — Reading Time Calculator tool UI (landed 27 Nov 2026, A-tools).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Engine: countText() in src/lib/tools/textUtils.ts (200 wpm default). 100% in-browser; nothing is uploaded.
import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import {ToolHero, Tiles, ButtonRow, ExampleButton, ClearButton, inputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { countText } from '../../lib/tools/textUtils';

const resultStyle: CSSProperties = {
  marginTop: 14,
  padding: '18px 16px',
  borderRadius: 12,
  background: 'var(--teal-soft)',
  boxShadow: 'var(--shadow-sm)',
};





const EXAMPLE = 'Eduvelto is a free learning platform for Bangladesh. এখানে পড়াশোনা, চাকরির প্রস্তুতি ও দরকারি টুলস — সব এক জায়গায়। প্রতিদিন একটু একটু করে পড়লে বড় লক্ষ্যেও পৌঁছানো যায়। Reading a little every day builds a habit that lasts.';

function fmtTime(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  if (m === 0) return `${sec} sec`;
  return `${m} min ${sec} sec`;
}

export function ReadingTimeTool() {
  const { t } = useLanguage();
  const [input, setInput] = useState(EXAMPLE);
  const [wpm, setWpm] = useState(200);
  const counts = useMemo(() => countText(input), [input]);
  const readingSeconds = counts.words === 0 ? 0 : (counts.words / wpm) * 60;
  const speakingSeconds = counts.words === 0 ? 0 : (counts.words / 140) * 60;
  const pages = counts.words === 0 ? 0 : counts.words / 500;
  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="পড়ার সময় ক্যালকুলেটর" titleEn="Reading Time Calculator" descBn="লেখা পড়তে বা বলতে কত সময় লাগবে তা হিসাব করুন।" descEn="Work out how long a text takes to read or to speak aloud." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div>
        <label style={labelStyle} htmlFor="rt-input">{t({ bn: 'আপনার লেখা', en: 'Your text' })}</label>
        <textarea id="rt-input" style={{ ...inputStyle, minHeight: 140 }} value={input} onChange={(e) => setInput(e.target.value)} placeholder={t({ bn: 'এখানে লিখুন বা পেস্ট করুন…', en: 'Type or paste text here…' })} />
      </div>
      <ButtonRow>
        <ExampleButton onLoad={() => setInput(EXAMPLE)} />
        <ClearButton onClear={() => setInput('')} disabled={input === ''} />
      </ButtonRow>
      <div style={{ marginTop: 14 }}>
        <label style={labelStyle} htmlFor="rt-wpm">{t({ bn: `পড়ার গতি: ${wpm} শব্দ/মিনিট`, en: `Reading speed: ${wpm} words per minute` })}</label>
        <input id="rt-wpm" style={{ width: '100%' }} type="range" min={100} max={400} step={10} value={wpm} onChange={(e) => setWpm(Number(e.target.value))} />
        <ButtonRow>
          <button type="button" style={{ minHeight: 36, padding: '0 12px', borderRadius: 8, border: '1px solid var(--line)', background: wpm === 200 ? 'var(--teal)' : 'var(--surface)', color: wpm === 200 ? '#fff' : 'var(--heading)', cursor: 'pointer' }} onClick={() => setWpm(200)}>{t({ bn: 'ইংরেজি ~২০০', en: 'English ~200' })}</button>
          <button type="button" style={{ minHeight: 36, padding: '0 12px', borderRadius: 8, border: '1px solid var(--line)', background: wpm === 165 ? 'var(--teal)' : 'var(--surface)', color: wpm === 165 ? '#fff' : 'var(--heading)', cursor: 'pointer' }} onClick={() => setWpm(165)}>{t({ bn: 'বাংলা ~১৬৫', en: 'Bangla ~165' })}</button>
          <button type="button" style={{ minHeight: 36, padding: '0 12px', borderRadius: 8, border: '1px solid var(--line)', background: wpm === 140 ? 'var(--teal)' : 'var(--surface)', color: wpm === 140 ? '#fff' : 'var(--heading)', cursor: 'pointer' }} onClick={() => setWpm(140)}>{t({ bn: 'বলা ~১৪০', en: 'Speaking ~140' })}</button>
        </ButtonRow>
      </div>
      {counts.words > 0 ? (
        <>
          <div style={resultStyle} role="status">
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{t({ bn: 'পড়ার সময়', en: 'Reading time' })}</p>
            <p style={{ margin: 0, fontSize: '2rem', fontFamily: 'var(--font-head)', color: 'var(--teal-deep)' }}>{fmtTime(readingSeconds)}</p>
            <p style={{ margin: '8px 0 0', fontSize: 15 }}>{t({ bn: 'বলার সময় (প্রায় ১৪০ শব্দ/মিনিট): ', en: 'Speaking time (about 140 wpm): ' })}{fmtTime(speakingSeconds)}</p>
          </div>
          <Tiles items={[
            { labelBn: 'শব্দ', labelEn: 'Words', value: String(counts.words) },
            { labelBn: 'অক্ষর', labelEn: 'Characters', value: String(counts.characters) },
            { labelBn: 'A4 পাতা (আনুমানিক)', labelEn: 'A4 pages (rough)', value: pages.toFixed(1) },
          ]} />
        </>
      ) : (
        <p style={noteStyle}>{t({ bn: 'পড়ার সময় দেখতে লেখা পেস্ট করুন।', en: 'Paste some text to see the reading time.' })}</p>
      )}
      <p style={noteStyle}>{t({ bn: 'পড়ার গতি ব্যক্তিভেদে বদলায় — বাংলা লেখার জন্য ১৫০–১৮০ শব্দ/মিনিট ধরা হয়েছে, এটি একটি অনুমান। A4 পাতার হিসাব ৫০০ শব্দ = ১ পাতা ধরে, মোটামুটি হিসাব।', en: 'Reading speed varies by person — Bangla is estimated at 150–180 words per minute. The A4 estimate uses 500 words per page and is only rough.' })}</p>
    </section>
  );
}
