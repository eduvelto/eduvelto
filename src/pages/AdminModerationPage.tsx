// Eduvelto — moderation + child-safety controls (owner-only page,
// behind AdminGuard).
//
// - Report review: open reports, resolve/dismiss (logged to adminActions,
//   reporter notified on resolve).
// - Exceptional DM access: the OWNER alone creates a grant — written
//   reason (≥10 chars), one admin, one conversation, ≤72h. Every read
//   under a grant is logged and the users are notified afterwards
//   (see readGrantedThread in src/lib/messaging.ts).
// - DM consents for minors (admin-granted, logged).
// - DM suspension after confirmed reports (logged).

import { useEffect, useState, type FormEvent } from 'react';
import { PageShell, EmptyState } from '../components/PageShell';
import { strings } from '../i18n/strings';
import { useAuth } from '../lib/auth';
import { db, isFirebaseConfigured } from '../firebase';
import {
  createDmAccessGrant,
  getDmConsent,
  grantDmConsent,
  listDmAccessGrants,
  listOpenReports,
  dismissReport,
  resolveReport,
  revokeDmAccessGrant,
  revokeDmConsent,
  setDmSuspended,
  type DmAccessGrant,
  type ReportRow,
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

export default function AdminModerationPage() {
  const { user, profile, loading } = useAuth();
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [grants, setGrants] = useState<DmAccessGrant[]>([]);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [resolution, setResolution] = useState<Record<string, string>>({});

  // Grant form (owner only).
  const [grantThreadId, setGrantThreadId] = useState('');
  const [grantTo, setGrantTo] = useState('');
  const [grantReason, setGrantReason] = useState('');
  const [grantHours, setGrantHours] = useState(24);
  // Consent form.
  const [consentChild, setConsentChild] = useState('');
  const [consentGuardian, setConsentGuardian] = useState('');
  const [consentReason, setConsentReason] = useState('');
  const [consentStatus, setConsentStatus] = useState('');
  // Suspension form.
  const [suspendUid, setSuspendUid] = useState('');
  const [suspendReason, setSuspendReason] = useState('');

  const isOwner = profile?.role === 'owner';

  async function refresh() {
    if (!db) return;
    try {
      const [open, allGrants] = await Promise.all([listOpenReports(db), listDmAccessGrants(db)]);
      setReports(open);
      setGrants(allGrants);
    } catch (e) {
      setError(friendlyErrorMessage(e));
    }
  }

  useEffect(() => {
    if (!db || !user) return;
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (loading) {
    return (
      <PageShell titleBn={strings.moderation.title.bn} titleEn={strings.moderation.title.en}>
        <p>{strings.common.loading.bn}</p>
      </PageShell>
    );
  }
  if (!isFirebaseConfigured || !db || !user) {
    return (
      <PageShell titleBn={strings.moderation.title.bn} titleEn={strings.moderation.title.en}>
        <EmptyState bn={strings.profile.notSignedIn.bn} en={strings.profile.notSignedIn.en} />
      </PageShell>
    );
  }

  async function onResolve(report: ReportRow) {
    const note = (resolution[report.id] ?? '').trim();
    if (note.length < 3) {
      setNotice('নিষ্পত্তির বিবরণ লিখুন। / Write a resolution note.');
      return;
    }
    setBusy(true);
    try {
      await resolveReport(db!, report.id, note, report.reporterId);
      setNotice(strings.moderation.resolved.bn);
      await refresh();
    } catch (e) {
      setNotice(friendlyErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function onDismiss(report: ReportRow) {
    const note = (resolution[report.id] ?? '').trim() || 'পর্যালোচনা করে বাতিল করা হয়েছে।';
    setBusy(true);
    try {
      await dismissReport(db!, report.id, note);
      setNotice(strings.moderation.dismissed.bn);
      await refresh();
    } catch (e) {
      setNotice(friendlyErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function onCreateGrant(e: FormEvent) {
    e.preventDefault();
    if (!isOwner) {
      setNotice(strings.moderation.ownerOnly.bn);
      return;
    }
    setBusy(true);
    setNotice('');
    try {
      await createDmAccessGrant(db!, user!.uid, grantThreadId.trim(), grantTo.trim(), grantReason, grantHours);
      setNotice(strings.moderation.grantCreated.bn);
      setGrantThreadId('');
      setGrantTo('');
      setGrantReason('');
      await refresh();
    } catch (err) {
      setNotice(friendlyErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function onRevokeGrant(grant: DmAccessGrant) {
    setBusy(true);
    try {
      await revokeDmAccessGrant(db!, grant.id, grant.threadId);
      setNotice(strings.moderation.grantRevoked.bn);
      await refresh();
    } catch (e) {
      setNotice(friendlyErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function onGrantConsent(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setNotice('');
    try {
      await grantDmConsent(db!, consentChild.trim(), consentGuardian.trim(), user!.uid, consentReason);
      setNotice('সম্মতি দেওয়া হয়েছে। / Consent granted.');
      await checkConsent();
    } catch (err) {
      setNotice(friendlyErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function checkConsent() {
    if (!consentChild.trim()) return;
    try {
      const c = await getDmConsent(db!, consentChild.trim());
      setConsentStatus(c ? `${c.status} (guardian ${c.guardianUid})` : 'কোনো সম্মতি নেই / No consent on file.');
    } catch (e) {
      setConsentStatus(friendlyErrorMessage(e));
    }
  }

  async function onRevokeConsent() {
    setBusy(true);
    try {
      await revokeDmConsent(db!, consentChild.trim(), consentReason || 'অভিভাবকের সম্মতি বাতিল।');
      setNotice('সম্মতি বাতিল হয়েছে। / Consent revoked.');
      await checkConsent();
    } catch (e) {
      setNotice(friendlyErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function onSuspend(suspended: boolean) {
    setBusy(true);
    setNotice('');
    try {
      await setDmSuspended(db!, suspendUid.trim(), suspended, suspendReason);
      setNotice(suspended ? 'বার্তা স্থগিত হয়েছে। / Messaging suspended.' : 'বার্তা আবার চালু হয়েছে। / Messaging unsuspended.');
    } catch (e) {
      setNotice(friendlyErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageShell titleBn={strings.moderation.title.bn} titleEn={strings.moderation.title.en}>
      {error ? <p style={{ color: '#b00020' }}>{error}</p> : null}
      {notice ? <p style={{ color: '#0A1F44' }}>{notice}</p> : null}

      <h2 style={{ fontSize: 20 }}>{strings.moderation.reports.bn}</h2>
      {reports.length === 0 ? (
        <EmptyState bn={strings.moderation.noReports.bn} en={strings.moderation.noReports.en} />
      ) : (
        <ul style={{ padding: 0, listStyle: 'none' }}>
          {reports.map((r) => (
            <li key={r.id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: '12px 14px', marginBottom: 10 }}>
              <strong>{r.targetType}</strong> · {r.reason} · {formatTime(r.createdAt)}
              <div style={{ color: '#333', marginTop: 4 }}>
                target: {r.targetId} · author: {r.targetAuthorId} · reporter: {r.reporterId}
              </div>
              {r.details ? <div style={{ color: '#555', fontSize: 14, marginTop: 4 }}>{r.details}</div> : null}
              <input
                type="text"
                value={resolution[r.id] ?? ''}
                onChange={(e) => setResolution((prev) => ({ ...prev, [r.id]: e.target.value }))}
                placeholder={strings.moderation.resolution.bn}
                maxLength={500}
                style={inputStyle}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => void onResolve(r)} disabled={busy} style={smallButtonStyle}>
                  {strings.moderation.resolve.bn}
                </button>
                <button
                  type="button"
                  onClick={() => void onDismiss(r)}
                  disabled={busy}
                  style={{ ...smallButtonStyle, background: '#fff', color: '#0A1F44', border: '1px solid #0A1F44' }}
                >
                  {strings.moderation.dismiss.bn}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <h2 style={{ fontSize: 20 }}>{strings.moderation.grants.bn}</h2>
      {isOwner ? (
        <form onSubmit={onCreateGrant} style={{ border: '1px solid #ddd', borderRadius: 8, padding: '14px 16px', marginBottom: 16 }}>
          <p style={{ color: '#555', fontSize: 14, marginTop: 0 }}>
            ব্যতিক্রমী যাচাই: শুধুমাত্র মালিক অনুমোদন দিতে পারেন। লিখিত কারণ, একজন অ্যাডমিন, একটি কথোপকথন, সর্বোচ্চ ৭২ ঘণ্টা। প্রতিটি পড়া অডিট লগে লেখা হয় এবং ব্যবহারকারীদের জানানো হয়।
          </p>
          <label htmlFor="grant-thread">কথোপকথন ID (thread id)</label>
          <input id="grant-thread" type="text" value={grantThreadId} onChange={(e) => setGrantThreadId(e.target.value)} style={inputStyle} />
          <label htmlFor="grant-to">অ্যাডমিন UID (যাকে অনুমোদন দেওয়া হচ্ছে)</label>
          <input id="grant-to" type="text" value={grantTo} onChange={(e) => setGrantTo(e.target.value)} style={inputStyle} />
          <label htmlFor="grant-reason">{strings.moderation.grantReason.bn}</label>
          <textarea id="grant-reason" value={grantReason} onChange={(e) => setGrantReason(e.target.value)} rows={3} style={inputStyle} />
          <label htmlFor="grant-hours">{strings.moderation.grantHours.bn}</label>
          <input id="grant-hours" type="number" min={1} max={72} value={grantHours} onChange={(e) => setGrantHours(Number(e.target.value))} style={inputStyle} />
          <button type="submit" disabled={busy} style={buttonStyle}>
            {strings.moderation.grants.bn}
          </button>
        </form>
      ) : (
        <p style={{ color: '#555' }}>{strings.moderation.ownerOnly.bn}</p>
      )}
      {grants.length === 0 ? (
        <p style={{ color: '#555' }}>কোনো অনুমোদন নেই। / No grants.</p>
      ) : (
        <ul style={{ padding: 0, listStyle: 'none' }}>
          {grants.map((g) => (
            <li key={g.id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: '12px 14px', marginBottom: 10 }}>
              <strong>{g.threadId}</strong> → {g.grantedTo} · {g.status} · {formatTime(g.createdAt)}
              <div style={{ color: '#555', fontSize: 14, marginTop: 4 }}>{g.reason}</div>
              {g.status === 'approved' && isOwner ? (
                <button type="button" onClick={() => void onRevokeGrant(g)} disabled={busy} style={{ ...smallButtonStyle, marginTop: 8 }}>
                  {strings.moderation.revoke.bn}
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <h2 style={{ fontSize: 20 }}>{strings.moderation.consents.bn}</h2>
      <form onSubmit={onGrantConsent} style={{ border: '1px solid #ddd', borderRadius: 8, padding: '14px 16px', marginBottom: 16 }}>
        <label htmlFor="consent-child">শিশুর UID / Child UID</label>
        <input id="consent-child" type="text" value={consentChild} onChange={(e) => setConsentChild(e.target.value)} style={inputStyle} />
        <label htmlFor="consent-guardian">অভিভাবকের UID / Guardian UID</label>
        <input id="consent-guardian" type="text" value={consentGuardian} onChange={(e) => setConsentGuardian(e.target.value)} style={inputStyle} />
        <label htmlFor="consent-reason">কারণ / Reason</label>
        <input id="consent-reason" type="text" value={consentReason} onChange={(e) => setConsentReason(e.target.value)} style={inputStyle} />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="submit" disabled={busy} style={buttonStyle}>
            {strings.moderation.consents.bn}
          </button>
          <button type="button" onClick={() => void checkConsent()} disabled={busy} style={{ ...buttonStyle, background: '#fff', color: '#0A1F44', border: '1px solid #0A1F44' }}>
            অবস্থা দেখুন / Check status
          </button>
          <button type="button" onClick={() => void onRevokeConsent()} disabled={busy} style={{ ...buttonStyle, background: '#fff', color: '#b00020', border: '1px solid #b00020' }}>
            {strings.moderation.revoke.bn}
          </button>
        </div>
        {consentStatus ? <p style={{ marginTop: 10 }}>{consentStatus}</p> : null}
      </form>

      <h2 style={{ fontSize: 20 }}>{strings.moderation.dmSuspend.bn} / {strings.moderation.dmUnsuspend.bn}</h2>
      <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: '14px 16px' }}>
        <label htmlFor="suspend-uid">ব্যবহারকারীর UID / User UID</label>
        <input id="suspend-uid" type="text" value={suspendUid} onChange={(e) => setSuspendUid(e.target.value)} style={inputStyle} />
        <label htmlFor="suspend-reason">কারণ / Reason</label>
        <input id="suspend-reason" type="text" value={suspendReason} onChange={(e) => setSuspendReason(e.target.value)} style={inputStyle} />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" onClick={() => void onSuspend(true)} disabled={busy} style={{ ...buttonStyle, background: '#b00020' }}>
            {strings.moderation.dmSuspend.bn}
          </button>
          <button type="button" onClick={() => void onSuspend(false)} disabled={busy} style={{ ...buttonStyle, background: '#fff', color: '#0A1F44', border: '1px solid #0A1F44' }}>
            {strings.moderation.dmUnsuspend.bn}
          </button>
        </div>
      </div>
    </PageShell>
  );
}
