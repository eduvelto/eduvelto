// CEO Panel — home (mockup screen 1).
// Founder photo is the owner-approved public asset /founder-photo.jpg;
// the quote is the owner's own tagline from the mockup (aspiration, not
// a metric). No fake numbers on this screen — the four tiles link to
// the real CEO screens.

import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useLanguage } from '../i18n/LanguageContext';

const TILES = [
  { to: '/ceo/dashboard', bn: 'ওভারভিউ ড্যাশবোর্ড', en: 'Overview Dashboard', bg: '#E3F2F0', fg: '#12766E', icon: '▮▮▮' },
  { to: '/ceo/strategy', bn: 'কৌশলগত নিয়ন্ত্রণ', en: 'Strategic Control', bg: '#F1EAFB', fg: '#6B4FA1', icon: '⚙' },
  { to: '/ceo/growth', bn: 'প্রবৃদ্ধি বিশ্লেষণ', en: 'Growth Analytics', bg: '#E7F6E7', fg: '#2E7D32', icon: '↗' },
  { to: '/ceo/revenue', bn: 'আয়ের বিবরণ', en: 'Revenue Overview', bg: '#FBF3E2', fg: '#8A6100', icon: '◉' },
] as const;

export default function CeoHomePage() {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const name = profile?.displayName || 'Ali Hasan Mohammed Mizan';
  return (
    <div>
      <section className="ev-ceo-hero">
        <div className="ev-ceo-hero-badge">{t({ bn: 'সিইও প্যানেল', en: 'CEO Panel' })}</div>
        <img src="/founder-photo.jpg" alt={name} className="ev-ceo-hero-photo" />
        <h1 className="ev-ceo-hero-name">{name}</h1>
        <p className="ev-ceo-hero-role">
          {t({ bn: 'প্রতিষ্ঠাতা ও সিইও', en: 'Founder & CEO' })}
        </p>
        <p className="ev-ceo-hero-quote">
          {t({ bn: '“বাংলাদেশের নং ১ শিক্ষা প্ল্যাটফর্ম গড়ছি”', en: '“Building Bangladesh’s No.1 Education Platform”' })}
        </p>
      </section>

      <div className="ev-ceo-tiles">
        {TILES.map((tile) => (
          <Link key={tile.to} to={tile.to} className="ev-ceo-tile" style={{ background: tile.bg }}>
            <span className="ev-ceo-tile-icon" style={{ color: tile.fg }} aria-hidden="true">
              {tile.icon}
            </span>
            <span className="ev-ceo-tile-label">{t({ bn: tile.bn, en: tile.en })}</span>
          </Link>
        ))}
      </div>

      <p className="ev-ceo-note">
        {t({
          bn: 'এই প্যানেল শুধু মালিকের জন্য — এখানকার সব সংখ্যা আসল তথ্য থেকে আসে, নমুনা সংখ্যা দেখানো হয় না।',
          en: 'This panel is for the owner only — every number here comes from real data; no sample numbers are shown.',
        })}
      </p>
    </div>
  );
}
