// Eduvelto — Love Compatibility Calculator tool UI (fun only).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Engine: calculateLoveCompatibility() in src/lib/tools/financeHealthTools.ts. 100% in-browser.
import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, Tiles, CopyButton, ButtonRow, ClearButton, ExampleButton, shortInputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { calculateLoveCompatibility } from '../../lib/tools/financeHealthTools';

const resultStyle: CSSProperties = {
  marginTop: 14,
  padding: '18px 16px',
  borderRadius: 12,
  background: 'var(--teal-soft)',
  boxShadow: 'var(--shadow-sm)',
};

const errorStyle: CSSProperties = {
  marginTop: 14,
  color: '#b3261e',
  fontSize: 14,
};

export function LoveCompatibilityCalculatorTool() {
  const { t } = useLanguage();
  const [name1, setName1] = useState('রহিম');
  const [name2, setName2] = useState('করিম');
  const result = useMemo(() => calculateLoveCompatibility(name1, name2), [name1, name2]);
  const loadExample = () => { setName1('রহিম'); setName2('করিম'); };
  const clear = () => { setName1(''); setName2(''); };
  const bandText = result
    ? result.band === 'excellent'
      ? t({ bn: 'দারুণ মিল!', en: 'A wonderful match!' })
      : result.band === 'good'
        ? t({ bn: 'ভালো মিল!', en: 'A good match!' })
        : result.band === 'average'
          ? t({ bn: 'মোটামুটি মিল', en: 'An average match' })
          : t({ bn: 'বন্ধুত্বের মিল', en: 'A friendship match' })
    : '';

  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="ভালোবাসার মিল ক্যালকুলেটর" titleEn="Love Compatibility Calculator" descBn="দুটি নাম থেকে মজার মিলের শতাংশ দেখুন — শুধু বিনোদনের জন্য।" descEn="See a fun compatibility percentage from two names — for entertainment only." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <div>
          <label style={labelStyle} htmlFor="love-name1">{t({ bn: 'প্রথম নাম', en: 'First name' })}</label>
          <input id="love-name1" style={shortInputStyle} type="text" value={name1} onChange={(e) => setName1(e.target.value)} placeholder="রহিম" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="love-name2">{t({ bn: 'দ্বিতীয় নাম', en: 'Second name' })}</label>
          <input id="love-name2" style={shortInputStyle} type="text" value={name2} onChange={(e) => setName2(e.target.value)} placeholder="করিম" />
        </div>
      </div>
      {result ? (
        <>
          <div style={resultStyle} role="status">
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{t({ bn: 'মিলের শতাংশ (মজার হিসাব)', en: 'Compatibility % (just for fun)' })}</p>
            <p style={{ margin: 0, fontSize: '2rem', fontFamily: 'var(--font-head)', color: 'var(--teal-deep)' }}>{result.percent}%</p>
            <p style={{ margin: '8px 0 0', fontSize: 15 }}>{bandText}</p>
          </div>
          <Tiles items={[
            { labelBn: 'প্রথম নাম', labelEn: 'First name', value: name1.trim() },
            { labelBn: 'দ্বিতীয় নাম', labelEn: 'Second name', value: name2.trim() },
            { labelBn: 'মিল', labelEn: 'Match', value: `${result.percent}%` },
          ]} />
          <ButtonRow>
            <CopyButton text={`${name1.trim()} + ${name2.trim()} = ${result.percent}% compatibility (just for fun)`} labelBn="ফলাফল কপি করুন" labelEn="Copy result" />
            <ExampleButton onLoad={loadExample} />
            <ClearButton onClear={clear} />
          </ButtonRow>
        </>
      ) : (
        <p style={errorStyle} role="alert">{t({ bn: 'দুটি নামই লিখুন।', en: 'Please enter both names.' })}</p>
      )}
      <p style={noteStyle}>{t({ bn: 'শুধু বিনোদনের জন্য — নাম থেকে আসল সম্পর্কের কিছুই বোঝা যায় না। একই দুটি নাম দিলে সবসময় একই ফল আসে।', en: 'Entertainment only — names say nothing real about a relationship. The same two names always give the same result.' })}</p>
    </section>
  );
}
