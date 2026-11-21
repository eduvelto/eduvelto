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
import { Button, Card } from '../components/ui';
import { StatusPill } from '../components/AdminShared';
import { strings } from '../i18n/strings';
import { useAuth } from '../lib/auth';
import {
  decideParentLink,
  listAllParentLinks,
  revokeParentLink,
  type ParentLink,
} from '../lib/guardian';

// Buttons below use the shared <Button> component (design system v2).

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
    <li style={{ marginBottom: 12, listStyle: 'none' }}>
      <Card>
      <p style={{ margin: '0 0 6px', fontSize: 18 }}>
        <strong>{link.guardianDisplayName || '—'}</strong>
        {link.relationship ? ` · ${link.relationship}` : ''}
        {link.guardianContact ? ` · ${link.guardianContact}` : ''}
      </p>
      <p style={{ margin: '0 0 6px', color: '#68747B' }}>
        সন্তান: {link.childDisplayName} ({link.childClassLevel}
        {link.childInstitution ? ` · ${link.childInstitution}` : ''})
      </p>
      <p style={{ margin: '0 0 6px', color: '#68747B', display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <StatusPill
          label={
            link.status === 'pending'
              ? 'অপেক্ষায় / Pending'
              : link.status === 'confirmed'
                ? 'নিশ্চিত / Confirmed'
                : link.status === 'verified'
                  ? 'ভেরিফায়েড / Verified'
                  : link.status === 'rejected'
                    ? 'বাতিল / Rejected'
                    : 'বাতিলকৃত / Revoked'
          }
          tone={link.status === 'verified' ? 'active' : link.status === 'pending' || link.status === 'confirmed' ? 'ready' : 'muted'}
        />
        <span>
          {link.status === 'pending' ? ' — সন্তান এখনো নিশ্চিত করেনি' : ''}
          {link.status === 'confirmed' ? ' — সন্তান নিশ্চিত করেছে' : ''}
          {link.status === 'rejected' && link.decisionReason ? ` — কারণ: ${link.decisionReason}` : ''}
        </span>
      </p>
      <p style={{ margin: '0 0 12px', color: '#68747B', fontSize: 13 }}>
        Eduvelto ID (অভিভাবক): <code>{link.parentId}</code> · (সন্তান): <code>{link.studentId}</code>
      </p>
      {error ? <p style={{ color: '#B00020' }}>{error}</p> : null}
      {decidable ? (
        <>
          <label className="ev-label" htmlFor={`guardian-reason-${link.id}`}>
            সিদ্ধান্তের কারণ (কমপক্ষে ১০ অক্ষর) / Reason (at least 10 characters)
          </label>
          <input
            id={`guardian-reason-${link.id}`}
            className="ev-input"
            style={{ marginBottom: 14 }}
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="যেমন: সন্তান নিশ্চিত করেছে এবং তথ্য মিলেছে"
            maxLength={500}
          />
          {decision ? (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Button onClick={() => void doConfirm()} loading={busy} disabled={busy || !reasonOk}>
                {busy
                  ? strings.common.loading.bn
                  : decision === 'verified'
                    ? 'অনুমোদন নিশ্চিত করুন / Confirm approval'
                    : 'বাতিল নিশ্চিত করুন / Confirm rejection'}
              </Button>
              <Button variant="outline" onClick={() => setDecision(null)} disabled={busy}>
                বাতিল / Cancel
              </Button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Button onClick={() => setDecision('verified')}>
                অনুমোদন করুন / Approve
              </Button>
              <Button variant="outline" onClick={() => setDecision('rejected')}>
                বাতিল করুন / Reject
              </Button>
            </div>
          )}
          {!reasonOk && decision ? <p style={{ color: '#B00020' }}>কারণ কমপক্ষে ১০ অক্ষর হতে হবে।</p> : null}
        </>
      ) : null}
      {link.status === 'verified' ? (
        <p style={{ marginTop: 12 }}>
          {decision === 'revoked' ? (
            <>
              <Button onClick={() => void doConfirm()} loading={busy} disabled={busy}>
                {busy ? strings.common.loading.bn : 'বাতিল নিশ্চিত করুন / Confirm revoke'}
              </Button>{' '}
              <Button variant="outline" onClick={() => setDecision(null)} disabled={busy}>
                বাতিল / Cancel
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => setDecision('revoked')}>
              সংযোগ বাতিল করুন / Revoke link
            </Button>
          )}
        </p>
      ) : null}
      </Card>
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
      <p className="ev-muted-ivory">
        লিখিত তথ্য যাচাই করুন — অভিভাবকের নাম, সম্পর্ক, যোগাযোগ এবং সন্তানের তথ্য। কোনো কাগজপত্র, NID বা
        ফেস ভেরিফিকেশন লাগে না; সন্তান নিজে অ্যাপে নিশ্চিত করেছে কিনা সেটিই মূল প্রমাণ। / Cross-check the
        written information. No documents, NID or face verification — the child's own in-app confirmation is
        the key proof.
      </p>

      <h2 className="ev-section-h2">যাচাইয়ের অপেক্ষায় ({queue.length}) / Awaiting decision</h2>
      {links === null ? (
        <p>{strings.common.loading.bn}</p>
      ) : queue.length === 0 ? (
        <p className="ev-muted-ivory">কোনো অপেক্ষমাণ অনুরোধ নেই। / No pending requests.</p>
      ) : (
        <ul style={{ paddingLeft: 0 }}>
          {queue.map((l) => (
            <LinkCard key={l.id} link={l} actorUid={user.uid} onDone={() => setReload((r) => r + 1)} />
          ))}
        </ul>
      )}

      <h2 className="ev-section-h2">সক্রিয় সংযোগ ({verified.length}) / Active links</h2>
      {verified.length === 0 ? (
        <p className="ev-muted-ivory">কোনো সক্রিয় সংযোগ নেই। / No active links.</p>
      ) : (
        <ul style={{ paddingLeft: 0 }}>
          {verified.map((l) => (
            <LinkCard key={l.id} link={l} actorUid={user.uid} onDone={() => setReload((r) => r + 1)} />
          ))}
        </ul>
      )}

      {closed.length > 0 ? (
        <>
          <h2 className="ev-section-h2">বাতিলকৃত ({closed.length}) / Closed</h2>
          <div className="ev-dash-grid">
            {closed.map((l) => (
              <Card key={l.id}>
                <strong>{l.guardianDisplayName || '—'} → {l.childDisplayName}</strong>
                <p className="ev-muted" style={{ margin: '8px 0 0', fontSize: 14 }}>
                  {l.status}
                  {l.decisionReason ? ` — ${l.decisionReason}` : ''}
                </p>
              </Card>
            ))}
          </div>
        </>
      ) : null}
    </PageShell>
  );
}
