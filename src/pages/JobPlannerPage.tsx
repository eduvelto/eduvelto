// Eduvelto — Job planner page (Step 12).
//
// /jobs/planner — a calm, advisory study plan built ONLY from
// the student's own attempts + the REAL published catalog.
// Four sections (ChatGPT's structure, adapted — Progress lives
// on /jobs/analysis + the dashboard, linked from here instead
// of duplicated):
//   1. আজকের পরিকল্পনা — 2–3 concrete items (weak-topic
//      revision + new practice), effort modes (Light /
//      Standard / Deep), the standing daily-mock row.
//   2. এই সপ্তাহ — 7 Dhaka days (today + 6), each with its
//      items + done marks + today's goal check.
//   3. রিভিশন সময়সূচি — the weak-topic queue (today /
//      tomorrow / this week / later), each with a guarded
//      practice link or an honest "no set yet" note.
//   4. দৈনিক লক্ষ্য — the profile goal + today's real
//      progress + one neutral suggestion when the goal is far
//      above the 7-day average (never auto-changed).
//
// HONESTY (Steps 7–11, binding): no invented numbers, no
// readiness % / pass probability / peer comparison / ranks,
// no "verified" claims, no exam countdown (no real exam date
// exists yet — Step 14, circulars), no fake streaks. Every
// practice link is guarded against a published bundle
// (status == 'published' + questionCount > 0). A skipped day
// is never punished: overdue items slide forward (max 2
// revision items/day), never pile up, never read "Failed".
// The planner is ADVISORY — never a mandatory timetable.
// Load errors show a retry card, never fake "no data".

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { AlertBox, Card, LinkButton, Reveal, Skeleton } from '../components/ui';
import { useAuth } from '../lib/auth';
import { useLanguage } from '../i18n/LanguageContext';
import { jobExamBySlug } from '../lib/jobExams';
import { loadTodayDailyMock } from '../lib/jobMock';
import { todayStats } from '../lib/jobDashboard';
import type { JobAttemptSummary } from '../lib/jobAnalysis';
import type { PublishedBundleRef } from '../lib/jobDashboard';
import {
  loadDashboardAttempts,
  loadPublishedBundlesForExams,
} from '../lib/jobPlannerData';
import {
  goalSuggestion,
  revisionQueue,
  todaysPlan,
  topicHealth,
  weeklyPlan,
  type EffortMode,
  type PlanDayItem,
} from '../lib/jobPlanner';

const MASTERY_BN: Record<string, string> = {
  weak: 'দুর্বল',
  moderate: 'মাঝারি',
  strong: 'ভালো',
  retained: 'ধরে আছে',
};

const MODE_BN: Record<EffortMode, string> = {
  light: 'হালকা দিন',
  standard: 'সাধারণ দিন',
  deep: 'গভীর প্রস্তুতি',
};

const KIND_BN: Record<string, string> = {
  revision: 'রিভিশন',
  'new-practice': 'নতুন অনুশীলন',
  'daily-mock': 'দৈনিক মক',
};

function PlanItemRow({ item }: { item: PlanDayItem }) {
  const { t } = useLanguage();
  return (
    <div
      style={{
        display: 'flex',
        gap: 10,
        alignItems: 'flex-start',
        padding: '10px 0',
        borderTop: '1px solid var(--border)',
      }}
    >
      <span aria-hidden style={{ fontSize: 16, lineHeight: 1.4 }}>
        {item.done ? '✓' : '○'}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 15 }}>
          {item.label}
          {item.done ? (
            <span style={{ color: 'var(--teal)', fontSize: 13, fontWeight: 600 }}> · সম্পন্ন</span>
          ) : null}
          {item.slid ? (
            <span style={{ color: 'var(--muted)', fontSize: 13, fontWeight: 400 }}> · আগের দিন থেকে এসেছে</span>
          ) : null}
        </div>
        <div style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.6, marginTop: 2 }}>
          {KIND_BN[item.kind] ?? item.kind} · {item.reasonBn}
        </div>
        {item.to ? (
          <p style={{ margin: '8px 0 0' }}>
            <LinkButton to={item.to} variant="accent">
              {t({ bn: 'শুরু করুন →', en: 'Start →' })}
            </LinkButton>
          </p>
        ) : (
          <p style={{ margin: '8px 0 0', color: 'var(--muted)', fontSize: 13, lineHeight: 1.6 }}>
            {t({
              bn: 'এই টপিকের অনুশীলন সেট এখনো তৈরি হয়নি — সেট প্রকাশিত হলে এখান থেকেই শুরু করা যাবে।',
              en: 'No practice set exists for this topic yet — once one is published, you can start it from here.',
            })}
          </p>
        )}
      </div>
    </div>
  );
}

export default function JobPlannerPage() {
  const { user, profile, loading } = useAuth();
  const { t } = useLanguage();
  const [mode, setMode] = useState<EffortMode>('standard');
  const [attempts, setAttempts] = useState<JobAttemptSummary[] | null>(null);
  const [capped, setCapped] = useState(false);
  const [publishedByExam, setPublishedByExam] = useState<Map<string, PublishedBundleRef[]>>(new Map());
  const [dailyMockDocId, setDailyMockDocId] = useState<string | null>(null);
  const [dataError, setDataError] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);

  const targetExamSlug = profile?.targetExam ?? null;
  const targetExamDef = targetExamSlug ? jobExamBySlug(targetExamSlug) : undefined;

  useEffect(() => {
    let alive = true;
    setDataError(false);
    loadTodayDailyMock()
      .then((m) => {
        if (alive) setDailyMockDocId(m ? m.docId : null);
      })
      .catch(() => {
        if (alive) setDailyMockDocId(null);
      });
    if (!user) {
      setAttempts([]);
      return () => {
        alive = false;
      };
    }
    (async () => {
      try {
        const { attempts: loaded, capped: wasCapped } = await loadDashboardAttempts(user.uid);
        if (!alive) return;
        setAttempts(loaded);
        setCapped(wasCapped);
        const exams = [...new Set([...loaded.map((a) => a.examSlug), targetExamSlug].filter(Boolean))] as string[];
        const bundles = await loadPublishedBundlesForExams(exams);
        if (!alive) return;
        setPublishedByExam(bundles);
      } catch {
        if (alive) {
          setAttempts([]);
          setDataError(true);
        }
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, targetExamSlug, retryNonce]);

  // ---- Derived plan (pure, from the loaded attempts) ----
  const nowMs = Date.now();
  const health = useMemo(() => (attempts ? topicHealth(attempts, nowMs) : []), [attempts]);
  const queue = useMemo(
    () => revisionQueue({ health, publishedByExam, targetExamSlug, nowMs }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [health, publishedByExam, targetExamSlug],
  );
  const week = useMemo(
    () =>
      weeklyPlan({
        attempts: attempts ?? [],
        health,
        queue,
        publishedByExam,
        targetExamSlug,
        dailyGoalQuestions: profile?.dailyGoalQuestions ?? null,
        dailyMockDocId,
        nowMs,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [attempts, health, queue, publishedByExam, targetExamSlug, profile?.dailyGoalQuestions, dailyMockDocId],
  );
  const today = useMemo(() => todaysPlan(week, mode), [week, mode]);
  const todayStatsValue = useMemo(() => (attempts ? todayStats(attempts, nowMs) : null), [attempts, nowMs]);
  const suggestion = useMemo(
    () =>
      attempts
        ? goalSuggestion({ attempts, dailyGoalQuestions: profile?.dailyGoalQuestions ?? null, nowMs })
        : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [attempts, profile?.dailyGoalQuestions],
  );

  const dueToday = queue.filter((q) => q.dueBucket === 'today');
  const dueTomorrow = queue.filter((q) => q.dueBucket === 'tomorrow');
  const dueThisWeek = queue.filter((q) => q.dueBucket === 'this-week');
  // 'Later' = everything the week could not place (due beyond
  // this week, or no free revision slot in 7 days) — the queue's
  // own 'later' items are already inside week.laterRevisions,
  // so they are not listed twice.
  const dueLater = week.laterRevisions;

  if (loading) {
    return (
      <PageShell titleBn="প্ল্যানার" titleEn="Planner" wide>
        <Skeleton />
      </PageShell>
    );
  }

  if (!user) {
    return (
      <PageShell titleBn="প্ল্যানার" titleEn="Planner" wide>
        <Card>
          <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 17 }}>
            {t({ bn: 'প্ল্যানার দেখতে লগইন করুন', en: 'Log in to see your planner' })}
          </div>
          <p style={{ margin: '8px 0 12px', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
            {t({
              bn: 'প্ল্যানার আপনার নিজের অনুশীলনের ওপর তৈরি — তাই শুধু লগইন করা শিক্ষার্থীরা দেখতে পারেন।',
              en: 'The planner is built from your own practice, so only signed-in students can see it.',
            })}
          </p>
          <Link to="/login" style={{ fontWeight: 600 }}>
            {t({ bn: 'লগইন করুন →', en: 'Log in →' })}
          </Link>
        </Card>
      </PageShell>
    );
  }

  if (dataError) {
    return (
      <PageShell titleBn="প্ল্যানার" titleEn="Planner" wide>
        <AlertBox tone="error">
          {t({ bn: 'প্ল্যানার লোড করা যায়নি — ইন্টারনেট দেখে আবার চেষ্টা করুন।', en: 'The planner could not be loaded — check your connection and try again.' })}
        </AlertBox>
        <p style={{ marginTop: 16 }}>
          <button
            type="button"
            onClick={() => setRetryNonce((n) => n + 1)}
            style={{ fontWeight: 600, background: 'none', border: 'none', padding: 0, color: 'var(--accent)', cursor: 'pointer', fontSize: 15 }}
          >
            {t({ bn: 'আবার চেষ্টা করুন', en: 'Try again' })}
          </button>
        </p>
      </PageShell>
    );
  }

  return (
    <PageShell titleBn="প্ল্যানার" titleEn="Planner" wide>
      <p style={{ margin: '0 0 16px', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
        {t({
          bn: 'প্ল্যানার পরামর্শমূলক — বাধ্যতামূলক সময়সূচি নয়। আপনার নিজের অনুশীলন আর প্রকাশিত সেটের ওপর তৈরি; কোনো দিন না পারলে কোনো শাস্তি নেই, বাকি কাজ পরের দিনে চলে যায়।',
          en: 'The planner is a suggestion, not a mandatory timetable. It is built from your own practice and the published sets; if a day does not work out, there is no punishment — the remaining work moves to the next day.',
        })}
      </p>
      {targetExamDef ? (
        <p style={{ margin: '0 0 16px', color: 'var(--muted-ivory)', fontSize: 14 }}>
          {t({ bn: `লক্ষ্য পরীক্ষা: ${targetExamDef.bn}`, en: `Target exam: ${targetExamDef.en}` })}{' '}
          <Link to="/profile" style={{ fontWeight: 600, fontSize: 14 }}>
            {t({ bn: 'বদলান →', en: 'Change →' })}
          </Link>
        </p>
      ) : (
        <p style={{ margin: '0 0 16px', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
          {t({
            bn: 'লক্ষ্য পরীক্ষা এখনো বেছে নেওয়া হয়নি — প্রোফাইল থেকে বেছে নিলে সপ্তাহের পরিকল্পনা সেই পরীক্ষার ওপর সাজবে।',
            en: 'No target exam picked yet — pick one in your profile and the weekly plan will be built around it.',
          })}{' '}
          <Link to="/profile" style={{ fontWeight: 600 }}>
            {t({ bn: 'লক্ষ্য পরীক্ষা বেছে নিন →', en: 'Pick a target exam →' })}
          </Link>
        </p>
      )}
      {week.carriedOver ? (
        <p style={{ margin: '0 0 16px', color: 'var(--muted-ivory)', fontSize: 14, lineHeight: 1.7 }}>
          {t({
            bn: 'আগের পরিকল্পনার বাকি রিভিশন আজকের তালিকায় চলে এসেছে — কোনো শাস্তি নেই, নিজের সময়মতো করুন।',
            en: 'The remaining revision from the earlier plan moved into today’s list — no punishment, do it in your own time.',
          })}
        </p>
      ) : null}
      {capped ? (
        <p style={{ margin: '0 0 16px', color: 'var(--muted)', fontSize: 13, lineHeight: 1.6 }}>
          {t({
            bn: 'পরিকল্পনাটি আপনার সাম্প্রতিক চেষ্টাগুলোর ওপর তৈরি (সর্বোচ্চ ২০টি অনুশীলন + ২০টি মক)।',
            en: 'This plan is built from your most recent attempts (at most 20 practices + 20 mocks).',
          })}
        </p>
      ) : null}

      {/* ============ আজকের পরিকল্পনা ============ */}
      <Reveal>
        <Card>
          <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 17 }}>
            {t({ bn: 'আজকের পরিকল্পনা', en: "Today's plan" })}
          </div>
          {attempts === null ? (
            <p style={{ margin: '8px 0 0', color: 'var(--muted)', fontSize: 14 }}>লোড হচ্ছে…</p>
          ) : attempts.length === 0 ? (
            <p style={{ margin: '8px 0 10px', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
              {t({
                bn: 'আপনি এখনো কোনো অনুশীলন করেননি — নিচের নতুন অনুশীলন দিয়ে শুরু করুন। প্রথম অনুশীলনের পর রিভিশন তালিকা তৈরি হবে।',
                en: 'You have not practised yet — start with the new practice below. The revision list will appear after your first practice.',
              })}
            </p>
          ) : (
            <p style={{ margin: '8px 0 0', color: 'var(--muted-ivory)', fontSize: 14 }}>
              {t({
                bn: `আজ ${today.doneCount}/${today.totalCount}টি কাজ শেষ হয়েছে।`,
                en: `${today.doneCount}/${today.totalCount} of today's items are done.`,
              })}
            </p>
          )}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
            {(['light', 'standard', 'deep'] as EffortMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                aria-pressed={mode === m}
                style={{
                  padding: '8px 14px',
                  borderRadius: 20,
                  border: mode === m ? '2px solid var(--teal)' : '1px solid var(--border)',
                  background: mode === m ? 'var(--surface-muted)' : 'transparent',
                  color: 'var(--heading)',
                  fontWeight: mode === m ? 700 : 400,
                  cursor: 'pointer',
                  fontSize: 14,
                }}
              >
                {MODE_BN[m]}
              </button>
            ))}
          </div>
          <p style={{ margin: '8px 0 0', color: 'var(--muted)', fontSize: 13, lineHeight: 1.6 }}>
            {mode === 'light'
              ? t({ bn: 'হালকা দিন: শুধু ১টি কাজ — ব্যস্ত দিনেও পরিকল্পনা ভাঙে না।', en: 'Light day: just 1 item — the plan does not break on a busy day.' })
              : mode === 'deep'
                ? t({ bn: 'গভীর প্রস্তুতি: সাধারণ দিনের কাজ + ১টি বাড়তি অনুশীলন।', en: 'Deep prep: the standard day’s work + 1 extra practice.' })
                : t({ bn: 'সাধারণ দিন: রিভিশন (সর্বোচ্চ ২টি) + ১টি নতুন অনুশীলন।', en: 'Standard day: revision (at most 2) + 1 new practice.' })}
          </p>
          {attempts !== null && today.items.length === 0 && today.extraItem === null ? (
            <p style={{ margin: '12px 0 0', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
              {t({
                bn: 'আজকের কাজ শেষ — নতুন কিছু করার থাকলে সপ্তাহের পরিকল্পনা দেখুন।',
                en: 'Today’s work is done — see the weekly plan for anything else.',
              })}
            </p>
          ) : null}
          {today.items.map((item, i) => (
            <PlanItemRow key={`${item.kind}-${item.topicId ?? item.label}-${i}`} item={item} />
          ))}
          {today.extraItem ? <PlanItemRow item={today.extraItem} /> : null}
          {today.mockItem ? <PlanItemRow item={today.mockItem} /> : null}
        </Card>
      </Reveal>

      {/* ============ এই সপ্তাহ ============ */}
      <div style={{ marginTop: 20 }}>
        <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 17, marginBottom: 10 }}>
          {t({ bn: 'এই সপ্তাহ', en: 'This week' })}
        </div>
        {week.targetHasNoSets && targetExamDef ? (
          <p style={{ margin: '0 0 12px', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
            {t({
              bn: `${targetExamDef.bn}-এর কোনো প্রকাশিত অনুশীলন সেট এখনো নেই — সেট প্রকাশিত হলে সপ্তাহের পরিকল্পনায় নতুন অনুশীলন আসবে।`,
              en: `No published practice set exists for ${targetExamDef.en} yet — once sets are published, new practice will appear in the weekly plan.`,
            })}
          </p>
        ) : null}
        {week.noNewSetsLeft ? (
          <p style={{ margin: '0 0 12px', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
            {t({
              bn: 'এই পরীক্ষার সব প্রকাশিত সেট অন্তত একবার করা হয়েছে — নতুন সেট প্রকাশিত হলে এখানে আসবে।',
              en: 'Every published set for this exam has been attempted at least once — new sets will appear here once published.',
            })}
          </p>
        ) : null}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
          {week.days.map((day) => (
            <Reveal key={day.dayKey}>
              <Card>
                <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 16 }}>
                  {day.labelBn}
                  {day.isToday ? (
                    <span style={{ color: 'var(--teal)', fontSize: 13, fontWeight: 600 }}> · আজ</span>
                  ) : null}
                </div>
                <p style={{ margin: '6px 0 0', color: 'var(--muted)', fontSize: 13, lineHeight: 1.6 }}>
                  {day.isToday
                    ? t({
                        bn: `আজ ${day.questionsDone}টি প্রশ্ন · ${day.sessionsDone}টি সেশন`,
                        en: `Today: ${day.questionsDone} questions · ${day.sessionsDone} sessions`,
                      })
                    : day.sessionsDone > 0
                      ? t({
                          bn: `${day.questionsDone}টি প্রশ্ন · ${day.sessionsDone}টি সেশন`,
                          en: `${day.questionsDone} questions · ${day.sessionsDone} sessions`,
                        })
                      : t({
                          bn: `পরিকল্পিত: ${day.items.length}টি কাজ`,
                          en: `Planned: ${day.items.length} items`,
                        })}
                  {day.goalMet === true
                    ? t({ bn: ' · লক্ষ্য পূরণ হয়েছে', en: ' · goal met' })
                    : day.goalMet === false
                      ? t({ bn: ' · লক্ষ্য এখনো বাকি', en: ' · goal still open' })
                      : ''}
                </p>
                <ul style={{ margin: '10px 0 0', paddingLeft: 18, fontSize: 14, lineHeight: 1.9, color: 'var(--heading)' }}>
                  {day.items.map((item, i) => (
                    <li key={`${item.kind}-${item.topicId ?? item.label}-${i}`}>
                      {item.done ? '✓ ' : ''}
                      {item.label}
                      {item.kind === 'revision' ? ` (${t({ bn: 'রিভিশন', en: 'revision' })})` : ''}
                    </li>
                  ))}
                </ul>
                {day.items.length === 0 ? (
                  <p style={{ margin: '10px 0 0', color: 'var(--muted)', fontSize: 14 }}>
                    {t({ bn: 'এই দিনে কোনো কাজ নির্ধারিত নেই।', en: 'Nothing scheduled for this day.' })}
                  </p>
                ) : null}
              </Card>
            </Reveal>
          ))}
        </div>
      </div>

      {/* ============ রিভিশন সময়সূচি ============ */}
      <div id="revision" style={{ marginTop: 20 }}>
        <Reveal>
          <Card>
            <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 17 }}>
              {t({ bn: 'রিভিশন সময়সূচি', en: 'Revision schedule' })}
            </div>
            <p style={{ margin: '8px 0 0', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
              {t({
                bn: 'দুর্বল টপিকের পুনরাবৃত্তি — দুর্বল হলে ১ দিন, মাঝারি হলে ৪ দিন, ভালো হলে ১৪ দিন, ধরে থাকলে ৩০ দিন পর। ৫টির কম প্রশ্নের টপিক এখানে আসে না — নমুনা ছোট হলে সিদ্ধান্ত নেওয়া যায় না।',
                en: 'Repeating weak topics — 1 day later when weak, 4 days when moderate, 14 days when good, 30 days when retained. Topics with fewer than 5 questions do not appear here — a small sample cannot decide.',
              })}
            </p>
            {attempts === null ? (
              <p style={{ margin: '12px 0 0', color: 'var(--muted)', fontSize: 14 }}>লোড হচ্ছে…</p>
            ) : queue.length === 0 ? (
              <p style={{ margin: '12px 0 0', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
                {attempts.length === 0
                  ? t({
                      bn: 'এখনো কোনো অনুশীলন করেননি — প্রথম অনুশীলনের পর রিভিশন তালিকা তৈরি হবে।',
                      en: 'You have not practised yet — the revision list will appear after your first practice.',
                    })
                  : t({
                      bn: 'রিভিশনের মতো দুর্বল টপিক এখন নেই — নতুন টপিকের অনুশীলন চালিয়ে যান।',
                      en: 'No weak topics need revision right now — keep practising new topics.',
                    })}
              </p>
            ) : (
              <>
                {[
                  { bucket: 'today' as const, headingBn: 'আজ', headingEn: 'Today', items: dueToday },
                  { bucket: 'tomorrow' as const, headingBn: 'আগামীকাল', headingEn: 'Tomorrow', items: dueTomorrow },
                  { bucket: 'this-week' as const, headingBn: 'এই সপ্তাহে', headingEn: 'This week', items: dueThisWeek },
                  { bucket: 'later' as const, headingBn: 'পরে', headingEn: 'Later', items: dueLater },
                ].map((group) =>
                  group.items.length > 0 ? (
                    <div key={group.bucket} style={{ marginTop: 14 }}>
                      <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 15 }}>
                        {t({ bn: group.headingBn, en: group.headingEn })}
                      </div>
                      {group.items.map((item) => (
                        <div
                          key={item.topicId}
                          style={{ padding: '8px 0', borderTop: '1px solid var(--border)', fontSize: 14, lineHeight: 1.7 }}
                        >
                          <span style={{ fontWeight: 700, color: 'var(--heading)' }}>{item.label}</span>
                          <span style={{ color: 'var(--muted)' }}>
                            {' · '}
                            {MASTERY_BN[item.mastery] ?? item.mastery} · {t({ bn: `সঠিক উত্তরের হার ${item.accuracy}%`, en: `accuracy ${item.accuracy}%` })}
                            {` (${item.total}টি প্রশ্ন)`}
                          </span>
                          {item.bundleDocId ? (
                            <span>
                              {' · '}
                              <Link to={`/jobs/practice/${item.bundleDocId}`} style={{ fontWeight: 600 }}>
                                {t({ bn: 'অনুশীলন করুন →', en: 'Practise →' })}
                              </Link>
                            </span>
                          ) : (
                            <span style={{ color: 'var(--muted)' }}>
                              {' · '}
                              {t({ bn: 'অনুশীলন সেট এখনো তৈরি হয়নি', en: 'No practice set yet' })}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : null,
                )}
              </>
            )}
          </Card>
        </Reveal>
      </div>

      {/* ============ দৈনিক লক্ষ্য ============ */}
      <div style={{ marginTop: 20 }}>
        <Reveal>
          <Card>
            <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 17 }}>
              {t({ bn: 'দৈনিক লক্ষ্য', en: 'Daily goal' })}
            </div>
            {profile?.dailyGoalQuestions == null && profile?.dailyGoalMinutes == null ? (
              <>
                <p style={{ margin: '8px 0 10px', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
                  {t({
                    bn: 'দৈনিক লক্ষ্য এখনো ঠিক করা হয়নি — প্রশ্নের সংখ্যা বা মিনিট ঠিক করুন।',
                    en: 'No daily goal set yet — set a question count or minutes.',
                  })}
                </p>
                <LinkButton to="/profile" variant="outline">
                  {t({ bn: 'লক্ষ্য ঠিক করুন →', en: 'Set a goal →' })}
                </LinkButton>
              </>
            ) : profile.dailyGoalQuestions != null ? (
              <>
                <p style={{ margin: '8px 0 10px', color: 'var(--muted-ivory)', fontSize: 14, lineHeight: 1.7 }}>
                  {t({
                    bn: `আজ ${todayStatsValue?.questionsToday ?? 0}/${profile.dailyGoalQuestions}টি প্রশ্ন`,
                    en: `Today ${todayStatsValue?.questionsToday ?? 0}/${profile.dailyGoalQuestions} questions`,
                  })}
                </p>
                {suggestion ? (
                  <p style={{ margin: '0 0 10px', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
                    {t({
                      bn: `গত ৭ দিনে গড়ে ${suggestion.avgQuestionsPerDay}টি প্রশ্ন/দিন হয়েছে (${suggestion.activeDays} দিন সক্রিয়)। লক্ষ্য ${suggestion.goal}টি — চাইলে প্রোফাইল থেকে কমিয়ে নিতে পারেন, বাধ্যতামূলক নয়।`,
                      en: `Over the last 7 days you averaged ${suggestion.avgQuestionsPerDay} questions/day (${suggestion.activeDays} active days). Your goal is ${suggestion.goal} — you can lower it in your profile if you like; it is not required.`,
                    })}
                  </p>
                ) : null}
                <p style={{ margin: 0 }}>
                  <Link to="/profile" style={{ fontWeight: 600, fontSize: 14 }}>
                    {t({ bn: 'লক্ষ্য বদলান →', en: 'Change goal →' })}
                  </Link>
                </p>
              </>
            ) : (
              <>
                <p style={{ margin: '8px 0 10px', color: 'var(--muted-ivory)', fontSize: 14, lineHeight: 1.7 }}>
                  {t({
                    bn: `মিনিটের লক্ষ্য: ${profile.dailyGoalMinutes} মিনিট। মিনিটের নির্ভরযোগ্য হিসাব এখনো নেই — আজ ${todayStatsValue?.sessionsToday ?? 0}টি সেশন সম্পন্ন হয়েছে।`,
                    en: `Minutes goal: ${profile.dailyGoalMinutes} minutes. Reliable minute tracking is not available yet — ${todayStatsValue?.sessionsToday ?? 0} session(s) completed today.`,
                  })}
                </p>
                <LinkButton to="/profile" variant="outline">
                  {t({ bn: 'লক্ষ্য বদলান →', en: 'Change goal →' })}
                </LinkButton>
              </>
            )}
          </Card>
        </Reveal>
      </div>

      <p style={{ marginTop: 20, fontSize: 14 }}>
        <Link to="/jobs/dashboard" style={{ fontWeight: 600 }}>
          {t({ bn: '← ড্যাশবোর্ডে ফিরুন', en: '← Back to the dashboard' })}
        </Link>
        {' · '}
        <Link to="/jobs/analysis" style={{ fontWeight: 600 }}>
          {t({ bn: 'ফলাফল বিশ্লেষণ দেখুন →', en: 'See result analysis →' })}
        </Link>
      </p>
    </PageShell>
  );
}
