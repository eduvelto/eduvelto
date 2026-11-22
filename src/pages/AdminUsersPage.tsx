import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { useLanguage } from '../i18n/LanguageContext';
import { Button, Card } from '../components/ui';
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

const ROLE_LABEL: Record<string, { bn: string; en: string }> = {
  owner: { bn: 'মালিক', en: 'Owner' },
  admin: { bn: 'অ্যাডমিন', en: 'Admin' },
  moderator: { bn: 'মডারেটর', en: 'Moderator' },
  teacher: { bn: 'শিক্ষক', en: 'Teacher' },
  student: { bn: 'শিক্ষার্থী', en: 'Student' },
  parent: { bn: 'অভিভাবক', en: 'Guardian' },
};

export default function AdminUsersPage() {
  const { lang, t } = useLanguage();
  const [searchParams] = useSearchParams();
  // The admin top-bar search links here with ?email=… — run that search
  // once on mount instead of showing the unfiltered list.
  const emailParam = searchParams.get('email') ?? '';
  const emailParamUsed = useRef(false);
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
      // The user LIST is the page: load it on its own. The total count is
      // loaded separately afterwards — count() is known to fail on live
      // Spark (RESOURCE_EXHAUSTED, audit H1) and must never blank the
      // list. Before this fix both were in one Promise.all, so a count
      // failure left the owner staring at "nobody found" with zero rows
      // even though listUsers() itself works.
      // With ?email= (admin top-bar search) the email search below loads
      // the rows instead — loading the full list here would race it.
      if (!emailParam) {
        try {
          const page = await listUsers(requireDb());
          if (!mounted.current) return;
          setRows(page.rows);
          setLastDoc(page.lastDoc);
          setHasMore(page.hasMore);
        } catch (e) {
          if (mounted.current) setError(friendlyAdminError(e, lang));
        } finally {
          if (mounted.current) setLoading(false);
        }
      } else {
        // Loading stays true until the email search below finishes.
      }
      try {
        const counts = await getDashboardCounts(requireDb());
        if (mounted.current) setTotal(counts.users);
      } catch {
        // Total stays null — the "of N" suffix hides, the list is intact.
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
      setError(friendlyAdminError(e, lang));
    } finally {
      setLoadingMore(false);
    }
  }

  async function onSearch(): Promise<void> {
    await runSearch(email.trim());
  }

  async function runSearch(q: string): Promise<void> {
    if (!q) return;
    setSearching(true);
    setError('');
    try {
      const found = await searchUsersByEmail(requireDb(), q);
      if (!mounted.current) return;
      setRows(found);
      setHasMore(false);
      setSearched(true);
    } catch (e) {
      if (mounted.current) setError(friendlyAdminError(e, lang));
    } finally {
      if (mounted.current) {
        setSearching(false);
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    if (emailParam && !emailParamUsed.current) {
      emailParamUsed.current = true;
      setEmail(emailParam);
      void runSearch(emailParam);
    }
    // Runs once on mount for the ?email= deep link.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      setError(friendlyAdminError(e, lang));
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell titleBn="ব্যবহারকারী" titleEn="Users">
      <AdminBackLink />
      <p>
        {t({
          bn: 'সব অ্যাকাউন্ট — নতুন আগে। একজনকে খুলে তার প্রোফাইল, মেসেজ ও রিপোর্ট দেখুন; স্থগিত করুন বা ভূমিকা বদলান।',
          en: 'All accounts — newest first. Open one to see their profile, messages and reports; suspend or change their role.',
        })}
      </p>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t({ bn: 'ইমেইল দিয়ে খুঁজুন', en: 'Search by exact email' })}
          aria-label={t({ bn: 'ইমেইল দিয়ে খুঁজুন', en: 'Search by email' })}
          className="ev-input"
          style={{ flex: '1 1 220px' }}
        />
        <Button
          onClick={() => void onSearch()}
          disabled={searching || email.trim() === ''}
          loading={searching}
        >
          {searching ? t({ bn: 'খুঁজছি…', en: 'Searching…' }) : t({ bn: 'খুঁজুন', en: 'Search' })}
        </Button>
        {searched ? (
          <Button variant="outline" onClick={() => void clearSearch()}>
            {t({ bn: 'সব দেখান', en: 'Show all' })}
          </Button>
        ) : null}
      </div>
      <p className="ev-muted-ivory" style={{ fontSize: 14, marginTop: 0 }}>
        {lang === 'bn'
          ? `${total !== null ? `মোট ${formatBnNumber(total)} জন — ` : ''}দেখানো হচ্ছে ${formatBnNumber(rows.length)} জন`
          : `Showing ${rows.length}${total !== null ? ` of ${total}` : ''}`}
      </p>

      {loading ? <LoadingBox /> : null}
      {error ? <ErrorBox message={error} /> : null}
      {!loading && rows.length === 0 ? (
        <EmptyAdminBox
          bn="কাউকে পাওয়া যায়নি।"
          en="Nobody found."
          nextBn="ইমেইল হুবহু মিলিয়ে লিখুন, অথবা তালিকা রিফ্রেশ করুন।"
          nextEn="Type the email exactly, or refresh the list."
        />
      ) : null}

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {rows.map((row) => (
          <li key={row.uid} style={{ marginBottom: 12 }}>
            <Card>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              <strong>{row.displayName}</strong>
              <StatusPill
                label={ROLE_LABEL[row.role] ? t(ROLE_LABEL[row.role]) : row.role}
                tone={row.role === 'owner' ? 'ready' : 'muted'}
              />
              {row.role === 'owner' ? (
                <span
                  style={{
                    background: '#D9A441',
                    color: 'var(--heading)',
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
                label={row.isActive ? t({ bn: 'সক্রিয়', en: 'Active' }) : t({ bn: 'স্থগিত', en: 'Suspended' })}
                tone={row.isActive ? 'active' : 'ready'}
              />
            </div>
            <p style={{ margin: '6px 0', color: 'var(--muted)', fontSize: 14 }}>
              <span lang="en">{row.email}</span>
              {row.institution ? ` · ${row.institution}` : ''}
              {row.classLevel ? ` · ${row.classLevel}` : ''}
              {row.verificationStatus ? ` · ${t({ bn: 'শিক্ষক যাচাই', en: 'Teacher verification' })}: ${row.verificationStatus}` : ''}
            </p>
            <p style={{ margin: '0 0 6px', color: 'var(--muted)', fontSize: 14 }}>
              {t({ bn: 'সদস্য', en: 'Member since' })}: {formatTime(row.createdAt, lang)}
            </p>
            <Link to={`/admin/users/${row.uid}`}>{t({ bn: 'প্রোফাইল খুলুন', en: 'Open profile' })} →</Link>
            </Card>
          </li>
        ))}
      </ul>
      {hasMore && !searched ? (
        <Button variant="outline" block onClick={() => void loadMore()} loading={loadingMore}>
          {loadingMore ? t({ bn: 'লোড হচ্ছে…', en: 'Loading…' }) : t({ bn: 'আরও দেখুন', en: 'Load more' })}
        </Button>
      ) : null}
    </PageShell>
  );
}
