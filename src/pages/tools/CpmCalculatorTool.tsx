// Eduvelto — CPM Calculator tool UI.
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Engine: calculateCpm() in src/lib/tools/financeHealthTools.ts. 100% in-browser.
import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, Tiles, CopyButton, ButtonRow, ClearButton, ExampleButton, shortInputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { calculateCpm } from '../../lib/tools/financeHealthTools';

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

export function CpmCalculatorTool() {
  const { t } = useLanguage();
  const [spend, setSpend] = useState('500');
  const [impressions, setImpressions] = useState('100000');
  const s = parseNum(spend);
  const imp = parseNum(impressions);
  const result = useMemo(() => (s !== null && imp !== null ? calculateCpm(s, imp) : null), [s, imp]);
  const loadExample = () => { setSpend('500'); setImpressions('100000'); };
  const clear = () => { setSpend(''); setImpressions(''); };

  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="সিপিএম (CPM) ক্যালকুলেটর" titleEn="CPM Calculator" descBn="বিজ্ঞাপনে ১,০০০ বার দেখানোর খরচ কত পড়ল তা হিসাব করুন।" descEn="Work out the cost of 1,000 ad impressions from your spend." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <div>
          <label style={labelStyle} htmlFor="cpm-spend">{t({ bn: 'মোট খরচ (টাকা)', en: 'Total spend (taka)' })}</label>
          <input id="cpm-spend" style={shortInputStyle} type="number" min="0" inputMode="decimal" value={spend} onChange={(e) => setSpend(e.target.value)} placeholder="500" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="cpm-impressions">{t({ bn: 'ইমপ্রেশন (কতবার দেখা গেছে)', en: 'Impressions (times shown)' })}</label>
          <input id="cpm-impressions" style={shortInputStyle} type="number" min="0" inputMode="numeric" value={impressions} onChange={(e) => setImpressions(e.target.value)} placeholder="100000" />
        </div>
      </div>
      {result ? (
        <>
          <div style={resultStyle} role="status">
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{t({ bn: 'সিপিএম — প্রতি ১,০০০ ইমপ্রেশনে খরচ', en: 'CPM — cost per 1,000 impressions' })}</p>
            <p style={{ margin: 0, fontSize: '2rem', fontFamily: 'var(--font-head)', color: 'var(--teal-deep)' }}>৳{result.cpm.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
            <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--muted)' }}>{t({ bn: `সূত্র: সিপিএম = খরচ ÷ ইমপ্রেশন × ১,০০০`, en: 'Formula: CPM = spend ÷ impressions × 1,000' })}</p>
          </div>
          <Tiles items={[
            { labelBn: 'মোট খরচ', labelEn: 'Total spend', value: `৳${(s ?? 0).toLocaleString('en-US')}` },
            { labelBn: 'ইমপ্রেশন', labelEn: 'Impressions', value: (imp ?? 0).toLocaleString('en-US') },
            { labelBn: 'সিপিএম', labelEn: 'CPM', value: `৳${result.cpm.toLocaleString('en-US', { maximumFractionDigits: 2 })}` },
          ]} />
          <ButtonRow>
            <CopyButton text={`CPM ${result.cpm} taka per 1,000 impressions`} labelBn="ফলাফল কপি করুন" labelEn="Copy result" />
            <ExampleButton onLoad={loadExample} />
            <ClearButton onClear={clear} />
          </ButtonRow>
        </>
      ) : (
        <p style={errorStyle} role="alert">{t({ bn: 'সঠিক মান দিন — খরচ ০ বা তার বেশি, ইমপ্রেশন ০-এর বেশি হতে হবে।', en: 'Enter valid values — spend 0 or above, impressions above 0.' })}</p>
      )}
      <p style={noteStyle}>{t({ bn: 'সিপিএম কম মানেই ভালো বিজ্ঞাপন নয় — ক্লিক, বিক্রি ও লক্ষ্য দর্শকের সঙ্গে মিলিয়েই বিচার করুন।', en: 'A lower CPM is not automatically a better ad — judge it together with clicks, sales and whether the audience is right.' })}</p>
    </section>
  );
}
