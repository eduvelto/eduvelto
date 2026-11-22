import type { ReactNode } from 'react';
import { PageShell } from './PageShell';
import { useAuth } from '../lib/auth';
import { useLanguage } from '../i18n/LanguageContext';

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
export function AdminGuard(props: { children: ReactNode }) {
  const { user, profile, loading } = useAuth();
  const { t } = useLanguage();
  if (loading) {
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
  return <>{props.children}</>;
}
