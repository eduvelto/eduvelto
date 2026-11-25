// Eduvelto — Question Paper Generator Phase 2: Question Contribution
// (§3). Teachers submit questions → DRAFT (pending_review, never
// auto-published, never auto-verified) → admin review queue with
// duplicate detection → approval enters the verified pool with
// attribution.
//
// PROPOSAL (§8.7): submission is Pro-only. If the owner opens it to
// all logged-in teachers, the gate below lifts — the rule itself is
// the proposal, flagged in the Phase 2 report. Points/coupons are
// PROPOSALS (§8.8–§8.9) and are NOT stated as decided rewards in the
// UI — the page says only that approved questions earn points and a
// coupon, with the values confirmed after the owner's decision.
// Leaderboard shows names + institutions only — never phone/email.

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { AlertBox, Button, Card } from '../components/ui';
import { useAuth } from '../lib/auth';
import { db } from '../firebase';
import {
  QPG_STREAMS,
  QPG_VERIFIED_POOL,
  qpgChaptersFor,
  qpgClassesFor,
  qpgSubjectsFor,
  type QpgCognitiveLevel,
  type QpgDifficulty,
  type QpgQuestionNature,
  type QpgQuestionType,
} from '../lib/questionPaper';
import {
  QPG_CONTRIBUTION_MAX_PER_DAY,
  findPossibleDuplicates,
  validateQpgContribution,
  type QpgContributionDoc,
  type QpgContributorStatsDoc,
} from '../lib/qpgContributions';
import {
  loadCachedProStatus,
  loadMyQpgContributions,
  loadQpgLeaderboard,
  submitQpgContribution,
  type QpgContributionRow,
} from '../lib/qpgFirestore';
import { QPG_PRO_LOCKED, type QpgProStatus } from '../lib/qpgProOrders';

const TYPE_OPTIONS: Array<{ id: QpgQuestionType; nameBn: string }> = [
  { id: 'mcq', nameBn: 'MCQ (বহুনির্বাচনি)' },
  { id: 'cq', nameBn: 'সৃজনশীল (CQ)' },
  { id: 'short', nameBn: 'সংক্ষিপ্ত প্রশ্ন' },
  { id: 'multi-completion', nameBn: 'বহুপদী (Multiple Completion)' },
  { id: 'situation-set', nameBn: 'অভিন্ন তথ্যভিত্তিক (Situation Set)' },
  { id: 'picture-based', nameBn: 'ছবিভিত্তিক প্রশ্ন' },
];

const DIFFICULTY_OPTIONS: Array<{ id: Exclude<QpgDifficulty, 'all'>; nameBn: string }> = [
  { id: 'easy', nameBn: 'সহজ' },
  { id: 'medium', nameBn: 'মাঝারি' },
  { id: 'hard', nameBn: 'কঠিন' },
];

const COGNITIVE_OPTIONS: Array<{ id: QpgCognitiveLevel; nameBn: string }> = [
  { id: 'unspecified', nameBn: 'নির্দিষ্ট নয়' },
  { id: 'knowledge', nameBn: 'জ্ঞানমূলক' },
  { id: 'comprehension', nameBn: 'অনুধাবনমূলক' },
  { id: 'application', nameBn: 'প্রয়োগমূলক' },
  { id: 'higher', nameBn: 'উচ্চতর দক্ষতা' },
];

const NATURE_OPTIONS: Array<{ id: QpgQuestionNature; nameBn: string }> = [
  { id: 'unspecified', nameBn: 'নির্দিষ্ট নয়' },
  { id: 'mathematical', nameBn: 'গাণিতিক' },
  { id: 'theoretical', nameBn: 'তাত্ত্বিক' },
];

const STATUS_BN: Record<QpgContributionRow['status'], string> = {
  pending_review: 'পর্যালোচনাধীন',
  approved: 'অনুমোদিত',
  rejected: 'বাতিল',
};

export default function ContributePage() {
  const { user } = useAuth();
  const uid = user?.uid ?? 'guest';
  const isGuest = uid === 'guest';
  const contributorName = user?.displayName ?? user?.email ?? 'শিক্ষক';

  const [proStatus, setProStatus] = useState<QpgProStatus>(QPG_PRO_LOCKED);
  // Contributions are academic only — the Job & Admission track has
  // no chapter bank to contribute to (its questions are exam-pattern
  // packs, not chapters).
  const [stream, setStream] = useState<'general' | 'madrasah'>('general');
  const [classId, setClassId] = useState('honours');
  const [subjectId, setSubjectId] = useState('english');
  const [chapterId, setChapterId] = useState('');
  const [topic, setTopic] = useState('');
  const [type, setType] = useState<QpgQuestionType>('mcq');
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [modelAnswer, setModelAnswer] = useState('');
  const [explanation, setExplanation] = useState('');
  const [source, setSource] = useState('');
  const [institution, setInstitution] = useState('');
  const [difficulty, setDifficulty] = useState<Exclude<QpgDifficulty, 'all'>>('medium');
  const [cognitiveLevel, setCognitiveLevel] = useState<QpgCognitiveLevel>('unspecified');
  const [nature, setNature] = useState<QpgQuestionNature>('unspecified');
  const [ownWording, setOwnWording] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitDone, setSubmitDone] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState('');
  const [mySubmissions, setMySubmissions] = useState<QpgContributionRow[] | null>(null);
  const [leaderboard, setLeaderboard] = useState<QpgContributorStatsDoc[] | null>(null);

  const classes = qpgClassesFor(stream);
  const subjects = qpgSubjectsFor(stream, classId);
  const chapters = qpgChaptersFor(stream, classId, subjectId);
  const streams = QPG_STREAMS.filter(
    (s): s is { id: 'general' | 'madrasah'; nameBn: string; nameEn: string } =>
      s.id === 'general' || s.id === 'madrasah',
  );

  useEffect(() => {
    if (isGuest || !db) return;
    let alive = true;
    void loadCachedProStatus(db, uid)
      .then((s) => {
        if (alive) setProStatus(s);
      })
      .catch(() => undefined);
    void loadMyQpgContributions(db, uid)
      .then((rows) => {
        if (alive) setMySubmissions(rows);
      })
      .catch(() => undefined);
    void loadQpgLeaderboard(db)
      .then((rows) => {
        if (alive) setLeaderboard(rows);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [isGuest, uid]);

  const pickStream = (s: 'general' | 'madrasah') => {
    setStream(s);
    const nextClasses = qpgClassesFor(s);
    setClassId(nextClasses[0]?.id ?? '');
    const nextSubjects = qpgSubjectsFor(s, nextClasses[0]?.id ?? '');
    setSubjectId(nextSubjects[0]?.id ?? '');
    setChapterId('');
  };
  const pickClass = (c: string) => {
    setClassId(c);
    const nextSubjects = qpgSubjectsFor(stream, c);
    setSubjectId(nextSubjects[0]?.id ?? '');
    setChapterId('');
  };
  const pickSubject = (s: string) => {
    setSubjectId(s);
    setChapterId('');
  };

  const todayCount = (mySubmissions ?? []).filter((r) => r.createdAt.slice(0, 10) === new Date().toISOString().slice(0, 10)).length;
  const proUnlocked = proStatus.proUnlocked;

  const onSubmit = async () => {
    setSubmitError('');
    setDuplicateWarning('');
    const doc: QpgContributionDoc = {
      contributorUid: uid,
      contributorName,
      institution: institution.trim(),
      stream,
      classId,
      subjectId,
      chapterId,
      topic: topic.trim(),
      type,
      questionText: questionText.trim(),
      options: type === 'mcq' ? options.map((o) => o.trim()) : [],
      correctAnswer: type === 'mcq' ? correctIndex : modelAnswer.trim(),
      explanation: explanation.trim(),
      source: source.trim(),
      difficulty,
      cognitiveLevel,
      nature,
      ownWordingConfirmed: ownWording,
      status: 'pending_review',
      createdAt: new Date().toISOString(),
    };
    const problems = validateQpgContribution(doc);
    if (problems.length > 0) {
      setSubmitError(problems.join(' '));
      return;
    }
    if (todayCount >= QPG_CONTRIBUTION_MAX_PER_DAY) {
      setSubmitError(`আজকের ${QPG_CONTRIBUTION_MAX_PER_DAY}টি জমার সীমা শেষ — আগামীকাল আবার জমা দিন।`);
      return;
    }
    const dups = findPossibleDuplicates(questionText, QPG_VERIFIED_POOL);
    if (dups.length > 0) {
      setDuplicateWarning(
        `সতর্কতা: যাচাইকৃত প্রশ্নব্যাংকে ${dups.length}টি কাছাকাছি প্রশ্ন পাওয়া গেছে — একই প্রশ্ন আগে থেকে থাকলে অনুমোদন হবে না।`,
      );
      return;
    }
    setSubmitting(true);
    try {
      if (!db) {
        setSubmitError('জমা দেওয়া যায়নি — অবদান যাচাই ব্যবস্থা এখনো চালু হয়নি।');
        return;
      }
      await submitQpgContribution(db, doc);
      setSubmitDone(true);
      setQuestionText('');
      setOptions(['', '', '', '']);
      setModelAnswer('');
      setExplanation('');
      setSource('');
      setOwnWording(false);
      const rows = await loadMyQpgContributions(db, uid);
      setMySubmissions(rows);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      setSubmitError(
        /permission-denied/i.test(msg)
          ? 'জমা দেওয়া যায়নি — অবদান যাচাই ব্যবস্থা এখনো চালু হয়নি।'
          : `জমা দেওয়া যায়নি: ${msg || 'অজানা ত্রুটি'}`,
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageShell titleBn="প্রশ্ন জমা দিন" titleEn="Contribute Questions" wide className="ev-qpg-theme">
      <AlertBox tone="info">
        আপনার নিজের ভাষায় লেখা প্রশ্ন জমা দিন — যাচাইয়ের পর তা প্রশ্নব্যাংকে যোগ হবে, আপনার নামসহ। বইয়ের
        লেখা হুবহু কপি করা যাবে না; বোর্ড প্রশ্ন দাবি করলে যাচাইযোগ্য উৎস (বোর্ড + সাল + পত্র) লাগবে। অনুমোদিত
        প্রশ্নের জন্য পয়েন্ট ও কুপন পাওয়া যায় — নিয়ম মালিকের নিশ্চিতকরণের পর জানানো হবে।
      </AlertBox>

      {isGuest ? (
        <AlertBox tone="info">
          প্রশ্ন জমা দিতে <Link to="/login">লগইন করুন</Link>।
        </AlertBox>
      ) : !proUnlocked ? (
        <Card style={{ marginBottom: 16 }}>
          <h2 style={{ margin: '0 0 8px', fontSize: 16 }}>Pro প্রয়োজন</h2>
          <p style={{ fontSize: 13, margin: '0 0 10px' }}>
            প্রশ্ন জমা দেওয়া Pro শিক্ষকদের জন্য। Pro নিলে জমা দিতে পারবেন, আর অনুমোদিত প্রশ্নে পয়েন্ট ও
            কুপন পাবেন।
          </p>
          <Link to="/pricing">
            <Button>মূল্য দেখুন — Pro নিন</Button>
          </Link>
        </Card>
      ) : (
        <Card style={{ marginBottom: 16 }}>
          <h2 style={{ margin: '0 0 8px', fontSize: 16 }}>নতুন প্রশ্ন জমা দিন</h2>
          {submitDone ? <AlertBox tone="ok">জমা হয়েছে — পর্যালোচনার জন্য গেছে। অনুমোদন হলে নিচের তালিকায় দেখতে পাবেন।</AlertBox> : null}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            {streams.map((s) => (
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
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            {subjects.map((s) => (
              <Button key={s.id} variant={subjectId === s.id ? 'primary' : 'outline'} onClick={() => pickSubject(s.id)}>
                {s.nameBn}
              </Button>
            ))}
          </div>
          <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: 10 }}>
            <label style={{ fontSize: 13 }}>
              অধ্যায়
              <select
                value={chapterId}
                onChange={(e) => setChapterId(e.target.value)}
                style={{ display: 'block', width: '100%', marginTop: 4, padding: 8, boxSizing: 'border-box' }}
              >
                <option value="">অধ্যায় বেছে নিন</option>
                {chapters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nameBn}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ fontSize: 13 }}>
              টপিক
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="যেমন: Tense"
                style={{ display: 'block', width: '100%', marginTop: 4, padding: 8, boxSizing: 'border-box' }}
              />
            </label>
            <label style={{ fontSize: 13 }}>
              প্রশ্নের ধরন
              <select
                value={type}
                onChange={(e) => setType(e.target.value as QpgQuestionType)}
                style={{ display: 'block', width: '100%', marginTop: 4, padding: 8, boxSizing: 'border-box' }}
              >
                {TYPE_OPTIONS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nameBn}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ fontSize: 13 }}>
              কাঠিন্য
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Exclude<QpgDifficulty, 'all'>)}
                style={{ display: 'block', width: '100%', marginTop: 4, padding: 8, boxSizing: 'border-box' }}
              >
                {DIFFICULTY_OPTIONS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nameBn}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ fontSize: 13 }}>
              চিন্তন স্তর
              <select
                value={cognitiveLevel}
                onChange={(e) => setCognitiveLevel(e.target.value as QpgCognitiveLevel)}
                style={{ display: 'block', width: '100%', marginTop: 4, padding: 8, boxSizing: 'border-box' }}
              >
                {COGNITIVE_OPTIONS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nameBn}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ fontSize: 13 }}>
              প্রকৃতি
              <select
                value={nature}
                onChange={(e) => setNature(e.target.value as QpgQuestionNature)}
                style={{ display: 'block', width: '100%', marginTop: 4, padding: 8, boxSizing: 'border-box' }}
              >
                {NATURE_OPTIONS.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.nameBn}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label style={{ fontSize: 13, display: 'block', marginBottom: 10 }}>
            প্রশ্ন (নিজের ভাষায় লিখুন)
            <textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              rows={3}
              style={{ display: 'block', width: '100%', marginTop: 4, padding: 8, boxSizing: 'border-box' }}
            />
          </label>
          {type === 'mcq' ? (
            <div style={{ marginBottom: 10 }}>
              {options.map((opt, i) => (
                <label key={i} style={{ fontSize: 13, display: 'block', marginBottom: 6 }}>
                  <input type="radio" name="qpg-correct" checked={correctIndex === i} onChange={() => setCorrectIndex(i)} />{' '}
                  অপশন {['A', 'B', 'C', 'D'][i]} (সঠিক হলে রেডিও চিহ্ন দিন)
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => setOptions(options.map((o, j) => (j === i ? e.target.value : o)))}
                    style={{ display: 'block', width: '100%', marginTop: 4, padding: 8, boxSizing: 'border-box' }}
                  />
                </label>
              ))}
            </div>
          ) : (
            <label style={{ fontSize: 13, display: 'block', marginBottom: 10 }}>
              মডেল উত্তর
              <textarea
                value={modelAnswer}
                onChange={(e) => setModelAnswer(e.target.value)}
                rows={3}
                style={{ display: 'block', width: '100%', marginTop: 4, padding: 8, boxSizing: 'border-box' }}
              />
            </label>
          )}
          <label style={{ fontSize: 13, display: 'block', marginBottom: 10 }}>
            ব্যাখ্যা (কেন এই উত্তর সঠিক)
            <textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              rows={2}
              style={{ display: 'block', width: '100%', marginTop: 4, padding: 8, boxSizing: 'border-box' }}
            />
          </label>
          <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: 10 }}>
            <label style={{ fontSize: 13 }}>
              উৎস (ঐচ্ছিক — বই/অধ্যায়; বোর্ড দাবি করলে বোর্ড + সাল + পত্র)
              <input
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                style={{ display: 'block', width: '100%', marginTop: 4, padding: 8, boxSizing: 'border-box' }}
              />
            </label>
            <label style={{ fontSize: 13 }}>
              প্রতিষ্ঠান (ঐচ্ছিক)
              <input
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                style={{ display: 'block', width: '100%', marginTop: 4, padding: 8, boxSizing: 'border-box' }}
              />
            </label>
          </div>
          <label style={{ fontSize: 13, display: 'block', marginBottom: 10 }}>
            <input type="checkbox" checked={ownWording} onChange={(e) => setOwnWording(e.target.checked)} /> এই
            প্রশ্নটি আমার নিজের ভাষায় লেখা — বইয়ের লেখা হুবহু কপি নয়।
          </label>
          {duplicateWarning ? <AlertBox tone="error">{duplicateWarning}</AlertBox> : null}
          {submitError ? <AlertBox tone="error">{submitError}</AlertBox> : null}
          <p style={{ fontSize: 13, margin: '0 0 10px' }}>আজ জমা দিয়েছেন: {todayCount}/{QPG_CONTRIBUTION_MAX_PER_DAY}টি</p>
          <Button onClick={() => void onSubmit()} disabled={submitting}>
            {submitting ? 'জমা দেওয়া হচ্ছে…' : 'জমা দিন (পর্যালোচনার জন্য)'}
          </Button>
        </Card>
      )}

      {/* My submissions */}
      {!isGuest && mySubmissions && mySubmissions.length > 0 ? (
        <Card style={{ marginBottom: 16 }}>
          <h2 style={{ margin: '0 0 8px', fontSize: 16 }}>আমার জমা</h2>
          {mySubmissions.map((r) => (
            <div key={r.id} style={{ borderTop: '1px solid #eee', padding: '10px 0' }}>
              <p style={{ fontSize: 13, margin: '0 0 4px' }}>{r.questionText}</p>
              <p style={{ fontSize: 12, color: '#666', margin: 0 }}>
                {STATUS_BN[r.status]}
                {r.status === 'approved' && typeof r.pointsAwarded === 'number' ? ` — ${r.pointsAwarded} পয়েন্ট` : ''}
                {r.status === 'approved' && r.couponCode ? ` — কুপন: ${r.couponCode}` : ''}
                {r.status === 'rejected' && r.rejectReason ? ` — কারণ: ${r.rejectReason}` : ''}
                {r.status === 'rejected' && r.rejectNote ? ` (${r.rejectNote})` : ''}
              </p>
            </div>
          ))}
        </Card>
      ) : null}

      {/* Leaderboard */}
      {leaderboard && leaderboard.length > 0 ? (
        <Card style={{ marginBottom: 16 }}>
          <h2 style={{ margin: '0 0 8px', fontSize: 16 }}>শীর্ষ অবদানকারী</h2>
          <ol style={{ margin: 0, paddingLeft: 20, fontSize: 13 }}>
            {leaderboard.map((s) => (
              <li key={s.uid} style={{ marginBottom: 4 }}>
                {s.displayName}
                {s.institution ? ` (${s.institution})` : ''} — {s.points} পয়েন্ট, {s.approved}টি অনুমোদিত, স্তর {s.level}
              </li>
            ))}
          </ol>
        </Card>
      ) : null}
    </PageShell>
  );
}
