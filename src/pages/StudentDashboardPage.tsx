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
import { PageShell, EmptyState } from '../components/PageShell';
import { AlertBox, Button, Chip, LinkButton, ProgressBar, Skeleton, SkeletonCards, StatCard } from '../components/ui';
import { DashboardBookCard } from '../components/DashboardBookCard';
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
        <Skeleton lines={3} />
        <SkeletonCards count={3} />
      </PageShell>
    );
  }

  if (!user || !profile) {
    return (
      <PageShell titleBn={d.studentTitle.bn} titleEn={d.studentTitle.en}>
        <p>{strings.profile.notSignedIn.bn}</p>
        <p>
          <LinkButton to="/login" variant="outline">{strings.auth.loginTitle.bn}</LinkButton>
        </p>
      </PageShell>
    );
  }

  if (profile.role === 'teacher' || profile.role === 'parent') {
    return (
      <PageShell titleBn={d.studentTitle.bn} titleEn={d.studentTitle.en}>
        <p>এই ড্যাশবোর্ড শুধু শিক্ষার্থীদের জন্য।</p>
        <p>
          <LinkButton to="/dashboard" variant="outline">আপনার ড্যাশবোর্ডে যান →</LinkButton>
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
  const heroChips = [profile.classLevel, profile.institution, profile.department].filter(Boolean) as string[];

  return (
    <PageShell titleBn={d.studentTitle.bn} titleEn={d.studentTitle.en}>
      <div className="ev-dash-hero">
        <h2>👋 {profile.displayName}</h2>
        <p>{academicProfileSummary(profile) || '—'}</p>
        {heroChips.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
            {heroChips.map((c) => (
              <Chip key={c}>{c}</Chip>
            ))}
          </div>
        ) : null}
      </div>

      <div className="ev-dash-stats">
        <StatCard value={String(bookmarkCount ?? '…')} labelBn="বুকমার্ক" labelEn="Bookmarks" numeric={bookmarkCount ?? undefined} />
        <StatCard value={summaries === null ? '…' : String(summaries.length)} labelBn="পরীক্ষার সারসংক্ষেপ" labelEn="Exam summaries" numeric={summaries === null ? undefined : summaries.length} suffix="টি বিষয়" />
        <StatCard value={String(books.length)} labelBn="এই পাতার বই" labelEn="Books on this page" numeric={books.length} />
      </div>

      <div className="ev-dash-actions">
        <LinkButton to="/library">লাইব্রেরি / Library</LinkButton>
        <LinkButton to="/exam" variant="outline">পরীক্ষা / Exams</LinkButton>
        <LinkButton to="/progress" variant="outline">আমার অগ্রগতি / My Progress</LinkButton>
        <LinkButton to="/profile" variant="outline">প্রোফাইল সেটিংস / Profile Settings</LinkButton>
      </div>

      {!hasProfile ? (
        <EmptyState bn={EMPTY_STATES.noProfile.bn} en={EMPTY_STATES.noProfile.en} />
      ) : (
        <>
          <h2 className="ev-section-h2">{d.myBooks.bn} / {d.myBooks.en}</h2>
          {error ? <AlertBox tone="error">{error}</AlertBox> : null}
          {fetching && !page ? <SkeletonCards count={3} /> : null}
          {page && books.length === 0 && !fetching ? (
            <EmptyState bn={EMPTY_STATES.noContent.bn} en={EMPTY_STATES.noContent.en} />
          ) : null}
          {books.length > 0 ? (
            <>
              <div className="ev-dash-grid">
                {books.map((b) => (
                  <DashboardBookCard key={b.id} book={b} />
                ))}
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 20, flexWrap: 'wrap' }}>
                <Button variant="outline" onClick={prevPage} disabled={pageIndex <= 0 || fetching}>
                  ← আগের / Previous
                </Button>
                <span>পাতা {pageIndex + 1} / Page {pageIndex + 1}</span>
                <Button variant="outline" onClick={nextPage} disabled={!page?.hasMore || fetching}>
                  {fetching ? strings.common.loading.bn : 'পরের / Next →'}
                </Button>
              </div>
              <p className="ev-muted-ivory" style={{ fontSize: 13 }}>
                এই পাতায় {books.length}টি বই · প্রতি পাতায় সর্বোচ্চ ৫০টি — প্রোফাইল অনুযায়ী ফিল্টার করা।
              </p>
            </>
          ) : null}
        </>
      )}

      {weak.length > 0 ? (
        <>
          <h2 className="ev-section-h2">{d.weakAreas.bn} / {d.weakAreas.en}</h2>
          {weak.map((s) => (
            <div className="ev-dash-row" key={String(s.id)}>
              <span className="ev-dash-row-label">{String(s.subject ?? '')}</span>
              <span className="ev-dash-row-bar">
                <ProgressBar value={Number(s.averagePercentage ?? 0)} tone="gold" label={`${String(s.subject ?? '')} ${String(s.averagePercentage ?? '')}%`} />
              </span>
              <span className="ev-dash-row-pct">{String(s.averagePercentage ?? '')}%</span>
            </div>
          ))}
        </>
      ) : null}
      {strong.length > 0 ? (
        <>
          <h2 className="ev-section-h2">{d.strongAreas.bn} / {d.strongAreas.en}</h2>
          {strong.map((s) => (
            <div className="ev-dash-row" key={String(s.id)}>
              <span className="ev-dash-row-label">{String(s.subject ?? '')}</span>
              <span className="ev-dash-row-bar">
                <ProgressBar value={Number(s.averagePercentage ?? 0)} label={`${String(s.subject ?? '')} ${String(s.averagePercentage ?? '')}%`} />
              </span>
              <span className="ev-dash-row-pct">{String(s.averagePercentage ?? '')}%</span>
            </div>
          ))}
        </>
      ) : null}
    </PageShell>
  );
}
