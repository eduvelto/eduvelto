// Eduvelto — "Report Error" (ভুল জানান) button + form for one
// question. Drop-in for every student-facing question renderer
// (Job practice, Job mock, academic quiz). Submits ONE document
// to `feedback` (type 'question-error') via src/lib/feedback — never edits
// the question and never grants anything (no Pro reward here).
//
// Signed-out students see the form with a sign-in prompt instead
// of a submit (v1 reports are signed-in only; the rules enforce
// reporterUid == uid()).

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useLanguage } from '../i18n/LanguageContext';
import { AlertBox, Button } from './ui';
import {
  QUESTION_REPORT_ERROR_TYPES,
  QUESTION_REPORT_ERROR_TYPE_BN,
  submitQuestionReport,
  type QuestionReportErrorType,
} from '../lib/feedback';

export default function QuestionReportButton({
  questionId,
  questionText,
}: {
  questionId: string;
  questionText: string;
}) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [errorType, setErrorType] = useState<QuestionReportErrorType>('wrong-answer');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!user) return;
    if (description.trim().length === 0) {
      setError(t({ bn: 'কী ভুল তা সংক্ষেপে লিখুন।', en: 'Write briefly what is wrong.' }));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await submitQuestionReport({
        questionId,
        questionText,
        errorType,
        description: description.trim(),
        reporterUid: user.uid,
      });
      setDone(true);
      setDescription('');
    } catch (err) {
      setError(err instanceof Error ? err.message : t({ bn: 'রিপোর্ট পাঠানো যায়নি।', en: 'The report could not be sent.' }));
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <p style={{ margin: '12px 0 0', fontSize: 13, color: '#0A7A5C' }}>
        {t({ bn: '✓ রিপোর্ট জমা হয়েছে — অ্যাডমিন যাচাই করবেন।', en: '✓ Report submitted — an admin will review it.' })}
      </p>
    );
  }

  return (
    <div style={{ marginTop: 12 }}>
      {!open ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setOpen(true);
            setError(null);
          }}
        >
          {t({ bn: '⚑ ভুল জানান', en: '⚑ Report error' })}
        </Button>
      ) : (
        <div
          style={{
            border: '1px solid #E3E8EF',
            borderRadius: 10,
            padding: 12,
            background: '#F9FAFB',
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 14, color: '#142B3B', marginBottom: 8 }}>
            {t({ bn: 'এই প্রশ্নে ভুল জানান', en: 'Report an error in this question' })}
          </div>
          <label htmlFor={`qr-type-${questionId}`} style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 4 }}>
            {t({ bn: 'ভুলের ধরন', en: 'Error type' })}
          </label>
          <select
            id={`qr-type-${questionId}`}
            value={errorType}
            onChange={(e) => setErrorType(e.target.value as QuestionReportErrorType)}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 8, marginBottom: 8 }}
          >
            {QUESTION_REPORT_ERROR_TYPES.map((et) => (
              <option key={et} value={et}>
                {QUESTION_REPORT_ERROR_TYPE_BN[et]}
              </option>
            ))}
          </select>
          <label htmlFor={`qr-desc-${questionId}`} style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 4 }}>
            {t({ bn: 'কী ভুল (সংক্ষেপে)', en: 'What is wrong (briefly)' })}
          </label>
          <textarea
            id={`qr-desc-${questionId}`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            maxLength={1000}
            placeholder={t({ bn: 'যেমন: সঠিক উত্তর (খ) হওয়া উচিত, কারণ…', en: 'E.g. the correct answer should be (B), because…' }) as string}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 8, marginBottom: 8 }}
          />
          {!user ? (
            <AlertBox tone="info">
              {t({ bn: 'রিপোর্ট পাঠাতে লগইন করুন।', en: 'Log in to send a report.' })}{' '}
              <Link to="/login" style={{ fontWeight: 700 }}>
                {t({ bn: 'লগইন করুন →', en: 'Log in →' })}
              </Link>
            </AlertBox>
          ) : null}
          {error ? <AlertBox tone="error">{error}</AlertBox> : null}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button onClick={() => void submit()} disabled={!user || submitting} size="sm">
              {submitting
                ? t({ bn: 'পাঠানো হচ্ছে…', en: 'Sending…' })
                : t({ bn: 'রিপোর্ট পাঠান', en: 'Send report' })}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setOpen(false);
                setError(null);
              }}
              disabled={submitting}
            >
              {t({ bn: 'বাতিল', en: 'Cancel' })}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
