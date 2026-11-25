// Eduvelto — GENERAL National Live Exam hub (sprint Day 5).
//
// /:lang/live-exam — the scheduled national live exams (Job /
// Admission / Academic) in one place: title, category, Dhaka
// start/end, status (upcoming / live now / ended) and a live
// countdown. Entry is STRICTLY inside the window
// (canEnterLiveExam — client gate; the existing mock session /
// attempt rules are the server-side backstop, see liveExam.ts)
// and requires login; before the window the card shows the
// countdown, after it the national merit list — never an entry
// button. The Job track is REUSED, never rebuilt: Job entries
// deep-link to /jobs/live-exam/:exam and run on the existing Job
// mock engine (/jobs/mock/:docId) with its single compressed
// bundle + receipt-gated key.
//
// The schedule is honest: it comes only from published dated
// mocks (jobExamDefinitions) + the owner-announced config in
// liveExam.ts. Admission / Academic have no live-exam engine
// yet, so their sections say so instead of showing a guessed
// exam. With nothing scheduled anywhere, the page says so and
// points at the Job calendar — never a fabricated exam.
//
// LANGUAGE: Bangla + English via useLanguage().

import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { loginState } from '../lib/loginReturn';
import { PageShell } from '../components/PageShell';
import { AlertBox, Card, Chip, LinkButton, Reveal } from '../components/ui';
import { useAuth } from '../lib/auth';
import { useLanguage } from '../i18n/LanguageContext';
import { listPublishedMocks } from '../lib/jobMock';
import {
  LIVE_EXAM_CATEGORIES,
  LIVE_EXAM_CATEGORY_BN,
  LIVE_EXAM_CATEGORY_EN,
  NATIONAL_LIVE_EXAM_SCHEDULE,
  NATIONAL_LIVE_EXAM_STATUS_BN,
  NATIONAL_LIVE_EXAM_STATUS_EN,
  buildNationalLiveExamList,
  canEnterLiveExam,
  countdownParts,
  formatLiveExamCountdown,
  formatLiveExamInstant,
  jobLiveExamEntryPath,
  nationalLiveExamStatus,
  type LiveExamCategory,
  type NationalLiveExam,
} from '../lib/liveExam';
import {
  formatMeritTime,
  getLiveMeritSnapshot,
  type LiveMeritList,
} from '../lib/liveExamMerit';

type CategoryFilter = 'all' | LiveExamCategory;

const MERIT_REFRESH_MILLIS = 60_000;

export default function LiveExamPage() {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const location = useLocation();
  const back = loginState(location.pathname + location.search);
  const [now, setNow] = useState(() => Date.now());
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [exams, setExams] = useState<NationalLiveExam[]>([]);
  const [meritById, setMeritById] = useState<Record<string, LiveMeritList | null>>({});
  const [meritError, setMeritError] = useState(false);

  // Live countdown tick (1s).
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  // One query: all published mock definitions; the hub list is
  // derived client-side (dated daily/weekly mocks only).
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setLoadError(false);
    listPublishedMocks()
      .then((mocks) => {
        if (!alive) return;
        setExams(buildNationalLiveExamList({ mocks, configs: NATIONAL_LIVE_EXAM_SCHEDULE }));
        setLoading(false);
      })
      .catch(() => {
        if (alive) {
          setLoading(false);
          setLoadError(true);
        }
      });
    return () => {
      alive = false;
    };
  }, []);

  // Merit lists for live + ended exams (the national list comes
  // from leaderboardSnapshots/liveMerit-{examId}); refreshed
  // every 60s while any exam is live.
  useEffect(() => {
    if (exams.length === 0) return;
    let alive = true;
    let timer: number | undefined;
    const load = (forceRefresh: boolean) => {
      const targets = exams.filter(
        (e) => nationalLiveExamStatus(e.window, Date.now()) !== 'upcoming',
      );
      if (targets.length === 0) return;
      Promise.all(targets.map((e) => getLiveMeritSnapshot(e.meritExamId, { forceRefresh })))
        .then((lists) => {
          if (!alive) return;
          setMeritById((prev) => {
            const next = { ...prev };
            targets.forEach((e, i) => {
              next[e.meritExamId] = lists[i];
            });
            return next;
          });
        })
        .catch(() => {
          if (alive) setMeritError(true);
        });
    };
    load(false);
    timer = window.setInterval(() => load(true), MERIT_REFRESH_MILLIS);
    return () => {
      alive = false;
      if (timer !== undefined) window.clearInterval(timer);
    };
  }, [exams]);

  const counts = useMemo(() => {
    const c: Record<CategoryFilter, number> = { all: exams.length, job: 0, admission: 0, academic: 0 };
    for (const e of exams) c[e.category] += 1;
    return c;
  }, [exams]);

  const visible = useMemo(
    () => (category === 'all' ? exams : exams.filter((e) => e.category === category)),
    [exams, category],
  );

  const refreshMerit = (exam: NationalLiveExam) => {
    getLiveMeritSnapshot(exam.meritExamId, { forceRefresh: true })
      .then((list) => setMeritById((prev) => ({ ...prev, [exam.meritExamId]: list })))
      .catch(() => setMeritError(true));
  };

  return (
    <PageShell titleBn="জাতীয় লাইভ পরীক্ষা" titleEn="National Live Exam" wide maxWidth={1240}>
      <p style={{ margin: '0 0 16px', color: '#57616A', fontSize: 15, lineHeight: 1.7 }}>
        {t({
          bn: 'সারা দেশের শিক্ষার্থীরা একই সময়ে একই পরীক্ষা দেয় — নির্ধারিত সময়েই শুধু প্রবেশ করা যায়, সময় শেষ হলে মেধাতালিকা দেখা যায়। সব সময় ঢাকা সময়।',
          en: 'Students across the country take the same exam at the same time — entry is only possible inside the scheduled window, and the merit list appears after it ends. All times are Dhaka time.',
        })}
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {(['all', ...LIVE_EXAM_CATEGORIES] as CategoryFilter[]).map((c) => {
          const active = category === c;
          const label =
            c === 'all'
              ? t({ bn: 'সবগুলো', en: 'All' })
              : lang === 'bn'
                ? LIVE_EXAM_CATEGORY_BN[c]
                : LIVE_EXAM_CATEGORY_EN[c];
          return (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              aria-pressed={active}
              style={{
                border: active ? '2px solid #0A1F44' : '1px solid #C9D2E0',
                background: active ? '#E8EFFA' : '#fff',
                borderRadius: 8,
                padding: '8px 12px',
                fontWeight: 600,
                color: '#142B3B',
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              {label} ({counts[c]})
            </button>
          );
        })}
      </div>

      {loading ? (
        <Card>
          <p style={{ margin: 0, color: '#57616A', fontSize: 14 }}>{t({ bn: 'লোড হচ্ছে…', en: 'Loading…' })}</p>
        </Card>
      ) : loadError ? (
        <Card>
          <AlertBox tone="error">{t({ bn: 'সময়সূচি লোড করা যায়নি — আবার চেষ্টা করুন।', en: 'The schedule could not be loaded — please try again.' })}</AlertBox>
        </Card>
      ) : exams.length === 0 ? (
        <Card>
          <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 17 }}>
            {t({ bn: 'এখনো কোনো জাতীয় লাইভ পরীক্ষা নির্ধারিত হয়নি', en: 'No national live exam is scheduled yet' })}
          </div>
          <p style={{ margin: '8px 0 12px', color: '#57616A', fontSize: 14, lineHeight: 1.7 }}>
            {t({
              bn: 'প্রকাশিত দৈনিক/সাপ্তাহিক মক বা ঘোষিত জাতীয় পরীক্ষা থাকলেই এখানে সময়সূচি আসবে। আপাতত চাকরির মক আর অনুশীলন দিয়ে প্রস্তুতি নিন।',
              en: 'The schedule appears here once a daily/weekly mock is published or a national exam is announced. For now, prepare with the Job mocks and practice sets.',
            })}
          </p>
          <LinkButton to="/jobs/calendar" variant="accent">
            {t({ bn: 'পরীক্ষার ক্যালেন্ডার দেখুন →', en: 'See the exam calendar →' })}
          </LinkButton>
        </Card>
      ) : visible.length === 0 ? (
        <Card>
          <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 17 }}>
            {t({
              bn: `এই বিভাগে এখনো কোনো জাতীয় লাইভ পরীক্ষা নির্ধারিত হয়নি`,
              en: `No national live exam is scheduled in this category yet`,
            })}
          </div>
          <p style={{ margin: '8px 0 0', color: '#57616A', fontSize: 14, lineHeight: 1.7 }}>
            {t({
              bn: 'এই বিভাগের লাইভ পরীক্ষা ঘোষণা হলে এখানে সময়সূচি আসবে।',
              en: 'The schedule will appear here once a live exam is announced for this category.',
            })}
          </p>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
          {visible.map((exam, i) => {
            const status = nationalLiveExamStatus(exam.window, now);
            const decision = canEnterLiveExam(exam, now, !!user);
            const countdownTarget = status === 'upcoming' ? exam.window.startAtMillis : exam.window.endAtMillis;
            const merit = meritById[exam.meritExamId];
            return (
              <Reveal key={exam.id} delayMs={i * 40}>
                <Card>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
                    <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 16 }}>
                      {lang === 'bn' ? exam.titleBn : exam.titleEn}
                    </div>
                    <Chip tone={status === 'live' ? 'gold' : status === 'ended' ? 'outline' : 'blue'}>
                      {lang === 'bn' ? NATIONAL_LIVE_EXAM_STATUS_BN[status] : NATIONAL_LIVE_EXAM_STATUS_EN[status]}
                    </Chip>
                  </div>
                  <p style={{ margin: '6px 0', color: '#57616A', fontSize: 14 }}>
                    {lang === 'bn' ? LIVE_EXAM_CATEGORY_BN[exam.category] : LIVE_EXAM_CATEGORY_EN[exam.category]}
                    {' · '}
                    {formatLiveExamInstant(exam.window.startAtMillis, lang)}
                    {' — '}
                    {formatLiveExamInstant(exam.window.endAtMillis, lang)}
                  </p>
                  {status !== 'ended' ? (
                    <p style={{ margin: '0 0 12px', fontSize: 18, fontWeight: 700, color: '#0A1F44' }}>
                      {status === 'upcoming'
                        ? t({ bn: 'শুরু হতে ', en: 'Starts in ' })
                        : t({ bn: 'শেষ হতে ', en: 'Ends in ' })}
                      {formatLiveExamCountdown(countdownParts(countdownTarget, now), lang)}
                    </p>
                  ) : null}
                  {decision.allowed ? (
                    <LinkButton to={exam.entryPath} variant="accent">
                      {t({ bn: 'পরীক্ষায় প্রবেশ করুন →', en: 'Enter the exam →' })}
                    </LinkButton>
                  ) : decision.reason === 'login-required' && status === 'live' ? (
                    <LinkButton to="/login" state={back} variant="accent">
                      {t({ bn: 'লগইন করে পরীক্ষা দিন →', en: 'Log in to take the exam →' })}
                    </LinkButton>
                  ) : decision.reason === 'login-required' ? (
                    <p style={{ margin: '0 0 4px', color: '#57616A', fontSize: 14 }}>
                      {t({ bn: 'প্রবেশ করতে লগইন লাগবে — সময় হলে লগইন করে ঢুকুন।', en: 'You will need to log in to enter — log in when the time comes.' })}
                    </p>
                  ) : status === 'upcoming' ? (
                    <p style={{ margin: '0 0 4px', color: '#57616A', fontSize: 14 }}>
                      {t({ bn: 'নির্ধারিত সময়ের আগে প্রবেশ করা যাবে না।', en: 'Entry is not possible before the scheduled time.' })}
                    </p>
                  ) : (
                    <p style={{ margin: '0 0 4px', color: '#57616A', fontSize: 14 }}>
                      {t({ bn: 'এই পরীক্ষার সময় শেষ — আর প্রবেশ করা যাবে না।', en: 'This exam has ended — entry is no longer possible.' })}
                    </p>
                  )}
                  {exam.jobExamSlug ? (
                    <p style={{ margin: '10px 0 0', fontSize: 14 }}>
                      <Link to={jobLiveExamEntryPath(exam.jobExamSlug)} style={{ fontWeight: 600 }}>
                        {t({ bn: 'পরীক্ষার পাতা দেখুন →', en: 'See the exam page →' })}
                      </Link>
                    </p>
                  ) : null}
                  {status !== 'upcoming' ? (
                    <div style={{ marginTop: 12, borderTop: '1px solid #E3E8F0', paddingTop: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                        <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 15 }}>
                          {t({ bn: 'মেধাতালিকা', en: 'Merit list' })}
                        </div>
                        <button
                          type="button"
                          onClick={() => refreshMerit(exam)}
                          style={{ background: 'none', border: 'none', color: '#0A5C9E', fontWeight: 600, cursor: 'pointer', fontSize: 13, padding: 0 }}
                        >
                          {t({ bn: 'আপডেট করুন', en: 'Refresh' })}
                        </button>
                      </div>
                      {merit === undefined ? (
                        <p style={{ margin: '6px 0 0', color: '#57616A', fontSize: 14 }}>
                          {t({ bn: 'লোড হচ্ছে…', en: 'Loading…' })}
                        </p>
                      ) : merit === null ? (
                        <p style={{ margin: '6px 0 0', color: '#57616A', fontSize: 14 }}>
                          {t({ bn: 'মেধাতালিকা এখনো প্রকাশিত হয়নি।', en: 'The merit list has not been published yet.' })}
                        </p>
                      ) : (
                        <ol style={{ margin: '8px 0 0', paddingLeft: 20, fontSize: 14, lineHeight: 1.9 }}>
                          {merit.entries.slice(0, 10).map((entry) => (
                            <li key={`${entry.rank}-${entry.name}`}>
                              <strong>{entry.name}</strong>
                              {' — '}
                              {lang === 'bn'
                                ? `${entry.score}${entry.totalMarks !== null ? `/${entry.totalMarks}` : ''} নম্বর`
                                : `${entry.score}${entry.totalMarks !== null ? `/${entry.totalMarks}` : ''} marks`}
                              {entry.timeSeconds !== null ? ` · ${formatMeritTime(entry.timeSeconds, lang)}` : ''}
                            </li>
                          ))}
                        </ol>
                      )}
                      {meritError ? (
                        <p style={{ margin: '6px 0 0', color: '#8A3B2E', fontSize: 13 }}>
                          {t({ bn: 'মেধাতালিকা লোড করতে সমস্যা হয়েছে।', en: 'There was a problem loading the merit list.' })}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </Card>
              </Reveal>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
