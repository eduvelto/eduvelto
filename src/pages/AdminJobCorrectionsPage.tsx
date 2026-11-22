// Eduvelto — Admin: correction inbox (Step 15).
//
// /admin/jobs/corrections — triage for jobCorrections. A
// correction is a student's proposed fix (what's wrong + proposed
// fix + source), stored separately from the circular. Accepting a
// correction NEVER auto-applies it: the admin opens the circular
// and makes the change through the editor workflow, with the
// reason + official source link, so the change lands in
// circularHistory and (for published circulars) as an amendment.

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../lib/auth';
import { AlertBox, Button, Card } from '../components/ui';
import { AdminBackLink, EmptyAdminBox, LoadingBox } from '../components/AdminShared';
import {
  JOB_CORRECTION_STATUS_BN,
  decideJobCorrection,
  listJobCorrections,
  type JobCorrection,
  type JobCorrectionStatus,
} from '../lib/jobReports';
import { formatDhakaDate } from '../lib/jobCirculars';
import { friendlyAdminError } from '../lib/admin';

const STATUS_TABS: ('pending' | 'accepted' | 'rejected' | 'all')[] = ['pending', 'accepted', 'rejected', 'all'];

export default function AdminJobCorrectionsPage() {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const uid = user?.uid ?? '';
  const [status, setStatus] = useState<JobCorrectionStatus | 'all'>('pending');
  const [corrections, setCorrections] = useState<JobCorrection[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [decisionNote, setDecisionNote] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [doneMsg, setDoneMsg] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setCorrections(null);
    setLoadError(false);
    listJobCorrections({ status: status === 'all' ? null : status, pageSize: 25 })
      .then((rows) => {
        if (alive) setCorrections(rows);
      })
      .catch(() => {
        if (alive) setLoadError(true);
      });
    return () => {
      alive = false;
    };
  }, [status]);

  async function decide(c: JobCorrection, decision: 'accepted' | 'rejected') {
    const note = (decisionNote[c.docId] ?? '').trim();
    if (note.length < 10) {
      setError(
        t({
          bn: 'সিদ্ধান্তের কারণ কমপক্ষে ১০ অক্ষর লিখুন।',
          en: 'Write a decision reason of at least 10 characters.',
        }),
      );
      return;
    }
    setBusyId(c.docId);
    setError(null);
    setDoneMsg(null);
    try {
      await decideJobCorrection(c, decision, note, uid);
      setDoneMsg(
        t({
          bn: 'সংশোধনের সিদ্ধান্ত সংরক্ষিত হয়েছে — সার্কুলার নিজে থেকে বদলায়নি।',
          en: 'The correction decision was saved — the circular itself was not changed.',
        }),
      );
      setCorrections((rows) => (rows === null ? rows : rows.filter((r) => r.docId !== c.docId)));
    } catch (err) {
      setError(friendlyAdminError(err));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <AdminBackLink />
      <h1 className="ev-admin-page-title">{t({ bn: 'সংশোধনের প্রস্তাব', en: 'Correction proposals' })}</h1>
      <p style={{ fontSize: 14, marginTop: 0 }}>
        {t({
          bn: 'গ্রহণ করলেও সংশোধন স্বয়ংক্রিয়ভাবে প্রয়োগ হবে না — সার্কুলার খুলে অফিসিয়াল উৎস যাচাই করে সম্পাদকের কাজে বদলাতে হবে (কারণ + উৎসের লিংক সহ)।',
          en: 'Accepting a correction never applies it automatically — open the circular, verify the official source, and change it through the editor workflow (with reason + source link).',
        })}
      </p>

      {doneMsg ? <AlertBox tone="ok">{doneMsg}</AlertBox> : null}
      {error ? <AlertBox tone="error">{error}</AlertBox> : null}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '12px 0' }}>
        {STATUS_TABS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            aria-pressed={status === s}
            style={{
              padding: '8px 14px',
              borderRadius: 999,
              border: status === s ? '2px solid currentColor' : '1px solid var(--hatch-widget-border)',
              background: status === s ? 'var(--hatch-widget-surface-muted)' : 'transparent',
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            {s === 'all' ? t({ bn: 'সব', en: 'All' }) : JOB_CORRECTION_STATUS_BN[s as JobCorrectionStatus]}
          </button>
        ))}
      </div>

      {corrections === null && !loadError ? (
        <LoadingBox />
      ) : loadError || corrections === null ? (
        <AlertBox tone="error">
          {t({
            bn: 'সংশোধনের তালিকা আনা যায়নি। নিয়ম-পরিবর্তন এখনো না আসলে এই তালিকা ফাঁকা থাকবে — নিয়ম এলে আবার দেখুন।',
            en: 'The correction list could not be loaded. If the rules update has not landed yet this list stays empty — check again after the rules deploy.',
          })}
        </AlertBox>
      ) : corrections.length === 0 ? (
        <EmptyAdminBox
          bn="এই অবস্থায় কোনো সংশোধনের প্রস্তাব নেই।"
          en="No correction proposals in this state."
          nextBn="নতুন প্রস্তাব এলে এখানে দেখাবে।"
          nextEn="New proposals will show here."
        />
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {corrections.map((c) => (
            <Card key={c.docId}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                <strong style={{ fontSize: 15 }}>
                  {c.targetType === 'jobCircular' ? (
                    <Link to={`/jobs/circulars/${c.targetId}`} target="_blank" rel="noreferrer">
                      {c.targetId}
                    </Link>
                  ) : (
                    <>
                      {c.targetType} · {c.targetId}
                    </>
                  )}
                </strong>
                <span style={{ fontSize: 13, color: 'var(--muted-ivory)' }}>
                  {JOB_CORRECTION_STATUS_BN[c.status]}
                  {' · '}
                  {c.createdAtMillis !== null ? formatDhakaDate(c.createdAtMillis, lang, false) : ''}
                </span>
              </div>
              <p style={{ fontSize: 14, margin: '8px 0' }}>
                <strong>{t({ bn: 'কী ভুল', en: 'What is wrong' })}:</strong> {c.whatsWrong}
              </p>
              <p style={{ fontSize: 14, margin: '4px 0' }}>
                <strong>{t({ bn: 'প্রস্তাবিত ঠিক', en: 'Proposed fix' })}:</strong> {c.proposedFix}
              </p>
              {c.source ? (
                <p style={{ fontSize: 13, margin: '4px 0' }}>
                  <a href={c.source} target="_blank" rel="noreferrer">
                    {t({ bn: 'উৎসের লিংক', en: 'Source link' })}
                  </a>
                </p>
              ) : null}
              {c.decisionReason ? (
                <p style={{ fontSize: 13, margin: '4px 0' }}>
                  {t({ bn: 'সিদ্ধান্ত', en: 'Decision' })}: {c.decisionReason}
                </p>
              ) : null}
              {c.status === 'pending' && (
                <div style={{ marginTop: 12 }}>
                  <input
                    value={decisionNote[c.docId] ?? ''}
                    onChange={(e) => setDecisionNote((m) => ({ ...m, [c.docId]: e.target.value }))}
                    placeholder={t({ bn: 'সিদ্ধান্তের কারণ (কমপক্ষে ১০ অক্ষর)', en: 'Decision reason (at least 10 characters)' }) as string}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 8, marginBottom: 8 }}
                  />
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Button onClick={() => decide(c, 'accepted')} disabled={busyId === c.docId || (decisionNote[c.docId] ?? '').trim().length < 10}>
                      {t({ bn: 'গ্রহণ করুন', en: 'Accept' })}
                    </Button>
                    <Button onClick={() => decide(c, 'rejected')} disabled={busyId === c.docId || (decisionNote[c.docId] ?? '').trim().length < 10}>
                      {t({ bn: 'খারিজ করুন', en: 'Reject' })}
                    </Button>
                    {c.targetType === 'jobCircular' ? (
                      <Link className="ev-btn ev-btn-outline ev-btn-md" to={`/admin/jobs/circulars/${c.targetId}`}>
                        {t({ bn: 'সার্কুলার খুলুন →', en: 'Open circular →' })}
                      </Link>
                    ) : null}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
