// Eduvelto — AI Grammar Checker & Paraphraser tool UI (28 Nov 2026, global batch item 2).
//
// Textarea input + language selector (English, Bangla + the site's other
// 8 languages) + two modes (Correct / Paraphrase), via askAssistant().
// The corrected/paraphrased text is shown as-is; the model is asked to
// reply with only the result, no explanation. AI failures show a clear
// bn/en message + retry guidance — never a canned answer presented as
// the AI's. Renders inside ToolsDetailPage's PageShell (no own h1).
import { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { getProviderStatus } from '../../lib/aiProviders';
import {
  AI_GRAMMAR_LANGUAGES,
  aiFailureText,
  grammarPrompt,
} from '../../lib/tools/aiTools';
import { aiQuotaRemaining, askAiQuestion } from '../../lib/aiQuota';
import {
  ToolHero, CopyButton, ButtonRow, ClearButton, ExampleButton,
  AiLimitLine, AiQuotaNotice,
  inputStyle, labelStyle, cardStyle, noteStyle,
  primaryButtonStyle, buttonStyle, activeButtonStyle,
} from './toolUi';

const errorStyle: React.CSSProperties = { color: '#b3261e', fontSize: 14, marginTop: 12 };

const EXAMPLES: Record<string, { correct: string; paraphrase: string }> = {
  en: {
    correct: 'She go to school everyday and she dont like maths.',
    paraphrase: 'Online learning gives students the freedom to study from anywhere.',
  },
  bn: {
    correct: 'আমি গতকাল বাজারে গিয়ে অনেক কিছু কিনেছি।',
    paraphrase: 'বই পড়া মানুষের জ্ঞান বাড়ায় এবং চিন্তা শক্তিশালী করে।',
  },
};

export function AiGrammarCheckerTool() {
  const { t, lang } = useLanguage();
  // AI prompts only take bn|en: any other UI language falls back
  // to English (same fallback as t()).
  const aiLang: 'bn' | 'en' = lang === 'bn' ? 'bn' : 'en';
  const connected = getProviderStatus() === 'ready';
  const [text, setText] = useState('');
  const [language, setLanguage] = useState('en');
  const [mode, setMode] = useState<'correct' | 'paraphrase'>('correct');
  const [result, setResult] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Owner rule 3: 10 free AI questions/day, shared across the 4 AI
  // tools; quota exhaustion shows the friendly message, never red.
  const [remaining, setRemaining] = useState(() => aiQuotaRemaining());
  const [quotaHit, setQuotaHit] = useState(false);
  const [cachedResult, setCachedResult] = useState(false);

  const languageName =
    AI_GRAMMAR_LANGUAGES.find((l) => l.code === language)?.name ?? 'English';

  async function handleRun(): Promise<void> {
    const input = text.trim();
    if (input === '' || busy) return;
    setBusy(true);
    setError(null);
    setQuotaHit(false);
    setResult('');
    setCachedResult(false);
    const { result, cached } = await askAiQuestion(
      grammarPrompt(input, mode, languageName),
      aiLang,
    );
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

  function loadExample(): void {
    const example = EXAMPLES[language] ?? EXAMPLES.en;
    setText(mode === 'correct' ? example.correct : example.paraphrase);
    setResult('');
    setError(null);
  }

  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="ai-grammar-checker-title">
      <ToolHero
        titleBn="এআই ব্যাকরণ পরীক্ষক ও পুনর্লেখক"
        titleEn="AI Grammar Checker & Paraphraser"
        descBn="ইংরেজি, বাংলা ও আরও ভাষায় লেখার ভুল শুধরে নিন বা নতুন করে সাজান — AI দিয়ে, বিনামূল্যে।"
        descEn="Fix grammar mistakes or paraphrase your writing in English, Bangla and more languages — free, with AI."
        chipBn="AI দিয়ে সংশোধন • ১০টি ভাষা"
        chipEn="AI correction • 10 languages"
      />
      <AiLimitLine remaining={remaining} />
      {quotaHit || remaining === 0 ? <AiQuotaNotice /> : null}
      {!connected ? (
        <p style={errorStyle} role="alert">
          {t({
            bn: 'লাইভ AI সংযুক্ত নেই — ব্যাকরণ পরীক্ষা এখন চলবে না। পরে আবার চেষ্টা করুন।',
            en: 'Live AI is not connected — the grammar check will not run right now. Please try again later.',
          })}
        </p>
      ) : null}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <button
          type="button"
          style={mode === 'correct' ? activeButtonStyle : buttonStyle}
          onClick={() => { setMode('correct'); setResult(''); }}
        >
          {t({ bn: 'সংশোধন করুন', en: 'Correct' })}
        </button>
        <button
          type="button"
          style={mode === 'paraphrase' ? activeButtonStyle : buttonStyle}
          onClick={() => { setMode('paraphrase'); setResult(''); }}
        >
          {t({ bn: 'পুনর্লেখন করুন', en: 'Paraphrase' })}
        </button>
      </div>
      <div>
        <label style={labelStyle} htmlFor="ai-grammar-language">{t({ bn: 'ভাষা', en: 'Language' })}</label>
        <select
          id="ai-grammar-language"
          style={{ ...inputStyle, minHeight: 44, resize: 'none' }}
          value={language}
          onChange={(e) => { setLanguage(e.target.value); setResult(''); }}
        >
          {AI_GRAMMAR_LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>
              {lang === 'bn' ? l.labelBn : l.labelEn}
            </option>
          ))}
        </select>
      </div>
      <div style={{ marginTop: 12 }}>
        <label style={labelStyle} htmlFor="ai-grammar-input">
          {mode === 'correct'
            ? t({ bn: 'আপনার লেখা', en: 'Your text' })
            : t({ bn: 'পুনর্লেখন করার লেখা', en: 'Text to paraphrase' })}
        </label>
        <textarea
          id="ai-grammar-input"
          style={inputStyle}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={mode === 'correct'
            ? t({ bn: 'যেমন: She go to school everyday…', en: 'E.g. She go to school everyday…' })
            : t({ bn: 'যে লেখাটি নতুন করে সাজাতে চান তা লিখুন।', en: 'Write the text you want rewritten.' })}
        />
      </div>
      <ButtonRow>
        <button type="button" style={primaryButtonStyle} onClick={() => void handleRun()} disabled={!connected || busy || text.trim() === '' || remaining === 0}>
          {busy
            ? t({ bn: 'AI কাজ করছে…', en: 'AI is working…' })
            : mode === 'correct'
              ? t({ bn: 'ভুল শুধরে নিন', en: 'Check grammar' })
              : t({ bn: 'পুনর্লেখন করুন', en: 'Paraphrase' })}
        </button>
        <ExampleButton onLoad={loadExample} />
        <ClearButton onClear={() => { setText(''); setResult(''); setError(null); }} disabled={text === '' && result === ''} />
      </ButtonRow>
      {error ? <p style={errorStyle} role="alert">{error}</p> : null}
      {result ? (
        <div style={{ marginTop: 16 }}>
          <label style={labelStyle} htmlFor="ai-grammar-output">
            {mode === 'correct'
              ? t({ bn: 'সংশোধিত লেখা', en: 'Corrected text' })
              : t({ bn: 'পুনর্লিখিত লেখা', en: 'Paraphrased text' })}
          </label>
          <textarea id="ai-grammar-output" style={{ ...inputStyle, minHeight: 120 }} value={result} readOnly />
          {cachedResult ? (
            <p style={noteStyle}>
              {t({ bn: 'সংরক্ষিত উত্তর — আজকের প্রশ্ন খরচ হয়নি।', en: 'Cached answer — no question used today.' })}
            </p>
          ) : null}
          <ButtonRow>
            <CopyButton text={result} labelBn="ফলাফল কপি করুন" labelEn="Copy result" />
          </ButtonRow>
        </div>
      ) : null}
      <p style={noteStyle}>
        {t({
          bn: 'AI মাঝে মাঝে ভুল করে — গুরুত্বপূর্ণ লেখা (আবেদন, পরীক্ষা, অফিসের কাজ) জমা দেওয়ার আগে নিজে মিলিয়ে নিন। আপনার লেখা AI সেবায় পাঠানো হয় — ব্যক্তিগত তথ্য লিখবেন না।',
          en: 'AI sometimes makes mistakes — check the result yourself before submitting important writing (applications, exams, office work). Your text is sent to the AI service — do not write personal information.',
        })}
      </p>
    </section>
  );
}
