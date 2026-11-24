import { useEffect, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageShell } from './PageShell';
import { useAuth } from '../lib/auth';
import { useLanguage } from '../i18n/LanguageContext';
import {
  getEnrolledFactors,
  hasTotpFactor,
  isSessionMfaVerified,
  wasMfaEnrolledThisSession,
} from '../lib/ownerMfa';

// Route guard for /admin/* — OWNER ONLY (review 20 Nov 2026,
// security B2 + child safety F21 + UX B2 + a11y B1).
//
// Before this guard, /admin and /admin/ads had NO role check at all:
// any signed-in student could open them. The guard is UX only — the
// Firestore rules are the real enforcement — but without it the
// dashboard pages were reachable by everyone.
//
// Admins with explicit permission come later (owner decision); until
// then the only role that may open the dashboard is 'owner'.
//
// OWNER 2FA (23 Nov 2026, staging): once the owner has enrolled TOTP,
// a session that did NOT complete the second factor cannot open the
// admin — the guard asks for a fresh sign-in with the authenticator
// code. The check re-runs on every admin navigation (cheap: the ID
// token is cached). Before enrollment the dashboard stays open, and
// AdminLayout shows the "enable 2FA" banner instead — blocking admin
// before enrollment would make enrollment itself impossible, since
// enrollment lives at /admin/security. Enrollment in this tab session
// counts as just-proven possession (see ownerMfa.ts), so the owner is
// not locked out the second he finishes enrolling.
type MfaGate = 'checking' | 'ok' | 'needs-reauth' | 'not-enrolled';

export function AdminGuard(props: { children: ReactNode }) {
  const { user, profile, loading, signOut } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [mfaGate, setMfaGate] = useState<MfaGate>('checking');
  const [signingOut, setSigningOut] = useState(false);

  // Re-checks on navigation run in the background (the gate is NOT
  // reset to 'checking'), so admin navigation never flashes a loading
  // screen after the first check.
  useEffect(() => {
    let cancelled = false;
    if (!user || profile?.role !== 'owner') return;
    void (async () => {
      const factors = getEnrolledFactors(user);
      if (!hasTotpFactor(factors)) {
        if (!cancelled) setMfaGate('not-enrolled');
        return;
      }
      if (wasMfaEnrolledThisSession()) {
        if (!cancelled) setMfaGate('ok');
        return;
      }
      const verified = await isSessionMfaVerified(user);
      if (!cancelled) setMfaGate(verified ? 'ok' : 'needs-reauth');
    })();
    return () => {
      cancelled = true;
    };
  }, [user, profile?.role, location.pathname]);

  if (loading || (user && profile?.role === 'owner' && mfaGate === 'checking')) {
    return (
      <PageShell titleBn="অ্যাডমিন ড্যাশবোর্ড" titleEn="Admin dashboard">
        <p aria-live="polite" style={{ color: 'var(--muted-ivory)' }}>
          {t({ bn: 'লোড হচ্ছে…', en: 'Loading…' })}
        </p>
      </PageShell>
    );
  }
  if (!user || profile?.role !== 'owner') {
    return (
      <PageShell titleBn="অনুমতি নেই" titleEn="Access denied">
        <p>{t({ bn: 'আপনার এই পাতায় যাওয়ার অনুমতি নেই। এই ড্যাশবোর্ড শুধু মালিকের জন্য।', en: 'You do not have permission to view this page. This dashboard is for the owner only.' })}</p>
      </PageShell>
    );
  }
  if (mfaGate === 'needs-reauth') {
    return (
      <PageShell titleBn="দ্বিতীয় ধাপ যাচাই করুন" titleEn="Verify the second step">
        <p>
          {t({
            bn: 'এই সেশনে আপনার অথেনটিকেটর কোড যাচাই হয়নি। অ্যাডমিন খুলতে আবার সাইন ইন করুন — পাসওয়ার্ডের পর অথেনটিকেটর অ্যাপের ৬ সংখ্যার কোড দিতে হবে।',
            en: 'This session has not verified your authenticator code. Sign in again to open the admin — after your password you will be asked for the 6-digit code from your authenticator app.',
          })}
        </p>
        <button
          type="button"
          className="ev-btn"
          disabled={signingOut}
          onClick={() => {
            setSigningOut(true);
            void signOut().finally(() => navigate('/login'));
          }}
        >
          {t({ bn: 'সাইন আউট করে আবার সাইন ইন করুন', en: 'Sign out and sign in again' })}
        </button>
      </PageShell>
    );
  }
  return <>{props.children}</>;
}
