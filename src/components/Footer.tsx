// Eduvelto footer — global navigation + brand (design system v2, stage 2).
// Deep forest navy, ivory text. Links only to routes that exist in this
// branch — /install is the app download + update tab (forced app update,
// 22 Nov 2026).
//
// Homepage redesign (24 Nov 2026): newsletter signup + social links.
// Newsletter: a REAL store — the address is written to the
// `newsletterSubscribers` Firestore collection (rules: public create
// with a validated email, owner/admin read only). The form says the
// address is kept for Eduvelto updates; no email-sending exists yet,
// so it never promises an immediate email.
// Social links: ONLY the three verified Organization profiles from
// seo.ts sameAs (Facebook EduveltoBD, YouTube @EduveltoBD, LinkedIn
// company/eduvelto). Telegram/WhatsApp official accounts are
// UNVERIFIED — no icons for them.

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { isValidNewsletterEmail, subscribeNewsletter } from '../lib/newsletter';
import './home-redesign.css';

function FacebookIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M13.5 21v-7h2.4l.4-3h-2.8V9.1c0-.9.3-1.5 1.6-1.5h1.3V4.9c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8V11H8v3h2.5v7h3z" />
    </svg>
  );
}
function YoutubeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8c1.6.4 7.8.4 7.8.4s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15V9l5.2 3L10 15z" />
    </svg>
  );
}
function LinkedinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M6.9 8.6H3.6V21h3.3V8.6zM5.2 3.5a1.9 1.9 0 1 0 0 3.9 1.9 1.9 0 0 0 0-3.9zM20.4 13.6c0-3.2-1.7-4.7-4-4.7-1.8 0-2.6 1-3.1 1.7V8.6h-3.3V21h3.3v-6.5c0-1.5.7-2.4 2-2.4 1.2 0 1.8.8 1.8 2.4V21h3.3v-7.4z" />
    </svg>
  );
}

function NewsletterForm() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidNewsletterEmail(email)) {
      setError(t({ bn: 'সঠিক ইমেইল ঠিকানা লিখুন।', en: 'Please enter a valid email address.' }));
      setStatus('error');
      return;
    }
    setStatus('sending');
    setError('');
    const res = await subscribeNewsletter(email);
    if (res.ok) {
      setStatus('sent');
      setEmail('');
    } else {
      setError(t({ bn: 'সাবস্ক্রাইব করা যায়নি — পরে আবার চেষ্টা করুন।', en: 'Could not subscribe — please try again later.' }));
      setStatus('error');
    }
  }

  if (status === 'sent') {
    return (
      <p className="ev-news-ok" role="status">
        {t({ bn: 'ধন্যবাদ! আপনার ইমেইল সংরক্ষণ করা হয়েছে।', en: 'Thank you! Your email has been saved.' })}
      </p>
    );
  }
  return (
    <div>
      {/* noValidate: native type=email validation would block submit
          before our own validation message can show. */}
      <form className="ev-news-form" onSubmit={submit} noValidate>
        <label htmlFor="ev-news-email" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
          {t({ bn: 'ইমেইল ঠিকানা', en: 'Email address' })}
        </label>
        <input
          id="ev-news-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t({ bn: 'আপনার ইমেইল লিখুন…', en: 'Your email address…' })}
          autoComplete="email"
          disabled={status === 'sending'}
        />
        <button type="submit" disabled={status === 'sending'}>
          {t({ bn: 'সাবস্ক্রাইব', en: 'Subscribe' })}
        </button>
      </form>
      {status === 'error' && error ? (
        <p className="ev-news-err" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

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
          {/* Social — verified Organization profiles only (seo.ts sameAs). */}
          <div className="ev-footer-socials">
            <a href="https://www.facebook.com/EduveltoBD" target="_blank" rel="noreferrer" aria-label="Eduvelto on Facebook">
              <FacebookIcon />
            </a>
            <a href="https://www.youtube.com/@EduveltoBD" target="_blank" rel="noreferrer" aria-label="Eduvelto on YouTube">
              <YoutubeIcon />
            </a>
            <a href="https://www.linkedin.com/company/eduvelto" target="_blank" rel="noreferrer" aria-label="Eduvelto on LinkedIn">
              <LinkedinIcon />
            </a>
          </div>
        </div>
        <div>
          <h2>{t({ bn: 'শিখুন', en: 'Learn' })}</h2>
          <Link to="/directory">{t({ bn: 'শিক্ষা নির্দেশিকা', en: 'Directory' })}</Link>
          <Link to="/library">{t({ bn: 'ডিজিটাল লাইব্রেরি', en: 'Library' })}</Link>
          <Link to="/admissions">{t({ bn: 'ভর্তি প্রস্তুতি', en: 'Admission Preparation' })}</Link>
          <Link to="/opportunities">{t({ bn: 'সুযোগ হাব', en: 'Opportunity Hub' })}</Link>
          <Link to="/exam">{t({ bn: 'পরীক্ষা', en: 'Exams' })}</Link>
          <Link to="/progress">{t({ bn: 'আমার অগ্রগতি', en: 'My Progress' })}</Link>
        </div>
        <div>
          <h2>{t({ bn: 'প্ল্যাটফর্ম', en: 'Platform' })}</h2>
          <Link to="/about">{t({ bn: 'আমাদের সম্পর্কে', en: 'About' })}</Link>
          <Link to="/why-eduvelto">{t({ bn: 'কেন Eduvelto', en: 'Why Eduvelto' })}</Link>
          <Link to="/privacy">{t({ bn: 'গোপনীয়তা নীতি', en: 'Privacy Policy' })}</Link>
          <Link to="/terms">{t({ bn: 'শর্তাবলী', en: 'Terms' })}</Link>
          <Link to="/editorial-policy">{t({ bn: 'সম্পাদকীয় নীতি', en: 'Editorial Policy' })}</Link>
          <Link to="/content-accuracy">{t({ bn: 'বিষয়বস্তুর নির্ভুলতা', en: 'Content Accuracy' })}</Link>
          <Link to="/certificate-policy">{t({ bn: 'সার্টিফিকেট নীতি', en: 'Certificate Policy' })}</Link>
          <Link to="/disclaimer">{t({ bn: 'দায়বর্জন', en: 'Disclaimer' })}</Link>
          <Link to="/contact">{t({ bn: 'যোগাযোগ', en: 'Contact' })}</Link>
          <Link to="/install">{t({ bn: 'অ্যাপ ইনস্টল / আপডেট', en: 'Install / update app' })}</Link>
          <Link to="/health">{t({ bn: 'স্বাস্থ্য', en: 'Health' })}</Link>
          <Link to="/life">{t({ bn: 'জীবন সেবা', en: 'Life Services' })}</Link>
          <Link to="/ai-teacher">{t({ bn: 'AI Teacher (পরিকল্পনায় আছে)', en: 'AI Teacher (planned)' })}</Link>
          <Link to="/ai-assistant">{t({ bn: 'AI সহায়ক', en: 'AI Assistant' })}</Link>
        </div>
        <div>
          <h2>{t({ bn: 'আপডেট পান', en: 'Get Updates' })}</h2>
          <p style={{ margin: '0 0 4px', fontSize: 14, lineHeight: 1.7 }}>
            {t({ bn: 'নতুন সুযোগ ও আপডেটের খবর ইমেইলে পেতে সাবস্ক্রাইব করুন।', en: 'Subscribe to get news of new opportunities and updates by email.' })}
          </p>
          <NewsletterForm />
          <p className="ev-news-note">
            {t({ bn: 'আপনার ইমেইল শুধু Eduvelto-র আপডেটের জন্য সংরক্ষণ করা হয়; কারো সাথে শেয়ার করা হয় না।', en: 'Your email is stored only for Eduvelto updates; it is never shared with anyone.' })}
          </p>
        </div>
      </div>
      <div className="ev-footer-bottom">
        © 2026 Eduvelto — {t({ bn: 'বিনামূল্যে শিক্ষা, সবার জন্য।', en: 'Free education for everyone.' })}
        <br />
        {t({ bn: 'যোগাযোগ', en: 'Contact' })}: ahmmizan23@gmail.com · {t({ bn: 'কক্সবাজার, বাংলাদেশ', en: "Cox's Bazar, Bangladesh" })}
      </div>
    </footer>
  );
}
