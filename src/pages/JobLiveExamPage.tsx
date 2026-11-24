// Eduvelto — Job Preparation Live Exam landing page
// (design-live-exam-dashboard.md §1.1, §5.6, §6 item 12).
//
// One page per exam: the verified pattern line, the Bank post
// selector (config choice, not new hubs), the window state
// (on-demand today — windows are not storable under the
// committed rules, see jobLiveExam.ts), the set kind (shared /
// variant — personalised sets cannot start until the §3.8
// gates pass), the variant list with the lowest-overlap
// recommendation, the small-bank notice when repeats are
// forced, and the per-exam Live Exam performance report.
//
// The exam itself still runs on the shared shell (JobMockPage
// — §7 reuse): this page only CHOOSES the variant and links
// to /jobs/mock/:docId, passing the Live Exam context
// (variantId, overlap, smallBankNotice, setKind) via location
// state so the intro can show it. The variant choice is
// per-student, per-exam history (users/{uid}/examHistory) —
// never a shared room doc, never a leaderboard.
//
// Honesty: when no full mock is published for the exam, the
// page shows the honest gap (pattern + "not yet"), never a
// fabricated mock. A variant whose snapshot count is below the
// full pattern is labelled "আংশিক মক — N/M প্রশ্ন", never
// shown with the full-exam total.
//
// LANGUAGE: UI text is Bangla + English via useLanguage().

import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { loginState } from '../lib/loginReturn';
import { PageShell } from '../components/PageShell';
import { AlertBox, Card, LinkButton, Reveal } from '../components/ui';
import { useAuth } from '../lib/auth';
import { useLanguage } from '../i18n/LanguageContext';
import { jobExamBySlug } from '../lib/jobExams';
import { listPublishedMocks, loadPublishedExamManifest } from '../lib/jobMock';
import { jobMockPatternSummary, type JobMockWithId } from '../lib/jobMocks';
import {
  BANK_POST_OPTIONS,
  isBankPostSlug,
  liveExamPassMarkLine,
  liveExamPatternLineBn,
  liveExamSetKindLabel,
  liveExamWindowLabelBn,
  liveExamWindowState,
  resolveLiveExamPattern,
  variantIdFromMock,
} from '../lib/jobLiveExam';
import {
  chooseLiveExamVariant,
  forcedRepeatNotice,
  SMALL_BANK_NOTICE_BN,
  type ExposureHistory,
  type LiveExamVariant,
} from '../lib/jobRepetition';
import { loadExamHistory } from '../lib/jobExamHistoryData';
import { loadLiveExamAttempts } from '../lib/jobDashboardData';
import { liveExamReport } from '../lib/jobDashboard';

/** Location state this page passes to /jobs/mock/:docId so the
 * intro can show the set kind + the small-bank notice. */
export interface JobLiveExamLocationState {
  liveExam: {
    variantId: number | null;
    overlap: number;
    smallBankNotice: boolean;
    setKind: 'shared';
  };
}

export default function JobLiveExamPage() {
  const { exam } = useParams<{ exam: string }>();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const back = loginState(location.pathname + location.search);
  const examSlug = exam ?? '';
  const def = jobExamBySlug(examSlug);
  const postParam = searchParams.get('post');
  const postSlug = examSlug === 'bank' && postParam && isBankPostSlug(postParam) ? postParam : null;
  const pattern = resolveLiveExamPattern(examSlug, postSlug);
  const passMark = pattern ? liveExamPassMarkLine(pattern) : null;
  const windowState = liveExamWindowState(null);

  const [loading, setLoading] = useState(true);
  const [mocks, setMocks] = useState<JobMockWithId[]>([]);
  const [variants, setVariants] = useState<LiveExamVariant[]>([]);
  const [history, setHistory] = useState<ExposureHistory | null>(null);
  const [report, setReport] = useState<ReturnType<typeof liveExamReport> | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setLoadError(false);
    const hubSlug =
      examSlug === 'bank-senior-officer' || examSlug === 'bank-assistant-director' ? 'bank' : examSlug;
    listPublishedMocks({ examSlug: hubSlug, kind: 'full' })
      .then(async (list) => {
        if (!alive) return;
        setMocks(list);
        const loaded: LiveExamVariant[] = [];
        await Promise.all(
          list.map(async (m) => {
            const manifest = await loadPublishedExamManifest(m.questionSetId).catch(() => null);
            if (!manifest) return;
            const variantNo = variantIdFromMock(m);
            if (variantNo === null) return;
            loaded.push({
              mockId: m.docId,
              docId: m.docId,
              variantNo,
              questionIds: manifest.questionRefs.map((r) => r.questionId),
            });
          }),
        );
        if (!alive) return;
        loaded.sort((a, b) => a.variantNo - b.variantNo);
        setVariants(loaded);
        setLoading(false);
      })
      .catch(() => {
        if (alive) {
          setLoading(false);
          setLoadError(true);
        }
      });
    if (user) {
      loadExamHistory(user.uid, examSlug)
        .then((h) => {
          if (alive) setHistory(h);
        })
        .catch(() => {
          if (alive) setHistory(null);
        });
      loadLiveExamAttempts(user.uid, examSlug)
        .then(({ attempts }) => {
          if (alive) setReport(liveExamReport(attempts, examSlug));
        })
        .catch(() => {
          if (alive) setReport(null);
        });
    } else {
      setHistory(null);
      setReport(null);
    }
    return () => {
      alive = false;
    };
  }, [examSlug, user?.uid]);

  const choice = useMemo(
    () => chooseLiveExamVariant(variants, history),
    [variants, history],
  );
  const showSmallBankNotice = useMemo(
    () => (choice ? forcedRepeatNotice(choice.overlaps.map((o) => o.overlap)) : false),
    [choice],
  );

  if (!def || !pattern) {
    return (
      <PageShell titleBn="লাইভ পরীক্ষা" titleEn="Live Exam" wide>
        <AlertBox tone="error">
          {t({ bn: 'এই পরীক্ষাটি পাওয়া যায়নি — হয় ঠিকানাটি ভুল, নয় এই পরীক্ষার লাইভ পরীক্ষা এখনো নেই।', en: 'This exam was not found — either the address is wrong, or this exam has no Live Exam yet.' })}
        </AlertBox>
        <p style={{ marginTop: 16 }}>
          <Link to="/jobs" style={{ fontWeight: 600 }}>{t({ bn: '← সব পরীক্ষা দেখুন', en: '← See all exams' })}</Link>
        </p>
      </PageShell>
    );
  }

  return (
    <PageShell titleBn={`${def.bn} — লাইভ পরীক্ষা`} titleEn={`${def.en} — Live Exam`} wide maxWidth={1240}>
      <Card>
        <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 19 }}>
          {lang === 'bn' ? def.bn : def.en} — {t({ bn: 'লাইভ পরীক্ষা', en: 'Live Exam' })}
        </div>
        <p style={{ margin: '8px 0', color: '#57616A', fontSize: 15, lineHeight: 1.7 }}>
          {liveExamPatternLineBn(pattern)}
          {passMark ? ` · ${lang === 'bn' ? passMark.labelBn : passMark.labelEn}` : ''}
        </p>
        <p style={{ margin: '0 0 8px', color: '#57616A', fontSize: 14 }}>
          {t({ bn: `সময়সূচি: ${liveExamWindowLabelBn(windowState, null)}`, en: `Schedule: ${windowState === 'on-demand' ? 'available any time' : windowState}` })}
        </p>
        <p style={{ margin: 0, color: '#57616A', fontSize: 14 }}>
          {liveExamSetKindLabel('shared', lang)}
        </p>
        {showSmallBankNotice ? (
          <div style={{ marginTop: 12 }}>
            <AlertBox tone="info">{SMALL_BANK_NOTICE_BN}</AlertBox>
          </div>
        ) : null}
      </Card>

      {examSlug === 'bank' ? (
        <Card style={{ marginTop: 16 }}>
          <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 16 }}>{t({ bn: 'পদ বেছে নিন', en: 'Choose the post' })}</div>
          <p style={{ margin: '6px 0 12px', color: '#57616A', fontSize: 14, lineHeight: 1.7 }}>
            {t({ bn: 'পদভেদে ধরন ভিন্ন — অফিসার/ক্যাশের বিষয়-বিন্যাস সিনিয়র অফিসার ও সহকারী পরিচালকের মতো নয়।', en: 'The pattern differs by post — the Officer/Cash subject split is not the Senior Officer / Assistant Director one.' })}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {BANK_POST_OPTIONS.map((o) => {
              const active = (postSlug ?? 'bank') === o.slug;
              return (
                <Link
                  key={o.slug}
                  to={`/jobs/live-exam/bank?post=${o.slug}`}
                  style={{
                    border: active ? '2px solid #0A1F44' : '1px solid #C9D2E0',
                    background: active ? '#E8EFFA' : '#fff',
                    borderRadius: 8,
                    padding: '8px 12px',
                    fontWeight: 600,
                    color: '#142B3B',
                    textDecoration: 'none',
                    fontSize: 14,
                  }}
                >
                  {lang === 'bn' ? o.labelBn : o.labelEn}
                </Link>
              );
            })}
          </div>
        </Card>
      ) : null}

      {loading ? (
        <Card style={{ marginTop: 16 }}>
          <p style={{ margin: 0, color: '#57616A', fontSize: 14 }}>{t({ bn: 'লোড হচ্ছে…', en: 'Loading…' })}</p>
        </Card>
      ) : loadError ? (
        <Card style={{ marginTop: 16 }}>
          <AlertBox tone="error">{t({ bn: 'লাইভ পরীক্ষার তালিকা লোড করা যায়নি — আবার চেষ্টা করুন।', en: 'The Live Exam list could not be loaded — please try again.' })}</AlertBox>
        </Card>
      ) : mocks.length === 0 ? (
        <Card style={{ marginTop: 16 }}>
          <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 17 }}>{t({ bn: 'এই পরীক্ষার মক এখনো তৈরি হয়নি', en: 'No mock for this exam yet' })}</div>
          <p style={{ margin: '8px 0 12px', color: '#57616A', fontSize: 14, lineHeight: 1.7 }}>
            {t({
              bn: 'আসল ধরনে সময়ভিত্তিক পূর্ণ মক (নম্বর, সময়, নেগেটিভ মার্কিং) প্রশ্নব্যাংক প্রস্তুত হলে এখানে আসবে। প্রশ্নব্যাংক এখনো ছোট, তাই এখন অনুশীলন সেট আর দৈনিক মক দিয়ে প্রস্তুতি নিন।',
              en: 'A timed full mock in the real pattern (marks, time, negative marking) will appear here once the question bank is ready. The bank is still small, so prepare with practice sets and the daily mock for now.',
            })}
          </p>
          <LinkButton to={`/jobs/${examSlug}`} variant="accent">
            {t({ bn: 'অনুশীলন দেখুন →', en: 'See practice →' })}
          </LinkButton>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12, marginTop: 16 }}>
          {mocks.map((m, i) => {
            const variantNo = variantIdFromMock(m);
            const overlap = choice?.overlaps.find((o) => o.variantNo === variantNo)?.overlap ?? null;
            const isRecommended = choice?.variant.docId === m.docId;
            const isPartial = pattern && m.rulesSnapshot.questionCount < pattern.questionCount;
            const state: JobLiveExamLocationState = {
              liveExam: {
                variantId: variantNo,
                overlap: overlap ?? 0,
                smallBankNotice: showSmallBankNotice,
                setKind: 'shared',
              },
            };
            return (
              <Reveal key={m.docId} delayMs={i * 40}>
                <Card>
                  <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 16 }}>
                    {lang === 'bn' ? m.titleBn : m.titleEn}
                    {isRecommended ? ` · ${t({ bn: 'আপনার জন্য সেরা', en: 'Best for you' })}` : ''}
                  </div>
                  <p style={{ margin: '6px 0 10px', color: '#57616A', fontSize: 14, lineHeight: 1.7 }}>
                    {jobMockPatternSummary(m.rulesSnapshot, undefined, lang)}
                    {isPartial ? (
                      <>
                        {' · '}
                        {t({
                          bn: `আংশিক মক — ${m.rulesSnapshot.questionCount}/${pattern.questionCount} প্রশ্ন (ব্যাংকে প্রশ্ন কম)`,
                          en: `Partial mock — ${m.rulesSnapshot.questionCount}/${pattern.questionCount} questions (question bank is still small)`,
                        })}
                      </>
                    ) : (
                      <>
                        {' · '}
                        {t({ bn: `পূর্ণাঙ্গ মক — ${m.rulesSnapshot.questionCount} প্রশ্ন`, en: `Full mock — ${m.rulesSnapshot.questionCount} questions` })}
                      </>
                    )}
                    {m.rulesSnapshot.passPercent !== null ? t({ bn: ` · পাস ${m.rulesSnapshot.passPercent}% (অনুশীলন হিসাব)`, en: ` · Pass ${m.rulesSnapshot.passPercent}% (practice calculation)` }) : ''}
                  </p>
                  {user && overlap !== null ? (
                    <p style={{ margin: '0 0 10px', color: '#57616A', fontSize: 13 }}>
                      {overlap === 0
                        ? t({ bn: 'এই সেটের কোনো প্রশ্ন আপনি আগে দেখেননি।', en: 'You have not seen any question in this set before.' })
                        : t({ bn: `এই সেটের ${overlap}টি প্রশ্ন আপনি আগে দেখেছেন।`, en: `You have seen ${overlap} question(s) in this set before.` })}
                    </p>
                  ) : null}
                  {user ? (
                    <LinkButton to={`/jobs/mock/${m.docId}`} state={state} variant="accent">
                      {t({ bn: 'মক শুরু করুন →', en: 'Start the mock →' })}
                    </LinkButton>
                  ) : (
                    <LinkButton to="/login" state={back} variant="accent">
                      {t({ bn: 'লগইন করে মক দিন →', en: 'Log in to take the mock →' })}
                    </LinkButton>
                  )}
                </Card>
              </Reveal>
            );
          })}
        </div>
      )}

      {report && report.attempts > 0 ? (
        <Card style={{ marginTop: 16 }}>
          <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 17 }}>{t({ bn: 'লাইভ পরীক্ষার ফলাফল — এই পরীক্ষা', en: 'Live Exam results — this exam' })}</div>
          <p style={{ margin: '8px 0', color: '#57616A', fontSize: 14, lineHeight: 1.7 }}>
            {t({
              bn: `${report.attempts}টি পূর্ণ মক · সর্বশেষ ${report.latestScore ?? 0}/${report.latestTotalMarks ?? 0} · সেরা ${report.bestScore ?? 0}/${report.bestTotalMarks ?? 0}`,
              en: `${report.attempts} full mock(s) · latest ${report.latestScore ?? 0}/${report.latestTotalMarks ?? 0} · best ${report.bestScore ?? 0}/${report.bestTotalMarks ?? 0}`,
            })}
            {report.partialAttempts > 0 ? t({ bn: ` · এর মধ্যে ${report.partialAttempts}টি আংশিক মক`, en: ` · including ${report.partialAttempts} partial mock(s)` }) : ''}
          </p>
          <p style={{ margin: '0 0 8px', color: '#57616A', fontSize: 14 }}>{report.trend.sentence}</p>
          {report.weakestSubject ? (
            <p style={{ margin: '0 0 8px', color: '#57616A', fontSize: 14 }}>
              {t({ bn: `দুর্বল বিষয়: ${report.weakestSubject.label} (${report.weakestSubject.accuracy}%)`, en: `Weakest subject: ${report.weakestSubject.label} (${report.weakestSubject.accuracy}%)` })}
            </p>
          ) : null}
          <p style={{ margin: 0 }}>
            <Link to="/jobs/dashboard" style={{ fontWeight: 600 }}>{t({ bn: 'ড্যাশবোর্ড দেখুন →', en: 'See the dashboard →' })}</Link>
          </p>
        </Card>
      ) : null}

      <p style={{ marginTop: 16 }}>
        <Link to={`/jobs/${examSlug}`} style={{ fontWeight: 600 }}>{t({ bn: '← পরীক্ষার পাতায় ফিরুন', en: '← Back to the exam page' })}</Link>
      </p>
    </PageShell>
  );
}
