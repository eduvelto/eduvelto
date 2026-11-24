// /install — the app download + update tab (owner brief 22 Nov 2026).
//
// FACT (updated 24 Nov 2026, app audit): the Eduvelto Android app
// EXISTS as an APK (Capacitor wrapper, com.eduvelto.app) but has NO
// store listing yet (APKPure listing pending). The "app" in a browser
// IS the PWA — Add to Home Screen. This page says that plainly instead
// of pretending a store app exists, and it is the single persistent
// place where the download/update link lives (linked from the footer,
// the Profile "অ্যাপ আপডেট" section, the update notice bar, and the
// forced-update block screen).
//
// IN-APP (23 Nov 2026): inside the Capacitor Android app this page must
// NOT show the PWA install steps — the user already HAS the app, and
// the old "অ্যাপ ইনস্টল করুন" button linked back to /install (a loop).
// When isNativeApp() is true the page renders the app view instead
// ("আপনি ইতিমধ্যেই Eduvelto অ্যাপ ব্যবহার করছেন" + a Home button) and
// the PWA copy below is untouched for browser visitors. No store URL
// is named anywhere here — no listing exists yet.
//
// Android/Chrome fire `beforeinstallprompt` when the PWA is installable;
// the page captures it and offers a real Install button. iOS Safari
// never fires it, so iOS users get the Share → Add to Home Screen steps.
// The install bar (InstallAppPrompt) listens for the same event in the
// app shell — both listeners receive it; calling preventDefault in both
// is harmless.
import { useEffect, useState } from 'react';
import { PageShell } from '../components/PageShell';
import AppUpdateSection from '../components/AppUpdateSection';
import { Button, LinkButton } from '../components/ui';
import { useLanguage } from '../i18n/LanguageContext';
import { isNativeApp } from '../lib/isNativeApp';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIOS(): boolean {
  const ua = window.navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (/Mac/.test(ua) && window.navigator.maxTouchPoints > 1);
}

export default function InstallPage() {
  const { t } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(isStandalone());
  const [installResult, setInstallResult] = useState<'installed' | 'cancelled' | ''>('');
  // Inside the Capacitor app there is nothing to install — the PWA
  // install listeners and steps below are browser-only.
  const inApp = isNativeApp();

  useEffect(() => {
    if (inApp) return;
    if (isStandalone()) {
      setInstalled(true);
      return;
    }
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
      setInstallResult('installed');
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, [inApp]);

  const install = async () => {
    if (!deferredPrompt || typeof deferredPrompt.prompt !== 'function') return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setInstalled(true);
      setInstallResult('installed');
    } else {
      setInstallResult('cancelled');
    }
    setDeferredPrompt(null);
  };

  // IN-APP VIEW: the user already has the app. No PWA install steps,
  // no install button that would link back here (the old loop).
  // AppUpdateSection renders its neutral in-app form here too (bundled
  // version only, no "latest version" claim).
  if (inApp) {
    return (
      <PageShell titleBn="Eduvelto অ্যাপ" titleEn="Eduvelto app">
        <p style={{ lineHeight: 1.8 }}>
          {t({
            bn: 'আপনি ইতিমধ্যেই Eduvelto অ্যাপ ব্যবহার করছেন — আলাদা করে ইনস্টল করার কিছু নেই।',
            en: 'You are already using the Eduvelto app — there is nothing else to install.',
          })}
        </p>
        <p>
          <LinkButton to="/">{t({ bn: 'হোমে ফিরুন →', en: 'Back to home →' })}</LinkButton>
        </p>
        <AppUpdateSection />
      </PageShell>
    );
  }

  return (
    <PageShell titleBn="অ্যাপ ইনস্টল করুন" titleEn="Install the app">
      <p style={{ lineHeight: 1.8 }}>
        {t({
          bn: 'Eduvelto Android অ্যাপ তৈরি হয়েছে — শীঘ্রই APKPure থেকে ডাউনলোড করা যাবে। আপাতত এই PWA-ই অফিসিয়াল অ্যাপ — ফোনের হোম স্ক্রিনে যোগ করলেই অ্যাপের মতো চলবে, নতুন ভার্সন এলে এখান থেকেই আপডেট পাবেন।',
          en: 'The Eduvelto Android app is ready — it will soon be downloadable from APKPure. For now, this PWA is the official app — add it to your home screen and it works like an app; new versions arrive here.',
        })}
      </p>

      <AppUpdateSection />

      {installed ? (
        <p style={{ lineHeight: 1.8, fontWeight: 700 }}>
          {t({ bn: 'অ্যাপটি আপনার ফোনে ইনস্টল করা আছে।', en: 'The app is installed on your phone.' })}
        </p>
      ) : deferredPrompt ? (
        <p>
          <Button onClick={() => void install()} size="lg">
            {t({ bn: 'অ্যাপ ইনস্টল করুন', en: 'Install app' })}
          </Button>
        </p>
      ) : isIOS() ? (
        <div style={{ lineHeight: 1.8 }}>
          <h2 style={{ fontSize: 20 }}>
            {t({ bn: 'iPhone / iPad-এ ইনস্টল', en: 'Install on iPhone / iPad' })}
          </h2>
          <ol style={{ lineHeight: 2 }}>
            <li>{t({ bn: 'Safari-তে এই সাইটটি খুলুন।', en: 'Open this site in Safari.' })}</li>
            <li>{t({ bn: 'নিচের Share বোতাম চাপুন।', en: 'Tap the Share button below.' })}</li>
            <li>{t({ bn: '“Add to Home Screen” বেছে নিন, তারপর Add চাপুন।', en: 'Choose “Add to Home Screen”, then tap Add.' })}</li>
          </ol>
        </div>
      ) : (
        <div style={{ lineHeight: 1.8 }}>
          <h2 style={{ fontSize: 20 }}>
            {t({ bn: 'Android / কম্পিউটারে ইনস্টল', en: 'Install on Android / computer' })}
          </h2>
          <ol style={{ lineHeight: 2 }}>
            <li>{t({ bn: 'Chrome-এ এই সাইটটি খুলুন।', en: 'Open this site in Chrome.' })}</li>
            <li>
              {t({
                bn: 'ব্রাউজারের মেনু (⋮) থেকে “Install app” / “Add to Home screen” বেছে নিন।',
                en: 'From the browser menu (⋮) choose “Install app” / “Add to Home screen”.',
              })}
            </li>
            <li>{t({ bn: 'Install চাপলেই অ্যাপটি হোম স্ক্রিনে যোগ হবে।', en: 'Tap Install and the app appears on your home screen.' })}</li>
          </ol>
          <p style={{ color: '#57616A' }}>
            {t({
              bn: 'ইনস্টল বোতামটি না দেখালে পাতাটি রিফ্রেশ করে আবার দেখুন, অথবা Chrome আপডেট করুন।',
              en: 'If no install button appears, refresh the page or update Chrome.',
            })}
          </p>
        </div>
      )}
      {installResult ? (
        <p role="status" style={{ lineHeight: 1.8 }}>
          {installResult === 'installed'
            ? t({ bn: 'ইনস্টল হয়েছে — হোম স্ক্রিন থেকে Eduvelto খুলুন।', en: 'Installed — open Eduvelto from your home screen.' })
            : t({ bn: 'ইনস্টল বাতিল হয়েছে — নিচের ধাপগুলো দিয়ে পরে ইনস্টল করতে পারবেন।', en: 'Install cancelled — you can install later from the steps below.' })}
        </p>
      ) : null}
    </PageShell>
  );
}
