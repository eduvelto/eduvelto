// Eduvelto — Coming Soon state for class levels with no books yet
// (Class 1–5 and Class 6–8, owner briefs 21 Nov 13:14 + 13:20, BINDING).
//
// Beautiful, student-friendly, and HONEST: it never shows fake books,
// counts, subjects, chapters or progress. It says plainly what is being
// prepared, what will arrive, and gives the student somewhere useful to
// go instead (Library / Exams / All classes) — no dead ends.
//
// Two sizes: ComingSoonHero for the class dashboard Home tab, and
// ComingSoonCompact for the Books / Subjects / Practice / Tests tab
// empty states of a class with no books. (A class WITH books but zero
// quizzes keeps its own "no tests yet" message — that is a different
// state and is NOT replaced by this component.)
//
// NOTE (dark mode, 22 Nov 2026): the hero/compact sit on a
// data-driven accentSoft tint (classLevels.ts) that is LIGHT in both
// themes, so their text stays hardcoded dark — theme-aware vars would
// turn light-on-light in dark mode. Same for .ev-coming-soon-chip.

import { Link } from 'react-router-dom';
import { LinkButton } from './ui';
import { useLanguage } from '../i18n/LanguageContext';
import type { ClassLevelDef } from '../lib/classLevels';

function BookSproutArt({ accent, size }: { accent: string; size: number }) {
  return (
    <svg
      width={size}
      height={Math.round((size * 90) / 120)}
      viewBox="0 0 120 90"
      fill="none"
      aria-hidden="true"
      role="presentation"
    >
      {/* sun */}
      <circle cx="102" cy="14" r="8" fill="#D9A441" />
      <path d="M102 1v4M102 23v4M89 14h4M111 14h4" stroke="#D9A441" strokeWidth="2" strokeLinecap="round" />
      {/* sparkles */}
      <path d="M14 12l1.8 4.2L20 18l-4.2 1.8L14 24l-1.8-4.2L8 18l4.2-1.8L14 12z" fill="#D9A441" />
      <path d="M84 30l1.4 3.2 3.2 1.4-3.2 1.4L84 39.2 82.6 36l-3.2-1.4 3.2-1.4L84 30z" fill="#168C82" />
      {/* sprout growing out of the book */}
      <path d="M60 36C60 28 60 24 60 18" stroke="#168C82" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M60 24C60 16 54 12 46 12c0 8 6 12 14 12z" fill="#168C82" />
      <path d="M60 20c0-8 6-12 14-12 0 8-6 12-14 12z" fill="#12766E" />
      {/* open book */}
      <path
        d="M12 40C28 31 44 31 60 40c16-9 32-9 48-9v38c-16 0-32 0-48 9-16-9-32-9-48-9V40z"
        fill={accent}
      />
      <path d="M16 43c14-7 28-7 42 0v32c-14-7-28-7-42 0V43z" fill="#FFFFFF" opacity="0.94" />
      <path d="M62 43c14-7 28-7 42 0v32c-14-7-28-7-42 0V43z" fill="#FFFFFF" opacity="0.94" />
      <path d="M60 40v38" stroke={accent} strokeWidth="2" />
      <path d="M22 50c10-4 20-4 30 0M22 58c10-4 20-4 30 0M68 50c10-4 20-4 30 0M68 58c10-4 20-4 30 0" stroke="#B9C4C7" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

const COMING_ITEMS: Array<{ bn: string; en: string }> = [
  { bn: 'বই', en: 'Books' },
  { bn: 'পাঠ', en: 'Lessons' },
  { bn: 'অনুশীলন প্রশ্ন', en: 'Practice questions' },
  { bn: 'পরীক্ষা', en: 'Tests' },
];

export function ComingSoonHero({ def }: { def: ClassLevelDef }) {
  const { t } = useLanguage();
  return (
    <section
      className="ev-coming-soon-hero"
      style={{ backgroundColor: def.accentSoft }}
      aria-label={t({ bn: `${def.bn} — শীঘ্রই আসছে`, en: `${def.en} — Coming soon` })}
    >
      <BookSproutArt accent={def.accent} size={132} />
      {/* h1 (24 Nov 2026, brand-SEO wave 1, F-06): this hero renders
          ONLY for class levels with no books (Class 1–5, Class 6–8),
          whose dashboards otherwise had no h1 at all — PageShell
          hides its title here. The h1 states the level + the honest
          coming-soon status; the paragraph below says plainly that
          no books exist yet. */}
      <h1 style={{ color: '#142B3B', fontSize: 24, margin: '14px 0 6px' }}>
        {t({ bn: `${def.bn} — শীঘ্রই আসছে!`, en: `${def.en} — Coming soon` })}
      </h1>
      <p style={{ margin: '0 auto', maxWidth: 560, color: '#57616A', fontSize: 15, lineHeight: 1.8 }}>
        {t({ bn: `${def.bn}-এর কোনো বই এখনো লাইব্রেরিতে আসেনি — বই, পাঠ, অনুশীলন প্রশ্ন ও পরীক্ষা এখন তৈরি হচ্ছে। প্রকাশিত হলেই এখানে দেখতে পাবে — ততদিন একটু অপেক্ষা করো, আমরা কাজ করছি!`, en: `No books for ${def.en} have reached the library yet — books, lessons, practice questions and tests are being prepared. They will appear here as soon as they are published.` })}
      </p>
      <div className="ev-coming-soon-chips" aria-label={t({ bn: 'যা আসছে', en: 'What is coming' })}>
        {COMING_ITEMS.map((it) => (
          <span key={it.bn} className="ev-coming-soon-chip">
            {t(it)} <span className="ev-coming-soon-chip-soon">{t({ bn: 'আসছে', en: 'Coming' })}</span>
          </span>
        ))}
      </div>
      {def.slug === 'class-1-5' ? (
        <p
          style={{
            margin: '16px auto 0',
            maxWidth: 560,
            color: '#57616A',
            fontSize: 14,
            lineHeight: 1.7,
            background: 'rgba(255,255,255,0.65)',
            border: '1px solid var(--line)',
            borderRadius: 10,
            padding: '10px 14px',
          }}
        >
          {t({ bn: 'তৈরি হচ্ছে — প্রথম খসড়া অধ্যায়: Class 5 গণিত, অধ্যায় ৯: শতকরা — শিক্ষক যাচাইয়ের জন্য তৈরি হচ্ছে। এটি এখনো লাইব্রেরির বই নয়।', en: 'In preparation — first draft chapter: Class 5 Math, Chapter 9: Percentage — being prepared for teacher review. This is not a library book yet.' })}
        </p>
      ) : null}
      <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
        <LinkButton to="/library" variant="primary">
          {t({ bn: 'লাইব্রেরি দেখুন', en: 'Browse library' })}
        </LinkButton>
        <LinkButton to="/exam" variant="outline">
          {t({ bn: 'পরীক্ষা দেখুন', en: 'See exams' })}
        </LinkButton>
        <LinkButton to="/class" variant="outline">
          {t({ bn: 'সব শ্রেণি', en: 'All classes' })}
        </LinkButton>
      </div>
    </section>
  );
}

export function ComingSoonCompact({
  def,
  whatBn,
  whatEn,
}: {
  def: ClassLevelDef;
  whatBn: string;
  whatEn: string;
}) {
  const { t } = useLanguage();
  return (
    <div className="ev-coming-soon-compact" style={{ backgroundColor: def.accentSoft }}>
      <span aria-hidden="true" style={{ flex: 'none', color: def.accentDeep }}>
        <BookSproutArt accent={def.accent} size={72} />
      </span>
      <div>
        <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 16 }}>
          {t({ bn: `${def.bn} — ${whatBn} শীঘ্রই আসছে`, en: `${def.en} — ${whatEn} coming soon` })}
        </div>
        <p style={{ margin: '6px 0 10px', color: '#57616A', fontSize: 14, lineHeight: 1.7 }}>
          {t({ bn: `এই শ্রেণির ${whatBn} এখনো প্রকাশিত হয়নি — তৈরি হচ্ছে, প্রকাশিত হলেই এখানে দেখাবে।`, en: `${whatEn} for this class is not published yet.` })}
        </p>
        <Link to="/library" style={{ fontWeight: 600, color: '#12766E' }}>
          {t({ bn: 'লাইব্রেরি দেখুন →', en: 'Browse library →' })}
        </Link>
      </div>
    </div>
  );
}
