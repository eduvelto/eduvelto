// Eduvelto — Common preparation hub (master plan B-1.3, structure only).
//
// /jobs/common: the shared preparation space for the 4 main exams
// (BCS, Bank, Primary Teacher, NTRCA). Four cards, all Coming Soon:
// today's daily short mock, this week's full mock (cycle), the common
// topic list, and my progress. NO questions, NO live mocks — the
// cards describe what will run, with the design rules from the plan.
//
// Design rules shown (design plan §4, proposed defaults for §7.3/§7.4):
// daily mock 20–30 MCQ in 20–30 minutes, topic rotation, negative
// marking follows that day's cycle exam (BCS day −0.50, Primary/NTRCA
// day −0.25; Bank day: negative marking off — circular verification
// pending, matching the Step 8 engine decision); weekly full mock
// cycles BCS → Bank → Primary → NTRCA, each in its exam's real
// pattern. The 9 common topics rotate in ~9 days, not in a week.
// The topic map is PRELIMINARY (B-10.1 finalises it); the ~50 per
// topic is a TARGET, not a count — no common-topic questions are
// published yet (the first bank batch is 35 BCS English questions,
// served once practice ships).
//
// Step 9: the daily + weekly cards are LIVE — they read today's
// daily mock and this week's weekly mock (date-derived doc-IDs)
// and show "মক শুরু করুন" when published, the honest "not yet"
// state when not. The publish TIME is the admin's: a mock appears
// here only after a Moderator publishes it.

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { Card, Chip, LinkButton, Reveal } from '../components/ui';
import { useAuth } from '../lib/auth';
import { useLanguage } from '../i18n/LanguageContext';
import {
  COMMON_TOPICS,
  COMMON_TOPIC_QUESTION_TARGET,
  DAILY_MOCK,
  WEEKLY_MOCK_CYCLE,
  jobExamBySlug,
} from '../lib/jobExams';
import { loadThisWeekWeeklyMock, loadTodayDailyMock, listMockAttempts, type MockAttemptWithId } from '../lib/jobMock';
import { jobMockPatternSummaryBn, type JobMockWithId } from '../lib/jobMocks';
import { jobTopicLabelBn, weakTopicsFromAttemptAnswers, type JobAttemptAnswer } from '../lib/jobEngine';

/** Weekly full-mock pattern per cycle exam (design plan §4.2). */
const WEEKLY_PATTERN: Record<string, { bn: string; en: string }> = {
  bcs: { bn: '২০০ MCQ · ২ ঘণ্টা · ভুলে −০.৫০', en: '200 MCQs · 2 hours · −0.50 per wrong answer' },
  bank: { bn: '১০০ MCQ · ১ ঘণ্টা · নেগেটিভ মার্কিং বিজ্ঞপ্তি অনুযায়ী', en: '100 MCQs · 1 hour · negative marking as per circular' },
  'primary-teacher': { bn: '৯০ MCQ · ৯০ মিনিট · ভুলে −০.২৫', en: '90 MCQs · 90 minutes · −0.25 per wrong answer' },
  ntrca: { bn: '১০০ MCQ · ১ ঘণ্টা · ভুলে −০.২৫', en: '100 MCQs · 1 hour · −0.25 per wrong answer' },
};

export default function JobsCommonPage() {
  const { lang, t } = useLanguage();
  const { user } = useAuth();
  const cycle = WEEKLY_MOCK_CYCLE.map((s) => jobExamBySlug(s)!).filter(Boolean);

  // Step 9: today's daily + this week's weekly mock, live.
  // Null = never published (honest "not yet", never a substitute).
  // D2: these load for EVERYONE — a signed-out visitor must see
  // that today's mock exists (with a login link), not a login wall
  // that hides it. Only starting needs sign-in.
  const [daily, setDaily] = useState<JobMockWithId | null>(null);
  const [weekly, setWeekly] = useState<JobMockWithId | null>(null);
  const [mocksLoaded, setMocksLoaded] = useState(false);
  // D6: the student's own mock history, for the progress card.
  // null = not loaded yet (signed-in only — attempts are private).
  const [attempts, setAttempts] = useState<MockAttemptWithId[] | null>(null);
  useEffect(() => {
    let alive = true;
    Promise.all([loadTodayDailyMock(), loadThisWeekWeeklyMock()])
      .then(([d, w]) => {
        if (!alive) return;
        setDaily(d);
        setWeekly(w);
        setMocksLoaded(true);
      })
      .catch(() => {
        if (alive) setMocksLoaded(true);
      });
    if (user) {
      listMockAttempts(user.uid, 10)
        .then((list) => {
          if (alive) setAttempts(list);
        })
        .catch(() => {
          if (alive) setAttempts([]);
        });
    } else {
      setAttempts([]);
    }
    return () => {
      alive = false;
    };
  }, [user]);

  // D6: progress from the student's own attempts (loaded above).
  // Weak topics aggregate across their mock attempts; the labels
  // use the same resolver as the result page (D7).
  const allAttemptAnswers: JobAttemptAnswer[] =
    attempts?.flatMap((a) => (Array.isArray(a.answers) ? (a.answers as JobAttemptAnswer[]) : [])) ?? [];
  const weakTopics = weakTopicsFromAttemptAnswers(allAttemptAnswers).slice(0, 2);
  const latestAttempt = attempts && attempts.length > 0 ? attempts[0] : null;

  return (
    <PageShell titleBn="কমন প্রস্তুতি" titleEn="Common Preparation" wide hideTitle maxWidth={1240}>
      <p style={{ margin: '0 0 12px' }}>
        <Link to="/jobs" style={{ fontWeight: 600 }}>
          {t({ bn: '← চাকরির প্রস্তুতি', en: '← Job Preparation' })}
        </Link>
      </p>

      {/* Hero — amber identity for the common hub. */}
      <section
        className="ev-class-hero"
        style={{ background: '#8A6100' }}
        aria-label={t({ bn: 'কমন প্রস্তুতি', en: 'Common Preparation' })}
      >
        <h2
          style={{
            fontFamily: "'Poppins','Hind Siliguri',system-ui,sans-serif",
            fontSize: 26,
            lineHeight: 1.3,
            margin: '0 0 4px',
            color: '#fff',
          }}
        >
          {t({ bn: 'কমন প্রস্তুতি — একবার পড়লেই চার পরীক্ষায় কাজে লাগবে', en: 'Common Preparation — study once, use in four exams' })}
        </h2>
        <p style={{ margin: 0, color: 'rgba(255,255,255,0.92)', fontSize: 15, lineHeight: 1.7 }}>
          {t({
            bn: 'BCS, ব্যাংক, প্রাথমিক শিক্ষক ও NTRCA — এই ৪টি পরীক্ষায় যে টপিকগুলো কমন, সেগুলোর অনুশীলন ও নিয়মিত মক টেস্ট এখানে থাকবে।',
            en: 'BCS, Bank, Primary Teacher and NTRCA — practice and regular mock tests for the topics common to these 4 exams will live here.',
          })}
        </p>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12, marginBottom: 20 }}>
        {/* Today's daily short mock — live (Step 9): starts when
            today's mock is published, honest "not yet" otherwise. */}
        <Reveal delayMs={0}>
          <Card>
            <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 17 }}>
              {t({ bn: 'আজকের দৈনিক মক', en: "Today's daily mock" })}
            </div>
            <p style={{ margin: '8px 0', color: '#57616A', fontSize: 14, lineHeight: 1.7 }}>
              {t({ bn: DAILY_MOCK.sizeBn, en: DAILY_MOCK.sizeEn })} · {t({ bn: DAILY_MOCK.timeBn, en: DAILY_MOCK.timeEn })}
            </p>
            <p style={{ margin: '0 0 10px', color: '#68747B', fontSize: 14, lineHeight: 1.7 }}>
              {t({
                // D5: the Bank day was omitted from the negative-marking
                // sentence, and the rotation is ~9 days for 9 topics,
                // not "in a week" (front-ends audit, same finding).
                bn: 'প্রতিদিন ভিন্ন টপিক — ৯টি কমন টপিক প্রায় ৯ দিনে ঘুরে আসে। নেগেটিভ মার্কিং ওই দিনের চক্রের পরীক্ষার নিয়মে হবে (BCS-র দিনে −০.৫০, প্রাথমিক/NTRCA-র দিনে −০.২৫; ব্যাংকের দিনে নেগেটিভ মার্কিং বন্ধ — বিজ্ঞপ্তি যাচাই বাকি)।',
                en: 'A different topic every day — the 9 common topics rotate through in about 9 days. Negative marking follows that day’s cycle exam (BCS day −0.50, Primary/NTRCA day −0.25; Bank day: negative marking off — circular verification pending).',
              })}
            </p>
            {!mocksLoaded ? (
              <p style={{ margin: 0, color: '#68747B', fontSize: 14 }}>লোড হচ্ছে…</p>
            ) : daily ? (
              <>
                <p style={{ margin: '0 0 10px', color: '#57616A', fontSize: 14, lineHeight: 1.7 }}>
                  {daily.titleBn} · {jobMockPatternSummaryBn(daily.rulesSnapshot)}
                </p>
                {user ? (
                  <LinkButton to={`/jobs/mock/${daily.docId}`} variant="accent">
                    {t({ bn: 'আজকের মক শুরু করুন →', en: "Start today's mock →" })}
                  </LinkButton>
                ) : (
                  <p style={{ margin: 0 }}>
                    <Link to="/login" style={{ fontWeight: 600 }}>
                      {t({ bn: 'লগইন করে মক দিন →', en: 'Log in to take the mock →' })}
                    </Link>
                  </p>
                )}
              </>
            ) : (
              <Chip tone="gold">{t({ bn: 'আজকের মক এখনো প্রকাশিত হয়নি', en: "Today's mock is not published yet" })}</Chip>
            )}
          </Card>
        </Reveal>

        {/* This week's full mock — weekly cycle, live (Step 9). */}
        <Reveal delayMs={80}>
          <Card>
            <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 17 }}>
              {t({ bn: 'এই সপ্তাহের পূর্ণ মক', en: "This week's full mock" })}
            </div>
            <p style={{ margin: '8px 0', color: '#57616A', fontSize: 14, lineHeight: 1.7 }}>
              {t({ bn: 'প্রতি সপ্তাহে ১টি পূর্ণ মক — চক্রাকারে:', en: 'One full mock every week — rotating:' })}
            </p>
            <ul style={{ margin: '0 0 10px', paddingLeft: 20, color: '#57616A', fontSize: 14, lineHeight: 1.9 }}>
              {cycle.map((def) => (
                <li key={def.slug}>
                  <strong style={{ color: '#142B3B' }}>{lang === 'bn' ? def.bn : def.en}</strong> —{' '}
                  {t({ bn: WEEKLY_PATTERN[def.slug].bn, en: WEEKLY_PATTERN[def.slug].en })}
                </li>
              ))}
            </ul>
            {!mocksLoaded ? (
              <p style={{ margin: 0, color: '#68747B', fontSize: 14 }}>লোড হচ্ছে…</p>
            ) : weekly ? (
              <>
                <p style={{ margin: '0 0 10px', color: '#57616A', fontSize: 14, lineHeight: 1.7 }}>
                  {weekly.titleBn} · {jobMockPatternSummaryBn(weekly.rulesSnapshot)}
                </p>
                {user ? (
                  <LinkButton to={`/jobs/mock/${weekly.docId}`} variant="accent">
                    {t({ bn: 'এই সপ্তাহের মক শুরু করুন →', en: "Start this week's mock →" })}
                  </LinkButton>
                ) : (
                  <p style={{ margin: 0 }}>
                    <Link to="/login" style={{ fontWeight: 600 }}>
                      {t({ bn: 'লগইন করে মক দিন →', en: 'Log in to take the mock →' })}
                    </Link>
                  </p>
                )}
              </>
            ) : (
              <Chip tone="gold">{t({ bn: 'এই সপ্তাহের মক এখনো প্রকাশিত হয়নি', en: "This week's mock is not published yet" })}</Chip>
            )}
          </Card>
        </Reveal>

        {/* My progress — data-driven (D6): real history when the
            student has taken mocks; the honest "no mock yet" copy
            only when they truly have taken none. */}
        <Reveal delayMs={160}>
          <Card>
            <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 17 }}>
              {t({ bn: 'আমার অগ্রগতি', en: 'My progress' })}
            </div>
            {!user ? (
              <p style={{ margin: '8px 0 0' }}>
                <Link to="/login" style={{ fontWeight: 600 }}>
                  {t({ bn: 'লগইন করে অগ্রগতি দেখুন →', en: 'Log in to see your progress →' })}
                </Link>
              </p>
            ) : attempts === null ? (
              <p style={{ margin: '8px 0 0', color: '#68747B', fontSize: 14 }}>লোড হচ্ছে…</p>
            ) : attempts.length === 0 ? (
              <>
                <p style={{ margin: '8px 0 10px', color: '#68747B', fontSize: 14, lineHeight: 1.7 }}>
                  {t({
                    bn: 'এখনো কোনো দৈনিক বা সাপ্তাহিক মক দেওয়া হয়নি — মক দিলে ইতিহাস, দুর্বল টপিক ও ধারাবাহিকতা এখানে দেখাবে।',
                    en: 'No daily or weekly mock has been taken yet — once you take a mock, history, weak topics and streak will show here.',
                  })}
                </p>
                <Chip tone="gold">{t({ bn: 'শীঘ্রই আসছে', en: 'Coming soon' })}</Chip>
              </>
            ) : (
              <>
                <p style={{ margin: '8px 0 10px', color: '#57616A', fontSize: 14, lineHeight: 1.7 }}>
                  {t({ bn: `মোট ${attempts.length}টি মক দেওয়া হয়েছে`, en: `${attempts.length} mock(s) taken` })}
                  {latestAttempt && typeof latestAttempt.score === 'number' && typeof latestAttempt.totalMarks === 'number'
                    ? t({ bn: ` · সর্বশেষ: ${latestAttempt.score}/${latestAttempt.totalMarks} নম্বর`, en: ` · Latest: ${latestAttempt.score}/${latestAttempt.totalMarks}` })
                    : ''}
                </p>
                {weakTopics.length > 0 ? (
                  <p style={{ margin: '0 0 10px', color: '#68747B', fontSize: 14, lineHeight: 1.7 }}>
                    {t({ bn: 'দুর্বল টপিক: ', en: 'Weak topics: ' })}
                    {weakTopics.map((w) => `${jobTopicLabelBn(w.topicId)} (${w.wrong}/${w.total} ভুল)`).join(' · ')}
                  </p>
                ) : null}
                {latestAttempt ? (
                  <p style={{ margin: 0 }}>
                    <Link to={`/jobs/result/${latestAttempt.docId}`} style={{ fontWeight: 600 }}>
                      {t({ bn: 'সর্বশেষ ফলাফল দেখুন →', en: 'See the latest result →' })}
                    </Link>
                  </p>
                ) : null}
              </>
            )}
          </Card>
        </Reveal>
      </div>

      {/* Common topics — preliminary map, target only, 0 questions published. */}
      <Reveal>
        <h3 className="ev-section-h2">{t({ bn: 'কমন টপিক', en: 'Common topics' })}</h3>
      </Reveal>
      <p style={{ color: '#57616A', margin: '-8px 0 14px', fontSize: 14, lineHeight: 1.7 }}>
        {t({
          bn: 'প্রাথমিক তালিকা — ৪টি পরীক্ষার অফিসিয়াল সিলেবাস মিলিয়ে চূড়ান্ত হবে। প্রতি টপিকে লক্ষ্য ~৫০টি প্রশ্ন। কমন টপিকের কোনো প্রশ্ন এখনো প্রকাশিত হয়নি।',
          en: 'Preliminary list — to be finalised against the 4 exams’ official syllabuses. Target ~50 questions per topic. No common-topic questions are published yet.',
        })}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12, marginBottom: 20 }}>
        {COMMON_TOPICS.map((topic, i) => (
          <Reveal key={topic.bn} delayMs={Math.min(i, 5) * 60}>
            <Card>
              <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 16 }}>{t({ bn: topic.bn, en: topic.en })}</div>
              <p style={{ margin: '6px 0 0', color: '#68747B', fontSize: 14 }}>
                {t({ bn: `৪টি প্রধান পরীক্ষার মধ্যে: ${topic.exams}`, en: `In ${topic.exams} of the 4 main exams` })}
              </p>
              {topic.noteBn ? (
                <p style={{ margin: '6px 0 0', color: '#68747B', fontSize: 13 }}>
                  {t({ bn: topic.noteBn, en: topic.noteEn ?? '' })}
                </p>
              ) : null}
              <p style={{ margin: '10px 0 0' }}>
                <Chip tone="gold">
                  {t({ bn: `লক্ষ্য: ~${COMMON_TOPIC_QUESTION_TARGET}টি প্রশ্ন`, en: `Target: ~${COMMON_TOPIC_QUESTION_TARGET} questions` })}
                </Chip>{' '}
                <Chip>{t({ bn: '০টি প্রকাশিত', en: '0 published' })}</Chip>
              </p>
            </Card>
          </Reveal>
        ))}
      </div>

      <Reveal>
        <Card>
          <p style={{ margin: 0, color: '#68747B', fontSize: 14, lineHeight: 1.7 }}>
            {t({
              bn: 'কমন টপিকের প্রশ্ন শিক্ষক যাচাইয়ের পর প্রকাশিত হবে। প্রতিটি প্রশ্নে ট্যাগ থাকবে — কোন কোন পরীক্ষায় প্রযোজ্য।',
              en: 'Common-topic questions will be published after teacher review. Every question will be tagged with the exams it applies to.',
            })}
          </p>
          <p style={{ margin: '12px 0 0' }}>
            <LinkButton to="/jobs" variant="accent">
              {t({ bn: 'সব পরীক্ষা দেখুন →', en: 'See all exams →' })}
            </LinkButton>
          </p>
        </Card>
      </Reveal>
    </PageShell>
  );
}
