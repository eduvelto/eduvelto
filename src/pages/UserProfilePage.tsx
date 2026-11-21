// Eduvelto — public profile view (DM directory).
//
// Shows ONLY the public mirror (displayName, role, institution,
// classLevel). Email, phone and date of birth are never shown here —
// they are not in publicProfiles at all.

import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PageShell, EmptyState } from '../components/PageShell';
import { strings } from '../i18n/strings';
import { useAuth } from '../lib/auth';
import { db, isFirebaseConfigured } from '../firebase';
import {
  blockUser,
  createDmThread,
  getMyBlocks,
  getPublicProfile,
  reportMessage,
  sendFriendRequest,
  unblockUser,
  type PublicProfile,
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

const smallButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  padding: '8px 12px',
  fontSize: 14,
};

export default function UserProfilePage() {
  const { uid = '' } = useParams();
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [target, setTarget] = useState<PublicProfile | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [reportReason, setReportReason] = useState('abuse');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSent, setReportSent] = useState(false);

  const isMe = user?.uid === uid;
  const hasDob = !!profile?.dateOfBirth;

  useEffect(() => {
    if (!db || !uid) return;
    let cancelled = false;
    void (async () => {
      const p = await getPublicProfile(db!, uid);
      if (cancelled) return;
      if (!p) setNotFound(true);
      else setTarget(p);
      if (user) {
        const blocks = await getMyBlocks(db!, user.uid);
        if (!cancelled) setIsBlocked(blocks.includes(uid));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [uid, user]);

  if (loading) {
    return (
      <PageShell titleBn="প্রোফাইল" titleEn="Profile">
        <p>{strings.common.loading.bn}</p>
      </PageShell>
    );
  }
  if (!isFirebaseConfigured || !db || !user) {
    return (
      <PageShell titleBn="প্রোফাইল" titleEn="Profile">
        <EmptyState bn={strings.profile.notSignedIn.bn} en={strings.profile.notSignedIn.en} />
      </PageShell>
    );
  }
  if (isMe) {
    return (
      <PageShell titleBn="প্রোফাইল" titleEn="Profile">
        <p>
          এটি আপনার নিজের প্রোফাইল। <Link to="/profile">আপনার প্রোফাইল দেখুন / Go to your profile</Link>
        </p>
      </PageShell>
    );
  }
  if (notFound) {
    return (
      <PageShell titleBn="প্রোফাইল" titleEn="Profile">
        <EmptyState bn="এই ব্যবহারকারীকে পাওয়া যায়নি।" en="This user was not found." />
      </PageShell>
    );
  }
  if (!target) {
    return (
      <PageShell titleBn="প্রোফাইল" titleEn="Profile">
        <p>{strings.common.loading.bn}</p>
      </PageShell>
    );
  }

  async function onMessage() {
    if (!hasDob) {
      setNotice(strings.messaging.dobGate.bn);
      return;
    }
    setBusy(true);
    setNotice('');
    try {
      const thread = await createDmThread(db!, user!.uid, uid);
      navigate(`/messages/${thread.id}`);
    } catch (e) {
      setNotice(friendlyErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function onFriendRequest() {
    setBusy(true);
    setNotice('');
    try {
      await sendFriendRequest(db!, user!.uid, uid);
      setNotice(strings.messaging.friendRequestSent.bn);
    } catch (e) {
      setNotice(friendlyErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function onBlockToggle() {
    setBusy(true);
    setNotice('');
    try {
      if (isBlocked) {
        await unblockUser(db!, user!.uid, uid);
        setIsBlocked(false);
      } else {
        await blockUser(db!, user!.uid, uid);
        setIsBlocked(true);
      }
    } catch (e) {
      setNotice(friendlyErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function onReport(e: FormEvent) {
    e.preventDefault();
    try {
      await reportMessage(db!, user!.uid, {
        targetType: 'user',
        targetId: uid,
        targetAuthorId: uid,
        reason: reportReason as 'spam' | 'abuse' | 'copyright' | 'personal-info' | 'other',
        details: reportDetails,
      });
      setReportSent(true);
    } catch (err) {
      setNotice(friendlyErrorMessage(err));
    }
  }

  return (
    <PageShell titleBn={target.displayName} titleEn={target.role}>
      <p>
        <strong>{strings.profile.role.bn}:</strong> {target.role}
      </p>
      {target.institution ? (
        <p>
          <strong>{strings.profile.institution.bn}:</strong> {target.institution}
        </p>
      ) : null}
      {target.classLevel ? (
        <p>
          <strong>{strings.profile.classLevel.bn}:</strong> {target.classLevel}
        </p>
      ) : null}
      <p style={{ color: '#555', fontSize: 14 }}>{strings.messaging.searchHint.bn}</p>

      {notice ? <p style={{ color: '#b00020' }}>{notice}</p> : null}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
        <button type="button" onClick={() => void onMessage()} disabled={busy || !hasDob || profile?.dmSuspended === true} style={buttonStyle}>
          {strings.messaging.messageUser.bn}
        </button>
        <button
          type="button"
          onClick={() => void onFriendRequest()}
          disabled={busy}
          style={{ ...buttonStyle, background: '#fff', color: '#0A1F44', border: '1px solid #0A1F44' }}
        >
          {strings.messaging.friendRequest.bn}
        </button>
        <button
          type="button"
          onClick={() => void onBlockToggle()}
          disabled={busy}
          style={{ ...buttonStyle, background: '#fff', color: '#b00020', border: '1px solid #b00020' }}
        >
          {isBlocked ? strings.messaging.unblock.bn : strings.messaging.block.bn}
        </button>
      </div>
      {!hasDob ? (
        <p style={{ marginTop: 12 }}>
          <Link to="/profile">{strings.messaging.dobGateButton.bn}</Link>
        </p>
      ) : null}

      {reportSent ? (
        <p style={{ color: '#0A1F44', marginTop: 16 }}>{strings.messaging.reportSent.bn}</p>
      ) : (
        <form onSubmit={onReport} style={{ marginTop: 24, borderTop: '1px solid #ddd', paddingTop: 16 }}>
          <h2 style={{ fontSize: 18 }}>{strings.messaging.report.bn}</h2>
          <select
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            aria-label={strings.messaging.reportReason.bn}
            style={{ display: 'block', width: '100%', boxSizing: 'border-box', padding: '10px 12px', margin: '6px 0 14px', fontSize: 16, border: '1px solid #aaa', borderRadius: 6 }}
          >
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
            style={{ display: 'block', width: '100%', boxSizing: 'border-box', padding: '10px 12px', margin: '6px 0 14px', fontSize: 16, border: '1px solid #aaa', borderRadius: 6 }}
          />
          <button type="submit" style={smallButtonStyle}>
            {strings.messaging.report.bn}
          </button>
        </form>
      )}
    </PageShell>
  );
}
