// Eduvelto — Guardian Dashboard (Step 8).
//
// One view per LINKED child. A guardian sees ONLY children with a
// VERIFIED parentLink — progress, results, books, routine/reports for
// that child. Never another family's child, never the child's
// messages, never the child's email/phone (the guardian dashboard
// NEVER reads a child's users doc — the child's name + academic
// snapshot come from the parentLinks document itself, which the child
// keeps in sync when their class changes). When the child changes
// class, the link snapshot updates and this dashboard updates with it.
import { useEffect, useState, type FormEvent } from 'react';
import { db } from '../firebase';
import { PageShell, EmptyState } from '../components/PageShell';
import { AlertBox, Button, Card, Chip, LinkButton, ProgressBar, Skeleton, SkeletonCards, StatCard } from '../components/ui';
import { DashboardBookCard } from '../components/DashboardBookCard';
import { strings } from '../i18n/strings';
import { useAuth } from '../lib/auth';
import { EMPTY_STATES } from '../lib/academicProfile';
import {
  listBooksForStudent,
  listChildBookmarks,
  listChildProgress,
  listChildProgressSummaries,
  type Page,
} from '../lib/dashboardContent';
import {
  listMyLinks,
  requestParentLink,
  revokeParentLink,
  type ParentLink,
} from '../lib/guardian';
import type { Book } from '../lib/content';
import type { UserProfile } from '../lib/profile';
import type { DocumentSnapshot } from 'firebase/firestore';

/** Map a book educationType value back to the profile enum. */
function profileTypeForBookType(bookType: string | undefined): UserProfile['educationType'] {
  switch (bookType) {
    case 'Higher':
      return 'higher';
    case 'Madrasa':
      return 'madrasa';
    case 'Technical':
      return 'technical';
    case 'SSC':
    case 'HSC':
      return 'general';
    default:
      return null;
  }
}

/** Build the filter profile for a child from the link snapshot. */
function childProfileFromLink(link: ParentLink): UserProfile {
  return {
    displayName: link.childDisplayName,
    email: '',
    role: 'student',
    educationType: profileTypeForBookType(link.childEducationType),
    board: link.childBoard ?? null,
    institution: link.childInstitution ?? null,
    program: link.childProgram ?? null,
    department: link.childDepartment ?? null,
    classLevel: link.childClassLevel ?? null,
    language: 'bn',
  };
}

export default function GuardianDashboardPage() {
  const { user, profile, loading } = useAuth();
  const d = strings.dashboard;
  const [links, setLinks] = useState<ParentLink[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [booksPage, setBooksPage] = useState<Page<Book> | null>(null);
  const [cursors, setCursors] = useState<(DocumentSnapshot | null)[]>([null]);
  const [pageIndex, setPageIndex] = useState(0);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState<{ subject: string; lessonsRead?: number; questionsAttempted?: number }[] | null>(null);
  const [bookmarkCount, setBookmarkCount] = useState<number | null>(null);
  const [summaries, setSummaries] = useState<Record<string, unknown>[] | null>(null);
  const [childUid, setChildUid] = useState('');
  const [childName, setChildName] = useState('');
  const [childClass, setChildClass] = useState('');
  const [childInstitution, setChildInstitution] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [guardianContact, setGuardianContact] = useState('');
  const [linkBusy, setLinkBusy] = useState(false);
  const [linkDone, setLinkDone] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [revoking, setRevoking] = useState(false);

  const verifiedLinks = (links ?? []).filter((l) => l.status === 'verified');
  const selected = verifiedLinks.find((l) => l.id === selectedId) ?? verifiedLinks[0] ?? null;

  useEffect(() => {
    if (!user || !db) return;
    let live = true;
    listMyLinks(db, user.uid)
      .then((l) => {
        if (live) setLinks(l);
      })
      .catch(() => {
        if (live) setLinks([]);
      });
    return () => {
      live = false;
    };
  }, [user, linkDone, revoking]);

  // Per-child data: books (filtered by the child's snapshot profile),
  // progress, bookmarks, results summaries.
  useEffect(() => {
    if (!selected) {
      setBooksPage(null);
      setProgress(null);
      setBookmarkCount(null);
      setSummaries(null);
      return;
    }
    const childProfile = childProfileFromLink(selected);
    let live = true;
    setFetching(true);
    listBooksForStudent(childProfile, cursors[pageIndex] ?? undefined)
      .then((p) => {
        if (live) setBooksPage(p);
      })
      .catch(() => {
        if (live) setError('বই লোড করা যায়নি — আবার চেষ্টা করুন। / Could not load books — please try again.');
      })
      .finally(() => {
        if (live) setFetching(false);
      });
    listChildProgress(selected.studentId)
      .then((p) => {
        if (live) setProgress(p);
      })
      .catch(() => {
        if (live) setProgress([]);
      });
    listChildBookmarks(selected.studentId)
      .then((b) => {
        if (live) setBookmarkCount(b.length);
      })
      .catch(() => {
        if (live) setBookmarkCount(0);
      });
    listChildProgressSummaries(selected.studentId)
      .then((s) => {
        if (live) setSummaries(s);
      })
      .catch(() => {
        if (live) setSummaries([]);
      });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id, selected?.childClassLevel, pageIndex]);

  if (loading) {
    return (
      <PageShell titleBn={d.guardianTitle.bn} titleEn={d.guardianTitle.en}>
        <Skeleton lines={3} />
        <SkeletonCards count={3} />
      </PageShell>
    );
  }

  if (!user || !profile) {
    return (
      <PageShell titleBn={d.guardianTitle.bn} titleEn={d.guardianTitle.en}>
        <p>{strings.profile.notSignedIn.bn}</p>
        <p>
          <LinkButton to="/login" variant="outline">{strings.auth.loginTitle.bn}</LinkButton>
        </p>
      </PageShell>
    );
  }

  if (profile.role === 'student' || profile.role === 'teacher') {
    return (
      <PageShell titleBn={d.guardianTitle.bn} titleEn={d.guardianTitle.en}>
        <p>এই ড্যাশবোর্ড শুধু অভিভাবকদের জন্য।</p>
        <p>
          <LinkButton to="/dashboard" variant="outline">আপনার ড্যাশবোর্ডে যান →</LinkButton>
        </p>
      </PageShell>
    );
  }

  async function onLinkChild(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (!db || !user) return;
    setLinkError(null);
    setLinkDone(false);
    const uid = childUid.trim();
    if (!guardianName.trim() || !relationship.trim()) {
      setLinkError('আপনার নাম ও সন্তানের সঙ্গে সম্পর্ক — দুটোই লাগবে। / Your name and relationship to the child are both required.');
      return;
    }
    if (!uid || !childName.trim() || !childClass.trim()) {
      setLinkError('সন্তানের Eduvelto ID, নাম ও শ্রেণি — তিনটিই লাগবে। / Child Eduvelto ID, name and class are all required.');
      return;
    }
    setLinkBusy(true);
    try {
      await requestParentLink(db, user.uid, uid, {
        guardianDisplayName: guardianName.trim(),
        relationship: relationship.trim(),
        guardianContact: guardianContact.trim(),
        childDisplayName: childName.trim(),
        childClassLevel: childClass.trim(),
        childInstitution: childInstitution.trim(),
      });
      setLinkDone(true);
      setChildUid('');
      setChildName('');
      setChildClass('');
      setChildInstitution('');
      setGuardianName('');
      setRelationship('');
      setGuardianContact('');
    } catch (err) {
      setLinkError(err instanceof Error ? err.message : 'অনুরোধ পাঠানো যায়নি। / Could not send the request.');
    } finally {
      setLinkBusy(false);
    }
  }

  async function onRevoke(linkId: string): Promise<void> {
    if (!db || !user) return;
    setRevoking(true);
    try {
      await revokeParentLink(db, linkId, user.uid);
    } finally {
      setRevoking(false);
    }
  }

  function nextPage() {
    if (!booksPage?.cursor || !booksPage.hasMore) return;
    setCursors((c) => [...c, booksPage.cursor]);
    setPageIndex((i) => i + 1);
  }

  function prevPage() {
    if (pageIndex <= 0) return;
    setPageIndex((i) => i - 1);
  }

  const books = booksPage?.items ?? [];
  const weak = (summaries ?? []).filter((s) => typeof s.averagePercentage === 'number' && (s.averagePercentage as number) < 60);
  const strong = (summaries ?? []).filter((s) => typeof s.averagePercentage === 'number' && (s.averagePercentage as number) >= 80);
  const pendingLinks = (links ?? []).filter((l) => l.status === 'pending' || l.status === 'confirmed');
  const rejectedLinks = (links ?? []).filter((l) => l.status === 'rejected');

  return (
    <PageShell titleBn={d.guardianTitle.bn} titleEn={d.guardianTitle.en}>
      <div className="ev-dash-hero">
        <h2>👨‍👩‍👧 {profile.displayName}</h2>
      </div>

      {verifiedLinks.length === 0 ? (
        <EmptyState bn={EMPTY_STATES.guardianNoChildren.bn} en={EMPTY_STATES.guardianNoChildren.en} />
      ) : (
        <>
          <div className="ev-dash-tabs" role="tablist" aria-label="সন্তান / Children">
            {verifiedLinks.map((l) => (
              <button
                key={l.id}
                type="button"
                role="tab"
                aria-selected={selected?.id === l.id}
                onClick={() => {
                  setSelectedId(l.id);
                  setPageIndex(0);
                  setCursors([null]);
                }}
                className={`ev-dash-tab ${selected?.id === l.id ? 'ev-dash-tab-active' : ''}`}
              >
                {l.childDisplayName} ({l.childClassLevel})
              </button>
            ))}
          </div>
          {selected ? (
            <>
              <Card style={{ marginBottom: 16 }}>
                <h2 style={{ fontSize: 20, margin: '0 0 6px' }}>
                  {selected.childDisplayName} · {selected.childClassLevel}
                  {selected.childInstitution ? ` · ${selected.childInstitution}` : ''}
                </h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  <Chip>{selected.childClassLevel}</Chip>
                  {selected.childInstitution ? <Chip tone="outline">{selected.childInstitution}</Chip> : null}
                </div>
              </Card>
              <div className="ev-dash-stats">
                <StatCard value={String((progress ?? []).length)} labelBn="অগ্রগতি" labelEn="Progress subjects" numeric={(progress ?? []).length} suffix="টি বিষয়" />
                <StatCard value={bookmarkCount === null ? '…' : String(bookmarkCount)} labelBn="বুকমার্ক" labelEn="Bookmarks" numeric={bookmarkCount ?? undefined} />
                <StatCard value={summaries === null ? '…' : String(summaries.length)} labelBn="পরীক্ষার সারসংক্ষেপ" labelEn="Exam summaries" numeric={summaries === null ? undefined : summaries.length} suffix="টি বিষয়" />
              </div>
              {weak.length > 0 ? (
                <>
                  <h3 className="ev-section-h2">{d.weakAreas.bn} / {d.weakAreas.en}</h3>
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
                  <h3 className="ev-section-h2">{d.strongAreas.bn} / {d.strongAreas.en}</h3>
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
              <h3 className="ev-section-h2">{d.myBooks.bn} / {d.myBooks.en}</h3>
              {error ? <AlertBox tone="error">{error}</AlertBox> : null}
              {fetching && !booksPage ? <SkeletonCards count={3} /> : null}
              {booksPage && books.length === 0 && !fetching ? (
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
                    <Button variant="outline" onClick={nextPage} disabled={!booksPage?.hasMore || fetching}>
                      {fetching ? strings.common.loading.bn : 'পরের / Next →'}
                    </Button>
                  </div>
                </>
              ) : null}
              <p style={{ marginTop: 20 }}>
                <Button variant="danger" onClick={() => void onRevoke(selected.id)} loading={revoking}>
                  {revoking ? strings.common.loading.bn : `${d.revokeLink.bn} / ${d.revokeLink.en}`}
                </Button>
              </p>
            </>
          ) : null}
        </>
      )}

      {pendingLinks.length > 0 ? (
        <>
          <h2 className="ev-section-h2">অপেক্ষমাণ সংযোগ / Pending links</h2>
          <div className="ev-dash-grid">
            {pendingLinks.map((l) => (
              <Card key={l.id}>
                <strong style={{ fontSize: 16 }}>{l.childDisplayName} ({l.childClassLevel})</strong>
                <p className="ev-muted" style={{ margin: '8px 0 0', fontSize: 14 }}>
                  {l.status === 'pending' ? 'সন্তানের নিশ্চিতকরণের অপেক্ষায়' : 'অ্যাডমিন যাচাইয়ের অপেক্ষায়'}
                </p>
              </Card>
            ))}
          </div>
        </>
      ) : null}

      {rejectedLinks.length > 0 ? (
        <>
          <h2 className="ev-section-h2">{d.linkRejected.bn} / {d.linkRejected.en}</h2>
          <AlertBox tone="error">
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {rejectedLinks.map((l) => (
                <li key={l.id}>
                  {l.childDisplayName} ({l.childClassLevel})
                  {l.decisionReason ? ` — কারণ: ${l.decisionReason}` : ''} — নতুন করে আবার অনুরোধ
                  পাঠাতে পারেন।
                </li>
              ))}
            </ul>
          </AlertBox>
        </>
      ) : null}

      <h2 className="ev-section-h2">{d.linkChild.bn} / {d.linkChild.en}</h2>
      <p className="ev-muted-ivory">{d.linkChildNote.bn}</p>
      <p className="ev-muted-ivory">
        সন্তানের Eduvelto ID তার প্রোফাইল পাতায় দেখা যায় — সন্তান সেটি আপনাকে জানাবে। / Your child’s
        Eduvelto ID is shown on their profile page — they share it with you.
      </p>
      <Card>
        <form onSubmit={onLinkChild}>
          <label className="ev-label" htmlFor="link-guardian-name">
            {d.guardianName.bn} / {d.guardianName.en}
          </label>
          <input id="link-guardian-name" className="ev-input" style={{ marginBottom: 14 }} type="text" value={guardianName} onChange={(e) => setGuardianName(e.target.value)} placeholder="যেমন: মোঃ রহিম উদ্দিন" />
          <label className="ev-label" htmlFor="link-relationship">
            {d.relationship.bn} / {d.relationship.en}
          </label>
          <input id="link-relationship" className="ev-input" style={{ marginBottom: 14 }} type="text" value={relationship} onChange={(e) => setRelationship(e.target.value)} placeholder="যেমন: বাবা / মা / অভিভাবক" />
          <label className="ev-label" htmlFor="link-contact">
            {d.guardianContact.bn} / {d.guardianContact.en}
          </label>
          <input id="link-contact" className="ev-input" style={{ marginBottom: 14 }} type="tel" value={guardianContact} onChange={(e) => setGuardianContact(e.target.value)} placeholder="যেমন: 01XXXXXXXXX" />
          <label className="ev-label" htmlFor="link-child-uid">
            সন্তানের Eduvelto ID / Child’s Eduvelto ID
          </label>
          <input id="link-child-uid" className="ev-input" style={{ marginBottom: 14 }} type="text" value={childUid} onChange={(e) => setChildUid(e.target.value)} placeholder="যেমন: AbC123xYz…" />
          <label className="ev-label" htmlFor="link-child-name">
            সন্তানের নাম / Child’s name
          </label>
          <input id="link-child-name" className="ev-input" style={{ marginBottom: 14 }} type="text" value={childName} onChange={(e) => setChildName(e.target.value)} />
          <label className="ev-label" htmlFor="link-child-class">
            সন্তানের শ্রেণি / Child’s class
          </label>
          <input id="link-child-class" className="ev-input" style={{ marginBottom: 14 }} type="text" value={childClass} onChange={(e) => setChildClass(e.target.value)} placeholder="যেমন: Class 5, SSC, 3rd Year" />
          <label className="ev-label" htmlFor="link-institution">
            প্রতিষ্ঠান / Institution
          </label>
          <input id="link-institution" className="ev-input" style={{ marginBottom: 14 }} type="text" value={childInstitution} onChange={(e) => setChildInstitution(e.target.value)} />
          {linkError ? <AlertBox tone="error">{linkError}</AlertBox> : null}
          {linkDone ? <AlertBox tone="ok">{d.linkRequested.bn}</AlertBox> : null}
          <Button type="submit" loading={linkBusy}>
            {linkBusy ? strings.common.loading.bn : `${d.linkChild.bn} / ${d.linkChild.en}`}
          </Button>
        </form>
      </Card>
    </PageShell>
  );
}
