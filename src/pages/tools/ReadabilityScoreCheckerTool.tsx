// Eduvelto — Readability Score Checker tool UI (Text batch, 27 Nov 2026).
// Flesch Reading Ease + Flesch-Kincaid grade. Renders inside
// ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Pure logic lives in src/lib/tools/textTools.ts.
// All processing is 100% in-browser; nothing is uploaded.
import { useMemo, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, Tiles, ButtonRow, ClearButton, ExampleButton, inputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { readabilityScore } from '../../lib/tools/textTools';

const EXAMPLE = 'The cat sat on the mat. The dog ran to the park. The sun was warm and bright. The children played all day long.';

export function ReadabilityScoreCheckerTool() {
  const { t } = useLanguage();
  const [text, setText] = useState(EXAMPLE);
  const result = useMemo(() => readabilityScore(text), [text]);
  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="পঠনযোগ্যতা স্কোর পরীক্ষক" titleEn="Readability Score Checker" descBn="লেখা পড়তে কতটা সহজ তা Flesch স্কোর দিয়ে মাপুন।" descEn="Measure how easy your text is to read with a Flesch score." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div>
        <label style={labelStyle} htmlFor="read-text">{t({ bn: 'আপনার লেখা (ইংরেজি)', en: 'Your text (English)' })}</label>
        <textarea id="read-text" style={inputStyle} value={text} onChange={(e) => setText(e.target.value)} placeholder={EXAMPLE} />
      </div>
      <ButtonRow>
        <ExampleButton onLoad={() => setText(EXAMPLE)} />
        <ClearButton onClear={() => setText('')} disabled={text === ''} />
      </ButtonRow>
      {result ? (
        <Tiles items={[
          { labelBn: 'Flesch Reading Ease', labelEn: 'Flesch Reading Ease', value: String(result.fleschReadingEase) },
          { labelBn: 'স্তর', labelEn: 'Level', value: result.level },
          { labelBn: 'Flesch-Kincaid গ্রেড', labelEn: 'Flesch-Kincaid grade', value: String(result.fleschKincaidGrade) },
          { labelBn: 'শব্দ', labelEn: 'Words', value: String(result.words) },
          { labelBn: 'বাক্য', labelEn: 'Sentences', value: String(result.sentences) },
          { labelBn: 'সিলেবল', labelEn: 'Syllables', value: String(result.syllables) },
        ]} />
      ) : (
        <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 14 }}>{t({ bn: 'স্কোর পেতে অন্তত ১০টি শব্দের লেখা দিন।', en: 'Enter at least 10 words of text to get a score.' })}</p>
      )}
      <p style={noteStyle}>{t({ bn: 'Flesch সূত্র ইংরেজি লেখার জন্য তৈরি — বাংলা লেখায় এর স্কোর ঠিক নয়। ৯০–১০০ মানে খুব সহজ, ০–৩০ মানে খুব কঠিন।', en: 'The Flesch formulas are calibrated for English text — they are not accurate for Bangla. 90–100 means very easy, 0–30 means very difficult.' })}</p>
    </section>
  );
}
