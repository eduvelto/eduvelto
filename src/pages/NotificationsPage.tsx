// Eduvelto — notifications (Firestore-backed, in-app).
//
// A notification NEVER carries private message text — a new-message
// notification says only who wrote. Types: message, group_message,
// verification, exam_result, admin_notice, report_update,
// friend_request, group_invite.

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageShell, EmptyState } from '../components/PageShell';
import { strings } from '../i18n/strings';
import { useAuth } from '../lib/auth';
import { db, isFirebaseConfigured } from '../firebase';
import {
  markAllNotificationsRead,
  markNotificationRead,
  subscribeNotifications,
  type NotificationItem,
} from '../lib/messaging';
import { friendlyErrorMessage } from '../lib/profile';

const buttonStyle: React.CSSProperties = {
  padding: '10px 18px',
  fontSize: 16,
  borderRadius: 6,
  border: 'none',
  background: '#0A1F44',
  color: '#fff',
  cursor: 'pointer',
};

function formatTime(ts: { toDate?: () => Date } | null | undefined): string {
  if (!ts || typeof ts.toDate !== 'function') return '';
  try {
    return ts.toDate().toLocaleString('bn-BD', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export default function NotificationsPage() {
  const { user, loading } = useAuth();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!db || !user) return;
    const unsub = subscribeNotifications(
      db,
      user.uid,
      (list) => setItems(list),
      (e) => setError(friendlyErrorMessage(e)),
    );
    return unsub;
  }, [user]);

  if (loading) {
    return (
      <PageShell titleBn={strings.notifications.title.bn} titleEn={strings.notifications.title.en}>
        <p>{strings.common.loading.bn}</p>
      </PageShell>
    );
  }
  if (!isFirebaseConfigured || !db || !user) {
    return (
      <PageShell titleBn={strings.notifications.title.bn} titleEn={strings.notifications.title.en}>
        <EmptyState bn={strings.profile.notSignedIn.bn} en={strings.profile.notSignedIn.en} />
      </PageShell>
    );
  }

  const unreadCount = items.filter((i) => !i.read).length;

  async function markAllRead() {
    setBusy(true);
    try {
      await markAllNotificationsRead(db!, user!.uid);
    } catch (e) {
      setError(friendlyErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function openItem(item: NotificationItem) {
    if (!item.read) {
      try {
        await markNotificationRead(db!, user!.uid, item.id);
      } catch {
        // Non-fatal: the link still works.
      }
    }
  }

  return (
    <PageShell titleBn={strings.notifications.title.bn} titleEn={strings.notifications.title.en}>
      {error ? <p style={{ color: '#b00020' }}>{error}</p> : null}
      {unreadCount > 0 ? (
        <button type="button" onClick={() => void markAllRead()} disabled={busy} style={{ ...buttonStyle, marginBottom: 16 }}>
          {strings.notifications.markAllRead.bn} ({unreadCount})
        </button>
      ) : null}
      {items.length === 0 ? (
        <EmptyState bn={strings.notifications.noNotifications.bn} en={strings.notifications.noNotifications.en} />
      ) : (
        <ul style={{ padding: 0, listStyle: 'none' }}>
          {items.map((item) => {
            const target = item.conversationId
              ? `/messages/${item.conversationId}`
              : item.groupId
                ? `/groups/${item.groupId}`
                : item.link
                  ? item.link
                  : undefined;
            const inner = (
              <>
                <strong>{item.title}</strong>
                <div style={{ color: '#333', marginTop: 4 }}>{item.body}</div>
                <div style={{ color: '#888', fontSize: 13, marginTop: 4 }}>
                  {formatTime(item.createdAt)}
                  {!item.read ? <span style={{ color: '#0A1F44', fontWeight: 700 }}> · নতুন / New</span> : null}
                </div>
              </>
            );
            return (
              <li
                key={item.id}
                style={{
                  border: '1px solid #ddd',
                  borderRadius: 8,
                  padding: '12px 14px',
                  marginBottom: 10,
                  background: item.read ? '#fff' : '#f0f6ff',
                }}
              >
                {target ? (
                  <Link to={target} onClick={() => void openItem(item)} style={{ textDecoration: 'none', color: '#0A1F44', display: 'block' }}>
                    {inner}
                  </Link>
                ) : (
                  <div onClick={() => void openItem(item)} style={{ cursor: 'pointer' }}>
                    {inner}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </PageShell>
  );
}
