// "অ্যাপ আপডেট" section — shared by the Profile page (Profile Settings)
// and the /install download tab. Shows the bundled version, the latest
// published version, the update status, and the download link — even when
// no update is forced. Fetches the published config fresh from the server
// (one read per visit to a page that shows this section).
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import {
  APP_VERSION,
  checkAppVersion,
  fetchAppVersionConfig,
  type AppVersionConfig,
} from '../lib/appVersion';
import { LinkButton } from './ui';

export default function AppUpdateSection() {
  const [config, setConfig] = useState<AppVersionConfig | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
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
  }, []);

  const status = checkAppVersion(config, APP_VERSION);

  return (
    <section
      aria-label="অ্যাপ আপডেট"
      style={{
        border: '1px solid #D9A441',
        borderRadius: 8,
        padding: '16px',
        margin: '20px 0',
        background: '#FFF6D6',
      }}
    >
      <h2 style={{ fontSize: 20, margin: '0 0 8px' }}>অ্যাপ আপডেট</h2>
      <p style={{ margin: '0 0 4px', lineHeight: 1.7 }}>
        আপনার ভার্সন: <strong>v{APP_VERSION}</strong>
        {config ? (
          <>
            {' · '}সর্বশেষ ভার্সন: <strong>v{config.latestVersion}</strong>
          </>
        ) : null}
      </p>
      {failed ? (
        <p style={{ margin: '0 0 8px', color: '#57616A' }}>
          সর্বশেষ ভার্সনের তথ্য এখন আনা যায়নি (অফলাইন হতে পারে) — পরে আবার দেখুন।
        </p>
      ) : !config ? (
        <p style={{ margin: '0 0 8px', color: '#57616A' }}>সর্বশেষ ভার্সনের তথ্য আনা হচ্ছে…</p>
      ) : status === 'blocked' ? (
        <p style={{ margin: '0 0 8px', color: '#b00020', fontWeight: 700 }}>
          আপনার ভার্সনটি আর ব্যবহার করা যাবে না — নতুন ভার্সন ডাউনলোড করুন।
        </p>
      ) : status === 'update-available' ? (
        <p style={{ margin: '0 0 8px' }}>
          নতুন ভার্সন এসেছে (v{config.latestVersion}) — আপডেট করুন।
          {config.releaseNotes ? <span style={{ display: 'block' }}>{config.releaseNotes}</span> : null}
        </p>
      ) : (
        <p style={{ margin: '0 0 8px' }}>আপনি সর্বশেষ ভার্সনটি ব্যবহার করছেন।</p>
      )}
      <LinkButton to="/install">অ্যাপ ডাউনলোড / আপডেট →</LinkButton>
      <span style={{ display: 'block', marginTop: 8, fontSize: 13, color: '#57616A' }}>
        <Link to="/install" style={{ color: '#57616A' }}>
          ডাউনলোডের লিংক সবসময় /install পাতায় থাকে।
        </Link>
      </span>
    </section>
  );
}
