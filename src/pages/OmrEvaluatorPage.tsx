// Eduvelto — OMR Evaluator (Turn 32): browser-based scoring.
//
// 10–100 MCQs. The teacher pastes the Answer Key (letters, e.g.
// "C A B D ...") or loads the last generated paper's key, then marks
// each student's answers on the bubble grid. Configurable negative
// marking (0, -0.25, -0.50, -1.0). Instant score + answered / correct
// / wrong / blank breakdown + multiple-mark detection (a question with
// two marks counts as wrong and is flagged).
//
// Mobile-camera OMR scanning is PHASE 2 — not built here (see the MVP
// report). This page scores hand-entered answers only. No login, no
// Firestore — everything runs in the browser.

import { useState } from 'react';
import { PageShell } from '../components/PageShell';
import { AlertBox, Button, Card, Chip } from '../components/ui';
import {
  QPG_NEGATIVE_MARKING_OPTIONS,
  evaluateOmr,
  parseOmrKey,
  validateOmrRun,
  type QpgNegativeMarking,
  type QpgOmrMark,
  type QpgOmrResult,
} from '../lib/omrEvaluator';

const QPG_LAST_KEY_STORAGE = 'eduvelto-qpg-last-key';

function loadLastKey(): { title: string; answerKey: Array<'A' | 'B' | 'C' | 'D'> } | null {
  try {
    if (typeof sessionStorage === 'undefined') return null;
    const raw = sessionStorage.getItem(QPG_LAST_KEY_STORAGE);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { title?: string; answerKey?: unknown };
    if (typeof parsed.title !== 'string' || !Array.isArray(parsed.answerKey)) return null;
    return { title: parsed.title, answerKey: parsed.answerKey as Array<'A' | 'B' | 'C' | 'D'> };
  } catch {
    return null;
  }
}

export default function OmrEvaluatorPage() {
  const [keyText, setKeyText] = useState('');
  const [keySource, setKeySource] = useState('');
  const [negative, setNegative] = useState<QpgNegativeMarking>(-0.25);
  const [marks, setMarks] = useState<QpgOmrMark[]>([]);
  const [result, setResult] = useState<QpgOmrResult | null>(null);
  const [error, setError] = useState('');

  const key = parseOmrKey(keyText);

  const loadKey = (letters: Array<'A' | 'B' | 'C' | 'D'>, source: string) => {
    setKeyText(letters.join(' '));
    setKeySource(source);
    setMarks(letters.map(() => ''));
    setResult(null);
    setError('');
  };

  const toggleMark = (i: number, letter: 'A' | 'B' | 'C' | 'D') => {
    setMarks((prev) => {
      const next = [...prev];
      const cur = next[i] ?? '';
      if (cur === letter) next[i] = '';
      else if (cur === '') next[i] = letter;
      else if (cur === 'MULTI') next[i] = letter;
      else next[i] = 'MULTI'; // second, different mark -> multiple-mark
      return next;
    });
    setResult(null);
  };

  const runEvaluation = () => {
    const problems = validateOmrRun(key, marks);
    if (problems.length > 0) {
      setError(problems.join(' '));
      return;
    }
    setError('');
    setResult(evaluateOmr({ answerKey: key, marks, negativeMarking: negative }));
  };

  return (
    <PageShell titleBn="OMR মূল্যায়ন" titleEn="OMR Evaluator" wide>
      <p style={{ fontSize: 14, lineHeight: 1.7 }}>
        <strong>সম্পূর্ণ ফ্রি — সবার জন্য, কোনো Pro লাগে না।</strong> ১০–১০০টি MCQ-এর উত্তরপত্র মূল্যায়ন
        করুন — যাচাই ১০০% ব্রাউজারেই হয়, সার্ভার খরচ শূন্য। মোবাইল ক্যামেরায় OMR স্ক্যান করা Phase 2-এ
        আসবে; এখানে উত্তর হাতে বসাতে হয়।
      </p>

      <Card style={{ marginBottom: 16 }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 16 }}>১. Answer Key বসান</h2>
        <label style={{ fontSize: 13, display: 'block' }}>
          সঠিক উত্তরগুলো লিখুন (যেমন: C A B D … অথবা CABD…)
          <textarea
            value={keyText}
            onChange={(e) => {
              setKeyText(e.target.value);
              setMarks(parseOmrKey(e.target.value).map(() => ''));
              setResult(null);
            }}
            rows={3}
            placeholder="C A B D A …"
            style={{ width: '100%', padding: 8, boxSizing: 'border-box', marginTop: 4 }}
          />
        </label>
        <p style={{ fontSize: 13, margin: '8px 0' }}>
          Key-তে প্রশ্ন: <strong>{key.length}টি</strong>
          {keySource ? ` (উৎস: ${keySource})` : ''}
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const last = loadLastKey();
              if (last) loadKey(last.answerKey, `শেষ তৈরি পেপার: ${last.title}`);
              else setError('শেষ তৈরি পেপারের Key পাওয়া যায়নি — আগে জেনারেটরে একটি পেপার তৈরি করুন।');
            }}
          >
            শেষ তৈরি পেপারের Key লোড করুন
          </Button>
        </div>
        <label style={{ fontSize: 13, display: 'block', marginTop: 12 }}>
          নেগেটিভ মার্কিং (প্রতি ভুল উত্তরে)
          <select
            value={String(negative)}
            onChange={(e) => setNegative(Number(e.target.value) as QpgNegativeMarking)}
            style={{ display: 'block', marginTop: 4, padding: 8 }}
          >
            {QPG_NEGATIVE_MARKING_OPTIONS.map((n) => (
              <option key={n} value={String(n)}>
                {n === 0 ? '০ (নেই)' : String(n)}
              </option>
            ))}
          </select>
        </label>
      </Card>

      {key.length > 0 ? (
        <Card style={{ marginBottom: 16 }}>
          <h2 style={{ margin: '0 0 8px', fontSize: 16 }}>২. ছাত্রের উত্তর বসান (বাবল গ্রিড)</h2>
          <p style={{ fontSize: 12, color: '#666', margin: '0 0 10px' }}>
            প্রতিটি প্রশ্নে একটি বাবল চাপুন। একই প্রশ্নে দুটি বাবল চাপলে “একাধিক দাগ” ধরা হবে (ভুল হিসেবে
            গণনা + চিহ্নিত)।
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
            {key.map((_, i) => (
              <div key={i} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                  {i + 1}. {marks[i] === 'MULTI' ? <Chip tone="gold">একাধিক দাগ</Chip> : null}
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {(['A', 'B', 'C', 'D'] as const).map((letter) => {
                    const selected = marks[i] === letter || marks[i] === 'MULTI';
                    return (
                      <button
                        key={letter}
                        type="button"
                        onClick={() => toggleMark(i, letter)}
                        aria-pressed={selected}
                        style={{
                          width: 30, height: 30, borderRadius: '50%',
                          border: '2px solid #111',
                          background: selected ? '#1a4d8f' : '#fff',
                          color: selected ? '#fff' : '#111',
                          fontWeight: 700, cursor: 'pointer',
                        }}
                      >
                        {letter}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => {
                      setMarks((prev) => {
                        const next = [...prev];
                        next[i] = '';
                        return next;
                      });
                      setResult(null);
                    }}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 12 }}
                  >
                    ফাঁকা
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12 }}>
            <Button onClick={runEvaluation}>ফল দেখুন</Button>
          </div>
          {error ? <AlertBox tone="error">{error}</AlertBox> : null}
        </Card>
      ) : null}

      {result ? (
        <Card style={{ marginBottom: 16 }}>
          <h2 style={{ margin: '0 0 8px', fontSize: 16 }}>ফলাফল</h2>
          <p style={{ fontSize: 16, margin: '0 0 8px' }}>
            স্কোর: <strong>{result.score}</strong> / {result.maxScore} ({result.percent.toFixed(1)}%)
          </p>
          <p style={{ fontSize: 14, margin: '0 0 8px' }}>
            উত্তর দিয়েছে {result.answered}টি • সঠিক {result.correct}টি • ভুল {result.wrong}টি • ফাঁকা{' '}
            {result.blank}টি • একাধিক দাগ {result.multipleMarked}টি
            {result.multipleMarkedNumbers.length > 0
              ? ` (প্রশ্ন নং: ${result.multipleMarkedNumbers.join(', ')})`
              : ''}
          </p>
          <div style={{ fontSize: 13, maxHeight: 240, overflowY: 'auto' }}>
            {result.perQuestion.map((r) => (
              <div key={r.number}>
                {r.number}. {r.state === 'correct' ? '✓ সঠিক' : r.state === 'blank' ? '— ফাঁকা' : r.state === 'multi' ? '⚠ একাধিক দাগ (ভুল)' : `✗ ভুল (দিয়েছে ${r.mark}, সঠিক ${r.correctLetter})`}
              </div>
            ))}
          </div>
        </Card>
      ) : null}
    </PageShell>
  );
}
