// Eduvelto — Admin: previous-question import wizard
// (design §3.3, §5.1 #7).
//
// /admin/jobs/previous — the six-step workflow as a wizard:
// source → transcribe → historical record → verify (second eye)
// → link+publish → correction. The wizard BLOCKS Publish until
// the verifier step passes (historicalImportPublishGate). It
// starts empty (0 records) — the first import is a deliberate,
// evidenced act, not a bulk seed. NEVER invent a previous
// question; NEVER label a guess as previous-year.

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useLanguage } from '../i18n/LanguageContext';
import { AlertBox, Card } from '../components/ui';
import { EmptyAdminBox } from '../components/AdminShared';
import { useAuth } from '../lib/auth';
import {
  HISTORICAL_IMPORT_STEPS,
  historicalIdFor,
  historicalImportCurrentStep,
  historicalImportPublishGate,
  type HistoricalImportState,
  type HistoricalImportStep,
} from '../lib/jobHistory';

const STEP_LABEL: Record<HistoricalImportStep, { bn: string; en: string }> = {
  source: { bn: '১. উৎস সংগ্রহ', en: '1. Collect the source' },
  transcribe: { bn: '২. প্রতিলিপি', en: '2. Transcribe' },
  'historical-record': { bn: '৩. ঐতিহাসিক রেকর্ড', en: '3. Historical record' },
  verify: { bn: '৪. যাচাই (দ্বিতীয় চোখ)', en: '4. Verify (second eye)' },
  'link-publish': { bn: '৫. সংযুক্তি + প্রকাশ', en: '5. Link + publish' },
  correction: { bn: '৬. সংশোধন', en: '6. Correction' },
};

export default function AdminJobPreviousPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [completed, setCompleted] = useState<Partial<Record<HistoricalImportStep, boolean>>>({});
  const [examId, setExamId] = useState('bcs');
  const [examYear, setExamYear] = useState(2023);
  const [seq, setSeq] = useState(1);
  const [questionId, setQuestionId] = useState('');
  const [sourceReference, setSourceReference] = useState('');
  const [duplicateDecision, setDuplicateDecision] = useState<HistoricalImportState['duplicateDecision']>(null);
  const [verifierUid, setVerifierUid] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const state: HistoricalImportState = {
    completed,
    authorUid: user?.uid ?? null,
    verifierUid: verifierUid.trim() === '' ? null : verifierUid.trim(),
    duplicateDecision,
  };
  const gate = useMemo(() => historicalImportPublishGate(state), [completed, verifierUid, duplicateDecision, user?.uid]);
  const current = historicalImportCurrentStep(state);
  const previewId = (() => {
    try {
      return historicalIdFor(examId, examYear, seq);
    } catch {
      return '—';
    }
  })();

  const toggle = (step: HistoricalImportStep) =>
    setCompleted((prev) => ({ ...prev, [step]: !prev[step] }));

  const createRecord = async () => {
    if (!db || !user || gate.length > 0 || questionId.trim() === '' || sourceReference.trim() === '') return;
    setSaving(true);
    setMessage(null);
    try {
      const id = historicalIdFor(examId, examYear, seq);
      await setDoc(doc(db, 'historicalQuestions', id), {
        historicalQuestionId: id,
        questionId: questionId.trim(),
        examId,
        examYear,
        examPhase: 'preliminary',
        subjectId: '',
        topicId: '',
        sourceType: 'official-paper',
        sourceReference: sourceReference.trim(),
        verificationStatus: 'Unverified',
        verifiedAt: null,
        verifiedBy: null,
        patternTag: null,
        auditTrail: [{ action: 'created', by: user.uid, at: new Date().toISOString(), note: 'Import wizard: record created, Unverified.' }],
      });
      setMessage(
        t({
          bn: `রেকর্ড তৈরি হয়েছে: ${id} (যাচাই হয়নি)। যাচাইকারী যাচাই করে তবেই 'Verified' করবেন।`,
          en: `Record created: ${id} (Unverified). The verifier must verify it before it becomes 'Verified'.`,
        }),
      );
    } catch {
      setMessage(t({ bn: 'সংরক্ষণ করা যায়নি — আবার চেষ্টা করুন।', en: 'Could not save — try again.' }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="ev-admin-page-title">{t({ bn: 'বিগত প্রশ্ন আমদানি', en: 'Previous-Question Import' })}</h1>
      <p className="ev-admin-note">
        {t({
          bn: 'বিগত প্রশ্ন কখনো অনুমান করে লেখা হয় না। উৎস শুধু অফিসিয়াল প্রশ্নপত্র / অফিসিয়াল নোটিশ — কোচিং সাইট, ব্লগ ও পরীক্ষার্থীর স্মৃতি শুধু খোঁজের সূত্র, উৎস নয়। যাচাইকারী কখনো লেখক নন।',
          en: 'A previous question is never written from memory. The source is only the official paper / official notice — coaching sites, blogs and candidate recall are discovery leads only, never sources. The verifier is never the author.',
        })}
      </p>

      <div style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
        {HISTORICAL_IMPORT_STEPS.map((step) => (
          <Card key={step}>
            <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={completed[step] ?? false}
                onChange={() => toggle(step)}
                style={{ marginTop: 4 }}
              />
              <span>
                <strong>{t(STEP_LABEL[step])}</strong>
                {step === current ? (
                  <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--muted)' }}>
                    {t({ bn: '← বর্তমান ধাপ', en: '← current step' })}
                  </span>
                ) : null}
                <span style={{ display: 'block', fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>
                  {step === 'source' &&
                    t({ bn: 'অফিসিয়াল প্রশ্নপত্র বা নোটিশ সংগ্রহ করুন (স্ক্যান / PDF)।', en: 'Obtain the official paper or notice (scan / PDF).' })}
                  {step === 'transcribe' &&
                    t({ bn: 'কেন্দ্রীয় ব্যাংকে প্রশ্নটি প্রথমে লিখুন (খসড়া, isPreviousYear: false)।', en: 'Create the central-bank question first (draft, isPreviousYear: false).' })}
                  {step === 'historical-record' &&
                    t({ bn: 'historicalQuestions ডক তৈরি করুন (যাচাই হয়নি, উৎসসহ)।', en: 'Create the historicalQuestions doc (unverified, with source).' })}
                  {step === 'verify' &&
                    t({ bn: 'যাচাইকারী উৎস খুলে পরীক্ষা/বছর/ধাপ/বিষয় যাচাই করবেন ও ডুপ্লিকেট পরীক্ষা চালাবেন।', en: 'The verifier opens the source, checks exam/year/phase/subject and runs the duplicate check.' })}
                  {step === 'link-publish' &&
                    t({ bn: 'JobQuestion.isPreviousYear = true করে স্বাভাবিক যাচাই-প্রবাহে প্রকাশ করুন।', en: 'Set JobQuestion.isPreviousYear = true and publish through the normal review flow.' })}
                  {step === 'correction' &&
                    t({ bn: 'উৎস ভুল প্রমাণিত হলে রেকর্ড সংশোধন করুন (নীরবে নয় — audit trail-এ লিখুন) ও বিশ্লেষণ পুনঃগণনা করুন।', en: 'If a source is later found wrong, correct the record (never silently — log it in the audit trail) and recalculate the analytics.' })}
                </span>
              </span>
            </label>
          </Card>
        ))}
      </div>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 16 }}>
          {t({ bn: 'নতুন রেকর্ড', en: 'New record' })}
        </div>
        <div style={{ display: 'grid', gap: 10, marginTop: 10, fontSize: 14 }}>
          <label>
            {t({ bn: 'পরীক্ষা (slug)', en: 'Exam (slug)' })}{' '}
            <input value={examId} onChange={(e) => setExamId(e.target.value)} style={{ padding: '6px 8px', borderRadius: 6 }} />
          </label>
          <label>
            {t({ bn: 'বছর', en: 'Year' })}{' '}
            <input
              type="number"
              value={examYear}
              onChange={(e) => setExamYear(Number(e.target.value))}
              style={{ padding: '6px 8px', borderRadius: 6, width: 100 }}
            />
          </label>
          <label>
            {t({ bn: 'ক্রমিক', en: 'Sequence' })}{' '}
            <input
              type="number"
              value={seq}
              onChange={(e) => setSeq(Number(e.target.value))}
              style={{ padding: '6px 8px', borderRadius: 6, width: 80 }}
            />
          </label>
          <label>
            {t({ bn: 'কেন্দ্রীয় প্রশ্নের ID (questionId)', en: 'Central question ID (questionId)' })}{' '}
            <input
              value={questionId}
              onChange={(e) => setQuestionId(e.target.value)}
              placeholder="bcs-eng-001"
              style={{ padding: '6px 8px', borderRadius: 6, width: '100%' }}
            />
          </label>
          <label>
            {t({ bn: 'উৎসের বিবরণ (sourceReference)', en: 'Source reference' })}{' '}
            <input
              value={sourceReference}
              onChange={(e) => setSourceReference(e.target.value)}
              placeholder="BCS 45th Preliminary Question Paper, 2023"
              style={{ padding: '6px 8px', borderRadius: 6, width: '100%' }}
            />
          </label>
          <label>
            {t({ bn: 'যাচাইকারীর UID (লেখক নন)', en: 'Verifier UID (not the author)' })}{' '}
            <input
              value={verifierUid}
              onChange={(e) => setVerifierUid(e.target.value)}
              style={{ padding: '6px 8px', borderRadius: 6, width: '100%' }}
            />
          </label>
          <label>
            {t({ bn: 'ডুপ্লিকেট সিদ্ধান্ত', en: 'Duplicate decision' })}{' '}
            <select
              value={duplicateDecision ?? ''}
              onChange={(e) => setDuplicateDecision((e.target.value || null) as HistoricalImportState['duplicateDecision'])}
              style={{ padding: '6px 8px', borderRadius: 6 }}
            >
              <option value="">{t({ bn: '— সিদ্ধান্ত নিন —', en: '— decide —' })}</option>
              <option value="distinct">{t({ bn: 'আলাদা প্রশ্ন', en: 'Distinct question' })}</option>
              <option value="same-question-different-year">{t({ bn: 'একই প্রশ্ন, ভিন্ন বছর (পুনরাবৃত্তি)', en: 'Same question, different year (recurrence)' })}</option>
              <option value="duplicate">{t({ bn: 'ডুপ্লিকেট', en: 'Duplicate' })}</option>
            </select>
          </label>
        </div>
        <p style={{ margin: '10px 0 0', fontSize: 13, color: 'var(--muted)' }}>
          {t({ bn: `রেকর্ড ID: ${previewId}`, en: `Record ID: ${previewId}` })}
        </p>
        {gate.length > 0 ? (
          <AlertBox tone="error">
            {t({ bn: 'প্রকাশ বন্ধ আছে:', en: 'Publish is blocked:' })}
            <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
              {gate.map((g) => (
                <li key={g}>{g}</li>
              ))}
            </ul>
          </AlertBox>
        ) : (
          <p style={{ margin: '10px 0 0', fontSize: 14, color: '#14532D' }}>
            {t({ bn: 'যাচাইয়ের শর্ত পূরণ হয়েছে — রেকর্ড তৈরি করা যাবে (যাচাই হয়নি অবস্থায়)।', en: 'The verification conditions are met — the record can be created (as Unverified).' })}
          </p>
        )}
        <p style={{ margin: '12px 0 0' }}>
          <button
            type="button"
            onClick={() => void createRecord()}
            disabled={saving || gate.length > 0 || questionId.trim() === '' || sourceReference.trim() === ''}
            style={{ padding: '10px 18px', borderRadius: 6, cursor: saving ? 'wait' : 'pointer' }}
          >
            {t({ bn: 'রেকর্ড তৈরি করুন (যাচাই হয়নি)', en: 'Create record (Unverified)' })}
          </button>
        </p>
        {message ? <p style={{ margin: '10px 0 0', fontSize: 14 }}>{message}</p> : null}
      </Card>

      <EmptyAdminBox
        bn="ব্যাংক এখনো শূন্য — ০টি যাচাইকৃত বিগত প্রশ্ন। প্রথম আমদানি ইচ্ছাকৃত, প্রমাণসহ কাজ।"
        en="The bank is still empty — 0 verified previous questions. The first import is a deliberate, evidenced act."
      />
      <p style={{ marginTop: 16 }}>
        <Link to="/admin/jobs">{t({ bn: '← চাকরি ব্যবস্থাপনা', en: '← Job Management' })}</Link>
      </p>
    </div>
  );
}
