// Eduvelto — National University admission mode (NU-4, 22 Nov 2026;
// design doc §6.3, §12.3, §19.2.15).
//
// Two modes, switchable any time (design §6.3, BINDING — the Job Step 2
// §3.3 rule verbatim): a mode switch NEVER cancels or submits an active
// exam, NEVER deletes progress/results/history, and NEVER hides one
// mode's questions from the other mode (only presentation/order changes
// — the content comes from the same bank).
//
// Storage mirrors Job's jobMode (Job Step 4): the signed-in user's
// choice lives on their own profile doc (`users/{uid}.admissionMode` —
// firestore.rules allow the owner to update only their own
// admissionMode, and only to 'beginner'/'advanced'; absent =
// 'beginner'). NU-Q5: this is a SEPARATE field from Job's `jobMode`
// (see nuProfile.ts) — a student can be Advanced in Job and Beginner
// in NU admission.
//
// LOCAL STORAGE — ACCOUNT ISOLATION (Job Step 4 ChatGPT P0, same fix):
//   * signed out → the ANONYMOUS key `eduvelto-nu-anonymous-mode`
//     only (this browser's own signed-out choice);
//   * signed in → the profile only; nothing is written to localStorage
//     from a signed-in session, and the anonymous value is never read
//     over the profile.

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './auth';
import { resolveAdmissionMode, type AdmissionMode } from './nuProfile';

/** Anonymous (signed-out) mode choice only — never a profile value. */
const ANON_STORAGE_KEY = 'eduvelto-nu-anonymous-mode';

function readLocalMode(): AdmissionMode {
  try {
    return window.localStorage.getItem(ANON_STORAGE_KEY) === 'advanced' ? 'advanced' : 'beginner';
  } catch {
    return 'beginner';
  }
}

export function useAdmissionMode(): { mode: AdmissionMode; setMode: (next: AdmissionMode) => void } {
  const { user, profile, saveProfile } = useAuth();
  const [local, setLocal] = useState<AdmissionMode>(readLocalMode);

  // Signed in: the profile is the source of truth — adopt it. Nothing
  // is written to localStorage from a signed-in session (account
  // isolation: this browser's anonymous key must never hold another
  // student's profile value).
  const profileMode = profile ? resolveAdmissionMode(profile.admissionMode) : null;
  useEffect(() => {
    if (user && profileMode) {
      setLocal(profileMode);
    }
  }, [user?.uid, profileMode]);

  const setMode = useCallback(
    (next: AdmissionMode) => {
      setLocal(next);
      if (user && profile) {
        // Signed in: profile only. A failed save leaves the in-memory
        // choice in place for this session; the profile keeps its
        // previous value (and the screen re-reads it on next load).
        void saveProfile({ admissionMode: next }).catch(() => {
          // No local fallback write — see the module header.
        });
      } else {
        // Signed out: anonymous choice only.
        try {
          window.localStorage.setItem(ANON_STORAGE_KEY, next);
        } catch {
          // Storage unavailable — the in-memory choice still applies.
        }
      }
    },
    [user, profile, saveProfile],
  );

  return { mode: user && profileMode ? profileMode : local, setMode };
}
