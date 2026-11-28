// Eduvelto — Application Letter Writer tool UI (28 Nov 2026).
//
// Browser-side form that generates a formal application letter from the
// user's inputs — template-based only, no server, no AI. The letter is
// shown on screen with a Copy button (no file download).
import { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { CopyBtn, LoadExampleBtn, ToolSection, errorStyle, gridStyle, inputStyle, labelStyle, noteStyle, resultStyle } from './eduToolUi';
import {
  buildApplicationLetter,
  todayIso,
  type ApplicationLetterInput,
  type ClosingChoice,
  type LetterLanguage,
  type MissingField,
} from '../../lib/tools/applicationLetter';

const letterStyle: React.CSSProperties = {
  margin: '12px 0 0',
  padding: '16px',
  borderRadius: 8,
  background: 'var(--surface)',
  border: '1px solid var(--line)',
  whiteSpace: 'pre-wrap',
  fontSize: 15,
  lineHeight: 1.7,
  color: 'var(--heading)',
  fontFamily: 'inherit',
};

const MISSING_LABELS: Record<MissingField, { bn: string; en: string }> = {
  name: { bn: 'আবেদনকারীর নাম', en: 'Applicant name' },
  organization: { bn: 'প্রতিষ্ঠানের নাম', en: 'Organization name' },
  post: { bn: 'পদের নাম', en: 'Post applied for' },
};

export function ApplicationLetterWriterTool() {
  const { t } = useLanguage();
  const [letterLang, setLetterLang] = useState<LetterLanguage>('bn');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [date, setDate] = useState(todayIso());
  const [recipientTitle, setRecipientTitle] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [organization, setOrganization] = useState('');
  const [post, setPost] = useState('');
  const [reference, setReference] = useState('');
  const [points, setPoints] = useState<string[]>(['', '', '']);
  const [closing, setClosing] = useState<ClosingChoice>('binito');
  const [missing, setMissing] = useState<MissingField[]>([]);
  const [letter, setLetter] = useState('');

  function setPoint(index: number, value: string) {
    setPoints((prev) => prev.map((p, i) => (i === index ? value : p)));
  }

  function loadExample() {
    setLetterLang('bn');
    setName(t({ bn: 'রহিম উদ্দিন', en: 'Rahim Uddin' }));
    setAddress(t({ bn: '১২ স্টেশন রোড, কক্সবাজার', en: '12 Station Road, Cox’s Bazar' }));
    setPhone('01700000000');
    setEmail('rahim@example.com');
    setDate(todayIso());
    setRecipientTitle(t({ bn: 'ব্যবস্থাপনা পরিচালক', en: 'Managing Director' }));
    setRecipientName(t({ bn: 'করিম আহমেদ', en: 'Karim Ahmed' }));
    setOrganization('Eduvelto');
    setPost(t({ bn: 'সহকারী শিক্ষক', en: 'Assistant Teacher' }));
    setReference(t({ bn: 'দৈনিক প্রথম আলো, ২০ নভেম্বর ২০২৬', en: 'Daily Star advertisement, 20 November 2026' }));
    setPoints([
      t({ bn: 'ঢাকা বিশ্ববিদ্যালয় থেকে বিবিএ', en: 'BBA from Dhaka University' }),
      t({ bn: 'দুই বছরের শিক্ষকতার অভিজ্ঞতা', en: 'Two years of teaching experience' }),
      '',
    ]);
    setClosing('binito');
    setMissing([]);
    setLetter('');
  }

  function generate() {
    const input: ApplicationLetterInput = {
      applicantName: name,
      address,
      phone,
      email,
      date,
      recipientTitle,
      recipientName,
      organization,
      post,
      reference,
      points,
      closing,
    };
    const result = buildApplicationLetter(letterLang, input);
    if (!result.ok) {
      setMissing(result.missing);
      setLetter('');
      return;
    }
    setMissing([]);
    setLetter(result.letter);
  }

  return (
    <ToolSection id="application-letter-writer-title" titleBn="আবেদনপত্র লেখক" titleEn="Application Letter Writer"
      descBn="ফরমটি পূরণ করুন — টুলটি আপনার জন্য একটি আনুষ্ঠানিক আবেদনপত্র সাজিয়ে দেবে। সবকিছু আপনার ব্রাউজারেই হয়, কিছুই আপলোড হয় না।"
      descEn="Fill in the form — the tool assembles a formal application letter for you. Everything happens in your browser; nothing is uploaded.">
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 4 }}>
        <span style={labelStyle}>{t({ bn: 'চিঠির ভাষা', en: 'Letter language' })}</span>
        <button type="button" className="ev-btn ev-btn-outline" style={{ minHeight: 40 }}
          aria-pressed={letterLang === 'bn'}
          onClick={() => { setLetterLang('bn'); setLetter(''); }}>
          {t({ bn: 'বাংলা', en: 'বাংলা (Bangla)' })}
        </button>
        <button type="button" className="ev-btn ev-btn-outline" style={{ minHeight: 40 }}
          aria-pressed={letterLang === 'en'}
          onClick={() => { setLetterLang('en'); setLetter(''); }}>
          {t({ bn: 'English (ইংরেজি)', en: 'English' })}
        </button>
        <span style={{ flex: 1 }} />
        <LoadExampleBtn onLoad={loadExample} />
      </div>

      <div style={gridStyle}>
        <div>
          <label style={labelStyle} htmlFor="al-name">{t({ bn: 'আবেদনকারীর নাম *', en: 'Your name *' })}</label>
          <input id="al-name" style={inputStyle} type="text" value={name}
            placeholder={t({ bn: 'যেমন রহিম উদ্দিন', en: 'e.g. Rahim Uddin' })}
            onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle} htmlFor="al-address">{t({ bn: 'ঠিকানা', en: 'Address' })}</label>
          <input id="al-address" style={inputStyle} type="text" value={address}
            placeholder={t({ bn: 'যেমন ১২ স্টেশন রোড, কক্সবাজার', en: 'e.g. 12 Station Road, Cox’s Bazar' })}
            onChange={(e) => setAddress(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle} htmlFor="al-phone">{t({ bn: 'ফোন', en: 'Phone' })}</label>
          <input id="al-phone" style={inputStyle} type="tel" value={phone}
            placeholder={t({ bn: 'যেমন 01700000000', en: 'e.g. 01700000000' })}
            onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle} htmlFor="al-email">{t({ bn: 'ইমেইল', en: 'Email' })}</label>
          <input id="al-email" style={inputStyle} type="email" value={email}
            placeholder={t({ bn: 'যেমন rahim@example.com', en: 'e.g. rahim@example.com' })}
            onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle} htmlFor="al-date">{t({ bn: 'তারিখ', en: 'Date' })}</label>
          <input id="al-date" style={inputStyle} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle} htmlFor="al-recipient-title">{t({ bn: 'প্রাপকের পদবি', en: 'Recipient title' })}</label>
          <input id="al-recipient-title" style={inputStyle} type="text" value={recipientTitle}
            placeholder={t({ bn: 'যেমন ব্যবস্থাপনা পরিচালক', en: 'e.g. Hiring Manager' })}
            onChange={(e) => setRecipientTitle(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle} htmlFor="al-recipient-name">{t({ bn: 'প্রাপকের নাম', en: 'Recipient name' })}</label>
          <input id="al-recipient-name" style={inputStyle} type="text" value={recipientName}
            placeholder={t({ bn: 'যেমন করিম আহমেদ', en: 'e.g. Karim Ahmed' })}
            onChange={(e) => setRecipientName(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle} htmlFor="al-organization">{t({ bn: 'প্রতিষ্ঠানের নাম *', en: 'Organization name *' })}</label>
          <input id="al-organization" style={inputStyle} type="text" value={organization}
            placeholder={t({ bn: 'যেমন এডুভেলটো', en: 'e.g. Eduvelto' })}
            onChange={(e) => setOrganization(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle} htmlFor="al-post">{t({ bn: 'যে পদের জন্য আবেদন *', en: 'Post applied for *' })}</label>
          <input id="al-post" style={inputStyle} type="text" value={post}
            placeholder={t({ bn: 'যেমন সহকারী শিক্ষক', en: 'e.g. Assistant Teacher' })}
            onChange={(e) => setPost(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle} htmlFor="al-reference">{t({ bn: 'সূত্র (বিজ্ঞপ্তি/সার্কুলার)', en: 'Reference (circular / advertisement)' })}</label>
          <input id="al-reference" style={inputStyle} type="text" value={reference}
            placeholder={t({ bn: 'যেমন দৈনিক প্রথম আলো, ২০ নভেম্বর ২০২৬', en: 'e.g. Daily Star advertisement, 20 November 2026' })}
            onChange={(e) => setReference(e.target.value)} />
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <p style={labelStyle}>{t({ bn: 'আপনার শিক্ষা / অভিজ্ঞতা / উপযুক্ততা সম্পর্কে ২–৩টি সংক্ষিপ্ত কথা', en: '2–3 short points about your education / experience / why you fit' })}</p>
        {points.map((point, i) => (
          <input key={i} style={{ ...inputStyle, marginBottom: 8 }} type="text" value={point}
            aria-label={t({ bn: `কথা ${i + 1}`, en: `Point ${i + 1}` })}
            placeholder={t({ bn: `কথা ${i + 1} — যেমন দুই বছরের শিক্ষকতার অভিজ্ঞতা`, en: `Point ${i + 1} — e.g. two years of teaching experience` })}
            onChange={(e) => setPoint(i, e.target.value)} />
        ))}
      </div>

      <div style={{ marginTop: 4 }}>
        <label style={labelStyle} htmlFor="al-closing">{t({ bn: 'শেষের সম্ভাষণ', en: 'Closing line' })}</label>
        <select id="al-closing" style={{ ...inputStyle, maxWidth: 320 }} value={closing}
          onChange={(e) => setClosing(e.target.value as ClosingChoice)}>
          <option value="binito">{t({ bn: 'বিনীত', en: 'বিনীত (Binito)' })}</option>
          <option value="sincerely">{t({ bn: 'Sincerely (ইংরেজি)', en: 'Sincerely' })}</option>
        </select>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
        <button type="button" className="ev-btn ev-btn-primary" style={{ minHeight: 44 }} onClick={generate}>
          {t({ bn: 'চিঠি তৈরি করুন', en: 'Generate letter' })}
        </button>
      </div>

      {missing.length > 0 && (
        <p style={errorStyle} role="alert">
          {t({
            bn: `অনুগ্রহ করে এগুলো পূরণ করুন: ${missing.map((m) => t(MISSING_LABELS[m])).join(', ')}`,
            en: `Please fill in: ${missing.map((m) => t(MISSING_LABELS[m])).join(', ')}`,
          })}
        </p>
      )}

      {letter && (
        <div style={resultStyle} role="status">
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <CopyBtn text={letter} labelBn="চিঠি কপি করুন" labelEn="Copy letter" />
          </div>
          <pre style={letterStyle}>{letter}</pre>
        </div>
      )}

      <p style={noteStyle}>
        {t({
          bn: 'এটি একটি খসড়া টেমপ্লেট — পাঠানোর আগে একবার পড়ে আপনার নিজের পরিস্থিতি অনুযায়ী ভাষা মিলিয়ে নিন। ভুল তথ্য কখনোই পাঠাবেন না।',
          en: 'This is a draft template — read it once and adjust the wording to your own situation before sending. Never send false information.',
        })}
      </p>
    </ToolSection>
  );
}
