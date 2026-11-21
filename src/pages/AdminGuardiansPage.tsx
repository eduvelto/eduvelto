// Eduvelto — Admin Guardian Link Verification (Step 8).
//
// The Admin Approval Workflow for guardian↔child links: the admin
// cross-checks the written information (guardian name, relationship,
// contact, child's name/class/institution) and approves (confirmed ->
// 'verified') or rejects (pending/confirmed -> 'rejected') with a
// reason (>= 10 chars, shown to the guardian). A rejected link is a
// dead end — the guardian may request again. The admin can also
// revoke any verified link. Every decision writes an adminActions
// audit entry in the same batch as the link change (guardian.ts).
//
// No documents are collected, no NID, no face verification, no OTP,
// no fee — the check is the written information + the child's own
// in-app confirmation (the link only reaches this queue after the
// child confirmed it, or is still pending that confirmation).
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { PageShell } from '../components/PageShell';
import { strings } from '../i18n/strings';
import { useAuth } from '../lib/auth';
import {
  decideParentLink,
  listAllParentLinks,
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

type Decision = 'verified' | 'rejected' | 'revoked';

function LinkCard(props: { link: ParentLink; actorUid: string; onDone: () => void }) {
  const { link, actorUid, onDone } = props;
  const [reason, setReason] = useState('');
  const [decision, setDecision] = useState<Decision | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reasonOk = reason.trim().length >= 10;

  async function doConfirm(): Promise<void> {
    if (!db || !decision) return;
    setBusy(true);
    setError(null);
    try {
      if (decision === 'revoked') {
        await revokeParentLink(db, link.id, actorUid);
      } else {
        await decideParentLink(db, actorUid, link.id, decision, reason);
      }
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'সিদ্ধান্তটি সংরক্ষণ করা যায়নি। / Could not save the decision.');
    } finally {
      setBusy(false);
    }
  }

  const decidable = link.status === 'pending' || link.status === 'confirmed';

  return (
    <li style={{ border: '1px solid #ccc', borderRadius: 8, padding: 16, marginBottom: 12, listStyle: 'none' }}>
      <p style={{ margin: '0 0 6px', fontSize: 18 }}>
        <strong>{link.guardianDisplayName || '—'}</strong>
        {link.relationship ? ` · ${link.relationship}` : ''}
        {link.guardianContact ? ` · ${link.guardianContact}` : ''}
      </p>
      <p style={{ margin: '0 0 6px', color: '#555' }}>
        সন্তান: {link.childDisplayName} ({link.childClassLevel}
        {link.childInstitution ? ` · ${link.childInstitution}` : ''})
      </p>
      <p style={{ margin: '0 0 6px', color: '#555' }}>
        অবস্থা: {link.status}
        {link.status === 'pending' ? ' — সন্তান এখনো নিশ্চিত করেনি' : ''}
        {link.status === 'confirmed' ? ' — সন্তান নিশ্চিত করেছে' : ''}
        {link.status === 'rejected' && link.decisionReason ? ` — কারণ: ${link.decisionReason}` : ''}
      </p>
      <p style={{ margin: '0 0 12px', color: '#555', fontSize: 13 }}>
        Eduvelto ID (অভিভাবক): <code>{link.parentId}</code> · (সন্তান): <code>{link.studentId}</code>
      </p>
      {error ? <p style={{ color: '#b00020' }}>{error}</p> : null}
      {decidable ? (
        <>
          <label>
            সিদ্ধান্তের কারণ (কমপক্ষে ১০ অক্ষর) / Reason (at least 10 characters)
            <input
              style={inputStyle}
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="যেমন: সন্তান নিশ্চিত করেছে এবং তথ্য মিলেছে"
              maxLength={500}
            />
          </label>
          {decision ? (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button style={buttonStyle} type="button" onClick={() => void doConfirm()} disabled={busy || !reasonOk}>
                {busy
                  ? strings.common.loading.bn
                  : decision === 'verified'
                    ? 'অনুমোদন নিশ্চিত করুন / Confirm approval'
                    : 'বাতিল নিশ্চিত করুন / Confirm rejection'}
              </button>
              <button style={secondaryStyle} type="button" onClick={() => setDecision(null)} disabled={busy}>
                বাতিল / Cancel
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button style={buttonStyle} type="button" onClick={() => setDecision('verified')}>
                অনুমোদন করুন / Approve
              </button>
              <button style={secondaryStyle} type="button" onClick={() => setDecision('rejected')}>
                বাতিল করুন / Reject
              </button>
            </div>
          )}
          {!reasonOk && decision ? <p style={{ color: '#b00020' }}>কারণ কমপক্ষে ১০ অক্ষর হতে হবে।</p> : null}
        </>
      ) : null}
      {link.status === 'verified' ? (
        <p style={{ marginTop: 12 }}>
          {decision === 'revoked' ? (
            <>
              <button style={buttonStyle} type="button" onClick={() => void doConfirm()} disabled={busy}>
                {busy ? strings.common.loading.bn : 'বাতিল নিশ্চিত করুন / Confirm revoke'}
              </button>{' '}
              <button style={secondaryStyle} type="button" onClick={() => setDecision(null)} disabled={busy}>
                বাতিল / Cancel
              </button>
            </>
          ) : (
            <button style={secondaryStyle} type="button" onClick={() => setDecision('revoked')}>
              সংযোগ বাতিল করুন / Revoke link
            </button>
          )}
        </p>
      ) : null}
    </li>
  );
}

export default function AdminGuardiansPage() {
  const { user, profile } = useAuth();
  const d = strings.dashboard;
  const [links, setLinks] = useState<ParentLink[] | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!db) return;
    let live = true;
    listAllParentLinks(db)
      .then((l) => {
        if (live) setLinks(l);
      })
      .catch(() => {
        if (live) setLinks([]);
      });
    return () => {
      live = false;
    };
  }, [reload]);

  if (!user || !profile || (profile.role !== 'admin' && profile.role !== 'owner')) {
    return (
      <PageShell titleBn={d.adminGuardiansTitle.bn} titleEn={d.adminGuardiansTitle.en}>
        <p>{strings.admin.accessDenied.bn}</p>
        <p>
          <Link to="/admin">অ্যাডমিন ড্যাশবোর্ডে ফিরে যান →</Link>
        </p>
      </PageShell>
    );
  }

  const queue = (links ?? []).filter((l) => l.status === 'pending' || l.status === 'confirmed');
  const verified = (links ?? []).filter((l) => l.status === 'verified');
  const closed = (links ?? []).filter((l) => l.status === 'rejected' || l.status === 'revoked');

  return (
    <PageShell titleBn={d.adminGuardiansTitle.bn} titleEn={d.adminGuardiansTitle.en}>
      <p>
        <Link to="/admin">← অ্যাডমিন ড্যাশবোর্ড</Link>
      </p>
      <p style={{ color: '#555' }}>
        লিখিত তথ্য যাচাই করুন — অভিভাবকের নাম, সম্পর্ক, যোগাযোগ এবং সন্তানের তথ্য। কোনো কাগজপত্র, NID বা
        ফেস ভেরিফিকেশন লাগে না; সন্তান নিজে অ্যাপে নিশ্চিত করেছে কিনা সেটিই মূল প্রমাণ। / Cross-check the
        written information. No documents, NID or face verification — the child's own in-app confirmation is
        the key proof.
      </p>

      <h2 style={{ fontSize: 19 }}>যাচাইয়ের অপেক্ষায় ({queue.length}) / Awaiting decision</h2>
      {links === null ? (
        <p>{strings.common.loading.bn}</p>
      ) : queue.length === 0 ? (
        <p style={{ color: '#555' }}>কোনো অপেক্ষমাণ অনুরোধ নেই। / No pending requests.</p>
      ) : (
        <ul style={{ paddingLeft: 0 }}>
          {queue.map((l) => (
            <LinkCard key={l.id} link={l} actorUid={user.uid} onDone={() => setReload((r) => r + 1)} />
          ))}
        </ul>
      )}

      <h2 style={{ fontSize: 19 }}>সক্রিয় সংযোগ ({verified.length}) / Active links</h2>
      {verified.length === 0 ? (
        <p style={{ color: '#555' }}>কোনো সক্রিয় সংযোগ নেই। / No active links.</p>
      ) : (
        <ul style={{ paddingLeft: 0 }}>
          {verified.map((l) => (
            <LinkCard key={l.id} link={l} actorUid={user.uid} onDone={() => setReload((r) => r + 1)} />
          ))}
        </ul>
      )}

      {closed.length > 0 ? (
        <>
          <h2 style={{ fontSize: 19 }}>বাতিলকৃত ({closed.length}) / Closed</h2>
          <ul style={{ paddingLeft: 20 }}>
            {closed.map((l) => (
              <li key={l.id}>
                {l.guardianDisplayName || '—'} → {l.childDisplayName} — {l.status}
                {l.decisionReason ? ` — ${l.decisionReason}` : ''}
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </PageShell>
  );
}
