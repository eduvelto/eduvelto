// Eduvelto — Admin: Exam Management hub.
//
// The desktop sidebar lists All Exams, Exam Settings and Results &
// Analytics. All Exams links to the real public exam list; the other
// two are honest Coming Soon rows (there is no exam-settings UI and
// no results analytics yet).

import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getCeoCounts, LAST_VERIFIED_INVENTORY, type CeoCounts } from '../lib/ceo';
import { formatBnNumber } from '../lib/admin';
import { useLanguage } from '../i18n/LanguageContext';
import { requireDb } from '../components/AdminShared';

export default function AdminExamsPage() {
  const { lang, t } = useLanguage();
  const [counts, setCounts] = useState<CeoCounts | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const c = await getCeoCounts(requireDb());
        if (!cancelled) setCounts(c);
      } catch {
        // Counts stay hidden; the hub links are intact.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const exams = counts ? (lang === 'bn' ? formatBnNumber(counts.exams) : String(counts.exams)) : '—';

  return (
    <div>
      <h1 className="ev-admin-page-title">{t({ bn: 'পরীক্ষা ব্যবস্থাপনা', en: 'Exam Management' })}</h1>

      <div className="ev-ceo-list">
        <Link to="/exam" className="ev-ceo-list-row">
          <span className="ev-ceo-list-main">
            <strong>{t({ bn: 'সব পরীক্ষা', en: 'All Exams' })}</strong>
            <span className="ev-ceo-list-sub">
              {t({ bn: `${exams}টি পরীক্ষা`, en: `${exams} exams` })}
              {counts && !counts.examsLive ? ` (${lang === 'bn' ? LAST_VERIFIED_INVENTORY.checkedBn : LAST_VERIFIED_INVENTORY.checkedEn})` : ''}
            </span>
          </span>
          <span aria-hidden="true">›</span>
        </Link>
        <div className="ev-ceo-list-row ev-ceo-list-row-static">
          <span className="ev-ceo-list-main">
            <strong>{t({ bn: 'পরীক্ষার সেটিংস', en: 'Exam Settings' })}</strong>
            <span className="ev-ceo-list-sub">
              {t({ bn: 'পরীক্ষার সময়, নম্বর ও নেগেটিভ মার্কিংয়ের সেটিংস এখনো তৈরি হয়নি।', en: 'Settings for exam time, marks and negative marking are not built yet.' })}
            </span>
          </span>
          <span className="ev-ceo-soon">{t({ bn: 'শীঘ্রই আসছে', en: 'Coming soon' })}</span>
        </div>
        <Link to="/admin/analytics" className="ev-ceo-list-row">
          <span className="ev-ceo-list-main">
            <strong>{t({ bn: 'ফলাফল ও বিশ্লেষণ', en: 'Results & Analytics' })}</strong>
            <span className="ev-ceo-list-sub">
              {t({ bn: 'আসল মোট ও খালি অবস্থা দেখুন — ফলাফলের তথ্য এখনো জমা হয়নি।', en: 'See the real totals and honest empty states — no result data has been collected yet.' })}
            </span>
          </span>
          <span aria-hidden="true">›</span>
        </Link>
      </div>
    </div>
  );
}
