// Eduvelto — Admin: Job Management hub (Step 15 rewrite).
//
// The old page was a stale mockup ("চাকরি প্রস্তুতি বিভাগ এখনো
// তৈরি হয়নি — ০টি পরীক্ষা · ০টি প্রশ্ন") — false since Steps
// 8–14 shipped the Job section live. This page is now the Job
// admin home (design §6.1, adapted to what Step 15 manages):
// real queue tiles (counts from ONE capped query — never
// guessed), quick actions, and recent circular activity (from
// recently updated circulars — the adminActions audit log is
// owner-read-only, so moderators see activity from the docs
// themselves, not the log).
//
// Roles (ChatGPT + Gemini, reconciled — see the Step 15 report):
// Super Admin = owner; Circular Editor + Verifier + Notification
// Admin = moderator (task separation in the UI + the
// no-self-approval guard + audit log, not separate role rows).
// AdminGuard already limits /admin/* to the owner in v1, so the
// owner does all three jobs here; when moderators are admitted,
// the same pages serve them.

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { AlertBox, Card, Chip } from '../components/ui';
import { EmptyAdminBox, LoadingBox } from '../components/AdminShared';
import {
  listAdminCirculars,
  loadAdminCircularCounts,
  type AdminCircularPage,
} from '../lib/jobAdminCirculars';
import { formatDhakaDate, toBanglaDigits } from '../lib/jobCirculars';
import { jobExamBySlug } from '../lib/jobExams';
import { listJobCorrections } from '../lib/jobReports';

export default function AdminJobsPage() {
  const { t, lang } = useLanguage();
  const [counts, setCounts] = useState<Awaited<ReturnType<typeof loadAdminCircularCounts>> | null>(null);
  const [recent, setRecent] = useState<AdminCircularPage | null>(null);
  const [openCorrections, setOpenCorrections] = useState<number | null>(null);
  const [error, setError] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);

  useEffect(() => {
    let alive = true;
    setCounts(null);
    setRecent(null);
    setOpenCorrections(null);
    setError(false);
    Promise.all([
      loadAdminCircularCounts(),
      listAdminCirculars({ pageSize: 5 }),
      listJobCorrections({ status: 'pending', pageSize: 25 }).catch(() => [] as Awaited<ReturnType<typeof listJobCorrections>>),
    ])
      .then(([c, r, corr]) => {
        if (!alive) return;
        setCounts(c);
        setRecent(r);
        setOpenCorrections(corr.length);
      })
      .catch(() => {
        if (alive) setError(true);
      });
    return () => {
      alive = false;
    };
  }, [retryNonce]);

  const n = (v: number, capped: boolean) =>
    lang === 'bn' ? `${toBanglaDigits(v)}${capped ? '+' : ''}` : `${v}${capped ? '+' : ''}`;

  return (
    <div>
      <h1 className="ev-admin-page-title">{t({ bn: 'চাকরি ব্যবস্থাপনা', en: 'Job Management' })}</h1>

      <p className="ev-admin-note">
        {t({
          bn: 'চাকরি প্রস্তুতি বিভাগের অ্যাডমিন কাজ — সার্কুলার যাচাই, ছাত্রদের রিপোর্ট ও সংশোধনের অনুরোধ, অনুমোদিত ডোমেইন। সংখ্যাগুলো আসল ডেটা থেকে; খালি থাকলে খালিই দেখাবে।',
          en: 'Job Preparation admin work — circular verification, student reports and correction requests, approved domains. All numbers are real data; empty stays empty.',
        })}
      </p>

      {error ? (
        <AlertBox tone="error" onRetry={() => setRetryNonce((x) => x + 1)}>
          {t({ bn: 'তথ্য লোড করা যায়নি। আবার চেষ্টা করুন।', en: 'Could not load the data. Try again.' })}
        </AlertBox>
      ) : counts === null ? (
        <LoadingBox />
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: 12,
              margin: '16px 0',
            }}
          >
            <Link to="/admin/jobs/circulars?tab=pending" style={{ textDecoration: 'none' }}>
              <Card>
                <div style={{ fontSize: 28, fontWeight: 800 }}>{n(counts.pending, counts.capped)}</div>
                <div style={{ fontSize: 13 }}>{t({ bn: 'যাচাইয়ের অপেক্ষায়', en: 'Pending verification' })}</div>
              </Card>
            </Link>
            <Link to="/admin/jobs/circulars?tab=returned" style={{ textDecoration: 'none' }}>
              <Card>
                <div style={{ fontSize: 28, fontWeight: 800 }}>{n(counts.returned, counts.capped)}</div>
                <div style={{ fontSize: 13 }}>{t({ bn: 'ফেরত পাঠানো', en: 'Returned for changes' })}</div>
              </Card>
            </Link>
            <Link to="/admin/jobs/circulars?tab=published" style={{ textDecoration: 'none' }}>
              <Card>
                <div style={{ fontSize: 28, fontWeight: 800 }}>{n(counts.published, counts.capped)}</div>
                <div style={{ fontSize: 13 }}>{t({ bn: 'প্রকাশিত সার্কুলার', en: 'Published circulars' })}</div>
              </Card>
            </Link>
            <Link to="/admin/jobs/reports" style={{ textDecoration: 'none' }}>
              <Card>
                <div style={{ fontSize: 28, fontWeight: 800 }}>
                  {t({ bn: 'রিপোর্ট দেখুন', en: 'See reports' })}
                </div>
                <div style={{ fontSize: 13 }}>{t({ bn: 'ছাত্রদের রিপোর্ট', en: 'Student reports' })}</div>
              </Card>
            </Link>
            <Link to="/admin/jobs/corrections" style={{ textDecoration: 'none' }}>
              <Card>
                <div style={{ fontSize: 28, fontWeight: 800 }}>
                  {openCorrections === null ? '—' : n(openCorrections, false)}
                </div>
                <div style={{ fontSize: 13 }}>{t({ bn: 'খোলা সংশোধনের অনুরোধ', en: 'Open correction requests' })}</div>
              </Card>
            </Link>
          </div>
          {counts.capped ? (
            <p style={{ fontSize: 13, color: 'var(--muted-ivory)', marginTop: -4 }}>
              {t({
                bn: 'সংখ্যাগুলো প্রথম ১০০টি বিজ্ঞপ্তি থেকে গোনা — এর বেশি থাকলে “+” দেখাবে।',
                en: 'Counts are from the first 100 circulars — a “+” means there are more.',
              })}
            </p>
          ) : null}

          <h2 style={{ fontSize: 17, margin: '20px 0 10px' }}>
            {t({ bn: 'দ্রুত কাজ', en: 'Quick actions' })}
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <Link to="/admin/jobs/circulars/new">{t({ bn: '＋ সার্কুলার যোগ করুন', en: '+ Add circular' })}</Link>
            <Link to="/admin/jobs/circulars?tab=pending">{t({ bn: 'যাচাইয়ের সারি', en: 'Verification queue' })}</Link>
            <Link to="/admin/jobs/reports">{t({ bn: 'রিপোর্ট দেখুন', en: 'See reports' })}</Link>
            <Link to="/admin/jobs/corrections">{t({ bn: 'সংশোধনের অনুরোধ', en: 'Correction requests' })}</Link>
            <Link to="/admin/jobs/domains">{t({ bn: 'অনুমোদিত ডোমেইন', en: 'Approved domains' })}</Link>
          </div>

          <h2 style={{ fontSize: 17, margin: '24px 0 10px' }}>
            {t({ bn: 'সাম্প্রতিক বিজ্ঞপ্তি', en: 'Recent circulars' })}
          </h2>
          {recent === null ? (
            <LoadingBox />
          ) : recent.items.length === 0 ? (
            <EmptyAdminBox
              bn="এখনো কোনো সার্কুলার সংরক্ষিত হয়নি — অফিসিয়াল বিজ্ঞপ্তি এলে এখানে আসবে।"
              en="No circulars saved yet — they will appear here when an official notice arrives."
              nextBn="“সার্কুলার যোগ করুন” দিয়ে প্রথম বিজ্ঞপ্তিটি যোগ করুন।"
              nextEn="Add the first circular with “Add circular”."
            />
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {recent.items.map((c) => {
                const exam = jobExamBySlug(c.examSlug);
                return (
                  <Link
                    key={c.docId}
                    to={`/admin/jobs/circulars/${c.docId}`}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <Card>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: 15 }}>{c.postTitleBn}</strong>
                        <Chip tone={c.reviewStatus === 'published' ? 'blue' : c.reviewStatus === 'verified' ? 'gold' : 'outline'}>
                          {c.reviewStatus === 'published'
                            ? t({ bn: 'প্রকাশিত', en: 'Published' })
                            : c.reviewStatus === 'verified'
                              ? t({ bn: 'যাচাইকৃত', en: 'Verified' })
                              : c.reviewStatus === 'in-review'
                                ? t({ bn: 'যাচাইয়ের অপেক্ষায়', en: 'Pending verification' })
                                : c.reviewStatus === 'rejected'
                                  ? t({ bn: 'বাতিল', en: 'Rejected' })
                                  : t({ bn: 'খসড়া', en: 'Draft' })}
                        </Chip>
                      </div>
                      <div style={{ fontSize: 13, marginTop: 4 }}>
                        {exam ? exam.bn : c.examSlug}
                        {c.updatedAtMillis !== null
                          ? ` · ${t({ bn: 'সর্বশেষ হালনাগাদ', en: 'Last updated' })}: ${formatDhakaDate(c.updatedAtMillis, lang, false)}`
                          : ''}
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
