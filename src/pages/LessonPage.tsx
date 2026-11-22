// Eduvelto — one lesson (Phase 2, Step 3).
//
// AUTH GATING (owner instruction 22 Nov 2026): a signed-out visitor
// reads the lesson body ONLY for a preview chapter. The lesson id IS
// the chapter id in the loader's model, so the page fetches the chapter
// metadata first and fetches the lesson ONLY when the chapter is a
// preview (or the visitor is signed in).

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { AlertBox, Skeleton } from '../components/ui';
import LessonReader from '../components/LessonReader';
import LoginWall from '../components/LoginWall';
import { useAuth } from '../lib/auth';
import { getPublishedBook, getPublishedChapter, getPublishedLesson, type Book, type Lesson } from '../lib/content';
import { isPermissionDeniedError } from '../lib/gating';
import { useLanguage } from '../i18n/LanguageContext';

export default function LessonPage() {
  const { t } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const { lessonId } = useParams<{ lessonId: string }>();
  const [book, setBook] = useState<Book | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [walled, setWalled] = useState(false);

  useEffect(() => {
    if (!lessonId || authLoading) return;
    let live = true;
    void (async () => {
      try {
        // Chapter metadata first: it decides whether the lesson body
        // may be fetched for a guest at all.
        const ch = await getPublishedChapter(lessonId);
        if (!live) return;
        if (!ch) {
          setLoaded(true);
          setError(t({ bn: 'এই পাঠটি পাওয়া যায়নি বা এখনো প্রকাশিত হয়নি।', en: 'This lesson was not found or is not published yet.' }));
          return;
        }
        if (!user && !ch.isPreview) {
          setLoaded(true);
          setWalled(true);
          return;
        }
        const l = await getPublishedLesson(lessonId);
        if (!live) return;
        setLesson(l);
        setLoaded(true);
        if (!l) {
          setError(t({ bn: 'এই পাঠটি পাওয়া যায়নি বা এখনো প্রকাশিত হয়নি।', en: 'This lesson was not found or is not published yet.' }));
          return;
        }
        const b = await getPublishedBook(l.bookId);
        if (live) setBook(b);
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
  }, [lessonId, authLoading, user]);

  return (
    <PageShell titleBn={lesson ? lesson.title : 'পাঠ'} titleEn={lesson ? lesson.title : 'Lesson'}>
      {!loaded ? <Skeleton lines={5} /> : null}
      {walled ? <LoginWall kind="lesson" /> : null}
      {error ? (
        <AlertBox tone="error">
          {error} <Link to="/library">{t({ bn: '← লাইব্রেরিতে ফিরুন', en: '← Back to the library' })}</Link>
        </AlertBox>
      ) : null}
      {lesson ? (
        <LessonReader
          lesson={lesson}
          bookTitle={book ? book.title : lesson.bookId}
          subject={book ? book.department : ''}
          backTo={book ? `/library/${book.id}` : '/library'}
          backLabel={book ? t({ bn: `${book.title} / বই`, en: `${book.title} / Book` }) : t({ bn: 'লাইব্রেরি', en: 'Library' })}
        />
      ) : null}
    </PageShell>
  );
}
