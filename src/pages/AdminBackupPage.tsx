import { useEffect, useState } from 'react';
import { PageShell } from '../components/PageShell';
import {
  AdminBackLink,
  EmptyAdminBox,
  ErrorBox,
  LoadingBox,
  requireDb,
} from '../components/AdminShared';
import { auth } from '../firebase';
import {
  BACKUP_COLLECTIONS,
  buildBackup,
  downloadBackup,
  getBackupPreflight,
  type BackupFile,
  type BackupPreflight,
} from '../lib/backup';
import { formatBnNumber, formatTime, friendlyAdminError, logAdminAction } from '../lib/admin';
import { getTodayUsage, QUOTAS } from '../lib/usage';

const LAST_BACKUP_KEY = 'eduvelto-last-backup-v1';

/** The two biggest collections are opt-in (review cost F2): they dominate the read cost. */
const OPT_IN_COLLECTIONS = ['users', 'progressSummaries'];

export default function AdminBackupPage() {
  const [preflight, setPreflight] = useState<BackupPreflight | null>(null);
  const [selected, setSelected] = useState<Record<string, boolean>>(() => {
    const out: Record<string, boolean> = {};
    for (const c of BACKUP_COLLECTIONS) out[c] = !OPT_IN_COLLECTIONS.includes(c);
    return out;
  });
  const [typedConfirm, setTypedConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [progress, setProgress] = useState('');
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  const [doneFile, setDoneFile] = useState<BackupFile | null>(null);

  useEffect(() => {
    try {
      setLastBackup(localStorage.getItem(LAST_BACKUP_KEY));
    } catch {
      setLastBackup(null);
    }
  }, []);

  const selectedCollections = BACKUP_COLLECTIONS.filter((c) => selected[c]);
  const overHalf = preflight !== null && preflight.readsPercent > 50;
  const typedOk = !overHalf || typedConfirm.trim().toUpperCase() === 'EXPORT';

  async function runPreflight(): Promise<void> {
    setLoading(true);
    setError('');
    setNotice('');
    try {
      const pf = await getBackupPreflight(requireDb(), selectedCollections);
      setPreflight(pf);
    } catch (e) {
      setError(friendlyAdminError(e));
    } finally {
      setLoading(false);
    }
  }

  async function runExport(): Promise<void> {
    if (!preflight) return;
    setExporting(true);
    setError('');
    setNotice('');
    setProgress('');
    try {
      const backup = await buildBackup(
        requireDb(),
        auth?.currentUser?.uid ?? 'unknown',
        selectedCollections,
        (path, n) => setProgress(`পড়া হচ্ছে: ${path} — ${formatBnNumber(n)}টি ডকুমেন্ট`),
      );
      downloadBackup(backup);
      const total = Object.values(backup.metadata.collections).reduce((a, b) => a + b, 0);
      setDoneFile(backup);
      setNotice(
        `ব্যাকআপ সংরক্ষণ হয়েছে — ${formatBnNumber(total)}টি ডকুমেন্ট। ফাইলটি নিরাপদে রাখুন, কাউকে পাঠাবেন না।`,
      );
      try {
        localStorage.setItem(LAST_BACKUP_KEY, backup.metadata.exportedAt);
        setLastBackup(backup.metadata.exportedAt);
      } catch {
        // Non-fatal.
      }
      await logAdminAction(
        requireDb(),
        'backup-exported',
        `${formatBnNumber(total)} docs, ${selectedCollections.length} collections`,
      );
    } catch (e) {
      setError(friendlyAdminError(e));
    } finally {
      setExporting(false);
      setProgress('');
    }
  }

  const usage = getTodayUsage();

  return (
    <PageShell titleBn="ব্যাকআপ" titleEn="Backup">
      <AdminBackLink />
      <p>
        ব্যাকআপ মানে ডাটাবেসের একটি কপি আপনার ফোনে সংরক্ষণ করা — যাতে কিছু মুছে গেলে ফেরত আনা
        যায়। / A backup is a copy of the database saved on your phone — so deleted data can be
        brought back.
      </p>
      <div
        style={{
          border: '1px solid #F1B308',
          borderRadius: 8,
          padding: '12px 14px',
          background: '#FDF3D0',
          marginBottom: 12,
        }}
      >
        <strong>ব্যাকআপ শুধু হাতে করা যায় — স্বয়ংক্রিয় ব্যাকআপ নেই।</strong>
        <p style={{ margin: '6px 0 0' }}>
          আপনি Export না চাপলে কোনো ব্যাকআপ হয় না। অন্তত সপ্তাহে একবার Export করুন, আর বড়
          পরিবর্তনের আগে অবশ্যই করুন। / Backups are manual only — there is no automatic backup.
          Export at least weekly, and always before a big change.
        </p>
        <p style={{ margin: '6px 0 0' }}>
          শেষ ব্যাকআপ:{' '}
          {lastBackup ? formatTime(lastBackup) : 'এখনো কোনো ব্যাকআপ হয়নি — এখনই প্রথমটি করুন।'}
        </p>
      </div>

      <h2 style={{ fontSize: 18 }}>ধাপ ১ — খরচ দেখুন / Step 1 — see the cost</h2>
      <p style={{ color: '#555', fontSize: 14 }}>
        Export করলে প্রতিটি ডকুমেন্ট পড়তে হয় — আজকের ৫০,০০০ পড়ার কোটা থেকে কাটে। আগে খরচ
        দেখুন, তারপর সিদ্ধান্ত নিন। / Exporting reads every document — it counts against
        today&apos;s 50,000-read quota. See the cost first.
      </p>
      <h3 style={{ fontSize: 16 }}>কোন সংগ্রহগুলো থাকবে? / Which collections?</h3>
      <p style={{ color: '#555', fontSize: 14 }}>
        users ও progressSummaries সবচেয়ে বড় — তাই ডিফল্টে বন্ধ থাকে; চাইলে টিক দিন। / users and
        progressSummaries are the biggest — off by default; tick to include them.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {BACKUP_COLLECTIONS.map((c) => (
          <label
            key={c}
            style={{
              display: 'inline-flex',
              gap: 6,
              alignItems: 'center',
              minHeight: 44,
              padding: '6px 10px',
              border: '1px solid #ddd',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            <input
              type="checkbox"
              checked={selected[c] ?? false}
              onChange={(e) => setSelected((p) => ({ ...p, [c]: e.target.checked }))}
              style={{ width: 20, height: 20, accentColor: '#1E7CE8' }}
            />
            <span lang="en">{c}</span>
          </label>
        ))}
      </div>
      <button
        type="button"
        onClick={() => void runPreflight()}
        disabled={loading || selectedCollections.length === 0}
        style={{
          marginTop: 12,
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
        {loading ? 'গুনছি…' : 'খরচ দেখুন / See the cost'}
      </button>

      {preflight ? (
        <>
          <h2 style={{ fontSize: 18, marginTop: 24 }}>ধাপ ২ — নিশ্চিত করুন / Step 2 — confirm</h2>
          <p style={{ fontSize: 16 }}>
            এই Export পড়বে <strong>{formatBnNumber(preflight.total)}টি ডকুমেন্ট</strong> — আজকের
            কোটার <strong>{preflight.readsPercent.toFixed(1)}%</strong>। / This export will read{' '}
            {preflight.total} documents — {preflight.readsPercent.toFixed(1)}% of today&apos;s
            quota.
          </p>
          <ul style={{ color: '#555', fontSize: 14 }}>
            {preflight.perCollection
              .filter((c) => c.count > 0)
              .map((c) => (
                <li key={c.path}>
                  <span lang="en">{c.path}</span>: {formatBnNumber(c.count)}টি
                </li>
              ))}
          </ul>
          <p style={{ color: '#555', fontSize: 14 }}>
            আজ ইতিমধ্যে এই ব্রাউজার থেকে পড়া হয়েছে (আনুমানিক):{' '}
            {formatBnNumber(usage.firestoreReads)} / {formatBnNumber(QUOTAS.firestoreReadsPerDay)}
          </p>
          {overHalf ? (
            <div
              style={{
                border: '1px solid #b00020',
                borderRadius: 8,
                padding: '12px 14px',
                background: '#fdf0f0',
                marginBottom: 12,
              }}
            >
              <strong style={{ color: '#b00020' }}>
                সতর্কতা: এই Export আজকের কোটার অর্ধেকের বেশি খরচ করবে।
              </strong>
              <p style={{ margin: '6px 0' }}>
                এগোতে চাইলে নিচে <span lang="en">EXPORT</span> লিখুন। অথবা কিছু সংগ্রহ বাদ দিয়ে
                ছোট Export করুন, বা কাল করুন। / To proceed, type <span lang="en">EXPORT</span>{' '}
                below. Or uncheck some collections, or do it tomorrow.
              </p>
              <input
                type="text"
                value={typedConfirm}
                onChange={(e) => setTypedConfirm(e.target.value)}
                placeholder="EXPORT লিখুন"
                aria-label="EXPORT লিখে নিশ্চিত করুন"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '12px 10px',
                  minHeight: 48,
                  fontSize: 16,
                  borderRadius: 8,
                  border: '1px solid #888',
                }}
              />
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => void runExport()}
            disabled={exporting || !typedOk}
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
            {exporting ? 'সংরক্ষণ হচ্ছে…' : 'ধাপ ৩ — ব্যাকআপ সংরক্ষণ করুন / Export backup'}
          </button>
          {progress ? (
            <p aria-live="polite" style={{ color: '#555' }}>
              {progress}
            </p>
          ) : null}
        </>
      ) : null}

      {loading ? <LoadingBox /> : null}
      {error ? <ErrorBox message={error} /> : null}
      {notice ? (
        <p role="status" style={{ color: '#0A1F44', fontWeight: 700 }}>
          {notice}
        </p>
      ) : null}
      {doneFile ? (
        <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: '12px 14px', marginTop: 12 }}>
          <p style={{ margin: '0 0 6px' }}>
            ফাইল সংরক্ষিত হয়েছে — {formatTime(doneFile.metadata.exportedAt)}
          </p>
          <p style={{ margin: 0, color: '#b00020' }}>
            এই ফাইলে সব শিক্ষার্থী ও শিক্ষকের তথ্য আছে। নিরাপদে রাখুন, কখনো কাউকে পাঠাবেন না,
            দ্বিতীয় কপি রাখুন। / This file contains all student and teacher data. Store it
            safely, never share it, keep a second copy.
          </p>
          <p style={{ margin: '6px 0 0', color: '#555', fontSize: 14 }}>
            এই ব্যাকআপে সাব-সংগ্রহ (কুইজের উত্তর, মন্তব্য, অর্জন) নেই — শুধু মূল সংগ্রহগুলো আছে।
            সম্পূর্ণ কপির জন্য Firebase console export ব্যবহার করুন। / Sub-collections (quiz
            attempts, comments, achievements) are NOT in this file — top-level collections only.
            Use the Firebase console export for a complete copy.
          </p>
        </div>
      ) : null}

      <h2 style={{ fontSize: 18, marginTop: 28 }}>ফেরত আনা (Restore) — কীভাবে? / How to restore?</h2>
      <EmptyAdminBox
        bn="এই পাতায় Restore বোতাম নেই — ইচ্ছাকৃত।"
        en="There is no Restore button on this page — by design."
        nextBn="নিচের পদ্ধতি অনুসরণ করুন।"
      />
      <p>
        ফোনের ব্রাউজার থেকে Restore করলে মুছে যাওয়া ডকুমেন্ট ফেরত আসে না (নিয়ম আটকায়), আর
        অর্ধেক Restore হলে ডাটাবেস অর্ধেক পুরনো + অর্ধেক নতুন হয়ে যায়। তাই Restore করতে হয়
        নিরাপদ পদ্ধতিতে:
      </p>
      <ol style={{ lineHeight: 1.7 }}>
        <li>
          <strong>প্রথমে বর্তমান অবস্থার ব্যাকআপ নিন</strong> (উপরের ধাপগুলো) — Restore-এর আগে
          এখন যা আছে তার কপি রাখুন।
        </li>
        <li>
          <strong>Firebase console → Firestore → Export/Import</strong> থেকে Restore করুন, অথবা
          ডেভেলপার (Muse)-কে ব্যাকআপ ফাইলটি পাঠিয়ে Admin SDK দিয়ে Restore করান।
        </li>
        <li>
          Restore-এর পর সংখ্যা মিলিয়ে দেখুন (প্রতিটি সংগ্রহে কতটি ডকুমেন্ট — ব্যাকআপ ফাইলের
          header-এ লেখা আছে)।
        </li>
        <li>
          মনে রাখবেন: পুরনো ব্যাকআপ ফেরত আনলে তার পরের নতুন তথ্য মুছে যেতে পারে — Restore-এর
          আগে ভাবুন।
        </li>
      </ol>
      <p style={{ color: '#555', fontSize: 14 }}>
        লঞ্চের আগে ব্যাকআপ + ফেরত আনার পরীক্ষা (test) করে নিতে হবে — পরীক্ষার তথ্য দিয়ে,
        আসল তথ্য দিয়ে নয়। / Backup + restore must be TESTED before launch — on test data, never
        on real data.
      </p>
    </PageShell>
  );
}
