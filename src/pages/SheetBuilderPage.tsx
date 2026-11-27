// Eduvelto — Question Paper Generator Phase 2: Sheet Builder (§1).
//
// Route: /sheet-builder. Per-exercise sheets: a chapter expands into
// its exercises (e.g. Math 9/10 Ch.2 → ২.১/২.২/২.৩) and the teacher
// selects a whole chapter or individual exercises. The sheet is built
// ONLY from verified questions; the preview is protected and the
// download reuses QuestionPaperDownloadDialog (same quota + Pro rules
// as the generator).
//
// HONEST LIMIT (25 Nov 2026): the exercise mapping needs Phase B
// extraction — chapter lists exist for only 8/264 books, and the
// exercise registry (QPG_EXERCISE_REGISTRY) is EMPTY today. So every
// chapter's exercise list shows the honest "not yet available" state
// and the exercise path yields zero questions (qpgSheetQuestionsFor
// says so plainly). The whole-chapter path below still works for the
// chapters that DO have verified questions (today: BCS English batch
// 1, 35 questions) — a chapter sheet from verified questions only.
// Book exercise text is NEVER copied verbatim: exercise labels are
// structural (২.১, ২.২ …), never the book's question text.

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { AlertBox, Button, Card } from '../components/ui';
import { useAuth } from '../lib/auth';
import { db } from '../firebase';
import { ProtectedContentWrapper } from '../components/ProtectedContentWrapper';
import { QuestionPaperDownloadDialog } from '../components/QuestionPaperDownloadDialog';
import {
  QPG_STREAMS,
  buildQpgPaper,
  clearQpgFlowPrefill,
  defaultPaperSetup,
  loadQpgFlowPrefill,
  qpgChaptersFor,
  qpgClassesFor,
  qpgSubjectsFor,
  type QpgPaper,
  type QpgStream,
} from '../lib/questionPaper';
import { loadVerifiedChapterQuestions } from '../lib/questionPaperCache';
import {
  QPG_EXERCISE_UNAVAILABLE_BN,
  qpgExercisesFor,
  qpgSelectedExerciseCount,
  qpgSheetQuestionsFor,
  selectAllQpgExercises,
  toggleQpgExercise,
  type QpgExerciseSelection,
} from '../lib/qpgExercises';
import { loadCachedProStatus } from '../lib/qpgFirestore';
import { QPG_PRO_LOCKED, type QpgProStatus } from '../lib/qpgProOrders';
import { renderPaperCanvases } from '../lib/questionPaperPdf';


export default function SheetBuilderPage() {
  const { user } = useAuth();
  const uid = user?.uid ?? 'guest';
  const userLabel = user?.email ?? user?.uid ?? 'guest';

  const [stream, setStream] = useState<QpgStream>('general');
  const [classId, setClassId] = useState('honours');
  const [subjectId, setSubjectId] = useState('english');
  const [selection, setSelection] = useState<QpgExerciseSelection>({});
  const [count, setCount] = useState(10);
  const [totalMarks, setTotalMarks] = useState(10);
  const [timeMinutes, setTimeMinutes] = useState(10);
  const [title, setTitle] = useState('অধ্যায়ভিত্তিক শিট');
  const [paper, setPaper] = useState<QpgPaper | null>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [buildError, setBuildError] = useState('');
  const [building, setBuilding] = useState(false);
  const [showDownload, setShowDownload] = useState(false);
  const [proStatus, setProStatus] = useState<QpgProStatus>(QPG_PRO_LOCKED);
  // Two-flow prefill (pattern 2, sprint 26 Nov 2026): the generator
  // hands over its stream/class/subject/chapters — this page scopes
  // itself to those chapters (one-shot; cleared after reading).
  const [prefilledChapterIds, setPrefilledChapterIds] = useState<string[] | null>(null);
  const [prefillNote, setPrefillNote] = useState('');

  useEffect(() => {
    const prefill = loadQpgFlowPrefill();
    if (!prefill) return;
    clearQpgFlowPrefill();
    if (!qpgClassesFor(prefill.stream).some((c) => c.id === prefill.classId)) return;
    if (!qpgSubjectsFor(prefill.stream, prefill.classId).some((s) => s.id === prefill.subjectId)) return;
    setStream(prefill.stream);
    setClassId(prefill.classId);
    setSubjectId(prefill.subjectId);
    setSelection({});
    setPaper(null);
    setPreviewUrls([]);
    setPrefilledChapterIds(prefill.chapterIds);
    setPrefillNote(
      `জেনারেটর থেকে আনা হয়েছে — ${prefill.chapterIds.length}টি অধ্যায়। শিট বানাতে নিচে অধ্যায় বেছে নিন।`,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const classes = qpgClassesFor(stream);
  const subjects = qpgSubjectsFor(stream, classId);
  const chapters = useMemo(() => {
    const all = qpgChaptersFor(stream, classId, subjectId);
    return prefilledChapterIds ? all.filter((c) => prefilledChapterIds.includes(c.id)) : all;
  }, [stream, classId, subjectId, prefilledChapterIds]);

  const selectedExerciseCount = qpgSelectedExerciseCount(selection);

  useEffect(() => {
    if (uid === 'guest' || !db) return;
    let alive = true;
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
  }, [uid]);

  const pickStream = (s: QpgStream) => {
    setStream(s);
    const nextClasses = qpgClassesFor(s);
    setClassId(nextClasses[0]?.id ?? '');
    const nextSubjects = qpgSubjectsFor(s, nextClasses[0]?.id ?? '');
    setSubjectId(nextSubjects[0]?.id ?? '');
    setSelection({});
    setPaper(null);
    setPreviewUrls([]);
    setPrefilledChapterIds(null);
    setPrefillNote('');
  };

  const pickClass = (c: string) => {
    setClassId(c);
    const nextSubjects = qpgSubjectsFor(stream, c);
    setSubjectId(nextSubjects[0]?.id ?? '');
    setSelection({});
    setPaper(null);
    setPreviewUrls([]);
    setPrefilledChapterIds(null);
    setPrefillNote('');
  };

  const pickSubject = (s: string) => {
    setSubjectId(s);
    setSelection({});
    setPaper(null);
    setPreviewUrls([]);
    setPrefilledChapterIds(null);
    setPrefillNote('');
  };

  const chapterPool = useMemo(
    () => chapters.flatMap((c) => loadVerifiedChapterQuestions({ stream, classId, subjectId, chapterId: c.id })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stream, classId, subjectId, chapters.length],
  );

  const buildSheet = async (mode: 'exercises' | 'whole-chapter') => {
    setBuildError('');
    setBuilding(true);
    try {
      const result =
        mode === 'exercises'
          ? qpgSheetQuestionsFor(selection, chapterPool)
          : { questions: chapterPool, available: chapterPool.length, requestedExercises: 0, reasonsBn: [], reasonsEn: [] };
      if (result.reasonsBn.length > 0 && result.questions.length === 0) {
        setBuildError(result.reasonsBn.join(' '));
        setPaper(null);
        setPreviewUrls([]);
        return;
      }
      const picked = result.questions.slice(0, Math.max(1, count));
      if (picked.length === 0) {
        setBuildError('এই নির্বাচনে যাচাইকৃত প্রশ্ন পাওয়া যায়নি।');
        setPaper(null);
        setPreviewUrls([]);
        return;
      }
      const setup = defaultPaperSetup({
        title,
        subject: subjects.find((s) => s.id === subjectId)?.nameBn ?? '',
        classLabel: classes.find((c) => c.id === classId)?.nameBn ?? '',
        questionCount: picked.length,
        marksPerQuestion: Math.max(1, Math.round(totalMarks / picked.length)),
        timeMinutes,
        sectionHeading: mode === 'exercises' ? 'নির্বাচিত অনুশীলনী' : 'পুরো অধ্যায়',
      });
      const built = buildQpgPaper({
        setup,
        questions: picked,
        isCustomVariant: true,
        kind: 'chapter-paper',
        patternLabelBn: 'অধ্যায়ভিত্তিক শিট (কাস্টম)',
        patternLabelEn: 'Chapter sheet (custom)',
      });
      // Full-sheet preview (owner 25 Nov 19:03): every question
      // visible, one image per A4 page — never a partial preview.
      const canvases = await renderPaperCanvases(built, { watermarked: true });
      setPaper(built);
      setPreviewUrls(canvases.map((c) => c.toDataURL('image/png')));
    } catch (err) {
      setBuildError(`শিট তৈরি করা যায়নি: ${err instanceof Error ? err.message : 'অজানা ত্রুটি'}`);
    } finally {
      setBuilding(false);
    }
  };

  return (
    <PageShell titleBn="শিট বিল্ডার" titleEn="Sheet Builder" wide className="ev-qpg-theme">
      <AlertBox tone="info">
        অধ্যায় থেকে অনুশীলনী বেছে শিট বানান — শুধু যাচাইকৃত অনুশীলন প্রশ্ন দিয়ে। অনুশীলনীভিত্তিক শিটের জন্য Phase B
        যাচাই (অধ্যায় → অনুশীলনী ম্যাপিং) এখনো চলছে; যাচাই হয়নি এমন প্রশ্ন এখানে কখনো দেখানো হয় না।
      </AlertBox>
      <p style={{ fontSize: 13, margin: '12px 0' }}>
        <Link to="/question-paper-generator">← প্রশ্নপত্র জেনারেটর</Link>
      </p>

      {/* Step 1 — Stream / Class / Subject */}
      <Card style={{ marginBottom: 16 }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 16 }}>১. ধারা, ক্লাস ও বিষয়</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {QPG_STREAMS.map((s) => (
            <Button key={s.id} variant={stream === s.id ? 'primary' : 'outline'} onClick={() => pickStream(s.id)}>
              {s.nameBn}
            </Button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {classes.map((c) => (
            <Button key={c.id} variant={classId === c.id ? 'primary' : 'outline'} onClick={() => pickClass(c.id)}>
              {c.nameBn}
            </Button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {subjects.map((s) => (
            <Button key={s.id} variant={subjectId === s.id ? 'primary' : 'outline'} onClick={() => pickSubject(s.id)}>
              {s.nameBn}
            </Button>
          ))}
        </div>
      </Card>

      {/* Step 2 — Chapters → exercises */}
      <Card style={{ marginBottom: 16 }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 16 }}>২. অধ্যায় → অনুশীলনী</h2>
        {prefillNote ? (
          <AlertBox tone="info">
            {prefillNote}{' '}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setPrefilledChapterIds(null);
                setPrefillNote('');
              }}
            >
              সব অধ্যায় দেখান
            </Button>
          </AlertBox>
        ) : null}
        {chapters.length === 0 ? (
          <p style={{ fontSize: 13, margin: 0 }}>
            এই ক্লাস/বিষয়ের যাচাইকৃত অধ্যায় এখনো নেই — Class 3–8 + মাদ্রাসার বই সংগ্রহ ও যাচাই চলছে।
          </p>
        ) : (
          chapters.map((chapter) => {
            const entry = qpgExercisesFor(chapter.id);
            const selectedInChapter = selection[chapter.id] ?? [];
            return (
              <div key={chapter.id} style={{ borderTop: '1px solid #eee', padding: '12px 0' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <strong style={{ fontSize: 14 }}>{chapter.nameBn}</strong>
                  <span style={{ fontSize: 12, color: '#666' }}>যাচাইকৃত প্রশ্ন: {chapter.verifiedCount}টি</span>
                  {entry ? (
                    <Button
                      variant="outline"
                      onClick={() => setSelection(selectAllQpgExercises(selection, entry))}
                    >
                      পুরো অধ্যায়
                    </Button>
                  ) : chapter.verifiedCount > 0 ? (
                    <Button variant="outline" onClick={() => void buildSheet('whole-chapter')}>
                      পুরো অধ্যায়ের শিট (যাচাইকৃত অনুশীলন প্রশ্ন)
                    </Button>
                  ) : null}
                </div>
                {entry ? (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                    {entry.exercises.map((ex) => {
                      const available = ex.verifiedCount > 0;
                      return (
                        <label
                          key={ex.id}
                          style={{
                            fontSize: 13,
                            border: '1px solid #ddd',
                            borderRadius: 8,
                            padding: '6px 10px',
                            opacity: available ? 1 : 0.6,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedInChapter.includes(ex.id)}
                            disabled={!available}
                            onChange={() => setSelection(toggleQpgExercise(selection, chapter.id, ex.id))}
                          />{' '}
                          {ex.numberBn}
                          {ex.titleBn ? ` — ${ex.titleBn}` : ''} ({ex.verifiedCount}টি)
                          {!available ? ` — ${QPG_EXERCISE_UNAVAILABLE_BN}` : ''}
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <p style={{ fontSize: 13, color: '#666', margin: '8px 0 0' }}>
                    {QPG_EXERCISE_UNAVAILABLE_BN} — অনুশীলনী ম্যাপিং (Phase B) এখনো হয়নি। যাচাইকৃত প্রশ্ন
                    থাকলে উপরের "পুরো অধ্যায়ের শিট" দিয়ে শিট বানাতে পারবেন।
                  </p>
                )}
              </div>
            );
          })
        )}
        <p style={{ fontSize: 13, margin: '12px 0 0' }}>
          নির্বাচিত অনুশীলনী: {selectedExerciseCount}টি
          {selectedExerciseCount > 0 ? (
            <>
              {' '}
              <Button variant="outline" onClick={() => void buildSheet('exercises')}>
                নির্বাচিত অনুশীলনীর শিট বানান
              </Button>
            </>
          ) : null}
        </p>
      </Card>

      {/* Step 3 — Sheet setup */}
      <Card style={{ marginBottom: 16 }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 16 }}>৩. শিটের তথ্য</h2>
        <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          <label style={{ fontSize: 13 }}>
            শিরোনাম
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ display: 'block', width: '100%', marginTop: 4, padding: 8, boxSizing: 'border-box' }}
            />
          </label>
          <label style={{ fontSize: 13 }}>
            প্রশ্ন সংখ্যা
            <input
              type="number"
              min={1}
              max={100}
              value={count}
              onChange={(e) => setCount(Math.max(1, Number(e.target.value) || 1))}
              style={{ display: 'block', width: '100%', marginTop: 4, padding: 8, boxSizing: 'border-box' }}
            />
          </label>
          <label style={{ fontSize: 13 }}>
            মোট নম্বর
            <input
              type="number"
              min={1}
              value={totalMarks}
              onChange={(e) => setTotalMarks(Math.max(1, Number(e.target.value) || 1))}
              style={{ display: 'block', width: '100%', marginTop: 4, padding: 8, boxSizing: 'border-box' }}
            />
          </label>
          <label style={{ fontSize: 13 }}>
            সময় (মিনিট)
            <input
              type="number"
              min={1}
              value={timeMinutes}
              onChange={(e) => setTimeMinutes(Math.max(1, Number(e.target.value) || 1))}
              style={{ display: 'block', width: '100%', marginTop: 4, padding: 8, boxSizing: 'border-box' }}
            />
          </label>
        </div>
        <p style={{ fontSize: 13, margin: '10px 0 0' }}>
          <Button onClick={() => void buildSheet('whole-chapter')} disabled={building || chapterPool.length === 0}>
            {building ? 'শিট তৈরি হচ্ছে…' : 'শিট বানান (পুরো অধ্যায়)'}
          </Button>{' '}
          <span style={{ color: '#666' }}>ফ্রি কোটা: মাসে ৩টি পেপার (শিট বিল্ডারের কোটা জেনারেটরের সঙ্গে একই)।</span>
        </p>
        {buildError ? <AlertBox tone="error">{buildError}</AlertBox> : null}
      </Card>

      {/* Preview + download */}
      {paper && previewUrls.length > 0 ? (
        <Card style={{ marginBottom: 16 }} className="qpg-print-area">
          <h2 style={{ margin: '0 0 8px', fontSize: 16 }}>
            প্রিভিউ — সব {paper.questions.length}টি প্রশ্ন
          </h2>
          <ProtectedContentWrapper userLabel={userLabel}>
            {previewUrls.map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`শিটের প্রিভিউ — পাতা ${i + 1}`}
                className="qpg-preview-page"
                style={{ display: 'block', width: '100%', height: 'auto' }}
                draggable={false}
              />
            ))}
          </ProtectedContentWrapper>
          <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button onClick={() => setShowDownload(true)}>ডাউনলোডের অপশন দেখুন</Button>
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
        </Card>
      ) : null}

      {showDownload && paper ? (
        <QuestionPaperDownloadDialog
          paper={paper}
          uid={uid}
          proStatus={proStatus}
          onClose={() => setShowDownload(false)}
        />
      ) : null}
    </PageShell>
  );
}
