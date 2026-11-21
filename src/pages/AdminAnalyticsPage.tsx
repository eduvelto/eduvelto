// Eduvelto — Admin: Analytics & Reports (mobile mockup screen 5).
//
// HONESTY: the mockup shows 48.2K new users, 320.6K exams, 76.3%
// success rate and a rising User Growth chart — ALL fake. There is no
// time-series tracking and no result data at all. This screen shows
// only real all-time totals (users, exams, books) and honest empty
// states for the growth chart and the top-sections list. Success Rate
// is omitted entirely — there is nothing to average.

import { useEffect, useState } from 'react';
import { getCeoCounts, LAST_VERIFIED_INVENTORY, type CeoCounts } from '../lib/ceo';
import { formatBnNumber } from '../lib/admin';
import { useLanguage } from '../i18n/LanguageContext';
import { EmptyAdminBox, requireDb } from '../components/AdminShared';
import { CeoEmpty, CeoSectionHead, CeoStatTile, CEO_ICON } from '../components/CeoShared';

type Period = '30d' | '3m' | '1y';

export default function AdminAnalyticsPage() {
  const { lang, t } = useLanguage();
  const [period, setPeriod] = useState<Period>('30d');
  const [counts, setCounts] = useState<CeoCounts | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const c = await getCeoCounts(requireDb());
        if (!cancelled) setCounts(c);
      } catch {
        if (!cancelled) setError(t({ bn: 'সংখ্যা লোড করা যায়নি — পরে আবার চেষ্টা করুন।', en: 'Counts could not be loaded — please try again later.' }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const periodLabel =
    period === '30d'
      ? t({ bn: '৩০ দিন', en: 'Last 30 Days' })
      : period === '3m'
        ? t({ bn: '৩ মাস', en: '3 Months' })
        : t({ bn: '১ বছর', en: '1 Year' });

  return (
    <div>
      <h1 className="ev-admin-page-title">{t({ bn: 'বিশ্লেষণ ও রিপোর্ট', en: 'Analytics & Reports' })}</h1>

      <div className="ev-ceo-tabs" role="tablist" aria-label={t({ bn: 'সময়কাল', en: 'Period' })}>
        {(['30d', '3m', '1y'] as Period[]).map((p) => (
          <button
            key={p}
            type="button"
            role="tab"
            aria-selected={period === p}
            className={`ev-ceo-tab${period === p ? ' ev-ceo-tab-active' : ''}`}
            onClick={() => setPeriod(p)}
          >
            {p === '30d' ? t({ bn: '৩০ দিন', en: 'Last 30 Days' }) : p === '3m' ? t({ bn: '৩ মাস', en: '3 Months' }) : t({ bn: '১ বছর', en: '1 Year' })}
          </button>
        ))}
      </div>
      <p className="ev-admin-note">
        {t({
          bn: `সময়ভিত্তিক ভাগ (${periodLabel}) এখনো তৈরি হয়নি — নিচে সব সময়ের আসল মোট দেখানো হচ্ছে। সাফল্যের হার দেখানো হয়নি, কারণ ফলাফলের তথ্য এখনো জমা হয়নি।`,
          en: `A per-period breakdown (${periodLabel}) is not built yet — the real all-time totals are shown below. No success rate is shown, because no result data has been collected yet.`,
        })}
      </p>

      {error ? <p role="alert" style={{ color: '#B00020' }}>{error}</p> : null}
      <div className="ev-ceo-stats">
        <CeoStatTile
          icon={<svg {...CEO_ICON}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20v-1a6.5 6.5 0 0 1 13 0v1" /><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8" /><path d="M17.5 13.6a6.5 6.5 0 0 1 4 5.4v1" /></svg>}
          iconBg="#E3F2F0"
          value={counts?.users === null || counts?.users === undefined ? '—' : lang === 'bn' ? formatBnNumber(counts.users) : String(counts.users)}
          labelBn="মোট ব্যবহারকারী"
          labelEn="Total Users"
          subBn={counts?.users === null ? 'লোড হয়নি (কোটা)' : undefined}
          subEn={counts?.users === null ? 'Not loaded (quota)' : undefined}
        />
        <CeoStatTile
          icon={<svg {...CEO_ICON}><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4.5V3h6v1.5" /><path d="M9 11l2 2 4-4" /></svg>}
          iconBg="#F1EAFB"
          value={counts ? (lang === 'bn' ? formatBnNumber(counts.exams) : String(counts.exams)) : '—'}
          labelBn="মোট পরীক্ষা"
          labelEn="Total Exams"
          subBn={counts && !counts.examsLive ? LAST_VERIFIED_INVENTORY.checkedBn : undefined}
          subEn={counts && !counts.examsLive ? LAST_VERIFIED_INVENTORY.checkedEn : undefined}
        />
        <CeoStatTile
          icon={<svg {...CEO_ICON}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>}
          iconBg="#E7F6E7"
          value={counts ? (lang === 'bn' ? formatBnNumber(counts.books) : String(counts.books)) : '—'}
          labelBn="মোট বই"
          labelEn="Total Books"
          subBn={counts && !counts.booksLive ? LAST_VERIFIED_INVENTORY.checkedBn : undefined}
          subEn={counts && !counts.booksLive ? LAST_VERIFIED_INVENTORY.checkedEn : undefined}
        />
      </div>

      <CeoSectionHead bn="ব্যবহারকারী বৃদ্ধি" en="User Growth" />
      <CeoEmpty
        bn="সময়ের সাথে ব্যবহারকারী বৃদ্ধির তথ্য এখনো জমা হয়নি।"
        en="No user-growth-over-time data has been collected yet."
        nextBn="ব্যবহারকারী বাড়লে এখানে আসল মাসিক সংখ্যা দেখা যাবে।"
        nextEn="Real monthly numbers will appear here as users grow."
      />

      <CeoSectionHead bn="সেরা বিভাগ" en="Top Performing Sections" />
      <EmptyAdminBox
        bn="কোন বিভাগ কত দেখা হয়েছে, তার তথ্য এখনো জমা হয়নি।"
        en="No view data has been collected for any section yet."
        nextBn="দেখার সংখ্যা গোনা শুরু হলে এখানে আসল তালিকা দেখা যাবে।"
        nextEn="The real ranking will appear here once views are tracked."
      />
    </div>
  );
}
