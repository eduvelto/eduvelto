// Eduvelto — shared visible breadcrumb (24 Nov 2026, SEO pass,
// owner order "SEO korba ajk 100").
//
// The exact markup/style of the inline breadcrumbs in
// JobSubjectPage / JobTopicPage: muted 14px, ' › ' separators,
// bold links, current page as dark bold text. aria-label is
// "ব্রেডক্রাম্ব" so the rendered audit can find it.
//
// Crumb names MUST match the BreadcrumbList JSON-LD in lib/seo.ts
// for the same route (same Bangla labels, same order, minus the
// leading "হোম" which the visible trail omits like the existing
// inline breadcrumbs do). Items without `to` render as plain text:
// use that for crumbs with no distinct route of their own
// (e.g. "অনুশীলন" under /jobs/bcs/practice/english).
// The aria-label follows the selected language.

import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';

export type BreadcrumbItem = { label: string; to?: string };

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  const { t } = useLanguage();
  return (
    <nav aria-label={t({ bn: 'ব্রেডক্রাম্ব', en: 'Breadcrumb' })} style={{ margin: '0 0 12px', color: '#57616A', fontSize: 14 }}>
      {items.map((item, i) => {
        const isCurrent = i === items.length - 1;
        return (
          <span key={`${i}-${item.label}`}>
            {i > 0 ? ' › ' : null}
            {item.to ? (
              <Link to={item.to} style={{ fontWeight: 600 }}>
                {item.label}
              </Link>
            ) : isCurrent ? (
              <span style={{ color: '#142B3B', fontWeight: 600 }}>{item.label}</span>
            ) : (
              <span>{item.label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
