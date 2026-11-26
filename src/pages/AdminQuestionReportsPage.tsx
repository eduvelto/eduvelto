// Eduvelto — Admin: question error reports queue (Day 3).
//
// /admin/question-reports — triage for `feedback` (type 'question-error').
// A report is a SIGNAL, never a correction: deciding it NEVER
// writes to the question itself and NEVER grants anything (no
// Pro reward in this flow).
//
// - Approve → status 'valid' + flaggedForCorrection true: the
//   QUESTION is flagged for correction; an admin then fixes it
//   separately in the question editor workflow.
// - Reject → status 'invalid' + flaggedForCorrection false.
// Only pending reports can be decided; the rules enforce the
// same transition (moderator-only, pending → valid/invalid).

import { useEffect, useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../lib/auth';
import { AlertBox, Button, Card } from '../components/ui';
import { AdminBackLink, EmptyAdminBox, LoadingBox } from '../components/AdminShared';
import {
  QUESTION_REPORT_ERROR_TYPE_BN,
  QUESTION_REPORT_STATUS_BN,
  decideQuestionReport,
  listQuestionReports,
  type QuestionReport,
  type QuestionReportStatus,
} from '../lib/feedback';
import { friendlyAdminError } from '../lib/admin';

const STATUS_TABS: ('pending' | 'valid' | 'invalid' | 'all')[] = ['pending', 'valid', 'invalid', 'all'];

export default function AdminQuestionReportsPage() {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const uid = user?.uid ?? '';
  const [status, setStatus] = useState<QuestionReportStatus | 'all'>('pending');
  const [reports, setReports] = useState<QuestionReport[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [decisionNote, setDecisionNote] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [doneMsg, setDoneMsg] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setReports(null);
    setLoadError(false);
    listQuestionReports({ status: status === 'all' ? null : status, pageSize: 25 })
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

  async function decide(report: QuestionReport, decision: 'valid' | 'invalid') {
    setBusyId(report.docId);
    setError(null);
    setDoneMsg(null);
    try {
      await decideQuestionReport(report, decision, decisionNote[report.docId] ?? '', uid);
      setDoneMsg(
        t({
          bn:
            decision === 'valid'
              ? 'রিপোর্টটি সঠিক ধরা হয়েছে — প্রশ্নটি সংশোধনের জন্য চিহ্নিত হয়েছে। প্রশ্ন নিজে থেকে বদলায়নি; সংশোধন আলাদাভাবে করতে হবে।'
              : 'রিপোর্টটি ভুল ধরা হয়েছে। প্রশ্নে কোনো পরিবর্তন হয়নি।',
          en:
            decision === 'valid'
              ? 'The report was marked valid — the question is flagged for correction. The question itself did not change; correct it separately.'
              : 'The report was marked invalid. The question was not changed.',
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
      <h1 className="ev-admin-page-title">{t({ bn: 'প্রশ্নের ভুল রিপোর্ট', en: 'Question error reports' })}</h1>
      <p style={{ fontSize: 14, marginTop: 0 }}>
        {t({
          bn: 'ছাত্রদের জানানো প্রশ্নের ভুল। রিপোর্ট একটি সংকেত — সিদ্ধান্ত নিলেও প্রশ্ন নিজে থেকে বদলায় না; সঠিক রিপোর্টের প্রশ্ন সংশোধনের জন্য চিহ্নিত হয়, সংশোধন আলাদাভাবে করতে হবে। কোনো পুরস্কার (Pro) এখান থেকে দেওয়া হয় না।',
          en: 'Errors in questions reported by students. A report is a signal — deciding it does not change the question; a valid report flags the question for correction, which is done separately. No reward (Pro) is granted from here.',
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
            {s === 'all' ? t({ bn: 'সব', en: 'All' }) : QUESTION_REPORT_STATUS_BN[s as QuestionReportStatus]}
          </button>
        ))}
      </div>

      {reports === null && !loadError ? (
        <LoadingBox />
      ) : loadError || reports === null ? (
        <AlertBox tone="error">
          {t({
            bn: 'রিপোর্ট তালিকা আনা যায়নি। নিয়ম-পরিবর্তন এখনো না আসলে এই তালিকা ফাঁকা থাকবে — নিয়ম এলে আবার দেখুন।',
            en: 'The report list could not be loaded. If the rules update has not landed yet this list stays empty — check again after the rules deploy.',
          })}
        </AlertBox>
      ) : reports.length === 0 ? (
        <EmptyAdminBox
          bn="এই অবস্থায় কোনো রিপোর্ট নেই।"
          en="No reports in this state."
          nextBn="নতুন রিপোর্ট এলে এখানে দেখাবে।"
          nextEn="New reports will show here."
        />
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {reports.map((r) => (
            <Card key={r.docId}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                <strong style={{ fontSize: 15 }}>
                  {QUESTION_REPORT_ERROR_TYPE_BN[r.errorType]}
                  {' · '}
                  {QUESTION_REPORT_STATUS_BN[r.status]}
                  {r.flaggedForCorrection ? ` · ${t({ bn: 'সংশোধনের জন্য চিহ্নিত', en: 'Flagged for correction' })}` : ''}
                </strong>
                <span style={{ fontSize: 12, color: 'var(--muted-ivory)' }}>
                  {r.createdAtMillis !== null ? new Date(r.createdAtMillis).toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-GB') : ''}
                </span>
              </div>
              <p style={{ fontSize: 14, margin: '8px 0' }}>
                <strong>{t({ bn: 'প্রশ্ন', en: 'Question' })}:</strong> {r.questionText}
              </p>
              <p style={{ fontSize: 12, color: 'var(--muted-ivory)', margin: '4px 0' }}>
                questionId: {r.questionId}
              </p>
              <p style={{ fontSize: 14, margin: '8px 0' }}>
                <strong>{t({ bn: 'বিবরণ', en: 'Description' })}:</strong> {r.description}
              </p>
              <p style={{ fontSize: 12, color: 'var(--muted-ivory)', margin: '4px 0 0' }}>
                {t({ bn: 'রিপোর্ট করেছেন', en: 'Reported by' })}: {r.reporterUid}
                {r.decidedBy ? ` · ${t({ bn: 'সিদ্ধান্ত দিয়েছেন', en: 'Decided by' })}: ${r.decidedBy}` : ''}
                {r.decisionNote ? ` · ${r.decisionNote}` : ''}
              </p>
              {r.status === 'pending' && (
                <div style={{ marginTop: 12 }}>
                  <input
                    value={decisionNote[r.docId] ?? ''}
                    onChange={(e) => setDecisionNote((m) => ({ ...m, [r.docId]: e.target.value }))}
                    placeholder={t({ bn: 'সিদ্ধান্তের মন্তব্য (ঐচ্ছিক)', en: 'Decision note (optional)' }) as string}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 8, marginBottom: 8 }}
                  />
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Button onClick={() => void decide(r, 'valid')} disabled={busyId === r.docId}>
                      {t({ bn: '✓ সঠিক — সংশোধনের জন্য চিহ্নিত করুন', en: '✓ Valid — flag for correction' })}
                    </Button>
                    <Button onClick={() => void decide(r, 'invalid')} disabled={busyId === r.docId}>
                      {t({ bn: '✗ ভুল রিপোর্ট', en: '✗ Invalid report' })}
                    </Button>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--muted-ivory)' }}>
                    {t({
                      bn: '“সঠিক” চাপলেও প্রশ্ন বদলাবে না — প্রশ্নটি শুধু সংশোধনের তালিকায় চিহ্নিত হবে।',
                      en: '“Valid” does not change the question — it only flags the question for correction.',
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
