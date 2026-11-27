// Eduvelto — Engagement Rate Calculator tool UI.
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Engine: calculateEngagementRate() in src/lib/tools/financeHealthTools.ts. 100% in-browser.
import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, Tiles, CopyButton, ButtonRow, ClearButton, ExampleButton, shortInputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { calculateEngagementRate } from '../../lib/tools/financeHealthTools';

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

export function EngagementRateCalculatorTool() {
  const { t } = useLanguage();
  const [interactions, setInteractions] = useState('500');
  const [base, setBase] = useState('10000');
  const [baseType, setBaseType] = useState<'reach' | 'followers'>('reach');
  const inter = parseNum(interactions);
  const b = parseNum(base);
  const result = useMemo(() => (inter !== null && b !== null ? calculateEngagementRate(inter, b) : null), [inter, b]);
  const loadExample = () => { setInteractions('500'); setBase('10000'); setBaseType('reach'); };
  const clear = () => { setInteractions(''); setBase(''); };

  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="এনগেজমেন্ট রেট ক্যালকুলেটর" titleEn="Engagement Rate Calculator" descBn="পোস্টে লাইক, কমেন্ট ও শেয়ার মিলিয়ে এনগেজমেন্টের হার বের করুন।" descEn="Work out your post's engagement rate from likes, comments and shares." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <div>
          <label style={labelStyle} htmlFor="er-interactions">{t({ bn: 'মোট ইন্টারঅ্যাকশন (লাইক + কমেন্ট + শেয়ার)', en: 'Total interactions (likes + comments + shares)' })}</label>
          <input id="er-interactions" style={shortInputStyle} type="number" min="0" inputMode="numeric" value={interactions} onChange={(e) => setInteractions(e.target.value)} placeholder="500" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="er-base">{t({ bn: baseType === 'reach' ? 'রিচ (কতজন দেখেছে)' : 'ফলোয়ার সংখ্যা', en: baseType === 'reach' ? 'Reach (people who saw it)' : 'Number of followers' })}</label>
          <input id="er-base" style={shortInputStyle} type="number" min="0" inputMode="numeric" value={base} onChange={(e) => setBase(e.target.value)} placeholder="10000" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="er-base-type">{t({ bn: 'হার কিসের ওপর', en: 'Rate based on' })}</label>
          <select id="er-base-type" style={shortInputStyle} value={baseType} onChange={(e) => setBaseType(e.target.value as 'reach' | 'followers')}>
            <option value="reach">{t({ bn: 'রিচ', en: 'Reach' })}</option>
            <option value="followers">{t({ bn: 'ফলোয়ার', en: 'Followers' })}</option>
          </select>
        </div>
      </div>
      {result ? (
        <>
          <div style={resultStyle} role="status">
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{t({ bn: 'এনগেজমেন্ট রেট', en: 'Engagement rate' })}</p>
            <p style={{ margin: 0, fontSize: '2rem', fontFamily: 'var(--font-head)', color: 'var(--teal-deep)' }}>{result.ratePercent.toFixed(2)}%</p>
            <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--muted)' }}>{t({ bn: `সূত্র: এনগেজমেন্ট রেট = ইন্টারঅ্যাকশন ÷ ${baseType === 'reach' ? 'রিচ' : 'ফলোয়ার'} × ১০০`, en: `Formula: engagement rate = interactions ÷ ${baseType} × 100` })}</p>
          </div>
          <Tiles items={[
            { labelBn: 'ইন্টারঅ্যাকশন', labelEn: 'Interactions', value: (inter ?? 0).toLocaleString('en-US') },
            { labelBn: baseType === 'reach' ? 'রিচ' : 'ফলোয়ার', labelEn: baseType === 'reach' ? 'Reach' : 'Followers', value: (b ?? 0).toLocaleString('en-US') },
            { labelBn: 'এনগেজমেন্ট রেট', labelEn: 'Engagement rate', value: `${result.ratePercent.toFixed(2)}%` },
          ]} />
          <ButtonRow>
            <CopyButton text={`Engagement rate ${result.ratePercent.toFixed(2)}% (${inter ?? 0} interactions / ${b ?? 0} ${baseType})`} labelBn="ফলাফল কপি করুন" labelEn="Copy result" />
            <ExampleButton onLoad={loadExample} />
            <ClearButton onClear={clear} />
          </ButtonRow>
        </>
      ) : (
        <p style={errorStyle} role="alert">{t({ bn: 'সঠিক মান দিন — ইন্টারঅ্যাকশন ০ বা তার বেশি, রিচ/ফলোয়ার ০-এর বেশি হতে হবে।', en: 'Enter valid values — interactions 0 or above, reach/followers above 0.' })}</p>
      )}
      <p style={noteStyle}>{t({ bn: 'একই পোস্টের হার রিচের হিসাবে ও ফলোয়ারের হিসাবে আলাদা হয় — তুলনা করার সময় একই পদ্ধতি ব্যবহার করুন।', en: 'The same post gives a different rate by reach than by followers — use the same method when comparing posts.' })}</p>
    </section>
  );
}
