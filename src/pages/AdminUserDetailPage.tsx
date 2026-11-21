import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { useLanguage } from '../i18n/LanguageContext';
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

const ROLE_LABEL: Record<string, { bn: string; en: string }> = {
  owner: { bn: 'মালিক', en: 'Owner' },
  admin: { bn: 'অ্যাডমিন', en: 'Admin' },
  moderator: { bn: 'মডারেটর', en: 'Moderator' },
  teacher: { bn: 'শিক্ষক', en: 'Teacher' },
  student: { bn: 'শিক্ষার্থী', en: 'Student' },
  parent: { bn: 'অভিভাবক', en: 'Guardian' },
};

type ConfirmKind = 'suspend' | 'reactivate' | 'role';

export default function AdminUserDetailPage() {
  const { lang, t } = useLanguage();
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
      setError(friendlyAdminError(e, lang));
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
          ? t({ bn: 'ব্যবহারকারী স্থগিত হয়েছে।', en: 'User suspended.' })
          : confirm === 'reactivate'
            ? t({ bn: 'ব্যবহারকারী আবার চালু হয়েছে।', en: 'User reactivated.' })
            : t({ bn: 'ভূমিকা বদলানো হয়েছে।', en: 'Role changed.' }),
      );
      setReason('');
      setAdultChecked(false);
      setConfirm(null);
      await reload();
    } catch (e) {
      setError(friendlyAdminError(e, lang));
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
      setError(friendlyAdminError(e, lang));
    } finally {
      setThreadLoading(false);
    }
  }

  if (!uid) {
    return (
      <PageShell titleBn="ব্যবহারকারী" titleEn="User">
        <AdminBackLink />
        <ErrorBox message={t({ bn: 'ব্যবহারকারীর ID পাওয়া যায়নি।', en: 'No user ID.' })} />
      </PageShell>
    );
  }

  return (
    <PageShell titleBn="ব্যবহারকারীর প্রোফাইল" titleEn="User profile">
      <AdminBackLink />
      <p style={{ color: '#555', fontSize: 14 }}>
        {t({
          bn: 'মালিকের তদারকি: এই পাতা খোলা অডিট লগে লেখা হয়েছে (কে, কাকে, কখন)।',
          en: 'Owner oversight: opening this page was written to the audit log (who, whom, when).',
        })}
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
              <StatusPill label={ROLE_LABEL[user.role] ? t(ROLE_LABEL[user.role]) : user.role} tone="muted" />
              <StatusPill
                label={user.isActive ? t({ bn: 'সক্রিয়', en: 'Active' }) : t({ bn: 'স্থগিত', en: 'Suspended' })}
                tone={user.isActive ? 'active' : 'ready'}
              />
            </div>
            <p style={{ margin: '8px 0' }}>
              {t({ bn: 'ইমেইল', en: 'Email' })}: <span lang="en">{user.email}</span>
            </p>
            <p style={{ margin: '4px 0', color: '#555', fontSize: 14 }}>
              {user.educationType ? `${t({ bn: 'ধারা', en: 'Stream' })}: ${user.educationType} · ` : ''}
              {user.institution ? `${t({ bn: 'প্রতিষ্ঠান', en: 'Institution' })}: ${user.institution} · ` : ''}
              {user.program ? `${t({ bn: 'প্রোগ্রাম', en: 'Programme' })}: ${user.program} · ` : ''}
              {user.department ? `${t({ bn: 'বিভাগ', en: 'Department' })}: ${user.department} · ` : ''}
              {user.classLevel ? `${t({ bn: 'শ্রেণি', en: 'Class' })}: ${user.classLevel}` : ''}
            </p>
            <p style={{ margin: '4px 0', color: '#555', fontSize: 14 }}>
              {t({ bn: 'সদস্য', en: 'Member since' })}: {formatTime(user.createdAt, lang)}
              {user.verificationStatus ? ` · ${t({ bn: 'শিক্ষক যাচাই', en: 'Teacher verification' })}: ${user.verificationStatus}` : ''}
            </p>
            {!user.isActive && user.suspendedReason ? (
              <p style={{ margin: '4px 0', color: '#b00020' }}>
                {t({ bn: 'স্থগিতের কারণ', en: 'Suspension reason' })}: {user.suspendedReason}
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
              <h2 style={{ fontSize: 17, marginTop: 0 }}>{t({ bn: 'পদক্ষেপ', en: 'Actions' })}</h2>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: 4 }}>
                {t({ bn: 'কারণ (অবশ্যই লিখুন — কমপক্ষে ১০ অক্ষর)', en: 'Reason (required — at least 10 characters)' })}
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                placeholder={t({ bn: 'কেন এই সিদ্ধান্ত নিচ্ছেন — পরে অডিট লগে দেখা যাবে', en: 'Why are you taking this decision — it will be visible in the audit log later' })}
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
                    {t({ bn: 'স্থগিত করুন', en: 'Suspend' })}
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
                    {t({ bn: 'আবার চালু করুন', en: 'Reactivate' })}
                  </button>
                )}
              </div>
              <h3 style={{ fontSize: 16, marginTop: 20 }}>{t({ bn: 'ভূমিকা বদলান', en: 'Change role' })}</h3>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  aria-label={t({ bn: 'নতুন ভূমিকা', en: 'New role' })}
                  style={{ padding: '12px 10px', minHeight: 48, fontSize: 16, borderRadius: 8 }}
                >
                  {ASSIGNABLE_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABEL[r] ? t(ROLE_LABEL[r]) : r}
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
                  {t({ bn: 'ভূমিকা বদলান', en: 'Change role' })}
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
                    {t({
                      bn: 'নিশ্চিত করছি — এই ব্যক্তি প্রাপ্তবয়স্ক এবং পরিচয় যাচাই করা হয়েছে। শিশুকে কখনো শিক্ষক/মডারেটর/অ্যাডমিন বানানো যায় না।',
                      en: 'I confirm — this person is an adult and their identity was checked. A child can never be made teacher/moderator/admin.',
                    })}
                  </span>
                </label>
              ) : null}
              <p style={{ color: '#555', fontSize: 14 }}>
                {t({
                  bn: 'স্থগিত করলে ব্যবহারকারী আর লগইন করে অ্যাপ ব্যবহার করতে পারবেন না (নিয়মেও আটকানো আছে)। ভূমিকা বদলালে আগের ভূমিকা অডিট লগে থাকবে।',
                  en: 'Suspending blocks the account in the app and in the rules. A role change keeps the old role in the audit log.',
                })}
              </p>
            </div>
          )}

          <h2 style={{ fontSize: 18 }}>{t({ bn: 'এই ব্যবহারকারীর লেখা', en: 'Their posts & questions' })}</h2>
          {detail && detail.posts.length === 0 && detail.questions.length === 0 ? (
            <p style={{ color: '#555' }}>{t({ bn: 'কিছু লেখেননি এখনো।', en: 'Nothing written yet.' })}</p>
          ) : null}
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {detail?.posts.map((p) => (
              <li key={p.id} style={{ border: '1px solid #eee', borderRadius: 8, padding: '10px 12px', marginBottom: 8 }}>
                <strong>{t({ bn: 'পোস্ট', en: 'Post' })}: {p.title}</strong>
                <p style={{ margin: '4px 0', color: '#555', fontSize: 14 }}>
                  {p.body.slice(0, 200)} · {p.reviewStatus ?? ''} · {formatTime(p.createdAt, lang)}
                </p>
              </li>
            ))}
            {detail?.questions.map((q) => (
              <li key={q.id} style={{ border: '1px solid #eee', borderRadius: 8, padding: '10px 12px', marginBottom: 8 }}>
                <strong>{t({ bn: 'প্রশ্ন', en: 'Question' })}: {q.title}</strong>
                <p style={{ margin: '4px 0', color: '#555', fontSize: 14 }}>
                  {q.body.slice(0, 200)} · {q.reviewStatus ?? ''} · {formatTime(q.createdAt, lang)}
                </p>
              </li>
            ))}
          </ul>

          <h2 style={{ fontSize: 18 }}>{t({ bn: 'সাপোর্ট মেসেজ', en: 'Support messages' })}</h2>
          {detail && detail.supportThreads.length === 0 ? (
            <p style={{ color: '#555' }}>
              {t({ bn: 'কোনো সাপোর্ট কথোপকথন নেই।', en: 'No support conversations.' })}
            </p>
          ) : null}
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {detail?.supportThreads.map((thread) => (
              <li key={thread.id} style={{ border: '1px solid #eee', borderRadius: 8, padding: '10px 12px', marginBottom: 8 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <strong>{t({ bn: 'সাপোর্ট থ্রেড', en: 'Support thread' })}</strong>
                  <StatusPill label={thread.status === 'open' ? t({ bn: 'খোলা', en: 'Open' }) : t({ bn: 'বন্ধ', en: 'Closed' })} tone={thread.status === 'open' ? 'active' : 'muted'} />
                  <span style={{ color: '#555', fontSize: 14 }}>{formatTime(thread.createdAt, lang)}</span>
                  <button
                    type="button"
                    onClick={() => void openThread(thread.id)}
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
                    {expandedThread === thread.id ? t({ bn: 'লুকান', en: 'Hide' }) : t({ bn: 'মেসেজ দেখুন', en: 'View messages' })}
                  </button>
                </div>
                {expandedThread === thread.id ? (
                  threadLoading ? (
                    <LoadingBox />
                  ) : threadMessages.length === 0 ? (
                    <p style={{ color: '#555' }}>{t({ bn: 'এই থ্রেডে কোনো মেসেজ নেই।', en: 'No messages in this thread.' })}</p>
                  ) : (
                    <ul style={{ listStyle: 'none', padding: 0, marginTop: 8 }}>
                      {threadMessages.map((m) => (
                        <li key={m.id} style={{ borderTop: '1px solid #eee', padding: '8px 0' }}>
                          <p style={{ margin: 0 }}>{m.body}</p>
                          <p style={{ margin: '4px 0 0', color: '#555', fontSize: 14 }}>
                            {m.senderId === user.uid ? t({ bn: 'ব্যবহারকারী', en: 'User' }) : t({ bn: 'অ্যাডমিন', en: 'Admin' })} ·{' '}
                            {formatTime(m.createdAt, lang)}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )
                ) : null}
              </li>
            ))}
          </ul>

          <h2 style={{ fontSize: 18 }}>{t({ bn: 'এই ব্যবহারকারী সম্পর্কে রিপোর্ট', en: 'Reports about this user' })}</h2>
          {detail && detail.reportsAbout.length === 0 ? (
            <p style={{ color: '#555' }}>{t({ bn: 'কোনো রিপোর্ট নেই।', en: 'No reports.' })}</p>
          ) : null}
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {detail?.reportsAbout.map((r) => (
              <li key={r.id} style={{ border: '1px solid #eee', borderRadius: 8, padding: '10px 12px', marginBottom: 8 }}>
                <strong>
                  {r.reason} · {r.status}
                </strong>
                <p style={{ margin: '4px 0', color: '#555', fontSize: 14 }}>
                  {r.targetType ?? ''} {r.details ? `— ${r.details}` : ''} · {formatTime(r.createdAt, lang)}
                </p>
              </li>
            ))}
          </ul>
          <p style={{ marginTop: 24 }}>
            <Link to="/admin/users">← {t({ bn: 'সব ব্যবহারকারী', en: 'All users' })}</Link>
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
                : `${user.displayName}-এর ভূমিকা ${ROLE_LABEL[user.role]?.bn ?? user.role} থেকে ${ROLE_LABEL[newRole]?.bn ?? newRole}-এ বদলাবেন? কারণ: ${reason}`
          }
          bodyEn={
            confirm === 'suspend'
              ? `${user.displayName} will be suspended and cannot use the app.`
              : confirm === 'reactivate'
                ? `${user.displayName} will be reactivated and can use the app again.`
                : `${user.displayName}'s role will change from ${ROLE_LABEL[user.role]?.en ?? user.role} to ${ROLE_LABEL[newRole]?.en ?? newRole}.`
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
