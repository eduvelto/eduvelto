// Eduvelto — Admin: circular verification queue (Step 15).
//
// /admin/jobs/circulars — the triage home (ChatGPT's "most
// important screen"; Gemini's /admin/circulars). Filter chips
// with counts, compact cards (Bangla title, org badge, deadline
// Asia/Dhaka, submitted time, status pill). Desktop: the same
// cards in a grid — no wide tables (mobile-first admin).
//
// Tabs: pending (in-review) · returned (draft + reviewNote) ·
// draft · verified · published · rejected · all. 'returned' is
// ChatGPT's "changes requested" state, expressed on our
// reviewStatus + reviewNote (see the Step 15 report).

import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { AlertBox, Card, Chip } from '../components/ui';
import { EmptyAdminBox, LoadingBox } from '../components/AdminShared';
import {
  ADMIN_TAB_STATUSES,
  listAdminCirculars,
  loadAdminCircularCounts,
  type AdminCircularTab,
} from '../lib/jobAdminCirculars';
import {
  circularApplicationStatus,
  CIRCULAR_STATUS_BN,
  CIRCULAR_STATUS_EN,
  formatDhakaDate,
  toBanglaDigits,
  type JobCircular,
} from '../lib/jobCirculars';
import { jobExamBySlug } from '../lib/jobExams';

const TABS: AdminCircularTab[] = ['pending', 'returned', 'draft', 'verified', 'published', 'rejected', 'all'];

const TAB_BN: Record<AdminCircularTab, string> = {
  pending: 'যাচাইয়ের অপেক্ষায়',
  returned: 'ফেরত পাঠানো',
  draft: 'খসড়া',
  verified: 'যাচাইকৃত',
  published: 'প্রকাশিত',
  rejected: 'বাতিল',
  all: 'সব',
};

const REVIEW_BN: Record<string, string> = {
  draft: 'খসড়া',
  'in-review': 'যাচাইয়ের অপেক্ষায়',
  verified: 'যাচাইকৃত',
  published: 'প্রকাশিত',
  rejected: 'বাতিল',
};

export default function AdminJobCircularsPage() {
  const { t, lang } = useLanguage();
  const [params, setParams] = useSearchParams();
  const tabParam = params.get('tab');
  const tab: AdminCircularTab = TABS.includes(tabParam as AdminCircularTab)
    ? (tabParam as AdminCircularTab)
    : 'pending';
  const [items, setItems] = useState<JobCircular[] | null>(null);
  const [counts, setCounts] = useState<Awaited<ReturnType<typeof loadAdminCircularCounts>> | null>(null);
  const [error, setError] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let alive = true;
    setItems(null);
    setError(false);
    const statuses = ADMIN_TAB_STATUSES[tab];
    const loads: Array<Promise<{ items: JobCircular[] }>> = [];
    if (statuses === null) {
      loads.push(listAdminCirculars({ pageSize: 25 }));
    } else if (tab === 'returned') {
      loads.push(listAdminCirculars({ reviewStatus: 'draft', returnedOnly: true, pageSize: 25 }));
    } else {
      for (const s of statuses) loads.push(listAdminCirculars({ reviewStatus: s, pageSize: 25 }));
    }
    Promise.all([...loads, loadAdminCircularCounts()])
      .then((results) => {
        if (!alive) return;
        const c = results[results.length - 1] as Awaited<ReturnType<typeof loadAdminCircularCounts>>;
        setCounts(c);
        const merged = (results.slice(0, -1) as Array<{ items: JobCircular[] }>).flatMap((r) => r.items);
        merged.sort((a, b) => (b.updatedAtMillis ?? -1) - (a.updatedAtMillis ?? -1));
        setItems(merged);
      })
      .catch(() => {
        if (alive) setError(true);
      });
    return () => {
      alive = false;
    };
  }, [tab, retryNonce]);

  const visible = useMemo(() => {
    if (!items) return [];
    const q = search.trim().toLocaleLowerCase();
    if (!q) return items;
    return items.filter((c) =>
      [c.postTitleBn, c.postTitleEn, c.circularNumber ?? '', c.examSlug].join(' ').toLocaleLowerCase().includes(q),
    );
  }, [items, search]);

  const countFor = (tb: AdminCircularTab): number | null => {
    if (!counts) return null;
    if (tb === 'all') return counts.total;
    return counts[tb];
  };

  return (
    <div>
      <h1 className="ev-admin-page-title">{t({ bn: 'সার্কুলার যাচাই', en: 'Circular verification' })}</h1>
      <p className="ev-admin-note">
        {t({
          bn: 'যাচাইয়ের সারি — সবচেয়ে আগে যাচাইয়ের অপেক্ষায় থাকা বিজ্ঞপ্তিগুলো। কোনো বিজ্ঞপ্তি যাচাই ছাড়া প্রকাশিত হয় না।',
          en: 'The verification queue — pending items first. No circular publishes without verification.',
        })}
      </p>

      <div style={{ marginBottom: 12 }}>
        <Link to="/admin/jobs/circulars/new">{t({ bn: '＋ সার্কুলার যোগ করুন', en: '+ Add circular' })}</Link>
      </div>

      <div className="ev-ceo-tabs" role="tablist" aria-label={t({ bn: 'সার্কুলার অবস্থা', en: 'Circular status' })}>
        {TABS.map((tb) => (
          <button
            key={tb}
            type="button"
            role="tab"
            aria-selected={tab === tb}
            className={`ev-ceo-tab${tab === tb ? ' ev-ceo-tab-active' : ''}`}
            onClick={() => setParams({ tab: tb })}
          >
            {t({ bn: TAB_BN[tb], en: tb })}
            {countFor(tb) !== null ? ` (${lang === 'bn' ? toBanglaDigits(countFor(tb) as number) : countFor(tb)})` : ''}
          </button>
        ))}
      </div>

      <div style={{ margin: '12px 0' }}>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t({ bn: 'অনুসন্ধান — শিরোনাম / স্মারক নম্বর / পরীক্ষা', en: 'Search — title / memo number / exam' }) as string}
          aria-label={t({ bn: 'অনুসন্ধান', en: 'Search' })}
          style={{ width: '100%', padding: '10px 12px', fontSize: 15, borderRadius: 8 }}
        />
      </div>

      {error ? (
        <AlertBox tone="error" onRetry={() => setRetryNonce((x) => x + 1)}>
          {t({ bn: 'তথ্য লোড করা যায়নি। আবার চেষ্টা করুন।', en: 'Could not load the data. Try again.' })}
        </AlertBox>
      ) : items === null ? (
        <LoadingBox />
      ) : visible.length === 0 ? (
        <EmptyAdminBox
          bn={
            tab === 'pending'
              ? 'যাচাইয়ের অপেক্ষায় কোনো বিজ্ঞপ্তি নেই।'
              : tab === 'returned'
                ? 'ফেরত পাঠানো কোনো বিজ্ঞপ্তি নেই।'
                : 'এই অবস্থায় কোনো বিজ্ঞপ্তি নেই।'
          }
          en={
            tab === 'pending'
              ? 'No circulars are waiting for verification.'
              : tab === 'returned'
                ? 'No circulars were returned for changes.'
                : 'No circulars in this state.'
          }
          nextBn="“সার্কুলার যোগ করুন” দিয়ে নতুন বিজ্ঞপ্তি যোগ করুন।"
          nextEn="Add a new circular with “Add circular”."
        />
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {visible.map((c) => {
            const exam = jobExamBySlug(c.examSlug);
            const status = circularApplicationStatus(c);
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
                      {REVIEW_BN[c.reviewStatus] ?? c.reviewStatus}
                    </Chip>
                  </div>
                  <div style={{ fontSize: 13, marginTop: 4 }}>
                    {exam ? exam.bn : c.examSlug}
                    {c.circularNumber ? ` · ${t({ bn: 'স্মারক', en: 'Memo' })}: ${c.circularNumber}` : ''}
                  </div>
                  <div style={{ fontSize: 13, marginTop: 4 }}>
                    {t({ bn: 'আবেদনের অবস্থা', en: 'Application status' })}: {lang === 'bn' ? CIRCULAR_STATUS_BN[status] : CIRCULAR_STATUS_EN[status]}
                    {c.applicationDeadlineMillis !== null
                      ? ` · ${t({ bn: 'শেষ তারিখ', en: 'Deadline' })}: ${formatDhakaDate(c.applicationDeadlineMillis, lang, c.deadlinePrecision === 'datetime')}`
                      : ` · ${t({ bn: 'শেষ তারিখ: তথ্য পাওয়া যায়নি', en: 'Deadline: not available' })}`}
                  </div>
                  {c.reviewNote ? (
                    <div style={{ fontSize: 13, marginTop: 6, color: '#8a5a00' }}>
                      {t({ bn: 'ফেরতের কারণ', en: 'Return reason' })}: {c.reviewNote}
                    </div>
                  ) : null}
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
