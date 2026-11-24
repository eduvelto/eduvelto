// Eduvelto AI Life Assistant — guided document builders.
// Forms + fixed templates: the user fills in their own facts, the
// builder arranges them into a correct letter/application/email/CV.
// No AI, no data leaves the device, nothing is saved.

import { useState, type ReactNode } from 'react';
import { Button, AlertBox } from '../ui';
import { useLanguage } from '../../i18n/LanguageContext';
import { buildApplication, buildCv, buildEmail, buildLetter } from '../../lib/aiAssistant';

function Field(props: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: 'block', marginBottom: 10 }}>
      <span className="ev-label">{props.label}</span>
      {props.children}
    </label>
  );
}

function TextInput(props: { value: string; onChange: (v: string) => void; placeholder?: string; ariaLabel: string }) {
  return (
    <input
      className="ev-input"
      type="text"
      value={props.value}
      onChange={(e) => props.onChange(e.target.value)}
      placeholder={props.placeholder}
      aria-label={props.ariaLabel}
    />
  );
}

function TextArea(props: { value: string; onChange: (v: string) => void; placeholder?: string; ariaLabel: string; rows?: number }) {
  return (
    <textarea
      className="ev-textarea"
      rows={props.rows ?? 4}
      value={props.value}
      onChange={(e) => props.onChange(e.target.value)}
      placeholder={props.placeholder}
      aria-label={props.ariaLabel}
    />
  );
}

function LangToggle(props: { lang: 'bn' | 'en'; onChange: (l: 'bn' | 'en') => void }) {
  const { t } = useLanguage();
  return (
    <Field label={t({ bn: 'কোন ভাষায় লিখবেন?', en: 'Which language?' })}>
      <select className="ev-input" value={props.lang} onChange={(e) => props.onChange(e.target.value as 'bn' | 'en')} aria-label={t({ bn: 'ভাষা', en: 'Language' })}>
        <option value="bn">বাংলা</option>
        <option value="en">English</option>
      </select>
    </Field>
  );
}

function CopyButton(props: { text: string }) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(props.text);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          setCopied(false);
        }
      }}
    >
      {copied ? t({ bn: 'কপি হয়েছে ✓', en: 'Copied ✓' }) : t({ bn: 'কপি করুন', en: 'Copy' })}
    </Button>
  );
}

function OutputBox(props: { text: string }) {
  return (
    <div>
      <pre
        style={{
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          background: 'var(--surface-muted, #f4f6fb)',
          border: '1px solid var(--border, #dbe2ef)',
          borderRadius: 10,
          padding: 14,
          fontSize: 15,
          lineHeight: 1.7,
          margin: '12px 0 8px',
        }}
      >
        {props.text}
      </pre>
      <CopyButton text={props.text} />
    </div>
  );
}

/* ---------------- Letter ---------------- */

export function LetterTool() {
  const { t } = useLanguage();
  const [lang, setLang] = useState<'bn' | 'en'>('bn');
  const [senderName, setSenderName] = useState('');
  const [senderAddress, setSenderAddress] = useState('');
  const [date, setDate] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [out, setOut] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function build() {
    setErr(null);
    setOut(null);
    const r = buildLetter({ senderName, senderAddress, date, recipientName, recipientAddress, subject, body, lang });
    if (!r.ok) return setErr(r.errorBn);
    setOut(r.value);
  }

  return (
    <div>
      <LangToggle lang={lang} onChange={setLang} />
      <Field label={t({ bn: 'আপনার নাম', en: 'Your name' })}>
        <TextInput value={senderName} onChange={setSenderName} ariaLabel={t({ bn: 'আপনার নাম', en: 'Your name' })} />
      </Field>
      <Field label={t({ bn: 'আপনার ঠিকানা', en: 'Your address' })}>
        <TextInput value={senderAddress} onChange={setSenderAddress} ariaLabel={t({ bn: 'আপনার ঠিকানা', en: 'Your address' })} />
      </Field>
      <Field label={t({ bn: 'তারিখ', en: 'Date' })}>
        <TextInput value={date} onChange={setDate} placeholder={t({ bn: 'যেমন: ২৪ নভেম্বর ২০২৬', en: 'e.g. 24 Nov 2026' })} ariaLabel={t({ bn: 'তারিখ', en: 'Date' })} />
      </Field>
      <Field label={t({ bn: 'যাঁকে লিখছেন', en: 'Recipient name' })}>
        <TextInput value={recipientName} onChange={setRecipientName} ariaLabel={t({ bn: 'যাঁকে লিখছেন', en: 'Recipient name' })} />
      </Field>
      <Field label={t({ bn: 'প্রাপকের ঠিকানা', en: 'Recipient address' })}>
        <TextInput value={recipientAddress} onChange={setRecipientAddress} ariaLabel={t({ bn: 'প্রাপকের ঠিকানা', en: 'Recipient address' })} />
      </Field>
      <Field label={t({ bn: 'বিষয়', en: 'Subject' })}>
        <TextInput value={subject} onChange={setSubject} ariaLabel={t({ bn: 'বিষয়', en: 'Subject' })} />
      </Field>
      <Field label={t({ bn: 'মূল কথা (২–৩ লাইনে লিখুন)', en: 'Main message (write in 2–3 lines)' })}>
        <TextArea value={body} onChange={setBody} ariaLabel={t({ bn: 'মূল কথা', en: 'Main message' })} />
      </Field>
      <Button onClick={build}>{t({ bn: 'চিঠি সাজান', en: 'Compose the letter' })}</Button>
      {err ? (
        <div style={{ marginTop: 12 }}>
          <AlertBox tone="error">{err}</AlertBox>
        </div>
      ) : null}
      {out ? <OutputBox text={out} /> : null}
    </div>
  );
}

/* ---------------- Application ---------------- */

export function ApplicationTool() {
  const { t } = useLanguage();
  const [lang, setLang] = useState<'bn' | 'en'>('bn');
  const [applicantName, setApplicantName] = useState('');
  const [applicantAddress, setApplicantAddress] = useState('');
  const [date, setDate] = useState('');
  const [authorityName, setAuthorityName] = useState('');
  const [authorityAddress, setAuthorityAddress] = useState('');
  const [purpose, setPurpose] = useState('');
  const [details, setDetails] = useState('');
  const [out, setOut] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function build() {
    setErr(null);
    setOut(null);
    const r = buildApplication({ applicantName, applicantAddress, date, authorityName, authorityAddress, purpose, details, lang });
    if (!r.ok) return setErr(r.errorBn);
    setOut(r.value);
  }

  return (
    <div>
      <LangToggle lang={lang} onChange={setLang} />
      <Field label={t({ bn: 'আবেদনকারীর নাম', en: 'Applicant name' })}>
        <TextInput value={applicantName} onChange={setApplicantName} ariaLabel={t({ bn: 'আবেদনকারীর নাম', en: 'Applicant name' })} />
      </Field>
      <Field label={t({ bn: 'আবেদনকারীর ঠিকানা', en: 'Applicant address' })}>
        <TextInput value={applicantAddress} onChange={setApplicantAddress} ariaLabel={t({ bn: 'আবেদনকারীর ঠিকানা', en: 'Applicant address' })} />
      </Field>
      <Field label={t({ bn: 'তারিখ', en: 'Date' })}>
        <TextInput value={date} onChange={setDate} placeholder={t({ bn: 'যেমন: ২৪ নভেম্বর ২০২৬', en: 'e.g. 24 Nov 2026' })} ariaLabel={t({ bn: 'তারিখ', en: 'Date' })} />
      </Field>
      <Field label={t({ bn: 'যাঁর কাছে আবেদন', en: 'Addressed to' })}>
        <TextInput value={authorityName} onChange={setAuthorityName} placeholder={t({ bn: 'যেমন: প্রধান শিক্ষক / ব্যবস্থাপক', en: 'e.g. Head Teacher / Manager' })} ariaLabel={t({ bn: 'যাঁর কাছে আবেদন', en: 'Addressed to' })} />
      </Field>
      <Field label={t({ bn: 'কর্তৃপক্ষের ঠিকানা', en: 'Authority address' })}>
        <TextInput value={authorityAddress} onChange={setAuthorityAddress} ariaLabel={t({ bn: 'কর্তৃপক্ষের ঠিকানা', en: 'Authority address' })} />
      </Field>
      <Field label={t({ bn: 'আবেদনের বিষয়/উদ্দেশ্য', en: 'Purpose of the application' })}>
        <TextInput value={purpose} onChange={setPurpose} placeholder={t({ bn: 'যেমন: ছুটির আবেদন / চাকরির আবেদন', en: 'e.g. leave application / job application' })} ariaLabel={t({ bn: 'আবেদনের বিষয়', en: 'Purpose' })} />
      </Field>
      <Field label={t({ bn: 'বিস্তারিত (কেন আবেদন করছেন, ২–৩ লাইনে)', en: 'Details (why you are applying, in 2–3 lines)' })}>
        <TextArea value={details} onChange={setDetails} ariaLabel={t({ bn: 'বিস্তারিত', en: 'Details' })} />
      </Field>
      <Button onClick={build}>{t({ bn: 'আবেদন সাজান', en: 'Compose the application' })}</Button>
      {err ? (
        <div style={{ marginTop: 12 }}>
          <AlertBox tone="error">{err}</AlertBox>
        </div>
      ) : null}
      {out ? <OutputBox text={out} /> : null}
    </div>
  );
}

/* ---------------- Email ---------------- */

export function EmailTool() {
  const { t } = useLanguage();
  const [lang, setLang] = useState<'bn' | 'en'>('bn');
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [greeting, setGreeting] = useState('');
  const [body, setBody] = useState('');
  const [closing, setClosing] = useState('');
  const [senderName, setSenderName] = useState('');
  const [out, setOut] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function build() {
    setErr(null);
    setOut(null);
    const r = buildEmail({ to, subject, greeting, body, closing, senderName, lang });
    if (!r.ok) return setErr(r.errorBn);
    setOut(r.value);
  }

  return (
    <div>
      <LangToggle lang={lang} onChange={setLang} />
      <Field label={t({ bn: 'প্রাপকের ইমেইল', en: 'Recipient email' })}>
        <TextInput value={to} onChange={setTo} placeholder="name@example.com" ariaLabel={t({ bn: 'প্রাপকের ইমেইল', en: 'Recipient email' })} />
      </Field>
      <Field label={t({ bn: 'বিষয়', en: 'Subject' })}>
        <TextInput value={subject} onChange={setSubject} ariaLabel={t({ bn: 'বিষয়', en: 'Subject' })} />
      </Field>
      <Field label={t({ bn: 'সম্ভাষণ', en: 'Greeting' })}>
        <TextInput value={greeting} onChange={setGreeting} placeholder={t({ bn: 'যেমন: মাননীয় স্যার, / Dear Sir,', en: 'e.g. Dear Sir,' })} ariaLabel={t({ bn: 'সম্ভাষণ', en: 'Greeting' })} />
      </Field>
      <Field label={t({ bn: 'মূল কথা', en: 'Main message' })}>
        <TextArea value={body} onChange={setBody} rows={5} ariaLabel={t({ bn: 'মূল কথা', en: 'Main message' })} />
      </Field>
      <Field label={t({ bn: 'সমাপনী', en: 'Closing' })}>
        <TextInput value={closing} onChange={setClosing} placeholder={t({ bn: 'যেমন: ধন্যবাদান্তে, / Thank you,', en: 'e.g. Thank you,' })} ariaLabel={t({ bn: 'সমাপনী', en: 'Closing' })} />
      </Field>
      <Field label={t({ bn: 'আপনার নাম', en: 'Your name' })}>
        <TextInput value={senderName} onChange={setSenderName} ariaLabel={t({ bn: 'আপনার নাম', en: 'Your name' })} />
      </Field>
      <Button onClick={build}>{t({ bn: 'ইমেইল সাজান', en: 'Compose the email' })}</Button>
      {err ? (
        <div style={{ marginTop: 12 }}>
          <AlertBox tone="error">{err}</AlertBox>
        </div>
      ) : null}
      {out ? <OutputBox text={out} /> : null}
    </div>
  );
}

/* ---------------- CV ---------------- */

export function CvTool() {
  const { t } = useLanguage();
  const [lang, setLang] = useState<'bn' | 'en'>('bn');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [objective, setObjective] = useState('');
  const [education, setEducation] = useState('');
  const [skills, setSkills] = useState('');
  const [experience, setExperience] = useState('');
  const [out, setOut] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function splitLines(s: string): string[] {
    return s
      .split('\n')
      .map((x) => x.trim())
      .filter((x) => x !== '');
  }

  function build() {
    setErr(null);
    setOut(null);
    const r = buildCv({
      name,
      phone,
      email,
      address,
      objective,
      education: splitLines(education),
      skills: splitLines(skills),
      experience: splitLines(experience),
      lang,
    });
    if (!r.ok) return setErr(r.errorBn);
    setOut(r.value);
  }

  return (
    <div>
      <LangToggle lang={lang} onChange={setLang} />
      <p style={{ marginTop: 0 }}>
        {t({ bn: 'প্রতিটি শিক্ষাগত যোগ্যতা ও দক্ষতা আলাদা লাইনে লিখুন। তথ্য আপনার নিজের — যাচাই করে লিখুন।', en: 'Write each qualification and skill on its own line. The facts are yours — write them accurately.' })}
      </p>
      <Field label={t({ bn: 'নাম', en: 'Name' })}>
        <TextInput value={name} onChange={setName} ariaLabel={t({ bn: 'নাম', en: 'Name' })} />
      </Field>
      <Field label={t({ bn: 'ফোন', en: 'Phone' })}>
        <TextInput value={phone} onChange={setPhone} ariaLabel={t({ bn: 'ফোন', en: 'Phone' })} />
      </Field>
      <Field label={t({ bn: 'ইমেইল', en: 'Email' })}>
        <TextInput value={email} onChange={setEmail} placeholder="name@example.com" ariaLabel={t({ bn: 'ইমেইল', en: 'Email' })} />
      </Field>
      <Field label={t({ bn: 'ঠিকানা', en: 'Address' })}>
        <TextInput value={address} onChange={setAddress} ariaLabel={t({ bn: 'ঠিকানা', en: 'Address' })} />
      </Field>
      <Field label={t({ bn: 'লক্ষ্য (১–২ লাইন)', en: 'Objective (1–2 lines)' })}>
        <TextArea value={objective} onChange={setObjective} rows={2} ariaLabel={t({ bn: 'লক্ষ্য', en: 'Objective' })} />
      </Field>
      <Field label={t({ bn: 'শিক্ষাগত যোগ্যতা (প্রতি লাইনে একটি)', en: 'Education (one per line)' })}>
        <TextArea value={education} onChange={setEducation} rows={3} placeholder={t({ bn: 'যেমন: এসএসসি, বিজ্ঞান, ২০২০', en: 'e.g. SSC, Science, 2020' })} ariaLabel={t({ bn: 'শিক্ষাগত যোগ্যতা', en: 'Education' })} />
      </Field>
      <Field label={t({ bn: 'দক্ষতা (প্রতি লাইনে একটি)', en: 'Skills (one per line)' })}>
        <TextArea value={skills} onChange={setSkills} rows={3} placeholder={t({ bn: 'যেমন: MS Word / বাংলা টাইপিং', en: 'e.g. MS Word / Bangla typing' })} ariaLabel={t({ bn: 'দক্ষতা', en: 'Skills' })} />
      </Field>
      <Field label={t({ bn: 'অভিজ্ঞতা (থাকলে, প্রতি লাইনে একটি)', en: 'Experience (if any, one per line)' })}>
        <TextArea value={experience} onChange={setExperience} rows={3} ariaLabel={t({ bn: 'অভিজ্ঞতা', en: 'Experience' })} />
      </Field>
      <Button onClick={build}>{t({ bn: 'সিভি সাজান', en: 'Compose the CV' })}</Button>
      {err ? (
        <div style={{ marginTop: 12 }}>
          <AlertBox tone="error">{err}</AlertBox>
        </div>
      ) : null}
      {out ? <OutputBox text={out} /> : null}
    </div>
  );
}
