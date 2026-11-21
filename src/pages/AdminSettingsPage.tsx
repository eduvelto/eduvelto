// Eduvelto — Admin: Settings hub (mobile mockup screen 6).
//
// The mockup lists Platform / Content / Notification Settings, User
// Role Management, Backup & Restore, System Logs, About Eduvelto,
// Help & Support. The rows that have a real destination link there;
// the ones with no admin UI yet are honest Coming Soon rows — never
// dead buttons that pretend to open a settings page.

import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useLanguage } from '../i18n/LanguageContext';

const ROWS: Array<{
  to?: string;
  bn: string;
  en: string;
  subBn: string;
  subEn: string;
}> = [
  { bn: 'প্ল্যাটফর্ম সেটিংস', en: 'Platform Settings', subBn: 'ফিচার, ভাষা, UI', subEn: 'Features, UI, Language' },
  { bn: 'কনটেন্ট সেটিংস', en: 'Content Settings', subBn: 'বই, পাঠ, পরীক্ষা', subEn: 'Books, lessons, exams' },
  { bn: 'নোটিফিকেশন সেটিংস', en: 'Notification Settings', subBn: 'বিজ্ঞপ্তি চালু/বন্ধ', subEn: 'Notifications on/off' },
  { to: '/admin/users', bn: 'ব্যবহারকারীর ভূমিকা', en: 'User Role Management', subBn: 'কার কী ভূমিকা', subEn: 'Who has which role' },
  { to: '/admin/backup', bn: 'ব্যাকআপ ও পুনরুদ্ধার', en: 'Backup & Restore', subBn: 'ব্যাকআপ সংরক্ষণ ও যাচাই', subEn: 'Export and verify backups' },
  { to: '/admin/audit', bn: 'সিস্টেম লগ', en: 'System Logs', subBn: 'সব অ্যাডমিন কাজের লগ', subEn: 'Log of all admin actions' },
  { to: '/about', bn: 'Eduvelto সম্পর্কে', en: 'About Eduvelto', subBn: 'প্ল্যাটফর্মের পরিচয়', subEn: 'About the platform' },
  { to: '/contact', bn: 'সাহায্য ও সহায়তা', en: 'Help & Support', subBn: 'টিম ও যোগাযোগ', subEn: 'Team & Contacts' },
];

export default function AdminSettingsPage() {
  const { profile, signOut } = useAuth();
  const { t } = useLanguage();
  const name = profile?.displayName || 'Admin';
  const initial = name.trim().charAt(0) || 'A';

  return (
    <div>
      <h1 className="ev-admin-page-title">{t({ bn: 'সেটিংস', en: 'Settings' })}</h1>

      <div className="ev-ceo-card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span className="ev-admin-avatar ev-admin-avatar-lg" aria-hidden="true">{initial}</span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <strong style={{ display: 'block', fontSize: 17 }}>{name}</strong>
          <span style={{ color: '#68747B', fontSize: 14 }}>{t({ bn: 'সুপার অ্যাডমিন', en: 'Super Admin' })}</span>
        </span>
        <Link to="/profile" className="ev-admin-profile-btn">
          {t({ bn: 'প্রোফাইল', en: 'Profile' })}
        </Link>
      </div>

      <div className="ev-ceo-list" style={{ marginTop: 16 }}>
        {ROWS.map((row) =>
          row.to ? (
            <Link key={row.en} to={row.to} className="ev-ceo-list-row">
              <span className="ev-ceo-list-main">
                <strong>{t({ bn: row.bn, en: row.en })}</strong>
                <span className="ev-ceo-list-sub">{t({ bn: row.subBn, en: row.subEn })}</span>
              </span>
              <span aria-hidden="true">›</span>
            </Link>
          ) : (
            <div key={row.en} className="ev-ceo-list-row ev-ceo-list-row-static">
              <span className="ev-ceo-list-main">
                <strong>{t({ bn: row.bn, en: row.en })}</strong>
                <span className="ev-ceo-list-sub">{t({ bn: row.subBn, en: row.subEn })}</span>
              </span>
              <span className="ev-ceo-soon">{t({ bn: 'শীঘ্রই আসছে', en: 'Coming soon' })}</span>
            </div>
          ),
        )}
      </div>

      <p className="ev-admin-note">
        {t({
          bn: 'প্ল্যাটফর্ম, কনটেন্ট ও নোটিফিকেশন সেটিংসের অ্যাডমিন পাতা এখনো তৈরি হয়নি — ফিচার চালু/বন্ধ করতে /admin/features ব্যবহার করুন।',
          en: 'The admin pages for platform, content and notification settings are not built yet — use /admin/features for feature toggles.',
        })}
      </p>

      <button
        type="button"
        className="ev-admin-logout"
        onClick={() => void signOut()}
      >
        {t({ bn: 'লগ আউট', en: 'Logout' })}
      </button>
    </div>
  );
}
