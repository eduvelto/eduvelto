import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import {
  AdminBackLink,
  ConfirmDialog,
  EmptyAdminBox,
  ErrorBox,
  LoadingBox,
  StatusPill,
  requireDb,
} from '../components/AdminShared';
import {
  ASSIGNABLE_ROLES,
  formatTime,
  friendlyAdminError,
  getSupportThreadMessages,
  getUserDetail,
  setUserActive,
  setUserRole,
  type SupportMessageRow,
  type UserDetail,
} from '../lib/admin';
import type { UserRole } from '../lib/profile';

const ROLE_LABEL: Record<string, string> = {
  owner: 'মালিক',
  admin: 'অ্যাডমিন',
  moderator: 'মডারেটর',
  teacher: 'শিক্ষক',
  student: 'শিক্ষার্থী',
  parent: 'অভিভাবক',
};

type ConfirmKind = 'suspend' | 'reactivate' | 'role';

export default function AdminUserDetailPage() {
  const { uid } = useParams<{ uid: string }>();
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [reason, setReason] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('student');
  const [adultChecked, setAdultChecked] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmKind | null>(null);
  const [busy, setBusy] = useState(false);
  const [expandedThread, setExpandedThread] = useState<string | null>(null);
  const [threadMessages, setThreadMessages] = useState<SupportMessageRow[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);

  async function reload(): Promise<void> {
    if (!uid) return;
    setLoading(true);
    setError('');
    try {
      const d = await getUserDetail(requireDb(), uid);
      setDetail(d);
    } catch (e) {
      setError(friendlyAdminError(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  const user = detail?.user;
  const isOwner = user?.role === 'owner';
  const elevating =
    user?.role === 'student' &&
    (newRole === 'teacher' || newRole === 'moderator' || newRole === 'admin');

  async function doConfirm(): Promise<void> {
    if (!user || !confirm) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      if (confirm === 'suspend') await setUserActive(requireDb(), user.uid, false, reason);
      if (confirm === 'reactivate') await setUserActive(requireDb(), user.uid, true, reason);
      if (confirm === 'role') await setUserRole(requireDb(), user.uid, newRole, reason, adultChecked);
      setNotice(
        confirm === 'suspend'
          ? 'ব্যবহারকারী স্থগিত হয়েছে। / User suspended.'
          : confirm === 'reactivate'
            ? 'ব্যবহারকারী আবার চালু হয়েছে। / User reactivated.'
            : 'ভূমিকা বদলানো হয়েছে। / Role changed.',
      );
      setReason('');
      setAdultChecked(false);
      setConfirm(null);
      await reload();
    } catch (e) {
      setError(friendlyAdminError(e));
      setConfirm(null);
    } finally {
      setBusy(false);
    }
  }

  async function openThread(threadId: string): Promise<void> {
    if (expandedThread === threadId) {
      setExpandedThread(null);
      return;
    }
    setExpandedThread(threadId);
    setThreadLoading(true);
    setError('');
    try {
      const msgs = await getSupportThreadMessages(requireDb(), threadId, user?.displayName ?? threadId);
      setThreadMessages(msgs);
    } catch (e) {
      setError(friendlyAdminError(e));
    } finally {
      setThreadLoading(false);
    }
  }

  if (!uid) {
    return (
      <PageShell titleBn="ব্যবহারকারী" titleEn="User">
        <AdminBackLink />
        <ErrorBox message="ব্যবহারকারীর ID পাওয়া যায়নি। / No user ID." />
      </PageShell>
    );
  }

  return (
    <PageShell titleBn="ব্যবহারকারীর প্রোফাইল" titleEn="User profile">
      <AdminBackLink />
      <p style={{ color: '#555', fontSize: 14 }}>
        মালিকের তদারকি: এই পাতা খোলা অডিট লগে লেখা হয়েছে (কে, কাকে, কখন)। / Owner oversight: opening
        this page was written to the audit log (who, whom, when).
      </p>
      {loading ? <LoadingBox /> : null}
      {error ? <ErrorBox message={error} /> : null}
      {notice ? (
        <p role="status" style={{ color: '#0A1F44', fontWeight: 700 }}>
          {notice}
        </p>
      ) : null}

      {user ? (
        <>
          <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: '14px', marginBottom: 12 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              <strong style={{ fontSize: 18 }}>{user.displayName}</strong>
              {isOwner ? (
                <span
                  style={{
                    background: '#F1B308',
                    color: '#041742',
                    fontWeight: 700,
                    borderRadius: 999,
                    padding: '2px 10px',
                    fontSize: 14,
                  }}
                >
                  ★ CEO
                </span>
              ) : null}
              <StatusPill label={ROLE_LABEL[user.role] ?? user.role} tone="muted" />
              <StatusPill
                label={user.isActive ? 'সক্রিয় / Active' : 'স্থগিত / Suspended'}
                tone={user.isActive ? 'active' : 'ready'}
              />
            </div>
            <p style={{ margin: '8px 0' }}>
              ইমেইল: <span lang="en">{user.email}</span>
            </p>
            <p style={{ margin: '4px 0', color: '#555', fontSize: 14 }}>
              {user.educationType ? `ধারা: ${user.educationType} · ` : ''}
              {user.institution ? `প্রতিষ্ঠান: ${user.institution} · ` : ''}
              {user.program ? `প্রোগ্রাম: ${user.program} · ` : ''}
              {user.department ? `বিভাগ: ${user.department} · ` : ''}
              {user.classLevel ? `শ্রেণি: ${user.classLevel}` : ''}
            </p>
            <p style={{ margin: '4px 0', color: '#555', fontSize: 14 }}>
              সদস্য: {formatTime(user.createdAt)}
              {user.verificationStatus ? ` · শিক্ষক যাচাই: ${user.verificationStatus}` : ''}
            </p>
            {!user.isActive && user.suspendedReason ? (
              <p style={{ margin: '4px 0', color: '#b00020' }}>
                স্থগিতের কারণ: {user.suspendedReason}
              </p>
            ) : null}
          </div>

          {isOwner ? (
            <EmptyAdminBox
              bn="এটি মালিকের অ্যাকাউন্ট — স্থগিত বা ভূমিকা পরিবর্তন করা যায় না।"
              en="This is the Owner account — it can never be suspended or have its role changed."
            />
          ) : (
            <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: '14px', marginBottom: 12 }}>
              <h2 style={{ fontSize: 17, marginTop: 0 }}>পদক্ষেপ / Actions</h2>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: 4 }}>
                কারণ (অবশ্যই লিখুন — কমপক্ষে ১০ অক্ষর) / Reason (required — at least 10 characters)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                placeholder="কেন এই সিদ্ধান্ত নিচ্ছেন — পরে অডিট লগে দেখা যাবে"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '10px',
                  minHeight: 48,
                  fontSize: 16,
                  borderRadius: 8,
                  border: '1px solid #888',
                }}
              />
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                {user.isActive ? (
                  <button
                    type="button"
                    disabled={busy || reason.trim().length < 10}
                    onClick={() => setConfirm('suspend')}
                    style={{
                      padding: '12px 20px',
                      minHeight: 48,
                      fontSize: 16,
                      borderRadius: 8,
                      border: 'none',
                      background: '#b00020',
                      color: '#fff',
                      cursor: 'pointer',
                    }}
                  >
                    স্থগিত করুন / Suspend
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={busy || reason.trim().length < 10}
                    onClick={() => setConfirm('reactivate')}
                    style={{
                      padding: '12px 20px',
                      minHeight: 48,
                      fontSize: 16,
                      borderRadius: 8,
                      border: 'none',
                      background: '#0A1F44',
                      color: '#fff',
                      cursor: 'pointer',
                    }}
                  >
                    আবার চালু করুন / Reactivate
                  </button>
                )}
              </div>
              <h3 style={{ fontSize: 16, marginTop: 20 }}>ভূমিকা বদলান / Change role</h3>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  aria-label="নতুন ভূমিকা"
                  style={{ padding: '12px 10px', minHeight: 48, fontSize: 16, borderRadius: 8 }}
                >
                  {ASSIGNABLE_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABEL[r] ?? r}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={busy || reason.trim().length < 10 || newRole === user.role}
                  onClick={() => setConfirm('role')}
                  style={{
                    padding: '12px 20px',
                    minHeight: 48,
                    fontSize: 16,
                    borderRadius: 8,
                    border: 'none',
                    background: '#0A1F44',
                    color: '#fff',
                    cursor: 'pointer',
                  }}
                >
                  ভূমিকা বদলান / Change role
                </button>
              </div>
              {elevating ? (
                <label
                  style={{
                    display: 'flex',
                    gap: 8,
                    alignItems: 'flex-start',
                    minHeight: 44,
                    padding: '10px 0',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={adultChecked}
                    onChange={(e) => setAdultChecked(e.target.checked)}
                    style={{ width: 24, height: 24, accentColor: '#1E7CE8', flexShrink: 0 }}
                  />
                  <span>
                    নিশ্চিত করছি — এই ব্যক্তি প্রাপ্তবয়স্ক এবং পরিচয় যাচাই করা হয়েছে। শিশুকে
                    কখনো শিক্ষক/মডারেটর/অ্যাডমিন বানানো যায় না। / I confirm — this person is an
                    adult and their identity was checked. A child can never be made
                    teacher/moderator/admin.
                  </span>
                </label>
              ) : null}
              <p style={{ color: '#555', fontSize: 14 }}>
                স্থগিত করলে ব্যবহারকারী আর লগইন করে অ্যাপ ব্যবহার করতে পারবেন না (নিয়মেও
                আটকানো আছে)। ভূমিকা বদলালে আগের ভূমিকা অডিট লগে থাকবে। / Suspending blocks the
                account in the app and in the rules. A role change keeps the old role in the
                audit log.
              </p>
            </div>
          )}

          <h2 style={{ fontSize: 18 }}>এই ব্যবহারকারীর লেখা / Their posts &amp; questions</h2>
          {detail && detail.posts.length === 0 && detail.questions.length === 0 ? (
            <p style={{ color: '#555' }}>কিছু লেখেননি এখনো। / Nothing written yet.</p>
          ) : null}
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {detail?.posts.map((p) => (
              <li key={p.id} style={{ border: '1px solid #eee', borderRadius: 8, padding: '10px 12px', marginBottom: 8 }}>
                <strong>পোস্ট: {p.title}</strong>
                <p style={{ margin: '4px 0', color: '#555', fontSize: 14 }}>
                  {p.body.slice(0, 200)} · {p.reviewStatus ?? ''} · {formatTime(p.createdAt)}
                </p>
              </li>
            ))}
            {detail?.questions.map((q) => (
              <li key={q.id} style={{ border: '1px solid #eee', borderRadius: 8, padding: '10px 12px', marginBottom: 8 }}>
                <strong>প্রশ্ন: {q.title}</strong>
                <p style={{ margin: '4px 0', color: '#555', fontSize: 14 }}>
                  {q.body.slice(0, 200)} · {q.reviewStatus ?? ''} · {formatTime(q.createdAt)}
                </p>
              </li>
            ))}
          </ul>

          <h2 style={{ fontSize: 18 }}>সাপোর্ট মেসেজ / Support messages</h2>
          {detail && detail.supportThreads.length === 0 ? (
            <p style={{ color: '#555' }}>
              কোনো সাপোর্ট কথোপকথন নেই। / No support conversations.
            </p>
          ) : null}
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {detail?.supportThreads.map((t) => (
              <li key={t.id} style={{ border: '1px solid #eee', borderRadius: 8, padding: '10px 12px', marginBottom: 8 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <strong>সাপোর্ট থ্রেড</strong>
                  <StatusPill label={t.status === 'open' ? 'খোলা / Open' : 'বন্ধ / Closed'} tone={t.status === 'open' ? 'active' : 'muted'} />
                  <span style={{ color: '#555', fontSize: 14 }}>{formatTime(t.createdAt)}</span>
                  <button
                    type="button"
                    onClick={() => void openThread(t.id)}
                    style={{
                      marginLeft: 'auto',
                      padding: '10px 14px',
                      minHeight: 44,
                      borderRadius: 8,
                      border: '1px solid #0A1F44',
                      background: '#fff',
                      color: '#0A1F44',
                      cursor: 'pointer',
                    }}
                  >
                    {expandedThread === t.id ? 'লুকান / Hide' : 'মেসেজ দেখুন / View messages'}
                  </button>
                </div>
                {expandedThread === t.id ? (
                  threadLoading ? (
                    <LoadingBox />
                  ) : threadMessages.length === 0 ? (
                    <p style={{ color: '#555' }}>এই থ্রেডে কোনো মেসেজ নেই। / No messages in this thread.</p>
                  ) : (
                    <ul style={{ listStyle: 'none', padding: 0, marginTop: 8 }}>
                      {threadMessages.map((m) => (
                        <li key={m.id} style={{ borderTop: '1px solid #eee', padding: '8px 0' }}>
                          <p style={{ margin: 0 }}>{m.body}</p>
                          <p style={{ margin: '4px 0 0', color: '#555', fontSize: 14 }}>
                            {m.senderId === user.uid ? 'ব্যবহারকারী' : 'অ্যাডমিন'} ·{' '}
                            {formatTime(m.createdAt)}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )
                ) : null}
              </li>
            ))}
          </ul>

          <h2 style={{ fontSize: 18 }}>এই ব্যবহারকারী সম্পর্কে রিপোর্ট / Reports about this user</h2>
          {detail && detail.reportsAbout.length === 0 ? (
            <p style={{ color: '#555' }}>কোনো রিপোর্ট নেই। / No reports.</p>
          ) : null}
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {detail?.reportsAbout.map((r) => (
              <li key={r.id} style={{ border: '1px solid #eee', borderRadius: 8, padding: '10px 12px', marginBottom: 8 }}>
                <strong>
                  {r.reason} · {r.status}
                </strong>
                <p style={{ margin: '4px 0', color: '#555', fontSize: 14 }}>
                  {r.targetType ?? ''} {r.details ? `— ${r.details}` : ''} · {formatTime(r.createdAt)}
                </p>
              </li>
            ))}
          </ul>
          <p style={{ marginTop: 24 }}>
            <Link to="/admin/users">← সব ব্যবহারকারী / All users</Link>
          </p>
        </>
      ) : null}

      {confirm && user ? (
        <ConfirmDialog
          titleBn="আপনি কি নিশ্চিত?"
          titleEn="Are you sure?"
          bodyBn={
            confirm === 'suspend'
              ? `${user.displayName}-কে স্থগিত করবেন? তিনি আর লগইন করে অ্যাপ ব্যবহার করতে পারবেন না। কারণ: ${reason}`
              : confirm === 'reactivate'
                ? `${user.displayName}-কে আবার চালু করবেন? তিনি আবার অ্যাপ ব্যবহার করতে পারবেন। কারণ: ${reason}`
                : `${user.displayName}-এর ভূমিকা ${ROLE_LABEL[user.role] ?? user.role} থেকে ${ROLE_LABEL[newRole] ?? newRole}-এ বদলাবেন? কারণ: ${reason}`
          }
          bodyEn={
            confirm === 'suspend'
              ? `${user.displayName} will be suspended and cannot use the app.`
              : confirm === 'reactivate'
                ? `${user.displayName} will be reactivated and can use the app again.`
                : `${user.displayName}'s role will change from ${user.role} to ${newRole}.`
          }
          confirmBn="হ্যাঁ, করুন"
          confirmEn="Yes, do it"
          onConfirm={() => void doConfirm()}
          onCancel={() => setConfirm(null)}
        />
      ) : null}
    </PageShell>
  );
}
