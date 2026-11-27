// Eduvelto — Suggestion PDF Store (7-day sprint, Day 6,
// 26 Nov 2026, feature/sprint-day6-monetization-security).
//
// Public store at /:lang/suggestions (duplicate-routes pattern,
// same component under /bn + /en — NOT a redirect; the bare
// /suggestions 301s to /bn/suggestions in firebase.json).
//
// ⚠️ HONEST EMPTY STATE ONLY (28 Nov 2026 completeness audit —
// the old "coming soon" chips are removed). No verified
// suggestion-PDF content exists (library audit: 506 wrong books),
// so NOTHING is for sale here: no PDF is listed, no order can be
// placed, no money moves. The page shows the planned categories +
// the planned ৳99–৳149 price range with an honest "verification in
// progress" note, and the SuggestionPdfCard below renders its own
// verification state (sales gate in lib/orders.ts:
// SUGGESTION_PDF_SALES_ENABLED is false). A PDF may be listed here
// ONLY after it is actually verified — never from a claim — with
// the owner's written approval.

import { Link } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { Card } from '../components/ui';
import { useLanguage } from '../i18n/LanguageContext';
import SuggestionPdfCard from '../components/SuggestionPdfCard';

/** Planned categories — NOT available yet. Each card carries the
 *  coming-soon chip and no question count, no PDF link, no price
 *  promise beyond the planned range stated once on the page. */
const PLANNED_CATEGORIES: { bn: string; en: string }[] = [
  { bn: 'বিসিএস', en: 'BCS' },
  { bn: 'ব্যাংক', en: 'Bank' },
  { bn: 'প্রাথমিক শিক্ষক', en: 'Primary Teacher' },
  { bn: 'এনটিআরসিএ', en: 'NTRCA' },
  { bn: 'ভর্তি পরীক্ষা', en: 'Admission Tests' },
];

export default function SuggestionsPage() {
  const { t } = useLanguage();
  return (
    <PageShell titleBn="সাজেশন PDF" titleEn="Suggestion PDFs">
      <div data-suggestions-store>
        <p style={{ lineHeight: 1.8 }}>
          {t({
            bn: 'পরীক্ষার আগের শেষ মুহূর্তের প্রস্তুতির জন্য সাজেশন ও মডেল টেস্ট PDF — প্রতিটি PDF আসবে বিষয়বস্তু যাচাই শেষে।',
            en: 'Suggestion and model test PDFs for last-minute exam preparation — each PDF arrives only after its content is verified.',
          })}
        </p>
        <Card style={{ borderTop: '4px solid #F1B308', marginBottom: 20 }}>
          <p style={{ margin: 0, lineHeight: 1.8, fontWeight: 700 }}>
            {t({
              bn: 'এখনো কোনো সাজেশন PDF বিক্রির জন্য তৈরি নয় — বিষয়বস্তু যাচাই চলছে। যাচাই শেষ হলে এখান থেকেই অর্ডার করা যাবে। এখন কোনো পেমেন্ট নেওয়া হচ্ছে না।',
              en: 'No suggestion PDF is ready for sale yet — content verification is in progress. Once verification is done, you will be able to order from here. No payment is being taken now.',
            })}
          </p>
        </Card>

        <SuggestionPdfCard />

        <h2 style={{ fontSize: 20, margin: '28px 0 10px' }}>
          {t({ bn: 'পরিকল্পিত ক্যাটাগরি', en: 'Planned categories' })}
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 12,
          }}
        >
          {PLANNED_CATEGORIES.map((c) => (
            <Card key={c.bn} style={{ opacity: 0.9 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                <strong style={{ fontSize: 16, color: 'var(--heading)' }}>{t({ bn: c.bn, en: c.en })}</strong>
              </div>
              <p style={{ color: 'var(--muted)', lineHeight: 1.7, margin: '8px 0 0', fontSize: 14 }}>
                {t({
                  bn: 'যাচাই শেষ হলে এই ক্যাটাগরির PDF এখানে আসবে।',
                  en: 'This category’s PDF will appear here once verification is done.',
                })}
              </p>
            </Card>
          ))}
        </div>

        <p style={{ lineHeight: 1.8, marginTop: 20, color: 'var(--muted)' }}>
          {t({
            bn: 'পরিকল্পিত দাম ৳৯৯–৳১৪৯-এর মধ্যে হবে — চূড়ান্ত দাম প্রতিটি PDF আসার সময় জানানো হবে। কোনো PDF-এর জন্য আগাম পেমেন্ট নেওয়া হয় না।',
            en: 'The planned price is between ৳99 and ৳149 — the final price will be shown when each PDF arrives. No advance payment is taken for any PDF.',
          })}
        </p>

        <p style={{ marginTop: 20 }}>
          <Link to="/jobs" style={{ fontWeight: 600 }}>
            {t({ bn: 'চাকরির প্রস্তুতি দেখুন →', en: 'See job preparation →' })}
          </Link>
          {' · '}
          <Link to="/contact" style={{ fontWeight: 600 }}>
            {t({ bn: 'যোগাযোগ →', en: 'Contact →' })}
          </Link>
        </p>
      </div>
    </PageShell>
  );
}
