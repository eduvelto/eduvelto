import { useEffect, useMemo, useState } from 'react';
import { PageShell } from '../components/PageShell';
import {
  AdminBackLink,
  EmptyAdminBox,
  ErrorBox,
  LoadingBox,
  requireDb,
} from '../components/AdminShared';
import {
  auditActionLabel,
  formatBnNumber,
  formatTime,
  friendlyAdminError,
  listAdminActions,
  type AuditRow,
} from '../lib/admin';

const FILTERS = [
  'all',
  'user-suspend',
  'user-reactivate',
  'user-role-change',
  'teacher-verification-approved',
  'teacher-verification-rejected',
  'teacher-verification-revoked',
  'teacher-verification-reopened',
  'feature-enabled',
  'feature-disabled',
  'backup-exported',
  'user-profile-viewed',
  'support-thread-viewed',
] as const;

function dayKey(value: unknown): string {
  try {
    let d: Date | null = null;
    if (typeof value === 'object' && value !== null && 'toDate' in value) {
      d = (value as { toDate: () => Date }).toDate();
    } else if (value instanceof Date) {
      d = value;
    } else if (typeof value === 'string' || typeof value === 'number') {
      const t = new Date(value);
      d = Number.isNaN(t.getTime()) ? null : t;
    }
    if (!d) return 'অজানা তারিখ';
    return d.toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return 'অজানা তারিখ';
  }
}

export default function AdminAuditPage() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const list = await listAdminActions(requireDb());
        if (!cancelled) setRows(list);
      } catch (e) {
        if (!cancelled) setError(friendlyAdminError(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const shown = useMemo(
    () => (filter === 'all' ? rows : rows.filter((r) => r.action === filter)),
    [rows, filter],
  );

  const grouped = useMemo(() => {
    const groups = new Map<string, AuditRow[]>();
    for (const row of shown) {
      const key = dayKey(row.createdAt);
      const list = groups.get(key) ?? [];
      list.push(row);
      groups.set(key, list);
    }
    return [...groups.entries()];
  }, [shown]);

  function downloadJson(): void {
    const blob = new Blob([JSON.stringify(shown, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eduvelto-audit-log-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <PageShell titleBn="অডিট লগ" titleEn="Audit log">
      <AdminBackLink />
      <p>
        সব অ্যাডমিন কাজের লগ — কে, কী করলেন, কখন, আগে কী ছিল, পরে কী হলো, কেন। লগ কখনো মোছা বা
        বদলানো যায় না। / The log of all admin actions — who, what, when, before, after, why.
        Entries can never be edited or deleted.
      </p>
      <p style={{ color: '#555', fontSize: 14 }}>
        সর্বশেষ {formatBnNumber(100)}টি দেখানো হচ্ছে — তার আগের লগ দেখতে Firebase console-এ
        adminActions সংগ্রহ খুলুন। / Showing the latest 100 — for older entries, open the
        adminActions collection in the Firebase console.
      </p>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            style={{
              padding: '10px 14px',
              minHeight: 44,
              fontSize: 14,
              borderRadius: 999,
              border: 'none',
              background: filter === f ? '#0A1F44' : '#eee',
              color: filter === f ? '#fff' : '#0A1F44',
              cursor: 'pointer',
            }}
          >
            {f === 'all' ? 'সব / All' : auditActionLabel(f).bn}
          </button>
        ))}
      </div>
      <p style={{ color: '#555', fontSize: 14 }}>
        মোট {formatBnNumber(rows.length)}টি — দেখানো হচ্ছে {formatBnNumber(shown.length)}টি /
        Total {rows.length} — showing {shown.length}
      </p>

      {loading ? <LoadingBox /> : null}
      {error ? <ErrorBox message={error} /> : null}
      {!loading && shown.length === 0 ? (
        <EmptyAdminBox
          bn="এই ফিল্টারে কোনো লগ নেই।"
          en="No log entries for this filter."
          nextBn="ফিল্টার বদলে দেখুন, অথবা নতুন অ্যাডমিন কাজ করলে এখানে আসবে।"
        />
      ) : null}

      {grouped.map(([day, list]) => (
        <div key={day}>
          <h2 style={{ fontSize: 16, margin: '20px 0 8px', color: '#0A1F44' }}>{day}</h2>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {list.map((row) => {
              const label = auditActionLabel(row.action);
              return (
                <li
                  key={row.id}
                  style={{
                    border: '1px solid #eee',
                    borderRadius: 8,
                    padding: '10px 12px',
                    marginBottom: 8,
                  }}
                >
                  <strong>{label.bn}</strong>{' '}
                  <span style={{ color: '#555', fontSize: 14 }}>· {label.en}</span>
                  <p style={{ margin: '4px 0', fontSize: 15 }}>
                    {row.details ?? ''}
                  </p>
                  <p style={{ margin: '0 0 4px', color: '#555', fontSize: 14 }}>
                    {formatTime(row.createdAt)}
                    {row.before !== undefined || row.after !== undefined
                      ? ` · আগে: ${row.before ?? '—'} → পরে: ${row.after ?? '—'}`
                      : ''}
                  </p>
                  {row.reason ? (
                    <p style={{ margin: '0 0 4px', color: '#555', fontSize: 14 }}>
                      কারণ: {row.reason}
                    </p>
                  ) : null}
                  <p style={{ margin: 0, color: '#999', fontSize: 13 }}>
                    <span lang="en">{row.actorId.slice(0, 8)}…</span>
                    {row.targetId ? (
                      <>
                        {' · লক্ষ্য: '}
                        <span lang="en">{row.targetId.slice(0, 12)}…</span>
                      </>
                    ) : null}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      {shown.length > 0 ? (
        <button
          type="button"
          onClick={downloadJson}
          style={{
            marginTop: 12,
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
          এই লগ ডাউনলোড করুন (JSON) / Download this log (JSON)
        </button>
      ) : null}
    </PageShell>
  );
}
