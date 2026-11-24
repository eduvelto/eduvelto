// Eduvelto — Admin: circular editor + verification workspace
// (Step 15).
//
// /admin/jobs/circulars/new — create a draft.
// /admin/jobs/circulars/:id — edit + verify + publish + history.
//
// Two-column desktop (ChatGPT's review workspace): left = the
// circular form + source/apply links + duplicate warnings +
// change history; right = the 7-point verification checklist +
// notes + decision actions. Mobile: stacked (form, checklist,
// actions).
//
// The lifecycle on our reviewStatus (reconciled — see the Step 15
// report): draft → in-review (submit) → verified (approve with
// a complete checklist) → published. Changes requested =
// in-review → draft + reviewNote. Rejected = in-review →
// rejected (kept in history, never deleted). Updated / Archived /
// Withdrawn are post-publication display states, not separate
// reviewStatus values: an updated published circular keeps its
// history in circularHistory; a superseded one is unpublished
// (rejected, with a reason) and stays readable by moderators.

import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../lib/auth';
import { AlertBox, Button, Card } from '../components/ui';
import { AdminBackLink, ConfirmDialog, EmptyAdminBox, LoadingBox } from '../components/AdminShared';
import {
  approveCircular,
  canApproveCircular,
  createAdminCircular,
  deleteCircular,
  effectiveDomainList,
  findDuplicateCirculars,
  listAdminCircularsByExam,
  listApprovedDomains,
  loadAdminCircular,
  publishCircular,
  rejectCircular,
  returnCircularForChanges,
  submitCircularForVerification,
  unpublishCircular,
  updateAdminCircular,
  updatePublishedCircular,
  validateCircularForm,
  type CircularFormData,
} from '../lib/jobAdminCirculars';
import { listCircularHistory, type CircularHistoryEntry } from '../lib/jobCircularHistory';
import {
  CHECKLIST_RESULT_BN,
  CHECKLIST_RESULT_EN,
  emptyVerificationChecklist,
  firstBlockingChecklistItem,
  formatDhakaDate,
  isCircularVerified,
  isVerificationChecklistComplete,
  VERIFICATION_CHECKLIST_BN,
  VERIFICATION_CHECKLIST_EN,
  VERIFICATION_CHECKLIST_ITEMS,
  type ChecklistResult,
  type JobCircular,
  type VerificationChecklist,
} from '../lib/jobCirculars';
import { checkOfficialDomain, domainCheckLabelBn } from '../lib/jobOfficialDomains';
import { JOB_EXAMS } from '../lib/jobExams';
import { friendlyAdminError } from '../lib/admin';

/** 'YYYY-MM-DD' in Asia/Dhaka for a millis timestamp. */
function millisToDhakaDate(millis: number): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(millis));
  return parts;
}

function millisToDhakaTime(millis: number): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Dhaka',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(millis));
}

/** 'YYYY-MM-DD' (+ optional 'HH:MM') as Asia/Dhaka millis. */
function dhakaDateToMillis(date: string, time?: string): number | null {
  if (!date) return null;
  const t = time && time.length > 0 ? time : '00:00';
  const ms = Date.parse(`${date}T${t}:00+06:00`);
  return Number.isFinite(ms) ? ms : null;
}

function formFromCircular(c: JobCircular): CircularFormData {
  return {
    examSlug: c.examSlug,
    postTitleBn: c.postTitleBn,
    postTitleEn: c.postTitleEn,
    circularNumber: c.circularNumber,
    publishedDateMillis: c.publishedDateMillis,
    applicationDeadlineMillis: c.applicationDeadlineMillis,
    deadlinePrecision: c.deadlinePrecision,
    totalPosts: c.totalPosts,
    eligibilitySummaryBn: c.eligibilitySummaryBn,
    eligibilitySummaryEn: c.eligibilitySummaryEn,
    officialUrl: c.officialUrl,
    applyUrl: c.applyUrl,
    copyStatus: c.copyStatus,
    copyTextExcerpt: c.copyTextExcerpt,
    examDateMillis: c.examDateMillis,
    applicationStartDateMillis: c.applicationStartDateMillis,
  };
}

const EMPTY_FORM: CircularFormData = {
  examSlug: 'bcs',
  postTitleBn: '',
  postTitleEn: '',
  circularNumber: null,
  publishedDateMillis: null,
  applicationDeadlineMillis: null,
  deadlinePrecision: 'date_only',
  totalPosts: null,
  eligibilitySummaryBn: '',
  eligibilitySummaryEn: '',
  officialUrl: '',
  applyUrl: null,
  copyStatus: 'link-only',
  copyTextExcerpt: null,
  examDateMillis: null,
  applicationStartDateMillis: null,
};

type Action =
  | 'save'
  | 'submit'
  | 'approve'
  | 'return'
  | 'reject'
  | 'publish'
  | 'unpublish'
  | 'delete'
  | 'update-published';

const RESULT_OPTIONS: ChecklistResult[] = ['pass', 'fail', 'uncertain', 'na'];

export default function AdminJobCircularEditPage() {
  const { t, lang } = useLanguage();
  const { user, profile } = useAuth();
  const { circularId } = useParams<{ circularId: string }>();
  const navigate = useNavigate();
  const isNew = circularId === 'new';
  const uid = user?.uid ?? '';
  const isOwner = profile?.role === 'owner';

  const [circular, setCircular] = useState<JobCircular | null | undefined>(undefined);
  const [form, setForm] = useState<CircularFormData>(EMPTY_FORM);
  const [checklist, setChecklist] = useState<VerificationChecklist>(emptyVerificationChecklist());
  const [verificationNote, setVerificationNote] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [returnNote, setReturnNote] = useState('');
  const [changeReason, setChangeReason] = useState('');
  const [changeSource, setChangeSource] = useState('');
  const [sameExam, setSameExam] = useState<JobCircular[]>([]);
  const [history, setHistory] = useState<CircularHistoryEntry[]>([]);
  const [domainRows, setDomainRows] = useState<Awaited<ReturnType<typeof listApprovedDomains>>>(null);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<Action | null>(null);
  const [doneMsg, setDoneMsg] = useState<string | null>(null);
  const [historyPending, setHistoryPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);

  // Deadline inputs (date + optional time) — kept as strings so
  // the form never shifts the day through the browser timezone.
  const [deadlineDate, setDeadlineDate] = useState('');
  const [deadlineTime, setDeadlineTime] = useState('');
  const [publishedDate, setPublishedDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [examDate, setExamDate] = useState('');

  useEffect(() => {
    let alive = true;
    setCircular(undefined);
    setLoadError(false);
    if (isNew) {
      setCircular(null);
      return;
    }
    if (!circularId) {
      setCircular(null);
      return;
    }
    loadAdminCircular(circularId)
      .then(async (c) => {
        if (!alive) return;
        setCircular(c);
        if (c) {
          setForm(formFromCircular(c));
          setChecklist(c.verificationChecklist ?? emptyVerificationChecklist());
          setDeadlineDate(c.applicationDeadlineMillis !== null ? millisToDhakaDate(c.applicationDeadlineMillis) : '');
          setDeadlineTime(
            c.applicationDeadlineMillis !== null && c.deadlinePrecision === 'datetime'
              ? millisToDhakaTime(c.applicationDeadlineMillis)
              : '',
          );
          setPublishedDate(c.publishedDateMillis !== null ? millisToDhakaDate(c.publishedDateMillis) : '');
          setStartDate(c.applicationStartDateMillis !== null ? millisToDhakaDate(c.applicationStartDateMillis) : '');
          setExamDate(c.examDateMillis !== null ? millisToDhakaDate(c.examDateMillis) : '');
          const [same, hist, domains] = await Promise.all([
            listAdminCircularsByExam(c.examSlug),
            listCircularHistory(c.docId),
            listApprovedDomains(),
          ]);
          if (!alive) return;
          setSameExam(same);
          setHistory(hist);
          setDomainRows(domains);
        }
      })
      .catch(() => {
        if (alive) setLoadError(true);
      });
    return () => {
      alive = false;
    };
  }, [circularId, isNew]);

  // Keep the form's millis fields in sync with the date inputs.
  useEffect(() => {
    setForm((f) => ({ ...f, applicationDeadlineMillis: dhakaDateToMillis(deadlineDate, deadlineTime) }));
  }, [deadlineDate, deadlineTime]);
  useEffect(() => {
    setForm((f) => ({ ...f, publishedDateMillis: dhakaDateToMillis(publishedDate) }));
  }, [publishedDate]);
  useEffect(() => {
    setForm((f) => ({ ...f, applicationStartDateMillis: dhakaDateToMillis(startDate) }));
  }, [startDate]);
  useEffect(() => {
    setForm((f) => ({ ...f, examDateMillis: dhakaDateToMillis(examDate) }));
  }, [examDate]);

  const duplicates = useMemo(() => {
    if (!form.examSlug || (!form.postTitleBn.trim() && !form.postTitleEn.trim())) return [];
    return findDuplicateCirculars(
      {
        examSlug: form.examSlug,
        circularNumber: form.circularNumber,
        publishedDateMillis: form.publishedDateMillis,
        postTitleBn: form.postTitleBn,
        postTitleEn: form.postTitleEn,
        applicationDeadlineMillis: form.applicationDeadlineMillis,
      },
      sameExam,
      circular?.docId ?? null,
    );
  }, [form, sameExam, circular]);

  const effectiveList = useMemo(() => effectiveDomainList(domainRows), [domainRows]);
  const officialCheck = useMemo(() => checkOfficialDomain(form.officialUrl, effectiveList), [form.officialUrl, effectiveList]);
  const applyCheck = useMemo(
    () => (form.applyUrl ? checkOfficialDomain(form.applyUrl, effectiveList) : null),
    [form.applyUrl, effectiveList],
  );
  const formProblems = useMemo(() => validateCircularForm(form), [form]);
  const checklistComplete = isVerificationChecklistComplete(checklist);
  const blockingItem = firstBlockingChecklistItem(checklist);
  const guard = circular ? canApproveCircular(circular, uid, isOwner, overrideReason) : { allowed: false, reasonBn: null };
  const isPublished = circular?.reviewStatus === 'published';

  async function runAction(action: Action): Promise<void> {
    if (!uid) return;
    setBusy(true);
    setError(null);
    setDoneMsg(null);
    setHistoryPending(false);
    try {
      if (action === 'save' && isNew) {
        const { docId } = await createAdminCircular(form, uid);
        setDoneMsg(t({ bn: 'খসড়া সংরক্ষিত হয়েছে।', en: 'Draft saved.' }));
        navigate(`/admin/jobs/circulars/${docId}`, { replace: true });
        return;
      }
      if (!circular) throw new Error('Circular not loaded.');
      if (action === 'save') {
        const reset = circular.reviewStatus === 'rejected';
        const { circular: updated, historyPending: hp } = await updateAdminCircular(circular, form, uid, {
          resetToDraft: reset,
        });
        setCircular(updated);
        setHistoryPending(hp);
        setDoneMsg(
          reset
            ? t({ bn: 'সংরক্ষিত হয়েছে — বিজ্ঞপ্তিটি আবার খসড়া অবস্থায় গেল।', en: 'Saved — the circular is a draft again.' })
            : t({ bn: 'সংরক্ষিত হয়েছে।', en: 'Saved.' }),
        );
      } else if (action === 'update-published') {
        const { circular: updated, historyPending: hp } = await updatePublishedCircular(
          circular,
          form,
          changeReason,
          changeSource,
          uid,
        );
        setCircular(updated);
        setHistoryPending(hp);
        setChangeReason('');
        setChangeSource('');
        setDoneMsg(t({ bn: 'প্রকাশিত বিজ্ঞপ্তি হালনাগাদ হয়েছে — পুরোনো তথ্য ইতিহাসে আছে।', en: 'Published circular updated — the old values are in the history.' }));
        const hist = await listCircularHistory(circular.docId);
        setHistory(hist);
      } else if (action === 'submit') {
        const r = await submitCircularForVerification(circular, uid);
        setHistoryPending(r.historyPending);
        const updated = await loadAdminCircular(circular.docId);
        if (updated) setCircular(updated);
        setDoneMsg(t({ bn: 'যাচাইয়ের জন্য পাঠানো হয়েছে।', en: 'Submitted for verification.' }));
      } else if (action === 'approve') {
        const r = await approveCircular(circular, checklist, verificationNote, uid, isOwner, overrideReason);
        setHistoryPending(r.historyPending);
        const updated = await loadAdminCircular(circular.docId);
        if (updated) setCircular(updated);
        setDoneMsg(t({ bn: 'যাচাইকৃত হয়েছে — এখন প্রকাশ করা যাবে।', en: 'Verified — it can now be published.' }));
      } else if (action === 'return') {
        const r = await returnCircularForChanges(circular, returnNote, uid);
        setHistoryPending(r.historyPending);
        const updated = await loadAdminCircular(circular.docId);
        if (updated) setCircular(updated);
        setReturnNote('');
        setDoneMsg(t({ bn: 'সংশোধনের জন্য ফেরত পাঠানো হয়েছে।', en: 'Returned for changes.' }));
      } else if (action === 'reject') {
        const r = await rejectCircular(circular, returnNote, uid);
        setHistoryPending(r.historyPending);
        const updated = await loadAdminCircular(circular.docId);
        if (updated) setCircular(updated);
        setReturnNote('');
        setDoneMsg(t({ bn: 'বিজ্ঞপ্তিটি বাতিল হয়েছে (ইতিহাসে থাকবে)।', en: 'The circular was rejected (it stays in history).' }));
      } else if (action === 'publish') {
        const r = await publishCircular(circular, uid);
        setHistoryPending(r.historyPending);
        const updated = await loadAdminCircular(circular.docId);
        if (updated) setCircular(updated);
        setDoneMsg(t({ bn: 'বিজ্ঞপ্তি প্রকাশিত হয়েছে।', en: 'The circular is published.' }));
      } else if (action === 'unpublish') {
        const r = await unpublishCircular(circular, returnNote, uid);
        setHistoryPending(r.historyPending);
        const updated = await loadAdminCircular(circular.docId);
        if (updated) setCircular(updated);
        setReturnNote('');
        setDoneMsg(t({ bn: 'বিজ্ঞপ্তি প্রত্যাহার হয়েছে।', en: 'The circular was withdrawn.' }));
      } else if (action === 'delete') {
        await deleteCircular(circular, returnNote, uid);
        navigate('/admin/jobs/circulars?tab=all', { replace: true });
        return;
      }
      setConfirm(null);
    } catch (e) {
      setError(friendlyAdminError(e, lang));
      setConfirm(null);
    } finally {
      setBusy(false);
    }
  }

  const setChecklistResult = (item: (typeof VERIFICATION_CHECKLIST_ITEMS)[number], result: ChecklistResult) => {
    setChecklist((c) => ({ ...c, [item]: result }));
  };
  const setChecklistNote = (item: (typeof VERIFICATION_CHECKLIST_ITEMS)[number], note: string) => {
    setChecklist((c) => ({ ...c, notes: { ...c.notes, [item]: note } }));
  };

  if (circular === undefined) {
    return (
      <div>
        <AdminBackLink />
        <LoadingBox />
      </div>
    );
  }
  if (loadError || (!isNew && circular === null)) {
    return (
      <div>
        <AdminBackLink />
        <AlertBox tone="error">
          {t({
            bn: 'বিজ্ঞপ্তিটি পাওয়া যায়নি — এটি মুছে ফেলা হয়েছে বা এখনো তৈরি হয়নি।',
            en: 'Circular not found — it was deleted or was never created.',
          })}
        </AlertBox>
      </div>
    );
  }

  const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 12px', fontSize: 15, borderRadius: 8 };
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 700, margin: '14px 0 4px' };

  return (
    <div>
      <AdminBackLink />
      <h1 className="ev-admin-page-title">
        {isNew
          ? t({ bn: 'নতুন সার্কুলার', en: 'New circular' })
          : t({ bn: 'সার্কুলার সম্পাদনা ও যাচাই', en: 'Edit & verify circular' })}
      </h1>

      {circular && circular.reviewNote ? (
        <AlertBox tone="info">
          {t({ bn: 'ফেরতের কারণ', en: 'Return reason' })}: {circular.reviewNote}
        </AlertBox>
      ) : null}
      {doneMsg ? <AlertBox tone="ok">{doneMsg}</AlertBox> : null}
      {historyPending ? (
        <AlertBox tone="info">
          {t({
            bn: 'পরিবর্তনের ইতিহাস সংরক্ষণ করা যায়নি — নিয়ম-পরিবর্তন এখনো আসেনি (অ্যাডমিন-লগে কাজটি আছে)। নিয়ম এলে ইতিহাস আবার লেখা যাবে।',
            en: 'The change history could not be saved yet — the rules update has not landed (the action is in the admin log). History will be writable after the rules deploy.',
          })}
        </AlertBox>
      ) : null}
      {error ? <AlertBox tone="error">{error}</AlertBox> : null}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, alignItems: 'start' }}>
        {/* ---- Left: the circular form ---- */}
        <Card>
          <h2 style={{ fontSize: 16, marginTop: 0 }}>{t({ bn: 'বিজ্ঞপ্তির তথ্য', en: 'Circular details' })}</h2>

          <label style={labelStyle} htmlFor="examSlug">
            {t({ bn: 'পরীক্ষা', en: 'Exam' })}
          </label>
          <select
            id="examSlug"
            value={form.examSlug}
            onChange={(e) => setForm((f) => ({ ...f, examSlug: e.target.value }))}
            style={inputStyle}
          >
            {JOB_EXAMS.map((e) => (
              <option key={e.slug} value={e.slug}>
                {e.bn} ({e.en})
              </option>
            ))}
          </select>

          <label style={labelStyle} htmlFor="postTitleBn">
            {t({ bn: 'পদ / শিরোনাম (বাংলা)', en: 'Post / title (Bangla)' })}
          </label>
          <input
            id="postTitleBn"
            value={form.postTitleBn}
            onChange={(e) => setForm((f) => ({ ...f, postTitleBn: e.target.value }))}
            style={inputStyle}
          />

          <label style={labelStyle} htmlFor="postTitleEn">
            {t({ bn: 'পদ / শিরোনাম (English)', en: 'Post / title (English)' })}
          </label>
          <input
            id="postTitleEn"
            value={form.postTitleEn}
            onChange={(e) => setForm((f) => ({ ...f, postTitleEn: e.target.value }))}
            style={inputStyle}
          />

          <label style={labelStyle} htmlFor="circularNumber">
            {t({ bn: 'স্মারক নম্বর (না থাকলে ফাঁকা)', en: 'Memo / circular number (blank if none)' })}
          </label>
          <input
            id="circularNumber"
            value={form.circularNumber ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, circularNumber: e.target.value.trim().length === 0 ? null : e.target.value }))}
            style={inputStyle}
          />

          <label style={labelStyle} htmlFor="publishedDate">
            {t({ bn: 'প্রকাশের তারিখ', en: 'Published date' })}
          </label>
          <input
            id="publishedDate"
            type="date"
            value={publishedDate}
            onChange={(e) => setPublishedDate(e.target.value)}
            style={inputStyle}
          />

          <label style={labelStyle} htmlFor="startDate">
            {t({ bn: 'আবেদন শুরুর তারিখ', en: 'Application start date' })}
          </label>
          <input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={inputStyle}
          />

          <label style={labelStyle} htmlFor="deadlineDate">
            {t({ bn: 'আবেদনের শেষ তারিখ', en: 'Application deadline' })}
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              id="deadlineDate"
              type="date"
              value={deadlineDate}
              onChange={(e) => setDeadlineDate(e.target.value)}
              style={{ ...inputStyle, flex: 1 }}
            />
            <input
              type="time"
              value={deadlineTime}
              onChange={(e) => setDeadlineTime(e.target.value)}
              style={{ ...inputStyle, flex: 1 }}
              aria-label={t({ bn: 'শেষ সময় (যদি বিজ্ঞপ্তিতে থাকে)', en: 'Closing time (if the notice states one)' })}
            />
          </div>
          <label style={labelStyle} htmlFor="deadlinePrecision">
            {t({ bn: 'শেষ তারিখের ধরন', en: 'Deadline precision' })}
          </label>
          <select
            id="deadlinePrecision"
            value={form.deadlinePrecision}
            onChange={(e) =>
              setForm((f) => ({ ...f, deadlinePrecision: e.target.value as 'date_only' | 'datetime' }))
            }
            style={inputStyle}
          >
            <option value="date_only">
              {t({ bn: 'শুধু তারিখ (সময় উল্লেখ নেই — দিনের শেষে বন্ধ)', en: 'Date only (no time stated — closes at end of day)' })}
            </option>
            <option value="datetime">
              {t({ bn: 'তারিখ + সময় (বিজ্ঞপ্তিতে সময় আছে)', en: 'Date + time (the notice states a time)' })}
            </option>
          </select>
          <p style={{ fontSize: 12, color: 'var(--muted-ivory)', margin: '4px 0 0' }}>
            {t({
              bn: 'সময় না থাকলে কখনো ১১:৫৯ PM বানিয়ে লিখবেন না — তারিখটাই সত্য। সব তারিখ এশিয়া/ঢাকা।',
              en: 'Never invent 11:59 PM when no time is stated — the date alone is the truth. All dates are Asia/Dhaka.',
            })}
          </p>

          <label style={labelStyle} htmlFor="totalPosts">
            {t({ bn: 'পদসংখ্যা (না থাকলে ফাঁকা — “উল্লেখ নেই” দেখাবে)', en: 'Total posts (blank if not stated — shows “not stated”)' })}
          </label>
          <input
            id="totalPosts"
            type="number"
            min={0}
            value={form.totalPosts ?? ''}
            onChange={(e) =>
              setForm((f) => ({ ...f, totalPosts: e.target.value.trim() === '' ? null : Number(e.target.value) }))
            }
            style={inputStyle}
          />

          <label style={labelStyle} htmlFor="eligibilitySummaryBn">
            {t({ bn: 'যোগ্যতার সারাংশ (বাংলা)', en: 'Eligibility summary (Bangla)' })}
          </label>
          <textarea
            id="eligibilitySummaryBn"
            value={form.eligibilitySummaryBn}
            onChange={(e) => setForm((f) => ({ ...f, eligibilitySummaryBn: e.target.value }))}
            rows={3}
            style={inputStyle}
          />

          <label style={labelStyle} htmlFor="eligibilitySummaryEn">
            {t({ bn: 'যোগ্যতার সারাংশ (English)', en: 'Eligibility summary (English)' })}
          </label>
          <textarea
            id="eligibilitySummaryEn"
            value={form.eligibilitySummaryEn}
            onChange={(e) => setForm((f) => ({ ...f, eligibilitySummaryEn: e.target.value }))}
            rows={3}
            style={inputStyle}
          />

          <label style={labelStyle} htmlFor="officialUrl">
            {t({ bn: 'অফিসিয়াল বিজ্ঞপ্তির লিংক', en: 'Official notice link' })}
          </label>
          <input
            id="officialUrl"
            type="url"
            value={form.officialUrl}
            onChange={(e) => setForm((f) => ({ ...f, officialUrl: e.target.value }))}
            style={inputStyle}
          />
          {form.officialUrl.trim().length > 0 ? (
            <p style={{ fontSize: 13, margin: '6px 0 0' }}>
              {domainCheckLabelBn(officialCheck)}
              {domainRows === null ? ` (${t({ bn: 'কোডের তালিকা থেকে যাচাই — পরিচালনার তালিকা এখনো আসেনি', en: 'checked against the code list — the managed list is not live yet' })})` : ''}
              {' — '}
              <a href={form.officialUrl} target="_blank" rel="noreferrer">
                {t({ bn: 'লিংকটি খুলুন', en: 'Open the link' })}
              </a>
            </p>
          ) : null}

          <label style={labelStyle} htmlFor="applyUrl">
            {t({ bn: 'অফিসিয়াল আবেদনের লিংক (না থাকলে ফাঁকা)', en: 'Official application link (blank if none)' })}
          </label>
          <input
            id="applyUrl"
            type="url"
            value={form.applyUrl ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, applyUrl: e.target.value.trim().length === 0 ? null : e.target.value }))}
            style={inputStyle}
          />
          {form.applyUrl ? (
            <p style={{ fontSize: 13, margin: '6px 0 0' }}>
              {applyCheck ? domainCheckLabelBn(applyCheck) : ''}
              {' — '}
              <a href={form.applyUrl} target="_blank" rel="noreferrer">
                {t({ bn: 'লিংকটি খুলুন', en: 'Open the link' })}
              </a>
            </p>
          ) : null}

          <label style={labelStyle} htmlFor="examDate">
            {t({ bn: 'পরীক্ষার তারিখ (বিজ্ঞপ্তিতে থাকলে)', en: 'Exam date (if the notice states one)' })}
          </label>
          <input
            id="examDate"
            type="date"
            value={examDate}
            onChange={(e) => setExamDate(e.target.value)}
            style={inputStyle}
          />

          <label style={labelStyle} htmlFor="copyTextExcerpt">
            {t({ bn: 'বিজ্ঞপ্তির অংশ (ঐচ্ছিক)', en: 'Circular excerpt (optional)' })}
          </label>
          <textarea
            id="copyTextExcerpt"
            value={form.copyTextExcerpt ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, copyTextExcerpt: e.target.value.trim().length === 0 ? null : e.target.value }))}
            rows={3}
            style={inputStyle}
          />

          {formProblems.length > 0 ? (
            <AlertBox tone="error">
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {formProblems.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </AlertBox>
          ) : null}

          {duplicates.length > 0 ? (
            <div style={{ marginTop: 12 }}>
              <AlertBox tone="info">
                <strong>{t({ bn: 'সম্ভাব্য ডুপ্লিকেট পাওয়া গেছে', en: 'Possible duplicates found' })}</strong>
                {duplicates.map((d) => (
                  <div key={d.circular.docId} style={{ marginTop: 8 }}>
                    <Link to={`/admin/jobs/circulars/${d.circular.docId}`}>{d.circular.postTitleBn}</Link>
                    {' — '}
                    {d.detailBn}
                    {d.circular.applicationDeadlineMillis !== null
                      ? ` (${t({ bn: 'শেষ তারিখ', en: 'Deadline' })}: ${formatDhakaDate(d.circular.applicationDeadlineMillis, lang, false)})`
                      : ''}
                  </div>
                ))}
                <div style={{ marginTop: 8, fontSize: 13 }}>
                  {t({
                    bn: 'স্বয়ংক্রিয়ভাবে কিছু মোছা বা একত্রিত করা হবে না — মানুষকে সিদ্ধান্ত নিতে হবে (ডুপ্লিকেট হিসেবে বাতিল, সংশোধন/পুনঃপ্রকাশ হিসেবে যুক্ত, বা আলাদা বিজ্ঞপ্তি হিসেবে রাখা)।',
                    en: 'Nothing is auto-deleted or auto-merged — a human must decide (reject as duplicate, link as a correction/reissue, or keep as a separate circular).',
                  })}
                </div>
              </AlertBox>
            </div>
          ) : null}

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
            {isPublished ? (
              <>
                <Button onClick={() => setConfirm('update-published')} disabled={busy || formProblems.length > 0}>
                  {t({ bn: 'প্রকাশিত তথ্য হালনাগাদ করুন', en: 'Update published facts' })}
                </Button>
                <Button onClick={() => setConfirm('unpublish')} disabled={busy}>
                  {t({ bn: 'প্রত্যাহার করুন', en: 'Withdraw' })}
                </Button>
              </>
            ) : (
              <>
                <Button onClick={() => setConfirm('save')} disabled={busy || formProblems.length > 0}>
                  {t({ bn: 'সংরক্ষণ করুন', en: 'Save' })}
                </Button>
                {circular?.reviewStatus === 'draft' ? (
                  <Button onClick={() => setConfirm('submit')} disabled={busy || formProblems.length > 0}>
                    {t({ bn: 'যাচাইয়ের জন্য পাঠান', en: 'Submit for verification' })}
                  </Button>
                ) : null}
                {circular?.reviewStatus === 'in-review' ? (
                  <>
                    <Button onClick={() => setConfirm('approve')} disabled={busy || !checklistComplete || verificationNote.trim().length < 10 || !guard.allowed}>
                      {t({ bn: 'অনুমোদন করুন', en: 'Approve' })}
                    </Button>
                    <Button onClick={() => setConfirm('return')} disabled={busy || returnNote.trim().length < 10}>
                      {t({ bn: 'ফেরত পাঠান', en: 'Request changes' })}
                    </Button>
                    <Button onClick={() => setConfirm('reject')} disabled={busy || returnNote.trim().length < 10}>
                      {t({ bn: 'বাতিল করুন', en: 'Reject' })}
                    </Button>
                  </>
                ) : null}
                {circular?.reviewStatus === 'verified' ? (
                  <>
                    <Button onClick={() => setConfirm('publish')} disabled={busy}>
                      {t({ bn: 'প্রকাশ করুন', en: 'Publish' })}
                    </Button>
                    <Button onClick={() => setConfirm('unpublish')} disabled={busy}>
                      {t({ bn: 'প্রত্যাহার করুন', en: 'Withdraw' })}
                    </Button>
                  </>
                ) : null}
                {circular && isOwner ? (
                  <Button onClick={() => setConfirm('delete')} disabled={busy || returnNote.trim().length < 10}>
                    {t({ bn: 'মুছে ফেলুন', en: 'Delete' })}
                  </Button>
                ) : null}
              </>
            )}
          </div>

          {isPublished ? (
            <>
              <label style={labelStyle} htmlFor="changeReason">
                {t({ bn: 'পরিবর্তনের কারণ (কমপক্ষে ১০ অক্ষর — প্রকাশিত তথ্য বদলাতে বাধ্যতামূলক)', en: 'Reason for the change (at least 10 characters — required for published facts)' })}
              </label>
              <textarea
                id="changeReason"
                value={changeReason}
                onChange={(e) => setChangeReason(e.target.value)}
                rows={2}
                style={inputStyle}
              />
              <label style={labelStyle} htmlFor="changeSource">
                {t({ bn: 'পরিবর্তনের অফিসিয়াল উৎসের লিংক', en: 'Official source link for the change' })}
              </label>
              <input
                id="changeSource"
                type="url"
                value={changeSource}
                onChange={(e) => setChangeSource(e.target.value)}
                style={inputStyle}
              />
            </>
          ) : null}
        </Card>

        {/* ---- Right: checklist + history ---- */}
        <div style={{ display: 'grid', gap: 16 }}>
          {circular?.reviewStatus === 'in-review' ? (
            <Card>
              <h2 style={{ fontSize: 16, marginTop: 0 }}>
                {t({ bn: 'যাচাইয়ের চেকলিস্ট', en: 'Verification checklist' })}
              </h2>
              <p style={{ fontSize: 13, marginTop: 0 }}>
                {t({
                  bn: 'প্রতিটি আইটেম যাচাইকারী নিজে যাচাই করবেন — সম্পাদকের আগাম টিক দেওয়া গণ্য হয় না। কোনো আইটেম “ব্যর্থ” বা “অনিশ্চিত” থাকলে অনুমোদন আটকে যাবে।',
                  en: 'Each item must be checked by the verifier — an editor’s earlier ticks do not count. Any “fail” or “uncertain” blocks approval.',
                })}
              </p>
              {VERIFICATION_CHECKLIST_ITEMS.map((item) => (
                <div key={item} style={{ borderTop: '1px solid var(--hatch-widget-border)', padding: '10px 0' }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>
                    {lang === 'bn' ? VERIFICATION_CHECKLIST_BN[item] : VERIFICATION_CHECKLIST_EN[item]}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                    {RESULT_OPTIONS.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setChecklistResult(item, r)}
                        aria-pressed={checklist[item] === r}
                        style={{
                          padding: '6px 10px',
                          borderRadius: 999,
                          border: checklist[item] === r ? '2px solid currentColor' : '1px solid var(--hatch-widget-border)',
                          background: checklist[item] === r ? 'var(--hatch-widget-surface-muted)' : 'transparent',
                          fontSize: 13,
                          cursor: 'pointer',
                        }}
                      >
                        {lang === 'bn' ? CHECKLIST_RESULT_BN[r] : CHECKLIST_RESULT_EN[r]}
                      </button>
                    ))}
                  </div>
                  {(checklist[item] === 'uncertain' || checklist[item] === 'na' || checklist[item] === 'fail') ? (
                    <input
                      value={checklist.notes[item] ?? ''}
                      onChange={(e) => setChecklistNote(item, e.target.value)}
                      placeholder={t({ bn: 'কারণ / প্রমাণের সূত্র লিখুন', en: 'Write the reason / evidence pointer' }) as string}
                      style={{ ...inputStyle, marginTop: 6 }}
                    />
                  ) : null}
                </div>
              ))}
              {!checklistComplete && blockingItem ? (
                <p style={{ fontSize: 13, color: '#8a5a00', marginBottom: 0 }}>
                  {t({ bn: 'অনুমোদন আটকে আছে', en: 'Approval is blocked' })}: {lang === 'bn' ? VERIFICATION_CHECKLIST_BN[blockingItem] : VERIFICATION_CHECKLIST_EN[blockingItem]}
                </p>
              ) : null}
              {circular && !guard.allowed && guard.reasonBn ? (
                <AlertBox tone="info">{lang === 'bn' ? guard.reasonBn : guard.reasonEn}</AlertBox>
              ) : null}
              {circular && (circular.authorId === uid || circular.lastEditedBy === uid) && isOwner ? (
                <>
                  <label style={labelStyle} htmlFor="overrideReason">
                    {t({ bn: 'মালিকের ওভাররাইডের কারণ (কমপক্ষে ১০ অক্ষর)', en: 'Owner override reason (at least 10 characters)' })}
                  </label>
                  <input
                    id="overrideReason"
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    style={inputStyle}
                  />
                </>
              ) : null}
              <label style={labelStyle} htmlFor="verificationNote">
                {t({ bn: 'যাচাইয়ের নোট (কমপক্ষে ১০ অক্ষর)', en: 'Verification note (at least 10 characters)' })}
              </label>
              <textarea
                id="verificationNote"
                value={verificationNote}
                onChange={(e) => setVerificationNote(e.target.value)}
                rows={2}
                style={inputStyle}
              />
            </Card>
          ) : null}

          {circular && !isNew ? (
            <Card>
              <h2 style={{ fontSize: 16, marginTop: 0 }}>
                {t({ bn: 'কারণ (ফেরত / প্রত্যাহার / বাতিল / মোছা)', en: 'Reason (return / withdraw / reject / delete)' })}
              </h2>
              <textarea
                value={returnNote}
                onChange={(e) => setReturnNote(e.target.value)}
                rows={2}
                placeholder={t({ bn: 'কারণ লিখুন (কমপক্ষে ১০ অক্ষর)', en: 'Write the reason (at least 10 characters)' }) as string}
                style={inputStyle}
              />
            </Card>
          ) : null}

          {circular && !isNew ? (
            <Card>
              <h2 style={{ fontSize: 16, marginTop: 0 }}>
                {t({ bn: 'পরিবর্তনের ইতিহাস', en: 'Change history' })}
              </h2>
              {circular.verificationChecklist ? (
                <p style={{ fontSize: 13 }}>
                  {t({ bn: 'সর্বশেষ যাচাই', en: 'Last verification' })}: {isCircularVerified(circular) ? t({ bn: 'যাচাইকৃত', en: 'Verified' }) : t({ bn: 'যাচাই হয়নি', en: 'Not verified' })}
                  {circular.verifiedAtMillis !== null ? ` · ${formatDhakaDate(circular.verifiedAtMillis, lang, false)}` : ''}
                </p>
              ) : null}
              {history.length === 0 ? (
                <EmptyAdminBox
                  bn="এখনো কোনো পরিবর্তনের ইতিহাস নেই — সংবেদনশীল তথ্য (শেষ তারিখ, লিংক, পদসংখ্যা) বদলালে এখানে পুরোনো → নতুন মান দেখাবে।"
                  en="No change history yet — when sensitive facts (deadline, links, post count) change, the old → new values will show here."
                  nextBn=""
                  nextEn=""
                />
              ) : (
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.8 }}>
                  {history.map((h) => (
                    <li key={h.docId}>
                      <strong>{h.fieldChanged}</strong>: {h.previousValue ?? '—'} → {h.newValue ?? '—'}
                      {h.changedAtMillis !== null ? ` · ${formatDhakaDate(h.changedAtMillis, lang, false)}` : ''}
                      {h.note ? ` · ${h.note}` : ''}
                    </li>
                  ))}
                </ul>
              )}
              <p style={{ fontSize: 12, color: 'var(--muted-ivory)' }}>
                {t({
                  bn: 'ইতিহাস কখনো সম্পাদনা বা মোছা যায় না। প্রকাশিত বিজ্ঞপ্তির পুরোনো তথ্য এখানে থাকে — নীরবে বদলানো হয় না।',
                  en: 'History can never be edited or deleted. A published circular’s old values stay here — never silently replaced.',
                })}
              </p>
              {circular ? (
                <p style={{ fontSize: 13 }}>
                  <Link to={`/jobs/circulars/${circular.docId}`} target="_blank" rel="noreferrer">
                    {t({ bn: 'ছাত্রদের পাতায় দেখুন →', en: 'See the student page →' })}
                  </Link>
                </p>
              ) : null}
            </Card>
          ) : null}

          {circular?.verificationChecklist && circular.reviewStatus !== 'in-review' ? (
            <Card>
              <h2 style={{ fontSize: 16, marginTop: 0 }}>
                {t({ bn: 'সংরক্ষিত চেকলিস্ট', en: 'Saved checklist' })}
              </h2>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.8 }}>
                {VERIFICATION_CHECKLIST_ITEMS.map((item) => (
                  <li key={item}>
                    {lang === 'bn' ? VERIFICATION_CHECKLIST_BN[item] : VERIFICATION_CHECKLIST_EN[item]}: {lang === 'bn' ? CHECKLIST_RESULT_BN[circular.verificationChecklist?.[item] ?? 'uncertain'] : CHECKLIST_RESULT_EN[circular.verificationChecklist?.[item] ?? 'uncertain']}
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </div>
      </div>

      {confirm ? (
        <ConfirmDialog
          titleBn={
            confirm === 'save'
              ? 'সংরক্ষণ করবেন?'
              : confirm === 'submit'
                ? 'যাচাইয়ের জন্য পাঠাবেন?'
                : confirm === 'approve'
                  ? 'এই বিজ্ঞপ্তি অনুমোদন করবেন?'
                  : confirm === 'return'
                    ? 'সংশোধনের জন্য ফেরত পাঠাবেন?'
                    : confirm === 'reject'
                      ? 'বিজ্ঞপ্তিটি বাতিল করবেন?'
                      : confirm === 'publish'
                        ? 'বিজ্ঞপ্তি প্রকাশ করবেন?'
                        : confirm === 'unpublish'
                          ? 'বিজ্ঞপ্তি প্রত্যাহার করবেন?'
                          : confirm === 'update-published'
                            ? 'প্রকাশিত তথ্য হালনাগাদ করবেন?'
                            : 'বিজ্ঞপ্তি মুছে ফেলবেন?'
          }
          titleEn={
            confirm === 'save'
              ? 'Save?'
              : confirm === 'submit'
                ? 'Submit for verification?'
                : confirm === 'approve'
                  ? 'Approve this circular?'
                  : confirm === 'return'
                    ? 'Return for changes?'
                    : confirm === 'reject'
                      ? 'Reject this circular?'
                      : confirm === 'publish'
                        ? 'Publish this circular?'
                        : confirm === 'unpublish'
                          ? 'Withdraw this circular?'
                          : confirm === 'update-published'
                            ? 'Update the published facts?'
                            : 'Delete this circular?'
          }
          bodyBn={
            confirm === 'approve'
              ? `চেকলিস্ট সম্পূর্ণ এবং যাচাইয়ের নোট দেওয়া হয়েছে। অনুমোদনের পর বিজ্ঞপ্তিটি প্রকাশের জন্য প্রস্তুত হবে।${overrideReason ? ` মালিকের ওভাররাইডের কারণ: ${overrideReason}` : ''}`
              : confirm === 'delete'
                ? 'মুছে ফেলা বিজ্ঞপ্তি আর ফেরত পাওয়া যাবে না। ভুলভাবে তৈরি ডকুমেন্টের জন্যই শুধু এটি ব্যবহার করুন — প্রত্যাহার (rejected) সাধারণত যথেষ্ট।'
                : confirm === 'update-published'
                  ? 'পুরোনো তথ্য পরিবর্তনের ইতিহাসে থাকবে — নীরবে বদলানো হবে না।'
                  : 'নিশ্চিত করুন।'
          }
          bodyEn={
            confirm === 'approve'
              ? `The checklist is complete and the verification note is given. After approval the circular will be ready to publish.${overrideReason ? ` Owner override reason: ${overrideReason}` : ''}`
              : confirm === 'delete'
                ? 'A deleted circular cannot be recovered. Use this only for wrongly created documents — withdrawing (rejected) is usually enough.'
                : confirm === 'update-published'
                  ? 'The old values will stay in the change history — never silently replaced.'
                  : 'Please confirm.'
          }
          confirmBn="নিশ্চিত করুন"
          confirmEn="Confirm"
          onCancel={() => setConfirm(null)}
          onConfirm={() => runAction(confirm)}
        />
      ) : null}
    </div>
  );
}
