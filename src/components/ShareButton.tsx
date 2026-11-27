// Eduvelto — share / copy-link button for tool pages (28 Nov 2026).
//
// One shared component, mounted by ToolsDetailPage (all 263 direct tool
// slugs) and by the three alias hub pages (typing-speed-test,
// cv-builder, cover-letter-builder, unit-converter) so the button
// appears on every tool page. Prefers the native share sheet
// (navigator.share) where the browser offers it; otherwise copies the
// link to the clipboard — Clipboard API with the textarea fallback
// from DonationMethods.copyText, so it also works in older WebViews.
// A cancelled native share does NOT fall through to copy (AbortError).
// The shared URL defaults to the page the user is on; ToolsDetailPage
// passes the tool's canonical URL explicitly.

import { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

async function copyText(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to the textarea fallback.
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export default function ShareButton({ url, title }: { url?: string; title?: string }) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const shareUrl =
    url ?? (typeof window !== 'undefined' ? window.location.href : '');
  const shareTitle =
    title ?? (typeof document !== 'undefined' ? document.title : 'Eduvelto');

  async function onShare(): Promise<void> {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: shareTitle, url: shareUrl });
        return;
      } catch (err) {
        // The user cancelled the share sheet — do not copy as well.
        if (err instanceof Error && err.name === 'AbortError') return;
        // Any other share failure falls through to copy below.
      }
    }
    const ok = await copyText(shareUrl);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button
      type="button"
      className="ev-btn ev-btn-outline"
      data-share-url={shareUrl}
      onClick={() => void onShare()}
    >
      {copied
        ? t({ bn: 'লিংক কপি হয়েছে', en: 'Link copied' })
        : t({ bn: 'শেয়ার করুন', en: 'Share' })}
    </button>
  );
}
