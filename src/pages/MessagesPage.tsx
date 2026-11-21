// Eduvelto — conversation list (Phase 1: private DMs).
//
// The pinned "Eduvelto AI" entry at the very top routes to /ai-chat.
// This page owns ONLY that pinned entry + routing — the /ai-chat page
// itself belongs to the AI Chat workstream (branch ai-chat/ui).
//
// Privacy: the thread list shows only the caller's own threads (the
// rules enforce participants-only reads). A new-message notification
// never carries message text — only who wrote.

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageShell, EmptyState } from '../components/PageShell';
import { strings } from '../i18n/strings';
import { useAuth } from '../lib/auth';
import { db, isFirebaseConfigured } from '../firebase';
import {
  createDmThread,
  getMyBlocks,
  getPublicProfile,
  listIncomingFriendRequests,
  respondFriendRequest,
  searchPublicProfiles,
  sendFriendRequest,
  subscribeMyThreads,
  syncPublicProfile,
  unblockUser,
  type DmThread,
  type FriendRequest,
  type PublicProfile,
} from '../lib/messaging';
import { friendlyErrorMessage } from '../lib/profile';

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

const buttonStyle: React.CSSProperties = {
  padding: '10px 18px',
  fontSize: 16,
  borderRadius: 6,
  border: 'none',
  background: '#0A1F44',
  color: '#fff',
  cursor: 'pointer',
};

const smallButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  padding: '8px 12px',
  fontSize: 14,
};

function formatTime(ts: { toDate?: () => Date } | null | undefined): string {
  if (!ts || typeof ts.toDate !== 'function') return '';
  try {
    return ts.toDate().toLocaleString('bn-BD', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function ThreadRow(props: { thread: DmThread; meUid: string }) {
  const { thread, meUid } = props;
  const otherUid = thread.participants[0] === meUid ? thread.participants[1] : thread.participants[0];
  const [other, setOther] = useState<PublicProfile | null>(null);
  useEffect(() => {
    if (!db) return;
    let cancelled = false;
    void getPublicProfile(db, otherUid).then((p) => {
      if (!cancelled) setOther(p);
    });
    return () => {
      cancelled = true;
    };
  }, [otherUid]);
  return (
    <li style={{ border: '1px solid #ddd', borderRadius: 8, padding: '12px 14px', marginBottom: 10, listStyle: 'none' }}>
      <Link to={`/messages/${thread.id}`} style={{ textDecoration: 'none', color: '#0A1F44' }}>
        <strong style={{ fontSize: 17 }}>{other?.displayName ?? otherUid}</strong>
        {other?.role ? <span style={{ color: '#555', fontSize: 14 }}> · {other.role}</span> : null}
        {thread.lastMessagePreview ? (
          <div style={{ color: '#333', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {thread.lastMessageSenderId === meUid ? 'আপনি: ' : ''}
            {thread.lastMessagePreview}
          </div>
        ) : null}
        <div style={{ color: '#888', fontSize: 13, marginTop: 4 }}>{formatTime(thread.updatedAt)}</div>
      </Link>
    </li>
  );
}

export default function MessagesPage() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [threads, setThreads] = useState<DmThread[]>([]);
  const [threadsError, setThreadsError] = useState('');
  const [queryText, setQueryText] = useState('');
  const [results, setResults] = useState<PublicProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [blocked, setBlocked] = useState<string[]>([]);
  const [blockedNames, setBlockedNames] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const hasDob = !!profile?.dateOfBirth;
  const dmSuspended = profile?.dmSuspended === true;

  useEffect(() => {
    if (!db || !user) return;
    const unsub = subscribeMyThreads(
      db,
      user.uid,
      (list) => setThreads(list),
      (e) => setThreadsError(friendlyErrorMessage(e)),
    );
    return unsub;
  }, [user]);

  useEffect(() => {
    if (!db || !user) return;
    let cancelled = false;
    void listIncomingFriendRequests(db, user.uid).then((list) => {
      if (!cancelled) setRequests(list);
    });
    void getMyBlocks(db, user.uid).then((list) => {
      if (!cancelled) setBlocked(list);
    });
    // Keep the DM directory mirror fresh (best effort; rules enforce
    // the mirror matches the users doc).
    void syncPublicProfile(db!, user.uid).catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!db || blocked.length === 0) return;
    const firestore = db;
    let cancelled = false;
    void Promise.all(blocked.map((uid) => getPublicProfile(firestore, uid))).then((profiles) => {
      if (cancelled) return;
      const names: Record<string, string> = {};
      profiles.forEach((p, i) => {
        names[blocked[i]] = p?.displayName ?? blocked[i];
      });
      setBlockedNames(names);
    });
    return () => {
      cancelled = true;
    };
  }, [blocked]);

  if (loading) {
    return (
      <PageShell titleBn={strings.messaging.title.bn} titleEn={strings.messaging.title.en}>
        <p>{strings.common.loading.bn}</p>
      </PageShell>
    );
  }
  if (!isFirebaseConfigured || !db || !user) {
    return (
      <PageShell titleBn={strings.messaging.title.bn} titleEn={strings.messaging.title.en}>
        <EmptyState bn={strings.profile.notSignedIn.bn} en={strings.profile.notSignedIn.en} />
      </PageShell>
    );
  }

  async function doSearch() {
    const q = queryText.trim();
    if (q.length < 2) {
      setSearchError('কমপক্ষে ২ অক্ষর লিখুন। / Type at least 2 characters.');
      return;
    }
    setSearching(true);
    setSearchError('');
    try {
      const list = await searchPublicProfiles(db!, q, 10);
      setResults(list.filter((p) => p.uid !== user!.uid));
    } catch (e) {
      setSearchError(friendlyErrorMessage(e));
    } finally {
      setSearching(false);
    }
  }

  async function startConversation(otherUid: string) {
    if (!hasDob) return;
    setBusy(true);
    setNotice('');
    try {
      const thread = await createDmThread(db!, user!.uid, otherUid);
      navigate(`/messages/${thread.id}`);
    } catch (e) {
      setNotice(friendlyErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function doFriendRequest(otherUid: string) {
    setBusy(true);
    setNotice('');
    try {
      await sendFriendRequest(db!, user!.uid, otherUid);
      setNotice(strings.messaging.friendRequestSent.bn);
    } catch (e) {
      setNotice(friendlyErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function doRespond(pairId: string, accept: boolean) {
    try {
      await respondFriendRequest(db!, pairId, accept);
      setRequests((prev) => prev.filter((r) => r.id !== pairId));
    } catch (e) {
      setNotice(friendlyErrorMessage(e));
    }
  }

  async function doUnblock(targetUid: string) {
    try {
      await unblockUser(db!, user!.uid, targetUid);
      setBlocked((prev) => prev.filter((u) => u !== targetUid));
    } catch (e) {
      setNotice(friendlyErrorMessage(e));
    }
  }

  return (
    <PageShell titleBn={strings.messaging.title.bn} titleEn={strings.messaging.title.en}>
      {/* Pinned Eduvelto AI entry — routes to /ai-chat (owned by the
          AI Chat workstream). This page owns only this entry + routing. */}
      <Link
        to="/ai-chat"
        style={{
          display: 'block',
          textDecoration: 'none',
          color: '#fff',
          background: '#0A1F44',
          border: '2px solid #F1B308',
          borderRadius: 10,
          padding: '14px 16px',
          marginBottom: 20,
        }}
      >
        <strong style={{ fontSize: 18 }}>🤖 {strings.messaging.aiChatTitle.bn}</strong>
        <div style={{ fontSize: 14, opacity: 0.85, marginTop: 4 }}>{strings.messaging.aiChatSubtitle.bn}</div>
        <div style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>{strings.messaging.aiChatSubtitle.en}</div>
      </Link>

      {!hasDob ? (
        <div style={{ border: '1px solid #F5A623', borderRadius: 8, padding: '14px 16px', background: '#fff8e6', marginBottom: 16 }}>
          <p style={{ margin: 0 }}>{strings.messaging.dobGate.bn}</p>
          <p style={{ margin: '8px 0 12px', color: '#555' }}>{strings.messaging.dobGate.en}</p>
          <Link to="/profile" style={{ ...smallButtonStyle, textDecoration: 'none', display: 'inline-block' }}>
            {strings.messaging.dobGateButton.bn}
          </Link>
        </div>
      ) : null}
      {dmSuspended ? (
        <div style={{ border: '1px solid #b00020', borderRadius: 8, padding: '14px 16px', background: '#fdf0f0', marginBottom: 16 }}>
          <p style={{ margin: 0 }}>{strings.messaging.dmSuspended.bn}</p>
          <p style={{ margin: '8px 0 0', color: '#555' }}>{strings.messaging.dmSuspended.en}</p>
        </div>
      ) : null}

      {threadsError ? <p style={{ color: '#b00020' }}>{threadsError}</p> : null}
      {notice ? <p style={{ color: '#0A1F44' }}>{notice}</p> : null}

      {threads.length === 0 ? (
        <EmptyState bn={strings.messaging.noConversations.bn} en={strings.messaging.noConversations.en} />
      ) : (
        <ul style={{ padding: 0, margin: '0 0 24px' }}>
          {threads.map((t) => (
            <ThreadRow key={t.id} thread={t} meUid={user.uid} />
          ))}
        </ul>
      )}

      <h2 style={{ fontSize: 20 }}>{strings.messaging.newConversation.bn}</h2>
      <p style={{ color: '#555', fontSize: 14 }}>{strings.messaging.searchHint.bn}</p>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="search"
          value={queryText}
          onChange={(e) => setQueryText(e.target.value)}
          placeholder={strings.messaging.searchPlaceholder.bn}
          aria-label={strings.messaging.searchPlaceholder.bn}
          style={{ ...inputStyle, margin: '6px 0' }}
        />
        <button type="button" onClick={() => void doSearch()} disabled={searching || !hasDob} style={{ ...buttonStyle, whiteSpace: 'nowrap', margin: '6px 0', minHeight: 44 }}>
          {strings.common.search.bn}
        </button>
      </div>
      {searchError ? <p style={{ color: '#b00020' }}>{searchError}</p> : null}
      {results.length > 0 ? (
        <ul style={{ padding: 0 }}>
          {results.map((p) => (
            <li key={p.uid} style={{ border: '1px solid #ddd', borderRadius: 8, padding: '12px 14px', marginBottom: 10, listStyle: 'none' }}>
              <Link to={`/users/${p.uid}`} style={{ color: '#0A1F44', fontWeight: 700, textDecoration: 'none' }}>
                {p.displayName}
              </Link>
              <span style={{ color: '#555', fontSize: 14 }}>
                {' '}· {p.role}
                {p.institution ? ` · ${p.institution}` : ''}
                {p.classLevel ? ` · ${p.classLevel}` : ''}
              </span>
              <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                <button type="button" onClick={() => void startConversation(p.uid)} disabled={busy || !hasDob || dmSuspended} style={smallButtonStyle}>
                  {strings.messaging.messageUser.bn}
                </button>
                <button type="button" onClick={() => void doFriendRequest(p.uid)} disabled={busy} style={{ ...smallButtonStyle, background: '#fff', color: '#0A1F44', border: '1px solid #0A1F44' }}>
                  {strings.messaging.friendRequest.bn}
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {requests.length > 0 ? (
        <>
          <h2 style={{ fontSize: 20 }}>{strings.messaging.friendRequests.bn}</h2>
          <ul style={{ padding: 0 }}>
            {requests.map((r) => (
              <li key={r.id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: '12px 14px', marginBottom: 10, listStyle: 'none' }}>
                <Link to={`/users/${r.userA}`} style={{ color: '#0A1F44' }}>
                  {r.userA}
                </Link>
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button type="button" onClick={() => void doRespond(r.id, true)} style={smallButtonStyle}>
                    {strings.messaging.accept.bn}
                  </button>
                  <button type="button" onClick={() => void doRespond(r.id, false)} style={{ ...smallButtonStyle, background: '#fff', color: '#0A1F44', border: '1px solid #0A1F44' }}>
                    {strings.messaging.decline.bn}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {blocked.length > 0 ? (
        <>
          <h2 style={{ fontSize: 20 }}>{strings.messaging.blocked.bn}</h2>
          <ul style={{ padding: 0 }}>
            {blocked.map((uid) => (
              <li key={uid} style={{ border: '1px solid #ddd', borderRadius: 8, padding: '12px 14px', marginBottom: 10, listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <span>{blockedNames[uid] ?? uid}</span>
                <button type="button" onClick={() => void doUnblock(uid)} style={smallButtonStyle}>
                  {strings.messaging.unblock.bn}
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <p style={{ color: '#555', fontSize: 14, marginTop: 24 }}>{strings.messaging.privacyNote.bn}</p>
      <p style={{ color: '#555', fontSize: 14 }}>{strings.messaging.privacyNote.en}</p>
      <p>
        <Link to={`/groups`}>{strings.groups.title.bn} / {strings.groups.title.en}</Link>
        {' · '}
        <Link to={`/notifications`}>{strings.notifications.title.bn} / {strings.notifications.title.en}</Link>
      </p>
    </PageShell>
  );
}
