import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import {
  AdminBackLink,
  EmptyAdminBox,
  ErrorBox,
  LoadingBox,
  StatusPill,
  requireDb,
} from '../components/AdminShared';
import {
  formatBnNumber,
  formatTime,
  friendlyAdminError,
  getDashboardCounts,
  listUsers,
  searchUsersByEmail,
  type AdminUserRow,
} from '../lib/admin';
import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';

const ROLE_LABEL: Record<string, string> = {
  owner: 'মালিক',
  admin: 'অ্যাডমিন',
  moderator: 'মডারেটর',
  teacher: 'শিক্ষক',
  student: 'শিক্ষার্থী',
  parent: 'অভিভাবক',
};

export default function AdminUsersPage() {
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    void (async () => {
      try {
        const [page, counts] = await Promise.all([listUsers(requireDb()), getDashboardCounts(requireDb())]);
        if (!mounted.current) return;
        setRows(page.rows);
        setLastDoc(page.lastDoc);
        setHasMore(page.hasMore);
        setTotal(counts.users);
      } catch (e) {
        if (mounted.current) setError(friendlyAdminError(e));
      } finally {
        if (mounted.current) setLoading(false);
      }
    })();
    return () => {
      mounted.current = false;
    };
  }, []);

  async function loadMore(): Promise<void> {
    if (!lastDoc) return;
    setLoadingMore(true);
    setError('');
    try {
      const page = await listUsers(requireDb(), lastDoc);
      setRows((prev) => [...prev, ...page.rows]);
      setLastDoc(page.lastDoc);
      setHasMore(page.hasMore);
    } catch (e) {
      setError(friendlyAdminError(e));
    } finally {
      setLoadingMore(false);
    }
  }

  async function onSearch(): Promise<void> {
    const q = email.trim();
    if (!q) return;
    setSearching(true);
    setError('');
    try {
      const found = await searchUsersByEmail(requireDb(), q);
      setRows(found);
      setHasMore(false);
      setSearched(true);
    } catch (e) {
      setError(friendlyAdminError(e));
    } finally {
      setSearching(false);
    }
  }

  async function clearSearch(): Promise<void> {
    setEmail('');
    setSearched(false);
    setLoading(true);
    setError('');
    try {
      const page = await listUsers(requireDb());
      setRows(page.rows);
      setLastDoc(page.lastDoc);
      setHasMore(page.hasMore);
    } catch (e) {
      setError(friendlyAdminError(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell titleBn="ব্যবহারকারী" titleEn="Users">
      <AdminBackLink />
      <p>
        সব অ্যাকাউন্ট — নতুন আগে। একজনকে খুলে তার প্রোফাইল, মেসেজ ও রিপোর্ট দেখুন; স্থগিত করুন বা
        ভূমিকা বদলান। / All accounts — newest first. Open one to see their profile, messages and
        reports; suspend or change their role.
      </p>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ইমেইল দিয়ে খুঁজুন — search by exact email"
          aria-label="ইমেইল দিয়ে খুঁজুন"
          style={{
            flex: '1 1 220px',
            padding: '12px 10px',
            minHeight: 48,
            fontSize: 16,
            borderRadius: 8,
            border: '1px solid #888',
          }}
        />
        <button
          type="button"
          onClick={() => void onSearch()}
          disabled={searching || email.trim() === ''}
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
          {searching ? 'খুঁজছি…' : 'খুঁজুন / Search'}
        </button>
        {searched ? (
          <button
            type="button"
            onClick={() => void clearSearch()}
            style={{
              padding: '12px 20px',
              minHeight: 48,
              fontSize: 16,
              borderRadius: 8,
              border: '1px solid #0A1F44',
              background: '#fff',
              color: '#0A1F44',
              cursor: 'pointer',
            }}
          >
            সব দেখান / Show all
          </button>
        ) : null}
      </div>
      <p style={{ color: '#555', fontSize: 14, marginTop: 0 }}>
        {total !== null ? `মোট ${formatBnNumber(total)} জন — ` : ''}দেখানো হচ্ছে{' '}
        {formatBnNumber(rows.length)} জন / Showing {rows.length}
        {total !== null ? ` of ${total}` : ''}
      </p>

      {loading ? <LoadingBox /> : null}
      {error ? <ErrorBox message={error} /> : null}
      {!loading && rows.length === 0 ? (
        <EmptyAdminBox
          bn="কাউকে পাওয়া যায়নি।"
          en="Nobody found."
          nextBn="ইমেইল হুবহু মিলিয়ে লিখুন, অথবা তালিকা রিফ্রেশ করুন।"
        />
      ) : null}

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {rows.map((row) => (
          <li
            key={row.uid}
            style={{
              border: '1px solid #ddd',
              borderRadius: 8,
              padding: '12px 14px',
              marginBottom: 8,
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              <strong>{row.displayName}</strong>
              <StatusPill
                label={ROLE_LABEL[row.role] ?? row.role}
                tone={row.role === 'owner' ? 'ready' : 'muted'}
              />
              {row.role === 'owner' ? (
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
              <StatusPill
                label={row.isActive ? 'সক্রিয় / Active' : 'স্থগিত / Suspended'}
                tone={row.isActive ? 'active' : 'ready'}
              />
            </div>
            <p style={{ margin: '6px 0', color: '#555', fontSize: 14 }}>
              <span lang="en">{row.email}</span>
              {row.institution ? ` · ${row.institution}` : ''}
              {row.classLevel ? ` · ${row.classLevel}` : ''}
              {row.verificationStatus ? ` · শিক্ষক যাচাই: ${row.verificationStatus}` : ''}
            </p>
            <p style={{ margin: '0 0 6px', color: '#555', fontSize: 14 }}>
              সদস্য: {formatTime(row.createdAt)}
            </p>
            <Link to={`/admin/users/${row.uid}`}>প্রোফাইল খুলুন / Open profile →</Link>
          </li>
        ))}
      </ul>
      {hasMore && !searched ? (
        <button
          type="button"
          onClick={() => void loadMore()}
          disabled={loadingMore}
          style={{
            padding: '12px 20px',
            minHeight: 48,
            fontSize: 16,
            borderRadius: 8,
            border: '1px solid #0A1F44',
            background: '#fff',
            color: '#0A1F44',
            cursor: 'pointer',
            width: '100%',
          }}
        >
          {loadingMore ? 'লোড হচ্ছে…' : 'আরও দেখুন / Load more'}
        </button>
      ) : null}
    </PageShell>
  );
}
