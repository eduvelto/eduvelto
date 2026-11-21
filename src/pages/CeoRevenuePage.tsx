// Revenue Overview (mockup screen 4).
// HONESTY: the mockup shows ৳2,48,500 total revenue (+41.3%) and a
// Revenue-by-Source donut (Premium Courses 52.3%, Mock Tests 28.7%,
// Ads 12.5%, Others 6.5%) — ALL fake. Eduvelto has no paid products,
// no payments and no ads revenue: total revenue is ৳0, and there is
// no source breakdown to draw. Both panels show that honestly.

import { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { CeoEmpty, CeoSectionHead } from '../components/CeoShared';

type Period = '7d' | '30d' | '90d' | '1y';

export default function CeoRevenuePage() {
  const { lang, t } = useLanguage();
  const [period, setPeriod] = useState<Period>('30d');
  const periodLabel =
    period === '7d'
      ? t({ bn: '৭ দিন', en: '7 Days' })
      : period === '30d'
        ? t({ bn: '৩০ দিন', en: '30 Days' })
        : period === '90d'
          ? t({ bn: '৯০ দিন', en: '90 Days' })
          : t({ bn: '১ বছর', en: '1 Year' });
  return (
    <div>
      <div className="ev-ceo-tabs" role="tablist" aria-label={t({ bn: 'সময়কাল', en: 'Period' })}>
        {(['7d', '30d', '90d', '1y'] as Period[]).map((p) => (
          <button
            key={p}
            type="button"
            role="tab"
            aria-selected={period === p}
            className={`ev-ceo-tab${period === p ? ' ev-ceo-tab-active' : ''}`}
            onClick={() => setPeriod(p)}
          >
            {p === '7d' ? t({ bn: '৭ দিন', en: '7 Days' }) : p === '30d' ? t({ bn: '৩০ দিন', en: '30 Days' }) : p === '90d' ? t({ bn: '৯০ দিন', en: '90 Days' }) : t({ bn: '১ বছর', en: '1 Year' })}
          </button>
        ))}
      </div>
      <p className="ev-ceo-note">
        {t({
          bn: `সময়কাল: ${periodLabel} — আয়ের হিসাব সব সময়ের মোট।`,
          en: `Period: ${periodLabel} — revenue is the all-time total.`,
        })}
      </p>

      <div className="ev-ceo-card" style={{ textAlign: 'center', padding: '24px 16px' }}>
        <div style={{ color: '#68747B', fontSize: 14 }}>
          {t({ bn: 'মোট আয়', en: 'Total Revenue' })}
        </div>
        <div style={{ fontSize: 36, fontWeight: 800, color: '#142B3B', lineHeight: 1.2 }}>
          {lang === 'bn' ? '৳০' : '৳0'}
        </div>
        <p style={{ margin: '8px 0 0', color: '#68747B', fontSize: 14 }}>
          {t({
            bn: 'এখনো কোনো আয় নেই — Eduvelto-র সব সেবা ফ্রি, কোনো পেইড কোর্স বা বিজ্ঞাপন আয় চালু হয়নি।',
            en: 'No revenue yet — all Eduvelto services are free; no paid courses or ad revenue are live.',
          })}
        </p>
      </div>

      <div style={{ marginTop: 16 }}>
        <CeoSectionHead bn="আয়ের উৎস" en="Revenue by Source" />
        <CeoEmpty
          bn="আয়ের কোনো উৎস এখনো চালু হয়নি।"
          en="No revenue source is live yet."
          nextBn="পেইড স্কুল অ্যাকাউন্ট বা বিজ্ঞাপন চালু হলে এখানে আসল ভাগ দেখা যাবে।"
          nextEn="Once paid school accounts or ads go live, the real breakdown will appear here."
        />
      </div>
    </div>
  );
}
