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
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { PageShell, EmptyState } from '../components/PageShell';
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

const buttonStyle: React.CSSProperties = {
  padding: '10px 16px',
  minHeight: 44,
  borderRadius: 6,
  border: '1px solid #0A1F44',
  background: '#fff',
  color: '#0A1F44',
  cursor: 'pointer',
};

const inputStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  boxSizing: 'border-box',
  padding: '10px 12px',
  margin: '6px 0 14px',
  fontSize: 16,
  border: '1px solid #aaa',
  borderRadius: 6,
};

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
        <p>{strings.common.loading.bn}</p>
      </PageShell>
    );
  }

  if (!user || !profile) {
    return (
      <PageShell titleBn={d.guardianTitle.bn} titleEn={d.guardianTitle.en}>
        <p>{strings.profile.notSignedIn.bn}</p>
        <p>
          <Link to="/login">{strings.auth.loginTitle.bn}</Link>
        </p>
      </PageShell>
    );
  }

  if (profile.role === 'student' || profile.role === 'teacher') {
    return (
      <PageShell titleBn={d.guardianTitle.bn} titleEn={d.guardianTitle.en}>
        <p>এই ড্যাশবোর্ড শুধু অভিভাবকদের জন্য।</p>
        <p>
          <Link to="/dashboard">আপনার ড্যাশবোর্ডে যান →</Link>
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

  return (
    <PageShell titleBn={d.guardianTitle.bn} titleEn={d.guardianTitle.en}>
      <p style={{ fontSize: 17 }}>👨‍👩‍👧 {profile.displayName}</p>

      {verifiedLinks.length === 0 ? (
        <EmptyState bn={EMPTY_STATES.guardianNoChildren.bn} en={EMPTY_STATES.guardianNoChildren.en} />
      ) : (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {verifiedLinks.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => {
                  setSelectedId(l.id);
                  setPageIndex(0);
                  setCursors([null]);
                }}
                style={{
                  ...buttonStyle,
                  background: selected?.id === l.id ? '#0A1F44' : '#fff',
                  color: selected?.id === l.id ? '#fff' : '#0A1F44',
                  fontWeight: selected?.id === l.id ? 700 : 400,
                }}
              >
                {l.childDisplayName} ({l.childClassLevel})
              </button>
            ))}
          </div>
          {selected ? (
            <>
              <h2 style={{ fontSize: 19 }}>
                {selected.childDisplayName} · {selected.childClassLevel}
                {selected.childInstitution ? ` · ${selected.childInstitution}` : ''}
              </h2>
              <p style={{ color: '#555' }}>
                অগ্রগতি: {(progress ?? []).length}টি বিষয় · বুকমার্ক: {bookmarkCount ?? '…'}টি · পরীক্ষার
                সারসংক্ষেপ: {summaries === null ? '…' : summaries.length}টি বিষয়
              </p>
              {weak.length > 0 ? (
                <>
                  <h3 style={{ fontSize: 17 }}>{d.weakAreas.bn} / {d.weakAreas.en}</h3>
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
                  <h3 style={{ fontSize: 17 }}>{d.strongAreas.bn} / {d.strongAreas.en}</h3>
                  <ul style={{ paddingLeft: 20 }}>
                    {strong.map((s) => (
                      <li key={String(s.id)}>
                        {String(s.subject ?? '')} — {String(s.averagePercentage ?? '')}%
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
              <h3 style={{ fontSize: 17 }}>{d.myBooks.bn} / {d.myBooks.en}</h3>
              {error ? <p style={{ color: '#b00020' }}>{error}</p> : null}
              {fetching && !booksPage ? <p>{strings.common.loading.bn}</p> : null}
              {booksPage && books.length === 0 && !fetching ? (
                <EmptyState bn={EMPTY_STATES.noContent.bn} en={EMPTY_STATES.noContent.en} />
              ) : null}
              {books.length > 0 ? (
                <>
                  <ul style={{ paddingLeft: 20 }}>
                    {books.map((b) => (
                      <li key={b.id} style={{ marginBottom: 10, lineHeight: 1.5 }}>
                        <Link to={`/library/${b.id}`}>{b.title}</Link>
                        <span style={{ color: '#555', fontSize: 13 }}>
                          {' '}· {b.paperCode} · {b.department} · {b.classLevel}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 16 }}>
                    <button type="button" onClick={prevPage} disabled={pageIndex <= 0 || fetching} style={buttonStyle}>
                      ← আগের / Previous
                    </button>
                    <span>পাতা {pageIndex + 1} / Page {pageIndex + 1}</span>
                    <button type="button" onClick={nextPage} disabled={!booksPage?.hasMore || fetching} style={buttonStyle}>
                      {fetching ? strings.common.loading.bn : 'পরের / Next →'}
                    </button>
                  </div>
                </>
              ) : null}
              <p style={{ marginTop: 16 }}>
                <button type="button" onClick={() => void onRevoke(selected.id)} disabled={revoking} style={buttonStyle}>
                  {d.revokeLink.bn} / {d.revokeLink.en}
                </button>
              </p>
            </>
          ) : null}
        </>
      )}

      {pendingLinks.length > 0 ? (
        <>
          <h2 style={{ fontSize: 19 }}>অপেক্ষমাণ সংযোগ / Pending links</h2>
          <ul style={{ paddingLeft: 20 }}>
            {pendingLinks.map((l) => (
              <li key={l.id}>
                {l.childDisplayName} ({l.childClassLevel}) — {l.status === 'pending' ? 'সন্তানের নিশ্চিতকরণের অপেক্ষায়' : 'অ্যাডমিন যাচাইয়ের অপেক্ষায়'}
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {(links ?? []).filter((l) => l.status === 'rejected').length > 0 ? (
        <>
          <h2 style={{ fontSize: 19 }}>{d.linkRejected.bn} / {d.linkRejected.en}</h2>
          <ul style={{ paddingLeft: 20 }}>
            {(links ?? [])
              .filter((l) => l.status === 'rejected')
              .map((l) => (
                <li key={l.id}>
                  {l.childDisplayName} ({l.childClassLevel})
                  {l.decisionReason ? ` — কারণ: ${l.decisionReason}` : ''} — নতুন করে আবার অনুরোধ
                  পাঠাতে পারেন।
                </li>
              ))}
          </ul>
        </>
      ) : null}

      <h2 style={{ fontSize: 19 }}>{d.linkChild.bn} / {d.linkChild.en}</h2>
      <p style={{ color: '#555' }}>{d.linkChildNote.bn}</p>
      <p style={{ color: '#555' }}>
        সন্তানের Eduvelto ID তার প্রোফাইল পাতায় দেখা যায় — সন্তান সেটি আপনাকে জানাবে। / Your child’s
        Eduvelto ID is shown on their profile page — they share it with you.
      </p>
      <form onSubmit={onLinkChild}>
        <label>
          {d.guardianName.bn} / {d.guardianName.en}
          <input style={inputStyle} type="text" value={guardianName} onChange={(e) => setGuardianName(e.target.value)} placeholder="যেমন: মোঃ রহিম উদ্দিন" />
        </label>
        <label>
          {d.relationship.bn} / {d.relationship.en}
          <input style={inputStyle} type="text" value={relationship} onChange={(e) => setRelationship(e.target.value)} placeholder="যেমন: বাবা / মা / অভিভাবক" />
        </label>
        <label>
          {d.guardianContact.bn} / {d.guardianContact.en}
          <input style={inputStyle} type="tel" value={guardianContact} onChange={(e) => setGuardianContact(e.target.value)} placeholder="যেমন: 01XXXXXXXXX" />
        </label>
        <label>
          সন্তানের Eduvelto ID / Child’s Eduvelto ID
          <input style={inputStyle} type="text" value={childUid} onChange={(e) => setChildUid(e.target.value)} placeholder="যেমন: AbC123xYz…" />
        </label>
        <label>
          সন্তানের নাম / Child’s name
          <input style={inputStyle} type="text" value={childName} onChange={(e) => setChildName(e.target.value)} />
        </label>
        <label>
          সন্তানের শ্রেণি / Child’s class
          <input style={inputStyle} type="text" value={childClass} onChange={(e) => setChildClass(e.target.value)} placeholder="যেমন: Class 5, SSC, 3rd Year" />
        </label>
        <label>
          প্রতিষ্ঠান / Institution
          <input style={inputStyle} type="text" value={childInstitution} onChange={(e) => setChildInstitution(e.target.value)} />
        </label>
        {linkError ? <p style={{ color: '#b00020' }}>{linkError}</p> : null}
        {linkDone ? <p style={{ color: '#0A1F44' }}>{d.linkRequested.bn}</p> : null}
        <button style={{ ...buttonStyle, background: '#0A1F44', color: '#fff' }} type="submit" disabled={linkBusy}>
          {linkBusy ? strings.common.loading.bn : `${d.linkChild.bn} / ${d.linkChild.en}`}
        </button>
      </form>
    </PageShell>
  );
}
