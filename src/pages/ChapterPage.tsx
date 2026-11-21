// Eduvelto — one chapter, rendered as its lesson (Phase 2, Step 2 + Step 3).
//
// The lesson id IS the chapter id in the loader's data model, so this
// page fetches both docs and renders the shared LessonReader.

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { AlertBox, Skeleton } from '../components/ui';
import LessonReader from '../components/LessonReader';
import {
  getPublishedBook,
  getPublishedChapter,
  getPublishedLesson,
  type Book,
  type Lesson,
} from '../lib/content';

export default function ChapterPage() {
  const { bookId, chapterId } = useParams<{ bookId: string; chapterId: string }>();
  const [book, setBook] = useState<Book | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!bookId || !chapterId) return;
    let live = true;
    Promise.all([
      getPublishedBook(bookId),
      getPublishedChapter(chapterId),
      getPublishedLesson(chapterId),
    ])
      .then(([b, ch, l]) => {
        if (!live) return;
        setBook(b);
        setLesson(l);
        setLoaded(true);
        if (!ch || !l) {
          setError('এই পাঠটি পাওয়া যায়নি বা এখনো প্রকাশিত হয়নি। / This lesson was not found or is not published yet.');
        }
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
  }, [bookId, chapterId]);

  return (
    <PageShell titleBn={lesson ? lesson.title : 'পাঠ'} titleEn={lesson ? 'Lesson' : 'Lesson'}>
      {!loaded ? <Skeleton lines={5} /> : null}
      {error ? (
        <AlertBox tone="error">
          {error}{' '}
          {bookId ? <Link to={`/library/${bookId}`}>← বইয়ে ফিরুন / Back to the book</Link> : null}
        </AlertBox>
      ) : null}
      {lesson && book ? (
        <LessonReader
          lesson={lesson}
          bookTitle={book.title}
          subject={book.department}
          backTo={`/library/${book.id}`}
          backLabel={`${book.title} / Book`}
        />
      ) : null}
    </PageShell>
  );
}
