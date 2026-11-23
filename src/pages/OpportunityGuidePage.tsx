// Eduvelto — Opportunity Hub guide pages (directive §3B, 23 Nov 2026).
//
// Four reading pages — /opportunities/interview-prep,
// /opportunities/career-guidance, /opportunities/entrepreneurship,
// /opportunities/income — sharing one renderer. READING MATERIAL
// ONLY: no quiz, no scoring, no income calculator, no earnings
// promise. The items are code content in
// src/lib/opportunityGuides.ts (zero Firestore reads/writes).
//
// Honesty (binding): the disclaimer at the top of every page
// states the material is general guidance, not an official
// syllabus, verified exam pattern, job guarantee or income
// promise. No "Verified" badge anywhere.

import { Link } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { Breadcrumb } from '../components/Breadcrumb';
import { AlertBox, Card } from '../components/ui';
import { useLanguage } from '../i18n/LanguageContext';
import {
  OPPORTUNITY_GUIDE_KINDS,
  guideItemsFor,
  type OpportunityGuideKind,
} from '../lib/opportunityGuides';

const DISCLAIMER_BN =
  'গুরুত্বপূর্ণ তথ্য: এই পৃষ্ঠার বিষয়বস্তু সাধারণ শিক্ষামূলক ও প্রস্তুতিমূলক নির্দেশনা। ' +
  'এখানে দেওয়া পরামর্শ কোনো নির্দিষ্ট নিয়োগ পরীক্ষার অফিসিয়াল সিলেবাস, প্রশ্নপ্যাটার্ন, নম্বরবণ্টন, ' +
  'যোগ্যতার শর্ত, চাকরির নিশ্চয়তা বা আয়ের প্রতিশ্রুতি নয়। আয়ের কোনো অঙ্ক এখানে দেওয়া হয়নি — ' +
  'বাস্তব আয় আপনার দক্ষতা, সময় ও বাজারের উপর নির্ভর করে। নিয়োগসংক্রান্ত বয়সসীমা, ফি, তারিখ ও যোগ্যতা ' +
  'জানতে সংশ্লিষ্ট প্রতিষ্ঠানের সর্বশেষ অফিসিয়াল বিজ্ঞপ্তি অনুসরণ করুন।';

const DISCLAIMER_EN =
  'Important: this page is general educational and preparatory guidance. ' +
  'It is not a substitute for any specific recruitment exam’s official syllabus, question pattern, ' +
  'mark distribution, eligibility conditions, job guarantee or income promise. No income figure is ' +
  'given here — real income depends on your skill, time and the market. For age limits, fees, dates ' +
  'and eligibility, follow the latest official circular of the relevant institution.';

export default function OpportunityGuidePage({ kind }: { kind: OpportunityGuideKind }) {
  const { t, lang } = useLanguage();
  const meta = OPPORTUNITY_GUIDE_KINDS.find((g) => g.kind === kind);
  const items = guideItemsFor(kind);
  const related = OPPORTUNITY_GUIDE_KINDS.filter((g) => g.kind !== kind);

  return (
    <PageShell titleBn={meta?.titleBn ?? 'গাইড'} titleEn={meta?.titleEn ?? 'Guide'} wide>
      {/* Visible breadcrumb (24 Nov 2026 SEO pass) — labels match the BreadcrumbList JSON-LD in lib/seo.ts. */}
      <Breadcrumb items={[{ label: 'সুযোগ হাব', to: '/opportunities' }, { label: meta?.titleBn ?? 'গাইড' }]} />
      <AlertBox tone="info">{lang === 'bn' ? DISCLAIMER_BN : DISCLAIMER_EN}</AlertBox>
      <p style={{ margin: '12px 0 16px', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
        {t({
          bn: 'সাধারণ নির্দেশনা — আপনার পরিস্থিতি অনুযায়ী বেছে নিন, অন্ধভাবে অনুসরণ করবেন না।',
          en: 'General guidance — adapt it to your situation; do not follow it blindly.',
        })}
      </p>

      <div style={{ display: 'grid', gap: 12 }}>
        {items.map((item) => (
          <Card key={item.slug}>
            <h2 style={{ fontSize: 19, margin: '0 0 6px', color: 'var(--heading)' }}>
              {lang === 'bn' ? item.titleBn : item.titleEn}
            </h2>
            <p style={{ margin: '0 0 12px', fontSize: 15, lineHeight: 1.75 }}>{item.introBn}</p>
            {item.sections.map((s) => (
              <div key={s.headingBn} style={{ marginBottom: 12 }}>
                <h3 style={{ fontSize: 16, margin: '0 0 4px', color: 'var(--heading)' }}>{s.headingBn}</h3>
                <ul style={{ margin: '0 0 0 18px', padding: 0, fontSize: 15, lineHeight: 1.75 }}>
                  {s.bulletsBn.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </div>
            ))}
          </Card>
        ))}
      </div>

      <h2 style={{ fontSize: 19, margin: '24px 0 8px', color: 'var(--heading)' }}>
        {t({ bn: 'আরও গাইড', en: 'More guides' })}
      </h2>
      <div style={{ display: 'grid', gap: 12 }}>
        {related.map((g) => (
          <Card key={g.kind}>
            <div style={{ fontWeight: 700, fontSize: 16 }}>
              <Link to={g.path}>{lang === 'bn' ? g.titleBn : g.titleEn}</Link>
            </div>
          </Card>
        ))}
        <Card>
          <div style={{ fontWeight: 700, fontSize: 16 }}>
            <Link to="/opportunities/cv-builder">
              {t({ bn: 'সিভি ও কভার লেটার তৈরি', en: 'CV & Cover Letter Builder' })}
            </Link>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: 14, lineHeight: 1.7, color: 'var(--ink-soft)' }}>
            {t({
              bn: 'ফরম পূরণ করে প্রিন্ট করার মতো সিভি ও কভার লেটার তৈরি করুন।',
              en: 'Fill in a form and get a printable CV and cover letter.',
            })}
          </p>
        </Card>
      </div>
      <p style={{ marginTop: 16 }}>
        <Link to="/opportunities">{t({ bn: '← সব সুযোগ দেখুন', en: '← See all opportunities' })}</Link>
      </p>
    </PageShell>
  );
}
