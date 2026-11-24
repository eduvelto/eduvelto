// Android back button inside the Capacitor app (owner bug report 24 Nov
// 2026 09:40 — "apps ar kono akta page a duke back aste caile full apps
// thake exit hoiye jacce"): pressing back on any in-app page exited the
// WHOLE app instead of going to the previous page.
//
// Root cause (verified in the installed Capacitor 8.6.2 source):
// BridgeActivity registers NO back-press handling at all, so the Android
// back button fell through to the activity default and finished the app
// on EVERY press, whatever the WebView history was. The fix is the
// @capacitor/app plugin (native side, registered by `npx cap sync` in
// the android/capacitor-wrapper worktree): its OnBackPressedCallback
// fires a `backButton` event with { canGoBack } — and, per the plugin's
// own README, "Listening for this event will disable the default back
// button behaviour, so you might want to call window.history.back()
// manually. If you want to close the app, call App.exitApp()."
// So this listener does exactly that: history.back() when there is
// in-app history, App.exitApp() only on the home/root page.
//
// The plugin is loaded with a dynamic import and only when isNativeApp()
// is true, so a normal browser never loads it and the browser back
// button is untouched. If the import fails or the plugin is absent (old
// APK without the native plugin), setup silently does nothing — the app
// keeps its previous behaviour rather than crashing. NOTE: this listener
// alone does nothing without the native plugin, so the fix only takes
// effect in an APK built AFTER @capacitor/app was added to the wrapper.
import { isNativeApp } from './isNativeApp';

import type { AppPlugin } from '@capacitor/app';

type ListenerHandle = { remove: () => Promise<void> };

type ListenerState = {
  handle: ListenerHandle | null;
  cancelled: boolean;
};

// One registration per page load; a second call is a no-op (the App shell
// mounts once, but StrictMode double-invokes effects in development).
let current: ListenerState | null = null;

export function setupNativeBackButton(): () => void {
  if (typeof window === 'undefined' || !isNativeApp()) {
    return () => undefined;
  }
  if (current) {
    return () => undefined;
  }
  const state: ListenerState = { handle: null, cancelled: false };
  current = state;
  void import('@capacitor/app')
    .then((mod) => {
      const capApp: AppPlugin | undefined = (mod as { App?: AppPlugin }).App;
      if (!capApp || typeof capApp.addListener !== 'function') {
        return null;
      }
      return capApp.addListener('backButton', ({ canGoBack }) => {
        if (canGoBack) {
          window.history.back();
        } else {
          void capApp.exitApp();
        }
      });
    })
    .then((handle) => {
      if (state.cancelled) {
        if (handle) {
          void handle.remove();
        }
        return;
      }
      state.handle = handle;
    })
    .catch(() => undefined);
  return () => {
    state.cancelled = true;
    if (current === state) {
      current = null;
    }
    if (state.handle) {
      void state.handle.remove();
    }
    state.handle = null;
  };
}
