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
import { Link, useLocation } from 'react-router-dom';
import { loginState } from '../lib/loginReturn';
import { db } from '../firebase';
import { PageShell } from '../components/PageShell';
import { strings } from '../i18n/strings';
import { useAuth } from '../lib/auth';
import { T, useLanguage } from '../i18n/LanguageContext';
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
  background: 'var(--card)',
  color: 'var(--ink)',
  border: '1px solid var(--line-strong)',
};

const STATUS: Record<ParentLink['status'], { bn: string; en: string }> = {
  pending: { bn: 'আপনার নিশ্চিতকরণের অপেক্ষায়', en: 'Waiting for your confirmation' },
  confirmed: { bn: 'অ্যাডমিন যাচাইয়ের অপেক্ষায়', en: 'Waiting for admin verification' },
  verified: { bn: 'সক্রিয়', en: 'Active' },
  rejected: { bn: 'অ্যাডমিন বাতিল করেছেন', en: 'Rejected by admin' },
  revoked: { bn: 'বাতিল হয়েছে', en: 'Revoked' },
};

export default function GuardianLinksPage() {
  const { user, profile, loading } = useAuth();
  const location = useLocation();
  // Sections audit (24 Nov 2026): return here after sign-in.
  const back = loginState(location.pathname + location.search);
  const { t } = useLanguage();
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
        <p>{t(strings.common.loading)}</p>
      </PageShell>
    );
  }

  if (!user || !profile) {
    return (
      <PageShell titleBn={d.linkConfirmTitle.bn} titleEn={d.linkConfirmTitle.en}>
        <p>{t(strings.profile.notSignedIn)}</p>
        <p>
          <Link to="/login" state={back}>{t(strings.auth.loginTitle)}</Link>
        </p>
      </PageShell>
    );
  }

  if (profile.role !== 'student') {
    return (
      <PageShell titleBn={d.linkConfirmTitle.bn} titleEn={d.linkConfirmTitle.en}>
        <p>{t({ bn: 'এই পাতাটি শুধু শিক্ষার্থীদের জন্য।', en: 'This page is for students only.' })}</p>
        <p>
          <Link to="/dashboard">{t({ bn: 'আপনার ড্যাশবোর্ডে যান →', en: 'Go to your dashboard →' })}</Link>
        </p>
      </PageShell>
    );
  }

  // `user` is narrowed non-null by the guards above; capture the uid
  // once so the `act` closure below never sees a possibly-null user.
  const uid = user.uid;

  async function act(linkId: string, fn: (db2: NonNullable<typeof db>, id: string, uid: string) => Promise<void>, next: ParentLink['status']): Promise<void> {
    if (!db) return;
    setBusy(linkId);
    setError(null);
    try {
      await fn(db, linkId, uid);
      setLinks((ls) => (ls ?? []).map((l) => (l.id === linkId ? { ...l, status: next } : l)));
    } catch (err) {
      setError(err instanceof Error ? err.message : t({ bn: 'কাজটি করা যায়নি।', en: 'Could not complete this action.' }));
    } finally {
      setBusy(null);
    }
  }

  const pending = (links ?? []).filter((l) => l.status === 'pending');
  const active = (links ?? []).filter((l) => l.status === 'confirmed' || l.status === 'verified');
  const closed = (links ?? []).filter((l) => l.status === 'rejected' || l.status === 'revoked');

  return (
    <PageShell titleBn={d.linkConfirmTitle.bn} titleEn={d.linkConfirmTitle.en}>
      <p style={{ color: 'var(--ink-soft)' }}>
        {t({
          bn: 'একজন অভিভাবক আপনার সাথে সংযোগ চাইছেন — নিশ্চিত করলে তিনি আপনার অগ্রগতি দেখতে পারবেন, আপনার মেসেজ নয়।',
          en: 'A guardian is asking to link with you — confirming lets them see your progress, never your messages.',
        })}
      </p>

      {error ? <p style={{ color: 'var(--error)' }}>{error}</p> : null}

      <h2 style={{ fontSize: 19 }}>{t({ bn: 'নতুন অনুরোধ', en: 'New requests' })}</h2>
      {links === null ? (
        <p>{t(strings.common.loading)}</p>
      ) : pending.length === 0 ? (
        <p style={{ color: 'var(--ink-soft)' }}>{t({ bn: 'কোনো নতুন অনুরোধ নেই।', en: 'No new requests.' })}</p>
      ) : (
        <ul style={{ paddingLeft: 0, listStyle: 'none' }}>
          {pending.map((l) => (
            <li key={l.id} style={{ border: '1px solid var(--line-strong)', borderRadius: 8, padding: 16, marginBottom: 12 }}>
              <p style={{ margin: '0 0 6px', fontSize: 18 }}>
                <strong>{l.guardianDisplayName || '—'}</strong>
                {l.relationship ? ` · ${l.relationship}` : ''}
              </p>
              <p style={{ margin: '0 0 6px', color: 'var(--ink-soft)' }}>
                {l.guardianContact ? t({ bn: `যোগাযোগ: ${l.guardianContact} · `, en: `Contact: ${l.guardianContact} · ` }) : ''}
                {t({
                  bn: `আপনার নাম হিসেবে লিখেছেন: ${l.childDisplayName} (${l.childClassLevel}${l.childInstitution ? ` · ${l.childInstitution}` : ''})`,
                  en: `They entered your name as: ${l.childDisplayName} (${l.childClassLevel}${l.childInstitution ? ` · ${l.childInstitution}` : ''})`,
                })}
              </p>
              <p style={{ margin: '0 0 12px', color: 'var(--ink-soft)' }}>{t(d.confirmLinkNote)}</p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button
                  style={buttonStyle}
                  type="button"
                  disabled={busy === l.id}
                  onClick={() => void act(l.id, confirmParentLink, 'confirmed')}
                >
                  {busy === l.id ? <T bn={strings.common.loading.bn} en={strings.common.loading.en} /> : <T bn="হ্যাঁ, এনি আমার অভিভাবক" en="Yes, this is my guardian" />}
                </button>
                <button
                  style={secondaryStyle}
                  type="button"
                  disabled={busy === l.id}
                  onClick={() => void act(l.id, rejectParentLink, 'revoked')}
                >
                  <T bn={d.rejectLink.bn} en={d.rejectLink.en} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <h2 style={{ fontSize: 19 }}>{t({ bn: 'সক্রিয় সংযোগ', en: 'Active links' })}</h2>
      {active.length === 0 ? (
        <p style={{ color: 'var(--ink-soft)' }}>{t({ bn: 'কোনো সক্রিয় সংযোগ নেই।', en: 'No active links.' })}</p>
      ) : (
        <ul style={{ paddingLeft: 20 }}>
          {active.map((l) => (
            <li key={l.id} style={{ marginBottom: 12 }}>
              {l.guardianDisplayName || '—'} ({l.relationship || '—'}) — {t(STATUS[l.status])}
              {l.status === 'verified' ? (
                <button
                  style={{ ...secondaryStyle, padding: '6px 12px', marginLeft: 8 }}
                  type="button"
                  disabled={busy === l.id}
                  onClick={() => void act(l.id, revokeParentLink, 'revoked')}
                >
                  {busy === l.id ? <T bn={strings.common.loading.bn} en={strings.common.loading.en} /> : <T bn={d.revokeLink.bn} en={d.revokeLink.en} />}
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {closed.length > 0 ? (
        <>
          <h2 style={{ fontSize: 19 }}>{t({ bn: 'পূর্বের অনুরোধ', en: 'Past requests' })}</h2>
          <ul style={{ paddingLeft: 20 }}>
            {closed.map((l) => (
              <li key={l.id}>
                {l.guardianDisplayName || '—'} ({l.relationship || '—'}) — {t(STATUS[l.status])}
                {l.status === 'rejected' && l.decisionReason ? t({ bn: ` — কারণ: ${l.decisionReason}`, en: ` — reason: ${l.decisionReason}` }) : ''}
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <p style={{ marginTop: 24 }}>
        <Link to="/profile">{t({ bn: '← প্রোফাইলে ফিরে যান', en: '← Back to profile' })}</Link>
      </p>
    </PageShell>
  );
}
