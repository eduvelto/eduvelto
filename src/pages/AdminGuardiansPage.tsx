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
import { useLanguage } from '../i18n/LanguageContext';
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
  const { t } = useLanguage();
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
      setError(err instanceof Error ? err.message : t({ bn: 'সিদ্ধান্তটি সংরক্ষণ করা যায়নি।', en: 'Could not save the decision.' }));
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
        {t({ bn: 'সন্তান', en: 'Child' })}: {link.childDisplayName} ({link.childClassLevel}
        {link.childInstitution ? ` · ${link.childInstitution}` : ''})
      </p>
      <p style={{ margin: '0 0 6px', color: '#68747B', display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <StatusPill
          label={
            link.status === 'pending'
              ? t({ bn: 'অপেক্ষায়', en: 'Pending' })
              : link.status === 'confirmed'
                ? t({ bn: 'নিশ্চিত', en: 'Confirmed' })
                : link.status === 'verified'
                  ? t({ bn: 'ভেরিফায়েড', en: 'Verified' })
                  : link.status === 'rejected'
                    ? t({ bn: 'বাতিল', en: 'Rejected' })
                    : t({ bn: 'বাতিলকৃত', en: 'Revoked' })
          }
          tone={link.status === 'verified' ? 'active' : link.status === 'pending' || link.status === 'confirmed' ? 'ready' : 'muted'}
        />
        <span>
          {link.status === 'pending' ? ` — ${t({ bn: 'সন্তান এখনো নিশ্চিত করেনি', en: 'Child has not confirmed yet' })}` : ''}
          {link.status === 'confirmed' ? ` — ${t({ bn: 'সন্তান নিশ্চিত করেছে', en: 'Child confirmed' })}` : ''}
          {link.status === 'rejected' && link.decisionReason ? ` — ${t({ bn: 'কারণ', en: 'Reason' })}: ${link.decisionReason}` : ''}
        </span>
      </p>
      <p style={{ margin: '0 0 12px', color: '#68747B', fontSize: 13 }}>
        Eduvelto ID ({t({ bn: 'অভিভাবক', en: 'Guardian' })}): <code>{link.parentId}</code> · ({t({ bn: 'সন্তান', en: 'Child' })}): <code>{link.studentId}</code>
      </p>
      {error ? <p style={{ color: '#B00020' }}>{error}</p> : null}
      {decidable ? (
        <>
          <label className="ev-label" htmlFor={`guardian-reason-${link.id}`}>
            {t({ bn: 'সিদ্ধান্তের কারণ (কমপক্ষে ১০ অক্ষর)', en: 'Reason (at least 10 characters)' })}
          </label>
          <input
            id={`guardian-reason-${link.id}`}
            className="ev-input"
            style={{ marginBottom: 14 }}
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t({ bn: 'যেমন: সন্তান নিশ্চিত করেছে এবং তথ্য মিলেছে', en: 'e.g. Child confirmed and the information matches' })}
            maxLength={500}
          />
          {decision ? (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Button onClick={() => void doConfirm()} loading={busy} disabled={busy || !reasonOk}>
                {busy
                  ? t(strings.common.loading)
                  : decision === 'verified'
                    ? t({ bn: 'অনুমোদন নিশ্চিত করুন', en: 'Confirm approval' })
                    : t({ bn: 'বাতিল নিশ্চিত করুন', en: 'Confirm rejection' })}
              </Button>
              <Button variant="outline" onClick={() => setDecision(null)} disabled={busy}>
                {t({ bn: 'বাতিল', en: 'Cancel' })}
              </Button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Button onClick={() => setDecision('verified')}>
                {t({ bn: 'অনুমোদন করুন', en: 'Approve' })}
              </Button>
              <Button variant="outline" onClick={() => setDecision('rejected')}>
                {t({ bn: 'বাতিল করুন', en: 'Reject' })}
              </Button>
            </div>
          )}
          {!reasonOk && decision ? <p style={{ color: '#B00020' }}>{t({ bn: 'কারণ কমপক্ষে ১০ অক্ষর হতে হবে।', en: 'The reason must be at least 10 characters.' })}</p> : null}
        </>
      ) : null}
      {link.status === 'verified' ? (
        <p style={{ marginTop: 12 }}>
          {decision === 'revoked' ? (
            <>
              <Button onClick={() => void doConfirm()} loading={busy} disabled={busy}>
                {busy ? t(strings.common.loading) : t({ bn: 'বাতিল নিশ্চিত করুন', en: 'Confirm revoke' })}
              </Button>{' '}
              <Button variant="outline" onClick={() => setDecision(null)} disabled={busy}>
                {t({ bn: 'বাতিল', en: 'Cancel' })}
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => setDecision('revoked')}>
              {t({ bn: 'সংযোগ বাতিল করুন', en: 'Revoke link' })}
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
  const { t } = useLanguage();
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
        <p>{t(strings.admin.accessDenied)}</p>
        <p>
          <Link to="/admin">{t({ bn: 'অ্যাডমিন ড্যাশবোর্ডে ফিরে যান →', en: 'Back to admin dashboard →' })}</Link>
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
        <Link to="/admin">← {t({ bn: 'অ্যাডমিন ড্যাশবোর্ড', en: 'Admin dashboard' })}</Link>
      </p>
      <p className="ev-muted-ivory">
        {t({ bn: 'লিখিত তথ্য যাচাই করুন — অভিভাবকের নাম, সম্পর্ক, যোগাযোগ এবং সন্তানের তথ্য। কোনো কাগজপত্র, NID বা ফেস ভেরিফিকেশন লাগে না; সন্তান নিজে অ্যাপে নিশ্চিত করেছে কিনা সেটিই মূল প্রমাণ।', en: 'Cross-check the written information — guardian name, relationship, contact and the child’s information. No documents, NID or face verification — the child’s own in-app confirmation is the key proof.' })}
      </p>

      <h2 className="ev-section-h2">{t({ bn: 'যাচাইয়ের অপেক্ষায়', en: 'Awaiting decision' })} ({queue.length})</h2>
      {links === null ? (
        <p>{t(strings.common.loading)}</p>
      ) : queue.length === 0 ? (
        <p className="ev-muted-ivory">{t({ bn: 'কোনো অপেক্ষমাণ অনুরোধ নেই।', en: 'No pending requests.' })}</p>
      ) : (
        <ul style={{ paddingLeft: 0 }}>
          {queue.map((l) => (
            <LinkCard key={l.id} link={l} actorUid={user.uid} onDone={() => setReload((r) => r + 1)} />
          ))}
        </ul>
      )}

      <h2 className="ev-section-h2">{t({ bn: 'সক্রিয় সংযোগ', en: 'Active links' })} ({verified.length})</h2>
      {verified.length === 0 ? (
        <p className="ev-muted-ivory">{t({ bn: 'কোনো সক্রিয় সংযোগ নেই।', en: 'No active links.' })}</p>
      ) : (
        <ul style={{ paddingLeft: 0 }}>
          {verified.map((l) => (
            <LinkCard key={l.id} link={l} actorUid={user.uid} onDone={() => setReload((r) => r + 1)} />
          ))}
        </ul>
      )}

      {closed.length > 0 ? (
        <>
          <h2 className="ev-section-h2">{t({ bn: 'বাতিলকৃত', en: 'Closed' })} ({closed.length})</h2>
          <div className="ev-dash-grid">
            {closed.map((l) => (
              <Card key={l.id}>
                <strong>{l.guardianDisplayName || '—'} → {l.childDisplayName}</strong>
                <p className="ev-muted" style={{ margin: '8px 0 0', fontSize: 14 }}>
                  {l.status === 'rejected' ? t({ bn: 'বাতিল', en: 'Rejected' }) : t({ bn: 'বাতিলকৃত', en: 'Revoked' })}
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
