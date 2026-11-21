// Eduvelto — one lesson (Phase 2, Step 3).

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { AlertBox, Skeleton } from '../components/ui';
import LessonReader from '../components/LessonReader';
import { getPublishedBook, getPublishedLesson, type Book, type Lesson } from '../lib/content';
import { useLanguage } from '../i18n/LanguageContext';

export default function LessonPage() {
  const { t } = useLanguage();
  const { lessonId } = useParams<{ lessonId: string }>();
  const [book, setBook] = useState<Book | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!lessonId) return;
    let live = true;
    getPublishedLesson(lessonId)
      .then(async (l) => {
        if (!live) return;
        setLesson(l);
        setLoaded(true);
        if (!l) {
          setError(t({ bn: 'এই পাঠটি পাওয়া যায়নি বা এখনো প্রকাশিত হয়নি।', en: 'This lesson was not found or is not published yet.' }));
          return;
        }
        const b = await getPublishedBook(l.bookId);
        if (live) setBook(b);
      })
      .catch(() => {
        if (live) {
          setLoaded(true);
          setError(t({ bn: 'পাঠটি লোড করা যায়নি — আবার চেষ্টা করুন।', en: 'Could not load the lesson — please try again.' }));
        }
      });
    return () => {
      live = false;
    };
  }, [lessonId]);

  return (
    <PageShell titleBn={lesson ? lesson.title : 'পাঠ'} titleEn={lesson ? lesson.title : 'Lesson'}>
      {!loaded ? <Skeleton lines={5} /> : null}
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
