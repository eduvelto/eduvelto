import type { ReactNode } from 'react';
import { PageShell } from './PageShell';
import { useAuth } from '../lib/auth';
import { useLanguage } from '../i18n/LanguageContext';
import { canAuthorNuQuestion } from '../lib/nuQuestionFlow';

// Route guard for /admin/admissions/questions (NU-7) — Owner,
// Admin, or a VERIFIED teacher. Deliberately NOT AdminGuard: the
// admin dashboard guard is OWNER-ONLY, while the question
// workbench is where verified teachers write and review questions
// (design §19.6.1). A pending/rejected teacher, a student, a
// guardian, or a signed-out visitor sees the denied page. The
// guard is UX only — firestore.rules enforce every read/write.
export function NuQuestionWorkbenchGuard(props: { children: ReactNode }) {
  const { user, profile, loading } = useAuth();
  const { t } = useLanguage();
  if (loading) {
    return (
      <PageShell titleBn="প্রশ্নব্যাংক" titleEn="Question bank">
        <p aria-live="polite" style={{ color: '#57616A' }}>
          {t({ bn: 'লোড হচ্ছে…', en: 'Loading…' })}
        </p>
      </PageShell>
    );
  }
  if (!user || !canAuthorNuQuestion(profile)) {
    return (
      <PageShell titleBn="অনুমতি নেই" titleEn="Access denied">
        <p>
          {t({
            bn: 'এই পাতাটি শুধু মালিক, অ্যাডমিন ও যাচাইকৃত শিক্ষকের জন্য। প্রশ্ন লিখতে বা পর্যালোচনা করতে শিক্ষক যাচাই প্রয়োজন।',
            en: 'This page is only for the owner, admins and verified teachers. Teacher verification is required to write or review questions.',
          })}
        </p>
      </PageShell>
    );
  }
  return <>{props.children}</>;
}
