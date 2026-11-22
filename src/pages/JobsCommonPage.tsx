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
// day −0.25); weekly full mock cycles BCS → Bank → Primary → NTRCA,
// each in its exam's real pattern. The daily mock's publish time is
// NOT decided yet — the card says so. The topic map is PRELIMINARY
// (B-10.1 finalises it); the ~50 per topic is a TARGET, not a count —
// 0 questions are published today.

import { Link } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { Card, Chip, LinkButton, Reveal } from '../components/ui';
import { useLanguage } from '../i18n/LanguageContext';
import {
  COMMON_TOPICS,
  COMMON_TOPIC_QUESTION_TARGET,
  DAILY_MOCK,
  WEEKLY_MOCK_CYCLE,
  jobExamBySlug,
} from '../lib/jobExams';

/** Weekly full-mock pattern per cycle exam (design plan §4.2). */
const WEEKLY_PATTERN: Record<string, { bn: string; en: string }> = {
  bcs: { bn: '২০০ MCQ · ২ ঘণ্টা · ভুলে −০.৫০', en: '200 MCQs · 2 hours · −0.50 per wrong answer' },
  bank: { bn: '১০০ MCQ · ১ ঘণ্টা · নেগেটিভ মার্কিং বিজ্ঞপ্তি অনুযায়ী', en: '100 MCQs · 1 hour · negative marking as per circular' },
  'primary-teacher': { bn: '৯০ MCQ · ৯০ মিনিট · ভুলে −০.২৫', en: '90 MCQs · 90 minutes · −0.25 per wrong answer' },
  ntrca: { bn: '১০০ MCQ · ১ ঘণ্টা · ভুলে −০.২৫', en: '100 MCQs · 1 hour · −0.25 per wrong answer' },
};

export default function JobsCommonPage() {
  const { lang, t } = useLanguage();
  const cycle = WEEKLY_MOCK_CYCLE.map((s) => jobExamBySlug(s)!).filter(Boolean);

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
        {/* Today's daily short mock — Coming Soon (publish time undecided, §7.3). */}
        <Reveal delayMs={0}>
          <Card>
            <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 17 }}>
              {t({ bn: 'আজকের দৈনিক মক', en: "Today's daily mock" })}
            </div>
            <p style={{ margin: '8px 0', color: 'var(--muted-ivory)', fontSize: 14, lineHeight: 1.7 }}>
              {t({ bn: DAILY_MOCK.sizeBn, en: DAILY_MOCK.sizeEn })} · {t({ bn: DAILY_MOCK.timeBn, en: DAILY_MOCK.timeEn })}
            </p>
            <p style={{ margin: '0 0 10px', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
              {t({
                bn: 'প্রতিদিন ভিন্ন টপিক — এক সপ্তাহে সব কমন টপিক ঘুরে আসে। নেগেটিভ মার্কিং ওই দিনের চক্রের পরীক্ষার নিয়মে হবে (BCS-র দিনে −০.৫০, প্রাথমিক/NTRCA-র দিনে −০.২৫)। প্রকাশের সময় এখনো ঠিক হয়নি।',
                en: 'A different topic every day — all common topics rotate through in a week. Negative marking follows that day’s cycle exam (BCS day −0.50, Primary/NTRCA day −0.25). The publish time is not decided yet.',
              })}
            </p>
            <Chip tone="gold">{t({ bn: 'শীঘ্রই আসছে', en: 'Coming soon' })}</Chip>
          </Card>
        </Reveal>

        {/* This week's full mock — weekly cycle, Coming Soon. */}
        <Reveal delayMs={80}>
          <Card>
            <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 17 }}>
              {t({ bn: 'এই সপ্তাহের পূর্ণ মক', en: "This week's full mock" })}
            </div>
            <p style={{ margin: '8px 0', color: 'var(--muted-ivory)', fontSize: 14, lineHeight: 1.7 }}>
              {t({ bn: 'প্রতি সপ্তাহে ১টি পূর্ণ মক — চক্রাকারে:', en: 'One full mock every week — rotating:' })}
            </p>
            <ul style={{ margin: '0 0 10px', paddingLeft: 20, color: 'var(--muted-ivory)', fontSize: 14, lineHeight: 1.9 }}>
              {cycle.map((def) => (
                <li key={def.slug}>
                  <strong style={{ color: 'var(--heading)' }}>{lang === 'bn' ? def.bn : def.en}</strong> —{' '}
                  {t({ bn: WEEKLY_PATTERN[def.slug].bn, en: WEEKLY_PATTERN[def.slug].en })}
                </li>
              ))}
            </ul>
            <Chip tone="gold">{t({ bn: 'শীঘ্রই আসছে', en: 'Coming soon' })}</Chip>
          </Card>
        </Reveal>

        {/* My progress — empty until mocks run. */}
        <Reveal delayMs={160}>
          <Card>
            <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 17 }}>
              {t({ bn: 'আমার অগ্রগতি', en: 'My progress' })}
            </div>
            <p style={{ margin: '8px 0 10px', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
              {t({
                bn: 'এখনো কোনো দৈনিক বা সাপ্তাহিক মক দেওয়া হয়নি — মক চালু হলে ইতিহাস, দুর্বল টপিক ও ধারাবাহিকতা এখানে দেখাবে।',
                en: 'No daily or weekly mock has been taken yet — once mocks run, history, weak topics and streak will show here.',
              })}
            </p>
            <Chip tone="gold">{t({ bn: 'শীঘ্রই আসছে', en: 'Coming soon' })}</Chip>
          </Card>
        </Reveal>
      </div>

      {/* Common topics — preliminary map, target only, 0 questions published. */}
      <Reveal>
        <h3 className="ev-section-h2">{t({ bn: 'কমন টপিক', en: 'Common topics' })}</h3>
      </Reveal>
      <p style={{ color: 'var(--muted-ivory)', margin: '-8px 0 14px', fontSize: 14, lineHeight: 1.7 }}>
        {t({
          bn: 'প্রাথমিক তালিকা — ৪টি পরীক্ষার অফিসিয়াল সিলেবাস মিলিয়ে চূড়ান্ত হবে। প্রতি টপিকে লক্ষ্য ~৫০টি প্রশ্ন। এখনো কোনো প্রশ্ন প্রকাশিত হয়নি।',
          en: 'Preliminary list — to be finalised against the 4 exams’ official syllabuses. Target ~50 questions per topic. No questions are published yet.',
        })}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12, marginBottom: 20 }}>
        {COMMON_TOPICS.map((topic, i) => (
          <Reveal key={topic.bn} delayMs={Math.min(i, 5) * 60}>
            <Card>
              <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 16 }}>{t({ bn: topic.bn, en: topic.en })}</div>
              <p style={{ margin: '6px 0 0', color: 'var(--muted)', fontSize: 14 }}>
                {t({ bn: `৪টি প্রধান পরীক্ষার মধ্যে: ${topic.exams}`, en: `In ${topic.exams} of the 4 main exams` })}
              </p>
              {topic.noteBn ? (
                <p style={{ margin: '6px 0 0', color: 'var(--muted)', fontSize: 13 }}>
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
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
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
