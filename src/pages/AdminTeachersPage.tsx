import { useEffect, useState } from 'react';
import { PageShell } from '../components/PageShell';
import {
  AdminBackLink,
  ConfirmDialog,
  EmptyAdminBox,
  ErrorBox,
  LoadingBox,
  StatusPill,
  requireDb,
} from '../components/AdminShared';
import {
  decideTeacherVerification,
  formatTime,
  friendlyAdminError,
  listTeacherVerifications,
  reopenTeacherVerification,
  revokeTeacherVerification,
  type VerificationChecks,
  type VerificationRow,
} from '../lib/admin';

type Decision = 'verified' | 'rejected' | 'revoked' | 'reopen';

const CHECK_LABELS: Array<{ key: keyof Omit<VerificationChecks, 'evidenceRef'>; bn: string }> = [
  { key: 'identity', bn: 'পরিচয় যাচাই করেছি (নাম, প্রতিষ্ঠান ও যোগ্যতার তথ্য মিলেছে)' },
  { key: 'institution', bn: 'প্রতিষ্ঠান যাচাই করেছি (চাকরি/প্রতিষ্ঠান নিশ্চিত)' },
  { key: 'subject', bn: 'বিষয় + যোগ্যতা যাচাই করেছি' },
  { key: 'adult', bn: 'আবেদনকারী প্রাপ্তবয়স্ক (শিশু নয়)' },
];

function VerificationCard(props: {
  row: VerificationRow;
  onDone: (msg: string) => void;
  onError: (msg: string) => void;
}) {
  const { row } = props;
  const [checks, setChecks] = useState<VerificationChecks>({
    identity: false,
    institution: false,
    subject: false,
    adult: false,
    evidenceRef: '',
  });
  const [reason, setReason] = useState('');
  const [confirm, setConfirm] = useState<Decision | null>(null);
  const [busy, setBusy] = useState(false);

  const reasonOk = reason.trim().length >= 10;
  const checksOk = checks.identity && checks.institution && checks.subject && checks.adult;

  async function doConfirm(): Promise<void> {
    if (!confirm) return;
    setBusy(true);
    try {
      if (confirm === 'verified' || confirm === 'rejected') {
        await decideTeacherVerification(requireDb(), row.id, confirm, reason, checks);
        props.onDone(
          confirm === 'verified'
            ? `${row.fullName} ভেরিফায়েড শিক্ষক হিসেবে অনুমোদিত হয়েছেন।`
            : `${row.fullName}-এর আবেদন বাতিল হয়েছে।`,
        );
      } else if (confirm === 'revoked') {
        await revokeTeacherVerification(requireDb(), row.id, reason);
        props.onDone(`${row.fullName}-এর শিক্ষক যাচাই বাতিল হয়েছে।`);
      } else {
        await reopenTeacherVerification(requireDb(), row.id, reason);
        props.onDone(`${row.fullName}-এর আবেদন আবার খোলা হয়েছে।`);
      }
      setReason('');
      setChecks({ identity: false, institution: false, subject: false, adult: false, evidenceRef: '' });
      setConfirm(null);
    } catch (e) {
      props.onError(friendlyAdminError(e));
      setConfirm(null);
    } finally {
      setBusy(false);
    }
  }

  const confirmBodyBn =
    confirm === 'verified'
      ? `${row.fullName}-কে ভেরিফায়েড শিক্ষক হিসেবে অনুমোদন করবেন? তিনি পাঠ/কুইজ তৈরি করতে পারবেন। কারণ: ${reason}`
      : confirm === 'rejected'
        ? `${row.fullName}-এর শিক্ষক আবেদন বাতিল করবেন? কারণ: ${reason}`
        : confirm === 'revoked'
          ? `${row.fullName}-এর শিক্ষক যাচাই বাতিল করবেন? তিনি আর শিক্ষক থাকবেন না। কারণ: ${reason}`
          : `${row.fullName}-এর আবেদন আবার খুলবেন (pending-এ ফেরত)? কারণ: ${reason}`;

  return (
    <li
      style={{
        border: '1px solid #ddd',
        borderRadius: 8,
        padding: '12px 14px',
        marginBottom: 12,
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <strong style={{ fontSize: 16 }}>{row.fullName}</strong>
        <StatusPill
          label={
            row.status === 'pending'
              ? 'অপেক্ষায় / Pending'
              : row.status === 'verified'
                ? 'ভেরিফায়েড / Verified'
                : row.status === 'rejected'
                  ? 'বাতিল / Rejected'
                  : 'যাচাই বাতিল / Revoked'
          }
          tone={row.status === 'verified' ? 'active' : row.status === 'pending' ? 'ready' : 'muted'}
        />
      </div>
      <p style={{ margin: '6px 0', color: '#555', fontSize: 14 }}>
        {row.institution} · আবেদন: {formatTime(row.createdAt)}
        {row.checkedBy ? ` · সিদ্ধান্তকারী: ${row.checkedBy}` : ''}
        {row.reason ? ` · কারণ: ${row.reason}` : ''}
      </p>
      {row.extra && Object.keys(row.extra).length > 0 ? (
        <p style={{ margin: '0 0 8px', color: '#555', fontSize: 14 }}>
          {Object.entries(row.extra)
            .filter(([, v]) => typeof v === 'string' || typeof v === 'number')
            .map(([k, v]) => `${k}: ${String(v)}`)
            .join(' · ')}
        </p>
      ) : null}

      {row.status === 'pending' ? (
        <>
          <h3 style={{ fontSize: 16, margin: '12px 0 4px' }}>
            অনুমোদনের আগে ৪টি যাচাই — সবগুলো টিক দিতে হবে
          </h3>
          <p style={{ color: '#555', fontSize: 14, margin: '0 0 8px' }}>
            একটিও বাদ থাকলে অনুমোদন বোতাম চালু হবে না। ভুয়া শিক্ষক যাতে ভেরিফায়েড না হয়, এজন্য।
          </p>
          {CHECK_LABELS.map((c) => (
            <label
              key={c.key}
              style={{
                display: 'flex',
                gap: 8,
                alignItems: 'flex-start',
                minHeight: 44,
                padding: '8px 0',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={checks[c.key]}
                onChange={(e) => setChecks((p) => ({ ...p, [c.key]: e.target.checked }))}
                style={{ width: 24, height: 24, accentColor: '#1E7CE8', flexShrink: 0 }}
              />
              <span>{c.bn}</span>
            </label>
          ))}
          <label style={{ display: 'block', fontWeight: 700, marginTop: 8 }}>
            প্রমাণের রেফারেন্স (ঐচ্ছিক) / Evidence reference (optional)
          </label>
          <input
            type="text"
            value={checks.evidenceRef ?? ''}
            onChange={(e) => setChecks((p) => ({ ...p, evidenceRef: e.target.value }))}
            placeholder="যেমন: কলেজে ফোন করে চাকরি নিশ্চিত করা হয়েছে"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '10px',
              minHeight: 48,
              fontSize: 16,
              borderRadius: 8,
              border: '1px solid #888',
              marginTop: 4,
            }}
          />
          <label style={{ display: 'block', fontWeight: 700, marginTop: 12 }}>
            সিদ্ধান্তের কারণ (অবশ্যই লিখুন — কমপক্ষে ১০ অক্ষর) / Reason (required)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            placeholder="কেন অনুমোদন/বাতিল করছেন"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '10px',
              minHeight: 48,
              fontSize: 16,
              borderRadius: 8,
              border: '1px solid #888',
              marginTop: 4,
            }}
          />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
            <button
              type="button"
              disabled={busy || !reasonOk || !checksOk}
              onClick={() => setConfirm('verified')}
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
              অনুমোদন করুন / Approve
            </button>
            <button
              type="button"
              disabled={busy || !reasonOk}
              onClick={() => setConfirm('rejected')}
              style={{
                padding: '12px 20px',
                minHeight: 48,
                fontSize: 16,
                borderRadius: 8,
                border: '1px solid #b00020',
                background: '#fff',
                color: '#b00020',
                cursor: 'pointer',
              }}
            >
              বাতিল করুন / Reject
            </button>
          </div>
          {!checksOk ? (
            <p style={{ color: '#555', fontSize: 14 }}>
              অনুমোদন বোতাম চালু হতে ৪টি যাচাই সবগুলো টিক দিতে হবে।
            </p>
          ) : null}
        </>
      ) : (
        <>
          <label style={{ display: 'block', fontWeight: 700, marginTop: 8 }}>
            আবার খুলতে / যাচাই বাতিল করতে কারণ লিখুন (অবশ্যই — কমপক্ষে ১০ অক্ষর)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            placeholder="কেন আবার খুলছেন / যাচাই বাতিল করছেন"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '10px',
              minHeight: 48,
              fontSize: 16,
              borderRadius: 8,
              border: '1px solid #888',
              marginTop: 4,
            }}
          />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
            <button
              type="button"
              disabled={busy || !reasonOk}
              onClick={() => setConfirm('reopen')}
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
              আবার খুলুন / Reopen
            </button>
            {row.status === 'verified' ? (
              <button
                type="button"
                disabled={busy || !reasonOk}
                onClick={() => setConfirm('revoked')}
                style={{
                  padding: '12px 20px',
                  minHeight: 48,
                  fontSize: 16,
                  borderRadius: 8,
                  border: '1px solid #b00020',
                  background: '#fff',
                  color: '#b00020',
                  cursor: 'pointer',
                }}
              >
                যাচাই বাতিল করুন / Revoke verification
              </button>
            ) : null}
          </div>
        </>
      )}

      {confirm ? (
        <ConfirmDialog
          titleBn="আপনি কি নিশ্চিত?"
          titleEn="Are you sure?"
          bodyBn={confirmBodyBn}
          bodyEn={
            confirm === 'verified'
              ? `${row.fullName} will become a verified teacher.`
              : confirm === 'rejected'
                ? `${row.fullName}'s application will be rejected.`
                : confirm === 'revoked'
                  ? `${row.fullName}'s verification will be revoked.`
                  : `${row.fullName}'s application will reopen as pending.`
          }
          confirmBn="হ্যাঁ, করুন"
          confirmEn="Yes, do it"
          onConfirm={() => void doConfirm()}
          onCancel={() => setConfirm(null)}
        />
      ) : null}
    </li>
  );
}

export default function AdminTeachersPage() {
  const [rows, setRows] = useState<VerificationRow[]>([]);
  const [filter, setFilter] = useState<'pending' | 'decided'>('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function reload(): Promise<void> {
    setLoading(true);
    setError('');
    try {
      const all = await listTeacherVerifications(requireDb());
      setRows(all);
    } catch (e) {
      setError(friendlyAdminError(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  const shown = rows.filter((r) =>
    filter === 'pending' ? r.status === 'pending' : r.status !== 'pending',
  );

  return (
    <PageShell titleBn="শিক্ষক যাচাই" titleEn="Teacher verification">
      <AdminBackLink />
      <p>
        প্রতিটি আবেদন আলাদা সিদ্ধান্ত — একসঙ্গে অনেকগুলো অনুমোদন করা যায় না। অনুমোদনের আগে ৪টি
        যাচাই বাধ্যতামূলক, আর প্রতিটি সিদ্ধান্তে কারণ লিখতে হয়। / Each application is a separate
        decision — no bulk approvals. Four checks are mandatory before approval, and every
        decision needs a reason.
      </p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button
          type="button"
          onClick={() => setFilter('pending')}
          style={{
            padding: '12px 20px',
            minHeight: 48,
            fontSize: 16,
            borderRadius: 8,
            border: 'none',
            background: filter === 'pending' ? '#0A1F44' : '#eee',
            color: filter === 'pending' ? '#fff' : '#0A1F44',
            cursor: 'pointer',
          }}
        >
          অপেক্ষায় ({rows.filter((r) => r.status === 'pending').length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('decided')}
          style={{
            padding: '12px 20px',
            minHeight: 48,
            fontSize: 16,
            borderRadius: 8,
            border: 'none',
            background: filter === 'decided' ? '#0A1F44' : '#eee',
            color: filter === 'decided' ? '#fff' : '#0A1F44',
            cursor: 'pointer',
          }}
        >
          সিদ্ধান্ত হয়েছে ({rows.filter((r) => r.status !== 'pending').length})
        </button>
      </div>
      {loading ? <LoadingBox /> : null}
      {error ? <ErrorBox message={error} /> : null}
      {notice ? (
        <p role="status" style={{ color: '#0A1F44', fontWeight: 700 }}>
          {notice}
        </p>
      ) : null}
      {!loading && shown.length === 0 ? (
        <EmptyAdminBox
          bn={
            filter === 'pending'
              ? 'কোনো আবেদন অপেক্ষায় নেই।'
              : 'এখনো কোনো সিদ্ধান্ত হয়নি।'
          }
          en={filter === 'pending' ? 'No applications waiting.' : 'No decisions yet.'}
          nextBn="শিক্ষক রেজিস্টার করলে (Step 5) আবেদন এখানে আসবে।"
        />
      ) : null}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {shown.map((row) => (
          <VerificationCard
            key={row.id}
            row={row}
            onDone={(msg) => {
              setNotice(msg);
              void reload();
            }}
            onError={(msg) => setError(msg)}
          />
        ))}
      </ul>
    </PageShell>
  );
}
