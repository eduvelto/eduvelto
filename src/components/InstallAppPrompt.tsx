import { useEffect, useState } from 'react';
import { Button } from './ui';

// PWA install prompt (owner brief 20 Nov 23:53 — installable phone app).
// Android/Chrome fire `beforeinstallprompt` when the PWA is installable;
// iOS Safari never fires it, so iOS users get "Add to Home Screen" steps.
// The bar hides once the app is installed (standalone display mode) and
// stays dismissed for 7 days after the user closes it.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'eduvelto-install-dismissed';
const DISMISS_DAYS = 7;

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIOS(): boolean {
  const ua = window.navigator.userAgent;
  const iOSDevice = /iPad|iPhone|iPod/.test(ua);
  const iPadOS13Plus =
    /Mac/.test(ua) && window.navigator.maxTouchPoints > 1;
  return iOSDevice || iPadOS13Plus;
}

function wasDismissedRecently(): boolean {
  try {
    const raw = window.localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const dismissedAt = Number(raw);
    return Date.now() - dismissedAt < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

export default function InstallAppPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showIOS, setShowIOS] = useState(false);
  const [dismissed, setDismissed] = useState(wasDismissedRecently());
  const [installed, setInstalled] = useState(isStandalone());

  useEffect(() => {
    if (isStandalone()) {
      setInstalled(true);
      return;
    }
    if (isIOS()) {
      setShowIOS(true);
      return;
    }
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (installed || dismissed) return null;
  if (!deferredPrompt && !showIOS) return null;

  const dismiss = () => {
    try {
      window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // Private mode: dismiss for this session only.
    }
    setDismissed(true);
  };

  const install = async () => {
    if (!deferredPrompt || typeof deferredPrompt.prompt !== 'function') return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setInstalled(true);
    } else {
      dismiss();
    }
    setDeferredPrompt(null);
  };

  return (
    <div
      role="region"
      aria-label="অ্যাপ ইনস্টল / Install app"
      style={{
        background: '#FFF6D6',
        borderBottom: '2px solid #F1B308',
        color: '#041742',
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
        {showIOS
          ? 'Eduvelto অ্যাপ ফোনে রাখুন — Share → Add to Home Screen চাপুন।'
          : 'Eduvelto অ্যাপ ফোনে ইনস্টল করুন — Install app চাপুন।'}
      </span>
      <span style={{ color: '#44506a' }}>
        {showIOS
          ? 'Install Eduvelto on your phone: Share → Add to Home Screen.'
          : 'Install Eduvelto on your phone.'}
      </span>
      {deferredPrompt ? (
        <Button onClick={() => void install()} size="sm">
          অ্যাপ ইনস্টল করুন / Install app
        </Button>
      ) : null}
      <Button variant="ghost" size="sm" onClick={dismiss} aria-label="বন্ধ করুন / Dismiss">
        ✕
      </Button>
    </div>
  );
}
