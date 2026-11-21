import { useEffect, useState } from 'react';
import { PageShell } from '../components/PageShell';
import { useLanguage } from '../i18n/LanguageContext';
import { AlertBox, Button, Card } from '../components/ui';
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

const CHECK_LABELS: Array<{ key: keyof Omit<VerificationChecks, 'evidenceRef'>; bn: string; en: string }> = [
  { key: 'identity', bn: 'পরিচয় যাচাই করেছি (নাম, প্রতিষ্ঠান ও যোগ্যতার তথ্য মিলেছে)', en: 'I checked the identity (name, institution and qualification details match)' },
  { key: 'institution', bn: 'প্রতিষ্ঠান যাচাই করেছি (চাকরি/প্রতিষ্ঠান নিশ্চিত)', en: 'I checked the institution (job/institution confirmed)' },
  { key: 'subject', bn: 'বিষয় + যোগ্যতা যাচাই করেছি', en: 'I checked the subject + qualification' },
  { key: 'adult', bn: 'আবেদনকারী প্রাপ্তবয়স্ক (শিশু নয়)', en: 'The applicant is an adult (not a child)' },
];

function VerificationCard(props: {
  row: VerificationRow;
  onDone: (msg: string) => void;
  onError: (msg: string) => void;
}) {
  const { lang, t } = useLanguage();
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
            ? t({ bn: `${row.fullName} ভেরিফায়েড শিক্ষক হিসেবে অনুমোদিত হয়েছেন।`, en: `${row.fullName} has been approved as a verified teacher.` })
            : t({ bn: `${row.fullName}-এর আবেদন বাতিল হয়েছে।`, en: `${row.fullName}’s application has been rejected.` }),
        );
      } else if (confirm === 'revoked') {
        await revokeTeacherVerification(requireDb(), row.id, reason);
        props.onDone(t({ bn: `${row.fullName}-এর শিক্ষক যাচাই বাতিল হয়েছে।`, en: `${row.fullName}’s teacher verification has been revoked.` }));
      } else {
        await reopenTeacherVerification(requireDb(), row.id, reason);
        props.onDone(t({ bn: `${row.fullName}-এর আবেদন আবার খোলা হয়েছে।`, en: `${row.fullName}’s application has been reopened.` }));
      }
      setReason('');
      setChecks({ identity: false, institution: false, subject: false, adult: false, evidenceRef: '' });
      setConfirm(null);
    } catch (e) {
      props.onError(friendlyAdminError(e, lang));
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
  const confirmBodyEn =
    confirm === 'verified'
      ? `${row.fullName} will be approved as a verified teacher. They will be able to create lessons/quizzes. Reason: ${reason}`
      : confirm === 'rejected'
        ? `${row.fullName}'s teacher application will be rejected. Reason: ${reason}`
        : confirm === 'revoked'
          ? `${row.fullName}'s teacher verification will be revoked. They will no longer be a teacher. Reason: ${reason}`
          : `${row.fullName}'s application will reopen (back to pending). Reason: ${reason}`;

  return (
    <li style={{ marginBottom: 12 }}>
      <Card>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <strong style={{ fontSize: 16 }}>{row.fullName}</strong>
        <StatusPill
          label={
            row.status === 'pending'
              ? t({ bn: 'অপেক্ষায়', en: 'Pending' })
              : row.status === 'verified'
                ? t({ bn: 'ভেরিফায়েড', en: 'Verified' })
                : row.status === 'rejected'
                  ? t({ bn: 'বাতিল', en: 'Rejected' })
                  : t({ bn: 'যাচাই বাতিল', en: 'Revoked' })
          }
          tone={row.status === 'verified' ? 'active' : row.status === 'pending' ? 'ready' : 'muted'}
        />
      </div>
      <p style={{ margin: '6px 0', color: '#68747B', fontSize: 14 }}>
        {row.institution} · {t({ bn: 'আবেদন', en: 'Applied' })}: {formatTime(row.createdAt, lang)}
        {row.checkedBy ? ` · ${t({ bn: 'সিদ্ধান্তকারী', en: 'Decided by' })}: ${row.checkedBy}` : ''}
        {row.reason ? ` · ${t({ bn: 'কারণ', en: 'Reason' })}: ${row.reason}` : ''}
      </p>
      {row.extra && Object.keys(row.extra).length > 0 ? (
        <p style={{ margin: '0 0 8px', color: '#68747B', fontSize: 14 }}>
          {Object.entries(row.extra)
            .filter(([, v]) => typeof v === 'string' || typeof v === 'number')
            .map(([k, v]) => `${k}: ${String(v)}`)
            .join(' · ')}
        </p>
      ) : null}

      {row.status === 'pending' ? (
        <>
          <h3 style={{ fontSize: 16, margin: '12px 0 4px' }}>
            {t({ bn: 'অনুমোদনের আগে ৪টি যাচাই — সবগুলো টিক দিতে হবে', en: '4 checks before approval — all must be ticked' })}
          </h3>
          <p className="ev-muted" style={{ fontSize: 14, margin: '0 0 8px' }}>
            {t({ bn: 'একটিও বাদ থাকলে অনুমোদন বোতাম চালু হবে না। ভুয়া শিক্ষক যাতে ভেরিফায়েড না হয়, এজন্য।', en: 'If even one is unticked, the approve button stays disabled — so a fake teacher cannot become verified.' })}
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
                style={{ width: 24, height: 24, accentColor: '#12766E', flexShrink: 0 }}
              />
              <span>{t(c)}</span>
            </label>
          ))}
          <label className="ev-label" htmlFor={`evidence-${row.id}`} style={{ marginTop: 8 }}>
            {t({ bn: 'প্রমাণের রেফারেন্স (ঐচ্ছিক)', en: 'Evidence reference (optional)' })}
          </label>
          <input
            id={`evidence-${row.id}`}
            className="ev-input"
            type="text"
            value={checks.evidenceRef ?? ''}
            onChange={(e) => setChecks((p) => ({ ...p, evidenceRef: e.target.value }))}
            placeholder={t({ bn: 'যেমন: কলেজে ফোন করে চাকরি নিশ্চিত করা হয়েছে', en: 'e.g. Phoned the college and confirmed the job' })}
          />
          <label className="ev-label" htmlFor={`reason-${row.id}`} style={{ marginTop: 12 }}>
            {t({ bn: 'সিদ্ধান্তের কারণ (অবশ্যই লিখুন — কমপক্ষে ১০ অক্ষর)', en: 'Reason (required)' })}
          </label>
          <textarea
            id={`reason-${row.id}`}
            className="ev-textarea"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            placeholder={t({ bn: 'কেন অনুমোদন/বাতিল করছেন', en: 'Why are you approving/rejecting' })}
          />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
            <Button disabled={busy || !reasonOk || !checksOk} onClick={() => setConfirm('verified')}>
              {t({ bn: 'অনুমোদন করুন', en: 'Approve' })}
            </Button>
            <Button
              variant="outline"
              disabled={busy || !reasonOk}
              onClick={() => setConfirm('rejected')}
              style={{ color: '#B00020', borderColor: '#B00020' }}
            >
              {t({ bn: 'বাতিল করুন', en: 'Reject' })}
            </Button>
          </div>
          {!checksOk ? (
            <p className="ev-muted" style={{ fontSize: 14 }}>
              {t({ bn: 'অনুমোদন বোতাম চালু হতে ৪টি যাচাই সবগুলো টিক দিতে হবে।', en: 'All 4 checks must be ticked before the approve button enables.' })}
            </p>
          ) : null}
        </>
      ) : (
        <>
          <label className="ev-label" htmlFor={`reason2-${row.id}`} style={{ marginTop: 8 }}>
            {t({ bn: 'আবার খুলতে / যাচাই বাতিল করতে কারণ লিখুন (অবশ্যই — কমপক্ষে ১০ অক্ষর)', en: 'Write a reason to reopen / revoke verification (required — at least 10 characters)' })}
          </label>
          <textarea
            id={`reason2-${row.id}`}
            className="ev-textarea"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            placeholder={t({ bn: 'কেন আবার খুলছেন / যাচাই বাতিল করছেন', en: 'Why are you reopening / revoking verification' })}
          />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
            <Button variant="outline" disabled={busy || !reasonOk} onClick={() => setConfirm('reopen')}>
              {t({ bn: 'আবার খুলুন', en: 'Reopen' })}
            </Button>
            {row.status === 'verified' ? (
              <Button
                variant="outline"
                disabled={busy || !reasonOk}
                onClick={() => setConfirm('revoked')}
                style={{ color: '#B00020', borderColor: '#B00020' }}
              >
                {t({ bn: 'যাচাই বাতিল করুন', en: 'Revoke verification' })}
              </Button>
            ) : null}
          </div>
        </>
      )}

      {confirm ? (
        <ConfirmDialog
          titleBn="আপনি কি নিশ্চিত?"
          titleEn="Are you sure?"
          bodyBn={confirmBodyBn}
          bodyEn={confirmBodyEn}
          confirmBn="হ্যাঁ, করুন"
          confirmEn="Yes, do it"
          onConfirm={() => void doConfirm()}
          onCancel={() => setConfirm(null)}
        />
      ) : null}
      </Card>
    </li>
  );
}

export default function AdminTeachersPage() {
  const { lang, t } = useLanguage();
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
      setError(friendlyAdminError(e, lang));
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
        {t({
          bn: 'প্রতিটি আবেদন আলাদা সিদ্ধান্ত — একসঙ্গে অনেকগুলো অনুমোদন করা যায় না। অনুমোদনের আগে ৪টি যাচাই বাধ্যতামূলক, আর প্রতিটি সিদ্ধান্তে কারণ লিখতে হয়।',
          en: 'Each application is a separate decision — no bulk approvals. Four checks are mandatory before approval, and every decision needs a reason.',
        })}
      </p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <Button variant={filter === 'pending' ? 'primary' : 'outline'} onClick={() => setFilter('pending')}>
          {t({ bn: `অপেক্ষায় (${rows.filter((r) => r.status === 'pending').length})`, en: `Pending (${rows.filter((r) => r.status === 'pending').length})` })}
        </Button>
        <Button variant={filter === 'decided' ? 'primary' : 'outline'} onClick={() => setFilter('decided')}>
          {t({ bn: `সিদ্ধান্ত হয়েছে (${rows.filter((r) => r.status !== 'pending').length})`, en: `Decided (${rows.filter((r) => r.status !== 'pending').length})` })}
        </Button>
      </div>
      {loading ? <LoadingBox /> : null}
      {error ? <ErrorBox message={error} /> : null}
      {notice ? <AlertBox tone="ok">{notice}</AlertBox> : null}
      {!loading && shown.length === 0 ? (
        <EmptyAdminBox
          bn={
            filter === 'pending'
              ? 'কোনো আবেদন অপেক্ষায় নেই।'
              : 'এখনো কোনো সিদ্ধান্ত হয়নি।'
          }
          en={filter === 'pending' ? 'No applications waiting.' : 'No decisions yet.'}
          nextBn="শিক্ষক রেজিস্টার করলে (Step 5) আবেদন এখানে আসবে।"
          nextEn="Applications appear here when a teacher registers (Step 5)."
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
