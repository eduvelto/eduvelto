// Eduvelto — Admin: Question Paper Generator contributions (Phase 2).
//
// /admin/qpg-contributions — the review queue for teacher question
// submissions. A submission is a DRAFT (pending_review) until an
// admin decides: approve (points + coupon per the proposal rules, and
// the question enters the verified pool through the existing
// verified-question write path, with contributor attribution) or
// reject with a reason. A duplicate flag is a HINT, never an
// auto-reject — the admin decides. Approval here does NOT itself
// publish the question text into the pool: the moderator adds it via
// the verified-question path after this decision.

import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import { AlertBox, Button, Card } from '../components/ui';
import { AdminBackLink, EmptyAdminBox, LoadingBox, requireDb } from '../components/AdminShared';
import { QPG_VERIFIED_POOL } from '../lib/questionPaper';
import {
  QPG_CONTRIBUTION_REJECT_REASONS,
  findPossibleDuplicates,
  type QpgContributionRejectReason,
} from '../lib/qpgContributions';
import {
  decideQpgContribution,
  loadContributionReviewQueue,
  type QpgContributionRow,
} from '../lib/qpgFirestore';
import { friendlyAdminError } from '../lib/admin';

export default function AdminQpgContributionsPage() {
  const { user } = useAuth();
  const uid = user?.uid ?? '';
  const [rows, setRows] = useState<QpgContributionRow[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<Record<string, QpgContributionRejectReason>>({});
  const [rejectNote, setRejectNote] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [doneMsg, setDoneMsg] = useState<string | null>(null);

  const reload = async () => {
    setRows(null);
    setLoadError(false);
    try {
      setRows(await loadContributionReviewQueue(requireDb()));
    } catch {
      setLoadError(true);
    }
  };

  useEffect(() => {
    let alive = true;
    void loadContributionReviewQueue(requireDb())
      .then((r) => {
        if (alive) setRows(r);
      })
      .catch(() => {
        if (alive) setLoadError(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  const decide = async (row: QpgContributionRow, decision: 'approved' | 'rejected') => {
    if (decision === 'rejected' && !rejectReason[row.id]) {
      setError('বাতিলের কারণ বেছে নিন।');
      return;
    }
    setBusyId(row.id);
    setError(null);
    setDoneMsg(null);
    try {
      await decideQpgContribution(requireDb(), {
        contributionId: row.id,
        adminUid: uid,
        decision,
        rejectReason: decision === 'rejected' ? rejectReason[row.id] : undefined,
        rejectNote: decision === 'rejected' ? (rejectNote[row.id] ?? '').trim() || undefined : undefined,
      });
      setDoneMsg(
        decision === 'approved'
          ? 'অনুমোদিত — পয়েন্ট ও কুপন দেওয়া হয়েছে। প্রশ্নটি যাচাইকৃত পুলে যোগ করতে ভেরিফায়েড-প্রশ্ন পথে লিখুন (অবদানকারীর নামসহ)।'
          : 'বাতিল হয়েছে।',
      );
      await reload();
    } catch (err) {
      setError(friendlyAdminError(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="ev-qpg-theme" style={{ padding: '4px 0' }}>
      <AdminBackLink />
      <h1 style={{ fontSize: 22, margin: '8px 0 4px' }}>প্রশ্নপত্র জেনারেটর — অবদান পর্যালোচনা</h1>
      <p style={{ fontSize: 13, color: '#555', margin: '0 0 12px' }}>
        জমা দেওয়া প্রশ্ন যাচাই করুন — উত্তর সঠিক কি না, বইয়ের লেখা হুবহু কপি কি না, বোর্ড-প্রশ্ন দাবির উৎস
        আছে কি না। অনুমোদন মানে প্রশ্নটি যাচাইকৃত পুলে যাওয়ার যোগ্য — পুলে লেখা আলাদা ধাপে (অবদানকারীর
        নামসহ) করতে হবে।
      </p>
      {error ? <AlertBox tone="error">{error}</AlertBox> : null}
      {doneMsg ? <AlertBox tone="ok">{doneMsg}</AlertBox> : null}
      {loadError ? (
        <AlertBox tone="error">জমা আনা যায়নি — আবার চেষ্টা করুন।</AlertBox>
      ) : rows === null ? (
        <LoadingBox label="জমা আনা হচ্ছে…" />
      ) : rows.length === 0 ? (
        <EmptyAdminBox bn="পর্যালোচনার অপেক্ষায় কোনো জমা নেই।" en="No submissions awaiting review." />
      ) : (
        rows.map((r) => {
          const dups = findPossibleDuplicates(r.questionText, QPG_VERIFIED_POOL);
          const queueDups = (rows ?? []).filter((o) => o.id !== r.id && o.questionText.trim() === r.questionText.trim());
          return (
            <Card key={r.id} style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 14, margin: '0 0 4px' }}>{r.questionText}</p>
              {r.type === 'mcq' ? (
                <ol style={{ fontSize: 13, margin: '0 0 8px', paddingLeft: 20 }}>
                  {r.options.map((o, i) => (
                    <li key={i} style={{ fontWeight: r.correctAnswer === i ? 700 : 400 }}>
                      {o}
                      {r.correctAnswer === i ? ' ✓' : ''}
                    </li>
                  ))}
                </ol>
              ) : (
                <p style={{ fontSize: 13, margin: '0 0 8px' }}>মডেল উত্তর: {String(r.correctAnswer)}</p>
              )}
              <p style={{ fontSize: 13, margin: '0 0 4px' }}>ব্যাখ্যা: {r.explanation}</p>
              <p style={{ fontSize: 12, color: '#666', margin: '0 0 4px' }}>
                {r.contributorName}
                {r.institution ? ` (${r.institution})` : ''} · {r.stream === 'madrasah' ? 'মাদ্রাসা' : 'সাধারণ'} ·{' '}
                {r.classId} · {r.subjectId} · {r.chapterId} · টপিক: {r.topic} · {r.type} · {r.difficulty}
                {r.source ? ` · উৎস: ${r.source}` : ''}
              </p>
              <p style={{ fontSize: 12, color: '#666', margin: '0 0 8px' }}>
                জমা: {new Date(r.createdAt).toLocaleString('bn-BD')}
                {r.ownWordingConfirmed ? ' · নিজের ভাষায় লেখা (নিশ্চিত)' : ' · নিজের ভাষার নিশ্চয়তা নেই!'}
              </p>
              {dups.length > 0 ? (
                <AlertBox tone="error">
                  ⚠ যাচাইকৃত পুলে {dups.length}টি কাছাকাছি প্রশ্ন আছে — ডুপ্লিকেট হলে অনুমোদন করবেন না।
                </AlertBox>
              ) : null}
              {queueDups.length > 0 ? (
                <AlertBox tone="error">⚠ এই সারিতেই একই প্রশ্ন আরও {queueDups.length} বার জমা হয়েছে।</AlertBox>
              ) : null}
              {!r.ownWordingConfirmed ? (
                <AlertBox tone="error">নিজের ভাষায় লেখার নিশ্চয়তা ছাড়া জমা — বইয়ের কপি কি না যাচাই করুন।</AlertBox>
              ) : null}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 8 }}>
                <Button onClick={() => void decide(r, 'approved')} disabled={busyId === r.id}>
                  অনুমোদন করুন
                </Button>
                <select
                  value={rejectReason[r.id] ?? ''}
                  onChange={(e) =>
                    setRejectReason((prev) => ({ ...prev, [r.id]: e.target.value as QpgContributionRejectReason }))
                  }
                  aria-label="বাতিলের কারণ"
                  style={{ padding: 8 }}
                >
                  <option value="">বাতিলের কারণ…</option>
                  {QPG_CONTRIBUTION_REJECT_REASONS.map((reason) => (
                    <option key={reason.id} value={reason.id}>
                      {reason.nameBn}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={rejectNote[r.id] ?? ''}
                  onChange={(e) => setRejectNote((prev) => ({ ...prev, [r.id]: e.target.value }))}
                  placeholder="মন্তব্য (ঐচ্ছিক)"
                  style={{ padding: 8, minWidth: 180 }}
                />
                <Button variant="outline" onClick={() => void decide(r, 'rejected')} disabled={busyId === r.id}>
                  বাতিল করুন
                </Button>
              </div>
            </Card>
          );
        })
      )}
    </div>
  );
}
