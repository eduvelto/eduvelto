import { useEffect, useState } from 'react';

// Safe-update notice (owner brief 21 Nov 07:32 — "Safe cache updates so
// users receive the latest version").
//
// The service worker (src/sw.ts) calls skipWaiting() + clientsClaim(), so a
// new worker activates as soon as it is installed. The already-open page
// keeps running the OLD JavaScript bundle until it reloads, so a silent
// update would leave the user on stale code with no signal. The browser
// fires `controllerchange` on the page when the new worker takes control —
// that is the moment to tell the user a new version is ready and offer a
// one-tap reload. The banner shows once per new worker (dismissing it
// hides it until the NEXT update; reload applies the update).
export default function UpdatePrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const onControllerChange = () => {
      setShow(true);
    };
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
    };
  }, []);

  if (!show) return null;

  return (
    <div
      role="region"
      aria-label="নতুন সংস্করণ / New version"
      style={{
        background: '#0A1F44',
        borderBottom: '2px solid #F1B308',
        color: '#fff',
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
        Eduvelto-র নতুন সংস্করণ এসেছে — রিলোড করলে নতুন সংস্করণ চলবে।
      </span>
      <span style={{ color: '#cdd7ea' }}>
        A new version of Eduvelto is ready — reload to use it.
      </span>
      <button
        type="button"
        onClick={() => window.location.reload()}
        style={{
          background: '#F1B308',
          color: '#041742',
          border: 'none',
          borderRadius: 6,
          padding: '10px 18px',
          minHeight: 44,
          fontSize: 15,
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        রিলোড করুন / Reload
      </button>
      <button
        type="button"
        onClick={() => setShow(false)}
        aria-label="বন্ধ করুন / Dismiss"
        style={{
          background: 'transparent',
          border: '1px solid #fff',
          color: '#fff',
          borderRadius: 6,
          padding: '8px 12px',
          minHeight: 44,
          fontSize: 15,
          cursor: 'pointer',
        }}
      >
        ✕
      </button>
    </div>
  );
}
