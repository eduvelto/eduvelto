// Eduvelto — AI tools shared logic (28 Nov 2026, global batch item 2).
//
// Pure helpers for the 4 AI tools (ai-pdf-summarizer, ai-grammar-checker,
// ai-math-solver, ai-resume-tailor). All AI calls go through askAssistant()
// (src/lib/aiProviders.ts) — NEVER call the proxy directly. askAssistant()
// truncates every message to 2000 chars, so prompts are built small and
// long PDF text is CHUNKED here before it is ever sent.
//
// Honest limits baked in:
// - Summary covers at most AI_SUMMARY_MAX_CHUNKS chunks (~15,000 chars);
//   longer PDFs say so plainly instead of pretending the whole file was read.
// - Q&A answers only from a budgeted excerpt; if the text has no answer,
//   the prompt tells the model to say so instead of guessing.
// - The math solver UI always shows "AI answers can be wrong — verify".
// - The resume tailor never invents jobs, degrees or skills (prompt rule).

import { askAssistant, type AskResult, type ChatMessage } from '../aiProviders';
import { aiQuotaExhaustedMessageBn, aiQuotaExhaustedMessageEn } from '../aiQuota';

/** Chars per chunk sent to the model (askAssistant truncates at 2000). */
export const AI_TEXT_MAX_CHARS = 1500;
/** Max chunks summarised per PDF (~15,000 chars); longer PDFs are capped honestly. */
export const AI_SUMMARY_MAX_CHUNKS = 10;
/** Chunks sent as context for one Q&A question. */
export const AI_QA_MAX_CHUNKS = 2;

export type AiToolLang = 'bn' | 'en';

/** Languages the grammar checker offers (the site's 10-language set). */
export const AI_GRAMMAR_LANGUAGES: ReadonlyArray<{
  code: string;
  name: string;
  labelBn: string;
  labelEn: string;
}> = [
  { code: 'en', name: 'English', labelBn: 'ইংরেজি', labelEn: 'English' },
  { code: 'bn', name: 'Bangla', labelBn: 'বাংলা', labelEn: 'Bangla' },
  { code: 'es', name: 'Spanish', labelBn: 'স্প্যানিশ', labelEn: 'Spanish' },
  { code: 'ar', name: 'Arabic', labelBn: 'আরবি', labelEn: 'Arabic' },
  { code: 'hi', name: 'Hindi', labelBn: 'হিন্দি', labelEn: 'Hindi' },
  { code: 'pt', name: 'Portuguese', labelBn: 'পর্তুগিজ', labelEn: 'Portuguese' },
  { code: 'fr', name: 'French', labelBn: 'ফরাসি', labelEn: 'French' },
  { code: 'de', name: 'German', labelBn: 'জার্মান', labelEn: 'German' },
  { code: 'id', name: 'Indonesian', labelBn: 'ইন্দোনেশীয়', labelEn: 'Indonesian' },
  { code: 'ja', name: 'Japanese', labelBn: 'জাপানি', labelEn: 'Japanese' },
];

/**
 * Split text into chunks of at most maxChars, breaking on sentence
 * boundaries (Bangla danda । included) where possible; a single
 * over-long sentence is hard-split so no chunk ever exceeds the cap.
 */
export function chunkTextForAi(text: string, maxChars: number = AI_TEXT_MAX_CHARS): string[] {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized === '') return [];
  if (normalized.length <= maxChars) return [normalized];
  const sentences = normalized.split(/(?<=[।.!?])\s+/).filter(Boolean);
  const chunks: string[] = [];
  const push = (s: string): void => {
    if (s.trim() !== '') chunks.push(s.trim());
  };
  let current = '';
  for (const sentence of sentences) {
    if (sentence.length > maxChars) {
      push(current);
      current = '';
      for (let i = 0; i < sentence.length; i += maxChars) push(sentence.slice(i, i + maxChars));
      continue;
    }
    if (current === '') current = sentence;
    else if (current.length + 1 + sentence.length <= maxChars) current += ` ${sentence}`;
    else {
      push(current);
      current = sentence;
    }
  }
  push(current);
  return chunks;
}

/**
 * Pick the chunks most relevant to a question (distinct question-word
 * overlap, words of 3+ chars), in original order. Falls back to the
 * first chunk(s) when nothing overlaps — never an empty excerpt.
 */
export function pickRelevantChunks(
  text: string,
  question: string,
  maxChunks: number = AI_QA_MAX_CHUNKS,
  chunkChars: number = AI_TEXT_MAX_CHARS,
): string[] {
  const chunks = chunkTextForAi(text, chunkChars);
  if (chunks.length === 0) return [];
  const words = [
    ...new Set(
      question
        .toLowerCase()
        .replace(/[?.,!:"'()।]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length >= 3),
    ),
  ];
  if (words.length === 0) return chunks.slice(0, maxChunks);
  const scored = chunks.map((c, i) => ({
    c,
    i,
    score: words.filter((w) => c.toLowerCase().includes(w)).length,
  }));
  scored.sort((a, b) => b.score - a.score || a.i - b.i);
  const best = scored.filter((s) => s.score > 0).slice(0, maxChunks);
  const picked = (best.length > 0 ? best : scored.slice(0, maxChunks))
    .slice()
    .sort((a, b) => a.i - b.i);
  return picked.map((s) => s.c);
}

/** Plain-language message for a failed AI call (bn/en, with retry guidance). */
export function aiFailureText(
  result: Exclude<AskResult, { kind: 'ai' }>,
  lang: AiToolLang,
): string {
  if (result.kind === 'not-configured') {
    return lang === 'bn'
      ? 'লাইভ AI সংযুক্ত নেই — পরে আবার চেষ্টা করুন।'
      : 'Live AI is not connected — please try again later.';
  }
  if (result.kind === 'quota-exhausted') {
    // Owner rule 3c: the EXACT friendly message (live registry count),
    // never a red error. In English UI the Bangla stays verbatim with
    // a short gloss beneath it.
    return lang === 'bn'
      ? aiQuotaExhaustedMessageBn()
      : `${aiQuotaExhaustedMessageBn()}\n${aiQuotaExhaustedMessageEn()}`;
  }
  return lang === 'bn' ? result.messageBn : result.messageEn;
}

/** One AI turn through askAssistant; returns the AskResult unchanged. */
export async function runAiTurn(text: string, lang: AiToolLang): Promise<AskResult> {
  const messages: ChatMessage[] = [{ role: 'user', text }];
  return askAssistant(messages, { lang });
}

export function summaryChunkPrompt(chunk: string, lang: AiToolLang): string {
  return lang === 'bn'
    ? `নিচের লেখাটির সংক্ষিপ্ত সারাংশ দাও — মূল পয়েন্টগুলো বুলেটে লেখো, নিজে থেকে নতুন তথ্য যোগ কোরো না।\n\n${chunk}`
    : `Summarize the text below briefly — list the key points as bullets, and do not add information that is not in the text.\n\n${chunk}`;
}

export function summaryCombinePrompt(parts: string, lang: AiToolLang): string {
  return lang === 'bn'
    ? `নিচের অংশ-সারাংশগুলো এক করে একটি পরিষ্কার সারাংশ বানাও — মূল পয়েন্ট বুলেটে, বাড়তি তথ্য যোগ কোরো না।\n\n${parts}`
    : `Combine the part-summaries below into one clear summary — key points as bullets, no added information.\n\n${parts}`;
}

export function pdfQaPrompt(excerpt: string, question: string, lang: AiToolLang): string {
  return lang === 'bn'
    ? `নিচের লেখার অংশের ভিত্তিতে প্রশ্নের উত্তর দাও। লেখায় উত্তর না থাকলে সোজা বলো যে লেখায় নেই — অনুমান কোরো না।\n\nলেখা:\n${excerpt}\n\nপ্রশ্ন: ${question}`
    : `Answer the question using only the text excerpt below. If the answer is not in the text, say so plainly — do not guess.\n\nText:\n${excerpt}\n\nQuestion: ${question}`;
}

export function grammarPrompt(
  text: string,
  mode: 'correct' | 'paraphrase',
  languageName: string,
): string {
  if (mode === 'paraphrase') {
    return `Paraphrase the following ${languageName} text in different words, keeping the same meaning. Reply with ONLY the paraphrased text, no explanation.\n\n${text}`;
  }
  return `Correct the grammar, spelling and punctuation of the following ${languageName} text. Reply with ONLY the corrected text, no explanation.\n\n${text}`;
}

export function mathPrompt(problem: string, lang: AiToolLang): string {
  return lang === 'bn'
    ? `নিচের গণিত/হোমওয়ার্ক সমস্যাটি ধাপে ধাপে সমাধান করো — প্রতিটি ধাপে কী করছো তা সংক্ষেপে লেখো, শেষে চূড়ান্ত উত্তর আলাদা লাইনে দাও। ধাপগুলো যাচাইযোগ্য রাখো।\n\nসমস্যা: ${problem}`
    : `Solve the maths/homework problem below step by step — briefly explain each step, and give the final answer on its own last line. Keep the steps checkable.\n\nProblem: ${problem}`;
}

export function resumePrompt(jobDescription: string, details: string): string {
  return `Tailor the resume below to the job description. Reply in two sections, in the same language as the job description. Section 1 starts with the exact line "BULLETS:" followed by 5-7 tailored resume bullet points using only the candidate's real experience — do not invent jobs, degrees or skills. Section 2 starts with the exact line "COVER LETTER:" followed by a short cover letter (under 200 words). Do not add any other text before, between or after the sections.\n\nJOB DESCRIPTION:\n${jobDescription}\n\nCANDIDATE DETAILS:\n${details}`;
}

/**
 * Split a tailor reply into bullet points + cover letter on the
 * "COVER LETTER:" marker (Bangla "কভার লেটার:" accepted too). When
 * the model ignores the markers, the whole reply is the cover letter
 * and bullets stay empty — the UI then shows it as one block, never
 * a half-split or invented section.
 */
export function splitResumeOutput(text: string): { bullets: string; coverLetter: string } {
  const marker = text.search(/COVER LETTER\s*:|কভার লেটার\s*:/i);
  if (marker === -1) return { bullets: '', coverLetter: text.trim() };
  const head = text
    .slice(0, marker)
    .replace(/^\s*BULLETS\s*:\s*/i, '')
    .trim();
  const tail = text
    .slice(marker)
    .replace(/^(COVER LETTER|কভার লেটার)\s*:\s*/i, '')
    .trim();
  return { bullets: head, coverLetter: tail };
}
