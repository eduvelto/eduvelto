// Eduvelto — CV & Cover Letter Builder (directive §3B, 23 Nov 2026).
//
// /opportunities/cv-builder — public page (works signed-out).
// A client-side tool: the user fills a form, sees a live preview,
// and prints (Save as PDF) or copies the text. NOTHING is saved
// to the server and nothing leaves the browser — there is no
// account, no upload and no tracking here. The CV is generated
// in English (the norm for job applications in Bangladesh); the
// form itself is Bangla-first.
//
// This ADDS to the existing /jobs/cv reading guide (linked below)
// — it does not replace it.

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { Breadcrumb } from '../components/Breadcrumb';
import { AlertBox, Button, Card } from '../components/ui';
import { useLanguage } from '../i18n/LanguageContext';

interface EduRow {
  degree: string;
  institution: string;
  year: string;
}

interface ExpRow {
  role: string;
  org: string;
  period: string;
  details: string;
}

const EMPTY_EDU: EduRow = { degree: '', institution: '', year: '' };
const EMPTY_EXP: ExpRow = { role: '', org: '', period: '', details: '' };

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid var(--border)',
  background: 'var(--surface)',
  color: 'var(--text)',
  fontSize: 15,
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  color: 'var(--muted)',
  marginBottom: 4,
};

function Field(props: { labelBn: string; labelEn: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  const { t } = useLanguage();
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={labelStyle}>{t({ bn: props.labelBn, en: props.labelEn })}</label>
      <input
        type="text"
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.placeholder}
        style={inputStyle}
      />
    </div>
  );
}

function CvPreview(props: {
  name: string;
  role: string;
  phone: string;
  email: string;
  address: string;
  summary: string;
  education: EduRow[];
  experience: ExpRow[];
  skills: string;
  languages: string;
}) {
  const p = props;
  const edu = p.education.filter((e) => e.degree.trim() || e.institution.trim());
  const exp = p.experience.filter((e) => e.role.trim() || e.org.trim());
  const skills = p.skills.split(',').map((s) => s.trim()).filter(Boolean);
  return (
    <div
      className="ev-cv-print"
      style={{
        background: '#fff',
        color: '#111',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: 20,
        fontSize: 14,
        lineHeight: 1.6,
      }}
    >
      <h2 style={{ margin: '0 0 2px', fontSize: 22, color: '#111' }}>{p.name.trim() || 'Your Name'}</h2>
      <p style={{ margin: '0 0 2px', fontWeight: 600 }}>{p.role.trim() || 'Target role'}</p>
      <p style={{ margin: '0 0 12px', color: '#444' }}>
        {[p.phone.trim(), p.email.trim(), p.address.trim()].filter(Boolean).join('  ·  ') || 'Contact details'}
      </p>
      {p.summary.trim() ? (
        <>
          <h3 style={{ margin: '12px 0 4px', fontSize: 15, borderBottom: '1px solid #ccc', paddingBottom: 2 }}>Summary</h3>
          <p style={{ margin: 0 }}>{p.summary}</p>
        </>
      ) : null}
      {edu.length > 0 ? (
        <>
          <h3 style={{ margin: '12px 0 4px', fontSize: 15, borderBottom: '1px solid #ccc', paddingBottom: 2 }}>Education</h3>
          {edu.map((e, i) => (
            <p key={i} style={{ margin: '0 0 6px' }}>
              <strong>{e.degree}</strong>
              {e.institution ? ` — ${e.institution}` : ''}
              {e.year ? ` (${e.year})` : ''}
            </p>
          ))}
        </>
      ) : null}
      {exp.length > 0 ? (
        <>
          <h3 style={{ margin: '12px 0 4px', fontSize: 15, borderBottom: '1px solid #ccc', paddingBottom: 2 }}>Experience</h3>
          {exp.map((e, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <p style={{ margin: 0 }}>
                <strong>{e.role}</strong>
                {e.org ? ` — ${e.org}` : ''}
                {e.period ? ` (${e.period})` : ''}
              </p>
              {e.details.trim() ? <p style={{ margin: '2px 0 0' }}>{e.details}</p> : null}
            </div>
          ))}
        </>
      ) : null}
      {skills.length > 0 ? (
        <>
          <h3 style={{ margin: '12px 0 4px', fontSize: 15, borderBottom: '1px solid #ccc', paddingBottom: 2 }}>Skills</h3>
          <p style={{ margin: 0 }}>{skills.join(', ')}</p>
        </>
      ) : null}
      {p.languages.trim() ? (
        <>
          <h3 style={{ margin: '12px 0 4px', fontSize: 15, borderBottom: '1px solid #ccc', paddingBottom: 2 }}>Languages</h3>
          <p style={{ margin: 0 }}>{p.languages}</p>
        </>
      ) : null}
    </div>
  );
}

function buildCvText(props: {
  name: string;
  role: string;
  phone: string;
  email: string;
  address: string;
  summary: string;
  education: EduRow[];
  experience: ExpRow[];
  skills: string;
  languages: string;
}): string {
  const p = props;
  const lines: string[] = [];
  lines.push(p.name.trim() || 'Your Name');
  lines.push(p.role.trim() || 'Target role');
  lines.push([p.phone.trim(), p.email.trim(), p.address.trim()].filter(Boolean).join(' | '));
  lines.push('');
  if (p.summary.trim()) {
    lines.push('SUMMARY');
    lines.push(p.summary.trim());
    lines.push('');
  }
  const edu = p.education.filter((e) => e.degree.trim() || e.institution.trim());
  if (edu.length > 0) {
    lines.push('EDUCATION');
    for (const e of edu) lines.push(`- ${e.degree}${e.institution ? ` — ${e.institution}` : ''}${e.year ? ` (${e.year})` : ''}`);
    lines.push('');
  }
  const exp = p.experience.filter((e) => e.role.trim() || e.org.trim());
  if (exp.length > 0) {
    lines.push('EXPERIENCE');
    for (const e of exp) {
      lines.push(`- ${e.role}${e.org ? ` — ${e.org}` : ''}${e.period ? ` (${e.period})` : ''}`);
      if (e.details.trim()) lines.push(`  ${e.details.trim()}`);
    }
    lines.push('');
  }
  const skills = p.skills.split(',').map((s) => s.trim()).filter(Boolean);
  if (skills.length > 0) {
    lines.push('SKILLS');
    lines.push(skills.join(', '));
    lines.push('');
  }
  if (p.languages.trim()) {
    lines.push('LANGUAGES');
    lines.push(p.languages.trim());
  }
  return lines.join('\n');
}

export default function OpportunityCvBuilderPage() {
  const { t, lang } = useLanguage();
  const [tab, setTab] = useState<'cv' | 'letter'>('cv');
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [summary, setSummary] = useState('');
  const [education, setEducation] = useState<EduRow[]>([{ ...EMPTY_EDU }]);
  const [experience, setExperience] = useState<ExpRow[]>([{ ...EMPTY_EXP }]);
  const [skills, setSkills] = useState('');
  const [languages, setLanguages] = useState('');
  const [letterOrg, setLetterOrg] = useState('');
  const [letterPost, setLetterPost] = useState('');
  const [letterManager, setLetterManager] = useState('');
  const [letterWhy, setLetterWhy] = useState('');
  const [letterFit, setLetterFit] = useState('');
  const [copied, setCopied] = useState(false);

  const cvText = useMemo(
    () => buildCvText({ name, role, phone, email, address, summary, education, experience, skills, languages }),
    [name, role, phone, email, address, summary, education, experience, skills, languages],
  );

  const letterText = useMemo(() => {
    const lines: string[] = [];
    if (letterManager.trim()) lines.push(`Dear ${letterManager.trim()},`);
    else lines.push('Dear Hiring Manager,');
    lines.push('');
    lines.push(
      `I am writing to apply for the position of ${letterPost.trim() || '[post]'} at ${letterOrg.trim() || '[organisation]'}.`,
    );
    lines.push('');
    if (letterWhy.trim()) lines.push(letterWhy.trim());
    else lines.push('[Why this role interests you — one or two honest sentences.]');
    lines.push('');
    if (letterFit.trim()) lines.push(letterFit.trim());
    else lines.push('[What you bring — your most relevant skill or experience, with one concrete example.]');
    lines.push('');
    lines.push('I would welcome the chance to discuss how I can contribute. Thank you for your time and consideration.');
    lines.push('');
    lines.push('Sincerely,');
    lines.push(name.trim() || '[Your name]');
    if (phone.trim() || email.trim()) lines.push([phone.trim(), email.trim()].filter(Boolean).join(' | '));
    return lines.join('\n');
  }, [name, phone, email, letterOrg, letterPost, letterManager, letterWhy, letterFit]);

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <PageShell titleBn="সিভি ও কভার লেটার তৈরি" titleEn="CV & Cover Letter Builder" wide>
      {/* Visible breadcrumb (24 Nov 2026 SEO pass) — labels match the BreadcrumbList JSON-LD in lib/seo.ts. */}
      <Breadcrumb items={[{ label: lang === 'bn' ? 'সুযোগ হাব' : 'Opportunity Hub', to: '/opportunities' }, { label: lang === 'bn' ? 'সিভি তৈরি' : 'Build a CV' }]} />
      <style>{`@media print { body * { visibility: hidden !important; } .ev-cv-print, .ev-cv-print * { visibility: visible !important; } .ev-cv-print { position: absolute; left: 0; top: 0; width: 100%; border: none !important; } }`}</style>
      <p style={{ margin: '0 0 12px', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
        {t({
          bn: 'ফরমটি পূরণ করুন — নিচে সরাসরি প্রিভিউ দেখাবে। প্রিন্ট করলে (Save as PDF) শুধু সিভি/চিঠিটাই ছাপা হবে। আপনার তথ্য কোথাও সংরক্ষণ হয় না, ব্রাউজারের বাইরে যায় না। সিভিটি ইংরেজিতে তৈরি হয় — চাকরির আবেদনে এটাই সাধারণ।',
          en: 'Fill in the form — a live preview appears below. Printing (Save as PDF) prints only the CV or letter. Nothing is saved anywhere and nothing leaves your browser. The CV is generated in English, the norm for job applications.',
        })}
      </p>
      <p style={{ margin: '0 0 16px', fontSize: 14 }}>
        <Link to="/jobs/cv">
          {t({ bn: 'সিভি লেখার গাইড পড়ুন →', en: 'Read the CV writing guide →' })}
        </Link>
      </p>

      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        <Button variant={tab === 'cv' ? 'primary' : 'outline'} onClick={() => setTab('cv')}>
          {t({ bn: 'সিভি', en: 'CV' })}
        </Button>
        <Button variant={tab === 'letter' ? 'primary' : 'outline'} onClick={() => setTab('letter')}>
          {t({ bn: 'কভার লেটার', en: 'Cover letter' })}
        </Button>
      </div>

      {tab === 'cv' ? (
        <>
          <Card>
            <Field labelBn="নাম" labelEn="Full name" value={name} onChange={setName} placeholder="Ali Hasan Mohammed Mizan" />
            <Field labelBn="লক্ষ্য পদ" labelEn="Target role" value={role} onChange={setRole} placeholder="e.g. Assistant Teacher" />
            <Field labelBn="ফোন" labelEn="Phone" value={phone} onChange={setPhone} placeholder="01XXXXXXXXX" />
            <Field labelBn="ইমেইল" labelEn="Email" value={email} onChange={setEmail} placeholder="you@example.com" />
            <Field labelBn="ঠিকানা" labelEn="Address" value={address} onChange={setAddress} placeholder="Cox's Bazar, Bangladesh" />
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>{t({ bn: 'সংক্ষিপ্ত পরিচয় (২–৩ লাইন)', en: 'Summary (2–3 lines)' })}</label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={3}
                style={{ ...inputStyle, resize: 'vertical' }}
                placeholder={t({ bn: 'আপনি কে, কী পারেন — সৎভাবে, সংক্ষেপে।', en: 'Who you are and what you can do — honestly and briefly.' })}
              />
            </div>
            <h3 style={{ fontSize: 16, margin: '16px 0 8px' }}>{t({ bn: 'শিক্ষা', en: 'Education' })}</h3>
            {education.map((e, i) => (
              <div key={i} style={{ border: '1px solid var(--line)', borderRadius: 8, padding: 12, marginBottom: 8 }}>
                <Field labelBn="ডিগ্রি / পরীক্ষা" labelEn="Degree / exam" value={e.degree} onChange={(v) => setEducation((rows) => rows.map((r, j) => (j === i ? { ...r, degree: v } : r)))} placeholder="B.A. (Honours) in English" />
                <Field labelBn="প্রতিষ্ঠান" labelEn="Institution" value={e.institution} onChange={(v) => setEducation((rows) => rows.map((r, j) => (j === i ? { ...r, institution: v } : r)))} placeholder="National University" />
                <Field labelBn="বছর" labelEn="Year" value={e.year} onChange={(v) => setEducation((rows) => rows.map((r, j) => (j === i ? { ...r, year: v } : r)))} placeholder="2027" />
              </div>
            ))}
            {education.length < 4 ? (
              <p>
                <Button variant="outline" onClick={() => setEducation((rows) => [...rows, { ...EMPTY_EDU }])}>
                  {t({ bn: '+ শিক্ষা যোগ করুন', en: '+ Add education' })}
                </Button>
              </p>
            ) : null}
            <h3 style={{ fontSize: 16, margin: '16px 0 8px' }}>{t({ bn: 'অভিজ্ঞতা', en: 'Experience' })}</h3>
            {experience.map((e, i) => (
              <div key={i} style={{ border: '1px solid var(--line)', borderRadius: 8, padding: 12, marginBottom: 8 }}>
                <Field labelBn="পদ" labelEn="Role" value={e.role} onChange={(v) => setExperience((rows) => rows.map((r, j) => (j === i ? { ...r, role: v } : r)))} placeholder="English Teacher" />
                <Field labelBn="প্রতিষ্ঠান" labelEn="Organisation" value={e.org} onChange={(v) => setExperience((rows) => rows.map((r, j) => (j === i ? { ...r, org: v } : r)))} placeholder="Tahsinul Ummah International Madrasa" />
                <Field labelBn="সময়কাল" labelEn="Period" value={e.period} onChange={(v) => setExperience((rows) => rows.map((r, j) => (j === i ? { ...r, period: v } : r)))} placeholder="2023 – Present" />
                <div>
                  <label style={labelStyle}>{t({ bn: 'কী করতেন (১–২ লাইন)', en: 'What you did (1–2 lines)' })}</label>
                  <textarea
                    value={e.details}
                    onChange={(ev) => setExperience((rows) => rows.map((r, j) => (j === i ? { ...r, details: ev.target.value } : r)))}
                    rows={2}
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </div>
              </div>
            ))}
            {experience.length < 4 ? (
              <p>
                <Button variant="outline" onClick={() => setExperience((rows) => [...rows, { ...EMPTY_EXP }])}>
                  {t({ bn: '+ অভিজ্ঞতা যোগ করুন', en: '+ Add experience' })}
                </Button>
              </p>
            ) : null}
            <Field labelBn="দক্ষতা (কমা দিয়ে আলাদা করুন)" labelEn="Skills (comma-separated)" value={skills} onChange={setSkills} placeholder="English, MS Word, Communication" />
            <Field labelBn="ভাষা" labelEn="Languages" value={languages} onChange={setLanguages} placeholder="Bangla (native), English (fluent)" />
          </Card>
          <h3 style={{ fontSize: 17, margin: '20px 0 8px' }}>{t({ bn: 'প্রিভিউ', en: 'Preview' })}</h3>
          <CvPreview name={name} role={role} phone={phone} email={email} address={address} summary={summary} education={education} experience={experience} skills={skills} languages={languages} />
          <p style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
            <Button onClick={() => window.print()}>{t({ bn: 'প্রিন্ট / PDF হিসেবে সংরক্ষণ করুন', en: 'Print / Save as PDF' })}</Button>
            <Button variant="outline" onClick={() => void copyText(cvText)}>
              {copied ? t({ bn: 'কপি হয়েছে ✓', en: 'Copied ✓' }) : t({ bn: 'টেক্সট কপি করুন', en: 'Copy as text' })}
            </Button>
          </p>
        </>
      ) : (
        <>
          <Card>
            <Field labelBn="আপনার নাম" labelEn="Your name" value={name} onChange={setName} placeholder="Ali Hasan Mohammed Mizan" />
            <Field labelBn="প্রতিষ্ঠানের নাম" labelEn="Organisation name" value={letterOrg} onChange={setLetterOrg} placeholder="e.g. ABC School" />
            <Field labelBn="পদের নাম" labelEn="Post name" value={letterPost} onChange={setLetterPost} placeholder="e.g. Assistant Teacher (English)" />
            <Field labelBn="নিয়োগকারীর নাম (যদি জানা থাকে)" labelEn="Hiring manager name (if known)" value={letterManager} onChange={setLetterManager} placeholder="e.g. Ms. Rahman" />
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>{t({ bn: 'এই পদটি কেন চান (১–২ লাইন)', en: 'Why you want this post (1–2 lines)' })}</label>
              <textarea value={letterWhy} onChange={(e) => setLetterWhy(e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>{t({ bn: 'আপনি কী দিতে পারবেন — একটি উদাহরণসহ (১–২ লাইন)', en: 'What you bring — with one concrete example (1–2 lines)' })}</label>
              <textarea value={letterFit} onChange={(e) => setLetterFit(e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
            <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.7 }}>
              {t({
                bn: 'টিপস: কভার লেটার এক পাতার বেশি নয়; সিভির কথা হুবহু পুনরাবৃত্তি করবেন না; প্রতিটি আবেদনের জন্য প্রতিষ্ঠান ও পদের নাম বদলে নিন।',
                en: 'Tips: keep it to one page; do not repeat the CV word for word; change the organisation and post name for every application.',
              })}
            </p>
          </Card>
          <h3 style={{ fontSize: 17, margin: '20px 0 8px' }}>{t({ bn: 'প্রিভিউ', en: 'Preview' })}</h3>
          <div
            className="ev-cv-print"
            style={{ background: '#fff', color: '#111', border: '1px solid var(--border)', borderRadius: 8, padding: 20, fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}
          >
            {letterText}
          </div>
          <p style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
            <Button onClick={() => window.print()}>{t({ bn: 'প্রিন্ট / PDF হিসেবে সংরক্ষণ করুন', en: 'Print / Save as PDF' })}</Button>
            <Button variant="outline" onClick={() => void copyText(letterText)}>
              {copied ? t({ bn: 'কপি হয়েছে ✓', en: 'Copied ✓' }) : t({ bn: 'টেক্সট কপি করুন', en: 'Copy as text' })}
            </Button>
          </p>
        </>
      )}
      <AlertBox tone="info">
        {t({
          bn: 'মনে রাখবেন: সিভিতে মিথ্যা তথ্য, ভুয়া অভিজ্ঞতা বা ভুয়া সার্টিফিকেট কখনো লিখবেন না — ধরা পড়লে চাকরি যাবে, আর ভবিষ্যতের সব আবেদনও ক্ষতিগ্রস্ত হবে।',
          en: 'Remember: never put false information, fake experience or fake certificates on a CV — if caught, you lose the job and damage every future application.',
        })}
      </AlertBox>
      <p style={{ marginTop: 16 }}>
        <Link to="/opportunities">{lang === 'bn' ? '← সব সুযোগ দেখুন' : '← See all opportunities'}</Link>
      </p>
    </PageShell>
  );
}
