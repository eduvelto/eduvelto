// CEO Dashboard (mockup screen 2).
// HONESTY: the mockup shows 1.28M users / 8.72M views / 520K tests /
// ৳2.48L revenue / "Platform Rank #1 in Bangladesh" — ALL fake.
// This screen shows only real values: live users count, live-or-
// last-verified books (609) and exams (212), and ৳0 revenue (no
// payments exist). Total Views and Tests Taken have no tracking at
// all, so those tiles are omitted, not faked. The Growth Overview
// chart has no time-series data yet — honest empty state. The rank
// claim is dropped entirely.

import { useEffect, useState } from 'react';
import { requireDb } from '../components/AdminShared';
import { getCeoCounts, LAST_VERIFIED_INVENTORY, type CeoCounts } from '../lib/ceo';
import { formatBnNumber } from '../lib/admin';
import { useLanguage } from '../i18n/LanguageContext';
import { CeoEmpty, CeoSectionHead, CeoStatTile, CEO_ICON } from '../components/CeoShared';

type Period = '30d' | '3m' | '1y';

export default function CeoDashboardPage() {
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
      ? t({ bn: '৩০ দিন', en: '30 Days' })
      : period === '3m'
        ? t({ bn: '৩ মাস', en: '3 Months' })
        : t({ bn: '১ বছর', en: '1 Year' });

  return (
    <div>
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
            {p === '30d' ? t({ bn: '৩০ দিন', en: '30 Days' }) : p === '3m' ? t({ bn: '৩ মাস', en: '3 Months' }) : t({ bn: '১ বছর', en: '1 Year' })}
          </button>
        ))}
      </div>
      <p className="ev-ceo-note">
        {t({
          bn: `সময়ভিত্তিক ভাগ (${periodLabel}) এখনো তৈরি হয়নি — নিচে সব সময়ের আসল মোট দেখানো হচ্ছে।`,
          en: `A per-period breakdown (${periodLabel}) is not built yet — the real all-time totals are shown below.`,
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
          icon={<svg {...CEO_ICON}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>}
          iconBg="#E7F6E7"
          value={counts ? (lang === 'bn' ? formatBnNumber(counts.books) : String(counts.books)) : '—'}
          labelBn="মোট বই"
          labelEn="Total Books"
          subBn={counts && !counts.booksLive ? LAST_VERIFIED_INVENTORY.checkedBn : undefined}
          subEn={counts && !counts.booksLive ? LAST_VERIFIED_INVENTORY.checkedEn : undefined}
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
          icon={<svg {...CEO_ICON}><circle cx="12" cy="12" r="9" /><path d="M12 7v10M15.5 9.5c-.8-1-2-1.5-3.5-1.5-2 0-3.5 1-3.5 2.5 0 3.5 7 1.5 7 5 0 1.5-1.5 2.5-3.5 2.5-1.5 0-2.7-.5-3.5-1.5" /></svg>}
          iconBg="#FBF3E2"
          value={lang === 'bn' ? '৳০' : '৳0'}
          labelBn="মোট আয়"
          labelEn="Total Revenue"
          subBn="এখনো কোনো আয় নেই — সব সেবা ফ্রি"
          subEn="No revenue yet — all services are free"
        />
      </div>

      <CeoSectionHead bn="প্রবৃদ্ধির চিত্র" en="Growth Overview" />
      <CeoEmpty
        bn="সময়ের সাথে প্রবৃদ্ধির তথ্য এখনো জমা হয়নি।"
        en="No growth-over-time data has been collected yet."
        nextBn="ব্যবহারকারী বাড়লে এখানে আসল মাসিক সংখ্যা দেখা যাবে।"
        nextEn="Real monthly numbers will appear here as users grow."
      />

      <div style={{ marginTop: 16 }} className="ev-ceo-card">
        <strong>
          {t({ bn: 'Eduvelto — সবার জন্য ফ্রি শিক্ষা প্ল্যাটফর্ম', en: 'Eduvelto — a free education platform for everyone' })}
        </strong>
        <p style={{ margin: '8px 0 0', color: '#68747B', fontSize: 14 }}>
          {t({
            bn: `বই ${counts ? (lang === 'bn' ? formatBnNumber(counts.books) : counts.books) : '—'}টি · পরীক্ষা ${counts ? (lang === 'bn' ? formatBnNumber(counts.exams) : counts.exams) : '—'}টি · প্রশ্ন ${lang === 'bn' ? formatBnNumber(LAST_VERIFIED_INVENTORY.questions) : LAST_VERIFIED_INVENTORY.questions}টি (${lang === 'bn' ? LAST_VERIFIED_INVENTORY.checkedBn : LAST_VERIFIED_INVENTORY.checkedEn})`,
            en: `Books ${counts ? counts.books : '—'} · Exams ${counts ? counts.exams : '—'} · Questions ${LAST_VERIFIED_INVENTORY.questions} (${LAST_VERIFIED_INVENTORY.checkedEn})`,
          })}
        </p>
      </div>
    </div>
  );
}
