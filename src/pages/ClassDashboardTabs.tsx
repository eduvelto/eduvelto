// Eduvelto — class dashboard tabs (stage 3: class-wise homepage + mobile
// app preview). Navigation model (owner brief 21 Nov 12:28): Select Class
// → Class Dashboard → Tab → Subject → Book → Chapter. Subject-wise
// navigation lives INSIDE the selected class only — every tab below shows
// ONLY this class's content, filtered by the live educationType +
// classLevel mapping in lib/classLevels.ts.
//
// HONESTY: every number here is computed from live data (books, quizzes,
// the signed-in user's own attempts/bookmarks/progress). Empty classes
// show honest "not ready yet" states. No fake books, subjects, chapters,
// results or progress anywhere. Results/Progress/Profile tabs need a
// signed-in user; logged-out visitors get a sign-in prompt, never fake
// data. Ads: ONE limited in-content placeholder inside the Books tab
// only — never on Practice, Tests, Results, or during an exam.

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { loginState } from '../lib/loginReturn';
import { Button, Card, Chip, LinkButton, ProgressBar, SkeletonCards } from '../components/ui';
import { EmptyState } from '../components/PageShell';
import AdSlot from '../components/AdSlot';
import type { Book } from '../lib/content';
import { bookTitleOf, type Quiz, type QuizAttempt } from '../lib/exams';
import type { ClassSubjectStats } from '../lib/classStats';
import type { QuizSummary, SubjectProgress } from '../lib/progress';
import type { UserProfile } from '../lib/profile';
import type { ClassLevelDef } from '../lib/classLevels';
import { useLanguage } from '../i18n/LanguageContext';

export interface ClassTabData {
  def: ClassLevelDef;
  /** Books of the CURRENT page (server-paged mode) or the full class list (fallback mode). */
  books: Book[];
  /** Quizzes of the CURRENT Tests page (server-paged mode) or the full class list (fallback mode). */
  quizzes: Quiz[];
  /** Live distinct departments of this class's books. */
  subjects: string[];
  /** Per-subject aggregates from the stats doc (null in fallback mode — computed from `books` then). */
  subjectStats: ClassSubjectStats[] | null;
  /** Exact totals — from the stats doc, or the loaded list lengths in fallback mode. */
  bookTotal: number;
  quizTotal: number;
  /** Books-tab server paging (stats mode only). */
  bookPage: number;
  bookPageCount: number;
  serverPaged: boolean;
  onBooksPage: (n: number) => void;
  /** True once the Tests-tab quiz page has loaded (stats mode). */
  quizzesLoaded: boolean;
  totalQuestions: number;
  totalChapters: number;
  signedIn: boolean;
  /** User's quiz attempts in THIS class only (joined by quizId). */
  attempts: QuizAttempt[];
  /** quizId -> display title, from the stats doc (stats mode) or the loaded quizzes (fallback). */
  quizTitleById: Map<string, string>;
  /** User's bookmarked books in THIS class only. */
  myBooks: Book[];
  /** User's lesson progress rows for this class's subjects. */
  subjectProgress: SubjectProgress[];
  /** User's quiz summaries for this class's subjects. */
  quizSummaries: QuizSummary[];
}

function attemptDate(a: QuizAttempt): Date | null {
  const c = a.createdAt as { toDate?: () => Date; seconds?: number } | Date | null;
  if (!c) return null;
  if (c instanceof Date) return c;
  if (typeof c.toDate === 'function') return c.toDate();
  if (typeof c.seconds === 'number') return new Date(c.seconds * 1000);
  return null;
}

function SignInPrompt({ what }: { what: { bn: string; en: string } }) {
  const { t } = useLanguage();
  const location = useLocation();
  // Sections audit (24 Nov 2026): return here after sign-in.
  const back = loginState(location.pathname + location.search);
  return (
    <Card>
      <div style={{ fontWeight: 700, color: 'var(--heading)', marginBottom: 6 }}>{t({ bn: 'লগইন করুন', en: 'Log in' })}</div>
      <p style={{ margin: '0 0 12px', color: 'var(--muted)', fontSize: 14 }}>
        {t({ bn: `${t(what)} দেখতে লগইন করুন — আপনার তথ্য শুধু আপনিই দেখতে পাবেন।`, en: `Log in to see ${t(what)} — only you can see your information.` })}
      </p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <LinkButton to="/login" state={back} variant="primary">
          {t({ bn: 'লগইন', en: 'Log in' })}
        </LinkButton>
        <LinkButton to="/register" state={back} variant="outline">
          {t({ bn: 'ফ্রি রেজিস্টার', en: 'Register free' })}
        </LinkButton>
      </div>
    </Card>
  );
}

function BookCard({ book }: { book: Book }) {
  const { t } = useLanguage();
  return (
    <Card hover>
      <Link to={`/library/${book.id}`} style={{ fontWeight: 700, fontSize: 16, color: 'var(--heading)', lineHeight: 1.5 }}>
        {book.title}
      </Link>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
        <Chip>{book.department}</Chip>
        <Chip tone="outline">{book.classLevel}</Chip>
        <Chip tone="gold">{t({ bn: `${book.questionCount}টি প্রশ্ন`, en: `${book.questionCount} questions` })}</Chip>
      </div>
      <p style={{ margin: '10px 0 0', color: 'var(--muted)', fontSize: 14 }}>
        {t({ bn: `${book.chapterCount}টি পাঠ · ${book.paperCode ? `কোড ${book.paperCode}` : 'কোড নেই'}`, en: `${book.chapterCount} lessons · ${book.paperCode ? `Code ${book.paperCode}` : 'No code'}` })}
      </p>
    </Card>
  );
}

const BOOKS_PAGE_SIZE = 20;

export function BooksTab({ data }: { data: ClassTabData }) {
  const { t } = useLanguage();
  // SERVER-PAGED mode (stats doc present): `books` is already the current
  // server page (20 reads); the pager fetches the next page on demand.
  // FALLBACK mode: `books` is the full class list — the old client-side
  // pager over it, exactly as before.
  const [clientPage, setClientPage] = useState(1);
  const pageCount = data.serverPaged
    ? data.bookPageCount
    : Math.max(1, Math.ceil(data.books.length / BOOKS_PAGE_SIZE));
  const safePage = data.serverPaged ? data.bookPage : Math.min(clientPage, pageCount);
  const pageBooks = data.serverPaged
    ? data.books
    : data.books.slice((safePage - 1) * BOOKS_PAGE_SIZE, safePage * BOOKS_PAGE_SIZE);
  const goPage = (n: number) => {
    if (data.serverPaged) data.onBooksPage(n);
    else setClientPage(n);
  };
  if (data.bookTotal === 0) {
    // 28 Nov 2026 (completeness audit): honest empty state — no
    // "coming soon" variant.
    return (
      <EmptyState
        bn="এই শ্রেণির কোনো বই এখনো প্রকাশিত হয়নি। কনটেন্ট প্রকাশিত হলে এখানে দেখা যাবে।"
        en="No books for this class are published yet. Content will appear here once it is published."
      />
    );
  }
  return (
    <>
      <p style={{ color: 'var(--muted-ivory)', margin: '0 0 12px' }}>
        {t({ bn: `${data.bookTotal}টি বই · এই শ্রেণির শুধুমাত্র`, en: `${data.bookTotal} books · this class only` })}      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {pageBooks.map((b, i) => (
          <div key={b.id} style={{ display: 'contents' }}>
            <BookCard book={b} />
            {safePage === 1 && i === 9 ? <AdSlot placement="in-content" /> : null}
          </div>
        ))}
      </div>
      {pageCount > 1 ? (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 20, flexWrap: 'wrap' }}>
          <Button variant="outline" onClick={() => goPage(Math.max(1, safePage - 1))} disabled={safePage <= 1}>
            {t({ bn: '← আগের', en: '← Previous' })}
          </Button>
          <span>
            {t({ bn: `পাতা ${safePage} / ${pageCount}`, en: `Page ${safePage} of ${pageCount}` })}
          </span>
          <Button variant="outline" onClick={() => goPage(Math.min(pageCount, safePage + 1))} disabled={safePage >= pageCount}>
            {t({ bn: 'পরের →', en: 'Next →' })}
          </Button>
        </div>
      ) : null}
    </>
  );
}

export function SubjectsTab({ data }: { data: ClassTabData }) {
  const { t } = useLanguage();
  if (data.subjects.length === 0) {
    // 28 Nov 2026 (completeness audit): honest empty state — no
    // "coming soon" variant.
    return (
      <EmptyState
        bn="এই শ্রেণির কোনো বিষয় এখনো নেই। কনটেন্ট প্রকাশিত হলে এখানে দেখা যাবে।"
        en="No subjects for this class yet. Content will appear here once it is published."
      />
    );
  }
  // STATS mode: per-subject counts come from the stats doc — no book list
  // needed. FALLBACK mode: computed from the loaded books, as before.
  const rows = data.subjectStats
    ? data.subjectStats.map((s) => ({
        name: s.name,
        books: s.bookCount,
        questions: s.questionCount,
        chapters: s.chapterCount,
      }))
    : data.subjects.map((s) => {
        const books = data.books.filter((b) => b.department === s);
        return {
          name: s,
          books: books.length,
          questions: books.reduce((n, b) => n + (b.questionCount ?? 0), 0),
          chapters: books.reduce((n, b) => n + (b.chapterCount ?? 0), 0),
        };
      });
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
      {rows.map((r) => {
        return (
          <Card key={r.name} hover>
            <Link
              to={`/class/${data.def.slug}/subjects/${encodeURIComponent(r.name)}`}
              style={{ fontWeight: 700, fontSize: 17, color: 'var(--heading)' }}            >
              {r.name}
            </Link>
            <p style={{ margin: '8px 0 0', color: 'var(--muted)', fontSize: 14 }}>
              {t({ bn: `${r.books}টি বই · ${r.chapters}টি পাঠ · ${r.questions}টি প্রশ্ন`, en: `${r.books} books · ${r.chapters} lessons · ${r.questions} questions` })}            </p>
            <p style={{ margin: '10px 0 0' }}>
              <Link to={`/class/${data.def.slug}/subjects/${encodeURIComponent(r.name)}`} style={{ fontWeight: 600 }}>
                {t({ bn: 'বিষয়টি দেখুন →', en: 'See this subject →' })}
              </Link>
            </p>
          </Card>
        );
      })}
    </div>
  );
}

export function PracticeTab({ data }: { data: ClassTabData }) {
  const { t } = useLanguage();
  if (data.bookTotal === 0) {
    // 28 Nov 2026 (completeness audit): honest empty state — no
    // "coming soon" variant.
    return (
      <EmptyState
        bn="এই শ্রেণির কোনো অনুশীলন প্রশ্ন এখনো তৈরি হয়নি। কনটেন্ট প্রকাশিত হলে এখানে দেখা যাবে।"
        en="No practice questions for this class yet. Content will appear here once it is published."
      />
    );
  }
  return (
    <>
      <p style={{ color: 'var(--muted-ivory)', margin: '0 0 12px' }}>
        {t({ bn: `মোট ${data.totalQuestions}টি অনুশীলন প্রশ্ন · প্রতিটি বইয়ের ভেতরে অধ্যায়ভিত্তিক পাঠ ও প্রশ্ন আছে।`, en: `${data.totalQuestions} practice questions in total · each book has chapter-wise lessons and questions.` })}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {data.books.slice(0, 20).map((b) => (
          <Card key={b.id} hover>
            <Link to={`/library/${b.id}`} style={{ fontWeight: 700, fontSize: 16, color: 'var(--heading)', lineHeight: 1.5 }}>
              {b.title}
            </Link>
            <p style={{ margin: '8px 0 0', color: 'var(--muted)', fontSize: 14 }}>
              {t({ bn: `${b.questionCount}টি প্রশ্ন · ${b.chapterCount}টি পাঠ`, en: `${b.questionCount} questions · ${b.chapterCount} lessons` })}
            </p>
            <p style={{ margin: '10px 0 0' }}>
              <Link to={`/library/${b.id}`} style={{ fontWeight: 600 }}>
                {t({ bn: 'পাঠ ও প্রশ্ন দেখুন →', en: 'See lessons and questions →' })}
              </Link>
            </p>
          </Card>
        ))}
      </div>
      {data.bookTotal > 20 ? (
        <p style={{ marginTop: 16 }}>
          <Link to={`/class/${data.def.slug}/books`} style={{ fontWeight: 600 }}>
            {t({ bn: `সব ${data.bookTotal}টি বই দেখুন →`, en: `See all ${data.bookTotal} books →` })}
          </Link>
        </p>
      ) : null}
    </>
  );
}

export function TestsTab({ data }: { data: ClassTabData }) {
  const { t } = useLanguage();
  // STATS mode, guest: the quiz COUNT is public (stats doc) but the LIST
  // stays signed-in-only — show the count + a sign-in prompt, never an
  // empty "no tests" state for a class that has tests.
  if (!data.signedIn && data.serverPaged) {
    if (data.quizTotal === 0) {
      // 28 Nov 2026 (completeness audit): one honest empty state —
      // no "coming soon" variant for classes without books.
      return (
        <EmptyState
          bn="এই শ্রেণির কোনো পরীক্ষা এখনো তৈরি হয়নি। কনটেন্ট প্রকাশিত হলে এখানে দেখা যাবে।"
          en="No tests for this class yet. Content will appear here once it is published."
        />
      );
    }
    return (
      <>
        <p style={{ color: '#57616A', margin: '0 0 12px' }}>
          {t({ bn: `${data.quizTotal}টি পরীক্ষা · এই শ্রেণির শুধুমাত্র`, en: `${data.quizTotal} tests · this class only` })}
        </p>
        <SignInPrompt what={{ bn: 'পরীক্ষা', en: 'tests' }} />
      </>
    );
  }
  // STATS mode, signed-in, quiz page still loading.
  if (data.serverPaged && !data.quizzesLoaded) {
    return <SkeletonCards count={3} />;
  }
  if (data.quizTotal === 0) {
    // 28 Nov 2026 (completeness audit): one honest empty state —
    // no "coming soon" variant for classes without books.
    return (
      <EmptyState
        bn="এই শ্রেণির কোনো পরীক্ষা এখনো তৈরি হয়নি। কনটেন্ট প্রকাশিত হলে এখানে দেখা যাবে।"
        en="No tests for this class yet. Content will appear here once it is published."
      />
    );
  }
  return (
    <>
      <p style={{ color: 'var(--muted-ivory)', margin: '0 0 12px' }}>
        {t({ bn: `${data.quizTotal}টি পরীক্ষা · এই শ্রেণির শুধুমাত্র`, en: `${data.quizTotal} tests · this class only` })}      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {data.quizzes.slice(0, 20).map((q) => (
          <Card key={q.id} hover>
            <Link to={`/quiz/${q.id}`} style={{ fontWeight: 700, fontSize: 16, color: 'var(--heading)', lineHeight: 1.5 }}>
              {bookTitleOf(q)}
            </Link>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
              <Chip>{q.kind === 'mcq' ? 'MCQ' : t({ bn: 'লিখিত', en: 'Written' })}</Chip>
              <Chip tone="outline">{q.department}</Chip>
              <Chip tone="gold">{t({ bn: `${q.questionCount}টি প্রশ্ন`, en: `${q.questionCount} questions` })}</Chip>
            </div>
            <p style={{ margin: '10px 0 0', color: 'var(--muted)', fontSize: 14 }}>
              {t({ bn: `মোট ${q.totalMarks} নম্বর${q.timeLimitMinutes ? ` · ${q.timeLimitMinutes} মিনিট` : ''}`, en: `${q.totalMarks} marks in total${q.timeLimitMinutes ? ` · ${q.timeLimitMinutes} minutes` : ''}` })}
            </p>
            <p style={{ margin: '10px 0 0' }}>
              <Link to={`/quiz/${q.id}`} style={{ fontWeight: 600 }}>
                {t({ bn: 'পরীক্ষা দিন →', en: 'Take the test →' })}
              </Link>
            </p>
          </Card>
        ))}
      </div>
      {data.quizTotal > 20 ? (
        <p style={{ marginTop: 16, color: 'var(--muted-ivory)' }}>
          {t({ bn: `আরও ${data.quizTotal - 20}টি পরীক্ষা আছে — সব দেখতে`, en: `${data.quizTotal - 20} more tests — see them all on the` })}{' '}          <Link to="/exam" style={{ fontWeight: 600 }}>
            {t({ bn: 'পরীক্ষার পাতায় যান →', en: 'exams page →' })}
          </Link>
        </p>
      ) : null}
    </>
  );
}

export function ResultsTab({ data }: { data: ClassTabData }) {
  const { lang, t } = useLanguage();
  if (!data.signedIn) return <SignInPrompt what={{ bn: 'আপনার ফলাফল', en: 'your results' }} />;
  if (data.attempts.length === 0) {
    return (
      <>
        <EmptyState
          bn="এই শ্রেণিতে এখনো কোনো পরীক্ষা দেননি — পরীক্ষা দিলে ফলাফল এখানে দেখাবে।"
          en="You have not taken any test in this class yet."
        />
        <p style={{ marginTop: 16 }}>
          <Link to={`/class/${data.def.slug}/tests`} style={{ fontWeight: 600 }}>
            {t({ bn: 'পরীক্ষা দেখুন →', en: 'See tests →' })}
          </Link>
        </p>
      </>
    );
  }
  const sorted = [...data.attempts].sort((a, b) => {
    const da = attemptDate(a)?.getTime() ?? 0;
    const db = attemptDate(b)?.getTime() ?? 0;
    return db - da;
  });
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
      {sorted.slice(0, 20).map((a) => {
        const title = data.quizTitleById.get(a.quizId);
        const d = attemptDate(a);
        return (
          <Card key={a.id} hover>
            <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 16, lineHeight: 1.5 }}>
              {title ?? a.subject ?? t({ bn: 'পরীক্ষা', en: 'Test' })}            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 8 }}>
              <span style={{ fontFamily: "'Poppins','Hind Siliguri',system-ui,sans-serif", fontSize: 26, fontWeight: 800, color: 'var(--teal-text)' }}>
                {a.percentage}%
              </span>
              <span style={{ color: 'var(--muted)', fontSize: 14 }}>
                {t({ bn: `${a.score}/${a.totalMarks} নম্বর`, en: `${a.score}/${a.totalMarks} marks` })}
              </span>
            </div>
            <p style={{ margin: '8px 0 0', color: 'var(--muted)', fontSize: 14 }}>
              {t(a.markingStatus === 'auto' ? { bn: 'স্বয়ংক্রিয় মূল্যায়ন', en: 'Auto-marked' } : a.markingStatus === 'marked' ? { bn: 'মূল্যায়ন সম্পন্ন', en: 'Marking complete' } : { bn: 'মূল্যায়ন বাকি', en: 'Marking pending' })}
              {d ? ` · ${d.toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
            </p>
            <p style={{ margin: '10px 0 0' }}>
              <Link to={`/quiz/${a.quizId}/result/${a.id}`} style={{ fontWeight: 600 }}>
                {t({ bn: 'বিস্তারিত ফলাফল →', en: 'Detailed results →' })}
              </Link>
            </p>
          </Card>
        );
      })}
    </div>
  );
}

export function ProgressTab({ data }: { data: ClassTabData }) {
  const { t } = useLanguage();
  if (!data.signedIn) return <SignInPrompt what={{ bn: 'আপনার অগ্রগতি', en: 'your progress' }} />;
  const attempts = data.attempts;
  const avg = attempts.length > 0 ? Math.round(attempts.reduce((s, a) => s + (a.percentage ?? 0), 0) / attempts.length) : null;
  const best = attempts.length > 0 ? Math.max(...attempts.map((a) => a.percentage ?? 0)) : null;
  const lessonsRead = data.subjectProgress.reduce((s, r) => s + r.lessonsRead.length, 0);
  const qAttempted = data.subjectProgress.reduce((s, r) => s + (r.questionsAttempted ?? 0), 0);
  const qCorrect = data.subjectProgress.reduce((s, r) => s + (r.questionsCorrect ?? 0), 0);
  if (attempts.length === 0 && lessonsRead === 0 && data.quizSummaries.length === 0) {
    return (
      <>
        <EmptyState
          bn="এই শ্রেণিতে এখনো কোনো অগ্রগতি নেই — পাঠ পড়লে ও পরীক্ষা দিলে এখানে দেখাবে।"
          en="No progress in this class yet."
        />
        <p style={{ marginTop: 16 }}>
          <Link to={`/class/${data.def.slug}/books`} style={{ fontWeight: 600 }}>
            {t({ bn: 'বই দেখুন →', en: 'See books →' })}
          </Link>
        </p>
      </>
    );
  }
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
        <Card>
          <div style={{ fontFamily: "'Poppins','Hind Siliguri',system-ui,sans-serif", fontSize: 26, fontWeight: 800, color: 'var(--heading)' }}>{attempts.length}</div>
          <div style={{ color: 'var(--muted)', fontSize: 14 }}>{t({ bn: 'পরীক্ষা দিয়েছেন', en: 'Tests taken' })}</div>
        </Card>
        <Card>
          <div style={{ fontFamily: "'Poppins','Hind Siliguri',system-ui,sans-serif", fontSize: 26, fontWeight: 800, color: 'var(--heading)' }}>{avg !== null ? `${avg}%` : '—'}</div>
          <div style={{ color: 'var(--muted)', fontSize: 14 }}>{t({ bn: 'গড় নম্বর', en: 'Average score' })}</div>
          {avg !== null ? <ProgressBar value={avg} /> : null}
        </Card>
        <Card>
          <div style={{ fontFamily: "'Poppins','Hind Siliguri',system-ui,sans-serif", fontSize: 26, fontWeight: 800, color: 'var(--heading)' }}>{best !== null ? `${best}%` : '—'}</div>
          <div style={{ color: 'var(--muted)', fontSize: 14 }}>{t({ bn: 'সেরা ফলাফল', en: 'Best result' })}</div>
        </Card>
        <Card>
          <div style={{ fontFamily: "'Poppins','Hind Siliguri',system-ui,sans-serif", fontSize: 26, fontWeight: 800, color: 'var(--heading)' }}>{lessonsRead}</div>
          <div style={{ color: 'var(--muted)', fontSize: 14 }}>{t({ bn: 'পাঠ পড়েছেন', en: 'Lessons read' })}</div>
        </Card>
        <Card>
          <div style={{ fontFamily: "'Poppins','Hind Siliguri',system-ui,sans-serif", fontSize: 26, fontWeight: 800, color: 'var(--heading)' }}>
            {qAttempted > 0 ? `${qCorrect}/${qAttempted}` : '—'}
          </div>
          <div style={{ color: 'var(--muted)', fontSize: 14 }}>{t({ bn: 'সঠিক প্রশ্নোত্তর', en: 'Correct answers' })}</div>
        </Card>
      </div>
      {data.quizSummaries.length > 0 ? (
        <>
          <h3 style={{ color: 'var(--heading)', fontSize: 17, margin: '0 0 10px' }}>{t({ bn: 'মাসিক সারাংশ', en: 'Monthly summaries' })}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            {data.quizSummaries.map((s) => (
              <Card key={s.id}>
                <div style={{ fontWeight: 700, color: 'var(--heading)' }}>
                  {s.subject} · {s.month}
                </div>
                <p style={{ margin: '8px 0 0', color: 'var(--muted)', fontSize: 14 }}>
                  {t({ bn: `${s.attemptsCount}টি চেষ্টা · গড় ${s.averagePercentage}% · সেরা ${s.bestPercentage}%`, en: `${s.attemptsCount} attempts · average ${s.averagePercentage}% · best ${s.bestPercentage}%` })}
                </p>
                {s.weakChapters.length > 0 ? (
                  <p style={{ margin: '8px 0 0', color: 'var(--muted)', fontSize: 14 }}>
                    {t({ bn: `দুর্বল: ${s.weakChapters.slice(0, 3).join(', ')}`, en: `Weak: ${s.weakChapters.slice(0, 3).join(', ')}` })}
                  </p>
                ) : null}
              </Card>
            ))}
          </div>
        </>
      ) : null}
      <p style={{ marginTop: 16 }}>
        <Link to="/progress" style={{ fontWeight: 600 }}>
          {t({ bn: 'সব শ্রেণির অগ্রগতি দেখুন →', en: 'See progress for all classes →' })}
        </Link>
      </p>
    </>
  );
}

const ROLE_LABEL: Record<string, { bn: string; en: string }> = {
  student: { bn: 'শিক্ষার্থী', en: 'Student' },
  teacher: { bn: 'শিক্ষক', en: 'Teacher' },
  guardian: { bn: 'অভিভাবক', en: 'Guardian' },
  admin: { bn: 'অ্যাডমিন', en: 'Admin' },
  owner: { bn: 'মালিক', en: 'Owner' },
  moderator: { bn: 'মডারেটর', en: 'Moderator' },
};

export function ProfileTab({
  data,
  profile,
  onSignOut,
}: {
  data: ClassTabData;
  profile: UserProfile | null;
  onSignOut: () => void;
}) {
  const { t } = useLanguage();
  if (!data.signedIn || !profile) return <SignInPrompt what={{ bn: 'আপনার প্রোফাইল', en: 'your profile' }} />;
  const rows: Array<[string, string]> = [];
  if (profile.displayName) rows.push([t({ bn: 'নাম', en: 'Name' }), profile.displayName]);
  if (profile.email) rows.push([t({ bn: 'ইমেইল', en: 'Email' }), profile.email]);
  if (profile.role) rows.push([t({ bn: 'ভূমিকা', en: 'Role' }), ROLE_LABEL[profile.role] ? t(ROLE_LABEL[profile.role]) : profile.role]);
  if (profile.educationType) rows.push([t({ bn: 'ধারা', en: 'Type' }), profile.educationType]);
  if (profile.classLevel) rows.push([t({ bn: 'শ্রেণি', en: 'Class' }), profile.classLevel]);
  if (profile.department) rows.push([t({ bn: 'বিভাগ', en: 'Department' }), profile.department]);
  if (profile.board) rows.push([t({ bn: 'বোর্ড', en: 'Board' }), profile.board]);
  return (
    <>
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <span
            aria-hidden="true"
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: data.def.accentSoft,
              color: data.def.accentDeep,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
              fontWeight: 800,
            }}
          >
            {(profile.displayName ?? '?').trim().charAt(0) || '?'}
          </span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--heading)' }}>{profile.displayName ?? '—'}</div>
            <div style={{ color: 'var(--muted)', fontSize: 14 }}>
              {t({ bn: `${data.def.bn} ড্যাশবোর্ডে আছেন`, en: `Viewing ${data.def.en} dashboard` })}
            </div>
          </div>
        </div>
        <dl style={{ margin: '16px 0 0', display: 'grid', gap: 8 }}>
          {rows.map(([k, v]) => (
            <div key={k} style={{ display: 'flex', gap: 10, fontSize: 15 }}>
              <dt style={{ color: 'var(--muted)', minWidth: 130 }}>{k}</dt>
              <dd style={{ margin: 0, color: 'var(--ink)', fontWeight: 600 }}>{v}</dd>
            </div>
          ))}
        </dl>
        <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
          <LinkButton to="/profile" variant="primary">
            {t({ bn: 'সম্পূর্ণ প্রোফাইল', en: 'Full profile' })}
          </LinkButton>
          <Button variant="outline" onClick={onSignOut}>
            {t({ bn: 'লগআউট', en: 'Log out' })}
          </Button>
        </div>
      </Card>
      <p style={{ marginTop: 14, color: 'var(--muted)', fontSize: 14 }}>
        {t({ bn: 'আপনার তথ্য শুধু আপনিই দেখতে পাবেন — অন্য শিক্ষার্থী বা শিক্ষক আপনার ব্যক্তিগত তথ্য দেখতে পায় না।', en: 'Only you can see your information — other students and teachers cannot see your personal details.' })}
      </p>
    </>
  );
}
