// Eduvelto — Admin: Admission Preparation (mobile mockup screen 4).
//
// HONESTY: the mockup shows admission categories as if they were live
// with content. The Admission section does not exist yet — every
// category honestly shows 0 exams • 0 questions, and tapping one shows
// an honest Coming Soon state. The tabs filter the five planned
// categories (from the owner's 19:53 brief).

import { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { EmptyAdminBox } from '../components/AdminShared';

type Tab = 'all' | 'university' | 'medical' | 'engineering';

const CATEGORIES: Array<{
  id: string;
  tab: Exclude<Tab, 'all'>;
  bn: string;
  en: string;
  subBn: string;
  subEn: string;
  color: string;
  glyph: string;
}> = [
  { id: 'university', tab: 'university', bn: 'বিশ্ববিদ্যালয় ভর্তি', en: 'University Admission', subBn: 'ঢাবি, গুচ্ছ, বেসরকারি বিশ্ববিদ্যালয়…', subEn: 'DU, GST, Private University…', color: '#F1EAFB', glyph: '✦' },
  { id: 'medical', tab: 'medical', bn: 'মেডিকেল ভর্তি', en: 'Medical Admission', subBn: 'MBBS, BDS, নার্সিং…', subEn: 'MBBS, BDS, Nursing…', color: '#FDECEC', glyph: '+' },
  { id: 'engineering', tab: 'engineering', bn: 'ইঞ্জিনিয়ারিং ভর্তি', en: 'Engineering Admission', subBn: 'বুয়েট, CKRUET…', subEn: 'BUET, CKRUET…', color: '#E3F2F0', glyph: '⚙' },
  { id: 'agriculture', tab: 'engineering', bn: 'কৃষি ভর্তি', en: 'Agriculture Admission', subBn: 'কৃষি বিশ্ববিদ্যালয়…', subEn: 'Agriculture University…', color: '#E7F6E7', glyph: '✿' },
  { id: 'other', tab: 'university', bn: 'অন্যান্য ভর্তি', en: 'Other Admission', subBn: 'কলেজ, পলিটেকনিক…', subEn: 'College, Polytechnic…', color: '#F1F1F1', glyph: '▦' },
];

const TABS: Array<{ id: Tab; bn: string; en: string }> = [
  { id: 'all', bn: 'সব', en: 'All' },
  { id: 'university', bn: 'বিশ্ববিদ্যালয়', en: 'University' },
  { id: 'medical', bn: 'মেডিকেল', en: 'Medical' },
  { id: 'engineering', bn: 'ইঞ্জিনিয়ারিং', en: 'Engineering' },
];

export default function AdminAdmissionsPage() {
  const { lang, t } = useLanguage();
  const [tab, setTab] = useState<Tab>('all');
  const [soon, setSoon] = useState<string | null>(null);

  const visible = tab === 'all' ? CATEGORIES : CATEGORIES.filter((c) => c.tab === tab);

  return (
    <div>
      <h1 className="ev-admin-page-title">{t({ bn: 'ভর্তি প্রস্তুতি', en: 'Admission Preparation' })}</h1>

      <div className="ev-admin-hero-purple">
        <div>
          <strong>{t({ bn: 'ভর্তি প্রস্তুতি', en: 'Admission Preparation' })}</strong>
          <p>{t({ bn: 'উচ্চশিক্ষার পথে আপনার যাত্রা', en: 'Your Path to Higher Education' })}</p>
        </div>
        <span aria-hidden="true" className="ev-admin-hero-glyph">✦</span>
      </div>

      <p className="ev-admin-note">
        {t({
          bn: 'ভর্তি প্রস্তুতি বিভাগ এখনো তৈরি হয়নি — নিচের বিভাগগুলো পরিকল্পিত তালিকা। কোনো বিভাগেই এখনো পরীক্ষা বা প্রশ্ন নেই।',
          en: 'The Admission Preparation section is not built yet — the categories below are the planned list. No category has any exams or questions yet.',
        })}
      </p>

      <div className="ev-ceo-tabs" role="tablist" aria-label={t({ bn: 'ভর্তির ধরন', en: 'Admission type' })}>
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
                {lang === 'bn' ? c.subBn : c.subEn} · {lang === 'bn' ? '০টি পরীক্ষা · ০টি প্রশ্ন' : '0 Exams · 0 Questions'}
              </span>
            </span>
            <span aria-hidden="true">›</span>
          </button>
        ))}
      </div>

      {soon ? (
        <div style={{ marginTop: 16 }}>
          <EmptyAdminBox
            bn="এই বিভাগের ভর্তি পরীক্ষা এখনো তৈরি হয়নি।"
            en="Admission exams for this category are not built yet."
            nextBn="ভর্তি প্রস্তুতি বিভাগ চালু হলে এখানে পরীক্ষা ও প্রশ্ন দেখা যাবে।"
            nextEn="Exams and questions will appear here once the Admission Preparation section is live."
          />
        </div>
      ) : null}
    </div>
  );
}
