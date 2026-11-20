// Eduvelto — one lesson (Phase 2, Step 3).

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import LessonReader from '../components/LessonReader';
import { getPublishedBook, getPublishedLesson, type Book, type Lesson } from '../lib/content';

export default function LessonPage() {
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
          setError('এই পাঠটি পাওয়া যায়নি বা এখনো প্রকাশিত হয়নি। / This lesson was not found or is not published yet.');
          return;
        }
        const b = await getPublishedBook(l.bookId);
        if (live) setBook(b);
      })
      .catch(() => {
        if (live) {
          setLoaded(true);
          setError('পাঠটি লোড করা যায়নি — আবার চেষ্টা করুন। / Could not load the lesson — please try again.');
        }
      });
    return () => {
      live = false;
    };
  }, [lessonId]);

  return (
    <PageShell titleBn={lesson ? lesson.title : 'পাঠ'} titleEn={lesson ? 'Lesson' : 'Lesson'}>
      {!loaded ? <p>লোড হচ্ছে… / Loading…</p> : null}
      {error ? (
        <p style={{ color: '#b00020' }}>
          {error} <Link to="/library">← লাইব্রেরিতে ফিরুন / Back to the library</Link>
        </p>
      ) : null}
      {lesson ? (
        <LessonReader
          lesson={lesson}
          bookTitle={book ? book.title : lesson.bookId}
          subject={book ? book.department : ''}
          backTo={book ? `/library/${book.id}` : '/library'}
          backLabel={book ? `${book.title} / Book` : 'লাইব্রেরি / Library'}
        />
      ) : null}
    </PageShell>
  );
}
