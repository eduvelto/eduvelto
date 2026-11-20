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
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { addBookmark, isBookmarked, removeBookmark } from '../lib/bookmarks';
import { markLessonComplete } from '../lib/progress';
import type { Lesson } from '../lib/content';

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
      setError('বুকমার্ক সংরক্ষণ করা যায়নি — আবার চেষ্টা করুন। / Could not save the bookmark — please try again.');
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
      setError('অগ্রগতি সংরক্ষণ করা যায়নি — আবার চেষ্টা করুন। / Could not save progress — please try again.');
      if (typeof console !== 'undefined') console.warn('[Eduvelto] progress failed:', e);
    } finally {
      setCompleteBusy(false);
    }
  }

  function speak(): void {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setError('এই ডিভাইসে শোনার সুবিধা নেই। / Listening is not available on this device.');
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
      const ans = q.answerBn || q.answer || q.correctText || q.explanation;
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

  return (
    <div>
      <p style={{ margin: '0 0 12px' }}>
        <Link to={backTo}>← {backLabel}</Link>
        {' · '}
        <Link to={`/library/${lesson.bookId}`}>{bookTitle}</Link>
      </p>
      <h2 style={{ fontSize: 22, margin: '0 0 4px' }}>{lesson.title}</h2>
      <p style={{ color: '#555', margin: '0 0 16px' }}>
        {lesson.questionCount}টি প্রশ্ন / {lesson.questionCount} questions
        {lesson.part ? ` · Part ${lesson.part}` : ''}
        {lesson.set > 1 ? ` · সেট ${lesson.set}` : ''}
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
        {user ? (
          <button
            type="button"
            onClick={() => void toggleBookmark()}
            disabled={bookmarkBusy}
            style={{ padding: '10px 16px', minHeight: 44, borderRadius: 6, border: '1px solid #0A1F44', background: bookmarked ? '#0A1F44' : '#fff', color: bookmarked ? '#fff' : '#0A1F44', cursor: 'pointer', fontSize: 15 }}
          >
            {bookmarked ? '★ বুকমার্ক করা আছে / Bookmarked' : '☆ বুকমার্ক করুন / Bookmark'}
          </button>
        ) : (
          <Link to="/login" style={{ padding: '10px 16px', border: '1px solid #0A1F44', borderRadius: 6, textDecoration: 'none' }}>
            বুকমার্ক করতে লগইন করুন / Log in to bookmark
          </Link>
        )}
        {speaking ? (
          <button
            type="button"
            onClick={stopSpeaking}
            style={{ padding: '10px 16px', minHeight: 44, borderRadius: 6, border: '1px solid #b00020', background: '#fff', color: '#b00020', cursor: 'pointer', fontSize: 15 }}
          >
            ■ থামান / Stop
          </button>
        ) : (
          <button
            type="button"
            onClick={speak}
            style={{ padding: '10px 16px', minHeight: 44, borderRadius: 6, border: '1px solid #0A1F44', background: '#fff', color: '#0A1F44', cursor: 'pointer', fontSize: 15 }}
          >
            🔊 শুনুন / Listen
          </button>
        )}
      </div>
      {noBanglaVoice ? (
        <p style={{ color: '#555', fontSize: 14 }}>
          আপনার ডিভাইসে বাংলা কণ্ঠ পাওয়া যায়নি, তাই ডিফল্ট কণ্ঠে পড়া হচ্ছে। / No Bangla voice
          was found on this device, so the default voice is used.
        </p>
      ) : null}
      {error ? <p style={{ color: '#b00020' }}>{error}</p> : null}

      {intro ? (
        <div style={{ marginBottom: 24 }}>
          {intro.split('\n\n').map((para, i) => (
            <p key={i} style={{ lineHeight: 1.7 }}>{para}</p>
          ))}
        </div>
      ) : null}

      <h3 style={{ fontSize: 19, margin: '24px 0 4px' }}>প্রশ্ন ও সহজ উত্তর / Questions &amp; simple answers</h3>
      <p style={{ color: '#555', fontSize: 14, margin: '0 0 16px' }}>
        এই প্রশ্নগুলো Eduvelto-র নিজস্ব অনুশীলনী প্রশ্ন — বোর্ড বা বিশ্ববিদ্যালয়ের পরীক্ষার প্রশ্ন
        নয়। / These are Eduvelto&apos;s own original practice questions — not board or
        university exam questions.
      </p>

      {lesson.questions.length === 0 ? (
        <p>এই পাঠে এখনো কোনো প্রশ্ন যোগ করা হয়নি। / No questions have been added to this lesson yet.</p>
      ) : (
        <ol style={{ paddingLeft: 20 }}>
          {lesson.questions.map((q) => {
            const isMcq = q.options.length > 0;
            const pick = picked[q.label];
            const show = revealed[q.label] === true;
            const answerText = q.answerBn || q.answer || q.correctText;
            return (
              <li key={q.label} style={{ marginBottom: 20 }}>
                <p style={{ margin: '0 0 8px', lineHeight: 1.6 }}>
                  <strong>{q.label}.</strong> {stripMd(q.question)}
                  {q.topic ? <span style={{ color: '#555', fontSize: 13 }}> ({q.topic})</span> : null}
                </p>
                {isMcq ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {q.options.map((opt) => {
                      const isCorrect = q.correctLetter !== '' && opt.letter === q.correctLetter;
                      const isPicked = pick === opt.letter;
                      const bg = pick
                        ? isCorrect
                          ? '#e6f4ea'
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
                          style={{ textAlign: 'left', padding: '10px 12px', minHeight: 44, borderRadius: 6, border: `1px solid ${isPicked ? '#0A1F44' : '#ccc'}`, background: bg, cursor: pick !== undefined ? 'default' : 'pointer', fontSize: 15 }}
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
                            <span style={{ color: '#137333' }}>সঠিক! / Correct!</span>
                          ) : (
                            <span>
                              সঠিক উত্তর: <strong>{q.correctLetter}) {q.correctText}</strong>
                            </span>
                          )
                        ) : null}
                        {q.answerBn ? <span style={{ display: 'block', marginTop: 4 }}>{q.answerBn}</span> : null}
                        {q.explanation ? <span style={{ display: 'block', marginTop: 4, color: '#555' }}>{q.explanation}</span> : null}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <div>
                    <button
                      type="button"
                      onClick={() => setRevealed((r) => ({ ...r, [q.label]: !r[q.label] }))}
                      style={{ padding: '8px 14px', minHeight: 40, borderRadius: 6, border: '1px solid #0A1F44', background: '#fff', color: '#0A1F44', cursor: 'pointer', fontSize: 14 }}
                    >
                      {show ? 'উত্তর লুকান / Hide answer' : 'সহজ উত্তর দেখুন / Show simple answer'}
                    </button>
                    {show ? (
                      <div style={{ marginTop: 8, padding: '12px', background: '#f7f9fc', borderRadius: 6, lineHeight: 1.7 }}>
                        {answerText ? <p style={{ margin: '0 0 8px' }}>{answerText}</p> : null}
                        {q.explanation ? <p style={{ margin: 0, color: '#555' }}>{q.explanation}</p> : null}
                        {!answerText && !q.explanation ? <p style={{ margin: 0 }}>উত্তর যোগ করা হয়নি। / No answer added yet.</p> : null}
                      </div>
                    ) : null}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}

      <div style={{ marginTop: 28, padding: '16px', border: '1px solid #ddd', borderRadius: 8, background: '#fafafa' }}>
        {user ? (
          completed ? (
            <p style={{ margin: 0, color: '#137333' }}>
              ✓ পড়া শেষ হিসেবে সংরক্ষণ করা হয়েছে — আপনার অগ্রগতি পাতায় দেখা যাবে। / Saved as
              read — see your Progress page.
            </p>
          ) : (
            <>
              <p style={{ margin: '0 0 12px' }}>
                এই পাঠে আপনি {attemptedCount}টি প্রশ্ন চেষ্টা করেছেন
                {attemptedCount > 0 ? `, এর মধ্যে ${correctCount}টি MCQ সঠিক হয়েছে` : ''}।
                / You tried {attemptedCount} questions in this lesson
                {attemptedCount > 0 ? `, ${correctCount} MCQ correct` : ''}.
              </p>
              <button
                type="button"
                onClick={() => void completeLesson()}
                disabled={completeBusy}
                style={{ padding: '12px 20px', minHeight: 48, borderRadius: 6, border: 'none', background: '#0A1F44', color: '#fff', cursor: 'pointer', fontSize: 16 }}
              >
                পড়া শেষ করেছি / Mark lesson complete
              </button>
            </>
          )
        ) : (
          <p style={{ margin: 0 }}>
            <Link to="/login">লগইন করুন</Link> — তাহলে আপনার পড়া ও অগ্রগতি সংরক্ষণ করা হবে। /{' '}
            <Link to="/login">Log in</Link> to save your reading and progress.
          </p>
        )}
      </div>
    </div>
  );
}
