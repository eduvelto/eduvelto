// Eduvelto — AI Resume & Cover Letter Tailor tool UI (28 Nov 2026, global batch item 2).
//
// Inputs: job description + the user's details/experience. Output:
// tailored resume bullet points + a cover letter, via askAssistant().
// This is DIFFERENT from cv-builder / cover-letter-builder (alias-page
// tools that build a CV from a template): this one TAILORS the content
// to a specific job description with AI — the description says so.
// The prompt forbids inventing jobs, degrees or skills; only the
// candidate's real experience is used. AI failures show a clear bn/en
// message + retry guidance — never a canned answer presented as the
// AI's. Renders inside ToolsDetailPage's PageShell (no own h1).
import { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { getProviderStatus } from '../../lib/aiProviders';
import { aiFailureText, resumePrompt, splitResumeOutput } from '../../lib/tools/aiTools';
import { aiQuotaRemaining, askAiQuestion } from '../../lib/aiQuota';
import {
  ToolHero, CopyButton, ButtonRow, ClearButton, ExampleButton,
  AiLimitLine, AiQuotaNotice,
  inputStyle, labelStyle, cardStyle, noteStyle, primaryButtonStyle,
} from './toolUi';

const errorStyle: React.CSSProperties = { color: '#b3261e', fontSize: 14, marginTop: 12 };

const EXAMPLE_JD_EN =
  'Customer Service Executive — Eduvelto, Dhaka (remote). Reply to customer messages in Bangla and English, keep records in Google Sheets, and work 6 days a week. Needs: good Bangla and English writing, basic computer skills, polite communication.';
const EXAMPLE_DETAILS_EN =
  'Ali, Cox’s Bazar. HSC 2022 (Science), Honours 3rd year English. English teacher at a madrasa since 2023, private tuition. Runs a Facebook page with 50k followers; writes Bangla and English posts daily; basic MS Word, Excel and Canva.';

export function AiResumeTailorTool() {
  const { t, lang } = useLanguage();
  // AI prompts only take bn|en: any other UI language falls back
  // to English (same fallback as t()).
  const aiLang: 'bn' | 'en' = lang === 'bn' ? 'bn' : 'en';
  const connected = getProviderStatus() === 'ready';
  const [jobDescription, setJobDescription] = useState('');
  const [details, setDetails] = useState('');
  const [bullets, setBullets] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Owner rule 3: 10 free AI questions/day, shared across the 4 AI
  // tools; quota exhaustion shows the friendly message, never red.
  const [remaining, setRemaining] = useState(() => aiQuotaRemaining());
  const [quotaHit, setQuotaHit] = useState(false);
  const [cachedResult, setCachedResult] = useState(false);

  async function handleTailor(): Promise<void> {
    const jd = jobDescription.trim();
    const det = details.trim();
    if (jd === '' || det === '' || busy) return;
    setBusy(true);
    setError(null);
    setQuotaHit(false);
    setBullets('');
    setCoverLetter('');
    setCachedResult(false);
    const { result, cached } = await askAiQuestion(resumePrompt(jd, det), aiLang);
    setBusy(false);
    setRemaining(aiQuotaRemaining());
    if (result.kind !== 'ai') {
      if (result.kind === 'quota-exhausted') setQuotaHit(true);
      else setError(aiFailureText(result, aiLang));
      return;
    }
    const split = splitResumeOutput(result.text);
    setBullets(split.bullets);
    setCoverLetter(split.coverLetter);
    setCachedResult(cached);
  }

  function loadExample(): void {
    setJobDescription(EXAMPLE_JD_EN);
    setDetails(EXAMPLE_DETAILS_EN);
    setBullets('');
    setCoverLetter('');
    setError(null);
  }

  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="ai-resume-tailor-title">
      <ToolHero
        titleBn="এআই রিজিউমে ও কভার লেটার"
        titleEn="AI Resume & Cover Letter Tailor"
        descBn="চাকরির বিজ্ঞাপন অনুযায়ী AI দিয়ে সিভির পয়েন্ট ও কভার লেটার সাজান — সিভি বিল্ডার থেকে আলাদা।"
        descEn="Tailor resume bullet points and a cover letter to a job description with AI — different from the CV builder."
        chipBn="AI দিয়ে বিজ্ঞাপন অনুযায়ী সাজানো"
        chipEn="Tailored to the job ad with AI"
      />
      <AiLimitLine remaining={remaining} />
      {quotaHit || remaining === 0 ? <AiQuotaNotice /> : null}
      {!connected ? (
        <p style={errorStyle} role="alert">
          {t({
            bn: 'লাইভ AI সংযুক্ত নেই — টেইলর করা এখন চলবে না। পরে আবার চেষ্টা করুন।',
            en: 'Live AI is not connected — tailoring will not run right now. Please try again later.',
          })}
        </p>
      ) : null}
      <p style={noteStyle}>
        {t({
          bn: 'এটি সিভি বিল্ডার নয় — সিভি বিল্ডার টেমপ্লেট দিয়ে সিভি বানায়, আর এই টুলটি আপনার আসল অভিজ্ঞতাকে একটি নির্দিষ্ট চাকরির বিজ্ঞাপনের সঙ্গে মিলিয়ে সাজায়।',
          en: 'This is not the CV builder — the CV builder makes a CV from a template, while this tool matches your real experience to one specific job advertisement.',
        })}
      </p>
      <div>
        <label style={labelStyle} htmlFor="ai-resume-jd">{t({ bn: 'চাকরির বিজ্ঞাপন (Job Description)', en: 'Job description' })}</label>
        <textarea
          id="ai-resume-jd"
          style={inputStyle}
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder={t({ bn: 'বিজ্ঞাপনের লেখাটি এখানে পেস্ট করুন…', en: 'Paste the job advertisement here…' })}
        />
      </div>
      <div style={{ marginTop: 12 }}>
        <label style={labelStyle} htmlFor="ai-resume-details">{t({ bn: 'আপনার তথ্য ও অভিজ্ঞতা', en: 'Your details & experience' })}</label>
        <textarea
          id="ai-resume-details"
          style={inputStyle}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder={t({ bn: 'শিক্ষা, কাজের অভিজ্ঞতা, দক্ষতা — সত্য তথ্য লিখুন। AI নতুন চাকরি, ডিগ্রি বা দক্ষতা বানিয়ে দেবে না।', en: 'Education, work experience, skills — write true information. The AI will not invent jobs, degrees or skills.' })}
        />
      </div>
      <ButtonRow>
        <button
          type="button"
          style={primaryButtonStyle}
          onClick={() => void handleTailor()}
          disabled={!connected || busy || jobDescription.trim() === '' || details.trim() === '' || remaining === 0}
        >
          {busy
            ? t({ bn: 'সাজানো হচ্ছে…', en: 'Tailoring…' })
            : t({ bn: 'রিজিউমে ও কভার লেটার বানান', en: 'Tailor resume & cover letter' })}
        </button>
        <ExampleButton onLoad={loadExample} />
        <ClearButton onClear={() => { setJobDescription(''); setDetails(''); setBullets(''); setCoverLetter(''); setError(null); }} disabled={jobDescription === '' && details === '' && bullets === '' && coverLetter === ''} />
      </ButtonRow>
      {error ? <p style={errorStyle} role="alert">{error}</p> : null}
      {bullets ? (
        <div style={{ marginTop: 16 }}>
          <label style={labelStyle} htmlFor="ai-resume-bullets">{t({ bn: 'সিভির পয়েন্ট (বিজ্ঞাপন অনুযায়ী)', en: 'Resume bullet points (tailored to the ad)' })}</label>
          <textarea id="ai-resume-bullets" style={{ ...inputStyle, minHeight: 140 }} value={bullets} readOnly />
          <ButtonRow>
            <CopyButton text={bullets} labelBn="পয়েন্ট কপি করুন" labelEn="Copy bullet points" />
          </ButtonRow>
        </div>
      ) : null}
      {cachedResult ? (
        <p style={noteStyle}>
          {t({ bn: 'সংরক্ষিত উত্তর — আজকের প্রশ্ন খরচ হয়নি।', en: 'Cached answer — no question used today.' })}
        </p>
      ) : null}
      {coverLetter ? (
        <div style={{ marginTop: 16 }}>
          <label style={labelStyle} htmlFor="ai-resume-letter">{t({ bn: 'কভার লেটার', en: 'Cover letter' })}</label>
          <textarea id="ai-resume-letter" style={{ ...inputStyle, minHeight: 200 }} value={coverLetter} readOnly />
          <ButtonRow>
            <CopyButton text={coverLetter} labelBn="কভার লেটার কপি করুন" labelEn="Copy cover letter" />
          </ButtonRow>
        </div>
      ) : null}
      <p style={noteStyle}>
        {t({
          bn: 'পাঠানোর আগে নিজের তথ্য মিলিয়ে নিন — AI আপনার লেখা তথ্যের বাইরে কিছু যোগ করলে তা মুছে ফেলুন। আপনার লেখা AI সেবায় পাঠানো হয় — ফোন নম্বর, ঠিকানা বা পাসওয়ার্ড লিখবেন না।',
          en: 'Check your own details before sending — delete anything the AI added beyond what you wrote. Your text is sent to the AI service — do not write phone numbers, addresses or passwords.',
        })}
      </p>
    </section>
  );
}
