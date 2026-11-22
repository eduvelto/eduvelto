// Eduvelto — Admin: student reports inbox (Step 15).
//
// /admin/jobs/reports — triage for jobReports. A report is a
// SIGNAL, never an official correction: deciding a report NEVER
// writes the student's suggestion into the circular. "Resolved
// (applied)" means the admin opened the circular, verified the
// fact against the official source, and updated it through the
// editor workflow (amendment + history). Multiple reports about
// the same field are a prioritisation signal, not proof.
//
// The report form itself lives on the student-facing circular
// detail page; this page is the admin inbox.

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../lib/auth';
import { AlertBox, Button, Card } from '../components/ui';
import { AdminBackLink, EmptyAdminBox, LoadingBox } from '../components/AdminShared';
import {
  JOB_REPORT_REASONS,
  JOB_REPORT_REASON_BN,
  JOB_REPORT_STATUS_BN,
  decideJobReport,
  listJobReports,
  type JobReport,
  type JobReportReason,
  type JobReportStatus,
} from '../lib/jobReports';
import { formatDhakaDate } from '../lib/jobCirculars';
import { friendlyAdminError } from '../lib/admin';

const STATUS_TABS: ('open' | 'investigating' | 'resolved' | 'dismissed' | 'all')[] = [
  'open',
  'investigating',
  'resolved',
  'dismissed',
  'all',
];

export default function AdminJobReportsPage() {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const uid = user?.uid ?? '';
  const [status, setStatus] = useState<JobReportStatus | 'all'>('open');
  const [reason, setReason] = useState<JobReportReason | 'all'>('all');
  const [reports, setReports] = useState<JobReport[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [decisionNote, setDecisionNote] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [doneMsg, setDoneMsg] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setReports(null);
    setLoadError(false);
    listJobReports({ status: status === 'all' ? null : status, pageSize: 25 })
      .then((rows) => {
        if (alive) setReports(rows);
      })
      .catch(() => {
        if (alive) setLoadError(true);
      });
    return () => {
      alive = false;
    };
  }, [status]);

  const visible = reports === null ? [] : reason === 'all' ? reports : reports.filter((r) => r.reason === reason);

  async function decide(report: JobReport, decision: 'resolved' | 'dismissed') {
    const note = (decisionNote[report.docId] ?? '').trim();
    if (note.length < 10) {
      setError(
        t({
          bn: 'সিদ্ধান্তের কারণ কমপক্ষে ১০ অক্ষর লিখুন।',
          en: 'Write a decision reason of at least 10 characters.',
        }),
      );
      return;
    }
    setBusyId(report.docId);
    setError(null);
    setDoneMsg(null);
    try {
      await decideJobReport(report, decision, note, uid);
      setDoneMsg(
        t({
          bn: 'রিপোর্টটির সিদ্ধান্ত সংরক্ষিত হয়েছে — সার্কুলার নিজে থেকে বদলায়নি।',
          en: 'The report decision was saved — the circular itself was not changed.',
        }),
      );
      setReports((rows) => (rows === null ? rows : rows.filter((r) => r.docId !== report.docId)));
    } catch (err) {
      setError(friendlyAdminError(err));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <AdminBackLink />
      <h1 className="ev-admin-page-title">{t({ bn: 'ছাত্রদের রিপোর্ট', en: 'Student reports' })}</h1>
      <p style={{ fontSize: 14, marginTop: 0 }}>
        {t({
          bn: 'রিপোর্ট একটি সংকেত — অফিসিয়াল সংশোধন নয়। একাধিক রিপোর্ট একই সমস্যা জানালেও তা প্রমাণ নয়; সার্কুলার বদলাতে হলে অফিসিয়াল উৎস যাচাই করে সম্পাদকের কাজে যেতে হবে।',
          en: 'A report is a signal — not an official correction. Even several reports about the same problem are not proof; changing a circular requires verifying the official source through the editor workflow.',
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
            {s === 'all'
              ? t({ bn: 'সব', en: 'All' })
              : JOB_REPORT_STATUS_BN[s as JobReportStatus]}
          </button>
        ))}
      </div>

      <label htmlFor="reportReason" style={{ fontSize: 13, fontWeight: 700, marginRight: 8 }}>
        {t({ bn: 'কারণ অনুযায়ী', en: 'By reason' })}
      </label>
      <select
        id="reportReason"
        value={reason}
        onChange={(e) => setReason(e.target.value as JobReportReason | 'all')}
        style={{ padding: '8px 10px', borderRadius: 8 }}
      >
        <option value="all">{t({ bn: 'সব কারণ', en: 'All reasons' })}</option>
        {JOB_REPORT_REASONS.map((r) => (
          <option key={r} value={r}>
            {JOB_REPORT_REASON_BN[r]}
          </option>
        ))}
      </select>

      {reports === null && !loadError ? (
        <LoadingBox />
      ) : loadError || reports === null ? (
        <AlertBox tone="error">
          {t({
            bn: 'রিপোর্ট তালিকা আনা যায়নি। নিয়ম-পরিবর্তন এখনো না আসলে এই তালিকা ফাঁকা থাকবে — নিয়ম এলে আবার দেখুন।',
            en: 'The report list could not be loaded. If the rules update has not landed yet this list stays empty — check again after the rules deploy.',
          })}
        </AlertBox>
      ) : visible.length === 0 ? (
        <EmptyAdminBox
          bn="এই অবস্থায় কোনো রিপোর্ট নেই।"
          en="No reports in this state."
          nextBn="নতুন রিপোর্ট এলে এখানে দেখাবে।"
          nextEn="New reports will show here."
        />
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {visible.map((r) => (
            <Card key={r.docId}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                <strong style={{ fontSize: 15 }}>
                  {r.targetType === 'jobCircular' ? (
                    <Link to={`/jobs/circulars/${r.targetId}`} target="_blank" rel="noreferrer">
                      {r.targetId}
                    </Link>
                  ) : (
                    <>
                      {r.targetType} · {r.targetId}
                    </>
                  )}
                </strong>
                <span style={{ fontSize: 13, color: 'var(--muted-ivory)' }}>
                  {JOB_REPORT_REASON_BN[r.reason]}
                  {' · '}
                  {JOB_REPORT_STATUS_BN[r.status]}
                  {' · '}
                  {r.priority === 'urgent' ? t({ bn: 'জরুরি', en: 'Urgent' }) : r.priority === 'high' ? t({ bn: 'গুরুত্বপূর্ণ', en: 'High' }) : t({ bn: 'সাধারণ', en: 'Normal' })}
                </span>
              </div>
              <p style={{ fontSize: 14, margin: '8px 0' }}>{r.details}</p>
              {r.suggestedValue ? (
                <p style={{ fontSize: 13, margin: '4px 0' }}>
                  {t({ bn: 'প্রস্তাবিত মান (যাচাই হয়নি)', en: 'Suggested value (unverified)' })}: {r.suggestedValue}
                </p>
              ) : null}
              {r.evidenceUrl ? (
                <p style={{ fontSize: 13, margin: '4px 0' }}>
                  <a href={r.evidenceUrl} target="_blank" rel="noreferrer">
                    {t({ bn: 'প্রমাণের লিংক', en: 'Evidence link' })}
                  </a>
                </p>
              ) : null}
              <p style={{ fontSize: 12, color: 'var(--muted-ivory)', margin: '4px 0 0' }}>
                {r.createdAtMillis !== null ? formatDhakaDate(r.createdAtMillis, lang, false) : ''}
                {r.resolvedBy ? ` · ${t({ bn: 'সিদ্ধান্ত দিয়েছেন', en: 'Decided by' })}: ${r.resolvedBy}` : ''}
                {r.resolutionNote ? ` · ${r.resolutionNote}` : ''}
              </p>
              {(r.status === 'open' || r.status === 'investigating') && (
                <div style={{ marginTop: 12 }}>
                  <input
                    value={decisionNote[r.docId] ?? ''}
                    onChange={(e) => setDecisionNote((m) => ({ ...m, [r.docId]: e.target.value }))}
                    placeholder={t({ bn: 'সিদ্ধান্তের কারণ (কমপক্ষে ১০ অক্ষর)', en: 'Decision reason (at least 10 characters)' }) as string}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 8, marginBottom: 8 }}
                  />
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Button onClick={() => decide(r, 'resolved')} disabled={busyId === r.docId || (decisionNote[r.docId] ?? '').trim().length < 10}>
                      {t({ bn: 'সমাধান হয়েছে', en: 'Resolved' })}
                    </Button>
                    <Button onClick={() => decide(r, 'dismissed')} disabled={busyId === r.docId || (decisionNote[r.docId] ?? '').trim().length < 10}>
                      {t({ bn: 'খারিজ করুন', en: 'Dismiss' })}
                    </Button>
                    {r.targetType === 'jobCircular' ? (
                      <Link className="ev-btn ev-btn-outline ev-btn-md" to={`/admin/jobs/circulars/${r.targetId}`}>
                        {t({ bn: 'সার্কুলার খুলুন →', en: 'Open circular →' })}
                      </Link>
                    ) : null}
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--muted-ivory)' }}>
                    {t({
                      bn: '“সমাধান হয়েছে” চাপলেও সার্কুলার বদলাবে না — সার্কুলার খুলে অফিসিয়াল উৎস যাচাই করে সম্পাদকের কাজে বদলাতে হবে।',
                      en: '“Resolved” does not change the circular — open the circular, verify the official source, and change it through the editor workflow.',
                    })}
                  </p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
