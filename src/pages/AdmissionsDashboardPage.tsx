// Eduvelto — Admission Candidate Dashboard (NU-5, 22 Nov 2026;
// design doc §5.10, §8).
//
// ROUTE DECISION (NU-Q6, FINAL): `/admissions/dashboard` — the
// section-scoped dashboard, following Job's `/jobs/dashboard`
// precedent; the roadmap's `/dashboard/admissions` predates that
// pattern. Recorded in team/nu-admission-status.md.
//
// The full dashboard (17 items, §8) is NU-11 — this page is the
// honest placeholder for it: it lists the 17 items as PLANNED, with
// no numbers, no progress, no results — because none of that data
// exists yet. It links to what DOES exist today (the NU hub, the
// profile). It never shows a fake streak, score or rank.

import { Link } from 'react-router-dom';
import { PageShell, EmptyState } from '../components/PageShell';
import { Card, LinkButton } from '../components/ui';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../lib/auth';
import { NU_HUB_ROUTE } from '../lib/nuStructure';

const PLANNED_ITEMS: { bn: string; en: string }[] = [
  { bn: 'প্রোফাইল — লক্ষ্য প্রতিষ্ঠান ও শাখা', en: 'Profile — target institution and group' },
  { bn: 'মোড (Beginner / Advanced)', en: 'Mode (Beginner / Advanced)' },
  { bn: 'লক্ষ্য প্রতিষ্ঠান ও শাখা', en: 'Target institution and group' },
  { bn: 'শেখার অগ্রগতি', en: 'Learning progress' },
  { bn: 'দৈনিক লক্ষ্য', en: 'Daily goal' },
  { bn: 'প্ল্যানার', en: 'Planner' },
  { bn: 'চালিয়ে যান', en: 'Continue learning' },
  { bn: 'সাম্প্রতিক পরীক্ষা', en: 'Recent exams' },
  { bn: 'ফলাফল', en: 'Results' },
  { bn: 'দুর্বল বিষয়', en: 'Weak subjects' },
  { bn: 'ভুল-উত্তর নোটবুক', en: 'Wrong-answer notebook' },
  { bn: 'ফেভারিট', en: 'Favourites' },
  { bn: 'রিভিশন সময়সূচি', en: 'Revision schedule' },
  { bn: 'অর্জন', en: 'Achievements' },
  { bn: 'ভর্তি বিজ্ঞপ্তি', en: 'Admission notices' },
  { bn: 'ক্যালেন্ডার', en: 'Calendar' },
  { bn: 'নোটিফিকেশন', en: 'Notifications' },
];

export default function AdmissionsDashboardPage() {
  const { t } = useLanguage();
  const { user, profile } = useAuth();
  return (
    <PageShell titleBn="আমার ভর্তি ড্যাশবোর্ড" titleEn="My Admission Dashboard" wide hideHomeLink>
      <p style={{ marginTop: 0 }}>
        <Link to="/admissions" style={{ fontWeight: 600 }}>
          {t({ bn: '← ভর্তি প্রস্তুতি', en: '← Admission Preparation' })}
        </Link>
      </p>
      {!user ? (
        <div>
          <EmptyState
            bn="ভর্তি ড্যাশবোর্ড দেখতে লগইন করুন।"
            en="Sign in to see your admission dashboard."
          />
          <p style={{ marginTop: 12 }}>
            <LinkButton to="/login" variant="primary">
              {t({ bn: 'লগইন করুন', en: 'Sign in' })}
            </LinkButton>
          </p>
        </div>
      ) : (
        <div>
          <p style={{ fontSize: 16, lineHeight: 1.8, color: 'var(--ink-soft)' }}>
            {t({
              bn: `স্বাগতম${profile?.displayName ? `, ${profile.displayName}` : ''} — আপনার ভর্তি ড্যাশবোর্ড তৈরি হচ্ছে।`,
              en: `Welcome${profile?.displayName ? `, ${profile.displayName}` : ''} — your admission dashboard is being built.`,
            })}
          </p>
          <EmptyState
            bn="এখনো কোনো অগ্রগতি, ফলাফল বা মক নেই — তাই এখানে কোনো সংখ্যা দেখানো হয়নি। অনুশীলন ও মক শুরু হলে আপনার আসল অগ্রগতি এখানে আসবে।"
            en="There is no progress, result or mock yet — so no number is shown here. Once practice and mocks begin, your real progress will appear here."
          />
          <p style={{ marginTop: 16 }}>
            <LinkButton to={NU_HUB_ROUTE} variant="primary">
              {t({ bn: 'জাতীয় বিশ্ববিদ্যালয় হাবে যান', en: 'Go to the National University hub' })} →
            </LinkButton>{' '}
            <LinkButton to="/profile" variant="outline">
              {t({ bn: 'প্রোফাইল দেখুন', en: 'View profile' })}
            </LinkButton>
          </p>
        </div>
      )}
      <h2 style={{ fontSize: 19, color: 'var(--heading)', marginTop: 28 }}>
        {t({ bn: 'ড্যাশবোর্ডে যা আসবে (১৭টি আইটেম — পরিকল্পনায়)', en: 'What the dashboard will have (17 items — planned)' })}
      </h2>
      <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        {PLANNED_ITEMS.map((item, i) => (
          <Card key={item.bn} style={{ opacity: 0.85 }}>
            <span style={{ color: 'var(--muted)', fontSize: 13 }}>{i + 1}.</span>{' '}
            <strong style={{ fontSize: 15 }}>{t({ bn: item.bn, en: item.en })}</strong>
            <p style={{ margin: '6px 0 0', color: 'var(--muted-ivory)', fontSize: 13 }}>
              {t({ bn: 'শীঘ্রই আসছে — NU-১১-এ', en: 'Coming soon — in NU-11' })}
            </p>
          </Card>
        ))}
      </div>
      <p style={{ marginTop: 20, color: 'var(--muted-ivory)', fontSize: 14, lineHeight: 1.8 }}>
        {t({
          bn: 'প্রথম রিলিজে শুধু চালিয়ে যান, অনুশীলন-ইতিহাস, সাম্প্রতিক ফলাফল, ভর্তি-তথ্য ও আসন্ন বিজ্ঞপ্তি থাকবে — বাকি ধাপে ধাপে (ডিজাইন §৮)।',
          en: 'The first release will have only continue-learning, practice history, recent results, admission information and upcoming notices — the rest step by step (design §8).',
        })}
      </p>
    </PageShell>
  );
}
