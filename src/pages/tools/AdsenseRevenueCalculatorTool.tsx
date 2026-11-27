// Eduvelto — AdSense Revenue Calculator tool UI.
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Engine: calculateAdsenseRevenue() in src/lib/tools/financeHealthTools.ts. 100% in-browser.
import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, Tiles, CopyButton, ButtonRow, ClearButton, ExampleButton, shortInputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { calculateAdsenseRevenue } from '../../lib/tools/financeHealthTools';

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

const fmtMoney = (n: number): string => `$${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;

export function AdsenseRevenueCalculatorTool() {
  const { t } = useLanguage();
  const [pageviews, setPageviews] = useState('50000');
  const [rpm, setRpm] = useState('3');
  const pv = parseNum(pageviews);
  const r = parseNum(rpm);
  const result = useMemo(() => (pv !== null && r !== null ? calculateAdsenseRevenue(pv, r) : null), [pv, r]);
  const loadExample = () => { setPageviews('50000'); setRpm('3'); };
  const clear = () => { setPageviews(''); setRpm(''); };

  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="অ্যাডসেন্স আয় ক্যালকুলেটর" titleEn="AdSense Revenue Calculator" descBn="পেজভিউ ও আরপিএম থেকে অ্যাডসেন্সের আনুমানিক আয় বের করুন।" descEn="Estimate your AdSense earnings from pageviews and RPM." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <div>
          <label style={labelStyle} htmlFor="ad-pageviews">{t({ bn: 'পেজভিউ সংখ্যা', en: 'Number of pageviews' })}</label>
          <input id="ad-pageviews" style={shortInputStyle} type="number" min="0" inputMode="numeric" value={pageviews} onChange={(e) => setPageviews(e.target.value)} placeholder="50000" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="ad-rpm">{t({ bn: 'আরপিএম (প্রতি ১,০০০ পেজভিউতে আয়, ডলার) — আপনি নিজে দিন', en: 'RPM (earnings per 1,000 pageviews, USD) — enter it yourself' })}</label>
          <input id="ad-rpm" style={shortInputStyle} type="number" min="0" step="0.1" inputMode="decimal" value={rpm} onChange={(e) => setRpm(e.target.value)} placeholder="3" />
        </div>
      </div>
      {result ? (
        <>
          <div style={resultStyle} role="status">
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{t({ bn: 'আনুমানিক আয়', en: 'Estimated earnings' })}</p>
            <p style={{ margin: 0, fontSize: '2rem', fontFamily: 'var(--font-head)', color: 'var(--teal-deep)' }}>{fmtMoney(result.estimatedEarnings)}</p>
            <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--muted)' }}>{t({ bn: `সূত্র: আয় = পেজভিউ ÷ ১,০০০ × আরপিএম`, en: 'Formula: earnings = pageviews ÷ 1,000 × RPM' })}</p>
          </div>
          <Tiles items={[
            { labelBn: 'পেজভিউ', labelEn: 'Pageviews', value: (pv ?? 0).toLocaleString('en-US') },
            { labelBn: 'আরপিএম', labelEn: 'RPM', value: `$${r ?? 0}` },
            { labelBn: 'আনুমানিক আয়', labelEn: 'Estimated earnings', value: fmtMoney(result.estimatedEarnings) },
          ]} />
          <ButtonRow>
            <CopyButton text={`Estimated AdSense earnings ${fmtMoney(result.estimatedEarnings)} from ${(pv ?? 0).toLocaleString('en-US')} pageviews at $${r ?? 0} RPM`} labelBn="ফলাফল কপি করুন" labelEn="Copy result" />
            <ExampleButton onLoad={loadExample} />
            <ClearButton onClear={clear} />
          </ButtonRow>
        </>
      ) : (
        <p style={errorStyle} role="alert">{t({ bn: 'সঠিক মান দিন — পেজভিউ ও আরপিএম ০ বা তার বেশি হতে হবে।', en: 'Enter valid values — pageviews and RPM 0 or above.' })}</p>
      )}
      <p style={noteStyle}>{t({ bn: 'এটি শুধু একটি অনুমান — আসল আয় দর্শকের দেশ, বিষয়, মৌসুম ও দেখানো বিজ্ঞাপনের ওপর নির্ভর করে অনেক বদলায়। আরপিএম আপনি নিজে দেবেন; কোনো লাইভ হার ব্যবহার করা হয় না।', en: 'This is only an estimate — real earnings vary a lot by audience country, niche, season and the ads shown. You enter the RPM yourself; no live rate is used.' })}</p>
    </section>
  );
}
