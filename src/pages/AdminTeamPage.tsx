import { useEffect, useMemo, useState } from 'react';
import { PageShell } from '../components/PageShell';
import {
  AdminBackLink,
  BLUE,
  ConfirmDialog,
  EmptyAdminBox,
  ErrorBox,
  GOLD,
  LoadingBox,
  NAVY,
  requireDb,
  StatusPill,
} from '../components/AdminShared';
import {
  auditActionLabel,
  formatBnNumber,
  formatTime,
  friendlyAdminError,
  listAdminActions,
  type AdminUserRow,
  type AuditRow,
} from '../lib/admin';
import {
  assignAdmin,
  assignmentStatus,
  findUserByEmail,
  getMyMfaFactors,
  listAdminAssignments,
  PERMISSION_LABELS,
  removeAdmin,
  revokeAllDelegatedAccess,
  SECTOR_LABELS,
  SECTOR_PERMISSIONS,
  setAdminSuspended,
  TEAM_AUDIT_ACTIONS,
  TEAM_SECTORS,
  updateAdminPermissions,
  validateSectors,
  type AdminAssignment,
  type SectorMap,
  type TeamPermission,
  type TeamSectorId,
} from '../lib/adminTeam';

// Admin Management Dashboard — /admin/team (OWNER ONLY via AdminGuard).
//
// The owner assigns trusted people to management sectors with per-sector
// permissions. Enforcement is in firestore.rules (adminAssignments is
// owner-UID-writable only; sector powers need a live assignment + an MFA
// session). This page is the control surface — it cannot grant anything
// the rules forbid, and it cannot touch the Owner account, production,
// billing, domain/DNS, or the rules themselves (console-only).

function emptySectors(): SectorMap {
  return {};
}

function SectorPermEditor(props: {
  sectors: SectorMap;
  onChange: (next: SectorMap) => void;
  disabled?: boolean;
}) {
  const { sectors, onChange, disabled } = props;
  const toggleSector = (sector: TeamSectorId) => {
    const next: SectorMap = { ...sectors };
    if (sector in next) {
      delete next[sector];
    } else {
      next[sector] = ['view'];
    }
    onChange(next);
  };
  const togglePerm = (sector: TeamSectorId, perm: TeamPermission) => {
    const current = sectors[sector] ?? [];
    const next: SectorMap = { ...sectors };
    next[sector] = current.includes(perm)
      ? current.filter((p) => p !== perm)
      : [...current, perm];
    onChange(next);
  };
  return (
    <div>
      {TEAM_SECTORS.map((sector) => {
        const included = sector in sectors;
        return (
          <fieldset
            key={sector}
            style={{ border: '1px solid #ddd', borderRadius: 8, margin: '8px 0', padding: '10px 12px' }}
          >
            <legend style={{ padding: '0 6px', fontWeight: 700, color: NAVY }}>
              <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={included}
                  disabled={disabled}
                  onChange={() => toggleSector(sector)}
                />
                {SECTOR_LABELS[sector].bn} / {SECTOR_LABELS[sector].en}
              </label>
            </legend>
            {included ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px' }}>
                {SECTOR_PERMISSIONS[sector].map((perm) => (
                  <label key={perm} style={{ display: 'flex', gap: 6, alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={(sectors[sector] ?? []).includes(perm)}
                      disabled={disabled}
                      onChange={() => togglePerm(sector, perm)}
                    />
                    {PERMISSION_LABELS[perm].bn} ({PERMISSION_LABELS[perm].en})
                  </label>
                ))}
              </div>
            ) : (
              <p style={{ margin: '4px 0 0', color: '#777', fontSize: 14 }}>
                এই সেক্টরের দায়িত্ব দেওয়া হয়নি। / Not assigned.
              </p>
            )}
          </fieldset>
        );
      })}
      <p style={{ margin: '8px 0 0', color: '#555', fontSize: 14 }}>
        শুধু দেখানো অনুমতিগুলোই দেওয়া যায় — প্রতিটি সেক্টরে যা প্রযোজ্য তাই।
        / Only the permissions shown can be granted — what applies to each sector.
      </p>
    </div>
  );
}

export default function AdminTeamPage() {
  const [rows, setRows] = useState<AdminAssignment[]>([]);
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [myMfa, setMyMfa] = useState<string[]>([]);

  // Add-admin form
  const [email, setEmail] = useState('');
  const [found, setFound] = useState<AdminUserRow[] | null>(null);
  const [picked, setPicked] = useState<AdminUserRow | null>(null);
  const [sectors, setSectors] = useState<SectorMap>(emptySectors());
  const [temporary, setTemporary] = useState(false);
  const [expiry, setExpiry] = useState('');
  const [note, setNote] = useState('');
  const [reason, setReason] = useState('');
  const [confirmAssign, setConfirmAssign] = useState(false);

  // Row actions
  const [editing, setEditing] = useState<AdminAssignment | null>(null);
  const [editSectors, setEditSectors] = useState<SectorMap>(emptySectors());
  const [editReason, setEditReason] = useState('');
  const [acting, setActing] = useState<{ row: AdminAssignment; kind: 'suspend' | 'reactivate' | 'remove' } | null>(null);
  const [actReason, setActReason] = useState('');
  const [confirmRevokeAll, setConfirmRevokeAll] = useState(false);
  const [revokeReason, setRevokeReason] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [assigns, allAudit] = await Promise.all([
        listAdminAssignments(requireDb()),
        listAdminActions(requireDb()),
      ]);
      setRows(assigns);
      const wanted = new Set<string>(TEAM_AUDIT_ACTIONS as unknown as string[]);
      setAudit(allAudit.filter((r) => wanted.has(r.action)));
      setMyMfa(getMyMfaFactors());
    } catch (e) {
      setError(friendlyAdminError(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Last activity per admin: latest audit row (any action) by that actor.
  const [allAudit, setAllAudit] = useState<AuditRow[]>([]);
  useEffect(() => {
    void (async () => {
      try {
        setAllAudit(await listAdminActions(requireDb()));
      } catch {
        /* audit list already shown above; last-activity stays blank */
      }
    })();
  }, []);
  const lastByActor = useMemo(() => {
    const map = new Map<string, AuditRow>();
    for (const r of allAudit) {
      if (r.actorId && !map.has(r.actorId)) map.set(r.actorId, r);
    }
    return map;
  }, [allAudit]);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError('');
    try {
      await fn();
      await load();
    } catch (e) {
      setError(friendlyAdminError(e));
    } finally {
      setBusy(false);
    }
  };

  const doSearch = async () => {
    setBusy(true);
    setError('');
    setFound(null);
    setPicked(null);
    try {
      const results = await findUserByEmail(requireDb(), email);
      setFound(results);
      if (results.length === 0) setError('এই ইমেইলে কোনো অ্যাকাউন্ট পাওয়া যায়নি। / No account found for this email.');
    } catch (e) {
      setError(friendlyAdminError(e));
    } finally {
      setBusy(false);
    }
  };

  const doAssign = async () => {
    if (!picked) return;
    const cleaned = validateSectors(sectors);
    const expiresAt = temporary && expiry ? new Date(expiry) : null;
    await run(() =>
      assignAdmin(requireDb(), {
        targetUid: picked.uid,
        sectors: cleaned,
        reason,
        note,
        expiresAt,
      }),
    );
    setPicked(null);
    setSectors(emptySectors());
    setTemporary(false);
    setExpiry('');
    setNote('');
    setReason('');
    setEmail('');
    setFound(null);
    setConfirmAssign(false);
  };

  const doEdit = async () => {
    if (!editing) return;
    const cleaned = validateSectors(editSectors);
    await run(() => updateAdminPermissions(requireDb(), editing.userId, cleaned, editReason));
    setEditing(null);
    setEditSectors(emptySectors());
    setEditReason('');
  };

  const doAct = async () => {
    if (!acting) return;
    const { row, kind } = acting;
    if (kind === 'remove') {
      await run(() => removeAdmin(requireDb(), row.userId, actReason));
    } else {
      await run(() => setAdminSuspended(requireDb(), row.userId, kind === 'suspend', actReason));
    }
    setActing(null);
    setActReason('');
  };

  const doRevokeAll = async () => {
    await run(() => revokeAllDelegatedAccess(requireDb(), revokeReason));
    setConfirmRevokeAll(false);
    setRevokeReason('');
  };

  const statusPill = (a: AdminAssignment) => {
    const s = assignmentStatus(a);
    if (s === 'active') return <StatusPill label="সক্রিয় / Active" tone="active" />;
    if (s === 'suspended') return <StatusPill label="স্থগিত / Suspended" tone="muted" />;
    return <StatusPill label="মেয়াদ শেষ / Expired" tone="ready" />;
  };

  return (
    <PageShell titleBn="অ্যাডমিন ও পরিচালনা দল" titleEn="Admin & Management Team">
      <AdminBackLink />
      <p style={{ color: '#555' }}>
        বিশ্বস্ত ব্যক্তিদের সেক্টর + অনুমতি দিন — সম্পূর্ণ মালিকানা ও সর্বোচ্চ নিয়ন্ত্রণ আপনার কাছেই থাকে।
        / Give trusted people sectors + permissions — full ownership and top control stay with you.
      </p>

      <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: '12px 14px', background: '#FDF3D0', margin: '12px 0' }}>
        <p style={{ margin: 0, fontWeight: 700, color: NAVY }}>সততার নোট / Honest limits</p>
        <ul style={{ margin: '8px 0 0', paddingLeft: 20, lineHeight: 1.7 }}>
          <li>সেক্টরের লেখার কাজে (প্রকাশ, অনুমোদন, মুছে ফেলা) 2FA সেশন বাধ্যতামূলক — নিয়ম (rules) এটি প্রয়োগ করে।</li>
          <li>কার 2FA চালু আছে, তা এই পাতা থেকে দেখা যায় না — Firebase-এ সেই তথ্য অ্যাপে পাওয়া যায় না। নিয়োগের আগে সংশ্লিষ্ট ব্যক্তিকে জিজ্ঞেস করে নিন।</li>
          <li>আপনার নিজের 2FA অবস্থা: {myMfa.length > 0 ? `চালু আছে (${myMfa.join(', ')})` : 'এই সেশনে 2FA নথিভুক্ত নয় — Firebase Auth-এ MFA চালু করুন'}।</li>
          <li>Production deploy, বিলিং, ডোমেইন/DNS, নিয়ম (rules) পরিবর্তন — এগুলো কনসোলের কাজ, কোনো ড্যাশবোর্ড থেকে হয় না।</li>
          <li>স্থগিত করলে শুধু সেক্টরের ক্ষমতা যায় — ব্যক্তির নিজের অ্যাকাউন্ট (লাইব্রেরি, পরীক্ষা) চালু থাকে।</li>
        </ul>
      </div>

      {loading ? (
        <LoadingBox />
      ) : (
        <>
          {error ? <ErrorBox message={error} /> : null}

          <h2 style={{ fontSize: 19, color: NAVY, margin: '20px 0 8px' }}>
            অ্যাডমিন যোগ করুন / Add an admin ({formatBnNumber(rows.length)} জন)
          </h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ইমেইল লিখুন / Email"
              aria-label="ইমেইল / Email"
              style={{ flex: '1 1 220px', padding: '10px 12px', fontSize: 16, borderRadius: 8, border: '1px solid #999' }}
            />
            <button
              type="button"
              disabled={busy || !email.trim()}
              onClick={() => void doSearch()}
              style={{ padding: '10px 18px', minHeight: 48, fontSize: 16, borderRadius: 8, border: 'none', background: NAVY, color: '#fff', cursor: 'pointer' }}
            >
              খুঁজুন / Search
            </button>
          </div>
          {found !== null && found.length > 0 ? (
            <ul style={{ listStyle: 'none', padding: 0, margin: '12px 0' }}>
              {found.map((u) => (
                <li key={u.uid} style={{ border: '1px solid #ddd', borderRadius: 8, padding: '10px 12px', margin: '8px 0' }}>
                  <strong>{u.displayName}</strong> — {u.email} ({u.role})
                  <button
                    type="button"
                    disabled={busy || rows.some((r) => r.userId === u.uid)}
                    onClick={() => setPicked(u)}
                    style={{ marginLeft: 12, padding: '8px 14px', borderRadius: 8, border: `1px solid ${BLUE}`, background: '#fff', color: BLUE, cursor: 'pointer' }}
                  >
                    {rows.some((r) => r.userId === u.uid) ? 'ইতিমধ্যে অ্যাডমিন / Already an admin' : 'নির্বাচন করুন / Select'}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          {picked ? (
            <div style={{ border: `2px solid ${GOLD}`, borderRadius: 8, padding: '12px 14px', margin: '12px 0' }}>
              <p style={{ margin: '0 0 8px' }}>
                <strong>{picked.displayName}</strong> ({picked.email}) — কে কী সেক্টর + অনুমতি পাবে, তা বেছে নিন।
              </p>
              <SectorPermEditor sectors={sectors} onChange={setSectors} disabled={busy} />
              <label style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '12px 0', cursor: 'pointer' }}>
                <input type="checkbox" checked={temporary} disabled={busy} onChange={(e) => setTemporary(e.target.checked)} />
                অস্থায়ী অ্যাক্সেস (মেয়াদ শেষে ক্ষমতা নিজে থেকেই বন্ধ) / Temporary access (powers stop at expiry)
              </label>
              {temporary ? (
                <p style={{ margin: '0 0 12px' }}>
                  <label>
                    মেয়াদ শেষ / Expires at{' '}
                    <input
                      type="datetime-local"
                      value={expiry}
                      disabled={busy}
                      onChange={(e) => setExpiry(e.target.value)}
                      style={{ padding: '8px 10px', fontSize: 16, borderRadius: 8, border: '1px solid #999' }}
                    />
                  </label>
                </p>
              ) : null}
              <p style={{ margin: '0 0 8px' }}>
                <label>
                  নোট (ঐচ্ছিক) / Note (optional)<br />
                  <input
                    type="text"
                    value={note}
                    disabled={busy}
                    maxLength={500}
                    onChange={(e) => setNote(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', fontSize: 16, borderRadius: 8, border: '1px solid #999' }}
                  />
                </label>
              </p>
              <p style={{ margin: '0 0 12px' }}>
                <label>
                  কারণ (কমপক্ষে ১০ অক্ষর, অডিট লগে থাকবে) / Reason (min 10 chars, kept in the audit log)<br />
                  <input
                    type="text"
                    value={reason}
                    disabled={busy}
                    onChange={(e) => setReason(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', fontSize: 16, borderRadius: 8, border: '1px solid #999' }}
                  />
                </label>
              </p>
              <button
                type="button"
                disabled={busy || reason.trim().length < 10 || Object.keys(sectors).length === 0}
                onClick={() => setConfirmAssign(true)}
                style={{ padding: '12px 20px', minHeight: 48, fontSize: 16, borderRadius: 8, border: 'none', background: NAVY, color: '#fff', cursor: 'pointer' }}
              >
                অ্যাডমিন হিসেবে নিয়োগ দিন / Assign as admin
              </button>{' '}
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setPicked(null);
                  setSectors(emptySectors());
                }}
                style={{ padding: '12px 20px', minHeight: 48, fontSize: 16, borderRadius: 8, border: '1px solid #999', background: '#fff', cursor: 'pointer' }}
              >
                বাতিল / Cancel
              </button>
            </div>
          ) : null}

          <h2 style={{ fontSize: 19, color: NAVY, margin: '24px 0 8px' }}>অ্যাডমিন তালিকা / Admin list</h2>
          {rows.length === 0 ? (
            <EmptyAdminBox bn="এখনো কোনো অ্যাডমিন নিয়োগ দেওয়া হয়নি।" en="No admins assigned yet." nextBn="উপরে ইমেইল দিয়ে খুঁজে নিয়োগ দিন।" />
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {rows.map((a) => {
                const last = lastByActor.get(a.userId);
                return (
                  <li key={a.userId} style={{ border: '1px solid #ddd', borderRadius: 8, padding: '12px 14px', margin: '10px 0' }}>
                    <p style={{ margin: '0 0 4px' }}>
                      <strong>{a.displayName}</strong> — {a.email} {statusPill(a)}
                    </p>
                    <p style={{ margin: '0 0 4px', color: '#555' }}>
                      {(Object.keys(a.sectors) as TeamSectorId[]).map((s) => (
                        <span key={s} style={{ display: 'inline-block', margin: '2px 6px 2px 0', padding: '2px 8px', borderRadius: 12, background: '#E8EFFA', fontSize: 14 }}>
                          {SECTOR_LABELS[s].bn}: {(a.sectors[s] ?? []).join(', ')}
                        </span>
                      ))}
                    </p>
                    <p style={{ margin: '0 0 4px', color: '#555', fontSize: 14 }}>
                      নিয়োগ: {formatTime(a.assignedAt)}
                      {a.expiresAt ? ` · মেয়াদ শেষ: ${formatTime(a.expiresAt)}` : ' · মেয়াদ নেই / No expiry'}
                      {a.note ? ` · নোট: ${a.note}` : ''}
                    </p>
                    <p style={{ margin: '0 0 8px', color: '#555', fontSize: 14 }}>
                      শেষ কার্যক্রম / Last activity:{' '}
                      {last ? `${auditActionLabel(last.action).bn} — ${formatTime(last.createdAt)}` : '—'}
                    </p>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          setEditing(a);
                          setEditSectors(a.sectors);
                          setEditReason('');
                        }}
                        style={{ padding: '8px 14px', borderRadius: 8, border: `1px solid ${BLUE}`, background: '#fff', color: BLUE, cursor: 'pointer' }}
                      >
                        অনুমতি বদলান / Edit permissions
                      </button>
                      {a.status === 'suspended' ? (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => setActing({ row: a, kind: 'reactivate' })}
                          style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #999', background: '#fff', cursor: 'pointer' }}
                        >
                          আবার চালু / Reactivate
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => setActing({ row: a, kind: 'suspend' })}
                          style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #999', background: '#fff', cursor: 'pointer' }}
                        >
                          স্থগিত / Suspend
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setActing({ row: a, kind: 'remove' })}
                        style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #b00020', background: '#fff', color: '#b00020', cursor: 'pointer' }}
                      >
                        অপসারণ / Remove
                      </button>
                    </div>
                    {editing && editing.userId === a.userId ? (
                      <div style={{ borderTop: '1px solid #ddd', marginTop: 12, paddingTop: 12 }}>
                        <SectorPermEditor sectors={editSectors} onChange={setEditSectors} disabled={busy} />
                        <p style={{ margin: '8px 0' }}>
                          <label>
                            কারণ (কমপক্ষে ১০ অক্ষর) / Reason (min 10 chars)<br />
                            <input
                              type="text"
                              value={editReason}
                              disabled={busy}
                              onChange={(e) => setEditReason(e.target.value)}
                              style={{ width: '100%', padding: '10px 12px', fontSize: 16, borderRadius: 8, border: '1px solid #999' }}
                            />
                          </label>
                        </p>
                        <button
                          type="button"
                          disabled={busy || editReason.trim().length < 10 || Object.keys(editSectors).length === 0}
                          onClick={() => void doEdit()}
                          style={{ padding: '10px 18px', minHeight: 48, fontSize: 16, borderRadius: 8, border: 'none', background: NAVY, color: '#fff', cursor: 'pointer' }}
                        >
                          সংরক্ষণ / Save
                        </button>{' '}
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => setEditing(null)}
                          style={{ padding: '10px 18px', minHeight: 48, fontSize: 16, borderRadius: 8, border: '1px solid #999', background: '#fff', cursor: 'pointer' }}
                        >
                          বাতিল / Cancel
                        </button>
                      </div>
                    ) : null}
                    {acting && acting.row.userId === a.userId ? (
                      <div style={{ borderTop: '1px solid #ddd', marginTop: 12, paddingTop: 12 }}>
                        <p style={{ margin: '0 0 8px' }}>
                          {acting.kind === 'remove'
                            ? 'অপসারণ করলে ক্ষমতা সাথে সাথে বন্ধ হয়ে যাবে। / Removal stops their powers immediately.'
                            : acting.kind === 'suspend'
                              ? 'স্থগিত করলে সেক্টরের ক্ষমতা বন্ধ হবে; ব্যক্তির নিজের অ্যাকাউন্ট চালু থাকবে। / Suspension stops sector powers; their own account stays usable.'
                              : 'আবার চালু করলে সেক্টরের ক্ষমতা ফিরে আসবে। / Reactivation restores sector powers.'}
                        </p>
                        <p style={{ margin: '0 0 8px' }}>
                          <label>
                            কারণ (কমপক্ষে ১০ অক্ষর) / Reason (min 10 chars)<br />
                            <input
                              type="text"
                              value={actReason}
                              disabled={busy}
                              onChange={(e) => setActReason(e.target.value)}
                              style={{ width: '100%', padding: '10px 12px', fontSize: 16, borderRadius: 8, border: '1px solid #999' }}
                            />
                          </label>
                        </p>
                        <button
                          type="button"
                          disabled={busy || actReason.trim().length < 10}
                          onClick={() => void doAct()}
                          style={{ padding: '10px 18px', minHeight: 48, fontSize: 16, borderRadius: 8, border: 'none', background: '#b00020', color: '#fff', cursor: 'pointer' }}
                        >
                          নিশ্চিত করুন / Confirm
                        </button>{' '}
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => setActing(null)}
                          style={{ padding: '10px 18px', minHeight: 48, fontSize: 16, borderRadius: 8, border: '1px solid #999', background: '#fff', cursor: 'pointer' }}
                        >
                          বাতিল / Cancel
                        </button>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}

          <h2 style={{ fontSize: 19, color: '#b00020', margin: '24px 0 8px' }}>বিপজ্জনক এলাকা / Danger zone</h2>
          <div style={{ border: '1px solid #b00020', borderRadius: 8, padding: '12px 14px' }}>
            <p style={{ margin: '0 0 8px' }}>
              সব প্রতিনিধি-অ্যাক্সেস বাতিল / Revoke ALL delegated access — সব অ্যাডমিনের নিয়োগ একসাথে মুছে যাবে।
              আপনার নিজের মালিকানা এতে ছোঁয়া যাবে না।
            </p>
            <p style={{ margin: '0 0 8px' }}>
              <label>
                কারণ (কমপক্ষে ১০ অক্ষর) / Reason (min 10 chars)<br />
                <input
                  type="text"
                  value={revokeReason}
                  disabled={busy || rows.length === 0}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', fontSize: 16, borderRadius: 8, border: '1px solid #999' }}
                />
              </label>
            </p>
            <button
              type="button"
              disabled={busy || rows.length === 0 || revokeReason.trim().length < 10}
              onClick={() => setConfirmRevokeAll(true)}
              style={{ padding: '12px 20px', minHeight: 48, fontSize: 16, borderRadius: 8, border: 'none', background: '#b00020', color: '#fff', cursor: 'pointer' }}
            >
              সব অ্যাক্সেস বাতিল করুন / Revoke all access
            </button>
          </div>

          <h2 style={{ fontSize: 19, color: NAVY, margin: '24px 0 8px' }}>দলের অডিট লগ / Team audit log</h2>
          {audit.length === 0 ? (
            <EmptyAdminBox bn="দলের কোনো কার্যক্রম এখনো লগে নেই।" en="No team actions in the log yet." />
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {audit.slice(0, 50).map((r) => (
                <li key={r.id} style={{ borderBottom: '1px solid #eee', padding: '8px 0' }}>
                  <strong>{auditActionLabel(r.action).bn}</strong> / {auditActionLabel(r.action).en}
                  {r.details ? ` — ${r.details}` : ''} · {formatTime(r.createdAt)}
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {confirmAssign && picked ? (
        <ConfirmDialog
          titleBn="অ্যাডমিন নিয়োগ নিশ্চিত করুন"
          titleEn="Confirm admin assignment"
          bodyBn={`${picked.displayName} (${picked.email}) — কে সেক্টর + অনুমতি দেওয়া হবে। এই কাজটি অডিট লগে থাকবে।`}
          bodyEn={`${picked.displayName} (${picked.email}) will receive sectors + permissions. This will be kept in the audit log.`}
          confirmBn="নিয়োগ দিন"
          confirmEn="Assign"
          onConfirm={() => void doAssign()}
          onCancel={() => setConfirmAssign(false)}
        />
      ) : null}
      {confirmRevokeAll ? (
        <ConfirmDialog
          titleBn="সব অ্যাক্সেস বাতিল করবেন?"
          titleEn="Revoke all delegated access?"
          bodyBn={`সব ${formatBnNumber(rows.length)} জন অ্যাডমিনের নিয়োগ মুছে যাবে। তাদের ক্ষমতা সাথে সাথে বন্ধ হবে।`}
          bodyEn={`All ${rows.length} admin assignments will be deleted. Their powers stop immediately.`}
          confirmBn="সব বাতিল করুন"
          confirmEn="Revoke all"
          onConfirm={() => void doRevokeAll()}
          onCancel={() => setConfirmRevokeAll(false)}
        />
      ) : null}
    </PageShell>
  );
}
