// Eduvelto — login return-to (owner brief 24 Nov 2026, sections audit).
//
// Problem found by the sections audit: after signing in, the user ALWAYS
// landed on /profile — never back on the page they came from (a job hub,
// a lesson, an exam). Every login wall and gated login link pointed at
// plain "/login" with no return destination, and LoginPage hardcoded
// navigate('/profile').
//
// Fix: gated links pass the current page as router state { from }, and
// LoginPage / RegisterPage / RoleSetupPage navigate back there after
// sign-in. The destination is validated (same-site path only, never
// /login or /register, never protocol-relative) so a crafted `next`
// value can never bounce the user to another site.
import type { Location } from 'react-router-dom';

/** Validate a return-to path. Same-site path only; null when unsafe. */
export function sanitizeReturnTo(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  if (!value.startsWith('/') || value.startsWith('//')) return null;
  const path = value.split('?')[0].split('#')[0];
  if (path === '/login' || path === '/register') return null;
  if (path.startsWith('/login/') || path.startsWith('/register/')) return null;
  return value;
}

/**
 * Read the return destination for the auth pages: router state first
 * ({ from }), then the ?next= query param. Null = no valid destination
 * (callers fall back to /profile or /dashboard).
 */
export function getReturnTo(location: Location): string | null {
  const fromState = (location.state as { from?: unknown } | null)?.from;
  const fromQuery = new URLSearchParams(location.search).get('next');
  return sanitizeReturnTo(fromState) ?? sanitizeReturnTo(fromQuery);
}

/** Router-state payload a gated login link passes: the page to return to. */
export function loginState(from: string): { from: string } {
  return { from };
}
