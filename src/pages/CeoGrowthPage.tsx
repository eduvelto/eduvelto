// User & Platform Growth (mockup screen 7).
// HONESTY: the mockup shows 1,280,000 users (+24.5%), a 4-week
// growth bar chart and "Top Regions — Dhaka 34.2%" — all fake. The
// platform has ~3 users and no engagement, retention, time-series or
// geography tracking at all. Users tab shows the real total; the
// Engagement / Retention tabs and the regions panel show honest empty
// states instead of invented curves.

import { useEffect, useState } from 'react';
import { requireDb } from '../components/AdminShared';
import { getCeoCounts, type CeoCounts } from '../lib/ceo';
import { formatBnNumber } from '../lib/admin';
import { useLanguage } from '../i18n/LanguageContext';
import { CeoEmpty, CeoSectionHead, CEO_ICON } from '../components/CeoShared';

type Tab = 'users' | 'engagement' | 'retention';

export default function CeoGrowthPage() {
  const { lang, t } = useLanguage();
  const [tab, setTab] = useState<Tab>('users');
  const [counts, setCounts] = useState<CeoCounts | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const c = await getCeoCounts(requireDb());
        if (!cancelled) setCounts(c);
      } catch {
        // Honest-empty states stay; nothing faked.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <div className="ev-ceo-tabs" role="tablist" aria-label={t({ bn: 'প্রবৃদ্ধির ধরন', en: 'Growth type' })}>
        {(['users', 'engagement', 'retention'] as Tab[]).map((tb) => (
          <button
            key={tb}
            type="button"
            role="tab"
            aria-selected={tab === tb}
            className={`ev-ceo-tab${tab === tb ? ' ev-ceo-tab-active' : ''}`}
            onClick={() => setTab(tb)}
          >
            {tb === 'users' ? t({ bn: 'ব্যবহারকারী', en: 'Users' }) : tb === 'engagement' ? t({ bn: 'অংশগ্রহণ', en: 'Engagement' }) : t({ bn: 'ধরে রাখা', en: 'Retention' })}
          </button>
        ))}
      </div>

      {tab === 'users' ? (
        <div>
          <div className="ev-ceo-card" style={{ textAlign: 'center', padding: '24px 16px', marginTop: 12 }}>
            <span style={{ color: '#12766E' }} aria-hidden="true">
              <svg {...CEO_ICON} width={34} height={34}>
                <circle cx="9" cy="8" r="3.5" />
                <path d="M2.5 20v-1a6.5 6.5 0 0 1 13 0v1" />
                <path d="M16 4.6a3.5 3.5 0 0 1 0 6.8" />
                <path d="M17.5 13.6a6.5 6.5 0 0 1 4 5.4v1" />
              </svg>
            </span>
            <div style={{ fontSize: 36, fontWeight: 800, color: '#142B3B', lineHeight: 1.2 }}>
              {counts?.users === null || counts?.users === undefined
                ? '—'
                : lang === 'bn'
                  ? formatBnNumber(counts.users)
                  : counts.users}
            </div>
            <div style={{ color: '#68747B', fontSize: 14 }}>
              {t({ bn: 'মোট ব্যবহারকারী', en: 'Total Users' })}
              {counts?.users === null
                ? t({ bn: ' — লোড হয়নি (কোটা)', en: ' — not loaded (quota)' })
                : ''}
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <CeoSectionHead bn="ব্যবহারকারী বৃদ্ধির ধারা" en="User Growth Trend" />
            <CeoEmpty
              bn="সাপ্তাহিক বৃদ্ধির তথ্য এখনো জমা হয়নি।"
              en="No weekly growth data has been collected yet."
              nextBn="ব্যবহারকারী বাড়লে এখানে আসল সাপ্তাহিক সংখ্যা দেখা যাবে।"
              nextEn="Real weekly numbers will appear here as users grow."
            />
          </div>
          <div style={{ marginTop: 16 }}>
            <CeoSectionHead bn="শীর্ষ অঞ্চল" en="Top Regions" />
            <CeoEmpty
              bn="অঞ্চলভিত্তিক তথ্য সংগ্রহ করা হয় না।"
              en="No region data is collected."
              nextBn="ব্যবহারকারীর অবস্থান কখনো সংগ্রহ করা হয় না — তাই এই প্যানেল খালি থাকে।"
              nextEn="User locations are never collected — so this panel stays empty."
            />
          </div>
        </div>
      ) : tab === 'engagement' ? (
        <div style={{ marginTop: 12 }}>
          <CeoEmpty
            bn="অংশগ্রহণের তথ্য (সেশন, দেখা, সময়) এখনো মাপা হয় না।"
            en="Engagement (sessions, views, time) is not measured yet."
            nextBn="ব্যবহারের হিসাব চালু হলে এখানে আসল সংখ্যা দেখা যাবে।"
            nextEn="Real numbers will appear here once usage tracking is turned on."
          />
        </div>
      ) : (
        <div style={{ marginTop: 12 }}>
          <CeoEmpty
            bn="ধরে রাখার হার (Retention) এখনো মাপা হয় না।"
            en="Retention is not measured yet."
            nextBn="নিয়মিত ব্যবহারকারীর তথ্য জমা হলে এখানে আসল হার দেখা যাবে।"
            nextEn="The real rate will appear here once returning-user data is collected."
          />
        </div>
      )}
    </div>
  );
}
