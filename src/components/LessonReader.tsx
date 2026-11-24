// Eduvelto — lesson reader (Phase 2, Step 3).
//
// Shared by LessonPage (/lessons/:lessonId) and ChapterPage
// (/books/:bookId/chapters/:chapterId) — the lesson id IS the chapter
// id in the loader's data model.
//
// Renders, from the lesson document:
//  - the lesson's own intro text (lines before the first question)
//  - every structured practice question: MCQ options are clickable and
//    self-checked immediately (these are practice questions, not exams —
//    the key lives in the lesson doc by design); short/brief/broad
//    questions reveal their simple answer + Bangla explanation on tap.
//  - bookmark toggle, "listen" (browser speech synthesis), and
//    "mark complete" (one progress write with the practice counts).
//
// Honest labels: questions are Eduvelto's own original practice
// questions — NOT board/university exam questions. Progress numbers
// are labelled "from your practice attempts".

import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { loginState } from '../lib/loginReturn';
import { useAuth } from '../lib/auth';
import { AlertBox, Button } from './ui';
import { useLanguage } from '../i18n/LanguageContext';
import { addBookmark, isBookmarked, removeBookmark } from '../lib/bookmarks';
import { markLessonComplete } from '../lib/progress';
import type { Lesson } from '../lib/content';
import { pickLessonAnswers } from '../lib/lessonAnswers';
import AdSlot from './AdSlot';

/** Lines before the first question marker — the lesson's own intro. */
export function lessonIntro(body: string): string {
  const lines = body.split('\n');
  const out: string[] = [];
  for (const line of lines) {
    const t = line.trim();
    if (/^\*\*\s*(Q|SA|B|E|প্রশ্ন)\s*[0-9০-৯]+\s*\./.test(t)) break;
    if (!t || t === '---') continue;
    if (/^#{1,3}\s+/.test(t)) continue; // part headings are shown as the title
    out.push(t.replace(/\*\*/g, ''));
  }
  return out.join('\n\n');
}

function stripMd(s: string): string {
  return s.replace(/\*\*/g, '').replace(/^#+\s*/gm, '').trim();
}

export default function LessonReader(props: {
  lesson: Lesson;
  bookTitle: string;
  subject: string;
  backTo: string;
  backLabel: string;
}) {
  const { lesson, bookTitle, subject, backTo, backLabel } = props;
  const { user } = useAuth();
  const location = useLocation();
  // Sections audit (24 Nov 2026): return here after sign-in.
  const back = loginState(location.pathname + location.search);
  const { lang, t } = useLanguage();
  const [picked, setPicked] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [bookmarked, setBookmarked] = useState<boolean | null>(null);
  const [bookmarkBusy, setBookmarkBusy] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [completeBusy, setCompleteBusy] = useState(false);
  const [error, setError] = useState('');
  const [speaking, setSpeaking] = useState(false);
  const [noBanglaVoice, setNoBanglaVoice] = useState(false);
  const speakRef = useRef<{ stop: boolean }>({ stop: false });

  useEffect(() => {
    if (!user) {
      setBookmarked(null);
      return;
    }
    let live = true;
    void isBookmarked(user.uid, lesson.id)
      .then((v) => {
        if (live) setBookmarked(v);
      })
      .catch(() => {
        if (live) setBookmarked(null);
      });
    return () => {
      live = false;
    };
  }, [user, lesson.id]);

  // Stop speech when leaving the lesson.
  useEffect(
    () => () => {
      speakRef.current.stop = true;
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    },
    [],
  );

  const attemptedCount = Object.keys(picked).length + Object.keys(revealed).length;
  const correctCount = Object.entries(picked).filter(([label, letter]) => {
    const q = lesson.questions.find((qq) => qq.label === label);
    return q && q.correctLetter !== '' && letter === q.correctLetter;
  }).length;

  async function toggleBookmark(): Promise<void> {
    if (!user || bookmarkBusy) return;
    setBookmarkBusy(true);
    setError('');
    try {
      if (bookmarked) {
        await removeBookmark(user.uid, lesson.id);
        setBookmarked(false);
      } else {
        await addBookmark(user.uid, lesson.id, lesson.bookId, lesson.title);
        setBookmarked(true);
      }
    } catch (e) {
      setError(t({ bn: 'বুকমার্ক সংরক্ষণ করা যায়নি — আবার চেষ্টা করুন।', en: 'Could not save the bookmark — please try again.' }));
      if (typeof console !== 'undefined') console.warn('[Eduvelto] bookmark failed:', e);
    } finally {
      setBookmarkBusy(false);
    }
  }

  async function completeLesson(): Promise<void> {
    if (!user || completeBusy) return;
    setCompleteBusy(true);
    setError('');
    try {
      await markLessonComplete(user.uid, subject, lesson.id, attemptedCount, correctCount);
      setCompleted(true);
    } catch (e) {
      setError(t({ bn: 'অগ্রগতি সংরক্ষণ করা যায়নি — আবার চেষ্টা করুন।', en: 'Could not save progress — please try again.' }));
      if (typeof console !== 'undefined') console.warn('[Eduvelto] progress failed:', e);
    } finally {
      setCompleteBusy(false);
    }
  }

  function speak(): void {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setError(t({ bn: 'এই ডিভাইসে শোনার সুবিধা নেই।', en: 'Listening is not available on this device.' }));
      return;
    }
    const synth = window.speechSynthesis;
    speakRef.current.stop = false;
    const voices = synth.getVoices();
    const bnVoice = voices.find((v) => v.lang.toLowerCase().startsWith('bn'));
    if (!bnVoice) setNoBanglaVoice(true);
    // Title + intro + each question with its simple answer.
    const chunks: string[] = [lesson.title, lessonIntro(lesson.body)];
    for (const q of lesson.questions) {
      chunks.push(q.question);
      const ans = pickLessonAnswers(q).primary || q.explanation;
      if (ans) chunks.push(ans);
    }
    const texts = chunks.map(stripMd).filter(Boolean);
    let i = 0;
    setSpeaking(true);
    const speakNext = () => {
      if (speakRef.current.stop || i >= texts.length) {
        setSpeaking(false);
        return;
      }
      const u = new SpeechSynthesisUtterance(texts[i]);
      i += 1;
      if (bnVoice) u.voice = bnVoice;
      u.lang = bnVoice ? bnVoice.lang : 'bn-BD';
      u.onend = speakNext;
      u.onerror = () => setSpeaking(false);
      synth.speak(u);
    };
    speakNext();
  }

  function stopSpeaking(): void {
    speakRef.current.stop = true;
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setSpeaking(false);
  }

  const intro = lessonIntro(lesson.body);

  // Mid-lesson split point (Hybrid Ad Strategy, 23 Nov 2026): the
  // in-content ad sits halfway through the questions — never before
  // the first question and never between a question and its answer.
  // Short lessons (< 4 questions) get no mid slot at all.
  const midIndex = Math.floor(lesson.questions.length / 2);
  const renderQuestion = (q: Lesson['questions'][number]) => {
    const isMcq = q.options.length > 0;
    const pick = picked[q.label];
    const show = revealed[q.label] === true;
    const { primary: answerText, bangla: banglaText } = pickLessonAnswers(q);
    return (
      <li key={q.label} style={{ marginBottom: 20 }}>
        <p style={{ margin: '0 0 8px', lineHeight: 1.6 }}>
          <strong>{q.label}.</strong> {stripMd(q.question)}
          {q.topic ? <span style={{ color: 'var(--ink-soft)', fontSize: 13 }}> ({q.topic})</span> : null}
        </p>
        {isMcq ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {q.options.map((opt) => {
              const isCorrect = q.correctLetter !== '' && opt.letter === q.correctLetter;
              const isPicked = pick === opt.letter;
              const bg = pick
                ? isCorrect
                  ? '#E8EFFA'
                  : isPicked
                    ? '#fdecea'
                    : '#fff'
                : '#fff';
              return (
                <button
                  key={opt.letter}
                  type="button"
                  disabled={pick !== undefined}
                  onClick={() => setPicked((p) => ({ ...p, [q.label]: opt.letter }))}
                  style={{ textAlign: 'left', padding: '10px 12px', minHeight: 44, borderRadius: 6, border: `1px solid ${isPicked ? 'var(--heading)' : 'var(--line-strong)'}`, background: bg, cursor: pick !== undefined ? 'default' : 'pointer', fontSize: 15 }}
                >
                  {opt.letter}) {opt.text}
                  {pick !== undefined && isCorrect ? ' ✓' : ''}
                  {pick !== undefined && isPicked && !isCorrect ? ' ✗' : ''}
                </button>
              );
            })}
            {pick !== undefined ? (
              <p style={{ margin: '4px 0 0', fontSize: 14 }}>
                {q.correctLetter !== '' ? (
                  pick === q.correctLetter ? (
                    <span style={{ color: 'var(--link)', fontWeight: 700 }}>{t({ bn: 'সঠিক!', en: 'Correct!' })}</span>
                  ) : (
                    <span>
                      {t({ bn: 'সঠিক উত্তর', en: 'Correct answer' })}: <strong>{q.correctLetter}) {q.correctText}</strong>
                    </span>
                  )
                ) : null}
                {answerText && answerText !== q.correctText ? <span style={{ display: 'block', marginTop: 4 }}>{answerText}</span> : null}
                {banglaText ? <span style={{ display: 'block', marginTop: 4 }}>{banglaText}</span> : null}
                {q.explanation ? <span style={{ display: 'block', marginTop: 4, color: 'var(--ink-soft)' }}>{q.explanation}</span> : null}
              </p>
            ) : null}
          </div>
        ) : (
          <div>
            <Button
              variant="outline"
              onClick={() => setRevealed((r) => ({ ...r, [q.label]: !r[q.label] }))}
            >
              {show ? t({ bn: 'উত্তর লুকান', en: 'Hide answer' }) : t({ bn: 'সহজ উত্তর দেখুন', en: 'Show simple answer' })}
            </Button>
            {show ? (
              <div style={{ marginTop: 8, padding: '12px', background: 'var(--card)', borderRadius: 6, lineHeight: 1.7 }}>
                {answerText ? <p style={{ margin: '0 0 8px' }}>{answerText}</p> : null}
                {banglaText ? (
                  <p style={{ margin: '0 0 8px', color: 'var(--ink-soft)' }}>
                    {t({ bn: 'বাংলায়:', en: 'In Bangla:' })} {banglaText}
                  </p>
                ) : null}
                {q.explanation ? <p style={{ margin: 0, color: 'var(--ink-soft)' }}>{q.explanation}</p> : null}
                {!answerText && !q.explanation ? <p style={{ margin: 0 }}>{t({ bn: 'উত্তর যোগ করা হয়নি।', en: 'No answer added yet.' })}</p> : null}
              </div>
            ) : null}
          </div>
        )}
      </li>
    );
  };

  return (
    <div>
      <p style={{ margin: '0 0 12px' }}>
        <Link to={backTo}>← {backLabel}</Link>
        {' · '}
        <Link to={`/library/${lesson.bookId}`}>{bookTitle}</Link>
      </p>
      <h2 style={{ fontSize: 22, margin: '0 0 4px' }}>{lesson.title}</h2>
      <p style={{ color: 'var(--ink-soft)', margin: '0 0 16px' }}>
        {t({ bn: `${lesson.questionCount}টি প্রশ্ন${lesson.part ? ` · পার্ট ${lesson.part}` : ''}${lesson.set > 1 ? ` · সেট ${lesson.set}` : ''}`, en: `${lesson.questionCount} questions${lesson.part ? ` · Part ${lesson.part}` : ''}${lesson.set > 1 ? ` · Set ${lesson.set}` : ''}` })}
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
        {user ? (
          <Button
            variant={bookmarked ? 'primary' : 'outline'}
            onClick={() => void toggleBookmark()}
            loading={bookmarkBusy}
          >
            {bookmarked ? t({ bn: '★ বুকমার্ক করা আছে', en: '★ Bookmarked' }) : t({ bn: '☆ বুকমার্ক করুন', en: '☆ Bookmark' })}
          </Button>
        ) : (
          <Link to="/login" state={back} className="ev-btn ev-btn-outline">
            {t({ bn: 'বুকমার্ক করতে লগইন করুন', en: 'Log in to bookmark' })}
          </Link>
        )}
        {speaking ? (
          <Button variant="danger" onClick={stopSpeaking}>
            {t({ bn: '■ থামান', en: '■ Stop' })}
          </Button>
        ) : (
          <Button variant="outline" onClick={speak}>
            {t({ bn: '🔊 শুনুন', en: '🔊 Listen' })}
          </Button>
        )}
      </div>
      {noBanglaVoice ? (
        <p style={{ color: 'var(--ink-soft)', fontSize: 14 }}>
          {t({ bn: 'আপনার ডিভাইসে বাংলা কণ্ঠ পাওয়া যায়নি, তাই ডিফল্ট কণ্ঠে পড়া হচ্ছে।', en: 'No Bangla voice was found on this device, so the default voice is used.' })}
        </p>
      ) : null}
      {error ? <AlertBox tone="error">{error}</AlertBox> : null}

      {intro ? (
        <div style={{ marginBottom: 24 }}>
          {intro.split('\n\n').map((para, i) => (
            <p key={i} style={{ lineHeight: 1.8 }}>{para}</p>
          ))}
        </div>
      ) : null}

      <h3 style={{ fontSize: 19, margin: '24px 0 4px' }}>{t({ bn: 'প্রশ্ন ও সহজ উত্তর', en: 'Questions & simple answers' })}</h3>
      <p style={{ color: 'var(--ink-soft)', fontSize: 14, margin: '0 0 16px' }}>
        {t({ bn: 'এই প্রশ্নগুলো Eduvelto-র নিজস্ব অনুশীলনী প্রশ্ন — বোর্ড বা বিশ্ববিদ্যালয়ের পরীক্ষার প্রশ্ন নয়।', en: 'These are Eduvelto’s own original practice questions — not board or university exam questions.' })}
      </p>

      {lesson.questions.length === 0 ? (
        <p>{t({ bn: 'এই পাঠে এখনো কোনো প্রশ্ন যোগ করা হয়নি।', en: 'No questions have been added to this lesson yet.' })}</p>
      ) : (
        <>
          <ol style={{ paddingLeft: 20 }}>
            {lesson.questions.slice(0, midIndex).map(renderQuestion)}
          </ol>
          {/* Mid-lesson in-content ad (Hybrid Ad Strategy, 23 Nov 2026):
              only on lessons long enough to have a real middle. Renders
              nothing until AdSense is configured; a labelled placeholder
              on preview hosts. */}
          {lesson.questions.length >= 4 ? <AdSlot placement="in-content" /> : null}
          <ol start={midIndex + 1} style={{ paddingLeft: 20 }}>
            {lesson.questions.slice(midIndex).map(renderQuestion)}
          </ol>
        </>
      )}

      <div className="ev-card" style={{ marginTop: 28, background: 'var(--card)' }}>
        {user ? (
          completed ? (
            <p style={{ margin: 0, color: 'var(--link)', fontWeight: 700 }}>
              {t({ bn: '✓ পড়া শেষ হিসেবে সংরক্ষণ করা হয়েছে — আপনার অগ্রগতি পাতায় দেখা যাবে।', en: '✓ Saved as read — see your Progress page.' })}
            </p>
          ) : (
            <>
              <p style={{ margin: '0 0 12px' }}>
                {t({ bn: `এই পাঠে আপনি ${attemptedCount}টি প্রশ্ন চেষ্টা করেছেন${attemptedCount > 0 ? `, এর মধ্যে ${correctCount}টি MCQ সঠিক হয়েছে` : ''}।`, en: `You tried ${attemptedCount} questions in this lesson${attemptedCount > 0 ? `, ${correctCount} MCQ correct` : ''}.` })}
              </p>
              <Button onClick={() => void completeLesson()} loading={completeBusy} size="lg">
                {t({ bn: 'পড়া শেষ করেছি', en: 'Mark lesson complete' })}
              </Button>
            </>
          )
        ) : (
          <p style={{ margin: 0 }}>
            {lang === 'bn' ? (
              <>
                <Link to="/login" state={back}>লগইন করুন</Link> — তাহলে আপনার পড়া ও অগ্রগতি সংরক্ষণ করা হবে।
              </>
            ) : (
              <>
                <Link to="/login" state={back}>Log in</Link> to save your reading and progress.
              </>
            )}
          </p>
        )}
      </div>
      {/* End-of-lesson in-content-2 ad (Hybrid Ad Strategy, 23 Nov 2026):
          after the lesson is finished — never between questions. Renders
          nothing until AdSense is configured; a labelled placeholder on
          preview hosts. */}
      <AdSlot placement="in-content-2" />
    </div>
  );
}
