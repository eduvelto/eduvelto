// Eduvelto — one book: its published chapters (Phase 2, Step 2 + Step 3).
// (ui/premium-polish: book hero card, chapter cards, skeletons, retry.)

import { Fragment, useEffect, useState } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { loginState } from '../lib/loginReturn';
import { PageShell } from '../components/PageShell';
import AdSlot from '../components/AdSlot';
import { AlertBox, Card, Chip, Skeleton, SkeletonCards } from '../components/ui';
import { getPublishedBook, listPublishedChapters, type Book, type Chapter } from '../lib/content';
import { takeBookInitialData } from '../lib/initialData';
import { useAuth } from '../lib/auth';
import { useLanguage } from '../i18n/LanguageContext';
import { SeoHead } from '../components/SeoHead';
import SuggestionPdfCard from '../components/SuggestionPdfCard';
import { bookSeoData, buildBookSummary } from '../lib/seo';
import { langUrl } from '../lib/langRouting';

export default function BookPage() {
  const { t, lang } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  // Sections audit (24 Nov 2026): return here after sign-in.
  const back = loginState(location.pathname + location.search);
  const { bookId } = useParams<{ bookId: string }>();
  const [book, setBook] = useState<Book | null>(null);
  const [chapters, setChapters] = useState<Chapter[] | null>(null);
  const [error, setError] = useState('');
  // __INITIAL_DATA__ (Phase 2b): captured ONCE at first render, like
  // the hubs do — the reader is consume-once, so a later effect
  // re-run (auth settling) must reuse the captured payload instead of
  // falling through to the live fetch and wiping a good render with
  // an error. The payload's chapters are the PUBLIC preview list, so
  // no auth decision is needed to take it; the signed-in full-list
  // fetch still happens in load() below.
  const [initialBook] = useState(() => (bookId ? takeBookInitialData(bookId) : null));

  function load() {
    if (!bookId || authLoading) return;
    setError('');
    setBook(null);
    setChapters(null);
    // __INITIAL_DATA__ first (Phase 2b): a prerendered book page
    // carries the book + its public preview chapters — zero
    // Firestore reads. Signed-in users still fetch the FULL chapter
    // list (login-gated content the payload must never carry);
    // guests read nothing at all. The payload was captured at first
    // render (see above), so a re-run reuses it instead of falling
    // back to the live fetch.
    const initial = initialBook;
    if (initial) {
      setBook(initial.book);
      setChapters(initial.chapters);
      if (user) {
        listPublishedChapters(bookId)
          .then((ch) => setChapters(ch))
          .catch(() => {
            // Keep the preview list — the book itself already rendered.
          });
      }
      return;
    }
    // AUTH GATING (owner instruction 22 Nov 2026): a signed-out visitor
    // lists ONLY the book's preview chapter (isPreview). The book itself
    // (title, info, counts) stays public. The effect re-runs when auth
    // settles, so a signed-in user gets the full list.
    Promise.all([getPublishedBook(bookId), listPublishedChapters(bookId, { previewOnly: !user })])
      .then(([b, ch]) => {
        setBook(b);
        setChapters(ch);
        if (!b) setError(t({ bn: 'এই বইটি পাওয়া যায়নি বা এখনো প্রকাশিত হয়নি।', en: 'This book was not found or is not published yet.' }));
      })
      .catch(() => {
        setError(t({ bn: 'বইটি লোড করা যায়নি — আবার চেষ্টা করুন।', en: 'Could not load the book — please try again.' }));
      });
  }

  useEffect(load, [bookId, authLoading, user, initialBook]);

  return (
    <PageShell titleBn={book ? book.title : 'বই'} titleEn={book ? book.title : 'Book'}>
      {/* Phase 1 (25 Nov 2026): per-book SEO once the book loads — the
          prerendered static page carries the same tags (see
          scripts/prerender.mjs + bookSeoData in lib/seo.ts). */}
      {book ? <SeoHead {...bookSeoData(book, lang)} lang={lang} /> : null}
      <p style={{ margin: '0 0 16px' }}>
        <Link to={langUrl('/books', lang)} style={{ fontWeight: 600 }}>
          {t({ bn: '← লাইব্রেরি', en: '← Library' })}
        </Link>
      </p>
      {error ? (
        <AlertBox tone="error" onRetry={load}>
          {error}
        </AlertBox>
      ) : null}
      {/* Audit m04: skeletons alone read as "not built yet" — say
          plainly that the book is loading. */}
      {book === null && !error ? (
        <>
          <p style={{ margin: '0 0 12px', color: 'var(--muted)', fontSize: 15 }} aria-live="polite">
            {t({ bn: 'বইটি লোড হচ্ছে…', en: 'Loading the book…' })}
          </p>
          <Skeleton lines={3} />
        </>
      ) : null}
      {book ? (
        <>
          <Card style={{ marginBottom: 24, borderTop: '4px solid #F1B308' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              <Chip>{book.department}</Chip>
              <Chip tone="outline">{book.classLevel}</Chip>
              <Chip tone="outline">{t({ bn: `কোড ${book.paperCode}`, en: `Code ${book.paperCode}` })}</Chip>
              {book.credit ? <Chip tone="gold">{t({ bn: `ক্রেডিট ${book.credit}`, en: `Credit ${book.credit}` })}</Chip> : null}
              {book.marks ? <Chip tone="gold">{t({ bn: `নম্বর ${book.marks}`, en: `Marks ${book.marks}` })}</Chip> : null}
              {book.bilingual ? <Chip tone="gold">{t({ bn: 'বাংলা উত্তরসহ', en: 'With Bangla answers' })}</Chip> : null}
            </div>
            <p style={{ margin: '12px 0 0', color: 'var(--muted)' }}>
              {t({ bn: `${book.chapterCount}টি পাঠ · ${book.questionCount}টি প্রশ্ন`, en: `${book.chapterCount} lessons · ${book.questionCount} questions` })}
            </p>
            {/* Phase 2 (25 Nov 2026): the same auto-generated rich
                summary paragraph the prerender script emits into
                static HTML (buildBookSummary in lib/seo.ts, mirrored
                in scripts/prerender.mjs) — from the book's own
                metadata only, never invented. */}
            <p style={{ margin: '12px 0 0', fontSize: 15, lineHeight: 1.7 }}>
              {buildBookSummary(book, lang)}
            </p>
          </Card>
          {/* Phase 3 (25 Nov 2026): ৳149 suggestion-PDF card — UI-only
              until verified content exists (sales gate in lib/orders.ts). */}
          <SuggestionPdfCard examName={book.title} />
          <h2 style={{ fontFamily: "'Poppins','Hind Siliguri',system-ui,sans-serif", fontSize: 20, color: 'var(--heading)', margin: '0 0 12px' }}>
            {t({ bn: 'পাঠসমূহ', en: 'Lessons' })} ({chapters?.length ?? 0})
          </h2>
          {chapters === null ? (
            <>
              <p style={{ margin: '0 0 12px', color: 'var(--muted)', fontSize: 15 }} aria-live="polite">
                {t({ bn: 'পাঠ লোড হচ্ছে…', en: 'Loading the lessons…' })}
              </p>
              <SkeletonCards count={3} />
            </>
          ) : null}
          {chapters !== null && chapters.length === 0 && user ? (
            <p>{t({ bn: 'এই বইয়ের কোনো পাঠ এখনো প্রকাশিত হয়নি।', en: 'No lessons from this book are published yet.' })}</p>
          ) : null}
          {chapters !== null && chapters.length === 0 && !user ? (
            <Card style={{ borderTop: '4px solid #F1B308' }}>
              <p style={{ margin: '0 0 8px' }}>
                {t({ bn: 'এই বইয়ের পাঠ পড়তে লগইন করুন।', en: 'Sign in to read this book.' })}
              </p>
              <p style={{ margin: 0 }}>
                <Link to="/login" state={back} style={{ fontWeight: 600 }}>{t({ bn: 'লগইন করুন', en: 'Sign in' })}</Link>
                {' · '}
                <Link to="/register" state={back} style={{ fontWeight: 600 }}>{t({ bn: 'রেজিস্ট্রেশন করুন', en: 'Register' })}</Link>
              </p>
            </Card>
          ) : null}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {(chapters ?? []).map((c: Chapter, i: number) => (
              <Fragment key={c.id}>
                <Card hover>
                  <Link to={`/books/${book.id}/chapters/${c.id}`} style={{ fontWeight: 700, fontSize: 16, color: 'var(--heading)', lineHeight: 1.5 }}>
                    <span style={{ color: 'var(--link)', marginRight: 6 }}>{i + 1}.</span>
                    {c.title}
                  </Link>
                  <p style={{ margin: '8px 0 0', color: 'var(--muted)', fontSize: 14 }}>{t({ bn: `${c.questionCount}টি প্রশ্ন`, en: `${c.questionCount} questions` })}</p>
                </Card>
                {/* In-list in-feed ad (Hybrid Ad Strategy, 23 Nov 2026):
                    mid-grid, only on books with a real list (> 10
                    chapters). Guests see only the preview chapter, so the
                    slot stays hidden for them. Renders nothing until
                    AdSense is configured; a labelled placeholder on
                    preview hosts. */}
                {i === 9 && (chapters?.length ?? 0) > 10 ? <AdSlot placement="in-feed" /> : null}
              </Fragment>
            ))}
          </div>
          {/* End-of-list in-feed-2 ad (Hybrid Ad Strategy, 23 Nov 2026). */}
          {chapters !== null && chapters.length > 0 ? <AdSlot placement="in-feed-2" /> : null}
          {chapters !== null && !user && chapters.length > 0 && book.chapterCount > chapters.length ? (
            <Card style={{ marginTop: 16, borderTop: '4px solid #F1B308' }}>
              <p style={{ margin: '0 0 8px' }}>
                {t({ bn: `এই বইয়ের ${book.chapterCount - chapters.length}টি পাঠ পড়তে লগইন করুন। প্রথম পাঠটি অতিথি হিসেবে পড়া যায়।`, en: `Sign in to read the other ${book.chapterCount - chapters.length} lessons of this book. The first lesson can be read as a guest.` })}
              </p>
              <p style={{ margin: 0 }}>
                <Link to="/login" state={back} style={{ fontWeight: 600 }}>{t({ bn: 'লগইন করুন', en: 'Sign in' })}</Link>
                {' · '}
                <Link to="/register" state={back} style={{ fontWeight: 600 }}>{t({ bn: 'রেজিস্ট্রেশন করুন', en: 'Register' })}</Link>
              </p>
            </Card>
          ) : null}
        </>
      ) : null}
    </PageShell>
  );
}
