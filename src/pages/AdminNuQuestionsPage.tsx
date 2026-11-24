// Eduvelto — Admin: NU question bank workbench (NU-7, 22 Nov 2026;
// design doc §11, §15 NU-7, §19.2.4–§19.2.6, §19.6).
//
// Owner / Admin / verified teacher only (NuQuestionWorkbenchGuard
// on the route + firestore.rules on every write). The bank starts
// EMPTY — 0 questions, 0 verified teachers (NU-Q4) — so the first
// thing this page shows is the honest count, not a fake library.
//
// What it does:
// - bank summary (counts per status) + review queue (one status at
//   a time, newest first);
// - a composer: write a draft question + its correct answer (the
//   answer is stored in nuQuestionDraftKeys, NEVER in nuQuestions);
// - the full flow: submit for review → claim → review (4 checks +
//   decision + reason) → publish (Admin-only) / withdraw;
// - a correction creates a NEW doc, version + 1 (§19.6.2);
// - a bundle preview: assemble a topic bundle from published
//   questions in memory only — nothing is written (bundles are
//   actually created in NU-8/NU-9).
//
// What it does NOT do: invent questions, invent teachers, publish
// anything unverified, or show a student the correct answer.
import { useEffect, useState, type FormEvent } from 'react';
import { doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { PageShell } from '../components/PageShell';
import { Card, AlertBox } from '../components/ui';
import { useLanguage } from '../i18n/LanguageContext';
import { requireDb } from '../components/AdminShared';
import { useAuth } from '../lib/auth';
import {
  canReviewNuQuestion,
  claimNuQuestionReview,
  correctNuQuestion,
  createNuQuestionDraft,
  isNuAdminProfile,
  listNuQuestionQueue,
  nuBankSummary,
  previewNuTopicBundle,
  publishNuQuestion,
  submitNuQuestionForReview,
  submitNuReview,
  withdrawNuQuestion,
  type NuQuestionDraftInput,
  type NuQuestionWithId,
  type NuReviewChecks,
} from '../lib/nuQuestionFlow';
import {
  NU_QUESTION_STATUSES,
  publishGateCheck,
  type NuQuestionStatus,
} from '../lib/nuQuestions';
import type { NuGroupSlug } from '../lib/nuProfile';
import {
  nuSyllabusChaptersForSubject,
  nuSyllabusSubjectBySlug,
  nuSyllabusSubjects,
  nuSyllabusTopicsForChapter,
} from '../lib/nuSyllabus';

const STATUS_BN: Record<NuQuestionStatus, string> = {
  draft: 'খসড়া',
  submitted_for_review: 'পর্যালোচনার অপেক্ষায়',
  under_review: 'পর্যালোচনাধীন',
  approved: 'অনুমোদিত',
  published: 'প্রকাশিত',
  rejected: 'বাতিল',
  changes_requested: 'সংশোধন চাওয়া হয়েছে',
  withdrawn: 'প্রত্যাহার করা হয়েছে',
};

const STATUS_EN: Record<NuQuestionStatus, string> = {
  draft: 'Draft',
  submitted_for_review: 'Awaiting review',
  under_review: 'Under review',
  approved: 'Approved',
  published: 'Published',
  rejected: 'Rejected',
  changes_requested: 'Changes requested',
  withdrawn: 'Withdrawn',
};

const COMMON_SUBJECTS = nuSyllabusSubjects().filter((s) => !s.isGroupBlock);

function errText(e: unknown): string {
  if (e instanceof Error) return e.message;
  return String(e);
}

export default function AdminNuQuestionsPage() {
  const { t, lang } = useLanguage();
  const { user, profile } = useAuth();
  const [summary, setSummary] = useState<Record<NuQuestionStatus, number> & { total: number } | null>(null);
  const [queueStatus, setQueueStatus] = useState<NuQuestionStatus>('submitted_for_review');
  const [queue, setQueue] = useState<NuQuestionWithId[]>([]);
  const [selected, setSelected] = useState<NuQuestionWithId | null>(null);
  const [draftKey, setDraftKey] = useState<{ correctOptionIndex: number } | null>(null);
  const [keyHidden, setKeyHidden] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Review form state.
  const [checks, setChecks] = useState<NuReviewChecks>({
    questionCorrect: false,
    correctAnswerCorrect: false,
    explanationCorrect: false,
    sourceCorrect: false,
  });
  const [decision, setDecision] = useState<'approved' | 'rejected' | 'changes_requested'>('approved');
  const [reason, setReason] = useState('');

  // Composer state.
  const [subjectSlug, setSubjectSlug] = useState('bangla');
  const [chapterId, setChapterId] = useState('nu-ch-bangla-prose');
  const [topicId, setTopicId] = useState('nu-tp-bangla-prose-01');
  const [groups, setGroups] = useState<NuGroupSlug[]>(['humanities', 'science', 'business']);
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correct, setCorrect] = useState(0);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [explanation, setExplanation] = useState('');
  const [sourceType, setSourceType] = useState<NuQuestionDraftInput['sourceType']>('original_practice');
  const [provenance, setProvenance] = useState('');
  const [examYear, setExamYear] = useState('');

  // Draft edit state (Rule A — content edit while draft /
  // changes_requested; filled in when a draft is opened).
  const [editText, setEditText] = useState('');
  const [editOptions, setEditOptions] = useState(['', '', '', '']);
  const [editExplanation, setEditExplanation] = useState('');
  const [editDifficulty, setEditDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');

  useEffect(() => {
    if (selected && (selected.status === 'draft' || selected.status === 'changes_requested')) {
      setEditText(selected.questionText);
      setEditOptions([...selected.options]);
      setEditExplanation(selected.explanation);
      setEditDifficulty(selected.difficulty);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.questionId, selected?.status]);

  // Bundle preview state.
  const [previewTopic, setPreviewTopic] = useState('nu-tp-bangla-prose-01');
  const [preview, setPreview] = useState<{ count: number; firstText: string } | null>(null);

  const isAdmin = isNuAdminProfile(profile);
  const subjectDoc = nuSyllabusSubjectBySlug(subjectSlug);
  const chapters = subjectDoc ? nuSyllabusChaptersForSubject(subjectDoc.id) : [];
  const topics = nuSyllabusTopicsForChapter(chapterId);

  async function load(): Promise<void> {
    setLoading(true);
    setError('');
    try {
      const db = requireDb();
      setSummary(await nuBankSummary(db));
      setQueue(await listNuQuestionQueue(db, queueStatus, 50));
    } catch (e) {
      setError(t({ bn: `তথ্য পড়া যায়নি — ${errText(e)}`, en: `Could not load — ${errText(e)}` }));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queueStatus]);

  async function openQuestion(q: NuQuestionWithId): Promise<void> {
    setSelected(q);
    setDraftKey(null);
    setKeyHidden(false);
    setNotice('');
    setError('');
    try {
      const snap = await getDoc(doc(requireDb(), 'nuQuestionDraftKeys', q.questionId));
      if (snap.exists()) {
        const data = snap.data() as { correctOptionIndex?: number };
        if (typeof data.correctOptionIndex === 'number') setDraftKey({ correctOptionIndex: data.correctOptionIndex });
      }
    } catch {
      // A denied read means this viewer may not see the answer
      // (e.g. a reviewer who has not claimed the question) — the
      // question itself still shows, the answer stays hidden.
      setKeyHidden(true);
    }
  }

  async function run(action: string, fn: () => Promise<void>): Promise<void> {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await fn();
      setNotice(action);
      await load();
      if (selected) {
        // Refresh the open question from the reloaded queue.
        const fresh = queue.find((q) => q.questionId === selected.questionId);
        if (fresh) setSelected(fresh);
      }
    } catch (e) {
      setError(t({ bn: `হয়নি — ${errText(e)}`, en: `Failed — ${errText(e)}` }));
    } finally {
      setBusy(false);
    }
  }

  async function onCreateDraft(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (!user) return;
    const input: NuQuestionDraftInput = {
      subjectId: subjectSlug,
      chapterId,
      topicId,
      groupIds: groups,
      questionText: questionText.trim(),
      questionLang: 'bn',
      options: [options[0].trim(), options[1].trim(), options[2].trim(), options[3].trim()] as [string, string, string, string],
      difficulty,
      explanation: explanation.trim(),
      sourceType,
      provenance: provenance.trim(),
      ...(sourceType === 'official_previous_year' && examYear ? { examYear: Number(examYear) } : {}),
    };
    await run(
      t({ bn: 'খসড়া প্রশ্ন তৈরি হয়েছে।', en: 'Draft question created.' }),
      async () => {
        const { duplicateWarnings } = await createNuQuestionDraft(requireDb(), user.uid, profile, input, correct);
        if (duplicateWarnings.length > 0) {
          setNotice(
            t({
              bn: `খসড়া তৈরি হয়েছে — তবে ${duplicateWarnings.length}টি প্রায়-একই প্রশ্ন আগে আছে (সতর্কতা মাত্র, বাধা নয়)।`,
              en: `Draft created — but ${duplicateWarnings.length} near-identical question(s) already exist (warning only, not a block).`,
            }),
          );
        }
        setQuestionText('');
        setOptions(['', '', '', '']);
        setExplanation('');
        setProvenance('');
        setExamYear('');
      },
    );
  }

  async function onPreviewBundle(): Promise<void> {
    setBusy(true);
    setError('');
    setPreview(null);
    try {
      const { bundle } = await previewNuTopicBundle(requireDb(), previewTopic, 50);
      setPreview({ count: bundle.questionCount, firstText: bundle.questions[0]?.questionText ?? '' });
    } catch (e) {
      setError(t({ bn: `প্রিভিউ হয়নি — ${errText(e)}`, en: `Preview failed — ${errText(e)}` }));
    } finally {
      setBusy(false);
    }
  }

  const canReviewSelected =
    selected && user && canReviewNuQuestion(profile, user.uid, selected.createdBy);
  const gateMissing = selected ? publishGateCheck(selected) : [];

  return (
    <PageShell titleBn="NU প্রশ্নব্যাংক — যাচাই কর্মশালা" titleEn="NU question bank — verification workbench">
      <p className="ev-muted-ivory">
        {t({
          bn: 'প্রশ্ন লেখা → পর্যালোচনা → প্রকাশনা। সঠিক উত্তর কখনো প্রশ্নের ডকে থাকে না — তা আলাদা খসড়া-কী ডকে থাকে। অযাচাইকৃত প্রশ্ন কখনো যাচাইকৃত দেখানো হয় না।',
          en: 'Write → review → publish. The correct answer is never in the question document — it lives in a separate draft-key document. An unverified question is never shown as verified.',
        })}
      </p>
      {summary && summary.total === 0 ? (
        <AlertBox tone="info">
          {t({
            bn: 'ব্যাংক এখনো শূন্য — ০টি প্রশ্ন, ০ জন যাচাইকৃত শিক্ষক (NU-Q4)। নিচের ফর্ম থেকে প্রথম খসড়া প্রশ্ন লিখুন।',
            en: 'The bank is still empty — 0 questions, 0 verified teachers (NU-Q4). Write the first draft question with the form below.',
          })}
        </AlertBox>
      ) : null}
      {notice ? <AlertBox tone="ok">{notice}</AlertBox> : null}
      {error ? <AlertBox tone="error">{error}</AlertBox> : null}

      <h2 className="ev-section-h2">{t({ bn: 'ব্যাংকের অবস্থা', en: 'Bank status' })}</h2>
      {loading || !summary ? (
        <p aria-live="polite">{t({ bn: 'লোড হচ্ছে…', en: 'Loading…' })}</p>
      ) : (
        <Card>
          <p>
            {t({ bn: 'মোট প্রশ্ন: ', en: 'Total questions: ' })}
            <strong>{summary.total}</strong>
          </p>
          <p style={{ lineHeight: 1.9 }}>
            {NU_QUESTION_STATUSES.map((s) => (
              <span key={s} style={{ marginRight: 14 }}>
                {lang === 'bn' ? STATUS_BN[s] : STATUS_EN[s]}: <strong>{summary[s]}</strong>
              </span>
            ))}
          </p>
        </Card>
      )}

      <h2 className="ev-section-h2">{t({ bn: 'পর্যালোচনার সারি', en: 'Review queue' })}</h2>
      <label className="ev-label" htmlFor="queue-status">
        {t({ bn: 'অবস্থা', en: 'Status' })}
      </label>
      <select
        id="queue-status"
        className="ev-input"
        style={{ marginBottom: 14, maxWidth: 320 }}
        value={queueStatus}
        onChange={(e) => setQueueStatus(e.target.value as NuQuestionStatus)}
      >
        {NU_QUESTION_STATUSES.map((s) => (
          <option key={s} value={s}>
            {lang === 'bn' ? STATUS_BN[s] : STATUS_EN[s]}
          </option>
        ))}
      </select>
      {queue.length === 0 ? (
        <p className="ev-muted-ivory">
          {t({ bn: 'এই অবস্থায় কোনো প্রশ্ন নেই।', en: 'No questions in this status.' })}
        </p>
      ) : (
        <Card>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {queue.map((q) => (
              <li key={q.questionId} style={{ marginBottom: 10 }}>
                <button
                  type="button"
                  onClick={() => void openQuestion(q)}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', color: 'inherit', fontSize: 'inherit' }}
                >
                  <strong>{q.questionText}</strong>
                  <br />
                  <span className="ev-muted-ivory">
                    {lang === 'bn' ? STATUS_BN[q.status] : STATUS_EN[q.status]} · {q.subjectId} · v{q.version}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {selected ? (
        <Card>
          <h3 className="ev-section-h2">{selected.questionText}</h3>
          <p className="ev-muted-ivory">
            {lang === 'bn' ? STATUS_BN[selected.status] : STATUS_EN[selected.status]} · {selected.subjectId} / {selected.chapterId} / {selected.topicId} · v
            {selected.version} · {selected.difficulty} · {selected.sourceType}
            {selected.examYear ? ` · ${selected.examYear}` : ''}
          </p>
          <ol style={{ paddingLeft: 20 }}>
            {selected.options.map((opt, i) => (
              <li key={i} style={draftKey?.correctOptionIndex === i ? { fontWeight: 700 } : undefined}>
                {opt}
                {draftKey?.correctOptionIndex === i ? ` ${t({ bn: '✓ সঠিক উত্তর', en: '✓ correct answer' })}` : ''}
              </li>
            ))}
          </ol>
          <p>
            <strong>{t({ bn: 'ব্যাখ্যা: ', en: 'Explanation: ' })}</strong>
            {selected.explanation}
          </p>
          <p className="ev-muted-ivory">
            <strong>{t({ bn: 'উৎস: ', en: 'Source: ' })}</strong>
            {selected.provenance}
          </p>
          {keyHidden ? (
            <p className="ev-muted-ivory">
              {t({
                bn: 'সঠিক উত্তর এখানে দেখা যাচ্ছে না — শুধু লেখক, দাবিকৃত পর্যালোচক ও অ্যাডমিন দেখতে পান।',
                en: 'The correct answer is hidden here — only the author, the claiming reviewer and admins can see it.',
              })}
            </p>
          ) : null}
          {selected.status === 'approved' && gateMissing.length > 0 ? (
            <AlertBox tone="error">
              {t({ bn: 'প্রকাশনার শর্ত পূরণ হয়নি: ', en: 'Publish gate not met: ' })}
              {gateMissing.join(' · ')}
            </AlertBox>
          ) : null}

          {(selected.status === 'draft' || selected.status === 'changes_requested') && user ? (
            <div style={{ marginTop: 16 }}>
              <h4>{t({ bn: 'খসড়া সংশোধন করুন', en: 'Edit draft' })}</h4>
              <label className="ev-label" htmlFor="edit-text">
                {t({ bn: 'প্রশ্ন', en: 'Question' })}
              </label>
              <textarea
                id="edit-text"
                className="ev-input"
                rows={2}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
              />
              {editOptions.map((opt, i) => (
                <div key={i}>
                  <label className="ev-label" htmlFor={`edit-opt-${i}`}>
                    {t({ bn: `বিকল্প ${i + 1}`, en: `Option ${i + 1}` })}
                  </label>
                  <input
                    id={`edit-opt-${i}`}
                    className="ev-input"
                    style={{ marginBottom: 8 }}
                    value={opt}
                    onChange={(e) => {
                      const next = [...editOptions];
                      next[i] = e.target.value;
                      setEditOptions(next);
                    }}
                  />
                </div>
              ))}
              <label className="ev-label" htmlFor="edit-explanation">
                {t({ bn: 'ব্যাখ্যা', en: 'Explanation' })}
              </label>
              <textarea
                id="edit-explanation"
                className="ev-input"
                rows={2}
                value={editExplanation}
                onChange={(e) => setEditExplanation(e.target.value)}
              />
              <label className="ev-label" htmlFor="edit-difficulty">
                {t({ bn: 'কঠিনতা', en: 'Difficulty' })}
              </label>
              <select
                id="edit-difficulty"
                className="ev-input"
                style={{ marginBottom: 10, maxWidth: 320 }}
                value={editDifficulty}
                onChange={(e) => setEditDifficulty(e.target.value as typeof editDifficulty)}
              >
                <option value="easy">{t({ bn: 'সহজ', en: 'Easy' })}</option>
                <option value="medium">{t({ bn: 'মাঝারি', en: 'Medium' })}</option>
                <option value="hard">{t({ bn: 'কঠিন', en: 'Hard' })}</option>
              </select>
              <button
                type="button"
                className="ev-btn"
                disabled={busy}
                onClick={() =>
                  void run(
                    t({ bn: 'খসড়া সংশোধন সংরক্ষিত হয়েছে।', en: 'Draft edit saved.' }),
                    async () => {
                      const db = requireDb();
                      await updateDoc(doc(db, 'nuQuestions', selected.questionId), {
                        questionText: editText.trim(),
                        options: [editOptions[0].trim(), editOptions[1].trim(), editOptions[2].trim(), editOptions[3].trim()],
                        explanation: editExplanation.trim(),
                        difficulty: editDifficulty,
                        updatedAt: serverTimestamp(),
                      });
                      setSelected({
                        ...selected,
                        questionText: editText.trim(),
                        options: [editOptions[0].trim(), editOptions[1].trim(), editOptions[2].trim(), editOptions[3].trim()],
                        explanation: editExplanation.trim(),
                        difficulty: editDifficulty,
                      });
                    },
                  )
                }
              >
                {t({ bn: 'সংরক্ষণ করুন', en: 'Save edit' })}
              </button>
            </div>
          ) : null}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 12 }}>
            {(selected.status === 'draft' || selected.status === 'changes_requested') && user ? (
              <button
                type="button"
                className="ev-btn"
                disabled={busy}
                onClick={() =>
                  void run(
                    t({ bn: 'পর্যালোচনার জন্য জমা দেওয়া হয়েছে।', en: 'Submitted for review.' }),
                    () => submitNuQuestionForReview(requireDb(), user.uid, profile, selected.questionId),
                  )
                }
              >
                {t({ bn: 'পর্যালোচনার জন্য জমা দিন', en: 'Submit for review' })}
              </button>
            ) : null}
            {selected.status === 'submitted_for_review' && user && canReviewSelected ? (
              <button
                type="button"
                className="ev-btn"
                disabled={busy}
                onClick={() =>
                  void run(
                    t({ bn: 'পর্যালোচনা আপনার নামে নেওয়া হয়েছে।', en: 'Review claimed.' }),
                    () => claimNuQuestionReview(requireDb(), user.uid, profile, selected.questionId),
                  )
                }
              >
                {t({ bn: 'পর্যালোচনা নিন', en: 'Claim review' })}
              </button>
            ) : null}
            {selected.status === 'approved' && isAdmin && user ? (
              <button
                type="button"
                className="ev-btn"
                disabled={busy || gateMissing.length > 0}
                onClick={() =>
                  void run(
                    t({ bn: 'প্রশ্ন প্রকাশিত হয়েছে।', en: 'Question published.' }),
                    () => publishNuQuestion(requireDb(), user.uid, profile, selected.questionId),
                  )
                }
              >
                {t({ bn: 'প্রকাশ করুন', en: 'Publish' })}
              </button>
            ) : null}
            {selected.status === 'published' && isAdmin && user ? (
              <button
                type="button"
                className="ev-btn"
                disabled={busy}
                onClick={() =>
                  void run(
                    t({ bn: 'প্রশ্ন প্রত্যাহার করা হয়েছে।', en: 'Question withdrawn.' }),
                    () => withdrawNuQuestion(requireDb(), user.uid, profile, selected.questionId),
                  )
                }
              >
                {t({ bn: 'প্রত্যাহার করুন', en: 'Withdraw' })}
              </button>
            ) : null}
            {(selected.status === 'published' || selected.status === 'approved') && user ? (
              <button
                type="button"
                className="ev-btn"
                disabled={busy}
                onClick={() =>
                  void run(
                    t({ bn: 'সংশোধিত সংস্করণ (v' + (selected.version + 1) + ') খসড়া হিসেবে তৈরি হয়েছে — পর্যালোচনা শেষে প্রকাশ করুন।', en: 'Corrected version (v' + (selected.version + 1) + ') created as a draft — review it, then publish.' }),
                    async () => {
                      await correctNuQuestion(requireDb(), user.uid, profile, selected.questionId, {
                        questionText: selected.questionText,
                        options: [...selected.options] as [string, string, string, string],
                        explanation: selected.explanation,
                      });
                    },
                  )
                }
              >
                {t({ bn: 'সংশোধন করুন (নতুন সংস্করণ)', en: 'Correct (new version)' })}
              </button>
            ) : null}
          </div>

          {selected.status === 'under_review' && user && selected.reviewedBy === user.uid ? (
            <div style={{ marginTop: 16 }}>
              <h4>{t({ bn: 'পর্যালোচনা জমা দিন', en: 'Submit review' })}</h4>
              {(['questionCorrect', 'correctAnswerCorrect', 'explanationCorrect', 'sourceCorrect'] as const).map(
                (key) => (
                  <label key={key} style={{ display: 'block', marginBottom: 6 }}>
                    <input
                      type="checkbox"
                      checked={checks[key]}
                      onChange={(e) => setChecks({ ...checks, [key]: e.target.checked })}
                    />{' '}
                    {t({
                      bn:
                        key === 'questionCorrect'
                          ? 'প্রশ্নটি সঠিক'
                          : key === 'correctAnswerCorrect'
                            ? 'সঠিক উত্তরটি সঠিক'
                            : key === 'explanationCorrect'
                              ? 'ব্যাখ্যাটি সঠিক'
                              : 'উৎসটি সঠিক',
                      en:
                        key === 'questionCorrect'
                          ? 'The question is correct'
                          : key === 'correctAnswerCorrect'
                            ? 'The correct answer is correct'
                            : key === 'explanationCorrect'
                              ? 'The explanation is correct'
                              : 'The source is correct',
                    })}
                  </label>
                ),
              )}
              <label className="ev-label" htmlFor="review-decision">
                {t({ bn: 'সিদ্ধান্ত', en: 'Decision' })}
              </label>
              <select
                id="review-decision"
                className="ev-input"
                style={{ marginBottom: 10, maxWidth: 320 }}
                value={decision}
                onChange={(e) => setDecision(e.target.value as typeof decision)}
              >
                <option value="approved">{t({ bn: 'অনুমোদন', en: 'Approve' })}</option>
                <option value="rejected">{t({ bn: 'বাতিল', en: 'Reject' })}</option>
                <option value="changes_requested">{t({ bn: 'সংশোধন চাই', en: 'Request changes' })}</option>
              </select>
              <label className="ev-label" htmlFor="review-reason">
                {t({ bn: 'কারণ (বাতিল / সংশোধনের ক্ষেত্রে কমপক্ষে ১০ অক্ষর)', en: 'Reason (at least 10 characters for reject / changes)' })}
              </label>
              <textarea
                id="review-reason"
                className="ev-input"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
              <button
                type="button"
                className="ev-btn"
                disabled={busy}
                style={{ marginTop: 10 }}
                onClick={() =>
                  void run(
                    t({ bn: 'পর্যালোচনা জমা দেওয়া হয়েছে।', en: 'Review submitted.' }),
                    () =>
                      submitNuReview(requireDb(), user.uid, selected.questionId, decision, checks, reason || undefined),
                  )
                }
              >
                {t({ bn: 'পর্যালোচনা জমা দিন', en: 'Submit review' })}
              </button>
            </div>
          ) : null}
        </Card>
      ) : null}

      <h2 className="ev-section-h2">{t({ bn: 'নতুন খসড়া প্রশ্ন লিখুন', en: 'Write a new draft question' })}</h2>
      <Card>
        <form onSubmit={(e) => void onCreateDraft(e)}>
          <label className="ev-label" htmlFor="q-subject">
            {t({ bn: 'বিষয় (শুধু ৩টি সাধারণ বিষয় — গ্রুপ-৪০ ব্লকে প্রশ্ন হয় না)', en: 'Subject (only the 3 common subjects — no questions in the group-40 block)' })}
          </label>
          <select
            id="q-subject"
            className="ev-input"
            style={{ marginBottom: 10, maxWidth: 320 }}
            value={subjectSlug}
            onChange={(e) => {
              const slug = e.target.value;
              setSubjectSlug(slug);
              const sdoc = nuSyllabusSubjectBySlug(slug);
              const firstChapter = sdoc ? nuSyllabusChaptersForSubject(sdoc.id)[0] : undefined;
              if (firstChapter) {
                setChapterId(firstChapter.id);
                const firstTopic = nuSyllabusTopicsForChapter(firstChapter.id)[0];
                if (firstTopic) setTopicId(firstTopic.id);
              }
            }}
          >
            {COMMON_SUBJECTS.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.nameBn}
              </option>
            ))}
          </select>
          <label className="ev-label" htmlFor="q-chapter">
            {t({ bn: 'অধ্যায়', en: 'Chapter' })}
          </label>
          <select
            id="q-chapter"
            className="ev-input"
            style={{ marginBottom: 10, maxWidth: 420 }}
            value={chapterId}
            onChange={(e) => {
              setChapterId(e.target.value);
              const firstTopic = nuSyllabusTopicsForChapter(e.target.value)[0];
              if (firstTopic) setTopicId(firstTopic.id);
            }}
          >
            {chapters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nameBn}
              </option>
            ))}
          </select>
          <label className="ev-label" htmlFor="q-topic">
            {t({ bn: 'টপিক', en: 'Topic' })}
          </label>
          <select
            id="q-topic"
            className="ev-input"
            style={{ marginBottom: 10, maxWidth: 420 }}
            value={topicId}
            onChange={(e) => setTopicId(e.target.value)}
          >
            {topics.map((tp) => (
              <option key={tp.id} value={tp.id}>
                {tp.nameBn}
              </option>
            ))}
          </select>
          <fieldset style={{ border: 'none', padding: 0, marginBottom: 10 }}>
            <legend className="ev-label">{t({ bn: 'শাখা (কমপক্ষে ১টি)', en: 'Groups (at least 1)' })}</legend>
            {(['humanities', 'science', 'business'] as const).map((g) => (
              <label key={g} style={{ display: 'inline-block', marginRight: 16 }}>
                <input
                  type="checkbox"
                  checked={groups.includes(g)}
                  onChange={(e) =>
                    setGroups(e.target.checked ? [...groups, g] : groups.filter((x) => x !== g))
                  }
                />{' '}
                {lang === 'bn' ? (g === 'humanities' ? 'মানবিক' : g === 'science' ? 'বিজ্ঞান' : 'ব্যবসায় শিক্ষা') : (g === 'humanities' ? 'Humanities' : g === 'science' ? 'Science' : 'Business Studies')}
              </label>
            ))}
          </fieldset>
          <label className="ev-label" htmlFor="q-text">
            {t({ bn: 'প্রশ্ন', en: 'Question' })}
          </label>
          <textarea
            id="q-text"
            className="ev-input"
            rows={3}
            required
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
          />
          {options.map((opt, i) => (
            <div key={i}>
              <label className="ev-label" htmlFor={`q-opt-${i}`}>
                {t({ bn: `বিকল্প ${i + 1}`, en: `Option ${i + 1}` })}
              </label>
              <input
                id={`q-opt-${i}`}
                className="ev-input"
                style={{ marginBottom: 10 }}
                required
                value={opt}
                onChange={(e) => {
                  const next = [...options];
                  next[i] = e.target.value;
                  setOptions(next);
                }}
              />
            </div>
          ))}
          <label className="ev-label" htmlFor="q-correct">
            {t({ bn: 'সঠিক উত্তর কোন বিকল্প?', en: 'Which option is correct?' })}
          </label>
          <select
            id="q-correct"
            className="ev-input"
            style={{ marginBottom: 10, maxWidth: 320 }}
            value={correct}
            onChange={(e) => setCorrect(Number(e.target.value))}
          >
            {options.map((opt, i) => (
              <option key={i} value={i}>
                {t({ bn: `বিকল্প ${i + 1}`, en: `Option ${i + 1}` })}
                {opt ? ` — ${opt.slice(0, 40)}` : ''}
              </option>
            ))}
          </select>
          <label className="ev-label" htmlFor="q-difficulty">
            {t({ bn: 'কঠিনতা', en: 'Difficulty' })}
          </label>
          <select
            id="q-difficulty"
            className="ev-input"
            style={{ marginBottom: 10, maxWidth: 320 }}
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as typeof difficulty)}
          >
            <option value="easy">{t({ bn: 'সহজ', en: 'Easy' })}</option>
            <option value="medium">{t({ bn: 'মাঝারি', en: 'Medium' })}</option>
            <option value="hard">{t({ bn: 'কঠিন', en: 'Hard' })}</option>
          </select>
          <label className="ev-label" htmlFor="q-explanation">
            {t({ bn: 'ব্যাখ্যা (বাধ্যতামূলক — ব্যাখ্যা ছাড়া প্রশ্ন প্রকাশ হয় না)', en: 'Explanation (required — no question publishes without one)' })}
          </label>
          <textarea
            id="q-explanation"
            className="ev-input"
            rows={3}
            required
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
          />
          <label className="ev-label" htmlFor="q-source">
            {t({ bn: 'উৎসের ধরন', en: 'Source type' })}
          </label>
          <select
            id="q-source"
            className="ev-input"
            style={{ marginBottom: 10, maxWidth: 420 }}
            value={sourceType}
            onChange={(e) => setSourceType(e.target.value as typeof sourceType)}
          >
            <option value="original_practice">{t({ bn: 'মূল অনুশীলনী প্রশ্ন', en: 'Original practice question' })}</option>
            <option value="official_previous_year">{t({ bn: 'অফিসিয়াল বিগত বছরের প্রশ্ন', en: 'Official previous-year question' })}</option>
            <option value="adapted_hsc">{t({ bn: 'অভিযোজিত HSC প্রশ্ন', en: 'Adapted HSC question' })}</option>
            <option value="unverified_source">{t({ bn: 'অযাচাইকৃত উৎসের প্রশ্ন', en: 'Question from an unverified source' })}</option>
            <option value="imported_academic">{t({ bn: 'আমদানিকৃত একাডেমিক প্রশ্ন', en: 'Imported academic question' })}</option>
          </select>
          {sourceType === 'official_previous_year' ? (
            <>
              <label className="ev-label" htmlFor="q-year">
                {t({ bn: 'পরীক্ষার বছর (বাধ্যতামূলক)', en: 'Exam year (required)' })}
              </label>
              <input
                id="q-year"
                className="ev-input"
                style={{ marginBottom: 10, maxWidth: 200 }}
                type="number"
                min={1900}
                max={2100}
                required
                value={examYear}
                onChange={(e) => setExamYear(e.target.value)}
              />
            </>
          ) : null}
          <label className="ev-label" htmlFor="q-prov">
            {t({ bn: 'উৎসের বিবরণ (যেমন: HSC সিলেবাস, সাহিত্যপাঠ — কখনো অনুমান নয়)', en: 'Source detail (e.g. HSC syllabus, Sahityapath — never a guess)' })}
          </label>
          <input
            id="q-prov"
            className="ev-input"
            style={{ marginBottom: 14 }}
            required
            value={provenance}
            onChange={(e) => setProvenance(e.target.value)}
          />
          <button type="submit" className="ev-btn" disabled={busy || !user || groups.length === 0}>
            {t({ bn: 'খসড়া প্রশ্ন তৈরি করুন', en: 'Create draft question' })}
          </button>
        </form>
      </Card>

      {isAdmin ? (
        <>
          <h2 className="ev-section-h2">{t({ bn: 'বান্ডেল প্রিভিউ (NU-8/NU-9-এর প্রস্তুতি)', en: 'Bundle preview (groundwork for NU-8/NU-9)' })}</h2>
          <Card>
            <p className="ev-muted-ivory">
              {t({
                bn: 'প্রকাশিত প্রশ্ন থেকে টপিক বান্ডেলের প্রিভিউ — শুধু দেখা যায়, কিছু লেখা হয় না। বান্ডেল আসলে তৈরি ও প্রকাশ হবে NU-8/NU-9-এ।',
                en: 'Preview a topic bundle from published questions — view only, nothing is written. Bundles are actually created and published in NU-8/NU-9.',
              })}
            </p>
            <label className="ev-label" htmlFor="preview-topic">
              {t({ bn: 'টপিক', en: 'Topic' })}
            </label>
            <select
              id="preview-topic"
              className="ev-input"
              style={{ marginBottom: 10, maxWidth: 420 }}
              value={previewTopic}
              onChange={(e) => setPreviewTopic(e.target.value)}
            >
              {topics.map((tp) => (
                <option key={tp.id} value={tp.id}>
                  {tp.nameBn}
                </option>
              ))}
            </select>
            <button type="button" className="ev-btn" disabled={busy} onClick={() => void onPreviewBundle()}>
              {t({ bn: 'প্রিভিউ দেখুন', en: 'Show preview' })}
            </button>
            {preview ? (
              <p style={{ marginTop: 12 }}>
                {t({ bn: 'এই টপিকে প্রকাশিত প্রশ্ন: ', en: 'Published questions in this topic: ' })}
                <strong>{preview.count}</strong>
                <br />
                <span className="ev-muted-ivory">{preview.firstText}</span>
              </p>
            ) : null}
          </Card>
        </>
      ) : null}
      <p className="ev-muted-ivory" style={{ marginTop: 16 }}>
        {t({
          bn: 'মনে রাখবেন: ছাত্ররা কখনো প্রশ্ন লিখতে, জমা দিতে বা প্রকাশ করতে পারে না — শুধু মালিক, অ্যাডমিন ও যাচাইকৃত শিক্ষক। আজ ০ জন যাচাইকৃত শিক্ষক আছেন — শিক্ষক নিয়োগই এই ব্যাংকের আসল বাধা (NU-Q4)।',
          en: 'Remember: students can never write, submit or publish questions — only the owner, admins and verified teachers. Today there are 0 verified teachers — teacher recruitment is this bank’s real blocker (NU-Q4).',
        })}
      </p>
    </PageShell>
  );
}
