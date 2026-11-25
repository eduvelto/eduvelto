// Eduvelto — Phase 4 (25 Nov 2026, feature/ssg-bilingual-support):
// "Daily 5-Question Free Quiz" widget — homepage, no login.
//
// Pool: ONLY the 35 verified public BCS English questions
// (src/lib/dailyQuiz.ts — audit in that file). No login-gated
// lesson/question content is ever read. The widget is a free
// practice quiz — it NEVER calls itself a real exam or a mock.
// The result card shows score/5 + date, with a one-click
// "Share on Facebook" button (standard sharer.php link).

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import {
  DAILY_QUIZ_COUNT,
  DAILY_QUIZ_POOL_SIZE,
  PUBLIC_BCS_READING_PASSAGE,
  buildDailyQuizShareUrl,
  dailyQuizDateBn,
  dailyQuizDateString,
  dailyQuizNeedsPassage,
  selectDailyQuizQuestions,
} from '../lib/dailyQuiz';

type Phase = 'idle' | 'playing' | 'done';

export default function DailyQuizWidget() {
  const { t, lang } = useLanguage();
  const dateStr = useMemo(() => dailyQuizDateString(), []);
  const questions = useMemo(() => selectDailyQuizQuestions(dateStr), [dateStr]);
  const needsPassage = useMemo(() => dailyQuizNeedsPassage(questions), [questions]);
  const [phase, setPhase] = useState<Phase>('idle');
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);

  const q = questions[index];
  const dateBn = dailyQuizDateBn(dateStr);

  function start() {
    setPhase('playing');
    setIndex(0);
    setSelected(null);
    setScore(0);
  }

  function choose(letter: string) {
    if (selected !== null) return;
    setSelected(letter);
    if (letter === q.correctLetter) setScore((s) => s + 1);
  }

  function next() {
    if (index + 1 >= questions.length) {
      setPhase('done');
    } else {
      setIndex((i) => i + 1);
      setSelected(null);
    }
  }

  return (
    <section
      id="daily-quiz"
      className="ev-rd-section"
      aria-label={t({ bn: 'প্রতিদিনের ফ্রি কুইজ', en: 'Daily free quiz' })}
    >
      <div className="ev-card" style={{ padding: 20, background: 'var(--card)' }}>
        <div className="ev-rd-head">
          <h2 style={{ margin: 0, fontSize: 20 }}>
            {t({ bn: '🎯 প্রতিদিনের ৫ প্রশ্নের ফ্রি কুইজ', en: '🎯 Daily 5-Question Free Quiz' })}
          </h2>
        </div>
        <p style={{ margin: '8px 0 0', lineHeight: 1.7, color: 'var(--muted-ivory)', fontSize: 14 }}>
          {t({
            bn: `৩৫টি যাচাইকৃত বিসিএস ইংরেজি প্রশ্ন থেকে প্রতিদিন ৫টি — লগইন ছাড়াই খেলুন। এটি অনুশীলনের কুইজ, আসল পরীক্ষা বা মক টেস্ট নয়। আজকের তারিখ: ${dateBn}।`,
            en: `5 questions a day from 35 verified BCS English questions — play without signing in. This is a practice quiz, not a real exam or a mock test. Today's date: ${dateBn}.`,
          })}
        </p>

        {phase === 'idle' ? (
          <div style={{ marginTop: 14 }}>
            <button type="button" className="ev-btn ev-btn-primary" onClick={start}>
              {t({ bn: 'কুইজ শুরু করুন →', en: 'Start the quiz →' })}
            </button>{' '}
            <Link to="/jobs/bcs/practice/english" style={{ fontWeight: 600, fontSize: 14 }}>
              {t({ bn: 'সব ৩৫টি প্রশ্ন দেখুন →', en: 'See all 35 questions →' })}
            </Link>
          </div>
        ) : phase === 'playing' && q ? (
          <div style={{ marginTop: 14 }}>
            <p style={{ margin: '0 0 8px', fontWeight: 700 }}>
              {t({ bn: `প্রশ্ন ${index + 1} / ${DAILY_QUIZ_COUNT}`, en: `Question ${index + 1} / ${DAILY_QUIZ_COUNT}` })}
            </p>
            {needsPassage && q.topic === 'reading' ? (
              <blockquote
                style={{
                  margin: '0 0 12px',
                  padding: '10px 12px',
                  background: 'var(--surface-muted, #f4f6f7)',
                  borderInlineStart: '3px solid var(--accent, #12766E)',
                  fontSize: 14,
                  lineHeight: 1.7,
                }}
              >
                {PUBLIC_BCS_READING_PASSAGE.text}
              </blockquote>
            ) : null}
            <p style={{ margin: '0 0 12px', fontSize: 16, lineHeight: 1.7 }}>{q.questionText}</p>
            <div style={{ display: 'grid', gap: 8 }}>
              {q.options.map((o) => {
                const isCorrect = selected !== null && o.letter === q.correctLetter;
                const isWrongPick = selected === o.letter && o.letter !== q.correctLetter;
                return (
                  <button
                    key={o.letter}
                    type="button"
                    onClick={() => choose(o.letter)}
                    disabled={selected !== null}
                    style={{
                      textAlign: 'start',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: `1px solid ${isCorrect ? '#1a7f37' : isWrongPick ? '#c0392b' : 'var(--line-strong)'}`,
                      background: isCorrect ? '#e6f4ea' : isWrongPick ? '#fdecea' : 'var(--card)',
                      cursor: selected !== null ? 'default' : 'pointer',
                      fontSize: 15,
                    }}
                  >
                    <strong>{o.letter}.</strong> {o.text}
                  </button>
                );
              })}
            </div>
            {selected !== null ? (
              <div style={{ marginTop: 12 }}>
                <p style={{ margin: '0 0 8px', fontSize: 14, lineHeight: 1.7 }}>
                  {selected === q.correctLetter
                    ? t({ bn: '✅ সঠিক!', en: '✅ Correct!' })
                    : t({ bn: `❌ সঠিক উত্তর: ${q.correctLetter}`, en: `❌ Correct answer: ${q.correctLetter}` })}{' '}
                  <span style={{ color: 'var(--muted-ivory)' }}>{q.explanation}</span>
                </p>
                <button type="button" className="ev-btn ev-btn-primary" onClick={next}>
                  {index + 1 >= questions.length
                    ? t({ bn: 'ফলাফল দেখুন →', en: 'See result →' })
                    : t({ bn: 'পরের প্রশ্ন →', en: 'Next question →' })}
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          <div id="daily-quiz-result" style={{ marginTop: 14 }}>
            <p style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 800 }}>
              {t({
                bn: `আপনার স্কোর: ${score} / ${DAILY_QUIZ_COUNT}`,
                en: `Your score: ${score} / ${DAILY_QUIZ_COUNT}`,
              })}
            </p>
            <p style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--muted-ivory)' }}>
              {t({
                bn: `তারিখ: ${dateBn} • ৩৫টি যাচাইকৃত প্রশ্ন থেকে আজকের ৫টি`,
                en: `Date: ${dateBn} • Today's 5 from 35 verified questions`,
              })}
            </p>
            <a
              id="daily-quiz-share"
              className="ev-btn ev-btn-primary"
              href={buildDailyQuizShareUrl(score, dateStr)}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'none' }}
            >
              {t({ bn: 'Facebook-এ শেয়ার করুন', en: 'Share on Facebook' })}
            </a>{' '}
            <button type="button" className="ev-btn" onClick={start}>
              {t({ bn: 'আবার খেলুন', en: 'Play again' })}
            </button>{' '}
            <Link to="/jobs/bcs/practice/english" style={{ fontWeight: 600, fontSize: 14 }}>
              {t({ bn: 'সব ৩৫টি প্রশ্ন অনুশীলন করুন →', en: 'Practise all 35 questions →' })}
            </Link>
            <p style={{ margin: '12px 0 0', fontSize: 13, color: 'var(--muted-ivory)' }}>
              {t({
                bn: 'এটি অনুশীলনের কুইজ — আসল পরীক্ষা বা মক টেস্ট নয়। আগামীকাল আবার নতুন ৫টি প্রশ্ন আসবে।',
                en: 'This is a practice quiz — not a real exam or a mock test. Five new questions arrive tomorrow.',
              })}
            </p>
          </div>
        )}
        <p style={{ margin: '12px 0 0', fontSize: 13, color: 'var(--muted-ivory)' }}>
          {lang === 'bn'
            ? `মোট প্রশ্নের পুল: ${DAILY_QUIZ_POOL_SIZE}টি যাচাইকৃত প্রশ্ন।`
            : `Total question pool: ${DAILY_QUIZ_POOL_SIZE} verified questions.`}
        </p>
      </div>
    </section>
  );
}
