// Eduvelto — AI Homework & Step-by-Step Math Solver tool UI (28 Nov 2026, global batch item 2).
//
// Text input of the problem (TEXT ONLY — no image upload in this batch),
// step-by-step solution via askAssistant(). A PERMANENT visible label
// "AI উত্তর ভুল হতে পারে — যাচাই করে নিন" / "AI answers can be wrong —
// please verify." is always on screen, above the form and above the
// result. The solution is never presented as guaranteed correct.
// AI failures show a clear bn/en message + retry guidance — never a
// canned answer presented as the AI's. Renders inside ToolsDetailPage's
// PageShell (no own h1).
import { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { getProviderStatus } from '../../lib/aiProviders';
import { aiFailureText, mathPrompt } from '../../lib/tools/aiTools';
import { aiQuotaRemaining, askAiQuestion } from '../../lib/aiQuota';
import {
  ToolHero, CopyButton, ButtonRow, ClearButton, ExampleButton,
  AiLimitLine, AiQuotaNotice,
  inputStyle, labelStyle, cardStyle, noteStyle, primaryButtonStyle,
} from './toolUi';

const errorStyle: React.CSSProperties = { color: '#b3261e', fontSize: 14, marginTop: 12 };

const warningStyle: React.CSSProperties = {
  background: '#fff8e1',
  border: '1px solid #e6a700',
  borderRadius: 8,
  padding: '10px 12px',
  fontSize: 14,
  fontWeight: 700,
  color: '#7a5200',
  margin: '0 0 12px',
};

const EXAMPLE_BN = 'x-এর মান নির্ণয় করো: 2x + 6 = 14';
const EXAMPLE_EN = 'Find the value of x: 2x + 6 = 14';

export function AiMathSolverTool() {
  const { t, lang } = useLanguage();
  // AI prompts only take bn|en: any other UI language falls back
  // to English (same fallback as t()).
  const aiLang: 'bn' | 'en' = lang === 'bn' ? 'bn' : 'en';
  const connected = getProviderStatus() === 'ready';
  const [problem, setProblem] = useState('');
  const [result, setResult] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Owner rule 3: 10 free AI questions/day, shared across the 4 AI
  // tools; quota exhaustion shows the friendly message, never red.
  const [remaining, setRemaining] = useState(() => aiQuotaRemaining());
  const [quotaHit, setQuotaHit] = useState(false);
  const [cachedResult, setCachedResult] = useState(false);

  async function handleSolve(): Promise<void> {
    const input = problem.trim();
    if (input === '' || busy) return;
    setBusy(true);
    setError(null);
    setQuotaHit(false);
    setResult('');
    setCachedResult(false);
    const { result, cached } = await askAiQuestion(mathPrompt(input, aiLang), aiLang);
    setBusy(false);
    setRemaining(aiQuotaRemaining());
    if (result.kind !== 'ai') {
      if (result.kind === 'quota-exhausted') setQuotaHit(true);
      else setError(aiFailureText(result, aiLang));
      return;
    }
    setResult(result.text.trim());
    setCachedResult(cached);
  }

  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="ai-math-solver-title">
      <ToolHero
        titleBn="এআই হোমওয়ার্ক ও গণিত সমাধানকারী"
        titleEn="AI Homework & Math Solver"
        descBn="গণিত ও হোমওয়ার্কের সমস্যা লিখুন — AI ধাপে ধাপে সমাধান দেখাবে। উত্তর যাচাই করে নিন।"
        descEn="Type a maths or homework problem and get a step-by-step AI solution. Always verify the answer."
        chipBn="ধাপে ধাপে সমাধান • শুধু লেখা — ছবি নয়"
        chipEn="Step-by-step solution • Text only — no photos"
      />
      {/* Permanent warning: always visible, never dismissible. */}
      <p style={warningStyle} role="note">
        {t({
          bn: '⚠ AI উত্তর ভুল হতে পারে — যাচাই করে নিন',
          en: '⚠ AI answers can be wrong — please verify.',
        })}
      </p>
      <AiLimitLine remaining={remaining} />
      {quotaHit || remaining === 0 ? <AiQuotaNotice /> : null}
      {!connected ? (
        <p style={errorStyle} role="alert">
          {t({
            bn: 'লাইভ AI সংযুক্ত নেই — সমাধান এখন চলবে না। পরে আবার চেষ্টা করুন।',
            en: 'Live AI is not connected — the solver will not run right now. Please try again later.',
          })}
        </p>
      ) : null}
      <div>
        <label style={labelStyle} htmlFor="ai-math-problem">{t({ bn: 'সমস্যাটি লিখুন', en: 'Write the problem' })}</label>
        <textarea
          id="ai-math-problem"
          style={inputStyle}
          value={problem}
          onChange={(e) => setProblem(e.target.value)}
          placeholder={t({ bn: 'যেমন: 2x + 6 = 14 হলে x-এর মান কত?', en: 'E.g. If 2x + 6 = 14, what is x?' })}
        />
      </div>
      <ButtonRow>
        <button type="button" style={primaryButtonStyle} onClick={() => void handleSolve()} disabled={!connected || busy || problem.trim() === '' || remaining === 0}>
          {busy
            ? t({ bn: 'সমাধান করা হচ্ছে…', en: 'Solving…' })
            : t({ bn: 'ধাপে ধাপে সমাধান করুন', en: 'Solve step by step' })}
        </button>
        <ExampleButton onLoad={() => { setProblem(lang === 'bn' ? EXAMPLE_BN : EXAMPLE_EN); setResult(''); setError(null); }} />
        <ClearButton onClear={() => { setProblem(''); setResult(''); setError(null); }} disabled={problem === '' && result === ''} />
      </ButtonRow>
      {error ? <p style={errorStyle} role="alert">{error}</p> : null}
      {result ? (
        <div style={{ marginTop: 16 }}>
          <p style={warningStyle} role="note">
            {t({
              bn: '⚠ AI উত্তর ভুল হতে পারে — যাচাই করে নিন',
              en: '⚠ AI answers can be wrong — please verify.',
            })}
          </p>
          <label style={labelStyle} htmlFor="ai-math-output">{t({ bn: 'ধাপে ধাপে সমাধান', en: 'Step-by-step solution' })}</label>
          <textarea id="ai-math-output" style={{ ...inputStyle, minHeight: 220 }} value={result} readOnly />
          {cachedResult ? (
            <p style={noteStyle}>
              {t({ bn: 'সংরক্ষিত উত্তর — আজকের প্রশ্ন খরচ হয়নি।', en: 'Cached answer — no question used today.' })}
            </p>
          ) : null}
          <ButtonRow>
            <CopyButton text={result} labelBn="সমাধান কপি করুন" labelEn="Copy solution" />
          </ButtonRow>
        </div>
      ) : null}
      <p style={noteStyle}>
        {t({
          bn: 'এই টুলে শুধু লেখা দিয়ে সমস্যা লিখতে হয় — ছবি আপলোড করা যায় না। সমাধানের প্রতিটি ধাপ নিজে মিলিয়ে নিন; পরীক্ষার উত্তরে ব্যবহারের আগে বই বা শিক্ষকের সঙ্গে যাচাই করুন। আপনার লেখা AI সেবায় পাঠানো হয় — ব্যক্তিগত তথ্য লিখবেন না।',
          en: 'This tool takes problems as text only — photo upload is not available. Check every step yourself; verify with your book or teacher before using the answer in an exam. Your text is sent to the AI service — do not write personal information.',
        })}
      </p>
    </section>
  );
}
