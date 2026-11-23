// Eduvelto — Opportunity detail (directive §3B, 23 Nov 2026).
//
// /opportunities/:oppId — public page (works signed-out). Shows
// the full listing, the verification box (what was checked, when,
// and at what level — including any caveat), the source + apply
// links with their hostnames visible, and the computed status.
// A missing, invalid or unpublished doc renders the honest
// "not found" state — never a draft.

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { Breadcrumb } from '../components/Breadcrumb';
import { AlertBox, Card, Chip, LinkButton, Skeleton } from '../components/ui';
import { useLanguage } from '../i18n/LanguageContext';
import {
  canShowApply,
  formatOpportunityDate,
  isOpportunityVerified,
  OPPORTUNITY_STATUS_BN,
  OPPORTUNITY_STATUS_EN,
  OPPORTUNITY_TYPE_BN,
  OPPORTUNITY_TYPE_EN,
  opportunityDeadlineLine,
  opportunityDomain,
  opportunityStatus,
  verificationLevelLine,
  type Opportunity,
} from '../lib/opportunities';
import { loadPublishedOpportunity } from '../lib/opportunitiesData';

export default function OpportunityDetailPage() {
  const { t, lang } = useLanguage();
  const { oppId } = useParams<{ oppId: string }>();
  const [item, setItem] = useState<Opportunity | null | undefined>(undefined);

  useEffect(() => {
    let alive = true;
    setItem(undefined);
    if (!oppId) {
      setItem(null);
      return;
    }
    loadPublishedOpportunity(oppId)
      .then((o) => {
        if (alive) setItem(o);
      })
      .catch(() => {
        if (alive) setItem(null);
      });
    return () => {
      alive = false;
    };
  }, [oppId]);

  if (item === undefined) {
    return (
      <PageShell titleBn="সুযোগ" titleEn="Opportunity" wide>
        <Skeleton height={180} />
      </PageShell>
    );
  }

  if (item === null) {
    return (
      <PageShell titleBn="সুযোগ পাওয়া যায়নি" titleEn="Opportunity not found" wide>
        <Card>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.7 }}>
            {t({
              bn: 'এই সুযোগটি পাওয়া যায়নি — হয় লিংকটি ভুল, নয়তো সুযোগটি এখনো প্রকাশ হয়নি বা সরিয়ে নেওয়া হয়েছে।',
              en: 'This opportunity was not found — the link may be wrong, or the opportunity has not been published or has been removed.',
            })}
          </p>
          <p style={{ margin: '12px 0 0' }}>
            <LinkButton to="/opportunities" variant="outline">
              {t({ bn: '← সব সুযোগ দেখুন', en: '← See all opportunities' })}
            </LinkButton>
          </p>
        </Card>
      </PageShell>
    );
  }

  const o = item;
  const nowMs = Date.now();
  const status = opportunityStatus(o, nowMs);
  const verified = isOpportunityVerified(o);
  const deadlineLine = opportunityDeadlineLine(o, nowMs);
  const showApply = canShowApply(o, nowMs);
  const levelLine = verificationLevelLine(o);

  return (
    <PageShell titleBn={o.titleBn} titleEn={o.titleEn} wide>
      {/* Visible breadcrumb (24 Nov 2026 SEO pass) — labels match the BreadcrumbList JSON-LD in lib/seo.ts. */}
      <Breadcrumb items={[{ label: 'সুযোগ হাব', to: '/opportunities' }, { label: o.titleBn }]} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', marginBottom: 12 }}>
        <Chip tone={status === 'closed' ? 'outline' : status === 'closing-soon' ? 'gold' : 'blue'}>
          {t({ bn: OPPORTUNITY_STATUS_BN[status], en: OPPORTUNITY_STATUS_EN[status] })}
        </Chip>
        <Chip tone="outline">{lang === 'bn' ? OPPORTUNITY_TYPE_BN[o.type] : OPPORTUNITY_TYPE_EN[o.type]}</Chip>
        {verified ? (
          <Chip tone="blue">{t({ bn: 'অফিসিয়াল উৎসে যাচাইকৃত ✓', en: 'Verified from official source ✓' })}</Chip>
        ) : (
          <Chip tone="outline">{t({ bn: 'যাচাই করা হয়নি', en: 'Not verified' })}</Chip>
        )}
      </div>

      <dl style={{ margin: '0 0 16px', fontSize: 15, lineHeight: 1.8 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <dt style={{ color: 'var(--muted)', minWidth: 120 }}>{t({ bn: 'সংস্থা', en: 'Organisation' })}</dt>
          <dd style={{ margin: 0, fontWeight: 600 }}>{lang === 'bn' ? o.organizationBn : o.organizationEn}</dd>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <dt style={{ color: 'var(--muted)', minWidth: 120 }}>{t({ bn: 'দেশ / যোগ্যতা', en: 'Country / eligibility' })}</dt>
          <dd style={{ margin: 0 }}>{lang === 'bn' ? o.countryBn : o.countryEn}</dd>
        </div>
        {o.publishedDateMillis !== null && (
          <div style={{ display: 'flex', gap: 8 }}>
            <dt style={{ color: 'var(--muted)', minWidth: 120 }}>{t({ bn: 'প্রকাশিত', en: 'Published' })}</dt>
            <dd style={{ margin: 0 }}>{formatOpportunityDate(o.publishedDateMillis, lang, false)}</dd>
          </div>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <dt style={{ color: 'var(--muted)', minWidth: 120 }}>{t({ bn: 'শেষ তারিখ', en: 'Deadline' })}</dt>
          <dd style={{ margin: 0, fontWeight: 600 }}>
            {o.deadlineMillis !== null
              ? formatOpportunityDate(o.deadlineMillis, lang, o.deadlinePrecision === 'datetime')
              : t({ bn: 'উল্লেখ নেই', en: 'Not stated' })}
          </dd>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <dt style={{ color: 'var(--muted)', minWidth: 120 }}>{t({ bn: 'অবস্থা', en: 'Status' })}</dt>
          <dd style={{ margin: 0 }}>{lang === 'bn' ? deadlineLine.bn : deadlineLine.en}</dd>
        </div>
      </dl>

      <h2 style={{ fontSize: 19, margin: '20px 0 6px', color: 'var(--heading)' }}>
        {t({ bn: 'বিস্তারিত', en: 'Details' })}
      </h2>
      <p style={{ fontSize: 15, lineHeight: 1.8, margin: '0 0 12px' }}>
        {lang === 'bn' ? o.descriptionBn : o.descriptionEn}
      </p>
      <h2 style={{ fontSize: 19, margin: '20px 0 6px', color: 'var(--heading)' }}>
        {t({ bn: 'কারা আবেদন করতে পারবে', en: 'Who can apply' })}
      </h2>
      <p style={{ fontSize: 15, lineHeight: 1.8, margin: '0 0 12px' }}>
        {lang === 'bn' ? o.eligibilityBn : o.eligibilityEn}
      </p>

      <Card>
        <h2 style={{ fontSize: 17, margin: '0 0 6px', color: 'var(--heading)' }}>
          {t({ bn: 'যাচাইয়ের বিবরণ', en: 'Verification details' })}
        </h2>
        <p style={{ fontSize: 14, lineHeight: 1.7, margin: '0 0 6px' }}>
          {lang === 'bn' ? levelLine.bn : levelLine.en}
          {o.verifiedAtMillis !== null ? ` — ${formatOpportunityDate(o.verifiedAtMillis, lang, false)}` : ''}
        </p>
        <p style={{ fontSize: 14, lineHeight: 1.7, margin: '0 0 6px' }}>
          {t({ bn: 'উৎস', en: 'Source' })}: {o.sourceName} ({opportunityDomain(o.sourceUrl)})
        </p>
        {(lang === 'bn' ? o.verificationNoteBn : o.verificationNoteEn) ? (
          <p style={{ fontSize: 14, lineHeight: 1.7, margin: '0 0 6px' }}>
            {t({ bn: 'সতর্কতা', en: 'Note' })}: {lang === 'bn' ? o.verificationNoteBn : o.verificationNoteEn}
          </p>
        ) : null}
        <p style={{ fontSize: 14, lineHeight: 1.7, margin: 0, color: 'var(--muted)' }}>
          {t({
            bn: 'আবেদন করার আগে মূল উৎসের পাতাটি নিজে খুলে দেখুন — তারিখ বা শর্ত বদলে গেলে সেখানকার তথ্যই চূড়ান্ত।',
            en: 'Before applying, open the original source page yourself — if a date or condition has changed, the source is final.',
          })}
        </p>
      </Card>

      <p style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '16px 0 0' }}>
        <a
          href={o.sourceUrl}
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'inline-block',
            padding: '10px 16px',
            borderRadius: 8,
            border: '1px solid var(--border)',
            color: 'var(--text)',
            fontWeight: 600,
            fontSize: 15,
            textDecoration: 'none',
          }}
        >
          {t({ bn: 'মূল উৎস দেখুন ↗', en: 'View original source ↗' })} · {opportunityDomain(o.sourceUrl)}
        </a>
        {showApply && o.applyUrl ? (
          <a
            href={o.applyUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'inline-block',
              padding: '10px 16px',
              borderRadius: 8,
              background: 'var(--accent)',
              color: 'var(--on-accent)',
              fontWeight: 700,
              fontSize: 15,
              textDecoration: 'none',
            }}
          >
            {t({ bn: 'আবেদন করুন ↗', en: 'Apply ↗' })} · {opportunityDomain(o.applyUrl)}
          </a>
        ) : null}
      </p>

      {status === 'closed' ? (
        <AlertBox tone="info">
          {t({
            bn: 'এই সুযোগের আবেদনের সময় শেষ — তবে তথ্যটি রেকর্ড হিসেবে রাখা হয়েছে। পরের রাউন্ড বা মেয়াদ বৃদ্ধি হলে এখানে আপডেট আসবে।',
            en: 'This opportunity has closed — the information is kept as a record. If a new round or an extension comes, it will be updated here.',
          })}
        </AlertBox>
      ) : null}

      <p style={{ marginTop: 24 }}>
        <Link to="/opportunities">{t({ bn: '← সব সুযোগ দেখুন', en: '← See all opportunities' })}</Link>
      </p>
    </PageShell>
  );
}
