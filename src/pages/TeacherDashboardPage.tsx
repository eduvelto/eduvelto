// Eduvelto — Teacher Dashboard (Step 5/7).
//
// Shows ONLY the teacher's own APPROVED (verified) subjects/classes
// and materials. Approval lives in the teacherVerifications record
// (Admin human check) — the profile's self-typed subjects are the
// REQUEST, never the approval. An unverified teacher sees the pending
// banner and NO teaching content. Subject/class changes go through a
// change request (teacherChanges.ts) — pending until an Admin
// approves; the old approved subjects stay visible meanwhile.
import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { PageShell, EmptyState } from '../components/PageShell';
import { AlertBox, Button, Card, Chip, LinkButton, Skeleton, SkeletonCards } from '../components/ui';
import { DashboardBookCard } from '../components/DashboardBookCard';
import { strings } from '../i18n/strings';
import { useAuth } from '../lib/auth';
import { EMPTY_STATES } from '../lib/academicProfile';
import { listBooksForTeacher, type Page } from '../lib/dashboardContent';
import {
  listMyChangeRequests,
  submitTeacherChangeRequest,
  type TeacherChangeRequest,
} from '../lib/teacherChanges';
import type { Book } from '../lib/content';
import type { DocumentSnapshot } from 'firebase/firestore';

export default function TeacherDashboardPage() {
  const { user, profile, loading } = useAuth();
  const d = strings.dashboard;
  const [approvedSubjects, setApprovedSubjects] = useState<string[] | null>(null);
  const [approvedClasses, setApprovedClasses] = useState<string[] | null>(null);
  const [hasApplication, setHasApplication] = useState<boolean | null>(null);
  const [page, setPage] = useState<Page<Book> | null>(null);
  const [cursors, setCursors] = useState<(DocumentSnapshot | null)[]>([null]);
  const [pageIndex, setPageIndex] = useState(0);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState('');
  const [requests, setRequests] = useState<TeacherChangeRequest[] | null>(null);
  const [reqSubjects, setReqSubjects] = useState('');
  const [reqClasses, setReqClasses] = useState('');
  const [reqLevel, setReqLevel] = useState('');
  const [reqReason, setReqReason] = useState('');
  const [reqBusy, setReqBusy] = useState(false);
  const [reqDone, setReqDone] = useState(false);
  const [reqError, setReqError] = useState<string | null>(null);

  const verified = profile?.verificationStatus === 'verified';

  // Load the teacher's own verification record (subjects approved by Admin).
  useEffect(() => {
    if (!user || !db) return;
    let live = true;
    getDocs(query(collection(db, 'teacherVerifications'), where('userId', '==', user.uid), limit(1)))
      .then((snap) => {
        if (!live) return;
        if (snap.empty) {
          setHasApplication(false);
          setApprovedSubjects([]);
          setApprovedClasses([]);
          return;
        }
        setHasApplication(true);
        const data = snap.docs[0].data() as Record<string, unknown>;
        const subjects = Array.isArray(data.subjects) ? (data.subjects as string[]) : [];
        const classes = Array.isArray(data.classes) ? (data.classes as string[]) : [];
        setApprovedSubjects(subjects);
        setApprovedClasses(classes);
      })
      .catch(() => {
        if (live) {
          setHasApplication(null);
          setApprovedSubjects([]);
          setApprovedClasses([]);
        }
      });
    return () => {
      live = false;
    };
  }, [user]);

  useEffect(() => {
    if (!user || !profile || !verified || approvedSubjects === null || approvedClasses === null) return;
    if (approvedSubjects.length === 0 || approvedClasses.length === 0) return;
    let live = true;
    setFetching(true);
    listBooksForTeacher(profile, approvedSubjects, approvedClasses, cursors[pageIndex] ?? undefined)
      .then((p) => {
        if (live) setPage(p);
      })
      .catch(() => {
        if (live) setError('উপকরণ লোড করা যায়নি — আবার চেষ্টা করুন। / Could not load materials — please try again.');
      })
      .finally(() => {
        if (live) setFetching(false);
      });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile, verified, approvedSubjects, approvedClasses, pageIndex]);

  useEffect(() => {
    if (!user || !db) return;
    let live = true;
    listMyChangeRequests(db, user.uid)
      .then((r) => {
        if (live) setRequests(r);
      })
      .catch(() => {
        if (live) setRequests([]);
      });
    return () => {
      live = false;
    };
  }, [user, reqDone]);

  if (loading) {
    return (
      <PageShell titleBn={d.teacherTitle.bn} titleEn={d.teacherTitle.en}>
        <Skeleton lines={3} />
        <SkeletonCards count={3} />
      </PageShell>
    );
  }

  if (!user || !profile) {
    return (
      <PageShell titleBn={d.teacherTitle.bn} titleEn={d.teacherTitle.en}>
        <p>{strings.profile.notSignedIn.bn}</p>
        <p>
          <LinkButton to="/login" variant="outline">{strings.auth.loginTitle.bn}</LinkButton>
        </p>
      </PageShell>
    );
  }

  if (profile.role === 'student' || profile.role === 'parent') {
    return (
      <PageShell titleBn={d.teacherTitle.bn} titleEn={d.teacherTitle.en}>
        <p>এই ড্যাশবোর্ড শুধু শিক্ষকদের জন্য।</p>
        <p>
          <LinkButton to="/dashboard" variant="outline">আপনার ড্যাশবোর্ডে যান →</LinkButton>
        </p>
      </PageShell>
    );
  }

  async function onChangeRequest(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (!db || !user) return;
    setReqError(null);
    setReqDone(false);
    const subjects = reqSubjects.split(',').map((s) => s.trim()).filter(Boolean);
    const classes = reqClasses.split(',').map((s) => s.trim()).filter(Boolean);
    if (subjects.length === 0 || classes.length === 0) {
      setReqError('কমপক্ষে একটি বিষয় ও একটি শ্রেণি লিখুন। / Enter at least one subject and one class.');
      return;
    }
    if (reqReason.trim().length < 10) {
      setReqError('কারণ কমপক্ষে ১০ অক্ষরের হতে হবে। / The reason must be at least 10 characters.');
      return;
    }
    setReqBusy(true);
    try {
      await submitTeacherChangeRequest(db, user.uid, subjects, classes, reqLevel.trim(), reqReason.trim());
      setReqDone(true);
      setReqSubjects('');
      setReqClasses('');
      setReqReason('');
    } catch (err) {
      setReqError(err instanceof Error ? err.message : 'অনুরোধ পাঠানো যায়নি। / Could not send the request.');
    } finally {
      setReqBusy(false);
    }
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
  const pendingRequests = (requests ?? []).filter((r) => r.status === 'pending');

  return (
    <PageShell titleBn={d.teacherTitle.bn} titleEn={d.teacherTitle.en}>
      <div className="ev-dash-hero">
        <h2>🪪 {profile.displayName}</h2>
        <p style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginTop: 10 }}>
          <span>{strings.dashboard.verified.bn}:</span>
          {verified ? (
            <Chip>✅ {d.verified.bn}</Chip>
          ) : (
            <Chip tone="gold">⏳ {d.verificationPending.bn}</Chip>
          )}
        </p>
      </div>
      {hasApplication === false ? (
        <AlertBox tone="info">
          শিক্ষক ভেরিফিকেশনের জন্য এখনো আবেদন করেননি।{' '}
          <Link to="/teacher/register">শিক্ষক রেজিস্ট্রেশন →</Link>
        </AlertBox>
      ) : null}
      {!verified ? (
        <EmptyState bn={EMPTY_STATES.teacherPending.bn} en={EMPTY_STATES.teacherPending.en} />
      ) : (
        <>
          <h2 className="ev-section-h2">{d.mySubjects.bn} / {d.mySubjects.en}</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
            {(approvedSubjects ?? []).length > 0 ? (
              approvedSubjects?.map((s) => <Chip key={s}>{s}</Chip>)
            ) : (
              <span className="ev-muted-ivory">—</span>
            )}
          </div>
          <h2 className="ev-section-h2">{d.myClasses.bn} / {d.myClasses.en}</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
            {(approvedClasses ?? []).length > 0 ? (
              approvedClasses?.map((c) => <Chip key={c} tone="gold">{c}</Chip>)
            ) : (
              <span className="ev-muted-ivory">—</span>
            )}
          </div>
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
            </>
          ) : null}
        </>
      )}

      {verified ? (
        <>
          <h2 className="ev-section-h2">{d.changeRequestTitle.bn} / {d.changeRequestTitle.en}</h2>
          <p className="ev-muted-ivory">{d.changeRequestNote.bn}</p>
          {pendingRequests.length > 0 ? (
            <AlertBox tone="info">
              ⏳ {pendingRequests.length}টি অনুরোধ অনুমোদনের অপেক্ষায় আছে। / {pendingRequests.length} request(s)
              awaiting approval.
            </AlertBox>
          ) : null}
          <Card>
            <form onSubmit={onChangeRequest}>
              <label className="ev-label" htmlFor="req-subjects">
                {d.subjects.bn} / {d.subjects.en} (কমা দিয়ে আলাদা করুন / comma-separated)
              </label>
              <input
                id="req-subjects"
                className="ev-input"
                style={{ marginBottom: 14 }}
                type="text"
                value={reqSubjects}
                onChange={(e) => setReqSubjects(e.target.value)}
                placeholder="যেমন: English, Mathematics"
              />
              <label className="ev-label" htmlFor="req-classes">
                {d.myClasses.bn} / {d.myClasses.en} (কমা দিয়ে আলাদা করুন / comma-separated)
              </label>
              <input
                id="req-classes"
                className="ev-input"
                style={{ marginBottom: 14 }}
                type="text"
                value={reqClasses}
                onChange={(e) => setReqClasses(e.target.value)}
                placeholder="যেমন: 3rd Year, SSC"
              />
              <label className="ev-label" htmlFor="req-level">
                {d.teachingLevel.bn} / {d.teachingLevel.en}
              </label>
              <input
                id="req-level"
                className="ev-input"
                style={{ marginBottom: 14 }}
                type="text"
                value={reqLevel}
                onChange={(e) => setReqLevel(e.target.value)}
                placeholder="যেমন: Honours"
              />
              <label className="ev-label" htmlFor="req-reason">
                কারণ / Reason (কমপক্ষে ১০ অক্ষর / at least 10 characters)
              </label>
              <input
                id="req-reason"
                className="ev-input"
                style={{ marginBottom: 14 }}
                type="text"
                value={reqReason}
                onChange={(e) => setReqReason(e.target.value)}
                placeholder="কেন পরিবর্তন প্রয়োজন"
              />
              {reqError ? <AlertBox tone="error">{reqError}</AlertBox> : null}
              {reqDone ? <AlertBox tone="ok">অনুরোধ পাঠানো হয়েছে — অ্যাডমিন অনুমোদন দিলে প্রযোজ্য হবে।</AlertBox> : null}
              <Button type="submit" loading={reqBusy}>
                {reqBusy ? strings.common.loading.bn : 'অনুরোধ পাঠান / Send request'}
              </Button>
            </form>
          </Card>
        </>
      ) : null}
    </PageShell>
  );
}
