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
// only to 'beginner'/'advanced'; absent = 'beginner').
//
// LOCAL STORAGE — ACCOUNT ISOLATION (ChatGPT Step 4 review P0, same fix
// as jobProfile.ts): the old global key `eduvelto-job-mode` was written
// from a signed-in profile, so a second student on the same browser
// could see the first student's mode as a signed-out visitor. Now:
//   * signed out → the ANONYMOUS key `eduvelto-job-anonymous-mode`
//     only (this browser's own signed-out choice);
//   * signed in → the profile only; nothing is written to localStorage
//     from a signed-in session, and the anonymous value is never read
//     over the profile.
// The legacy key `eduvelto-job-mode` is no longer read or written:
// a signed-out visitor who never picked a mode sees Beginner once
// (their profile choice is untouched and applies on sign-in).

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './auth';

export type JobMode = 'beginner' | 'advanced';

/** Anonymous (signed-out) mode choice only — never a profile value. */
const ANON_STORAGE_KEY = 'eduvelto-job-anonymous-mode';

/** Anything that is not exactly 'advanced' reads as 'beginner' (default). */
export function resolveJobMode(value: unknown): JobMode {
  return value === 'advanced' ? 'advanced' : 'beginner';
}

function readLocalMode(): JobMode {
  try {
    return window.localStorage.getItem(ANON_STORAGE_KEY) === 'advanced' ? 'advanced' : 'beginner';
  } catch {
    return 'beginner';
  }
}

export function useJobMode(): { mode: JobMode; setMode: (next: JobMode) => void } {
  const { user, profile, saveProfile } = useAuth();
  const [local, setLocal] = useState<JobMode>(readLocalMode);

  // Signed in: the profile is the source of truth — adopt it. Nothing
  // is written to localStorage from a signed-in session (account
  // isolation: this browser's anonymous key must never hold another
  // student's profile value).
  const profileMode = profile ? resolveJobMode(profile.jobMode) : null;
  useEffect(() => {
    if (user && profileMode) {
      setLocal(profileMode);
    }
  }, [user?.uid, profileMode]);

  const setMode = useCallback(
    (next: JobMode) => {
      setLocal(next);
      if (user && profile) {
        // Signed in: profile only. A failed save leaves the in-memory
        // choice in place for this session; the profile keeps its
        // previous value (and the screen re-reads it on next load).
        void saveProfile({ jobMode: next }).catch(() => {
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
