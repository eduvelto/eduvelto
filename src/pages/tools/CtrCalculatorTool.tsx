// Eduvelto — CTR Calculator tool UI.
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Engine: calculateCtr() in src/lib/tools/financeHealthTools.ts. 100% in-browser.
import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, Tiles, CopyButton, ButtonRow, ClearButton, ExampleButton, shortInputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { calculateCtr } from '../../lib/tools/financeHealthTools';

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

function parseNum(s: string): number | null {
  if (s.trim() === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function CtrCalculatorTool() {
  const { t } = useLanguage();
  const [clicks, setClicks] = useState('250');
  const [impressions, setImpressions] = useState('10000');
  const c = parseNum(clicks);
  const imp = parseNum(impressions);
  const result = useMemo(() => (c !== null && imp !== null ? calculateCtr(c, imp) : null), [c, imp]);
  const loadExample = () => { setClicks('250'); setImpressions('10000'); };
  const clear = () => { setClicks(''); setImpressions(''); };

  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="সিটিআর (CTR) ক্যালকুলেটর" titleEn="CTR Calculator" descBn="বিজ্ঞাপন বা পোস্ট কতজন দেখে কতজন ক্লিক করল, শতকরা হারে দেখুন।" descEn="See what percentage of people who saw your ad or post clicked on it." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <div>
          <label style={labelStyle} htmlFor="ctr-clicks">{t({ bn: 'ক্লিকের সংখ্যা', en: 'Number of clicks' })}</label>
          <input id="ctr-clicks" style={shortInputStyle} type="number" min="0" inputMode="numeric" value={clicks} onChange={(e) => setClicks(e.target.value)} placeholder="250" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="ctr-impressions">{t({ bn: 'ইমপ্রেশন (কতবার দেখা গেছে)', en: 'Impressions (times shown)' })}</label>
          <input id="ctr-impressions" style={shortInputStyle} type="number" min="0" inputMode="numeric" value={impressions} onChange={(e) => setImpressions(e.target.value)} placeholder="10000" />
        </div>
      </div>
      {result ? (
        <>
          <div style={resultStyle} role="status">
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{t({ bn: 'ক্লিক-থ্রু রেট (CTR)', en: 'Click-through rate (CTR)' })}</p>
            <p style={{ margin: 0, fontSize: '2rem', fontFamily: 'var(--font-head)', color: 'var(--teal-deep)' }}>{result.ctrPercent.toFixed(2)}%</p>
            <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--muted)' }}>{t({ bn: `সূত্র: সিটিআর = ক্লিক ÷ ইমপ্রেশন × ১০০`, en: 'Formula: CTR = clicks ÷ impressions × 100' })}</p>
          </div>
          <Tiles items={[
            { labelBn: 'ক্লিক', labelEn: 'Clicks', value: (c ?? 0).toLocaleString('en-US') },
            { labelBn: 'ইমপ্রেশন', labelEn: 'Impressions', value: (imp ?? 0).toLocaleString('en-US') },
            { labelBn: 'সিটিআর', labelEn: 'CTR', value: `${result.ctrPercent.toFixed(2)}%` },
          ]} />
          <ButtonRow>
            <CopyButton text={`CTR ${result.ctrPercent.toFixed(2)}% (${c ?? 0} clicks / ${imp ?? 0} impressions)`} labelBn="ফলাফল কপি করুন" labelEn="Copy result" />
            <ExampleButton onLoad={loadExample} />
            <ClearButton onClear={clear} />
          </ButtonRow>
        </>
      ) : (
        <p style={errorStyle} role="alert">{t({ bn: 'সঠিক মান দিন — ক্লিক ইমপ্রেশনের বেশি হতে পারবে না, ইমপ্রেশন ০-এর বেশি হতে হবে।', en: 'Enter valid values — clicks cannot exceed impressions, impressions must be above 0.' })}</p>
      )}
      <p style={noteStyle}>{t({ bn: 'সিটিআর বেশি মানে বিজ্ঞাপন বা থাম্বনেইল মানুষের নজর কাড়ছে — তবে ক্লিকের পর কী হলো (বিক্রি, সাইন-আপ) সেটাও দেখুন।', en: 'A higher CTR means the ad or thumbnail is catching attention — but also check what happened after the click (sales, sign-ups).' })}</p>
    </section>
  );
}
