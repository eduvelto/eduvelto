// Eduvelto — Job wrong-answer notebook page (Step 13).
//
// /jobs/wrong-answers — the student's own wrong questions,
// derived ONLY from their stored attempts (practice + mock).
// No new collection, no new rule: the notebook is computed
// client-side by src/lib/jobWrongAnswers.ts (deriveNotebook)
// over the last 50 practice + 50 mock attempts, newest
// first. Filters run client-side (no Firestore read per
// click); the question texts come from one getDoc per
// distinct source bundle.
//
// HONESTY (Steps 7–12, binding): no invented numbers, no
// readiness % / pass probability / peer comparison / ranks,
// no "verified" claims, practice never shown as verified.
// Every practice link is guarded against a published bundle
// (status == 'published' + questionCount > 0). The removal
// rule is stated on the page: 2 consecutive correct answers
// clear a question — and a later wrong answer re-opens it.
// Two corrects are a learning status, never permanent
// mastery (ChatGPT's caveat, stated in the info box).
// The explanation behind "ব্যাখ্যা দেখুন" loads lazily from
// the bundle key (practice keys are open; a mock bundle's
// key is receipt-gated, so the topic bundle's key is tried
// instead — never a guessed explanation).

import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { AlertBox, Button, Card, Chip, LinkButton, Skeleton } from '../components/ui';
import { useAuth } from '../lib/auth';
import { useLanguage } from '../i18n/LanguageContext';
import { jobExamBySlug } from '../lib/jobExams';
import { jobTopicLabel } from '../lib/jobEngine';
import {
  deriveNotebook,
  EMPTY_NOTEBOOK_FILTERS,
  filterNotebook,
  groupNotebookByTopic,
  NOTEBOOK_LEARNING_STATE_BN,
  NOTEBOOK_LEARNING_STATE_EN,
  sortNotebookEntries,
  type NotebookEntry,
  type NotebookFilters,
} from '../lib/jobWrongAnswers';
import {
  loadNotebookAttempts,
  loadNotebookExplanation,
  loadNotebookQuestionTexts,
  type NotebookExplanation,
  type NotebookQuestionText,
} from '../lib/jobWrongAnswersData';
import { loadPublishedBundlesForExams } from '../lib/jobDashboardData';
import type { PublishedBundleRef } from '../lib/jobDashboard';

type Phase = 'loading' | 'signed-out' | 'error' | 'ready';

function formatDate(millis: number | null, lang: string): string {
  if (millis === null) return '—';
  return new Date(millis).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function examLabel(slug: string, lang: string): string {
  const def = jobExamBySlug(slug);
  return lang === 'bn' ? (def?.bn ?? slug) : (def?.en ?? slug);
}

function EntryCard(props: {
  entry: NotebookEntry;
  text: NotebookQuestionText | undefined;
  selected: boolean;
  onToggleSelect: (questionId: string) => void;
  explanation: { state: 'idle' | 'loading' | 'ready' | 'none'; data?: NotebookExplanation } | undefined;
  onToggleExplanation: (entry: NotebookEntry) => void;
  lang: string;
}) {
  const { t, lang } = useLanguage();
  const { entry, text } = props;
  const picked = entry.lastSelected !== null && text
    ? text.options.find((o) => o.letter === entry.lastSelected)
    : undefined;
  const correctLetter = text && entry.lastCorrectText
    ? text.options.find((o) => o.text === entry.lastCorrectText)?.letter
    : undefined;
  return (
    <Card>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <input
          type="checkbox"
          checked={props.selected}
          onChange={() => props.onToggleSelect(entry.questionId)}
          aria-label={t({ bn: `বেছে নিন: ${text?.questionText ?? entry.questionId}`, en: `Select: ${text?.questionText ?? entry.questionId}` })}
          style={{ width: 20, height: 20, marginTop: 2, flexShrink: 0, cursor: 'pointer' }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: '0 0 8px', fontSize: 16, lineHeight: 1.8, color: 'var(--heading)', fontWeight: 600 }}>
            {text?.questionText ?? t({ bn: 'প্রশ্নের লেখা পাওয়া যায়নি — সেটটি বদলে গেছে হতে পারে।', en: 'The question text was not found — the set may have changed.' })}
          </p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
            {entry.examSlugs.map((s) => (
              <Chip key={s}>{examLabel(s, lang)}</Chip>
            ))}
            <Chip tone="outline">{jobTopicLabel(entry.subjectId, lang)}</Chip>
            <Chip tone="outline">{jobTopicLabel(entry.topicId, lang)}</Chip>
            <Chip tone={entry.learningState === 'new' ? 'gold' : 'blue'}>
              {lang === 'bn' ? NOTEBOOK_LEARNING_STATE_BN[entry.learningState] : NOTEBOOK_LEARNING_STATE_EN[entry.learningState]}
            </Chip>
            <Chip tone="outline">{t({ bn: `পরপর সঠিক: ${entry.consecutiveCorrect}/২`, en: `Consecutive correct: ${entry.consecutiveCorrect}/2` })}</Chip>
          </div>
          <p style={{ margin: '0 0 4px', fontSize: 14, lineHeight: 1.7, color: 'var(--text)' }}>
            {t({ bn: 'আপনার উত্তর:', en: 'Your answer:' })}{' '}
            {entry.lastSelected === null
              ? '—'
              : `${entry.lastSelected}${picked ? ` — ${picked.text}` : ''}`}{' '}
            · {t({ bn: 'সঠিক উত্তর:', en: 'Correct answer:' })}{' '}
            {entry.lastCorrectText ?? '—'}
            {correctLetter ? ` (${correctLetter})` : ''}
          </p>
          <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.7, color: 'var(--muted)' }}>
            {t({ bn: `${entry.wrongCount} বার ভুল · শেষ ভুল ${formatDate(entry.lastWrongAtMillis, props.lang)}`, en: `${entry.wrongCount} wrong · last wrong ${formatDate(entry.lastWrongAtMillis, props.lang)}` })}
            {' · '}
            {entry.lastWrongKind === 'mock' ? t({ bn: 'মক থেকে', en: 'from a mock' }) : t({ bn: 'অনুশীলন থেকে', en: 'from practice' })}{' '}
            <Link to={`/jobs/result/${entry.lastWrongAttemptId}`} style={{ fontWeight: 600 }}>
              {t({ bn: 'যেখানে ভুল হয়েছিল →', en: 'Where it went wrong →' })}
            </Link>
          </p>
          {text ? (
            <>
              <p style={{ margin: '8px 0 0' }}>
                <Button
                  variant="outline"
                  onClick={() => props.onToggleExplanation(entry)}
                  disabled={props.explanation?.state === 'loading'}
                >
                  {props.explanation?.state === 'ready'
                    ? t({ bn: 'ব্যাখ্যা লুকান ↑', en: 'Hide explanation ↑' })
                    : props.explanation?.state === 'loading'
                      ? t({ bn: 'ব্যাখ্যা খুলছে…', en: 'Opening explanation…' })
                      : t({ bn: 'ব্যাখ্যা দেখুন ↓', en: 'See explanation ↓' })}
                </Button>
              </p>
              {props.explanation?.state === 'ready' && props.explanation.data ? (
                <div style={{ marginTop: 12, background: 'var(--surface-soft)', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontWeight: 700, color: 'var(--heading)', marginBottom: 4 }}>
                    {t({ bn: `সঠিক উত্তর: ${props.explanation.data.correctLetter} — ${props.explanation.data.correctText}`, en: `Correct answer: ${props.explanation.data.correctLetter} — ${props.explanation.data.correctText}` })}
                  </div>
                  <p style={{ margin: '0 0 4px', color: 'var(--text)', fontSize: 14, lineHeight: 1.7 }}>
                    {t({ bn: 'ব্যাখ্যা:', en: 'Explanation:' })} {props.explanation.data.explanation}
                  </p>
                  {props.explanation.data.whyWrongText ? (
                    <p style={{ margin: '4px 0 0', color: 'var(--text)', fontSize: 14, lineHeight: 1.7 }}>
                      {t({ bn: 'আপনার উত্তরটি কেন ভুল:', en: 'Why your answer was wrong:' })} {props.explanation.data.whyWrongText}
                    </p>
                  ) : null}
                  <p style={{ margin: '8px 0 0', color: 'var(--muted)', fontSize: 13 }}>
                    {lang === 'bn' ? props.explanation.data.sourceBn : props.explanation.data.sourceEn} — {t({ bn: 'যাচাইকৃত শিক্ষকের ব্যাখ্যা নয়, প্রশ্ন-ব্যাংকের ব্যাখ্যা।', en: "a question-bank explanation, not a verified teacher's explanation." })}
                  </p>
                </div>
              ) : null}
              {props.explanation?.state === 'none' ? (
                <p style={{ margin: '8px 0 0', color: 'var(--muted)', fontSize: 13, lineHeight: 1.7 }}>
                  {t({ bn: 'এই প্রশ্নের ব্যাখ্যা এখানে খুলছে না —', en: "This question's explanation does not open here —" })}{' '}
                  <Link to={`/jobs/result/${entry.lastWrongAttemptId}`} style={{ fontWeight: 600 }}>
                    {t({ bn: 'ফলাফল পাতা থেকে দেখুন →', en: 'See it on the result page →' })}
                  </Link>
                </p>
              ) : null}
            </>
          ) : (
            <p style={{ margin: '8px 0 0', color: 'var(--muted)', fontSize: 13, lineHeight: 1.7 }}>
              {t({ bn: 'ব্যাখ্যা এখানে খুলছে না —', en: 'The explanation does not open here —' })}{' '}
              <Link to={`/jobs/result/${entry.lastWrongAttemptId}`} style={{ fontWeight: 600 }}>
                {t({ bn: 'ফলাফল পাতা থেকে দেখুন →', en: 'See it on the result page →' })}
              </Link>
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}

export default function JobWrongAnswersPage() {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();

  const [phase, setPhase] = useState<Phase>('loading');
  const [error, setError] = useState('');
  const [capped, setCapped] = useState(false);
  const [entries, setEntries] = useState<NotebookEntry[]>([]);
  const [texts, setTexts] = useState<Map<string, NotebookQuestionText>>(new Map());
  const [publishedByExam, setPublishedByExam] = useState<Map<string, PublishedBundleRef[]>>(new Map());
  const [filters, setFilters] = useState<NotebookFilters>(EMPTY_NOTEBOOK_FILTERS);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [explanations, setExplanations] = useState<
    Record<string, { state: 'idle' | 'loading' | 'ready' | 'none'; data?: NotebookExplanation }>
  >({});

  useEffect(() => {
    if (!user) {
      setPhase('signed-out');
      return;
    }
    let alive = true;
    (async () => {
      try {
        const { attempts, capped: wasCapped } = await loadNotebookAttempts(user.uid);
        if (!alive) return;
        const derived = sortNotebookEntries(deriveNotebook(attempts));
        setEntries(derived);
        setCapped(wasCapped);
        const questionIds = derived.map((e) => e.questionId);
        const [textMap, bundles] = await Promise.all([
          loadNotebookQuestionTexts(attempts, questionIds),
          loadPublishedBundlesForExams([...new Set(derived.flatMap((e) => e.examSlugs))]),
        ]);
        if (!alive) return;
        setTexts(textMap);
        setPublishedByExam(bundles);
        setPhase('ready');
      } catch (e) {
        if (!alive) return;
        setError(e instanceof Error ? e.message : t({ bn: 'নোটবুক খোলা যায়নি — আবার চেষ্টা করুন।', en: 'The notebook could not be opened — please try again.' }));
        setPhase('error');
      }
    })();
    return () => {
      alive = false;
    };
  }, [user]);

  const active = useMemo(() => entries.filter((e) => e.status === 'active'), [entries]);
  const learned = useMemo(() => entries.filter((e) => e.status === 'learned'), [entries]);

  const examOptions = useMemo(
    () => [...new Set(active.flatMap((e) => e.examSlugs))].sort(),
    [active],
  );
  const subjectOptions = useMemo(
    () =>
      [...new Set(active.filter((e) => filters.examSlug === 'all' || e.examSlugs.includes(filters.examSlug)).map((e) => e.subjectId))].sort(),
    [active, filters.examSlug],
  );
  const topicOptions = useMemo(
    () =>
      [...new Set(
        active
          .filter(
            (e) =>
              (filters.examSlug === 'all' || e.examSlugs.includes(filters.examSlug))
              && (filters.subjectId === 'all' || e.subjectId === filters.subjectId),
          )
          .map((e) => e.topicId),
      )].sort(),
    [active, filters.examSlug, filters.subjectId],
  );

  const textMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const [id, v] of texts.entries()) m.set(id, v.questionText);
    return m;
  }, [texts]);
  const filtered = useMemo(() => filterNotebook(active, filters, textMap), [active, filters, textMap]);
  const groups = useMemo(() => groupNotebookByTopic(filtered), [filtered]);

  const filtersActive =
    filters.examSlug !== 'all'
    || filters.subjectId !== 'all'
    || filters.topicId !== 'all'
    || filters.streak !== 'all'
    || filters.source !== 'all'
    || filters.status !== 'all'
    || filters.query.trim() !== '';

  function setFilter<K extends keyof NotebookFilters>(key: K, value: NotebookFilters[K]) {
    setFilters((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'examSlug') {
        next.subjectId = 'all';
        next.topicId = 'all';
      }
      if (key === 'subjectId') next.topicId = 'all';
      return next;
    });
  }

  function toggleSelect(questionId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  }

  function toggleSelectAllFiltered() {
    const ids = filtered.map((e) => e.questionId);
    setSelected((prev) => {
      const allSelected = ids.length > 0 && ids.every((id) => prev.has(id));
      if (allSelected) {
        const next = new Set(prev);
        for (const id of ids) next.delete(id);
        return next;
      }
      return new Set([...prev, ...ids]);
    });
  }

  async function toggleExplanation(entry: NotebookEntry) {
    const current = explanations[entry.questionId];
    if (current?.state === 'ready' || current?.state === 'none') {
      setExplanations((prev) => {
        const next = { ...prev };
        delete next[entry.questionId];
        return next;
      });
      return;
    }
    const text = texts.get(entry.questionId);
    if (!text) return;
    setExplanations((prev) => ({ ...prev, [entry.questionId]: { state: 'loading' } }));
    const data = await loadNotebookExplanation({
      questionId: entry.questionId,
      topicId: entry.topicId,
      sourceBundleId: text.bundleId,
      sourceBundleKind: text.bundleKind,
      selectedLetter: entry.lastSelected,
    });
    setExplanations((prev) => ({
      ...prev,
      [entry.questionId]: data ? { state: 'ready', data } : { state: 'none' },
    }));
  }

  function startPractice() {
    const pool = selected.size > 0 ? filtered.filter((e) => selected.has(e.questionId)) : filtered;
    if (pool.length === 0) return;
    const firstGroup = groupNotebookByTopic(pool)[0];
    const ids = pool.filter((e) => e.topicId === firstGroup.topicId).map((e) => e.questionId);
    navigate(`/jobs/wrong-answers/practice/${encodeURIComponent(firstGroup.topicId)}`, {
      state: { questionIds: ids },
    });
  }

  function startTopicPractice(topicId: string, questionIds: string[]) {
    navigate(`/jobs/wrong-answers/practice/${encodeURIComponent(topicId)}`, {
      state: { questionIds },
    });
  }

  function topicBundle(topicId: string): PublishedBundleRef | undefined {
    for (const list of publishedByExam.values()) {
      const found = list.find((b) => b.topicId === topicId && b.questionCount > 0);
      if (found) return found;
    }
    return undefined;
  }

  if (phase === 'loading') {
    return (
      <PageShell titleBn="ভুল-উত্তর নোটবুক" titleEn="Wrong-Answer Notebook" wide>
        <Skeleton />
      </PageShell>
    );
  }

  if (phase === 'signed-out') {
    return (
      <PageShell titleBn="ভুল-উত্তর নোটবুক" titleEn="Wrong-Answer Notebook" wide>
        <Card>
          <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 17 }}>{t({ bn: 'নোটবুক দেখতে লগইন করুন', en: 'Log in to see the notebook' })}</div>
          <p style={{ margin: '8px 0 12px', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
            {t({ bn: 'ভুল-উত্তর নোটবুক শুধু আপনার নিজের — লগইন করলে আপনার ভুল প্রশ্নগুলো এখানে জমা হবে।', en: 'The wrong-answer notebook is only yours — log in and your wrong questions will collect here.' })}
          </p>
          <Link to="/login" style={{ fontWeight: 600 }}>{t({ bn: 'লগইন করুন →', en: 'Log in →' })}</Link>
        </Card>
      </PageShell>
    );
  }

  if (phase === 'error') {
    return (
      <PageShell titleBn="ভুল-উত্তর নোটবুক" titleEn="Wrong-Answer Notebook" wide>
        <AlertBox tone="error">{error}</AlertBox>
        <p style={{ marginTop: 16 }}>
          <Link to="/jobs/dashboard" style={{ fontWeight: 600 }}>{t({ bn: '← ড্যাশবোর্ডে ফিরুন', en: '← Back to the dashboard' })}</Link>
        </p>
      </PageShell>
    );
  }

  const poolForPractice = selected.size > 0 ? filtered.filter((e) => selected.has(e.questionId)) : filtered;
  const practiceTopics = groupNotebookByTopic(poolForPractice);

  return (
    <PageShell titleBn="ভুল-উত্তর নোটবুক" titleEn="Wrong-Answer Notebook" wide>
      <p style={{ margin: '0 0 12px', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
        {t({
          bn: 'আপনার ভুল প্রশ্নগুলো এখানে জমা হয় — শুধু আপনার নিজের অনুশীলন ও মক থেকে। একটি প্রশ্ন পরপর ২ বার সঠিক হলে তা নোটবুক থেকে সরে যায়; পরে আবার ভুল হলে ফিরে আসে। দুইবার সঠিক মানেই চিরকাল মনে থাকবে তা নয় — এটি শেখার অবস্থা, স্থায়ী দক্ষতার সনদ নয়।',
          en: 'Your wrong questions collect here — only from your own practice and mocks. A question leaves the notebook after 2 consecutive correct answers; a later wrong answer brings it back. Two correct answers are a learning status, not proof of permanent mastery.',
        })}
      </p>
      {capped ? (
        <AlertBox tone="info">
          {t({
            bn: 'নোটবুকটি আপনার সাম্প্রতিক ৫০টি অনুশীলন ও ৫০টি মক থেকে তৈরি — এর আগের ভুল এখানে দেখা যাবে না।',
            en: 'This notebook covers your most recent 50 practice attempts and 50 mocks — older mistakes are not shown here.',
          })}
        </AlertBox>
      ) : null}

      {active.length === 0 && learned.length === 0 ? (
        <Card>
          <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 17 }}>
            {t({ bn: 'এখনো কোনো ভুল উত্তর নেই', en: 'No wrong answers yet' })}
          </div>
          <p style={{ margin: '8px 0 12px', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
            {t({
              bn: 'এখনো কোনো ভুল উত্তর নেই — মক বা অনুশীলন শুরু করলে ভুলগুলো এখানে জমা হবে।',
              en: 'No wrong answers yet — mistakes from your mocks and practice will collect here.',
            })}
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <LinkButton to="/jobs" variant="accent">
              {t({ bn: 'অনুশীলন শুরু করুন →', en: 'Start practising →' })}
            </LinkButton>
            <LinkButton to="/jobs/dashboard" variant="outline">
              {t({ bn: 'ড্যাশবোর্ড দেখুন', en: 'View dashboard' })}
            </LinkButton>
          </div>
        </Card>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16, fontSize: 15 }}>
            <span>
              <strong>{active.length}</strong>{t({ bn: 'টি ভুল প্রশ্ন', en: ' wrong questions' })}
            </span>
            <span>
              <strong>{learned.length}</strong>{t({ bn: 'টি শেখা হয়েছে', en: ' learned' })}
            </span>
          </div>

          {/* Filters */}
          <Card style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'end' }}>
              <label style={{ display: 'grid', gap: 4, fontSize: 13, fontWeight: 600, color: 'var(--heading)' }}>
                {t({ bn: 'পরীক্ষা', en: 'Exam' })}
                <select
                  value={filters.examSlug}
                  onChange={(e) => setFilter('examSlug', e.target.value)}
                  aria-label={t({ bn: 'পরীক্ষা অনুযায়ী দেখুন', en: 'Filter by exam' })}
                  style={{ border: '1px solid #C9D2E0', borderRadius: 8, padding: '8px 10px', fontWeight: 600, background: '#fff', cursor: 'pointer' }}
                >
                  <option value="all">{t({ bn: 'সব পরীক্ষা', en: 'All exams' })}</option>
                  {examOptions.map((s) => (
                    <option key={s} value={s}>{examLabel(s, lang)}</option>
                  ))}
                </select>
              </label>
              <label style={{ display: 'grid', gap: 4, fontSize: 13, fontWeight: 600, color: 'var(--heading)' }}>
                {t({ bn: 'বিষয়', en: 'Subject' })}
                <select
                  value={filters.subjectId}
                  onChange={(e) => setFilter('subjectId', e.target.value)}
                  aria-label={t({ bn: 'বিষয় অনুযায়ী দেখুন', en: 'Filter by subject' })}
                  style={{ border: '1px solid #C9D2E0', borderRadius: 8, padding: '8px 10px', fontWeight: 600, background: '#fff', cursor: 'pointer' }}
                >
                  <option value="all">{t({ bn: 'সব বিষয়', en: 'All subjects' })}</option>
                  {subjectOptions.map((s) => (
                    <option key={s} value={s}>{jobTopicLabel(s, lang)}</option>
                  ))}
                </select>
              </label>
              <label style={{ display: 'grid', gap: 4, fontSize: 13, fontWeight: 600, color: 'var(--heading)' }}>
                {t({ bn: 'টপিক', en: 'Topic' })}
                <select
                  value={filters.topicId}
                  onChange={(e) => setFilter('topicId', e.target.value)}
                  aria-label={t({ bn: 'টপিক অনুযায়ী দেখুন', en: 'Filter by topic' })}
                  style={{ border: '1px solid #C9D2E0', borderRadius: 8, padding: '8px 10px', fontWeight: 600, background: '#fff', cursor: 'pointer' }}
                >
                  <option value="all">{t({ bn: 'সব টপিক', en: 'All topics' })}</option>
                  {topicOptions.map((s) => (
                    <option key={s} value={s}>{jobTopicLabel(s, lang)}</option>
                  ))}
                </select>
              </label>
              <label style={{ display: 'grid', gap: 4, fontSize: 13, fontWeight: 600, color: 'var(--heading)' }}>
                {t({ bn: 'পরপর সঠিক', en: 'Consecutive correct' })}
                <select
                  value={filters.streak}
                  onChange={(e) => setFilter('streak', e.target.value as NotebookFilters['streak'])}
                  aria-label={t({ bn: 'পরপর সঠিক অনুযায়ী দেখুন', en: 'Filter by consecutive correct' })}
                  style={{ border: '1px solid #C9D2E0', borderRadius: 8, padding: '8px 10px', fontWeight: 600, background: '#fff', cursor: 'pointer' }}
                >
                  <option value="all">{t({ bn: 'সব', en: 'All' })}</option>
                  <option value="0">{t({ bn: '০/২ — এখনো একবারও সঠিক হয়নি', en: '0/2 — not correct even once yet' })}</option>
                  <option value="1">{t({ bn: '১/২ — আর একবার সঠিক হলেই সরবে', en: '1/2 — one more correct answer clears it' })}</option>
                </select>
              </label>
              <label style={{ display: 'grid', gap: 4, fontSize: 13, fontWeight: 600, color: 'var(--heading)' }}>
                {t({ bn: 'উৎস', en: 'Source' })}
                <select
                  value={filters.source}
                  onChange={(e) => setFilter('source', e.target.value as NotebookFilters['source'])}
                  aria-label={t({ bn: 'উৎস অনুযায়ী দেখুন', en: 'Filter by source' })}
                  style={{ border: '1px solid #C9D2E0', borderRadius: 8, padding: '8px 10px', fontWeight: 600, background: '#fff', cursor: 'pointer' }}
                >
                  <option value="all">{t({ bn: 'সব', en: 'All' })}</option>
                  <option value="practice">{t({ bn: 'অনুশীলন থেকে', en: 'From practice' })}</option>
                  <option value="mock">{t({ bn: 'মক থেকে', en: 'From a mock' })}</option>
                </select>
              </label>
              <label style={{ display: 'grid', gap: 4, fontSize: 13, fontWeight: 600, color: 'var(--heading)' }}>
                {t({ bn: 'সর্বশেষ ফল', en: 'Latest result' })}
                <select
                  value={filters.status}
                  onChange={(e) => setFilter('status', e.target.value as NotebookFilters['status'])}
                  aria-label={t({ bn: 'সর্বশেষ ফল অনুযায়ী দেখুন', en: 'Filter by latest result' })}
                  style={{ border: '1px solid #C9D2E0', borderRadius: 8, padding: '8px 10px', fontWeight: 600, background: '#fff', cursor: 'pointer' }}
                >
                  <option value="all">{t({ bn: 'সব', en: 'All' })}</option>
                  <option value="wrong">{t({ bn: 'ভুল উত্তর', en: 'Wrong answer' })}</option>
                  <option value="unanswered">{t({ bn: 'উত্তর দেওয়া হয়নি', en: 'Unanswered' })}</option>
                </select>
              </label>
              <label style={{ display: 'grid', gap: 4, fontSize: 13, fontWeight: 600, color: 'var(--heading)', flex: '1 1 180px' }}>
                {t({ bn: 'প্রশ্ন খুঁজুন', en: 'Search questions' })}
                <input
                  type="search"
                  value={filters.query}
                  onChange={(e) => setFilter('query', e.target.value)}
                  placeholder={t({ bn: 'প্রশ্নের লেখা দিয়ে খুঁজুন…', en: 'Search by question text…' })}
                  aria-label={t({ bn: 'প্রশ্নের লেখা দিয়ে খুঁজুন', en: 'Search by question text' })}
                  style={{ border: '1px solid #C9D2E0', borderRadius: 8, padding: '8px 10px', fontWeight: 400 }}
                />
              </label>
              {filtersActive ? (
                <Button variant="outline" onClick={() => setFilters(EMPTY_NOTEBOOK_FILTERS)}>
                  {t({ bn: 'ফিল্টার পরিষ্কার করুন', en: 'Clear filters' })}
                </Button>
              ) : null}
            </div>
          </Card>

          {/* Practice action */}
          {filtered.length > 0 ? (
            <Card style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <Button variant="accent" onClick={toggleSelectAllFiltered}>
                  {filtered.every((e) => selected.has(e.questionId)) && filtered.length > 0
                    ? t({ bn: 'সব বাছাই তুলে নিন', en: 'Deselect all' })
                    : t({ bn: 'এই তালিকার সব বেছে নিন', en: 'Select all in this list' })}
                </Button>
                <Button variant="accent" onClick={startPractice}>
                  {selected.size > 0
                    ? t({ bn: `বেছে নেওয়া ${selected.size}টি অনুশীলন করুন →`, en: `Practise the ${selected.size} selected →` })
                    : t({ bn: 'শুধু ভুলগুলো আবার অনুশীলন করুন →', en: 'Practise only the wrong ones again →' })}
                </Button>
              </div>
              <p style={{ margin: '8px 0 0', color: 'var(--muted)', fontSize: 13, lineHeight: 1.7 }}>
                {practiceTopics.length > 1
                  ? t({ bn: `${practiceTopics.length}টি টপিকের প্রশ্ন আছে — প্রথমে ${practiceTopics[0].label} টপিকের সেশন শুরু হবে; বাকি টপিকগুলো নোটবুকে থাকবে, সেখান থেকে আলাদাভাবে অনুশীলন করুন।`, en: `${practiceTopics.length} topics' questions are here — the session starts with the ${lang === 'bn' ? practiceTopics[0].label : practiceTopics[0].labelEn} topic; the other topics stay in the notebook, practise them separately from there.` })
                  : t({ bn: 'অনুশীলনে মূল ভুল প্রশ্নগুলোর সঙ্গে একই টপিকের নতুন প্রশ্নও থাকবে — একই প্রশ্ন বারবার মনে রাখা শেখা নয়, নতুন প্রশ্নে নিয়মটি প্রয়োগ করতে পারাই আসল শেখা।', en: 'Practice will include new questions from the same topic alongside the original wrong ones — memorising the same question is not learning; applying the rule to a new question is real learning.' })}
              </p>
            </Card>
          ) : null}

          {/* Active list, grouped by topic */}
          {filtered.length === 0 ? (
            <Card>
              <p style={{ margin: 0, color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
                {t({ bn: 'এই ফিল্টারে কোনো ভুল প্রশ্ন নেই।', en: 'No wrong questions match this filter.' })}
                {filtersActive ? (
                  <>
                    {' '}
                    <button
                      type="button"
                      onClick={() => setFilters(EMPTY_NOTEBOOK_FILTERS)}
                      style={{ background: 'none', border: 'none', color: 'var(--teal)', fontWeight: 700, cursor: 'pointer', padding: 0, fontSize: 14 }}
                    >
                      {t({ bn: 'ফিল্টার পরিষ্কার করুন', en: 'Clear filters' })}
                    </button>
                  </>
                ) : null}
              </p>
            </Card>
          ) : (
            <div style={{ display: 'grid', gap: 20 }}>
              {groups.map((g) => {
                const bundle = topicBundle(g.topicId);
                return (
                  <section key={g.topicId} aria-label={lang === 'bn' ? g.label : g.labelEn}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap', marginBottom: 8 }}>
                      <h2 style={{ margin: 0, fontSize: 17, color: 'var(--heading)' }}>{lang === 'bn' ? g.label : g.labelEn}</h2>
                      <span style={{ color: 'var(--muted)', fontSize: 13 }}>{t({ bn: `${g.entries.length}টি ভুল প্রশ্ন`, en: `${g.entries.length} wrong questions` })}</span>
                      <span style={{ flex: 1 }} />
                      {bundle ? (
                        <Link to={`/jobs/practice/${bundle.docId}`} style={{ fontWeight: 600, fontSize: 13 }}>
                          {t({ bn: 'এই টপিকের নতুন প্রশ্ন অনুশীলন করুন →', en: 'Practise new questions on this topic →' })}
                        </Link>
                      ) : (
                        <span style={{ color: 'var(--muted)', fontSize: 13 }}>{t({ bn: 'এই টপিকের অনুশীলন সেট এখনো তৈরি হয়নি।', en: "This topic's practice set has not been created yet." })}</span>
                      )}
                    </div>
                    <div style={{ display: 'grid', gap: 12 }}>
                      {g.entries.map((entry) => (
                        <EntryCard
                          key={entry.questionId}
                          entry={entry}
                          text={texts.get(entry.questionId)}
                          selected={selected.has(entry.questionId)}
                          onToggleSelect={toggleSelect}
                          explanation={explanations[entry.questionId]}
                          onToggleExplanation={toggleExplanation}
                          lang={lang}
                        />
                      ))}
                    </div>
                    <p style={{ margin: '8px 0 0' }}>
                      <Button
                        variant="outline"
                        onClick={() => startTopicPractice(g.topicId, g.entries.map((e) => e.questionId))}
                      >
                        {t({ bn: 'এই টপিকের ভুলগুলো অনুশীলন করুন →', en: "Practise this topic's wrong ones →" })}
                      </Button>
                    </p>
                  </section>
                );
              })}
            </div>
          )}

          {/* Learned history */}
          {learned.length > 0 ? (
            <section aria-label={t({ bn: 'শেখা হয়েছে', en: 'Learned' })} style={{ marginTop: 28 }}>
              <h2 style={{ margin: '0 0 4px', fontSize: 17, color: 'var(--heading)' }}>{t({ bn: 'শেখা হয়েছে', en: 'Learned' })}</h2>
              <p style={{ margin: '0 0 12px', color: 'var(--muted)', fontSize: 13, lineHeight: 1.7 }}>
                {t({ bn: `পরপর ২ বার সঠিক হওয়ায় এই প্রশ্নগুলো নোটবুক থেকে সরে গেছে — পরে আবার ভুল হলে ফিরে আসবে। মোট ${learned.length}টি।`, en: `These questions left the notebook after 2 consecutive correct answers — a later wrong answer brings them back. Total ${learned.length}.` })}
              </p>
              <div style={{ display: 'grid', gap: 12 }}>
                {learned.slice(0, 5).map((entry) => (
                  <Card key={entry.questionId}>
                    <p style={{ margin: '0 0 4px', fontSize: 15, lineHeight: 1.7, color: 'var(--heading)', fontWeight: 600 }}>
                      {texts.get(entry.questionId)?.questionText ?? jobTopicLabel(entry.topicId, lang)}
                    </p>
                    <p style={{ margin: 0, color: 'var(--muted)', fontSize: 13 }}>
                      {t({ bn: `পরপর ২ বার সঠিক · ${formatDate(entry.clearedAtMillis, lang)}`, en: `Correct 2 times in a row · ${formatDate(entry.clearedAtMillis, lang)}` })}
                      {' · '}
                      <Link to={`/jobs/result/${entry.lastWrongAttemptId}`} style={{ fontWeight: 600 }}>
                        {t({ bn: 'যেখানে ভুল হয়েছিল →', en: 'Where it went wrong →' })}
                      </Link>
                    </p>
                  </Card>
                ))}
                {learned.length > 5 ? (
                  <p style={{ margin: 0, color: 'var(--muted)', fontSize: 13 }}>
                    {t({ bn: `আরও ${learned.length - 5}টি প্রশ্ন শেখা হয়েছে।`, en: `${learned.length - 5} more questions learned.` })}
                  </p>
                ) : null}
              </div>
            </section>
          ) : null}
        </>
      )}

      <p style={{ marginTop: 24 }}>
        <Link to="/jobs/dashboard" style={{ fontWeight: 600 }}>{t({ bn: '← ড্যাশবোর্ডে ফিরুন', en: '← Back to the dashboard' })}</Link>
        {' · '}
        <Link to="/jobs/planner" style={{ fontWeight: 600 }}>{t({ bn: 'প্ল্যানার দেখুন →', en: 'See the planner →' })}</Link>
      </p>
    </PageShell>
  );
}
