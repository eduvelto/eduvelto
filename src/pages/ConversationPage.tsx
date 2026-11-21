// Eduvelto — one DM thread (Phase 1: text only).
//
// Privacy: only participants can read the thread (rules). An admin with
// a valid, Owner-approved, unexpired grant may read it through
// readGrantedThread — that call writes the audit entry and notifies both
// participants (proposal §5). The grant banner below is shown in that
// case. Messages are immutable: no edit/delete UI exists (block/report
// is the remedy).

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageShell, EmptyState } from '../components/PageShell';
import { strings } from '../i18n/strings';
import { useAuth } from '../lib/auth';
import { db, isFirebaseConfigured } from '../firebase';
import {
  blockUser,
  friendlyDmError,
  getDmThread,
  getPublicProfile,
  listThreadMessages,
  readGrantedThread,
  reportMessage,
  sendDmMessage,
  DM_MESSAGE_MAX_CHARS,
  type DmMessage,
  type DmThread,
  type PublicProfile,
} from '../lib/messaging';
import { friendlyErrorMessage } from '../lib/profile';
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

export default function ConversationPage() {
  const { convId = '' } = useParams();
  const { user, profile, loading } = useAuth();
  const [thread, setThread] = useState<DmThread | null>(null);
  const [other, setOther] = useState<PublicProfile | null>(null);
  const [messages, setMessages] = useState<DmMessage[]>([]);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pageError, setPageError] = useState('');
  const [grantAccess, setGrantAccess] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [reportReason, setReportReason] = useState('abuse');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSent, setReportSent] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const meUid = user?.uid ?? '';
  const isParticipant = thread ? thread.participants.includes(meUid) : false;
  const otherUid = thread ? thread.participants.find((u) => u !== meUid) ?? '' : '';

  useEffect(() => {
    if (!db || !user || !convId) return;
    let cancelled = false;
    void (async () => {
      try {
        let t = await getDmThread(db!, convId);
        if (!t) {
          if (!cancelled) setPageError('কথোপকথনটি পাওয়া যায়নি। / Conversation not found.');
          return;
        }
        // Not a participant: only an admin/owner WITH a valid grant may
        // read — readGrantedThread verifies the grant, logs the read to
        // adminActions and notifies both participants.
        if (!t.participants.includes(user.uid)) {
          const role = profile?.role;
          if (role === 'admin' || role === 'owner' || role === 'moderator') {
            t = await readGrantedThread(db!, user.uid, convId);
            if (!cancelled) setGrantAccess(true);
          } else {
            if (!cancelled) setPageError('এই কথোপকথন দেখার অনুমতি আপনার নেই। / You do not have permission to view this conversation.');
            return;
          }
        }
        if (cancelled) return;
        setThread(t);
        const page = await listThreadMessages(db!, convId);
        if (cancelled) return;
        setMessages([...page.messages].reverse());
        setLastDoc(page.lastDoc);
        setHasMore(page.hasMore);
        const otherId = t.participants.find((u) => u !== user.uid);
        if (otherId) {
          const p = await getPublicProfile(db!, otherId);
          if (!cancelled) setOther(p);
        }
      } catch (e) {
        if (!cancelled) setPageError(friendlyErrorMessage(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [convId, user, profile?.role]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

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
  if (pageError) {
    return (
      <PageShell titleBn={strings.messaging.title.bn} titleEn={strings.messaging.title.en}>
        <p style={{ color: '#b00020' }}>{pageError}</p>
        <p>
          <Link to="/messages">← {strings.messaging.title.bn}</Link>
        </p>
      </PageShell>
    );
  }
  if (!thread) {
    return (
      <PageShell titleBn={strings.messaging.title.bn} titleEn={strings.messaging.title.en}>
        <p>{strings.common.loading.bn}</p>
      </PageShell>
    );
  }

  async function loadMore() {
    if (!lastDoc) return;
    setLoadingMore(true);
    try {
      const page = await listThreadMessages(db!, convId, lastDoc);
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
      await sendDmMessage(db!, thread!, meUid, profile?.displayName ?? meUid, body);
      // Reload the newest page so the sent message appears at once.
      const page = await listThreadMessages(db!, convId);
      setMessages([...page.messages].reverse());
      setLastDoc(page.lastDoc);
      setHasMore(page.hasMore);
      setText('');
    } catch (err) {
      setSendError(friendlyDmError(err));
    } finally {
      setSending(false);
    }
  }

  async function doBlock() {
    if (!otherUid) return;
    try {
      await blockUser(db!, meUid, otherUid);
      setBlocked(true);
    } catch (e) {
      setSendError(friendlyErrorMessage(e));
    }
  }

  async function doReport(e: FormEvent) {
    e.preventDefault();
    if (!otherUid) return;
    try {
      await reportMessage(db!, meUid, {
        targetType: 'conversation',
        targetId: convId,
        targetAuthorId: otherUid,
        reason: reportReason as 'spam' | 'abuse' | 'copyright' | 'personal-info' | 'other',
        details: reportDetails,
        conversationId: convId,
      });
      setReportSent(true);
    } catch (err) {
      setSendError(friendlyErrorMessage(err));
    }
  }

  return (
    <PageShell titleBn={other?.displayName ?? otherUid} titleEn={other?.role ?? ''}>
      <p>
        <Link to="/messages">← {strings.messaging.title.bn}</Link>
      </p>
      {grantAccess ? (
        <div style={{ border: '1px solid #F5A623', borderRadius: 8, padding: '14px 16px', background: '#fff8e6', marginBottom: 16 }}>
          <p style={{ margin: 0 }}>{strings.messaging.grantBanner.bn}</p>
          <p style={{ margin: '8px 0 0', color: '#555' }}>{strings.messaging.grantBanner.en}</p>
        </div>
      ) : null}

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
            const mine = m.senderId === meUid;
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
                <div>{m.body}</div>
                <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>{formatTime(m.createdAt)}</div>
              </li>
            );
          })}
        </ul>
      )}
      <div ref={bottomRef} />

      {isParticipant && !grantAccess ? (
        <>
          <form onSubmit={onSend} style={{ marginTop: 16 }}>
            <label htmlFor="dm-text">{strings.messaging.textOnly.bn}</label>
            <textarea
              id="dm-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={strings.messaging.sendPlaceholder.bn}
              maxLength={DM_MESSAGE_MAX_CHARS}
              rows={3}
              style={inputStyle}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#555' }}>{text.length}/{DM_MESSAGE_MAX_CHARS}</span>
              <button type="submit" disabled={sending || text.trim().length === 0 || profile?.dmSuspended === true} style={buttonStyle}>
                {strings.messaging.send.bn}
              </button>
            </div>
          </form>
          {sendError ? <p style={{ color: '#b00020' }}>{sendError}</p> : null}

          <div style={{ display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap' }}>
            <button type="button" onClick={() => void doBlock()} disabled={blocked} style={{ ...smallButtonStyle, background: '#fff', color: '#b00020', border: '1px solid #b00020' }}>
              {blocked ? strings.messaging.blocked.bn : strings.messaging.block.bn}
            </button>
            <Link to={`/users/${otherUid}`} style={{ ...smallButtonStyle, textDecoration: 'none', background: '#fff', color: '#0A1F44', border: '1px solid #0A1F44' }}>
              {other?.displayName ?? otherUid}
            </Link>
          </div>

          {reportSent ? (
            <p style={{ color: '#0A1F44', marginTop: 16 }}>{strings.messaging.reportSent.bn}</p>
          ) : (
            <form onSubmit={doReport} style={{ marginTop: 20, borderTop: '1px solid #ddd', paddingTop: 16 }}>
              <h2 style={{ fontSize: 18 }}>{strings.messaging.report.bn}</h2>
              <label htmlFor="report-reason">{strings.messaging.reportReason.bn}</label>
              <select id="report-reason" value={reportReason} onChange={(e) => setReportReason(e.target.value)} style={inputStyle}>
                <option value="abuse">অপব্যবহার / Abuse</option>
                <option value="spam">স্প্যাম / Spam</option>
                <option value="personal-info">ব্যক্তিগত তথ্য / Personal info</option>
                <option value="copyright">কপিরাইট / Copyright</option>
                <option value="other">অন্যান্য / Other</option>
              </select>
              <input
                type="text"
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder="বিবরণ (ঐচ্ছিক) / Details (optional)"
                maxLength={2000}
                style={inputStyle}
              />
              <button type="submit" style={smallButtonStyle}>
                {strings.messaging.report.bn}
              </button>
            </form>
          )}
        </>
      ) : null}
    </PageShell>
  );
}
