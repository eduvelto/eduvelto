// Eduvelto — Admin: Content Management hub.
//
// The desktop sidebar lists Lessons & Courses, Question Bank,
// Previous Questions and Model Tests. The two with real destinations
// link to the public Library / Exams pages (where the admin reviews
// content); the other two are honest Coming Soon rows. Content is
// published through the library loader, not from this dashboard —
// the note says so plainly.

import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getCeoCounts, LAST_VERIFIED_INVENTORY, type CeoCounts } from '../lib/ceo';
import { formatBnNumber } from '../lib/admin';
import { useLanguage } from '../i18n/LanguageContext';
import { requireDb } from '../components/AdminShared';
import { CeoEmpty } from '../components/CeoShared';

export default function AdminContentPage() {
  const { lang, t } = useLanguage();
  const [counts, setCounts] = useState<CeoCounts | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const c = await getCeoCounts(requireDb());
        if (!cancelled) setCounts(c);
      } catch {
        // Counts stay hidden; the hub links are intact.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const books = counts ? (lang === 'bn' ? formatBnNumber(counts.books) : String(counts.books)) : '—';
  const exams = counts ? (lang === 'bn' ? formatBnNumber(counts.exams) : String(counts.exams)) : '—';

  return (
    <div>
      <h1 className="ev-admin-page-title">{t({ bn: 'কনটেন্ট ব্যবস্থাপনা', en: 'Content Management' })}</h1>
      <p className="ev-admin-note">
        {t({
          bn: 'কনটেন্ট (বই, পাঠ, পরীক্ষা) এই ড্যাশবোর্ড থেকে প্রকাশ করা যায় না — লাইব্রেরি লোডারের মাধ্যমে প্রকাশ হয়। এখান থেকে প্রকাশিত কনটেন্ট দেখে যাচাই করতে পারবেন।',
          en: 'Content (books, lessons, exams) cannot be published from this dashboard — it is published through the library loader. You can review published content from here.',
        })}
      </p>

      <div className="ev-ceo-list">
        <Link to="/library" className="ev-ceo-list-row">
          <span className="ev-ceo-list-main">
            <strong>{t({ bn: 'পাঠ ও কোর্স', en: 'Lessons & Courses' })}</strong>
            <span className="ev-ceo-list-sub">
              {t({ bn: `লাইব্রেরিতে ${books}টি বই`, en: `${books} books in the library` })}
              {counts && !counts.booksLive ? ` (${lang === 'bn' ? LAST_VERIFIED_INVENTORY.checkedBn : LAST_VERIFIED_INVENTORY.checkedEn})` : ''}
            </span>
          </span>
          <span aria-hidden="true">›</span>
        </Link>
        <Link to="/exam" className="ev-ceo-list-row">
          <span className="ev-ceo-list-main">
            <strong>{t({ bn: 'প্রশ্নব্যাংক', en: 'Question Bank' })}</strong>
            <span className="ev-ceo-list-sub">
              {t({ bn: `${exams}টি পরীক্ষা`, en: `${exams} exams` })}
              {counts && !counts.examsLive ? ` (${lang === 'bn' ? LAST_VERIFIED_INVENTORY.checkedBn : LAST_VERIFIED_INVENTORY.checkedEn})` : ''}
            </span>
          </span>
          <span aria-hidden="true">›</span>
        </Link>
        <div className="ev-ceo-list-row ev-ceo-list-row-static">
          <span className="ev-ceo-list-main">
            <strong>{t({ bn: 'আগের বছরের প্রশ্ন', en: 'Previous Questions' })}</strong>
            <span className="ev-ceo-list-sub">
              {t({ bn: 'যাচাইকৃত আগের বছরের প্রশ্নের সংগ্রহ এখনো তৈরি হয়নি।', en: 'The verified previous-year question collection is not built yet.' })}
            </span>
          </span>
          <span className="ev-ceo-soon">{t({ bn: 'শীঘ্রই আসছে', en: 'Coming soon' })}</span>
        </div>
        <div className="ev-ceo-list-row ev-ceo-list-row-static">
          <span className="ev-ceo-list-main">
            <strong>{t({ bn: 'মডেল টেস্ট', en: 'Model Tests' })}</strong>
            <span className="ev-ceo-list-sub">
              {t({ bn: 'মডেল টেস্ট ব্যবস্থাপনা এখনো তৈরি হয়নি।', en: 'Model test management is not built yet.' })}
            </span>
          </span>
          <span className="ev-ceo-soon">{t({ bn: 'শীঘ্রই আসছে', en: 'Coming soon' })}</span>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <CeoEmpty
          bn="কনটেন্ট প্রকাশের আগে শিক্ষক যাচাই বাধ্যতামূলক — যাচাই ছাড়া কিছু প্রকাশিত হয় না।"
          en="Teacher review is mandatory before any content is published — nothing goes live without review."
          nextBn="শিক্ষক আবেদন যাচাই করতে /admin/teachers দেখুন।"
          nextEn="Review teacher applications at /admin/teachers."
        />
      </div>
    </div>
  );
}
