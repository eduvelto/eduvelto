// Eduvelto — AI PDF Summarizer & Q&A tool UI (28 Nov 2026, global batch item 2).
//
// Upload a PDF -> extract its text IN THE BROWSER with extractPdfText()
// (same lazy pdf.js path as PDF to Word; the file never leaves the device)
// -> summarise via Gemini through askAssistant(). Long texts are CHUNKED
// (see src/lib/tools/aiTools.ts): at most 10 chunks (~15,000 chars) are
// summarised, and longer PDFs say so plainly. Q&A answers only from a
// budgeted excerpt of the document; the model is told to say when the
// answer is not in the text instead of guessing. Scanned/image PDFs are
// refused with the same honest wording as PDF to Word.
//
// The summary can be downloaded as a .txt — through <RewardedAdButton>
// (same pattern as PDF to Word): a 30-second rewarded ad once AdSense
// is approved; while AdSense is in review the free-download path stays
// live, never a fake timer. Renders inside ToolsDetailPage's PageShell
// (no own h1). AI failures show a clear bn/en message + retry guidance;
// nothing canned is ever shown as if the AI produced it.
import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { getProviderStatus } from '../../lib/aiProviders';
import {
  AI_QA_MAX_CHUNKS,
  AI_SUMMARY_MAX_CHUNKS,
  aiFailureText,
  chunkTextForAi,
  pdfQaPrompt,
  pickRelevantChunks,
  summaryChunkPrompt,
  summaryCombinePrompt,
} from '../../lib/tools/aiTools';
import {
  aiConsumeQuestion,
  aiQuotaRemaining,
  askAiCached,
  askAiQuestion,
} from '../../lib/aiQuota';
import {
  extractPdfText,
  PDF_TO_WORD_MAX_MB,
  PDF_TO_WORD_MIN_TEXT_CHARS,
  triggerBlobDownload,
  type ExtractedPdfText,
} from '../../lib/tools/pdfToWord';
import { isPdfFile } from '../../lib/tools/pdfToJpg';
import RewardedAdButton from '../../components/RewardedAdButton';
import { useRewardedAd } from '../../lib/rewardedAd';
import {
  ToolHero, CopyButton, ButtonRow, ClearButton, ExampleButton,
  AiLimitLine, AiQuotaNotice,
  inputStyle, shortInputStyle, labelStyle, cardStyle, noteStyle,
  primaryButtonStyle,
} from './toolUi';

const errorStyle: React.CSSProperties = { color: '#b3261e', fontSize: 14, marginTop: 12 };

export function AiPdfSummarizerTool() {
  const { t, lang } = useLanguage();
  // AI prompts + RewardedAdButton only take bn|en: any other UI
  // language falls back to English (same fallback as t()).
  const aiLang: 'bn' | 'en' = lang === 'bn' ? 'bn' : 'en';
  const { available: rewardedAdAvailable } = useRewardedAd();
  const connected = getProviderStatus() === 'ready';
  const [file, setFile] = useState<File | null>(null);
  const [extracted, setExtracted] = useState<ExtractedPdfText | null>(null);
  const [fullText, setFullText] = useState('');
  const [summary, setSummary] = useState('');
  const [summaryNote, setSummaryNote] = useState('');
  const [question, setQuestion] = useState('');
  const [qaPairs, setQaPairs] = useState<Array<{ q: string; a: string; cached: boolean }>>([]);
  const [busy, setBusy] = useState(false);
  const [busyWhat, setBusyWhat] = useState('');
  const [error, setError] = useState<string | null>(null);
  // Owner rule 3: 10 free AI questions/day, shared across the 4 AI
  // tools; quota exhaustion shows the friendly message, never red.
  const [remaining, setRemaining] = useState(() => aiQuotaRemaining());
  const [quotaHit, setQuotaHit] = useState(false);
  const [cachedSummary, setCachedSummary] = useState(false);
  const urlsRef = useRef<string[]>([]);

  useEffect(() => {
    const urls = urlsRef.current;
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);

  function resetAi(): void {
    setSummary('');
    setSummaryNote('');
    setQaPairs([]);
    setCachedSummary(false);
  }

  async function handleFile(next: File | null): Promise<void> {
    setError(null);
    setExtracted(null);
    setFullText('');
    resetAi();
    if (!next) {
      setFile(null);
      return;
    }
    if (!isPdfFile(next, next.name)) {
      setFile(null);
      setError('not-pdf');
      return;
    }
    if (next.size > PDF_TO_WORD_MAX_MB * 1024 * 1024) {
      setFile(null);
      setError('too-big');
      return;
    }
    setFile(next);
    setBusy(true);
    setBusyWhat('read');
    try {
      const text = await extractPdfText(next);
      setExtracted(text);
      if (text.totalChars < PDF_TO_WORD_MIN_TEXT_CHARS) {
        setError('no-text');
        return;
      }
      setFullText(text.pages.flatMap((p) => p.lines).join('\n'));
    } catch (e) {
      const message = e instanceof Error ? e.message : 'failed';
      setError(
        message.includes('password-protected')
          ? 'password-protected'
          : message.includes('Could not read')
            ? 'unreadable'
            : message.includes('pages — this tool converts')
              ? 'too-many-pages'
              : 'failed',
      );
    } finally {
      setBusy(false);
      setBusyWhat('');
    }
  }

  async function handleSummarize(): Promise<void> {
    if (!fullText || busy) return;
    // One user action = one daily question (owner rule 3a): the
    // chunk calls inside use the cache only, never the budget.
    if (!aiConsumeQuestion()) {
      setQuotaHit(true);
      return;
    }
    setQuotaHit(false);
    setBusy(true);
    setBusyWhat('summary');
    setError(null);
    setSummary('');
    setSummaryNote('');
    setCachedSummary(false);
    try {
      const chunks = chunkTextForAi(fullText);
      const useChunks = chunks.slice(0, AI_SUMMARY_MAX_CHUNKS);
      const parts: string[] = [];
      let allCached = true;
      for (let i = 0; i < useChunks.length; i++) {
        const result = await askAiCached(summaryChunkPrompt(useChunks[i], aiLang), aiLang);
        if (result.kind !== 'ai') {
          if (result.kind === 'quota-exhausted') setQuotaHit(true);
          else setError(aiFailureText(result, aiLang));
          return;
        }
        allCached = allCached && result.cached;
        parts.push(result.text);
      }
      if (parts.length === 1) {
        setSummary(parts[0]);
      } else {
        const combined = parts.join('\n\n');
        const result = await askAiCached(
          summaryCombinePrompt(combined.slice(0, 1500), aiLang),
          aiLang,
        );
        if (result.kind !== 'ai') {
          // The part-summaries are real AI output — show them rather
          // than nothing when only the combine step fails.
          setSummary(parts.join('\n\n'));
          if (result.kind === 'quota-exhausted') setQuotaHit(true);
          else setError(aiFailureText(result, aiLang));
          return;
        }
        allCached = allCached && result.cached;
        setSummary(result.text);
      }
      setCachedSummary(allCached);
      if (chunks.length > AI_SUMMARY_MAX_CHUNKS) {
        setSummaryNote(
          lang === 'bn'
            ? `এই পিডিএফের লেখা অনেক বড় — প্রথম ${AI_SUMMARY_MAX_CHUNKS}টি অংশের (প্রায় ১৫,০০০ অক্ষর) সারাংশ দেওয়া হয়েছে, পুরো ফাইল নয়।`
            : `This PDF is very long — the summary covers the first ${AI_SUMMARY_MAX_CHUNKS} parts (about 15,000 characters), not the whole file.`,
        );
      }
      setRemaining(aiQuotaRemaining());
    } finally {
      setBusy(false);
      setBusyWhat('');
      setRemaining(aiQuotaRemaining());
    }
  }

  async function handleAsk(): Promise<void> {
    const q = question.trim();
    if (!q || !fullText || busy) return;
    setBusy(true);
    setBusyWhat('qa');
    setError(null);
    setQuotaHit(false);
    try {
      const excerpt = pickRelevantChunks(fullText, q, AI_QA_MAX_CHUNKS).join('\n\n');
      const { result, cached } = await askAiQuestion(pdfQaPrompt(excerpt, q, aiLang), aiLang);
      if (result.kind !== 'ai') {
        if (result.kind === 'quota-exhausted') setQuotaHit(true);
        else setError(aiFailureText(result, aiLang));
        return;
      }
      setQaPairs((prev) => [...prev, { q, a: result.text, cached }]);
      setQuestion('');
      setRemaining(aiQuotaRemaining());
    } finally {
      setBusy(false);
      setBusyWhat('');
      setRemaining(aiQuotaRemaining());
    }
  }

  function handleDownloadSummary(): void {
    if (!summary) return;
    const blob = new Blob([summary], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    urlsRef.current.push(url);
    triggerBlobDownload(url, `${(file?.name ?? 'summary').replace(/\.pdf$/i, '')}-summary.txt`);
  }

  const hasText = extracted !== null && extracted.totalChars >= PDF_TO_WORD_MIN_TEXT_CHARS;

  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="ai-pdf-summarizer-title">
      <ToolHero
        titleBn="এআই পিডিএফ সারাংশ ও প্রশ্নোত্তর"
        titleEn="AI PDF Summarizer & Q&A"
        descBn="পিডিএফ আপলোড করে AI দিয়ে সারাংশ নিন আর নথি নিয়ে প্রশ্ন করুন — লেখা আপনার ব্রাউজারেই পড়া হয়।"
        descEn="Upload a PDF, get an AI summary with key points, and ask questions about the document — text is read in your browser."
        chipBn="AI দিয়ে সারাংশ • ফাইল আপলোড হয় না"
        chipEn="AI summary • File is never uploaded"
      />
      <AiLimitLine remaining={remaining} />
      {quotaHit || remaining === 0 ? <AiQuotaNotice /> : null}
      {!connected ? (
        <p style={errorStyle} role="alert">
          {t({
            bn: 'লাইভ AI সংযুক্ত নেই — সারাংশ ও প্রশ্নোত্তর এখন চলবে না। পরে আবার চেষ্টা করুন।',
            en: 'Live AI is not connected — summary and Q&A will not run right now. Please try again later.',
          })}
        </p>
      ) : null}
      <div>
        <label style={labelStyle} htmlFor="ai-pdf-file">{t({ bn: 'পিডিএফ ফাইল', en: 'PDF file' })}</label>
        <input
          id="ai-pdf-file"
          style={inputStyle}
          type="file"
          accept="application/pdf,.pdf"
          onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
        />
      </div>
      <p style={noteStyle}>
        {t({
          bn: 'সীমা: সর্বোচ্চ ১০ MB, সর্বোচ্চ ৫০ পাতা। স্ক্যান করা বা ছবির পিডিএফ পড়া যায় না — সেগুলোতে পড়ার মতো লেখা থাকে না।',
          en: 'Limits: up to 10 MB, up to 50 pages. Scanned or image PDFs cannot be read — they have no readable text layer.',
        })}
      </p>
      {extracted ? (
        <p style={noteStyle} role="status">
          {t({ bn: 'এই পিডিএফে মোট পাতা: ', en: 'This PDF has ' })}
          {extracted.pageCount}
          {t({ bn: 'টি, মোট অক্ষর: ', en: ' page(s), ' })}
          {extracted.totalChars.toLocaleString()}
          {t({ bn: 'টি।', en: ' characters in total.' })}
        </p>
      ) : null}
      {error ? (
        <p style={errorStyle} role="alert">
          {error === 'not-pdf'
            ? t({ bn: 'শুধু পিডিএফ ফাইল চলবে — একটি .pdf ফাইল বাছুন।', en: 'Only PDF files work — choose a .pdf file.' })
            : error === 'too-big'
              ? t({ bn: 'ফাইলটি ১০ MB-এর বেশি — ছোট পিডিএফ বাছুন।', en: 'The file is over 10 MB — choose a smaller PDF.' })
            : error === 'too-many-pages'
              ? t({ bn: 'এই পিডিএফে ৫০টির বেশি পাতা আছে — একবারে সর্বোচ্চ ৫০ পাতা পড়া যায়।', en: 'This PDF has more than 50 pages — at most 50 pages can be read at once.' })
              : error === 'password-protected'
                ? t({ bn: 'এই পিডিএফে পাসওয়ার্ড দেওয়া আছে — আগে পাসওয়ার্ড সরিয়ে নিন।', en: 'This PDF is password-protected — remove the password first.' })
                : error === 'unreadable'
                  ? t({ bn: 'এই ফাইলটি পিডিএফ হিসেবে পড়া যায়নি — ফাইলটি নষ্ট বা পিডিএফ নয়।', en: 'This file could not be read as a PDF — it may be corrupt or not a PDF.' })
                  : error === 'no-text'
                    ? t({ bn: 'এই পিডিএফে পড়ার মতো লেখা পাওয়া যায়নি — এটি সম্ভবত স্ক্যান করা বা ছবির পিডিএফ। ছবির পাতা থেকে লেখা বের করা যায় না।', en: 'No readable text was found in this PDF — it is probably a scanned or image PDF. Text cannot be extracted from pictures of pages.' })
                    : error}
        </p>
      ) : null}
      {hasText ? (
        <div style={{ marginTop: 14 }}>
          <button type="button" style={primaryButtonStyle} onClick={() => void handleSummarize()} disabled={!connected || busy || remaining === 0}>
            {busy && busyWhat === 'summary'
              ? t({ bn: 'সারাংশ বানানো হচ্ছে…', en: 'Making the summary…' })
              : t({ bn: 'সারাংশ বানান', en: 'Make summary' })}
          </button>
          {busy && busyWhat === 'read' ? (
            <p style={noteStyle} role="status">{t({ bn: 'পিডিএফ পড়া হচ্ছে…', en: 'Reading the PDF…' })}</p>
          ) : null}
        </div>
      ) : null}
      {summary ? (
        <div style={{ marginTop: 16 }}>
          <label style={labelStyle} htmlFor="ai-pdf-summary">{t({ bn: 'সারাংশ', en: 'Summary' })}</label>
          <textarea id="ai-pdf-summary" style={{ ...inputStyle, minHeight: 180 }} value={summary} readOnly />
          {cachedSummary ? (
            <p style={noteStyle}>
              {t({ bn: 'সংরক্ষিত সারাংশ — আজকের প্রশ্ন খরচ হয়নি।', en: 'Cached summary — no question used today.' })}
            </p>
          ) : null}
          {summaryNote ? <p style={noteStyle}>{summaryNote}</p> : null}
          <ButtonRow>
            <CopyButton text={summary} labelBn="সারাংশ কপি করুন" labelEn="Copy summary" />
          </ButtonRow>
          <div style={{ marginTop: 12 }}>
            <RewardedAdButton lang={aiLang} onFreeDownload={handleDownloadSummary} />
            <p style={noteStyle}>
              {rewardedAdAvailable
                ? t({
                  bn: 'সারাংশ ডাউনলোড করতে ৩০ সেকেন্ডের বিজ্ঞাপনটি দেখুন — বিজ্ঞাপন শেষ হলে ডাউনলোড শুরু হবে।',
                  en: 'Watch the 30-second ad to download the summary — the download starts when the ad finishes.',
                })
                : t({
                  bn: 'বিজ্ঞাপন এখনো চালু হয়নি (AdSense review-এ আছে), তাই ডাউনলোড এখন বিনামূল্যে হচ্ছে — কোনো ভুয়া টাইমার নেই।',
                  en: 'Ads are not live yet (AdSense is in review), so the download is free for now — no fake timer.',
                })}
            </p>
          </div>
        </div>
      ) : null}
      {hasText ? (
        <div style={{ marginTop: 16 }}>
          <label style={labelStyle} htmlFor="ai-pdf-question">{t({ bn: 'নথি নিয়ে প্রশ্ন করুন', en: 'Ask a question about the document' })}</label>
          <input
            id="ai-pdf-question"
            style={shortInputStyle}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={t({ bn: 'যেমন: এই নথির মূল বিষয় কী?', en: 'E.g. What is the main topic of this document?' })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void handleAsk();
            }}
          />
          <ButtonRow>
            <button type="button" style={primaryButtonStyle} onClick={() => void handleAsk()} disabled={!connected || busy || question.trim() === '' || remaining === 0}>
              {busy && busyWhat === 'qa'
                ? t({ bn: 'উত্তর খোঁজা হচ্ছে…', en: 'Looking for the answer…' })
                : t({ bn: 'প্রশ্ন করুন', en: 'Ask' })}
            </button>
            <ClearButton onClear={() => { setQuestion(''); setQaPairs([]); }} disabled={question === '' && qaPairs.length === 0} />
            <ExampleButton onLoad={() => setQuestion(lang === 'bn' ? 'এই নথির মূল পয়েন্টগুলো কী?' : 'What are the key points of this document?')} />
          </ButtonRow>
          {qaPairs.map((pair, i) => (
            <div key={i} style={{ marginTop: 12, border: '1px solid var(--line)', borderRadius: 8, padding: 12 }}>
              <p style={{ margin: '0 0 6px', fontWeight: 700 }}>{pair.q}</p>
              <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{pair.a}</p>
              {pair.cached ? (
                <p style={noteStyle}>
                  {t({ bn: 'সংরক্ষিত উত্তর — আজকের প্রশ্ন খরচ হয়নি।', en: 'Cached answer — no question used today.' })}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
      <p style={noteStyle}>
        {t({
          bn: 'আপনার লেখা AI সেবায় পাঠানো হয় সারাংশ ও উত্তর বানাতে — ব্যক্তিগত বা সংবেদনশীল তথ্য পিডিএফে থাকলে তা পাঠাবেন না। সারাংশে ভুল থাকতে পারে — গুরুত্বপূর্ণ কাজে মূল নথি মিলিয়ে নিন।',
          en: 'Your text is sent to the AI service to make the summary and answers — do not send a PDF with personal or sensitive information. A summary can be wrong — check the original document for important work.',
        })}
      </p>
    </section>
  );
}
