// Eduvelto — Question Paper Generator page (Milestone 2.5 MVP, 25 Nov 2026).
//
// Route: /question-paper-generator (mounted routing-agnostic; the
// /:lang mount is flagged for the merge — see the route comment in
// src/App.tsx). No login required for the demo; the per-teacher quota
// keys to the signed-in uid when available, otherwise 'guest'.
//
// Flow — academic tracks (General / Madrasah):
//   Stream → Class → Subject → CHAPTER (single or multiple, with
//   select-all + live counter + topic drill-down) → LEVEL-AWARE step 2
//   (primary = প্রান্তিক term; secondary = half-yearly/annual +
//   MCQ/creative/combined; Honours = question kind only) → pick
//   questions (all verified questions auto-selected; uncheck to
//   remove — NO pre-generation marks/count/difficulty controls,
//   pattern 3) → editable paper setup → preview (partial,
//   protected) → download.
// Flow — Track 3 (Job & Admission Coaching):
//   Exam (verified pattern) → subject preset → section paper from
//   available verified questions. Full mock is honestly GATED: the
//   bank holds only 35 verified BCS English questions, so no full
//   model test can be generated today and the UI says so.
//
// Paper text is FULLY customizable and FREE (owner 25 Nov 08:41):
// exam title, institution name, subject, class, date, marks, time,
// instructions, section headings — pre-filled from selections, always
// editable. Pro-gated (locked, shown with a lock): fonts, columns,
// spacing, divider styles, custom logo upload, editable layout,
// watermark-free export, one-click Answer Key sheet. Institution NAME
// as text is free; the custom LOGO image is Pro.

import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { AlertBox, Button, Card, Chip } from '../components/ui';
import { useAuth } from '../lib/auth';
import { db } from '../firebase';
import { ProtectedContentWrapper } from '../components/ProtectedContentWrapper';
import { QuestionPaperDownloadDialog } from '../components/QuestionPaperDownloadDialog';
import { getQpgUsage, loadCachedProStatus } from '../lib/qpgFirestore';
import { QPG_PRO_LOCKED, type QpgProStatus } from '../lib/qpgProOrders';
import { savePaperForSmartboard } from '../lib/qpgSmartboard';
import {
  QPG_CHEAPEST_ANNUAL_BDT,
  QPG_COGNITIVE_OPTIONS,
  QPG_COMBINED_PAPERS,
  QPG_FREE_MONTHLY_LIMIT,
  QPG_NATURE_OPTIONS,
  QPG_PAPER_TEMPLATES,
  QPG_PRICE_CLAIM_BN,
  QPG_PRIMARY_TERMS,
  QPG_PRO_MONTHLY_BDT,
  QPG_PRO_PER_PAPER_BDT,
  QPG_SECONDARY_EXAM_KINDS,
  QPG_SECTION_TYPES,
  QPG_SET_CODES,
  QPG_SOURCE_OPTIONS,
  QPG_VERIFIED_POOL,
  applyQpgTemplate,
  buildQpgPaper,
  checkQpgPaperStandard,
  defaultPaperSetup,
  isCqQuestion,
  qpgChaptersFor,
  qpgClassesFor,
  qpgCombinedPaperReady,
  qpgCombinedSectionAvailable,
  qpgDefaultSectionHeading,
  qpgLevelFor,
  qpgModelSectionQuestions,
  qpgModelTests,
  qpgMultiSectionTotalMarks,
  qpgPaperSections,
  qpgQuestionsTimeMinutes,
  qpgQuestionsTotalMarks,
  qpgSecondaryQKindsFor,
  qpgSectionsForQuestions,
  qpgSubjectsFor,
  qpgTypeForQKind,
  replaceQpgQuestion,
  saveQpgFlowPrefill,
  selectQpgQuestions,
  QPG_PENDING_TRACK3_EXAMS,
  QPG_STREAMS,
  type QpgChapter,
  type QpgCognitiveLevel,
  type QpgModelTest,
  type QpgPaper,
  type QpgPaperSection,
  type QpgPaperSetup,
  type QpgPrimaryTerm,
  type QpgQuestion,
  type QpgQuestionNature,
  type QpgQuestionSource,
  type QpgQuestionType,
  type QpgSecondaryExamKind,
  type QpgSecondaryQKind,
  type QpgSectionType,
  type QpgSetCode,
  type QpgStream,
} from '../lib/questionPaper';
import { qpgExercisesFor } from '../lib/qpgExercises';
import { clearQpgDraft, loadQpgDraft, saveQpgDraft } from '../lib/questionPaperDraft';
import { questionsForSet } from '../lib/questionPaperSets';
import {
  QPG_REPORT_REASONS,
  getDemoUsage,
  saveDemoReport,
  type QpgReportReason,
} from '../lib/questionPaperUsage';
import { loadVerifiedChapterQuestions } from '../lib/questionPaperCache';
import {
  waitGenProgressClose,
  waitGenProgressPhase,
} from '../lib/genProgressPacing';
import { renderOmrSheetCanvases, renderPaperCanvases } from '../lib/questionPaperPdf';
import { commitClearableNumber } from '../lib/clearableNumber';
import '../components/question-paper-print.css';

function fieldStyle(): React.CSSProperties {
  return { width: '100%', padding: 8, boxSizing: 'border-box', marginTop: 4 };
}

/**
 * Number input that can be cleared to empty and re-typed freely
 * (26 Nov 2026 fix for the পূর্ণমান / সময় fields: the old
 * `Math.max(min, Number(e.target.value) || min)` onChange snapped an
 * emptied field straight back to the minimum, so the last character
 * could never be deleted). The committed value always stays a valid
 * number, clamped to [min, max]. While the user edits, the raw text
 * lives in a draft, so deleting the last character does not snap the
 * field back. On blur an empty/invalid draft is discarded and the
 * field shows the committed value again. Validation is applied when
 * committing and on blur — never by blocking deletion.
 */
function ClearableNumberInput(props: {
  value: number;
  min: number;
  max?: number;
  onCommit: (n: number) => void;
  style?: React.CSSProperties;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <input
      type="number"
      min={props.min}
      max={props.max}
      value={draft ?? String(props.value)}
      onChange={(e) => {
        const raw = e.target.value;
        setDraft(raw);
        const next = commitClearableNumber(raw, props.min, props.max);
        if (next !== undefined) props.onCommit(next);
      }}
      onBlur={() => setDraft(null)}
      style={props.style}
    />
  );
}

export default function QuestionPaperGeneratorPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const uid = user?.uid ?? 'guest';
  const userLabel = user?.email ?? user?.uid ?? 'guest';
  const isGuest = uid === 'guest';
  // Free quota: Firestore qpgUsage for signed-in users (Phase 2,
  // spec §5); guests keep the local demo counter, and the demo counter
  // is also the fallback while the qpg rules are not yet deployed.
  const [usage, setUsage] = useState(() => {
    const d = getDemoUsage(uid);
    return { used: d.used, limit: d.limit, remaining: d.remaining };
  });
  const [usageSource, setUsageSource] = useState<'firestore' | 'demo'>('demo');
  // Pro status: one cached load per session (Phase 2, spec §5).
  const [proStatus, setProStatus] = useState<QpgProStatus>(QPG_PRO_LOCKED);

  useEffect(() => {
    if (isGuest || !db) return;
    let alive = true;
    void getQpgUsage(db, uid)
      .then((r) => {
        if (!alive) return;
        setUsage({ used: r.freeDownloads, limit: QPG_FREE_MONTHLY_LIMIT, remaining: Math.max(0, QPG_FREE_MONTHLY_LIMIT - r.freeDownloads) });
        setUsageSource('firestore');
      })
      .catch(() => {
        // Rules not deployed yet — keep the demo counter.
      });
    void loadCachedProStatus(db, uid)
      .then((s) => {
        if (alive) setProStatus(s);
      })
      .catch(() => {
        // Rules not deployed yet — Pro stays locked, honestly.
      });
    return () => {
      alive = false;
    };
  }, [isGuest, uid]);

  // --- Draft autosave (comparison fixes, 26 Nov 2026 — D):
  // --- the wizard state is restored from localStorage on mount
  // --- (when a draft exists) and re-saved on every change, so a
  // --- refresh / tab-close does not lose the teacher's work. The
  // --- draft holds the wizard state only — never the paper itself.
  const restoredDraft = useMemo(() => loadQpgDraft(), []);

  // --- Track + hierarchy state -------------------------------------
  const [stream, setStream] = useState<QpgStream>(restoredDraft?.stream ?? 'general');
  const [classId, setClassId] = useState(restoredDraft?.classId ?? 'honours');
  const [subjectId, setSubjectId] = useState(restoredDraft?.subjectId ?? 'english');
  const [chapterIds, setChapterIds] = useState<string[]>(
    restoredDraft?.chapterIds ?? ['bcs-english-batch1'],
  );
  const [topicIds, setTopicIds] = useState<string[]>(restoredDraft?.topicIds ?? []);
  // Exercise sub-selection (comparison fixes, 26 Nov 2026 — A3):
  // individual অনুশীলনী inside a chapter (Math first). Empty = whole
  // chapter. Only chapters with a Phase B exercise list offer it.
  const [exerciseIds, setExerciseIds] = useState<string[]>(restoredDraft?.exerciseIds ?? []);
  // Level-aware step 2 (pattern 3): primary = term, secondary =
  // exam kind + question kind, Honours = question kind only. The
  // question TYPE is derived from these — there is no separate
  // pre-generation type/count/difficulty control any more.
  const level = qpgLevelFor(stream, classId);
  const [term, setTerm] = useState<QpgPrimaryTerm>(restoredDraft?.term ?? 'first');
  const [examKind, setExamKind] = useState<QpgSecondaryExamKind>(restoredDraft?.examKind ?? 'half-yearly');
  const [qKind, setQKind] = useState<QpgSecondaryQKind>(restoredDraft?.qKind ?? 'mcq');
  const qType: QpgQuestionType | 'all' =
    level === 'primary' ? 'mcq' : qpgTypeForQKind(qKind);
  const [sourceFilter, setSourceFilter] = useState<QpgQuestionSource | 'any'>(
    restoredDraft?.sourceFilter ?? 'any',
  );
  const [cognitiveFilter, setCognitiveFilter] = useState<QpgCognitiveLevel | 'any'>(
    restoredDraft?.cognitiveFilter ?? 'any',
  );
  const [natureFilter, setNatureFilter] = useState<QpgQuestionNature | 'any'>(
    restoredDraft?.natureFilter ?? 'any',
  );
  // All verified questions of the chosen chapters are selected by
  // default (pattern 3: one-click generation); the teacher tunes by
  // unchecking individual questions. The effect below re-selects
  // all whenever the available list changes (chapter/topic/kind).
  // A restored draft keeps its own picks (intersected with what is
  // available now) — see the skip flag on that effect.
  const [selectedIds, setSelectedIds] = useState<string[]>(
    () => restoredDraft?.selectedIds ?? QPG_VERIFIED_POOL.map((q) => q.id),
  );
  // Inline question editing (free, part of paper creation): teacher's
  // edits stored per question id; the paper renders the edited text.
  const [edits, setEdits] = useState<Record<string, QpgQuestion>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  // Per-question Replace (A-Z parity): which selected question is
  // picking a replacement right now.
  const [replacingId, setReplacingId] = useState<string | null>(null);
  // Swap picker load-more (comparison fixes, 26 Nov 2026 — C): the
  // 5-candidate cap is gone; the picker shows the first 10 and a
  // "আরও দেখুন" button reveals the rest.
  const [pickerSwapShowAll, setPickerSwapShowAll] = useState(false);
  // Paper template (A-Z parity): chosen before creating; pre-fills
  // the setup text fields (title / instructions / section heading).
  const [templateId, setTemplateId] = useState(restoredDraft?.templateId ?? '');
  // Set shuffler: seed is fixed per session so the four sets rebuild
  // identically; setCode '' = single-set paper in original order.
  // Day 4: the seed is editable (setSeed) — a teacher who notes the
  // seed can re-enter it and rebuild the exact same set later.
  const [seed, setSeed] = useState(
    () => restoredDraft?.seed ?? Math.floor(Math.random() * 1_000_000_000),
  );
  const [setCode, setSetCode] = useState<'' | QpgSetCode>(restoredDraft?.setCode ?? '');
  /** Attach the printable OMR Bubble Sheet — FREE toggle (owner
   *  25 Nov 09:43): the sheet follows the paper's tier, watermarked
   *  on free papers, clean on Pro papers. No separate OMR price. */
  const [includeOmrSheet, setIncludeOmrSheet] = useState(restoredDraft?.includeOmrSheet ?? false);

  // --- Track 3 state -------------------------------------------------
  const modelTests = useMemo(() => qpgModelTests(), []);
  const [jobExamSlug, setJobExamSlug] = useState<QpgModelTest['examSlug']>('bcs');
  const [jobSubjectEn, setJobSubjectEn] = useState<string>('English Language & Literature');
  const [jobCount, setJobCount] = useState(10);
  const jobExam = modelTests.find((t) => t.examSlug === jobExamSlug) ?? modelTests[0];
  const jobSubject = jobExam.subjects.find((s) => s.nameEn === jobSubjectEn) ?? jobExam.subjects[0];
  const jobAvailable = qpgModelSectionQuestions(jobExam.examSlug, jobSubject.nameEn);

  // --- Paper setup overrides (free, always editable) ----------------
  const [overrides, setOverrides] = useState<Partial<QpgPaperSetup>>(
    restoredDraft?.overrides ?? {},
  );
  const setOverride = <K extends keyof QpgPaperSetup>(key: K, value: QpgPaperSetup[K]) => {
    setOverrides((prev) => ({ ...prev, [key]: value }));
  };

  // --- Generated paper + preview ------------------------------------
  const [paper, setPaper] = useState<QpgPaper | null>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [previewBusy, setPreviewBusy] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const [showDownload, setShowDownload] = useState(false);

  // --- Smart Generation Progress Screen (UX feature, sprint 27 Nov
  // --- 2026): label is 'Smart Engine', NEVER 'AI' (owner decision
  // --- still owed — the label here is the task's instruction). Every
  // --- step is a REAL client step, driven by actual callbacks —
  // --- never a fake animation: selecting (the selection memo),
  // --- building (buildQpgPaper), rendering (one callback per A4
  // --- page canvas actually drawn). */
  const [genProgress, setGenProgress] = useState<{
    phase: 'selecting' | 'building' | 'rendering';
    donePages: number;
    totalPages: number;
  } | null>(null);
  // Generation run id: a newer run supersedes an older one, so a
  // slow earlier render can never clear a newer run's progress
  // screen or overwrite its preview.
  const genRunRef = useRef(0);
  // Day 4 pacing (26 Nov 2026): each phase is shown only AFTER its
  // real work is done, then held for its minimum dwell (see
  // ../lib/genProgressPacing) before the next phase starts, and the
  // screen stays up for at least ~2s total. The awaits between the
  // setGenProgress calls are what let React actually paint each
  // phase — the Day 2 version set 'selecting' then 'building'
  // synchronously, so React batched them and 'selecting' likely
  // never painted. A phase never advances on a timer alone.

  // --- Post-generation মানবণ্টন editor (pattern 4) + 1-Click Swap
  // --- on every paper question (UX feature): which paper question is
  // --- picking a replacement right now.
  const [paperReplacingId, setPaperReplacingId] = useState<string | null>(null);
  // Paper-swap load-more (comparison fixes, 26 Nov 2026 — C).
  const [paperSwapShowAll, setPaperSwapShowAll] = useState(false);
  // Extras load-more (comparison fixes, 26 Nov 2026 — C).
  const [extrasShowAll, setExtrasShowAll] = useState(false);
  // Multi-section editor (comparison fixes, 26 Nov 2026 — G2+G3):
  // the paper is edited as a list of sections — each with its own
  // heading, type, marks per question and answer-count — instead of
  // one flat section. Paper-level fields (title / instructions /
  // time) stay above the sections. Editor fields are initialised
  // from the paper whenever a (new) paper is built; "প্রয়োগ করুন"
  // rebuilds + re-renders.
  type EditorSection = {
    id: string;
    headingBn: string;
    type: QpgSectionType;
    questionIds: string[];
    marksPerQuestion: number;
    /** '' = answer all. */
    answerCount: string;
  };
  const [editTitle, setEditTitle] = useState('');
  const [editInstructions, setEditInstructions] = useState('');
  const [editTimeMinutes, setEditTimeMinutes] = useState(30);
  const [editorSections, setEditorSections] = useState<EditorSection[]>([]);
  useEffect(() => {
    if (!paper) return;
    setEditTitle(paper.setup.title);
    setEditInstructions(paper.setup.instructions);
    setEditTimeMinutes(paper.setup.timeMinutes);
    setEditorSections(
      qpgPaperSections(paper).map((s) => ({
        id: s.id,
        headingBn: s.headingBn,
        type: s.type,
        questionIds: [...s.questionIds],
        marksPerQuestion: s.marksPerQuestion,
        answerCount:
          s.answerCount && s.answerCount < s.questionIds.length ? String(s.answerCount) : '',
      })),
    );
    setPaperReplacingId(null);
    setPaperSwapShowAll(false);
    setExtrasShowAll(false);
  }, [paper?.id]);

  // --- Topic-wise search (pattern 5): filters only the DISPLAYED
  // --- picker list, never the selection itself.
  const [searchText, setSearchText] = useState('');
  // --- Pre-built combined papers (pattern 6): dropped sections per
  // --- bundle (section checkboxes — the structure is editable even
  // --- while generation stays gated on verified questions).
  const [droppedSections, setDroppedSections] = useState<Record<string, string[]>>({});

  // --- Typo report ----------------------------------------------------
  const [reportFor, setReportFor] = useState<QpgQuestion | null>(null);
  const [reportReason, setReportReason] = useState<QpgReportReason>('typo');
  const [reportDetails, setReportDetails] = useState('');
  const [reportMsg, setReportMsg] = useState('');

  const classes = qpgClassesFor(stream);
  const subjects = qpgSubjectsFor(stream, classId);
  const chapters: QpgChapter[] = stream === 'job_admission' ? [] : qpgChaptersFor(stream, classId, subjectId);
  const classLabel = classes.find((c) => c.id === classId)?.nameBn ?? classId;
  const subjectLabel = subjects.find((s) => s.id === subjectId)?.nameBn ?? subjectId;

  // Cache-first chapter pool: filtering / re-selecting chapters reads
  // sessionStorage, never re-fetches (see ./questionPaperCache).
  const cachedPool = useMemo(
    () =>
      chapterIds.flatMap((id) =>
        loadVerifiedChapterQuestions({ stream, classId, subjectId, chapterId: id }),
      ),
    [chapterIds, stream, classId, subjectId],
  );
  const selection = useMemo(
    () =>
      selectQpgQuestions(
        {
          chapterIds,
          topicIds,
          exerciseIds,
          type: qType,
          // Pattern 3: no pre-generation difficulty control — the
          // verified pool carries no difficulty tags yet, so 'all'
          // is the only honest value (see selectQpgQuestions).
          difficulty: 'all',
          // Request exactly what the chapters hold: the teacher's
          // picks are the per-question checkboxes (selectedIds).
          // Requesting an arbitrary large number here would print
          // a bogus "shortfall" message.
          count: cachedPool.length,
          source: sourceFilter,
          cognitiveLevel: cognitiveFilter,
          nature: natureFilter,
        },
        cachedPool,
      ),
    [chapterIds, topicIds, exerciseIds, qType, cachedPool, sourceFilter, cognitiveFilter, natureFilter],
  );
  const availableQuestions = selection.questions;
  // Pattern 3 — one-click generation: whenever the available list
  // changes (chapter / topic / exam-kind / question-kind), select
  // ALL of them; the teacher tunes by unchecking. Manual unchecks
  // do not re-trigger this (the dep is the available-id list only).
  // A restored draft keeps its own picks on the FIRST run (intersected
  // with what is available now) — later runs select all as normal.
  const availableIdsKey = availableQuestions.map((q) => q.id).join(',');
  const draftRestoreSkipRef = useRef(restoredDraft !== null);
  useEffect(() => {
    if (draftRestoreSkipRef.current) {
      draftRestoreSkipRef.current = false;
      const availableSet = new Set(availableQuestions.map((q) => q.id));
      setSelectedIds((prev) => prev.filter((id) => availableSet.has(id)));
      return;
    }
    setSelectedIds(availableQuestions.map((q) => q.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableIdsKey]);
  const applyEdits = (q: QpgQuestion): QpgQuestion => edits[q.id] ?? q;
  const selectedQuestions = availableQuestions
    .filter((q) => selectedIds.includes(q.id))
    .map(applyEdits);
  // Stable key for the selection (ids in order) — defaultSetup's
  // total marks depend on the MCQ/CQ MIX, not just the count.
  const selectedQuestionsKey = selectedQuestions.map((q) => q.id).join(',');
  // Topic-wise search (pattern 5): filters only the displayed picker
  // list — the selection itself is untouched.
  const displayedQuestions = searchText.trim()
    ? availableQuestions.filter((q) =>
        `${q.questionText} ${q.topicNameBn} ${q.topicNameEn}`
          .toLowerCase()
          .includes(searchText.trim().toLowerCase()),
      )
    : availableQuestions;

  const toggleIn = (list: string[], id: string) =>
    list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

  const pickStream = (s: QpgStream) => {
    setStream(s);
    setPaper(null);
    setPreviewUrls([]);
    setTerm('first');
    setExamKind('half-yearly');
    setQKind('mcq');
    if (s === 'general') {
      setClassId('honours');
      setSubjectId('english');
      setChapterIds(['bcs-english-batch1']);
    } else if (s === 'madrasah') {
      setClassId('ebtedayi');
      setSubjectId('quran');
      setChapterIds([]);
    }
    setTopicIds([]);
    setExerciseIds([]);
    setOverrides({});
  };

  const pickClass = (id: string) => {
    setClassId(id);
    setSubjectId('');
    setChapterIds([]);
    setTopicIds([]);
    setExerciseIds([]);
    setTerm('first');
    setExamKind('half-yearly');
    setQKind('mcq');
    setPaper(null);
    setPreviewUrls([]);
    setOverrides({});
  };

  const pickSubject = (id: string) => {
    setSubjectId(id);
    setChapterIds([]);
    setTopicIds([]);
    setExerciseIds([]);
    setPaper(null);
    setPreviewUrls([]);
    setOverrides({});
  };

  const toggleChapter = (id: string) => {
    const next = toggleIn(chapterIds, id);
    setChapterIds(next);
    setTopicIds([]);
    setExerciseIds([]);
    setPaper(null);
    setPreviewUrls([]);
  };

  // Draft autosave (comparison fixes, 26 Nov 2026 — D): persist the
  // wizard state to localStorage, debounced 300ms, on every change.
  // The paper itself is never saved — only the wizard state.
  const draftSaveTimer = useRef<number | null>(null);
  useEffect(() => {
    if (draftSaveTimer.current !== null) window.clearTimeout(draftSaveTimer.current);
    draftSaveTimer.current = window.setTimeout(() => {
      saveQpgDraft({
        version: 'v1',
        stream,
        classId,
        subjectId,
        chapterIds,
        topicIds,
        exerciseIds,
        term,
        examKind,
        qKind,
        sourceFilter,
        cognitiveFilter,
        natureFilter,
        selectedIds,
        overrides,
        templateId,
        setCode,
        seed,
        includeOmrSheet,
        savedAt: new Date().toISOString(),
      });
    }, 300);
    return () => {
      if (draftSaveTimer.current !== null) window.clearTimeout(draftSaveTimer.current);
    };
  }, [
    stream, classId, subjectId, chapterIds, topicIds, exerciseIds, term, examKind, qKind,
    sourceFilter, cognitiveFilter, natureFilter, selectedIds, overrides, templateId,
    setCode, seed, includeOmrSheet,
  ]);

  const toggleQuestion = (id: string) => {
    const next = toggleIn(selectedIds, id);
    setSelectedIds(next);
  };

  /** Defaults for the paper-setup form, from the current selections. */
  const defaultSetup = useMemo((): QpgPaperSetup => {
    if (stream === 'job_admission') {
      const n = Math.min(jobCount, jobAvailable.length);
      return defaultPaperSetup({
        title: `মডেল টেস্ট — ${jobExam.nameBn} (${jobSubject.nameBn})`,
        subject: jobSubject.nameBn,
        classLabel: jobExam.nameBn,
        questionCount: Math.max(n, 1),
        marksPerQuestion: jobExam.marksPerQuestion,
        timeMinutes: Math.max(10, Math.round((jobExam.timeMinutes * Math.max(n, 1)) / jobExam.questionCount)),
        sectionHeading: 'ক-বিভাগ: বহুনির্বাচনি প্রশ্ন (MCQ)',
        setCode,
        seed,
      });
    }
    // Level-aware title (pattern 3): the exam kind / term chosen
    // in step 5 names the paper; the section heading follows the
    // question kind (CQ / combined / MCQ).
    const termNameBn = QPG_PRIMARY_TERMS.find((t) => t.id === term)?.nameBn ?? 'প্রথম প্রান্তিক';
    const examKindNameBn =
      QPG_SECONDARY_EXAM_KINDS.find((t) => t.id === examKind)?.nameBn ?? 'অর্ধবার্ষিক পরীক্ষা';
    const examTitle =
      level === 'primary'
        ? `${termNameBn} মূল্যায়ন — ${subjectLabel} (${classLabel})`
        : level === 'secondary'
          ? `${examKindNameBn} — ${subjectLabel} (${classLabel})`
          : `প্রশ্নপত্র — ${subjectLabel} (${classLabel})`;
    const sectionHeading =
      qType === 'cq'
        ? 'খ-বিভাগ: সৃজনশীল প্রশ্ন (CQ)'
        : qType === 'all'
          ? 'ক-বিভাগ: বহুনির্বাচনি ও সৃজনশীল প্রশ্ন'
          : 'ক-বিভাগ: বহুনির্বাচনি প্রশ্ন (MCQ)';
    // Total marks + time follow the actual question mix (MCQ × 1 +
    // CQ × 10 marks; MCQ ≈ 1 min, CQ ≈ 20 min each). For MCQ-only
    // papers this is exactly the old values (N marks, N minutes).
    const totalMarks = qpgQuestionsTotalMarks(selectedQuestions);
    const timeMinutes = Math.max(30, qpgQuestionsTimeMinutes(selectedQuestions));
    return defaultPaperSetup({
      title: examTitle,
      subject: subjectLabel,
      classLabel,
      questionCount: Math.max(selectedQuestions.length, 1),
      marksPerQuestion: 1,
      timeMinutes,
      sectionHeading,
      totalMarks,
      setCode,
      seed,
    });
  }, [stream, jobExam, jobSubject, jobCount, jobAvailable.length, subjectLabel, classLabel, selectedQuestionsKey, setCode, seed, level, term, examKind, qType]);

  const setup: QpgPaperSetup = { ...defaultSetup, ...overrides };

  /** Standard Checker (A-Z parity): every section must have enough
   *  verified questions for a balanced paper, and the declared full
   *  marks must match questions × marks-per-question. Chapter papers
   *  check one section per question kind (MCQ 1 mark, CQ 10 marks)
   *  so the marks check is exact for CQ / Combined papers. */
  const standardCheck = useMemo(() => {
    if (stream === 'job_admission') {
      return checkQpgPaperStandard({
        sections: [
          {
            headingBn: setup.sectionHeading,
            requested: Math.min(jobCount, jobAvailable.length),
            available: jobAvailable.length,
            marksPerQuestion: jobExam.marksPerQuestion,
          },
        ],
        declaredMarks: setup.totalMarks,
      });
    }
    const sections = qpgSectionsForQuestions(selectedQuestions).map((s) => ({
      headingBn: s.headingBn,
      requested: s.questionIds.length,
      available: selection.questions.filter((q) => q.type === s.type).length,
      marksPerQuestion: s.marksPerQuestion,
    }));
    return checkQpgPaperStandard({ sections, declaredMarks: setup.totalMarks });
  }, [
    stream,
    jobExam.marksPerQuestion,
    jobCount,
    jobAvailable.length,
    selectedQuestionsKey,
    selection,
    setup.sectionHeading,
    setup.totalMarks,
  ]);

  /** Apply a named paper template (A-Z parity): pre-fills the title,
   *  instructions and section heading; everything stays editable. */
  const applyTemplate = (id: string) => {
    setTemplateId(id);
    if (!id) return;
    const applied = applyQpgTemplate(setup, id);
    setOverrides((prev) => ({
      ...prev,
      title: applied.title,
      instructions: applied.instructions,
      sectionHeading: applied.sectionHeading,
    }));
  };

  /** Full-paper preview (owner 25 Nov 19:03 — "question lukai
   *  rakte hobe na sob dekaw"): every question is rendered, one image
   *  per A4 page, paginated between questions — never mid-question.
   *  Copy-protection (wrapper) stays; only the hiding is gone.
   *  The Smart Engine progress screen is driven by the REAL page
   *  callbacks (onPageRendered): done/total are actual canvases. */
  const renderPreview = async (built: QpgPaper, startedAt: number, runId: number) => {
    const isCurrent = () => genRunRef.current === runId;
    setPreviewBusy(true);
    setPreviewError('');
    const renderStartedAt = Date.now();
    setGenProgress({ phase: 'rendering', donePages: 0, totalPages: 0 });
    try {
      const canvases = await renderPaperCanvases(built, {
        watermarked: true,
        userLabel,
        showPageNumbers: built.setup.pageNumbers ?? false,
        onPageRendered: (done, total) => {
          if (isCurrent()) {
            setGenProgress({ phase: 'rendering', donePages: done, totalPages: total });
          }
        },
      });
      // OMR attach (Day 4): when the toggle is on, the bubble sheet
      // pages follow the paper pages in the SAME preview (watermarked,
      // like the free PDF) — before this the toggle only affected
      // downloads, so the preview showed no sheet at all.
      if (includeOmrSheet) {
        canvases.push(...(await renderOmrSheetCanvases(built, { watermarked: true, userLabel })));
      }
      if (!isCurrent()) return;
      setPreviewUrls(canvases.map((c) => c.toDataURL('image/png')));
      // Close gate: the rendering phase keeps its dwell AND the
      // screen stays up for at least ~2s total — only then clear.
      await waitGenProgressClose(renderStartedAt, startedAt);
      if (isCurrent()) setGenProgress(null);
    } catch (err) {
      if (!isCurrent()) return;
      setPreviewError(`প্রিভিউ তৈরি করা যায়নি: ${err instanceof Error ? err.message : 'অজানা ত্রুটি'}`);
      await waitGenProgressClose(renderStartedAt, startedAt);
      if (isCurrent()) setGenProgress(null);
    } finally {
      if (isCurrent()) setPreviewBusy(false);
    }
  };

  // OMR attach (Day 4): flipping the toggle after a paper exists
  // re-renders the preview so the bubble sheet appears / disappears
  // without forcing a full regenerate.
  useEffect(() => {
    if (!paper) return;
    const runId = ++genRunRef.current;
    void renderPreview(paper, Date.now(), runId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includeOmrSheet]);

  const generateChapterPaper = async () => {
    if (selectedQuestions.length === 0) return;
    const runId = ++genRunRef.current;
    const startedAt = Date.now();
    const isCurrent = () => genRunRef.current === runId;
    let phaseStartedAt = startedAt;
    setGenProgress({ phase: 'selecting', donePages: 0, totalPages: 0 });
    // Real selecting work: order the verified selection for this set.
    const ordered = questionsForSet(selectedQuestions, seed, setCode);
    await waitGenProgressPhase(phaseStartedAt);
    if (!isCurrent()) return;
    phaseStartedAt = Date.now();
    setGenProgress({ phase: 'building', donePages: 0, totalPages: 0 });
    // Real building work: build the paper from the ordered questions.
    // CQ / Combined papers get explicit sections (MCQ 1 mark, CQ 10
    // marks each); MCQ-only papers keep the single-section shape.
    // A sectioned paper's flat list runs MCQ-first, CQ-second (each
    // kind keeps its shuffled set order), so question numbers run
    // 1..N in render order.
    const hasCq = ordered.some((q) => q.type === 'cq');
    const paperQuestions = hasCq
      ? [...ordered.filter((q) => q.type === 'mcq'), ...ordered.filter((q) => q.type === 'cq')]
      : ordered;
    const built = buildQpgPaper({
      setup,
      questions: paperQuestions,
      sections: hasCq ? qpgSectionsForQuestions(paperQuestions) : undefined,
      isCustomVariant: false,
      kind: 'chapter-paper',
      patternLabelBn: 'অধ্যায়ভিত্তিক প্রশ্নপত্র — যাচাইকৃত প্রশ্ন',
      patternLabelEn: 'Chapter-based paper — verified questions',
    });
    setPaper(built);
    rememberPaperKey(built);
    await waitGenProgressPhase(phaseStartedAt);
    if (!isCurrent()) return;
    await renderPreview(built, startedAt, runId);
  };

  const generateModelSection = async () => {
    const n = Math.min(jobCount, jobAvailable.length);
    if (n <= 0) return;
    const runId = ++genRunRef.current;
    const startedAt = Date.now();
    const isCurrent = () => genRunRef.current === runId;
    let phaseStartedAt = startedAt;
    setGenProgress({ phase: 'selecting', donePages: 0, totalPages: 0 });
    // Real selecting work: order the verified Job questions for this set.
    const ordered = questionsForSet(jobAvailable.slice(0, n), seed, setCode);
    await waitGenProgressPhase(phaseStartedAt);
    if (!isCurrent()) return;
    phaseStartedAt = Date.now();
    setGenProgress({ phase: 'building', donePages: 0, totalPages: 0 });
    // Real building work: build the section paper.
    const built = buildQpgPaper({
      setup,
      questions: ordered,
      // A section paper is NOT the full verified pattern — label it so.
      isCustomVariant: true,
      kind: 'model-test-section',
      patternLabelBn: `আংশিক মডেল টেস্ট — ${jobExam.nameBn} (${jobExam.questionCount} প্রশ্নের পূর্ণাঙ্গ প্যাটার্ন নয়)`,
      patternLabelEn: `Partial model test — ${jobExam.nameEn} (not the full ${jobExam.questionCount}-question pattern)`,
    });
    setPaper(built);
    rememberPaperKey(built);
    await waitGenProgressPhase(phaseStartedAt);
    if (!isCurrent()) return;
    await renderPreview(built, startedAt, runId);
  };

  /** Post-generation rebuild (pattern 4): same paper, new questions
   *  and/or setup — re-renders the preview with real progress.
   *  No 'selecting' phase here (the questions are already chosen);
   *  the ~2s total is still guaranteed by the building dwell plus
   *  the close gate in renderPreview. */
  const rebuildPaper = async (
    nextQuestions: QpgQuestion[],
    nextSetup: QpgPaperSetup,
    nextSections?: QpgPaperSection[],
  ) => {
    if (!paper) return;
    const runId = ++genRunRef.current;
    const startedAt = Date.now();
    const isCurrent = () => genRunRef.current === runId;
    const phaseStartedAt = startedAt;
    setGenProgress({ phase: 'building', donePages: 0, totalPages: 0 });
    const built = buildQpgPaper({
      setup: nextSetup,
      questions: nextQuestions,
      sections: nextSections,
      isCustomVariant: paper.isCustomVariant,
      kind: paper.kind,
      patternLabelBn: paper.patternLabelBn,
      patternLabelEn: paper.patternLabelEn,
    });
    setPaper(built);
    rememberPaperKey(built);
    await waitGenProgressPhase(phaseStartedAt);
    if (!isCurrent()) return;
    await renderPreview(built, startedAt, runId);
  };

  /** The verified pool the current paper draws extras from — the
   *  academic chapter pool, or the Job subject pool for Track 3. */
  const paperPool = stream === 'job_admission' ? jobAvailable : availableQuestions;

  /** All questions the editor can reference (pool + paper), by id —
   *  used to resolve a section's question ids in order. */
  const paperQuestionById = useMemo(() => {
    const m = new Map<string, QpgQuestion>();
    for (const q of paperPool) m.set(q.id, q);
    for (const q of paper?.questions ?? []) m.set(q.id, q);
    return m;
  }, [paperPool, paper]);

  /** Apply the মানবণ্টন editor fields to the paper: per-section
   *  heading / type / marks / answer-count, and the paper-level
   *  title / instructions / time. The questions are the sections'
   *  question ids in order; total marks are recomputed from the
   *  sections (count × marks per question). A section with 0
   *  questions stays in the paper (its heading + honest note print)
   *  — it is a planned section, not a silent gap. */
  const applyPaperEdits = () => {
    if (!paper) return;
    const byId = new Map<string, QpgQuestion>();
    for (const q of paperPool) byId.set(q.id, q);
    for (const q of paper.questions) byId.set(q.id, q);
    const nextSections: QpgPaperSection[] = editorSections.map((sec) => {
      const answerRaw =
        sec.answerCount.trim() === ''
          ? undefined
          : Math.max(1, Math.min(sec.questionIds.length, Number(sec.answerCount) || sec.questionIds.length));
      return {
        id: sec.id,
        headingBn: sec.headingBn.trim() || qpgDefaultSectionHeading(sec.type, 0),
        type: sec.type,
        questionIds: sec.questionIds.filter((id) => byId.has(id)),
        marksPerQuestion: Math.max(1, sec.marksPerQuestion || 1),
        answerCount: answerRaw,
      };
    });
    const nextQuestions: QpgQuestion[] = [];
    for (const sec of nextSections) {
      for (const id of sec.questionIds) {
        const q = byId.get(id);
        if (q) nextQuestions.push(applyEdits(q));
      }
    }
    const first = nextSections[0];
    rebuildPaper(
      nextQuestions,
      {
        ...paper.setup,
        title: editTitle,
        sectionHeading: first?.headingBn ?? paper.setup.sectionHeading,
        instructions: editInstructions,
        timeMinutes: Math.max(5, editTimeMinutes || 5),
        totalMarks: qpgMultiSectionTotalMarks(nextSections),
        answerCount: first?.answerCount,
      },
      nextSections,
    );
  };

  /** Extras of one section type — verified questions of that type
   *  from the same chapters, not in the paper yet. Only MCQ has any
   *  today; other types honestly show 0. */
  const extrasForSectionType = (type: QpgSectionType): QpgQuestion[] => {
    const questionType = QPG_SECTION_TYPES.find((t) => t.id === type)?.questionType ?? 'mcq';
    const inPaper = new Set(paper?.questions.map((q) => q.id) ?? []);
    return paperPool.filter((q) => q.type === questionType && !inPaper.has(q.id));
  };

  /** Update one editor section (heading / type / marks / answer-count). */
  const updateEditorSection = (id: string, patch: Partial<EditorSection>) => {
    setEditorSections((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  /** Add a new empty section (default MCQ — the only type with
   *  verified questions today; other types start empty and honest). */
  const addEditorSection = () => {
    setEditorSections((prev) => {
      const type: QpgSectionType = 'mcq';
      return [
        ...prev,
        {
          id: `section-${Date.now().toString(36)}-${prev.length}`,
          headingBn: qpgDefaultSectionHeading(type, prev.length),
          type,
          questionIds: [],
          marksPerQuestion: 1,
          answerCount: '',
        },
      ];
    });
  };

  /** Remove a section (its questions leave the paper). At least one
   *  section always remains. */
  const removeEditorSection = (id: string) => {
    setEditorSections((prev) => (prev.length <= 1 ? prev : prev.filter((s) => s.id !== id)));
  };

  /** Remember the last generated paper's Answer Key (session only) so
   *  the OMR evaluator page can load it. */
  const rememberPaperKey = (built: QpgPaper) => {
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(
          'eduvelto-qpg-last-key',
          JSON.stringify({ title: built.setup.title, answerKey: built.answerKey }),
        );
      }
    } catch {
      // Session storage unavailable — OMR key load just won't find it.
    }
  };

  const submitReport = () => {
    if (!reportFor) return;
    const res = saveDemoReport({
      reporterId: uid,
      questionId: reportFor.id,
      chapterId: reportFor.chapterId,
      reason: reportReason,
      details: reportDetails.trim(),
    });
    if (!res.saved) {
      setReportMsg(`জমা দেওয়া যায়নি: ${res.problems.join(' • ')}`);
      return;
    }
    setReportMsg(
      'রিপোর্ট জমা হয়েছে (ডেমো — স্থানীয়ভাবে সংরক্ষিত)। অ্যাডমিন রিভিউয়ের জন্য qpgReports কালেকশন + রুল শাখায় প্রস্তুত; লাইভে এখনো যায়নি। রিপোর্ট থেকে কোনো প্রশ্ন স্বয়ংক্রিয়ভাবে বদলায় না।',
    );
    setReportDetails('');
  };

  return (
    <PageShell titleBn="প্রশ্নপত্র জেনারেটর" titleEn="Question Paper Generator" wide className="ev-qpg-theme">
      <AlertBox tone="info">
        যাচাইকৃত প্রশ্ন: ২,৩৫৩টি MCQ (৩৫টি BCS ইংরেজি + ২,৩১৮টি একাডেমিক, Class 3–12) ও ৩৫৯টি
        সৃজনশীল (CQ) প্রশ্ন (Class 9–12)। Class 3–8 + মাদ্রাসার বই সংগ্রহ ও যাচাই চলছে; যাচাই শেষে
        অধ্যায়ভিত্তিক প্রশ্ন এখানে যোগ হবে। যাচাই হয়নি এমন প্রশ্ন এই জেনারেটরে কখনো দেখানো হয় না।{' '}
        <Link to="/jobs/bcs/practice/english">যাচাইকৃত ৩৫টি BCS প্রশ্ন দেখুন</Link>
      </AlertBox>
      <p style={{ fontSize: 13, color: '#555', margin: '12px 0 4px' }}>
        ফ্রি: প্রতি মাসে {QPG_FREE_MONTHLY_LIMIT}টি পেপার (এই মাসে ব্যবহার {usage.used}/{usage.limit}
        {usageSource === 'demo' ? ' — ডেমো কোটা, স্থানীয়' : ''})। Pro: প্রতি পেপার ৳{QPG_PRO_PER_PAPER_BDT} অথবা ৳{QPG_PRO_MONTHLY_BDT}/মাস অথবা
        ক্লাসভিত্তিক বার্ষিক ৳{QPG_CHEAPEST_ANNUAL_BDT} থেকে — {QPG_PRICE_CLAIM_BN}।{' '}
      </p>
      <p style={{ fontSize: 13, margin: '0 0 12px' }}>
        <Link to="/sheet-builder">শিট বিল্ডার (অধ্যায় → অনুশীলনী)</Link>
        {' · '}
        <Link to="/smartboard">স্মার্টবোর্ড</Link>
        {' · '}
        <Link to="/contribute">প্রশ্ন জমা দিন</Link>
        {' · '}
        <Link to="/my-orders">আমার অর্ডার</Link>
        {' · '}
        <Link to="/custom-paper">কাস্টম পেপার (৳৪৯)</Link>
      </p>

      {/* Pre-built combined papers (pattern 6): Class 8 scholarship
          bundles — 100 marks / 3 hours, sections droppable. Verified
          Class 8 MCQs arrived 26 Nov 2026, so each section shows its
          real verified count — but bundle generation itself (the button
          handler) is NOT built yet, so the button stays disabled with
          the honest reason. Never enable it on the ready flag alone:
          the pool holds MCQs only, and the creative / short-answer
          marks cannot be filled from it. No questions are invented to
          fill a bundle. */}
      <Card style={{ marginBottom: 16 }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 16 }}>
          প্রস্তুত পেপার — Class 8 স্কলারশিপ বান্ডল (১০০ নম্বর · ৩ ঘণ্টা)
        </h2>
        <p style={{ fontSize: 13, color: '#555', margin: '0 0 12px' }}>
          পুরো বান্ডল একবারে — সেকশন বাদ দিতে পারবেন (টিক উঠিয়ে দিন)। ৮ম শ্রেণির যাচাইকৃত প্রশ্ন
          এসেছে, প্রতিটি সেকশনে যাচাইকৃত প্রশ্নের সংখ্যা দেখানো হচ্ছে; বান্ডল থেকে পেপার বানানো এখনো
          চালু হয়নি।
        </p>
        {QPG_COMBINED_PAPERS.map((bundle) => {
          const dropped = droppedSections[bundle.id] ?? [];
          const ready = qpgCombinedPaperReady(bundle, dropped);
          return (
            <div
              key={bundle.id}
              style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12, marginBottom: 10 }}
            >
              <strong style={{ fontSize: 14 }}>{bundle.nameBn}</strong>
              <div style={{ fontSize: 13, color: '#555', margin: '4px 0 8px' }}>
                {bundle.totalMarks} নম্বর · {Math.floor(bundle.timeMinutes / 60)} ঘণ্টা · ৮ম শ্রেণি
              </div>
              {bundle.sections.map((sec) => {
                const available = qpgCombinedSectionAvailable(sec);
                const isDropped = dropped.includes(sec.id);
                return (
                  <label key={sec.id} style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>
                    <input
                      type="checkbox"
                      checked={!isDropped}
                      onChange={() =>
                        setDroppedSections((prev) => ({
                          ...prev,
                          [bundle.id]: isDropped
                            ? (prev[bundle.id] ?? []).filter((x) => x !== sec.id)
                            : [...(prev[bundle.id] ?? []), sec.id],
                        }))
                      }
                    />{' '}
                    {sec.headingBn} — {sec.marks} নম্বর · যাচাইকৃত {available}টি প্রশ্ন
                  </label>
                );
              })}
              <div style={{ marginTop: 8 }}>
                {/* No generation handler exists yet (26 Nov 2026): the
                    button stays disabled even when `ready` is true.
                    Enable it only together with the handler. */}
                <Button variant="outline" size="sm" disabled>
                  এই বান্ডল থেকে পেপার বানান
                </Button>{' '}
                {!ready ? (
                  <span style={{ fontSize: 12, color: '#666' }}>
                    যাচাইকৃত প্রশ্ন নেই (০টি) — Class 8-এর প্রশ্ন যাচাই শেষে এলে তৈরি করা যাবে। প্রশ্ন
                    বানিয়ে ঘাটতি পূরণ করা হবে না।
                  </span>
                ) : (
                  <span style={{ fontSize: 12, color: '#666' }}>
                    যাচাইকৃত প্রশ্ন এসেছে — তবে বান্ডল থেকে পেপার বানানো এখনো চালু হয়নি।
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </Card>

      {/* Step 1 — Stream */}
      <Card style={{ marginBottom: 16 }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 16 }}>১. ধারা বেছে নিন (Stream)</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {QPG_STREAMS.map((s) => (
            <Button
              key={s.id}
              variant={stream === s.id ? 'primary' : 'outline'}
              onClick={() => pickStream(s.id)}
            >
              {s.nameBn} ({s.nameEn})
            </Button>
          ))}
        </div>
      </Card>

      {stream === 'job_admission' ? (
        <Card style={{ marginBottom: 16 }}>
          <h2 style={{ margin: '0 0 8px', fontSize: 16 }}>২. মডেল টেস্ট বেছে নিন (যাচাইকৃত প্যাটার্ন)</h2>
          <p style={{ fontSize: 13, color: '#555', margin: '0 0 12px' }}>
            প্যাটার্ন শুধু যাচাইকৃত অফিসিয়াল সিলেবাস/বিজ্ঞপ্তি থেকে নেওয়া। প্রাথমিক শিক্ষকের পেপার ডিফল্ট
            ৯০ নম্বরের — ৮০ নম্বরের উদাহরণটি কাস্টম ভ্যারিয়েন্ট, ডিফল্ট নয়; কাস্টম সংখ্যা বেছে নিলে পেপারে
            “কাস্টম ভ্যারিয়েন্ট” লেখা থাকবে, প্রকৃত প্যাটার্ন বলে দাবি করা হবে না।
          </p>
          {modelTests.map((t) => {
            const shortfall = t.questionCount - t.totalVerifiedAvailable;
            return (
              <div
                key={t.examSlug}
                style={{
                  border: `2px solid ${jobExamSlug === t.examSlug ? '#1a4d8f' : '#ddd'}`,
                  borderRadius: 8, padding: 12, marginBottom: 10,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                  <strong>{t.nameBn} ({t.nameEn})</strong>
                  <span>
                    <Chip tone={t.fullMockPossible ? 'gold' : 'outline'}>
                      {t.fullMockPossible ? 'পূর্ণাঙ্গ মক সম্ভব' : 'পূর্ণাঙ্গ মক এখনো সম্ভব নয়'}
                    </Chip>
                  </span>
                </div>
                <p style={{ fontSize: 13, margin: '6px 0' }}>
                  {t.questionCount} প্রশ্ন • {t.timeMinutes} মিনিট • প্রতি প্রশ্ন {t.marksPerQuestion} নম্বর
                  {t.negativeMarking !== null ? ` • ভুল উত্তরে −${t.negativeMarking}` : ' • নেগেটিভ মার্কিং নেই'}
                  {t.passMark !== null ? ` • পাস ${t.passMark}` : ''}
                  {t.patternStatus === 'last-verified-18th' ? ' • প্যাটার্ন: ১৮তম (সর্বশেষ যাচাইকৃত)' : ' • প্যাটার্ন: যাচাইকৃত'}
                </p>
                <p style={{ fontSize: 12, color: '#666', margin: '0 0 8px' }}>উৎস: {t.patternSourceBn}</p>
                <p style={{ fontSize: 13, margin: '0 0 8px' }}>
                  যাচাইকৃত প্রশ্ন আছে: <strong>{t.totalVerifiedAvailable}টি</strong> / দরকার {t.questionCount}টি
                  {shortfall > 0 ? ` — আরও ${shortfall}টি বাকি। পূর্ণাঙ্গ মডেল টেস্ট বানাতে প্রশ্ন বানানো হবে না।` : ''}
                </p>
                <div style={{ fontSize: 13, marginBottom: 8 }}>
                  {t.subjects.map((s) => (
                    <div key={s.nameEn}>
                      {s.nameBn}: প্যাটার্ন {s.marks} • যাচাইকৃত {s.verifiedAvailable}টি
                    </div>
                  ))}
                </div>
                <Button
                  variant={jobExamSlug === t.examSlug ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setJobExamSlug(t.examSlug);
                    setJobSubjectEn(t.subjects[0].nameEn);
                    setPaper(null);
                    setPreviewUrls([]);
                    setOverrides({});
                  }}
                >
                  {jobExamSlug === t.examSlug ? 'নির্বাচিত' : 'এই পরীক্ষা বেছে নিন'}
                </Button>
              </div>
            );
          })}

          {QPG_PENDING_TRACK3_EXAMS.map((p) => (
            <div
              key={p.examSlug}
              style={{ border: '2px dashed #ccc', borderRadius: 8, padding: 12, marginBottom: 10, opacity: 0.85 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                <strong>{p.nameBn} ({p.nameEn})</strong>
                <span>
                  <Chip tone="outline">যাচাইয়ের অপেক্ষায় — বন্ধ আছে</Chip>
                </span>
              </div>
              <p style={{ fontSize: 13, margin: '6px 0 0' }}>{p.blockedReasonBn}</p>
            </div>
          ))}

          <h3 style={{ margin: '12px 0 8px', fontSize: 15 }}>বিষয়ভিত্তিক সেকশন পেপার (যাচাইকৃত প্রশ্ন দিয়ে)</h3>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
            {jobExam.subjects.map((s) => (
              <Button
                key={s.nameEn}
                variant={jobSubjectEn === s.nameEn ? 'primary' : 'outline'}
                size="sm"
                onClick={() => {
                  setJobSubjectEn(s.nameEn);
                  setPaper(null);
                  setPreviewUrls([]);
                  setOverrides({});
                }}
              >
                {s.nameBn} ({s.verifiedAvailable}টি যাচাইকৃত)
              </Button>
            ))}
          </div>
          {jobAvailable.length === 0 ? (
            <AlertBox tone="info">
              এই বিষয়ের যাচাইকৃত প্রশ্ন এখনো তৈরি হয়নি — পূর্ণাঙ্গ বা সেকশন পেপার কোনোটাই বানানো যাবে না।
              প্রশ্ন বানিয়ে ঘাটতি পূরণ করা হবে না।
            </AlertBox>
          ) : (
            <div>
              <label style={{ fontSize: 13 }}>
                প্রশ্ন সংখ্যা (সর্বোচ্চ {jobAvailable.length}টি যাচাইকৃত; {jobExam.nameBn} প্যাটার্নে এই বিষয়ে{' '}
                {jobSubject.marks}টি):
                <ClearableNumberInput
                  value={jobCount}
                  min={1}
                  max={jobAvailable.length}
                  onCommit={setJobCount}
                  style={{ ...fieldStyle(), maxWidth: 120 }}
                />
              </label>
              {jobExam.examSlug === 'primary-teacher' && jobCount !== 90 ? (
                <AlertBox tone="info">
                  কাস্টম ভ্যারিয়েন্ট: প্রাথমিক শিক্ষকের প্রকৃত প্যাটার্ন ৯০ প্রশ্ন/৯০ মিনিট। এই পেপারে
                  “কাস্টম ভ্যারিয়েন্ট” লেখা থাকবে।
                </AlertBox>
              ) : null}
              <div style={{ marginTop: 10 }}>
                <Button onClick={generateModelSection}>
                  সেকশন পেপার তৈরি করুন ({Math.min(jobCount, jobAvailable.length)}টি প্রশ্ন)
                </Button>{' '}
                <Button variant="outline" disabled>
                  পূর্ণাঙ্গ মডেল টেস্ট ({jobExam.questionCount} প্রশ্ন) — যাচাইকৃত প্রশ্ন অপর্যাপ্ত
                </Button>
              </div>
            </div>
          )}
        </Card>
      ) : (
        <>
          {/* Step 2 — Class */}
          <Card style={{ marginBottom: 16 }}>
            <h2 style={{ margin: '0 0 8px', fontSize: 16 }}>২. শ্রেণি / স্তর বেছে নিন (Class)</h2>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {classes.map((c) => (
                <Button
                  key={c.id}
                  variant={classId === c.id ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => pickClass(c.id)}
                >
                  {c.nameBn}
                </Button>
              ))}
            </div>
          </Card>

          {/* Step 3 — Subject */}
          <Card style={{ marginBottom: 16 }}>
            <h2 style={{ margin: '0 0 8px', fontSize: 16 }}>৩. বিষয় বেছে নিন (Subject)</h2>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {subjects.map((s) => (
                <Button
                  key={s.id}
                  variant={subjectId === s.id ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => pickSubject(s.id)}
                >
                  {s.nameBn}
                </Button>
              ))}
            </div>
            {subjectId === '' ? <p style={{ fontSize: 13 }}>উপরে একটি বিষয় বেছে নিন।</p> : null}
          </Card>

          {/* Step 4 — Chapter (multi-select, pattern 1: counts +
              drill-down, select-all + live counter, next step gated
              on >= 1 selection) */}
          {subjectId !== '' ? (
            <Card style={{ marginBottom: 16 }}>
              <h2 style={{ margin: '0 0 8px', fontSize: 16 }}>
                ৪. অধ্যায় বেছে নিন (Chapter) — এক বা একাধিক
              </h2>
              {chapters.length === 0 ? (
                <AlertBox tone="info">
                  এই অধ্যায়ের যাচাইকৃত প্রশ্ন এখনো তৈরি হয়নি। এই বিষয়ের NCTB বই যাচাই শেষে অধ্যায়ভিত্তিক
                  প্রশ্ন এখানে যোগ হবে — ততদিন কোনো প্রশ্ন দেখানো হবে না।{' '}
                  <Link to="/library">বই দেখুন</Link> — লাইব্রেরিতে বইগুলো পড়া যায়।
                </AlertBox>
              ) : (
                <>
                  <p style={{ fontSize: 13, margin: '0 0 10px' }}>
                    নির্বাচিত: <strong>{chapterIds.length}/{chapters.length} অধ্যায়</strong>
                    {chapterIds.length > 0
                      ? (() => {
                          const sel = chapters.filter((c) => chapterIds.includes(c.id));
                          const mcq = sel.reduce((sum, c) => sum + c.verifiedCount, 0);
                          const cq = sel.reduce((sum, c) => sum + (c.cqVerifiedCount ?? 0), 0);
                          return ` — যাচাইকৃত ${mcq}টি প্রশ্ন${cq > 0 ? ` • ${cq}টি সৃজনশীল (CQ)` : ''}`;
                        })()
                      : ''}
                    {' · '}
                    <Link to="/library">বই দেখুন</Link>
                    {' · '}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setChapterIds(chapters.map((c) => c.id));
                        setTopicIds([]);
                        setPaper(null);
                        setPreviewUrls([]);
                      }}
                    >
                      সব নির্বাচন
                    </Button>{' '}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setChapterIds([]);
                        setTopicIds([]);
                        setPaper(null);
                        setPreviewUrls([]);
                      }}
                    >
                      সব বাতিল
                    </Button>
                  </p>
                  {chapters.map((ch) => (
                    <div
                      key={ch.id}
                      style={{
                        border: '1px solid #ddd', borderRadius: 8,
                        padding: 10, marginBottom: 8, fontSize: 14,
                      }}
                    >
                      <label style={{ cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={chapterIds.includes(ch.id)}
                          onChange={() => toggleChapter(ch.id)}
                        />{' '}
                        <strong>{ch.nameBn}</strong> — যাচাইকৃত {ch.verifiedCount}টি প্রশ্ন
                        {(ch.cqVerifiedCount ?? 0) > 0
                          ? ` • ${(ch.cqVerifiedCount ?? 0)}টি সৃজনশীল (CQ)`
                          : ''}
                      </label>
                      <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{ch.sourceNoteBn}</div>
                      {ch.topics.length > 0 ? (
                        <div style={{ marginTop: 6 }}>
                          <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
                            টপিক (অধ্যায়ের ভেতরে — আলাদা করে বাছা যায়):
                          </div>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {ch.topics.map((t) => (
                              <Button
                                key={t.id}
                                variant={topicIds.includes(t.id) ? 'primary' : 'outline'}
                                size="sm"
                                onClick={() => setTopicIds(toggleIn(topicIds, t.id))}
                              >
                                {t.nameBn} ({t.verifiedCount})
                              </Button>
                            ))}
                          </div>
                        </div>
                      ) : null}
                      {(() => {
                        // Exercise sub-selection (comparison fixes, A3):
                        // individual অনুশীলনী inside a chapter (Math
                        // first, reusing the Sheet Builder's registry).
                        // Shown only when Phase B has extracted this
                        // chapter's exercise list; otherwise nothing
                        // (the chapter-level selection still works).
                        const exEntry = qpgExercisesFor(ch.id);
                        if (!exEntry || exEntry.exercises.length === 0) return null;
                        return (
                          <div style={{ marginTop: 6 }}>
                            <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
                              অনুশীলনী (অধ্যায়ের ভেতরে — আলাদা করে বাছা যায়):
                            </div>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                              {exEntry.exercises.map((ex) => (
                                <Button
                                  key={ex.id}
                                  variant={exerciseIds.includes(ex.id) ? 'primary' : 'outline'}
                                  size="sm"
                                  disabled={ex.verifiedCount === 0}
                                  onClick={() => setExerciseIds(toggleIn(exerciseIds, ex.id))}
                                >
                                  অনুশীলনী {ex.numberBn} ({ex.verifiedCount})
                                </Button>
                              ))}
                            </div>
                            <p style={{ fontSize: 12, color: '#666', margin: '4px 0 0' }}>
                              অনুশীলনী বাছলে শুধু সেই অনুশীলনীর যাচাইকৃত প্রশ্ন আসবে। যাচাইকৃত প্রশ্ন নেই
                              এমন অনুশীলনী বন্ধ আছে।
                            </p>
                          </div>
                        );
                      })()}
                    </div>
                  ))}
                  <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <Button
                      disabled={chapterIds.length === 0}
                      onClick={() => {
                        document
                          .getElementById('qpg-step-exam-kind')
                          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                    >
                      পরবর্তী ধাপ — পরীক্ষার ধরন বাছুন
                    </Button>
                    <Button
                      variant="outline"
                      disabled={chapterIds.length === 0}
                      onClick={() => {
                        saveQpgFlowPrefill({ stream, classId, subjectId, chapterIds });
                        navigate('/sheet-builder');
                      }}
                    >
                      এই অধ্যায়গুলো দিয়ে শিট বানান
                    </Button>
                  </div>
                  {chapterIds.length === 0 ? (
                    <p style={{ fontSize: 13, color: '#666', margin: '8px 0 0' }}>
                      পরবর্তী ধাপে যেতে কমপক্ষে ১টি অধ্যায় বেছে নিন। একই অধ্যায় দিয়ে পরীক্ষার পেপার বা
                      শিট — দুটোই বানানো যায়।
                    </p>
                  ) : (
                    <p style={{ fontSize: 13, color: '#666', margin: '8px 0 0' }}>
                      একই অধ্যায় দিয়ে পরীক্ষার পেপার বা শিট — দুটোই বানানো যায়।
                    </p>
                  )}
                </>
              )}
            </Card>
          ) : null}

          {/* Step 5 — Level-aware exam kind (pattern 3). Primary =
              term only; secondary = exam kind + question kind;
              Honours = question kind only. No marks / count /
              difficulty input before generation. */}
          {chapterIds.length > 0 ? (
            <Card style={{ marginBottom: 16 }}>
              <h2 id="qpg-step-exam-kind" style={{ margin: '0 0 8px', fontSize: 16 }}>
                ৫. পরীক্ষার ধরন বেছে নিন
                {level === 'primary'
                  ? ' (প্রাথমিক — প্রান্তিক)'
                  : level === 'secondary'
                    ? ' (মাধ্যমিক — অর্ধবার্ষিক / বার্ষিক)'
                    : ' (অনার্স — প্রশ্নের ধরন)'}
              </h2>
              {level === 'primary' ? (
                <div>
                  <p style={{ fontSize: 13, margin: '0 0 8px' }}>কোন প্রান্তিকের পরীক্ষা?</p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {QPG_PRIMARY_TERMS.map((t) => (
                      <Button
                        key={t.id}
                        variant={term === t.id ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => setTerm(t.id)}
                      >
                        {t.nameBn}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : null}
              {level === 'secondary' ? (
                <div>
                  <p style={{ fontSize: 13, margin: '0 0 8px' }}>পরীক্ষা কোনটি?</p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                    {QPG_SECONDARY_EXAM_KINDS.map((t) => (
                      <Button
                        key={t.id}
                        variant={examKind === t.id ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => setExamKind(t.id)}
                      >
                        {t.nameBn}
                      </Button>
                    ))}
                  </div>
                  <p style={{ fontSize: 13, margin: '0 0 8px' }}>প্রশ্নের ধরন কোনটি?</p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {qpgSecondaryQKindsFor(subjectId).map((t) => (
                      <Button
                        key={t.id}
                        variant={qKind === t.id ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => setQKind(t.id)}
                      >
                        {t.nameBn}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : null}
              {level === 'tertiary' ? (
                <div>
                  <p style={{ fontSize: 13, margin: '0 0 8px' }}>প্রশ্নের ধরন কোনটি?</p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {qpgSecondaryQKindsFor(subjectId).map((t) => (
                      <Button
                        key={t.id}
                        variant={qKind === t.id ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => setQKind(t.id)}
                      >
                        {t.nameBn}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : null}
              {qKind !== 'mcq' && level !== 'primary' ? (
                <AlertBox tone="info">
                  {qKind === 'combined'
                    ? 'সমন্বিত পেপারে যাচাইকৃত MCQ ও সৃজনশীল (CQ) — দুটোই আসবে (Class 9–12-এ CQ আছে; অন্য শ্রেণিতে শুধু MCQ)। প্রশ্ন বানিয়ে ঘাটতি পূরণ করা হবে না।'
                    : qKind === 'creative'
                      ? 'সৃজনশীল (CQ) প্রশ্ন এখন Class 9–12-এ যাচাইকৃত আছে। অন্য শ্রেণিতে এই ধরনের যাচাইকৃত প্রশ্ন এখনো তৈরি হয়নি — যাচাইকৃত প্যাক এলে চালু হবে; প্রশ্ন বানিয়ে ঘাটতি পূরণ করা হবে না।'
                      : 'যাচাইকৃত প্রশ্নভান্ডারে এখন MCQ ও সৃজনশীল (CQ) আছে — এই ধরনের (রচনামূলক) যাচাইকৃত প্রশ্ন এখনো তৈরি হয়নি। যাচাইকৃত প্যাক এলে এই ধরন পুরোপুরি চালু হবে; প্রশ্ন বানিয়ে ঘাটতি পূরণ করা হবে না।'}
                </AlertBox>
              ) : null}
            </Card>
          ) : null}

          {/* Step 6 — Question picker (pattern 3: one-click — every
              verified question is auto-selected; uncheck to remove.
              No count / difficulty input before generation; tuning
              happens here by ticking, and in the paper setup below). */}
          {chapterIds.length > 0 ? (
            <Card style={{ marginBottom: 16 }}>
              <h2 style={{ margin: '0 0 8px', fontSize: 16 }}>৬. প্রশ্ন বাছুন (যাচাইকৃত প্রশ্ন)</h2>
              <p style={{ fontSize: 13, color: '#555', margin: '0 0 10px' }}>
                এই অধ্যায়ের সব যাচাইকৃত প্রশ্ন আগেই নির্বাচিত — যেটা লাগবে না, তার টিক উঠিয়ে দিন।
                নম্বর / কাঠিন্য আগেভাগে ঠিক করতে হয় না; পেপারের সেটআপ নিচে বদলানো যায়।
              </p>
              <label style={{ fontSize: 13, display: 'block', marginBottom: 10 }}>
                টপিক / প্রশ্ন খুঁজুন (শুধু যাচাইকৃত প্রশ্নের ভেতরে)
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="যেমন: grammar, tense, vocabulary…"
                  style={{ ...fieldStyle(), maxWidth: 320 }}
                />
              </label>
              {searchText.trim() ? (
                <p style={{ fontSize: 13, margin: '0 0 10px' }}>
                  খুঁজে পাওয়া গেছে {displayedQuestions.length}টি প্রশ্ন।
                </p>
              ) : null}
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 10 }}>
                <label style={{ fontSize: 13 }}>
                  উৎস (Source)
                  <select
                    value={sourceFilter}
                    onChange={(e) => setSourceFilter(e.target.value as QpgQuestionSource | 'any')}
                    style={{ ...fieldStyle(), maxWidth: 220 }}
                  >
                    {QPG_SOURCE_OPTIONS.map((s) => (
                      <option key={s.id} value={s.id} disabled={s.disabled}>
                        {s.nameBn}
                        {s.disabled ? ` — ${s.disabledReasonBn}` : ''}
                      </option>
                    ))}
                  </select>
                </label>
                <label style={{ fontSize: 13 }}>
                  জ্ঞানের স্তর (Cognitive Level)
                  <select
                    value={cognitiveFilter}
                    onChange={(e) => setCognitiveFilter(e.target.value as QpgCognitiveLevel | 'any')}
                    style={{ ...fieldStyle(), maxWidth: 220 }}
                  >
                    {QPG_COGNITIVE_OPTIONS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nameBn} ({c.nameEn})
                      </option>
                    ))}
                  </select>
                </label>
                <label style={{ fontSize: 13 }}>
                  ধরন (Nature)
                  <select
                    value={natureFilter}
                    onChange={(e) => setNatureFilter(e.target.value as QpgQuestionNature | 'any')}
                    style={{ ...fieldStyle(), maxWidth: 200 }}
                  >
                    {QPG_NATURE_OPTIONS.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.nameBn} ({o.nameEn})
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <p style={{ fontSize: 12, color: '#666', margin: '0 0 10px' }}>
                স্মার্ট ফিল্টার: বোর্ড/টেস্ট/পুনরাবৃত্ত বোর্ড/একাধিক স্কুলের প্রশ্নের ফিল্টার বন্ধ আছে —
                যাচাইকৃত বোর্ড প্রশ্ন এখনো ০টি, তাই কোনো প্রশ্নকে বোর্ড প্রশ্ন বলে দেখানো হয় না। পাঠ্যবই
                (Textbook-only) ও গাইড (Guide-only) ফিল্টারও বন্ধ — যাচাইকৃত পাঠ্যবই/গাইড প্রশ্ন এখনো ০টি।
                জ্ঞানের স্তর ও ধরন এখনো ট্যাগ করা হয়নি — ট্যাগ এলে এই ফিল্টারগুলো চালু হবে।
              </p>
              {selection.reasonsBn.map((r) => (
                <AlertBox key={r} tone="info">
                  {r}
                </AlertBox>
              ))}
              {availableQuestions.length > 0 ? (
                <div>
                  <p style={{ fontSize: 13 }}>
                    যাচাইকৃত প্রশ্ন পাওয়া গেছে {selection.available}টি — নির্বাচিত {selectedQuestions.length}টি।
                    প্রতিটি প্রশ্নে “ভুল জানান” বোতাম আছে।
                  </p>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedIds(availableQuestions.map((q) => q.id));
                      }}
                    >
                      সব নিন ({availableQuestions.length}টি)
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedIds([]);
                      }}
                    >
                      সব বাতিল
                    </Button>
                  </div>
                  {displayedQuestions.map((q, i) => {
                    const shown = applyEdits(q);
                    const isEditing = editingId === q.id;
                    return (
                    <div
                      key={q.id}
                      style={{ border: '1px solid #eee', borderRadius: 8, padding: 10, marginBottom: 8 }}
                    >
                      <label style={{ fontSize: 14, cursor: 'pointer', display: 'block' }}>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(q.id)}
                          onChange={() => toggleQuestion(q.id)}
                        />{' '}
                        <strong>{i + 1}.</strong> {shown.questionText}{' '}
                        <Chip tone="outline">{shown.topicNameBn}</Chip>
                        {isCqQuestion(shown) ? (
                          <Chip tone="outline">সৃজনশীল (CQ) • ১০ নম্বর</Chip>
                        ) : null}
                        {shown.edited ? <Chip tone="gold">শিক্ষক-সম্পাদিত</Chip> : null}
                      </label>
                      {isCqQuestion(shown) && shown.parts ? (
                        <div style={{ fontSize: 12, color: '#666', marginTop: 4, paddingLeft: 24 }}>
                          {shown.parts
                            .map((p) => `${p.label}. ${p.question} (${p.marks} নম্বর)`)
                            .join('   ')}
                        </div>
                      ) : (
                        <div style={{ fontSize: 12, color: '#666', marginTop: 4, paddingLeft: 24 }}>
                          {(shown.options ?? []).map((o) => `( ${o.letter} ) ${o.text}`).join('   ')}
                        </div>
                      )}
                      <div style={{ marginTop: 6, paddingLeft: 24, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setReportFor(q);
                            setReportMsg('');
                          }}
                        >
                          ভুল জানান (Report Typo/Error)
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingId(isEditing ? null : q.id)}
                        >
                          {isEditing ? 'সম্পাদনা বন্ধ' : 'প্রশ্ন সম্পাদনা (ফ্রি)'}
                        </Button>
                        {selectedIds.includes(q.id) ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setReplacingId(replacingId === q.id ? null : q.id);
                              setPickerSwapShowAll(false);
                            }}
                          >
                            {replacingId === q.id ? 'বদলানো বাতিল' : 'বদলান'}
                          </Button>
                        ) : null}
                        {shown.edited ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEdits((prev) => {
                                const next = { ...prev };
                                delete next[q.id];
                                return next;
                              });
                            }}
                          >
                            মূল প্রশ্নে ফিরুন
                          </Button>
                        ) : null}
                      </div>
                      {isEditing ? (
                        <div style={{ marginTop: 8, paddingLeft: 24 }}>
                          <p style={{ fontSize: 12, color: '#666', margin: '0 0 6px' }}>
                            এক্সপোর্টের আগে প্রশ্ন সম্পাদনা করা যায় (পেপার তৈরির অংশ — ফ্রি)। সম্পাদিত প্রশ্নে
                            “শিক্ষক-সম্পাদিত” চিহ্ন থাকবে।
                          </p>
                          <label style={{ fontSize: 13, display: 'block' }}>
                            প্রশ্ন
                            <input
                              type="text"
                              value={shown.questionText}
                              onChange={(e) =>
                                setEdits((prev) => ({
                                  ...prev,
                                  [q.id]: { ...shown, questionText: e.target.value, edited: true },
                                }))
                              }
                              style={fieldStyle()}
                            />
                          </label>
                          {isCqQuestion(shown) ? (
                            <p style={{ fontSize: 12, color: '#666', margin: '6px 0 0' }}>
                              সৃজনশীল প্রশ্নের উদ্দীপক (উপরের “প্রশ্ন” ঘর) সম্পাদনা করা যায়। ক/খ/গ/ঘ অংশের
                              ইনলাইন সম্পাদনা এখনো নেই — অংশ বদলাতে প্রশ্নটি বদলে নিন।
                            </p>
                          ) : (
                            (shown.options ?? []).map((o, oi) => (
                            <label key={o.letter} style={{ fontSize: 13, display: 'block', marginTop: 6 }}>
                              অপশন {o.letter}
                              <input
                                type="text"
                                value={o.text}
                                onChange={(e) =>
                                  setEdits((prev) => {
                                    const nextOptions = (shown.options ?? []).map((op, j) =>
                                      j === oi ? { ...op, text: e.target.value } : op,
                                    );
                                    return {
                                      ...prev,
                                      [q.id]: { ...shown, options: nextOptions, edited: true },
                                    };
                                  })
                                }
                                style={fieldStyle()}
                              />
                            </label>
                          )))}
                          <div style={{ marginTop: 8 }}>
                            <Button size="sm" onClick={() => setEditingId(null)}>
                              সংরক্ষণ
                            </Button>
                          </div>
                        </div>
                      ) : null}
                      {replacingId === q.id ? (
                        <div style={{ marginTop: 8, paddingLeft: 24 }}>
                          <p style={{ fontSize: 12, color: '#666', margin: '0 0 6px' }}>
                            এই প্রশ্নের বদলে নিচের যাচাইকৃত প্রশ্নগুলোর একটি নিন — বাছলেই একই জায়গায় বদলে
                            যাবে (সংরক্ষিত হবে)। বদলানোর মতো{' '}
                            {
                              availableQuestions.filter(
                                (c) => c.id !== q.id && !selectedIds.includes(c.id),
                              ).length
                            }
                            টি প্রশ্ন আছে।
                          </p>
                          {(() => {
                            // Swap picker (comparison fixes, C): no
                            // hard 5-cap any more — first 10, then
                            // "আরও দেখুন" reveals the rest.
                            const candidates = availableQuestions.filter(
                              (c) => c.id !== q.id && !selectedIds.includes(c.id),
                            );
                            const shown = pickerSwapShowAll ? candidates : candidates.slice(0, 10);
                            return (
                              <>
                                {shown.map((c) => (
                                  <div
                                    key={c.id}
                                    style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}
                                  >
                                    <span style={{ fontSize: 13, flex: 1 }}>{c.questionText}</span>
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        setSelectedIds(replaceQpgQuestion(selectedIds, q.id, c.id));
                                        setReplacingId(null);
                                        setPickerSwapShowAll(false);
                                      }}
                                    >
                                      এই প্রশ্নটি নিন
                                    </Button>
                                  </div>
                                ))}
                                {candidates.length > 10 && !pickerSwapShowAll ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPickerSwapShowAll(true)}
                                  >
                                    আরও {candidates.length - 10}টি দেখুন
                                  </Button>
                                ) : null}
                              </>
                            );
                          })()}
                          {availableQuestions.filter(
                            (c) => c.id !== q.id && !selectedIds.includes(c.id),
                          ).length === 0 ? (
                            <p style={{ fontSize: 13 }}>বদলানোর মতো আর কোনো যাচাইকৃত প্রশ্ন নেই।</p>
                          ) : null}
                        </div>
                      ) : null}
                      {reportFor?.id === q.id ? (
                        <div style={{ marginTop: 8, paddingLeft: 24 }}>
                          <p style={{ fontSize: 12, color: '#666', margin: '0 0 6px' }}>
                            সঠিক রিপোর্ট অ্যাডমিন যাচাই করলে ৭ দিনের ফ্রি Pro পাবেন — যাচাইয়ের পরে, স্বয়ংক্রিয়
                            নয়।
                          </p>
                          <label style={{ fontSize: 13, display: 'block' }}>
                            কারণ
                            <select
                              value={reportReason}
                              onChange={(e) => setReportReason(e.target.value as QpgReportReason)}
                              style={fieldStyle()}
                            >
                              {QPG_REPORT_REASONS.map((r) => (
                                <option key={r.id} value={r.id}>
                                  {r.nameBn}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label style={{ fontSize: 13, display: 'block', marginTop: 8 }}>
                            বিস্তারিত (ঐচ্ছিক)
                            <textarea
                              value={reportDetails}
                              onChange={(e) => setReportDetails(e.target.value)}
                              rows={2}
                              style={fieldStyle()}
                            />
                          </label>
                          <div style={{ marginTop: 8 }}>
                            <Button size="sm" onClick={submitReport}>
                              রিপোর্ট জমা দিন
                            </Button>{' '}
                            <Button variant="ghost" size="sm" onClick={() => setReportFor(null)}>
                              বাতিল
                            </Button>
                          </div>
                          {reportMsg ? (
                            <p style={{ fontSize: 13, color: '#2a6b2a', marginTop: 8 }}>{reportMsg}</p>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                    );
                  })}
                  <p style={{ fontSize: 13, marginTop: 10 }}>
                    নিজের প্রশ্ন ব্যাংকে যোগ করতে চান?{' '}
                    <Link to="/contribute">যাচাইয়ের জন্য জমা দিন</Link> — অনুমোদিত প্রশ্ন আপনার
                    প্রতিষ্ঠানের নামসহ ব্যাংকে আসে। যাচাই ছাড়া কোনো প্রশ্ন ব্যাংকে বা পেপারে আসে না।
                  </p>
                </div>
              ) : null}
            </Card>
          ) : null}
        </>
      )}

      {/* Step 7 — Paper setup (FREE, always editable) */}
      {(selectedQuestions.length > 0 || (stream === 'job_admission' && jobAvailable.length > 0)) &&
      paper === null ? (
        <Card style={{ marginBottom: 16 }}>
          <h2 style={{ margin: '0 0 4px', fontSize: 16 }}>
            ৭. পেপারের লেখা ঠিক করুন (ফ্রি — সব লেখা বদলানো যায়)
          </h2>
          <p style={{ fontSize: 13, color: '#555', margin: '0 0 12px' }}>
            শিক্ষকরা অনেক সময় সরাসরি পরীক্ষার পেপার বানান, শুধু মডেল টেস্ট নয় — তাই পেপারে কোনো লেখা
            আটকানো (locked) নেই। নিচের সব ঘর বদলানো যায়; যেমন শিরোনামে “বার্ষিক পরীক্ষা ২০২৬” লেখা যাবে।
            ফ্রি: পরীক্ষার শিরোনাম, প্রতিষ্ঠানের নাম, ঠিকানা ও নীতিবাক্য (মটো), বিষয়, শ্রেণি, তারিখ, নম্বর,
            সময়, নির্দেশনা, বিভাগের শিরোনাম। Pro (তালাবদ্ধ): ফন্ট, কলাম, স্পেসিং, ডিভাইডার স্টাইল,
            কাস্টম লোগো, Answer Key শিট।{' '}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setOverrides({});
                setTemplateId('');
              }}
            >
              স্বয়ংক্রিয় মান ফেরান (সব ঘর ডিফল্টে)
            </Button>
          </p>
          <label style={{ fontSize: 13, display: 'block', marginBottom: 12 }}>
            টেমপ্লেট (নামকরা পেপার — তৈরির আগে বেছে নিন)
            <select
              value={templateId}
              onChange={(e) => applyTemplate(e.target.value)}
              style={fieldStyle()}
            >
              <option value="">টেমপ্লেট ছাড়া (নিজের মতো করে)</option>
              {QPG_PAPER_TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nameBn} ({t.nameEn})
                </option>
              ))}
            </select>
          </label>
          <p style={{ fontSize: 12, color: '#666', margin: '-6px 0 12px' }}>
            টেমপ্লেট শুধু শিরোনাম, নির্দেশনা ও বিভাগের শিরোনাম বসিয়ে দেয় — সব ঘর পরে বদলানো যায়।
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label style={{ fontSize: 13 }}>
              পরীক্ষার শিরোনাম
              <input
                type="text"
                value={setup.title}
                onChange={(e) => setOverride('title', e.target.value)}
                style={fieldStyle()}
              />
            </label>
            <label style={{ fontSize: 13 }}>
              প্রতিষ্ঠানের নাম
              <input
                type="text"
                value={setup.institutionName}
                onChange={(e) => setOverride('institutionName', e.target.value)}
                placeholder="যেমন: কক্সবাজার সরকারি উচ্চ বিদ্যালয়"
                style={fieldStyle()}
              />
            </label>
            <label style={{ fontSize: 13 }}>
              প্রতিষ্ঠানের ঠিকানা
              <input
                type="text"
                value={setup.institutionAddress}
                onChange={(e) => setOverride('institutionAddress', e.target.value)}
                placeholder="যেমন: কক্সবাজার সদর, কক্সবাজার"
                style={fieldStyle()}
              />
            </label>
            <label style={{ fontSize: 13 }}>
              প্রতিষ্ঠানের নীতিবাক্য (মটো)
              <input
                type="text"
                value={setup.institutionMotto}
                onChange={(e) => setOverride('institutionMotto', e.target.value)}
                placeholder="যেমন: জ্ঞানই শক্তি"
                style={fieldStyle()}
              />
            </label>
            <label style={{ fontSize: 13 }}>
              বিষয়
              <input
                type="text"
                value={setup.subject}
                onChange={(e) => setOverride('subject', e.target.value)}
                style={fieldStyle()}
              />
            </label>
            <label style={{ fontSize: 13 }}>
              শ্রেণি / পরীক্ষা
              <input
                type="text"
                value={setup.classLabel}
                onChange={(e) => setOverride('classLabel', e.target.value)}
                style={fieldStyle()}
              />
            </label>
            <label style={{ fontSize: 13 }}>
              তারিখ
              <input
                type="date"
                value={setup.examDate}
                onChange={(e) => setOverride('examDate', e.target.value)}
                style={fieldStyle()}
              />
            </label>
            <label style={{ fontSize: 13 }}>
              পূর্ণমান
              <ClearableNumberInput
                value={setup.totalMarks}
                min={1}
                onCommit={(n) => setOverride('totalMarks', n)}
                style={fieldStyle()}
              />
            </label>
            <label style={{ fontSize: 13 }}>
              সময় (মিনিট)
              <ClearableNumberInput
                value={setup.timeMinutes}
                min={5}
                onCommit={(n) => setOverride('timeMinutes', n)}
                style={fieldStyle()}
              />
            </label>
            <label style={{ fontSize: 13 }}>
              বিভাগের শিরোনাম
              <input
                type="text"
                value={setup.sectionHeading}
                onChange={(e) => setOverride('sectionHeading', e.target.value)}
                style={fieldStyle()}
              />
            </label>
            <label style={{ fontSize: 13 }}>
              বিষয় কোড (Subject Code — হেডারে দেখাবে)
              <input
                type="text"
                value={setup.subjectCode}
                onChange={(e) => setOverride('subjectCode', e.target.value)}
                placeholder="যেমন: 101"
                style={fieldStyle()}
              />
            </label>
            <label style={{ fontSize: 13 }}>
              সেট কোড (Set Code — প্রশ্নের ক্রম বদলে যায়)
              <select
                value={setCode}
                onChange={(e) => setSetCode(e.target.value as '' | QpgSetCode)}
                style={fieldStyle()}
              >
                <option value="">একক সেট (মূল ক্রম)</option>
                {QPG_SET_CODES.map((c) => (
                  <option key={c} value={c}>
                    সেট {c}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ fontSize: 13 }}>
              সিড (Seed — একই seed-এ একই সেট আবার তৈরি হয়)
              <ClearableNumberInput
                value={seed}
                min={0}
                onCommit={setSeed}
                style={fieldStyle()}
              />
            </label>
          </div>
          <p style={{ fontSize: 12, color: '#666', margin: '8px 0 0' }}>
            সেট ক/খ/গ/ঘ: একই প্রশ্ন, প্রতিটি সেটে আলাদা ক্রম + মিলে যাওয়া Answer Key। Seed লিখে
            রাখুন — একই seed বসালে একই সেট আবার তৈরি হয়। ইউনিক সেট: একই প্রশ্ন দিয়ে ভিন্ন ভিন্ন সেট তৈরি হয় — নতুন প্রশ্ন
            বানানো হয় না। Answer Key শিট আলাদা করে Pro-তে পাওয়া যায়।
          </p>
          <label style={{ fontSize: 13, display: 'block', marginTop: 12 }}>
            <input
              type="checkbox"
              checked={includeOmrSheet}
              disabled={
                selectedQuestions.length > 0 &&
                !selectedQuestions.some((q) => q.type === 'mcq')
              }
              onChange={(e) => setIncludeOmrSheet(e.target.checked)}
            />{' '}
            OMR Bubble Sheet সংযুক্ত করুন (ফ্রি — জলছাপসহ আসবে; Pro পেপারে পরিষ্কার আসে। OMR যাচাই
            সম্পূর্ণ ফ্রি — <Link to="/omr-evaluator">OMR মূল্যায়ন</Link> পাতায় যাচাই করুন।)
            {selectedQuestions.length > 0 &&
            !selectedQuestions.some((q) => q.type === 'mcq')
              ? ' (শুধু MCQ পেপারে প্রযোজ্য — সৃজনশীল (CQ) প্রশ্নের OMR হয় না।)'
              : ''}
          </label>
          <label style={{ fontSize: 13, display: 'block', marginTop: 8 }}>
            <input
              type="checkbox"
              checked={setup.pageNumbers ?? false}
              onChange={(e) => setOverride('pageNumbers', e.target.checked)}
            />{' '}
            পাতার নম্বর দেখান (প্রতি পাতায় “পাতা N / মোট” — ফ্রি)
          </label>
          <p style={{ fontSize: 12, color: '#666', margin: '8px 0 0' }}>
            ড্রাফট স্বয়ংক্রিয়ভাবে সংরক্ষিত হয় — রিফ্রেশ করলেও এই সেটআপ হারাবে না।{' '}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                clearQpgDraft();
                setOverrides({});
                setSelectedIds(availableQuestions.map((q) => q.id));
              }}
            >
              ড্রাফট মুছে ফেলুন
            </Button>
          </p>
          <fieldset disabled style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12, marginTop: 12 }}>
            <legend style={{ fontSize: 13, fontWeight: 700 }}>লেআউট (Pro — তালাবদ্ধ) 🔒</legend>
            <p style={{ fontSize: 12, color: '#666', margin: '0 0 8px' }}>
              ফন্ট, কলাম, স্পেসিং ও ডিভাইডার Pro-তে — পেপারের লেখা (উপরের ঘরগুলো) ফ্রি, দেখতে কেমন হবে তা
              Pro।
            </p>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <label style={{ fontSize: 13 }}>
                কলাম
                <select style={fieldStyle()}>
                  <option>১ কলাম</option>
                  <option>২ কলাম</option>
                </select>
              </label>
              <label style={{ fontSize: 13 }}>
                কলাম ডিভাইডার
                <select style={fieldStyle()}>
                  <option>লাইন</option>
                  <option>ডাবল লাইন</option>
                  <option>নেই</option>
                </select>
              </label>
              <label style={{ fontSize: 13 }}>
                ফন্ট
                <select style={fieldStyle()}>
                  <option>ডিফল্ট</option>
                  <option>Serif</option>
                  <option>Sans</option>
                </select>
              </label>
              <label style={{ fontSize: 13 }}>
                ফন্ট সাইজ
                <select style={fieldStyle()}>
                  <option>সাধারণ</option>
                  <option>বড়</option>
                  <option>ছোট</option>
                </select>
              </label>
              <label style={{ fontSize: 13 }}>
                প্রশ্ন / অপশন স্টাইল
                <select style={fieldStyle()}>
                  <option>ডিফল্ট (A B C D)</option>
                  <option>ক খ গ ঘ</option>
                  <option>বন্ধনীসহ (ক) (খ) (গ) (ঘ)</option>
                </select>
              </label>
            </div>
          </fieldset>
          <label style={{ fontSize: 13, display: 'block', marginTop: 12 }}>
            নির্দেশনা
            <textarea
              value={setup.instructions}
              onChange={(e) => setOverride('instructions', e.target.value)}
              rows={3}
              style={fieldStyle()}
            />
          </label>
          <div style={{ marginTop: 12 }}>
            <AlertBox tone={standardCheck.passes ? 'ok' : 'error'}>
              <strong>মান যাচাই (Standard Checker): </strong>
              {standardCheck.summaryBn}
              {standardCheck.sections.map((s) => (
                <div key={s.headingBn} style={{ fontSize: 13, marginTop: 4 }}>
                  {s.sufficient ? '✓' : '⚠'} {s.messageBn}
                </div>
              ))}
              {!standardCheck.marksMatch ? (
                <div style={{ fontSize: 13, marginTop: 4 }}>
                  হিসাব করা পূর্ণমান {standardCheck.computedMarks}, লেখা আছে {standardCheck.declaredMarks} —
                  উপরের “পূর্ণমান” ঘরটি ঠিক করুন। যাচাই পাস না হলেও পেপার তৈরি করা যাবে — তবে পেপারটি
                  ভারসাম্যপূর্ণ হবে না।
                </div>
              ) : null}
            </AlertBox>
          </div>
          <div style={{ marginTop: 12 }}>
            {stream === 'job_admission' ? (
              <Button onClick={generateModelSection} disabled={jobAvailable.length === 0}>
                সেকশন পেপার তৈরি করুন
              </Button>
            ) : (
              <Button onClick={generateChapterPaper} disabled={selectedQuestions.length === 0}>
                প্রশ্নপত্র তৈরি করুন ({selectedQuestions.length}টি প্রশ্ন)
              </Button>
            )}
          </div>
        </Card>
      ) : null}

      {/* Smart Generation Progress Screen (UX feature, sprint 27 Nov
          2026): label 'Smart Engine', NEVER 'AI'. Every step is a
          REAL client step — selecting / building / rendering — driven
          by actual callbacks, never a fake animation. */}
      {genProgress !== null ? (
        <Card style={{ marginBottom: 16 }}>
          <h2 style={{ margin: '0 0 8px', fontSize: 16 }}>Smart Engine — প্রশ্নপত্র তৈরি হচ্ছে</h2>
          <ol style={{ fontSize: 14, margin: 0, paddingLeft: 20 }}>
            <li>
              {genProgress.phase === 'selecting' ? '⏳' : '✓'} যাচাইকৃত প্রশ্ন বাছাই
              {genProgress.phase === 'selecting' ? ' — চলছে…' : ''}
            </li>
            <li>
              {genProgress.phase === 'selecting'
                ? '○'
                : genProgress.phase === 'building'
                  ? '⏳'
                  : '✓'}{' '}
              পেপার সাজানো
              {genProgress.phase === 'building' ? ' — চলছে…' : ''}
            </li>
            <li>
              {genProgress.phase === 'rendering' ? '⏳' : '○'} প্রিভিউ পাতা তৈরি
              {genProgress.phase === 'rendering' && genProgress.totalPages > 0
                ? ` — ${genProgress.donePages}/${genProgress.totalPages} পাতা`
                : genProgress.phase === 'rendering'
                  ? ' — পাতা গোনা হচ্ছে…'
                  : ''}
            </li>
          </ol>
        </Card>
      ) : null}

      {/* Step 8 — Protected FULL preview + download (owner 25 Nov 19:03:
          every question visible; one image per A4 page, so the print
          path also paginates between questions, never mid-question) */}
      {paper !== null ? (
        <Card style={{ marginBottom: 16 }} className="qpg-print-area">
          <h2 style={{ margin: '0 0 8px', fontSize: 16 }}>
            ৮. প্রিভিউ (সুরক্ষিত — পুরো পেপার) ও ডাউনলোড
          </h2>
          <p style={{ fontSize: 13, color: '#555', margin: '0 0 10px' }}>
            {paper.setup.title} — {paper.questions.length}টি প্রশ্ন • পূর্ণমান {paper.setup.totalMarks} •{' '}
            {paper.setup.timeMinutes} মিনিট • {paper.patternLabelBn}
          </p>

          {/* Multi-section মানবণ্টন editor (comparison fixes, G2+G3):
              the paper is a list of sections — each with its own
              heading, type, marks and answer-count. All edits below
              are staged and applied together by "প্রয়োগ করুন". */}
          <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12, marginBottom: 12 }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 15 }}>
              মানবণ্টন সম্পাদক — পেপার তৈরি হওয়ার পরেও বদলানো যায়
            </h3>
            <p style={{ fontSize: 12, color: '#666', margin: '0 0 10px' }}>
              পেপারটি {editorSections.length}টি বিভাগে ভাগ করা — প্রতিটি বিভাগের শিরোনাম / ধরন / প্রতি
              প্রশ্নের নম্বর / উত্তর দিতে হবে আলাদা করে বদলানো যায়; পূর্ণমান স্বয়ংক্রিয়ভাবে হিসাব হয়
              (বিভাগের প্রশ্ন × প্রতি প্রশ্নের নম্বর)। প্রশ্ন যোগ করা যায় শুধু যাচাইকৃত অতিরিক্ত প্রশ্ন থেকে।
              নিচের সব পরিবর্তন “প্রয়োগ করুন” চাপলে পেপারে আসবে।
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <label style={{ fontSize: 13 }}>
                পরীক্ষার শিরোনাম
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  style={fieldStyle()}
                />
              </label>
              <label style={{ fontSize: 13 }}>
                সময় (মিনিট)
                <ClearableNumberInput
                  value={editTimeMinutes}
                  min={5}
                  onCommit={setEditTimeMinutes}
                  style={fieldStyle()}
                />
              </label>
            </div>
            <label style={{ fontSize: 13, display: 'block', marginTop: 10 }}>
              নির্দেশনা
              <textarea
                value={editInstructions}
                onChange={(e) => setEditInstructions(e.target.value)}
                rows={2}
                style={fieldStyle()}
              />
            </label>
            <p style={{ fontSize: 13, margin: '8px 0' }}>
              পূর্ণমান (স্বয়ংক্রিয়):{' '}
              <strong>
                {editorSections.reduce(
                  (sum, s) => sum + s.questionIds.length * Math.max(1, s.marksPerQuestion || 1),
                  0,
                )}
              </strong>
            </p>

            {editorSections.map((sec, si) => {
              const secQuestions = sec.questionIds
                .map((id) => paperQuestionById.get(id))
                .filter((x): x is QpgQuestion => x !== undefined);
              const secExtras = extrasForSectionType(sec.type);
              const secShown = paperSwapShowAll ? secExtras : secExtras.slice(0, 10);
              const totalQuestions = editorSections.reduce((n, s) => n + s.questionIds.length, 0);
              return (
                <div
                  key={sec.id}
                  style={{ border: '1px solid #ccc', borderRadius: 8, padding: 10, marginBottom: 10 }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                    <strong style={{ fontSize: 14 }}>বিভাগ {si + 1}</strong>
                    {editorSections.length > 1 ? (
                      <Button variant="ghost" size="sm" onClick={() => removeEditorSection(sec.id)}>
                        বিভাগ সরান
                      </Button>
                    ) : null}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <label style={{ fontSize: 13 }}>
                      বিভাগের শিরোনাম
                      <input
                        type="text"
                        value={sec.headingBn}
                        onChange={(e) => updateEditorSection(sec.id, { headingBn: e.target.value })}
                        style={fieldStyle()}
                      />
                    </label>
                    <label style={{ fontSize: 13 }}>
                      বিভাগের ধরন
                      <select
                        value={sec.type}
                        onChange={(e) => {
                          const nextType = e.target.value as QpgSectionType;
                          updateEditorSection(sec.id, {
                            type: nextType,
                            headingBn: qpgDefaultSectionHeading(nextType, si),
                            questionIds: [],
                            answerCount: '',
                          });
                        }}
                        style={fieldStyle()}
                      >
                        {QPG_SECTION_TYPES.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.nameBn}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label style={{ fontSize: 13 }}>
                      প্রতি প্রশ্নের নম্বর
                      <ClearableNumberInput
                        value={sec.marksPerQuestion}
                        min={1}
                        onCommit={(n) => updateEditorSection(sec.id, { marksPerQuestion: n })}
                        style={fieldStyle()}
                      />
                    </label>
                    <label style={{ fontSize: 13 }}>
                      উত্তর দিতে হবে (খালি = সবগুলোর উত্তর)
                      <input
                        type="number"
                        min={1}
                        max={Math.max(1, sec.questionIds.length)}
                        value={sec.answerCount}
                        onChange={(e) => updateEditorSection(sec.id, { answerCount: e.target.value })}
                        placeholder="সবগুলো"
                        style={fieldStyle()}
                      />
                    </label>
                  </div>
                  <p style={{ fontSize: 13, margin: '8px 0' }}>
                    এই বিভাগে {sec.questionIds.length}টি প্রশ্ন •{' '}
                    {sec.questionIds.length * Math.max(1, sec.marksPerQuestion || 1)} নম্বর
                    {sec.answerCount.trim() !== ''
                      ? ` • উত্তর দিতে হবে ${sec.answerCount}টি (বাকিগুলো অতিরিক্ত বিকল্প হিসেবে ছাপা হবে)`
                      : ''}
                  </p>
                  <h4 style={{ margin: '10px 0 6px', fontSize: 14 }}>
                    এই বিভাগের প্রশ্ন (প্রতিটিতে বদলান / সরান)
                  </h4>
                  {secQuestions.length === 0 ? (
                    <p style={{ fontSize: 13 }}>
                      এই বিভাগে এখনো কোনো প্রশ্ন নেই —{' '}
                      {secExtras.length > 0
                        ? 'নিচের যাচাইকৃত অতিরিক্ত প্রশ্ন থেকে যোগ করুন।'
                        : 'এই ধরনের যাচাইকৃত প্রশ্ন এখনো তৈরি হয়নি।'}
                    </p>
                  ) : null}
                  {secQuestions.map((q) => {
                    const shown = applyEdits(q);
                    const globalIndex = paper.questions.findIndex((x) => x.id === q.id) + 1;
                    return (
                      <div
                        key={q.id}
                        style={{ border: '1px solid #eee', borderRadius: 8, padding: 8, marginBottom: 6 }}
                      >
                        <div style={{ fontSize: 13 }}>
                          <strong>{globalIndex}.</strong> {shown.questionText}{' '}
                          {isCqQuestion(shown) ? (
                            <Chip tone="outline">সৃজনশীল (CQ) • ১০ নম্বর</Chip>
                          ) : null}
                        </div>
                        <div style={{ marginTop: 4, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setPaperReplacingId(paperReplacingId === q.id ? null : q.id);
                              setPaperSwapShowAll(false);
                            }}
                          >
                            {paperReplacingId === q.id ? 'বদলানো বাতিল' : 'বদলান'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={totalQuestions <= 1}
                            onClick={() => {
                              updateEditorSection(sec.id, {
                                questionIds: sec.questionIds.filter((x) => x !== q.id),
                              });
                            }}
                          >
                            সরান
                          </Button>
                        </div>
                        {paperReplacingId === q.id ? (
                          <div style={{ marginTop: 6 }}>
                            <p style={{ fontSize: 12, color: '#666', margin: '0 0 6px' }}>
                              এই প্রশ্নের বদলে নিচের যাচাইকৃত প্রশ্নগুলোর একটি নিন — বাছলেই একই জায়গায়
                              বদলে যাবে। এই বিভাগের ধরন (
                              {QPG_SECTION_TYPES.find((t) => t.id === sec.type)?.nameBn}) অনুযায়ী বদলানোর
                              মতো {secExtras.length}টি প্রশ্ন আছে।
                            </p>
                            {secShown.map((c) => (
                              <div
                                key={c.id}
                                style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}
                              >
                                <span style={{ fontSize: 13, flex: 1 }}>{c.questionText}</span>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    updateEditorSection(sec.id, {
                                      questionIds: sec.questionIds.map((x) => (x === q.id ? c.id : x)),
                                    });
                                    setPaperReplacingId(null);
                                    setPaperSwapShowAll(false);
                                  }}
                                >
                                  এই প্রশ্নটি নিন
                                </Button>
                              </div>
                            ))}
                            {secExtras.length > 10 && !paperSwapShowAll ? (
                              <Button variant="outline" size="sm" onClick={() => setPaperSwapShowAll(true)}>
                                আরও {secExtras.length - 10}টি দেখুন
                              </Button>
                            ) : null}
                            {secExtras.length === 0 ? (
                              <p style={{ fontSize: 13 }}>
                                বদলানোর মতো আর কোনো যাচাইকৃত প্রশ্ন নেই।{' '}
                                <Link to="/contribute">যাচাইয়ের জন্য নিজের প্রশ্ন জমা দিন</Link>।
                              </p>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                  <h4 style={{ margin: '10px 0 6px', fontSize: 14 }}>
                    অতিরিক্ত বিকল্প (যাচাইকৃত — পেপারে নেই): {secExtras.length}টি
                  </h4>
                  {secExtras.length === 0 ? (
                    <p style={{ fontSize: 13 }}>
                      আর কোনো যাচাইকৃত অতিরিক্ত প্রশ্ন নেই — এই ধরনের সব যাচাইকৃত প্রশ্নই পেপারে আছে।{' '}
                      <Link to="/contribute">যাচাইয়ের জন্য নিজের প্রশ্ন জমা দিন</Link>।
                    </p>
                  ) : (
                    <>
                      {(extrasShowAll ? secExtras : secExtras.slice(0, 10)).map((c) => (
                        <div
                          key={c.id}
                          style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}
                        >
                          <span style={{ fontSize: 13, flex: 1 }}>{c.questionText}</span>
                          <Button
                            size="sm"
                            onClick={() => {
                              updateEditorSection(sec.id, {
                                questionIds: [...sec.questionIds, c.id],
                              });
                            }}
                          >
                            যোগ করুন
                          </Button>
                        </div>
                      ))}
                      {secExtras.length > 10 && !extrasShowAll ? (
                        <Button variant="outline" size="sm" onClick={() => setExtrasShowAll(true)}>
                          আরও {secExtras.length - 10}টি দেখুন
                        </Button>
                      ) : null}
                    </>
                  )}
                </div>
              );
            })}

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Button variant="outline" onClick={addEditorSection}>
                + বিভাগ যোগ করুন
              </Button>
              <Button onClick={applyPaperEdits}>প্রয়োগ করুন — প্রিভিউ আবার তৈরি করুন</Button>
            </div>
          </div>

          {previewBusy ? <p style={{ fontSize: 13 }}>প্রিভিউ তৈরি হচ্ছে…</p> : null}
          {previewError ? <AlertBox tone="error">{previewError}</AlertBox> : null}
          {previewUrls.length > 0 ? (
            <ProtectedContentWrapper userLabel={userLabel}>
              {previewUrls.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`প্রশ্নপত্রের প্রিভিউ — পাতা ${i + 1}`}
                  className="qpg-preview-page"
                  style={{ display: 'block', width: '100%', height: 'auto' }}
                  draggable={false}
                />
              ))}
            </ProtectedContentWrapper>
          ) : null}
          <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button onClick={() => setShowDownload(true)}>Generate Question Paper — ডাউনলোডের অপশন দেখুন</Button>
            <Button
              variant="outline"
              onClick={() => {
                if (savePaperForSmartboard(paper)) {
                  navigate('/smartboard');
                }
              }}
            >
              Smartboard-এ খুলুন
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              প্রিন্ট করুন (পুরো পেপার — সব {paper.questions.length}টি প্রশ্ন)
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setPaper(null);
                setPreviewUrls([]);
              }}
            >
              আবার সাজান
            </Button>
          </div>
          <div className="qpg-print-footer">
            Powered by Eduvelto.com — বাংলাদেশের ফ্রি শিক্ষা প্ল্যাটফর্ম
          </div>
        </Card>
      ) : null}

      {showDownload && paper ? (
        <QuestionPaperDownloadDialog
          paper={paper}
          uid={uid}
          includeOmrSheet={includeOmrSheet}
          proStatus={proStatus}
          onClose={() => setShowDownload(false)}
        />
      ) : null}
    </PageShell>
  );
}
