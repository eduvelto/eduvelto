// Eduvelto — Student Dashboard (Step 5/7/8).
//
// Shows ONLY the books/subjects/chapters/lessons matching the student's
// own academic profile (educationType, classLevel, department, program,
// board). The query filters by the profile FIRST and reads at most 50
// documents per page — the full 609-book list is never loaded. When the
// profile matches nothing, the honest empty state is shown; another
// class's books are never displayed. Changing the profile (Settings)
// never deletes progress/bookmarks/results — they are keyed to content
// IDs and stay saved (see the test report, case D1).
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageShell, EmptyState } from '../components/PageShell';
import { strings } from '../i18n/strings';
import { useAuth } from '../lib/auth';
import { academicProfileSummary, EMPTY_STATES } from '../lib/academicProfile';
import {
  listBooksForStudent,
  listChildBookmarks,
  listChildProgressSummaries,
  type Page,
} from '../lib/dashboardContent';
import type { Book } from '../lib/content';
import type { DocumentSnapshot } from 'firebase/firestore';

const buttonStyle: React.CSSProperties = {
  padding: '10px 16px',
  minHeight: 44,
  borderRadius: 6,
  border: '1px solid #0A1F44',
  background: '#fff',
  color: '#0A1F44',
  cursor: 'pointer',
};

export default function StudentDashboardPage() {
  const { user, profile, loading } = useAuth();
  const d = strings.dashboard;
  const [page, setPage] = useState<Page<Book> | null>(null);
  const [cursors, setCursors] = useState<(DocumentSnapshot | null)[]>([null]);
  const [pageIndex, setPageIndex] = useState(0);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState('');
  const [bookmarkCount, setBookmarkCount] = useState<number | null>(null);
  const [summaries, setSummaries] = useState<Record<string, unknown>[] | null>(null);

  const hasProfile = !!profile && (profile.classLevel || profile.department || profile.educationType);

  useEffect(() => {
    if (!user || !profile || !hasProfile) return;
    let live = true;
    setFetching(true);
    listBooksForStudent(profile, cursors[pageIndex] ?? undefined)
      .then((p) => {
        if (live) setPage(p);
      })
      .catch(() => {
        if (live) setError('বই লোড করা যায়নি — আবার চেষ্টা করুন। / Could not load books — please try again.');
      })
      .finally(() => {
        if (live) setFetching(false);
      });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile, pageIndex]);

  useEffect(() => {
    if (!user) return;
    let live = true;
    listChildBookmarks(user.uid)
      .then((b) => {
        if (live) setBookmarkCount(b.length);
      })
      .catch(() => {
        if (live) setBookmarkCount(0);
      });
    listChildProgressSummaries(user.uid)
      .then((s) => {
        if (live) setSummaries(s);
      })
      .catch(() => {
        if (live) setSummaries([]);
      });
    return () => {
      live = false;
    };
  }, [user]);

  if (loading) {
    return (
      <PageShell titleBn={d.studentTitle.bn} titleEn={d.studentTitle.en}>
        <p>{strings.common.loading.bn}</p>
      </PageShell>
    );
  }

  if (!user || !profile) {
    return (
      <PageShell titleBn={d.studentTitle.bn} titleEn={d.studentTitle.en}>
        <p>{strings.profile.notSignedIn.bn}</p>
        <p>
          <Link to="/login">{strings.auth.loginTitle.bn}</Link>
        </p>
      </PageShell>
    );
  }

  if (profile.role === 'teacher' || profile.role === 'parent') {
    return (
      <PageShell titleBn={d.studentTitle.bn} titleEn={d.studentTitle.en}>
        <p>এই ড্যাশবোর্ড শুধু শিক্ষার্থীদের জন্য।</p>
        <p>
          <Link to="/dashboard">আপনার ড্যাশবোর্ডে যান →</Link>
        </p>
      </PageShell>
    );
  }

  function nextPage() {
    if (!page?.cursor || !page.hasMore) return;
    setCursors((c) => [...c, page.cursor]);
    setPageIndex((i) => i + 1);
  }

  function prevPage() {
    if (pageIndex <= 0) return;
    setPageIndex((i) => i - 1);
  }

  const books = page?.items ?? [];
  const weak = (summaries ?? []).filter((s) => typeof s.averagePercentage === 'number' && (s.averagePercentage as number) < 60);
  const strong = (summaries ?? []).filter((s) => typeof s.averagePercentage === 'number' && (s.averagePercentage as number) >= 80);

  return (
    <PageShell titleBn={d.studentTitle.bn} titleEn={d.studentTitle.en}>
      <p style={{ fontSize: 17 }}>
        👋 {profile.displayName} · {academicProfileSummary(profile) || '—'}
      </p>
      <p style={{ color: '#555' }}>
        বুকমার্ক: {bookmarkCount ?? '…'} · পরীক্ষার সারসংক্ষেপ: {summaries === null ? '…' : summaries.length}টি বিষয়
      </p>
      <p>
        <Link to="/library">লাইব্রেরি / Library</Link>
        {' · '}
        <Link to="/exam">পরীক্ষা / Exams</Link>
        {' · '}
        <Link to="/progress">আমার অগ্রগতি / My Progress</Link>
        {' · '}
        <Link to="/profile">প্রোফাইল সেটিংস / Profile Settings</Link>
      </p>

      {!hasProfile ? (
        <EmptyState bn={EMPTY_STATES.noProfile.bn} en={EMPTY_STATES.noProfile.en} />
      ) : (
        <>
          <h2 style={{ fontSize: 19 }}>{d.myBooks.bn} / {d.myBooks.en}</h2>
          {error ? <p style={{ color: '#b00020' }}>{error}</p> : null}
          {fetching && !page ? <p>{strings.common.loading.bn}</p> : null}
          {page && books.length === 0 && !fetching ? (
            <EmptyState bn={EMPTY_STATES.noContent.bn} en={EMPTY_STATES.noContent.en} />
          ) : null}
          {books.length > 0 ? (
            <>
              <ul style={{ paddingLeft: 20 }}>
                {books.map((b) => (
                  <li key={b.id} style={{ marginBottom: 10, lineHeight: 1.5 }}>
                    <Link to={`/library/${b.id}`}>{b.title}</Link>
                    <span style={{ color: '#555', fontSize: 13 }}>
                      {' '}· {b.paperCode} · {b.department} · {b.classLevel} · {b.chapterCount}টি পাঠ · {b.questionCount}টি প্রশ্ন
                    </span>
                  </li>
                ))}
              </ul>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 16 }}>
                <button type="button" onClick={prevPage} disabled={pageIndex <= 0 || fetching} style={buttonStyle}>
                  ← আগের / Previous
                </button>
                <span>পাতা {pageIndex + 1} / Page {pageIndex + 1}</span>
                <button type="button" onClick={nextPage} disabled={!page?.hasMore || fetching} style={buttonStyle}>
                  {fetching ? strings.common.loading.bn : 'পরের / Next →'}
                </button>
              </div>
              <p style={{ color: '#555', fontSize: 13 }}>
                এই পাতায় {books.length}টি বই · প্রতি পাতায় সর্বোচ্চ ৫০টি — প্রোফাইল অনুযায়ী ফিল্টার করা।
              </p>
            </>
          ) : null}
        </>
      )}

      {weak.length > 0 ? (
        <>
          <h2 style={{ fontSize: 19 }}>{d.weakAreas.bn} / {d.weakAreas.en}</h2>
          <ul style={{ paddingLeft: 20 }}>
            {weak.map((s) => (
              <li key={String(s.id)}>
                {String(s.subject ?? '')} — {String(s.averagePercentage ?? '')}%
              </li>
            ))}
          </ul>
        </>
      ) : null}
      {strong.length > 0 ? (
        <>
          <h2 style={{ fontSize: 19 }}>{d.strongAreas.bn} / {d.strongAreas.en}</h2>
          <ul style={{ paddingLeft: 20 }}>
            {strong.map((s) => (
              <li key={String(s.id)}>
                {String(s.subject ?? '')} — {String(s.averagePercentage ?? '')}%
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </PageShell>
  );
}
