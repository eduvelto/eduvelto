// Eduvelto — Question Paper Generator page (Milestone 2.5 MVP, 25 Nov 2026).
//
// Route: /question-paper-generator (mounted routing-agnostic; the
// /:lang mount is flagged for the merge — see the route comment in
// src/App.tsx). No login required for the demo; the per-teacher quota
// keys to the signed-in uid when available, otherwise 'guest'.
//
// Flow — academic tracks (General / Madrasah):
//   Stream → Class → Subject → CHAPTER (single or multiple) → topics
//   inside the chapter → type / count / difficulty → pick questions
//   → editable paper setup → preview (partial, protected) → download.
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

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { AlertBox, Button, Card, Chip } from '../components/ui';
import { useAuth } from '../lib/auth';
import { ProtectedContentWrapper } from '../components/ProtectedContentWrapper';
import { QuestionPaperDownloadDialog } from '../components/QuestionPaperDownloadDialog';
import {
  QPG_CHEAPEST_ANNUAL_BDT,
  QPG_COGNITIVE_OPTIONS,
  QPG_FREE_MONTHLY_LIMIT,
  QPG_NATURE_OPTIONS,
  QPG_PAPER_TEMPLATES,
  QPG_PRICE_CLAIM_BN,
  QPG_PRO_MONTHLY_BDT,
  QPG_PRO_PER_PAPER_BDT,
  QPG_SET_CODES,
  QPG_SOURCE_OPTIONS,
  QPG_VERIFIED_POOL,
  applyQpgTemplate,
  buildQpgPaper,
  checkQpgPaperStandard,
  defaultPaperSetup,
  qpgChaptersFor,
  qpgClassesFor,
  qpgModelSectionQuestions,
  qpgModelTests,
  qpgSubjectsFor,
  replaceQpgQuestion,
  selectQpgQuestions,
  QPG_PENDING_TRACK3_EXAMS,
  QPG_STREAMS,
  type QpgChapter,
  type QpgCognitiveLevel,
  type QpgDifficulty,
  type QpgModelTest,
  type QpgPaper,
  type QpgPaperSetup,
  type QpgQuestion,
  type QpgQuestionNature,
  type QpgQuestionSource,
  type QpgQuestionType,
  type QpgSetCode,
  type QpgStream,
} from '../lib/questionPaper';
import { questionsForSet } from '../lib/questionPaperSets';
import {
  QPG_REPORT_REASONS,
  getDemoUsage,
  saveDemoReport,
  type QpgReportReason,
} from '../lib/questionPaperUsage';
import { loadVerifiedChapterQuestions } from '../lib/questionPaperCache';
import { renderPaperCanvas } from '../lib/questionPaperPdf';
import '../components/question-paper-print.css';

const PREVIEW_QUESTIONS = 5;

const TYPE_OPTIONS: Array<{ id: QpgQuestionType; nameBn: string; nameEn: string }> = [
  { id: 'mcq', nameBn: 'MCQ (বহুনির্বাচনি)', nameEn: 'MCQ' },
  { id: 'cq', nameBn: 'সৃজনশীল (CQ)', nameEn: 'Creative (CQ)' },
  { id: 'short', nameBn: 'সংক্ষিপ্ত প্রশ্ন', nameEn: 'Short question' },
  { id: 'multi-completion', nameBn: 'বহুপদী (Multiple Completion)', nameEn: 'Multiple Completion' },
  { id: 'situation-set', nameBn: 'অভিন্ন তথ্যভিত্তিক (Situation Set)', nameEn: 'Situation Set' },
  { id: 'picture-based', nameBn: 'ছবিভিত্তিক প্রশ্ন', nameEn: 'Picture-based' },
];

const DIFFICULTY_OPTIONS: Array<{ id: QpgDifficulty; nameBn: string }> = [
  { id: 'all', nameBn: 'সবগুলো' },
  { id: 'easy', nameBn: 'সহজ' },
  { id: 'medium', nameBn: 'মাঝারি' },
  { id: 'hard', nameBn: 'কঠিন' },
];

function fieldStyle(): React.CSSProperties {
  return { width: '100%', padding: 8, boxSizing: 'border-box', marginTop: 4 };
}

export default function QuestionPaperGeneratorPage() {
  const { user } = useAuth();
  const uid = user?.uid ?? 'guest';
  const userLabel = user?.email ?? user?.uid ?? 'guest';
  const usage = useMemo(() => getDemoUsage(uid), [uid]);

  // --- Track + hierarchy state -------------------------------------
  const [stream, setStream] = useState<QpgStream>('general');
  const [classId, setClassId] = useState('honours');
  const [subjectId, setSubjectId] = useState('english');
  const [chapterIds, setChapterIds] = useState<string[]>(['bcs-english-batch1']);
  const [topicIds, setTopicIds] = useState<string[]>([]);
  const [qType, setQType] = useState<QpgQuestionType>('mcq');
  const [difficulty, setDifficulty] = useState<QpgDifficulty>('all');
  const [sourceFilter, setSourceFilter] = useState<QpgQuestionSource | 'any'>('any');
  const [cognitiveFilter, setCognitiveFilter] = useState<QpgCognitiveLevel | 'any'>('any');
  const [natureFilter, setNatureFilter] = useState<QpgQuestionNature | 'any'>('any');
  const [count, setCount] = useState(10);
  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    QPG_VERIFIED_POOL.slice(0, 10).map((q) => q.id),
  );
  // Inline question editing (free, part of paper creation): teacher's
  // edits stored per question id; the paper renders the edited text.
  const [edits, setEdits] = useState<Record<string, QpgQuestion>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  // Per-question Replace (A-Z parity): which selected question is
  // picking a replacement right now.
  const [replacingId, setReplacingId] = useState<string | null>(null);
  // Paper template (A-Z parity): chosen before creating; pre-fills
  // the setup text fields (title / instructions / section heading).
  const [templateId, setTemplateId] = useState('');
  // Set shuffler: seed is fixed per session so the four sets rebuild
  // identically; setCode '' = single-set paper in original order.
  const [seed] = useState(() => Math.floor(Math.random() * 1_000_000_000));
  const [setCode, setSetCode] = useState<'' | QpgSetCode>('');
  /** Attach the printable OMR Bubble Sheet — FREE toggle (owner
   *  25 Nov 09:43): the sheet follows the paper's tier, watermarked
   *  on free papers, clean on Pro papers. No separate OMR price. */
  const [includeOmrSheet, setIncludeOmrSheet] = useState(false);

  // --- Track 3 state -------------------------------------------------
  const modelTests = useMemo(() => qpgModelTests(), []);
  const [jobExamSlug, setJobExamSlug] = useState<QpgModelTest['examSlug']>('bcs');
  const [jobSubjectEn, setJobSubjectEn] = useState<string>('English Language & Literature');
  const [jobCount, setJobCount] = useState(10);
  const jobExam = modelTests.find((t) => t.examSlug === jobExamSlug) ?? modelTests[0];
  const jobSubject = jobExam.subjects.find((s) => s.nameEn === jobSubjectEn) ?? jobExam.subjects[0];
  const jobAvailable = qpgModelSectionQuestions(jobExam.examSlug, jobSubject.nameEn);

  // --- Paper setup overrides (free, always editable) ----------------
  const [overrides, setOverrides] = useState<Partial<QpgPaperSetup>>({});
  const setOverride = <K extends keyof QpgPaperSetup>(key: K, value: QpgPaperSetup[K]) => {
    setOverrides((prev) => ({ ...prev, [key]: value }));
  };

  // --- Generated paper + preview ------------------------------------
  const [paper, setPaper] = useState<QpgPaper | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewBusy, setPreviewBusy] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const [showDownload, setShowDownload] = useState(false);

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
          type: qType,
          difficulty,
          // Request exactly what the chapters hold: the teacher's
          // chosen count is applied separately via the picker
          // (applyCount / selectedIds). Requesting an arbitrary large
          // number here would print a bogus "shortfall" message.
          count: cachedPool.length,
          source: sourceFilter,
          cognitiveLevel: cognitiveFilter,
          nature: natureFilter,
        },
        cachedPool,
      ),
    [chapterIds, topicIds, qType, difficulty, cachedPool, sourceFilter, cognitiveFilter, natureFilter],
  );
  const availableQuestions = selection.questions;
  const applyEdits = (q: QpgQuestion): QpgQuestion => edits[q.id] ?? q;
  const selectedQuestions = availableQuestions
    .filter((q) => selectedIds.includes(q.id))
    .map(applyEdits);

  const toggleIn = (list: string[], id: string) =>
    list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

  const pickStream = (s: QpgStream) => {
    setStream(s);
    setPaper(null);
    setPreviewUrl(null);
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
    setOverrides({});
  };

  const pickClass = (id: string) => {
    setClassId(id);
    setSubjectId('');
    setChapterIds([]);
    setTopicIds([]);
    setSelectedIds([]);
    setPaper(null);
    setPreviewUrl(null);
    setOverrides({});
  };

  const pickSubject = (id: string) => {
    setSubjectId(id);
    setChapterIds([]);
    setTopicIds([]);
    setSelectedIds([]);
    setPaper(null);
    setPreviewUrl(null);
    setOverrides({});
  };

  const toggleChapter = (id: string) => {
    const next = toggleIn(chapterIds, id);
    setChapterIds(next);
    setTopicIds([]);
    setSelectedIds([]);
    setPaper(null);
    setPreviewUrl(null);
  };

  const applyCount = (n: number) => {
    const safe = Math.max(1, Math.min(100, Math.floor(n) || 1));
    setCount(safe);
    setSelectedIds(availableQuestions.slice(0, safe).map((q) => q.id));
  };

  const toggleQuestion = (id: string) => {
    const next = toggleIn(selectedIds, id);
    setSelectedIds(next);
    setCount(next.length);
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
      });
    }
    return defaultPaperSetup({
      title: `প্রশ্নপত্র — ${subjectLabel} (${classLabel})`,
      subject: subjectLabel,
      classLabel,
      questionCount: Math.max(selectedQuestions.length, 1),
      marksPerQuestion: 1,
      timeMinutes: Math.max(30, selectedQuestions.length),
      sectionHeading: 'ক-বিভাগ: বহুনির্বাচনি প্রশ্ন (MCQ)',
      setCode,
    });
  }, [stream, jobExam, jobSubject, jobCount, jobAvailable.length, subjectLabel, classLabel, selectedQuestions.length, setCode]);

  const setup: QpgPaperSetup = { ...defaultSetup, ...overrides };

  /** Standard Checker (A-Z parity): every section must have enough
   *  verified questions for a balanced paper, and the declared full
   *  marks must match questions × marks-per-question. */
  const standardCheck = useMemo(
    () =>
      checkQpgPaperStandard({
        sections: [
          {
            headingBn: setup.sectionHeading,
            requested:
              stream === 'job_admission'
                ? Math.min(jobCount, jobAvailable.length)
                : selectedQuestions.length,
            available:
              stream === 'job_admission' ? jobAvailable.length : selection.available,
            marksPerQuestion: stream === 'job_admission' ? jobExam.marksPerQuestion : 1,
          },
        ],
        declaredMarks: setup.totalMarks,
      }),
    [
      stream,
      jobExam.marksPerQuestion,
      jobCount,
      jobAvailable.length,
      selectedQuestions.length,
      selection.available,
      setup.sectionHeading,
      setup.totalMarks,
    ],
  );

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

  const renderPreview = async (built: QpgPaper) => {
    setPreviewBusy(true);
    setPreviewError('');
    try {
      const previewPaper: QpgPaper = {
        ...built,
        questions: built.questions.slice(0, PREVIEW_QUESTIONS),
      };
      const hidden = built.questions.length - previewPaper.questions.length;
      const canvas = await renderPaperCanvas(previewPaper, {
        watermarked: true,
        userLabel,
        previewMode: true,
        hiddenCount: hidden,
      });
      setPreviewUrl(canvas.toDataURL('image/png'));
    } catch (err) {
      setPreviewError(`প্রিভিউ তৈরি করা যায়নি: ${err instanceof Error ? err.message : 'অজানা ত্রুটি'}`);
    } finally {
      setPreviewBusy(false);
    }
  };

  const generateChapterPaper = () => {
    if (selectedQuestions.length === 0) return;
    const ordered = questionsForSet(selectedQuestions, seed, setCode);
    const built = buildQpgPaper({
      setup,
      questions: ordered,
      isCustomVariant: false,
      kind: 'chapter-paper',
      patternLabelBn: 'অধ্যায়ভিত্তিক প্রশ্নপত্র — যাচাইকৃত প্রশ্ন',
      patternLabelEn: 'Chapter-based paper — verified questions',
    });
    setPaper(built);
    rememberPaperKey(built);
    void renderPreview(built);
  };

  const generateModelSection = () => {
    const n = Math.min(jobCount, jobAvailable.length);
    if (n <= 0) return;
    const ordered = questionsForSet(jobAvailable.slice(0, n), seed, setCode);
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
    void renderPreview(built);
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
    <PageShell titleBn="প্রশ্নপত্র জেনারেটর" titleEn="Question Paper Generator" wide>
      <AlertBox tone="info">
        ডেমো (আজকের MVP): যাচাইকৃত প্রশ্ন মাত্র ৩৫টি — BCS ইংরেজি ব্যাচ ১ (মালিক-যাচাইকৃত, ২২ নভেম্বর
        ২০২৬)। Class 3–8 + মাদ্রাসার বই সংগ্রহ ও যাচাই চলছে; যাচাই শেষে অধ্যায়ভিত্তিক প্রশ্ন এখানে যোগ
        হবে। যাচাই হয়নি এমন প্রশ্ন এই জেনারেটরে কখনো দেখানো হয় না।{' '}
        <Link to="/jobs/bcs/practice/english">যাচাইকৃত ৩৫টি প্রশ্ন দেখুন</Link>
      </AlertBox>
      <p style={{ fontSize: 13, color: '#555', margin: '12px 0 4px' }}>
        ফ্রি: প্রতি মাসে {QPG_FREE_MONTHLY_LIMIT}টি পেপার (এই মাসে ব্যবহার {usage.used}/{usage.limit} — ডেমো
        কোটা, স্থানীয়)। Pro: প্রতি পেপার ৳{QPG_PRO_PER_PAPER_BDT} অথবা ৳{QPG_PRO_MONTHLY_BDT}/মাস অথবা
        ক্লাসভিত্তিক বার্ষিক ৳{QPG_CHEAPEST_ANNUAL_BDT} থেকে — {QPG_PRICE_CLAIM_BN}।{' '}
      </p>

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
                    setPreviewUrl(null);
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
                  setPreviewUrl(null);
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
                <input
                  type="number"
                  min={1}
                  max={jobAvailable.length}
                  value={jobCount}
                  onChange={(e) => setJobCount(Math.max(1, Math.min(jobAvailable.length, Number(e.target.value) || 1)))}
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

          {/* Step 4 — Chapter (multi-select) */}
          {subjectId !== '' ? (
            <Card style={{ marginBottom: 16 }}>
              <h2 style={{ margin: '0 0 8px', fontSize: 16 }}>
                ৪. অধ্যায় বেছে নিন (Chapter) — এক বা একাধিক
              </h2>
              {chapters.length === 0 ? (
                <AlertBox tone="info">
                  এই অধ্যায়ের যাচাইকৃত প্রশ্ন এখনো তৈরি হয়নি। এই বিষয়ের NCTB বই যাচাই শেষে অধ্যায়ভিত্তিক
                  প্রশ্ন এখানে যোগ হবে — ততদিন কোনো প্রশ্ন দেখানো হবে না।
                </AlertBox>
              ) : (
                chapters.map((ch) => (
                  <label
                    key={ch.id}
                    style={{
                      display: 'block', border: '1px solid #ddd', borderRadius: 8,
                      padding: 10, marginBottom: 8, fontSize: 14, cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={chapterIds.includes(ch.id)}
                      onChange={() => toggleChapter(ch.id)}
                    />{' '}
                    <strong>{ch.nameBn}</strong> — যাচাইকৃত {ch.verifiedCount}টি প্রশ্ন
                    <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{ch.sourceNoteBn}</div>
                    <div style={{ marginTop: 6 }}>
                      {ch.topics.map((t) => (
                        <Chip key={t.id} tone={topicIds.includes(t.id) ? 'gold' : 'outline'}>
                          {t.nameBn} ({t.verifiedCount})
                        </Chip>
                      ))}
                    </div>
                  </label>
                ))
              )}
              {chapterIds.length > 0 ? (
                <div style={{ marginTop: 10 }}>
                  <strong style={{ fontSize: 13 }}>টপিক ফিল্টার (অধ্যায়ের ভেতরে):</strong>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                    {chapters
                      .filter((ch) => chapterIds.includes(ch.id))
                      .flatMap((ch) => ch.topics)
                      .map((t) => (
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
            </Card>
          ) : null}

          {/* Step 5 — Type / count / difficulty + question picker */}
          {chapterIds.length > 0 ? (
            <Card style={{ marginBottom: 16 }}>
              <h2 style={{ margin: '0 0 8px', fontSize: 16 }}>৫. প্রশ্নের ধরন, সংখ্যা ও কাঠিন্য</h2>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                {TYPE_OPTIONS.map((t) => (
                  <Button
                    key={t.id}
                    variant={qType === t.id ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setQType(t.id)}
                  >
                    {t.nameBn}
                  </Button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 10 }}>
                <label style={{ fontSize: 13 }}>
                  প্রশ্ন সংখ্যা
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={count}
                    onChange={(e) => applyCount(Number(e.target.value))}
                    style={{ ...fieldStyle(), maxWidth: 100 }}
                  />
                </label>
                <label style={{ fontSize: 13 }}>
                  কাঠিন্য (Difficulty — সহজ/মধ্যম/কঠিন + Easy/Medium/Hard)
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as QpgDifficulty)}
                    style={{ ...fieldStyle(), maxWidth: 220 }}
                  >
                    {DIFFICULTY_OPTIONS.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.nameBn}
                      </option>
                    ))}
                  </select>
                </label>
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
                        setSelectedIds(availableQuestions.slice(0, count).map((q) => q.id));
                      }}
                    >
                      প্রথম {count}টি নিন
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedIds([]);
                        setCount(0);
                      }}
                    >
                      সব বাতিল
                    </Button>
                  </div>
                  {availableQuestions.map((q, i) => {
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
                        {shown.edited ? <Chip tone="gold">শিক্ষক-সম্পাদিত</Chip> : null}
                      </label>
                      <div style={{ fontSize: 12, color: '#666', marginTop: 4, paddingLeft: 24 }}>
                        {shown.options.map((o) => `( ${o.letter} ) ${o.text}`).join('   ')}
                      </div>
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
                            onClick={() => setReplacingId(replacingId === q.id ? null : q.id)}
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
                          {shown.options.map((o, oi) => (
                            <label key={o.letter} style={{ fontSize: 13, display: 'block', marginTop: 6 }}>
                              অপশন {o.letter}
                              <input
                                type="text"
                                value={o.text}
                                onChange={(e) =>
                                  setEdits((prev) => {
                                    const nextOptions = shown.options.map((op, j) =>
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
                          ))}
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
                            যাবে (সংরক্ষিত হবে)।
                          </p>
                          {availableQuestions
                            .filter((c) => c.id !== q.id && !selectedIds.includes(c.id))
                            .slice(0, 5)
                            .map((c) => (
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
                                  }}
                                >
                                  এই প্রশ্নটি নিন
                                </Button>
                              </div>
                            ))}
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
                </div>
              ) : null}
            </Card>
          ) : null}
        </>
      )}

      {/* Step 6 — Paper setup (FREE, always editable) */}
      {(selectedQuestions.length > 0 || (stream === 'job_admission' && jobAvailable.length > 0)) &&
      paper === null ? (
        <Card style={{ marginBottom: 16 }}>
          <h2 style={{ margin: '0 0 4px', fontSize: 16 }}>
            ৬. পেপারের লেখা ঠিক করুন (ফ্রি — সব লেখা বদলানো যায়)
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
              <input
                type="number"
                min={1}
                value={setup.totalMarks}
                onChange={(e) => setOverride('totalMarks', Math.max(1, Number(e.target.value) || 1))}
                style={fieldStyle()}
              />
            </label>
            <label style={{ fontSize: 13 }}>
              সময় (মিনিট)
              <input
                type="number"
                min={5}
                value={setup.timeMinutes}
                onChange={(e) => setOverride('timeMinutes', Math.max(5, Number(e.target.value) || 5))}
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
          </div>
          <p style={{ fontSize: 12, color: '#666', margin: '8px 0 0' }}>
            সেট ক/খ/গ/ঘ: একই প্রশ্ন, প্রতিটি সেটে আলাদা ক্রম + মিলে যাওয়া Answer Key (seed {seed} — একই
            seed-এ একই সেট আবার তৈরি হয়)। ইউনিক সেট: একই প্রশ্ন দিয়ে ভিন্ন ভিন্ন সেট তৈরি হয় — নতুন প্রশ্ন
            বানানো হয় না। Answer Key শিট আলাদা করে Pro-তে পাওয়া যায়।
          </p>
          <label style={{ fontSize: 13, display: 'block', marginTop: 12 }}>
            <input
              type="checkbox"
              checked={includeOmrSheet}
              onChange={(e) => setIncludeOmrSheet(e.target.checked)}
            />{' '}
            OMR Bubble Sheet সংযুক্ত করুন (ফ্রি — জলছাপসহ আসবে; Pro পেপারে পরিষ্কার আসে। OMR যাচাই
            সম্পূর্ণ ফ্রি — <Link to="/omr-evaluator">OMR মূল্যায়ন</Link> পাতায় যাচাই করুন।)
          </label>
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

      {/* Step 7 — Protected partial preview + download */}
      {paper !== null ? (
        <Card style={{ marginBottom: 16 }} className="qpg-print-area">
          <h2 style={{ margin: '0 0 8px', fontSize: 16 }}>
            ৭. প্রিভিউ (সুরক্ষিত — আংশিক) ও ডাউনলোড
          </h2>
          <p style={{ fontSize: 13, color: '#555', margin: '0 0 10px' }}>
            {paper.setup.title} — {paper.questions.length}টি প্রশ্ন • পূর্ণমান {paper.setup.totalMarks} •{' '}
            {paper.setup.timeMinutes} মিনিট • {paper.patternLabelBn}
          </p>
          {previewBusy ? <p style={{ fontSize: 13 }}>প্রিভিউ তৈরি হচ্ছে…</p> : null}
          {previewError ? <AlertBox tone="error">{previewError}</AlertBox> : null}
          {previewUrl ? (
            <ProtectedContentWrapper userLabel={userLabel}>
              <img
                src={previewUrl}
                alt="প্রশ্নপত্রের আংশিক প্রিভিউ"
                style={{ display: 'block', width: '100%', height: 'auto' }}
                draggable={false}
              />
            </ProtectedContentWrapper>
          ) : null}
          <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button onClick={() => setShowDownload(true)}>Generate Question Paper — ডাউনলোডের অপশন দেখুন</Button>
            <Button variant="outline" onClick={() => window.print()}>
              প্রিন্ট করুন (প্রিভিউ — প্রথম {Math.min(PREVIEW_QUESTIONS, paper.questions.length)}টি প্রশ্ন;
              পুরো পেপার PDF ডাউনলোড করুন)
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setPaper(null);
                setPreviewUrl(null);
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
          onClose={() => setShowDownload(false)}
        />
      ) : null}
    </PageShell>
  );
}
