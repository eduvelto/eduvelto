// Eduvelto — educational groups (admin-created, member-only).
//
// No unrestricted public social/posting: groups are created by
// moderators/admins only, membership is approved, and group messages
// are member-only (moderators may read for safety — unlike private
// DMs, groups are moderated spaces).

import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { PageShell, EmptyState } from '../components/PageShell';
import { strings } from '../i18n/strings';
import { useAuth } from '../lib/auth';
import { db, isFirebaseConfigured } from '../firebase';
import {
  createGroup,
  listGroups,
  listMyGroups,
  requestJoinGroup,
  type StudyGroup,
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

export default function GroupsPage() {
  const { user, profile, loading } = useAuth();
  const [myGroups, setMyGroups] = useState<{ group: StudyGroup }[]>([]);
  const [allGroups, setAllGroups] = useState<StudyGroup[]>([]);
  const [requested, setRequested] = useState<string[]>([]);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [busy, setBusy] = useState(false);

  const canCreate = profile?.role === 'moderator' || profile?.role === 'admin' || profile?.role === 'owner';
  const myIds = new Set(myGroups.map((m) => m.group.id));

  useEffect(() => {
    if (!db || !user) return;
    let cancelled = false;
    void (async () => {
      try {
        const [mine, all] = await Promise.all([listMyGroups(db!, user.uid), listGroups(db!)]);
        if (cancelled) return;
        setMyGroups(mine.map((m) => ({ group: m.group })));
        setAllGroups(all);
      } catch (e) {
        if (!cancelled) setError(friendlyErrorMessage(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (loading) {
    return (
      <PageShell titleBn={strings.groups.title.bn} titleEn={strings.groups.title.en}>
        <p>{strings.common.loading.bn}</p>
      </PageShell>
    );
  }
  if (!isFirebaseConfigured || !db || !user) {
    return (
      <PageShell titleBn={strings.groups.title.bn} titleEn={strings.groups.title.en}>
        <EmptyState bn={strings.profile.notSignedIn.bn} en={strings.profile.notSignedIn.en} />
      </PageShell>
    );
  }

  async function onJoin(groupId: string) {
    setBusy(true);
    setNotice('');
    try {
      await requestJoinGroup(db!, groupId, user!.uid);
      setRequested((prev) => [...prev, groupId]);
      setNotice(strings.groups.joinRequested.bn);
    } catch (e) {
      setNotice(friendlyErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    const name = groupName.trim();
    if (name.length < 3) {
      setNotice('গ্রুপের নাম কমপক্ষে ৩ অক্ষরের হতে হবে। / Group name must be at least 3 characters.');
      return;
    }
    setBusy(true);
    setNotice('');
    try {
      const id = await createGroup(db!, name, groupDesc, user!.uid);
      setGroupName('');
      setGroupDesc('');
      const all = await listGroups(db!);
      setAllGroups(all);
      setNotice(`${strings.groups.created.bn} (${id})`);
    } catch (err) {
      setNotice(friendlyErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const discover = allGroups.filter((g) => !myIds.has(g.id));

  return (
    <PageShell titleBn={strings.groups.title.bn} titleEn={strings.groups.title.en}>
      {error ? <p style={{ color: '#b00020' }}>{error}</p> : null}
      {notice ? <p style={{ color: '#0A1F44' }}>{notice}</p> : null}

      <h2 style={{ fontSize: 20 }}>{strings.groups.myGroups.bn}</h2>
      {myGroups.length === 0 ? (
        <EmptyState bn={strings.groups.noGroups.bn} en={strings.groups.noGroups.en} />
      ) : (
        <ul style={{ padding: 0, listStyle: 'none' }}>
          {myGroups.map(({ group }) => (
            <li key={group.id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: '12px 14px', marginBottom: 10 }}>
              <Link to={`/groups/${group.id}`} style={{ color: '#0A1F44', fontWeight: 700, textDecoration: 'none' }}>
                {group.name}
              </Link>
              <div style={{ color: '#555', fontSize: 14, marginTop: 4 }}>{group.description}</div>
            </li>
          ))}
        </ul>
      )}

      <h2 style={{ fontSize: 20 }}>{strings.groups.discover.bn}</h2>
      {discover.length === 0 ? (
        <EmptyState bn={strings.groups.noGroupsFound.bn} en={strings.groups.noGroupsFound.en} />
      ) : (
        <ul style={{ padding: 0, listStyle: 'none' }}>
          {discover.map((g) => (
            <li key={g.id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: '12px 14px', marginBottom: 10 }}>
              <strong>{g.name}</strong>
              <div style={{ color: '#555', fontSize: 14, marginTop: 4 }}>{g.description}</div>
              <button
                type="button"
                onClick={() => void onJoin(g.id)}
                disabled={busy || requested.includes(g.id)}
                style={{ ...smallButtonStyle, marginTop: 10 }}
              >
                {requested.includes(g.id) ? strings.groups.pending.bn : strings.groups.requestJoin.bn}
              </button>
            </li>
          ))}
        </ul>
      )}

      {canCreate ? (
        <form onSubmit={onCreate} style={{ marginTop: 24, borderTop: '1px solid #ddd', paddingTop: 16 }}>
          <h2 style={{ fontSize: 20 }}>{strings.groups.createGroup.bn}</h2>
          <label htmlFor="group-name">{strings.groups.groupName.bn}</label>
          <input id="group-name" type="text" value={groupName} onChange={(e) => setGroupName(e.target.value)} maxLength={100} style={inputStyle} />
          <label htmlFor="group-desc">{strings.groups.groupDescription.bn}</label>
          <textarea id="group-desc" value={groupDesc} onChange={(e) => setGroupDesc(e.target.value)} maxLength={500} rows={3} style={inputStyle} />
          <button type="submit" disabled={busy} style={buttonStyle}>
            {strings.groups.createGroup.bn}
          </button>
        </form>
      ) : null}

      <p style={{ color: '#555', fontSize: 14, marginTop: 24 }}>{strings.groups.membersOnly.bn}</p>
      <p style={{ color: '#555', fontSize: 14 }}>{strings.groups.membersOnly.en}</p>
    </PageShell>
  );
}
