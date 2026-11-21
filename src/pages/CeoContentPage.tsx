// Content & Quality (mockup screen 6).
// HONESTY: the mockup shows Pending Content 48, Verified Content
// 12,842, Reported Issues 7, Copyright Alerts 2 — all fake. Real
// tiles: pending teacher applications (live), verified content =
// Published books + exams (live or last-verified), questions
// (last-verified). There is no report / copyright-alert system, so
// those tiles are omitted with a note instead of showing 0 as if a
// system existed. Recent Activities are the REAL audit-log entries.

import { useEffect, useState } from 'react';
import { requireDb } from '../components/AdminShared';
import { getCeoCounts, LAST_VERIFIED_INVENTORY, type CeoCounts } from '../lib/ceo';
import { auditActionLabel, formatBnNumber, formatTime, listAdminActions, type AuditRow } from '../lib/admin';
import { useLanguage } from '../i18n/LanguageContext';
import { CeoEmpty, CeoSectionHead, CeoStatTile, CEO_ICON } from '../components/CeoShared';

export default function CeoContentPage() {
  const { lang, t } = useLanguage();
  const [counts, setCounts] = useState<CeoCounts | null>(null);
  const [activities, setActivities] = useState<AuditRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [c, a] = await Promise.all([
          getCeoCounts(requireDb()),
          listAdminActions(requireDb()),
        ]);
        if (cancelled) return;
        setCounts(c);
        setActivities(a.slice(0, 5));
      } catch {
        // Tiles stay honest-empty; nothing faked.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <div className="ev-ceo-stats">
        <CeoStatTile
          icon={<svg {...CEO_ICON}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M9 13h6M9 17h6" /></svg>}
          iconBg="#FBF3E2"
          value={counts?.pendingVerifications === null || counts?.pendingVerifications === undefined ? '—' : lang === 'bn' ? formatBnNumber(counts.pendingVerifications) : String(counts.pendingVerifications)}
          labelBn="অপেক্ষায় থাকা আবেদন"
          labelEn="Pending Applications"
          subBn="শিক্ষক যাচাই"
          subEn="Teacher verification"
        />
        <CeoStatTile
          icon={<svg {...CEO_ICON}><path d="M20 6L9 17l-5-5" /></svg>}
          iconBg="#E7F6E7"
          value={counts ? (lang === 'bn' ? formatBnNumber(counts.books + counts.exams) : String(counts.books + counts.exams)) : '—'}
          labelBn="যাচাইকৃত কনটেন্ট"
          labelEn="Verified Content"
          subBn={counts && (!counts.booksLive || !counts.examsLive) ? LAST_VERIFIED_INVENTORY.checkedBn : t({ bn: 'বই + পরীক্ষা', en: 'Books + exams' })}
          subEn={counts && (!counts.booksLive || !counts.examsLive) ? LAST_VERIFIED_INVENTORY.checkedEn : t({ bn: 'বই + পরীক্ষা', en: 'Books + exams' })}
        />
        <CeoStatTile
          icon={<svg {...CEO_ICON}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>}
          iconBg="#E3F2F0"
          value={lang === 'bn' ? formatBnNumber(LAST_VERIFIED_INVENTORY.questions) : String(LAST_VERIFIED_INVENTORY.questions)}
          labelBn="মোট প্রশ্ন"
          labelEn="Total Questions"
          subBn={LAST_VERIFIED_INVENTORY.checkedBn}
          subEn={LAST_VERIFIED_INVENTORY.checkedEn}
        />
      </div>
      <p className="ev-ceo-note">
        {t({
          bn: 'রিপোর্ট ও কপিরাইট-সতর্কতা ব্যবস্থা এখনো তৈরি হয়নি — তাই সেই সংখ্যা এখানে দেখানো হয় না।',
          en: 'The report and copyright-alert system is not built yet — so those numbers are not shown here.',
        })}
      </p>

      <CeoSectionHead bn="সাম্প্রতিক কাজ" en="Recent Activities" />
      {activities.length === 0 ? (
        <CeoEmpty
          bn="এখনো কোনো অ্যাডমিন কাজের লগ নেই।"
          en="No admin activity logged yet."
          nextBn="অ্যাডমিন কাজ করলে এখানে আসল লগ দেখা যাবে।"
          nextEn="Real log entries will appear here once admin work happens."
        />
      ) : (
        <div className="ev-ceo-list">
          {activities.map((row) => {
            const label = auditActionLabel(row.action);
            return (
              <div key={row.id} className="ev-ceo-list-row ev-ceo-list-row-static">
                <span className="ev-ceo-list-main">
                  <strong>{lang === 'bn' ? label.bn : label.en}</strong>
                  {row.details ? <span className="ev-ceo-list-sub">{row.details}</span> : null}
                </span>
                <span className="ev-ceo-list-status">{formatTime(row.createdAt, lang)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
