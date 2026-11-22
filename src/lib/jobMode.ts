// Eduvelto — Job Preparation mode (owner decision 22 Nov 2026, BINDING).
//
// Two modes, switchable any time:
//   'beginner' — brand-new students: easy explanations, basic practice,
//     step-by-step preparation. NO timers, NO competitive elements.
//   'advanced' — experienced candidates: hard questions, timed exams,
//     full model tests, competitive preparation.
//
// Storage mirrors the language preference (LanguageContext): the signed-in
// user's choice lives on their own profile doc (`users/{uid}.jobMode` —
// firestore.rules allow the owner to update only their own jobMode, and
// only to 'beginner'/'advanced'; absent = 'beginner') and in this
// browser's localStorage (`eduvelto-job-mode`) as the logged-out-visitor
// fallback only. When signed in, the profile wins; the local value is
// never read over it. The write is fire-and-forget (a failed save —
// offline, rules — leaves the local choice in place for this browser).

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './auth';

export type JobMode = 'beginner' | 'advanced';

const STORAGE_KEY = 'eduvelto-job-mode';

/** Anything that is not exactly 'advanced' reads as 'beginner' (default). */
export function resolveJobMode(value: unknown): JobMode {
  return value === 'advanced' ? 'advanced' : 'beginner';
}

function readLocalMode(): JobMode {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'advanced' ? 'advanced' : 'beginner';
  } catch {
    return 'beginner';
  }
}

export function useJobMode(): { mode: JobMode; setMode: (next: JobMode) => void } {
  const { user, profile, saveProfile } = useAuth();
  const [local, setLocal] = useState<JobMode>(readLocalMode);

  // Signed in: the profile is the source of truth — adopt it (and keep
  // this browser's fallback in sync, so a later signed-out visit agrees).
  const profileMode = profile ? resolveJobMode(profile.jobMode) : null;
  useEffect(() => {
    if (user && profileMode) {
      try {
        window.localStorage.setItem(STORAGE_KEY, profileMode);
      } catch {
        // Storage unavailable — the profile still holds the choice.
      }
    }
  }, [user?.uid, profileMode]);

  const setMode = useCallback(
    (next: JobMode) => {
      setLocal(next);
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // Storage unavailable — the in-memory choice still applies.
      }
      if (user && profile) {
        void saveProfile({ jobMode: next }).catch(() => {
          // A failed save leaves the local choice in place for this
          // browser; the profile keeps its previous value.
        });
      }
    },
    [user, profile, saveProfile],
  );

  return { mode: user && profileMode ? profileMode : local, setMode };
}
