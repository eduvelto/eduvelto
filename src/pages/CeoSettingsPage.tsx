// Settings & Management (mockup screen 8).
// Every row links to a REAL page or is honestly marked Coming Soon:
// Platform Settings → feature toggles; Security & Access → audit
// log; System Health → backup page; Help & Support → contact page.
// Financial Management and Update Management have no system behind
// them yet (no payments, no update pipeline) — Coming Soon, never a
// dead button that pretends to work.

import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useLanguage } from '../i18n/LanguageContext';
import { CeoSoonPill } from '../components/CeoShared';

const ROWS = [
  { bn: 'প্ল্যাটফর্ম সেটিংস', en: 'Platform Settings', subBn: '(ফিচার, ভাষা)', subEn: '(Features, Language)', to: '/admin/features' as string | null },
  { bn: 'নিরাপত্তা ও অ্যাক্সেস', en: 'Security & Access', subBn: '(ব্যাকআপ, 2FA, লগ)', subEn: '(Backup, 2FA, Logs)', to: '/admin/audit' },
  { bn: 'আর্থিক ব্যবস্থাপনা', en: 'Financial Management', subBn: '(পেমেন্ট ও সাবস্ক্রিপশন)', subEn: '(Payment & Subscription)', to: null },
  { bn: 'সিস্টেম স্বাস্থ্য', en: 'System Health', subBn: '(সার্ভার, পারফরম্যান্স)', subEn: '(Server, Performance)', to: '/admin/backup' },
  { bn: 'আপডেট ব্যবস্থাপনা', en: 'Update Management', subBn: '(কনটেন্ট ও পরীক্ষার তথ্য)', subEn: '(Content & Exam Data)', to: null },
  { bn: 'সাহায্য ও সহায়তা', en: 'Help & Support', subBn: '(টিম ও যোগাযোগ)', subEn: '(Team & Contacts)', to: '/contact' },
] as const;

export default function CeoSettingsPage() {
  const { profile, signOut } = useAuth();
  const { t } = useLanguage();
  return (
    <div>
      <div className="ev-ceo-card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <img src="/founder-photo.jpg" alt="" className="ev-ceo-avatar" style={{ width: 56, height: 56 }} />
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#142B3B' }}>
            {profile?.displayName || 'Ali Hasan Mohammed Mizan'}
          </div>
          <div style={{ fontSize: 14, color: '#68747B' }}>
            {t({ bn: 'সুপার অ্যাডমিন', en: 'Super Admin' })}
          </div>
        </div>
        <Link to="/profile" className="ev-ceo-mini-btn" style={{ marginLeft: 'auto' }}>
          {t({ bn: 'প্রোফাইল', en: 'Profile' })}
        </Link>
      </div>

      <div className="ev-ceo-list" style={{ marginTop: 16 }}>
        {ROWS.map((row) => {
          const inner = (
            <>
              <span className="ev-ceo-list-main">
                <strong>{t({ bn: row.bn, en: row.en })}</strong>
                <span className="ev-ceo-list-sub">{t({ bn: row.subBn, en: row.subEn })}</span>
              </span>
              {row.to ? <span aria-hidden="true">›</span> : <CeoSoonPill />}
            </>
          );
          return row.to ? (
            <Link key={row.en} to={row.to} className="ev-ceo-list-row">
              {inner}
            </Link>
          ) : (
            <div key={row.en} className="ev-ceo-list-row ev-ceo-list-row-static">
              {inner}
            </div>
          );
        })}
      </div>

      <button
        type="button"
        className="ev-ceo-logout-btn"
        onClick={() => void signOut()}
      >
        {t({ bn: 'লগ আউট', en: 'Logout' })}
      </button>
    </div>
  );
}
