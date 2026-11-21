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
import { Link } from 'react-router-dom';
import { Button, Card, Chip, LinkButton, ProgressBar } from '../components/ui';
import { EmptyState } from '../components/PageShell';
import AdPlaceholder from '../components/AdPlaceholder';
import { ComingSoonCompact } from '../components/ComingSoon';
import type { Book } from '../lib/content';
import { bookTitleOf, type Quiz, type QuizAttempt } from '../lib/exams';
import type { QuizSummary, SubjectProgress } from '../lib/progress';
import type { UserProfile } from '../lib/profile';
import type { ClassLevelDef } from '../lib/classLevels';

export interface ClassTabData {
  def: ClassLevelDef;
  /** Live Published books of this class (empty for levels with no books). */
  books: Book[];
  /** Live Published quizzes of this class. */
  quizzes: Quiz[];
  /** Live distinct departments of this class's books. */
  subjects: string[];
  totalQuestions: number;
  totalChapters: number;
  signedIn: boolean;
  /** User's quiz attempts in THIS class only (joined by quizId). */
  attempts: QuizAttempt[];
  quizById: Map<string, Quiz>;
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

function SignInPrompt({ what }: { what: string }) {
  return (
    <Card>
      <div style={{ fontWeight: 700, color: '#142B3B', marginBottom: 6 }}>লগইন করুন / Log in</div>
      <p style={{ margin: '0 0 12px', color: '#68747B', fontSize: 14 }}>
        {what} দেখতে লগইন করুন — আপনার তথ্য শুধু আপনিই দেখতে পাবেন।
      </p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <LinkButton to="/login" variant="primary">
          লগইন / Log in
        </LinkButton>
        <LinkButton to="/register" variant="outline">
          ফ্রি রেজিস্টার / Register free
        </LinkButton>
      </div>
    </Card>
  );
}

function BookCard({ book }: { book: Book }) {
  return (
    <Card hover>
      <Link to={`/library/${book.id}`} style={{ fontWeight: 700, fontSize: 16, color: '#142B3B', lineHeight: 1.5 }}>
        {book.title}
      </Link>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
        <Chip>{book.department}</Chip>
        <Chip tone="outline">{book.classLevel}</Chip>
        <Chip tone="gold">{book.questionCount}টি প্রশ্ন</Chip>
      </div>
      <p style={{ margin: '10px 0 0', color: '#68747B', fontSize: 14 }}>
        {book.chapterCount}টি পাঠ · {book.paperCode ? `কোড ${book.paperCode}` : 'কোড নেই'}
      </p>
    </Card>
  );
}

const BOOKS_PAGE_SIZE = 20;

export function BooksTab({ data }: { data: ClassTabData }) {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(data.books.length / BOOKS_PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageBooks = data.books.slice((safePage - 1) * BOOKS_PAGE_SIZE, safePage * BOOKS_PAGE_SIZE);
  if (data.books.length === 0) {
    return <ComingSoonCompact def={data.def} whatBn="বই" whatEn="Books" />;
  }
  return (
    <>
      <p style={{ color: '#57616A', margin: '0 0 12px' }}>
        {data.books.length}টি বই / {data.books.length} books · এই শ্রেণির শুধুমাত্র
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {pageBooks.map((b, i) => (
          <div key={b.id} style={{ display: 'contents' }}>
            <BookCard book={b} />
            {safePage === 1 && i === 9 ? <AdPlaceholder variant="in-content" /> : null}
          </div>
        ))}
      </div>
      {pageCount > 1 ? (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 20, flexWrap: 'wrap' }}>
          <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage <= 1}>
            ← আগের / Previous
          </Button>
          <span>
            পাতা {safePage} / {pageCount}
          </span>
          <Button variant="outline" onClick={() => setPage((p) => Math.min(pageCount, p + 1))} disabled={safePage >= pageCount}>
            পরের / Next →
          </Button>
        </div>
      ) : null}
    </>
  );
}

export function SubjectsTab({ data }: { data: ClassTabData }) {
  if (data.subjects.length === 0) {
    return <ComingSoonCompact def={data.def} whatBn="বিষয়" whatEn="Subjects" />;
  }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
      {data.subjects.map((s) => {
        const books = data.books.filter((b) => b.department === s);
        const questions = books.reduce((n, b) => n + (b.questionCount ?? 0), 0);
        const chapters = books.reduce((n, b) => n + (b.chapterCount ?? 0), 0);
        return (
          <Card key={s} hover>
            <Link
              to={`/class/${data.def.slug}/subjects/${encodeURIComponent(s)}`}
              style={{ fontWeight: 700, fontSize: 17, color: '#142B3B' }}
            >
              {s}
            </Link>
            <p style={{ margin: '8px 0 0', color: '#68747B', fontSize: 14 }}>
              {books.length}টি বই · {chapters}টি পাঠ · {questions}টি প্রশ্ন
            </p>
            <p style={{ margin: '10px 0 0' }}>
              <Link to={`/class/${data.def.slug}/subjects/${encodeURIComponent(s)}`} style={{ fontWeight: 600 }}>
                বিষয়টি দেখুন →
              </Link>
            </p>
          </Card>
        );
      })}
    </div>
  );
}

export function PracticeTab({ data }: { data: ClassTabData }) {
  if (data.books.length === 0) {
    return <ComingSoonCompact def={data.def} whatBn="অনুশীলন প্রশ্ন" whatEn="Practice questions" />;
  }
  return (
    <>
      <p style={{ color: '#57616A', margin: '0 0 12px' }}>
        মোট {data.totalQuestions}টি অনুশীলন প্রশ্ন / {data.totalQuestions} practice questions · প্রতিটি
        বইয়ের ভেতরে অধ্যায়ভিত্তিক পাঠ ও প্রশ্ন আছে।
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {data.books.slice(0, 20).map((b) => (
          <Card key={b.id} hover>
            <Link to={`/library/${b.id}`} style={{ fontWeight: 700, fontSize: 16, color: '#142B3B', lineHeight: 1.5 }}>
              {b.title}
            </Link>
            <p style={{ margin: '8px 0 0', color: '#68747B', fontSize: 14 }}>
              {b.questionCount}টি প্রশ্ন · {b.chapterCount}টি পাঠ
            </p>
            <p style={{ margin: '10px 0 0' }}>
              <Link to={`/library/${b.id}`} style={{ fontWeight: 600 }}>
                পাঠ ও প্রশ্ন দেখুন →
              </Link>
            </p>
          </Card>
        ))}
      </div>
      {data.books.length > 20 ? (
        <p style={{ marginTop: 16 }}>
          <Link to={`/class/${data.def.slug}/books`} style={{ fontWeight: 600 }}>
            সব {data.books.length}টি বই দেখুন →
          </Link>
        </p>
      ) : null}
    </>
  );
}

export function TestsTab({ data }: { data: ClassTabData }) {
  if (data.quizzes.length === 0) {
    // Class with no books at all → the friendly Coming Soon state.
    // Class WITH books but no quizzes yet → the plain "no tests yet" state.
    if (data.books.length === 0) {
      return <ComingSoonCompact def={data.def} whatBn="পরীক্ষা" whatEn="Tests" />;
    }
    return (
      <EmptyState
        bn="এই শ্রেণির কোনো পরীক্ষা এখনো তৈরি হয়নি — শীঘ্রই আসছে।"
        en="No tests for this class yet — coming soon."
      />
    );
  }
  return (
    <>
      <p style={{ color: '#57616A', margin: '0 0 12px' }}>
        {data.quizzes.length}টি পরীক্ষা / {data.quizzes.length} tests · এই শ্রেণির শুধুমাত্র
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {data.quizzes.slice(0, 20).map((q) => (
          <Card key={q.id} hover>
            <Link to={`/quiz/${q.id}`} style={{ fontWeight: 700, fontSize: 16, color: '#142B3B', lineHeight: 1.5 }}>
              {bookTitleOf(q)}
            </Link>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
              <Chip>{q.kind === 'mcq' ? 'MCQ' : 'লিখিত'}</Chip>
              <Chip tone="outline">{q.department}</Chip>
              <Chip tone="gold">{q.questionCount}টি প্রশ্ন</Chip>
            </div>
            <p style={{ margin: '10px 0 0', color: '#68747B', fontSize: 14 }}>
              মোট {q.totalMarks} নম্বর
              {q.timeLimitMinutes ? ` · ${q.timeLimitMinutes} মিনিট` : ''}
            </p>
            <p style={{ margin: '10px 0 0' }}>
              <Link to={`/quiz/${q.id}`} style={{ fontWeight: 600 }}>
                পরীক্ষা দিন →
              </Link>
            </p>
          </Card>
        ))}
      </div>
      {data.quizzes.length > 20 ? (
        <p style={{ marginTop: 16, color: '#57616A' }}>
          আরও {data.quizzes.length - 20}টি পরীক্ষা আছে — সব দেখতে{' '}
          <Link to="/exam" style={{ fontWeight: 600 }}>
            পরীক্ষার পাতায় যান →
          </Link>
        </p>
      ) : null}
    </>
  );
}

export function ResultsTab({ data }: { data: ClassTabData }) {
  if (!data.signedIn) return <SignInPrompt what="আপনার ফলাফল" />;
  if (data.attempts.length === 0) {
    return (
      <>
        <EmptyState
          bn="এই শ্রেণিতে এখনো কোনো পরীক্ষা দেননি — পরীক্ষা দিলে ফলাফল এখানে দেখাবে।"
          en="You have not taken any test in this class yet."
        />
        <p style={{ marginTop: 16 }}>
          <Link to={`/class/${data.def.slug}/tests`} style={{ fontWeight: 600 }}>
            পরীক্ষা দেখুন →
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
        const q = data.quizById.get(a.quizId);
        const d = attemptDate(a);
        return (
          <Card key={a.id} hover>
            <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 16, lineHeight: 1.5 }}>
              {q ? bookTitleOf(q) : a.subject || 'পরীক্ষা'}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 8 }}>
              <span style={{ fontFamily: "'Poppins','Hind Siliguri',system-ui,sans-serif", fontSize: 26, fontWeight: 800, color: '#12766E' }}>
                {a.percentage}%
              </span>
              <span style={{ color: '#68747B', fontSize: 14 }}>
                {a.score}/{a.totalMarks} নম্বর
              </span>
            </div>
            <p style={{ margin: '8px 0 0', color: '#68747B', fontSize: 14 }}>
              {a.markingStatus === 'auto' ? 'স্বয়ংক্রিয় মূল্যায়ন' : a.markingStatus === 'marked' ? 'মূল্যায়ন সম্পন্ন' : 'মূল্যায়ন বাকি'}
              {d ? ` · ${d.toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
            </p>
            <p style={{ margin: '10px 0 0' }}>
              <Link to={`/quiz/${a.quizId}/result/${a.id}`} style={{ fontWeight: 600 }}>
                বিস্তারিত ফলাফল →
              </Link>
            </p>
          </Card>
        );
      })}
    </div>
  );
}

export function ProgressTab({ data }: { data: ClassTabData }) {
  if (!data.signedIn) return <SignInPrompt what="আপনার অগ্রগতি" />;
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
            বই দেখুন →
          </Link>
        </p>
      </>
    );
  }
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
        <Card>
          <div style={{ fontFamily: "'Poppins','Hind Siliguri',system-ui,sans-serif", fontSize: 26, fontWeight: 800, color: '#142B3B' }}>{attempts.length}</div>
          <div style={{ color: '#68747B', fontSize: 14 }}>পরীক্ষা দিয়েছেন</div>
        </Card>
        <Card>
          <div style={{ fontFamily: "'Poppins','Hind Siliguri',system-ui,sans-serif", fontSize: 26, fontWeight: 800, color: '#142B3B' }}>{avg !== null ? `${avg}%` : '—'}</div>
          <div style={{ color: '#68747B', fontSize: 14 }}>গড় নম্বর</div>
          {avg !== null ? <ProgressBar value={avg} /> : null}
        </Card>
        <Card>
          <div style={{ fontFamily: "'Poppins','Hind Siliguri',system-ui,sans-serif", fontSize: 26, fontWeight: 800, color: '#142B3B' }}>{best !== null ? `${best}%` : '—'}</div>
          <div style={{ color: '#68747B', fontSize: 14 }}>সেরা ফলাফল</div>
        </Card>
        <Card>
          <div style={{ fontFamily: "'Poppins','Hind Siliguri',system-ui,sans-serif", fontSize: 26, fontWeight: 800, color: '#142B3B' }}>{lessonsRead}</div>
          <div style={{ color: '#68747B', fontSize: 14 }}>পাঠ পড়েছেন</div>
        </Card>
        <Card>
          <div style={{ fontFamily: "'Poppins','Hind Siliguri',system-ui,sans-serif", fontSize: 26, fontWeight: 800, color: '#142B3B' }}>
            {qAttempted > 0 ? `${qCorrect}/${qAttempted}` : '—'}
          </div>
          <div style={{ color: '#68747B', fontSize: 14 }}>সঠিক প্রশ্নোত্তর</div>
        </Card>
      </div>
      {data.quizSummaries.length > 0 ? (
        <>
          <h3 style={{ color: '#142B3B', fontSize: 17, margin: '0 0 10px' }}>মাসিক সারাংশ / Monthly summaries</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            {data.quizSummaries.map((s) => (
              <Card key={s.id}>
                <div style={{ fontWeight: 700, color: '#142B3B' }}>
                  {s.subject} · {s.month}
                </div>
                <p style={{ margin: '8px 0 0', color: '#68747B', fontSize: 14 }}>
                  {s.attemptsCount}টি চেষ্টা · গড় {s.averagePercentage}% · সেরা {s.bestPercentage}%
                </p>
                {s.weakChapters.length > 0 ? (
                  <p style={{ margin: '8px 0 0', color: '#68747B', fontSize: 14 }}>
                    দুর্বল: {s.weakChapters.slice(0, 3).join(', ')}
                  </p>
                ) : null}
              </Card>
            ))}
          </div>
        </>
      ) : null}
      <p style={{ marginTop: 16 }}>
        <Link to="/progress" style={{ fontWeight: 600 }}>
          সব শ্রেণির অগ্রগতি দেখুন →
        </Link>
      </p>
    </>
  );
}

const ROLE_BN: Record<string, string> = {
  student: 'শিক্ষার্থী',
  teacher: 'শিক্ষক',
  guardian: 'অভিভাবক',
  admin: 'অ্যাডমিন',
  owner: 'মালিক',
  moderator: 'মডারেটর',
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
  if (!data.signedIn || !profile) return <SignInPrompt what="আপনার প্রোফাইল" />;
  const rows: Array<[string, string]> = [];
  if (profile.displayName) rows.push(['নাম / Name', profile.displayName]);
  if (profile.email) rows.push(['ইমেইল / Email', profile.email]);
  if (profile.role) rows.push(['ভূমিকা / Role', ROLE_BN[profile.role] ?? profile.role]);
  if (profile.educationType) rows.push(['ধারা / Type', profile.educationType]);
  if (profile.classLevel) rows.push(['শ্রেণি / Class', profile.classLevel]);
  if (profile.department) rows.push(['বিভাগ / Department', profile.department]);
  if (profile.board) rows.push(['বোর্ড / Board', profile.board]);
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
            <div style={{ fontWeight: 700, fontSize: 18, color: '#142B3B' }}>{profile.displayName ?? '—'}</div>
            <div style={{ color: '#68747B', fontSize: 14 }}>
              {data.def.bn} ড্যাশবোর্ডে আছেন · Viewing {data.def.en} dashboard
            </div>
          </div>
        </div>
        <dl style={{ margin: '16px 0 0', display: 'grid', gap: 8 }}>
          {rows.map(([k, v]) => (
            <div key={k} style={{ display: 'flex', gap: 10, fontSize: 15 }}>
              <dt style={{ color: '#68747B', minWidth: 130 }}>{k}</dt>
              <dd style={{ margin: 0, color: '#202B33', fontWeight: 600 }}>{v}</dd>
            </div>
          ))}
        </dl>
        <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
          <LinkButton to="/profile" variant="primary">
            সম্পূর্ণ প্রোফাইল / Full profile
          </LinkButton>
          <Button variant="outline" onClick={onSignOut}>
            লগআউট / Log out
          </Button>
        </div>
      </Card>
      <p style={{ marginTop: 14, color: '#68747B', fontSize: 14 }}>
        আপনার তথ্য শুধু আপনিই দেখতে পাবেন — অন্য শিক্ষার্থী বা শিক্ষক আপনার ব্যক্তিগত তথ্য দেখতে
        পায় না।
      </p>
    </>
  );
}
