// Eduvelto footer — global navigation + brand (design system v2, stage 2).
// Deep forest navy, ivory text. Links only to routes that exist in this
// branch — /install is the app download + update tab (forced app update,
// 22 Nov 2026).

import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="ev-footer">
      <div className="ev-footer-inner">
        <div>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }} aria-label={t({ bn: 'Eduvelto — হোম', en: 'Eduvelto — Home' })}>
            <img src="/logo-white.png" alt="Eduvelto" style={{ height: 36, width: 'auto', display: 'block' }} />
          </Link>
          <p style={{ margin: '12px 0 0', fontSize: 14, lineHeight: 1.7 }}>
            {t({ bn: 'শেখো, এগিয়ে যাও, স্বপ্ন গড়ো', en: 'Learn, Grow, Achieve.' })}
            <br />
            {t({ bn: 'বাংলাদেশের শিক্ষার্থীদের জন্য বিনামূল্যে ডিজিটাল শিক্ষা।', en: 'Free digital education for the students of Bangladesh.' })}
          </p>
        </div>
        <div>
          <h3>{t({ bn: 'শিখুন', en: 'Learn' })}</h3>
          <Link to="/directory">{t({ bn: 'শিক্ষা নির্দেশিকা', en: 'Directory' })}</Link>
          <Link to="/library">{t({ bn: 'ডিজিটাল লাইব্রেরি', en: 'Library' })}</Link>
          <Link to="/opportunities">{t({ bn: 'সুযোগ হাব', en: 'Opportunity Hub' })}</Link>
          <Link to="/exam">{t({ bn: 'পরীক্ষা', en: 'Exams' })}</Link>
          <Link to="/progress">{t({ bn: 'আমার অগ্রগতি', en: 'My Progress' })}</Link>
        </div>
        <div>
          <h3>{t({ bn: 'প্ল্যাটফর্ম', en: 'Platform' })}</h3>
          <Link to="/about">{t({ bn: 'আমাদের সম্পর্কে', en: 'About' })}</Link>
          <Link to="/why-eduvelto">{t({ bn: 'কেন Eduvelto', en: 'Why Eduvelto' })}</Link>
          <Link to="/privacy">{t({ bn: 'গোপনীয়তা নীতি', en: 'Privacy Policy' })}</Link>
          <Link to="/terms">{t({ bn: 'শর্তাবলী', en: 'Terms' })}</Link>
          <Link to="/contact">{t({ bn: 'যোগাযোগ', en: 'Contact' })}</Link>
          <Link to="/install">{t({ bn: 'অ্যাপ ইনস্টল / আপডেট', en: 'Install / update app' })}</Link>
          <Link to="/health">{t({ bn: 'স্বাস্থ্য', en: 'Health' })}</Link>
          <Link to="/ai-teacher">{t({ bn: 'AI Teacher (পরিকল্পনায় আছে)', en: 'AI Teacher (planned)' })}</Link>
        </div>
      </div>
      <div className="ev-footer-bottom">
        © 2026 Eduvelto — {t({ bn: 'বিনামূল্যে শিক্ষা, সবার জন্য।', en: 'Free education for everyone.' })}
        <br />
        {t({ bn: 'যোগাযোগ', en: 'Contact' })}: ahmmizan23@gmail.com
      </div>
    </footer>
  );
}
