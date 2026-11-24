// Push notifications, Phase A (app audit, 24 Nov 2026): topic-based
// push with manual Firebase console sends — no server, no Blaze, $0.
// The app registers for push and subscribes every install to one topic
// ('eduvelto-announcements'); the owner sends from the Firebase console.
// No token is stored anywhere in v1 (FCM holds the subscription), so
// there is no new collection and no token-privacy surface.
//
// How it runs: setupPushNotifications() is called once from App.tsx
// (NativePushNotifications) after the user signs in, native-app only.
// It asks the Android 13+ notification permission once (system dialog);
// if the user says no, push stays off silently and the app works fully
// without it. If google-services.json is not in the wrapper yet (owner
// step — register the Android app in the Firebase console and hand over
// the file), registration fails and is swallowed: the app never crashes
// or nags because push is missing. Foreground receipts show nothing
// extra — the in-app feed (jobNotifications.ts) already shows the item
// on next visit, and duplicating it would be a second notification for
// the same event. A tap deep-links to notification data `link` (a
// same-app path like /jobs/circulars/<id>) when the console sender set
// one; without a link the app just opens.
//
// TOPIC SUBSCRIPTION IS NATIVE, not here: the Capacitor push plugin
// exposes NO topic API (verified in @capacitor/push-notifications 8.1.3
// — register/unregister/channels/listeners only), so MainActivity.java
// subscribes this install to PUSH_TOPIC via
// FirebaseMessaging.subscribeToTopic(), guarded so a missing
// google-services.json keeps push off silently. This module never
// touches the topic; PUSH_TOPIC is kept here as the single documented
// name so the web and native sides cannot drift apart unnoticed.
//
// What v1 does NOT cover: per-user targeting (needs a token registry),
// scheduled/automatic deadline reminders (in-app feed only until a
// Phase B Cloudflare Worker), delivery analytics. Console sends are
// manual — one send per event, deduped by the event id (see the push
// design doc in app-audit-evidence/notify-offline-design/).
import { isNativeApp } from './isNativeApp';

import type { PushNotificationsPlugin } from '@capacitor/push-notifications';

export const PUSH_TOPIC = 'eduvelto-announcements';

type ListenerHandle = { remove: () => Promise<void> };

type ListenerState = {
  handles: ListenerHandle[];
  cancelled: boolean;
};

// One setup per page load; a second call is a no-op (the App shell
// mounts once, but StrictMode double-invokes effects in development).
let current: ListenerState | null = null;

export function setupPushNotifications(
  navigate?: (path: string) => void,
): () => void {
  if (typeof window === 'undefined' || !isNativeApp()) {
    return () => undefined;
  }
  if (current) {
    return () => undefined;
  }
  const state: ListenerState = { handles: [], cancelled: false };
  current = state;
  void import('@capacitor/push-notifications')
    .then(async (mod) => {
      const push: PushNotificationsPlugin | undefined = (
        mod as { PushNotifications?: PushNotificationsPlugin }
      ).PushNotifications;
      if (!push || state.cancelled) {
        return;
      }
      try {
        const perm = await push.requestPermissions();
        if (perm.receive !== 'granted' || state.cancelled) {
          return;
        }
        await push.register();
        // Foreground receipt: nothing extra (see header — the in-app
        // feed already covers it). The listener exists so the event is
        // consumed, not so a banner is shown.
        state.handles.push(
          await push.addListener('pushNotificationReceived', () => undefined),
        );
        state.handles.push(
          await push.addListener('registrationError', () => undefined),
        );
        state.handles.push(
          await push.addListener('pushNotificationActionPerformed', (action) => {
            const link = action?.notification?.data?.link;
            if (typeof link === 'string' && link.startsWith('/') && navigate) {
              navigate(link);
            }
          }),
        );
      } catch {
        // FCM not configured (no google-services.json yet) or
        // unavailable: push stays off silently.
      }
    })
    .catch(() => undefined);
  return () => {
    state.cancelled = true;
    if (current === state) {
      current = null;
    }
    for (const handle of state.handles) {
      void handle.remove();
    }
    state.handles = [];
  };
}
