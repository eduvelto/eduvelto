// "অ্যাপ আপডেট" section — shared by the Profile page (Profile Settings)
// and the /install download tab. Shows the bundled version, the latest
// published version, the update status, and the download link — even when
// no update is forced. Fetches the published config fresh from the server
// (one read per visit to a page that shows this section).
//
// IN-APP (23 Nov 2026): inside the Capacitor Android app, config/appVersion
// is the WEB version gate — it must NOT be presented as the app's latest
// version (there is no store listing yet, and the store is the only
// source of app updates). In-app the section shows ONLY the bundled
// version (v{APP_VERSION}) with no update claim, no "সর্বশেষ ভার্সন"
// line, and no /install link, and it skips the config fetch entirely
// (saves a read). Browser/PWA behaviour is unchanged.
import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import {
  APP_VERSION,
  checkAppVersion,
  fetchAppVersionConfig,
  type AppVersionConfig,
} from '../lib/appVersion';
import { useLanguage } from '../i18n/LanguageContext';
import { LinkButton } from './ui';
import { isNativeApp } from '../lib/isNativeApp';

const sectionStyle: CSSProperties = {
  border: '1px solid #D9A441',
  borderRadius: 8,
  padding: '16px',
  margin: '20px 0',
  background: '#FFF6D6',
};

export default function AppUpdateSection() {
  const { t } = useLanguage();
  const [config, setConfig] = useState<AppVersionConfig | null>(null);
  const [failed, setFailed] = useState(false);
  // Inside the Capacitor app the web version config is not the app's
  // latest version — show the bundled version only (see below).
  const inApp = isNativeApp();

  useEffect(() => {
    if (inApp) return;
    if (!db) {
      setFailed(true);
      return;
    }
    let cancelled = false;
    void fetchAppVersionConfig(db)
      .then((cfg) => {
        if (!cancelled) setConfig(cfg);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [inApp]);

  // IN-APP: bundled version only. No config fetch happened above, so
  // there is no "সর্বশেষ ভার্সন" to show — and the web config must never
  // be presented as the app's latest version. No /install link either:
  // inside the app it would only lead back to the "already using the
  // app" view.
  if (inApp) {
    return (
      <section aria-label={t({ bn: 'অ্যাপ আপডেট', en: 'App update' })} style={sectionStyle}>
        <h2 style={{ fontSize: 20, margin: '0 0 8px' }}>{t({ bn: 'অ্যাপ আপডেট', en: 'App update' })}</h2>
        <p style={{ margin: '0 0 4px', lineHeight: 1.7 }}>
          {t({ bn: 'আপনার ভার্সন:', en: 'Your version:' })} <strong>v{APP_VERSION}</strong>
        </p>
        <p style={{ margin: '0 0 8px', color: '#57616A' }}>
          {t({ bn: 'আপনি Eduvelto অ্যাপ ব্যবহার করছেন।', en: 'You are using the Eduvelto app.' })}
        </p>
      </section>
    );
  }

  const status = checkAppVersion(config, APP_VERSION);

  return (
    <section aria-label={t({ bn: 'অ্যাপ আপডেট', en: 'App update' })} style={sectionStyle}>
      <h2 style={{ fontSize: 20, margin: '0 0 8px' }}>{t({ bn: 'অ্যাপ আপডেট', en: 'App update' })}</h2>
      <p style={{ margin: '0 0 4px', lineHeight: 1.7 }}>
        {t({ bn: 'আপনার ভার্সন:', en: 'Your version:' })} <strong>v{APP_VERSION}</strong>
        {config ? (
          <>
            {' · '}{t({ bn: 'সর্বশেষ ভার্সন:', en: 'Latest version:' })} <strong>v{config.latestVersion}</strong>
          </>
        ) : null}
      </p>
      {failed ? (
        <p style={{ margin: '0 0 8px', color: '#57616A' }}>
          {t({ bn: 'সর্বশেষ ভার্সনের তথ্য এখন আনা যায়নি (অফলাইন হতে পারে) — পরে আবার দেখুন।', en: 'The latest version info could not be loaded right now (you may be offline) — check again later.' })}
        </p>
      ) : !config ? (
        <p style={{ margin: '0 0 8px', color: '#57616A' }}>{t({ bn: 'সর্বশেষ ভার্সনের তথ্য আনা হচ্ছে…', en: 'Loading the latest version info…' })}</p>
      ) : status === 'blocked' ? (
        <p style={{ margin: '0 0 8px', color: '#b00020', fontWeight: 700 }}>
          {t({ bn: 'আপনার ভার্সনটি আর ব্যবহার করা যাবে না — নতুন ভার্সন ডাউনলোড করুন।', en: 'This version can no longer be used — download the new version.' })}
        </p>
      ) : status === 'update-available' ? (
        <p style={{ margin: '0 0 8px' }}>
          {t({ bn: `নতুন ভার্সন এসেছে (v${config.latestVersion}) — আপডেট করুন।`, en: `A new version is available (v${config.latestVersion}) — update now.` })}
          {config.releaseNotes ? <span style={{ display: 'block' }}>{config.releaseNotes}</span> : null}
        </p>
      ) : (
        <p style={{ margin: '0 0 8px' }}>{t({ bn: 'আপনি সর্বশেষ ভার্সনটি ব্যবহার করছেন।', en: 'You are using the latest version.' })}</p>
      )}
      <LinkButton to="/install">{t({ bn: 'অ্যাপ ডাউনলোড / আপডেট →', en: 'Download / update the app →' })}</LinkButton>
      <span style={{ display: 'block', marginTop: 8, fontSize: 13, color: '#57616A' }}>
        <Link to="/install" style={{ color: '#57616A' }}>
          {t({ bn: 'ডাউনলোডের লিংক সবসময় /install পাতায় থাকে।', en: 'The download link is always on the /install page.' })}
        </Link>
      </span>
    </section>
  );
}
