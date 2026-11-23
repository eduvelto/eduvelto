// Eduvelto — native-app detection (install-page / update-section fix,
// 23 Nov 2026).
//
// The Android app is a Capacitor 8 WebView that loads the LIVE site
// (https://eduvelto.com) — no bundled dist, no service worker. The web
// code therefore has to know, at runtime, whether it is running inside
// that WebView or in a normal browser, so pages that only make sense in
// a browser (PWA install instructions, web version checks) can render an
// app-appropriate view instead.
//
// Detection — Capacitor injects `window.Capacitor` into every page the
// WebView loads, before any page script runs, and
// `Capacitor.isNativePlatform()` reports whether the bridge is backed by
// native code. The wrapper does NOT append a user-agent marker
// (capacitor.config.ts sets no custom UA), so the user agent is NOT a
// signal here — do not add a UA check unless the wrapper starts setting
// one.
//
// Safe to call during render and in Node/test environments (no `window`
// → false). Re-run on every render, so a bridge injected after first
// paint is picked up on the next render.
export function isNativeApp(): boolean {
  if (typeof window === 'undefined') return false;
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } })
    .Capacitor;
  if (!cap) return false;
  if (typeof cap.isNativePlatform === 'function') {
    try {
      return cap.isNativePlatform();
    } catch {
      // Bridge present but the platform check threw — the bridge itself
      // is the signal; treat it as the native app.
      return true;
    }
  }
  // Bridge present without isNativePlatform (older bridge) — still the
  // native app, not a browser.
  return true;
}
