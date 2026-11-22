// Eduvelto — Job circular detail (Step 14).
//
// /jobs/circulars/:circularId — the full 10 fields of design
// §7.1 for one published circular. The notice link
// (officialUrl) and the application-portal link (applyUrl) are
// SEPARATE actions: a circular PDF is not necessarily the
// apply destination, and no Apply button appears without a
// confirmed apply link on a verified, open circular.
// Closed circulars stay readable (archived) with no Apply
// action — they are useful for previous-question prep and
// recruitment-pattern research.

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { AlertBox, Button, Card, Chip, LinkButton, Skeleton } from '../components/ui';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../lib/auth';
import { jobExamBySlug } from '../lib/jobExams';
import {
  canShowApply,
  CIRCULAR_STATUS_BN,
  CIRCULAR_STATUS_EN,
  circularApplicationStatus,
  circularDeadlineLine,
  circularDomain,
  formatDhakaDate,
  isCircularVerified,
  type JobCircular,
} from '../lib/jobCirculars';
import { loadPublishedCircular } from '../lib/jobCircularsData';
import {
  CIRCULAR_REPORT_REASONS,
  createJobCorrection,
  createJobReport,
  JOB_REPORT_REASON_BN,
  type JobReportReason,
} from '../lib/jobReports';

export default function JobCircularDetailPage() {
  const { circularId } = useParams<{ circularId: string }>();
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const [circular, setCircular] = useState<JobCircular | null | undefined>(undefined);
  const [dataError, setDataError] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState<JobReportReason>('wrong-deadline');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSuggested, setReportSuggested] = useState('');
  const [reportEvidence, setReportEvidence] = useState('');
  const [correctionOpen, setCorrectionOpen] = useState(false);
  const [correctionWrong, setCorrectionWrong] = useState('');
  const [correctionFix, setCorrectionFix] = useState('');
  const [correctionSource, setCorrectionSource] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formBusy, setFormBusy] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const [correctionSent, setCorrectionSent] = useState(false);

  useEffect(() => {
    let alive = true;
    setCircular(undefined);
    setDataError(false);
    if (!circularId) {
      setCircular(null);
      return;
    }
    loadPublishedCircular(circularId)
      .then((c) => {
        if (alive) setCircular(c);
      })
      .catch(() => {
        if (alive) {
          setCircular(null);
          setDataError(true);
        }
      });
    return () => {
      alive = false;
    };
  }, [circularId]);

  const nowMs = Date.now();
  const examDef = circular ? jobExamBySlug(circular.examSlug) : undefined;

  return (
    <PageShell titleBn="বিজ্ঞপ্তির বিবরণ" titleEn="Circular details" wide hideTitle>
      <p style={{ margin: '0 0 12px' }}>
        <Link to="/jobs/circulars" style={{ fontSize: 14, fontWeight: 600 }}>
          {t({ bn: '← সব বিজ্ঞপ্তি', en: '← All circulars' })}
        </Link>
      </p>

      {circular === undefined ? (
        <Skeleton height={320} />
      ) : circular === null ? (
        <Card>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.7 }}>
            {t({
              bn: 'এই বিজ্ঞপ্তিটি পাওয়া যায়নি — এটি এখনো প্রকাশিত হয়নি বা সরানো হয়েছে।',
              en: 'This circular was not found — it has not been published yet or was removed.',
            })}
          </p>
          {dataError && (
            <p style={{ margin: '8px 0 0', color: 'var(--muted)', fontSize: 14 }}>
              {t({ bn: 'সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।', en: 'Check your connection and try again.' })}
            </p>
          )}
        </Card>
      ) : (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
            <Chip
              tone={
                circularApplicationStatus(circular, nowMs) === 'closed'
                  ? 'outline'
                  : circularApplicationStatus(circular, nowMs) === 'closing-soon'
                    ? 'gold'
                    : 'blue'
              }
            >
              {t({
                bn: CIRCULAR_STATUS_BN[circularApplicationStatus(circular, nowMs)],
                en: CIRCULAR_STATUS_EN[circularApplicationStatus(circular, nowMs)],
              })}
            </Chip>
            {isCircularVerified(circular) ? (
              <Chip tone="blue">{t({ bn: 'সরকারি উৎসে যাচাইকৃত ✓', en: 'Verified from official source ✓' })}</Chip>
            ) : (
              <Chip tone="outline">{t({ bn: 'যাচাই করা হয়নি', en: 'Not verified' })}</Chip>
            )}
          </div>

          <h1 style={{ fontSize: 22, margin: '0 0 4px', color: 'var(--heading)', lineHeight: 1.4 }}>
            {lang === 'bn' ? circular.postTitleBn : circular.postTitleEn}
          </h1>
          <p style={{ margin: '0 0 16px', color: 'var(--muted)', fontSize: 14 }}>
            {examDef ? (lang === 'bn' ? examDef.bn : examDef.en) : circular.examSlug}
          </p>

          <Card>
            <dl style={{ margin: 0, fontSize: 15, lineHeight: 1.8 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <dt style={{ color: 'var(--muted)', minWidth: 130 }}>{t({ bn: 'সার্কুলার নম্বর', en: 'Circular no.' })}</dt>
                <dd style={{ margin: 0, fontWeight: 600 }}>
                  {circular.circularNumber ?? t({ bn: 'নম্বর দেওয়া হয়নি', en: 'Not given' })}
                </dd>
              </div>
              {circular.publishedDateMillis !== null && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <dt style={{ color: 'var(--muted)', minWidth: 130 }}>{t({ bn: 'প্রকাশিত', en: 'Published' })}</dt>
                  <dd style={{ margin: 0 }}>{formatDhakaDate(circular.publishedDateMillis, lang, false)}</dd>
                </div>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <dt style={{ color: 'var(--muted)', minWidth: 130 }}>{t({ bn: 'পদসংখ্যা', en: 'Posts' })}</dt>
                <dd style={{ margin: 0, fontWeight: 600 }}>
                  {circular.totalPosts !== null
                    ? t({ bn: `${circular.totalPosts}টি`, en: `${circular.totalPosts}` })
                    : t({ bn: 'বিজ্ঞপ্তিতে উল্লেখ নেই', en: 'Not stated in the circular' })}
                </dd>
              </div>
              {circular.applicationStartDateMillis !== null && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <dt style={{ color: 'var(--muted)', minWidth: 130 }}>{t({ bn: 'আবেদন শুরু', en: 'Applications open' })}</dt>
                  <dd style={{ margin: 0 }}>{formatDhakaDate(circular.applicationStartDateMillis, lang, false)}</dd>
                </div>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <dt style={{ color: 'var(--muted)', minWidth: 130 }}>{t({ bn: 'আবেদনের শেষ তারিখ', en: 'Deadline' })}</dt>
                <dd style={{ margin: 0, fontWeight: 600 }}>
                  {circular.applicationDeadlineMillis !== null ? (
                    <>
                      {formatDhakaDate(circular.applicationDeadlineMillis, lang, circular.deadlinePrecision === 'datetime')}
                      {circular.deadlinePrecision === 'date_only' && (
                        <span style={{ color: 'var(--muted)', fontWeight: 400, fontSize: 13 }}>
                          {' '}
                          ({t({ bn: 'সঠিক সময় উল্লেখ নেই — দিনের শেষে আবেদন বন্ধ হবে', en: 'exact time not specified — applications close at end of day' })})
                        </span>
                      )}
                    </>
                  ) : (
                    t({ bn: 'সরকারি বিজ্ঞপ্তিতে আবেদনের শেষ তারিখ উল্লেখ নেই।', en: 'The official circular does not state an application deadline.' })
                  )}
                </dd>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <dt style={{ color: 'var(--muted)', minWidth: 130 }}>{t({ bn: 'অবস্থা', en: 'Status' })}</dt>
                <dd style={{ margin: 0 }}>
                  {lang === 'bn'
                    ? circularDeadlineLine(circular, nowMs).bn
                    : circularDeadlineLine(circular, nowMs).en}
                </dd>
              </div>
              {circular.examDateMillis !== null && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <dt style={{ color: 'var(--muted)', minWidth: 130 }}>{t({ bn: 'পরীক্ষার তারিখ', en: 'Exam date' })}</dt>
                  <dd style={{ margin: 0 }}>{formatDhakaDate(circular.examDateMillis, lang, false)}</dd>
                </div>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <dt style={{ color: 'var(--muted)', minWidth: 130 }}>{t({ bn: 'সার্কুলারের কপি', en: 'Circular copy' })}</dt>
                <dd style={{ margin: 0 }}>
                  {circular.copyStatus === 'stored'
                    ? t({ bn: 'কপি সংরক্ষিত আছে', en: 'Copy saved' })
                    : t({ bn: 'শুধু লিংক — মূল বিজ্ঞপ্তিটি দেখুন', en: 'Link only — see the original circular' })}
                </dd>
              </div>
            </dl>

            <h2 style={{ fontSize: 16, margin: '16px 0 6px', color: 'var(--heading)' }}>
              {t({ bn: 'যোগ্যতার সারাংশ', en: 'Eligibility summary' })}
            </h2>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.8 }}>
              {lang === 'bn' ? circular.eligibilitySummaryBn : circular.eligibilitySummaryEn}
            </p>
            <p style={{ margin: '8px 0 0', color: 'var(--muted)', fontSize: 13, lineHeight: 1.7 }}>
              {t({
                bn: 'বয়স, ফি ও বিস্তারিত যোগ্যতা মূল বিজ্ঞপ্তিতে দেখুন — এখানে সংখ্যা স্থায়ীভাবে লেখা হয় না।',
                en: 'See the original circular for age, fees and full eligibility — numbers are not written here permanently.',
              })}
            </p>

            {circular.copyStatus === 'stored' && circular.copyTextExcerpt && (
              <>
                <h2 style={{ fontSize: 16, margin: '16px 0 6px', color: 'var(--heading)' }}>
                  {t({ bn: 'বিজ্ঞপ্তির মূল অংশ', en: 'Key part of the circular' })}
                </h2>
                <p style={{ margin: 0, fontSize: 15, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{circular.copyTextExcerpt}</p>
              </>
            )}

            <h2 style={{ fontSize: 16, margin: '16px 0 6px', color: 'var(--heading)' }}>
              {t({ bn: 'যাচাই', en: 'Verification' })}
            </h2>
            {isCircularVerified(circular) ? (
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7 }}>
                {t({ bn: 'সরকারি উৎসে যাচাইকৃত', en: 'Verified from the official source' })}
                {circular.verifiedAtMillis !== null && (
                  <>
                    {' · '}
                    {t({ bn: 'যাচাইয়ের তারিখ', en: 'Verified on' })}: {formatDhakaDate(circular.verifiedAtMillis, lang, false)}
                  </>
                )}
              </p>
            ) : (
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7 }}>
                {t({
                  bn: 'যাচাই করা হয়নি — সরকারি উৎস থেকে নিশ্চিত করা হয়নি। আবেদন করার আগে মূল বিজ্ঞপ্তিটি নিজে দেখুন।',
                  en: 'Not verified — not yet confirmed from the official source. See the original circular yourself before applying.',
                })}
              </p>
            )}
            {circular.updatedAtMillis !== null && (
              <p style={{ margin: '6px 0 0', color: 'var(--muted)', fontSize: 13 }}>
                {t({ bn: 'সর্বশেষ হালনাগাদ', en: 'Last updated' })}: {formatDhakaDate(circular.updatedAtMillis, lang, false)}
              </p>
            )}
            {circularApplicationStatus(circular, nowMs) === 'closed' && (
              <AlertBox tone="info">
                {t({
                  bn: 'এই বিজ্ঞপ্তির আবেদনের সময় শেষ — এটি সংরক্ষিত আছে, যাতে আগের প্রশ্ন ও নিয়োগের ধরন দেখে প্রস্তুতি নেওয়া যায়।',
                  en: 'Applications for this circular have closed — it is kept here so you can study previous questions and the recruitment pattern.',
                })}
              </AlertBox>
            )}
          </Card>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
            <a
              href={circular.officialUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-block',
                padding: '10px 16px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--text)',
                fontWeight: 700,
                fontSize: 15,
                textDecoration: 'none',
              }}
            >
              {t({ bn: 'বিজ্ঞপ্তি দেখুন ↗', en: 'See the circular ↗' })} · {circularDomain(circular.officialUrl)}
            </a>
            {canShowApply(circular, nowMs) && circular.applyUrl ? (
              <a
                href={circular.applyUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-block',
                  padding: '10px 16px',
                  borderRadius: 8,
                  background: 'var(--accent)',
                  color: 'var(--on-accent)',
                  fontWeight: 700,
                  fontSize: 15,
                  textDecoration: 'none',
                }}
              >
                {t({ bn: 'আবেদন করুন ↗', en: 'Apply ↗' })} · {circularDomain(circular.applyUrl)}
              </a>
            ) : null}
          </div>
          <p style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.7 }}>
            {t({
              bn: 'উপরের লিংকগুলো Eduvelto ছেড়ে সরকারি সাইটে নিয়ে যাবে।',
              en: 'The links above leave Eduvelto for the official site.',
            })}
          </p>
          <p>
            <LinkButton to={`/jobs/circulars?exam=${circular.examSlug}`} variant="outline">
              {t({ bn: 'একই পরীক্ষার অন্যান্য বিজ্ঞপ্তি →', en: 'Other circulars for this exam →' })}
            </LinkButton>
          </p>

          {/* ---- Step 15: report incorrect info / propose a correction ---- */}
          <Card>
            <h2 style={{ fontSize: 16, margin: '0 0 6px', color: 'var(--heading)' }}>
              {t({ bn: 'তথ্যে ভুল আছে? রিপোর্ট করুন', en: 'Something wrong? Report it' })}
            </h2>
            <p style={{ margin: '0 0 12px', fontSize: 14, lineHeight: 1.7 }}>
              {t({
                bn: 'আপনার রিপোর্ট শুধু Eduvelto টিমের কাছে যাবে — সার্কুলারের তথ্য নিজে থেকে বদলাবে না। টিম অফিসিয়াল উৎস যাচাই করে ঠিক করবে।',
                en: 'Your report goes only to the Eduvelto team — the circular’s facts will not change on their own. The team will verify the official source and fix it.',
              })}
            </p>
            {!user ? (
              <p style={{ margin: 0, fontSize: 14 }}>
                <Link to="/login">{t({ bn: 'লগইন করে রিপোর্ট করুন', en: 'Log in to report' })}</Link>
              </p>
            ) : reportSent ? (
              <AlertBox tone="ok">
                {t({
                  bn: 'ধন্যবাদ — আপনার রিপোর্ট পৌঁছেছে। Eduvelto টিম এটি পর্যালোচনা করবে।',
                  en: 'Thank you — your report was received. The Eduvelto team will review it.',
                })}
              </AlertBox>
            ) : (
              <>
                {!reportOpen ? (
                  <Button onClick={() => setReportOpen(true)}>
                    {t({ bn: 'রিপোর্ট করুন', en: 'Report' })}
                  </Button>
                ) : (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (reportDetails.trim().length < 10) {
                        setFormError(
                          t({ bn: 'বিবরণ কমপক্ষে ১০ অক্ষর লিখুন।', en: 'Write a description of at least 10 characters.' }),
                        );
                        return;
                      }
                      setFormBusy(true);
                      setFormError(null);
                      try {
                        await createJobReport({
                          reporterId: user.uid,
                          targetType: 'jobCircular',
                          targetId: circular.docId,
                          targetAuthorId: circular.authorId,
                          reason: reportReason,
                          details: reportDetails.trim(),
                          suggestedValue: reportSuggested.trim() || null,
                          evidenceUrl: reportEvidence.trim() || null,
                          priority: 'normal',
                        });
                        setReportSent(true);
                      } catch {
                        setFormError(
                          t({
                            bn: 'রিপোর্ট পাঠানো যায়নি — সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।',
                            en: 'The report could not be sent — check your connection and try again.',
                          }),
                        );
                      } finally {
                        setFormBusy(false);
                      }
                    }}
                  >
                    <label htmlFor="reportReason" style={{ display: 'block', fontSize: 13, fontWeight: 700, margin: '8px 0 4px' }}>
                      {t({ bn: 'কী ভুল', en: 'What is wrong' })}
                    </label>
                    <select
                      id="reportReason"
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value as JobReportReason)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8 }}
                    >
                      {CIRCULAR_REPORT_REASONS.map((r) => (
                        <option key={r} value={r}>
                          {JOB_REPORT_REASON_BN[r]}
                        </option>
                      ))}
                    </select>
                    <label htmlFor="reportDetails" style={{ display: 'block', fontSize: 13, fontWeight: 700, margin: '12px 0 4px' }}>
                      {t({ bn: 'বিবরণ (কমপক্ষে ১০ অক্ষর)', en: 'Description (at least 10 characters)' })}
                    </label>
                    <textarea
                      id="reportDetails"
                      value={reportDetails}
                      onChange={(e) => setReportDetails(e.target.value)}
                      rows={3}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8 }}
                    />
                    <label htmlFor="reportSuggested" style={{ display: 'block', fontSize: 13, fontWeight: 700, margin: '12px 0 4px' }}>
                      {t({ bn: 'সঠিক তথ্যটি কী (ঐচ্ছিক)', en: 'What is the correct information (optional)' })}
                    </label>
                    <input
                      id="reportSuggested"
                      value={reportSuggested}
                      onChange={(e) => setReportSuggested(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8 }}
                    />
                    <label htmlFor="reportEvidence" style={{ display: 'block', fontSize: 13, fontWeight: 700, margin: '12px 0 4px' }}>
                      {t({ bn: 'প্রমাণের লিংক (ঐচ্ছিক — অফিসিয়াল বিজ্ঞপ্তির লিংক দিলে ভালো হয়)', en: 'Evidence link (optional — an official notice link helps)' })}
                    </label>
                    <input
                      id="reportEvidence"
                      type="url"
                      value={reportEvidence}
                      onChange={(e) => setReportEvidence(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8 }}
                    />
                    {formError ? <AlertBox tone="error">{formError}</AlertBox> : null}
                    <div style={{ marginTop: 12 }}>
                      <Button type="submit" disabled={formBusy}>
                        {t({ bn: 'রিপোর্ট পাঠান', en: 'Send report' })}
                      </Button>
                    </div>
                  </form>
                )}

                {!correctionSent ? (
                  <>
                    {!correctionOpen ? (
                      <div style={{ marginTop: 12 }}>
                        <Button variant="outline" onClick={() => setCorrectionOpen(true)}>
                          {t({ bn: 'সংশোধনের প্রস্তাব দিন', en: 'Propose a correction' })}
                        </Button>
                      </div>
                    ) : (
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          if (correctionWrong.trim().length < 10 || correctionFix.trim().length < 10 || correctionSource.trim().length < 10) {
                            setFormError(
                              t({ bn: '“কী ভুল”, “প্রস্তাবিত ঠিক” ও “উৎসের লিংক” — তিনটিই কমপক্ষে ১০ অক্ষর লিখুন (সংশোধনের জন্য উৎস আবশ্যক)।', en: 'Write at least 10 characters for “what is wrong”, “the proposed fix” and “the source link” (a source is required for a correction).' }),
                            );
                            return;
                          }
                          setFormBusy(true);
                          setFormError(null);
                          try {
                            await createJobCorrection({
                              requesterId: user.uid,
                              targetType: 'jobCircular',
                              targetId: circular.docId,
                              whatsWrong: correctionWrong.trim(),
                              proposedFix: correctionFix.trim(),
                              source: correctionSource.trim(),
                            });
                            setCorrectionSent(true);
                          } catch {
                            setFormError(
                              t({
                                bn: 'সংশোধনের প্রস্তাব পাঠানো যায়নি — সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।',
                                en: 'The correction proposal could not be sent — check your connection and try again.',
                              }),
                            );
                          } finally {
                            setFormBusy(false);
                          }
                        }}
                      >
                        <label htmlFor="correctionWrong" style={{ display: 'block', fontSize: 13, fontWeight: 700, margin: '12px 0 4px' }}>
                          {t({ bn: 'কী ভুল (কমপক্ষে ১০ অক্ষর)', en: 'What is wrong (at least 10 characters)' })}
                        </label>
                        <textarea
                          id="correctionWrong"
                          value={correctionWrong}
                          onChange={(e) => setCorrectionWrong(e.target.value)}
                          rows={2}
                          style={{ width: '100%', padding: '10px 12px', borderRadius: 8 }}
                        />
                        <label htmlFor="correctionFix" style={{ display: 'block', fontSize: 13, fontWeight: 700, margin: '12px 0 4px' }}>
                          {t({ bn: 'প্রস্তাবিত ঠিক (কমপক্ষে ১০ অক্ষর)', en: 'Proposed fix (at least 10 characters)' })}
                        </label>
                        <textarea
                          id="correctionFix"
                          value={correctionFix}
                          onChange={(e) => setCorrectionFix(e.target.value)}
                          rows={2}
                          style={{ width: '100%', padding: '10px 12px', borderRadius: 8 }}
                        />
                        <label htmlFor="correctionSource" style={{ display: 'block', fontSize: 13, fontWeight: 700, margin: '12px 0 4px' }}>
                          {t({ bn: 'উৎসের লিংক (আবশ্যক — অফিসিয়াল বিজ্ঞপ্তির লিংক)', en: 'Source link (required — the official notice link)' })}
                        </label>
                        <input
                          id="correctionSource"
                          type="url"
                          value={correctionSource}
                          onChange={(e) => setCorrectionSource(e.target.value)}
                          style={{ width: '100%', padding: '10px 12px', borderRadius: 8 }}
                        />
                        {formError ? <AlertBox tone="error">{formError}</AlertBox> : null}
                        <div style={{ marginTop: 12 }}>
                          <Button type="submit" disabled={formBusy}>
                            {t({ bn: 'প্রস্তাব পাঠান', en: 'Send proposal' })}
                          </Button>
                        </div>
                      </form>
                    )}
                  </>
                ) : (
                  <AlertBox tone="ok">
                    {t({
                      bn: 'ধন্যবাদ — আপনার সংশোধনের প্রস্তাব পৌঁছেছে। Eduvelto টিম এটি পর্যালোচনা করবে।',
                      en: 'Thank you — your correction proposal was received. The Eduvelto team will review it.',
                    })}
                  </AlertBox>
                )}
              </>
            )}
          </Card>
        </>
      )}
    </PageShell>
  );
}
