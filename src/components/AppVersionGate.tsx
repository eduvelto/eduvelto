// Forced app update — version gate (owner brief 22 Nov 2026).
//
// Mounted in App(): on every app load it fetches config/appVersion from
// the server (no cache) and decides whether this bundled version may run.
// See src/lib/appVersion.ts for the decision rules and the fail-open
// guarantees.
//
// The block screen renders PLAIN Bangla text on purpose (no useLanguage
// / t()): it must render even before any provider state is ready, and
// the whole app is Bangla-first anyway.
//
// Escape hatches — the gate NEVER blocks these paths, or a too-high
// minVersion would lock the owner out of the only fix:
//   /install — the download destination (the block screen's button lands here)
//   /login  — sign in, so the owner can reach the admin fix
//   /admin/* — the owner lowers minVersion again from /admin/app-version
import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { db } from '../firebase';
import {
  APP_VERSION,
  DEFAULT_DOWNLOAD_URL,
  checkAppVersion,
  fetchAppVersionConfig,
  type AppVersionConfig,
} from '../lib/appVersion';
import { Button } from './ui';
import { isNativeApp } from '../lib/isNativeApp';

export function isGateExemptPath(pathname: string): boolean {
  return (
    pathname === '/install' ||
    pathname.startsWith('/install/') ||
    pathname === '/login' ||
    pathname.startsWith('/login/') ||
    pathname.startsWith('/admin')
  );
}

export type GateStatus = 'checking' | 'current' | 'update-available' | 'blocked' | 'unknown';

export function useAppVersionGate(): { status: GateStatus; config: AppVersionConfig | null } {
  const [status, setStatus] = useState<GateStatus>('checking');
  const [config, setConfig] = useState<AppVersionConfig | null>(null);

  const check = useCallback(async () => {
    if (!db) {
      // Firebase not configured: fail open.
      setStatus('current');
      return;
    }
    try {
      const cfg = await fetchAppVersionConfig(db);
      setConfig(cfg);
      setStatus(checkAppVersion(cfg, APP_VERSION));
    } catch {
      // Offline / unreachable: FAIL OPEN — let the user in; the 'online'
      // listener below re-checks when connectivity returns.
      setStatus('unknown');
    }
  }, []);

  useEffect(() => {
    void check();
  }, [check]);

  useEffect(() => {
    const onOnline = () => void check();
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [check]);

  return { status, config };
}

/** The big download button: internal path → router Link, absolute URL → <a>. */
function DownloadButton(props: { config: AppVersionConfig | null; label: string }) {
  const url = props.config?.downloadUrl ?? DEFAULT_DOWNLOAD_URL;
  const style: React.CSSProperties = {
    display: 'inline-block',
    padding: '14px 28px',
    minHeight: 52,
    fontSize: 18,
    fontWeight: 700,
    borderRadius: 8,
    border: 'none',
    background: '#D9A441',
    color: '#142B3B',
    cursor: 'pointer',
    textDecoration: 'none',
  };
  if (url.startsWith('/')) {
    return (
      <Link to={url} style={style}>
        {props.label}
      </Link>
    );
  }
  return (
    <a href={url} target="_blank" rel="noreferrer" style={style}>
      {props.label}
    </a>
  );
}

/**
 * Full-screen block. Rendered INSTEAD of the whole app shell (no header,
 * no nav, no footer, no routes) when the bundled version is below
 * minVersion. Nothing else is usable — only this message + the download
 * button. The button lands on /install, which the gate never blocks.
 */
export function AppVersionBlockedScreen(props: { config: AppVersionConfig | null }) {
  const { config } = props;
  // IN-APP (audit, 24 Nov 2026): inside the Capacitor app, a download
  // button to '/install' is a dead end — the in-app /install view has
  // no download link by design, and Home returns to this blocked
  // screen. So when no real download URL is configured, show an honest
  // message + the login escape hatch instead of a button that goes
  // nowhere. A real absolute downloadUrl still gets the button (it
  // opens in the system browser).
  const inApp = isNativeApp();
  const downloadUrl = config?.downloadUrl ?? DEFAULT_DOWNLOAD_URL;
  const hasRealDownload = !downloadUrl.startsWith('/');
  return (
    <div
      role="alert"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#142B3B',
        padding: 16,
        fontFamily: "'Hind Siliguri','Noto Sans Bengali',system-ui,sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 560,
          width: '100%',
          background: '#F4F1E9',
          color: '#142B3B',
          borderRadius: 12,
          padding: '32px 24px',
          textAlign: 'center',
          borderTop: '6px solid #D9A441',
        }}
      >
        <div style={{ fontSize: 44, lineHeight: 1, color: '#D9A441' }} aria-hidden="true">
          ↓
        </div>
        <h1 style={{ fontSize: 26, margin: '16px 0 8px' }}>নতুন ভার্সন এসেছে</h1>
        <p style={{ fontSize: 17, lineHeight: 1.8, margin: '0 0 8px' }}>
          এই পুরোনো ভার্সনটি আর ব্যবহার করা যাবে না।
          {inApp && !hasRealDownload
            ? null
            : ' নতুন ভার্সন ডাউনলোড করুন।'}
        </p>
        {config?.releaseNotes ? (
          <p
            style={{
              fontSize: 15,
              lineHeight: 1.8,
              margin: '0 0 8px',
              background: '#fff',
              border: '1px solid #D9A441',
              borderRadius: 8,
              padding: '10px 14px',
              textAlign: 'left',
              whiteSpace: 'pre-wrap',
            }}
          >
            {config.releaseNotes}
          </p>
        ) : null}
        <p style={{ fontSize: 14, color: '#57616A', margin: '0 0 20px' }}>
          আপনার ভার্সন: {APP_VERSION}
          {config ? ` · সর্বশেষ ভার্সন: ${config.latestVersion}` : ''}
        </p>
        {inApp && !hasRealDownload ? (
          <>
            <p style={{ fontSize: 16, lineHeight: 1.8, margin: '0 0 8px' }}>
              নতুন ভার্সনের ডাউনলোড লিঙ্ক এখনো দেওয়া হয়নি — Eduvelto-র
              অফিসিয়াল চ্যানেল থেকে নতুন APK পাওয়া যাবে।
            </p>
            <p style={{ fontSize: 15, margin: '0 0 20px' }}>
              <Link to="/login" style={{ color: '#142B3B', fontWeight: 700 }}>
                লগইন করুন →
              </Link>
            </p>
          </>
        ) : (
          <DownloadButton config={config} label="নতুন ভার্সন ডাউনলোড করুন" />
        )}
        <p style={{ fontSize: 13, color: '#57616A', margin: '16px 0 0', lineHeight: 1.7 }}>
          {inApp
            ? 'আপনি Eduvelto Android অ্যাপ ব্যবহার করছেন।'
            : 'ব্রাউজারে নতুন ভার্সন মানেই নতুন PWA (ফোনে Add to Home Screen করা অ্যাপ)।'}
        </p>
      </div>
    </div>
  );
}

/** Small non-blocking bar when a newer (not forced) version exists. */
export function AppVersionUpdateBar(props: { config: AppVersionConfig | null }) {
  const { config } = props;
  const [dismissed, setDismissed] = useState(false);
  if (dismissed || !config) return null;
  return (
    <div
      role="region"
      aria-label="অ্যাপ আপডেট"
      style={{
        background: '#FFF6D6',
        borderBottom: '2px solid #D9A441',
        color: '#142B3B',
        padding: '10px 16px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 12,
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 15,
      }}
    >
      <span style={{ fontWeight: 700 }}>
        নতুন ভার্সন এসেছে (v{config.latestVersion}) — আপনার ভার্সন v{APP_VERSION}।
      </span>
      <Link to="/install" style={{ color: '#142B3B', fontWeight: 700 }}>
        আপডেট করুন →
      </Link>
      <Button variant="ghost" size="sm" onClick={() => setDismissed(true)} aria-label="বন্ধ করুন">
        ✕
      </Button>
    </div>
  );
}

/** Convenience for App(): the current route, for the exemption check. */
export function useIsGateExemptRoute(): boolean {
  const location = useLocation();
  return isGateExemptPath(location.pathname);
}
