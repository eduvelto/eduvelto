// Eduvelto — Admin: Job Management (mobile mockup screen 3).
//
// HONESTY: the mockup shows "12 Exams • 45K+ Questions" etc. — ALL
// fake. The Job Preparation section does not exist yet (no job exams,
// no job questions in Firestore), so every category honestly shows
// 0 exams • 0 questions. The tabs filter the five planned categories
// (from the owner's 19:53 brief); tapping a category shows an honest
// Coming Soon state — the category pages do not exist yet.

import { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { EmptyAdminBox } from '../components/AdminShared';

type Tab = 'all' | 'bcs' | 'bank' | 'teacher' | 'defence';

const CATEGORIES: Array<{
  id: string;
  tab: Exclude<Tab, 'all'>;
  bn: string;
  en: string;
  color: string;
  glyph: string;
}> = [
  { id: 'bcs', tab: 'bcs', bn: 'BCS ও অন্যান্য সরকারি চাকরি', en: 'BCS & Other Govt. Jobs', color: '#FBEED3', glyph: '✦' },
  { id: 'bank', tab: 'bank', bn: 'ব্যাংক চাকরি', en: 'Bank Jobs', color: '#E3F2F0', glyph: '৳' },
  { id: 'teacher', tab: 'teacher', bn: 'শিক্ষক নিয়োগ', en: 'Teacher Recruitment', color: '#F1EAFB', glyph: '✎' },
  { id: 'defence', tab: 'defence', bn: 'প্রতিরক্ষা চাকরি', en: 'Defence Jobs', color: '#E7F6E7', glyph: '⛨' },
  { id: 'other', tab: 'bcs', bn: 'অন্যান্য চাকরি', en: 'Other Jobs', color: '#F1F1F1', glyph: '⚑' },
];

const TABS: Array<{ id: Tab; bn: string; en: string }> = [
  { id: 'all', bn: 'সব চাকরি', en: 'All Jobs' },
  { id: 'bcs', bn: 'BCS', en: 'BCS' },
  { id: 'bank', bn: 'ব্যাংক', en: 'Bank' },
  { id: 'teacher', bn: 'শিক্ষক', en: 'Teacher' },
  { id: 'defence', bn: 'প্রতিরক্ষা', en: 'Defence' },
];

export default function AdminJobsPage() {
  const { lang, t } = useLanguage();
  const [tab, setTab] = useState<Tab>('all');
  const [soon, setSoon] = useState<string | null>(null);

  const visible = tab === 'all' ? CATEGORIES : CATEGORIES.filter((c) => c.tab === tab);

  return (
    <div>
      <h1 className="ev-admin-page-title">{t({ bn: 'চাকরি ব্যবস্থাপনা', en: 'Job Management' })}</h1>

      <div className="ev-admin-hero-blue">
        <div>
          <strong>{t({ bn: 'চাকরি প্রস্তুতি', en: 'Job Preparation' })}</strong>
          <p>{t({ bn: 'স্বপ্নের চাকরির প্রস্তুতি নিন', en: 'Prepare for your dream job' })}</p>
        </div>
        <span aria-hidden="true" className="ev-admin-hero-glyph">▤</span>
      </div>

      <p className="ev-admin-note">
        {t({
          bn: 'চাকরি প্রস্তুতি বিভাগ এখনো তৈরি হয়নি — নিচের বিভাগগুলো পরিকল্পিত তালিকা। কোনো বিভাগেই এখনো পরীক্ষা বা প্রশ্ন নেই।',
          en: 'The Job Preparation section is not built yet — the categories below are the planned list. No category has any exams or questions yet.',
        })}
      </p>

      <div className="ev-ceo-tabs" role="tablist" aria-label={t({ bn: 'চাকরির ধরন', en: 'Job type' })}>
        {TABS.map((tb) => (
          <button
            key={tb.id}
            type="button"
            role="tab"
            aria-selected={tab === tb.id}
            className={`ev-ceo-tab${tab === tb.id ? ' ev-ceo-tab-active' : ''}`}
            onClick={() => {
              setTab(tb.id);
              setSoon(null);
            }}
          >
            {t({ bn: tb.bn, en: tb.en })}
          </button>
        ))}
      </div>

      <div className="ev-ceo-list" style={{ marginTop: 16 }}>
        {visible.map((c) => (
          <button
            key={c.id}
            type="button"
            className="ev-ceo-list-row"
            style={{ width: '100%', textAlign: 'left', cursor: 'pointer' }}
            onClick={() => setSoon(c.id)}
          >
            <span className="ev-admin-cat-icon" style={{ background: c.color }} aria-hidden="true">
              {c.glyph}
            </span>
            <span className="ev-ceo-list-main">
              <strong>{t({ bn: c.bn, en: c.en })}</strong>
              <span className="ev-ceo-list-sub">
                {lang === 'bn' ? '০টি পরীক্ষা · ০টি প্রশ্ন' : '0 Exams · 0 Questions'}
              </span>
            </span>
            <span aria-hidden="true">›</span>
          </button>
        ))}
      </div>

      {soon ? (
        <div style={{ marginTop: 16 }}>
          <EmptyAdminBox
            bn="এই বিভাগের পরীক্ষা এখনো তৈরি হয়নি।"
            en="Exams for this category are not built yet."
            nextBn="চাকরি প্রস্তুতি বিভাগ চালু হলে এখানে পরীক্ষা ও প্রশ্ন দেখা যাবে।"
            nextEn="Exams and questions will appear here once the Job Preparation section is live."
          />
        </div>
      ) : null}
    </div>
  );
}
