// Eduvelto — Guardian Links (child's Confirmation Screen, Step 8).
//
// DEDICATED in-app screen where a student sees every guardian link
// request addressed to them and decides: Confirm ("Yes, this is my
// parent/guardian") or Reject. No link becomes active without the
// child's consent here AND an admin's approval after it.
//
// The screen shows WHO is asking — the guardian's own name,
// relationship and contact as they typed it — never the child's own
// data (the child already knows their own name). A confirmed link
// waits for the admin; a verified link can be revoked by the child
// here at any time. Rejected/revoked links are shown as history, not
// hidden — the child can see what happened to each request.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { PageShell } from '../components/PageShell';
import { strings } from '../i18n/strings';
import { useAuth } from '../lib/auth';
import {
  confirmParentLink,
  listLinksForChild,
  rejectParentLink,
  revokeParentLink,
  type ParentLink,
} from '../lib/guardian';

const buttonStyle: React.CSSProperties = {
  padding: '10px 18px',
  fontSize: 16,
  borderRadius: 6,
  border: 'none',
  background: '#0A1F44',
  color: '#fff',
  cursor: 'pointer',
};

const secondaryStyle: React.CSSProperties = {
  ...buttonStyle,
  background: '#fff',
  color: '#111',
  border: '1px solid #aaa',
};

const STATUS_BN: Record<ParentLink['status'], string> = {
  pending: 'আপনার নিশ্চিতকরণের অপেক্ষায়',
  confirmed: 'অ্যাডমিন যাচাইয়ের অপেক্ষায়',
  verified: 'সক্রিয়',
  rejected: 'অ্যাডমিন বাতিল করেছেন',
  revoked: 'বাতিল হয়েছে',
};

export default function GuardianLinksPage() {
  const { user, profile, loading } = useAuth();
  const d = strings.dashboard;
  const [links, setLinks] = useState<ParentLink[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !db) return;
    let live = true;
    listLinksForChild(db, user.uid)
      .then((l) => {
        if (live) setLinks(l);
      })
      .catch(() => {
        if (live) setLinks([]);
      });
    return () => {
      live = false;
    };
  }, [user]);

  if (loading) {
    return (
      <PageShell titleBn={d.linkConfirmTitle.bn} titleEn={d.linkConfirmTitle.en}>
        <p>{strings.common.loading.bn}</p>
      </PageShell>
    );
  }

  if (!user || !profile) {
    return (
      <PageShell titleBn={d.linkConfirmTitle.bn} titleEn={d.linkConfirmTitle.en}>
        <p>{strings.profile.notSignedIn.bn}</p>
        <p>
          <Link to="/login">{strings.auth.loginTitle.bn}</Link>
        </p>
      </PageShell>
    );
  }

  if (profile.role !== 'student') {
    return (
      <PageShell titleBn={d.linkConfirmTitle.bn} titleEn={d.linkConfirmTitle.en}>
        <p>এই পাতাটি শুধু শিক্ষার্থীদের জন্য।</p>
        <p>
          <Link to="/dashboard">আপনার ড্যাশবোর্ডে যান →</Link>
        </p>
      </PageShell>
    );
  }

  async function act(linkId: string, fn: (db2: NonNullable<typeof db>, id: string, uid: string) => Promise<void>, next: ParentLink['status']): Promise<void> {
    if (!db) return;
    setBusy(linkId);
    setError(null);
    try {
      await fn(db, linkId, user.uid);
      setLinks((ls) => (ls ?? []).map((l) => (l.id === linkId ? { ...l, status: next } : l)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'কাজটি করা যায়নি। / Could not complete this action.');
    } finally {
      setBusy(null);
    }
  }

  const pending = (links ?? []).filter((l) => l.status === 'pending');
  const active = (links ?? []).filter((l) => l.status === 'confirmed' || l.status === 'verified');
  const closed = (links ?? []).filter((l) => l.status === 'rejected' || l.status === 'revoked');

  return (
    <PageShell titleBn={d.linkConfirmTitle.bn} titleEn={d.linkConfirmTitle.en}>
      <p style={{ color: '#555' }}>
        একজন অভিভাবক আপনার সাথে সংযোগ চাইছেন — নিশ্চিত করলে তিনি আপনার অগ্রগতি দেখতে পারবেন, আপনার মেসেজ
        নয়। / A guardian is asking to link with you — confirming lets them see your progress, never your
        messages.
      </p>

      {error ? <p style={{ color: '#b00020' }}>{error}</p> : null}

      <h2 style={{ fontSize: 19 }}>নতুন অনুরোধ / New requests</h2>
      {links === null ? (
        <p>{strings.common.loading.bn}</p>
      ) : pending.length === 0 ? (
        <p style={{ color: '#555' }}>কোনো নতুন অনুরোধ নেই। / No new requests.</p>
      ) : (
        <ul style={{ paddingLeft: 0, listStyle: 'none' }}>
          {pending.map((l) => (
            <li key={l.id} style={{ border: '1px solid #ccc', borderRadius: 8, padding: 16, marginBottom: 12 }}>
              <p style={{ margin: '0 0 6px', fontSize: 18 }}>
                <strong>{l.guardianDisplayName || '—'}</strong>
                {l.relationship ? ` · ${l.relationship}` : ''}
              </p>
              <p style={{ margin: '0 0 6px', color: '#555' }}>
                {l.guardianContact ? `যোগাযোগ: ${l.guardianContact} · ` : ''}
                আপনার নাম হিসেবে লিখেছেন: {l.childDisplayName} ({l.childClassLevel}
                {l.childInstitution ? ` · ${l.childInstitution}` : ''})
              </p>
              <p style={{ margin: '0 0 12px', color: '#555' }}>{d.confirmLinkNote.bn}</p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button
                  style={buttonStyle}
                  type="button"
                  disabled={busy === l.id}
                  onClick={() => void act(l.id, confirmParentLink, 'confirmed')}
                >
                  {busy === l.id ? strings.common.loading.bn : 'হ্যাঁ, এনি আমার অভিভাবক / Yes, this is my guardian'}
                </button>
                <button
                  style={secondaryStyle}
                  type="button"
                  disabled={busy === l.id}
                  onClick={() => void act(l.id, rejectParentLink, 'revoked')}
                >
                  {d.rejectLink.bn} / {d.rejectLink.en}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <h2 style={{ fontSize: 19 }}>সক্রিয় সংযোগ / Active links</h2>
      {active.length === 0 ? (
        <p style={{ color: '#555' }}>কোনো সক্রিয় সংযোগ নেই। / No active links.</p>
      ) : (
        <ul style={{ paddingLeft: 20 }}>
          {active.map((l) => (
            <li key={l.id} style={{ marginBottom: 12 }}>
              {l.guardianDisplayName || '—'} ({l.relationship || '—'}) — {STATUS_BN[l.status]}
              {l.status === 'verified' ? (
                <button
                  style={{ ...secondaryStyle, padding: '6px 12px', marginLeft: 8 }}
                  type="button"
                  disabled={busy === l.id}
                  onClick={() => void act(l.id, revokeParentLink, 'revoked')}
                >
                  {busy === l.id ? strings.common.loading.bn : `${d.revokeLink.bn} / ${d.revokeLink.en}`}
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {closed.length > 0 ? (
        <>
          <h2 style={{ fontSize: 19 }}>পূর্বের অনুরোধ / Past requests</h2>
          <ul style={{ paddingLeft: 20 }}>
            {closed.map((l) => (
              <li key={l.id}>
                {l.guardianDisplayName || '—'} ({l.relationship || '—'}) — {STATUS_BN[l.status]}
                {l.status === 'rejected' && l.decisionReason ? ` — কারণ: ${l.decisionReason}` : ''}
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <p style={{ marginTop: 24 }}>
        <Link to="/profile">← প্রোফাইলে ফিরে যান / Back to profile</Link>
      </p>
    </PageShell>
  );
}
