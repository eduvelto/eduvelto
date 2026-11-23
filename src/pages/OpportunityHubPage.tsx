// Eduvelto — Global Opportunity Hub (directive §3B, 23 Nov 2026).
//
// /opportunities — public page (works signed-out): jobs, remote
// jobs, freelancing platforms, internships, scholarships and
// skill-development listings, newest verified first. Filters live
// in the URL (?type=&status=&verified=&q=) so they survive going
// back from a detail page.
//
// HONESTY (binding): verification and application status are two
// separate dimensions; a missing deadline is "তথ্য পাওয়া যায়নি"
// (never guessed, no countdown, no Open badge); the Apply action
// appears only for verified listings with a confirmed apply link
// and an open/rolling window; expired listings stay listed (marked
// "আবেদন শেষ"). No income is ever promised — platforms are
// described as platforms, and the page warns that no genuine
// employer or scholarship ever asks for money to apply.

import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { AlertBox, Card, Chip, LinkButton, Skeleton } from '../components/ui';
import { useLanguage } from '../i18n/LanguageContext';
import {
  canShowApply,
  filterOpportunities,
  formatOpportunityDate,
  isOpportunityVerified,
  OPPORTUNITY_STATUS_BN,
  OPPORTUNITY_STATUS_EN,
  OPPORTUNITY_TYPE_BN,
  OPPORTUNITY_TYPE_EN,
  OPPORTUNITY_TYPES,
  opportunityDeadlineLine,
  opportunityDomain,
  opportunityStatus,
  sortOpportunities,
  type Opportunity,
  type OpportunityFilters,
  type OpportunityStatus,
  type OpportunityType,
} from '../lib/opportunities';
import { loadHubOpportunities } from '../lib/opportunitiesData';

const STATUS_FILTERS: Array<{ key: OpportunityStatus | null; bn: string; en: string }> = [
  { key: null, bn: 'সব অবস্থা', en: 'All statuses' },
  { key: 'open', bn: 'আবেদন চলছে', en: 'Open' },
  { key: 'closing-soon', bn: 'শিগগির শেষ হবে', en: 'Closing soon' },
  { key: 'rolling', bn: 'সবসময় খোলা', en: 'Always open' },
  { key: 'closed', bn: 'আবেদন শেষ', en: 'Closed' },
  { key: 'unknown', bn: 'তথ্য পাওয়া যায়নি', en: 'Unknown' },
];

const GUIDE_LINKS: Array<{ to: string; bn: string; en: string; descBn: string; descEn: string }> = [
  {
    to: '/opportunities/cv-builder',
    bn: 'সিভি ও কভার লেটার তৈরি',
    en: 'CV & Cover Letter Builder',
    descBn: 'ফরম পূরণ করুন — প্রিন্ট করার মতো সিভি ও কভার লেটার তৈরি হবে। আপনার তথ্য ব্রাউজারের বাইরে যায় না।',
    descEn: 'Fill in the form — get a printable CV and cover letter. Your information never leaves your browser.',
  },
  {
    to: '/opportunities/interview-prep',
    bn: 'ইন্টারভিউ প্রস্তুতি',
    en: 'Interview Preparation',
    descBn: 'সাধারণ প্রশ্ন, STAR পদ্ধতিতে উত্তর, ইন্টারভিউর দিনের চেকলিস্ট।',
    descEn: 'Common questions, STAR-method answers, and an interview-day checklist.',
  },
  {
    to: '/opportunities/career-guidance',
    bn: 'ক্যারিয়ার গাইড',
    en: 'Career Guidance',
    descBn: 'পেশা বেছে নেওয়া, দক্ষতার পথ, সরকারি–বেসরকারি–ফ্রিল্যান্সিং — সৎভাবে।',
    descEn: 'Choosing a career, skill paths, government vs private vs freelancing — honestly.',
  },
  {
    to: '/opportunities/entrepreneurship',
    bn: 'উদ্যোক্তা গাইড',
    en: 'Entrepreneurship Guide',
    descBn: 'আইডিয়া যাচাই, ছোট করে শুরু, হিসাব রাখা — অতি-প্রতিশ্রুতি ছাড়া।',
    descEn: 'Validating an idea, starting small, keeping accounts — without overpromising.',
  },
  {
    to: '/opportunities/income',
    bn: 'বৈধ অনলাইন আয়',
    en: 'Legitimate Online Income',
    descBn: 'ফ্রিল্যান্সিং, কনটেন্ট, ডিজিটাল পণ্য — কী বাস্তব, কী প্রতারণা, কীভাবে চিনবেন।',
    descEn: 'Freelancing, content, digital products — what is real, what is a scam, and how to tell.',
  },
];

function OpportunityCard({ o, lang }: { o: Opportunity; lang: string }) {
  const { t } = useLanguage();
  const nowMs = Date.now();
  const status = opportunityStatus(o, nowMs);
  const verified = isOpportunityVerified(o);
  const deadlineLine = opportunityDeadlineLine(o, nowMs);
  const showApply = canShowApply(o, nowMs);
  return (
    <Card>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', marginBottom: 6 }}>
        <Chip tone={status === 'closed' ? 'outline' : status === 'closing-soon' ? 'gold' : 'blue'}>
          {t({ bn: OPPORTUNITY_STATUS_BN[status], en: OPPORTUNITY_STATUS_EN[status] })}
        </Chip>
        <Chip tone="outline">
          {lang === 'bn' ? OPPORTUNITY_TYPE_BN[o.type] : OPPORTUNITY_TYPE_EN[o.type]}
        </Chip>
        {verified ? (
          <Chip tone="blue">{t({ bn: 'অফিসিয়াল উৎসে যাচাইকৃত ✓', en: 'Verified from official source ✓' })}</Chip>
        ) : (
          <Chip tone="outline">{t({ bn: 'যাচাই করা হয়নি', en: 'Not verified' })}</Chip>
        )}
      </div>
      <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 16, lineHeight: 1.5 }}>
        <Link to={`/opportunities/${o.docId}`}>{lang === 'bn' ? o.titleBn : o.titleEn}</Link>
      </div>
      <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 2 }}>
        {lang === 'bn' ? o.organizationBn : o.organizationEn}
        {' · '}
        {lang === 'bn' ? o.countryBn : o.countryEn}
      </div>
      <p style={{ margin: '8px 0 0', fontSize: 14, lineHeight: 1.7, color: 'var(--ink-soft)' }}>
        {lang === 'bn' ? o.descriptionBn : o.descriptionEn}
      </p>
      <dl style={{ margin: '10px 0 0', fontSize: 14, lineHeight: 1.7 }}>
        {o.publishedDateMillis !== null && (
          <div style={{ display: 'flex', gap: 8 }}>
            <dt style={{ color: 'var(--muted)', minWidth: 96 }}>{t({ bn: 'প্রকাশিত', en: 'Published' })}</dt>
            <dd style={{ margin: 0 }}>{formatOpportunityDate(o.publishedDateMillis, lang, false)}</dd>
          </div>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <dt style={{ color: 'var(--muted)', minWidth: 96 }}>{t({ bn: 'শেষ তারিখ', en: 'Deadline' })}</dt>
          <dd style={{ margin: 0, fontWeight: 600 }}>
            {o.deadlineMillis !== null
              ? formatOpportunityDate(o.deadlineMillis, lang, o.deadlinePrecision === 'datetime')
              : t({ bn: 'উল্লেখ নেই', en: 'Not stated' })}
          </dd>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <dt style={{ color: 'var(--muted)', minWidth: 96 }}>{t({ bn: 'অবস্থা', en: 'Status' })}</dt>
          <dd style={{ margin: 0 }}>{lang === 'bn' ? deadlineLine.bn : deadlineLine.en}</dd>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <dt style={{ color: 'var(--muted)', minWidth: 96 }}>{t({ bn: 'উৎস', en: 'Source' })}</dt>
          <dd style={{ margin: 0 }}>{opportunityDomain(o.sourceUrl)}</dd>
        </div>
      </dl>
      <p style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '12px 0 0' }}>
        <LinkButton to={`/opportunities/${o.docId}`} variant="outline">
          {t({ bn: 'বিস্তারিত দেখুন →', en: 'See details →' })}
        </LinkButton>
        {showApply && o.applyUrl ? (
          <a
            href={o.applyUrl}
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
            {t({ bn: 'আবেদন করুন ↗', en: 'Apply ↗' })} · {opportunityDomain(o.applyUrl)}
          </a>
        ) : null}
      </p>
    </Card>
  );
}

export default function OpportunityHubPage() {
  const { t, lang } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<Opportunity[] | null>(null);
  const [fromSeed, setFromSeed] = useState(false);
  const [dataError, setDataError] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);
  const [searchInput, setSearchInput] = useState(searchParams.get('q') ?? '');
  const [search, setSearch] = useState(searchParams.get('q') ?? '');

  const typeParam = searchParams.get('type') as OpportunityType | null;
  const filters: OpportunityFilters = useMemo(
    () => ({
      type: typeParam !== null && OPPORTUNITY_TYPES.includes(typeParam) ? typeParam : null,
      status: (searchParams.get('status') as OpportunityStatus | null) ?? null,
      verifiedOnly: searchParams.get('verified') === '1',
      search,
    }),
    [searchParams, search, typeParam],
  );

  // Debounced search (300ms) — typing never refetches; the
  // filter runs over the already-loaded list.
  useEffect(() => {
    const id = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(id);
  }, [searchInput]);

  useEffect(() => {
    let alive = true;
    setItems(null);
    setDataError(false);
    loadHubOpportunities({})
      .then((res) => {
        if (!alive) return;
        setItems(res.items);
        setFromSeed(res.fromSeed);
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
  }, [retryNonce]);

  const visible = useMemo(() => {
    if (!items) return [];
    return filterOpportunities(sortOpportunities(items), filters);
  }, [items, filters]);

  function updateParams(next: Partial<{ type: string | null; status: string | null; verified: string | null; q: string | null }>) {
    const p = new URLSearchParams(searchParams);
    for (const [k, v] of Object.entries(next)) {
      if (v === null || v === '') p.delete(k);
      else p.set(k, v);
    }
    setSearchParams(p, { replace: true });
  }

  return (
    <PageShell titleBn="সুযোগ হাব — চাকরি, স্কলারশিপ, ইন্টার্নশিপ" titleEn="Opportunity Hub — Jobs, Scholarships, Internships" wide>
      <p style={{ margin: '0 0 12px', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
        {t({
          bn: 'বাংলাদেশসহ বিশ্বের যাচাইকৃত সুযোগ — চাকরি, রিমোট কাজ, ফ্রিল্যান্সিং, ইন্টার্নশিপ, স্কলারশিপ ও বিনামূল্যে দক্ষতা উন্নয়ন। প্রতিটি সুযোগ অফিসিয়াল উৎস থেকে যাচাই করে প্রকাশ করা হয়; যাচাই না হলে "যাচাই করা হয়নি" লেখা থাকে, আর শেষ তারিখ না জানা থাকলে অনুমান করে দেখানো হয় না।',
          en: 'Verified opportunities from Bangladesh and the world — jobs, remote work, freelancing, internships, scholarships and free skill development. Every listing is verified from its official source; unverified items say so, and an unknown deadline is never guessed.',
        })}
      </p>
      <AlertBox tone="info">
        {t({
          bn: 'সতর্কতা: কোনো আসল নিয়োগদাতা, স্কলারশিপ বা ইন্টার্নশিপ আবেদনের জন্য টাকা চায় না। কেউ ফি, "ভেরিফিকেশন চার্জ" বা OTP চাইলে সেটি প্রতারণা — আবেদন করবেন না, আর Eduvelto-কে জানান।',
          en: 'Warning: no genuine employer, scholarship or internship ever asks for money to apply. If anyone asks for a fee, a "verification charge" or an OTP, it is a scam — do not apply, and tell Eduvelto.',
        })}
      </AlertBox>

      <div style={{ margin: '16px 0 12px' }}>
        <label htmlFor="opp-search" style={{ display: 'block', fontSize: 13, color: 'var(--muted)', marginBottom: 4 }}>
          {t({ bn: 'খুঁজুন (পদ / সংস্থা / দেশ)', en: 'Search (post / organisation / country)' })}
        </label>
        <input
          id="opp-search"
          type="search"
          value={searchInput}
          onChange={(e) => {
            setSearchInput(e.target.value);
            updateParams({ q: e.target.value.trim() === '' ? null : e.target.value });
          }}
          placeholder={t({ bn: 'যেমন: BPSC, স্কলারশিপ, রিমোট', en: 'e.g. BPSC, scholarship, remote' })}
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
        style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 6, marginBottom: 8 }}
        role="group"
        aria-label={t({ bn: 'ধরন', en: 'Type' })}
      >
        <Chip tone={filters.type === null ? 'navy' : 'outline'}>
          <button type="button" onClick={() => updateParams({ type: null })} style={{ all: 'unset', cursor: 'pointer' }}>
            {t({ bn: 'সব', en: 'All' })}
          </button>
        </Chip>
        {OPPORTUNITY_TYPES.map((ty) => (
          <Chip key={ty} tone={filters.type === ty ? 'navy' : 'outline'}>
            <button type="button" onClick={() => updateParams({ type: ty })} style={{ all: 'unset', cursor: 'pointer' }}>
              {lang === 'bn' ? OPPORTUNITY_TYPE_BN[ty] : OPPORTUNITY_TYPE_EN[ty]}
            </button>
          </Chip>
        ))}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
        {STATUS_FILTERS.map((s) => (
          <Chip key={s.key ?? 'all'} tone={filters.status === s.key ? 'navy' : 'outline'}>
            <button type="button" onClick={() => updateParams({ status: s.key })} style={{ all: 'unset', cursor: 'pointer' }}>
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
          {t({ bn: 'সুযোগ লোড করা যায়নি — সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।', en: 'Could not load opportunities — check your connection and try again.' })}{' '}
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
              bn: 'এখনো কোনো সুযোগ সংরক্ষিত হয়নি — অফিসিয়াল সুযোগ যাচাই হলে এখানে আসবে।',
              en: 'No opportunity has been saved yet — when an official opportunity is verified, it will appear here.',
            })}
          </p>
        </Card>
      ) : visible.length === 0 ? (
        <Card>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.7 }}>
            {t({
              bn: 'এই ফিল্টারে কোনো সুযোগ মিলছে না — ফিল্টার বদলে দেখুন।',
              en: 'No opportunity matches this filter — try changing the filter.',
            })}
          </p>
        </Card>
      ) : (
        <>
          <div style={{ display: 'grid', gap: 12 }}>
            {visible.map((o) => (
              <OpportunityCard key={o.docId} o={o} lang={lang} />
            ))}
          </div>
          <p style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.7 }}>
            {t({
              bn: `দেখানো হচ্ছে ${visible.length}টি সুযোগ। আবেদনের অবস্থা অফিসিয়াল তারিখ থেকে হিসাব করা হয় — কোনো তারিখ অনুমান করা হয় না।`,
              en: `Showing ${visible.length} opportunit${visible.length === 1 ? 'y' : 'ies'}. Application status is computed from the official dates — no date is ever guessed.`,
            })}
            {fromSeed
              ? t({
                  bn: ' (প্রাথমিক যাচাইকৃত তালিকা — ২৩ নভেম্বর ২০২৬ যাচাই করা হয়েছে।)',
                  en: ' (Initial verified list — verified 23 November 2026.)',
                })
              : ''}
          </p>
        </>
      )}

      <h2 style={{ fontSize: 20, margin: '32px 0 4px', color: 'var(--heading)' }}>
        {t({ bn: 'প্রস্তুতির টুল ও গাইড', en: 'Preparation tools & guides' })}
      </h2>
      <p style={{ margin: '0 0 12px', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
        {t({
          bn: 'সুযোগ খুঁজে পাওয়ার পরের ধাপ — আবেদনের জন্য নিজেকে তৈরি করুন।',
          en: 'The next step after finding an opportunity — get ready to apply.',
        })}
      </p>
      <div style={{ display: 'grid', gap: 12 }}>
        {GUIDE_LINKS.map((g) => (
          <Card key={g.to}>
            <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 16, lineHeight: 1.5 }}>
              <Link to={g.to}>{lang === 'bn' ? g.bn : g.en}</Link>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 14, lineHeight: 1.7, color: 'var(--ink-soft)' }}>
              {lang === 'bn' ? g.descBn : g.descEn}
            </p>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}
