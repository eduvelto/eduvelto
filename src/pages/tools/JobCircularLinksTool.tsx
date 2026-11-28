// Eduvelto — Job Circular Links Hub tool UI (28 Nov 2026).
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// STATIC data only (src/lib/tools/jobCircularLinks.ts): the 8 official
// job portals verified 28 Nov 2026. No individual circulars or deep
// links are listed — they go stale. No "verified" badge here; the
// page shell adds it.

import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  JOB_CIRCULAR_LINKS,
  JOB_CIRCULAR_CATEGORIES,
  filterJobCircularLinks,
  type JobCircularCategory,
} from '../../lib/tools/jobCircularLinks';
import { ToolSection, noteStyle } from './eduToolUi';

function chipStyle(active: boolean): CSSProperties {
  return {
    borderRadius: 999,
    padding: '6px 14px',
    minHeight: 36,
    border: '1px solid var(--teal)',
    background: active ? 'var(--teal)' : 'var(--card)',
    color: active ? '#ffffff' : 'var(--teal-deep)',
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
  };
}

function categoryLabel(
  category: JobCircularCategory | 'all',
  t: (e: { bn: string; en: string }) => string,
): string {
  switch (category) {
    case 'all': return t({ bn: 'সব', en: 'All' });
    case 'bcs': return t({ bn: 'বিসিএস', en: 'BCS' });
    case 'bank': return t({ bn: 'ব্যাংক', en: 'Bank' });
    case 'teacher': return t({ bn: 'শিক্ষক', en: 'Teacher' });
    case 'primary': return t({ bn: 'প্রাথমিক', en: 'Primary' });
    case 'apply': return t({ bn: 'আবেদন', en: 'Apply' });
    case 'other': return t({ bn: 'অন্যান্য', en: 'Other' });
  }
}

export function JobCircularLinksTool() {
  const { t, lang } = useLanguage();
  const [category, setCategory] = useState<JobCircularCategory | 'all'>('all');

  const filtered = useMemo(
    () => filterJobCircularLinks(JOB_CIRCULAR_LINKS, category),
    [category],
  );

  return (
    <ToolSection
      id="job-circular-links-title"
      titleBn="চাকরির বিজ্ঞপ্তির লিংক"
      titleEn="Job Circular Links"
      descBn="সরকারি চাকরির বিজ্ঞপ্তি পাওয়ার অফিসিয়াল পোর্টালগুলোর লিংক এক জায়গায়।"
      descEn="Official portals for government job circulars, all in one place."
    >
      <div
        style={{
          padding: '12px 14px',
          borderRadius: 10,
          border: '1px solid var(--line)',
          background: 'var(--teal-soft)',
          fontSize: 14,
          marginBottom: 14,
        }}
        role="note"
      >
        <strong>
          {t({ bn: 'দয়া করে মনে রাখবেন: ', en: 'Please note: ' })}
        </strong>
        {t({
          bn: 'এই পাতায় শুধু অফিসিয়াল পোর্টালের লিংক আছে — কোনো আলাদা বিজ্ঞপ্তির লিংক নেই, কারণ বিজ্ঞপ্তি পুরনো হয়ে যায়। সর্বশেষ বিজ্ঞপ্তির জন্য সবসময় অফিসিয়াল পোর্টালেই দেখুন। টাকা চাওয়া ভুয়া সাইট থেকে সাবধান থাকুন — কোনো ফি দিতে হলে শুধু অফিসিয়াল পোর্টালের নিজের নির্দেশ অনুযায়ী দিন।',
          en: 'This page lists only official portals — never individual circulars, because circulars go stale. Always check the official portal for the latest circular. Beware of fake sites asking for money — pay any fee only as instructed on the official portal itself.',
        })}
      </div>
      <div
        style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}
        role="group"
        aria-label={t({ bn: 'বিভাগ', en: 'Category' })}
      >
        {(['all', ...JOB_CIRCULAR_CATEGORIES] as const).map((c) => (
          <button
            key={c}
            type="button"
            style={chipStyle(category === c)}
            aria-pressed={category === c}
            onClick={() => setCategory(c)}
          >
            {categoryLabel(c, t)}
          </button>
        ))}
      </div>
      <ul style={{ listStyle: 'none', margin: '16px 0 0', padding: 0 }}>
        {filtered.map((link) => (
          <li
            key={link.url}
            style={{
              border: '1px solid var(--line)',
              borderRadius: 12,
              padding: '12px 14px',
              marginBottom: 10,
              background: 'var(--card)',
            }}
          >
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 16, fontWeight: 700, color: 'var(--teal-deep)' }}
            >
              {lang === 'bn' ? link.nameBn : link.nameEn}
            </a>
            <p style={{ margin: '4px 0 2px', fontSize: 14, color: 'var(--heading)' }}>
              {lang === 'bn' ? link.noteBn : link.noteEn}
            </p>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>{link.url}</p>
          </li>
        ))}
      </ul>
      <p style={noteStyle}>
        {t({
          bn: 'এখানে মোট ৮টি অফিসিয়াল পোর্টাল আছে। কোনো বিজ্ঞপ্তি না পেলে সংশ্লিষ্ট পোর্টালের ভেতরে খুঁজুন — পোর্টালের ঠিকানা বদলালে এখানকার লিংকও হালনাগাদ করা হবে।',
          en: 'There are 8 official portals listed here in total. If you cannot find a circular, search inside the relevant portal — if a portal address ever changes, the link here will be updated too.',
        })}
      </p>
    </ToolSection>
  );
}
