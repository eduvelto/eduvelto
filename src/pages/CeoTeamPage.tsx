// Team Management (mockup screen 5).
// HONESTY: the mockup lists 24 team members by name (Sadia Akter,
// Rafiqul Islam, Nusrat Jahan, MD. Rashed) — those people do not
// exist on the platform. The real team is 1 person: the owner. The
// team system lives on an unmerged branch (admin/team-system) and is
// NOT on main, so there is no invite flow and no moderator accounts.
// Tabs show the real counts: Admins = owner only; Teachers = 0
// verified + N pending applications; Moderators = none yet.

import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import { requireDb } from '../components/AdminShared';
import { getCeoCounts, type CeoCounts } from '../lib/ceo';
import { formatBnNumber } from '../lib/admin';
import { useLanguage } from '../i18n/LanguageContext';
import { CeoEmpty, CeoSoonPill } from '../components/CeoShared';

type Tab = 'admins' | 'teachers' | 'moderators';

export default function CeoTeamPage() {
  const { profile } = useAuth();
  const { lang, t } = useLanguage();
  const [tab, setTab] = useState<Tab>('admins');
  const [counts, setCounts] = useState<CeoCounts | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const c = await getCeoCounts(requireDb());
        if (!cancelled) setCounts(c);
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
      <div className="ev-ceo-card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 28 }} aria-hidden="true">👥</span>
        <div>
          <div style={{ fontSize: 14, color: '#68747B' }}>
            {t({ bn: 'মোট টিম সদস্য', en: 'Total Team Members' })}
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#142B3B', lineHeight: 1.1 }}>1</div>
          <div style={{ fontSize: 13, color: '#68747B' }}>
            {t({ bn: 'শুধু মালিক — টিম সিস্টেম এখনো চালু হয়নি', en: 'Owner only — the team system is not live yet' })}
          </div>
        </div>
        <span style={{ marginLeft: 'auto' }}>
          <CeoSoonPill />
        </span>
      </div>

      <div className="ev-ceo-tabs" role="tablist" aria-label={t({ bn: 'টিমের ধরন', en: 'Team type' })} style={{ marginTop: 16 }}>
        {(['admins', 'teachers', 'moderators'] as Tab[]).map((tb) => (
          <button
            key={tb}
            type="button"
            role="tab"
            aria-selected={tab === tb}
            className={`ev-ceo-tab${tab === tb ? ' ev-ceo-tab-active' : ''}`}
            onClick={() => setTab(tb)}
          >
            {tb === 'admins' ? t({ bn: 'অ্যাডমিন', en: 'Admins' }) : tb === 'teachers' ? t({ bn: 'শিক্ষক', en: 'Teachers' }) : t({ bn: 'মডারেটর', en: 'Moderators' })}
          </button>
        ))}
      </div>

      {tab === 'admins' ? (
        <div className="ev-ceo-list" style={{ marginTop: 12 }}>
          <div className="ev-ceo-list-row ev-ceo-list-row-static">
            <img src="/founder-photo.jpg" alt="" className="ev-ceo-avatar" />
            <span className="ev-ceo-list-main">
              <strong>{profile?.displayName || 'Ali Hasan Mohammed Mizan'}</strong>
              <span className="ev-ceo-list-sub">{t({ bn: 'মালিক', en: 'Owner' })}</span>
            </span>
            <span style={{ color: '#12766E', fontWeight: 700, fontSize: 14 }}>
              {t({ bn: '● সক্রিয়', en: '● Active' })}
            </span>
          </div>
        </div>
      ) : tab === 'teachers' ? (
        <div style={{ marginTop: 12 }}>
          <p style={{ margin: '0 0 8px' }}>
            {t({ bn: 'যাচাইকৃত শিক্ষক: ', en: 'Verified teachers: ' })}
            <strong>0</strong>
            {t({ bn: ' · অপেক্ষায়: ', en: ' · Pending: ' })}
            <strong>
              {counts?.pendingVerifications === null || counts?.pendingVerifications === undefined
                ? '—'
                : lang === 'bn'
                  ? formatBnNumber(counts.pendingVerifications)
                  : counts.pendingVerifications}
            </strong>
          </p>
          <CeoEmpty
            bn="এখনো কোনো যাচাইকৃত শিক্ষক নেই।"
            en="No verified teachers yet."
            nextBn="শিক্ষক আবেদন যাচাই করুন অ্যাডমিন পাতা থেকে।"
            nextEn="Verify teacher applications from the Admin page."
          />
        </div>
      ) : (
        <div style={{ marginTop: 12 }}>
          <CeoEmpty
            bn="এখনো কোনো মডারেটর নেই।"
            en="No moderators yet."
            nextBn="টিম সিস্টেম চালু হলে এখানে মডারেটর যোগ করা যাবে।"
            nextEn="Moderators can be added here once the team system goes live."
          />
        </div>
      )}

      <button type="button" className="ev-ceo-primary-btn" disabled style={{ marginTop: 16 }}>
        {t({ bn: '+ সদস্য আমন্ত্রণ জানান', en: '+ Invite Member' })} — {t({ bn: 'শীঘ্রই আসছে', en: 'Coming soon' })}
      </button>
    </div>
  );
}
