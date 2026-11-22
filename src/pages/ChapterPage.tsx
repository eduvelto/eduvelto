// Eduvelto — one chapter, rendered as its lesson (Phase 2, Step 2 + Step 3).
//
// The lesson id IS the chapter id in the loader's data model, so this
// page fetches both docs and renders the shared LessonReader.
//
// AUTH GATING (owner instruction 22 Nov 2026): a signed-out visitor
// reads the lesson body ONLY for the book's preview chapter. The page
// fetches the chapter metadata first and fetches the lesson ONLY when
// the chapter is a preview (or the visitor is signed in) — the lesson
// is never fetched-then-hidden, and the rules deny the read too.

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { AlertBox, Skeleton } from '../components/ui';
import LessonReader from '../components/LessonReader';
import LoginWall from '../components/LoginWall';
import { useAuth } from '../lib/auth';
import { useLanguage } from '../i18n/LanguageContext';
import { isPermissionDeniedError } from '../lib/gating';
import {
  getPublishedBook,
  getPublishedChapter,
  getPublishedLesson,
  type Book,
  type Lesson,
} from '../lib/content';

export default function ChapterPage() {
  const { t } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const { bookId, chapterId } = useParams<{ bookId: string; chapterId: string }>();
  const [book, setBook] = useState<Book | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [walled, setWalled] = useState(false);

  useEffect(() => {
    if (!bookId || !chapterId || authLoading) return;
    let live = true;
    void (async () => {
      try {
        // The book is public metadata; the chapter doc is metadata too —
        // readable by a guest ONLY when it is the preview chapter (the
        // rules deny the read otherwise, which the catch below turns
        // into the wall).
        const [b, ch] = await Promise.all([
          getPublishedBook(bookId),
          getPublishedChapter(chapterId),
        ]);
        if (!live) return;
        setBook(b);
        if (!ch) {
          setLoaded(true);
          setError(t({ bn: 'এই পাঠটি পাওয়া যায়নি বা এখনো প্রকাশিত হয়নি।', en: 'This lesson was not found or is not published yet.' }));
          return;
        }
        // Guest + non-preview chapter: wall — the lesson body is never
        // fetched (the rules would deny it too).
        if (!user && !ch.isPreview) {
          setLoaded(true);
          setWalled(true);
          return;
        }
        const l = await getPublishedLesson(chapterId);
        if (!live) return;
        setLesson(l);
        setLoaded(true);
        if (!l) {
          setError(t({ bn: 'এই পাঠটি পাওয়া যায়নি বা এখনো প্রকাশিত হয়নি।', en: 'This lesson was not found or is not published yet.' }));
        }
      } catch (e) {
        if (!live) return;
        setLoaded(true);
        // A denied read for a signed-out visitor is the wall, not a
        // load failure.
        if (!user && isPermissionDeniedError(e)) setWalled(true);
        else {
          setError(t({ bn: 'পাঠটি লোড করা যায়নি — আবার চেষ্টা করুন।', en: 'Could not load the lesson — please try again.' }));
        }
      }
    })();
    return () => {
      live = false;
    };
  }, [bookId, chapterId, authLoading, user]);

  return (
    <PageShell titleBn={lesson ? lesson.title : 'পাঠ'} titleEn={lesson ? lesson.title : 'Lesson'}>
      {!loaded ? <Skeleton lines={5} /> : null}
      {walled ? <LoginWall kind="chapter" /> : null}
      {error ? (
        <AlertBox tone="error">
          {error}{' '}
          {bookId ? <Link to={`/library/${bookId}`}>{t({ bn: '← বইয়ে ফিরুন', en: '← Back to the book' })}</Link> : null}
        </AlertBox>
      ) : null}
      {lesson && book ? (
        <LessonReader
          lesson={lesson}
          bookTitle={book.title}
          subject={book.department}
          backTo={`/library/${book.id}`}
          backLabel={t({ bn: `${book.title} / বই`, en: `${book.title} / Book` })}
        />
      ) : null}
    </PageShell>
  );
}
