// Eduvelto — one group chat (member-only, moderated space).
//
// Group messages are member-only; moderators may read them for safety
// (unlike private DMs, which no one reads without a grant). Text only,
// max 2000 chars, paginated history.

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageShell, EmptyState } from '../components/PageShell';
import { strings } from '../i18n/strings';
import { useAuth } from '../lib/auth';
import { db, isFirebaseConfigured } from '../firebase';
import {
  getGroupMembership,
  leaveGroup,
  listGroupMessages,
  sendGroupMessage,
  DM_MESSAGE_MAX_CHARS,
  type DmMessage,
} from '../lib/messaging';
import { friendlyErrorMessage } from '../lib/profile';
import { getDoc, doc } from 'firebase/firestore';
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';

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

export default function GroupChatPage() {
  const { groupId = '' } = useParams();
  const { user, profile, loading } = useAuth();
  const [groupName, setGroupName] = useState('');
  const [memberStatus, setMemberStatus] = useState<string>('');
  const [messages, setMessages] = useState<DmMessage[]>([]);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pageError, setPageError] = useState('');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const isModerator = profile?.role === 'moderator' || profile?.role === 'admin' || profile?.role === 'owner';
  const canRead = memberStatus === 'active' || isModerator;
  const canSend = memberStatus === 'active';

  useEffect(() => {
    if (!db || !user || !groupId) return;
    let cancelled = false;
    void (async () => {
      try {
        const gSnap = await getDoc(doc(db!, 'studyGroups', groupId));
        if (cancelled) return;
        if (!gSnap.exists()) {
          setPageError('গ্রুপটি পাওয়া যায়নি। / Group not found.');
          return;
        }
        const gData = gSnap.data();
        setGroupName(typeof gData.name === 'string' ? gData.name : groupId);
        const membership = await getGroupMembership(db!, groupId, user.uid);
        if (cancelled) return;
        setMemberStatus(membership?.status ?? '');
        if (membership?.status === 'active' || isModerator) {
          const page = await listGroupMessages(db!, groupId);
          if (cancelled) return;
          setMessages([...page.messages].reverse());
          setLastDoc(page.lastDoc);
          setHasMore(page.hasMore);
        }
      } catch (e) {
        if (!cancelled) setPageError(friendlyErrorMessage(e));
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  if (loading) {
    return (
      <PageShell titleBn={strings.groups.title.bn} titleEn={strings.groups.title.en}>
        <p>{strings.common.loading.bn}</p>
      </PageShell>
    );
  }
  if (!isFirebaseConfigured || !db || !user) {
    return (
      <PageShell titleBn={strings.groups.title.bn} titleEn={strings.groups.title.en}>
        <EmptyState bn={strings.profile.notSignedIn.bn} en={strings.profile.notSignedIn.en} />
      </PageShell>
    );
  }
  if (pageError) {
    return (
      <PageShell titleBn={strings.groups.title.bn} titleEn={strings.groups.title.en}>
        <p style={{ color: '#b00020' }}>{pageError}</p>
        <p>
          <Link to="/groups">← {strings.groups.title.bn}</Link>
        </p>
      </PageShell>
    );
  }

  async function loadMore() {
    if (!lastDoc) return;
    setLoadingMore(true);
    try {
      const page = await listGroupMessages(db!, groupId, lastDoc);
      setMessages((prev) => [...[...page.messages].reverse(), ...prev]);
      setLastDoc(page.lastDoc);
      setHasMore(page.hasMore);
    } catch (e) {
      setPageError(friendlyErrorMessage(e));
    } finally {
      setLoadingMore(false);
    }
  }

  async function onSend(e: FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (body.length === 0 || body.length > DM_MESSAGE_MAX_CHARS) return;
    setSending(true);
    setSendError('');
    try {
      await sendGroupMessage(db!, groupId, user!.uid, body);
      const page = await listGroupMessages(db!, groupId);
      setMessages([...page.messages].reverse());
      setLastDoc(page.lastDoc);
      setHasMore(page.hasMore);
      setText('');
    } catch (err) {
      setSendError(friendlyErrorMessage(err));
    } finally {
      setSending(false);
    }
  }

  async function onLeave() {
    try {
      await leaveGroup(db!, groupId, user!.uid);
      setMemberStatus('');
      setMessages([]);
    } catch (e) {
      setSendError(friendlyErrorMessage(e));
    }
  }

  return (
    <PageShell titleBn={groupName || strings.groups.title.bn} titleEn={strings.groups.title.en}>
      <p>
        <Link to="/groups">← {strings.groups.title.bn}</Link>
      </p>
      <p style={{ color: '#555', fontSize: 14 }}>{strings.groups.membersOnly.bn}</p>

      {memberStatus === 'pending' ? (
        <EmptyState bn={strings.groups.joinRequested.bn} en={strings.groups.joinRequested.en} />
      ) : !canRead ? (
        <EmptyState bn="এই গ্রুপের বার্তা দেখতে সদস্য হতে হবে। গ্রুপের পাতা থেকে যোগ দেওয়ার অনুরোধ করুন।" en="You must be a member to read this group’s messages. Request to join from the groups page." />
      ) : (
        <>
          {hasMore ? (
            <button type="button" onClick={() => void loadMore()} disabled={loadingMore} style={{ ...smallButtonStyle, marginBottom: 12 }}>
              {strings.messaging.loadMore.bn}
            </button>
          ) : null}
          {messages.length === 0 ? (
            <EmptyState bn={strings.messaging.noMessages.bn} en={strings.messaging.noMessages.en} />
          ) : (
            <ul style={{ padding: 0, listStyle: 'none' }}>
              {messages.map((m) => {
                const mine = m.senderId === user.uid;
                return (
                  <li
                    key={m.id}
                    style={{
                      maxWidth: '80%',
                      marginLeft: mine ? 'auto' : 0,
                      marginRight: mine ? 0 : 'auto',
                      background: mine ? '#0A1F44' : '#f0f0f0',
                      color: mine ? '#fff' : '#111',
                      borderRadius: 10,
                      padding: '10px 12px',
                      marginBottom: 8,
                      wordBreak: 'break-word',
                    }}
                  >
                    {!mine ? <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 2 }}>{m.senderId}</div> : null}
                    <div>{m.body}</div>
                    <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>{formatTime(m.createdAt)}</div>
                  </li>
                );
              })}
            </ul>
          )}
          <div ref={bottomRef} />
        </>
      )}

      {canSend ? (
        <form onSubmit={onSend} style={{ marginTop: 16 }}>
          <label htmlFor="group-text">{strings.messaging.textOnly.bn}</label>
          <textarea
            id="group-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={strings.messaging.sendPlaceholder.bn}
            maxLength={DM_MESSAGE_MAX_CHARS}
            rows={3}
            style={inputStyle}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: '#555' }}>{text.length}/{DM_MESSAGE_MAX_CHARS}</span>
            <button type="submit" disabled={sending || text.trim().length === 0} style={buttonStyle}>
              {strings.messaging.send.bn}
            </button>
          </div>
        </form>
      ) : null}
      {sendError ? <p style={{ color: '#b00020' }}>{sendError}</p> : null}
      {memberStatus === 'active' ? (
        <button type="button" onClick={() => void onLeave()} style={{ ...smallButtonStyle, background: '#fff', color: '#b00020', border: '1px solid #b00020', marginTop: 20 }}>
          {strings.groups.leave.bn}
        </button>
      ) : null}
    </PageShell>
  );
}
