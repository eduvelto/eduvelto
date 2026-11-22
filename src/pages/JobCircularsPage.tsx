// Eduvelto — Job circulars list (Step 14).
//
// /jobs/circulars — public page (works signed-out): published
// government recruitment notices, newest verified first.
// Filters run over the fetched page (the Firestore query
// already restricts to published docs + one exam when a chip
// is active — see listPublishedCirculars). Status is computed
// from the official dates, so it can only ever be a
// client-side filter. Filters live in the URL (?exam=&status=
// &verified=&q=) so they survive going back from a detail page.
//
// HONESTY (binding): verification and application status are
// two separate dimensions; a missing deadline is "তথ্য পাওয়া
// যায়নি" (never guessed, no countdown, no Open badge); the
// Apply action appears only for verified circulars with a
// confirmed apply link and an open window; closed circulars
// stay listed (archived for exam prep / history).

import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { AlertBox, Button, Card, Chip, LinkButton, Skeleton } from '../components/ui';
import { useLanguage } from '../i18n/LanguageContext';
import { JOB_EXAMS, jobExamBySlug } from '../lib/jobExams';
import {
  canShowApply,
  CIRCULAR_STATUS_BN,
  CIRCULAR_STATUS_EN,
  circularApplicationStatus,
  circularDeadlineLine,
  circularDomain,
  filterCirculars,
  formatDhakaDate,
  isCircularVerified,
  sortCirculars,
  type CircularApplicationStatus,
  type CircularFilters,
  type JobCircular,
} from '../lib/jobCirculars';
import { listPublishedCirculars } from '../lib/jobCircularsData';
import type { DocumentSnapshot } from 'firebase/firestore';

const STATUS_FILTERS: Array<{ key: CircularApplicationStatus | null; bn: string; en: string }> = [
  { key: null, bn: 'সব অবস্থা', en: 'All statuses' },
  { key: 'open', bn: 'আবেদন চলছে', en: 'Open' },
  { key: 'closing-soon', bn: 'শিগগির শেষ হবে', en: 'Closing soon' },
  { key: 'closed', bn: 'আবেদন শেষ', en: 'Closed' },
  { key: 'unknown', bn: 'তথ্য পাওয়া যায়নি', en: 'Unknown' },
];

function examLabel(slug: string, lang: string): string {
  const def = jobExamBySlug(slug);
  if (!def) return slug;
  return lang === 'bn' ? def.bn : def.en;
}

function CircularCard({ c, lang }: { c: JobCircular; lang: string }) {
  const { t } = useLanguage();
  const nowMs = Date.now();
  const status = circularApplicationStatus(c, nowMs);
  const verified = isCircularVerified(c);
  const deadlineLine = circularDeadlineLine(c, nowMs);
  const showApply = canShowApply(c, nowMs);
  return (
    <Card>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', marginBottom: 6 }}>
        <Chip tone={status === 'closed' ? 'outline' : status === 'closing-soon' ? 'gold' : 'blue'}>
          {t({ bn: CIRCULAR_STATUS_BN[status], en: CIRCULAR_STATUS_EN[status] })}
        </Chip>
        {verified ? (
          <Chip tone="blue">{t({ bn: 'সরকারি উৎসে যাচাইকৃত ✓', en: 'Verified from official source ✓' })}</Chip>
        ) : (
          <Chip tone="outline">{t({ bn: 'যাচাই করা হয়নি', en: 'Not verified' })}</Chip>
        )}
      </div>
      <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 16, lineHeight: 1.5 }}>
        <Link to={`/jobs/circulars/${c.docId}`}>{lang === 'bn' ? c.postTitleBn : c.postTitleEn}</Link>
      </div>
      <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 2 }}>
        {examLabel(c.examSlug, lang)}
        {c.circularNumber ? ` · ${t({ bn: 'সার্কুলার নম্বর', en: 'Circular no.' })}: ${c.circularNumber}` : ''}
      </div>
      <dl style={{ margin: '10px 0 0', fontSize: 14, lineHeight: 1.7 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <dt style={{ color: 'var(--muted)', minWidth: 96 }}>{t({ bn: 'পদসংখ্যা', en: 'Posts' })}</dt>
          <dd style={{ margin: 0, fontWeight: 600 }}>
            {c.totalPosts !== null
              ? t({ bn: `${c.totalPosts}টি`, en: `${c.totalPosts}` })
              : t({ bn: 'উল্লেখ নেই', en: 'Not stated' })}
          </dd>
        </div>
        {c.publishedDateMillis !== null && (
          <div style={{ display: 'flex', gap: 8 }}>
            <dt style={{ color: 'var(--muted)', minWidth: 96 }}>{t({ bn: 'প্রকাশিত', en: 'Published' })}</dt>
            <dd style={{ margin: 0 }}>{formatDhakaDate(c.publishedDateMillis, lang, false)}</dd>
          </div>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <dt style={{ color: 'var(--muted)', minWidth: 96 }}>{t({ bn: 'শেষ তারিখ', en: 'Deadline' })}</dt>
          <dd style={{ margin: 0, fontWeight: 600 }}>
            {c.applicationDeadlineMillis !== null
              ? formatDhakaDate(c.applicationDeadlineMillis, lang, c.deadlinePrecision === 'datetime')
              : t({ bn: 'উল্লেখ নেই', en: 'Not stated' })}
          </dd>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <dt style={{ color: 'var(--muted)', minWidth: 96 }}>{t({ bn: 'অবস্থা', en: 'Status' })}</dt>
          <dd style={{ margin: 0 }}>{lang === 'bn' ? deadlineLine.bn : deadlineLine.en}</dd>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <dt style={{ color: 'var(--muted)', minWidth: 96 }}>{t({ bn: 'উৎস', en: 'Source' })}</dt>
          <dd style={{ margin: 0 }}>{circularDomain(c.officialUrl)}</dd>
        </div>
      </dl>
      <p style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '12px 0 0' }}>
        <LinkButton to={`/jobs/circulars/${c.docId}`} variant="outline">
          {t({ bn: 'বিস্তারিত দেখুন →', en: 'See details →' })}
        </LinkButton>
        {showApply && c.applyUrl ? (
          <a
            href={c.applyUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'inline-block',
              padding: '8px 14px',
              borderRadius: 8,
              background: 'var(--accent)',
              color: 'var(--on-accent)',
              fontWeight: 700,
              fontSize: 14,
              textDecoration: 'none',
            }}
          >
            {t({ bn: 'আবেদন করুন ↗', en: 'Apply ↗' })} · {circularDomain(c.applyUrl)}
          </a>
        ) : null}
      </p>
    </Card>
  );
}

export default function JobCircularsPage() {
  const { t, lang } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<JobCircular[] | null>(null);
  const [cursor, setCursor] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [dataError, setDataError] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);
  const [searchInput, setSearchInput] = useState(searchParams.get('q') ?? '');
  const [search, setSearch] = useState(searchParams.get('q') ?? '');

  const filters: CircularFilters = useMemo(
    () => ({
      examSlug: searchParams.get('exam'),
      status: (searchParams.get('status') as CircularApplicationStatus | null) ?? null,
      verifiedOnly: searchParams.get('verified') === '1',
      search,
    }),
    [searchParams, search],
  );

  // Debounced search (300ms) — typing never refetches; the
  // filter runs over the already-loaded page.
  useEffect(() => {
    const id = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(id);
  }, [searchInput]);

  const examSlug = filters.examSlug;

  useEffect(() => {
    let alive = true;
    setItems(null);
    setCursor(null);
    setHasMore(false);
    setDataError(false);
    listPublishedCirculars({ examSlug })
      .then((page) => {
        if (!alive) return;
        setItems(page.items);
        setCursor(page.cursor);
        setHasMore(page.hasMore);
      })
      .catch(() => {
        if (alive) {
          setItems([]);
          setDataError(true);
        }
      });
    return () => {
      alive = false;
    };
  }, [examSlug, retryNonce]);

  const visible = useMemo(() => {
    if (!items) return [];
    return filterCirculars(sortCirculars(items), filters, Date.now(), (s) => examLabel(s, lang));
  }, [items, filters, lang]);

  function updateParams(next: Partial<{ exam: string | null; status: string | null; verified: string | null; q: string | null }>) {
    const p = new URLSearchParams(searchParams);
    for (const [k, v] of Object.entries(next)) {
      if (v === null || v === '') p.delete(k);
      else p.set(k, v);
    }
    setSearchParams(p, { replace: true });
  }

  async function loadMore() {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await listPublishedCirculars({ examSlug, cursor });
      setItems((prev) => [...(prev ?? []), ...page.items]);
      setCursor(page.cursor);
      setHasMore(page.hasMore);
    } catch {
      setDataError(true);
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <PageShell titleBn="চাকরির বিজ্ঞপ্তি" titleEn="Job circulars" wide>
      <p style={{ margin: '0 0 16px', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
        {t({
          bn: 'সরকারি চাকরির বিজ্ঞপ্তি — সব তথ্য সরকারি উৎস থেকে। যাচাই না হলে "যাচাই করা হয়নি" লেখা থাকে; শেষ তারিখ না জানা থাকলে অনুমান করে দেখানো হয় না।',
          en: 'Government job circulars — all information from official sources. Unverified items say so; an unknown deadline is never guessed.',
        })}
      </p>

      <div style={{ marginBottom: 12 }}>
        <label htmlFor="circular-search" style={{ display: 'block', fontSize: 13, color: 'var(--muted)', marginBottom: 4 }}>
          {t({ bn: 'খুঁজুন (পরীক্ষা / পদ / সংস্থা)', en: 'Search (exam / post / organisation)' })}
        </label>
        <input
          id="circular-search"
          type="search"
          value={searchInput}
          onChange={(e) => {
            setSearchInput(e.target.value);
            updateParams({ q: e.target.value.trim() === '' ? null : e.target.value });
          }}
          placeholder={t({ bn: 'যেমন: বিসিএস, ব্যাংক, প্রাথমিক', en: 'e.g. BCS, Bank, Primary' })}
          style={{
            width: '100%',
            maxWidth: 480,
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            color: 'var(--text)',
            fontSize: 15,
          }}
        />
      </div>

      <div
        style={{
          display: 'flex',
          gap: 6,
          overflowX: 'auto',
          paddingBottom: 6,
          marginBottom: 8,
        }}
        role="group"
        aria-label={t({ bn: 'পরীক্ষা', en: 'Exam' })}
      >
        <Chip tone={filters.examSlug === null ? 'navy' : 'outline'}>
          <button
            type="button"
            onClick={() => updateParams({ exam: null })}
            style={{ all: 'unset', cursor: 'pointer' }}
          >
            {t({ bn: 'সব', en: 'All' })}
          </button>
        </Chip>
        {JOB_EXAMS.map((e) => (
          <Chip key={e.slug} tone={filters.examSlug === e.slug ? 'navy' : 'outline'}>
            <button type="button" onClick={() => updateParams({ exam: e.slug })} style={{ all: 'unset', cursor: 'pointer' }}>
              {lang === 'bn' ? e.bn : e.en}
            </button>
          </Chip>
        ))}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
        {STATUS_FILTERS.map((s) => (
          <Chip key={s.key ?? 'all'} tone={filters.status === s.key ? 'navy' : 'outline'}>
            <button
              type="button"
              onClick={() => updateParams({ status: s.key })}
              style={{ all: 'unset', cursor: 'pointer' }}
            >
              {lang === 'bn' ? s.bn : s.en}
            </button>
          </Chip>
        ))}
        <Chip tone={filters.verifiedOnly ? 'navy' : 'outline'}>
          <button
            type="button"
            onClick={() => updateParams({ verified: filters.verifiedOnly ? null : '1' })}
            style={{ all: 'unset', cursor: 'pointer' }}
            aria-pressed={filters.verifiedOnly}
          >
            {t({ bn: 'শুধু যাচাইকৃত', en: 'Verified only' })}
          </button>
        </Chip>
      </div>

      {dataError && (
        <AlertBox tone="error">
          {t({ bn: 'বিজ্ঞপ্তি লোড করা যায়নি — সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।', en: 'Could not load circulars — check your connection and try again.' })}{' '}
          <button type="button" onClick={() => setRetryNonce((n) => n + 1)} style={{ all: 'unset', cursor: 'pointer', fontWeight: 700, textDecoration: 'underline' }}>
            {t({ bn: 'আবার চেষ্টা করুন', en: 'Try again' })}
          </button>
        </AlertBox>
      )}

      {items === null ? (
        <div style={{ display: 'grid', gap: 12 }}>
          <Skeleton height={140} />
          <Skeleton height={140} />
        </div>
      ) : items.length === 0 ? (
        <Card>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.7 }}>
            {t({
              bn: 'এখনো কোনো সার্কুলার সংরক্ষিত হয়নি — অফিসিয়াল বিজ্ঞপ্তি এলে এখানে আসবে।',
              en: 'No circular has been saved yet — when an official circular arrives, it will appear here.',
            })}
          </p>
        </Card>
      ) : visible.length === 0 ? (
        <Card>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.7 }}>
            {t({
              bn: 'এই ফিল্টারে কোনো বিজ্ঞপ্তি মিলছে না — ফিল্টার বদলে দেখুন।',
              en: 'No circular matches this filter — try changing the filter.',
            })}
          </p>
        </Card>
      ) : (
        <>
          <div style={{ display: 'grid', gap: 12 }}>
            {visible.map((c) => (
              <CircularCard key={c.docId} c={c} lang={lang} />
            ))}
          </div>
          {hasMore && (
            <p style={{ marginTop: 16 }}>
              <Button onClick={loadMore} disabled={loadingMore}>
                {loadingMore
                  ? t({ bn: 'লোড হচ্ছে…', en: 'Loading…' })
                  : t({ bn: 'আরও বিজ্ঞপ্তি লোড করুন', en: 'Load more circulars' })}
              </Button>
            </p>
          )}
          <p style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.7 }}>
            {t({
              bn: `দেখানো হচ্ছে ${visible.length}টি বিজ্ঞপ্তি। আবেদনের অবস্থা সরকারি তারিখ থেকে হিসাব করা হয় — কোনো তারিখ অনুমান করা হয় না।`,
              en: `Showing ${visible.length} circular(s). Application status is computed from the official dates — no date is ever guessed.`,
            })}
          </p>
        </>
      )}
    </PageShell>
  );
}
